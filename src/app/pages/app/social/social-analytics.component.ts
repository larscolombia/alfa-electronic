import { Component, OnInit, AfterViewInit, AfterContentChecked, OnDestroy, ViewChild, ElementRef, CUSTOM_ELEMENTS_SCHEMA } from "@angular/core";
import { RouterLink } from "@angular/router";
import Choices, { ClassNames } from "choices.js";
declare const jsVectorMap: any;

import { DaterangePickerRangesComponent } from "../../../components/input-fields/daterange-picker/daterange-picker-ranges.component";
import { AnalyticsBannerChartComponent } from "../../../components/charts/analytics-banner-chart.component";
import { BarWhiteChartjs100Component } from "../../../components/charts/bar-white-chartjs-100.component";
import { AreaBlueChartjs100Component } from "../../../components/charts/area-blue-chartjs-100.component";
import { BarRedChartjs40Component } from "../../../components/charts/bar-red-chartjs-40.component";
import { AreaCyanChartjs60Component } from "../../../components/charts/area-cyan-chartjs-60.component";
import { BarBlueChartjs100HoriComponent } from "../../../components/charts/bar-blue-chartjs-100-hori.component";
import { BarPinkChartjs40Component } from "../../../components/charts/bar-pink-chartjs-40.component";
import { DoughnutChartjsMFComponent } from "../../../components/charts/doughnut-chartjs-mf.component";
import { AreaRedChartjs200Component } from "../../../components/charts/area-red-chartjs-200.component";
import { AreaGreenChartjs200Component } from "../../../components/charts/area-green-chartjs-200.component";

