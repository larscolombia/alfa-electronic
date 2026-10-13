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
	CreatedAt                string   `json:"createdAt"`
	UpdatedAt                string   `json:"updatedAt"`
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
