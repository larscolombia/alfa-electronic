import { Component, Renderer2, Inject, ElementRef } from "@angular/core";
import { CommonModule, DOCUMENT } from "@angular/common";
import { RouterLink, RouterLinkActive, Router } from "@angular/router";
import { filter } from "rxjs/operators";
import { Subscription } from "rxjs";
import { InventoryPermission } from "../../../services/inventory-domain.models";
import { InventoryRbacService } from "../../../services/inventory-rbac.service";

@Component({
    selector: "app-sidebar",
    standalone: true,
    imports: [CommonModule, RouterLink, RouterLinkActive],
    template: `
        <!-- Standard sidebar -->
        <div class="adminuiux-sidebar shadow-sm">
            <div class="adminuiux-sidebar-inner">
                <div class="px-3 not-iconic mt-2">
                    <div class="row gx-3 gx-lg-4">
                        <div class="col align-self-center menu-name">
                            <h6>Main navigation</h6>
                        </div>
                        <div class="col-auto">
                            <a class="collapsed btn btn-link btn-square" data-bs-toggle="collapse" data-bs-target="#usersidebarprofile" aria-expanded="false" role="button" aria-controls="usersidebarprofile">
                                <i class="bi bi-person-circle"></i>
                            </a>
                        </div>
                    </div>
                </div>

                <!-- user information -->
                <div class="px-3 text-center not-iconic collapse" id="usersidebarprofile">
                    <div class="avatar avatar-100 rounded-circle shadow-sm my-3">
                        <figure class="avatar avatar-90 rounded-circle coverimg">
                            <img src="assets/img/modern-ai-image/user-4.jpg" alt="" id="userphotoonboarding" style="display: none;" />
                        </figure>
                    </div>
                    <h5 class="mb-0" id="usernamedisplay">The AdminUIUX</h5>
                    <p class="text-secondary small mb-3">United States</p>
                </div>

                <!-- user menu navigation -->
                <ul class="nav flex-column menu-active-line">
                    <li class="nav-item">
                        <a class="nav-link" aria-current="page" routerLink="/app/dashboard" routerLinkActive="active" (click)="closeSidebar()">
                            <i class="menu-icon bi bi-house-door"></i>
                            <div class="col menu-name">Home</div>
                        </a>
                    </li>
                    <li class="nav-item dropdown">
                        <a class="nav-link dropdown-toggle" data-bs-toggle="dropdown" aria-expanded="false" role="button" data-bs-auto-close="false" (click)="toggleDropdown($event)">
                            <i class="menu-icon bi bi-person-lines-fill"></i>
                            <div class="col menu-name">CRM</div>
                        </a>
                        <ul class="dropdown-menu">
                            <li class="nav-item">
                                <a class="nav-link" routerLink="/app/crm-carga-bases" routerLinkActive="active" (click)="closeSidebar()">
                                    <i class="menu-icon bi bi-cloud-arrow-up"></i>
                                    <div class="col align-self-center menu-name">Carga de bases de datos</div>
                                </a>
                            </li>
                            <li class="nav-item">
                                <a class="nav-link" routerLink="/app/calendar" routerLinkActive="active" (click)="closeSidebar()">
                                    <i class="menu-icon bi bi-calendar-event"></i>
                                    <div class="col align-self-center menu-name">Visitas</div>
                                </a>
                            </li>
                            <li class="nav-item">
                                <a class="nav-link" routerLink="/app/crm-prospectos" routerLinkActive="active" (click)="closeSidebar()">
                                    <i class="menu-icon bi bi-funnel"></i>
                                    <div class="col align-self-center menu-name">Prospectos</div>
                                </a>
                            </li>
                            <li class="nav-item">
                                <a class="nav-link" routerLink="/app/crm-cotizaciones" routerLinkActive="active" (click)="closeSidebar()">
                                    <i class="menu-icon bi bi-receipt"></i>
                                    <div class="col align-self-center menu-name">Cotizaciones</div>
                                </a>
                            </li>
                            <li class="nav-item">
                                <a class="nav-link" routerLink="/app/crm-clientes" routerLinkActive="active" (click)="closeSidebar()">
                                    <i class="menu-icon bi bi-people"></i>
                                    <div class="col align-self-center menu-name">Clientes</div>
                                </a>
                            </li>
                        </ul>
                    </li>
                    <li class="nav-item dropdown">
                        <a class="nav-link dropdown-toggle" data-bs-toggle="dropdown" aria-expanded="false" role="button" data-bs-auto-close="false" (click)="toggleDropdown($event)">
                            <i class="menu-icon bi bi-coin"></i>
                            <div class="col menu-name">Financiero</div>
                        </a>
                        <ul class="dropdown-menu">
                            <li class="nav-item">
                                <a class="nav-link" routerLink="/app/finance-dashboard" routerLinkActive="active" (click)="closeSidebar()">
                                    <i class="menu-icon bi bi-speedometer2"></i>
                                    <div class="col align-self-center menu-name">Dashboard financiero</div>
                                </a>
                            </li>
                            <li class="nav-item">
                                <a class="nav-link" routerLink="/app/finance-cuentas" routerLinkActive="active" (click)="closeSidebar()">
                                    <i class="menu-icon bi bi-building"></i>
                                    <div class="col align-self-center menu-name">Cuentas</div>
                                </a>
                            </li>
                            <li class="nav-item">
                                <a class="nav-link" routerLink="/app/finance-pagos" routerLinkActive="active" (click)="closeSidebar()">
                                    <i class="menu-icon bi bi-credit-card-2-front"></i>
                                    <div class="col align-self-center menu-name">Pagos</div>
                                </a>
                            </li>
                            <li class="nav-item dropdown">
                                <a class="nav-link dropdown-toggle" data-bs-toggle="dropdown" aria-expanded="false" role="button" data-bs-auto-close="false" (click)="toggleDropdown($event)">
                                    <i class="menu-icon bi bi-receipt-cutoff"></i>
                                    <div class="col align-self-center menu-name">Facturación</div>
                                </a>
                                <ul class="dropdown-menu">
                                    <li class="nav-item">
                                        <a class="nav-link" routerLink="/app/finance-facturacion" routerLinkActive="active" (click)="closeSidebar()">
                                            <i class="menu-icon bi bi-file-earmark-text"></i>
                                            <div class="col align-self-center menu-name">Listado de facturas</div>
                                        </a>
                                    </li>
                                    <li class="nav-item">
                                        <a class="nav-link" routerLink="/app/finance-facturacion-crear" routerLinkActive="active" (click)="closeSidebar()">
                                            <i class="menu-icon bi bi-plus-square"></i>
                                            <div class="col align-self-center menu-name">Crear factura</div>
                                        </a>
                                    </li>
                                    <li class="nav-item">
                                        <a class="nav-link" routerLink="/app/finance-facturacion-recurrentes" routerLinkActive="active" (click)="closeSidebar()">
                                            <i class="menu-icon bi bi-arrow-repeat"></i>
                                            <div class="col align-self-center menu-name">Facturas recurrentes</div>
                                        </a>
                                    </li>
                                    <li class="nav-item">
                                        <a class="nav-link" routerLink="/app/finance-facturacion-tiempo" routerLinkActive="active" (click)="closeSidebar()">
                                            <i class="menu-icon bi bi-clock-history"></i>
                                            <div class="col align-self-center menu-name">Registro de tiempo</div>
                                        </a>
                                    </li>
                                </ul>
                            </li>
                            <li class="nav-item">
                                <a class="nav-link" routerLink="/app/finance-clientes-credito" routerLinkActive="active" (click)="closeSidebar()">
                                    <i class="menu-icon bi bi-cash-coin"></i>
                                    <div class="col align-self-center menu-name">Clientes a crédito</div>
                                </a>
                            </li>
                        </ul>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" routerLink="/app/finance-garantias" routerLinkActive="active" (click)="closeSidebar()">
                            <i class="menu-icon bi bi-shield-check"></i>
                            <div class="col menu-name">Garantias</div>
                        </a>
                    </li>
                    <li class="nav-item dropdown" *ngIf="hasAnyInventoryPermission(['inventory.dashboard.view', 'inventory.stock.view', 'inventory.movements.view', 'inventory.reservations.view', 'inventory.replenishment.view', 'inventory.reconciliation.view'])">
                        <a class="nav-link dropdown-toggle" data-bs-toggle="dropdown" aria-expanded="false" role="button" data-bs-auto-close="false" (click)="toggleDropdown($event)">
                            <i class="menu-icon bi bi-boxes"></i>
                            <div class="col menu-name">Inventario</div>
                        </a>
                        <ul class="dropdown-menu">
                            <li class="nav-item" *ngIf="hasInventoryPermission('inventory.dashboard.view')">
                                <a class="nav-link" routerLink="/app/inventory-dashboard" routerLinkActive="active" (click)="closeSidebar()">
                                    <i class="menu-icon bi bi-speedometer2"></i>
                                    <div class="col align-self-center menu-name">Panel de control</div>
                                </a>
                            </li>
                            <li class="nav-item" *ngIf="hasInventoryPermission('inventory.stock.view')">
                                <a class="nav-link" routerLink="/app/inventory-stock" routerLinkActive="active" (click)="closeSidebar()">
                                    <i class="menu-icon bi bi-box-seam"></i>
                                    <div class="col align-self-center menu-name">Stock y fichas</div>
                                </a>
                            </li>
                            <li class="nav-item" *ngIf="hasInventoryPermission('inventory.movements.view')">
                                <a class="nav-link" routerLink="/app/inventory-movements" routerLinkActive="active" (click)="closeSidebar()">
                                    <i class="menu-icon bi bi-arrow-left-right"></i>
                                    <div class="col align-self-center menu-name">Entradas, salidas y ajustes</div>
                                </a>
                            </li>
                            <li class="nav-item" *ngIf="hasInventoryPermission('inventory.reservations.view')">
                                <a class="nav-link" routerLink="/app/inventory-reservations" routerLinkActive="active" (click)="closeSidebar()">
                                    <i class="menu-icon bi bi-bookmark-check"></i>
                                    <div class="col align-self-center menu-name">Reservas</div>
                                </a>
                            </li>
                            <li class="nav-item" *ngIf="hasInventoryPermission('inventory.replenishment.view')">
                                <a class="nav-link" routerLink="/app/inventory-orders" routerLinkActive="active" (click)="closeSidebar()">
                                    <i class="menu-icon bi bi-exclamation-diamond"></i>
                                    <div class="col align-self-center menu-name">Cantidad insuficiente y reposicion</div>
                                </a>
                            </li>
                            <li class="nav-item" *ngIf="hasInventoryPermission('inventory.reconciliation.view')">
                                <a class="nav-link" routerLink="/app/inventory-order-details" routerLinkActive="active" (click)="closeSidebar()">
                                    <i class="menu-icon bi bi-clipboard-data"></i>
                                    <div class="col align-self-center menu-name">Conciliacion y auditoria</div>
                                </a>
                            </li>
                        </ul>
                    </li>
                    <li class="nav-item dropdown">
                        <a class="nav-link dropdown-toggle" data-bs-toggle="dropdown" aria-expanded="false" role="button" data-bs-auto-close="false" (click)="toggleDropdown($event)">
                            <i class="menu-icon bi bi-truck"></i>
                            <div class="col menu-name">Proveedores</div>
                        </a>
                        <ul class="dropdown-menu">
                            <li class="nav-item">
                                <a class="nav-link" routerLink="/app/suppliers-dashboard" routerLinkActive="active" (click)="closeSidebar()">
                                    <i class="menu-icon bi bi-speedometer2"></i>
                                    <div class="col align-self-center menu-name">Dashboard de proveedores</div>
                                </a>
                            </li>
                            <li class="nav-item">
                                <a class="nav-link" routerLink="/app/suppliers-crud" routerLinkActive="active" (click)="closeSidebar()">
                                    <i class="menu-icon bi bi-table"></i>
                                    <div class="col align-self-center menu-name">CRUD de proveedores</div>
                                </a>
                            </li>
                            <li class="nav-item">
                                <a class="nav-link" routerLink="/app/suppliers-orders-history" routerLinkActive="active" (click)="closeSidebar()">
                                    <i class="menu-icon bi bi-clock-history"></i>
                                    <div class="col align-self-center menu-name">Historial de pedidos</div>
                                </a>
                            </li>
                        </ul>
                    </li>
                    <li class="nav-item dropdown">
                        <a class="nav-link dropdown-toggle" data-bs-toggle="dropdown" aria-expanded="false" role="button" data-bs-auto-close="false" (click)="toggleDropdown($event)">
                            <i class="menu-icon bi bi-briefcase"></i>
                            <div class="col menu-name">Trabajo</div>
                        </a>
                        <ul class="dropdown-menu">
                            <li class="nav-item">
                                <a class="nav-link" routerLink="/app/work-timesheet" routerLinkActive="active" (click)="closeSidebar()">
                                    <i class="menu-icon bi bi-clock-history"></i>
                                    <div class="col align-self-center menu-name">Hoja de tiempo</div>
                                </a>
                            </li>
                            <li class="nav-item">
                                <a class="nav-link" routerLink="/app/work-tasks" routerLinkActive="active" (click)="closeSidebar()">
                                    <i class="menu-icon bi bi-check2-square"></i>
                                    <div class="col align-self-center menu-name">Tareas</div>
                                </a>
                            </li>
                            <li class="nav-item">
                                <a class="nav-link" routerLink="/app/work-workload" routerLinkActive="active" (click)="closeSidebar()">
                                    <i class="menu-icon bi bi-bar-chart-line"></i>
                                    <div class="col align-self-center menu-name">Carga laboral</div>
                                </a>
                            </li>
                            <li class="nav-item">
                                <a class="nav-link" routerLink="/app/work-test-batches" routerLinkActive="active" (click)="closeSidebar()">
                                    <i class="menu-icon bi bi-ui-checks-grid"></i>
                                    <div class="col align-self-center menu-name">Lote de pruebas</div>
                                </a>
                            </li>
                            <li class="nav-item">
                                <a class="nav-link" routerLink="/app/work-garantias" routerLinkActive="active" (click)="closeSidebar()">
                                    <i class="menu-icon bi bi-shield-check"></i>
                                    <div class="col align-self-center menu-name">Garantias</div>
                                </a>
                            </li>
                            <li class="nav-item">
                                <a class="nav-link" routerLink="/app/work-projects" routerLinkActive="active" (click)="closeSidebar()">
                                    <i class="menu-icon bi bi-kanban"></i>
                                    <div class="col align-self-center menu-name">Proyectos</div>
                                </a>
                            </li>
                            <li class="nav-item">
                                <a class="nav-link" routerLink="/app/work-equipment-reception" routerLinkActive="active" (click)="closeSidebar()">
                                    <i class="menu-icon bi bi-box-arrow-in-down"></i>
                                    <div class="col align-self-center menu-name">Recepción de equipos</div>
                                </a>
                            </li>
                            <li class="nav-item">
                                <a class="nav-link" routerLink="/app/documentation" routerLinkActive="active" (click)="closeSidebar()">
                                    <i class="menu-icon bi bi-book"></i>
                                    <div class="col align-self-center menu-name">Biblioteca Tecnica</div>
                                </a>
                            </li>
                        </ul>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" routerLink="/app/remissions" routerLinkActive="active" (click)="closeSidebar()">
                            <i class="menu-icon bi bi-truck"></i>
                            <div class="col menu-name">Remisiones</div>
                        </a>
                    </li>
                    <li class="nav-item">
                        <a routerLink="/app/personalization" class="nav-link" routerLinkActive="active" (click)="closeSidebar()">
                            <i class="menu-icon bi bi-palette h4"></i>
                            <span class="menu-name">Personalize <small class="fs-12">❤️</small></span>
                        </a>
                    </li>
                    <li class="nav-item dropdown">
                        <a class="nav-link dropdown-toggle" data-bs-toggle="dropdown" aria-expanded="false" role="button" data-bs-auto-close="false" (click)="toggleDropdown($event)">
                            <i class="menu-icon bi bi-diagram-3"></i>
                            <div class="col menu-name">HR</div>
                        </a>
                        <ul class="dropdown-menu">
                            <li class="nav-item">
                                <a class="nav-link" routerLink="/app/company-hr-dashboard" routerLinkActive="active" (click)="closeSidebar()">
                                    <i class="menu-icon bi bi-speedometer2"></i>
                                    <div class="col align-self-center menu-name">Dashboard</div>
                                </a>
                            </li>
                            <li class="nav-item">
                                <a class="nav-link" routerLink="/app/company-hr-employees" routerLinkActive="active" (click)="closeSidebar()">
                                    <i class="menu-icon bi bi-person-vcard"></i>
                                    <div class="col align-self-center menu-name">Empleados</div>
                                </a>
                            </li>
                            <li class="nav-item">
                                <a class="nav-link" routerLink="/app/work-workload" routerLinkActive="active" (click)="closeSidebar()">
                                    <i class="menu-icon bi bi-bar-chart-line"></i>
                                    <div class="col align-self-center menu-name">Carga laboral</div>
                                </a>
                            </li>
                            <li class="nav-item">
                                <a class="nav-link" routerLink="/app/company-hr-compensation" routerLinkActive="active" (click)="closeSidebar()">
                                    <i class="menu-icon bi bi-cash-stack"></i>
                                    <div class="col align-self-center menu-name">Nomina</div>
                                </a>
                            </li>
                            <li class="nav-item">
                                <a class="nav-link" routerLink="/app/company-hr-worktime" routerLinkActive="active" (click)="closeSidebar()">
                                    <i class="menu-icon bi bi-calendar3"></i>
                                    <div class="col align-self-center menu-name">Horarios y festivos</div>
                                </a>
                            </li>
                            <li class="nav-item">
                                <a class="nav-link" routerLink="/app/company-hr-health" routerLinkActive="active" (click)="closeSidebar()">
                                    <i class="menu-icon bi bi-heart-pulse"></i>
                                    <div class="col align-self-center menu-name">Salud</div>
                                </a>
                            </li>
                            <li class="nav-item">
                                <a class="nav-link" routerLink="/app/company-hr-leaves" routerLinkActive="active" (click)="closeSidebar()">
                                    <i class="menu-icon bi bi-calendar2-week"></i>
                                    <div class="col align-self-center menu-name">Vacaciones y licencias</div>
                                </a>
                            </li>
                            <li class="nav-item">
                                <a class="nav-link" routerLink="/app/company-hr-documents" routerLinkActive="active" (click)="closeSidebar()">
                                    <i class="menu-icon bi bi-folder-check"></i>
                                    <div class="col align-self-center menu-name">Documentos</div>
                                </a>
                            </li>
                            <li class="nav-item">
                                <a class="nav-link" routerLink="/app/company-hr-audit" routerLinkActive="active" (click)="closeSidebar()">
                                    <i class="menu-icon bi bi-clipboard-data"></i>
                                    <div class="col align-self-center menu-name">Auditoria</div>
                                </a>
                            </li>
                        </ul>
                    </li>
                </ul>

                <!-- applications -->
                <div class="px-3 not-iconic">
                    <div class="row gx-3 gx-lg-4">
                        <div class="col align-self-center menu-name">
                            <h6>Applications</h6>
                        </div>
                    </div>
                </div>
                <ul class="nav flex-column menu-active-line">
                    <li class="nav-item">
                        <a class="nav-link" routerLink="/app/inbox" routerLinkActive="active" (click)="closeSidebar()">
                            <i class="menu-icon bi bi-envelope"></i>
                            <div class="col menu-name">Email</div>
                        </a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" routerLink="/app/explorer" routerLinkActive="active" (click)="closeSidebar()">
                            <i class="menu-icon bi bi-folder"></i>
                            <div class="col menu-name">Explorer</div>
                        </a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" routerLink="/app/calendar" routerLinkActive="active" (click)="closeSidebar()">
                            <i class="menu-icon bi bi-calendar-event"></i>
                            <div class="col menu-name">Calendar</div>
                        </a>
                    </li>
                </ul>

                <!-- user secondary menu navigation -->
                <div class="px-3 not-iconic">
                    <h6>Pages</h6>
                </div>
                <ul class="nav flex-column menu-active-line">
                    <li class="nav-item dropdown">
                        <a class="nav-link dropdown-toggle" data-bs-toggle="dropdown" aria-expanded="false" role="button" data-bs-auto-close="false" (click)="toggleDropdown($event)">
                            <i class="menu-icon bi bi-person-circle"></i>
                            <div class="col menu-name">Profile</div>
                        </a>
                        <ul class="dropdown-menu">
                            <li class="nav-item">
                                <a class="nav-link" routerLink="/app/profile-professional" routerLinkActive="active" (click)="closeSidebar()">
                                    <i class="menu-icon bi bi-briefcase"></i>
                                    <div class="col align-self-center menu-name">Professional</div>
                                </a>
                            </li>
                        </ul>
                    </li>
                    <li class="nav-item dropdown">
                        <a class="nav-link dropdown-toggle" data-bs-toggle="dropdown" aria-expanded="false" role="button" data-bs-auto-close="false" (click)="toggleDropdown($event)">
                            <i class="menu-icon bi bi-building"></i>
                            <div class="col menu-name">Company</div>
                        </a>
                        <ul class="dropdown-menu">
                            <li class="nav-item">
                                <a class="nav-link" routerLink="/app/company-profile" routerLinkActive="active" (click)="closeSidebar()">
                                    <i class="menu-icon bi bi-easel2"></i>
                                    <div class="col align-self-center menu-name">Company Profile</div>
                                </a>
                            </li>
                            <li class="nav-item">
                                <a class="nav-link" routerLink="/app/company-user-roles" routerLinkActive="active" (click)="closeSidebar()">
                                    <i class="menu-icon bi bi-people"></i>
                                    <div class="col align-self-center menu-name">User Roles</div>
                                </a>
                            </li>
                            <li class="nav-item">
                                <a class="nav-link" routerLink="/app/company-commercial-config" routerLinkActive="active" (click)="closeSidebar()">
                                    <i class="menu-icon bi bi-sliders"></i>
                                    <div class="col align-self-center menu-name">Config. Comercial</div>
                                </a>
                            </li>
                            <li class="nav-item">
                                <a class="nav-link" routerLink="/app/company-followups-config" routerLinkActive="active" (click)="closeSidebar()">
                                    <i class="menu-icon bi bi-magic"></i>
                                    <div class="col align-self-center menu-name">Config. Seguimientos</div>
                                </a>
                            </li>
                            <li class="nav-item">
                                <a class="nav-link" routerLink="/app/company-projects-config" routerLinkActive="active" (click)="closeSidebar()">
                                    <i class="menu-icon bi bi-kanban"></i>
                                    <div class="col align-self-center menu-name">Config. Proyectos</div>
                                </a>
                            </li>
                        </ul>
                    </li>
                    <li class="nav-item dropdown">
                        <a class="nav-link dropdown-toggle" data-bs-toggle="dropdown" aria-expanded="false" role="button" data-bs-auto-close="false" (click)="toggleDropdown($event)">
                            <i class="menu-icon bi bi-shield-lock"></i>
                            <div class="col menu-name">Seguridad avanzada</div>
                        </a>
                        <ul class="dropdown-menu">
                            <li class="nav-item">
                                <a class="nav-link" routerLink="/app/advanced-security-ip-restrictions" routerLinkActive="active" (click)="closeSidebar()">
                                    <i class="menu-icon bi bi-diagram-3"></i>
                                    <div class="col align-self-center menu-name">Restriccion por IP</div>
                                </a>
                            </li>
                        </ul>
                    </li>
                    <li class="nav-item dropdown">
                        <a class="nav-link dropdown-toggle" data-bs-toggle="dropdown" aria-expanded="false" role="button" data-bs-auto-close="false" (click)="toggleDropdown($event)">
                            <i class="menu-icon bi bi-window-stack"></i>
                            <div class="col menu-name">Supportive Pages</div>
                        </a>
                        <ul class="dropdown-menu">
                            <li class="nav-item">
                                <a class="nav-link" routerLink="../auth/signin" routerLinkActive="active" (click)="closeSidebar()">
                                    <i class="menu-icon bi bi-person"></i>
                                    <div class="col align-self-center menu-name">Sign in</div>
                                </a>
                            </li>
                            <li class="nav-item">
                                <a class="nav-link" routerLink="../auth/signup" routerLinkActive="active" (click)="closeSidebar()">
                                    <i class="menu-icon bi bi-person-plus"></i>
                                    <div class="col align-self-center menu-name">Sign up</div>
                                </a>
                            </li>
                            <li class="nav-item">
                                <a class="nav-link" routerLink="../auth/forgot-password" routerLinkActive="active" (click)="closeSidebar()">
                                    <i class="menu-icon bi bi-key"></i>
                                    <div class="col align-self-center menu-name">Forgot Password</div>
                                </a>
                            </li>
                            <li class="nav-item">
                                <a class="nav-link" routerLink="../auth/change-password" routerLinkActive="active" (click)="closeSidebar()">
                                    <i class="menu-icon bi bi-key"></i>
                                    <div class="col align-self-center menu-name">Change Password</div>
                                </a>
                            </li>
                            <li class="nav-item">
                                <a class="nav-link" routerLink="../under-construction" routerLinkActive="active" (click)="closeSidebar()">
                                    <i class="menu-icon bi bi-gear"></i>
                                    <div class="col align-self-center menu-name">Maintenance</div>
                                </a>
                            </li>
                            <li class="nav-item">
                                <a class="nav-link" routerLink="../coming-soon" routerLinkActive="active" (click)="closeSidebar()">
                                    <i class="menu-icon bi bi-alarm"></i>
                                    <div class="col align-self-center menu-name">Coming soon</div>
                                </a>
                            </li>
                            <li class="nav-item">
                                <a class="nav-link" routerLink="../app/page-not-found-2" routerLinkActive="active" (click)="closeSidebar()">
                                    <i class="menu-icon bi bi-exclamation-circle"></i>
                                    <div class="col align-self-center menu-name">Error</div>
                                </a>
                            </li>
                            <li class="nav-item">
                                <a class="nav-link" routerLink="../auth/onboarding" routerLinkActive="active" (click)="closeSidebar()">
                                    <i class="menu-icon bi bi-emoji-smile"></i>
                                    <div class="col align-self-center menu-name">Onboarding</div>
                                </a>
                            </li>
                            <li class="nav-item">
                                <a class="nav-link" routerLink="/app/contact-us" routerLinkActive="active" (click)="closeSidebar()">
                                    <i class="menu-icon bi bi-envelope"></i>
                                    <div class="col align-self-center menu-name">Contact</div>
                                </a>
                            </li>
                            <li class="nav-item">
                                <a class="nav-link" routerLink="/app/timeline" routerLinkActive="active" (click)="closeSidebar()">
                                    <i class="menu-icon bi bi-calendar-week"></i>
                                    <div class="col align-self-center menu-name">Timeline</div>
                                </a>
                            </li>
                        </ul>
                    </li>
                </ul>
            </div>
        </div>
    `,
})
export class SidebarComponent {
    routerEventsSubscription: Subscription | undefined;

