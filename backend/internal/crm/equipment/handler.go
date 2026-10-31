package equipment

import (
	"errors"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/labstack/echo/v4"
	"pika.software.net.co/backend/internal/platform/company"
	"pika.software.net.co/backend/internal/platform/mailer"
)

var errIndustrialOverrideRequired = errors.New("autorizacion de jefe obligatoria para equipos no industriales con costo <= 2M")

type Handler struct {
	service *Service
}

func NewHandler(service *Service) *Handler {
	return &Handler{service: service}
}

func (h *Handler) RegisterRoutes(group *echo.Group) {
	group.GET("/records", h.listRecords)
	group.GET("/records/:recordID", h.getRecord)
	group.POST("/records", h.upsertRecord)
	group.PUT("/records/:recordID", h.upsertRecord)
	group.POST("/records/:recordID/finalize", h.finalizeRecord)
	// Fase 5c: acuse de recepción por correo. Endpoint propio (no un efecto de
	// finalize) para que la ausencia de correo del cliente sea un error visible
	// en la UI en vez de un acuse que nadie recibió.
	group.POST("/records/:recordID/reception-ack", h.sendReceptionAck)
	group.PATCH("/records/:recordID/archive", h.archiveRecord)
	group.POST("/records/:recordID/restore", h.restoreRecord)

	// Serie CO+YYMM+NNNN: emite el código interno de cada equipo nuevo al
	// recepcionar (contador mensual por empresa, reinicia en cada mes).
	group.POST("/codes/next", h.nextEquipmentCodes)
	group.GET("/items", h.listItems)
	group.GET("/technicians", h.listTechnicians)
	group.GET("/insights", h.getInsight)

	group.POST("/records/:recordID/items/:itemID/attachments", h.addItemAttachment)
	group.PUT("/records/:recordID/items/:itemID/assignment", h.assignItemTechnician)
	group.DELETE("/records/:recordID/items/:itemID/attachments/:attachmentID", h.deleteItemAttachment)
}

// nextEquipmentCodesRequest es el payload de /codes/next: cuántos códigos
// asignar en una sola reserva atómica.
type nextEquipmentCodesRequest struct {
	Count int `json:"count"`
}

func (h *Handler) nextEquipmentCodes(c echo.Context) error {
	companyID := company.IDFromRequest(c)

	var req nextEquipmentCodesRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "payload inválido: se esperaba { count?: number }"})
	}

	count := req.Count
	if count < 1 {
		count = 1
	}
	if count > equipmentCodeMaxBatch {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": fmt.Sprintf("máximo %d códigos por solicitud", equipmentCodeMaxBatch)})
	}

	codes, err := h.service.NextEquipmentCodes(companyID, count)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "no se pudo asignar el código del equipo"})
	}

	return c.JSON(http.StatusOK, map[string][]string{"codes": codes})
}

func (h *Handler) listRecords(c echo.Context) error {
	companyID := company.IDFromRequest(c)
	identifier := strings.TrimSpace(c.QueryParam("identifier"))

	items, err := h.service.ListRecords(companyID, ListRecordsQuery{
		ProspectID:      strings.TrimSpace(c.QueryParam("prospectId")),
		ClientNIT:       strings.TrimSpace(c.QueryParam("clientNit")),
		ClientName:      strings.TrimSpace(c.QueryParam("clientName")),
		IncludeArchived: parseBool(c.QueryParam("includeArchived")),
		Identifier:      identifier,
		AssignedToID:    strings.TrimSpace(c.QueryParam("assignedToId")),
	})
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "no se pudieron cargar los registros de equipos"})
	}

	return c.JSON(http.StatusOK, map[string]any{"items": items})
}

