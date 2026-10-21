package worktime

import (
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"math"
	"math/rand"
	"strings"
	"time"
)

// Service implementa la persistencia de horas de trabajo, telemetria de uso,
// pruebas funcionales y festivos (Fase 4). Sigue el patron NewService(db) del
// resto del backend; el scoping por empresa lo aplica el handler con
// company.IDFromRequest (JWT primero).
type Service struct {
	db *sql.DB
}

func NewService(db *sql.DB) *Service {
	return &Service{db: db}
}

var (
	// ErrNotFound se traduce a 404 en el handler.
	ErrNotFound = errors.New("recurso no encontrado")
	// ErrInvalid se traduce a 400 en el handler.
	ErrInvalid = errors.New("datos invalidos")
)

var validEntryTypes = map[string]bool{
	"normal": true, "hora-extra": true, "permiso": true, "ausencia": true, "festivo": true,
}

func generateID(prefix string) string {
	return fmt.Sprintf("%s-%d-%05d", prefix, time.Now().UnixNano(), rand.Intn(100000))
}

func formatTime(t time.Time) string {
	if t.IsZero() {
		return ""
	}
	return t.UTC().Format(time.RFC3339)
}

// computeTotalHours replica accumulateQuarterHours del frontend: redondeo hacia
// arriba a cuartos de hora (1 min -> 0.25 h, 16 min -> 0.5 h).
func computeTotalHours(start, end time.Time) float64 {
	minutes := end.Sub(start).Minutes()
	if minutes <= 0 {
		return 0
	}
	return math.Ceil(minutes/15) * 0.25
}

// ResolveUserID convierte el email del JWT en el id de la tabla users. Si el
// usuario no existe (tokens antiguos, cuentas sembradas por otro medio) devuelve
// el email como identidad estable: nunca se acepta un user_id enviado por el
// cliente.
func (s *Service) ResolveUserID(companyID, email string) string {
	email = strings.TrimSpace(email)
	if email == "" {
		return ""
	}
	var id string
	err := s.db.QueryRow(
		`SELECT id FROM users WHERE LOWER(email) = LOWER($1) AND company_id = $2 LIMIT 1`,
		email, companyID,
	).Scan(&id)
	if err != nil || strings.TrimSpace(id) == "" {
		return email
	}
	return id
}

// ── Entradas de timesheet ────────────────────────────────────────────────────

func (s *Service) validateEntryRequest(req EntryRequest) (start, end time.Time, entryType string, err error) {
	start, err = time.Parse(time.RFC3339, strings.TrimSpace(req.StartAt))
	if err != nil {
		return start, end, "", fmt.Errorf("%w: startAt debe ser una fecha RFC3339", ErrInvalid)
	}
	end, err = time.Parse(time.RFC3339, strings.TrimSpace(req.EndAt))
	if err != nil {
		return start, end, "", fmt.Errorf("%w: endAt debe ser una fecha RFC3339", ErrInvalid)
	}
	if !end.After(start) {
		return start, end, "", fmt.Errorf("%w: el fin debe ser posterior al inicio", ErrInvalid)
	}
	if computeTotalHours(start, end) <= 0 {
		return start, end, "", fmt.Errorf("%w: el rango de tiempo no es valido", ErrInvalid)
	}
	entryType = strings.TrimSpace(req.EntryType)
	if entryType == "" {
		entryType = "normal"
	}
	if !validEntryTypes[entryType] {
		return start, end, "", fmt.Errorf("%w: entryType desconocido %q", ErrInvalid, entryType)
	}
	return start, end, entryType, nil
}

// Create inserta una entrada. userID viene del JWT (jamás del cuerpo). Si el
// cliente envia id (migracion unica desde localStorage) y ya existe en la misma
// empresa, devuelve la fila existente sin duplicar.
func (s *Service) Create(companyID, userID string, req EntryRequest) (WorkTimeEntry, error) {
	start, end, entryType, err := s.validateEntryRequest(req)
	if err != nil {
		return WorkTimeEntry{}, err
	}

	id := strings.TrimSpace(req.ID)
	if id == "" {
		id = generateID("wte")
	}
	totalHours := computeTotalHours(start, end)
	createdAt := time.Now().UTC()

	_, err = s.db.Exec(`
		INSERT INTO work_time_entries
			(id, company_id, user_id, employee, project_id, equipment_id, task, entry_type, memo, start_at, end_at, total_hours, created_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
		ON CONFLICT (id) DO NOTHING`,
		id, companyID, userID,
		strings.TrimSpace(req.Employee), strings.TrimSpace(req.ProjectID), strings.TrimSpace(req.EquipmentID),
		strings.TrimSpace(req.Task), entryType, strings.TrimSpace(req.Memo),
		start, end, totalHours, createdAt,
	)
	if err != nil {
		return WorkTimeEntry{}, fmt.Errorf("crear entrada de horas: %w", err)
	}

	entry, err := s.Get(companyID, id)
	if err != nil {
		// Conflicto de id con otra empresa: reintentar con id propio.
		if errors.Is(err, ErrNotFound) && strings.TrimSpace(req.ID) != "" {
			req.ID = ""
			return s.Create(companyID, userID, req)
		}
		return WorkTimeEntry{}, err
	}
	return entry, nil
}

