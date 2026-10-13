package crm

import (
	"net/http"

	"pika.software.net.co/backend/internal/platform/company"
	"github.com/labstack/echo/v4"
)

func (h *Handler) listProspectAttachments(c echo.Context) error {
	companyID := company.IDFromRequest(c)
	prospectID := c.Param("prospectID")

	items, err := h.service.ListProspectAttachments(companyID, prospectID)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "no se pudieron cargar los archivos adjuntos"})
	}

	return c.JSON(http.StatusOK, map[string]any{"items": items})
}

func (h *Handler) createProspectAttachment(c echo.Context) error {
	companyID := company.IDFromRequest(c)
	prospectID := c.Param("prospectID")

	var req CreateProspectAttachmentRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "cuerpo de solicitud invalido"})
	}

	created, err := h.service.CreateProspectAttachment(companyID, prospectID, req)
	if err != nil {
		var ve *validationError
		if isValidationError(err, &ve) {
			return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
		}
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "no se pudo registrar el archivo adjunto"})
	}

	return c.JSON(http.StatusCreated, created)
}

func (h *Handler) deleteProspectAttachment(c echo.Context) error {
	companyID := company.IDFromRequest(c)
	attachmentID := c.Param("attachmentID")

	if err := h.service.DeleteProspectAttachment(companyID, attachmentID); err != nil {
		var ve *validationError
		if isValidationError(err, &ve) {
			return c.JSON(http.StatusNotFound, map[string]string{"error": err.Error()})
		}
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "no se pudo eliminar el archivo adjunto"})
	}

	return c.NoContent(http.StatusNoContent)
}

func isValidationError(err error, target **validationError) bool {
	if err == nil {
		return false
	}
	if ve, ok := err.(*validationError); ok {
		if target != nil {
			*target = ve
		}
		return true
	}
	return false
}
