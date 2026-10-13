import { Component, OnInit, AfterViewInit, AfterContentChecked, OnDestroy, ViewChild, ElementRef, CUSTOM_ELEMENTS_SCHEMA } from "@angular/core";
import { RouterLink } from "@angular/router";
import Choices, { ClassNames } from "choices.js";

import { DaterangePickerRangesComponent } from "../../../components/input-fields/daterange-picker/daterange-picker-ranges.component";

@Component({
    selector: "app-my-subscription",
    standalone: true,
    imports: [RouterLink, DaterangePickerRangesComponent],
    template: `
        <!-- page title -->
        <div class="container-fluid py-3">
            <div class="row gx-3 gx-lg-4 align-items-center page-title">
                <div class="col col-sm mb-3 mb-sm-0 order-1">
                    <h5 class="mb-0">My Subscription</h5>
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
                    <li class="breadcrumb-item bi"><a routerLink="/app/my-profile"> My Profile</a></li>
                    <li class="breadcrumb-item bi active" aria-current="page">My Subscription</li>
                </ol>
            </nav>
        </div>

        <!-- content -->
        <div class="container mt-3" id="main-content">
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
                    </div>
                </div>
                <div class="col-12 col-lg-7 col-xl-8">
                    <div class="card adminuiux-card mb-3 mb-lg-4">
                        <div class="card-header">
                            <h6>Current plan</h6>
                        </div>
                        <div class="card-body">
                            <div class="row gx-3">
                                <div class="col-12 col-md-12 col-lg-6 col-xl-4 mb-4 mb-lg-0">
                                    <div class="card adminuiux-card border mb-3 mb-lg-4">
                                        <div class="coverimg height-100 w-100 rounded" style='background-image: url("assets/img/modern-ai-image/flamingo-4.jpg");'>
                                            <img src="assets/img/modern-ai-image/flamingo-4.jpg" alt="" style="display: none;" />
                                        </div>
                                        <div class="card-body text-center mt--50">
                                            <figure class="avatar avatar-60 mb-3 mx-auto mtop-35 rounded">
                                                <img src="assets/img/logo-512.png" class="mw-100" alt="" />
                                            </figure>
                                            <h4 class="mb-0">Business</h4>
                                            <p class="text-secondary">Annual Plan</p>
                                        </div>
                                        <div class="card-footer text-center">
                                            <h4>$ 250.00</h4>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-12 col-md-6 col-lg-6 col-xl-4 mb-3 mb-lg-4">
                                    <h6>Plan Features</h6>
                                    <p class="text-secondary mb-4">Including features of basic plan</p>
                                    <div class="row mb-2">
                                        <div class="col-auto">
                                            <i class="bi bi-check-circle text-secondary"></i>
                                        </div>
                                        <div class="col-auto ps-0">Free Shipping</div>
                                    </div>
                                    <div class="row mb-2">
                                        <div class="col-auto">
                                            <i class="bi bi-check-circle text-secondary"></i>
                                        </div>
                                        <div class="col-auto ps-0">Unlimited Send Money</div>
                                    </div>
                                    <div class="row mb-2">
                                        <div class="col-auto">
                                            <i class="bi bi-check-circle text-secondary"></i>
                                        </div>
                                        <div class="col-auto ps-0">Multiple Currencies Support</div>
                                    </div>
                                    <div class="row mb-4">
                                        <div class="col-auto">
                                            <i class="bi bi-check-circle text-secondary"></i>
                                        </div>
                                        <div class="col-auto ps-0">Unlimited Send Money</div>
                                    </div>
                                    <a href="" class="btn btn-link">More details</a>
                                </div>
                                <div class="col-12 col-md-6 col-lg-12 col-xl-4 mb-3 mb-lg-4">
                                    <h6>Payment Method</h6>
                                    <p class="text-secondary mb-4">1 Credit Card is saved</p>
                                    <div class="row gx-3 mb-2">
                                        <div class="col-auto">
                                            <i class="bi bi-credit-card text-theme-1"></i>
                                        </div>
                                        <div class="col-auto ps-0">Visa ending ****<b>25480</b></div>
                                    </div>
                                    <div class="row mb-4">
                                        <div class="col-auto">
                                            <i class="bi bi-calendar-event text-theme-1"></i>
                                        </div>
                                        <div class="col-auto ps-0">Next Due date is <b>22-June-2026</b></div>
                                    </div>
                                    <div>
                                        <button class="btn btn-link">Change Card</button>
                                        <button class="btn btn-link theme-red mx-2">Cancel</button>
                                    </div>
                                </div>
                            </div>

                            <div class="row gx-3">
                                <div class="col-auto">
                                    <a routerLink="/app/subscription-plans" class="btn btn-theme">Change Plan <i class="bi bi-arrow-right"></i></a>
                                </div>
                                <div class="col-auto"></div>
                            </div>
                        </div>
                    </div>

                    <div class="card adminuiux-card mb-3 mb-lg-4">
                        <div class="card-body">
                            <h4>Best way to work fast and east to use.<br />Stay tracked and also committed with priorities.</h4>
                            <p class="text-secondary mb-4">Get involved in the race of technology and digitization. Win the heart not the war. Go beyond of imagination but not far from your loved ones.</p>

                            <div class="row gx-3">
                                <div class="col-12 col-md-12 col-lg-6">
                                    <h5>Creators of statements</h5>
                                    <p class="text-secondary mb-4">All the export functionalities are available for your reports and email to any person around the world.</p>
                                    <div class="row mb-4">
                                        <div class="col-auto">
                                            <i class="bi bi-filetype-pdf fs-4 me-1 avatar avatar-40 bg-danger-subtle text-danger-emphasis rounded"></i>
                                        </div>
                                        <div class="col">
                                            <h6>PDF export</h6>
                                            <p class="text-secondary">Pdf export functionalities available for all kind of reports including charts and background images.</p>
                                        </div>
                                    </div>
                                    <div class="row mb-4">
                                        <div class="col-auto">
                                            <i class="bi bi-filetype-xlsx fs-4 me-1 avatar avatar-40 bg-success-subtle text-success-emphasis rounded"></i>
                                        </div>
                                        <div class="col">
                                            <h6>Excel export</h6>
                                            <p class="text-secondary">Excel export functionalities available for all kind of reports including charts.</p>
                                        </div>
                                    </div>
                                    <button class="btn btn-link">Buy now</button>
                                </div>

                                <div class="col-12 col-md-12 col-lg-6">
                                    <h5>Analytics Stronger</h5>
                                    <p class="text-secondary mb-4">Keep the eye on your visitors and users. Downloads, Clicked,shared with region, gender and people.</p>
                                    <div class="row mb-4">
                                        <div class="col-auto">
                                            <i class="bi bi-bar-chart fs-4 me-1 avatar avatar-40 bg-purple-subtle text-purple-emphasis rounded"></i>
                                        </div>
                                        <div class="col">
                                            <h6>Reporting</h6>
                                            <p class="text-secondary">Subscription and manage features as per your need. More advance designs available to customize.</p>
                                        </div>
                                    </div>
                                    <div class="row mb-4">
                                        <div class="col-auto">
                                            <i class="bi bi-pie-chart fs-4 me-1 avatar avatar-40 bg-pink-subtle text-pink-emphasis rounded"></i>
                                        </div>
                                        <div class="col">
                                            <h6>Sharing Domain</h6>
                                            <p class="text-secondary">Now you can able to track more resource availability and share with users.</p>
                                        </div>
                                    </div>
                                    <button class="btn btn-link">Buy now</button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="card adminuiux-card bg-l-gradient-light mb-3 mb-lg-4 theme-red">
                        <div class="card-header">
                            <div class="row gx-3">
                                <div class="col-auto">
                                    <i class="bi bi-star me-1 avatar avatar-40 bg-theme-1-subtle text-theme-1 rounded"></i>
                                </div>
                                <div class="col">
                                    <h6 class="mb-0">Previous plan</h6>
                                    <p class="text-secondary">Cancelled Recent plan</p>
                                </div>
                                <div class="col-auto">
                                    <div class="dropdown d-inline-block">
                                        <a class="btn btn-square btn-link dd-arrow-none" data-bs-toggle="dropdown" aria-expanded="false" data-bs-display="static" role="button">
                                            <i class="bi bi-three-dots-vertical"></i>
                                        </a>
                                        <ul class="dropdown-menu dropdown-menu-end">
                                            <li><a class="dropdown-item" href="javascript:void(0)">Subscribe</a></li>
                                            <li><a class="dropdown-item" href="javascript:void(0)">Raise issue</a></li>
                                            <li><a class="dropdown-item text-danger" href="javascript:void(0)">Delete</a></li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="card-body">
                            <div class="row gx-3 gx-lg-4">
                                <div class="col-12 col-md-12 col-lg-6 col-xl-4 mb-4 mb-lg-0">
                                    <div class="card adminuiux-card border shadow-none overflow-hidden">
                                        <div class="coverimg height-120 w-100">
                                            <img src="assets/img/modern-ai-image/lion-2.jpg" alt="" />
                                        </div>
                                        <div class="card-body text-center">
                                            <figure class="avatar avatar-60 mb-3 mx-auto mt--25 bg-light rounded p-1 border">
                                                <img src="assets/img/logo-512.png" class="mw-100" alt="" />
                                            </figure>
                                            <h4 class="mb-0">Basic</h4>
                                            <p class="fw-normal text-secondary">Annual Plan</p>
                                        </div>
                                        <div class="card-footer text-center">
                                            <h4 class="mb-0">$ 250.00</h4>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-12 col-md-6 col-lg-6 col-xl-4 mb-4 mb-lg-0">
                                    <h6 class="mb-1">Plan Features</h6>
                                    <p class="text-secondary mb-4">Including features of Free plan</p>
                                    <div class="row gx-3 mb-2">
                                        <div class="col-auto">
                                            <i class="bi bi-check-circle text-muted"></i>
                                        </div>
                                        <div class="col-auto ps-0">Free Shipping</div>
                                    </div>
                                    <div class="row gx-3 mb-2">
                                        <div class="col-auto">
                                            <i class="bi bi-check-circle text-muted"></i>
                                        </div>
                                        <div class="col-auto ps-0">Unlimited Send Money</div>
                                    </div>
                                    <div class="row gx-3 mb-2">
                                        <div class="col-auto">
                                            <i class="bi bi-check-circle text-muted"></i>
                                        </div>
                                        <div class="col-auto ps-0">Multiple Currencies Support</div>
                                    </div>
                                    <div class="row gx-3 mb-2">
                                        <div class="col-auto">
                                            <i class="bi bi-check-circle text-muted"></i>
                                        </div>
                                        <div class="col-auto ps-0">Unlimited Send Money</div>
                                    </div>
                                    <br />
                                    <a href="" class="btn btn-link">More details</a>
                                </div>
                                <div class="col-12 col-md-6 col-lg-12 col-xl-4">
                                    <h6 class="mb-1">Payment Method</h6>
                                    <p class="text-secondary mb-4">1 Credit Card is saved</p>
                                    <div class="row gx-3 mb-2">
                                        <div class="col-auto">
                                            <i class="bi bi-credit-card text-muted"></i>
                                        </div>
                                        <div class="col-auto ps-0">Visa ending ****<b>25480</b></div>
                                    </div>
                                    <div class="row gx-3 mb-2">
                                        <div class="col-auto">
                                            <i class="bi bi-calendar-event text-muted"></i>
                                        </div>
                                        <div class="col-auto ps-0">This plan is cancelled on<br /><b>14-June-2021</b></div>
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
export class MySubscriptionComponent {
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
