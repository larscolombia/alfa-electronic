package database

// Fase 4: horas de trabajo (timesheet), telemetria de uso de la plataforma,
// pruebas funcionales (lotes de preguntas) y festivos de Colombia.
//
// Todo el SQL es idempotente (CREATE TABLE IF NOT EXISTS / ON CONFLICT DO
// NOTHING) porque Migrate() corre en cada arranque.
//
// Notas de modelado:
//   - work_time_entries lleva entry_type (normal/hora-extra/permiso/ausencia/
//     festivo): el timesheet del frontend ya guarda ese campo por entrada y se
//     conservo al migrar a servidor.
//   - work_time_usage es UN agregado por (empresa, usuario, dia), no una fila
//     por visita: la telemetria se flusha cada 15 s y hace UPSERT del dia.
//   - test_flow_rules acompana a test_batches/test_batch_items: el estado que
//     guardaba work-test-batch.service.ts en localStorage incluye las reglas de
//     flujo entre estados del kanban, no solo los lotes de preguntas.
//   - holidays lleva paid (booleano) porque la UI de RRHH ya distingue festivo
//     pago / no pago.
func migrationStatementsWorktime() []string {
	return []string{
		// ── Timesheet ────────────────────────────────────────────────────────
		`CREATE TABLE IF NOT EXISTS work_time_entries (
			id TEXT PRIMARY KEY,
			company_id TEXT NOT NULL,
			user_id TEXT NOT NULL DEFAULT '',
			employee TEXT NOT NULL DEFAULT '',
			project_id TEXT NOT NULL DEFAULT '',
			equipment_id TEXT NOT NULL DEFAULT '',
			task TEXT NOT NULL DEFAULT '',
			entry_type TEXT NOT NULL DEFAULT 'normal',
			memo TEXT NOT NULL DEFAULT '',
			start_at TIMESTAMPTZ NOT NULL,
			end_at TIMESTAMPTZ NOT NULL,
			total_hours NUMERIC(10,2) NOT NULL DEFAULT 0,
			created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
		);`,
		`CREATE INDEX IF NOT EXISTS idx_work_time_entries_company_employee_start
			ON work_time_entries (company_id, employee, start_at);`,
		`CREATE INDEX IF NOT EXISTS idx_work_time_entries_company_equipment
			ON work_time_entries (company_id, equipment_id);`,

		// ── Telemetria de uso (agregado diario por usuario) ─────────────────
		`CREATE TABLE IF NOT EXISTS work_time_usage (
			company_id TEXT NOT NULL,
			user_id TEXT NOT NULL DEFAULT '',
			date DATE NOT NULL,
			platform_duration_ms BIGINT NOT NULL DEFAULT 0,
			pages_json JSONB NOT NULL DEFAULT '[]'::jsonb,
			updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
			PRIMARY KEY (company_id, user_id, date)
		);`,

		// ── Pruebas funcionales (lotes + reglas de flujo) ───────────────────
		// PK compuesta (company_id, id): los lotes semilla usan ids fijos
		// ("batch-diagnostico-reparacion") que se repiten entre empresas.
		`CREATE TABLE IF NOT EXISTS test_batches (
			company_id TEXT NOT NULL,
			id TEXT NOT NULL,
			name TEXT NOT NULL DEFAULT '',
			description TEXT NOT NULL DEFAULT '',
			active BOOLEAN NOT NULL DEFAULT TRUE,
			updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
			PRIMARY KEY (company_id, id)
		);`,
		`CREATE TABLE IF NOT EXISTS test_batch_items (
			company_id TEXT NOT NULL,
			id TEXT NOT NULL,
			batch_id TEXT NOT NULL,
			label TEXT NOT NULL DEFAULT '',
			type TEXT NOT NULL DEFAULT 'text',
			required BOOLEAN NOT NULL DEFAULT FALSE,
			helper_text TEXT NOT NULL DEFAULT '',
			options_json JSONB NOT NULL DEFAULT '[]'::jsonb,
			position INTEGER NOT NULL DEFAULT 0,
			PRIMARY KEY (company_id, id),
			FOREIGN KEY (company_id, batch_id) REFERENCES test_batches (company_id, id) ON DELETE CASCADE
		);`,
		`CREATE INDEX IF NOT EXISTS idx_test_batch_items_batch
			ON test_batch_items (company_id, batch_id, position);`,
		`CREATE TABLE IF NOT EXISTS test_flow_rules (
			company_id TEXT NOT NULL,
			id TEXT NOT NULL,
			name TEXT NOT NULL DEFAULT '',
			from_status_id TEXT NOT NULL DEFAULT '',
			to_status_id TEXT NOT NULL DEFAULT '',
			batch_ids_json JSONB NOT NULL DEFAULT '[]'::jsonb,
			required_to_continue BOOLEAN NOT NULL DEFAULT FALSE,
			trigger_mode TEXT NOT NULL DEFAULT 'always',
			active BOOLEAN NOT NULL DEFAULT TRUE,
			updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
			PRIMARY KEY (company_id, id)
		);`,

		// ── Festivos ─────────────────────────────────────────────────────────
		`CREATE TABLE IF NOT EXISTS holidays (
			id TEXT PRIMARY KEY,
			country TEXT NOT NULL DEFAULT 'CO',
			date DATE NOT NULL,
			name TEXT NOT NULL,
			paid BOOLEAN NOT NULL DEFAULT TRUE,
			UNIQUE (country, date)
		);`,

		// Festivos de Colombia 2026: tabla de la Ley 51 de 1983 ("ley de
		// puentes") con los traslados al lunes siguiente ya aplicados. Los cinco
		// festivos fijos (1 ene, 1 may, 7 ago, 8 dic, 25 dic) no se trasladan;
		// Jueves/Viernes Santo siguen a la Semana Santa (Pascua 2026: 5 abr).
		// ON CONFLICT DO NOTHING: la siembra es idempotente y no pisa festivos
		// editados por el administrador.
		`INSERT INTO holidays (id, country, date, name, paid) VALUES
			('hol-co-2026-01-01', 'CO', '2026-01-01', 'Ano Nuevo', TRUE),
			('hol-co-2026-01-12', 'CO', '2026-01-12', 'Reyes Magos', TRUE),
			('hol-co-2026-03-23', 'CO', '2026-03-23', 'San Jose', TRUE),
			('hol-co-2026-04-02', 'CO', '2026-04-02', 'Jueves Santo', TRUE),
			('hol-co-2026-04-03', 'CO', '2026-04-03', 'Viernes Santo', TRUE),
			('hol-co-2026-05-01', 'CO', '2026-05-01', 'Dia del Trabajo', TRUE),
			('hol-co-2026-05-18', 'CO', '2026-05-18', 'Ascension del Senor', TRUE),
			('hol-co-2026-06-08', 'CO', '2026-06-08', 'Corpus Christi', TRUE),
			('hol-co-2026-06-15', 'CO', '2026-06-15', 'Sagrado Corazon', TRUE),
			('hol-co-2026-06-29', 'CO', '2026-06-29', 'San Pedro y San Pablo', TRUE),
			('hol-co-2026-07-20', 'CO', '2026-07-20', 'Grito de Independencia', TRUE),
			('hol-co-2026-08-07', 'CO', '2026-08-07', 'Batalla de Boyaca', TRUE),
			('hol-co-2026-08-17', 'CO', '2026-08-17', 'Asuncion de la Virgen', TRUE),
			('hol-co-2026-10-12', 'CO', '2026-10-12', 'Dia de la Raza', TRUE),
			('hol-co-2026-11-02', 'CO', '2026-11-02', 'Todos los Santos', TRUE),
			('hol-co-2026-11-16', 'CO', '2026-11-16', 'Independencia de Cartagena', TRUE),
			('hol-co-2026-12-08', 'CO', '2026-12-08', 'Inmaculada Concepcion', TRUE),
			('hol-co-2026-12-25', 'CO', '2026-12-25', 'Navidad', TRUE)
			ON CONFLICT (country, date) DO NOTHING;`,

		// Festivos de Colombia 2027: misma Ley 51 con traslados (Pascua 2027:
		// 28 mar, por eso Semana Santa cae en marzo).
		`INSERT INTO holidays (id, country, date, name, paid) VALUES
			('hol-co-2027-01-01', 'CO', '2027-01-01', 'Ano Nuevo', TRUE),
			('hol-co-2027-01-11', 'CO', '2027-01-11', 'Reyes Magos', TRUE),
			('hol-co-2027-03-22', 'CO', '2027-03-22', 'San Jose', TRUE),
			('hol-co-2027-03-25', 'CO', '2027-03-25', 'Jueves Santo', TRUE),
			('hol-co-2027-03-26', 'CO', '2027-03-26', 'Viernes Santo', TRUE),
			('hol-co-2027-05-01', 'CO', '2027-05-01', 'Dia del Trabajo', TRUE),
			('hol-co-2027-05-10', 'CO', '2027-05-10', 'Ascension del Senor', TRUE),
			('hol-co-2027-05-31', 'CO', '2027-05-31', 'Corpus Christi', TRUE),
			('hol-co-2027-06-07', 'CO', '2027-06-07', 'Sagrado Corazon', TRUE),
			('hol-co-2027-07-05', 'CO', '2027-07-05', 'San Pedro y San Pablo', TRUE),
			('hol-co-2027-07-20', 'CO', '2027-07-20', 'Grito de Independencia', TRUE),
			('hol-co-2027-08-07', 'CO', '2027-08-07', 'Batalla de Boyaca', TRUE),
			('hol-co-2027-08-16', 'CO', '2027-08-16', 'Asuncion de la Virgen', TRUE),
			('hol-co-2027-10-18', 'CO', '2027-10-18', 'Dia de la Raza', TRUE),
			('hol-co-2027-11-01', 'CO', '2027-11-01', 'Todos los Santos', TRUE),
			('hol-co-2027-11-15', 'CO', '2027-11-15', 'Independencia de Cartagena', TRUE),
			('hol-co-2027-12-08', 'CO', '2027-12-08', 'Inmaculada Concepcion', TRUE),
			('hol-co-2027-12-25', 'CO', '2027-12-25', 'Navidad', TRUE)
			ON CONFLICT (country, date) DO NOTHING;`,
	}
}
