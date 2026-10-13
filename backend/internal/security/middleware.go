package security

import (
	"net"
	"net/http"
	"strings"

	"pika.software.net.co/backend/internal/platform/company"
	"github.com/labstack/echo/v4"
)

func SourceFromEcho(c echo.Context) Source {
	ip := strings.TrimSpace(c.RealIP())
	if ip == "" {
		ip = parseRemoteHost(c.Request().RemoteAddr)
	}

	mac := strings.TrimSpace(c.Request().Header.Get(HeaderClientMAC))

	return Source{
		IP:  ip,
		MAC: mac,
	}
}

func (s *Service) EnforcementMiddleware() echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			email, _ := c.Get("auth.email").(string)
			role, _ := c.Get("auth.role").(string)

			subject := Subject{
				CompanyID: company.IDFromRequest(c),
				Email:     email,
				Role:      role,
			}

			source := SourceFromEcho(c)

			decision, err := s.Evaluate(c.Request().Context(), subject, source)
			if err != nil {
				return c.JSON(http.StatusInternalServerError, map[string]string{"error": "failed to evaluate advanced security restrictions"})
			}

			if !decision.Allowed {
				return c.JSON(http.StatusForbidden, map[string]string{"error": decision.Reason})
			}

			return next(c)
		}
	}
}

func parseRemoteHost(remoteAddr string) string {
	trimmed := strings.TrimSpace(remoteAddr)
	if trimmed == "" {
		return ""
	}

	host, _, err := net.SplitHostPort(trimmed)
	if err == nil {
		return host
	}

	if strings.HasPrefix(trimmed, "[") && strings.Contains(trimmed, "]") {
		end := strings.Index(trimmed, "]")
		if end > 1 {
			return trimmed[1:end]
		}
	}

	return trimmed
}
