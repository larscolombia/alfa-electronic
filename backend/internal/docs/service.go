package docs

import (
	"fmt"
	"sync"
	"time"
)

type Service struct {
	mu      sync.RWMutex
	docs    map[string][]Document
	backups map[string][]SoftwareBackup
}

func NewService() *Service {
	return &Service{
		docs:    make(map[string][]Document),
		backups: make(map[string][]SoftwareBackup),
	}
}

func (s *Service) ListDocuments(companyID string) []Document {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return s.docs[companyID]
}

func (s *Service) CreateDocument(companyID string, doc Document) Document {
	s.mu.Lock()
	defer s.mu.Unlock()
	doc.ID = fmt.Sprintf("doc-%d", time.Now().UnixNano())
	doc.CompanyID = companyID
	doc.Deletable = false
	doc.CreatedAt = time.Now().UTC().Format(time.RFC3339)
	s.docs[companyID] = append([]Document{doc}, s.docs[companyID]...)
	return doc
}

func (s *Service) ListBackups(companyID string) []SoftwareBackup {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return s.backups[companyID]
}

func (s *Service) GetBackupForModel(companyID, model string) *SoftwareBackup {
	s.mu.RLock()
	defer s.mu.RUnlock()
	for _, b := range s.backups[companyID] {
		if b.EquipmentModel == model {
			return &b
		}
	}
	return nil
}

func (s *Service) CreateBackup(companyID string, backup SoftwareBackup) SoftwareBackup {
	s.mu.Lock()
	defer s.mu.Unlock()
	backup.ID = fmt.Sprintf("bak-%d", time.Now().UnixNano())
	backup.CompanyID = companyID
	backup.CreatedAt = time.Now().UTC().Format(time.RFC3339)
	s.backups[companyID] = append([]SoftwareBackup{backup}, s.backups[companyID]...)
	return backup
}
