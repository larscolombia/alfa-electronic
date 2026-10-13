package crm

import (
	"strconv"
	"strings"

	"github.com/labstack/echo/v4"
)

type Handler struct {
	service *Service
}

func NewHandler(service *Service) *Handler {
	return &Handler{service: service}
}

func (h *Handler) RegisterRoutes(group *echo.Group) {
	group.GET("/prospects", h.listProspects)
	group.POST("/prospects", h.createProspect)
	group.GET("/prospects/:prospectID", h.getProspect)
	group.PUT("/prospects/:prospectID", h.updateProspect)
	group.DELETE("/prospects/:prospectID", h.deleteProspect)
	group.PUT("/prospects/:prospectID/note", h.updateProspectNote)

	group.GET("/prospects/:prospectID/contacts", h.listProspectContacts)
	group.POST("/prospects/:prospectID/contacts", h.createProspectContact)
	group.PUT("/prospects/:prospectID/contacts/:contactID", h.updateProspectContact)
	group.DELETE("/prospects/:prospectID/contacts/:contactID", h.deleteProspectContact)

	group.GET("/prospects/:prospectID/followups", h.listProspectFollowups)
	group.POST("/prospects/:prospectID/followups", h.createProspectFollowup)
	group.PUT("/prospects/:prospectID/followups/:followupID", h.updateProspectFollowup)
	group.DELETE("/prospects/:prospectID/followups/:followupID", h.deleteProspectFollowup)

	group.GET("/catalogs", h.listCatalogs)
	group.GET("/catalogs/:catalogType", h.listCatalog)
	group.POST("/catalogs/:catalogType", h.createCatalogItem)
	group.DELETE("/catalogs/:catalogType/:itemID", h.deleteCatalogItem)
	group.POST("/catalogs/:catalogType/restore-defaults", h.restoreDefaultCatalog)

	group.GET("/clients", h.listClients)
	group.POST("/clients", h.createClient)
	group.POST("/clients/bulk", h.bulkCreateClients)
	group.GET("/clients/:clientID", h.getClient)
	group.PUT("/clients/:clientID", h.updateClient)
	group.DELETE("/clients/:clientID", h.deleteClient)
	group.GET("/clients/:clientID/related-contacts", h.listClientRelatedContacts)

	group.GET("/clients/:clientID/contacts", h.listClientContacts)
	group.POST("/clients/:clientID/contacts", h.createClientContact)
	group.PUT("/clients/:clientID/contacts/:contactID", h.updateClientContact)
	group.DELETE("/clients/:clientID/contacts/:contactID", h.deleteClientContact)

	group.POST("/prospects/:prospectID/convert-to-client", h.convertProspectToClient)

	group.GET("/prospects/:prospectID/attachments", h.listProspectAttachments)
	group.POST("/prospects/:prospectID/attachments", h.createProspectAttachment)
	group.DELETE("/prospects/:prospectID/attachments/:attachmentID", h.deleteProspectAttachment)
}

func parseLimit(raw string) (int, error) {
	trimmed := strings.TrimSpace(raw)
	if trimmed == "" {
		return 0, nil
	}

	value, err := strconv.Atoi(trimmed)
	if err != nil || value <= 0 {
		return 0, errListLimitInvalid
	}

	return value, nil
}
