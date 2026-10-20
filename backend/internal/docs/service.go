package docs

import (
	"database/sql"
	"fmt"
	"strings"
	"time"
)

type Service struct {
	db *sql.DB
}

func NewService(db *sql.DB) *Service {
	return &Service{db: db}
}

const documentColumns = `id, title, doc_type, equipment_model, url, file_name, description, deletable, created_by, created_at`

func (s *Service) ListDocuments(companyID string) ([]Document, error) {
	rows, err := s.db.Query(
		`SELECT `+documentColumns+` FROM documents WHERE company_id = $1 ORDER BY created_at DESC`,
		strings.TrimSpace(companyID),
	)
	if err != nil {
		return nil, fmt.Errorf("listar documentos: %w", err)
	}
	defer rows.Close()

	documents := []Document{}
	for rows.Next() {
		var doc Document
		var createdAt time.Time
		if err := rows.Scan(
			&doc.ID, &doc.Title, &doc.Type, &doc.EquipmentModel, &doc.URL, &doc.FileName,
			&doc.Description, &doc.Deletable, &doc.CreatedBy, &createdAt,
		); err != nil {
			return nil, fmt.Errorf("leer documento: %w", err)
		}
		doc.CompanyID = companyID
		doc.CreatedAt = createdAt.UTC().Format(time.RFC3339)
		documents = append(documents, doc)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("recorrer documentos: %w", err)
	}

	return documents, nil
}

func (s *Service) CreateDocument(companyID string, doc Document) (Document, error) {
	doc.CompanyID = strings.TrimSpace(companyID)
	doc.ID = fmt.Sprintf("doc-%d", time.Now().UnixNano())
	doc.Deletable = false

	_, err := s.db.Exec(
		`INSERT INTO documents (company_id, id, title, doc_type, equipment_model, url, file_name, description, deletable, created_by)
		 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
		 RETURNING created_at`,
		doc.CompanyID, doc.ID, doc.Title, doc.Type, doc.EquipmentModel, doc.URL,
		doc.FileName, doc.Description, doc.Deletable, doc.CreatedBy,
	)
	if err != nil {
		return Document{}, fmt.Errorf("crear documento: %w", err)
	}

	var createdAt time.Time
	if err := s.db.QueryRow(
		`SELECT created_at FROM documents WHERE company_id = $1 AND id = $2`,
		doc.CompanyID, doc.ID,
	).Scan(&createdAt); err != nil {
		return Document{}, fmt.Errorf("leer documento creado: %w", err)
	}
	doc.CreatedAt = createdAt.UTC().Format(time.RFC3339)

	return doc, nil
}

const backupColumns = `id, equipment_model, file_name, file_size, url, version, uploaded_by, created_at`

func (s *Service) ListBackups(companyID string) ([]SoftwareBackup, error) {
	rows, err := s.db.Query(
		`SELECT `+backupColumns+` FROM software_backups WHERE company_id = $1 ORDER BY created_at DESC`,
		strings.TrimSpace(companyID),
	)
	if err != nil {
		return nil, fmt.Errorf("listar backups: %w", err)
	}
	defer rows.Close()

	backups := []SoftwareBackup{}
	for rows.Next() {
		var backup SoftwareBackup
		var createdAt time.Time
		if err := rows.Scan(
			&backup.ID, &backup.EquipmentModel, &backup.FileName, &backup.FileSize,
			&backup.URL, &backup.Version, &backup.UploadedBy, &createdAt,
		); err != nil {
			return nil, fmt.Errorf("leer backup: %w", err)
		}
		backup.CompanyID = companyID
		backup.CreatedAt = createdAt.UTC().Format(time.RFC3339)
		backups = append(backups, backup)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("recorrer backups: %w", err)
	}

	return backups, nil
}

func (s *Service) GetBackupForModel(companyID, model string) (*SoftwareBackup, error) {
	var backup SoftwareBackup
	var createdAt time.Time

	err := s.db.QueryRow(
		`SELECT `+backupColumns+` FROM software_backups
		 WHERE company_id = $1 AND equipment_model = $2
		 ORDER BY created_at DESC LIMIT 1`,
		strings.TrimSpace(companyID), strings.TrimSpace(model),
	).Scan(
		&backup.ID, &backup.EquipmentModel, &backup.FileName, &backup.FileSize,
		&backup.URL, &backup.Version, &backup.UploadedBy, &createdAt,
	)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("buscar backup por modelo: %w", err)
	}

	backup.CompanyID = companyID
	backup.CreatedAt = createdAt.UTC().Format(time.RFC3339)
	return &backup, nil
}

func (s *Service) CreateBackup(companyID string, backup SoftwareBackup) (SoftwareBackup, error) {
	backup.CompanyID = strings.TrimSpace(companyID)
	backup.ID = fmt.Sprintf("bak-%d", time.Now().UnixNano())

	_, err := s.db.Exec(
		`INSERT INTO software_backups (company_id, id, equipment_model, file_name, file_size, url, version, uploaded_by)
		 VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
		 RETURNING created_at`,
		backup.CompanyID, backup.ID, backup.EquipmentModel, backup.FileName,
		backup.FileSize, backup.URL, backup.Version, backup.UploadedBy,
	)
	if err != nil {
		return SoftwareBackup{}, fmt.Errorf("crear backup: %w", err)
	}

	var createdAt time.Time
	if err := s.db.QueryRow(
		`SELECT created_at FROM software_backups WHERE company_id = $1 AND id = $2`,
		backup.CompanyID, backup.ID,
	).Scan(&createdAt); err != nil {
		return SoftwareBackup{}, fmt.Errorf("leer backup creado: %w", err)
	}
	backup.CreatedAt = createdAt.UTC().Format(time.RFC3339)

	return backup, nil
}
