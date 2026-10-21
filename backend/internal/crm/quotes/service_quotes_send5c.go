package quotes

import (
	"context"
	"database/sql"
	"errors"
	"strings"

	"pika.software.net.co/backend/internal/platform/mailer"
)

// FASE 5c — Correo de la cotización "Guardar y enviar".
//
// Antes de esto el botón sólo cambiaba el estado a 'Enviado' en BD: la UI
// decía "enviada" y no salía ningún correo (grep `smtp|sendmail|mailer` = 0
// resultados en todo el backend). Ahora el envío es un paso explícito y
// separado del guardado, porque son dos cosas distintas que pueden fallar por
// separado: guardar la cotización NO debe fallar porque falte el correo del
// cliente, pero la ausencia de correo TAMPOCO debe reportarse como éxito.

// SetEmailOutbox inyecta el outbox. Es un setter (no un parámetro de
// NewService) siguiendo el precedente de
// inventoryService.SetPurchaseLineEditNotifier en main.go: así el constructor
// no cambia y los tests existentes siguen compilando.
func (s *Service) SetEmailOutbox(outbox *mailer.Outbox) {
	s.emailOutbox = outbox
}

// SendQuoteEmail encola el correo de la cotización con su link público de
// aprobación (`/estimate/:token`).
//
// El destinatario sale de BD, nunca del navegador: primero el `correo` de la
// propia cotización (que se persistió desde el prospecto) y, si está vacío, el
// correo del cliente en `crm_clients` por empresa/nombre. Si ninguno existe se
// devuelve mailer.ErrNoRecipient para que la UI muestre el error.
func (s *Service) SendQuoteEmail(companyID, quoteID, currentUser string) (mailer.Message, error) {
	if s.emailOutbox == nil {
		return mailer.Message{}, mailer.ErrNotEnqueued
	}

	normalizedID := strings.TrimSpace(quoteID)
	if normalizedID == "" {
		return mailer.Message{}, errQuoteIDRequired
	}

	quote, err := s.GetQuote(companyID, normalizedID)
	if err != nil {
		return mailer.Message{}, err
	}

	toEmail := strings.TrimSpace(quote.Correo)
	if toEmail == "" {
		toEmail, err = s.resolveClientEmail(context.Background(), companyID, quote.Empresa, quote.Prospecto)
		if err != nil {
			return mailer.Message{}, err
		}
	}
	if toEmail == "" {
		return mailer.Message{}, mailer.ErrNoRecipient
	}

	payload := mailer.QuoteSentEmail{
		Codigo:      quote.Codigo,
		Prospecto:   quote.Prospecto,
		Empresa:     quote.Empresa,
		ValidoHasta: quote.ValidoHasta,
		Total:       quote.Total,
		Moneda:      quote.Moneda,
		ApprovalURL: s.emailOutbox.Config().ApprovalURL(quote.Token),
	}

	return s.emailOutbox.Enqueue(mailer.EnqueueRequest{
		CompanyID: companyID,
		Kind:      mailer.KindQuoteSent,
		ToEmail:   toEmail,
		Subject:   payload.Subject(),
		BodyHTML:  payload.Body(),
		RefType:   "crm-quote",
		RefID:     normalizedID,
		CreatedBy: currentUser,
	})
}

// resolveClientEmail busca el correo del cliente en crm_clients. Lectura por
// SQL desde este paquete (mismo patrón que usa internal/finance para leer
// crm_quotes desde la Fase 5b): evita que quotes importe crm y que main.go
// tenga que cablear una dependencia nueva.
func (s *Service) resolveClientEmail(ctx context.Context, companyID, empresa, prospecto string) (string, error) {
	empresa = strings.TrimSpace(empresa)
	prospecto = strings.TrimSpace(prospecto)
	if empresa == "" && prospecto == "" {
		return "", nil
	}

	var email sql.NullString
	err := s.db.QueryRowContext(ctx, `
SELECT COALESCE(NULLIF(btrim(billing_email), ''), NULLIF(btrim(correo), ''), NULL)
FROM crm_clients
WHERE company_id = $1
  AND soft_delete = false
  AND (
	($2 <> '' AND (lower(empresa) = lower($2) OR lower(nombre) = lower($2)))
	OR ($3 <> '' AND (lower(empresa) = lower($3) OR lower(nombre) = lower($3)))
  )
ORDER BY updated_at DESC
LIMIT 1`, companyID, empresa, prospecto).Scan(&email)
	if errors.Is(err, sql.ErrNoRows) {
		return "", nil
	}
	if err != nil {
		return "", err
	}
	if !email.Valid {
		return "", nil
	}
	return strings.TrimSpace(email.String), nil
}
