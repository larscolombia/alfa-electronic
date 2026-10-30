package equipmentcatalog

import (
	"errors"
	"net/http"
	"strings"

	"github.com/labstack/echo/v4"
	"pika.software.net.co/backend/internal/platform/company"
	"pika.software.net.co/backend/internal/platform/mailer"
)

type Handler struct {
	service *Service
}

func NewHandler(service *Service) *Handler {
	return &Handler{service: service}
}

// RegisterRoutes monta el CRUD de los cuatro maestros. Los upsert son PUT con
// el id en el cuerpo (el CRUD de la UI ya distingue crear de editar por id);
// DELETE usa el id en la ruta.
func (h *Handler) RegisterRoutes(group *echo.Group) {
	group.GET("", h.getCatalog)

	group.PUT("/families", h.upsertFamily)
	group.DELETE("/families/:itemID", h.deleteFamily)

	group.PUT("/models", h.upsertModel)
	group.DELETE("/models/:itemID", h.deleteModel)

	group.PUT("/service-types", h.upsertServiceType)
	group.DELETE("/service-types/:itemID", h.deleteServiceType)

	group.PUT("/locations", h.upsertLocation)
	group.DELETE("/locations/:itemID", h.deleteLocation)
}

func (h *Handler) getCatalog(c echo.Context) error {
	companyID := company.IDFromRequest(c)

	catalog, err := h.service.GetCatalog(companyID)
	if err != nil {
		return h.fail(c, err, "no se pudo cargar el catalogo de equipos")
	}
	return c.JSON(http.StatusOK, catalog)
}

func (h *Handler) upsertFamily(c echo.Context) error {
	companyID := company.IDFromRequest(c)
	var item Family
	if err := c.Bind(&item); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "cuerpo de solicitud invalido"})
	}

	saved, err := h.service.UpsertFamily(companyID, item)
	if err != nil {
		return h.fail(c, err, "no se pudo guardar la familia")
	}
	return c.JSON(http.StatusOK, saved)
}

func (h *Handler) deleteFamily(c echo.Context) error {
	return h.delete(c, h.service.DeleteFamily, "no se pudo eliminar la familia")
}

func (h *Handler) upsertModel(c echo.Context) error {
	companyID := company.IDFromRequest(c)
	var item Model
	if err := c.Bind(&item); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "cuerpo de solicitud invalido"})
	}

	saved, err := h.service.UpsertModel(companyID, item)
	if err != nil {
		return h.fail(c, err, "no se pudo guardar el modelo")
	}
	return c.JSON(http.StatusOK, saved)
}

func (h *Handler) deleteModel(c echo.Context) error {
	return h.delete(c, h.service.DeleteModel, "no se pudo eliminar el modelo")
}

func (h *Handler) upsertServiceType(c echo.Context) error {
	companyID := company.IDFromRequest(c)
	var item ServiceType
	if err := c.Bind(&item); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "cuerpo de solicitud invalido"})
	}

	saved, err := h.service.UpsertServiceType(companyID, item)
	if err != nil {
		return h.fail(c, err, "no se pudo guardar el tipo de servicio")
	}
	return c.JSON(http.StatusOK, saved)
}

func (h *Handler) deleteServiceType(c echo.Context) error {
	return h.delete(c, h.service.DeleteServiceType, "no se pudo eliminar el tipo de servicio")
}

func (h *Handler) upsertLocation(c echo.Context) error {
	companyID := company.IDFromRequest(c)
	var item Location
	if err := c.Bind(&item); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "cuerpo de solicitud invalido"})
	}
	// Cualquiera puede proponer una nueva ubicación durante la recepción; una
	// ubicación existente solo puede ser renombrada o modificada por admin.
	if strings.TrimSpace(item.ID) != "" {
		exists, err := h.service.LocationExists(companyID, item.ID)
		if err != nil {
			return h.fail(c, err, "no se pudo validar la ubicacion")
		}
		if exists && !isCatalogAdmin(c) {
			return c.JSON(http.StatusForbidden, map[string]string{"error": "solo un administrador puede editar una ubicación"})
		}
	}

	saved, err := h.service.UpsertLocation(companyID, item)
	if err != nil {
		return h.fail(c, err, "no se pudo guardar la ubicacion")
	}
	return c.JSON(http.StatusOK, saved)
}

func (h *Handler) deleteLocation(c echo.Context) error {
	if !isCatalogAdmin(c) {
		return c.JSON(http.StatusForbidden, map[string]string{"error": "solo un administrador puede eliminar una ubicación"})
	}
	companyID := company.IDFromRequest(c)
	if err := h.service.DeleteLocation(companyID, c.Param("itemID"), c.QueryParam("reassignTo")); err != nil {
		return h.fail(c, err, "no se pudo eliminar la ubicacion")
	}
	return c.JSON(http.StatusOK, map[string]string{"status": "ok"})
}

func isCatalogAdmin(c echo.Context) bool {
	role := strings.ToLower(strings.TrimSpace(mailer.RoleFromContext(c)))
	return role == "admin" || role == "superadmin"
}

// delete comparte el borrado: los cuatro maestros se borran igual.
func (h *Handler) delete(c echo.Context, fn func(companyID, id string) error, fallback string) error {
	companyID := company.IDFromRequest(c)
	if err := fn(companyID, c.Param("itemID")); err != nil {
		return h.fail(c, err, fallback)
	}
	return c.JSON(http.StatusOK, map[string]string{"status": "ok"})
}

// fail traduce los errores de validación a 400 y el resto a 500, para que la UI
// pueda mostrar el motivo real en vez de un genérico.
func (h *Handler) fail(c echo.Context, err error, fallback string) error {
	switch {
	case errors.Is(err, errCompanyRequired),
		errors.Is(err, errIDRequired),
		errors.Is(err, errReassignTarget),
		errors.Is(err, errNameRequired),
		errors.Is(err, errModelIncomplete):
		return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
	default:
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": fallback})
	}
}
