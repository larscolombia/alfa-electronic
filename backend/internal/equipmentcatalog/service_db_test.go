package equipmentcatalog

import (
	"database/sql"
	"fmt"
	"os"
	"testing"
	"time"

	_ "github.com/jackc/pgx/v5/stdlib"
	"pika.software.net.co/backend/internal/platform/database"
)

// Fase 6 (ítems 1-2): los maestros de equipos persisten en Postgres por
// empresa. Corren contra la base de desarrollo (RUN_DB_TESTS=1), así cada test
// usa una empresa única y la limpia al terminar.

func openTestDB(t *testing.T) *sql.DB {
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
		t.Fatalf("abrir base de prueba: %v", err)
	}
	if err := db.Ping(); err != nil {
		db.Close()
		t.Fatalf("ping base de prueba: %v", err)
	}
	if err := database.Migrate(db); err != nil {
		db.Close()
		t.Fatalf("migrar base de prueba: %v", err)
	}
	t.Cleanup(func() { db.Close() })
	return db
}

// testCompany devuelve una empresa única y purga sus cuatro maestros al cerrar.
// DELETE físico, no soft-delete: estas tablas no tienen columna archived.
func testCompany(t *testing.T, db *sql.DB) string {
	t.Helper()
	companyID := fmt.Sprintf("qa-eqcat-%d", time.Now().UnixNano())
	t.Cleanup(func() {
		for _, table := range []string{
			"company_equipment_families",
			"company_equipment_models",
			"company_equipment_service_types",
			"company_equipment_locations",
		} {
			db.Exec(fmt.Sprintf(`DELETE FROM %s WHERE company_id = $1`, table), companyID)
		}
	})
	return companyID
}

func TestCatalogEmptyForNewCompany(t *testing.T) {
	db := openTestDB(t)
	s := NewService(db)
	companyID := testCompany(t, db)

	catalog, err := s.GetCatalog(companyID)
	if err != nil {
		t.Fatalf("GetCatalog: %v", err)
	}
	// Una empresa nueva arranca con el catálogo VACÍO: los DEFAULT_* ya no se
	// inventan, se cargan desde Config. Equipos.
	if len(catalog.Families) != 0 || len(catalog.Models) != 0 ||
		len(catalog.ServiceTypes) != 0 || len(catalog.Locations) != 0 {
		t.Errorf("empresa nueva debería tener catálogo vacío, obtuvo %+v", catalog)
	}
	// Y las listas deben serializar como [] y no como null.
	if catalog.Models == nil {
		t.Error("models es nil; el frontend espera un arreglo")
	}
}

func TestUpsertAndListModel(t *testing.T) {
	db := openTestDB(t)
	s := NewService(db)
	companyID := testCompany(t, db)

	if _, err := s.UpsertFamily(companyID, Family{ID: "fam-qa", Name: "Servomotores", Active: true}); err != nil {
		t.Fatalf("UpsertFamily: %v", err)
	}

	created, err := s.UpsertModel(companyID, Model{
		ID:           "model-qa-1",
		FamilyID:     "fam-qa",
		Brand:        "Yaskawa",
		Type:         "Servomotor",
		Series:       "SGM7J",
		IsIndustrial: true,
		Active:       true,
		Notes:        "modelo de prueba",
	})
	if err != nil {
		t.Fatalf("UpsertModel: %v", err)
	}
	if created.UpdatedAt == "" {
		t.Error("el servidor no devolvió updatedAt")
	}

	models, err := s.listModels(companyID)
	if err != nil {
		t.Fatalf("listModels: %v", err)
	}
	if len(models) != 1 {
		t.Fatalf("esperaba 1 modelo, obtuve %d", len(models))
	}
	if models[0].Brand != "Yaskawa" || models[0].Series != "SGM7J" || !models[0].IsIndustrial {
		t.Errorf("el modelo no round-tripeó: %+v", models[0])
	}

	// Upsert sobre el mismo id ACTUALIZA, no duplica.
	if _, err := s.UpsertModel(companyID, Model{
		ID: "model-qa-1", FamilyID: "fam-qa", Brand: "Yaskawa", Series: "SGM7J-08", Active: false,
	}); err != nil {
		t.Fatalf("UpsertModel (update): %v", err)
	}
	models, _ = s.listModels(companyID)
	if len(models) != 1 {
		t.Fatalf("el upsert duplicó la fila: %d modelos", len(models))
	}
	if models[0].Series != "SGM7J-08" || models[0].Active {
		t.Errorf("la actualización no se aplicó: %+v", models[0])
	}
}

func TestUpsertModelRejectsIncomplete(t *testing.T) {
	db := openTestDB(t)
	s := NewService(db)
	companyID := testCompany(t, db)

	// Sin marca ni serie sería una fila fantasma en el selector.
	if _, err := s.UpsertModel(companyID, Model{ID: "model-qa-vacio", FamilyID: "fam-qa"}); err == nil {
		t.Error("UpsertModel sin marca ni serie debería fallar")
	}

	models, _ := s.listModels(companyID)
	if len(models) != 0 {
		t.Errorf("no debe quedar ninguna fila tras el rechazo, hay %d", len(models))
	}
}

