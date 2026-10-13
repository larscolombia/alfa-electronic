import { Component, OnInit, AfterViewInit, AfterContentChecked, OnDestroy, ViewChild, ElementRef, CUSTOM_ELEMENTS_SCHEMA } from "@angular/core";
import { RouterLink } from "@angular/router";
import Choices, { ClassNames } from "choices.js";
import Swiper from "swiper";
import { register } from "swiper/element/bundle";
register();
import DataTable from "datatables.net-dt";
import "datatables.net-responsive-dt";

import { DaterangePickerRangesComponent } from "../../../components/input-fields/daterange-picker/daterange-picker-ranges.component";
import { CircleProgressBlueBlankComponent } from "../../../components/charts/circle-progress-blue-blank.component";
import { CircleProgressRedBlankComponent } from "../../../components/charts/circle-progress-red-blank.component";
import { CircleProgressYellowBlankComponent } from "../../../components/charts/circle-progress-yellow-blank.component";
import { CircleProgressGreenBlankComponent } from "../../../components/charts/circle-progress-green-blank.component";
import { CircleProgressBlueComponent } from "../../../components/charts/circle-progress-blue.component";
import { CircleProgressRedComponent } from "../../../components/charts/circle-progress-red.component";
import { CircleProgressGreenComponent } from "../../../components/charts/circle-progress-green.component";
import { CircleProgressYellowComponent } from "../../../components/charts/circle-progress-yellow.component";
import { AreaBlueChartjs60Component } from "../../../components/charts/area-blue-chartjs-60.component";
import { AreaYellowChartjs60Component } from "../../../components/charts/area-yellow-chartjs-60.component";
import { ArearedChartjs60Component } from "../../../components/charts/area-red-chartjs-60.component";
import { AreaGreenChartjs60Component } from "../../../components/charts/area-green-chartjs-60.component";
import { BarBlueChartjs100Component } from "../../../components/charts/bar-blue-chartjs-100.component";
import { AreaRedChartjs100Component } from "../../../components/charts/area-red-chartjs-100.component";
import { AreaGreenChartjs100Component } from "../../../components/charts/area-green-chartjs-100.component";
import { NetworkBannerChartComponent } from "../../../components/charts/network-banner-chart.component";