func (h *Handler) getRecord(c echo.Context) error {
	companyID := company.IDFromRequest(c)
	recordID := c.Param("recordID")

	item, err := h.service.GetRecord(companyID, recordID, parseBool(c.QueryParam("includeArchived")))
	if err != nil {
		switch {
		case errors.Is(err, errRecordIDRequired):
			return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
		case errors.Is(err, errRecordNotFound):
			return c.JSON(http.StatusNotFound, map[string]string{"error": err.Error()})
		default:
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": "no se pudo cargar el registro de equipo"})
		}
	}

	return c.JSON(http.StatusOK, item)
}

func (h *Handler) upsertRecord(c echo.Context) error {
	companyID := company.IDFromRequest(c)

	var req Record
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "cuerpo de solicitud invalido"})
	}

	if recordID := strings.TrimSpace(c.Param("recordID")); recordID != "" {
		req.ID = recordID
	}

	applyIndustrialOverrideTimestamps(req.Items)
	if err := validateIndustrialOverrides(req.Items); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
	}

	item, err := h.service.UpsertRecord(companyID, req)
	if err != nil {
		var duplicateErr *DuplicateIdentifierError
		if errors.As(err, &duplicateErr) {
			return c.JSON(http.StatusConflict, map[string]string{
				"error":            duplicateErr.Error(),
				"code":             ErrCodeDuplicateIdentifier,
				"existingRecordId": duplicateErr.ExistingRecordID,
			})
		}
		if errors.Is(err, errRecordIDRequired) || errors.Is(err, errIntakeTransportadoraRequired) {
			return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
		}
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "no se pudo guardar el registro de equipo"})
	}

	return c.JSON(http.StatusOK, item)
}

func (h *Handler) finalizeRecord(c echo.Context) error {
	companyID := company.IDFromRequest(c)
	recordID := c.Param("recordID")

	item, err := h.service.FinalizeRecord(companyID, recordID)
	if err != nil {
		var duplicateErr *DuplicateIdentifierError
		if errors.As(err, &duplicateErr) {
			return c.JSON(http.StatusConflict, map[string]string{
				"error":            duplicateErr.Error(),
				"code":             ErrCodeDuplicateIdentifier,
				"existingRecordId": duplicateErr.ExistingRecordID,
			})
		}
		switch {
		case errors.Is(err, errRecordIDRequired),
			errors.Is(err, errFinalizeEvidenceFacesRequired),
			errors.Is(err, errIntakeTransportadoraRequired),
			errors.Is(err, errSerialPlateEvidenceRequired),
			errors.Is(err, errAccessoriesEvidenceRequired),
			errors.Is(err, errVisibleDamageEvidenceRequired):
			return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
		case errors.Is(err, errRecordNotFound):
			return c.JSON(http.StatusNotFound, map[string]string{"error": err.Error()})
		default:
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": "no se pudo finalizar la recepcion de equipos"})
		}
	}

	return c.JSON(http.StatusOK, item)
}

// sendReceptionAck (Fase 5c) encola el acuse de recepción por correo.
//
// 422 cuando el cliente no tiene correo en el registro: la recepción sigue
// siendo válida y ya quedó persistida, pero la UI debe decir que el acuse no
// salió en vez de darlo por enviado.
func (h *Handler) sendReceptionAck(c echo.Context) error {
	companyID := company.IDFromRequest(c)
	recordID := c.Param("recordID")

	message, err := h.service.SendReceptionAck(companyID, recordID, currentUserEmail(c))
	if err != nil {
		switch {
		case errors.Is(err, errRecordIDRequired):
			return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
		case errors.Is(err, errRecordNotFound):
			return c.JSON(http.StatusNotFound, map[string]string{"error": err.Error()})
		case errors.Is(err, errRecordEmailNotAvailable):
			return c.JSON(http.StatusUnprocessableEntity, map[string]string{"error": err.Error()})
		default:
			return mailer.EnqueueErrorResponse(c, err)
		}
	}

	return c.JSON(http.StatusCreated, mailer.EnqueueResult(message))
}

// currentUserEmail lee la identidad real del JWT (Fase 2b) para el rastro de
// quién disparó el correo.
func currentUserEmail(c echo.Context) string {
	if email, ok := c.Get("auth.email").(string); ok && strings.TrimSpace(email) != "" {
		return strings.TrimSpace(email)
	}
	return "sistema"
}

