import { Component, OnInit, AfterViewInit, AfterContentChecked, OnDestroy, ViewChild, ElementRef, CUSTOM_ELEMENTS_SCHEMA } from "@angular/core";
import { RouterLink } from "@angular/router";
import Choices, { ClassNames } from "choices.js";
import DataTable from "datatables.net-dt";
import "datatables.net-responsive-dt";

declare const jsVectorMap: any;

import { DaterangePickerRangesComponent } from "../../../components/input-fields/daterange-picker/daterange-picker-ranges.component";
import { AreaBlueChartjs60Component } from "../../../components/charts/area-blue-chartjs-60.component";
import { CircleProgressBlueComponent } from "../../../components/charts/circle-progress-blue.component";
import { AreaGreenChartjs60Component } from "../../../components/charts/area-green-chartjs-60.component";
import { CircleProgressGreenComponent } from "../../../components/charts/circle-progress-green.component";
import { ArearedChartjs60Component } from "../../../components/charts/area-red-chartjs-60.component";
import { CircleProgressRedComponent } from "../../../components/charts/circle-progress-red.component";
import { AreaGreenChartjs100Component } from "../../../components/charts/area-green-chartjs-100.component";
import { AreaRedChartjs100Component } from "../../../components/charts/area-red-chartjs-100.component";
import { PerformanceBannerChartComponent } from "../../../components/charts/performance-banner-chart.component";
import { AreaYellowChartjs60Component } from "../../../components/charts/area-yellow-chartjs-60.component";
import { BarBlueChartjs100Component } from "../../../components/charts/bar-blue-chartjs-100.component";
import { BarBlueChartjs100HoriComponent } from "../../../components/charts/bar-blue-chartjs-100-hori.component";

