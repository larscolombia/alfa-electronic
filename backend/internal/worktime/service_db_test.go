package worktime

import (
	"database/sql"
	"fmt"
	"os"
	"testing"
	"time"

	_ "github.com/jackc/pgx/v5/stdlib"
	"pika.software.net.co/backend/internal/platform/database"
)

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

func testCompany(t *testing.T, db *sql.DB, name string) string {
	t.Helper()
	companyID := fmt.Sprintf("qa-wt-%s-%d", name, time.Now().UnixNano())
	t.Cleanup(func() {
		db.Exec(`DELETE FROM work_time_entries WHERE company_id = $1`, companyID)
		db.Exec(`DELETE FROM work_time_usage WHERE company_id = $1`, companyID)
		db.Exec(`DELETE FROM test_flow_rules WHERE company_id = $1`, companyID)
		db.Exec(`DELETE FROM test_batch_items WHERE company_id = $1`, companyID)
		db.Exec(`DELETE FROM test_batches WHERE company_id = $1`, companyID)
	})
	return companyID
}

func sampleEntry(id, employee, equipmentID string, start, end time.Time) EntryRequest {
	return EntryRequest{
		ID:          id,
		Employee:    employee,
		ProjectID:   "proj-1",
		EquipmentID: equipmentID,
		Task:        "Reparacion",
		EntryType:   "normal",
		Memo:        "cambio de fuente",
		StartAt:     start.Format(time.RFC3339),
		EndAt:       end.Format(time.RFC3339),
	}
}

func TestEntryCreateReadDelete(t *testing.T) {
	db := openTestDB(t)
	s := NewService(db)
	companyID := testCompany(t, db, "crud")

	start := time.Date(2026, 10, 19, 8, 0, 0, 0, time.UTC)
	created, err := s.Create(companyID, "user-1", sampleEntry("", "Ana", "EQ-1", start, start.Add(95*time.Minute)))
	if err != nil {
		t.Fatalf("Create: %v", err)
	}
	if created.UserID != "user-1" {
		t.Errorf("UserID = %q, esperaba user-1 (sale del JWT)", created.UserID)
	}
	// 95 min -> ceil(95/15)=7 cuartos -> 1.75 h
	if created.TotalHours != 1.75 {
		t.Errorf("TotalHours = %v, esperaba 1.75 (cuartos de hora)", created.TotalHours)
	}
	if created.EntryType != "normal" || created.EquipmentID != "EQ-1" {
		t.Errorf("campos no persistieron: %+v", created)
	}

	got, err := s.Get(companyID, created.ID)
	if err != nil {
		t.Fatalf("Get: %v", err)
	}
	if got.Employee != "Ana" || got.Memo != "cambio de fuente" {
		t.Errorf("Get devolvio %+v", got)
	}

	// Otro tenant no ve la entrada.
	if _, err := s.Get("otra-company", created.ID); err == nil {
		t.Error("Get de otra empresa deberia fallar")
	}

	if err := s.Delete(companyID, created.ID); err != nil {
		t.Fatalf("Delete: %v", err)
	}
	if _, err := s.Get(companyID, created.ID); err == nil {
		t.Error("Get tras Delete deberia fallar")
	}
}

func TestEntryCreateRejectsBadRange(t *testing.T) {
	db := openTestDB(t)
	s := NewService(db)
	companyID := testCompany(t, db, "rango")

	start := time.Date(2026, 10, 19, 8, 0, 0, 0, time.UTC)
	if _, err := s.Create(companyID, "user-1", sampleEntry("", "Ana", "", start, start)); err == nil {
		t.Error("rango de cero minutos deberia fallar")
	}
	if _, err := s.Create(companyID, "user-1", sampleEntry("", "Ana", "", start, start.Add(-time.Hour))); err == nil {
		t.Error("fin anterior al inicio deberia fallar")
	}
}

