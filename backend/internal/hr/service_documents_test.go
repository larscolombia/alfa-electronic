package hr

import (
	"database/sql"
	"errors"
	"fmt"
	"strings"
	"testing"
	"time"
)

const testDocumentDataURL = "data:application/pdf;base64,JVBERi0xLjQKJcTl8uXrp/Og0MTGCjEgMCBvYmo="

func employeeDocumentOwner(t *testing.T, db *sql.DB, service *Service, suffix string) Employee {
	t.Helper()
	req := CreateEmployeeRequest{
		Name:       fmt.Sprintf("QA Docs %s", suffix),
		Role:       fmt.Sprintf("QA Cargo Docs %s", suffix),
		Department: fmt.Sprintf("QA Dept Docs %s", suffix),
		Status:     "Activo",
	}
	created, err := service.CreateEmployee(testCompanyID, req)
	if err != nil {
		t.Fatalf("CreateEmployee returned error: %v", err)
	}
	t.Cleanup(func() {
		if _, err := db.Exec(`DELETE FROM hr_employee_documents WHERE company_id = $1 AND employee_id = $2;`, testCompanyID, created.ID); err != nil {
			t.Logf("cleanup documents failed: %v", err)
		}
		cleanupEmployeeArtifacts(t, db, created.ID, req.Role, req.Department)
	})
	return created
}

func TestEmployeeDocumentRoundTrip(t *testing.T) {
	db := openTestDB(t)
	service := NewService(db)

	suffix := fmt.Sprintf("%d", time.Now().UnixNano())
	owner := employeeDocumentOwner(t, db, service, suffix)

	var documentID string
	t.Run("sube documento y devuelve metadata", func(t *testing.T) {
		created, err := service.CreateEmployeeDocument(testCompanyID, owner.ID, CreateEmployeeDocumentRequest{
			Category: "Contrato",
			FileName: "contrato-qa.pdf",
			MimeType: "application/pdf",
			Data:     testDocumentDataURL,
			Required: true,
			Notes:    "Contrato firmado QA",
		})
		if err != nil {
			t.Fatalf("CreateEmployeeDocument returned error: %v", err)
		}
		documentID = created.ID

		if created.ID == "" {
			t.Fatal("expected generated document ID, got empty")
		}
		if created.EmployeeID != owner.ID || created.Category != "Contrato" || created.FileName != "contrato-qa.pdf" {
			t.Fatalf("metadata mismatch: %+v", created)
		}
		if created.MimeType != "application/pdf" || !created.Required || created.Notes != "Contrato firmado QA" {
			t.Fatalf("metadata mismatch: %+v", created)
		}
		if created.SizeBytes <= 0 {
			t.Fatalf("expected computed sizeBytes > 0, got %d", created.SizeBytes)
		}
		if created.UploadedAt.IsZero() {
			t.Fatal("expected uploadedAt set by the backend")
		}
	})

	t.Run("lista documentos con metadata y sin el contenido", func(t *testing.T) {
		items, err := service.ListEmployeeDocuments(testCompanyID, owner.ID)
		if err != nil {
			t.Fatalf("ListEmployeeDocuments returned error: %v", err)
		}
		if len(items) != 1 {
			t.Fatalf("expected 1 document, got %d", len(items))
		}
		if items[0].ID != documentID || items[0].FileName != "contrato-qa.pdf" {
			t.Fatalf("list metadata mismatch: %+v", items[0])
		}
	})

	t.Run("descarga devuelve el contenido identico al subido", func(t *testing.T) {
		download, err := service.GetEmployeeDocumentData(testCompanyID, owner.ID, documentID)
		if err != nil {
			t.Fatalf("GetEmployeeDocumentData returned error: %v", err)
		}
		if download.FileName != "contrato-qa.pdf" || download.MimeType != "application/pdf" {
			t.Fatalf("download metadata mismatch: %+v", download)
		}
		if download.Data != testDocumentDataURL {
			t.Fatalf("download data mismatch: got %q", download.Data)
		}
	})
}

