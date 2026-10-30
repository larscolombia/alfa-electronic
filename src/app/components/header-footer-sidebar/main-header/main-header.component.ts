import { Component, HostListener, OnInit, Renderer2, Inject, ChangeDetectorRef } from "@angular/core";
import { DOCUMENT } from "@angular/common";
import { NavigationEnd, Router, RouterLink } from "@angular/router";
import { AuthService } from "../../../services/auth.service";

@Component({
    selector: "app-main-header",
    standalone: true,
    imports: [RouterLink],
    template: `
        <!-- Fixed navbar -->
        <nav class="navbar navbar-expand-lg fixed-top">
            <div class="container-fluid">
                <div class="pika-left-rail">
                    @if (showGlobalBackButton) {
                        <button class="btn btn-outline-secondary btn-sm pika-rail-back"
                                type="button"
                                (click)="goBack()"
                                title="Volver"
                                aria-label="Volver">
                            <i class="bi bi-arrow-left me-1"></i>Volver
                        </button>
                    }

                    <a class="navbar-brand pika-rail-logo"
                       routerLink="/app/dashboard"
                       aria-label="PIKA OS - Inicio">
                        <img src="assets/img/logo-pika.png" alt="PIKA OS" class="logo-pika" />
                    </a>

                    @if (!isClientsPage) {
                        <a class="btn btn-link btn-square btn-icon btn-link-header pika-rail-menu"
                           routerLink="/app/main-menu"
                           title="Menú principal"
                           aria-label="Menú principal">
                            <i class="bi bi-grid-3x3-gap-fill"></i>
                        </a>
                    }

                    @if (isClientsPage) {
                        <div class="d-flex align-items-center gap-2 ms-3" style="white-space:nowrap;">
                            <a class="btn btn-link btn-square btn-icon btn-link-header pika-rail-menu"
                               routerLink="/app/main-menu"
                               title="Menú principal"
                               aria-label="Menú principal">
                                <i class="bi bi-grid-3x3-gap-fill"></i>
                            </a>
                            <div class="d-flex flex-column justify-content-center">
                                <h1 style="font-size:1rem; font-weight:600; line-height:1.25; margin:0;">Clientes</h1>
                                <p class="text-secondary" style="font-size:0.75rem; line-height:1.25; margin:0;">Gestion centralizada de cuentas y datos empresariales.</p>
                            </div>
                        </div>
                    }
                </div>
                @if (showProspectsBackButton) {
                    <div class="pika-page-heading" style="display:flex; flex-direction:column; justify-content:center; gap:0; min-width:0; margin-left:0.5rem;">
                        <h1 style="font-size:1rem; font-weight:600; line-height:1.25; margin:0;">{{ isQuotesPage ? 'Cotizaciones' : 'Prospectos' }}</h1>
                        <p class="text-secondary" style="font-size:0.75rem; line-height:1.25; margin:0;">{{ isQuotesPage ? 'Genera y administra cotizaciones para prospectos usando servicios.' : 'Administra tus prospectos y tu seguimiento comercial.' }}</p>
                    </div>
                }

                @if (isInventoryStockPage) {
    <div class="pika-page-heading" style="display:flex; flex-direction:column; justify-content:center; gap:0; min-width:0; margin-left:0.5rem;">
        <h1 style="font-size:1rem; font-weight:600; line-height:1.25; margin:0;">Inventario - Stock y fichas</h1>
        <p class="text-secondary" style="font-size:0.75rem; line-height:1.25; margin:0;">Crea fichas nuevas o registra entradas a referencias existentes.</p>
    </div>
}

            @if (isInventoryMovementsPage) {
    <div class="pika-page-heading" style="display:flex; flex-direction:column; justify-content:center; gap:0; min-width:0; margin-left:0.5rem;">
        <h1 style="font-size:1rem; font-weight:600; line-height:1.25; margin:0;">Movimientos de inventario</h1>
        <p class="text-secondary" style="font-size:0.75rem; line-height:1.25; margin:0;">Rol actual: <strong>Responsable de inventario</strong></p>
    </div>
}

            @if (isInventoryOrdersPage) {
    <div class="pika-page-heading" style="display:flex; flex-direction:column; justify-content:center; gap:0; min-width:0; margin-left:0.5rem;">
        <h1 style="font-size:1rem; font-weight:600; line-height:1.25; margin:0;">Inventario - Cantidad insuficiente y reposicion</h1>
        <p class="text-secondary" style="font-size:0.75rem; line-height:1.25; margin:0;">Priorizacion por antiguedad y trazabilidad de intentos de compra para evitar rezagos de meses.</p>
    </div>
}

            @if (isInventoryReconciliationPage) {
    <div class="pika-page-heading" style="display:flex; flex-direction:column; justify-content:center; gap:0; min-width:0; margin-left:0.5rem;">
        <h1 style="font-size:1rem; font-weight:600; line-height:1.25; margin:0;">Inventario - Conciliacion anual y auditoria</h1>
        <p class="text-secondary" style="font-size:0.75rem; line-height:1.25; margin:0;">Cierre de inventario fisico vs sistema con evidencia de aprobacion por diferencia.</p>
    </div>
}

            @if (isInventoryReservationsPage) {
    <div class="pika-page-heading" style="display:flex; flex-direction:column; justify-content:center; gap:0; min-width:0; margin-left:0.5rem;">
        <h1 style="font-size:1rem; font-weight:600; line-height:1.25; margin:0;">Inventario - Reservas</h1>
        <p class="text-secondary" style="font-size:0.75rem; line-height:1.25; margin:0;">Control de reservas para evitar componentes congelados por tiempo indefinido.</p>
    </div>
}
@if (isFinanceDashboardPage) {
    <div class="pika-page-heading" style="display:flex; flex-direction:column; justify-content:center; gap:0; min-width:0; margin-left:0.5rem;">
        <h1 style="font-size:1rem; font-weight:600; line-height:1.25; margin:0;">Finance Dashboard</h1>
        <p class="text-secondary" style="font-size:0.75rem; line-height:1.25; margin:0;">Potential with Income and Expense Tracking</p>
    </div>
}
@if (isFinanceCuentasPage) {
    <div class="pika-page-heading" style="display:flex; flex-direction:column; justify-content:center; gap:0; min-width:0; margin-left:0.5rem;">
        <h1 style="font-size:1rem; font-weight:600; line-height:1.25; margin:0;">Cuentas</h1>
        <p class="text-secondary" style="font-size:0.75rem; line-height:1.25; margin:0;">Administra cuentas bancarias y cuentas de efectivo para operacion financiera.</p>
    </div>
}
@if (isFinancePagosPage) {
    <div class="pika-page-heading" style="display:flex; flex-direction:column; justify-content:center; gap:0; min-width:0; margin-left:0.5rem;">
        <h1 style="font-size:1rem; font-weight:600; line-height:1.25; margin:0;">Pagos</h1>
        <p class="text-secondary" style="font-size:0.75rem; line-height:1.25; margin:0;">Gestiona cobros asociados a facturas y controla el estado de recaudo.</p>
    </div>
}
@if (isFinanceFacturacionPage) {
    <div class="pika-page-heading" style="display:flex; flex-direction:column; justify-content:center; gap:0; min-width:0; margin-left:0.5rem;">
        <h1 style="font-size:1rem; font-weight:600; line-height:1.25; margin:0;">Facturación</h1>
        <p class="text-secondary" style="font-size:0.75rem; line-height:1.25; margin:0;">Administra facturas emitidas, recurrentes y conversion de horas a cobro.</p>
    </div>
}
@if (isFinanceRecurringInvoicesPage) {
    <div class="pika-page-heading" style="display:flex; flex-direction:column; justify-content:center; gap:0; min-width:0; margin-left:0.5rem;">
        <h1 style="font-size:1rem; font-weight:600; line-height:1.25; margin:0;">Facturas recurrentes</h1>
        <p class="text-secondary" style="font-size:0.75rem; line-height:1.25; margin:0;">Programa cobros automáticos y monitorea próximas emisiones.</p>
    </div>
}
@if (isFinanceCreditClientsPage) {
    <div class="pika-page-heading" style="display:flex; flex-direction:column; justify-content:center; gap:0; min-width:0; margin-left:0.5rem;">
        <h1 style="font-size:1rem; font-weight:600; line-height:1.25; margin:0;">Clientes a crédito</h1>
        <p class="text-secondary" style="font-size:0.75rem; line-height:1.25; margin:0;">Asigna cupos de crédito y controla consumo y mora por cliente.</p>
    </div>
}
@if (isFinanceGarantiasPage) {
    <div class="pika-page-heading" style="display:flex; flex-direction:column; justify-content:center; gap:0; min-width:0; margin-left:0.5rem;">
        <h1 style="font-size:1rem; font-weight:600; line-height:1.25; margin:0;">Garantias</h1>
        <p class="text-secondary" style="font-size:0.75rem; line-height:1.25; margin:0;">Ciclo de garantias y seguimiento por vencimiento de servicios y equipos.</p>
    </div>
}
@if (isCompanyHrDashboardPage) {
    <div class="pika-page-heading" style="display:flex; flex-direction:column; justify-content:center; gap:0; min-width:0; margin-left:0.5rem;">
        <h1 style="font-size:1rem; font-weight:600; line-height:1.25; margin:0;">Recursos Humanos</h1>
        <p class="text-secondary" style="font-size:0.75rem; line-height:1.25; margin:0;">Vista general del modulo de talento humano</p>
    </div>
}
@if (isCompanyHrEmployeesPage) {
    <div class="pika-page-heading" style="display:flex; flex-direction:column; justify-content:center; gap:0; min-width:0; margin-left:0.5rem;">
        <h1 style="font-size:1rem; font-weight:600; line-height:1.25; margin:0;">RRHH - Empleados</h1>
        <p class="text-secondary" style="font-size:0.75rem; line-height:1.25; margin:0;">Gestion de fichas maestras y catalogos organizacionales</p>
    </div>
}
@if (isWorkWorkloadPage) {
    <div class="pika-page-heading" style="display:flex; flex-direction:column; justify-content:center; gap:0; min-width:0; margin-left:0.5rem;">
        <h1 style="font-size:1rem; font-weight:600; line-height:1.25; margin:0;">Trabajo - Carga laboral</h1>
        <p class="text-secondary" style="font-size:0.75rem; line-height:1.25; margin:0;">Carga operativa basada en el flujo tecnico configurado y los proyectos reales del tablero.</p>
    </div>
}
@if (isCompanyHrCompensationPage) {
    <div class="pika-page-heading" style="display:flex; flex-direction:column; justify-content:center; gap:0; min-width:0; margin-left:0.5rem;">
        <h1 style="font-size:1rem; font-weight:600; line-height:1.25; margin:0;">RRHH - Nomina y compensacion</h1>
        <p class="text-secondary" style="font-size:0.75rem; line-height:1.25; margin:0;">Liquidacion mock por empleado con costo prestacional e integral</p>
    </div>
}
@if (isCompanyHrWorktimePage) {
    <div class="pika-page-heading" style="display:flex; flex-direction:column; justify-content:center; gap:0; min-width:0; margin-left:0.5rem;">
        <h1 style="font-size:1rem; font-weight:600; line-height:1.25; margin:0;">RRHH - Horarios y festivos</h1>
        <p class="text-secondary" style="font-size:0.75rem; line-height:1.25; margin:0;">Configuracion de jornada laboral y calendario anual</p>
    </div>
}
@if (isCompanyHrHealthPage) {
    <div class="pika-page-heading" style="display:flex; flex-direction:column; justify-content:center; gap:0; min-width:0; margin-left:0.5rem;">
        <h1 style="font-size:1rem; font-weight:600; line-height:1.25; margin:0;">RRHH - Salud ocupacional</h1>
        <p class="text-secondary" style="font-size:0.75rem; line-height:1.25; margin:0;">Seguimiento de examenes y datos medicos sensibles</p>
    </div>
}
@if (isCompanyHrLeavesPage) {
    <div class="pika-page-heading" style="display:flex; flex-direction:column; justify-content:center; gap:0; min-width:0; margin-left:0.5rem;">
        <h1 style="font-size:1rem; font-weight:600; line-height:1.25; margin:0;">RRHH - Vacaciones y licencias</h1>
        <p class="text-secondary" style="font-size:0.75rem; line-height:1.25; margin:0;">Solicitud y aprobacion de ausencias del colaborador</p>
    </div>
}
@if (isCompanyHrDocumentsPage) {
    <div class="pika-page-heading" style="display:flex; flex-direction:column; justify-content:center; gap:0; min-width:0; margin-left:0.5rem;">
        <h1 style="font-size:1rem; font-weight:600; line-height:1.25; margin:0;">RRHH - Documentos</h1>
        <p class="text-secondary" style="font-size:0.75rem; line-height:1.25; margin:0;">Control de hoja de vida y soportes por empleado</p>
    </div>
}
@if (isCompanyHrAuditPage) {
    <div class="pika-page-heading" style="display:flex; flex-direction:column; justify-content:center; gap:0; min-width:0; margin-left:0.5rem;">
        <h1 style="font-size:1rem; font-weight:600; line-height:1.25; margin:0;">RRHH - Auditoria</h1>
        <p class="text-secondary" style="font-size:0.75rem; line-height:1.25; margin:0;">Bitacora de eventos y cambios en informacion de talento humano</p>
    </div>
}
@if (isSuppliersDashboardPage) {
    <div class="pika-page-heading" style="display:flex; flex-direction:column; justify-content:center; gap:0; min-width:0; margin-left:0.5rem;">
        <h1 style="font-size:1rem; font-weight:600; line-height:1.25; margin:0;">Proveedores - Dashboard</h1>
        <p class="text-secondary" style="font-size:0.75rem; line-height:1.25; margin:0;">Monitorea confiabilidad, clasificacion ABCD y desempeno operativo de proveedores.</p>
    </div>
}
@if (isSuppliersCrudPage) {
    <div class="pika-page-heading" style="display:flex; flex-direction:column; justify-content:center; gap:0; min-width:0; margin-left:0.5rem;">
        <h1 style="font-size:1rem; font-weight:600; line-height:1.25; margin:0;">Proveedores - CRUD</h1>
        <p class="text-secondary" style="font-size:0.75rem; line-height:1.25; margin:0;">Ficha maestra de proveedores con informacion legal, contable, contacto y calidad.</p>
    </div>
}
@if (isSuppliersOrdersHistoryPage) {
    <div class="pika-page-heading" style="display:flex; flex-direction:column; justify-content:center; gap:0; min-width:0; margin-left:0.5rem;">
        <h1 style="font-size:1rem; font-weight:600; line-height:1.25; margin:0;">Proveedores - Historial de pedidos</h1>
        <p class="text-secondary" style="font-size:0.75rem; line-height:1.25; margin:0;">Consulta compras por proveedor con foco en reparacion de placas y componentes electronicos.</p>
    </div>
}
@if (isCompanyUserRolesPage) {
    <div class="pika-page-heading" style="display:flex; flex-direction:column; justify-content:center; gap:0; min-width:0; margin-left:0.5rem;">
        <h1 style="font-size:1rem; font-weight:600; line-height:1.25; margin:0;">Roles de usuario</h1>
        <p class="text-secondary" style="font-size:0.75rem; line-height:1.25; margin:0;">Administra a tus usuarios y el acceso asignando roles</p>
    </div>
}
@if (isCompanyProfilePage) {
    <div class="pika-page-heading" style="display:flex; flex-direction:column; justify-content:center; gap:0; min-width:0; margin-left:0.5rem;">
        <h1 style="font-size:1rem; font-weight:600; line-height:1.25; margin:0;">Perfil de la empresa</h1>
        <p class="text-secondary" style="font-size:0.75rem; line-height:1.25; margin:0;">Estos datos se muestran en las cotizaciones, en las facturas impresas y en el navegador.</p>
    </div>
}
@if (isInventoryDashboardPage) {
                    <div class="pika-page-heading" style="display:flex; flex-direction:column; justify-content:center; gap:0; min-width:0; margin-left:0.5rem;">
                        <h1 style="font-size:1rem; font-weight:600; line-height:1.25; margin:0;">Inventario - Centro de control tecnico</h1>
                        <p class="text-secondary" style="font-size:0.75rem; line-height:1.25; margin:0;">Vista ejecutiva del plan acordado en la reunion del 30-mar para evitar reservas indefinidas, errores de captura y faltantes cronicos.</p>
                    </div>
                }

                @if (isWorkTimesheetPage) {
                    <div class="pika-page-heading" style="display:flex; flex-direction:column; justify-content:center; gap:0; min-width:0; margin-left:0.5rem;">
                        <h1 style="font-size:1rem; font-weight:600; line-height:1.25; margin:0;">Trabajo - Hoja de tiempo</h1>
                        <p class="text-secondary" style="font-size:0.75rem; line-height:1.25; margin:0;">Registra tiempo por proyecto y visualiza uso real de la plataforma por página.</p>
                    </div>
                }

                <!-- menu -->
                <div class="navbar-expand-xl d-none d-xl-block ms-3">
                    <div class="collapse navbar-collapse" id="mainheaderNavbar">
                        <ul class="navbar-nav">
                            <li class="nav-item dropdown">
                                
                                <div class="dropdown-menu">
                                    <div><a class="dropdown-item" routerLink="/app/profile-professional">Profile</a></div>
                                    <div class="dropend">
                                        <a class="dropdown-item" data-bs-toggle="dropdown" aria-expanded="false" role="button" data-bs-auto-close="outside"> Company <span class="arrow bi bi-chevron-right"></span> </a>
                                        <div class="dropdown-menu">
                                            <div><a class="dropdown-item active" routerLink="/app/company-profile">Company Profile</a></div>
                                            <div><a class="dropdown-item" routerLink="/app/company-user-roles">User Roles </a></div>
                                            <div><a class="dropdown-item" routerLink="/app/company-resources">Resources</a></div>
                                        </div>
                                    </div>
                                    <div class="dropend">
                                        <a class="dropdown-item" data-bs-toggle="dropdown" aria-expanded="false" role="button" data-bs-auto-close="outside"> Proveedores <span class="arrow bi bi-chevron-right"></span> </a>
                                        <div class="dropdown-menu">
                                            <div><a class="dropdown-item" routerLink="/app/suppliers-dashboard">Dashboard</a></div>
                                            <div><a class="dropdown-item" routerLink="/app/suppliers-crud">CRUD</a></div>
                                            <div><a class="dropdown-item" routerLink="/app/suppliers-orders-history">Historial de pedidos</a></div>
                                        </div>
                                    </div>
                                    <div><a class="dropdown-item" routerLink="/app/company-management">Management</a></div>
                                    <div><a class="dropdown-item" routerLink="/app/company-career">Career</a></div>
                                    <div><a class="dropdown-item" routerLink="/app/forum">Forum</a></div>
                                    <div>
                                        <hr class="dropdown-divider" />
                                    </div>
                                    <div><a class="dropdown-item" routerLink="/app/company-help-center">Help Center</a></div>
                                    <div><a class="dropdown-item" routerLink="/auth/onboarding">Onboarding</a></div>
                                </div>
                            </li>
                            <li class="nav-item dropdown">
                                <div class="dropdown-menu width-300">
                                    <div class="dropdown-title mb-3 p-2">
                                        <p class="text-secondary small">Do not make your user lost somewhere else from where they can't come back. Make important journey flawless.</p>
                                    </div>
                                    <div class="row g-0">
                                        <div class="col-12 col-md-12 col-lg-6">
                                            <div>
                                                <a class="dropdown-item" routerLink="../auth/signin"><i class="bi bi-person me-2 text-theme-1"></i>Sign in</a>
                                            </div>
                                            <div>
                                                <a class="dropdown-item" routerLink="../auth/signup"><i class="bi bi-person-plus me-2 text-theme-1"></i>Sign up</a>
                                            </div>
                                            <div>
                                                <a class="dropdown-item" routerLink="../auth/forgot-password"><i class="bi bi-key me-2 text-theme-1"></i>Password</a>
                                            </div>
                                            <div>
                                                <a class="dropdown-item" routerLink="../under-construction"><i class="bi bi-gear me-2"></i>Maintenance</a>
                                            </div>
                                            <div>
                                                <a class="dropdown-item" routerLink="../coming-soon"><i class="bi bi-alarm me-2"></i>Coming Soon</a>
                                            </div>
                                        </div>
                                        <div class="col-12 col-md-12 col-lg-6">
                                            <div>
                                                <a class="dropdown-item" routerLink="../page-not-found-2"><i class="bi bi-bug me-2"></i>Error</a>
                                            </div>
                                            <div>
                                                <a class="dropdown-item" routerLink="../auth/onboarding"><i class="bi bi-emoji-smile me-2"></i>Onboarding</a>
                                            </div>
                                            <div>
                                                <a class="dropdown-item" routerLink="/app/contact-us"><i class="bi bi-envelope me-2"></i>Contact</a>
                                            </div>
                                            <div>
                                                <a class="dropdown-item" routerLink="/app/timeline"><i class="bi bi-calendar-week me-2"></i>Timeline</a>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </li>
                        </ul>
                    </div>
                </div>

                <!-- right icons button -->
                <div class="ms-auto header-actions">
                    <!-- global search toggle -->
                    <button class="btn btn-link btn-square btn-icon btn-link-header d-lg-none" type="button" (click)="toggleSearch()">
                        <i class="bi bi-search"></i>
                    </button>

                    <!-- dark mode -->
                    <button class="btn btn-link btn-square btnsunmoon btn-link-header" id="btn-layout-modes-dark-page" (click)="toggleDarkMode()">
                        <i class="sun mx-auto bi bi-sun"></i>
                        <i class="moon mx-auto bi bi-moon"></i>
                    </button>

                    <!-- application list dropdown -->
                    <div class="dropdown d-none d-sm-inline-block">
                        <button class="btn btn-link btn-square btn-icon btn-link-header dropdown-toggle no-caret" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                            <i class="bi bi-grid"></i>
                        </button>
                        <div class="dropdown-menu dropdown-menu-end width-300 pt-0 px-0 overflow-hidden">
                            <div class="p-3 rounded mb-2">
                                <h5 class="mb-0">Applications</h5>
                                <p class="text-secondary small">Make your app innovative</p>
                            </div>
                            <div class="px-2">
                                <div class="row g-2 text-center mb-2">
                                    <div class="col-4">
                                        <a class="dropdown-item square-item position-relative" routerLink="/app/finance-dashboard">
                                            <div class="avatar avatar-40 rounded my-2">
                                                <i class="bi bi-bank fs-5 mx-0"></i>
                                            </div>
                                            <p class="mb-0">Finance</p>
                                            <p class="fs-12 opacity-50 mb-2">Accounting</p>
                                        </a>
                                    </div>
                                    <div class="col-4">
                                        <a class="dropdown-item square-item position-relative" routerLink="/app/network-dashboard">
                                            <div class="avatar avatar-40 rounded my-2">
                                                <i class="bi bi-globe fs-5 mx-0"></i>
                                            </div>
                                            <p class="mb-0">Network</p>
                                            <p class="fs-12 opacity-50 mb-2">Stabilize</p>
                                        </a>
                                    </div>
                                    <div class="col-4">
                                        <a class="dropdown-item square-item position-relative" routerLink="/app/inventory-dashboard">
                                            <div class="avatar avatar-40 rounded my-2">
                                                <i class="bi bi-box fs-5 mx-0"></i>
                                            </div>
                                            <p class="mb-0">Inventory</p>
                                            <p class="fs-12 opacity-50 mb-2">Assuring</p>
                                        </a>
                                    </div>
                                    <div class="col-4">
                                        <a class="dropdown-item square-item position-relative" routerLink="/app/project-dashboard">
                                            <div class="avatar avatar-40 rounded my-2">
                                                <i class="bi bi-folder fs-5 mx-0"></i>
                                            </div>
                                            <p class="mb-0">Project</p>
                                            <p class="fs-12 opacity-50 mb-2">Management</p>
                                        </a>
                                    </div>
                                    <div class="col-4">
                                        <a class="dropdown-item square-item position-relative" routerLink="/app/social-dashboard">
                                            <div class="avatar avatar-40 rounded my-2">
                                                <i class="bi bi-people fs-5 mx-0"></i>
                                            </div>
                                            <p class="mb-0">Social</p>
                                            <p class="fs-12 opacity-50 mb-2">Tracking</p>
                                        </a>
                                    </div>
                                    <div class="col-4">
                                        <a class="dropdown-item square-item position-relative" routerLink="/app/learning-dashboard">
                                            <div class="avatar avatar-40 rounded my-2">
                                                <i class="bi bi-journal-bookmark fs-5 mx-0"></i>
                                            </div>
                                            <p class="mb-0">Learning</p>
                                            <p class="fs-12 opacity-50 mb-2">Make-easy</p>
                                        </a>
                                    </div>
                                </div>
                            </div>
                            <div class="text-center">
                                <a class="btn btn-link text-center" routerLink="/app/main-menu"> View all <i class="bi bi-arrow-right fs-14"></i> </a>
                            </div>
                        </div>
                    </div>

                    <!-- notification dropdown -->
                    <button class="btn btn-link btn-square btn-icon btn-link-header dropdown-toggle position-relative no-caret" type="button" data-bs-toggle="offcanvas" data-bs-target="#notification" aria-expanded="false">
                        <i class="bi bi-bell"></i>
                        <span class="position-absolute top-0 end-0 badge rounded-pill bg-danger p-1">
                            <small>9+</small>
                            <span class="visually-hidden">unread messages</span>
                        </span>
                    </button>

                    <!-- profile dropdown -->
                    <div class="dropdown d-inline-block">
                        <a class="dropdown-toggle btn btn-link btn-square btn-link-header style-none no-caret px-0" id="userprofiledd" data-bs-toggle="dropdown" aria-expanded="false" role="button">
                            <div class="row gx-0 d-inline-flex">
                                <div class="col-auto align-self-center">
                                    <figure class="avatar avatar-28 rounded-circle coverimg align-middle">
                                        <img src="assets/img/modern-ai-image/user-6.jpg" alt="" id="userphotoonboarding2" />
                                    </figure>
                                </div>
                            </div>
                        </a>
                        <div class="dropdown-menu dropdown-menu-end width-300 px-0 pt-0" aria-labelledby="userprofiledd">
                            <div class="p-3 rounded mb-2">
                                <a routerLink="/app/my-profile" class="dropdown-item">
                                    <div class="row gx-3">
                                        <div class="col-auto ">
                                            <figure class="avatar avatar-50 rounded-circle coverimg align-middle">
                                                <img src="assets/img/modern-ai-image/user-6.jpg" alt="" />
                                            </figure>
                                        </div>
                                        <div class="col align-self-center ">
                                            <h5 class="mb-1">AdminUIUX</h5>
                                            <p class="small"><i class="bi bi-trophy me-2"></i> 3 Courses</p>
                                        </div>
                                    </div>
                                </a>
                            </div>
                            <div class="px-2">
                                <div>
                                    <a class="dropdown-item" routerLink="/app/my-profile"><i class="avatar avatar-30 rounded-circle me-1 bi bi-person"></i> My Profile</a>
                                </div>
                                <div>
                                    <a class="dropdown-item" routerLink="/app/dashboard">
                                        <div class="row g-0">
                                            <div class="col align-self-center">
                                                <i class="avatar avatar-30 rounded-circle me-1 bi bi-layout-sidebar"></i>
                                                My Dashboard
                                            </div>
                                            <div class="col-auto avatar-group">
                                                <figure class="avatar avatar-20 coverimg rounded-circle">
                                                    <img src="assets/img/modern-ai-image/user-1.jpg" alt="" />
                                                </figure>
                                                <figure class="avatar avatar-20 coverimg rounded-circle">
                                                    <img src="assets/img/modern-ai-image/user-2.jpg" alt="" />
                                                </figure>
                                                <figure class="avatar avatar-20 coverimg rounded-circle">
                                                    <img src="assets/img/modern-ai-image/user-4.jpg" alt="" />
                                                </figure>
                                                <div class="avatar avatar-20 bg-theme-1 rounded-circle text-center align-middle">
                                                    <small class="fs-10 align-middle">9+</small>
                                                </div>
                                            </div>
                                        </div>
                                    </a>
                                </div>
                                <div>
                                    <a class="dropdown-item" routerLink="/app/my-earning"> <i class="avatar avatar-30 rounded-circle me-1 bi bi-cash-stack"></i> Earning </a>
                                </div>
                                <div>
                                    <a class="dropdown-item" routerLink="/app/my-subscription">
                                        <div class="row gx-3 gx-lg-4">
                                            <div class="col"><i class="avatar avatar-30 rounded-circle me-1 bi bi-gift"></i> Subscription</div>
                                            <div class="col-auto">
                                                <p class="small text-success">Upgrade</p>
                                            </div>
                                        </div>
                                    </a>
                                </div>
                                <div>
                                    <a class="dropdown-item" routerLink="/app/statement"> <i class="avatar avatar-30 rounded-circle me-1 bi bi-clipboard"></i> Statement </a>
                                </div>
                                <div>
                                    <a class="dropdown-item" routerLink="/app/account-settings"> <i class="avatar avatar-30 rounded-circle me-1 bi bi-gear"></i> Account Setting </a>
                                </div>
                                <div>
                                    <a class="dropdown-item theme-red" href="#" (click)="onLogout($event)"> <i class="avatar avatar-30 rounded-circle me-1 bi bi-power"></i> Logout </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </nav>

        <!-- search global wrap -->
        <div class="adminuiux-search-full">
            <div class="row gx-2 align-items-center">
                <div class="col-auto">
                    <!-- close global search toggle -->
                    <button class="btn btn-link btn-square " type="button" (click)="toggleSearch()">
                        <i class="bi bi-arrow-left"></i>
                    </button>
                </div>
                <div class="col">
                    <input class="form-control pe-0 border-0" type="search" placeholder="Type something here..." />
                </div>
                <div class="col-auto">
                    <!-- filter dropdown -->
                    <div class="dropdown input-group-text border-0 p-0">
                        <button class="dropdown-toggle btn btn-link btn-square no-caret" type="button" id="searchfilter2" data-bs-toggle="dropdown" aria-expanded="false">
                            <i class="bi bi-sliders2"></i>
                        </button>
                        <div class="dropdown-menu dropdown-menu-end dropdown-dontclose width-300">
                            <ul class="nav adminuiux-nav" id="searchtab2" role="tablist">
                                <li class="nav-item" role="presentation">
                                    <button class="nav-link active" id="searchall-tab2" data-bs-toggle="tab" data-bs-target="#searchall2" type="button" role="tab" aria-controls="searchall2" aria-selected="true">All</button>
                                </li>
                                <li class="nav-item" role="presentation">
                                    <button class="nav-link" id="searchorders-tab2" data-bs-toggle="tab" data-bs-target="#searchorders2" type="button" role="tab" aria-controls="searchorders2" aria-selected="false" tabindex="-1">Orders</button>
                                </li>
                                <li class="nav-item" role="presentation">
                                    <button class="nav-link" id="searchcontacts-tab2" data-bs-toggle="tab" data-bs-target="#searchcontacts2" type="button" role="tab" aria-controls="searchcontacts2" aria-selected="false" tabindex="-1">Contacts</button>
                                </li>
                            </ul>
                            <div class="tab-content py-3" id="searchtabContent2">
                                <div class="tab-pane fade active show" id="searchall2" role="tabpanel" aria-labelledby="searchall-tab2">
                                    <ul class="list-group adminuiux-list-group list-group-flush bg-none show">
                                        <li class="list-group-item">
                                            <div class="row gx-3 gx-lg-4">
                                                <div class="col">Search apps</div>
                                                <div class="col-auto">
                                                    <div class="form-check form-switch">
                                                        <input class="form-check-input" type="checkbox" role="switch" id="searchswitch1" />
                                                        <label class="form-check-label" for="searchswitch1"></label>
                                                    </div>
                                                </div>
                                            </div>
                                        </li>
                                        <li class="list-group-item">
                                            <div class="row gx-3 gx-lg-4">
                                                <div class="col">Include Pages</div>
                                                <div class="col-auto">
                                                    <div class="form-check form-switch">
                                                        <input class="form-check-input" type="checkbox" role="switch" id="searchswitch2" checked="" />
                                                        <label class="form-check-label" for="searchswitch2"></label>
                                                    </div>
                                                </div>
                                            </div>
                                        </li>
                                        <li class="list-group-item">
                                            <div class="row gx-3 gx-lg-4">
                                                <div class="col">Internet resource</div>
                                                <div class="col-auto">
                                                    <div class="form-check form-switch">
                                                        <input class="form-check-input" type="checkbox" role="switch" id="searchswitch3" checked="" />
                                                        <label class="form-check-label" for="searchswitch3"></label>
                                                    </div>
                                                </div>
                                            </div>
                                        </li>
                                        <li class="list-group-item">
                                            <div class="row gx-3 gx-lg-4">
                                                <div class="col">News and Blogs</div>
                                                <div class="col-auto">
                                                    <div class="form-check form-switch">
                                                        <input class="form-check-input" type="checkbox" role="switch" id="searchswitch4" />
                                                        <label class="form-check-label" for="searchswitch4"></label>
                                                    </div>
                                                </div>
                                            </div>
                                        </li>
                                    </ul>
                                </div>
                                <div class="tab-pane fade" id="searchorders2" role="tabpanel" aria-labelledby="searchorders-tab2">
                                    <ul class="list-group adminuiux-list-group list-group-flush bg-none show">
                                        <li class="list-group-item">
                                            <div class="row gx-3 gx-lg-4">
                                                <div class="col">Show order ID</div>
                                                <div class="col-auto">
                                                    <div class="form-check form-switch">
                                                        <input class="form-check-input" type="checkbox" role="switch" id="searchswitch5" />
                                                        <label class="form-check-label" for="searchswitch5"></label>
                                                    </div>
                                                </div>
                                            </div>
                                        </li>
                                        <li class="list-group-item">
                                            <div class="row gx-3 gx-lg-4">
                                                <div class="col">International Order</div>
                                                <div class="col-auto">
                                                    <div class="form-check form-switch">
                                                        <input class="form-check-input" type="checkbox" role="switch" id="searchswitch6" checked="" />
                                                        <label class="form-check-label" for="searchswitch6"></label>
                                                    </div>
                                                </div>
                                            </div>
                                        </li>
                                        <li class="list-group-item">
                                            <div class="row gx-3 gx-lg-4">
                                                <div class="col">Taxable Product</div>
                                                <div class="col-auto">
                                                    <div class="form-check form-switch">
                                                        <input class="form-check-input" type="checkbox" role="switch" id="searchswitch7" checked="" />
                                                        <label class="form-check-label" for="searchswitch7"></label>
                                                    </div>
                                                </div>
                                            </div>
                                        </li>
                                        <li class="list-group-item">
                                            <div class="row gx-3 gx-lg-4">
                                                <div class="col">Published Product</div>
                                                <div class="col-auto">
                                                    <div class="form-check form-switch">
                                                        <input class="form-check-input" type="checkbox" role="switch" id="searchswitch8" />
                                                        <label class="form-check-label" for="searchswitch8"></label>
                                                    </div>
                                                </div>
                                            </div>
                                        </li>
                                    </ul>
                                </div>
                                <div class="tab-pane fade" id="searchcontacts2" role="tabpanel" aria-labelledby="searchcontacts-tab2">
                                    <ul class="list-group adminuiux-list-group list-group-flush bg-none show">
                                        <li class="list-group-item">
                                            <div class="row gx-3 gx-lg-4">
                                                <div class="col">Have email ID</div>
                                                <div class="col-auto">
                                                    <div class="form-check form-switch">
                                                        <input class="form-check-input" type="checkbox" role="switch" id="searchswitch9" />
                                                        <label class="form-check-label" for="searchswitch9"></label>
                                                    </div>
                                                </div>
                                            </div>
                                        </li>
                                        <li class="list-group-item">
                                            <div class="row gx-3 gx-lg-4">
                                                <div class="col">Have phone number</div>
                                                <div class="col-auto">
                                                    <div class="form-check form-switch">
                                                        <input class="form-check-input" type="checkbox" role="switch" id="searchswitch10" checked="" />
                                                        <label class="form-check-label" for="searchswitch10"></label>
                                                    </div>
                                                </div>
                                            </div>
                                        </li>
                                        <li class="list-group-item">
                                            <div class="row gx-3 gx-lg-4">
                                                <div class="col">Photo available</div>
                                                <div class="col-auto">
                                                    <div class="form-check form-switch">
                                                        <input class="form-check-input" type="checkbox" role="switch" id="searchswitch11" checked="" />
                                                        <label class="form-check-label" for="searchswitch11"></label>
                                                    </div>
                                                </div>
                                            </div>
                                        </li>
                                        <li class="list-group-item">
                                            <div class="row gx-3 gx-lg-4">
                                                <div class="col">Referral</div>
                                                <div class="col-auto">
                                                    <div class="form-check form-switch">
                                                        <input class="form-check-input" type="checkbox" role="switch" id="searchswitch12" />
                                                        <label class="form-check-label" for="searchswitch12"></label>
                                                    </div>
                                                </div>
                                            </div>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                            <div class="">
                                <div class="row gx-3 gx-lg-4">
                                    <div class="col"><button class="btn btn-link">Reset</button></div>
                                    <div class="col-auto">
                                        <button class="btn btn-theme">Apply</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `,
})
export class MainHeaderComponent {
    htmlElement: any | null = null;
    buttonElement: any | null = null;