func (h *Handler) archiveRecord(c echo.Context) error {
	companyID := company.IDFromRequest(c)
	recordID := c.Param("recordID")

	var req ArchiveRequest
	if err := c.Bind(&req); err != nil {
		req.Archived = true
	}

	item, err := h.service.SetRecordArchived(companyID, recordID, req.Archived)
	if err != nil {
		switch {
		case errors.Is(err, errRecordIDRequired):
			return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
		case errors.Is(err, errRecordNotFound):
			return c.JSON(http.StatusNotFound, map[string]string{"error": err.Error()})
		default:
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": "no se pudo archivar el registro de equipo"})
		}
	}

	return c.JSON(http.StatusOK, item)
}

func (h *Handler) restoreRecord(c echo.Context) error {
	companyID := company.IDFromRequest(c)
	recordID := c.Param("recordID")

	item, err := h.service.SetRecordArchived(companyID, recordID, false)
	if err != nil {
		switch {
		case errors.Is(err, errRecordIDRequired):
			return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
		case errors.Is(err, errRecordNotFound):
			return c.JSON(http.StatusNotFound, map[string]string{"error": err.Error()})
		default:
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": "no se pudo restaurar el registro de equipo"})
		}
	}

	return c.JSON(http.StatusOK, item)
}

func (h *Handler) listItems(c echo.Context) error {
	companyID := company.IDFromRequest(c)
	identifier := strings.TrimSpace(c.QueryParam("identifier"))

	items, err := h.service.ListItems(companyID, ListItemsQuery{
		ProspectID:      strings.TrimSpace(c.QueryParam("prospectId")),
		ClientNIT:       strings.TrimSpace(c.QueryParam("clientNit")),
		ClientName:      strings.TrimSpace(c.QueryParam("clientName")),
		IncludeArchived: parseBool(c.QueryParam("includeArchived")),
		Identifier:      identifier,
		AssignedToID:    strings.TrimSpace(c.QueryParam("assignedToId")),
		// Fase 5c: campanita de facturación urgente (GET /crm-equipment/items?priorityBilling=true).
		PriorityBilling: parseBool(c.QueryParam("priorityBilling")),
		ExcludeQuoted:   parseBool(c.QueryParam("excludeQuoted")),
		ExceptQuoteID:   strings.TrimSpace(c.QueryParam("exceptQuoteId")),
	})
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "no se pudieron cargar los items de equipos"})
	}

	return c.JSON(http.StatusOK, map[string]any{"items": items})
}

// context: 'tecnica' | 'comercial'. Vacío o desconocido = todos los activos.
func (h *Handler) listTechnicians(c echo.Context) error {
	companyID := company.IDFromRequest(c)
	speciality := strings.TrimSpace(c.QueryParam("speciality"))
	roleContext := strings.TrimSpace(c.QueryParam("context"))

	items, err := h.service.ListTechnicians(companyID, speciality, roleContext)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "no se pudo cargar el listado de tecnicos"})
	}

	return c.JSON(http.StatusOK, map[string]any{"items": items})
}

func (h *Handler) getInsight(c echo.Context) error {
	companyID := company.IDFromRequest(c)
	reference := strings.TrimSpace(c.QueryParam("reference"))
	identifier := strings.TrimSpace(c.QueryParam("identifier"))

	if reference == "" && identifier == "" {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "reference o identifier son obligatorios"})
	}

	insight, err := h.service.BuildInsight(companyID, InsightQuery{
		Reference:       reference,
		Identifier:      identifier,
		IncludeArchived: parseBool(c.QueryParam("includeArchived")),
	})
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "no se pudo generar insight tecnico del equipo"})
	}

	return c.JSON(http.StatusOK, insight)
}

