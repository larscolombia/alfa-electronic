import { Component, OnInit, AfterViewInit, AfterContentChecked, OnDestroy, ViewChild, ElementRef, CUSTOM_ELEMENTS_SCHEMA } from "@angular/core";
import { RouterLink } from "@angular/router";
import Choices, { ClassNames } from "choices.js";
import Swiper from "swiper";
import { register } from "swiper/element/bundle";
register();
import DataTable from "datatables.net-dt";
import "datatables.net-responsive-dt";

import { DaterangePickerRangesComponent } from "../../../components/input-fields/daterange-picker/daterange-picker-ranges.component";
import { WalletBannerChartComponent } from "../../../components/charts/wallet-banner-chart.component";
import { CircleProgressBlueComponent } from "../../../components/charts/circle-progress-blue.component";
import { CircleProgressRedComponent } from "../../../components/charts/circle-progress-red.component";
import { CircleProgressYellowComponent } from "../../../components/charts/circle-progress-yellow.component";
import { CircleProgressGreenComponent } from "../../../components/charts/circle-progress-green.component";
import { AreaGreenChartjs60Component } from "../../../components/charts/area-green-chartjs-60.component";
import { AreaYellowChartjs60Component } from "../../../components/charts/area-yellow-chartjs-60.component";
import { ArearedChartjs60Component } from "../../../components/charts/area-red-chartjs-60.component";
import { BarBlueChartjs100Component } from "../../../components/charts/bar-blue-chartjs-100.component";
import { SemiDoughnutChartjs180Component } from "../../../components/charts/semi-doughnut-chartjs-180.component";
import { CircleProgressBlueBlankComponent } from "../../../components/charts/circle-progress-blue-blank.component";
import { CircleProgressRedBlankComponent } from "../../../components/charts/circle-progress-red-blank.component";
import { CircleProgressYellowBlankComponent } from "../../../components/charts/circle-progress-yellow-blank.component";
import { CircleProgressWhiteBlankComponent } from "../../../components/charts/circle-progress-white-blank.component";

