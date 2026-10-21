package finance

import (
	"errors"
	"net/http"

	"github.com/labstack/echo/v4"
	"pika.software.net.co/backend/internal/platform/company"
)

func (h *Handler) getSetting(c echo.Context) error {
	companyID := company.IDFromRequest(c)
	key := c.Param("settingKey")

	setting, found, err := h.service.GetSetting(companyID, key)
	if err != nil {
		if errors.Is(err, errSettingKeyRequired) {
			return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
		}
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "no se pudo cargar la configuracion"})
	}
	if !found {
		return c.JSON(http.StatusNotFound, map[string]string{"error": errSettingNotFound.Error()})
	}

	return c.JSON(http.StatusOK, setting)
}

func (h *Handler) putSetting(c echo.Context) error {
	companyID := company.IDFromRequest(c)
	key := c.Param("settingKey")

	var req UpsertSettingRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "cuerpo de solicitud invalido"})
	}

	setting, err := h.service.PutSetting(companyID, key, req.Value)
	if err != nil {
		switch {
		case errors.Is(err, errSettingKeyRequired), errors.Is(err, errSettingValueRequired):
			return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
		default:
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": "no se pudo guardar la configuracion"})
		}
	}

	return c.JSON(http.StatusOK, setting)
}
