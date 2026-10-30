import { Component, OnInit, AfterViewInit, AfterContentChecked, OnDestroy, ViewChild, ElementRef, CUSTOM_ELEMENTS_SCHEMA } from "@angular/core";
import { RouterLink } from "@angular/router";
import Choices, { ClassNames } from "choices.js";
import Swiper from "swiper";
import { register } from "swiper/element/bundle";
register();
import DataTable from "datatables.net-dt";
import "datatables.net-responsive-dt";

import { CrmEquipmentApiService } from "../../../services/crm-equipment-api.service";
import type { ProspectEquipmentSummary } from "../crm/crm-prospect-equipment.store";

import { DaterangePickerRangesComponent } from "../../../components/input-fields/daterange-picker/daterange-picker-ranges.component";
import { CircleProgressBlueBlankComponent } from "../../../components/charts/circle-progress-blue-blank.component";
import { CircleProgressYellowBlankComponent } from "../../../components/charts/circle-progress-yellow-blank.component";
import { CircleProgressRedBlankComponent } from "../../../components/charts/circle-progress-red-blank.component";
import { CircleProgressWhiteBlankComponent } from "../../../components/charts/circle-progress-white-blank.component";
import { AreaBlueChartjs60Component } from "../../../components/charts/area-blue-chartjs-60.component";
import { AreaGreenChartjs60Component } from "../../../components/charts/area-green-chartjs-60.component";
import { ArearedChartjs60Component } from "../../../components/charts/area-red-chartjs-60.component";
import { AreaYellowChartjs60Component } from "../../../components/charts/area-yellow-chartjs-60.component";
import { CircleProgressBlueComponent } from "../../../components/charts/circle-progress-blue.component";
import { BarBlueChartjs100Component } from "../../../components/charts/bar-blue-chartjs-100.component";
import { AreaRedChartjs200Component } from "../../../components/charts/area-red-chartjs-200.component";
import { AreaGreenChartjs200Component } from "../../../components/charts/area-green-chartjs-200.component";
import { DoughnutChartjs180Component } from "../../../components/charts/doughnut-chartjs-180.component";

