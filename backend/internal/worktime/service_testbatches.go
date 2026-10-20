package worktime

import (
	"encoding/json"
	"fmt"
	"strings"
	"time"
)

// ── Pruebas funcionales: lotes de preguntas y reglas de flujo ────────────────
//
// Modela exactamente la forma que work-test-batch.service.ts guardaba en
// localStorage['lars.work.test-batches.v2']: { batches, flowRules }.

func validQuestionType(value string) string {
	switch strings.TrimSpace(value) {
	case "boolean", "number", "single-select", "text":
		return strings.TrimSpace(value)
	default:
		return "text"
	}
}

func validTriggerMode(value string) string {
	if strings.TrimSpace(value) == "only-high-priority" {
		return "only-high-priority"
	}
	return "always"
}

// GetTestBatchState devuelve lotes (con sus preguntas) y reglas de flujo.
func (s *Service) GetTestBatchState(companyID string) (TestBatchState, error) {
	batches, err := s.listBatches(companyID)
	if err != nil {
		return TestBatchState{}, err
	}
	rules, err := s.listFlowRules(companyID)
	if err != nil {
		return TestBatchState{}, err
	}
	return TestBatchState{Batches: batches, FlowRules: rules}, nil
}

func (s *Service) listBatches(companyID string) ([]TestBatch, error) {
	rows, err := s.db.Query(`
		SELECT id, name, description, active, updated_at
		FROM test_batches
		WHERE company_id = $1
		ORDER BY name ASC`, companyID)
	if err != nil {
		return nil, fmt.Errorf("listar lotes de prueba: %w", err)
	}
	defer rows.Close()

	batches := make([]TestBatch, 0, 8)
	for rows.Next() {
		var b TestBatch
		var updatedAt time.Time
		if err := rows.Scan(&b.ID, &b.Name, &b.Description, &b.Active, &updatedAt); err != nil {
			return nil, fmt.Errorf("leer lote de prueba: %w", err)
		}
		b.UpdatedAt = formatTime(updatedAt)
		b.Questions = []TestQuestion{}
		batches = append(batches, b)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterar lotes de prueba: %w", err)
	}

	if len(batches) == 0 {
		return batches, nil
	}

	qRows, err := s.db.Query(`
		SELECT batch_id, id, label, type, required, helper_text, options_json
		FROM test_batch_items
		WHERE company_id = $1
		ORDER BY position ASC, id ASC`, companyID)
	if err != nil {
		return nil, fmt.Errorf("listar preguntas de prueba: %w", err)
	}
	defer qRows.Close()

	byBatch := make(map[string][]TestQuestion, len(batches))
	for qRows.Next() {
		var batchID, optionsJSON string
		var q TestQuestion
		if err := qRows.Scan(&batchID, &q.ID, &q.Label, &q.Type, &q.Required, &q.HelperText, &optionsJSON); err != nil {
			return nil, fmt.Errorf("leer pregunta de prueba: %w", err)
		}
		if optionsJSON != "" && optionsJSON != "[]" {
			var options []TestQuestionOption
			if err := json.Unmarshal([]byte(optionsJSON), &options); err != nil {
				return nil, fmt.Errorf("leer options_json: %w", err)
			}
			q.Options = options
		}
		byBatch[batchID] = append(byBatch[batchID], q)
	}
	if err := qRows.Err(); err != nil {
		return nil, fmt.Errorf("iterar preguntas de prueba: %w", err)
	}

	for i := range batches {
		if questions, ok := byBatch[batches[i].ID]; ok {
			batches[i].Questions = questions
		}
	}
	return batches, nil
}

func (s *Service) listFlowRules(companyID string) ([]TestFlowRule, error) {
	rows, err := s.db.Query(`
		SELECT id, name, from_status_id, to_status_id, batch_ids_json,
		       required_to_continue, trigger_mode, active, updated_at
		FROM test_flow_rules
		WHERE company_id = $1
		ORDER BY name ASC`, companyID)
	if err != nil {
		return nil, fmt.Errorf("listar reglas de flujo: %w", err)
	}
	defer rows.Close()

	rules := make([]TestFlowRule, 0, 8)
	for rows.Next() {
		var r TestFlowRule
		var batchIDsJSON string
		var updatedAt time.Time
		if err := rows.Scan(&r.ID, &r.Name, &r.FromStatusID, &r.ToStatusID, &batchIDsJSON,
			&r.RequiredToContinue, &r.TriggerMode, &r.Active, &updatedAt); err != nil {
			return nil, fmt.Errorf("leer regla de flujo: %w", err)
		}
		r.UpdatedAt = formatTime(updatedAt)
		r.BatchIDs = []string{}
		if batchIDsJSON != "" && batchIDsJSON != "[]" {
			var ids []string
			if err := json.Unmarshal([]byte(batchIDsJSON), &ids); err != nil {
				return nil, fmt.Errorf("leer batch_ids_json: %w", err)
			}
			if ids != nil {
				r.BatchIDs = ids
			}
		}
		rules = append(rules, r)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterar reglas de flujo: %w", err)
	}
	return rules, nil
}