@Component({
    selector: "app-social-analytics",
    standalone: true,
    imports: [RouterLink, DaterangePickerRangesComponent, AnalyticsBannerChartComponent, BarWhiteChartjs100Component, AreaBlueChartjs100Component, BarPinkChartjs40Component, BarRedChartjs40Component, AreaCyanChartjs60Component, BarBlueChartjs100HoriComponent, DoughnutChartjsMFComponent, AreaRedChartjs200Component, AreaGreenChartjs200Component],
    template: `
        <!-- page title -->
        <div class="container-fluid py-3">
            <div class="row gx-3 gx-lg-4 align-items-center page-title">
                <div class="col col-sm mb-3 mb-sm-0 order-1">
                    <h5 class="mb-0">Social Dashboard</h5>
                    <p class="text-secondary small">Social network growth and tracking</p>
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
                    <li class="breadcrumb-item bi"><a routerLink="/app/social-dashboard">Social</a></li>
                    <li class="breadcrumb-item bi active" aria-current="page">Analytics</li>
                </ol>
            </nav>
        </div>

        <!-- content -->
        <div class="container mt-3" id="main-content">
            <!-- Big chart traffic flow-->
            <div class="row gx-3 gx-lg-4">
                <div class="col-12 col-sm-12 col-lg-12 col-xl-6">
                    <div class="card adminuiux-card mb-3 mb-lg-4">
                        <div class="card-header">
                            <div class="row gx-3 align-items-center">
                                <div class="col-auto">
                                    <i class="bi bi-globe h5 avatar avatar-40 bg-theme-1-subtle text-theme-1 rounded"></i>
                                </div>
                                <div class="col">
                                    <h6 class="mb-0">Audience</h6>
                                    <p class="small text-secondary">All channels and source</p>
                                </div>
                                <div class="col-4 col-md-5 col-lg-5 col-xl-5 col-xxl-4">
                                    <select class="form-select w-100">
                                        <optgroup label="Social">
                                            <option>- Facebook</option>
                                            <option>- Instagram</option>
                                            <option>- Twitter</option>
                                        </optgroup>
                                        <optgroup label="Feed">
                                            <option>- Dribbble</option>
                                            <option>- Youtube</option>
                                            <option>- Behance</option>
                                            <option>- Blogs</option>
                                        </optgroup>
                                        <option>Referral</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                        <div class="card-body">
                            <div class="tab-content" id="myTabContent">
                                <div class="tab-pane fade show active" id="trafic1" role="tabpanel" aria-labelledby="trafic1-tab">
                                    <app-analytics-banner-chart class="height-280 d-block"></app-analytics-banner-chart>
                                </div>
                                <div class="tab-pane fade" id="trafic2" role="tabpanel" aria-labelledby="trafic2-tab">...</div>
                                <div class="tab-pane fade" id="trafic3" role="tabpanel" aria-labelledby="trafic3-tab">...</div>
                            </div>
                        </div>
                        <div class="card-footer px-3 py-0 p-lg-0">
                            <ul class="nav nav-underline nav-fill" id="myTab" role="tablist">
                                <li class="nav-item" role="presentation">
                                    <button class="nav-link active px-0 px-lg-2" id="trafic1-tab" data-bs-toggle="tab" data-bs-target="#trafic1" type="button" role="tab" aria-controls="trafic1" aria-selected="true">
                                        <small class="text-secondary d-block mb-1">Engagement</small>
                                        <span>2,545,05 <small class="text-theme-1 theme-green d-block d-sm-inline-block mt-1 mt-sm-0">(0.73%)</small></span>
                                    </button>
                                </li>
                                <li class="nav-item" role="presentation">
                                    <button class="nav-link px-0 px-lg-2" id="trafic2-tab" data-bs-toggle="tab" data-bs-target="#trafic2" type="button" role="tab" aria-controls="trafic2" aria-selected="false">
                                        <small class="text-secondary d-block mb-1">Clicks</small>
                                        <span>1,545,05 <small class="text-theme-1 theme-green d-block d-sm-inline-block mt-1 mt-sm-0">(10.61%)</small></span>
                                    </button>
                                </li>
                                <li class="nav-item" role="presentation">
                                    <button class="nav-link px-0 px-lg-2" id="trafic3-tab" data-bs-toggle="tab" data-bs-target="#trafic3" type="button" role="tab" aria-controls="trafic3" aria-selected="false">
                                        <small class="text-secondary d-block mb-1">Shares</small>
                                        <span>1,845,05 <small class="text-theme-1 theme-green d-block d-sm-inline-block mt-1 mt-sm-0">(1.73%)</small></span>
                                    </button>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
                <div class="col-12 col-sm-6 col-md-6 col-lg-6 col-xl-3">
                    <div class="card adminuiux-card bg-theme-r-gradient text-white mb-3 mb-lg-4">
                        <div class="card-header bg-none">
                            <div class="row gx-3 align-items-center">
                                <div class="col-auto">
                                    <i class="bi bi-people h5 avatar avatar-40 bg-white-opacity text-white rounded"></i>
                                </div>
                                <div class="col">
                                    <h6 class="mb-0">Realtime</h6>
                                    <p class="small opacity-75">Right now at this time</p>
                                </div>
                            </div>
                        </div>
                        <div class="card-body pb-0">
                            <app-bar-white-chartjs-100 class="height-80 d-block mb-2"></app-bar-white-chartjs-100>
                            <p class="opacity-75 small mb-0">Active Pages</p>
                            <h6>5 <small class="fw-normal">at the moment</small></h6>
                        </div>
                        <div class="card-footer px-0">
                            <ul class="list-group list-group-flush border-0 bg-none mb-2">
                                <li class="list-group-item text-white">
                                    <div class="row gx-3">
                                        <div class="col align-self-center">
                                            <a href="" class="style-none text-white">getAdminUX/home</a>
                                        </div>
                                        <div class="col-auto">30</div>
                                    </div>
                                </li>
                                <li class="list-group-item text-white">
                                    <div class="row gx-3">
                                        <div class="col align-self-center">
                                            <a href="" class="style-none text-white">dashboard/finance</a>
                                        </div>
                                        <div class="col-auto">8</div>
                                    </div>
                                </li>
                                <li class="list-group-item text-white">
                                    <div class="row gx-3">
                                        <div class="col align-self-center">
                                            <a href="" class="style-none text-white">network/devices</a>
                                        </div>
                                        <div class="col-auto">11</div>
                                    </div>
                                </li>
                                <li class="list-group-item text-white">
                                    <div class="row gx-3">
                                        <div class="col align-self-center">
                                            <a href="" class="style-none text-white">device/performance</a>
                                        </div>
                                        <div class="col-auto">12</div>
                                    </div>
                                </li>
                                <li class="list-group-item text-white">
                                    <div class="row gx-3">
                                        <div class="col align-self-center">
                                            <a href="" class="style-none text-white">getAdminUX/license</a>
                                        </div>
                                        <div class="col-auto">25</div>
                                    </div>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
                <div class="col-12 col-sm-6 col-md-6 col-lg-6 col-xl-3">
                    <div class="card adminuiux-card mb-3 mb-lg-4">
                        <div class="card-header">
                            <div class="row gx-3 align-items-center">
                                <div class="col-auto">
                                    <i class="bi bi-arrow-repeat h5 avatar avatar-40 bg-theme-1-subtle text-theme-1 rounded"></i>
                                </div>
                                <div class="col">
                                    <h6 class="mb-0">Best traffic Channel</h6>
                                    <p class="small opacity-75">Increase sales</p>
                                </div>
                            </div>
                        </div>
                        <div class="card-body">
                            <div class="row mb-3">
                                <div class="col-auto">
                                    <i class="bi bi-instagram h5 avatar avatar-40 border text-gradient rounded"></i>
                                </div>
                                <div class="col">
                                    <div class="row gx-0">
                                        <div class="col">
                                            <p class="small text-secondary">Instagram</p>
                                        </div>
                                        <div class="col-auto">
                                            <p class="small text-theme-1 theme-green">+5%</p>
                                        </div>
                                    </div>
                                    <h6>1.5M <small class="text-normal text-secondary">Follower</small></h6>
                                </div>
                            </div>
                            <app-bar-pink-chartjs-40 class="height-90 d-block mb-3"></app-bar-pink-chartjs-40>
                            <div class="row text-center">
                                <div class="col mb-3">
                                    <p class="text-secondary small mb-0">Post Likes</p>
                                    <h6>55.15 k</h6>
                                </div>
                                <div class="col mb-3">
                                    <p class="text-secondary small mb-0">Shares</p>
                                    <h6>11.2 k</h6>
                                </div>
                                <div class="col mb-3">
                                    <p class="text-secondary small mb-0">Reach</p>
                                    <h6>1.5 m</h6>
                                </div>
                            </div>
                            <p>Your most popular traffic source is Instagram</p>
                            <p class="text-secondary small">You have 38% users comes from instagram and you should maintain your network thats our recommendations.</p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- statistics summary -->
            <div class="row gx-3 gx-lg-4">
                <div class="col-12 col-md-12 col-xl-6 col-xxl-4">
                    <div class="card adminuiux-card mb-3 mb-lg-4">
                        <div class="card-header">
                            <div class="row gx-3">
                                <div class="col-auto">
                                    <i class="bi bi-youtube h5 avatar avatar-40 bg-theme-1-subtle text-theme-1 theme-red rounded"></i>
                                </div>
                                <div class="col">
                                    <div class="row gx-0">
                                        <div class="col">
                                            <p class="small text-secondary">Youtube</p>
                                        </div>
                                        <div class="col-auto">
                                            <p class="small text-theme-1 theme-green">+2%</p>
                                        </div>
                                    </div>
                                    <h6>1.75M <small class="text-secondary">Follower</small></h6>
                                </div>
                            </div>
                        </div>
                        <div class="card-body pb-0">
                            <app-bar-red-chartjs-40 class="height-40 d-block mb-3"></app-bar-red-chartjs-40>

                            <div class="row gx-3">
                                <div class="col-6 col-sm mb-3">
                                    <p class="text-secondary small mb-0">Likes</p>
                                    <h6>65.35K</h6>
                                </div>
                                <div class="col-6 col-sm mb-3">
                                    <p class="text-secondary small mb-0">Shares</p>
                                    <h6>12.5K</h6>
                                </div>
                                <div class="col-6 col-sm mb-3">
                                    <p class="text-secondary small mb-0">Reach</p>
                                    <h6>1.75M</h6>
                                </div>
                                <div class="col-6 col-sm mb-3">
                                    <p class="text-secondary small mb-0">Clicks</p>
                                    <h6>85.01K</h6>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-12 col-md-6 col-lg-6 col-xl-6 col-xxl-4">
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
                        <div class="card-body pb-0">
                            <div class="row gx-3 align-items-center">
                                <div class="col-12 col-sm-6">
                                    <app-area-blue-chartjs-100 class="height-90 d-block mb-3"></app-area-blue-chartjs-100>
                                </div>
                                <div class="col-12 col-sm-6">
                                    <div class="row gx-2">
                                        <div class="col col-sm-6 mb-3">
                                            <p class="text-secondary small mb-0">Likes</p>
                                            <h6>65.35K</h6>
                                        </div>
                                        <div class="col col-sm-6 mb-3">
                                            <p class="text-secondary small mb-0">Shares</p>
                                            <h6>12.5K</h6>
                                        </div>
                                        <div class="col col-sm-6 mb-3">
                                            <p class="text-secondary small mb-0">Reach</p>
                                            <h6>1.75M</h6>
                                        </div>
                                        <div class="col col-sm-6 mb-3">
                                            <p class="text-secondary small mb-0">Clicks</p>
                                            <h6>85.01K</h6>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-12 col-md-6 col-lg-6 col-xl-6 col-xxl-4">
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
                        <div class="card-body pb-0">
                            <div class="row gx-3 align-items-center">
                                <div class="col-12 col-sm-6">
                                    <app-area-cyan-chartjs-60 class="height-90 d-block mb-3"></app-area-cyan-chartjs-60>
                                </div>
                                <div class="col-12 col-sm-6">
                                    <div class="row gx-2">
                                        <div class="col col-sm-6 mb-3">
                                            <p class="text-secondary small mb-0">Likes</p>
                                            <h6>65.35k</h6>
                                        </div>
                                        <div class="col col-sm-6 mb-3">
                                            <p class="text-secondary small mb-0">Shares</p>
                                            <h6>12.5k</h6>
                                        </div>
                                        <div class="col col-sm-6 mb-3">
                                            <p class="text-secondary small mb-0">Reach</p>
                                            <h6>1.75m</h6>
                                        </div>
                                        <div class="col col-sm-6 mb-3">
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

            <div class="row mb-3 mb-lg-4">
                <div class="col text-center py-3">
                    <h4>Statistics helps to <span class="text-gradient">understand user's behavior</span> for better world</h4>
                    <p class="text-secondary">Whenever you thought of to create new feature and update SEO this data required the most.</p>
                </div>
            </div>

            <div class="card adminuiux-card mb-3 mb-lg-4">
                <div class="card-header">
                    <div class="row gx-3 align-items-center">
                        <div class="col-auto">
                            <i class="bi bi-people h5 avatar avatar-40 bg-theme-1-subtle text-theme-1 rounded"></i>
                        </div>
                        <div class="col">
                            <h6 class="mb-0">Traffic Source</h6>
                            <p class="text-secondary small">Visitors/Users around the <b>Earth</b></p>
                        </div>
                    </div>
                </div>
                <div class="card-body">
                    <div class="row gx-3">
                        <div class="col-12 col-md-12 col-lg-8">
                            <div id="jsvectormap" class="w-100 h-300"></div>
                        </div>
                        <div class="col-12 col-md-12 col-lg-4">
                            <app-bar-blue-chartjs-100-hori class="height-300 d-block w-100"></app-bar-blue-chartjs-100-hori>
                        </div>
                    </div>
                </div>
                <div class="card-footer">
                    <div class="row gx-3">
                        <div class="col-6 col-md col-lg-3 col-xl-2 mb-3 mb-md-0">
                            <p class="text-secondary small mb-1">Users</p>
                            <h5>
                                5.1k <small class="text-green fw-linormal"><i class=" bi bi-arrow-up vm small"></i> 12%</small>
                            </h5>
                        </div>
                        <div class="col-6 col-md col-lg-3 col-xl-2 mb-3 mb-md-0">
                            <p class="text-secondary small mb-1">Sessions</p>
                            <h5>
                                6.8k <small class="text-green fw-linormal"><i class=" bi bi-arrow-up vm small"></i> 2.1%</small>
                            </h5>
                        </div>
                        <div class="col-6 col-md col-lg-3 col-xl-2">
                            <p class="text-secondary small mb-1">Bounce Rate</p>
                            <h5>
                                3.18% <small class="text-red fw-lignormal"><i class=" bi bi-arrow-up vm small"></i> -4.2%</small>
                            </h5>
                        </div>
                        <div class="col-6 col-md col-lg-3 col-xl-2">
                            <p class="text-secondary small mb-1">Session Duration</p>
                            <h5>
                                1m 16s <small class="text-green fw-normal"><i class=" bi bi-arrow-up vm small"></i> 3.7%</small>
                            </h5>
                        </div>
                    </div>
                </div>
            </div>

            <div class="row gx-3 gx-lg-4">
                <div class="col-12 col-md-12 col-lg-5 col-xl-4 col-xxl-4">
                    <!-- Chart traffic -->
                    <div class="card adminuiux-card mb-3 mb-lg-4">
                        <div class="card-header">
                            <div class="row gx-3">
                                <div class="col-auto">
                                    <i class="bi bi-gender-ambiguous h5 avatar avatar-40 bg-theme-1-subtle text-theme-1 theme-purple rounded"></i>
                                </div>
                                <div class="col-auto align-self-center">
                                    <h6 class="mb-1">Traffic by Genders</h6>
                                    <p class="text-secondary small">114586 users visited</p>
                                </div>
                            </div>
                        </div>
                        <div class="card-body">
                            <div class="width-200 position-relative text-center mb-3 mb-lg-4 mx-auto">
                                <app-doughnut-chartjs-mf class="avatar avatar-200 d-block mx-auto"></app-doughnut-chartjs-mf>
                                <div class="avatar avatar-140 position-absolute top-50 start-50 translate-middle shadow bg-white rounded-circle ">
                                    <div class="w-100 lh-20">
                                        <h5 class="mb-1">29.98K</h5>
                                        <p class="text-success small">18.71 (0.73%)</p>
                                    </div>
                                </div>
                            </div>
                            <div class="row gx-3">
                                <div class="col-6 text-end">
                                    <div class="row gx-3">
                                        <div class="col">
                                            <h6 class="text-dark mb-0">14000</h6>
                                            <p class="text-secondary small">Male Visitors</p>
                                        </div>
                                        <div class="col-auto">
                                            <span class="avatar avatar-40 bg-blue rounded text-white">
                                                <i class="bi bi-gender-male h5"></i>
                                            </span>
                                        </div>
                                        <div class="col-12 mt-3">
                                            <div class="row gx-3">
                                                <div class="col">
                                                    <p class="text-secondary small">Home</p>
                                                </div>
                                                <div class="col-auto">
                                                    <p class="text-green small">55%</p>
                                                </div>
                                            </div>
                                            <div class="row gx-3">
                                                <div class="col">
                                                    <p class="text-secondary small">Work</p>
                                                </div>
                                                <div class="col-auto">
                                                    <p class="text-green small">45%</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-6">
                                    <div class="row gx-3">
                                        <div class="col-auto">
                                            <span class="avatar avatar-40 bg-theme-1 theme-red rounded text-white">
                                                <i class="bi bi-gender-female h5"></i>
                                            </span>
                                        </div>
                                        <div class="col">
                                            <h6 class="text-dark mb-0">13568</h6>
                                            <p class="text-secondary small">Female Visitors</p>
                                        </div>
                                        <div class="col-12 mt-3">
                                            <div class="row gx-3">
                                                <div class="col-auto">
                                                    <p class="text-green small">73%</p>
                                                </div>
                                                <div class="col">
                                                    <p class="text-secondary small">Home</p>
                                                </div>
                                            </div>
                                            <div class="row gx-3">
                                                <div class="col-auto">
                                                    <p class="text-green small">27%</p>
                                                </div>
                                                <div class="col">
                                                    <p class="text-secondary small">Work</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <!-- Male Traffic card -->
                <div class="col-12 col-md-6 col-lg-7 col-xl-8 col-xxl-4">
                    <div class="card adminuiux-card mb-3 mb-lg-4">
                        <div class="card-header">
                            <div class="row gx-3 align-items-center">
                                <div class="col-auto">
                                    <i class="bi bi-gender-male h5 avatar avatar-40 bg-theme-1-subtle text-theme-1 theme-blue rounded"></i>
                                </div>
                                <div class="col">
                                    <h6 class="mb-0">Male Traffics</h6>
                                    <p class="text-secondary small">Last 6 Months</p>
                                </div>
                            </div>
                        </div>
                        <div class="card-body">
                            <h5 class="mb-1">
                                2,545 <small class="text-theme-1 theme-green"><i class="bi bi-arrow-up"></i> 108(0.73%)</small>
                            </h5>
                            <p class="mb-3"><span class="text-secondary ">Age range:</span> 26-55</p>
                            <app-area-green-chartjs-200 class="height-160 d-block"></app-area-green-chartjs-200>
                        </div>
                        <div class="card-footer text-center">
                            <div class="row gx-3 justify-content-center">
                                <div class="col-auto">
                                    <i class="bi bi-phone h5 mb-2 d-block"></i>
                                    <p class="text-secondary small mb-1">Mobile</p>
                                    <h6>
                                        5.1k <small class="text-green fw-normal"><i class=" bi bi-arrow-up vm small"></i> 12%</small>
                                    </h6>
                                </div>
                                <div class="col-auto">
                                    <i class="bi bi-tablet-landscape h5 mb-2 d-block"></i>
                                    <p class="text-secondary small mb-1">Tablet</p>
                                    <h6>
                                        6.8k <small class="text-green fw-normal"><i class=" bi bi-arrow-up vm small"></i> 2.1%</small>
                                    </h6>
                                </div>
                                <div class="col-auto">
                                    <i class="bi bi-laptop h5 mb-2 d-block"></i>
                                    <p class="text-secondary small mb-1">Laptop</p>
                                    <h6>
                                        3.18% <small class="text-red fw-normal"><i class=" bi bi-arrow-up vm small"></i> -4.2%</small>
                                    </h6>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <!-- Female traffic card -->
                <div class="col-12 col-md-6 col-lg-6 col-xxl-4">
                    <div class="card adminuiux-card mb-3 mb-lg-4">
                        <div class="card-header">
                            <div class="row gx-3 align-items-center">
                                <div class="col-auto">
                                    <i class="bi bi-gender-female h5 avatar avatar-40 bg-theme-1-subtle text-theme-1 theme-red rounded"></i>
                                </div>
                                <div class="col">
                                    <h6 class="mb-0">Female Traffic</h6>
                                    <p class="text-secondary small">Last 6 Months</p>
                                </div>
                            </div>
                        </div>
                        <div class="card-body">
                            <h5 class="mb-1">
                                4,101 <small class="text-theme-1 theme-green"><i class="bi bi-arrow-up"></i> 108 (1.83%)</small>
                            </h5>
                            <p class="mb-3"><span class="text-secondary">Age range:</span> 26-55</p>
                            <app-area-red-chartjs-200 class="height-160 d-block"></app-area-red-chartjs-200>
                        </div>
                        <div class="card-footer text-center">
                            <div class="row gx-3 justify-content-center">
                                <div class="col-auto">
                                    <i class="bi bi-phone h5 mb-2 d-block"></i>
                                    <p class="text-secondary small mb-1">Mobile</p>
                                    <h6>
                                        5.1k <small class="text-green fw-normal"><i class=" bi bi-arrow-up vm small"></i> 12%</small>
                                    </h6>
                                </div>
                                <div class="col-auto">
                                    <i class="bi bi-tablet-landscape h5 mb-2 d-block"></i>
                                    <p class="text-secondary small mb-1">Tablet</p>
                                    <h6>
                                        6.8k <small class="text-green fw-normal"><i class=" bi bi-arrow-up vm small"></i> 2.1%</small>
                                    </h6>
                                </div>
                                <div class="col-auto">
                                    <i class="bi bi-laptop h5 mb-2 d-block"></i>
                                    <p class="text-secondary small mb-1">Laptop</p>
                                    <h6>
                                        3.18% <small class="text-red fw-normal"><i class=" bi bi-arrow-up vm small"></i> -4.2%</small>
                                    </h6>
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
export class SocialAnalyticsComponent {
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
