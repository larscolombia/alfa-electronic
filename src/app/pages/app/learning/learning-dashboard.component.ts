import { Component, OnInit, AfterViewInit, AfterContentChecked, OnDestroy, ViewChild, ElementRef, CUSTOM_ELEMENTS_SCHEMA } from "@angular/core";
import { RouterLink } from "@angular/router";
import Choices, { ClassNames } from "choices.js";
import DataTable from "datatables.net-dt";
import "datatables.net-responsive-dt";

import { DaterangePickerRangesComponent } from "../../../components/input-fields/daterange-picker/daterange-picker-ranges.component";
import { SocialBannerChartComponent } from "../../../components/charts/social-banner-chart.component";
import { CircleProgressBlueBlankComponent } from "../../../components/charts/circle-progress-blue-blank.component";
import { CircleProgressBlueComponent } from "../../../components/charts/circle-progress-blue.component";
import { CircleProgressGreenComponent } from "../../../components/charts/circle-progress-green.component";
import { CircleProgressYellowBlankComponent } from "../../../components/charts/circle-progress-yellow-blank.component";
import { CircleProgressRedBlankComponent } from "../../../components/charts/circle-progress-red-blank.component";
import { CircleProgressWhiteBlankComponent } from "../../../components/charts/circle-progress-white-blank.component";
import { ArearedChartjs60Component } from "../../../components/charts/area-red-chartjs-60.component";
import { AreaBlueChartjs60Component } from "../../../components/charts/area-blue-chartjs-60.component";
import { AreaGreenChartjs60Component } from "../../../components/charts/area-green-chartjs-60.component";
import { AreaYellowChartjs60Component } from "../../../components/charts/area-yellow-chartjs-60.component";