func TestEmployeeDocumentValidations(t *testing.T) {
	db := openTestDB(t)
	service := NewService(db)

	suffix := fmt.Sprintf("%d", time.Now().UnixNano())
	owner := employeeDocumentOwner(t, db, service, suffix)

	valid := CreateEmployeeDocumentRequest{
		Category: "Hoja de vida",
		FileName: "hv-qa.pdf",
		Data:     testDocumentDataURL,
	}

	t.Run("rechaza sin fileName", func(t *testing.T) {
		req := valid
		req.FileName = "   "
		_, err := service.CreateEmployeeDocument(testCompanyID, owner.ID, req)
		if !errors.Is(err, errDocumentFileNameRequired) {
			t.Fatalf("expected errDocumentFileNameRequired, got %v", err)
		}
	})

	t.Run("rechaza sin data", func(t *testing.T) {
		req := valid
		req.Data = ""
		_, err := service.CreateEmployeeDocument(testCompanyID, owner.ID, req)
		if !errors.Is(err, errDocumentDataRequired) {
			t.Fatalf("expected errDocumentDataRequired, got %v", err)
		}
	})

	t.Run("rechaza contenido oversize", func(t *testing.T) {
		req := valid
		req.Data = "data:application/pdf;base64," + strings.Repeat("A", maxDocumentDataURLBytes+1)
		_, err := service.CreateEmployeeDocument(testCompanyID, owner.ID, req)
		if !errors.Is(err, errDocumentTooLarge) {
			t.Fatalf("expected errDocumentTooLarge, got %v", err)
		}
	})

	t.Run("rechaza empleado inexistente", func(t *testing.T) {
		_, err := service.CreateEmployeeDocument(testCompanyID, "EMP-999999", valid)
		if !errors.Is(err, errEmployeeNotFound) {
			t.Fatalf("expected errEmployeeNotFound, got %v", err)
		}
	})

	t.Run("listar de empleado inexistente devuelve no encontrado", func(t *testing.T) {
		_, err := service.ListEmployeeDocuments(testCompanyID, "EMP-999999")
		if !errors.Is(err, errEmployeeNotFound) {
			t.Fatalf("expected errEmployeeNotFound, got %v", err)
		}
	})
}

func TestEmployeeDocumentSoftDelete(t *testing.T) {
	db := openTestDB(t)
	service := NewService(db)

	suffix := fmt.Sprintf("%d", time.Now().UnixNano())
	owner := employeeDocumentOwner(t, db, service, suffix)

	created, err := service.CreateEmployeeDocument(testCompanyID, owner.ID, CreateEmployeeDocumentRequest{
		Category: "Certificados",
		FileName: "certificado-qa.pdf",
		Data:     testDocumentDataURL,
	})
	if err != nil {
		t.Fatalf("CreateEmployeeDocument returned error: %v", err)
	}

	t.Run("elimina con soft delete y desaparece de la lista", func(t *testing.T) {
		if err := service.DeleteEmployeeDocument(testCompanyID, owner.ID, created.ID); err != nil {
			t.Fatalf("DeleteEmployeeDocument returned error: %v", err)
		}

		items, err := service.ListEmployeeDocuments(testCompanyID, owner.ID)
		if err != nil {
			t.Fatalf("ListEmployeeDocuments returned error: %v", err)
		}
		if len(items) != 0 {
			t.Fatalf("expected 0 documents after delete, got %d", len(items))
		}

		var softDelete bool
		if err := db.QueryRow(
			`SELECT soft_delete FROM hr_employee_documents WHERE company_id = $1 AND id = $2;`,
			testCompanyID, created.ID,
		).Scan(&softDelete); err != nil {
			t.Fatalf("read soft_delete flag: %v", err)
		}
		if !softDelete {
			t.Fatal("expected soft_delete = true after delete")
		}
	})

	t.Run("descarga de documento eliminado devuelve no encontrado", func(t *testing.T) {
		_, err := service.GetEmployeeDocumentData(testCompanyID, owner.ID, created.ID)
		if !errors.Is(err, errDocumentNotFound) {
			t.Fatalf("expected errDocumentNotFound, got %v", err)
		}
	})

	t.Run("eliminar documento inexistente devuelve no encontrado", func(t *testing.T) {
		err := service.DeleteEmployeeDocument(testCompanyID, owner.ID, "doc-inexistente")
		if !errors.Is(err, errDocumentNotFound) {
			t.Fatalf("expected errDocumentNotFound, got %v", err)
		}
	})
}
