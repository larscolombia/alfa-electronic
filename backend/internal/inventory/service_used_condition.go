package inventory

import (
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"strings"
	"time"
)

const usedTestRequiredMessage = "componente usado requiere prueba aprobada registrada antes de instalar"

func (s *Service) loadCondition(companyID, reference string) (string, *UsedTestRecord, error) {
	var condition string
	var raw sql.NullString
	err := s.db.QueryRow(`SELECT condition, last_used_test FROM inventory_references WHERE company_id = $1 AND reference = $2`, companyID, reference).Scan(&condition, &raw)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return "", nil, errReferenceNotFound
		}
		return "", nil, err
	}
	if !raw.Valid || raw.String == "" {
		return condition, nil, nil
	}
	var test UsedTestRecord
	if err := json.Unmarshal([]byte(raw.String), &test); err != nil {
		return condition, nil, nil
	}
	return condition, &test, nil
}

// validateUsedInstall verifica que un componente usado pueda instalarse: exige
// una prueba aprobada registrada dentro de los ultimos 90 dias.
func validateUsedInstall(condition string, test *UsedTestRecord, now time.Time) error {
	if condition != conditionUsed {
		return nil
	}
	if test == nil || test.Result != usedTestApproved {
		return errInvalidCondition
	}
	testedAt, err := time.Parse(time.RFC3339, test.TestedAt)
	if err != nil || now.Sub(testedAt) > usedTestMaxAgeDays*24*time.Hour {
		return errInvalidCondition
	}
	return nil
}

func (s *Service) requireUsableForInstall(companyID, reference string) error {
	condition, test, err := s.loadCondition(companyID, reference)
	if err != nil {
		return err
	}
	return validateUsedInstall(condition, test, time.Now().UTC())
}

func (s *Service) RecordUsedTest(companyID, reference, actor string, req RecordUsedTestRequest) (OperationResult, error) {
	ref := strings.TrimSpace(reference)
	result := strings.TrimSpace(req.Result)
	note := strings.TrimSpace(req.Note)

	if ref == "" {
		return OperationResult{OK: false, Message: "La referencia es obligatoria."}, errReferenceRequired
	}
	if result != usedTestApproved && result != usedTestRejected {
		return OperationResult{OK: false, Message: "Resultado invalido (use aprobada o rechazada)."}, errInvalidStatus
	}
	if note == "" {
		return OperationResult{OK: false, Message: "La nota de la prueba es obligatoria."}, errReferenceRequired
	}
	if _, err := s.GetReference(companyID, ref); err != nil {
		return OperationResult{OK: false, Message: "No se encontro la referencia seleccionada."}, err
	}

	now := time.Now().UTC()
	test := UsedTestRecord{TestedBy: actor, TestedAt: now.Format(time.RFC3339), Result: result, Note: note}
	raw, _ := json.Marshal(test)

	_, err := s.db.Exec(`UPDATE inventory_references SET last_used_test = $1, updated_at = $2 WHERE company_id = $3 AND reference = $4`,
		string(raw), now, companyID, ref)
	if err != nil {
		return OperationResult{}, err
	}

	s.pushAudit(companyID, actor, "USED_TEST_RECORDED", fmt.Sprintf("Prueba de componente usado %s en %s: %s.", result, ref, note))
	return OperationResult{OK: true, Message: fmt.Sprintf("Prueba registrada para %s.", ref)}, nil
}
