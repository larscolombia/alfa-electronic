package search

import (
	"net/http"
	"strconv"
	"strings"

	"pika.software.net.co/backend/internal/platform/company"
	"github.com/labstack/echo/v4"
)

type Handler struct {
	service *Service
}

func NewHandler(service *Service) *Handler {
	return &Handler{service: service}
}

func (h *Handler) RegisterRoutes(group *echo.Group) {
	group.GET("/search", h.search)
	group.POST("/search/index/:type", h.indexDocuments)
	group.POST("/search/reindex", h.reindex)
}

type searchResultPayload struct {
	ID        string  `json:"id"`
	Type      string  `json:"type"`
	Title     string  `json:"title"`
	Subtitle  string  `json:"subtitle"`
	Route     string  `json:"route"`
	TypeLabel string  `json:"typeLabel"`
	Score     float64 `json:"score"`
}

func (h *Handler) search(c echo.Context) error {
	companyID := company.IDFromRequest(c)

	query := strings.TrimSpace(c.QueryParam("q"))
	if query == "" {
		return c.JSON(http.StatusOK, map[string]any{"results": []searchResultPayload{}})
	}

	var types []string
	if raw := strings.TrimSpace(c.QueryParam("types")); raw != "" {
		for _, t := range strings.Split(raw, ",") {
			if trimmed := strings.TrimSpace(t); trimmed != "" {
				types = append(types, trimmed)
			}
		}
	}

	limit := 20
	if raw := strings.TrimSpace(c.QueryParam("limit")); raw != "" {
		if value, err := strconv.Atoi(raw); err == nil && value > 0 && value <= 100 {
			limit = value
		}
	}

	hits := h.service.Search(companyID, query, types, limit)
	results := make([]searchResultPayload, 0, len(hits))
	for _, hit := range hits {
		results = append(results, searchResultPayload{
			ID:        hit.Document.ID,
			Type:      hit.Document.Type,
			Title:     hit.Document.Title,
			Subtitle:  hit.Document.Fields["subtitle"],
			Route:     hit.Document.Fields["route"],
			TypeLabel: hit.Document.Fields["typeLabel"],
			Score:     hit.Score,
		})
	}

	return c.JSON(http.StatusOK, map[string]any{"results": results})
}

type indexDocumentInput struct {
	ID       string `json:"id"`
	Title    string `json:"title"`
	Body     string `json:"body"`
	Subtitle string `json:"subtitle"`
	Route    string `json:"route"`
}

type indexDocumentsRequest struct {
	Documents []indexDocumentInput `json:"documents"`
}

var pushTypeLabels = map[string]string{
	proyectoIndex:  "Proyecto",
	proveedorIndex: "Proveedor",
}

// indexDocuments receives the full set of documents for a client-owned type (projects or
// suppliers, which live in the browser) and replaces that company's slice of the index. This
// is how frontend-only data becomes searchable server-side with real records.
func (h *Handler) indexDocuments(c echo.Context) error {
	companyID := company.IDFromRequest(c)
	docType := strings.TrimSpace(c.Param("type"))

	typeLabel, supported := pushTypeLabels[docType]
	if !supported {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "tipo de documento no soportado"})
	}

	var req indexDocumentsRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "cuerpo de solicitud invalido"})
	}

	docs := make([]Document, 0, len(req.Documents))
	for _, input := range req.Documents {
		id := strings.TrimSpace(input.ID)
		title := strings.TrimSpace(input.Title)
		if id == "" || title == "" {
			continue
		}
		docs = append(docs, Document{
			ID:    id,
			Title: title,
			Body:  strings.TrimSpace(title + " " + input.Body),
			Fields: map[string]string{
				"subtitle":  strings.TrimSpace(input.Subtitle),
				"route":     strings.TrimSpace(input.Route),
				"typeLabel": typeLabel,
			},
		})
	}

	if err := h.service.ReplaceClientDocs(companyID, docType, docs); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
	}

	return c.JSON(http.StatusOK, map[string]any{"indexed": len(docs)})
}

func (h *Handler) reindex(c echo.Context) error {
	if err := h.service.ReindexFromDB(c.Request().Context()); err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "no se pudo reindexar"})
	}
	return c.JSON(http.StatusOK, map[string]string{"status": "ok"})
}
