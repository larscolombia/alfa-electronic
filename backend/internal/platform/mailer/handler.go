package mailer

import (
	"database/sql"
	"errors"
	"net/http"
	"strconv"
	"strings"

	"github.com/labstack/echo/v4"
	"pika.software.net.co/backend/internal/platform/company"
)

// Claves de contexto que publica el middleware JWT (Fase 2b). Se leen aquí en
// vez de importar internal/auth para no acoplar la plataforma al módulo de
// identidad.
const (
	contextKeyEmail = "auth.email"
	contextKeyRole  = "auth.role"
)

type Handler struct {
	outbox *Outbox
}

func NewHandler(outbox *Outbox) *Handler {
	return &Handler{outbox: outbox}
}

// RegisterAdminRoutes monta `GET /emails` (el outbox visible). El grupo debe
// venir ya protegido por JWT y por `aclService.RequireModule("administracion")`:
// el outbox contiene destinatarios y errores de toda la empresa, así que es
// superficie de administración.
func (h *Handler) RegisterAdminRoutes(group *echo.Group) {
	group.GET("", h.listEmails)
}

// RegisterTriggerRoutes monta los disparadores de correo.
//
// Van FUERA del guard de administración a propósito: quien despacha un equipo
// desde el kanban no es necesariamente admin, y exigirle `administracion` para
// avisarle al cliente habría dejado el trigger muerto para el usuario real del
// flujo. Sólo requieren JWT válido.
func (h *Handler) RegisterTriggerRoutes(group *echo.Group) {
	group.POST("/emails/triggers/dispatch", h.triggerDispatchNotice)
}

func (h *Handler) listEmails(c echo.Context) error {
	companyID := company.IDFromRequest(c)
	limit, err := parseLimit(c.QueryParam("limit"))
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
	}

	items, err := h.outbox.List(companyID, limit)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "no se pudo cargar el outbox de correos"})
	}

	// `smtpEnabled` va en la respuesta para que la UI pueda decir "el correo
	// está desactivado en el servidor" en vez de dejar al usuario adivinando
	// por qué nada sale.
	return c.JSON(http.StatusOK, map[string]any{
		"items":       items,
		"smtpEnabled": h.outbox.Enabled(),
	})
}

// DispatchTriggerRequest es lo que manda el panel de despacho del kanban cuando
// `notifyClient` está marcado.
//
// El destinatario NO lo envía el navegador: se resuelve del cliente en BD
// (por NIT y, como respaldo, por nombre/empresa). Un correo que el frontend
// pudiera dictar permitiría redirigir el aviso de despacho a cualquiera.
type DispatchTriggerRequest struct {
	ClientName    string `json:"clientName"`
	ClientNIT     string `json:"clientNit"`
	DispatchCode  string `json:"dispatchCode"`
	EquipmentName string `json:"equipmentName"`
	Carrier       string `json:"carrier"`
	GuideNumber   string `json:"guideNumber"`
	DeliveryNote  string `json:"deliveryNote"`
	RefType       string `json:"refType"`
	RefID         string `json:"refID"`
}

func (h *Handler) triggerDispatchNotice(c echo.Context) error {
	companyID := company.IDFromRequest(c)

	var req DispatchTriggerRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "cuerpo de solicitud invalido"})
	}

	toEmail, resolvedFrom, err := h.resolveClientEmail(companyID, req.ClientNIT, req.ClientName)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "no se pudo resolver el correo del cliente"})
	}
	if toEmail == "" {
		// Error visible, no éxito falso: el despacho quedó registrado pero el
		// cliente no se enteró, y la UI tiene que decirlo.
		return c.JSON(http.StatusUnprocessableEntity, map[string]string{
			"error": ErrNoRecipient.Error(),
		})
	}

	refType := strings.TrimSpace(req.RefType)
	if refType == "" {
		refType = "project-dispatch"
	}

	payload := DispatchNoticeEmail{
		ClientName:    req.ClientName,
		DispatchCode:  req.DispatchCode,
		EquipmentName: req.EquipmentName,
		Carrier:       req.Carrier,
		GuideNumber:   req.GuideNumber,
		DeliveryNote:  req.DeliveryNote,
	}

	message, err := h.outbox.Enqueue(EnqueueRequest{
		CompanyID: companyID,
		Kind:      KindDispatchNotice,
		ToEmail:   toEmail,
		Subject:   payload.Subject(),
		BodyHTML:  payload.Body(),
		RefType:   refType,
		RefID:     strings.TrimSpace(req.RefID),
		CreatedBy: currentUser(c),
	})
	if err != nil {
		return enqueueErrorResponse(c, err)
	}

	return c.JSON(http.StatusCreated, enqueueResult(message, resolvedFrom))
}

