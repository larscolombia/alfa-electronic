import { Component, Renderer2, ViewChild, ElementRef, CUSTOM_ELEMENTS_SCHEMA, Inject } from "@angular/core";
import { RouterLink } from "@angular/router";
import Choices, { ClassNames } from "choices.js";
import { DOCUMENT } from "@angular/common";

import { DaterangePickerRangesComponent } from "../../../components/input-fields/daterange-picker/daterange-picker-ranges.component";
import { CircleProgressBlueBlankComponent } from "../../../components/charts/circle-progress-blue-blank.component";
import { CircleProgressBlueComponent } from "../../../components/charts/circle-progress-blue.component";
import { CircleProgressYellowComponent } from "../../../components/charts/circle-progress-yellow.component";
import { CircleProgressYellowBlankComponent } from "../../../components/charts/circle-progress-yellow-blank.component";
import { CircleProgressRedComponent } from "../../../components/charts/circle-progress-red.component";
import { CircleProgressRedBlankComponent } from "../../../components/charts/circle-progress-red-blank.component";
import { CircleProgressGreenComponent } from "../../../components/charts/circle-progress-green.component";
import { CircleProgressWhiteBlankComponent } from "../../../components/charts/circle-progress-white-blank.component";
import { ExplorerBannerChartComponent } from "../../../components/charts/explorer-banner-chart.component";

