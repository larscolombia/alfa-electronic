import { Component, OnInit, AfterViewInit, AfterContentChecked, OnDestroy, ViewChild, ElementRef, CUSTOM_ELEMENTS_SCHEMA } from "@angular/core";
import { RouterLink } from "@angular/router";
import Choices, { ClassNames } from "choices.js";
import Swiper from "swiper";
import { register } from "swiper/element/bundle";
register();

import { DaterangePickerRangesComponent } from "../../../components/input-fields/daterange-picker/daterange-picker-ranges.component";
import { DoughnutChartjs100Component } from "../../../components/charts/doughnut-chartjs-100.component";
import { DoughnutChartjs1002Component } from "../../../components/charts/doughnut-chartjs-100-2.component";
import { BarGreenChartjs100Component } from "../../../components/charts/bar-green-chartjs-100.component";
import { BarRedChartjs100Component } from "../../../components/charts/bar-red-chartjs-100.component";
import { AreaBlueChartjs60Component } from "../../../components/charts/area-blue-chartjs-60.component";
import { AreaGreenChartjs60Component } from "../../../components/charts/area-green-chartjs-60.component";
import { AreaYellowChartjs60Component } from "../../../components/charts/area-yellow-chartjs-60.component";
import { ArearedChartjs60Component } from "../../../components/charts/area-red-chartjs-60.component";
import { CircleProgressRedComponent } from "../../../components/charts/circle-progress-red.component";
import { CircleProgressBlueComponent } from "../../../components/charts/circle-progress-blue.component";
import { CircleProgressGreenComponent } from "../../../components/charts/circle-progress-green.component";
import { CircleProgressYellowComponent } from "../../../components/charts/circle-progress-yellow.component";
import { AreaCyanChartjs60Component } from "../../../components/charts/area-cyan-chartjs-60.component";
import { AreaBlueChartjs100Component } from "../../../components/charts/area-blue-chartjs-100.component";

