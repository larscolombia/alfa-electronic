import { Component, OnInit, AfterViewInit, AfterContentChecked, OnDestroy, ViewChild, ElementRef, CUSTOM_ELEMENTS_SCHEMA } from "@angular/core";
import { RouterLink } from "@angular/router";
import Choices, { ClassNames } from "choices.js";
import Swiper from "swiper";
import { register } from "swiper/element/bundle";
register();
import DataTable from "datatables.net-dt";
import "datatables.net-responsive-dt";

import { DaterangePickerRangesComponent } from "../../../components/input-fields/daterange-picker/daterange-picker-ranges.component";
import { BankBannerChartComponent } from "../../../components/charts/bank-banner-chart.component";
import { CircleProgressBlueComponent } from "../../../components/charts/circle-progress-blue.component";
import { CircleProgressGreenComponent } from "../../../components/charts/circle-progress-green.component";
import { CircleProgressRedComponent } from "../../../components/charts/circle-progress-red.component";
import { CircleProgressYellowComponent } from "../../../components/charts/circle-progress-yellow.component";
import { DoughnutChartjs180Component } from "../../../components/charts/doughnut-chartjs-180.component";
import { BarBlueChartjs100Component } from "../../../components/charts/bar-blue-chartjs-100.component";
import { ArearedChartjs60Component } from "../../../components/charts/area-red-chartjs-60.component";
import { AreaYellowChartjs60Component } from "../../../components/charts/area-yellow-chartjs-60.component";
import { AreaGreenChartjs60Component } from "../../../components/charts/area-green-chartjs-60.component";
import { SemiDoughnutChartjs180Component } from "../../../components/charts/semi-doughnut-chartjs-180.component";
import { CircleProgressRedBlankComponent } from "../../../components/charts/circle-progress-red-blank.component";
import { CircleProgressYellowBlankComponent } from "../../../components/charts/circle-progress-yellow-blank.component";
import { CircleProgressBlueBlankComponent } from "../../../components/charts/circle-progress-blue-blank.component";
import { CircleProgressWhiteBlankComponent } from "../../../components/charts/circle-progress-white-blank.component";

