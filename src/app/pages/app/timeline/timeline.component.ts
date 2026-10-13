import { Component, OnInit, AfterViewInit, AfterContentChecked, OnDestroy, ViewChild, ElementRef, CUSTOM_ELEMENTS_SCHEMA } from "@angular/core";
import { RouterLink } from "@angular/router";
import Choices, { ClassNames } from "choices.js";

import { DaterangePickerRangesComponent } from "../../../components/input-fields/daterange-picker/daterange-picker-ranges.component";

@Component({
    selector: "app-timeline",
    standalone: true,
    imports: [RouterLink, DaterangePickerRangesComponent],
    template: `
        <!-- page title -->
        <div class="container-fluid py-3">
            <div class="row gx-3 gx-lg-4 align-items-center page-title">
                <div class="col col-sm mb-3 mb-sm-0 order-1">
                    <h5 class="mb-0">Timeline</h5>
                    <p class="text-secondary small">OUr company's journey towards growth</p>
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
                    <li class="breadcrumb-item bi active" aria-current="page">Timeline</li>
                </ol>
            </nav>
        </div>

        <!-- content -->
        <div class="container-fluid mt-3" id="main-content">
            <!-- title -->
            <div class="row gx-3 gx-lg-4 mb-3 mb-lg-4">
                <div class="col text-center py-3">
                    <h4>Our company's <span class="text-gradient">Timeline</span> & milestone</h4>
                    <p class="text-secondary">We are working hard to make it possible and inspires a thousands of people</p>
                </div>
            </div>

            <!-- Timeline starts  -->

            <div class="row gx-3 gx-lg-4">
                <div class="col-12 col-md-6 col-lg-4 col-xl-3 col-xxl theme-yellow mb-3 mb-lg-4">
                    <div class="card adminuiux-card h-100 bg-l-gradient-light">
                        <div class="card-body">
                            <div class="row h-100 align-items-end">
                                <div class="col-12">
                                    <div class="avatar avatar-50 bg-theme-1-subtle text-theme-1 rounded-circle mb-3 mb-lg-4">
                                        <i class="bi bi-lightbulb h4"></i>
                                    </div>
                                    <h1 class="text-theme-1">2019</h1>
                                    <h6>Journey has been started</h6>
                                    <p class="text-secondary mb-3">We have started our journey after 7th month of 2019 and its just a concept and idea for services better designs.</p>

                                    <figure class="mb-0 coverimg rounded height-150">
                                        <img src="assets/img/modern-ai-image/bus-3.jpg" alt="" />
                                    </figure>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-12 col-md-6 col-lg-4 col-xl-3 col-xxl theme-green mb-3 mb-lg-4">
                    <div class="card adminuiux-card h-100 bg-l-gradient-light">
                        <div class="card-body">
                            <div class="row h-100 align-items-end">
                                <div class="col-12">
                                    <div class="avatar avatar-50 bg-theme-1-subtle text-theme-1 rounded-circle mb-3 mb-lg-4">
                                        <i class="bi bi-building h4"></i>
                                    </div>
                                    <h1 class="text-theme-1">2020</h1>
                                    <h6 class="mb-3">We established company</h6>
                                    <figure class="mb-3 coverimg rounded height-150">
                                        <img src="assets/img/modern-ai-image/kids-2.jpg" alt="" />
                                    </figure>
                                    <p class="text-secondary">We have started our journey after 7th month of 2019 and its just a concept and idea for services better designs.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-12 col-md-6 col-lg-4 col-xl-3 col-xxl theme-blue mb-3 mb-lg-4">
                    <div class="card adminuiux-card h-100 bg-l-gradient-light">
                        <div class="card-body">
                            <div class="row h-100 align-items-end">
                                <div class="col-12">
                                    <div class="avatar avatar-50 bg-theme-1-subtle text-theme-1 rounded-circle mb-3 mb-lg-4">
                                        <i class="bi bi-balloon-heart h4"></i>
                                    </div>
                                    <h1 class="text-theme-1">2021</h1>
                                    <h6>We grow our company to 10</h6>
                                    <p class="text-secondary mb-3">We have started our journey after 7th month of 2019 and its just a concept and idea for services better designs.</p>

                                    <figure class="mb-0 coverimg rounded height-150">
                                        <img src="assets/img/modern-ai-image/tree-6.jpg" alt="" />
                                    </figure>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-12 col-md-6 col-lg-4 col-xl-3 col-xxl theme-purple mb-3 mb-lg-4">
                    <div class="card adminuiux-card h-100 bg-l-gradient-light">
                        <div class="card-body">
                            <div class="row h-100 align-items-end">
                                <div class="col-12">
                                    <div class="avatar avatar-50 bg-theme-1-subtle text-theme-1 rounded-circle mb-3 mb-lg-4">
                                        <i class="bi bi-boxes h4"></i>
                                    </div>
                                    <h1 class="text-theme-1">2022</h1>
                                    <h6 class="mb-3">We achieved 100+ completion</h6>
                                    <figure class="mb-3 coverimg rounded height-150">
                                        <img src="assets/img/modern-ai-image/PET-2.jpg" alt="" />
                                    </figure>
                                    <p class="text-secondary">We have started our journey after 7th month of 2019 and its just a concept and idea for services better designs.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-12 col-md-6 col-lg-4 col-xl-3 col-xxl theme-pink mb-3 mb-lg-4">
                    <div class="card adminuiux-card h-100 bg-l-gradient-light">
                        <div class="card-body">
                            <div class="row h-100 align-items-end">
                                <div class="col-12">
                                    <div class="avatar avatar-50 bg-theme-1-subtle text-theme-1 rounded-circle mb-3 mb-lg-4">
                                        <i class="bi bi-people h4"></i>
                                    </div>
                                    <h1 class="text-theme-1">2023</h1>
                                    <h6 class="mb-3">We will be of 100+ people</h6>
                                    <p class="text-secondary mb-3">We have started our journey after 7th month of 2019 and its just a concept and idea for services better designs.</p>
                                    <figure class="mb-0 coverimg rounded height-150">
                                        <img src="assets/img/modern-ai-image/team-sq-2.jpg" alt="" />
                                    </figure>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div class="container">
            <div class="card adminuiux-card text-center mb-3 mb-lg-4 rounded">
                <div class="card-body p-4 p-md-5">
                    <h4>Our Goal and Vision</h4>
                    <p class="text-secondary">We believe to create best ethics practices around the design corner. We always comes with futuristic approach to solve customers problem. We evaluate progress day by day and our vision is to make beautiful, usable, creative and good user experienced design.</p>
                    <br />
                    <h4 class="mb-3 mb-lg-4">Winners don't do different things, <br /><span class="text-gradient">they do things differently</span></h4>
                    <p class="text-secondary">Shiv Khera <cite title=" Source Title">You Can Win: A Step by Step Tool for Top Achievers</cite></p>
                </div>
            </div>

            <div class="row gx-3 gx-lg-4">
                <div class="col-12 col-md-6 col-lg-4 text-center">
                    <div class="card adminuiux-card text-center mb-3 mb-lg-4 rounded">
                        <div class="card-body p-4 p-md-5">
                            <i class="bi bi-bullseye h1 avatar avatar-80 bg-theme-1-subtle text-theme-1 rounded-circle mb-3 mb-md-4"></i>
                            <h4 class="mb-2 mb-md-3">Our Mission</h4>
                            <p class="text-secondary">Our mission is to provide great UI UX design with flexibility of development at the reliable cost. This will give you best by saving time and money. So, for our customer its all about the Win Win situation.</p>
                        </div>
                    </div>
                </div>
                <div class="col-12 col-md-6 col-lg-4 text-center">
                    <div class="card adminuiux-card text-center mb-3 mb-lg-4 rounded">
                        <div class="card-body p-4 p-md-5">
                            <i class="bi bi-window-stack h1 avatar avatar-80 bg-theme-1-subtle text-theme-1 rounded-circle mb-3 mb-md-4"></i>
                            <h4 class="mb-2 mb-md-3">What we do</h4>
                            <p class="text-secondary">We do best creative and usable digital products for web and mobile devices, website and universal app development. We create HTML templates and starter kits with different technologies like Angular, React, Laravel etc.</p>
                        </div>
                    </div>
                </div>
                <div class="col-12 col-md-6 col-lg-4 text-center">
                    <div class="card adminuiux-card text-center mb-3 mb-lg-4 rounded">
                        <div class="card-body p-4 p-md-5">
                            <i class="bi bi-lightbulb h1 avatar avatar-80 bg-theme-1-subtle text-theme-1 rounded-circle mb-3 mb-md-4"></i>
                            <h4 class="mb-2 mb-md-3">Our strength</h4>
                            <p class="text-secondary">We do our best to achieve creative designs to a HTML product with other technology. We are solving... Industries biggest challenge is UI integration and we make it easy with useful flexibility of expansion at any time.</p>
                        </div>
                    </div>
                </div>
            </div>
            <!-- recent news -->
            <div class="row gx-3 gx-lg-4 mb-3 mb-lg-4">
                <div class="col text-center py-3">
                    <h4>Get the <span class="text-gradient">Latest courses</span> with courage</h4>
                    <p class="text-secondary">Keep yourself updated, No matter how much workload is.</p>
                </div>
            </div>
            <div class="row gx-3 gx-lg-4">
                <div class="col-12 col-md-12 col-lg-6">
                    <div class="card adminuiux-card mb-3 mb-lg-4 overflow-hidden">
                        <div class="row gx-3">
                            <div class="col-6">
                                <div class="h-100 w-100 coverimg">
                                    <img src="assets/img/modern-ai-image/user-5.jpg" class="mw-100" alt="" />
                                </div>
                            </div>
                            <div class="col-6">
                                <div class="card-body">
                                    <p class="mb-3">
                                        <span class="badge badge-lg badge-light text-bg-theme-1 theme-green">Course</span>
                                    </p>
                                    <h5>Getting job seriously may helps you to become the best entrepreneur in the world.</h5>
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
                                    <button class="btn btn-link text-theme">Join Now <i class="bi bi-arrow-right"></i></button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-12 col-md-12 col-lg-6 mb-4">
                    <div class="card adminuiux-card mb-3 mb-lg-4 overflow-hidden">
                        <div class="row gx-3">
                            <div class="col-6">
                                <div class="h-100 w-100 coverimg">
                                    <img src="assets/img/modern-ai-image/user-6-kid.jpg" class="mw-100" alt="" />
                                </div>
                            </div>
                            <div class="col-6">
                                <div class="card-body">
                                    <p class="mb-3">
                                        <span class="badge badge-lg badge-light text-bg-theme-1 theme-green">Course</span>
                                    </p>
                                    <h5>Communicate with right spirit and with the right people to make your space.</h5>
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
                                    <button class="btn btn-link text-theme">Join Now <i class="bi bi-arrow-right"></i></button>
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
export class TimelineComponent {
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