    private appNavigationHistory: string[] = [];
    private currentAppUrl = "";
    private navigatingBack = false;

    constructor(
        private renderer: Renderer2,
        @Inject(DOCUMENT) private document: Document,
        private authService: AuthService,
        private router: Router,
        private changeDetector: ChangeDetectorRef
    ) {
        this.router.events.subscribe(event => {
            if (!(event instanceof NavigationEnd)) return;

            const nextUrl = event.urlAfterRedirects.split("?")[0].split("#")[0].replace(/\/$/, "");

            if (!nextUrl.startsWith("/app/")) return;

            if (this.currentAppUrl && this.currentAppUrl !== nextUrl) {
                if (this.navigatingBack) {
                    this.navigatingBack = false;
                } else {
                    this.appNavigationHistory.push(this.currentAppUrl);
                }
            }

            this.currentAppUrl = nextUrl;
            this.changeDetector.markForCheck();
        });
    }

    get showGlobalBackButton(): boolean {
        const path = this.router.url.split("?")[0].split("#")[0].replace(/\/$/, "");
        return path.startsWith("/app/") && !path.startsWith("/app/main-menu");
    }

    get isQuotesPage(): boolean {
        return this.router.url.split("?")[0].split("#")[0].replace(/\/$/, "") === "/app/crm-cotizaciones";
    }

