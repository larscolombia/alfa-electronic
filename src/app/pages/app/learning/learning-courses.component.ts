import { Component, OnInit, AfterViewInit, AfterContentChecked, OnDestroy, ViewChild, ElementRef, CUSTOM_ELEMENTS_SCHEMA } from "@angular/core";
import { RouterLink } from "@angular/router";
import Choices, { ClassNames } from "choices.js";
import Swiper from "swiper";
import { register } from "swiper/element/bundle";
register();
import DataTable from "datatables.net-dt";
import "datatables.net-responsive-dt";

import { DaterangePickerRangesComponent } from "../../../components/input-fields/daterange-picker/daterange-picker-ranges.component";
import { DoughnutChartjs180Component } from "../../../components/charts/doughnut-chartjs-180.component";
import { WalletBannerChartComponent } from "../../../components/charts/wallet-banner-chart.component";
import { CircleProgressBlueComponent } from "../../../components/charts/circle-progress-blue.component";
import { DatePickerInlineComponent } from "../../../components/input-fields/date-picker/date-picker-inline.component";
import { AreaBlueChartjs100Component } from "../../../components/charts/area-blue-chartjs-100.component";
import { AreaGreenChartjs100Component } from "../../../components/charts/area-green-chartjs-100.component";
import { AreaYellowChartjs100Component } from "../../../components/charts/area-yellow-chartjs-100.component";
import { AreaRedChartjs100Component } from "../../../components/charts/area-red-chartjs-100.component";
import { CircleProgressYellowComponent } from "../../../components/charts/circle-progress-yellow.component";
import { CircleProgressRedComponent } from "../../../components/charts/circle-progress-red.component";
import { CircleProgressGreenComponent } from "../../../components/charts/circle-progress-green.component";

