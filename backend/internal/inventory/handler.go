package inventory

import (
	"errors"
	"net/http"
	"strings"

	"github.com/labstack/echo/v4"
	"pika.software.net.co/backend/internal/platform/company"
)

type Handler struct {
	service *Service
}

func NewHandler(service *Service) *Handler {
	return &Handler{service: service}
}

func (h *Handler) RegisterRoutes(group *echo.Group) {
	group.GET("", h.getFullState)
	group.GET("/config", h.getConfig)
	group.PUT("/config/max-reserve-days", h.setMaxReserveDays)

	group.GET("/references", h.listReferences)
	group.GET("/references/:reference", h.getReference)
	group.POST("/references", h.createReference)
	group.GET("/references/duplicates/check", h.checkDuplicates)

	group.POST("/stock-entry", h.registerStockEntry)

	group.GET("/movements", h.listMovements)
	group.POST("/movements", h.submitMovement)

	group.GET("/adjustment-requests", h.listAdjustmentRequests)
	group.POST("/adjustment-requests", h.createAdjustmentRequest)
	group.POST("/adjustment-requests/:id/approve", h.approveMovementRequest)

	group.GET("/reservations", h.listReservations)
	group.POST("/reservations", h.createReservation)
	group.POST("/reservations/:id/release", h.releaseReservation)
	group.POST("/reservations/:id/extend", h.extendReservation)
	group.POST("/reservations/:id/consume", h.consumeReservation)
	group.POST("/reservations/refresh-expired", h.refreshExpiredReservations)

	group.GET("/replenishment", h.listReplenishmentItems)
	group.POST("/replenishment/attempt", h.registerReplenishmentAttempt)
	group.POST("/replenishment/:reference/mark-obsolete", h.markReplenishmentObsolete)
	group.POST("/replenishment/rebuild", h.rebuildReplenishmentItems)

	group.GET("/purchase-lines", h.listPurchaseLines)
	group.POST("/purchase-lines", h.createPurchaseLine)
	group.POST("/purchase-lines/generate", h.generatePurchaseLines)
	group.PATCH("/purchase-lines/:id", h.updatePurchaseLine)
	group.POST("/purchase-lines/:id/send", h.markPurchaseLineSent)
	group.POST("/purchase-lines/:id/receive", h.receivePurchaseLine)
	group.POST("/purchase-lines/:id/close", h.closePurchaseLine)

	group.GET("/weekly-snapshots", h.listWeeklySnapshots)
	group.POST("/weekly-snapshots/generate", h.generateWeeklySnapshot)

	group.GET("/bags", h.listBagTraces)
	group.POST("/bags/receive", h.receiveTechnicianBag)
	group.POST("/bags/:id/release", h.releaseTechnicianBag)

	group.GET("/sessions", h.listSessions)
	group.POST("/sessions", h.createSession)
	group.POST("/sessions/:id/open", h.openSession)
	group.POST("/sessions/:id/close", h.closeSession)

	group.GET("/discrepancies", h.listDiscrepancies)
	group.POST("/discrepancies/:id/approve", h.approveDiscrepancy)

	group.GET("/audit", h.listAuditTrail)

	// Purchase requests (Gap 5)
	group.GET("/purchase-requests", h.listPurchaseRequests)
	group.POST("/purchase-requests", h.createPurchaseRequest)
	group.POST("/purchase-requests/:id/review", h.reviewPurchaseRequest)

	// Consolidation (Gap 3)
	group.GET("/purchase-lines/consolidate", h.consolidatePurchaseLines)

	// Approval workflow (Gap 2)
	group.POST("/purchase-lines/:id/approve", h.approvePurchaseLine)
	group.POST("/purchase-lines/:id/reject", h.rejectPurchaseLine)

	// Link to order (Gap 1)
	group.POST("/purchase-lines/:id/link-order", h.linkPurchaseLineToOrder)
}

func actorFromRequest(c echo.Context) string {
	if email, ok := c.Get("auth.email").(string); ok && strings.TrimSpace(email) != "" {
		return strings.TrimSpace(email)
	}
	return "system"
}

// ─── FULL STATE ──────────────────────────────────────────────────────────────