// UpsertTestBatch crea o reemplaza un lote con sus preguntas (transaccional).
func (s *Service) UpsertTestBatch(companyID string, batch TestBatch) (TestBatch, error) {
	id := strings.TrimSpace(batch.ID)
	if id == "" {
		id = generateID("batch")
	}
	name := strings.TrimSpace(batch.Name)
	if name == "" {
		return TestBatch{}, fmt.Errorf("%w: name es obligatorio", ErrInvalid)
	}
	updatedAt := time.Now().UTC()

	tx, err := s.db.Begin()
	if err != nil {
		return TestBatch{}, fmt.Errorf("iniciar transaccion de lote: %w", err)
	}
	defer tx.Rollback()

	_, err = tx.Exec(`
		INSERT INTO test_batches (company_id, id, name, description, active, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6)
		ON CONFLICT (company_id, id)
		DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description,
		              active = EXCLUDED.active, updated_at = EXCLUDED.updated_at`,
		companyID, id, name, strings.TrimSpace(batch.Description), batch.Active, updatedAt)
	if err != nil {
		return TestBatch{}, fmt.Errorf("guardar lote de prueba: %w", err)
	}

	if _, err := tx.Exec(`DELETE FROM test_batch_items WHERE company_id = $1 AND batch_id = $2`, companyID, id); err != nil {
		return TestBatch{}, fmt.Errorf("limpiar preguntas anteriores: %w", err)
	}

	questions := make([]TestQuestion, 0, len(batch.Questions))
	for position, q := range batch.Questions {
		qID := strings.TrimSpace(q.ID)
		if qID == "" {
			qID = generateID("question")
		}
		optionsJSON := "[]"
		if len(q.Options) > 0 {
			raw, err := json.Marshal(q.Options)
			if err != nil {
				return TestBatch{}, fmt.Errorf("%w: options invalidas", ErrInvalid)
			}
			optionsJSON = string(raw)
		}
		normalized := TestQuestion{
			ID:         qID,
			Label:      strings.TrimSpace(q.Label),
			Type:       validQuestionType(q.Type),
			Required:   q.Required,
			HelperText: strings.TrimSpace(q.HelperText),
			Options:    q.Options,
		}
		_, err := tx.Exec(`
			INSERT INTO test_batch_items
				(company_id, id, batch_id, label, type, required, helper_text, options_json, position)
			VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9)
			ON CONFLICT (company_id, id) DO UPDATE
			SET batch_id = EXCLUDED.batch_id, label = EXCLUDED.label, type = EXCLUDED.type,
			    required = EXCLUDED.required, helper_text = EXCLUDED.helper_text,
			    options_json = EXCLUDED.options_json, position = EXCLUDED.position`,
			companyID, qID, id, normalized.Label, normalized.Type, normalized.Required,
			normalized.HelperText, optionsJSON, position)
		if err != nil {
			return TestBatch{}, fmt.Errorf("guardar pregunta %s: %w", qID, err)
		}
		questions = append(questions, normalized)
	}

	if err := tx.Commit(); err != nil {
		return TestBatch{}, fmt.Errorf("confirmar lote de prueba: %w", err)
	}

	return TestBatch{
		ID:          id,
		Name:        name,
		Description: strings.TrimSpace(batch.Description),
		Active:      batch.Active,
		Questions:   questions,
		UpdatedAt:   formatTime(updatedAt),
	}, nil
}