func (h *Handler) addItemAttachment(c echo.Context) error {
	companyID := company.IDFromRequest(c)
	recordID := c.Param("recordID")
	itemID := c.Param("itemID")

	var req Attachment
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "cuerpo de solicitud invalido"})
	}

	item, err := h.service.AddItemAttachment(companyID, recordID, itemID, req)
	if err != nil {
		switch {
		case errors.Is(err, errRecordIDRequired), errors.Is(err, errItemIDRequired), errors.Is(err, errAttachmentInvalid), errors.Is(err, errAttachmentTooLarge), errors.Is(err, errAttachmentTypeDenied):
			return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
		case errors.Is(err, errRecordNotFound), errors.Is(err, errItemNotFound):
			return c.JSON(http.StatusNotFound, map[string]string{"error": err.Error()})
		default:
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": "no se pudo agregar el adjunto"})
		}
	}

	return c.JSON(http.StatusOK, item)
}

func (h *Handler) assignItemTechnician(c echo.Context) error {
	companyID := company.IDFromRequest(c)
	recordID := c.Param("recordID")
	itemID := c.Param("itemID")

	var req AssignTechnicianRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "cuerpo de solicitud invalido"})
	}

	item, err := h.service.AssignItemTechnician(companyID, recordID, itemID, req)
	if err != nil {
		switch {
		case errors.Is(err, errRecordIDRequired), errors.Is(err, errItemIDRequired), errors.Is(err, errTechnicianIDRequired), errors.Is(err, errSenderUnknownAssignment):
			return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
		case errors.Is(err, errRecordNotFound), errors.Is(err, errItemNotFound), errors.Is(err, errTechnicianNotFound):
			return c.JSON(http.StatusNotFound, map[string]string{"error": err.Error()})
		default:
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": "no se pudo asignar el tecnico"})
		}
	}

	return c.JSON(http.StatusOK, item)
}

func (h *Handler) deleteItemAttachment(c echo.Context) error {
	companyID := company.IDFromRequest(c)
	recordID := c.Param("recordID")
	itemID := c.Param("itemID")
	attachmentID := c.Param("attachmentID")

	item, err := h.service.DeleteItemAttachment(companyID, recordID, itemID, attachmentID)
	if err != nil {
		switch {
		case errors.Is(err, errRecordIDRequired), errors.Is(err, errItemIDRequired), errors.Is(err, errAttachmentIDRequired):
			return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
		case errors.Is(err, errRecordNotFound), errors.Is(err, errItemNotFound), errors.Is(err, errAttachmentNotFound):
			return c.JSON(http.StatusNotFound, map[string]string{"error": err.Error()})
		default:
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": "no se pudo eliminar el adjunto"})
		}
	}

	return c.JSON(http.StatusOK, item)
}

func parseBool(raw string) bool {
	switch strings.ToLower(strings.TrimSpace(raw)) {
	case "1", "true", "yes", "si", "sí":
		return true
	default:
		return false
	}
}

func applyIndustrialOverrideTimestamps(items []Item) {
	now := time.Now().UTC().Format(time.RFC3339)

	for index := range items {
		authorizedBy := strings.TrimSpace(items[index].IndustrialOverrideAuthorizedBy)
		if authorizedBy == "" {
			continue
		}

		if strings.TrimSpace(items[index].IndustrialOverrideAt) == "" {
			items[index].IndustrialOverrideAt = now
		}
	}
}

func validateIndustrialOverrides(items []Item) error {
	for _, item := range items {
		if !requiresIndustrialOverride(item) {
			continue
		}

		if strings.TrimSpace(item.IndustrialOverrideAuthorizedBy) == "" || strings.TrimSpace(item.IndustrialOverrideReason) == "" {
			return errIndustrialOverrideRequired
		}
	}

	return nil
}

func requiresIndustrialOverride(item Item) bool {
	if item.Answers == nil {
		return false
	}

	costAnswer := strings.ToLower(strings.TrimSpace(item.Answers["costAboveTwoMillion"]))
	if costAnswer != "no" {
		return false
	}

	if item.IsIndustrial == nil {
		return false
	}

	return !*item.IsIndustrial
}