    get isClientsPage(): boolean {
        return this.router.url.split("?")[0].split("#")[0].replace(/\/$/, "") === "/app/crm-clientes";
    }

    get isRemissionsPage(): boolean {
        return this.router.url.split("?")[0].split("#")[0].replace(/\/$/, "") === "/app/remissions";
    }

    get isWorkTimesheetPage(): boolean {
        return this.router.url.split("?")[0].split("#")[0].replace(/\/$/, "") === "/app/work-timesheet";
    }

    get isInventoryStockPage(): boolean {
    return this.router.url.split("?")[0].split("#")[0].replace(/\/$/, "") === "/app/inventory-stock";
}

    get isInventoryMovementsPage(): boolean {
    return this.router.url.split("?")[0].split("#")[0].replace(/\/$/, "") === "/app/inventory-movements";
}

    get isInventoryOrdersPage(): boolean {
    return this.router.url.split("?")[0].split("#")[0].replace(/\/$/, "") === "/app/inventory-orders";
}

    get isInventoryReconciliationPage(): boolean {
    return this.router.url.split("?")[0].split("#")[0].replace(/\/$/, "") === "/app/inventory-order-details";
}

    get isInventoryReservationsPage(): boolean {
        return this.router.url.split("?")[0].split("#")[0].replace(/\/$/, "") === "/app/inventory-reservations";
    }

