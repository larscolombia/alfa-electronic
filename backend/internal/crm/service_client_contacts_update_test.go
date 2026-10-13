package crm

import (
	"errors"
	"fmt"
	"testing"
	"time"
)

func TestClientContactUpdateIntegration(t *testing.T) {
	db := openClientContactsTestDB(t)
	service := NewService(db)

	suffix := fmt.Sprintf("%d", time.Now().UnixNano())

	client, err := service.CreateClient(testClientContactsCompanyID, UpsertClientRequest{
		Nombre:  fmt.Sprintf("QA Cliente Contactos Update %s", suffix),
		Empresa: fmt.Sprintf("QA Empresa Contactos Update %s", suffix),
		Nit:     fmt.Sprintf("901%s", suffix[len(suffix)-6:]),
		Zona:    "Bogota",
		Estado:  ClientStatusActive,
	})
	if err != nil {
		t.Fatalf("CreateClient for fixture returned error: %v", err)
	}
	clientID := client.ID
	t.Cleanup(func() { cleanupClientContactArtifacts(t, db, clientID) })

	base, err := service.CreateClientContact(testClientContactsCompanyID, clientID, UpsertClientContactRequest{
		Name:  "Contacto Base",
		Role:  "Analista",
		Email: "base@example.com",
		Phone: "+57 300 000 0000",
		Notes: "Notas iniciales",
	})
	if err != nil {
		t.Fatalf("CreateClientContact for fixture returned error: %v", err)
	}

	t.Run("actualiza contacto existente y persiste todos los campos", func(t *testing.T) {
		updated, err := service.UpdateClientContact(testClientContactsCompanyID, clientID, base.ID, UpsertClientContactRequest{
			Name:  "  Contacto Actualizado  ",
			Role:  "Gerente",
			Email: "actualizado@example.com",
			Phone: "+57 311 111 1111",
			Notes: "Notas actualizadas",
		})
		if err != nil {
			t.Fatalf("UpdateClientContact returned error: %v", err)
		}
		if updated.ID != base.ID {
			t.Fatalf("expected contact ID %q, got %q", base.ID, updated.ID)
		}
		if updated.Name != "Contacto Actualizado" {
			t.Fatalf("expected trimmed name, got %q", updated.Name)
		}

		contacts, err := service.ListClientContacts(testClientContactsCompanyID, clientID)
		if err != nil {
			t.Fatalf("ListClientContacts returned error: %v", err)
		}
		found := false
		for _, c := range contacts {
			if c.ID == base.ID {
				found = true
				if c.Name != "Contacto Actualizado" ||
					c.Role != "Gerente" ||
					c.Email != "actualizado@example.com" ||
					c.Phone != "+57 311 111 1111" ||
					c.Notes != "Notas actualizadas" {
					t.Fatalf("unexpected contact data after update: %+v", c)
				}
				break
			}
		}
		if !found {
			t.Fatalf("contact %s not found in ListClientContacts after update", base.ID)
		}
	})

	t.Run("actualizar sin nombre retorna error de validacion", func(t *testing.T) {
		_, err := service.UpdateClientContact(testClientContactsCompanyID, clientID, base.ID, UpsertClientContactRequest{
			Name: "   ",
		})
		if !errors.Is(err, errContactNameRequired) {
			t.Fatalf("expected errContactNameRequired, got %v", err)
		}
	})

	t.Run("actualizar con correo invalido retorna error de validacion", func(t *testing.T) {
		_, err := service.UpdateClientContact(testClientContactsCompanyID, clientID, base.ID, UpsertClientContactRequest{
			Name:  "QA Correo Update",
			Email: "no-es-un-correo",
		})
		if err == nil {
			t.Fatal("expected validation error for invalid email, got nil")
		}
		var ve *validationError
		if !errors.As(err, &ve) {
			t.Fatalf("expected validationError, got %v", err)
		}
	})

	t.Run("actualizar contacto inexistente retorna errContactNotFound", func(t *testing.T) {
		_, err := service.UpdateClientContact(testClientContactsCompanyID, clientID, "contacto-que-no-existe", UpsertClientContactRequest{
			Name: "QA Inexistente",
		})
		if !errors.Is(err, errContactNotFound) {
			t.Fatalf("expected errContactNotFound, got %v", err)
		}
	})

	t.Run("actualizar en cliente inexistente retorna errClientNotFound", func(t *testing.T) {
		_, err := service.UpdateClientContact(testClientContactsCompanyID, "cliente-que-no-existe", base.ID, UpsertClientContactRequest{
			Name: "QA Sin Cliente",
		})
		if !errors.Is(err, errClientNotFound) {
			t.Fatalf("expected errClientNotFound, got %v", err)
		}
	})
}
