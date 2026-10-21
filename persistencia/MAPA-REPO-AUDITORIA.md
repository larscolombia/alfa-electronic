# MAPA DEL REPO alfa-electronic (rama cambios-Anderson, HEAD 35c05a83)

## 1. RUTAS FRONTEND
### src/app/app.routes.ts
import { Routes } from "@angular/router";
import { authGuard } from "./guards/auth.guard";

export const routes: Routes = [
    {
        path: "",
        loadChildren: () => import("./layouts/blank-layout/blank-layout.routes").then((m) => m.BLANK_ROUTES),
    },
    {
        path: "auth",
        loadChildren: () => import("./layouts/auth-layout/auth-layout.routes").then((m) => m.AUTH_ROUTES),
    },
    {
        path: "app",
        canActivate: [authGuard],
        loadChildren: () => import("./layouts/internal-layout/internal-layout.routes").then((m) => m.INTERNAL_ROUTES),
    },
    {
        path: "",
        loadChildren: () => import("./layouts/extra-layout/extra-layout.routes").then((m) => m.EXTRA_ROUTES),
    },
    {
        path: "index",
        canActivate: [authGuard],
        loadComponent: () => import("./pages/app/main-menu/main-menu.component").then((m) => m.MainMenuComponent),
    },
];

### src/app/layouts/internal-layout/internal-layout.routes.ts
import { Routes } from "@angular/router";
import { authChildGuard } from "../../guards/auth.guard";
import { inventoryPermissionGuard } from "../../guards/inventory-permission.guard";
import { InternalLayoutComponent } from "./internal-layout.component";

