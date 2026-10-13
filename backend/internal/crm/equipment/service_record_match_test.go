package equipment

import (
	"database/sql"
	"fmt"
	"os"
	"strings"
	"testing"
	"time"

	_ "github.com/jackc/pgx/v5/stdlib"
)

const testEquipmentCompanyID = "demo-company"

func openEquipmentTestDB(t *testing.T) *sql.DB {
	t.Helper()
	if os.Getenv("RUN_DB_TESTS") == "" {
		t.Skip("set RUN_DB_TESTS=1 to run database integration tests")
	}

	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		dsn = "postgres://postgres:postgres@127.0.0.1:5432/alfa?sslmode=disable"
	}

	db, err := sql.Open("pgx", dsn)
	if err != nil {
		t.Fatalf("open test database: %v", err)
	}
	if err := db.Ping(); err != nil {
		db.Close()
		t.Fatalf("ping test database: %v", err)
	}

	var columnType string
	if err := db.QueryRow(`SELECT data_type FROM information_schema.columns WHERE table_name = 'crm_equipment_records' AND column_name = 'prospect_id';`).Scan(&columnType); err != nil {
		db.Close()
		t.Fatalf("read prospect_id column type: %v", err)
	}
	if columnType != "text" {
		db.Close()
		t.Skipf("crm_equipment_records.prospect_id es %s; la migracion a TEXT aun no se aplico", columnType)
	}

	t.Cleanup(func() { db.Close() })
	return db
}

func cleanupEquipmentRecords(t *testing.T, db *sql.DB, recordIDs ...string) {
	t.Helper()
	for _, recordID := range recordIDs {
		if _, err := db.Exec(`DELETE FROM crm_equipment_records WHERE company_id = $1 AND id = $2;`, testEquipmentCompanyID, recordID); err != nil {
			t.Logf("cleanup failed for %s: %v", recordID, err)
		}
	}
}

func TestNormalizeStoredProspectID(t *testing.T) {
	cases := []struct {
		name  string
		input string
		want  string
	}{
		{"vacio cae a 0", "", "0"},
		{"solo espacios cae a 0", "   ", "0"},
		{"uuid se conserva", "60b1066e-5847-4011-8022-231c026f7c5f", "60b1066e-5847-4011-8022-231c026f7c5f"},
		{"recepcion directa se conserva", "-9000", "-9000"},
		{"recorta espacios", "  abc-123 ", "abc-123"},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			if got := normalizeStoredProspectID(tc.input); got != tc.want {
				t.Fatalf("normalizeStoredProspectID(%q) = %q, esperaba %q", tc.input, got, tc.want)
			}
		})
	}
}

func TestNormalizeProspectIDFilter(t *testing.T) {
	cases := []struct {
		name  string
		input string
		want  string
	}{
		{"vacio sin filtro", "", ""},
		{"cero sin filtro", "0", ""},
		{"uuid filtra", "60b1066e-5847-4011-8022-231c026f7c5f", "60b1066e-5847-4011-8022-231c026f7c5f"},
		{"numerico legado filtra como texto", "60", "60"},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			if got := normalizeProspectIDFilter(tc.input); got != tc.want {
				t.Fatalf("normalizeProspectIDFilter(%q) = %q, esperaba %q", tc.input, got, tc.want)
			}
		})
	}
}

func TestBuildProspectMatchFilters(t *testing.T) {
	t.Run("sin criterios no agrega filtros", func(t *testing.T) {
		filters, args, nextArg := buildProspectMatchFilters(ListRecordsQuery{}, 2)
		if len(filters) != 0 || len(args) != 0 || nextArg != 2 {
			t.Fatalf("esperaba sin filtros, obtuvo filters=%v args=%v nextArg=%d", filters, args, nextArg)
		}
	})

	t.Run("solo prospecto genera una clausula con cast text", func(t *testing.T) {
		filters, args, nextArg := buildProspectMatchFilters(ListRecordsQuery{ProspectID: "uuid-1"}, 2)
		if len(filters) != 1 || !strings.Contains(filters[0], "prospect_id = $2::text") {
			t.Fatalf("clausula prospect_id inesperada: %v", filters)
		}
		if len(args) != 1 || args[0] != "uuid-1" || nextArg != 3 {
			t.Fatalf("args/nextArg inesperados: %v %d", args, nextArg)
		}
	})

	t.Run("prospecto mas nit y nombre generan tres clausulas independientes", func(t *testing.T) {
		filters, args, nextArg := buildProspectMatchFilters(ListRecordsQuery{
			ProspectID: "uuid-1",
			ClientNIT:  "900123",
			ClientName: "Empresa Demo",
		}, 2)
		if len(filters) != 3 || len(args) != 3 || nextArg != 5 {
			t.Fatalf("esperaba 3 clausulas, obtuvo filters=%v args=%v nextArg=%d", filters, args, nextArg)
		}
		joined := strings.Join(filters, " ")
		if !strings.Contains(joined, "prospect_id = $2::text") ||
			!strings.Contains(joined, "nit <> '' AND lower(btrim(nit)) = lower(btrim($3::text))") ||
			!strings.Contains(joined, "company_name <> '' AND lower(btrim(company_name)) = lower(btrim($4::text))") {
			t.Fatalf("clausulas inesperadas: %v", filters)
		}
	})

	t.Run("prospecto 0 no filtra por prospect_id", func(t *testing.T) {
		filters, args, _ := buildProspectMatchFilters(ListRecordsQuery{ProspectID: "0", ClientNIT: "900123"}, 2)
		if len(filters) != 1 || strings.Contains(filters[0], "prospect_id") {
			t.Fatalf("no debio incluir prospect_id: %v", filters)
		}
		if len(args) != 1 || args[0] != "900123" {
			t.Fatalf("args inesperados: %v", args)
		}
	})
}

