import { Component, OnInit, AfterViewInit, AfterContentChecked, OnDestroy, ViewChild, ElementRef, CUSTOM_ELEMENTS_SCHEMA } from "@angular/core";
import { RouterLink } from "@angular/router";
import Choices, { ClassNames } from "choices.js";
import DataTable from "datatables.net-dt";
import "datatables.net-responsive-dt";

import { DaterangePickerRangesComponent } from "../../../components/input-fields/daterange-picker/daterange-picker-ranges.component";
import { DatePickerInlineComponent } from "../../../components/input-fields/date-picker/date-picker-inline.component";
import { DoughnutChartjs100Component } from "../../../components/charts/doughnut-chartjs-100.component";
import { BarGreenChartjs100Component } from "../../../components/charts/bar-green-chartjs-100.component";
import { BarRedChartjs100Component } from "../../../components/charts/bar-red-chartjs-100.component";
import { DoughnutChartjs1002Component } from "../../../components/charts/doughnut-chartjs-100-2.component";

@Component({
    selector: "app-project-dashboard",
    standalone: true,
    imports: [RouterLink, DaterangePickerRangesComponent, DatePickerInlineComponent, DoughnutChartjs100Component, BarGreenChartjs100Component, BarRedChartjs100Component, DoughnutChartjs1002Component],
    template: `
        <!-- page title -->
        <div class="container-fluid py-3">
            <div class="row gx-3 gx-lg-4 align-items-center page-title">
                <div class="col col-sm mb-3 mb-sm-0 order-1">
                    <h5 class="mb-0">Project Dashboard</h5>
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
                    <li class="breadcrumb-item bi active" aria-current="page">Projects</li>
                </ol>
            </nav>
        </div>

        <!-- content -->
        <div class="container mt-3" id="main-content">
            <!-- summary -->
            <div class="row gx-3 gx-lg-4">
                <div class="col-12 col-md-12 col-lg-6 col-xl-3">
                    <div class="card adminuiux-card mb-3 mb-lg-4">
                        <div class="card-body">
                            <div class="row gx-3 align-items-center">
                                <div class="col-auto">
                                    <div class="avatar avatar-50 rounded bg-theme-1">
                                        <i class="bi bi-folder2-open h5"></i>
                                    </div>
                                </div>
                                <div class="col">
                                    <p class="small text-secondary mb-1">Projects & Costs</p>
                                    <h5>6-12.54k <small>USD</small></h5>
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
                        </div>
                    </div>
                </div>
                <div class="col-12 col-md-12 col-lg-6 col-xl-3">
                    <div class="card adminuiux-card mb-3 mb-lg-4">
                        <div class="card-body">
                            <div class="row gx-3 align-items-center">
                                <div class="col-auto">
                                    <div class="avatar avatar-50 rounded bg-theme-1 theme-green">
                                        <i class="bi bi-clock h5"></i>
                                    </div>
                                </div>
                                <div class="col">
                                    <p class="small text-secondary mb-1">Efforts Allocated</p>
                                    <h5>12858</h5>
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
                        </div>
                    </div>
                </div>
                <div class="col-12 col-md-12 col-lg-6 col-xl-3">
                    <div class="card adminuiux-card mb-3 mb-lg-4">
                        <div class="card-body">
                            <div class="row gx-3 align-items-center">
                                <div class="col-auto">
                                    <div class="avatar avatar-50 rounded bg-theme-1 theme-purple">
                                        <i class="bi bi-people h5"></i>
                                    </div>
                                </div>
                                <div class="col">
                                    <p class="small text-secondary mb-1">Team Member</p>
                                    <h5>24 People</h5>
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
                        </div>
                    </div>
                </div>
                <div class="col-12 col-md-12 col-lg-6 col-xl-3">
                    <div class="card adminuiux-card mb-3 mb-lg-4">
                        <div class="card-body">
                            <div class="row gx-3 align-items-center">
                                <div class="col-auto">
                                    <div class="avatar avatar-50 rounded bg-theme-1 theme-yellow">
                                        <i class="bi bi-journal-check h5"></i>
                                    </div>
                                </div>
                                <div class="col">
                                    <p class="small text-secondary mb-1">Tasks in Progress</p>
                                    <h5>18-1204 hrs</h5>
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
                        </div>
                    </div>
                </div>
            </div>

            <!-- tasks and schedules -->
            <div class="row gx-3 gx-lg-4">
                <div class="col-12 col-md-6 col-lg-6 col-xl-4 col-xxl-3">
                    <div class="card adminuiux-card bg-theme-r-gradient text-white mb-3 mb-lg-4">
                        <div class="card-header bg-none">
                            <div class="row gx-3 align-items-center">
                                <div class="col-auto">
                                    <i class="bi bi-folder h5 avatar avatar-40 bg-white-opacity text-white rounded"></i>
                                </div>
                                <div class="col">
                                    <h6 class="mb-0">Project Progress</h6>
                                    <p class="opacity-75 small">Currently</p>
                                </div>
                            </div>
                        </div>
                        <div class="card-body">
                            <div class="row gx-3">
                                <div class="col-auto mb-3">
                                    <span class="avatar avatar-50 rounded mb-0 coverimg">
                                        <img src="assets/img/logo-pika.png" alt="" />
                                    </span>
                                </div>
                                <div class="col mb-3">
                                    <p class="mb-1">AdminUIUX.com</p>
                                    <h5 class="mb-1">2152 hrs <small class="fw-normal">(50.83%)</small></h5>
                                </div>
                            </div>
                            <div class="row gx-3 align-items-center mb-3">
                                <div class="col-auto">
                                    <span class="badge text-bg-theme-1 me-1">Mobile App</span>
                                    <span class="badge text-bg-theme-1 theme-yellow">High priority</span>
                                </div>
                            </div>
                            <div class="row gx-2 align-items-center">
                                <div class="col-auto avatar-group mb-3">
                                    <div class="avatar avatar-40 coverimg rounded-circle">
                                        <img src="assets/img/modern-ai-image/user-2.jpg" alt="" />
                                    </div>
                                    <div class="avatar avatar-40 coverimg rounded-circle">
                                        <img src="assets/img/modern-ai-image/user-3.jpg" alt="" />
                                    </div>
                                    <div class="avatar avatar-40 coverimg rounded-circle">
                                        <img src="assets/img/modern-ai-image/user-4.jpg" alt="" />
                                    </div>
                                </div>
                                <div class="col mb-3">
                                    <p class="mb-0">5 More...</p>
                                    <p class="opacity-75 small">Working</p>
                                </div>
                                <div class="col-auto mb-3">
                                    <button class="btn btn-square btn-outline-light">
                                        <i class="bi bi-person-plus "></i>
                                    </button>
                                </div>
                            </div>
                            <div class="progress height-dynamic mb-2 bg-white-opacity text-white" style="--h-dynamic:5px">
                                <div class="progress-bar bg-white" role="progressbar" style="width: 50%" aria-valuenow="50" aria-valuemin="0" aria-valuemax="100"></div>
                            </div>
                            <p class="opacity-75 small mb-3">Project Status <span class="float-end">50%</span></p>
                            <p class="badge bg-white-opacity text-white">Due date: 22 March 2022</p>
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
                                    <h6 class="mb-0">Task list</h6>
                                    <p class="text-secondary small">Do your best</p>
                                </div>
                                <div class=" col-auto">
                                    <button class="btn btn-link btn-square">
                                        <i class="bi bi-floppy"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div class="card-body p-0">
                            <ul class="list-group list-group-flush border-0 bg-none">
                                <li class="list-group-item">
                                    <div class="row text-secondary">
                                        <div class="col-auto">01</div>
                                        <div class="col"><s>Create UI design</s></div>
                                        <div class="col-auto"><input class="form-check-input" type="checkbox" value="" aria-label="..." checked /></div>
                                    </div>
                                </li>
                                <li class="list-group-item">
                                    <div class="row text-secondary">
                                        <div class="col-auto">02</div>
                                        <div class="col"><s>Create HTML Structure</s></div>
                                        <div class="col-auto"><input class="form-check-input" type="checkbox" value="" aria-label="..." checked /></div>
                                    </div>
                                </li>
                                <li class="list-group-item">
                                    <div class="row gx-3">
                                        <div class="col-auto">03</div>
                                        <div class="col">Start Development</div>
                                        <div class="col-auto"><input class="form-check-input" type="checkbox" value="" aria-label="..." /></div>
                                    </div>
                                </li>
                                <li class="list-group-item">
                                    <div class="row gx-3">
                                        <div class="col-auto">04</div>
                                        <div class="col">Customize 3rd parties</div>
                                        <div class="col-auto"><input class="form-check-input" type="checkbox" value="" aria-label="..." /></div>
                                    </div>
                                </li>
                                <li class="list-group-item">
                                    <div class="row gx-3">
                                        <div class="col-auto">05</div>
                                        <div class="col">Start reviewing</div>
                                        <div class="col-auto"><input class="form-check-input" type="checkbox" value="" aria-label="..." /></div>
                                    </div>
                                </li>
                                <li class="list-group-item">
                                    <div class="row gx-3">
                                        <div class="col-auto">06</div>
                                        <div class="col">Update Development</div>
                                        <div class="col-auto"><input class="form-check-input" type="checkbox" value="" aria-label="..." /></div>
                                    </div>
                                </li>
                                <li class="list-group-item">
                                    <div class="row gx-3">
                                        <div class="col-auto">07</div>
                                        <div class="col">Maintain project</div>
                                        <div class="col-auto"><input class="form-check-input" type="checkbox" value="" aria-label="..." /></div>
                                    </div>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
                <div class="col-12 col-md-6 col-lg-6 col-xl-4 col-xxl-3">
                    <div class="card adminuiux-card mb-3 mb-lg-4">
                        <div class="card-header bg-none">
                            <div class="row gx-3 align-items-center">
                                <div class="col-auto">
                                    <i class="bi bi-folder h5 avatar avatar-40 bg-theme-1-subtle text-theme-1 rounded"></i>
                                </div>
                                <div class="col">
                                    <h6 class="mb-0">Project Progress</h6>
                                    <p class="text-secondary small">Currently</p>
                                </div>
                            </div>
                        </div>
                        <div class="card-body">
                            <div class="row gx-3">
                                <div class="col-auto mb-3">
                                    <span class="avatar avatar-50 rounded mb-0 coverimg">
                                        <img src="assets/img/logo-512.png" alt="" />
                                    </span>
                                </div>
                                <div class="col mb-3">
                                    <p class="mb-1">getwindoors.com</p>
                                    <h5 class="mb-1">2152 hrs <small class="fw-normal">(50.83%)</small></h5>
                                </div>
                            </div>
                            <div class="row gx-3 align-items-center mb-3">
                                <div class="col-auto">
                                    <span class="badge text-bg-theme-1 me-1">Mobile App</span>
                                    <span class="badge text-bg-theme-1 theme-yellow">High priority</span>
                                </div>
                            </div>
                            <div class="row gx-2 align-items-center">
                                <div class="col-auto avatar-group mb-3">
                                    <div class="avatar avatar-40 coverimg rounded-circle">
                                        <img src="assets/img/modern-ai-image/user-2.jpg" alt="" />
                                    </div>
                                    <div class="avatar avatar-40 coverimg rounded-circle">
                                        <img src="assets/img/modern-ai-image/user-3.jpg" alt="" />
                                    </div>
                                    <div class="avatar avatar-40 coverimg rounded-circle">
                                        <img src="assets/img/modern-ai-image/user-4.jpg" alt="" />
                                    </div>
                                </div>
                                <div class="col mb-3">
                                    <p class="mb-0">5 More...</p>
                                    <p class="text-secondary small">Working</p>
                                </div>
                                <div class="col-auto mb-3">
                                    <button class="btn btn-square btn-link">
                                        <i class="bi bi-person-plus "></i>
                                    </button>
                                </div>
                            </div>
                            <div class="progress height-dynamic mb-2 bg-theme-1-subtle" style="--h-dynamic:5px">
                                <div class="progress-bar bg-theme-1" role="progressbar" style="width: 50%" aria-valuenow="50" aria-valuemin="0" aria-valuemax="100"></div>
                            </div>
                            <p class="opacity-75 small mb-3">Project Status <span class="float-end">50%</span></p>
                            <p class="badge badge-light text-bg-theme-1">Due date: 22 March 2022</p>
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

                <!-- meeting event info-->
                <div class="col-12 col-md-6 col-lg-6 col-xl-8 col-xxl-4">
                    <div class="card adminuiux-card mb-3 mb-lg-4">
                        <div class="card-body">
                            <div class="row gx-3 align-items-center mb-3">
                                <div class="col-auto">
                                    <i class="bi bi-bell h5 avatar avatar-40 bg-theme-1-subtle text-theme-1 theme-yellow rounded"></i>
                                </div>
                                <div class="col">
                                    <h6 class="mb-0">Daily Meeting</h6>
                                    <p class="text-secondary small">Finance Application</p>
                                </div>
                                <div class="col-auto">
                                    <a class="btn btn-square btn-link"><i class="bi bi-person-plus"></i></a>
                                </div>
                            </div>
                            <div class="row gx-3 align-items-center mb-3">
                                <div class="col-auto">
                                    <i class="bi bi-calendar-event h5 avatar avatar-40 bg-theme-1-subtle text-theme-1 rounded"></i>
                                </div>
                                <div class="col">
                                    <h6 class="mb-0">25-01-2021 4:15pm</h6>
                                    <p class="text-secondary small">at Greta Anthony Meeting-Room</p>
                                </div>
                            </div>
                            <div class="row gx-3 align-items-center">
                                <div class="col-auto">
                                    <div class="avatar avatar-40 coverimg rounded-circle me-1">
                                        <img src="assets/img/modern-ai-image/user-2.jpg" alt="" />
                                    </div>
                                    <div class="avatar avatar-40 coverimg rounded-circle me-1">
                                        <img src="assets/img/modern-ai-image/user-3.jpg" alt="" />
                                    </div>
                                    <div class="avatar avatar-40 coverimg rounded-circle me-1">
                                        <img src="assets/img/modern-ai-image/user-4.jpg" alt="" />
                                    </div>
                                </div>
                                <div class="col">
                                    <p class="text-secondary small mb-0">Joined</p>
                                    <p>9+</p>
                                </div>
                                <div class="col-auto">
                                    <a class="btn btn-theme btn-sm px-3">Join</a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- project status -->
                <div class="col-12 col-md-6 col-lg-6 col-xxl-4">
                    <div class="card adminuiux-card mb-3 mb-lg-4 overflow-hidden">
                        <div class="row mx-0">
                            <div class="col-auto col-xl-4 py-3 position-relative bg-theme-1">
                                <div class="coverimg position-absolute start-0 top-0 h-100 w-100 rounded">
                                    <img src="assets/img/modern-ai-image/pet-4.jpg" alt="" />
                                </div>
                                <div class="rounded p-3 d-flex align-items-center blur-overlay blur-theme h-100 rounded overflow-hidden">
                                    <div class="z-index-1 position-relative">
                                        <i class="bi bi-clock h5 mb-3 d-block"></i>
                                        <p class="opacity-75 small mb-1 mt-auto">Estimated<br />Effort</p>
                                        <h5>2542 <small>hrs</small></h5>
                                    </div>
                                </div>
                            </div>
                            <div class="col col-xl-8 px-0">
                                <div class="card-body">
                                    <div class="row gx-3 mb-4">
                                        <div class="col">
                                            <h6 class="mb-0">Frontend Team</h6>
                                            <p class="text-secondary small">Finance App UX Design</p>
                                        </div>
                                    </div>
                                    <div class="row gx-3">
                                        <div class="col mb-3">
                                            <p class="text-secondary small mb-0">Set Reminder</p>
                                            <p>2 reminders</p>
                                        </div>
                                        <div class="col-auto mb-3">
                                            <button class="btn btn-link btn-square">
                                                <i class="bi bi-chat-right-dots"></i>
                                            </button>
                                        </div>
                                    </div>
                                    <div class="progress height-dynamic mb-1 bg-theme-1-subtle text-theme-1" style="--h-dynamic:5px">
                                        <div class="progress-bar bg-theme-1" role="progressbar" style="width: 75%" aria-valuenow="75" aria-valuemin="0" aria-valuemax="100"></div>
                                    </div>
                                    <p class="small text-secondary">Project Status <span class="float-end">75%</span></p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- project status -->
                <div class="col-12 col-md-12 col-lg-6 col-xxl-4">
                    <div class="card adminuiux-card mb-3 mb-lg-4">
                        <div class="card-body">
                            <div class="row gx-3">
                                <div class="col-auto position-relative">
                                    <div class="rounded bg-theme-1 p-3 h-100 d-flex flex-column">
                                        <i class="bi bi-calendar-event h5 mb-3"></i>
                                        <p class="opacity-75 small mb-1 mt-auto">Estimated<br />Effort</p>
                                        <p>1542 <small>hrs</small></p>
                                    </div>
                                </div>
                                <div class="col align-self-center">
                                    <h6 class="mb-0">Omega13 Team</h6>
                                    <p class="text-secondary small mb-4">Social Media Monitor</p>

                                    <div class="row align-items-center gx-2">
                                        <div class="col-auto mb-3 avatar-group">
                                            <div class="avatar avatar-30 coverimg rounded-circle me-1">
                                                <img src="assets/img/modern-ai-image/user-2.jpg" alt="" />
                                            </div>
                                            <div class="avatar avatar-30 coverimg rounded-circle me-1">
                                                <img src="assets/img/modern-ai-image/user-3.jpg" alt="" />
                                            </div>
                                        </div>
                                        <div class="col mb-3">
                                            <p class="text-secondary small mb-0">Join Meeting</p>
                                            <p>On going</p>
                                        </div>
                                        <div class="col-auto mb-3">
                                            <button class="btn btn-link btn-square theme-grey">
                                                <i class="bi bi-paperclip"></i>
                                            </button>
                                            <button class="btn btn-link btn-square">
                                                <i class="bi bi-chat-right-dots"></i>
                                            </button>
                                        </div>
                                    </div>
                                    <div class="progress height-dynamic mb-1 bg-theme-1-subtle text-theme-1" style="--h-dynamic:5px">
                                        <div class="progress-bar bg-theme-1" role="progressbar" style="width: 50%" aria-valuenow="50" aria-valuemin="0" aria-valuemax="100"></div>
                                    </div>
                                    <p class="small text-secondary">Project Status <span class="float-end">50%</span></p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- project overview-->
                <div class="col-12 col-md-612 col-lg-6 col-xl-4">
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
                                <div class="col-auto mb-3"><span class="text-secondary">Task Done:</span> <b>25</b>/30</div>
                                <div class="col mb-3 text-end"><span class="text-secondary">Due Date:</span> <b>9 Dec 2021</b></div>
                            </div>
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

                            <div class="row gx-3 align-items-center">
                                <div class="col-auto">
                                    <div class="avatar avatar-40 coverimg rounded-circle">
                                        <img src="assets/img/modern-ai-image/user-4.jpg" alt="" />
                                    </div>
                                </div>
                                <div class="col">
                                    <p>"The work done in last sprint was awesome. Keep up the good work and prepared for the next release."</p>
                                </div>
                            </div>
                        </div>
                        <div class="card-footer">
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

                <div class="col-12 col-md-12 col-lg-6 col-xl-4">
                    <div class="card adminuiux-card mb-3 mb-lg-4 theme-green">
                        <div class="card-header">
                            <div class="row gx-3 align-items-center">
                                <div class="col-auto">
                                    <i class="bi bi-bell h5 avatar avatar-40 bg-theme-1-subtle text-theme-1 rounded"></i>
                                </div>
                                <div class="col">
                                    <h6 class="mb-0">Bug Resolved</h6>
                                    <p class="text-secondary small">All Projects</p>
                                </div>
                            </div>
                        </div>
                        <div class="card-body">
                            <div class="row gx-3 align-items-center mb-3 mb-lg-4">
                                <div class="col-auto">
                                    <div class="avatar avatar-120 position-relative">
                                        <div class="avatar avatar-100 position-absolute start-50 top-50 translate-middle text-center">
                                            <div class="lh-20 text-center w-100">
                                                <h6 class="mb-0">46</h6>
                                                <p class="text-secondary small">Total</p>
                                            </div>
                                        </div>
                                        <app-doughnut-chartjs-100 class="avatar avatar-120 d-block"></app-doughnut-chartjs-100>
                                    </div>
                                </div>
                                <div class="col">
                                    <p class="small text-secondary mb-2"><span class="avatar avatar-10 rounded-circle bg-theme-1 theme-red me-1"></span> 12 UI/UX</p>
                                    <p class="small text-secondary mb-2"><span class="avatar avatar-10 rounded-circle bg-theme-1 theme-yellow me-1"></span> 20 Development</p>
                                    <p class="small text-secondary mb-2"><span class="avatar avatar-10 rounded-circle bg-theme-1 theme-blue me-1"></span> 14 Business Development</p>
                                </div>
                            </div>

                            <app-bar-green-chartjs-100 class="height-180 d-block w-100" id="mediumchartgreen1"></app-bar-green-chartjs-100>
                        </div>
                    </div>
                </div>

                <div class="col-12 col-md-12 col-lg-6 col-xl-4">
                    <div class="card adminuiux-card mb-3 mb-lg-4 theme-red">
                        <div class="card-header">
                            <div class="row gx-3 align-items-center">
                                <div class="col-auto">
                                    <i class="bi bi-bell h5 avatar avatar-40 bg-theme-1-subtle text-theme-1 rounded"></i>
                                </div>
                                <div class="col">
                                    <h6 class="mb-0">Bug Raised</h6>
                                    <p class="text-secondary small">All Projects</p>
                                </div>
                            </div>
                        </div>
                        <div class="card-body">
                            <div class="row gx-3 align-items-center mb-3 mb-lg-4">
                                <div class="col-auto">
                                    <div class="avatar avatar-120 position-relative">
                                        <div class="avatar avatar-100 position-absolute start-50 top-50 translate-middle text-center">
                                            <div class="lh-20 text-center w-100">
                                                <h6 class="mb-0">46</h6>
                                                <p class="text-secondary small">Total</p>
                                            </div>
                                        </div>
                                        <app-doughnut-chartjs-100-2 class="avatar avatar-120 d-block"></app-doughnut-chartjs-100-2>
                                    </div>
                                </div>
                                <div class="col">
                                    <p class="small text-secondary mb-2"><span class="avatar avatar-10 rounded-circle bg-theme-1 theme-red me-1"></span> 12 UI/UX</p>
                                    <p class="small text-secondary mb-2"><span class="avatar avatar-10 rounded-circle bg-theme-1 theme-yellow me-1"></span> 20 Development</p>
                                    <p class="small text-secondary mb-2"><span class="avatar avatar-10 rounded-circle bg-theme-1 theme-blue me-1"></span> 14 Business Development</p>
                                </div>
                            </div>

                            <app-bar-red-chartjs-100 class="height-180 d-block w-100" id="mediumchartgreen1"></app-bar-red-chartjs-100>
                        </div>
                    </div>
                </div>
            </div>

            <div class="row mb-3 mb-lg-4">
                <div class="col text-center py-3">
                    <h4>Keep track on project & <span class="text-gradient">Keep customer relationship</span> best & beautiful</h4>
                    <p class="text-secondary">Tasks, progress, bugs and delivery all together should go in positive direction to maintain customer relationship.</p>
                </div>
            </div>

            <!-- current projects summary -->
            <div class="row gx-3 gx-lg-4">
                <!-- project progress -->
                <div class="col-12 col-md-6 col-lg-3">
                    <div class="card adminuiux-card mb-3 mb-lg-4">
                        <div class="card-header">
                            <div class="row gx-3 align-items-center">
                                <div class="col">
                                    <h6 class="mb-0">Divine soul apps</h6>
                                    <p class="small text-secondary">Business Development Phase</p>
                                </div>
                            </div>
                        </div>
                        <div class="card-body">
                            <figure class="height-150 w-100 mb-0 coverimg rounded mb-3">
                                <img src="assets/img/modern-ai-image/PET-2.jpg" alt="" class="w-100" />
                            </figure>

                            <div class="row gx-3 align-items-center mb-3">
                                <div class="col">
                                    <h5 class="mb-0">750hrs</h5>
                                    <p class="small">
                                        5hrs <span class="text-green"><i class="bi bi-caret-up-fill me-1"></i>3.15%</span>
                                    </p>
                                </div>
                                <div class="col-auto">
                                    <div class="avatar avatar-50 rounded-circle">
                                        <div id="circleprogressblue1"></div>
                                    </div>
                                </div>
                            </div>
                            <span class="badge badge-light text-bg-theme-1">Due date: 21 September 2022</span>
                        </div>
                    </div>
                </div>

                <!-- project progress -->
                <div class="col-12 col-md-6 col-lg-3">
                    <div class="card adminuiux-card mb-3 mb-lg-4">
                        <div class="card-header">
                            <div class="row gx-3 align-items-center">
                                <div class="col">
                                    <h6 class="mb-0">Kitchen World app</h6>
                                    <p class="small text-secondary">Design Phase</p>
                                </div>
                            </div>
                        </div>
                        <div class="card-body">
                            <figure class="height-150 w-100 mb-0 coverimg rounded mb-3">
                                <img src="assets/img/modern-ai-image/user-1.jpg" alt="" class="w-100" />
                            </figure>

                            <div class="row gx-3 align-items-center mb-3">
                                <div class="col">
                                    <h5 class="mb-0">320hrs</h5>
                                    <p class="small">
                                        25hrs <span class="text-green"><i class="bi bi-caret-up-fill me-1"></i>3.15%</span>
                                    </p>
                                </div>
                                <div class="col-auto">
                                    <div class="avatar avatar-50 rounded-circle">
                                        <div id="circleprogressgreen1"></div>
                                    </div>
                                </div>
                            </div>
                            <span class="badge badge-light text-bg-theme-1">Due date: 15 August 2022</span>
                        </div>
                    </div>
                </div>

                <!-- project progress -->
                <div class="col-12 col-md-6 col-lg-3">
                    <div class="card adminuiux-card mb-3 mb-lg-4">
                        <div class="card-header">
                            <div class="row gx-3 align-items-center">
                                <div class="col">
                                    <h6 class="mb-0">AutoD-vine App</h6>
                                    <p class="small text-secondary">Under Maintenance</p>
                                </div>
                            </div>
                        </div>
                        <div class="card-body">
                            <figure class="height-150 w-100 mb-0 coverimg rounded mb-3">
                                <img src="assets/img/modern-ai-image/user-7.jpg" alt="" class="w-100" />
                            </figure>

                            <div class="row gx-3 align-items-center mb-3">
                                <div class="col">
                                    <h5 class="mb-0">1524hrs</h5>
                                    <p class="small">
                                        124hrs <span class="text-danger"><i class="bi bi-caret-down-fill me-1"></i>4.13%</span>
                                    </p>
                                </div>
                                <div class="col-auto">
                                    <div class="avatar avatar-50 rounded-circle">
                                        <div id="circleprogressyellow1"></div>
                                    </div>
                                </div>
                            </div>
                            <span class="badge badge-light text-bg-theme-1">Due date: 14 June 2022</span>
                        </div>
                    </div>
                </div>

                <!-- project progress -->
                <div class="col-12 col-md-6 col-lg-3">
                    <div class="card adminuiux-card mb-3 mb-lg-4">
                        <div class="card-header">
                            <div class="row gx-3 align-items-center">
                                <div class="col">
                                    <h6 class="mb-0">Referral Earnings</h6>
                                    <p class="small text-secondary">Sales come from referral</p>
                                </div>
                            </div>
                        </div>
                        <div class="card-body">
                            <figure class="height-150 w-100 mb-0 coverimg rounded mb-3">
                                <img src="assets/img/modern-ai-image/user-3.jpg" alt="" class=" w-100" />
                            </figure>

                            <div class="row gx-3 align-items-center mb-3">
                                <div class="col">
                                    <h5 class="mb-0">2510 <small class="h6">USD</small></h5>
                                    <p class="small">
                                        530.00 <span class="text-green"><i class="bi bi-caret-up-fill me-1"></i>4.15%</span>
                                    </p>
                                </div>
                                <div class="col-auto">
                                    <div class="avatar avatar-50 rounded-circle">
                                        <div id="circleprogressred1"></div>
                                    </div>
                                </div>
                            </div>
                            <span class="badge badge-light text-bg-theme-1 theme-yellow">Till date: 10 February 2022</span>
                        </div>
                    </div>
                </div>
            </div>

            <div class="row gx-3">
                <!-- timesheet -->
                <div class="col-12 col-md-12 position-relative">
                    <div class="card adminuiux-card mb-3 mb-lg-4">
                        <div class="card-header">
                            <div class="row gx-3">
                                <div class="col-auto">
                                    <i class="bi bi-clock h5 avatar avatar-40 bg-theme-1-subtle text-theme-1 rounded"></i>
                                </div>
                                <div class="col-auto align-self-center">
                                    <h6 class="mb-0">Timesheet Submitted</h6>
                                    <p class="text-secondary small">Logged time by user</p>
                                </div>
                                <div class="col-auto ms-auto">
                                    <div class="input-group ">
                                        <span class="input-group-text text-theme-1"><i class="bi bi-search"></i></span>
                                        <input type="text" class="form-control" placeholder="Search..." />
                                    </div>
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
                        </div>
                        <div class="card-body py-0">
                            <table class="table" id="dataTable">
                                <thead>
                                    <tr>
                                        <th class="all">Project</th>
                                        <th class="desktop">Date/Time</th>
                                        <th class="tablet desktop">Effort</th>
                                        <th class="desktop">Approved by</th>
                                        <th class="desktop">Approved Date</th>
                                        <th class="tablet desktop">Task</th>
                                        <th class="all">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td>
                                            <div class="row gx-3 align-items-center">
                                                <div class="col-auto">
                                                    <figure class="avatar avatar-50 border mb-0 coverimg rounded">
                                                        <img src="assets/img/modern-ai-image/pet-1.jpg" alt="" class="w-100" />
                                                    </figure>
                                                </div>
                                                <div class="col">
                                                    <p class="mb-0">Divine soul apps</p>
                                                    <p class="text-secondary small mb-1">Requirement Understanding</p>
                                                    <p class="text-secondary small">By <a href="">Avnit Preet</a></p>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <p class="mb-0">20-1-2022</p>
                                            <p class="text-secondary small">9:00 am</p>
                                        </td>
                                        <td>
                                            <p class="mb-0">5.00</p>
                                            <p class="text-secondary small">hours</p>
                                        </td>
                                        <td>
                                            <p class="mb-0">John Johnson</p>
                                            <p class="text-secondary small">john&#64;gmailtestid.com</p>
                                        </td>
                                        <td>
                                            <p class="mb-0">20-1-2022</p>
                                            <p class="text-secondary small">9:00 am</p>
                                        </td>
                                        <td>
                                            <span class="badge badge-sm bg-green">Completed</span>
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
                                        <td>
                                            <div class="row gx-3 align-items-center">
                                                <div class="col-auto">
                                                    <figure class="avatar avatar-50 border mb-0 coverimg rounded">
                                                        <img src="assets/img/modern-ai-image/kids-6.jpg" alt="" />
                                                    </figure>
                                                </div>
                                                <div class="col">
                                                    <p class="mb-0">Kitchen World app</p>
                                                    <p class="text-secondary small mb-1">UI Design for Home page</p>
                                                    <p class="text-secondary small">By <a href="">Maria Carlos</a></p>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <p class="mb-0">20-1-2022</p>
                                            <p class="text-secondary small">9:00 am</p>
                                        </td>
                                        <td>
                                            <p class="mb-0">7.30</p>
                                            <p class="text-secondary small">hours</p>
                                        </td>
                                        <td>
                                            <p class="mb-0">Mirae Jackson</p>
                                            <p class="text-secondary small">mirae&#64;gmailtestid.com</p>
                                        </td>
                                        <td>
                                            <p class="mb-0">20-1-2022</p>
                                            <p class="text-secondary small">10:05 am</p>
                                        </td>
                                        <td>
                                            <span class="badge badge-sm bg-green">Completed</span>
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
                                        <td>
                                            <div class="row gx-3 align-items-center">
                                                <div class="col-auto">
                                                    <figure class="avatar avatar-50 border mb-0 coverimg rounded">
                                                        <img src="assets/img/modern-ai-image/user-7.jpg" alt="" />
                                                    </figure>
                                                </div>
                                                <div class="col">
                                                    <p class="mb-0">AutoD-vine App</p>
                                                    <p class="text-secondary small mb-1">Data updates for release</p>
                                                    <p class="text-secondary small">By <a href="">Steve Brandan</a></p>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <p class="mb-0">20-1-2022</p>
                                            <p class="text-secondary small">9:00 am</p>
                                        </td>
                                        <td>
                                            <p class="mb-0">9.30</p>
                                            <p class="text-secondary small">hours</p>
                                        </td>
                                        <td>
                                            <p class="mb-0">Millie Danial</p>
                                            <p class="text-secondary small">millie&#64;gmailtestid.com</p>
                                        </td>
                                        <td>
                                            <p class="mb-0">20-1-2022</p>
                                            <p class="text-secondary small">9:00 am</p>
                                        </td>
                                        <td>
                                            <span class="badge badge-sm bg-blue">In Progress</span>
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
                                        <td>
                                            <div class="row gx-3 align-items-center">
                                                <div class="col-auto">
                                                    <figure class="avatar avatar-50 border mb-0 coverimg rounded">
                                                        <img src="assets/img/modern-ai-image/user-3.jpg" alt="" />
                                                    </figure>
                                                </div>
                                                <div class="col">
                                                    <p class="mb-0">Hotel Atlantisia</p>
                                                    <p class="text-secondary small mb-1">Requirement gathering</p>
                                                    <p class="text-secondary small">By <a href="">Shelvey Doe</a></p>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <p class="mb-0">20-1-2022</p>
                                            <p class="text-secondary small">9:00 am</p>
                                        </td>
                                        <td>
                                            <p class="mb-0">7.15</p>
                                            <p class="text-secondary small">hours</p>
                                        </td>
                                        <td>
                                            <p class="mb-0">Nick Vedhaa</p>
                                            <p class="text-secondary small">vedhaa&#64;gmailtestid.com</p>
                                        </td>
                                        <td>
                                            <p class="mb-0">20-1-2022</p>
                                            <p class="text-secondary small">9:00 am</p>
                                        </td>
                                        <td>
                                            <span class="badge badge-sm bg-red">Bug</span>
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
                                        <td>
                                            <div class="row gx-3 align-items-center">
                                                <div class="col-auto">
                                                    <figure class="avatar avatar-50 border mb-0 coverimg rounded">
                                                        <img src="assets/img/modern-ai-image/user-7.jpg" alt="" />
                                                    </figure>
                                                </div>
                                                <div class="col">
                                                    <p class="mb-0">AutoD-vine App</p>
                                                    <p class="text-secondary small mb-1">Data updates for release</p>
                                                    <p class="text-secondary small">By <a href="">Jacob Jackson</a></p>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <p class="mb-0">20-1-2022</p>
                                            <p class="text-secondary small">9:00 am</p>
                                        </td>
                                        <td>
                                            <p class="mb-0">7.45</p>
                                            <p class="text-secondary small">hours</p>
                                        </td>
                                        <td>
                                            <p class="mb-0">Mirae Jackson</p>
                                            <p class="text-secondary small">mirae&#64;gmailtestid.com</p>
                                        </td>
                                        <td>
                                            <p class="mb-0">20-1-2022</p>
                                            <p class="text-secondary small">10:05 am</p>
                                        </td>
                                        <td>
                                            <span class="badge badge-sm bg-green">Completed</span>
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
                                        <td>
                                            <div class="row gx-3 align-items-center">
                                                <div class="col-auto">
                                                    <figure class="avatar avatar-50 border mb-0 coverimg rounded">
                                                        <img src="assets/img/modern-ai-image/user-3.jpg" alt="" />
                                                    </figure>
                                                </div>
                                                <div class="col">
                                                    <p class="mb-0">Hotel Atlantisia</p>
                                                    <p class="text-secondary small mb-1">Requirement gathering</p>
                                                    <p class="text-secondary small">By <a href="">Max Wildson</a></p>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <p class="mb-0">20-1-2022</p>
                                            <p class="text-secondary small">9:00 am</p>
                                        </td>
                                        <td>
                                            <p class="mb-0">8.30</p>
                                            <p class="text-secondary small">hours</p>
                                        </td>
                                        <td>
                                            <p class="mb-0">Millie Danial</p>
                                            <p class="text-secondary small">millie&#64;gmailtestid.com</p>
                                        </td>
                                        <td>
                                            <p class="mb-0">20-1-2022</p>
                                            <p class="text-secondary small">9:00 am</p>
                                        </td>
                                        <td>
                                            <span class="badge badge-sm bg-blue">New Task</span>
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
                                        <td>
                                            <div class="row gx-3 align-items-center">
                                                <div class="col-auto">
                                                    <figure class="avatar avatar-50 border mb-0 coverimg rounded">
                                                        <img src="assets/img/modern-ai-image/bus-3.jpg" alt="" />
                                                    </figure>
                                                </div>
                                                <div class="col">
                                                    <p class="mb-0">Web payment extensions</p>
                                                    <p class="text-secondary small mb-1">Development of services</p>
                                                    <p class="text-secondary small">By <a href="">Jack Dan</a></p>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <p class="mb-0">20-1-2022</p>
                                            <p class="text-secondary small">9:00 am</p>
                                        </td>
                                        <td>
                                            <p class="mb-0">7.30</p>
                                            <p class="text-secondary small">hours</p>
                                        </td>
                                        <td>
                                            <p class="mb-0">Nick Vedhaa</p>
                                            <p class="text-secondary small">vedhaa&#64;gmailtestid.com</p>
                                        </td>
                                        <td>
                                            <p class="mb-0">20-1-2022</p>
                                            <p class="text-secondary small">9:00 am</p>
                                        </td>
                                        <td>
                                            <span class="badge badge-sm bg-red">Bug Assigned</span>
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
                                        <td>
                                            <div class="row gx-3 align-items-center">
                                                <div class="col-auto">
                                                    <figure class="avatar avatar-50 border mb-0 coverimg rounded">
                                                        <img src="assets/img/modern-ai-image/bus-3.jpg" alt="" />
                                                    </figure>
                                                </div>
                                                <div class="col">
                                                    <p class="mb-0">Web payment extensions</p>
                                                    <p class="text-secondary small mb-1">Development of services</p>
                                                    <p class="text-secondary small">By <a href="">Shrivalli Johnson</a></p>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <p class="mb-0">20-1-2022</p>
                                            <p class="text-secondary small">9:00 am</p>
                                        </td>
                                        <td>
                                            <p class="mb-0">8.00</p>
                                            <p class="text-secondary small">hours</p>
                                        </td>
                                        <td>
                                            <p class="mb-0">John Johnson</p>
                                            <p class="text-secondary small">john&#64;gmailtestid.com</p>
                                        </td>
                                        <td>
                                            <p class="mb-0">20-1-2022</p>
                                            <p class="text-secondary small">9:00 am</p>
                                        </td>
                                        <td>
                                            <span class="badge badge-sm bg-yellow">In Progress</span>
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
                                        <td>
                                            <div class="row gx-3 align-items-center">
                                                <div class="col-auto">
                                                    <figure class="avatar avatar-50 border mb-0 coverimg rounded">
                                                        <img src="assets/img/modern-ai-image/PET-2.jpg" alt="" class="w-100" />
                                                    </figure>
                                                </div>
                                                <div class="col">
                                                    <p class="mb-0">Divine soul apps</p>
                                                    <p class="text-secondary small mb-1">Requirement Understanding</p>
                                                    <p class="text-secondary small">By <a href="">Maria Smith</a></p>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <p class="mb-0">20-1-2022</p>
                                            <p class="text-secondary small">9:00 am</p>
                                        </td>
                                        <td>
                                            <p class="mb-0">7.30</p>
                                            <p class="text-secondary small">hours</p>
                                        </td>
                                        <td>
                                            <p class="mb-0">John Johnson</p>
                                            <p class="text-secondary small">john&#64;gmailtestid.com</p>
                                        </td>
                                        <td>
                                            <p class="mb-0">20-1-2022</p>
                                            <p class="text-secondary small">9:00 am</p>
                                        </td>
                                        <td>
                                            <span class="badge badge-sm bg-yellow">In Progress</span>
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
                                        <td>
                                            <div class="row gx-3 align-items-center">
                                                <div class="col-auto">
                                                    <figure class="avatar avatar-50 border mb-0 coverimg rounded">
                                                        <img src="assets/img/modern-ai-image/kids-6.jpg" alt="" />
                                                    </figure>
                                                </div>
                                                <div class="col">
                                                    <p class="mb-0">Kitchen World app</p>
                                                    <p class="text-secondary small mb-1">UI Design for Home page</p>
                                                    <p class="text-secondary small">By <a href="">Shelvey Doe</a></p>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <p class="mb-0">20-1-2022</p>
                                            <p class="text-secondary small">9:00 am</p>
                                        </td>
                                        <td>
                                            <p class="mb-0">6.30</p>
                                            <p class="text-secondary small">hours</p>
                                        </td>
                                        <td>
                                            <p class="mb-0">John Johnson</p>
                                            <p class="text-secondary small">john&#64;gmailtestid.com</p>
                                        </td>
                                        <td>
                                            <p class="mb-0">20-1-2022</p>
                                            <p class="text-secondary small">9:00 am</p>
                                        </td>
                                        <td>
                                            <span class="badge badge-sm bg-green">Completed</span>
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
export class ProjectDashboardComponent {
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

