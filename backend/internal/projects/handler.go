package projects

import (
	"errors"
	"net/http"
	"strconv"
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
	group.GET("", h.listProjects)
	group.POST("", h.createProject)
	group.GET("/board-config", h.getBoardConfig)
	group.PUT("/board-config", h.updateBoardConfig)
	group.GET("/:projectID", h.getProject)
	group.PUT("/:projectID", h.updateProject)
	group.DELETE("/:projectID", h.deleteProject)
	group.POST("/:projectID/diagnosis/close", h.closeDiagnosis)
	group.GET("/sla-config", h.getSLAConfig)
	group.PUT("/sla-config", h.updateSLAConfig)
	group.GET("/notifications", h.listNotifications)
	group.POST("/notifications", h.createNotification)
	group.PATCH("/notifications/:notificationID/read", h.markNotificationRead)
	group.GET("/technical-reports", h.listTechnicalReports)
	group.POST("/technical-reports", h.createTechnicalReport)
}

func (h *Handler) listProjects(c echo.Context) error {
	companyID := company.IDFromRequest(c)
	limit, err := parseLimit(c.QueryParam("limit"))
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
	}

	items, err := h.service.ListProjects(companyID, ListProjectsQuery{
		Status: c.QueryParam("status"),
		Limit:  limit,
	})
	if err != nil {
		switch {
		case errors.Is(err, errProjectStatusInvalid), errors.Is(err, errProjectsListLimitInvalid):
			return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
		default:
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": "no se pudieron cargar los proyectos"})
		}
	}

	return c.JSON(http.StatusOK, map[string]any{"items": items})
}

func (h *Handler) getProject(c echo.Context) error {
	companyID := company.IDFromRequest(c)
	projectID := c.Param("projectID")

	item, err := h.service.GetProject(companyID, projectID)
	if err != nil {
		switch {
		case errors.Is(err, errProjectIDRequired):
			return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
		case errors.Is(err, errProjectNotFound):
			return c.JSON(http.StatusNotFound, map[string]string{"error": err.Error()})
		default:
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": "no se pudo cargar el proyecto"})
		}
	}

	return c.JSON(http.StatusOK, item)
}

func (h *Handler) createProject(c echo.Context) error {
	companyID := company.IDFromRequest(c)

	var req UpsertProjectRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "cuerpo de solicitud invalido"})
	}

	item, err := h.service.UpsertProject(companyID, req)
	if err != nil {
		switch {
		case errors.Is(err, errProjectIDRequired),
			errors.Is(err, errProjectStatusInvalid),
			errors.Is(err, errProjectTransitionInvalid),
			errors.Is(err, errProjectPropertiesInvalid),
			errors.Is(err, errMaterialsPending):
			return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
		default:
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": "no se pudo crear el proyecto"})
		}
	}

	return c.JSON(http.StatusCreated, item)
}

func (h *Handler) updateProject(c echo.Context) error {
	companyID := company.IDFromRequest(c)
	projectID := strings.TrimSpace(c.Param("projectID"))

	var req UpsertProjectRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "cuerpo de solicitud invalido"})
	}
	req.ID = projectID

	item, err := h.service.UpsertProject(companyID, req)
	if err != nil {
		switch {
		case errors.Is(err, errProjectIDRequired),
			errors.Is(err, errProjectStatusInvalid),
			errors.Is(err, errProjectTransitionInvalid),
			errors.Is(err, errProjectPropertiesInvalid),
			errors.Is(err, errMaterialsPending):
			return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
		default:
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": "no se pudo actualizar el proyecto"})
		}
	}

	return c.JSON(http.StatusOK, item)
}

func (h *Handler) getBoardConfig(c echo.Context) error {
	companyID := company.IDFromRequest(c)

	config, err := h.service.GetBoardConfig(companyID)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "no se pudo cargar la configuracion del tablero"})
	}

	return c.JSON(http.StatusOK, config)
}

func (h *Handler) updateBoardConfig(c echo.Context) error {
	companyID := company.IDFromRequest(c)

	var config map[string]any
	if err := c.Bind(&config); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "cuerpo de solicitud invalido"})
	}

	saved, err := h.service.UpdateBoardConfig(companyID, config)
	if err != nil {
		if errors.Is(err, errProjectPropertiesInvalid) {
			return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
		}
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "no se pudo guardar la configuracion del tablero"})
	}

	return c.JSON(http.StatusOK, saved)
}

