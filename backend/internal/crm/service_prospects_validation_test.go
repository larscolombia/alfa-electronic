package crm

import (
	"errors"
	"testing"
)

func TestNormalizeProspectPayloadRequiresCompany(t *testing.T) {
	service := &Service{}
	_, err := service.normalizeProspectPayload(UpsertProspectRequest{Name: "Contacto", Company: "   "})
	if !errors.Is(err, errProspectCompanyRequired) {
		t.Fatalf("expected required-company error, got %v", err)
	}
}

func TestNormalizeProspectPayloadKeepsCiiuCode(t *testing.T) {
	service := &Service{}
	payload, err := service.normalizeProspectPayload(UpsertProspectRequest{Name: "Contacto", Company: "Empresa", CiiuCode: "6201"})
	if err != nil {
		t.Fatalf("normalize prospect: %v", err)
	}
	if payload.CiiuCode != "6201" {
		t.Fatalf("expected CIIU code 6201, got %q", payload.CiiuCode)
	}
}

func TestNormalizeProspectPayloadUsesCompanyWhenContactNameIsEmpty(t *testing.T) {
	service := &Service{}
	payload, err := service.normalizeProspectPayload(UpsertProspectRequest{Company: "Empresa sin contacto"})
	if err != nil {
		t.Fatalf("normalize prospect: %v", err)
	}
	if payload.Name != "Empresa sin contacto" {
		t.Fatalf("expected company as internal name, got %q", payload.Name)
	}
}
