import { Component, OnInit, AfterViewInit, AfterContentChecked, OnDestroy, ViewChild, ElementRef, CUSTOM_ELEMENTS_SCHEMA } from "@angular/core";
import { RouterLink } from "@angular/router";
import Choices, { ClassNames } from "choices.js";

import { DaterangePickerRangesComponent } from "../../../components/input-fields/daterange-picker/daterange-picker-ranges.component";

@Component({
    selector: "app-statement",
    standalone: true,
    imports: [RouterLink, DaterangePickerRangesComponent],
    template: `
        <!-- page title -->
        <div class="container-fluid py-3">
            <div class="row gx-3 gx-lg-4 align-items-center page-title">
                <div class="col col-sm mb-3 mb-sm-0 order-1">
                    <h5 class="mb-0">Statement</h5>
                    <p class="text-secondary small">Track your Earning & Payment</p>
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
                    <li class="breadcrumb-item bi active" aria-current="page">statement</li>
                </ol>
            </nav>
        </div>

        <!-- content -->
        <div class="container mt-3" id="main-content">
            <div class="row gx-3 gx-lg-4">
                <div class="col-12 col-md-6 col-lg-8 mb-3 mb-lg-4">
                    <div class="card adminuiux-card h-100">
                        <div class="card-header">
                            <h5 class="mb-1">Earnings</h5>
                            <p class="text-secondary">Your sales and earning in last 30 days</p>
                        </div>
                        <div class="card-body pb-0">
                            <div class="row gx-3 gx-lg-4">
                                <div class="col-6 col-md-auto mb-3 mb-mb-4">
                                    <p class="text-secondary mb-1">My Balance</p>
                                    <h4>1254.00 <small class="fs-12">USD</small></h4>
                                </div>
                                <div class="col-6 col-md-auto mb-3 mb-mb-4">
                                    <p class="text-secondary mb-1">Earnings</p>
                                    <h4 class="text-success">+654.00 <small class="fs-12">USD</small></h4>
                                </div>
                                <div class="col-6 col-md-auto mb-3 mb-mb-4">
                                    <p class="text-secondary mb-1">Tax Applied</p>
                                    <h4>0.00 <small class="fs-12">USD</small></h4>
                                </div>
                                <div class="col-6 col-md-auto mb-3 mb-mb-4">
                                    <p class="text-secondary mb-1">Subscription</p>
                                    <h4 class="text-danger">-64.00 <small class="fs-12">USD</small></h4>
                                </div>
                            </div>
                        </div>
                        <div class="card-footer border-top">
                            <p class="text-secondary">Your payout will be processed on March 15, 2022</p>
                        </div>
                    </div>
                </div>
                <div class="col-12 col-md-6 col-lg-4 mb-3 mb-lg-4">
                    <div class="card adminuiux-card shadow-sm">
                        <div class="card-header">
                            <h5>View Report</h5>
                        </div>
                        <div class="card-body">
                            <div class="form-floating mb-3">
                                <select class="form-select" id="floatingSelect" aria-label="Floating label select example">
                                    <option selected>Select Duration</option>
                                    <option value="1">May 2022</option>
                                    <option value="2">April 2022</option>
                                    <option value="3">March 2022</option>
                                </select>
                                <label for="floatingSelect">Select Duration</label>
                            </div>
                            <div class="row gx-3 align-items-end">
                                <div class="col">
                                    <p class="text-secondary mb-1">Download Invoices in</p>
                                    <p>
                                        <a href="" class="btn btn-sm btn-theme theme-red me-1"><i class="bi bi-file-earmark-pdf vm me-1"></i> PDF</a>
                                        <a href="" class="btn btn-sm btn-theme theme-green"><i class="bi bi-table vm me-1"></i> Excel</a>
                                    </p>
                                </div>
                                <div class="col-auto">
                                    <p class="text-secondary">
                                        <a href="" class="btn btn-sm btn-theme"><i class="bi bi-printer vm me-1"></i> Print</a>
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <ul class="nav nav-pills overflow-x-auto w-100 flex-nowrap text-nowrap pb-3 pb-lg-4">
                <li class="nav-item">
                    <a class="nav-link active" aria-current="page">Last 30 days</a>
                </li>
                <li class="nav-item">
                    <a class="nav-link">June 2022</a>
                </li>
                <li class="nav-item">
                    <a class="nav-link">May 2022</a>
                </li>
                <li class="nav-item">
                    <a class="nav-link">April 2022</a>
                </li>
                <li class="nav-item">
                    <a class="nav-link">March 2022</a>
                </li>
            </ul>

            <!-- payout history -->
            <div class="card adminuiux-card overflow-hidden mb-3 mb-lg-4">
                <div class="card-header">
                    <h5 class="fw-medium mb-1">Order statements</h5>
                    <p class="small text-secondary">All the orders and statements are in your Local timezone</p>
                </div>
                <div class="card-body py-0">
                    <table class="table mb-0" id="dataTable">
                        <thead class="bg-theme">
                            <tr>
                                <th>Date</th>
                                <th>Order ID</th>
                                <th>Type</th>
                                <th>Detail</th>
                                <th>Price</th>
                                <th>Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>13 May 2022</td>
                                <td>3059337</td>
                                <td>Transaction Fee</td>
                                <td>Transaction Fee for included payment services charge</td>
                                <td>$5.00</td>
                                <td class="text-danger">$-5.00</td>
                            </tr>
                            <tr>
                                <td>13 May 2022</td>
                                <td>3059337</td>
                                <td>Transaction Fee</td>
                                <td>Transaction Fee for sale IP588000</td>
                                <td>$5.00</td>
                                <td class="text-danger">$-5.00</td>
                            </tr>
                            <tr>
                                <td>13 May 2022</td>
                                <td>3059337</td>
                                <td>Sale</td>
                                <td>
                                    <p class="mb-1">AdminUX HTML web and admin templates</p>
                                    <p class="text-secondary mb-0">Invoice: <a href="">IP588000</a></p>
                                </td>
                                <td>$100.00</td>
                                <td class="text-success">$100.00</td>
                            </tr>
                            <tr>
                                <td>13 May 2022</td>
                                <td>3059337</td>
                                <td>Transaction Fee</td>
                                <td>Transaction Fee for included payment services charge</td>
                                <td>$5.00</td>
                                <td class="text-danger">$-5.00</td>
                            </tr>
                            <tr>
                                <td>13 May 2022</td>
                                <td>3059337</td>
                                <td>Transaction Fee</td>
                                <td>Transaction Fee for sale IP588000</td>
                                <td>$5.00</td>
                                <td class="text-danger">$-5.00</td>
                            </tr>
                            <tr>
                                <td>13 May 2022</td>
                                <td>3059337</td>
                                <td>Sale</td>
                                <td>
                                    <p class="mb-1">AdminUX HTML web and admin templates</p>
                                    <p class="text-secondary">Invoice: <a href="">IP588000</a></p>
                                </td>
                                <td>$100.00</td>
                                <td class="text-success">$100.00</td>
                            </tr>
                            <tr>
                                <td>12 May 2022</td>
                                <td>3059337</td>
                                <td>Transaction Fee</td>
                                <td>Transaction Fee for included payment services charge</td>
                                <td>$5.00</td>
                                <td class="text-danger">$-5.00</td>
                            </tr>
                            <tr>
                                <td>12 May 2022</td>
                                <td>3059337</td>
                                <td>Transaction Fee</td>
                                <td>Transaction Fee for sale IP588000</td>
                                <td>$5.00</td>
                                <td class="text-danger">$-5.00</td>
                            </tr>
                            <tr>
                                <td>12 May 2022</td>
                                <td>3059337</td>
                                <td>Sale</td>
                                <td>
                                    <p class="mb-1">AdminUX HTML web and admin templates</p>
                                    <p class="text-secondary">Invoice: <a href="">IP588000</a></p>
                                </td>
                                <td>$100.00</td>
                                <td class="text-success">$100.00</td>
                            </tr>
                            <tr>
                                <td>11 May 2022</td>
                                <td>3059337</td>
                                <td>Transaction Fee</td>
                                <td>Transaction Fee for included payment services charge</td>
                                <td>$5.00</td>
                                <td class="text-danger">$-5.00</td>
                            </tr>
                            <tr>
                                <td>11 May 2022</td>
                                <td>3059337</td>
                                <td>Transaction Fee</td>
                                <td>Transaction Fee for sale IP588000</td>
                                <td>$5.00</td>
                                <td class="text-danger">$-5.00</td>
                            </tr>
                            <tr>
                                <td>11 May 2022</td>
                                <td>3059337</td>
                                <td>Sale</td>
                                <td>
                                    <p class="mb-1">AdminUX HTML web and admin templates</p>
                                    <p class="text-secondary">Invoice: <a href="">IP588000</a></p>
                                </td>
                                <td>$100.00</td>
                                <td class="text-success">$100.00</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `,
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class StatementComponent {
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