// CreateBulk inserta varias entradas (migracion unica desde localStorage) y
// devuelve cuantas se crearon realmente; las que ya existian no se duplican.
func (s *Service) CreateBulk(companyID, userID string, reqs []EntryRequest) (int, error) {
	created := 0
	for _, req := range reqs {
		start, end, entryType, err := s.validateEntryRequest(req)
		if err != nil {
			// Una entrada local corrupta no puede tumbar toda la migracion;
			// se reporta como no creada y el cliente conserva su localStorage.
			return created, fmt.Errorf("%w: entrada %q: %v", ErrInvalid, req.ID, err)
		}
		id := strings.TrimSpace(req.ID)
		if id == "" {
			id = generateID("wte")
		}
		res, err := s.db.Exec(`
			INSERT INTO work_time_entries
				(id, company_id, user_id, employee, project_id, equipment_id, task, entry_type, memo, start_at, end_at, total_hours, created_at)
			VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
			ON CONFLICT (id) DO NOTHING`,
			id, companyID, userID,
			strings.TrimSpace(req.Employee), strings.TrimSpace(req.ProjectID), strings.TrimSpace(req.EquipmentID),
			strings.TrimSpace(req.Task), entryType, strings.TrimSpace(req.Memo),
			start, end, computeTotalHours(start, end), time.Now().UTC(),
		)
		if err != nil {
			return created, fmt.Errorf("crear entrada %s: %w", id, err)
		}
		if n, _ := res.RowsAffected(); n > 0 {
			created++
		}
	}
	return created, nil
}

func (s *Service) Get(companyID, id string) (WorkTimeEntry, error) {
	row := s.db.QueryRow(`
		SELECT id, user_id, employee, project_id, equipment_id, task, entry_type, memo,
		       start_at, end_at, total_hours::float8, created_at
		FROM work_time_entries
		WHERE id = $1 AND company_id = $2`, id, companyID)

	var e WorkTimeEntry
	var start, end, createdAt time.Time
	err := row.Scan(&e.ID, &e.UserID, &e.Employee, &e.ProjectID, &e.EquipmentID, &e.Task, &e.EntryType, &e.Memo,
		&start, &end, &e.TotalHours, &createdAt)
	if errors.Is(err, sql.ErrNoRows) {
		return WorkTimeEntry{}, fmt.Errorf("%w: entrada de horas %s", ErrNotFound, id)
	}
	if err != nil {
		return WorkTimeEntry{}, fmt.Errorf("leer entrada de horas: %w", err)
	}
	e.StartAt = formatTime(start)
	e.EndAt = formatTime(end)
	e.CreatedAt = formatTime(createdAt)
	return e, nil
}

