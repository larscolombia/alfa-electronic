import { Component, OnInit, AfterViewInit, AfterContentChecked, OnDestroy, ViewChild, ElementRef, CUSTOM_ELEMENTS_SCHEMA } from "@angular/core";
import { RouterLink } from "@angular/router";
import Choices, { ClassNames } from "choices.js";
import DataTable from "datatables.net-dt";
import "datatables.net-responsive-dt";
declare const jsVectorMap: any;

import { DaterangePickerRangesComponent } from "../../../components/input-fields/daterange-picker/daterange-picker-ranges.component";
import { InventoryBannerChartComponent } from "../../../components/charts/inventory-banner-chart.component";
import { CircleProgressRedComponent } from "../../../components/charts/circle-progress-red.component";
import { CircleProgressBlueComponent } from "../../../components/charts/circle-progress-blue.component";
import { CircleProgressYellowComponent } from "../../../components/charts/circle-progress-yellow.component";
import { CircleProgressGreenComponent } from "../../../components/charts/circle-progress-green.component";
import { SemiDoughnutChartjs180Component } from "../../../components/charts/semi-doughnut-chartjs-180.component";
import { CircleProgressBlueBlankComponent } from "../../../components/charts/circle-progress-blue-blank.component";
import { CircleProgressRedBlankComponent } from "../../../components/charts/circle-progress-red-blank.component";
import { CircleProgressYellowBlankComponent } from "../../../components/charts/circle-progress-yellow-blank.component";
import { CircleProgressWhiteBlankComponent } from "../../../components/charts/circle-progress-white-blank.component";
import { PolarAreaChartjs180Component } from "../../../components/charts/polararea-chartjs-180.component";