export const INTERNAL_ROUTES: Routes = [
    {
        path: "",
        component: InternalLayoutComponent,
        canActivateChild: [authChildGuard],
        children: [
            {
                path: "",
                redirectTo: "main-menu",
                pathMatch: "full",
            },
            {
                path: "main-menu",
                loadComponent: () => import("../../pages/app/main-menu/main-menu.component").then((m) => m.MainMenuComponent),
            },
            {
                path: "main-menu/:moduleId",
                loadComponent: () => import("../../pages/app/main-menu/main-menu.component").then((m) => m.MainMenuComponent),
            },
            {
                path: "grid-view",
                loadComponent: () => import("../../pages/app/main-menu/main-menu.component").then((m) => m.MainMenuComponent),
            },
            {
                path: "dashboard",
                loadComponent: () => import("../../pages/app/dashboard/dashboard.component").then((m) => m.DashboardComponent),
            },
            {
                path: "calendar",
                loadComponent: () => import("../../pages/app/calendar/calendar.component").then((m) => m.CalendarComponent),
            },
            {
                path: "crm-carga-bases",
                loadComponent: () => import("../../pages/app/crm/crm-database-upload.component").then((m) => m.CrmDatabaseUploadComponent),
            },
            {
                path: "crm-prospectos",
                loadComponent: () => import("../../pages/app/crm/crm-prospects.component").then((m) => m.CrmProspectsComponent),
            },
            {
                path: "crm-prospectos/:id",
                loadComponent: () => import("../../pages/app/crm/crm-prospect-detail.component").then((m) => m.CrmProspectDetailComponent),
            },
            {
                path: "crm-equipment-reception-print/:recordId",
                loadComponent: () => import("../../pages/app/crm/crm-prospect-equipment-reception-print.component").then((m) => m.CrmProspectEquipmentReceptionPrintComponent),
            },
            {
                path: "crm-cotizaciones",
                loadComponent: () => import("../../pages/app/crm/crm-quotes.component").then((m) => m.CrmQuotesComponent),
            },
            {
                path: "crm-clientes",
                loadComponent: () => import("../../pages/app/crm/crm-clients.component").then((m) => m.CrmClientsComponent),
            },
            {
                path: "crm-clientes/:id",
                loadComponent: () => import("../../pages/app/crm/crm-client-detail.component").then((m) => m.CrmClientDetailComponent),
            },
            {
                path: "inbox",
                loadComponent: () => import("../../pages/app/chat-inbox/inbox.component").then((m) => m.InboxComponent),
            },
            {
                path: "compose-mail",
                loadComponent: () => import("../../pages/app/chat-inbox/compose-mail.component").then((m) => m.ComposeMailComponent),
            },
            {
                path: "chat",
                loadComponent: () => import("../../pages/app/chat-inbox/chat.component").then((m) => m.ChatComponent),
            },
            {
                path: "company-career",
                loadComponent: () => import("../../pages/app/company/company-career.component").then((m) => m.CompanyCareerComponent),
            },
            {
                path: "company-contact-us",
                loadComponent: () => import("../../pages/app/company/company-contact-us.component").then((m) => m.CompanyContactusComponent),
            },
            {
                path: "company-help-center",
                loadComponent: () => import("../../pages/app/company/company-help-center.component").then((m) => m.CompanyHelpCenterComponent),
            },
            {
                path: "company-management",
                loadComponent: () => import("../../pages/app/company/company-management.component").then((m) => m.CompanyManagementComponent),
            },
            {
                path: "company-profile",
                loadComponent: () => import("../../pages/app/company/company-profile.component").then((m) => m.CompanyProfileComponent),
            },
            {
                path: "company-resources",
                loadComponent: () => import("../../pages/app/company/company-resources.component").then((m) => m.CompanyResourceComponent),
            },
            {
                path: "company-user-roles",
                loadComponent: () => import("../../pages/app/company/company-user-roles.component").then((m) => m.CompanyUserRolesComponent),
            },
            {
                path: "company-acl-hr-playground",
                loadComponent: () => import("../../pages/app/company/company-acl-hr-playground.component").then((m) => m.CompanyAclHrPlaygroundComponent),
            },
            {
                path: "suppliers-dashboard",
                loadComponent: () => import("../../pages/app/company/company-suppliers-dashboard.component").then((m) => m.CompanySuppliersDashboardComponent),
            },
            {
                path: "suppliers-crud",
                loadComponent: () => import("../../pages/app/company/company-suppliers-crud.component").then((m) => m.CompanySuppliersCrudComponent),
            },
            {
                path: "suppliers-orders-history",
                loadComponent: () => import("../../pages/app/company/company-suppliers-orders-history.component").then((m) => m.CompanySuppliersOrdersHistoryComponent),
            },
            {
                path: "company-hr-dashboard",
                loadComponent: () => import("../../pages/app/company/hr/company-hr-dashboard.component").then((m) => m.CompanyHrDashboardComponent),
            },
            {
                path: "company-hr-employees",
                loadComponent: () => import("../../pages/app/company/hr/company-hr-employees.component").then((m) => m.CompanyHrEmployeesComponent),
            },
            {
                path: "company-hr-workload",
                redirectTo: "work-workload",
                pathMatch: "full",
            },
            {
                path: "company-hr-compensation",
                loadComponent: () => import("../../pages/app/company/hr/company-hr-compensation.component").then((m) => m.CompanyHrCompensationComponent),
            },
            {
                path: "company-hr-worktime",
                loadComponent: () => import("../../pages/app/company/hr/company-hr-worktime.component").then((m) => m.CompanyHrWorktimeComponent),
            },
            {
                path: "company-hr-health",
                loadComponent: () => import("../../pages/app/company/hr/company-hr-health.component").then((m) => m.CompanyHrHealthComponent),
            },
            {
                path: "company-hr-leaves",
                loadComponent: () => import("../../pages/app/company/hr/company-hr-leaves.component").then((m) => m.CompanyHrLeavesComponent),
            },
            {
                path: "company-hr-documents",
                loadComponent: () => import("../../pages/app/company/hr/company-hr-documents.component").then((m) => m.CompanyHrDocumentsComponent),
            },
            {
                path: "company-hr-audit",
                loadComponent: () => import("../../pages/app/company/hr/company-hr-audit.component").then((m) => m.CompanyHrAuditComponent),
            },
            {
                path: "company-commercial-config",
                loadComponent: () => import("../../pages/app/company/company-commercial-config.component").then((m) => m.CompanyCommercialConfigComponent),
            },
            {
                path: "company-followups-config",
                loadComponent: () => import("../../pages/app/company/company-followups-config.component").then((m) => m.CompanyFollowupsConfigComponent),
            },
            {
                path: "company-projects-config",
                loadComponent: () => import("../../pages/app/company/company-projects-config.component").then((m) => m.CompanyProjectsConfigComponent),
            },
            {
                path: "advanced-security-ip-restrictions",
                loadComponent: () => import("../../pages/app/security/advanced-security-ip-restrictions.component").then((m) => m.AdvancedSecurityIpRestrictionsComponent),
            },
            {
                path: "contact-us",
                loadComponent: () => import("../../pages/app/contactus/contact-us.component").then((m) => m.ContactUsComponent),
            },
            {
                path: "explorer",
                loadComponent: () => import("../../pages/app/explorer/explorer.component").then((m) => m.ExplorerComponent),
            },
            {
                path: "finance-bank",
                loadComponent: () => import("../../pages/app/finance/finance-banks.component").then((m) => m.FinanceBankComponent),
            },
            {
                path: "finance-crypto",
                loadComponent: () => import("../../pages/app/finance/finance-crypto.component").then((m) => m.FinanceCryptoComponent),
            },
            {
                path: "finance-dashboard",
                loadComponent: () => import("../../pages/app/finance/finance-dashboard.component").then((m) => m.FinanceDashboardComponent),
            },
            {
                path: "finance-caja-menor",
                loadComponent: () => import("../../pages/app/finance/finance-caja-menor.component").then((m) => m.FinanceCajaMenorComponent),
            },
            {
                path: "finance-cuentas",
                loadComponent: () => import("../../pages/app/finance/finance-cuentas.component").then((m) => m.FinanceCuentasComponent),
            },
            {
                path: "finance-pagos",
                loadComponent: () => import("../../pages/app/finance/finance-pagos.component").then((m) => m.FinancePagosComponent),
            },
            {
                path: "finance-facturacion",
                loadComponent: () => import("../../pages/app/finance/finance-billing.component").then((m) => m.FinanceBillingComponent),
            },
            {
                path: "finance-facturacion-crear",
                loadComponent: () => import("../../pages/app/finance/finance-invoice-create.component").then((m) => m.FinanceInvoiceCreateComponent),
            },
            {
                path: "finance-facturacion-recurrentes",
                loadComponent: () => import("../../pages/app/finance/finance-recurring-invoices.component").then((m) => m.FinanceRecurringInvoicesComponent),
            },
            {
                path: "finance-facturacion-recurrente",
                loadComponent: () => import("../../pages/app/finance/finance-recurring-invoices.component").then((m) => m.FinanceRecurringInvoicesComponent),
            },
            {
                path: "finance-facturacion-recurrentes-crear",
                loadComponent: () => import("../../pages/app/finance/finance-recurring-invoice-create.component").then((m) => m.FinanceRecurringInvoiceCreateComponent),
            },
            {
                path: "finance-facturacion-recurrente-crear",
                loadComponent: () => import("../../pages/app/finance/finance-recurring-invoice-create.component").then((m) => m.FinanceRecurringInvoiceCreateComponent),
            },
            {
                path: "finance-facturacion-tiempo",
                loadComponent: () => import("../../pages/app/finance/finance-time-invoice.component").then((m) => m.FinanceTimeInvoiceComponent),
            },
            {
                path: "finance-garantias",
                loadComponent: () => import("../../pages/app/finance/finance-garantias.component").then((m) => m.FinanceGarantiasComponent),
            },
            {
                path: "finance-clientes-credito",
                loadComponent: () => import("../../pages/app/finance/finance-credit-clients.component").then((m) => m.FinanceCreditClientsComponent),
            },
            {
                path: "finance-rewards",
                loadComponent: () => import("../../pages/app/finance/finance-rewards.component").then((m) => m.FinanceRewardsComponent),
            },
            {
                path: "finance-wallet",
                loadComponent: () => import("../../pages/app/finance/finance-wallet.component").then((m) => m.FinanceWalletComponent),
            },
            {
                path: "forum",
                loadComponent: () => import("../../pages/app/forum/forum.component").then((m) => m.ForumComponent),
            },
            {
                path: "forum-details",
                loadComponent: () => import("../../pages/app/forum/forum-details.component").then((m) => m.ForumDetailsComponent),
            },
            {
                path: "inventory-dashboard",
                canActivate: [inventoryPermissionGuard],
                data: {
                    inventoryPermission: "inventory.dashboard.view",
                },
                loadComponent: () => import("../../pages/app/inventory/inventory-control-center.component").then((m) => m.InventoryControlCenterComponent),
            },
            {
                path: "inventory-stock",
                canActivate: [inventoryPermissionGuard],
                data: {
                    inventoryPermission: "inventory.stock.view",
                },
                loadComponent: () => import("../../pages/app/inventory/inventory-stock-workbench.component").then((m) => m.InventoryStockWorkbenchComponent),
            },
            {
                path: "inventory-movements",
                canActivate: [inventoryPermissionGuard],
                data: {
                    inventoryPermission: "inventory.movements.view",
                },
                loadComponent: () => import("../../pages/app/inventory/inventory-movements.component").then((m) => m.InventoryMovementsComponent),
            },
            {
                path: "inventory-reservations",
                canActivate: [inventoryPermissionGuard],
                data: {
                    inventoryPermission: "inventory.reservations.view",
                },
                loadComponent: () => import("../../pages/app/inventory/inventory-reservations.component").then((m) => m.InventoryReservationsComponent),
            },
            {
                path: "inventory-orders",
                canActivate: [inventoryPermissionGuard],
                data: {
                    inventoryPermission: "inventory.replenishment.view",
                },
                loadComponent: () => import("../../pages/app/inventory/inventory-replenishment.component").then((m) => m.InventoryReplenishmentComponent),
            },
            {
                path: "inventory-order-details",
                canActivate: [inventoryPermissionGuard],
                data: {
                    inventoryPermission: "inventory.reconciliation.view",
                },
                loadComponent: () => import("../../pages/app/inventory/inventory-reconciliation.component").then((m) => m.InventoryReconciliationComponent),
            },
            {
                path: "learning-courses",
                loadComponent: () => import("../../pages/app/learning/learning-courses.component").then((m) => m.LearningCoursesComponent),
            },
            {
                path: "learning-dashboard",
                loadComponent: () => import("../../pages/app/learning/learning-dashboard.component").then((m) => m.LearningDashboardComponent),
            },
            {
                path: "learning-institutions",
                loadComponent: () => import("../../pages/app/learning/learning-institutions.component").then((m) => m.LearningInstituationsComponent),
            },
            {
                path: "account-settings",
                loadComponent: () => import("../../pages/app/myprofile/account-settings.component").then((m) => m.AccountSettingsComponent),
            },
            {
                path: "my-earning",
                loadComponent: () => import("../../pages/app/myprofile/my-earning.component").then((m) => m.MyEarningComponent),
            },
            {
                path: "my-profile",
                loadComponent: () => import("../../pages/app/myprofile/my-profile.component").then((m) => m.MyProfileComponent),
            },
            {
                path: "my-subscription",
                loadComponent: () => import("../../pages/app/myprofile/my-subscription.component").then((m) => m.MySubscriptionComponent),
            },
            {
                path: "statement",
                loadComponent: () => import("../../pages/app/myprofile/statement.component").then((m) => m.StatementComponent),
            },
            {
                path: "payment",
                loadComponent: () => import("../../pages/app/myprofile/payment.component").then((m) => m.PaymentComponent),
            },
            {
                path: "subscription-plans",
                loadComponent: () => import("../../pages/app/myprofile/subscription-plans.component").then((m) => m.SubscriptionPlansComponent),
            },
            {
                path: "network-dashboard",
                loadComponent: () => import("../../pages/app/network/network-dashboard.component").then((m) => m.NetworkDashboardComponent),
            },
            {
                path: "network-performance",
                loadComponent: () => import("../../pages/app/network/network-performance.component").then((m) => m.NetworkPerformanceComponent),
            },
            {
                path: "network-smart-home",
                loadComponent: () => import("../../pages/app/network/network-smart-home.component").then((m) => m.NetworkSmartHomeComponent),
            },
            {
                path: "privacy-policy",
                loadComponent: () => import("../../pages/app/privacypolicy/privacy-policy.component").then((m) => m.PrivacyPolicyComponent),
            },
            {
                path: "profile-professional",
                loadComponent: () => import("../../pages/app/profiles/profile-professional.component").then((m) => m.ProfileProfessionalComponent),
            },
            {
                path: "profile-analytical",
                loadComponent: () => import("../../pages/app/profiles/profile-analytical.component").then((m) => m.ProfileAnalyticalComponent),
            },
            {
                path: "profile-social",
                loadComponent: () => import("../../pages/app/profiles/profile-social.component").then((m) => m.ProfileSocialComponent),
            },
            {
                path: "project-dashboard",
                loadComponent: () => import("../../pages/app/project/project-dashboard.component").then((m) => m.ProjectDashboardComponent),
            },
            {
                path: "project-board",
                redirectTo: "work-projects",
                pathMatch: "full",
            },
            {
                path: "project-projects",
                loadComponent: () => import("../../pages/app/project/project-projects.component").then((m) => m.ProjectProjectsComponent),
            },
            {
                path: "work-timesheet",
                loadComponent: () => import("../../pages/app/work/work-timesheet.component").then((m) => m.WorkTimesheetComponent),
            },
            {
                path: "work-tasks",
                loadComponent: () => import("../../pages/app/work/work-tasks.component").then((m) => m.WorkTasksComponent),
            },
            {
                path: "work-workload",
                loadComponent: () => import("../../pages/app/work/work-workload.component").then((m) => m.WorkWorkloadComponent),
            },
            {
                path: "work-test-batches",
                loadComponent: () => import("../../pages/app/work/work-test-batches.component").then((m) => m.WorkTestBatchesComponent),
            },
            {
                path: "work-teams",
                loadComponent: () => import("../../pages/app/work/work-teams.component").then((m) => m.WorkTeamsComponent),
            },
            {
                path: "work-equipment-reception",
                loadComponent: () => import("../../pages/app/work/work-teams.component").then((m) => m.WorkTeamsComponent),
                data: {
                    workEquipmentTitle: "Trabajo - Recepción de equipos",
                    workEquipmentSubtitle: "Recepción y seguimiento operativo de equipos con el mismo flujo de CRM.",
                    workEquipmentBreadcrumbLabel: "Recepción de equipos",
                },
            },
            {
                path: "work-garantias",
                loadComponent: () => import("../../pages/app/finance/finance-garantias.component").then((m) => m.FinanceGarantiasComponent),
            },
            {
                path: "work-projects",
                loadComponent: () => import("../../pages/app/work/work-projects.component").then((m) => m.WorkProjectsComponent),
            },
            {
                path: "work-projects/:id",
                loadComponent: () => import("../../pages/app/work/work-projects.component").then((m) => m.WorkProjectsComponent),
            },
            {
                path: "work-equipment-history",
                loadComponent: () => import("../../pages/app/work/work-equipment-history.component").then((m) => m.WorkEquipmentHistoryComponent),
            },
            {
                path: "social-analytics",
                loadComponent: () => import("../../pages/app/social/social-analytics.component").then((m) => m.SocialAnalyticsComponent),
            },
            {
                path: "social-dashboard",
                loadComponent: () => import("../../pages/app/social/social-dashboard.component").then((m) => m.SocialDashboardComponent),
            },
            {
                path: "social-schedular",
                loadComponent: () => import("../../pages/app/social/social-schedular.component").then((m) => m.SocialSchedularComponent),
            },
            {
                path: "terms-of-use",
                loadComponent: () => import("../../pages/app/termsofuse/termsofuse.component").then((m) => m.TermsOfUseComponent),
            },
            {
                path: "timeline",
                loadComponent: () => import("../../pages/app/timeline/timeline.component").then((m) => m.TimelineComponent),
            },
            {
                path: "personalization",
                loadComponent: () => import("../../pages/app/personalization/personalization.component").then((m) => m.PersonalizationComponent),
            },
            {
                path: "remissions",
                loadComponent: () => import("../../pages/app/remissions/remissions.component").then((m) => m.RemissionsComponent),
            },
            {
                path: "documentation",
                loadComponent: () => import("../../pages/app/documentation/documentation.component").then((m) => m.DocumentationComponent),
            },
        ],
    },
];

