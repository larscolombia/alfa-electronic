package worktime

import (
	"errors"
	"net/http"
	"strconv"
	"strings"

	"github.com/labstack/echo/v4"
	"pika.software.net.co/backend/internal/platform/company"
)

// Handler expone las rutas de /worktime. Se monta en main.go sobre protectedAPI
// con aclService.RequireModule("registro-horas"): el ACL traduce GET=ver,
// POST=agregar, PUT/PATCH/DELETE=actualizar segun el rol del JWT.
type Handler struct {
	service *Service
}

func NewHandler(service *Service) *Handler {
	return &Handler{service: service}
}

func (h *Handler) RegisterRoutes(group *echo.Group) {
	group.GET("/entries", h.listEntries)
	group.POST("/entries", h.createEntry)
	group.POST("/entries/bulk", h.createEntriesBulk)
	group.GET("/entries/:entryID", h.getEntry)
	group.PUT("/entries/:entryID", h.updateEntry)
	group.DELETE("/entries/:entryID", h.deleteEntry)

	group.GET("/summary", h.summary)
	group.GET("/deviation", h.projectDeviation)

	group.GET("/usage", h.getUsage)
	group.PUT("/usage", h.upsertUsage)

	group.GET("/holidays", h.listHolidays)
	group.PUT("/holidays", h.upsertHoliday)
	group.DELETE("/holidays/:holidayID", h.deleteHoliday)

	group.GET("/test-batches", h.getTestBatchState)
	group.PUT("/test-batches/:batchID", h.upsertTestBatch)
	group.DELETE("/test-batches/:batchID", h.deleteTestBatch)
	group.PUT("/test-flow-rules/:ruleID", h.upsertFlowRule)
	group.DELETE("/test-flow-rules/:ruleID", h.deleteFlowRule)
}

// respondError propaga el error real al cliente: nada de respuestas vacias que
// parezcan exito. ErrNotFound -> 404, ErrInvalid -> 400, resto -> 500 con el
// mensaje envuelto.
func respondError(c echo.Context, err error) error {
	switch {
	case errors.Is(err, ErrNotFound):
		return c.JSON(http.StatusNotFound, map[string]string{"error": err.Error()})
	case errors.Is(err, ErrInvalid):
		return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
	default:
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": err.Error()})
	}
}

// currentUserID resuelve la identidad SOLO desde el JWT (claim email publicado
// por el middleware de auth en "auth.email"). El cliente no puede impersonar a
// otro usuario: ningun endpoint acepta userId en el cuerpo.
func (h *Handler) currentUserID(c echo.Context) string {
	companyID := company.IDFromRequest(c)
	email, _ := c.Get("auth.email").(string)
	return h.service.ResolveUserID(companyID, email)
}

// ── Entradas ─────────────────────────────────────────────────────────────────

func (h *Handler) listEntries(c echo.Context) error {
	companyID := company.IDFromRequest(c)
	filters := EntryFilters{
		Employee:    c.QueryParam("employee"),
		EquipmentID: c.QueryParam("equipmentId"),
		ProjectID:   c.QueryParam("projectId"),
		From:        c.QueryParam("from"),
		To:          c.QueryParam("to"),
	}
	items, err := h.service.List(companyID, filters)
	if err != nil {
		return respondError(c, err)
	}
	return c.JSON(http.StatusOK, map[string]any{"items": items})
}

func (h *Handler) createEntry(c echo.Context) error {
	companyID := company.IDFromRequest(c)
	var req EntryRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "cuerpo invalido"})
	}
	entry, err := h.service.Create(companyID, h.currentUserID(c), req)
	if err != nil {
		return respondError(c, err)
	}
	return c.JSON(http.StatusCreated, entry)
}

func (h *Handler) createEntriesBulk(c echo.Context) error {
	companyID := company.IDFromRequest(c)
	var body struct {
		Entries []EntryRequest `json:"entries"`
	}
	if err := c.Bind(&body); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "cuerpo invalido"})
	}
	if len(body.Entries) == 0 {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "entries esta vacio"})
	}
	created, err := h.service.CreateBulk(companyID, h.currentUserID(c), body.Entries)
	if err != nil {
		// Creadas parcialmente: el cliente conserva su localStorage y reintenta.
		return c.JSON(http.StatusBadRequest, map[string]any{"error": err.Error(), "created": created})
	}
	return c.JSON(http.StatusOK, map[string]any{"created": created})
}

func (h *Handler) getEntry(c echo.Context) error {
	companyID := company.IDFromRequest(c)
	entry, err := h.service.Get(companyID, c.Param("entryID"))
	if err != nil {
		return respondError(c, err)
	}
	return c.JSON(http.StatusOK, entry)
}

func (h *Handler) updateEntry(c echo.Context) error {
	companyID := company.IDFromRequest(c)
	var req EntryRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "cuerpo invalido"})
	}
	entry, err := h.service.Update(companyID, c.Param("entryID"), req)
	if err != nil {
		return respondError(c, err)
	}
	return c.JSON(http.StatusOK, entry)
}

