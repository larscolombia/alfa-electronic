import { Component, OnInit, AfterViewInit, AfterContentChecked, OnDestroy, ViewChild, ElementRef, CUSTOM_ELEMENTS_SCHEMA } from "@angular/core";
import { RouterLink } from "@angular/router";
import Choices, { ClassNames } from "choices.js";
import Swiper from "swiper";
import { register } from "swiper/element/bundle";
register();

import { DaterangePickerRangesComponent } from "../../../components/input-fields/daterange-picker/daterange-picker-ranges.component";

@Component({
    selector: "app-finance-rewards",
    standalone: true,
    imports: [RouterLink, DaterangePickerRangesComponent],
    template: `
        <!-- page title -->
        <div class="container-fluid py-3">
            <div class="row gx-3 gx-lg-4 align-items-center page-title">
                <div class="col col-sm mb-3 mb-sm-0 order-1">
                    <h5 class="mb-0">My Rewards</h5>
                    <p class="text-secondary small">Spend more and earn more</p>
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
                    <li class="breadcrumb-item bi"><a routerLink="/app/finance-dashboard">Finance</a></li>
                    <li class="breadcrumb-item bi active" aria-current="page">Finance Dashboard</li>
                </ol>
            </nav>
        </div>

        <!-- content -->
        <div class="container mt-3" id="main-content">
            <div class="row gx-3 gx-lg-4 align-items-center">
                <!-- welcome message -->
                <div class="col-12 col-md-4 col-lg-3 mb-3 mb-lg-4">
                    <div class="row gx-3 align-items-center mb-3">
                        <div class="col">
                            <h1 class="text-gradient mb-0">AdminUIUX</h1>
                            <h5 class="mb-2 fw-normal text-secondary"><i class="bi bi-person-fill"></i> ID: 126683</h5>
                        </div>
                    </div>
                    <div class="row gx-3 gx-lg-4 align-items-center">
                        <div class="col-auto">
                            <i class="bi bi-star h6 avatar avatar-40 bg-theme-r-gradient theme-yellow text-white rounded-circle"></i>
                        </div>
                        <div class="col">
                            <p class="text-secondary mb-1">5000 to Level 4</p>
                            <div class=" progress height-dynamic bg-theme-1-subtle" style="--h-dynamic:5px">
                                <div class="progress-bar bg-theme-1" role="progressbar" style="width: 25%" aria-valuenow="25" aria-valuemin="0" aria-valuemax="100"></div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- rank and progress -->
                <div class="col-12 col-md-auto mb-3 mb-lg-4 ms-auto align-self-center">
                    <div class="row gx-3 gx-lg-4">
                        <div class="col col-md col-lg-auto mnw-100 text-center">
                            <i class="bi bi-trophy h5 avatar avatar-60 bg-theme-1-subtle text-theme-1 theme-orange rounded-circle mb-3"></i>
                            <h4 class="increamentcount mb-0">2586</h4>
                            <p class="small text-secondary">Level 3</p>
                        </div>
                        <div class="col col-md col-lg-auto mnw-100 text-center">
                            <i class="bi bi-award h4 avatar avatar-60 bg-theme-1-subtle text-theme-1 theme-green rounded-circle mb-3"></i>
                            <h4 class="increamentcount mb-0">1583</h4>
                            <p class="small text-secondary">Your Rank</p>
                        </div>
                        <div class="col col-md col-lg-auto mnw-100 text-center">
                            <i class="bi bi-clipboard-check h5 avatar avatar-60 bg-theme-1-subtle text-theme-1 rounded-circle mb-3"></i>
                            <h4 class="increamentcount mb-0">1356</h4>
                            <p class="small text-secondary">Tasks Done</p>
                        </div>
                    </div>
                </div>
            </div>

            <div class="row gx-3 gx-lg-4">
                <!-- summary blocks -->
                <div class="col-12 col-sm-6 col-md-6 col-lg-3 col-xxl-3">
                    <div class="card adminuiux-card theme-blue bg-theme-r-gradient mb-3 mb-lg-4">
                        <div class="card-body">
                            <div class="row gx-3 gx-lg-4 align-items-center">
                                <div class="col-auto">
                                    <div class="avatar avatar-50 h5 bg-white-opacity text-white rounded-circle">
                                        <i class="bi bi-calendar2-check"></i>
                                    </div>
                                </div>
                                <div class="col">
                                    <p class="opacity-75 small mb-1">Task Completed</p>
                                    <h5>60<small>%</small></h5>
                                </div>
                                <div class="col-auto">
                                    <div class="dropdown d-inline-block">
                                        <a class="text-white no-caret" data-bs-toggle="dropdown" aria-expanded="false" data-bs-display="static" role="button">
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
                <div class="col-12 col-sm-6 col-md-6 col-lg-3 col-xxl-3">
                    <div class="card adminuiux-card theme-green bg-theme-r-gradient mb-3 mb-lg-4">
                        <div class="card-body">
                            <div class="row gx-3 gx-lg-4 align-items-center">
                                <div class="col-auto">
                                    <div class="avatar avatar-50 h5 bg-white-opacity text-white rounded-circle">
                                        <i class="bi bi-thermometer-sun"></i>
                                    </div>
                                </div>
                                <div class="col">
                                    <p class="opacity-75 small mb-1">Savings</p>
                                    <h5>450 <small>USD</small></h5>
                                </div>
                                <div class="col-auto">
                                    <div class="dropdown d-inline-block">
                                        <a class="text-white no-caret" data-bs-toggle="dropdown" aria-expanded="false" data-bs-display="static" role="button">
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
                <div class="col-12 col-sm-6 col-md-6 col-lg-3 col-xxl-3">
                    <div class="card adminuiux-card mb-3 mb-lg-4 theme-yellow bg-theme-r-gradient text-white">
                        <div class="card-body">
                            <div class="row gx-3 gx-lg-4 align-items-center">
                                <div class="col-auto">
                                    <div class="avatar avatar-50 h5 bg-white-opacity text-white rounded-circle">
                                        <i class="bi bi-star"></i>
                                    </div>
                                </div>
                                <div class="col">
                                    <p class="opacity-75 small mb-1">Points Earned</p>
                                    <h5 class="fw-medium">12550</h5>
                                </div>
                                <div class="col-auto">
                                    <div class="dropdown d-inline-block">
                                        <a class="text-white no-caret" data-bs-toggle="dropdown" aria-expanded="false" data-bs-display="static" role="button">
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
                <div class="col-12 col-sm-6 col-md-6 col-lg-3 col-xxl-3">
                    <div class="card adminuiux-card theme-red bg-theme-r-gradient mb-3 mb-lg-4">
                        <div class="card-body">
                            <div class="row gx-3 gx-lg-4 align-items-center">
                                <div class="col-auto">
                                    <div class="avatar avatar-50 h5 bg-white-opacity text-white rounded-circle">
                                        <i class="bi bi-coin"></i>
                                    </div>
                                </div>
                                <div class="col">
                                    <p class="opacity-75 small mb-1">Redeemed</p>
                                    <h5 class="fw-medium">1525<small>k USD</small></h5>
                                </div>
                                <div class="col-auto">
                                    <div class="dropdown d-inline-block">
                                        <a class="text-white no-caret" data-bs-toggle="dropdown" aria-expanded="false" data-bs-display="static" role="button">
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
                <div class="col-12 col-md-6 col-lg-6 col-xxl-6 mb-3 mb-lg-4 z-index-0">
                    <div class="card adminuiux-card overflow-hidden h-100">
                        <div class="card-body position-relative">
                            <div class="coverimg w-75 h-100 end-0 top-0 position-absolute cover-right-center-img">
                                <img src=" assets/img/adminux/offer-1.png" class="w-100" alt="" />
                            </div>
                            <div class="row align-items-center z-index-1 position-relative h-100">
                                <div class="col-10 col-md-11 col-lg-7 py-2">
                                    <h4 class="text-theme-1 mb-1">Earn 20%</h4>
                                    <h5>Make your wallet even bigger</h5>
                                    <p class="text-secondary">Share your referral code to your friends and earn flat 20% amount.</p>
                                    <a class="btn btn-theme btn-sm" href="javascript:void(0)">REFJOIN550 <i class="bi bi-copy"></i></a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-12 col-md-6 col-lg-6 col-xxl-6 mb-3 mb-lg-4">
                    <div class="card adminuiux-card theme-blue overflow-hidden">
                        <div class="card-body p-0">
                            <div class="row h-100">
                                <div class="col bg-theme-1-subtle text-center py-4">
                                    <div class="avatar avatar-120 coverimg mb-2 rounded">
                                        <img src="assets/img/adminuiux-qr.png" alt="" class="w-100" />
                                    </div>
                                    <br />
                                    <a class="btn btn-theme btn-sm" routerLink="/app/payment">Scan to <i class="bi bi-star-fill me-1 fs-12"></i>250</a>
                                </div>
                                <div class=" col position-relative text-white text-center">
                                    <div class="coverimg position-absolute end-0 top-0 w-100 h-100">
                                        <img src="assets/img/modern-ai-image/user-1.jpg" alt="" />
                                    </div>
                                    <div class="row h-100">
                                        <div class="col-12 align-self-center">
                                            <h4 class="mb-0">50%</h4>
                                            <p>Instant Off</p>
                                            <p>Get most popular discounts with easy Google Pay. Just scan QR an pay it.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- best reward products -->
            <div class="row gx-3 gx-lg-4 mb-3 mb-lg-4">
                <div class="col text-center py-3">
                    <h4>Best value of <span class="text-gradient">Earned Points</span> by Rewards here</h4>
                    <p class="text-secondary">You have done amazing choice & earned points. Now time to get rewarded.</p>
                </div>
            </div>

            <!-- redeem points for services global -->
            <div class="row gx-3 align-items-center mb-3 mb-lg-4">
                <div class="col-auto">
                    <i class="bi bi-cart h5 avatar avatar-40 bg-theme-1-subtle text-theme-1 theme-red rounded"></i>
                </div>
                <div class="col">
                    <h6 class="mb-0">Best Rewards</h6>
                    <p class="small text-secondary">Use earned points and get rewarded</p>
                </div>
            </div>
            <!-- Swiper -->
            <swiper-container slides-per-view="auto" space-between="16" autoplay="true" class="swiper swipernav mb-3 mb-lg-4">
                <swiper-slide class="w-auto">
                    <div class="card border-0 text-white height-300 width-200 overflow-hidden mb-3">
                        <div class="coverimg position-absolute end-0 top-0 w-100 h-100 overlay-gradiant">
                            <img src="assets/img/modern-ai-image/pet-3.jpg" alt="" />
                        </div>
                        <div class="card-body bg-none ">
                            <div class="overlay"></div>
                            <div class="row h-100 z-index-1 position-relative ">
                                <div class="col-12 align-self-end">
                                    <p class="opacity-75 small mb-1">Media Services</p>
                                    <h6>Get 1 Year free Youtube Premium</h6>
                                </div>
                            </div>
                        </div>
                    </div>
                    <img src="assets/img/adminux/services-youtubelogo-pika.png" class="mw-100 mb-3" alt="" /><br />
                    <button type="button" class="btn btn-outline-theme btn-sm">Use <i class="bi bi-star-fill ms-1 fs-12 text-yellow"></i> 250</button>
                </swiper-slide>
                <swiper-slide class="w-auto">
                    <div class="card border-0 text-white height-300 width-200 overflow-hidden mb-3">
                        <div class="coverimg position-absolute end-0 top-0 w-100 h-100 overlay-gradiant">
                            <img src="assets/img/modern-ai-image/taxi-1.jpg" alt="" />
                        </div>
                        <div class="card-body">
                            <div class="overlay"></div>
                            <div class="row h-100 z-index-1 position-relative ">
                                <div class="col-12 align-self-end">
                                    <p class="opacity-75 small mb-1">Entertainment</p>
                                    <h6>Get 3 Months Netflix Access*</h6>
                                </div>
                            </div>
                        </div>
                    </div>
                    <img src="assets/img/adminux/services-netflixlogo-pika.png" class="mw-100 mb-3" alt="" /><br />
                    <button type="button" class="btn btn-outline-theme btn-sm">Use <i class="bi bi-star-fill ms-1 fs-12 text-yellow"></i> 250</button>
                </swiper-slide>
                <swiper-slide class="w-auto">
                    <div class="card border-0 text-white height-300 width-200 overflow-hidden mb-3">
                        <div class="coverimg position-absolute end-0 top-0 w-100 h-100 overlay-gradiant">
                            <img src="assets/img/modern-ai-image/user-1-kid.jpg" alt="" />
                        </div>
                        <div class="card-body">
                            <div class="overlay"></div>
                            <div class="row h-100 z-index-1 position-relative ">
                                <div class="col-12 align-self-end">
                                    <p class="opacity-75 small mb-1">Financial Services</p>
                                    <h6>Get 1 Year free Paypal business free account</h6>
                                </div>
                            </div>
                        </div>
                    </div>
                    <img src="assets/img/adminux/services-paypal.png" class="mw-100 mb-3" alt="" /><br />
                    <button type="button" class="btn btn-outline-theme btn-sm">Use <i class="bi bi-star-fill ms-1 fs-12 text-yellow"></i> 0</button>
                </swiper-slide>
                <swiper-slide class="w-auto">
                    <div class="card border-0 text-white height-300 width-200 overflow-hidden mb-3">
                        <div class="coverimg position-absolute end-0 top-0 w-100 h-100 overlay-gradiant">
                            <img src="assets/img/modern-ai-image/tree-2.jpg" alt="" />
                        </div>
                        <div class="card-body">
                            <div class="overlay"></div>
                            <div class="row h-100 z-index-1 position-relative ">
                                <div class="col-12 align-self-end">
                                    <p class="opacity-75 small mb-1">Food</p>
                                    <h6>Get 1 Month free Swiggy One services</h6>
                                </div>
                            </div>
                        </div>
                    </div>
                    <img src="assets/img/adminux/services-swiggy.png" class="mw-100 mb-3" alt="" /><br />
                    <button type="button" class="btn btn-outline-theme btn-sm">Use <i class="bi bi-star-fill ms-1 fs-12 text-yellow"></i> 250</button>
                </swiper-slide>
                <swiper-slide class="w-auto">
                    <div class="card border-0 text-white height-300 width-200 overflow-hidden mb-3">
                        <div class="coverimg position-absolute end-0 top-0 w-100 h-100 overlay-gradiant">
                            <img src="assets/img/modern-ai-image/bus-3.jpg" alt="" />
                        </div>
                        <div class="card-body">
                            <div class="overlay"></div>
                            <div class="row h-100 z-index-1 position-relative ">
                                <div class="col-12 align-self-end">
                                    <p class="opacity-75 small mb-1">Entertainment</p>
                                    <h6>Get 1 Year free Amazon Prime services</h6>
                                </div>
                            </div>
                        </div>
                    </div>
                    <img src="assets/img/adminux/services-amazon_Prime.png" class="mw-100 mb-3" alt="" /><br />
                    <button type="button" class="btn btn-outline-theme btn-sm">Use <i class="bi bi-star-fill ms-1 fs-12 text-yellow"></i> 300</button>
                </swiper-slide>
                <swiper-slide class="w-auto">
                    <div class="card border-0 text-white height-300 width-200 overflow-hidden mb-3">
                        <div class="coverimg position-absolute end-0 top-0 w-100 h-100 overlay-gradiant">
                            <img src="assets/img/modern-ai-image/pet-3.jpg" alt="" />
                        </div>
                        <div class="card-body bg-none ">
                            <div class="overlay"></div>
                            <div class="row h-100 z-index-1 position-relative ">
                                <div class="col-12 align-self-end">
                                    <p class="opacity-75 small mb-1">Media Services</p>
                                    <h6>Get 1 Year free Youtube Premium</h6>
                                </div>
                            </div>
                        </div>
                    </div>
                    <img src="assets/img/adminux/services-youtubelogo-pika.png" class="mw-100 mb-3" alt="" /><br />
                    <button type="button" class="btn btn-outline-theme btn-sm">Use <i class="bi bi-star-fill ms-1 fs-12 text-yellow"></i> 250</button>
                </swiper-slide>
                <swiper-slide class="w-auto">
                    <div class="card border-0 text-white height-300 width-200 overflow-hidden mb-3">
                        <div class="coverimg position-absolute end-0 top-0 w-100 h-100 overlay-gradiant">
                            <img src="assets/img/modern-ai-image/taxi-1.jpg" alt="" />
                        </div>
                        <div class="card-body">
                            <div class="overlay"></div>
                            <div class="row h-100 z-index-1 position-relative ">
                                <div class="col-12 align-self-end">
                                    <p class="opacity-75 small mb-1">Entertainment</p>
                                    <h6>Get 3 Months Netflix Access*</h6>
                                </div>
                            </div>
                        </div>
                    </div>
                    <img src="assets/img/adminux/services-netflixlogo-pika.png" class="mw-100 mb-3" alt="" /><br />
                    <button type="button" class="btn btn-outline-theme btn-sm">Use <i class="bi bi-star-fill ms-1 fs-12 text-yellow"></i> 250</button>
                </swiper-slide>
                <swiper-slide class="w-auto">
                    <div class="card border-0 text-white height-300 width-200 overflow-hidden mb-3">
                        <div class="coverimg position-absolute end-0 top-0 w-100 h-100 overlay-gradiant">
                            <img src="assets/img/modern-ai-image/user-1-kid.jpg" alt="" />
                        </div>
                        <div class="card-body">
                            <div class="overlay"></div>
                            <div class="row h-100 z-index-1 position-relative ">
                                <div class="col-12 align-self-end">
                                    <p class="opacity-75 small mb-1">Financial Services</p>
                                    <h6>Get 1 Year free Paypal business free account</h6>
                                </div>
                            </div>
                        </div>
                    </div>
                    <img src="assets/img/adminux/services-paypal.png" class="mw-100 mb-3" alt="" /><br />
                    <button type="button" class="btn btn-outline-theme btn-sm">Use <i class="bi bi-star-fill ms-1 fs-12 text-yellow"></i> 0</button>
                </swiper-slide>
                <swiper-slide class="w-auto">
                    <div class="card border-0 text-white height-300 width-200 overflow-hidden mb-3">
                        <div class="coverimg position-absolute end-0 top-0 w-100 h-100 overlay-gradiant">
                            <img src="assets/img/modern-ai-image/tree-2.jpg" alt="" />
                        </div>
                        <div class="card-body">
                            <div class="overlay"></div>
                            <div class="row h-100 z-index-1 position-relative ">
                                <div class="col-12 align-self-end">
                                    <p class="opacity-75 small mb-1">Food</p>
                                    <h6>Get 1 Month free Swiggy One services</h6>
                                </div>
                            </div>
                        </div>
                    </div>
                    <img src="assets/img/adminux/services-swiggy.png" class="mw-100 mb-3" alt="" /><br />
                    <button type="button" class="btn btn-outline-theme btn-sm">Use <i class="bi bi-star-fill ms-1 fs-12 text-yellow"></i> 250</button>
                </swiper-slide>
                <swiper-slide class="w-auto">
                    <div class="card border-0 text-white height-300 width-200 overflow-hidden mb-3">
                        <div class="coverimg position-absolute end-0 top-0 w-100 h-100 overlay-gradiant">
                            <img src="assets/img/modern-ai-image/bus-3.jpg" alt="" />
                        </div>
                        <div class="card-body">
                            <div class="overlay"></div>
                            <div class="row h-100 z-index-1 position-relative ">
                                <div class="col-12 align-self-end">
                                    <p class="opacity-75 small mb-1">Entertainment</p>
                                    <h6>Get 1 Year free Amazon Prime services</h6>
                                </div>
                            </div>
                        </div>
                    </div>
                    <img src="assets/img/adminux/services-amazon_Prime.png" class="mw-100 mb-3" alt="" /><br />
                    <button type="button" class="btn btn-outline-theme btn-sm">Use <i class="bi bi-star-fill ms-1 fs-12 text-yellow"></i> 300</button>
                </swiper-slide>
            </swiper-container>

            <!-- get points on product -->
            <div class="row gx-3 align-items-center mb-3 mb-lg-4">
                <div class="col-auto">
                    <i class="bi bi-cart h5 avatar avatar-40 bg-theme-1-subtle text-theme-1 theme-red rounded"></i>
                </div>
                <div class="col">
                    <h6 class="mb-0">Best Rewards</h6>
                    <p class="small text-secondary">Use earned points and get rewarded</p>
                </div>
                <div class="col-auto"></div>
            </div>
            <!-- Swiper -->
            <swiper-container slides-per-view="auto" space-between="16" autoplay="true" class="swiper swipernav mb-3 mb-lg-4">
                <swiper-slide class="w-auto">
                    <div class="card adminuiux-card width-200">
                        <div class="card-body">
                            <div class="coverimg w-100 height-180 rounded mb-3">
                                <img src="assets/img/adminux/product-1.jpg" alt="" />
                            </div>
                            <p class="text-secondary small mb-1">PUMA Shoes</p>
                            <h6 class="mb-3">Extra 1000 off on PUMA shoes</h6>
                            <button type="button" class="btn btn-outline-theme btn-sm w-100">Use <i class="bi bi-star-fill ms-1 fs-12 text-yellow"></i> 250</button>
                        </div>
                    </div>
                </swiper-slide>
                <swiper-slide class="w-auto">
                    <div class="card adminuiux-card width-200">
                        <div class="card-body">
                            <div class="coverimg w-100 height-180 rounded mb-3">
                                <img src="assets/img/adminux/product-2.jpg" alt="" />
                            </div>
                            <p class="text-secondary small mb-1">Titan Watch</p>
                            <h6 class="mb-3">Extra 500 off on Titan Watch</h6>
                            <button type="button" class="btn btn-outline-theme btn-sm w-100">Use <i class="bi bi-star-fill ms-1 fs-12 text-yellow"></i> 150</button>
                        </div>
                    </div>
                </swiper-slide>
                <swiper-slide class="w-auto">
                    <div class="card adminuiux-card width-200">
                        <div class="card-body">
                            <div class="coverimg w-100 height-180 rounded mb-3">
                                <img src="assets/img/adminux/product-3.jpg" alt="" />
                            </div>
                            <p class="text-secondary small mb-1">FOGG</p>
                            <h6 class="mb-3">Flat 10% on FOGG Xtermo 50ml</h6>
                            <button type="button" class="btn btn-outline-theme btn-sm w-100">Use <i class="bi bi-star-fill ms-1 fs-12 text-yellow"></i> 100</button>
                        </div>
                    </div>
                </swiper-slide>
                <swiper-slide class="w-auto">
                    <div class="card adminuiux-card width-200">
                        <div class="card-body">
                            <div class="coverimg w-100 height-180 rounded mb-3">
                                <img src="assets/img/adminux/product-4.jpg" alt="" />
                            </div>
                            <p class="text-secondary small mb-1">Havells Appliances</p>
                            <h6 class="mb-3">Extra 1500 off on HAVELLS Heater</h6>
                            <button type="button" class="btn btn-outline-theme btn-sm w-100">Use <i class="bi bi-star-fill ms-1 fs-12 text-yellow"></i> 350</button>
                        </div>
                    </div>
                </swiper-slide>
                <swiper-slide class="w-auto">
                    <div class="card adminuiux-card width-200">
                        <div class="card-body">
                            <div class="coverimg w-100 height-180 rounded mb-3">
                                <img src="assets/img/adminux/product-5.jpg" alt="" />
                            </div>
                            <p class="text-secondary small mb-1">MSI Computers</p>
                            <h6 class="mb-3">10% off on MSI GF63 Core-i5 10th Gen</h6>
                            <button type="button" class="btn btn-outline-theme btn-sm w-100">Use <i class="bi bi-star-fill ms-1 fs-12 text-yellow"></i> 500</button>
                        </div>
                    </div>
                </swiper-slide>
                <swiper-slide class="w-auto">
                    <div class="card adminuiux-card width-200">
                        <div class="card-body">
                            <div class="coverimg w-100 height-180 rounded mb-3">
                                <img src="assets/img/adminux/product-6.jpg" alt="" />
                            </div>
                            <p class="text-secondary small mb-1">Gear</p>
                            <h6 class="mb-3">Extra 100 off on Medium Backpack</h6>
                            <button type="button" class="btn btn-outline-theme btn-sm w-100">Use <i class="bi bi-star-fill ms-1 fs-12 text-yellow"></i> 300</button>
                        </div>
                    </div>
                </swiper-slide>
                <swiper-slide class="w-auto">
                    <div class="card adminuiux-card width-200">
                        <div class="card-body">
                            <div class="coverimg w-100 height-180 rounded mb-3">
                                <img src="assets/img/adminux/product-8.jpg" alt="" />
                            </div>
                            <p class="text-secondary small mb-1">Apple</p>
                            <h6 class="mb-3">Flat 1000 on APPLE Watch SE GPS</h6>
                            <button type="button" class="btn btn-outline-theme btn-sm w-100">Use <i class="bi bi-star-fill ms-1 fs-12 text-yellow"></i> 800</button>
                        </div>
                    </div>
                </swiper-slide>
                <swiper-slide class="w-auto">
                    <div class="card adminuiux-card width-200">
                        <div class="card-body">
                            <div class="coverimg w-100 height-180 rounded mb-3">
                                <img src="assets/img/adminux/product-9.jpg" alt="" />
                            </div>
                            <p class="text-secondary small mb-1">AdminUIUX</p>
                            <h6 class="mb-3">Extra 500 off on Office Chair</h6>
                            <button type="button" class="btn btn-outline-theme btn-sm w-100">Use <i class="bi bi-star-fill ms-1 fs-12 text-yellow"></i> 150</button>
                        </div>
                    </div>
                </swiper-slide>
            </swiper-container>

            <!-- trending deals -->
            <div class="card adminuiux-card mb-3 mb-lg-4 bg-gradient-theme-light">
                <div class="card-header">
                    <div class="row gx-3 align-items-center">
                        <div class="col-auto">
                            <i class="bi bi-bag h5 avatar avatar-40 bg-theme-1-subtle text-theme-1 rounded"></i>
                        </div>
                        <div class="col">
                            <h6 class="mb-0">Trending Deals</h6>
                            <p class="small text-secondary">Hurry! Stock limited</p>
                        </div>
                        <div class="col-auto"></div>
                    </div>
                </div>
                <div class="card-body">
                    <!-- Swiper -->
                    <swiper-container slides-per-view="auto" space-between="16" autoplay="true" class="swiper swipernav">
                        <swiper-slide class="w-auto">
                            <div class="card border-0 width-200 bg-theme-r-gradient theme-green text-white">
                                <div class="card-body">
                                    <div class="coverimg w-100 height-180 rounded mb-3">
                                        <img src="assets/img/adminux/product-1.jpg" alt="" />
                                    </div>
                                    <p class="opacity-75 small mb-1">PUMA Shoes</p>
                                    <h6 class="mb-3">Extra 1000 off on PUMA shoes</h6>
                                    <button type="button" class="btn btn-outline-light btn-sm w-100">Use <i class="bi bi-star-fill ms-1 fs-12 text-yellow"></i> 250</button>
                                </div>
                            </div>
                        </swiper-slide>
                        <swiper-slide class="w-auto">
                            <div class="card border-0 width-200 bg-theme-r-gradient theme-red text-white">
                                <div class="card-body">
                                    <div class="coverimg w-100 height-180 rounded mb-3">
                                        <img src="assets/img/adminux/product-2.jpg" alt="" />
                                    </div>
                                    <p class="opacity-75 small mb-1">Titan Watch</p>
                                    <h6 class="mb-3">Extra 500 off on Titan Watch</h6>
                                    <button type="button" class="btn btn-outline-light btn-sm w-100">Use <i class="bi bi-star-fill ms-1 fs-12 text-yellow"></i> 150</button>
                                </div>
                            </div>
                        </swiper-slide>
                        <swiper-slide class="w-auto">
                            <div class="card border-0 width-200 bg-theme-r-gradient theme-yellow text-white">
                                <div class="card-body">
                                    <div class="coverimg w-100 height-180 rounded mb-3">
                                        <img src="assets/img/adminux/product-3.jpg" alt="" />
                                    </div>
                                    <p class="opacity-75 small mb-1">FOGG</p>
                                    <h6 class="mb-3">Flat 10% on FOGG Xtermo 50ml</h6>
                                    <button type="button" class="btn btn-outline-light btn-sm w-100">Use <i class="bi bi-star-fill ms-1 fs-12 text-yellow"></i> 100</button>
                                </div>
                            </div>
                        </swiper-slide>
                        <swiper-slide class="w-auto">
                            <div class="card border-0 width-200 bg-theme-r-gradient theme-black text-white">
                                <div class="card-body">
                                    <div class="coverimg w-100 height-180 rounded mb-3">
                                        <img src="assets/img/adminux/product-4.jpg" alt="" />
                                    </div>
                                    <p class="opacity-75 small mb-1">Havells Appliances</p>
                                    <h6 class="mb-3">Extra 1500 off on HAVELLS Heater</h6>
                                    <button type="button" class="btn btn-outline-light btn-sm w-100">Use <i class="bi bi-star-fill ms-1 fs-12 text-yellow"></i> 350</button>
                                </div>
                            </div>
                        </swiper-slide>
                        <swiper-slide class="w-auto">
                            <div class="card border-0 width-200 bg-theme-r-gradient theme-pink text-white">
                                <div class="card-body">
                                    <div class="coverimg w-100 height-180 rounded mb-3">
                                        <img src="assets/img/adminux/product-5.jpg" alt="" />
                                    </div>
                                    <p class="opacity-75 small mb-1">MSI Computers</p>
                                    <h6 class="mb-3">10% off on MSI GF63 Core-i5 10th Gen</h6>
                                    <button type="button" class="btn btn-outline-light btn-sm w-100">Use <i class="bi bi-star-fill ms-1 fs-12 text-yellow"></i> 500</button>
                                </div>
                            </div>
                        </swiper-slide>
                        <swiper-slide class="w-auto">
                            <div class="card border-0 width-200 bg-theme-r-gradient theme-purple text-white">
                                <div class="card-body">
                                    <div class="coverimg w-100 height-180 rounded mb-3">
                                        <img src="assets/img/adminux/product-6.jpg" alt="" />
                                    </div>
                                    <p class="opacity-75 small mb-1">Gear</p>
                                    <h6 class="mb-3">Extra 100 off on Medium Backpack</h6>
                                    <button type="button" class="btn btn-outline-light btn-sm w-100">Use <i class="bi bi-star-fill ms-1 fs-12 text-yellow"></i> 300</button>
                                </div>
                            </div>
                        </swiper-slide>
                        <swiper-slide class="w-auto">
                            <div class="card border-0 width-200 bg-theme-r-gradient theme-blue text-white">
                                <div class="card-body">
                                    <div class="coverimg w-100 height-180 rounded mb-3">
                                        <img src="assets/img/adminux/product-8.jpg" alt="" />
                                    </div>
                                    <p class="opacity-75 small mb-1">Apple</p>
                                    <h6 class="mb-3">Flat 1000 on APPLE Watch SE GPS</h6>
                                    <button type="button" class="btn btn-outline-light btn-sm w-100">Use <i class="bi bi-star-fill ms-1 fs-12 text-yellow"></i> 800</button>
                                </div>
                            </div>
                        </swiper-slide>
                        <swiper-slide class="w-auto">
                            <div class="card border-0 width-200 bg-theme-r-gradient theme-cyan text-white">
                                <div class="card-body">
                                    <div class="coverimg w-100 height-180 rounded mb-3">
                                        <img src="assets/img/adminux/product-9.jpg" alt="" />
                                    </div>
                                    <p class="opacity-75 small mb-1">AdminUIUX</p>
                                    <h6 class="mb-3">Extra 500 off on Office Chair</h6>
                                    <button type="button" class="btn btn-outline-light btn-sm w-100">Use <i class="bi bi-star-fill ms-1 fs-12 text-yellow"></i> 150</button>
                                </div>
                            </div>
                        </swiper-slide>
                    </swiper-container>
                </div>
            </div>
        </div>
    `,
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class FinanceRewardsComponent {
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

