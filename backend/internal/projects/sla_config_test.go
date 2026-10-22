package projects

import (
	"database/sql"
	"errors"
	"fmt"
	"os"
	"reflect"
	"testing"
	"time"

	_ "github.com/jackc/pgx/v5/stdlib"
	"pika.software.net.co/backend/internal/platform/database"
)

// La configuracion SLA vive en Postgres (project_sla_configs), ya no en un mapa
// global del paquete: sobrevive reinicios del servicio y es compartida por todos
// los usuarios de la empresa.

func openSLATestDB(t *testing.T) *sql.DB {
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
	if err := database.Migrate(db); err != nil {
		db.Close()
		t.Fatalf("migrate test database: %v", err)
	}
	t.Cleanup(func() { db.Close() })
	return db
}

func slaTestCompany(t *testing.T, db *sql.DB, name string) string {
	t.Helper()
	companyID := fmt.Sprintf("qa-sla-%s-%d", name, time.Now().UnixNano())
	t.Cleanup(func() {
		db.Exec(`DELETE FROM project_sla_configs WHERE company_id = $1`, companyID)
	})
	return companyID
}

// La validacion ocurre antes de tocar la base de datos, por eso estos casos no
// requieren DB y corren siempre.
func TestSlaConfigRejectsInvalidPayloads(t *testing.T) {
	cases := []struct {
		name    string
		configs []SLAConfig
	}{
		{
			name:    "greenDays negativo",
			configs: []SLAConfig{{Stage: "diagnostico", GreenDays: -1, YellowDays: 1}},
		},
		{
			name:    "yellowDays negativo",
			configs: []SLAConfig{{Stage: "reparacion", GreenDays: 1, YellowDays: -2}},
		},
		{
			name:    "stage vacio",
			configs: []SLAConfig{{Stage: "", GreenDays: 1, YellowDays: 1}},
		},
		{
			name:    "stage solo espacios",
			configs: []SLAConfig{{Stage: "   ", GreenDays: 1, YellowDays: 1}},
		},
		{
			name: "un item invalido rechaza todo el lote",
			configs: []SLAConfig{
				{Stage: "diagnostico", GreenDays: 2, YellowDays: 2},
				{Stage: "listo-entrega", GreenDays: 1, YellowDays: -1},
			},
		},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			s := NewService(nil)

			err := s.UpdateSLAConfig("sla-company-validation-only", tc.configs)
			if !errors.Is(err, errSLAConfigInvalid) {
				t.Fatalf("UpdateSLAConfig error = %v, esperaba errSLAConfigInvalid", err)
			}
		})
	}
}

func TestSlaConfigReturnsDefaultWhenUnset(t *testing.T) {
	db := openSLATestDB(t)
	s := NewService(db)
	companyID := slaTestCompany(t, db, "default")

	got, err := s.GetSLAConfig(companyID)
	if err != nil {
		t.Fatalf("GetSLAConfig error inesperado: %v", err)
	}
	if !reflect.DeepEqual(got, defaultSLAConfig) {
		t.Fatalf("GetSLAConfig = %+v, esperaba la config por defecto %+v", got, defaultSLAConfig)
	}
}

func TestSlaConfigUpdatePersistsAndGetReflects(t *testing.T) {
	cases := []struct {
		name    string
		configs []SLAConfig
		want    []SLAConfig
	}{
		{
			name: "config personalizada por etapa",
			configs: []SLAConfig{
				{Stage: "diagnostico", GreenDays: 5, YellowDays: 3},
				{Stage: "reparacion", GreenDays: 7, YellowDays: 2},
			},
			want: []SLAConfig{
				{Stage: "diagnostico", GreenDays: 5, YellowDays: 3},
				{Stage: "reparacion", GreenDays: 7, YellowDays: 2},
			},
		},
		{
			name:    "dias en cero son validos",
			configs: []SLAConfig{{Stage: "garantia", GreenDays: 0, YellowDays: 0}},
			want:    []SLAConfig{{Stage: "garantia", GreenDays: 0, YellowDays: 0}},
		},
		{
			name:    "stage con espacios se normaliza",
			configs: []SLAConfig{{Stage: "  pruebas  ", GreenDays: 1, YellowDays: 1}},
			want:    []SLAConfig{{Stage: "pruebas", GreenDays: 1, YellowDays: 1}},
		},
	}

	db := openSLATestDB(t)
	s := NewService(db)

	for i, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			companyID := slaTestCompany(t, db, fmt.Sprintf("update-%d", i))

			if err := s.UpdateSLAConfig(companyID, tc.configs); err != nil {
				t.Fatalf("UpdateSLAConfig error inesperado: %v", err)
			}

			got, err := s.GetSLAConfig(companyID)
			if err != nil {
				t.Fatalf("GetSLAConfig error inesperado: %v", err)
			}
			if !reflect.DeepEqual(got, tc.want) {
				t.Fatalf("GetSLAConfig = %+v, esperaba %+v", got, tc.want)
			}
		})
	}
}

