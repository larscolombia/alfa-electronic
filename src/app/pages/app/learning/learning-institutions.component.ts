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
import { BankBannerChartComponent } from "../../../components/charts/bank-banner-chart.component";
import { CircleProgressRedComponent } from "../../../components/charts/circle-progress-red.component";
import { CircleProgressBlueComponent } from "../../../components/charts/circle-progress-blue.component";
import { CircleProgressGreenComponent } from "../../../components/charts/circle-progress-green.component";
import { CircleProgressYellowComponent } from "../../../components/charts/circle-progress-yellow.component";
import { BarBlueChartjs100HoriComponent } from "../../../components/charts/bar-blue-chartjs-100-hori.component";
import { BarBlueChartjs100Component } from "../../../components/charts/bar-blue-chartjs-100.component";
import { DoughnutChartjs180Component } from "../../../components/charts/doughnut-chartjs-180.component";
import { CircleProgressBlueBlankComponent } from "../../../components/charts/circle-progress-blue-blank.component";
import { CircleProgressYellowBlankComponent } from "../../../components/charts/circle-progress-yellow-blank.component";
import { CircleProgressRedBlankComponent } from "../../../components/charts/circle-progress-red-blank.component";
import { CircleProgressWhiteBlankComponent } from "../../../components/charts/circle-progress-white-blank.component";