// List devuelve las entradas de la empresa, mas recientes primero.
func (s *Service) List(companyID string, f EntryFilters) ([]WorkTimeEntry, error) {
	query := `
		SELECT id, user_id, employee, project_id, equipment_id, task, entry_type, memo,
		       start_at, end_at, total_hours::float8, created_at
		FROM work_time_entries
		WHERE company_id = $1`
	args := []any{companyID}

	if v := strings.TrimSpace(f.Employee); v != "" {
		args = append(args, v)
		query += fmt.Sprintf(" AND employee = $%d", len(args))
	}
	if v := strings.TrimSpace(f.EquipmentID); v != "" {
		args = append(args, v)
		query += fmt.Sprintf(" AND equipment_id = $%d", len(args))
	}
	if v := strings.TrimSpace(f.ProjectID); v != "" {
		args = append(args, v)
		query += fmt.Sprintf(" AND project_id = $%d", len(args))
	}
	if v, ok := parseFilterDate(f.From, false); ok {
		args = append(args, v)
		query += fmt.Sprintf(" AND start_at >= $%d", len(args))
	}
	if v, ok := parseFilterDate(f.To, true); ok {
		args = append(args, v)
		query += fmt.Sprintf(" AND start_at <= $%d", len(args))
	}
	query += " ORDER BY start_at DESC, created_at DESC"

	rows, err := s.db.Query(query, args...)
	if err != nil {
		return nil, fmt.Errorf("listar entradas de horas: %w", err)
	}
	defer rows.Close()

	entries := make([]WorkTimeEntry, 0, 64)
	for rows.Next() {
		var e WorkTimeEntry
		var start, end, createdAt time.Time
		if err := rows.Scan(&e.ID, &e.UserID, &e.Employee, &e.ProjectID, &e.EquipmentID, &e.Task, &e.EntryType, &e.Memo,
			&start, &end, &e.TotalHours, &createdAt); err != nil {
			return nil, fmt.Errorf("leer fila de entrada de horas: %w", err)
		}
		e.StartAt = formatTime(start)
		e.EndAt = formatTime(end)
		e.CreatedAt = formatTime(createdAt)
		entries = append(entries, e)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterar entradas de horas: %w", err)
	}
	return entries, nil
}

// parseFilterDate acepta RFC3339 o fecha sola. Con fecha sola y endOfDay=true
// devuelve el final del dia inclusivo (23:59:59.999...).
func parseFilterDate(value string, endOfDay bool) (time.Time, bool) {
	value = strings.TrimSpace(value)
	if value == "" {
		return time.Time{}, false
	}
	if t, err := time.Parse(time.RFC3339, value); err == nil {
		return t, true
	}
	t, err := time.Parse("2006-01-02", value)
	if err != nil {
		return time.Time{}, false
	}
	if endOfDay {
		t = t.Add(24*time.Hour - time.Millisecond)
	}
	return t, true
}

func (s *Service) Update(companyID, id string, req EntryRequest) (WorkTimeEntry, error) {
	start, end, entryType, err := s.validateEntryRequest(req)
	if err != nil {
		return WorkTimeEntry{}, err
	}

	res, err := s.db.Exec(`
		UPDATE work_time_entries
		SET employee = $3, project_id = $4, equipment_id = $5, task = $6, entry_type = $7,
		    memo = $8, start_at = $9, end_at = $10, total_hours = $11
		WHERE id = $1 AND company_id = $2`,
		id, companyID,
		strings.TrimSpace(req.Employee), strings.TrimSpace(req.ProjectID), strings.TrimSpace(req.EquipmentID),
		strings.TrimSpace(req.Task), entryType, strings.TrimSpace(req.Memo),
		start, end, computeTotalHours(start, end),
	)
	if err != nil {
		return WorkTimeEntry{}, fmt.Errorf("actualizar entrada de horas: %w", err)
	}
	if n, _ := res.RowsAffected(); n == 0 {
		return WorkTimeEntry{}, fmt.Errorf("%w: entrada de horas %s", ErrNotFound, id)
	}
	return s.Get(companyID, id)
}

func (s *Service) Delete(companyID, id string) error {
	res, err := s.db.Exec(`DELETE FROM work_time_entries WHERE id = $1 AND company_id = $2`, id, companyID)
	if err != nil {
		return fmt.Errorf("borrar entrada de horas: %w", err)
	}
	if n, _ := res.RowsAffected(); n == 0 {
		return fmt.Errorf("%w: entrada de horas %s", ErrNotFound, id)
	}
	return nil
}

// ── Agregados ────────────────────────────────────────────────────────────────

