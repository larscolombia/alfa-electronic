package equipmentcatalog

// Fase 6 (ítems 1-2): maestros de equipos por empresa. Reemplazan los
// DEFAULT_* hardcodeados que vivían en localStorage
// ("adminux.company.equipment.catalog.v1"), que eran por navegador y no
// podían editarse porque el CRUD no tenía ruta registrada.

// Family es la clasificación de equipo (Servomotores, Variadores, PLC…).
type Family struct {
	ID          string `json:"id"`
	Name        string `json:"name"`
	Description string `json:"description"`
	Active      bool   `json:"active"`
	UpdatedAt   string `json:"updatedAt"`
}

// Model es el modelo industrial homologado que alimenta el selector
// "Modelo industrial" del modal de recepción.
type Model struct {
	ID           string `json:"id"`
	FamilyID     string `json:"familyId"`
	Brand        string `json:"brand"`
	Type         string `json:"type"`
	Series       string `json:"series"`
	IsIndustrial bool   `json:"isIndustrial"`
	Active       bool   `json:"active"`
	Notes        string `json:"notes"`
	UpdatedAt    string `json:"updatedAt"`
}

// ServiceType es el tipo de servicio (Reparación, Venta, Manufactura…).
type ServiceType struct {
	ID          string `json:"id"`
	Name        string `json:"name"`
	Description string `json:"description"`
	Active      bool   `json:"active"`
	UpdatedAt   string `json:"updatedAt"`
}

// Location es la ubicación/estantería donde se guarda el equipo recibido.
type Location struct {
	ID          string `json:"id"`
	Name        string `json:"name"`
	Description string `json:"description"`
	Active      bool   `json:"active"`
	UpdatedAt   string `json:"updatedAt"`
}

// Catalog es la respuesta de GET /equipment-catalog: los cuatro maestros en
// una sola ida, que es como el frontend los consume.
type Catalog struct {
	Families     []Family      `json:"families"`
	Models       []Model       `json:"models"`
	ServiceTypes []ServiceType `json:"serviceTypes"`
	Locations    []Location    `json:"locations"`
}