func TestBulkCreateIsIdempotentByID(t *testing.T) {
	db := openTestDB(t)
	s := NewService(db)
	companyID := testCompany(t, db, "bulk")

	start := time.Date(2026, 10, 19, 8, 0, 0, 0, time.UTC)
	reqs := []EntryRequest{
		sampleEntry("mig-1", "Ana", "", start, start.Add(time.Hour)),
		sampleEntry("mig-2", "Luis", "", start, start.Add(30*time.Minute)),
	}

	created, err := s.CreateBulk(companyID, "user-1", reqs)
	if err != nil {
		t.Fatalf("CreateBulk: %v", err)
	}
	if created != 2 {
		t.Errorf("created = %d, esperaba 2", created)
	}

	// Reintento (migracion repetida): no duplica.
	created2, err := s.CreateBulk(companyID, "user-1", reqs)
	if err != nil {
		t.Fatalf("CreateBulk reintento: %v", err)
	}
	if created2 != 0 {
		t.Errorf("created en reintento = %d, esperaba 0", created2)
	}

	items, err := s.List(companyID, EntryFilters{})
	if err != nil {
		t.Fatalf("List: %v", err)
	}
	if len(items) != 2 {
		t.Errorf("List devolvio %d entradas, esperaba 2", len(items))
	}

	// Filtro por empleado.
	byEmployee, err := s.List(companyID, EntryFilters{Employee: "Ana"})
	if err != nil {
		t.Fatalf("List con filtro: %v", err)
	}
	if len(byEmployee) != 1 || byEmployee[0].Employee != "Ana" {
		t.Errorf("filtro por empleado devolvio %+v", byEmployee)
	}
}

func TestWeeklySummaryAndEquipmentTotals(t *testing.T) {
	db := openTestDB(t)
	s := NewService(db)
	companyID := testCompany(t, db, "sumario")

	// Semanas ISO: lunes 12 oct 2026 = W42; lunes 19 oct 2026 = W43.
	mon := time.Date(2026, 10, 12, 8, 0, 0, 0, time.UTC)
	wed := time.Date(2026, 10, 14, 8, 0, 0, 0, time.UTC)
	nextWeek := time.Date(2026, 10, 19, 8, 0, 0, 0, time.UTC)

	if _, err := s.Create(companyID, "u1", sampleEntry("", "Ana", "EQ-9", mon, mon.Add(2*time.Hour))); err != nil {
		t.Fatalf("Create 1: %v", err)
	}
	if _, err := s.Create(companyID, "u1", sampleEntry("", "Ana", "EQ-9", wed, wed.Add(90*time.Minute))); err != nil {
		t.Fatalf("Create 2: %v", err)
	}
	if _, err := s.Create(companyID, "u1", sampleEntry("", "Luis", "", nextWeek, nextWeek.Add(time.Hour))); err != nil {
		t.Fatalf("Create 3: %v", err)
	}

	sum, err := s.Summary(companyID, "", "")
	if err != nil {
		t.Fatalf("Summary: %v", err)
	}

	// Ana W42: 2h + 1.5h = 3.5h; Luis W43: 1h.
	var anaW42, luisW43 *WeeklyEmployeeTotal
	for i := range sum.Weekly {
		row := sum.Weekly[i]
		if row.Employee == "Ana" && row.ISOWeek == "2026-W42" {
			anaW42 = &row
		}
		if row.Employee == "Luis" && row.ISOWeek == "2026-W43" {
			luisW43 = &row
		}
	}
	if anaW42 == nil || anaW42.TotalHours != 3.5 || anaW42.EntryCount != 2 || anaW42.WeekStart != "2026-10-12" {
		t.Errorf("agregado Ana W42 = %+v, esperaba 3.5h/2 entradas/2026-10-12", anaW42)
	}
	if luisW43 == nil || luisW43.TotalHours != 1 {
		t.Errorf("agregado Luis W43 = %+v, esperaba 1h", luisW43)
	}

	if len(sum.ByEquipment) != 1 || sum.ByEquipment[0].EquipmentID != "EQ-9" || sum.ByEquipment[0].TotalHours != 3.5 {
		t.Errorf("total por equipo = %+v, esperaba EQ-9 con 3.5h", sum.ByEquipment)
	}

	// Filtro de rango: solo la semana siguiente.
	filtered, err := s.Summary(companyID, "2026-10-19", "2026-10-25")
	if err != nil {
		t.Fatalf("Summary con rango: %v", err)
	}
	if len(filtered.Weekly) != 1 || filtered.Weekly[0].Employee != "Luis" {
		t.Errorf("Summary filtrado = %+v", filtered.Weekly)
	}
	if len(filtered.ByEquipment) != 0 {
		t.Errorf("Summary filtrado por equipo = %+v, esperaba vacio", filtered.ByEquipment)
	}
}

