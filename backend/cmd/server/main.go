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
	equipmentcatalog "pika.software.net.co/backend/internal/equipmentcatalog"
	"pika.software.net.co/backend/internal/finance"
	"pika.software.net.co/backend/internal/hr"
	"pika.software.net.co/backend/internal/inventory"
	"pika.software.net.co/backend/internal/platform/database"
	"pika.software.net.co/backend/internal/platform/mailer"
	settings "pika.software.net.co/backend/internal/platform/settings"
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

	// Fase 5c: correos transaccionales con outbox durable.
	//
	// SMTP_HOST vacío ⇒ modo desactivado: NewSender devuelve nil y el worker
	// marca las filas como 'desactivado' con last_error "SMTP no configurado".
	// Nunca se marcan 'enviado' ni se descartan: un correo que no salió tiene
	// que seguir siendo visible en GET /emails.
	mailerConfig := mailer.ConfigFromEnv()
	emailOutbox := mailer.NewOutbox(db, mailerConfig, mailer.NewSender(mailerConfig))
	if !mailerConfig.Enabled() {
		log.Printf("mailer: SMTP_HOST vacio, correos en modo DESACTIVADO (se registran en email_outbox y se marcan 'desactivado')")
	}

	// Worker del outbox: goroutine con parada limpia al apagar el servidor.
	emailWorkerStop := make(chan struct{})
	defer close(emailWorkerStop)
	go mailer.NewWorker(emailOutbox, mailer.DefaultInterval).Run(emailWorkerStop)

	aclService := acl.NewService(db)
	aclHandler := acl.NewHandler(aclService)

	hrService := hr.NewService(db)
	hrHandler := hr.NewHandler(hrService)
	// La misma siembra perezosa de roles ACL que usa auth: RRHH la necesita
	// asegurada antes de validar el rol de acceso de la cuenta nueva del
	// empleado, o el primer alta fallaria con "rol no existe".
	hrService.SetRoleReadiness(func(ctx context.Context, companyID string) error {
		_, err := aclService.ListRoles(companyID)
		return err
	})

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
	// Fase 5c: acuse de recepción por correo.
	crmEquipmentService.SetEmailOutbox(emailOutbox)
	crmEquipmentHandler := crmequipment.NewHandler(crmEquipmentService)

	crmQuotesService := crmquotes.NewService(db)
	// Fase 5c: correo de la cotización "Guardar y enviar".
	crmQuotesService.SetEmailOutbox(emailOutbox)
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

	// La búsqueda global debe ver prospectos y clientes al instante tras cada alta,
	// cambio o baja (el refresco de fondo del servicio de búsqueda sigue cubriendo).
	crmService.SetSearchRefresher(func(ctx context.Context) error {
		return searchService.ReindexFromDB(ctx)
	})

	// Identidad de la empresa (logo, nombre, contacto, titulo del tab): una fila
	// por company_id. GET publico para la pagina de cotizacion del cliente; PUT
	// admin para /app/company-profile.
	settingsService := settings.NewService(db)
	settingsHandler := settings.NewHandler(settingsService)

	remissionsService := remissions.NewService(db)
	remissionsHandler := remissions.NewHandler(remissionsService)

	documentationService := docs.NewService(db)
	documentationHandler := docs.NewHandler(documentationService)

	// Fase 4: horas de trabajo, telemetria de uso, pruebas funcionales y festivos.
	worktimeService := worktime.NewService(db)
	worktimeHandler := worktime.NewHandler(worktimeService)

	// Fase 6 (items 1-2): maestros de equipos por empresa (familias, modelos
	// industriales, tipos de servicio y ubicaciones). Antes vivian en localStorage
	// con valores hardcodeados y el CRUD que los edita no tenia ruta registrada.
	equipmentCatalogService := equipmentcatalog.NewService(db)
	equipmentCatalogHandler := equipmentcatalog.NewHandler(equipmentCatalogService)

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
	settingsHandler.RegisterPublicRoutes(api) // GET /api/v1/company-settings: pagina de cotizacion sin sesion

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
	equipmentCatalogHandler.RegisterRoutes(protectedAPI.Group("/equipment-catalog"))
	crmQuotesHandler.RegisterRoutes(protectedAPI.Group("/crm-quotes"))
	financeHandler.RegisterRoutes(protectedAPI.Group("/finance", aclService.RequireModule("finanzas")))
	projectsHandler.RegisterRoutes(protectedAPI.Group("/projects"))
	inventoryHandler.RegisterRoutes(protectedAPI.Group("/inventory", aclService.RequireModule("inventario")))
	suppliersHandler.RegisterRoutes(protectedAPI.Group("/suppliers", aclService.RequireModule("proveedores")))
	searchHandler.RegisterRoutes(protectedAPI)
	securityHandler.RegisterRoutes(protectedAPI.Group("/security"))
	remissionsHandler.RegisterRoutes(protectedAPI.Group("/remissions"))
	documentationHandler.RegisterRoutes(protectedAPI.Group("/documentation"))
	settingsHandler.RegisterAdminRoutes(protectedAPI.Group("", requireAdminModule)) // PUT /api/v1/company-settings
	worktimeHandler.RegisterRoutes(protectedAPI.Group("/worktime", aclService.RequireModule("registro-horas")))

	// Fase 5c: correos transaccionales.
	//
	// GET /emails va solo para administración: contiene destinatarios y errores
	// de toda la empresa, y es la única ventana a un correo que no salió (sin
	// esto un fallo de SMTP sería invisible).
	//
	// Los disparadores van fuera de ese guard a propósito: quien despacha desde
	// el kanban no es necesariamente admin, y exigirle `administracion` para
	// avisarle al cliente habría dejado el trigger muerto para el usuario real
	// del flujo.
	mailerHandler := mailer.NewHandler(emailOutbox)
	mailerHandler.RegisterAdminRoutes(protectedAPI.Group("/emails", requireAdminModule))
	mailerHandler.RegisterTriggerRoutes(protectedAPI)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	if err := e.Start(":" + port); err != nil && err != http.ErrServerClosed {
		log.Fatal(err)
	}
}