func TestListItemsMatchesProspectAndDirectReceptions(t *testing.T) {
	db := openEquipmentTestDB(t)
	service := NewService(db, nil)

	suffix := fmt.Sprintf("%d", time.Now().UnixNano())
	prospectUUID := fmt.Sprintf("qa-prospect-%s", suffix)
	directID := fmt.Sprintf("qa-rec-direct-%s", suffix)
	linkedID := fmt.Sprintf("qa-rec-linked-%s", suffix)
	otherID := fmt.Sprintf("qa-rec-other-%s", suffix)
	t.Cleanup(func() { cleanupEquipmentRecords(t, db, directID, linkedID, otherID) })

	newItem := func(id string) []Item {
		return []Item{{
			ID:           id,
			Marca:        "QA",
			Tipo:         "HMI",
			RepairStatus: "recibido",
		}}
	}

	linked := Record{ID: linkedID, ProspectID: prospectUUID, ProspectName: "QA Prospecto", CompanyName: "QA Empresa Match", NIT: "qa-nit-" + suffix, Items: newItem("item-linked-" + suffix)}
	direct := Record{ID: directID, ProspectID: "-9000", ProspectName: "Recepción directa", CompanyName: "QA Empresa Match", NIT: "qa-nit-" + suffix, Items: newItem("item-direct-" + suffix)}
	other := Record{ID: otherID, ProspectID: "-9000", ProspectName: "Recepción directa", CompanyName: "QA Empresa Ajena", NIT: "qa-nit-otro-" + suffix, Items: newItem("item-other-" + suffix)}

	for _, record := range []Record{linked, direct, other} {
		if _, err := service.UpsertRecord(testEquipmentCompanyID, record); err != nil {
			t.Fatalf("UpsertRecord(%s) error: %v", record.ID, err)
		}
	}

	t.Run("match solo por prospect_id excluye recepciones directas", func(t *testing.T) {
		items, err := service.ListItems(testEquipmentCompanyID, ListItemsQuery{ProspectID: prospectUUID})
		if err != nil {
			t.Fatalf("ListItems error: %v", err)
		}
		ids := summaryRecordIDs(items)
		if !ids[linkedID] || ids[directID] || ids[otherID] {
			t.Fatalf("match por prospect_id inesperado: %v", ids)
		}
	})

	t.Run("match ampliado incluye recepcion directa del mismo cliente", func(t *testing.T) {
		items, err := service.ListItems(testEquipmentCompanyID, ListItemsQuery{
			ProspectID: prospectUUID,
			ClientNIT:  "qa-nit-" + suffix,
			ClientName: "QA Empresa Match",
		})
		if err != nil {
			t.Fatalf("ListItems error: %v", err)
		}
		ids := summaryRecordIDs(items)
		if !ids[linkedID] || !ids[directID] {
			t.Fatalf("match ampliado debio incluir %s y %s: %v", linkedID, directID, ids)
		}
		if ids[otherID] {
			t.Fatalf("match ampliado no debio incluir cliente ajeno %s: %v", otherID, ids)
		}
	})

	t.Run("id numerico legado no matchea uuid", func(t *testing.T) {
		items, err := service.ListItems(testEquipmentCompanyID, ListItemsQuery{ProspectID: "60"})
		if err != nil {
			t.Fatalf("ListItems error: %v", err)
		}
		if summaryRecordIDs(items)[linkedID] {
			t.Fatalf("el id numerico legado no debe matchear el UUID del prospecto")
		}
	})

	t.Run("upsert persiste prospect_id uuid como texto", func(t *testing.T) {
		stored, err := service.GetRecord(testEquipmentCompanyID, linkedID, true)
		if err != nil {
			t.Fatalf("GetRecord error: %v", err)
		}
		if stored.ProspectID != prospectUUID {
			t.Fatalf("ProspectID persistido = %q, esperaba %q", stored.ProspectID, prospectUUID)
		}
	})
}

func summaryRecordIDs(items []Summary) map[string]bool {
	ids := make(map[string]bool, len(items))
	for _, item := range items {
		ids[item.RecordID] = true
	}
	return ids
}