@Component({
    selector: "app-explorer",
    standalone: true,
    imports: [RouterLink, DaterangePickerRangesComponent, CircleProgressBlueBlankComponent, CircleProgressBlueComponent, CircleProgressYellowComponent, CircleProgressYellowBlankComponent, CircleProgressRedComponent, CircleProgressRedBlankComponent, CircleProgressGreenComponent, CircleProgressWhiteBlankComponent, ExplorerBannerChartComponent],
    template: `
        <!-- page title -->
        <div class="container-fluid py-3">
            <div class="row gx-3 gx-lg-4 align-items-center page-title">
                <div class="col col-sm mb-3 mb-sm-0 order-1">
                    <h5 class="mb-0">File Explorer</h5>
                    <p class="text-secondary small">Manage Space with Files Management</p>
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
                    <li class="breadcrumb-item bi active" aria-current="page">Explorer</li>
                </ol>
            </nav>
        </div>

        <!-- content -->
        <div class="container mt-3" id="main-content">
            <div class="row gx-3 gx-lg-4">
                <!-- summary blocks -->
                <div class="col-12 col-sm-6 col-lg-6 col-xxl-3">
                    <div class="card adminuiux-card mb-3 mb-lg-4 mt-4">
                        <div class="card-body">
                            <div class="row gx-3 align-items-center">
                                <div class="col-auto text-center">
                                    <div class="mt--50 position-relative">
                                        <div class="avatar avatar-70 card rounded-circle text-center shadow-sm mb-2 position-relative p-1">
                                            <app-circle-progress-blue-blank class="avatar avatar-60 mx-auto"></app-circle-progress-blue-blank>
                                            <div class="avatar avatar-40 h5 position-absolute start-50 top-50 translate-middle bg-theme-1-subtle text-theme-1 rounded-circle">
                                                <i class="bi bi-globe"></i>
                                            </div>
                                        </div>
                                        <p class="text-secondary small mb-1">6.5 GB</p>
                                    </div>
                                </div>
                                <div class="col">
                                    <p class="text-secondary small mb-1">Webspace</p>
                                    <h5>5.5GB <small>used</small></h5>
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
                <div class="col-12 col-sm-6 col-lg-6 col-xxl-3">
                    <div class="card adminuiux-card mb-3 mb-lg-4 mt-4">
                        <div class="card-body">
                            <div class="row gx-3 align-items-center">
                                <div class="col-auto text-center">
                                    <div class="mt--50 position-relative">
                                        <div class="avatar avatar-70 card rounded-circle text-center shadow-sm mb-2 position-relative p-1">
                                            <app-circle-progress-yellow-blank class="avatar avatar-60 mx-auto"></app-circle-progress-yellow-blank>
                                            <div class="avatar avatar-40 h5 position-absolute start-50 top-50 translate-middle bg-theme-1-subtle text-theme-1 theme-yellow rounded-circle">
                                                <i class="bi bi-file-earmark-richtext"></i>
                                            </div>
                                        </div>
                                        <p class="text-secondary small mb-1">3500k</p>
                                    </div>
                                </div>
                                <div class="col">
                                    <p class="text-secondary small mb-1">Server</p>
                                    <h5>2569k<small>Files</small></h5>
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
                <div class="col-12 col-sm-6 col-lg-6 col-xxl-3">
                    <div class="card adminuiux-card mb-3 mb-lg-4 mt-4">
                        <div class="card-body">
                            <div class="row gx-3 align-items-center">
                                <div class="col-auto text-center">
                                    <div class="mt--50 position-relative">
                                        <div class="avatar avatar-70 card rounded-circle text-center shadow-sm mb-2 position-relative p-1">
                                            <app-circle-progress-red-blank class="avatar avatar-60 rounded-circle"></app-circle-progress-red-blank>
                                            <div class="avatar avatar-40 h5 position-absolute start-50 top-50 translate-middle bg-theme-1-subtle text-theme-1 theme-red rounded-circle">
                                                <i class="bi bi-device-ssd"></i>
                                            </div>
                                        </div>
                                        <p class="text-secondary small mb-1">1.5 TB</p>
                                    </div>
                                </div>
                                <div class="col">
                                    <p class="text-secondary small mb-1">SSD used</p>
                                    <h5>1.15<small>TB</small></h5>
                                </div>
                                <div class="col-auto col-sm-12 col-md-auto avatar-group mt-0 mt-sm-3 mt-md-0">
                                    <figure class="avatar avatar-30 rounded-circle coverimg" data-bs-toggle="tooltip" data-bs-placement="top" title="Just Demo">
                                        <img src="assets/img/modern-ai-image/company6.png" alt="" />
                                    </figure>
                                    <figure class="avatar avatar-30 rounded-circle coverimg" data-bs-toggle="tooltip" data-bs-placement="top" title="Preview Purpose">
                                        <img src="assets/img/modern-ai-image/company7.jpg" alt="" />
                                    </figure>
                                    <figure class="avatar avatar-30 rounded-circle coverimg" data-bs-toggle="tooltip" data-bs-placement="top" title="to look real">
                                        <img src="assets/img/modern-ai-image/company8.jpg" alt="" />
                                    </figure>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-12 col-sm-6 col-lg-6 col-xxl-3">
                    <div class="card adminuiux-card bg-theme-1 mb-3 mb-lg-4 mt-4">
                        <div class="card-body bg-none">
                            <div class="row gx-3 align-items-center">
                                <div class="col-auto text-center">
                                    <div class="mt--50 position-relative p-1">
                                        <div class="avatar avatar-70 bg-theme-1 rounded-circle text-center shadow mb-2 position-relative p-1">
                                            <app-circle-progress-white-blank class="avatar avatar-60 mx-auto"></app-circle-progress-white-blank>
                                            <div class="avatar avatar-30 position-absolute start-50 top-50 translate-middle bg-white-opacity text-white rounded-circle">
                                                <i class="bi bi-envelope-check"></i>
                                            </div>
                                        </div>
                                        <p class="text-white opacity-5 small mb-1">$ 1.5k</p>
                                    </div>
                                </div>
                                <div class="col">
                                    <p class="opacity-75 small mb-1">Bills</p>
                                    <h5>186 <small>USD</small></h5>
                                </div>
                                <div class="col-auto col-sm-12 col-md-auto avatar-group mt-0 mt-sm-3 mt-md-0">
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
                <!-- summary-->
                <div class="col-12 col-sm-6 col-lg-6 col-xxl-3">
                    <div class="card adminuiux-card mb-3 mb-lg-4">
                        <div class="card-body">
                            <div class="row gx-3 align-items-center">
                                <div class="col-auto">
                                    <div class="avatar avatar-50 rounded bg-theme-1 theme-blue text-white">
                                        <i class="bi bi-file-earmark-text h5 vm"></i>
                                    </div>
                                </div>
                                <div class="col">
                                    <h6 class="mb-1">Docs</h6>
                                    <p class="text-secondary">1254 files</p>
                                </div>
                                <div class="col-auto">
                                    <app-circle-progress-blue class="avatar avatar-60 mx-auto"></app-circle-progress-blue>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-12 col-sm-6 col-lg-6 col-xxl-3">
                    <div class="card adminuiux-card mb-3 mb-lg-4">
                        <div class="card-body">
                            <div class="row gx-3 align-items-center">
                                <div class="col-auto">
                                    <div class="avatar avatar-50 rounded bg-theme-1 theme-green text-white">
                                        <i class="bi bi-file-earmark-music h5 vm"></i>
                                    </div>
                                </div>
                                <div class="col">
                                    <h6 class="mb-1">Musics</h6>
                                    <p class="text-secondary">3200 files</p>
                                </div>
                                <div class="col-auto">
                                    <app-circle-progress-green class="avatar avatar-60 mx-auto"></app-circle-progress-green>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-12 col-sm-6 col-lg-6 col-xxl-3">
                    <div class="card adminuiux-card mb-3 mb-lg-4">
                        <div class="card-body">
                            <div class="row gx-3 align-items-center">
                                <div class="col-auto">
                                    <div class="avatar avatar-50 rounded bg-theme-1 theme-yellow text-white">
                                        <i class="bi bi-file-earmark-play h5 vm"></i>
                                    </div>
                                </div>
                                <div class="col">
                                    <h6 class="mb-1">Videos</h6>
                                    <p class="text-secondary">165 files</p>
                                </div>
                                <div class="col-auto">
                                    <app-circle-progress-yellow class="avatar avatar-60 mx-auto"></app-circle-progress-yellow>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-12 col-sm-6 col-lg-6 col-xxl-3">
                    <div class="card adminuiux-card mb-3 mb-lg-4">
                        <div class="card-body">
                            <div class="row gx-3 align-items-center">
                                <div class="col-auto">
                                    <div class="avatar avatar-50 rounded bg-theme-1 theme-red text-white">
                                        <i class="bi bi-file-earmark-richtext h5 vm"></i>
                                    </div>
                                </div>
                                <div class="col">
                                    <h6 class="mb-1">Other</h6>
                                    <p class="text-secondary">2589 files</p>
                                </div>
                                <div class="col-auto">
                                    <app-circle-progress-red class="avatar avatar-60 mx-auto"></app-circle-progress-red>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div class="container-fluid">
            <div class="row gx-3 gx-lg-4 mb-3 mb-lg-4">
                <div class="col-12 px-0">
                    <app-explorer-banner-chart class="height-250 d-block"></app-explorer-banner-chart>
                </div>
            </div>
            <div class="row gx-3 gx-lg-4 mb-3">
                <div class="col text-center py-3">
                    <h4>Better you manage space, <span class="text-gradient">Awesome things</span> you will get soon</h4>
                    <p class="text-secondary">Files Management and all possible are on demand in digital age transformation.</p>
                </div>
            </div>
        </div>
        <div class="container">
            <ul class="nav rounded p-1 mb-3">
                <li class="nav-item">
                    <button class="btn btn-square btn-link" (click)="innersidebar()"><i class="bi bi-layout-sidebar h5 vm"></i></button>
                </li>
                <li class="nav-item">
                    <a class="nav-link"><i class="bi bi-folder-plus h6 vm"></i></a>
                </li>
                <li class="nav-item">
                    <a class="nav-link"><i class="bi bi-trash vm"></i></a>
                </li>
                <li class="nav-item">
                    <a class="nav-link"><i class="bi bi-exclamation-circle vm"></i></a>
                </li>
                <li class="nav-item d-none d-md-block">
                    <div class="input-group input-group-sm my-1 w-100 mx-1">
                        <input type="text" class="form-control bg-transparent" placeholder="Search mail... " value="" />
                        <button class="btn btn-link border" type="button">
                            <i class="bi bi-search"></i>
                        </button>
                    </div>
                </li>
                <li class="nav-item  ms-auto">
                    <a class="nav-link"><i class="bi bi-question-circle"></i></a>
                </li>
                <li class="nav-item">
                    <a class="nav-link d-inline-block"><i class="bi bi-chevron-left"></i></a>
                    <span class="d-none d-xl-inline-block vm">15 out of 12548</span>
                    <a class="nav-link d-inline-block"><i class="bi bi-chevron-right"></i></a>
                </li>
            </ul>
            <div class="inner-sidebar-wrap">
                <div class="inner-sidebar">
                    <button class="btn btn-light py-3 mb-3 mb-lg-4 w-100 shadow-sm" type="button" data-bs-toggle="modal" data-bs-target="#addfile"><i class="bi bi-plus me-2 vm"></i> Upload File</button>

                    <ul class="nav nav-pills flex-column mb-3 mb-lg-4">
                        <li class="nav-item">
                            <a class="nav-link active" aria-current="page">
                                <div class="avatar avatar-20 icon"><i class="bi bi-clock-history"></i></div>
                                <div class="col">Recently Uploaded</div>
                            </a>
                        </li>
                        <li class="nav-item dropdown">
                            <a class="nav-link dropdown-toggle" data-bs-toggle="dropdown" data-bs-auto-close="false" data-bs-display="static" role="button" aria-expanded="false">
                                <div class="avatar avatar-30 icon"><i class="bi bi-folder"></i></div>
                                <div class="col">My Files</div>
                            </a>
                            <ul class="dropdown-menu">
                                <li>
                                    <a class="dropdown-item nav-link">
                                        <div class="avatar avatar-20 icon"><i class="bi bi-folder"></i></div>
                                        <div class="col align-self-center">Webspace</div>
                                        <div class="col-auto align-items-center">
                                            <figure class="avatar avatar-24 bg-theme-1-subtle text-theme-1 rounded-circle">
                                                <small class="fs-10 vm">+5</small>
                                            </figure>
                                        </div>
                                        <div class="arrow"><i class="bi bi-chevron-right"></i></div>
                                    </a>
                                </li>
                                <li>
                                    <a class="dropdown-item nav-link">
                                        <div class="avatar avatar-20 icon"><i class="bi bi-folder"></i></div>
                                        <div class="col align-self-center">Server</div>
                                        <div class="arrow"><i class="bi bi-chevron-right"></i></div>
                                    </a>
                                </li>
                                <li>
                                    <a class="dropdown-item nav-link">
                                        <div class="avatar avatar-20 icon"><i class="bi bi-folder"></i></div>
                                        <div class="col align-self-center">SSD</div>
                                        <div class="arrow"><i class="bi bi-chevron-right"></i></div>
                                    </a>
                                </li>
                                <li>
                                    <a class="dropdown-item nav-link">
                                        <div class="avatar avatar-20 icon"><i class="bi bi-folder"></i></div>
                                        <div class="col align-self-center">Pen Drive</div>
                                        <div class="arrow"><i class="bi bi-chevron-right"></i></div>
                                    </a>
                                </li>
                            </ul>
                        </li>
                        <li class="nav-item">
                            <a class="nav-link" aria-current="page">
                                <div class="avatar avatar-20 icon"><i class="bi bi-people"></i></div>
                                <div class="col">Shared with me</div>
                            </a>
                        </li>
                        <li class="nav-item">
                            <a class="nav-link" aria-current="page">
                                <div class="avatar avatar-20 icon"><i class="bi bi-heart"></i></div>
                                <div class="col">Favorite</div>
                            </a>
                        </li>
                        <li class="nav-item">
                            <a class="nav-link" aria-current="page">
                                <div class="avatar avatar-20 icon"><i class="bi bi-trash"></i></div>
                                <div class="col">Trashed</div>
                            </a>
                        </li>
                    </ul>

                    <div class="row gx-3">
                        <div class="col-auto mb-3 mb-lg-4">
                            <div class="rounded bg-theme-1 p-2 text-center">
                                <i class="bi bi-cloud h4"></i>
                                <p class="small">Cloud</p>
                            </div>
                        </div>
                        <div class="col align-self-center mb-3 mb-lg-4">
                            <h6>Storage</h6>
                            <div>
                                <div class="progress height-dynamic mb-1 bg-theme-1-subtle" style="--h-dynamic: 5px">
                                    <div class="progress-bar bg-theme-1 w-50" role="progressbar" aria-valuenow="50" aria-valuemin="0" aria-valuemax="100"></div>
                                </div>
                            </div>
                            <p class="small text-secondary">5.4GB of 6GB used</p>
                        </div>
                    </div>
                    <div class="card adminuiux-card bg-theme-l-gradient theme-yellow mb-3">
                        <div class="card-body">
                            <div class="row gx-3 mb-2">
                                <div class="col">
                                    <p class="mb-0"><i class="bi bi-basket me-1 "></i> Free Plan</p>
                                </div>
                                <div class="col-auto">
                                    <p class="small opacity-75">4 days left</p>
                                </div>
                            </div>
                            <div class="progress height-dynamic bg-theme-1-subtle theme-red mb-2" role="progressbar" aria-label="Basic example" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100" style="--h-dynamic:5px">
                                <div class="progress-bar progress-bar-striped progress-bar-animated bg-theme-1" style="width: 45%"></div>
                            </div>
                            <a routerLink="/app/subscription-plans" class="btn btn-sm btn-accent">Upgrade <i class="bi bi-arrow-right"></i></a>
                        </div>
                    </div>
                </div>
                <div class="inner-sidebar-content px-2 px-lg-3">
                    <div class="row gx-3 gx-lg-4">
                        <div class="col-12 col-md-4 col-lg-6 col-xl-3">
                            <div class="card  adminuiux-card shadow-sm overflow-hidden mb-3 mb-lg-4">
                                <div class="height-150 w-100 coverimg">
                                    <img src="assets/img/modern-ai-image/bus-3.jpg" class="mw-100" alt="" />
                                </div>
                                <div class="card-footer bg-none">
                                    <div class="row gx-3 align-items-center">
                                        <div class="col-auto">
                                            <a href="javascript:void(0)" class="avatar avatar-30 rounded text-red mr-3">
                                                <i class="bi bi-file-earmark-pdf h5 vm"></i>
                                            </a>
                                        </div>
                                        <div class="col maxwidth-dynamic" style="--mw-dynamic: calc(100% - 55px)">
                                            <p class="mb-0 text-truncated">Construction-portal.pdf</p>
                                            <p class="small text-secondary">28/02/2022</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="col-12 col-md-4 col-lg-6 col-xl-3">
                            <div class="card  adminuiux-card shadow-sm overflow-hidden mb-3 mb-lg-4">
                                <div class="height-150 w-100 coverimg">
                                    <img src="assets/img/modern-ai-image/flamingo-4.jpg" class="mw-100" alt="" />
                                </div>
                                <div class="card-footer bg-none">
                                    <div class="row gx-3 align-items-center">
                                        <div class="col-auto">
                                            <a href="javascript:void(0)" class="avatar avatar-30 rounded text-red mr-3">
                                                <i class="bi bi-file-earmark-pdf h5 vm"></i>
                                            </a>
                                        </div>
                                        <div class="col maxwidth-dynamic" style="--mw-dynamic: calc(100% - 55px)">
                                            <p class="mb-0 text-truncated">networking.pdf</p>
                                            <p class="small text-secondary">28/02/2022</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="col-12 col-md-4 col-lg-6 col-xl-3">
                            <div class="card  adminuiux-card shadow-sm overflow-hidden mb-3 mb-lg-4">
                                <div class="height-150 w-100 coverimg">
                                    <img src="assets/img/modern-ai-image/user-1-kid.jpg" class="mw-100" alt="" />
                                </div>
                                <div class="card-footer bg-none">
                                    <div class="row gx-3 align-items-center">
                                        <div class="col-auto">
                                            <a href="javascript:void(0)" class="avatar avatar-30 rounded text-red mr-3">
                                                <i class="bi bi-file-earmark-pdf h5 vm"></i>
                                            </a>
                                        </div>
                                        <div class="col maxwidth-dynamic" style="--mw-dynamic: calc(100% - 55px)">
                                            <p class="mb-0 text-truncated">savemoremoney.pdf</p>
                                            <p class="small text-secondary">28/02/2022</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="col-12 col-md-4 col-lg-6 col-xl-3">
                            <div class="card  adminuiux-card shadow-sm overflow-hidden mb-3 mb-lg-4">
                                <div class="height-150 w-100 coverimg">
                                    <img src="assets/img/modern-ai-image/tree-2.jpg" class="mw-100" alt="" />
                                </div>
                                <div class="card-footer bg-none">
                                    <div class="row gx-3 align-items-center">
                                        <div class="col-auto">
                                            <a href="javascript:void(0)" class="avatar avatar-30 rounded text-red mr-3">
                                                <i class="bi bi-file-earmark-pdf h5 vm"></i>
                                            </a>
                                        </div>
                                        <div class="col maxwidth-dynamic" style="--mw-dynamic: calc(100% - 55px)">
                                            <p class="mb-0 text-truncated">Kitchen_colors_defination.jpg</p>
                                            <p class="small text-secondary">28/02/2022</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="row gx-3 align-items-center mb-3 mb-lg-4">
                        <div class="col-auto">
                            <i class="bi bi-folder h5 avatar avatar-40 bg-theme-1-subtle text-theme-1 rounded"></i>
                        </div>
                        <div class="col">
                            <h6 class="mb-0">Folders</h6>
                            <p class="small text-secondary">Recently viewed by <a href="">Alliana Smith</a></p>
                        </div>
                        <div class="col-auto">
                            <button class="btn btn-sm btn-link">Recently Updated <i class="bi bi-arrow-down"></i></button>
                        </div>
                    </div>
                    <div class="row gx-3 gx-lg-4">
                        <div class="col-12 col-md-4 col-lg-6 col-xl-3">
                            <a class="card adminuiux-card mb-3 mb-lg-4">
                                <div class="card-body">
                                    <div class="row gx-3 align-items-center">
                                        <div class="col-auto">
                                            <div class="avatar avatar-30 rounded text-theme-1">
                                                <i class="bi bi-folder-fill h5 vm"></i>
                                            </div>
                                        </div>
                                        <div class="col maxwidth-dynamic" style="--mw-dynamic: calc(100% - 55px)">
                                            <p class="mb-0 text-truncated">William's School</p>
                                            <p class="small text-secondary">18 Files</p>
                                        </div>
                                    </div>
                                </div>
                            </a>
                        </div>
                        <div class="col-12 col-md-4 col-lg-6 col-xl-3">
                            <a class="card adminuiux-card mb-3 mb-lg-4">
                                <div class="card-body">
                                    <div class="row gx-3 align-items-center">
                                        <div class="col-auto">
                                            <div class="avatar avatar-30 rounded text-theme-1">
                                                <i class="bi bi-folder-fill h5 vm"></i>
                                            </div>
                                        </div>
                                        <div class="col maxwidth-dynamic" style="--mw-dynamic: calc(100% - 55px)">
                                            <p class="mb-0 text-truncated">Music Audition</p>
                                            <p class="small text-secondary">3 Files</p>
                                        </div>
                                    </div>
                                </div>
                            </a>
                        </div>
                        <div class="col-12 col-md-4 col-lg-6 col-xl-3">
                            <a class="card adminuiux-card mb-3 mb-lg-4">
                                <div class="card-body">
                                    <div class="row gx-3 align-items-center">
                                        <div class="col-auto">
                                            <div class="avatar avatar-30 rounded text-theme-1">
                                                <i class="bi bi-folder-fill h5 vm"></i>
                                            </div>
                                        </div>
                                        <div class="col maxwidth-dynamic" style="--mw-dynamic: calc(100% - 55px)">
                                            <p class="mb-0 text-truncated">Housing Papers</p>
                                            <p class="small text-secondary">6 Files</p>
                                        </div>
                                    </div>
                                </div>
                            </a>
                        </div>
                        <div class="col-12 col-md-4 col-lg-6 col-xl-3">
                            <a class="card adminuiux-card mb-3 mb-lg-4">
                                <div class="card-body">
                                    <div class="row gx-3 align-items-center">
                                        <div class="col-auto">
                                            <div class="avatar avatar-30 rounded text-theme-1">
                                                <i class="bi bi-folder-fill h5 vm"></i>
                                            </div>
                                        </div>
                                        <div class="col maxwidth-dynamic" style="--mw-dynamic: calc(100% - 55px)">
                                            <p class="mb-0 text-truncated">Lisa's Tuition</p>
                                            <p class="small text-secondary">4 Files</p>
                                        </div>
                                    </div>
                                </div>
                            </a>
                        </div>
                        <div class="col-12 col-md-4 col-lg-6 col-xl-3">
                            <a class="card adminuiux-card mb-3 mb-lg-4">
                                <div class="card-body">
                                    <div class="row gx-3 align-items-center">
                                        <div class="col-auto">
                                            <div class="avatar avatar-30 rounded text-theme-1">
                                                <i class="bi bi-folder-fill h5 vm"></i>
                                            </div>
                                        </div>
                                        <div class="col maxwidth-dynamic" style="--mw-dynamic: calc(100% - 55px)">
                                            <p class="mb-0 text-truncated">Bills Housing</p>
                                            <p class="small text-secondary">8 Files</p>
                                        </div>
                                    </div>
                                </div>
                            </a>
                        </div>
                        <div class="col-12 col-md-4 col-lg-6 col-xl-3">
                            <a class="card adminuiux-card mb-3 mb-lg-4">
                                <div class="card-body">
                                    <div class="row gx-3 align-items-center">
                                        <div class="col-auto">
                                            <div class="avatar avatar-30 rounded text-theme-1">
                                                <i class="bi bi-folder-fill h5 vm"></i>
                                            </div>
                                        </div>
                                        <div class="col maxwidth-dynamic" style="--mw-dynamic: calc(100% - 55px)">
                                            <p class="mb-0 text-truncated">Trip Photos</p>
                                            <div class="row gx-3">
                                                <div class="col">
                                                    <p class="small text-secondary">16 Files</p>
                                                </div>
                                                <div class="col-auto small"><i class="bi bi-share me-1 fs-12"></i> Shared</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </a>
                        </div>
                        <div class="col-12 col-md-4 col-lg-6 col-xl-3">
                            <a class="card adminuiux-card mb-3 mb-lg-4">
                                <div class="card-body">
                                    <div class="row gx-3 align-items-center">
                                        <div class="col-auto">
                                            <div class="avatar avatar-30 rounded text-theme-1">
                                                <i class="bi bi-folder-fill h5 vm"></i>
                                            </div>
                                        </div>
                                        <div class="col maxwidth-dynamic" style="--mw-dynamic: calc(100% - 55px)">
                                            <p class="mb-0 text-truncated">Money Presentation</p>
                                            <p class="small text-secondary">10 Files</p>
                                        </div>
                                    </div>
                                </div>
                            </a>
                        </div>
                    </div>
                    <div class="row gx-3 align-items-center mb-3 mb-lg-4">
                        <div class="col-auto">
                            <i class="bi bi-file-earmark-richtext h5 avatar avatar-40 bg-theme-1-subtle text-theme-1 theme-green rounded"></i>
                        </div>
                        <div class="col">
                            <h6 class="mb-0">Files</h6>
                            <p class="small text-secondary">Recently added by <a href="">Yaan Lee</a></p>
                        </div>
                        <div class="col-auto">
                            <button class="btn btn-sm btn-link">Recently Modified <i class="bi bi-arrow-down"></i></button>
                        </div>
                    </div>
                    <div class="row gx-3 gx-lg-4">
                        <div class="col-12 col-md-4 col-lg-6 col-xl-3">
                            <div class="card  adminuiux-card shadow-sm overflow-hidden mb-3 mb-lg-4">
                                <div class="height-150 w-100 coverimg">
                                    <img src="assets/img/modern-ai-image/pet-3.jpg" class="mw-100" alt="" />
                                </div>
                                <div class="card-footer bg-none">
                                    <div class="row gx-3 align-items-center">
                                        <div class="col-auto">
                                            <a href="javascript:void(0)" class="avatar avatar-30 rounded text-red mr-3">
                                                <i class="bi bi-file-earmark-pdf h5 vm"></i>
                                            </a>
                                        </div>
                                        <div class="col maxwidth-dynamic" style="--mw-dynamic: calc(100% - 55px)">
                                            <p class="mb-0 text-truncated">Construction-portal.pdf</p>
                                            <p class="small text-secondary">28/02/2022</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="col-12 col-md-4 col-lg-6 col-xl-3">
                            <div class="card  adminuiux-card shadow-sm overflow-hidden mb-3 mb-lg-4">
                                <div class="height-150 w-100 coverimg">
                                    <img src="assets/img/modern-ai-image/kids-2.jpg" class="mw-100" alt="" />
                                </div>
                                <div class="card-footer bg-none">
                                    <div class="row gx-3 align-items-center">
                                        <div class="col-auto">
                                            <a href="javascript:void(0)" class="avatar avatar-30 rounded text-red mr-3">
                                                <i class="bi bi-file-earmark-pdf h5 vm"></i>
                                            </a>
                                        </div>
                                        <div class="col maxwidth-dynamic" style="--mw-dynamic: calc(100% - 55px)">
                                            <p class="mb-0 text-truncated">networking.pdf</p>
                                            <p class="small text-secondary">28/02/2022</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="col-12 col-md-4 col-lg-6 col-xl-3">
                            <div class="card  adminuiux-card shadow-sm overflow-hidden mb-3 mb-lg-4">
                                <div class="height-150 w-100 coverimg">
                                    <img src="assets/img/modern-ai-image/user-6-kid.jpg" class="mw-100" alt="" />
                                </div>
                                <div class="card-footer bg-none">
                                    <div class="row gx-3 align-items-center">
                                        <div class="col-auto">
                                            <a href="javascript:void(0)" class="avatar avatar-30 rounded text-red mr-3">
                                                <i class="bi bi-file-earmark-pdf h5 vm"></i>
                                            </a>
                                        </div>
                                        <div class="col maxwidth-dynamic" style="--mw-dynamic: calc(100% - 55px)">
                                            <p class="mb-0 text-truncated">savemoremoney.pdf</p>
                                            <p class="small text-secondary">28/02/2022</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="col-12 col-md-4 col-lg-6 col-xl-3">
                            <div class="card  adminuiux-card shadow-sm overflow-hidden mb-3 mb-lg-4">
                                <div class="height-150 w-100 coverimg">
                                    <img src="assets/img/modern-ai-image/pet-1.jpg" class="mw-100" alt="" />
                                </div>
                                <div class="card-footer bg-none">
                                    <div class="row gx-3 align-items-center">
                                        <div class="col-auto">
                                            <a href="javascript:void(0)" class="avatar avatar-30 rounded text-red mr-3">
                                                <i class="bi bi-file-earmark-pdf h5 vm"></i>
                                            </a>
                                        </div>
                                        <div class="col maxwidth-dynamic" style="--mw-dynamic: calc(100% - 55px)">
                                            <p class="mb-0 text-truncated">Kitchen_colors_defination.jpg</p>
                                            <p class="small text-secondary">28/02/2022</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Grid table-->
                    <div class="card adminuiux-card mb-3 mb-lg-4">
                        <div class="card-header">
                            <div class="row gx-3">
                                <div class="col-auto mb-3 mb-xl-0">
                                    <i class="bi bi-people h5 avatar avatar-40 bg-theme-1-subtle text-theme-1 theme-yellow rounded"></i>
                                </div>
                                <div class="col-9 col-xl mb-3 mb-xl-0">
                                    <h6 class="mb-0">Shared with me</h6>
                                    <p class="small text-secondary">Sharpen details on trending products</p>
                                </div>
                                <div class="col-6 col-xl-auto">
                                    <select class="form-select">
                                        <option>All Categories</option>
                                        <option>Shared</option>
                                        <option>Uploaded by me</option>
                                        <option>Favorite</option>
                                    </select>
                                </div>
                                <div class="col-6 col-xl-auto">
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
                                        <th class="all">File Name</th>
                                        <th class="none">Date Created</th>
                                        <th class="none">Date Modified</th>
                                        <th class="desktop">Share Status</th>
                                        <th class="desktop">File size</th>
                                        <th class="all">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td>
                                            <div class="row gx-3 align-items-center">
                                                <div class="col-auto">
                                                    <figure class="avatar avatar-40 mb-0 coverimg rounded">
                                                        <img src="assets/img/modern-ai-image/taxi-1.jpg" alt="" />
                                                    </figure>
                                                </div>
                                                <div class="col">
                                                    <p class="mb-0">Construction-portal.pdf</p>
                                                    <p class="text-secondary small"><i class="bi bi-heart-fill text-red small vm"></i> Uploaded by me</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <p class="mb-0">28-03-2022</p>
                                            <p class="text-secondary small">06:00 pm</p>
                                        </td>
                                        <td>
                                            <p class="mb-0">29-03-2022</p>
                                            <p class="text-secondary small">08:00 pm by Kevin Doglas</p>
                                        </td>
                                        <td>
                                            <span class="badge badge-light text-bg-theme-1 theme-green">Active</span>
                                        </td>
                                        <td>25.5 MB</td>
                                        <td>
                                            <div class="dropdown d-inline-block">
                                                <a class="text-secondary no-caret" data-bs-toggle="dropdown" aria-expanded="false" role="button">
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
                                                    <figure class="avatar avatar-40 mb-0 coverimg rounded">
                                                        <img src="assets/img/modern-ai-image/user-1-kid.jpg" alt="" />
                                                    </figure>
                                                </div>
                                                <div class="col">
                                                    <p class="mb-0">save-more-money.pptx</p>
                                                    <p class="text-secondary small"><i class="bi bi-heart text-red small vm"></i> Uploaded by me</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <p class="mb-0">11-03-2022</p>
                                            <p class="text-secondary small">06:00 pm</p>
                                        </td>
                                        <td>
                                            <p class="mb-0">5-04-2022</p>
                                            <p class="text-secondary small">01:11 pm by Me</p>
                                        </td>
                                        <td>
                                            <span class="badge badge-light text-bg-theme-1 theme-green">Active</span>
                                        </td>
                                        <td>11.15 MB</td>
                                        <td>
                                            <div class="dropdown d-inline-block">
                                                <a class="text-secondary no-caret" data-bs-toggle="dropdown" aria-expanded="false" role="button">
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
                                                    <figure class="avatar avatar-40 mb-0 coverimg rounded">
                                                        <img src="assets/img/modern-ai-image/tree-4.jpg" alt="" />
                                                    </figure>
                                                </div>
                                                <div class="col">
                                                    <p class="mb-0">Kitchen_colors_defination.pdf</p>
                                                    <p class="text-secondary small">Uploaded by me</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <p class="mb-0">19-03-2022</p>
                                            <p class="text-secondary small">05:52 pm</p>
                                        </td>
                                        <td>
                                            <p class="mb-0">09-03-2022</p>
                                            <p class="text-secondary small">03:15 pm by Me</p>
                                        </td>
                                        <td>
                                            <span class="badge badge-light text-bg-theme-1 theme-green">Active</span>
                                        </td>
                                        <td>25.5 MB</td>
                                        <td>
                                            <div class="dropdown d-inline-block">
                                                <a class="text-secondary no-caret" data-bs-toggle="dropdown" aria-expanded="false" role="button">
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
                                                    <figure class="avatar avatar-40 mb-0 coverimg rounded">
                                                        <img src="assets/img/modern-ai-image/user-5.jpg" alt="" />
                                                    </figure>
                                                </div>
                                                <div class="col">
                                                    <p class="mb-0">Networking-simulation.docx</p>
                                                    <p class="text-secondary small"><i class="bi bi-heart-fill text-red small vm"></i> Uploaded by John Doe</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <p class="mb-0">17-03-2022</p>
                                            <p class="text-secondary small">09:00 pm</p>
                                        </td>
                                        <td>
                                            <p class="mb-0">3-04-2022</p>
                                            <p class="text-secondary small">01:15 am by John Doe</p>
                                        </td>
                                        <td>
                                            <span class="badge badge-light text-bg-theme-1 theme-green">Active</span>
                                        </td>
                                        <td>11.12 MB</td>
                                        <td>
                                            <div class="dropdown d-inline-block">
                                                <a class="text-secondary no-caret" data-bs-toggle="dropdown" aria-expanded="false" role="button">
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
                                                    <figure class="avatar avatar-40 mb-0 coverimg rounded">
                                                        <img src="assets/img/modern-ai-image/peacoke-3.jpg" alt="" />
                                                    </figure>
                                                </div>
                                                <div class="col">
                                                    <p class="mb-0">Business-Presentation.pptx</p>
                                                    <p class="text-secondary small"><i class="bi bi-heart text-red small vm"></i> Uploaded by Akita Dave(PM)</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <p class="mb-0">11-03-2022</p>
                                            <p class="text-secondary small">08:50 pm</p>
                                        </td>
                                        <td>
                                            <p class="mb-0">29-03-2022</p>
                                            <p class="text-secondary small">03:00 am by Ankita Dave(PM)</p>
                                        </td>
                                        <td>
                                            <span class="badge badge-light text-bg-theme-1 theme-red">Inactive</span>
                                        </td>
                                        <td>13.2 MB</td>
                                        <td>
                                            <div class="dropdown d-inline-block">
                                                <a class="text-secondary no-caret" data-bs-toggle="dropdown" aria-expanded="false" role="button">
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
                                                    <figure class="avatar avatar-40 mb-0 coverimg rounded">
                                                        <img src="assets/img/modern-ai-image/lion-2.jpg" alt="" />
                                                    </figure>
                                                </div>
                                                <div class="col">
                                                    <p class="mb-0">small-worker.png</p>
                                                    <p class="text-secondary small">Uploaded by me</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <p class="mb-0">15-03-2022</p>
                                            <p class="text-secondary small">06:00 pm</p>
                                        </td>
                                        <td>
                                            <p class="mb-0">1-04-2022</p>
                                            <p class="text-secondary small">10:00 pm by Me</p>
                                        </td>
                                        <td>
                                            <span class="badge badge-light text-bg-theme-1 theme-red">Inactive</span>
                                        </td>
                                        <td>25.5 MB</td>
                                        <td>
                                            <div class="dropdown d-inline-block">
                                                <a class="text-secondary no-caret" data-bs-toggle="dropdown" aria-expanded="false" role="button">
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
export class ExplorerComponent {
    @ViewChild("choices") mySelect!: ElementRef;

    constructor(
        private renderer: Renderer2,
        @Inject(DOCUMENT) private document: Document // Inject the DOCUMENT token
    ) {}

    ngAfterViewInit() {
        const choices = new Choices(this.mySelect.nativeElement, {
            searchEnabled: true,
            removeItemButton: true,
            classNames: {
                containerOuter: ["choices", "maxwidth-dynamic"],
            } as ClassNames,
            placeholderValue: "Type...",
        });
    }
    innersidebar(): void {
        // Access the body element via the injected DOCUMENT
        const body = this.document.body;
        const className = "innermenu-close";

        // Check if the class exists and toggle it using native classList
        // This is safe because Renderer2 is used for add/remove,
        // and we're checking the native element's classList.
        if (body.classList.contains(className)) {
            this.renderer.removeClass(body, className);
        } else {
            this.renderer.addClass(body, className);
        }
    }
}
