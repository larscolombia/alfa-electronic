package crm

import (
	"fmt"
	"strings"
	"testing"
	"time"

	"pika.software.net.co/backend/internal/platform/database"
)

// FASE 5b — round-trip de los datos fiscales del cliente (DV, código postal,
// correo de facturación electrónica, gran contribuyente y tipo de ID).
func TestClientFiscalFields5b(t *testing.T) {
	db := openClientContactsTestDB(t)
	if err := database.Migrate(db); err != nil {
		t.Fatalf("migrate: %v", err)
	}
	service := NewService(db)

	companyID := fmt.Sprintf("qa-crm-fiscal-%d", time.Now().UnixNano())
	t.Cleanup(func() {
		db.Exec(`DELETE FROM crm_client_branches WHERE company_id = $1`, companyID)
		db.Exec(`DELETE FROM crm_clients WHERE company_id = $1`, companyID)
	})

	created, err := service.CreateClient(companyID, UpsertClientRequest{
		Nombre:  "Ana Fiscal",
		Empresa: "Fiscal 5b SAS",
		Zona:    "Centro",
		Estado:  "Activo",
		Correo:  "general@fiscal5b.example",
		Nit:     "900123456-7",

		DV:               "8",
		PostalCode:       "110111",
		BillingEmail:     "facturacion@fiscal5b.example",
		GrandContributor: true,
		IDType:           "CE",
	})
	if err != nil {
		t.Fatalf("CreateClient: %v", err)
	}
	if created.DV != "8" || created.PostalCode != "110111" {
		t.Errorf("DV/PostalCode = %q/%q", created.DV, created.PostalCode)
	}
	if created.BillingEmail != "facturacion@fiscal5b.example" {
		t.Errorf("BillingEmail = %q", created.BillingEmail)
	}
	if !created.GrandContributor {
		t.Errorf("GrandContributor = false")
	}
	if created.IDType != "CE" {
		t.Errorf("IDType = %q, esperaba CE", created.IDType)
	}

	// Round-trip completo por GetClient.
	fetched, err := service.GetClient(companyID, created.ID)
	if err != nil {
		t.Fatalf("GetClient: %v", err)
	}
	if fetched.DV != "8" || fetched.PostalCode != "110111" ||
		fetched.BillingEmail != "facturacion@fiscal5b.example" ||
		!fetched.GrandContributor || fetched.IDType != "CE" {
		t.Errorf("GetClient no devolvio los datos fiscales: %+v", fetched)
	}

	// Update: cambia DV, limpia correo de facturación y omite IDType (→ NIT).
	updated, err := service.UpdateClient(companyID, created.ID, UpsertClientRequest{
		Nombre:  "Ana Fiscal",
		Empresa: "Fiscal 5b SAS",
		Zona:    "Centro",
		Estado:  "Activo",
		Correo:  "general@fiscal5b.example",
		Nit:     "900123456-7",

		DV:               "1",
		PostalCode:       "110221",
		BillingEmail:     "",
		GrandContributor: false,
		IDType:           "",
	})
	if err != nil {
		t.Fatalf("UpdateClient: %v", err)
	}
	if updated.DV != "1" || updated.PostalCode != "110221" {
		t.Errorf("tras update DV/PostalCode = %q/%q", updated.DV, updated.PostalCode)
	}
	if updated.BillingEmail != "" || updated.GrandContributor {
		t.Errorf("tras update BillingEmail/GrandContributor = %q/%v", updated.BillingEmail, updated.GrandContributor)
	}
	if updated.IDType != "NIT" {
		t.Errorf("IDType por defecto = %q, esperaba NIT", updated.IDType)
	}

	// Validaciones: tipo de ID inválido y correo de facturación inválido.
	if _, err := service.UpdateClient(companyID, created.ID, UpsertClientRequest{
		Nombre: "Ana Fiscal", Empresa: "Fiscal 5b SAS", Zona: "Centro", Estado: "Activo",
		IDType: "RUC",
	}); err == nil || !strings.Contains(err.Error(), "tipo de identificacion") {
		t.Errorf("IDType invalido: err = %v", err)
	}
	if _, err := service.UpdateClient(companyID, created.ID, UpsertClientRequest{
		Nombre: "Ana Fiscal", Empresa: "Fiscal 5b SAS", Zona: "Centro", Estado: "Activo",
		BillingEmail: "no-es-correo",
	}); err == nil || !strings.Contains(err.Error(), "facturacion electronica") {
		t.Errorf("BillingEmail invalido: err = %v", err)
	}

	// ListClients también expone los campos fiscales.
	items, err := service.ListClients(companyID, ClientListQuery{})
	if err != nil {
		t.Fatalf("ListClients: %v", err)
	}
	if len(items) != 1 {
		t.Fatalf("ListClients devolvio %d", len(items))
	}
	if items[0].DV != "1" || items[0].IDType != "NIT" {
		t.Errorf("ListClients no expone fiscales: %+v", items[0])
	}
}