// Summary agrega horas por empleado+semana ISO y por equipo. from/to son
// opcionales (fecha o RFC3339) y filtran sobre start_at.
func (s *Service) Summary(companyID string, from, to string) (SummaryResponse, error) {
	where := "WHERE company_id = $1"
	args := []any{companyID}
	if v, ok := parseFilterDate(from, false); ok {
		args = append(args, v)
		where += fmt.Sprintf(" AND start_at >= $%d", len(args))
	}
	if v, ok := parseFilterDate(to, true); ok {
		args = append(args, v)
		where += fmt.Sprintf(" AND start_at <= $%d", len(args))
	}

	weekly := make([]WeeklyEmployeeTotal, 0, 32)
	rows, err := s.db.Query(`
		SELECT employee,
		       date_trunc('week', start_at) AS week_start,
		       to_char(date_trunc('week', start_at), 'IYYY-"W"IW') AS iso_week,
		       SUM(total_hours)::float8,
		       COUNT(*)::int
		FROM work_time_entries `+where+`
		GROUP BY employee, week_start, iso_week
		ORDER BY week_start DESC, employee ASC`, args...)
	if err != nil {
		return SummaryResponse{}, fmt.Errorf("agregar horas semanales: %w", err)
	}
	defer rows.Close()
	for rows.Next() {
		var w WeeklyEmployeeTotal
		var weekStart time.Time
		if err := rows.Scan(&w.Employee, &weekStart, &w.ISOWeek, &w.TotalHours, &w.EntryCount); err != nil {
			return SummaryResponse{}, fmt.Errorf("leer agregado semanal: %w", err)
		}
		w.WeekStart = weekStart.UTC().Format("2006-01-02")
		w.TotalHours = math.Round(w.TotalHours*100) / 100
		weekly = append(weekly, w)
	}
	if err := rows.Err(); err != nil {
		return SummaryResponse{}, fmt.Errorf("iterar agregado semanal: %w", err)
	}

	byEquipment := make([]EquipmentTotal, 0, 16)
	rows2, err := s.db.Query(`
		SELECT equipment_id, SUM(total_hours)::float8, COUNT(*)::int
		FROM work_time_entries `+where+` AND equipment_id <> ''
		GROUP BY equipment_id
		ORDER BY SUM(total_hours) DESC`, args...)
	if err != nil {
		return SummaryResponse{}, fmt.Errorf("agregar horas por equipo: %w", err)
	}
	defer rows2.Close()
	for rows2.Next() {
		var t EquipmentTotal
		if err := rows2.Scan(&t.EquipmentID, &t.TotalHours, &t.EntryCount); err != nil {
			return SummaryResponse{}, fmt.Errorf("leer agregado por equipo: %w", err)
		}
		t.TotalHours = math.Round(t.TotalHours*100) / 100
		byEquipment = append(byEquipment, t)
	}
	if err := rows2.Err(); err != nil {
		return SummaryResponse{}, fmt.Errorf("iterar agregado por equipo: %w", err)
	}

	return SummaryResponse{Weekly: weekly, ByEquipment: byEquipment}, nil
}

// ── Telemetria de uso diario ─────────────────────────────────────────────────

// UpsertUsage reemplaza el agregado del dia (company, user, date). Es un UPSERT
// del dia completo, no una fila por visita.
func (s *Service) UpsertUsage(companyID, userID string, u DailyUsage) (DailyUsage, error) {
	date, err := time.Parse("2006-01-02", strings.TrimSpace(u.Date))
	if err != nil {
		return DailyUsage{}, fmt.Errorf("%w: date debe ser YYYY-MM-DD", ErrInvalid)
	}
	if u.PlatformDurationMs < 0 {
		return DailyUsage{}, fmt.Errorf("%w: platformDurationMs negativo", ErrInvalid)
	}
	if u.Pages == nil {
		u.Pages = []PageUsage{}
	}
	pagesJSON, err := json.Marshal(u.Pages)
	if err != nil {
		return DailyUsage{}, fmt.Errorf("%w: pages invalido", ErrInvalid)
	}

	_, err = s.db.Exec(`
		INSERT INTO work_time_usage (company_id, user_id, date, platform_duration_ms, pages_json, updated_at)
		VALUES ($1, $2, $3, $4, $5::jsonb, NOW())
		ON CONFLICT (company_id, user_id, date)
		DO UPDATE SET platform_duration_ms = EXCLUDED.platform_duration_ms,
		              pages_json = EXCLUDED.pages_json,
		              updated_at = NOW()`,
		companyID, userID, date, u.PlatformDurationMs, string(pagesJSON),
	)
	if err != nil {
		return DailyUsage{}, fmt.Errorf("guardar uso diario: %w", err)
	}
	return s.GetUsage(companyID, userID, u.Date)
}