// resolveClientEmail busca el correo del cliente en `crm_clients`. Prioriza el
// NIT (identificador estable) y cae a nombre/empresa, que es lo único que el
// panel de despacho siempre tiene a mano.
func (h *Handler) resolveClientEmail(companyID, nit, name string) (string, string, error) {
	nit = strings.TrimSpace(nit)
	name = strings.TrimSpace(name)
	if nit == "" && name == "" {
		return "", "", nil
	}

	// billing_email (Fase 5b) es el correo de facturación electrónica; para un
	// aviso de despacho sirve igual y es más específico que el correo general.
	var email sql.NullString
	var matchedOn sql.NullString
	err := h.outbox.db.QueryRow(`
SELECT COALESCE(NULLIF(btrim(billing_email), ''), NULLIF(btrim(correo), ''), NULL),
	CASE WHEN COALESCE(NULLIF(btrim(billing_email), ''), NULLIF(btrim(correo), '')) IS NOT NULL
		THEN CASE WHEN $2 <> '' AND lower(nit) = lower($2) THEN 'nit' ELSE 'nombre' END
		ELSE NULL END
FROM crm_clients
WHERE company_id = $1
  AND soft_delete = false
  AND (
	($2 <> '' AND lower(nit) = lower($2))
	OR ($3 <> '' AND (lower(empresa) = lower($3) OR lower(nombre) = lower($3)))
  )
ORDER BY updated_at DESC
LIMIT 1`, companyID, nit, name).Scan(&email, &matchedOn)
	if errors.Is(err, sql.ErrNoRows) {
		return "", "", nil
	}
	if err != nil {
		return "", "", err
	}
	if !email.Valid {
		return "", "", nil
	}
	return strings.TrimSpace(email.String), matchedOn.String, nil
}

// enqueueResult es la respuesta de un disparador. `delivered` es false SIEMPRE
// en el momento del disparo: encolar no es enviar. `emailStatus` dice en qué
// quedó la fila ('pendiente' si hay SMTP y saldrá en el próximo barrido,
// 'desactivado' si no hay SMTP configurado), que es lo que la UI necesita para
// no reportar un éxito falso.
func enqueueResult(message Message, resolvedFrom string) map[string]any {
	result := map[string]any{
		"queued":      true,
		"delivered":   message.Status == StatusSent,
		"emailId":     message.ID,
		"emailStatus": message.Status,
		"toEmail":     message.ToEmail,
	}
	if message.LastError != "" {
		result["warning"] = "El correo NO se envio: " + message.LastError + ". Quedo registrado en el outbox (/emails)."
	}
	if strings.TrimSpace(resolvedFrom) != "" {
		result["recipientResolvedFrom"] = resolvedFrom
	}
	return result
}

// enqueueErrorResponse traduce los errores de negocio del encolado a códigos
// HTTP que la UI pueda mostrar textualmente.
func enqueueErrorResponse(c echo.Context, err error) error {
	switch {
	case errors.Is(err, ErrNoRecipient):
		return c.JSON(http.StatusUnprocessableEntity, map[string]string{"error": err.Error()})
	case errors.Is(err, ErrNotEnqueued):
		return c.JSON(http.StatusServiceUnavailable, map[string]string{"error": err.Error()})
	default:
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "no se pudo encolar el correo"})
	}
}

// EnqueueResult expone la forma de la respuesta de un disparador para que los
// demás módulos (cotizaciones, recepción) devuelvan exactamente lo mismo.
func EnqueueResult(message Message) map[string]any { return enqueueResult(message, "") }

// EnqueueErrorResponse es la variante exportada del traductor de errores.
func EnqueueErrorResponse(c echo.Context, err error) error { return enqueueErrorResponse(c, err) }

func currentUser(c echo.Context) string {
	if email, ok := c.Get(contextKeyEmail).(string); ok && strings.TrimSpace(email) != "" {
		return strings.TrimSpace(email)
	}
	return "sistema"
}

// RoleFromContext lee el rol del JWT. Lo usan los módulos que necesitan
// restringir una acción a admin (p. ej. el override de la puerta de pago).
func RoleFromContext(c echo.Context) string {
	role, _ := c.Get(contextKeyRole).(string)
	return strings.TrimSpace(role)
}

func parseLimit(raw string) (int, error) {
	trimmed := strings.TrimSpace(raw)
	if trimmed == "" {
		return 0, nil
	}
	value, err := strconv.Atoi(trimmed)
	if err != nil || value <= 0 {
		return 0, errors.New("limit debe ser un entero positivo")
	}
	return value, nil
}