@Component({
    selector: "app-learning-dashboard",
    standalone: true,
    imports: [RouterLink, DaterangePickerRangesComponent, SocialBannerChartComponent, CircleProgressBlueBlankComponent, CircleProgressBlueComponent, CircleProgressGreenComponent, CircleProgressYellowBlankComponent, CircleProgressRedBlankComponent, CircleProgressWhiteBlankComponent, ArearedChartjs60Component, AreaBlueChartjs60Component, AreaGreenChartjs60Component, AreaYellowChartjs60Component],
    template: `
        <!-- page title -->
        <div class="container-fluid py-3">
            <div class="row gx-3 gx-lg-4 align-items-center page-title">
                <div class="col col-sm mb-3 mb-sm-0 order-1">
                    <h5 class="mb-0">Learning Dashboard</h5>
                    <p class="text-secondary small">Checkout potential courses and institutes to grow more</p>
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
                    <li class="breadcrumb-item bi active" aria-current="page">Learning</li>
                </ol>
            </nav>
        </div>

        <!-- content -->
        <div class="container mt-3" id="main-content">
            <div class="row gx-3 gx-lg-4">
                <div class="col-12 col-md-6 col-xl-4 order-1 order-xl-1">
                    <div class="card adminuiux-card mb-3 mb-lg-4">
                        <div class="coverimg w-100 height-110 rounded">
                            <img src="assets/img/background-image/backgorund-image-8.jpg" class="w-100" alt="" />
                        </div>
                        <div class="card-body text-center pt-0">
                            <div class="mt--50 z-index-1 mb-3 text-center">
                                <div class="card shadow-sm avatar avatar-120 rounded-circle">
                                    <div class="card-body h-100 w-100 p-1">
                                        <figure class="h-100 w-100 rounded-circle coverimg mb-0">
                                            <img src="assets/img/modern-ai-image/user-4.jpg" alt="" />
                                        </figure>
                                    </div>
                                </div>
                            </div>
                            <h5 class="mb-1">AdminUIUX</h5>
                            <p class="text-secondary mb-4"><i class="bi bi-geo-alt"></i> New York, USA</p>

                            <div class="row gx-3">
                                <div class="col mnw-100 text-center">
                                    <i class="bi bi-trophy h4 avatar avatar-60 bg-theme-1-subtle text-theme-1 theme-orange text-orange rounded-circle mb-2"></i>
                                    <h5 class="mb-0">2586</h5>
                                    <p class="small text-secondary">Level 3</p>
                                </div>
                                <div class="col mnw-100 text-center">
                                    <i class="bi bi-award h4 avatar avatar-60 bg-theme-1-subtle text-theme-1 theme-green rounded-circle mb-2"></i>
                                    <h5 class="mb-0">1583</h5>
                                    <p class="small text-secondary">Your Rank</p>
                                </div>
                                <div class="col mnw-100 text-center">
                                    <i class="bi bi-clipboard-check h4 avatar avatar-60 bg-theme-1-subtle text-theme-1 theme-yellow  rounded-circle mb-2"></i>
                                    <h5 class="mb-0">1356</h5>
                                    <p class="small text-secondary">Tasks Done</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-12 col-lg-12 col-xl-4 order-3 order-xl-2">
                    <div class="row gx-3 gx-lg-4">
                        <div class="col-6">
                            <div class="card adminuiux-card bg-theme-r-gradient text-white text-center mb-3 mb-lg-4">
                                <div class="card-body">
                                    <i class="bi bi-book avatar avatar-60 bg-white-opacity text-white rounded-circle h4 mb-3"></i>
                                    <h4 class="mb-1">24</h4>
                                    <p class="opacity-75 small">Courses</p>
                                </div>
                            </div>
                        </div>
                        <div class="col-6">
                            <div class="card adminuiux-card bg-theme-r-gradient text-white text-center theme-yellow mb-3 mb-lg-4">
                                <div class="card-body bg-none py-3">
                                    <i class="bi bi-trophy avatar avatar-60 bg-white-opacity text-white rounded-circle h4 mb-3"></i>
                                    <h4 class="mb-1">15</h4>
                                    <p class="opacity-75 small">Certification</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="card adminuiux-card overflow-hidden mb-3 mb-lg-4">
                        <div class="card-body position-relative">
                            <div class="coverimg w-75 h-100 end-0 top-0 position-absolute cover-right-center-img">
                                <img src=" assets/img/adminux/offer-1.png" class="w-100" alt="" />
                            </div>
                            <div class="row align-items-center h-100">
                                <div class="col-9 col-xxl-8 py-2">
                                    <h4 class="text-theme-1 mb-1">Earn 20%</h4>
                                    <h5 class="mb-3">Make your wallet even bigger</h5>
                                    <p class="text-secondary">Share your referral code to your friends and earn flat 20% amount.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-12 col-md-6 col-xl-4 order-2 order-xl-3">
                    <div class="card adminuiux-card mb-3 mb-lg-4">
                        <div class="card-body">
                            <figure class="coverimg rounded w-100 height-180 mb-3">
                                <img src="assets/img/modern-ai-image/PET-2.jpg" class="w-100" alt="" />
                            </figure>
                            <h5 class="mb-1">Business Development Module</h5>
                            <p class="text-secondary mb-3">A-Z of business structure and startups</p>
                            <div class="row gx-2">
                                <div class="col-6">
                                    <p class="text-secondary"><i class="bi bi-book avatar avatar-20 me-1"></i> 30 Lessons</p>
                                </div>
                                <div class="col-6">
                                    <p class="text-secondary"><i class="bi bi-clock avatar avatar-20 me-1"></i> 24 hrs/week</p>
                                </div>
                            </div>
                            <div class="row gx-2">
                                <div class="col-6">
                                    <p class="text-secondary"><i class="bi bi-clipboard-check avatar avatar-20 me-1"></i> 30 Exams</p>
                                </div>
                                <div class="col-6">
                                    <p class="text-secondary"><i class="bi bi-journal-bookmark avatar avatar-20 me-1"></i> 2 Projects</p>
                                </div>
                            </div>
                        </div>
                        <div class="card-footer">
                            <div class="row gx-3 align-items-center">
                                <div class="col">
                                    <h6 class="text-theme">80% <span class="fw-normal text-secondary">Done</span></h6>
                                </div>
                                <div class="col-auto">
                                    <button type="button" class="btn btn-sm btn-link">Continue <i class="bi bi-play"></i></button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="row gx-3 gx-lg-4">
                <div class="col-12 col-md-6 col-xl-3">
                    <div class="card adminuiux-card mb-3 mb-lg-4">
                        <div class="card-body">
                            <div class="row gx-3 align-items-center mb-3">
                                <div class="col-auto">
                                    <app-circle-progress-blue class="avatar avatar-60 rounded-circle"></app-circle-progress-blue>
                                </div>
                                <div class="col">
                                    <h6 class="mb-0">IT Data Modal</h6>
                                    <p class="small">Prof. John Jackson</p>
                                </div>
                            </div>
                            <p class="text-secondary small mb-0">You have completed 2/9 chapters</p>
                            <p class="text-secondary small mb-0">You have passed 2/10 assignment</p>
                        </div>
                    </div>
                </div>
                <div class="col-12 col-md-6 col-xl-3">
                    <div class="card adminuiux-card mb-3 mb-lg-4">
                        <div class="card-body">
                            <div class="row gx-3 align-items-center mb-3">
                                <div class="col-auto">
                                    <app-circle-progress-green class="avatar avatar-60 rounded-circle"></app-circle-progress-green>
                                </div>
                                <div class="col">
                                    <h6 class="mb-0">Bio Management</h6>
                                    <p class="small">Prof. Jinjo Min</p>
                                </div>
                            </div>
                            <p class="text-secondary small mb-0">2/9 chapters completed</p>
                            <p class="text-secondary small mb-0">8 assignments left</p>
                        </div>
                    </div>
                </div>
                <div class="col-12 col-md-6 col-xl-3">
                    <div class="card adminuiux-card mb-3 mb-lg-4">
                        <div class="card-body">
                            <div class="row gx-3 align-items-center">
                                <div class="col-auto">
                                    <div class="avatar avatar-50 rounded bg-theme-1-subtle text-theme-1 h4 mb-3"><i class="bi bi-journal-check"></i></div>
                                </div>
                                <div class="col mb-3">
                                    <h6 class="mb-0">Assignment 3</h6>
                                    <p class="small">IT Data Modal</p>
                                </div>
                            </div>
                            <div class="row gx-3 align-items-center">
                                <div class="col">
                                    <p class="text-secondary small mb-0">30 MCQs 1 Project</p>
                                    <p class="text-secondary small">25 hours 15min</p>
                                </div>
                                <div class="col-auto">
                                    <button class="btn btn-link btn-sm">Start <i class="bi bi-play"></i></button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-12 col-md-6 col-xl-3">
                    <div class="card adminuiux-card mb-3 mb-lg-4">
                        <div class="card-body">
                            <div class="row gx-3 align-items-center">
                                <div class="col-auto">
                                    <div class="avatar avatar-50 coverimg rounded mb-3"><img src="assets/img/modern-ai-image/flamingo-2.jpg" alt="" /></div>
                                </div>
                                <div class="col mb-3">
                                    <h6 class="mb-0">Eco-Sensativity</h6>
                                    <p class="small">Jenelia</p>
                                </div>
                            </div>
                            <div class="row gx-3 align-items-center">
                                <div class="col">
                                    <p class="text-secondary small mb-0">9 chapters 25hr 15mi</p>
                                    <p class="text-secondary small">Professional Certificate</p>
                                </div>
                                <div class="col-auto">
                                    <button class="btn btn-link btn-sm">Buy <i class="bi bi-cart"></i></button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="row gx-3 gx-lg-4">
                <!-- track users and courses -->
                <div class="col-12 col-md-12 col-lg-12 col-xl-8 col-xxl-9">
                    <!-- add column-set class to parent when customize column width dropdown added -->
                    <div class="card adminuiux-card mb-3 mb-lg-4">
                        <div class="card-header">
                            <div class="row gx-3 align-items-center">
                                <div class="col-auto">
                                    <i class="bi bi-arrow-up-right h5 avatar avatar-40 bg-theme-1-subtle text-theme-1 rounded"></i>
                                </div>
                                <div class="col">
                                    <h6 class="mb-0">Courses Activity</h6>
                                    <p class="small text-secondary">Total Joined this month 5215</p>
                                </div>
                            </div>
                        </div>
                        <div class="card-body ">
                            <app-social-banner-chart class="height-230 d-block"></app-social-banner-chart>
                        </div>
                        <div class="card-footer pb-0">
                            <div class="row gx-3">
                                <div class="col-6 col-md-4 col-lg-4 col-xl-3 mb-3">
                                    <div class="row gx-3 align-items-center">
                                        <div class="col-auto">
                                            <div class="avatar avatar-50 rounded bg-theme-1-subtle text-theme-1 theme-red">
                                                <i class="bi bi-cast h5"></i>
                                            </div>
                                        </div>
                                        <div class="col">
                                            <p class="text-secondary small mb-1">Course Material</p>
                                            <h5 class="text-dark mb-0">1652 <small class="h6">videos</small></h5>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-6 col-md-4 col-lg-4 col-xl-3 mb-3">
                                    <div class="row gx-3 align-items-center">
                                        <div class="col-auto">
                                            <div class="avatar avatar-50 rounded bg-theme-1-subtle text-theme-1 theme-blue">
                                                <i class="bi bi-people h5"></i>
                                            </div>
                                        </div>
                                        <div class="col">
                                            <p class="text-secondary small mb-1">Students Joined</p>
                                            <h5 class="text-dark mb-0">1251 <small class="h6 text-secondary">125 referral</small></h5>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-12 col-md-4 col-lg-4 col-xl-3 ms-auto text-end mb-3">
                                    <div class="row gx-2 align-items-center">
                                        <div class="col">
                                            <p class="text-secondary small mb-1">Involved</p>
                                            <h5>1024 <small>students</small></h5>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- useful support -->
                <div class="col-12 col-md-12 col-lg-12 col-xl-4 col-xxl-3">
                    <div class="row gx-3 gx-lg-4">
                        <div class="col-12 col-md-6 col-lg-6 col-xl-12 mb-3 mb-lg-4">
                            <!-- consultations -->
                            <div class="card adminuiux-card bg-l-gradient-light theme-red h-100">
                                <div class="card-body">
                                    <div class="row gx-3 align-items-center mb-3">
                                        <div class="col-auto">
                                            <i class="bi bi-life-preserver h5 avatar avatar-40 bg-theme-1-subtle text-theme-1 rounded"></i>
                                        </div>
                                        <div class="col">
                                            <h6 class="mb-0">Get Mentorship</h6>
                                            <p class="small text-secondary">Guide better</p>
                                        </div>
                                    </div>

                                    <p class="small">Free & flexibility of mentorship allows to understand better needs and direction</p>
                                    <a href="" class="btn btn-sm btn-link">Try now!</a>
                                </div>
                            </div>
                        </div>
                        <div class="col-12 col-md-6 col-lg-6 col-xl-12 mb-3 mb-lg-4">
                            <!-- Targets -->
                            <div class="card adminuiux-card bg-l-gradient-light theme-yellow">
                                <div class="card-body">
                                    <div class="row gx-3 align-items-center mb-3">
                                        <div class="col-auto">
                                            <i class="bi bi-bullseye h5 avatar avatar-40 bg-theme-1-subtle text-theme-1 rounded"></i>
                                        </div>
                                        <div class="col">
                                            <h6 class="mb-0">Life's Goal</h6>
                                            <p class="small text-secondary">Target should be visible</p>
                                        </div>
                                    </div>
                                    <h5 class="text-theme mb-1">Get Mentorship</h5>
                                    <p class="text-secondary small">Free & flexibility of mentorship allows to understand better needs and direction</p>
                                    <p><a href="" class="btn btn-sm btn-link">Set now</a></p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="row gx-3 gx-lg-4">
                <!-- joined people summary-->
                <div class="col-12 col-md-6 col-lg-6 col-xl-4 col-xxl-3">
                    <div class="card adminuiux-card mb-3 mb-lg-4">
                        <div class="card-header">
                            <div class="row gx-3 align-items-center">
                                <div class="col">
                                    <h4 class="mb-0">1542 <small class="h6">students</small></h4>
                                    <p class="small">
                                        11 <span class="text-green"><i class="bi bi-arrow-up fs-10"></i>3.15%</span>
                                    </p>
                                </div>
                                <div class="col-auto"></div>
                            </div>
                        </div>
                        <div class="card-body">
                            <figure class="coverimg rounded w-100 height-150 mb-3">
                                <img src="assets/img/modern-ai-image/pet-3.jpg" class="w-100" alt="" />
                            </figure>
                            <h5 class="mb-1">Data communication and signal strength</h5>
                            <p class="text-secondary text-truncated mb-3">Network to Internet making Intranet</p>
                            <div class="row gx-2">
                                <div class="col-6 mb-2">
                                    <p class="text-secondary"><i class="bi bi-book avatar avatar-24 me-1"></i> 30 Lessons</p>
                                </div>
                                <div class="col-6 mb-2">
                                    <p class="text-secondary"><i class="bi bi-clock avatar avatar-24 me-1"></i> 24 hrs/week</p>
                                </div>
                                <div class="col-6 mb-2">
                                    <p class="text-secondary"><i class="bi bi-clipboard-check avatar avatar-24 me-1"></i> 30 Exams</p>
                                </div>
                                <div class="col-6 mb-2">
                                    <p class="text-secondary"><i class="bi bi-journal-bookmark avatar avatar-24 me-1"></i> 2 Projects</p>
                                </div>
                            </div>
                        </div>
                        <div class="card-footer p-0">
                            <app-area-blue-chartjs-60 class="height-70 d-block mb-1"></app-area-blue-chartjs-60>
                        </div>
                    </div>
                </div>
                <div class="col-12 col-md-6 col-lg-6 col-xl-4 col-xxl-3">
                    <div class="card adminuiux-card mb-3 mb-lg-4">
                        <div class="card-header">
                            <div class="row gx-3 align-items-center">
                                <div class="col">
                                    <h4 class="mb-0">325 <small class="h6">Joined</small></h4>
                                    <p class="small">
                                        12 <span class="text-green"><i class="bi bi-arrow-up fs-10"></i>3.15%</span>
                                    </p>
                                </div>
                                <div class="col-auto"></div>
                            </div>
                        </div>
                        <div class="card-body">
                            <figure class="coverimg rounded w-100 height-150 mb-3">
                                <img src="assets/img/modern-ai-image/peacoke-3.jpg" class="w-100" alt="" />
                            </figure>
                            <h5 class="mb-1">Easily making money via blockchain</h5>
                            <p class="text-secondary text-truncated mb-3">All you need to work about blockchain</p>
                            <div class="row gx-2">
                                <div class="col-6 mb-2">
                                    <p class="text-secondary"><i class="bi bi-book avatar avatar-24 me-1"></i> 30 Lessons</p>
                                </div>
                                <div class="col-6 mb-2">
                                    <p class="text-secondary"><i class="bi bi-clock avatar avatar-24 me-1"></i> 24 hrs/week</p>
                                </div>
                                <div class="col-6 mb-2">
                                    <p class="text-secondary"><i class="bi bi-clipboard-check avatar avatar-24 me-1"></i> 30 Exams</p>
                                </div>
                                <div class="col-6 mb-2">
                                    <p class="text-secondary"><i class="bi bi-journal-bookmark avatar avatar-24 me-1"></i> 2 Projects</p>
                                </div>
                            </div>
                        </div>
                        <div class="card-footer p-0">
                            <app-area-green-chartjs-60 class="height-70 d-block mb-1"></app-area-green-chartjs-60>
                        </div>
                    </div>
                </div>
                <div class="col-12 col-md-6 col-lg-6 col-xl-4 col-xxl-3">
                    <div class="card adminuiux-card mb-3 mb-lg-4">
                        <div class="card-header">
                            <div class="row gx-3 align-items-center">
                                <div class="col">
                                    <h4 class="mb-0">2015 <small class="h6">In groups</small></h4>
                                    <p class="small">
                                        62 <span class="text-green"><i class="bi bi-arrow-up fs-10"></i>3.15%</span>
                                    </p>
                                </div>
                                <div class="col-auto"></div>
                            </div>
                        </div>
                        <div class="card-body">
                            <figure class="coverimg rounded w-100 height-150 mb-3">
                                <img src="assets/img/modern-ai-image/tree-2.jpg" class="w-100" alt="" />
                            </figure>
                            <h5 class="mb-1">Home furnishing & appliance Management</h5>
                            <p class="text-secondary text-truncated mb-3">Design and Adjust space around</p>
                            <div class="row gx-2">
                                <div class="col-6 mb-2">
                                    <p class="text-secondary"><i class="bi bi-book avatar avatar-24 me-1"></i> 30 Lessons</p>
                                </div>
                                <div class="col-6 mb-2">
                                    <p class="text-secondary"><i class="bi bi-clock avatar avatar-24 me-1"></i> 24 hrs/week</p>
                                </div>
                                <div class="col-6 mb-2">
                                    <p class="text-secondary"><i class="bi bi-clipboard-check avatar avatar-24 me-1"></i> 30 Exams</p>
                                </div>
                                <div class="col-6 mb-2">
                                    <p class="text-secondary"><i class="bi bi-journal-bookmark avatar avatar-24 me-1"></i> 2 Projects</p>
                                </div>
                            </div>
                        </div>
                        <div class="card-footer p-0">
                            <app-area-yellow-chartjs-60 class="height-70 d-block mb-1"></app-area-yellow-chartjs-60>
                        </div>
                    </div>
                </div>
                <div class="col-12 col-md-6 col-lg-6 col-xl-4 col-xxl-3 d-block d-xl-none d-xxl-block">
                    <div class="card adminuiux-card mb-3 mb-lg-4">
                        <div class="card-header">
                            <div class="row gx-3 align-items-center">
                                <div class="col">
                                    <h4 class="mb-0">178 <small class="h6">Joined</small></h4>
                                    <p class="small">
                                        18 <span class="text-green"><i class="bi bi-arrow-up fs-10"></i>3.15%</span>
                                    </p>
                                </div>
                                <div class="col-auto"></div>
                            </div>
                        </div>
                        <div class="card-body">
                            <figure class="coverimg rounded w-100 height-150 mb-3">
                                <img src="assets/img/modern-ai-image/user-7.jpg" class="w-100" alt="" />
                            </figure>
                            <h5 class="mb-1">Be a good and create good Presentations</h5>
                            <p class="text-secondary text-truncated mb-3">How to convince viewer</p>
                            <div class="row gx-2">
                                <div class="col-6 mb-2">
                                    <p class="text-secondary"><i class="bi bi-book avatar avatar-24 me-1"></i> 30 Lessons</p>
                                </div>
                                <div class="col-6 mb-2">
                                    <p class="text-secondary"><i class="bi bi-clock avatar avatar-24 me-1"></i> 24 hrs/week</p>
                                </div>
                                <div class="col-6 mb-2">
                                    <p class="text-secondary"><i class="bi bi-clipboard-check avatar avatar-24 me-1"></i> 30 Exams</p>
                                </div>
                                <div class="col-6 mb-2">
                                    <p class="text-secondary"><i class="bi bi-journal-bookmark avatar avatar-24 me-1"></i> 2 Projects</p>
                                </div>
                            </div>
                        </div>
                        <div class="card-footer p-0">
                            <app-area-red-chartjs-60 class="height-70 d-block mb-1"></app-area-red-chartjs-60>
                        </div>
                    </div>
                </div>
            </div>

            <div class="row mb-4 py-2">
                <div class="col text-center">
                    <h4>Learning is life, <span class="text-gradient">Explore more and Rewrite</span> an lessons you have learn't</h4>
                    <p class="text-secondary">You should learn and explore opportunities. If there is obstacles, try to remove it and improvise.</p>
                </div>
            </div>

            <div class="row gx-3 gx-lg-4">
                <div class="col-12 col-md-6 col-lg-6 col-xl-3 col-xxl-3">
                    <div class="card adminuiux-card mb-3 mb-lg-4">
                        <div class="card-body">
                            <div class="row gx-3 align-items-center">
                                <div class="col-auto">
                                    <div class="avatar avatar-60 rounded-circle">
                                        <app-circle-progress-blue-blank class="avatar avatar-60 rounded-circle"></app-circle-progress-blue-blank>
                                        <div class="avatar avatar-40 h5 position-absolute start-50 top-50 translate-middle bg-theme-1 theme-blue rounded-circle">
                                            <i class="bi bi-people"></i>
                                        </div>
                                    </div>
                                </div>
                                <div class="col">
                                    <p class="text-secondary small mb-1">Total Users</p>
                                    <h5 class="fw-medium">125.15 m</h5>
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
                                        <div class="avatar avatar-40 h5 position-absolute start-50 top-50 translate-middle bg-theme-1 theme-yellow  rounded-circle">
                                            <i class="bi bi-credit-card"></i>
                                        </div>
                                    </div>
                                </div>
                                <div class="col">
                                    <p class="text-secondary small mb-1">Amount Received</p>
                                    <h5 class="fw-medium">1255.00 m <small>USD</small></h5>
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
                                        <div class="avatar avatar-40 h5 position-absolute start-50 top-50 translate-middle  bg-theme-1 theme-red rounded-circle">
                                            <i class="bi bi-receipt-cutoff"></i>
                                        </div>
                                    </div>
                                </div>
                                <div class="col">
                                    <p class="text-secondary small mb-1">Subscription</p>
                                    <h5 class="fw-medium">1525 <small>k USD</small></h5>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-12 col-md-6 col-lg-6 col-xl-3 col-xxl-3">
                    <div class="card adminuiux-card bg-theme-1 theme-blue mb-3 mb-lg-4">
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
                                    <p class="opacity-75 small mb-1">New Authors</p>
                                    <h5>15</h5>
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
                <!-- Users and Transaction -->
                <div class="col-12 col-lg-12 col-xl-8 col-xxl-9 mb-4 position-relative column-set">
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
                <!-- news blog -->
                <div class="col-12 col-lg-12 col-xl-4 col-xxl-3">
                    <div class="card adminuiux-card mb-3 mb-lg-4">
                        <div class="card-header">
                            <div class="row gx-3 align-items-center">
                                <div class="col-auto">
                                    <i class="bi bi-newspaper h5 me-1 avatar avatar-40 bg-theme-1-subtle text-theme-1 theme-green rounded me-2"></i>
                                </div>
                                <div class="col">
                                    <h6 class="mb-0">Trending line</h6>
                                    <p class="text-secondary small">Learningnews</p>
                                </div>
                            </div>
                        </div>
                        <div class="coverimg w-100 height-200 position-relative overlay-gradiant z-index-1">
                            <div class="position-absolute bottom-0 start-0 w-100 mb-3 px-3 z-index-5">
                                <div class="row gx-3">
                                    <div class="col">
                                        <button class="btn btn-sm btn-outline-light btn-rounded">Share this</button>
                                    </div>
                                    <div class="col-auto">
                                        <div class="dropup d-inline-block">
                                            <a class="btn btn-square btn-sm rounded-circle btn-outline-light no-caret" data-bs-toggle="dropdown" aria-expanded="false" data-bs-display="static" role="button">
                                                <i class="bi bi-three-dots-vertical"></i>
                                            </a>
                                            <ul class="dropdown-menu dropdown-menu-end">
                                                <li>
                                                    <a class="dropdown-item" href="javascript:void(0)"><i class="bi bi-hand-thumbs-up me-1 text-green"></i> Recommendation this</a>
                                                </li>
                                                <li>
                                                    <a class="dropdown-item" href="javascript:void(0)"><i class="bi bi-hand-thumbs-down me-1 text-danger"></i> Don't recommend</a>
                                                </li>
                                                <li>
                                                    <a class="dropdown-item" href="javascript:void(0)"><i class="bi bi-star text-yellow"></i> Add to favorite</a>
                                                </li>
                                                <li><a class="dropdown-item text-danger" href="javascript:void(0)">Report this</a></li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <img src="assets/img/modern-ai-image/taxi-1.jpg" class="mw-100" alt="" />
                        </div>
                        <div class="card-body">
                            <h5>Marketing for business are not the same for all.</h5>
                            <p class="text-secondary">We have added useful, widgets, flexible. If you still reading this, you are in love with this design. <a routerLink="/app/blogs">Read more...</a></p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `,
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class LearningDashboardComponent {
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
