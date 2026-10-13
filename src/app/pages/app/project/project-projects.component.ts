import { Component, OnInit, AfterViewInit, AfterContentChecked, OnDestroy, ViewChild, ElementRef, CUSTOM_ELEMENTS_SCHEMA } from "@angular/core";
import { RouterLink } from "@angular/router";
import Choices, { ClassNames } from "choices.js";

import { DaterangePickerRangesComponent } from "../../../components/input-fields/daterange-picker/daterange-picker-ranges.component";
import { DatePickerInlineComponent } from "../../../components/input-fields/date-picker/date-picker-inline.component";
import { BarRedChartjs100Component } from "../../../components/charts/bar-red-chartjs-100.component";
import { BarGreenChartjs100Component } from "../../../components/charts/bar-green-chartjs-100.component";
import { DoughnutChartjs100Component } from "../../../components/charts/doughnut-chartjs-100.component";
import { DoughnutChartjs1002Component } from "../../../components/charts/doughnut-chartjs-100-2.component";

declare const dragula: any;

@Component({
    selector: "app-project-projects",
    standalone: true,
    imports: [RouterLink, DaterangePickerRangesComponent, DatePickerInlineComponent, BarRedChartjs100Component, BarGreenChartjs100Component, DoughnutChartjs100Component, DoughnutChartjs1002Component],
    template: `
        <!-- page title -->
        <div class="container-fluid py-3">
            <div class="row gx-3 gx-lg-4 align-items-center page-title">
                <div class="col col-sm mb-3 mb-sm-0 order-1">
                    <h5 class="mb-0">Project Details</h5>
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
                    <li class="breadcrumb-item bi"><a routerLink="/app/project-dashboard">Projects</a></li>
                    <li class="breadcrumb-item bi active" aria-current="page">Project Details</li>
                </ol>
            </nav>
        </div>

        <!-- content -->
        <div class="container mt-3" id="main-content">
            <div class="row gx-3 align-items-center">
                <div class="col-auto col-md-auto mb-3 mb-lg-4">
                    <figure class="avatar avatar-100 rounded coverimg">
                        <img src="assets/img/logo-512.png" alt="" />
                    </figure>
                </div>
                <!-- Project name -->
                <div class="col col-md mb-3 mb-lg-4">
                    <h2 class="mb-0">AdminUIUX</h2>
                    <p class="text-secondary mb-2">UIkit and Template app</p>
                    <!-- tags -->
                    <div class="row gx-3 align-items-center">
                        <div class="col-auto">
                            <span class="badge badge-light text-bg-theme-1 theme-red">Mobile App</span>
                            <span class="badge badge-light text-bg-theme-1 theme-yellow ms-1">High priority</span>
                        </div>
                    </div>
                </div>

                <!-- status -->
                <div class="col-12 col-md-auto ms-auto mb-3 mb-lg-4">
                    <div class="swiper swipernav">
                        <div class="swiper-wrapper">
                            <div class="swiper-slide width-200">
                                <div class="row gx-3 align-items-center">
                                    <div class="col-auto">
                                        <div class="avatar avatar-60 rounded bg-theme-1 text-white theme-green">
                                            <i class="bi bi-clock-history h4"></i>
                                        </div>
                                    </div>
                                    <div class="col">
                                        <p class="text-secondary small mb-0">Effort Used</p>
                                        <h4 class="mb-0"><span class="increamentcount">2152</span> <small class="h6">Hrs</small></h4>
                                        <p class="small">50.83%</p>
                                    </div>
                                </div>
                            </div>
                            <div class="swiper-slide width-200">
                                <div class="row gx-3 align-items-center">
                                    <div class="col-auto">
                                        <div class="avatar avatar-60 rounded bg-theme-1 text-white theme-red">
                                            <i class="bi bi-clock h4"></i>
                                        </div>
                                    </div>
                                    <div class="col">
                                        <p class="text-secondary small mb-0">Effort Remains</p>
                                        <h4 class="mb-0"><span class="increamentcount">2048</span> <small class="h6">hrs</small></h4>
                                        <p class="small">49.17%</p>
                                    </div>
                                </div>
                            </div>
                            <div class="swiper-slide width-200">
                                <div class="row gx-3 align-items-center">
                                    <div class="col-auto">
                                        <div class="avatar avatar-60 rounded bg-theme-1 text-white theme-blue">
                                            <i class="bi bi-people h4"></i>
                                        </div>
                                    </div>
                                    <div class="col">
                                        <p class="text-secondary small mb-0">Team Availability</p>
                                        <h4 class="mb-0"><span class="increamentcount">2500</span> <small class="h6">hrs</small></h4>
                                        <p class="small text-green">Fully available</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- summary -->
            <div class="row gx-3 gx-lg-4">
                <div class="col-12 col-md-12 col-lg-6 col-xl-3">
                    <div class="card adminuiux-card mb-3 mb-lg-4">
                        <div class="card-body">
                            <div class="row gx-3 align-items-center">
                                <div class="col-auto">
                                    <div class="avatar avatar-40 rounded bg-theme-1-subtle text-theme-1 theme-yellow">
                                        <i class="bi bi-check-all h5"></i>
                                    </div>
                                </div>
                                <div class="col">
                                    <p class="small text-secondary mb-1">Task Completed</p>
                                    <h6 class="mb-0">1285</h6>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-12 col-md-12 col-lg-6 col-xl-3">
                    <div class="card adminuiux-card mb-3 mb-lg-4">
                        <div class="card-body">
                            <div class="row gx-3 align-items-center">
                                <div class="col-auto">
                                    <div class="avatar avatar-40 rounded bg-theme-1-subtle text-theme-1 theme-blue">
                                        <i class="bi bi-clock h5"></i>
                                    </div>
                                </div>
                                <div class="col">
                                    <p class="small text-secondary mb-1">Efforts Allocated</p>
                                    <h6 class="mb-0">12858</h6>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-12 col-md-12 col-lg-6 col-xl-3">
                    <div class="card adminuiux-card mb-3 mb-lg-4">
                        <div class="card-body">
                            <div class="row gx-3 align-items-center">
                                <div class="col-auto">
                                    <div class="avatar avatar-40 rounded bg-theme-1-subtle text-theme-1 theme-green">
                                        <i class="bi bi-people h5"></i>
                                    </div>
                                </div>
                                <div class="col">
                                    <p class="small text-secondary mb-1">Team Member</p>
                                    <h6 class="mb-0">24 People</h6>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-12 col-md-12 col-lg-6 col-xl-3">
                    <div class="card adminuiux-card mb-3 mb-lg-4">
                        <div class="card-body">
                            <div class="row gx-3 align-items-center">
                                <div class="col-auto">
                                    <div class="avatar avatar-40 rounded bg-theme-1-subtle text-theme-1 theme-pink">
                                        <i class="bi bi-journal-check h5"></i>
                                    </div>
                                </div>
                                <div class="col">
                                    <p class="small text-secondary mb-1">Tasks in Progress</p>
                                    <h6 class="mb-0">18 - 1204 hrs</h6>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- project status -->
            <div class="row gx-3 gx-lg-4">
                <div class="col-12 col-md-6 col-lg-6 col-xl-3 mb-4">
                    <div class="card adminuiux-card bg-l-gradient-light theme-yellow h-100">
                        <div class="card-header bg-none">
                            <div class="row gx-3 align-items-center">
                                <div class="col">
                                    <p class="small text-secondary mb-1">Due Date</p>
                                    <p>25/05/2022</p>
                                </div>
                            </div>
                        </div>
                        <div class="card-body">
                            <h5 class="text-center mb-1">Prototype</h5>
                            <p class="text-secondary text-center mb-3">On the Track</p>
                            <div class="progress height-dynamic mb-2 bg-theme-1-subtle text-theme-1" style="--h-dynamic: 5px">
                                <div class="progress-bar bg-theme-1" role="progressbar" style="width: 50%" aria-valuenow="50" aria-valuemin="0" aria-valuemax="100"></div>
                            </div>
                            <p class="small text-secondary mb-3">Project Status <span class="float-end">50%</span></p>
                            <div class="row gx-2 align-items-center">
                                <div class="col-auto avatar-group">
                                    <div class="avatar avatar-40 coverimg rounded-circle">
                                        <img src="assets/img/modern-ai-image/user-2.jpg" alt="" />
                                    </div>
                                    <div class="avatar avatar-40 coverimg rounded-circle">
                                        <img src="assets/img/modern-ai-image/user-4.jpg" alt="" />
                                    </div>
                                </div>
                                <div class="col">
                                    <p class="text-secondary small mb-0">5 more</p>
                                    <p class="small">Working</p>
                                </div>
                                <div class="col-auto">
                                    <button class="btn btn-square btn-link">
                                        <i class="bi bi-person-plus "></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="col-12 col-md-6 col-lg-6 col-xl-3 mb-4">
                    <div class="card adminuiux-card bg-l-gradient-light theme-blue h-100">
                        <div class="card-header bg-none">
                            <div class="row gx-3 align-items-center">
                                <div class="col">
                                    <p class="small text-secondary mb-1">Due Date</p>
                                    <p>30/06/2022</p>
                                </div>
                            </div>
                        </div>
                        <div class="card-body">
                            <h5 class="text-center mb-1">Development</h5>
                            <p class="text-secondary text-center mb-3">On the Track</p>
                            <div class="progress height-dynamic mb-2 bg-theme-1-subtle text-theme-1" style="--h-dynamic: 5px">
                                <div class="progress-bar bg-theme-1" role="progressbar" style="width: 50%" aria-valuenow="50" aria-valuemin="0" aria-valuemax="100"></div>
                            </div>
                            <p class="small text-secondary mb-3">Project Status <span class="float-end">50%</span></p>
                            <div class="row gx-2 align-items-center">
                                <div class="col-auto avatar-group">
                                    <div class="avatar avatar-40 coverimg rounded-circle">
                                        <img src="assets/img/modern-ai-image/user-2.jpg" alt="" />
                                    </div>
                                    <div class="avatar avatar-40 coverimg rounded-circle">
                                        <img src="assets/img/modern-ai-image/user-4.jpg" alt="" />
                                    </div>
                                </div>
                                <div class="col">
                                    <p class="text-secondary small mb-0">5 more</p>
                                    <p class="small">Working</p>
                                </div>
                                <div class="col-auto">
                                    <button class="btn btn-square btn-link">
                                        <i class="bi bi-person-plus "></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="col-12 col-md-6 col-lg-6 col-xl-3 mb-4">
                    <div class="card adminuiux-card bg-l-gradient-light theme-green h-100">
                        <div class="card-header bg-none">
                            <div class="row gx-3 align-items-center">
                                <div class="col">
                                    <p class="small text-secondary mb-1">Due Date</p>
                                    <p>30/06/2022</p>
                                </div>
                            </div>
                        </div>
                        <div class="card-body">
                            <h5 class="text-center mb-1">Web Services</h5>
                            <p class="text-secondary text-center mb-3">Down the line</p>
                            <div class="progress height-dynamic mb-2 bg-theme-1-subtle text-theme-1" style="--h-dynamic: 5px">
                                <div class="progress-bar bg-theme-1" role="progressbar" style="width: 30%" aria-valuenow="50" aria-valuemin="0" aria-valuemax="100"></div>
                            </div>
                            <p class="small text-secondary mb-3">Project Status <span class="float-end">30%</span></p>
                            <div class="row gx-2 align-items-center">
                                <div class="col-auto avatar-group">
                                    <div class="avatar avatar-40 coverimg rounded-circle">
                                        <img src="assets/img/modern-ai-image/user-2.jpg" alt="" />
                                    </div>
                                    <div class="avatar avatar-40 coverimg rounded-circle">
                                        <img src="assets/img/modern-ai-image/user-3.jpg" alt="" />
                                    </div>
                                </div>
                                <div class="col">
                                    <p class="text-secondary small mb-0">1 more</p>
                                    <p class="small">Working</p>
                                </div>
                                <div class="col-auto">
                                    <button class="btn btn-square btn-link">
                                        <i class="bi bi-person-plus "></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="col-12 col-md-6 col-lg-6 col-xl-3 mb-4">
                    <div class="card adminuiux-card bg-l-gradient-light theme-pink h-100">
                        <div class="card-header bg-none">
                            <div class="row gx-3 align-items-center">
                                <div class="col">
                                    <p class="small text-secondary mb-1">Due Date</p>
                                    <p>12/07/2022</p>
                                </div>
                            </div>
                        </div>
                        <div class="card-body">
                            <h5 class="text-center mb-1">QA Support</h5>
                            <p class="text-secondary text-center mb-3">On the Track</p>
                            <div class="progress height-dynamic mb-2 bg-theme-1-subtle text-theme-1" style="--h-dynamic: 5px">
                                <div class="progress-bar bg-theme-1" role="progressbar" style="width: 65%" aria-valuenow="50" aria-valuemin="0" aria-valuemax="100"></div>
                            </div>
                            <p class="small text-secondary mb-3">Project Status <span class="float-end">65%</span></p>
                            <div class="row gx-2 align-items-center">
                                <div class="col-auto avatar-group">
                                    <div class="avatar avatar-40 coverimg rounded-circle">
                                        <img src="assets/img/modern-ai-image/user-1.jpg" alt="" />
                                    </div>
                                    <div class="avatar avatar-40 coverimg rounded-circle">
                                        <img src="assets/img/modern-ai-image/user-3.jpg" alt="" />
                                    </div>
                                </div>
                                <div class="col">
                                    <p class="text-secondary small mb-0">2 more</p>
                                    <p class="small">Working</p>
                                </div>
                                <div class="col-auto">
                                    <button class="btn btn-square btn-link">
                                        <i class="bi bi-person-plus "></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="row mb-3 mb-4">
                <div class="col text-center py-3">
                    <h4>Don't let poor communication <span class="text-gradient">manipulate progress</span>, while you can track it better</h4>
                    <p class="text-secondary">Manage task an update status. Add comment and assign tester. Get approval after complete release. Move ahead.</p>
                </div>
            </div>

            <!-- project progress list -->
            <div class="row gx-3 gx-lg-4">
                <div class="col-12 col-md-4 col-lg-3 mb-3">
                    <div class="row gx-3 align-items-center mb-3">
                        <div class="col-auto">
                            <div class="avatar avatar-40 bg-theme-1 theme-yellow text-white rounded">
                                <i class="bi bi-list-task h5"></i>
                            </div>
                        </div>
                        <div class="col">
                            <h6 class="mb-0">To-Do list</h6>
                            <p class="text-secondary small">Pickup a task</p>
                        </div>
                        <div class="col-auto">
                            <div class="dropdown d-inline-block">
                                <a class="btn btn-square btn-link no-caret dropdown-toggle" data-bs-toggle="dropdown" aria-expanded="false" data-bs-display="static" role="button">
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
                    <div id="todocolumn" #todo class="dragzonecard">
                        <div class="card adminuiux-card mb-3 mb-lg-4" id="todocolumnone">
                            <div class="card-body">
                                <div class="row gx-2 align-items-center mb-3">
                                    <div class="col">
                                        <p class="text-secondary small">10:45 am | 3 hrs</p>
                                        <h6>Signup Payment</h6>
                                        <p class="text-secondary small mb-3">Create Sign up flow with payment scheduling. Must have bank details.</p>
                                        <span class="badge badge-light text-bg-theme-1 theme-red">UIUX</span>
                                        <span class="badge badge-light text-bg-theme-1 theme-green">Prototype</span>
                                    </div>
                                </div>
                                <div class="row gx-2 align-items-center">
                                    <div class="col">
                                        <div class="avatar avatar-30 coverimg rounded-circle me-1" data-bs-toggle="tooltip" title="Dhanitara">
                                            <img src="assets/img/modern-ai-image/user-2.jpg" alt="" />
                                        </div>
                                        <div class="avatar avatar-30 coverimg rounded-circle me-1" data-bs-toggle="tooltip" title="Shrivalli">
                                            <img src="assets/img/modern-ai-image/user-3.jpg" alt="" />
                                        </div>
                                        <div class="avatar avatar-30 bg-theme-1-subtle text-theme-1 rounded-circle me-1">
                                            <p class="small">2+</p>
                                        </div>
                                    </div>
                                    <div class="col-auto">
                                        <button class="btn btn-link btn-square theme-grey">
                                            <i class="bi bi-paperclip"></i>
                                        </button>
                                        <button class="btn btn-link btn-square">
                                            <i class="bi bi-chat-right-dots"></i>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="card adminuiux-card bg-l-gradient-light text-theme-1 theme-yellow mb-3 mb-lg-4">
                            <div class="card-body">These cards in columns are draggable to another column.</div>
                        </div>
                        <div class="card adminuiux-card mb-3 mb-lg-4">
                            <div class="card-body">
                                <div class="row gx-2 align-items-center mb-3">
                                    <div class="col">
                                        <p class="text-secondary small">9:30 am | 5 hrs</p>
                                        <h6>Searchbar Header</h6>
                                        <p class="text-secondary small mb-3">Get the tabbed categories result and clubbed result in main tab.</p>
                                        <div class="coverimg rounded height-110 overflow-hidden mb-3">
                                            <img src="assets/img/modern-ai-image/user-7.jpg" class="w-100" alt="" />
                                        </div>
                                        <span class="badge badge-light text-bg-theme-1 theme-blue">Code</span>
                                        <span class="badge badge-light text-bg-theme-1 theme-pink">Development</span>
                                    </div>
                                </div>
                                <div class="row gx-2 align-items-center">
                                    <div class="col">
                                        <div class="avatar avatar-30 coverimg rounded-circle me-1" data-bs-toggle="tooltip" title="Dhanitara">
                                            <img src="assets/img/modern-ai-image/user-2.jpg" alt="" />
                                        </div>
                                        <div class="avatar avatar-30 coverimg rounded-circle me-1" data-bs-toggle="tooltip" title="Shrivalli">
                                            <img src="assets/img/modern-ai-image/user-3.jpg" alt="" />
                                        </div>
                                        <div class="avatar avatar-30 bg-theme-1-subtle text-theme-1 rounded-circle me-1">
                                            <p class="small">2+</p>
                                        </div>
                                    </div>
                                    <div class="col-auto">
                                        <button class="btn btn-link btn-square theme-grey">
                                            <i class="bi bi-paperclip"></i>
                                        </button>
                                        <button class="btn btn-link btn-square">
                                            <i class="bi bi-chat-right-dots"></i>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="col-12 col-md-4 col-lg-3 mb-3">
                    <div class="row gx-3 align-items-center mb-3">
                        <div class="col-auto">
                            <div class="avatar avatar-40 bg-blue text-white rounded">
                                <i class="bi bi-clock h5"></i>
                            </div>
                        </div>
                        <div class="col">
                            <h6 class="mb-0">In-Progress</h6>
                            <p class="text-secondary small">Working on tasks</p>
                        </div>
                        <div class="col-auto">
                            <div class="dropdown d-inline-block">
                                <a class="btn btn-square btn-link no-caret dropdown-toggle" data-bs-toggle="dropdown" aria-expanded="false" data-bs-display="static" role="button">
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
                    <div id="inprogresscolumn" #progress class="dragzonecard">
                        <div class="card adminuiux-card mb-3 mb-lg-4" id="todocolumntwo">
                            <div class="card-body">
                                <div class="row gx-2 align-items-center mb-3">
                                    <div class="col">
                                        <p class="text-secondary small">2:30 pm | 3 hrs</p>
                                        <h6>Cart Product</h6>
                                        <p class="text-secondary small mb-3">Create cart and product add list flow.</p>
                                        <span class="badge badge-light text-bg-theme-1 theme-pink">Development</span>
                                        <span class="badge badge-light text-bg-theme-1 theme-cyan">Testing</span>
                                    </div>
                                </div>

                                <div class="row gx-2 align-items-center">
                                    <div class="col">
                                        <div class="avatar avatar-30 coverimg rounded-circle me-1" data-bs-toggle="tooltip" title="AdminUIUX">
                                            <img src="assets/img/modern-ai-image/user-1.jpg" alt="" />
                                        </div>
                                        <div class="avatar avatar-30 coverimg rounded-circle me-1" data-bs-toggle="tooltip" title="Danish">
                                            <img src="assets/img/modern-ai-image/user-4.jpg" alt="" />
                                        </div>
                                    </div>
                                    <div class="col-auto">
                                        <button class="btn btn-link btn-square theme-grey">
                                            <i class="bi bi-paperclip"></i>
                                        </button>
                                        <button class="btn btn-link btn-square">
                                            <i class="bi bi-chat-right-dots"></i>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="card adminuiux-card mb-3 mb-lg-4" id="todocolumnthree">
                            <div class="card-body">
                                <div class="row gx-2 align-items-center mb-3">
                                    <div class="col">
                                        <p class="text-secondary small">9:30 am | 5 hrs</p>
                                        <h6>Signin</h6>
                                        <p class="text-secondary small mb-3">Create Sign in flow with forget password. Validation and Resend OTP flow consider.</p>
                                        <span class="badge badge-light text-bg-theme-1 theme-red">UIUX</span>
                                        <span class="badge badge-light text-bg-theme-1 theme-green">Prototype</span>
                                    </div>
                                </div>
                                <div class="row gx-2 align-items-center">
                                    <div class="col">
                                        <div class="avatar avatar-30 coverimg rounded-circle me-1" data-bs-toggle="tooltip" title="Dhanitara">
                                            <img src="assets/img/modern-ai-image/user-2.jpg" alt="" />
                                        </div>
                                        <div class="avatar avatar-30 coverimg rounded-circle me-1" data-bs-toggle="tooltip" title="Shrivalli">
                                            <img src="assets/img/modern-ai-image/user-3.jpg" alt="" />
                                        </div>
                                        <div class="avatar avatar-30 bg-theme-1-subtle text-theme-1 rounded-circle me-1">
                                            <p class="small">2+</p>
                                        </div>
                                    </div>
                                    <div class="col-auto">
                                        <button class="btn btn-link btn-square theme-grey">
                                            <i class="bi bi-paperclip"></i>
                                        </button>
                                        <button class="btn btn-link btn-square">
                                            <i class="bi bi-chat-right-dots"></i>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="col-12 col-md-4 col-lg-3 mb-3">
                    <div class="row gx-3 align-items-center mb-3">
                        <div class="col-auto">
                            <div class="avatar avatar-40 bg-green text-white rounded">
                                <i class="bi bi-clipboard-check h5"></i>
                            </div>
                        </div>
                        <div class="col">
                            <h6 class="mb-0">Completed</h6>
                            <p class="text-secondary small">Under QA review</p>
                        </div>
                        <div class="col-auto">
                            <div class="dropdown d-inline-block">
                                <a class="btn btn-square btn-link no-caret dropdown-toggle" data-bs-toggle="dropdown" aria-expanded="false" data-bs-display="static" role="button">
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
                    <div id="completedcolumn" #completed class="dragzonecard">
                        <div class="card adminuiux-card mb-3 mb-lg-4">
                            <div class="card-body">
                                <div class="row gx-2 align-items-center mb-3">
                                    <div class="col">
                                        <p class="text-secondary small">1:00 am | 2 hrs</p>
                                        <h6>Menu Access</h6>
                                        <p class="text-secondary small mb-3">Menu and router link work. Classis view of menu colored menu with style selection should be there.</p>
                                        <div class="coverimg rounded height-110 overflow-hidden mb-3">
                                            <img src="assets/img/modern-ai-image/user-5.jpg" class="w-100" alt="" />
                                        </div>
                                        <span class="badge badge-light text-bg-theme-1 theme-blue">Code</span>
                                        <span class="badge badge-light text-bg-theme-1 theme-pink">Development</span>
                                    </div>
                                </div>
                                <div class="row gx-2 align-items-center">
                                    <div class="col">
                                        <div class="avatar avatar-30 coverimg rounded-circle me-1" data-bs-toggle="tooltip" title="Dhanitara">
                                            <img src="assets/img/modern-ai-image/user-2.jpg" alt="" />
                                        </div>
                                        <div class="avatar avatar-30 coverimg rounded-circle me-1" data-bs-toggle="tooltip" title="Shrivalli">
                                            <img src="assets/img/modern-ai-image/user-3.jpg" alt="" />
                                        </div>
                                        <div class="avatar avatar-30 bg-theme-1-subtle text-theme-1 rounded-circle me-1">
                                            <p class="small">2+</p>
                                        </div>
                                    </div>
                                    <div class="col-auto">
                                        <button class="btn btn-link btn-square theme-grey">
                                            <i class="bi bi-paperclip"></i>
                                        </button>
                                        <button class="btn btn-link btn-square">
                                            <i class="bi bi-chat-right-dots"></i>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="card adminuiux-card mb-3 mb-lg-4" id="todocolumnfour">
                            <div class="card-body">
                                <div class="row gx-2 align-items-center mb-3">
                                    <div class="col">
                                        <p class="text-secondary small">10:00 am | 6 hrs</p>
                                        <h6>Favorite Items</h6>
                                        <p class="text-secondary small mb-3">Favorite items in the list and in the cart. Wishlist item till user choose it to be remove from wishlist. Connection wishlist items show.</p>
                                        <span class="badge badge-light text-bg-theme-1 theme-yellow">Requirement</span>
                                        <span class="badge badge-light text-bg-theme-1 theme-purple">Sales</span>
                                    </div>
                                </div>
                                <div class="row gx-2 align-items-center">
                                    <div class="col">
                                        <div class="avatar avatar-30 coverimg rounded-circle me-1" data-bs-toggle="tooltip" title="AdminUIUX">
                                            <img src="assets/img/modern-ai-image/user-1.jpg" alt="" />
                                        </div>
                                    </div>
                                    <div class="col-auto">
                                        <button class="btn btn-link btn-square theme-grey">
                                            <i class="bi bi-paperclip"></i>
                                        </button>
                                        <button class="btn btn-link btn-square">
                                            <i class="bi bi-chat-right-dots"></i>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="col-12 col-md-4 col-lg-3 mb-3">
                    <div class="row gx-3 align-items-center mb-3">
                        <div class="col-auto">
                            <div class="avatar avatar-40 bg-pink text-white rounded">
                                <i class="bi bi-server h5"></i>
                            </div>
                        </div>
                        <div class="col">
                            <h6 class="mb-0">Approved</h6>
                            <p class="text-secondary small">Reay for Publish</p>
                        </div>
                        <div class="col-auto">
                            <div class="dropdown d-inline-block">
                                <a class="btn btn-square btn-link no-caret dropdown-toggle" data-bs-toggle="dropdown" aria-expanded="false" data-bs-display="static" role="button">
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
                    <div id="approvedcolumn" #approved class="dragzonecard">
                        <div class="card adminuiux-card mb-3 mb-lg-4" id="todocolumn2">
                            <div class="card-body">
                                <div class="row gx-2 align-items-center mb-3">
                                    <div class="col">
                                        <p class="text-secondary small">9:30 am | 5 hrs</p>
                                        <h6>Landing page and Loader</h6>
                                        <p class="text-secondary small mb-3">Landing page and Loader design based on logo. There will be best combinations of colors and styles.</p>
                                        <span class="badge badge-light text-bg-theme-1 theme-red">UIUX</span>
                                        <span class="badge badge-light text-bg-theme-1 theme-green">Prototype</span>
                                    </div>
                                </div>

                                <div class="row gx-2 align-items-center">
                                    <div class="col">
                                        <div class="avatar avatar-30 coverimg rounded-circle me-1" data-bs-toggle="tooltip" title="Dhanitara">
                                            <img src="assets/img/modern-ai-image/user-2.jpg" alt="" />
                                        </div>
                                        <div class="avatar avatar-30 coverimg rounded-circle me-1" data-bs-toggle="tooltip" title="Shrivalli">
                                            <img src="assets/img/modern-ai-image/user-3.jpg" alt="" />
                                        </div>
                                        <div class="avatar avatar-30 bg-theme-1-subtle text-theme-1 rounded-circle me-1">
                                            <p class="small">2+</p>
                                        </div>
                                    </div>
                                    <div class="col-auto">
                                        <button class="btn btn-link btn-square theme-grey">
                                            <i class="bi bi-paperclip"></i>
                                        </button>
                                        <button class="btn btn-link btn-square">
                                            <i class="bi bi-chat-right-dots"></i>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="card adminuiux-card mb-3 mb-lg-4" id="todocolumnfive">
                            <div class="card-body">
                                <div class="row gx-2 align-items-center mb-3">
                                    <div class="col">
                                        <p class="text-secondary small">10:00 am | 6 hrs</p>
                                        <h6>Prototype user flow</h6>
                                        <p class="text-secondary small mb-3">Create and get the approval for userflow. Provide it to tester to create initial use-cases. Business development team reiterate and provide gaps information.</p>
                                        <span class="badge badge-light text-bg-theme-1 theme-red">UIUX</span>
                                        <span class="badge badge-light text-bg-theme-1 theme-green">Prototype</span>
                                    </div>
                                </div>
                                <div class="row gx-2 align-items-center">
                                    <div class="col">
                                        <div class="avatar avatar-30 coverimg rounded-circle me-1" data-bs-toggle="tooltip" title="Dhanitara">
                                            <img src="assets/img/modern-ai-image/user-2.jpg" alt="" />
                                        </div>
                                        <div class="avatar avatar-30 coverimg rounded-circle me-1" data-bs-toggle="tooltip" title="Shrivalli">
                                            <img src="assets/img/modern-ai-image/user-3.jpg" alt="" />
                                        </div>
                                        <div class="avatar avatar-30 bg-theme-1-subtle text-theme-1 rounded-circle me-1">
                                            <p class="small">2+</p>
                                        </div>
                                    </div>
                                    <div class="col-auto">
                                        <button class="btn btn-link btn-square theme-grey">
                                            <i class="bi bi-paperclip"></i>
                                        </button>
                                        <button class="btn btn-link btn-square">
                                            <i class="bi bi-chat-right-dots"></i>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- tasks and schedules -->
            <div class="row gx-3 gx-lg-4">
                <div class="col-12 col-md-6 col-lg-6 col-xl-4 col-xxl-3">
                    <div class="card adminuiux-card mb-3 mb-lg-4">
                        <div class="card-header">
                            <div class="row gx-3 align-items-center">
                                <div class=" col-auto">
                                    <i class="bi bi-list-task h5 avatar avatar-40 bg-theme-1-subtle text-theme-1 theme-green rounded"></i>
                                </div>
                                <div class="col">
                                    <h6 class="mb-0">Task list</h6>
                                    <p class="text-secondary small">Do your best</p>
                                </div>
                            </div>
                        </div>
                        <div class="card-body p-0 height-dynamic border-top overflow-y-auto" style="--h-dynamic: 290px">
                            <ul class="list-group list-group-flush bg-none">
                                <li class="list-group-item">
                                    <div class="row gx-3 text-secondary">
                                        <div class="col-auto"><input class="form-check-input" type="checkbox" value="" aria-label="..." checked /></div>
                                        <div class="col">
                                            <h6 class="mb-1"><s>Daily Meeting</s></h6>
                                            <p class="text-secondary small">9:30 am, Finance Management Project</p>
                                        </div>
                                        <div class="col-auto"><i class="bi bi-heart text-red"></i></div>
                                    </div>
                                </li>
                                <li class="list-group-item">
                                    <div class="row gx-3 text-secondary">
                                        <div class="col-auto"><input class="form-check-input" type="checkbox" value="" aria-label="..." checked /></div>
                                        <div class="col">
                                            <h6 class="mb-1"><s>New Project Lineup</s></h6>
                                            <p class="text-secondary small">11:00 am</p>
                                        </div>
                                        <div class="col-auto avatar-group">
                                            <div class="avatar avatar-30 coverimg rounded-circle me-1" data-bs-toggle="tooltip" title="Dhanitara">
                                                <img src="assets/img/modern-ai-image/user-2.jpg" alt="" />
                                            </div>
                                            <div class="avatar avatar-30 coverimg rounded-circle me-1" data-bs-toggle="tooltip" title="Shrivalli">
                                                <img src="assets/img/modern-ai-image/user-3.jpg" alt="" />
                                            </div>
                                        </div>
                                    </div>
                                </li>
                                <li class="list-group-item">
                                    <div class="row gx-3">
                                        <div class="col-auto"><input class="form-check-input" type="checkbox" value="" aria-label="..." /></div>
                                        <div class="col">
                                            <h6 class="mb-1">Meeting with John</h6>
                                            <p class="text-secondary small">12:15 pm, Task allocation issue and Backlog</p>
                                        </div>
                                        <div class="col-auto"><i class="bi bi-star text-yellow"></i></div>
                                    </div>
                                </li>
                                <li class="list-group-item">
                                    <div class="row gx-3">
                                        <div class="col-auto"><input class="form-check-input" type="checkbox" value="" aria-label="..." /></div>
                                        <div class="col">
                                            <h6 class="mb-1">Release Meeting SMM</h6>
                                            <p class="text-secondary small">11:30 am 11 Dec 2021, All team together</p>
                                        </div>
                                        <div class="col-auto avatar-group">
                                            <div class="avatar avatar-30 coverimg rounded-circle me-1" data-bs-toggle="tooltip" title="Michel Jordan">
                                                <img src="assets/img/modern-ai-image/user-4.jpg" alt="" />
                                            </div>
                                        </div>
                                    </div>
                                </li>
                                <li class="list-group-item">
                                    <div class="row gx-3">
                                        <div class="col-auto"><input class="form-check-input" type="checkbox" value="" aria-label="..." /></div>
                                        <div class="col">
                                            <h6 class="mb-1">Mentor Junior developer</h6>
                                            <p class="text-secondary small">6:10 pm, Process of communications</p>
                                        </div>
                                        <div class="col-auto"><i class="bi bi-star opacity-3"></i></div>
                                    </div>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
                <!-- project overview-->
                <div class="col-12 col-md-6 col-lg-6 col-xl-4 col-xxl-6">
                    <div class="card adminuiux-card mb-3 mb-lg-4">
                        <div class="card-header">
                            <div class="row gx-3 align-items-center">
                                <div class="col-auto">
                                    <span class="avatar avatar-40 rounded mb-0 coverimg">
                                        <img src="assets/img/logo-512.png" alt="" />
                                    </span>
                                </div>
                                <div class="col">
                                    <h6 class="mb-0">Monitoring</h6>
                                    <p class="text-secondary small">Project status</p>
                                </div>
                            </div>
                        </div>
                        <div class="card-body">
                            <div class="row gx-3 align-items-center">
                                <div class="col-auto mb-3">
                                    <p class="text-secondary small mb-0">Team</p>
                                    <p>Omega13</p>
                                </div>
                                <div class="col mb-3 text-end">
                                    <p class=" text-secondary small mb-0">Support</p>
                                    <p>4 UI & Testter</p>
                                </div>
                            </div>

                            <div class="progress bg-theme-1-subtle text-white height-dynamic mb-1" style="--h-dynamic:5px">
                                <div class="progress-bar bg-theme-1" role="progressbar" style="width: 50%" aria-valuenow="50" aria-valuemin="0" aria-valuemax="100"></div>
                            </div>
                            <p class="small text-secondary">Project Status <span class="float-end">50%</span></p>
                            <p class="mb-3">
                                <span class="badge badge-light text-bg-theme-1 theme-green">Web App</span>
                                <span class="badge badge-light text-bg-theme-1 theme-yellow ms-1">Medium priority</span>
                            </p>

                            <div class="row gx-3 align-items-center mb-3">
                                <div class="col-auto">
                                    <div class="avatar avatar-40 coverimg rounded-circle">
                                        <img src="assets/img/modern-ai-image/user-4.jpg" alt="" />
                                    </div>
                                </div>
                                <div class="col">
                                    <p>"The work done in last sprint was awesome. Keep up the good work and prepared for the next release."</p>
                                </div>
                            </div>

                            <div class="row gx-2 align-items-center">
                                <div class="col-auto">
                                    <div class="avatar avatar-40 coverimg rounded-circle me-1">
                                        <img src="assets/img/modern-ai-image/user-2.jpg" alt="" />
                                    </div>
                                    <div class="avatar avatar-40 coverimg rounded-circle me-1">
                                        <img src="assets/img/modern-ai-image/user-3.jpg" alt="" />
                                    </div>
                                </div>
                                <div class="col">
                                    <p class="text-secondary small mb-0">Join Meeting</p>
                                    <p>On going</p>
                                </div>
                                <div class="col-auto">
                                    <button class="btn btn-square btn-link"><i class="bi bi-telephone"></i></button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-12 col-md-6 col-lg-6 col-xl-4 col-xxl-3">
                    <div class="card adminuiux-card mb-3 mb-lg-4">
                        <div class="card-body px-0 py-1">
                            <app-date-picker-inline></app-date-picker-inline>
                        </div>
                    </div>
                </div>
            </div>

            <!-- bug status blocks -->
            <div class="row gx-3 gx-lg-4">
                <div class="col-12 col-md-12 col-lg-6 col-xl-6">
                    <div class="card adminuiux-card mb-3 mb-lg-4">
                        <div class="card-header">
                            <div class="row gx-3 align-items-center">
                                <div class="col-auto">
                                    <i class="bi bi-bell h5 avatar avatar-40 bg-theme-1-subtle text-theme-1 theme-green rounded"></i>
                                </div>
                                <div class="col">
                                    <h6 class="mb-0">Bug Resolved</h6>
                                    <p class="text-secondary small">All Projects</p>
                                </div>
                            </div>
                        </div>
                        <div class="card-body">
                            <div class="row gx-3 align-items-center mb-4">
                                <div class="col-auto">
                                    <div class="avatar avatar-120 position-relative">
                                        <div class="avatar avatar-100 position-absolute start-50 top-50 translate-middle text-center">
                                            <div class="lh-20 text-center w-100">
                                                <h6 class="mb-0">46</h6>
                                                <p class="text-secondary small">Total</p>
                                            </div>
                                        </div>
                                        <app-doughnut-chartjs-100 class="avatar avatar-100 d-block"></app-doughnut-chartjs-100>
                                    </div>
                                </div>
                                <div class="col">
                                    <p class="small text-secondary mb-2"><span class="avatar avatar-10 rounded-circle bg-theme-1 theme-red me-1"></span> 12 UI/UX</p>
                                    <p class="small text-secondary mb-2"><span class="avatar avatar-10 rounded-circle bg-theme-1 theme-yellow me-1"></span> 20 Development</p>
                                    <p class="small text-secondary mb-2"><span class="avatar avatar-10 rounded-circle bg-theme-1 theme-blue me-1"></span> 14 Business Development</p>
                                </div>
                            </div>

                            <app-bar-green-chartjs-100 class="height-150 w-100 d-block"></app-bar-green-chartjs-100>
                        </div>
                    </div>
                </div>

                <div class="col-12 col-md-12 col-lg-6 col-xl-6">
                    <div class="card adminuiux-card mb-3 mb-lg-4">
                        <div class="card-header">
                            <div class="row gx-3 align-items-center">
                                <div class="col-auto">
                                    <i class="bi bi-bell h5 avatar avatar-40 bg-theme-1-subtle text-theme-1 theme-red rounded"></i>
                                </div>
                                <div class="col">
                                    <h6 class="mb-0">Bug Raised</h6>
                                    <p class="text-secondary small">All Projects</p>
                                </div>
                            </div>
                        </div>
                        <div class="card-body">
                            <div class="row gx-3 align-items-center mb-4">
                                <div class="col-auto">
                                    <div class="avatar avatar-120 position-relative">
                                        <div class="avatar avatar-100 position-absolute start-50 top-50 translate-middle text-center">
                                            <div class="lh-20 text-center w-100">
                                                <h6 class="mb-0">56</h6>
                                                <p class="text-secondary small">Total</p>
                                            </div>
                                        </div>
                                        <app-doughnut-chartjs-100-2 class="avatar avatar-100 d-block"></app-doughnut-chartjs-100-2>
                                    </div>
                                </div>
                                <div class="col">
                                    <p class="small text-secondary mb-2"><span class="avatar avatar-10 rounded-circle bg-theme-1 theme-red me-1"></span> 14 UI/UX</p>
                                    <p class="small text-secondary mb-2"><span class="avatar avatar-10 rounded-circle bg-theme-1 theme-yellow me-1"></span> 27 Development</p>
                                    <p class="small text-secondary mb-2"><span class="avatar avatar-10 rounded-circle bg-theme-1 theme-blue me-1"></span> 15 Business Development</p>
                                </div>
                            </div>

                            <app-bar-red-chartjs-100 class="height-150 w-100 d-block"></app-bar-red-chartjs-100>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `,
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class ProjectProjectsComponent {
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

        // drag and drop
        dragula([document.querySelector("#todocolumn"), document.querySelector("#inprogresscolumn"), document.querySelector("#completedcolumn"), document.querySelector("#approvedcolumn")]);
    }
}