@Component({
    selector: "app-finance-wallet",
    standalone: true,
    imports: [RouterLink, DaterangePickerRangesComponent, WalletBannerChartComponent, CircleProgressBlueComponent, CircleProgressRedComponent, CircleProgressYellowComponent, CircleProgressGreenComponent, AreaGreenChartjs60Component, AreaYellowChartjs60Component, ArearedChartjs60Component, BarBlueChartjs100Component, SemiDoughnutChartjs180Component, CircleProgressBlueBlankComponent, CircleProgressRedBlankComponent, CircleProgressYellowBlankComponent, CircleProgressWhiteBlankComponent],
    template: `
        <!-- page title -->
        <div class="container-fluid py-3">
            <div class="row gx-3 gx-lg-4 align-items-center page-title">
                <div class="col col-sm mb-3 mb-sm-0 order-1">
                    <h5 class="mb-0">Wallet Dashboard</h5>
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
                    <li class="breadcrumb-item bi active" aria-current="page">Wallet</li>
                </ol>
            </nav>
        </div>

        <!-- content -->
        <div class="container mt-3" id="main-content">
            <div class="row gx-3 gx-lg-4 align-items-center">
                <div class="col-12 col-md-auto text-center text-md-start mb-3 mb-lg-4">
                    <figure class="avatar avatar-100 rounded-circle coverimg">
                        <img src="assets/img/modern-ai-image/user-6.jpg" alt="" />
                    </figure>
                </div>
                <!-- welcome message -->
                <div class="col-12 col-md text-center text-md-start mb-3 mb-lg-4">
                    <h1 class="mb-0">AdminUIUX</h1>
                    <p class="text-secondary">New York, United States</p>
                </div>

                <!-- Balance -->
                <div class="col-12 col-md-auto ms-auto text-center text-md-end mb-3 mb-lg-4">
                    <div class="row gx-2 justify-content-center mb-2">
                        <div class="col d-none d-md-block"></div>
                        <div class="col-auto py-2">
                            <a class="btn btn-lg btn-square btn-outline-theme" data-bs-toggle="modal" data-bs-target="#qrcodemodal" title="Scan to pay"><i class="bi bi-qr-code"></i></a>
                        </div>
                        <div class="col-auto py-2">
                            <a class="btn btn-lg btn-square btn-outline-theme" data-bs-toggle="modal" data-bs-target="#sendmoneymodal" title="Send Money"><i class="bi bi-arrow-up-right"></i></a>
                        </div>
                        <div class="col-auto py-2">
                            <a class="btn btn-lg btn-square btn-outline-theme" data-bs-toggle="modal" data-bs-target="#receivemoneymodal" title="Receive Money"><i class="bi bi-arrow-down-left"></i></a>
                        </div>
                        <div class="col-auto py-2">
                            <a class="btn btn-lg btn-square btn-outline-theme" data-bs-toggle="modal" data-bs-target="#addmoneymodal" title="Add Money"><i class="bi bi-plus-lg"></i></a>
                        </div>
                    </div>
                    <h1 class="text-gradient mb-0">2562460.00 <small>USD</small></h1>
                    <p class="text-secondary">Wallet Balance</p>
                </div>
            </div>
        </div>
        <div class="container-fluid position-relative overflow-hidden mb-3">
            <div class="row gx-3 gx-lg-4">
                <div class="col-12 px-0">
                    <app-wallet-banner-chart class="height-250 d-block" id="areachartblue1"></app-wallet-banner-chart>
                </div>
            </div>
        </div>
        <div class="container">
            <div class="row gx-3 gx-lg-4 mb-4 justify-content-center">
                <!--current holding -->
                <div class="col-auto align-self-center">
                    <swiper-container slides-per-view="auto" space-between="16" autoplay="true" class="swiper swipernav">
                        <swiper-slide class="pb-1 width-250">
                            <div class="card adminuiux-card shadow-sm">
                                <div class="card-body">
                                    <div class="row gx-3 align-items-center">
                                        <div class="col-auto">
                                            <div class="avatar avatar-60 rounded bg-theme-1-subtle text-theme-1">
                                                <i class="bi bi-arrow-down-left h5"></i>
                                            </div>
                                        </div>
                                        <div class="col">
                                            <p class="text-secondary small mb-1">Wallet Income</p>
                                            <h4 class="text-dark mb-0"><span>52000</span> <small class="h6">USD</small></h4>
                                            <p class="small">
                                                36.00 <span class="text-theme-1 theme-green"><i class="bi bi-arrow-up fs-12"></i>3.15%</span>
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </swiper-slide>
                        <swiper-slide class="pb-1 width-250">
                            <div class="card adminuiux-card shadow-sm">
                                <div class="card-body">
                                    <div class="row gx-3 align-items-center">
                                        <div class="col-auto">
                                            <div class="avatar avatar-60 rounded bg-theme-1-subtle text-theme-1 theme-red">
                                                <i class="bi bi-arrow-up-right h4"></i>
                                            </div>
                                        </div>
                                        <div class="col">
                                            <p class="text-secondary small mb-1">Shopping</p>
                                            <h4 class="text-dark mb-0"><span>35135</span> <small class="h6">USD</small></h4>
                                            <p class="small">
                                                15.00 <span class="text-theme-1 theme-red"><i class="bi bi-arrow-up fs-12"></i>-4.50%</span>
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </swiper-slide>
                        <swiper-slide class="pb-1 width-250">
                            <div class="card adminuiux-card shadow-sm">
                                <div class="card-body">
                                    <div class="row gx-3 align-items-center">
                                        <div class="col-auto">
                                            <div class="avatar avatar-60 rounded bg-theme-1-subtle text-theme-1 theme-green">
                                                <i class="bi bi-arrow-down-up h4"></i>
                                            </div>
                                        </div>
                                        <div class="col">
                                            <p class="text-secondary small mb-1">Money Transfer</p>
                                            <h4 class="text-dark mb-0"><span>12500</span> <small class="h6">USD</small></h4>
                                            <p class="small">
                                                350.00 <span class="text-theme-1 theme-green"><i class="bi bi-arrow-up fs-12"></i>1.85%</span>
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </swiper-slide>
                        <div class="swiper-pagination"></div>
                    </swiper-container>
                </div>
            </div>
        </div>

        <!-- content -->
        <div class="container">
            <!-- actions bar-->
            <div class="row gx-3 gx-lg-4">
                <!-- send money  -->
                <div class="col-12 col-md-6 col-xxl-3">
                    <div class="card adminuiux-card bg-l-gradient-light mb-3 mb-lg-4 theme-blue">
                        <div class="card-header ">
                            <div class="row gx-3 align-items-center">
                                <div class="col-auto">
                                    <div class="avatar avatar-40 rounded bg-theme-1-subtle text-theme-1">
                                        <i class="bi bi-send h5"></i>
                                    </div>
                                </div>
                                <div class="col">
                                    <h6 class="mb-0">Send Money</h6>
                                    <p class="small text-secondary">Across the platform</p>
                                </div>
                                <div class="col-auto"></div>
                            </div>
                        </div>
                        <div class="card-body">
                            <div class="row gx-3">
                                <div class="col text-center">
                                    <a class="card adminuiux-card style-none" data-bs-toggle="modal" data-bs-target="#sendmoneymodal">
                                        <div class="card-body px-2">
                                            <i class="bi bi-phone h5 avatar avatar-40 rounded text-theme-1 mb-2"></i>
                                            <p class="text-secondary small">Phone</p>
                                        </div>
                                    </a>
                                </div>
                                <div class="col text-center">
                                    <a class="card adminuiux-card style-none" data-bs-toggle="modal" data-bs-target="#sendmoneymodal">
                                        <div class="card-body px-2">
                                            <i class="bi bi-bank h5 avatar avatar-40 rounded text-theme-1 mb-2"></i>

                                            <p class="text-secondary small">Account</p>
                                        </div>
                                    </a>
                                </div>
                                <div class="col text-center">
                                    <a class="card adminuiux-card style-none" data-bs-toggle="modal" data-bs-target="#sendmoneymodal">
                                        <div class="card-body px-2">
                                            <i class="bi bi-at h4 avatar avatar-40 rounded text-theme-1 mb-2"></i>
                                            <p class="text-secondary small">UPI</p>
                                        </div>
                                    </a>
                                </div>
                            </div>
                        </div>
                        <div class="card-footer">
                            <div class="row gx-3 align-items-center">
                                <div class="col-auto">
                                    <app-circle-progress-blue class="avatar avatar-60 rounded-circle"></app-circle-progress-blue>
                                </div>
                                <div class="col">
                                    <h5 class="mb-0">1350 <small class="h6">USD</small></h5>
                                    <p class="small text-secondary">
                                        36.00 <span class="text-theme-1 theme-green"><i class="bi bi-arrow-up fs-12"></i>3.15%</span> spent
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <!-- Pay bills -->
                <div class="col-12 col-md-6 col-xxl-3">
                    <div class="card adminuiux-card bg-l-gradient-light mb-3 mb-lg-4 theme-green">
                        <div class="card-header">
                            <div class="row gx-3 align-items-center">
                                <div class="col-auto">
                                    <div class="avatar avatar-40 rounded bg-theme-1-subtle text-theme-1">
                                        <i class="bi bi-receipt-cutoff h5"></i>
                                    </div>
                                </div>
                                <div class="col">
                                    <h6 class="mb-0">Pay Bills</h6>
                                    <p class="small text-secondary">House Holds</p>
                                </div>
                                <div class="col-auto"></div>
                            </div>
                        </div>
                        <div class="card-body">
                            <div class="row gx-3">
                                <div class="col-4 text-center">
                                    <a class="card adminuiux-card style-none" data-bs-toggle="modal" data-bs-target="#addmoneymodal">
                                        <div class="card-body px-2">
                                            <i class="bi bi-lamp h4 avatar avatar-40 rounded text-theme-1 mb-2"></i>
                                            <p class="text-secondary small text-truncated">Electricity</p>
                                        </div>
                                    </a>
                                </div>
                                <div class="col-4 text-center">
                                    <a class="card adminuiux-card style-none" data-bs-toggle="modal" data-bs-target="#addmoneymodal">
                                        <div class="card-body px-2">
                                            <i class="bi bi-router h4 avatar avatar-40 rounded text-theme-1 mb-2"></i>
                                            <p class="text-secondary small text-truncated">Internet</p>
                                        </div>
                                    </a>
                                </div>
                                <div class="col-4 text-center">
                                    <a class="card adminuiux-card style-none" data-bs-toggle="modal" data-bs-target="#addmoneymodal">
                                        <div class="card-body px-2">
                                            <i class="bi bi-droplet-half h4 avatar avatar-40 rounded text-theme-1 mb-2"></i>
                                            <p class="text-secondary small">Water</p>
                                        </div>
                                    </a>
                                </div>
                            </div>
                        </div>
                        <div class="card-footer">
                            <div class="row gx-3 align-items-center">
                                <div class="col-auto">
                                    <app-circle-progress-green class="avatar avatar-60 rounded-circle"></app-circle-progress-green>
                                </div>
                                <div class="col">
                                    <h5 class="mb-0">15282 <small class="h6">USD</small></h5>
                                    <p class="small">
                                        126.00 <span class="text-theme-1 theme-green"><i class="bi bi-arrow-up fs-12"></i>3.15%</span>
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <!-- Book ticket -->
                <div class="col-12 col-md-6 col-xxl-3">
                    <div class="card adminuiux-card bg-l-gradient-light mb-3 mb-lg-4 theme-red">
                        <div class="card-header">
                            <div class="row gx-3 align-items-center">
                                <div class="col-auto">
                                    <div class="avatar avatar-40 rounded bg-theme-1-subtle text-theme-1">
                                        <i class="bi bi-ticket-perforated h5"></i>
                                    </div>
                                </div>
                                <div class="col">
                                    <h6 class="mb-0">Book Ticket</h6>
                                    <p class="small text-secondary">Movie, Flight, Train etc.</p>
                                </div>
                                <div class="col-auto"></div>
                            </div>
                        </div>
                        <div class="card-body">
                            <div class="row gx-3">
                                <div class="col text-center">
                                    <a class="card adminuiux-card style-none" data-bs-toggle="modal" data-bs-target="#ticketbookmovie">
                                        <div class="card-body px-2">
                                            <i class="bi bi-film h5 avatar avatar-40 rounded text-theme-1 mb-2"></i>
                                            <p class="text-secondary small">Movie</p>
                                        </div>
                                    </a>
                                </div>
                                <div class="col text-center">
                                    <a class="card adminuiux-card style-none" data-bs-toggle="modal" data-bs-target="#ticketbookmovie">
                                        <div class="card-body px-2">
                                            <i class="bi bi-send h5 avatar avatar-40 rounded text-theme-1 mb-2"></i>
                                            <p class="text-secondary small">Flight</p>
                                        </div>
                                    </a>
                                </div>
                                <div class="col text-center">
                                    <a class="card adminuiux-card style-none" data-bs-toggle="modal" data-bs-target="#ticketbookmovie">
                                        <div class="card-body px-2">
                                            <i class="bi bi-truck h4 avatar avatar-40 rounded text-theme-1 mb-2"></i>
                                            <p class="text-secondary small">Bus</p>
                                        </div>
                                    </a>
                                </div>
                            </div>
                        </div>
                        <div class="card-footer">
                            <div class="row gx-3 align-items-center">
                                <div class="col-auto">
                                    <app-circle-progress-red class="avatar avatar-60 rounded-circle"></app-circle-progress-red>
                                </div>
                                <div class="col">
                                    <h5 class="mb-0">1960 <small class="h6">USD</small></h5>
                                    <p class="small">
                                        101.00 <span class="text-theme-1 theme-green"><i class="bi bi-arrow-up fs-12"></i>3.05%</span>
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <!-- Pay Premiums -->
                <div class="col-12 col-md-6 col-xxl-3">
                    <div class="card adminuiux-card bg-l-gradient-light mb-3 mb-lg-4 theme-yellow">
                        <div class="card-header">
                            <div class="row gx-3 align-items-center">
                                <div class="col-auto">
                                    <div class="avatar avatar-40 rounded bg-theme-1-subtle text-theme-1">
                                        <i class="bi bi-house-door h5"></i>
                                    </div>
                                </div>
                                <div class="col">
                                    <h6 class="mb-0">Pay Premiums</h6>
                                    <p class="small text-secondary">Health & Life</p>
                                </div>
                                <div class="col-auto"></div>
                            </div>
                        </div>
                        <div class="card-body">
                            <div class="row gx-3">
                                <div class="col text-center">
                                    <a class="card adminuiux-card style-none">
                                        <div class="card-body px-2">
                                            <i class="bi bi-bandaid h5 avatar avatar-40 rounded text-theme-1 mb-2"></i>
                                            <p class="text-secondary small">Health</p>
                                        </div>
                                    </a>
                                </div>
                                <div class="col text-center">
                                    <a class="card adminuiux-card style-none">
                                        <div class="card-body px-2">
                                            <i class="bi bi-house-door h5 avatar avatar-40 rounded text-theme-1 mb-2"></i>

                                            <p class="text-secondary small">Loan</p>
                                        </div>
                                    </a>
                                </div>
                                <div class="col text-center">
                                    <a class="card adminuiux-card style-none">
                                        <div class="card-body px-2">
                                            <i class="bi bi-life-preserver h4 avatar avatar-40 rounded text-theme-1 mb-2"></i>
                                            <p class="text-secondary small">Insurance</p>
                                        </div>
                                    </a>
                                </div>
                            </div>
                        </div>
                        <div class="card-footer">
                            <div class="row gx-3 align-items-center">
                                <div class="col-auto">
                                    <app-circle-progress-yellow class="avatar avatar-60 rounded-circle"></app-circle-progress-yellow>
                                </div>
                                <div class="col">
                                    <h5 class="mb-0">5698 <small class="h6">USD</small></h5>
                                    <p class="small">
                                        141.00 <span class="text-theme-1 theme-green"><i class="bi bi-arrow-up fs-12"></i>4.13%</span>
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- offers and schemes-->
            <div class="row gx-3 gx-lg-4">
                <div class="col-12 col-md-6 col-xl-3 mb-3 mb-lg-4">
                    <div class="card adminuiux-card h-100">
                        <div class="card-body">
                            <h4 class="text-theme-1">Easy to Manage</h4>
                            <h5 class="mb-3">Track your daily transactions</h5>
                            <p>Now make your daily transactions with double security and better tracking.</p>
                        </div>
                        <div class="card-footer">
                            <a href="" class="btn btn-link">Learn more <i class="bi bi-arrow-right"></i></a>
                        </div>
                    </div>
                </div>
                <div class="col-12 col-xl-6 mb-3 order-3 order-xl-2 mb-lg-4">
                    <div class="card adminuiux-card overflow-hidden h-100">
                        <div class="card-body position-relative">
                            <div class="coverimg w-75 h-100 end-0 top-0 position-absolute">
                                <img src=" assets/img/adminux/offer-1.png" class="w-100" alt="" />
                            </div>
                            <div class="row z-index-1">
                                <div class="col-10 col-lg-6">
                                    <h4>Refer & Earn 20%</h4>
                                    <h5 class="mb-3">Make your wallet even bigger</h5>
                                    <p class="text-secondary">Share your referral code to your friends and earn flat 20% amount.</p>
                                </div>
                            </div>
                        </div>
                        <div class="card-footer border-top">
                            <div class="row gx-3 gx-lg-4 align-items-center">
                                <div class="col">
                                    <a href="" class="btn btn-link ">Learn more <i class="bi bi-arrow-right"></i></a>
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
                                <div class="col-auto">
                                    <p class="mb-0">20+ Contacts</p>
                                    <p class="text-secondary small">Already Refereed</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <!-- offers -->
                <div class="col-12 col-md-6 col-xl-3 order-2 order-xl-3">
                    <div class="card adminuiux-card overflow-hidden mb-3 mb-lg-4">
                        <div class="card-body">
                            <div class="row gx-0 mb-3">
                                <div class="col-6 theme-green bg-theme-1 text-center p-3 z-index-1 rounded">
                                    <h3 class="mb-0">6.15<small class="fs-6">%</small></h3>
                                    <p class="opacity-75 small">Business Loan are at cheaper rate</p>
                                </div>
                                <div class="col-6 position-relative">
                                    <figure class="coverimg position-absolute w-100 h-100 start-0 top-0 m-0">
                                        <img src="assets/img/modern-ai-image/tree-5.jpg" class="w-100" alt="" />
                                    </figure>
                                </div>
                            </div>

                            <div class="row gx-3 gx-lg-4 align-items-center">
                                <div class="col">
                                    <h5 class="mb-0">12541M <small class="h6">USD</small></h5>
                                    <p class="text-secondary small">Released & Counting</p>
                                </div>
                                <div class="col-auto">
                                    <button class="btn btn-theme btn-sm">Apply</button>
                                </div>
                            </div>
                        </div>
                        <div class="card-body p-0">
                            <app-area-green-chartjs-60 class="height-70 w-100 mb-2 d-block"></app-area-green-chartjs-60>
                        </div>
                    </div>
                </div>
            </div>

            <div class="row gx-3 gx-lg-4 mb-3 mb-lg-4">
                <div class="col text-center py-3">
                    <h4>A key of <span class="text-gradient">Consistency</span> is to be succeed</h4>
                    <p class="text-secondary">Choose best from different widgets & different colors</p>
                </div>
            </div>

            <div class="row gx-3 gx-lg-4">
                <!--assets value -->
                <div class="col-12 col-md-12 col-lg-6 col-xxl-3 ">
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
                                <div class="col-auto"></div>
                            </div>
                        </div>
                        <div class="card-body p-0">
                            <app-area-yellow-chartjs-60 class="height-70 w-100 mb-2 d-block"></app-area-yellow-chartjs-60>
                        </div>
                    </div>
                    <div class="card adminuiux-card mb-3 mb-lg-4">
                        <div class="card-body">
                            <div class="row gx-3 align-items-center">
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
                            <app-area-red-chartjs-60 class="height-70 w-100 mb-2 d-block"></app-area-red-chartjs-60>
                        </div>
                    </div>
                </div>

                <!-- semiDoughnut Expense Category -->
                <div class="col-12 col-md-12 col-lg-6 col-xxl-3 mb-4 ">
                    <div class="card adminuiux-card shadow-sm">
                        <div class="card-header">
                            <div class="row gx-3 align-items-center">
                                <div class="col-auto">
                                    <i class="bi bi-cart h5 avatar avatar-40 bg-theme-1-subtle text-theme-1 rounded"></i>
                                </div>
                                <div class="col">
                                    <h6 class="mb-0">Average Expenses</h6>
                                    <p class="small text-secondary">Last 3 months</p>
                                </div>
                                <div class="col-auto"></div>
                            </div>
                        </div>
                        <div class="card-body text-center">
                            <div class="height-140 w-100 position-relative mb-2">
                                <div class="position-absolute bottom-0 mx-auto start-50 translate-middle">
                                    <p class="text-secondary small mb-0">Total Expense</p>
                                    <h5>5.4k <small>USD</small></h5>
                                </div>
                                <div height-140 w-100 position-relative mb-2>
                                    <app-semi-doughnut-chartjs-180 id="semidoughnutchart"></app-semi-doughnut-chartjs-180>
                                </div>
                            </div>

                            <p class="text-secondary">You have spend most on Food and Your monthly average expense is</p>
                            <h4><span>5110</span> <small class="lead">USD/month</small></h4>
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
                                <div class="col-auto"></div>
                            </div>
                        </div>
                        <div class="card-body">
                            <div class="w-100 height-100 mb-3">
                                <app-bar-blue-chartjs-100 id="barchart"></app-bar-blue-chartjs-100>
                            </div>
                            <div class="row gx-3">
                                <div class="col-12 px-0">
                                    <ul class="list-group list-group-flush bg-none">
                                        <li class=" list-group-item">
                                            <div class="row gx-3 gx-lg-4 align-items-center">
                                                <div class="col-auto">
                                                    <p class="mb-0">Funds</p>
                                                    <p class="text-secondary small">SIP-16, 25-Fixed</p>
                                                </div>
                                                <div class="col ps-0 text-end">
                                                    <p class=" mb-0">51,070.77 <small>USD</small></p>
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
                                                    <p class="mb-0">4048.24 <small>USD</small></p>
                                                    <p class="small text-secondary">
                                                        1.20 <span class="text-theme-1 theme-green"><i class="bi bi-arrow-up fs-12"></i>0.04%</span>
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
                <div class="col-12 col-md-12 col-lg-6 col-xxl-3 mb-3 mb-lg-4 ">
                    <!-- bank card -->
                    <div class="card adminuiux-card shadow-sm">
                        <div class="card-header">
                            <div class="row gx-3 align-items-center">
                                <div class="col-auto">
                                    <i class="bi bi-cash h5 avatar avatar-40 bg-theme-1-subtle text-theme-1 theme-green rounded"></i>
                                </div>
                                <div class="col">
                                    <h6 class="mb-0">Card Expenses</h6>
                                    <p class="small text-secondary">Recently Used</p>
                                </div>
                                <div class="col-auto"></div>
                            </div>
                        </div>
                        <div class="card-body pt-0 overflow-hidden">
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
                                            <p>
                                                1500.00 <small class="text-success">18.0% <i class="bi bi-arrow-up"></i></small>
                                            </p>
                                        </div>
                                        <div class="col-auto text-end">
                                            <p class="opacity-50 small mb-1">Limit Remain</p>
                                            <p>13500.00</p>
                                        </div>
                                    </div>
                                    <div class="row gx-3 align-items-center small">
                                        <div class="col">
                                            <p>This month</p>
                                        </div>
                                        <div class="col-auto">
                                            <p>4.5 <small>XMR</small></p>
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
                                    <div class="row gx-3 mb-3">
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
                                    <div class="row gx-3 align-items-center small">
                                        <div class="col">
                                            <p>This month</p>
                                        </div>
                                        <div class="col-auto">
                                            <p>4.5 <small>XMR</small></p>
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
                                    <div class="row gx-3 mb-3">
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
                                    <div class="row gx-3 align-items-center small">
                                        <div class="col">
                                            <p>This month</p>
                                        </div>
                                        <div class="col-auto">
                                            <p>4.5 <small>XMR</small></p>
                                        </div>
                                    </div>
                                </swiper-slide>
                            </swiper-container>
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
                                        <app-circle-progress-blue-blank class="avatar avatar-60 rounded-circle"></app-circle-progress-blue-blank>
                                        <div class="avatar avatar-40 h5 bg-theme-1-subtle text-theme-1 rounded-circle position-absolute start-50 top-50 translate-middle">
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
                                        <app-circle-progress-yellow-blank class="avatar avatar-60 rounded-circle"></app-circle-progress-yellow-blank>
                                        <div class="avatar avatar-40 h5 bg-theme-1-subtle text-theme-1 theme-yellow rounded-circle position-absolute start-50 top-50 translate-middle">
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
                                        <app-circle-progress-red-blank class="avatar avatar-60 rounded-circle"></app-circle-progress-red-blank>
                                        <div class="avatar avatar-40 h5 bg-theme-1-subtle text-theme-1 theme-red rounded-circle position-absolute start-50 top-50 translate-middle">
                                            <i class="bi bi-receipt-cutoff"></i>
                                        </div>
                                    </div>
                                </div>
                                <div class="col">
                                    <p class="text-secondary small mb-1">Unpaid Bills</p>
                                    <h5 class="fw-medium">1525<small>k</small></h5>
                                </div>
                                <div class="col-auto avatar-group">
                                    <figure class="avatar avatar-40 rounded-circle coverimg overlay-ms-15" data-bs-toggle="tooltip" data-bs-placement="top" title="Just Demo">
                                        <img src="assets/img/modern-ai-image/company6.png" alt="" />
                                    </figure>
                                    <figure class="avatar avatar-40 rounded-circle coverimg overlay-ms-15" data-bs-toggle="tooltip" data-bs-placement="top" title="Preview Purpose">
                                        <img src="assets/img/modern-ai-image/company8.jpg" alt="" />
                                    </figure>
                                    <figure class="avatar avatar-40 rounded-circle coverimg overlay-ms-15" data-bs-toggle="tooltip" data-bs-placement="top" title="to look real">
                                        <img src="assets/img/modern-ai-image/company9.jpg" alt="" />
                                    </figure>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-12 col-md-6 col-lg-6 col-xl-3 col-xxl-3">
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
                                    <p class="opacity-50 small mb-1">Sent Money</p>
                                    <h5 class="fw-medium">154k <small>USD</small></h5>
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
                <div class="col-12 col-md-12 position-relative ">
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

        <!-- qr code modal -->
        <div class="modal adminuiux-modal fade" id="qrcodemodal" tabindex="-1" aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-body pb-0">
                        <div class="text-center my-4">
                            <div class="avatar avatar-150 mb-4">
                                <img src="assets/img/adminuiux-qr.png" alt="" class="mw-100 mx-auto" />
                            </div>
                            <h5 class="mb-0">Scan QR Code</h5>
                            <p class="text-secondary">To add money in wallet account</p>
                        </div>
                        <div class="row gx-3 gx-lg-4">
                            <div class="col mb-3">
                                <p class="text-secondary">Name</p>
                            </div>
                            <div class="col-auto mb-3">
                                <p class="fw-medium">AdminUIUX</p>
                            </div>
                        </div>
                        <div class="row gx-3 gx-lg-4">
                            <div class="col mb-3">
                                <p class="text-secondary">Virtual ID</p>
                            </div>
                            <div class="col-auto mb-3">
                                <p class="fw-medium">00VFGBADMINUIUX02154869</p>
                            </div>
                        </div>
                        <div class="row gx-3 gx-lg-4">
                            <div class="col mb-3">
                                <p class="text-secondary">Valid Till</p>
                            </div>
                            <div class="col-auto mb-3">
                                <p class="fw-medium">26-09-2026 12:00 am</p>
                            </div>
                        </div>
                        <div class="row gx-3 gx-lg-4">
                            <div class="col mb-3">
                                <p class="text-secondary">Generated on</p>
                            </div>
                            <div class="col-auto mb-3">
                                <p class="fw-medium">12-04-2024 6:25 am <i class="bi bi-arrow-clockwise text-secondary" data-bs-toggle="tooltip" title="Re-generate"></i></p>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer justify-content-center">
                        <button type="button" class="btn btn-link theme-red" data-bs-dismiss="modal">Close</button>
                    </div>
                </div>
            </div>
        </div>

        <!-- send money modal -->
        <div class="modal adminuiux-modal fade" id="sendmoneymodal" tabindex="-1" aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-header">
                        <p class="modal-title h5">Send Money</p>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <div class="form-floating mb-4">
                            <input type="text" class="form-control" id="contact" placeholder="Enter contact..." value="Jonathan" />
                            <label for="contact">Send money to</label>
                        </div>

                        <p class="small text-secondary text-center">Recently connected contacts</p>
                        <!-- recent connection -->
                        <div class="swiper swipernav mb-3">
                            <div class="swiper-wrapper">
                                <div class="swiper-slide w-auto">
                                    <div class="avatar avatar-40 rounded-circle border border-dotted border-theme">
                                        <span class="h4">+</span>
                                    </div>
                                </div>
                                <div class="swiper-slide w-auto">
                                    <div class="avatar avatar-40 rounded-circle coverimg">
                                        <img src="assets/img/modern-ai-image/user-1.jpg" alt="" />
                                    </div>
                                </div>
                                <div class="swiper-slide w-auto">
                                    <div class="avatar avatar-40 rounded-circle coverimg">
                                        <img src="assets/img/modern-ai-image/user-3.jpg" alt="" />
                                    </div>
                                </div>
                                <div class="swiper-slide w-auto">
                                    <div class="avatar avatar-40 rounded-circle coverimg">
                                        <img src="assets/img/modern-ai-image/user-4.jpg" alt="" />
                                    </div>
                                </div>
                                <div class="swiper-slide w-auto">
                                    <div class="avatar avatar-40 rounded-circle coverimg">
                                        <img src="assets/img/modern-ai-image/user-5.jpg" alt="" />
                                    </div>
                                </div>
                                <div class="swiper-slide w-auto">
                                    <div class="avatar avatar-40 rounded-circle coverimg">
                                        <img src="assets/img/modern-ai-image/user-6.jpg" alt="" />
                                    </div>
                                </div>
                                <div class="swiper-slide w-auto">
                                    <div class="avatar avatar-40 rounded-circle coverimg">
                                        <img src="assets/img/modern-ai-image/user-8.jpg" alt="" />
                                    </div>
                                </div>
                                <div class="swiper-slide w-auto">
                                    <div class="avatar avatar-40 rounded-circle coverimg">
                                        <img src="assets/img/modern-ai-image/user-3.jpg" alt="" />
                                    </div>
                                </div>
                                <div class="swiper-slide w-auto">
                                    <div class="avatar avatar-40 rounded-circle coverimg">
                                        <img src="assets/img/modern-ai-image/user-4.jpg" alt="" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <input type="number" class="form-control form-control-lg text-center mb-3" id="ihavei" placeholder="Convert Amount..." value="100.00" />
                        <div class="row gx-3 mb-3">
                            <div class="col">
                                <div class="form-floating mb-1">
                                    <select class="form-select" id="ihavecurrencyi">
                                        <option>USD Wallet</option>
                                        <option>CAD Wallet</option>
                                        <option>AUD Wallet</option>
                                    </select>
                                    <label for="ihavecurrencyi">From...</label>
                                </div>
                                <p class="small text-secondary text-center">1.00 USD</p>
                            </div>
                            <div class="col-auto">
                                <button class="btn btn-square btn-theme mt-2"><i class="bi bi-arrow-left-right"></i></button>
                            </div>
                            <div class="col">
                                <div class="form-floating mb-1">
                                    <select class="form-select" id="ihavecurrency2i">
                                        <option>USD</option>
                                        <option selected="">CAD</option>
                                        <option>AUD</option>
                                    </select>
                                    <label for="ihavecurrency2i">Send in...</label>
                                </div>
                                <p class="small text-secondary text-center">1.38 CAD</p>
                            </div>
                        </div>
                        <div class="text-center">
                            <h5 class="fw-normal"><b class="fw-bold">Great!</b> You are going to send</h5>
                            <h1 class="mb-0 text-theme-1">100.00</h1>
                            <p class="text-secondary small">in Canadian Dollar</p>
                        </div>

                        <div class="alert alert-danger alert-dismissible fade show mt-4" role="alert">
                            <strong><i class="bi bi-exclamation-triangle me-1"></i> Low balance!</strong><br />
                            <small>Your wallet account does not have enough money to send. Kindly add money or choose different wallet account.</small>
                            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
                        </div>
                    </div>
                    <div class="modal-footer justify-content-between">
                        <button class="btn btn-theme">Send Money</button>
                        <button type="button" class="btn btn-link mx-2 theme-red" data-bs-dismiss="modal">Cancel</button>
                    </div>
                </div>
            </div>
        </div>

        <!-- receive money modal -->
        <div class="modal adminuiux-modal fade" id="receivemoneymodal" tabindex="-1" aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-header">
                        <p class="modal-title h5">Receive/Request Money</p>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <div class="form-floating mb-4">
                            <input type="text" class="form-control" id="contact" placeholder="Enter contact..." value="Jonathan" />
                            <label for="contact">Receive money from</label>
                        </div>

                        <p class="small text-secondary text-center">Recently connected contacts</p>
                        <!-- recent connection -->
                        <div class="swiper swipernav mb-4">
                            <div class="swiper-wrapper">
                                <div class="swiper-slide w-auto">
                                    <div class="avatar avatar-40 rounded-circle border border-dotted border-theme">
                                        <span class="h4">+</span>
                                    </div>
                                </div>
                                <div class="swiper-slide w-auto">
                                    <div class="avatar avatar-40 rounded-circle coverimg">
                                        <img src="assets/img/modern-ai-image/user-1.jpg" alt="" />
                                    </div>
                                </div>
                                <div class="swiper-slide w-auto">
                                    <div class="avatar avatar-40 rounded-circle coverimg">
                                        <img src="assets/img/modern-ai-image/user-3.jpg" alt="" />
                                    </div>
                                </div>
                                <div class="swiper-slide w-auto">
                                    <div class="avatar avatar-40 rounded-circle coverimg">
                                        <img src="assets/img/modern-ai-image/user-4.jpg" alt="" />
                                    </div>
                                </div>
                                <div class="swiper-slide w-auto">
                                    <div class="avatar avatar-40 rounded-circle coverimg">
                                        <img src="assets/img/modern-ai-image/user-5.jpg" alt="" />
                                    </div>
                                </div>
                                <div class="swiper-slide w-auto">
                                    <div class="avatar avatar-40 rounded-circle coverimg">
                                        <img src="assets/img/modern-ai-image/user-6.jpg" alt="" />
                                    </div>
                                </div>
                                <div class="swiper-slide w-auto">
                                    <div class="avatar avatar-40 rounded-circle coverimg">
                                        <img src="assets/img/modern-ai-image/user-8.jpg" alt="" />
                                    </div>
                                </div>
                                <div class="swiper-slide w-auto">
                                    <div class="avatar avatar-40 rounded-circle coverimg">
                                        <img src="assets/img/modern-ai-image/user-3.jpg" alt="" />
                                    </div>
                                </div>
                                <div class="swiper-slide w-auto">
                                    <div class="avatar avatar-40 rounded-circle coverimg">
                                        <img src="assets/img/modern-ai-image/user-4.jpg" alt="" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="row gx-3 mb-3">
                            <div class="col">
                                <input type="number" class="form-control form-control-lg" placeholder="Convert Amount..." value="100.00" />
                            </div>
                            <div class="col-auto">
                                <select class="form-select form-select-lg">
                                    <option>USD Wallet</option>
                                    <option selected>CAD Wallet</option>
                                    <option>AUD Wallet</option>
                                </select>
                            </div>
                        </div>
                        <div class="text-center">
                            <h5 class="fw-normal"><b class="fw-bold">Great!</b> You are going to receive</h5>
                            <h1 class="mb-0 text-theme-1">100.00</h1>
                            <p class="text-secondary small">in CAD wallet</p>
                        </div>
                    </div>
                    <div class="modal-footer justify-content-between">
                        <button class="btn btn-theme">Request Money</button>
                        <button type="button" class="btn btn-link mx-2 theme-red" data-bs-dismiss="modal">Cancel</button>
                    </div>
                </div>
            </div>
        </div>

        <!-- add money modal -->
        <div class="modal adminuiux-modal fade" id="addmoneymodal" tabindex="-1" aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-header">
                        <p class="modal-title h5">Add Money</p>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <div class="row gx-3 mb-3">
                            <div class="col">
                                <input type="number" class="form-control form-control-lg text-center" placeholder="Add Amount..." value="100.00" />
                            </div>
                            <div class="col-auto">
                                <select class="form-select form-select-lg">
                                    <option>USD Wallet</option>
                                    <option>CAD Wallet</option>
                                    <option>AUD Wallet</option>
                                </select>
                            </div>
                        </div>
                        <div class="text-center mb-4">
                            <h5 class="fw-normal"><b class="fw-bold">Great!</b> You are going to add</h5>
                            <h1 class="mb-0 text-theme-1">100.00</h1>
                            <p class="text-secondary small">money in CAD Wallet</p>
                        </div>
                        <h6>Add money using</h6>
                        <ul class="list-group adminuiux-list-group">
                            <li class="list-group-item">
                                <input class="form-check-input me-1" type="radio" name="listGroupRadio" value="" id="firstRadio2" checked="" />
                                <label class="form-check-label stretched-link" for="firstRadio2">Net Banking</label>
                            </li>
                            <li class="list-group-item">
                                <input class="form-check-input me-1" type="radio" name="listGroupRadio" value="" id="secondRadio2" />
                                <label class="form-check-label stretched-link" for="secondRadio2">Credit / Debit Card</label>
                            </li>
                            <li class="list-group-item">
                                <input class="form-check-input me-1" type="radio" name="listGroupRadio" value="" id="thirdRadio2" />
                                <label class="form-check-label stretched-link" for="thirdRadio2">UPI Payment</label>
                            </li>
                        </ul>
                    </div>
                    <div class="modal-footer justify-content-between">
                        <button class="btn btn-theme">Pay Now</button>
                        <button type="button" class="btn btn-link mx-2 theme-red" data-bs-dismiss="modal">Cancel</button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Modal Ticket Book -->
        <div class="modal fade" id="ticketbookmovie" tabindex="-1" aria-hidden="true">
            <div class="modal-dialog modal-lg modal-dialog-centered ">
                <div class="modal-content">
                    <div class="modal-header d-block">
                        <div class="row gx-3 align-items-center">
                            <div class="col-auto">
                                <i class="bi bi-ticket-perforated h5 avatar avatar-40 bg-theme-1-subtle text-theme-1 theme-red rounded"></i>
                            </div>
                            <div class="col">
                                <h6 class="mb-0">Book ticket</h6>
                                <p class="small text-secondary">Keep the required fields only</p>
                            </div>
                            <div class="col-auto">
                                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                            </div>
                        </div>
                    </div>

                    <div class="modal-body">
                        <div class="row gx-3 gx-lg-4">
                            <div class="col-12 col-md-6 mb-3 mb-md-0">
                                <!-- Swiper -->
                                <div class="swiper swipernav">
                                    <div class="swiper-wrapper">
                                        <div class="swiper-slide rounded">
                                            <img src="assets/img/modern-ai-image/lion-2.jpg" alt="" class="mw-100 rounded" />
                                        </div>
                                        <div class="swiper-slide rounded">
                                            <img src="assets/img/modern-ai-image/peacoke-3.jpg" alt="" class="mw-100 rounded" />
                                        </div>
                                        <div class="swiper-slide rounded">
                                            <img src="assets/img/modern-ai-image/pet-3.jpg" alt="" class="mw-100 rounded" />
                                        </div>
                                        <div class="swiper-slide rounded">
                                            <img src="assets/img/modern-ai-image/user-3.jpg" alt="" class="mw-100 rounded" />
                                        </div>
                                    </div>
                                </div>
                                <p class="text-opac text-center text-secondary small">Posters are demo purpose only</p>
                                <div class="row gx-3 gx-lg-4">
                                    <div class="col-12 col-md-12 mb-2">
                                        <div class="input-group input-group-md rounded">
                                            <span class="input-group-text text-theme-1"><i class="bi bi-film"></i></span>
                                            <select class="form-select">
                                                <option selected>Transformer</option>
                                                <option>Disney</option>
                                                <option>Marvel</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div class="col-12 col-md-8 mb-2">
                                        <div class="input-group input-group-md rounded">
                                            <span class="input-group-text text-theme-1"><i class="bi bi-calendar-event"></i></span>
                                            <input type="date" class="form-control" />
                                        </div>
                                    </div>
                                    <div class="col-12 col-md-4 mb-2 ps-0">
                                        <div class="input-group input-group-md rounded">
                                            <span class="input-group-text text-theme-1"><i class="bi bi-clock"></i></span>
                                            <select class="form-select">
                                                <option>9:00 am</option>
                                                <option>12:30 pm</option>
                                                <option>3:00 pm</option>
                                                <option selected>9:00 pm</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div class="col-12 col-md-12">
                                        <div class="input-group input-group-md rounded">
                                            <span class="input-group-text text-theme-1"><i class="bi bi-at h5"></i></span>
                                            <input type="email" class="form-control" placeholder="Email address" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="col-12 col-md-6">
                                <div class="d-flex flex-column h-100">
                                    <div class="row gx-2 mb-3 small text-secondary text-center">
                                        <div class="col">
                                            <p class="">This is Screen Side</p>
                                        </div>
                                    </div>
                                    <div class="seatwrap my-auto">
                                        <div class="linerow">
                                            <div class="chair"></div>
                                            <div class="chair"></div>
                                            <div class="chair"></div>
                                            <div class="chair"></div>
                                            <div class="chair"></div>
                                            <div class="chair"></div>
                                            <div class="chair"></div>
                                            <div class="chair"></div>
                                        </div>
                                        <div class="linerow">
                                            <div class="chair"></div>
                                            <div class="chair"></div>
                                            <div class="chair"></div>
                                            <div class="chair occupied"></div>
                                            <div class="chair occupied"></div>
                                            <div class="chair"></div>
                                            <div class="chair"></div>
                                            <div class="chair"></div>
                                        </div>
                                        <div class="linerow">
                                            <div class="chair"></div>
                                            <div class="chair"></div>
                                            <div class="chair"></div>
                                            <div class="chair"></div>
                                            <div class="chair"></div>
                                            <div class="chair"></div>
                                            <div class="chair occupied"></div>
                                            <div class="chair occupied"></div>
                                        </div>
                                        <div class="linerow">
                                            <div class="chair"></div>
                                            <div class="chair"></div>
                                            <div class="chair"></div>
                                            <div class="chair"></div>
                                            <div class="chair"></div>
                                            <div class="chair"></div>
                                            <div class="chair"></div>
                                            <div class="chair"></div>
                                        </div>
                                        <div class="linerow">
                                            <div class="chair"></div>
                                            <div class="chair"></div>
                                            <div class="chair"></div>
                                            <div class="chair occupied"></div>
                                            <div class="chair occupied"></div>
                                            <div class="chair"></div>
                                            <div class="chair"></div>
                                            <div class="chair"></div>
                                        </div>
                                        <div class="linerow">
                                            <div class="chair"></div>
                                            <div class="chair"></div>
                                            <div class="chair"></div>
                                            <div class="chair"></div>
                                            <div class="chair occupied"></div>
                                            <div class="chair occupied"></div>
                                            <div class="chair occupied"></div>
                                            <div class="chair"></div>
                                        </div>
                                        <div class="linerow">
                                            <div class="chair"></div>
                                            <div class="chair"></div>
                                            <div class="chair"></div>
                                            <div class="chair"></div>
                                            <div class="chair occupied"></div>
                                            <div class="chair occupied"></div>
                                            <div class="chair occupied"></div>
                                            <div class="chair"></div>
                                        </div>
                                    </div>
                                    <div class="row gx-3 justify-content-center mb-4 small text-secondary">
                                        <div class="col-auto">
                                            <div class="chair"></div>
                                            Available
                                        </div>
                                        <div class="col-auto">
                                            <div class="chair selected"></div>
                                            Selected
                                        </div>
                                        <div class="col-auto">
                                            <div class="chair occupied"></div>
                                            Occupied
                                        </div>
                                    </div>
                                    <p class="text-center text-secondary mb-0">Bill Amount for <span class="fw-medium text-theme-1" id="count">0</span> seat(s)</p>
                                    <input class="form-control form-control-lg fs-2 fw-bold text-center bg-transparent border-0" type="text" placeholder="0.00" id="total" disabled />
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer justify-content-center">
                        <button type="button" class="btn btn-theme">Book now</button>
                    </div>
                </div>
            </div>
        </div>
    `,
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class FinanceWalletComponent {
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
