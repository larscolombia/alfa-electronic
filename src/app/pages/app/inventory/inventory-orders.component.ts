import { Component, OnInit, AfterViewInit, AfterContentChecked, OnDestroy, ViewChild, ElementRef, CUSTOM_ELEMENTS_SCHEMA } from "@angular/core";
import { RouterLink } from "@angular/router";
import Choices, { ClassNames } from "choices.js";
import DataTable from "datatables.net-dt";
import "datatables.net-responsive-dt";
import { DaterangePickerRangesComponent } from "../../../components/input-fields/daterange-picker/daterange-picker-ranges.component";
import { PolarAreaChartjs180Component } from "../../../components/charts/polararea-chartjs-180.component";

@Component({
    selector: "app-inventory-orders",
    standalone: true,
    imports: [RouterLink, DaterangePickerRangesComponent, PolarAreaChartjs180Component],
    template: `
        <!-- page title -->
        <div class="container-fluid py-3">
            <div class="row gx-3 gx-lg-4 align-items-center page-title">
                <div class="col col-sm mb-3 mb-sm-0 order-1">
                    <h5 class="mb-0">Product Orders</h5>
                    <p class="text-secondary small">Order tracking and Customer statistics review</p>
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
                    <li class="breadcrumb-item bi active" aria-current="page">Orders</li>
                </ol>
            </nav>
        </div>

        <!-- content -->
        <div class="container mt-3" id="main-content">
            <!-- Orders -->
            <div class="card adminuiux-card mb-3 mb-lg-4">
                <div class="card-body">
                    <div class="row mb-3">
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
                    <table class="table" id="dataTable">
                        <thead>
                            <tr>
                                <th class="all">Product</th>
                                <th class="desktop">Category</th>
                                <th class="desktop">Price</th>
                                <th class="none">Order by</th>
                                <th class="desktop">Date</th>
                                <th class="tablet desktop">Status</th>
                                <th class="none" data-title="Details">Details</th>
                                <th class="desktop">Payment</th>
                                <th class="all">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr class="dt-hasChild dtr-expanded">
                                <td>
                                    <div class="row gx-3 align-items-center">
                                        <div class="col-auto">
                                            <figure class="avatar avatar-40 border mb-0 coverimg rounded">
                                                <img src="assets/img/adminux/product-1.jpg" alt="" />
                                            </figure>
                                        </div>
                                        <a routerLink="/app/inventory-order-details" class="col style-none">
                                            <p class="mb-0">Young Shoes</p>
                                            <p class="text-secondary small">2 items, SKUID: SH02521...</p>
                                        </a>
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
                                    <div class="row gx-3 align-items-center my-3">
                                        <div class="col-auto">
                                            <figure class="avatar avatar-40 mb-0 coverimg rounded-circle">
                                                <img src="assets/img/modern-ai-image/user-2.jpg" alt="" />
                                            </figure>
                                        </div>
                                        <div class="col">
                                            <p class="mb-0">Jenny Johnson</p>
                                            <p class="text-secondary small">john&#64;gmailtestid.com</p>
                                        </div>
                                    </div>
                                </td>
                                <td>
                                    <p class="mb-0">20-1-2022</p>
                                    <p class="text-secondary small">9:00 am</p>
                                </td>
                                <td>On the way</td>
                                <td>
                                    <div class="row gx-3 mt-3">
                                        <div class="col-12 col-md-5 col-lg-4 col-xl-3">
                                            <div class="card adminuiux-card bg-transparent border text-center mb-3">
                                                <div class="card-body">
                                                    <div class="row gx-3 align-items-center">
                                                        <div class="col-12 ">
                                                            <figure class="avatar avatar-100 mb-0 coverimg rounded-circle mx-auto mb-3">
                                                                <img src="assets/img/modern-ai-image/user-2.jpg" alt="" />
                                                            </figure>
                                                        </div>
                                                        <div class="col-12">
                                                            <h5>Jenny Johnson</h5>
                                                            <p class="text-secondary mb-1"><a href="mailto:john&#64;gmailtestid.com">john&#64;gmailtestid.com</a></p>
                                                            <p class="text-secondary">+52 598689523959</p>
                                                            <h6><i class="bi bi-star-fill text-yellow"></i> 1250 points</h6>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div class="card adminuiux-card bg-transparent border mb-3">
                                                <div class="card-header">
                                                    <div class="row gx-3 align-items-center">
                                                        <div class="col-auto">
                                                            <div class="avatar avatar-40 rounded bg-theme-1-subtle text-theme-1 theme-yellow">
                                                                <i class="bi bi-geo-alt h5"></i>
                                                            </div>
                                                        </div>
                                                        <div class="col">
                                                            <h6 class="mb-0">Address</h6>
                                                            <p class="small text-secondary">Saved addresses</p>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div class="card-body">
                                                    <p class="mb-1"><b>Home:</b></p>
                                                    <p class="mb-3 small text-secondary">Test data 103909 Witamer CR, Niagara Falls, NY 14305, United States</p>

                                                    <p class="mb-1"><b>Office:</b></p>
                                                    <p class="mb-3 small text-secondary">Test data 103909 Witamer CR, Niagara Falls, NY 14305, United States</p>
                                                </div>
                                            </div>
                                            <div class="card adminuiux-card bg-transparent border mb-3">
                                                <div class="card-header">
                                                    <div class="row gx-3 align-items-center">
                                                        <div class="col-auto">
                                                            <div class="avatar avatar-40 rounded bg-theme-1-subtle text-theme-1">
                                                                <i class="bi bi-coin h5"></i>
                                                            </div>
                                                        </div>
                                                        <div class="col">
                                                            <h6 class="mb-0">Payment Method</h6>
                                                            <p class="small text-secondary">Used for payment</p>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div class="card-body">
                                                    <p class="mb-1"><b>Net Banking:</b></p>
                                                    <p class="mb-1">AmericaSpice Bank</p>
                                                    <p class="text-secondary small mb-1">A/C no: 200525XXXXXX5524</p>
                                                    <p class="text-secondary small mb-3 ">Last used: 250 USD transaction made on 26 December 2021</p>

                                                    <p class="mb-1"><b>Credit Card:</b></p>
                                                    <p class="mb-1">Ausis Gold Card</p>
                                                    <p class="text-secondary small mb-1">Card no: 2005 XXXX XXXX 5524</p>
                                                    <p class="text-secondary small mb-3 ">Last used: 125 USD transaction made on 28 December 2021</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="col-12 col-md-7 col-lg-8 col-xl-9">
                                            <div class="card adminuiux-card bg-transparent border mb-3">
                                                <!-- data user -->
                                                <div class="card-body py-0">
                                                    <!-- circular chart statistic user  -->
                                                    <div class="row gx-3">
                                                        <!-- Ordered -->
                                                        <div class="col-12 col-md-6 col-lg-6 col-xxl-3 border-bottom py-3 mb-3">
                                                            <div class="row gx-3 align-items-center mb-3">
                                                                <div class="col-auto">
                                                                    <div class="avatar avatar-40 rounded bg-theme-1-subtle text-theme-1 theme-yellow">
                                                                        <i class="bi bi-bag-check h5"></i>
                                                                    </div>
                                                                </div>
                                                                <div class="col">
                                                                    <h6 class="mb-0">Ordered</h6>
                                                                    <p class="small text-secondary">Last 12 month</p>
                                                                </div>
                                                            </div>
                                                            <h5 class="">3 <small>Units</small></h5>
                                                            <div class="row gx-3">
                                                                <div class="col">
                                                                    <p class="text-secondary small">152 <small>USD</small></p>
                                                                </div>
                                                                <div class="col-auto">
                                                                    <p class="text-secondary small">
                                                                        12.00 <span class="text-theme-1 theme-green"><i class="bi bi-arrow-up"></i>4.15%</span>
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <!-- Delivered  -->
                                                        <div class="col-12 col-md-6 col-lg-3 col-xxl-3 border-start border-bottom py-3 mb-3">
                                                            <div class="row gx-3 align-items-center mb-3">
                                                                <div class="col-auto">
                                                                    <div class="avatar avatar-40 rounded bg-theme-1-subtle text-theme-1 theme-purple">
                                                                        <i class="bi bi-truck h5"></i>
                                                                    </div>
                                                                </div>
                                                                <div class="col">
                                                                    <h6 class="mb-0">Delivered</h6>
                                                                    <p class="small text-secondary">Last 12 month</p>
                                                                </div>
                                                            </div>
                                                            <h5 class="">16 <small>Units</small></h5>
                                                            <div class="row gx-3">
                                                                <div class="col">
                                                                    <p class="text-secondary small">500 <small>USD</small></p>
                                                                </div>
                                                                <div class="col-auto">
                                                                    <p class="text-secondary small">
                                                                        16.00 <span class="text-theme-1 theme-green"><i class="bi bi-arrow-up"></i>4.15%</span>
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <!-- Rejected  -->
                                                        <div class="col-12 col-md-6 col-lg-6 col-xxl-3 border-start border-bottom py-3 mb-3">
                                                            <div class="row gx-3 align-items-center mb-3">
                                                                <div class="col-auto">
                                                                    <div class="avatar avatar-40 rounded bg-theme-1-subtle text-theme-1 theme-pink">
                                                                        <i class="bi bi-star h5"></i>
                                                                    </div>
                                                                </div>
                                                                <div class="col">
                                                                    <h6 class="mb-0">Cashback Points</h6>
                                                                    <p class="small text-secondary">Last 12 month</p>
                                                                </div>
                                                            </div>
                                                            <h5 class="">800 <small>Points</small></h5>
                                                            <div class="row gx-3">
                                                                <div class="col">
                                                                    <p class="text-secondary small">350 <small>USD</small></p>
                                                                </div>
                                                                <div class="col-auto">
                                                                    <p class="text-secondary small">
                                                                        20.00 <span class="text-theme-1 theme-green"><i class="bi bi-arrow-up"></i>4.15%</span>
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <!-- Cashback  -->
                                                        <div class="col-12 col-md-6 col-lg-6 col-xxl-3 border-start border-bottom py-3 mb-3">
                                                            <div class="row gx-3 align-items-center mb-3">
                                                                <div class="col-auto">
                                                                    <div class="avatar avatar-40 rounded bg-theme-1-subtle text-theme-1 theme-red">
                                                                        <i class="bi bi-cart-x h5"></i>
                                                                    </div>
                                                                </div>
                                                                <div class="col">
                                                                    <h6 class="mb-0">Cancelled</h6>
                                                                    <p class="small text-secondary">Last 12 month</p>
                                                                </div>
                                                            </div>
                                                            <h5 class="">5 <small>Units</small></h5>
                                                            <div class="row gx-3">
                                                                <div class="col">
                                                                    <p class="text-secondary small">2510 <small>USD</small></p>
                                                                </div>
                                                                <div class="col-auto">
                                                                    <p class="text-secondary small">
                                                                        21.00 <span class="text-theme-1 theme-green"><i class="bi bi-arrow-up"></i>4.15%</span>
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <!-- title products -->
                                                    <div class="row gx-3 align-items-center mb-3">
                                                        <div class="col-auto">
                                                            <div class="avatar avatar-40 rounded bg-theme-1-subtle text-theme-1 theme-green">
                                                                <i class="bi bi-cart h5"></i>
                                                            </div>
                                                        </div>
                                                        <div class="col">
                                                            <h6 class="mb-0">Current Orders</h6>
                                                            <p class="small text-secondary">1 Order 2 items</p>
                                                        </div>
                                                    </div>
                                                    <!-- Product timeline-->
                                                    <div class="card adminuiux-card bg-transparent border mb-3 z-index-1">
                                                        <div class="card-body">
                                                            <div class="row gx-3 align-items-center">
                                                                <div class="col-auto">
                                                                    <figure class="avatar avatar-50 border mb-0 coverimg rounded">
                                                                        <img src="assets/img/adminux/product-1.jpg" alt="" />
                                                                    </figure>
                                                                </div>
                                                                <div class="col">
                                                                    <p class="mb-0">Shoes</p>
                                                                    <p class="text-secondary small">1 item - SKUID: SH02521...</p>
                                                                </div>
                                                                <div class="col">
                                                                    <p class="mb-0">80.00</p>
                                                                    <p class="text-secondary small">USD</p>
                                                                </div>
                                                                <div class="col">
                                                                    <p class="mb-0">Status</p>
                                                                    <p class=""><span class="badge badge-light badge-sm text-bg-theme-1">Shipped</span></p>
                                                                </div>
                                                                <div class="col">
                                                                    <p class="mb-0">Payment</p>
                                                                    <p><span class="badge badge-sm text-bg-theme-1 theme-green">Paid</span></p>
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
                                                                <li class="stop"><span>Accepted</span></li>
                                                                <li class=""><span>Ready to Ship</span></li>
                                                                <li class=" "><span>Shipped</span></li>
                                                                <li><span>Delivered</span></li>
                                                            </ul>
                                                        </div>
                                                    </div>

                                                    <div class="card adminuiux-card bg-transparent border mb-3">
                                                        <div class="card-body">
                                                            <div class="row gx-3 align-items-center">
                                                                <div class="col-auto">
                                                                    <figure class="avatar avatar-50 border mb-0 coverimg rounded">
                                                                        <img src="assets/img/adminux/product-2.jpg" alt="" />
                                                                    </figure>
                                                                </div>
                                                                <div class="col">
                                                                    <p class="mb-0">Titan Watch</p>
                                                                    <p class="text-secondary small">1 item - SKUID: SH02631...</p>
                                                                </div>
                                                                <div class="col">
                                                                    <p class="mb-0">43.00</p>
                                                                    <p class="text-secondary small">USD</p>
                                                                </div>
                                                                <div class="col">
                                                                    <p class="mb-0">Status</p>
                                                                    <p class=""><span class="badge badge-light badge-sm text-bg-theme-1">Invoiced</span></p>
                                                                </div>
                                                                <div class="col">
                                                                    <p class="mb-0">Payment</p>
                                                                    <p><span class="badge badge-sm text-bg-theme-1 theme-green">Paid</span></p>
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
                                                                <li class="stop"><span>Accepted</span></li>
                                                                <li class=""><span>Ready to Ship</span></li>
                                                                <li class=" "><span>Shipped</span></li>
                                                                <li><span>Delivered</span></li>
                                                            </ul>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="row gx-3 ">
                                        <div class="col-12 text-center">
                                            <a routerLink="/app/inventory-order-details" class="btn btn-link">View more details</a>
                                        </div>
                                    </div>
                                </td>
                                <td>
                                    <span class="badge badge-sm bg-green">Paid</span>
                                </td>
                                <td class="z-index-5">
                                    <a routerLink="/app/inventory-order-details" class="btn btn-square btn-link mx-1"><i class="bi bi-eye"></i></a>
                                    <div class="dropdown d-inline-block">
                                        <a class="btn btn-square btn-link no-caret dropdown-toggle" data-bs-toggle="dropdown" aria-expanded="false" data-bs-display="static" role="button">
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
                                    <div class="row gx-3 align-items-center">
                                        <div class="col-auto">
                                            <figure class="avatar avatar-40 mb-0 coverimg rounded-circle">
                                                <img src="assets/img/modern-ai-image/user-2.jpg" alt="" />
                                            </figure>
                                        </div>
                                        <div class="col">
                                            <p class="mb-0">John Johnson</p>
                                            <p class="text-secondary small">john&#64;gmailtestid.com</p>
                                        </div>
                                    </div>
                                </td>
                                <td>
                                    <p class="mb-0">20-1-2022</p>
                                    <p class="text-secondary small">10:05 am</p>
                                </td>
                                <td>Delivered</td>
                                <td>
                                    <p class="mb-1">Lat: 5.678167, Long: 12.078613</p>
                                    <p class="text-secondary small">This can be a map also</p>
                                </td>
                                <td>
                                    <span class="badge badge-sm bg-green">Paid</span>
                                </td>
                                <td>
                                    <a routerLink="/app/inventory-order-details" class="btn btn-square btn-link mx-1"><i class="bi bi-eye"></i></a>
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
                                    <div class="row gx-3 align-items-center">
                                        <div class="col-auto">
                                            <figure class="avatar avatar-40 mb-0 coverimg rounded-circle">
                                                <img src="assets/img/modern-ai-image/user-2.jpg" alt="" />
                                            </figure>
                                        </div>
                                        <div class="col">
                                            <p class="mb-0">John Johnson</p>
                                            <p class="text-secondary small">john&#64;gmailtestid.com</p>
                                        </div>
                                    </div>
                                </td>
                                <td>
                                    <p class="mb-0">20-1-2022</p>
                                    <p class="text-secondary small">9:00 am</p>
                                </td>
                                <td>Delivered</td>
                                <td>
                                    <p class="mb-1">Lat: 5.678167, Long: 12.078613</p>
                                    <p class="text-secondary small">This can be a map also</p>
                                </td>
                                <td>
                                    <span class="badge badge-sm bg-theme-1 theme-blue">Waiting</span>
                                </td>
                                <td>
                                    <a routerLink="/app/inventory-order-details" class="btn btn-square btn-link mx-1"><i class="bi bi-eye"></i></a>
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
                                    <div class="row gx-3 align-items-center">
                                        <div class="col-auto">
                                            <figure class="avatar avatar-40 mb-0 coverimg rounded-circle">
                                                <img src="assets/img/modern-ai-image/user-2.jpg" alt="" />
                                            </figure>
                                        </div>
                                        <div class="col">
                                            <p class="mb-0">John Johnson</p>
                                            <p class="text-secondary small">john&#64;gmailtestid.com</p>
                                        </div>
                                    </div>
                                </td>
                                <td>
                                    <p class="mb-0">20-1-2022</p>
                                    <p class="text-secondary small">9:00 am</p>
                                </td>
                                <td>Delivered</td>
                                <td>
                                    <p class="mb-1">Lat: 5.678167, Long: 12.078613</p>
                                    <p class="text-secondary small">This can be a map also</p>
                                </td>
                                <td>
                                    <span class="badge badge-sm bg-red">Cancelled</span>
                                </td>
                                <td>
                                    <a routerLink="/app/inventory-order-details" class="btn btn-square btn-link mx-1"><i class="bi bi-eye"></i></a>
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
                                    <div class="row gx-3 align-items-center">
                                        <div class="col-auto">
                                            <figure class="avatar avatar-40 mb-0 coverimg rounded-circle">
                                                <img src="assets/img/modern-ai-image/user-2.jpg" alt="" />
                                            </figure>
                                        </div>
                                        <div class="col">
                                            <p class="mb-0">John Johnson</p>
                                            <p class="text-secondary small">john&#64;gmailtestid.com</p>
                                        </div>
                                    </div>
                                </td>
                                <td>
                                    <p class="mb-0">20-1-2022</p>
                                    <p class="text-secondary small">9:00 am</p>
                                </td>
                                <td>Delivered</td>
                                <td>
                                    <p class="mb-1">Lat: 5.678167, Long: 12.078613</p>
                                    <p class="text-secondary small">This can be a map also</p>
                                </td>
                                <td>
                                    <span class="badge badge-sm bg-yellow">Processing</span>
                                </td>
                                <td>
                                    <a routerLink="/app/inventory-order-details" class="btn btn-square btn-link mx-1"><i class="bi bi-eye"></i></a>
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
                                    <div class="row gx-3 align-items-center">
                                        <div class="col-auto">
                                            <figure class="avatar avatar-40 mb-0 coverimg rounded-circle">
                                                <img src="assets/img/modern-ai-image/user-2.jpg" alt="" />
                                            </figure>
                                        </div>
                                        <div class="col">
                                            <p class="mb-0">John Johnson</p>
                                            <p class="text-secondary small">john&#64;gmailtestid.com</p>
                                        </div>
                                    </div>
                                </td>
                                <td>
                                    <p class="mb-0">20-1-2022</p>
                                    <p class="text-secondary small">9:00 am</p>
                                </td>
                                <td>Delivered</td>
                                <td>
                                    <p class="mb-1">Lat: 5.678167, Long: 12.078613</p>
                                    <p class="text-secondary small">This can be a map also</p>
                                </td>
                                <td>
                                    <span class="badge badge-sm bg-yellow">Processing</span>
                                </td>
                                <td>
                                    <a routerLink="/app/inventory-order-details" class="btn btn-square btn-link mx-1"><i class="bi bi-eye"></i></a>
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
                                    <div class="row gx-3 align-items-center">
                                        <div class="col-auto">
                                            <figure class="avatar avatar-40 mb-0 coverimg rounded-circle">
                                                <img src="assets/img/modern-ai-image/user-2.jpg" alt="" />
                                            </figure>
                                        </div>
                                        <div class="col">
                                            <p class="mb-0">John Johnson</p>
                                            <p class="text-secondary small">john&#64;gmailtestid.com</p>
                                        </div>
                                    </div>
                                </td>
                                <td>
                                    <p class="mb-0">20-1-2022</p>
                                    <p class="text-secondary small">9:00 am</p>
                                </td>
                                <td>Delivered</td>
                                <td>
                                    <p class="mb-1">Lat: 5.678167, Long: 12.078613</p>
                                    <p class="text-secondary small">This can be a map also</p>
                                </td>
                                <td>
                                    <span class="badge badge-sm bg-green">Paid</span>
                                </td>
                                <td>
                                    <a routerLink="/app/inventory-order-details" class="btn btn-square btn-link mx-1"><i class="bi bi-eye"></i></a>
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
                                    <div class="row gx-3 align-items-center">
                                        <div class="col-auto">
                                            <figure class="avatar avatar-40 mb-0 coverimg rounded-circle">
                                                <img src="assets/img/modern-ai-image/user-2.jpg" alt="" />
                                            </figure>
                                        </div>
                                        <div class="col">
                                            <p class="mb-0">John Johnson</p>
                                            <p class="text-secondary small">john&#64;gmailtestid.com</p>
                                        </div>
                                    </div>
                                </td>
                                <td>
                                    <p class="mb-0">20-1-2022</p>
                                    <p class="text-secondary small">10:05 am</p>
                                </td>
                                <td>Delivered</td>
                                <td>
                                    <p class="mb-1">Lat: 5.678167, Long: 12.078613</p>
                                    <p class="text-secondary small">This can be a map also</p>
                                </td>
                                <td>
                                    <span class="badge badge-sm bg-green">Paid</span>
                                </td>
                                <td>
                                    <a routerLink="/app/inventory-order-details" class="btn btn-square btn-link mx-1"><i class="bi bi-eye"></i></a>
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
                                    <div class="row gx-3 align-items-center">
                                        <div class="col-auto">
                                            <figure class="avatar avatar-40 mb-0 coverimg rounded-circle">
                                                <img src="assets/img/modern-ai-image/user-2.jpg" alt="" />
                                            </figure>
                                        </div>
                                        <div class="col">
                                            <p class="mb-0">John Johnson</p>
                                            <p class="text-secondary small">john&#64;gmailtestid.com</p>
                                        </div>
                                    </div>
                                </td>
                                <td>
                                    <p class="mb-0">20-1-2022</p>
                                    <p class="text-secondary small">9:00 am</p>
                                </td>
                                <td>Delivered</td>
                                <td>
                                    <p class="mb-1">Lat: 5.678167, Long: 12.078613</p>
                                    <p class="text-secondary small">This can be a map also</p>
                                </td>
                                <td>
                                    <span class="badge badge-sm bg-theme-1 theme-blue">Waiting</span>
                                </td>
                                <td>
                                    <a routerLink="/app/inventory-order-details" class="btn btn-square btn-link mx-1"><i class="bi bi-eye"></i></a>
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
                                    <div class="row gx-3 align-items-center">
                                        <div class="col-auto">
                                            <figure class="avatar avatar-40 mb-0 coverimg rounded-circle">
                                                <img src="assets/img/modern-ai-image/user-2.jpg" alt="" />
                                            </figure>
                                        </div>
                                        <div class="col">
                                            <p class="mb-0">John Johnson</p>
                                            <p class="text-secondary small">john&#64;gmailtestid.com</p>
                                        </div>
                                    </div>
                                </td>
                                <td>
                                    <p class="mb-0">20-1-2022</p>
                                    <p class="text-secondary small">9:00 am</p>
                                </td>
                                <td>Delivered</td>
                                <td>
                                    <p class="mb-1">Lat: 5.678167, Long: 12.078613</p>
                                    <p class="text-secondary small">This can be a map also</p>
                                </td>
                                <td>
                                    <span class="badge badge-sm bg-red">Cancelled</span>
                                </td>
                                <td>
                                    <a routerLink="/app/inventory-order-details" class="btn btn-square btn-link mx-1"><i class="bi bi-eye"></i></a>
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

            <div class="row gx-3 gx-lg-4 mb-3 mb-lg-4">
                <div class="col text-center py-3">
                    <h4>Be ready to give <span class="text-gradient">Customer support</span> as and when needed</h4>
                    <p class="text-secondary">Whenever customer reach to you for support, treat them as king and provide relevant information with resolution.</p>
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
                                    <h6 class="mb-0">Pay bill</h6>
                                    <p class="small text-secondary">Supplier payments</p>
                                </div>
                            </div>
                        </div>
                        <div class="card-body">
                            <div class="input-group input-group-md rounded mb-2">
                                <span class="input-group-text text-theme-1"><i class="bi bi-person-lines-fill"></i></span>
                                <input class="form-control" type="search" placeholder="Search Supplier" />
                            </div>
                            <input class="form-control form-control-lg fs-2 fw-bold text-center mb-2" type="number" placeholder="0.00" />
                            <div class="row gx-3 align-items-center">
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
                                        <select class="form-control simplechosen">
                                            <option>CA Bank</option>
                                            <option>Larson Bank</option>
                                            <option>Truelance Bank</option>
                                            <option selected>Cabilian Bank</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                            <p class="text-secondary small text-center mb-3">Balance: 966800.00 USD</p>
                            <button class="btn btn-outline-theme w-100">Payout now</button>
                        </div>
                    </div>
                </div>

                <!-- Top Suppliers -->
                <div class="col-12 col-md-12 col-lg-6 col-xxl-3">
                    <div class="card adminuiux-card mb-3 mb-lg-4">
                        <div class="card-header">
                            <div class="row gx-3 align-items-center">
                                <div class="col-auto">
                                    <i class="bi bi-building h5 avatar avatar-40 bg-theme-1-subtle text-theme-1 theme-purple rounded"></i>
                                </div>
                                <div class="col">
                                    <h6 class="mb-0">Top Supplier</h6>
                                    <p class="small text-secondary">Stock providers</p>
                                </div>
                            </div>
                        </div>
                        <div class="card-body px-0 py-1">
                            <ul class="list-group border-0 bg-none">
                                <li class=" list-group-item">
                                    <div class="row gx-3 align-items-center">
                                        <div class="col-auto">
                                            <p class="mb-0">Larsons Ltd.</p>
                                            <p class="text-secondary small">1258 Units</p>
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
                                            <p class="text-secondary small">1150 Units</p>
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
                                            <p class="text-secondary small">1100 Units</p>
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
                                            <p class="text-secondary small">900 Units</p>
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
                                            <p class="text-secondary small">800 Units</p>
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
                                    <h6 class="mb-0">Top Buyers</h6>
                                    <p class="small text-secondary">Our Product Buyers</p>
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
                                            <p class="text-secondary small">250 Units</p>
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
                                            <p class="text-secondary small">140 Units</p>
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
                                            <p class="text-secondary small">120 Units</p>
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
                                            <p class="text-secondary small">100 Units</p>
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
                                            <p class="text-secondary small">800 Units</p>
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
                                    <h6 class="mb-0">Top Categories</h6>
                                    <p class="small text-secondary">Popular in selling</p>
                                </div>
                            </div>
                        </div>
                        <div class="card-body">
                            <app-polararea-chartjs-180 class="avatar avatar-160 mb-3 d-block mx-auto"></app-polararea-chartjs-180>
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
                                            <p class="small text-secondary">Kids Play</p>
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
                                            <p class="small text-secondary">Tools</p>
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
                                            <p class="small text-secondary">Electronics</p>
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
                                            <p class="small text-secondary">Decorative</p>
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
export class InventoryOrdersComponent {
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
