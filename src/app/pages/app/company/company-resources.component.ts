import { Component, OnInit, AfterViewInit, AfterContentChecked, OnDestroy, ViewChild, ElementRef, CUSTOM_ELEMENTS_SCHEMA } from "@angular/core";
import { RouterLink } from "@angular/router";
import Choices, { ClassNames } from "choices.js";

import { DaterangePickerRangesComponent } from "../../../components/input-fields/daterange-picker/daterange-picker-ranges.component";
import { CircleProgressBlueComponent } from "../../../components/charts/circle-progress-blue.component";
import { CircleProgressGreenComponent } from "../../../components/charts/circle-progress-green.component";
import { CircleProgressRedComponent } from "../../../components/charts/circle-progress-red.component";
import { CircleProgressYellowComponent } from "../../../components/charts/circle-progress-yellow.component";
import { AreaRedChartjs100Component } from "../../../components/charts/area-red-chartjs-100.component";
import { AreaBlueChartjs100Component } from "../../../components/charts/area-blue-chartjs-100.component";
import { AreaYellowChartjs100Component } from "../../../components/charts/area-yellow-chartjs-100.component";
import { AreaGreenChartjs100Component } from "../../../components/charts/area-green-chartjs-100.component";

@Component({
    selector: "app-company-resource",
    standalone: true,
    imports: [RouterLink, DaterangePickerRangesComponent, CircleProgressBlueComponent, CircleProgressGreenComponent, CircleProgressRedComponent, CircleProgressYellowComponent, AreaRedChartjs100Component, AreaBlueChartjs100Component, AreaYellowChartjs100Component, AreaGreenChartjs100Component],
    template: `
        <!-- page title -->
        <div class="container-fluid py-3">
            <div class="row gx-3 gx-lg-4 align-items-center page-title">
                <div class="col col-sm mb-3 mb-sm-0 order-1">
                    <h5 class="mb-0">Company Resources</h5>
                    <p class="text-secondary small">Get addicted to learning for the best future</p>
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
                    <li class="breadcrumb-item bi active" aria-current="page">Resources</li>
                </ol>
            </nav>
        </div>

        <!-- content -->
        <div class="container mt-3" id="main-content">
            <div class="row gx-3 gx-lg-4 mb-3 mb-lg-4">
                <div class="col text-center py-3">
                    <h4>Learning is life, <span class="text-gradient">Explore more and Rewrite</span> an lessons you have learn't</h4>
                    <p class="text-secondary">You should learn and explore opportunities. If there is obstacles, try to remove it and improvise.</p>
                </div>
            </div>

            <p class="mb-2 text-center">
                <span class="vm me-1 mb-1">Tags: </span>
                <span class="badge badge-lg badge-light text-bg-theme-1 theme-red me-1 mb-1 active">Course</span>
                <span class="badge badge-lg badge-light text-bg-theme-1 theme-blue me-1 mb-1 active">Reading</span>
                <span class="badge badge-lg badge-light text-bg-theme-1 theme-purple me-1 mb-1 active">Article</span>
                <span class="badge badge-lg badge-light text-bg-theme-1 theme-yellow me-1 mb-1">Updates</span>
                <span class="badge badge-lg badge-light text-bg-theme-1 theme-pink me-1 mb-1">Beauty</span>
                <span class="badge badge-lg badge-light text-bg-theme-1 theme-teal me-1 mb-1">Technology</span>
                <span class="badge badge-lg badge-light text-bg-theme-1 theme-red me-1 mb-1">Learning</span>
            </p>

            <p class="mb-4 mb-lg-5 text-center">
                <span class="vm me-1 mb-1">Type: </span>
                <span class="badge badge-lg badge-light text-bg-theme-1 me-1 mb-1 active">Digital</span>
                <span class="badge badge-lg badge-light text-bg-theme-1 me-1 mb-1">Video</span>
                <span class="badge badge-lg badge-light text-bg-theme-1 me-1 mb-1">Webinar</span>
                <span class="badge badge-lg badge-light text-bg-theme-1 me-1 mb-1">Event</span>
                <span class="badge badge-lg badge-light text-bg-theme-1 me-1 mb-1 active">Web</span>
            </p>

            <div class="row gx-3 gx-lg-4">
                <div class="col-12 col-md-6 col-lg-4 col-xl-3">
                    <div class="card adminuiux-card mb-3 mb-lg-4 overflow-hidden">
                        <div class="height-150 w-100 coverimg">
                            <img src="assets/img/modern-ai-image/kids-2.jpg" class="mw-100" alt="" />
                        </div>
                        <div class="card-body">
                            <p class="mb-3">
                                <span class="badge badge-lg badge-light text-bg-theme-1 theme-green">Course</span>
                            </p>
                            <h5>Getting older earlier.</h5>
                            <p class="text-secondary">When you get older many people will listen you carefully, no matter if its correct discussion or not.</p>

                            <button class="btn btn-sm btn-link text-theme-1">Join Now <i class="bi bi-arrow-right"></i></button>
                        </div>
                    </div>
                </div>
                <div class="col-12 col-md-6 col-lg-4 col-xl-3">
                    <div class="card adminuiux-card mb-3 mb-lg-4 overflow-hidden">
                        <div class="height-150 w-100 coverimg">
                            <img src="assets/img/modern-ai-image/pet-4.jpg" class="mw-100" alt="" />
                        </div>
                        <div class="card-body">
                            <p class="mb-3">
                                <span class="badge badge-lg badge-light text-bg-theme-1">Reading</span>
                            </p>
                            <h5>Tell best at worst time.</h5>
                            <p class="text-secondary">There is nothing can be hear clearly until some people pass through worst time of his/her life.</p>

                            <button class="btn btn-sm btn-link text-theme-1">Read Now <i class="bi bi-arrow-right"></i></button>
                        </div>
                    </div>
                </div>
                <div class="col-12 col-md-6 col-lg-4 col-xl-3">
                    <div class="card adminuiux-card mb-3 mb-lg-4 overflow-hidden">
                        <div class="height-150 w-100 coverimg">
                            <img src="assets/img/modern-ai-image/tree-2.jpg" class="mw-100" alt="" />
                        </div>
                        <div class="card-body">
                            <p class="mb-3">
                                <span class="badge badge-lg badge-light text-bg-theme-1 theme-purple">Article</span>
                            </p>
                            <h5>Being rich is not the goal.</h5>
                            <p class="text-secondary">Keep your target goal as much clear as crystal. Don't just be rich, care each lives human and animals.</p>

                            <button class="btn btn-sm btn-link text-theme-1">Read Now <i class="bi bi-arrow-right"></i></button>
                        </div>
                    </div>
                </div>
                <div class="col-12 col-md-6 col-lg-4 col-xl-3">
                    <div class="card adminuiux-card mb-3 mb-lg-4 overflow-hidden">
                        <div class="height-150 w-100 coverimg">
                            <img src="assets/img/modern-ai-image/tree-4.jpg" class="mw-100" alt="" />
                        </div>
                        <div class="card-body">
                            <p class="mb-3">
                                <span class="badge badge-lg badge-light text-bg-theme-1 theme-yellow">Course</span>
                            </p>
                            <h5>Home is your soul image.</h5>
                            <p class="text-secondary">Most of the people don't like to see their home dirty. Agree? Yes, never make your soul dirty. Keep it clean.</p>

                            <button class="btn btn-sm btn-link text-theme-1">Join Now <i class="bi bi-arrow-right"></i></button>
                        </div>
                    </div>
                </div>
                <div class="col-12 col-md-6 col-lg-4 col-xl-3">
                    <div class="card adminuiux-card mb-3 mb-lg-4 overflow-hidden">
                        <div class="height-150 w-100 coverimg">
                            <img src="assets/img/modern-ai-image/flamingo-4.jpg" class="mw-100" alt="" />
                        </div>
                        <div class="card-body">
                            <p class="mb-3">
                                <span class="badge badge-lg badge-light text-bg-theme-1 theme-green">Course</span>
                            </p>
                            <h5>Getting older earlier.</h5>
                            <p class="text-secondary">When you get older many people will listen you carefully, no matter if its correct discussion or not.</p>

                            <button class="btn btn-sm btn-link text-theme-1">Join Now <i class="bi bi-arrow-right"></i></button>
                        </div>
                    </div>
                </div>
                <div class="col-12 col-md-6 col-lg-4 col-xl-3">
                    <div class="card adminuiux-card mb-3 mb-lg-4 overflow-hidden">
                        <div class="height-150 w-100 coverimg">
                            <img src="assets/img/modern-ai-image/user-1-kid.jpg" class="mw-100" alt="" />
                        </div>
                        <div class="card-body">
                            <p class="mb-3">
                                <span class="badge badge-lg badge-light text-bg-theme-1">Reading</span>
                            </p>
                            <h5>Tell best at worst time.</h5>
                            <p class="text-secondary">There is nothing can be hear clearly until some people pass through worst time of his/her life.</p>

                            <button class="btn btn-sm btn-link text-theme-1">Read Now <i class="bi bi-arrow-right"></i></button>
                        </div>
                    </div>
                </div>
                <div class="col-12 col-md-6 col-lg-4 col-xl-3">
                    <div class="card adminuiux-card mb-3 mb-lg-4 overflow-hidden">
                        <div class="height-150 w-100 coverimg">
                            <img src="assets/img/modern-ai-image/user-6-kid.jpg" class="mw-100" alt="" />
                        </div>
                        <div class="card-body">
                            <p class="mb-3">
                                <span class="badge badge-lg badge-light text-bg-theme-1 theme-purple">Article</span>
                            </p>
                            <h5>Being rich is not the goal.</h5>
                            <p class="text-secondary">Keep your target goal as much clear as crystal. Don't just be rich, care each lives human and animals.</p>

                            <button class="btn btn-sm btn-link text-theme-1">Read Now <i class="bi bi-arrow-right"></i></button>
                        </div>
                    </div>
                </div>
                <div class="col-12 col-md-6 col-lg-4 col-xl-3">
                    <div class="card adminuiux-card mb-3 mb-lg-4 overflow-hidden">
                        <div class="height-150 w-100 coverimg">
                            <img src="assets/img/modern-ai-image/user-7.jpg" class="mw-100" alt="" />
                        </div>
                        <div class="card-body">
                            <p class="mb-3">
                                <span class="badge badge-lg badge-light text-bg-theme-1 theme-yellow">Course</span>
                            </p>
                            <h5>Home is your soul image.</h5>
                            <p class="text-secondary">Most of the people don't like to see their home dirty. Agree? Yes, never make your soul dirty. Keep it clean.</p>

                            <button class="btn btn-sm btn-link text-theme-1">Join Now <i class="bi bi-arrow-right"></i></button>
                        </div>
                    </div>
                </div>
            </div>

            <div class="row gx-3 gx-4 mb-3 mb-lg-4">
                <div class="col text-center py-3">
                    <h4>Find the best <span class="text-gradient">Resource</span></h4>
                    <p class="text-secondary">Learn about advices, tricks, work style and approach.<br />User experience is the best key to success.</p>
                </div>
            </div>

            <div class="row gx-3 gx-lg-4">
                <div class="col-12 col-md-12 col-lg-12 col-xxl-4">
                    <!-- targets and course progress -->
                    <div class="card adminuiux-card mb-3 mb-lg-4 position-relative">
                        <div class="coverimg position-absolute end-0 top-0 h-100 w-25 rounded">
                            <img src="assets/img/modern-ai-image/user5-kid.jpg" alt="" class="mw-100" />
                        </div>
                        <div class="row gx-3">
                            <div class="col-9">
                                <div class="card border-0 bg-white shadow-none">
                                    <div class="card-body">
                                        <div class="row gx-3">
                                            <div class="col align-self-center">
                                                <p class="small text-secondary mb-0">Business Model</p>
                                                <p>Data communication & signal strength</p>
                                                <div class="mt-3">
                                                    <div class="progress height-dynamic mb-1 bg-theme-1-subtle text-theme-1" style="--h-dynamic: 5px">
                                                        <div class="progress-bar bg-theme-1" role="progressbar" style="width: 45%" aria-valuenow="45" aria-valuemin="0" aria-valuemax="100"></div>
                                                    </div>
                                                </div>
                                                <p class="small text-secondary">Targeted <span class="float-end">27 June 2022</span></p>
                                            </div>
                                            <div class="col-auto">
                                                <div class="rounded bg-theme-1 text-white h-100 p-3">
                                                    <p class="opacity-75 small mb-1">Java<br />Language</p>
                                                    <p>152 hrs</p>
                                                    <p>Start <i class="bi bi-play vm"></i></p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-12 col-md-6 col-lg-6 col-xxl-4">
                    <div class="card adminuiux-card mb-3 mb-lg-4">
                        <div class="card-body">
                            <div class="row gx-3">
                                <div class="col align-self-center">
                                    <div class="row gx-3">
                                        <div class="col-12 col-lg">
                                            <p class="text-secondary small mb-0">Subscribed</p>
                                            <p>Create HTML to Angular template with ease</p>
                                        </div>
                                        <div class="col-12 col-lg-auto text-start text-xl-end">
                                            <p class="text-secondary small mb-0">Author:</p>
                                            <p>AdminUIUX</p>
                                        </div>
                                    </div>
                                    <div class="mt-3">
                                        <div class="progress height-dynamic mb-1 bg-theme-1-subtle text-theme-1" style="--h-dynamic: 5px">
                                            <div class="progress-bar bg-theme-1" role="progressbar" style="width: 45%" aria-valuenow="45" aria-valuemin="0" aria-valuemax="100"></div>
                                        </div>
                                    </div>
                                    <p class="small text-secondary">Targeted<span class="float-end">23 June 2022</span></p>
                                </div>
                                <div class="col-auto">
                                    <div class="rounded bg-theme-1 text-white p-3">
                                        <p class="opacity-75 small mb-1">Angular<br />UI Kit</p>
                                        <p>100 hrs</p>
                                        <p>Start <i class="bi bi-play vm"></i></p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-12 col-md-6 col-lg-6 col-xxl-4">
                    <div class="card adminuiux-card mb-3 mb-lg-4 theme-cyan">
                        <div class="card-body">
                            <div class="row gx-3">
                                <div class="col-auto">
                                    <div class="rounded bg-theme-1 text-white p-3">
                                        <p class="opacity-75 small mb-1">HTML<br />Template</p>
                                        <p>125 hrs</p>
                                        <p>Start <i class="bi bi-play vm"></i></p>
                                    </div>
                                </div>
                                <div class="col align-self-center">
                                    <div class="row gx-3">
                                        <div class="col-12 col-lg">
                                            <p class="text-secondary small mb-0">Free Course</p>
                                            <p>Easily making money via blockchain</p>
                                        </div>
                                        <div class="col-12 col-lg-auto text-start text-xl-end">
                                            <p class="text-secondary small mb-0">Author:</p>
                                            <p>AdminUIUX</p>
                                        </div>
                                    </div>
                                    <div class="mt-3">
                                        <div class="progress height-dynamic mb-1 bg-theme-1-subtle text-theme-1" style="--h-dynamic: 5px">
                                            <div class="progress-bar bg-theme-1" role="progressbar" style="width: 45%" aria-valuenow="45" aria-valuemin="0" aria-valuemax="100"></div>
                                        </div>
                                    </div>
                                    <p class="small text-secondary">Targeted<span class="float-end">23 June 2022</span></p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- courses summary-->
            <div class="row gx-3 gx-lg-4">
                <!-- courses summary-->
                <div class="col-12 col-md-6 col-lg-6 col-xl-4 col-xxl-3 order-0 order-xxl-0">
                    <div class="card adminuiux-card mb-3 mb-lg-4 rounded overflow-hidden">
                        <figure class="coverimg w-100 height-150 mb-0">
                            <img src="assets/img/modern-ai-image/kids-2.jpg" class="w-100" alt="" />
                        </figure>
                        <div class="card-body">
                            <h6 class="mb-1">Data communication and signal strength</h6>
                            <p class="text-secondary small">Network to Internet making Intranet</p>
                            <div class="row gx-3 align-items-center">
                                <div class="col">
                                    <h4 class="mb-0">1542 <small class="h6">students</small></h4>
                                    <p class="small">
                                        11 <span class="text-green"><i class="bi bi-arrow-up fs-10"></i>3.15%</span>
                                    </p>
                                </div>
                                <div class="col-auto">
                                    <app-circle-progress-blue class="avatar avatar-60 small"></app-circle-progress-blue>
                                </div>
                            </div>
                        </div>
                        <div class="card-footer p-0">
                            <app-area-blue-chartjs-100 class="height-100 d-block mb-3"></app-area-blue-chartjs-100>
                            <div class="row gx-2 text-center">
                                <div class="col-3 mb-3">
                                    <p class="mb-3"><i class="bi bi-book avatar avatar-24 d-inline-block text-theme-1"></i></p>
                                    <h5 class="mb-0">3</h5>
                                    <p><small class="text-secondary">Lessons</small></p>
                                </div>
                                <div class="col-3 mb-3">
                                    <p class="mb-3"><i class="bi bi-clock avatar avatar-24 d-inline-block text-theme-1"></i></p>
                                    <h5 class="mb-0">2</h5>
                                    <p><small class="text-secondary">hrs/week</small></p>
                                </div>
                                <div class="col-3 mb-3">
                                    <p class="mb-3"><i class="bi bi-clipboard-check avatar avatar-24 d-inline-block text-theme-1"></i></p>
                                    <h5 class="mb-0">3</h5>
                                    <p><small class="text-secondary">Exams</small></p>
                                </div>
                                <div class="col-3 mb-3">
                                    <p class="mb-3"><i class="bi bi-journal-bookmark avatar avatar-24 d-inline-block text-theme-1"></i></p>
                                    <h5 class="mb-0">2</h5>
                                    <p><small class="text-secondary">Projects</small></p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-12 col-md-6 col-lg-6 col-xl-4 col-xxl-3 order-1 order-xxl-1">
                    <div class="card adminuiux-card mb-3 mb-lg-4 rounded overflow-hidden">
                        <figure class="coverimg w-100 height-150 mb-0">
                            <img src="assets/img/modern-ai-image/flamingo-4.jpg" class="w-100" alt="" />
                        </figure>
                        <div class="card-body">
                            <h6 class="mb-1">Easily making money via blockchain networks</h6>
                            <p class="text-secondary small">All you need to work about blockchain</p>
                            <div class="row gx-3 align-items-center">
                                <div class="col">
                                    <h4 class="mb-0">325 <small class="h6">Joined</small></h4>
                                    <p class="small">
                                        12 <span class="text-green"><i class="bi bi-arrow-up fs-10"></i>3.15%</span>
                                    </p>
                                </div>
                                <div class="col-auto">
                                    <app-circle-progress-green class="avatar avatar-60 small"></app-circle-progress-green>
                                </div>
                            </div>
                        </div>
                        <div class="card-footer p-0">
                            <app-area-green-chartjs-100 class="height-100 d-block mb-3"></app-area-green-chartjs-100>
                            <div class="row gx-2 text-center">
                                <div class="col-3 mb-3">
                                    <p class="mb-3"><i class="bi bi-book avatar avatar-24 d-inline-block text-theme-1"></i></p>
                                    <h5 class="mb-0">4</h5>
                                    <p><small class="text-secondary">Lessons</small></p>
                                </div>
                                <div class="col-3 mb-3">
                                    <p class="mb-3"><i class="bi bi-clock avatar avatar-24 d-inline-block text-theme-1"></i></p>
                                    <h5 class="mb-0">6</h5>
                                    <p><small class="text-secondary">hrs/week</small></p>
                                </div>
                                <div class="col-3 mb-3">
                                    <p class="mb-3"><i class="bi bi-clipboard-check avatar avatar-24 d-inline-block text-theme-1"></i></p>
                                    <h5 class="mb-0">13</h5>
                                    <p><small class="text-secondary">Exams</small></p>
                                </div>
                                <div class="col-3 mb-3">
                                    <p class="mb-3"><i class="bi bi-journal-bookmark avatar avatar-24 d-inline-block text-theme-1"></i></p>
                                    <h5 class="mb-0">21</h5>
                                    <p><small class="text-secondary">Projects</small></p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-12 col-md-6 col-lg-6 col-xl-4 col-xxl-3 order-2 order-xxl-2">
                    <div class="card adminuiux-card mb-3 mb-lg-4 rounded overflow-hidden">
                        <figure class="coverimg w-100 height-150 mb-0">
                            <img src="assets/img/modern-ai-image/tree-5.jpg" class="w-100" alt="" />
                        </figure>
                        <div class="card-body">
                            <h6 class="mb-1">Home furnishing & appliance Management</h6>
                            <p class="text-secondary small">Design and Adjust space around</p>
                            <div class="row gx-3 align-items-center">
                                <div class="col">
                                    <h4 class="mb-0">2015 <small class="h6">In groups</small></h4>
                                    <p class="small">
                                        62 <span class="text-green"><i class="bi bi-arrow-up fs-10"></i>3.15%</span>
                                    </p>
                                </div>
                                <div class="col-auto">
                                    <app-circle-progress-yellow class="avatar avatar-60 small"></app-circle-progress-yellow>
                                </div>
                            </div>
                        </div>
                        <div class="card-footer p-0">
                            <app-area-yellow-chartjs-100 class="height-100 d-block mb-3"></app-area-yellow-chartjs-100>
                            <div class="row gx-2 text-center">
                                <div class="col-3 mb-3">
                                    <p class="mb-3"><i class="bi bi-book avatar avatar-24 d-inline-block text-theme-1"></i></p>
                                    <h5 class="mb-0">4</h5>
                                    <p><small class="text-secondary">Lessons</small></p>
                                </div>
                                <div class="col-3 mb-3">
                                    <p class="mb-3"><i class="bi bi-clock avatar avatar-24 d-inline-block text-theme-1"></i></p>
                                    <h5 class="mb-0">5</h5>
                                    <p><small class="text-secondary">hrs/week</small></p>
                                </div>
                                <div class="col-3 mb-3">
                                    <p class="mb-3"><i class="bi bi-clipboard-check avatar avatar-24 d-inline-block text-theme-1"></i></p>
                                    <h5 class="mb-0">4</h5>
                                    <p><small class="text-secondary">Exams</small></p>
                                </div>
                                <div class="col-3 mb-3">
                                    <p class="mb-3"><i class="bi bi-journal-bookmark avatar avatar-24 d-inline-block text-theme-1"></i></p>
                                    <h5 class="mb-0">3</h5>
                                    <p><small class="text-secondary">Projects</small></p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-12 col-md-6 col-lg-6 col-xl-4 col-xxl-3 order-3 order-xxl-3">
                    <div class="card adminuiux-card mb-3 mb-lg-4 rounded overflow-hidden">
                        <figure class="coverimg w-100 height-150 mb-0">
                            <img src="assets/img/modern-ai-image/user-1-kid.jpg" class="w-100" alt="" />
                        </figure>
                        <div class="card-body">
                            <h6 class="mb-1">Be a good and create good Presentations</h6>
                            <p class="text-secondary small">How to convince viewer</p>
                            <div class="row gx-3 align-items-center">
                                <div class="col">
                                    <h4 class="mb-0">178 <small class="h6">Joined</small></h4>
                                    <p class="small">
                                        18 <span class="text-green"><i class="bi bi-arrow-up fs-10"></i>3.15%</span>
                                    </p>
                                </div>
                                <div class="col-auto">
                                    <app-circle-progress-red class="avatar avatar-60 small"></app-circle-progress-red>
                                </div>
                            </div>
                        </div>
                        <div class="card-footer p-0">
                            <app-area-red-chartjs-100 class="height-100 d-block mb-3"></app-area-red-chartjs-100>
                            <div class="row gx-2 text-center">
                                <div class="col-3 mb-3">
                                    <p class="mb-3"><i class="bi bi-book avatar avatar-24 d-inline-block text-theme-1"></i></p>
                                    <h5 class="mb-0">8</h5>
                                    <p><small class="text-secondary">Lessons</small></p>
                                </div>
                                <div class="col-3 mb-3">
                                    <p class="mb-3"><i class="bi bi-clock avatar avatar-24 d-inline-block text-theme-1"></i></p>
                                    <h5 class="mb-0">6</h5>
                                    <p><small class="text-secondary">hrs/week</small></p>
                                </div>
                                <div class="col-3 mb-3">
                                    <p class="mb-3"><i class="bi bi-clipboard-check avatar avatar-24 d-inline-block text-theme-1"></i></p>
                                    <h5 class="mb-0">5</h5>
                                    <p><small class="text-secondary">Exams</small></p>
                                </div>
                                <div class="col-3 mb-3">
                                    <p class="mb-3"><i class="bi bi-journal-bookmark avatar avatar-24 d-inline-block text-theme-1"></i></p>
                                    <h5 class="mb-0">6</h5>
                                    <p><small class="text-secondary">Projects</small></p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="row gx-3 gx-lg-4">
                <div class="col-12 col-md-12 col-lg-6">
                    <div class="card adminuiux-card mb-3 mb-lg-4 overflow-hidden">
                        <div class="row gx-0">
                            <div class="col-6">
                                <div class="h-100 w-100 coverimg">
                                    <img src="assets/img/modern-ai-image/pet-4.jpg" class="mw-100" alt="" />
                                </div>
                            </div>
                            <div class="col-6">
                                <div class="card-body">
                                    <p class="mb-3">
                                        <span class="badge badge-light text-bg-theme-1 theme-green">Course</span>
                                    </p>
                                    <h5>Getting older earlier.</h5>
                                    <p class="text-secondary mb-4">When you get older many people will listen you carefully, no matter if its correct discussion or not.</p>
                                    <div class="row gx-3 mb-3">
                                        <div class="col-auto align-self-center">
                                            <figure class="avatar avatar-40 rounded-circle coverimg vm">
                                                <img src="assets/img/modern-ai-image/user-4.jpg" alt="" />
                                            </figure>
                                        </div>
                                        <div class="col align-self-center">
                                            <p class="mb-0">David Warner</p>
                                            <p class="small text-secondary">London, UK</p>
                                        </div>
                                    </div>
                                    <button class="btn btn-sm btn-link text-theme-1">Join Now <i class="bi bi-arrow-right"></i></button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-12 col-md-12 col-lg-6">
                    <div class="card adminuiux-card mb-3 mb-lg-4 overflow-hidden">
                        <div class="row gx-0">
                            <div class="col-6">
                                <div class="h-100 w-100 coverimg">
                                    <img src="assets/img/modern-ai-image/user-5.jpg" class="mw-100" alt="" />
                                </div>
                            </div>
                            <div class="col-6">
                                <div class="card-body">
                                    <p class="mb-3">
                                        <span class="badge badge-light text-bg-theme-1 theme-green">Course</span>
                                    </p>
                                    <h5>Getting older earlier.</h5>
                                    <p class="text-secondary mb-4">When you get older many people will listen you carefully, no matter if its correct discussion or not.</p>
                                    <div class="row gx-3 mb-3">
                                        <div class="col-auto align-self-center">
                                            <figure class="avatar avatar-40 rounded-circle coverimg vm">
                                                <img src="assets/img/modern-ai-image/user-7.jpg" alt="" />
                                            </figure>
                                        </div>
                                        <div class="col align-self-center">
                                            <p class="mb-0">David Warner</p>
                                            <p class="small text-secondary">London, UK</p>
                                        </div>
                                    </div>
                                    <button class="btn btn-sm btn-link text-theme-1">Join Now <i class="bi bi-arrow-right"></i></button>
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
export class CompanyResourceComponent {
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