@Component({
    selector: "app-learning-courses",
    standalone: true,
    imports: [RouterLink, DaterangePickerRangesComponent, DatePickerInlineComponent, DoughnutChartjs180Component, WalletBannerChartComponent, CircleProgressBlueComponent, CircleProgressYellowComponent, CircleProgressRedComponent, CircleProgressGreenComponent, AreaBlueChartjs100Component, AreaGreenChartjs100Component, AreaYellowChartjs100Component, AreaRedChartjs100Component],
    template: `
        <!-- page title -->
        <div class="container-fluid py-3">
            <div class="row gx-3 gx-lg-4 align-items-center page-title">
                <div class="col col-sm mb-3 mb-sm-0 order-1">
                    <h5 class="mb-0">Learning Courses</h5>
                    <p class="text-secondary small">Courses those are trending are most important for business</p>
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
                    <li class="breadcrumb-item bi active" aria-current="page">Courses</li>
                </ol>
            </nav>
        </div>

        <!-- content -->
        <div class="container mt-3" id="main-content">
            <div class="row gx-3 gx-lg-4">
                <div class="col-12 col-md-12 col-lg-12 col-xl-8">
                    <div class="card adminuiux-card mb-3 mb-lg-4">
                        <div class="card-header">
                            <div class="row gx-3 align-items-center">
                                <div class="col-auto">
                                    <i class="bi bi-bar-chart h5 avatar avatar-40 bg-theme-1-subtle text-theme-1 rounded"></i>
                                </div>
                                <div class="col">
                                    <h6 class="mb-0">Activity</h6>
                                    <p class="small text-secondary">6 New courses taken</p>
                                </div>
                            </div>
                        </div>
                        <div class="card-body">
                            <app-wallet-banner-chart class="height-200 d-block"></app-wallet-banner-chart>
                        </div>
                        <div class="card-footer pb-1">
                            <div class="row gx-3">
                                <div class="col-12 col-md-4 col-lg-3 mb-3">
                                    <div class="row gx-3 align-items-center">
                                        <div class="col-auto">
                                            <div class="avatar avatar-60 rounded bg-theme-1-subtle text-theme-1 theme-red">
                                                <i class="bi bi-book h5"></i>
                                            </div>
                                        </div>
                                        <div class="col">
                                            <p class="text-secondary small mb-1">Study</p>
                                            <h5 class="text-dark mb-0">158 <small class="h6 text-secondary">hours</small></h5>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-12 col-md-4 col-lg-3 mb-3">
                                    <div class="row gx-3 align-items-center">
                                        <div class="col-auto">
                                            <div class="avatar avatar-60 rounded bg-theme-1-subtle text-theme-1 theme-green">
                                                <i class="bi bi-people h5"></i>
                                            </div>
                                        </div>
                                        <div class="col">
                                            <p class="text-secondary small mb-1">Exams</p>
                                            <h5 class="text-dark mb-0">26 <small class="h6 text-secondary">hours</small></h5>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-12 col-md-auto mb-3">
                                    <div class="row gx-3 align-items-center">
                                        <div class="col-auto">
                                            <app-circle-progress-blue class="avatar avatar-60 rounded-circle"></app-circle-progress-blue>
                                        </div>
                                        <div class="col">
                                            <p class="text-secondary small mb-1">Course Completion</p>
                                            <h5>18 <small>Courses</small></h5>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-12 col-md-12 col-lg-12 col-xl-4">
                    <!-- courses domains -->
                    <div class="card adminuiux-card mb-3 mb-lg-4">
                        <div class="card-header">
                            <div class="row gx-3 align-items-center">
                                <div class="col">
                                    <h6 class="mb-0">Learning habits</h6>
                                    <p class="small text-secondary">Top Categories</p>
                                </div>
                            </div>
                        </div>
                        <div class="card-body text-center">
                            <div class="avatar avatar-200 position-relative mx-auto text-center mb-2">
                                <app-doughnut-chartjs-180 id="doughnutchart" class="avatar avatar-200 z-index-1"></app-doughnut-chartjs-180>
                                <div class="card adminuiux-card avatar avatar-160 position-absolute start-50 top-50 translate-middle text-center rounded-circle">
                                    <div class="w-100 lh-20">
                                        <h5 class="mb-1">16<br />Categories</h5>
                                        <p class="text-success small">56% Covered</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="card-footer">
                            <div class="badge badge-lg badge-light text-bg-theme-1 theme-green me-1 mb-1"><i class="bi bi-pc-display-horizontal vm me-1"></i> Information Tech.</div>
                            <div class="badge badge-lg badge-light text-bg-theme-1 theme-red me-1 mb-1"><i class="bi bi-wifi vm me-1"></i> Communication</div>
                            <div class="badge badge-lg badge-light text-bg-theme-1 theme-blue me-"><i class="bi bi-truck vm me-1"></i> Transportation</div>
                            <div class="badge badge-lg badge-light text-bg-theme-1 theme-yellow me-"><i class="bi bi-lock vm me-1"></i> Software security</div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="row gx-3 gx-lg-4">
                <div class="col-12 col-md-12 col-lg-12 col-xxl-4">
                    <!-- targets and course progress -->
                    <div class="card adminuiux-card mb-3 mb-lg-4 position-relative">
                        <div class="coverimg position-absolute end-0 top-0 h-100 w-25 rounded">
                            <img src="assets/img/modern-ai-image/pet-3.jpg" alt="" class="mw-100" />
                        </div>
                        <div class="row gx-3">
                            <div class="col-9">
                                <div class="card border-0 bg-white shadow-none">
                                    <div class="card-body">
                                        <div class="row gx-3">
                                            <div class="col align-self-center">
                                                <p class="small text-secondary mb-0">Business Model</p>
                                                <p>Data communication & signal strength</p>
                                                <div class="mt-3">
                                                    <div class="progress height-dynamic mb-1 bg-theme-1-subtle text-theme-1" style="--h-dynamic:5px">
                                                        <div class="progress-bar bg-theme-1" role="progressbar" style="width: 45%" aria-valuenow="45" aria-valuemin="0" aria-valuemax="100"></div>
                                                    </div>
                                                </div>
                                                <p class="small text-secondary">Targeted <span class="float-end">27 June 2022</span></p>
                                            </div>
                                            <div class="col-auto">
                                                <div class="rounded bg-theme-1 h-100 p-3">
                                                    <p class="opacity-75 small mb-1">Java<br />Language</p>
                                                    <p>152 hrs</p>
                                                    <button class="btn btn-sm btn-link text-white">Start <i class="bi bi-play vm text-white"></i></button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-12 col-md-6 col-lg-6 col-xxl-4">
                    <div class="card adminuiux-card mb-3 mb-lg-4">
                        <div class="card-body">
                            <div class="row gx-3">
                                <div class="col align-self-center">
                                    <div class="row gx-3">
                                        <div class="col-12 col-lg">
                                            <p class="text-secondary small mb-0">Subscribed</p>
                                            <p>Create HTML to Angular template with ease</p>
                                        </div>
                                        <div class="col-12 col-lg-auto text-start text-xl-end">
                                            <p class="text-secondary small mb-0">Author:</p>
                                            <p>AdminUIUX</p>
                                        </div>
                                    </div>
                                    <div class="mt-3">
                                        <div class="progress height-dynamic mb-1 bg-theme-1-subtle text-theme-1" style="--h-dynamic:5px">
                                            <div class="progress-bar bg-theme-1" role="progressbar" style="width: 45%" aria-valuenow="45" aria-valuemin="0" aria-valuemax="100"></div>
                                        </div>
                                    </div>
                                    <p class="small text-secondary">Targeted<span class="float-end">23 June 2022</span></p>
                                </div>
                                <div class="col-auto">
                                    <div class="rounded bg-theme-1 p-3">
                                        <p class="opacity-75 small mb-1">Angular<br />UI Kit</p>
                                        <p>100 hrs</p>
                                        <button class="btn btn-sm btn-link text-white">Start <i class="bi bi-play vm text-white"></i></button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-12 col-md-6 col-lg-6 col-xxl-4">
                    <div class="card adminuiux-card mb-3 mb-lg-4">
                        <div class="card-body">
                            <div class="row gx-3">
                                <div class="col-auto">
                                    <div class="rounded bg-theme-1 p-3">
                                        <p class="opacity-75 small mb-1">HTML<br />Template</p>
                                        <p>125 hrs</p>
                                        <button class="btn btn-sm btn-link text-white">Start <i class="bi bi-play vm text-white"></i></button>
                                    </div>
                                </div>
                                <div class="col align-self-center">
                                    <div class="row gx-3">
                                        <div class="col-12 col-lg">
                                            <p class="text-secondary small mb-0">Free Course</p>
                                            <p>Easily making money via blockchain</p>
                                        </div>
                                        <div class="col-12 col-lg-auto text-start text-xl-end">
                                            <p class="text-secondary small mb-0">Author:</p>
                                            <p>AdminUIUX</p>
                                        </div>
                                    </div>
                                    <div class="mt-3">
                                        <div class="progress height-dynamic mb-1 bg-theme-1-subtle text-theme-1" style="--h-dynamic:5px">
                                            <div class="progress-bar bg-theme-1" role="progressbar" style="width: 45%" aria-valuenow="45" aria-valuemin="0" aria-valuemax="100"></div>
                                        </div>
                                    </div>
                                    <p class="small text-secondary">Targeted<span class="float-end">23 June 2022</span></p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <h5 class="mb-1">Much more with your school life</h5>
            <p class="text-secondary mb-3 mb-lg-4">Inspired by your journey to the learning <span class="badge badge-sm badge-light text-bg-success">New</span></p>

            <div class="row gx-3 gx-lg-4">
                <div class="col-12 col-md-6 col-lg-4 col-xl-3">
                    <div class="row gx-3 gx-lg-4">
                        <div class="col-6">
                            <div class="card adminuiux-card height-160 bg-theme-1 theme-orange mb-3 mb-lg-4">
                                <div class="card-body position-relative">
                                    <h5 class="mb-0">Integrity</h5>
                                    <p class="opacity-75 mb-4">Learn from childhood</p>
                                </div>
                            </div>
                        </div>
                        <div class="col-6">
                            <div class="card adminuiux-card height-160 bg-theme-1 theme-yellow mb-3 mb-lg-4">
                                <div class="card-body position-relative">
                                    <h5 class="mb-0">Creativity</h5>
                                    <p class="opacity-75 mb-4">Problem solver mindset</p>
                                </div>
                            </div>
                        </div>
                        <div class="col-6">
                            <div class="card adminuiux-card height-170 bg-theme-1 theme-skyblue mb-3 mb-lg-4">
                                <div class="card-body position-relative">
                                    <h5 class="mb-0">Faithful</h5>
                                    <p class="opacity-75 mb-4">Build community of trust.</p>
                                </div>
                            </div>
                        </div>
                        <div class="col-6">
                            <div class="card adminuiux-card height-170 bg-theme-accent-1 mb-3 mb-lg-4">
                                <div class="card-body position-relative">
                                    <h5 class="mb-0">Effective</h5>
                                    <p class="opacity-75 mb-4">Communicate with the strength</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-12 col-md-6 col-lg-8 col-xl-9">
                    <swiper-container slides-per-view="auto" space-between="16" autoplay="true" class="swiper swipernavpagination">
                        <swiper-slide class="swiper-slide width-250 pb-3 pb-lg-4">
                            <div class="card adminuiux-card theme-green">
                                <div class="card-body position-relative">
                                    <span class="ribbon bg-theme-1 position-absolute top-0 end-0 z-index-1 mt-4">Best Seller</span>
                                    <div class="height-180 w-100 rounded coverimg position-relative mb-3" style='background-image: url("assets/img/modern-ai-image/user-5.jpg");'><img src="assets/img/modern-ai-image/user-5.jpg" alt="" style="display: none;" /></div>
                                    <a class="style-none d-block mb-2">
                                        <h6 class="mb-0 text-truncated">Fundamental of UX Design process</h6>
                                        <p class="small text-secondary">By Walter Smith</p>
                                    </a>
                                    <p class="text-secondary"><b>4.5</b> <i class="bi bi-star-fill small text-warning"></i> <i class="bi bi-star-fill small text-warning"></i> <i class="bi bi-star-fill small text-warning"></i> <i class="bi bi-star-fill small text-warning"></i> <i class="bi bi-star-half small text-warning"></i></p>
                                    <div class="row gx-3 align-items-center">
                                        <div class="col">
                                            <h5>$ 75.00 <s class="opacity-50 fs-14">$ 110.00</s></h5>
                                        </div>
                                        <div class="col-auto">
                                            <button class="btn btn-link btn-square rounded-circle"><i class="bi bi-cart"></i></button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </swiper-slide>
                        <swiper-slide class="swiper-slide width-250 pb-3 pb-lg-4">
                            <div class="card adminuiux-card shadow-sm">
                                <div class="card-body position-relative">
                                    <div class="height-180 w-100 rounded coverimg position-relative mb-3" style='background-image: url("assets/img/modern-ai-image/bus-3.jpg");'><img src="assets/img/modern-ai-image/bus-3.jpg" alt="" style="display: none;" /></div>
                                    <a class="style-none d-block mb-2">
                                        <h6 class="mb-0 text-truncated">UX Research and Wireframing</h6>
                                        <p class="small text-secondary">By Will Gill</p>
                                    </a>
                                    <p class="text-secondary"><b>4.0</b> <i class="bi bi-star-fill small text-warning"></i> <i class="bi bi-star-fill small text-warning"></i> <i class="bi bi-star-fill small text-warning"></i> <i class="bi bi-star-fill small text-warning"></i> <i class="bi bi-star small text-warning"></i></p>
                                    <div class="row gx-3 align-items-center">
                                        <div class="col">
                                            <h5>$ 80.00 <s class="opacity-50 fs-14">$ 120.00</s></h5>
                                        </div>
                                        <div class="col-auto">
                                            <button class="btn btn-link btn-square rounded-circle active"><i class="bi bi-cart"></i></button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </swiper-slide>
                        <swiper-slide class="swiper-slide width-250 pb-3 pb-lg-4">
                            <div class="card adminuiux-card shadow-sm">
                                <div class="card-body position-relative">
                                    <div class="height-180 w-100 rounded coverimg position-relative mb-3">
                                        <img src="assets/img/modern-ai-image/tree-6.jpg" alt="" style="display: none;" />
                                    </div>
                                    <a class="style-none d-block mb-2">
                                        <h6 class="mb-0 text-truncated">Digital Design at the edge</h6>
                                        <p class="small text-secondary">By Max Barter</p>
                                    </a>
                                    <p class="text-secondary"><b>4.5</b> <i class="bi bi-star-fill small text-warning"></i> <i class="bi bi-star-fill small text-warning"></i> <i class="bi bi-star-fill small text-warning"></i> <i class="bi bi-star-fill small text-warning"></i> <i class="bi bi-star-half small text-warning"></i></p>
                                    <div class="row gx-3 align-items-center">
                                        <div class="col">
                                            <h5>$ 80.00</h5>
                                        </div>
                                        <div class="col-auto">
                                            <div class="input-group input-group-sm">
                                                <button class="btn btn-link btn-square rounded-circle"><i class="bi bi-dash"></i></button> <input class="border-0 form-control bg-none text-center width-30 px-0" value="1" /> <button class="btn btn-link btn-square rounded-circle"><i class="bi bi-plus"></i></button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </swiper-slide>
                        <swiper-slide class="swiper-slide width-250 pb-3 pb-lg-4">
                            <div class="card adminuiux-card shadow-sm">
                                <div class="card-body position-relative">
                                    <div class="height-180 w-100 rounded coverimg position-relative mb-3">
                                        <img src="assets/img/modern-ai-image/peacoke-3.jpg" />
                                    </div>
                                    <a class="style-none d-block mb-2">
                                        <h6 class="mb-0 text-truncated">Design with McGrow</h6>
                                        <p class="small text-secondary">By McGrow and Hills</p>
                                    </a>
                                    <p class="text-secondary"><b>5.0</b> <i class="bi bi-star-fill small text-warning"></i> <i class="bi bi-star-fill small text-warning"></i> <i class="bi bi-star-fill small text-warning"></i> <i class="bi bi-star-fill small text-warning"></i> <i class="bi bi-star-fill small text-warning"></i></p>
                                    <div class="row gx-3 align-items-center">
                                        <div class="col">
                                            <h5>$ 115.00 <s class="opacity-50 fs-14">$ 150.00</s></h5>
                                        </div>
                                        <div class="col-auto">
                                            <button class="btn btn-link btn-square rounded-circle"><i class="bi bi-cart"></i></button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </swiper-slide>
                        <swiper-slide class="swiper-slide width-250 pb-3 pb-lg-4">
                            <div class="card adminuiux-card shadow-sm">
                                <div class="card-body position-relative">
                                    <div class="height-180 w-100 rounded coverimg position-relative mb-3">
                                        <img src="assets/img/modern-ai-image/tree-2.jpg" alt="" style="display: none;" />
                                    </div>
                                    <a class="style-none d-block mb-2">
                                        <h6 class="mb-0 text-truncated">UX Universal Risk</h6>
                                        <p class="small text-secondary">By Will Gill</p>
                                    </a>
                                    <p class="text-secondary"><b>4.0</b> <i class="bi bi-star-fill small text-warning"></i> <i class="bi bi-star-fill small text-warning"></i> <i class="bi bi-star-fill small text-warning"></i> <i class="bi bi-star-fill small text-warning"></i> <i class="bi bi-star small text-warning"></i></p>
                                    <div class="row gx-3 align-items-center">
                                        <div class="col">
                                            <h5>$ 80.00 <s class="opacity-50 fs-14">$ 120.00</s></h5>
                                        </div>
                                        <div class="col-auto">
                                            <button class="btn btn-link btn-square rounded-circle"><i class="bi bi-cart"></i></button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </swiper-slide>
                        <swiper-slide class="swiper-slide width-250 pb-3 pb-lg-4">
                            <div class="card adminuiux-card shadow-sm">
                                <div class="card-body position-relative">
                                    <div class="height-180 w-100 rounded coverimg position-relative mb-3">
                                        <img src="assets/img/modern-ai-image/kids-2.jpg" alt="" />
                                    </div>
                                    <a class="style-none d-block mb-2">
                                        <h6 class="mb-0 text-truncated">Design for Good and People</h6>
                                        <p class="small text-secondary">By Max Johnson</p>
                                    </a>
                                    <p class="text-secondary"><b>5.0</b> <i class="bi bi-star-fill small text-warning"></i> <i class="bi bi-star-fill small text-warning"></i> <i class="bi bi-star-fill small text-warning"></i> <i class="bi bi-star-fill small text-warning"></i> <i class="bi bi-star-fill small text-warning"></i></p>
                                    <div class="row gx-3 align-items-center">
                                        <div class="col">
                                            <h5>$ 90.00 <s class="opacity-50 fs-14">$ 150.00</s></h5>
                                        </div>
                                        <div class="col-auto">
                                            <button class="btn btn-link btn-square rounded-circle active"><i class="bi bi-cart"></i></button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </swiper-slide>
                        <div class="swiper-pagination line bottom-0 mb-1 rounded"></div>
                    </swiper-container>
                </div>
            </div>

            <!-- upcoming courses, tasks and schedules-->
            <div class="row gx-3 gx-lg-4">
                <div class="col-12 col-md-6 col-lg-6 col-xl-4 col-xxl-3">
                    <div class="card adminuiux-card mb-3 mb-lg-4">
                        <div class="card-body">
                            <h6 class="mb-3">Easily making money via blockchain networking and people</h6>
                            <div class="row gx-3 align-items-center">
                                <div class="col">
                                    <h5 class="mb-0">1542 <small class="fw-normal">Joined</small></h5>
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
                        </div>
                    </div>
                    <div class="card adminuiux-card mb-3 mb-lg-4">
                        <div class="card-body">
                            <h6 class="mb-2">Machine Learning</h6>
                            <p class="text-secondary small mb-0">Learn how the machines are working to automate jobs</p>
                            <p>
                                <a href="" class="btn btn-sm btn-link">Read More <i class="bi bi-chevron-right fs-12"></i></a>
                            </p>
                            <div class="row gx-3 align-items-center">
                                <div class="col">
                                    <h5 class="mb-0">256 <small>Joined</small></h5>
                                    <p class="small text-secondary">Open: Registration</p>
                                </div>
                                <div class="col-auto avatar-group">
                                    <a href="" class="btn btn-sm btn-theme px-3">Join</a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-12 col-md-6 col-lg-6 col-xl-4 col-xxl-3">
                    <div class="card adminuiux-card mb-3 mb-lg-4">
                        <div class="card-header">
                            <div class="row gx-3 align-items-center">
                                <div class=" col-auto">
                                    <i class="bi bi-list-task h5 avatar avatar-40 bg-theme-1-subtle text-theme-1 theme-green rounded"></i>
                                </div>
                                <div class="col">
                                    <h6 class="mb-0">Course Content</h6>
                                    <p class="text-secondary small">Continue your journey</p>
                                </div>
                            </div>
                        </div>
                        <div class="card-body p-0">
                            <ul class="list-group list-group-flush bg-none">
                                <li class="list-group-item">
                                    <div class="row gx-3">
                                        <div class="col-auto">01</div>
                                        <div class="col">
                                            <p class="mb-1"><s>Create UI design</s></p>
                                            <ul class="list-group border-0 bg-none">
                                                <li class="list-group-item">
                                                    <div class="row gx-2 text-secondary">
                                                        <div class="col-auto"><input class="form-check-input" type="checkbox" value="" aria-label="..." checked="" disabled /></div>
                                                        <div class="col-auto">1.1</div>
                                                        <div class="col"><s>UI Basics</s></div>
                                                    </div>
                                                </li>
                                                <li class="list-group-item">
                                                    <div class="row gx-2 text-secondary">
                                                        <div class="col-auto"><input class="form-check-input" type="checkbox" value="" aria-label="..." checked="" disabled /></div>
                                                        <div class="col-auto">1.2</div>
                                                        <div class="col"><s>UI with Tech</s></div>
                                                    </div>
                                                </li>
                                                <li class="list-group-item">
                                                    <div class="row gx-2 text-secondary">
                                                        <div class="col-auto"><input class="form-check-input" type="checkbox" value="" aria-label="..." checked="" disabled /></div>
                                                        <div class="col-auto">1.3</div>
                                                        <div class="col"><s>Grid Frameworks</s></div>
                                                    </div>
                                                </li>
                                            </ul>
                                        </div>
                                    </div>
                                </li>
                                <li class="list-group-item">
                                    <div class="row gx-3">
                                        <div class="col-auto">02</div>
                                        <div class="col">
                                            <p class="mb-1">Create HTML Structure</p>
                                            <ul class="list-group border-0 bg-none">
                                                <li class="list-group-item">
                                                    <div class="row gx-2 text-secondary">
                                                        <div class="col-auto"><input class="form-check-input" type="checkbox" value="" aria-label="..." checked /></div>
                                                        <div class="col-auto">2.1</div>
                                                        <div class="col"><s>Basic HTML 5</s></div>
                                                    </div>
                                                </li>
                                                <li class="list-group-item">
                                                    <div class="row gx-2">
                                                        <div class="col-auto"><input class="form-check-input" type="checkbox" value="" aria-label="..." /></div>
                                                        <div class="col-auto">2.2</div>
                                                        <div class="col">HTML Frameworks</div>
                                                    </div>
                                                </li>
                                            </ul>
                                        </div>
                                    </div>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
                <div class="col-12 col-md-6 col-lg-6 col-xl-4 col-xxl-3">
                    <div class="card adminuiux-card mb-3 mb-lg-4">
                        <div class="card-header">
                            <div class="row gx-3 align-items-center">
                                <div class="col-auto">
                                    <i class="bi bi-journal-bookmark bg-theme-1-subtle text-theme-1 theme-purple text-purple avatar avatar-40 rounded mb-0"> </i>
                                </div>
                                <div class="col">
                                    <h6 class="mb-0">Create HTML to Angular template with ease</h6>
                                </div>
                            </div>
                        </div>
                        <div class="card-body">
                            <div class="row gx-3 align-items-center mb-3">
                                <div class="col">
                                    <p class="text-secondary mb-1">Course Progress</p>
                                    <h5 class="mb-0">152 hrs <small class="fw-normal">(50.83%)</small></h5>
                                    <p class="small text-secondary">Currently 5 Chapters, 4 Completed.</p>
                                    <span class="badge badge-lg badge-light text-bg-theme-1 theme-green">Development</span>
                                    <span class="badge badge-lg badge-light text-bg-theme-1 theme-yellow ms-1">Language</span>
                                </div>
                            </div>
                            <div class="row gx-2 align-items-center mb-2">
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
                                    <p class="text-secondary small mb-0">5 more</p>
                                    <p class="small">Joined</p>
                                </div>
                                <div class="col-auto">
                                    <button class="btn btn-square btn-link">
                                        <i class="bi bi-person-plus "></i>
                                    </button>
                                </div>
                            </div>
                            <div class="progress bg-theme-1-subtle text-theme-1 height-dynamic mb-1" style="--h-dynamic:5px">
                                <div class="progress-bar bg-theme-1" role="progressbar" style="width: 50%" aria-valuenow="50" aria-valuemin="0" aria-valuemax="100"></div>
                            </div>
                            <p class="small text-secondary mb-3">Course Status <span class="float-end">50%</span></p>
                            <span class="badge badge-light text-bg-theme-1">Due date: 22 March 2022</span>
                        </div>
                    </div>
                </div>
                <div class="col-12 col-md-6 col-lg-6 col-xl-4 col-xxl-3">
                    <div class="card adminuiux-card mb-3 mb-lg-4">
                        <div class="card-body p-0">
                            <app-date-picker-inline></app-date-picker-inline>
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
                <!-- courses summary-->
                <div class="col-12 col-md-6 col-lg-6 col-xl-4 col-xxl-3 order-0 order-xxl-0">
                    <div class="card adminuiux-card bg-l-gradient-light theme-blue mb-3 mb-lg-4 rounded overflow-hidden">
                        <figure class="coverimg w-100 height-150 mb-0">
                            <img src="assets/img/modern-ai-image/kids-2.jpg" class="w-100" alt="" />
                        </figure>
                        <div class="card-body">
                            <h6 class="mb-1">Data communication and signal strength</h6>
                            <p class="text-secondary small">Network to Internet making Intranet</p>
                            <div class="row gx-3 align-items-center">
                                <div class="col">
                                    <h4 class="mb-0">1542 <small class="h6">students</small></h4>
                                    <p class="small">
                                        11 <span class="text-green"><i class="bi bi-arrow-up fs-10"></i>3.15%</span>
                                    </p>
                                </div>
                                <div class="col-auto">
                                    <app-circle-progress-blue class="avatar avatar-60 small"></app-circle-progress-blue>
                                </div>
                            </div>
                        </div>
                        <div class="card-footer p-0">
                            <app-area-blue-chartjs-100 class="height-100 d-block mb-3"></app-area-blue-chartjs-100>
                            <div class="row gx-2 text-center">
                                <div class="col-3 mb-3">
                                    <p class="mb-3"><i class="bi bi-book avatar avatar-24 d-inline-block text-theme-1"></i></p>
                                    <h5 class="mb-0">3</h5>
                                    <p><small class="text-secondary">Lessons</small></p>
                                </div>
                                <div class="col-3 mb-3">
                                    <p class="mb-3"><i class="bi bi-clock avatar avatar-24 d-inline-block text-theme-1"></i></p>
                                    <h5 class="mb-0">2</h5>
                                    <p><small class="text-secondary">hrs/week</small></p>
                                </div>
                                <div class="col-3 mb-3">
                                    <p class="mb-3"><i class="bi bi-clipboard-check avatar avatar-24 d-inline-block text-theme-1"></i></p>
                                    <h5 class="mb-0">3</h5>
                                    <p><small class="text-secondary">Exams</small></p>
                                </div>
                                <div class="col-3 mb-3">
                                    <p class="mb-3"><i class="bi bi-journal-bookmark avatar avatar-24 d-inline-block text-theme-1"></i></p>
                                    <h5 class="mb-0">2</h5>
                                    <p><small class="text-secondary">Projects</small></p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-12 col-md-6 col-lg-6 col-xl-4 col-xxl-3 order-1 order-xxl-1">
                    <div class="card adminuiux-card bg-l-gradient-light theme-green mb-3 mb-lg-4 rounded overflow-hidden">
                        <figure class="coverimg w-100 height-150 mb-0">
                            <img src="assets/img/modern-ai-image/flamingo-4.jpg" class="w-100" alt="" />
                        </figure>
                        <div class="card-body">
                            <h6 class="mb-1">Easily making money via blockchain networks</h6>
                            <p class="text-secondary small">All you need to work about blockchain</p>
                            <div class="row gx-3 align-items-center">
                                <div class="col">
                                    <h4 class="mb-0">325 <small class="h6">Joined</small></h4>
                                    <p class="small">
                                        12 <span class="text-green"><i class="bi bi-arrow-up fs-10"></i>3.15%</span>
                                    </p>
                                </div>
                                <div class="col-auto">
                                    <app-circle-progress-green class="avatar avatar-60 small"></app-circle-progress-green>
                                </div>
                            </div>
                        </div>
                        <div class="card-footer p-0">
                            <app-area-green-chartjs-100 class="height-100 d-block mb-3"></app-area-green-chartjs-100>
                            <div class="row gx-2 text-center">
                                <div class="col-3 mb-3">
                                    <p class="mb-3"><i class="bi bi-book avatar avatar-24 d-inline-block text-theme-1"></i></p>
                                    <h5 class="mb-0">4</h5>
                                    <p><small class="text-secondary">Lessons</small></p>
                                </div>
                                <div class="col-3 mb-3">
                                    <p class="mb-3"><i class="bi bi-clock avatar avatar-24 d-inline-block text-theme-1"></i></p>
                                    <h5 class="mb-0">6</h5>
                                    <p><small class="text-secondary">hrs/week</small></p>
                                </div>
                                <div class="col-3 mb-3">
                                    <p class="mb-3"><i class="bi bi-clipboard-check avatar avatar-24 d-inline-block text-theme-1"></i></p>
                                    <h5 class="mb-0">13</h5>
                                    <p><small class="text-secondary">Exams</small></p>
                                </div>
                                <div class="col-3 mb-3">
                                    <p class="mb-3"><i class="bi bi-journal-bookmark avatar avatar-24 d-inline-block text-theme-1"></i></p>
                                    <h5 class="mb-0">21</h5>
                                    <p><small class="text-secondary">Projects</small></p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-12 col-md-6 col-lg-6 col-xl-4 col-xxl-3 order-2 order-xxl-2">
                    <div class="card adminuiux-card bg-l-gradient-light theme-yellow mb-3 mb-lg-4 rounded overflow-hidden">
                        <figure class="coverimg w-100 height-150 mb-0">
                            <img src="assets/img/modern-ai-image/tree-5.jpg" class="w-100" alt="" />
                        </figure>
                        <div class="card-body">
                            <h6 class="mb-1">Home furnishing & appliance Management</h6>
                            <p class="text-secondary small">Design and Adjust space around</p>
                            <div class="row gx-3 align-items-center">
                                <div class="col">
                                    <h4 class="mb-0">2015 <small class="h6">In groups</small></h4>
                                    <p class="small">
                                        62 <span class="text-green"><i class="bi bi-arrow-up fs-10"></i>3.15%</span>
                                    </p>
                                </div>
                                <div class="col-auto">
                                    <app-circle-progress-yellow class="avatar avatar-60 small"></app-circle-progress-yellow>
                                </div>
                            </div>
                        </div>
                        <div class="card-footer p-0">
                            <app-area-yellow-chartjs-100 class="height-100 d-block mb-3"></app-area-yellow-chartjs-100>
                            <div class="row gx-2 text-center">
                                <div class="col-3 mb-3">
                                    <p class="mb-3"><i class="bi bi-book avatar avatar-24 d-inline-block text-theme-1"></i></p>
                                    <h5 class="mb-0">4</h5>
                                    <p><small class="text-secondary">Lessons</small></p>
                                </div>
                                <div class="col-3 mb-3">
                                    <p class="mb-3"><i class="bi bi-clock avatar avatar-24 d-inline-block text-theme-1"></i></p>
                                    <h5 class="mb-0">5</h5>
                                    <p><small class="text-secondary">hrs/week</small></p>
                                </div>
                                <div class="col-3 mb-3">
                                    <p class="mb-3"><i class="bi bi-clipboard-check avatar avatar-24 d-inline-block text-theme-1"></i></p>
                                    <h5 class="mb-0">4</h5>
                                    <p><small class="text-secondary">Exams</small></p>
                                </div>
                                <div class="col-3 mb-3">
                                    <p class="mb-3"><i class="bi bi-journal-bookmark avatar avatar-24 d-inline-block text-theme-1"></i></p>
                                    <h5 class="mb-0">3</h5>
                                    <p><small class="text-secondary">Projects</small></p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-12 col-md-6 col-lg-6 col-xl-4 col-xxl-3 order-3 order-xxl-3">
                    <div class="card adminuiux-card bg-l-gradient-light theme-red mb-3 mb-lg-4 rounded overflow-hidden">
                        <figure class="coverimg w-100 height-150 mb-0">
                            <img src="assets/img/modern-ai-image/user-1-kid.jpg" class="w-100" alt="" />
                        </figure>
                        <div class="card-body">
                            <h6 class="mb-1">Be a good and create good Presentations</h6>
                            <p class="text-secondary small">How to convince viewer</p>
                            <div class="row gx-3 align-items-center">
                                <div class="col">
                                    <h4 class="mb-0">178 <small class="h6">Joined</small></h4>
                                    <p class="small">
                                        18 <span class="text-green"><i class="bi bi-arrow-up fs-10"></i>3.15%</span>
                                    </p>
                                </div>
                                <div class="col-auto">
                                    <app-circle-progress-red class="avatar avatar-60 small"></app-circle-progress-red>
                                </div>
                            </div>
                        </div>
                        <div class="card-footer p-0">
                            <app-area-red-chartjs-100 class="height-100 d-block mb-3"></app-area-red-chartjs-100>
                            <div class="row gx-2 text-center">
                                <div class="col-3 mb-3">
                                    <p class="mb-3"><i class="bi bi-book avatar avatar-24 d-inline-block text-theme-1"></i></p>
                                    <h5 class="mb-0">8</h5>
                                    <p><small class="text-secondary">Lessons</small></p>
                                </div>
                                <div class="col-3 mb-3">
                                    <p class="mb-3"><i class="bi bi-clock avatar avatar-24 d-inline-block text-theme-1"></i></p>
                                    <h5 class="mb-0">6</h5>
                                    <p><small class="text-secondary">hrs/week</small></p>
                                </div>
                                <div class="col-3 mb-3">
                                    <p class="mb-3"><i class="bi bi-clipboard-check avatar avatar-24 d-inline-block text-theme-1"></i></p>
                                    <h5 class="mb-0">5</h5>
                                    <p><small class="text-secondary">Exams</small></p>
                                </div>
                                <div class="col-3 mb-3">
                                    <p class="mb-3"><i class="bi bi-journal-bookmark avatar avatar-24 d-inline-block text-theme-1"></i></p>
                                    <h5 class="mb-0">6</h5>
                                    <p><small class="text-secondary">Projects</small></p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Users and Transaction -->
                <div class="col-12 col-lg-12 col-xl-8 col-xxl-9 order-5 order-xxl-4">
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
                <div class="col-12 col-lg-12 col-xl-4 col-xxl-3 order-4 order-xxl-5">
                    <div class="card adminuiux-card mb-3 mb-lg-4">
                        <div class="card-header">
                            <div class="row gx-3 align-items-center">
                                <div class="col-auto">
                                    <i class="bi bi-newspaper h5 me-1 avatar avatar-40 bg-theme-1-subtle text-theme-1 theme-green rounded "></i>
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

            <!-- course list overview -->
            <h5 class="mb-1">Explore Schooling Courses</h5>
            <p class="text-secondary mb-3 mb-lg-4">We have wide range of courses from standard 1-12</p>
            <div class="card adminuiux-card mb-3 mb-lg-4">
                <div class="card-body pb-0">
                    <div class="overflow-x-auto mb-3">
                        <ul class="nav nav-pills adminuiux-tabs flex-nowrap text-nowrap" id="myTab" role="tablist">
                            <li class="nav-item" role="presentation"><button class="nav-link active" id="1-tab" data-bs-toggle="tab" data-bs-target="#1-tab-pane" type="button" role="tab" aria-controls="1-tab-pane" aria-selected="true">Pre-School</button></li>
                            <li class="nav-item" role="presentation"><button class="nav-link" id="2-tab" data-bs-toggle="tab" data-bs-target="#2-tab-pane" type="button" role="tab" aria-controls="2-tab-pane" aria-selected="false" tabindex="-1">Lower School</button></li>
                            <li class="nav-item" role="presentation"><button class="nav-link" id="3-tab" data-bs-toggle="tab" data-bs-target="#3-tab-pane" type="button" role="tab" aria-controls="3-tab-pane" aria-selected="false" tabindex="-1">Middle School</button></li>
                            <li class="nav-item" role="presentation"><button class="nav-link" id="4-tab" data-bs-toggle="tab" data-bs-target="#4-tab-pane" type="button" role="tab" aria-controls="4-tab-pane" aria-selected="false" tabindex="-1">High School</button></li>
                            <li class="nav-item" role="presentation"><button class="nav-link" id="5-tab" data-bs-toggle="tab" data-bs-target="#5-tab-pane" type="button" role="tab" aria-controls="5-tab-pane" aria-selected="false" tabindex="-1">Fine Art</button></li>
                            <li class="nav-item" role="presentation"><button class="nav-link" id="6-tab" data-bs-toggle="tab" data-bs-target="#6-tab-pane" type="button" role="tab" aria-controls="6-tab-pane" aria-selected="false" tabindex="-1">Sports</button></li>
                            <li class="nav-item" role="presentation"><button class="nav-link" id="7-tab" data-bs-toggle="tab" data-bs-target="#7-tab-pane" type="button" role="tab" aria-controls="7-tab-pane" aria-selected="false" tabindex="-1">Languages</button></li>
                            <li class="nav-item" role="presentation"><button class="nav-link" id="8-tab" data-bs-toggle="tab" data-bs-target="#8-tab-pane" type="button" role="tab" aria-controls="8-tab-pane" aria-selected="false" tabindex="-1">Perfomance</button></li>
                        </ul>
                    </div>
                    <div class="tab-content" id="myTabContent">
                        <div class="tab-pane fade active show" id="1-tab-pane" role="tabpanel" aria-labelledby="1-tab" tabindex="0">
                            <div class="row gx-3 gx-lg-4">
                                <div class="col-12 col-md-6 col-lg-4 col-xl-3">
                                    <div class="card mb-3 mb-lg-4">
                                        <div class="card-body">
                                            <div class="row gx-3 align-items-center mb-3">
                                                <div class="col-auto">
                                                    <div class="avatar avatar-50 rounded bg-theme-1-subtle text-theme-1 h4"><i class="bi bi-people"></i></div>
                                                </div>
                                                <div class="col">
                                                    <h6 class="mb-0">Parent</h6>
                                                    <p class="small">Guiding for child growth</p>
                                                </div>
                                            </div>
                                            <p class="text-secondary small mb-0">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer cursus blandit dolor, nec rutrum urna facilisis vitae.</p>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-12 col-md-6 col-lg-4 col-xl-3">
                                    <div class="card mb-3 mb-lg-4">
                                        <div class="card-body">
                                            <div class="row gx-3 align-items-center mb-3">
                                                <div class="col-auto">
                                                    <div class="avatar avatar-50 rounded bg-theme-1-subtle text-theme-1 h4"><i class="bi bi-puzzle"></i></div>
                                                </div>
                                                <div class="col">
                                                    <h6 class="mb-0">Puzzleroom</h6>
                                                    <p class="small">Improve thinking power</p>
                                                </div>
                                            </div>
                                            <p class="text-secondary small mb-0">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer cursus blandit dolor, nec rutrum urna facilisis vitae.</p>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-12 col-md-6 col-lg-4 col-xl-3">
                                    <div class="card mb-3 mb-lg-4">
                                        <div class="card-body">
                                            <div class="row gx-3 align-items-center mb-3">
                                                <div class="col-auto">
                                                    <div class="avatar avatar-50 rounded bg-theme-1-subtle text-theme-1 h4"><i class="bi bi-house"></i></div>
                                                </div>
                                                <div class="col">
                                                    <h6 class="mb-0">Indoor Learning</h6>
                                                    <p class="small">Teaching indoor activity</p>
                                                </div>
                                            </div>
                                            <p class="text-secondary small mb-0">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer cursus blandit dolor, nec rutrum urna facilisis vitae.</p>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-12 col-md-6 col-lg-4 col-xl-3">
                                    <div class="card mb-3 mb-lg-4">
                                        <div class="card-body">
                                            <div class="row gx-3 align-items-center mb-3">
                                                <div class="col-auto">
                                                    <div class="avatar avatar-50 rounded bg-theme-1-subtle text-theme-1 h4"><i class="bi bi-houses"></i></div>
                                                </div>
                                                <div class="col">
                                                    <h6 class="mb-0">Outdoor</h6>
                                                    <p class="small">Teaching outdoor activities</p>
                                                </div>
                                            </div>
                                            <p class="text-secondary small mb-0">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer cursus blandit dolor, nec rutrum urna facilisis vitae.</p>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-12 col-md-6 col-lg-4 col-xl-3">
                                    <div class="card mb-3 mb-lg-4">
                                        <div class="card-body">
                                            <div class="row gx-3 align-items-center mb-3">
                                                <div class="col-auto">
                                                    <div class="avatar avatar-50 rounded bg-theme-1-subtle text-theme-1 h4"><i class="bi bi-person-gear"></i></div>
                                                </div>
                                                <div class="col">
                                                    <h6 class="mb-0">Self-orientation</h6>
                                                    <p class="small">Improve in self</p>
                                                </div>
                                            </div>
                                            <p class="text-secondary small mb-0">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer cursus blandit dolor, nec rutrum urna facilisis vitae.</p>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-12 col-md-6 col-lg-4 col-xl-3">
                                    <div class="card mb-3 mb-lg-4">
                                        <div class="card-body">
                                            <div class="row gx-3 align-items-center mb-3">
                                                <div class="col-auto">
                                                    <div class="avatar avatar-50 rounded bg-theme-1-subtle text-theme-1 h4"><i class="bi bi-hospital"></i></div>
                                                </div>
                                                <div class="col">
                                                    <h6 class="mb-0">Indoor Learning</h6>
                                                    <p class="small">Teaching indoor activity</p>
                                                </div>
                                            </div>
                                            <p class="text-secondary small mb-0">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer cursus blandit dolor, nec rutrum urna facilisis vitae.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="tab-pane fade" id="2-tab-pane" role="tabpanel" aria-labelledby="2-tab" tabindex="0">...</div>
                        <div class="tab-pane fade" id="3-tab-pane" role="tabpanel" aria-labelledby="3-tab" tabindex="0">...</div>
                        <div class="tab-pane fade" id="4-tab-pane" role="tabpanel" aria-labelledby="4-tab" tabindex="0">...</div>
                        <div class="tab-pane fade" id="5-tab-pane" role="tabpanel" aria-labelledby="5-tab" tabindex="0">...</div>
                        <div class="tab-pane fade" id="6-tab-pane" role="tabpanel" aria-labelledby="6-tab" tabindex="0">...</div>
                        <div class="tab-pane fade" id="7-tab-pane" role="tabpanel" aria-labelledby="7-tab" tabindex="0">...</div>
                        <div class="tab-pane fade" id="8-tab-pane" role="tabpanel" aria-labelledby="8-tab" tabindex="0">...</div>
                    </div>
                </div>
            </div>

            <h5 class="mb-1">Our features</h5>
            <p class="text-secondary mb-3 mb-lg-4">Facilities that provide with our in school courses</p>
            <div class="row gx-3 gx-lg-4">
                <div class="col-12 col-md-6 col-lg-4 col-xl-3">
                    <div class="card adminuiux-card mb-3 mb-lg-4">
                        <div class="card-body">
                            <div class="row gx-3 align-items-center">
                                <div class="col-auto"><i class="bi bi-eye avatar avatar-50 h4 rounded-circle bg-theme-1 text-white theme-red"></i></div>
                                <div class="col">
                                    <h6 class="mb-1">Quality Education</h6>
                                    <p class="small text-secondary">Reliable and High Quality Education</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-12 col-md-6 col-lg-4 col-xl-3">
                    <div class="card adminuiux-card mb-3 mb-lg-4">
                        <div class="card-body">
                            <div class="row gx-3 align-items-center">
                                <div class="col-auto"><i class="bi bi-puzzle avatar avatar-50 h4 rounded-circle bg-theme-1 text-white theme-orange"></i></div>
                                <div class="col">
                                    <h6 class="mb-1">Puzzleroom</h6>
                                    <p class="small text-secondary">World Class Problem Solving Environment</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-12 col-md-6 col-lg-4 col-xl-3">
                    <div class="card adminuiux-card mb-3 mb-lg-4">
                        <div class="card-body">
                            <div class="row gx-3 align-items-center">
                                <div class="col-auto"><i class="bi bi-play-btn avatar avatar-50 h4 rounded-circle bg-theme-1 text-white theme-green"></i></div>
                                <div class="col">
                                    <h6 class="mb-1">Video Lectures</h6>
                                    <p class="small text-secondary">Video Lectures and Self-Learning</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-12 col-md-6 col-lg-4 col-xl-3">
                    <div class="card adminuiux-card mb-3 mb-lg-4">
                        <div class="card-body">
                            <div class="row gx-3 align-items-center">
                                <div class="col-auto"><i class="bi bi-easel avatar avatar-50 h4 rounded-circle bg-theme-1 text-white theme-skyblue"></i></div>
                                <div class="col">
                                    <h6 class="mb-1">Presenation</h6>
                                    <p class="small text-secondary">Weekly Presentation and Orientation</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-12 col-md-6 col-lg-4 col-xl-3">
                    <div class="card adminuiux-card mb-3 mb-lg-4">
                        <div class="card-body">
                            <div class="row gx-3 align-items-center">
                                <div class="col-auto"><i class="bi bi-clipboard-check avatar avatar-50 h4 rounded-circle bg-theme-1 text-white theme-yellow"></i></div>
                                <div class="col">
                                    <h6 class="mb-1">Result Oriented</h6>
                                    <p class="small text-secondary">Exam and Test along with Preparation</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-12 col-md-6 col-lg-4 col-xl-3">
                    <div class="card adminuiux-card mb-3 mb-lg-4">
                        <div class="card-body">
                            <div class="row gx-3 align-items-center">
                                <div class="col-auto"><i class="bi bi-book avatar avatar-50 h4 rounded-circle bg-theme-1 text-white theme-teal h4"></i></div>
                                <div class="col">
                                    <h6 class="mb-1">Progress Tracking</h6>
                                    <p class="small text-secondary">Notes and Maintain Syllabus Progress</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-12 col-md-6 col-lg-4 col-xl-3">
                    <div class="card adminuiux-card mb-3 mb-lg-4">
                        <div class="card-body">
                            <div class="row gx-3 align-items-center">
                                <div class="col-auto"><i class="bi bi-people avatar avatar-50 h4 rounded-circle bg-theme-1 text-white theme-purple h4"></i></div>
                                <div class="col">
                                    <h6 class="mb-1">Parent Orientation</h6>
                                    <p class="small text-secondary">Guiding Parents with Latest Teaching Methods</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-12 col-md-6 col-lg-4 col-xl-3">
                    <div class="card adminuiux-card mb-3 mb-lg-4">
                        <div class="card-body">
                            <div class="row gx-3 align-items-center">
                                <div class="col-auto"><i class="bi bi-phone avatar avatar-50 h4 rounded-circle bg-theme-1 text-white theme-brown h4"></i></div>
                                <div class="col">
                                    <h6 class="mb-1">Transparency</h6>
                                    <p class="small text-secondary">100% Tracking with Mobile Application</p>
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
export class LearningCoursesComponent {
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
