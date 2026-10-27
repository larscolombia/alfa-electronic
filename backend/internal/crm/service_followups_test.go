package crm

import (
	"fmt"
	"strings"
	"testing"
	"time"
)

const testFollowupsCompanyID = "demo-company"

func cleanupFollowupArtifacts(t *testing.T, service *Service, prospectID string) {
	t.Helper()
	if _, err := service.DeleteProspect(testFollowupsCompanyID, prospectID); err != nil {
		t.Logf("cleanup prospect %s failed: %v", prospectID, err)
	}
}

func TestProspectFollowupsContactoResponsable(t *testing.T) {
	db := openClientContactsTestDB(t)
	service := NewService(db)

	suffix := fmt.Sprintf("%d", time.Now().UnixNano())
	prospect, err := service.CreateProspect(testFollowupsCompanyID, UpsertProspectRequest{
		Name:    fmt.Sprintf("QA Followups %s", suffix),
		Company: fmt.Sprintf("QA Empresa Followups %s", suffix),
		Email:   fmt.Sprintf("qa-followups-%s@alfa.local", suffix),
		Status:  "Pendiente",
	})
	if err != nil {
		t.Fatalf("CreateProspect for fixture returned error: %v", err)
	}
	t.Cleanup(func() { cleanupFollowupArtifacts(t, service, prospect.ID) })

	fecha := time.Now().Add(24 * time.Hour).Format("2006-01-02")

	t.Run("crea seguimiento con contacto responsable y persiste", func(t *testing.T) {
		created, err := service.CreateProspectFollowup(testFollowupsCompanyID, prospect.ID, UpsertProspectFollowupRequest{
			Tipo:           "Visita presencial",
			Fecha:          fecha,
			Hora:           "10:30",
			Observacion:    "Seguimiento sin respuesta de cotizacion",
			Estado:         "Pendiente",
			RegistradoPor:  "Admin QA",
			ContactoNombre: "Maria Responsable",
		})
		if err != nil {
			t.Fatalf("CreateProspectFollowup returned error: %v", err)
		}
		if created.ContactoNombre != "Maria Responsable" {
			t.Fatalf("contacto responsable no devuelto al crear: %q", created.ContactoNombre)
		}

		items, err := service.ListProspectFollowups(testFollowupsCompanyID, prospect.ID, false)
		if err != nil {
			t.Fatalf("ListProspectFollowups returned error: %v", err)
		}
		var stored *ProspectFollowup
		for i := range items {
			if items[i].ID == created.ID {
				stored = &items[i]
				break
			}
		}
		if stored == nil {
			t.Fatalf("seguimiento %s no aparece en el listado", created.ID)
		}
		if stored.ContactoNombre != "Maria Responsable" {
			t.Fatalf("contacto responsable no persistido: %q", stored.ContactoNombre)
		}
	})

	t.Run("rechaza contacto responsable demasiado largo", func(t *testing.T) {
		_, err := service.CreateProspectFollowup(testFollowupsCompanyID, prospect.ID, UpsertProspectFollowupRequest{
			Tipo:           "Llamada telefonica",
			Fecha:          fecha,
			Hora:           "11:00",
			Estado:         "Pendiente",
			ContactoNombre: strings.Repeat("a", 181),
		})
		if err == nil {
			t.Fatal("se esperaba error de validacion para contacto_nombre largo")
		}
	})

	t.Run("actualizar sin contacto conserva el responsable previo", func(t *testing.T) {
		created, err := service.CreateProspectFollowup(testFollowupsCompanyID, prospect.ID, UpsertProspectFollowupRequest{
			Tipo:           "Correo de seguimiento",
			Fecha:          fecha,
			Hora:           "12:00",
			Estado:         "Pendiente",
			ContactoNombre: "Pedro Responsable",
		})
		if err != nil {
			t.Fatalf("CreateProspectFollowup returned error: %v", err)
		}

		if _, err := service.UpdateProspectFollowup(testFollowupsCompanyID, prospect.ID, created.ID, UpsertProspectFollowupRequest{
			Tipo:   "Correo de seguimiento",
			Fecha:  fecha,
			Hora:   "12:30",
			Estado: "Completado",
		}); err != nil {
			t.Fatalf("UpdateProspectFollowup returned error: %v", err)
		}

		items, err := service.ListProspectFollowups(testFollowupsCompanyID, prospect.ID, false)
		if err != nil {
			t.Fatalf("ListProspectFollowups returned error: %v", err)
		}
		for i := range items {
			if items[i].ID == created.ID {
				if items[i].ContactoNombre != "Pedro Responsable" {
					t.Fatalf("update sin contacto piso el responsable: %q", items[i].ContactoNombre)
				}
				if items[i].Estado != "Completado" {
					t.Fatalf("estado no actualizado: %q", items[i].Estado)
				}
				return
			}
		}
		t.Fatalf("seguimiento %s no aparece tras actualizar", created.ID)
	})
}