### src/app/layouts/auth-layout/auth-layout.routes.ts
import { Routes } from "@angular/router";
import { guestOnlyGuard } from "../../guards/auth.guard";
import { AuthLayoutComponent } from "./auth-layout.component";

export const AUTH_ROUTES: Routes = [
    {
        path: "",
        component: AuthLayoutComponent,
        children: [
            {
                path: "",
                redirectTo: "signin",
                pathMatch: "full",
            },
            {
                path: "signin",
                canActivate: [guestOnlyGuard],
                loadComponent: () => import("../../pages/auth/signin/signin.component").then((m) => m.SigninComponent),
            },
            {
                path: "signup",
                loadComponent: () => import("../../pages/auth/signup/signup.component").then((m) => m.SignupComponent),
            },
            {
                path: "forgot-password",
                loadComponent: () => import("../../pages/auth/forgot-password/forgot-password.component").then((m) => m.ForgotPasswordComponent),
            },
            {
                path: "change-password",
                loadComponent: () => import("../../pages/auth/change-password/change-password.component").then((m) => m.ChangePasswordComponent),
            },
            {
                path: "signup-success",
                loadComponent: () => import("../../pages/auth/signup-success/signup-success.component").then((m) => m.SignupSuccessComponent),
            },
            {
                path: "onboarding",
                loadComponent: () => import("../../pages/auth/onboarding/onboarding.component").then((m) => m.OnboardingComponent),
            },
            {
                path: "onboarding2",
                loadComponent: () => import("../../pages/auth/onboarding/onboarding2.component").then((m) => m.Onboarding2Component),
            },
        ],
    },
];

### src/app/layouts/blank-layout/blank-layout.routes.ts
import { Routes } from "@angular/router";
import { BlankLayoutComponent } from "./blank-layout.component";

export const BLANK_ROUTES: Routes = [
    {
        path: "",
        component: BlankLayoutComponent,
        children: [
            {
                path: "",
                loadComponent: () => import("../../pages/splash/splash.component").then((m) => m.SplashComponent),
            },
        ],
    },
];

### src/app/layouts/extra-layout/extra-layout.routes.ts
import { Routes } from "@angular/router";
import { guestOnlyGuard } from "../../guards/auth.guard";
import { ExtraLayoutComponent } from "./extra-layout.component";

export const EXTRA_ROUTES: Routes = [
    {
        path: "",
        component: ExtraLayoutComponent,
        children: [
            {
                path: "not-found",
                loadComponent: () => import("../../pages/extra/page-not-found/page-not-found.component").then((m) => m.PageNotFoundComponent),
            },
            {
                path: "under-construction",
                loadComponent: () => import("../../pages/extra/under-construction/under-construction.component").then((m) => m.UnderConstructionComponent),
            },
            {
                path: "coming-soon",
                loadComponent: () => import("../../pages/extra/coming-soon/coming-soon.component").then((m) => m.ComingSoonComponent),
            },
            {
                path: "estimate/:token",
                loadComponent: () => import("../../pages/app/crm/crm-quote-preview.component").then((m) => m.CrmQuotePreviewComponent),
            },
            {
                path: "",
                canActivate: [guestOnlyGuard],
                loadComponent: () => import("../../pages/auth/signin/signin.component").then((m) => m.SigninComponent),
                pathMatch: "full",
            },
            {
                path: "**",
                loadComponent: () => import("../../pages/extra/page-not-found/page-not-found.component").then((m) => m.PageNotFoundComponent),
            },
        ],
    },
];