@Component({
    selector: "app-network-performance",
    standalone: true,
    imports: [RouterLink, DaterangePickerRangesComponent, PerformanceBannerChartComponent, AreaYellowChartjs60Component, AreaBlueChartjs60Component, CircleProgressBlueComponent, AreaGreenChartjs60Component, CircleProgressGreenComponent, ArearedChartjs60Component, CircleProgressRedComponent, AreaGreenChartjs100Component, AreaRedChartjs100Component, BarBlueChartjs100Component, BarBlueChartjs100HoriComponent],
    template: `
        <!-- page title -->
        <div class="container-fluid py-3">
            <div class="row gx-3 gx-lg-4 align-items-center page-title">
                <div class="col col-sm mb-3 mb-sm-0 order-1">
                    <h5 class="mb-0">Network Performance</h5>
                    <p class="text-secondary small">Track performance of your hardware and server</p>
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
                    <li class="breadcrumb-item bi"><a routerLink="/app/network-dashboard">Network</a></li>
                    <li class="breadcrumb-item bi active" aria-current="page">Performance</li>
                </ol>
            </nav>
        </div>

        <!-- content -->
        <div class="container mt-3" id="main-content">
            <div class="row mb-3 mb-lg-4">
                <div class="col text-center">
                    <h4>Every customer is <span class="text-gradient">as Important as</span> your business to you</h4>
                    <p class="text-secondary">Make sure your servers & hardware are up and running well. Do not lose your customers.</p>
                </div>
            </div>

            <!-- network server performance -->
            <app-performance-banner-chart class="height-200 d-block mb-3 mb-lg-4"></app-performance-banner-chart>

            <!-- summary blocks -->
            <div class="row gx-3 gx-lg-4">
                <div class="col-12 col-md-6 col-lg-4">
                    <div class="card adminuiux-card mb-3 mb-lg-4">
                        <div class="card-header">
                            <div class="row gx-3 align-items-center">
                                <div class="col-auto">
                                    <i class="bi bi-hdd-stack h5 avatar avatar-40 bg-theme-1-subtle text-theme-1 rounded"></i>
                                </div>
                                <div class="col">
                                    <h6 class="mb-0">Storage</h6>
                                    <p class="small text-secondary">Perform Good</p>
                                </div>
                                <div class="col-auto ms-auto"></div>
                            </div>
                        </div>
                        <div class="card-body">
                            <div class="row gx-3 align-items-center">
                                <div class="col-3">
                                    <div class="border rounded">
                                        <app-area-blue-chartjs-60 class="height-60 d-block w-100 mb-2"></app-area-blue-chartjs-60>
                                    </div>
                                </div>
                                <div class="col">
                                    <h5 class="mb-1">R/W 5.5/6 GB</h5>
                                    <p class="text-secondary small">1TB Sumsung Evo SSD</p>
                                </div>
                                <div class="col-auto">
                                    <app-circle-progress-blue class="avatar avatar-60 rounded-circle"></app-circle-progress-blue>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-12 col-md-6 col-lg-4">
                    <div class="card adminuiux-card mb-3 mb-lg-4">
                        <div class="card-header">
                            <div class="row gx-3 align-items-center">
                                <div class="col-auto">
                                    <i class="bi bi-speedometer h5 avatar avatar-40 bg-theme-1-subtle text-theme-1 theme-green rounded"></i>
                                </div>
                                <div class="col-auto">
                                    <h6 class="mb-0">CPU</h6>
                                    <p class="small text-secondary">Uptime 100%</p>
                                </div>
                                <div class="col-auto ms-auto"></div>
                            </div>
                        </div>
                        <div class="card-body">
                            <div class="row gx-3 align-items-center">
                                <div class="col-3">
                                    <div class="border rounded">
                                        <app-area-green-chartjs-60 class="height-60 d-block w-100 mb-2"></app-area-green-chartjs-60>
                                    </div>
                                </div>
                                <div class="col">
                                    <h5 class="mb-1">45% 4.6GHz</h5>
                                    <p class="text-secondary small">Core i7 11548, Octa core</p>
                                </div>
                                <div class="col-auto">
                                    <app-circle-progress-green class="avatar avatar-60 rounded-circle"></app-circle-progress-green>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-12 col-md-6 col-lg-4">
                    <div class="card adminuiux-card mb-3 mb-lg-4">
                        <div class="card-header">
                            <div class="row gx-3 align-items-center">
                                <div class="col-auto">
                                    <i class="bi bi-cpu h5 avatar avatar-40 bg-theme-1-subtle text-theme-1 theme-red rounded"></i>
                                </div>
                                <div class="col-auto">
                                    <h6 class="mb-0">Internet</h6>
                                    <p class="small text-secondary">Uptime 90%</p>
                                </div>
                                <div class="col-auto ms-auto"></div>
                            </div>
                        </div>
                        <div class="card-body">
                            <div class="row gx-3 align-items-center">
                                <div class="col-3">
                                    <div class="border rounded">
                                        <app-area-red-chartjs-60 class="height-60 d-block w-100 mb-2"></app-area-red-chartjs-60>
                                    </div>
                                </div>
                                <div class="col">
                                    <h5 class="mb-1"><i class="bi bi-arrow-up-right text-theme-1 theme-red"></i> 65.0 <i class="bi bi-arrow-down-left text-theme-1 theme-green"></i> 100.0</h5>
                                    <p class="text-secondary small">AT & T (Speed in Mbps)</p>
                                </div>
                                <div class="col-auto">
                                    <app-circle-progress-red class="avatar avatar-60 rounded-circle"></app-circle-progress-red>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="row gx-3 gx-lg-4">
                <!-- Devices installation and access -->
                <div class="col-12 col-md-6 col-lg-6 col-xxl-4">
                    <div class="card adminuiux-card bg-l-gradient-light theme-yellow mb-3 mb-lg-4">
                        <div class="card-header">
                            <div class="row gx-3 align-items-center">
                                <div class="col">
                                    <h6 class="mb-0">Virus Alert</h6>
                                    <p class="text-secondary small">Possible Threat Detected</p>
                                </div>
                                <div class="col-auto"></div>
                            </div>
                        </div>
                        <div class="card-body">
                            <div class="row gx-3 align-items-center mb-3">
                                <div class="col-auto">
                                    <div class="avatar avatar-50 h5 bg-theme-1-subtle text-theme-1 theme-orange rounded">
                                        <i class="bi bi-exclamation-triangle"></i>
                                    </div>
                                </div>
                                <div class="col">
                                    <p class="text-secondary mb-1">Recently below virus/threat detected</p>
                                    <h6><i class="bi bi-bug text-red me-2"></i> trojonhorse-11-582ID-24</h6>
                                </div>
                            </div>
                            <a href="" class="btn btn-link">View full list</a>
                        </div>
                        <div class="card-footer p-0">
                            <app-area-yellow-chartjs-60 class="height-60 d-block w-100"></app-area-yellow-chartjs-60>
                        </div>
                    </div>
                </div>
                <!--charts category summary-->
                <div class="col-12 col-md-6 col-lg-6 col-xxl-4">
                    <div class="card adminuiux-card bg-l-gradient-light theme-green mb-3 mb-lg-4">
                        <div class="card-header">
                            <div class="row gx-3 align-items-center">
                                <div class="col">
                                    <p class="text-secondary small mb-0">Cost of Maintenance</p>
                                    <h6>1542 <small>USD/Month</small></h6>
                                </div>
                                <div class="col-auto"></div>
                            </div>
                        </div>
                        <div class="card-body">
                            <div class="row gx-3">
                                <div class="col">
                                    <h5>15284.00<br /><small class="fw-light">USD/Month</small></h5>
                                </div>
                                <div class="col-auto text-end">
                                    <p class="text-secondary">Revenue generated<br />by this server</p>
                                </div>
                            </div>
                        </div>
                        <div class="card-body p-0">
                            <app-area-green-chartjs-100 class="height-110 d-block w-100 mb-2"></app-area-green-chartjs-100>
                        </div>
                    </div>
                </div>
                <div class="col-12 col-md-6 col-lg-6 col-xxl-4">
                    <div class="card adminuiux-card bg-l-gradient-light theme-red mb-3 mb-lg-4">
                        <div class="card-header">
                            <div class="row gx-3 align-items-center">
                                <div class="col">
                                    <p class="text-secondary small mb-0">Cost for Internet</p>
                                    <h6>1022 <small>USD</small></h6>
                                </div>
                                <div class="col-auto"></div>
                            </div>
                        </div>
                        <div class="card-body">
                            <div class="row gx-3">
                                <div class="col">
                                    <h5>62.30<br /><small class="fw-light">USD/Month</small></h5>
                                </div>
                                <div class="col-auto text-end">
                                    <p class="text-secondary">Average Maintenance <br />for this server</p>
                                </div>
                            </div>
                        </div>
                        <div class="card-body p-0">
                            <app-area-red-chartjs-100 class="height-110 d-block w-100 mb-2"></app-area-red-chartjs-100>
                        </div>
                    </div>
                </div>
            </div>

            <div class="row mb-3 mb-lg-4">
                <div class="col text-center py-3">
                    <h4>Digitization is not just <span class="text-gradient">Global Connectivity Medium</span> for interaction between humans</h4>
                    <p class="text-secondary">Now a days, We can sent commands/orders to a machine which can be anywhere in this UNIVERSE.</p>
                </div>
            </div>

            <div class="row gx-3 gx-lg-4">
                <div class="col-12 col-md-12 col-lg-8">
                    <div class="card adminuiux-card mb-3 mb-lg-4">
                        <div class="card-header">
                            <div class="row gx-3 align-items-center">
                                <div class="col-auto">
                                    <i class="bi bi-people h5  avatar avatar-40 bg-theme-1-subtle text-theme-1 rounded"></i>
                                </div>
                                <div class="col">
                                    <h6 class="mb-0">Traffic Source</h6>
                                    <p class="text-secondary small">Visitors/Users around the <b>Earth</b></p>
                                </div>
                                <div class="col-auto"></div>
                            </div>
                        </div>
                        <div class="card-body">
                            <div id="jsvectormap" class="w-100 height-300 "></div>
                        </div>
                        <div class="card-footer">
                            <div class="row gx-3">
                                <div class="col-6 col-md-3 col-lg-2 mb-3 mb-md-0">
                                    <p class="text-secondary small mb-1">Users</p>
                                    <h5>
                                        5.1k <small class="text-green fw-light fs-12"><i class=" bi bi-arrow-up vm"></i> 12%</small>
                                    </h5>
                                </div>
                                <div class="col-6 col-md-3 col-lg-2 mb-3 mb-md-0">
                                    <p class="text-secondary small mb-1">Sessions</p>
                                    <h5>
                                        6.8k <small class="text-green fw-light fs-12"><i class=" bi bi-arrow-up vm"></i> 2.1%</small>
                                    </h5>
                                </div>
                                <div class="col-6 col-md-3 col-lg-2">
                                    <p class="text-secondary small mb-1">Bounce Rate</p>
                                    <h5>
                                        3.18% <small class="text-red fw-light fs-12"><i class=" bi bi-arrow-up vm"></i> -4.2%</small>
                                    </h5>
                                </div>
                                <div class="col-6 col-md-3 col-lg-2">
                                    <p class="text-secondary small mb-1">Session Duration</p>
                                    <h5>
                                        1m 16s <small class="text-green fw-light fs-12"><i class=" bi bi-arrow-up vm"></i> 3.7%</small>
                                    </h5>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-12 col-md-12 col-lg-4">
                    <div class="card adminuiux-card mb-3 mb-lg-4">
                        <div class="card-header">
                            <div class="row gx-3 align-items-center">
                                <div class="col-auto">
                                    <i class="bi bi-globe h5  avatar avatar-40 bg-theme-1-subtle text-theme-1 rounded"></i>
                                </div>
                                <div class="col">
                                    <h6 class="mb-0">Top Country</h6>
                                    <p class="text-secondary small">Visitors/Users around the <b>Earth</b></p>
                                </div>
                                <div class="col-auto"></div>
                            </div>
                        </div>
                        <div class="card-body">
                            <app-bar-blue-chartjs-100-hori class="height-300 w-100 d-block"></app-bar-blue-chartjs-100-hori>
                        </div>
                        <div class="card-footer">
                            <div class="row gx-3">
                                <div class="col-6 col-md-4 mb-3 mb-md-0">
                                    <p class="text-secondary small mb-1">Users</p>
                                    <h5>
                                        5.1k <small class="text-green fw-light fs-12"><i class=" bi bi-arrow-up vm"></i> 12%</small>
                                    </h5>
                                </div>
                                <div class="col-6 col-md-4 mb-3 mb-md-0">
                                    <p class="text-secondary small mb-1">Sessions</p>
                                    <h5>
                                        6.8k <small class="text-green fw-light fs-12"><i class=" bi bi-arrow-up vm"></i> 2.1%</small>
                                    </h5>
                                </div>
                                <div class="col-6 col-md-4">
                                    <p class="text-secondary small mb-1">Bounce Rate</p>
                                    <h5>
                                        3.18% <small class="text-red fw-light fs-12"><i class=" bi bi-arrow-up vm"></i> -4.2%</small>
                                    </h5>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="row gx-3 gx-lg-4">
                <!-- Ticket Resolution track -->
                <div class="col-12 col-md-6 col-lg-6 col-xxl-4">
                    <div class="card adminuiux-card mb-3 mb-lg-4">
                        <div class="card-body">
                            <div class="row gx-3 align-items-center mb-3">
                                <div class="col-auto">
                                    <div class="avatar avatar-40 h6 bg-theme-1-subtle text-theme-1 theme-blue rounded">
                                        <i class="bi bi-patch-check"></i>
                                    </div>
                                </div>
                                <div class="col">
                                    <h6 class="mb-0">Ticket Resolution</h6>
                                    <p class="text-secondary small">Last 6 Months</p>
                                </div>
                            </div>

                            <h5>115824 <small class="fw-normal text-theme-1 theme-green">18.71 (0.73%)</small></h5>

                            <app-bar-blue-chartjs-100 class="height-90 d-block w-100"></app-bar-blue-chartjs-100>
                        </div>
                    </div>
                </div>
                <!-- Server space -->
                <div class="col-12 col-md-6 col-lg-6 col-xxl-4">
                    <div class="card adminuiux-card mb-3 mb-lg-4">
                        <div class="card-header">
                            <div class="row gx-3 align-items-center">
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
                            <div class="progress bg-theme-1-subtle text-theme-1 height-30 my-3">
                                <div class="progress-bar bg-theme-1 theme-yellow w-25" role="progressbar" aria-valuenow="25" aria-valuemin="0" aria-valuemax="100"></div>
                                <div class="progress-bar bg-theme-1 theme-green w-25" role="progressbar" aria-valuenow="25" aria-valuemin="0" aria-valuemax="100"></div>
                                <div class="progress-bar bg-theme-1 theme-red w-25" role="progressbar" aria-valuenow="25" aria-valuemin="0" aria-valuemax="100"></div>
                                <div class="progress-bar bg-theme-1-subtle text-theme-1 w-25" role="progressbar" aria-valuenow="25" aria-valuemin="0" aria-valuemax="100"></div>
                            </div>
                            <div class="row gx-3">
                                <p class="col text-secondary small mb-2"><span class="avatar avatar-10 bg-theme-1 theme-yellow me-1"></span>HTML</p>
                                <p class="col text-secondary small mb-2"><span class="avatar avatar-10 bg-theme-1 theme-green me-1"></span>CSS</p>
                                <p class="col text-secondary small mb-2"><span class="avatar avatar-10 bg-theme-1 theme-red me-1"></span>JS</p>
                                <p class="col text-secondary small mb-2"><span class="avatar avatar-10 bg-white-opacity text-white me-1"></span>Other</p>
                            </div>
                        </div>
                    </div>
                </div>
                <!-- Shared Drive -->
                <div class="col-12 col-md-12 col-lg-12 col-xxl-4 mb-3 mb-lg-4">
                    <div class="card adminuiux-card bg-theme-1 theme-blue">
                        <div class="card-header">
                            <div class="row gx-3 align-items-center">
                                <div class="col-auto">
                                    <i class="bi bi-folder h5 avatar avatar-40 bg-white-opacity text-white rounded"></i>
                                </div>
                                <div class="col">
                                    <h6 class="mb-0">Shared Drive</h6>
                                    <p class="opacity-75 small">Documents and Files</p>
                                </div>
                            </div>
                        </div>
                        <div class="card-body">
                            <div class="row gx-3 align-items-center">
                                <div class="col">
                                    <h5>105 Gb <small class="fw-normal opacity-50">of 150 Gb</small></h5>
                                </div>
                                <div class="col-auto">
                                    <p class="opacity-75 small">1548k Files</p>
                                </div>
                            </div>
                            <div class="progress bg-white-opacity text-white height-30 my-3">
                                <div class="progress-bar bg-theme-1 theme-yellow w-25" role="progressbar" aria-valuenow="25" aria-valuemin="0" aria-valuemax="100"></div>
                                <div class="progress-bar bg-theme-1 theme-green w-25" role="progressbar" aria-valuenow="25" aria-valuemin="0" aria-valuemax="100"></div>
                                <div class="progress-bar bg-theme-1 theme-red w-25" role="progressbar" aria-valuenow="25" aria-valuemin="0" aria-valuemax="100"></div>
                                <div class="progress-bar bg-white-opacity text-white w-25" role="progressbar" aria-valuenow="25" aria-valuemin="0" aria-valuemax="100"></div>
                            </div>
                            <div class="row gx-3">
                                <p class="col opacity-75 small mb-2"><span class="avatar avatar-10 bg-theme-1 theme-yellow me-1"></span>HTML</p>
                                <p class="col opacity-75 small mb-2"><span class="avatar avatar-10 bg-theme-1 theme-green me-1"></span>CSS</p>
                                <p class="col opacity-75 small mb-2"><span class="avatar avatar-10 bg-theme-1 theme-red me-1"></span>JS</p>
                                <p class="col opacity-75 small mb-2"><span class="avatar avatar-10 bg-white-opacity text-white me-1"></span>Other</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="row gx-3 gx-lg-4">
                <div class="col-12 col-md-12 col-lg-12 col-xl-12 col-xxl-8 position-relative mb-3 mb-lg-4">
                    <!-- Grid table-->
                    <div class="card adminuiux-card shadow-sm">
                        <div class="card-header">
                            <div class="row gx-3">
                                <div class="col-auto mb-3 mb-md-0">
                                    <i class="bi bi-shop h5  avatar avatar-40 bg-theme-1-subtle text-theme-1 rounded"></i>
                                </div>
                                <div class="col-9 col-md align-self-center mb-3 mb-md-0">
                                    <h6 class="mb-0">Tickets</h6>
                                    <p class="text-secondary small">All Open Tickets</p>
                                </div>
                                <div class="col-6 col-md-auto col-lg-4 col-xl-4 col-xxl-3">
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
                                <div class="col-6 col-md-auto">
                                    <div class="input-group ">
                                        <span class="input-group-text text-theme-1"><i class="bi bi-search"></i></span>
                                        <input type="text" class="form-control" placeholder="Search..." />
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="card-body py-0">
                            <table class="table datatable" id="dataTable">
                                <thead>
                                    <tr>
                                        <th class="all width-10"></th>
                                        <th class="all">ID</th>
                                        <th class="all">Raised By</th>
                                        <th class="desktop">Contact Details</th>
                                        <th class="desktop">Assigned To</th>
                                        <th class="tablet desktop">Status</th>
                                        <th class="all">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td></td>
                                        <td>2054ID</td>
                                        <td>
                                            <div class="row gx-3 align-items-center">
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
                                        <td>105ID</td>
                                        <td>
                                            <div class="row gx-3 align-items-center">
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
                                        <td>058ID</td>
                                        <td>
                                            <div class="row gx-3 align-items-center">
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
                                        <td>500ID</td>
                                        <td>
                                            <div class="row gx-3 align-items-center">
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
                                        <td>2054ID</td>
                                        <td>
                                            <div class="row gx-3 align-items-center">
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
                                        <td>105ID</td>
                                        <td>
                                            <div class="row gx-3 align-items-center">
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
                                        <td>058ID</td>
                                        <td>
                                            <div class="row gx-3 align-items-center">
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
                                        <td>500ID</td>
                                        <td>
                                            <div class="row gx-3 align-items-center">
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
                <!-- Shared drive files -->
                <div class="col-12 col-md-12 col-lg-12 col-xl-12 col-xxl-4 mb-3 mb-lg-4">
                    <div class="card adminuiux-card h-100">
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
                        <div class="card-body pb-0 px-0">
                            <table class="table border-top mb-0" id="dataTable2">
                                <thead class="d-none">
                                    <tr>
                                        <th class="width-180">File</th>
                                        <th class="all" class="width-80">Shared with</th>
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
export class NetworkPerformanceComponent {
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
