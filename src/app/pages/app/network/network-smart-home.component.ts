import { Component, OnInit, AfterViewInit, AfterContentChecked, OnDestroy, ViewChild, ElementRef, CUSTOM_ELEMENTS_SCHEMA } from "@angular/core";
import { RouterLink } from "@angular/router";
import Choices, { ClassNames } from "choices.js";
import Swiper from "swiper";
import { register } from "swiper/element/bundle";
register();
import DataTable from "datatables.net-dt";
import "datatables.net-responsive-dt";

import { DaterangePickerRangesComponent } from "../../../components/input-fields/daterange-picker/daterange-picker-ranges.component";
import { AreaCyanChartjs60Component } from "../../../components/charts/area-cyan-chartjs-60.component";
import { CircleProgressBlueComponent } from "../../../components/charts/circle-progress-blue.component";
import { CircleProgressBlueBlankComponent } from "../../../components/charts/circle-progress-blue-blank.component";
import { CircleProgressRedBlankComponent } from "../../../components/charts/circle-progress-red-blank.component";
import { CircleProgressYellowBlankComponent } from "../../../components/charts/circle-progress-yellow-blank.component";
import { CircleProgressGreenBlankComponent } from "../../../components/charts/circle-progress-green-blank.component";
import { BarBlueChartjs100Component } from "../../../components/charts/bar-blue-chartjs-100.component";

