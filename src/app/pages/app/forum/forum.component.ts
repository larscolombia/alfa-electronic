import { Component, OnInit, AfterViewInit, AfterContentChecked, OnDestroy, ViewChild, ElementRef, CUSTOM_ELEMENTS_SCHEMA } from "@angular/core";
import { RouterLink } from "@angular/router";
import Choices, { ClassNames } from "choices.js";

import { DaterangePickerRangesComponent } from "../../../components/input-fields/daterange-picker/daterange-picker-ranges.component";

@Component({
    selector: "app-forum",
    standalone: true,
    imports: [RouterLink, DaterangePickerRangesComponent],
    template: `
        <!-- page title -->
        <div class="container-fluid py-3">
            <div class="row gx-3 gx-lg-4 align-items-center page-title">
                <div class="col col-sm mb-3 mb-sm-0 order-1">
                    <h5 class="mb-0">Forum</h5>
                    <p class="text-secondary small">Lets make it open environment to get helped</p>
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
                    <li class="breadcrumb-item bi active" aria-current="page">Forum</li>
                </ol>
            </nav>
        </div>

        <!-- content -->
        <div class="container mt-3" id="main-content">
            <div class="card adminuiux-card bg-theme-r-gradient mb-3 mb-lg-4">
                <div class="card-body">
                    <div class="row vh-50 py-3 py-xl-4 align-items-center justify-content-center">
                        <div class="col-12 col-md-10 col-lg-10 col-xl-9 col-xxl-8 text-center">
                            <h2 class="mb-3">The Place to find The right answers of your questions.</h2>
                            <p class="opacity-75 mb-3 mb-md-4">Ask questions, Build network, Connect with same tastes people, share your ideas and help other people by helping, votes and give advices.</p>
                            <button class="btn btn-light">Join Community <i class="bi bi-chevron-right"></i></button>
                            <button class="btn btn-link text-white ms-2">Watch Demo <i class="bi bi-camera-reels text-white"></i></button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- search -->
            <div class="row gx-3 gx-lg-4 align-items-center justify-content-center mb-3 mb-lg-4">
                <div class="col-12 col-md mb-3 mb-md-0">
                    <div class="input-group input-group-lg shadow-sm rounded">
                        <span class="input-group-text text-theme-1 border-0"><i class="bi bi-search"></i></span>
                        <input class="form-control border-0" type="search" placeholder="Search your query here..." />
                    </div>
                </div>
                <div class="col-auto">
                    <button class="btn btn-lg btn-theme me-2">Ask Query</button>
                    <button class="btn btn-lg btn-theme">Write Post</button>
                </div>
            </div>

            <!-- summary of community -->
            <div class="row gx-3">
                <div class="col-12 col-md-12 col-lg-6 col-xl-3">
                    <div class="card adminuiux-card mb-3 mb-lg-4">
                        <div class="card-body">
                            <div class="row gx-3 align-items-center">
                                <div class="col-auto">
                                    <div class="avatar avatar-50 rounded-circle bg-theme-1 theme-purple shadow-sm text-white">
                                        <i class="bi bi-people h5"></i>
                                    </div>
                                </div>
                                <div class="col">
                                    <h5 class="mb-1">100+ million</h5>
                                    <p class="small text-secondary">Monthly visitors & Words Exchanged</p>
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
                                    <div class="avatar avatar-50 rounded-circle bg-theme-1 theme-orange shadow-sm text-white">
                                        <i class="bi bi-life-preserver h5"></i>
                                    </div>
                                </div>
                                <div class="col">
                                    <h5 class="mb-1">45.1+ billion</h5>
                                    <p class="small text-secondary">People get helps and queries solved</p>
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
                                    <div class="avatar avatar-50 rounded-circle bg-theme-1 theme-green shadow-sm text-white">
                                        <i class="bi bi-patch-check h5"></i>
                                    </div>
                                </div>
                                <div class="col">
                                    <h5 class="mb-1">101% ROI</h5>
                                    <p class="small text-secondary">Customer used our premium product features</p>
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
                                    <div class="avatar avatar-50 rounded-circle bg-theme-1 shadow-sm text-white">
                                        <i class="bi bi-globe h5"></i>
                                    </div>
                                </div>
                                <div class="col">
                                    <h5 class="mb-1">1000</h5>
                                    <p class="small text-secondary">Average new web application build per month.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Filter -->
            <div class="row gx-3 gx-lg-4 align-items-center">
                <div class="col mb-3 mb-lg-4">
                    <h6>225 questions</h6>
                </div>
                <div class="col-auto mb-3 mb-lg-4">
                    <span class="me-2">Sort by:</span>
                    <div class="btn-group btn-group-sm" role="group" aria-label="Filter toggle">
                        <input type="radio" name="filterbox" class="btn-check" id="btncheck1filter" checked />
                        <label class="btn btn-outline-theme" for="btncheck1filter">Newest</label>

                        <input type="radio" name="filterbox" class="btn-check" id="btncheck2filter" />
                        <label class="btn btn-outline-theme" for="btncheck2filter">Active</label>

                        <input type="radio" name="filterbox" class="btn-check" id="btncheck3filter" />
                        <label class="btn btn-outline-theme" for="btncheck3filter">Unanswered</label>

                        <input type="radio" name="filterbox" class="btn-check" id="btncheck4filter" />
                        <label class="btn btn-outline-theme" for="btncheck4filter">Top Rated</label>
                    </div>
                </div>
            </div>

            <!-- questions and answer-->
            <div class="row gx-3 gx-lg-4">
                <div class="col-12 col-md-8 col-lg-9 col-xl-9">
                    <div class="card adminuiux-card mb-3 mb-lg-4">
                        <div class="card-body">
                            <div class="row gx-3 align-items-center mb-3">
                                <div class="col">
                                    <h4><a routerLink="/app/forum-details" class="style-none">How to create admin dashboard for Finance Application?</a></h4>
                                </div>
                                <div class="col-auto">
                                    <div class="dropdown">
                                        <button class="btn btn-square btn-link dropdown-toggle no-caret" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                                            <i class="bi bi-three-dots-vertical vm"></i>
                                        </button>
                                        <ul class="dropdown-menu dropdown-menu-end ">
                                            <li><a class="dropdown-item">Hide from Timeline</a></li>
                                            <li><a class="dropdown-item">Report</a></li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                            <div class="row gx-3 align-items-center mb-3">
                                <div class="col-auto">
                                    <figure class="avatar avatar-40 rounded-circle coverimg vm">
                                        <img src="assets/img/modern-ai-image/user-4.jpg" alt="" />
                                    </figure>
                                </div>
                                <div class="col">
                                    <p class="small text-secondary mb-0">Asked by</p>
                                    <p class="mb-0">David Warner <small class="text-secondary">1 hr ago</small></p>
                                </div>
                            </div>
                            <p class="text-secondary">You can easily find template for UI with best customize facility named "GetAdminUX". AdminUX just because every home with windows needs door. everWhen you get older many people will listen you carefully, no matter if its correct discussion or not.</p>
                            <p>
                                <span class="badge badge-lg badge-light text-bg-theme-1 theme-red me-1 mt-1">Support</span>
                                <span class="badge badge-lg badge-light text-bg-theme-1 theme-red me-1 mt-1">Development</span>
                            </p>
                        </div>
                        <div class="card-footer">
                            <div class="row gx-3 align-items-center">
                                <div class="col-auto">
                                    <div class="btn btn-outline-theme theme-red btn-square rounded-circle">
                                        <i class="bi bi-heart h5"></i>
                                    </div>
                                </div>
                                <div class="col-auto">
                                    <p class="text-secondary small mb-0">Liked by</p>
                                    <h5>1.2k</h5>
                                </div>
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
                                    <p class="text-secondary small mb-0">Answered by</p>
                                    <h5>9+</h5>
                                </div>
                                <div class="col-auto text-center">
                                    <p class="small text-secondary mb-0">Views</p>
                                    <h5>152</h5>
                                </div>
                                <div class="col-auto text-center">
                                    <p class="small text-secondary mb-0">Watching</p>
                                    <h5>256</h5>
                                </div>
                                <div class="col-auto">
                                    <a class="btn btn-theme btn-md">Answer</a>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="card adminuiux-card mb-3 mb-lg-4">
                        <div class="card-body">
                            <div class="row gx-3 align-items-center mb-3">
                                <div class="col">
                                    <h4><a routerLink="/app/forum-details" class="style-none">Couldn't access my whatsapp on my laptop. Can anyone help me?</a></h4>
                                </div>
                                <div class="col-auto">
                                    <div class="dropdown">
                                        <button class="btn btn-square btn-link dropdown-toggle no-caret" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                                            <i class="bi bi-three-dots-vertical vm"></i>
                                        </button>
                                        <ul class="dropdown-menu dropdown-menu-end ">
                                            <li><a class="dropdown-item">Hide from Timeline</a></li>
                                            <li><a class="dropdown-item">Report</a></li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                            <div class="row gx-3 align-items-center mb-3">
                                <div class="col-auto">
                                    <figure class="avatar avatar-40 rounded-circle coverimg vm">
                                        <img src="assets/img/modern-ai-image/user-4.jpg" alt="" />
                                    </figure>
                                </div>
                                <div class="col">
                                    <p class="small text-secondary mb-0">Asked by</p>
                                    <p class="mb-0">David Warner <small class="text-secondary">1 hr ago</small></p>
                                </div>
                            </div>
                            <p class="text-secondary">You can easily find template for UI with best customize facility named "GetAdminUX". AdminUX just because every home with windows needs door. everWhen you get older many people will listen you carefully, no matter if its correct discussion or not.</p>
                            <p>
                                <span class="badge badge-light badge-lg text-bg-theme-1 theme-purple me-1 mb-1">Computer</span>
                                <span class="badge badge-light badge-lg text-bg-theme-1 theme-yellow me-1 mb-1">General</span>
                            </p>
                        </div>
                        <div class="card-footer">
                            <div class="row gx-3 align-items-center">
                                <div class="col-auto">
                                    <div class="btn btn-outline-theme theme-red btn-square rounded-circle active">
                                        <i class="bi bi-heart h5"></i>
                                    </div>
                                </div>
                                <div class="col-auto">
                                    <p class="text-secondary small mb-0">Liked by</p>
                                    <h5>1.2k</h5>
                                </div>
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
                                    <p class="text-secondary small mb-0">Answered by</p>
                                    <h5>2+</h5>
                                </div>
                                <div class="col-auto text-center">
                                    <p class="small text-secondary mb-0">Views</p>
                                    <h5>152</h5>
                                </div>
                                <div class="col-auto text-center">
                                    <p class="small text-secondary mb-0">Watching</p>
                                    <h5>256</h5>
                                </div>
                                <div class="col-auto">
                                    <a class="btn btn-theme btn-md">Answer</a>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="card adminuiux-card mb-3 mb-lg-4">
                        <div class="card-body">
                            <div class="row gx-3 align-items-center mb-3">
                                <div class="col">
                                    <h4><a routerLink="/app/forum-details" class="style-none">Bamboo tree growing indoor tips and tricks.</a></h4>
                                </div>
                                <div class="col-auto">
                                    <div class="dropdown">
                                        <button class="btn btn-square btn-link dropdown-toggle no-caret" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                                            <i class="bi bi-three-dots-vertical vm"></i>
                                        </button>
                                        <ul class="dropdown-menu dropdown-menu-end ">
                                            <li><a class="dropdown-item">Hide from Timeline</a></li>
                                            <li><a class="dropdown-item">Report</a></li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                            <div class="row gx-3 align-items-center mb-3">
                                <div class="col-auto">
                                    <figure class="avatar avatar-40 rounded-circle coverimg vm">
                                        <img src="assets/img/modern-ai-image/user-1.jpg" alt="" />
                                    </figure>
                                </div>
                                <div class="col">
                                    <p class="small text-secondary mb-0">Asked by</p>
                                    <p class="mb-0">Junior Natu <small class="text-secondary">2 hr ago</small></p>
                                </div>
                            </div>
                            <p class="text-secondary">You can easily find template for UI with best customize facility named "GetAdminUX". AdminUX just because every home with windows needs door. everWhen you get older many people will listen you carefully, no matter if its correct discussion or not.</p>
                            <p>
                                <span class="badge badge-lg badge-light text-bg-theme-1 theme-teal me-1 mt-1">Nature</span>
                                <span class="badge badge-lg badge-light text-bg-theme-1 theme-cyan me-1 mt-1">Environment</span>
                            </p>
                        </div>
                        <div class="card-footer">
                            <div class="row gx-3 align-items-center">
                                <div class="col-auto">
                                    <div class="btn btn-outline-theme theme-red btn-square rounded-circle">
                                        <i class="bi bi-heart h5"></i>
                                    </div>
                                </div>
                                <div class="col-auto">
                                    <p class="text-secondary small mb-0">Liked by</p>
                                    <h5>1.2k</h5>
                                </div>
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
                                    <p class="text-secondary small mb-0">Answered by</p>
                                    <h5>3+</h5>
                                </div>
                                <div class="col-auto text-center">
                                    <p class="small text-secondary mb-0">Views</p>
                                    <h5>152</h5>
                                </div>
                                <div class="col-auto text-center">
                                    <p class="small text-secondary mb-0">Watching</p>
                                    <h5>256</h5>
                                </div>
                                <div class="col-auto">
                                    <a class="btn btn-theme btn-md">Answer</a>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="card adminuiux-card mb-3 mb-lg-4">
                        <div class="card-body">
                            <div class="row gx-3 align-items-center mb-3">
                                <div class="col">
                                    <h4><a routerLink="/app/forum-details" class="style-none">Raja Ravi Varma is not king and don't have any kingdom. Why he called Raja(King)?</a></h4>
                                </div>
                                <div class="col-auto">
                                    <div class="dropdown">
                                        <button class="btn btn-square btn-link dropdown-toggle no-caret" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                                            <i class="bi bi-three-dots-vertical vm"></i>
                                        </button>
                                        <ul class="dropdown-menu dropdown-menu-end ">
                                            <li><a class="dropdown-item">Hide from Timeline</a></li>
                                            <li><a class="dropdown-item">Report</a></li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                            <div class="row gx-3 align-items-center mb-3">
                                <div class="col-auto">
                                    <figure class="avatar avatar-40 rounded-circle coverimg vm">
                                        <img src="assets/img/modern-ai-image/user-2.jpg" alt="" />
                                    </figure>
                                </div>
                                <div class="col">
                                    <p class="small text-secondary mb-0">Asked by</p>
                                    <p class="mb-0">Madhuvani <small class="text-secondary">10 hr ago</small></p>
                                </div>
                            </div>
                            <p class="text-secondary">You can easily find template for UI with best customize facility named "GetAdminUX". AdminUX just because every home with windows needs door. everWhen you get older many people will listen you carefully, no matter if its correct discussion or not.</p>
                            <p>
                                <span class="badge badge-lg badge-light text-bg-theme-1 theme-pink me-1 mt-1">Art</span>
                                <span class="badge badge-lg badge-light text-bg-theme-1 theme-orange me-1 mt-1">History</span>
                            </p>
                        </div>
                        <div class="card-footer">
                            <div class="row gx-3 align-items-center">
                                <div class="col-auto">
                                    <div class="btn btn-outline-theme theme-red btn-square rounded-circle">
                                        <i class="bi bi-heart h5"></i>
                                    </div>
                                </div>
                                <div class="col-auto">
                                    <p class="text-secondary small mb-0">Liked by</p>
                                    <h5>1.2k</h5>
                                </div>
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
                                    <p class="text-secondary small mb-0">Answered by</p>
                                    <h5>9+</h5>
                                </div>
                                <div class="col-auto text-center">
                                    <p class="small text-secondary mb-0">Views</p>
                                    <h5>152</h5>
                                </div>
                                <div class="col-auto text-center">
                                    <p class="small text-secondary mb-0">Watching</p>
                                    <h5>256</h5>
                                </div>
                                <div class="col-auto">
                                    <a class="btn btn-theme btn-md">Answer</a>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="card adminuiux-card mb-3 mb-lg-4">
                        <div class="card-body">
                            <div class="row gx-3 align-items-center mb-3">
                                <div class="col">
                                    <h4><a routerLink="/app/forum-details" class="style-none">Which the best template for Admin and Dashboard Application?</a></h4>
                                </div>
                                <div class="col-auto">
                                    <div class="dropdown">
                                        <button class="btn btn-square btn-link dropdown-toggle no-caret" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                                            <i class="bi bi-three-dots-vertical vm"></i>
                                        </button>
                                        <ul class="dropdown-menu dropdown-menu-end ">
                                            <li><a class="dropdown-item">Hide from Timeline</a></li>
                                            <li><a class="dropdown-item">Report</a></li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                            <div class="row gx-3 align-items-center mb-3">
                                <div class="col-auto">
                                    <figure class="avatar avatar-40 rounded-circle coverimg vm">
                                        <img src="assets/img/modern-ai-image/user-4.jpg" alt="" />
                                    </figure>
                                </div>
                                <div class="col">
                                    <p class="small text-secondary mb-0">Asked by</p>
                                    <p class="mb-0">David Warner <small class="text-secondary">1 hr ago</small></p>
                                </div>
                            </div>
                            <p class="text-secondary">You can easily find template for UI with best customize facility named "GetAdminUX". AdminUX just because every home with windows needs door. everWhen you get older many people will listen you carefully, no matter if its correct discussion or not.</p>
                            <p>
                                <span class="badge badge-lg badge-light text-bg-theme-1 theme-red me-1 mt-1">Support</span>
                                <span class="badge badge-lg badge-light text-bg-theme-1 theme-red me-1 mt-1">Development</span>
                            </p>
                        </div>
                        <div class="card-footer">
                            <div class="row gx-3 align-items-center">
                                <div class="col-auto">
                                    <div class="btn btn-outline-theme theme-red btn-square rounded-circle active">
                                        <i class="bi bi-heart h5"></i>
                                    </div>
                                </div>
                                <div class="col-auto">
                                    <p class="text-secondary small mb-0">Liked by</p>
                                    <h5>30.2k</h5>
                                </div>
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
                                    <p class="text-secondary small mb-0">Answered by</p>
                                    <h5>9+</h5>
                                </div>
                                <div class="col-auto text-center">
                                    <p class="small text-secondary mb-0">Views</p>
                                    <h5>152</h5>
                                </div>
                                <div class="col-auto text-center">
                                    <p class="small text-secondary mb-0">Watching</p>
                                    <h5>256</h5>
                                </div>
                                <div class="col-auto">
                                    <a class="btn btn-theme btn-md">Answer</a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-12 col-md-4 col-lg-3 col-xl-3">
                    <div class="card adminuiux-card bg-l-gradient-light mb-3 mb-lg-4">
                        <div class="card-header border-bottom">
                            <h6>Featured Questions</h6>
                        </div>
                        <div class="card-body p-0">
                            <div class="list-group list-group-flush bg-none">
                                <a routerLink="/app/forum-details" class="list-group-item list-group-item-action">How to become most powerful development partner?</a>
                                <a routerLink="/app/forum-details" class="list-group-item list-group-item-action">The best way to get started with the getAdminUX</a>
                                <a routerLink="/app/forum-details" class="list-group-item list-group-item-action">I have found egyptian assets, What I should do with it?</a>
                                <a routerLink="/app/forum-details" class="list-group-item list-group-item-action">How long it will take to make world record for traveling?</a>
                                <a routerLink="/app/forum-details" class="list-group-item list-group-item-action ">I am disabled person by my hands. What is my career options?</a>
                            </div>
                        </div>
                    </div>
                    <!-- advertisement -->
                    <p class="text-secondary text-center small">Advertisement</p>
                    <div class="card adminuiux-card overflow-hidden mb-3 mb-lg-4">
                        <div class="row gx-0">
                            <div class="col-6 bg-theme-1 text-white text-center p-3 z-index-1">
                                <div class="position-relative">
                                    <h4 class="mb-2">15% OFF</h4>
                                    <p class="opacity-75 small mb-3">Price including with our launch offer get 5% Extra</p>
                                    <button class="copy-text btn btn-sm btn-rounded btn-outline-dashed text-white border-white">GOREELLAUNCH</button>
                                </div>
                            </div>
                            <div class="col-6 position-relative">
                                <figure class="coverimg position-absolute w-100 h-100 start-0 top-0 m-0">
                                    <img src="assets/img/modern-ai-image/image-10.jpg" class="mw-100" alt="" />
                                </figure>
                            </div>
                        </div>
                    </div>
                    <h6 class="mb-3 mb-lg-4">Trending Tags</h6>
                    <div>
                        <a href="" class="badge badge-lg badge-light text-bg-theme-1 me-1 my-1">Android</a>
                        <a href="" class="badge badge-lg badge-light text-bg-theme-1 me-1 my-1">iOS</a>
                        <a href="" class="badge badge-lg badge-light text-bg-theme-1 me-1 my-1">Windows11</a>
                        <a href="" class="badge badge-lg badge-light text-bg-theme-1 me-1 my-1">Fluent ui</a>
                        <a href="" class="badge badge-lg badge-light text-bg-theme-1 me-1 my-1">Win UI</a>
                        <a href="" class="badge badge-lg badge-light text-bg-theme-1 me-1 my-1">Template</a>
                        <a href="" class="badge badge-lg badge-light text-bg-theme-1 me-1 my-1">Dashboard</a>
                        <a href="" class="badge badge-lg badge-light text-bg-theme-1 me-1 my-1">Bootstrap</a>
                        <a href="" class="badge badge-lg badge-light text-bg-theme-1 me-1 my-1">Angular admin</a>
                        <a href="" class="badge badge-lg badge-light text-bg-theme-1 me-1 my-1">Free Dashboard</a>
                    </div>
                </div>
            </div>
        </div>
    `,
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class ForumComponent {
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