// DeleteTestBatch borra el lote (las preguntas caen en cascada) y lo quita de
// las reglas de flujo que lo referencien, igual que hacia el servicio local.
func (s *Service) DeleteTestBatch(companyID, id string) error {
	tx, err := s.db.Begin()
	if err != nil {
		return fmt.Errorf("iniciar transaccion de borrado: %w", err)
	}
	defer tx.Rollback()

	res, err := tx.Exec(`DELETE FROM test_batches WHERE company_id = $1 AND id = $2`, companyID, id)
	if err != nil {
		return fmt.Errorf("borrar lote de prueba: %w", err)
	}
	if n, _ := res.RowsAffected(); n == 0 {
		return fmt.Errorf("%w: lote de prueba %s", ErrNotFound, id)
	}

	_, err = tx.Exec(`
		UPDATE test_flow_rules
		SET batch_ids_json = COALESCE(
		        (SELECT jsonb_agg(elem) FROM jsonb_array_elements_text(batch_ids_json) AS elem WHERE elem <> $2),
		        '[]'::jsonb),
		    updated_at = NOW()
		WHERE company_id = $1`, companyID, id)
	if err != nil {
		return fmt.Errorf("desvincular lote de reglas de flujo: %w", err)
	}
	return tx.Commit()
}

// UpsertFlowRule crea o reemplaza una regla de flujo entre estados del kanban.
func (s *Service) UpsertFlowRule(companyID string, rule TestFlowRule) (TestFlowRule, error) {
	id := strings.TrimSpace(rule.ID)
	if id == "" {
		id = generateID("flow")
	}
	from := strings.TrimSpace(rule.FromStatusID)
	to := strings.TrimSpace(rule.ToStatusID)
	if from == "" || to == "" {
		return TestFlowRule{}, fmt.Errorf("%w: fromStatusId y toStatusId son obligatorios", ErrInvalid)
	}

	seen := make(map[string]bool, len(rule.BatchIDs))
	batchIDs := make([]string, 0, len(rule.BatchIDs))
	for _, bid := range rule.BatchIDs {
		bid = strings.TrimSpace(bid)
		if bid == "" || seen[bid] {
			continue
		}
		seen[bid] = true
		batchIDs = append(batchIDs, bid)
	}
	batchIDsJSON, err := json.Marshal(batchIDs)
	if err != nil {
		return TestFlowRule{}, fmt.Errorf("%w: batchIds invalido", ErrInvalid)
	}
	updatedAt := time.Now().UTC()

	var out TestFlowRule
	var batchIDsOut string
	var updatedAtOut time.Time
	err = s.db.QueryRow(`
		INSERT INTO test_flow_rules
			(company_id, id, name, from_status_id, to_status_id, batch_ids_json,
			 required_to_continue, trigger_mode, active, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7, $8, $9, $10)
		ON CONFLICT (company_id, id) DO UPDATE
		SET name = EXCLUDED.name, from_status_id = EXCLUDED.from_status_id,
		    to_status_id = EXCLUDED.to_status_id, batch_ids_json = EXCLUDED.batch_ids_json,
		    required_to_continue = EXCLUDED.required_to_continue, trigger_mode = EXCLUDED.trigger_mode,
		    active = EXCLUDED.active, updated_at = EXCLUDED.updated_at
		RETURNING id, name, from_status_id, to_status_id, batch_ids_json,
		          required_to_continue, trigger_mode, active, updated_at`,
		companyID, id, strings.TrimSpace(rule.Name), from, to, string(batchIDsJSON),
		rule.RequiredToContinue, validTriggerMode(rule.TriggerMode), rule.Active, updatedAt,
	).Scan(&out.ID, &out.Name, &out.FromStatusID, &out.ToStatusID, &batchIDsOut,
		&out.RequiredToContinue, &out.TriggerMode, &out.Active, &updatedAtOut)
	if err != nil {
		return TestFlowRule{}, fmt.Errorf("guardar regla de flujo: %w", err)
	}
	out.UpdatedAt = formatTime(updatedAtOut)
	out.BatchIDs = batchIDs
	return out, nil
}

func (s *Service) DeleteFlowRule(companyID, id string) error {
	res, err := s.db.Exec(`DELETE FROM test_flow_rules WHERE company_id = $1 AND id = $2`, companyID, id)
	if err != nil {
		return fmt.Errorf("borrar regla de flujo: %w", err)
	}
	if n, _ := res.RowsAffected(); n == 0 {
		return fmt.Errorf("%w: regla de flujo %s", ErrNotFound, id)
	}
	return nil
}
