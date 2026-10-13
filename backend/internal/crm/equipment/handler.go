package equipment

import (
	"errors"
	"net/http"
	"strings"
	"time"

	"github.com/labstack/echo/v4"
	"pika.software.net.co/backend/internal/platform/company"
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
	group.PATCH("/records/:recordID/archive", h.archiveRecord)
	group.POST("/records/:recordID/restore", h.restoreRecord)

	group.GET("/items", h.listItems)
	group.GET("/technicians", h.listTechnicians)
	group.GET("/insights", h.getInsight)

	group.POST("/records/:recordID/items/:itemID/attachments", h.addItemAttachment)
	group.PUT("/records/:recordID/items/:itemID/assignment", h.assignItemTechnician)
	group.DELETE("/records/:recordID/items/:itemID/attachments/:attachmentID", h.deleteItemAttachment)
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
		if errors.Is(err, errRecordIDRequired) {
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
		switch {
		case errors.Is(err, errRecordIDRequired), errors.Is(err, errFinalizeEvidenceFacesRequired):
			return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
		case errors.Is(err, errRecordNotFound):
			return c.JSON(http.StatusNotFound, map[string]string{"error": err.Error()})
		default:
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": "no se pudo finalizar la recepcion de equipos"})
		}
	}

	return c.JSON(http.StatusOK, item)
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
	})
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "no se pudieron cargar los items de equipos"})
	}

	return c.JSON(http.StatusOK, map[string]any{"items": items})
}

func (h *Handler) listTechnicians(c echo.Context) error {
	companyID := company.IDFromRequest(c)
	speciality := strings.TrimSpace(c.QueryParam("speciality"))

	items, err := h.service.ListTechnicians(companyID, speciality)
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
		case errors.Is(err, errRecordIDRequired), errors.Is(err, errItemIDRequired), errors.Is(err, errAttachmentInvalid), errors.Is(err, errAttachmentTooLarge):
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
		case errors.Is(err, errRecordIDRequired), errors.Is(err, errItemIDRequired), errors.Is(err, errTechnicianIDRequired):
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