@Component({
    selector: "app-network-smart-home",
    standalone: true,
    imports: [RouterLink, DaterangePickerRangesComponent, AreaCyanChartjs60Component, CircleProgressBlueComponent, CircleProgressBlueBlankComponent, CircleProgressRedBlankComponent, CircleProgressYellowBlankComponent, CircleProgressGreenBlankComponent, BarBlueChartjs100Component],
    template: `
        <!-- page title -->
        <div class="container-fluid py-3">
            <div class="row gx-3 gx-lg-4 align-items-center page-title">
                <div class="col col-sm mb-3 mb-sm-0 order-1">
                    <h5 class="mb-0">Smart Home</h5>
                    <p class="text-secondary small">Take control on connected devices to your network</p>
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
                    <li class="breadcrumb-item bi active" aria-current="page">Devices (Automation)</li>
                </ol>
            </nav>
        </div>

        <!-- content -->
        <div class="container mt-3" id="main-content">
            <!-- devices chart connection-->
            <div class="row gx-3 gx-lg-4">
                <div class="col-12 col-md-12 col-xl-8">
                    <div class="card adminuiux-card mb-3 mb-lg-4">
                        <div class="card-header">
                            <div class="row gx-3 align-items-center">
                                <div class="col-auto mb-3 mb-lg-0">
                                    <i class="bi bi-building h5 me-1 avatar avatar-40 bg-theme-1-subtle text-theme-1 rounded"></i>
                                </div>
                                <div class="col mb-3 mb-lg-0">
                                    <h6 class="mb-0">Office Space</h6>
                                    <p class="text-secondary small">6 <span class="text-theme-1 theme-green">Active</span>, 1 <span class="text-theme-1 theme-red">Inactive</span> Device</p>
                                </div>
                                <div class="col-12 col-md-6 col-lg-6 col-xl-6">
                                    <div class="input-group">
                                        <select class="choices" #choices2 multiple>
                                            <option selected>Office Space</option>
                                            <option>Office two</option>
                                            <option>Meeting Room 1</option>
                                            <option>Kitchen 1</option>
                                            <option selected>Gate 2</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="card-body">
                            <div class="row gx-3 gx-lg-4">
                                <div class="col-12 col-md-12 col-lg-6 col-xl-6 col-xxl-7 mb-3 mb-xl-0">
                                    <div class="position-relative">
                                        <div class="position-absolute start-0 top-0 w-100 p-3 z-index-1">
                                            <div class="row gx-3 gx-lg-4">
                                                <div class="col">
                                                    <span class="btn btn-light btn-sm btn-rounded shadow-sm"> <span class="avatar avatar-10 rounded-circle bg-theme-1 theme-red me-1"></span> Live </span>
                                                </div>
                                                <div class="col-auto">
                                                    <span class="btn btn-light btn-sm btn-square shadow-sm">
                                                        <i class="bi bi-fullscreen vm"></i>
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="h-auto w-100 rounded border position-relative mb-3 overflow-hidden z-index-0 p-1">
                                            <video controls="false" class="position-relative w-100 d-block rounded" muted autoplay loop>
                                                <source src="assets/img/adminux/drive.mp4" type="video/mp4" />
                                                Your browser does not support the video tag.
                                            </video>
                                        </div>
                                    </div>
                                    <div class="row gx-3 mb-1">
                                        <div class="col-6">
                                            <div class="position-relative">
                                                <div class="position-absolute start-0 top-0 w-100 p-3">
                                                    <div class="row gx-3 gx-lg-4">
                                                        <div class="col">
                                                            <span class="btn btn-light btn-sm btn-rounded shadow-sm"> <span class="avatar avatar-10 rounded-circle bg-theme-1 theme-red me-1"></span> Live </span>
                                                        </div>
                                                        <div class="col-auto">
                                                            <span class="btn btn-light btn-sm btn-square shadow-sm">
                                                                <i class="bi bi-fullscreen vm"></i>
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <figure class="height-150 w-100 rounded border coverimg mb-0">
                                                    <img src="assets/img/modern-ai-image/pet-4.jpg" class="w-100" alt="" />
                                                </figure>
                                            </div>
                                        </div>
                                        <div class="col-6">
                                            <div class="position-relative">
                                                <div class="position-absolute start-0 top-0 w-100 p-3">
                                                    <div class="row gx-3 gx-lg-4">
                                                        <div class="col">
                                                            <span class="btn btn-light btn-sm btn-rounded shadow-sm"> <span class="avatar avatar-10 rounded-circle bg-theme-1 theme-red me-1"></span> Live </span>
                                                        </div>
                                                        <div class="col-auto">
                                                            <span class="btn btn-light btn-sm btn-square shadow-sm">
                                                                <i class="bi bi-fullscreen vm"></i>
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <figure class="height-150 w-100 rounded border coverimg mb-0">
                                                    <img src="assets/img/modern-ai-image/bus-3.jpg" class="w-100" alt="" />
                                                </figure>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-12 col-md-12 col-lg-6 col-xl-6 col-xxl-5">
                                    <div class="row gx-3 align-items-center mb-3">
                                        <div class="col-auto">
                                            <div class="avatar avatar-50 h5 bg-theme-1 theme-green rounded">
                                                <i class="bi bi-thermometer-sun"></i>
                                            </div>
                                        </div>
                                        <div class="col">
                                            <p class="text-secondary small mb-1">Temperature</p>
                                            <h5 class="fw-medium">
                                                45 <small><sup>0</sup>C, Office R-32</small>
                                            </h5>
                                        </div>
                                    </div>
                                    <div class="row gx-3 text-center">
                                        <div class="col-3">
                                            <div class="card mb-3">
                                                <div class="card-body px-3 position-relative">
                                                    <span class="avatar p-1 rounded-circle bg-theme-1 theme-yellow position-absolute top-0 end-0 m-1"></span>
                                                    <i class="bi bi-fan avatar avatar-30 h5 text-theme-1"></i>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="col-3">
                                            <div class="card mb-3">
                                                <div class="card-body px-3 position-relative">
                                                    <span class="avatar p-1 rounded-circle bg-theme-1 theme-red position-absolute top-0 end-0 m-1"></span>
                                                    <i class="bi bi-snow2 avatar avatar-30 h5 text-theme-1"></i>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="col-3">
                                            <div class="card mb-3">
                                                <div class="card-body px-3 position-relative">
                                                    <span class="avatar p-1 rounded-circle bg-green position-absolute top-0 end-0 m-1"></span>
                                                    <i class="bi bi-laptop avatar avatar-30 h5 text-theme-1"></i>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="col-3">
                                            <div class="card mb-3 mb-lg-4">
                                                <div class="card-body px-3 position-relative">
                                                    <span class="avatar p-1 rounded-circle bg-green position-absolute top-0 end-0 m-1"></span>
                                                    <i class="bi bi-pc-display-horizontal avatar avatar-30 h5 text-theme-1"></i>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="col-3">
                                            <div class="card opacity-50" aria-disabled="true">
                                                <div class=" card-body px-3 position-relative">
                                                    <span class="avatar p-1 rounded-circle bg-blue position-absolute top-0 end-0 m-1"></span>
                                                    <i class="bi bi-printer avatar avatar-30 h5 text-theme-1"></i>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="col-3">
                                            <div class="card mb-3">
                                                <div class="card-body px-3 position-relative">
                                                    <span class="avatar p-1 rounded-circle bg-green position-absolute top-0 end-0 m-1"></span>
                                                    <i class="bi bi-cast avatar avatar-30 h5 text-theme-1"></i>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="col-3">
                                            <div class="card mb-3">
                                                <div class="card-body px-3 position-relative">
                                                    <span class="avatar p-1 rounded-circle bg-green position-absolute top-0 end-0 m-1"></span>
                                                    <i class="bi bi-music-player avatar avatar-30 h5 text-theme-1"></i>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="col-3">
                                            <div class="card adminuiux-card bg-theme-1-subtle text-theme-1">
                                                <div class="card-body px-3 position-relative bg-none">
                                                    <i class="bi bi-plus avatar avatar-30 h5 text-theme-1"></i>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <h6 class="mb-3">Lights</h6>
                                    <div class="row gx-3">
                                        <div class="col-4 text-center mb-3">
                                            <div class="card mb-2">
                                                <div class="card-body px-2 position-relative">
                                                    <span class="avatar p-1 rounded-circle bg-theme-1 theme-yellow position-absolute top-0 end-0 m-1"></span>
                                                    <i class="bi bi-lightbulb avatar p-10 h4 text-theme-1 mb-3"></i>
                                                    <div class="row gx-0 align-items-center">
                                                        <div class="col">
                                                            <div class="form-check form-switch d-inline-block mx-auto">
                                                                <input class="form-check-input" type="checkbox" role="switch" id="bulb1" />
                                                                <label class="form-check-label mx-0" for="bulb1"></label>
                                                            </div>
                                                        </div>
                                                        <div class="col-auto">
                                                            <p class="fs-12 text-trucated text-secondary mb-1">9w</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <p class="small text-trucated text-secondary">1-Main Room</p>
                                        </div>
                                        <div class="col-4 text-center mb-3">
                                            <div class="card mb-2">
                                                <div class="card-body px-2 position-relative">
                                                    <span class="avatar p-1 rounded-circle bg-theme-1 theme-red position-absolute top-0 end-0 m-1"></span>
                                                    <i class="bi bi-lamp avatar p-10 h4 text-theme-1 mb-3"></i>
                                                    <div class="row gx-0 align-items-center">
                                                        <div class="col">
                                                            <div class="form-check form-switch d-inline-block mx-auto">
                                                                <input class="form-check-input" type="checkbox" role="switch" id="bulb2" />
                                                                <label class="form-check-label mx-0" for="bulb2"></label>
                                                            </div>
                                                        </div>
                                                        <div class="col-auto">
                                                            <p class="fs-12 text-trucated text-secondary mb-1">18w</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <p class="small text-trucated text-secondary">2-MyRoom</p>
                                        </div>
                                        <div class="col-4 text-center mb-3">
                                            <div class="card mb-2">
                                                <div class="card-body px-2 position-relative">
                                                    <span class="avatar p-1 rounded-circle bg-theme-1 theme-green position-absolute top-0 end-0 m-1"></span>
                                                    <i class="bi bi-lightbulb avatar p-10 h4 text-theme-1 mb-3"></i>
                                                    <div class="row gx-0 align-items-center">
                                                        <div class="col">
                                                            <div class="form-check form-switch d-inline-block mx-auto">
                                                                <input class="form-check-input" type="checkbox" role="switch" id="bulb3" checked />
                                                                <label class="form-check-label mx-0" for="bulb3"></label>
                                                            </div>
                                                        </div>
                                                        <div class="col-auto">
                                                            <p class="fs-12 text-trucated text-secondary mb-1">9w</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <p class="small text-trucated text-secondary">1-Outdoor</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="card-footer">
                            <div class="row gx-3">
                                <div class="col-6 col-lg-6 col-xl-auto mb-3 mb-lg-0">
                                    <div class="row flex-nowrap gx-3">
                                        <div class="col-auto">
                                            <div class="avatar avatar-50 h5 bg-theme-1-subtle text-theme-1 theme-yellow rounded">
                                                <i class="bi bi-lightning"></i>
                                            </div>
                                        </div>
                                        <div class="col-auto">
                                            <p class="text-secondary small mb-1">Power Consump...</p>
                                            <h5>30 Wph</h5>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-6 col-lg-6 col-xl-auto mb-3 mb-xl-0">
                                    <div class="row gx-3">
                                        <div class="col-auto">
                                            <div class="avatar avatar-50 h5 bg-theme-1-subtle text-theme-1 theme-green rounded">
                                                <i class="bi bi-sun"></i>
                                            </div>
                                        </div>
                                        <div class="col-auto">
                                            <p class="text-secondary small mb-1">PV Generation</p>
                                            <h5>45 Wph</h5>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-6 col-lg-6 col-xl-auto mb-xl-0">
                                    <div class="row gx-3">
                                        <div class="col-auto">
                                            <div class="avatar avatar-50 h5 bg-theme-1-subtle text-theme-1 theme-red rounded">
                                                <i class="bi bi-wind"></i>
                                            </div>
                                        </div>
                                        <div class="col-auto">
                                            <p class="text-secondary small mb-1">Wind</p>
                                            <h5>60 kmph</h5>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-6 col-lg-6 col-xl-auto mb-xl-0">
                                    <div class="row gx-3">
                                        <div class="col-auto">
                                            <div class="avatar avatar-50 h5 bg-theme-1-subtle text-theme-1 theme-blue rounded">
                                                <i class="bi bi-moisture"></i>
                                            </div>
                                        </div>
                                        <div class="col-auto">
                                            <p class="text-secondary small mb-1">Moisture</p>
                                            <h5>30%</h5>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-12 col-md-12 col-xl-4">
                    <div class="card adminuiux-card mb-3 mb-lg-4">
                        <div class="card-header">
                            <div class="row gx-3 align-items-center">
                                <div class="col-auto">
                                    <i class="bi bi-building h5 avatar avatar-40 bg-theme-1-subtle text-theme-1 theme-yellow rounded"></i>
                                </div>
                                <div class="col">
                                    <h6 class="mb-0">Meeting Room</h6>
                                    <p class="text-secondary small">6 <span class="text-theme-1 theme-green">Active</span>, 1 <span class="text-theme-1 theme-red">Inactive</span> Device</p>
                                </div>
                            </div>
                        </div>
                        <div class="card-body pb-0">
                            <div class="position-relative">
                                <div class="position-absolute start-0 top-0 w-100 p-3">
                                    <div class="row gx-3 gx-lg-4">
                                        <div class="col">
                                            <span class="btn btn-light btn-sm btn-rounded shadow-sm"> <span class="avatar avatar-20 rounded-circle bg-theme-1 theme-redme-1"></span> Live </span>
                                        </div>
                                        <div class="col-auto">
                                            <span class="btn btn-light btn-sm btn-rounded shadow-sm">
                                                <i class="bi bi-fullscreen vm"></i>
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <figure class="height-230 w-100 rounded border coverimg mb-3">
                                    <img src="assets/img/modern-ai-image/kids-6.jpg" class="w-100" alt="" />
                                </figure>
                            </div>
                            <h6 class="fw-medium mb-3">Devices</h6>
                            <div class="row gx-3">
                                <div class="col-3 col-lg-2 col-xl-3 text-center">
                                    <div class="card mb-3">
                                        <div class="card-body position-relative">
                                            <span class="avatar p-1 rounded-circle bg-theme-1 theme-yellow position-absolute top-0 end-0 m-1"></span>
                                            <i class="bi bi-lightbulb avatar avatar-40 h4 text-secondary b-2"></i>
                                            <div class="row gx-0 align-items-center">
                                                <div class="col-auto mx-auto">
                                                    <div class="form-check form-switch d-inline-block mx-auto px-0">
                                                        <input class="form-check-input mx-0" type="checkbox" role="switch" id="bulb12" />
                                                        <label class="form-check-label mx-0" for="bulb12"></label>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-3 col-lg-2 col-xl-3 text-center">
                                    <div class="card mb-3">
                                        <div class="card-body position-relative">
                                            <span class="avatar p-1 rounded-circle bg-theme-1 theme-red position-absolute top-0 end-0 m-1"></span>
                                            <i class="bi bi-lamp avatar avatar-40 h4 text-secondary b-2"></i>
                                            <div class="row gx-0 align-items-center">
                                                <div class="col-auto mx-auto">
                                                    <div class="form-check form-switch d-inline-block mx-auto px-0">
                                                        <input class="form-check-input mx-0" type="checkbox" role="switch" id="bulb22" />
                                                        <label class="form-check-label mx-0" for="bulb22"></label>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-3 col-lg-2 col-xl-3 text-center">
                                    <div class="card mb-3">
                                        <div class="card-body position-relative">
                                            <span class="avatar p-1 rounded-circle bg-green position-absolute top-0 end-0 m-1"></span>
                                            <i class="bi bi-lightbulb avatar avatar-40 h4 text-theme-1 mb-2"></i>
                                            <div class="row gx-0 align-items-center">
                                                <div class="col-auto mx-auto">
                                                    <div class="form-check form-switch d-inline-block mx-auto px-0">
                                                        <input class="form-check-input mx-0" type="checkbox" role="switch" id="bulb32" checked />
                                                        <label class="form-check-label mx-0" for="bulb32"></label>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-3 col-lg-2 col-xl-3 text-center">
                                    <div class="card mb-3">
                                        <div class="card-body position-relative">
                                            <span class="avatar p-1 rounded-circle bg-green position-absolute top-0 end-0 m-1"></span>
                                            <i class="bi bi-fan avatar avatar-40 h4 text-red b-2"></i>
                                            <div class="row gx-0 align-items-center">
                                                <div class="col-auto mx-auto">
                                                    <div class="form-check form-switch d-inline-block mx-auto px-0">
                                                        <input class="form-check-input mx-0" type="checkbox" role="switch" id="bulb42" checked />
                                                        <label class="form-check-label mx-0" for="bulb42"></label>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-3 col-lg-2 col-xl-3 text-center">
                                    <div class="card mb-3">
                                        <div class="card-body position-relative">
                                            <span class="avatar p-1 rounded-circle bg-theme-1 theme-yellow position-absolute top-0 end-0 m-1"></span>
                                            <i class="bi bi-snow2 avatar avatar-40 h4 text-secondary b-2"></i>
                                            <div class="row gx-0 align-items-center">
                                                <div class="col-auto mx-auto">
                                                    <div class="form-check form-switch d-inline-block mx-auto px-0">
                                                        <input class="form-check-input mx-0" type="checkbox" role="switch" id="bulb52" />
                                                        <label class="form-check-label mx-0" for="bulb52"></label>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-3 col-lg-2 col-xl-3 text-center">
                                    <div class="card mb-3">
                                        <div class="card-body position-relative">
                                            <span class="avatar p-1 rounded-circle bg-theme-1 theme-red position-absolute top-0 end-0 m-1"></span>
                                            <i class="bi bi-pc-display-horizontal avatar avatar-40 h4 text-secondary b-2"></i>
                                            <div class="row gx-0 align-items-center">
                                                <div class="col-auto mx-auto">
                                                    <div class="form-check form-switch d-inline-block mx-auto px-0">
                                                        <input class="form-check-input mx-0" type="checkbox" role="switch" id="bulb62" />
                                                        <label class="form-check-label mx-0" for="bulb62"></label>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-3 col-lg-2 col-xl-3 text-center">
                                    <div class="card mb-3">
                                        <div class="card-body position-relative">
                                            <span class="avatar p-1 rounded-circle bg-green position-absolute top-0 end-0 m-1"></span>
                                            <i class="bi bi-cast avatar avatar-40 h4 text-green b-2"></i>
                                            <div class="row gx-0 align-items-center">
                                                <div class="col-auto mx-auto">
                                                    <div class="form-check form-switch d-inline-block mx-auto px-0">
                                                        <input class="form-check-input mx-0" type="checkbox" role="switch" id="bulb72" checked />
                                                        <label class="form-check-label mx-0" for="bulb72"></label>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-3 col-lg-2 col-xl-3 text-center">
                                    <div class="card mb-3">
                                        <div class="card-body position-relative">
                                            <span class="avatar p-1 rounded-circle bg-green position-absolute top-0 end-0 m-1"></span>
                                            <i class="bi bi-fan avatar avatar-40 h4 text-theme-1 mb-2"></i>
                                            <div class="row gx-0 align-items-center">
                                                <div class="col-auto mx-auto">
                                                    <div class="form-check form-switch d-inline-block mx-auto px-0">
                                                        <input class="form-check-input mx-0" type="checkbox" role="switch" id="bulb82" checked />
                                                        <label class="form-check-label mx-0" for="bulb82"></label>
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

            <!-- smart vehicles-->
            <div class="row gx-3 gx-lg-4">
                <div class="col-12 col-md-6 col-lg-4 col-xl-3">
                    <div class="card adminuiux-card bg-l-gradient-light overflow-hidden mb-3 mb-lg-4 theme-cyan">
                        <div class="card-body">
                            <div class="row gx-3 align-items-center mb-3">
                                <div class="col-auto">
                                    <i class="bi bi-speedometer avatar avatar-40 bg-theme-1-subtle text-theme-1 rounded-circle h5"></i>
                                </div>
                                <div class="col">
                                    <h6 class="mb-0">80<small class="fs-14 fw-medium">kmph</small></h6>
                                    <p class="small text-secondary">Speed</p>
                                </div>
                            </div>
                        </div>
                        <app-area-cyan-chartjs-60 class="w-100 height-80"></app-area-cyan-chartjs-60>
                    </div>
                </div>
                <!-- battery -->
                <div class="col-12 col-md-6 col-lg-4 col-xl-3">
                    <div class="card adminuiux-card bg-l-gradient-light overflow-hidden mb-3 mb-lg-4 theme-green">
                        <div class="card-body">
                            <div class="row gx-3 align-items-center mb-3">
                                <div class="col-auto">
                                    <div class="avatar avatar-40 position-relative">
                                        <i class="bi bi-battery-half avatar avatar-30 bg-theme-1-subtle text-theme-1 rounded-circle h5 position-absolute start-50 top-50 translate-middle"></i>
                                        <div class="" id="circleprogressgreen2"></div>
                                    </div>
                                </div>
                                <div class="col">
                                    <h6 class="mb-0">65<small class="fs-14 fw-medium">%</small></h6>
                                    <p class="small text-secondary">Battery</p>
                                </div>
                            </div>
                            <div class="row gx-3 align-items-center">
                                <div class="col-auto">
                                    <figure class="width-80 height-80 coverimg rounded">
                                        <img src="assets/img/modern-ai-image/taxi-1.jpg" alt="" />
                                    </figure>
                                </div>
                                <div class="col">
                                    <h5 class="mb-0">2.00<small class="">km</small></h5>
                                    <p class="small text-secondary">Charging station</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <!-- last ride -->
                <div class="col-12 col-md-6 col-lg-4 col-xl-3">
                    <div class="card adminuiux-card bg-l-gradient-light overflow-hidden mb-3 mb-lg-4 theme-orange">
                        <div class="card-body">
                            <div class="row gx-3 align-items-center">
                                <div class="col-auto">
                                    <i class="bi bi-bicycle avatar avatar-40 bg-theme-1-subtle text-theme-1 rounded-circle h5 theme-orange"></i>
                                </div>
                                <div class="col">
                                    <h6 class="mb-0">150<small class="fs-14 fw-medium">km</small></h6>
                                    <p class="small text-secondary">Last Ride</p>
                                </div>
                            </div>
                        </div>
                        <div class="p-0 pt-1">
                            <div class="position-relative">
                                <div class="m-2 position-absolute top-0 end-0 z-index-1">
                                    <button class="btn btn-sm btn-square btn-light rounded"><i class="bi bi-camera"></i></button>
                                    <button class="btn btn-sm btn-square btn-theme rounded"><i class="bi bi-play"></i></button>
                                </div>
                                <div class="height-90 w-100 rounded position-relative overflow-hidden z-index-0">
                                    <video controls="false" class="position-absolute start-0 top-0 w-100" muted autoplay loop>
                                        <source src="assets/img/adminux/drive.mp4" type="video/mp4" />
                                        Your browser does not support the video tag.
                                    </video>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <!-- total rides -->
                <div class="col-12 col-md-6 col-lg-4 col-xl-3">
                    <div class="card adminuiux-card bg-l-gradient-light overflow-hidden mb-3 mb-lg-4 theme-blue">
                        <div class="card-body">
                            <div class="row gx-3 align-items-center mb-3">
                                <div class="col-auto">
                                    <i class="bi bi-globe avatar avatar-40 bg-theme-1-subtle text-theme-1 rounded-circle h5 theme-blue"></i>
                                </div>
                                <div class="col">
                                    <h6 class="mb-0">12102<small class="fs-14 fw-medium">km</small></h6>
                                    <p class="small text-secondary">Lifetime</p>
                                </div>
                            </div>

                            <swiper-container slides-per-view="auto" space-between="20px" autoplay="true" class="swiper swipernav">
                                <swiper-slide class="width-80">
                                    <div class="w-100 height-80 text-center coverimg rounded">
                                        <img src="assets/img/modern-ai-image/bus-3.jpg" alt="" class="maxwidth-300 mx-auto my-4" />
                                    </div>
                                </swiper-slide>
                                <swiper-slide class="width-80">
                                    <div class="w-100 height-80 text-center coverimg rounded">
                                        <img src="assets/img/modern-ai-image/bus-7.jpg" alt="" class="maxwidth-300 mx-auto my-4" />
                                    </div>
                                </swiper-slide>
                                <swiper-slide class="width-80">
                                    <div class="w-100 height-80 text-center coverimg rounded">
                                        <img src="assets/img/modern-ai-image/taxi-1.jpg" alt="" class="maxwidth-300 mx-auto my-4" />
                                    </div>
                                </swiper-slide>
                                <swiper-slide class="width-80">
                                    <div class="w-100 height-80 text-center coverimg rounded">
                                        <img src="assets/img/modern-ai-image/tree-6.jpg" alt="" class="maxwidth-300 mx-auto my-4" />
                                    </div>
                                </swiper-slide>
                            </swiper-container>
                        </div>
                    </div>
                </div>
                <!-- top ride -->
                <div class="col-12 col-md-6 col-lg-6">
                    <div class="card adminuiux-card overflow-hidden mb-3 mb-lg-4">
                        <div class="row gx-3">
                            <div class="col">
                                <div class="card-body">
                                    <p>
                                        <span class="badge badge-light badge-sm text-bg-theme-1 theme-yellow"><i class="bi bi-star-fill"></i> Top Ride</span>
                                    </p>
                                    <div class="row gx-3">
                                        <div class="col-6 mb-3">
                                            <h5 class="mb-0">150<small class="fw-medium">km</small></h5>
                                            <p class="small text-secondary">Last Ride</p>
                                        </div>
                                        <div class="col-6 mb-3">
                                            <h5 class="mb-0">1<small class="fw-medium">hr</small> 41<small class="fw-medium">min</small></h5>
                                            <p class="small text-secondary">Time Taken</p>
                                        </div>
                                        <div class="col-6 mb-3">
                                            <h5 class="mb-0">112<small class="fw-medium">kmph</small></h5>
                                            <p class="small text-secondary">Top Speed</p>
                                        </div>
                                        <div class="col-6 mb-3">
                                            <h5 class="mb-0">85<small class="fw-medium">%</small></h5>
                                            <p class="small text-secondary">Consumption</p>
                                        </div>
                                    </div>
                                    <p class="small text-theme-1"><i class="bi bi-geo-alt"></i> Eiffel Tower</p>
                                </div>
                            </div>
                            <div class="col-4 col-lg-4 col-xl-3 align-self-center">
                                <figure class="mw-100 rounded position-relative">
                                    <img src="assets/img/adminux/vehicle-3.png" alt="" class="w-100 my-3" />
                                </figure>
                            </div>
                        </div>
                    </div>
                </div>
                <!-- service -->
                <div class="col-12 col-md-6 col-lg-6">
                    <div class="card adminuiux-card overflow-hidden mb-3 mb-lg-4">
                        <div class="card-body">
                            <div class="row gx-3">
                                <div class="col-6 col-lg-5 col-xl-4">
                                    <figure class="w-100 h-100 coverimg rounded position-relative">
                                        <img src="assets/img/modern-ai-image/taxi-1.jpg" alt="" class="w-100" />
                                    </figure>
                                </div>
                                <div class="col">
                                    <p class="mb-3">
                                        <span class="badge badge-light badge-sm text-bg-theme-1"><i class="bi bi-gear"></i> Service</span>
                                    </p>
                                    <h5 class="mb-0">151<small class="fw-medium">days</small></h5>
                                    <p class="small text-secondary mb-2">Last Service</p>

                                    <h5 class="mb-0">1<small class="fw-medium">day</small> <span class="text-secondary fw-medium">at</span> 12500<small class="fs-14 fw-medium">km</small></h5>
                                    <p class="small text-secondary mb-3">Upcoming Service</p>

                                    <button class="btn btn-sm btn-link"><i class="bi bi-geo-alt"></i> Get Direction</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- summary blocks -->
            <div class="row gx-3 gx-lg-4">
                <div class="col-12 col-md-6 col-lg-6 col-xxl-3">
                    <div class="card adminuiux-card mb-3 mb-lg-4">
                        <div class="card-body text-center">
                            <div class="avatar avatar-60 mx-auto mb-3">
                                <app-circle-progress-blue-blank class="avatar avatar-60 rounded-circle" id="circleprogressblue2"></app-circle-progress-blue-blank>
                                <div class="avatar avatar-40 h5 bg-theme-1-subtle text-theme-1 position-absolute start-50 top-50 translate-middle rounded-circle">
                                    <i class="bi bi-pc-display-horizontal"></i>
                                </div>
                            </div>
                            <p class="text-secondary small mb-1">Connected Devices</p>
                            <h5 class="fw-medium">70250</h5>
                        </div>
                        <div class="card-footer border-top">
                            <div class="row gx-3 gx-lg-4">
                                <div class="col-6">
                                    <p class="text-secondary small mb-1">New Users</p>
                                    <h5>5 <small class=" text-secondary">This week</small></h5>
                                </div>
                                <div class="col-6 border-left-dashed">
                                    <p class="text-secondary small mb-1">Total Users</p>
                                    <h5>65826</h5>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-12 col-md-6 col-lg-6 col-xxl-3">
                    <div class="card adminuiux-card mb-3 mb-lg-4">
                        <div class="card-body text-center">
                            <div class="avatar avatar-60 mx-auto mb-3">
                                <app-circle-progress-green-blank class="avatar avatar-60 rounded-circle" id="circleprogressblue2"></app-circle-progress-green-blank>
                                <div class="avatar avatar-40 h5 bg-theme-1-subtle text-theme-1 theme-green position-absolute start-50 top-50 translate-middle rounded-circle">
                                    <i class="bi bi-people"></i>
                                </div>
                            </div>
                            <p class="text-secondary small mb-1">Online Users</p>
                            <h5 class="fw-medium">25486</h5>
                        </div>
                        <div class="card-footer border-top">
                            <div class="row gx-3 gx-lg-4">
                                <div class="col-6">
                                    <p class="text-secondary small mb-1">New Device</p>
                                    <h5>2 <small class="text-secondary">This week</small></h5>
                                </div>
                                <div class="col-6 border-left-dashed">
                                    <p class="text-secondary small mb-1">Total Device</p>
                                    <h5>71521</h5>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-12 col-md-6 col-lg-6 col-xxl-3">
                    <div class="card adminuiux-card mb-3 mb-lg-4">
                        <div class="card-body text-center">
                            <div class="avatar avatar-60 mx-auto mb-3">
                                <app-circle-progress-yellow-blank class="avatar avatar-60 rounded-circle" id="circleprogressblue2"></app-circle-progress-yellow-blank>
                                <div class="avatar avatar-40 h5 bg-theme-1-subtle text-theme-1 theme-yellow position-absolute start-50 top-50 translate-middle rounded-circle">
                                    <i class="bi bi-speedometer"></i>
                                </div>
                            </div>
                            <p class="text-secondary small mb-1">Internet Speed</p>
                            <h5 class="fw-medium">60 <small>Mbps</small></h5>
                        </div>
                        <div class="card-footer border-top">
                            <div class="row gx-3 gx-lg-4">
                                <div class="col-6">
                                    <p class="text-secondary small mb-1">Hathway</p>
                                    <h5>55.68 Mbps</h5>
                                </div>
                                <div class="col-6 border-left-dashed">
                                    <p class="text-secondary small mb-1">AT&T</p>
                                    <h5>70.75 Mbps</h5>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-12 col-md-6 col-lg-6 col-xxl-3">
                    <div class="card adminuiux-card mb-3 mb-lg-4">
                        <div class="card-body text-center">
                            <div class="avatar avatar-60 mx-auto mb-3">
                                <app-circle-progress-red-blank class="avatar avatar-60 rounded-circle" id="circleprogressblue2"></app-circle-progress-red-blank>
                                <div class="avatar avatar-40 h5 bg-theme-1-subtle text-theme-1 theme-red position-absolute start-50 top-50 translate-middle rounded-circle">
                                    <i class="bi bi-bug"></i>
                                </div>
                            </div>
                            <p class="text-secondary small mb-1">Ticket Created</p>
                            <h5 class="fw-medium">521</h5>
                        </div>
                        <div class="card-footer border-top">
                            <div class="row gx-3 gx-lg-4">
                                <div class="col-6">
                                    <p class="text-secondary small mb-1">Resolved</p>
                                    <h5 class="text-theme-1 theme-green">421</h5>
                                </div>
                                <div class="col-6 border-left-dashed">
                                    <p class="text-secondary small mb-1">In Progress</p>
                                    <h5 class="text-theme-1 theme-yellow">50</h5>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Devices -->

            <div class="row gx-3 align-items-center mb-3 mb-lg-4">
                <div class="col-auto">
                    <i class="bi bi-pc-display h5 avatar avatar-40 bg-theme-1-subtle text-theme-2 theme-red rounded"></i>
                </div>
                <div class="col">
                    <h6 class="mb-0">Device Listing</h6>
                    <p class="text-secondary small">Usage and Restrictions by Devices</p>
                </div>
                <div class="col-auto"></div>
            </div>
            <swiper-container slides-per-view="auto" space-between="20px" autoplay="true" class="swiper swipernav mb-3 mb-lg-4">
                <swiper-slide class="w-auto pb-1">
                    <div class="card adminuiux-card width-250">
                        <div class="card-header">
                            <div class="row gx-3 align-items-center">
                                <div class="col">
                                    <h6 class="mb-0">ID2584</h6>
                                    <p class="text-secondary small">John Doe</p>
                                </div>
                                <div class="col-auto">
                                    <div class="form-check form-switch">
                                        <input class="form-check-input" type="checkbox" role="switch" id="deviceslist1" checked="" />
                                        <label class="form-check-label" for="deviceslist1"></label>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="card-body text-center">
                            <i class="bi bi-laptop h1 d-block mb-3 text-theme-1 theme-red"></i>
                            <h6 class="mb-1"><span class="avatar avatar-10 bg-theme-1 theme-green me-1 rounded-circle vm"></span> Laptop</h6>
                            <p class="text-secondary small">125.125.254.1</p>
                            <p><i class="bi bi-people"></i> Developers</p>
                        </div>
                        <div class="card-footer">
                            <div class="row gx-3 align-items-center">
                                <div class="col-7">
                                    <p class="text-secondary small mb-0"><i class="bi bi-wifi"></i> Connection</p>
                                    <p class="w-100 text-truncated">25 Department</p>
                                </div>
                                <div class="col-5 text-end">
                                    <p class="text-secondary small mb-0"><i class="bi bi-clock"></i> Uptime</p>
                                    <p>9:15 hrs</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </swiper-slide>
                <swiper-slide class="swiper-slide w-auto pb-1">
                    <div class="card adminuiux-card width-250">
                        <div class="card-header">
                            <div class="row gx-3 align-items-center">
                                <div class="col">
                                    <h6 class="mb-0">ID2658</h6>
                                    <p class="text-secondary small">John Doe</p>
                                </div>
                                <div class="col-auto">
                                    <div class="form-check form-switch">
                                        <input class="form-check-input" type="checkbox" role="switch" id="deviceslist7" checked="" />
                                        <label class="form-check-label" for="deviceslist7"></label>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="card-body text-center">
                            <i class="bi bi-laptop h1 d-block mb-3 text-theme-1 theme-red"></i>
                            <h6 class="mb-1"><span class="avatar avatar-10 bg-theme-1 theme-green me-1 rounded-circle vm"></span> Laptop</h6>
                            <p class="text-secondary small">125.125.254.1</p>
                            <p><i class="bi bi-people"></i> Developers</p>
                        </div>
                        <div class="card-footer">
                            <div class="row gx-3 align-items-center">
                                <div class="col-7">
                                    <p class="text-secondary small mb-0"><i class="bi bi-wifi"></i> Connection</p>
                                    <p class="w-100 text-truncated">Lizaardius Team</p>
                                </div>
                                <div class="col-5 text-end">
                                    <p class="text-secondary small mb-0"><i class="bi bi-clock"></i> Uptime</p>
                                    <p>7:45 hrs</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </swiper-slide>
                <swiper-slide class="swiper-slide w-auto pb-1">
                    <div class="card adminuiux-card width-250">
                        <div class="card-header">
                            <div class="row gx-3 align-items-center">
                                <div class="col">
                                    <h6 class="mb-0">ID3658</h6>
                                    <p class="text-secondary small">John Doe</p>
                                </div>
                                <div class="col-auto">
                                    <div class="form-check form-switch">
                                        <input class="form-check-input" type="checkbox" role="switch" id="deviceslist2" />
                                        <label class="form-check-label" for="deviceslist2"></label>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="card-body text-center">
                            <i class="bi bi-pc-display-horizontal h1 d-block mb-3 text-theme-1 theme-red"></i>
                            <h6 class="mb-1"><span class="avatar avatar-10 bg-theme-1 theme-green me-1 rounded-circle vm"></span> Computer</h6>
                            <p class="text-secondary small">125.125.254.1</p>
                            <p><i class="bi bi-people"></i> Designer</p>
                        </div>
                        <div class="card-footer">
                            <div class="row gx-3 align-items-center">
                                <div class="col-7">
                                    <p class="text-secondary small mb-0"><i class="bi bi-wifi"></i> Connection</p>
                                    <p class="w-100 text-truncated">Design setup</p>
                                </div>
                                <div class="col-5 text-end">
                                    <p class="text-secondary small mb-0"><i class="bi bi-clock"></i> Uptime</p>
                                    <p>7:5 hrs</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </swiper-slide>
                <swiper-slide class="swiper-slide w-auto pb-1">
                    <div class="card adminuiux-card width-250">
                        <div class="card-header">
                            <div class="row gx-3 align-items-center">
                                <div class="col">
                                    <h6 class="mb-0">ID2698</h6>
                                    <p class="text-secondary small">John Doe</p>
                                </div>
                                <div class="col-auto">
                                    <div class="form-check form-switch">
                                        <input class="form-check-input" type="checkbox" role="switch" id="deviceslist3" checked="" />
                                        <label class="form-check-label" for="deviceslist3"></label>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="card-body text-center">
                            <i class="bi bi-router h1 d-block mb-3 text-theme-1 theme-red"></i>
                            <h6 class="mb-1"><span class="avatar avatar-10 bg-theme-1 theme-green me-1 rounded-circle vm"></span> Router</h6>
                            <p class="text-secondary small">125.125.254.1</p>
                            <p><i class="bi bi-people"></i> Meeting Room</p>
                        </div>
                        <div class="card-footer">
                            <div class="row gx-3 align-items-center">
                                <div class="col-7">
                                    <p class="text-secondary small mb-0"><i class="bi bi-wifi"></i> Connection</p>
                                    <p class="w-100 text-truncated">Meeting Room 1</p>
                                </div>
                                <div class="col-5 text-end">
                                    <p class="text-secondary small mb-0"><i class="bi bi-clock"></i> Uptime</p>
                                    <p>6:00 hrs</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </swiper-slide>
                <swiper-slide class="swiper-slide w-auto pb-1">
                    <div class="card adminuiux-card width-250">
                        <div class="card-header">
                            <div class="row gx-3 align-items-center">
                                <div class="col">
                                    <h6 class="mb-0">ID6584</h6>
                                    <p class="text-secondary small">John Doe</p>
                                </div>
                                <div class="col-auto">
                                    <div class="form-check form-switch">
                                        <input class="form-check-input" type="checkbox" role="switch" id="deviceslist4" checked="" />
                                        <label class="form-check-label" for="deviceslist4"></label>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="card-body text-center">
                            <i class="bi bi-printer h1 d-block mb-3 text-theme-1 theme-red"></i>
                            <h6 class="mb-1"><span class="avatar avatar-10 bg-theme-1 theme-green me-1 rounded-circle vm"></span> Printer</h6>
                            <p class="text-secondary small">RDV20658</p>
                            <p><i class="bi bi-people"></i> HR Team</p>
                        </div>
                        <div class="card-footer">
                            <div class="row gx-3 align-items-center">
                                <div class="col-7">
                                    <p class="text-secondary small mb-0"><i class="bi bi-wifi"></i> Connection</p>
                                    <p class="w-100 text-truncated">Meeting Room 1</p>
                                </div>
                                <div class="col-5 text-end">
                                    <p class="text-secondary small mb-0"><i class="bi bi-clock"></i> Uptime</p>
                                    <p>8:00 hrs</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </swiper-slide>
                <swiper-slide class="swiper-slide w-auto pb-1">
                    <div class="card adminuiux-card width-250">
                        <div class="card-header">
                            <div class="row gx-3 align-items-center">
                                <div class="col">
                                    <h6 class="mb-0">ID2584</h6>
                                    <p class="text-secondary small">John Doe</p>
                                </div>
                                <div class="col-auto">
                                    <div class="form-check form-switch">
                                        <input class="form-check-input" type="checkbox" role="switch" id="deviceslist5" checked="" />
                                        <label class="form-check-label" for="deviceslist5"></label>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="card-body text-center">
                            <i class="bi bi-laptop h1 d-block mb-3 text-theme-1 theme-red"></i>
                            <h6 class="mb-1"><span class="avatar avatar-10 bg-theme-1 theme-green me-1 rounded-circle vm"></span> Laptop</h6>
                            <p class="text-secondary small">125.125.254.1</p>
                            <p><i class="bi bi-people"></i> Developers</p>
                        </div>
                        <div class="card-footer">
                            <div class="row gx-3 align-items-center">
                                <div class="col-7">
                                    <p class="text-secondary small mb-0"><i class="bi bi-wifi"></i> Connection</p>
                                    <p class="w-100 text-truncated">Meeting Room 1</p>
                                </div>
                                <div class="col-5 text-end">
                                    <p class="text-secondary small mb-0"><i class="bi bi-clock"></i> Uptime</p>
                                    <p>8:15 hrs</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </swiper-slide>
            </swiper-container>

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
                <!-- Ticket Resolution track -->
                <div class="col-12 col-md-6 col-lg-6 col-xxl-4">
                    <div class="card adminuiux-card mb-3 mb-lg-4">
                        <div class="card-header">
                            <div class="row gx-3 align-items-center">
                                <div class="col-auto">
                                    <div class="avatar avatar-60 position-relative">
                                        <app-circle-progress-blue class="avatar avatar-60 rounded-circle" id="circleprogressblue2"></app-circle-progress-blue>
                                    </div>
                                </div>
                                <div class="col">
                                    <h6 class="mb-0">Ticket Resolution</h6>
                                    <p class="text-secondary small">Last 6 Months</p>
                                </div>
                                <div class="col-auto"></div>
                            </div>
                        </div>
                        <div class="card-body pb-0">
                            <app-bar-blue-chartjs-100 class="height-170 d-block mb-3"></app-bar-blue-chartjs-100>
                            <div class="row gx-3 align-items-center mb-3">
                                <div class="col">
                                    <h5>115824 <small class="fw-normal text-theme-1 theme-green">18.71 (0.73%)</small></h5>
                                </div>
                                <div class="col-auto">
                                    <p class="text-secondary small">101 This week</p>
                                </div>
                            </div>
                            <p class="text-secondary mb-3">18 member are into support of all queries. 25 Tech. Developers to resolve bugs on time.</p>
                            <div class="progress height-20 my-3">
                                <div class="progress-bar bg-theme-1 theme-blue w-25" role="progressbar" aria-valuenow="25" aria-valuemin="0" aria-valuemax="100"></div>
                                <div class="progress-bar bg-theme-1 theme-yellow w-25" role="progressbar" aria-valuenow="10" aria-valuemin="0" aria-valuemax="100"></div>
                                <div class="progress-bar bg-theme-1 theme-red w-25" role="progressbar" aria-valuenow="5" aria-valuemin="0" aria-valuemax="100"></div>
                                <div class="progress-bar bg-theme-1-subtle theme-blue w-25" role="progressbar" aria-valuenow="5" aria-valuemin="0" aria-valuemax="100"></div>
                            </div>
                            <div class="row gx-3">
                                <p class="col-auto text-secondary small"><span class="avatar avatar-10 align-middle bg-theme-1 theme-blue me-2"></span><span class="align-middle">Closed</span></p>
                                <p class="col-auto text-secondary small"><span class="avatar avatar-10 align-middle bg-theme-1 theme-yellow me-2"></span><span class="align-middle">In progress</span></p>
                                <p class="col-auto text-secondary small"><span class="avatar avatar-10 align-middle bg-theme-1 theme-red me-2"></span><span class="align-middle">Rejected</span></p>
                                <p class="col-auto text-secondary small"><span class="avatar avatar-10 align-middle bg-theme-1-subtle theme-blue me-2"></span><span class="align-middle">Feedback</span></p>
                            </div>
                        </div>
                    </div>
                </div>
                <!-- Devices installation and access -->
                <div class="col-12 col-xxl-4">
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
                                        <th class="none">Status</th>
                                        <th class="none" data-title="Description">Description</th>
                                        <th class="none" data-title="Users">Users</th>
                                        <th class="none width-80">Action</th>
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

            <div class="row mb-3 mb-lg-4">
                <div class="col text-center py-3">
                    <h4>Best design can get user's <span class="text-gradient">Attention</span> & saves <span class="text-gradient">Time/Money</span></h4>
                    <p class="text-secondary">In this universe you may find lots of elements and designs. But serve best which user really need.</p>
                </div>
            </div>

            <!-- Users -->
            <div class="row gx-3 align-items-center mb-3 mb-lg-4">
                <div class="col-auto">
                    <i class="bi bi-people h5 avatar avatar-40 bg-theme-1-subtle text-theme-1 rounded"></i>
                </div>
                <div class="col">
                    <h6 class="mb-0">Users Listing</h6>
                    <p class="text-secondary small">Usage and Restrictions applied to users</p>
                </div>
                <div class="col-auto"></div>
            </div>
            <swiper-container slides-per-view="auto" space-between="20px" autoplay="true" class="swiper swipernav mb-3 mb-lg-4">
                <swiper-slide class="w-auto">
                    <div class="card adminuiux-card width-250">
                        <div class="card-header">
                            <div class="row gx-3 align-items-center">
                                <div class="col">
                                    <h6 class="mb-0">Developers</h6>
                                    <p class="text-secondary small">12 Restrictions</p>
                                </div>
                                <div class="col-auto">
                                    <div class="form-check form-switch">
                                        <input class="form-check-input" type="checkbox" role="switch" id="userlist1" checked="" />
                                        <label class="form-check-label" for="userlist1"></label>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="card-body text-center">
                            <figure class="avatar avatar-100 coverimg mb-3 rounded-circle">
                                <img src="assets/img/modern-ai-image/user-1.jpg" alt="" />
                            </figure>

                            <h6 class="mb-1"><span class="avatar avatar-10 bg-theme-1 theme-green me-1 rounded-circle vm"></span> John Diode</h6>
                            <p class="text-secondary small">125.125.254.1</p>
                            <p><i class="bi bi-laptop"></i> Laptop</p>
                        </div>
                        <div class="card-footer">
                            <div class="row gx-3 align-items-center">
                                <div class="col-7">
                                    <p class="text-secondary small mb-0"><i class="bi bi-wifi"></i> Connection</p>
                                    <h6 class="w-100 text-truncated">25 Department</h6>
                                </div>
                                <div class="col-5">
                                    <p class="text-secondary small mb-0"><i class="bi bi-clock"></i> Session</p>
                                    <h6>9:15 hrs</h6>
                                </div>
                            </div>
                        </div>
                    </div>
                </swiper-slide>
                <swiper-slide class="w-auto">
                    <div class="card adminuiux-card width-250">
                        <div class="card-header">
                            <div class="row gx-3 align-items-center">
                                <div class="col">
                                    <h6 class="mb-0">Developers</h6>
                                    <p class="text-secondary small">12 Restrictions</p>
                                </div>
                                <div class="col-auto">
                                    <div class="form-check form-switch">
                                        <input class="form-check-input" type="checkbox" role="switch" id="userlist2" checked="" />
                                        <label class="form-check-label" for="userlist2"></label>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="card-body text-center">
                            <figure class="avatar avatar-100 coverimg mb-3 rounded-circle">
                                <img src="assets/img/modern-ai-image/user-2.jpg" alt="" />
                            </figure>

                            <h6 class="mb-1"><span class="avatar avatar-10 bg-theme-1 theme-green me-1 rounded-circle vm"></span> Mitali D'Souza</h6>
                            <p class="text-secondary small">125.125.265.1</p>
                            <p><i class="bi bi-laptop"></i> Laptop</p>
                        </div>
                        <div class="card-footer">
                            <div class="row gx-3 align-items-center">
                                <div class="col-7">
                                    <p class="text-secondary small mb-0"><i class="bi bi-wifi"></i> Connection</p>
                                    <h6 class="w-100 text-truncated">25 Department</h6>
                                </div>
                                <div class="col-5">
                                    <p class="text-secondary small mb-0"><i class="bi bi-clock"></i> Session</p>
                                    <h6>9:15 hrs</h6>
                                </div>
                            </div>
                        </div>
                    </div>
                </swiper-slide>
                <swiper-slide class="w-auto">
                    <div class="card adminuiux-card width-250">
                        <div class="card-header">
                            <div class="row gx-3 align-items-center">
                                <div class="col">
                                    <h6 class="mb-0">Developers</h6>
                                    <p class="text-secondary small">12 Restrictions</p>
                                </div>
                                <div class="col-auto">
                                    <div class="form-check form-switch">
                                        <input class="form-check-input" type="checkbox" role="switch" id="userlist3" />
                                        <label class="form-check-label" for="userlist3"></label>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="card-body text-center">
                            <figure class="avatar avatar-100 coverimg mb-3 rounded-circle">
                                <img src="assets/img/modern-ai-image/user-3.jpg" alt="" />
                            </figure>

                            <h6 class="mb-1"><span class="avatar avatar-10 bg-theme-1 theme-green me-1 rounded-circle vm"></span> Alliana Captain</h6>
                            <p class="text-secondary small">125.225.254.1</p>
                            <p><i class="bi bi-pc-display-horizontal"></i> Computer</p>
                        </div>
                        <div class="card-footer">
                            <div class="row gx-3 align-items-center">
                                <div class="col-7">
                                    <p class="text-secondary small mb-0"><i class="bi bi-wifi"></i> Connection</p>
                                    <h6 class="w-100 text-truncated">21-Designer</h6>
                                </div>
                                <div class="col-5 text-end">
                                    <p class="text-secondary small mb-0"><i class="bi bi-clock"></i> Session</p>
                                    <h6>9:15 hrs</h6>
                                </div>
                            </div>
                        </div>
                    </div>
                </swiper-slide>
                <swiper-slide class="w-auto">
                    <div class="card adminuiux-card width-250">
                        <div class="card-header">
                            <div class="row gx-3 align-items-center">
                                <div class="col">
                                    <h6 class="mb-0">Developers</h6>
                                    <p class="text-secondary small">12 Restrictions</p>
                                </div>
                                <div class="col-auto">
                                    <div class="form-check form-switch">
                                        <input class="form-check-input" type="checkbox" role="switch" id="userlist4" checked="" />
                                        <label class="form-check-label" for="userlist4"></label>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="card-body text-center">
                            <figure class="avatar avatar-100 coverimg mb-3 rounded-circle">
                                <img src="assets/img/modern-ai-image/user-1.jpg" alt="" />
                            </figure>

                            <h6 class="mb-1"><span class="avatar avatar-10 bg-theme-1 theme-green me-1 rounded-circle vm"></span> Dr. Batista</h6>
                            <p class="text-secondary small">125.125.254.1</p>
                            <p><i class="bi bi-pc"></i> Remote PC</p>
                        </div>
                        <div class="card-footer">
                            <div class="row gx-3 align-items-center">
                                <div class="col-7">
                                    <p class="text-secondary small mb-0"><i class="bi bi-wifi"></i> Connection</p>
                                    <h6 class="w-100 text-truncated">HR Team</h6>
                                </div>
                                <div class="col-5 text-end">
                                    <p class="text-secondary small mb-0"><i class="bi bi-clock"></i> Session</p>
                                    <h6>9:15 hrs</h6>
                                </div>
                            </div>
                        </div>
                    </div>
                </swiper-slide>
                <swiper-slide class="w-auto">
                    <div class="card adminuiux-card width-250">
                        <div class="card-header">
                            <div class="row gx-3 align-items-center">
                                <div class="col">
                                    <h6 class="mb-0">Developers</h6>
                                    <p class="text-secondary small">12 Restrictions</p>
                                </div>
                                <div class="col-auto">
                                    <div class="form-check form-switch">
                                        <input class="form-check-input" type="checkbox" role="switch" id="userlist5" />
                                        <label class="form-check-label" for="userlist5"></label>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="card-body text-center">
                            <figure class="avatar avatar-100 coverimg mb-3 rounded-circle">
                                <img src="assets/img/modern-ai-image/user-4.jpg" alt="" />
                            </figure>

                            <h6 class="mb-1"><span class="avatar avatar-10 bg-theme-1 theme-green me-1 rounded-circle vm"></span> Terence Lewis</h6>
                            <p class="text-secondary small">125.126.214.1</p>
                            <p><i class="bi bi-pc-display"></i> Laptop</p>
                        </div>
                        <div class="card-footer">
                            <div class="row gx-3 align-items-center">
                                <div class="col-7">
                                    <p class="text-secondary small mb-0"><i class="bi bi-wifi"></i> Connection</p>
                                    <h6 class="w-100 text-truncated">25 Department</h6>
                                </div>
                                <div class="col-5 text-end">
                                    <p class="text-secondary small mb-0"><i class="bi bi-clock"></i> Session</p>
                                    <h6>9:15 hrs</h6>
                                </div>
                            </div>
                        </div>
                    </div>
                </swiper-slide>
                <swiper-slide class="w-auto">
                    <div class="card adminuiux-card width-250">
                        <div class="card-header">
                            <div class="row gx-3 align-items-center">
                                <div class="col">
                                    <h6 class="mb-0">Developers</h6>
                                    <p class="text-secondary small">12 Restrictions</p>
                                </div>
                                <div class="col-auto">
                                    <div class="form-check form-switch">
                                        <input class="form-check-input" type="checkbox" role="switch" id="userlist6" checked="" />
                                        <label class="form-check-label" for="userlist6"></label>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="card-body text-center">
                            <figure class="avatar avatar-100 coverimg mb-3 rounded-circle">
                                <img src="assets/img/modern-ai-image/user-1.jpg" alt="" />
                            </figure>

                            <h6 class="mb-1"><span class="avatar avatar-10 bg-theme-1 theme-green me-1 rounded-circle vm"></span> John Diode</h6>
                            <p class="text-secondary small">125.125.254.1</p>
                            <p><i class="bi bi-laptop"></i> Laptop</p>
                        </div>
                        <div class="card-footer">
                            <div class="row gx-3 align-items-center">
                                <div class="col-7">
                                    <p class="text-secondary small mb-0"><i class="bi bi-wifi"></i> Connection</p>
                                    <h6 class="w-100 text-truncated">25 Department</h6>
                                </div>
                                <div class="col-5 text-end">
                                    <p class="text-secondary small mb-0"><i class="bi bi-clock"></i> Session</p>
                                    <h6>9:15 hrs</h6>
                                </div>
                            </div>
                        </div>
                    </div>
                </swiper-slide>
            </swiper-container>

            <div class="row gx-3 gx-lg-4">
                <div class="col-12 col-md-12 col-lg-12 col-xl-12 col-xxl-8 position-relative">
                    <!-- Grid table-->
                    <div class="card adminuiux-card mb-3 mb-lg-4">
                        <div class="card-header">
                            <div class="row gx-3">
                                <div class="col-auto mb-3 mb-lg-0">
                                    <i class="bi bi-shop h5 avatar avatar-40 bg-theme-1-subtle text-theme-1 rounded"></i>
                                </div>
                                <div class="col-9 col-lg align-self-center mb-3 mb-lg-0">
                                    <h6 class="mb-0">Tickets Raised</h6>
                                    <p class="text-secondary small">All Open Tickets</p>
                                </div>
                                <div class="col-6 col-md-6 col-lg-4 col-xl-4 col-xxl-3">
                                    <select class="form-select two w-100">
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
                                <div class="col-6 col-lg-auto">
                                    <div class="input-group ">
                                        <span class="input-group-text text-theme-1"><i class="bi bi-search"></i></span>
                                        <input type="text" class="form-control" placeholder="Search..." />
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="card-body py-0">
                            <table class="table " id="dataTable">
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
                <div class="col-12 col-md-12 col-lg-12 col-xl-12 col-xxl-4">
                    <div class="card adminuiux-card mb-3 mb-lg-4">
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
                        <div class="card-body p-0 pt-1">
                            <table class="table border-top" id="dataTable2">
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
export class NetworkSmartHomeComponent {
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