    get isFinanceDashboardPage(): boolean {
        return this.router.url.split("?")[0].split("#")[0].replace(/\/$/, "") === "/app/finance-dashboard";
    }

    get isFinanceCuentasPage(): boolean {
        return this.router.url.split("?")[0].split("#")[0].replace(/\/$/, "") === "/app/finance-cuentas";
    }

    get isFinancePagosPage(): boolean {
        return this.router.url.split("?")[0].split("#")[0].replace(/\/$/, "") === "/app/finance-pagos";
    }

    get isFinanceFacturacionPage(): boolean {
        return this.router.url.split("?")[0].split("#")[0].replace(/\/$/, "") === "/app/finance-facturacion";
    }

    get isFinanceRecurringInvoicesPage(): boolean {
        return this.router.url.split("?")[0].split("#")[0].replace(/\/$/, "") === "/app/finance-facturacion-recurrentes";
    }

    get isFinanceCreditClientsPage(): boolean {
        return this.router.url.split("?")[0].split("#")[0].replace(/\/$/, "") === "/app/finance-clientes-credito";
    }

    get isFinanceGarantiasPage(): boolean {
        return this.router.url.split("?")[0].split("#")[0].replace(/\/$/, "") === "/app/finance-garantias";
    }

    get isCompanyHrDashboardPage(): boolean {
        return this.router.url.split("?")[0].split("#")[0].replace(/\/$/, "") === "/app/company-hr-dashboard";
    }

