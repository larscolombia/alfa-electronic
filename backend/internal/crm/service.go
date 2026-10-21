package crm

import (
	"database/sql"
	"errors"
	"regexp"
)

const (
	CatalogTypeEmployees  = "employees"
	CatalogTypeSources    = "sources"
	CatalogTypeCategories = "categories"
	CatalogTypeServices   = "services"
	CatalogTypeZones      = "zones"

	ProspectStatusPending   = "Pendiente"
	ProspectStatusInProcess = "En proceso"
	ProspectStatusClosed    = "Cerrado"

	ClientStatusActive   = "Activo"
	ClientStatusInactive = "Inactivo"

	maxProspectsListLimit = 500
	maxClientsListLimit   = 500

	prospectSelectColumns = `id, salutation, name, email, mobile, company, nit, assigned_employee, source, category,
	zone, prospect_value, allow_follow_up, status, service, note, website, office_phone,
	country, city, address, quotations, created_at, updated_at`
)

var (
	errCatalogTypeInvalid        = errors.New("tipo de catalogo invalido")
	errCatalogNameRequired       = errors.New("el nombre del catalogo es obligatorio")
	errCatalogNameExists         = errors.New("el nombre del catalogo ya existe")
	errCatalogItemIDRequired     = errors.New("el id del item del catalogo es obligatorio")
	errProspectIDRequired        = errors.New("el id del prospecto es obligatorio")
	errProspectNotFound          = errors.New("prospecto no encontrado")
	errProspectNameRequired      = errors.New("el nombre del prospecto es obligatorio")
	errProspectNoteTooLong       = errors.New("la nota no puede superar 5000 caracteres")
	errProspectStatusInvalid     = errors.New("estado del prospecto invalido")
	errProspectValueInvalid      = errors.New("el valor del prospecto no puede ser negativo")
	errProspectQuotationsInvalid = errors.New("las cotizaciones no pueden ser negativas")
	errListLimitInvalid          = errors.New("el limite debe ser mayor que cero")
	errFollowupIDRequired        = errors.New("el id del seguimiento es obligatorio")
	errFollowupNotFound          = errors.New("seguimiento no encontrado")
	errFollowupTypeRequired      = errors.New("el tipo de seguimiento es obligatorio")
	errFollowupDateRequired      = errors.New("la fecha del seguimiento es obligatoria")
	errFollowupTimeRequired      = errors.New("la hora del seguimiento es obligatoria")
	errFollowupStatusInvalid     = errors.New("estado del seguimiento invalido")
	errClientIDRequired          = errors.New("el id del cliente es obligatorio")
	errClientNotFound            = errors.New("cliente no encontrado")
	errClientNameRequired        = errors.New("el nombre del cliente es obligatorio")
	errClientCompanyRequired     = errors.New("la empresa del cliente es obligatoria")
	errClientStatusInvalid       = errors.New("estado del cliente invalido")
	errClientZoneRequired        = errors.New("la zona del cliente es obligatoria")
	errClientCreditLimitInvalid  = errors.New("el cupo maximo debe ser mayor a cero para clientes con credito")
	errClientCreditUsageInvalid  = errors.New("el cupo consumido no puede ser mayor al cupo maximo")
)

var catalogTypeOrder = []string{
	CatalogTypeEmployees,
	CatalogTypeSources,
	CatalogTypeCategories,
	CatalogTypeServices,
	CatalogTypeZones,
}

var defaultCatalogItems = map[string][]string{
	CatalogTypeEmployees:  {"Ana Torres", "Carlos Mendez"},
	CatalogTypeSources:    {"Formulario web", "Referido", "Campana"},
	CatalogTypeCategories: {"Alto valor", "Medio", "Bajo"},
	CatalogTypeServices:   {"Consultoria", "Implementacion", "Soporte"},
	CatalogTypeZones:      {"Bogota", "Medellin", "Cali", "Barranquilla"},
}

type Service struct {
	db *sql.DB
}

type normalizedProspectInput struct {
	Salutation       string
	Name             string
	Email            string
	Mobile           string
	Company          string
	Nit              string
	AssignedEmployee string
	Source           string
	Category         string
	Zone             string
	ProspectValue    int64
	AllowFollowUp    bool
	Status           string
	Service          string
	Note             string
	Website          string
	OfficePhone      string
	Country          string
	City             string
	Address          string
	Branches         []normalizedBranchInput
	Quotations       int
}

type normalizedClientInput struct {
	Nombre      string
	Correo      string
	Empresa     string
	Nit         string
	Zona        string
	Estado      string
	Website     string
	OfficePhone string
	Country     string
	City        string
	Address     string
	// Fase 5b: datos fiscales.
	DV               string
	PostalCode       string
	BillingEmail     string
	GrandContributor bool
	IDType           string
	CreditEnabled    bool
	CreditLimit      float64
	CreditConsumed   float64
	LastPaymentDate  string
	PaymentTermDays  int
	Branches         []normalizedBranchInput
}

// validationError represents an input validation failure that handlers return as HTTP 400.
type validationError struct{ msg string }

func (e *validationError) Error() string { return e.msg }

func newValidationError(msg string) *validationError {
	return &validationError{msg: msg}
}

// Compiled validation patterns reused across service calls.
var (
	reEmail = regexp.MustCompile(`^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$`)
	rePhone = regexp.MustCompile(`^[\d\s+\-().]+$`)
)

func NewService(db *sql.DB) *Service {
	return &Service{db: db}
}
