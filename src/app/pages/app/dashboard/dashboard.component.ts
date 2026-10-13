import { Component, OnInit, AfterViewInit, ViewChild, ElementRef, CUSTOM_ELEMENTS_SCHEMA } from "@angular/core";
import { CurrencyPipe, NgFor } from "@angular/common";
import { RouterLink } from "@angular/router";
import Swiper from "swiper";
import { register } from "swiper/element/bundle";
register();
//import DataTable from "datatables.net-dt";
//import "datatables.net-responsive-dt";
import Choices, { ClassNames } from "choices.js";
import { DaterangePickerRangesComponent } from "../../../components/input-fields/daterange-picker/daterange-picker-ranges.component";
import { CircleProgressYellowBlankComponent } from "../../../components/charts/circle-progress-yellow-blank.component";
import { CircleProgressBlueBlankComponent } from "../../../components/charts/circle-progress-blue-blank.component";
import { AreaRedChartjs1000tComponent } from "../../../components/charts/area-red-chartjs-100-0t.component";
import { CrmClientRecord, calculateDaysInArrears, getCrmClients } from "../crm/crm-clients.store";
import { getAllProspectEquipmentItems } from "../crm/crm-prospect-equipment.store";
import { FinanceAccount, FinanceAccountsStore } from "../finance/finance-accounts.store";

type RiskProjectStatus = "bien" | "terminado" | "problemas";

interface RiskProjectSummary {
    id: number;
    name: string;
    status: RiskProjectStatus;
    statusLabel: string;
    progress: number;
    budgetEstimated: number;
    budgetUsed: number;
    lastAction: string;
    lastActionAt: string;
    recommendation: string;
    recommendationPriority: "Alta" | "Media" | "Baja";
}

type CommercialPeriod = "semanal" | "mensual" | "trimestral";

interface CommercialZoneKpi {
    zone: string;
    assignedVisits: number;
    completedVisits: number;
    prospectsWithoutVisit: number;
    opportunitiesWithoutEquipment: number;
    effectiveness: number;
}

interface CommercialPeriodSnapshot {
    label: string;
    actionCount: number;
    followUpCount: number;
    zones: CommercialZoneKpi[];
}

interface HomeCreditChartRow {
    id: number;
    clientName: string;
    company: string;
    limit: number;
    consumed: number;
    utilization: number;
    arrearsDays: number;
}

