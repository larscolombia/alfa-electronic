import { Component, OnInit, AfterViewInit, AfterContentChecked, OnDestroy, ViewChild, ElementRef, CUSTOM_ELEMENTS_SCHEMA } from "@angular/core";
import { RouterLink } from "@angular/router";
import Choices, { ClassNames } from "choices.js";
import DataTable from "datatables.net-dt";
import "datatables.net-responsive-dt";

import { DaterangePickerRangesComponent } from "../../../components/input-fields/daterange-picker/daterange-picker-ranges.component";
import { BankBannerChartComponent } from "../../../components/charts/bank-banner-chart.component";
import { SemiDoughnutChartjs180Component } from "../../../components/charts/semi-doughnut-chartjs-180.component";

@Component({
    selector: "app-my-earning",
    standalone: true,
    imports: [RouterLink, DaterangePickerRangesComponent, BankBannerChartComponent, SemiDoughnutChartjs180Component],
    template: `
        <!-- page title -->
        <div class="container-fluid py-3">
            <div class="row gx-3 gx-lg-4 align-items-center page-title">
                <div class="col col-sm mb-3 mb-sm-0 order-1">
                    <h5 class="mb-0">Earning</h5>
                    <p class="text-secondary small">Earning summary helps you to grow more...</p>
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
                    <li class="breadcrumb-item bi"><a routerLink="/app/my-profile"> My Profile</a></li>
                    <li class="breadcrumb-item bi active" aria-current="page">Earning</li>
                </ol>
            </nav>
        </div>

        <!-- content -->
        <div class="container mt-3" id="main-content">
            <div class="row gx-3 gx-lg-4">
                <div class="col-6 col-lg-6 col-xxl-3">
                    <div class="card adminuiux-card mb-3 mb-lg-4">
                        <div class="card-body">
                            <div class="avatar avatar-60 text-center rounded bg-info-subtle text-info-emphasis mb-3"><i class="bi bi-wallet h4"></i></div>
                            <h4 class="mb-0">$ 980.00</h4>
                            <p class="text-secondary small">Current Account Balance</p>
                        </div>
                    </div>
                </div>
                <div class="col-6 col-lg-6 col-xxl-3">
                    <div class="card adminuiux-card mb-3 mb-lg-4">
                        <div class="card-body">
                            <div class="avatar avatar-60 text-center rounded bg-success-subtle text-success-emphasis mb-3"><i class="bi bi-cash-stack h4"></i></div>
                            <h4 class="mb-0">$ 2820.00</h4>
                            <p class="text-secondary small">
                                Total Total Earning <span class="text-success">4% <i class="bi bi-arrow-up"></i></span>
                            </p>
                        </div>
                    </div>
                </div>
                <div class="col-6 col-lg-6 col-xxl-3">
                    <div class="card adminuiux-card mb-3 mb-lg-4">
                        <div class="card-body">
                            <div class="avatar avatar-60 text-center rounded bg-warning-subtle text-warning-emphasis mb-3"><i class="bi bi-hourglass-bottom h4"></i></div>
                            <h4 class="mb-0">$ 645.00</h4>
                            <p class="text-secondary small">Payment Pending</p>
                        </div>
                    </div>
                </div>
                <div class="col-6 col-lg-6 col-xxl-3">
                    <div class="card adminuiux-card mb-3 mb-lg-4">
                        <div class="card-body">
                            <div class="avatar avatar-60 text-center rounded bg-primary-subtle text-primary-emphasis mb-3"><i class="bi bi-calendar-week h4"></i></div>
                            <h4 class="mb-0">$ 980.00</h4>
                            <p class="text-secondary small">Next Payout on 2 July 2024</p>
                        </div>
                    </div>
                </div>
            </div>

            <div class="row gx-3 gx-lg-4">
                <div class="col-12 col-lg-9 mb-3 mb-lg-0">
                    <div class="card adminuiux-card overflow-hidden mb-4">
                        <div class="card-header">
                            <h6 class="mb-0">Earning Statistics</h6>
                            <p class="small"><span class="text-secondary">Total money received as income source</span></p>
                        </div>
                        <div class="card-body">
                            <app-bank-banner-chart class="height-260 d-block mb-3"></app-bank-banner-chart>
                            <div class="row gx-3 align-items-center">
                                <div class="col-6 col-md-6 col-lg-4 col-xl-3 mb-1">
                                    <h4 class="mb-1">$5560.50</h4>
                                    <p class="small text-secondary">
                                        Earning <span class="text-success"><i class="bi bi-arrow-up"></i> 11.5%</span>
                                    </p>
                                </div>
                                <div class="col-6 col-md-6 col-lg-4 col-xl-3 mb-1">
                                    <h4 class="mb-1">$4146.50</h4>
                                    <p class="small text-secondary">
                                        Last Duration <span class="text-success"><i class="bi bi-arrow-up"></i> 3.65%</span>
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-12 col-lg-3">
                    <div class="card adminuiux-card overflow-hidden mb-4">
                        <div class="card-header">
                            <h6 class="mb-0">Expense by Category</h6>
                            <p class="small"><span class="text-secondary">Payments for bills and salaries</span></p>
                        </div>
                        <div class="card-body pb-0">
                            <div class="height-140 w-100 position-relative text-center mb-2">
                                <div class="position-absolute bottom-0 mx-auto start-50 translate-middle">
                                    <p class="text-secondary small mb-0">Total Expense</p>
                                    <h5>5.4k <small>USD</small></h5>
                                </div>
                                <div height-140 w-100 position-relative mb-2>
                                    <app-semi-doughnut-chartjs-180 class="avatar avatar-200 position-relative d-block mx-auto"> </app-semi-doughnut-chartjs-180>
                                </div>
                            </div>
                            <div class="row gx-3">
                                <div class="col-6 col-md-6 mb-4">
                                    <p class="text-secondary small mb-2"><span class="me-1 avatar avatar-10 rounded bg-green"></span> Salary</p>
                                    <h5 class="ps-3">
                                        $ 165.52k <span class="text-success fs-14 fw-normal"><i class="bi bi-caret-up-fill me-1 fs-14"></i> 25.30%</span>
                                    </h5>
                                </div>
                                <div class="col-6 col-md-6 mb-4">
                                    <p class="text-secondary small mb-2"><span class="me-1 avatar avatar-10 rounded bg-yellow"></span> Electricity</p>
                                    <h5 class="ps-3">
                                        $ 265.85k <span class="text-success fs-14 fw-normal"><i class="bi bi-caret-up-fill me-1"></i> 21.42%</span>
                                    </h5>
                                </div>
                                <div class="col-6 col-md-6 mb-4">
                                    <p class="text-secondary small mb-2"><span class="me-1 avatar avatar-10 rounded bg-orange"></span> Food</p>
                                    <h5 class="ps-3">
                                        $ 356.26k <span class="text-success fs-14 fw-normal"><i class="bi bi-caret-up-fill me-1"></i> 20.18%</span>
                                    </h5>
                                </div>
                                <div class="col-6 col-md-6 mb-4">
                                    <p class="text-secondary small mb-2"><span class="me-1 avatar avatar-10 rounded bg-purple"></span> Maintanance</p>
                                    <h5 class="ps-3">
                                        $ 185.65 <span class="text-success fs-14 fw-normal"><i class="bi bi-caret-up-fill me-1"></i> 15.65%</span>
                                    </h5>
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
                                    <h6 class="mb-0">Transactions</h6>
                                    <p class="text-secondary small">All transaction at one place</p>
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
export class MyEarningComponent {
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
