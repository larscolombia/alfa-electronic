import { Component, OnInit, AfterViewInit, AfterContentChecked, OnDestroy, ViewChild, ElementRef, CUSTOM_ELEMENTS_SCHEMA } from "@angular/core";
import { RouterLink } from "@angular/router";
import Choices, { ClassNames } from "choices.js";

import { DaterangePickerRangesComponent } from "../../../components/input-fields/daterange-picker/daterange-picker-ranges.component";

@Component({
    selector: "app-company-help-center",
    standalone: true,
    imports: [RouterLink, DaterangePickerRangesComponent],
    template: `
        <!-- page title -->
        <div class="container-fluid py-3">
            <div class="row gx-3 gx-lg-4 align-items-center page-title">
                <div class="col col-sm mb-3 mb-sm-0 order-1">
                    <h5 class="mb-0">Help Center</h5>
                    <p class="text-secondary small">Let your customers, users find support and connect</p>
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
                    <li class="breadcrumb-item bi active" aria-current="page">Help Center</li>
                </ol>
            </nav>
        </div>

        <!-- content -->
        <div class="container mt-3" id="main-content">
            <div class="card adminuiux-card bg-theme-1 px-3 position-relative overflow-hidden mb-3 mb-lg-4">
                <div class="coverimg top-0 start-0 h-100 w-100 position-absolute opacity-25">
                    <img src="assets/img/adminux/bg-21.jpg" alt="" />
                </div>
                <div class="card-body">
                    <div class="row gx-3 gx-lg-4 mb-3 mb-lg-4 py-4 py-lg-5 align-items-center justify-content-center vh-50 position-relative">
                        <div class="col-12 col-md-10 col-lg-8 col-xl-7 col-xxl-6 text-center">
                            <h1>How can we Help you?</h1>
                            <p class="opacity-75 mb-3">Find solution for your troubles. We have wide range of learning tutorials and supports.</p>
                            <!-- search -->
                            <div class="input-group">
                                <span class="input-group-text text-theme-1"><i class="bi bi-search"></i></span>
                                <input class="form-control form-control-lg" type="search" placeholder="Search your query here..." />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- quick connect links -->
            <div class="row gx-3 gx-lg-4 justify-content-center">
                <div class="col-12 col-md-4">
                    <div class="card adminuiux-card text-center mb-3 mb-lg-4">
                        <div class="card-body">
                            <i class="bi bi-person-video3 display-5 text-theme-1 mb-3 d-block"></i>
                            <h5 class="mb-1">Schedule a Demo</h5>
                            <p class="text-secondary">Get details of features and quick look on how it works. Schedule a demo now.</p>
                            <button class="btn btn-link">Book Demo</button>
                        </div>
                    </div>
                </div>

                <div class="col-12 col-md-4">
                    <div class="card adminuiux-card text-center mb-3 mb-lg-4">
                        <div class="card-body">
                            <i class="bi bi-chat-right-dots display-5 text-theme-1 mb-3 d-block"></i>
                            <h5 class="mb-1">Communicate</h5>
                            <p class="text-secondary">You have live assistant with whom you can share your concern & get answered quickly.</p>
                            <button class="btn btn-link">Book Demo</button>
                        </div>
                    </div>
                </div>

                <div class="col-12 col-md-4">
                    <div class="card adminuiux-card text-center mb-3 mb-lg-4">
                        <div class="card-body">
                            <i class="bi bi-life-preserver display-5 text-theme-1 mb-3 d-block"></i>
                            <h5 class="mb-1">Get Support</h5>
                            <p class="text-secondary">Connect with our expert by submitting details with photos and documents.</p>
                            <button class="btn btn-link">Raise Ticket</button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- popular questions-->
            <h5 class="mb-3 mb-lg-4">Popular Questions</h5>
            <p class="mb-3 mb-lg-4">
                <a href="" class="badge badge-lg badge-light text-bg-theme-1 me-1 my-1">How we can do edits in index pages?</a>
                <a href="" class="badge badge-lg badge-light text-bg-theme-1 me-1 my-1">Is this template comes with Laravel vue js?</a>
                <a href="" class="badge badge-lg badge-light text-bg-theme-1 me-1 my-1">Is there angular development suggestions before starting work?</a>
                <a href="" class="badge badge-lg badge-light text-bg-theme-1 me-1 my-1">How to reduce width of any boxes with responsiveness?</a>
                <a href="" class="badge badge-lg badge-light text-bg-theme-1 me-1 my-1">How can you defined new color set ?</a>
                <a href="" class="badge badge-lg badge-light text-bg-theme-1 me-1 my-1">What are the primary color set and what to keep in mind?</a>
            </p>

            <!-- questions by categories-->
            <h5 class="mb-3 mb-lg-4">Help by Categories</h5>
            <div class="row gx-3 gx-lg-4">
                <div class="col-12 col-md-6 col-lg-4">
                    <div class="card adminuiux-card mb-3 mb-lg-4">
                        <div class="card-body">
                            <div class="row gx-3 align-items-center mb-3 mb-lg-4">
                                <div class="col-auto">
                                    <div class="avatar avatar-40 bg-theme-1-subtle text-theme-1 rounded">
                                        <i class="bi bi-person-circle"></i>
                                    </div>
                                </div>
                                <div class="col">
                                    <h6>Login and Logout flow</h6>
                                </div>
                            </div>
                            <div class="list-group list-group-flush border-0 bg-none">
                                <a class="list-group-item list-group-item-action">Login purpose </a>
                                <a class="list-group-item list-group-item-action">What are the Login options?</a>
                                <a class="list-group-item list-group-item-action">How to reset password?</a>
                                <a class="list-group-item list-group-item-action">How to change password?</a>
                                <a class="list-group-item list-group-item-action">Where from I can logout from?</a>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-12 col-md-6 col-lg-4">
                    <div class="card adminuiux-card mb-3 mb-lg-4">
                        <div class="card-body">
                            <div class="row gx-3 align-items-center mb-3 mb-lg-4">
                                <div class="col-auto">
                                    <div class="avatar avatar-40 bg-theme-1-subtle text-theme-1 rounded">
                                        <i class="bi bi-palette"></i>
                                    </div>
                                </div>
                                <div class="col">
                                    <h6>Customization & Settings</h6>
                                </div>
                            </div>
                            <div class="list-group list-group-flush border-0 bg-none">
                                <a class="list-group-item list-group-item-action">How to change color scheme? </a>
                                <a class="list-group-item list-group-item-action">Personalize background images?</a>
                                <a class="list-group-item list-group-item-action">Update colors in theme colors?</a>
                                <a class="list-group-item list-group-item-action">How to create new theme colors set?</a>
                                <a class="list-group-item list-group-item-action">Purpose of the crowd assets?</a>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-12 col-md-6 col-lg-4">
                    <div class="card adminuiux-card mb-3 mb-lg-4">
                        <div class="card-body">
                            <div class="row gx-3 align-items-center mb-3 mb-lg-4">
                                <div class="col-auto">
                                    <div class="avatar avatar-40 bg-theme-1-subtle text-theme-1 rounded">
                                        <i class="bi bi-award"></i>
                                    </div>
                                </div>
                                <div class="col">
                                    <h6>License and Usage</h6>
                                </div>
                            </div>

                            <div class="list-group list-group-flush border-0 bg-none">
                                <a class="list-group-item list-group-item-action">What is mean bt free license?</a>
                                <a class="list-group-item list-group-item-action">What is business license?</a>
                                <a class="list-group-item list-group-item-action">How is PRO different from free license?</a>
                                <a class="list-group-item list-group-item-action">Benefits of PRO license?</a>
                                <a class="list-group-item list-group-item-action">Personal use limitation and restrictions?</a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="py-4 py-lg-5 position-relative text-center rounded overflow-hidden mb-3 mb-lg-4 z-index-0 bg-theme-1">
                <figure class="coverimg h-100 w-100 z-index-0 position-absolute top-0 start-0 m-0 opacity-25">
                    <img src="assets/img/background-image/backgorund-image-3.jpg" alt="" />
                </figure>
                <div class="row gx-3 justify-content-center z-index-1 position-relative">
                    <div class="col-12 col-md-8 col-lg-6">
                        <h4>Couldn't find what you are looking for?</h4>
                        <p class="opacity-75 mb-3 mb-lg-4">Its possible human made mistakes and possibly we may missed it. We are happy to assist you as well as upgrade our system. Do let us know your query, concern and feedback.</p>
                        <a href="" class="btn btn-theme">Connect with us</a>
                        <a href="" class="btn btn-link text-white ms-2">Leave us feedback</a>
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
                        <div class="row gx-0">
                            <div class="col-6">
                                <div class="h-100 w-100 coverimg">
                                    <img src="assets/img/modern-ai-image/flamingo-2.jpg" class="mw-100" alt="" />
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
                                            <h6 class="mb-0">David Warner</h6>
                                            <p class="small text-secondary">London, UK</p>
                                        </div>
                                    </div>
                                    <button class="btn btn-link text-theme-1">Join Now <i class="bi bi-arrow-right"></i></button>
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
                                    <img src="assets/img/modern-ai-image/pet-3.jpg" class="mw-100" alt="" />
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
                                            <h6 class="mb-0">David Warner</h6>
                                            <p class="small text-secondary">London, UK</p>
                                        </div>
                                    </div>
                                    <button class="btn btn-link text-theme-1">Join Now <i class="bi bi-arrow-right"></i></button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- email communication -->
            <div class="row gx-3 gx-lg-4 justify-content-center">
                <div class="col-12 col-md-6 col-xl-4 text-md-end mb-3 mb-lg-4">
                    <h5>Technical problem</h5>
                    <p class="text-mute">If you have any type of technical challenges and would like to get help from us please drop an email at <a href="mailto:info&#64;adminuiux.coms">tech&#64;adminuiux.coms</a></p>
                </div>
                <div class="col-12 col-md-6 col-xl-4 border-left-dashed mb-3 mb-lg-4">
                    <h5>General Support</h5>
                    <p class="text-mute">If you have any type of challenges regarding products and would like to get help from us please drop an email at <a href="mailto:info&#64;adminuiux.coms">sales&#64;adminuiux.coms</a></p>
                </div>
            </div>
        </div>
    `,
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class CompanyHelpCenterComponent {
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
