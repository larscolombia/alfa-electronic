package search

import (
	"context"
	"database/sql"
	"errors"
	"log"
	"strings"
	"time"
)

// Index names. clienteIndex and prospectoIndex are owned by the database (rebuilt from
// PostgreSQL); proyectoIndex and proveedorIndex are owned by clients that push their
// records (projects/suppliers live in the browser) into the engine.
const (
	clienteIndex   = "cliente"
	prospectoIndex = "prospecto"
	proyectoIndex  = "proyecto"
	proveedorIndex = "proveedor"

	dbIndexShards    = 4
	dbIndexReplicas  = 1
	pushIndexShards  = 2
	pushIndexReplica = 1

	refreshInterval = 45 * time.Second
)

var errUnsupportedType = errors.New("tipo de documento no soportado para indexacion")

// Service wires the in-memory search Engine to the persistent data sources. Clients and
// prospects are loaded from PostgreSQL and periodically refreshed; projects and suppliers
// are indexed from documents pushed by the frontend.
type Service struct {
	db     *sql.DB
	engine *Engine
}

func NewService(db *sql.DB) *Service {
	engine := NewEngine()
	engine.CreateIndex(clienteIndex, dbIndexShards, dbIndexReplicas)
	engine.CreateIndex(prospectoIndex, dbIndexShards, dbIndexReplicas)
	engine.CreateIndex(proyectoIndex, pushIndexShards, pushIndexReplica)
	engine.CreateIndex(proveedorIndex, pushIndexShards, pushIndexReplica)

	s := &Service{db: db, engine: engine}

	if err := s.ReindexFromDB(context.Background()); err != nil {
		log.Printf("search: initial reindex failed: %v", err)
	}
	go s.startBackgroundRefresh()

	return s
}

func (s *Service) startBackgroundRefresh() {
	ticker := time.NewTicker(refreshInterval)
	defer ticker.Stop()
	for range ticker.C {
		if err := s.ReindexFromDB(context.Background()); err != nil {
			log.Printf("search: background reindex failed: %v", err)
		}
	}
}

// ReindexFromDB rebuilds the database-backed indices (clients + prospects) from PostgreSQL.
// Each index is swapped atomically, so concurrent searches are never disrupted.
func (s *Service) ReindexFromDB(ctx context.Context) error {
	clients, err := s.loadClients(ctx)
	if err != nil {
		return err
	}
	prospects, err := s.loadProspects(ctx)
	if err != nil {
		return err
	}

	s.engine.RebuildIndex(clienteIndex, dbIndexShards, dbIndexReplicas, clients)
	s.engine.RebuildIndex(prospectoIndex, dbIndexShards, dbIndexReplicas, prospects)
	return nil
}

func (s *Service) loadClients(ctx context.Context) ([]Document, error) {
	rows, err := s.db.QueryContext(ctx, `
		SELECT company_id, id, nombre, correo, empresa, zona, estado
		FROM crm_clients
		WHERE soft_delete = false
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	docs := make([]Document, 0)
	for rows.Next() {
		var companyID, id, nombre, correo, empresa, zona, estado string
		if err := rows.Scan(&companyID, &id, &nombre, &correo, &empresa, &zona, &estado); err != nil {
			return nil, err
		}

		trimmedNombre := strings.TrimSpace(nombre)
		trimmedEmpresa := strings.TrimSpace(empresa)
		trimmedZona := strings.TrimSpace(zona)

		// Presentacion: negrita = empresa; debajo, zona y nombre del contacto (si existe).
		title := trimmedEmpresa
		if title == "" {
			title = trimmedNombre // Sin empresa -> contacto, para no dejar una linea vacia.
		}
		contactInSubtitle := ""
		if trimmedEmpresa != "" && trimmedNombre != "" {
			contactInSubtitle = trimmedNombre // Solo en el subtitle cuando ya no es la linea principal.
		}

		docs = append(docs, Document{
			ID:        id,
			Type:      clienteIndex,
			CompanyID: companyID,
			Title:     title,
			Body:      strings.Join([]string{nombre, correo, empresa, zona, estado}, " "),
			Fields: map[string]string{
				"subtitle":  joinNonEmpty(" · ", trimmedZona, contactInSubtitle),
				"route":     "/app/crm-clientes/" + id,
				"typeLabel": "Cliente",
			},
		})
	}
	return docs, rows.Err()
}

func (s *Service) loadProspects(ctx context.Context) ([]Document, error) {
	rows, err := s.db.QueryContext(ctx, `
		SELECT company_id, id, name, email, company, zone, city
		FROM crm_prospects
		WHERE soft_delete = false
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	docs := make([]Document, 0)
	for rows.Next() {
		var companyID, id, name, email, company, zone, city string
		if err := rows.Scan(&companyID, &id, &name, &email, &company, &zone, &city); err != nil {
			return nil, err
		}
		docs = append(docs, Document{
			ID:        id,
			Type:      prospectoIndex,
			CompanyID: companyID,
			Title:     name,
			Body:      strings.Join([]string{name, email, company, zone, city}, " "),
			Fields: map[string]string{
				"subtitle":  joinNonEmpty(" · ", company, zone, city),
				"route":     "/app/crm-prospectos/" + id,
				"typeLabel": "Prospecto",
			},
		})
	}
	return docs, rows.Err()
}

// Search runs a ranked query over the requested types (or all four by default), scoped to
// a company.
func (s *Service) Search(companyID, query string, types []string, limit int) []Hit {
	if limit <= 0 {
		limit = 20
	}
	indexNames := types
	if len(indexNames) == 0 {
		indexNames = []string{clienteIndex, prospectoIndex, proyectoIndex, proveedorIndex}
	}
	hits := s.engine.Search(indexNames, query, companyID, limit)
	if len(hits) > limit {
		hits = hits[:limit]
	}
	return hits
}

// ReplaceClientDocs swaps the full set of pushed documents (projects or suppliers) for a
// company. Only the proyecto and proveedor indices accept pushed documents.
func (s *Service) ReplaceClientDocs(companyID, docType string, docs []Document) error {
	if docType != proyectoIndex && docType != proveedorIndex {
		return errUnsupportedType
	}
	for i := range docs {
		docs[i].Type = docType
		docs[i].CompanyID = companyID
	}
	s.engine.ReplaceCompanyDocs(docType, companyID, docs)
	return nil
}

func joinNonEmpty(sep string, values ...string) string {
	parts := make([]string, 0, len(values))
	for _, v := range values {
		if trimmed := strings.TrimSpace(v); trimmed != "" {
			parts = append(parts, trimmed)
		}
	}
	return strings.Join(parts, sep)
}
