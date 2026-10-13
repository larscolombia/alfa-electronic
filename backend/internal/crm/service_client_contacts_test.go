package crm

import (
	"database/sql"
	"errors"
	"fmt"
	"os"
	"testing"
	"time"

	_ "github.com/jackc/pgx/v5/stdlib"
)

const testClientContactsCompanyID = "demo-company"

func openClientContactsTestDB(t *testing.T) *sql.DB {
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
	t.Cleanup(func() { db.Close() })
	return db
}

func cleanupClientContactArtifacts(t *testing.T, db *sql.DB, clientID string) {
	t.Helper()
	statements := []struct {
		query string
		args  []any
	}{
		{`DELETE FROM crm_client_contacts WHERE company_id = $1 AND client_id = $2;`, []any{testClientContactsCompanyID, clientID}},
		{`DELETE FROM crm_clients WHERE company_id = $1 AND id = $2;`, []any{testClientContactsCompanyID, clientID}},
	}
	for _, stmt := range statements {
		if _, err := db.Exec(stmt.query, stmt.args...); err != nil {
			t.Logf("cleanup failed (%s): %v", stmt.query, err)
		}
	}
}

func TestClientContactsIntegration(t *testing.T) {
	db := openClientContactsTestDB(t)
	service := NewService(db)

	suffix := fmt.Sprintf("%d", time.Now().UnixNano())

	client, err := service.CreateClient(testClientContactsCompanyID, UpsertClientRequest{
		Nombre:  fmt.Sprintf("QA Cliente Contactos %s", suffix),
		Empresa: fmt.Sprintf("QA Empresa Contactos %s", suffix),
		Nit:     fmt.Sprintf("900%s", suffix[len(suffix)-6:]),
		Zona:    "Bogota",
		Estado:  ClientStatusActive,
	})
	if err != nil {
		t.Fatalf("CreateClient for fixture returned error: %v", err)
	}
	clientID := client.ID
	t.Cleanup(func() { cleanupClientContactArtifacts(t, db, clientID) })

	var createdID string

	t.Run("crea contacto valido y persiste", func(t *testing.T) {
		created, err := service.CreateClientContact(testClientContactsCompanyID, clientID, UpsertClientContactRequest{
			Name:  "Maria QA",
			Role:  "Gerente de compras",
			Email: "maria.qa@example.com",
			Phone: "+57 300 123 4567",
			Notes: "Contacto principal de prueba",
		})
		if err != nil {
			t.Fatalf("CreateClientContact returned error: %v", err)
		}
		createdID = created.ID

		if created.ID == "" {
			t.Fatal("expected generated contact ID, got empty")
		}
		if created.ClientID != clientID {
			t.Fatalf("expected clientID %q, got %q", clientID, created.ClientID)
		}

		contacts, err := service.ListClientContacts(testClientContactsCompanyID, clientID)
		if err != nil {
			t.Fatalf("ListClientContacts returned error: %v", err)
		}
		found := false
		for _, c := range contacts {
			if c.ID == created.ID {
				found = true
				if c.Name != "Maria QA" || c.Email != "maria.qa@example.com" {
					t.Fatalf("unexpected contact data: %+v", c)
				}
				break
			}
		}
		if !found {
			t.Fatalf("contact %s not found in ListClientContacts", created.ID)
		}
	})

	t.Run("rechaza nombre vacio con error de validacion", func(t *testing.T) {
		_, err := service.CreateClientContact(testClientContactsCompanyID, clientID, UpsertClientContactRequest{
			Name: "   ",
		})
		if err == nil {
			t.Fatal("expected validation error for empty name, got nil")
		}
		if !errors.Is(err, errContactNameRequired) {
			t.Fatalf("expected errContactNameRequired, got %v", err)
		}
	})

	t.Run("rechaza correo con formato invalido", func(t *testing.T) {
		_, err := service.CreateClientContact(testClientContactsCompanyID, clientID, UpsertClientContactRequest{
			Name:  "QA Correo Invalido",
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

	t.Run("eliminar contacto aplica soft delete y ya no aparece", func(t *testing.T) {
		if createdID == "" {
			t.Skip("no contact created in previous subtest")
		}
		if err := service.DeleteClientContact(testClientContactsCompanyID, clientID, createdID); err != nil {
			t.Fatalf("DeleteClientContact returned error: %v", err)
		}

		contacts, err := service.ListClientContacts(testClientContactsCompanyID, clientID)
		if err != nil {
			t.Fatalf("ListClientContacts after delete returned error: %v", err)
		}
		for _, c := range contacts {
			if c.ID == createdID {
				t.Fatalf("contact %s still listed after soft delete", createdID)
			}
		}

		err = service.DeleteClientContact(testClientContactsCompanyID, clientID, createdID)
		if !errors.Is(err, errContactNotFound) {
			t.Fatalf("expected errContactNotFound deleting twice, got %v", err)
		}
	})

	t.Run("cliente inexistente retorna errClientNotFound", func(t *testing.T) {
		_, err := service.CreateClientContact(testClientContactsCompanyID, "cliente-que-no-existe", UpsertClientContactRequest{
			Name: "QA Sin Cliente",
		})
		if !errors.Is(err, errClientNotFound) {
			t.Fatalf("expected errClientNotFound, got %v", err)
		}
	})
}