    get isCompanyHrEmployeesPage(): boolean {
        return this.router.url.split("?")[0].split("#")[0].replace(/\/$/, "") === "/app/company-hr-employees";
    }

    get isWorkWorkloadPage(): boolean {
        return this.router.url.split("?")[0].split("#")[0].replace(/\/$/, "") === "/app/work-workload";
    }

    get isCompanyHrCompensationPage(): boolean {
        return this.router.url.split("?")[0].split("#")[0].replace(/\/$/, "") === "/app/company-hr-compensation";
    }

    get isCompanyHrWorktimePage(): boolean {
        return this.router.url.split("?")[0].split("#")[0].replace(/\/$/, "") === "/app/company-hr-worktime";
    }

    get isCompanyHrHealthPage(): boolean {
        return this.router.url.split("?")[0].split("#")[0].replace(/\/$/, "") === "/app/company-hr-health";
    }

    get isCompanyHrLeavesPage(): boolean {
        return this.router.url.split("?")[0].split("#")[0].replace(/\/$/, "") === "/app/company-hr-leaves";
    }

    get isCompanyHrDocumentsPage(): boolean {
        return this.router.url.split("?")[0].split("#")[0].replace(/\/$/, "") === "/app/company-hr-documents";
    }

    get isCompanyHrAuditPage(): boolean {
        return this.router.url.split("?")[0].split("#")[0].replace(/\/$/, "") === "/app/company-hr-audit";
    }

