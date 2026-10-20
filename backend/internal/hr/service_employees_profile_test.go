package hr

import (
	"errors"
	"fmt"
	"math"
	"testing"
	"time"
)

func fullEmployeeProfileRequest(suffix string) CreateEmployeeRequest {
	return CreateEmployeeRequest{
		Name:           fmt.Sprintf("QA Perfil %s", suffix),
		Role:           fmt.Sprintf("QA Cargo Perfil %s", suffix),
		Department:     fmt.Sprintf("QA Dept Perfil %s", suffix),
		Manager:        "QA Manager Perfil",
		Status:         "Activo",
		DocumentNumber: fmt.Sprintf("DOC-%s", suffix[len(suffix)-8:]),
		Email:          fmt.Sprintf("qa.perfil.%s@example.com", suffix),
		FileComplete:   true,
		EmailPassword:  "ClaveCorreo#123",

		EmployeeProfileFields: EmployeeProfileFields{
			FirstName:                   "QANombre",
			LastName:                    "QAApellido",
			AccessUser:                  "qa.access",
			Treatment:                   "Sra.",
			Greeting:                    "Estimada",
			UserName:                    "qa.user",
			Initials:                    "QQ",
			RoleType:                    "CS",
			AssignedScheduleID:          "schedule-qa",
			HourlyRate:                  75300.50,
			EmergencyContact:            "Contacto QA",
			EmergencyRelationship:       "Hermana",
			Allergies:                   "Penicilina",
			BloodType:                   "O+",
			Eps:                         "Sura",
			CompensationFund:            "Compensar",
			HireDate:                    "2026-01-15",
			TerminationDate:             "2026-12-31",
			Birthday:                    "1990-05-20",
			TerminationReason:           "Fin de contrato",
			ResidentialAddress:          "Calle 1 # 2-3, Bogota",
			Gender:                      "Femenino",
			RegistrationTermsAccepted:   true,
			RegistrationPrivacyAccepted: true,
		},
	}
}

func assertEmployeeMatchesProfile(t *testing.T, got Employee, want CreateEmployeeRequest) {
	t.Helper()
	if got.Name != want.Name || got.Role != want.Role || got.Department != want.Department ||
		got.Manager != want.Manager || got.Status != want.Status ||
		got.DocumentNumber != want.DocumentNumber || got.Email != want.Email ||
		got.FileComplete != want.FileComplete {
		t.Fatalf("base fields mismatch: %+v", got)
	}
	if got.FirstName != want.FirstName || got.LastName != want.LastName ||
		got.AccessUser != want.AccessUser || got.Treatment != want.Treatment ||
		got.Greeting != want.Greeting || got.UserName != want.UserName ||
		got.Initials != want.Initials ||
		got.RoleType != want.RoleType || got.AssignedScheduleID != want.AssignedScheduleID {
		t.Fatalf("identity fields mismatch: %+v", got)
	}
	if math.Abs(got.HourlyRate-want.HourlyRate) > 0.001 {
		t.Fatalf("hourly rate mismatch: got %v want %v", got.HourlyRate, want.HourlyRate)
	}
	if got.EmergencyContact != want.EmergencyContact || got.EmergencyRelationship != want.EmergencyRelationship ||
		got.Allergies != want.Allergies || got.BloodType != want.BloodType ||
		got.Eps != want.Eps || got.CompensationFund != want.CompensationFund {
		t.Fatalf("health/emergency fields mismatch: %+v", got)
	}
	if got.HireDate != want.HireDate || got.TerminationDate != want.TerminationDate || got.Birthday != want.Birthday {
		t.Fatalf("date fields mismatch: hire=%q termination=%q birthday=%q", got.HireDate, got.TerminationDate, got.Birthday)
	}
	if got.TerminationReason != want.TerminationReason || got.ResidentialAddress != want.ResidentialAddress ||
		got.Gender != want.Gender ||
		got.RegistrationTermsAccepted != want.RegistrationTermsAccepted ||
		got.RegistrationPrivacyAccepted != want.RegistrationPrivacyAccepted {
		t.Fatalf("contract fields mismatch: %+v", got)
	}
}

