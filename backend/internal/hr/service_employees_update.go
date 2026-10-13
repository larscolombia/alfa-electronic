package hr

import (
	"context"
	"database/sql"
	"errors"
	"strings"

	"github.com/google/uuid"
)

const employeeColumns = `id, name, role, department, manager, status, document_number, email, file_complete, ` +
	`first_name, last_name, access_user, treatment, greeting, user_name, initials, ` +
	`email_password, role_type, assigned_schedule_id, hourly_rate, emergency_contact, ` +
	`emergency_relationship, allergies, blood_type, eps, compensation_fund, ` +
	`COALESCE(hire_date::text, ''), COALESCE(termination_date::text, ''), COALESCE(birthday::text, ''), ` +
	`termination_reason, residential_address, gender, registration_terms_accepted, registration_privacy_accepted, ` +
	`photo_data`

func (s *Service) GetEmployee(companyID, id string) (Employee, error) {
	ctx := context.Background()
	if err := s.ensureCompanyDefaults(ctx, companyID); err != nil {
		return Employee{}, err
	}
	return s.findEmployee(ctx, companyID, strings.TrimSpace(id))
}

func (s *Service) findEmployee(ctx context.Context, companyID, id string) (Employee, error) {
	var row Employee
	err := scanEmployee(s.db.QueryRowContext(ctx, `
SELECT `+employeeColumns+`
FROM hr_employees
WHERE company_id = $1
  AND id = $2
  AND soft_delete = false;
`, companyID, id), &row)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return Employee{}, errEmployeeNotFound
		}
		return Employee{}, err
	}
	return row, nil
}

func (s *Service) UpdateEmployee(companyID, id string, req UpdateEmployeeRequest) (Employee, error) {
	ctx := context.Background()
	if err := s.ensureCompanyDefaults(ctx, companyID); err != nil {
		return Employee{}, err
	}

	targetID := strings.TrimSpace(id)
	name := strings.TrimSpace(req.Name)
	if name == "" {
		return Employee{}, errEmployeeNameMissing
	}

	status, err := validateEmployeeStatus(req.Status)
	if err != nil {
		return Employee{}, err
	}

	email, err := normalizeEmployeeEmail(req.Email)
	if err != nil {
		return Employee{}, err
	}

	if err := validateEmployeeProfileDates(req.HireDate, req.TerminationDate, req.Birthday); err != nil {
		return Employee{}, err
	}

	if err := validateEmployeePhoto(req.PhotoData); err != nil {
		return Employee{}, err
	}

	employee := Employee{
		ID:                    targetID,
		Name:                  name,
		Role:                  strings.TrimSpace(req.Role),
		Department:            strings.TrimSpace(req.Department),
		Manager:               strings.TrimSpace(req.Manager),
		Status:                status,
		DocumentNumber:        strings.TrimSpace(req.DocumentNumber),
		Email:                 email,
		FileComplete:          deriveEmployeeFileComplete(req.FileComplete, req.EmployeeProfileFields),
		EmployeeProfileFields: normalizeEmployeeProfileFields(req.EmployeeProfileFields),
	}
	if employee.Role == "" {
		employee.Role = defaultPositionNames()[0]
	}
	if employee.Department == "" {
		employee.Department = defaultDepartmentNames()[0]
	}
	if employee.Manager == "" {
		employee.Manager = "Direccion General"
	}

	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return Employee{}, err
	}

	result, err := tx.ExecContext(ctx, `
UPDATE hr_employees
SET name = $3,
    role = $4,
    department = $5,
    manager = $6,
    status = $7,
    document_number = $8,
    email = $9,
    file_complete = $10,
    first_name = $11,
    last_name = $12,
    access_user = $13,
    treatment = $14,
    greeting = $15,
    user_name = $16,
    initials = $17,
    email_password = $18,
    role_type = $19,
    assigned_schedule_id = $20,
    hourly_rate = $21,
    emergency_contact = $22,
    emergency_relationship = $23,
    allergies = $24,
    blood_type = $25,
    eps = $26,
    compensation_fund = $27,
    hire_date = NULLIF($28::text, '')::date,
    termination_date = NULLIF($29::text, '')::date,
    birthday = NULLIF($30::text, '')::date,
    termination_reason = $31,
    residential_address = $32,
    gender = $33,
    registration_terms_accepted = $34,
    registration_privacy_accepted = $35,
    photo_data = $36,
    updated_at = NOW()
WHERE company_id = $1
  AND id = $2
  AND soft_delete = false;
`, companyID, targetID, employee.Name, employee.Role, employee.Department, employee.Manager, employee.Status,
		employee.DocumentNumber, employee.Email, employee.FileComplete,
		employee.FirstName, employee.LastName, employee.AccessUser, employee.Treatment,
		employee.Greeting, employee.UserName, employee.Initials, employee.EmailPassword,
		employee.RoleType, employee.AssignedScheduleID, employee.HourlyRate,
		employee.EmergencyContact, employee.EmergencyRelationship, employee.Allergies,
		employee.BloodType, employee.Eps, employee.CompensationFund,
		employee.HireDate, employee.TerminationDate, employee.Birthday,
		employee.TerminationReason, employee.ResidentialAddress, employee.Gender,
		employee.RegistrationTermsAccepted, employee.RegistrationPrivacyAccepted,
		employee.PhotoData)
	if err != nil {
		tx.Rollback()
		return Employee{}, err
	}
	if affected, _ := result.RowsAffected(); affected == 0 {
		tx.Rollback()
		return Employee{}, errEmployeeNotFound
	}

	if err := upsertEmployeeCatalogs(ctx, tx, companyID, employee.Role, employee.Department); err != nil {
		tx.Rollback()
		return Employee{}, err
	}

	if err := tx.Commit(); err != nil {
		return Employee{}, err
	}

	return employee, nil
}

func upsertEmployeeCatalogs(ctx context.Context, tx *sql.Tx, companyID, role, department string) error {
	if _, err := tx.ExecContext(ctx, `
INSERT INTO hr_positions (id, company_id, name, is_active, created_at, updated_at)
SELECT $1, $2, $3::text, true, NOW(), NOW()
WHERE NOT EXISTS (
SELECT 1
FROM hr_positions
WHERE company_id = $2
  AND LOWER(name) = LOWER($3::text)
);
`, uuid.NewString(), companyID, role); err != nil {
		return err
	}

	if _, err := tx.ExecContext(ctx, `
INSERT INTO hr_departments (id, company_id, name, is_active, created_at, updated_at)
SELECT $1, $2, $3::text, true, NOW(), NOW()
WHERE NOT EXISTS (
SELECT 1
FROM hr_departments
WHERE company_id = $2
  AND LOWER(name) = LOWER($3::text)
);
`, uuid.NewString(), companyID, department); err != nil {
		return err
	}

	return nil
}