    get isSuppliersDashboardPage(): boolean {
        return this.router.url.split("?")[0].split("#")[0].replace(/\/$/, "") === "/app/suppliers-dashboard";
    }

    get isSuppliersCrudPage(): boolean {
        return this.router.url.split("?")[0].split("#")[0].replace(/\/$/, "") === "/app/suppliers-crud";
    }

    get isSuppliersOrdersHistoryPage(): boolean {
        return this.router.url.split("?")[0].split("#")[0].replace(/\/$/, "") === "/app/suppliers-orders-history";
    }

    get isCompanyUserRolesPage(): boolean {
        return this.router.url.split("?")[0].split("#")[0].replace(/\/$/, "") === "/app/company-user-roles";
    }

    get isCompanyProfilePage(): boolean {
        return this.router.url.split("?")[0].split("#")[0].replace(/\/$/, "") === "/app/company-profile";
    }

    get isInventoryDashboardPage(): boolean {
        return this.router.url.split("?")[0].split("#")[0].replace(/\/$/, "") === "/app/inventory-dashboard";
    }

    get showProspectsBackButton(): boolean {
        const path = this.router.url.split("?")[0].split("#")[0].replace(/\/$/, "");
        return path === "/app/crm-prospectos" || path === "/app/crm-cotizaciones";
    }

