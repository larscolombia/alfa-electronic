package hr

import (
	"encoding/json"
	"errors"
	"log"
	"net/http"
	"strings"

	"github.com/labstack/echo/v4"
	"pika.software.net.co/backend/internal/acl"
	"pika.software.net.co/backend/internal/platform/company"
)

// employeePayload aplica el enmascarado por campo del ACL: los campos marcados
// como "oculto" para el rol se eliminan de la respuesta. El slug del catalogo se
// compara en minusculas contra las claves JSON (el slugify del seed normaliza a
// minusculas: "documentNumber" -> "documentnumber"). Sin permisos en contexto
// (p. ej. admin) no enmascara.
func employeePayload(c echo.Context, employee Employee) (any, error) {
	hidden := acl.HiddenFieldSlugs(acl.FieldPermissionsFromContext(c))
	if len(hidden) == 0 {
		return employee, nil
	}

	raw, err := json.Marshal(employee)
	if err != nil {
		return nil, err
	}
	var payload map[string]any
	if err := json.Unmarshal(raw, &payload); err != nil {
		return nil, err
	}
	hiddenSet := make(map[string]bool, len(hidden))
	for _, slug := range hidden {
		hiddenSet[strings.ToLower(slug)] = true
	}
	for key := range payload {
		if hiddenSet[strings.ToLower(key)] {
			delete(payload, key)
		}
	}
	return payload, nil
}

func (h *Handler) listEmployees(c echo.Context) error {
	companyID := company.IDFromRequest(c)
	items, err := h.service.ListEmployees(companyID)
	if err != nil {
		log.Printf("hr: list employees failed for company %q: %v", companyID, err)
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "failed to load employees"})
	}

	payload := make([]any, 0, len(items))
	for _, employee := range items {
		item, err := employeePayload(c, employee)
		if err != nil {
			log.Printf("hr: mask employee %q failed for company %q: %v", employee.ID, companyID, err)
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": "failed to load employees"})
		}
		payload = append(payload, item)
	}

	return c.JSON(http.StatusOK, map[string]any{"items": payload})
}

func (h *Handler) getEmployee(c echo.Context) error {
	companyID := company.IDFromRequest(c)
	employeeID := c.Param("employeeID")

	employee, err := h.service.GetEmployee(companyID, employeeID)
	if err != nil {
		if errors.Is(err, errEmployeeNotFound) {
			return c.JSON(http.StatusNotFound, map[string]string{"error": err.Error()})
		}
		log.Printf("hr: get employee %q failed for company %q: %v", employeeID, companyID, err)
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "no se pudo cargar el empleado"})
	}

	payload, err := employeePayload(c, employee)
	if err != nil {
		log.Printf("hr: mask employee %q failed for company %q: %v", employeeID, companyID, err)
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "no se pudo cargar el empleado"})
	}

	return c.JSON(http.StatusOK, payload)
}

func (h *Handler) createEmployee(c echo.Context) error {
	companyID := company.IDFromRequest(c)

	var req CreateEmployeeRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid request body"})
	}

	created, err := h.service.CreateEmployee(companyID, req)
	if err != nil {
		if errors.Is(err, errEmployeeDocumentNumberConflict) || errors.Is(err, errEmployeeEmailExists) {
			return c.JSON(http.StatusConflict, map[string]string{"error": err.Error()})
		}
		if errors.Is(err, errEmployeeNameMissing) || errors.Is(err, errEmployeeEmailInvalid) ||
			errors.Is(err, errEmployeeEmailRequired) || errors.Is(err, errEmployeePasswordRequired) ||
			errors.Is(err, errEmployeeAccessRoleRequired) || errors.Is(err, errEmployeeAccessRoleUnknown) ||
			errors.Is(err, errEmployeeDateInvalid) || errors.Is(err, errEmployeePhotoInvalid) ||
			errors.Is(err, errEmployeePhotoTooLarge) {
			return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
		}
		log.Printf("hr: create employee failed for company %q: %v", companyID, err)
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "unexpected employee creation error"})
	}

	return c.JSON(http.StatusCreated, created)
}

func (h *Handler) updateEmployee(c echo.Context) error {
	companyID := company.IDFromRequest(c)
	employeeID := c.Param("employeeID")

	var req UpdateEmployeeRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid request body"})
	}

	updated, err := h.service.UpdateEmployee(companyID, employeeID, req)
	if err != nil {
		switch {
		case errors.Is(err, errEmployeeNotFound):
			return c.JSON(http.StatusNotFound, map[string]string{"error": err.Error()})
		case errors.Is(err, errEmployeeDocumentNumberConflict),
			errors.Is(err, errEmployeeEmailExists):
			return c.JSON(http.StatusConflict, map[string]string{"error": err.Error()})
		case errors.Is(err, errEmployeeNameMissing),
			errors.Is(err, errEmployeeStatusInvalid),
			errors.Is(err, errEmployeeEmailInvalid),
			errors.Is(err, errEmployeeEmailRequired),
			errors.Is(err, errEmployeePasswordRequired),
			errors.Is(err, errEmployeeAccessRoleRequired),
			errors.Is(err, errEmployeeAccessRoleUnknown),
			errors.Is(err, errEmployeeDateInvalid),
			errors.Is(err, errEmployeePhotoInvalid),
			errors.Is(err, errEmployeePhotoTooLarge):
			return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
		default:
			log.Printf("hr: update employee %q failed for company %q: %v", employeeID, companyID, err)
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": "no se pudo actualizar el empleado"})
		}
	}

	return c.JSON(http.StatusOK, updated)
}

func (h *Handler) resetEmployeePassword(c echo.Context) error {
	companyID := company.IDFromRequest(c)
	employeeID := c.Param("employeeID")

	response, err := h.service.ResetEmployeePassword(c.Request().Context(), companyID, employeeID)
	if err != nil {
		switch {
		case errors.Is(err, errEmployeeNotFound),
			errors.Is(err, errEmployeeAccessAccountMissing):
			return c.JSON(http.StatusNotFound, map[string]string{"error": err.Error()})
		case errors.Is(err, errEmployeeEmailMissing):
			return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
		default:
			log.Printf("hr: reset password for employee %q failed for company %q: %v", employeeID, companyID, err)
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": "no se pudo restablecer la clave del empleado"})
		}
	}

	return c.JSON(http.StatusOK, response)
}

func (h *Handler) softDeleteEmployees(c echo.Context) error {
	companyID := company.IDFromRequest(c)

	var payloads []EmployeeSoftDeletePayload
	if err := c.Bind(&payloads); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid request body"})
	}

	processed, err := h.service.SoftDeleteEmployees(companyID, payloads)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "failed to process employee soft-delete"})
	}

	return c.JSON(http.StatusOK, map[string]any{"processed": processed})
}
