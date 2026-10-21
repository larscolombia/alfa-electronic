package mailer

import (
	"fmt"
	"net/smtp"
	"strings"
)

// Sender es el contrato de transporte. Existe como interfaz para que los
// tests puedan ejercer el worker (reintentos, backoff, tope de intentos)
// sin levantar un servidor SMTP real.
type Sender interface {
	Send(to, subject, bodyHTML string) error
}

// smtpSender envía con net/smtp (librería estándar; la Fase 5c tiene
// prohibido añadir dependencias a go.mod).
type smtpSender struct {
	cfg Config
}

// NewSender construye el transportador SMTP. Devuelve nil cuando el correo
// está desactivado (SMTP_HOST vacío): el Outbox lo interpreta como modo
// desactivado y marca las filas en consecuencia en vez de fingir envíos.
func NewSender(cfg Config) Sender {
	if !cfg.Enabled() {
		return nil
	}
	return smtpSender{cfg: cfg}
}

func (s smtpSender) Send(to, subject, bodyHTML string) error {
	recipient := strings.TrimSpace(to)
	if recipient == "" {
		return fmt.Errorf("destinatario vacio")
	}
	from := strings.TrimSpace(s.cfg.From)
	if from == "" {
		return fmt.Errorf("SMTP_FROM vacio: no hay remitente configurado")
	}

	address := fmt.Sprintf("%s:%d", s.cfg.Host, s.cfg.Port)

	message := strings.Join([]string{
		"From: " + from,
		"To: " + recipient,
		"Subject: " + sanitizeHeader(subject),
		"MIME-Version: 1.0",
		"Content-Type: text/html; charset=\"UTF-8\"",
		"",
		bodyHTML,
	}, "\r\n")

	// Sin credenciales se intenta envío anónimo (relay local / Mailhog de
	// pruebas). Con credenciales se usa PLAIN sobre la conexión que net/smtp
	// negocia (STARTTLS en 587 cuando el servidor lo anuncia).
	var auth smtp.Auth
	if s.cfg.Username != "" {
		auth = smtp.PlainAuth("", s.cfg.Username, s.cfg.Password, s.cfg.Host)
	}

	if err := smtp.SendMail(address, auth, from, []string{recipient}, []byte(message)); err != nil {
		return fmt.Errorf("enviar a %s: %w", recipient, err)
	}
	return nil
}

// sanitizeHeader quita CR/LF del asunto: sin esto un asunto con salto de
// línea permitiría inyectar cabeceras (Bcc, otro To) en el mensaje.
func sanitizeHeader(value string) string {
	replacer := strings.NewReplacer("\r", " ", "\n", " ")
	return strings.TrimSpace(replacer.Replace(value))
}
