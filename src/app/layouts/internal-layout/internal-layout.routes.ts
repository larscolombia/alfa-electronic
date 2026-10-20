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