## 2. COMPONENTES POR PAGINA (frontend)
src/app/pages/app/calendar/calendar.component.ts
src/app/pages/app/chat-inbox/chat.component.ts
src/app/pages/app/chat-inbox/compose-mail.component.ts
src/app/pages/app/chat-inbox/inbox.component.ts
src/app/pages/app/company/company-acl-hr-playground.component.ts
src/app/pages/app/company/company-career.component.ts
src/app/pages/app/company/company-commercial-config.component.ts
src/app/pages/app/company/company-contact-us.component.ts
src/app/pages/app/company/company-equipment-config.component.ts
src/app/pages/app/company/company-followups-config.component.ts
src/app/pages/app/company/company-help-center.component.ts
src/app/pages/app/company/company-management.component.ts
src/app/pages/app/company/company-profile.component.ts
src/app/pages/app/company/company-projects-config.component.ts
src/app/pages/app/company/company-resources.component.ts
src/app/pages/app/company/company-suppliers-crud.component.ts
src/app/pages/app/company/company-suppliers-dashboard.component.ts
src/app/pages/app/company/company-suppliers-orders-history.component.ts
src/app/pages/app/company/company-user-roles.component.ts
src/app/pages/app/company/hr/company-hr-audit.component.ts
src/app/pages/app/company/hr/company-hr-compensation.component.ts
src/app/pages/app/company/hr/company-hr-dashboard.component.ts
src/app/pages/app/company/hr/company-hr-documents.component.ts
src/app/pages/app/company/hr/company-hr-employees.component.ts
src/app/pages/app/company/hr/company-hr-health.component.ts
src/app/pages/app/company/hr/company-hr-leaves.component.ts
src/app/pages/app/company/hr/company-hr-worktime.component.ts
src/app/pages/app/contactus/contact-us.component.ts
src/app/pages/app/crm/crm-client-contacts.component.ts
src/app/pages/app/crm/crm-client-detail.component.ts
src/app/pages/app/crm/crm-clients-import.component.ts
src/app/pages/app/crm/crm-clients.component.ts
src/app/pages/app/crm/crm-database-upload.component.ts
src/app/pages/app/crm/crm-prospect-detail.component.ts
src/app/pages/app/crm/crm-prospect-equipment-modal.component.ts
src/app/pages/app/crm/crm-prospect-equipment-reception-print.component.ts
src/app/pages/app/crm/crm-prospects.component.ts
src/app/pages/app/crm/crm-quote-preview.component.ts
src/app/pages/app/crm/crm-quotes.component.ts
src/app/pages/app/dashboard/dashboard.component.ts
src/app/pages/app/documentation/documentation.component.ts
src/app/pages/app/explorer/explorer.component.ts
src/app/pages/app/finance/finance-banks.component.ts
src/app/pages/app/finance/finance-billing.component.ts
src/app/pages/app/finance/finance-caja-menor.component.ts
src/app/pages/app/finance/finance-credit-clients.component.ts
src/app/pages/app/finance/finance-crypto.component.ts
src/app/pages/app/finance/finance-cuentas.component.ts
src/app/pages/app/finance/finance-dashboard.component.ts
src/app/pages/app/finance/finance-garantias.component.ts
src/app/pages/app/finance/finance-invoice-create.component.ts
src/app/pages/app/finance/finance-pagos.component.ts
src/app/pages/app/finance/finance-recurring-invoice-create.component.ts
src/app/pages/app/finance/finance-recurring-invoices.component.ts
src/app/pages/app/finance/finance-rewards.component.ts
src/app/pages/app/finance/finance-time-invoice.component.ts
src/app/pages/app/finance/finance-wallet.component.ts
src/app/pages/app/forum/forum-details.component.ts
src/app/pages/app/forum/forum.component.ts
src/app/pages/app/inventory/inventory-control-center.component.ts
src/app/pages/app/inventory/inventory-dashboard.component.ts
src/app/pages/app/inventory/inventory-movements.component.ts
src/app/pages/app/inventory/inventory-order-details.component.ts
src/app/pages/app/inventory/inventory-orders.component.ts
src/app/pages/app/inventory/inventory-reconciliation.component.ts
src/app/pages/app/inventory/inventory-replenishment.component.ts
src/app/pages/app/inventory/inventory-reservations.component.ts
src/app/pages/app/inventory/inventory-stock-workbench.component.ts
src/app/pages/app/inventory/inventory-stock.component.ts
src/app/pages/app/inventory/purchase-requests-panel.component.ts
src/app/pages/app/learning/learning-courses.component.ts
src/app/pages/app/learning/learning-dashboard.component.ts
src/app/pages/app/learning/learning-institutions.component.ts
src/app/pages/app/main-menu/main-menu.component.ts
src/app/pages/app/myprofile/account-settings.component.ts
src/app/pages/app/myprofile/my-earning.component.ts
src/app/pages/app/myprofile/my-profile.component.ts
src/app/pages/app/myprofile/my-subscription.component.ts
src/app/pages/app/myprofile/payment.component.ts
src/app/pages/app/myprofile/statement.component.ts
src/app/pages/app/myprofile/subscription-plans.component.ts
src/app/pages/app/network/network-dashboard.component.ts
src/app/pages/app/network/network-performance.component.ts
src/app/pages/app/network/network-smart-home.component.ts
src/app/pages/app/personalization/personalization.component.ts
src/app/pages/app/privacypolicy/privacy-policy.component.ts
src/app/pages/app/profiles/profile-analytical.component.ts
src/app/pages/app/profiles/profile-professional.component.ts
src/app/pages/app/profiles/profile-social.component.ts
src/app/pages/app/project/project-dashboard.component.ts
src/app/pages/app/project/project-projects.component.ts
src/app/pages/app/projects/components/project-card/project-card.component.ts
src/app/pages/app/projects/components/project-detail/project-detail.component.ts
src/app/pages/app/projects/components/project-transition-check-modal.component.ts
src/app/pages/app/projects/components/task-form/task-form.component.ts
src/app/pages/app/projects/components/task-list/task-list.component.ts
src/app/pages/app/projects/kanban-view.component.ts
src/app/pages/app/projects/projects-board.component.ts
src/app/pages/app/remissions/remissions.component.ts
src/app/pages/app/security/advanced-security-ip-restrictions.component.ts
src/app/pages/app/social/social-analytics.component.ts
src/app/pages/app/social/social-dashboard.component.ts
src/app/pages/app/social/social-schedular.component.ts
src/app/pages/app/termsofuse/termsofuse.component.ts
src/app/pages/app/timeline/timeline.component.ts
src/app/pages/app/work/work-equipment-history.component.ts
src/app/pages/app/work/work-projects.component.ts
src/app/pages/app/work/work-tasks.component.ts
src/app/pages/app/work/work-teams.component.ts
src/app/pages/app/work/work-test-batches.component.ts
src/app/pages/app/work/work-timesheet.component.ts
src/app/pages/app/work/work-workload.component.ts
src/app/pages/auth/change-password/change-password.component.ts
src/app/pages/auth/forgot-password/forgot-password.component.ts
src/app/pages/auth/onboarding/onboarding.component.ts
src/app/pages/auth/onboarding/onboarding2.component.ts
src/app/pages/auth/signin/signin.component.ts
src/app/pages/auth/signup-success/signup-success.component.ts
src/app/pages/auth/signup/signup.component.ts
src/app/pages/extra/coming-soon/coming-soon.component.ts
src/app/pages/extra/page-not-found/page-not-found.component.ts
src/app/pages/extra/under-construction/under-construction.component.ts
src/app/pages/splash/splash.component.ts

## 3. SERVICES FRONTEND (llamadas HTTP)
src/app/pages/app/projects/services/project-equipment.service.ts
src/app/pages/app/projects/services/project-filter.service.ts
src/app/pages/app/projects/services/project.service.ts
src/app/pages/app/projects/services/task.service.ts
src/app/pages/app/work/work-test-batch.service.ts
src/app/services/acl-api.service.ts
src/app/services/advanced-security-api.service.ts
src/app/services/auth-flows-api.service.ts
src/app/services/auth.service.ts
src/app/services/calendar-api.service.ts
src/app/services/confirmation-modal.service.ts
src/app/services/crm-attachments-api.service.ts
src/app/services/crm-clients-api.service.ts
src/app/services/crm-equipment-api.service.ts
src/app/services/crm-followups-api.service.ts
src/app/services/crm-prospects-api.service.ts
src/app/services/crm-quotes-api.service.ts
src/app/services/finance-accounts-api.service.ts
src/app/services/finance-billing-api.service.ts
src/app/services/finance-payments-api.service.ts
src/app/services/form-draft.service.ts
src/app/services/global-search.service.ts
src/app/services/hr-api.service.ts
src/app/services/hr-documents-api.service.ts
src/app/services/inventory-api.service.ts
src/app/services/inventory-rbac.service.ts
src/app/services/inventory-workflow.service.ts
src/app/services/suppliers-api.service.ts
src/app/services/suppliers-catalog.service.ts
src/app/services/work-equipment-history-context.service.ts
src/app/services/work-time-tracker.service.ts