    constructor(
        private renderer: Renderer2,
        private router: Router,
        private elementRef: ElementRef,
        private readonly inventoryRbac: InventoryRbacService,
        @Inject(DOCUMENT) private document: Document
    ) { }

    ngOnInit() {
        this.closeSidebar();
    }

    closeSidebar() {
        const windowWidth = window.innerWidth;
        const body = document.body;

        if (windowWidth < 992) {
            this.renderer.removeClass(body, "sidebar-open");
            this.renderer.addClass(body, "sidebar-close");
        }
    }

    toggleDropdown(event: MouseEvent) {
        event.stopPropagation();
        const clickedToggle = event.currentTarget as HTMLElement | null;
        if (!clickedToggle) {
            return;
        }

        const clickedDropdown = clickedToggle.closest(".dropdown") as HTMLElement | null;
        if (!clickedDropdown) {
            return;
        }

        const dropdowns = Array.from(this.elementRef.nativeElement.querySelectorAll(".dropdown")) as HTMLElement[];

        dropdowns.forEach((dropdown) => {
            const isClickedDropdown = dropdown === clickedDropdown;
            const isAncestor = dropdown.contains(clickedDropdown);
            const isDescendant = clickedDropdown.contains(dropdown);

            if (isClickedDropdown || isAncestor || isDescendant) {
                return;
            }

            this.closeDropdown(dropdown);
        });
    }

    private closeDropdown(dropdown: HTMLElement) {
        const dropdownBtn = Array.from(dropdown.children).find((child) => child.classList.contains("dropdown-toggle")) as HTMLElement | undefined;
        const dropdownMenu = Array.from(dropdown.children).find((child) => child.classList.contains("dropdown-menu")) as HTMLElement | undefined;

        if (dropdownBtn) {
            this.renderer.removeClass(dropdownBtn, "show");
        }

        if (dropdownMenu) {
            this.renderer.removeClass(dropdownMenu, "show");
        }
    }

    hasInventoryPermission(permission: InventoryPermission): boolean {
        return this.inventoryRbac.hasPermission(permission);
    }

    hasAnyInventoryPermission(permissions: InventoryPermission[]): boolean {
        return this.inventoryRbac.hasAnyPermission(permissions);
    }
}
