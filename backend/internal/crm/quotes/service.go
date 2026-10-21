package quotes

import (
	"database/sql"
	"errors"

	"pika.software.net.co/backend/internal/platform/mailer"
)

const (
	maxQuotesListLimit = 500

	quoteSelectColumns = `id, token, codigo, prospecto, prospect_id, empresa, correo, movil, fecha, valido_hasta,
	estado, moneda, descuento_tipo, descuento_valor, lineas_json,
	nota, terminos, estado_cliente, fecha_decision, firmado_por, firmante_correo, lugar_firma, firma_base64,
	descripcion, tax_mode, zone, signature_required, selected_equipment_ids_json,
	subtotal, tax_total, total,
	purchase_order_number, purchase_order_file_name, purchase_order_file_data_url, purchase_order_date, purchase_order_uploaded_at,
	created_at, updated_at, invoice_id, invoiced_at`
)

var (
	errQuoteIDRequired                = errors.New("el id de la cotizacion es obligatorio")
	errQuoteTokenRequired             = errors.New("el token de la cotizacion es obligatorio")
	errQuoteNotFound                  = errors.New("cotizacion no encontrada")
	errQuoteCodeRequired              = errors.New("el codigo de la cotizacion es obligatorio")
	errQuoteProspectNeeded            = errors.New("el prospecto de la cotizacion es obligatorio")
	errQuoteStatusInvalid             = errors.New("estado de la cotizacion invalido")
	errDecisionInvalid                = errors.New("decision del cliente invalida")
	errPurchaseOrderNumberRequired    = errors.New("debes indicar el numero de OC antes de guardar archivo o fecha")
	errPurchaseOrderNumberTooLong     = errors.New("el numero de la orden de compra no puede superar 120 caracteres")
	errPurchaseOrderFileNameTooLong   = errors.New("el nombre del archivo de la orden de compra no puede superar 255 caracteres")
	errPurchaseOrderFileTooLarge      = errors.New("el archivo de la orden de compra supera el tamano permitido")
	errPurchaseOrderDateRequired      = errors.New("la fecha de la orden de compra es obligatoria")
	errPurchaseOrderFileRequired      = errors.New("el archivo de la orden de compra es obligatorio")
	errPurchaseOrderDateInvalid       = errors.New("la fecha de la orden de compra debe tener formato YYYY-MM-DD")
	errPurchaseOrderUploadedAtInvalid = errors.New("la fecha de carga de la OC debe tener formato RFC3339")
	errListLimitInvalid               = errors.New("el limite debe ser mayor que cero")
)

type Service struct {
	db *sql.DB

	// Fase 5c: outbox de correos transaccionales. Se inyecta con
	// SetEmailOutbox desde main.go; nil significa que el envío de correos no
	// está cableado y SendQuoteEmail lo reporta en vez de fingir éxito.
	emailOutbox *mailer.Outbox
}

func NewService(db *sql.DB) *Service {
	return &Service{db: db}
}
