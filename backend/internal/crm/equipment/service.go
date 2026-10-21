package equipment

import (
	"database/sql"
	"errors"

	"pika.software.net.co/backend/internal/platform/mailer"
)

const equipmentRecordSelectColumns = `id, prospect_id, prospect_name,
	reception_day, reception_month, reception_year,
	intake_method, intake_carrier, intake_tracking_number, intake_received_at,
	company_name, source_branch_name, nit, phone, address, city,
	contact_name, contact_role, cellphone, email,
	client_signature, alfa_signature,
	items_json, archived, archived_at,
	source_context, assigned_to,
	created_at, updated_at`

var (
	errRecordIDRequired = errors.New("el id del registro es obligatorio")
	errRecordNotFound   = errors.New("registro de equipo no encontrado")
)

var repairStatusLabels = map[string]string{
	"recibido":            "Recibido",
	"diagnostico":         "Diagnóstico",
	"por-cotizar":         "Por cotizar",
	"pedir-repuestos":     "Pedir componentes",
	"esperando-proveedor": "Esperando proveedor",
	"reparacion":          "En reparación",
	"pruebas":             "Pruebas QA",
	"garantia":            "Garantía",
	"prestamo":            "Material en préstamo",
	"listo-entrega":       "Listo para entrega",
	"entregado":           "Entregado",
}

type Service struct {
	db            *sql.DB
	insightClient *InsightClient

	// Fase 5c: outbox de correos transaccionales (acuse de recepción). Se
	// inyecta con SetEmailOutbox desde main.go; nil significa que el envío no
	// está cableado y SendReceptionAck lo reporta en vez de fingir éxito.
	emailOutbox *mailer.Outbox
}

func NewService(db *sql.DB, insightClient *InsightClient) *Service {
	return &Service{db: db, insightClient: insightClient}
}
