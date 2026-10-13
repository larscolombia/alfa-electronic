import { Component, OnInit, AfterViewInit, AfterContentChecked, OnDestroy, ViewChild, ElementRef, CUSTOM_ELEMENTS_SCHEMA } from "@angular/core";
import { RouterLink } from "@angular/router";
import Choices, { ClassNames } from "choices.js";

import { DaterangePickerRangesComponent } from "../../../components/input-fields/daterange-picker/daterange-picker-ranges.component";

@Component({
    selector: "app-company-contact-us",
    standalone: true,
    imports: [RouterLink, DaterangePickerRangesComponent],
    template: `
        <!-- page title -->
        <div class="container-fluid py-3">
            <div class="row gx-3 gx-lg-4 align-items-center page-title">
                <div class="col col-sm mb-3 mb-sm-0 order-1">
                    <h5 class="mb-0">Contact us</h5>
                    <p class="text-secondary small">Do let your customer can communicate with you</p>
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
                    <li class="breadcrumb-item bi active" aria-current="page">Contact us</li>
                </ol>
            </nav>
        </div>

        <!-- content -->
        <div class="container mt-3" id="main-content">
            <!-- contact us -->

            <div class="row gx-3 gx-lg-4">
                <div class="col-12 col-md-6 col-lg-6 col-xl-8">
                    <div class="row gx-3 gx-lg-4 mb-3 mb-lg-4">
                        <div class="col-12 py-3">
                            <h2>We are <span class="text-gradient">Happy to Help you</span></h2>
                            <p class="text-secondary">Contact us now, we will be back to you as soon as possible</p>
                        </div>
                    </div>
                    <!-- other contacts-->
                    <div class="row gx-3 gx-lg-4 justify-content-center">
                        <div class="col-12 col-md-12 col-xl-6 mb-4 mb-lg-5">
                            <h5>Head Office</h5>
                            <p class="text-secondary">
                                3778 Golden Street<br />
                                Miami, Florida, 33179,<br />
                                United States
                            </p>
                            <p class="text-secondary mb-2"><i class="bi bi-telephone me-1"></i> +1 305-655-59S8</p>
                            <p class="text-secondary"><i class="bi bi-calendar-week me-1"></i> Mon-Fri 9:00 am - 7:00 pm</p>
                        </div>
                        <div class="col-12 col-md-12 col-xl-6 mb-4 mb-lg-5">
                            <h5>Sales</h5>
                            <p class="text-secondary">
                                3778 Golden Street<br />
                                Miami, Florida, 33179,<br />
                                United States
                            </p>
                            <p class="text-secondary mb-2"><i class="bi bi-telephone me-1"></i> +1 305-655-59S8</p>
                            <p class="text-secondary"><i class="bi bi-calendar-week me-1"></i> Mon-Fri 9:00 am - 7:00 pm</p>
                        </div>
                    </div>

                    <!-- other contacts-->
                    <div class="row gx-3 gx-lg-4 justify-content-center">
                        <div class="col-12 col-md-12 col-xl-6 mb-4 mb-lg-5">
                            <p class="h5">Technical problem</p>
                            <p class="text-secondary">If you have any type of technical challenges and would like to get help from us please drop an email at <a href="mailto:info&#64;adminuiux.cos">tech&#64;adminuiux.coms</a></p>
                        </div>
                        <div class="col-12 col-md-12 col-xl-6 mb-4 mb-lg-5">
                            <p class="h5">General Support</p>
                            <p class="text-secondary">If you have any type of challenges regarding products and would like to get help from us please drop an email at <a href="mailto:info&#64;adminuiux.cos">sales&#64;adminuiux.coms</a></p>
                        </div>
                    </div>
                </div>
                <div class="col-12 col-md-6 col-lg-6 col-xl-4">
                    <div class="card adminuiux-card mb-3 mb-lg-4">
                        <div class="card-body">
                            <div class="row gx-3">
                                <div class="col-12 col-lg-12 mb-2">
                                    <div class="form-group mb-3 position-relative check-valid">
                                        <div class="input-group input-group-lg">
                                            <span class="input-group-text text-theme-1"><i class="bi bi-person"></i></span>
                                            <div class="form-floating"><input placeholder="First Name" value="Max" required="" class="form-control" /> <label>First Name</label></div>
                                            <div class="form-floating"><input placeholder="Last Name" value="Johnson" required="" class="form-control" /> <label>last Name</label></div>
                                        </div>
                                    </div>
                                    <div class="invalid-feedback mb-3">Add valid data</div>
                                </div>
                                <div class="col-12 col-md-12 mb-2">
                                    <div class="form-group mb-3 position-relative">
                                        <div class="input-group input-group-lg">
                                            <span class="input-group-text text-theme-1"><i class="bi bi-envelope"></i></span>
                                            <div class="form-floating"><input type="email" placeholder="Email Address" required="" class="form-control" /> <label>Email Address</label></div>
                                        </div>
                                    </div>
                                    <div class="invalid-feedback mb-3">Add valid data</div>
                                </div>
                                <div class="col-12 col-lg-12 mb-2">
                                    <div class="form-group mb-3 position-relative">
                                        <div class="input-group input-group-lg">
                                            <span class="input-group-text text-theme-1"><i class="bi bi-question-circle"></i></span>
                                            <div class="form-floating"><input placeholder="Subject" value="Johnson" required="" class="form-control" /> <label>Subject</label></div>
                                        </div>
                                    </div>
                                    <div class="invalid-feedback mb-3">Add valid data</div>
                                </div>
                                <div class="col-12 col-md-12 mb-2">
                                    <div class="form-group mb-3 position-relative check-valid">
                                        <div class="input-group input-group-lg">
                                            <span class="input-group-text text-theme-1"><i class="bi bi-chat-right-text"></i></span>
                                            <div class="form-floating"><textarea placeholder="Message" class="form-control h-auto" rows="4"></textarea> <label>Message</label></div>
                                        </div>
                                    </div>
                                    <div class="invalid-feedback mb-3">Add valid data</div>
                                </div>
                            </div>
                            <button type="button" class="btn btn-lg w-100 btn-theme">Submit Message</button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- get support and join us -->
            <div class="py-4 py-lg-5 position-relative text-center rounded overflow-hidden mb-3 mb-lg-4 z-index-0 bg-theme-1">
                <figure class="coverimg h-100 w-100 z-index-0 position-absolute top-0 start-0 m-0 opacity-25">
                    <img src="assets/img/background-image/backgorund-image-3.jpg" alt="" />
                </figure>
                <div class="row gx-3 justify-content-center z-index-1 position-relative">
                    <div class="col-12 col-md-8 col-lg-6">
                        <h4>We are always here</h4>
                        <p class="opacity-75">To help and to guide you!</p>
                    </div>
                </div>
            </div>

            <!-- quick links -->
            <div class="row gx-3 gx-lg-4 justify-content-center">
                <div class="col-12 col-md-4 col-lg-4">
                    <div class="card adminuiux-card mb-3 mb-lg-4">
                        <div class="card-body">
                            <i class="bi bi-chat-right-dots avatar avatar-60 bg-theme-1-subtle text-theme-1 rounded h5 mb-3"></i><br />
                            <h5 class="mb-1">Communicate</h5>
                            <p class="text-secondary mb-2">You have live assistant with whom you can share your query &amp; get answered.</p>
                            <a class="btn btn-link">Watch Community</a>
                        </div>
                    </div>
                </div>

                <div class="col-12 col-md-4 col-lg-4">
                    <div class="card adminuiux-card mb-3 mb-lg-4">
                        <div class="card-body">
                            <i class="bi bi-life-preserver avatar avatar-60 bg-theme-1-subtle text-theme-1 rounded h5 mb-3"></i><br />
                            <h5 class="mb-1">Get Support</h5>
                            <p class="text-secondary mb-2">Connect with our expert by submitting details with photos &amp; documents.</p>
                            <a class="btn btn-link">Create Ticket</a>
                        </div>
                    </div>
                </div>

                <div class="col-12 col-md-4 col-lg-4">
                    <div class="card adminuiux-card mb-3 mb-lg-4">
                        <div class="card-body">
                            <i class="bi bi-person-video3 avatar avatar-60 bg-theme-1-subtle text-theme-1 rounded h5 mb-3"></i><br />
                            <h5 class="mb-1">Schedule a Demo</h5>
                            <p class="text-secondary mb-2">Get details of features and quick look on how it works. Schedule a demo.</p>
                            <a class="btn btn-link">Book Demo</a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `,
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class CompanyContactusComponent {
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
