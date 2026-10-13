import { Component, OnInit, AfterViewInit, AfterContentChecked, OnDestroy, ViewChild, ElementRef, CUSTOM_ELEMENTS_SCHEMA } from "@angular/core";
import { RouterLink } from "@angular/router";
import Choices, { ClassNames } from "choices.js";
import DataTable from "datatables.net-dt";
import "datatables.net-responsive-dt";
declare const jsVectorMap: any;

import { DaterangePickerRangesComponent } from "../../../components/input-fields/daterange-picker/daterange-picker-ranges.component";
import { BarPinkChartjs100Component } from "../../../components/charts/bar-pink-chartjs-100.component";
import { BarRedChartjs100Component } from "../../../components/charts/bar-red-chartjs-100.component";
import { BarPinkChartjs40Component } from "../../../components/charts/bar-pink-chartjs-40.component";
import { BarRedChartjs40Component } from "../../../components/charts/bar-red-chartjs-40.component";
import { SocialBannerChartComponent } from "../../../components/charts/social-banner-chart.component";
import { AreaCyanChartjs60Component } from "../../../components/charts/area-cyan-chartjs-60.component";
import { AreaBlueChartjs60Component } from "../../../components/charts/area-blue-chartjs-60.component";
import { BarBlueChartjs100Component } from "../../../components/charts/bar-blue-chartjs-100.component";
import { DoughnutChartjsMFComponent } from "../../../components/charts/doughnut-chartjs-mf.component";
import { AreaGreenChartjs200Component } from "../../../components/charts/area-green-chartjs-200.component";
import { AreaRedChartjs200Component } from "../../../components/charts/area-red-chartjs-200.component";