func TestUsageUpsertIsIdempotent(t *testing.T) {
	db := openTestDB(t)
	s := NewService(db)
	companyID := testCompany(t, db, "uso")

	day := DailyUsage{
		Date:               "2026-10-19",
		PlatformDurationMs: 60000,
		Pages: []PageUsage{
			{Path: "/app/dashboard", DurationMs: 40000, Visits: 3, LastVisitedAt: "2026-10-19T15:00:00Z"},
			{Path: "/app/work", DurationMs: 20000, Visits: 1, LastVisitedAt: "2026-10-19T15:05:00Z"},
		},
	}

	first, err := s.UpsertUsage(companyID, "user-1", day)
	if err != nil {
		t.Fatalf("UpsertUsage: %v", err)
	}
	if first.PlatformDurationMs != 60000 || len(first.Pages) != 2 {
		t.Errorf("primer upsert = %+v", first)
	}

	// Mismo dia, valores actualizados: reemplaza, no duplica.
	day.PlatformDurationMs = 120000
	day.Pages[0].DurationMs = 100000
	second, err := s.UpsertUsage(companyID, "user-1", day)
	if err != nil {
		t.Fatalf("UpsertUsage 2: %v", err)
	}
	if second.PlatformDurationMs != 120000 || second.Pages[0].DurationMs != 100000 || len(second.Pages) != 2 {
		t.Errorf("segundo upsert = %+v", second)
	}

	var count int
	if err := db.QueryRow(`SELECT COUNT(*) FROM work_time_usage WHERE company_id = $1`, companyID).Scan(&count); err != nil {
		t.Fatalf("count: %v", err)
	}
	if count != 1 {
		t.Errorf("filas en work_time_usage = %d, esperaba 1 (UPSERT del dia)", count)
	}

	// Dia sin actividad: registro en cero, no error.
	empty, err := s.GetUsage(companyID, "user-1", "2026-10-18")
	if err != nil {
		t.Fatalf("GetUsage dia vacio: %v", err)
	}
	if empty.PlatformDurationMs != 0 || len(empty.Pages) != 0 {
		t.Errorf("dia vacio = %+v", empty)
	}

	// Otro usuario no ve el dia del primero.
	other, err := s.GetUsage(companyID, "user-2", "2026-10-19")
	if err != nil {
		t.Fatalf("GetUsage otro usuario: %v", err)
	}
	if other.PlatformDurationMs != 0 {
		t.Errorf("otro usuario leyo telemetria ajena: %+v", other)
	}
}

func TestHolidaysSeededAndAdminUpsert(t *testing.T) {
	db := openTestDB(t)
	s := NewService(db)

	for _, year := range []int{2026, 2027} {
		items, err := s.ListHolidays("CO", year)
		if err != nil {
			t.Fatalf("ListHolidays %d: %v", year, err)
		}
		if len(items) != 18 {
			t.Errorf("festivos CO %d = %d, esperaba 18 (Ley 51)", year, len(items))
		}
	}

	// Fechas movidas clave de 2026: Reyes -> lun 12 ene; Cartagena -> lun 16 nov.
	items, _ := s.ListHolidays("CO", 2026)
	byDate := map[string]string{}
	for _, h := range items {
		byDate[h.Date] = h.Name
	}
	if byDate["2026-01-12"] != "Reyes Magos" {
		t.Errorf("2026-01-12 = %q, esperaba Reyes Magos (traslado al lunes)", byDate["2026-01-12"])
	}
	if byDate["2026-11-16"] != "Independencia de Cartagena" {
		t.Errorf("2026-11-16 = %q, esperaba Independencia de Cartagena (traslado)", byDate["2026-11-16"])
	}
	if _, ok := byDate["2026-04-03"]; !ok {
		t.Error("Viernes Santo 2026-04-03 ausente")
	}

	// Upsert admin: edita el nombre de un festivo existente (mismo country+date).
	paid := false
	edited, err := s.UpsertHoliday(HolidayRequest{
		Country: "CO", Date: "2026-01-01", Name: "Ano Nuevo (editado)", Paid: &paid,
	})
	if err != nil {
		t.Fatalf("UpsertHoliday: %v", err)
	}
	if edited.Name != "Ano Nuevo (editado)" || edited.Paid {
		t.Errorf("upsert no edito: %+v", edited)
	}
	t.Cleanup(func() {
		db.Exec(`UPDATE holidays SET name = 'Ano Nuevo', paid = TRUE WHERE country = 'CO' AND date = '2026-01-01'`)
	})

	// Alta de un festivo nuevo y su borrado.
	created, err := s.UpsertHoliday(HolidayRequest{Country: "CO", Date: "2026-08-20", Name: "Festivo de prueba"})
	if err != nil {
		t.Fatalf("UpsertHoliday nuevo: %v", err)
	}
	t.Cleanup(func() { db.Exec(`DELETE FROM holidays WHERE id = $1`, created.ID) })
	if err := s.DeleteHoliday(created.ID); err != nil {
		t.Fatalf("DeleteHoliday: %v", err)
	}
	if err := s.DeleteHoliday(created.ID); err == nil {
		t.Error("DeleteHoliday doble deberia fallar")
	}
}