@Component({
    selector: "app-finance-dashboard",
    standalone: true,
    imports: [RouterLink, DaterangePickerRangesComponent, CircleProgressBlueComponent, CircleProgressBlueBlankComponent, CircleProgressYellowBlankComponent, CircleProgressRedBlankComponent, CircleProgressWhiteBlankComponent, AreaBlueChartjs60Component, AreaGreenChartjs60Component, ArearedChartjs60Component, AreaYellowChartjs60Component, BarBlueChartjs100Component, AreaRedChartjs200Component, AreaGreenChartjs200Component, DoughnutChartjs180Component],
    template: `
        <!-- page title -->
        <div class="container-fluid py-3">
            <div class="row gx-3 gx-lg-4 align-items-center page-title">
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

            <nav aria-label="breadcrumb" class="breadcrumb-theme mt-3 rounded">
                <ol class="breadcrumb mb-0">
                    <li class="breadcrumb-item bi">
                        <a routerLink="/app/dashboard"><i class="bi bi-house-door me-2"></i> AdminUX</a>
                    </li>
                    <li class="breadcrumb-item bi active" aria-current="page">Finance</li>
                </ol>
            </nav>
        </div>

        <!-- content -->
        <div class="container mt-3" id="main-content">
            <!-- Fase 5b/5c: campanita de facturación urgente (priority billing).
                 El badge persiste mientras haya equipos marcados; el toast
                 aparece cuando un sondeo de 10 minutos encuentra trabajo nuevo. -->
            @if (priorityBillingToast) {
                <div class="toast-container position-fixed top-0 end-0 p-3" style="z-index: 1080;" data-testid="priority-billing-toast">
                    <div class="toast show align-items-center text-bg-warning border-0" role="alert" aria-live="assertive" aria-atomic="true">
                        <div class="d-flex">
                            <div class="toast-body">
                                <i class="bi bi-bell-fill me-2"></i>{{ priorityBillingToast }}
                            </div>
                            <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Cerrar" (click)="priorityBillingToast = ''"></button>
                        </div>
                    </div>
                </div>
            }
            @if (priorityBillingItems.length > 0) {
                <div class="alert alert-warning border d-flex align-items-start gap-2 mb-3" data-testid="priority-billing-alert">
                    <i class="bi bi-bell-fill text-warning fs-5"></i>
                    <div>
                        <strong>Facturación urgente:</strong> {{ priorityBillingItems.length }} equipo(s) marcados para facturar con prioridad.
                        <span class="badge bg-warning text-dark ms-2" data-testid="priority-billing-badge">{{ priorityBillingItems.length }}</span>
                        <ul class="mb-0 small mt-1">
                            @for (item of priorityBillingItems; track item.itemId) {
                                <li>{{ item.displayName || item.receivedIdentifier || item.itemId }} — {{ item.prospectName }} ({{ item.repairStatusLabel }})</li>
                            }
                        </ul>
                    </div>
                </div>
            }
            <div class="row gx-3 gx-lg-4">
                <!-- summary blocks -->
                <div class="col-12 col-md-6 col-lg-6 col-xxl-3">
                    <div class="card adminuiux-card mb-3 mb-lg-4">
                        <div class="card-body">
                            <div class="row gx-3 align-items-center">
                                <div class="col-auto">
                                    <div class="avatar avatar-60 rounded-circle">
                                        <app-circle-progress-blue-blank class="avatar avatar-60 "></app-circle-progress-blue-blank>
                                        <div class="avatar avatar-40 h5 bg-theme-1-subtle text-theme-1 rounded-circle position-absolute top-50 start-50 translate-middle">
                                            <i class="bi bi-receipt"></i>
                                        </div>
                                    </div>
                                </div>
                                <div class="col">
                                    <p class="text-secondary small mb-1">Total Bills</p>
                                    <h5>25486.00 <small>USD</small></h5>
                                </div>
                                <div class="col-auto">
                                    <div class="dropdown d-inline-block">
                                        <a class="text-secondary no-caret" data-bs-toggle="dropdown" aria-expanded="false" data-bs-display="static" role="button">
                                            <i class="bi bi-three-dots-vertical"></i>
                                        </a>
                                        <ul class="dropdown-menu dropdown-menu-end">
                                            <li><a class="dropdown-item" href="javascript:void(0)">Edit</a></li>
                                            <li><a class="dropdown-item" href="javascript:void(0)">Move</a></li>
                                            <li><a class="dropdown-item text-danger" href="javascript:void(0)">Delete</a></li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-12 col-md-6 col-lg-6 col-xxl-3">
                    <div class="card adminuiux-card mb-3 mb-lg-4">
                        <div class="card-body">
                            <div class="row gx-3 align-items-center">
                                <div class="col-auto">
                                    <div class="avatar avatar-60 rounded-circle">
                                        <app-circle-progress-yellow-blank class="avatar avatar-60 "></app-circle-progress-yellow-blank>
                                        <div class="avatar avatar-40 h5 bg-theme-1-subtle text-theme-1 rounded-circle position-absolute top-50 start-50 translate-middle theme-yellow">
                                            <i class="bi bi-credit-card"></i>
                                        </div>
                                    </div>
                                </div>
                                <div class="col">
                                    <p class="text-secondary small mb-1">Paid Bills</p>
                                    <h5>12550 <small>USD</small></h5>
                                </div>
                                <div class="col-auto">
                                    <div class="dropdown d-inline-block">
                                        <a class="text-secondary no-caret" data-bs-toggle="dropdown" aria-expanded="false" data-bs-display="static" role="button">
                                            <i class="bi bi-three-dots-vertical"></i>
                                        </a>
                                        <ul class="dropdown-menu dropdown-menu-end">
                                            <li><a class="dropdown-item" href="javascript:void(0)">Edit</a></li>
                                            <li><a class="dropdown-item" href="javascript:void(0)">Move</a></li>
                                            <li><a class="dropdown-item text-danger" href="javascript:void(0)">Delete</a></li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-12 col-md-6 col-lg-6 col-xxl-3">
                    <div class="card adminuiux-card mb-3 mb-lg-4">
                        <div class="card-body">
                            <div class="row gx-3 align-items-center">
                                <div class="col-auto">
                                    <div class="avatar avatar-60 rounded-circle">
                                        <app-circle-progress-red-blank class="avatar avatar-60 "></app-circle-progress-red-blank>
                                        <div class="avatar avatar-40 h5 bg-theme-1-subtle text-theme-1 rounded-circle position-absolute top-50 start-50 translate-middle theme-red">
                                            <i class="bi bi-receipt-cutoff"></i>
                                        </div>
                                    </div>
                                </div>
                                <div class="col">
                                    <p class="text-secondary small mb-1">Unpaid Bills</p>
                                    <h5>1525<small>k</small></h5>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-12 col-md-6 col-lg-6 col-xxl-3">
                    <div class="card bg-theme-1 adminuiux-card mb-3 mb-lg-4">
                        <div class="card-body">
                            <div class="row gx-3 align-items-center">
                                <div class="col-auto">
                                    <div class="avatar avatar-60 rounded-circle">
                                        <app-circle-progress-white-blank class="avatar avatar-60 "></app-circle-progress-white-blank>
                                        <div class="avatar avatar-40 h5 bg-white-opacity text-white rounded-circle position-absolute top-50 start-50 translate-middle">
                                            <i class="bi bi-envelope-check"></i>
                                        </div>
                                    </div>
                                </div>
                                <div class="col">
                                    <p class="opacity-50 small mb-1">Sent Bills</p>
                                    <h5>1545k <small>USD</small></h5>
                                </div>
                                <div class="col-auto avatar-group">
                                    <figure class="avatar avatar-30 rounded-circle coverimg overlay-ms-15" data-bs-toggle="tooltip" data-bs-placement="top" title="Shelvey Doe">
                                        <img src="assets/img/modern-ai-image/user-2.jpg" alt="" />
                                    </figure>
                                    <figure class="avatar avatar-30 rounded-circle coverimg overlay-ms-15" data-bs-toggle="tooltip" data-bs-placement="top" title="Maria Smith">
                                        <img src="assets/img/modern-ai-image/user-3.jpg" alt="" />
                                    </figure>
                                    <figure class="avatar avatar-30 rounded-circle coverimg overlay-ms-15" data-bs-toggle="tooltip" data-bs-placement="top" title="Steve Branden">
                                        <img src="assets/img/modern-ai-image/user-4.jpg" alt="" />
                                    </figure>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="row gx-3 gx-lg-4">
                <!-- Balance card -->
                <div class="col-12 col-md-6 col-lg-6 col-xxl-3">
                    <div class="card adminuiux-card mb-3 mb-lg-4 bg-theme-r-gradient">
                        <div class="card-header">
                            <div class="row gx-3 gx-lg-4 align-items-center">
                                <div class="col">
                                    <h6>
                                        <i class="bi bi-wallet2 h5 me-1 avatar avatar-30 rounded"></i>
                                        Wallet
                                    </h6>
                                </div>
                            </div>
                        </div>
                        <div class="card-body pt-0">
                            <div class="text-center mb-3">
                                <figure class="avatar avatar-100 coverimg rounded-circle mb-3 mx-auto">
                                    <img src="assets/img/modern-ai-image/user-6.jpg" class="ususerphotoonboarding" alt="" />
                                </figure>
                                <h5 class="fw-normal mb-1 username">AdminUIUX</h5>
                                <h2 class="">$28,000.00</h2>
                            </div>

                            <div class="row gx-3">
                                <div class="col-6">
                                    <div class="row gx-3 align-items-center">
                                        <div class="col-auto">
                                            <div class="avatar avatar-40 rounded-circle bg-theme-1 theme-green">
                                                <i class="bi bi-arrow-down-left"></i>
                                            </div>
                                        </div>
                                        <div class="col">
                                            <p class="small opacity-50 mb-1">Income</p>
                                            <h5 class="">1525<small>k</small></h5>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-6 text-end">
                                    <div class="row gx-3 align-items-center">
                                        <div class="col">
                                            <p class="small opacity-50 mb-1">Expense</p>
                                            <h5 class="">1321<small>k</small></h5>
                                        </div>
                                        <div class="col-auto">
                                            <div class="avatar avatar-40 rounded-circle bg-theme-1 theme-red">
                                                <i class="bi bi-arrow-up-right"></i>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <!--charts category summary-->
                <div class="col-12 col-md-6 col-lg-3 col-xxl-2">
                    <div class="card adminuiux-card mb-3 mb-lg-4">
                        <div class="card-body">
                            <p class="text-secondary small mb-1">Education</p>
                            <h5>1075 <small>USD</small></h5>
                        </div>
                        <div class="card-body p-0">
                            <div class="mb-1">
                                <app-area-blue-chartjs-60 class="height-60 w-100 d-block"></app-area-blue-chartjs-60>
                            </div>
                        </div>
                    </div>
                    <div class="card adminuiux-card mb-3 mb-lg-4">
                        <div class="card-body">
                            <p class="text-secondary small mb-1">Food</p>
                            <h5>1542 <small>USD</small></h5>
                        </div>
                        <div class="card-body p-0">
                            <div class="mb-1">
                                <app-area-green-chartjs-60 class="height-60 w-100 d-block"></app-area-green-chartjs-60>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-12 col-md-6 col-lg-3 col-xxl-2">
                    <div class="card adminuiux-card mb-3 mb-lg-4">
                        <div class="card-body">
                            <p class="text-secondary small mb-1">Shipment</p>
                            <h5>821 <small>USD</small></h5>
                        </div>
                        <div class="card-body p-0">
                            <div class="w-100 height-60 mb-1">
                                <app-area-yellow-chartjs-60 class="height-60 w-100 d-block"></app-area-yellow-chartjs-60>
                            </div>
                        </div>
                    </div>
                    <div class="card adminuiux-card mb-3 mb-lg-4">
                        <div class="card-body">
                            <p class="text-secondary small mb-1">Grocery</p>
                            <h5>2530 <small>USD</small></h5>
                        </div>
                        <div class="card-body p-0">
                            <div class=" mb-1">
                                <app-area-red-chartjs-60 class="height-60 w-100 d-block"></app-area-red-chartjs-60>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-12 col-md-6 col-lg-6 col-xxl-2">
                    <div class="card adminuiux-card mb-3 mb-lg-4">
                        <div class="card-body">
                            <div class="row gx-3 align-items-center">
                                <div class="col-auto px-2">
                                    <app-circle-progress-blue class="avatar avatar-60 rounded-circle"></app-circle-progress-blue>
                                </div>
                                <div class="col px-1">
                                    <p class="text-secondary small mb-1">Sent Money</p>
                                    <h5>1024 <small>USD</small></h5>
                                </div>
                            </div>
                        </div>
                        <div class="card-body p-0">
                            <app-bar-blue-chartjs-100 class="height-100 w-100 d-block mb-1"></app-bar-blue-chartjs-100>

                            <ul class="list-group list-group-flush bg-transparent">
                                <li class="list-group-item">
                                    <div class="row gx-3 ">
                                        <div class="col-auto align-self-center">
                                            <figure class="avatar avatar-40 rounded-circle coverimg vm">
                                                <img src="assets/img/modern-ai-image/user-4.jpg" alt="" />
                                            </figure>
                                        </div>
                                        <div class="col px-0 align-self-center maxwidth-dynamic" style="--mw-dynamic: calc(100% - 80px)">
                                            <p class="small mb-0 text-truncated">David Warner</p>
                                            <p class="small text-secondary">$ 410.00</p>
                                        </div>
                                        <div class="col-auto ps-0 align-self-center">
                                            <i class="bi bi-chevron-right small vm"></i>
                                        </div>
                                    </div>
                                </li>
                                <li class="list-group-item">
                                    <div class="row gx-3 gx-lg-4">
                                        <div class="col-auto align-self-center">
                                            <figure class="avatar avatar-40 rounded-circle coverimg vm">
                                                <img src="assets/img/modern-ai-image/user-3.jpg" alt="" />
                                            </figure>
                                        </div>
                                        <div class="col px-0 align-self-center maxwidth-dynamic" style="--mw-dynamic: calc(100% - 80px)">
                                            <p class="small mb-0 text-truncated">Shelvey Doe</p>
                                            <p class="small text-secondary">$ 180.00</p>
                                        </div>
                                        <div class="col-auto ps-0 align-self-center">
                                            <i class="bi bi-chevron-right small vm"></i>
                                        </div>
                                    </div>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>

                <div class="col-12 col-md-12 col-lg-6 col-xxl-3">
                    <!-- finance card -->
                    <div class="card adminuiux-card mb-3 mb-lg-4">
                        <div class="card-header">
                            <div class="row gx-3 align-items-center">
                                <div class="col-auto">
                                    <i class="bi bi-cash h5 me-1 avatar avatar-40 bg-theme-1-subtle text-theme-1 rounded"></i>
                                </div>
                                <div class="col">
                                    <h6 class="mb-0">My Cards</h6>
                                    <p class="small text-secondary">Recently Used</p>
                                </div>
                                <div class="col-auto"></div>
                            </div>
                        </div>
                        <div class="card-body pb-1 overflow-hidden">
                            <!-- Credit cards carousel card -->
                            <swiper-container slides-per-view="auto" space-between="20px" autoplay="true" class="swiper swipernav mb-2 overflow-visible">
                                <swiper-slide class="width-240">
                                    <div class="card adminuiux-card mb-2 theme-blue bg-theme-r-gradient overflow-hidden">
                                        <div class="coverimg top-0 start-0 h-100 w-100 position-absolute z-index-0 opacity-25">
                                            <img src="assets/img/modern-ai-image/peacoke-2.jpg" alt="" style="display: none;" />
                                        </div>
                                        <div class="card-body position-relative z-index-1">
                                            <div class="row gx-3 align-items-center mb-4">
                                                <div class="col-auto align-self-center">
                                                    <i class="bi bi-amazon fs-4"></i>
                                                </div>
                                                <div class="col text-end">
                                                    <p class="fs-12">
                                                        <span class="opacity-50 small">City Bank</span><br />
                                                        <span class="">Credit Card</span>
                                                    </p>
                                                </div>
                                            </div>
                                            <p class="fw-medium h6 mb-3">000 0000 0001 546598</p>
                                            <div class="row gx-3 gx-lg-4">
                                                <div class="col-auto fs-12">
                                                    <p class="mb-0 opacity-50 small">Expiry</p>
                                                    <p>09/023</p>
                                                </div>
                                                <div class="col text-end fs-12">
                                                    <p class="mb-0 opacity-50 small">Card Holder</p>
                                                    <p>AdminUIUX</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="row amount-data">
                                        <div class="col">
                                            <p class="opacity-50 small mb-1">Expense</p>
                                            <p>
                                                1500.00 <small class="text-success">18.0% <i class="bi bi-arrow-up"></i></small>
                                            </p>
                                        </div>
                                        <div class="col-auto text-end">
                                            <p class="opacity-50 small mb-1">Limit Remain</p>
                                            <p>13500.00</p>
                                        </div>
                                    </div>
                                </swiper-slide>
                                <swiper-slide class="width-240">
                                    <div class="card adminuiux-card theme-pink bg-theme-r-gradient mb-2 overflow-hidden">
                                        <div class="coverimg top-0 start-0 h-100 w-100 position-absolute z-index-0 opacity-25">
                                            <img src="assets/img/modern-ai-image/flamingo-2.jpg" alt="" style="display: none;" />
                                        </div>
                                        <div class="card-body position-relative z-index-1">
                                            <div class="row gx-3 align-items-center mb-4">
                                                <div class="col-auto align-self-center">
                                                    <i class="bi bi-apple fs-4"></i>
                                                </div>
                                                <div class="col text-end">
                                                    <p class="fs-12">
                                                        <span class="opacity-50 small">City Bank</span><br />
                                                        <span class="">Credit Card</span>
                                                    </p>
                                                </div>
                                            </div>
                                            <p class="fw-medium h6 mb-3">000 0000 0001 546598</p>
                                            <div class="row gx-3 gx-lg-4">
                                                <div class="col-auto fs-12">
                                                    <p class="mb-0 opacity-50 small">Expiry</p>
                                                    <p>09/023</p>
                                                </div>
                                                <div class="col text-end fs-12">
                                                    <p class="mb-0 opacity-50 small">Card Holder</p>
                                                    <p>AdminUIUX</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="row amount-data">
                                        <div class="col">
                                            <p class="text-secondary small mb-1">Expense</p>
                                            <p>
                                                3650.00 <small class="text-danger">11.0% <i class="bi bi-arrow-down"></i></small>
                                            </p>
                                        </div>
                                        <div class="col-auto text-end">
                                            <p class="text-secondary small mb-1">Limit Remain</p>
                                            <p>35500.00</p>
                                        </div>
                                    </div>
                                </swiper-slide>
                                <swiper-slide class="width-240">
                                    <div class="card adminuiux-card theme-yellow bg-r-gradient mb-2">
                                        <div class="card-body">
                                            <div class="row gx-3 align-items-center mb-4">
                                                <div class="col-auto align-self-center">
                                                    <i class="bi bi-amazon fs-4"></i>
                                                </div>
                                                <div class="col text-end">
                                                    <p class="fs-12">
                                                        <span class="opacity-50 small">City Bank</span><br />
                                                        <span class="">Credit Card</span>
                                                    </p>
                                                </div>
                                            </div>
                                            <p class="fw-medium h6 mb-3">000 0000 0001 546598</p>
                                            <div class="row gx-3 gx-lg-4">
                                                <div class="col-auto fs-12">
                                                    <p class="mb-0 opacity-50 small">Expiry</p>
                                                    <p>09/023</p>
                                                </div>
                                                <div class="col text-end fs-12">
                                                    <p class="mb-0 opacity-50 small">Card Holder</p>
                                                    <p>AdminUIUX</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="row amount-data">
                                        <div class="col">
                                            <p class="text-secondary small mb-1">Expense</p>
                                            <p>
                                                1500.00 <small class="text-success">18.0 <i class="bi bi-arrow-up"></i></small>
                                            </p>
                                        </div>
                                        <div class="col-auto text-end">
                                            <p class="text-secondary small mb-1">Limit Remain</p>
                                            <p>13500.00</p>
                                        </div>
                                    </div>
                                </swiper-slide>
                            </swiper-container>
                        </div>
                    </div>
                </div>
            </div>

            <div class="row gx-3 gx-lg-4">
                <div class="col-12 col-md-6 col-lg-6 col-xxl-4">
                    <!-- targets and progress -->
                    <div class="card adminuiux-card position-relative mb-3 mb-lg-4">
                        <div class="coverimg position-absolute end-0 top-0 h-100 w-25 rounded">
                            <img src="assets/img/modern-ai-image/bus-3.jpg" alt="" />
                        </div>
                        <div class="row gx-3">
                            <div class="col-9">
                                <div class="card-body">
                                    <div class="row gx-3">
                                        <div class="col-auto">
                                            <div class="rounded bg-theme-1 p-3">
                                                <i class="bi bi-building mb-1"></i>
                                                <p class="opacity-50 small mb-1">Annual<br />Income</p>
                                                <h5>$2542</h5>
                                            </div>
                                        </div>
                                        <div class="col align-self-center">
                                            <p class="text-secondary small mb-0">United States</p>
                                            <p class="mb-4">New York</p>
                                            <p class="small text-secondary mb-2">Targeted <span class="float-end">$ 11600</span></p>
                                            <div class="progress height-dynamic bg-theme-1-subtle" style="--h-dynamic:5px">
                                                <div class="progress-bar bg-theme-1" role="progressbar" style="width: 45%" aria-valuenow="45" aria-valuemin="0" aria-valuemax="100"></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="col-3 position-relative"></div>
                        </div>
                    </div>
                    <div class="card adminuiux-card theme-green mb-3 mb-lg-4">
                        <div class="card-body">
                            <div class="row gx-3">
                                <div class="col-auto">
                                    <div class="rounded bg-theme-1 text-white p-3">
                                        <i class="bi bi-bank mb-1"></i>
                                        <p class="opacity-50 small mb-1">Assets<br />Income</p>
                                        <h5>$2542</h5>
                                    </div>
                                </div>
                                <div class="col align-self-center">
                                    <div class="row gx-3 gx-lg-4 mb-4">
                                        <div class="col">
                                            <p class="text-secondary small mb-0">United States</p>
                                            <p>New York</p>
                                        </div>
                                        <div class="col-auto text-end">
                                            <p class="text-secondary small mb-0">New Sales</p>
                                            <p>120 orders</p>
                                        </div>
                                    </div>
                                    <p class="small text-secondary mb-2">Targeted Orders<span class="float-end">260</span></p>
                                    <div class="progress height-dynamic bg-theme-1-subtle" style="--h-dynamic:5px">
                                        <div class="progress-bar bg-theme-1" role="progressbar" style="width: 45%" aria-valuenow="45" aria-valuemin="0" aria-valuemax="100"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <!-- Income green chart card -->
                <div class="col-12 col-md-6 col-lg-6 col-xxl-4">
                    <div class="card adminuiux-card mb-3 mb-lg-4">
                        <div class="card-header">
                            <div class="row gx-3 align-items-center">
                                <div class="col-auto">
                                    <i class="bi bi-arrow-down-left h5 avatar avatar-40 bg-theme-1-subtle text-theme-1 theme-green rounded"></i>
                                </div>
                                <div class="col">
                                    <h6 class="mb-0">Income</h6>
                                    <p class="text-secondary small">Last 6 Months</p>
                                </div>
                                <div class="col-auto"></div>
                            </div>
                        </div>
                        <div class="card-body">
                            <h4 class="mb-3">
                                2,545.98
                                <small>
                                    USD <small class="text-theme-1 theme-green"><i class="bi bi-arrow-up"></i> 108.71 (0.73%)</small>
                                </small>
                            </h4>
                            <app-area-green-chartjs-200 class="w-100 height-200 d-block"></app-area-green-chartjs-200>
                        </div>
                    </div>
                </div>
                <!-- Expense red chart card -->
                <div class="col-12 col-md-12 col-lg-6 col-xxl-4">
                    <div class="card adminuiux-card mb-3 mb-lg-4">
                        <div class="card-header">
                            <div class="row gx-3 align-items-center">
                                <div class="col-auto">
                                    <i class="bi bi-arrow-up-right h5 avatar avatar-40 bg-theme-1-subtle text-theme-1 theme-red rounded"></i>
                                </div>
                                <div class="col">
                                    <h6 class="mb-0">Expense</h6>
                                    <p class="text-secondary small">Last 6 Months</p>
                                </div>
                                <div class="col-auto"></div>
                            </div>
                        </div>
                        <div class="card-body">
                            <h4 class="mb-3">
                                1245.98
                                <small>
                                    USD <small class="text-theme-1 theme-green"><i class="bi bi-arrow-up"></i> 200.51 (0.73%)</small>
                                </small>
                            </h4>
                            <app-area-red-chartjs-200 class="w-100 height-200 d-block"></app-area-red-chartjs-200>
                        </div>
                    </div>
                </div>
            </div>

            <div class="row gx-3 gx-lg-4 mb-3 mb-lg-4">
                <div class="col text-center py-3">
                    <h4>Special <span class="text-gradient">Widgets</span> flexible & elastic</h4>
                    <p class="text-secondary">Pick the best which is useful to your customer</p>
                </div>
            </div>

            <div class="row gx-3 gx-lg-4">
                <!-- Paybill -->
                <div class="col-12 col-md-6 col-lg-6 col-xxl-4">
                    <div class="card adminuiux-card overflow-hidden mb-3 mb-lg-4">
                        <div class="card-header">
                            <div class="row gx-3 align-items-center">
                                <div class="col-auto">
                                    <i class="bi bi-receipt h5 avatar avatar-40  bg-theme-1-subtle text-blue rounded"></i>
                                </div>
                                <div class="col">
                                    <h6 class="mb-0">Pay: Sci-Lindsey Coffee</h6>
                                    <p class="text-secondary small">AB-658, Wall Street, NY 3654, USA</p>
                                </div>
                                <div class="col-auto"></div>
                            </div>
                        </div>
                        <div class="card-body">
                            <div class="row h-100">
                                <div class="col text-center">
                                    <h4 class="mb-1">$ 16.00</h4>
                                    <p class="text-secondary small mb-2">6 Coffee, Bread Butter, 2 more...</p>
                                    <div class="avatar avatar-100 coverimg mb-3 rounded">
                                        <img src="assets/img/adminuiux-qr.png" alt="" class="w-100" />
                                    </div>
                                    <a class="btn btn-theme btn-md" routerLink="/app/payment">Pay online</a>
                                </div>
                                <div class="col position-relative text-white text-center">
                                    <div class="h-100 position-relative z-index-0 p-3 bg-theme-1 rounded">
                                        <div class="coverimg position-absolute end-0 top-0 w-100 h-100 rounded opacity-50">
                                            <img src="assets/img/modern-ai-image/flamingo-2.jpg" alt="" />
                                        </div>
                                        <div class="row h-100 position-relative z-index-1">
                                            <div class="col-12 align-self-center">
                                                <h2 class="mb-1">50%</h2>
                                                <p class="lh-20">Instant Discount</p>
                                                <p class="small">Get most popular discounts with easy Google Pay. Just scan QR an pay it.</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Subscribe upgrade plan -->
                <div class="col-12 col-md-6 col-lg-6 col-xxl-4">
                    <div class="card adminuiux-card overflow-hidden mb-3 mb-lg-4">
                        <div class="card-header">
                            <div class="row gx-3 align-items-center">
                                <div class="col-auto">
                                    <i class="bi bi-award h5 avatar avatar-40 bg-theme-1 theme-green rounded"></i>
                                </div>
                                <div class="col">
                                    <h6 class="mb-0">Subscribe PRO account</h6>
                                    <p class="text-secondary small">60 USD per year</p>
                                </div>
                                <div class="col-auto"></div>
                            </div>
                        </div>
                        <div class="card-body p-0">
                            <ul class="list-group list-group-flush border-0 bg-none mb-1">
                                <li class="list-group-item text-secondary">
                                    <div class="row gx-3 gx-lg-4">
                                        <div class="col-auto">
                                            <i class="bi bi-check text-muted"></i>
                                        </div>
                                        <div class="col-auto">Unlimited Send Money</div>
                                    </div>
                                </li>
                                <li class="list-group-item text-secondary">
                                    <div class="row gx-3 gx-lg-4">
                                        <div class="col-auto">
                                            <i class="bi bi-check text-muted"></i>
                                        </div>
                                        <div class="col-auto">Multiple Currencies Support</div>
                                    </div>
                                </li>
                                <li class="list-group-item text-secondary">
                                    <div class="row gx-3 gx-lg-4">
                                        <div class="col-auto">
                                            <i class="bi bi-check text-muted"></i>
                                        </div>
                                        <div class="col-auto">Unlimited Send Money</div>
                                    </div>
                                </li>
                            </ul>
                        </div>
                        <div class="card-body">
                            <div class="row gx-3 mb-3">
                                <div class="col-6">
                                    <div class="form-check form-check-circle">
                                        <input class="form-check-input" type="radio" name="priceupgrade" value="" id="priceupgrade1" checked />
                                        <label class="form-check-label" for="priceupgrade1">
                                            <span class="h4">251.00 <small>USD</small></span
                                            ><br />
                                            <span class="text-secondary small">5 Years <span class="text-theme-1 theme-green">13% Off</span></span>
                                        </label>
                                    </div>
                                </div>
                                <div class="col-6">
                                    <div class="form-check form-check-circle">
                                        <input class="form-check-input" type="radio" name="priceupgrade" value="" id="priceupgrade2" />
                                        <label class="form-check-label" for="priceupgrade2">
                                            <span class="h4">108.00 <small>USD</small></span
                                            ><br />
                                            <span class="text-secondary small">2 Years <span class="text-theme-1 theme-green">10% Off</span></span>
                                        </label>
                                    </div>
                                </div>
                            </div>

                            <div class="row gx-3">
                                <div class="col">
                                    <div class="input-group ">
                                        <span class="input-group-text text-theme-1"><i class="bi bi-tag h5"></i></span>
                                        <input type="text" class="form-control" placeholder="Coupon Code" value="13DISCNEW21" />
                                        <span class="input-group-text text-theme-1 theme-green"><i class="bi bi-patch-check h5"></i></span>
                                    </div>
                                </div>
                                <div class="col-auto">
                                    <a class="btn btn-theme btn-md" routerLink="/app/payment">Pay Now</a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- event and offer -->
                <div class="col-12 col-md-12 col-lg-6 col-xxl-4">
                    <div class="card adminuiux-card mb-3 mb-lg-4">
                        <div class="card-header">
                            <div class="row gx-3 align-items-center">
                                <div class="col-auto">
                                    <i class="bi bi-calendar-event h5 avatar avatar-40 bg-theme-1-subtle text-theme-1 theme-green rounded "></i>
                                </div>
                                <div class="col">
                                    <h6 class="mb-0">Personal Finance Management</h6>
                                    <p class="text-secondary small">Go with trend, Protect your future</p>
                                </div>
                                <div class="col-auto"></div>
                            </div>
                        </div>
                        <div class="card-body">
                            <div class="row gx-3 align-items-center">
                                <div class="col-auto avatar-group">
                                    <div class="avatar avatar-40 coverimg rounded-circle me-1">
                                        <img src="assets/img/modern-ai-image/user-2.jpg" alt="" />
                                    </div>
                                    <div class="avatar avatar-40 coverimg rounded-circle me-1">
                                        <img src="assets/img/modern-ai-image/user-3.jpg" alt="" />
                                    </div>
                                    <div class="avatar avatar-40 coverimg rounded-circle me-1">
                                        <img src="assets/img/modern-ai-image/user-4.jpg" alt="" />
                                    </div>
                                </div>
                                <div class="col">
                                    <p class="text-secondary small mb-0">Joined</p>
                                    <h5>1525k</h5>
                                </div>
                                <div class="col-auto">
                                    <a class="btn btn-theme" routerLink="/app/payment">Pay Now</a>
                                </div>
                            </div>
                        </div>
                        <div class="card adminuiux-card overflow-hidden">
                            <div class="row mx-0">
                                <div class="col-6 pe-0 bg-theme-1 text-center py-4 z-index-1">
                                    <div class="position-relative">
                                        <h2 class="mb-2">15% OFF</h2>
                                        <p class="small mb-3">Price including with our launch offer get 5% Extra</p>
                                        <button class="copy-text btn btn-sm btn-rounded btn-outline-dashed text-white border-white">GOREELLAUNCH</button>
                                    </div>
                                </div>
                                <div class="col-6 position-relative">
                                    <figure class="coverimg position-absolute w-100 h-100 start-0 top-0 m-0">
                                        <img src="assets/img/modern-ai-image/pet-1.jpg" class="mw-100" alt="" />
                                    </figure>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="row gx-3 gx-lg-4">
                <!-- sort summary block -->
                <div class="col-12 col-lg-12 col-xl-12 col-xxl-2 ">
                    <div class="row gx-3 gx-lg-4">
                        <div class="col-12 col-sm-6 col-md-6 col-xxl-12">
                            <div class="card adminuiux-card bg-theme-1 theme-green mb-3 mb-lg-4">
                                <div class="card-header">
                                    <div class="row gx-3 gx-lg-4 align-items-center">
                                        <div class="col">
                                            <i class="bi bi-bank h5 me-1 avatar avatar-40 bg-white-opacity text-white rounded"></i>
                                        </div>
                                        <div class="col-auto"></div>
                                    </div>
                                </div>
                                <div class="card-body">
                                    <h5 class="mb-1">Bank Balance</h5>
                                    <p class="small opacity-75 mb-0">4% Annual Interest</p>
                                    <p class="small opacity-75">6% Lease Earning</p>

                                    <h5 class="mb-1">12546.00 <small>USD</small></h5>
                                    <p class="small opacity-75">16 transactions this month</p>
                                </div>
                            </div>
                        </div>
                        <div class="col-12 col-sm-6 col-md-6 col-xxl-12">
                            <div class="card adminuiux-card mb-3 mb-lg-4">
                                <div class="card-header">
                                    <div class="row gx-3 gx-lg-4 align-items-center">
                                        <div class="col">
                                            <i class="bi bi-bank h5 me-1 avatar avatar-40 bg-theme-1-subtle text-theme-1 rounded"></i>
                                        </div>
                                        <div class="col-auto"></div>
                                    </div>
                                </div>
                                <div class="card-body">
                                    <h5>Crypto Assets</h5>
                                    <p class="small text-secondary">8 Crypto</p>

                                    <h5>12580.00 <small>USD</small></h5>
                                    <p class="small text-theme-1 theme-green"><i class="bi bi-arrow-up"></i> 10.15% Today</p>
                                    <p class="small text-secondary">11 transactions this month</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="col-12 col-md-12 col-lg-12 col-xl-12 col-xxl-10 position-relative ">
                    <!-- Grid table-->
                    <div class="card adminuiux-card mb-3 mb-lg-4">
                        <div class="card-header">
                            <div class="row gx-3">
                                <div class="col-auto mb-3 mb-lg-0">
                                    <i class="bi bi-shop h5 avatar avatar-40 bg-theme-1-subtle text-theme-1 rounded"></i>
                                </div>
                                <div class="col align-self-center mb-3 mb-lg-0">
                                    <h5>Expense</h5>
                                </div>
                                <div class="col-12 col-md-4 col-lg-4 col-xl-3 col-xxl-3 mb-3 mb-lg-0">
                                    <select class="form-select">
                                        <option>All Categories</option>
                                        <optgroup label="Food">
                                            <option>- Work</option>
                                            <option>- Home</option>
                                        </optgroup>
                                        <optgroup label="Children">
                                            <option>- Fees</option>
                                            <option>- Enjoyment</option>
                                        </optgroup>
                                        <optgroup label="Transportation">
                                            <option>- Personal</option>
                                            <option>- Work</option>
                                        </optgroup>
                                        <optgroup label="Home">
                                            <option>- Rent</option>
                                            <option>- Maintenance</option>
                                        </optgroup>
                                        <option>Personal</option>
                                        <option>Other</option>
                                    </select>
                                </div>
                                <div class="col-12 col-md-auto ms-auto mb-lg-0">
                                    <div class="input-group ">
                                        <span class="input-group-text text-theme-1"><i class="bi bi-search"></i></span>
                                        <input type="text" class="form-control" placeholder="Search..." />
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="row gx-0 h-100">
                            <div class="col-12 col-lg-12 col-xl-8 col-xxl-8">
                                <div class="card-body py-0">
                                    <table class="table table-borderless" id="dataTable" data-show-toggle="true">
                                        <thead>
                                            <tr>
                                                <th class="width-10"></th>
                                                <th class="all">Expense</th>
                                                <th class="xs">Amount</th>
                                                <th class="desktop">Category</th>
                                                <th class="tablet">Status</th>
                                                <th class="none">Deliver to</th>
                                                <th class="none">Address</th>
                                                <th class="none">Location</th>
                                                <th class="none">Payment</th>
                                                <th class="all">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr>
                                                <td></td>
                                                <td>
                                                    <div class="row gx-3 gx-lg-4 align-items-center">
                                                        <div class="col-auto">
                                                            <div class="avatar avatar-40 mb-0 coverimg rounded-circle bg-theme-1 theme-orange">
                                                                <i class="bi bi-currency-bitcoin"></i>
                                                            </div>
                                                        </div>
                                                        <div class="col">
                                                            <p class="mb-0">BitCoins</p>
                                                            <p class="text-secondary small">1 way trip</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td>
                                                    <p class="mb-0">0.000015</p>
                                                    <p class="text-secondary small">BTC</p>
                                                </td>
                                                <td>
                                                    <p class="mb-0">Traveling</p>
                                                    <p class="text-secondary small">Work</p>
                                                </td>
                                                <td>
                                                    <span class="badge badge-sm badge-light text-bg-success">Delivered</span>
                                                </td>
                                                <td>John Doe</td>
                                                <td>2356, Street-5, New York 4586, US</td>
                                                <td>
                                                    <p class="mb-1">Lat: 5.678167, Long: 12.078613</p>
                                                    <p class="text-secondary small">This can be a map also</p>
                                                </td>
                                                <td>
                                                    <span class="badge rounded-5 bg-green">Paid</span>
                                                </td>
                                                <td>
                                                    <div class="dropdown d-inline-block">
                                                        <a class="text-secondary no-caret" data-bs-toggle="dropdown" aria-expanded="false" data-bs-display="static" role="button">
                                                            <i class="bi bi-three-dots"></i>
                                                        </a>
                                                        <ul class="dropdown-menu dropdown-menu-end">
                                                            <li><a class="dropdown-item" href="javascript:void(0)">Edit</a></li>
                                                            <li><a class="dropdown-item" href="javascript:void(0)">Move</a></li>
                                                            <li><a class="dropdown-item text-danger" href="javascript:void(0)">Delete</a></li>
                                                        </ul>
                                                    </div>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td></td>
                                                <td>
                                                    <div class="row gx-3 gx-lg-4 align-items-center">
                                                        <div class="col-auto">
                                                            <figure class="avatar avatar-40 mb-0 coverimg rounded-circle">
                                                                <img src="assets/img/modern-ai-image/tree-5.jpg" alt="" />
                                                            </figure>
                                                        </div>
                                                        <div class="col">
                                                            <p class="mb-0">Starbucks</p>
                                                            <p class="text-secondary small">2 Coffee</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td>
                                                    <p class="mb-0">6.00</p>
                                                    <p class="text-secondary small">USD</p>
                                                </td>
                                                <td>
                                                    <p class="mb-0">Food</p>
                                                    <p class="text-secondary small">Work</p>
                                                </td>
                                                <td>
                                                    <span class="badge badge-sm badge-light text-bg-success">Delivered</span>
                                                </td>
                                                <td>John Doe</td>
                                                <td>2356, Street-5, New York 4586, US</td>
                                                <td>
                                                    <p class="mb-1">Lat: 5.678167, Long: 12.078613</p>
                                                    <p class="text-secondary small">This can be a map also</p>
                                                </td>
                                                <td>
                                                    <span class="badge rounded-5 bg-theme-1 theme-blue">Waiting</span>
                                                </td>
                                                <td>
                                                    <div class="dropdown d-inline-block">
                                                        <a class="text-secondary no-caret" data-bs-toggle="dropdown" aria-expanded="false" data-bs-display="static" role="button">
                                                            <i class="bi bi-three-dots"></i>
                                                        </a>
                                                        <ul class="dropdown-menu dropdown-menu-end">
                                                            <li><a class="dropdown-item" href="javascript:void(0)">Edit</a></li>
                                                            <li><a class="dropdown-item" href="javascript:void(0)">Move</a></li>
                                                            <li><a class="dropdown-item text-danger" href="javascript:void(0)">Delete</a></li>
                                                        </ul>
                                                    </div>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td></td>
                                                <td>
                                                    <div class="row gx-3 gx-lg-4 align-items-center">
                                                        <div class="col-auto">
                                                            <div class="avatar avatar-40 mb-0 coverimg rounded-circle bg-theme-1 theme-green">
                                                                <i class="bi bi-cup-hot"></i>
                                                            </div>
                                                        </div>
                                                        <div class="col">
                                                            <p class="mb-0">Starbucks</p>
                                                            <p class="text-secondary small">2 Coffee</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td>
                                                    <p class="mb-0">6.00</p>
                                                    <p class="text-secondary small">USD</p>
                                                </td>
                                                <td>
                                                    <p class="mb-0">Food</p>
                                                    <p class="text-secondary small">Work</p>
                                                </td>
                                                <td>
                                                    <span class="badge badge-sm badge-light text-bg-success">Delivered</span>
                                                </td>
                                                <td>John Doe</td>
                                                <td>2356, Street-5, New York 4586, US</td>
                                                <td>
                                                    <p class="mb-1">Lat: 5.678167, Long: 12.078613</p>
                                                    <p class="text-secondary small">This can be a map also</p>
                                                </td>
                                                <td>
                                                    <span class="badge rounded-5 bg-theme-1 theme-blue">Waiting</span>
                                                </td>
                                                <td>
                                                    <div class="dropdown d-inline-block">
                                                        <a class="text-secondary no-caret" data-bs-toggle="dropdown" aria-expanded="false" data-bs-display="static" role="button">
                                                            <i class="bi bi-three-dots"></i>
                                                        </a>
                                                        <ul class="dropdown-menu dropdown-menu-end">
                                                            <li><a class="dropdown-item" href="javascript:void(0)">Edit</a></li>
                                                            <li><a class="dropdown-item" href="javascript:void(0)">Move</a></li>
                                                            <li><a class="dropdown-item text-danger" href="javascript:void(0)">Delete</a></li>
                                                        </ul>
                                                    </div>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td></td>
                                                <td>
                                                    <div class="row gx-3 gx-lg-4 align-items-center">
                                                        <div class="col-auto">
                                                            <figure class="avatar avatar-40 mb-0 coverimg rounded-circle">
                                                                <img src="assets/img/modern-ai-image/pet-4.jpg" alt="" />
                                                            </figure>
                                                        </div>
                                                        <div class="col">
                                                            <p class="mb-0">PetMall</p>
                                                            <p class="text-secondary small">12 Items</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td>
                                                    <p class="mb-0">180.00</p>
                                                    <p class="text-secondary small">USD</p>
                                                </td>
                                                <td>
                                                    <p class="mb-0">Grocery</p>
                                                    <p class="text-secondary small">Home</p>
                                                </td>
                                                <td>
                                                    <span class="badge badge-sm badge-light text-bg-success">Delivered</span>
                                                </td>
                                                <td>John Doe</td>
                                                <td>2356, Street-5, New York 4586, US</td>
                                                <td>
                                                    <p class="mb-1">Lat: 5.678167, Long: 12.078613</p>
                                                    <p class="text-secondary small">This can be a map also</p>
                                                </td>
                                                <td>
                                                    <span class="badge rounded-5 bg-red">Unpaid</span>
                                                </td>
                                                <td>
                                                    <div class="dropdown d-inline-block">
                                                        <a class="text-secondary no-caret" data-bs-toggle="dropdown" aria-expanded="false" data-bs-display="static" role="button">
                                                            <i class="bi bi-three-dots"></i>
                                                        </a>
                                                        <ul class="dropdown-menu dropdown-menu-end">
                                                            <li><a class="dropdown-item" href="javascript:void(0)">Edit</a></li>
                                                            <li><a class="dropdown-item" href="javascript:void(0)">Move</a></li>
                                                            <li><a class="dropdown-item text-danger" href="javascript:void(0)">Delete</a></li>
                                                        </ul>
                                                    </div>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td></td>
                                                <td>
                                                    <div class="row gx-3 gx-lg-4 align-items-center">
                                                        <div class="col-auto">
                                                            <div class="avatar avatar-40 mb-0 coverimg rounded-circle bg-theme-1 theme-cyan">
                                                                <i class="bi bi-basket"></i>
                                                            </div>
                                                        </div>
                                                        <div class="col">
                                                            <p class="mb-0">EasyMall</p>
                                                            <p class="text-secondary small">12 Items</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td>
                                                    <p class="mb-0">180.00</p>
                                                    <p class="text-secondary small">USD</p>
                                                </td>
                                                <td>
                                                    <p class="mb-0">Grocery</p>
                                                    <p class="text-secondary small">Home</p>
                                                </td>
                                                <td>
                                                    <span class="badge badge-sm badge-light text-bg-success">Delivered</span>
                                                </td>
                                                <td>John Doe</td>
                                                <td>2356, Street-5, New York 4586, US</td>
                                                <td>
                                                    <p class="mb-1">Lat: 5.678167, Long: 12.078613</p>
                                                    <p class="text-secondary small">This can be a map also</p>
                                                </td>
                                                <td>
                                                    <span class="badge rounded-5 bg-red">Unpaid</span>
                                                </td>
                                                <td>
                                                    <div class="dropdown d-inline-block">
                                                        <a class="text-secondary no-caret" data-bs-toggle="dropdown" aria-expanded="false" data-bs-display="static" role="button">
                                                            <i class="bi bi-three-dots"></i>
                                                        </a>
                                                        <ul class="dropdown-menu dropdown-menu-end">
                                                            <li><a class="dropdown-item" href="javascript:void(0)">Edit</a></li>
                                                            <li><a class="dropdown-item" href="javascript:void(0)">Move</a></li>
                                                            <li><a class="dropdown-item text-danger" href="javascript:void(0)">Delete</a></li>
                                                        </ul>
                                                    </div>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td></td>
                                                <td>
                                                    <div class="row gx-3 gx-lg-4 align-items-center">
                                                        <div class="col-auto">
                                                            <div class="avatar avatar-40 mb-0 coverimg rounded-circle bg-theme-1 theme-red">
                                                                <i class="bi bi-flower1"></i>
                                                            </div>
                                                        </div>
                                                        <div class="col">
                                                            <p class="mb-0">Zomaatos</p>
                                                            <p class="text-secondary small">Meal</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td>
                                                    <p class="mb-0">12.00</p>
                                                    <p class="text-secondary small">USD</p>
                                                </td>
                                                <td>
                                                    <p class="mb-0">Food</p>
                                                    <p class="text-secondary small">Work</p>
                                                </td>
                                                <td>
                                                    <span class="badge badge-sm badge-light text-bg-success">Delivered</span>
                                                </td>
                                                <td>John Doe</td>
                                                <td>2356, Street-5, New York 4586, US</td>
                                                <td>
                                                    <p class="mb-1">Lat: 5.678167, Long: 12.078613</p>
                                                    <p class="text-secondary small">This can be a map also</p>
                                                </td>
                                                <td>
                                                    <span class="badge rounded-5 bg-green">Paid</span>
                                                </td>
                                                <td>
                                                    <div class="dropdown d-inline-block">
                                                        <a class="text-secondary no-caret" data-bs-toggle="dropdown" aria-expanded="false" data-bs-display="static" role="button">
                                                            <i class="bi bi-three-dots"></i>
                                                        </a>
                                                        <ul class="dropdown-menu dropdown-menu-end">
                                                            <li><a class="dropdown-item" href="javascript:void(0)">Edit</a></li>
                                                            <li><a class="dropdown-item" href="javascript:void(0)">Move</a></li>
                                                            <li><a class="dropdown-item text-danger" href="javascript:void(0)">Delete</a></li>
                                                        </ul>
                                                    </div>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td></td>
                                                <td>
                                                    <div class="row gx-3 gx-lg-4 align-items-center">
                                                        <div class="col-auto">
                                                            <figure class="avatar avatar-40 mb-0 coverimg rounded-circle">
                                                                <img src="assets/img/modern-ai-image/lion-2.jpg" alt="" />
                                                            </figure>
                                                        </div>
                                                        <div class="col">
                                                            <p class="mb-0">LeoCoin</p>
                                                            <p class="text-secondary small">1 way</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td>
                                                    <p class="mb-0">0.000015</p>
                                                    <p class="text-secondary small">BTC</p>
                                                </td>
                                                <td>
                                                    <p class="mb-0">Traveling</p>
                                                    <p class="text-secondary small">Work</p>
                                                </td>
                                                <td>
                                                    <span class="badge badge-sm badge-light text-bg-primary">In-Progress</span>
                                                </td>
                                                <td>John Doe</td>
                                                <td>2356, Street-5, New York 4586, US</td>
                                                <td>
                                                    <p class="mb-1">Lat: 5.678167, Long: 12.078613</p>
                                                    <p class="text-secondary small">This can be a map also</p>
                                                </td>
                                                <td>
                                                    <span class="badge rounded-5 bg-green">Paid</span>
                                                </td>
                                                <td>
                                                    <div class="dropdown d-inline-block">
                                                        <a class="text-secondary no-caret" data-bs-toggle="dropdown" aria-expanded="false" data-bs-display="static" role="button">
                                                            <i class="bi bi-three-dots"></i>
                                                        </a>
                                                        <ul class="dropdown-menu dropdown-menu-end">
                                                            <li><a class="dropdown-item" href="javascript:void(0)">Edit</a></li>
                                                            <li><a class="dropdown-item" href="javascript:void(0)">Move</a></li>
                                                            <li><a class="dropdown-item text-danger" href="javascript:void(0)">Delete</a></li>
                                                        </ul>
                                                    </div>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td></td>
                                                <td>
                                                    <div class="row gx-3 gx-lg-4 align-items-center">
                                                        <div class="col-auto">
                                                            <div class="avatar avatar-40 mb-0 coverimg rounded-circle bg-theme-1 theme-grey">
                                                                <i class="bi bi-car-front"></i>
                                                            </div>
                                                        </div>
                                                        <div class="col">
                                                            <p class="mb-0">UserCars</p>
                                                            <p class="text-secondary small">Round Trip</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td>
                                                    <p class="mb-0">251.00</p>
                                                    <p class="text-secondary small">USD</p>
                                                </td>
                                                <td>
                                                    <p class="mb-0">Travelling</p>
                                                    <p class="text-secondary small">Home</p>
                                                </td>
                                                <td>
                                                    <span class="badge badge-sm badge-light text-bg-success">Delivered</span>
                                                </td>
                                                <td>John Doe</td>
                                                <td>2356, Street-5, New York 4586, US</td>
                                                <td>
                                                    <p class="mb-1">Lat: 5.678167, Long: 12.078613</p>
                                                    <p class="text-secondary small">This can be a map also</p>
                                                </td>
                                                <td>
                                                    <span class="badge rounded-5 bg-theme-1 theme-blue">Waiting</span>
                                                </td>
                                                <td>
                                                    <div class="dropdown d-inline-block">
                                                        <a class="text-secondary no-caret" data-bs-toggle="dropdown" aria-expanded="false" data-bs-display="static" role="button">
                                                            <i class="bi bi-three-dots"></i>
                                                        </a>
                                                        <ul class="dropdown-menu dropdown-menu-end">
                                                            <li><a class="dropdown-item" href="javascript:void(0)">Edit</a></li>
                                                            <li><a class="dropdown-item" href="javascript:void(0)">Move</a></li>
                                                            <li><a class="dropdown-item text-danger" href="javascript:void(0)">Delete</a></li>
                                                        </ul>
                                                    </div>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td></td>
                                                <td>
                                                    <div class="row gx-3 gx-lg-4 align-items-center">
                                                        <div class="col-auto">
                                                            <figure class="avatar avatar-40 mb-0 coverimg rounded-circle">
                                                                <img src="assets/img/modern-ai-image/bus-7.jpg" alt="" />
                                                            </figure>
                                                        </div>
                                                        <div class="col">
                                                            <p class="mb-0">Bus Service</p>
                                                            <p class="text-secondary small">Round Trip</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td>
                                                    <p class="mb-0">251.00</p>
                                                    <p class="text-secondary small">USD</p>
                                                </td>
                                                <td>
                                                    <p class="mb-0">Travelling</p>
                                                    <p class="text-secondary small">Home</p>
                                                </td>
                                                <td>
                                                    <span class="badge badge-sm badge-light text-bg-theme-1 theme-orange">Pending</span>
                                                </td>
                                                <td>John Doe</td>
                                                <td>2356, Street-5, New York 4586, US</td>
                                                <td>
                                                    <p class="mb-1">Lat: 5.678167, Long: 12.078613</p>
                                                    <p class="text-secondary small">This can be a map also</p>
                                                </td>
                                                <td>
                                                    <span class="badge rounded-5 bg-theme-1 theme-blue">Waiting</span>
                                                </td>
                                                <td>
                                                    <div class="dropdown d-inline-block">
                                                        <a class="text-secondary no-caret" data-bs-toggle="dropdown" aria-expanded="false" data-bs-display="static" role="button">
                                                            <i class="bi bi-three-dots"></i>
                                                        </a>
                                                        <ul class="dropdown-menu dropdown-menu-end">
                                                            <li><a class="dropdown-item" href="javascript:void(0)">Edit</a></li>
                                                            <li><a class="dropdown-item" href="javascript:void(0)">Move</a></li>
                                                            <li><a class="dropdown-item text-danger" href="javascript:void(0)">Delete</a></li>
                                                        </ul>
                                                    </div>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td></td>
                                                <td>
                                                    <div class="row gx-3 gx-lg-4 align-items-center">
                                                        <div class="col-auto">
                                                            <figure class="avatar avatar-40 mb-0 coverimg rounded-circle">
                                                                <img src="assets/img/modern-ai-image/taxi-1.jpg" alt="" />
                                                            </figure>
                                                        </div>
                                                        <div class="col">
                                                            <p class="mb-0">Zomaatos</p>
                                                            <p class="text-secondary small">Meal</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td>
                                                    <p class="mb-0">12.00</p>
                                                    <p class="text-secondary small">USD</p>
                                                </td>
                                                <td>
                                                    <p class="mb-0">Food</p>
                                                    <p class="text-secondary small">Work</p>
                                                </td>
                                                <td>
                                                    <span class="badge badge-sm badge-light text-bg-success">Delivered</span>
                                                </td>
                                                <td>John Doe</td>
                                                <td>2356, Street-5, New York 4586, US</td>
                                                <td>
                                                    <p class="mb-1">Lat: 5.678167, Long: 12.078613</p>
                                                    <p class="text-secondary small">This can be a map also</p>
                                                </td>
                                                <td>
                                                    <span class="badge rounded-5 bg-green">Paid</span>
                                                </td>
                                                <td>
                                                    <div class="dropdown d-inline-block">
                                                        <a class="text-secondary no-caret" data-bs-toggle="dropdown" aria-expanded="false" data-bs-display="static" role="button">
                                                            <i class="bi bi-three-dots"></i>
                                                        </a>
                                                        <ul class="dropdown-menu dropdown-menu-end">
                                                            <li><a class="dropdown-item" href="javascript:void(0)">Edit</a></li>
                                                            <li><a class="dropdown-item" href="javascript:void(0)">Move</a></li>
                                                            <li><a class="dropdown-item text-danger" href="javascript:void(0)">Delete</a></li>
                                                        </ul>
                                                    </div>
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                            <div class="col-12 col-lg-12 col-xl-4 col-xxl-4 bg-theme-1-subtle">
                                <div class="card-body py-0">
                                    <div class="row h-100">
                                        <div class="col-12 text-center">
                                            <div class="width-180 my-3 my-lg-4 position-relative mx-auto">
                                                <app-doughnut-chartjs-180 class="avatar avater-180 d-block rounded-circle"></app-doughnut-chartjs-180>
                                                <div class="avatar avatar-130 rounded-circle shadow position-absolute top-50 start-50 translate-middle z-index-1">
                                                    <div class="w-100 lh-20">
                                                        <h4 class="mb-1">2,55.98K</h4>
                                                        <p class="text-theme-1 theme-green">18.71 (0.73%)</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="col-12 position-relative">
                                            <swiper-container slides-per-view="auto" space-between="0" autoplay="true" class="swiper swipernav mb-3 mb-lg-4">
                                                <swiper-slide class="w-50">
                                                    <div class="row gx-3">
                                                        <div class="col-auto">
                                                            <span class="avatar avatar-50 bg-theme-1 theme-green rounded">
                                                                <i class="bi bi-truck h5"></i>
                                                            </span>
                                                        </div>
                                                        <div class="col">
                                                            <h5 class="mb-1">120 <small>USD</small></h5>
                                                            <p class="text-secondary small">Transport</p>
                                                        </div>
                                                        <div class="col-12 mt-2">
                                                            <div class="row gx-2">
                                                                <div class="col-4">
                                                                    <p class="text-secondary small">Home</p>
                                                                </div>
                                                                <div class="col-8">
                                                                    <p class="text-theme-1 theme-green small">8.30 %</p>
                                                                </div>
                                                            </div>
                                                            <div class="row gx-2">
                                                                <div class="col-4">
                                                                    <p class="text-secondary small">Work</p>
                                                                </div>
                                                                <div class="col-8">
                                                                    <p class="text-theme-1 theme-green small">2.65 %</p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </swiper-slide>
                                                <swiper-slide class="w-50">
                                                    <div class="row gx-3">
                                                        <div class="col-auto">
                                                            <span class="avatar avatar-50 bg-theme-1 theme-yellow rounded">
                                                                <i class="bi bi-egg-fried h5"></i>
                                                            </span>
                                                        </div>
                                                        <div class="col">
                                                            <h5 class="mb-1">168 <small>USD</small></h5>
                                                            <p class="text-secondary small">Food</p>
                                                        </div>
                                                        <div class="col-12 mt-2">
                                                            <div class="row gx-2">
                                                                <div class="col-4">
                                                                    <p class="text-secondary small">Home</p>
                                                                </div>
                                                                <div class="col-8">
                                                                    <p class="text-theme-1 theme-green small">5.30 %</p>
                                                                </div>
                                                            </div>
                                                            <div class="row gx-2">
                                                                <div class="col-4">
                                                                    <p class="text-secondary small">Work</p>
                                                                </div>
                                                                <div class="col-8">
                                                                    <p class="text-theme-1 theme-red small">2.00 %</p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </swiper-slide>
                                                <swiper-slide class="w-50">
                                                    <div class="row gx-3">
                                                        <div class="col-auto">
                                                            <span class="avatar avatar-50  bg-theme-1 theme-red rounded">
                                                                <i class="bi bi-person h5"></i>
                                                            </span>
                                                        </div>
                                                        <div class="col">
                                                            <h5 class="mb-1">200 <small>USD</small></h5>
                                                            <p class="text-secondary small">Children</p>
                                                        </div>
                                                        <div class="col-12 mt-2">
                                                            <div class="row gx-2">
                                                                <div class="col-6">
                                                                    <p class="text-secondary small">Fees</p>
                                                                </div>
                                                                <div class="col-6">
                                                                    <p class="text-theme-1 theme-green small">530 USD</p>
                                                                </div>
                                                            </div>
                                                            <div class="row gx-2">
                                                                <div class="col-6">
                                                                    <p class="text-secondary small">Enjoyment</p>
                                                                </div>
                                                                <div class="col-6">
                                                                    <p class="text-theme-1 theme-red small">10.00 %</p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </swiper-slide>
                                            </swiper-container>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `,
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class FinanceDashboardComponent implements OnInit, OnDestroy {
    @ViewChild("choices") mySelect!: ElementRef;

    /**
     * Fase 5b/5c: equipos marcados para facturación urgente (campanita).
     *
     * Fase 5c añade lo que faltaba: el cliente pidió que la campanita suene
     * PERIÓDICAMENTE ("cada 10 minutos"), y la Fase 5b sólo cargaba una vez al
     * entrar al dashboard — o sea que un equipo marcado urgente mientras la
     * pestaña estaba abierta no se veía hasta recargar. Sin polling no hay
     * campanita.
     */
    priorityBillingItems: ProspectEquipmentSummary[] = [];

    /** Último conteo conocido, para avisar sólo cuando APARECE trabajo nuevo. */
    private lastPriorityCount = 0;
    /** Mensaje transitorio del aviso (toast) de la campanita. */
    priorityBillingToast = "";
    private priorityToastTimer: ReturnType<typeof setTimeout> | null = null;
    private priorityPollTimer: ReturnType<typeof setInterval> | null = null;

    /**
     * 10 minutos, que es lo que pidió el cliente. Se declara como constante con
     * nombre para que el intervalo sea verificable y no un número mágico.
     */
    private static readonly PRIORITY_POLL_INTERVAL_MS = 10 * 60 * 1000;

    constructor(private readonly crmEquipmentApi: CrmEquipmentApiService) {}

    ngOnInit(): void {
        // Carga inicial + sondeo cada 10 minutos. El filtro priorityBilling=true
        // va en el backend (Fase 5c): antes se traían TODOS los ítems y se
        // filtraba en el navegador, que es el patrón que el plan prohíbe.
        this.loadPriorityBillingItems(true);

        this.priorityPollTimer = setInterval(
            () => this.loadPriorityBillingItems(false),
            FinanceDashboardComponent.PRIORITY_POLL_INTERVAL_MS,
        );
    }

    ngOnDestroy(): void {
        // Sin esto el intervalo sigue disparando peticiones después de salir
        // del dashboard, que es justo lo que el requisito de "no martillar el
        // servidor" busca evitar.
        if (this.priorityPollTimer !== null) {
            clearInterval(this.priorityPollTimer);
            this.priorityPollTimer = null;
        }
        if (this.priorityToastTimer !== null) {
            clearTimeout(this.priorityToastTimer);
            this.priorityToastTimer = null;
        }
    }

    /**
     * @param initial en la carga inicial no se muestra toast (el badge ya está
     *   visible al entrar); en los sondeos siguientes sí, porque es la única
     *   señal de que apareció trabajo urgente mientras la pestaña estaba abierta.
     */
    private loadPriorityBillingItems(initial: boolean): void {
        this.crmEquipmentApi.listItems({ includeArchived: false, priorityBilling: true }).subscribe({
            next: (items) => {
                this.priorityBillingItems = items;

                const count = items.length;
                const grew = count > this.lastPriorityCount;
                this.lastPriorityCount = count;

                if (!initial && grew) {
                    this.showPriorityToast(count);
                }
            },
            error: () => {
                // Un fallo de red no debe borrar la campanita y hacer creer que
                // ya no hay nada urgente: se conserva lo último conocido.
            },
        });
    }

    private showPriorityToast(count: number): void {
        this.priorityBillingToast = count === 1
            ? "Facturación urgente: 1 equipo nuevo marcado para facturar con prioridad."
            : `Facturación urgente: ${count} equipos marcados para facturar con prioridad.`;

        if (this.priorityToastTimer !== null) {
            clearTimeout(this.priorityToastTimer);
        }
        this.priorityToastTimer = setTimeout(() => {
            this.priorityBillingToast = "";
            this.priorityToastTimer = null;
        }, 12000);
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

        // data table
        const table = new DataTable("#dataTable", {
            searching: false,
            lengthChange: false,
            autoWidth: false,
            columnDefs: [{ orderable: false, targets: 4 }],
            order: [[0, "desc"]],
            pageLength: 6,
            responsive: true,
        });
    }
}