    goBack(): void {
        // Prioriza el historial de navegacion interna; sin historial, destino determinista
        // para que "Volver" nunca quede muerto (history.back() no hace nada en carga directa).
        const previous = this.appNavigationHistory.pop();
        if (previous) {
            this.navigatingBack = true;
            this.router.navigateByUrl(previous);
            return;
        }
        const path = this.router.url.split("?")[0].split("#")[0].replace(/\/$/, "");
        const destination = path === "/app/crm-prospectos" || path === "/app/crm-clientes" || path === "/app/crm-cotizaciones"
            ? "/app/main-menu"
            : "/app/dashboard";
        this.router.navigateByUrl(destination);
    }

    ngOnInit() {
        // dark light mode initial
        this.htmlElement = this.document.querySelector("html");
        this.buttonElement = document.querySelector("#btn-layout-modes-dark-page");

        if (localStorage.getItem("layout-mode") === "dark") {
            this.renderer.addClass(this.buttonElement, "active");
            this.renderer.addClass(this.htmlElement, "dark-mode");
            this.renderer.removeClass(this.htmlElement, "dark-mode");
            this.renderer.setAttribute(this.htmlElement, "data-bs-theme", "dark");
        } else {
            this.renderer.removeClass(this.buttonElement, "active");
            this.renderer.removeClass(this.htmlElement, "dark-mode");
            this.renderer.addClass(this.htmlElement, "light-mode");
            this.renderer.setAttribute(this.htmlElement, "data-bs-theme", "light");
        }
    }
    toggleDarkMode() {
        if (this.htmlElement && this.buttonElement) {
            if (this.buttonElement.classList.contains("active")) {
                this.renderer.removeClass(this.buttonElement, "active");
                this.renderer.removeClass(this.htmlElement, "dark-mode");
                this.renderer.addClass(this.htmlElement, "light-mode");
                this.renderer.setAttribute(this.htmlElement, "data-bs-theme", "light");
                localStorage.setItem("layout-mode", "light");
            } else {
                this.renderer.addClass(this.buttonElement, "active");
                this.renderer.removeClass(this.htmlElement, "light-mode");
                this.renderer.addClass(this.htmlElement, "dark-mode");
                this.renderer.setAttribute(this.htmlElement, "data-bs-theme", "dark");
                localStorage.setItem("layout-mode", "dark");
            }
        }
    }
    toggleSearch() {
        const searchEl = this.document.querySelector(".adminuiux-search-full");
        if (searchEl?.classList.contains("active")) {
            this.renderer.removeClass(searchEl, "active");
        } else {
            this.renderer.addClass(searchEl, "active");
        }
    }

    onLogout(event: Event): void {
        event.preventDefault();
        this.authService.logout();
        void this.router.navigate(["/auth/signin"]);
    }
}