@Component({
    selector: "app-finance-bank",
    standalone: true,
    imports: [
        RouterLink,
        DaterangePickerRangesComponent,
        BankBannerChartComponent,
        CircleProgressBlueComponent,
        CircleProgressGreenComponent,
        CircleProgressRedComponent,
        CircleProgressRedBlankComponent,
        CircleProgressYellowBlankComponent,
        CircleProgressBlueBlankComponent,
        CircleProgressYellowComponent,
        CircleProgressWhiteBlankComponent,
        DoughnutChartjs180Component,
        BarBlueChartjs100Component,
        ArearedChartjs60Component,
        AreaYellowChartjs60Component,
        AreaGreenChartjs60Component,
        SemiDoughnutChartjs180Component,
    ],
    template: `
        <!-- page title -->
        <div class="container-fluid py-3">
            <div class="row gx-3 gx-lg-4 align-items-center page-title">
                <div class="col col-sm mb-3 mb-sm-0 order-1">
                    <h5 class="mb-0">Banking Dashboard</h5>
                    <p class="text-secondary small">Take care of Transactions and Investments</p>
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
            <nav aria-label="breadcrumb" class="breadcrumb-theme mt-3 rounded">
                <ol class="breadcrumb mb-0">
                    <li class="breadcrumb-item bi">
                        <a routerLink="/app/dashboard"><i class="bi bi-house-door me-2"></i> AdminUX</a>
                    </li>
                    <li class="breadcrumb-item bi"><a routerLink="/app/finance-dashboard">Finance</a></li>
                    <li class="breadcrumb-item bi active" aria-current="page">Bank</li>
                </ol>
            </nav>
        </div>

        <!-- content -->
        <div class="container mt-3" id="main-content">
            <div class="row gx-3 gx-lg-4 align-items-center">
                <!-- welcome message -->
                <div class="col-12 col-md py-3 py-lg-5">
                    <h5 class="mb-2 fw-normal text-secondary">Current Balance,</h5>
                    <h1 class="mb-0 text-gradient">256240.03 <small>USD</small></h1>
                    <h5>
                        46124.28 <small class="text-success">18.0% <i class="bi bi-arrow-up"></i></small>
                    </h5>
                </div>

                <!--current holding -->
                <div class="col-auto ms-auto align-self-center">
                    <swiper-container slides-per-view="auto" space-between="16" autoplay="true" class="swiper swipernav py-4">
                        <swiper-slide class="p-1 width-220">
                            <div class="row gx-3 gx-lg-4 align-items-center">
                                <div class="col-auto">
                                    <div class="avatar avatar-60 rounded bg-theme-1-subtle text-theme-1 theme-green">
                                        <i class="bi bi-arrow-down-left h4"></i>
                                    </div>
                                </div>
                                <div class="col">
                                    <p class="text-secondary small mb-0">Income</p>
                                    <h4 class="mb-0"><span>52000</span> <small class="h6">USD</small></h4>
                                    <p class="small">
                                        36.00 <span class="text-theme-1 theme-green"><i class="bi bi-arrow-up fs-12"></i>3.15%</span>
                                    </p>
                                </div>
                            </div>
                        </swiper-slide>
                        <swiper-slide class="p-1 width-220">
                            <div class="row gx-3 gx-lg-4 align-items-center">
                                <div class="col-auto">
                                    <div class="avatar avatar-60 rounded bg-theme-1-subtle text-theme-1 theme-red">
                                        <i class="bi bi-arrow-up-right h4"></i>
                                    </div>
                                </div>
                                <div class="col">
                                    <p class="text-secondary small mb-0">Expense</p>
                                    <h4 class="mb-0"><span>35135</span> <small class="h6">USD</small></h4>
                                    <p class="small">
                                        15.00 <span class="text-theme-1 theme-red"><i class="bi bi-arrow-up fs-12"></i>-4.50%</span>
                                    </p>
                                </div>
                            </div>
                        </swiper-slide>
                        <swiper-slide class="p-1 width-220">
                            <div class="row gx-3 gx-lg-4 align-items-center">
                                <div class="col-auto">
                                    <div class="avatar avatar-60 rounded bg-theme-1-subtle text-theme-1">
                                        <i class="bi bi-arrow-down-left h4"></i>
                                    </div>
                                </div>
                                <div class="col">
                                    <p class="text-secondary small mb-0">Investments</p>
                                    <h4 class="mb-0"><span>12500</span> <small class="h6">USD</small></h4>
                                    <p class="small">
                                        350.00 <span class="text-theme-1 theme-green"><i class="bi bi-arrow-up fs-12"></i>1.85%</span>
                                    </p>
                                </div>
                            </div>
                        </swiper-slide>
                        <div class="swiper-pagination"></div>
                    </swiper-container>
                </div>
            </div>
        </div>
        <div class="container-fluid mb-4 overflow-hidden">
            <div class="row gx-3 gx-lg-4">
                <div class="col-12 px-0">
                    <div class=" mb-3 mb-lg-4">
                        <app-bank-banner-chart class="height-250 w-100 d-block"></app-bank-banner-chart>
                    </div>
                </div>
            </div>
        </div>

        <!-- content -->
        <div class="container">
            <div class="row gx-3 gx-lg-4">
                <!--balance division category summary-->
                <div class="col-12 col-sm-6 col-lg-3">
                    <div class="card adminuiux-card mb-3 mb-lg-4">
                        <div class="card-header">
                            <div class="row gx-3 align-items-center">
                                <div class="col-auto">
                                    <div class="avatar avatar-40 rounded bg-theme-1-subtle text-theme-1">
                                        <i class="bi bi-cash h5"></i>
                                    </div>
                                </div>
                                <div class="col">
                                    <h6 class="mb-0">Liquid Money</h6>
                                    <p class="small text-secondary">Cash on hand</p>
                                </div>
                            </div>
                        </div>
                        <div class="card-body">
                            <div class="row gx-3 align-items-center">
                                <div class="col">
                                    <h4 class="mb-0">1350 <small class="h6">USD</small></h4>
                                    <p class="small">
                                        36.00 <span class="text-theme-1 theme-green"><i class="bi bi-arrow-up fs-12"></i>3.15%</span>
                                    </p>
                                </div>
                                <div class="col-auto">
                                    <app-circle-progress-blue class="avatar avatar-60 rounded-circle"></app-circle-progress-blue>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-12 col-sm-6 col-lg-3">
                    <div class="card adminuiux-card mb-3 mb-lg-4">
                        <div class="card-header">
                            <div class="row gx-3 align-items-center">
                                <div class="col-auto">
                                    <div class="avatar avatar-40 rounded bg-theme-1-subtle text-theme-1 theme-green">
                                        <i class="bi bi-bank h5"></i>
                                    </div>
                                </div>
                                <div class="col">
                                    <h6 class="mb-0">Bank Balance</h6>
                                    <p class="small text-secondary">All accounts</p>
                                </div>
                            </div>
                        </div>
                        <div class="card-body">
                            <div class="row gx-3 align-items-center">
                                <div class="col">
                                    <h4 class="mb-0">2356800 <small class="h6">USD</small></h4>
                                    <p class="small">
                                        126.00 <span class="text-theme-1 theme-green"><i class="bi bi-arrow-up fs-12"></i>3.15%</span>
                                    </p>
                                </div>
                                <div class="col-auto">
                                    <div class="avatar avatar-60 rounded-circle">
                                        <app-circle-progress-green class="avatar avatar-60 rounded-circle"></app-circle-progress-green>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-12 col-sm-6 col-lg-3">
                    <div class="card adminuiux-card mb-3 mb-lg-4">
                        <div class="card-header">
                            <div class="row gx-3 align-items-center">
                                <div class="col-auto">
                                    <div class="avatar avatar-40 rounded bg-theme-1-subtle text-theme-1 theme-yellow">
                                        <i class="bi bi-wallet2 h5"></i>
                                    </div>
                                </div>
                                <div class="col">
                                    <h6 class="mb-0">Wallet Balance</h6>
                                    <p class="small text-secondary">All Wallets</p>
                                </div>
                            </div>
                        </div>
                        <div class="card-body">
                            <div class="row gx-3 align-items-center">
                                <div class="col">
                                    <h4 class="mb-0">56980 <small class="h6">USD</small></h4>
                                    <p class="small">
                                        141.00 <span class="text-theme-1 theme-green"><i class="bi bi-arrow-up fs-12"></i>4.13%</span>
                                    </p>
                                </div>
                                <div class="col-auto">
                                    <div class="avatar avatar-60 rounded-circle">
                                        <app-circle-progress-yellow class="avatar avatar-60 rounded-circle"></app-circle-progress-yellow>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-12 col-sm-6 col-lg-3">
                    <div class="card adminuiux-card mb-3 mb-lg-4">
                        <div class="card-header">
                            <div class="row gx-3 gx-lg-4 align-items-center">
                                <div class="col-auto">
                                    <div class="avatar avatar-40 rounded bg-theme-1-subtle text-theme-1 theme-red">
                                        <i class="bi bi-currency-bitcoin h4"></i>
                                    </div>
                                </div>
                                <div class="col">
                                    <h6 class="mb-0">Crypto Assets</h6>
                                    <p class="small text-secondary">All Crypto</p>
                                </div>
                                <div class="col-auto"></div>
                            </div>
                        </div>
                        <div class="card-body">
                            <div class="row gx-3 gx-lg-4 align-items-center">
                                <div class="col">
                                    <h4 class="mb-0">195600 <small class="h6">USD</small></h4>
                                    <p class="small">
                                        101.00 <span class="text-theme-1 theme-green"><i class="bi bi-arrow-up fs-12"></i>3.05%</span>
                                    </p>
                                </div>
                                <div class="col-auto">
                                    <div class="avatar avatar-60 rounded-circle">
                                        <app-circle-progress-red class="avatar avatar-60 rounded-circle"></app-circle-progress-red>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="row gx-3 gx-lg-4">
                <!-- Sent money -->
                <div class="col-12 col-md-12 col-lg-6 col-xxl-3">
                    <div class="card adminuiux-card mb-3 mb-lg-4">
                        <div class="card-header">
                            <div class="row gx-3 align-items-center">
                                <div class="col-auto">
                                    <i class="bi bi-arrow-up-right h5 avatar avatar-40 bg-theme-1-subtle text-theme-1 rounded"></i>
                                </div>
                                <div class="col">
                                    <h6 class="mb-0">Sent Money</h6>
                                    <p class="small text-secondary">Transfer to Contacts</p>
                                </div>
                            </div>
                        </div>
                        <div class="card-body">
                            <input class="form-control form-control-lg fs-2 fw-bold text-center mb-3" type="number" placeholder="0.00" />
                            <div class="row gx-3 align-items-center mb-2">
                                <div class="col-12 mb-2">
                                    <div class="input-group input-group-md rounded">
                                        <span class="input-group-text text-theme-1 px-2"><i class="bi bi-cash"></i></span>
                                        <select class="form-select">
                                            <option>Wallet</option>
                                            <option selected>Bank</option>
                                            <option>Crypto</option>
                                        </select>
                                    </div>
                                </div>
                                <div class="col-12">
                                    <div class="input-group input-group-md rounded">
                                        <span class="input-group-text text-theme-1 px-2"><i class="bi bi-bank"></i></span>
                                        <select class="form-select">
                                            <option>CA Bank</option>
                                            <option>Larson Bank</option>
                                            <option>Truelance Bank</option>
                                            <option selected>Cabilian Bank</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                            <p class="text-secondary small">Balance: 966800.00 USD</p>
                            <div class="input-group input-group-md rounded mb-3">
                                <span class="input-group-text text-theme-1"><i class="bi bi-person-lines-fill"></i></span>
                                <input class="form-control" type="search" placeholder="Send Money to..." />
                            </div>
                            <h6 class="mb-3">Sent Money to</h6>
                            <div class="row gx-3">
                                <div class="col-auto">
                                    <button type="button" class="btn btn-square btn-outline-theme" data-bs-toggle="tooltip" data-bs-placement="top" title="Bank Account">
                                        <i class="bi bi-bank h5"></i>
                                    </button>
                                </div>
                                <div class="col-auto">
                                    <button type="button" class="btn btn-square btn-outline-theme" data-bs-toggle="tooltip" data-bs-placement="top" title="Wallet">
                                        <i class="bi bi-wallet2 h5"></i>
                                    </button>
                                </div>
                                <div class="col-auto">
                                    <button type="button" class="btn btn-square btn-outline-theme" data-bs-toggle="tooltip" data-bs-placement="top" title="Crypto Address">
                                        <i class="bi bi-currency-bitcoin h5"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Doughnut Expense Category -->
                <div class="col-12 col-md-12 col-lg-6 col-xxl-3">
                    <div class="card adminuiux-card mb-3 mb-lg-4">
                        <div class="card-header">
                            <div class="row gx-3 align-items-center">
                                <div class="col-auto">
                                    <i class="bi bi-bar-chart h5 avatar avatar-40 bg-theme-1-subtle text-theme-1 theme-purple rounded"></i>
                                </div>
                                <div class="col">
                                    <h6 class="mb-0">Expense</h6>
                                    <p class="small text-secondary">Categories</p>
                                </div>
                            </div>
                        </div>
                        <div class="card-body">
                            <div class="height-180 width-180 position-relative mb-3 mb-lg-4 mx-auto z-index-0">
                                <app-doughnut-chartjs-180 class="avatar avatar-180 rounded-circle" id="doughnutchart"></app-doughnut-chartjs-180>
                                <div class="avatar avatar-130 position-absolute top-50 start-50 translate-middle rounded-circle shadow z-index-1">
                                    <div class="w-100 lh-20">
                                        <h4 class="mb-1">2,55.98K</h4>
                                        <p class="text-success small">18.71 (0.73%)</p>
                                    </div>
                                </div>
                            </div>
                            <div class="row mb-3">
                                <div class="col">
                                    <h6>Top Categories</h6>
                                </div>
                                <div class="col-auto">
                                    <p class="text-secondary small">Values in thousand</p>
                                </div>
                            </div>
                            <div class="row gx-3">
                                <div class="col-6 mb-3">
                                    <div class="row gx-3">
                                        <div class="col-auto">
                                            <div class="avatar avatar-40 rounded bg-theme-1-subtle text-theme-1 theme-yellow">
                                                <i class="bi bi-egg h5"></i>
                                            </div>
                                        </div>
                                        <div class="col">
                                            <h6 class="mb-0">40.00 <small class="fs-10">USD</small></h6>
                                            <p class="small text-secondary">Food</p>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-6 mb-3">
                                    <div class="row gx-3">
                                        <div class="col-auto">
                                            <div class="avatar avatar-40 rounded bg-theme-1-subtle text-theme-1 theme-green">
                                                <i class="bi bi-truck h5"></i>
                                            </div>
                                        </div>
                                        <div class="col">
                                            <h6 class="mb-0">10.15 <small class="fs-10">USD</small></h6>
                                            <p class="small text-secondary">Transport</p>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-6 mb-0">
                                    <div class="row gx-3">
                                        <div class="col-auto">
                                            <div class="avatar avatar-40 rounded bg-theme-1-subtle text-theme-1 theme-red">
                                                <i class="bi bi-people h5"></i>
                                            </div>
                                        </div>
                                        <div class="col">
                                            <h6 class="mb-0">15.05 <small class="fs-10">USD</small></h6>
                                            <p class="small text-secondary">Children</p>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-6 mb-0">
                                    <div class="row gx-3">
                                        <div class="col-auto">
                                            <div class="avatar avatar-40 rounded  bg-theme-1-subtle text-theme-1">
                                                <i class="bi bi-house h5"></i>
                                            </div>
                                        </div>
                                        <div class="col">
                                            <h6 class="mb-0">25.35 <small class="fs-10">USD</small></h6>
                                            <p class="small text-secondary">Home</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Top Funds-->
                <div class="col-12 col-md-12 col-lg-6 col-xxl-3 mb-4 ">
                    <div class="card adminuiux-card shadow-sm">
                        <div class="card-header">
                            <div class="row gx-3 align-items-center">
                                <div class="col-auto">
                                    <i class="bi bi-bar-chart h5 avatar avatar-40 bg-theme-1-subtle text-theme-1 theme-yellow rounded"></i>
                                </div>
                                <div class="col">
                                    <h6 class="mb-0">Investment</h6>
                                    <p class="small text-secondary">Funds, Bonds, Shares</p>
                                </div>
                            </div>
                        </div>
                        <div class="card-body">
                            <div class="w-100 height-110 mb-3">
                                <app-bar-blue-chartjs-100 class="height-110 w-100 d-block" id="barchart"></app-bar-blue-chartjs-100>
                            </div>
                            <div class="row gx-3 mb-2">
                                <div class="col">
                                    <h6>Details</h6>
                                </div>
                                <div class="col-auto"></div>
                            </div>
                            <div class="row gx-3 gx-lg-4">
                                <div class="col-12 px-0">
                                    <ul class="list-group list-group-flush bg-none">
                                        <li class=" list-group-item">
                                            <div class="row gx-3 gx-lg-4 align-items-center">
                                                <div class="col-auto">
                                                    <p class="mb-0">Funds</p>
                                                    <p class="text-secondary small">SIP-16, 25-Fixed</p>
                                                </div>
                                                <div class="col ps-0 text-end">
                                                    <h6 class=" mb-0">51,070.77 <small>USD</small></h6>
                                                    <p class="small text-secondary">
                                                        -20.17 <span class="text-theme-1 theme-red"><i class="bi bi-arrow-up fs-12"></i>-0.04%</span>
                                                    </p>
                                                </div>
                                            </div>
                                        </li>
                                        <li class="list-group-item">
                                            <div class="row gx-3 gx-lg-4 align-items-center">
                                                <div class="col-auto">
                                                    <p class="mb-0">Bonds</p>
                                                    <p class="text-secondary small">Gov.Se-2, 4-Private</p>
                                                </div>
                                                <div class="col ps-0 text-end">
                                                    <h6 class="mb-0">4048.24 <small>USD</small></h6>
                                                    <p class="small text-secondary">
                                                        1.20 <span class="text-theme-1 theme-green"><i class="bi bi-arrow-up fs-12"></i>0.04%</span>
                                                    </p>
                                                </div>
                                            </div>
                                        </li>
                                        <li class="list-group-item">
                                            <div class="row gx-3 gx-lg-4 align-items-center">
                                                <div class="col-auto">
                                                    <p class="mb-0">Shares</p>
                                                    <p class="text-secondary small">18 Company</p>
                                                </div>
                                                <div class="col ps-0 text-end">
                                                    <h6 class="mb-0">3750.00 <small>USD</small></h6>
                                                    <p class="small text-secondary">
                                                        74.00<span class="text-theme-1 theme-red"><i class="bi bi-arrow-up fs-12"></i>-2.09%</span>
                                                    </p>
                                                </div>
                                            </div>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Expense by card -->
                <div class="col-12 col-md-12 col-lg-6 col-xxl-3">
                    <!-- bank card -->
                    <div class="card adminuiux-card mb-3 mb-lg-4">
                        <div class="card-header">
                            <div class="row gx-3 align-items-center">
                                <div class="col-auto">
                                    <i class="bi bi-cash h5 avatar avatar-40 bg-theme-1-subtle text-theme-1 theme-green  rounded"></i>
                                </div>
                                <div class="col">
                                    <h6 class="mb-0">Card Expenses</h6>
                                    <p class="small text-secondary">Recently Used</p>
                                </div>
                                <div class="col-auto"></div>
                            </div>
                        </div>
                        <div class="card-body pt-1 overflow-hidden">
                            <!-- Credit cards carousel card -->
                            <swiper-container slides-per-view="auto" space-between="16" autoplay="true" class="swiper swipernav overflow-visible">
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
                                    <div class="row gx-3 mb-3">
                                        <div class="col">
                                            <p class="opacity-50 small mb-1">Expense</p>
                                            <h6>
                                                1500.00 <small class="text-success">18.0% <i class="bi bi-arrow-up"></i></small>
                                            </h6>
                                        </div>
                                        <div class="col-auto text-end">
                                            <p class="opacity-50 small mb-1">Limit Remain</p>
                                            <h6>13500.00</h6>
                                        </div>
                                    </div>
                                    <div class="list-group list-group-flush border-0 bg-transparent">
                                        <a href="" class="list-group-item">
                                            <div class="row gx-3">
                                                <div class="col-auto align-self-center">
                                                    <figure class="avatar avatar-40 rounded-circle coverimg vm">
                                                        <img src="assets/img/modern-ai-image/user-4.jpg" alt="" style="display: none;" />
                                                    </figure>
                                                </div>
                                                <div class="col px-0 align-self-center">
                                                    <p class="mb-0">David Warner</p>
                                                    <p class="small text-secondary">$ 410.00</p>
                                                </div>
                                                <div class="col-auto ps-0 align-self-center">
                                                    <i class="bi bi-chevron-right text-muted small vm"></i>
                                                </div>
                                            </div>
                                        </a>
                                        <a href="" class="list-group-item">
                                            <div class="row gx-3">
                                                <div class="col-auto align-self-center">
                                                    <figure class="avatar avatar-40 rounded-circle coverimg vm">
                                                        <img src="assets/img/modern-ai-image/user-3.jpg" alt="" style="display: none;" />
                                                    </figure>
                                                </div>
                                                <div class="col px-0 align-self-center">
                                                    <p class="mb-0">Shelvey Doe</p>
                                                    <p class="small text-secondary">$ 180.00</p>
                                                </div>
                                                <div class="col-auto ps-0 align-self-center">
                                                    <i class="bi bi-chevron-right text-muted small vm"></i>
                                                </div>
                                            </div>
                                        </a>
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
                                    <div class="row gx-3 mb-3">
                                        <div class="col">
                                            <p class="text-secondary small mb-1">Expense</p>
                                            <h6>
                                                3650.00 <small class="text-danger">11.0% <i class="bi bi-arrow-down"></i></small>
                                            </h6>
                                        </div>
                                        <div class="col-auto text-end">
                                            <p class="text-secondary small mb-1">Limit Remain</p>
                                            <h6>35500.00</h6>
                                        </div>
                                    </div>
                                    <ul class="list-group list-group-flush border-0 bg-transparent">
                                        <li class="list-group-item">
                                            <div class="row gx-3">
                                                <div class="col-auto align-self-center">
                                                    <figure class="avatar avatar-40 rounded-circle coverimg vm">
                                                        <img src="assets/img/modern-ai-image/user-4.jpg" alt="" style="display: none;" />
                                                    </figure>
                                                </div>
                                                <div class="col px-0 align-self-center">
                                                    <p class="mb-0">David Warner</p>
                                                    <p class="small text-secondary">$ 410.00</p>
                                                </div>
                                                <div class="col-auto ps-0 align-self-center">
                                                    <i class="bi bi-chevron-right text-muted small vm"></i>
                                                </div>
                                            </div>
                                        </li>
                                        <li class="list-group-item">
                                            <div class="row gx-3">
                                                <div class="col-auto align-self-center">
                                                    <figure class="avatar avatar-40 rounded-circle coverimg vm">
                                                        <img src="assets/img/modern-ai-image/user-3.jpg" alt="" style="display: none;" />
                                                    </figure>
                                                </div>
                                                <div class="col px-0 align-self-center">
                                                    <p class="mb-0">Shelvey Doe</p>
                                                    <p class="small text-secondary">$ 180.00</p>
                                                </div>
                                                <div class="col-auto ps-0 align-self-center">
                                                    <i class="bi bi-chevron-right text-muted small vm"></i>
                                                </div>
                                            </div>
                                        </li>
                                    </ul>
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
                                    <div class="row gx-3 mb-3">
                                        <div class="col">
                                            <p class="text-secondary small mb-1">Expense</p>
                                            <h6>
                                                1500.00 <small class="text-success">18.0 <i class="bi bi-arrow-up"></i></small>
                                            </h6>
                                        </div>
                                        <div class="col-auto text-end">
                                            <p class="text-secondary small mb-1">Limit Remain</p>
                                            <h6>13500.00</h6>
                                        </div>
                                    </div>
                                    <ul class="list-group list-group-flush border-0 bg-transparent">
                                        <li class="list-group-item">
                                            <div class="row gx-3">
                                                <div class="col-auto align-self-center">
                                                    <figure class="avatar avatar-40 rounded-circle coverimg vm">
                                                        <img src="assets/img/modern-ai-image/user-4.jpg" alt="" style="display: none;" />
                                                    </figure>
                                                </div>
                                                <div class="col px-0 align-self-center">
                                                    <p class="mb-0">David Warner</p>
                                                    <p class="small text-secondary">$ 410.00</p>
                                                </div>
                                                <div class="col-auto ps-0 align-self-center">
                                                    <i class="bi bi-chevron-right text-muted small vm"></i>
                                                </div>
                                            </div>
                                        </li>
                                        <li class="list-group-item">
                                            <div class="row gx-3">
                                                <div class="col-auto align-self-center">
                                                    <figure class="avatar avatar-40 rounded-circle coverimg vm">
                                                        <img src="assets/img/modern-ai-image/user-3.jpg" alt="" style="display: none;" />
                                                    </figure>
                                                </div>
                                                <div class="col px-0 align-self-center">
                                                    <p class="mb-0">Shelvey Doe</p>
                                                    <p class="small text-secondary">$ 180.00</p>
                                                </div>
                                                <div class="col-auto ps-0 align-self-center">
                                                    <i class="bi bi-chevron-right text-muted small vm"></i>
                                                </div>
                                            </div>
                                        </li>
                                    </ul>
                                </swiper-slide>
                            </swiper-container>
                        </div>
                    </div>
                </div>
            </div>

            <div class="row gx-3 gx-lg-4 mb-3 mb-lg-4">
                <div class="col text-center py-3">
                    <h4>Make a <span class="text-gradient">Bold Move</span> to be special</h4>
                    <p class="text-secondary">Unless you make bold decisions, you can't be special. This is the right time.</p>
                </div>
            </div>

            <!-- Offers assets average-->
            <div class="row gx-3 gx-lg-4">
                <!-- offer -->
                <div class="col-12 col-md-6 col-xxl-3">
                    <div class="card adminuiux-card mb-3 mb-lg-4">
                        <div class="card-body">
                            <div class="card adminuiux-card overflow-hidden mb-3">
                                <div class="row mx-0">
                                    <div class="col-6 bg-theme-1 text-white half-circle-vertical text-center py-4 z-index-1 theme-green">
                                        <div class="position-relative">
                                            <h3 class="mb-0">6.15%</h3>
                                            <p class="mb-1">Interest Rate</p>
                                            <p class="text-secondary small">Business Loan are at cheaper rate</p>
                                        </div>
                                    </div>
                                    <div class="col-6 position-relative">
                                        <figure class="coverimg position-absolute w-100 h-100 start-0 top-0 m-0">
                                            <img src="assets/img/modern-ai-image/pet-3.jpg" class="mw-100" alt="" />
                                        </figure>
                                    </div>
                                </div>
                            </div>
                            <div class="row gx-3 gx-lg-4 align-items-center">
                                <div class="col">
                                    <h5 class="mb-0">12541M <small class="h6">USD</small></h5>
                                    <p class="text-secondary small">Released Total</p>
                                </div>
                                <div class="col-auto">
                                    <button class="btn btn-sm btn-theme">Apply</button>
                                </div>
                            </div>
                        </div>
                        <div class="card-body p-0">
                            <div class=" mb-0">
                                <app-area-green-chartjs-60 class="w-100 height-70 d-block" id="areachartgreen1"></app-area-green-chartjs-60>
                            </div>
                        </div>
                    </div>
                </div>

                <!--assets value -->
                <div class="col-12 col-md-6 col-xxl-3">
                    <div class="card adminuiux-card mb-3 mb-lg-4">
                        <div class="card-body">
                            <div class="row gx-3 align-items-center">
                                <div class="col-auto">
                                    <figure class="avatar avatar-40 rounded-circle coverimg">
                                        <img src="assets/img/modern-ai-image/company9.jpg" alt="" />
                                    </figure>
                                </div>
                                <div class="col">
                                    <h5 class="mb-0">25.45 <small class="h6">XMR</small></h5>
                                    <p class="small">
                                        141.00 <span class="text-theme-1 theme-green"><i class="bi bi-arrow-up fs-12"></i>4.13%</span>
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div class="card-body p-0">
                            <div class="w-100 height-70 mb-2">
                                <app-area-yellow-chartjs-60 class="w-100 height-70 d-block" id="areachartyellow1"></app-area-yellow-chartjs-60>
                            </div>
                        </div>
                    </div>
                    <div class="card adminuiux-card mb-3 mb-lg-4">
                        <div class="card-body">
                            <div class="row gx-3 gx-lg-4 align-items-center">
                                <div class="col-auto">
                                    <figure class="avatar avatar-40 rounded-circle coverimg">
                                        <img src="assets/img/modern-ai-image/company8.jpg" alt="" />
                                    </figure>
                                </div>
                                <div class="col">
                                    <h5 class="mb-0">113258k <small class="h6">SHIB</small></h5>
                                    <p class="small">
                                        11.00 <span class="text-theme-1 theme-green"><i class="bi bi-arrow-up fs-12"></i>3.05%</span>
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div class="card-body p-0">
                            <div class="w-100 height-70 mb-2">
                                <app-area-red-chartjs-60 class="w-100 height-70 d-block" id="areachartred1"></app-area-red-chartjs-60>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- goals and target-->
                <div class="col-12 col-md-6 col-xxl-3">
                    <div class="card adminuiux-card position-relative mb-3 mb-lg-4">
                        <div class="coverimg position-absolute end-0 top-0 h-100 w-25 rounded">
                            <img src="assets/img/modern-ai-image/tree-4.jpg" alt="" />
                        </div>
                        <div class="row gx-3">
                            <div class="col-9">
                                <div class="card-body">
                                    <div class="row gx-2">
                                        <div class="col-auto">
                                            <div class="rounded bg-theme-1 text-white p-3">
                                                <i class="bi bi-building mb-1"></i>
                                                <p class="opacity-75 small mb-0">Annual<br />Income</p>
                                                <p>$2542</p>
                                            </div>
                                        </div>
                                        <div class="col align-self-center">
                                            <p class="text-secondary small mb-0">United States</p>
                                            <p>New York</p>
                                            <div class="mt-4">
                                                <div class="progress height-dynamic mb-1 bg-theme-1-subtle" style="--h-dynamic:5px">
                                                    <div class="progress-bar bg-theme w-25" role="progressbar" aria-valuenow="45" aria-valuemin="0" aria-valuemax="100"></div>
                                                </div>
                                            </div>
                                            <p class="small text-secondary">Target <span class="float-end">$ 1.16k</span></p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="card adminuiux-card theme-green mb-3 mb-lg-4">
                        <div class="card-body">
                            <div class="row gx-2">
                                <div class="col-auto">
                                    <div class="rounded bg-theme-1 text-white p-3">
                                        <i class="bi bi-bank mb-1"></i>
                                        <p class="opacity-75 small mb-0">Assets<br />Income</p>
                                        <p>$2542</p>
                                    </div>
                                </div>
                                <div class="col align-self-center">
                                    <div class="row gx-3">
                                        <div class="col">
                                            <p class="text-secondary small mb-0">United States</p>
                                            <p>New York</p>
                                        </div>
                                        <div class="col-auto text-end">
                                            <p class="text-secondary small mb-0">New Sales</p>
                                            <p>120 orders</p>
                                        </div>
                                    </div>
                                    <div class="mt-4">
                                        <div class="progress height-dynamic mb-1 bg-theme-1-subtle" style="--h-dynamic:5px">
                                            <div class="progress-bar bg-theme-1 w-50" role="progressbar" aria-valuenow="45" aria-valuemin="0" aria-valuemax="100"></div>
                                        </div>
                                    </div>
                                    <p class="small text-secondary">Targeted Orders<span class="float-end">260</span></p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- average expenses -->
                <div class="col-12 col-md-6 col-xxl-3">
                    <div class="card adminuiux-card mb-3 mb-lg-4">
                        <div class="card-header">
                            <div class="row gx-3 align-items-center">
                                <div class="col-auto">
                                    <i class="bi bi-cart h5 avatar avatar-40 bg-theme-1-subtle text-theme-1 rounded"></i>
                                </div>
                                <div class="col">
                                    <h6 class="mb-0">Average Expenses</h6>
                                    <p class="small text-secondary">Last 3 months</p>
                                </div>
                            </div>
                        </div>
                        <div class="card-body text-center">
                            <div class="height-140 w-100 position-relative mb-2">
                                <div class="position-absolute bottom-0 mx-auto start-50 translate-middle">
                                    <p class="text-secondary small mb-0">Total Expense</p>
                                    <h5>5.4k <small>USD</small></h5>
                                </div>
                                <div height-140 w-100 position-relative mb-2>
                                    <app-semi-doughnut-chartjs-180 class="d-block" id="semidoughnutchart" class=""></app-semi-doughnut-chartjs-180>
                                </div>
                            </div>
                            <p class="text-secondary small">You have spend most on Food and Your monthly average expense is</p>
                            <h4><span>5110</span> <small class="small fw-normal">USD/month</small></h4>
                        </div>
                    </div>
                </div>
            </div>

            <div class="row gx-3 gx-lg-4">
                <!-- summary  -->
                <div class="col-12 col-md-6 col-lg-6 col-xl-3 col-xxl-3">
                    <div class="card adminuiux-card mb-3 mb-lg-4">
                        <div class="card-body">
                            <div class="row gx-3 align-items-center">
                                <div class="col-auto">
                                    <div class="avatar avatar-60 rounded-circle">
                                        <app-circle-progress-blue-blank id="circleprogressblue"></app-circle-progress-blue-blank>
                                        <div class="avatar avatar-40 h5 bg-theme-1-subtle text-theme-1 position-absolute top-50 start-50 translate-middle rounded-circle">
                                            <i class="bi bi-receipt"></i>
                                        </div>
                                    </div>
                                </div>
                                <div class="col">
                                    <p class="text-secondary small mb-1">Total Bills</p>
                                    <h5 class="fw-medium">25486.00 <small>USD</small></h5>
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
                <div class="col-12 col-md-6 col-lg-6 col-xl-3 col-xxl-3">
                    <div class="card adminuiux-card mb-3 mb-lg-4">
                        <div class="card-body">
                            <div class="row gx-3 align-items-center">
                                <div class="col-auto">
                                    <div class="avatar avatar-60 rounded-circle">
                                        <app-circle-progress-yellow-blank id="circleprogressyellow"></app-circle-progress-yellow-blank>
                                        <div class="avatar avatar-40 h5 bg-theme-1-subtle text-theme-1 position-absolute top-50 start-50 translate-middle theme-yellow rounded-circle">
                                            <i class="bi bi-credit-card"></i>
                                        </div>
                                    </div>
                                </div>
                                <div class="col">
                                    <p class="text-secondary small mb-1">Paid Bills</p>
                                    <h5 class="fw-medium">12550<small>USD</small></h5>
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
                <div class="col-12 col-md-6 col-lg-6 col-xl-3 col-xxl-3">
                    <div class="card adminuiux-card mb-3 mb-lg-4">
                        <div class="card-body">
                            <div class="row gx-3 align-items-center">
                                <div class="col-auto">
                                    <div class="avatar avatar-60 rounded-circle">
                                        <app-circle-progress-red-blank id="circleprogressredsum"></app-circle-progress-red-blank>
                                        <div class="avatar avatar-40 h5 bg-theme-1-subtle text-theme-1 position-absolute top-50 start-50 translate-middle theme-red rounded-circle">
                                            <i class="bi bi-receipt-cutoff"></i>
                                        </div>
                                    </div>
                                </div>
                                <div class="col">
                                    <p class="text-secondary small mb-1">Unpaid Bills</p>
                                    <h5 class="fw-medium">1525<small>k</small></h5>
                                </div>
                                <div class="col-auto avatar-group">
                                    <figure class="avatar avatar-30 rounded-circle coverimg overlay-ms-15" data-bs-toggle="tooltip" data-bs-placement="top" title="Just Demo">
                                        <img src="assets/img/modern-ai-image/company6.png" alt="" />
                                    </figure>
                                    <figure class="avatar avatar-30 rounded-circle coverimg overlay-ms-15" data-bs-toggle="tooltip" data-bs-placement="top" title="Preview Purpose">
                                        <img src="assets/img/modern-ai-image/company8.jpg" alt="" />
                                    </figure>
                                    <figure class="avatar avatar-30 rounded-circle coverimg overlay-ms-15" data-bs-toggle="tooltip" data-bs-placement="top" title="to look real">
                                        <img src="assets/img/modern-ai-image/company9.jpg" alt="" />
                                    </figure>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-12 col-md-6 col-lg-6 col-xl-3 col-xxl-3">
                    <div class="card adminuiux-card bg-theme-1 shadow-sm mb-3 mb-lg-4">
                        <div class="card-body">
                            <div class="row gx-3 align-items-center">
                                <div class="col-auto">
                                    <div class="avatar avatar-60 rounded-circle">
                                        <app-circle-progress-white-blank id="circleprogresswhite"></app-circle-progress-white-blank>
                                        <div class="avatar avatar-40 h5 bg-white-opacity text-white position-absolute top-50 start-50 translate-middle rounded-circle">
                                            <i class="bi bi-envelope-check"></i>
                                        </div>
                                    </div>
                                </div>
                                <div class="col">
                                    <p class="opacity-75 small mb-1">Sent Money</p>
                                    <h5 class="fw-medium">1545 <small>k USD</small></h5>
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
                <!-- Transactions -->
                <div class="col-12 col-md-12 position-relative">
                    <div class="card adminuiux-card mb-3 mb-lg-4">
                        <div class="card-header">
                            <div class="row gx-3">
                                <div class="col-auto">
                                    <i class="bi bi-shop h5 avatar avatar-40 bg-theme-1-subtle text-theme-1 rounded"></i>
                                </div>
                                <div class="col-auto align-self-center">
                                    <h6 class="mb-0">Expense</h6>
                                    <p class="text-secondary small">All Transactions</p>
                                </div>
                                <div class="col-auto ms-auto">
                                    <div class="input-group ">
                                        <span class="input-group-text text-theme-1"><i class="bi bi-search"></i></span>
                                        <input type="text" class="form-control" placeholder="Search..." />
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="card-body py-0">
                            <table class="table table-borderless" id="dataTable" data-show-toggle="true">
                                <thead>
                                    <tr>
                                        <th class="width-10"></th>
                                        <th class="all">Expense</th>
                                        <th class="xs">Amount</th>
                                        <th class="desktop">Category</th>
                                        <th class="tablet desktop">Status</th>
                                        <th class="dektop">Deliver to</th>
                                        <th class="none">Address</th>
                                        <th class="none">Location</th>
                                        <th class="desktop">Payment</th>
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
                </div>
            </div>
        </div>
    `,
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class FinanceBankComponent {
    @ViewChild("choices") mySelect!: ElementRef;

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