func TestTestBatchesAndFlowRules(t *testing.T) {
	db := openTestDB(t)
	s := NewService(db)
	companyID := testCompany(t, db, "lotes")

	batch, err := s.UpsertTestBatch(companyID, TestBatch{
		ID:          "batch-diagnostico-reparacion",
		Name:        "Lote diagnostico -> reparacion",
		Description: "confirma repuestos",
		Active:      true,
		Questions: []TestQuestion{
			{ID: "diag-energiza", Label: "El equipo energiza?", Type: "boolean", Required: true, HelperText: "ayuda"},
			{ID: "diag-tipo", Label: "Modalidad", Type: "single-select", Required: true, Options: []TestQuestionOption{
				{ID: "banco", Label: "Banco de pruebas"},
			}},
		},
	})
	if err != nil {
		t.Fatalf("UpsertTestBatch: %v", err)
	}
	if len(batch.Questions) != 2 || batch.Questions[1].Options[0].Label != "Banco de pruebas" {
		t.Errorf("preguntas no persistieron: %+v", batch.Questions)
	}

	rule, err := s.UpsertFlowRule(companyID, TestFlowRule{
		ID: "flow-1", Name: "Paso diagnostico a reparacion",
		FromStatusID: "diagnostico", ToStatusID: "reparacion",
		BatchIDs: []string{"batch-diagnostico-reparacion", "batch-diagnostico-reparacion", ""},
		RequiredToContinue: true, TriggerMode: "always", Active: true,
	})
	if err != nil {
		t.Fatalf("UpsertFlowRule: %v", err)
	}
	if len(rule.BatchIDs) != 1 {
		t.Errorf("batchIds deberian deduplicarse: %+v", rule.BatchIDs)
	}

	state, err := s.GetTestBatchState(companyID)
	if err != nil {
		t.Fatalf("GetTestBatchState: %v", err)
	}
	if len(state.Batches) != 1 || len(state.FlowRules) != 1 {
		t.Fatalf("estado = %+v", state)
	}
	if state.Batches[0].Questions[0].ID != "diag-energiza" {
		t.Errorf("orden de preguntas perdido: %+v", state.Batches[0].Questions)
	}

	// Re-upsert del lote con una sola pregunta: reemplaza las anteriores.
	if _, err := s.UpsertTestBatch(companyID, TestBatch{
		ID: "batch-diagnostico-reparacion", Name: "Lote editado", Active: true,
		Questions: []TestQuestion{{ID: "q-unica", Label: "Unica", Type: "text"}},
	}); err != nil {
		t.Fatalf("re-upsert: %v", err)
	}
	state, _ = s.GetTestBatchState(companyID)
	if len(state.Batches[0].Questions) != 1 || state.Batches[0].Name != "Lote editado" {
		t.Errorf("re-upsert no reemplazo preguntas: %+v", state.Batches[0])
	}

	// Borrar el lote lo desvincula de la regla de flujo.
	if err := s.DeleteTestBatch(companyID, "batch-diagnostico-reparacion"); err != nil {
		t.Fatalf("DeleteTestBatch: %v", err)
	}
	state, _ = s.GetTestBatchState(companyID)
	if len(state.Batches) != 0 {
		t.Errorf("lote no se borro: %+v", state.Batches)
	}
	if len(state.FlowRules[0].BatchIDs) != 0 {
		t.Errorf("la regla conservo el lote borrado: %+v", state.FlowRules[0].BatchIDs)
	}
	var itemCount int
	db.QueryRow(`SELECT COUNT(*) FROM test_batch_items WHERE company_id = $1`, companyID).Scan(&itemCount)
	if itemCount != 0 {
		t.Errorf("quedaron %d preguntas huerfanas", itemCount)
	}

	// Otra empresa no ve los datos.
	other := testCompany(t, db, "lotes-b")
	otherState, err := s.GetTestBatchState(other)
	if err != nil {
		t.Fatalf("GetTestBatchState otra empresa: %v", err)
	}
	if len(otherState.Batches) != 0 || len(otherState.FlowRules) != 0 {
		t.Errorf("fuga entre empresas: %+v", otherState)
	}
}

func TestResolveUserIDPrefersUsersTable(t *testing.T) {
	db := openTestDB(t)
	s := NewService(db)
	companyID := testCompany(t, db, "identidad")

	// Sin fila en users: cae al email del JWT.
	if got := s.ResolveUserID(companyID, "pepe@alfa.test"); got != "pepe@alfa.test" {
		t.Errorf("ResolveUserID sin usuario = %q", got)
	}
}
