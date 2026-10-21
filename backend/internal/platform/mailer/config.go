// Package mailer implementa los correos transaccionales de ALFA (Fase 5c).
//
// Antes de esta fase el backend no tenía NINGUNA infraestructura de correo
// (grep `smtp|sendmail|mailer` = 0 resultados en todo `backend/`), y tres
// flujos que el cliente pidió explícitamente por correo no enviaban nada:
// la cotización "Guardar y enviar", el aviso de despacho con transportadora
// y guía, y el acuse de recepción del equipo.
//
// El diseño es de outbox durable, no de envío en línea: los disparadores
// sólo ENCOLAN una fila en `email_outbox` y un worker la barre cada ~30 s.
// Así un SMTP caído o mal configurado no pierde el correo en silencio —
// queda como fila con su último error, visible en `GET /emails`.
package mailer

import (
	"os"
	"strconv"
	"strings"
)

// Config describe el servidor SMTP saliente. Se construye por entorno para
// no tocar `backend/.env` (fuera de alcance de la Fase 5c).
type Config struct {
	Host     string
	Port     int
	Username string
	Password string
	From     string

	// PublicBaseURL es la base pública del frontend, usada para armar el link
	// de aprobación de la cotización (`/estimate/:token`). Si viene vacía los
	// correos igual se envían, pero sin link clicable.
	PublicBaseURL string
}

// ConfigFromEnv lee la configuración del entorno.
//
// SMTP_HOST vacío ⇒ modo DESACTIVADO: nada se envía, pero nada se descarta
// tampoco. El worker marca las filas como 'desactivado' con el error
// "SMTP no configurado" para que la ausencia de correo sea visible en
// `GET /emails` en vez de parecer un éxito.
func ConfigFromEnv() Config {
	port := 587
	if raw := strings.TrimSpace(os.Getenv("SMTP_PORT")); raw != "" {
		if parsed, err := strconv.Atoi(raw); err == nil && parsed > 0 && parsed <= 65535 {
			port = parsed
		}
	}

	from := strings.TrimSpace(os.Getenv("SMTP_FROM"))
	if from == "" {
		from = strings.TrimSpace(os.Getenv("SMTP_USERNAME"))
	}

	return Config{
		Host:          strings.TrimSpace(os.Getenv("SMTP_HOST")),
		Port:          port,
		Username:      strings.TrimSpace(os.Getenv("SMTP_USERNAME")),
		Password:      os.Getenv("SMTP_PASSWORD"),
		From:          from,
		PublicBaseURL: strings.TrimRight(strings.TrimSpace(os.Getenv("PUBLIC_BASE_URL")), "/"),
	}
}

// Enabled reporta si hay SMTP configurado. Es la única fuente de verdad sobre
// el modo desactivado: ningún disparador ni el worker deben reimplementarla.
func (c Config) Enabled() bool {
	return strings.TrimSpace(c.Host) != ""
}

// DisabledError es el last_error que se graba en modo desactivado. Es texto
// fijo a propósito: la prueba de fuego de la Fase 5c lo busca literal.
const DisabledError = "SMTP no configurado"

// ApprovalURL arma el link público de aprobación de una cotización.
func (c Config) ApprovalURL(token string) string {
	token = strings.TrimSpace(token)
	if token == "" {
		return ""
	}
	if c.PublicBaseURL == "" {
		return "/estimate/" + token
	}
	return c.PublicBaseURL + "/estimate/" + token
}
