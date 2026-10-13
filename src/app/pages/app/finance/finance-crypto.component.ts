import { Component, OnInit, AfterViewInit, AfterContentChecked, OnDestroy, ViewChild, ElementRef, CUSTOM_ELEMENTS_SCHEMA } from "@angular/core";
import { RouterLink } from "@angular/router";
import Choices, { ClassNames } from "choices.js";
import Swiper from "swiper";
import { register } from "swiper/element/bundle";
register();
import DataTable from "datatables.net-dt";
import "datatables.net-responsive-dt";

import { DaterangePickerRangesComponent } from "../../../components/input-fields/daterange-picker/daterange-picker-ranges.component";
import { CircleProgressBlueComponent } from "../../../components/charts/circle-progress-blue.component";
import { CircleProgressGreenComponent } from "../../../components/charts/circle-progress-green.component";
import { CircleProgressYellowComponent } from "../../../components/charts/circle-progress-yellow.component";
import { CircleProgressRedComponent } from "../../../components/charts/circle-progress-red.component";
import { AreaBlueChartjs60Component } from "../../../components/charts/area-blue-chartjs-60.component";
import { ArearedChartjs60Component } from "../../../components/charts/area-red-chartjs-60.component";
import { AreaYellowChartjs60Component } from "../../../components/charts/area-yellow-chartjs-60.component";
import { AreaGreenChartjs60Component } from "../../../components/charts/area-green-chartjs-60.component";
import { BarBlueChartjs100Component } from "../../../components/charts/bar-blue-chartjs-100.component";
import { CircleProgressBlueBlankComponent } from "../../../components/charts/circle-progress-blue-blank.component";
import { CircleProgressYellowBlankComponent } from "../../../components/charts/circle-progress-yellow-blank.component";
import { CircleProgressRedBlankComponent } from "../../../components/charts/circle-progress-red-blank.component";
import { CircleProgressGreenBlankComponent } from "../../../components/charts/circle-progress-green-blank.component";
import { CircleProgressWhiteBlankComponent } from "../../../components/charts/circle-progress-white-blank.component";

