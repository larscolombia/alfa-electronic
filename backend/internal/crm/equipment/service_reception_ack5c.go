package equipment

import (
	"errors"
	"sort"
	"strings"

	"pika.software.net.co/backend/internal/platform/mailer"
)

// FASE 5c — Acuse de recepción por correo.
//
// La recepción ya persistía (PUT /crm-equipment/records + finalize), pero el
// cliente nunca recibía comprobante de qué equipos entregó. Ese acuse es la
// prueba en caso de disputa por un equipo o un accesorio faltante, así que va
// identificado por código/serie, no por un genérico "recibimos su equipo".
//
// El envío es un endpoint EXPLÍCITO y no un efecto colateral de `finalize`:
// finalizar la recepción es un hecho operativo válido aunque el cliente no
// tenga correo registrado, y no debe fallar por eso. Pero la ausencia de
// correo sí debe ser visible, así que este endpoint responde 422 con el motivo
// en vez de fingir un acuse enviado.

var errRecordEmailNotAvailable = errors.New("el cliente no tiene correo registrado: no se puede enviar el acuse de recepcion")

// SetEmailOutbox inyecta el outbox. Setter (no parámetro de NewService) para
// no romper `NewService(db, insightClient)`, que ya usan los tests.
func (s *Service) SetEmailOutbox(outbox *mailer.Outbox) {
	s.emailOutbox = outbox
}

// SendReceptionAck encola el acuse de recepción de un registro ya finalizado.
func (s *Service) SendReceptionAck(companyID, recordID, currentUser string) (mailer.Message, error) {
	if s.emailOutbox == nil {
		return mailer.Message{}, mailer.ErrNotEnqueued
	}

	normalizedID := strings.TrimSpace(recordID)
	if normalizedID == "" {
		return mailer.Message{}, errRecordIDRequired
	}

	record, err := s.GetRecord(companyID, normalizedID, true)
	if err != nil {
		return mailer.Message{}, err
	}

	// El destinatario sale del registro de recepción en BD (campo email de la
	// ficha del cliente), nunca del cuerpo de la petición.
	toEmail := strings.TrimSpace(record.Email)
	if toEmail == "" {
		return mailer.Message{}, errRecordEmailNotAvailable
	}

	identifiers := receptionIdentifiers(record.Items)
	if len(identifiers) == 0 {
		return mailer.Message{}, errors.New("el registro de recepcion no tiene equipos: no hay nada que acusar")
	}

	payload := mailer.ReceptionAckEmail{
		ClientName:  firstNonEmpty(record.CompanyName, record.ProspectName, record.ContactName),
		RecordID:    record.ID,
		ReceptionOn: formatReceptionLabel(record),
		Identifiers: identifiers,
	}

	return s.emailOutbox.Enqueue(mailer.EnqueueRequest{
		CompanyID: companyID,
		Kind:      mailer.KindReceptionAcknow,
		ToEmail:   toEmail,
		Subject:   payload.Subject(),
		BodyHTML:  payload.Body(),
		RefType:   "equipment-record",
		RefID:     normalizedID,
		CreatedBy: currentUser,
	})
}

// receptionIdentifiers lista los equipos por su identificador de recepción,
// que es lo que el cliente reconoce (y lo que se anota en la etiqueta).
func receptionIdentifiers(items []Item) []string {
	seen := make(map[string]struct{}, len(items))
	identifiers := make([]string, 0, len(items))

	for _, item := range items {
		label := firstNonEmpty(item.ReceivedIdentifier, item.Serie, buildDisplayName(
			strings.TrimSpace(item.FamilyName),
			strings.TrimSpace(item.Marca),
			strings.TrimSpace(item.Tipo),
			strings.TrimSpace(item.Serie),
		), item.ID)
		label = strings.TrimSpace(label)
		if label == "" || label == "Equipo" {
			continue
		}
		key := strings.ToLower(label)
		if _, duplicated := seen[key]; duplicated {
			continue
		}
		seen[key] = struct{}{}
		identifiers = append(identifiers, label)
	}

	sort.Strings(identifiers)
	return identifiers
}

func firstNonEmpty(values ...string) string {
	for _, value := range values {
		if strings.TrimSpace(value) != "" {
			return strings.TrimSpace(value)
		}
	}
	return ""
}