func (h *Handler) getFullState(c echo.Context) error {
	companyID := company.IDFromRequest(c)
	state, err := h.service.GetFullState(companyID)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "no se pudo cargar el estado de inventario"})
	}
	return c.JSON(http.StatusOK, state)
}

// ─── CONFIG ──────────────────────────────────────────────────────────────────

func (h *Handler) getConfig(c echo.Context) error {
	companyID := company.IDFromRequest(c)
	cfg, err := h.service.GetConfig(companyID)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "no se pudo cargar la configuracion"})
	}
	return c.JSON(http.StatusOK, cfg)
}

func (h *Handler) setMaxReserveDays(c echo.Context) error {
	companyID := company.IDFromRequest(c)
	var req SetMaxReserveDaysRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "cuerpo de solicitud invalido"})
	}
	cfg, err := h.service.SetMaxReserveDays(companyID, req.Days, actorFromRequest(c))
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "no se pudo actualizar la configuracion"})
	}
	return c.JSON(http.StatusOK, cfg)
}

// ─── REFERENCES ──────────────────────────────────────────────────────────────

func (h *Handler) listReferences(c echo.Context) error {
	companyID := company.IDFromRequest(c)
	refs, err := h.service.ListReferences(companyID)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "no se pudieron cargar las referencias"})
	}
	return c.JSON(http.StatusOK, map[string]any{"items": refs})
}

func (h *Handler) getReference(c echo.Context) error {
	companyID := company.IDFromRequest(c)
	ref := c.Param("reference")
	item, err := h.service.GetReference(companyID, ref)
	if err != nil {
		if errors.Is(err, errReferenceNotFound) {
			return c.JSON(http.StatusNotFound, map[string]string{"error": err.Error()})
		}
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "no se pudo cargar la referencia"})
	}
	return c.JSON(http.StatusOK, item)
}

func (h *Handler) createReference(c echo.Context) error {
	companyID := company.IDFromRequest(c)
	var req CreateReferenceRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "cuerpo de solicitud invalido"})
	}
	ref, result, err := h.service.CreateReference(companyID, req, actorFromRequest(c))
	if err != nil {
		if errors.Is(err, errReferenceRequired) || errors.Is(err, errDuplicateReference) {
			return c.JSON(http.StatusBadRequest, map[string]any{"error": result.Message, "ok": false})
		}
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "no se pudo crear la referencia"})
	}
	return c.JSON(http.StatusCreated, map[string]any{"item": ref, "result": result})
}

func (h *Handler) checkDuplicates(c echo.Context) error {
	companyID := company.IDFromRequest(c)
	ref := c.QueryParam("reference")
	desig := c.QueryParam("designation")
	candidates, err := h.service.FindDuplicateCandidates(companyID, ref, desig)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "no se pudieron verificar duplicados"})
	}
	return c.JSON(http.StatusOK, map[string]any{"candidates": candidates})
}

// ─── STOCK ENTRY ─────────────────────────────────────────────────────────────

func (h *Handler) registerStockEntry(c echo.Context) error {
	companyID := company.IDFromRequest(c)
	var req RegisterStockEntryRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "cuerpo de solicitud invalido"})
	}
	result, err := h.service.RegisterStockEntry(companyID, req, actorFromRequest(c))
	if err != nil {
		if errors.Is(err, errInvalidQuantity) || errors.Is(err, errReferenceNotFound) {
			return c.JSON(http.StatusBadRequest, map[string]any{"error": result.Message, "ok": false})
		}
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "no se pudo registrar la entrada"})
	}
	return c.JSON(http.StatusOK, result)
}

// ─── MOVEMENTS ───────────────────────────────────────────────────────────────

func (h *Handler) listMovements(c echo.Context) error {
	companyID := company.IDFromRequest(c)
	movs, err := h.service.ListMovements(companyID)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "no se pudieron cargar los movimientos"})
	}
	return c.JSON(http.StatusOK, map[string]any{"items": movs})
}