@Component({
    selector: "app-dashboard",
    standalone: true,
    imports: [RouterLink, NgFor, CurrencyPipe, DaterangePickerRangesComponent, AreaRedChartjs1000tComponent, CircleProgressBlueBlankComponent, CircleProgressYellowBlankComponent],
    template: `
        <!-- page title -->
        <div class="container-fluid py-3">
            <div class="row gx-3 gx-lg-4 align-items-center page-title">
                <div class="col col-sm mb-3 mb-sm-0 order-1">
                    <h5 class="mb-0">My Dashboard</h5>
                    <p class="text-secondary small">This is personal intranet</p>
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
                                <h6 class="mb-0">Orders:</h6>
                                <p class="text-secondary small">1256 orders last week</p>
                            </div>
                            <ul class="list-group list-group-flush bg-transparent border-0 mb-2">
                                <li class="list-group-item">
                                    <div class="row gx-3 gx-lg-4">
                                        <div class="col">Online Orders</div>
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
                                        <div class="col">Offline Orders</div>
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
                                    <div class="col"><button class="btn btn-outline-secondary border ddclose">cancel</button></div>
                                    <div class="col-auto">
                                        <button class="btn btn-theme">Save</button>
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
                                <span class="visually-hidden">New alerts</span>
                            </span>
                        </span>
                    </a>
                </div>
            </div>
        </div>

        <!-- content -->
        <div class="container mt-3" id="main-content">
            <!-- welcome bar -->
            <div class="row gx-3 gx-lg-4 align-items-center">
                <!-- welcome message -->
                <div class="col-12 col-md-7 col-xl-6 col-xxl-5 mb-3 mb-lg-4">
                    <p class="h2 fw-normal mb-0">Bienvenido/a,</p>
                    <h1 class="display-3 fw-medium text-gradient">Ing. José</h1>

                    <!-- Swiper daily quote -->
                    <swiper-container slides-per-view="1" space-between="0" autoplay="true" class="swiper mt-4">
                        <swiper-slide>
                            <div class="row gx-3 gx-xl-4">
                                <div class="col-auto">
                                    <i class="bi bi-cake fs-5 avatar avatar-50 rounded-circle bg-theme-1-subtle text-theme-1 theme-pink"></i>
                                </div>
                                <div class="col">
                                    <a routerLink="/app/profile-professional" class="style-none rounded-5 bg-theme-l-gradient p-1 d-inline-block mb-1 me-2">
                                        <figure class="avatar avatar-30 rounded-circle me-1 coverimg"><img src="assets/img/modern-ai-image/user-4.jpg" alt="" /></figure>
                                        James Wang <i class="bi bi-chat-right-dots vm mx-2"></i>
                                    </a>
                                    <a routerLink="/app/profile-professional" class="style-none rounded-5 bg-theme-l-gradient p-1 d-inline-block mb-1 me-2">
                                        <figure class="avatar avatar-30 rounded-circle me-1 coverimg"><img src="assets/img/modern-ai-image/user-2.jpg" alt="" /></figure>
                                        Millie Tyson <i class="bi bi-chat-right-dots vm mx-2"></i>
                                    </a>
                                    <p class="text-secondary">Hoy están de <span class="fw-bold">cumpleaños</span> 5 socios y nuestro CEO.</p>
                                </div>
                            </div>
                        </swiper-slide>
                        <swiper-slide>
                            <div class="row gx-3 gx-xl-4">
                                <div class="col-auto">
                                    <i class="bi bi-quote fs-4 avatar avatar-50 rounded-circle bg-theme-1-subtle text-theme-1 theme-grey"></i>
                                </div>
                                <div class="col">
                                    <h5 class="mb-1">Los ganadores no hacen cosas diferentes, hacen las cosas de manera diferente</h5>
                                    <p class="text-secondary">Shiv Khera - Puedes Ganar: una guía paso a paso para grandes triunfadores</p>
                                </div>
                            </div>
                        </swiper-slide>
                    </swiper-container>
                </div>

                <!-- rank and progress -->
                <div class="col-12 col-md-auto col-xxl-3 ms-auto align-self-center">
                    <div class="row gx-3 gx-lg-4 mb-3 mb-lg-4">
                        <div class="col col-md col-lg text-center">
                            <i class="bi bi-trophy h5 avatar avatar-50 bg-theme-r-gradient theme-purple text-white rounded-circle mb-2"></i>
                            <h3 class="increamentcount mb-0">{{ completedProjects }}</h3>
                            <p class="small text-secondary text-truncated">Terminados</p>
                        </div>
                        <div class="col col-md col-lg text-center">
                            <i class="bi bi-award h5 avatar avatar-50 bg-theme-r-gradient theme-orange text-white rounded-circle mb-2"></i>
                            <h3 class="increamentcount mb-0">{{ inProgressProjects }}</h3>
                            <p class="small text-secondary text-truncated">En curso</p>
                        </div>
                        <div class="col col-md col-lg text-center">
                            <i class="bi bi-clipboard-check h5 avatar avatar-50 bg-theme-r-gradient theme-teal text-white rounded-circle mb-2"></i>
                            <h3 class="increamentcount mb-0">{{ delayedProjects }}</h3>
                            <p class="small text-secondary text-truncated">Atrasados</p>
                        </div>
                    </div>
                    <div class="row gx-3 gx-lg-4 align-items-center mb-3 mb-lg-4">
                        <div class="col-auto">
                            <i class="bi bi-star h5 avatar avatar-50 bg-theme-1 text-white theme-yellow rounded-circle"></i>
                        </div>
                        <div class="col">
                            <p class="mb-2 text-truncated">{{ lastViewedProjectName }}</p>
                            <div class="progress height-dynamic mb-1 bg-theme-1-subtle" style="--h-dynamic:5px">
                                <div
                                    class="progress-bar bg-theme-1"
                                    role="progressbar"
                                    [style.width.%]="lastViewedProjectProgress"
                                    [attr.aria-valuenow]="lastViewedProjectProgress"
                                    aria-valuemin="0"
                                    aria-valuemax="100"
                                ></div>
                            </div>
                            <p class="text-secondary small mb-0">{{ lastViewedProjectProgress }}% de avance</p>
                        </div>
                    </div>
                </div>

                <!-- Tips swiper message -->
                <div class="col-auto col-xl-3 d-none d-xxl-block h-100 mb-3 mb-lg-4">
                    <div class="card adminuiux-card h-100 bg-r-gradient theme-yellow">
                        <div class="card-header">
                            <div class="row gx-3 gx-lg-4 align-items-center">
                                <div class="col">
                                    <h6>
                                        <i class="bi bi-lightbulb text-warning me-1"></i>
                                        Tips
                                    </h6>
                                </div>
                                <div class="col-auto">
                                    <button class="btn btn-sm btn-outline-warning px-2 py-0" id="starttour" data-bs-toggle="tooltip" data-bs-placement="top" title="Start Tour"><i class="bi bi-play"></i> Tour</button>
                                    <div class="dropdown d-inline-block ms-2">
                                        <a class="text-secondary no-caret" data-bs-toggle="dropdown" data-bs-auto-close="outside" aria-expanded="false" data-bs-display="static" role="button">
                                            <i class="bi bi-three-dots-vertical"></i>
                                        </a>
                                        <ul class="dropdown-menu dropdown-menu-end">
                                            <li class="dropstart open-left ">
                                                <a class="dropdown-item no-caret dropdown-toggle" role="button" data-bs-toggle="dropdown" data-bs-auto-close="outside" aria-expanded="false" data-bs-display="static"> Customize Tips </a>
                                                <div class="dropdown-menu dropdown-menu-start width-300">
                                                    <div class="dropdown-item">
                                                        <h6 class="mb-0">Tips:</h6>
                                                        <p class="text-secondary">1656 visited this week</p>
                                                    </div>
                                                    <div class="px-2">
                                                        <div class="input-group input-group-md rounded" style="--mw-dynamic: 226px;">
                                                            <span class="input-group-text text-theme-1"><i class="bi bi-lightbulb"></i></span>
                                                            <select class="form-control choices" #choices2 multiple>
                                                                <option value="San Francisco">San Francisco</option>
                                                                <option value="New York">New York</option>
                                                                <option value="London">London</option>
                                                                <option value="Chicago">Chicago</option>
                                                                <option value="India" selected>India</option>
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
                                                    <ul class="list-group list-group-flush bg-none mb-2">
                                                        <li class="list-group-item">
                                                            <div class="row gx-3 gx-lg-4">
                                                                <div class="col">Includes System</div>
                                                                <div class="col-auto">
                                                                    <div class="form-check form-switch">
                                                                        <input class="form-check-input" type="checkbox" role="switch" id="tipswitch1" />
                                                                        <label class="form-check-label" for="tipswitch1"></label>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </li>
                                                        <li class="list-group-item">
                                                            <div class="row gx-3 gx-lg-4">
                                                                <div class="col">Apps Shortcuts</div>
                                                                <div class="col-auto">
                                                                    <div class="form-check form-switch">
                                                                        <input class="form-check-input" type="checkbox" role="switch" id="tipswitch2" checked="" />
                                                                        <label class="form-check-label" for="tipswitch2"></label>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </li>
                                                    </ul>
                                                    <div class="dropdown-item">
                                                        <div class="row gx-3 gx-lg-4">
                                                            <div class="col"><button class="btn btn-outline-secondary border ddclose">cancel</button></div>
                                                            <div class="col-auto">
                                                                <button class="btn btn-theme">Save</button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </li>
                                            <li><a class="dropdown-item" href="javascript:void(0)">Move</a></li>
                                            <li><a class="dropdown-item text-danger" href="javascript:void(0)">Delete</a></li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="card-body">
                            <!-- image swiper -->
                            <swiper-container slides-per-view="1" space-between="0" autoplay="true" class="swiper swipernav width-200 h-100 text-center">
                                <swiper-slide>
                                    <i class="bi bi-chat-right-dots h4 text-success mb-3 d-block"></i>
                                    <h6>Chat Communication</h6>
                                    <p class="small text-secondary">From the top right corner you can have access to chat panel and click on any user chat window interface will be open.</p>
                                </swiper-slide>
                                <swiper-slide>
                                    <i class="bi bi-person h4 text-theme-1 mb-3 d-block"></i>
                                    <h6>Onboarding</h6>
                                    <p class="small text-secondary">User on-boarding comes in the sign up flow. Complete sign up process you will see the on-boarding pages at best UI UX.</p>
                                </swiper-slide>
                                <swiper-slide>
                                    <i class="bi bi-search h4 text-danger mb-3 d-block"></i>
                                    <h6>Search Result</h6>
                                    <p class="small text-secondary">Try to type something in search box at header and big search result box will be appeared right away.</p>
                                </swiper-slide>
                                <swiper-slide>
                                    <i class="bi bi-heart h4 text-danger mb-3 d-block"></i>
                                    <h6 class="text-gradient">Spread love</h6>
                                    <p class="small text-secondary">If you like our template <b class="text-gradient">please share</b> to the beautiful world. World is waiting to get more good things. <i class="text-danger bi bi-heart-fill"></i></p>
                                </swiper-slide>
                            </swiper-container>
                            <!-- image swiper ends -->
                        </div>
                    </div>
                </div>
            </div>

            <div class="row gx-3 gx-lg-4">
                <div class="col-12 mb-3 mb-lg-4">
                    <div class="card adminuiux-card home-credit-card">
                        <div class="card-header">
                            <div class="row gx-3 gx-lg-4 align-items-center">
                                <div class="col">
                                    <h6 class="mb-0">Home de clientes a crédito</h6>
                                    <p class="text-secondary small mb-0">Resumen ejecutivo de cupo, consumo y mora.</p>
                                </div>
                                <div class="col-auto">
                                    <a class="btn btn-sm btn-outline-theme" routerLink="/app/finance-clientes-credito">Ver gestión</a>
                                </div>
                            </div>
                        </div>
                        <div class="card-body">
                            @if (homeCreditRows.length) {
                                <div class="row gx-3 gx-lg-4 align-items-center mb-3">
                                    <div class="col-12 col-xl-3">
                                        <div class="home-credit-ring-wrap">
                                            <div class="home-credit-ring" [style.--credit-usage]="homeCreditUtilization + '%'">
                                                <strong>{{ homeCreditUtilization }}%</strong>
                                                <small>uso global</small>
                                            </div>
                                        </div>
                                    </div>

                                    <div class="col-12 col-xl-9">
                                        <div class="home-credit-kpis">
                                            <div class="home-credit-kpi">
                                                <span>Cupo total</span>
                                                <strong>{{ homeCreditTotalLimit | currency: "COP" : "symbol" : "1.0-0" }}</strong>
                                            </div>
                                            <div class="home-credit-kpi">
                                                <span>Consumido</span>
                                                <strong>{{ homeCreditTotalConsumed | currency: "COP" : "symbol" : "1.0-0" }}</strong>
                                            </div>
                                            <div class="home-credit-kpi">
                                                <span>Disponible</span>
                                                <strong>{{ homeCreditAvailable | currency: "COP" : "symbol" : "1.0-0" }}</strong>
                                            </div>
                                            <div class="home-credit-kpi">
                                                <span>Clientes en mora</span>
                                                <strong>{{ homeCreditClientsInArrears }}</strong>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div class="home-credit-chart">
                                    <div class="home-credit-chart__row" *ngFor="let row of homeCreditRows">
                                        <div class="home-credit-chart__identity">
                                            <strong>{{ row.clientName }}</strong>
                                            <small>{{ row.company }}</small>
                                        </div>
                                        <div class="home-credit-chart__bar-wrap">
                                            <div class="home-credit-chart__track">
                                                <div
                                                    class="home-credit-chart__bar"
                                                    [class.warning]="row.utilization >= 75 && row.utilization < 90"
                                                    [class.danger]="row.utilization >= 90 || row.arrearsDays > 0"
                                                    [style.width.%]="row.utilization"
                                                ></div>
                                            </div>
                                        </div>
                                        <div class="home-credit-chart__numbers">
                                            <small>{{ row.consumed | currency: "COP" : "symbol" : "1.0-0" }} / {{ row.limit | currency: "COP" : "symbol" : "1.0-0" }}</small>
                                            <strong>{{ row.utilization }}%</strong>
                                            @if (row.arrearsDays > 0) {
                                                <span class="badge rounded-pill text-bg-danger">Mora {{ row.arrearsDays }} d</span>
                                            }
                                        </div>
                                    </div>
                                </div>
                            } @else {
                                <p class="text-secondary mb-0">No hay clientes con crédito activo para mostrar en este resumen.</p>
                            }
                        </div>
                    </div>
                </div>
            </div>

            <!-- content -->
            <div class="row gx-3 gx-lg-4">
                <div class="col-12 mb-3 mb-lg-4">
                    <div class="card adminuiux-card">
                        <div class="card-header">
                            <div class="row gx-3 gx-lg-4 align-items-center">
                                <div class="col">
                                    <h6 class="mb-0">Proyectos en riesgo</h6>
                                    <p class="text-secondary small mb-0">Mostrando {{ displayedRiskProjects.length }} de {{ riskProjects.length }} proyectos</p>
                                </div>
                                <div class="col-auto">
                                    <a class="btn btn-sm btn-outline-theme" routerLink="/app/project-projects">Ver todos</a>
                                </div>
                            </div>
                        </div>
                        <div class="card-body">
                            <div class="d-flex flex-wrap gap-2 mb-3">
                                <button
                                    type="button"
                                    class="btn btn-sm"
                                    *ngFor="let project of displayedRiskProjects"
                                    [class.btn-theme]="project.id === selectedRiskProject.id"
                                    [class.btn-outline-secondary]="project.id !== selectedRiskProject.id"
                                    (click)="selectRiskProject(project)"
                                >
                                    {{ project.name }}
                                </button>
                            </div>

                            <div class="risk-selected-wrap p-3 mb-3">
                                <div class="row gx-3 align-items-center">
                                    <div class="col">
                                        <h5 class="mb-1">{{ selectedRiskProject.name }}</h5>
                                        <p class="text-secondary small mb-0">Tablero de salud del proyecto</p>
                                    </div>
                                    <div class="col-auto">
                                        <span
                                            class="badge rounded-pill"
                                            [class.bg-success]="selectedRiskProject.status === 'terminado'"
                                            [class.bg-warning]="selectedRiskProject.status === 'bien'"
                                            [class.bg-danger]="selectedRiskProject.status === 'problemas'"
                                        >
                                            {{ selectedRiskProject.statusLabel }}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div class="row gx-3 gx-lg-4 align-items-stretch">
                                <div class="col-12 col-md-6 col-xxl-3 d-flex">
                                    <div class="card adminuiux-card mb-3 mb-lg-4 w-100 h-100 risk-kpi-card">
                                        <div class="card-body risk-kpi-body">
                                            <div class="row gx-3 align-items-center h-100 w-100">
                                                <div class="col-auto">
                                                    <div class="position-relative">
                                                        <app-circle-progress-blue-blank class="avatar avatar-60 rounded-circle"></app-circle-progress-blue-blank>
                                                        <div class="avatar avatar-40 h5 bg-theme-1-subtle text-theme-1 rounded-circle position-absolute top-50 start-50 translate-middle">
                                                            <i class="bi bi-graph-up-arrow"></i>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div class="col">
                                                    <p class="text-secondary small mb-1">% de avance</p>
                                                    <h5 class="mb-2">{{ selectedRiskProject.progress }}<small>%</small></h5>
                                                    <div class="progress height-dynamic mb-2 bg-theme-1-subtle" style="--h-dynamic: 5px;">
                                                        <div class="progress-bar bg-theme-1" role="progressbar" [style.width.%]="selectedRiskProject.progress" [attr.aria-valuenow]="selectedRiskProject.progress" aria-valuemin="0" aria-valuemax="100"></div>
                                                    </div>
                                                    <p class="small text-secondary mb-0">Faltante: {{ progressRemaining }}%</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div class="col-12 col-md-6 col-xxl-3 d-flex">
                                    <div class="card adminuiux-card mb-3 mb-lg-4 theme-yellow w-100 h-100 risk-kpi-card">
                                        <div class="card-body risk-kpi-body">
                                            <div class="row gx-3 align-items-center h-100 w-100">
                                                <div class="col-auto">
                                                    <div class="position-relative">
                                                        <app-circle-progress-yellow-blank class="avatar avatar-60 rounded-circle"></app-circle-progress-yellow-blank>
                                                        <div class="avatar avatar-40 h5 bg-theme-1-subtle text-theme-1 theme-yellow rounded-circle position-absolute top-50 start-50 translate-middle">
                                                            <i class="bi bi-cash-coin"></i>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div class="col">
                                                    <p class="text-secondary small mb-1">Presupuesto estimado vs consumido</p>
                                                    <h6 class="mb-1">{{ formatCurrency(selectedRiskProject.budgetEstimated) }}</h6>
                                                    <p class="text-secondary small mb-2">Consumido: {{ formatCurrency(selectedRiskProject.budgetUsed) }}</p>
                                                    <div class="progress height-dynamic bg-theme-1-subtle" style="--h-dynamic: 5px;">
                                                        <div class="progress-bar bg-theme-1" role="progressbar" [style.width.%]="selectedBudgetConsumptionPercent" [attr.aria-valuenow]="selectedBudgetConsumptionPercent" aria-valuemin="0" aria-valuemax="100"></div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div class="col-12 col-md-6 col-xxl-3 d-flex">
                                    <div class="card adminuiux-card mb-3 mb-lg-4 theme-red w-100 h-100 risk-kpi-card">
                                        <div class="card-body risk-kpi-body">
                                            <div class="row gx-3 gx-lg-4 align-items-center h-100 w-100">
                                                <div class="col-auto">
                                                    <div class="avatar avatar-60 h5 bg-theme-1-subtle text-theme-1 theme-red rounded-circle">
                                                        <i class="bi bi-clock-history"></i>
                                                    </div>
                                                </div>
                                                <div class="col">
                                                    <p class="text-secondary small mb-1">Ultima actuacion</p>
                                                    <p class="mb-1 risk-kpi-note">{{ selectedRiskProject.lastAction }}</p>
                                                    <p class="small text-secondary mb-0">{{ selectedRiskProject.lastActionAt }}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div class="col-12 col-md-6 col-xxl-3 d-flex">
                                    <div class="card adminuiux-card mb-3 mb-lg-4 theme-green w-100 h-100 risk-kpi-card">
                                        <div class="card-body risk-kpi-body">
                                            <div class="row gx-3 gx-lg-4 align-items-center h-100 w-100">
                                                <div class="col-auto">
                                                    <div class="avatar avatar-60 h5 bg-theme-1 theme-green text-white rounded-circle">
                                                        <i class="bi bi-lightbulb"></i>
                                                    </div>
                                                </div>
                                                <div class="col">
                                                    <p class="text-secondary small mb-1">Recomendacion</p>
                                                    <p class="mb-1 risk-kpi-note">{{ selectedRiskProject.recommendation }}</p>
                                                    <p class="small text-secondary mb-0">Prioridad: {{ selectedRiskProject.recommendationPriority }}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="row gx-3 gx-lg-4">
                <div class="col-12 mb-3 mb-lg-4">
                    <div class="card adminuiux-card commercial-kpi-card">
                        <div class="card-header">
                            <div class="row gx-3 gx-lg-4 align-items-center">
                                <div class="col">
                                    <h6 class="mb-0">KPIs comerciales</h6>
                                    <p class="text-secondary small mb-0">Eficiencia por zona, ventanas sin visita/sin equipo y analitica periodizada.</p>
                                </div>
                                <div class="col-12 col-md-auto">
                                    <div class="btn-group btn-group-sm w-100 w-md-auto" role="group" aria-label="Periodo comercial">
                                        <button
                                            type="button"
                                            class="btn"
                                            *ngFor="let period of commercialPeriodOptions"
                                            [class.btn-theme]="period.value === selectedCommercialPeriod"
                                            [class.btn-outline-secondary]="period.value !== selectedCommercialPeriod"
                                            (click)="setCommercialPeriod(period.value)">
                                            {{ period.label }}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="card-body">
                            <div class="commercial-period-label mb-3">{{ selectedCommercialSnapshot.label }}</div>
                            <div class="row gx-3 gy-3 mb-3">
                                <div class="col-12 col-md-6 col-xl-3">
                                    <div class="commercial-metric-box h-100">
                                        <p class="small text-secondary mb-1">Eficiencia por zona</p>
                                        <h5 class="mb-1">{{ zoneEfficiencyAverage }}%</h5>
                                        <p class="small mb-0">Promedio ponderado de visitas efectivas.</p>
                                    </div>
                                </div>
                                <div class="col-12 col-md-6 col-xl-3">
                                    <div class="commercial-metric-box h-100 warning">
                                        <p class="small text-secondary mb-1">Ventana sin visita</p>
                                        <h5 class="mb-1">{{ noVisitWindowCount }} casos</h5>
                                        <p class="small mb-0">{{ noVisitRatio }}% sobre visitas programadas.</p>
                                    </div>
                                </div>
                                <div class="col-12 col-md-6 col-xl-3">
                                    <div class="commercial-metric-box h-100 danger">
                                        <p class="small text-secondary mb-1">Ventana sin equipo</p>
                                        <h5 class="mb-1">{{ noEquipmentWindowCount }} casos</h5>
                                        <p class="small mb-0">{{ noEquipmentRatio }}% sobre visitas efectivas.</p>
                                    </div>
                                </div>
                                <div class="col-12 col-md-6 col-xl-3">
                                    <div class="commercial-metric-box h-100 success">
                                        <p class="small text-secondary mb-1">Analitica de acciones</p>
                                        <h5 class="mb-1">{{ actionExecutionRate }}%</h5>
                                        <p class="small mb-0">{{ selectedCommercialSnapshot.actionCount }} acciones sobre {{ selectedCommercialSnapshot.followUpCount }} seguimientos.</p>
                                    </div>
                                </div>
                            </div>

                            <div class="table-responsive border rounded">
                                <table class="table align-middle mb-0">
                                    <thead>
                                        <tr>
                                            <th>Zona</th>
                                            <th class="text-end">Visitas programadas</th>
                                            <th class="text-end">Visitas efectivas</th>
                                            <th class="text-end">Eficiencia</th>
                                            <th class="text-end">Sin visita</th>
                                            <th class="text-end">Sin equipo</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr *ngFor="let row of selectedCommercialSnapshot.zones">
                                            <td>{{ row.zone }}</td>
                                            <td class="text-end">{{ row.assignedVisits }}</td>
                                            <td class="text-end">{{ row.completedVisits }}</td>
                                            <td class="text-end fw-semibold">{{ row.effectiveness }}%</td>
                                            <td class="text-end">{{ row.prospectsWithoutVisit }}</td>
                                            <td class="text-end">{{ row.opportunitiesWithoutEquipment }}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="row gx-3 gx-lg-4 mb-3 mb-lg-4">
                <div class="col text-center py-3">
                    <h4>The sort <span class="text-gradient">summary</span> may help you</h4>
                    <p class="text-secondary">Keep yourself updated, No matter how much workload is.</p>
                </div>
            </div>

            <div class="row gx-3 gx-lg-4">
                <div class="col-12 col-md-6 col-lg-6 col-xxl-3 mb-3 mb-lg-4">
                    <!-- finance card -->
                    <div class="card adminuiux-card bg-l-gradient-light theme-blue">
                        <div class="card-header">
                            <div class="row gx-3 gx-lg-4 align-items-center">
                                <div class="col">
                                    <h6>
                                        <i class="bi bi-cash h5 me-1 avatar avatar-40 bg-theme-1-subtle text-theme-1 rounded me-2"></i>
                                        Finanzas
                                    </h6>
                                </div>
                                <div class="col-auto"></div>
                            </div>
                        </div>
                        <div class="card-body">
                            <swiper-container slides-per-view="auto" space-between="20px" autoplay="true" class="swiper swipernav mb-3 mb-lg-4">
                                @for (account of financeAccounts; track account.id; let i = $index) {
                                    <swiper-slide class="width-240">
                                        <div class="card adminuiux-card mb-2 overflow-hidden"
                                            [class.theme-blue]="i % 3 === 0"
                                            [class.bg-theme-r-gradient]="i % 3 !== 2"
                                            [class.theme-pink]="i % 3 === 1"
                                            [class.theme-yellow]="i % 3 === 2"
                                            [class.bg-r-gradient]="i % 3 === 2">
                                            <div class="card-body position-relative z-index-1">
                                                <div class="row gx-3 align-items-center mb-4">
                                                    <div class="col-auto align-self-center">
                                                        <i class="fs-4 bi" [class.bi-bank]="account.accountType === 'Banco'" [class.bi-cash-coin]="account.accountType !== 'Banco'"></i>
                                                    </div>
                                                    <div class="col text-end">
                                                        <p class="fs-12">
                                                            <span class="opacity-50 small">{{ account.accountType }} / {{ account.productType }}</span><br />
                                                            <span>{{ account.accountNumber }}</span>
                                                        </p>
                                                    </div>
                                                </div>
                                                <p class="fw-medium h6 mb-3">{{ account.bankName }}</p>
                                                <div class="row gx-3 gx-lg-4">
                                                    <div class="col-auto fs-12">
                                                        <p class="mb-0 opacity-50 small">Estado</p>
                                                        <p>{{ account.status }}</p>
                                                    </div>
                                                    <div class="col text-end fs-12">
                                                        <p class="mb-0 opacity-50 small">Titular</p>
                                                        <p>{{ account.holderName }}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="row amount-data">
                                            <div class="col">
                                                <p class="opacity-50 small mb-1">Saldo inicial</p>
                                                <p>{{ account.initialBalance | currency: account.currencyCode : "symbol" : "1.0-0" }}</p>
                                            </div>
                                            <div class="col-auto text-end">
                                                <p class="opacity-50 small mb-1">Moneda</p>
                                                <p>{{ account.currencyCode }}</p>
                                            </div>
                                        </div>
                                    </swiper-slide>
                                }
                            </swiper-container>
                            <div class="card adminuiux-card">
                                <div class="card-body">
                                    <div class="row gx-3 align-items-center">
                                        <div class="col-auto">
                                            <div class="avatar avatar-50 h5 bg-theme-1-subtle text-theme-1 rounded-circle">
                                                <i class="bi bi-receipt"></i>
                                            </div>
                                        </div>
                                        <div class="col">
                                            <p class="text-secondary small mb-1">Saldo inicial total</p>
                                            <h5>{{ financeAccountsTotalBalance | currency: (primaryFinanceAccount?.currencyCode ?? 'COP') : "symbol" : "1.0-0" }}</h5>
                                        </div>
                                        <div class="col-auto"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="card-footer justify-content-center text-center">
                            <a routerLink="/app/finance-cuentas" class="btn btn-sm btn-link">Ver cuentas <i class="bi bi-arrow-right vm"></i></a>
                        </div>
                    </div>
                </div>
                <div class="col-12 col-md-6 col-lg-6 col-xxl-3 mb-4">
                    <!-- Inventory card -->
                    <div class="card adminuiux-card bg-l-gradient-light theme-yellow h-100">
                        <div class="card-header">
                            <div class="row gx-3 gx-lg-4 align-items-center">
                                <div class="col">
                                    <h6>
                                        <i class="bi bi-box h5 me-1 avatar avatar-40 bg-theme-1-subtle text-theme-1 rounded me-2"></i>
                                        Inventory
                                    </h6>
                                </div>
                                <div class="col-auto"></div>
                            </div>
                        </div>
                        <div class="card-body">
                            <div class="row mb-3">
                                <div class="col-auto">
                                    <div class="rounded bg-theme-1 text-white p-3">
                                        <p class="opacity-75 small mb-1">Annual<br />Income</p>
                                        <h5>$124k</h5>
                                    </div>
                                </div>
                                <div class="col align-self-center">
                                    <p class="text-secondary small mb-0">United States</p>
                                    <p>45<small>% Sales</small></p>

                                    <div class="mt-3">
                                        <div class="progress height-dynamic mb-1 bg-theme-1-subtle" style="--h-dynamic:5px">
                                            <div class="progress-bar bg-theme-1" role="progressbar" style="width: 45%" aria-valuenow="45" aria-valuemin="0" aria-valuemax="100"></div>
                                        </div>
                                    </div>
                                    <p class="small text-secondary">Targeted orders <span class="float-end">153k</span></p>
                                </div>
                            </div>
                            <div class="row mb-3">
                                <div class="col-auto">
                                    <div class="rounded bg-theme-1-subtle p-3">
                                        <p class="opacity-75 small mb-1">Annual<br />Income</p>
                                        <h5>$124k</h5>
                                    </div>
                                </div>
                                <div class="col align-self-center">
                                    <p class="text-secondary small mb-0">United Kingdom</p>
                                    <p>15<small>% Sales</small></p>

                                    <div class="mt-3">
                                        <div class="progress height-dynamic mb-1 bg-theme-1-subtle" style="--h-dynamic:5px">
                                            <div class="progress-bar bg-theme-1" role="progressbar" style="width: 45%" aria-valuenow="45" aria-valuemin="0" aria-valuemax="100"></div>
                                        </div>
                                    </div>
                                    <p class="small text-secondary">Targeted orders <span class="float-end">53k</span></p>
                                </div>
                            </div>
                            <div class="row gx-3 gx-lg-4">
                                <div class="col col-md text-center">
                                    <i class="bi bi-box avatar avatar-40 text-theme-1 theme-green mb-2 rounded-circle"></i>
                                    <h4 class="mb-0">1265</h4>
                                    <p class="small text-secondary">In Stock</p>
                                </div>
                                <div class="col col-md text-center">
                                    <i class="bi bi-truck h5 avatar avatar-30 text-theme-1 mb-2 rounded-circle"></i>
                                    <h4 class="mb-0">365</h4>
                                    <p class="small text-secondary">Delivered</p>
                                </div>
                            </div>
                        </div>
                        <div class="card-footer justify-content-center text-center">
                            <a routerLink="/app/inventory-dashboard" class="btn btn-sm btn-link">Visit Inventory Dash <i class="bi bi-arrow-right vm"></i></a>
                        </div>
                    </div>
                </div>
                <div class="col-12 col-md-6 col-lg-6 col-xxl-3 mb-4">
                    <!-- Network card -->
                    <div class="card adminuiux-card bg-l-gradient-light theme-red h-100">
                        <div class="card-header">
                            <div class="row gx-3 gx-lg-4 align-items-center">
                                <div class="col">
                                    <h6>
                                        <i class="bi bi-hdd-rack h5 me-1 avatar avatar-40 bg-theme-1-subtle text-theme-1 rounded me-2"></i>
                                        Equipos
                                    </h6>
                                </div>
                                <div class="col-auto"></div>
                            </div>
                        </div>
                        <div class="card-body">
                            <app-area-red-chartjs-100-0t class="height-100 d-block mb-2"></app-area-red-chartjs-100-0t>

                            <p class="mb-1">Equipos pendientes de facturar <span class="text-secondary">(conteo en dashboard)</span></p>
                            <p class="text-secondary">{{ pendingInvoiceEquipmentCount }} registros activos</p>
                            <div class="card adminuiux-card mt-3">
                                <div class="card-body">
                                    <div class="row gx-3 align-items-center">
                                        <div class="col-auto">
                                            <div class="position-relative">
                                                <div id="circleprogressred" class="avatar avatar-50 rounded-circle"></div>
                                                <div class="avatar avatar-30 h5 bg-theme-1-subtle text-theme-1 theme-red rounded-circle position-absolute start-50 top-50 translate-middle">
                                                    <i class="bi bi-bug"></i>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="col">
                                            <p class="text-secondary small mb-1">Pendientes de facturar</p>
                                            <p>{{ pendingInvoiceEquipmentCount }}<small> en dashboard</small></p>
                                        </div>
                                    </div>
                                </div>
                                <div class="card-footer border-top py-0">
                                    <div class="row gx-3 ">
                                        <div class="col py-2">
                                            <p class="text-secondary small mb-1">Listos para facturar</p>
                                            <p class="text-success">{{ readyToInvoiceEquipmentCount }}</p>
                                        </div>
                                        <div class="col border-start py-2">
                                            <p class="text-secondary small mb-1">En proceso</p>
                                            <p class="text-theme-1 theme-yellow">{{ inProcessEquipmentCount }}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="card-footer justify-content-center text-center">
                            <a routerLink="/app/work-teams" class="btn btn-sm btn-link">Ver Equipos <i class="bi bi-arrow-right vm"></i></a>
                        </div>
                    </div>
                </div>
                <div class="col-12 col-md-6 col-lg-6 col-xxl-3 mb-4">
                    <!-- Social card -->
                    <div class="card adminuiux-card bg-l-gradient-light theme-green h-100">
                        <div class="card-header">
                            <div class="row gx-3 gx-lg-4 align-items-center">
                                <div class="col">
                                    <h6><i class="bi bi-people h5 me-1 avatar avatar-40 bg-theme-1-subtle text-theme-1 rounded me-2"></i> Social</h6>
                                </div>
                                <div class="col-auto"></div>
                            </div>
                        </div>
                        <div class="card-body">
                            <div class="row gx-3 align-items-center mb-3">
                                <div class="col-auto">
                                    <figure class="coverimg rounded width-100 height-80 mb-0">
                                        <img src="assets/img/modern-ai-image/user-5.jpg" alt="" class="mw-100" />
                                    </figure>
                                </div>
                                <div class="col">
                                    <p class="text-secondary small mb-0">Boosted Post</p>
                                    <h4>2,545,05</h4>
                                    <p class="text-secondary small">People Reached</p>
                                </div>
                            </div>
                            <div class="row gx-3 gx-lg-4 align-items-center">
                                <div class="col-12 mb-2">
                                    <p class="text-secondary small">Buy now or Share now! Do support</p>
                                </div>
                                <div class="col">
                                    <p class="small text-secondary mb-0">Likes</p>
                                    <h5 class="mb-0">65.15 k</h5>
                                </div>
                                <div class="col">
                                    <p class="small text-secondary mb-0">Retweet</p>
                                    <h5 class="mb-0">8.2 k</h5>
                                </div>
                                <div class="col">
                                    <p class="small text-secondary mb-0">Clicks</p>
                                    <h5 class="mb-0">52.01 k</h5>
                                </div>
                            </div>

                            <div class="card adminuiux-card mt-3 bg-theme-r-gradient text-white">
                                <div class="card-body">
                                    <div class="row gx-3 align-items-center mb-2">
                                        <div class="col-auto">
                                            <figure class="avatar avatar-50 coverimg rounded">
                                                <img src="assets/img/modern-ai-image/pet-4.jpg" alt="" />
                                            </figure>
                                        </div>
                                        <div class="col">
                                            <p>Learn about software and Framework. All...</p>
                                        </div>
                                    </div>
                                    <div class="row gx-3 gx-lg-4 align-items-center">
                                        <div class="col-auto">
                                            <p class="mb-0">125</p>
                                            <p class="small">Reached</p>
                                        </div>
                                        <div class="col-auto">
                                            <p class="mb-0">35</p>
                                            <p class="small">Likes</p>
                                        </div>
                                        <div class="col text-end">
                                            <button class="btn btn-sm btn-light">Boost</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="card-footer justify-content-center text-center">
                            <a routerLink="/app/social-dashboard" class="btn btn-sm btn-link">Visit Social Dashboard <i class="bi bi-arrow-right vm"></i></a>
                        </div>
                    </div>
                </div>
            </div>

            <div class="row mb-3 mb-lg-4 py-3">
                <div class="col text-center">
                    <h4>Important <span class="text-gradient">News</span> around you</h4>
                    <p class="text-secondary">While you are working hard, we let you know important news.</p>
                </div>
            </div>
            <div class="row gx-3 gx-lg-4">
                <!-- news and offers -->
                <div class="col-12 col-lg-12 col-xl-4 col-xxl-4 mb-3 mb-lg-4">
                    <div class="card adminuiux-card shadow-sm">
                        <div class="card-header">
                            <div class="row gx-3 gx-lg-4 align-items-center">
                                <div class="col-auto">
                                    <i class="bi bi-newspaper h5 me-1 avatar avatar-40 bg-theme-1-subtle text-theme-1 rounded"></i>
                                </div>
                                <div class="col">
                                    <h6 class="mb-0">Great news</h6>
                                    <p class="text-secondary small">Change world is a combine effort.</p>
                                </div>
                                <div class="col-auto"></div>
                            </div>
                        </div>
                        <div class="coverimg w-100 height-200 position-relative">
                            <div class="position-absolute bottom-0 start-0 w-100 mb-3 px-3 z-index-1">
                                <div class="row gx-3 gx-lg-4">
                                    <div class="col">
                                        <button class="btn btn-sm btn-outline-light btn-rounded">Share this</button>
                                    </div>
                                    <div class="col-auto">
                                        <div class="dropup d-inline-block">
                                            <a class="btn btn-square btn-sm rounded-circle btn-outline-light no-caret" data-bs-toggle="dropdown" aria-expanded="false" data-bs-display="static" role="button">
                                                <i class="bi bi-three-dots-vertical"></i>
                                            </a>
                                            <ul class="dropdown-menu dropdown-menu-end">
                                                <li>
                                                    <a class="dropdown-item" href="javascript:void(0)"><i class="bi bi-hand-thumbs-up me-1 text-theme-1 theme-green"></i> Recommendation this</a>
                                                </li>
                                                <li>
                                                    <a class="dropdown-item" href="javascript:void(0)"><i class="bi bi-hand-thumbs-down me-1 text-danger"></i> Don't recommend</a>
                                                </li>
                                                <li>
                                                    <a class="dropdown-item" href="javascript:void(0)"><i class="bi bi-star text-yellow"></i> Add to favorite</a>
                                                </li>
                                                <li><a class="dropdown-item text-danger" href="javascript:void(0)">Report this</a></li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <img src="assets/img/modern-ai-image/tree-2.jpg" class="mw-100" alt="" />
                        </div>
                        <div class="card-body">
                            <h5 class="mb-3">We all are artist in our field. We all are able to find symmetry in our routine</h5>
                            <h6 class="fw-medium mb-2">Make it clutter free and create better world</h6>
                            <p class="text-secondary">We have added useful and wider-range of widgets fully flexible with wrapper container. If you still reading this, you are in love with this design. <a routerLink="/app/blog-details">Read more...</a></p>
                        </div>
                    </div>
                </div>

                <div class="col-12 col-md-6 col-lg-6 col-xl-4 col-xxl-4 position-relative mb-3 mb-lg-4">
                    <!-- offer block-->
                    <div class="card adminuiux-card position-relative overflow-hidden mb-3 mb-lg-4">
                        <figure class="coverimg position-absolute w-100 h-100 start-0 top-0 m-0">
                            <img src="assets/img/adminux/bg-13.jpg" class="mw-100" alt="" />
                        </figure>
                        <div class="card-body bg-transparent z-index-1">
                            <div class="row gx-3 gx-lg-4">
                                <div class="col-7">
                                    <div class="bg-theme-1 text-white text-center p-3 rounded">
                                        <h3 class="mb-3">15% OFF</h3>
                                        <p>Holiday Trip</p>
                                        <p class="opacity-50 small">Price including with our launch offer get 5% Extra</p>
                                        <button class="copy-text btn btn-sm btn-rounded btn-outline-dashed text-white border-white">GOWFAMILY</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="card adminuiux-card overflow-hidden">
                        <div class="row mx-0">
                            <div class="col-6 pe-0 bg-theme-1 text-white half-circle-vertical text-center py-4 z-index-1">
                                <div class="position-relative">
                                    <h3>15% OFF</h3>
                                    <p>Uberazia Taxi</p>
                                    <p class="opacity-50 small">Price including with our launch offer get 5% Extra</p>
                                    <button class="copy-text btn btn-sm btn-rounded btn-outline-dashed text-white border-white">GOREELLAUNCH</button>
                                </div>
                            </div>
                            <div class="col-6 position-relative">
                                <figure class="coverimg position-absolute w-100 h-100 start-0 top-0 m-0">
                                    <img src="assets/img/modern-ai-image/tree-6.jpg" class="mw-100" alt="" />
                                </figure>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="col-12 col-md-6 col-lg-6 col-xl-4 col-xxl-4 mb-3 mb-lg-4">
                    <!-- photo gallery view -->
                    <div class="card adminuiux-card overflow-hidden h-100">
                        <div class="card-header">
                            <div class="row gx-3 gx-lg-4 align-items-center">
                                <div class="col-auto">
                                    <i class="bi bi-image h5 me-1 avatar avatar-40 bg-theme-1-subtle text-theme-1 theme-purple rounded"></i>
                                </div>
                                <div class="col">
                                    <h6 class="mb-0">Photo Gallery</h6>
                                    <p class="text-secondary small">Click image to see preview</p>
                                </div>
                                <div class="col-auto"></div>
                            </div>
                        </div>
                        <div class="card-body p-0 spotlight-group">
                            <div class="row g-0 h-100">
                                <div class="col-6 h-100">
                                    <div class="row h-100">
                                        <div class="col-12 h-50 position-relative overflow-hidden">
                                            <a href="assets/img/modern-ai-image/tree-8.jpg" class="coverimg position-absolute w-100 h-100 start-0 top-0 m-0 spotlight">
                                                <img src="assets/img/modern-ai-image/tree-8.jpg" class="mw-100" alt="" title="Your business is your strength" />
                                            </a>
                                        </div>
                                        <div class="col-12 h-50 position-relative overflow-hidden">
                                            <a href="assets/img/modern-ai-image/kids-2.jpg" class="coverimg position-absolute w-100 h-100 start-0 top-0 m-0 spotlight">
                                                <img src="assets/img/modern-ai-image/kids-2.jpg" class="mw-100" alt="" title="Beautiful background image" />
                                            </a>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-6 h-100 position-relative overflow-hidden">
                                    <a href="assets/img/modern-ai-image/user-1-kid.jpg" class="coverimg position-absolute w-100 h-100 start-0 top-0 m-0 spotlight">
                                        <img src="assets/img/modern-ai-image/user-1-kid.jpg" class="mw-100" alt="" title="Love unconditional when it comes to your own" />
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `,
    styles: [
        `
            .risk-selected-wrap {
                border: 1px solid rgba(var(--adminuiux-theme-1-rgb), 0.14);
                border-radius: 0.75rem;
                background: rgba(var(--adminuiux-theme-1-rgb), 0.06);
            }

            .risk-kpi-card .risk-kpi-body {
                min-height: 136px;
                display: flex;
                align-items: center;
            }

            .risk-kpi-note {
                display: -webkit-box;
                -webkit-line-clamp: 2;
                -webkit-box-orient: vertical;
                overflow: hidden;
            }

            .commercial-kpi-card {
                border: 1px solid rgba(var(--adminuiux-theme-1-rgb), 0.12);
            }

            .commercial-period-label {
                display: inline-flex;
                align-items: center;
                border-radius: 999px;
                padding: 0.35rem 0.75rem;
                font-size: 0.78rem;
                color: rgba(var(--bs-body-color-rgb), 0.85);
                background: rgba(var(--adminuiux-theme-1-rgb), 0.08);
            }

            .commercial-metric-box {
                border: 1px solid rgba(var(--adminuiux-theme-1-rgb), 0.12);
                border-radius: 0.85rem;
                padding: 0.95rem 1rem;
                background: rgba(var(--adminuiux-theme-1-rgb), 0.05);
            }

            .commercial-metric-box.warning {
                border-color: rgba(var(--bs-warning-rgb), 0.35);
                background: rgba(var(--bs-warning-rgb), 0.08);
            }

            .commercial-metric-box.danger {
                border-color: rgba(var(--bs-danger-rgb), 0.35);
                background: rgba(var(--bs-danger-rgb), 0.08);
            }

            .commercial-metric-box.success {
                border-color: rgba(var(--bs-success-rgb), 0.3);
                background: rgba(var(--bs-success-rgb), 0.08);
            }

            .home-credit-card {
                border: 1px solid rgba(var(--adminuiux-theme-1-rgb), 0.12);
            }

            .home-credit-ring-wrap {
                display: flex;
                justify-content: center;
            }

            .home-credit-ring {
                --credit-usage: 0%;
                width: 132px;
                height: 132px;
                border-radius: 50%;
                background: conic-gradient(#2d7ff9 var(--credit-usage), rgba(var(--adminuiux-theme-1-rgb), 0.18) 0%);
                position: relative;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                gap: 0.2rem;
                text-align: center;
                box-shadow: inset 0 0 0 1px rgba(var(--adminuiux-theme-1-rgb), 0.16);
            }

            .home-credit-ring::after {
                content: "";
                width: 92px;
                height: 92px;
                border-radius: 50%;
                background: var(--bs-body-bg);
                position: absolute;
            }

            .home-credit-ring strong,
            .home-credit-ring small {
                position: relative;
                z-index: 1;
                display: block;
                line-height: 1.1;
            }

            .home-credit-ring strong {
                font-size: 1.35rem;
                font-weight: 700;
            }

            .home-credit-ring small {
                font-size: 0.72rem;
                color: var(--bs-secondary-color);
            }

            .home-credit-kpis {
                display: grid;
                grid-template-columns: repeat(4, minmax(0, 1fr));
                gap: 0.75rem;
            }

            .home-credit-kpi {
                border: 1px solid rgba(var(--adminuiux-theme-1-rgb), 0.14);
                border-radius: 0.85rem;
                padding: 0.85rem 0.95rem;
                background: rgba(var(--adminuiux-theme-1-rgb), 0.05);
                min-height: 74px;
            }

            .home-credit-kpi span {
                display: block;
                font-size: 0.75rem;
                color: var(--bs-secondary-color);
                margin-bottom: 0.1rem;
            }

            .home-credit-kpi strong {
                font-size: 1rem;
            }

            .home-credit-chart {
                display: grid;
                gap: 0.65rem;
            }

            .home-credit-chart__row {
                display: grid;
                grid-template-columns: minmax(180px, 250px) 1fr minmax(200px, 240px);
                gap: 0.75rem;
                align-items: center;
            }

            .home-credit-chart__identity small {
                display: block;
                color: var(--bs-secondary-color);
            }

            .home-credit-chart__track {
                height: 12px;
                border-radius: 999px;
                background: rgba(var(--adminuiux-theme-1-rgb), 0.18);
                overflow: hidden;
            }

            .home-credit-chart__bar {
                height: 100%;
                border-radius: 999px;
                background: linear-gradient(90deg, #198754, #0d6efd);
            }

            .home-credit-chart__bar.warning {
                background: linear-gradient(90deg, #f59f00, #fd7e14);
            }

            .home-credit-chart__bar.danger {
                background: linear-gradient(90deg, #dc3545, #ff6b6b);
            }

            .home-credit-chart__numbers {
                text-align: right;
            }

            .home-credit-chart__numbers small {
                display: block;
                color: var(--bs-secondary-color);
            }

            .home-credit-chart__numbers strong {
                margin-right: 0.35rem;
            }

            @media (max-width: 1199.98px) {
                .home-credit-kpis {
                    grid-template-columns: repeat(2, minmax(0, 1fr));
                }
            }

            @media (max-width: 991.98px) {
                .home-credit-chart__row {
                    grid-template-columns: 1fr;
                    gap: 0.4rem;
                }

                .home-credit-chart__numbers {
                    text-align: left;
                }

                .home-credit-kpis {
                    grid-template-columns: 1fr;
                }
            }
        `,
    ],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class DashboardComponent implements OnInit, AfterViewInit {
    @ViewChild("choices") mySelect?: ElementRef<HTMLSelectElement>;
    @ViewChild("choices2") mySelect2?: ElementRef<HTMLSelectElement>;

    completedProjects = 24;
    inProgressProjects = 9;
    delayedProjects = 3;
    financeAccounts: FinanceAccount[] = [];
    homeCreditClients: CrmClientRecord[] = [];
    pendingInvoiceEquipmentCount = 0;
    readyToInvoiceEquipmentCount = 0;
    inProcessEquipmentCount = 0;

    selectedCommercialPeriod: CommercialPeriod = "mensual";
    readonly commercialPeriodOptions: Array<{ value: CommercialPeriod; label: string }> = [
        { value: "semanal", label: "Semanal" },
        { value: "mensual", label: "Mensual" },
        { value: "trimestral", label: "Trimestral" },
    ];
    readonly commercialSnapshots: Record<CommercialPeriod, CommercialPeriodSnapshot> = {
        semanal: {
            label: "Semana en curso",
            actionCount: 48,
            followUpCount: 57,
            zones: [
                {
                    zone: "Norte",
                    assignedVisits: 20,
                    completedVisits: 16,
                    prospectsWithoutVisit: 4,
                    opportunitiesWithoutEquipment: 3,
                    effectiveness: 80,
                },
                {
                    zone: "Centro",
                    assignedVisits: 18,
                    completedVisits: 15,
                    prospectsWithoutVisit: 3,
                    opportunitiesWithoutEquipment: 2,
                    effectiveness: 83,
                },
                {
                    zone: "Sur",
                    assignedVisits: 14,
                    completedVisits: 9,
                    prospectsWithoutVisit: 5,
                    opportunitiesWithoutEquipment: 4,
                    effectiveness: 64,
                },
            ],
        },
        mensual: {
            label: "Mes actual",
            actionCount: 182,
            followUpCount: 214,
            zones: [
                {
                    zone: "Norte",
                    assignedVisits: 76,
                    completedVisits: 62,
                    prospectsWithoutVisit: 14,
                    opportunitiesWithoutEquipment: 10,
                    effectiveness: 82,
                },
                {
                    zone: "Centro",
                    assignedVisits: 71,
                    completedVisits: 58,
                    prospectsWithoutVisit: 13,
                    opportunitiesWithoutEquipment: 9,
                    effectiveness: 82,
                },
                {
                    zone: "Sur",
                    assignedVisits: 62,
                    completedVisits: 41,
                    prospectsWithoutVisit: 21,
                    opportunitiesWithoutEquipment: 17,
                    effectiveness: 66,
                },
            ],
        },
        trimestral: {
            label: "Trimestre acumulado",
            actionCount: 531,
            followUpCount: 638,
            zones: [
                {
                    zone: "Norte",
                    assignedVisits: 218,
                    completedVisits: 179,
                    prospectsWithoutVisit: 39,
                    opportunitiesWithoutEquipment: 27,
                    effectiveness: 82,
                },
                {
                    zone: "Centro",
                    assignedVisits: 206,
                    completedVisits: 165,
                    prospectsWithoutVisit: 41,
                    opportunitiesWithoutEquipment: 29,
                    effectiveness: 80,
                },
                {
                    zone: "Sur",
                    assignedVisits: 189,
                    completedVisits: 122,
                    prospectsWithoutVisit: 67,
                    opportunitiesWithoutEquipment: 48,
                    effectiveness: 65,
                },
            ],
        },
    };

    readonly riskProjects: RiskProjectSummary[] = [
        {
            id: 1,
            name: "Planta Solar Norte",
            status: "problemas",
            statusLabel: "Con problemas",
            progress: 41,
            budgetEstimated: 210000,
            budgetUsed: 198500,
            lastAction: "Proveedor critico reporto retraso de 12 dias.",
            lastActionAt: "Actualizado hace 2 horas",
            recommendation: "Escalar a comite, ajustar cronograma y activar contingencia.",
            recommendationPriority: "Alta",
        },
        {
            id: 2,
            name: "Implementacion CRM Comercial",
            status: "bien",
            statusLabel: "Controlado",
            progress: 74,
            budgetEstimated: 120000,
            budgetUsed: 78000,
            lastAction: "Sprint 6 cerrado y modulo de reportes validado.",
            lastActionAt: "Actualizado ayer",
            recommendation: "Mantener ritmo y preparar salida controlada a produccion.",
            recommendationPriority: "Media",
        },
        {
            id: 3,
            name: "Migracion ERP Fase 1",
            status: "terminado",
            statusLabel: "Terminado",
            progress: 100,
            budgetEstimated: 95000,
            budgetUsed: 93450,
            lastAction: "Acta de cierre firmada y capacitaciones completadas.",
            lastActionAt: "Cierre registrado hace 5 dias",
            recommendation: "Transferir a soporte y documentar lecciones aprendidas.",
            recommendationPriority: "Baja",
        },
    ];

    selectedRiskProject: RiskProjectSummary = this.riskProjects[0];

    lastViewedProjectName = "Proyecto sin registro reciente";
    lastViewedProjectProgress = 0;

    get displayedRiskProjects(): RiskProjectSummary[] {
        return this.riskProjects.slice(0, 5);
    }

    get progressRemaining(): number {
        return Math.max(0, 100 - this.selectedRiskProject.progress);
    }

    get selectedBudgetConsumptionPercent(): number {
        if (this.selectedRiskProject.budgetEstimated <= 0) {
            return 0;
        }

        const raw = (this.selectedRiskProject.budgetUsed / this.selectedRiskProject.budgetEstimated) * 100;
        return Math.min(100, Math.max(0, Math.round(raw)));
    }

    get selectedCommercialSnapshot(): CommercialPeriodSnapshot {
        return this.commercialSnapshots[this.selectedCommercialPeriod];
    }

    get zoneEfficiencyAverage(): number {
        const zones = this.selectedCommercialSnapshot.zones;
        const totalAssigned = zones.reduce((acc, row) => acc + row.assignedVisits, 0);
        const totalCompleted = zones.reduce((acc, row) => acc + row.completedVisits, 0);

        if (totalAssigned <= 0) {
            return 0;
        }

        return Math.round((totalCompleted / totalAssigned) * 100);
    }

    get noVisitWindowCount(): number {
        return this.selectedCommercialSnapshot.zones.reduce((acc, row) => acc + row.prospectsWithoutVisit, 0);
    }

    get noEquipmentWindowCount(): number {
        return this.selectedCommercialSnapshot.zones.reduce((acc, row) => acc + row.opportunitiesWithoutEquipment, 0);
    }

    get noVisitRatio(): number {
        const zones = this.selectedCommercialSnapshot.zones;
        const totalAssigned = zones.reduce((acc, row) => acc + row.assignedVisits, 0);

        if (totalAssigned <= 0) {
            return 0;
        }

        return Math.round((this.noVisitWindowCount / totalAssigned) * 100);
    }

    get noEquipmentRatio(): number {
        const zones = this.selectedCommercialSnapshot.zones;
        const totalCompleted = zones.reduce((acc, row) => acc + row.completedVisits, 0);

        if (totalCompleted <= 0) {
            return 0;
        }

        return Math.round((this.noEquipmentWindowCount / totalCompleted) * 100);
    }

    get actionExecutionRate(): number {
        const totalFollowUps = this.selectedCommercialSnapshot.followUpCount;
        if (totalFollowUps <= 0) {
            return 0;
        }

        return Math.round((this.selectedCommercialSnapshot.actionCount / totalFollowUps) * 100);
    }

    ngOnInit() {
        this.loadLastViewedProjectFromStorage();
        this.loadFinanceAccounts();
        this.loadHomeCreditClients();
        this.loadEquipmentPendingInvoiceKpis();
    }

    ngAfterViewInit() {
        this.initializeChoices(this.mySelect);
        this.initializeChoices(this.mySelect2);

        // data table
        // const table = new DataTable("#dataTable", {
        //     searching: false,
        //     lengthChange: false,
        //     autoWidth: false,
        //     columnDefs: [{ orderable: false, targets: 4 }],
        //     order: [[0, "desc"]],
        //     pageLength: 6,
        //     responsive: true,
        // });
    }

    private initializeChoices(target?: ElementRef<HTMLSelectElement>) {
        if (!target?.nativeElement) {
            return;
        }

        try {
            new Choices(target.nativeElement, {
                searchEnabled: true,
                removeItemButton: true,
                classNames: {
                    containerOuter: ["choices", "maxwidth-dynamic"],
                } as ClassNames,
                placeholderValue: "Type...",
            });
        } catch {
            // Avoid crashing the whole dashboard if Choices initialization fails.
        }
    }

    selectRiskProject(project: RiskProjectSummary) {
        this.selectedRiskProject = project;
    }

    setCommercialPeriod(period: CommercialPeriod) {
        this.selectedCommercialPeriod = period;
    }

    private loadLastViewedProjectFromStorage() {
        let storage: Storage | null = null;

        if (typeof window !== "undefined") {
            try {
                storage = window.localStorage;
            } catch {
                storage = null;
            }
        }

        if (!storage) {
            this.setDefaultLastViewedProject();
            return;
        }

        const storageKeys = ["adminux-last-viewed-project", "lastViewedProject", "project-last-viewed"];

        for (const key of storageKeys) {
            let raw: string | null = null;

            try {
                raw = storage.getItem(key);
            } catch {
                continue;
            }

            if (!raw) {
                continue;
            }

            try {
                const payload = JSON.parse(raw) as unknown;
                const candidateName = this.readProjectName(payload);
                const candidateProgress = this.readProjectProgress(payload);

                if (candidateName) {
                    this.lastViewedProjectName = candidateName;
                }

                if (candidateProgress !== null) {
                    this.lastViewedProjectProgress = candidateProgress;
                }

                return;
            } catch {
                const plainName = raw.trim();
                if (plainName.length > 0) {
                    this.lastViewedProjectName = plainName;
                    this.lastViewedProjectProgress = 0;
                    return;
                }
            }
        }

        this.setDefaultLastViewedProject();
    }

    private loadHomeCreditClients() {
        this.homeCreditClients = getCrmClients().filter((client) => client.credito.enabled && client.credito.creditLimit > 0);
    }

    private loadEquipmentPendingInvoiceKpis() {
        const allItems = getAllProspectEquipmentItems();
        const pendingItems = allItems.filter((item) => item.repairStatus !== "entregado");
        const readyCount = pendingItems.filter((item) => item.repairStatus === "listo-entrega").length;

        this.pendingInvoiceEquipmentCount = pendingItems.length;
        this.readyToInvoiceEquipmentCount = readyCount;
        this.inProcessEquipmentCount = Math.max(0, pendingItems.length - readyCount);
    }

    private loadFinanceAccounts() {
        this.financeAccounts = FinanceAccountsStore.getAccounts();
    }

    get primaryFinanceAccount(): FinanceAccount | null {
        return this.financeAccounts[0] ?? null;
    }

    get secondaryFinanceAccounts(): FinanceAccount[] {
        return this.financeAccounts.slice(1, 3);
    }

    get financeAccountsTotalBalance(): number {
        return this.financeAccounts.reduce((sum, account) => sum + account.initialBalance, 0);
    }

    get homeCreditRows(): HomeCreditChartRow[] {
        return this.homeCreditClients
            .map((client) => {
                const limit = client.credito.creditLimit;
                const consumed = client.credito.consumed;
                const utilization = limit > 0 ? Math.min(100, Math.round((consumed / limit) * 100)) : 0;

                return {
                    id: client.id,
                    clientName: client.nombre,
                    company: client.empresa,
                    limit,
                    consumed,
                    utilization,
                    arrearsDays: calculateDaysInArrears(client),
                };
            })
            .sort((a, b) => b.utilization - a.utilization)
            .slice(0, 6);
    }

    get homeCreditTotalLimit(): number {
        return this.homeCreditClients.reduce((total, client) => total + client.credito.creditLimit, 0);
    }

    get homeCreditTotalConsumed(): number {
        return this.homeCreditClients.reduce((total, client) => total + client.credito.consumed, 0);
    }

    get homeCreditAvailable(): number {
        return Math.max(0, this.homeCreditTotalLimit - this.homeCreditTotalConsumed);
    }

    get homeCreditUtilization(): number {
        if (this.homeCreditTotalLimit <= 0) {
            return 0;
        }

        return Math.min(100, Math.round((this.homeCreditTotalConsumed / this.homeCreditTotalLimit) * 100));
    }

    get homeCreditClientsInArrears(): number {
        return this.homeCreditClients.filter((client) => calculateDaysInArrears(client) > 0).length;
    }

    private setDefaultLastViewedProject() {
        this.lastViewedProjectName = "Proyecto de modernizacion ERP";
        this.lastViewedProjectProgress = 68;
    }

    formatCurrency(value: number): string {
        return new Intl.NumberFormat("es-CO", {
            style: "currency",
            currency: "USD",
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(value);
    }

    private readProjectName(payload: unknown): string | null {
        if (!payload || typeof payload !== "object") {
            return null;
        }

        const record = payload as Record<string, unknown>;
        const candidates = [record["name"], record["projectName"], record["title"], record["project"]];

        for (const candidate of candidates) {
            if (typeof candidate !== "string") {
                continue;
            }

            const normalized = candidate.trim();
            if (normalized.length > 0) {
                return normalized;
            }
        }

        return null;
    }

    private readProjectProgress(payload: unknown): number | null {
        if (!payload || typeof payload !== "object") {
            return null;
        }

        const record = payload as Record<string, unknown>;
        const candidates = [record["progress"], record["progressPercent"], record["percentage"], record["advance"], record["completion"]];

        for (const candidate of candidates) {
            const parsed = typeof candidate === "number" ? candidate : Number(candidate);
            if (!Number.isFinite(parsed)) {
                continue;
            }

            return Math.min(100, Math.max(0, Math.round(parsed)));
        }

        return null;
    }

}