func TestUpsertNameRequired(t *testing.T) {
	db := openTestDB(t)
	s := NewService(db)
	companyID := testCompany(t, db)

	if _, err := s.UpsertFamily(companyID, Family{ID: "fam-sin-nombre"}); err == nil {
		t.Error("familia sin nombre debería fallar")
	}
	if _, err := s.UpsertServiceType(companyID, ServiceType{ID: "st-sin-nombre"}); err == nil {
		t.Error("tipo de servicio sin nombre debería fallar")
	}
	if _, err := s.UpsertLocation(companyID, Location{ID: "loc-sin-nombre"}); err == nil {
		t.Error("ubicación sin nombre debería fallar")
	}
}

func TestIDGeneradoCuandoVieneVacio(t *testing.T) {
	db := openTestDB(t)
	s := NewService(db)
	companyID := testCompany(t, db)

	saved, err := s.UpsertServiceType(companyID, ServiceType{Name: "Intercambio", Active: true})
	if err != nil {
		t.Fatalf("UpsertServiceType sin id: %v", err)
	}
	if saved.ID == "" {
		t.Fatal("el servidor no generó un id")
	}

	serviceTypes, _ := s.listServiceTypes(companyID)
	if len(serviceTypes) != 1 || serviceTypes[0].ID != saved.ID {
		t.Errorf("el id generado no persistió: %+v", serviceTypes)
	}
}

func TestDeleteRows(t *testing.T) {
	db := openTestDB(t)
	s := NewService(db)
	companyID := testCompany(t, db)

	if _, err := s.UpsertLocation(companyID, Location{ID: "loc-qa-1", Name: "Interior 1", Active: true}); err != nil {
		t.Fatalf("UpsertLocation: %v", err)
	}
	if _, err := s.UpsertLocation(companyID, Location{ID: "loc-qa-2", Name: "Estantería", Active: true}); err != nil {
		t.Fatalf("UpsertLocation 2: %v", err)
	}

	if err := s.DeleteLocation(companyID, "loc-qa-1", "loc-qa-2"); err != nil {
		t.Fatalf("DeleteLocation: %v", err)
	}
	locations, _ := s.listLocations(companyID)
	if len(locations) != 1 || locations[0].ID != "loc-qa-2" {
		t.Errorf("borrado incorrecto: %+v", locations)
	}

	// Borrar sin id debe rechazarse, no borrar todo.
	if err := s.DeleteLocation(companyID, "  ", "loc-qa-2"); err == nil {
		t.Error("DeleteLocation con id vacío debería fallar")
	}
}

func TestCatalogIsIsolatedPerCompany(t *testing.T) {
	db := openTestDB(t)
	s := NewService(db)
	companyA := testCompany(t, db)
	companyB := testCompany(t, db)

	if _, err := s.UpsertFamily(companyA, Family{ID: "fam-a", Name: "PLC", Active: true}); err != nil {
		t.Fatalf("UpsertFamily A: %v", err)
	}

	catalogA, err := s.GetCatalog(companyA)
	if err != nil {
		t.Fatalf("GetCatalog A: %v", err)
	}
	catalogB, err := s.GetCatalog(companyB)
	if err != nil {
		t.Fatalf("GetCatalog B: %v", err)
	}

	if len(catalogA.Families) != 1 {
		t.Errorf("A debería ver 1 familia, ve %d", len(catalogA.Families))
	}
	if len(catalogB.Families) != 0 {
		t.Errorf("B no debe ver el catálogo de A, ve %d familias", len(catalogB.Families))
	}
}

// TestSeedOnlyForCompaniesWithReceptions cubre la siembra condicionada de la
// migración: los DEFAULT_* sólo se replican donde ya hay recepciones que los
// referencian, para no dejar referencias colgando ni inventar catálogo.
func TestSeedOnlyForCompaniesWithReceptions(t *testing.T) {
	db := openTestDB(t)
	_ = NewService(db)

	var withRecords int
	if err := db.QueryRow(`
SELECT count(*) FROM company_equipment_models
WHERE company_id IN (SELECT DISTINCT company_id FROM crm_equipment_records);`).Scan(&withRecords); err != nil {
		t.Fatalf("contar modelos sembrados: %v", err)
	}

	var companiesWithRecords int
	if err := db.QueryRow(`SELECT count(DISTINCT company_id) FROM crm_equipment_records`).Scan(&companiesWithRecords); err != nil {
		t.Fatalf("contar empresas con recepciones: %v", err)
	}

	if companiesWithRecords == 0 {
		t.Skip("no hay recepciones en esta base; nada que sembrar")
	}
	// 3 modelos demo por cada empresa con recepciones.
	if want := companiesWithRecords * 3; withRecords != want {
		t.Errorf("modelos sembrados = %d, esperado %d (3 por cada una de %d empresas)",
			withRecords, want, companiesWithRecords)
	}

	// Y una empresa SIN recepciones no recibe catálogo inventado.
	fresh := fmt.Sprintf("qa-eqcat-fresca-%d", time.Now().UnixNano())
	t.Cleanup(func() {
		db.Exec(`DELETE FROM company_equipment_models WHERE company_id = $1`, fresh)
	})
	var seeded int
	if err := db.QueryRow(`SELECT count(*) FROM company_equipment_models WHERE company_id = $1`, fresh).Scan(&seeded); err != nil {
		t.Fatalf("contar modelos de empresa nueva: %v", err)
	}
	if seeded != 0 {
		t.Errorf("empresa sin recepciones recibió %d modelos inventados", seeded)
	}
}
