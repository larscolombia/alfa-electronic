package hr

import (
	"context"
	"database/sql"
	"errors"
	"strings"
	"time"

	"github.com/google/uuid"
)

// maxDocumentDataURLBytes equivale a ~8MB binarios codificados en base64.
const maxDocumentDataURLBytes = 8 * 1024 * 1024 * 4 / 3

const documentListColumns = `id, employee_id, category, file_name, mime_type, size_bytes, required, notes, uploaded_at`

func scanEmployeeDocument(scanner employeeScanner, row *EmployeeDocument) error {
	return scanner.Scan(
		&row.ID,
		&row.EmployeeID,
		&row.Category,
		&row.FileName,
		&row.MimeType,
		&row.SizeBytes,
		&row.Required,
		&row.Notes,
		&row.UploadedAt,
	)
}

// ListEmployeeDocuments devuelve solo la metadata (sin el contenido base64)
// de los soportes vigentes del empleado.
func (s *Service) ListEmployeeDocuments(companyID, employeeID string) ([]EmployeeDocument, error) {
	ctx := context.Background()
	employeeID = strings.TrimSpace(employeeID)
	if _, err := s.findEmployee(ctx, companyID, employeeID); err != nil {
		return nil, err
	}

	rows, err := s.db.QueryContext(ctx, `
SELECT `+documentListColumns+`
FROM hr_employee_documents
WHERE company_id = $1
  AND employee_id = $2
  AND soft_delete = false
ORDER BY uploaded_at DESC;
`, companyID, employeeID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	documents := make([]EmployeeDocument, 0)
	for rows.Next() {
		var row EmployeeDocument
		if err := scanEmployeeDocument(rows, &row); err != nil {
			return nil, err
		}
		documents = append(documents, row)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return documents, nil
}

func (s *Service) CreateEmployeeDocument(companyID, employeeID string, req CreateEmployeeDocumentRequest) (EmployeeDocument, error) {
	ctx := context.Background()
	employeeID = strings.TrimSpace(employeeID)
	if _, err := s.findEmployee(ctx, companyID, employeeID); err != nil {
		return EmployeeDocument{}, err
	}

	fileName := strings.TrimSpace(req.FileName)
	if fileName == "" {
		return EmployeeDocument{}, errDocumentFileNameRequired
	}

	data := strings.TrimSpace(req.Data)
	if data == "" {
		return EmployeeDocument{}, errDocumentDataRequired
	}
	if len(data) > maxDocumentDataURLBytes {
		return EmployeeDocument{}, errDocumentTooLarge
	}

	document := EmployeeDocument{
		ID:         uuid.NewString(),
		EmployeeID: employeeID,
		Category:   strings.TrimSpace(req.Category),
		FileName:   fileName,
		MimeType:   strings.TrimSpace(req.MimeType),
		SizeBytes:  estimateDataURLSizeBytes(data),
		Required:   req.Required,
		Notes:      strings.TrimSpace(req.Notes),
		UploadedAt: time.Now().UTC(),
	}

	err := s.db.QueryRowContext(ctx, `
INSERT INTO hr_employee_documents (
company_id, id, employee_id, category, file_name, mime_type, size_bytes, data, required, notes, soft_delete
)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, false)
RETURNING uploaded_at;
`, companyID, document.ID, document.EmployeeID, document.Category, document.FileName,
		document.MimeType, document.SizeBytes, data, document.Required, document.Notes).Scan(&document.UploadedAt)
	if err != nil {
		return EmployeeDocument{}, err
	}

	return document, nil
}

// GetEmployeeDocumentData devuelve el contenido completo para previsualizar o descargar.
func (s *Service) GetEmployeeDocumentData(companyID, employeeID, documentID string) (EmployeeDocumentData, error) {
	ctx := context.Background()
	var download EmployeeDocumentData
	err := s.db.QueryRowContext(ctx, `
SELECT file_name, mime_type, data
FROM hr_employee_documents
WHERE company_id = $1
  AND id = $2
  AND employee_id = $3
  AND soft_delete = false;
`, companyID, strings.TrimSpace(documentID), strings.TrimSpace(employeeID)).Scan(
		&download.FileName, &download.MimeType, &download.Data)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return EmployeeDocumentData{}, errDocumentNotFound
		}
		return EmployeeDocumentData{}, err
	}
	return download, nil
}

// DeleteEmployeeDocument marca el soporte como eliminado (soft delete).
func (s *Service) DeleteEmployeeDocument(companyID, employeeID, documentID string) error {
	ctx := context.Background()
	result, err := s.db.ExecContext(ctx, `
UPDATE hr_employee_documents
SET soft_delete = true
WHERE company_id = $1
  AND id = $2
  AND employee_id = $3
  AND soft_delete = false;
`, companyID, strings.TrimSpace(documentID), strings.TrimSpace(employeeID))
	if err != nil {
		return err
	}
	if affected, _ := result.RowsAffected(); affected == 0 {
		return errDocumentNotFound
	}
	return nil
}

// estimateDataURLSizeBytes aproxima el tamano binario a partir del tramo base64.
func estimateDataURLSizeBytes(dataURL string) int64 {
	if idx := strings.Index(dataURL, ","); idx >= 0 {
		return int64(len(dataURL[idx+1:])) * 3 / 4
	}
	return int64(len(dataURL)) * 3 / 4
}