func TestSlaConfigUpdatePreservesStageOrder(t *testing.T) {
	db := openSLATestDB(t)
	s := NewService(db)
	companyID := slaTestCompany(t, db, "order")

	configs := []SLAConfig{
		{Stage: "garantia", GreenDays: 1, YellowDays: 1},
		{Stage: "diagnostico", GreenDays: 2, YellowDays: 2},
		{Stage: "reparacion", GreenDays: 3, YellowDays: 3},
	}
	if err := s.UpdateSLAConfig(companyID, configs); err != nil {
		t.Fatalf("UpdateSLAConfig error inesperado: %v", err)
	}

	got, err := s.GetSLAConfig(companyID)
	if err != nil {
		t.Fatalf("GetSLAConfig error inesperado: %v", err)
	}
	if !reflect.DeepEqual(got, configs) {
		t.Fatalf("el orden de las etapas no se conservo: %+v", got)
	}
}

func TestSlaConfigIsolationPerCompany(t *testing.T) {
	db := openSLATestDB(t)
	s := NewService(db)
	companyA := slaTestCompany(t, db, "isolated-a")
	companyB := slaTestCompany(t, db, "isolated-b")

	custom := []SLAConfig{{Stage: "diagnostico", GreenDays: 9, YellowDays: 4}}
	if err := s.UpdateSLAConfig(companyA, custom); err != nil {
		t.Fatalf("UpdateSLAConfig error inesperado: %v", err)
	}

	gotA, err := s.GetSLAConfig(companyA)
	if err != nil {
		t.Fatalf("GetSLAConfig error inesperado: %v", err)
	}
	if !reflect.DeepEqual(gotA, custom) {
		t.Fatalf("company-a GetSLAConfig = %+v, esperaba %+v", gotA, custom)
	}

	gotB, err := s.GetSLAConfig(companyB)
	if err != nil {
		t.Fatalf("GetSLAConfig error inesperado: %v", err)
	}
	if !reflect.DeepEqual(gotB, defaultSLAConfig) {
		t.Fatalf("company-b debe seguir con la config por defecto, obtuvo %+v", gotB)
	}
}

func TestSlaConfigInvalidBatchDoesNotMutateStore(t *testing.T) {
	db := openSLATestDB(t)
	s := NewService(db)
	companyID := slaTestCompany(t, db, "no-mutation")

	valid := []SLAConfig{{Stage: "diagnostico", GreenDays: 4, YellowDays: 2}}
	if err := s.UpdateSLAConfig(companyID, valid); err != nil {
		t.Fatalf("UpdateSLAConfig error inesperado: %v", err)
	}

	invalid := []SLAConfig{
		{Stage: "entregado", GreenDays: 1, YellowDays: 1},
		{Stage: "reparacion", GreenDays: -3, YellowDays: 1},
	}
	if err := s.UpdateSLAConfig(companyID, invalid); !errors.Is(err, errSLAConfigInvalid) {
		t.Fatalf("UpdateSLAConfig error = %v, esperaba errSLAConfigInvalid", err)
	}

	got, err := s.GetSLAConfig(companyID)
	if err != nil {
		t.Fatalf("GetSLAConfig error inesperado: %v", err)
	}
	if !reflect.DeepEqual(got, valid) {
		t.Fatalf("store mutado tras lote invalido: GetSLAConfig = %+v", got)
	}
}