func TestEmployeeProfileRoundTrip(t *testing.T) {
	db := openTestDB(t)
	service := NewService(db)

	suffix := fmt.Sprintf("%d", time.Now().UnixNano())
	want := fullEmployeeProfileRequest(suffix)

	var createdID string
	t.Cleanup(func() { cleanupEmployeeArtifacts(t, db, createdID, want.Role, want.Department) })

	t.Run("crea con todos los campos y Get devuelve round-trip identico", func(t *testing.T) {
		created, err := service.CreateEmployee(testCompanyID, want)
		if err != nil {
			t.Fatalf("CreateEmployee returned error: %v", err)
		}
		createdID = created.ID

		got, err := service.GetEmployee(testCompanyID, created.ID)
		if err != nil {
			t.Fatalf("GetEmployee returned error: %v", err)
		}
		assertEmployeeMatchesProfile(t, got, want)
	})

	t.Run("actualiza todos los campos y Get verifica cada uno", func(t *testing.T) {
		updated := want
		updated.FirstName = "QAEditada"
		updated.LastName = "QAEditadoApellido"
		updated.AccessUser = "qa.access.editado"
		updated.Treatment = "Sr."
		updated.Greeting = "Cordial saludo"
		updated.UserName = "qa.user.editado"
		updated.Initials = "QE"
		updated.EmailPassword = "ClaveNueva#456"
		updated.RoleType = "OP"
		updated.AssignedScheduleID = "schedule-qa-2"
		updated.HourlyRate = 91250.75
		updated.EmergencyContact = "Contacto Editado"
		updated.EmergencyRelationship = "Padre"
		updated.Allergies = "Mariscos"
		updated.BloodType = "A-"
		updated.Eps = "Nueva EPS"
		updated.CompensationFund = "Colsubsidio"
		updated.HireDate = "2025-06-01"
		updated.TerminationDate = "2027-01-31"
		updated.Birthday = "1988-11-02"
		updated.TerminationReason = "Renuncia voluntaria"
		updated.ResidentialAddress = "Carrera 9 # 8-7, Medellin"
		updated.Gender = "Masculino"
		updated.RegistrationTermsAccepted = true
		updated.RegistrationPrivacyAccepted = false
		updated.FileComplete = true
		updated.Status = "Licencia"

		if _, err := service.UpdateEmployee(testCompanyID, createdID, UpdateEmployeeRequest(updated)); err != nil {
			t.Fatalf("UpdateEmployee returned error: %v", err)
		}

		got, err := service.GetEmployee(testCompanyID, createdID)
		if err != nil {
			t.Fatalf("GetEmployee after update returned error: %v", err)
		}
		assertEmployeeMatchesProfile(t, got, updated)
	})
}

func TestEmployeeProfileOptionalFieldsEmpty(t *testing.T) {
	db := openTestDB(t)
	service := NewService(db)

	suffix := fmt.Sprintf("%d", time.Now().UnixNano())
	role := fmt.Sprintf("QA Cargo Min %s", suffix)
	department := fmt.Sprintf("QA Dept Min %s", suffix)

	var createdID string
	t.Cleanup(func() { cleanupEmployeeArtifacts(t, db, createdID, role, department) })

	created, err := service.CreateEmployee(testCompanyID, CreateEmployeeRequest{
		Name:       fmt.Sprintf("QA Minimo %s", suffix),
		Role:       role,
		Department: department,
	})
	if err != nil {
		t.Fatalf("CreateEmployee with optional fields empty returned error: %v", err)
	}
	createdID = created.ID

	got, err := service.GetEmployee(testCompanyID, created.ID)
	if err != nil {
		t.Fatalf("GetEmployee returned error: %v", err)
	}
	if got.HireDate != "" || got.TerminationDate != "" || got.Birthday != "" {
		t.Fatalf("expected empty dates for NULL columns, got hire=%q termination=%q birthday=%q", got.HireDate, got.TerminationDate, got.Birthday)
	}
	if got.HourlyRate != 0 {
		t.Fatalf("expected zero hourly rate, got %v", got.HourlyRate)
	}
	if got.FirstName != "" || got.Initials != "" || got.Gender != "" {
		t.Fatalf("expected empty defaults for optional text fields, got %+v", got)
	}
	if got.RegistrationTermsAccepted || got.RegistrationPrivacyAccepted || got.FileComplete {
		t.Fatalf("expected false acceptance flags, got %+v", got)
	}
}

func TestEmployeeProfileInvalidDates(t *testing.T) {
	db := openTestDB(t)
	service := NewService(db)

	suffix := fmt.Sprintf("%d", time.Now().UnixNano())
	base := fullEmployeeProfileRequest(suffix)

	t.Run("crear con fecha invalida devuelve error de validacion", func(t *testing.T) {
		req := base
		req.HireDate = "15/01/2026"
		_, err := service.CreateEmployee(testCompanyID, req)
		if !errors.Is(err, errEmployeeDateInvalid) {
			t.Fatalf("expected errEmployeeDateInvalid, got %v", err)
		}
	})

	t.Run("actualizar con fecha invalida devuelve error de validacion", func(t *testing.T) {
		created, err := service.CreateEmployee(testCompanyID, base)
		if err != nil {
			t.Fatalf("CreateEmployee returned error: %v", err)
		}
		t.Cleanup(func() { cleanupEmployeeArtifacts(t, db, created.ID, base.Role, base.Department) })

		req := UpdateEmployeeRequest(base)
		req.Birthday = "1990-5-2"
		_, err = service.UpdateEmployee(testCompanyID, created.ID, req)
		if !errors.Is(err, errEmployeeDateInvalid) {
			t.Fatalf("expected errEmployeeDateInvalid, got %v", err)
		}
	})
}
