package crm

import (
	"context"
	"strings"
	"time"

	"github.com/google/uuid"
)

// ProspectAttachment represents a file associated with a CRM prospect.
type ProspectAttachment struct {
	ID            string `json:"id"`
	ProspectID    string `json:"prospectId"`
	Filename      string `json:"filename"`
	MimeType      string `json:"mimeType"`
	FileSizeBytes int64  `json:"fileSizeBytes"`
	StorageURL    string `json:"storageUrl"`
	UploadedBy    string `json:"uploadedBy"`
	CreatedAt     string `json:"createdAt"`
}

// CreateProspectAttachmentRequest is the payload for registering an attachment.
type CreateProspectAttachmentRequest struct {
	Filename      string `json:"filename"`
	MimeType      string `json:"mimeType"`
	FileSizeBytes int64  `json:"fileSizeBytes"`
	StorageURL    string `json:"storageUrl"`
	UploadedBy    string `json:"uploadedBy"`
}

func (s *Service) ListProspectAttachments(companyID, prospectID string) ([]ProspectAttachment, error) {
	rows, err := s.db.QueryContext(context.Background(), `
SELECT id, prospect_id, filename, mime_type, file_size_bytes, storage_url, uploaded_by, created_at
FROM crm_prospect_attachments
WHERE company_id = $1 AND prospect_id = $2
ORDER BY created_at DESC;
`, companyID, prospectID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items := make([]ProspectAttachment, 0)
	for rows.Next() {
		var a ProspectAttachment
		var createdAt time.Time
		if err := rows.Scan(&a.ID, &a.ProspectID, &a.Filename, &a.MimeType, &a.FileSizeBytes, &a.StorageURL, &a.UploadedBy, &createdAt); err != nil {
			return nil, err
		}
		a.CreatedAt = formatCRMDateTime(createdAt)
		items = append(items, a)
	}
	return items, rows.Err()
}

func (s *Service) CreateProspectAttachment(companyID, prospectID string, req CreateProspectAttachmentRequest) (ProspectAttachment, error) {
	filename := strings.TrimSpace(req.Filename)
	if filename == "" {
		return ProspectAttachment{}, newValidationError("el nombre del archivo es obligatorio")
	}
	if len(filename) > 255 {
		return ProspectAttachment{}, newValidationError("el nombre del archivo no puede superar 255 caracteres")
	}

	storageURL := strings.TrimSpace(req.StorageURL)
	mimeType := strings.TrimSpace(req.MimeType)
	uploadedBy := strings.TrimSpace(req.UploadedBy)
	fileSize := req.FileSizeBytes
	if fileSize < 0 {
		fileSize = 0
	}

	id := uuid.NewString()
	now := time.Now()

	_, err := s.db.ExecContext(context.Background(), `
INSERT INTO crm_prospect_attachments (id, company_id, prospect_id, filename, mime_type, file_size_bytes, storage_url, uploaded_by, created_at)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9);
`, id, companyID, prospectID, filename, mimeType, fileSize, storageURL, uploadedBy, now)
	if err != nil {
		return ProspectAttachment{}, err
	}

	return ProspectAttachment{
		ID:            id,
		ProspectID:    prospectID,
		Filename:      filename,
		MimeType:      mimeType,
		FileSizeBytes: fileSize,
		StorageURL:    storageURL,
		UploadedBy:    uploadedBy,
		CreatedAt:     formatCRMDateTime(now),
	}, nil
}

func (s *Service) DeleteProspectAttachment(companyID, attachmentID string) error {
	result, err := s.db.ExecContext(context.Background(), `
DELETE FROM crm_prospect_attachments
WHERE company_id = $1 AND id = $2;
`, companyID, attachmentID)
	if err != nil {
		return err
	}
	affected, _ := result.RowsAffected()
	if affected == 0 {
		return newValidationError("archivo adjunto no encontrado")
	}
	return nil
}