func (h *Handler) submitMovement(c echo.Context) error {
	companyID := company.IDFromRequest(c)
	var req SubmitMovementRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "cuerpo de solicitud invalido"})
	}

	result, err := h.service.SubmitMovement(companyID, req, actorFromRequest(c))
	if err != nil {
		if errors.Is(err, errInsufficientStock) {
			return c.JSON(http.StatusBadRequest, map[string]any{"error": result.Message, "ok": false})
		}
		if errors.Is(err, errInvalidQuantity) || errors.Is(err, errInvalidMovementType) || errors.Is(err, errReferenceNotFound) {
			return c.JSON(http.StatusBadRequest, map[string]any{"error": result.Message, "ok": false})
		}
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "no se pudo registrar el movimiento"})
	}
	return c.JSON(http.StatusOK, result)
}

// ─── ADJUSTMENT REQUESTS ─────────────────────────────────────────────────────

func (h *Handler) listAdjustmentRequests(c echo.Context) error {
	companyID := company.IDFromRequest(c)
	reqs, err := h.service.ListAdjustmentRequests(companyID)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "no se pudieron cargar las solicitudes"})
	}
	return c.JSON(http.StatusOK, map[string]any{"items": reqs})
}

func (h *Handler) createAdjustmentRequest(c echo.Context) error {
	companyID := company.IDFromRequest(c)
	var req SubmitMovementRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "cuerpo de solicitud invalido"})
	}
	result, err := h.service.CreateAdjustmentRequest(companyID, req, actorFromRequest(c))
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "no se pudo crear la solicitud"})
	}
	return c.JSON(http.StatusCreated, result)
}

func (h *Handler) approveMovementRequest(c echo.Context) error {
	companyID := company.IDFromRequest(c)
	reqID := c.Param("id")
	result, err := h.service.ApproveMovementRequest(companyID, reqID, actorFromRequest(c))
	if err != nil {
		if errors.Is(err, errRequestNotFound) || errors.Is(err, errInsufficientStock) {
			return c.JSON(http.StatusBadRequest, map[string]any{"error": result.Message, "ok": false})
		}
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "no se pudo aprobar la solicitud"})
	}
	return c.JSON(http.StatusOK, result)
}

// ─── RESERVATIONS ────────────────────────────────────────────────────────────

func (h *Handler) listReservations(c echo.Context) error {
	companyID := company.IDFromRequest(c)
	items, err := h.service.ListReservations(companyID)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "no se pudieron cargar las reservas"})
	}
	return c.JSON(http.StatusOK, map[string]any{"items": items})
}

func (h *Handler) createReservation(c echo.Context) error {
	companyID := company.IDFromRequest(c)
	var req CreateReservationRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "cuerpo de solicitud invalido"})
	}
	reservation, result, err := h.service.CreateReservation(companyID, req, actorFromRequest(c))
	if err != nil {
		if errors.Is(err, errInvalidQuantity) || errors.Is(err, errReferenceNotFound) || errors.Is(err, errInsufficientStock) {
			return c.JSON(http.StatusBadRequest, map[string]any{"error": result.Message, "ok": false})
		}
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "no se pudo crear la reserva"})
	}
	return c.JSON(http.StatusCreated, map[string]any{"reservation": reservation, "result": result})
}

func (h *Handler) releaseReservation(c echo.Context) error {
	companyID := company.IDFromRequest(c)
	id := c.Param("id")
	result, err := h.service.ReleaseReservation(companyID, id, actorFromRequest(c))
	if err != nil {
		if errors.Is(err, errReservationNotFound) {
			return c.JSON(http.StatusBadRequest, map[string]any{"error": result.Message, "ok": false})
		}
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "no se pudo liberar la reserva"})
	}
	return c.JSON(http.StatusOK, result)
}

func (h *Handler) extendReservation(c echo.Context) error {
	companyID := company.IDFromRequest(c)
	id := c.Param("id")
	result, err := h.service.ExtendReservation(companyID, id, actorFromRequest(c))
	if err != nil {
		if errors.Is(err, errReservationNotFound) {
			return c.JSON(http.StatusBadRequest, map[string]any{"error": result.Message, "ok": false})
		}
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "no se pudo renovar la reserva"})
	}
	return c.JSON(http.StatusOK, result)
}

