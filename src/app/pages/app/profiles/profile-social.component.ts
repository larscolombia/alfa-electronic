import { Component, OnInit, AfterViewInit, AfterContentChecked, OnDestroy, ViewChild, ElementRef, CUSTOM_ELEMENTS_SCHEMA } from "@angular/core";
import { RouterLink } from "@angular/router";
import Choices, { ClassNames } from "choices.js";

import { DaterangePickerRangesComponent } from "../../../components/input-fields/daterange-picker/daterange-picker-ranges.component";

@Component({
    selector: "app-profile-social",
    standalone: true,
    imports: [RouterLink, DaterangePickerRangesComponent],
    template: `
        <!-- page title -->
        <div class="container-fluid py-3">
            <div class="row gx-3 gx-lg-4 align-items-center page-title">
                <div class="col col-sm mb-3 mb-sm-0 order-1">
                    <h5 class="mb-0">Social Profile</h5>
                    <p class="text-secondary small">Social Network Profile Preview</p>
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
            <div class="card adminuiux-card overflow-hidden mb-3 mb-lg-4 position-relative">
                <div class="position-absolute top-0 end-0 z-index-1 m-3">
                    <button class="btn btn-sm btn-theme" onclick="this.nextElementSibling.click()"><i class="bi bi-camera"></i> Change Cover</button>
                    <input type="file" class="d-none" />
                </div>
                <figure class="coverimg w-100 height-260 mb-0">
                    <img src="assets/img/background-image/backgorund-image-11.jpg" class="mw-100" alt="" />
                </figure>
                <div class="card-body">
                    <div class="row gx-3 align-items-start">
                        <div class="col-12 col-md-auto text-center position-relative px-3 px-lg-4 mb-3 mb-md-0">
                            <div class="avatar avatar-160 coverimg rounded-circle mt--100 shadow-md border-3 border-light overflow-visible">
                                <img src="assets/img/modern-ai-image/user-1.jpg" alt="" />
                                <div class="position-absolute bottom-0 end-0 m-2 z-index-1 lh-20">
                                    <button class="btn btn-theme btn-square shadow rounded-circle" onclick="this.nextElementSibling.click()"><i class="bi bi-camera"></i></button>
                                    <input type="file" class="d-none" />
                                </div>
                            </div>
                        </div>
                        <div class="col mb-3 mb-lg-0">
                            <h2>
                                <span class="text-gradient">AdminUIUX</span> <span class="badge bg-theme-1 theme-green rounded vm fw-normal fs-12"><i class="bi bi-check-circle me-1"></i>Active</span>
                            </h2>
                            <p class="text-secondary"><i class="bi bi-geo-alt me-1"></i>D25, Amalika Empire, DD Street, San Jose, United States</p>
                        </div>
                        <div class="col-12 col-lg-auto align-self-center">
                            <button class="btn btn-outline-theme me-2"><i class="bi bi-plus vm me-2"></i> Follow</button>
                            <button class="btn btn-theme"><i class="bi bi-person-plus vm me-2"></i> Add Friend</button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- intro -->
            <div class="card adminuiux-card mb-3 mb-lg-4">
                <div class="card-header">
                    <div class="row gx-3 align-items-center">
                        <div class="col-auto">
                            <i class="bi bi-person-circle h5 me-1 avatar avatar-40 bg-theme-1-subtle text-theme-1 rounded me-2"></i>
                        </div>
                        <div class="col">
                            <h6 class="mb-0">About</h6>
                            <p class="text-secondary small">"Love the life, Spread and creativity"</p>
                        </div>
                        <div class="col-auto">
                            <button class="btn btn-sm btn-link"><i class="bi bi-pencil me-1 vm"></i> <span class="d-inline">Edit</span> <span class="d-none d-md-inline">Profile</span></button>
                        </div>
                    </div>
                </div>
                <div class="card-body gallery pb-0">
                    <p class="text-secondary">AdminUX is creative and multipurpose template. You can use it for CRM, Business application, Intranet Application, Portal service and Many more. It comes with unlimited possibilities and 10+ predefined styles which you can also mix up and create new style. Do support and spread a word for us.</p>
                    <div class="row gx-3">
                        <div class="col-12 col-md-6 col-lg-4">
                            <div class="row gx-3 align-items-center mb-3">
                                <div class="col-auto">
                                    <i class="bi bi-telephone h5 text-theme-1 mb-0"></i>
                                </div>
                                <div class="col">
                                    <p class="text-secondary small mb-1">Phone</p>
                                    <p>+189625256A59863</p>
                                </div>
                            </div>
                            <div class="row gx-3 align-items-center mb-3">
                                <div class="col-auto">
                                    <i class="bi bi-envelope h5 text-theme-1 mb-0"></i>
                                </div>
                                <div class="col">
                                    <p class="text-secondary small mb-1">Email Address</p>
                                    <p>information&#64;adminuiux.com</p>
                                </div>
                            </div>
                        </div>
                        <div class="col-12 col-md-6 col-lg-4">
                            <div class="row gx-3 align-items-center mb-3">
                                <div class="col-auto">
                                    <i class="bi bi-briefcase h5 text-theme-1 mb-0"></i>
                                </div>
                                <div class="col">
                                    <p class="text-secondary small mb-1">Working</p>
                                    <p>UIUX designer at AdminUIUX</p>
                                </div>
                            </div>
                            <div class="row gx-3 align-items-center mb-3">
                                <div class="col-auto">
                                    <i class="bi bi-calendar2-heart h5 text-theme-1 mb-0"></i>
                                </div>
                                <div class="col">
                                    <p class="text-secondary small mb-1">Birthday</p>
                                    <p>1 August 1992</p>
                                </div>
                            </div>
                        </div>
                        <div class="col-12 col-md-6 col-lg-4">
                            <div class="row gx-3 align-items-center mb-3">
                                <div class="col-auto">
                                    <i class="bi bi-gender-ambiguous h5 text-theme-1 mb-0"></i>
                                </div>
                                <div class="col">
                                    <p class="text-secondary small mb-1">Gender</p>
                                    <p>Male</p>
                                </div>
                            </div>
                            <div class="row gx-3 align-items-center mb-3">
                                <div class="col-auto">
                                    <i class="bi bi-heart h5 text-theme-1 mb-0"></i>
                                </div>
                                <div class="col">
                                    <p class="text-secondary small mb-1">Social Status</p>
                                    <p>Single</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- albums -->
            <div class="card adminuiux-card mb-3 mb-lg-4">
                <div class="card-header">
                    <div class="row gx-3 align-items-center">
                        <div class="col-auto">
                            <i class="bi bi-journal-album h5 me-1 avatar avatar-40 bg-theme-1-subtle text-theme-1 rounded me-2"></i>
                        </div>
                        <div class="col">
                            <h6 class="mb-0">Albums</h6>
                            <p class="text-secondary small">Click image to see preview</p>
                        </div>
                        <div class="col-auto">
                            <a href="" class="btn btn-sm btn-link">View all</a>
                        </div>
                    </div>
                </div>
                <div class="card-body pb-0">
                    <div class="row gx-3">
                        <div class="col-12 col-md-6 col-lg-4 col-xl-3 mb-3">
                            <div class="card adminuiux-card border">
                                <div class="card-header z-index-5">
                                    <div class="row gx-3 align-items-center">
                                        <div class="col-7">
                                            <a href="" class="h6 mb-0 text-truncated d-block style-none">AdminUX</a>
                                            <p class="text-secondary small text-truncated d-block">Created on: 28-06-2022</p>
                                        </div>
                                        <div class="col text-end">
                                            <div class="dropdown z-index-1">
                                                <button class="btn btn-square btn-link dropdown-toggle no-caret" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                                                    <i class="bi bi-three-dots-vertical"></i>
                                                </button>
                                                <ul class="dropdown-menu">
                                                    <li><a class="dropdown-item">Action</a></li>
                                                    <li><a class="dropdown-item">Another action</a></li>
                                                    <li><a class="dropdown-item">Something else here</a></li>
                                                </ul>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div class="card-body">
                                    <figure class="rounded coverimg height-250 w-100 mb-3">
                                        <img src="assets/img/modern-ai-image/flamingo-2.jpg" alt="" />
                                    </figure>
                                    <p class="small text-secondary mb-2">Shared with</p>
                                    <div class="row gx-3 align-items-center">
                                        <div class="col-auto">
                                            <figure class="avatar avatar-40 rounded-circle coverimg me-1" data-bs-toggle="tooltip" title="John smith">
                                                <img src="assets/img/modern-ai-image/user-1.jpg" alt="" />
                                            </figure>
                                            <figure class="avatar avatar-40 rounded-circle coverimg me-1" data-bs-toggle="tooltip" title="Anjali Raj">
                                                <img src="assets/img/modern-ai-image/user-2.jpg" alt="" />
                                            </figure>
                                            <figure class="avatar avatar-40 rounded-circle coverimg me-1" data-bs-toggle="tooltip" title="AdminUIUX">
                                                <img src="assets/img/modern-ai-image/user-4.jpg" alt="" />
                                            </figure>
                                            <div class="avatar avatar-40 rounded-circle bg-theme-1-subtle text-theme-1 me-1">+5</div>
                                        </div>
                                        <div class="col-auto ms-auto">
                                            <div class="btn btn-square rounded-circle btn-link">
                                                <i class="bi bi-share"></i>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="col-12 col-md-6 col-lg-4 col-xl-3 mb-3">
                            <div class="card adminuiux-card border">
                                <div class="card-header z-index-5">
                                    <div class="row gx-3 align-items-center">
                                        <div class="col-7">
                                            <a href="" class="h6 mb-0 text-truncated d-block style-none">Night Vision</a>
                                            <p class="text-secondary small text-truncated d-block">Created on: 28-06-2022</p>
                                        </div>
                                        <div class="col text-end">
                                            <div class="dropdown z-index-1">
                                                <button class="btn btn-square btn-link dropdown-toggle no-caret" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                                                    <i class="bi bi-three-dots-vertical"></i>
                                                </button>
                                                <ul class="dropdown-menu">
                                                    <li><a class="dropdown-item">Action</a></li>
                                                    <li><a class="dropdown-item">Another action</a></li>
                                                    <li><a class="dropdown-item">Something else here</a></li>
                                                </ul>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div class="card-body">
                                    <figure class="rounded coverimg height-250 w-100 mb-3">
                                        <img src="assets/img/modern-ai-image/peacoke-2.jpg" alt="" />
                                    </figure>
                                    <p class="small text-secondary mb-2">Shared with</p>
                                    <div class="row gx-3 align-items-center">
                                        <div class="col-auto">
                                            <figure class="avatar avatar-40 rounded-circle coverimg me-1" data-bs-toggle="tooltip" title="John smith">
                                                <img src="assets/img/modern-ai-image/user-1.jpg" alt="" />
                                            </figure>
                                            <figure class="avatar avatar-40 rounded-circle coverimg me-1" data-bs-toggle="tooltip" title="Anjali Raj">
                                                <img src="assets/img/modern-ai-image/user-2.jpg" alt="" />
                                            </figure>
                                            <figure class="avatar avatar-40 rounded-circle coverimg me-1" data-bs-toggle="tooltip" title="AdminUIUX">
                                                <img src="assets/img/modern-ai-image/user-4.jpg" alt="" />
                                            </figure>
                                            <div class="avatar avatar-40 rounded-circle bg-theme-1-subtle text-theme-1 me-1">+5</div>
                                        </div>
                                        <div class="col-auto ms-auto">
                                            <div class="btn btn-square rounded-circle btn-link">
                                                <i class="bi bi-share"></i>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="col-12 col-md-6 col-lg-4 col-xl-3 mb-3">
                            <div class="card adminuiux-card border">
                                <div class="card-header z-index-5">
                                    <div class="row gx-3 align-items-center">
                                        <div class="col-7">
                                            <a href="" class="h6 mb-0 text-truncated d-block style-none">Proud Traveler</a>
                                            <p class="text-secondary small text-truncated d-block">Created on: 28-06-2022</p>
                                        </div>
                                        <div class="col text-end">
                                            <div class="dropdown z-index-1">
                                                <button class="btn btn-square btn-link dropdown-toggle no-caret" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                                                    <i class="bi bi-three-dots-vertical"></i>
                                                </button>
                                                <ul class="dropdown-menu">
                                                    <li><a class="dropdown-item">Action</a></li>
                                                    <li><a class="dropdown-item">Another action</a></li>
                                                    <li><a class="dropdown-item">Something else here</a></li>
                                                </ul>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div class="card-body">
                                    <figure class="rounded coverimg height-250 w-100 mb-3">
                                        <img src="assets/img/modern-ai-image/pet-4.jpg" alt="" />
                                    </figure>
                                    <p class="small text-secondary mb-2">Shared with</p>
                                    <div class="row gx-3 align-items-center">
                                        <div class="col-auto">
                                            <figure class="avatar avatar-40 rounded-circle coverimg me-1" data-bs-toggle="tooltip" title="John smith">
                                                <img src="assets/img/modern-ai-image/user-1.jpg" alt="" />
                                            </figure>
                                            <figure class="avatar avatar-40 rounded-circle coverimg me-1" data-bs-toggle="tooltip" title="Anjali Raj">
                                                <img src="assets/img/modern-ai-image/user-2.jpg" alt="" />
                                            </figure>
                                            <figure class="avatar avatar-40 rounded-circle coverimg me-1" data-bs-toggle="tooltip" title="AdminUIUX">
                                                <img src="assets/img/modern-ai-image/user-4.jpg" alt="" />
                                            </figure>
                                            <div class="avatar avatar-40 rounded-circle bg-theme-1-subtle text-theme-1 me-1">+5</div>
                                        </div>
                                        <div class="col-auto ms-auto">
                                            <div class="btn btn-square rounded-circle btn-link">
                                                <i class="bi bi-share"></i>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="col-12 col-md-6 col-lg-4 col-xl-3 mb-3">
                            <div class="card adminuiux-card border">
                                <div class="card-header z-index-5">
                                    <div class="row gx-3 align-items-center">
                                        <div class="col-7">
                                            <a href="" class="h6 mb-0 text-truncated d-block style-none">AK Trips</a>
                                            <p class="text-secondary small text-truncated d-block">Created on: 28-06-2022</p>
                                        </div>
                                        <div class="col text-end">
                                            <div class="dropdown z-index-1">
                                                <button class="btn btn-square btn-link dropdown-toggle no-caret" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                                                    <i class="bi bi-three-dots-vertical"></i>
                                                </button>
                                                <ul class="dropdown-menu">
                                                    <li><a class="dropdown-item">Action</a></li>
                                                    <li><a class="dropdown-item">Another action</a></li>
                                                    <li><a class="dropdown-item">Something else here</a></li>
                                                </ul>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div class="card-body">
                                    <figure class="rounded coverimg height-250 w-100 mb-3">
                                        <img src="assets/img/modern-ai-image/tree-8.jpg" alt="" />
                                    </figure>
                                    <p class="small text-secondary mb-2">Shared with</p>
                                    <div class="row gx-3 align-items-center">
                                        <div class="col-auto">
                                            <figure class="avatar avatar-40 rounded-circle coverimg me-1" data-bs-toggle="tooltip" title="John smith">
                                                <img src="assets/img/modern-ai-image/user-1.jpg" alt="" />
                                            </figure>
                                            <figure class="avatar avatar-40 rounded-circle coverimg me-1" data-bs-toggle="tooltip" title="Anjali Raj">
                                                <img src="assets/img/modern-ai-image/user-2.jpg" alt="" />
                                            </figure>
                                            <figure class="avatar avatar-40 rounded-circle coverimg me-1" data-bs-toggle="tooltip" title="AdminUIUX">
                                                <img src="assets/img/modern-ai-image/user-4.jpg" alt="" />
                                            </figure>
                                            <div class="avatar avatar-40 rounded-circle bg-theme-1-subtle text-theme-1 me-1">+5</div>
                                        </div>
                                        <div class="col-auto ms-auto">
                                            <div class="btn btn-square rounded-circle btn-link">
                                                <i class="bi bi-share"></i>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Recent photos view -->
            <div class="card adminuiux-card overflow-hidden theme-purple mb-4">
                <div class="card-header">
                    <div class="row gx-3 align-items-center">
                        <div class="col-auto">
                            <i class="bi bi-image h5 me-1 avatar avatar-40 bg-theme-1-subtle text-theme-1 rounded me-2"></i>
                        </div>
                        <div class="col">
                            <h6 class="mb-0">Photos</h6>
                            <p class="text-secondary small">Click image to see preview</p>
                        </div>
                        <div class="col-auto">
                            <a href="" class="btn btn-sm btn-link">View all</a>
                        </div>
                    </div>
                </div>
                <div class="card-body spotlight-group">
                    <div class="row gx-2 h-100">
                        <div class="col-6 col-md-4 col-lg-3 col-xl-3  height-300 py-1 position-relative overflow-hidden">
                            <a href="assets/img/modern-ai-image/tree-2.jpg" class="coverimg d-block w-100 h-100 start-0 top-0 m-0 spotlight">
                                <img src="assets/img/modern-ai-image/tree-2.jpg" class="mw-100" alt="" title="Love unconditional when it comes to your own" />
                            </a>
                        </div>
                        <div class="col-6 col-md-4 col-lg-3 col-xl-3 h-300">
                            <div class="row gx-2 h-100">
                                <div class="col-12 h-50 py-1 position-relative overflow-hidden">
                                    <a href="assets/img/modern-ai-image/user-1-kid.jpg" class="coverimg d-block w-100 h-100 start-0 top-0 m-0 spotlight">
                                        <img src="assets/img/modern-ai-image/user-1-kid.jpg" class="mw-100" alt="" title="Your business your strength" />
                                    </a>
                                </div>
                                <div class="col-12 h-50 py-1 position-relative overflow-hidden">
                                    <a href="assets/img/modern-ai-image/lion-2.jpg" class="coverimg d-block w-100 h-100 start-0 top-0 m-0 spotlight">
                                        <img src="assets/img/modern-ai-image/lion-2.jpg" class="mw-100" alt="" title="Beautiful background image" />
                                    </a>
                                </div>
                            </div>
                        </div>
                        <div class="col-6 col-md-4 col-lg-3 col-xl-3  height-300 py-1 position-relative overflow-hidden">
                            <a href="assets/img/modern-ai-image/image-10.jpg" class="coverimg d-block w-100 h-100 start-0 top-0 m-0 spotlight">
                                <img src="assets/img/modern-ai-image/image-10.jpg" class="mw-100" alt="" title="Love unconditional when it comes to your own" />
                            </a>
                        </div>
                        <div class="col-6 col-md-4 col-lg-3 col-xl-3 h-300">
                            <div class="row gx-2 h-100">
                                <div class="col-12 h-50 py-1 position-relative overflow-hidden">
                                    <a href="assets/img/modern-ai-image/bus-3.jpg" class="coverimg d-block w-100 h-100 start-0 top-0 m-0 spotlight">
                                        <img src="assets/img/modern-ai-image/bus-3.jpg" class="mw-100" alt="" title="Your business your strength" />
                                    </a>
                                </div>
                                <div class="col-12 h-50 py-1 position-relative overflow-hidden">
                                    <a href="assets/img/modern-ai-image/user-1.jpg" class="coverimg d-block w-100 h-100 start-0 top-0 m-0 spotlight">
                                        <img src="assets/img/modern-ai-image/user-1.jpg" class="mw-100" alt="" title="Beautiful background image" />
                                    </a>
                                </div>
                            </div>
                        </div>
                        <div class="col-6 col-md-4 col-lg-3 col-xl-3 h-300">
                            <div class="row gx-2 h-100">
                                <div class="col-12 h-50 py-1 position-relative overflow-hidden">
                                    <a href="assets/img/modern-ai-image/tree-6.jpg" class="coverimg d-block w-100 h-100 start-0 top-0 m-0 spotlight">
                                        <img src="assets/img/modern-ai-image/tree-6.jpg" class="mw-100" alt="" title="Your business your strength" />
                                    </a>
                                </div>
                                <div class="col-12 h-50 py-1 position-relative overflow-hidden">
                                    <a href="assets/img/modern-ai-image/tree-4.jpg" class="coverimg d-block w-100 h-100 start-0 top-0 m-0 spotlight">
                                        <img src="assets/img/modern-ai-image/tree-4.jpg" class="mw-100" alt="" title="Beautiful background image" />
                                    </a>
                                </div>
                            </div>
                        </div>
                        <div class="col-6 col-md-4 col-lg-3 col-xl-3 height-300 py-1 position-relative overflow-hidden">
                            <a href="assets/img/modern-ai-image/user-3.jpg" class="coverimg d-block w-100 h-100 start-0 top-0 m-0 spotlight">
                                <img src="assets/img/modern-ai-image/user-3.jpg" class="mw-100" alt="" title="Love unconditional when it comes to your own" />
                            </a>
                        </div>
                        <div class="col-6 col-md-4 col-lg-3 col-xl-3 h-300">
                            <div class="row gx-2 h-100">
                                <div class="col-12 h-50 py-1 position-relative overflow-hidden">
                                    <a href="assets/img/modern-ai-image/user-5.jpg" class="coverimg d-block w-100 h-100 start-0 top-0 m-0 spotlight">
                                        <img src="assets/img/modern-ai-image/user-5.jpg" class="mw-100" alt="" title="Your business your strength" />
                                    </a>
                                </div>
                                <div class="col-12 h-50 py-1 position-relative overflow-hidden">
                                    <a href="assets/img/modern-ai-image/user5-kid.jpg" class="coverimg d-block w-100 h-100 start-0 top-0 m-0 spotlight">
                                        <img src="assets/img/modern-ai-image/user5-kid.jpg" class="mw-100" alt="" title="Beautiful background image" />
                                    </a>
                                </div>
                            </div>
                        </div>
                        <div class="col-6 col-md-4 col-lg-3 col-xl-3  height-300 py-1 position-relative overflow-hidden">
                            <a href="assets/img/modern-ai-image/taxi-1.jpg" class="coverimg d-block h-100 w-100 start-0 top-0 m-0 spotlight">
                                <img src="assets/img/modern-ai-image/taxi-1.jpg" class="mw-100" alt="" title="Love unconditional when it comes to your own" />
                            </a>
                        </div>
                    </div>
                </div>
            </div>

            <!-- friends list -->
            <div class="card adminuiux-card mb-3 mb-lg-4">
                <div class="card-header">
                    <div class="row gx-3 align-items-center">
                        <div class="col-auto">
                            <i class="bi bi-people h5 me-1 avatar avatar-40 bg-theme-1-subtle text-theme-1 rounded me-2"></i>
                        </div>
                        <div class="col">
                            <h6 class="mb-0">Friends</h6>
                            <p class="text-secondary small">1256 Friends <small>(25 Common)</small></p>
                        </div>
                        <div class="col-auto">
                            <button class="btn btn-sm btn-theme"><i class="bi bi-plus-lg me-1 vm"></i> <span class="d-inline">Invite</span> <span class="d-none d-md-inline">Friend</span></button>
                            <a href="" class="btn btn-sm btn-link">View all</a>
                        </div>
                    </div>
                </div>
                <div class="card-body pb-0">
                    <div class="row gx-3">
                        <div class="col-12 col-md-6 col-lg-4">
                            <div class="card shadow-none mb-3">
                                <div class="card-body">
                                    <div class="row gx-3 align-items-center">
                                        <div class="col-auto">
                                            <div class="avatar avatar-80 overflow-hidden rounded">
                                                <figure class="h-100 w-100 coverimg">
                                                    <img src="assets/img/modern-ai-image/user-6.jpg" alt="" />
                                                </figure>
                                            </div>
                                        </div>
                                        <div class="col">
                                            <h6 class="text-truncated mb-0">Aditi Johnson</h6>
                                            <p>London, UK</p>
                                            <p class="text-secondary small">12 Mutual Friend</p>
                                        </div>
                                        <div class="col-auto d-none d-sm-block">
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
                        <div class="col-12 col-md-6 col-lg-4">
                            <div class="card shadow-none mb-3">
                                <div class="card-body">
                                    <div class="row gx-3 align-items-center">
                                        <div class="col-auto">
                                            <div class="avatar avatar-80 overflow-hidden rounded">
                                                <figure class="h-100 w-100 coverimg">
                                                    <img src="assets/img/modern-ai-image/user-4.jpg" alt="" />
                                                </figure>
                                            </div>
                                        </div>
                                        <div class="col">
                                            <h6 class="text-truncated mb-0">Steven Thomson</h6>
                                            <p>New York, USA</p>
                                            <p class="text-secondary small">2 Mutual Friend</p>
                                        </div>
                                        <div class="col-auto d-none d-sm-block">
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
                        <div class="col-12 col-md-6 col-lg-4">
                            <div class="card shadow-none mb-3">
                                <div class="card-body">
                                    <div class="row gx-3 align-items-center">
                                        <div class="col-auto">
                                            <div class="avatar avatar-80 overflow-hidden rounded">
                                                <figure class="h-100 w-100 coverimg">
                                                    <img src="assets/img/modern-ai-image/user-3.jpg" alt="" />
                                                </figure>
                                            </div>
                                        </div>
                                        <div class="col">
                                            <h6 class="text-truncated mb-0">Nicky Lambaa</h6>
                                            <p>Wembley, UK</p>
                                            <p class="text-secondary small">3 Mutual Friend</p>
                                        </div>
                                        <div class="col-auto d-none d-sm-block">
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
                        <div class="col-12 col-md-6 col-lg-4">
                            <div class="card shadow-none mb-3">
                                <div class="card-body">
                                    <div class="row gx-3 align-items-center">
                                        <div class="col-auto">
                                            <div class="avatar avatar-80 overflow-hidden rounded">
                                                <figure class="h-100 w-100 coverimg">
                                                    <img src="assets/img/modern-ai-image/user-2.jpg" alt="" />
                                                </figure>
                                            </div>
                                        </div>
                                        <div class="col">
                                            <h6 class="text-truncated mb-0">Shrivally</h6>
                                            <p>Amsterdam, NL</p>
                                            <p class="text-secondary small">12 Mutual Friend</p>
                                        </div>
                                        <div class="col-auto d-none d-sm-block">
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
                        <div class="col-12 col-md-6 col-lg-4">
                            <div class="card shadow-none mb-3">
                                <div class="card-body">
                                    <div class="row gx-3 align-items-center">
                                        <div class="col-auto">
                                            <div class="avatar avatar-80 overflow-hidden rounded">
                                                <figure class="h-100 w-100 coverimg">
                                                    <img src="assets/img/modern-ai-image/user-1.jpg" alt="" />
                                                </figure>
                                            </div>
                                        </div>
                                        <div class="col">
                                            <h6 class="text-truncated mb-0">Max Doe</h6>
                                            <p>London, UK</p>
                                            <p class="text-secondary small">25 Mutual Friend</p>
                                        </div>
                                        <div class="col-auto d-none d-sm-block">
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
                        <div class="col-12 col-md-6 col-lg-4">
                            <div class="card shadow-none mb-3">
                                <div class="card-body">
                                    <div class="row gx-3 align-items-center">
                                        <div class="col-auto">
                                            <div class="avatar avatar-80 overflow-hidden rounded">
                                                <figure class="h-100 w-100 coverimg">
                                                    <img src="assets/img/modern-ai-image/user-8.jpg" alt="" />
                                                </figure>
                                            </div>
                                        </div>
                                        <div class="col">
                                            <h6 class="text-truncated mb-0">Aditi Johnson</h6>
                                            <p>London, UK</p>
                                            <p class="text-secondary small">12 Mutual Friend</p>
                                        </div>
                                        <div class="col-auto d-none d-sm-block">
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
                        <div class="col-12 col-md-6 col-lg-4">
                            <div class="card shadow-none mb-3">
                                <div class="card-body">
                                    <div class="row gx-3 align-items-center">
                                        <div class="col-auto">
                                            <div class="avatar avatar-80 overflow-hidden rounded">
                                                <figure class="h-100 w-100 coverimg">
                                                    <img src="assets/img/modern-ai-image/user-7.jpg" alt="" />
                                                </figure>
                                            </div>
                                        </div>
                                        <div class="col">
                                            <h6 class="text-truncated mb-0">Aditi Johnson</h6>
                                            <p>London, UK</p>
                                            <p class="text-secondary small">12 Mutual Friend</p>
                                        </div>
                                        <div class="col-auto d-none d-sm-block">
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
                        <div class="col-12 col-md-6 col-lg-4">
                            <div class="card shadow-none mb-3">
                                <div class="card-body">
                                    <div class="row gx-3 align-items-center">
                                        <div class="col-auto">
                                            <div class="avatar avatar-80 overflow-hidden rounded">
                                                <figure class="h-100 w-100 coverimg">
                                                    <img src="assets/img/modern-ai-image/user-7-kid.jpg" alt="" />
                                                </figure>
                                            </div>
                                        </div>
                                        <div class="col">
                                            <h6 class="text-truncated mb-0">Preeti Dwivedi</h6>
                                            <p>Kashi, IN</p>
                                            <p class="text-secondary small">0 Mutual Friend</p>
                                        </div>
                                        <div class="col-auto d-none d-sm-block">
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
                        <div class="col-12 col-md-6 col-lg-4">
                            <div class="card shadow-none mb-3">
                                <div class="card-body">
                                    <div class="row gx-3 align-items-center">
                                        <div class="col-auto">
                                            <div class="avatar avatar-80 overflow-hidden rounded">
                                                <figure class="h-100 w-100 coverimg">
                                                    <img src="assets/img/modern-ai-image/user-1-kid.jpg" alt="" class="w-100" />
                                                </figure>
                                            </div>
                                        </div>
                                        <div class="col">
                                            <h6 class="text-truncated mb-0">Aditi Johnson</h6>
                                            <p>London, UK</p>
                                            <p class="text-secondary small">12 Mutual Friend</p>
                                        </div>
                                        <div class="col-auto d-none d-sm-block">
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
                    </div>
                </div>
            </div>

            <!-- Movies like -->
            <div class="card adminuiux-card mb-3 mb-lg-4">
                <div class="card-header">
                    <div class="row gx-3 align-items-center">
                        <div class="col-auto">
                            <i class="bi bi-collection-play h5 me-1 avatar avatar-40 bg-theme-1-subtle text-theme-1 theme-red rounded me-2"></i>
                        </div>
                        <div class="col">
                            <h6 class="mb-0">Favorite Movies</h6>
                            <p class="text-secondary small">All about choices and likes</p>
                        </div>
                        <div class="col-auto">
                            <a href="" class="btn btn-sm btn-link">View all</a>
                        </div>
                    </div>
                </div>
                <div class="card-body pb-0">
                    <div class="row gx-3">
                        <div class="col-6 col-md-4 col-lg-3 col-xl-2 mb-3 mb-lg-4">
                            <div class="card border-0 text-white height-250 overflow-hidden mb-3">
                                <div class="coverimg position-absolute end-0 top-0 w-100 h-100">
                                    <img src="assets/img/modern-ai-image/lion-1.jpg" alt="" style="display: none;" />
                                </div>
                            </div>
                            <p class="opacity-75 small mb-1">Sci-fi</p>
                            <h6>Lion Monk</h6>
                        </div>
                        <div class="col-6 col-md-4 col-lg-3 col-xl-2 mb-3 mb-lg-4">
                            <div class="card border-0 text-white height-250 overflow-hidden mb-3">
                                <div class="coverimg position-absolute end-0 top-0 w-100 h-100">
                                    <img src="assets/img/modern-ai-image/kids-2.jpg" alt="" style="display: none;" />
                                </div>
                            </div>
                            <p class="opacity-75 small mb-1">Family</p>
                            <h6>Gate of Galaxy</h6>
                        </div>
                        <div class="col-6 col-md-4 col-lg-3 col-xl-2 mb-3 mb-lg-4">
                            <div class="card border-0 text-white height-250 overflow-hidden mb-3">
                                <div class="coverimg position-absolute end-0 top-0 w-100 h-100">
                                    <img src="assets/img/modern-ai-image/tree-4.jpg" alt="" style="display: none;" />
                                </div>
                            </div>
                            <p class="opacity-75 small mb-1">Action</p>
                            <h6>Red Blood</h6>
                        </div>
                        <div class="col-6 col-md-4 col-lg-3 col-xl-2 mb-3 mb-lg-4">
                            <div class="card border-0 text-white height-250 overflow-hidden mb-3">
                                <div class="coverimg position-absolute end-0 top-0 w-100 h-100">
                                    <img src="assets/img/modern-ai-image/pet-3.jpg" alt="" style="display: none;" />
                                </div>
                            </div>
                            <p class="opacity-75 small mb-1">Sci-fi</p>
                            <h6>Kitty Move</h6>
                        </div>
                        <div class="col-6 col-md-4 col-lg-3 col-xl-2 mb-3 mb-lg-4">
                            <div class="card border-0 text-white height-250 overflow-hidden mb-3">
                                <div class="coverimg position-absolute end-0 top-0 w-100 h-100">
                                    <img src="assets/img/modern-ai-image/image-1.jpg" alt="" style="display: none;" />
                                </div>
                            </div>
                            <p class="opacity-75 small mb-1">Family</p>
                            <h6>Dolphin Life</h6>
                        </div>
                        <div class="col-6 col-md-4 col-lg-3 col-xl-2 mb-3 mb-lg-4">
                            <div class="card border-0 text-white height-250 overflow-hidden mb-3">
                                <div class="coverimg position-absolute end-0 top-0 w-100 h-100">
                                    <img src="assets/img/modern-ai-image/tree-8.jpg" alt="" style="display: none;" />
                                </div>
                            </div>
                            <p class="opacity-75 small mb-1">Action</p>
                            <h6>Future Here</h6>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Movies like -->
            <div class="card adminuiux-card mb-3 mb-lg-4">
                <div class="card-header">
                    <div class="row gx-3 align-items-center">
                        <div class="col-auto">
                            <i class="bi bi-calendar-event h5 me-1 avatar avatar-40 bg-theme-1-subtle text-theme-1 theme-green rounded me-2"></i>
                        </div>
                        <div class="col">
                            <h6 class="mb-0">Events</h6>
                            <p class="text-secondary small">All attending events</p>
                        </div>
                        <div class="col-auto">
                            <a href="" class="btn btn-sm btn-link">View all</a>
                        </div>
                    </div>
                </div>
                <div class="card-body pb-0">
                    <div class="row gx-3">
                        <div class="col-12 col-md-6 col-lg-4">
                            <div class="card shadow-none mb-3">
                                <div class="card-body">
                                    <div class="row gx-3">
                                        <div class="col-auto">
                                            <div class="avatar avatar-100 overflow-hidden rounded">
                                                <figure class="h-100 w-100 coverimg">
                                                    <img src="assets/img/modern-ai-image/image-2.jpg" alt="" class="w-100" />
                                                </figure>
                                            </div>
                                        </div>
                                        <div class="col">
                                            <p class="text-secondary small">12 August 2022</p>
                                            <a href="" class="style-none">
                                                <h6 class="mb-0">The Global Hack</h6>
                                            </a>
                                            <p class="small mb-1">Event by Dropshipping station</p>
                                            <p class="text-secondary small">3 Friends are attending</p>
                                        </div>
                                        <div class="col-auto d-none d-sm-block">
                                            <div class="dropdown d-inline-block">
                                                <a class="text-secondary no-caret" data-bs-toggle="dropdown" aria-expanded="false" data-bs-display="static" role="button">
                                                    <i class="bi bi-three-dots-vertical"></i>
                                                </a>
                                                <ul class="dropdown-menu dropdown-menu-end">
                                                    <li><a class="dropdown-item" href="javascript:void(0)">Invite</a></li>
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
                        <div class="col-12 col-md-6 col-lg-4">
                            <div class="card shadow-none mb-3">
                                <div class="card-body">
                                    <div class="row gx-3">
                                        <div class="col-auto">
                                            <div class="avatar avatar-100 overflow-hidden rounded">
                                                <figure class="h-100 w-100 coverimg">
                                                    <img src="assets/img/modern-ai-image/peacoke-2.jpg" alt="" />
                                                </figure>
                                            </div>
                                        </div>
                                        <div class="col">
                                            <p class="text-secondary small">10 September 2022</p>
                                            <a href="" class="style-none">
                                                <h6 class="mb-0">Do what you love to do!</h6>
                                            </a>
                                            <p class="small mb-1">Event by <b>Keep this private</b></p>
                                            <p class="text-secondary small">4 Friends are attending</p>
                                        </div>
                                        <div class="col-auto d-none d-sm-block">
                                            <div class="dropdown d-inline-block">
                                                <a class="text-secondary no-caret" data-bs-toggle="dropdown" aria-expanded="false" data-bs-display="static" role="button">
                                                    <i class="bi bi-three-dots-vertical"></i>
                                                </a>
                                                <ul class="dropdown-menu dropdown-menu-end">
                                                    <li><a class="dropdown-item" href="javascript:void(0)">Invite</a></li>
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
                        <div class="col-12 col-md-6 col-lg-4">
                            <div class="card shadow-none mb-3">
                                <div class="card-body">
                                    <div class="row gx-3 ">
                                        <div class="col-auto">
                                            <div class="avatar avatar-100 overflow-hidden rounded">
                                                <figure class="h-100 w-100 coverimg">
                                                    <img src="assets/img/modern-ai-image/flamingo-2.jpg" alt="" />
                                                </figure>
                                            </div>
                                        </div>
                                        <div class="col">
                                            <p class="text-secondary small">25 May 2022</p>
                                            <a href="" class="style-none">
                                                <h6 class="mb-0">Art doesn't mean just money</h6>
                                            </a>
                                            <p class="small mb-1">Event by <b>Spread Love</b></p>
                                            <p class="text-secondary small">4 Friends are attending</p>
                                        </div>
                                        <div class="col-auto d-none d-sm-block">
                                            <div class="dropdown d-inline-block">
                                                <a class="text-secondary no-caret" data-bs-toggle="dropdown" aria-expanded="false" data-bs-display="static" role="button">
                                                    <i class="bi bi-three-dots-vertical"></i>
                                                </a>
                                                <ul class="dropdown-menu dropdown-menu-end">
                                                    <li><a class="dropdown-item" href="javascript:void(0)">Invite</a></li>
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
                </div>
            </div>
        </div>
    `,
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class ProfileSocialComponent {
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
