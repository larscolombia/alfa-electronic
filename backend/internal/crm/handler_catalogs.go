package crm

import (
	"errors"
	"net/http"

	"pika.software.net.co/backend/internal/platform/company"
	"github.com/labstack/echo/v4"
)

func (h *Handler) listCatalogs(c echo.Context) error {
	companyID := company.IDFromRequest(c)
	items, err := h.service.Catalogs(companyID)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "no se pudieron cargar los catalogos de CRM"})
	}

	return c.JSON(http.StatusOK, items)
}

func (h *Handler) listCatalog(c echo.Context) error {
	companyID := company.IDFromRequest(c)
	catalogType := c.Param("catalogType")

	items, err := h.service.ListCatalog(companyID, catalogType)
	if err != nil {
		switch {
		case errors.Is(err, errCatalogTypeInvalid):
			return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
		default:
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": "no se pudo cargar el catalogo de CRM"})
		}
	}

	return c.JSON(http.StatusOK, map[string]any{"items": items})
}

func (h *Handler) createCatalogItem(c echo.Context) error {
	companyID := company.IDFromRequest(c)
	catalogType := c.Param("catalogType")

	var req struct {
		Name string `json:"name"`
	}
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "cuerpo de solicitud invalido"})
	}

	item, err := h.service.AddCatalogItem(companyID, catalogType, req.Name)
	if err != nil {
		switch {
		case errors.Is(err, errCatalogTypeInvalid), errors.Is(err, errCatalogNameRequired):
			return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
		case errors.Is(err, errCatalogNameExists):
			return c.JSON(http.StatusConflict, map[string]string{"error": err.Error()})
		default:
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": "no se pudo crear el item del catalogo de CRM"})
		}
	}

	return c.JSON(http.StatusCreated, item)
}

func (h *Handler) deleteCatalogItem(c echo.Context) error {
	companyID := company.IDFromRequest(c)
	catalogType := c.Param("catalogType")
	itemID := c.Param("itemID")

	deleted, err := h.service.RemoveCatalogItem(companyID, catalogType, itemID)
	if err != nil {
		switch {
		case errors.Is(err, errCatalogTypeInvalid), errors.Is(err, errCatalogItemIDRequired):
			return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
		default:
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": "no se pudo eliminar el item del catalogo de CRM"})
		}
	}

	if !deleted {
		return c.JSON(http.StatusNotFound, map[string]string{"error": "item del catalogo no encontrado"})
	}

	return c.NoContent(http.StatusNoContent)
}

func (h *Handler) restoreDefaultCatalog(c echo.Context) error {
	companyID := company.IDFromRequest(c)
	catalogType := c.Param("catalogType")

	items, err := h.service.RestoreDefaultCatalog(companyID, catalogType)
	if err != nil {
		switch {
		case errors.Is(err, errCatalogTypeInvalid):
			return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
		default:
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": "no se pudieron restaurar los catalogos por defecto de CRM"})
		}
	}

	return c.JSON(http.StatusOK, map[string]any{"items": items})
}