// GetUsage devuelve el agregado del dia; si no existe devuelve un registro en
// cero (no es error: un dia sin actividad es un estado valido).
func (s *Service) GetUsage(companyID, userID, dateStr string) (DailyUsage, error) {
	dateStr = strings.TrimSpace(dateStr)
	if dateStr == "" {
		dateStr = time.Now().UTC().Format("2006-01-02")
	}
	date, err := time.Parse("2006-01-02", dateStr)
	if err != nil {
		return DailyUsage{}, fmt.Errorf("%w: date debe ser YYYY-MM-DD", ErrInvalid)
	}

	empty := DailyUsage{Date: dateStr, UserID: userID, Pages: []PageUsage{}}
	row := s.db.QueryRow(`
		SELECT platform_duration_ms, pages_json, updated_at
		FROM work_time_usage
		WHERE company_id = $1 AND user_id = $2 AND date = $3`,
		companyID, userID, date)

	var pagesJSON string
	var updatedAt time.Time
	err = row.Scan(&empty.PlatformDurationMs, &pagesJSON, &updatedAt)
	if errors.Is(err, sql.ErrNoRows) {
		return empty, nil
	}
	if err != nil {
		return DailyUsage{}, fmt.Errorf("leer uso diario: %w", err)
	}
	empty.UpdatedAt = formatTime(updatedAt)
	if pagesJSON != "" {
		var pages []PageUsage
		if err := json.Unmarshal([]byte(pagesJSON), &pages); err != nil {
			return DailyUsage{}, fmt.Errorf("leer pages_json: %w", err)
		}
		if pages != nil {
			empty.Pages = pages
		}
	}
	return empty, nil
}

// ── Festivos ─────────────────────────────────────────────────────────────────

func (s *Service) ListHolidays(country string, year int) ([]Holiday, error) {
	country = strings.ToUpper(strings.TrimSpace(country))
	if country == "" {
		country = "CO"
	}
	if year <= 0 {
		year = time.Now().UTC().Year()
	}

	rows, err := s.db.Query(`
		SELECT id, country, date, name, paid
		FROM holidays
		WHERE country = $1 AND date >= make_date($2, 1, 1) AND date <= make_date($2, 12, 31)
		ORDER BY date ASC`, country, year)
	if err != nil {
		return nil, fmt.Errorf("listar festivos: %w", err)
	}
	defer rows.Close()

	holidays := make([]Holiday, 0, 20)
	for rows.Next() {
		var h Holiday
		var d time.Time
		if err := rows.Scan(&h.ID, &h.Country, &d, &h.Name, &h.Paid); err != nil {
			return nil, fmt.Errorf("leer festivo: %w", err)
		}
		h.Date = d.Format("2006-01-02")
		holidays = append(holidays, h)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterar festivos: %w", err)
	}
	return holidays, nil
}

// UpsertHoliday crea o edita un festivo. El conflicto se resuelve por
// (country, date), que es la unicidad real del calendario.
func (s *Service) UpsertHoliday(req HolidayRequest) (Holiday, error) {
	date, err := time.Parse("2006-01-02", strings.TrimSpace(req.Date))
	if err != nil {
		return Holiday{}, fmt.Errorf("%w: date debe ser YYYY-MM-DD", ErrInvalid)
	}
	name := strings.TrimSpace(req.Name)
	if name == "" {
		return Holiday{}, fmt.Errorf("%w: name es obligatorio", ErrInvalid)
	}
	country := strings.ToUpper(strings.TrimSpace(req.Country))
	if country == "" {
		country = "CO"
	}
	paid := true
	if req.Paid != nil {
		paid = *req.Paid
	}
	id := strings.TrimSpace(req.ID)
	if id == "" {
		id = fmt.Sprintf("hol-%s-%s", strings.ToLower(country), date.Format("2006-01-02"))
	}

	var out Holiday
	var outDate time.Time
	err = s.db.QueryRow(`
		INSERT INTO holidays (id, country, date, name, paid)
		VALUES ($1, $2, $3, $4, $5)
		ON CONFLICT (country, date)
		DO UPDATE SET name = EXCLUDED.name, paid = EXCLUDED.paid
		RETURNING id, country, date, name, paid`,
		id, country, date, name, paid,
	).Scan(&out.ID, &out.Country, &outDate, &out.Name, &out.Paid)
	if err != nil {
		return Holiday{}, fmt.Errorf("guardar festivo: %w", err)
	}
	out.Date = outDate.Format("2006-01-02")
	return out, nil
}

func (s *Service) DeleteHoliday(id string) error {
	res, err := s.db.Exec(`DELETE FROM holidays WHERE id = $1`, id)
	if err != nil {
		return fmt.Errorf("borrar festivo: %w", err)
	}
	if n, _ := res.RowsAffected(); n == 0 {
		return fmt.Errorf("%w: festivo %s", ErrNotFound, id)
	}
	return nil
}
