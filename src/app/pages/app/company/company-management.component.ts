import { Component, OnInit, AfterViewInit, AfterContentChecked, OnDestroy, ViewChild, ElementRef, CUSTOM_ELEMENTS_SCHEMA } from "@angular/core";
import { RouterLink } from "@angular/router";
import Choices, { ClassNames } from "choices.js";

import { DaterangePickerRangesComponent } from "../../../components/input-fields/daterange-picker/daterange-picker-ranges.component";
import { DoughnutChartjs100Component } from "../../../components/charts/doughnut-chartjs-100.component";
import { DoughnutChartjs1002Component } from "../../../components/charts/doughnut-chartjs-100-2.component";

@Component({
    selector: "app-company-management",
    standalone: true,
    imports: [RouterLink, DaterangePickerRangesComponent, DoughnutChartjs100Component, DoughnutChartjs1002Component],
    template: `
        <!-- page title -->
        <div class="container-fluid py-3">
            <div class="row gx-3 gx-lg-4 align-items-center page-title">
                <div class="col col-sm mb-3 mb-sm-0 order-1">
                    <h5 class="mb-0">Management</h5>
                    <p class="text-secondary small">Plan your Resources as Plan your Projects</p>
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
                    <li class="breadcrumb-item bi"><a routerLink="/app/company-profile"> Company</a></li>
                    <li class="breadcrumb-item bi active" aria-current="page">Management</li>
                </ol>
            </nav>
        </div>

        <!-- content -->
        <div class="container mt-3" id="main-content">
            <div class="card adminuiux-card position-relative bg-theme-1 text-white z-index-0 overflow-hidden mb-3 mb-lg-4">
                <div class="coverimg w-100 h-100 position-absolute top-0 start-0 opacity-50 z-index-0">
                    <img src="assets/img/background-image/backgorund-image-13.jpg" class="" alt="" />
                </div>
                <div class="card-body z-index-1 position-relative">
                    <div class="row gx-3 gx-lg-4 mb-3 mb-lg-4 mt-3 mt-lg-4">
                        <div class="col-12 col-md-6 col-lg-3 position-relative mb-4 mb-lg-0">
                            <div class="row gx-3 align-items-center mb-3 mb-lg-4">
                                <div class="col-auto">
                                    <i class="bi bi-calendar-event h5 avatar avatar-40 bg-theme-1 theme-green rounded"></i>
                                </div>
                                <div class="col">
                                    <h6 class="mb-1">Total Days</h6>
                                    <p class="opacity-75 small">Total Working days & past</p>
                                </div>
                            </div>
                            <div class="row gx-3">
                                <div class="col">
                                    <p class="opacity-75 small mb-1">Total</p>
                                    <h3 class="mb-0">31</h3>
                                </div>
                                <div class="col">
                                    <p class="opacity-75 small mb-1">Working</p>
                                    <h3 class="mb-0">22</h3>
                                </div>
                                <div class="col">
                                    <p class="opacity-75 small mb-1">Past</p>
                                    <h3 class="mb-0">10</h3>
                                </div>
                            </div>
                        </div>
                        <div class="col-12 col-md-6 col-lg-3 position-relative mb-4 mb-lg-0">
                            <div class="row gx-3 align-items-center mb-3 mb-lg-4">
                                <div class="col-auto">
                                    <i class="bi bi-stars h5 avatar avatar-40 bg-theme-1 theme-yellow rounded"></i>
                                </div>
                                <div class="col">
                                    <h6 class="mb-1">Holidays</h6>
                                    <p class="opacity-75 small">Days Office closed</p>
                                </div>
                            </div>
                            <div class="row gx-3">
                                <div class="col">
                                    <p class="opacity-75 small mb-1">Total</p>
                                    <h3 class="mb-0">2</h3>
                                </div>
                                <div class="col">
                                    <p class="opacity-75 small mb-1">Working</p>
                                    <h3 class="mb-0">1</h3>
                                </div>
                                <div class="col">
                                    <p class="opacity-75 small mb-1">Closed</p>
                                    <h3 class="mb-0">1</h3>
                                </div>
                            </div>
                        </div>
                        <div class="col-12 col-md-6 col-lg-3 position-relative mb-4 mb-lg-0">
                            <div class="row gx-3 align-items-center mb-3 mb-lg-4">
                                <div class="col-auto">
                                    <i class="bi bi-balloon-heart h5 avatar avatar-40 bg-theme-1 theme-pink rounded"></i>
                                </div>
                                <div class="col">
                                    <h6 class="mb-1">Special Days</h6>
                                    <p class="opacity-75 small">Birthday or Any Celebration</p>
                                </div>
                            </div>
                            <div class="row gx-3">
                                <div class="col">
                                    <p class="opacity-75 small mb-1">Total</p>
                                    <h3 class="mb-0">2</h3>
                                </div>
                                <div class="col">
                                    <p class="opacity-75 small mb-1">Working</p>
                                    <h3 class="mb-0">2</h3>
                                </div>
                                <div class="col">
                                    <p class="opacity-75 small mb-1">Past</p>
                                    <h3 class="mb-0">1</h3>
                                </div>
                            </div>
                        </div>
                        <div class="col-12 col-md-6 col-lg-3 position-relative mb-4 mb-lg-0">
                            <div class="row gx-3 align-items-center mb-3 mb-lg-4">
                                <div class="col-auto">
                                    <i class="bi bi-house-door h5 avatar avatar-40 bg-theme-1 theme-purple rounded"></i>
                                </div>
                                <div class="col">
                                    <h6 class="mb-1">Work from Home</h6>
                                    <p class="opacity-75 small mb-1">Days of working from home</p>
                                </div>
                            </div>
                            <div class="row gx-3">
                                <div class="col">
                                    <p class="opacity-75 small mb-1">Total</p>
                                    <h3 class="mb-0">8</h3>
                                </div>
                                <div class="col">
                                    <p class="opacity-75 small mb-1">Available</p>
                                    <h3 class="mb-0">4</h3>
                                </div>
                                <div class="col">
                                    <p class="opacity-75 small mb-1">Completed</p>
                                    <h3 class="mb-0">4</h3>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="card adminuiux-card bg-l-gradient-light theme-pink">
                        <div class="card-body">
                            <div class="row gx-3 align-items-center">
                                <div class="col-auto">
                                    <div class="avatar avatar-60 h3 rounded-circle bg-theme-1-subtle text-theme-1">
                                        <i class="bi bi-balloon-heart"></i>
                                    </div>
                                </div>
                                <div class="col">
                                    <a routerLink="/app/profile-professional" class="badge badge-lg badge-light text-bg-theme-1 rounded-5 mb-2 me-2">
                                        <figure class="avatar avatar-20 rounded-circle me-1 coverimg">
                                            <img src="assets/img/modern-ai-image/user-4.jpg" alt="" />
                                        </figure>
                                        James Wang
                                        <i class="bi bi-chat-right-dots vm avatar avatar-20"></i>
                                    </a>
                                    <a routerLink="/app/profile-professional" class="badge badge-lg badge-light text-bg-theme-1 rounded-5 mb-2 me-2">
                                        <figure class="avatar avatar-20 rounded-circle me-1 coverimg">
                                            <img src="assets/img/modern-ai-image/user-2.jpg" alt="" />
                                        </figure>
                                        Millie Tyson
                                        <i class="bi bi-chat-right-dots vm avatar avatar-20"></i>
                                    </a>
                                    <h5>Your 1 Teammate and our CEO's <span class="text-gradient">birthday</span> today.</h5>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="row gx-3 gx-lg-4">
                <div class="col-12 col-md-12 col-lg-5 col-xl-4 col-xxl-3">
                    <div class="row gx-3">
                        <div class="col-12 col-sm-12 col-md-6 col-lg-12">
                            <div class="card adminuiux-card bg-l-gradient-light theme-blue mb-3 mb-lg-4">
                                <div class="card-header">
                                    <div class="row gx-2 align-items-center">
                                        <div class="col-auto">
                                            <i class="bi bi-calendar-week h5 me-1 avatar avatar-40 bg-theme-1-subtle text-theme-1 rounded me-2"></i>
                                        </div>
                                        <div class="col">
                                            <h6 class="mb-1">Daily Status</h6>
                                            <p class="text-secondary">Manage availability</p>
                                        </div>
                                    </div>
                                </div>
                                <div class="card-footer px-0 pt-0">
                                    <div class="row gx-3 align-items-center text-center mx-0 mb-3">
                                        <div class="col-auto">
                                            <button class="btn btn-sm btn-square btn-link">
                                                <i class="bi bi-chevron-left"></i>
                                            </button>
                                        </div>
                                        <div class="col">
                                            <h6>June 2022</h6>
                                        </div>
                                        <div class="col-auto">
                                            <button class="btn btn-sm btn-square btn-link">
                                                <i class="bi bi-chevron-right"></i>
                                            </button>
                                        </div>
                                    </div>

                                    <div class="row gx-1 mb-3">
                                        <div class="col text-center">
                                            <p class="small text-secondary">S</p>
                                            <button class="btn btn-sm btn-square rounded-circle btn-outline-theme">19</button>
                                        </div>
                                        <div class="col text-center">
                                            <p class="small text-secondary">M</p>
                                            <button class="btn btn-sm btn-square rounded-circle btn-outline-theme active">20</button>
                                        </div>
                                        <div class="col text-center">
                                            <p class="small text-secondary">T</p>
                                            <button class="btn btn-sm btn-square rounded-circle btn-outline-theme">21</button>
                                        </div>
                                        <div class="col text-center">
                                            <p class="small text-secondary">W</p>
                                            <button class="btn btn-sm btn-square rounded-circle btn-outline-theme">22</button>
                                        </div>
                                        <div class="col text-center">
                                            <p class="small text-secondary">T</p>
                                            <button class="btn btn-sm btn-square rounded-circle btn-outline-theme">23</button>
                                        </div>
                                        <div class="col text-center">
                                            <p class="small text-secondary">F</p>
                                            <button class="btn btn-sm btn-square rounded-circle btn-outline-theme">24</button>
                                        </div>
                                        <div class="col text-center">
                                            <p class="small text-secondary">S</p>
                                            <button class="btn btn-sm btn-square rounded-circle btn-outline-theme">25</button>
                                        </div>
                                    </div>
                                    <ul class="list-group border-0 bg-none">
                                        <li class="list-group-item">
                                            <div class="row text-secondary">
                                                <div class="col"><s>Create UI design</s></div>
                                                <div class="col-auto"><input class="form-check-input" type="checkbox" value="" aria-label="..." checked="" /></div>
                                            </div>
                                        </li>
                                        <li class="list-group-item">
                                            <div class="row text-secondary">
                                                <div class="col"><s>Create HTML Structure</s></div>
                                                <div class="col-auto"><input class="form-check-input" type="checkbox" value="" aria-label="..." checked="" /></div>
                                            </div>
                                        </li>
                                        <li class="list-group-item">
                                            <div class="row gx-3">
                                                <div class="col">Start Development</div>
                                                <div class="col-auto"><input class="form-check-input" type="checkbox" value="" aria-label="..." checked /></div>
                                            </div>
                                        </li>
                                        <li class="list-group-item">
                                            <div class="row gx-3">
                                                <div class="col">Customize 3rd parties</div>
                                                <div class="col-auto"><input class="form-check-input" type="checkbox" value="" aria-label="..." /></div>
                                            </div>
                                        </li>
                                    </ul>
                                </div>
                                <div class="card-footer justify-content-center">
                                    <div class="row gx-3">
                                        <div class="col">
                                            <a href="" class="btn btn-sm btn-theme">Update</a>
                                        </div>
                                        <div class="col-auto">
                                            <a href="" class="btn btn-sm btn-link text-theme-1">Create <i class="bi bi-plus vm"></i></a>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="col-12 col-sm-12 col-md-6 col-lg-12">
                            <div class="row gx-3 align-items-center mb-3 mb-lg-4">
                                <div class="col">
                                    <h5>Leave Requests</h5>
                                </div>
                                <div class="col-auto">
                                    <button class="btn btn-sm btn-link">Request Leave</button>
                                </div>
                            </div>
                            <div class="row gx-3 gx-lg-4 mb-3">
                                <div class="col-12 col-sm-12 col-lg-12">
                                    <div class="card adminuiux-card mb-1">
                                        <div class="card-body">
                                            <div class="row gx-3 align-items-center">
                                                <div class="col-auto">
                                                    <div class="avatar avatar-40 rounded-circle coverimg">
                                                        <img src="assets/img/modern-ai-image/user-2.jpg" alt="" />
                                                    </div>
                                                </div>
                                                <div class="col">
                                                    <p class="small text-secondary mb-1">16-06-2022</p>
                                                    <h6 class="mb-0">Athiyaa</h6>
                                                </div>
                                                <div class="col-auto">
                                                    <button type="button" class="btn btn-sm btn-square btn-link theme-green">
                                                        <i class="bi bi-check-circle"></i>
                                                    </button>
                                                    <button type="button" class="btn btn-sm btn-square btn-link theme-red">
                                                        <i class="bi bi-x"></i>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-12 col-sm-12 col-lg-12">
                                    <div class="card adminuiux-card mb-1">
                                        <div class="card-body">
                                            <div class="row gx-3 align-items-center">
                                                <div class="col-auto">
                                                    <div class="avatar avatar-40 rounded-circle coverimg">
                                                        <img src="assets/img/modern-ai-image/user-3.jpg" alt="" />
                                                    </div>
                                                </div>
                                                <div class="col">
                                                    <p class="small text-secondary mb-1">13-07-2022</p>
                                                    <h6 class="mb-0">Sonia</h6>
                                                </div>
                                                <div class="col-auto">
                                                    <button type="button" class="btn btn-sm btn-square btn-link theme-green">
                                                        <i class="bi bi-check-circle"></i>
                                                    </button>
                                                    <button type="button" class="btn btn-sm btn-square btn-link theme-red">
                                                        <i class="bi bi-x"></i>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-12 col-sm-12 col-lg-12">
                                    <div class="card adminuiux-card mb-1">
                                        <div class="card-body">
                                            <div class="row gx-3 align-items-center">
                                                <div class="col-auto">
                                                    <div class="avatar avatar-40 rounded-circle coverimg">
                                                        <img src="assets/img/modern-ai-image/user-4.jpg" alt="" />
                                                    </div>
                                                </div>
                                                <div class="col">
                                                    <p class="small text-secondary mb-1">18-08-2022, Half-1</p>
                                                    <h6 class="mb-0">Kim Lui</h6>
                                                </div>
                                                <div class="col-auto">
                                                    <button type="button" class="btn btn-sm btn-square btn-link theme-green">
                                                        <i class="bi bi-check-circle"></i>
                                                    </button>
                                                    <button type="button" class="btn btn-sm btn-square btn-link theme-red">
                                                        <i class="bi bi-x"></i>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-12 col-sm-12 col-lg-12">
                                    <div class="card adminuiux-card mb-1">
                                        <div class="card-body">
                                            <div class="row gx-3 align-items-center">
                                                <div class="col-auto">
                                                    <div class="avatar avatar-40 rounded-circle coverimg">
                                                        <img src="assets/img/modern-ai-image/user-4.jpg" alt="" />
                                                    </div>
                                                </div>
                                                <div class="col">
                                                    <p class="small text-secondary mb-1">18-08-2022</p>
                                                    <h6 class="mb-0">Kim Lui</h6>
                                                </div>
                                                <div class="col-auto">
                                                    <button type="button" class="btn btn-sm btn-square btn-link theme-green">
                                                        <i class="bi bi-check-circle"></i>
                                                    </button>
                                                    <button type="button" class="btn btn-sm btn-square btn-link theme-red">
                                                        <i class="bi bi-x"></i>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-12 col-md-12 col-lg-7 col-xl-8 col-xxl-9">
                    <div class="row gx-3 gx-lg-4">
                        <div class="col-12 col-md-6 col-lg-12 col-xl-6 col-xxl-4">
                            <div class="card adminuiux-card mb-3 mb-lg-4">
                                <div class="card-body">
                                    <div class="row gx-3 align-items-center">
                                        <div class="col-auto">
                                            <div class="avatar avatar-50 rounded bg-green text-white">
                                                <i class="bi bi-clock h5"></i>
                                            </div>
                                        </div>
                                        <div class="col">
                                            <p class="small text-secondary mb-1">Efforts Allocated</p>
                                            <h5 class="mb-0">12858</h5>
                                        </div>
                                        <div class="col-auto">
                                            <div class="dropdown d-inline-block">
                                                <a class="btn btn-square btn-link text-secondary no-caret dropdown-toggle" data-bs-toggle="dropdown" aria-expanded="false" data-bs-display="static" role="button">
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
                        <div class="col-12 col-md-6 col-lg-12 col-xl-6 col-xxl-4">
                            <div class="card adminuiux-card mb-3 mb-lg-4">
                                <div class="card-body">
                                    <div class="row gx-3 align-items-center">
                                        <div class="col-auto">
                                            <div class="avatar avatar-50 rounded bg-purple text-white">
                                                <i class="bi bi-people h5"></i>
                                            </div>
                                        </div>
                                        <div class="col">
                                            <p class="small text-secondary mb-1">Team Member</p>
                                            <h5 class="mb-0">24 People</h5>
                                        </div>
                                        <div class="col-auto">
                                            <div class="dropdown d-inline-block">
                                                <a class="btn btn-square btn-link text-secondary no-caret dropdown-toggle" data-bs-toggle="dropdown" aria-expanded="false" data-bs-display="static" role="button">
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
                        <div class="col-12 col-md-6 col-lg-12 col-xl-6 col-xxl-4">
                            <div class="card adminuiux-card mb-3 mb-lg-4">
                                <div class="card-body">
                                    <div class="row gx-3 align-items-center">
                                        <div class="col-auto">
                                            <div class="avatar avatar-50 rounded bg-yellow text-white">
                                                <i class="bi bi-journal-check h5"></i>
                                            </div>
                                        </div>
                                        <div class="col">
                                            <p class="small text-secondary mb-1">Tasks in Progress</p>
                                            <h5 class="mb-0">18 - 1204 hrs</h5>
                                        </div>
                                        <div class="col-auto">
                                            <div class="dropdown d-inline-block">
                                                <a class="btn btn-square btn-link text-secondary no-caret dropdown-toggle" data-bs-toggle="dropdown" aria-expanded="false" data-bs-display="static" role="button">
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

                    <div class="row gx-3 gx-lg-4">
                        <div class="col-12 col-sm-12 col-md-6 col-lg-12 col-xl-6">
                            <div class="card adminuiux-card mb-3 mb-lg-4">
                                <div class="card-body pb-0">
                                    <div class="row gx-3 align-items-center mb-3 mb-lg-4">
                                        <div class="col-auto">
                                            <div class="avatar avatar-120 position-relative">
                                                <div class="avatar avatar-100 position-absolute start-50 top-50 translate-middle text-center">
                                                    <div class="lh-20 text-center w-100">
                                                        <h4 class="mb-0">10</h4>
                                                        <p class="small text-secondary">Total</p>
                                                    </div>
                                                </div>
                                                <app-doughnut-chartjs-100 class="avatar avatar-100 d-block"></app-doughnut-chartjs-100>
                                            </div>
                                        </div>
                                        <div class="col">
                                            <p class="text-secondary mb-2"><span class="avatar avatar-10 rounded-circle bg-red me-1"></span> 1 Birthday</p>
                                            <p class="text-secondary mb-2"><span class="avatar avatar-10 rounded-circle bg-yellow me-1"></span> 2 Leave</p>
                                            <p class="text-secondary mb-2"><span class="avatar avatar-10 rounded-circle bg-blue me-1"></span> 8 Working</p>
                                        </div>
                                    </div>
                                    <h6 class="mb-3">Birthday</h6>
                                    <div class="d-block mb-1 mb-lg-2">
                                        <a routerLink="/app/profile-professional" target="_blank" class="badge badge-lg badge-light text-bg-theme-1 rounded-5 mb-2 me-2">
                                            <figure class="avatar avatar-20 rounded-circle me-1 coverimg"><img src="assets/img/modern-ai-image/user-4.jpg" alt="" /></figure>
                                            James Wang
                                        </a>
                                    </div>
                                    <h6 class="mb-3">Leave</h6>
                                    <div class="d-block mb-1 mb-lg-2">
                                        <a routerLink="/app/profile-professional" target="_blank" class="badge badge-lg badge-light text-bg-theme-1 rounded-5 mb-2 me-2">
                                            <figure class="avatar avatar-20 rounded-circle me-1 coverimg"><img src="assets/img/modern-ai-image/user-3.jpg" alt="" /></figure>
                                            Ketti Pattasa
                                        </a>
                                        <a routerLink="/app/profile-professional" target="_blank" class="badge badge-lg badge-light text-bg-theme-1 rounded-5 mb-2 me-2">
                                            <figure class="avatar avatar-20 rounded-circle me-1 coverimg"><img src="assets/img/modern-ai-image/user-1.jpg" alt="" /></figure>
                                            Max Smith
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="col-12 col-sm-12 col-md-6 col-lg-12 col-xl-6">
                            <div class="card adminuiux-card mb-3 mb-lg-4">
                                <div class="card-body pb-0">
                                    <div class="row gx-3 align-items-center mb-3 mb-lg-4">
                                        <div class="col-auto">
                                            <div class="avatar avatar-120 position-relative">
                                                <div class="avatar avatar-100 position-absolute start-50 top-50 translate-middle text-center">
                                                    <div class="lh-20 text-center w-100">
                                                        <h4 class="mb-0">10</h4>
                                                        <p class="small text-secondary">Total</p>
                                                    </div>
                                                </div>
                                                <app-doughnut-chartjs-100-2 class="avatar avatar-100 d-block"></app-doughnut-chartjs-100-2>
                                            </div>
                                        </div>
                                        <div class="col">
                                            <p class="text-secondary mb-2"><span class="avatar avatar-10 rounded-circle bg-red me-1"></span> 6 Office</p>
                                            <p class="text-secondary mb-2"><span class="avatar avatar-10 rounded-circle bg-yellow me-1"></span> 2 Leave</p>
                                            <p class="text-secondary mb-2"><span class="avatar avatar-10 rounded-circle bg-blue me-1"></span> 2 Home</p>
                                        </div>
                                    </div>
                                    <h6 class="mb-3">Office</h6>
                                    <div class="d-block mb-1 mb-lg-2">
                                        <a routerLink="/app/profile-professional" target="_blank" class="badge badge-lg badge-light text-bg-theme-1 rounded-5 mb-2 me-2">
                                            <figure class="avatar avatar-20 rounded-circle me-1 coverimg"><img src="assets/img/modern-ai-image/user-2.jpg" alt="" /></figure>
                                            Aliaa Shen
                                        </a>
                                        <a routerLink="/app/profile-professional" target="_blank" class="badge badge-lg badge-light text-bg-theme-1 rounded-5 mb-2 me-2">
                                            <figure class="avatar avatar-20 rounded-circle me-1 coverimg"><img src="assets/img/modern-ai-image/user-3.jpg" alt="" /></figure>
                                            Ketti Pattasa
                                        </a>
                                        <a class="badge badge-lg badge-light text-bg-theme-1 rounded-5 mb-2 me-2 theme-red"> <span class="avatar avatar-20">+4</span> More... </a>
                                    </div>
                                    <h6 class="mb-3">Home</h6>
                                    <div class="d-block mb-1 mb-lg-2">
                                        <a routerLink="/app/profile-professional" target="_blank" class="badge badge-lg badge-light text-bg-theme-1 rounded-5 mb-2 me-2">
                                            <figure class="avatar avatar-20 rounded-circle me-1 coverimg"><img src="assets/img/modern-ai-image/user-4.jpg" alt="" /></figure>
                                            James Wang
                                        </a>
                                        <a routerLink="/app/profile-professional" target="_blank" class="badge badge-lg badge-light text-bg-theme-1 rounded-5 mb-2 me-2">
                                            <figure class="avatar avatar-20 rounded-circle me-1 coverimg"><img src="assets/img/modern-ai-image/user-2.jpg" alt="" /></figure>
                                            Aliaa Shen
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="row gx-3 align-items-center mb-3 mb-lg-4">
                        <div class="col">
                            <h5>Project Status</h5>
                        </div>
                        <div class="col-auto"></div>
                    </div>

                    <div class="row gx-3 gx-lg-4">
                        <div class="col-12 col-md-6 col-lg-12 col-xl-4">
                            <div class="card adminuiux-card mb-3 mb-lg-4">
                                <div class="card-header">
                                    <div class="row gx-3 align-items-center">
                                        <div class="col">
                                            <p class="small text-secondary mb-1">Due Date</p>
                                            <p>25/05/2022</p>
                                        </div>
                                    </div>
                                </div>
                                <div class="card-body">
                                    <h5 class="text-center mb-1">Prototype</h5>
                                    <p class="opacity-75 text-center mb-3 mb-lg-4">On the Track</p>
                                    <div class="progress height-dynamic mb-2 bg-theme-1-subtle text-theme-1" style="--h-dynamic:5px">
                                        <div class="progress-bar bg-theme-1" role="progressbar" style="width: 50%" aria-valuenow="50" aria-valuemin="0" aria-valuemax="100"></div>
                                    </div>
                                    <p class="small text-secondary mb-3">Project Status <span class="float-end">50%</span></p>
                                    <div class="row align-items-center gx-2">
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

                        <div class="col-12 col-md-6 col-lg-12 col-xl-4">
                            <div class="card adminuiux-card mb-3 mb-lg-4">
                                <div class="card-header">
                                    <div class="row gx-3 align-items-center">
                                        <div class="col">
                                            <p class="small text-secondary mb-1">Due Date</p>
                                            <p>30/06/2022</p>
                                        </div>
                                    </div>
                                </div>
                                <div class="card-body">
                                    <h5 class="text-center mb-1">Development</h5>
                                    <p class="opacity-75 text-center mb-4">On the Track</p>
                                    <div class="progress height-dynamic mb-2 bg-theme-1-subtle text-theme-1" style="--h-dynamic:5px">
                                        <div class="progress-bar bg-theme-1" role="progressbar" style="width: 50%" aria-valuenow="50" aria-valuemin="0" aria-valuemax="100"></div>
                                    </div>
                                    <p class="small text-secondary mb-3">Project Status <span class="float-end">50%</span></p>
                                    <div class="row align-items-center gx-2">
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

                        <div class="col-12 col-md-6 col-lg-12 col-xl-4">
                            <div class="card adminuiux-card mb-3 mb-lg-4">
                                <div class="card-header">
                                    <div class="row gx-3 align-items-center">
                                        <div class="col">
                                            <p class="small text-secondary mb-1">Due Date</p>
                                            <p>30/06/2022</p>
                                        </div>
                                    </div>
                                </div>
                                <div class="card-body">
                                    <h5 class="text-center mb-1">Web Services</h5>
                                    <p class="opacity-75 text-center mb-4">Down the line</p>
                                    <div class="progress height-dynamic mb-2 bg-theme-1-subtle text-theme-1" style="--h-dynamic:5px">
                                        <div class="progress-bar bg-theme-1" role="progressbar" style="width: 30%" aria-valuenow="50" aria-valuemin="0" aria-valuemax="100"></div>
                                    </div>
                                    <p class="small text-secondary mb-3">Project Status <span class="float-end">30%</span></p>
                                    <div class="row align-items-center gx-2">
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

                        <div class="col-12 col-md-6 col-lg-12 col-xl-4 d-xl-none mb-4">
                            <div class="card adminuiux-card mb-3 mb-lg-4">
                                <div class="card-header">
                                    <div class="row gx-3 align-items-center">
                                        <div class="col">
                                            <p class="small text-secondary mb-1">Due Date</p>
                                            <p>12/07/2022</p>
                                        </div>
                                    </div>
                                </div>
                                <div class="card-body">
                                    <h5 class="text-center mb-1">QA Support</h5>
                                    <p class="opacity-75 text-center mb-4">On the Track</p>
                                    <div class="progress height-dynamic mb-2 bg-theme-1-subtle text-theme-1" style="--h-dynamic:5px">
                                        <div class="progress-bar bg-theme-1" role="progressbar" style="width: 65%" aria-valuenow="50" aria-valuemin="0" aria-valuemax="100"></div>
                                    </div>
                                    <p class="small text-secondary mb-3">Project Status <span class="float-end">65%</span></p>
                                    <div class="row align-items-center gx-2">
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

                    <div class="row gx-3 gx-lg-4">
                        <div class="col-12 col-md-6 col-lg-12 col-xl-4">
                            <div class="card adminuiux-card mb-3 mb-lg-4">
                                <div class="card-header">
                                    <div class="row gx-3 align-items-center">
                                        <div class="col-auto">
                                            <span class="avatar avatar-40 rounded mb-0 coverimg">
                                                <img src="assets/img/logo-512.png" alt="" />
                                            </span>
                                        </div>
                                        <div class="col">
                                            <h6 class="mb-0">Project Progress</h6>
                                            <p class="text-secondary small">Currently</p>
                                        </div>
                                    </div>
                                </div>
                                <div class="card-body">
                                    <div class="row gx-3 gx-lg-4 align-items-center mb-3 mb-lg-4">
                                        <div class="col">
                                            <p class="mb-1">webgetdoors</p>
                                            <h5 class="fw-medium mb-0">2152 hrs <small class="fw-normal">(50.83%)</small></h5>
                                            <p class="small text-secondary">Currently 6 developer, 1 Manager are working on this.</p>
                                            <span class="badge badge-light text-bg-theme-1 theme-green">Web App</span>
                                            <span class="badge badge-light text-bg-theme-1 theme-yellow ms-1">Medium priority</span>
                                        </div>
                                    </div>
                                    <div class="row align-items-center gx-2">
                                        <div class="col-auto mb-2 avatar-group">
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
                                            <p class="text-secondary small mb-0">5 more</p>
                                            <p class="small">Working</p>
                                        </div>
                                        <div class="col-auto mb-3">
                                            <button class="btn btn-square btn-link">
                                                <i class="bi bi-person-plus "></i>
                                            </button>
                                        </div>
                                    </div>
                                    <div class="progress height-dynamic mb-2 bg-theme-1-subtle text-theme-1" style="--h-dynamic:5px">
                                        <div class="progress-bar bg-theme-1" role="progressbar" style="width: 50%" aria-valuenow="50" aria-valuemin="0" aria-valuemax="100"></div>
                                    </div>
                                    <p class="small text-secondary mb-3">Project Status <span class="float-end">50%</span></p>
                                    <span class="badge badge-lg badge-light text-bg-theme-1">Due date: 22 March 2022</span>
                                </div>
                            </div>
                        </div>
                        <div class="col-12 col-md-6 col-lg-12 col-xl-4">
                            <div class="card adminuiux-card mb-3 mb-lg-4">
                                <div class="card-body">
                                    <div class="row align-items-center gx-2">
                                        <div class="col">
                                            <p class="text-secondary small">9:30 am | 5 hrs</p>
                                            <h6>Searchbar Header</h6>
                                            <p class="text-secondary small mb-3">Get the tabbed categories result and clubbed result in main tab.</p>
                                            <div class="coverimg rounded height-130 overflow-hidden mb-3">
                                                <img src="assets/img/modern-ai-image/PET-2.jpg" class="w-100" alt="" />
                                            </div>
                                            <span class="badge badge-light text-bg-theme-1 theme-blue">Code</span>
                                            <span class="badge badge-light text-bg-theme-1 theme-pink">Development</span>
                                        </div>
                                    </div>
                                </div>
                                <div class="card-footer">
                                    <div class="row align-items-center gx-2">
                                        <div class="col">
                                            <div class="avatar avatar-30 coverimg rounded-circle me-1" data-bs-toggle="tooltip" title="" data-bs-original-title="Dhanitara">
                                                <img src="assets/img/modern-ai-image/user-2.jpg" alt="" />
                                            </div>
                                            <div class="avatar avatar-30 coverimg rounded-circle me-1" data-bs-toggle="tooltip" title="" data-bs-original-title="Shrivalli">
                                                <img src="assets/img/modern-ai-image/user-3.jpg" alt="" />
                                            </div>
                                            <div class="avatar avatar-30 bg-theme-1-subtle text-theme-1 rounded-circle me-1">
                                                <p class="small">2+</p>
                                            </div>
                                        </div>
                                        <div class="col-auto">
                                            <button class="btn btn-square btn-link">
                                                <i class="bi bi-paperclip "></i>
                                            </button>
                                            <button class="btn btn-square btn-link">
                                                <i class="bi bi-chat-right-dots"></i>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="col-12 col-md-6 col-lg-12 col-xl-4">
                            <div class="card adminuiux-card mb-3 mb-lg-4">
                                <div class="card-header">
                                    <div class="row gx-3 align-items-center">
                                        <div class="col">
                                            <h6 class="mb-0">Daily Meeting</h6>
                                            <p class="text-secondary small">AdminUX Project</p>
                                        </div>
                                        <div class="col-auto">
                                            <a class="btn btn-square btn-link"><i class="bi bi-person-plus"></i></a>
                                        </div>
                                    </div>
                                </div>
                                <div class="card-body">
                                    <div class="row gx-3 align-items-center">
                                        <div class="col-auto">
                                            <i class="bi bi-calendar-event h5 avatar avatar-40 bg-theme-1-subtle text-theme-1 rounded"></i>
                                        </div>
                                        <div class="col">
                                            <h6 class="mb-0">25-01-2021 4:15pm</h6>
                                            <p class="text-secondary small">at Greta Anthony Meeting-Room</p>
                                        </div>
                                    </div>
                                </div>
                                <div class="card-footer">
                                    <div class="row gx-3 align-items-center">
                                        <div class="col-auto avatar-group">
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
                                            <a class="btn btn-sm btn-theme">Join</a>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="card adminuiux-card mb-3 mb-lg-4 theme-green mb-4">
                                <div class="row h-100 mx-0">
                                    <div class="col-auto col-xl-4 p-2 position-relative">
                                        <div class="coverimg position-absolute start-0 top-0 h-100 w-100 rounded">
                                            <img src="assets/img/modern-ai-image/user-1.jpg" alt="" />
                                        </div>
                                        <div class="rounded bg-theme text-white p-2 h-100 d-flex flex-column">
                                            <i class="bi bi-clock h5 mb-3"></i>
                                            <p class="opacity-75 small mb-1 mt-auto">Effort</p>
                                            <p>2542<small>h</small></p>
                                        </div>
                                    </div>
                                    <div class="col col-xxl-8 px-0">
                                        <div class="card-body">
                                            <h6>AdminUX Project</h6>
                                            <div class="row  mb-3">
                                                <div class="col">
                                                    <p class="text-secondary small mb-0">Set Reminder</p>
                                                    <p class="small">2 reminders</p>
                                                </div>
                                                <div class="col-auto">
                                                    <i class="bi bi-chat-right-dots avatar avatar-40 bg-theme-1-subtle text-theme-1 rounded"></i>
                                                </div>
                                            </div>
                                            <div class="progress height-dynamic mb-2 bg-theme-1-subtle text-theme-1" style="--h-dynamic:5px">
                                                <div class="progress-bar bg-theme-1" role="progressbar" style="width: 45%" aria-valuenow="45" aria-valuemin="0" aria-valuemax="100"></div>
                                            </div>
                                            <p class="small text-secondary">Project Status <span class="float-end">75%</span></p>
                                        </div>
                                    </div>
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
export class CompanyManagementComponent {
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
    }
}
