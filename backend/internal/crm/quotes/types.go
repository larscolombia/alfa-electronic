package quotes

type Line struct {
	Servicio       string  `json:"servicio"`
	Descripcion    string  `json:"descripcion"`
	Cantidad       float64 `json:"cantidad"`
	Unidad         string  `json:"unidad"`
	PrecioUnitario float64 `json:"precioUnitario"`
	Impuesto       float64 `json:"impuesto"`
}

type Quote struct {
	ID                       string   `json:"id"`
	Token                    string   `json:"token"`
	Codigo                   string   `json:"codigo"`
	Prospecto                string   `json:"prospecto"`
	ProspectID               int64    `json:"prospectId"`
	Empresa                  string   `json:"empresa"`
	Correo                   string   `json:"correo"`
	Movil                    string   `json:"movil"`
	Fecha                    string   `json:"fecha"`
	ValidoHasta              string   `json:"validoHasta"`
	Estado                   string   `json:"estado"`
	Moneda                   string   `json:"moneda"`
	DescuentoTipo            string   `json:"descuentoTipo"`
	DescuentoValor           float64  `json:"descuentoValor"`
	Lineas                   []Line   `json:"lineas"`
	Nota                     string   `json:"nota"`
	Terminos                 string   `json:"terminos"`
	EstadoCliente            string   `json:"estadoCliente"`
	FechaDecision            string   `json:"fechaDecision"`
	FirmadoPor               string   `json:"firmadoPor"`
	FirmanteCorreo           string   `json:"firmanteCorreo"`
	LugarFirma               string   `json:"lugarFirma"`
	FirmaBase64              string   `json:"firmaBase64"`
	Descripcion              string   `json:"descripcion"`
	TaxMode                  string   `json:"taxMode"`
	Zone                     string   `json:"zone"`
	SignatureRequired        bool     `json:"signatureRequired"`
	SelectedEquipmentIDs     []string `json:"selectedEquipmentIds"`
	Subtotal                 float64  `json:"subtotal"`
	TaxTotal                 float64  `json:"taxTotal"`
	Total                    float64  `json:"total"`
	PurchaseOrderNumber      string   `json:"purchaseOrderNumber"`
	PurchaseOrderFileName    string   `json:"purchaseOrderFileName"`
	PurchaseOrderFileDataURL string   `json:"purchaseOrderFileDataUrl"`
	PurchaseOrderDate        string   `json:"purchaseOrderDate"`
	PurchaseOrderUploadedAt  string   `json:"purchaseOrderUploadedAt"`
	// Fase 5b: marca de cotización facturada (la escribe el servicio de
	// finance al convertir; aquí es de solo lectura).
	InvoiceID  *int64 `json:"invoiceId"`
	InvoicedAt string `json:"invoicedAt"`
	CreatedAt  string `json:"createdAt"`
	UpdatedAt  string `json:"updatedAt"`
}

// Public devuelve una copia de la cotización limitada a los campos que
// pertenecen al documento comercial controlado (lo que ve el cliente en
// /estimate/:token). Los campos internos —identificadores de BD, lista de
// equipos asociados, documentos y número de OC del comprador, estado de
// facturación y timestamps administrativos— se vacían para NO exponerse por la
// ruta pública sin autenticación (edge case COM-08: "No exponer costos/lista
// de partes salvo que se cambie explícitamente el modelo comercial").
func (q Quote) Public() Quote {
	pub := q
	pub.ID = ""
	pub.ProspectID = 0
	pub.Descripcion = ""
	pub.TaxMode = ""
	pub.Zone = ""
	pub.SignatureRequired = false
	pub.SelectedEquipmentIDs = nil
	pub.PurchaseOrderNumber = ""
	pub.PurchaseOrderFileName = ""
	pub.PurchaseOrderFileDataURL = ""
	pub.PurchaseOrderDate = ""
	pub.PurchaseOrderUploadedAt = ""
	pub.InvoiceID = nil
	pub.InvoicedAt = ""
	pub.CreatedAt = ""
	pub.UpdatedAt = ""
	return pub
}

type ListQuotesQuery struct {
	Status string
	Limit  int
}

type DecisionRequest struct {
	EstadoCliente  string `json:"estadoCliente"`
	FechaDecision  string `json:"fechaDecision"`
	FirmadoPor     string `json:"firmadoPor"`
	FirmanteCorreo string `json:"firmanteCorreo"`
	LugarFirma     string `json:"lugarFirma"`
	FirmaBase64    string `json:"firmaBase64"`
}
