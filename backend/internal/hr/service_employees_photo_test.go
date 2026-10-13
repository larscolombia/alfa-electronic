package hr

import (
	"errors"
	"fmt"
	"strings"
	"testing"
	"time"
)

const testEmployeePhotoDataURL = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=="

func employeePhotoRequest(suffix string) CreateEmployeeRequest {
	return CreateEmployeeRequest{
		Name:       fmt.Sprintf("QA Foto %s", suffix),
		Role:       fmt.Sprintf("QA Cargo Foto %s", suffix),
		Department: fmt.Sprintf("QA Dept Foto %s", suffix),
		Status:     "Activo",
	}
}

func TestEmployeePhotoRoundTrip(t *testing.T) {
	db := openTestDB(t)
	service := NewService(db)

	suffix := fmt.Sprintf("%d", time.Now().UnixNano())
	req := employeePhotoRequest(suffix)

	var createdID string
	t.Cleanup(func() { cleanupEmployeeArtifacts(t, db, createdID, req.Role, req.Department) })

	t.Run("guarda foto en create y Get la devuelve identica", func(t *testing.T) {
		req.EmployeeProfileFields.PhotoData = testEmployeePhotoDataURL
		created, err := service.CreateEmployee(testCompanyID, req)
		if err != nil {
			t.Fatalf("CreateEmployee returned error: %v", err)
		}
		createdID = created.ID

		if created.PhotoData != testEmployeePhotoDataURL {
			t.Fatalf("expected photoData in create response, got %q", created.PhotoData)
		}

		got, err := service.GetEmployee(testCompanyID, created.ID)
		if err != nil {
			t.Fatalf("GetEmployee returned error: %v", err)
		}
		if got.PhotoData != testEmployeePhotoDataURL {
			t.Fatalf("photo round-trip mismatch: got %q", got.PhotoData)
		}
	})

	t.Run("actualiza foto con update y Get verifica el cambio", func(t *testing.T) {
		newPhoto := "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP=="
		update := UpdateEmployeeRequest(req)
		update.EmployeeProfileFields.PhotoData = newPhoto

		if _, err := service.UpdateEmployee(testCompanyID, createdID, update); err != nil {
			t.Fatalf("UpdateEmployee returned error: %v", err)
		}

		got, err := service.GetEmployee(testCompanyID, createdID)
		if err != nil {
			t.Fatalf("GetEmployee after update returned error: %v", err)
		}
		if got.PhotoData != newPhoto {
			t.Fatalf("photo update mismatch: got %q", got.PhotoData)
		}
	})

	t.Run("update con foto vacia limpia la foto almacenada", func(t *testing.T) {
		update := UpdateEmployeeRequest(req)
		update.EmployeeProfileFields.PhotoData = ""

		if _, err := service.UpdateEmployee(testCompanyID, createdID, update); err != nil {
			t.Fatalf("UpdateEmployee returned error: %v", err)
		}

		got, err := service.GetEmployee(testCompanyID, createdID)
		if err != nil {
			t.Fatalf("GetEmployee after clearing photo returned error: %v", err)
		}
		if got.PhotoData != "" {
			t.Fatalf("expected empty photoData after clearing, got %q", got.PhotoData)
		}
	})
}

func TestEmployeePhotoValidation(t *testing.T) {
	db := openTestDB(t)
	service := NewService(db)

	suffix := fmt.Sprintf("%d", time.Now().UnixNano())
	base := employeePhotoRequest(suffix)

	t.Run("create rechaza foto sin prefijo data:image/", func(t *testing.T) {
		req := base
		req.EmployeeProfileFields.PhotoData = "iVBORw0KGgoAAAANSUhEUg=="
		_, err := service.CreateEmployee(testCompanyID, req)
		if !errors.Is(err, errEmployeePhotoInvalid) {
			t.Fatalf("expected errEmployeePhotoInvalid, got %v", err)
		}
	})

	t.Run("create rechaza data URL que no es imagen", func(t *testing.T) {
		req := base
		req.EmployeeProfileFields.PhotoData = "data:text/plain;base64,aG9sYQ=="
		_, err := service.CreateEmployee(testCompanyID, req)
		if !errors.Is(err, errEmployeePhotoInvalid) {
			t.Fatalf("expected errEmployeePhotoInvalid, got %v", err)
		}
	})

	t.Run("create rechaza foto que supera el tamano maximo", func(t *testing.T) {
		req := base
		req.EmployeeProfileFields.PhotoData = "data:image/png;base64," + strings.Repeat("A", maxEmployeePhotoDataURLBytes+1)
		_, err := service.CreateEmployee(testCompanyID, req)
		if !errors.Is(err, errEmployeePhotoTooLarge) {
			t.Fatalf("expected errEmployeePhotoTooLarge, got %v", err)
		}
	})

	t.Run("update rechaza foto invalida y oversize", func(t *testing.T) {
		created, err := service.CreateEmployee(testCompanyID, base)
		if err != nil {
			t.Fatalf("CreateEmployee returned error: %v", err)
		}
		t.Cleanup(func() { cleanupEmployeeArtifacts(t, db, created.ID, base.Role, base.Department) })

		invalid := UpdateEmployeeRequest(base)
		invalid.EmployeeProfileFields.PhotoData = "no-es-una-imagen"
		if _, err := service.UpdateEmployee(testCompanyID, created.ID, invalid); !errors.Is(err, errEmployeePhotoInvalid) {
			t.Fatalf("expected errEmployeePhotoInvalid, got %v", err)
		}

		oversize := UpdateEmployeeRequest(base)
		oversize.EmployeeProfileFields.PhotoData = "data:image/png;base64," + strings.Repeat("A", maxEmployeePhotoDataURLBytes+1)
		if _, err := service.UpdateEmployee(testCompanyID, created.ID, oversize); !errors.Is(err, errEmployeePhotoTooLarge) {
			t.Fatalf("expected errEmployeePhotoTooLarge, got %v", err)
		}
	})
}

func TestEmployeePhotoEmptyCompatibility(t *testing.T) {
	db := openTestDB(t)
	service := NewService(db)

	suffix := fmt.Sprintf("%d", time.Now().UnixNano())
	req := employeePhotoRequest(suffix)

	created, err := service.CreateEmployee(testCompanyID, req)
	if err != nil {
		t.Fatalf("CreateEmployee without photo returned error: %v", err)
	}
	t.Cleanup(func() { cleanupEmployeeArtifacts(t, db, created.ID, req.Role, req.Department) })

	got, err := service.GetEmployee(testCompanyID, created.ID)
	if err != nil {
		t.Fatalf("GetEmployee returned error: %v", err)
	}
	if got.PhotoData != "" {
		t.Fatalf("expected empty photoData for legacy employee, got %q", got.PhotoData)
	}
}