func (h *Handler) consumeReservation(c echo.Context) error {
	companyID := company.IDFromRequest(c)
	id := c.Param("id")
	result, err := h.service.ConsumeReservation(companyID, id, actorFromRequest(c))
	if err != nil {
		if errors.Is(err, errReservationNotFound) || errors.Is(err, errInvalidStatus) || errors.Is(err, errInsufficientStock) {
			return c.JSON(http.StatusBadRequest, map[string]any{"error": result.Message, "ok": false})
		}
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "no se pudo consumir la reserva"})
	}
	return c.JSON(http.StatusOK, result)
}

func (h *Handler) refreshExpiredReservations(c echo.Context) error {
	companyID := company.IDFromRequest(c)
	count, err := h.service.RefreshExpiredReservations(companyID)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "no se pudieron actualizar las reservas"})
	}
	return c.JSON(http.StatusOK, map[string]any{"expired": count})
}

// ─── REPLENISHMENT ───────────────────────────────────────────────────────────

func (h *Handler) listReplenishmentItems(c echo.Context) error {
	companyID := company.IDFromRequest(c)
	items, err := h.service.ListReplenishmentItems(companyID)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "no se pudieron cargar los items de reposicion"})
	}
	return c.JSON(http.StatusOK, map[string]any{"items": items})
}

func (h *Handler) registerReplenishmentAttempt(c echo.Context) error {
	companyID := company.IDFromRequest(c)
	var req RegisterReplenishmentAttemptRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "cuerpo de solicitud invalido"})
	}
	result, err := h.service.RegisterReplenishmentAttempt(companyID, req, actorFromRequest(c))
	if err != nil {
		if errors.Is(err, errReplenishmentNotFound) {
			return c.JSON(http.StatusBadRequest, map[string]any{"error": result.Message, "ok": false})
		}
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "no se pudo registrar el intento"})
	}
	return c.JSON(http.StatusOK, result)
}

func (h *Handler) markReplenishmentObsolete(c echo.Context) error {
	companyID := company.IDFromRequest(c)
	ref := c.Param("reference")
	result, err := h.service.MarkReplenishmentObsolete(companyID, ref, actorFromRequest(c))
	if err != nil {
		if errors.Is(err, errReplenishmentNotFound) {
			return c.JSON(http.StatusBadRequest, map[string]any{"error": result.Message, "ok": false})
		}
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "no se pudo marcar como obsoleto"})
	}
	return c.JSON(http.StatusOK, result)
}

func (h *Handler) rebuildReplenishmentItems(c echo.Context) error {
	companyID := company.IDFromRequest(c)
	changed, err := h.service.RebuildReplenishmentItems(companyID)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "no se pudo reconstruir los items de reposicion"})
	}
	return c.JSON(http.StatusOK, map[string]any{"changed": changed})
}

// ─── PURCHASE LINES ──────────────────────────────────────────────────────────

func (h *Handler) listPurchaseLines(c echo.Context) error {
	companyID := company.IDFromRequest(c)
	lines, err := h.service.ListPurchaseLines(companyID)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "no se pudieron cargar las lineas de compra"})
	}
	return c.JSON(http.StatusOK, map[string]any{"items": lines})
}

func (h *Handler) generatePurchaseLines(c echo.Context) error {
	companyID := company.IDFromRequest(c)
	result, err := h.service.GeneratePurchaseLines(companyID, actorFromRequest(c), true)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "no se pudieron generar las lineas de compra"})
	}
	return c.JSON(http.StatusOK, result)
}

func (h *Handler) updatePurchaseLine(c echo.Context) error {
	companyID := company.IDFromRequest(c)
	id := c.Param("id")
	var req UpdatePurchaseLineRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "cuerpo de solicitud invalido"})
	}
	line, result, err := h.service.UpdatePurchaseLine(companyID, id, req, actorFromRequest(c))
	if err != nil {
		if errors.Is(err, errPurchaseLineNotFound) || errors.Is(err, errInvalidStatus) ||
			errors.Is(err, errNoUpdateFields) || errors.Is(err, errReferenceRequired) ||
			errors.Is(err, errInvalidQuantity) || errors.Is(err, errInvalidPrice) {
			return c.JSON(http.StatusBadRequest, map[string]any{"error": result.Message, "ok": false})
		}
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "no se pudo actualizar la linea"})
	}
	return c.JSON(http.StatusOK, map[string]any{"item": line, "result": result})
}

