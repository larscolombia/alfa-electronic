package hr

import "time"

// EmployeeDocument es la metadata de un soporte del expediente del empleado.
// El contenido (data URL base64) solo se expone en la descarga.
type EmployeeDocument struct {
	ID         string    `json:"id"`
	EmployeeID string    `json:"employeeId"`
	Category   string    `json:"category"`
	FileName   string    `json:"fileName"`
	MimeType   string    `json:"mimeType"`
	SizeBytes  int64     `json:"sizeBytes"`
	Required   bool      `json:"required"`
	Notes      string    `json:"notes"`
	UploadedAt time.Time `json:"uploadedAt"`
}

// EmployeeDocumentData es el payload de descarga/previsualizacion.
type EmployeeDocumentData struct {
	FileName string `json:"fileName"`
	MimeType string `json:"mimeType"`
	Data     string `json:"data"`
}

// CreateEmployeeDocumentRequest es el body del upload; Data es un data URL
// base64 obligatorio con un maximo de ~8MB binarios.
type CreateEmployeeDocumentRequest struct {
	Category string `json:"category"`
	FileName string `json:"fileName"`
	MimeType string `json:"mimeType"`
	Data     string `json:"data"`
	Required bool   `json:"required"`
	Notes    string `json:"notes"`
}
