import { Component, OnInit, AfterViewInit, AfterContentChecked, OnDestroy, ViewChild, ElementRef, CUSTOM_ELEMENTS_SCHEMA } from "@angular/core";
import { RouterLink } from "@angular/router";
import Choices, { ClassNames } from "choices.js";
import Swiper from "swiper";
import { register } from "swiper/element/bundle";
register();
import DataTable from "datatables.net-dt";
import "datatables.net-responsive-dt";
declare const jsVectorMap: any;

import { DaterangePickerRangesComponent } from "../../../components/input-fields/daterange-picker/daterange-picker-ranges.component";
import { SemiDoughnutChartjs180Component } from "../../../components/charts/semi-doughnut-chartjs-180.component";
import { CircleProgressBlueComponent } from "../../../components/charts/circle-progress-blue.component";
import { CircleProgressRedComponent } from "../../../components/charts/circle-progress-red.component";
import { CircleProgressYellowComponent } from "../../../components/charts/circle-progress-yellow.component";
import { CircleProgressGreenComponent } from "../../../components/charts/circle-progress-green.component";
import { BankBannerChartComponent } from "../../../components/charts/bank-banner-chart.component";

@Component({
    selector: "app-inventory-stock",
    standalone: true,
    imports: [RouterLink, DaterangePickerRangesComponent, SemiDoughnutChartjs180Component, CircleProgressBlueComponent, CircleProgressRedComponent, CircleProgressYellowComponent, CircleProgressGreenComponent, BankBannerChartComponent],
    template: `
        <!-- page title -->
        <div class="container-fluid py-3">
            <div class="row gx-3 gx-lg-4 align-items-center page-title">
                <div class="col col-sm mb-3 mb-sm-0 order-1">
                    <h5 class="mb-0">Inventory Stock</h5>
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
                    <li class="breadcrumb-item bi"><a routerLink="/app/inventory-dashboard">Inventory</a></li>
                    <li class="breadcrumb-item bi active" aria-current="page">Stock</li>
                </ol>
            </nav>
        </div>

        <!-- content -->
        <div class="container mt-3" id="main-content">
            <div class="row gx-3 gx-lg-4 mb-3 mb-lg-4">
                <div class="col text-center py-3">
                    <h4>Right time comes by <span class="text-gradient">taking right decision</span> or make it right decision</h4>
                    <p class="text-secondary">Deliver on time because all you know about universal problem of need it right now behaviors of people.</p>
                </div>
            </div>

            <!-- Orders and status summary-->
            <div class="row gx-3 gx-lg-4">
                <div class="col-12 col-md-6 col-lg-4 col-xxl mb-3 mb-lg-4">
                    <div class="card adminuiux-card shadow-sm">
                        <div class="card-body">
                            <div class="row gx-3 align-items-center">
                                <div class="col-auto">
                                    <div class="avatar avatar-50 rounded bg-theme-1-subtle text-theme-1 theme-blue">
                                        <i class="bi bi-bag-check h5"></i>
                                    </div>
                                </div>
                                <div class="col">
                                    <p class="small text-secondary mb-1">On hand</p>
                                    <h4 class="fw-medium">523 <small>Units</small></h4>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-12 col-md-6 col-lg-4 col-xxl mb-3 mb-lg-4">
                    <div class="card adminuiux-card shadow-sm">
                        <div class="card-body">
                            <div class="row gx-3 align-items-center">
                                <div class="col-auto">
                                    <div class="avatar avatar-50 rounded bg-theme-1-subtle text-theme-1 theme-cyan">
                                        <i class="bi bi-bag-check h5"></i>
                                    </div>
                                </div>
                                <div class="col">
                                    <p class="small text-secondary mb-1">Manufacturing</p>
                                    <h4 class="fw-medium">245 <small>Units</small></h4>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-12 col-md-6 col-lg-4 col-xxl mb-3 mb-lg-4">
                    <div class="card adminuiux-card shadow-sm">
                        <div class="card-body">
                            <div class="row gx-3 align-items-center">
                                <div class="col-auto">
                                    <div class="avatar avatar-50 rounded bg-theme-1-subtle text-theme-1 theme-yellow">
                                        <i class="bi bi-clipboard-check h5"></i>
                                    </div>
                                </div>
                                <div class="col">
                                    <p class="small text-secondary mb-1">Processed</p>
                                    <h4 class="fw-medium">135 <small>Units</small></h4>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-12 col-md-6 col-lg-4 col-xxl mb-3 mb-lg-4">
                    <div class="card adminuiux-card shadow-sm">
                        <div class="card-body">
                            <div class="row gx-3 align-items-center">
                                <div class="col-auto">
                                    <div class="avatar avatar-50 rounded bg-theme-1-subtle text-theme-1 theme-green">
                                        <i class="bi bi-geo-alt h5"></i>
                                    </div>
                                </div>
                                <div class="col">
                                    <p class="small text-secondary mb-1">Delivered</p>
                                    <h4 class="fw-medium">6521 <small>Units</small></h4>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-12 col-md-6 col-lg-4 col-xxl mb-3 mb-lg-4">
                    <div class="card adminuiux-card shadow-sm">
                        <div class="card-body">
                            <div class="row gx-3 align-items-center">
                                <div class="col-auto">
                                    <div class="avatar avatar-50 rounded bg-theme-1-subtle text-theme-1 theme-red">
                                        <i class="bi bi-cart-x h5"></i>
                                    </div>
                                </div>
                                <div class="col">
                                    <p class="small text-secondary mb-1">Rejected/Cancelled</p>
                                    <h4 class="fw-medium">13 <small>Units</small></h4>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- sales chart -->
            <div class="card adminuiux-card overflow-hidden mb-3 mb-lg-4">
                <div class="card-header">
                    <div class="row gx-3 align-items-center">
                        <div class="col-auto">
                            <i class="bi bi-boxes h5 avatar avatar-40 bg-theme-1-subtle text-theme-1 rounded"></i>
                        </div>
                        <div class="col">
                            <h6 class="mb-0">Sales and Profit</h6>
                            <p class="small text-secondary">Purchase Statistics</p>
                        </div>
                    </div>
                </div>
                <div class="card-body p-0">
                    <app-bank-banner-chart class="height-250 d-block w-100"></app-bank-banner-chart>
                </div>
                <div class="card-footer px-2 py-0">
                    <div class="row gx-3">
                        <!-- To be packaged -->
                        <div class="col-12 col-md-6 col-xl-3 border-top p-3 bg-l-gradient-light theme-blue">
                            <div class="row gx-3 align-items-center mb-3">
                                <div class="col-auto">
                                    <div class="avatar avatar-40 rounded bg-theme-1-subtle text-theme-1">
                                        <i class="bi bi-box h5"></i>
                                    </div>
                                </div>
                                <div class="col">
                                    <h6 class="mb-0">To be Packaged</h6>
                                    <p class="small text-secondary">No.of Products in stock</p>
                                </div>
                            </div>
                            <div class="row gx-3 align-items-center">
                                <div class="col-auto mx-auto mb-2">
                                    <app-circle-progress-blue class="avatar avatar-80"></app-circle-progress-blue>
                                </div>
                                <div class="col-12">
                                    <h5 class="text-center">152 <small>Units</small></h5>
                                    <div class="row gx-3">
                                        <div class="col">
                                            <p class="text-secondary">1652 <small>USD</small></p>
                                        </div>
                                        <div class="col-auto">
                                            <p class="text-secondary">
                                                12.00 <span class="text-theme-1 theme-green"><i class="bi bi-arrow-up fs-10"></i>4.15%</span>
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- To be shipped  -->
                        <div class="col-12 col-md-6 col-xl-3 border-start border-top p-3 bg-l-gradient-light theme-green">
                            <div class="row gx-3 align-items-center mb-3">
                                <div class="col-auto">
                                    <div class="avatar avatar-40 rounded bg-theme-1-subtle text-theme-1">
                                        <i class="bi bi-truck h5"></i>
                                    </div>
                                </div>
                                <div class="col">
                                    <h6 class="mb-0">To be Shipped</h6>
                                    <p class="small text-secondary">We will get products</p>
                                </div>
                            </div>
                            <div class="row gx-3 align-items-center">
                                <div class="col-auto mx-auto mb-2">
                                    <app-circle-progress-green class="avatar avatar-80"></app-circle-progress-green>
                                </div>
                                <div class="col-12">
                                    <h5 class="text-center">154 <small>Units</small></h5>
                                    <div class="row gx-3">
                                        <div class="col">
                                            <p class="text-secondary">1560 <small>USD</small></p>
                                        </div>
                                        <div class="col-auto">
                                            <p class="text-secondary">
                                                16.00 <span class="text-theme-1 theme-green"><i class="bi bi-arrow-up fs-10"></i>4.15%</span>
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- To Be invoiced  -->
                        <div class="col-12 col-md-6 col-xl-3 border-start border-top p-3 bg-l-gradient-light theme-yellow">
                            <div class="row gx-3 align-items-center mb-3">
                                <div class="col-auto">
                                    <div class="avatar avatar-40 rounded bg-theme-1-subtle text-theme-1">
                                        <i class="bi bi-receipt-cutoff h5"></i>
                                    </div>
                                </div>
                                <div class="col">
                                    <h6 class="mb-0">To be Invoiced</h6>
                                    <p class="small text-secondary">People are noticing</p>
                                </div>
                            </div>
                            <div class="row gx-3 align-items-center">
                                <div class="col-auto mx-auto mb-2">
                                    <app-circle-progress-yellow class="avatar avatar-80"></app-circle-progress-yellow>
                                </div>
                                <div class="col-12">
                                    <h5 class="text-center">102 <small>Units</small></h5>
                                    <div class="row gx-3">
                                        <div class="col">
                                            <p class="text-secondary">6580 <small>USD</small></p>
                                        </div>
                                        <div class="col-auto">
                                            <p class="text-secondary">
                                                20.00 <span class="text-theme-1 theme-green"><i class="bi bi-arrow-up fs-10"></i>4.15%</span>
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- To be delivered  -->
                        <div class="col-12 col-md-6 col-xl-3 border-start border-top p-3 bg-l-gradient-light theme-red">
                            <div class="row gx-3 align-items-center mb-3">
                                <div class="col-auto">
                                    <div class="avatar avatar-40 rounded bg-theme-1-subtle text-theme-1 theme-red">
                                        <i class="bi bi-house h5"></i>
                                    </div>
                                </div>
                                <div class="col">
                                    <h6 class="mb-0">To be delivered</h6>
                                    <p class="small text-secondary">Performance of referrals</p>
                                </div>
                            </div>
                            <div class="row gx-3 align-items-center">
                                <div class="col-auto mx-auto mb-2">
                                    <app-circle-progress-red class="avatar avatar-80"></app-circle-progress-red>
                                </div>
                                <div class="col-12">
                                    <h5 class="text-center">205 <small>Units</small></h5>
                                    <div class="row gx-3">
                                        <div class="col">
                                            <p class="text-secondary">2510 <small>USD</small></p>
                                        </div>
                                        <div class="col-auto">
                                            <p class="text-secondary">
                                                21.00 <span class="text-theme-1 theme-green"><i class="bi bi-arrow-up fs-10"></i>4.15%</span>
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Trending products -->
            <div class="row gx-3 align-items-center mb-3 mb-lg-4">
                <div class="col-auto">
                    <i class="bi bi-star h5 avatar avatar-40 bg-theme-1-subtle text-theme-1 theme-yellow rounded"></i>
                </div>
                <div class="col">
                    <h6 class="mb-0">Trending Product Stock</h6>
                    <p class="small text-secondary">Sharpen details on trending products</p>
                </div>
            </div>
            <!-- Swiper -->
            <swiper-container slides-per-view="auto" space-between="16" autoplay="true" class="swiper swipernav mb-3 mb-lg-4">
                <swiper-slide class="w-auto">
                    <div class="card adminuiux-card width-200 text-center mb-1">
                        <div class="card-body">
                            <div class="coverimg w-100 height-180 rounded mb-3">
                                <img src="assets/img/adminux/product-1.jpg" alt="" />
                            </div>
                            <p class="text-secondary small mb-1">PUMA Shoes</p>
                            <h5 class="fw-medium">13 <small>Units</small></h5>
                            <button type="button" class="btn btn-outline-theme btn-sm w-100">Increase stock</button>
                        </div>
                    </div>
                </swiper-slide>
                <swiper-slide class="w-auto">
                    <div class="card adminuiux-card width-200 text-center mb-1">
                        <div class="card-body">
                            <div class="coverimg w-100 height-180 rounded mb-3">
                                <img src="assets/img/adminux/product-2.jpg" alt="" />
                            </div>
                            <p class="text-secondary small mb-1">Titan Watch</p>
                            <h5 class="fw-medium">16 <small>Units</small></h5>
                            <button type="button" class="btn btn-outline-theme btn-sm w-100">Increase stock</button>
                        </div>
                    </div>
                </swiper-slide>
                <swiper-slide class="w-auto">
                    <div class="card adminuiux-card width-200 text-center mb-1">
                        <div class="card-body">
                            <div class="coverimg w-100 height-180 rounded mb-3">
                                <img src="assets/img/adminux/product-3.jpg" alt="" />
                            </div>
                            <p class="text-secondary small mb-1">FOGG</p>
                            <h5 class="fw-medium">16 <small>Units</small></h5>
                            <button type="button" class="btn btn-outline-theme btn-sm w-100">Increase stock</button>
                        </div>
                    </div>
                </swiper-slide>
                <swiper-slide class="w-auto">
                    <div class="card adminuiux-card width-200 text-center mb-1">
                        <div class="card-body">
                            <div class="coverimg w-100 height-180 rounded mb-3">
                                <img src="assets/img/adminux/product-4.jpg" alt="" />
                            </div>
                            <p class="text-secondary small mb-1">Havells Appliances</p>
                            <h5 class="fw-medium">13 <small>Units</small></h5>
                            <button type="button" class="btn btn-outline-theme btn-sm w-100">Increase stock</button>
                        </div>
                    </div>
                </swiper-slide>
                <swiper-slide class="w-auto">
                    <div class="card adminuiux-card width-200 text-center mb-1">
                        <div class="card-body">
                            <div class="coverimg w-100 height-180 rounded mb-3">
                                <img src="assets/img/adminux/product-5.jpg" alt="" />
                            </div>
                            <p class="text-secondary small mb-1">MSI Computers</p>
                            <h5 class="fw-medium">18 <small>Units</small></h5>
                            <button type="button" class="btn btn-outline-theme btn-sm w-100">Increase stock</button>
                        </div>
                    </div>
                </swiper-slide>
                <swiper-slide class="w-auto">
                    <div class="card adminuiux-card width-200 text-center mb-1">
                        <div class="card-body">
                            <div class="coverimg w-100 height-180 rounded mb-3">
                                <img src="assets/img/adminux/product-6.jpg" alt="" />
                            </div>
                            <p class="text-secondary small mb-1">Gear</p>
                            <h5 class="fw-medium">20 <small>Units</small></h5>
                            <button type="button" class="btn btn-outline-theme btn-sm w-100">Increase stock</button>
                        </div>
                    </div>
                </swiper-slide>
                <swiper-slide class="w-auto">
                    <div class="card adminuiux-card width-200 text-center mb-1">
                        <div class="card-body">
                            <div class="coverimg w-100 height-180 rounded mb-3">
                                <img src="assets/img/adminux/product-8.jpg" alt="" />
                            </div>
                            <p class="text-secondary small mb-1">Apple</p>
                            <h5 class="fw-medium">18 <small>Units</small></h5>
                            <button type="button" class="btn btn-outline-theme btn-sm w-100">Increase stock</button>
                        </div>
                    </div>
                </swiper-slide>
                <swiper-slide class="w-auto">
                    <div class="card adminuiux-card width-200 text-center mb-1">
                        <div class="card-body">
                            <div class="coverimg w-100 height-180 rounded mb-3">
                                <img src="assets/img/adminux/product-9.jpg" alt="" />
                            </div>
                            <p class="text-secondary small mb-1">AdminUIUX</p>
                            <h5 class="fw-medium">6 <small>Units</small></h5>
                            <button type="button" class="btn btn-outline-theme btn-sm w-100">Increase stock</button>
                        </div>
                    </div>
                </swiper-slide>
            </swiper-container>

            <div class="row gx-3 gx-lg-4 mb-3 mb-lg-4">
                <div class="col text-center py-3">
                    <h4>Understand <span class="text-gradient">Devices & Human Behaviors</span> to change widget orders</h4>
                    <p class="text-secondary">Proximity and Expectation of users will be best combination to make everything productive.</p>
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
                                    <h6 class="mb-0">Orders</h6>
                                    <p class="text-secondary small">All in orders items</p>
                                </div>
                                <div class="col-auto ms-auto">
                                    <div class="input-group ">
                                        <span class="input-group-text text-theme-1"><i class="bi bi-search"></i></span>
                                        <input type="text" class="form-control" placeholder="Search..." />
                                    </div>
                                </div>
                                <div class="col-auto">
                                    <div class="dropdown d-inline-block">
                                        <a class="btn btn-square btn-link text-secondary no-caret dropdown-toggle" data-bs-toggle="dropdown" aria-expanded="false" data-bs-display="static" role="button">
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
                        <div class="card-body py-0">
                            <table class="table" id="dataTable">
                                <thead>
                                    <tr class="text-muted">
                                        <th class="w-12"></th>
                                        <th class="all">Product</th>
                                        <th class="desktop">Category</th>
                                        <th class="desktop">Price</th>
                                        <th class="none">Order by</th>
                                        <th class="desktop">Date</th>
                                        <th class="tablet desktop">Status</th>
                                        <th class="none" data-title="Deliver to">Deliver to</th>
                                        <th class="none" data-title="Address">Address</th>
                                        <th class="none" data-title="Location">Location</th>
                                        <th class="desktop">Payment</th>
                                        <th class="all">Action</th>
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
                                                    <p class="mb-0">Shoes</p>
                                                    <p class="text-secondary small">1 items, SKUID: SH02521</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <p class="mb-0">Accessories</p>
                                            <p class="text-secondary small">Men Shoes</p>
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
                                            <p class="text-secondary small">9:00 am</p>
                                        </td>
                                        <td>
                                            <span class="badge badge-sm badge-light text-bg-theme-1 theme-green">Delivered</span>
                                        </td>
                                        <td>John Johnson</td>
                                        <td>2356, Street-5, New York 4586, US</td>
                                        <td>
                                            <p class="mb-1">Lat: 5.678167, Long: 12.078613</p>
                                            <p class="text-secondary small">This can be a map also</p>
                                        </td>
                                        <td>
                                            <span class="badge badge-sm bg-green">Paid</span>
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
                                            <div class="row gx-3 align-items-center">
                                                <div class="col-auto">
                                                    <figure class="avatar avatar-50 border mb-0 coverimg rounded">
                                                        <img src="assets/img/adminux/product-2.jpg" alt="" />
                                                    </figure>
                                                </div>
                                                <div class="col">
                                                    <p class="mb-0">Timex 0214 Watch</p>
                                                    <p class="text-secondary small">1 items, SKUID: SH02631</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <p class="mb-0">Accessories</p>
                                            <p class="text-secondary small">Watch</p>
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
                                            <p class="text-secondary small">10:05 am</p>
                                        </td>
                                        <td>
                                            <span class="badge badge-sm badge-light text-bg-theme-1 theme-green">Delivered</span>
                                        </td>
                                        <td>Mirae Jackson</td>
                                        <td>2356, Street-5, New York 4586, US</td>
                                        <td>
                                            <p class="mb-1">Lat: 5.678167, Long: 12.078613</p>
                                            <p class="text-secondary small">This can be a map also</p>
                                        </td>
                                        <td>
                                            <span class="badge badge-sm bg-green">Paid</span>
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
                                            <div class="row gx-3 align-items-center">
                                                <div class="col-auto">
                                                    <figure class="avatar avatar-50 border mb-0 coverimg rounded">
                                                        <img src="assets/img/adminux/product-3.jpg" alt="" />
                                                    </figure>
                                                </div>
                                                <div class="col">
                                                    <p class="mb-0">FOGG</p>
                                                    <p class="text-secondary small">1 items, SKUID: SH03560</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <p class="mb-0">Extras</p>
                                            <p class="text-secondary small">Men Deo</p>
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
                                            <p class="text-secondary small">9:00 am</p>
                                        </td>
                                        <td>
                                            <span class="badge badge-sm badge-light text-bg-theme-1 theme-green">Delivered</span>
                                        </td>
                                        <td>Mark Danial</td>
                                        <td>2356, Street-5, New York 4586, US</td>
                                        <td>
                                            <p class="mb-1">Lat: 5.678167, Long: 12.078613</p>
                                            <p class="text-secondary small">This can be a map also</p>
                                        </td>
                                        <td>
                                            <span class="badge badge-sm bg-theme-1 theme-blue">Waiting</span>
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
                                            <div class="row gx-3 align-items-center">
                                                <div class="col-auto">
                                                    <figure class="avatar avatar-50 border mb-0 coverimg rounded">
                                                        <img src="assets/img/adminux/product-4.jpg" alt="" />
                                                    </figure>
                                                </div>
                                                <div class="col">
                                                    <p class="mb-0">Room Heater Hewells</p>
                                                    <p class="text-secondary small">1 items, SKUID: RH03674</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <p class="mb-0">Appliances</p>
                                            <p class="text-secondary small">Room Heater</p>
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
                                            <p class="text-secondary small">9:00 am</p>
                                        </td>
                                        <td>
                                            <span class="badge badge-sm badge-light text-bg-theme-1 theme-green">Delivered</span>
                                        </td>
                                        <td>Micky Nick</td>
                                        <td>2356, Street-5, New York 4586, US</td>
                                        <td>
                                            <p class="mb-1">Lat: 5.678167, Long: 12.078613</p>
                                            <p class="text-secondary small">This can be a map also</p>
                                        </td>
                                        <td>
                                            <span class="badge badge-sm bg-red">Cancelled</span>
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
                                            <div class="row gx-3 align-items-center">
                                                <div class="col-auto">
                                                    <figure class="avatar avatar-50 border mb-0 coverimg rounded">
                                                        <img src="assets/img/adminux/product-1.jpg" alt="" />
                                                    </figure>
                                                </div>
                                                <div class="col">
                                                    <p class="mb-0">Shoes</p>
                                                    <p class="text-secondary small">1 items, SKUID: SH06581</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <p class="mb-0">Accessories</p>
                                            <p class="text-secondary small">Men Shoes</p>
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
                                            <p class="text-secondary small">9:00 am</p>
                                        </td>
                                        <td>
                                            <span class="badge badge-sm badge-light text-bg-theme-1 theme-green">Delivered</span>
                                        </td>
                                        <td>John Johnson</td>
                                        <td>2356, Street-5, New York 4586, US</td>
                                        <td>
                                            <p class="mb-1">Lat: 5.678167, Long: 12.078613</p>
                                            <p class="text-secondary small">This can be a map also</p>
                                        </td>
                                        <td>
                                            <span class="badge badge-sm bg-yellow">Processing</span>
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
                                            <div class="row gx-3 align-items-center">
                                                <div class="col-auto">
                                                    <figure class="avatar avatar-50 border mb-0 coverimg rounded">
                                                        <img src="assets/img/adminux/product-1.jpg" alt="" />
                                                    </figure>
                                                </div>
                                                <div class="col">
                                                    <p class="mb-0">Shoes</p>
                                                    <p class="text-secondary small">1 items, SKUID: SH06581</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <p class="mb-0">Accessories</p>
                                            <p class="text-secondary small">Men Shoes</p>
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
                                            <p class="text-secondary small">9:00 am</p>
                                        </td>
                                        <td>
                                            <span class="badge badge-sm badge-light text-bg-theme-1 theme-green">Delivered</span>
                                        </td>
                                        <td>John Johnson</td>
                                        <td>2356, Street-5, New York 4586, US</td>
                                        <td>
                                            <p class="mb-1">Lat: 5.678167, Long: 12.078613</p>
                                            <p class="text-secondary small">This can be a map also</p>
                                        </td>
                                        <td>
                                            <span class="badge badge-sm bg-yellow">Processing</span>
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
                                            <div class="row gx-3 align-items-center">
                                                <div class="col-auto">
                                                    <figure class="avatar avatar-50 border mb-0 coverimg rounded">
                                                        <img src="assets/img/adminux/product-1.jpg" alt="" />
                                                    </figure>
                                                </div>
                                                <div class="col">
                                                    <p class="mb-0">Shoes</p>
                                                    <p class="text-secondary small">1 items, SKUID: SH02521</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <p class="mb-0">Accessories</p>
                                            <p class="text-secondary small">Men Shoes</p>
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
                                            <p class="text-secondary small">9:00 am</p>
                                        </td>
                                        <td>
                                            <span class="badge badge-sm badge-light text-bg-theme-1 theme-green">Delivered</span>
                                        </td>
                                        <td>John Johnson</td>
                                        <td>2356, Street-5, New York 4586, US</td>
                                        <td>
                                            <p class="mb-1">Lat: 5.678167, Long: 12.078613</p>
                                            <p class="text-secondary small">This can be a map also</p>
                                        </td>
                                        <td>
                                            <span class="badge badge-sm bg-green">Paid</span>
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
                                            <div class="row gx-3 align-items-center">
                                                <div class="col-auto">
                                                    <figure class="avatar avatar-50 border mb-0 coverimg rounded">
                                                        <img src="assets/img/adminux/product-2.jpg" alt="" />
                                                    </figure>
                                                </div>
                                                <div class="col">
                                                    <p class="mb-0">Timex 0214 Watch</p>
                                                    <p class="text-secondary small">1 items, SKUID: SH02631</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <p class="mb-0">Accessories</p>
                                            <p class="text-secondary small">Watch</p>
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
                                            <p class="text-secondary small">10:05 am</p>
                                        </td>
                                        <td>
                                            <span class="badge badge-sm badge-light text-bg-theme-1 theme-green">Delivered</span>
                                        </td>
                                        <td>Mirae Jackson</td>
                                        <td>2356, Street-5, New York 4586, US</td>
                                        <td>
                                            <p class="mb-1">Lat: 5.678167, Long: 12.078613</p>
                                            <p class="text-secondary small">This can be a map also</p>
                                        </td>
                                        <td>
                                            <span class="badge badge-sm bg-green">Paid</span>
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
                                            <div class="row gx-3 align-items-center">
                                                <div class="col-auto">
                                                    <figure class="avatar avatar-50 border mb-0 coverimg rounded">
                                                        <img src="assets/img/adminux/product-3.jpg" alt="" />
                                                    </figure>
                                                </div>
                                                <div class="col">
                                                    <p class="mb-0">FOGG</p>
                                                    <p class="text-secondary small">1 items, SKUID: SH03560</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <p class="mb-0">Extras</p>
                                            <p class="text-secondary small">Men Deo</p>
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
                                            <p class="text-secondary small">9:00 am</p>
                                        </td>
                                        <td>
                                            <span class="badge badge-sm badge-light text-bg-theme-1 theme-green">Delivered</span>
                                        </td>
                                        <td>Mark Danial</td>
                                        <td>2356, Street-5, New York 4586, US</td>
                                        <td>
                                            <p class="mb-1">Lat: 5.678167, Long: 12.078613</p>
                                            <p class="text-secondary small">This can be a map also</p>
                                        </td>
                                        <td>
                                            <span class="badge badge-sm bg-theme-1 theme-blue">Waiting</span>
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
                                            <div class="row gx-3 align-items-center">
                                                <div class="col-auto">
                                                    <figure class="avatar avatar-50 border mb-0 coverimg rounded">
                                                        <img src="assets/img/adminux/product-4.jpg" alt="" />
                                                    </figure>
                                                </div>
                                                <div class="col">
                                                    <p class="mb-0">Room Heater Hewells</p>
                                                    <p class="text-secondary small">1 items, SKUID: RH03674</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <p class="mb-0">Appliances</p>
                                            <p class="text-secondary small">Room Heater</p>
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
                                            <p class="text-secondary small">9:00 am</p>
                                        </td>
                                        <td>
                                            <span class="badge badge-sm badge-light text-bg-theme-1 theme-green">Delivered</span>
                                        </td>
                                        <td>Micky Nick</td>
                                        <td>2356, Street-5, New York 4586, US</td>
                                        <td>
                                            <p class="mb-1">Lat: 5.678167, Long: 12.078613</p>
                                            <p class="text-secondary small">This can be a map also</p>
                                        </td>
                                        <td>
                                            <span class="badge badge-sm bg-red">Cancelled</span>
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

            <!-- Offers assets average-->
            <div class="row gx-3 gx-lg-4">
                <!-- offer -->
                <div class="col-12 col-md-6 col-lg-6 col-xxl-3 order-2 order-xxl-1">
                    <div class="card adminuiux-card overflow-hidden mb-3 mb-lg-4">
                        <div class="row mx-0">
                            <div class="col-6 theme-green bg-theme-1 text-center py-4 z-index-1">
                                <div class="position-relative">
                                    <h3 class="mb-0">6.15%</h3>
                                    <p class="mb-2">Interest Rate</p>
                                    <p class="opacity-75 small">Business Loan are at cheaper rate</p>
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
                                    <p class="mb-2">Discount</p>
                                    <p class="opacity-75 small">Buy more, Get more</p>
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
                                    <h6 class="mb-0">Global Country Performance</h6>
                                    <p class="small text-secondary">Last months</p>
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
                                                <p class="opacity-75 small mb-1">Target<br />Income</p>
                                                <h5>$2542</h5>
                                            </div>
                                        </div>
                                        <div class="col align-self-center">
                                            <div class="row gx-3 mb-3">
                                                <div class="col">
                                                    <p class="text-secondary small mb-0">United States</p>
                                                    <p>New York</p>
                                                </div>
                                                <div class="col-auto text-end">
                                                    <p class="text-secondary small mb-0">New Sales</p>
                                                    <p>120 orders</p>
                                                </div>
                                            </div>
                                            <div>
                                                <div class="progress height-10 mb-1 bg-theme-1-subtle text-theme-1">
                                                    <div class="progress-bar bg-theme-1 w-50" role="progressbar" aria-valuenow="45" aria-valuemin="0" aria-valuemax="100"></div>
                                                </div>
                                            </div>
                                            <p class="small text-secondary">Targeted Orders<span class="float-end">260</span></p>
                                        </div>
                                    </div>
                                    <div class="row gx-3">
                                        <div class="col-auto">
                                            <div class="rounded bg-purple text-white p-3">
                                                <p class="opacity-75 small mb-1">Target<br />Income</p>
                                                <h5>$2542</h5>
                                            </div>
                                        </div>
                                        <div class="col align-self-center">
                                            <div class="row gx-3 mb-3">
                                                <div class="col">
                                                    <p class="text-secondary small mb-0">United States</p>
                                                    <p>New York</p>
                                                </div>
                                                <div class="col-auto text-end">
                                                    <p class="text-secondary small mb-0">New Sales</p>
                                                    <p>120 orders</p>
                                                </div>
                                            </div>
                                            <div>
                                                <div class="progress height-10 mb-1 bg-theme-1-subtle text-theme-1 theme-purple">
                                                    <div class="progress-bar bg-theme-1 w-50" role="progressbar" aria-valuenow="45" aria-valuemin="0" aria-valuemax="100"></div>
                                                </div>
                                            </div>
                                            <p class="small text-secondary">Targeted Orders<span class="float-end">260</span></p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Average Expenses -->
                <div class="col-12 col-md-6 col-lg-6 col-xxl-3 order-3  mb-4">
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
                                <div class="position-absolute bottom-0 mx-auto start-50 translate-middle mb-2">
                                    <p class="text-secondary small mb-0">Total Expense</p>
                                    <h5>5.4k <small>USD</small></h5>
                                </div>
                                <app-semi-doughnut-chartjs-180 class="avatar avatar-200 mt--50 position-relative"></app-semi-doughnut-chartjs-180>
                            </div>
                            <p class="text-secondary">You have spend most on raw materials and have to look at order cancellation</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `,
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class InventoryStockComponent {
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