func (h *Handler) markPurchaseLineSent(c echo.Context) error {
	companyID := company.IDFromRequest(c)
	id := c.Param("id")
	result, err := h.service.MarkPurchaseLineSent(companyID, id, actorFromRequest(c))
	if err != nil {
		if errors.Is(err, errPurchaseLineNotFound) {
			return c.JSON(http.StatusBadRequest, map[string]any{"error": result.Message, "ok": false})
		}
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "no se pudo actualizar la linea"})
	}
	return c.JSON(http.StatusOK, result)
}

// receivePurchaseLine registra unidades recibidas del proveedor contra una
// linea abierta. El frontend manda la cantidad; el servicio la limita al
// faltante y acredita stock solo por lo recibido.
func (h *Handler) receivePurchaseLine(c echo.Context) error {
	companyID := company.IDFromRequest(c)
	id := c.Param("id")

	var req struct {
		Quantity int `json:"quantity"`
	}
	if err := c.Bind(&req); err != nil || req.Quantity < 1 {
		return c.JSON(http.StatusBadRequest, map[string]any{"error": "Cantidad de recibo invalida (minimo 1).", "ok": false})
	}

	result, err := h.service.ReceivePurchaseLine(companyID, id, req.Quantity, actorFromRequest(c))
	if err != nil {
		switch {
		case errors.Is(err, errPurchaseLineNotFound), errors.Is(err, errInvalidStatus),
			errors.Is(err, errReceiveQuantity), errors.Is(err, errReferenceNotFound):
			return c.JSON(http.StatusBadRequest, map[string]any{"error": result.Message, "ok": false})
		default:
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": "no se pudo registrar el recibo"})
		}
	}
	return c.JSON(http.StatusOK, result)
}

func (h *Handler) closePurchaseLine(c echo.Context) error {
	companyID := company.IDFromRequest(c)
	id := c.Param("id")
	result, err := h.service.ClosePurchaseLine(companyID, id, actorFromRequest(c))
	if err != nil {
		if errors.Is(err, errPurchaseLineNotFound) || errors.Is(err, errInvalidStatus) {
			return c.JSON(http.StatusBadRequest, map[string]any{"error": result.Message, "ok": false})
		}
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "no se pudo cerrar la linea"})
	}
	return c.JSON(http.StatusOK, result)
}

// ─── WEEKLY SNAPSHOTS ────────────────────────────────────────────────────────

func (h *Handler) listWeeklySnapshots(c echo.Context) error {
	companyID := company.IDFromRequest(c)
	items, err := h.service.ListWeeklySnapshots(companyID)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "no se pudieron cargar los reportes"})
	}
	return c.JSON(http.StatusOK, map[string]any{"items": items})
}

func (h *Handler) generateWeeklySnapshot(c echo.Context) error {
	companyID := company.IDFromRequest(c)
	result, err := h.service.GenerateWeeklySnapshot(companyID, actorFromRequest(c))
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "no se pudo generar el reporte"})
	}
	return c.JSON(http.StatusOK, result)
}

// ─── BAGS ────────────────────────────────────────────────────────────────────

func (h *Handler) listBagTraces(c echo.Context) error {
	companyID := company.IDFromRequest(c)
	items, err := h.service.ListBagTraces(companyID)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "no se pudieron cargar las bolsas"})
	}
	return c.JSON(http.StatusOK, map[string]any{"items": items})
}

func (h *Handler) receiveTechnicianBag(c echo.Context) error {
	companyID := company.IDFromRequest(c)
	var req ReceiveTechnicianBagRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "cuerpo de solicitud invalido"})
	}
	result, err := h.service.ReceiveTechnicianBag(companyID, req, actorFromRequest(c))
	if err != nil {
		if errors.Is(err, errInvalidQuantity) || errors.Is(err, errReferenceNotFound) || errors.Is(err, errBagAlreadyActive) {
			return c.JSON(http.StatusBadRequest, map[string]any{"error": result.Message, "ok": false})
		}
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "no se pudo recibir la bolsa"})
	}
	return c.JSON(http.StatusCreated, result)
}

