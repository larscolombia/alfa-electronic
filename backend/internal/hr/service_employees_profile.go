package hr

import (
	"net/mail"
	"regexp"
	"strings"
	"time"
)

var employeeDatePattern = regexp.MustCompile(`^\d{4}-\d{2}-\d{2}$`)

type employeeScanner interface {
	Scan(dest ...any) error
}

// scanEmployee lee una fila de hr_employees en el orden exacto de employeeColumns.
// email_password se descarta a propósito: nunca sale del backend (Fase 2, habeas data).
func scanEmployee(scanner employeeScanner, row *Employee) error {
	var emailPasswordDiscard string
	return scanner.Scan(
		&row.ID,
		&row.Name,
		&row.Role,
		&row.Department,
		&row.Manager,
		&row.Status,
		&row.DocumentNumber,
		&row.Email,
		&row.FileComplete,
		&row.FirstName,
		&row.LastName,
		&row.AccessUser,
		&row.Treatment,
		&row.Greeting,
		&row.UserName,
		&row.Initials,
		&emailPasswordDiscard,
		&row.RoleType,
		&row.AssignedScheduleID,
		&row.HourlyRate,
		&row.EmergencyContact,
		&row.EmergencyRelationship,
		&row.Allergies,
		&row.BloodType,
		&row.Eps,
		&row.CompensationFund,
		&row.HireDate,
		&row.TerminationDate,
		&row.Birthday,
		&row.TerminationReason,
		&row.ResidentialAddress,
		&row.Gender,
		&row.RegistrationTermsAccepted,
		&row.RegistrationPrivacyAccepted,
		&row.PhotoData,
	)
}

// validateEmployeeProfileDates valida el formato YYYY-MM-DD; "" significa NULL.
func validateEmployeeProfileDates(dates ...string) error {
	for _, value := range dates {
		trimmed := strings.TrimSpace(value)
		if trimmed == "" {
			continue
		}
		if !employeeDatePattern.MatchString(trimmed) {
			return errEmployeeDateInvalid
		}
		if _, err := time.Parse("2006-01-02", trimmed); err != nil {
			return errEmployeeDateInvalid
		}
	}
	return nil
}

// nullableEmployeeDate convierte "" en nil para persistir NULL en columnas DATE.
func nullableEmployeeDate(value string) any {
	trimmed := strings.TrimSpace(value)
	if trimmed == "" {
		return nil
	}
	return trimmed
}

// deriveEmployeeFileComplete conserva el flag legacy y además marca completo
// cuando ambos consentimientos fueron aceptados.
func deriveEmployeeFileComplete(fileComplete bool, profile EmployeeProfileFields) bool {
	return fileComplete || (profile.RegistrationTermsAccepted && profile.RegistrationPrivacyAccepted)
}

// normalizeEmployeeProfileFields recorta espacios de los campos de texto de la ficha.
// EmailPassword se conserva tal cual (es una clave registrada por el cliente).
func normalizeEmployeeProfileFields(profile EmployeeProfileFields) EmployeeProfileFields {
	profile.FirstName = strings.TrimSpace(profile.FirstName)
	profile.LastName = strings.TrimSpace(profile.LastName)
	profile.AccessUser = strings.TrimSpace(profile.AccessUser)
	profile.Treatment = strings.TrimSpace(profile.Treatment)
	profile.Greeting = strings.TrimSpace(profile.Greeting)
	profile.UserName = strings.TrimSpace(profile.UserName)
	profile.Initials = strings.TrimSpace(profile.Initials)
	profile.RoleType = strings.TrimSpace(profile.RoleType)
	profile.AssignedScheduleID = strings.TrimSpace(profile.AssignedScheduleID)
	profile.EmergencyContact = strings.TrimSpace(profile.EmergencyContact)
	profile.EmergencyRelationship = strings.TrimSpace(profile.EmergencyRelationship)
	profile.Allergies = strings.TrimSpace(profile.Allergies)
	profile.BloodType = strings.TrimSpace(profile.BloodType)
	profile.Eps = strings.TrimSpace(profile.Eps)
	profile.CompensationFund = strings.TrimSpace(profile.CompensationFund)
	profile.HireDate = strings.TrimSpace(profile.HireDate)
	profile.TerminationDate = strings.TrimSpace(profile.TerminationDate)
	profile.Birthday = strings.TrimSpace(profile.Birthday)
	profile.TerminationReason = strings.TrimSpace(profile.TerminationReason)
	profile.ResidentialAddress = strings.TrimSpace(profile.ResidentialAddress)
	profile.Gender = strings.TrimSpace(profile.Gender)
	return profile
}

func validateEmployeeStatus(value string) (string, error) {
	trimmed := strings.TrimSpace(value)
	if trimmed == "" {
		return "Activo", nil
	}
	switch strings.ToLower(trimmed) {
	case "activo", "active":
		return "Activo", nil
	case "inactivo", "inactive":
		return "Inactivo", nil
	case "licencia", "leave":
		return "Licencia", nil
	default:
		return "", errEmployeeStatusInvalid
	}
}

func normalizeEmployeeEmail(value string) (string, error) {
	email := strings.ToLower(strings.TrimSpace(value))
	if email == "" {
		return "", nil
	}
	if _, err := mail.ParseAddress(email); err != nil {
		return "", errEmployeeEmailInvalid
	}
	return email, nil
}
