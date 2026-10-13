package crm

type CatalogItem struct {
	ID   string `json:"id"`
	Name string `json:"name"`
}

type CatalogsResponse struct {
	Employees  []CatalogItem `json:"employees"`
	Sources    []CatalogItem `json:"sources"`
	Categories []CatalogItem `json:"categories"`
	Services   []CatalogItem `json:"services"`
	Zones      []CatalogItem `json:"zones"`
}

type Branch struct {
	ID          string `json:"id"`
	Name        string `json:"name"`
	ContactName string `json:"contactName"`
	ContactRole string `json:"contactRole"`
	Email       string `json:"email"`
	Phone       string `json:"phone"`
	Country     string `json:"country"`
	City        string `json:"city"`
	Address     string `json:"address"`
	IsPrimary   bool   `json:"isPrimary"`
	CreatedAt   string `json:"createdAt"`
	UpdatedAt   string `json:"updatedAt"`
}

type UpsertBranchRequest struct {
	Name        string `json:"name"`
	ContactName string `json:"contactName"`
	ContactRole string `json:"contactRole"`
	Email       string `json:"email"`
	Phone       string `json:"phone"`
	Country     string `json:"country"`
	City        string `json:"city"`
	Address     string `json:"address"`
	IsPrimary   bool   `json:"isPrimary"`
}

type Prospect struct {
	ID               string   `json:"id"`
	Salutation       string   `json:"salutation"`
	Name             string   `json:"name"`
	Email            string   `json:"email"`
	Mobile           string   `json:"mobile"`
	Company          string   `json:"company"`
	Nit              string   `json:"nit"`
	AssignedEmployee string   `json:"assignedEmployee"`
	Source           string   `json:"source"`
	Category         string   `json:"category"`
	Zone             string   `json:"zone"`
	ProspectValue    int64    `json:"prospectValue"`
	AllowFollowUp    bool     `json:"allowFollowUp"`
	Status           string   `json:"status"`
	Service          string   `json:"service"`
	Note             string   `json:"note"`
	Website          string   `json:"website"`
	OfficePhone      string   `json:"officePhone"`
	Country          string   `json:"country"`
	City             string   `json:"city"`
	Address          string   `json:"address"`
	Branches         []Branch `json:"branches"`
	Quotations       int      `json:"quotations"`
	CreatedAt        string   `json:"createdAt"`
	UpdatedAt        string   `json:"updatedAt"`
}

type ProspectListQuery struct {
	Search string
	Status string
	Limit  int
}

type UpsertProspectRequest struct {
	Salutation       string                `json:"salutation"`
	Name             string                `json:"name"`
	Email            string                `json:"email"`
	Mobile           string                `json:"mobile"`
	Company          string                `json:"company"`
	Nit              string                `json:"nit"`
	AssignedEmployee string                `json:"assignedEmployee"`
	Source           string                `json:"source"`
	Category         string                `json:"category"`
	Zone             string                `json:"zone"`
	ProspectValue    int64                 `json:"prospectValue"`
	AllowFollowUp    *bool                 `json:"allowFollowUp,omitempty"`
	Status           string                `json:"status"`
	Service          string                `json:"service"`
	Note             string                `json:"note"`
	Website          string                `json:"website"`
	OfficePhone      string                `json:"officePhone"`
	Country          string                `json:"country"`
	City             string                `json:"city"`
	Address          string                `json:"address"`
	Branches         []UpsertBranchRequest `json:"branches"`
	Quotations       *int                  `json:"quotations,omitempty"`
}

type UpdateProspectNoteRequest struct {
	Note string `json:"note"`
}

type ProspectContact struct {
	ID         string `json:"id"`
	ProspectID string `json:"prospectId"`
	Name       string `json:"name"`
	Email      string `json:"email"`
	Phone      string `json:"phone"`
	Role       string `json:"role"`
	Notes      string `json:"notes"`
	CreatedAt  string `json:"createdAt"`
	UpdatedAt  string `json:"updatedAt"`
}

type UpsertProspectContactRequest struct {
	Name  string `json:"name"`
	Email string `json:"email"`
	Phone string `json:"phone"`
	Role  string `json:"role"`
	Notes string `json:"notes"`
}

type ClientContact struct {
	ID        string `json:"id"`
	ClientID  string `json:"clientId"`
	Name      string `json:"name"`
	Role      string `json:"role"`
	Email     string `json:"email"`
	Phone     string `json:"phone"`
	Notes     string `json:"notes"`
	CreatedAt string `json:"createdAt"`
	UpdatedAt string `json:"updatedAt"`
}

type UpsertClientContactRequest struct {
	Name  string `json:"name"`
	Role  string `json:"role"`
	Email string `json:"email"`
	Phone string `json:"phone"`
	Notes string `json:"notes"`
}

type ProspectFollowup struct {
	ID           string `json:"id"`
	ProspectID   string `json:"prospectId"`
	Tipo         string `json:"tipo"`
	Fecha        string `json:"fecha"`
	Hora         string `json:"hora"`
	Recordatorio string `json:"recordatorio"`
	Observacion  string `json:"observacion"`
	Estado       string `json:"estado"`
	SoftDelete   bool   `json:"softDelete"`
	CreatedAt    string `json:"createdAt"`
	UpdatedAt    string `json:"updatedAt"`
}

type UpsertProspectFollowupRequest struct {
	Tipo         string `json:"tipo"`
	Fecha        string `json:"fecha"`
	Hora         string `json:"hora"`
	Recordatorio string `json:"recordatorio"`
	Observacion  string `json:"observacion"`
	Estado       string `json:"estado"`
}

type ClientCreditProfile struct {
	Enabled         bool    `json:"enabled"`
	CreditLimit     float64 `json:"creditLimit"`
	Consumed        float64 `json:"consumed"`
	LastPaymentDate string  `json:"lastPaymentDate"`
	PaymentTermDays int     `json:"paymentTermDays"`
}

type Client struct {
	ID          string              `json:"id"`
	Nombre      string              `json:"nombre"`
	Correo      string              `json:"correo"`
	Empresa     string              `json:"empresa"`
	Nit         string              `json:"nit"`
	Zona        string              `json:"zona"`
	Estado      string              `json:"estado"`
	Website     string              `json:"website"`
	OfficePhone string              `json:"officePhone"`
	Country     string              `json:"country"`
	City        string              `json:"city"`
	Address     string              `json:"address"`
	Creado      string              `json:"creado"`
	Credito     ClientCreditProfile `json:"credito"`
	Branches    []Branch            `json:"branches"`
}

type ClientListQuery struct {
	Search string
	Status string
	Limit  int
}

type UpsertClientRequest struct {
	Nombre      string                `json:"nombre"`
	Correo      string                `json:"correo"`
	Empresa     string                `json:"empresa"`
	Nit         string                `json:"nit"`
	Zona        string                `json:"zona"`
	Estado      string                `json:"estado"`
	Website     string                `json:"website"`
	OfficePhone string                `json:"officePhone"`
	Country     string                `json:"country"`
	City        string                `json:"city"`
	Address     string                `json:"address"`
	Credito     ClientCreditProfile   `json:"credito"`
	Branches    []UpsertBranchRequest `json:"branches"`
}
