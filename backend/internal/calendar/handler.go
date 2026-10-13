package calendar

import (
	"errors"
	"net/http"
	"strconv"
	"strings"

	"pika.software.net.co/backend/internal/platform/company"
	"github.com/labstack/echo/v4"
)

type Handler struct {
	service *Service
}

func NewHandler(service *Service) *Handler {
	return &Handler{service: service}
}

func (h *Handler) RegisterRoutes(group *echo.Group) {
	group.GET("/events", h.listEvents)
	group.POST("/events", h.createEvent)
	group.GET("/events/:eventID", h.getEvent)
	group.PUT("/events/:eventID", h.updateEvent)
	group.DELETE("/events/:eventID", h.deleteEvent)
}

func (h *Handler) listEvents(c echo.Context) error {
	companyID := company.IDFromRequest(c)

	limit, err := parseLimit(c.QueryParam("limit"))
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
	}

	items, err := h.service.ListEvents(companyID, ListEventsQuery{
		From:  c.QueryParam("from"),
		To:    c.QueryParam("to"),
		Limit: limit,
	})
	if err != nil {
		switch {
		case errors.Is(err, errEventTimeInvalid), errors.Is(err, errListLimitInvalid):
			return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
		default:
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": "failed to load calendar events"})
		}
	}

	return c.JSON(http.StatusOK, map[string]any{"items": items})
}

func (h *Handler) getEvent(c echo.Context) error {
	companyID := company.IDFromRequest(c)
	eventID := c.Param("eventID")

	item, err := h.service.GetEvent(companyID, eventID)
	if err != nil {
		switch {
		case errors.Is(err, errEventIDRequired):
			return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
		case errors.Is(err, errEventNotFound):
			return c.JSON(http.StatusNotFound, map[string]string{"error": err.Error()})
		default:
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": "failed to load calendar event"})
		}
	}

	return c.JSON(http.StatusOK, item)
}

func (h *Handler) createEvent(c echo.Context) error {
	companyID := company.IDFromRequest(c)

	var req CreateEventRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid request body"})
	}

	created, err := h.service.CreateEvent(companyID, req)
	if err != nil {
		switch {
		case errors.Is(err, errEventTitleRequired),
			errors.Is(err, errEventStartRequired),
			errors.Is(err, errEventTimeInvalid):
			return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
		default:
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": "failed to create calendar event"})
		}
	}

	return c.JSON(http.StatusCreated, created)
}

func (h *Handler) updateEvent(c echo.Context) error {
	companyID := company.IDFromRequest(c)
	eventID := c.Param("eventID")

	var req CreateEventRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid request body"})
	}

	updated, err := h.service.UpdateEvent(companyID, eventID, req)
	if err != nil {
		switch {
		case errors.Is(err, errEventIDRequired),
			errors.Is(err, errEventTitleRequired),
			errors.Is(err, errEventStartRequired),
			errors.Is(err, errEventTimeInvalid):
			return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
		case errors.Is(err, errEventNotFound):
			return c.JSON(http.StatusNotFound, map[string]string{"error": err.Error()})
		default:
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": "failed to update calendar event"})
		}
	}

	return c.JSON(http.StatusOK, updated)
}

func (h *Handler) deleteEvent(c echo.Context) error {
	companyID := company.IDFromRequest(c)
	eventID := c.Param("eventID")

	removed, err := h.service.DeleteEvent(companyID, eventID)
	if err != nil {
		if errors.Is(err, errEventIDRequired) {
			return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
		}
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "failed to delete calendar event"})
	}

	if !removed {
		return c.JSON(http.StatusNotFound, map[string]string{"error": "event not found"})
	}

	return c.NoContent(http.StatusNoContent)
}

func parseLimit(raw string) (int, error) {
	trimmed := strings.TrimSpace(raw)
	if trimmed == "" {
		return 0, nil
	}

	value, err := strconv.Atoi(trimmed)
	if err != nil || value <= 0 {
		return 0, errListLimitInvalid
	}

	return value, nil
}
