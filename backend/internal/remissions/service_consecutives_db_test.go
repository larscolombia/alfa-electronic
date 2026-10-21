package remissions

import (
	"fmt"
	"testing"
	"time"
)

// FASE 6 — Consecutivo de remisión con reinicio mensual (E-CO-YYMM-NNNN).
// Reutiliza openTestDB/testCompany de service_db_test.go (ya limpia
// remissions y remission_sequences por empresa).

func sampleRemissionRequest() UpsertRemissionRequest {
	return UpsertRemissionRequest{
		ClientName:   "Cliente QA",
		ClientNIT:    "901000000-1",
		DispatchType: "Servientrega",
		CarrierName:  "QA Courier",
		GuideNumber:  "QA-1",
		Items: []RemissionItem{{
			Identifier:  "EQ-001",
			Description: "Equipo QA",
			Quantity:    1,
			UnitPrice:   500000,
		}},
	}
}

func TestCreateConsecutiveMonthlyReset(t *testing.T) {
	db := openTestDB(t)
	s := NewService(db)
	companyID := testCompany(t, db, "consec")

	now := time.Now().UTC()
	currentPeriod := fmt.Sprintf("%02d%02d", now.Year()%100, int(now.Month()))

	// Un contador alto de un periodo anterior no debe contaminar el mes
	// actual: el consecutivo reinicia cada mes.
	if _, err := db.Exec(`
INSERT INTO remission_sequences (company_id, period, next_value)
VALUES ($1, '9901', 500);
`, companyID); err != nil {
		t.Fatalf("sembrar periodo pasado: %v", err)
	}

	first, err := s.Create(companyID, sampleRemissionRequest(), "qa@test.local")
	if err != nil {
		t.Fatalf("Create #1: %v", err)
	}
	wantFirst := fmt.Sprintf("E-CO-%s-0001", currentPeriod)
	if first.Consecutive != wantFirst {
		t.Errorf("primer consecutivo = %q, esperado %q", first.Consecutive, wantFirst)
	}

	second, err := s.Create(companyID, sampleRemissionRequest(), "qa@test.local")
	if err != nil {
		t.Fatalf("Create #2: %v", err)
	}
	wantSecond := fmt.Sprintf("E-CO-%s-0002", currentPeriod)
	if second.Consecutive != wantSecond {
		t.Errorf("segundo consecutivo = %q, esperado %q", second.Consecutive, wantSecond)
	}
}
