package equipment

import (
	"errors"
	"strings"
	"time"
)

var (
	errItemIDRequired       = errors.New("itemID es obligatorio")
	errItemNotFound         = errors.New("item de equipo no encontrado")
	errAttachmentIDRequired = errors.New("attachmentID es obligatorio")
	errAttachmentNotFound   = errors.New("adjunto no encontrado")
	errAttachmentInvalid    = errors.New("adjunto invalido: fileName y dataUrl son obligatorios")
	errAttachmentTooLarge   = errors.New("el adjunto supera el limite permitido (10MB)")
)

const maxAttachmentDataURLBytes = 10 * 1024 * 1024 * 4 / 3 // ~10MB binario en base64

// AddItemAttachment agrega un adjunto al item indicado dentro del record.
// Devuelve el item actualizado (incluye todos los adjuntos).
func (s *Service) AddItemAttachment(companyID, recordID, itemID string, attachment Attachment) (Item, error) {
	recordID = strings.TrimSpace(recordID)
	itemID = strings.TrimSpace(itemID)
	if recordID == "" {
		return Item{}, errRecordIDRequired
	}
	if itemID == "" {
		return Item{}, errItemIDRequired
	}

	attachment.FileName = strings.TrimSpace(attachment.FileName)
	attachment.AttachmentType = strings.TrimSpace(attachment.AttachmentType)
	attachment.MIMEType = strings.TrimSpace(attachment.MIMEType)
	attachment.DataURL = strings.TrimSpace(attachment.DataURL)
	attachment.Notes = strings.TrimSpace(attachment.Notes)
	attachment.UploadedBy = strings.TrimSpace(attachment.UploadedBy)
	attachment.SHA256 = strings.TrimSpace(attachment.SHA256)

	if attachment.FileName == "" || attachment.DataURL == "" {
		return Item{}, errAttachmentInvalid
	}
	if len(attachment.DataURL) > maxAttachmentDataURLBytes {
		return Item{}, errAttachmentTooLarge
	}

	if strings.TrimSpace(attachment.ID) == "" {
		attachment.ID = "att-" + time.Now().UTC().Format("20060102T150405.000000000")
	}
	if attachment.UploadedAt == "" {
		attachment.UploadedAt = time.Now().UTC().Format(time.RFC3339)
	}
	if attachment.MIMEType == "" {
		attachment.MIMEType = "application/octet-stream"
	}
	if attachment.SizeBytes <= 0 {
		// Estimacion aproximada a partir de la longitud base64 del dataURL.
		if idx := strings.Index(attachment.DataURL, ","); idx >= 0 {
			b64 := attachment.DataURL[idx+1:]
			attachment.SizeBytes = int64(len(b64)) * 3 / 4
		}
	}

	record, err := s.GetRecord(companyID, recordID, true)
	if err != nil {
		return Item{}, err
	}

	updated := false
	for index, item := range record.Items {
		if strings.TrimSpace(item.ID) != itemID {
			continue
		}
		if item.Attachments == nil {
			item.Attachments = make([]Attachment, 0, 1)
		}
		item.Attachments = append(item.Attachments, attachment)
		record.Items[index] = item
		updated = true
		break
	}
	if !updated {
		return Item{}, errItemNotFound
	}

	if _, err := s.UpsertRecord(companyID, record); err != nil {
		return Item{}, err
	}

	refreshed, err := s.GetRecord(companyID, recordID, true)
	if err != nil {
		return Item{}, err
	}
	for _, item := range refreshed.Items {
		if strings.TrimSpace(item.ID) == itemID {
			return item, nil
		}
	}
	return Item{}, errItemNotFound
}

// DeleteItemAttachment quita un adjunto especifico del item.
func (s *Service) DeleteItemAttachment(companyID, recordID, itemID, attachmentID string) (Item, error) {
	recordID = strings.TrimSpace(recordID)
	itemID = strings.TrimSpace(itemID)
	attachmentID = strings.TrimSpace(attachmentID)
	if recordID == "" {
		return Item{}, errRecordIDRequired
	}
	if itemID == "" {
		return Item{}, errItemIDRequired
	}
	if attachmentID == "" {
		return Item{}, errAttachmentIDRequired
	}

	record, err := s.GetRecord(companyID, recordID, true)
	if err != nil {
		return Item{}, err
	}

	itemFound := false
	attachmentFound := false
	for index, item := range record.Items {
		if strings.TrimSpace(item.ID) != itemID {
			continue
		}
		itemFound = true
		filtered := make([]Attachment, 0, len(item.Attachments))
		for _, att := range item.Attachments {
			if strings.TrimSpace(att.ID) == attachmentID {
				attachmentFound = true
				continue
			}
			filtered = append(filtered, att)
		}
		item.Attachments = filtered
		record.Items[index] = item
		break
	}
	if !itemFound {
		return Item{}, errItemNotFound
	}
	if !attachmentFound {
		return Item{}, errAttachmentNotFound
	}

	if _, err := s.UpsertRecord(companyID, record); err != nil {
		return Item{}, err
	}

	refreshed, err := s.GetRecord(companyID, recordID, true)
	if err != nil {
		return Item{}, err
	}
	for _, item := range refreshed.Items {
		if strings.TrimSpace(item.ID) == itemID {
			return item, nil
		}
	}
	return Item{}, errItemNotFound
}
