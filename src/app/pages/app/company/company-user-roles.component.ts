import { ChangeDetectorRef, Component, OnInit, Inject, ViewChild, Renderer2, ElementRef, CUSTOM_ELEMENTS_SCHEMA } from "@angular/core";
import { RouterLink } from "@angular/router";
import Choices, { ClassNames } from "choices.js";
import { DOCUMENT, NgClass, NgFor, NgIf, NgTemplateOutlet } from "@angular/common";
import { FormsModule } from "@angular/forms";
import Swiper from "swiper";
import { register } from "swiper/element/bundle";
register();

import { DaterangePickerRangesComponent } from "../../../components/input-fields/daterange-picker/daterange-picker-ranges.component";
import { AclApiService, AclModule, AclRole, RoleModulePermission, UserSoftDeletePayload } from "../../../services/acl-api.service";

interface RoleModuleFieldView {
    id: string;
    slug: string;
    label: string;
}

interface RoleModuleView {
    id: string;
    key: string;
    name: string;
    description: string;
    fields: RoleModuleFieldView[];
    actionScopes: Record<string, string>;
    fieldPermissions: Record<string, string>;
}

@Component({
    selector: "app-company-user-roles",
    standalone: true,
    imports: [RouterLink, DaterangePickerRangesComponent, NgFor, NgIf, NgClass, NgTemplateOutlet, FormsModule],
    template: `
        <!-- page title -->
        <div class="container-fluid py-3">
            <div class="row gx-3 gx-lg-4 align-items-center page-title">
                <div class="col col-sm mb-3 mb-sm-0 order-1">
                    <h5 class="mb-0">Roles de usuario</h5>
                    <p class="text-secondary small">Administra a tus usuarios y el acceso asignando roles</p>
                </div>
                <div class="col-12 col-sm-auto order-3 order-sm-2">
                    <app-daterange-picker-ranges class="bg-none"></app-daterange-picker-ranges>
                </div>
                <div class="col-auto ps-0 position-relative order-2 order-sm-3 mb-3 mb-sm-0">
                    <div class="dropdown d-inline-block">
                        <a class="btn btn-link btn-square no-caret dropdown-toggle" role="button" id="filterintitle" data-bs-toggle="dropdown" data-bs-auto-close="outside" aria-expanded="false">
                            <i class="bi bi-filter"></i>
                        </a>
                        <div class="dropdown-menu width-300" aria-labelledby="filterintitle">
                            <div class="p-1 mb-2">
                                <div class="input-group input-group-md rounded" style="--mw-dynamic:234px">
                                    <span class="input-group-text text-theme-1"><i class="bi bi-box"></i></span>
                                    <select class="form-control choices" #choices id="titltfilterlist" multiple>
                                        <option value="San Francisco">San Francisco</option>
                                        <option value="New York">New York</option>
                                        <option value="London">London</option>
                                        <option value="Chicago">Chicago</option>
                                        <option value="India" selected="">India</option>
                                        <option value="Sydney">Sydney</option>
                                        <option value="Seattle">Seattle</option>
                                        <option value="Los Angeles">Los Angeles</option>
                                        <option value="Indonesia">Indonesia</option>
                                        <option value="Los Angeles">Los Angeles</option>
                                        <option value="Chicago">Chicago</option>
                                        <option value="India">India</option>
                                    </select>
                                </div>
                                <div class="invalid-feedback">You have already selected maximum option allowed. (This is Configurable)</div>
                            </div>
                            <div class="p-1">
                                <h6 class="mb-0">Órdenes:</h6>
                                <p class="text-secondary small">1256 órdenes la semana pasada</p>
                            </div>
                            <ul class="list-group list-group-flush bg-transparent border-0 mb-2">
                                <li class="list-group-item">
                                    <div class="row gx-3 gx-lg-4">
                                        <div class="col">Órdenes en línea</div>
                                        <div class="col-auto">
                                            <div class="form-check form-switch">
                                                <input class="form-check-input" type="checkbox" role="switch" id="titleswitch1" />
                                                <label class="form-check-label" for="titleswitch1"></label>
                                            </div>
                                        </div>
                                    </div>
                                </li>
                                <li class="list-group-item">
                                    <div class="row gx-3 gx-lg-4">
                                        <div class="col">Órdenes fuera de línea</div>
                                        <div class="col-auto">
                                            <div class="form-check form-switch">
                                                <input class="form-check-input" type="checkbox" role="switch" id="titleswitch2" checked="" />
                                                <label class="form-check-label" for="titleswitch2"></label>
                                            </div>
                                        </div>
                                    </div>
                                </li>
                            </ul>
                            <div class="p-1">
                                <div class="row gx-3 gx-lg-4">
                                    <div class="col"><button class="btn btn-outline-secondary border ddclose">cancelar</button></div>
                                    <div class="col-auto">
                                        <button class="btn btn-theme">Guardar</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <a routerLink="/app/company-help-center" class="btn btn-link btn-square" data-bs-toggle="tooltip" data-bs-placement="top" id="stylise">
                        <i class="bi bi-life-preserver"></i>
                    </a>
                    <a href="https://1.envato.market/7N7Br" target="_blank" class="btn btn-link btn-square" data-bs-toggle="tooltip" data-bs-placement="top">
                        <span class="bi bi-basket position-relative">
                            <span class="position-absolute top-0 start-100 p-1 bg-danger border border-light rounded-circle">
                                <span class="visually-hidden">Nuevas alertas</span>
                            </span>
                        </span>
                    </a>
                </div>
            </div>

            <nav aria-label="breadcrumb" class="breadcrumb-theme mt-3 rounded">
                <ol class="breadcrumb mb-0">
                    <li class="breadcrumb-item bi">
                        <a routerLink="/app/dashboard"><i class="bi bi-house-door me-2"></i> AdminUX</a>
                    </li>
                    <li class="breadcrumb-item bi"><a routerLink="/app/company-profile"> Empresa</a></li>
                    <li class="breadcrumb-item bi active" aria-current="page">Roles de usuario</li>
                </ol>
            </nav>
        </div>

        <!-- content -->
        <div class="container mt-3" id="main-content">
            <div class="row gx-3 gx-lg-4 mb-3 mb-lg-4">
                <div class="col text-center py-3">
                    <h4>Gestión centralizada de <span class="text-gradient">roles y permisos</span> de usuario.</h4>
                    <p class="text-secondary">Este módulo permite administrar perfiles, niveles de acceso y trazabilidad de permisos para garantizar control, cumplimiento y seguridad en la operación interna.</p>
                </div>
            </div>

            <div class="row gx-3" *ngIf="aclMessage">
                <div class="col-12">
                    <div class="alert alert-secondary border mb-3">{{ aclMessage }}</div>
                </div>
            </div>

            <div class="card adminuiux-card mb-3 mb-lg-4">
                <div class="card-body pb-0">
                    <h5>Resumen de roles asignados</h5>
                    <p class="text-secondary mb-3 mb-lg-4">Los roles son grupos predefinidos para acceder al sistema en toda la aplicación. Las funciones restringidas o no asignadas no estarán disponibles para ese rol de usuario. Los roles se pueden editar y eliminar, y se pueden asignar a cualquier usuario registrado en el sistema.</p>
                    <div class="row gx-3">
                        <div class="col-12 col-md-6 col-lg-4" *ngFor="let role of roles">
                            <div class="card shadow-none mb-3">
                                <div class="card-body pb-0">
                                    <h6 class="mb-3">{{ role.name }}</h6>
                                    <p class="text-secondary small mb-3">
                                        Rol sincronizado desde backend <br />
                                        Estado: <b>{{ role.isActive ? 'Activo' : 'Inactivo' }}</b>
                                    </p>

                                    <div class="row gx-3 align-items-center">
                                        <div class="col-auto mb-3">
                                            <div class="avatar avatar-30 coverimg rounded-circle me-1">
                                                <img src="assets/img/modern-ai-image/user-2.jpg" alt="" />
                                            </div>
                                            <div class="avatar avatar-30 coverimg rounded-circle me-1">
                                                <img src="assets/img/modern-ai-image/user-3.jpg" alt="" />
                                            </div>
                                            <div class="avatar avatar-30 coverimg rounded-circle me-1">
                                                <img src="assets/img/modern-ai-image/user-4.jpg" alt="" />
                                            </div>
                                        </div>
                                        <div class="col mb-3">
                                            <p>+2 más</p>
                                        </div>
                                        <div class="col-auto mb-3">
                                            <a class="btn btn-theme btn-sm">Actualizar rol</a>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <ng-template #rolesCarouselTpl>
            <!-- Swiper -->
            <swiper-container slides-per-view="auto" space-between="16" autoplay="true" class="swiper swipernav">
                <swiper-slide class="width-240">
                    <div class="card adminuiux-card text-center mb-3 mb-lg-4"
                        data-access-tooltip="true"
                        data-bs-toggle="tooltip"
                        data-bs-placement="bottom"
                        data-bs-html="true"
                        [attr.data-bs-title]="getAccessTooltip('Administrador')">
                        <div class="card-body">
                            <div class="height-200 overflow-hidden rounded mb-3 position-relative z-index-0">
                                <div class="dropdown d-inline-block position-absolute top-0 end-0 z-index-1">
                                    <a class="btn btn-link text-white no-caret" data-bs-toggle="dropdown" aria-expanded="false" data-bs-display="static" role="button">
                                        <i class="bi bi-three-dots-vertical"></i>
                                    </a>
                                    <ul class="dropdown-menu dropdown-menu-end">
                                        <li><a class="dropdown-item" href="javascript:void(0)">Editar</a></li>
                                        <li><a class="dropdown-item" href="javascript:void(0)">Mover</a></li>
                                        <li><button class="dropdown-item text-warning" type="button" (click)="softDeactivateUser('adittests@gmailtest.com')">Desactivar</button></li>
                                    </ul>
                                </div>
                                <figure class="h-100 w-100 coverimg">
                                    <img src="assets/img/modern-ai-image/user-2.jpg" alt="" />
                                </figure>
                            </div>
                            <h5 class="text-truncated mb-1">Aditi Johnson</h5>
                            <p class="text-secondary text-truncated mb-3">adittests&#64;gmailtest.com</p>
                            <span *ngIf="isUserDeactivated('adittests@gmailtest.com')" class="badge badge-lg badge-light text-bg-secondary mb-2">Inactivo</span>
                            <span *ngIf="!isUserDeactivated('adittests@gmailtest.com')" class="badge badge-lg badge-light text-bg-theme-1 theme-green">Administrador</span>
                        </div>
                    </div>
                </swiper-slide>
                <swiper-slide class="width-240">
                    <div class="card adminuiux-card text-center mb-3 mb-lg-4"
                        data-access-tooltip="true"
                        data-bs-toggle="tooltip"
                        data-bs-placement="bottom"
                        data-bs-html="true"
                        [attr.data-bs-title]="getAccessTooltip('Super administrador')">
                        <div class="card-body">
                            <div class="height-200 overflow-hidden rounded mb-3 position-relative z-index-0">
                                <div class="dropdown d-inline-block position-absolute top-0 end-0 z-index-1">
                                    <a class="btn btn-link text-white no-caret" data-bs-toggle="dropdown" aria-expanded="false" data-bs-display="static" role="button">
                                        <i class="bi bi-three-dots-vertical"></i>
                                    </a>
                                    <ul class="dropdown-menu dropdown-menu-end">
                                        <li><a class="dropdown-item" href="javascript:void(0)">Editar</a></li>
                                        <li><a class="dropdown-item" href="javascript:void(0)">Mover</a></li>
                                        <li><button class="dropdown-item text-warning" type="button" (click)="softDeactivateUser('maxsmith@gmailtest.com')">Desactivar</button></li>
                                    </ul>
                                </div>
                                <figure class="h-100 w-100 coverimg">
                                    <img src="assets/img/modern-ai-image/user-1.jpg" alt="" />
                                </figure>
                            </div>
                            <h5 class="text-truncated mb-1">Max Smith</h5>
                            <p class="text-secondary text-truncated mb-3">maxsmith&#64;gmailtest.com</p>
                            <span *ngIf="isUserDeactivated('maxsmith@gmailtest.com')" class="badge badge-lg badge-light text-bg-secondary mb-2">Inactivo</span>
                            <span *ngIf="!isUserDeactivated('maxsmith@gmailtest.com')" class="badge badge-lg badge-light text-bg-theme-1">Súper administrador</span>
                        </div>
                    </div>
                </swiper-slide>
                <swiper-slide class="width-240">
                    <div class="card adminuiux-card text-center mb-3 mb-lg-4"
                        data-access-tooltip="true"
                        data-bs-toggle="tooltip"
                        data-bs-placement="bottom"
                        data-bs-html="true"
                        [attr.data-bs-title]="getAccessTooltip('Moderador')">
                        <div class="card-body">
                            <div class="height-200 overflow-hidden rounded mb-3 position-relative z-index-0">
                                <div class="dropdown d-inline-block position-absolute top-0 end-0 z-index-1">
                                    <a class="btn btn-link text-white no-caret" data-bs-toggle="dropdown" aria-expanded="false" data-bs-display="static" role="button">
                                        <i class="bi bi-three-dots-vertical"></i>
                                    </a>
                                    <ul class="dropdown-menu dropdown-menu-end">
                                        <li><a class="dropdown-item" href="javascript:void(0)">Editar</a></li>
                                        <li><a class="dropdown-item" href="javascript:void(0)">Mover</a></li>
                                        <li><button class="dropdown-item text-warning" type="button" (click)="softDeactivateUser('lisapatval11@gmailtest.com')">Desactivar</button></li>
                                    </ul>
                                </div>
                                <figure class="h-100 w-100 coverimg">
                                    <img src="assets/img/modern-ai-image/user-3.jpg" alt="" />
                                </figure>
                            </div>
                            <h5 class="text-truncated mb-1">Lisa Patvaal</h5>
                            <p class="text-secondary text-truncated mb-3">lisapatval11&#64;gmailtest.com</p>
                            <span *ngIf="isUserDeactivated('lisapatval11@gmailtest.com')" class="badge badge-lg badge-light text-bg-secondary mb-2">Inactivo</span>
                            <span *ngIf="!isUserDeactivated('lisapatval11@gmailtest.com')" class="badge badge-lg badge-light text-bg-theme-1 theme-orange">Moderador</span>
                        </div>
                    </div>
                </swiper-slide>
                <swiper-slide class="width-240">
                    <div class="card adminuiux-card text-center mb-3 mb-lg-4"
                        data-access-tooltip="true"
                        data-bs-toggle="tooltip"
                        data-bs-placement="bottom"
                        data-bs-html="true"
                        [attr.data-bs-title]="getAccessTooltip('Contador')">
                        <div class="card-body">
                            <div class="height-200 overflow-hidden rounded mb-3 position-relative z-index-0">
                                <div class="dropdown d-inline-block position-absolute top-0 end-0 z-index-1">
                                    <a class="btn btn-link text-white no-caret" data-bs-toggle="dropdown" aria-expanded="false" data-bs-display="static" role="button">
                                        <i class="bi bi-three-dots-vertical"></i>
                                    </a>
                                    <ul class="dropdown-menu dropdown-menu-end">
                                        <li><a class="dropdown-item" href="javascript:void(0)">Editar</a></li>
                                        <li><a class="dropdown-item" href="javascript:void(0)">Mover</a></li>
                                        <li><button class="dropdown-item text-warning" type="button" (click)="softDeactivateUser('dwaynejohn008@test.com')">Desactivar</button></li>
                                    </ul>
                                </div>
                                <figure class="h-100 w-100 coverimg">
                                    <img src="assets/img/modern-ai-image/user-4.jpg" alt="" />
                                </figure>
                            </div>
                            <h5 class="text-truncated mb-1">Dwayne Johnson</h5>
                            <p class="text-secondary text-truncated mb-3">dwaynejohn008&#64;test.com</p>
                            <span *ngIf="isUserDeactivated('dwaynejohn008@test.com')" class="badge badge-lg badge-light text-bg-secondary mb-2">Inactivo</span>
                            <span *ngIf="!isUserDeactivated('dwaynejohn008@test.com')" class="badge badge-lg badge-light text-bg-theme-1 theme-red">Contador</span>
                        </div>
                    </div>
                </swiper-slide>
                <swiper-slide class="width-240">
                    <div class="card adminuiux-card text-center mb-3 mb-lg-4"
                        data-access-tooltip="true"
                        data-bs-toggle="tooltip"
                        data-bs-placement="bottom"
                        data-bs-html="true"
                        [attr.data-bs-title]="getAccessTooltip('Desarrollador')">
                        <div class="card-body">
                            <div class="height-200 overflow-hidden rounded mb-3 position-relative z-index-0">
                                <div class="dropdown d-inline-block position-absolute top-0 end-0 z-index-1">
                                    <a class="btn btn-link text-white no-caret" data-bs-toggle="dropdown" aria-expanded="false" data-bs-display="static" role="button">
                                        <i class="bi bi-three-dots-vertical"></i>
                                    </a>
                                    <ul class="dropdown-menu dropdown-menu-end">
                                        <li><a class="dropdown-item" href="javascript:void(0)">Editar</a></li>
                                        <li><a class="dropdown-item" href="javascript:void(0)">Mover</a></li>
                                        <li><button class="dropdown-item text-warning" type="button" (click)="softDeactivateUser('adittests@gmailtest.com')">Desactivar</button></li>
                                    </ul>
                                </div>
                                <figure class="h-100 w-100 coverimg">
                                    <img src="assets/img/modern-ai-image/user-2.jpg" alt="" />
                                </figure>
                            </div>
                            <h5 class="text-truncated mb-1">Aditi Johnson</h5>
                            <p class="text-secondary text-truncated mb-3">adittests&#64;gmailtest.com</p>
                            <span *ngIf="isUserDeactivated('adittests@gmailtest.com')" class="badge badge-lg badge-light text-bg-secondary mb-2">Inactivo</span>
                            <span *ngIf="!isUserDeactivated('adittests@gmailtest.com')" class="badge badge-lg badge-light text-bg-theme-1 theme-pink">Desarrollador</span>
                        </div>
                    </div>
                </swiper-slide>
                <swiper-slide class="width-240">
                    <div class="card adminuiux-card text-center mb-3 mb-lg-4"
                        data-access-tooltip="true"
                        data-bs-toggle="tooltip"
                        data-bs-placement="bottom"
                        data-bs-html="true"
                        [attr.data-bs-title]="getAccessTooltip('Super administrador')">
                        <div class="card-body">
                            <div class="height-200 overflow-hidden rounded mb-3 position-relative z-index-0">
                                <div class="dropdown d-inline-block position-absolute top-0 end-0 z-index-1">
                                    <a class="btn btn-link text-white no-caret" data-bs-toggle="dropdown" aria-expanded="false" data-bs-display="static" role="button">
                                        <i class="bi bi-three-dots-vertical"></i>
                                    </a>
                                    <ul class="dropdown-menu dropdown-menu-end">
                                        <li><a class="dropdown-item" href="javascript:void(0)">Editar</a></li>
                                        <li><a class="dropdown-item" href="javascript:void(0)">Mover</a></li>
                                        <li><button class="dropdown-item text-warning" type="button" (click)="softDeactivateUser('maxsmith@gmailtest.com')">Desactivar</button></li>
                                    </ul>
                                </div>
                                <figure class="h-100 w-100 coverimg">
                                    <img src="assets/img/modern-ai-image/user-1.jpg" alt="" />
                                </figure>
                            </div>
                            <h5 class="text-truncated mb-1">Max Smith</h5>
                            <p class="text-secondary text-truncated mb-3">maxsmith&#64;gmailtest.com</p>
                            <span *ngIf="isUserDeactivated('maxsmith@gmailtest.com')" class="badge badge-lg badge-light text-bg-secondary mb-2">Inactivo</span>
                            <span *ngIf="!isUserDeactivated('maxsmith@gmailtest.com')" class="badge badge-lg badge-light text-bg-theme-1">Súper administrador</span>
                        </div>
                    </div>
                </swiper-slide>
                <swiper-slide class="width-240">
                    <div class="card adminuiux-card text-center mb-3 mb-lg-4"
                        data-access-tooltip="true"
                        data-bs-toggle="tooltip"
                        data-bs-placement="bottom"
                        data-bs-html="true"
                        [attr.data-bs-title]="getAccessTooltip('Moderador')">
                        <div class="card-body">
                            <div class="height-200 overflow-hidden rounded mb-3 position-relative z-index-0">
                                <div class="dropdown d-inline-block position-absolute top-0 end-0 z-index-1">
                                    <a class="btn btn-link text-white no-caret" data-bs-toggle="dropdown" aria-expanded="false" data-bs-display="static" role="button">
                                        <i class="bi bi-three-dots-vertical"></i>
                                    </a>
                                    <ul class="dropdown-menu dropdown-menu-end">
                                        <li><a class="dropdown-item" href="javascript:void(0)">Editar</a></li>
                                        <li><a class="dropdown-item" href="javascript:void(0)">Mover</a></li>
                                        <li><button class="dropdown-item text-warning" type="button" (click)="softDeactivateUser('lisapatval11@gmailtest.com')">Desactivar</button></li>
                                    </ul>
                                </div>
                                <figure class="h-100 w-100 coverimg">
                                    <img src="assets/img/modern-ai-image/user-3.jpg" alt="" />
                                </figure>
                            </div>
                            <h5 class="text-truncated mb-1">Lisa Patvaal</h5>
                            <p class="text-secondary text-truncated mb-3">lisapatval11&#64;gmailtest.com</p>
                            <span *ngIf="isUserDeactivated('lisapatval11@gmailtest.com')" class="badge badge-lg badge-light text-bg-secondary mb-2">Inactivo</span>
                            <span *ngIf="!isUserDeactivated('lisapatval11@gmailtest.com')" class="badge badge-lg badge-light text-bg-theme-1 theme-orange">Moderador</span>
                        </div>
                    </div>
                </swiper-slide>
                <swiper-slide class="width-240">
                    <div class="card adminuiux-card text-center mb-3 mb-lg-4"
                        data-access-tooltip="true"
                        data-bs-toggle="tooltip"
                        data-bs-placement="bottom"
                        data-bs-html="true"
                        [attr.data-bs-title]="getAccessTooltip('Contador')">
                        <div class="card-body">
                            <div class="height-200 overflow-hidden rounded mb-3 position-relative z-index-0">
                                <div class="dropdown d-inline-block position-absolute top-0 end-0 z-index-1">
                                    <a class="btn btn-link text-white no-caret" data-bs-toggle="dropdown" aria-expanded="false" data-bs-display="static" role="button">
                                        <i class="bi bi-three-dots-vertical"></i>
                                    </a>
                                    <ul class="dropdown-menu dropdown-menu-end">
                                        <li><a class="dropdown-item" href="javascript:void(0)">Editar</a></li>
                                        <li><a class="dropdown-item" href="javascript:void(0)">Mover</a></li>
                                        <li><button class="dropdown-item text-warning" type="button" (click)="softDeactivateUser('dwaynejohn008@test.com')">Desactivar</button></li>
                                    </ul>
                                </div>
                                <figure class="h-100 w-100 coverimg">
                                    <img src="assets/img/modern-ai-image/user-4.jpg" alt="" />
                                </figure>
                            </div>
                            <h5 class="text-truncated mb-1">Dwayne Johnson</h5>
                            <p class="text-secondary text-truncated mb-3">dwaynejohn008&#64;test.com</p>
                            <span *ngIf="isUserDeactivated('dwaynejohn008@test.com')" class="badge badge-lg badge-light text-bg-secondary mb-2">Inactivo</span>
                            <span *ngIf="!isUserDeactivated('dwaynejohn008@test.com')" class="badge badge-lg badge-light text-bg-theme-1 theme-red">Contador</span>
                        </div>
                    </div>
                </swiper-slide>
            </swiper-container>
            </ng-template>

            <div class="card adminuiux-card mb-3 mb-lg-4">
                <div class="card-header border-bottom">
                    <div class="row gx-3 align-items-center">
                        <div class="col-auto mb-3 mb-md-0">
                            <button class="btn btn-square btn-link" (click)="innersidebar()"><i class="bi bi-layout-sidebar h5 vm"></i></button>
                        </div>
                        <div class="col-auto mb-3 mb-md-0">
                            <i class="bi bi-people h5 avatar avatar-40 bg-theme-1-subtle text-theme-1 rounded"></i>
                        </div>
                        <div class="col mb-3 mb-md-0">
                            <h6 class="mb-0">Roles de usuario</h6>
                            <p class="small text-secondary">Agregar/actualizar roles de usuario y permisos. Roles sincronizados: {{ roles.length }}</p>
                        </div>
                        <div class="col-12 col-md-auto">
                            <button class="btn btn-theme btn-sm" type="button" (click)="createQuickRole()"><i class="bi bi-plus"></i> Agregar rol</button>
                            <button class="btn btn-theme btn-sm" routerLink="/app/company-hr-employees"><i class="bi bi-plus"></i> Agregar empleado</button>
                        </div>
                    </div>
                </div>
                <div class="card-body p-0">
                    <div class="inner-sidebar-wrap">
                        <div class="inner-sidebar p-0">
                            <ul class="nav nav-pills flex-column mb-3">
                                <li class="nav-item">
                                    <a class="nav-link" aria-current="page">
                                        <div class="avatar avatar-40 icon"><i class="bi bi-person"></i></div>
                                        <div class="col">Usuarios</div>
                                    </a>
                                </li>
                                <li class="nav-item dropdown">
                                    <a class="nav-link dropdown-toggle no-caret show" data-bs-toggle="dropdown" data-bs-auto-close="false" data-bs-display="static" role="button" aria-expanded="true">
                                        <div class="avatar avatar-40 icon"><i class="bi bi-clipboard-check vm"></i></div>
                                        <div class="col">Roles</div>
                                        <div class="arrow"><i class="bi bi-chevron-down plus"></i> <i class="bi bi-chevron-up minus"></i></div>
                                    </a>
                                    <ul class="dropdown-menu show">
                                        <li *ngFor="let role of roles">
                                            <a
                                                class="dropdown-item nav-link"
                                                role="button"
                                                [ngClass]="{ active: role.id === selectedRoleId }"
                                                (click)="selectRole(role.id)">
                                                <div class="avatar avatar-40 icon"><i class="bi bi-patch-check"></i></div>
                                                <div class="col align-self-center">{{ role.name }}</div>
                                                <div class="arrow"><i class="bi bi-chevron-right"></i></div>
                                            </a>
                                        </li>
                                    </ul>
                                </li>
                            </ul>
                        </div>
                        <div class="inner-sidebar-content border-start p-3">
                            <h5 class="mb-3 mb-lg-4">{{ selectedRoleName || 'Rol seleccionado' }}</h5>
                            <p class="text-secondary">Vista sincronizada con backend ACL. Los permisos y accesos de este rol se gestionan de forma centralizada desde base de datos.</p>
                            <br />

                            <h6 class="mb-3 mb-lg-4">Accesos y permisos</h6>
                            <div class="d-flex flex-wrap align-items-center gap-2 mb-3">
                                <button
                                    class="btn btn-theme btn-sm"
                                    type="button"
                                    [disabled]="!selectedRoleId || savingPermissions || !permissionsDirty"
                                    (click)="saveRolePermissions()">
                                    {{ savingPermissions ? 'Guardando...' : 'Guardar permisos' }}
                                </button>
                                <button
                                    class="btn btn-outline-secondary btn-sm"
                                    type="button"
                                    [disabled]="!selectedRoleId || loadingRolePermissions || savingPermissions"
                                    (click)="reloadSelectedRolePermissions()">
                                    {{ loadingRolePermissions ? 'Cargando...' : 'Recargar' }}
                                </button>
                                <span class="small text-secondary" *ngIf="permissionsDirty">Hay cambios pendientes por guardar.</span>
                            </div>
                            <div class="row gx-3">
                                <div class="col-12 mb-3 mb-xxl-4">
                                    <ul class="list-group list-group-flush bg-none">
                                        <li class="list-group-item text-secondary" *ngFor="let module of modulePermissions">
                                            <div class="row gx-3">
                                                <div class="col-auto">
                                                    <div class="form-check form-switch">
                                                        <input
                                                            class="form-check-input"
                                                            type="checkbox"
                                                            role="switch"
                                                            [id]="'module-switch-' + module.key"
                                                            [checked]="moduleVisibility[module.key]"
                                                            (change)="toggleModuleVisibility(module.key, $event)" />
                                                        <label class="form-check-label" [for]="'module-switch-' + module.key"></label>
                                                    </div>
                                                </div>
                                                <div class="col" style="max-width: calc(100% - 50px);">
                                                    <div class="fw-semibold">{{ module.name }}</div>
                                                    <p class="small text-secondary mb-0">{{ module.description }}</p>
                                                </div>
                                            </div>
                                        </li>
                                    </ul>
                                </div>
                            </div>

                            <div class="card adminuiux-card mb-3 mb-lg-4">
                                <div class="card-header border-bottom">
                                    <h6 class="mb-0">Permisos por modulo</h6>
                                </div>
                                <div class="card-body p-0">
                                    <div class="table-responsive">
                                        <table class="table align-middle mb-0">
                                            <thead>
                                                <tr>
                                                    <th>Modulo</th>
                                                    <th>Agregar</th>
                                                    <th>Ver</th>
                                                    <th>Actualizar</th>
                                                    <th class="text-end">Mas</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                <ng-container *ngFor="let module of modulePermissions">
                                                    <tr *ngIf="moduleVisibility[module.key]">
                                                        <td>
                                                            <div class="fw-semibold">{{ module.name }}</div>
                                                            <p class="small text-secondary mb-0">{{ module.description }}</p>
                                                        </td>
                                                        <td>
                                                            <select
                                                                class="form-select form-select-sm"
                                                                [ngModel]="getActionScope(module.key, 'agregar')"
                                                                (ngModelChange)="updateActionScope(module.key, 'agregar', $event)">
                                                                <option *ngFor="let option of actionScopeOptions" [ngValue]="option.value">{{ option.label }}</option>
                                                            </select>
                                                        </td>
                                                        <td>
                                                            <select
                                                                class="form-select form-select-sm"
                                                                [ngModel]="getActionScope(module.key, 'ver')"
                                                                (ngModelChange)="updateActionScope(module.key, 'ver', $event)">
                                                                <option *ngFor="let option of actionScopeOptions" [ngValue]="option.value">{{ option.label }}</option>
                                                            </select>
                                                        </td>
                                                        <td>
                                                            <select
                                                                class="form-select form-select-sm"
                                                                [ngModel]="getActionScope(module.key, 'actualizar')"
                                                                (ngModelChange)="updateActionScope(module.key, 'actualizar', $event)">
                                                                <option *ngFor="let option of actionScopeOptions" [ngValue]="option.value">{{ option.label }}</option>
                                                            </select>
                                                        </td>
                                                        <td class="text-end">
                                                            <button class="btn btn-link btn-sm" type="button" (click)="toggleModuleDetails(module.key)">
                                                                Mas <i class="bi" [ngClass]="activeModuleKey === module.key ? 'bi-chevron-up' : 'bi-chevron-down'"></i>
                                                            </button>
                                                        </td>
                                                    </tr>
                                                    <tr *ngIf="moduleVisibility[module.key] && activeModuleKey === module.key">
                                                        <td colspan="5" class="p-0 border-0">
                                                            <div class="p-3 pt-0">
                                                                <div class="table-responsive border rounded">
                                                                    <table class="table table-sm align-middle mb-0">
                                                                        <thead>
                                                                            <tr>
                                                                                <th>Campo</th>
                                                                                <th>Permiso del campo</th>
                                                                            </tr>
                                                                        </thead>
                                                                        <tbody>
                                                                            <tr *ngFor="let field of module.fields">
                                                                                <td>{{ field.label }}</td>
                                                                                <td>
                                                                                    <select
                                                                                        class="form-select form-select-sm"
                                                                                        [ngModel]="getFieldPermission(module.key, field.id)"
                                                                                        (ngModelChange)="updateFieldPermission(module.key, field.id, $event)">
                                                                                        <option *ngFor="let option of fieldPermissionOptions" [ngValue]="option.value">{{ option.label }}</option>
                                                                                    </select>
                                                                                </td>
                                                                            </tr>
                                                                        </tbody>
                                                                    </table>
                                                                </div>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                </ng-container>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>

                            <h6 class="mb-3 mb-lg-4">Usuarios bajo este rol</h6>
                            <div class="input-group input-group-md rounded mb-2 mb-lg-3" style="--mw-dynamic: calc(100% - 42px)">
                                <span class="input-group-text text-theme-1"><i class="bi bi-people"></i></span>
                                <select class="choices" #choices3 multiple="">
                                    <option value="user1" selected>Kartikaa Joshi</option>
                                    <option value="user2" selected>Steven Jobs</option>
                                    <option value="user3">Martian Apprila</option>
                                    <option value="user4">Ken Williamson</option>
                                    <option value="user5">Jack Manas</option>
                                    <option value="user6">Corolla Protect</option>
                                </select>
                            </div>

                            <div class="d-block mb-2">
                                <a routerLink="/app/profile-professional" target="_blank" class="badge badge-lg badge-light text-bg-theme-1 rounded-5 mb-2 me-2">
                                    <figure class="avatar avatar-20 rounded-circle me-1 coverimg"><img src="assets/img/modern-ai-image/user-4.jpg" alt="" /></figure>
                                    James Wang
                                </a>
                                <a routerLink="/app/profile-professional" target="_blank" class="badge badge-lg badge-light text-bg-theme-1 rounded-5 mb-2 me-2">
                                    <figure class="avatar avatar-20 rounded-circle me-1 coverimg"><img src="assets/img/modern-ai-image/user-2.jpg" alt="" /></figure>
                                    Aliaa Shen
                                </a>
                                <a routerLink="/app/profile-professional" target="_blank" class="badge badge-lg badge-light text-bg-theme-1 rounded-5 mb-2 me-2">
                                    <figure class="avatar avatar-20 rounded-circle me-1 coverimg"><img src="assets/img/modern-ai-image/user-3.jpg" alt="" /></figure>
                                    Ketti Pattasa
                                </a>
                                <a routerLink="/app/profile-professional" target="_blank" class="badge badge-lg badge-light text-bg-theme-1 rounded-5 mb-2 me-2">
                                    <figure class="avatar avatar-20 rounded-circle me-1 coverimg"><img src="assets/img/modern-ai-image/user-1.jpg" alt="" /></figure>
                                    Max Smith
                                </a>
                            </div>
                            <p class="text-secondary">Los roles son grupos predefinidos para acceder al sistema en toda la aplicación. Las funciones restringidas o no asignadas no estarán disponibles para ese rol de usuario. Los roles se pueden editar y eliminar, y se pueden asignar a cualquier usuario registrado en el sistema.</p>
                        </div>
                    </div>
                </div>
            </div>

            <ng-container *ngIf="false" [ngTemplateOutlet]="rolesCarouselTpl"></ng-container>
        </div>
    `,
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class CompanyUserRolesComponent {
    @ViewChild("choices") mySelect!: ElementRef;
    @ViewChild("choices3") mySelect3!: ElementRef;
    deactivatedUsers: Record<string, boolean> = {};
    pendingSoftDeletePayloads: UserSoftDeletePayload[] = [];
    roles: AclRole[] = [];
    selectedRoleId: string | null = null;

    loadingRolePermissions = false;
    savingPermissions = false;
    permissionsDirty = false;
    private rolesLoaded = false;
    private modulesLoaded = false;

    aclMessage = "";

    readonly actionScopeOptions = [
        { value: "ninguno", label: "Ninguno" },
        { value: "propio", label: "Propio" },
        { value: "anadido", label: "Anadido" },
        { value: "todo", label: "Todo" },
    ];

    readonly fieldPermissionOptions = [
        { value: "ver", label: "Ver" },
        { value: "editar", label: "Editar" },
        { value: "actualizar", label: "Actualizar" },
        { value: "oculto", label: "Oculto" },
    ];

    private readonly defaultActionScope = "ninguno";
    private readonly defaultFieldPermission = "ver";
    private readonly supportedActions = ["agregar", "ver", "actualizar"];

    modulePermissions: RoleModuleView[] = [];

    moduleVisibility: Record<string, boolean> = {};

    activeModuleKey: string | null = null;

    get selectedRoleName(): string | null {
        const selected = this.roles.find((role) => role.id === this.selectedRoleId);
        return selected?.name ?? null;
    }

    constructor(
        private renderer: Renderer2,
        @Inject(DOCUMENT) private document: Document,
        private readonly aclApi: AclApiService,
        private readonly cdr: ChangeDetectorRef,
    ) { }

    ngOnInit(): void {
        this.loadAclData();
    }

    ngAfterViewInit() {
        const choices = new Choices(this.mySelect.nativeElement, {
            searchEnabled: true,
            removeItemButton: true,
            classNames: {
                containerOuter: ["choices", "maxwidth-dynamic"],
            } as ClassNames,
            placeholderValue: "Type...",
        });

        const choices3 = new Choices(this.mySelect3.nativeElement, {
            searchEnabled: true,
            removeItemButton: true,
            classNames: {
                containerOuter: ["choices", "maxwidth-dynamic"],
            } as ClassNames,
            placeholderValue: "Type...",
        });

        this.initAccessTooltips();
    }

    toggleModuleVisibility(moduleKey: string, event: Event): void {
        const input = event.target as HTMLInputElement;
        this.moduleVisibility[moduleKey] = input.checked;
        if (!input.checked && this.activeModuleKey === moduleKey) {
            this.activeModuleKey = null;
        }
        this.permissionsDirty = true;
    }

    toggleModuleDetails(moduleKey: string): void {
        this.activeModuleKey = this.activeModuleKey === moduleKey ? null : moduleKey;
    }

    selectRole(roleID: string): void {
        if (!roleID || this.selectedRoleId === roleID) {
            return;
        }

        this.selectedRoleId = roleID;
        this.permissionsDirty = false;
        this.reloadSelectedRolePermissions();
    }

    reloadSelectedRolePermissions(): void {
        if (!this.selectedRoleId || !this.modulesLoaded) {
            return;
        }

        this.loadRolePermissions(this.selectedRoleId);
    }

    getActionScope(moduleKey: string, actionName: string): string {
        const module = this.findModule(moduleKey);
        if (!module) {
            return this.defaultActionScope;
        }

        return module.actionScopes[actionName] ?? this.defaultActionScope;
    }

    updateActionScope(moduleKey: string, actionName: string, scope: string): void {
        const module = this.findModule(moduleKey);
        if (!module) {
            return;
        }

        module.actionScopes[actionName] = this.normalizeActionScope(scope);
        this.permissionsDirty = true;
    }

    getFieldPermission(moduleKey: string, fieldID: string): string {
        const module = this.findModule(moduleKey);
        if (!module) {
            return this.defaultFieldPermission;
        }

        return module.fieldPermissions[fieldID] ?? this.defaultFieldPermission;
    }

    updateFieldPermission(moduleKey: string, fieldID: string, permission: string): void {
        const module = this.findModule(moduleKey);
        if (!module) {
            return;
        }

        module.fieldPermissions[fieldID] = this.normalizeFieldPermission(permission);
        this.permissionsDirty = true;
    }

    saveRolePermissions(): void {
        if (!this.selectedRoleId || this.savingPermissions) {
            return;
        }

        this.savingPermissions = true;
        const roleID = this.selectedRoleId;
        const payload = {
            modules: this.buildPermissionPayload(),
        };

        this.aclApi.updateRolePermissions(roleID, payload).subscribe({
            next: () => {
                this.permissionsDirty = false;
                this.savingPermissions = false;
                this.aclMessage = `Permisos del rol ${this.selectedRoleName ?? "seleccionado"} guardados correctamente.`;
                this.reloadSelectedRolePermissions();
                this.cdr.detectChanges();
            },
            error: (error) => {
                this.savingPermissions = false;
                const backendError = (error?.message as string | undefined)?.trim();
                this.aclMessage = backendError || "No fue posible guardar permisos del rol.";
                this.cdr.detectChanges();
            },
        });
    }

    createQuickRole(): void {
        const roleName = (window.prompt("Nombre del nuevo rol") ?? "").trim();
        if (!roleName) {
            return;
        }

        const roleDescription = (window.prompt("Descripcion del rol (opcional)") ?? "").trim();

        this.aclApi
            .createRole({
                name: roleName,
                description: roleDescription,
            })
            .subscribe({
                next: (response) => {
                    this.roles = [...this.roles, response.role];
                    this.selectedRoleId = response.role.id;
                    this.aclMessage = `Rol ${response.role.name} creado. Seeds: ${response.seedSummary.moduleAccess} modulos, ${response.seedSummary.actionPermissions} acciones, ${response.seedSummary.fieldPermissions} campos.`;
                    this.reloadSelectedRolePermissions();
                    this.cdr.detectChanges();
                },
                error: (error) => {
                    const backendError = (error?.message as string | undefined)?.trim();
                    this.aclMessage = backendError || "No fue posible crear el rol en backend.";
                    this.cdr.detectChanges();
                },
            });
    }

    softDeactivateUser(userEmail: string): void {
        if (this.deactivatedUsers[userEmail]) {
            return;
        }

        this.deactivatedUsers[userEmail] = true;
        const payload = this.buildSoftDeletePayload(userEmail);
        this.pendingSoftDeletePayloads.push(payload);

        this.aclApi.softDeleteUsers([payload]).subscribe({
            next: (processed) => {
                if (processed <= 0) {
                    this.deactivatedUsers[userEmail] = false;
                    this.aclMessage = `No se pudo desactivar ${userEmail}.`;
                    this.cdr.detectChanges();
                    return;
                }
                this.aclMessage = `Usuario ${userEmail} desactivado correctamente.`;
                this.cdr.detectChanges();
            },
            error: () => {
                this.deactivatedUsers[userEmail] = false;
                this.aclMessage = `No se pudo desactivar ${userEmail}.`;
                this.cdr.detectChanges();
            },
        });
    }

    isUserDeactivated(userEmail: string): boolean {
        return !!this.deactivatedUsers[userEmail];
    }

    private initAccessTooltips(): void {
        const tooltipElements = this.document.querySelectorAll('[data-access-tooltip="true"]');
        const bootstrapRef = (window as any).bootstrap;
        if (!bootstrapRef?.Tooltip) {
            return;
        }

        tooltipElements.forEach((element) => {
            new bootstrapRef.Tooltip(element, {
                trigger: "hover focus",
                html: true,
                placement: "bottom",
            });
        });
    }

    getAccessTooltip(role: string): string {
        return `
            <div class="text-start">
                <div class="fw-semibold mb-1">Permisos asignados</div>
                <div class="small mb-1"><b>Rol:</b> ${role}</div>
                <div class="small">Modulo de horarios</div>
                <div class="small">Modulo de registro de horas</div>
                <div class="small">Modulo de gastos de caja menor</div>
                <div class="small">Modulo de proveedores</div>
            </div>
        `;
    }

    private buildSoftDeletePayload(userEmail: string): UserSoftDeletePayload {
        return {
            userEmail,
            action: "SOFT_DELETE",
            status: "INACTIVE",
            softDelete: true,
            requestedAt: new Date().toISOString(),
            source: "company-user-roles",
        };
    }

    innersidebar(): void {
        // Access the body element via the injected DOCUMENT
        const body = this.document.body;
        const className = "innermenu-close";

        // Check if the class exists and toggle it using native classList
        // This is safe because Renderer2 is used for add/remove,
        // and we're checking the native element's classList.
        if (body.classList.contains(className)) {
            this.renderer.removeClass(body, className);
        } else {
            this.renderer.addClass(body, className);
        }
    }

    private loadAclData(): void {
        this.aclApi.listRoles().subscribe({
            next: (roles) => {
                this.roles = roles;
                this.rolesLoaded = true;

                if (!this.roles.length) {
                    this.selectedRoleId = null;
                    this.permissionsDirty = false;
                    return;
                }

                if (!this.selectedRoleId || !this.roles.some((role) => role.id === this.selectedRoleId)) {
                    this.selectedRoleId = this.roles[0].id;
                }

                this.maybeLoadSelectedRolePermissions();
                this.cdr.detectChanges();
            },
            error: () => {
                this.roles = [];
                this.selectedRoleId = null;
                this.rolesLoaded = true;
                this.aclMessage = "No fue posible cargar roles desde backend.";
                this.cdr.detectChanges();
            },
        });

        this.aclApi.listModules().subscribe({
            next: (modules) => {
                this.applyModules(modules);
                this.modulesLoaded = true;
                this.maybeLoadSelectedRolePermissions();
                this.cdr.detectChanges();
            },
            error: () => {
                this.modulesLoaded = true;
                this.modulePermissions = [];
                this.moduleVisibility = {};
                this.activeModuleKey = null;
                this.aclMessage = "No fue posible cargar modulos ACL desde backend.";
                this.cdr.detectChanges();
            },
        });
    }

    private maybeLoadSelectedRolePermissions(): void {
        if (!this.rolesLoaded || !this.modulesLoaded || !this.selectedRoleId) {
            return;
        }

        this.loadRolePermissions(this.selectedRoleId);
    }

    private loadRolePermissions(roleID: string): void {
        this.loadingRolePermissions = true;

        this.aclApi.getRolePermissions(roleID).subscribe({
            next: (response) => {
                if (this.selectedRoleId !== roleID) {
                    return;
                }

                this.applyRolePermissions(response.modules);
                this.permissionsDirty = false;
                this.loadingRolePermissions = false;
                this.cdr.detectChanges();
            },
            error: (error) => {
                if (this.selectedRoleId !== roleID) {
                    return;
                }

                this.loadingRolePermissions = false;
                const backendError = (error?.message as string | undefined)?.trim();
                this.aclMessage = backendError || "No fue posible cargar permisos del rol.";
                this.cdr.detectChanges();
            },
        });
    }

    private applyModules(modules: AclModule[]): void {
        if (!modules.length) {
            this.modulePermissions = [];
            this.moduleVisibility = {};
            this.activeModuleKey = null;
            return;
        }

        this.modulePermissions = modules
            .slice()
            .sort((left, right) => left.sortOrder - right.sortOrder)
            .map((module) => ({
                id: module.id,
                key: module.slug,
                name: module.name,
                description: module.description,
                fields: module.fields
                    .slice()
                    .sort((left, right) => left.sortOrder - right.sortOrder)
                    .map((field) => ({
                        id: field.id,
                        slug: field.slug,
                        label: field.label,
                    })),
                actionScopes: this.buildDefaultActionScopes(),
                fieldPermissions: this.buildDefaultFieldPermissions(
                    module.fields
                        .slice()
                        .sort((left, right) => left.sortOrder - right.sortOrder)
                        .map((field) => ({
                            id: field.id,
                            slug: field.slug,
                            label: field.label,
                        }))
                ),
            }));

        const nextVisibility: Record<string, boolean> = {};
        for (const module of this.modulePermissions) {
            nextVisibility[module.key] = this.moduleVisibility[module.key] ?? true;
        }

        this.moduleVisibility = nextVisibility;

        if (!this.activeModuleKey || !this.moduleVisibility[this.activeModuleKey]) {
            this.activeModuleKey = this.modulePermissions[0]?.key ?? null;
        }
    }

    private applyRolePermissions(modules: RoleModulePermission[]): void {
        const moduleByID = new Map<string, RoleModulePermission>(modules.map((module) => [module.moduleId, module]));

        for (const module of this.modulePermissions) {
            const roleModule = moduleByID.get(module.id);
            if (!roleModule) {
                continue;
            }

            this.moduleVisibility[module.key] = !!roleModule.isEnabled;

            const actionScopes = this.buildDefaultActionScopes();
            for (const actionPermission of roleModule.actions ?? []) {
                const actionName = this.normalizeToken(actionPermission.action);
                if (!this.supportedActions.includes(actionName)) {
                    continue;
                }

                actionScopes[actionName] = this.normalizeActionScope(actionPermission.scope);
            }
            module.actionScopes = actionScopes;

            const fieldPermissions = this.buildDefaultFieldPermissions(module.fields);
            for (const fieldPermission of roleModule.fields ?? []) {
                const fieldID = fieldPermission.fieldId;
                if (!(fieldID in fieldPermissions)) {
                    continue;
                }

                fieldPermissions[fieldID] = this.normalizeFieldPermission(fieldPermission.permission);
            }
            module.fieldPermissions = fieldPermissions;
        }

        if (!this.activeModuleKey || !this.moduleVisibility[this.activeModuleKey]) {
            const firstEnabled = this.modulePermissions.find((module) => this.moduleVisibility[module.key]);
            this.activeModuleKey = firstEnabled?.key ?? this.modulePermissions[0]?.key ?? null;
        }
    }

    private buildPermissionPayload(): RoleModulePermission[] {
        return this.modulePermissions.map((module) => ({
            moduleId: module.id,
            moduleSlug: module.key,
            isEnabled: !!this.moduleVisibility[module.key],
            actions: this.supportedActions.map((actionName) => ({
                action: actionName,
                scope: this.normalizeActionScope(module.actionScopes[actionName] ?? this.defaultActionScope),
            })),
            fields: module.fields.map((field) => ({
                fieldId: field.id,
                fieldSlug: field.slug,
                permission: this.normalizeFieldPermission(module.fieldPermissions[field.id] ?? this.defaultFieldPermission),
            })),
        }));
    }

    private findModule(moduleKey: string): RoleModuleView | undefined {
        return this.modulePermissions.find((module) => module.key === moduleKey);
    }

    private buildDefaultActionScopes(): Record<string, string> {
        const defaults: Record<string, string> = {};
        for (const actionName of this.supportedActions) {
            defaults[actionName] = this.defaultActionScope;
        }
        return defaults;
    }

    private buildDefaultFieldPermissions(fields: RoleModuleFieldView[]): Record<string, string> {
        const defaults: Record<string, string> = {};
        for (const field of fields) {
            defaults[field.id] = this.defaultFieldPermission;
        }
        return defaults;
    }

    private normalizeActionScope(scope: string): string {
        const normalized = this.normalizeToken(scope);
        return this.actionScopeOptions.some((option) => option.value === normalized) ? normalized : this.defaultActionScope;
    }

    private normalizeFieldPermission(permission: string): string {
        const normalized = this.normalizeToken(permission);
        return this.fieldPermissionOptions.some((option) => option.value === normalized) ? normalized : this.defaultFieldPermission;
    }

    private normalizeToken(raw: string): string {
        return String(raw ?? "").trim().toLowerCase();
    }
}
