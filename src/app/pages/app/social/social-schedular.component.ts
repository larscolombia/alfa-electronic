import { Component, AfterViewInit, OnDestroy, ViewChild, ElementRef, Renderer2, HostListener, CUSTOM_ELEMENTS_SCHEMA } from "@angular/core";
import { RouterLink } from "@angular/router";
import Choices, { ClassNames } from "choices.js";

import { DaterangePickerRangesComponent } from "../../../components/input-fields/daterange-picker/daterange-picker-ranges.component";
import { DatePickerInlineComponent } from "../../../components/input-fields/date-picker/date-picker-inline.component";
import { AreaBlueChartjs100Component } from "../../../components/charts/area-blue-chartjs-100.component";

@Component({
    selector: "app-social-schedular",
    standalone: true,
    imports: [RouterLink, DaterangePickerRangesComponent, DatePickerInlineComponent, AreaBlueChartjs100Component],
    template: `
        <!-- page title -->
        <div class="container-fluid py-3">
            <div class="row gx-3 gx-lg-4 align-items-center page-title">
                <div class="col col-sm mb-3 mb-sm-0 order-1">
                    <h5 class="mb-0">Social Schedular</h5>
                    <p class="text-secondary small">Social post management dashboard</p>
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
                    <li class="breadcrumb-item bi active" aria-current="page">Schedular</li>
                </ol>
            </nav>
        </div>

        <!-- content -->
        <div class="container-fluid mt-3" id="main-content">
            <div class="row gx-3 align-items-center mb-3">
                <div class="col-6 col-md-auto mb-3 mb-md-0 order-2 order-xl-1">
                    <div class="input-group input-group-md rounded w-200">
                        <span class="input-group-text text-theme-1"><i class="bi bi-newspaper"></i></span>
                        <select class="form-control simplechosen">
                            <option selected>All Channel</option>
                            <option>Instagram</option>
                            <option>Facebook</option>
                            <option>Twitter</option>
                            <option>Blog</option>
                            <option>Task</option>
                            <option>Story</option>
                        </select>
                    </div>
                </div>
                <div class="col-6 col-md-auto mb-3 mb-md-0 order-3 order-xl-2">
                    <div class="input-group input-group-md rounded w-100">
                        <span class="input-group-text text-theme-1"><i class="bi bi-send"></i></span>
                        <select class=" form-control simplechosen">
                            <option selected>All Status</option>
                            <option>Scheduled</option>
                            <option>Draft</option>
                            <option>Rejected</option>
                            <option>Error</option>
                        </select>
                    </div>
                </div>
                <div class="col-12 col-xl mb-3 mb-xl-0 order-1 order-xl-3">
                    <ul class="nav nav-pills justify-content-center" id="myTab" role="tablist">
                        <li class="nav-item" role="presentation">
                            <button class="nav-link active" id="planner-tab" data-bs-toggle="tab" data-bs-target="#planner" type="button" role="tab" aria-controls="planner" aria-selected="true">Planner</button>
                        </li>
                        <li class="nav-item" role="presentation">
                            <button class="nav-link" id="posts-tab" data-bs-toggle="tab" data-bs-target="#posts" type="button" role="tab" aria-controls="posts" aria-selected="false">Posts</button>
                        </li>
                    </ul>
                </div>
                <div class="col col-md-auto order-4 order-xl-4 ms-auto ms-xl-0">
                    <h6>2-8 February 2022</h6>
                </div>
                <div class="col-auto col-md-auto order-5 order-xl-5">
                    <button class="btn btn-square btn-link">
                        <i class="bi bi-chevron-left"></i>
                    </button>
                    <button class="btn btn-square btn-outline-theme ms-1">
                        <i class="bi bi-chevron-right"></i>
                    </button>
                </div>
            </div>
            <div class="tab-content" id="myTabContent">
                <!-- Calendar days-->
                <div class="tab-pane fade show active" id="planner" role="tabpanel" aria-labelledby="planner-tab">
                    <table class="table table-scheduled" #scheduleTable>
                        <thead class="overflow-x-auto" #thead>
                            <tr>
                                <th class="text-center">GMT +4:30</th>
                                <th class="bg-theme-1-subtle text-theme-1">
                                    <p class="text-uppercase fw-medium">SUN <span class="badge badge-sm vm bg-theme-1-subtle text-theme-1">2</span></p>
                                    <span class="mb-0 h2">2</span>
                                </th>
                                <th class="">
                                    <p class="text-uppercase fw-medium">Mon</p>
                                    <span class="mb-0 h2">3</span>
                                </th>
                                <th class="bg-theme-1-subtle text-theme-1 theme-green">
                                    <p class="text-uppercase fw-medium">Tue <span class="badge badge-sm vm bg-theme-1-subtle text-theme-1">1</span></p>
                                    <span class="mb-0 h2">4</span>
                                </th>
                                <th class="">
                                    <p class="text-uppercase fw-medium">Wed <span class="badge badge-sm vm bg-theme-1-subtle text-theme-1">2</span></p>
                                    <span class="mb-0 h2">5</span>
                                </th>
                                <th class="">
                                    <p class="text-uppercase fw-medium">Thu <span class="badge badge-sm vm bg-theme-1-subtle text-theme-1">1</span></p>
                                    <span class="mb-0 h2">6</span>
                                </th>
                                <th class="">
                                    <p class="text-uppercase fw-medium">Fri</p>
                                    <span class="mb-0 h2">7</span>
                                </th>
                                <th class="bg-theme-1-subtle text-theme-1">
                                    <p class="text-uppercase fw-medium">Sat</p>
                                    <span class="mb-0 h2">8</span>
                                </th>
                            </tr>
                        </thead>
                        <tbody class="overflow-x-auto" #tbody>
                            <tr>
                                <td>12 AM</td>
                                <td class="bg-theme-1-subtle text-theme-1 disabled"></td>
                                <td class="disabled"></td>
                                <td class="bg-theme-1-subtle text-theme-1 theme-green"></td>
                                <td></td>
                                <td></td>
                                <td></td>
                                <td class="bg-theme-1-subtle text-theme-1"></td>
                            </tr>
                            <tr>
                                <td>1 AM</td>
                                <td class="bg-theme-1-subtle text-theme-1"></td>
                                <td></td>
                                <td class="bg-theme-1-subtle text-theme-1 theme-green"></td>
                                <td></td>
                                <td></td>
                                <td></td>
                                <td class="bg-theme-1-subtle text-theme-1"></td>
                            </tr>
                            <tr>
                                <td>2 AM</td>
                                <td class="bg-theme-1-subtle text-theme-1"></td>
                                <td></td>
                                <td class="bg-theme-1-subtle text-theme-1 theme-green">
                                    <div class="card adminuiux-card mb-2 border-start border-theme-1 theme-green w-100">
                                        <div class="card-header">
                                            <div class="row gx-2 align-items-center">
                                                <div class="col avatar-group">
                                                    <figure class="avatar avatar-20 rounded-circle overlay-ms-10 bg-theme-1 theme-pink text-white fs-12" data-bs-toggle="tooltip" data-bs-placement="top" title="" data-bs-original-title="Instagram">
                                                        <i class="bi bi-instagram vm"></i>
                                                    </figure>
                                                    <figure class="avatar avatar-20 rounded-circle overlay-ms-10 bg-theme-1 theme-blue text-white fs-12" data-bs-toggle="tooltip" data-bs-placement="top" title="" data-bs-original-title="Facebook">
                                                        <i class="bi bi-facebook vm"></i>
                                                    </figure>
                                                    <figure class="avatar avatar-20 rounded-circle bg-theme-1 theme-cyan fs-20" data-bs-toggle="tooltip" data-bs-placement="top" title="" data-bs-original-title="Twitter">
                                                        <i class="bi bi-twitter vm"></i>
                                                    </figure>
                                                </div>
                                                <div class="col-auto">
                                                    <p class="avatar avatar-20 rounded-circle mb-0 bg-theme-1 small fs-12">2+</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="card-body py-0">
                                            <div class="coverimg height-80 rounded mb-2">
                                                <img src="assets/img/modern-ai-image/pet-3.jpg" class="w-100" alt="" />
                                            </div>
                                            <p class="mw-100 text-truncated small"><b>2:20AM</b> Have a good</p>
                                        </div>
                                        <div class="card-footer">
                                            <p class="text-theme-1 theme-green small">
                                                <i class="bi bi-check-circle-fill vm"></i> Added:
                                                <span class="ms-1 text-secondary"><i class="bi bi-image vm"></i></span>
                                                <span class="ms-1 text-secondary"><i class="bi bi-link vm"></i></span>
                                            </p>
                                        </div>
                                    </div>
                                </td>
                                <td></td>
                                <td></td>
                                <td></td>
                                <td class="bg-theme-1-subtle text-theme-1"></td>
                            </tr>
                            <tr>
                                <td>3 AM</td>
                                <td class="bg-theme-1-subtle text-theme-1"></td>
                                <td></td>
                                <td class="bg-theme-1-subtle text-theme-1 theme-green"></td>
                                <td>
                                    <div class="card adminuiux-card mb-2 border-start border-theme-1 theme-red w-100">
                                        <div class="card-header">
                                            <div class="row gx-2 align-items-center">
                                                <div class="col avatar-group">
                                                    <figure class="avatar avatar-20 rounded-circle overlay-ms-10 bg-theme-1 theme-blue text-white fs-12" data-bs-toggle="tooltip" data-bs-placement="top" title="" data-bs-original-title="Facebook">
                                                        <i class="bi bi-facebook vm"></i>
                                                    </figure>
                                                    <figure class="avatar avatar-20 rounded-circle bg-theme-1 theme-cyan fs-12" data-bs-toggle="tooltip" data-bs-placement="top" title="" data-bs-original-title="Twitter">
                                                        <i class="bi bi-twitter vm"></i>
                                                    </figure>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="card-body py-0">
                                            <div class="coverimg height-80 rounded mb-2">
                                                <img src="assets/img/modern-ai-image/tree-4.jpg" class="w-100" alt="" />
                                            </div>
                                            <p class="mw-100 text-truncated small"><b>3:05AM</b> Have a good</p>
                                        </div>
                                        <div class="card-footer">
                                            <p class="text-theme-1 theme-green small">
                                                <i class="bi bi-check-circle-fill vm"></i> Added:
                                                <span class="ms-1 text-secondary"><i class="bi bi-image vm"></i></span>
                                                <span class="ms-1 text-secondary"><i class="bi bi-link vm"></i></span>
                                            </p>
                                        </div>
                                    </div>

                                    <div class="card adminuiux-card mb-2 border-start border-theme-1 theme-blue w-100">
                                        <div class="card-header">
                                            <div class="row gx-2 align-items-center">
                                                <div class="col avatar-group">
                                                    <figure class="avatar avatar-20 rounded-circle overlay-ms-10 bg-theme-1 theme-pink text-white fs-12" data-bs-toggle="tooltip" data-bs-placement="top" title="" data-bs-original-title="Instagram">
                                                        <i class="bi bi-instagram vm"></i>
                                                    </figure>
                                                    <figure class="avatar avatar-20 rounded-circle overlay-ms-10 bg-theme-1 theme-blue text-white fs-12" data-bs-toggle="tooltip" data-bs-placement="top" title="" data-bs-original-title="Facebook">
                                                        <i class="bi bi-facebook vm"></i>
                                                    </figure>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="card-body py-0">
                                            <div class="coverimg height-80 rounded mb-2">
                                                <img src="assets/img/modern-ai-image/bus-7.jpg" class="w-100" alt="" />
                                            </div>
                                            <p class="mw-100 text-truncated small"><b>3:15AM</b> Have a good</p>
                                        </div>
                                        <div class="card-footer">
                                            <p class="text-theme-1 theme-green small">
                                                <i class="bi bi-check-circle-fill vm"></i> Added:
                                                <span class="ms-1 text-secondary"><i class="bi bi-image vm"></i></span>
                                                <span class="ms-1 text-secondary"><i class="bi bi-link vm"></i></span>
                                            </p>
                                        </div>
                                    </div>
                                </td>
                                <td>
                                    <div class="card adminuiux-card mb-2 border-start border-theme-1 theme-green w-100">
                                        <div class="card-header">
                                            <div class="row gx-2 align-items-center">
                                                <div class="col avatar-group">
                                                    <figure class="avatar avatar-20 rounded-circle overlay-ms-10 bg-theme-1 theme-pink text-white fs-12" data-bs-toggle="tooltip" data-bs-placement="top" title="" data-bs-original-title="Instagram">
                                                        <i class="bi bi-instagram vm"></i>
                                                    </figure>
                                                    <figure class="avatar avatar-20 rounded-circle overlay-ms-10 bg-theme-1 theme-blue text-white fs-12" data-bs-toggle="tooltip" data-bs-placement="top" title="" data-bs-original-title="Facebook">
                                                        <i class="bi bi-facebook vm"></i>
                                                    </figure>
                                                    <figure class="avatar avatar-20 rounded-circle bg-theme-1 theme-cyan fs-20" data-bs-toggle="tooltip" data-bs-placement="top" title="" data-bs-original-title="Twitter">
                                                        <i class="bi bi-twitter vm"></i>
                                                    </figure>
                                                </div>
                                                <div class="col-auto">
                                                    <p class="avatar avatar-20 rounded-circle mb-0 bg-theme-1 small fs-12">2+</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="card-body py-0">
                                            <div class="coverimg height-80 rounded mb-2">
                                                <img src="assets/img/modern-ai-image/kids-2.jpg" class="w-100" alt="" />
                                            </div>
                                            <p class="mw-100 text-truncated"><b>3:36AM</b> Do the best</p>
                                        </div>
                                        <div class="card-footer">
                                            <p class="text-theme-1 theme-green small">
                                                <i class="bi bi-check-circle-fill vm"></i> Added:
                                                <span class="ms-1 text-secondary"><i class="bi bi-image vm"></i></span>
                                                <span class="ms-1 text-secondary"><i class="bi bi-link vm"></i></span>
                                            </p>
                                        </div>
                                    </div>
                                </td>
                                <td></td>
                                <td class="bg-theme-1-subtle text-theme-1"></td>
                            </tr>
                            <tr>
                                <td>4 AM</td>
                                <td class="bg-theme-1-subtle text-theme-1"></td>
                                <td></td>
                                <td class="bg-theme-1-subtle text-theme-1 theme-green"></td>
                                <td></td>
                                <td></td>
                                <td></td>
                                <td class="bg-theme-1-subtle text-theme-1"></td>
                            </tr>
                            <tr>
                                <td>5 AM</td>
                                <td class="bg-theme-1-subtle text-theme-1"></td>
                                <td></td>
                                <td class="bg-theme-1-subtle text-theme-1 theme-green"></td>
                                <td></td>
                                <td></td>
                                <td></td>
                                <td class="bg-theme-1-subtle text-theme-1"></td>
                            </tr>
                            <tr>
                                <td>6 AM</td>
                                <td class="bg-theme-1-subtle text-theme-1"></td>
                                <td></td>
                                <td class="bg-theme-1-subtle text-theme-1 theme-green"></td>
                                <td></td>
                                <td></td>
                                <td></td>
                                <td class="bg-theme-1-subtle text-theme-1"></td>
                            </tr>
                            <tr>
                                <td>7 AM</td>
                                <td class="bg-theme-1-subtle text-theme-1"></td>
                                <td></td>
                                <td class="bg-theme-1-subtle text-theme-1 theme-green"></td>
                                <td></td>
                                <td></td>
                                <td></td>
                                <td class="bg-theme-1-subtle text-theme-1"></td>
                            </tr>
                            <tr>
                                <td>8 AM</td>
                                <td class="bg-theme-1-subtle text-theme-1">
                                    <div class="card adminuiux-card mb-2 border-start border-theme-1 theme-green w-100">
                                        <div class="card-header">
                                            <div class="row gx-2 align-items-center">
                                                <div class="col avatar-group">
                                                    <figure class="avatar avatar-20 rounded-circle overlay-ms-10 bg-theme-1 theme-pink text-white fs-12" data-bs-toggle="tooltip" data-bs-placement="top" title="" data-bs-original-title="Instagram">
                                                        <i class="bi bi-instagram vm"></i>
                                                    </figure>
                                                    <figure class="avatar avatar-20 rounded-circle overlay-ms-10 bg-theme-1 theme-blue text-white fs-12" data-bs-toggle="tooltip" data-bs-placement="top" title="" data-bs-original-title="Facebook">
                                                        <i class="bi bi-facebook vm"></i>
                                                    </figure>
                                                    <figure class="avatar avatar-20 rounded-circle bg-theme-1 theme-cyan fs-20" data-bs-toggle="tooltip" data-bs-placement="top" title="" data-bs-original-title="Twitter">
                                                        <i class="bi bi-twitter vm"></i>
                                                    </figure>
                                                </div>
                                                <div class="col-auto">
                                                    <p class="avatar avatar-20 rounded-circle mb-0 bg-theme-1 small fs-12">2+</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="card-body py-0">
                                            <div class="coverimg height-80 rounded mb-2">
                                                <img src="assets/img/modern-ai-image/flamingo-2.jpg" class="w-100" alt="" />
                                            </div>
                                            <p class="w-100 text-truncated"><b>8:30AM</b> Best deals</p>
                                        </div>
                                        <div class="card-footer">
                                            <p class="text-theme-1 theme-green small">
                                                <i class="bi bi-check-circle-fill vm"></i> Added:
                                                <span class="ms-1 text-secondary"><i class="bi bi-image vm"></i></span>
                                                <span class="ms-1 text-secondary"><i class="bi bi-link vm"></i></span>
                                            </p>
                                        </div>
                                    </div>
                                    <div class="card adminuiux-card mb-2 border-start border-theme-1 theme-green w-100">
                                        <div class="card-header">
                                            <div class="row gx-2 align-items-center">
                                                <div class="col avatar-group">
                                                    <figure class="avatar avatar-20 rounded-circle overlay-ms-10 bg-theme-1 theme-pink text-white fs-12" data-bs-toggle="tooltip" data-bs-placement="top" title="" data-bs-original-title="Instagram">
                                                        <i class="bi bi-instagram vm"></i>
                                                    </figure>
                                                    <figure class="avatar avatar-20 rounded-circle overlay-ms-10 bg-theme-1 theme-blue text-white fs-12" data-bs-toggle="tooltip" data-bs-placement="top" title="" data-bs-original-title="Facebook">
                                                        <i class="bi bi-facebook vm"></i>
                                                    </figure>
                                                    <figure class="avatar avatar-20 rounded-circle bg-theme-1 theme-cyan fs-20" data-bs-toggle="tooltip" data-bs-placement="top" title="" data-bs-original-title="Twitter">
                                                        <i class="bi bi-twitter vm"></i>
                                                    </figure>
                                                </div>
                                                <div class="col-auto">
                                                    <p class="avatar avatar-20 rounded-circle mb-0 bg-theme-1 small fs-12">2+</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="card-body py-0">
                                            <div class="coverimg height-80 rounded mb-2">
                                                <img src="assets/img/modern-ai-image/user-1-kid.jpg" class="w-100" alt="" />
                                            </div>
                                            <p class="w-100 text-truncated"><b>8:30AM</b> Best deals</p>
                                        </div>
                                        <div class="card-footer">
                                            <p class="text-theme-1 theme-green small">
                                                <i class="bi bi-check-circle-fill vm"></i> Added:
                                                <span class="ms-1 text-secondary"><i class="bi bi-image vm"></i></span>
                                                <span class="ms-1 text-secondary"><i class="bi bi-link vm"></i></span>
                                            </p>
                                        </div>
                                    </div>
                                </td>
                                <td></td>
                                <td class="bg-theme-1-subtle text-theme-1 theme-green"></td>
                                <td></td>
                                <td></td>
                                <td></td>
                                <td class="bg-theme-1-subtle text-theme-1"></td>
                            </tr>
                            <tr>
                                <td>9 AM</td>
                                <td class="bg-theme-1-subtle text-theme-1"></td>
                                <td></td>
                                <td class="bg-theme-1-subtle text-theme-1 theme-green"></td>
                                <td></td>
                                <td></td>
                                <td></td>
                                <td class="bg-theme-1-subtle text-theme-1"></td>
                            </tr>
                            <tr>
                                <td>10 AM</td>
                                <td class="bg-theme-1-subtle text-theme-1"></td>
                                <td></td>
                                <td class="bg-theme-1-subtle text-theme-1 theme-green"></td>
                                <td></td>
                                <td></td>
                                <td></td>
                                <td class="bg-theme-1-subtle text-theme-1"></td>
                            </tr>
                            <tr>
                                <td>11 AM</td>
                                <td class="bg-theme-1-subtle text-theme-1"></td>
                                <td></td>
                                <td class="bg-theme-1-subtle text-theme-1 theme-green"></td>
                                <td></td>
                                <td></td>
                                <td></td>
                                <td class="bg-theme-1-subtle text-theme-1"></td>
                            </tr>
                            <tr>
                                <td>12 PM</td>
                                <td class="bg-theme-1-subtle text-theme-1"></td>
                                <td></td>
                                <td class="bg-theme-1-subtle text-theme-1 theme-green"></td>
                                <td></td>
                                <td></td>
                                <td></td>
                                <td class="bg-theme-1-subtle text-theme-1"></td>
                            </tr>
                            <tr>
                                <td>1 PM</td>
                                <td class="bg-theme-1-subtle text-theme-1"></td>
                                <td></td>
                                <td class="bg-theme-1-subtle text-theme-1 theme-green"></td>
                                <td></td>
                                <td></td>
                                <td></td>
                                <td class="bg-theme-1-subtle text-theme-1"></td>
                            </tr>
                            <tr>
                                <td>2 PM</td>
                                <td class="bg-theme-1-subtle text-theme-1"></td>
                                <td></td>
                                <td class="bg-theme-1-subtle text-theme-1 theme-green"></td>
                                <td></td>
                                <td></td>
                                <td></td>
                                <td class="bg-theme-1-subtle text-theme-1"></td>
                            </tr>
                            <tr>
                                <td>3 PM</td>
                                <td class="bg-theme-1-subtle text-theme-1"></td>
                                <td></td>
                                <td class="bg-theme-1-subtle text-theme-1 theme-green"></td>
                                <td></td>
                                <td></td>
                                <td></td>
                                <td class="bg-theme-1-subtle text-theme-1"></td>
                            </tr>
                            <tr>
                                <td>4 PM</td>
                                <td class="bg-theme-1-subtle text-theme-1"></td>
                                <td></td>
                                <td class="bg-theme-1-subtle text-theme-1 theme-green"></td>
                                <td></td>
                                <td></td>
                                <td></td>
                                <td class="bg-theme-1-subtle text-theme-1"></td>
                            </tr>
                            <tr>
                                <td>5 PM</td>
                                <td class="bg-theme-1-subtle text-theme-1"></td>
                                <td></td>
                                <td class="bg-theme-1-subtle text-theme-1 theme-green"></td>
                                <td></td>
                                <td></td>
                                <td></td>
                                <td class="bg-theme-1-subtle text-theme-1"></td>
                            </tr>
                            <tr>
                                <td>6 PM</td>
                                <td class="bg-theme-1-subtle text-theme-1"></td>
                                <td></td>
                                <td class="bg-theme-1-subtle text-theme-1 theme-green"></td>
                                <td></td>
                                <td></td>
                                <td></td>
                                <td class="bg-theme-1-subtle text-theme-1"></td>
                            </tr>
                            <tr>
                                <td>7 PM</td>
                                <td class="bg-theme-1-subtle text-theme-1"></td>
                                <td></td>
                                <td class="bg-theme-1-subtle text-theme-1 theme-green"></td>
                                <td></td>
                                <td></td>
                                <td></td>
                                <td class="bg-theme-1-subtle text-theme-1"></td>
                            </tr>
                            <tr>
                                <td>8 PM</td>
                                <td class="bg-theme-1-subtle text-theme-1"></td>
                                <td></td>
                                <td class="bg-theme-1-subtle text-theme-1 theme-green"></td>
                                <td></td>
                                <td></td>
                                <td></td>
                                <td class="bg-theme-1-subtle text-theme-1"></td>
                            </tr>
                            <tr>
                                <td>9 PM</td>
                                <td class="bg-theme-1-subtle text-theme-1"></td>
                                <td></td>
                                <td class="bg-theme-1-subtle text-theme-1 theme-green"></td>
                                <td></td>
                                <td></td>
                                <td></td>
                                <td class="bg-theme-1-subtle text-theme-1"></td>
                            </tr>
                            <tr>
                                <td>10 PM</td>
                                <td class="bg-theme-1-subtle text-theme-1"></td>
                                <td></td>
                                <td class="bg-theme-1-subtle text-theme-1 theme-green"></td>
                                <td></td>
                                <td></td>
                                <td></td>
                                <td class="bg-theme-1-subtle text-theme-1"></td>
                            </tr>
                            <tr>
                                <td>11 PM</td>
                                <td class="bg-theme-1-subtle text-theme-1"></td>
                                <td></td>
                                <td class="bg-theme-1-subtle text-theme-1 theme-green"></td>
                                <td></td>
                                <td></td>
                                <td></td>
                                <td class="bg-theme-1-subtle text-theme-1"></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <!-- All post scheduled -->
                <div class="tab-pane fade" id="posts" role="tabpanel" aria-labelledby="posts-tab">
                    <div class="row gx-3">
                        <div class="col-12 col-md-4 col-lg-3 col-xxl-2 mb-3">
                            <div class="card adminuiux-card border-start border-theme-1 theme-green w-100">
                                <div class="card-header">
                                    <div class="row gx-3 align-items-center">
                                        <div class="col-auto avatar-group">
                                            <figure class="avatar avatar-20 rounded-circle bg-theme-1 theme-pink fs-12" data-bs-toggle="tooltip" data-bs-placement="top" title="" data-bs-original-title="Instagram">
                                                <i class="bi bi-instagram vm"></i>
                                            </figure>
                                            <figure class="avatar avatar-20 rounded-circle bg-theme-1 theme-blue fs-12" data-bs-toggle="tooltip" data-bs-placement="top" title="" data-bs-original-title="Facebook">
                                                <i class="bi bi-facebook vm"></i>
                                            </figure>
                                            <figure class="avatar avatar-20 rounded-circle bg-theme-1 theme-cyan fs-12" data-bs-toggle="tooltip" data-bs-placement="top" title="" data-bs-original-title="Twitter">
                                                <i class="bi bi-twitter vm"></i>
                                            </figure>
                                            <p class="avatar avatar-20 rounded-circle mb-0 bg-theme-1 small fs-12">2+</p>
                                        </div>
                                        <div class="col-auto">
                                            <div class="dropdown d-inline-block">
                                                <a class="btn btn-sm btn-link btn-square no-caret dropdown-toggle" data-bs-toggle="dropdown" aria-expanded="false" data-bs-display="static" role="button">
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
                                    <div class="coverimg height-100 rounded mb-3">
                                        <img src="assets/img/modern-ai-image/pet-3.jpg" class="w-100" alt="" />
                                    </div>
                                    <p><span class="badge badge-light text-bg-theme-1 theme-green">Scheduled</span></p>
                                    <p class="mw-100 text-truncated mb-0"><b>4:15 AM</b> 2 Feb 2022</p>
                                    <p class="text-truncate text-secondary small">Best experience at event of the best</p>
                                </div>
                                <div class="card-footer">
                                    <p class="text-theme-1 theme-green small">
                                        <i class="bi bi-check-circle-fill vm"></i> Added:
                                        <span class="ms-1 text-secondary"><i class="bi bi-image vm"></i></span>
                                        <span class="ms-1 text-secondary"><i class="bi bi-link vm"></i></span>
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div class="col-12 col-md-4 col-lg-3 col-xxl-2 mb-3">
                            <div class="card adminuiux-card border-start border-theme-1 theme-blue w-100">
                                <div class="card-header">
                                    <div class="row gx-3 align-items-center">
                                        <div class="col-auto avatar-group">
                                            <figure class="avatar avatar-20 rounded-circle bg-theme-1 theme-pink fs-12" data-bs-toggle="tooltip" data-bs-placement="top" title="" data-bs-original-title="Instagram">
                                                <i class="bi bi-instagram vm"></i>
                                            </figure>
                                            <figure class="avatar avatar-20 rounded-circle bg-theme-1 theme-blue fs-12" data-bs-toggle="tooltip" data-bs-placement="top" title="" data-bs-original-title="Facebook">
                                                <i class="bi bi-facebook vm"></i>
                                            </figure>
                                            <figure class="avatar avatar-20 rounded-circle bg-theme-1 theme-cyan fs-12" data-bs-toggle="tooltip" data-bs-placement="top" title="" data-bs-original-title="Twitter">
                                                <i class="bi bi-twitter vm"></i>
                                            </figure>
                                            <p class="avatar avatar-20 rounded-circle mb-0 bg-theme-1 small fs-12">2+</p>
                                        </div>
                                        <div class="col-auto">
                                            <div class="dropdown d-inline-block">
                                                <a class="btn btn-sm btn-link btn-square no-caret dropdown-toggle" data-bs-toggle="dropdown" aria-expanded="false" data-bs-display="static" role="button">
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
                                    <div class="coverimg height-100 rounded mb-3">
                                        <img src="assets/img/modern-ai-image/flamingo-2.jpg" class="w-100" alt="" />
                                    </div>
                                    <p><span class="badge badge-light text-bg-theme-1 theme-blue">Draft</span></p>
                                    <p class="mw-100 text-truncated mb-0"><b>3:15 AM</b> 3 Feb 2022</p>
                                    <p class="text-truncate text-secondary small">Build a business build tool</p>
                                </div>
                                <div class="card-footer">
                                    <p class="text-theme-1 theme-green small">
                                        <i class="bi bi-check-circle-fill vm"></i> Added:
                                        <span class="ms-1 text-secondary"><i class="bi bi-image vm"></i></span>
                                        <span class="ms-1 text-secondary"><i class="bi bi-link vm"></i></span>
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div class="col-12 col-md-4 col-lg-3 col-xxl-2 mb-3">
                            <div class="card adminuiux-card border-start border-theme-1 theme-green w-100">
                                <div class="card-header">
                                    <div class="row gx-3 align-items-center">
                                        <div class="col-auto avatar-group">
                                            <figure class="avatar avatar-20 rounded-circle bg-theme-1 theme-pink fs-12" data-bs-toggle="tooltip" data-bs-placement="top" title="" data-bs-original-title="Instagram">
                                                <i class="bi bi-instagram vm"></i>
                                            </figure>
                                            <figure class="avatar avatar-20 rounded-circle bg-theme-1 theme-blue fs-12" data-bs-toggle="tooltip" data-bs-placement="top" title="" data-bs-original-title="Facebook">
                                                <i class="bi bi-facebook vm"></i>
                                            </figure>
                                            <figure class="avatar avatar-20 rounded-circle bg-theme-1 theme-cyan fs-12" data-bs-toggle="tooltip" data-bs-placement="top" title="" data-bs-original-title="Twitter">
                                                <i class="bi bi-twitter vm"></i>
                                            </figure>
                                            <p class="avatar avatar-20 rounded-circle mb-0 bg-theme-1 small fs-12">2+</p>
                                        </div>
                                        <div class="col-auto">
                                            <div class="dropdown d-inline-block">
                                                <a class="btn btn-sm btn-link btn-square no-caret dropdown-toggle" data-bs-toggle="dropdown" aria-expanded="false" data-bs-display="static" role="button">
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
                                    <div class="coverimg height-100 rounded mb-3">
                                        <img src="assets/img/modern-ai-image/tree-4.jpg" class="w-100" alt="" />
                                    </div>
                                    <p><span class="badge badge-light text-bg-theme-1 theme-green">Scheduled</span></p>
                                    <p class="mw-100 text-truncated mb-0"><b>6:15 AM</b> 4 Feb 2022</p>
                                    <p class="text-truncate text-secondary small">Amazing view at desert point</p>
                                </div>
                                <div class="card-footer">
                                    <p class="text-theme-1 theme-green small">
                                        <i class="bi bi-check-circle-fill vm"></i> Added:
                                        <span class="ms-1 text-secondary"><i class="bi bi-image vm"></i></span>
                                        <span class="ms-1 text-secondary"><i class="bi bi-link vm"></i></span>
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div class="col-12 col-md-4 col-lg-3 col-xxl-2 mb-3">
                            <div class="card adminuiux-card border-start border-theme-1 theme-green w-100">
                                <div class="card-header">
                                    <div class="row gx-3 align-items-center">
                                        <div class="col-auto avatar-group">
                                            <figure class="avatar avatar-20 rounded-circle bg-theme-1 theme-pink fs-12" data-bs-toggle="tooltip" data-bs-placement="top" title="" data-bs-original-title="Instagram">
                                                <i class="bi bi-instagram vm"></i>
                                            </figure>
                                            <figure class="avatar avatar-20 rounded-circle bg-theme-1 theme-blue fs-12" data-bs-toggle="tooltip" data-bs-placement="top" title="" data-bs-original-title="Facebook">
                                                <i class="bi bi-facebook vm"></i>
                                            </figure>
                                            <figure class="avatar avatar-20 rounded-circle bg-theme-1 theme-cyan fs-12" data-bs-toggle="tooltip" data-bs-placement="top" title="" data-bs-original-title="Twitter">
                                                <i class="bi bi-twitter vm"></i>
                                            </figure>
                                            <p class="avatar avatar-20 rounded-circle mb-0 bg-theme-1 small fs-12">2+</p>
                                        </div>
                                        <div class="col-auto">
                                            <div class="dropdown d-inline-block">
                                                <a class="btn btn-sm btn-link btn-square no-caret dropdown-toggle" data-bs-toggle="dropdown" aria-expanded="false" data-bs-display="static" role="button">
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
                                    <div class="coverimg height-100 rounded mb-3">
                                        <img src="assets/img/modern-ai-image/kids-2.jpg" class="w-100" alt="" />
                                    </div>
                                    <p><span class="badge badge-light text-bg-theme-1 theme-green">Scheduled</span></p>
                                    <p class="mw-100 text-truncated mb-0"><b>12:30 AM</b> 7 Feb 2022</p>
                                    <p class="text-truncate text-secondary small">Round and round all comes</p>
                                </div>
                                <div class="card-footer">
                                    <p class="text-theme-1 theme-green small">
                                        <i class="bi bi-check-circle-fill vm"></i> Added:
                                        <span class="ms-1 text-secondary"><i class="bi bi-image vm"></i></span>
                                        <span class="ms-1 text-secondary"><i class="bi bi-link vm"></i></span>
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div class="col-12 col-md-4 col-lg-3 col-xxl-2 mb-3">
                            <div class="card adminuiux-card border-start border-theme-1 theme-yellow w-100">
                                <div class="card-header">
                                    <div class="row gx-3 align-items-center">
                                        <div class="col-auto avatar-group">
                                            <figure class="avatar avatar-20 rounded-circle bg-theme-1 theme-pink fs-12" data-bs-toggle="tooltip" data-bs-placement="top" title="" data-bs-original-title="Instagram">
                                                <i class="bi bi-instagram vm"></i>
                                            </figure>
                                            <figure class="avatar avatar-20 rounded-circle bg-theme-1 theme-blue fs-12" data-bs-toggle="tooltip" data-bs-placement="top" title="" data-bs-original-title="Facebook">
                                                <i class="bi bi-facebook vm"></i>
                                            </figure>
                                            <figure class="avatar avatar-20 rounded-circle bg-theme-1 theme-cyan fs-12" data-bs-toggle="tooltip" data-bs-placement="top" title="" data-bs-original-title="Twitter">
                                                <i class="bi bi-twitter vm"></i>
                                            </figure>
                                            <p class="avatar avatar-20 rounded-circle mb-0 bg-theme-1 small fs-12">2+</p>
                                        </div>
                                        <div class="col-auto">
                                            <div class="dropdown d-inline-block">
                                                <a class="btn btn-sm btn-link btn-square no-caret dropdown-toggle" data-bs-toggle="dropdown" aria-expanded="false" data-bs-display="static" role="button">
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
                                    <div class="coverimg height-100 rounded mb-3">
                                        <img src="assets/img/modern-ai-image/pet-3.jpg" class="w-100" alt="" />
                                    </div>
                                    <p><span class="badge badge-light text-bg-theme-1 theme-yellow">Error</span></p>
                                    <p class="mw-100 text-truncated mb-0"><b>4:15 AM</b> 2 Feb 2022</p>
                                    <p class="text-truncate text-secondary small">Best experience at event of the best</p>
                                </div>
                                <div class="card-footer">
                                    <p class="text-theme-1 theme-green small">
                                        <i class="bi bi-check-circle-fill vm"></i> Added:
                                        <span class="ms-1 text-secondary"><i class="bi bi-image vm"></i></span>
                                        <span class="ms-1 text-secondary"><i class="bi bi-link vm"></i></span>
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div class="col-12 col-md-4 col-lg-3 col-xxl-2 mb-3">
                            <div class="card adminuiux-card border-start border-theme-1 theme-green w-100">
                                <div class="card-header">
                                    <div class="row gx-3 align-items-center">
                                        <div class="col-auto avatar-group">
                                            <figure class="avatar avatar-20 rounded-circle bg-theme-1 theme-pink fs-12" data-bs-toggle="tooltip" data-bs-placement="top" title="" data-bs-original-title="Instagram">
                                                <i class="bi bi-instagram vm"></i>
                                            </figure>
                                            <figure class="avatar avatar-20 rounded-circle bg-theme-1 theme-blue fs-12" data-bs-toggle="tooltip" data-bs-placement="top" title="" data-bs-original-title="Facebook">
                                                <i class="bi bi-facebook vm"></i>
                                            </figure>
                                            <figure class="avatar avatar-20 rounded-circle bg-theme-1 theme-cyan fs-12" data-bs-toggle="tooltip" data-bs-placement="top" title="" data-bs-original-title="Twitter">
                                                <i class="bi bi-twitter vm"></i>
                                            </figure>
                                            <p class="avatar avatar-20 rounded-circle mb-0 bg-theme-1 small fs-12">2+</p>
                                        </div>
                                        <div class="col-auto">
                                            <div class="dropdown d-inline-block">
                                                <a class="btn btn-sm btn-link btn-square no-caret dropdown-toggle" data-bs-toggle="dropdown" aria-expanded="false" data-bs-display="static" role="button">
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
                                    <div class="coverimg height-100 rounded mb-3">
                                        <img src="assets/img/modern-ai-image/flamingo-2.jpg" class="w-100" alt="" />
                                    </div>
                                    <p><span class="badge badge-light text-bg-theme-1 theme-green">Scheduled</span></p>
                                    <p class="mw-100 text-truncated mb-0"><b>3:15 AM</b> 3 Feb 2022</p>
                                    <p class="text-truncate text-secondary small">Build a business build tool</p>
                                </div>
                                <div class="card-footer">
                                    <p class="text-theme-1 theme-green small">
                                        <i class="bi bi-check-circle-fill vm"></i> Added:
                                        <span class="ms-1 text-secondary"><i class="bi bi-image vm"></i></span>
                                        <span class="ms-1 text-secondary"><i class="bi bi-link vm"></i></span>
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div class="col-12 col-md-4 col-lg-3 col-xxl-2 mb-3">
                            <div class="card adminuiux-card border-start border-theme-1 theme-blue w-100">
                                <div class="card-header">
                                    <div class="row gx-3 align-items-center">
                                        <div class="col-auto avatar-group">
                                            <figure class="avatar avatar-20 rounded-circle bg-theme-1 theme-pink fs-12" data-bs-toggle="tooltip" data-bs-placement="top" title="" data-bs-original-title="Instagram">
                                                <i class="bi bi-instagram vm"></i>
                                            </figure>
                                            <figure class="avatar avatar-20 rounded-circle bg-theme-1 theme-blue fs-12" data-bs-toggle="tooltip" data-bs-placement="top" title="" data-bs-original-title="Facebook">
                                                <i class="bi bi-facebook vm"></i>
                                            </figure>
                                            <figure class="avatar avatar-20 rounded-circle bg-theme-1 theme-cyan fs-12" data-bs-toggle="tooltip" data-bs-placement="top" title="" data-bs-original-title="Twitter">
                                                <i class="bi bi-twitter vm"></i>
                                            </figure>
                                            <p class="avatar avatar-20 rounded-circle mb-0 bg-theme-1 small fs-12">2+</p>
                                        </div>
                                        <div class="col-auto">
                                            <div class="dropdown d-inline-block">
                                                <a class="btn btn-sm btn-link btn-square no-caret dropdown-toggle" data-bs-toggle="dropdown" aria-expanded="false" data-bs-display="static" role="button">
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
                                    <div class="coverimg height-100 rounded mb-3">
                                        <img src="assets/img/modern-ai-image/tree-4.jpg" class="w-100" alt="" />
                                    </div>
                                    <p><span class="badge badge-light text-bg-theme-1 theme-blue">Draft</span></p>
                                    <p class="mw-100 text-truncated mb-0"><b>6:15 AM</b> 4 Feb 2022</p>
                                    <p class="text-truncate text-secondary small">Amazing view at desert point</p>
                                </div>
                                <div class="card-footer">
                                    <p class="text-theme-1 theme-green small">
                                        <i class="bi bi-check-circle-fill vm"></i> Added:
                                        <span class="ms-1 text-secondary"><i class="bi bi-image vm"></i></span>
                                        <span class="ms-1 text-secondary"><i class="bi bi-link vm"></i></span>
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div class="col-12 col-md-4 col-lg-3 col-xxl-2 mb-3">
                            <div class="card adminuiux-card border-start border-theme-1 theme-red w-100">
                                <div class="card-header">
                                    <div class="row gx-3 align-items-center">
                                        <div class="col-auto avatar-group">
                                            <figure class="avatar avatar-20 rounded-circle bg-theme-1 theme-pink fs-12" data-bs-toggle="tooltip" data-bs-placement="top" title="" data-bs-original-title="Instagram">
                                                <i class="bi bi-instagram vm"></i>
                                            </figure>
                                            <figure class="avatar avatar-20 rounded-circle bg-theme-1 theme-blue fs-12" data-bs-toggle="tooltip" data-bs-placement="top" title="" data-bs-original-title="Facebook">
                                                <i class="bi bi-facebook vm"></i>
                                            </figure>
                                            <figure class="avatar avatar-20 rounded-circle bg-theme-1 theme-cyan fs-12" data-bs-toggle="tooltip" data-bs-placement="top" title="" data-bs-original-title="Twitter">
                                                <i class="bi bi-twitter vm"></i>
                                            </figure>
                                            <p class="avatar avatar-20 rounded-circle mb-0 bg-theme-1 small fs-12">2+</p>
                                        </div>
                                        <div class="col-auto">
                                            <div class="dropdown d-inline-block">
                                                <a class="btn btn-sm btn-link btn-square no-caret dropdown-toggle" data-bs-toggle="dropdown" aria-expanded="false" data-bs-display="static" role="button">
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
                                    <div class="coverimg height-100 rounded mb-3">
                                        <img src="assets/img/modern-ai-image/kids-2.jpg" class="w-100" alt="" />
                                    </div>
                                    <p><span class="badge badge-light text-bg-theme-1 theme-red">Rejected/Failed</span></p>
                                    <p class="mw-100 text-truncated mb-0"><b>12:30 AM</b> 7 Feb 2022</p>
                                    <p class="text-truncate text-secondary small">Round and round all comes</p>
                                </div>
                                <div class="card-footer">
                                    <p class="text-theme-1 theme-green small">
                                        <i class="bi bi-check-circle-fill vm"></i> Added:
                                        <span class="ms-1 text-secondary"><i class="bi bi-image vm"></i></span>
                                        <span class="ms-1 text-secondary"><i class="bi bi-link vm"></i></span>
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="row gx-3 mb-3 mb-lg-4">
                <div class="col text-center py-3">
                    <h4>Stay connected with <span class="text-gradient">Scheduling and stay updated</span> with trend</h4>
                    <p class="text-secondary">Important things done on or before right time is most important part of Business and Life.</p>
                </div>
            </div>
        </div>
        <div class="container">
            <div class="row gx-3 gx-lg-4">
                <div class="col-auto mb-4">
                    <div class="card adminuiux-card mb-3 mb-lg-4">
                        <div class="card-body p-0">
                            <app-date-picker-inline></app-date-picker-inline>
                        </div>
                    </div>
                </div>
                <div class="col-12 col-md-6 col-lg-6 col-xl-4 col-xxl-3">
                    <div class="card adminuiux-card bg-theme-r-gradient">
                        <div class="card-header bg-none">
                            <div class="row gx-3 align-items-center">
                                <div class="col-auto">
                                    <i class="bi bi-binoculars h5 avatar avatar-40 bg-white-opacity text-white rounded"></i>
                                </div>
                                <div class="col">
                                    <h6 class="mb-0">Top Story</h6>
                                    <p class="opacity-75">This year</p>
                                </div>
                            </div>
                        </div>
                        <div class="card-body">
                            <figure class="coverimg rounded w-100 height-150 mb-3">
                                <img src="assets/img/modern-ai-image/pet-1.jpg" alt="" class="mw-100" style="display: none;" />
                            </figure>
                            <div class="row gx-3 align-items-center">
                                <div class="col-auto">
                                    <i class="bi bi-twitter h1 avatar avatar-60 bg-cyan rounded mb-0"> </i>
                                </div>
                                <div class="col">
                                    <p class="opacity-75 small mb-1">Engaged Audience</p>
                                    <h5 class="mb-0">2,545,05</h5>
                                    <p class="small">(1.83%)</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <!--charts category summary-->
                <div class="col mb-4">
                    <div class="card adminuiux-card shadow-sm">
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
                            <figure class="coverimg rounded w-100 height-120 mb-3">
                                <img src="assets/img/modern-ai-image/taxi-1.jpg" alt="" class="mw-100" style="display: none;" />
                            </figure>
                            <div class="row gx-3 align-items-center">
                                <div class="col-5 col-md-6">
                                    <app-area-blue-chartjs-100 class="height-100 d-block mb-3"></app-area-blue-chartjs-100>
                                </div>
                                <div class="col-7 col-md-6">
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
                </div>
                <div class="col-12 col-md-6 col-lg-6 col-xl-4 col-xxl-3">
                    <div class="card adminuiux-card shadow-sm">
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
                        <div class="card-body ">
                            <figure class="coverimg rounded w-100 height-100 mb-3">
                                <img src="assets/img/modern-ai-image/flamingo-2.jpg" alt="" class="mw-100" />
                            </figure>
                            <div class="row gx-3 align-items-center mb-3">
                                <div class="col">
                                    <p class="text-secondary small mb-0">Boosted Post</p>
                                    <h5 class="mb-0">2,545,05</h5>
                                    <p class="text-secondary small">People Reached</p>
                                </div>
                            </div>

                            <div class="row gx-3">
                                <div class="col">
                                    <p class="text-secondary small mb-0">Likes</p>
                                    <h6>65.35 k</h6>
                                </div>
                                <div class="col">
                                    <p class="text-secondary small mb-0">Retweet</p>
                                    <h6>12.5 k</h6>
                                </div>
                                <div class="col">
                                    <p class="text-secondary small mb-0">Clicks</p>
                                    <h6>85.01 k</h6>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- write post -->
        <div class="modal fade" id="writepost" tabindex="-1" aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered ">
                <div class="modal-content">
                    <div class="modal-header d-block">
                        <div class="row gx-3 align-items-center">
                            <div class="col-auto">
                                <i class="bi bi-pencil-square h5 avatar avatar-40 bg-theme-1-subtle text-theme-1 rounded"></i>
                            </div>
                            <div class="col">
                                <h6 class="mb-0">Write Post</h6>
                                <p class="small text-secondary">Write and schedule post</p>
                            </div>
                            <div class="col-auto">
                                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                            </div>
                        </div>
                    </div>
                    <div class="modal-body">
                        <h6 class="mb-2">Select Channel to post:</h6>
                        <div class="input-group input-group-md rounded mb-3" style="--mw-dynamic: calc(100% - 44px )">
                            <span class="input-group-text text-theme-1"><i class="bi bi-newspaper"></i></span>
                            <div class="choices maxwidth-dynamic" data-type="select-multiple" role="combobox" aria-autocomplete="list" aria-haspopup="true" aria-expanded="false">
                                <div class="choices__inner">
                                    <select class="choices choices__input" multiple="" hidden="" tabindex="-1" data-choice="active">
                                        <option selected="">Instagram</option>
                                        <option>Facebook</option>
                                        <option>Twitter</option>
                                        <option>Blog</option>
                                        <option>Task</option>
                                        <option>Story</option>
                                    </select>
                                    <div class="choices__list choices__list--multiple" role="listbox">
                                        <div class="choices__item choices__item--selectable" data-item="" data-id="1" data-value="Instagram" aria-selected="true" role="option" data-deletable="">Instagram<button type="button" class="choices__button" aria-label="Remove item: Instagram" data-button="">Remove item</button></div>
                                    </div>
                                    <input type="search" class="choices__input choices__input--cloned" autocomplete="off" autocapitalize="off" spellcheck="false" aria-autocomplete="list" style="min-width: 1ch; width: 1ch;" />
                                </div>
                                <div class="choices__list choices__list--dropdown" aria-expanded="false">
                                    <div class="choices__list" aria-multiselectable="true" role="listbox">
                                        <div id="choices--xuh9-item-choice-4" class="choices__item choices__item--choice choices__item--selectable is-highlighted" role="option" data-choice="" data-id="4" data-value="Blog" data-select-text="Select" data-choice-selectable="" aria-selected="true">Blog</div>
                                        <div id="choices--xuh9-item-choice-2" class="choices__item choices__item--choice choices__item--selectable" role="option" data-choice="" data-id="2" data-value="Facebook" data-select-text="Select" data-choice-selectable="">Facebook</div>
                                        <div id="choices--xuh9-item-choice-6" class="choices__item choices__item--choice choices__item--selectable" role="option" data-choice="" data-id="6" data-value="Story" data-select-text="Select" data-choice-selectable="">Story</div>
                                        <div id="choices--xuh9-item-choice-5" class="choices__item choices__item--choice choices__item--selectable" role="option" data-choice="" data-id="5" data-value="Task" data-select-text="Select" data-choice-selectable="">Task</div>
                                        <div id="choices--xuh9-item-choice-3" class="choices__item choices__item--choice choices__item--selectable" role="option" data-choice="" data-id="3" data-value="Twitter" data-select-text="Select" data-choice-selectable="">Twitter</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="row gx-3 mb-2">
                            <div class="col">
                                <h6>Write Content:</h6>
                            </div>
                            <div class="col-auto">
                                <h6>0 <small class="text-secondary fw-normal">characters</small></h6>
                            </div>
                        </div>
                        <div class="form-group rounded mb-3">
                            <textarea class="form-control" rows="4" id="textareaeditor"></textarea>
                        </div>
                        <h6>Upload Image:</h6>
                        <div class="input-group input-group-md rounded">
                            <span class="input-group-text text-theme-1"><i class="bi bi-bank"></i></span>
                            <input class="form-control" type="file" />
                        </div>
                    </div>
                    <div class="modal-footer">
                        <div class="col-auto m-0">
                            <div class="input-group input-group-md">
                                <span class="input-group-text text-theme-1"><i class="bi bi-calendar-event"></i></span>
                                <input type="text" class="form-control" value="" id="datepicker2" />
                            </div>
                        </div>
                        <div class="col-auto m-0 ms-auto">
                            <button type="button" class="btn btn-theme w-100">Schedule now</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `,
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class SocialSchedularComponent {
    @ViewChild("choices") mySelect!: ElementRef;
    @ViewChild("scheduleTable") scheduleTableRef!: ElementRef<HTMLTableElement>;
    @ViewChild("thead") theadRef!: ElementRef<HTMLTableSectionElement>;
    @ViewChild("tbody") tbodyRef!: ElementRef<HTMLTableSectionElement>;
    @ViewChild("cellElement") cellElementRef!: ElementRef<HTMLTableSectionElement>;

    // State to manage the dynamically shown dropdown for add event
    showDropdownForCell: HTMLElement | null = null;
    dropdownRowText: string = "";

    private isScrolling: boolean = false; // Flag for scroll synchronization
    private resizeListener!: () => void;
    private scrollListener!: () => void;

    constructor(private renderer: Renderer2) {}

    ngAfterViewInit() {
        const choices = new Choices(this.mySelect.nativeElement, {
            searchEnabled: true,
            removeItemButton: true,
            classNames: {
                containerOuter: ["choices", "maxwidth-dynamic"],
            } as ClassNames,
            placeholderValue: "Type...",
        });

        // static thead on scroll
        if (this.scheduleTableRef && this.theadRef && this.tbodyRef) {
            setTimeout(() => {
                this.setColumnWidths();
                this.handleScroll();
            }, 100);

            // Attach scroll synchronization listeners
            this.renderer.listen(this.theadRef.nativeElement, "scroll", this.onTheadScroll.bind(this));
            this.renderer.listen(this.tbodyRef.nativeElement, "scroll", this.onTbodyScroll.bind(this));

            // Attach global window listeners
            this.resizeListener = this.renderer.listen(window, "resize", () => {
                this.setColumnWidths();
                this.handleScroll();
            });
            this.scrollListener = this.renderer.listen(window, "scroll", this.handleScroll.bind(this));
        } else {
            console.error("Table elements not found. Ensure #scheduleTable, #thead, #tbody template references are correct.");
        }
    }
    ngOnDestroy(): void {
        if (this.resizeListener) {
            this.resizeListener();
        }
        if (this.scrollListener) {
            this.scrollListener();
        }
    }
    setColumnWidths(): void {
        const scheduleTable = this.scheduleTableRef.nativeElement;
        const thead = this.theadRef.nativeElement;
        const tbody = this.tbodyRef.nativeElement;

        const tableWidth = scheduleTable.offsetWidth;
        const firstColWidth = 60; // Fixed width for the first column
        const availableWidth = tableWidth - firstColWidth;
        const numCols = 7; // Assuming 7 days/columns
        const colWidth = availableWidth / numCols;

        // Apply width to header cells
        const headerCells = thead.querySelectorAll("th:not(.first-child)");
        headerCells.forEach((th) => {
            this.renderer.setStyle(th, "width", `${colWidth}px`);
        });

        // Apply width to body cells
        const bodyCells = tbody.querySelectorAll("td:not(.first-child)");
        bodyCells.forEach((td) => {
            this.renderer.setStyle(td, "width", `${colWidth}px`);
        });

        // Ensure first column headers and cells also have their fixed width
        const firstHeader = thead.querySelector("th.first-child");
        if (firstHeader) {
            this.renderer.setStyle(firstHeader, "width", `${firstColWidth}px`);
        }
        const firstCells = tbody.querySelectorAll("td.first-child");
        firstCells.forEach((td) => {
            this.renderer.setStyle(td, "width", `${firstColWidth}px`);
        });
    }

    onTheadScroll(event: Event): void {
        if (!this.isScrolling) {
            this.isScrolling = true;
            this.renderer.setProperty(this.tbodyRef.nativeElement, "scrollLeft", (event.target as HTMLElement).scrollLeft);
            requestAnimationFrame(() => {
                this.isScrolling = false;
            });
        }
    }

    onTbodyScroll(event: Event): void {
        if (!this.isScrolling) {
            this.isScrolling = true;
            this.renderer.setProperty(this.theadRef.nativeElement, "scrollLeft", (event.target as HTMLElement).scrollLeft);
            requestAnimationFrame(() => {
                this.isScrolling = false;
            });
        }
    }
    handleScroll(): void {
        const scheduleTable = this.scheduleTableRef.nativeElement;
        const thead = this.theadRef.nativeElement;
        const tbody = this.tbodyRef.nativeElement;

        // Get navbar height (assuming it's a fixed element outside this component)
        const navbarElement = document.querySelector(".adminuiux-header .navbar") as HTMLElement;
        const navbarHeight = navbarElement ? navbarElement.offsetHeight : 0;

        const scrollTop = window.scrollY;
        const tableRect = scheduleTable.getBoundingClientRect();
        const currentTableTop = tableRect.top + window.scrollY;
        const tableHeight = scheduleTable.offsetHeight;

        // Check if the table header should be sticky
        if (scrollTop > currentTableTop - navbarHeight - 90 && scrollTop < currentTableTop + tableHeight - navbarHeight - 90) {
            this.renderer.addClass(thead, "position-fixed");
            this.renderer.addClass(thead, "bg-r-gradient"); // Custom background class
            this.renderer.addClass(thead, "shadow");

            this.renderer.setStyle(thead, "top", `${navbarHeight}px`);
            this.renderer.setStyle(thead, "left", `${tableRect.left}px`);
            this.renderer.setStyle(thead, "width", `${tableRect.width}px`);

            // Add margin to tbody to prevent content jump
            this.renderer.setStyle(tbody, "margin-top", `${thead.offsetHeight}px`);
        } else {
            this.renderer.removeClass(thead, "position-fixed");
            this.renderer.removeClass(thead, "bg-r-gradient");
            this.renderer.removeClass(thead, "shadow");

            this.renderer.removeStyle(thead, "top");
            this.renderer.removeStyle(thead, "left");
            this.renderer.removeStyle(thead, "width");

            // Remove margin from tbody
            this.renderer.removeStyle(tbody, "margin-top");
        }
    }
}