@Component({
    selector: "app-learning-institutions",
    standalone: true,
    imports: [RouterLink, DaterangePickerRangesComponent, BankBannerChartComponent, CircleProgressRedComponent, CircleProgressBlueComponent, CircleProgressGreenComponent, CircleProgressYellowComponent, BarBlueChartjs100HoriComponent, BarBlueChartjs100Component, DoughnutChartjs180Component, CircleProgressBlueBlankComponent, CircleProgressYellowBlankComponent, CircleProgressRedBlankComponent, CircleProgressWhiteBlankComponent],
    template: `
        <!-- page title -->
        <div class="container-fluid py-3">
            <div class="row gx-3 gx-lg-4 align-items-center page-title">
                <div class="col col-sm mb-3 mb-sm-0 order-1">
                    <h5 class="mb-0">Institutions</h5>
                    <p class="text-secondary small">Keep eyes on tracking MPU, Projects and progress</p>
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
                    <li class="breadcrumb-item bi">
                        <a routerLink="/app/learning-dashboard"><i class="bi bi-house-door me-2"></i> Learning</a>
                    </li>
                    <li class="breadcrumb-item bi active" aria-current="page">Institutions</li>
                </ol>
            </nav>
        </div>

        <!-- content -->
        <div class="container mt-3" id="main-content">
            <div class="row gx-3 gx-lg-4">
                <!-- balance message -->
                <div class="col-auto col-lg-3 col-xxl-2 mb-3 mb-lg-4">
                    <p class="text-secondary mb-0">Total Earning</p>
                    <h4 class="mb-0">256K <small>USD</small></h4>
                    <span
                        >4.28k <small class="text-theme-1 theme-green">18.0% <i class="bi bi-arrow-up"></i></small
                    ></span>
                </div>
                <div class="col-auto col-lg-3 col-xxl-2 mb-3 mb-lg-4">
                    <p class="text-secondary mb-0">Courses</p>
                    <h4>18 <a class="btn btn-sm btn-link">Add New</a></h4>
                </div>
                <div class="col-auto  mb-3 mb-lg-4">
                    <p class="text-secondary mb-0">Available</p>
                    <h4>125.25k <small>USD</small> <button class="btn btn-sm btn-link">Withdraw</button></h4>
                </div>
            </div>
        </div>

        <div class="container-fluid">
            <div class="row gx-3">
                <div class="col-12 px-0">
                    <app-bank-banner-chart class="height-240 d-block mb-3 mb-lg-4"></app-bank-banner-chart>
                </div>
            </div>
        </div>

        <div class="container">
            <div class="row gx-3 gx-lg-4 align-items-center justify-content-center">
                <div class="col-12 col-md-6 col-lg-3 mb-3 mb-lg-4">
                    <div class="row gx-3 align-items-center">
                        <div class="col-auto">
                            <div class="avatar avatar-60 rounded bg-theme-1-subtle text-theme-1 theme-green">
                                <i class="bi bi-wallet2 h4"></i>
                            </div>
                        </div>
                        <div class="col">
                            <p class="text-secondary small mb-1">Income</p>
                            <h5 class="text-dark mb-0"><span class="increamentcount">52000</span> <small class="h6">USD</small></h5>
                            <p class="small">
                                36.00 <span class="text-green"><i class="bi bi-arrow-up fs-10"></i>3.15%</span>
                            </p>
                        </div>
                    </div>
                </div>
                <div class="col-12 col-md-6 col-lg-3 mb-3 mb-lg-4">
                    <div class="row gx-3 align-items-center">
                        <div class="col-auto">
                            <div class="avatar avatar-60 rounded bg-theme-1-subtle text-theme-1 theme-red">
                                <i class="bi bi-cast h4"></i>
                            </div>
                        </div>
                        <div class="col">
                            <p class="text-secondary small mb-1">Material</p>
                            <h5 class="text-dark mb-0"><span class="increamentcount">12856</span> <small class="h6">Videos</small></h5>
                            <p class="small">
                                689 <span class="text-green"><i class="bi bi-arrow-up fs-10"></i>2.43%</span>
                            </p>
                        </div>
                    </div>
                </div>
                <div class="col-12 col-md-6 col-lg-3 mb-3 mb-lg-4">
                    <div class="row gx-3 align-items-center">
                        <div class="col-auto">
                            <div class="avatar avatar-60 rounded bg-theme-1-subtle text-theme-1 theme-blue">
                                <i class="bi bi-people h4"></i>
                            </div>
                        </div>
                        <div class="col">
                            <p class="text-secondary small mb-1">Engagements</p>
                            <h5 class="text-dark mb-0"><span class="increamentcount">1500</span> <small class="h6">125 Left</small></h5>
                            <p class="small">
                                125 <span class="text-green"><i class="bi bi-arrow-up fs-10"></i>1.85%</span>
                            </p>
                        </div>
                    </div>
                </div>
                <div class="col-12 col-md-6 col-lg-3 mb-3 mb-lg-4">
                    <div class="row gx-3 align-items-center">
                        <div class="col-auto">
                            <div class="avatar avatar-60 rounded bg-theme-1-subtle text-theme-1 theme-yellow">
                                <i class="bi bi-star-fill h4"></i>
                            </div>
                        </div>
                        <div class="col">
                            <p class="text-secondary small mb-1">Average Ratings</p>
                            <h5 class="text-dark mb-0">
                                <span class="">4.5 <i class="bi bi-star h6 vm text-yellow"></i></span> <small class="h6">2586 Users</small>
                            </h5>
                            <p class="small">
                                61 <span class="text-red"><i class="bi bi-arrow-down fs-10"></i>-4.50%</span>
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div class="row gx-3 gx-lg-4">
                <!-- course earning summary-->
                <div class="col-12 col-md-6 col-lg-3">
                    <div class="card adminuiux-card mb-3 mb-lg-4">
                        <div class="card-header">
                            <div class="row gx-3 align-items-center">
                                <div class="col-auto">
                                    <div class="avatar avatar-40 rounded bg-theme-1-subtle text-theme-1">
                                        <i class="bi bi-lightning h5"></i>
                                    </div>
                                </div>
                                <div class="col">
                                    <h6 class="mb-0">Trending</h6>
                                    <p class="small text-secondary">People Choice</p>
                                </div>
                            </div>
                        </div>
                        <figure class="coverimg w-100 height-180 mb-0">
                            <img src="assets/img/modern-ai-image/user-4.jpg" class="w-100" alt="" />
                        </figure>
                        <div class="card-body">
                            <h6 class="text-truncated mb-1">Data communication and signal strength</h6>
                            <p class="small text-secondary mb-3 mb-lg-4">Network to Internet making Intranet</p>
                            <div class="row gx-3 align-items-center">
                                <div class="col-auto">
                                    <app-circle-progress-blue class="avatar avatar-60 rounded-circle"></app-circle-progress-blue>
                                </div>
                                <div class="col">
                                    <h5 class="mb-0">1350 <small class="h6">USD</small></h5>
                                    <p class="small">
                                        36.00 <span class="text-green"><i class="bi bi-arrow-up fs-10"></i>3.15%</span>
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-12 col-md-6 col-lg-3">
                    <div class="card adminuiux-card mb-3 mb-lg-4">
                        <div class="card-header">
                            <div class="row gx-3 align-items-center">
                                <div class="col-auto">
                                    <div class="avatar avatar-40 rounded bg-theme-1-subtle text-theme-1">
                                        <i class="bi bi-heart h5"></i>
                                    </div>
                                </div>
                                <div class="col">
                                    <h6 class="mb-0">Favorite Course</h6>
                                    <p class="small text-secondary">Big hit in wishlist</p>
                                </div>
                            </div>
                        </div>
                        <figure class="coverimg w-100 height-180 mb-0">
                            <img src="assets/img/modern-ai-image/team-sq-1.jpg" class="w-100" alt="" />
                        </figure>
                        <div class="card-body">
                            <h6 class="text-truncated mb-1">Easily making money via blockchain networking</h6>
                            <p class="small text-secondary mb-3 mb-lg-4">All you need to work about blockchain</p>
                            <div class="row gx-3 align-items-center">
                                <div class="col-auto">
                                    <app-circle-progress-green class="avatar avatar-60 rounded-circle"></app-circle-progress-green>
                                </div>
                                <div class="col">
                                    <h5 class="mb-0">2356800 <small class="h6">USD</small></h5>
                                    <p class="small">
                                        126.00 <span class="text-green"><i class="bi bi-arrow-up fs-10"></i>3.15%</span>
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-12 col-md-6 col-lg-3">
                    <div class="card adminuiux-card mb-3 mb-lg-4">
                        <div class="card-header">
                            <div class="row gx-3 align-items-center">
                                <div class="col-auto">
                                    <div class="avatar avatar-40 rounded bg-theme-1-subtle text-theme-1">
                                        <i class="bi bi-coin h5"></i>
                                    </div>
                                </div>
                                <div class="col">
                                    <h6 class="mb-0">Old but gold</h6>
                                    <p class="small text-secondary">Classic course</p>
                                </div>
                            </div>
                        </div>
                        <figure class="coverimg w-100 height-180 mb-0">
                            <img src="assets/img/modern-ai-image/team-sq-2.jpg" class="w-100" alt="" />
                        </figure>
                        <div class="card-body">
                            <h6 class="text-truncated mb-1">Home furnishing & appliance Management</h6>
                            <p class="small text-secondary mb-3 mb-lg-4">Design and Adjust space around</p>
                            <div class="row gx-3 align-items-center">
                                <div class="col-auto">
                                    <app-circle-progress-yellow class="avatar avatar-60 rounded-circle"></app-circle-progress-yellow>
                                </div>
                                <div class="col">
                                    <h5 class="mb-0">56980 <small class="h6">USD</small></h5>
                                    <p class="small">
                                        141.00 <span class="text-green"><i class="bi bi-arrow-up fs-10"></i>4.13%</span>
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-12 col-md-6 col-lg-3">
                    <div class="card adminuiux-card mb-3 mb-lg-4">
                        <div class="card-header">
                            <div class="row gx-3 align-items-center">
                                <div class="col-auto">
                                    <div class="avatar avatar-40 rounded bg-theme-1-subtle text-theme-1">
                                        <i class="bi bi-currency-bitcoin h5"></i>
                                    </div>
                                </div>
                                <div class="col">
                                    <h6 class="mb-0">Trending in Tech</h6>
                                    <p class="small text-secondary">New technology course</p>
                                </div>
                            </div>
                        </div>
                        <figure class="coverimg w-100 height-180 mb-0">
                            <img src="assets/img/modern-ai-image/user-8.jpg" class="w-100" alt="" />
                        </figure>
                        <div class="card-body">
                            <h6 class="text-truncated mb-1">Be a good and create good Presentations</h6>
                            <p class="small text-secondary mb-3 mb-lg-4">How to convince viewer</p>
                            <div class="row gx-3 align-items-center">
                                <div class="col-auto">
                                    <app-circle-progress-red class="avatar avatar-60 rounded-circle"></app-circle-progress-red>
                                </div>
                                <div class="col">
                                    <h5 class="mb-0">195600 <small class="h6">USD</small></h5>
                                    <p class="small">
                                        101.00 <span class="text-green"><i class="bi bi-arrow-up fs-10"></i>3.05%</span>
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="row gx-3 gx-lg-4">
                <div class="col-12 col-md-6 col-lg-3">
                    <div class="card adminuiux-card text-center mb-3 mb-lg-4">
                        <div class="card-body">
                            <div class="w-100 height-180 coverimg rounded"><img src="assets/img/adminux/bg-13.jpg" alt="" /></div>
                            <p class="mt--25 mb-3"><i class="bi bi-puzzle avatar avatar-60 h4 rounded-circle shadow bg-theme-1 text-white theme-orange"></i></p>
                            <h5>Best Teaching Environment</h5>
                            <p class="small text-secondary">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer cursus blandit dolor, nec rutrum urna facilisis vitae.</p>
                        </div>
                    </div>
                </div>
                <div class="col-12 col-md-6 col-lg-3">
                    <div class="card adminuiux-card text-center mb-3 mb-lg-4">
                        <div class="card-body">
                            <div class="w-100 height-180 coverimg rounded"><img src="assets/img/modern-ai-image/bus-3.jpg" alt="" /></div>
                            <p class="mt--25 mb-3"><i class="bi bi-people avatar avatar-60 h4 rounded-circle shadow bg-theme-1 text-white theme-purple"></i></p>
                            <h5>Parent Orientation Programs</h5>
                            <p class="small text-secondary">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer cursus blandit dolor, nec rutrum urna facilisis vitae.</p>
                        </div>
                    </div>
                </div>
                <div class="col-12 col-md-6 col-lg-3">
                    <div class="card adminuiux-card text-center mb-3 mb-lg-4">
                        <div class="card-body">
                            <div class="w-100 height-180 coverimg rounded"><img src="assets/img/modern-ai-image/pet-3.jpg" alt="" /></div>
                            <p class="mt--25 mb-3"><i class="bi bi-book avatar avatar-60 h4 rounded-circle shadow bg-theme-1 text-white theme-teal"></i></p>
                            <h5>Well Maintained Library</h5>
                            <p class="small text-secondary">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer cursus blandit dolor, nec rutrum urna facilisis vitae.</p>
                        </div>
                    </div>
                </div>
                <div class="col-12 col-md-6 col-lg-3">
                    <div class="card adminuiux-card text-center mb-3 mb-lg-4">
                        <div class="card-body">
                            <div class="w-100 height-180 coverimg rounded"><img src="assets/img/modern-ai-image/user-7.jpg" alt="" /></div>
                            <p class="mt--25 mb-3"><i class="bi bi-easel avatar avatar-60 h4 rounded-circle shadow bg-theme-1 text-white theme-yellow"></i></p>
                            <h5>World Class Presentation</h5>
                            <p class="small text-secondary">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer cursus blandit dolor, nec rutrum urna facilisis vitae.</p>
                        </div>
                    </div>
                </div>
            </div>

            <div class="row gx-3 gx-lg-4">
                <div class="col-12 col-md-12 col-lg-8 col-xl-9">
                    <div class="card adminuiux-card mb-3 mb-lg-4">
                        <div class="card-header">
                            <div class="row gx-3 align-items-center">
                                <div class="col-auto">
                                    <i class="bi bi-people h5 avatar avatar-40 bg-theme-1-subtle text-theme-1 rounded"></i>
                                </div>
                                <div class="col">
                                    <h6 class="mb-0">Students From</h6>
                                    <p class="text-secondary small">Users around the <b>Earth</b></p>
                                </div>
                            </div>
                        </div>
                        <div class="card-body pb-2">
                            <div class="row gx-3">
                                <div class="col-12 col-md-12 col-lg-8 mb-3 mb-lg-4">
                                    <div id="jsvectormap" class="w-100 height-300"></div>
                                </div>
                                <div class="col-12 col-md-12 col-lg-4 mb-3 mb-lg-4">
                                    <app-bar-blue-chartjs-100-hori class="height-300 d-block w-100"></app-bar-blue-chartjs-100-hori>
                                </div>
                            </div>
                        </div>
                        <div class="card-footer pb-0">
                            <div class="row gx-3">
                                <div class="col-6 col-md-3 col-lg-3 col-xl-2 mb-3">
                                    <p class="text-secondary small mb-1">Students</p>
                                    <h5>
                                        5.1k <small class="text-theme-1 theme-green"><i class=" bi bi-arrow-up vm"></i> 12%</small>
                                    </h5>
                                </div>
                                <div class="col-6 col-md-3 col-lg-3 col-xl-2 mb-3">
                                    <p class="text-secondary small mb-1">Online</p>
                                    <h5>
                                        6.8k <small class="text-theme-1 theme-green"><i class=" bi bi-arrow-up vm"></i> 2.1%</small>
                                    </h5>
                                </div>
                                <div class="col-6 col-md-3 col-lg-3 col-xl-2 mb-3">
                                    <p class="text-secondary small mb-1">Bounce Rate</p>
                                    <h5>
                                        3.18% <small class="text-theme-1 theme-red"><i class=" bi bi-arrow-up vm"></i> -4.2%</small>
                                    </h5>
                                </div>
                                <div class="col-6 col-md-3 col-lg-3 col-xl-2 mb-3">
                                    <p class="text-secondary small mb-1">Average Duration</p>
                                    <h5>
                                        1h 16s <small class="text-theme-1 theme-green"><i class=" bi bi-arrow-up vm"></i> 3.7%</small>
                                    </h5>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-12 col-md-12 col-lg-4 col-xl-3">
                    <div class="card adminuiux-card mb-3 mb-lg-4">
                        <div class="card-body">
                            <div class="row gx-3 align-items-center mb-3">
                                <div class="col">
                                    <h5 class="mb-0">256 <small>Joined</small></h5>
                                    <p class="small text-secondary">Open: Registration</p>
                                </div>
                                <div class="col-auto px-0 avatar-group">
                                    <a href="" class="btn btn-sm btn-theme px-3">Invite</a>
                                </div>
                            </div>
                            <h6 class="text-theme-1 mb-1">Machine Learning</h6>
                            <p class="small text-secondary">Learn how the machines are working to automate jobs.</p>
                            <h5 class="mb-0">56980 <small class="h6">USD</small></h5>
                            <p class="small">
                                <span class="text-secondary">Revenue planned</span> 141.00 <span class="text-green"><i class="bi bi-arrow-up fs-10"></i>4.13%</span>
                            </p>
                        </div>
                    </div>
                    <div class="card adminuiux-card mb-3 mb-lg-4">
                        <div class="card-body">
                            <div class="row gx-3 align-items-center mb-3">
                                <div class="col">
                                    <h5 class="mb-0">1542 <small>Joined</small></h5>
                                    <p class="small text-secondary">Open: Pre-Registration</p>
                                </div>
                                <div class="col-auto avatar-group">
                                    <figure class="avatar avatar-40 rounded-circle coverimg overlay-ms-15" data-bs-toggle="tooltip" data-bs-placement="top" title="Shelvey Doe">
                                        <img src="assets/img/modern-ai-image/user-2.jpg" alt="" class="w-100" />
                                    </figure>
                                    <figure class="avatar avatar-40 rounded-circle coverimg overlay-ms-15" data-bs-toggle="tooltip" data-bs-placement="top" title="Maria Smith">
                                        <img src="assets/img/modern-ai-image/user-3.jpg" alt="" class="w-100" />
                                    </figure>
                                    <figure class="avatar avatar-40 rounded-circle coverimg overlay-ms-15" data-bs-toggle="tooltip" data-bs-placement="top" title="Steve Branden">
                                        <img src="assets/img/modern-ai-image/user-4.jpg" alt="" class="w-100" />
                                    </figure>
                                </div>
                            </div>

                            <h6 class="mb-1">Easily making money via blockchain networking and people</h6>
                            <p class="small text-secondary mb-3">User interaction and animation on events. Easily making money.</p>

                            <h5 class="mb-0">56980 <small class="h6">USD</small></h5>
                            <p class="small">
                                <span class="text-secondary">Revenue planned</span> 141.00 <span class="text-green"><i class="bi bi-arrow-up fs-10"></i>4.13%</span>
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div class="row gx-3 gx-lg-4 mb-3 mb-lg-4">
                <div class="col text-center py-3">
                    <h4>Give a clear vision for <span class="text-gradient">Bright and lovely future</span> of next generation</h4>
                    <p class="text-secondary">You have to work hard to prepare good course content with trending and demanded technology innovations.</p>
                </div>
            </div>

            <div class="row gx-3 gx-lg-4">
                <!-- Sent money -->
                <div class="col-12 col-md-12 col-lg-6 col-xxl-3">
                    <div class="card adminuiux-card mb-3 mb-lg-4">
                        <div class="card-header">
                            <div class="row gx-3 align-items-center">
                                <div class="col-auto">
                                    <i class="bi bi-arrow-up-right h5 avatar avatar-40 bg-theme-1-subtle text-theme-1 rounded"></i>
                                </div>
                                <div class="col">
                                    <h6 class="mb-0">Sent Money</h6>
                                    <p class="small text-secondary">Transfer to Contacts</p>
                                </div>
                            </div>
                        </div>
                        <div class="card-body">
                            <input class="form-control form-control-lg fs-2 fw-bold text-center mb-3" type="number" placeholder="0.00" />
                            <div class="row gx-3 align-items-center mb-2">
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
                                        <select class="form-select">
                                            <option>CA Bank</option>
                                            <option>Larson Bank</option>
                                            <option>Truelance Bank</option>
                                            <option selected>Cabilian Bank</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                            <p class="text-secondary small">Balance: 966800.00 USD</p>
                            <div class="input-group input-group-md rounded mb-3">
                                <span class="input-group-text text-theme-1"><i class="bi bi-person-lines-fill"></i></span>
                                <input class="form-control" type="search" placeholder="Send Money to..." />
                            </div>
                            <h6 class="mb-3">Sent Money to</h6>
                            <div class="row gx-3">
                                <div class="col-auto">
                                    <button type="button" class="btn btn-square btn-outline-theme" data-bs-toggle="tooltip" data-bs-placement="top" title="Bank Account">
                                        <i class="bi bi-bank h5"></i>
                                    </button>
                                </div>
                                <div class="col-auto">
                                    <button type="button" class="btn btn-square btn-outline-theme" data-bs-toggle="tooltip" data-bs-placement="top" title="Wallet">
                                        <i class="bi bi-wallet2 h5"></i>
                                    </button>
                                </div>
                                <div class="col-auto">
                                    <button type="button" class="btn btn-square btn-outline-theme" data-bs-toggle="tooltip" data-bs-placement="top" title="Crypto Address">
                                        <i class="bi bi-currency-bitcoin h5"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Doughnut Expense Category -->
                <div class="col-12 col-md-12 col-lg-6 col-xxl-3">
                    <div class="card adminuiux-card mb-3 mb-lg-4">
                        <div class="card-header">
                            <div class="row gx-3 align-items-center">
                                <div class="col-auto">
                                    <i class="bi bi-bar-chart h5 avatar avatar-40 bg-theme-1-subtle text-theme-1 theme-purple rounded"></i>
                                </div>
                                <div class="col">
                                    <h6 class="mb-0">Expense</h6>
                                    <p class="small text-secondary">Categories</p>
                                </div>
                            </div>
                        </div>
                        <div class="card-body">
                            <div class="height-180 width-180 position-relative mb-3 mb-lg-4 mx-auto z-index-0">
                                <app-doughnut-chartjs-180 class="z-index-1 position-relative"></app-doughnut-chartjs-180>
                                <div class="avatar avatar-140 position-absolute top-50 start-50 translate-middle rounded-circle shadow bg-white z-index-0">
                                    <div class="w-100 lh-20">
                                        <h4 class="mb-1">2,55.98K</h4>
                                        <p class="text-success small">18.71 (0.73%)</p>
                                    </div>
                                </div>
                            </div>
                            <div class="row mb-3">
                                <div class="col">
                                    <h6>Top Categories</h6>
                                </div>
                                <div class="col-auto">
                                    <p class="text-secondary small">Values in thousand</p>
                                </div>
                            </div>
                            <div class="row gx-3">
                                <div class="col-6 mb-3">
                                    <div class="row gx-3">
                                        <div class="col-auto">
                                            <div class="avatar avatar-40 rounded bg-theme-1-subtle text-theme-1 theme-yellow">
                                                <i class="bi bi-egg h5"></i>
                                            </div>
                                        </div>
                                        <div class="col">
                                            <h6 class="mb-0">40.00 <small class="fs-10">USD</small></h6>
                                            <p class="small text-secondary">Food</p>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-6 mb-3">
                                    <div class="row gx-3">
                                        <div class="col-auto">
                                            <div class="avatar avatar-40 rounded bg-theme-1-subtle text-theme-1 theme-green">
                                                <i class="bi bi-truck h5"></i>
                                            </div>
                                        </div>
                                        <div class="col">
                                            <h6 class="mb-0">10.15 <small class="fs-10">USD</small></h6>
                                            <p class="small text-secondary">Transport</p>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-6 mb-0">
                                    <div class="row gx-3">
                                        <div class="col-auto">
                                            <div class="avatar avatar-40 rounded bg-theme-1-subtle text-theme-1 theme-red">
                                                <i class="bi bi-people h5"></i>
                                            </div>
                                        </div>
                                        <div class="col">
                                            <h6 class="mb-0">15.05 <small class="fs-10">USD</small></h6>
                                            <p class="small text-secondary">Children</p>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-6 mb-0">
                                    <div class="row gx-3">
                                        <div class="col-auto">
                                            <div class="avatar avatar-40 rounded  bg-theme-1-subtle text-theme-1">
                                                <i class="bi bi-house h5"></i>
                                            </div>
                                        </div>
                                        <div class="col">
                                            <h6 class="mb-0">25.35 <small class="fs-10">USD</small></h6>
                                            <p class="small text-secondary">Home</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
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
                            </div>
                        </div>
                        <div class="card-body">
                            <app-bar-blue-chartjs-100 class="w-100 height-110 d-block mb-3"></app-bar-blue-chartjs-100>
                            <div class="row gx-3">
                                <div class="col">
                                    <h6>Details</h6>
                                </div>
                                <div class="col-auto"></div>
                            </div>
                        </div>
                        <div class="card-body p-0">
                            <ul class="list-group list-group-flush border-0 bg-none mb-2">
                                <li class=" list-group-item">
                                    <div class="row gx-3 gx-lg-4 align-items-center">
                                        <div class="col-auto">
                                            <p class="mb-0">Funds</p>
                                            <p class="text-secondary small">SIP-16, 25-Fixed</p>
                                        </div>
                                        <div class="col ps-0 text-end">
                                            <h6 class=" mb-0">51,070.77 <small>USD</small></h6>
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
                                            <h6 class="mb-0">4048.24 <small>USD</small></h6>
                                            <p class="small text-secondary">
                                                1.20 <span class="text-theme-1 theme-green"><i class="bi bi-arrow-up fs-12"></i>0.04%</span>
                                            </p>
                                        </div>
                                    </div>
                                </li>
                                <li class="list-group-item">
                                    <div class="row gx-3 gx-lg-4 align-items-center">
                                        <div class="col-auto">
                                            <p class="mb-0">Shares</p>
                                            <p class="text-secondary small">18 Company</p>
                                        </div>
                                        <div class="col ps-0 text-end">
                                            <h6 class="mb-0">3750.00 <small>USD</small></h6>
                                            <p class="small text-secondary">
                                                74.00<span class="text-theme-1 theme-red"><i class="bi bi-arrow-up fs-12"></i>-2.09%</span>
                                            </p>
                                        </div>
                                    </div>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>

                <!-- Expense by card -->
                <div class="col-12 col-md-12 col-lg-6 col-xxl-3">
                    <!-- bank card -->
                    <div class="card adminuiux-card mb-3 mb-lg-4">
                        <div class="card-header">
                            <div class="row gx-3 align-items-center">
                                <div class="col-auto">
                                    <i class="bi bi-cash h5 avatar avatar-40 bg-theme-1-subtle text-theme-1 theme-green  rounded"></i>
                                </div>
                                <div class="col">
                                    <h6 class="mb-0">Card Expenses</h6>
                                    <p class="small text-secondary">Recently Used</p>
                                </div>
                                <div class="col-auto"></div>
                            </div>
                        </div>
                        <div class="card-body pt-1 overflow-hidden">
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
                                            <h6>
                                                1500.00 <small class="text-success">18.0% <i class="bi bi-arrow-up"></i></small>
                                            </h6>
                                        </div>
                                        <div class="col-auto text-end">
                                            <p class="opacity-50 small mb-1">Limit Remain</p>
                                            <h6>13500.00</h6>
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
                                            <h6>
                                                3650.00 <small class="text-danger">11.0% <i class="bi bi-arrow-down"></i></small>
                                            </h6>
                                        </div>
                                        <div class="col-auto text-end">
                                            <p class="text-secondary small mb-1">Limit Remain</p>
                                            <h6>35500.00</h6>
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
                                            <h6>
                                                1500.00 <small class="text-success">18.0 <i class="bi bi-arrow-up"></i></small>
                                            </h6>
                                        </div>
                                        <div class="col-auto text-end">
                                            <p class="text-secondary small mb-1">Limit Remain</p>
                                            <h6>13500.00</h6>
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
                                    <div class="avatar avatar-60 position-relative">
                                        <app-circle-progress-blue-blank class="avatar avatar-60 rounded-circle"></app-circle-progress-blue-blank>
                                        <div class="avatar avatar-40 h5 position-absolute start-50 top-50 translate-middle bg-theme-1-subtle text-theme-1 theme-blue rounded-circle">
                                            <i class="bi bi-receipt"></i>
                                        </div>
                                    </div>
                                </div>
                                <div class="col">
                                    <p class="text-secondary small mb-1">Total Bills</p>
                                    <h5>25486.00 <small>USD</small></h5>
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
                                    <div class="avatar avatar-60 position-relative">
                                        <app-circle-progress-yellow-blank class="avatar avatar-60 rounded-circle"></app-circle-progress-yellow-blank>
                                        <div class="avatar avatar-40 h5 position-absolute start-50 top-50 translate-middle bg-theme-1-subtle text-theme-1 theme-yellow  rounded-circle">
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
                <div class="col-12 col-md-6 col-lg-6 col-xl-3 col-xxl-3">
                    <div class="card adminuiux-card mb-3 mb-lg-4">
                        <div class="card-body">
                            <div class="row gx-3 align-items-center">
                                <div class="col-auto">
                                    <div class="avatar avatar-60 position-relative">
                                        <app-circle-progress-red-blank class="avatar avatar-60 rounded-circle"></app-circle-progress-red-blank>
                                        <div class="avatar avatar-40 h5 position-absolute start-50 top-50 translate-middle bg-theme-1-subtle text-theme-1 theme-red rounded-circle">
                                            <i class="bi bi-receipt-cutoff"></i>
                                        </div>
                                    </div>
                                </div>
                                <div class="col">
                                    <p class="text-secondary small mb-1">Unpaid Bills</p>
                                    <h5>1525<small>k</small></h5>
                                </div>
                                <div class="col-auto avatar-group">
                                    <figure class="avatar avatar-40 rounded-circle coverimg overlay-ms-15" data-bs-toggle="tooltip" data-bs-placement="top" title="Just Demo">
                                        <img src="assets/img/modern-ai-image/company6.png" alt="" />
                                    </figure>
                                    <figure class="avatar avatar-40 rounded-circle coverimg overlay-ms-15" data-bs-toggle="tooltip" data-bs-placement="top" title="Preview Purpose">
                                        <img src="assets/img/modern-ai-image/company9.jpg" alt="" />
                                    </figure>
                                    <figure class="avatar avatar-40 rounded-circle coverimg overlay-ms-15" data-bs-toggle="tooltip" data-bs-placement="top" title="to look real">
                                        <img src="assets/img/modern-ai-image/company8.jpg" alt="" />
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
                                    <div class="avatar avatar-60 position-relative">
                                        <app-circle-progress-white-blank class="avatar avatar-60 rounded-circle"></app-circle-progress-white-blank>
                                        <div class="avatar avatar-40 h5 position-absolute start-50 top-50 translate-middle bg-white-opacity text-white rounded-circle">
                                            <i class="bi bi-envelope-check"></i>
                                        </div>
                                    </div>
                                </div>
                                <div class="col">
                                    <p class="opacity-75 small mb-1">Sent Money</p>
                                    <h5>1545K</h5>
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
                        </div>
                    </div>
                </div>
            </div>

            <div class="row gx-3">
                <!-- Transactions -->
                <div class="col-12 col-md-12 position-relative column-set">
                    <div class="card adminuiux-card mb-3 mb-lg-4">
                        <div class="card-header">
                            <div class="row gx-3">
                                <div class="col-auto mb-3 mb-md-0">
                                    <i class="bi bi-shop h5 avatar avatar-40 bg-theme-1-subtle text-theme-1 rounded"></i>
                                </div>
                                <div class="col-auto align-self-center mb-3 mb-md-0">
                                    <h6 class="mb-0">Earning payments</h6>
                                    <p class="text-secondary small">All Transactions</p>
                                </div>
                                <div class="col-12 col-md-auto ms-auto">
                                    <div class="input-group w-100">
                                        <span class="input-group-text text-theme-1"><i class="bi bi-search"></i></span>
                                        <input type="text" class="form-control" placeholder="Search..." />
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="card-body py-0">
                            <table class="table" id="dataTable">
                                <thead>
                                    <tr class="text-muted">
                                        <th class="width-10"></th>
                                        <th class="all">User</th>
                                        <th class="tablet desktop">Course Name</th>
                                        <th class="desktop">Amount</th>
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
                                                    <figure class="avatar avatar-40 mb-0 coverimg rounded-circle">
                                                        <img src="assets/img/modern-ai-image/user-2.jpg" alt="" />
                                                    </figure>
                                                </div>
                                                <div class="col">
                                                    <p class="mb-0">Janita Johnson</p>
                                                    <p class="text-secondary small">United Kingdom</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <p class="mb-0">Laravel 53</p>
                                            <p class="text-secondary small">LaraWell University</p>
                                        </td>
                                        <td>
                                            <p class="mb-0 text-green">0.000015</p>
                                            <p class="text-secondary small">BTC</p>
                                        </td>
                                        <td>
                                            <p class="mb-0">20-1-2022</p>
                                            <p class="text-secondary small">9:00 am</p>
                                        </td>
                                        <td>Delivered</td>
                                        <td>John McGra</td>
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
                                                    <figure class="avatar avatar-40 mb-0 coverimg rounded-circle">
                                                        <img src="assets/img/modern-ai-image/user-2.jpg" alt="" />
                                                    </figure>
                                                </div>
                                                <div class="col">
                                                    <p class="mb-0">Jia Sen</p>
                                                    <p class="text-secondary small">Support</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <p class="mb-0">Medical Science</p>
                                            <p class="text-secondary small">Yetti University</p>
                                        </td>
                                        <td>
                                            <p class="mb-0 text-green">12</p>
                                            <p class="text-secondary small">XMR</p>
                                        </td>
                                        <td>
                                            <p class="mb-0">19-1-2022</p>
                                            <p class="text-secondary small">6:34 pm</p>
                                        </td>
                                        <td>Sent</td>
                                        <td>Self</td>
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
                                                    <figure class="avatar avatar-40 mb-0 coverimg rounded-circle">
                                                        <img src="assets/img/modern-ai-image/user-3.jpg" alt="" />
                                                    </figure>
                                                </div>
                                                <div class="col">
                                                    <p class="mb-0">Limba Scollatia</p>
                                                    <p class="text-secondary small">United States</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <p class="mb-0">Space Life Techsolution</p>
                                            <p class="text-secondary small">SpaxCE University</p>
                                        </td>
                                        <td>
                                            <p class="mb-0 text-green">216.00</p>
                                            <p class="text-secondary small">DOGE</p>
                                        </td>
                                        <td>
                                            <p class="mb-0">19-1-2022</p>
                                            <p class="text-secondary small">6:11 pm</p>
                                        </td>
                                        <td>Delivered</td>
                                        <td>John McGra</td>
                                        <td>2356, Street-5, New York 4586, US</td>
                                        <td>
                                            <p class="mb-1">Lat: 5.678167, Long: 12.078613</p>
                                            <p class="text-secondary small">This can be a map also</p>
                                        </td>
                                        <td>
                                            <span class="badge badge-sm bg-blue">Waiting</span>
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
                                                    <figure class="avatar avatar-40 mb-0 coverimg rounded-circle">
                                                        <img src="assets/img/modern-ai-image/user-4.jpg" alt="" />
                                                    </figure>
                                                </div>
                                                <div class="col">
                                                    <p class="mb-0">Johnson Will</p>
                                                    <p class="text-secondary small">Australia</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <p class="mb-0">Jivakala Science</p>
                                            <p class="text-secondary small">Yetti University</p>
                                        </td>
                                        <td>
                                            <p class="mb-0 text-green">0.25</p>
                                            <p class="text-secondary small">ETH</p>
                                        </td>
                                        <td>
                                            <p class="mb-0">19-1-2022</p>
                                            <p class="text-secondary small">4:05 pm</p>
                                        </td>
                                        <td>Received</td>
                                        <td>Self</td>
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
                                                    <figure class="avatar avatar-40 mb-0 coverimg rounded-circle">
                                                        <img src="assets/img/modern-ai-image/user-4.jpg" alt="" />
                                                    </figure>
                                                </div>
                                                <div class="col">
                                                    <p class="mb-0">Jack Manjrekar</p>
                                                    <p class="text-secondary small">India</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <p class="mb-0">Clarity of life</p>
                                            <p class="text-secondary small">Sunmoon University</p>
                                        </td>
                                        <td>
                                            <p class="mb-0 text-green">180.00</p>
                                            <p class="text-secondary small">USDT</p>
                                        </td>
                                        <td>
                                            <p class="mb-0">19-1-2022</p>
                                            <p class="text-secondary small">11:35 am</p>
                                        </td>
                                        <td>Delivered</td>
                                        <td>John McGra</td>
                                        <td>2356, Street-5, New York 4586, US</td>
                                        <td>
                                            <p class="mb-1">Lat: 5.678167, Long: 12.078613</p>
                                            <p class="text-secondary small">This can be a map also</p>
                                        </td>
                                        <td>
                                            <span class="badge badge-sm bg-red">Unpaid</span>
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
                                                    <figure class="avatar avatar-40 mb-0 coverimg rounded-circle">
                                                        <img src="assets/img/modern-ai-image/user-2.jpg" alt="" />
                                                    </figure>
                                                </div>
                                                <div class="col">
                                                    <p class="mb-0">Sunita Vaidya</p>
                                                    <p class="text-secondary small">Brazil</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <p class="mb-0">Twin Techsolution</p>
                                            <p class="text-secondary small">Pancham University</p>
                                        </td>
                                        <td>
                                            <p class="mb-0 text-green">12.00</p>
                                            <p class="text-secondary small">USD</p>
                                        </td>
                                        <td>
                                            <p class="mb-0">19-1-2022</p>
                                            <p class="text-secondary small">9:00 am</p>
                                        </td>
                                        <td>Delivered</td>
                                        <td>John McGra</td>
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
                                                    <figure class="avatar avatar-40 mb-0 coverimg rounded-circle">
                                                        <img src="assets/img/modern-ai-image/user-1.jpg" alt="" />
                                                    </figure>
                                                </div>
                                                <div class="col">
                                                    <p class="mb-0">Max John</p>
                                                    <p class="text-secondary small">Tesla City</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <p class="mb-0">HTML CSS JS</p>
                                            <p class="text-secondary small">Courserra Cart</p>
                                        </td>
                                        <td>
                                            <p class="mb-0 text-green">251.00</p>
                                            <p class="text-secondary small">USD</p>
                                        </td>
                                        <td>
                                            <p class="mb-0">18-1-2022</p>
                                            <p class="text-secondary small">9:00 am</p>
                                        </td>
                                        <td>Delivered</td>
                                        <td>John McGra</td>
                                        <td>2356, Street-5, New York 4586, US</td>
                                        <td>
                                            <p class="mb-1">Lat: 5.678167, Long: 12.078613</p>
                                            <p class="text-secondary small">This can be a map also</p>
                                        </td>
                                        <td>
                                            <span class="badge badge-sm bg-blue">Waiting</span>
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
                                                    <figure class="avatar avatar-40 mb-0 coverimg rounded-circle">
                                                        <img src="assets/img/modern-ai-image/user-2.jpg" alt="" />
                                                    </figure>
                                                </div>
                                                <div class="col">
                                                    <p class="mb-0">Celvina Prisma</p>
                                                    <p class="text-secondary small">Meal</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <p class="mb-0">Medical Science</p>
                                            <p class="text-secondary small">Yetti University</p>
                                        </td>
                                        <td>
                                            <p class="mb-0 text-green">12.00</p>
                                            <p class="text-secondary small">USD</p>
                                        </td>
                                        <td>
                                            <p class="mb-0">18-1-2022</p>
                                            <p class="text-secondary small">9:00 am</p>
                                        </td>
                                        <td>Delivered</td>
                                        <td>John McGra</td>
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
                                                    <figure class="avatar avatar-40 mb-0 coverimg rounded-circle">
                                                        <img src="assets/img/modern-ai-image/user-3.jpg" alt="" />
                                                    </figure>
                                                </div>
                                                <div class="col">
                                                    <p class="mb-0">Jarden Smith</p>
                                                    <p class="text-secondary small">Round Trip</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <p class="mb-0">Tripod Future</p>
                                            <p class="text-secondary small">Attas University</p>
                                        </td>
                                        <td>
                                            <p class="mb-0 text-green">251.00</p>
                                            <p class="text-secondary small">USD</p>
                                        </td>
                                        <td>
                                            <p class="mb-0">18-1-2022</p>
                                            <p class="text-secondary small">9:00 am</p>
                                        </td>
                                        <td>Delivered</td>
                                        <td>John McGra</td>
                                        <td>2356, Street-5, New York 4586, US</td>
                                        <td>
                                            <p class="mb-1">Lat: 5.678167, Long: 12.078613</p>
                                            <p class="text-secondary small">This can be a map also</p>
                                        </td>
                                        <td>
                                            <span class="badge badge-sm bg-blue">Waiting</span>
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
                                                    <figure class="avatar avatar-40 mb-0 coverimg rounded-circle">
                                                        <img src="assets/img/modern-ai-image/user-2.jpg" alt="" />
                                                    </figure>
                                                </div>
                                                <div class="col">
                                                    <p class="mb-0">Simpson Devid</p>
                                                    <p class="text-secondary small">Indonesia</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <p class="mb-0">AI Code development</p>
                                            <p class="text-secondary small">Googles University</p>
                                        </td>
                                        <td>
                                            <p class="mb-0 text-green">0.000015</p>
                                            <p class="text-secondary small">BTC</p>
                                        </td>
                                        <td>
                                            <p class="mb-0">18-1-2022</p>
                                            <p class="text-secondary small">9:00 am</p>
                                        </td>
                                        <td>Delivered</td>
                                        <td>John McGra</td>
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
                                                    <figure class="avatar avatar-40 mb-0 coverimg rounded-circle">
                                                        <img src="assets/img/modern-ai-image/user-2.jpg" alt="" />
                                                    </figure>
                                                </div>
                                                <div class="col">
                                                    <p class="mb-0">Brett Layna</p>
                                                    <p class="text-secondary small">England</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <p class="mb-0">Alexa Remote work</p>
                                            <p class="text-secondary small">Parthiv Shah</p>
                                        </td>
                                        <td>
                                            <p class="mb-0 text-green">6.00</p>
                                            <p class="text-secondary small">USD</p>
                                        </td>
                                        <td>
                                            <p class="mb-0">18-1-2022</p>
                                            <p class="text-secondary small">9:00 am</p>
                                        </td>
                                        <td>Delivered</td>
                                        <td>John McGra</td>
                                        <td>2356, Street-5, New York 4586, US</td>
                                        <td>
                                            <p class="mb-1">Lat: 5.678167, Long: 12.078613</p>
                                            <p class="text-secondary small">This can be a map also</p>
                                        </td>
                                        <td>
                                            <span class="badge badge-sm bg-blue">Waiting</span>
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
                                                    <figure class="avatar avatar-40 mb-0 coverimg rounded-circle">
                                                        <img src="assets/img/modern-ai-image/user-4.jpg" alt="" />
                                                    </figure>
                                                </div>
                                                <div class="col">
                                                    <p class="mb-0">Limba Simba</p>
                                                    <p class="text-secondary small">Russia</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <p class="mb-0">Computer basics</p>
                                            <p class="text-secondary small">Jummla University</p>
                                        </td>
                                        <td>
                                            <p class="mb-0 text-green">180.00</p>
                                            <p class="text-secondary small">USD</p>
                                        </td>
                                        <td>
                                            <p class="mb-0">18-1-2022</p>
                                            <p class="text-secondary small">9:00 am</p>
                                        </td>
                                        <td>Delivered</td>
                                        <td>John McGra</td>
                                        <td>2356, Street-5, New York 4586, US</td>
                                        <td>
                                            <p class="mb-1">Lat: 5.678167, Long: 12.078613</p>
                                            <p class="text-secondary small">This can be a map also</p>
                                        </td>
                                        <td>
                                            <span class="badge badge-sm bg-red">Unpaid</span>
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
export class LearningInstituationsComponent {
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
