package main

import (
	"context"
	"log"
	"net/http"
	"os"

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
	"pika.software.net.co/backend/internal/worktime"
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
		if _, err := projectsService.CreateNotification(companyID, projects.Notification{
			Type:       n.Type,
			Title:      n.Title,
			Message:    n.Message,
			TargetRole: n.TargetRole,
		}); err != nil {
			log.Printf("notificar edicion de linea de compra: %v", err)
		}
	})
	inventoryHandler := inventory.NewHandler(inventoryService)

	suppliersService := suppliers.NewService(db)
	suppliersHandler := suppliers.NewHandler(suppliersService)

	searchService := search.NewService(db)
	searchHandler := search.NewHandler(searchService)

	remissionsService := remissions.NewService(db)
	remissionsHandler := remissions.NewHandler(remissionsService)

	documentationService := docs.NewService(db)
	documentationHandler := docs.NewHandler(documentationService)

	// Fase 4: horas de trabajo, telemetria de uso, pruebas funcionales y festivos.
	worktimeService := worktime.NewService(db)
	worktimeHandler := worktime.NewHandler(worktimeService)

	// Fase 2b: identidad de usuario real. NewService falla si no hay JWT_SECRET
	// (se elimino el secreto de desarrollo por defecto) y siembra la cuenta admin
	// del entorno solo si ese email no existe todavia.
	authService, err := auth.NewService(auth.Config{
		DB:             db,
		JWTSecret:      os.Getenv("JWT_SECRET"),
		AdminEmail:     os.Getenv("AUTH_ADMIN_EMAIL"),
		AdminPassword:  os.Getenv("AUTH_ADMIN_PASSWORD"),
		AdminName:      os.Getenv("AUTH_ADMIN_NAME"),
		AdminRole:      os.Getenv("AUTH_ADMIN_ROLE"),
		AdminCompanyID: os.Getenv("AUTH_ADMIN_COMPANY_ID"),
		SignupRole:     os.Getenv("AUTH_SIGNUP_ROLE"),
	})
	if err != nil {
		log.Fatalf("auth service error: %v", err)
	}
	// El ACL siembra sus roles por defecto de forma perezosa; auth los necesita
	// asegurados antes de validar el rol de un usuario nuevo. Se inyecta aqui para
	// que auth no importe el paquete acl.
	authService.SetRoleReadiness(func(ctx context.Context, companyID string) error {
		_, err := aclService.ListRoles(companyID)
		return err
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

	// Autorizacion ACL por modulo (Fase 2): tras JWT, cada grupo sensible exige
	// el permiso de accion del rol (GET=ver, POST=agregar, PUT/PATCH/DELETE=actualizar)
	// y expone permisos de campo para enmascarar respuestas. Admin/superadmin
	// (rol del JWT) tienen acceso total: es la ruta de escape del propietario.
	// /auth y las rutas publicas de /crm-quotes quedan fuera a proposito
	// (login/onboarding no pueden requerir permisos).
	requireAdminModule := aclService.RequireModule("administracion")

	// /users lleva dos handlers sobre el mismo prefijo y el mismo guard admin-only:
	// el de acl (PATCH /soft-delete, eventos) y el de auth (GET/POST de usuarios
	// reales con rol elegido por el admin, Fase 2b). Sin rutas en conflicto.
	userRoutes := protectedAPI.Group("/users", requireAdminModule)
	aclHandler.RegisterUserRoutes(userRoutes)
	authHandler.RegisterUserRoutes(userRoutes)

	aclHandler.RegisterRoutes(protectedAPI.Group("/acl", requireAdminModule))
	hrHandler.RegisterRoutes(protectedAPI.Group("/hr", requireAdminModule))
	calendarHandler.RegisterRoutes(protectedAPI.Group("/calendar"))
	crmHandler.RegisterRoutes(protectedAPI.Group("/crm"))
	crmEquipmentHandler.RegisterRoutes(protectedAPI.Group("/crm-equipment"))
	crmQuotesHandler.RegisterRoutes(protectedAPI.Group("/crm-quotes"))
	financeHandler.RegisterRoutes(protectedAPI.Group("/finance", aclService.RequireModule("finanzas")))
	projectsHandler.RegisterRoutes(protectedAPI.Group("/projects"))
	inventoryHandler.RegisterRoutes(protectedAPI.Group("/inventory", aclService.RequireModule("inventario")))
	suppliersHandler.RegisterRoutes(protectedAPI.Group("/suppliers", aclService.RequireModule("proveedores")))
	searchHandler.RegisterRoutes(protectedAPI)
	securityHandler.RegisterRoutes(protectedAPI.Group("/security"))
	remissionsHandler.RegisterRoutes(protectedAPI.Group("/remissions"))
	documentationHandler.RegisterRoutes(protectedAPI.Group("/documentation"))
	worktimeHandler.RegisterRoutes(protectedAPI.Group("/worktime", aclService.RequireModule("registro-horas")))

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	if err := e.Start(":" + port); err != nil && err != http.ErrServerClosed {
		log.Fatal(err)
	}
}
