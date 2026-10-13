package company

import (
	"strings"

	"github.com/labstack/echo/v4"
)

const (
	HeaderName       = "X-Company-Id"
	DefaultCompanyID = "demo-company"
)

func IDFromRequest(c echo.Context) string {
	companyID := strings.TrimSpace(c.Request().Header.Get(HeaderName))
	if companyID == "" {
		return DefaultCompanyID
	}
	return companyID
}