func (h *Handler) releaseTechnicianBag(c echo.Context) error {
	companyID := company.IDFromRequest(c)
	id := c.Param("id")
	result, err := h.service.ReleaseTechnicianBag(companyID, id, actorFromRequest(c))
	if err != nil {
		if errors.Is(err, errBagNotFound) || errors.Is(err, errInvalidStatus) || errors.Is(err, errInsufficientStock) {
			return c.JSON(http.StatusBadRequest, map[string]any{"error": result.Message, "ok": false})
		}
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "no se pudo liberar la bolsa"})
	}
	return c.JSON(http.StatusOK, result)
}

// ─── SESSIONS ────────────────────────────────────────────────────────────────

func (h *Handler) listSessions(c echo.Context) error {
	companyID := company.IDFromRequest(c)
	items, err := h.service.ListSessions(companyID)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "no se pudieron cargar las sesiones"})
	}
	return c.JSON(http.StatusOK, map[string]any{"items": items})
}

func (h *Handler) createSession(c echo.Context) error {
	companyID := company.IDFromRequest(c)
	var req CreateSessionRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "cuerpo de solicitud invalido"})
	}
	result, err := h.service.CreateSession(companyID, req, actorFromRequest(c))
	if err != nil {
		if errors.Is(err, errReferenceRequired) {
			return c.JSON(http.StatusBadRequest, map[string]any{"error": result.Message, "ok": false})
		}
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "no se pudo crear la sesion"})
	}
	return c.JSON(http.StatusCreated, result)
}

func (h *Handler) openSession(c echo.Context) error {
	companyID := company.IDFromRequest(c)
	id := c.Param("id")
	result, err := h.service.OpenSession(companyID, id, actorFromRequest(c))
	if err != nil {
		if errors.Is(err, errSessionNotFound) {
			return c.JSON(http.StatusBadRequest, map[string]any{"error": result.Message, "ok": false})
		}
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "no se pudo abrir la sesion"})
	}
	return c.JSON(http.StatusOK, result)
}

func (h *Handler) closeSession(c echo.Context) error {
	companyID := company.IDFromRequest(c)
	id := c.Param("id")
	result, err := h.service.CloseSession(companyID, id, actorFromRequest(c))
	if err != nil {
		if errors.Is(err, errSessionNotFound) {
			return c.JSON(http.StatusBadRequest, map[string]any{"error": result.Message, "ok": false})
		}
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "no se pudo cerrar la sesion"})
	}
	return c.JSON(http.StatusOK, result)
}

// ─── DISCREPANCIES ───────────────────────────────────────────────────────────

func (h *Handler) listDiscrepancies(c echo.Context) error {
	companyID := company.IDFromRequest(c)
	items, err := h.service.ListDiscrepancies(companyID)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "no se pudieron cargar las discrepancias"})
	}
	return c.JSON(http.StatusOK, map[string]any{"items": items})
}

func (h *Handler) approveDiscrepancy(c echo.Context) error {
	companyID := company.IDFromRequest(c)
	id := c.Param("id")
	result, err := h.service.ApproveDiscrepancy(companyID, id, actorFromRequest(c))
	if err != nil {
		if errors.Is(err, errRequestNotFound) {
			return c.JSON(http.StatusBadRequest, map[string]any{"error": result.Message, "ok": false})
		}
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "no se pudo aprobar la diferencia"})
	}
	return c.JSON(http.StatusOK, result)
}

// ─── AUDIT ───────────────────────────────────────────────────────────────────

func (h *Handler) listAuditTrail(c echo.Context) error {
	companyID := company.IDFromRequest(c)
	items, err := h.service.ListAuditTrail(companyID)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "no se pudo cargar la auditoria"})
	}
	return c.JSON(http.StatusOK, map[string]any{"items": items})
}

// ─── PURCHASE LINES ──────────────────────────────────────────────────────────

func (h *Handler) createPurchaseLine(c echo.Context) error {
	companyID := company.IDFromRequest(c)
	var req CreatePurchaseLineRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "cuerpo de solicitud invalido"})
	}
	line, result, err := h.service.CreatePurchaseLine(companyID, req, actorFromRequest(c))
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "no se pudo crear la linea de compra"})
	}
	if !result.OK {
		return c.JSON(http.StatusBadRequest, map[string]any{"error": result.Message, "ok": false})
	}
	return c.JSON(http.StatusCreated, map[string]any{"item": line, "result": result})
}