func (h *Handler) deleteProject(c echo.Context) error {
	companyID := company.IDFromRequest(c)
	projectID := strings.TrimSpace(c.Param("projectID"))

	if err := h.service.DeleteProject(companyID, projectID); err != nil {
		switch {
		case errors.Is(err, errProjectIDRequired):
			return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
		case errors.Is(err, errProjectNotFound):
			return c.JSON(http.StatusNotFound, map[string]string{"error": err.Error()})
		default:
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": "no se pudo eliminar el proyecto"})
		}
	}

	return c.JSON(http.StatusOK, map[string]string{"status": "ok"})
}

func (h *Handler) closeDiagnosis(c echo.Context) error {
	companyID := company.IDFromRequest(c)
	projectID := strings.TrimSpace(c.Param("projectID"))

	var req CloseDiagnosisRequest
	if c.Request().ContentLength > 0 {
		if err := c.Bind(&req); err != nil {
			return c.JSON(http.StatusBadRequest, map[string]string{"error": "cuerpo de solicitud invalido"})
		}
	}

	closedBy := strings.TrimSpace(req.ClosedBy)
	if closedBy == "" {
		closedBy = strings.TrimSpace(asString(c.Get("auth.email")))
	}

	item, err := h.service.CloseDiagnosis(companyID, projectID, closedBy)
	if err != nil {
		switch {
		case errors.Is(err, errProjectIDRequired),
			errors.Is(err, errDiagnosisFaultRequired),
			errors.Is(err, errDiagnosisEstimatedHoursNeeded),
			errors.Is(err, errDiagnosisPartsBudgetNeeded):
			return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
		case errors.Is(err, errProjectNotFound):
			return c.JSON(http.StatusNotFound, map[string]string{"error": err.Error()})
		default:
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": "no se pudo cerrar el diagnostico"})
		}
	}

	return c.JSON(http.StatusOK, item)
}

func (h *Handler) getSLAConfig(c echo.Context) error {
	companyID := company.IDFromRequest(c)
	config, err := h.service.GetSLAConfig(companyID)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": err.Error()})
	}
	return c.JSON(http.StatusOK, config)
}

func (h *Handler) updateSLAConfig(c echo.Context) error {
	companyID := company.IDFromRequest(c)
	var configs []SLAConfig
	if err := c.Bind(&configs); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "cuerpo invalido"})
	}
	if err := h.service.UpdateSLAConfig(companyID, configs); err != nil {
		if errors.Is(err, errSLAConfigInvalid) {
			return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
		}
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": err.Error()})
	}
	return c.JSON(http.StatusOK, configs)
}

func (h *Handler) listNotifications(c echo.Context) error {
	companyID := company.IDFromRequest(c)
	notifications, err := h.service.ListNotifications(companyID)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": err.Error()})
	}
	return c.JSON(http.StatusOK, map[string]any{"items": notifications})
}

func (h *Handler) createNotification(c echo.Context) error {
	companyID := company.IDFromRequest(c)
	var n Notification
	if err := c.Bind(&n); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "cuerpo invalido"})
	}
	created, err := h.service.CreateNotification(companyID, n)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": err.Error()})
	}
	return c.JSON(http.StatusCreated, created)
}

func (h *Handler) markNotificationRead(c echo.Context) error {
	companyID := company.IDFromRequest(c)
	notificationID := c.Param("notificationID")
	if err := h.service.MarkNotificationRead(companyID, notificationID); err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": err.Error()})
	}
	return c.JSON(http.StatusOK, map[string]string{"status": "ok"})
}

func (h *Handler) listTechnicalReports(c echo.Context) error {
	companyID := company.IDFromRequest(c)
	reports, err := h.service.ListTechnicalReports(companyID)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": err.Error()})
	}
	return c.JSON(http.StatusOK, map[string]any{"items": reports})
}

func (h *Handler) createTechnicalReport(c echo.Context) error {
	companyID := company.IDFromRequest(c)
	var req map[string]any
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "cuerpo invalido"})
	}
	report, err := h.service.CreateTechnicalReport(companyID, req)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": err.Error()})
	}
	return c.JSON(http.StatusCreated, report)
}

func parseLimit(raw string) (int, error) {
	trimmed := strings.TrimSpace(raw)
	if trimmed == "" {
		return 0, nil
	}

	value, err := strconv.Atoi(trimmed)
	if err != nil || value <= 0 {
		return 0, errProjectsListLimitInvalid
	}

	return value, nil
}
