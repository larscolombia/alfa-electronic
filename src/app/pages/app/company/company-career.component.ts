import { Component, OnInit, AfterViewInit, AfterContentChecked, OnDestroy, ViewChild, ElementRef, CUSTOM_ELEMENTS_SCHEMA } from "@angular/core";
import { RouterLink } from "@angular/router";
import Choices, { ClassNames } from "choices.js";

import { DaterangePickerRangesComponent } from "../../../components/input-fields/daterange-picker/daterange-picker-ranges.component";

@Component({
    selector: "app-company-career",
    standalone: true,
    imports: [RouterLink, DaterangePickerRangesComponent],
    template: `
        <!-- page title -->
        <div class="container-fluid py-3">
            <div class="row gx-3 gx-lg-4 align-items-center page-title">
                <div class="col col-sm mb-3 mb-sm-0 order-1">
                    <h5 class="mb-0">Career</h5>
                    <p class="text-secondary small">Find best career and Job offers</p>
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
                    <li class="breadcrumb-item bi active" aria-current="page">Career</li>
                </ol>
            </nav>
        </div>

        <!-- content -->
        <div class="container mt-3" id="main-content">
            <div class="row gx-3 gx-lg-4 mb-3 mb-lg-4">
                <div class="col text-center py-3">
                    <h4>Your first step is for <span class="text-gradient">Learning</span> & Next all are for <span class="text-gradient">Bright Future</span></h4>
                    <p class="text-secondary">You can be happy and make others also. Do good work and be good with good human beings.</p>
                </div>
            </div>
            <div class="height-300 mb-3 mb-lg-4 position-relative text-center bg-theme-1 text-white rounded overflow-hidden">
                <figure class="coverimg h-100 w-100 z-index-0 position-absolute top-0 start-0 m-0 opacity-25">
                    <img src="assets/img/adminux/bg-21.jpg" alt="" />
                </figure>
                <div class="row gx-3 gx-lg-4 h-100 z-index-1 align-items-center justify-content-center position-relative">
                    <div class="col-12 col-md-8 col-lg-6">
                        <h2>Team build with Trust &amp; Transparency</h2>
                        <p class="opacity-75 mb-3 mb-lg-4">We always prefer to have clear communication less headache and only creative thoughts in mind. That is why we prefer to have good working culture across the organization.</p>
                        <button class="btn btn-light">Contact us for more</button>
                    </div>
                </div>
            </div>
            <div class="row gx-3 align-items-center">
                <div class="col-12 col-md-auto py-3 mb-3 mb-lg-4">
                    <h2 class="mb-1">100+</h2>
                    <p class="text-secondary mb-3 mb-lg-4">Creative & Unique Pages</p>

                    <h2 class="mb-1">200+</h2>
                    <p class="text-secondary mb-3 mb-lg-4">Flexible & Elastic widgets</p>
                </div>
                <div class="col-12 col-md offset-md-1 py-3 mb-3 mb-lg-4">
                    <h2 class="mb-3">We are doing for great future<br />of web applications design.</h2>
                    <h5 class="mb-4">Change the way you see web applications.<br />Make it more Human friendly.</h5>
                    <p class="text-secondary">AdminUX is creative and multipurpose template. You can use it for CRM, Business application, Intranet Application, Portal service and Many more. It comes with unlimited possibilities and 10+ predefined styles which you can also mix up and create new style. Do support and spread a word for us.</p>
                </div>
            </div>
        </div>

        <div class="container-fluid bg-theme-1-subtle text-theme-1 py-3">
            <div class="text-center mb-3 mb-lg-4 py-3">
                <h4 class="mb-1">Start your <span class="text-gradient">career</span> with us</h4>
                <p class="text-secondary">Get your best job on right time</p>
            </div>
            <div class="row justify-content-center mt-3">
                <div class="col-12 col-lg-11 col-xxl-10">
                    <div class="row gx-3">
                        <div class="col-12 col-md-4 col-lg-6 col-xl-3">
                            <div class="card adminuiux-card mb-3 mb-lg-4 overflow-hidden">
                                <div class="height-150 w-100 coverimg">
                                    <img src="assets/img/modern-ai-image/pet-3.jpg" class="mw-100" alt="" />
                                </div>
                                <div class="card-body">
                                    <h5 class="mb-1">Administrator</h5>
                                    <p class="mb-3">3-5 year experience</p>
                                    <p class="text-secondary">Administrator works with ground staffs and manage food, cleaning and office area decor. If you are good, having 3-5 years experience, do join us.</p>
                                    <button class="btn btn-sm btn-theme">Apply Now <i class="bi bi-arrow-right"></i></button>
                                </div>
                            </div>
                        </div>
                        <div class="col-12 col-md-4 col-lg-6 col-xl-3">
                            <div class="card adminuiux-card mb-3 mb-lg-4 overflow-hidden">
                                <div class="height-150 w-100 coverimg">
                                    <img src="assets/img/modern-ai-image/kids-2.jpg" class="mw-100" alt="" />
                                </div>
                                <div class="card-body">
                                    <h5 class="mb-1">Sr. Manager</h5>
                                    <p class="mb-3">6+ year experience</p>
                                    <p class="text-secondary">Our rocking team needs a good senior manager who can work wih 10 people team for offshore client. We need good experience in healthcare domain.</p>
                                    <button class="btn btn-sm btn-theme">Apply Now <i class="bi bi-arrow-right"></i></button>
                                </div>
                            </div>
                        </div>
                        <div class="col-12 col-md-4 col-lg-6 col-xl-3">
                            <div class="card adminuiux-card mb-3 mb-lg-4 overflow-hidden">
                                <div class="height-150 w-100 coverimg">
                                    <img src="assets/img/modern-ai-image/tree-2.jpg" class="mw-100" alt="" />
                                </div>
                                <div class="card-body">
                                    <h5 class="mb-1">Php Developer</h5>
                                    <p class="mb-3">4-6 year experience</p>
                                    <p class="text-secondary">We are looking for cost friendly developer in open-source technology like php and Laravel Yii3 to create and manage web/mobile applications.</p>
                                    <button class="btn btn-sm btn-theme">Apply Now <i class="bi bi-arrow-right"></i></button>
                                </div>
                            </div>
                        </div>
                        <div class="col-12 col-md-4 col-lg-6 col-xl-3">
                            <div class="card adminuiux-card mb-3 mb-lg-4 overflow-hidden">
                                <div class="height-150 w-100 coverimg">
                                    <img src="assets/img/modern-ai-image/flamingo-4.jpg" class="mw-100" alt="" />
                                </div>
                                <div class="card-body">
                                    <h5>Front-end Developer</h5>
                                    <p class="mb-3">3-5 year experience</p>
                                    <p class="text-secondary">Developer who create clean like kitchen front-end apps integration with different frontend technologies. Apply now! If you wanted to work with us.</p>
                                    <button class="btn btn-sm btn-theme">Apply Now <i class="bi bi-arrow-right"></i></button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="container">
            <div class="row gx-3 align-items-center mt-3 mt-lg-4">
                <div class="col-12 col-md-4 col-lg-4 col-xl-3 py-3 mb-3 mb-lg-4">
                    <img src="assets/img/modern-ai-image/flamingo-2.jpg" alt="" class="mw-100 rounded" />
                </div>
                <div class="col-12 col-md py-3 mb-3 mb-lg-4">
                    <h2 class="mb-3">Our mission is to <br />serve good UI UX design.</h2>
                    <h5 class="mb-4">We do it by ourselves with the team in which you can be a part.</h5>
                    <p class="text-secondary">AdminUX is creative and multipurpose template. You can use it for CRM, Business application, Intranet Application, Portal service and Many more. It comes with unlimited possibilities and 10+ predefined styles which you can also mix up and create new style. Do support and spread a word for us.</p>
                </div>
                <div class="col-12 col-md-auto offset-md-1 py-3 mb-3 mb-lg-4">
                    <h2 class="mb-1">4+</h2>
                    <p class="text-secondary mb-4">Different technology starter kit</p>

                    <h2 class="mb-1">15 + 2</h2>
                    <p class="text-secondary">Pre-defined colors + Layout modes</p>
                </div>
            </div>

            <div class="py-4 py-lg-5 position-relative text-center rounded overflow-hidden mb-3 mb-lg-4 z-index-0 bg-theme-1">
                <figure class="coverimg h-100 w-100 z-index-0 position-absolute top-0 start-0 m-0 opacity-50">
                    <img src="assets/img/background-image/backgorund-image-6.jpg" alt="" />
                </figure>
                <div class="row h-100 align-items-center justify-content-center position-relative z-index-1">
                    <div class="col-12 col-md-8 col-lg-7">
                        <h2>Team build with Trust &amp; Transparency</h2>
                        <p class="opacity-75">We always prefer to have clear communication less headache and only creative thoughts in mind. That is why we prefer to have good working culture across the organization.</p>
                        <br />
                        <h5 class="text-center">Wanted to experience adventure? Join us now!.</h5>
                        <p class="opacity-75 text-center mb-4">We will be happy to make ou part of our team.</p>

                        <button class="btn btn-theme">Apply now</button>
                    </div>
                </div>
            </div>
        </div>
    `,
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class CompanyCareerComponent {
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