@Component({
    selector: "app-finance-crypto",
    standalone: true,
    imports: [RouterLink, DaterangePickerRangesComponent, CircleProgressBlueBlankComponent, CircleProgressYellowBlankComponent, CircleProgressRedBlankComponent, CircleProgressGreenBlankComponent, CircleProgressWhiteBlankComponent, CircleProgressBlueComponent, CircleProgressGreenComponent, CircleProgressYellowComponent, CircleProgressRedComponent, AreaBlueChartjs60Component, ArearedChartjs60Component, AreaYellowChartjs60Component, AreaGreenChartjs60Component, BarBlueChartjs100Component],
    template: `
        <!-- page title -->
        <div class="container-fluid py-3">
            <div class="row gx-3 gx-lg-4 align-items-center page-title">
                <div class="col col-sm mb-3 mb-sm-0 order-1">
                    <h5 class="mb-0">Crypto Dashboard</h5>
                    <p class="text-secondary small">Potential with Income and Expense Tracking</p>
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
                    <li class="breadcrumb-item bi active" aria-current="page">Crypto</li>
                </ol>
            </nav>
        </div>

        <!-- content -->
        <div class="container mt-3" id="main-content">
            <div class="row gx-3 gx-lg-4 align-items-center">
                <!-- Balance message -->
                <div class="col-12 col-md py-2 py-lg-3 mb-3 mb-lg-4">
                    <h5 class="mb-2 fw-normal text-secondary">Current Balance,</h5>
                    <h1 class="mb-0 text-gradient">256240.03 <small>USD</small></h1>
                    <h5>
                        46124.28 <small class="text-success">18.0% <i class="bi bi-arrow-up"></i></small>
                    </h5>
                </div>

                <!--current holding -->
                <div class="col-12 col-md-6 py-2 py-lg-3 mb-3 mb-lg-4">
                    <swiper-container slides-per-view="auto" space-between="16" autoplay="true" class="swiper swipernav">
                        <swiper-slide class="pb-1 width-240">
                            <div class="card adminuiux-card shadow-sm">
                                <div class="card-body">
                                    <div class="row gx-3 align-items-center">
                                        <div class="col-auto">
                                            <figure class="avatar avatar-60 rounded-circle coverimg">
                                                <img src="assets/img/modern-ai-image/company6.png" alt="" />
                                            </figure>
                                        </div>
                                        <div class="col">
                                            <h4><span>1200</span> <small class="h6">USD</small></h4>
                                            <p class="text-secondary small mb-0">0.000051 BTC</p>
                                            <p class="small">
                                                30.0365 <span class="text-theme-1 theme-green"><i class="bi bi-arrow-up fs-12"></i>3.15%</span>
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </swiper-slide>
                        <swiper-slide class="pb-1 width-240">
                            <div class="card adminuiux-card shadow-sm">
                                <div class="card-body">
                                    <div class="row gx-3 align-items-center">
                                        <div class="col-auto">
                                            <figure class="avatar avatar-60 rounded-circle coverimg">
                                                <img src="assets/img/modern-ai-image/company7.jpg" alt="" />
                                            </figure>
                                        </div>
                                        <div class="col">
                                            <h4><span>4721</span> <small class="h6">USD</small></h4>
                                            <p class="text-secondary small mb-0">1.1541 ETH</p>
                                            <p class="small">
                                                125.00 <span class="text-theme-1 theme-green"><i class="bi bi-arrow-up fs-12"></i>3.15%</span>
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </swiper-slide>
                        <swiper-slide class="pb-1 width-240">
                            <div class="card adminuiux-card shadow-sm">
                                <div class="card-body">
                                    <div class="row gx-3 align-items-center">
                                        <div class="col-auto">
                                            <figure class="avatar avatar-60 rounded-circle coverimg">
                                                <img src="assets/img/modern-ai-image/company9.jpg" alt="" />
                                            </figure>
                                        </div>
                                        <div class="col">
                                            <h4><span>5268</span> <small class="h6">USD</small></h4>
                                            <p class="text-secondary small mb-0">25.45 XMR</p>
                                            <p class="small">
                                                89.00 <span class="text-theme-1 theme-green"><i class="bi bi-arrow-up fs-12"></i>3.15%</span>
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </swiper-slide>
                        <swiper-slide class="pb-1 width-240">
                            <div class="card adminuiux-card shadow-sm">
                                <div class="card-body">
                                    <div class="row gx-3 align-items-center">
                                        <div class="col-auto">
                                            <figure class="avatar avatar-60 rounded-circle coverimg">
                                                <img src="assets/img/modern-ai-image/company8.jpg" alt="" />
                                            </figure>
                                        </div>
                                        <div class="col">
                                            <h4><span>4352</span> <small class="h6">USD</small></h4>
                                            <p class="text-secondary small mb-0">113258k SHIB</p>
                                            <p class="small">
                                                300.0365 <span class="text-theme-1 theme-green"><i class="bi bi-arrow-up fs-12"></i>4.29%</span>
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </swiper-slide>
                    </swiper-container>
                </div>
            </div>

            <div class="row gx-3 gx-lg-4">
                <!--charts category summary-->
                <div class="col-12 col-md-6 col-xxl-3">
                    <div class="card adminuiux-card mb-3 mb-lg-4">
                        <div class="card-body">
                            <div class="row gx-3 align-items-center">
                                <div class="col-auto">
                                    <figure class="avatar avatar-50 rounded-circle coverimg">
                                        <img src="assets/img/modern-ai-image/company7.jpg" alt="" />
                                    </figure>
                                </div>
                                <div class="col">
                                    <h4 class="mb-0">1.1541 <small class="h6">ETH</small></h4>
                                    <p class="small">
                                        30.0365 <span class="text-theme-1 theme-green"><i class="bi bi-arrow-up fs-12"></i>3.15%</span>
                                    </p>
                                </div>
                                <div class="col-auto">
                                    <app-circle-progress-blue></app-circle-progress-blue>
                                </div>
                            </div>
                        </div>
                        <div class="card-body p-0">
                            <app-area-blue-chartjs-60 class="height-70 w-100 mb-2 d-block"></app-area-blue-chartjs-60>
                        </div>
                    </div>
                </div>
                <div class="col-12 col-md-6 col-xxl-3">
                    <div class="card adminuiux-card mb-3 mb-lg-4">
                        <div class="card-body">
                            <div class="row gx-3 align-items-center">
                                <div class="col-auto">
                                    <figure class="avatar avatar-50 rounded-circle coverimg">
                                        <img src="assets/img/modern-ai-image/company10.png" alt="" />
                                    </figure>
                                </div>
                                <div class="col">
                                    <h4 class="mb-0">12541 <small class="h6">ETC</small></h4>
                                    <p class="small">
                                        120.0365 <span class="text-theme-1 theme-green"><i class="bi bi-arrow-up fs-12"></i>3.15%</span>
                                    </p>
                                </div>
                                <div class="col-auto">
                                    <app-circle-progress-green class="avatar avatar-60 rounded-circle"></app-circle-progress-green>
                                </div>
                            </div>
                        </div>
                        <div class="card-body p-0">
                            <app-area-green-chartjs-60 class="height-70 w-100 mb-2 d-block"></app-area-green-chartjs-60>
                        </div>
                    </div>
                </div>
                <div class="col-12 col-md-6 col-xxl-3">
                    <div class="card adminuiux-card mb-3 mb-lg-4">
                        <div class="card-body">
                            <div class="row gx-3 align-items-center">
                                <div class="col-auto">
                                    <figure class="avatar avatar-50 rounded-circle coverimg">
                                        <img src="assets/img/modern-ai-image/company9.jpg" alt="" />
                                    </figure>
                                </div>
                                <div class="col">
                                    <h4 class="mb-0">25.45 <small class="h6">XMR</small></h4>
                                    <p class="small">
                                        141.00 <span class="text-theme-1 theme-red"><i class="bi bi-arrow-down fs-10"></i>4.13%</span>
                                    </p>
                                </div>
                                <div class="col-auto">
                                    <app-circle-progress-yellow class="avatar avatar-60 rounded-circle"></app-circle-progress-yellow>
                                </div>
                            </div>
                        </div>
                        <div class="card-body p-0">
                            <app-area-yellow-chartjs-60 class="height-70 w-100 mb-2 d-block"></app-area-yellow-chartjs-60>
                        </div>
                    </div>
                </div>
                <div class="col-12 col-md-6 col-xxl-3">
                    <div class="card adminuiux-card mb-3 mb-lg-4">
                        <div class="card-body">
                            <div class="row gx-3 align-items-center">
                                <div class="col-auto">
                                    <figure class="avatar avatar-50 rounded-circle coverimg">
                                        <img src="assets/img/modern-ai-image/company8.jpg" alt="" />
                                    </figure>
                                </div>
                                <div class="col">
                                    <h4 class="mb-0">1132k <small class="h6">SHIB</small></h4>
                                    <p class="small">
                                        11.00 <span class="text-theme-1 theme-green"><i class="bi bi-arrow-up fs-12"></i>3.05%</span>
                                    </p>
                                </div>
                                <div class="col-auto">
                                    <app-circle-progress-red class="avatar avatar-60 rounded-circle"></app-circle-progress-red>
                                </div>
                            </div>
                        </div>
                        <div class="card-body p-0">
                            <div class="height-70 w-100 mb-2">
                                <app-area-red-chartjs-60 class="height-70 w-100 mb-2 d-block"></app-area-red-chartjs-60>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="row gx-3 gx-lg-4">
                <!-- Sent money -->
                <div class="col-12 col-md-12 col-lg-12 col-xl-12 col-xxl-6">
                    <div class="card adminuiux-card mb-3 mb-lg-4">
                        <div class="card-header">
                            <div class="row gx-3 align-items-center">
                                <div class="col-auto">
                                    <i class="bi bi-arrow-up-right h5 avatar avatar-40 bg-theme-1-subtle text-theme-1 rounded"></i>
                                </div>
                                <div class="col">
                                    <h6 class="mb-0">Sent Money</h6>
                                    <p class="small text-secondary">Targeted Total: 1405 USD</p>
                                </div>
                                <div class="col-auto"></div>
                            </div>
                        </div>
                        <div class="card-body">
                            <div class="row gx-3 gx-lg-4">
                                <div class="col-12 col-md-6 col-lg-5">
                                    <app-bar-blue-chartjs-100 class="height-210 d-block mb-4" id="barchart"></app-bar-blue-chartjs-100>

                                    <div class="row gx-3 align-items-center mb-4 mb-md-1">
                                        <div class="col-auto">
                                            <div class="avatar avatar-60 rounded-circle">
                                                <app-circle-progress-green-blank class="avatar avatar-60 rounded-circle"></app-circle-progress-green-blank>
                                                <div class="avatar avatar-40 h5 bg-theme-1-subtle text-theme-1 rounded-circle position-absolute start-50 top-50 translate-middle theme-green"><i class="bi bi-receipt"></i></div>
                                            </div>
                                        </div>
                                        <div class="col">
                                            <p class="text-secondary small mb-1">Transaction</p>
                                            <h5>1024 <small>USD</small></h5>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-12 col-md-6 col-lg-7 border-start">
                                    <div class="row gx-3 align-items-center mb-3">
                                        <div class="col">
                                            <h6 class="text-theme-1 mb-1">Transfer now</h6>
                                            <p class="small text-secondary">1 DOGE : 135.00 USD</p>
                                        </div>
                                        <div class="col-auto">
                                            <div class="input-group input-group-md rounded w-150">
                                                <span class="input-group-text text-theme-1 px-2"><i class="bi bi-coin"></i></span>
                                                <select class="form-select">
                                                    <option>LTC</option>
                                                    <option>BTC</option>
                                                    <option>ETH</option>
                                                    <option selected>DOGE</option>
                                                    <option>SHIB</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                    <input class="form-control amount-input text-center mb-2" type="text" placeholder="0.00" />
                                    <div class="input-group input-group-md rounded mb-3">
                                        <span class="input-group-text text-theme-1"><i class="bi bi-person-lines-fill"></i></span>
                                        <input class="form-control" type="search" placeholder="Send Money to..." />
                                    </div>
                                    <h6>Recent Transactions:</h6>
                                    <ul class="list-group list-group-flush bg-none">
                                        <li class="list-group-item rounded">
                                            <div class="row gx-3">
                                                <div class="col-auto align-self-center">
                                                    <figure class="avatar avatar-40 rounded-circle coverimg vm">
                                                        <img src="assets/img/modern-ai-image/user-4.jpg" alt="" />
                                                    </figure>
                                                </div>
                                                <div class="col align-self-center">
                                                    <p class="mb-0">David Warner</p>
                                                    <p class="small text-secondary">410.00 USD</p>
                                                </div>
                                                <div class="col-auto align-self-center">
                                                    <a href="" class="btn btn-link btn-square">
                                                        <i class="bi bi-send"></i>
                                                    </a>
                                                </div>
                                            </div>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- crypto Trending card -->
                <div class="col-12 col-md-12 col-lg-6 col-xxl-3">
                    <div class="card adminuiux-card mb-3 mb-lg-4">
                        <div class="card-header">
                            <div class="row gx-3 align-items-center">
                                <div class="col-auto">
                                    <i class="bi bi-bar-chart h5 avatar avatar-40 bg-theme-1-subtle text-theme-1 theme-yellow rounded"></i>
                                </div>
                                <div class="col">
                                    <h6 class="mb-0">Favorite Crypto</h6>
                                    <p class="small text-secondary">Top 5 Favorite</p>
                                </div>
                                <div class="col-auto"></div>
                            </div>
                        </div>
                        <div class="card-body p-0">
                            <ul class="list-group list-group-flush bg-none">
                                <li class=" list-group-item">
                                    <div class="row gx-3 align-items-center">
                                        <div class="col-auto">
                                            <figure class="avatar avatar-40 rounded-circle coverimg">
                                                <img src="assets/img/modern-ai-image/company6.png" alt="" />
                                            </figure>
                                        </div>
                                        <div class="col">
                                            <p class="mb-0">51,070.77 <small>USD</small></p>
                                            <p class="small text-secondary">
                                                -20.17 <span class="text-theme-1 theme-red"><i class="bi bi-arrow-up fs-12"></i>-0.04%</span>
                                            </p>
                                        </div>
                                        <div class="col-auto">
                                            <button class="btn btn-sm btn-square btn-link theme-green"><i class="bi bi-arrow-down-left"></i></button>
                                            <button class="btn btn-sm btn-square btn-link theme-red"><i class="bi bi-arrow-up-right"></i></button>
                                        </div>
                                    </div>
                                </li>
                                <li class="list-group-item">
                                    <div class="row gx-3 align-items-center">
                                        <div class="col-auto">
                                            <figure class="avatar avatar-40 rounded-circle coverimg">
                                                <img src="assets/img/modern-ai-image/company7.jpg" alt="" />
                                            </figure>
                                        </div>
                                        <div class="col">
                                            <p class="mb-0">4048.24 <small>USD</small></p>
                                            <p class="small text-secondary">
                                                1.20 <span class="text-theme-1 theme-green"><i class="bi bi-arrow-up fs-12"></i>0.04%</span>
                                            </p>
                                        </div>
                                        <div class="col-auto">
                                            <button class="btn btn-sm btn-square btn-link theme-green"><i class="bi bi-arrow-down-left"></i></button>
                                            <button class="btn btn-sm btn-square btn-link theme-red"><i class="bi bi-arrow-up-right"></i></button>
                                        </div>
                                    </div>
                                </li>
                                <li class="list-group-item">
                                    <div class="row gx-3 gx-lg-4 align-items-center">
                                        <div class="col-auto">
                                            <figure class="avatar avatar-40 rounded-circle coverimg">
                                                <img src="assets/img/modern-ai-image/company8.jpg" alt="" />
                                            </figure>
                                        </div>
                                        <div class="col">
                                            <p class="mb-0">0.00003750 <small>USD</small></p>
                                            <p class="small text-secondary">
                                                0.00019<span class="text-theme-1 theme-red"><i class="bi bi-arrow-up fs-12"></i>-2.09%</span>
                                            </p>
                                        </div>
                                        <div class="col-auto">
                                            <button class="btn btn-sm btn-square btn-link theme-green"><i class="bi bi-arrow-down-left"></i></button>
                                            <button class="btn btn-sm btn-square btn-link theme-red"><i class="bi bi-arrow-up-right"></i></button>
                                        </div>
                                    </div>
                                </li>
                                <li class="list-group-item">
                                    <div class="row gx-3 align-items-center">
                                        <div class="col-auto">
                                            <figure class="avatar avatar-40 rounded-circle coverimg">
                                                <img src="assets/img/modern-ai-image/company9.jpg" alt="" />
                                            </figure>
                                        </div>
                                        <div class="col">
                                            <p class="mb-0">212 <small>USD</small></p>
                                            <p class="small text-secondary">
                                                20.17 <span class="text-theme-1 theme-green"><i class="bi bi-arrow-up fs-12"></i>5.13%</span>
                                            </p>
                                        </div>
                                        <div class="col-auto">
                                            <button class="btn btn-sm btn-square btn-link theme-green"><i class="bi bi-arrow-down-left"></i></button>
                                            <button class="btn btn-sm btn-square btn-link theme-red"><i class="bi bi-arrow-up-right"></i></button>
                                        </div>
                                    </div>
                                </li>
                                <li class="list-group-item">
                                    <div class="row gx-3 align-items-center">
                                        <div class="col-auto">
                                            <figure class="avatar avatar-40 rounded-circle coverimg">
                                                <img src="assets/img/modern-ai-image/company10.png" alt="" />
                                            </figure>
                                        </div>
                                        <div class="col">
                                            <p class="mb-0">38 <small>USD</small></p>
                                            <p class="small text-secondary">
                                                20.17 <span class="text-theme-1 theme-green"><i class="bi bi-arrow-up fs-12"></i>0.26%</span>
                                            </p>
                                        </div>
                                        <div class="col-auto">
                                            <button class="btn btn-sm btn-square btn-link theme-green"><i class="bi bi-arrow-down-left"></i></button>
                                            <button class="btn btn-sm btn-square btn-link theme-red"><i class="bi bi-arrow-up-right"></i></button>
                                        </div>
                                    </div>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>

                <!-- crypto carousel card -->
                <div class="col-12 col-md-12 col-lg-6 col-xxl-3">
                    <!-- Crypto card -->
                    <div class="card adminuiux-card mb-3 mb-lg-4">
                        <div class="card-header">
                            <div class="row gx-3 align-items-center">
                                <div class="col-auto">
                                    <i class="bi bi-cash h5 avatar avatar-40 bg-theme-1-subtle text-theme-1 theme-red rounded"></i>
                                </div>
                                <div class="col">
                                    <h6 class="mb-0">Asset Expenses</h6>
                                    <p class="small text-secondary">Recently Used</p>
                                </div>
                                <div class="col-auto"></div>
                            </div>
                        </div>
                        <div class="card-body overflow-hidden">
                            <!-- Credit cards carousel card -->
                            <swiper-container slides-per-view="auto" space-between="16" autoplay="true" class="swiper swipernav overflow-visible">
                                <swiper-slide class="width-240">
                                    <div class="card adminuiux-card mb-2 theme-orange bg-theme-r-gradient overflow-hidden">
                                        <div class="coverimg top-0 start-0 h-100 w-100 position-absolute z-index-0 opacity-25">
                                            <img src="assets/img/modern-ai-image/tree-4.jpg" alt="" style="display: none;" />
                                        </div>
                                        <div class="card-body position-relative z-index-1">
                                            <div class="row gx-3 align-items-center mb-3">
                                                <div class="col-auto align-self-center">
                                                    <figure class="avatar avatar-30 rounded-circle coverimg">
                                                        <img src="assets/img/modern-ai-image/company9.jpg" alt="" />
                                                    </figure>
                                                </div>
                                                <div class="col text-end">
                                                    <p class="fs-12">
                                                        <span class="opacity-75 small">Monero</span><br />
                                                        <span class="">XMR</span>
                                                    </p>
                                                </div>
                                            </div>
                                            <p class="fw-medium h6 mb-3">XXX-DXXX000000146598</p>
                                            <div class="row gx-3 gx-lg-4">
                                                <div class="col-auto fs-12">
                                                    <p class="mb-0 opacity-50 small">Balance</p>
                                                    <p>25.45</p>
                                                </div>
                                                <div class="col text-end fs-12">
                                                    <p class="mb-0  opacity-50 small">USD Value</p>
                                                    <p>5268</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="row amount-data mb-3">
                                        <div class="col">
                                            <p class="text-secondary small mb-1">Expense</p>
                                            <p>
                                                4.00 <small class="text-success">18.0% <i class="bi bi-arrow-up"></i></small>
                                            </p>
                                        </div>
                                        <div class="col-auto text-end">
                                            <p class="text-secondary small mb-1">Limit Remain</p>
                                            <p>14.00</p>
                                        </div>
                                    </div>
                                    <div class="row amount-data align-items-center">
                                        <div class="col">
                                            <p class="opacity-75 small mb-1">This month</p>
                                            <p>4.5 <small>XMR</small></p>
                                        </div>
                                        <div class="col-auto avatar-group">
                                            <figure class="avatar avatar-30 rounded-circle coverimg overlay-ms-5" data-bs-toggle="tooltip" data-bs-placement="top" title="Shelvey Doe">
                                                <img src="assets/img/modern-ai-image/user-2.jpg" alt="" />
                                            </figure>
                                            <figure class="avatar avatar-30 rounded-circle coverimg overlay-ms-5" data-bs-toggle="tooltip" data-bs-placement="top" title="Maria Smith">
                                                <img src="assets/img/modern-ai-image/user-3.jpg" alt="" />
                                            </figure>
                                            <figure class="avatar avatar-30 rounded-circle coverimg overlay-ms-5" data-bs-toggle="tooltip" data-bs-placement="top" title="Steve Branden">
                                                <img src="assets/img/modern-ai-image/user-4.jpg" alt="" />
                                            </figure>
                                        </div>
                                    </div>
                                </swiper-slide>
                                <swiper-slide class="width-240">
                                    <div class="card adminuiux-card mb-2 theme-green bg-theme-r-gradient overflow-hidden">
                                        <div class="coverimg top-0 start-0 h-100 w-100 position-absolute z-index-0 opacity-25">
                                            <img src="assets/img/modern-ai-image/tree-2.jpg" alt="" style="display: none;" />
                                        </div>
                                        <div class="card-body position-relative z-index-1">
                                            <div class="row gx-3 align-items-center mb-3">
                                                <div class="col-auto align-self-center">
                                                    <figure class="avatar avatar-30 rounded-circle coverimg">
                                                        <img src="assets/img/modern-ai-image/company10.png" alt="" />
                                                    </figure>
                                                </div>
                                                <div class="col text-end">
                                                    <p class="fs-12">
                                                        <span class="small">Ethereum Classic</span><br />
                                                        <span class="">ETC</span>
                                                    </p>
                                                </div>
                                            </div>
                                            <p class="fw-medium h6 mb-3">XXX-DXXX000000146598</p>
                                            <div class="row gx-3 gx-lg-4">
                                                <div class="col-auto fs-12">
                                                    <p class="mb-0 small">Balance</p>
                                                    <p>12541</p>
                                                </div>
                                                <div class="col text-end fs-12">
                                                    <p class="mb-0 small">USD Value</p>
                                                    <p>46000</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="row amount-data mb-3">
                                        <div class="col">
                                            <p class="text-secondary small mb-1">Expense</p>
                                            <p>
                                                24.00 <small class="text-danger">3.0% <i class="bi bi-arrow-down"></i></small>
                                            </p>
                                        </div>
                                        <div class="col-auto text-end">
                                            <p class="text-secondary small mb-1">Limit Remain</p>
                                            <p>100.00</p>
                                        </div>
                                    </div>
                                    <div class="row amount-data align-items-center">
                                        <div class="col">
                                            <p class="opacity-75 small mb-1">This month</p>
                                            <p>14.0 <small>ETC</small></p>
                                        </div>
                                        <div class="col-auto avatar-group">
                                            <figure class="avatar avatar-30 rounded-circle coverimg overlay-ms-5" data-bs-toggle="tooltip" data-bs-placement="top" title="Preview Purpose">
                                                <img src="assets/img/modern-ai-image/company7.jpg" alt="" />
                                            </figure>
                                            <figure class="avatar avatar-30 rounded-circle coverimg overlay-ms-5" data-bs-toggle="tooltip" data-bs-placement="top" title="Maria Smith">
                                                <img src="assets/img/modern-ai-image/user-3.jpg" alt="" />
                                            </figure>
                                            <figure class="avatar avatar-30 rounded-circle coverimg overlay-ms-5" data-bs-toggle="tooltip" data-bs-placement="top" title="Steve Branden">
                                                <img src="assets/img/modern-ai-image/user-4.jpg" alt="" />
                                            </figure>
                                        </div>
                                    </div>
                                </swiper-slide>
                                <swiper-slide class="width-240">
                                    <div class="card adminuiux-card mb-2 bg-r-gradient theme-orange overflow-hidden">
                                        <div class="card-body position-relative z-index-1">
                                            <div class="row gx-3 align-items-center mb-3">
                                                <div class="col-auto align-self-center">
                                                    <figure class="avatar avatar-30 rounded-circle coverimg">
                                                        <img src="assets/img/modern-ai-image/company8.jpg" alt="" />
                                                    </figure>
                                                </div>
                                                <div class="col text-end">
                                                    <p class="fs-12">
                                                        <span class="opacity-75 small">Shiba Inu</span><br />
                                                        <span class="">SHIB</span>
                                                    </p>
                                                </div>
                                            </div>
                                            <p class="fw-medium h6 mb-3">XXX-DXXX000000146598</p>
                                            <div class="row gx-3 gx-lg-4">
                                                <div class="col-auto fs-12">
                                                    <p class="mb-0 opacity-50 small">Balance</p>
                                                    <p>113258k</p>
                                                </div>
                                                <div class="col text-end fs-12">
                                                    <p class="mb-0  opacity-50 small">USD Value</p>
                                                    <p>4352</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="row amount-data mb-3">
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
                                    <div class="row amount-data align-items-center">
                                        <div class="col">
                                            <p class="opacity-75 small mb-1">This month</p>
                                            <p>12000.00 <small>SHIB</small></p>
                                        </div>
                                        <div class="col-auto avatar-group">
                                            <figure class="avatar avatar-30 rounded-circle coverimg overlay-ms-5" data-bs-toggle="tooltip" data-bs-placement="top" title="Shelvey Doe">
                                                <img src="assets/img/modern-ai-image/user-2.jpg" alt="" />
                                            </figure>
                                            <figure class="avatar avatar-30 rounded-circle coverimg overlay-ms-5" data-bs-toggle="tooltip" data-bs-placement="top" title="Maria Smith">
                                                <img src="assets/img/modern-ai-image/user-3.jpg" alt="" />
                                            </figure>
                                            <figure class="avatar avatar-30 rounded-circle coverimg overlay-ms-5" data-bs-toggle="tooltip" data-bs-placement="top" title="Steve Branden">
                                                <img src="assets/img/modern-ai-image/user-4.jpg" alt="" />
                                            </figure>
                                        </div>
                                    </div>
                                </swiper-slide>
                            </swiper-container>
                        </div>
                    </div>
                </div>
            </div>

            <div class="row gx-3 gx-lg-4 mb-3 mb-lg-4">
                <div class="col text-center py-3">
                    <h4>More & More <span class="text-gradient">Personalize</span> like a part of life</h4>
                    <p class="text-secondary">Time & Trend never stops for anyone. So lets accept the change & make these your own.</p>
                </div>
            </div>

            <div class="row gx-3 gx-lg-4">
                <!-- summary blog -->
                <div class="col-12 col-lg-12 col-xl-12 col-xxl-3">
                    <div class="row gx-3 gx-lg-4">
                        <div class="col-12 col-md-6 col-lg-6 col-xl-4 col-xxl-12">
                            <div class="card adminuiux-card mb-3 mb-lg-4">
                                <div class="card-body">
                                    <div class="row gx-3 gx-lg-4 align-items-center">
                                        <div class="col-auto">
                                            <div class="avatar avatar-60 rounded-circle">
                                                <app-circle-progress-blue-blank class="avatar avatar-60 rounded-circle"></app-circle-progress-blue-blank>
                                                <div class="avatar avatar-40 h5 bg-theme-1-subtle text-theme-1 rounded-circle position-absolute start-50 top-50 translate-middle">
                                                    <i class="bi bi-receipt"></i>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="col">
                                            <p class="text-secondary small mb-1">Total Bills</p>
                                            <h5>25.486k <small>USD</small></h5>
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
                        <div class="col-12 col-md-6 col-lg-6 col-xl-4 col-xxl-12">
                            <div class="card adminuiux-card mb-3 mb-lg-4">
                                <div class="card-body">
                                    <div class="row gx-3 gx-lg-4 align-items-center">
                                        <div class="col-auto">
                                            <div class="avatar avatar-60 rounded-circle">
                                                <app-circle-progress-yellow-blank class="avatar avatar-60 rounded-circle"></app-circle-progress-yellow-blank>
                                                <div class="avatar avatar-40 h5 bg-theme-1-subtle text-theme-1 rounded-circle position-absolute start-50 top-50 translate-middle theme-yellow">
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
                        <div class="col-12 col-md-6 col-lg-6 col-xl-4 col-xxl-12">
                            <div class="card adminuiux-card mb-3 mb-lg-4">
                                <div class="card-body">
                                    <div class="row gx-3 align-items-center">
                                        <div class="col-auto">
                                            <div class="avatar avatar-60 rounded-circle">
                                                <app-circle-progress-red-blank class="avatar avatar-60 rounded-circle"></app-circle-progress-red-blank>
                                                <div class="avatar avatar-40 h5 bg-theme-1-subtle text-theme-1 rounded-circle position-absolute start-50 top-50 translate-middle theme-red">
                                                    <i class="bi bi-receipt-cutoff"></i>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="col">
                                            <p class="text-secondary small mb-1">Unpaid Bills</p>
                                            <h5>1525<small>k</small></h5>
                                        </div>
                                        <div class="col-auto avatar-group">
                                            <figure class="avatar avatar-30 rounded-circle coverimg" data-bs-toggle="tooltip" data-bs-placement="top" title="Just Demo">
                                                <img src="assets/img/modern-ai-image/company6.png" alt="" />
                                            </figure>
                                            <figure class="avatar avatar-30 rounded-circle coverimg" data-bs-toggle="tooltip" data-bs-placement="top" title="Preview Purpose">
                                                <img src="assets/img/modern-ai-image/company8.jpg" alt="" />
                                            </figure>
                                            <figure class="avatar avatar-30 rounded-circle coverimg" data-bs-toggle="tooltip" data-bs-placement="top" title="to look real">
                                                <img src="assets/img/modern-ai-image/company9.jpg" alt="" />
                                            </figure>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="col-12 col-md-6 col-lg-6 col-xl-4 col-xxl-12">
                            <div class="card adminuiux-card bg-theme-1 mb-3 mb-lg-4">
                                <div class="card-body">
                                    <div class="row gx-3 align-items-center">
                                        <div class="col-auto">
                                            <div class="avatar avatar-60 rounded-circle">
                                                <app-circle-progress-white-blank class="avatar avatar-60 rounded-circle"></app-circle-progress-white-blank>
                                                <div class="avatar avatar-40 h5 bg-white-opacity text-white rounded-circle position-absolute start-50 top-50 translate-middle">
                                                    <i class="bi bi-envelope-check"></i>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="col">
                                            <p class="opacity-75 small mb-1">Sent Money</p>
                                            <h5>1545 <small>k USD</small></h5>
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
                </div>

                <!-- Buy sell convert -->
                <div class="col-12 col-md-6 col-lg-6 col-xxl-3">
                    <div class="card adminuiux-card mb-3 mb-lg-4">
                        <div class="card-header">
                            <div class="row gx-3 align-items-center mb-3">
                                <div class="col-auto">
                                    <i class="bi bi-newspaper h5 me-1 avatar avatar-40 bg-theme-1-subtle text-theme-1 rounded"></i>
                                </div>
                                <div class="col">
                                    <h6 class="mb-0">Trendingline</h6>
                                    <p class="text-secondary small">Crypto news</p>
                                </div>
                            </div>
                            <div class="row gx-3 gx-lg-4">
                                <div class="col align-self-center">
                                    <ul class="nav nav-pills" id="buysellconvert" role="tablist">
                                        <li class="nav-item" role="presentation">
                                            <button class="nav-link active" id="buy-tab" data-bs-toggle="tab" data-bs-target="#buy" type="button" role="tab" aria-controls="buy" aria-selected="true">Buy</button>
                                        </li>
                                        <li class="nav-item" role="presentation">
                                            <button class="nav-link" id="sell-tab" data-bs-toggle="tab" data-bs-target="#sell" type="button" role="tab" aria-controls="sell" aria-selected="false">Sell</button>
                                        </li>
                                        <li class="nav-item" role="presentation">
                                            <button class="nav-link" id="convert-tab" data-bs-toggle="tab" data-bs-target="#convert" type="button" role="tab" aria-controls="convert" aria-selected="false">Convert</button>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                        <div class="card-body">
                            <div class="tab-content" id="nav-buysellconvert">
                                <div class="tab-pane fade show active" id="buy" role="tabpanel" aria-labelledby="buy-tab">
                                    <div class="input-group input-group-md rounded mb-3">
                                        <span class="input-group-text text-theme-1"><i class="bi bi-coin"></i></span>
                                        <select class="form-select">
                                            <option>LTC - Litecoin</option>
                                            <option>BTC - Bitcoin</option>
                                            <option>ETH - Ethereum</option>
                                            <option selected="">DOGE - Doge Coin</option>
                                            <option>SHIB Shiba Inu</option>
                                        </select>
                                    </div>
                                    <input class="form-control form-control-lg fw-bold fs-2 text-center mb-2" type="text" placeholder="00" value="5000" />
                                    <div class="row small mb-3">
                                        <div class="col">1:5.26</div>
                                        <div class="col-auto">5000 USD: <span class="text-theme-1">26306.97 DOGE</span></div>
                                    </div>
                                    <p class="text-secondary small text-center">The final amount will be change according to market status and conditions.</p>
                                    <div class="row mt-4">
                                        <div class="col"><button class="btn btn-outline-secondary border">Reset</button></div>
                                        <div class="col-auto">
                                            <button class="btn btn-theme mnw-100">Buy</button>
                                        </div>
                                    </div>
                                </div>
                                <div class="tab-pane fade" id="sell" role="tabpanel" aria-labelledby="sell-tab">
                                    <div class="input-group input-group-md rounded mb-3">
                                        <span class="input-group-text text-theme-1"><i class="bi bi-coin"></i></span>
                                        <select class="form-select">
                                            <option>LTC - Litecoin</option>
                                            <option>BTC - Bitcoin</option>
                                            <option>ETH - Ethereum</option>
                                            <option selected="">DOGE - Doge Coin</option>
                                            <option>SHIB Shiba Inu</option>
                                        </select>
                                    </div>
                                    <input class="form-control form-control-lg fw-bold fs-2 text-center mb-2" type="text" placeholder="00" value="20" />
                                    <div class="row small mb-2">
                                        <div class="col">1:0.19</div>
                                        <div class="col-auto">20 DOGE: <span class="text-theme-1">3.80 USD</span></div>
                                    </div>
                                    <p class="text-secondary small text-center">The final amount will be change according to market status and conditions.</p>
                                    <div class="row mt-4">
                                        <div class="col"><button class="btn btn-outline-secondary border">Reset</button></div>
                                        <div class="col-auto">
                                            <button class="btn btn-theme mnw-100">Sell</button>
                                        </div>
                                    </div>
                                </div>
                                <div class="tab-pane fade" id="convert" role="tabpanel" aria-labelledby="convert-tab">
                                    <input class="form-control form-control-lg fw-bold fs-2 text-center mb-3" type="text" placeholder="00" value="5000" />
                                    <div class="mb-1">
                                        <div class="input-group rounded position-relative">
                                            <select class="form-select">
                                                <option>LTC - Litecoin</option>
                                                <option>BTC - Bitcoin</option>
                                                <option>ETH - Ethereum</option>
                                                <option selected="">DOGE - Doge Coin</option>
                                                <option>SHIB Shiba Inu</option>
                                            </select>
                                        </div>
                                        <div class="text-center">
                                            <div class="text-theme"><i class="bi bi-arrow-down-up"></i></div>
                                        </div>
                                        <div class="input-group rounded position-relative">
                                            <select class="form-select">
                                                <option>LTC - Litecoin</option>
                                                <option>BTC - Bitcoin</option>
                                                <option>ETH - Ethereum</option>
                                                <option>DOGE - Doge Coin</option>
                                                <option selected>SHIB Shiba Inu</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div class="row small mb-2">
                                        <div class="col-12">5000 DOGE: <span class="text-theme-1"> 25,579,482.010000 SHIB</span></div>
                                    </div>
                                    <div class="row mt-4">
                                        <div class="col"><button class="btn btn-outline-secondary border">Reset</button></div>
                                        <div class="col-auto">
                                            <button class="btn btn-theme mnw-100">Buy</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- news blog -->
                <div class="col-12 col-md-6 col-lg-6 col-xl-6 col-xxl-3 mb-4 ">
                    <div class="card adminuiux-card bg-theme-r-gradient text-white theme-green">
                        <div class="card-header">
                            <div class="row gx-3 align-items-center">
                                <div class="col-auto">
                                    <i class="bi bi-newspaper h5 me-1 avatar avatar-40 bg-white-opacity text-white rounded me-2"></i>
                                </div>
                                <div class="col">
                                    <h6 class="mb-0">Trendingline</h6>
                                    <p class="text-secondary small">Crypto news</p>
                                </div>
                                <div class="col-auto"></div>
                            </div>
                        </div>
                        <div class="coverimg w-100 height-200 position-relative">
                            <div class="position-absolute bottom-0 start-0 w-100 mb-3 px-3 z-index-1">
                                <div class="row gx-3 gx-lg-4">
                                    <div class="col">
                                        <button class="btn btn-sm btn-theme btn-rounded">Share this</button>
                                    </div>
                                    <div class="col-auto">
                                        <div class="dropup d-inline-block">
                                            <a class="btn btn-square btn-sm rounded-circle btn-theme no-caret" data-bs-toggle="dropdown" aria-expanded="false" data-bs-display="static" role="button">
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
                            <img src="assets/img/modern-ai-image/user-1-kid.jpg" class="mw-100" alt="" />
                        </div>
                        <div class="card-body">
                            <h5 class="mb-1 text-truncated">Bitcoin at record high all level crossed</h5>
                            <p class="text-secondary small">We have added useful, widgets, flexible. If you still reading this, you are in love with this design.</p>
                            <a routerLink="/app/blogs" class="btn btn-link text-white">Read more</a>
                        </div>
                    </div>
                </div>

                <!-- Support -->
                <div class="col-12 col-md-12 col-lg-6 col-xxl-3">
                    <div class="card adminuiux-card mb-3 mb-lg-4">
                        <div class="card-header pb-0">
                            <div class="row align-items-center mb-2">
                                <div class="col-auto d-block d-lg-none">
                                    <button class="btn btn-link btn-square innersidebar-btn" onclick="innersidebar()"><i class="bi bi-layout-sidebar h5 align-middle"></i></button>
                                </div>
                                <div class="col">
                                    <div class="row gx-2 align-items-center">
                                        <div class="col-auto">
                                            <figure class="avatar avatar-40 coverimg rounded-circle">
                                                <img src="assets/img/logo-pika.png" alt="" />
                                            </figure>
                                        </div>
                                        <div class="col align-self-center">
                                            <h6 class="mb-0">
                                                <span class="position-relative"
                                                    >Admin Support <span class="position-absolute top-50 start-100 translate-middle p-1 bg-success rounded-circle mx-2"><span class="visually-hidden">New alerts</span></span></span
                                                >
                                            </h6>
                                            <p class="text-secondary small">We are with you</p>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-auto">
                                    <button class="btn btn-link btn-square" data-bs-toggle="collapse" data-bs-target="#searchchat" aria-expanded="false" aria-controls="searchchat">
                                        <i class="bi bi-search"></i>
                                    </button>

                                    <div class="dropdown d-inline-block">
                                        <button class="btn btn-square btn-link caret-none" type="button" id="statuschat2" data-bs-toggle="dropdown" data-bs-auto-close="true" aria-expanded="false">
                                            <i class="bi bi-three-dots-vertical"></i>
                                        </button>
                                        <ul class="dropdown-menu dropdown-menu-end" aria-labelledby="statuschat2" style="">
                                            <li><a class="dropdown-item" href="javascript:void(0)">Clear Chat</a></li>
                                            <li><a class="dropdown-item" href="javascript:void(0)">Delete</a></li>
                                            <li><a class="dropdown-item theme-red" href="javascript:void(0)">Report</a></li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                            <div class="collapse" id="searchchat">
                                <div class="d-block pb-3">
                                    <input type="search" class="form-control d-block" placeholder="Search in chat... " value="" />
                                </div>
                            </div>
                        </div>
                        <div class="card-body overflow-y-auto chat-list height-dynamic" style="--h-dynamic: 316px">
                            <div class="row no-margin left-chat">
                                <div class="col-12">
                                    <div class="chat-block">
                                        <div class="row gx-3 gx-lg-4">
                                            <div class="col">
                                                <p class="small mb-2"><a href="" class="style-none">Alex Smith</a></p>
                                                <p>Hi!</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-12">
                                    <p class="text-secondary small time"><i class="bi bi-check"></i> 9:00 pm</p>
                                </div>
                            </div>
                            <div class="row no-margin right-chat">
                                <div class="col-12">
                                    <div class="chat-block">
                                        <div class="row gx-3 gx-lg-4">
                                            <div class="col">Hi!<br />Yes please tell us your query.</div>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-12 text-end">
                                    <p class="text-secondary small time"><i class="bi bi-check"></i> 9:10 pm</p>
                                </div>
                            </div>
                            <div class="row justify-content-center text-center">
                                <div class="col-auto text-center">
                                    <div class="alert alert-light mx-auto small px-2 py-0 mb-3">26 November 2025</div>
                                </div>
                            </div>
                            <div class="row no-margin left-chat">
                                <div class="col-12">
                                    <div class="chat-block">
                                        <div class="row gx-3 gx-lg-4">
                                            <div class="col">
                                                <p class="small mb-2"><a href="" class="style-none">Mr. Jack Mario</a></p>
                                                Adminuiux is amazing and we thank you. How can we buy?
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-12">
                                    <p class="text-secondary small time"><i class="bi bi-check-all text-primary"></i> 8:00 pm</p>
                                </div>
                            </div>
                            <div class="row no-margin right-chat first">
                                <div class="col-12">
                                    <div class="chat-block">
                                        <div class="row gx-3 gx-lg-4">
                                            <div class="col">
                                                <div class="position-relative mb-0 d-block">
                                                    <div class="position-absolute end-0 top-0">
                                                        <button class="btn btn-square btn-theme m-2"><i class="bi bi-download"></i></button>
                                                    </div>
                                                    <img src="assets/img/modern-ai-image/tree-2.jpg" alt="" class="mw-100" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="row no-margin right-chat">
                                <div class="col-12">
                                    <div class="chat-block">
                                        <div class="row gx-3 gx-lg-4">
                                            <div class="col">Thank you too. You can buy it from preview page and click on buy now.</div>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-12 text-end">
                                    <p class="text-secondary small time"><i class="bi bi-check-all text-primary"></i> 8:00 pm</p>
                                </div>
                            </div>
                            <div class="row justify-content-center text-center">
                                <div class="col-auto text-center">
                                    <div class="alert alert-light mx-auto small px-2 py-0 mb-3">27 November 2024</div>
                                </div>
                            </div>
                            <div class="row no-margin left-chat first">
                                <div class="col-12">
                                    <div class="chat-block">
                                        <div class="row gx-3 gx-lg-4">
                                            <div class="col">
                                                <p class="small mb-2"><a href="" class="style-none">Ms. Jully CTO</a></p>
                                                <div class="position-relative figure"><video src="https://adminuiux.com/adminuiux/adminuiux.mp4" controls="" preload="none"></video></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="row no-margin left-chat">
                                <div class="col-12">
                                    <div class="chat-block">
                                        <div class="row gx-3 gx-lg-4">
                                            <div class="col">We also love this small presentation.</div>
                                        </div>
                                    </div>
                                    <div class="col-12">
                                        <p class="text-secondary small time"><i class="bi bi-check-all text-primary"></i> 8:00 pm</p>
                                    </div>
                                </div>
                            </div>
                            <div class="row no-margin right-chat">
                                <div class="col-12">
                                    <div class="chat-block">
                                        <div class="row gx-3 gx-lg-4">
                                            <div class="col">
                                                <p>Ohh... Thats great. Adminuiux is HTML template can be used in various business domains like SAAS, CRM, Content Management, Manufacturing, inventory, IT, administration etc.</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-12 text-end">
                                    <p class="text-secondary small time"><i class="bi bi-check-all text-primary"></i> 8:00 pm</p>
                                </div>
                            </div>
                        </div>
                        <div class="card-footer bg-none border-top">
                            <div class="input-group">
                                <button class="btn btn-square btn-link border"><i class="bi bi-emoji-smile"></i></button>
                                <button class="btn btn-square btn-link border"><i class="bi bi-paperclip"></i></button>
                                <input class="form-control bg-none" placeholder="Type your message... " value="" />
                                <button class="btn btn-square btn-link border" type="button"><i class="bi bi-send"></i></button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="row gx-3 gx-lg-4">
                <!-- Transactions -->
                <div class="col-12 col-md-12">
                    <div class="card adminuiux-card mb-3 mb-lg-4">
                        <div class="card-header">
                            <div class="row gx-3 gx-lg-4">
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
                                        <th class="tablet">Amount</th>
                                        <th class="desktop">Category</th>
                                        <th class="tablet desktop">Status</th>
                                        <th class="desktop">Deliver to</th>
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
                                            <p class="mb-0">0.0365</p>
                                            <p class="text-secondary small">XRP</p>
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
                                            <p class="mb-0">0.0365</p>
                                            <p class="text-secondary small">XRP</p>
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
                                            <p class="mb-0">0.00252</p>
                                            <p class="text-secondary small">XMR</p>
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
                                            <p class="mb-0">0.00252</p>
                                            <p class="text-secondary small">DOGE</p>
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
                                            <p class="mb-0">0.00146</p>
                                            <p class="text-secondary small">XRP</p>
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
                                            <p class="mb-0">0.000152</p>
                                            <p class="text-secondary small">XRP</p>
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
                                            <p class="mb-0">0.000152</p>
                                            <p class="text-secondary small">XRP</p>
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
                                            <p class="mb-0">0.00146</p>
                                            <p class="text-secondary small">XRP</p>
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
export class FinanceCryptoComponent {
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

