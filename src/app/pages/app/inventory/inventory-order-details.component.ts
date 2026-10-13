import { Component, OnInit, AfterViewInit, AfterContentChecked, OnDestroy, ViewChild, ElementRef, CUSTOM_ELEMENTS_SCHEMA } from "@angular/core";
import { RouterLink } from "@angular/router";
import Choices, { ClassNames } from "choices.js";

import { DaterangePickerRangesComponent } from "../../../components/input-fields/daterange-picker/daterange-picker-ranges.component";

@Component({
    selector: "app-inventory-order-details",
    standalone: true,
    imports: [RouterLink, DaterangePickerRangesComponent],
    template: `
        <!-- page title -->
        <div class="container-fluid py-3">
            <div class="row gx-3 gx-lg-4 align-items-center page-title">
                <div class="col col-sm mb-3 mb-sm-0 order-1">
                    <h5 class="mb-0">Order Details #ODR115560</h5>
                    <p class="text-secondary small">15 March 2025 06:15:00 AM from Cart</p>
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
                    <li class="breadcrumb-item bi"><a routerLink="/app/inventory-dashboard">Inventory</a></li>
                    <li class="breadcrumb-item bi"><a href="adminux-inventory-orders.html">Orders</a></li>
                    <li class="breadcrumb-item bi active" aria-current="page">Order Details</li>
                </ol>
            </nav>
        </div>

        <!-- content -->
        <div class="container mt-3" id="main-content">
            <div class="row gx-3 gx-lg-4">
                <div class="col-12 col-lg-8 col-xxl-9">
                    <div class="row gx-3 gx-lg-4">
                        <div class="col-12 col-xl-8">
                            <!-- customer -->
                            <div class="card adminuiux-card mb-3 mb-lg-4">
                                <div class="card-body">
                                    <div class="row gx-3 align-items-center flex-nowrap mb-3">
                                        <div class="col-auto">
                                            <div class="avatar avatar-50 rounded bg-theme-1-subtle text-theme-1 theme-blue">
                                                <h5 class="fw-normal">RS</h5>
                                            </div>
                                        </div>
                                        <div class="col maxwidth-200">
                                            <h5 class="mb-0 text-truncated">Roy Smith</h5>
                                            <p class="small text-secondary">Prime Customer</p>
                                        </div>
                                    </div>
                                    <div class="row gx-3 gx-lg-4">
                                        <div class="col-12 col-md-6">
                                            <p class="text-secondary mb-2"><i class="bi bi-cake"></i> 28 Jan 2001, 24 years</p>
                                            <p class="text-secondary mb-2"><i class="bi bi-gender-male"></i> Male</p>
                                        </div>
                                        <div class="col-12 col-md-6">
                                            <p class="text-secondary mb-2"><i class="bi bi-envelope"></i> roy&#64;testgmail.com</p>
                                            <p class="text-secondary mb-2"><i class="bi bi-whatsapp"></i> +820 58023O554A1</p>
                                        </div>
                                    </div>
                                    <button class="btn btn-link"><i class="bi bi-pencil"></i> Edit Customer</button>
                                </div>
                            </div>
                        </div>
                        <div class="col-12 col-xl-4">
                            <!-- address -->
                            <div class="card adminuiux-card mb-3 mb-lg-4">
                                <div class="card-body">
                                    <h6 class="mb-3">Shipping Address</h6>
                                    <p class="text-secondary">Test data 103909 Witamer CR, Niagara Falls, NY 14305,<br />United States</p>
                                    <button class="btn btn-link"><i class="bi bi-pencil"></i> Edit Address</button>
                                </div>
                            </div>
                        </div>
                    </div>
                    <!-- order items-->
                    <div class="card adminuiux-card mb-3 mb-lg-4">
                        <div class="card-body">
                            <h6 class="mb-3">Order (7 Items)</h6>
                            <ul class="list-group adminuiux-list-group mb-0">
                                <li class="list-group-item px-2">
                                    <div class="row gx-3 align-items-center">
                                        <div class="col-auto">
                                            <figure class="avatar avatar-50 coverimg rounded">
                                                <img src="assets/img/adminux/product-5.jpg" alt="" style="display: none;" />
                                            </figure>
                                        </div>
                                        <div class="col-9 col-md-5">
                                            <p class="mb-0 text-truncated">MSSI Laptop demo image</p>
                                            <p class="small text-secondary">ID: RT15246630</p>
                                        </div>
                                        <div class="col col-md-auto ms-md-auto mt-3 mt-md-0">
                                            <div class="row gx-2 increamenter">
                                                <div class="col-auto"><button class="btn btn-sm btn-square btn-theme rounded-circle increamenter-remove">-</button></div>
                                                <div class="col-auto"><input type="number" class="form-control form-control-sm text-center width-50 increamenter-value" placeholder="" value="1" /></div>
                                                <div class="col-auto"><button class="btn btn-sm btn-square btn-theme rounded-circle increamenter-add">+</button></div>
                                            </div>
                                        </div>
                                        <div class="col-auto text-end mt-3 mt-md-0">
                                            <h6 class="mb-0">$ 65.00</h6>
                                            <p class="small text-secondary">1 Item</p>
                                        </div>
                                    </div>
                                </li>
                                <li class="list-group-item px-2">
                                    <div class="row gx-3 align-items-center">
                                        <div class="col-auto">
                                            <figure class="avatar avatar-50 coverimg rounded">
                                                <img src="assets/img/adminux/product-2.jpg" alt="" style="display: none;" />
                                            </figure>
                                        </div>
                                        <div class="col-9 col-md-5">
                                            <p class="mb-0 text-truncated">LeanTime Wrist Watch for Man</p>
                                            <p class="small text-secondary">ID: RT152461850</p>
                                        </div>
                                        <div class="col col-md-auto ms-md-auto mt-3 mt-md-0">
                                            <div class="row gx-2 increamenter">
                                                <div class="col-auto"><button class="btn btn-sm btn-square btn-theme rounded-circle increamenter-remove">-</button></div>
                                                <div class="col-auto"><input type="number" class="form-control form-control-sm text-center width-50 increamenter-value" placeholder="" value="1" /></div>
                                                <div class="col-auto"><button class="btn btn-sm btn-square btn-theme rounded-circle increamenter-add">+</button></div>
                                            </div>
                                        </div>
                                        <div class="col-auto text-end mt-3 mt-md-0">
                                            <h6 class="mb-0">$ 55.00</h6>
                                            <p class="small text-secondary">1 Item</p>
                                        </div>
                                    </div>
                                </li>
                                <li class="list-group-item px-2">
                                    <div class="row gx-3 align-items-center">
                                        <div class="col-auto">
                                            <figure class="avatar avatar-50 coverimg rounded">
                                                <img src="assets/img/adminux/product-3.jpg" alt="" style="display: none;" />
                                            </figure>
                                        </div>
                                        <div class="col-9 col-md-5">
                                            <p class="mb-0 text-truncated">Purfura Perfume Solid Man</p>
                                            <p class="small text-secondary">ID: RT15249630</p>
                                        </div>
                                        <div class="col col-md-auto ms-md-auto mt-3 mt-md-0">
                                            <div class="row gx-2 increamenter">
                                                <div class="col-auto"><button class="btn btn-sm btn-square btn-theme rounded-circle increamenter-remove">-</button></div>
                                                <div class="col-auto"><input type="number" class="form-control form-control-sm text-center width-50 increamenter-value" placeholder="" value="3" /></div>
                                                <div class="col-auto"><button class="btn btn-sm btn-square btn-theme rounded-circle increamenter-add">+</button></div>
                                            </div>
                                        </div>
                                        <div class="col-auto text-end mt-3 mt-md-0">
                                            <h6 class="mb-0">$ 48.00</h6>
                                            <p class="small text-secondary">3 Item</p>
                                        </div>
                                    </div>
                                </li>
                                <li class="list-group-item px-2">
                                    <div class="row gx-3 align-items-center">
                                        <div class="col-auto">
                                            <figure class="avatar avatar-50 coverimg rounded">
                                                <img src="assets/img/adminux/product-4.jpg" alt="" style="display: none;" />
                                            </figure>
                                        </div>
                                        <div class="col-9 col-md-5">
                                            <p class="mb-0 text-truncated">Heat Heater for Room</p>
                                            <p class="small text-secondary">ID: RT15246745</p>
                                        </div>
                                        <div class="col col-md-auto ms-md-auto mt-3 mt-md-0">
                                            <div class="row gx-2 increamenter">
                                                <div class="col-auto"><button class="btn btn-sm btn-square btn-theme rounded-circle increamenter-remove">-</button></div>
                                                <div class="col-auto"><input type="number" class="form-control form-control-sm text-center width-50 increamenter-value" placeholder="" value="3" /></div>
                                                <div class="col-auto"><button class="btn btn-sm btn-square btn-theme rounded-circle increamenter-add">+</button></div>
                                            </div>
                                        </div>
                                        <div class="col-auto text-end mt-3 mt-md-0">
                                            <h6 class="mb-0">$ 63.00</h6>
                                            <p class="small text-secondary">3 Item</p>
                                        </div>
                                    </div>
                                </li>
                            </ul>
                        </div>
                    </div>

                    <!-- order status -->
                    <div class="card adminuiux-card mb-3 mb-lg-4">
                        <div class="card-body">
                            <h6 class="mb-3">Order Status</h6>
                            <ul class="progress-stepbar mb-3 mb-4">
                                <li class="completed"><span>Order Placed</span></li>
                                <li class="stop"><span>Accepted</span></li>
                                <li class=""><span>Ready to Ship</span></li>
                                <li class=" "><span>Shipped</span></li>
                                <li><span>Delivered</span></li>
                            </ul>
                            <div class="table-responsive mb-3">
                                <table class="table dataTable">
                                    <thead>
                                        <tr>
                                            <th>Date</th>
                                            <th>Status</th>
                                            <th>Updated by</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td>26 March 2025 8:00 am</td>
                                            <td>Order Placed</td>
                                            <td>Customer</td>
                                        </tr>
                                        <tr>
                                            <td>26 March 2025 12:00 pm</td>
                                            <td>Order Accepted</td>
                                            <td>Store Owner</td>
                                        </tr>
                                        <tr>
                                            <td>27 March 2025 9:30 am</td>
                                            <td>Ready to Ship</td>
                                            <td>Distributer</td>
                                        </tr>
                                        <tr>
                                            <td>28 March 2025 9:00 pm</td>
                                            <td>Shipping Initiated</td>
                                            <td>Delivery Partner</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                            <div class="row gx-3">
                                <div class="col">
                                    <button class="btn btn-theme"><i class="bi bi-truck"></i> Ready to Ship</button>
                                </div>
                                <div class="col-auto">
                                    <button class="btn btn-link theme-red"><i class="bi bi-arrow-return-left"></i> Return</button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- google map -->
                    <div class="card adminuiux-card mb-3 mb-lg-4">
                        <div class="card-body">
                            <h6 class="mb-2">Shipment Tracking</h6>
                            <p class="text-secondary mb-1">Item pickup scheduled with Delhivaari courier service. Tracking Code: ROK#554623324</p>
                            <p class="text-secondary">Tentative timeline for delivery is 3 days on 20 March 2025</p>
                            <iframe src="https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d788.4385190507815!2d-122.4278138198206!3d37.772364180178094!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e0!3m2!1sen!2sin!4v1712990839970!5m2!1sen!2sin" allowfullscreen="" loading="lazy" referrerpolicy="no-referrer-when-downgrade" class="w-100 height-200 border-0 rounded mb-3"></iframe>
                            <button class="btn btn-theme"><i class="bi bi-qr-code"></i> Send Tracking Code</button>
                        </div>
                    </div>
                </div>
                <div class="col-12 col-lg-4 col-xxl-3">
                    <!-- payment -->
                    <div class="card adminuiux-card mb-3 mb-lg-4">
                        <div class="card-body">
                            <h4 class="mb-1">$261.00</h4>
                            <p><span class="badge badge-light text-bg-success">Paid</span></p>

                            <div class="row gx-3 mb-2">
                                <div class="col">Sub Total</div>
                                <div class="col-auto">$ 270.00</div>
                            </div>
                            <div class="row gx-3 mb-2">
                                <div class="col">Discount</div>
                                <div class="col-auto">$ 10.00</div>
                            </div>
                            <div class="row gx-3 mb-2">
                                <div class="col">Shipping Charge</div>
                                <div class="col-auto">FREE</div>
                            </div>
                            <div class="row gx-3 mb-3 mb-lg-4">
                                <div class="col">Gift Packaging</div>
                                <div class="col-auto">00.00</div>
                            </div>

                            <h6 class="mb-3">Payment details</h6>
                            <p class="text-secondary mb-2">Net Banking:</p>
                            <p class="text-secondary mb-2">AmericaSpice Bank</p>
                            <p class="text-secondary mb-2">A/C No.: 200525XXXXXX5524</p>
                            <p class="text-secondary text-truncated mb-2">Transaction.: FGDFG44G56G4D1G65G4DSG1S6G4G1SGS6G1S</p>
                            <p class=""><span class="badge badge-sm badge-light text-bg-theme-1 theme-blue">Received</span></p>

                            <button class="btn btn-theme theme-green"><i class="bi bi-whatsapp"></i> Invoice</button>
                            <button class="btn btn-light mx-1"><i class="bi bi-envelope"></i> Invoice</button>
                        </div>
                    </div>

                    <!-- chat -->
                    <div class="card adminuiux-card overflow-hidden mb-3 mb-lg-4">
                        <div class="card-body overflow-auto height-dynamic" style="--h-dynamic: 400px">
                            <div class="chat-list">
                                <div class="collapse" id="searchchat">
                                    <div class="mb-3">
                                        <div class="input-group">
                                            <input type="search" class="form-control" placeholder="Search in chat... " value="" /> <button class="btn btn-square btn-theme theme-red" data-bs-toggle="collapse" data-bs-target="#searchchat"><i class="bi bi-x"></i></button>
                                        </div>
                                    </div>
                                </div>
                                <div class="row no-margin left-chat">
                                    <div class="col-12">
                                        <div class="chat-block">
                                            <div class="row gx-3">
                                                <div class="col">
                                                    <p class="small mb-2"><a href="" class="style-none">Alex Smith</a></p>
                                                    <p>Hi!</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="col-12">
                                        <p class="text-secondary small time"><i class="bi bi-check"></i> 9:00 pm</p>
                                    </div>
                                </div>
                                <div class="row no-margin right-chat">
                                    <div class="col-12">
                                        <div class="chat-block">
                                            <div class="row gx-3">
                                                <div class="col">Hi!<br />Yes please tell us your query.</div>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="col-12 text-end">
                                        <p class="text-secondary small time"><i class="bi bi-check"></i> 9:10 pm</p>
                                    </div>
                                </div>
                                <div class="row justify-content-center text-center">
                                    <div class="col-auto text-center">
                                        <div class="alert alert-light small mx-auto py-1 mb-3">26 November 2024</div>
                                    </div>
                                </div>
                                <div class="row no-margin left-chat">
                                    <div class="col-12">
                                        <div class="chat-block">
                                            <div class="row gx-3">
                                                <div class="col">
                                                    <p class="small mb-2"><a href="" class="style-none">Mr. Jack Mario</a></p>
                                                    Adminuiux is amazing and we thank you. How can we buy?
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="col-12">
                                        <p class="text-secondary small time"><i class="bi bi-check-all text-primary"></i> 8:00 pm</p>
                                    </div>
                                </div>
                                <div class="row no-margin right-chat first">
                                    <div class="col-12">
                                        <div class="chat-block">
                                            <div class="row gx-3">
                                                <div class="col">
                                                    <div class="position-relative mb-2 figure">
                                                        <div class="position-absolute end-0 top-0">
                                                            <button class="btn btn-square btn-theme m-2"><i class="bi bi-download"></i></button>
                                                        </div>
                                                        <img src="assets/img/adminux/product-1.jpg" alt="" />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div class="row no-margin right-chat">
                                    <div class="col-12">
                                        <div class="chat-block">
                                            <div class="row gx-3">
                                                <div class="col">Thank you too. You can buy it from preview page and click on buy now.</div>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="col-12 text-end">
                                        <p class="text-secondary small time"><i class="bi bi-check-all text-primary"></i> 8:00 pm</p>
                                    </div>
                                </div>
                                <div class="row justify-content-center text-center">
                                    <div class="col-auto text-center">
                                        <div class="alert alert-light mx-auto py-1 mb-3 small">27 November 2024</div>
                                    </div>
                                </div>
                                <div class="row no-margin left-chat first">
                                    <div class="col-12">
                                        <div class="chat-block">
                                            <div class="row gx-3">
                                                <div class="col">
                                                    <p class="small mb-2"><a href="" class="style-none">Ms. Jully CTO</a></p>
                                                    <div class="position-relative figure">
                                                        <video src="https://adminuiux.com/adminuiux/adminuiux.mp4" controls="" preload="none" class="mb-0"></video>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div class="row no-margin left-chat">
                                    <div class="col-12">
                                        <div class="chat-block">
                                            <div class="row gx-3">
                                                <div class="col">We also love this small presentation.</div>
                                            </div>
                                        </div>
                                        <div class="col-12">
                                            <p class="text-secondary small time"><i class="bi bi-check-all text-primary"></i> 8:00 pm</p>
                                        </div>
                                    </div>
                                </div>
                                <div class="row no-margin right-chat">
                                    <div class="col-12">
                                        <div class="chat-block">
                                            <div class="row gx-3">
                                                <div class="col">
                                                    <p>Ohh... Thats great. Adminuiux is HTML template can be used in various business domains like SAAS, CRM, Content Management, Manufacturing, inventory, IT, administration etc.</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="col-12 text-end">
                                        <p class="text-secondary small time"><i class="bi bi-check-all text-primary"></i> 8:00 pm</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="card-footer bg-none">
                            <div class="input-group">
                                <button class="btn btn-square btn-link rounded-circle"><i class="bi bi-paperclip"></i></button>
                                <input class="form-control border-0 rounded mx-2" placeholder="Type your message... " value="" />
                                <button class="btn btn-square btn-link rounded-circle" type="button"><i class="bi bi-send"></i></button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `,
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class InventoryOrderDetailsComponent {
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
