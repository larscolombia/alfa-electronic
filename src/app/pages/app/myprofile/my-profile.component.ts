import { Component, OnInit, AfterViewInit, AfterContentChecked, OnDestroy, ViewChild, ElementRef, CUSTOM_ELEMENTS_SCHEMA } from "@angular/core";
import { RouterLink } from "@angular/router";
import Choices, { ClassNames } from "choices.js";
import Swiper from "swiper";
import { register } from "swiper/element/bundle";
register();

import { DaterangePickerRangesComponent } from "../../../components/input-fields/daterange-picker/daterange-picker-ranges.component";

@Component({
    selector: "app-my-profile",
    standalone: true,
    imports: [RouterLink, DaterangePickerRangesComponent],
    template: `
        <!-- page title -->
        <div class="container-fluid py-3">
            <div class="row gx-3 gx-lg-4 align-items-center page-title">
                <div class="col col-sm mb-3 mb-sm-0 order-1">
                    <h5 class="mb-0">My Profile</h5>
                    <p class="text-secondary small">Checkout personal and plan details</p>
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
                    <li class="breadcrumb-item bi active" aria-current="page">My Profile</li>
                </ol>
            </nav>
        </div>

        <!-- content -->
        <div class="container mt-3" id="main-content">
            <!-- welcome bar -->
            <div class="row gx-3 align-self-center ">
                <!-- welcome message -->
                <div class="col-12 col-sm mb-3 mb-lg-4">
                    <p class="h2 fw-normal mb-0">Welcome to your account,</p>
                    <h1 class="display-3 fw-medium"><span class="text-gradient">Adminuiux</span></h1>
                </div>

                <!-- rank and progress -->
                <div class="col-auto ml-auto align-self-center mb-3 mb-lg-4">
                    <div class="row gx-3 gx-lg-4 align-self-center text-nowrap">
                        <div class="col col-md col-lg-auto text-center">
                            <i class="bi bi-trophy h5 avatar avatar-50 bg-theme-r-gradient theme-orange text-white rounded-circle mb-2"></i>
                            <h3 class="increamentcount mb-0">2586</h3>
                            <p class="small text-secondary">Level 3</p>
                        </div>
                        <div class="col col-md col-lg-auto text-center">
                            <i class="bi bi-award h5 avatar avatar-50 bg-theme-r-gradient theme-green text-white rounded-circle mb-2"></i>
                            <h3 class="increamentcount mb-0">1583</h3>
                            <p class="small text-secondary">Your Rank</p>
                        </div>
                    </div>
                </div>
            </div>

            <div class="row gx-3 gx-lg-4">
                <div class="col-12 col-lg-5 col-xl-4">
                    <!-- profile details -->
                    <div class="card adminuiux-card mb-3 mb-lg-4 overflow-hidden">
                        <figure class="height-150 w-100 coverimg z-index-0 blur-overlay blur-theme">
                            <img src="assets/img/modern-ai-image/user-1.jpg" alt="" />
                        </figure>

                        <div class="card-body pt-0">
                            <div class="mt--100 text-center position-relative z-index-0 mb-3 mb-lg-4">
                                <figure class="avatar avatar-180 coverimg rounded-circle mx-auto z-index-1">
                                    <img src="assets/img/modern-ai-image/user-1.jpg" alt="" />
                                </figure>
                            </div>
                            <p class="text-secondary mb-2"><i class="bi bi-people me-2 align-middle text-theme-1"></i> <span class="align-middle">Admin</span></p>
                            <p class="text-secondary mb-2"><i class="bi bi-question-circle me-2 align-middle text-theme-1"></i> <span class="align-middle">happy&#64;adminuiuxi.com</span></p>
                            <p class="text-secondary mb-2"><i class="bi bi-telephone me-2 align-middle text-theme-1"></i> <span class="align-middle">+91 9856225A588</span></p>
                            <p class="text-secondary mb-2"><i class="bi bi-cake me-2 align-middle text-theme-1"></i> <span class="align-middle">15/09/2000</span></p>
                            <p class="text-secondary mb-2"><i class="bi bi-calendar-event me-2 align-middle text-theme-1"></i> <span class="align-middle">Member since 2023</span></p>
                            <p class="text-secondary d-flex"><i class="bi bi-geo-alt me-2 align-middle text-theme-1"></i> <span class="align-middle">13th Street. 47 W 13th St, New York, NY 10011, USA.</span></p>
                        </div>
                        <div class="card-footer justify-content-center text-center">
                            <a routerLink="/app/account-settings" class="btn btn-link"><i class="bi bi-gear"></i> Update Profile</a>
                        </div>
                    </div>

                    <!-- subscription -->
                    <div class="card adminuiux-card overflow-hidden bg-theme-1 text-white p-1 mb-3 mb-lg-4">
                        <div class="coverimg top-0 start-0 h-100 w-100 position-absolute z-index-0 opacity-50">
                            <img src="assets/img/modern-ai-image/flamingo-4.jpg" alt="" />
                        </div>
                        <div class="height-110 p-3 z-index-1">
                            <div class="row gx-3 align-items-center">
                                <div class="col">
                                    <h5 class="mb-0">My Subscription</h5>
                                    <p>3<span class="opacity-75">/5</span> User Active</p>
                                </div>
                                <div class="col-auto">
                                    <a routerLink="/app/subscription" class="btn btn-theme btn-sm btn-square"><i class="bi bi-arrow-right"></i></a>
                                </div>
                            </div>
                        </div>
                        <div class="card adminuiux-card bg-none blur-overlay overflow-hidden position-relative">
                            <div class="card-body z-index-1 text-white">
                                <div class="row gx-3 align-items-center">
                                    <div class="col-auto">
                                        <div class="avatar avatar-40 rounded bg-white-opacity"><i class="bi bi-gift"></i></div>
                                    </div>
                                    <div class="col">
                                        <h6 class="mb-0">MultiStore</h6>
                                        <p class="small opacity-75">Due: 26 July 2027</p>
                                    </div>
                                    <div class="col-auto text-end">
                                        <h6 class="mb-0">$20.00</h6>
                                        <p class="small opacity-75">per month</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- payment method -->
                    <div class="card adminuiux-card mb-3 mb-lg-4">
                        <div class="card-header">
                            <div class="row gx-3 align-items-center">
                                <div class="col-auto">
                                    <i class="bi bi-credit-card h5 me-1 avatar avatar-40 bg-theme-1-subtle text-theme-1 theme-green rounded"></i>
                                </div>
                                <div class="col">
                                    <h6 class="fw-medium mb-0">Payment Method</h6>
                                    <p class="text-secondary small">1 card saved</p>
                                </div>
                                <div class="col-auto">
                                    <a href="" class="btn btn-square btn-sm btn-link"><i class="bi bi-plus-lg"></i></a>
                                </div>
                            </div>
                        </div>
                        <div class="card-body pb-0 overflow-hidden">
                            <!-- Credit cards carousel card -->
                            <swiper-container slides-per-view="auto" space-between="16" autoplay="true" class="swiper swipernav overflow-visible">
                                <swiper-slide class="width-240">
                                    <div class="card adminuiux-card mb-2 theme-orange bg-theme-r-gradient overflow-hidden">
                                        <div class="coverimg top-0 start-0 h-100 w-100 position-absolute z-index-0 opacity-25">
                                            <img src="assets/img/modern-ai-image/tree-4.jpg" alt="" style="display: none;" />
                                        </div>
                                        <div class="card-body position-relative z-index-1">
                                            <div class="row gx-3 align-items-center mb-3">
                                                <div class="col-auto align-self-center">
                                                    <figure class="avatar avatar-30 rounded-circle coverimg">
                                                        <img src="assets/img/modern-ai-image/company9.jpg" alt="" />
                                                    </figure>
                                                </div>
                                                <div class="col text-end">
                                                    <p class="fs-12">
                                                        <span class="opacity-75 small">Monero</span><br />
                                                        <span class="">XMR</span>
                                                    </p>
                                                </div>
                                            </div>
                                            <p class="fw-medium h6 mb-3">XXX-DXXX000000146598</p>
                                            <div class="row gx-3 gx-lg-4">
                                                <div class="col-auto fs-12">
                                                    <p class="mb-0 opacity-50 small">Balance</p>
                                                    <p>25.45</p>
                                                </div>
                                                <div class="col text-end fs-12">
                                                    <p class="mb-0  opacity-50 small">USD Value</p>
                                                    <p>5268</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="row amount-data mb-3">
                                        <div class="col">
                                            <p class="text-secondary small mb-1">Expense</p>
                                            <p>
                                                4.00 <small class="text-success">18.0% <i class="bi bi-arrow-up"></i></small>
                                            </p>
                                        </div>
                                        <div class="col-auto text-end">
                                            <p class="text-secondary small mb-1">Limit Remain</p>
                                            <p>14.00</p>
                                        </div>
                                    </div>
                                    <div class="row amount-data align-items-center">
                                        <div class="col">
                                            <p class="opacity-75 small mb-1">This month</p>
                                            <p>4.5 <small>XMR</small></p>
                                        </div>
                                        <div class="col-auto avatar-group">
                                            <figure class="avatar avatar-30 rounded-circle coverimg overlay-ms-5" data-bs-toggle="tooltip" data-bs-placement="top" title="Shelvey Doe">
                                                <img src="assets/img/modern-ai-image/user-2.jpg" alt="" />
                                            </figure>
                                            <figure class="avatar avatar-30 rounded-circle coverimg overlay-ms-5" data-bs-toggle="tooltip" data-bs-placement="top" title="Maria Smith">
                                                <img src="assets/img/modern-ai-image/user-3.jpg" alt="" />
                                            </figure>
                                            <figure class="avatar avatar-30 rounded-circle coverimg overlay-ms-5" data-bs-toggle="tooltip" data-bs-placement="top" title="Steve Branden">
                                                <img src="assets/img/modern-ai-image/user-4.jpg" alt="" />
                                            </figure>
                                        </div>
                                    </div>
                                </swiper-slide>
                                <swiper-slide class="width-240">
                                    <div class="card adminuiux-card mb-2 theme-green bg-theme-r-gradient overflow-hidden">
                                        <div class="coverimg top-0 start-0 h-100 w-100 position-absolute z-index-0 opacity-25">
                                            <img src="assets/img/modern-ai-image/tree-2.jpg" alt="" style="display: none;" />
                                        </div>
                                        <div class="card-body position-relative z-index-1">
                                            <div class="row gx-3 align-items-center mb-3">
                                                <div class="col-auto align-self-center">
                                                    <figure class="avatar avatar-30 rounded-circle coverimg">
                                                        <img src="assets/img/modern-ai-image/company10.png" alt="" />
                                                    </figure>
                                                </div>
                                                <div class="col text-end">
                                                    <p class="fs-12">
                                                        <span class="small">Ethereum Classic</span><br />
                                                        <span class="">ETC</span>
                                                    </p>
                                                </div>
                                            </div>
                                            <p class="fw-medium h6 mb-3">XXX-DXXX000000146598</p>
                                            <div class="row gx-3 gx-lg-4">
                                                <div class="col-auto fs-12">
                                                    <p class="mb-0 small">Balance</p>
                                                    <p>12541</p>
                                                </div>
                                                <div class="col text-end fs-12">
                                                    <p class="mb-0 small">USD Value</p>
                                                    <p>46000</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="row amount-data mb-3">
                                        <div class="col">
                                            <p class="text-secondary small mb-1">Expense</p>
                                            <p>
                                                24.00 <small class="text-danger">3.0% <i class="bi bi-arrow-down"></i></small>
                                            </p>
                                        </div>
                                        <div class="col-auto text-end">
                                            <p class="text-secondary small mb-1">Limit Remain</p>
                                            <p>100.00</p>
                                        </div>
                                    </div>
                                    <div class="row amount-data align-items-center">
                                        <div class="col">
                                            <p class="opacity-75 small mb-1">This month</p>
                                            <p>14.0 <small>ETC</small></p>
                                        </div>
                                        <div class="col-auto avatar-group">
                                            <figure class="avatar avatar-30 rounded-circle coverimg overlay-ms-5" data-bs-toggle="tooltip" data-bs-placement="top" title="Preview Purpose">
                                                <img src="assets/img/modern-ai-image/company7.jpg" alt="" />
                                            </figure>
                                            <figure class="avatar avatar-30 rounded-circle coverimg overlay-ms-5" data-bs-toggle="tooltip" data-bs-placement="top" title="Maria Smith">
                                                <img src="assets/img/modern-ai-image/user-3.jpg" alt="" />
                                            </figure>
                                            <figure class="avatar avatar-30 rounded-circle coverimg overlay-ms-5" data-bs-toggle="tooltip" data-bs-placement="top" title="Steve Branden">
                                                <img src="assets/img/modern-ai-image/user-4.jpg" alt="" />
                                            </figure>
                                        </div>
                                    </div>
                                </swiper-slide>
                                <swiper-slide class="width-240">
                                    <div class="card adminuiux-card mb-2 bg-r-gradient theme-orange overflow-hidden">
                                        <div class="card-body position-relative z-index-1">
                                            <div class="row gx-3 align-items-center mb-3">
                                                <div class="col-auto align-self-center">
                                                    <figure class="avatar avatar-30 rounded-circle coverimg">
                                                        <img src="assets/img/modern-ai-image/company8.jpg" alt="" />
                                                    </figure>
                                                </div>
                                                <div class="col text-end">
                                                    <p class="fs-12">
                                                        <span class="opacity-75 small">Shiba Inu</span><br />
                                                        <span class="">SHIB</span>
                                                    </p>
                                                </div>
                                            </div>
                                            <p class="fw-medium h6 mb-3">XXX-DXXX000000146598</p>
                                            <div class="row gx-3 gx-lg-4">
                                                <div class="col-auto fs-12">
                                                    <p class="mb-0 opacity-50 small">Balance</p>
                                                    <p>113258k</p>
                                                </div>
                                                <div class="col text-end fs-12">
                                                    <p class="mb-0  opacity-50 small">USD Value</p>
                                                    <p>4352</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="row amount-data mb-3">
                                        <div class="col">
                                            <p class="text-secondary small mb-1">Expense</p>
                                            <p>
                                                1500.00 <small class="text-success">18.0 <i class="bi bi-arrow-up"></i></small>
                                            </p>
                                        </div>
                                        <div class="col-auto text-end">
                                            <p class="text-secondary small mb-1">Limit Remain</p>
                                            <p>13500.00</p>
                                        </div>
                                    </div>
                                    <div class="row amount-data align-items-center">
                                        <div class="col">
                                            <p class="opacity-75 small mb-1">This month</p>
                                            <p>12000.00 <small>SHIB</small></p>
                                        </div>
                                        <div class="col-auto avatar-group">
                                            <figure class="avatar avatar-30 rounded-circle coverimg overlay-ms-5" data-bs-toggle="tooltip" data-bs-placement="top" title="Shelvey Doe">
                                                <img src="assets/img/modern-ai-image/user-2.jpg" alt="" />
                                            </figure>
                                            <figure class="avatar avatar-30 rounded-circle coverimg overlay-ms-5" data-bs-toggle="tooltip" data-bs-placement="top" title="Maria Smith">
                                                <img src="assets/img/modern-ai-image/user-3.jpg" alt="" />
                                            </figure>
                                            <figure class="avatar avatar-30 rounded-circle coverimg overlay-ms-5" data-bs-toggle="tooltip" data-bs-placement="top" title="Steve Branden">
                                                <img src="assets/img/modern-ai-image/user-4.jpg" alt="" />
                                            </figure>
                                        </div>
                                    </div>
                                </swiper-slide>
                            </swiper-container>
                        </div>
                    </div>
                </div>
                <div class="col-12 col-lg-7 col-xl-8">
                    <!-- alert -->
                    <div class="alert alert-info alert-dismissible mb-3 mb-lg-4" role="alert">
                        <button type="button" class="btn btn-square btn-sm btn-link position-absolute top-0 end-0 m-2" data-bs-dismiss="alert"><i class="bi bi-x-lg"></i></button>
                        <div class="row gx-3 align-items-center mb-3">
                            <div class="col-auto">
                                <i class="bi bi-telephone-plus h4 me-1 avatar avatar-40 rounded"></i>
                            </div>
                            <div class="col">
                                <h6>Add a phone number</h6>
                            </div>
                        </div>
                        <div class="row gx-3 align-items-center">
                            <div class="col-12 col-sm">
                                <p>Ensure you never lose access to your account and receive important account updates like billing and security alerts.</p>
                            </div>
                            <div class="col-auto col-sm-auto">
                                <a routerLink="/app/account-settings" class="btn btn-sm btn-theme my-2">Add Phone</a>
                            </div>
                        </div>
                    </div>

                    <!-- financial navigation -->
                    <div class="row gx-3 gx-lg-4">
                        <div class="col-12 col-sm-6 col-lg-6 col-xxl-4">
                            <div class="card adminuiux-card mb-3 mb-lg-4">
                                <div class="card-body text-center py-4">
                                    <i class="bi bi-cash-stack h5 avatar avatar-60 mb-3 bg-theme-1-subtle text-theme-1 rounded-circle"></i>
                                    <h4 class="mb-1">1254.00 <small>USD</small></h4>
                                    <p class="mb-3">Your Earning</p>
                                    <p class="text-secondary mb-3">1 June 2022 - 31 June 2022</p>
                                    <p><a routerLink="/app/earning" class="btn btn-link">View More</a></p>
                                </div>
                            </div>
                        </div>
                        <div class="col-12 col-sm-6 col-lg-6 col-xxl-4">
                            <div class="card adminuiux-card mb-3 mb-lg-4">
                                <div class="card-body text-center py-4">
                                    <i class="bi bi-wallet h5 avatar avatar-60 mb-3 bg-theme-1-subtle text-theme-1 rounded-circle"></i>
                                    <h4 class="mb-1">1400.00 <small>USD</small></h4>
                                    <p class="mb-3">Your Payouts</p>
                                    <p class="text-secondary mb-3">May 2022 <span class="badge text-bg-theme-1 theme-green mx-2">Success</span></p>
                                    <p><a routerLink="/app/payment" class="btn btn-link btn-rounded">View All</a></p>
                                </div>
                            </div>
                        </div>
                        <div class="col-12 col-md-6 col-lg-12 col-xl-6 col-xxl-4">
                            <div class="card adminuiux-card mb-3 mb-lg-4">
                                <div class="card-body text-center py-4">
                                    <i class="bi bi-receipt h5 avatar avatar-60 mb-3 bg-theme-1-subtle text-theme-1 rounded-circle"></i>
                                    <h4 class="mb-1">16</h4>
                                    <p class="mb-3">Your Statements</p>
                                    <p class="text-secondary mb-3">1 June 2022 - 25 June 2022</p>
                                    <p><a routerLink="/app/statement" class="btn btn-link btn-rounded">View all</a></p>
                                </div>
                            </div>
                        </div>
                        <div class="col-12 col-md-6 col-lg-12 col-xl-6 col-xxl-12">
                            <!-- overview -->
                            <div class="card adminuiux-card mb-3 mb-lg-4">
                                <div class="card-header">
                                    <h6 class="mb-0">Profile Overview</h6>
                                    <p class="text-secondary small"><i class="bi bi-eye me-1"></i> Visible to you only</p>
                                </div>
                                <div class="card-body">
                                    <div class="row gx-3">
                                        <div class="col-12 col-md-12 col-xxl-4 mb-3 mb-xxl-0">
                                            <div class="row gx-3 align-items-center">
                                                <div class="col-auto">
                                                    <i class="bi bi-people avatar avatar-40 h5 bg-theme-1-subtle text-theme-1 rounded"></i>
                                                </div>
                                                <div class="col">
                                                    <h5 class="mb-0">36 <small>Profile views</small></h5>
                                                    <p class="text-secondary small">Your profile visitor</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="col-12 col-md-12 col-xxl-4 mb-3 mb-xxl-0">
                                            <div class="row gx-3 align-items-center">
                                                <div class="col-auto">
                                                    <i class="bi bi-bar-chart avatar avatar-40 h5 bg-theme-1-subtle text-theme-1 rounded"></i>
                                                </div>
                                                <div class="col">
                                                    <h5 class="mb-0">
                                                        54 <small class="text-theme-1 theme-green"><i class="bi bi-arrow-uo"></i> 5.65%</small> <small>interaction</small>
                                                    </h5>
                                                    <p class="text-secondary small">Your posts are getting hits</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="col-12 col-md-12 col-xxl-4 mb-3 mb-lg-0">
                                            <div class="row gx-3 align-items-center">
                                                <div class="col-auto">
                                                    <i class="bi bi-search avatar avatar-40 h5 bg-theme-1-subtle text-theme-1 rounded"></i>
                                                </div>
                                                <div class="col">
                                                    <h5 class="mb-0">144 <small>Search appearance</small></h5>
                                                    <p class="text-secondary small">You are in search result</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- profile link -->
                    <div class="row gx-3 gx-lg-4">
                        <div class="col-12 col-sm-6 col-lg-6 col-xxl-4">
                            <a routerLink="/app/profile-social" class="card adminuiux-card bg-l-gradient-light style-none mb-3 mb-lg-4 theme-cyan">
                                <div class="card-body">
                                    <h6>Social Profile</h6>
                                    <span class="btn btn-sm btn-link">View <i class="bi bi-arrow-right"></i></span>
                                </div>
                            </a>
                        </div>
                        <div class="col-12 col-sm-6 col-lg-6 col-xxl-4">
                            <a routerLink="/app/profile-analytical" class="card adminuiux-card bg-l-gradient-light style-none mb-3 mb-lg-4 theme-orange">
                                <div class="card-body">
                                    <h6>Analytical Profile</h6>
                                    <span class="btn btn-sm btn-link">View <i class="bi bi-arrow-right"></i></span>
                                </div>
                            </a>
                        </div>
                        <div class="col-12 col-sm-6 col-lg-6 col-xxl-4">
                            <a routerLink="/app/profile-professional" class="card adminuiux-card bg-l-gradient-light style-none mb-3 mb-lg-4 theme-yellow">
                                <div class="card-body">
                                    <h6>Professional Profile</h6>
                                    <span class="btn btn-sm btn-link">View <i class="bi bi-arrow-right"></i></span>
                                </div>
                            </a>
                        </div>
                    </div>

                    <!-- background -->
                    <div class="card adminuiux-card mb-3 mb-lg-4">
                        <div class="card-header">
                            <div class="row gx-3 align-items-center">
                                <div class="col-auto">
                                    <i class="bi bi-briefcase h5 me-1 avatar avatar-40 bg-theme-1-subtle text-theme-1 rounded "></i>
                                </div>
                                <div class="col">
                                    <h6 class="mb-0">Experience</h6>
                                    <p class="text-secondary small">Currently working</p>
                                </div>
                                <div class="col-auto">
                                    <button class="btn btn-link btn-sm"><i class="bi bi-plus fs-6 me-2"></i><span>Add</span> <span class="d-none d-md-inline-block">New Role</span></button>
                                </div>
                            </div>
                        </div>
                        <div class="card-body pb-0">
                            <div class="row gx-3 mb-4">
                                <div class="col-auto">
                                    <figure class="avatar avatar-40 rounded coverimg">
                                        <img src="assets/img/logo-512.png" alt="" />
                                    </figure>
                                </div>
                                <div class="col">
                                    <h6 class="mb-1">Creative UI/UX Designer at <a href="https://adminuiux.com">Adminuiux</a>, London, UK</h6>
                                    <p class="small text-secondary">July 2013 - Present, 9 years 2 months</p>
                                    <p class="text-secondary">We are working in good company with reputed online presence and there are multi-disciplinary designers are available to give creative works.</p>
                                </div>
                            </div>

                            <div class="row gx-3 mb-4">
                                <div class="col-auto">
                                    <figure class="avatar-40 avatar rounded coverimg">
                                        <img src="assets/img/modern-ai-image/company7.jpg" alt="" />
                                    </figure>
                                </div>
                                <div class="col">
                                    <h6 class="mb-1">Creative Designer at <a href="https://adminuiux.com">Micro Window</a>, Tipura, IN</h6>
                                    <p class="small text-secondary">July 2012 - 2013, 1 years 1 month</p>
                                    <p class="text-secondary">We are working in good company with reputed online presence and there are multi-disciplinary designers are available to give creative works.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- education -->
                    <div class="card adminuiux-card mb-3 mb-lg-4">
                        <div class="card-header">
                            <div class="row gx-3 align-items-center">
                                <div class="col-auto">
                                    <i class="bi bi-briefcase h5 me-1 avatar avatar-40 bg-theme-1-subtle text-theme-1 rounded "></i>
                                </div>
                                <div class="col">
                                    <h6 class="mb-0">Education</h6>
                                    <p class="text-secondary small">Strong foundation</p>
                                </div>
                                <div class="col-auto">
                                    <button class="btn btn-link btn-sm"><i class="bi bi-plus fs-6 me-2"></i><span>Add</span> <span class="d-none d-md-inline-block">New Education</span></button>
                                </div>
                            </div>
                        </div>
                        <div class="card-body pb-0">
                            <div class="row gx-3 mb-4">
                                <div class="col-auto">
                                    <figure class="avatar-40 avatar rounded coverimg">
                                        <img src="assets/img/modern-ai-image/team-sq-2.jpg" alt="" />
                                    </figure>
                                </div>
                                <div class="col">
                                    <h6 class="mb-1">M.Tech from <a href="https://adminuiux.com">London bridge University</a>, London, UK</h6>
                                    <p class="small text-secondary">July 2010 - July 2012, 3 years</p>
                                    <p class="text-secondary">This helped me a strong base to build my career and i always recommended to all people to must visit and study at University.</p>
                                </div>
                            </div>

                            <div class="row gx-3 mb-4">
                                <div class="col-auto">
                                    <figure class="avatar-40 avatar rounded coverimg">
                                        <img src="assets/img/modern-ai-image/user-3.jpg" alt="" />
                                    </figure>
                                </div>
                                <div class="col">
                                    <h6 class="mb-1">LifeTime Learning at <a href="https://adminuiux.com">Google Search</a>, Online remote</h6>
                                    <p class="small text-secondary">July 2008 - Present, 24 years and counting</p>
                                    <p class="text-secondary">Its been pleasure to mention that every student learned many things from online and most helpful finger tip resource available at google search and we thank you for all of help and support and improvement provided for us. You should try this and hope to have great learning.</p>
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
export class MyProfileComponent {
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