@Component({
    selector: "app-social-dashboard",
    standalone: true,
    imports: [RouterLink, DaterangePickerRangesComponent, BarPinkChartjs100Component, BarRedChartjs100Component, BarPinkChartjs40Component, BarRedChartjs40Component, SocialBannerChartComponent, AreaCyanChartjs60Component, AreaBlueChartjs60Component, BarBlueChartjs100Component, DoughnutChartjsMFComponent, AreaGreenChartjs200Component, AreaRedChartjs200Component],
    template: `
        <!-- page title -->
        <div class="container-fluid py-3">
            <div class="row gx-3 gx-lg-4 align-items-center page-title">
                <div class="col col-sm mb-3 mb-sm-0 order-1">
                    <h5 class="mb-0">Social Dashboard</h5>
                    <p class="text-secondary small">Digital Marketing Analytics Dashboard</p>
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
                    <li class="breadcrumb-item bi active" aria-current="page">Social</li>
                </ol>
            </nav>
        </div>

        <!-- content -->
        <div class="container mt-3" id="main-content">
            <!-- statistics summary -->
            <div class="row gx-3 gx-lg-4">
                <div class="col-12 col-sm-6 col-md-6 col-lg-6 col-xl-3 col-xxl-2">
                    <div class="card adminuiux-card mb-3 mb-lg-4">
                        <div class="card-header">
                            <div class="row gx-3">
                                <div class="col-auto">
                                    <i class="bi bi-instagram h5 avatar avatar-40 bg-theme-1-subtle text-theme-1 theme-pink rounded"></i>
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
                                    <h6>1.5M <small class="fs-14 text-secondary fw-normal">Follower</small></h6>
                                </div>
                            </div>
                        </div>
                        <div class="card-body pb-0">
                            <app-bar-pink-chartjs-100 class="height-90 d-block mb-3"></app-bar-pink-chartjs-100>
                            <div class="row gx-2">
                                <div class="col mb-3">
                                    <p class="text-secondary small mb-0">Post Likes</p>
                                    <h6>55.15k</h6>
                                </div>
                                <div class="col text-end mb-3">
                                    <p class="text-secondary small mb-0">Shares</p>
                                    <h6>11.2k</h6>
                                </div>
                            </div>
                            <div class="row gx-3">
                                <div class="col mb-3">
                                    <p class="text-secondary small mb-0">Reach</p>
                                    <h6>1.5M</h6>
                                </div>
                                <div class="col text-end mb-3">
                                    <p class="text-secondary small mb-0">Clicks</p>
                                    <h6>60.01k</h6>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-12 col-sm-6 col-md-6 col-lg-6 col-xl-3 col-xxl-2">
                    <div class="card adminuiux-card mb-3 mb-lg-4">
                        <div class="card-header">
                            <div class="row gx-3">
                                <div class="col-auto">
                                    <i class="bi bi-facebook h5 avatar avatar-40 bg-theme-1-subtle text-theme-1 theme-blue rounded"></i>
                                </div>
                                <div class="col">
                                    <div class="row gx-0">
                                        <div class="col">
                                            <p class="small text-secondary">Facebook</p>
                                        </div>
                                        <div class="col-auto">
                                            <p class="small text-theme-1 theme-green">+1%</p>
                                        </div>
                                    </div>
                                    <h6>1.5M <small class="fs-14 text-secondary fw-normal">Likes</small></h6>
                                </div>
                            </div>
                        </div>
                        <div class="card-body pb-0">
                            <app-bar-red-chartjs-100 class="height-90 d-block mb-3"></app-bar-red-chartjs-100>
                            <div class="row gx-2">
                                <div class="col mb-3">
                                    <p class="text-secondary small mb-0">Post Likes</p>
                                    <h6>65.35K</h6>
                                </div>
                                <div class="col text-end mb-3">
                                    <p class="text-secondary small mb-0">Shares</p>
                                    <h6>12.5K</h6>
                                </div>
                            </div>
                            <div class="row gx-3">
                                <div class="col mb-3">
                                    <p class="text-secondary small mb-0">Reach</p>
                                    <h6>1.75M</h6>
                                </div>
                                <div class="col text-end mb-3">
                                    <p class="text-secondary small mb-0">Clicks</p>
                                    <h6>85.01K</h6>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-12 col-md-6 col-lg-6 col-xl-6 col-xxl-4">
                    <div class="card adminuiux-card mb-3 mb-lg-4">
                        <div class="card-header">
                            <div class="row gx-3">
                                <div class="col-auto">
                                    <i class="bi bi-dribbble h5 avatar avatar-40 bg-theme-1-subtle text-theme-1 theme-pink rounded"></i>
                                </div>
                                <div class="col-auto">
                                    <div class="row gx-0">
                                        <div class="col">
                                            <p class="small text-secondary">Dribbble</p>
                                        </div>
                                        <div class="col-auto">
                                            <p class="small text-theme-1 theme-green">+1%</p>
                                        </div>
                                    </div>
                                    <h6>1.5M <small class="fs-14 text-secondary fw-normal">Follower</small></h6>
                                </div>
                                <div class="col-4 ms-auto">
                                    <app-bar-pink-chartjs-40 class="height-40 d-block"></app-bar-pink-chartjs-40>
                                </div>
                            </div>
                        </div>
                        <div class="card-body pb-0">
                            <div class="row gx-2">
                                <div class="col mb-3">
                                    <p class="text-secondary small mb-0">Post Likes</p>
                                    <h6>65.35K</h6>
                                </div>
                                <div class="col mb-3">
                                    <p class="text-secondary small mb-0">Shares</p>
                                    <h6>12.5K</h6>
                                </div>
                                <div class="col mb-3">
                                    <p class="text-secondary small mb-0">Reach</p>
                                    <h6>1.75M</h6>
                                </div>
                                <div class="col mb-3">
                                    <p class="text-secondary small mb-0">Clicks</p>
                                    <h6>85.01K</h6>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="card adminuiux-card mb-3 mb-lg-4">
                        <div class="card-header">
                            <div class="row gx-3">
                                <div class="col-auto">
                                    <i class="bi bi-youtube h5 avatar avatar-40 bg-theme-1-subtle text-theme-1 theme-red rounded"></i>
                                </div>
                                <div class="col-auto">
                                    <div class="row gx-0">
                                        <div class="col">
                                            <p class="small text-secondary">Youtube</p>
                                        </div>
                                        <div class="col-auto">
                                            <p class="small text-theme-1 theme-green">+2%</p>
                                        </div>
                                    </div>
                                    <h6>1.75M <small class="fs-14 text-secondary fw-normal">Subscriber</small></h6>
                                </div>
                                <div class="col-4 ms-auto">
                                    <app-bar-red-chartjs-40 class="height-40 d-block"></app-bar-red-chartjs-40>
                                </div>
                            </div>
                        </div>
                        <div class="card-body pb-0">
                            <div class="row gx-2">
                                <div class="col mb-3">
                                    <p class="text-secondary small mb-0">Post Likes</p>
                                    <h6>65.35K</h6>
                                </div>
                                <div class="col mb-3">
                                    <p class="text-secondary small mb-0">Shares</p>
                                    <h6>12.5K</h6>
                                </div>
                                <div class="col mb-3">
                                    <p class="text-secondary small mb-0">Reach</p>
                                    <h6>1.75M</h6>
                                </div>
                                <div class="col mb-3">
                                    <p class="text-secondary small mb-0">Clicks</p>
                                    <h6>85.01K</h6>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-12 col-md-6 col-lg-6 col-xl-12 col-xxl-4">
                    <!-- Social card -->
                    <div class="card adminuiux-card bg-theme-r-gradient text-white mb-3 mb-lg-4">
                        <div class="card-header">
                            <div class="row gx-3 align-items-center">
                                <div class="col-auto">
                                    <i class="bi bi-people h5 avatar avatar-40 bg-white-opacity text-white rounded"></i>
                                </div>
                                <div class="col">
                                    <h6 class="mb-0">Popular Post</h6>
                                    <p class="opacity-75">21 October 2021</p>
                                </div>
                            </div>
                        </div>
                        <div class="card-body ">
                            <div class="row gx-3 align-items-center">
                                <div class="col-4 col-md-3 col-lg-3 col-xl-3 col-xxl-4 mb-3">
                                    <figure class="coverimg rounded w-100 height-120 mb-0">
                                        <img src="assets/img/modern-ai-image/pet-4.jpg" alt="" class="mw-100" />
                                    </figure>
                                </div>
                                <div class="col mb-3">
                                    <h6 class="mb-2">Learn about software and Framework. All Design and Usability practices</h6>
                                    <p class="opacity-75 small mb-1">We have represented best product and template with great user experience</p>
                                </div>
                            </div>

                            <div class="row gx-3 align-items-center">
                                <div class="col-auto">
                                    <p class="opacity-75 mb-1">Engaged Audience</p>
                                    <h6>2,545,05</h6>
                                </div>
                                <div class="col-auto ms-auto">
                                    <a routerLink="/app/blogs" class="btn btn-link text-white">Read More</a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Big chart traffic flow-->
            <div class="card adminuiux-card mb-3 mb-lg-4">
                <div class="card-header">
                    <div class="row gx-3 align-items-center">
                        <div class="col-auto mb-3 mb-lg-0">
                            <i class="bi bi-people h5 avatar avatar-40 bg-theme-1-subtle text-theme-1 rounded"></i>
                        </div>
                        <div class="col mb-3 mb-lg-0">
                            <h6 class="mb-0">Server</h6>
                            <p class="small text-secondary">Uptime 100%</p>
                        </div>
                        <div class="col-12 col-md-6 col-lg-4">
                            <select class="choices w-100" #choices2 multiple data-placeholder="Select Account">
                                <optgroup label="Social">
                                    <option>Facebook</option>
                                    <option>Instagram</option>
                                    <option>Twitter</option>
                                </optgroup>
                                <optgroup label="Feed">
                                    <option>Dribbble</option>
                                    <option>Youtube</option>
                                    <option>Behance</option>
                                    <option>Blogs</option>
                                </optgroup>
                                <option>Referral</option>
                            </select>
                        </div>
                    </div>
                </div>
                <div class="card-body pb-0">
                    <div class="tab-content" id="myTabContent">
                        <div class="tab-pane fade show active" id="trafic1" role="tabpanel" aria-labelledby="trafic1-tab">
                            <div class="row gx-3">
                                <div class="col-12 col-md-12 col-lg-7 col-xl-9 mb-3 mb-lg-0">
                                    <app-social-banner-chart class="height-200 d-block"></app-social-banner-chart>
                                </div>
                                <div class="col-12 col-md-12 col-lg-5 col-xl-3">
                                    <div class="row gx-3">
                                        <div class="col-12 col-md-6 col-lg-12 mb-3">
                                            <div class="row gx-3">
                                                <div class="col-auto">
                                                    <i class="avatar avatar-10 rounded bg-red"></i>
                                                </div>
                                                <div class="col">
                                                    <h6 class="mb-1">2021 total Traffic</h6>
                                                    <div class="row small">
                                                        <div class="col text-secondary">Share</div>
                                                        <div class="col-auto text-theme-1 theme-green">10.15%</div>
                                                    </div>
                                                    <div class="row small">
                                                        <div class="col text-secondary">Likes</div>
                                                        <div class="col-auto text-theme-1 theme-red">5.63%</div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="col-12 col-md-6 col-lg-12">
                                            <div class="row gx-3">
                                                <div class="col-auto">
                                                    <i class="avatar avatar-10 rounded bg-theme-1 theme-blue"></i>
                                                </div>
                                                <div class="col">
                                                    <h6 class="mb-1">2022 total Traffic</h6>
                                                    <div class="row small">
                                                        <div class="col text-secondary">Share</div>
                                                        <div class="col-auto text-theme-1 theme-green">10.15%</div>
                                                    </div>
                                                    <div class="row small">
                                                        <div class="col text-secondary">Likes</div>
                                                        <div class="col-auto text-theme-1 theme-red">5.63%</div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="tab-pane fade" id="trafic2" role="tabpanel" aria-labelledby="trafic2-tab">...</div>
                        <div class="tab-pane fade" id="trafic3" role="tabpanel" aria-labelledby="trafic3-tab">...</div>
                    </div>
                </div>
                <div class="card-footer pb-0">
                    <ul class="nav nav-underline" id="myTab" role="tablist">
                        <li class="nav-item" role="presentation">
                            <button class="nav-link active px-0 px-lg-3" id="trafic1-tab" data-bs-toggle="tab" data-bs-target="#trafic1" type="button" role="tab" aria-controls="trafic1" aria-selected="true">
                                <small class="text-secondary d-block mb-1">Engagement</small>
                                <span>254.0M <small class="text-theme-1 theme-green">(0.73%)</small></span>
                            </button>
                        </li>
                        <li class="nav-item" role="presentation">
                            <button class="nav-link px-0 px-lg-3" id="trafic2-tab" data-bs-toggle="tab" data-bs-target="#trafic2" type="button" role="tab" aria-controls="trafic2" aria-selected="false">
                                <small class="text-secondary d-block mb-1">Clicks</small>
                                <span>1.55M <small class="text-theme-1 theme-green">(10.61%)</small></span>
                            </button>
                        </li>
                        <li class="nav-item" role="presentation">
                            <button class="nav-link px-0 px-lg-3" id="trafic3-tab" data-bs-toggle="tab" data-bs-target="#trafic3" type="button" role="tab" aria-controls="trafic3" aria-selected="false">
                                <small class="text-secondary d-block mb-1">Shares</small>
                                <span>1.845M <small class="text-theme-1 theme-green">(1.73%)</small></span>
                            </button>
                        </li>
                    </ul>
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
                    <div class="card adminuiux-card mb-3 mb-lg-4">
                        <div class="card-header">
                            <div class="row gx-3 align-items-center">
                                <div class="col-auto">
                                    <i class="bi bi-newspaper h5 avatar avatar-40 bg-theme-1-subtle text-theme-1 rounded"></i>
                                </div>
                                <div class="col">
                                    <h6 class="mb-0">Boosted Post</h6>
                                    <p class="text-secondary small">Best reached</p>
                                </div>
                            </div>
                        </div>
                        <div class="card-body pb-0">
                            <div class="row gx-3 align-items-center">
                                <div class="col-4 col-md-3 col-lg-4 col-xl-4 col-xxl-5 mb-3">
                                    <figure class="coverimg rounded w-100 height-70 mb-0">
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
                                    <p class="text-secondary small mb-1">Likes</p>
                                    <h6>65.35 k</h6>
                                </div>
                                <div class="col mb-3">
                                    <p class="text-secondary small mb-1">Retweet</p>
                                    <h6>12.5 k</h6>
                                </div>
                                <div class="col mb-3">
                                    <p class="text-secondary small mb-1">Clicks</p>
                                    <h6>85.01 k</h6>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <!--charts category summary-->
                <div class="col-12 col-md-6 col-lg-6 col-xxl-3">
                    <div class="card adminuiux-card mb-3 mb-lg-4">
                        <div class="card-header">
                            <div class="row gx-3 align-items-center">
                                <div class="col-auto">
                                    <i class="bi bi-linkedin h5 avatar avatar-40 bg-theme-1-subtle text-theme-1 theme-blue rounded"></i>
                                </div>
                                <div class="col">
                                    <div class="row gx-3 mb-1">
                                        <div class="col">
                                            <p class="text-secondary small">Linkedin</p>
                                        </div>
                                        <div class="col-auto">
                                            <p class="small text-theme-1 theme-red">-1.58%</p>
                                        </div>
                                    </div>
                                    <h6>1.8M <small>Connections</small></h6>
                                </div>
                            </div>
                        </div>
                        <div class="card-body pb-0">
                            <div class="row gx-3 align-items-center">
                                <div class="col-5">
                                    <app-area-blue-chartjs-60 class="height-90 d-block mb-2"></app-area-blue-chartjs-60>
                                </div>
                                <div class="col-7">
                                    <div class="row gx-2">
                                        <div class="col-6 mb-3">
                                            <p class="text-secondary small mb-0">Likes</p>
                                            <h6>65.35K</h6>
                                        </div>
                                        <div class="col-6 mb-3">
                                            <p class="text-secondary small mb-0">Shares</p>
                                            <h6>12.5K</h6>
                                        </div>
                                        <div class="col-6 mb-3">
                                            <p class="text-secondary small mb-0">Reach</p>
                                            <h6>1.75M</h6>
                                        </div>
                                        <div class="col-6 mb-3">
                                            <p class="text-secondary small mb-0">Clicks</p>
                                            <h6>85.01K</h6>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="card adminuiux-card mb-3 mb-lg-4">
                        <div class="card-header">
                            <div class="row gx-3 align-items-center">
                                <div class="col-auto">
                                    <i class="bi bi-twitter h5 avatar avatar-40 bg-theme-1-subtle text-theme-1 theme-cyan rounded"></i>
                                </div>
                                <div class="col">
                                    <div class="row mb-1">
                                        <div class="col">
                                            <p class="text-secondary small">Linkedin</p>
                                        </div>
                                        <div class="col-auto">
                                            <p class="small text-theme-1 theme-green">2.15%</p>
                                        </div>
                                    </div>
                                    <h6>1.8M <small>Connections</small></h6>
                                </div>
                            </div>
                        </div>
                        <div class="card-body pb-0 pt-3">
                            <div class="row gx-3 align-items-center">
                                <div class="col-5">
                                    <app-area-cyan-chartjs-60 class="height-90 d-block mb-2"></app-area-cyan-chartjs-60>
                                </div>
                                <div class="col-7">
                                    <div class="row gx-2">
                                        <div class="col-6 mb-3">
                                            <p class="text-secondary small mb-0">Likes</p>
                                            <h6>65.35K</h6>
                                        </div>
                                        <div class="col-6 mb-3">
                                            <p class="text-secondary small mb-0">Shares</p>
                                            <h6>12.5K</h6>
                                        </div>
                                        <div class="col-6 mb-3">
                                            <p class="text-secondary small mb-0">Reach</p>
                                            <h6>1.75K</h6>
                                        </div>
                                        <div class="col-6 mb-3">
                                            <p class="text-secondary small mb-0">Clicks</p>
                                            <h6>85.01K</h6>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <!-- offers and events -->
                <div class="col-12 col-md-6 col-lg-6 col-xxl-3">
                    <div class="card adminuiux-card mb-3 mb-lg-4">
                        <div class="card-header">
                            <h6 class="mb-0">Social Media Management</h6>
                            <p class="text-secondary small">Go with trend, Protect your future</p>
                        </div>
                        <div class="card-body">
                            <div class="row gx-3 align-items-center mb-3">
                                <div class="col-2 mb-2">
                                    <i class="bi bi-calendar-event h5 text-theme-1 theme-green"></i>
                                </div>
                                <div class="col-8 mb-2">
                                    <h6 class="mb-1">25-01-2021, 9:30 AM</h6>
                                    <p class="text-secondary text-truncated small">1409 Main St, La Crosse, KS 67548,US</p>
                                </div>
                            </div>

                            <div class="row gx-3 align-items-center">
                                <div class="col-auto avatar-group">
                                    <div class="avatar avatar-30 coverimg rounded-circle">
                                        <img src="assets/img/modern-ai-image/user-2.jpg" alt="" />
                                    </div>
                                    <div class="avatar avatar-30 coverimg rounded-circle">
                                        <img src="assets/img/modern-ai-image/user-3.jpg" alt="" />
                                    </div>
                                    <div class="avatar avatar-30 coverimg rounded-circle">
                                        <img src="assets/img/modern-ai-image/user-4.jpg" alt="" />
                                    </div>
                                </div>
                                <div class="col">
                                    <h5>1525K</h5>
                                </div>
                                <div class="col-auto">
                                    <a class="btn btn-sm btn-theme" routerLink="/app/payment">Joined</a>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="card adminuiux-card mb-3 mb-lg-4 overflow-hidden">
                        <div class="row mx-0">
                            <div class="col-6 bg-theme-1 text-center py-4 z-index-1">
                                <div class="position-relative">
                                    <h4 class="mb-2">15% OFF</h4>
                                    <p class="opacity-75 small mb-3">Price including with our launch offer get 5% Extra</p>
                                    <button class="copy-text btn btn-sm btn-rounded btn-outline-dashed text-white border-white mb-1">GOREELDRIVE</button>
                                </div>
                            </div>
                            <div class="col-6 position-relative">
                                <figure class="coverimg position-absolute w-100 h-100 start-0 top-0">
                                    <img src="assets/img/modern-ai-image/user-1-kid.jpg" class="mw-100" alt="" />
                                </figure>
                            </div>
                        </div>
                    </div>
                </div>
                <!--mangers updates-->
                <div class="col-12 col-md-6 col-lg-6 col-xxl-3">
                    <div class="card adminuiux-card mb-3 mb-lg-4 overflow-hidden">
                        <div class="card-header">
                            <div class="row gx-3 align-items-center">
                                <div class="col-auto">
                                    <i class="bi bi-people h5 avatar avatar-40 bg-theme-1-subtle text-theme-1 theme-blue rounded"></i>
                                </div>
                                <div class="col">
                                    <h6 class="mb-0">Manager</h6>
                                    <p class="text-secondary small">3 Admins</p>
                                </div>
                            </div>
                        </div>
                        <div class="card-body">
                            <app-bar-blue-chartjs-100 class="height-80 d-block mb-3"></app-bar-blue-chartjs-100>
                            <p class="text-secondary small mb-0">Campaign Created</p>
                            <h5>5281 <small class="fw-normal">This year</small></h5>
                        </div>
                        <div class="card-footer p-0">
                            <ul class="list-group list-group-flush border-0 bg-none">
                                <li class="list-group-item">
                                    <div class="row gx-3">
                                        <div class="col-auto align-self-center">
                                            <figure class="avatar avatar-40 rounded-circle coverimg vm">
                                                <img src="assets/img/modern-ai-image/user-4.jpg" alt="" />
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
                                                <img src="assets/img/modern-ai-image/user-3.jpg" alt="" />
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
                                <li class="list-group-item">
                                    <div class="row gx-3">
                                        <div class="col-auto align-self-center">
                                            <figure class="avatar avatar-40 rounded-circle coverimg vm">
                                                <img src="assets/img/modern-ai-image/user-2.jpg" alt="" />
                                            </figure>
                                        </div>
                                        <div class="col px-0 align-self-center">
                                            <p class="mb-0">Julia D'Souza</p>
                                            <p class="small text-secondary">$ 163.00</p>
                                        </div>
                                        <div class="col-auto ps-0 align-self-center">
                                            <i class="bi bi-chevron-right text-muted small vm"></i>
                                        </div>
                                    </div>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>

            <div class="row mb-3 mb-lg-4">
                <div class="col text-center py-3">
                    <h4>Special <span class="text-gradient">Widgets</span> flexible & elastic</h4>
                    <p class="text-secondary">Pick the best which is useful to your customer</p>
                </div>
            </div>

            <div class="row gx-3 gx-lg-4">
                <div class="col-12 col-md-12 col-lg-12 col-xl-8">
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
                            <div id="jsvectormap" class="w-100 height-250"></div>
                        </div>
                        <div class="card-footer">
                            <div class="row gx-3">
                                <div class="col mb-3 mb-md-0">
                                    <p class="text-secondary small mb-1">Users</p>
                                    <h5>
                                        5.1K <small class="text-green"><i class=" bi bi-arrow-up vm small"></i> 12%</small>
                                    </h5>
                                </div>
                                <div class="col mb-3 mb-md-0">
                                    <p class="text-secondary small mb-1">Sessions</p>
                                    <h5>
                                        6.8K <small class="text-green"><i class=" bi bi-arrow-up vm small"></i> 2.1%</small>
                                    </h5>
                                </div>
                                <div class="col">
                                    <p class="text-secondary small mb-1">Bounce Rate</p>
                                    <h5>
                                        3.18% <small class="text-red"><i class=" bi bi-arrow-up vm small"></i> -4.2%</small>
                                    </h5>
                                </div>
                                <div class="col">
                                    <p class="text-secondary small mb-1">Session Duration</p>
                                    <h5>
                                        1m 16s <small class="text-green"><i class=" bi bi-arrow-up vm small"></i> 3.7%</small>
                                    </h5>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="col-12 col-md-6 col-lg-6 col-xl-4 col-xxl-4 position-relative column-set">
                    <!-- Chart traffic -->
                    <div class="card adminuiux-card mb-3 mb-lg-4">
                        <div class="card-header">
                            <div class="row gx-3">
                                <div class="col-auto">
                                    <i class="bi bi-gender-ambiguous h5 avatar avatar-40 bg-theme-1-subtle text-theme-1 theme-green rounded"></i>
                                </div>
                                <div class="col-auto align-self-center">
                                    <h6 class="mb-0">Traffic by Genders</h6>
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

                <!-- Subscribe upgrade plan -->
                <div class="col-12 col-md-6 col-lg-6 col-xxl-4">
                    <div class="card adminuiux-card overflow-hidden mb-3 mb-lg-4">
                        <div class="card-header">
                            <div class="row gx-3 align-items-center">
                                <div class="col-auto">
                                    <i class="bi bi-award h5 avatar avatar-40 bg-theme-1-subtle text-theme-1 theme-green rounded"></i>
                                </div>
                                <div class="col">
                                    <h6 class="mb-0">Subscribe PRO account</h6>
                                    <p class="text-secondary small">60 USD per year</p>
                                </div>
                            </div>
                        </div>
                        <div class="card-body p-0">
                            <ul class="list-group list-group-flush border-0 bg-none">
                                <li class="list-group-item text-secondary">
                                    <div class="row gx-3">
                                        <div class="col-auto">
                                            <i class="bi bi-check-circle text-muted"></i>
                                        </div>
                                        <div class="col-auto">Unlimited Send Money</div>
                                    </div>
                                </li>
                                <li class="list-group-item text-secondary">
                                    <div class="row gx-3">
                                        <div class="col-auto">
                                            <i class="bi bi-check-circle text-muted"></i>
                                        </div>
                                        <div class="col-auto">Multiple Currencies Support</div>
                                    </div>
                                </li>
                                <li class="list-group-item text-secondary">
                                    <div class="row gx-3">
                                        <div class="col-auto">
                                            <i class="bi bi-check-circle text-muted"></i>
                                        </div>
                                        <div class="col-auto">Unlimited Send Money</div>
                                    </div>
                                </li>
                            </ul>
                        </div>
                        <div class="card-body">
                            <div class="row gx-3">
                                <div class="col-6">
                                    <div class="form-check form-check-circle">
                                        <input class="form-check-input" type="radio" name="priceupgrade" value="" id="priceupgrade1" checked />
                                        <label class="form-check-label" for="priceupgrade1">
                                            <span class="h5">251.00 <small>USD</small></span
                                            ><br />
                                            <span class="text-secondary small">5 Years <span class="text-theme-1 theme-green">13% Off</span></span>
                                        </label>
                                    </div>
                                </div>
                                <div class="col-6">
                                    <div class="form-check form-check-circle">
                                        <input class="form-check-input" type="radio" name="priceupgrade" value="" id="priceupgrade2" />
                                        <label class="form-check-label" for="priceupgrade2">
                                            <span class="h5">108.00 <small>USD</small></span
                                            ><br />
                                            <span class="text-secondary small">2 Years <span class="text-theme-1 theme-green">10% Off</span></span>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="card-footer">
                            <div class="row gx-3">
                                <div class="col">
                                    <div class="input-group ">
                                        <span class="input-group-text text-theme-1"><i class="bi bi-tag h5"></i></span>
                                        <input type="text" class="form-control" placeholder="Coupon Code" value="13DISCNEW21" />
                                        <span class="input-group-text text-theme-1 theme-green"><i class="bi bi-patch-check h5"></i></span>
                                    </div>
                                </div>
                                <div class="col-auto">
                                    <a class="btn btn-theme" routerLink="/app/payment">Pay Now</a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <!-- Income green chart card -->
                <div class="col-12 col-md-6 col-lg-6 col-xxl-4">
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
                            <h5 class="mb-0">
                                2,545 <small class="text-theme-1 theme-green"><i class="bi bi-arrow-up"></i> 108(0.73%)</small>
                            </h5>
                            <p class="mb-3 mb-lg-4"><span class="text-secondary">Age range:</span> 26-55</p>
                            <app-area-green-chartjs-200 class="height-160 w-100 d-block"></app-area-green-chartjs-200>
                        </div>
                    </div>
                </div>
                <!-- Expense red chart card -->
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
                            <h5 class="mb-0">
                                4,101 <small class="text-theme-1 theme-green"><i class="bi bi-arrow-up"></i> 108 (1.83%)</small>
                            </h5>
                            <p class="mb-3 mb-lg-4"><span class="text-secondary">Age range:</span> 26-55</p>
                            <app-area-red-chartjs-200 class="height-160 w-100 d-block"></app-area-red-chartjs-200>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `,
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class SocialDashboardComponent {
    @ViewChild("choices") mySelect!: ElementRef;
    @ViewChild("choices2") mySelect2!: ElementRef;

    ngAfterViewInit() {
        const choices = new Choices(this.mySelect.nativeElement, {
            searchEnabled: true,
            removeItemButton: true,
            classNames: {
                containerOuter: ["choices", "maxwidth-dynamic"],
            } as ClassNames,
            placeholderValue: "Type...",
        });
        const choices2 = new Choices(this.mySelect2.nativeElement, {
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
