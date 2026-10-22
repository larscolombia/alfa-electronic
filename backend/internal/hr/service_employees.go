package hr

import (
	"context"
	"strings"

	"github.com/google/uuid"
)

func (s *Service) ListEmployees(companyID string) ([]Employee, error) {
	ctx := context.Background()
	if err := s.ensureCompanyDefaults(ctx, companyID); err != nil {
		return nil, err
	}

	rows, err := s.db.QueryContext(ctx, `
SELECT `+employeeColumns+`
FROM hr_employees
WHERE company_id = $1
  AND soft_delete = false
ORDER BY id ASC;
`, companyID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	employees := make([]Employee, 0)
	for rows.Next() {
		var row Employee
		if err := scanEmployee(rows, &row); err != nil {
			return nil, err
		}
		employees = append(employees, row)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return employees, nil
}

func (s *Service) CreateEmployee(companyID string, req CreateEmployeeRequest) (Employee, error) {
	ctx := context.Background()
	if err := s.ensureCompanyDefaults(ctx, companyID); err != nil {
		return Employee{}, err
	}

	name := strings.TrimSpace(req.Name)
	if name == "" {
		return Employee{}, errEmployeeNameMissing
	}

	role := strings.TrimSpace(req.Role)
	if role == "" {
		role = defaultPositionNames()[0]
	}

	department := strings.TrimSpace(req.Department)
	if department == "" {
		department = defaultDepartmentNames()[0]
	}

	email, err := normalizeEmployeeEmail(req.Email)
	if err != nil {
		return Employee{}, err
	}
	// Identidad unificada: el correo es la identidad de login, así que un
	// empleado sin correo no puede existir (y por tanto tampoco sin cuenta).
	if email == "" {
		return Employee{}, errEmployeeEmailRequired
	}
	if err := validateAccessPassword(req.Password); err != nil {
		return Employee{}, err
	}
	if err := s.ensureAccessRole(ctx, companyID, req.AccessRole); err != nil {
		return Employee{}, err
	}

	if err := validateEmployeeProfileDates(req.HireDate, req.TerminationDate, req.Birthday); err != nil {
		return Employee{}, err
	}

	if err := validateEmployeePhoto(req.PhotoData); err != nil {
		return Employee{}, err
	}

	nextID, err := s.nextEmployeeCode(ctx, companyID)
	if err != nil {
		return Employee{}, err
	}

	employee := Employee{
		ID:                    nextID,
		Name:                  name,
		Role:                  role,
		Department:            department,
		Manager:               strings.TrimSpace(req.Manager),
		Status:                normalizeEmployeeStatus(req.Status),
		DocumentNumber:        strings.TrimSpace(req.DocumentNumber),
		Email:                 email,
		FileComplete:          deriveEmployeeFileComplete(req.FileComplete, req.EmployeeProfileFields),
		EmployeeProfileFields: normalizeEmployeeProfileFields(req.EmployeeProfileFields),
	}
	if employee.Manager == "" {
		employee.Manager = "Direccion General"
	}

	// Un documento que choque con el id o el documento de OTRO empleado
	// corrompe el directorio (pasó con el default "EMP-001" del formulario
	// pre-cargado), así que se rechaza antes de abrir la transacción.
	documentNumberOK, err := s.documentNumberAvailable(ctx, companyID, employee.DocumentNumber, employee.ID)
	if err != nil {
		return Employee{}, err
	}
	if !documentNumberOK {
		return Employee{}, errEmployeeDocumentNumberConflict
	}

	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return Employee{}, err
	}

	// Cuenta y empleado en la MISMA transacción: no puede quedar un empleado
	// sin usuario ni un usuario huérfano. Si el correo ya tenía cuenta (p. ej.
	// entró por el signup público), se enlaza en vez de fallar.
	accessActive := employee.Status == "Activo"
	userID, err := resolveOrCreateAccessUser(ctx, tx, companyID, email, name, strings.TrimSpace(req.AccessRole), req.Password, accessActive)
	if err != nil {
		tx.Rollback()
		return Employee{}, err
	}
	employee.UserID = userID

	if _, err := tx.ExecContext(ctx, `
INSERT INTO hr_employees (
company_id, id, name, role, department, manager, status, document_number, email, file_complete,
first_name, last_name, access_user, treatment, greeting, user_name, initials,
email_password, role_type, assigned_schedule_id, hourly_rate, emergency_contact,
emergency_relationship, allergies, blood_type, eps, compensation_fund,
hire_date, termination_date, birthday,
termination_reason, residential_address, gender,
registration_terms_accepted, registration_privacy_accepted, photo_data,
soft_delete, created_at, updated_at
)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
$11, $12, $13, $14, $15, $16, $17,
$18, $19, $20, $21, $22,
$23, $24, $25, $26, $27,
NULLIF($28::text, '')::date, NULLIF($29::text, '')::date, NULLIF($30::text, '')::date,
$31, $32, $33,
$34, $35, $36,
false, NOW(), NOW());
`, companyID, employee.ID, employee.Name, employee.Role, employee.Department, employee.Manager, employee.Status,
		employee.DocumentNumber, employee.Email, employee.FileComplete,
		employee.FirstName, employee.LastName, employee.AccessUser, employee.Treatment,
		employee.Greeting, employee.UserName, employee.Initials, req.EmailPassword,
		employee.RoleType, employee.AssignedScheduleID, employee.HourlyRate, employee.EmergencyContact,
		employee.EmergencyRelationship, employee.Allergies, employee.BloodType, employee.Eps, employee.CompensationFund,
		employee.HireDate, employee.TerminationDate, employee.Birthday,
		employee.TerminationReason, employee.ResidentialAddress, employee.Gender,
		employee.RegistrationTermsAccepted, employee.RegistrationPrivacyAccepted, employee.PhotoData); err != nil {
		tx.Rollback()
		if isDuplicateEmployeeEmail(err) {
			return Employee{}, errEmployeeEmailExists
		}
		return Employee{}, err
	}

	if _, err := tx.ExecContext(ctx, `
UPDATE hr_employees SET user_id = $1, updated_at = NOW()
WHERE company_id = $2 AND id = $3;
`, userID, companyID, employee.ID); err != nil {
		tx.Rollback()
		return Employee{}, err
	}

	if _, err := tx.ExecContext(ctx, `
INSERT INTO hr_positions (id, company_id, name, is_active, created_at, updated_at)
SELECT $1, $2, $3::text, true, NOW(), NOW()
WHERE NOT EXISTS (
SELECT 1
FROM hr_positions
WHERE company_id = $2
  AND LOWER(name) = LOWER($3::text)
);
`, uuid.NewString(), companyID, employee.Role); err != nil {
		tx.Rollback()
		return Employee{}, err
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
`, uuid.NewString(), companyID, employee.Department); err != nil {
		tx.Rollback()
		return Employee{}, err
	}

	if err := tx.Commit(); err != nil {
		return Employee{}, err
	}

	return employee, nil
}

func (s *Service) SoftDeleteEmployees(companyID string, payloads []EmployeeSoftDeletePayload) (int, error) {
	ctx := context.Background()
	if err := s.ensureCompanyDefaults(ctx, companyID); err != nil {
		return 0, err
	}

	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return 0, err
	}

	processed := 0
	for _, payload := range payloads {
		targetID := strings.TrimSpace(payload.EmployeeID)
		if targetID == "" {
			continue
		}

		result, err := tx.ExecContext(ctx, `
UPDATE hr_employees
SET status = 'Inactivo', soft_delete = true, updated_at = NOW()
WHERE company_id = $1
  AND id = $2
  AND soft_delete = false;
`, companyID, targetID)
		if err != nil {
			tx.Rollback()
			return 0, err
		}

		affected, _ := result.RowsAffected()
		processed += int(affected)
	}

	// Un empleado borrado no debe poder entrar al sistema: se desactiva su
	// cuenta de login (Authenticate exige is_active). Idempotente.
	if _, err := tx.ExecContext(ctx, `
UPDATE users SET is_active = false, updated_at = NOW()
WHERE id IN (
	SELECT user_id FROM hr_employees
	WHERE company_id = $1 AND user_id IS NOT NULL AND soft_delete = true
);
`, companyID); err != nil {
		tx.Rollback()
		return 0, err
	}

	if err := tx.Commit(); err != nil {
		return 0, err
	}

	return processed, nil
}
