import { Component, OnInit, AfterViewInit, AfterContentChecked, OnDestroy, ViewChild, ElementRef, CUSTOM_ELEMENTS_SCHEMA } from "@angular/core";
import { RouterLink } from "@angular/router";
import Choices, { ClassNames } from "choices.js";

import { DaterangePickerRangesComponent } from "../../../components/input-fields/daterange-picker/daterange-picker-ranges.component";

@Component({
    selector: "app-contact-us",
    standalone: true,
    imports: [RouterLink, DaterangePickerRangesComponent],
    template: `
        <!-- page title -->
        <div class="container-fluid py-3">
            <div class="row gx-3 gx-lg-4 align-items-center page-title">
                <div class="col col-sm mb-3 mb-sm-0 order-1">
                    <h5 class="mb-0">Contact Us</h5>
                    <p class="text-secondary small">Get in touch with us.</p>
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
        </div>

        <!-- content -->
        <div class="coverimg height-300 w-100 position-relative overlay-gradiant overlay-theme">
            <img src="assets/img/background-image/backgorund-image-3.jpg" alt="" />
        </div>

        <div class="container mt-3" id="main-content">
            <!-- get in touch with us form -->
            <div class="card adminuiux-card overflow-hidden mb-3 mb-lg-4 mt--100">
                <div class="row gx-0">
                    <div class="col-12 col-md-4 col-lg-5 col-xl-6 ">
                        <figure class="h-100 mb-0 coverimg ">
                            <img src="assets/img/modern-ai-image/pet-1.jpg" alt="" />
                        </figure>
                    </div>
                    <div class="col-12 col-md-8 col-lg-7 col-xl-6 px-xl-4">
                        <div class="card-body py-4 py-lg-5">
                            <div class="text-center mb-3 mb-lg-4">
                                <h2><span class="text-gradient">Get in touch</span> with us</h2>
                                <p class="text-secondary">Contact us now, we will be back to you as soon as possible</p>
                            </div>
                            <div class="row mx-0">
                                <div class="col-12 col-md-6 mb-2">
                                    <div class="form-group mb-3 position-relative check-valid">
                                        <div class="input-group input-group-lg">
                                            <span class="input-group-text text-theme-1"><i class="bi bi-person"></i></span>
                                            <div class="form-floating">
                                                <input type="text" placeholder="First Name" value="Max" required class="form-control" />
                                                <label>First Name</label>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="invalid-feedback mb-3">Add valid data</div>
                                </div>
                                <div class="col-12 col-md-6 mb-2">
                                    <div class="form-group mb-3 position-relative check-valid">
                                        <div class="input-group input-group-lg">
                                            <span class="input-group-text text-theme-1"><i class="bi bi-person"></i></span>
                                            <div class="form-floating">
                                                <input type="text" placeholder="Last Name" value="Johnson" required class="form-control" />
                                                <label>last Name</label>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="invalid-feedback mb-3">Add valid data</div>
                                </div>

                                <div class="col-12 col-md-12 mb-2">
                                    <div class="form-group mb-3 position-relative check-valid">
                                        <div class="input-group input-group-lg">
                                            <span class="input-group-text text-theme-1"><i class="bi bi-envelope"></i></span>
                                            <div class="form-floating">
                                                <input type="email" placeholder="Email Address" required class="form-control" />
                                                <label>Email Address</label>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="invalid-feedback mb-3">Add valid data</div>
                                </div>

                                <div class="col-12 col-md-12 mb-2">
                                    <div class="form-group mb-3 position-relative check-valid">
                                        <div class="input-group input-group-lg">
                                            <span class="input-group-text text-theme-1"><i class="bi bi-chat-right-text"></i></span>
                                            <div class="form-floating">
                                                <textarea placeholder="Message" class="form-control h-auto" rows="4"></textarea>
                                                <label>Message</label>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="invalid-feedback mb-3">Add valid data</div>
                                </div>
                            </div>
                            <div class="text-center">
                                <button type="button" class="btn btn-outline-theme">Submit Message</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- quick connect links -->
            <div class="row gx-3 gx-lg-4 justify-content-center text-center mb-3 mb-lg-4">
                <div class="col-12 col-md-8 col-lg-7 col-xl-7 py-3">
                    <h4>There are other ways to get out from all other your trouble to simplify your view and remove confusion.</h4>
                    <p class="text-secondary">Its possible human made mistakes and possibly we may missed it. We are happy to assist you as well as upgrade our system. Do let us know your query, concern and feedback.</p>
                </div>
            </div>

            <div class="row gx-3 gx-lg-4">
                <div class="col-12 col-md-4 col-lg-4">
                    <div class="card adminuiux-card text-center mb-3 mb-lg-4">
                        <div class="card-body p-4">
                            <div class="avatar avatar-80 bg-theme-1-subtle text-theme-1 rounded-circle d-block mx-auto mb-3"><i class="bi bi-person-video3 h2 align-middle"></i><br /></div>
                            <h4>Schedule a Demo</h4>
                            <p class="text-secondary">Get details of features and quick look on how it works. Schedule a demo now.</p>
                            <button class="btn btn-link">Book Demo</button>
                        </div>
                    </div>
                </div>

                <div class="col-12 col-md-4 col-lg-4">
                    <div class="card adminuiux-card text-center mb-3 mb-lg-4">
                        <div class="card-body p-4">
                            <div class="avatar avatar-80 bg-theme-1-subtle text-theme-1 rounded-circle d-block mx-auto mb-3">
                                <i class="bi bi-chat-right-dots h2 align-middle"></i>
                            </div>
                            <h4>Communicate</h4>
                            <p class="text-secondary">You have live assistant with whom you can share your concern & get answered quickly.</p>
                            <button class="btn btn-link">Start Chat</button>
                        </div>
                    </div>
                </div>

                <div class="col-12 col-md-4 col-lg-4">
                    <div class="card adminuiux-card text-center mb-3 mb-lg-4">
                        <div class="card-body p-4">
                            <div class="avatar avatar-80 bg-theme-1-subtle text-theme-1 rounded-circle d-block mx-auto mb-3">
                                <i class="bi bi-life-preserver h2 align-middle"></i>
                            </div>
                            <h4>Get Support</h4>
                            <p class="text-secondary">Connect with our expert by submitting details with photos and documents.</p>
                            <button class="btn btn-link">Raise Ticket</button>
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
                <div class="col-12 col-md-6 col-xl-4 mb-3 mb-lg-4">
                    <h5>General Support</h5>
                    <p class="text-mute">If you have any type of challenges regarding products and would like to get help from us please drop an email at <a href="mailto:info&#64;adminuiux.coms">sales&#64;adminuiux.coms</a></p>
                </div>
            </div>
        </div>
    `,
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class ContactUsComponent {
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