// ─── PURCHASE REQUESTS ───────────────────────────────────────────────────────

func (h *Handler) listPurchaseRequests(c echo.Context) error {
	companyID := company.IDFromRequest(c)
	projectID := c.QueryParam("projectId")
	items, err := h.service.ListPurchaseRequests(companyID, projectID)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "no se pudieron cargar las solicitudes"})
	}
	return c.JSON(http.StatusOK, map[string]any{"items": items})
}

func (h *Handler) createPurchaseRequest(c echo.Context) error {
	companyID := company.IDFromRequest(c)
	var req CreatePurchaseRequestRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "cuerpo de solicitud invalido"})
	}
	pr, result, err := h.service.CreatePurchaseRequest(companyID, req, actorFromRequest(c))
	if err != nil {
		if errors.Is(err, errInvalidQuantity) {
			return c.JSON(http.StatusBadRequest, map[string]any{"error": result.Message, "ok": false})
		}
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "no se pudo crear la solicitud"})
	}
	return c.JSON(http.StatusCreated, map[string]any{"item": pr, "result": result})
}

func (h *Handler) reviewPurchaseRequest(c echo.Context) error {
	companyID := company.IDFromRequest(c)
	id := c.Param("id")
	var req ReviewPurchaseRequestRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "cuerpo de solicitud invalido"})
	}
	result, err := h.service.ReviewPurchaseRequest(companyID, id, actorFromRequest(c), req)
	if err != nil {
		if errors.Is(err, errRequestNotFound) || errors.Is(err, errInvalidStatus) {
			return c.JSON(http.StatusBadRequest, map[string]any{"error": result.Message, "ok": false})
		}
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "no se pudo revisar la solicitud"})
	}
	return c.JSON(http.StatusOK, result)
}

// ─── CONSOLIDATION ───────────────────────────────────────────────────────────

func (h *Handler) consolidatePurchaseLines(c echo.Context) error {
	companyID := company.IDFromRequest(c)
	items, err := h.service.ConsolidatePurchaseLinesBySupplier(companyID)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "no se pudo consolidar"})
	}
	return c.JSON(http.StatusOK, map[string]any{"items": items})
}

// ─── APPROVAL ────────────────────────────────────────────────────────────────

func (h *Handler) approvePurchaseLine(c echo.Context) error {
	companyID := company.IDFromRequest(c)
	id := c.Param("id")
	result, err := h.service.ApprovePurchaseLine(companyID, id, actorFromRequest(c))
	if err != nil {
		if errors.Is(err, errPurchaseLineNotFound) {
			return c.JSON(http.StatusBadRequest, map[string]any{"error": result.Message, "ok": false})
		}
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "no se pudo aprobar"})
	}
	return c.JSON(http.StatusOK, result)
}

func (h *Handler) rejectPurchaseLine(c echo.Context) error {
	companyID := company.IDFromRequest(c)
	id := c.Param("id")
	result, err := h.service.RejectPurchaseLine(companyID, id, actorFromRequest(c))
	if err != nil {
		if errors.Is(err, errPurchaseLineNotFound) {
			return c.JSON(http.StatusBadRequest, map[string]any{"error": result.Message, "ok": false})
		}
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "no se pudo rechazar"})
	}
	return c.JSON(http.StatusOK, result)
}

// ─── LINK TO ORDER ───────────────────────────────────────────────────────────

func (h *Handler) linkPurchaseLineToOrder(c echo.Context) error {
	companyID := company.IDFromRequest(c)
	id := c.Param("id")
	var req struct {
		OrderID int64 `json:"orderId"`
	}
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "cuerpo de solicitud invalido"})
	}
	result, err := h.service.LinkPurchaseLineToOrder(companyID, id, req.OrderID, actorFromRequest(c))
	if err != nil {
		if errors.Is(err, errPurchaseLineNotFound) {
			return c.JSON(http.StatusBadRequest, map[string]any{"error": result.Message, "ok": false})
		}
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "no se pudo vincular"})
	}
	return c.JSON(http.StatusOK, result)
}
