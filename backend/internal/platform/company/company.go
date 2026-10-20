package company

import (
	"strings"

	"github.com/labstack/echo/v4"
)

const (
	HeaderName       = "X-Company-Id"
	DefaultCompanyID = "demo-company"

	// ContextKey es la clave de echo.Context donde el middleware JWT publica la
	// empresa del usuario autenticado (claim companyId del token).
	ContextKey = "auth.company"
)

// IDFromRequest resuelve la empresa de la peticion.
//
// Orden de precedence (Fase 2b):
//  1. La empresa del contexto, puesta por el middleware JWT desde el token: es la
//     empresa del usuario autenticado y NO la puede elegir el navegador. Antes la
//     empresa salia solo de la cabecera X-Company-Id, o sea que cualquier cliente
//     autenticado podia apuntar a otra empresa y leer/escribir sus datos.
//  2. La cabecera X-Company-Id, solo cuando no hay identidad (rutas publicas como
//     /auth y las rutas publicas de /crm-quotes) o con tokens antiguos emitidos
//     antes de que existiera el claim companyId, que caen aqui y siguen funcionando
//     exactamente como antes.
//  3. DefaultCompanyID.
func IDFromRequest(c echo.Context) string {
	if c == nil {
		return DefaultCompanyID
	}

	if authenticated, ok := c.Get(ContextKey).(string); ok {
		if companyID := strings.TrimSpace(authenticated); companyID != "" {
			return companyID
		}
	}

	companyID := strings.TrimSpace(c.Request().Header.Get(HeaderName))
	if companyID == "" {
		return DefaultCompanyID
	}
	return companyID
}