@Component({
    selector: "app-network-dashboard",
    standalone: true,
    imports: [
        RouterLink,
        DaterangePickerRangesComponent,
        CircleProgressBlueBlankComponent,
        CircleProgressRedBlankComponent,
        CircleProgressYellowBlankComponent,
        CircleProgressGreenBlankComponent,
        CircleProgressBlueComponent,
        CircleProgressRedComponent,
        CircleProgressGreenComponent,
        CircleProgressYellowComponent,
        AreaBlueChartjs60Component,
        AreaYellowChartjs60Component,
        ArearedChartjs60Component,
        AreaGreenChartjs60Component,
        BarBlueChartjs100Component,
        AreaRedChartjs100Component,
        AreaGreenChartjs100Component,
        NetworkBannerChartComponent,
    ],
    template: `
        <!-- page title -->
        <div class="container-fluid py-3">
            <div class="row gx-3 gx-lg-4 align-items-center page-title">
                <div class="col col-sm mb-3 mb-sm-0 order-1">
                    <h5 class="mb-0">Network Dashboard</h5>
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
                    <li class="breadcrumb-item bi"><a routerLink="/app/dashboard">AdminUX</a></li>
                    <li class="breadcrumb-item bi active" aria-current="page">Network Dashboard</li>
                </ol>
            </nav>
        </div>

        <!-- content -->
        <div class="container mt-3" id="main-content">
            <!-- summary blocks -->
            <div class="row gx-3 gx-lg-4">
                <div class="col-12 col-md-6 col-lg-6 col-xxl-3">
                    <div class="card adminuiux-card mb-3 mb-lg-4">
                        <div class="card-body">
                            <div class="row gx-3 align-items-center">
                                <div class="col-auto">
                                    <div class="avatar avatar-60 rounded-circle">
                                        <app-circle-progress-blue-blank class="avatar avatar-60 rounded-circle"></app-circle-progress-blue-blank>
                                        <div class="avatar avatar-40 h5 bg-theme-1-subtle text-theme-1 position-absolute top-50 start-50 translate-middle rounded-circle">
                                            <i class="bi bi-pc-display-horizontal"></i>
                                        </div>
                                    </div>
                                </div>
                                <div class="col">
                                    <p class="text-secondary small mb-1">Connected Devices</p>
                                    <h5>70250</h5>
                                </div>
                                <div class="col-auto">
                                    <div class="dropdown d-inline-block">
                                        <a class="btn btn-link btn-square dropdown-toggle no-caret" data-bs-toggle="dropdown" aria-expanded="false" data-bs-display="static" role="button">
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
                        <div class="card-footer border-top">
                            <div class="row gx-3">
                                <div class="col-6">
                                    <p class="text-secondary small mb-1">New Users</p>
                                    <h6>5 <small class="fs-12 fw-light text-secondary">This week</small></h6>
                                </div>
                                <div class="col-6 border-start text-end">
                                    <p class="text-secondary small mb-1">Total Users</p>
                                    <h6>65826</h6>
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
                                        <app-circle-progress-green-blank class="avatar avatar-60 rounded-circle"></app-circle-progress-green-blank>
                                        <div class="avatar avatar-40 h5 bg-theme-1-subtle text-theme-1 position-absolute top-50 start-50 translate-middle rounded-circle theme-green">
                                            <i class="bi bi-people"></i>
                                        </div>
                                    </div>
                                </div>
                                <div class="col">
                                    <p class="text-secondary small mb-1">Online Users</p>
                                    <h5>25486</h5>
                                </div>
                                <div class="col-auto">
                                    <div class="dropdown d-inline-block">
                                        <a class="btn btn-link btn-square dropdown-toggle no-caret" data-bs-toggle="dropdown" aria-expanded="false" data-bs-display="static" role="button">
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
                        <div class="card-footer border-top">
                            <div class="row gx-3">
                                <div class="col-6">
                                    <p class="text-secondary small mb-1">New Device</p>
                                    <h6>2 <small class="fs-12 fw-light text-secondary">This week</small></h6>
                                </div>
                                <div class="col-6 border-start text-end">
                                    <p class="text-secondary small mb-1">Total Device</p>
                                    <h6>71521</h6>
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
                                        <div class="avatar avatar-40 h5 bg-theme-1-subtle text-theme-1 position-absolute top-50 start-50 translate-middle rounded-circle theme-yellow">
                                            <i class="bi bi-speedometer"></i>
                                        </div>
                                    </div>
                                </div>
                                <div class="col">
                                    <p class="text-secondary small mb-1">Internet Speed</p>
                                    <h5>
                                        60 <small>Mbps <span class="fw-normal small text-secondary">2hr Avg</span></small>
                                    </h5>
                                </div>
                                <div class="col-auto">
                                    <div class="dropdown d-inline-block">
                                        <a class="btn btn-link btn-square dropdown-toggle no-caret" data-bs-toggle="dropdown" aria-expanded="false" data-bs-display="static" role="button">
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
                        <div class="card-footer border-top">
                            <div class="row gx-3">
                                <div class="col-6">
                                    <p class="text-secondary small mb-1">Hathway</p>
                                    <h6>55.68 Mbps</h6>
                                </div>
                                <div class="col-6 border-start text-end">
                                    <p class="text-secondary small mb-1">AT&T</p>
                                    <h6>70.75 Mbps</h6>
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
                                        <div class="avatar avatar-40 h5 bg-theme-1-subtle text-theme-1 position-absolute top-50 start-50 translate-middle rounded-circle theme-red">
                                            <i class="bi bi-bug"></i>
                                        </div>
                                    </div>
                                </div>
                                <div class="col">
                                    <div class="row gx-0">
                                        <div class="col">
                                            <p class="text-secondary small mb-1">Tickets</p>
                                        </div>
                                        <div class="col-auto">
                                            <p class="text-secondary small mb-1">This week</p>
                                        </div>
                                    </div>
                                    <h5>521</h5>
                                </div>
                                <div class="col-auto">
                                    <div class="dropdown d-inline-block">
                                        <a class="btn btn-link btn-square dropdown-toggle no-caret" data-bs-toggle="dropdown" aria-expanded="false" data-bs-display="static" role="button">
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
                        <div class="card-footer border-top">
                            <div class="row gx-3 gx-lg-4">
                                <div class="col-6">
                                    <p class="text-secondary small mb-1">Resolved</p>
                                    <h6 class="text-theme-1 theme-green">421</h6>
                                </div>
                                <div class="col-6 border-start text-end">
                                    <p class="text-secondary small mb-1">In Progress</p>
                                    <h6 class="text-theme-1 theme-yellow">50</h6>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- network server card -->
            <div class="row gx-3 gx-lg-4">
                <div class="col-12">
                    <div class="card adminuiux-card mb-3 mb-lg-4">
                        <div class="card-header">
                            <div class="row gx-3 align-items-center">
                                <div class="col-auto">
                                    <i class="bi bi-hdd-stack h5 avatar avatar-40 bg-theme-1-subtle text-theme-1 rounded"></i>
                                </div>
                                <div class="col">
                                    <h6 class="mb-0">Server</h6>
                                    <p class="small text-secondary">Uptime 100%</p>
                                </div>
                                <div class="col-4 col-md-5 col-lg-4 col-xl-3 col-xxl-2">
                                    <select class="form-select">
                                        <optgroup label="USA">
                                            <option>New York</option>
                                            <option>Maxico</option>
                                        </optgroup>
                                        <optgroup label="UK">
                                            <option>England</option>
                                            <option>Scotland</option>
                                        </optgroup>
                                        <optgroup label="Asia">
                                            <option>China</option>
                                            <option>India</option>
                                        </optgroup>
                                        <option>Australia</option>
                                        <option>Dubai</option>
                                    </select>
                                </div>
                                <div class="col-auto">
                                    <div class="dropdown d-inline-block">
                                        <a class="btn btn-link btn-square no-caret dropdown-toggle" data-bs-toggle="dropdown" aria-expanded="false" data-bs-display="static" role="button">
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
                        <div class="card-body">
                            <div class="row gx-3">
                                <div class="col-12 col-md-12 col-lg-7 col-xl-8 mb-3 mb-lg-0">
                                    <app-network-banner-chart class="height-300 d-block w-100"></app-network-banner-chart>
                                </div>
                                <div class="col-12 col-md-12 col-lg-5 col-xl-4">
                                    <div class="row gx-3">
                                        <div class="col-12 col-md-6 col-lg-12 mb-3">
                                            <div class="row gx-3 align-items-center">
                                                <div class="col-4">
                                                    <app-area-blue-chartjs-60 class="height-60 w-100 border rounded d-block py-1"></app-area-blue-chartjs-60>
                                                </div>
                                                <div class="col">
                                                    <h5 class="mb-1">Memory</h5>
                                                    <p class="text-secondary small">31.5/32 GB</p>
                                                </div>
                                                <div class="col-auto">
                                                    <div class="avatar avatar-60 rounded-circle">
                                                        <app-circle-progress-blue class="avatar avatar-60 rounded-circle"></app-circle-progress-blue>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="col-12 col-md-6 col-lg-12 mb-3">
                                            <div class="row gx-3 align-items-center">
                                                <div class="col-4">
                                                    <app-area-green-chartjs-60 class="height-60 w-100 border rounded d-block py-1"></app-area-green-chartjs-60>
                                                </div>
                                                <div class="col">
                                                    <h5 class="mb-1">CPU</h5>
                                                    <p class="text-secondary small">45% 3.2GHz</p>
                                                </div>
                                                <div class="col-auto">
                                                    <div class="avatar avatar-60 rounded-circle">
                                                        <app-circle-progress-green class="avatar avatar-60 rounded-circle"></app-circle-progress-green>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="col-12 col-md-6 col-lg-12 mb-3">
                                            <div class="row gx-3 align-items-center">
                                                <div class="col-4">
                                                    <app-area-yellow-chartjs-60 class="height-60 w-100 border rounded d-block py-1"></app-area-yellow-chartjs-60>
                                                </div>
                                                <div class="col">
                                                    <h5 class="mb-1">Network</h5>
                                                    <p class="text-secondary small">6 Gbps</p>
                                                </div>
                                                <div class="col-auto">
                                                    <div class="avatar avatar-60 rounded-circle">
                                                        <app-circle-progress-yellow class="avatar avatar-60 rounded-circle"></app-circle-progress-yellow>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="col-12 col-md-6 col-lg-12">
                                            <div class="row gx-3 align-items-center">
                                                <div class="col-4">
                                                    <app-area-red-chartjs-60 class="height-60 w-100 border rounded d-block py-1"></app-area-red-chartjs-60>
                                                </div>
                                                <div class="col">
                                                    <h5 class="mb-1">WiFi-Hathway</h5>
                                                    <p class="text-secondary small">S: 25.00 R: 60.00 in Mbps</p>
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
                        </div>
                    </div>
                </div>
            </div>

            <div class="row gx-3 gx-lg-4">
                <!-- Devices installation and access -->
                <div class="col-12 col-md-6 col-lg-6 col-xxl-4">
                    <div class="card adminuiux-card mb-3 mb-lg-4">
                        <div class="card-header">
                            <div class="row gx-3 align-items-center">
                                <div class="col-auto">
                                    <i class="bi bi-shield-check h5 avatar avatar-40 bg-theme-1-subtle text-theme-1 theme-green rounded"></i>
                                </div>
                                <div class="col">
                                    <h6 class="mb-0">Secure Surfing</h6>
                                    <p class="text-secondary small">Limited Category Access</p>
                                </div>
                                <div class="col-auto">
                                    <div class="dropdown d-inline-block">
                                        <a class="btn btn-link btn-square text-secondary no-caret dropdown-toggle" data-bs-toggle="dropdown" aria-expanded="false" data-bs-display="static" role="button">
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
                            <table class="table" id="dataTable1">
                                <thead class="d-none">
                                    <tr>
                                        <th class="width-10"></th>
                                        <th class="">Connection</th>
                                        <th class="none width-80">Devices</th>
                                        <th class="none">Status</th>
                                        <th class="none" data-title="Description">Description</th>
                                        <th class="none" data-title="Users">Users</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td class="width-10"></td>
                                        <td>
                                            <div class="row gx-3">
                                                <div class="col-auto">
                                                    <i class="bi bi-wifi avatar avatar-40 bg-theme-1-subtle text-theme-1 rounded"></i>
                                                </div>
                                                <div class="col">
                                                    <p class="mb-1 text-truncated w-100">Meeting Room 1</p>
                                                    <p class="text-secondary small">2.4 GHz | <span class="text-theme-1 theme-green">Active</span></p>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <p class="text-truncated w-100"><b>10</b> <small class="text-secondary">No Jobs, Ads Blocker</small></p>
                                        </td>
                                        <td>
                                            <span class="badge bg-success">Active</span>
                                        </td>
                                        <td>This is located at first floor near B201 room. Assigned for 25-30 employees.</td>
                                        <td>
                                            <div class="row gx-3 align-items-center">
                                                <div class="col-auto avatar-group">
                                                    <figure class="avatar avatar-40 rounded-circle coverimg" data-bs-toggle="tooltip" data-bs-placement="top" title="Shelvey Doe">
                                                        <img src="assets/img/modern-ai-image/user-2.jpg" alt="" />
                                                    </figure>
                                                    <figure class="avatar avatar-40 rounded-circle coverimg" data-bs-toggle="tooltip" data-bs-placement="top" title="Maria Smith">
                                                        <img src="assets/img/modern-ai-image/user-3.jpg" alt="" />
                                                    </figure>
                                                    <figure class="avatar avatar-40 rounded-circle coverimg" data-bs-toggle="tooltip" data-bs-placement="top" title="Steve Branden">
                                                        <img src="assets/img/modern-ai-image/user-4.jpg" alt="" />
                                                    </figure>
                                                </div>
                                                <div class="col-auto">
                                                    <p class="mb-0">18+ users</p>
                                                    <p class="text-secondary small">Connected</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div class="form-check form-switch">
                                                <input class="form-check-input" type="checkbox" role="switch" id="tableactionwifi1" checked="" />
                                                <label class="form-check-label" for="tableactionwifi1"></label>
                                            </div>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td class="width-10"></td>
                                        <td>
                                            <div class="row gx-3">
                                                <div class="col-auto">
                                                    <i class="bi bi-wifi avatar avatar-40 bg-theme-1-subtle text-theme-1 theme-red rounded"></i>
                                                </div>
                                                <div class="col">
                                                    <p class="mb-1 text-truncated w-100">Conference 1</p>
                                                    <p class="text-secondary small">2.4 GHz | <span class="text-theme-1 theme-red">Inactive</span></p>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <p class="text-truncated w-100"><b>4</b> <small class="text-secondary">Portfolio, Internal portal</small></p>
                                        </td>
                                        <td>
                                            <span class="badge bg-red">Inactive</span>
                                        </td>
                                        <td>This is located at 2nd floor Conference room. Assigned for 4 employees who are in meeting.</td>
                                        <td>
                                            <div class="row gx-3 align-items-center">
                                                <div class="col-auto avatar-group">
                                                    <figure class="avatar avatar-40 rounded-circle coverimg" data-bs-toggle="tooltip" data-bs-placement="top" title="Shelvey Doe">
                                                        <img src="assets/img/modern-ai-image/user-2.jpg" alt="" />
                                                    </figure>
                                                    <figure class="avatar avatar-40 rounded-circle coverimg" data-bs-toggle="tooltip" data-bs-placement="top" title="Maria Smith">
                                                        <img src="assets/img/modern-ai-image/user-3.jpg" alt="" />
                                                    </figure>
                                                    <figure class="avatar avatar-40 rounded-circle coverimg" data-bs-toggle="tooltip" data-bs-placement="top" title="Steve Branden">
                                                        <img src="assets/img/modern-ai-image/user-4.jpg" alt="" />
                                                    </figure>
                                                </div>
                                                <div class="col-auto">
                                                    <p class="mb-0">18+ users</p>
                                                    <p class="text-secondary small">Connected</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div class="form-check form-switch">
                                                <input class="form-check-input" type="checkbox" role="switch" id="tableactionwifi2" />
                                                <label class="form-check-label" for="tableactionwifi2"></label>
                                            </div>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td class="width-10"></td>
                                        <td>
                                            <div class="row gx-3">
                                                <div class="col-auto">
                                                    <i class="bi bi-wifi avatar avatar-40 bg-theme-1-subtle text-theme-1 theme-yellow rounded"></i>
                                                </div>
                                                <div class="col">
                                                    <p class="mb-1 text-truncated w-100">Meeting Room 2</p>
                                                    <p class="text-secondary small">1.05 GHz | <span class="text-theme-1 theme-yellow">Idle</span></p>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <p class="text-truncated w-100"><b>5</b> <small class="text-secondary">No Jobs, Ads Blocker</small></p>
                                        </td>
                                        <td>
                                            <span class="badge bg-yellow">Idle</span>
                                        </td>
                                        <td>Waiting room area open network low speed connectivity or visitors.</td>
                                        <td>
                                            <div class="row gx-3 align-items-center">
                                                <div class="col-auto avatar-group">
                                                    <figure class="avatar avatar-40 rounded-circle coverimg" data-bs-toggle="tooltip" data-bs-placement="top" title="Shelvey Doe">
                                                        <img src="assets/img/modern-ai-image/user-2.jpg" alt="" />
                                                    </figure>
                                                    <figure class="avatar avatar-40 rounded-circle coverimg" data-bs-toggle="tooltip" data-bs-placement="top" title="Maria Smith">
                                                        <img src="assets/img/modern-ai-image/user-3.jpg" alt="" />
                                                    </figure>
                                                    <figure class="avatar avatar-40 rounded-circle coverimg" data-bs-toggle="tooltip" data-bs-placement="top" title="Steve Branden">
                                                        <img src="assets/img/modern-ai-image/user-4.jpg" alt="" />
                                                    </figure>
                                                </div>
                                                <div class="col-auto">
                                                    <p class="mb-0">18+ users</p>
                                                    <p class="text-secondary small">Connected</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div class="form-check form-switch">
                                                <input class="form-check-input" type="checkbox" role="switch" id="tableactionwifi3" checked="" />
                                                <label class="form-check-label" for="tableactionwifi3"></label>
                                            </div>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td class="width-10"></td>
                                        <td>
                                            <div class="row gx-3">
                                                <div class="col-auto">
                                                    <i class="bi bi-wifi avatar avatar-40 bg-theme-1-subtle text-theme-1 rounded"></i>
                                                </div>
                                                <div class="col">
                                                    <p class="mb-1 text-truncated w-100">Meeting Room 4</p>
                                                    <p class="text-secondary small">2.4 GHz | <span class="text-theme-1 theme-green">Active</span></p>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <p class="text-truncated w-100"><b>10</b> <small class="text-secondary">No Jobs, Ads Blocker</small></p>
                                        </td>
                                        <td>
                                            <span class="badge bg-success">Active</span>
                                        </td>
                                        <td>This is located at first floor near B201 room. Assigned for 25-30 employees.</td>
                                        <td>
                                            <div class="row gx-3 align-items-center">
                                                <div class="col-auto avatar-group">
                                                    <figure class="avatar avatar-40 rounded-circle coverimg" data-bs-toggle="tooltip" data-bs-placement="top" title="Shelvey Doe">
                                                        <img src="assets/img/modern-ai-image/user-2.jpg" alt="" />
                                                    </figure>
                                                    <figure class="avatar avatar-40 rounded-circle coverimg" data-bs-toggle="tooltip" data-bs-placement="top" title="Maria Smith">
                                                        <img src="assets/img/modern-ai-image/user-3.jpg" alt="" />
                                                    </figure>
                                                    <figure class="avatar avatar-40 rounded-circle coverimg" data-bs-toggle="tooltip" data-bs-placement="top" title="Steve Branden">
                                                        <img src="assets/img/modern-ai-image/user-4.jpg" alt="" />
                                                    </figure>
                                                </div>
                                                <div class="col-auto">
                                                    <p class="mb-0">18+ users</p>
                                                    <p class="text-secondary small">Connected</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div class="form-check form-switch">
                                                <input class="form-check-input" type="checkbox" role="switch" id="tableactionwifi4" checked="" />
                                                <label class="form-check-label" for="tableactionwifi4"></label>
                                            </div>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td class="width-10"></td>
                                        <td>
                                            <div class="row gx-3">
                                                <div class="col-auto">
                                                    <i class="bi bi-wifi avatar avatar-40 bg-theme-1-subtle text-theme-1 rounded"></i>
                                                </div>
                                                <div class="col">
                                                    <p class="mb-1 text-truncated w-100">Meeting Room 1</p>
                                                    <p class="text-secondary small">2.4 GHz | <span class="text-theme-1 theme-green">Active</span></p>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <p class="text-truncated w-100"><b>10</b> <small class="text-secondary">No Jobs, Ads Blocker</small></p>
                                        </td>
                                        <td>
                                            <span class="badge bg-success">Active</span>
                                        </td>
                                        <td>This is located at first floor near B201 room. Assigned for 25-30 employees.</td>
                                        <td>
                                            <div class="row gx-3 align-items-center">
                                                <div class="col-auto avatar-group">
                                                    <figure class="avatar avatar-40 rounded-circle coverimg" data-bs-toggle="tooltip" data-bs-placement="top" title="Shelvey Doe">
                                                        <img src="assets/img/modern-ai-image/user-2.jpg" alt="" />
                                                    </figure>
                                                    <figure class="avatar avatar-40 rounded-circle coverimg" data-bs-toggle="tooltip" data-bs-placement="top" title="Maria Smith">
                                                        <img src="assets/img/modern-ai-image/user-3.jpg" alt="" />
                                                    </figure>
                                                    <figure class="avatar avatar-40 rounded-circle coverimg" data-bs-toggle="tooltip" data-bs-placement="top" title="Steve Branden">
                                                        <img src="assets/img/modern-ai-image/user-4.jpg" alt="" />
                                                    </figure>
                                                </div>
                                                <div class="col-auto">
                                                    <p class="mb-0">18+ users</p>
                                                    <p class="text-secondary small">Connected</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div class="form-check form-switch">
                                                <input class="form-check-input" type="checkbox" role="switch" id="tableactionwifi5" checked="" />
                                                <label class="form-check-label" for="tableactionwifi5"></label>
                                            </div>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td class="width-10"></td>
                                        <td>
                                            <div class="row gx-3">
                                                <div class="col-auto">
                                                    <i class="bi bi-wifi avatar avatar-40 bg-theme-1-subtle text-theme-1 rounded"></i>
                                                </div>
                                                <div class="col">
                                                    <p class="mb-1 text-truncated w-100">Conference 1</p>
                                                    <p class="text-secondary small">2.4 GHz | <span class="text-theme-1 theme-red">Inactive</span></p>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <p class="text-truncated w-100"><b>4</b> <small class="text-secondary">Portfolio, Internal portal</small></p>
                                        </td>
                                        <td>
                                            <span class="badge bg-red">Inactive</span>
                                        </td>
                                        <td>This is located at 2nd floor Conference room. Assigned for 4 employees who are in meeting.</td>
                                        <td>
                                            <div class="row gx-3 align-items-center">
                                                <div class="col-auto avatar-group">
                                                    <figure class="avatar avatar-40 rounded-circle coverimg" data-bs-toggle="tooltip" data-bs-placement="top" title="Shelvey Doe">
                                                        <img src="assets/img/modern-ai-image/user-2.jpg" alt="" />
                                                    </figure>
                                                    <figure class="avatar avatar-40 rounded-circle coverimg" data-bs-toggle="tooltip" data-bs-placement="top" title="Maria Smith">
                                                        <img src="assets/img/modern-ai-image/user-3.jpg" alt="" />
                                                    </figure>
                                                    <figure class="avatar avatar-40 rounded-circle coverimg" data-bs-toggle="tooltip" data-bs-placement="top" title="Steve Branden">
                                                        <img src="assets/img/modern-ai-image/user-4.jpg" alt="" />
                                                    </figure>
                                                </div>
                                                <div class="col-auto">
                                                    <p class="mb-0">18+ users</p>
                                                    <p class="text-secondary small">Connected</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div class="form-check form-switch">
                                                <input class="form-check-input" type="checkbox" role="switch" id="tableactionwifi6" checked="" />
                                                <label class="form-check-label" for="tableactionwifi6"></label>
                                            </div>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td class="width-10"></td>
                                        <td>
                                            <div class="row gx-3">
                                                <div class="col-auto">
                                                    <i class="bi bi-wifi avatar avatar-40 bg-theme-1-subtle text-theme-1 rounded"></i>
                                                </div>
                                                <div class="col">
                                                    <p class="mb-1 text-truncated w-100">Meeting Room 2</p>
                                                    <p class="text-secondary small">1.05 GHz | <span class="text-theme-1 theme-yellow">Idle</span></p>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <p class="text-truncated w-100"><b>5</b> <small class="text-secondary">No Jobs, Ads Blocker</small></p>
                                        </td>
                                        <td>
                                            <span class="badge bg-yellow">Idle</span>
                                        </td>
                                        <td>Waiting room area open network low speed connectivity or visitors.</td>
                                        <td>
                                            <div class="row gx-3 align-items-center">
                                                <div class="col-auto avatar-group">
                                                    <figure class="avatar avatar-40 rounded-circle coverimg" data-bs-toggle="tooltip" data-bs-placement="top" title="Shelvey Doe">
                                                        <img src="assets/img/modern-ai-image/user-2.jpg" alt="" />
                                                    </figure>
                                                    <figure class="avatar avatar-40 rounded-circle coverimg" data-bs-toggle="tooltip" data-bs-placement="top" title="Maria Smith">
                                                        <img src="assets/img/modern-ai-image/user-3.jpg" alt="" />
                                                    </figure>
                                                    <figure class="avatar avatar-40 rounded-circle coverimg" data-bs-toggle="tooltip" data-bs-placement="top" title="Steve Branden">
                                                        <img src="assets/img/modern-ai-image/user-4.jpg" alt="" />
                                                    </figure>
                                                </div>
                                                <div class="col-auto">
                                                    <p class="mb-0">18+ users</p>
                                                    <p class="text-secondary small">Connected</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div class="form-check form-switch">
                                                <input class="form-check-input" type="checkbox" role="switch" id="tableactionwifi7" checked="" />
                                                <label class="form-check-label" for="tableactionwifi7"></label>
                                            </div>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <!--charts category summary-->
                <div class="col-12 col-md-6 col-lg-6 col-xxl-3">
                    <div class="card adminuiux-card theme-green mb-3 mb-lg-4">
                        <div class="card-header">
                            <div class="row gx-3 align-items-center">
                                <div class="col-auto">
                                    <i class="bi bi-arrow-up-right h5 avatar avatar-40 bg-theme-1-subtle text-theme-1 rounded"></i>
                                </div>
                                <div class="col">
                                    <p class="text-secondary small mb-0">Cost for devices</p>
                                    <h6>1542 <small>USD</small></h6>
                                </div>
                            </div>
                        </div>
                        <div class="card-body px-0">
                            <app-area-green-chartjs-100 class="height-120 w-100 d-block mb-2"></app-area-green-chartjs-100>
                        </div>
                    </div>
                    <div class="card adminuiux-card theme-red mb-3 mb-lg-4">
                        <div class="card-header">
                            <div class="row gx-3 align-items-center">
                                <div class="col-auto">
                                    <i class="bi bi-arrow-up-right h5 avatar avatar-40 bg-theme-1-subtle text-theme-1 rounded"></i>
                                </div>
                                <div class="col">
                                    <p class="text-secondary small mb-0">Cost for Internet</p>
                                    <h6>1522 <small>USD</small></h6>
                                </div>
                                <div class="col-auto"></div>
                            </div>
                        </div>
                        <div class="card-body px-0">
                            <app-area-red-chartjs-100 class="height-110 w-100 d-block mb-2"></app-area-red-chartjs-100>
                        </div>
                    </div>
                </div>

                <!-- Devices installation and access -->
                <div class="col-12 col-xxl-5">
                    <div class="card adminuiux-card mb-3 mb-lg-4">
                        <div class="card-header">
                            <div class="row gx-3 align-items-center">
                                <div class="col-auto">
                                    <i class="bi bi-wifi h5 me-1 avatar avatar-40 bg-theme-1-subtle text-theme-1 theme-purple rounded"></i>
                                </div>
                                <div class="col">
                                    <h6 class="mb-0">WiFi Router</h6>
                                    <p class="text-secondary small">5 Active | 1 Inactive</p>
                                </div>
                                <div class="col-auto">
                                    <div class="dropdown d-inline-block">
                                        <a class="btn btn-link btn-square text-secondary no-caret dropdown-toggle" data-bs-toggle="dropdown" aria-expanded="false" data-bs-display="static" role="button">
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
                            <table class="table" id="dataTable2">
                                <thead class="d-none">
                                    <tr>
                                        <th class="width-12"></th>
                                        <th class="all">Router</th>
                                        <th class="desktop">Password</th>
                                        <th class="none">Connected</th>
                                        <th class="all">Status</th>
                                        <th class="none" data-title="Description">Description</th>
                                        <th class="none" data-title="Users">Users</th>
                                        <th class="width-80">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td class="width-10"></td>
                                        <td class="width-200">
                                            <div class="row gx-3">
                                                <div class="col-auto">
                                                    <i class="bi bi-wifi avatar avatar-40 bg-theme-1-subtle text-theme-1 rounded"></i>
                                                </div>
                                                <div class="col">
                                                    <p class="mb-1 text-truncated w-100">Meeting Room 1</p>
                                                    <p class="text-secondary small">2.4 GHz | <span class="text-theme-1 theme-green">Active</span></p>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <p class="text-truncated mb-0">getWindoor1</p>
                                            <p class="text-secondary small"><i class="bi bi-eye vm"></i> *********</p>
                                        </td>
                                        <td>
                                            <p class="text-truncated mb-0"><b>6525</b> <small class="text-secondary">Devices</small></p>
                                            <p class="small">6120 <small class="text-secondary">Desktop</small>, 150 <small class="text-secondary">Laptops</small></p>
                                        </td>
                                        <td>
                                            <span class="badge bg-success">Active</span>
                                        </td>
                                        <td>This is located at first floor near B201 room. Assigned for 25-30 employees.</td>
                                        <td>
                                            <div class="row gx-3 align-items-center">
                                                <div class="col-auto avatar-group">
                                                    <figure class="avatar avatar-40 rounded-circle coverimg" data-bs-toggle="tooltip" data-bs-placement="top" title="Shelvey Doe">
                                                        <img src="assets/img/modern-ai-image/user-2.jpg" alt="" />
                                                    </figure>
                                                    <figure class="avatar avatar-40 rounded-circle coverimg" data-bs-toggle="tooltip" data-bs-placement="top" title="Maria Smith">
                                                        <img src="assets/img/modern-ai-image/user-3.jpg" alt="" />
                                                    </figure>
                                                    <figure class="avatar avatar-40 rounded-circle coverimg" data-bs-toggle="tooltip" data-bs-placement="top" title="Steve Branden">
                                                        <img src="assets/img/modern-ai-image/user-4.jpg" alt="" />
                                                    </figure>
                                                </div>
                                                <div class="col-auto">
                                                    <p class="mb-0">18+ users</p>
                                                    <p class="text-secondary small">Connected</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div class="form-check form-switch">
                                                <input class="form-check-input" type="checkbox" role="switch" id="tableactionwifi11" checked="" />
                                                <label class="form-check-label" for="tableactionwifi11"></label>
                                            </div>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td class="width-10"></td>
                                        <td class="width-200">
                                            <div class="row gx-3">
                                                <div class="col-auto">
                                                    <i class="bi bi-wifi avatar avatar-40 bg-theme-1-subtle text-theme-1 theme-red rounded"></i>
                                                </div>
                                                <div class="col">
                                                    <p class="mb-1 text-truncated w-100">Conference 1</p>
                                                    <p class="text-secondary small">2.4 GHz | <span class="text-theme-1 theme-red">Inactive</span></p>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <p class="text-truncated w-100 mb-0">getWindoor1</p>
                                            <p class="text-secondary small"><i class="bi bi-eye vm"></i> *********</p>
                                        </td>
                                        <td>
                                            <p class="text-truncated w-100 mb-0"><b>3652</b> <small class="text-secondary">Devices</small></p>
                                            <p class="small">2142 <small class="text-secondary">Desktop</small>, 150 <small class="text-secondary">Laptops</small></p>
                                        </td>
                                        <td>
                                            <span class="badge text-bg-danger">Inactive</span>
                                        </td>
                                        <td>This is located at 2nd floor Conference room. Assigned for 4 employees who are in meeting.</td>
                                        <td>
                                            <div class="row gx-3 align-items-center">
                                                <div class="col-auto avatar-group">
                                                    <figure class="avatar avatar-40 rounded-circle coverimg" data-bs-toggle="tooltip" data-bs-placement="top" title="Shelvey Doe">
                                                        <img src="assets/img/modern-ai-image/user-2.jpg" alt="" />
                                                    </figure>
                                                    <figure class="avatar avatar-40 rounded-circle coverimg" data-bs-toggle="tooltip" data-bs-placement="top" title="Maria Smith">
                                                        <img src="assets/img/modern-ai-image/user-3.jpg" alt="" />
                                                    </figure>
                                                    <figure class="avatar avatar-40 rounded-circle coverimg" data-bs-toggle="tooltip" data-bs-placement="top" title="Steve Branden">
                                                        <img src="assets/img/modern-ai-image/user-4.jpg" alt="" />
                                                    </figure>
                                                </div>
                                                <div class="col-auto">
                                                    <p class="mb-0">18+ users</p>
                                                    <p class="text-secondary small">Connected</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div class="form-check form-switch">
                                                <input class="form-check-input" type="checkbox" role="switch" id="tableactionwifi21" />
                                                <label class="form-check-label" for="tableactionwifi21"></label>
                                            </div>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td class="width-10"></td>
                                        <td class="width-200">
                                            <div class="row gx-3">
                                                <div class="col-auto">
                                                    <i class="bi bi-wifi avatar avatar-40 bg-theme-1-subtle text-theme-1 theme-yellow rounded"></i>
                                                </div>
                                                <div class="col">
                                                    <p class="mb-1 text-truncated w-100">Cafeteria</p>
                                                    <p class="text-secondary small">1.05 GHz | <span class="text-theme-1 theme-yellow">Idle</span></p>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <p class="text-truncated w-100 mb-0">getWindoor1</p>
                                            <p class="text-secondary small"><i class="bi bi-eye vm"></i> *********</p>
                                        </td>
                                        <td>
                                            <p class="text-truncated w-100 mb-0"><b>4251</b> <small class="text-secondary">Devices</small></p>
                                            <p class="small">3500 <small class="text-secondary">Desktop</small>, 150 <small class="text-secondary">Laptops</small></p>
                                        </td>
                                        <td>
                                            <span class="badge text-bg-warning">Idle</span>
                                        </td>
                                        <td>Waiting room area open network low speed connectivity or visitors.</td>
                                        <td>
                                            <div class="row gx-3 align-items-center">
                                                <div class="col-auto avatar-group">
                                                    <figure class="avatar avatar-40 rounded-circle coverimg" data-bs-toggle="tooltip" data-bs-placement="top" title="Shelvey Doe">
                                                        <img src="assets/img/modern-ai-image/user-2.jpg" alt="" />
                                                    </figure>
                                                    <figure class="avatar avatar-40 rounded-circle coverimg" data-bs-toggle="tooltip" data-bs-placement="top" title="Maria Smith">
                                                        <img src="assets/img/modern-ai-image/user-3.jpg" alt="" />
                                                    </figure>
                                                    <figure class="avatar avatar-40 rounded-circle coverimg" data-bs-toggle="tooltip" data-bs-placement="top" title="Steve Branden">
                                                        <img src="assets/img/modern-ai-image/user-4.jpg" alt="" />
                                                    </figure>
                                                </div>
                                                <div class="col-auto">
                                                    <p class="mb-0">18+ users</p>
                                                    <p class="text-secondary small">Connected</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div class="form-check form-switch">
                                                <input class="form-check-input" type="checkbox" role="switch" id="tableactionwifi31" checked="" />
                                                <label class="form-check-label" for="tableactionwifi31"></label>
                                            </div>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td class="width-10"></td>
                                        <td class="width-200">
                                            <div class="row gx-3">
                                                <div class="col-auto">
                                                    <i class="bi bi-wifi avatar avatar-40 bg-theme-1-subtle text-theme-1 rounded"></i>
                                                </div>
                                                <div class="col">
                                                    <p class="mb-1 text-truncated w-100">Meeting Room 4</p>
                                                    <p class="text-secondary small">2.4 GHz | <span class="text-theme-1 theme-green">Active</span></p>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <p class="text-truncated w-100 mb-0">getWindoor1</p>
                                            <p class="text-secondary small"><i class="bi bi-eye vm"></i> **********</p>
                                        </td>
                                        <td>
                                            <p class="text-truncated w-100 mb-0"><b>6525</b> <small class="text-secondary">Devices</small></p>
                                            <p class="small">6120 <small class="text-secondary">Desktop</small>, 150 <small class="text-secondary">Laptops</small></p>
                                        </td>
                                        <td>
                                            <span class="badge text-bg-success">Active</span>
                                        </td>
                                        <td>This is located at first floor near B201 room. Assigned for 25-30 employees.</td>
                                        <td>
                                            <div class="row gx-3 align-items-center">
                                                <div class="col-auto avatar-group">
                                                    <figure class="avatar avatar-40 rounded-circle coverimg" data-bs-toggle="tooltip" data-bs-placement="top" title="Shelvey Doe">
                                                        <img src="assets/img/modern-ai-image/user-2.jpg" alt="" />
                                                    </figure>
                                                    <figure class="avatar avatar-40 rounded-circle coverimg" data-bs-toggle="tooltip" data-bs-placement="top" title="Maria Smith">
                                                        <img src="assets/img/modern-ai-image/user-3.jpg" alt="" />
                                                    </figure>
                                                    <figure class="avatar avatar-40 rounded-circle coverimg" data-bs-toggle="tooltip" data-bs-placement="top" title="Steve Branden">
                                                        <img src="assets/img/modern-ai-image/user-4.jpg" alt="" />
                                                    </figure>
                                                </div>
                                                <div class="col-auto">
                                                    <p class="mb-0">18+ users</p>
                                                    <p class="text-secondary small">Connected</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div class="form-check form-switch">
                                                <input class="form-check-input" type="checkbox" role="switch" id="tableactionwifi41" checked="" />
                                                <label class="form-check-label" for="tableactionwifi41"></label>
                                            </div>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td class="width-10"></td>
                                        <td class="width-200">
                                            <div class="row gx-3">
                                                <div class="col-auto">
                                                    <i class="bi bi-wifi avatar avatar-40 bg-theme-1-subtle rounded"></i>
                                                </div>
                                                <div class="col">
                                                    <p class="mb-1 text-truncated">Meeting Room 1</p>
                                                    <p class="text-secondary small">2.4 GHz | <span class="text-theme-1 theme-green">Active</span></p>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <p class="text-truncated mb-0">getWindoor1</p>
                                            <p class="text-secondary small"><i class="bi bi-eye vm"></i> **********</p>
                                        </td>
                                        <td>
                                            <p class="text-truncated mb-0"><b>6525</b> <small class="text-secondary">Devices</small></p>
                                            <p class="small">6120 <small class="text-secondary">Desktop</small>, 150 <small class="text-secondary">Laptops</small></p>
                                        </td>
                                        <td>
                                            <span class="badge text-bg-success">Active</span>
                                        </td>
                                        <td>This is located at first floor near B201 room. Assigned for 25-30 employees.</td>
                                        <td>
                                            <div class="row gx-3 align-items-center">
                                                <div class="col-auto avatar-group">
                                                    <figure class="avatar avatar-40 rounded-circle coverimg" data-bs-toggle="tooltip" data-bs-placement="top" title="Shelvey Doe">
                                                        <img src="assets/img/modern-ai-image/user-2.jpg" alt="" />
                                                    </figure>
                                                    <figure class="avatar avatar-40 rounded-circle coverimg" data-bs-toggle="tooltip" data-bs-placement="top" title="Maria Smith">
                                                        <img src="assets/img/modern-ai-image/user-3.jpg" alt="" />
                                                    </figure>
                                                    <figure class="avatar avatar-40 rounded-circle coverimg" data-bs-toggle="tooltip" data-bs-placement="top" title="Steve Branden">
                                                        <img src="assets/img/modern-ai-image/user-4.jpg" alt="" />
                                                    </figure>
                                                </div>
                                                <div class="col-auto">
                                                    <p class="mb-0">18+ users</p>
                                                    <p class="text-secondary small">Connected</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div class="form-check form-switch">
                                                <input class="form-check-input" type="checkbox" role="switch" id="tableactionwifi51" checked="" />
                                                <label class="form-check-label" for="tableactionwifi51"></label>
                                            </div>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td class="width-10"></td>
                                        <td class="width-200">
                                            <div class="row gx-3">
                                                <div class="col-auto">
                                                    <i class="bi bi-wifi avatar avatar-40 bg-theme-1-subtle text-theme-1 rounded"></i>
                                                </div>
                                                <div class="col">
                                                    <p class="mb-1 text-truncated">Conference 1</p>
                                                    <p class="text-secondary small">2.4 GHz | <span class="text-theme-1 theme-red">Inactive</span></p>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <p class="text-truncated mb-0">getWindoor1</p>
                                            <p class="text-secondary small"><i class="bi bi-eye vm"></i> **********</p>
                                        </td>
                                        <td>
                                            <p class="text-truncated mb-0"><b>6525</b> <small class="text-secondary">Devices</small></p>
                                            <p class="small">6120 <small class="text-secondary">Desktop</small>, 150 <small class="text-secondary">Laptops</small></p>
                                        </td>
                                        <td>
                                            <span class="badge text-bg-danger">Inactive</span>
                                        </td>
                                        <td>This is located at 2nd floor Conference room. Assigned for 4 employees who are in meeting.</td>
                                        <td>
                                            <div class="row gx-3 align-items-center">
                                                <div class="col-auto avatar-group">
                                                    <figure class="avatar avatar-40 rounded-circle coverimg" data-bs-toggle="tooltip" data-bs-placement="top" title="Shelvey Doe">
                                                        <img src="assets/img/modern-ai-image/user-2.jpg" alt="" />
                                                    </figure>
                                                    <figure class="avatar avatar-40 rounded-circle coverimg" data-bs-toggle="tooltip" data-bs-placement="top" title="Maria Smith">
                                                        <img src="assets/img/modern-ai-image/user-3.jpg" alt="" />
                                                    </figure>
                                                    <figure class="avatar avatar-40 rounded-circle coverimg" data-bs-toggle="tooltip" data-bs-placement="top" title="Steve Branden">
                                                        <img src="assets/img/modern-ai-image/user-4.jpg" alt="" />
                                                    </figure>
                                                </div>
                                                <div class="col-auto">
                                                    <p class="mb-0">18+ users</p>
                                                    <p class="text-secondary small">Connected</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div class="form-check form-switch">
                                                <input class="form-check-input" type="checkbox" role="switch" id="tableactionwifi61" checked="" />
                                                <label class="form-check-label" for="tableactionwifi61"></label>
                                            </div>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td class="width-10"></td>
                                        <td class="width-200">
                                            <div class="row gx-3">
                                                <div class="col-auto">
                                                    <i class="bi bi-wifi avatar avatar-40 bg-theme-1-subtle text-theme-1 rounded"></i>
                                                </div>
                                                <div class="col">
                                                    <p class="mb-1 text-truncated">Meeting Room 2</p>
                                                    <p class="text-secondary small">1.05 GHz | <span class="text-theme-1 theme-yellow">Idle</span></p>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <p class="text-truncated mb-0">getWindoor1</p>
                                            <p class="text-secondary small"><i class="bi bi-eye vm"></i> **********</p>
                                        </td>
                                        <td>
                                            <p class="text-truncated mb-0"><b>6525</b> <small class="text-secondary">Devices</small></p>
                                            <p class="small">6120 <small class="text-secondary">Desktop</small>, 150 <small class="text-secondary">Laptops</small></p>
                                        </td>
                                        <td>
                                            <span class="badge text-bg-warning">Idle</span>
                                        </td>
                                        <td>Waiting room area open network low speed connectivity or visitors.</td>
                                        <td>
                                            <div class="row gx-3 align-items-center">
                                                <div class="col-auto avatar-group">
                                                    <figure class="avatar avatar-40 rounded-circle coverimg" data-bs-toggle="tooltip" data-bs-placement="top" title="Shelvey Doe">
                                                        <img src="assets/img/modern-ai-image/user-2.jpg" alt="" />
                                                    </figure>
                                                    <figure class="avatar avatar-40 rounded-circle coverimg" data-bs-toggle="tooltip" data-bs-placement="top" title="Maria Smith">
                                                        <img src="assets/img/modern-ai-image/user-3.jpg" alt="" />
                                                    </figure>
                                                    <figure class="avatar avatar-40 rounded-circle coverimg" data-bs-toggle="tooltip" data-bs-placement="top" title="Steve Branden">
                                                        <img src="assets/img/modern-ai-image/user-4.jpg" alt="" />
                                                    </figure>
                                                </div>
                                                <div class="col-auto">
                                                    <p class="mb-0">18+ users</p>
                                                    <p class="text-secondary small">Connected</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div class="form-check form-switch">
                                                <input class="form-check-input" type="checkbox" role="switch" id="tableactionwifi71" checked="" />
                                                <label class="form-check-label" for="tableactionwifi71"></label>
                                            </div>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            <div class="row gx-3 gx-lg-4 mb-3 mb-lg-4">
                <div class="col text-center py-3">
                    <h4><span class="text-gradient">Responsibility</span> comes with Reputed Job & <span class="text-gradient">remain attached</span></h4>
                    <p class="text-secondary">Along with giving permission you have to track it and think about data security.</p>
                </div>
            </div>

            <div class="row gx-3 gx-lg-4">
                <!-- Ticket Resolution track -->
                <div class="col-12 col-md-6 col-lg-6 col-xxl-4">
                    <div class="card adminuiux-card mb-3 mb-lg-4">
                        <div class="card-body pb-0">
                            <div class="row gx-3 align-items-center mb-3">
                                <div class="col-auto">
                                    <div class="avatar avatar-40 h5 bg-theme-1-subtle text-theme-1 theme-blue rounded">
                                        <i class="bi bi-patch-check"></i>
                                    </div>
                                </div>
                                <div class="col">
                                    <h6 class="mb-0">Ticket Resolution</h6>
                                    <p class="text-secondary small">Last 6 Months</p>
                                </div>
                                <div class="col-auto"></div>
                            </div>
                            <h5 class="mb-3">115824 <small class="small fw-normal text-theme-1 theme-green">18.71 (0.73%)</small></h5>

                            <app-bar-blue-chartjs-100 class="height-100 w-100 d-block mb-2"></app-bar-blue-chartjs-100>
                        </div>
                    </div>
                </div>

                <!-- Server space -->
                <div class="col-12 col-md-6 col-lg-6 col-xxl-4">
                    <div class="card adminuiux-card mb-3 mb-lg-4">
                        <div class="card-header">
                            <div class="row gx-3 gx-lg-4 align-items-center">
                                <div class="col-auto">
                                    <i class="bi bi-cloud-download h5 avatar avatar-40 bg-theme-1-subtle text-theme-1 theme-green rounded"></i>
                                </div>
                                <div class="col">
                                    <h6 class="mb-0">Azure server</h6>
                                    <p class="text-secondary small">Accessed Data</p>
                                </div>
                            </div>
                        </div>
                        <div class="card-body">
                            <div class="row gx-3 align-items-center">
                                <div class="col">
                                    <h5>105 Gb <small class="fw-normal text-theme-1 theme-green">of 150 Gb</small></h5>
                                </div>
                                <div class="col-auto">
                                    <p class="text-secondary small">1548k Files</p>
                                </div>
                            </div>
                            <div class="progress height-30 bg-theme-1-subtle my-3">
                                <div class="progress-bar bg-theme-1 theme-blue w-25" role="progressbar" aria-valuenow="25" aria-valuemin="0" aria-valuemax="100"></div>
                                <div class="progress-bar bg-theme-1 theme-yellow w-25" role="progressbar" aria-valuenow="10" aria-valuemin="0" aria-valuemax="100"></div>
                                <div class="progress-bar bg-theme-1 theme-red w-25" role="progressbar" aria-valuenow="5" aria-valuemin="0" aria-valuemax="100"></div>
                            </div>
                            <div class="row gx-2 gx-lg-3">
                                <p class="col-auto text-secondary small mb-3"><span class="avatar avatar-10 bg-theme-1 theme-blue me-1"></span>HTML</p>
                                <p class="col-auto text-secondary small mb-3"><span class="avatar avatar-10 bg-theme-1 theme-yellow me-1"></span>CSS</p>
                                <p class="col-auto text-secondary small mb-3"><span class="avatar avatar-10 bg-theme-1 theme-redme-1"></span>JS</p>
                                <p class="col-auto text-secondary small mb-3"><span class="avatar avatar-10  bg-theme-1-subtle me-1"></span>Other</p>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Shared Drive -->
                <div class="col-12 col-md-12 col-lg-12 col-xxl-4">
                    <div class="card adminuiux-card mb-3 mb-lg-4 bg-theme-1 theme-yellow">
                        <div class="card-header">
                            <div class="row gx-3 gx-lg-4 align-items-center">
                                <div class="col-auto">
                                    <i class="bi bi-folder h5 avatar avatar-40 bg-white-opacity text-white rounded"></i>
                                </div>
                                <div class="col">
                                    <h6 class="mb-0">Shared Drive</h6>
                                    <p class="opacity-75 small">Documents and Files</p>
                                </div>
                                <div class="col-auto"></div>
                            </div>
                        </div>
                        <div class="card-body">
                            <div class="row gx-3 gx-lg-4 align-items-center">
                                <div class="col">
                                    <h5>105 Gb <small class="fw-normal opacity-75">of 150 Gb</small></h5>
                                </div>
                                <div class="col-auto">
                                    <p class="opacity-75 small">1548k Files</p>
                                </div>
                            </div>
                            <div class="progress height-30 bg-white-opacity my-3">
                                <div class="progress-bar bg-theme-1 theme-blue w-25" role="progressbar" aria-valuenow="25" aria-valuemin="0" aria-valuemax="100"></div>
                                <div class="progress-bar bg-theme-1 theme-green w-25" role="progressbar" aria-valuenow="10" aria-valuemin="0" aria-valuemax="100"></div>
                                <div class="progress-bar bg-theme-1 theme-red w-25" role="progressbar" aria-valuenow="5" aria-valuemin="0" aria-valuemax="100"></div>
                            </div>
                            <div class="row gx-2 gx-lg-3">
                                <p class="col-auto opacity-75 small mb-3"><span class="avatar avatar-10 bg-theme-1 theme-blue me-1"></span>HTML</p>
                                <p class="col-auto opacity-75 small mb-3"><span class="avatar avatar-10 bg-green me-1"></span>CSS</p>
                                <p class="col-auto opacity-75 small mb-3"><span class="avatar avatar-10 bg-theme-1 theme-redme-1"></span>JS</p>
                                <p class="col-auto opacity-75 small mb-3"><span class="avatar avatar-10  bg-white-opacity me-1"></span>Other</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="row gx-3 gx-lg-4">
                <!-- Grid table-->
                <div class="col-12 col-md-12 col-lg-12 col-xl-12 col-xxl-8 position-relative">
                    <div class="card adminuiux-card mb-3 mb-lg-4">
                        <div class="card-header">
                            <div class="row gx-3">
                                <div class="col-auto mb-3 mb-lg-0">
                                    <i class="bi bi-shop h5 avatar avatar-40 bg-theme-1-subtle text-theme-1 rounded"></i>
                                </div>
                                <div class="col-9 col-md-10 col-lg align-self-center mb-3 mb-lg-0">
                                    <h6 class="mb-0">Tickets Raised</h6>
                                    <p class="text-secondary small">All Open Tickets</p>
                                </div>
                                <div class="col-6 col-md-6 col-lg-auto mb-lg-0">
                                    <select class="form-select w-100">
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
                                <div class="col-6 col-md-6 col-lg-auto mb-lg-0">
                                    <div class="input-group ">
                                        <span class="input-group-text text-theme-1"><i class="bi bi-search"></i></span>
                                        <input type="text" class="form-control" placeholder="Search..." />
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="card-body py-0">
                            <table class="table" id="dataTable">
                                <thead>
                                    <tr>
                                        <th class="all">ID</th>
                                        <th class="all">Raised By</th>
                                        <th class="desktop">Contact Details</th>
                                        <th class="desktop">Assigned To</th>
                                        <th class="tablet desktop">Status</th>
                                        <th class="tablet desktop">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td>2054ID</td>
                                        <td>
                                            <div class="row gx-3 flex-nowrap align-items-center">
                                                <div class="col-auto">
                                                    <figure class="avatar avatar-50 mb-0 coverimg rounded-circle">
                                                        <img src="assets/img/modern-ai-image/user-1.jpg" alt="" />
                                                    </figure>
                                                </div>
                                                <div class="col">
                                                    <p class="mb-0">David Warner</p>
                                                    <p class="text-secondary small">United Kingdom</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <p class="mb-0">david&#64;sales..core.com</p>
                                            <p class="text-secondary small">+44 8466585****1154</p>
                                        </td>
                                        <td>
                                            <p class="mb-0">Jr. Sing</p>
                                            <p class="text-secondary small">Technical Helpdesk</p>
                                        </td>
                                        <td>
                                            <span class="badge badge-sm bg-yellow">Pending</span>
                                        </td>
                                        <td>
                                            <div class="dropdown d-inline-block">
                                                <a class="btn btn-link btn-square dropdown-toggle no-caret" data-bs-toggle="dropdown" aria-expanded="false" data-bs-display="static" role="button">
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
                                        <td>105ID</td>
                                        <td>
                                            <div class="row gx-3 flex-nowrap align-items-center">
                                                <div class="col-auto">
                                                    <figure class="avatar avatar-50 mb-0 coverimg rounded-circle">
                                                        <img src="assets/img/modern-ai-image/user-2.jpg" alt="" />
                                                    </figure>
                                                </div>
                                                <div class="col">
                                                    <p class="mb-0">Winnie John</p>
                                                    <p class="text-secondary small">Australia</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <p class="mb-0">winnie&#64;sales..core.com</p>
                                            <p class="text-secondary small">+44 8466585****1154</p>
                                        </td>
                                        <td>
                                            <p class="mb-0">Brett Lee</p>
                                            <p class="text-secondary small">Assi. Server Expert</p>
                                        </td>
                                        <td>
                                            <span class="badge badge-sm bg-theme-1 theme-blue">Waiting</span>
                                        </td>
                                        <td>
                                            <div class="dropdown d-inline-block">
                                                <a class="btn btn-link btn-square dropdown-toggle no-caret" data-bs-toggle="dropdown" aria-expanded="false" data-bs-display="static" role="button">
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
                                        <td>058ID</td>
                                        <td>
                                            <div class="row gx-3 flex-nowrap align-items-center">
                                                <div class="col-auto">
                                                    <figure class="avatar avatar-50 mb-0 coverimg rounded-circle">
                                                        <img src="assets/img/modern-ai-image/user-3.jpg" alt="" />
                                                    </figure>
                                                </div>
                                                <div class="col">
                                                    <p class="mb-0">Alicia Smith</p>
                                                    <p class="text-secondary small">United States</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <p class="mb-0">alicia&#64;sales..core.com</p>
                                            <p class="text-secondary small">+44 8466585****1154</p>
                                        </td>
                                        <td>
                                            <p class="mb-0">Gal Seddist</p>
                                            <p class="text-secondary small">Finance Head</p>
                                        </td>
                                        <td>
                                            <span class="badge badge-sm bg-green">Complete</span>
                                        </td>
                                        <td>
                                            <div class="dropdown d-inline-block">
                                                <a class="btn btn-link btn-square dropdown-toggle no-caret" data-bs-toggle="dropdown" aria-expanded="false" data-bs-display="static" role="button">
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
                                        <td>500ID</td>
                                        <td>
                                            <div class="row gx-3 flex-nowrap align-items-center">
                                                <div class="col-auto">
                                                    <figure class="avatar avatar-50 mb-0 coverimg rounded-circle">
                                                        <img src="assets/img/modern-ai-image/user-4.jpg" alt="" />
                                                    </figure>
                                                </div>
                                                <div class="col">
                                                    <p class="mb-0">Jr. Chen Li</p>
                                                    <p class="text-secondary small">United Kingdom</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <p class="mb-0">cheli&#64;sales..core.com</p>
                                            <p class="text-secondary small">+44 8466585****1154</p>
                                        </td>
                                        <td>
                                            <p class="mb-0">Tech Guruji</p>
                                            <p class="text-secondary small">Product Manager</p>
                                        </td>
                                        <td>
                                            <span class="badge badge-sm bg-red">Rejected</span>
                                        </td>
                                        <td>
                                            <div class="dropdown d-inline-block">
                                                <a class="btn btn-link btn-square dropdown-toggle no-caret" data-bs-toggle="dropdown" aria-expanded="false" data-bs-display="static" role="button">
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
                                        <td>2054ID</td>
                                        <td>
                                            <div class="row gx-3 flex-nowrap align-items-center">
                                                <div class="col-auto">
                                                    <figure class="avatar avatar-50 mb-0 coverimg rounded-circle">
                                                        <img src="assets/img/modern-ai-image/user-1.jpg" alt="" />
                                                    </figure>
                                                </div>
                                                <div class="col">
                                                    <p class="mb-0">David Warner</p>
                                                    <p class="text-secondary small">United Kingdom</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <p class="mb-0">david&#64;sales..core.com</p>
                                            <p class="text-secondary small">+44 8466585****1154</p>
                                        </td>
                                        <td>
                                            <p class="mb-0">Jr. Sing</p>
                                            <p class="text-secondary small">Technical Helpdesk</p>
                                        </td>
                                        <td>
                                            <span class="badge badge-sm bg-yellow">Pending</span>
                                        </td>
                                        <td>
                                            <div class="dropdown d-inline-block">
                                                <a class="btn btn-link btn-square dropdown-toggle no-caret" data-bs-toggle="dropdown" aria-expanded="false" data-bs-display="static" role="button">
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
                                        <td>105ID</td>
                                        <td>
                                            <div class="row gx-3 flex-nowrap align-items-center">
                                                <div class="col-auto">
                                                    <figure class="avatar avatar-50 mb-0 coverimg rounded-circle">
                                                        <img src="assets/img/modern-ai-image/user-2.jpg" alt="" />
                                                    </figure>
                                                </div>
                                                <div class="col">
                                                    <p class="mb-0">Winnie John</p>
                                                    <p class="text-secondary small">Australia</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <p class="mb-0">winnie&#64;sales..core.com</p>
                                            <p class="text-secondary small">+44 8466585****1154</p>
                                        </td>
                                        <td>
                                            <p class="mb-0">Brett Lee</p>
                                            <p class="text-secondary small">Assi. Server Expert</p>
                                        </td>
                                        <td>
                                            <span class="badge badge-sm bg-theme-1 theme-blue">Waiting</span>
                                        </td>
                                        <td>
                                            <div class="dropdown d-inline-block">
                                                <a class="btn btn-link btn-square dropdown-toggle no-caret" data-bs-toggle="dropdown" aria-expanded="false" data-bs-display="static" role="button">
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
                                        <td>058ID</td>
                                        <td>
                                            <div class="row gx-3 flex-nowrap align-items-center">
                                                <div class="col-auto">
                                                    <figure class="avatar avatar-50 mb-0 coverimg rounded-circle">
                                                        <img src="assets/img/modern-ai-image/user-3.jpg" alt="" />
                                                    </figure>
                                                </div>
                                                <div class="col">
                                                    <p class="mb-0">Alicia Smith</p>
                                                    <p class="text-secondary small">United States</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <p class="mb-0">alicia&#64;sales..core.com</p>
                                            <p class="text-secondary small">+44 8466585****1154</p>
                                        </td>
                                        <td>
                                            <p class="mb-0">Gal Seddist</p>
                                            <p class="text-secondary small">Finance Head</p>
                                        </td>
                                        <td>
                                            <span class="badge badge-sm bg-green">Complete</span>
                                        </td>
                                        <td>
                                            <div class="dropdown d-inline-block">
                                                <a class="btn btn-link btn-square dropdown-toggle no-caret" data-bs-toggle="dropdown" aria-expanded="false" data-bs-display="static" role="button">
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
                                        <td>500ID</td>
                                        <td>
                                            <div class="row gx-3 flex-nowrap align-items-center">
                                                <div class="col-auto">
                                                    <figure class="avatar avatar-50 mb-0 coverimg rounded-circle">
                                                        <img src="assets/img/modern-ai-image/user-4.jpg" alt="" />
                                                    </figure>
                                                </div>
                                                <div class="col">
                                                    <p class="mb-0">Jr. Chen Li</p>
                                                    <p class="text-secondary small">United Kingdom</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <p class="mb-0">cheli&#64;sales..core.com</p>
                                            <p class="text-secondary small">+44 8466585****1154</p>
                                        </td>
                                        <td>
                                            <p class="mb-0">Tech Guruji</p>
                                            <p class="text-secondary small">Product Manager</p>
                                        </td>
                                        <td>
                                            <span class="badge badge-sm bg-red">Rejected</span>
                                        </td>
                                        <td>
                                            <div class="dropdown d-inline-block">
                                                <a class="btn btn-link btn-square dropdown-toggle no-caret" data-bs-toggle="dropdown" aria-expanded="false" data-bs-display="static" role="button">
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

                <!-- Shared drive files -->
                <div class="col-12 col-md-12 col-lg-12 col-xl-12 col-xxl-4">
                    <div class="card adminuiux-card mb-3 mb-lg-4 overflow-hidden">
                        <div class="card-header">
                            <div class="row gx-3 align-items-center">
                                <div class="col-auto">
                                    <i class="bi bi-folder h5 me-1 avatar avatar-40 bg-theme-1-subtle text-theme-1 rounded"></i>
                                </div>
                                <div class="col">
                                    <h6 class="mb-0">Shared Drive</h6>
                                    <p class="text-secondary small">Documents and Files</p>
                                </div>
                                <div class="col-auto">
                                    <div class="dropdown d-inline-block">
                                        <a class="btn btn-link btn-square text-secondary no-caret dropdown-toggle" data-bs-toggle="dropdown" aria-expanded="false" data-bs-display="static" role="button">
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
                        <div class="card-body px-0 pb-0">
                            <table class="table border-top mb-0" id="dataTable">
                                <thead class="d-none">
                                    <tr>
                                        <th class="width-180">File</th>
                                        <th class="xs sm" class="width-80">Shared with</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td class="px-3">
                                            <div class="row gx-3">
                                                <div class="col-auto">
                                                    <i class="bi bi-card-image avatar avatar-40 bg-theme-1-subtle text-theme-1 theme-yellow rounded"></i>
                                                </div>
                                                <div class="col" style="max-width: calc(100% - 60px);">
                                                    <p class="mb-0 text-truncated w-100">Presentation</p>
                                                    <p class="text-secondary small">200 kb</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td class="text-end px-3">
                                            <div class="row gx-3 align-items-center">
                                                <div class="col text-end">
                                                    <p class="mb-0">15+</p>
                                                    <p class="text-secondary small mb-0">Shared</p>
                                                </div>
                                                <div class="col-auto avatar-group">
                                                    <figure class="avatar avatar-30 rounded-circle coverimg" data-bs-toggle="tooltip" data-bs-placement="top" title="Shelvey Doe">
                                                        <img src="assets/img/modern-ai-image/user-2.jpg" alt="" />
                                                    </figure>
                                                    <figure class="avatar avatar-30 rounded-circle coverimg" data-bs-toggle="tooltip" data-bs-placement="top" title="Maria Smith">
                                                        <img src="assets/img/modern-ai-image/user-3.jpg" alt="" />
                                                    </figure>
                                                    <figure class="avatar avatar-30 rounded-circle coverimg" data-bs-toggle="tooltip" data-bs-placement="top" title="Steve Branden">
                                                        <img src="assets/img/modern-ai-image/user-4.jpg" alt="" />
                                                    </figure>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td class="px-3">
                                            <div class="row gx-3">
                                                <div class="col-auto">
                                                    <i class="bi bi-file-earmark-word avatar avatar-40 bg-theme-1-subtle text-theme-1  rounded"></i>
                                                </div>
                                                <div class="col" style="max-width: calc(100% - 60px);">
                                                    <p class="mb-0 text-truncated w-100">Project Requirement</p>
                                                    <p class="text-secondary small">150 kb</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td class="text-end px-3">
                                            <div class="row gx-3 align-items-center">
                                                <div class="col text-end">
                                                    <p class="mb-0">15+</p>
                                                    <p class="text-secondary small mb-0">Shared</p>
                                                </div>
                                                <div class="col-auto avatar-group">
                                                    <figure class="avatar avatar-30 rounded-circle coverimg" data-bs-toggle="tooltip" data-bs-placement="top" title="Shelvey Doe">
                                                        <img src="assets/img/modern-ai-image/user-2.jpg" alt="" />
                                                    </figure>
                                                    <figure class="avatar avatar-30 rounded-circle coverimg" data-bs-toggle="tooltip" data-bs-placement="top" title="Maria Smith">
                                                        <img src="assets/img/modern-ai-image/user-3.jpg" alt="" />
                                                    </figure>
                                                    <figure class="avatar avatar-30 rounded-circle coverimg" data-bs-toggle="tooltip" data-bs-placement="top" title="Steve Branden">
                                                        <img src="assets/img/modern-ai-image/user-4.jpg" alt="" />
                                                    </figure>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td class="px-3">
                                            <div class="row gx-3">
                                                <div class="col-auto">
                                                    <i class="bi bi-file-earmark-spreadsheet avatar avatar-40 bg-theme-1-subtle text-theme-1 theme-green rounded"></i>
                                                </div>
                                                <div class="col" style="max-width: calc(100% - 60px);">
                                                    <p class="mb-0 text-truncated w-100">Timesheet</p>
                                                    <p class="text-secondary small">120 kb</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td class="text-end px-3">
                                            <div class="row gx-3 align-items-center">
                                                <div class="col text-end">
                                                    <p class="mb-0">13+</p>
                                                    <p class="text-secondary small mb-0">Shared</p>
                                                </div>
                                                <div class="col-auto avatar-group">
                                                    <figure class="avatar avatar-30 rounded-circle coverimg" data-bs-toggle="tooltip" data-bs-placement="top" title="Shelvey Doe">
                                                        <img src="assets/img/modern-ai-image/user-1.jpg" alt="" />
                                                    </figure>
                                                    <figure class="avatar avatar-30 rounded-circle coverimg" data-bs-toggle="tooltip" data-bs-placement="top" title="Maria Smith">
                                                        <img src="assets/img/modern-ai-image/user-2.jpg" alt="" />
                                                    </figure>
                                                    <figure class="avatar avatar-30 rounded-circle coverimg" data-bs-toggle="tooltip" data-bs-placement="top" title="Steve Branden">
                                                        <img src="assets/img/modern-ai-image/user-3.jpg" alt="" />
                                                    </figure>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td class="px-3">
                                            <div class="row gx-3">
                                                <div class="col-auto">
                                                    <i class="bi bi-file-earmark-slides avatar avatar-40 bg-theme-1-subtle text-theme-1 rounded"></i>
                                                </div>
                                                <div class="col" style="max-width: calc(100% - 60px);">
                                                    <p class="mb-0 text-truncated w-100">Presentation</p>
                                                    <p class="text-secondary small">350 kb</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td class="text-end px-3">
                                            <div class="row gx-3 align-items-center">
                                                <div class="col text-end">
                                                    <p class="mb-0">5+</p>
                                                    <p class="text-secondary small mb-0">Shared</p>
                                                </div>
                                                <div class="col-auto avatar-group">
                                                    <figure class="avatar avatar-30 rounded-circle coverimg" data-bs-toggle="tooltip" data-bs-placement="top" title="Shelvey Doe">
                                                        <img src="assets/img/modern-ai-image/user-4.jpg" alt="" />
                                                    </figure>
                                                    <figure class="avatar avatar-30 rounded-circle coverimg" data-bs-toggle="tooltip" data-bs-placement="top" title="Maria Smith">
                                                        <img src="assets/img/modern-ai-image/user-1.jpg" alt="" />
                                                    </figure>
                                                    <figure class="avatar avatar-30 rounded-circle coverimg" data-bs-toggle="tooltip" data-bs-placement="top" title="Steve Branden">
                                                        <img src="assets/img/modern-ai-image/user-2.jpg" alt="" />
                                                    </figure>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td class="px-3">
                                            <div class="row gx-3">
                                                <div class="col-auto">
                                                    <i class="bi bi-card-image avatar avatar-40 bg-theme-1-subtle text-theme-1 rounded"></i>
                                                </div>
                                                <div class="col" style="max-width: calc(100% - 60px);">
                                                    <p class="mb-0 text-truncated w-100">Presentation</p>
                                                    <p class="text-secondary small">200 kb</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td class="text-end px-3">
                                            <div class="row gx-3 align-items-center">
                                                <div class="col text-end">
                                                    <p class="mb-0">15+</p>
                                                    <p class="text-secondary small mb-0">Shared</p>
                                                </div>
                                                <div class="col-auto avatar-group">
                                                    <figure class="avatar avatar-30 rounded-circle coverimg" data-bs-toggle="tooltip" data-bs-placement="top" title="Shelvey Doe">
                                                        <img src="assets/img/modern-ai-image/user-2.jpg" alt="" />
                                                    </figure>
                                                    <figure class="avatar avatar-30 rounded-circle coverimg" data-bs-toggle="tooltip" data-bs-placement="top" title="Maria Smith">
                                                        <img src="assets/img/modern-ai-image/user-3.jpg" alt="" />
                                                    </figure>
                                                    <figure class="avatar avatar-30 rounded-circle coverimg" data-bs-toggle="tooltip" data-bs-placement="top" title="Steve Branden">
                                                        <img src="assets/img/modern-ai-image/user-4.jpg" alt="" />
                                                    </figure>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td class="px-3">
                                            <div class="row gx-3">
                                                <div class="col-auto">
                                                    <i class="bi bi-card-image avatar avatar-40 bg-theme-1-subtle text-theme-1 theme-yellow rounded"></i>
                                                </div>
                                                <div class="col" style="max-width: calc(100% - 60px);">
                                                    <p class="mb-0 text-truncated w-100">Preview</p>
                                                    <p class="text-secondary small">210 kb</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td class="text-end px-3">
                                            <div class="row gx-3 align-items-center">
                                                <div class="col text-end">
                                                    <p class="mb-0">15+</p>
                                                    <p class="text-secondary small mb-0">Shared</p>
                                                </div>
                                                <div class="col-auto avatar-group">
                                                    <figure class="avatar avatar-30 rounded-circle coverimg" data-bs-toggle="tooltip" data-bs-placement="top" title="Shelvey Doe">
                                                        <img src="assets/img/modern-ai-image/user-2.jpg" alt="" />
                                                    </figure>
                                                    <figure class="avatar avatar-30 rounded-circle coverimg" data-bs-toggle="tooltip" data-bs-placement="top" title="Maria Smith">
                                                        <img src="assets/img/modern-ai-image/user-3.jpg" alt="" />
                                                    </figure>
                                                    <figure class="avatar avatar-30 rounded-circle coverimg" data-bs-toggle="tooltip" data-bs-placement="top" title="Steve Branden">
                                                        <img src="assets/img/modern-ai-image/user-4.jpg" alt="" />
                                                    </figure>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td class="px-3">
                                            <div class="row gx-3">
                                                <div class="col-auto">
                                                    <i class="bi bi-card-image avatar avatar-40 bg-theme-1-subtle text-theme-1 theme-yellow rounded"></i>
                                                </div>
                                                <div class="col" style="max-width: calc(100% - 60px);">
                                                    <p class="mb-0 text-truncated w-100">Preview</p>
                                                    <p class="text-secondary small">210 kb</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td class="text-end px-3">
                                            <div class="row gx-3 align-items-center">
                                                <div class="col text-end">
                                                    <p class="mb-0">15+</p>
                                                    <p class="text-secondary small mb-0">Shared</p>
                                                </div>
                                                <div class="col-auto avatar-group">
                                                    <figure class="avatar avatar-30 rounded-circle coverimg" data-bs-toggle="tooltip" data-bs-placement="top" title="Shelvey Doe">
                                                        <img src="assets/img/modern-ai-image/user-2.jpg" alt="" />
                                                    </figure>
                                                    <figure class="avatar avatar-30 rounded-circle coverimg" data-bs-toggle="tooltip" data-bs-placement="top" title="Maria Smith">
                                                        <img src="assets/img/modern-ai-image/user-3.jpg" alt="" />
                                                    </figure>
                                                    <figure class="avatar avatar-30 rounded-circle coverimg" data-bs-toggle="tooltip" data-bs-placement="top" title="Steve Branden">
                                                        <img src="assets/img/modern-ai-image/user-4.jpg" alt="" />
                                                    </figure>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td class="px-3">
                                            <div class="row gx-3">
                                                <div class="col-auto">
                                                    <i class="bi bi-file-earmark-word avatar avatar-40 bg-theme-1-subtle text-theme-1  rounded"></i>
                                                </div>
                                                <div class="col" style="max-width: calc(100% - 60px);">
                                                    <p class="mb-0 text-truncated w-100">Project Requirement</p>
                                                    <p class="text-secondary small">150 kb</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td class="text-end px-3">
                                            <div class="row gx-3 align-items-center">
                                                <div class="col text-end">
                                                    <p class="mb-0">15+</p>
                                                    <p class="text-secondary small mb-0">Shared</p>
                                                </div>
                                                <div class="col-auto avatar-group">
                                                    <figure class="avatar avatar-30 rounded-circle coverimg" data-bs-toggle="tooltip" data-bs-placement="top" title="Shelvey Doe">
                                                        <img src="assets/img/modern-ai-image/user-2.jpg" alt="" />
                                                    </figure>
                                                    <figure class="avatar avatar-30 rounded-circle coverimg" data-bs-toggle="tooltip" data-bs-placement="top" title="Maria Smith">
                                                        <img src="assets/img/modern-ai-image/user-3.jpg" alt="" />
                                                    </figure>
                                                    <figure class="avatar avatar-30 rounded-circle coverimg" data-bs-toggle="tooltip" data-bs-placement="top" title="Steve Branden">
                                                        <img src="assets/img/modern-ai-image/user-4.jpg" alt="" />
                                                    </figure>
                                                </div>
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
export class NetworkDashboardComponent {
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
        const table1 = new DataTable("#dataTable1", {
            searching: false,
            lengthChange: false,
            autoWidth: false,
            columnDefs: [{ orderable: false, targets: 4 }],
            order: [[0, "desc"]],
            pageLength: 5,
            responsive: true,
            info: false,
        });
        const table2 = new DataTable("#dataTable2", {
            searching: false,
            lengthChange: false,
            autoWidth: false,
            columnDefs: [{ orderable: false, targets: 4 }],
            order: [[0, "desc"]],
            pageLength: 5,
            responsive: true,
            info: false,
        });
    }
}
