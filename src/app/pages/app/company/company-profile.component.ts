import { Component, OnInit, ViewChild, ElementRef, CUSTOM_ELEMENTS_SCHEMA } from "@angular/core";
import { RouterLink } from "@angular/router";
import Choices, { ClassNames } from "choices.js";

import { DaterangePickerRangesComponent } from "../../../components/input-fields/daterange-picker/daterange-picker-ranges.component";

@Component({
    selector: "app-company-profile",
    standalone: true,
    imports: [RouterLink, DaterangePickerRangesComponent],
    template: `
        <!-- page title -->
        <div class="container-fluid py-3">
            <div class="row gx-3 gx-lg-4 align-items-center page-title">
                <div class="col col-sm mb-3 mb-sm-0 order-1">
                    <h5 class="mb-0">Company</h5>
                    <p class="text-secondary small">Checkout most famous company's profile</p>
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
                    <li class="breadcrumb-item bi active" aria-current="page">Company</li>
                </ol>
            </nav>
        </div>

        <!-- content -->
        <div class="w-100 py-3 py-lg-4 position-relative bg-theme-1 text-white z-index-0" id="main-content">
            <div class="coverimg w-100 h-100 position-absolute top-0 start-0 opacity-25 z-index-0">
                <img src="assets/img/background-image/backgorund-image-4.jpg" class="" alt="" />
            </div>
            <div class="container mt-3 mb-5 z-index-1 position-relative">
                <div class="row gx-3 align-items-start">
                    <div class="col-auto position-relative mb-3 mb-md-4">
                        <figure class="avatar avatar-140 coverimg rounded-3 shadow-md">
                            <img src="assets/img/logo-512.png" alt="" />
                        </figure>
                    </div>
                    <div class="col-12 col-md mb-3 mb-md-4">
                        <h2 class="mb-2">
                            AdminUIUX <span class="badge bg-theme-1 theme-green rounded vm fw-normal fs-14"><i class="bi bi-check-circle me-1 vm"></i>Active</span>
                        </h2>
                        <p>The Best creative design company. Mostly product based and small size services based company. Its independent company running and providing creative solutions to the UI UX design domain.</p>
                        <p>UI UX Design, IT services</p>
                    </div>
                    <div class="col-12 col-md-auto mb-3 mb-md-4">
                        <button class="btn btn-outline-light me-2"><i class="bi bi-plus vm me-2"></i> Follow</button>
                        <button class="btn btn-theme theme-green"><i class="bi bi-person-plus vm me-2"></i> Connect</button>
                    </div>
                </div>
                <div class="row gx-4 gx-lg-5">
                    <div class="col-12 col-md-6 col-lg-auto mb-3">
                        <p class="opacity-50 small mb-1">Website</p>
                        <p>https://adminuiux.com</p>
                    </div>
                    <div class="col-12 col-md-6 col-lg-auto mb-3">
                        <p class="opacity-50 small mb-1">Financial Stability</p>
                        <p>
                            <i class="bi bi-exclamation-triangle text-yellow vm"></i> Unstable
                            <span class="mx-1 opacity-25">|</span>
                            <a routerLink="/app/company-help-center" class="text-white"><i class="bi bi-heart-fill text-red vm"></i> Need Support <i class="bi bi-box-arrow-up-right vm mx-1"></i></a>
                        </p>
                    </div>
                    <div class="col-6 col-md-6 col-lg-auto mb-3">
                        <p class="opacity-50 small mb-1">Company Size</p>
                        <p>1-5</p>
                    </div>
                    <div class="col-6 col-md-6 col-lg-auto mb-3">
                        <p class="opacity-50 small mb-1">Business Domain</p>
                        <p>UI UX Design</p>
                    </div>
                </div>
            </div>
        </div>

        <div class="container mt--25">
            <div class="card adminuiux-card z-index-1 mb-1">
                <div class="card-body">
                    <ul class="nav nav-pills" id="companynavigation" role="tablist">
                        <li class="nav-item" role="presentation">
                            <button class="nav-link active" id="overviewcompany-tab" data-bs-toggle="tab" data-bs-target="#overviewcompany" type="button" role="tab" aria-controls="overviewcompany" aria-selected="true">Overview</button>
                        </li>
                        <li class="nav-item" role="presentation">
                            <button class="nav-link" id="teamcompany-tab" data-bs-toggle="tab" data-bs-target="#teamcompany" type="button" role="tab" aria-controls="teamcompany" aria-selected="false">Team</button>
                        </li>
                        <li class="nav-item" role="presentation">
                            <button class="nav-link" id="servicescompany-tab" data-bs-toggle="tab" data-bs-target="#servicescompany" type="button" role="tab" aria-controls="servicescompany" aria-selected="false">Services</button>
                        </li>
                        <li class="nav-item ms-auto mt-3 mt-sm-0 theme-green" role="presentation">
                            <button class="btn btn-theme" id="contactus-tab" data-bs-toggle="tab" data-bs-target="#contactus" type="button" role="tab" aria-controls="contactus" aria-selected="false">Get info</button>
                        </li>
                    </ul>
                </div>
            </div>
            <div class="card adminuiux-card mb-3 mb-lg-4">
                <div class="card-body bg-none py-3 py-lg-4">
                    <div class="tab-content" id="companynavigationContent">
                        <div class="tab-pane fade show active" id="overviewcompany" role="tabpanel" aria-labelledby="overviewcompany-tab">
                            <div class="row gx-3 justify-content-center">
                                <div class="col-12 col-md-10">
                                    <div class="row gx-3 align-items-center ">
                                        <div class="col-12 col-md-7 mb-3 mb-md-4">
                                            <h2>We design UX UI for <span class="text-gradient">Creative & Unique</span> Digital Products</h2>
                                            <p class="text-secondary">We create HTML templates for Enterprise applications, Business applications, eCommerce application, Admin Dashboard Applications, Mobile application, Mobile Websites, Micro websites, Cordova apps etc. Technology you can choose from our latest builds Bootstrap 5 HTML template, Mobile app templates, Angular 19 starter kits.</p>
                                        </div>
                                        <div class="col-12 col-md-5 mb-3 mb-md-4">
                                            <div class="coverimg height-250 rounded overflow-hidden shadow-sm">
                                                <img src="assets/img/modern-ai-image/team-sq-2.jpg" alt="" />
                                            </div>
                                        </div>
                                    </div>

                                    <div class="card adminuiux-card bg-theme-1-subtle text-center mb-3 mb-lg-4 rounded">
                                        <div class="card-body p-4 p-md-5">
                                            <h4 class="mb-2 mb-md-3">Our Goal and Vision</h4>
                                            <p class="text-secondary">We believe to create best ethics practices around the design corner. We always comes with futuristic approach to solve customers problem. We evaluate progress day by day and our vision is to make beautiful, usable, creative and good user experienced design.</p>
                                            <br />
                                            <h4 class="text-gradient mb-3">Winners don't do different things,<br />they do things differently</h4>
                                            <p class="fw-light">Shiv Khera <cite title=" Source Title">You Can Win: A Step by Step Tool for Top Achievers</cite></p>
                                        </div>
                                    </div>

                                    <div class="row gx-3">
                                        <div class="col-12 col-md-6 mb-3 mb-lg-4 text-center">
                                            <i class="bi bi-bullseye h1 avatar avatar-80 bg-theme-1-subtle text-theme-1 rounded-circle mb-3"></i>
                                            <h4 class="mb-2 mb-md-3">Our Mission</h4>
                                            <p class="text-secondary">Our mission is to provide great UI UX design with flexibility of development at the reliable cost. This will give you best by saving time and money. So, for our customer its all about the Win Win situation.</p>
                                        </div>
                                        <div class="col-12 col-md-6 mb-3 mb-lg-4 text-center ">
                                            <i class="bi bi-window-stack h1 avatar avatar-80 bg-theme-1-subtle text-theme-1 rounded-circle mb-3"></i>
                                            <h4 class="mb-2 mb-md-3">What we do</h4>
                                            <p class="text-secondary">We do best creative and usable digital products for web and mobile devices, website and universal app development. We create HTML templates and starter kits with different technologies like Angular, React, Laravel etc.</p>
                                        </div>
                                    </div>
                                    <hr class="my-4 border-top" />
                                    <div class="row gx-3 gx-lg-4 mb-4 mb-md-5">
                                        <div class="col-12 col-md-12 col-lg-5 mb-5 mb-xxl-0">
                                            <h5 class="mb-3">Clean & Trending UI design with a great user experience</h5>
                                            <p class="text-secondary">AdminUX is creative and multipurpose template. You can use it for CRM, Business application, Intranet Application, Portal service and Many more. It comes with unlimited possibilities and 10+ predefined styles which you can also mix up and create new. <b>Do support and spread a word for us</b>.</p>
                                        </div>
                                        <div class="col-12 col-md-6 col-lg-3">
                                            <h6 class="mb-3">Main office:</h6>
                                            <p class="mb-1"><a href="https://adminuiux.com" target="_blank">www.adminuiux.com</a></p>
                                            <p class="mb-3 text-secondary">Test data 103909 Witamer CR, Niagara Falls, NY 14305, United States</p>
                                            <ul class="nav ">
                                                <li class="nav-item">
                                                    <a class="nav-link text-secondary px-2" href="https://www.facebook.com/adminuiux/" target="_blank">
                                                        <i class="bi bi-facebook h5"></i>
                                                    </a>
                                                </li>
                                                <li class="nav-item">
                                                    <a class="nav-link text-secondary px-2" href="https://twitter.com/admiinuiux" target="_blank">
                                                        <i class="bi bi-twitter h5"></i>
                                                    </a>
                                                </li>
                                                <li class="nav-item">
                                                    <a class="nav-link text-secondary px-2" href="https://linkedin.com/company/adminuiux" target="_blank">
                                                        <i class="bi bi-linkedin h5"></i>
                                                    </a>
                                                </li>
                                                <li class="nav-item">
                                                    <a class="nav-link text-secondary px-2" href="https://www.instagram.com/adminuiux/" target="_blank">
                                                        <i class="bi bi-instagram h5"></i>
                                                    </a>
                                                </li>
                                            </ul>
                                        </div>
                                        <div class="col-12 col-md-6 col-lg-4">
                                            <h6 class="mb-3">Contact information:</h6>
                                            <div class="row gx-3 gx-lg-4 align-items-center mb-3 mb-lg-4">
                                                <div class="col-auto"><i class="bi bi-clock text-theme-1"></i></div>
                                                <div class="col">0441-215-518625<br /><span class="text-secondary">Mon-Sat, 9:00am - 10:00pm</span></div>
                                            </div>
                                            <div class="row gx-3 gx-lg-4 align-items-center mb-3 mb-lg-4">
                                                <div class="col-auto"><i class="bi bi-telephone text-theme-1"></i></div>
                                                <div class="col">+1-000 000 100000</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="tab-pane fade" id="servicescompany" role="tabpanel" aria-labelledby="servicescompany-tab">
                            <div class="row gx-3 justify-content-center">
                                <div class="col-12 col-md-10">
                                    <div class="row gx-3 gx-lg-4">
                                        <div class="col-12 col-md-6">
                                            <div class="card style-none mb-3 mb-lg-4">
                                                <img src="assets/img/components/admin-ui-ux-bootstrap-html-template-card.png" class="card-img-top rounded" alt="..." />
                                                <div class="card-body">
                                                    <h5>Creative UI Design</h5>
                                                    <p class="text-secondary">We create unique and creative user interfaces for website and mobile applications.</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="col-12 col-md-6">
                                            <div class="card style-none mb-3 mb-lg-4">
                                                <img src="assets/img/components/admin-ui-ux-bootstrap-html-template-color.png" class="card-img-top rounded" alt="..." />
                                                <div class="card-body">
                                                    <h5>Awesome UX flow</h5>
                                                    <p class="text-secondary">We keep everything on intuitive and simplest manner to make sure everything covered and easy to access.</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <h2 class="text-center mb-3 mb-lg-4 py-3">You are at awesome space.<br />Just <span class="text-gradient">create a difference</span>.</h2>
                                    <div class="row gx-3 gx-lg-4">
                                        <div class="col-12 col-md-6">
                                            <div class="card style-none mb-3 mb-lg-4">
                                                <img src="assets/img/components/admin-ui-ux-bootstrap-html-template-pricing.png" class="card-img-top rounded" alt="..." />
                                                <div class="card-body">
                                                    <h5>Customization</h5>
                                                    <p class="text-secondary">To improve day by day customization for new requirements. We follow best practices to make development flawless and elastic. Good layout structure always helps.</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="col-12 col-md-6">
                                            <div class="card style-none mb-3 mb-lg-4">
                                                <img src="assets/img/components/admin-ui-ux-bootstrap-html-template-popover.png" class="card-img-top rounded" alt="..." />
                                                <div class="card-body">
                                                    <h5>Multi-device Centric</h5>
                                                    <p class="text-secondary">Human in race of different medium to communicate with each other and we also keep eye on different screen sizes and responsiveness</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="tab-pane fade" id="teamcompany" role="tabpanel" aria-labelledby="teamcompany-tab">
                            <div class="row gx-3 justify-content-center">
                                <div class="col-12 col-md-10">
                                    <h2 class="text-center mb-1 mb-lg-2">
                                        Our great team is our<br />
                                        <span class="text-gradient">strength and source</span> of growth.
                                    </h2>
                                    <p class="text-secondary text-center mb-3 mb-lg-4">We work hard, we do it creatively and we like to see you here!</p>

                                    <div class="row gx-3 gx-lg-4">
                                        <div class="col-12 col-md-6 col-lg-4">
                                            <div class="card shadow-none text-center mb-3 mb-lg-4">
                                                <div class="card-body">
                                                    <div class="height-250 overflow-hidden rounded mb-3">
                                                        <figure class="h-100 w-100 coverimg">
                                                            <img src="assets/img/modern-ai-image/user-6.jpg" alt="" />
                                                        </figure>
                                                    </div>
                                                    <h5 class="text-truncated mb-1">Aditi Johnson</h5>
                                                    <p class="mb-1">London, UK</p>
                                                    <p class="text-secondary small">Founder</p>
                                                    <ul class="nav justify-content-center">
                                                        <li class="nav-item">
                                                            <a class="nav-link text-secondary px-2" href="https://www.facebook.com/adminuiux/" target="_blank">
                                                                <i class="bi bi-facebook h5"></i>
                                                            </a>
                                                        </li>
                                                        <li class="nav-item">
                                                            <a class="nav-link text-secondary px-2" href="https://twitter.com/admiinuiux" target="_blank">
                                                                <i class="bi bi-twitter h5"></i>
                                                            </a>
                                                        </li>
                                                        <li class="nav-item">
                                                            <a class="nav-link text-secondary px-2" href="https://linkedin.com/company/adminuiux" target="_blank">
                                                                <i class="bi bi-linkedin h5"></i>
                                                            </a>
                                                        </li>
                                                        <li class="nav-item">
                                                            <a class="nav-link text-secondary px-2" href="https://www.instagram.com/adminuiux/" target="_blank">
                                                                <i class="bi bi-instagram h5"></i>
                                                            </a>
                                                        </li>
                                                    </ul>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="col-12 col-md-6 col-lg-4">
                                            <div class="card shadow-none text-center mb-3 mb-lg-4">
                                                <div class="card-body">
                                                    <div class="height-250 overflow-hidden rounded mb-3">
                                                        <figure class="h-100 w-100 coverimg">
                                                            <img src="assets/img/modern-ai-image/user-4.jpg" alt="" />
                                                        </figure>
                                                    </div>
                                                    <h5 class="text-truncated mb-1">Steven Thomson</h5>
                                                    <p class="mb-1">New York, USA</p>
                                                    <p class="text-secondary small">CEO</p>
                                                    <ul class="nav justify-content-center">
                                                        <li class="nav-item">
                                                            <a class="nav-link text-secondary px-2" href="https://www.facebook.com/adminuiux/" target="_blank">
                                                                <i class="bi bi-facebook h5"></i>
                                                            </a>
                                                        </li>
                                                        <li class="nav-item">
                                                            <a class="nav-link text-secondary px-2" href="https://twitter.com/admiinuiux" target="_blank">
                                                                <i class="bi bi-twitter h5"></i>
                                                            </a>
                                                        </li>
                                                        <li class="nav-item">
                                                            <a class="nav-link text-secondary px-2" href="https://linkedin.com/company/adminuiux" target="_blank">
                                                                <i class="bi bi-linkedin h5"></i>
                                                            </a>
                                                        </li>
                                                        <li class="nav-item">
                                                            <a class="nav-link text-secondary px-2" href="https://www.instagram.com/adminuiux/" target="_blank">
                                                                <i class="bi bi-instagram h5"></i>
                                                            </a>
                                                        </li>
                                                    </ul>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="col-12 col-md-6 col-lg-4">
                                            <div class="card shadow-none text-center mb-3 mb-lg-4">
                                                <div class="card-body">
                                                    <div class="height-250 overflow-hidden rounded mb-3">
                                                        <figure class="h-100 w-100 coverimg">
                                                            <img src="assets/img/modern-ai-image/user-3.jpg" alt="" />
                                                        </figure>
                                                    </div>
                                                    <h5 class="text-truncated mb-1">Nicky Lambaa</h5>
                                                    <p class="mb-1">Wembley, UK</p>
                                                    <p class="text-secondary small">CTO</p>
                                                    <ul class="nav justify-content-center">
                                                        <li class="nav-item">
                                                            <a class="nav-link text-secondary px-2" href="https://www.facebook.com/adminuiux/" target="_blank">
                                                                <i class="bi bi-facebook h5"></i>
                                                            </a>
                                                        </li>
                                                        <li class="nav-item">
                                                            <a class="nav-link text-secondary px-2" href="https://twitter.com/admiinuiux" target="_blank">
                                                                <i class="bi bi-twitter h5"></i>
                                                            </a>
                                                        </li>
                                                        <li class="nav-item">
                                                            <a class="nav-link text-secondary px-2" href="https://linkedin.com/company/adminuiux" target="_blank">
                                                                <i class="bi bi-linkedin h5"></i>
                                                            </a>
                                                        </li>
                                                        <li class="nav-item">
                                                            <a class="nav-link text-secondary px-2" href="https://www.instagram.com/adminuiux/" target="_blank">
                                                                <i class="bi bi-instagram h5"></i>
                                                            </a>
                                                        </li>
                                                    </ul>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="col-12 col-md-6 col-lg-4">
                                            <div class="card shadow-none mb-3 mb-lg-4">
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
                                                            <p class="mb-1">Amsterdam, NL</p>
                                                            <p class="text-secondary small">UI Designer</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="col-12 col-md-6 col-lg-4">
                                            <div class="card shadow-none mb-3 mb-lg-4">
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
                                                            <p class="mb-1">London, UK</p>
                                                            <p class="text-secondary small">UX Designer</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="col-12 col-md-6 col-lg-4">
                                            <div class="card shadow-none mb-3 mb-lg-4">
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
                                                            <p class="mb-1">London, UK</p>
                                                            <p class="text-secondary small">Product Designer</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="col-12 col-md-6 col-lg-4">
                                            <div class="card shadow-none mb-3 mb-lg-4">
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
                                                            <p class="mb-1">London, UK</p>
                                                            <p class="text-secondary small">Project Manager</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="col-12 col-md-6 col-lg-4">
                                            <div class="card shadow-none mb-3 mb-lg-4">
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
                                                            <h6 class="text-truncated mb-0">Preeti Dwivedi</h6>
                                                            <p class="mb-1">Kashi, IN</p>
                                                            <p class="text-secondary small">Head of Design</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="col-12 col-md-6 col-lg-4">
                                            <div class="card shadow-none mb-3 mb-lg-4">
                                                <div class="card-body">
                                                    <div class="row gx-3 align-items-center">
                                                        <div class="col-auto">
                                                            <div class="avatar avatar-80 overflow-hidden rounded">
                                                                <figure class="h-100 w-100 coverimg">
                                                                    <img src="assets/img/modern-ai-image/user-5.jpg" alt="" class="w-100" />
                                                                </figure>
                                                            </div>
                                                        </div>
                                                        <div class="col">
                                                            <h6 class="text-truncated mb-0">Ananya Singh</h6>
                                                            <p class="mb-1">London, UK</p>
                                                            <p class="text-secondary small">Development Support</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div class="py-4 py-lg-5 position-relative text-center rounded overflow-hidden mb-3 mb-lg-4 z-index-0">
                                        <figure class="coverimg h-100 w-100 z-index-0 position-absolute top-0 start-0 m-0 opacity-50">
                                            <img src="assets/img/background-image/backgorund-image-6.jpg" alt="" />
                                        </figure>
                                        <div class="row h-100 align-items-center justify-content-center position-relative z-index-1">
                                            <div class="col-12 col-md-10 col-lg-8">
                                                <h2>Team build with Trust & Transparency</h2>
                                                <p class="opacity-75">We always prefer to have clear communication less headache and only creative thoughts in mind. That is why we prefer to have good working culture across the organization.</p>

                                                <h5 class="text-center">Wanted to experience adventure? <span class="text-gradient">Join us</span> now!.</h5>
                                                <p class="opacity-75 text-center mb-4">We will be happy to make ou part of our team.</p>

                                                <button class="btn btn-theme">Apply now</button>
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
export class CompanyProfileComponent {
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
