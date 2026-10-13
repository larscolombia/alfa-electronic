package main

import (
	"fmt"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/joho/godotenv"
	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
	"pika.software.net.co/backend/internal/acl"
	"pika.software.net.co/backend/internal/auth"
	"pika.software.net.co/backend/internal/calendar"
	"pika.software.net.co/backend/internal/crm"
	crmequipment "pika.software.net.co/backend/internal/crm/equipment"
	crmquotes "pika.software.net.co/backend/internal/crm/quotes"
	"pika.software.net.co/backend/internal/docs"
	"pika.software.net.co/backend/internal/finance"
	"pika.software.net.co/backend/internal/hr"
	"pika.software.net.co/backend/internal/inventory"
	"pika.software.net.co/backend/internal/platform/database"
	"pika.software.net.co/backend/internal/projects"
	"pika.software.net.co/backend/internal/remissions"
	"pika.software.net.co/backend/internal/search"
	"pika.software.net.co/backend/internal/security"
	"pika.software.net.co/backend/internal/suppliers"
)

func main() {
	_ = godotenv.Load(".env", "backend/.env")

	e := echo.New()
	e.HideBanner = true

	e.Use(middleware.RequestID())
	e.Use(middleware.Recover())
	e.Use(middleware.Logger())
	e.Use(middleware.CORSWithConfig(middleware.CORSConfig{
		AllowOrigins: []string{"*"},
		AllowMethods: []string{http.MethodGet, http.MethodPost, http.MethodPut, http.MethodPatch, http.MethodDelete, http.MethodOptions},
		AllowHeaders: []string{echo.HeaderOrigin, echo.HeaderContentType, echo.HeaderAccept, echo.HeaderAuthorization, "X-Company-Id", security.HeaderClientMAC},
	}))

	e.GET("/health", func(c echo.Context) error {
		return c.JSON(http.StatusOK, map[string]string{"status": "ok"})
	})

	db, err := database.Open()
	if err != nil {
		log.Fatalf("database connection error: %v", err)
	}
	defer db.Close()

	if err := database.Migrate(db); err != nil {
		log.Fatalf("database migration error: %v", err)
	}

	aclService := acl.NewService(db)
	aclHandler := acl.NewHandler(aclService)

	hrService := hr.NewService(db)
	hrHandler := hr.NewHandler(hrService)

	calendarService := calendar.NewService(db)
	calendarHandler := calendar.NewHandler(calendarService)

	crmService := crm.NewService(db)
	crmHandler := crm.NewHandler(crmService)

	crmEquipmentInsightClient := crmequipment.NewInsightClient(
		os.Getenv("API_KEY"),
		os.Getenv("DEEPSEEK_API_URL"),
		os.Getenv("DEEPSEEK_MODEL"),
	)
	crmEquipmentService := crmequipment.NewService(db, crmEquipmentInsightClient)
	crmEquipmentHandler := crmequipment.NewHandler(crmEquipmentService)

	crmQuotesService := crmquotes.NewService(db)
	crmQuotesHandler := crmquotes.NewHandler(crmQuotesService)

	financeService := finance.NewService(db)
	financeHandler := finance.NewHandler(financeService)

	projectsService := projects.NewService(db)
	projectsHandler := projects.NewHandler(projectsService)

	inventoryService := inventory.NewService(db)
	inventoryService.SetPurchaseLineEditNotifier(func(companyID string, n inventory.PurchaseLineEditNotification) {
		projectsService.CreateNotification(companyID, projects.Notification{
			ID:         fmt.Sprintf("notif-%d", time.Now().UnixNano()),
			Type:       n.Type,
			Title:      n.Title,
			Message:    n.Message,
			Read:       false,
			CreatedAt:  time.Now().UTC().Format(time.RFC3339),
			TargetRole: n.TargetRole,
		})
	})
	inventoryHandler := inventory.NewHandler(inventoryService)

	suppliersService := suppliers.NewService(db)
	suppliersHandler := suppliers.NewHandler(suppliersService)

	searchService := search.NewService(db)
	searchHandler := search.NewHandler(searchService)

	remissionsService := remissions.NewService(db)
	remissionsHandler := remissions.NewHandler(remissionsService)

	documentationService := docs.NewService()
	documentationHandler := docs.NewHandler(documentationService)

	authService := auth.NewService(auth.Config{
		DB:            db,
		JWTSecret:     os.Getenv("JWT_SECRET"),
		AdminEmail:    os.Getenv("AUTH_ADMIN_EMAIL"),
		AdminPassword: os.Getenv("AUTH_ADMIN_PASSWORD"),
		AdminName:     os.Getenv("AUTH_ADMIN_NAME"),
		AdminRole:     os.Getenv("AUTH_ADMIN_ROLE"),
	})
	securityService := security.NewService(db)
	securityHandler := security.NewHandler(securityService)
	authHandler := auth.NewHandler(authService, securityService)

	api := e.Group("/api/v1")
	authHandler.RegisterRoutes(api.Group("/auth"))
	crmQuotesHandler.RegisterPublicRoutes(api.Group("/crm-quotes"))

	protectedAPI := api.Group("")
	protectedAPI.Use(authService.JWTMiddleware())
	protectedAPI.Use(securityService.EnforcementMiddleware())

	aclHandler.RegisterRoutes(protectedAPI.Group("/acl"))
	aclHandler.RegisterUserRoutes(protectedAPI.Group("/users"))
	hrHandler.RegisterRoutes(protectedAPI.Group("/hr"))
	calendarHandler.RegisterRoutes(protectedAPI.Group("/calendar"))
	crmHandler.RegisterRoutes(protectedAPI.Group("/crm"))
	crmEquipmentHandler.RegisterRoutes(protectedAPI.Group("/crm-equipment"))
	crmQuotesHandler.RegisterRoutes(protectedAPI.Group("/crm-quotes"))
	financeHandler.RegisterRoutes(protectedAPI.Group("/finance"))
	projectsHandler.RegisterRoutes(protectedAPI.Group("/projects"))
	inventoryHandler.RegisterRoutes(protectedAPI.Group("/inventory"))
	suppliersHandler.RegisterRoutes(protectedAPI.Group("/suppliers"))
	searchHandler.RegisterRoutes(protectedAPI)
	securityHandler.RegisterRoutes(protectedAPI.Group("/security"))
	remissionsHandler.RegisterRoutes(protectedAPI.Group("/remissions"))
	documentationHandler.RegisterRoutes(protectedAPI.Group("/documentation"))

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	if err := e.Start(":" + port); err != nil && err != http.ErrServerClosed {
		log.Fatal(err)
	}
}
