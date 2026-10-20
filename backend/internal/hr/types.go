package hr

import "time"

type CatalogItem struct {
	ID   string `json:"id"`
	Name string `json:"name"`
}

type CatalogSyncRequest struct {
	Positions   []string `json:"positions"`
	Departments []string `json:"departments"`
}

type CatalogsResponse struct {
	Positions   []CatalogItem `json:"positions"`
	Departments []CatalogItem `json:"departments"`
}

// EmployeeProfileFields agrupa los campos extendidos de la ficha del empleado.
// Se embebe en Employee, CreateEmployeeRequest y UpdateEmployeeRequest; el JSON
// queda plano (camelCase). Las fechas viajan como "YYYY-MM-DD" o "" (NULL en DB).
// EmailPassword NO está aquí a propósito: es un secreto que solo entra (requests)
// y nunca se serializa en respuestas (riesgo habeas data, Fase 2).
type EmployeeProfileFields struct {
	FirstName                   string  `json:"firstName"`
	LastName                    string  `json:"lastName"`
	AccessUser                  string  `json:"accessUser"`
	Treatment                   string  `json:"treatment"`
	Greeting                    string  `json:"greeting"`
	UserName                    string  `json:"userName"`
	Initials                    string  `json:"initials"`
	RoleType                    string  `json:"roleType"`
	AssignedScheduleID          string  `json:"assignedScheduleId"`
	HourlyRate                  float64 `json:"hourlyRate"`
	EmergencyContact            string  `json:"emergencyContact"`
	EmergencyRelationship       string  `json:"emergencyRelationship"`
	Allergies                   string  `json:"allergies"`
	BloodType                   string  `json:"bloodType"`
	Eps                         string  `json:"eps"`
	CompensationFund            string  `json:"compensationFund"`
	HireDate                    string  `json:"hireDate"`
	TerminationDate             string  `json:"terminationDate"`
	Birthday                    string  `json:"birthday"`
	TerminationReason           string  `json:"terminationReason"`
	ResidentialAddress          string  `json:"residentialAddress"`
	Gender                      string  `json:"gender"`
	RegistrationTermsAccepted   bool    `json:"registrationTermsAccepted"`
	RegistrationPrivacyAccepted bool    `json:"registrationPrivacyAccepted"`
	// PhotoData viaja como data URL de imagen (data:image/...;base64,...) o "".
	PhotoData string `json:"photoData"`
}

type Employee struct {
	ID             string `json:"id"`
	Name           string `json:"name"`
	Role           string `json:"role"`
	Department     string `json:"department"`
	Manager        string `json:"manager"`
	Status         string `json:"status"`
	DocumentNumber string `json:"documentNumber"`
	Email          string `json:"email"`
	// FileComplete se persiste como: fileComplete del request OR (terms AND privacy).
	FileComplete bool `json:"fileComplete"`
	EmployeeProfileFields
}

type CreateEmployeeRequest struct {
	Name           string `json:"name"`
	Role           string `json:"role"`
	Department     string `json:"department"`
	Manager        string `json:"manager"`
	Status         string `json:"status"`
	DocumentNumber string `json:"documentNumber"`
	Email          string `json:"email"`
	FileComplete   bool   `json:"fileComplete"`
	// EmailPassword es solo entrada: se persiste pero nunca se devuelve.
	EmailPassword string `json:"emailPassword"`
	EmployeeProfileFields
}

type UpdateEmployeeRequest struct {
	Name           string `json:"name"`
	Role           string `json:"role"`
	Department     string `json:"department"`
	Manager        string `json:"manager"`
	Status         string `json:"status"`
	DocumentNumber string `json:"documentNumber"`
	Email          string `json:"email"`
	FileComplete   bool   `json:"fileComplete"`
	// EmailPassword vacío preserva el valor guardado (el cliente ya no lo recibe).
	EmailPassword string `json:"emailPassword"`
	EmployeeProfileFields
}

type ResetEmployeePasswordResponse struct {
	Message    string    `json:"message"`
	ResetToken string    `json:"resetToken"`
	ExpiresAt  time.Time `json:"expiresAt"`
}

type EmployeeSoftDeletePayload struct {
	EmployeeID  string `json:"employeeId"`
	Action      string `json:"action"`
	Status      string `json:"status"`
	SoftDelete  bool   `json:"softDelete"`
	RequestedAt string `json:"requestedAt"`
	Source      string `json:"source"`
}