## 4. REGISTRO DE RUTAS BACKEND (Go)
backend/cmd/server/main.go:127:	api := e.Group("/api/v1")
backend/cmd/server/main.go:128:	authHandler.RegisterRoutes(api.Group("/auth"))
backend/cmd/server/main.go:129:	crmQuotesHandler.RegisterPublicRoutes(api.Group("/crm-quotes"))
backend/cmd/server/main.go:131:	protectedAPI := api.Group("")
backend/cmd/server/main.go:135:	aclHandler.RegisterRoutes(protectedAPI.Group("/acl"))
backend/cmd/server/main.go:136:	aclHandler.RegisterUserRoutes(protectedAPI.Group("/users"))
backend/cmd/server/main.go:137:	hrHandler.RegisterRoutes(protectedAPI.Group("/hr"))
backend/cmd/server/main.go:138:	calendarHandler.RegisterRoutes(protectedAPI.Group("/calendar"))
backend/cmd/server/main.go:139:	crmHandler.RegisterRoutes(protectedAPI.Group("/crm"))
backend/cmd/server/main.go:140:	crmEquipmentHandler.RegisterRoutes(protectedAPI.Group("/crm-equipment"))
backend/cmd/server/main.go:141:	crmQuotesHandler.RegisterRoutes(protectedAPI.Group("/crm-quotes"))
backend/cmd/server/main.go:142:	financeHandler.RegisterRoutes(protectedAPI.Group("/finance"))
backend/cmd/server/main.go:143:	projectsHandler.RegisterRoutes(protectedAPI.Group("/projects"))
backend/cmd/server/main.go:144:	inventoryHandler.RegisterRoutes(protectedAPI.Group("/inventory"))
backend/cmd/server/main.go:145:	suppliersHandler.RegisterRoutes(protectedAPI.Group("/suppliers"))
backend/cmd/server/main.go:147:	securityHandler.RegisterRoutes(protectedAPI.Group("/security"))
backend/cmd/server/main.go:148:	remissionsHandler.RegisterRoutes(protectedAPI.Group("/remissions"))
backend/cmd/server/main.go:149:	documentationHandler.RegisterRoutes(protectedAPI.Group("/documentation"))
backend/cmd/server/main.go:46:	e.GET("/health", func(c echo.Context) error {
backend/internal/acl/handler.go:20:	group.GET("/modules", h.listModules)
backend/internal/acl/handler.go:21:	group.GET("/roles", h.listRoles)
backend/internal/acl/handler.go:22:	group.POST("/roles", h.createRole)
backend/internal/acl/handler.go:23:	group.GET("/roles/:roleID/permissions", h.getRolePermissions)
backend/internal/acl/handler.go:24:	group.PUT("/roles/:roleID/permissions", h.updateRolePermissions)
backend/internal/acl/handler.go:28:	group.PATCH("/soft-delete", h.softDeleteUsers)
backend/internal/auth/handler.go:22:	group.POST("/login", h.login)
backend/internal/auth/handler.go:23:	group.POST("/signup", h.signup)
backend/internal/auth/handler.go:24:	group.GET("/signup/:signupID", h.getSignup)
backend/internal/auth/handler.go:25:	group.POST("/signup/:signupID/success", h.signupSuccess)
backend/internal/auth/handler.go:26:	group.POST("/forgot-password", h.forgotPassword)
backend/internal/auth/handler.go:27:	group.POST("/change-password", h.changePassword)
backend/internal/auth/handler.go:28:	group.POST("/onboarding", h.upsertOnboarding)
backend/internal/auth/handler.go:29:	group.GET("/onboarding/:signupID", h.getOnboarding)
backend/internal/auth/handler.go:30:	group.POST("/onboarding/complete", h.completeOnboarding)
backend/internal/calendar/handler.go:22:	group.GET("/events", h.listEvents)
backend/internal/calendar/handler.go:23:	group.POST("/events", h.createEvent)
backend/internal/calendar/handler.go:24:	group.GET("/events/:eventID", h.getEvent)
backend/internal/calendar/handler.go:25:	group.PUT("/events/:eventID", h.updateEvent)
backend/internal/calendar/handler.go:26:	group.DELETE("/events/:eventID", h.deleteEvent)
backend/internal/crm/equipment/handler.go:24:	group.GET("/records", h.listRecords)
backend/internal/crm/equipment/handler.go:25:	group.GET("/records/:recordID", h.getRecord)
backend/internal/crm/equipment/handler.go:26:	group.POST("/records", h.upsertRecord)
backend/internal/crm/equipment/handler.go:27:	group.PUT("/records/:recordID", h.upsertRecord)
backend/internal/crm/equipment/handler.go:28:	group.POST("/records/:recordID/finalize", h.finalizeRecord)
backend/internal/crm/equipment/handler.go:29:	group.PATCH("/records/:recordID/archive", h.archiveRecord)
backend/internal/crm/equipment/handler.go:30:	group.POST("/records/:recordID/restore", h.restoreRecord)
backend/internal/crm/equipment/handler.go:32:	group.GET("/items", h.listItems)
backend/internal/crm/equipment/handler.go:33:	group.GET("/technicians", h.listTechnicians)
backend/internal/crm/equipment/handler.go:34:	group.GET("/insights", h.getInsight)
backend/internal/crm/equipment/handler.go:36:	group.POST("/records/:recordID/items/:itemID/attachments", h.addItemAttachment)
backend/internal/crm/equipment/handler.go:37:	group.PUT("/records/:recordID/items/:itemID/assignment", h.assignItemTechnician)
backend/internal/crm/equipment/handler.go:38:	group.DELETE("/records/:recordID/items/:itemID/attachments/:attachmentID", h.deleteItemAttachment)
backend/internal/crm/handler.go:19:	group.GET("/prospects", h.listProspects)
backend/internal/crm/handler.go:20:	group.POST("/prospects", h.createProspect)
backend/internal/crm/handler.go:21:	group.GET("/prospects/:prospectID", h.getProspect)
backend/internal/crm/handler.go:22:	group.PUT("/prospects/:prospectID", h.updateProspect)
backend/internal/crm/handler.go:23:	group.DELETE("/prospects/:prospectID", h.deleteProspect)
backend/internal/crm/handler.go:24:	group.PUT("/prospects/:prospectID/note", h.updateProspectNote)
backend/internal/crm/handler.go:26:	group.GET("/prospects/:prospectID/contacts", h.listProspectContacts)
backend/internal/crm/handler.go:27:	group.POST("/prospects/:prospectID/contacts", h.createProspectContact)
backend/internal/crm/handler.go:28:	group.PUT("/prospects/:prospectID/contacts/:contactID", h.updateProspectContact)
backend/internal/crm/handler.go:29:	group.DELETE("/prospects/:prospectID/contacts/:contactID", h.deleteProspectContact)
backend/internal/crm/handler.go:31:	group.GET("/prospects/:prospectID/followups", h.listProspectFollowups)
backend/internal/crm/handler.go:32:	group.POST("/prospects/:prospectID/followups", h.createProspectFollowup)
backend/internal/crm/handler.go:33:	group.PUT("/prospects/:prospectID/followups/:followupID", h.updateProspectFollowup)
backend/internal/crm/handler.go:34:	group.DELETE("/prospects/:prospectID/followups/:followupID", h.deleteProspectFollowup)
backend/internal/crm/handler.go:36:	group.GET("/catalogs", h.listCatalogs)
backend/internal/crm/handler.go:37:	group.GET("/catalogs/:catalogType", h.listCatalog)
backend/internal/crm/handler.go:38:	group.POST("/catalogs/:catalogType", h.createCatalogItem)
backend/internal/crm/handler.go:39:	group.DELETE("/catalogs/:catalogType/:itemID", h.deleteCatalogItem)
backend/internal/crm/handler.go:40:	group.POST("/catalogs/:catalogType/restore-defaults", h.restoreDefaultCatalog)
backend/internal/crm/handler.go:42:	group.GET("/clients", h.listClients)
backend/internal/crm/handler.go:43:	group.POST("/clients", h.createClient)
backend/internal/crm/handler.go:44:	group.POST("/clients/bulk", h.bulkCreateClients)
backend/internal/crm/handler.go:45:	group.GET("/clients/:clientID", h.getClient)
backend/internal/crm/handler.go:46:	group.PUT("/clients/:clientID", h.updateClient)
backend/internal/crm/handler.go:47:	group.DELETE("/clients/:clientID", h.deleteClient)
backend/internal/crm/handler.go:48:	group.GET("/clients/:clientID/related-contacts", h.listClientRelatedContacts)
backend/internal/crm/handler.go:50:	group.GET("/clients/:clientID/contacts", h.listClientContacts)
backend/internal/crm/handler.go:51:	group.POST("/clients/:clientID/contacts", h.createClientContact)
backend/internal/crm/handler.go:52:	group.PUT("/clients/:clientID/contacts/:contactID", h.updateClientContact)
backend/internal/crm/handler.go:53:	group.DELETE("/clients/:clientID/contacts/:contactID", h.deleteClientContact)
backend/internal/crm/handler.go:55:	group.POST("/prospects/:prospectID/convert-to-client", h.convertProspectToClient)
backend/internal/crm/handler.go:57:	group.GET("/prospects/:prospectID/attachments", h.listProspectAttachments)
backend/internal/crm/handler.go:58:	group.POST("/prospects/:prospectID/attachments", h.createProspectAttachment)
backend/internal/crm/handler.go:59:	group.DELETE("/prospects/:prospectID/attachments/:attachmentID", h.deleteProspectAttachment)
backend/internal/crm/quotes/handler.go:22:	group.GET("/quotes", h.listQuotes)
backend/internal/crm/quotes/handler.go:23:	group.POST("/quotes", h.createQuote)
backend/internal/crm/quotes/handler.go:24:	group.GET("/quotes/:quoteID", h.getQuote)
backend/internal/crm/quotes/handler.go:25:	group.PUT("/quotes/:quoteID", h.updateQuote)
backend/internal/crm/quotes/handler.go:26:	group.DELETE("/quotes/:quoteID", h.deleteQuote)
backend/internal/crm/quotes/handler.go:30:	group.GET("/quotes/public/:token", h.getQuoteByToken)
backend/internal/crm/quotes/handler.go:31:	group.PATCH("/quotes/public/:token/decision", h.updateDecisionByToken)
backend/internal/docs/handler.go:19:	group.GET("/documents", h.listDocuments)
backend/internal/docs/handler.go:20:	group.POST("/documents", h.createDocument)
backend/internal/docs/handler.go:21:	group.GET("/backups", h.listBackups)
backend/internal/docs/handler.go:22:	group.POST("/backups", h.createBackup)
backend/internal/docs/handler.go:23:	group.GET("/backups/model/:model", h.getBackupForModel)
backend/internal/finance/handler.go:20:	group.GET("/accounts", h.listAccounts)
backend/internal/finance/handler.go:21:	group.POST("/accounts", h.createAccount)
backend/internal/finance/handler.go:22:	group.GET("/accounts/:accountID", h.getAccount)
backend/internal/finance/handler.go:23:	group.PUT("/accounts/:accountID", h.updateAccount)
backend/internal/finance/handler.go:24:	group.DELETE("/accounts/:accountID", h.deleteAccount)
backend/internal/finance/handler.go:26:	group.GET("/payments", h.listPayments)
backend/internal/finance/handler.go:27:	group.POST("/payments", h.createPayment)
backend/internal/finance/handler.go:28:	group.GET("/payments/:paymentID", h.getPayment)
backend/internal/finance/handler.go:29:	group.PUT("/payments/:paymentID", h.updatePayment)
backend/internal/finance/handler.go:30:	group.DELETE("/payments/:paymentID", h.deletePayment)
backend/internal/finance/handler.go:32:	group.GET("/invoices", h.listInvoices)
backend/internal/finance/handler.go:33:	group.POST("/invoices", h.createInvoice)
backend/internal/finance/handler.go:34:	group.GET("/invoices/:invoiceID", h.getInvoice)
backend/internal/finance/handler.go:35:	group.PUT("/invoices/:invoiceID", h.updateInvoice)
backend/internal/finance/handler.go:36:	group.DELETE("/invoices/:invoiceID", h.deleteInvoice)
backend/internal/finance/handler.go:38:	group.GET("/recurring-invoices", h.listRecurringInvoices)
backend/internal/finance/handler.go:39:	group.POST("/recurring-invoices", h.createRecurringInvoice)
backend/internal/finance/handler.go:40:	group.GET("/recurring-invoices/:recurringID", h.getRecurringInvoice)
backend/internal/finance/handler.go:41:	group.PUT("/recurring-invoices/:recurringID", h.updateRecurringInvoice)
backend/internal/finance/handler.go:42:	group.DELETE("/recurring-invoices/:recurringID", h.deleteRecurringInvoice)
backend/internal/finance/handler.go:44:	group.GET("/export-oasis", h.exportOasis)
backend/internal/finance/handler.go:45:	group.GET("/export-oasis/csv", h.exportOasisCSV)
backend/internal/finance/handler.go:46:	group.GET("/portfolio", h.getPortfolio)
backend/internal/hr/handler.go:20:	group.GET("/employees", h.listEmployees)
backend/internal/hr/handler.go:21:	group.POST("/employees", h.createEmployee)
backend/internal/hr/handler.go:22:	group.PATCH("/employees/soft-delete", h.softDeleteEmployees)
backend/internal/hr/handler.go:23:	group.GET("/employees/:employeeID", h.getEmployee)
backend/internal/hr/handler.go:24:	group.PUT("/employees/:employeeID", h.updateEmployee)
backend/internal/hr/handler.go:25:	group.POST("/employees/:employeeID/reset-password", h.resetEmployeePassword)
backend/internal/hr/handler.go:26:	group.GET("/employees/:employeeID/documents", h.listEmployeeDocuments)
backend/internal/hr/handler.go:27:	group.POST("/employees/:employeeID/documents", h.createEmployeeDocument)
backend/internal/hr/handler.go:28:	group.GET("/employees/:employeeID/documents/:documentID/download", h.downloadEmployeeDocument)
backend/internal/hr/handler.go:29:	group.DELETE("/employees/:employeeID/documents/:documentID", h.deleteEmployeeDocument)
backend/internal/hr/handler.go:31:	group.GET("/positions", h.listPositions)
backend/internal/hr/handler.go:32:	group.POST("/positions", h.createPosition)
backend/internal/hr/handler.go:33:	group.DELETE("/positions/:id", h.deletePosition)
backend/internal/hr/handler.go:34:	group.POST("/positions/restore-defaults", h.restoreDefaultPositions)
backend/internal/hr/handler.go:36:	group.GET("/departments", h.listDepartments)
backend/internal/hr/handler.go:37:	group.POST("/departments", h.createDepartment)
backend/internal/hr/handler.go:38:	group.DELETE("/departments/:id", h.deleteDepartment)
backend/internal/hr/handler.go:39:	group.POST("/departments/restore-defaults", h.restoreDefaultDepartments)
backend/internal/hr/handler.go:41:	group.POST("/catalogs/sync", h.syncCatalogs)
backend/internal/hr/handler.go:42:	group.POST("/catalogs/restore-defaults", h.restoreCatalogsDefaults)
backend/internal/inventory/handler.go:21:	group.GET("", h.getFullState)
backend/internal/inventory/handler.go:22:	group.GET("/config", h.getConfig)
backend/internal/inventory/handler.go:23:	group.PUT("/config/max-reserve-days", h.setMaxReserveDays)
backend/internal/inventory/handler.go:25:	group.GET("/references", h.listReferences)
backend/internal/inventory/handler.go:26:	group.GET("/references/:reference", h.getReference)
backend/internal/inventory/handler.go:27:	group.POST("/references", h.createReference)
backend/internal/inventory/handler.go:28:	group.GET("/references/duplicates/check", h.checkDuplicates)
backend/internal/inventory/handler.go:30:	group.POST("/stock-entry", h.registerStockEntry)
backend/internal/inventory/handler.go:32:	group.GET("/movements", h.listMovements)
backend/internal/inventory/handler.go:33:	group.POST("/movements", h.submitMovement)
backend/internal/inventory/handler.go:35:	group.GET("/adjustment-requests", h.listAdjustmentRequests)
backend/internal/inventory/handler.go:36:	group.POST("/adjustment-requests", h.createAdjustmentRequest)
backend/internal/inventory/handler.go:37:	group.POST("/adjustment-requests/:id/approve", h.approveMovementRequest)
backend/internal/inventory/handler.go:39:	group.GET("/reservations", h.listReservations)
backend/internal/inventory/handler.go:40:	group.POST("/reservations", h.createReservation)
backend/internal/inventory/handler.go:41:	group.POST("/reservations/:id/release", h.releaseReservation)
backend/internal/inventory/handler.go:42:	group.POST("/reservations/:id/extend", h.extendReservation)
backend/internal/inventory/handler.go:43:	group.POST("/reservations/:id/consume", h.consumeReservation)
backend/internal/inventory/handler.go:44:	group.POST("/reservations/refresh-expired", h.refreshExpiredReservations)
backend/internal/inventory/handler.go:46:	group.GET("/replenishment", h.listReplenishmentItems)
backend/internal/inventory/handler.go:47:	group.POST("/replenishment/attempt", h.registerReplenishmentAttempt)
backend/internal/inventory/handler.go:48:	group.POST("/replenishment/:reference/mark-obsolete", h.markReplenishmentObsolete)
backend/internal/inventory/handler.go:49:	group.POST("/replenishment/rebuild", h.rebuildReplenishmentItems)
backend/internal/inventory/handler.go:51:	group.GET("/purchase-lines", h.listPurchaseLines)
backend/internal/inventory/handler.go:52:	group.POST("/purchase-lines", h.createPurchaseLine)
backend/internal/inventory/handler.go:53:	group.POST("/purchase-lines/generate", h.generatePurchaseLines)
backend/internal/inventory/handler.go:54:	group.PATCH("/purchase-lines/:id", h.updatePurchaseLine)
backend/internal/inventory/handler.go:55:	group.POST("/purchase-lines/:id/send", h.markPurchaseLineSent)
backend/internal/inventory/handler.go:56:	group.POST("/purchase-lines/:id/close", h.closePurchaseLine)
backend/internal/inventory/handler.go:58:	group.GET("/weekly-snapshots", h.listWeeklySnapshots)
backend/internal/inventory/handler.go:59:	group.POST("/weekly-snapshots/generate", h.generateWeeklySnapshot)
backend/internal/inventory/handler.go:61:	group.GET("/bags", h.listBagTraces)
backend/internal/inventory/handler.go:62:	group.POST("/bags/receive", h.receiveTechnicianBag)
backend/internal/inventory/handler.go:63:	group.POST("/bags/:id/release", h.releaseTechnicianBag)
backend/internal/inventory/handler.go:65:	group.GET("/sessions", h.listSessions)
backend/internal/inventory/handler.go:66:	group.POST("/sessions", h.createSession)
backend/internal/inventory/handler.go:67:	group.POST("/sessions/:id/open", h.openSession)
backend/internal/inventory/handler.go:68:	group.POST("/sessions/:id/close", h.closeSession)
backend/internal/inventory/handler.go:70:	group.GET("/discrepancies", h.listDiscrepancies)
backend/internal/inventory/handler.go:71:	group.POST("/discrepancies/:id/approve", h.approveDiscrepancy)
backend/internal/inventory/handler.go:73:	group.GET("/audit", h.listAuditTrail)
backend/internal/inventory/handler.go:76:	group.GET("/purchase-requests", h.listPurchaseRequests)
backend/internal/inventory/handler.go:77:	group.POST("/purchase-requests", h.createPurchaseRequest)
backend/internal/inventory/handler.go:78:	group.POST("/purchase-requests/:id/review", h.reviewPurchaseRequest)
backend/internal/inventory/handler.go:81:	group.GET("/purchase-lines/consolidate", h.consolidatePurchaseLines)
backend/internal/inventory/handler.go:84:	group.POST("/purchase-lines/:id/approve", h.approvePurchaseLine)
backend/internal/inventory/handler.go:85:	group.POST("/purchase-lines/:id/reject", h.rejectPurchaseLine)
backend/internal/inventory/handler.go:88:	group.POST("/purchase-lines/:id/link-order", h.linkPurchaseLineToOrder)
backend/internal/projects/handler.go:24:	group.GET("", h.listProjects)
backend/internal/projects/handler.go:25:	group.POST("", h.createProject)
backend/internal/projects/handler.go:26:	group.GET("/:projectID", h.getProject)
backend/internal/projects/handler.go:27:	group.PUT("/:projectID", h.updateProject)
backend/internal/projects/handler.go:28:	group.POST("/:projectID/diagnosis/close", h.closeDiagnosis)
backend/internal/projects/handler.go:29:	group.GET("/sla-config", h.getSLAConfig)
backend/internal/projects/handler.go:30:	group.PUT("/sla-config", h.updateSLAConfig)
backend/internal/projects/handler.go:31:	group.GET("/notifications", h.listNotifications)
backend/internal/projects/handler.go:32:	group.POST("/notifications", h.createNotification)
backend/internal/projects/handler.go:33:	group.PATCH("/notifications/:notificationID/read", h.markNotificationRead)
backend/internal/projects/handler.go:34:	group.GET("/technical-reports", h.listTechnicalReports)
backend/internal/projects/handler.go:35:	group.POST("/technical-reports", h.createTechnicalReport)
backend/internal/remissions/handler.go:19:	group.GET("/remissions", h.listRemissions)
backend/internal/remissions/handler.go:20:	group.POST("/remissions", h.createRemission)
backend/internal/remissions/handler.go:21:	group.GET("/remissions/:remissionID", h.getRemission)
backend/internal/remissions/handler.go:22:	group.PUT("/remissions/:remissionID", h.updateRemission)
backend/internal/remissions/handler.go:23:	group.PATCH("/remissions/:remissionID/delivery-status", h.updateDeliveryStatus)
backend/internal/remissions/handler.go:24:	group.DELETE("/remissions/:remissionID", h.deleteRemission)
backend/internal/search/handler.go:21:	group.GET("/search", h.search)
backend/internal/search/handler.go:22:	group.POST("/search/index/:type", h.indexDocuments)
backend/internal/search/handler.go:23:	group.POST("/search/reindex", h.reindex)
backend/internal/security/handler.go:20:	group.GET("/restrictions", h.listRules)
backend/internal/security/handler.go:21:	group.PUT("/restrictions", h.replaceRules)
backend/internal/suppliers/handler.go:22:	group.GET("", h.listSuppliers)
backend/internal/suppliers/handler.go:23:	group.POST("", h.createSupplier)
backend/internal/suppliers/handler.go:24:	group.GET("/:id", h.getSupplier)
backend/internal/suppliers/handler.go:25:	group.PUT("/:id", h.updateSupplier)
backend/internal/suppliers/handler.go:26:	group.DELETE("/:id", h.deleteSupplier)
backend/internal/suppliers/handler.go:28:	group.GET("/orders", h.listOrders)
backend/internal/suppliers/handler.go:29:	group.POST("/orders", h.createOrder)
backend/internal/suppliers/handler.go:30:	group.GET("/orders/:id", h.getOrder)
backend/internal/suppliers/handler.go:31:	group.PUT("/orders/:id", h.updateOrder)
backend/internal/suppliers/handler.go:32:	group.DELETE("/orders/:id", h.deleteOrder)
backend/internal/suppliers/handler.go:33:	group.POST("/orders/:id/trace", h.addOrderTrace)

## 5. ARCHIVOS BACKEND POR MODULO
backend/internal/acl/handler.go
backend/internal/acl/service.go
backend/internal/acl/service_default_roles.go
backend/internal/acl/service_modules.go
backend/internal/acl/service_permissions_catalog.go
backend/internal/acl/service_permissions_read.go
backend/internal/acl/service_permissions_shared.go
backend/internal/acl/service_permissions_update.go
backend/internal/acl/service_roles.go
backend/internal/acl/service_soft_delete.go
backend/internal/acl/service_static_data.go
backend/internal/acl/types.go
backend/internal/auth/handler.go
backend/internal/auth/service.go
backend/internal/auth/service_flows.go
backend/internal/auth/service_flows_helpers.go
backend/internal/auth/service_flows_password.go
backend/internal/auth/service_flows_read.go
backend/internal/auth/service_flows_validation.go
backend/internal/auth/types.go
backend/internal/auth/types_flows.go
backend/internal/calendar/handler.go
backend/internal/calendar/service.go
backend/internal/calendar/service_event_helpers.go
backend/internal/calendar/service_events.go
backend/internal/calendar/types.go
backend/internal/crm/equipment/handler.go
backend/internal/crm/equipment/insight_client.go
backend/internal/crm/equipment/service.go
backend/internal/crm/equipment/service_assignment.go
backend/internal/crm/equipment/service_attachments.go
backend/internal/crm/equipment/service_finalize.go
backend/internal/crm/equipment/service_insights.go
backend/internal/crm/equipment/service_items_summary.go
backend/internal/crm/equipment/service_record_match.go
backend/internal/crm/equipment/service_record_match_test.go
backend/internal/crm/equipment/service_record_normalize.go
backend/internal/crm/equipment/service_record_sql.go
backend/internal/crm/equipment/service_records.go
backend/internal/crm/equipment/types.go
backend/internal/crm/handler.go
backend/internal/crm/handler_attachments.go
backend/internal/crm/handler_catalogs.go
backend/internal/crm/handler_client_contacts.go
backend/internal/crm/handler_clients.go
backend/internal/crm/handler_clients_bulk.go
backend/internal/crm/handler_contacts.go
backend/internal/crm/handler_convert.go
backend/internal/crm/handler_followups.go
backend/internal/crm/handler_prospects.go
backend/internal/crm/quotes/handler.go
backend/internal/crm/quotes/service.go
backend/internal/crm/quotes/service_quotes_normalize.go
backend/internal/crm/quotes/service_quotes_read.go
backend/internal/crm/quotes/service_quotes_scan_sql.go
backend/internal/crm/quotes/service_quotes_write.go
backend/internal/crm/quotes/types.go
backend/internal/crm/service.go
backend/internal/crm/service_attachments.go
backend/internal/crm/service_branches.go
backend/internal/crm/service_catalog_crud.go
backend/internal/crm/service_catalog_helpers.go
backend/internal/crm/service_client_contacts.go
backend/internal/crm/service_client_contacts_test.go
backend/internal/crm/service_client_contacts_update_test.go
backend/internal/crm/service_clients_bulk.go
backend/internal/crm/service_clients_bulk_test.go
backend/internal/crm/service_clients_crud.go
backend/internal/crm/service_clients_helpers.go
backend/internal/crm/service_clients_insert.go
backend/internal/crm/service_clients_scan.go
backend/internal/crm/service_contacts.go
backend/internal/crm/service_convert.go
backend/internal/crm/service_followups.go
backend/internal/crm/service_prospects_crud.go
backend/internal/crm/service_prospects_delete.go
backend/internal/crm/service_prospects_helpers.go
backend/internal/crm/types.go
backend/internal/docs/handler.go
backend/internal/docs/service.go
backend/internal/docs/types.go
backend/internal/finance/handler.go
backend/internal/finance/handler_accounts.go
backend/internal/finance/handler_invoices.go
backend/internal/finance/handler_parse.go
backend/internal/finance/handler_payments.go
backend/internal/finance/handler_validation.go
backend/internal/finance/service.go
backend/internal/finance/service_accounts.go
backend/internal/finance/service_billing.go
backend/internal/finance/service_billing_normalize_invoice.go
backend/internal/finance/service_billing_normalize_recurring.go
backend/internal/finance/service_billing_recurring.go
backend/internal/finance/service_billing_scan.go
backend/internal/finance/service_normalize.go
backend/internal/finance/service_payments.go
backend/internal/finance/types.go
backend/internal/hr/handler.go
backend/internal/hr/handler_documents.go
backend/internal/hr/handler_employees.go
backend/internal/hr/service.go
backend/internal/hr/service_catalogs_core.go
backend/internal/hr/service_catalogs_crud.go
backend/internal/hr/service_defaults.go
backend/internal/hr/service_documents.go
backend/internal/hr/service_documents_test.go
backend/internal/hr/service_employees.go
backend/internal/hr/service_employees_photo.go
backend/internal/hr/service_employees_photo_test.go
backend/internal/hr/service_employees_profile.go
backend/internal/hr/service_employees_profile_test.go
backend/internal/hr/service_employees_reset.go
backend/internal/hr/service_employees_reset_test.go
backend/internal/hr/service_employees_test.go
backend/internal/hr/service_employees_update.go
backend/internal/hr/service_employees_update_test.go
backend/internal/hr/types.go
backend/internal/hr/types_documents.go
backend/internal/inventory/handler.go
backend/internal/inventory/purchase_lines_update_test.go
backend/internal/inventory/service.go
backend/internal/inventory/service_purchase_lines_update.go
backend/internal/inventory/service_test.go
backend/internal/inventory/types.go
backend/internal/platform/company/company.go
backend/internal/platform/database/database.go
backend/internal/platform/database/migrations_acl_security.go
backend/internal/platform/database/migrations_all.go
backend/internal/platform/database/migrations_auth_flows.go
backend/internal/platform/database/migrations_compras_gaps.go
backend/internal/platform/database/migrations_crm_attachments.go
backend/internal/platform/database/migrations_crm_branches.go
backend/internal/platform/database/migrations_crm_catalogs_prospects.go
backend/internal/platform/database/migrations_crm_client_contacts.go
backend/internal/platform/database/migrations_crm_clients_contacts.go
backend/internal/platform/database/migrations_crm_contacts.go
backend/internal/platform/database/migrations_crm_equipment_prospect_id.go
backend/internal/platform/database/migrations_crm_equipment_quotes.go
backend/internal/platform/database/migrations_crm_followups.go
backend/internal/platform/database/migrations_finance_calendar.go
backend/internal/platform/database/migrations_hr.go
backend/internal/platform/database/migrations_inventory.go
backend/internal/platform/database/migrations_projects.go
backend/internal/platform/database/migrations_purchase_lines_equipment.go
backend/internal/platform/database/migrations_purchase_lines_fields.go
backend/internal/platform/database/migrations_remissions.go
backend/internal/platform/database/migrations_suppliers.go
backend/internal/projects/handler.go
backend/internal/projects/service.go
backend/internal/projects/sla_config_test.go
backend/internal/projects/types.go
backend/internal/remissions/handler.go
backend/internal/remissions/service.go
backend/internal/remissions/service_db_test.go
backend/internal/remissions/service_test.go
backend/internal/remissions/service_update.go
backend/internal/remissions/types.go
backend/internal/search/analyzer.go
backend/internal/search/engine.go
backend/internal/search/handler.go
backend/internal/search/service.go
backend/internal/security/handler.go
backend/internal/security/middleware.go
backend/internal/security/service.go
backend/internal/security/service_evaluate.go
backend/internal/security/service_normalize.go
backend/internal/security/service_rules_read.go
backend/internal/security/service_rules_write.go
backend/internal/security/types.go
backend/internal/suppliers/handler.go
backend/internal/suppliers/service.go
backend/internal/suppliers/service_test.go
backend/internal/suppliers/types.go