@Component({
    selector: "app-inventory-dashboard",
    standalone: true,
    imports: [RouterLink, DaterangePickerRangesComponent, InventoryBannerChartComponent, CircleProgressRedComponent, CircleProgressBlueComponent, CircleProgressYellowComponent, CircleProgressGreenComponent, SemiDoughnutChartjs180Component, CircleProgressBlueBlankComponent, CircleProgressRedBlankComponent, CircleProgressYellowBlankComponent, CircleProgressWhiteBlankComponent, PolarAreaChartjs180Component],
    template: `
        <!-- page title -->
        <div class="container-fluid py-3">
            <div class="row gx-3 gx-lg-4 align-items-center page-title">
                <div class="col col-sm mb-3 mb-sm-0 order-1">
                    <h5 class="mb-0">Panel de inventario</h5>
                    <p class="text-secondary small">Mantente atento a la demanda y oferta del mercado. Manten stock disponible.</p>
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
                                <div class="invalid-feedback">Ya seleccionaste el maximo de opciones permitido. (Esto es configurable)</div>
                            </div>
                            <div class="p-1">
                                <h6 class="mb-0">Pedidos:</h6>
                                <p class="text-secondary small">1256 pedidos la semana pasada</p>
                            </div>
                            <ul class="list-group list-group-flush bg-transparent border-0 mb-2">
                                <li class="list-group-item">
                                    <div class="row gx-3 gx-lg-4">
                                        <div class="col">Pedidos en linea</div>
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
                                        <div class="col">Pedidos fuera de linea</div>
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
                    <li class="breadcrumb-item bi active" aria-current="page">Inventario</li>
                </ol>
            </nav>
        </div>

        <!-- content -->
        <div class="container mt-3" id="main-content">
            <div class="row gx-3 gx-lg-4">
                <!-- summary sales delivery stocks-->
                <div class="col-12 col-md-12 col-lg-6 ">
                    <div class="card adminuiux-card mb-3 mb-lg-4">
                        <div class="card-header">
                            <div class="row gx-3 align-items-center">
                                <div class="col-auto">
                                    <div class="avatar avatar-40 rounded bg-theme-1-subtle text-theme-1 theme-blue">
                                        <i class="bi bi-bag h5"></i>
                                    </div>
                                </div>
                                <div class="col">
                                    <h6 class="mb-0">Resumen de ventas</h6>
                                    <p class="small text-secondary">Ventas de este mes</p>
                                </div>
                            </div>
                        </div>
                        <div class="card-body">
                            <div class="row gx-3 mb-3">
                                <div class="col-6">
                                    <div class="row gx-3 align-items-center">
                                        <div class="col-auto">
                                            <div class="avatar avatar-50 rounded bg-theme-1-subtle text-theme-1 theme-cyan">
                                                <i class="bi bi-cart h5"></i>
                                            </div>
                                        </div>
                                        <div class="col">
                                            <p class="small text-secondary mb-0">Ventas totales</p>
                                            <h5>7258</h5>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-6">
                                    <div class="row gx-3 align-items-center">
                                        <div class="col-auto">
                                            <div class="avatar avatar-50 rounded bg-theme-1-subtle text-theme-1 theme-yellow">
                                                <i class="bi bi-bar-chart h5"></i>
                                            </div>
                                        </div>
                                        <div class="col">
                                            <p class="small text-secondary mb-0">Ingresos</p>
                                            <h5>50000 <small class="h6">USD</small></h5>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="row gx-3">
                                <div class="col-6">
                                    <div class="row gx-3 align-items-center">
                                        <div class="col-auto">
                                            <div class="avatar avatar-50 rounded bg-theme-1-subtle text-theme-1 theme-red">
                                                <i class="bi bi-coin h5"></i>
                                            </div>
                                        </div>
                                        <div class="col">
                                            <p class="small text-secondary mb-0">Costo</p>
                                            <h5>36850 <small class="h6">USD</small></h5>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-6">
                                    <div class="row gx-3 align-items-center">
                                        <div class="col-auto">
                                            <div class="avatar avatar-50 rounded bg-theme-1-subtle text-theme-1 theme-green">
                                                <i class="bi bi-arrow-up-right h5"></i>
                                            </div>
                                        </div>
                                        <div class="col">
                                            <p class="small text-secondary mb-0">Ganancia</p>
                                            <h5>13158 <small class="h6">USD</small></h5>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <!-- Orders and status summary-->
                <div class="col-12 col-md-12 col-lg-6 ">
                    <div class="card adminuiux-card mb-3 mb-lg-4">
                        <div class="card-header">
                            <div class="row gx-3 align-items-center">
                                <div class="col-auto">
                                    <div class="avatar avatar-40 rounded bg-theme-1-subtle text-theme-1 theme-red">
                                        <i class="bi bi-box h5"></i>
                                    </div>
                                </div>
                                <div class="col">
                                    <h6 class="mb-0">Resumen de pedidos</h6>
                                    <p class="small text-secondary">Estado de pedidos y rechazos</p>
                                </div>
                            </div>
                        </div>
                        <div class="card-body">
                            <div class="row gx-3 mb-3">
                                <div class="col-6">
                                    <div class="row gx-3 align-items-center">
                                        <div class="col-auto">
                                            <div class="avatar avatar-50 rounded bg-theme-1-subtle text-theme-1 theme-cyan">
                                                <i class="bi bi-bag-check h5"></i>
                                            </div>
                                        </div>
                                        <div class="col">
                                            <p class="small text-secondary mb-0">Reservados</p>
                                            <h5>523</h5>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-6">
                                    <div class="row gx-3 align-items-center">
                                        <div class="col-auto">
                                            <div class="avatar avatar-50 rounded bg-theme-1-subtle text-theme-1 theme-yellow">
                                                <i class="bi bi-clipboard-check h5"></i>
                                            </div>
                                        </div>
                                        <div class="col">
                                            <p class="small text-secondary mb-0">Procesados</p>
                                            <h5>135</h5>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="row gx-3">
                                <div class="col-6">
                                    <div class="row gx-3 align-items-center">
                                        <div class="col-auto">
                                            <div class="avatar avatar-50 rounded bg-theme-1-subtle text-theme-1 theme-red">
                                                <i class="bi bi-geo-alt h5"></i>
                                            </div>
                                        </div>
                                        <div class="col">
                                            <p class="small text-secondary mb-0">Entregado</p>
                                            <h5>6521</h5>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-6">
                                    <div class="row gx-3 align-items-center">
                                        <div class="col-auto">
                                            <div class="avatar avatar-50 rounded bg-theme-1-subtle text-theme-1 theme-green">
                                                <i class="bi bi-cart-x h5"></i>
                                            </div>
                                        </div>
                                        <div class="col">
                                            <p class="small text-secondary mb-0">Rechazados/Cancelados</p>
                                            <h5>13</h5>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- sales chart -->
            <div class="card adminuiux-card mb-3 mb-lg-4">
                <div class="card-header">
                    <div class="row gx-3 align-items-center">
                        <div class="col-auto">
                            <i class="bi bi-boxes h5 avatar avatar-40 bg-theme-1-subtle text-theme-1 rounded"></i>
                        </div>
                        <div class="col">
                            <h6 class="mb-0">Ventas y ganancias</h6>
                            <p class="small text-secondary">Estadisticas de compras</p>
                        </div>

                        <!-- cost and profit  -->
                        <div class="col-auto align-self-center">
                            <div class="swiper swipernav">
                                <div class="swiper-wrapper">
                                    <div class="swiper-slide width-160">
                                        <div class="row gx-3 align-items-center">
                                            <div class="col-auto">
                                                <div class="avatar avatar-40 rounded bg-theme-1-subtle text-theme-1 theme-yellow">
                                                    <i class="bi bi-bar-chart"></i>
                                                </div>
                                            </div>
                                            <div class="col">
                                                <p class="text-secondary small mb-0">Ingresos</p>
                                                <h5 class="mb-0"><span class="increamentcount">50000</span> <small class="h6">USD</small></h5>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="swiper-slide width-160">
                                        <div class="row gx-3 align-items-center">
                                            <div class="col-auto">
                                                <div class="avatar avatar-40 rounded bg-theme-1-subtle text-theme-1 theme-red">
                                                    <i class="bi bi-coin"></i>
                                                </div>
                                            </div>
                                            <div class="col">
                                                <p class="text-secondary small mb-0">Costo</p>
                                                <h5 class="mb-0"><span class="increamentcount">35135</span> <small class="h6">USD</small></h5>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="swiper-slide width-160">
                                        <div class="row gx-3 align-items-center">
                                            <div class="col-auto">
                                                <div class="avatar avatar-40 rounded bg-theme-1-subtle text-theme-1 theme-green">
                                                    <i class="bi bi-arrow-up-right"></i>
                                                </div>
                                            </div>
                                            <div class="col">
                                                <p class="text-secondary small mb-0">Ganancia</p>
                                                <h5 class="mb-0"><span class="increamentcount">12500</span> <small class="h6">USD</small></h5>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div class="swiper-pagination"></div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="card-body px-0">
                    <app-inventory-banner-chart class="height-240 w-100 d-block"></app-inventory-banner-chart>
                </div>
            </div>

            <!-- sales summary -->
            <div class="row gx-3 gx-lg-4">
                <!-- in stock -->
                <div class="col-12 col-md-6 col-lg-3">
                    <div class="card adminuiux-card bg-l-gradient-light theme-blue mb-3 mb-lg-4">
                        <div class="card-header">
                            <div class="row gx-3 align-items-center">
                                <div class="col-auto">
                                    <div class="avatar avatar-40 rounded bg-theme-1-subtle text-theme-1">
                                        <i class="bi bi-boxes h5"></i>
                                    </div>
                                </div>
                                <div class="col">
                                    <h6 class="mb-0">En stock</h6>
                                    <p class="small text-secondary">Cant. de productos en stock</p>
                                </div>
                            </div>
                        </div>
                        <div class="card-body">
                            <div class="row gx-3 align-items-center">
                                <div class="col">
                                    <h4 class="fw-medium mb-0">750</h4>
                                    <p class="small">
                                        5 <span class="text-theme-1 theme-green"><i class="bi bi-arrow-up fs-10"></i>3.15%</span>
                                    </p>
                                </div>
                                <div class="col-auto">
                                    <app-circle-progress-blue class="avatar avatar-60 rounded-circle"></app-circle-progress-blue>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- manufacture  -->
                <div class="col-12 col-md-6 col-lg-3">
                    <div class="card adminuiux-card bg-l-gradient-light theme-green mb-3 mb-lg-4">
                        <div class="card-header">
                            <div class="row gx-3 align-items-center">
                                <div class="col-auto">
                                    <div class="avatar avatar-40 rounded bg-theme-1-subtle text-theme-1">
                                        <i class="bi bi-tag h5"></i>
                                    </div>
                                </div>
                                <div class="col">
                                    <h6 class="mb-0">Fabricacion</h6>
                                    <p class="small text-secondary">Productos en produccion</p>
                                </div>
                            </div>
                        </div>
                        <div class="card-body">
                            <div class="row gx-3 align-items-center">
                                <div class="col">
                                    <h4 class="fw-medium mb-0">320</h4>
                                    <p class="small">
                                        25 <span class="text-theme-1 theme-green"><i class="bi bi-arrow-up fs-10"></i>3.15%</span>
                                    </p>
                                </div>
                                <div class="col-auto">
                                    <app-circle-progress-green class="avatar avatar-60 rounded-circle"></app-circle-progress-green>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- wishlist  -->
                <div class="col-12 col-md-6 col-lg-3">
                    <div class="card adminuiux-card bg-l-gradient-light theme-yellow mb-3 mb-lg-4">
                        <div class="card-header">
                            <div class="row gx-3 align-items-center">
                                <div class="col-auto">
                                    <div class="avatar avatar-40 rounded bg-theme-1-subtle text-theme-1">
                                        <i class="bi bi-heart h5"></i>
                                    </div>
                                </div>
                                <div class="col">
                                    <h6 class="mb-0">Lista de deseos</h6>
                                    <p class="small text-secondary">Interes de los clientes</p>
                                </div>
                            </div>
                        </div>
                        <div class="card-body">
                            <div class="row gx-3 align-items-center">
                                <div class="col">
                                    <h4 class="mb-0">1524</h4>
                                    <p class="small">
                                        124 <span class="text-theme-1 theme-green"><i class="bi bi-arrow-up fs-10"></i>4.13%</span>
                                    </p>
                                </div>
                                <div class="col-auto">
                                    <app-circle-progress-yellow class="avatar avatar-60 rounded-circle"></app-circle-progress-yellow>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- referral  -->
                <div class="col-12 col-md-6 col-lg-3">
                    <div class="card adminuiux-card bg-l-gradient-light theme-red mb-3 mb-lg-4">
                        <div class="card-header">
                            <div class="row gx-3 align-items-center">
                                <div class="col-auto">
                                    <div class="avatar avatar-40 rounded bg-theme-1-subtle text-theme-1">
                                        <i class="bi bi-people h5"></i>
                                    </div>
                                </div>
                                <div class="col">
                                    <h6 class="mb-0">Ganancias por referidos</h6>
                                    <p class="small text-secondary">Rendimiento de referidos</p>
                                </div>
                            </div>
                        </div>
                        <div class="card-body">
                            <div class="row gx-3 align-items-center">
                                <div class="col">
                                    <h4 class="mb-0">25100 <small class="h6">USD</small></h4>
                                    <p class="small">
                                        530.00 <span class="text-theme-1 theme-green"><i class="bi bi-arrow-up fs-10"></i>4.15%</span>
                                    </p>
                                </div>
                                <div class="col-auto">
                                    <app-circle-progress-red class="avatar avatar-60 rounded-circle"></app-circle-progress-red>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- suppliers and categories demanded -->
            <div class="row gx-3 gx-lg-4">
                <!-- Sent money -->
                <div class="col-12 col-md-12 col-lg-6 col-xxl-3">
                    <div class="card adminuiux-card mb-3 mb-lg-4">
                        <div class="card-header">
                            <div class="row gx-3 align-items-center">
                                <div class="col-auto">
                                    <i class="bi bi-receipt h5 avatar avatar-40 bg-theme-1-subtle text-theme-1 theme-yellow rounded"></i>
                                </div>
                                <div class="col">
                                    <h6 class="mb-0">Pagar factura</h6>
                                    <p class="small text-secondary">Pagos a proveedores</p>
                                </div>
                            </div>
                        </div>
                        <div class="card-body">
                            <div class="input-group input-group-md rounded mb-2">
                                <span class="input-group-text text-theme-1"><i class="bi bi-person-lines-fill"></i></span>
                                <input class="form-control" type="search" placeholder="Buscar proveedor" />
                            </div>
                            <input class="form-control form-control-lg fs-2 fw-bold text-center mb-2" type="number" placeholder="0.00" />
                            <div class="row gx-3 align-items-center">
                                <div class="col-12 mb-2">
                                    <div class="input-group input-group-md rounded">
                                        <span class="input-group-text text-theme-1 px-2"><i class="bi bi-cash"></i></span>
                                        <select class="form-select">
                                            <option>Billetera</option>
                                            <option selected>Banco</option>
                                            <option>Cripto</option>
                                        </select>
                                    </div>
                                </div>
                                <div class="col-12">
                                    <div class="input-group input-group-md rounded">
                                        <span class="input-group-text text-theme-1 px-2"><i class="bi bi-bank"></i></span>
                                        <select class="form-control simplechosen">
                                            <option>CA Bank</option>
                                            <option>Larson Bank</option>
                                            <option>Truelance Bank</option>
                                            <option selected>Cabilian Bank</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                            <p class="text-secondary small text-center mb-3">Saldo: 966800.00 USD</p>
                            <button class="btn btn-outline-theme w-100">Pagar ahora</button>
                        </div>
                    </div>
                </div>

                <!-- Proveedor principals -->
                <div class="col-12 col-md-12 col-lg-6 col-xxl-3">
                    <div class="card adminuiux-card mb-3 mb-lg-4">
                        <div class="card-header">
                            <div class="row gx-3 align-items-center">
                                <div class="col-auto">
                                    <i class="bi bi-building h5 avatar avatar-40 bg-theme-1-subtle text-theme-1 theme-purple rounded"></i>
                                </div>
                                <div class="col">
                                    <h6 class="mb-0">Proveedor principal</h6>
                                    <p class="small text-secondary">Proveedores de stock</p>
                                </div>
                            </div>
                        </div>
                        <div class="card-body px-0 py-1">
                            <ul class="list-group border-0 bg-none">
                                <li class=" list-group-item">
                                    <div class="row gx-3 align-items-center">
                                        <div class="col-auto">
                                            <p class="mb-0">Larsons Ltd.</p>
                                            <p class="text-secondary small">1258 Unidades</p>
                                        </div>
                                        <div class="col ps-0 text-end">
                                            <h6 class=" mb-0">11,070.77 <small>USD</small></h6>
                                            <p class="small text-secondary">
                                                -20.17 <span class="text-theme-1 theme-red"><i class="bi bi-arrow-up fs-10"></i>-0.04%</span>
                                            </p>
                                        </div>
                                    </div>
                                </li>
                                <li class=" list-group-item">
                                    <div class="row gx-3 align-items-center">
                                        <div class="col-auto">
                                            <p class="mb-0">Devines Boxes</p>
                                            <p class="text-secondary small">1150 Unidades</p>
                                        </div>
                                        <div class="col ps-0 text-end">
                                            <h6 class=" mb-0">10,030.77 <small>USD</small></h6>
                                            <p class="small text-secondary">
                                                -20.17 <span class="text-theme-1 theme-red"><i class="bi bi-arrow-up fs-10"></i>-0.04%</span>
                                            </p>
                                        </div>
                                    </div>
                                </li>
                                <li class=" list-group-item">
                                    <div class="row gx-3 align-items-center">
                                        <div class="col-auto">
                                            <p class="mb-0">Firoscas</p>
                                            <p class="text-secondary small">1100 Unidades</p>
                                        </div>
                                        <div class="col ps-0 text-end">
                                            <h6 class=" mb-0">16,530.77 <small>USD</small></h6>
                                            <p class="small text-secondary">
                                                -20.17 <span class="text-theme-1 theme-red"><i class="bi bi-arrow-up fs-10"></i>-0.04%</span>
                                            </p>
                                        </div>
                                    </div>
                                </li>
                                <li class="list-group-item">
                                    <div class="row gx-3 align-items-center">
                                        <div class="col-auto">
                                            <p class="mb-0">Bonds</p>
                                            <p class="text-secondary small">900 Unidades</p>
                                        </div>
                                        <div class="col ps-0 text-end">
                                            <h6 class="mb-0">4048.24 <small>USD</small></h6>
                                            <p class="small text-secondary">
                                                1.20 <span class="text-theme-1 theme-green"><i class="bi bi-arrow-up fs-10"></i>0.04%</span>
                                            </p>
                                        </div>
                                    </div>
                                </li>
                                <li class="list-group-item">
                                    <div class="row gx-3 align-items-center">
                                        <div class="col-auto">
                                            <p class="mb-0">Jackson Pvt. Ltd.</p>
                                            <p class="text-secondary small">800 Unidades</p>
                                        </div>
                                        <div class="col ps-0 text-end">
                                            <h6 class="mb-0">3750.00 <small>USD</small></h6>
                                            <p class="small text-secondary">
                                                74.00<span class="text-theme-1 theme-red"><i class="bi bi-arrow-up fs-10"></i>-2.09%</span>
                                            </p>
                                        </div>
                                    </div>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>

                <!-- Top buyers -->
                <div class="col-12 col-md-12 col-lg-6 col-xxl-3">
                    <div class="card adminuiux-card mb-3 mb-lg-4">
                        <div class="card-header">
                            <div class="row gx-3 align-items-center">
                                <div class="col-auto">
                                    <i class="bi bi-people h5 avatar avatar-40 bg-theme-1-subtle text-theme-1 theme-pink rounded"></i>
                                </div>
                                <div class="col">
                                    <h6 class="mb-0">Compradores principales</h6>
                                    <p class="small text-secondary">Compradores de nuestros productos</p>
                                </div>
                            </div>
                        </div>
                        <div class="card-body px-0 py-1">
                            <ul class="list-group border-0 bg-none">
                                <li class=" list-group-item">
                                    <div class="row gx-3 align-items-center">
                                        <div class="col-auto">
                                            <figure class="avatar avatar-40 rounded-circle coverimg">
                                                <img src="assets/img/modern-ai-image/user-1.jpg" class="w-100" alt="" />
                                            </figure>
                                        </div>
                                        <div class="col-auto">
                                            <p class="mb-0">AdminUIUX</p>
                                            <p class="text-secondary small">250 Unidades</p>
                                        </div>
                                        <div class="col ps-0 text-end">
                                            <h6 class=" mb-0">1,070.77 <small>USD</small></h6>
                                        </div>
                                    </div>
                                </li>
                                <li class=" list-group-item">
                                    <div class="row gx-3 align-items-center">
                                        <div class="col-auto">
                                            <figure class="avatar avatar-40 rounded-circle coverimg">
                                                <img src="assets/img/modern-ai-image/user-2.jpg" class="w-100" alt="" />
                                            </figure>
                                        </div>
                                        <div class="col-auto">
                                            <p class="mb-0">Jenny D'Souza</p>
                                            <p class="text-secondary small">140 Unidades</p>
                                        </div>
                                        <div class="col ps-0 text-end">
                                            <h6 class=" mb-0">1,030.77 <small>USD</small></h6>
                                        </div>
                                    </div>
                                </li>
                                <li class=" list-group-item">
                                    <div class="row gx-3 align-items-center">
                                        <div class="col-auto">
                                            <figure class="avatar avatar-40 rounded-circle coverimg">
                                                <img src="assets/img/modern-ai-image/user-3.jpg" class="w-100" alt="" />
                                            </figure>
                                        </div>
                                        <div class="col-auto">
                                            <p class="mb-0">Almandra</p>
                                            <p class="text-secondary small">120 Unidades</p>
                                        </div>
                                        <div class="col ps-0 text-end">
                                            <h6 class=" mb-0">1,530.77 <small>USD</small></h6>
                                        </div>
                                    </div>
                                </li>
                                <li class="list-group-item">
                                    <div class="row gx-3 align-items-center">
                                        <div class="col-auto">
                                            <figure class="avatar avatar-40 rounded-circle coverimg">
                                                <img src="assets/img/modern-ai-image/user-4.jpg" class="w-100" alt="" />
                                            </figure>
                                        </div>
                                        <div class="col-auto">
                                            <p class="mb-0">Monty Alberto</p>
                                            <p class="text-secondary small">100 Unidades</p>
                                        </div>
                                        <div class="col ps-0 text-end">
                                            <h6 class="mb-0">848.24 <small>USD</small></h6>
                                        </div>
                                    </div>
                                </li>
                                <li class="list-group-item">
                                    <div class="row gx-3 align-items-center">
                                        <div class="col-auto">
                                            <figure class="avatar avatar-40 rounded-circle coverimg">
                                                <img src="assets/img/modern-ai-image/user-1.jpg" class="w-100" alt="" />
                                            </figure>
                                        </div>
                                        <div class="col-auto">
                                            <p class="mb-0">Jackson Pvt. Ltd.</p>
                                            <p class="text-secondary small">800 Unidades</p>
                                        </div>
                                        <div class="col ps-0 text-end">
                                            <h6 class="mb-0">3750.00 <small>USD</small></h6>
                                        </div>
                                    </div>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>

                <!-- Demanded Categories -->
                <div class="col-12 col-md-12 col-lg-6 col-xxl-3">
                    <div class="card adminuiux-card mb-3 mb-lg-4">
                        <div class="card-header">
                            <div class="row gx-3 align-items-center">
                                <div class="col-auto">
                                    <i class="bi bi-star h5 avatar avatar-40 bg-theme-1-subtle text-theme-1 theme-red rounded"></i>
                                </div>
                                <div class="col">
                                    <h6 class="mb-0">Categorias principales</h6>
                                    <p class="small text-secondary">Populares en ventas</p>
                                </div>
                            </div>
                        </div>
                        <div class="card-body">
                            <div class="mb-3 text-center">
                                <app-polararea-chartjs-180 class="avatar avatar-160 mx-auto"></app-polararea-chartjs-180>
                            </div>
                            <div class="row gx-3">
                                <div class="col-6 mb-4">
                                    <div class="row gx-3">
                                        <div class="col-auto">
                                            <div class="avatar avatar-40 rounded bg-theme-1-subtle text-theme-1 theme-yellow">
                                                <i class="bi bi-bicycle h4"></i>
                                            </div>
                                        </div>
                                        <div class="col">
                                            <h6 class="mb-0">40</h6>
                                            <p class="small text-secondary">Juegos infantiles</p>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-6 mb-4">
                                    <div class="row gx-3">
                                        <div class="col-auto">
                                            <div class="avatar avatar-40 rounded bg-theme-1-subtle text-theme-1 theme-green">
                                                <i class="bi bi-tools h5"></i>
                                            </div>
                                        </div>
                                        <div class="col">
                                            <h6 class="mb-0">10</h6>
                                            <p class="small text-secondary">Herramientas</p>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-6 mb-0">
                                    <div class="row gx-3">
                                        <div class="col-auto">
                                            <div class="avatar avatar-40 rounded bg-theme-1-subtle text-theme-1 theme-red">
                                                <i class="bi bi-pc-display-horizontal h5"></i>
                                            </div>
                                        </div>
                                        <div class="col">
                                            <h6 class="mb-0">15</h6>
                                            <p class="small text-secondary">Electronica</p>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-6 mb-0">
                                    <div class="row gx-3">
                                        <div class="col-auto">
                                            <div class="avatar avatar-40 rounded bg-theme-1-subtle text-theme-1 theme-blue">
                                                <i class="bi bi-house h5"></i>
                                            </div>
                                        </div>
                                        <div class="col">
                                            <h6 class="mb-0">25</h6>
                                            <p class="small text-secondary">Decoracion</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="row gx-3 gx-lg-4 mb-3 mb-lg-4">
                <div class="col text-center py-3">
                    <h4>Entiende <span class="text-gradient">dispositivos y comportamientos humanos</span> para cambiar el orden de widgets</h4>
                    <p class="text-secondary">La proximidad y las expectativas de los usuarios son la mejor combinacion para hacer todo mas productivo.</p>
                </div>
            </div>

            <div class="row gx-3 gx-lg-4">
                <!-- Orders -->
                <div class="col-12 col-md-12 position-relative">
                    <div class="card adminuiux-card mb-3 mb-lg-4">
                        <div class="card-header">
                            <div class="row gx-3">
                                <div class="col-auto">
                                    <i class="bi bi-shop h5 avatar avatar-40 bg-theme-1-subtle text-theme-1 rounded"></i>
                                </div>
                                <div class="col-auto align-self-center">
                                    <h6 class="mb-0">Pedidos</h6>
                                    <p class="text-secondary small">Todos los articulos de pedidos</p>
                                </div>
                                <div class="col-auto ms-auto">
                                    <div class="input-group ">
                                        <span class="input-group-text text-theme-1"><i class="bi bi-search"></i></span>
                                        <input type="text" class="form-control" placeholder="Buscar..." />
                                    </div>
                                </div>
                                <div class="col-auto">
                                    <div class="dropdown d-inline-block">
                                        <a class="btn btn-square btn-link no-caret dropdown-toggle" data-bs-toggle="dropdown" aria-expanded="false" data-bs-display="static" role="button">
                                            <i class="bi bi-three-dots-vertical"></i>
                                        </a>
                                        <ul class="dropdown-menu dropdown-menu-end">
                                            <li><a class="dropdown-item" href="javascript:void(0)">Editar</a></li>
                                            <li><a class="dropdown-item" href="javascript:void(0)">Mover</a></li>
                                            <li><a class="dropdown-item text-danger" href="javascript:void(0)">Eliminar</a></li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="card-body py-0">
                            <table class="table" id="dataTable">
                                <thead>
                                    <tr class="text-muted">
                                        <th class="w-12"></th>
                                        <th class="all">Producto</th>
                                        <th class="desktop">Categoria</th>
                                        <th class="tablet">Precio</th>
                                        <th class="desktop">Pedido por</th>
                                        <th class="desktop">Fecha</th>
                                        <th class="tablet desktop">Estado</th>
                                        <th class="none" data-title="Entregar a">Entregar a</th>
                                        <th class="none" data-title="Direccion">Direccion</th>
                                        <th class="none" data-title="Ubicacion">Ubicacion</th>
                                        <th class="tablet desktop">Pago</th>
                                        <th class="all">Accion</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td></td>
                                        <td>
                                            <div class="row gx-3 align-items-center">
                                                <div class="col-auto">
                                                    <figure class="avatar avatar-50 border mb-0 coverimg rounded">
                                                        <img src="assets/img/adminux/product-1.jpg" alt="" />
                                                    </figure>
                                                </div>
                                                <div class="col">
                                                    <p class="mb-0">Zapatos</p>
                                                    <p class="text-secondary small">1 articulo, SKUID: SH02521</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <p class="mb-0">Accesorios</p>
                                            <p class="text-secondary small">Zapatos de hombre</p>
                                        </td>
                                        <td>
                                            <p class="mb-0">123.00</p>
                                            <p class="text-secondary small">USD</p>
                                        </td>
                                        <td>
                                            <p class="mb-0">John Johnson</p>
                                            <p class="text-secondary small">john&#64;gmailtestid.com</p>
                                        </td>
                                        <td>
                                            <p class="mb-0">20-1-2022</p>
                                            <p class="text-secondary small">9:00 a. m.</p>
                                        </td>
                                        <td>
                                            <span class="badge badge-sm badge-light text-bg-theme-1 theme-green">Entregado</span>
                                        </td>
                                        <td>John Johnson</td>
                                        <td>2356, Calle-5, New York 4586, US</td>
                                        <td>
                                            <p class="mb-1">Lat: 5.678167, Long: 12.078613</p>
                                            <p class="text-secondary small">Esto tambien puede ser un mapa</p>
                                        </td>
                                        <td>
                                            <span class="badge badge-sm bg-green">Pagado</span>
                                        </td>
                                        <td>
                                            <div class="dropdown d-inline-block">
                                                <a class="text-secondary no-caret" data-bs-toggle="dropdown" aria-expanded="false" data-bs-display="static" role="button">
                                                    <i class="bi bi-three-dots"></i>
                                                </a>
                                                <ul class="dropdown-menu dropdown-menu-end">
                                                    <li><a class="dropdown-item" href="javascript:void(0)">Editar</a></li>
                                                    <li><a class="dropdown-item" href="javascript:void(0)">Mover</a></li>
                                                    <li><a class="dropdown-item text-danger" href="javascript:void(0)">Eliminar</a></li>
                                                </ul>
                                            </div>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td></td>
                                        <td>
                                            <div class="row gx-3 align-items-center">
                                                <div class="col-auto">
                                                    <figure class="avatar avatar-50 border mb-0 coverimg rounded">
                                                        <img src="assets/img/adminux/product-2.jpg" alt="" />
                                                    </figure>
                                                </div>
                                                <div class="col">
                                                    <p class="mb-0">Reloj Timex 0214</p>
                                                    <p class="text-secondary small">1 articulo, SKUID: SH02631</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <p class="mb-0">Accesorios</p>
                                            <p class="text-secondary small">Reloj</p>
                                        </td>
                                        <td>
                                            <p class="mb-0">154.00</p>
                                            <p class="text-secondary small">USD</p>
                                        </td>
                                        <td>
                                            <p class="mb-0">Mirae Jackson</p>
                                            <p class="text-secondary small">mirae&#64;gmailtestid.com</p>
                                        </td>
                                        <td>
                                            <p class="mb-0">20-1-2022</p>
                                            <p class="text-secondary small">10:05 a. m.</p>
                                        </td>
                                        <td>
                                            <span class="badge badge-sm badge-light text-bg-theme-1 theme-green">Entregado</span>
                                        </td>
                                        <td>Mirae Jackson</td>
                                        <td>2356, Calle-5, New York 4586, US</td>
                                        <td>
                                            <p class="mb-1">Lat: 5.678167, Long: 12.078613</p>
                                            <p class="text-secondary small">Esto tambien puede ser un mapa</p>
                                        </td>
                                        <td>
                                            <span class="badge badge-sm bg-green">Pagado</span>
                                        </td>
                                        <td>
                                            <div class="dropdown d-inline-block">
                                                <a class="text-secondary no-caret" data-bs-toggle="dropdown" aria-expanded="false" data-bs-display="static" role="button">
                                                    <i class="bi bi-three-dots"></i>
                                                </a>
                                                <ul class="dropdown-menu dropdown-menu-end">
                                                    <li><a class="dropdown-item" href="javascript:void(0)">Editar</a></li>
                                                    <li><a class="dropdown-item" href="javascript:void(0)">Mover</a></li>
                                                    <li><a class="dropdown-item text-danger" href="javascript:void(0)">Eliminar</a></li>
                                                </ul>
                                            </div>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td></td>
                                        <td>
                                            <div class="row gx-3 align-items-center">
                                                <div class="col-auto">
                                                    <figure class="avatar avatar-50 border mb-0 coverimg rounded">
                                                        <img src="assets/img/adminux/product-3.jpg" alt="" />
                                                    </figure>
                                                </div>
                                                <div class="col">
                                                    <p class="mb-0">FOGG</p>
                                                    <p class="text-secondary small">1 articulo, SKUID: SH03560</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <p class="mb-0">Extras</p>
                                            <p class="text-secondary small">Desodorante hombre</p>
                                        </td>
                                        <td>
                                            <p class="mb-0">100.00</p>
                                            <p class="text-secondary small">USD</p>
                                        </td>
                                        <td>
                                            <p class="mb-0">Millie Danial</p>
                                            <p class="text-secondary small">millie&#64;gmailtestid.com</p>
                                        </td>
                                        <td>
                                            <p class="mb-0">20-1-2022</p>
                                            <p class="text-secondary small">9:00 a. m.</p>
                                        </td>
                                        <td>
                                            <span class="badge badge-sm badge-light text-bg-theme-1 theme-green">Entregado</span>
                                        </td>
                                        <td>Mark Danial</td>
                                        <td>2356, Calle-5, New York 4586, US</td>
                                        <td>
                                            <p class="mb-1">Lat: 5.678167, Long: 12.078613</p>
                                            <p class="text-secondary small">Esto tambien puede ser un mapa</p>
                                        </td>
                                        <td>
                                            <span class="badge badge-sm bg-theme-1 theme-blue">En espera</span>
                                        </td>
                                        <td>
                                            <div class="dropdown d-inline-block">
                                                <a class="text-secondary no-caret" data-bs-toggle="dropdown" aria-expanded="false" data-bs-display="static" role="button">
                                                    <i class="bi bi-three-dots"></i>
                                                </a>
                                                <ul class="dropdown-menu dropdown-menu-end">
                                                    <li><a class="dropdown-item" href="javascript:void(0)">Editar</a></li>
                                                    <li><a class="dropdown-item" href="javascript:void(0)">Mover</a></li>
                                                    <li><a class="dropdown-item text-danger" href="javascript:void(0)">Eliminar</a></li>
                                                </ul>
                                            </div>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td></td>
                                        <td>
                                            <div class="row gx-3 align-items-center">
                                                <div class="col-auto">
                                                    <figure class="avatar avatar-50 border mb-0 coverimg rounded">
                                                        <img src="assets/img/adminux/product-4.jpg" alt="" />
                                                    </figure>
                                                </div>
                                                <div class="col">
                                                    <p class="mb-0">Calefactor Hewells</p>
                                                    <p class="text-secondary small">1 articulo, SKUID: RH03674</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <p class="mb-0">Electrodomesticos</p>
                                            <p class="text-secondary small">Calefactor</p>
                                        </td>
                                        <td>
                                            <p class="mb-0">658.00</p>
                                            <p class="text-secondary small">USD</p>
                                        </td>
                                        <td>
                                            <p class="mb-0">Nick Vedhaa</p>
                                            <p class="text-secondary small">vedhaa&#64;gmailtestid.com</p>
                                        </td>
                                        <td>
                                            <p class="mb-0">20-1-2022</p>
                                            <p class="text-secondary small">9:00 a. m.</p>
                                        </td>
                                        <td>
                                            <span class="badge badge-sm badge-light text-bg-theme-1 theme-green">Entregado</span>
                                        </td>
                                        <td>Micky Nick</td>
                                        <td>2356, Calle-5, New York 4586, US</td>
                                        <td>
                                            <p class="mb-1">Lat: 5.678167, Long: 12.078613</p>
                                            <p class="text-secondary small">Esto tambien puede ser un mapa</p>
                                        </td>
                                        <td>
                                            <span class="badge badge-sm bg-red">Cancelado</span>
                                        </td>
                                        <td>
                                            <div class="dropdown d-inline-block">
                                                <a class="text-secondary no-caret" data-bs-toggle="dropdown" aria-expanded="false" data-bs-display="static" role="button">
                                                    <i class="bi bi-three-dots"></i>
                                                </a>
                                                <ul class="dropdown-menu dropdown-menu-end">
                                                    <li><a class="dropdown-item" href="javascript:void(0)">Editar</a></li>
                                                    <li><a class="dropdown-item" href="javascript:void(0)">Mover</a></li>
                                                    <li><a class="dropdown-item text-danger" href="javascript:void(0)">Eliminar</a></li>
                                                </ul>
                                            </div>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td></td>
                                        <td>
                                            <div class="row gx-3 align-items-center">
                                                <div class="col-auto">
                                                    <figure class="avatar avatar-50 border mb-0 coverimg rounded">
                                                        <img src="assets/img/adminux/product-1.jpg" alt="" />
                                                    </figure>
                                                </div>
                                                <div class="col">
                                                    <p class="mb-0">Zapatos</p>
                                                    <p class="text-secondary small">1 articulo, SKUID: SH06581</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <p class="mb-0">Accesorios</p>
                                            <p class="text-secondary small">Zapatos de hombre</p>
                                        </td>
                                        <td>
                                            <p class="mb-0">685.00</p>
                                            <p class="text-secondary small">USD</p>
                                        </td>
                                        <td>
                                            <p class="mb-0">John Johnson</p>
                                            <p class="text-secondary small">john&#64;gmailtestid.com</p>
                                        </td>
                                        <td>
                                            <p class="mb-0">20-1-2022</p>
                                            <p class="text-secondary small">9:00 a. m.</p>
                                        </td>
                                        <td>
                                            <span class="badge badge-sm badge-light text-bg-theme-1 theme-green">Entregado</span>
                                        </td>
                                        <td>John Johnson</td>
                                        <td>2356, Calle-5, New York 4586, US</td>
                                        <td>
                                            <p class="mb-1">Lat: 5.678167, Long: 12.078613</p>
                                            <p class="text-secondary small">Esto tambien puede ser un mapa</p>
                                        </td>
                                        <td>
                                            <span class="badge badge-sm bg-yellow">Procesando</span>
                                        </td>
                                        <td>
                                            <div class="dropdown d-inline-block">
                                                <a class="text-secondary no-caret" data-bs-toggle="dropdown" aria-expanded="false" data-bs-display="static" role="button">
                                                    <i class="bi bi-three-dots"></i>
                                                </a>
                                                <ul class="dropdown-menu dropdown-menu-end">
                                                    <li><a class="dropdown-item" href="javascript:void(0)">Editar</a></li>
                                                    <li><a class="dropdown-item" href="javascript:void(0)">Mover</a></li>
                                                    <li><a class="dropdown-item text-danger" href="javascript:void(0)">Eliminar</a></li>
                                                </ul>
                                            </div>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td></td>
                                        <td>
                                            <div class="row gx-3 align-items-center">
                                                <div class="col-auto">
                                                    <figure class="avatar avatar-50 border mb-0 coverimg rounded">
                                                        <img src="assets/img/adminux/product-1.jpg" alt="" />
                                                    </figure>
                                                </div>
                                                <div class="col">
                                                    <p class="mb-0">Zapatos</p>
                                                    <p class="text-secondary small">1 articulo, SKUID: SH06581</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <p class="mb-0">Accesorios</p>
                                            <p class="text-secondary small">Zapatos de hombre</p>
                                        </td>
                                        <td>
                                            <p class="mb-0">685.00</p>
                                            <p class="text-secondary small">USD</p>
                                        </td>
                                        <td>
                                            <p class="mb-0">John Johnson</p>
                                            <p class="text-secondary small">john&#64;gmailtestid.com</p>
                                        </td>
                                        <td>
                                            <p class="mb-0">20-1-2022</p>
                                            <p class="text-secondary small">9:00 a. m.</p>
                                        </td>
                                        <td>
                                            <span class="badge badge-sm badge-light text-bg-theme-1 theme-green">Entregado</span>
                                        </td>
                                        <td>John Johnson</td>
                                        <td>2356, Calle-5, New York 4586, US</td>
                                        <td>
                                            <p class="mb-1">Lat: 5.678167, Long: 12.078613</p>
                                            <p class="text-secondary small">Esto tambien puede ser un mapa</p>
                                        </td>
                                        <td>
                                            <span class="badge badge-sm bg-yellow">Procesando</span>
                                        </td>
                                        <td>
                                            <div class="dropdown d-inline-block">
                                                <a class="text-secondary no-caret" data-bs-toggle="dropdown" aria-expanded="false" data-bs-display="static" role="button">
                                                    <i class="bi bi-three-dots"></i>
                                                </a>
                                                <ul class="dropdown-menu dropdown-menu-end">
                                                    <li><a class="dropdown-item" href="javascript:void(0)">Editar</a></li>
                                                    <li><a class="dropdown-item" href="javascript:void(0)">Mover</a></li>
                                                    <li><a class="dropdown-item text-danger" href="javascript:void(0)">Eliminar</a></li>
                                                </ul>
                                            </div>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td></td>
                                        <td>
                                            <div class="row gx-3 align-items-center">
                                                <div class="col-auto">
                                                    <figure class="avatar avatar-50 border mb-0 coverimg rounded">
                                                        <img src="assets/img/adminux/product-1.jpg" alt="" />
                                                    </figure>
                                                </div>
                                                <div class="col">
                                                    <p class="mb-0">Zapatos</p>
                                                    <p class="text-secondary small">1 articulo, SKUID: SH02521</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <p class="mb-0">Accesorios</p>
                                            <p class="text-secondary small">Zapatos de hombre</p>
                                        </td>
                                        <td>
                                            <p class="mb-0">123.00</p>
                                            <p class="text-secondary small">USD</p>
                                        </td>
                                        <td>
                                            <p class="mb-0">John Johnson</p>
                                            <p class="text-secondary small">john&#64;gmailtestid.com</p>
                                        </td>
                                        <td>
                                            <p class="mb-0">20-1-2022</p>
                                            <p class="text-secondary small">9:00 a. m.</p>
                                        </td>
                                        <td>
                                            <span class="badge badge-sm badge-light text-bg-theme-1 theme-green">Entregado</span>
                                        </td>
                                        <td>John Johnson</td>
                                        <td>2356, Calle-5, New York 4586, US</td>
                                        <td>
                                            <p class="mb-1">Lat: 5.678167, Long: 12.078613</p>
                                            <p class="text-secondary small">Esto tambien puede ser un mapa</p>
                                        </td>
                                        <td>
                                            <span class="badge badge-sm bg-green">Pagado</span>
                                        </td>
                                        <td>
                                            <div class="dropdown d-inline-block">
                                                <a class="text-secondary no-caret" data-bs-toggle="dropdown" aria-expanded="false" data-bs-display="static" role="button">
                                                    <i class="bi bi-three-dots"></i>
                                                </a>
                                                <ul class="dropdown-menu dropdown-menu-end">
                                                    <li><a class="dropdown-item" href="javascript:void(0)">Editar</a></li>
                                                    <li><a class="dropdown-item" href="javascript:void(0)">Mover</a></li>
                                                    <li><a class="dropdown-item text-danger" href="javascript:void(0)">Eliminar</a></li>
                                                </ul>
                                            </div>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td></td>
                                        <td>
                                            <div class="row gx-3 align-items-center">
                                                <div class="col-auto">
                                                    <figure class="avatar avatar-50 border mb-0 coverimg rounded">
                                                        <img src="assets/img/adminux/product-2.jpg" alt="" />
                                                    </figure>
                                                </div>
                                                <div class="col">
                                                    <p class="mb-0">Reloj Timex 0214</p>
                                                    <p class="text-secondary small">1 articulo, SKUID: SH02631</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <p class="mb-0">Accesorios</p>
                                            <p class="text-secondary small">Reloj</p>
                                        </td>
                                        <td>
                                            <p class="mb-0">154.00</p>
                                            <p class="text-secondary small">USD</p>
                                        </td>
                                        <td>
                                            <p class="mb-0">Mirae Jackson</p>
                                            <p class="text-secondary small">mirae&#64;gmailtestid.com</p>
                                        </td>
                                        <td>
                                            <p class="mb-0">20-1-2022</p>
                                            <p class="text-secondary small">10:05 a. m.</p>
                                        </td>
                                        <td>
                                            <span class="badge badge-sm badge-light text-bg-theme-1 theme-green">Entregado</span>
                                        </td>
                                        <td>Mirae Jackson</td>
                                        <td>2356, Calle-5, New York 4586, US</td>
                                        <td>
                                            <p class="mb-1">Lat: 5.678167, Long: 12.078613</p>
                                            <p class="text-secondary small">Esto tambien puede ser un mapa</p>
                                        </td>
                                        <td>
                                            <span class="badge badge-sm bg-green">Pagado</span>
                                        </td>
                                        <td>
                                            <div class="dropdown d-inline-block">
                                                <a class="text-secondary no-caret" data-bs-toggle="dropdown" aria-expanded="false" data-bs-display="static" role="button">
                                                    <i class="bi bi-three-dots"></i>
                                                </a>
                                                <ul class="dropdown-menu dropdown-menu-end">
                                                    <li><a class="dropdown-item" href="javascript:void(0)">Editar</a></li>
                                                    <li><a class="dropdown-item" href="javascript:void(0)">Mover</a></li>
                                                    <li><a class="dropdown-item text-danger" href="javascript:void(0)">Eliminar</a></li>
                                                </ul>
                                            </div>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td></td>
                                        <td>
                                            <div class="row gx-3 align-items-center">
                                                <div class="col-auto">
                                                    <figure class="avatar avatar-50 border mb-0 coverimg rounded">
                                                        <img src="assets/img/adminux/product-3.jpg" alt="" />
                                                    </figure>
                                                </div>
                                                <div class="col">
                                                    <p class="mb-0">FOGG</p>
                                                    <p class="text-secondary small">1 articulo, SKUID: SH03560</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <p class="mb-0">Extras</p>
                                            <p class="text-secondary small">Desodorante hombre</p>
                                        </td>
                                        <td>
                                            <p class="mb-0">100.00</p>
                                            <p class="text-secondary small">USD</p>
                                        </td>
                                        <td>
                                            <p class="mb-0">Millie Danial</p>
                                            <p class="text-secondary small">millie&#64;gmailtestid.com</p>
                                        </td>
                                        <td>
                                            <p class="mb-0">20-1-2022</p>
                                            <p class="text-secondary small">9:00 a. m.</p>
                                        </td>
                                        <td>
                                            <span class="badge badge-sm badge-light text-bg-theme-1 theme-green">Entregado</span>
                                        </td>
                                        <td>Mark Danial</td>
                                        <td>2356, Calle-5, New York 4586, US</td>
                                        <td>
                                            <p class="mb-1">Lat: 5.678167, Long: 12.078613</p>
                                            <p class="text-secondary small">Esto tambien puede ser un mapa</p>
                                        </td>
                                        <td>
                                            <span class="badge badge-sm bg-theme-1 theme-blue">En espera</span>
                                        </td>
                                        <td>
                                            <div class="dropdown d-inline-block">
                                                <a class="text-secondary no-caret" data-bs-toggle="dropdown" aria-expanded="false" data-bs-display="static" role="button">
                                                    <i class="bi bi-three-dots"></i>
                                                </a>
                                                <ul class="dropdown-menu dropdown-menu-end">
                                                    <li><a class="dropdown-item" href="javascript:void(0)">Editar</a></li>
                                                    <li><a class="dropdown-item" href="javascript:void(0)">Mover</a></li>
                                                    <li><a class="dropdown-item text-danger" href="javascript:void(0)">Eliminar</a></li>
                                                </ul>
                                            </div>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td></td>
                                        <td>
                                            <div class="row gx-3 align-items-center">
                                                <div class="col-auto">
                                                    <figure class="avatar avatar-50 border mb-0 coverimg rounded">
                                                        <img src="assets/img/adminux/product-4.jpg" alt="" />
                                                    </figure>
                                                </div>
                                                <div class="col">
                                                    <p class="mb-0">Calefactor Hewells</p>
                                                    <p class="text-secondary small">1 articulo, SKUID: RH03674</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <p class="mb-0">Electrodomesticos</p>
                                            <p class="text-secondary small">Calefactor</p>
                                        </td>
                                        <td>
                                            <p class="mb-0">658.00</p>
                                            <p class="text-secondary small">USD</p>
                                        </td>
                                        <td>
                                            <p class="mb-0">Nick Vedhaa</p>
                                            <p class="text-secondary small">vedhaa&#64;gmailtestid.com</p>
                                        </td>
                                        <td>
                                            <p class="mb-0">20-1-2022</p>
                                            <p class="text-secondary small">9:00 a. m.</p>
                                        </td>
                                        <td>
                                            <span class="badge badge-sm badge-light text-bg-theme-1 theme-green">Entregado</span>
                                        </td>
                                        <td>Micky Nick</td>
                                        <td>2356, Calle-5, New York 4586, US</td>
                                        <td>
                                            <p class="mb-1">Lat: 5.678167, Long: 12.078613</p>
                                            <p class="text-secondary small">Esto tambien puede ser un mapa</p>
                                        </td>
                                        <td>
                                            <span class="badge badge-sm bg-red">Cancelado</span>
                                        </td>
                                        <td>
                                            <div class="dropdown d-inline-block">
                                                <a class="text-secondary no-caret" data-bs-toggle="dropdown" aria-expanded="false" data-bs-display="static" role="button">
                                                    <i class="bi bi-three-dots"></i>
                                                </a>
                                                <ul class="dropdown-menu dropdown-menu-end">
                                                    <li><a class="dropdown-item" href="javascript:void(0)">Editar</a></li>
                                                    <li><a class="dropdown-item" href="javascript:void(0)">Mover</a></li>
                                                    <li><a class="dropdown-item text-danger" href="javascript:void(0)">Eliminar</a></li>
                                                </ul>
                                            </div>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            <!-- summary  -->
            <div class="row gx-3 gx-lg-4">
                <div class="col-12 col-md-6 col-lg-6 col-xxl-3">
                    <div class="card adminuiux-card mb-3 mb-lg-4">
                        <div class="card-body">
                            <div class="row gx-3 align-items-center">
                                <div class="col-auto">
                                    <div class="avatar avatar-60 rounded-circle">
                                        <app-circle-progress-blue-blank class="avatar avatar-60 rounded-circle"></app-circle-progress-blue-blank>
                                        <div class="avatar avatar-40 h5 bg-theme-1-subtle text-theme-1 theme-blue position-absolute start-50 top-50 translate-middle rounded-circle">
                                            <i class="bi bi-receipt"></i>
                                        </div>
                                    </div>
                                </div>
                                <div class="col">
                                    <p class="text-secondary small mb-1">Facturas totales</p>
                                    <h5 class="fw-medium">25486.00 <small>USD</small></h5>
                                </div>
                                <div class="col-auto">
                                    <div class="dropdown d-inline-block">
                                        <a class="text-secondary no-caret" data-bs-toggle="dropdown" aria-expanded="false" data-bs-display="static" role="button">
                                            <i class="bi bi-three-dots-vertical"></i>
                                        </a>
                                        <ul class="dropdown-menu dropdown-menu-end">
                                            <li><a class="dropdown-item" href="javascript:void(0)">Editar</a></li>
                                            <li><a class="dropdown-item" href="javascript:void(0)">Mover</a></li>
                                            <li><a class="dropdown-item text-danger" href="javascript:void(0)">Eliminar</a></li>
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
                                        <app-circle-progress-yellow-blank class="avatar avatar-60 rounded-circle"></app-circle-progress-yellow-blank>
                                        <div class="avatar avatar-40 h5 bg-theme-1-subtle text-theme-1 theme-yellow position-absolute start-50 top-50 translate-middle rounded-circle">
                                            <i class="bi bi-credit-card"></i>
                                        </div>
                                    </div>
                                </div>
                                <div class="col">
                                    <p class="text-secondary small mb-1">Facturas pagadas</p>
                                    <h5 class="fw-medium">12550<small>USD</small></h5>
                                </div>
                                <div class="col-auto">
                                    <div class="dropdown d-inline-block">
                                        <a class="text-secondary no-caret" data-bs-toggle="dropdown" aria-expanded="false" data-bs-display="static" role="button">
                                            <i class="bi bi-three-dots-vertical"></i>
                                        </a>
                                        <ul class="dropdown-menu dropdown-menu-end">
                                            <li><a class="dropdown-item" href="javascript:void(0)">Editar</a></li>
                                            <li><a class="dropdown-item" href="javascript:void(0)">Mover</a></li>
                                            <li><a class="dropdown-item text-danger" href="javascript:void(0)">Eliminar</a></li>
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
                                        <app-circle-progress-red-blank class="avatar avatar-60 rounded-circle"></app-circle-progress-red-blank>
                                        <div class="avatar avatar-40 h5 bg-theme-1-subtle text-theme-1 theme-red position-absolute start-50 top-50 translate-middle rounded-circle">
                                            <i class="bi bi-receipt-cutoff"></i>
                                        </div>
                                    </div>
                                </div>
                                <div class="col">
                                    <p class="text-secondary small mb-1">Facturas pendientes</p>
                                    <h5 class="fw-medium">1525<small>k</small></h5>
                                </div>
                                <div class="col-auto avatar-group">
                                    <figure class="avatar avatar-40 rounded-circle coverimg" data-bs-toggle="tooltip" data-bs-placement="top" title="Solo demo">
                                        <img src="assets/img/modern-ai-image/company6.png" alt="" />
                                    </figure>
                                    <figure class="avatar avatar-40 rounded-circle coverimg" data-bs-toggle="tooltip" data-bs-placement="top" title="Solo vista previa">
                                        <img src="assets/img/modern-ai-image/company7.jpg" alt="" />
                                    </figure>
                                    <figure class="avatar avatar-40 rounded-circle coverimg" data-bs-toggle="tooltip" data-bs-placement="top" title="para verse real">
                                        <img src="assets/img/modern-ai-image/company8.jpg" alt="" />
                                    </figure>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-12 col-md-6 col-lg-6 col-xxl-3">
                    <div class="card adminuiux-card mb-3 mb-lg-4 bg-theme-1">
                        <div class="card-body">
                            <div class="row gx-3 align-items-center">
                                <div class="col-auto">
                                    <div class="avatar avatar-60 rounded-circle">
                                        <app-circle-progress-white-blank class="avatar avatar-60 rounded-circle"></app-circle-progress-white-blank>
                                        <div class="avatar avatar-40 h5 bg-white-opacity text-white position-absolute start-50 top-50 translate-middle rounded-circle">
                                            <i class="bi bi-envelope-check"></i>
                                        </div>
                                    </div>
                                </div>
                                <div class="col">
                                    <p class="opacity-75 small mb-1">En pedidos</p>
                                    <h5 class="fw-medium">130 <small>Units</small></h5>
                                </div>
                                <div class="col-auto avatar-group">
                                    <figure class="avatar avatar-40 rounded-circle coverimg" data-bs-toggle="tooltip" data-bs-placement="top" title="Shelvey Doe">
                                        <img src="assets/img/modern-ai-image/user-2.jpg" alt="" class="w-100" />
                                    </figure>
                                    <figure class="avatar avatar-40 rounded-circle coverimg" data-bs-toggle="tooltip" data-bs-placement="top" title="Maria Smith">
                                        <img src="assets/img/modern-ai-image/user-3.jpg" alt="" class="w-100" />
                                    </figure>
                                    <figure class="avatar avatar-40 rounded-circle coverimg" data-bs-toggle="tooltip" data-bs-placement="top" title="Steve Branden">
                                        <img src="assets/img/modern-ai-image/user-4.jpg" alt="" class="w-100" />
                                    </figure>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Offers assets average-->
            <div class="row gx-3 gx-lg-4">
                <!-- offer -->
                <div class="col-12 col-md-6 col-lg-6 col-xxl-3 order-2 order-xxl-1">
                    <div class="card adminuiux-card overflow-hidden mb-3 mb-lg-4">
                        <div class="row mx-0">
                            <div class="col-6 theme-green bg-theme-1 text-center py-4 z-index-1">
                                <div class="position-relative">
                                    <h3 class="mb-0">6.15%</h3>
                                    <p class="mb-2">Tasa de interes</p>
                                    <p class="opacity-75 small">Los prestamos empresariales tienen una tasa mas baja</p>
                                </div>
                            </div>
                            <div class="col-6 position-relative">
                                <figure class="coverimg position-absolute w-100 h-100 start-0 top-0 m-0">
                                    <img src="assets/img/modern-ai-image/pet-3.jpg" class="mw-100" alt="" />
                                </figure>
                            </div>
                        </div>
                    </div>
                    <div class="card adminuiux-card overflow-hidden mb-3 mb-lg-4">
                        <div class="row mx-0">
                            <div class="col-6 pe-0 bg-theme-1 text-white half-circle-vertical text-center py-4 z-index-1">
                                <div class="position-relative">
                                    <h2 class="mb-0">15<small>%</small></h2>
                                    <p class="mb-2">Descuento</p>
                                    <p class="opacity-75 small">Compra mas, recibe mas</p>
                                </div>
                            </div>
                            <div class="col-6 position-relative">
                                <figure class="coverimg position-absolute w-100 h-100 start-0 top-0 m-0">
                                    <img src="assets/img/modern-ai-image/user5-kid.jpg" class="mw-100" alt="" />
                                </figure>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Top countries earning -->
                <div class="col-12 col-md-12 col-lg-12 col-xxl-6 order-1 order-xxl-2 mb-4">
                    <div class="card adminuiux-card mb-3 mb-lg-4">
                        <div class="card-header">
                            <div class="row gx-3 align-items-center">
                                <div class="col-auto">
                                    <i class="bi bi-cart h5 avatar avatar-40 bg-theme-1-subtle text-theme-1 rounded"></i>
                                </div>
                                <div class="col">
                                    <h6 class="mb-0">Rendimiento global por pais</h6>
                                    <p class="small text-secondary">Ultimos meses</p>
                                </div>
                            </div>
                        </div>
                        <div class="card-body">
                            <div class="row gx-3 align-items-center">
                                <div class="col-12 col-md-6">
                                    <div id="jsvectormap" class="w-100 height-200"></div>
                                </div>
                                <div class="col-12 col-md-6">
                                    <div class="row gx-3 mb-3">
                                        <div class="col-auto">
                                            <div class="rounded bg-theme-1 p-3">
                                                <p class="opacity-75 small mb-1">Ingreso<br />objetivo</p>
                                                <h5>$2542</h5>
                                            </div>
                                        </div>
                                        <div class="col align-self-center">
                                            <div class="row gx-3 mb-3">
                                                <div class="col">
                                                    <p class="text-secondary small mb-0">Estados Unidos</p>
                                                    <p>New York</p>
                                                </div>
                                                <div class="col-auto text-end">
                                                    <p class="text-secondary small mb-0">Ventas nuevas</p>
                                                    <p>120 pedidos</p>
                                                </div>
                                            </div>
                                            <div>
                                                <div class="progress height-10 mb-1 bg-theme-1-subtle text-theme-1">
                                                    <div class="progress-bar bg-theme-1 w-50" role="progressbar" aria-valuenow="45" aria-valuemin="0" aria-valuemax="100"></div>
                                                </div>
                                            </div>
                                            <p class="small text-secondary">Pedidos objetivo<span class="float-end">260</span></p>
                                        </div>
                                    </div>
                                    <div class="row gx-3">
                                        <div class="col-auto">
                                            <div class="rounded bg-purple text-white p-3">
                                                <p class="opacity-75 small mb-1">Ingreso<br />objetivo</p>
                                                <h5>$2542</h5>
                                            </div>
                                        </div>
                                        <div class="col align-self-center">
                                            <div class="row gx-3 mb-3">
                                                <div class="col">
                                                    <p class="text-secondary small mb-0">Estados Unidos</p>
                                                    <p>New York</p>
                                                </div>
                                                <div class="col-auto text-end">
                                                    <p class="text-secondary small mb-0">Ventas nuevas</p>
                                                    <p>120 pedidos</p>
                                                </div>
                                            </div>
                                            <div>
                                                <div class="progress height-10 mb-1 bg-theme-1-subtle text-theme-1 theme-purple">
                                                    <div class="progress-bar bg-theme-1 w-50" role="progressbar" aria-valuenow="45" aria-valuemin="0" aria-valuemax="100"></div>
                                                </div>
                                            </div>
                                            <p class="small text-secondary">Pedidos objetivo<span class="float-end">260</span></p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Gastos promedio -->
                <div class="col-12 col-md-6 col-lg-6 col-xxl-3 order-3  mb-4">
                    <div class="card adminuiux-card mb-3 mb-lg-4">
                        <div class="card-header">
                            <div class="row gx-3 align-items-center">
                                <div class="col-auto">
                                    <i class="bi bi-cart h5 avatar avatar-40 bg-theme-1-subtle text-theme-1 rounded"></i>
                                </div>
                                <div class="col">
                                    <h6 class="mb-0">Gastos promedio</h6>
                                    <p class="small text-secondary">Ultimos 3 meses</p>
                                </div>
                            </div>
                        </div>
                        <div class="card-body text-center">
                            <div class="height-140 w-100 position-relative mb-2">
                                <div class="position-absolute bottom-0 mx-auto start-50 translate-middle">
                                    <p class="text-secondary small mb-0">Gasto total</p>
                                    <h5>5.4k <small>USD</small></h5>
                                </div>
                                <app-semi-doughnut-chartjs-180 class="height-140 w-100 position-relative mb-2" id="semidoughnutchart"></app-semi-doughnut-chartjs-180>
                            </div>
                            <p class="text-secondary">Has gastado mas en materias primas y debes revisar la cancelacion de pedidos</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `,
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class InventoryDashboardComponent {
    @ViewChild("choices") mySelect!: ElementRef;

    ngAfterViewInit() {
        const choices = new Choices(this.mySelect.nativeElement, {
            searchEnabled: true,
            removeItemButton: true,
            classNames: {
                containerOuter: ["choices", "maxwidth-dynamic"],
            } as ClassNames,
            placeholderValue: "Escribe...",
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
            language: {
                emptyTable: "No hay datos disponibles en la tabla",
                info: "Mostrando _START_ a _END_ de _TOTAL_ registros",
                infoEmpty: "Mostrando 0 a 0 de 0 registros",
                infoFiltered: "(filtrado de _MAX_ registros totales)",
                zeroRecords: "No se encontraron registros",
                paginate: {
                    first: "Primero",
                    last: "Ultimo",
                    next: "Siguiente",
                    previous: "Anterior",
                },
            },
        });

        //js vectormap
        const map = new jsVectorMap({
            selector: "#jsvectormap",
            regionStyle: {
                initial: {
                    fill: "rgba(0, 73, 232, 0.15)",
                    stroke: "rgba(0, 73, 232, 0.4)",
                    strokeWidth: 1,
                },
            },
            visualizeData: {
                scale: ["#f3faff", "#0049e8"],
                values: {
                    AF: 16.63,
                    AL: 11.58,
                    DZ: 158.97,
                    AO: 85.81,
                    AG: 1.1,
                    AR: 351.02,
                    AM: 8.83,
                    AU: 1219.72,
                    AT: 366.26,
                    AZ: 52.17,
                    BS: 7.54,
                    BH: 21.73,
                    BD: 105.4,
                    BB: 3.96,
                    BY: 52.89,
                    BE: 461.33,
                    BZ: 1.43,
                    BJ: 6.49,
                    BT: 1.4,
                    BO: 19.18,
                    BA: 16.2,
                    BW: 12.5,
                    BR: 2023.53,
                    BN: 11.96,
                    BG: 44.84,
                    BF: 8.67,
                    BI: 1.47,
                    KH: 11.36,
                    CM: 21.88,
                    CA: 1563.66,
                    CV: 1.57,
                    CF: 2.11,
                    TD: 7.59,
                    CL: 199.18,
                    CN: 5745.13,
                    CO: 283.11,
                    KM: 0.56,
                    CD: 12.6,
                    CG: 11.88,
                    CR: 35.02,
                    CI: 22.38,
                    HR: 59.92,
                    CY: 22.75,
                    CZ: 195.23,
                    DK: 304.56,
                    DJ: 1.14,
                    DM: 0.38,
                    DO: 50.87,
                    EC: 61.49,
                    EG: 216.83,
                    SV: 21.8,
                    GQ: 14.55,
                    ER: 2.25,
                    EE: 19.22,
                    ET: 30.94,
                    FJ: 3.15,
                    FI: 231.98,
                    FR: 2555.44,
                    GA: 12.56,
                    GM: 1.04,
                    GE: 11.23,
                    DE: 3305.9,
                    GH: 18.06,
                    GR: 305.01,
                    GD: 0.65,
                    GT: 40.77,
                    GN: 4.34,
                    GW: 0.83,
                    GY: 2.2,
                    HT: 6.5,
                    HN: 15.34,
                    HK: 226.49,
                    HU: 132.28,
                    IS: 12.77,
                    IN: 1430.02,
                    ID: 695.06,
                    IR: 337.9,
                    IQ: 84.14,
                    IE: 204.14,
                    IL: 201.25,
                    IT: 2036.69,
                    JM: 13.74,
                    JP: 5390.9,
                    JO: 27.13,
                    KZ: 129.76,
                    KE: 32.42,
                    KI: 0.15,
                    KR: 986.26,
                    KW: 117.32,
                    KG: 4.44,
                    LA: 6.34,
                    LV: 23.39,
                    LB: 39.15,
                    LS: 1.8,
                    LR: 0.98,
                    LY: 77.91,
                    LT: 35.73,
                    LU: 52.43,
                    MK: 9.58,
                    MG: 8.33,
                    MW: 5.04,
                    MY: 218.95,
                    MV: 1.43,
                    ML: 9.08,
                    MT: 7.8,
                    MR: 3.49,
                    MU: 9.43,
                    MX: 1004.04,
                    MD: 5.36,
                    MN: 5.81,
                    ME: 3.88,
                    MA: 91.7,
                    MZ: 10.21,
                    MM: 35.65,
                    NA: 11.45,
                    NP: 15.11,
                    NL: 770.31,
                    NZ: 138,
                    NI: 6.38,
                    NE: 5.6,
                    NG: 206.66,
                    NO: 413.51,
                    OM: 53.78,
                    PK: 174.79,
                    PA: 27.2,
                    PG: 8.81,
                    PY: 17.17,
                    PE: 153.55,
                    PH: 189.06,
                    PL: 438.88,
                    PT: 223.7,
                    QA: 126.52,
                    RO: 158.39,
                    RU: 1476.91,
                    RW: 5.69,
                    WS: 0.55,
                    ST: 0.19,
                    SA: 434.44,
                    SN: 12.66,
                    RS: 38.92,
                    SC: 0.92,
                    SL: 1.9,
                    SG: 217.38,
                    SK: 86.26,
                    SI: 46.44,
                    SB: 0.67,
                    ZA: 354.41,
                    ES: 1374.78,
                    LK: 48.24,
                    KN: 0.56,
                    LC: 1,
                    VC: 0.58,
                    SD: 65.93,
                    SR: 3.3,
                    SZ: 3.17,
                    SE: 444.59,
                    CH: 422.44,
                    SY: 59.63,
                    TW: 426.98,
                    TJ: 5.58,
                    TZ: 22.43,
                    TH: 312.61,
                    TL: 0.62,
                    TG: 3.07,
                    TO: 0.3,
                    TT: 21.2,
                    TN: 43.86,
                    TR: 729.05,
                    TM: 0,
                    UG: 17.12,
                    UA: 136.56,
                    AE: 239.65,
                    GB: 2258.57,
                    US: 1462.18,
                    UY: 40.71,
                    UZ: 37.72,
                    VU: 0.72,
                    VE: 285.21,
                    VN: 101.99,
                    YE: 30.02,
                    ZM: 15.69,
                    ZW: 5.57,
                },
            },
            map: "world",
        });
    }
}
