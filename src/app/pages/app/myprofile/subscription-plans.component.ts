import { Component, OnInit, AfterViewInit, AfterContentChecked, OnDestroy, ViewChild, ElementRef, CUSTOM_ELEMENTS_SCHEMA } from "@angular/core";
import { RouterLink } from "@angular/router";
import Choices, { ClassNames } from "choices.js";

import { DaterangePickerRangesComponent } from "../../../components/input-fields/daterange-picker/daterange-picker-ranges.component";

@Component({
    selector: "app-subscription-plans",
    standalone: true,
    imports: [RouterLink, DaterangePickerRangesComponent],
    template: `
        <!-- page title -->
        <div class="container-fluid py-3">
            <div class="row gx-3 gx-lg-4 align-items-center page-title">
                <div class="col col-sm mb-3 mb-sm-0 order-1">
                    <h5 class="mb-0">Subscription Plans</h5>
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
                    <li class="breadcrumb-item bi"><a routerLink="/app/subscription"> Subscription</a></li>
                    <li class="breadcrumb-item bi active" aria-current="page">Plans</li>
                </ol>
            </nav>
        </div>

        <!-- content -->
        <div class="container mt-3" id="main-content">
            <div class="row gx-3 gx-lg-4">
                <div class="col-12 col-md-6 col-lg-4">
                    <div class="card adminuiux-card mb-3 mb-lg-4">
                        <div class="card-body px-xl-4">
                            <div class="text-center mb-4">
                                <span class="badge badge-light text-bg-success">Active</span>
                            </div>
                            <div class="row mb-4">
                                <div class="col-auto">
                                    <i class="avatar avatar-60 rounded bg-theme-1-subtle text-theme-1 h4 bi bi-person vm"></i>
                                </div>
                                <div class="col">
                                    <h4>Personal</h4>
                                    <p class="text-secondary">Perfect for the individuals</p>
                                </div>
                            </div>
                            <div class="row align-items-center mb-4">
                                <div class="col-auto">
                                    <h1 class="display-4"><span class="text-secondary">$</span>50</h1>
                                </div>
                                <div class="col">
                                    <p class="text-secondary">per license</p>
                                </div>
                            </div>
                            <h6>Basic includes:</h6>
                            <ul class="list-group adminuiux-list-group">
                                <li class="list-group-item text-secondary"><i class="bi bi-check-circle vm me-1"></i> All demo access</li>
                                <li class="list-group-item text-secondary"><i class="bi bi-check-circle vm me-1"></i> Unlimited Download</li>
                                <li class="list-group-item text-secondary"><i class="bi bi-check-circle vm me-1"></i> No Contact list</li>
                                <li class="list-group-item text-secondary"><i class="bi bi-check-circle vm me-1"></i> 10 transactions per day</li>
                                <li class="list-group-item text-secondary"><i class="bi bi-check-circle vm me-1"></i> 24/7 Customer Support</li>
                            </ul>
                        </div>
                        <div class="card-footer text-center">
                            <button class="btn btn-theme">Buy Now!</button>
                        </div>
                    </div>
                </div>
                <div class="col-12 col-md-6 col-lg-4">
                    <div class="card adminuiux-card bg-l-gradient-light border border-theme-1 mb-3 mb-lg-4">
                        <div class="card-body px-xl-4">
                            <div class="text-center mb-4">
                                <span class="badge badge-light text-bg-theme-1">Recommended</span>
                            </div>
                            <div class="row mb-4">
                                <div class="col-auto">
                                    <i class="avatar avatar-60 rounded bg-theme-1-subtle text-theme-1 h4 bi bi-people vm"></i>
                                </div>
                                <div class="col">
                                    <h4 class="mb-1">Business</h4>
                                    <p class="text-secondary">Multiple team &amp; customer</p>
                                </div>
                            </div>
                            <div class="row align-items-center mb-4">
                                <div class="col-auto">
                                    <h1 class="display-4"><span class="text-secondary">$</span>100</h1>
                                </div>
                                <div class="col">
                                    <p class="text-secondary">per license</p>
                                </div>
                            </div>
                            <h6>Basic includes:</h6>
                            <ul class="list-group adminuiux-list-group">
                                <li class="list-group-item text-secondary"><i class="bi bi-check-circle vm me-1"></i> All demo access</li>
                                <li class="list-group-item text-secondary"><i class="bi bi-check-circle vm me-1"></i> Unlimited Download</li>
                                <li class="list-group-item text-secondary"><i class="bi bi-check-circle vm me-1"></i> No Contact list</li>
                                <li class="list-group-item text-secondary"><i class="bi bi-check-circle vm me-1"></i> 10 transactions per day</li>
                                <li class="list-group-item text-secondary"><i class="bi bi-check-circle vm me-1"></i> 24/7 Customer Support</li>
                            </ul>
                        </div>
                        <div class="card-footer text-center">
                            <button class="btn btn-theme">Buy Now!</button>
                        </div>
                    </div>
                </div>
                <div class="col-12 col-md-6 col-lg-4">
                    <div class="card adminuiux-card mb-3 mb-lg-4 bg-theme-1">
                        <div class="card-body px-xl-4">
                            <div class="text-center mb-4">
                                <span class="badge badge-light bg-white-opacity">Best</span>
                            </div>
                            <div class="row mb-4">
                                <div class="col-auto">
                                    <i class="avatar avatar-60 rounded bg-theme-1-subtle text-theme-1 h4 bi bi-building vm"></i>
                                </div>
                                <div class="col">
                                    <h4 class="mb-1">Ultra Pro</h4>
                                    <p class="opacity-75">Multiple Application</p>
                                </div>
                            </div>
                            <div class="row align-items-center mb-4">
                                <div class="col-auto">
                                    <h1 class="display-4"><span class="opacity-75">$</span>150</h1>
                                </div>
                                <div class="col">
                                    <p class="opacity-75">per license</p>
                                </div>
                            </div>
                            <h6>Basic includes:</h6>
                            <ul class="list-group adminuiux-list-group">
                                <li class="list-group-item text-white"><i class="bi bi-check-circle vm me-1"></i> All demo access</li>
                                <li class="list-group-item text-white"><i class="bi bi-check-circle vm me-1"></i> Unlimited Download</li>
                                <li class="list-group-item text-white"><i class="bi bi-check-circle vm me-1"></i> No Contact list</li>
                                <li class="list-group-item text-white"><i class="bi bi-check-circle vm me-1"></i> 10 transactions per day</li>
                                <li class="list-group-item text-white"><i class="bi bi-check-circle vm me-1"></i> 24/7 Customer Support</li>
                            </ul>
                        </div>
                        <div class="card-footer bg-none text-center">
                            <button class="btn btn-light">Buy Now!</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `,
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class SubscriptionPlansComponent {
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