func (h *Handler) deleteEntry(c echo.Context) error {
	companyID := company.IDFromRequest(c)
	if err := h.service.Delete(companyID, c.Param("entryID")); err != nil {
		return respondError(c, err)
	}
	return c.JSON(http.StatusOK, map[string]string{"status": "deleted"})
}

// ── Agregados ────────────────────────────────────────────────────────────────

func (h *Handler) summary(c echo.Context) error {
	companyID := company.IDFromRequest(c)
	summary, err := h.service.Summary(companyID, c.QueryParam("from"), c.QueryParam("to"))
	if err != nil {
		return respondError(c, err)
	}
	return c.JSON(http.StatusOK, summary)
}

// projectDeviation expone el cruce G6 (estimado vs real) de un proyecto.
func (h *Handler) projectDeviation(c echo.Context) error {
	companyID := company.IDFromRequest(c)
	if strings.TrimSpace(c.QueryParam("projectId")) == "" {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "projectId es obligatorio"})
	}
	deviation, err := h.service.ProjectDeviation(companyID, c.QueryParam("projectId"), c.QueryParam("from"), c.QueryParam("to"))
	if err != nil {
		return respondError(c, err)
	}
	return c.JSON(http.StatusOK, deviation)
}

// ── Uso diario ───────────────────────────────────────────────────────────────

func (h *Handler) getUsage(c echo.Context) error {
	companyID := company.IDFromRequest(c)
	usage, err := h.service.GetUsage(companyID, h.currentUserID(c), c.QueryParam("date"))
	if err != nil {
		return respondError(c, err)
	}
	return c.JSON(http.StatusOK, usage)
}

func (h *Handler) upsertUsage(c echo.Context) error {
	companyID := company.IDFromRequest(c)
	var req DailyUsage
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "cuerpo invalido"})
	}
	usage, err := h.service.UpsertUsage(companyID, h.currentUserID(c), req)
	if err != nil {
		return respondError(c, err)
	}
	return c.JSON(http.StatusOK, usage)
}

// ── Festivos ─────────────────────────────────────────────────────────────────

func (h *Handler) listHolidays(c echo.Context) error {
	year := 0
	if raw := c.QueryParam("year"); raw != "" {
		parsed, err := strconv.Atoi(raw)
		if err != nil || parsed < 1900 || parsed > 3000 {
			return c.JSON(http.StatusBadRequest, map[string]string{"error": "year invalido"})
		}
		year = parsed
	}
	holidays, err := h.service.ListHolidays(c.QueryParam("country"), year)
	if err != nil {
		return respondError(c, err)
	}
	return c.JSON(http.StatusOK, map[string]any{"items": holidays})
}

func (h *Handler) upsertHoliday(c echo.Context) error {
	var req HolidayRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "cuerpo invalido"})
	}
	holiday, err := h.service.UpsertHoliday(req)
	if err != nil {
		return respondError(c, err)
	}
	return c.JSON(http.StatusOK, holiday)
}

func (h *Handler) deleteHoliday(c echo.Context) error {
	if err := h.service.DeleteHoliday(c.Param("holidayID")); err != nil {
		return respondError(c, err)
	}
	return c.JSON(http.StatusOK, map[string]string{"status": "deleted"})
}

// ── Pruebas funcionales ──────────────────────────────────────────────────────

func (h *Handler) getTestBatchState(c echo.Context) error {
	companyID := company.IDFromRequest(c)
	state, err := h.service.GetTestBatchState(companyID)
	if err != nil {
		return respondError(c, err)
	}
	return c.JSON(http.StatusOK, state)
}

func (h *Handler) upsertTestBatch(c echo.Context) error {
	companyID := company.IDFromRequest(c)
	var batch TestBatch
	if err := c.Bind(&batch); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "cuerpo invalido"})
	}
	// El id de la URL manda sobre el del cuerpo.
	batch.ID = c.Param("batchID")
	saved, err := h.service.UpsertTestBatch(companyID, batch)
	if err != nil {
		return respondError(c, err)
	}
	return c.JSON(http.StatusOK, saved)
}

func (h *Handler) deleteTestBatch(c echo.Context) error {
	companyID := company.IDFromRequest(c)
	if err := h.service.DeleteTestBatch(companyID, c.Param("batchID")); err != nil {
		return respondError(c, err)
	}
	return c.JSON(http.StatusOK, map[string]string{"status": "deleted"})
}

func (h *Handler) upsertFlowRule(c echo.Context) error {
	companyID := company.IDFromRequest(c)
	var rule TestFlowRule
	if err := c.Bind(&rule); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "cuerpo invalido"})
	}
	rule.ID = c.Param("ruleID")
	saved, err := h.service.UpsertFlowRule(companyID, rule)
	if err != nil {
		return respondError(c, err)
	}
	return c.JSON(http.StatusOK, saved)
}

func (h *Handler) deleteFlowRule(c echo.Context) error {
	companyID := company.IDFromRequest(c)
	if err := h.service.DeleteFlowRule(companyID, c.Param("ruleID")); err != nil {
		return respondError(c, err)
	}
	return c.JSON(http.StatusOK, map[string]string{"status": "deleted"})
}