@Component({
    selector: "app-profile-analytical",
    standalone: true,
    imports: [RouterLink, DaterangePickerRangesComponent, DoughnutChartjs100Component, DoughnutChartjs1002Component, BarGreenChartjs100Component, BarRedChartjs100Component, AreaBlueChartjs60Component, AreaGreenChartjs60Component, AreaYellowChartjs60Component, ArearedChartjs60Component, CircleProgressRedComponent, CircleProgressBlueComponent, CircleProgressGreenComponent, CircleProgressYellowComponent, AreaCyanChartjs60Component, AreaBlueChartjs100Component],
    template: `
        <!-- page title -->
        <div class="container-fluid py-3">
            <div class="row gx-3 gx-lg-4 align-items-center page-title">
                <div class="col col-sm mb-3 mb-sm-0 order-1">
                    <h5 class="mb-0">Analytical Profile</h5>
                    <p class="text-secondary small">Analytical data preview for profile</p>
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
                    <li class="breadcrumb-item bi active" aria-current="page">Analytical</li>
                </ol>
            </nav>
        </div>

        <!-- content -->
        <div class="container mt-3" id="main-content">
            <div class="card adminuiux-card mb-3 mb-lg-4 overflow-hidden">
                <figure class="coverimg position-fixed-bg w-100 height-250 mb-0">
                    <img src="assets/img/background-image/backgorund-image-3.jpg" class="mw-100" alt="" />
                </figure>
                <div class="card-body">
                    <div class="row gx-3 justify-content-center">
                        <div class="col-auto px-4 px-lg-5 mb-3 mb-md-0">
                            <figure class="avatar avatar-160 coverimg rounded-circle mt--100 shadow-md">
                                <img src="assets/img/modern-ai-image/user-2.jpg" alt="" />
                            </figure>
                        </div>
                        <div class="col-12 col-md mb-3 mb-md-0 text-center text-md-start">
                            <h2>
                                <span class="text-gradient">AdminUIUX</span> <span class="badge bg-theme-1 theme-green rounded vm fw-normal fs-12"><i class="bi bi-check-circle me-1"></i>Active</span>
                            </h2>
                            <p class="text-secondary mb-3"><i class="bi bi-geo-alt me-2"></i>D25, Amalika Empire, DD Street, San Jose, United States</p>
                            <p>
                                <a href="tel:+18358638952581" class="badge badge-light text-bg-theme-1 rounded-5 theme-green fs-14 mb-1">
                                    <span class="avatar avatar-30 rounded-circle me-1 bg-theme-1-subtle text-theme-1 vm"><i class="bi bi-telephone"></i></span> +1835863895A2581
                                </a>
                                <a href="mailto:information&#64;adminuiux.com" class="badge badge-light text-bg-theme-1 rounded-5 theme-yellow fs-14 mb-1">
                                    <span class="avatar avatar-30 rounded-circle me-1 bg-theme-1-subtle text-theme-1 vm"><i class="bi bi-envelope"></i></span> test&#64;adminuiux.com
                                </a>
                            </p>
                        </div>
                        <div class="col-12 col-md-auto text-center text-md-end">
                            <p class="small text-secondary mb-2">Share</p>
                            <ul class="nav justify-content-center">
                                <li class="nav-item">
                                    <a class="nav-link px-2" href="https://www.facebook.com/adminuiux/" target="_blank">
                                        <i class="bi bi-facebook h5"></i>
                                    </a>
                                </li>
                                <li class="nav-item">
                                    <a class="nav-link px-2" href="https://x.com/admiinuiux" target="_blank">
                                        <i class="bi bi-twitter h5"></i>
                                    </a>
                                </li>
                                <li class="nav-item">
                                    <a class="nav-link px-2" href="https://linkedin.com/company/adminuiux" target="_blank">
                                        <i class="bi bi-linkedin h5"></i>
                                    </a>
                                </li>
                                <li class="nav-item">
                                    <a class="nav-link px-2" href="https://www.instagram.com/adminuiux/" target="_blank">
                                        <i class="bi bi-instagram h5"></i>
                                    </a>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>

            <ul class="nav nav-pills justify-content-center mb-3 mb-lg-4" role="tablist">
                <li class="nav-item">
                    <a href="javascript:void(0)" class="nav-link active" id="basicdetails-tab" data-bs-toggle="tab" data-bs-target="#basicdetails" role="tab" aria-controls="basicdetails">Basic</a>
                </li>
                <li class="nav-item">
                    <a href="javascript:void(0)" class="nav-link " id="analytics-tab" data-bs-toggle="tab" data-bs-target="#analytics" role="tab" aria-controls="analytics">Analytic</a>
                </li>
                <li class="nav-item">
                    <a href="javascript:void(0)" class="nav-link" id="payments-tab" data-bs-toggle="tab" data-bs-target="#payments" role="tab" aria-controls="payments">Payments</a>
                </li>
            </ul>

            <div class="tab-content" id="adminux-myprofileanalyticstabs">
                <div class="tab-pane fade show active" id="basicdetails" role="tabpanel" aria-labelledby="basicdetails-tab">
                    <div class="row gx-3 gx-lg-4">
                        <div class="col-12 col-md-6 col-lg-3">
                            <div class="card adminuiux-card mb-3 mb-lg-4">
                                <div class="card-body">
                                    <h6 class="mb-3">Birthday</h6>
                                    <div class="row gx-3">
                                        <div class="col-auto">
                                            <figure class="avatar avatar-40 rounded coverimg">
                                                <img src="assets/img/modern-ai-image/user-3.jpg" alt="" />
                                            </figure>
                                        </div>
                                        <div class="col">
                                            <h6 class="mb-0">25-12-1992</h6>
                                            <p class="small text-secondary">New York, United States</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="col-12 col-md-6 col-lg-3">
                            <div class="card adminuiux-card mb-3 mb-lg-4">
                                <div class="card-body">
                                    <h6 class="mb-3">Working in</h6>
                                    <div class="row gx-3">
                                        <div class="col-auto">
                                            <figure class="avatar avatar-40 rounded coverimg">
                                                <img src="assets/img/modern-ai-image/company6.png" alt="" />
                                            </figure>
                                        </div>
                                        <div class="col">
                                            <h6 class="mb-0">2019-Present</h6>
                                            <p class="small text-secondary">Lead Manager</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="col-12 col-md-6 col-lg-3">
                            <div class="card adminuiux-card mb-3 mb-lg-4">
                                <div class="card-body">
                                    <h6 class="mb-3">Education</h6>
                                    <div class="row gx-3">
                                        <div class="col-auto">
                                            <figure class="avatar avatar-40 rounded coverimg">
                                                <img src="assets/img/modern-ai-image/taxi-1.jpg" alt="" />
                                            </figure>
                                        </div>
                                        <div class="col">
                                            <h6 class="mb-0">BA, LLB</h6>
                                            <p class="small text-secondary">From Rajkumar Alexis University</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="col-12 col-md-6 col-lg-3">
                            <div class="card border-0 bg-theme-r-gradient text-white mb-3 mb-lg-4">
                                <div class="card-body bg-none">
                                    <h6 class="mb-3">Customize and Update</h6>
                                    <div class="row gx-3">
                                        <div class="col-auto">
                                            <div class="avatar avatar-40 rounded bg-white-opacity text-white">
                                                <i class="bi bi-pencil"></i>
                                            </div>
                                        </div>
                                        <div class="col">
                                            <h6 class="mb-0">Stay up to date</h6>
                                            <p class="small text-secondary"><a href="" class="text-white style-none">Edit Profile</a></p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="row gx-3 gx-lg-4 align-items-center mb-3 mb-lg-4">
                        <div class="col-auto">
                            <i class="bi bi-geo-alt h5 avatar avatar-40 bg-theme-1-subtle text-theme-1 rounded"></i>
                        </div>
                        <div class="col">
                            <h6 class="mb-0">Addresses</h6>
                            <p class="small text-secondary">Manage your addresses for Delivery</p>
                        </div>
                        <div class="col-auto">
                            <a href="" class="btn btn-link btn-sm"><i class="bi bi-plus me-2"></i>Add Address</a>
                        </div>
                    </div>
                    <div class="row gx-3 gx-lg-4">
                        <div class="col-12 col-md-6 col-lg-3">
                            <div class="card adminuiux-card mb-3 mb-lg-4">
                                <div class="card-header">
                                    <div class="row gx-3 align-items-center">
                                        <div class="col">
                                            <h6 class="mb-0">Address 1</h6>
                                            <p class="text-secondary small">This is default</p>
                                        </div>
                                        <div class="col-auto">
                                            <div class="dropdown d-inline-block">
                                                <a class="btn btn-square btn-link text-secondary no-caret dropdown-toggle" data-bs-toggle="dropdown" aria-expanded="true" data-bs-display="static" role="button">
                                                    <i class="bi bi-three-dots-vertical"></i>
                                                </a>
                                                <ul class="dropdown-menu dropdown-menu-end" data-bs-popper="static">
                                                    <li><a class="dropdown-item" href="javascript:void(0)">Edit</a></li>
                                                    <li><a class="dropdown-item active" href="javascript:void(0)">Mark as default</a></li>
                                                    <li><a class="dropdown-item text-danger" href="javascript:void(0)">Delete</a></li>
                                                </ul>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div class="card-body">
                                    <h6>Max Doe</h6>
                                    <p>+15896255A55669</p>
                                    <p class="text-secondary mb-3">D25, Amalika Empire, DD Street,<br />San Jose, United States</p>
                                    <span class="badge badge-light text-bg-theme-1 theme-yellow ps-1"><i class="avatar avatar-20 bi bi-house-door me-1 vm "></i>Home</span>
                                </div>
                            </div>
                        </div>
                        <div class=" col-12 col-md-6 col-lg-3">
                            <div class="card adminuiux-card mb-3 mb-lg-4">
                                <div class="card-header">
                                    <div class="row gx-3 align-items-center">
                                        <div class="col">
                                            <h6 class="mb-0">Address 2</h6>
                                            <p class="text-secondary small">This is secondary</p>
                                        </div>
                                        <div class="col-auto">
                                            <div class="dropdown d-inline-block">
                                                <a class="btn btn-square btn-link text-secondary no-caret dropdown-toggle" data-bs-toggle="dropdown" aria-expanded="true" data-bs-display="static" role="button">
                                                    <i class="bi bi-three-dots-vertical"></i>
                                                </a>
                                                <ul class="dropdown-menu dropdown-menu-end" data-bs-popper="static">
                                                    <li><a class="dropdown-item" href="javascript:void(0)">Edit</a></li>
                                                    <li><a class="dropdown-item" href="javascript:void(0)">Mark as default</a></li>
                                                    <li><a class="dropdown-item text-danger" href="javascript:void(0)">Delete</a></li>
                                                </ul>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div class="card-body">
                                    <h6>AdminUIUX</h6>
                                    <p>+15896255A55669</p>
                                    <p class="text-secondary mb-3">D25, Amalika Empire, DD Street,<br />San Jose, United States</p>
                                    <span class="badge badge-light text-bg-theme-1 theme-green ps-1"><i class="avatar avatar-20 bi bi-building me-1 vm "></i>Office</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="row gx-3 gx-lg-4 align-items-center mb-3 mb-lg-4">
                        <div class="col-auto">
                            <i class="bi bi-bag h5 avatar avatar-40 bg-theme-1-subtle text-theme-1 rounded"></i>
                        </div>
                        <div class="col">
                            <h6 class="mb-0">Recent Orders</h6>
                            <p class="small text-secondary">Manage your recent orders</p>
                        </div>
                        <div class="col-auto">
                            <a href="" class="btn btn-link btn-sm"><i class="bi bi-shop vm me-2"></i>Visit Store</a>
                        </div>
                    </div>
                    <div class="row gx-3 gx-lg-4">
                        <div class="col-12 col-xxl-6">
                            <div class="card adminuiux-card mb-3 mb-lg-4">
                                <div class="card-body">
                                    <div class="row gx-3 align-items-center">
                                        <div class="col-auto mb-3 mb-md-0">
                                            <figure class="avatar avatar-40 border mb-0 coverimg rounded">
                                                <img src="assets/img/adminux/product-1.jpg" alt="" />
                                            </figure>
                                        </div>
                                        <div class="col-9 col-xs-10 col-md-4 mb-3 mb-md-0">
                                            <p class="mb-0">Shoes</p>
                                            <p class="text-secondary small">1 item - SKUID: SH02521...</p>
                                        </div>
                                        <div class="col">
                                            <p class="mb-0">80.00</p>
                                            <p class="text-secondary small">USD</p>
                                        </div>
                                        <div class="col">
                                            <p class="mb-0">Status</p>
                                            <p class="text-secondary small">Shipped</p>
                                        </div>
                                        <div class="col">
                                            <p class="mb-0">Payment</p>
                                            <p class=""><span class="badge badge-light text-bg-theme-1 theme-green">Paid</span></p>
                                        </div>
                                        <div class="col-auto">
                                            <div class="dropdown d-inline-block">
                                                <a class="text-secondary no-caret dropdown-toggle" data-bs-toggle="dropdown" aria-expanded="false" data-bs-display="static" role="button">
                                                    <i class="bi bi-three-dots"></i>
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
                                <div class="card-footer border-top">
                                    <ul class="progress-stepbar">
                                        <li class="completed"><span>Order Placed</span></li>
                                        <li class="completed"><span>Packed</span></li>
                                        <li class="completed"><span>Invoiced</span></li>
                                        <li class="stop"><span>Shipped</span></li>
                                        <li><span>Delivered</span></li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                        <div class="col-12 col-xxl-6">
                            <div class="card adminuiux-card mb-3 mb-lg-4">
                                <div class="card-body">
                                    <div class="row gx-3 align-items-center">
                                        <div class="col-auto mb-3 mb-md-0">
                                            <figure class="avatar avatar-40 border mb-0 coverimg rounded">
                                                <img src="assets/img/adminux/product-2.jpg" alt="" />
                                            </figure>
                                        </div>
                                        <div class="col-9 col-xs-10 col-md-4 mb-3 mb-md-0">
                                            <p class="mb-0">Titan Watch</p>
                                            <p class="text-secondary small">1 item - SKUID: SH02631...</p>
                                        </div>
                                        <div class="col">
                                            <p class="mb-0">43.00</p>
                                            <p class="text-secondary small">USD</p>
                                        </div>
                                        <div class="col">
                                            <p class="mb-0">Status</p>
                                            <p class="text-secondary small">Invoiced</p>
                                        </div>
                                        <div class="col">
                                            <p class="mb-0">Payment</p>
                                            <p class="text-green small"><span class="badge badge-light text-bg-theme-1 theme-orange">COD</span></p>
                                        </div>
                                        <div class="col-auto">
                                            <div class="dropdown d-inline-block">
                                                <a class="text-secondary no-caret dropdown-toggle" data-bs-toggle="dropdown" aria-expanded="false" data-bs-display="static" role="button">
                                                    <i class="bi bi-three-dots"></i>
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
                                <div class="card-footer border-top">
                                    <ul class="progress-stepbar">
                                        <li class="completed"><span>Order Placed</span></li>
                                        <li class="completed"><span>Packed</span></li>
                                        <li class="stop"><span>Invoiced</span></li>
                                        <li class=""><span>Shipped</span></li>
                                        <li><span>Delivered</span></li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="tab-pane fade" id="analytics" role="tabpanel" aria-labelledby="analytics-tab">
                    <div class="row gx-3 gx-lg-4">
                        <div class="col-12 col-md-12 col-lg-6">
                            <div class="card adminuiux-card mb-3 mb-lg-4">
                                <div class="card-body">
                                    <div class="row align-items-center mb-3 mb-lg-4">
                                        <div class="col-auto">
                                            <div class="avatar avatar-100 position-relative z-index-0">
                                                <div class="position-absolute start-50 top-50 translate-middle text-center z-index-0">
                                                    <div class="text-center lh-20 w-100">
                                                        <h6 class="mb-0">46</h6>
                                                        <p class="text-secondary small">Total</p>
                                                    </div>
                                                </div>
                                                <app-doughnut-chartjs-100 id="doughnutchart" class="avatar avatar-100 d-block position-relative z-index-1"></app-doughnut-chartjs-100>
                                            </div>
                                        </div>
                                        <div class="col">
                                            <p class="mb-2"><span class="avatar avatar-10 rounded-circle bg-red me-1"></span> 12 UI/UX</p>
                                            <p class="mb-2"><span class="avatar avatar-10 rounded-circle bg-yellow me-1"></span> 20 Development</p>
                                            <p><span class="avatar avatar-10 rounded-circle bg-blue me-1"></span> 14 Business Development</p>
                                        </div>
                                    </div>
                                    <app-bar-green-chartjs-100 class="height-160 w-100 d-block"></app-bar-green-chartjs-100>
                                </div>
                            </div>
                        </div>
                        <div class="col-12 col-md-12 col-lg-6">
                            <div class="card adminuiux-card mb-3 mb-lg-4">
                                <div class="card-body">
                                    <div class="row align-items-center mb-3 mb-lg-4">
                                        <div class="col-auto">
                                            <div class="avatar avatar-100 position-relative z-index-0">
                                                <div class="position-absolute start-50 top-50 translate-middle text-center z-index-0">
                                                    <div class="text-center lh-20 w-100">
                                                        <h6 class="mb-0">46</h6>
                                                        <p class="text-secondary small">Total</p>
                                                    </div>
                                                </div>
                                                <app-doughnut-chartjs-100-2 id="doughnutchart" class="avatar avatar-100 d-block position-relative z-index-1"></app-doughnut-chartjs-100-2>
                                            </div>
                                        </div>
                                        <div class="col">
                                            <p class="mb-2"><span class="avatar avatar-10 rounded-circle bg-red me-1"></span> 12 UI/UX</p>
                                            <p class="mb-2"><span class="avatar avatar-10 rounded-circle bg-yellow me-1"></span> 20 Development</p>
                                            <p><span class="avatar avatar-10 rounded-circle bg-blue me-1"></span> 14 Business Development</p>
                                        </div>
                                    </div>
                                    <app-bar-red-chartjs-100 class="height-160 w-100 d-block"></app-bar-red-chartjs-100>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="row gx-3 mb-3 mb-lg-4">
                        <div class="col text-center py-3">
                            <h4>All of your <span class="text-gradient">Budget</span> target</h4>
                            <p class="text-secondary">Keep your profile with upto date details</p>
                        </div>
                    </div>

                    <div class="row gx-3 gx-lg-4">
                        <div class="col-12 col-md-6 col-lg-4">
                            <!-- targets and progress -->
                            <div class="card adminuiux-card position-relative mb-3 mb-lg-4">
                                <div class="coverimg position-absolute end-0 top-0 h-100 w-25 rounded">
                                    <img src="assets/img/modern-ai-image/tree-4.jpg" alt="" />
                                </div>
                                <div class="row gx-3">
                                    <div class="col-9">
                                        <div class="card adminuiux-card shadow-none">
                                            <div class="card-body">
                                                <div class="row gx-3">
                                                    <div class="col-auto">
                                                        <div class="rounded bg-theme-1 text-white px-3 py-2">
                                                            <i class="bi bi-building mb-1"></i>
                                                            <p class="opacity-75 small mb-1">Annual<br />Income</p>
                                                            <h6>$2542</h6>
                                                        </div>
                                                    </div>
                                                    <div class="col align-self-center">
                                                        <p class="text-secondary small mb-0">United States</p>
                                                        <p>New York</p>
                                                        <div class="mt-4">
                                                            <div class="progress height-dynamic mb-1 bg-theme-1-subtle text-theme-1" style="--h-dynamic:5px">
                                                                <div class="progress-bar bg-theme-1" role="progressbar" style="width: 45%" aria-valuenow="45" aria-valuemin="0" aria-valuemax="100"></div>
                                                            </div>
                                                        </div>
                                                        <p class="small text-secondary">Targeted <span class="float-end">$ 11600</span></p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="col-3 position-relative"></div>
                                </div>
                            </div>
                        </div>
                        <div class="col-12 col-md-6 col-lg-4">
                            <div class="card adminuiux-card mb-3 mb-lg-4">
                                <div class="card-body">
                                    <div class="row gx-3">
                                        <div class="col-auto">
                                            <div class="rounded bg-theme-1 text-white px-3 py-2">
                                                <i class="bi bi-bank mb-1"></i>
                                                <p class="opacity-75 small mb-1">Assets<br />Income</p>
                                                <h6>$2542</h6>
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
                                                <div class="progress height-dynamic mb-1 bg-theme-1-subtle text-theme-1" style="--h-dynamic:5px">
                                                    <div class="progress-bar bg-theme-1" role="progressbar" style="width: 45%" aria-valuenow="45" aria-valuemin="0" aria-valuemax="100"></div>
                                                </div>
                                            </div>
                                            <p class="small text-secondary">Targeted Orders<span class="float-end">260</span></p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="col-12 col-md-6 col-lg-4">
                            <div class="card adminuiux-card mb-3 mb-lg-4 theme-teal">
                                <div class="card-body">
                                    <div class="row gx-3">
                                        <div class="col-auto">
                                            <div class="rounded bg-theme-1 text-white px-3 py-2">
                                                <i class="bi bi-bank mb-1"></i>
                                                <p class="opacity-75 small mb-1">Assets<br />Income</p>
                                                <h6>$2542</h6>
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
                                                <div class="progress height-dynamic mb-1 bg-theme-1-subtle text-theme-1" style="--h-dynamic:5px">
                                                    <div class="progress-bar bg-theme-1" role="progressbar" style="width: 45%" aria-valuenow="45" aria-valuemin="0" aria-valuemax="100"></div>
                                                </div>
                                            </div>
                                            <p class="small text-secondary">Targeted Orders<span class="float-end">260</span></p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="row gx-3 gx-lg-4">
                        <!--charts category summary-->
                        <div class="col-12 col-md-6 col-lg-3">
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
                                                36.00 <span class="text-green"><i class="bi bi-arrow-up fs-10"></i>3.15%</span>
                                            </p>
                                        </div>
                                        <div class="col-auto">
                                            <app-circle-progress-blue class="avatar avatar-60 rounded-circle"></app-circle-progress-blue>
                                        </div>
                                    </div>
                                </div>
                                <div class="card-body p-0">
                                    <app-area-blue-chartjs-60 class="height-70 d-block mb-1" id="areachartblue1"></app-area-blue-chartjs-60>
                                </div>
                            </div>
                        </div>
                        <div class="col-12 col-md-6 col-lg-3">
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
                                                126.00 <span class="text-green"><i class="bi bi-arrow-up fs-10"></i>3.15%</span>
                                            </p>
                                        </div>
                                        <div class="col-auto">
                                            <app-circle-progress-green class="avatar avatar-60 rounded-circle"></app-circle-progress-green>
                                        </div>
                                    </div>
                                </div>
                                <div class="card-body p-0">
                                    <app-area-green-chartjs-60 class="height-70 d-block mb-1" id="areachartgreen1"></app-area-green-chartjs-60>
                                </div>
                            </div>
                        </div>
                        <div class="col-12 col-md-6 col-lg-3">
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
                                                141.00 <span class="text-green"><i class="bi bi-arrow-up fs-10"></i>4.13%</span>
                                            </p>
                                        </div>
                                        <div class="col-auto">
                                            <app-circle-progress-yellow class="avatar avatar-60 rounded-circle"></app-circle-progress-yellow>
                                        </div>
                                    </div>
                                </div>
                                <div class="card-body p-0">
                                    <app-area-yellow-chartjs-60 class="height-70 d-block mb-1" id="areachartgreen1"></app-area-yellow-chartjs-60>
                                </div>
                            </div>
                        </div>
                        <div class="col-12 col-md-6 col-lg-3">
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
                                                11.00 <span class="text-green"><i class="bi bi-arrow-up fs-10"></i>3.05%</span>
                                            </p>
                                        </div>
                                        <div class="col-auto">
                                            <app-circle-progress-red class="avatar avatar-60 rounded-circle"></app-circle-progress-red>
                                        </div>
                                    </div>
                                </div>
                                <div class="card-body p-0">
                                    <app-area-red-chartjs-60 class="height-70 d-block mb-1" id="areachartgreen1"></app-area-red-chartjs-60>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="row gx-3 gx-lg-4">
                        <!-- Tweet stats card -->
                        <div class="col-12 col-md-6 col-lg-6 col-xl-4 col-xxl-3">
                            <div class="card adminuiux-card bg-theme-r-gradient text-white mb-4">
                                <div class="card-header bg-none">
                                    <div class="row gx-3 align-items-center">
                                        <div class="col-auto">
                                            <i class="bi bi-binoculars h5 avatar avatar-40 bg-white-opacity text-white rounded"></i>
                                        </div>
                                        <div class="col">
                                            <h6 class="mb-0">Top Attraction</h6>
                                            <p class="opacity-75">This year</p>
                                        </div>
                                    </div>
                                </div>
                                <div class="card-body pb-0">
                                    <div class="row gx-3 align-items-center">
                                        <div class="col-auto mb-3">
                                            <i class="bi bi-twitter h1 avatar avatar-70 bg-cyan rounded mb-0"> </i>
                                        </div>
                                        <div class="col mb-3">
                                            <p class="opacity-75 small mb-1">Engaged Audience</p>
                                            <h5 class="mb-0">2,545,05</h5>
                                            <p class="small">(1.83%)</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="col-12 col-md-6 col-lg-6 col-xl-4 col-xxl-3">
                            <div class="card adminuiux-card mb-3 mb-lg-4">
                                <div class="card-body pb-0">
                                    <div class="row gx-3 align-items-center">
                                        <div class="col-4 col-md-3 col-lg-4 col-xl-4 col-xxl-5 mb-3">
                                            <figure class="coverimg rounded w-100 height-80 mb-0">
                                                <img src="assets/img/modern-ai-image/pet-4.jpg" alt="" class="mw-100" />
                                            </figure>
                                        </div>
                                        <div class="col mb-3">
                                            <p class="text-secondary small mb-0">Boosted Post</p>
                                            <h5 class="mb-1">2,545,05</h5>
                                            <p class="text-secondary small">People Reached</p>
                                        </div>
                                    </div>
                                    <div class="row gx-3">
                                        <div class="col mb-3">
                                            <p class="text-secondary small mb-0">Likes</p>
                                            <h6>65.35 k</h6>
                                        </div>
                                        <div class="col mb-3">
                                            <p class="text-secondary small mb-0">Retweet</p>
                                            <h6>12.5 k</h6>
                                        </div>
                                        <div class="col mb-3">
                                            <p class="text-secondary small mb-0">Clicks</p>
                                            <h6>85.01 k</h6>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <!--charts category summary-->
                        <div class="col-12 col-md-6 col-lg-6 col-xl-4 col-xxl-3">
                            <div class="card adminuiux-card mb-3 mb-lg-4">
                                <div class="card-header ">
                                    <div class="row gx-3 align-items-center">
                                        <div class="col-auto">
                                            <i class="bi bi-linkedin h5 avatar avatar-40 bg-theme-1-subtle text-theme-1 theme-blue rounded"></i>
                                        </div>
                                        <div class="col">
                                            <div class="row mb-0">
                                                <div class="col">
                                                    <p class="text-secondary small">Linkedin</p>
                                                </div>
                                                <div class="col-auto">
                                                    <p class="text-red small">-1.58%</p>
                                                </div>
                                            </div>
                                            <h6>1.8M <small>Connections</small></h6>
                                        </div>
                                    </div>
                                </div>
                                <div class="card-body pb-0 pt-1">
                                    <div class="row gx-3 align-items-center">
                                        <div class="col-12 col-sm-6">
                                            <app-area-blue-chartjs-100 class="height-80 d-block mb-1" id="areachartgreen1"></app-area-blue-chartjs-100>
                                        </div>
                                        <div class="col-12 col-sm-6">
                                            <div class="row gx-2">
                                                <div class="col col-sm-6 mb-2">
                                                    <p class="text-secondary small mb-0">Likes</p>
                                                    <h6>65.35K</h6>
                                                </div>
                                                <div class="col col-sm-6 mb-2">
                                                    <p class="text-secondary small mb-0">Shares</p>
                                                    <h6>12.5K</h6>
                                                </div>
                                                <div class="col col-sm-6 mb-2">
                                                    <p class="text-secondary small mb-0">Reach</p>
                                                    <h6>1.75M</h6>
                                                </div>
                                                <div class="col col-sm-6 mb-2">
                                                    <p class="text-secondary small mb-0">Clicks</p>
                                                    <h6>85.01K</h6>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="col-12 col-md-6 col-lg-6 col-xl-4 col-xxl-3">
                            <div class="card adminuiux-card mb-3 mb-lg-4">
                                <div class="card-header ">
                                    <div class="row gx-3 align-items-center">
                                        <div class="col-auto">
                                            <i class="bi bi-twitter h5 avatar avatar-40 bg-theme-1-subtle text-theme-1 theme-cyan rounded"></i>
                                        </div>
                                        <div class="col">
                                            <div class="row mb-0">
                                                <div class="col">
                                                    <p class="text-secondary small">Twitter</p>
                                                </div>
                                                <div class="col-auto">
                                                    <p class="text-green small">2.15%</p>
                                                </div>
                                            </div>
                                            <h6>1.75M <small>Connections</small></h6>
                                        </div>
                                    </div>
                                </div>
                                <div class="card-body pb-0 pt-1">
                                    <div class="row gx-3 align-items-center">
                                        <div class="col-12 col-sm-6">
                                            <app-area-cyan-chartjs-60 class="height-80 d-block mb-1" id="areachartgreen1"></app-area-cyan-chartjs-60>
                                        </div>
                                        <div class="col-12 col-sm-6">
                                            <div class="row gx-2">
                                                <div class="col col-sm-6 mb-2">
                                                    <p class="text-secondary small mb-0">Likes</p>
                                                    <h6>65.35k</h6>
                                                </div>
                                                <div class="col col-sm-6 mb-2">
                                                    <p class="text-secondary small mb-0">Shares</p>
                                                    <h6>12.5k</h6>
                                                </div>
                                                <div class="col col-sm-6 mb-2">
                                                    <p class="text-secondary small mb-0">Reach</p>
                                                    <h6>1.75m</h6>
                                                </div>
                                                <div class="col col-sm-6 mb-2">
                                                    <p class="text-secondary small mb-0">Clicks</p>
                                                    <h6>85.01k</h6>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="tab-pane fade" id="payments" role="tabpanel" aria-labelledby="payments-tab">
                    <div class="row gx-3 align-items-center mb-3">
                        <div class="col-auto">
                            <i class="bi bi-credit-card h5 avatar avatar-40 bg-theme-1-subtle text-theme-1 rounded"></i>
                        </div>
                        <div class="col">
                            <h6 class="mb-0">Saved Cards</h6>
                            <p class="small text-secondary">Manage your credit cards</p>
                        </div>
                        <div class="col-auto">
                            <a href="" class="btn btn-link btn-sm"><i class="bi bi-plus vm me-2"></i>Add Credit Card</a>
                        </div>
                    </div>

                    <!-- Credit cards carousel card -->
                    <swiper-container slides-per-view="auto" space-between="16" autoplay="true" class="swiper swipernav overflow-visible">
                        <swiper-slide class="width-280">
                            <div class="card adminuiux-card mb-3 mb-lg-4">
                                <div class="card-body">
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
                                    <div class="row gx-3">
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
                            </div>
                        </swiper-slide>
                        <swiper-slide class="width-280">
                            <div class="card adminuiux-card mb-3 mb-lg-4">
                                <div class="card-body">
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
                                    <div class="row gx-3">
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
                            </div>
                        </swiper-slide>
                        <swiper-slide class="width-280">
                            <div class="card adminuiux-card mb-3 mb-lg-4">
                                <div class="card-body">
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
                                    <div class="row gx-3">
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
                            </div>
                        </swiper-slide>
                    </swiper-container>
                </div>
            </div>
        </div>
    `,
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class ProfileAnalyticalComponent {
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
    }
}
