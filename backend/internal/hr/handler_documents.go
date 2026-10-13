package hr

import (
	"errors"
	"log"
	"net/http"

	"github.com/labstack/echo/v4"
	"pika.software.net.co/backend/internal/platform/company"
)

// listEmployeeDocuments devuelve metadata sin el contenido base64 para no
// inflar el payload; el contenido se obtiene en el endpoint de descarga.
func (h *Handler) listEmployeeDocuments(c echo.Context) error {
	companyID := company.IDFromRequest(c)
	employeeID := c.Param("employeeID")

	items, err := h.service.ListEmployeeDocuments(companyID, employeeID)
	if err != nil {
		if errors.Is(err, errEmployeeNotFound) {
			return c.JSON(http.StatusNotFound, map[string]string{"error": err.Error()})
		}
		log.Printf("hr: list documents for employee %q failed for company %q: %v", employeeID, companyID, err)
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "no se pudieron cargar los documentos"})
	}

	return c.JSON(http.StatusOK, map[string]any{"items": items})
}

func (h *Handler) createEmployeeDocument(c echo.Context) error {
	companyID := company.IDFromRequest(c)
	employeeID := c.Param("employeeID")

	var req CreateEmployeeDocumentRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid request body"})
	}

	created, err := h.service.CreateEmployeeDocument(companyID, employeeID, req)
	if err != nil {
		switch {
		case errors.Is(err, errEmployeeNotFound):
			return c.JSON(http.StatusNotFound, map[string]string{"error": err.Error()})
		case errors.Is(err, errDocumentFileNameRequired),
			errors.Is(err, errDocumentDataRequired),
			errors.Is(err, errDocumentTooLarge):
			return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
		default:
			log.Printf("hr: create document for employee %q failed for company %q: %v", employeeID, companyID, err)
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": "no se pudo cargar el documento"})
		}
	}

	return c.JSON(http.StatusCreated, created)
}

func (h *Handler) downloadEmployeeDocument(c echo.Context) error {
	companyID := company.IDFromRequest(c)
	employeeID := c.Param("employeeID")
	documentID := c.Param("documentID")

	download, err := h.service.GetEmployeeDocumentData(companyID, employeeID, documentID)
	if err != nil {
		if errors.Is(err, errDocumentNotFound) {
			return c.JSON(http.StatusNotFound, map[string]string{"error": err.Error()})
		}
		log.Printf("hr: download document %q failed for company %q: %v", documentID, companyID, err)
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "no se pudo descargar el documento"})
	}

	return c.JSON(http.StatusOK, download)
}

func (h *Handler) deleteEmployeeDocument(c echo.Context) error {
	companyID := company.IDFromRequest(c)
	employeeID := c.Param("employeeID")
	documentID := c.Param("documentID")

	if err := h.service.DeleteEmployeeDocument(companyID, employeeID, documentID); err != nil {
		if errors.Is(err, errDocumentNotFound) {
			return c.JSON(http.StatusNotFound, map[string]string{"error": err.Error()})
		}
		log.Printf("hr: delete document %q failed for company %q: %v", documentID, companyID, err)
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "no se pudo eliminar el documento"})
	}

	return c.NoContent(http.StatusNoContent)
}
