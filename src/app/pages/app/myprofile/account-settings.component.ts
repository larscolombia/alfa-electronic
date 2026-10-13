import { Component, OnInit, AfterViewInit, AfterContentChecked, OnDestroy, ViewChild, ElementRef, CUSTOM_ELEMENTS_SCHEMA } from "@angular/core";
import { RouterLink } from "@angular/router";
import Choices, { ClassNames } from "choices.js";
import Swiper from "swiper";
import { register } from "swiper/element/bundle";
register();
import { DaterangePickerRangesComponent } from "../../../components/input-fields/daterange-picker/daterange-picker-ranges.component";

@Component({
    selector: "app-account-settings",
    standalone: true,
    imports: [RouterLink, DaterangePickerRangesComponent],
    template: `
        <!-- page title -->
        <div class="container-fluid py-3">
            <div class="row gx-3 gx-lg-4 align-items-center page-title">
                <div class="col col-sm mb-3 mb-sm-0 order-1">
                    <h5 class="mb-0">Account Settings</h5>
                    <p class="text-secondary small">Make sure your profile is updated</p>
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
                    <li class="breadcrumb-item bi active" aria-current="page">Account Settings</li>
                </ol>
            </nav>
        </div>

        <!-- content -->
        <div class="container mt-3" id="main-content">
            <ul class="nav nav-pills overflow-x-auto w-100 text-nowrap flex-nowrap pb-3" id="myTab" role="tablist">
                <li class="nav-item" role="presentation">
                    <button class="nav-link active" id="personal-tab" data-bs-toggle="tab" data-bs-target="#personal" type="button" role="tab" aria-controls="personal" aria-selected="true">Personal</button>
                </li>
                <li class="nav-item" role="presentation">
                    <button class="nav-link" id="profile-tab" data-bs-toggle="tab" data-bs-target="#profile" type="button" role="tab" aria-controls="profile" aria-selected="false">Profile</button>
                </li>
                <li class="nav-item" role="presentation">
                    <button class="nav-link" id="payment-tab" data-bs-toggle="tab" data-bs-target="#payment" type="button" role="tab" aria-controls="payment" aria-selected="false">Payments</button>
                </li>
                <li class="nav-item" role="presentation">
                    <button class="nav-link" id="emailsocials-tab" data-bs-toggle="tab" data-bs-target="#emailsocials" type="button" role="tab" aria-controls="emailsocials" aria-selected="false">Email & Socials</button>
                </li>
                <li class="nav-item" role="presentation">
                    <button class="nav-link" id="taxinfo-tab" data-bs-toggle="tab" data-bs-target="#taxinfo" type="button" role="tab" aria-controls="taxinfo" aria-selected="false">Tax Information</button>
                </li>
            </ul>
            <div class="tab-content" id="myTabContent">
                <!-- personal info tab-->
                <div class="tab-pane fade show active" id="personal" role="tabpanel" aria-labelledby="personal-tab">
                    <div class="card adminuiux-card mb-3 mb-lg-4">
                        <div class="card-body">
                            <div class="">
                                <figure class="coverimg w-100 height-240 mb-0 position-relative rounded mb-3">
                                    <div class="position-absolute top-0 end-0 m-3">
                                        <input type="file" class="form-control d-none" />
                                        <button class="btn btn-theme" onclick="this.previousElementSibling.click()"><i class="bi bi-camera"></i> Change Cover</button>
                                    </div>
                                    <img src="assets/img/background-image/backgorund-image-3.jpg" class="mw-100" alt="" />
                                </figure>
                                <div class="row gx-3 gx-lg-4 align-items-start justify-content-center mt--100 mb-3">
                                    <div class="col-auto position-relative">
                                        <figure class="avatar avatar-160 coverimg rounded-circle shadow-md border border-4 border-theme-1">
                                            <img src="assets/img/modern-ai-image/user-1.jpg" alt="" />
                                        </figure>
                                        <div class="position-absolute bottom-0 end-0 z-index-1 me-3 mb-1 h-auto">
                                            <input type="file" class="form-control d-none" />
                                            <button class="btn btn-theme btn-square shadow-sm rounded-circle" onclick="this.previousElementSibling.click()"><i class="bi bi-camera"></i></button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <h6 class="mb-3 mb-lg-4">Basic Details</h6>
                            <div class="row gx-3 gx-lg-4 mb-3">
                                <div class="col-12 col-md-6 col-lg-4">
                                    <div class="form-group mb-3 position-relative check-valid">
                                        <div class="form-floating">
                                            <input type="text" placeholder="First Name" value="Adminuiux" required class="form-control" />
                                            <label>First Name</label>
                                        </div>
                                    </div>
                                    <div class="invalid-feedback">Please enter valid input</div>
                                </div>
                                <div class="col-12 col-md-6 col-lg-4">
                                    <div class="form-group mb-3 position-relative check-valid">
                                        <div class="form-floating">
                                            <input type="text" placeholder="Last Name" value="" required class="form-control" />
                                            <label>Last Name</label>
                                        </div>
                                    </div>
                                    <div class="invalid-feedback">Please enter valid input</div>
                                </div>
                                <div class="col-12 col-md-6 col-lg-4">
                                    <div class="form-group mb-3 position-relative check-valid">
                                        <div class="form-floating">
                                            <input type="email" placeholder="Email Address" value="guest&#64;adminuiux.com" disabled required class="form-control" />
                                            <label>Email Address</label>
                                        </div>
                                    </div>
                                    <div class="invalid-feedback mb-3">Add .com at last to insert valid data</div>
                                </div>
                            </div>

                            <h6 class="mb-3 mb-lg-4">Address Details</h6>
                            <div class="row mb-3">
                                <div class="col-12 col-md-6 col-lg-4">
                                    <div class="form-group mb-3 position-relative check-valid">
                                        <div class="form-floating">
                                            <input type="text" placeholder="Address Line 1" value="" required class="form-control" />
                                            <label>Address Line 1</label>
                                        </div>
                                    </div>
                                    <div class="invalid-feedback">Please enter valid input</div>
                                </div>
                                <div class="col-12 col-md-6 col-lg-4">
                                    <div class="form-group mb-3 position-relative check-valid">
                                        <div class="form-floating">
                                            <input type="email" placeholder="Address Line 2" required class="form-control" />
                                            <label>Address Line 2</label>
                                        </div>
                                    </div>
                                    <div class="invalid-feedback mb-3">Add insert valid data</div>
                                </div>
                                <div class="col-12 col-md-6 col-lg-4">
                                    <div class="form-group mb-3 position-relative check-valid">
                                        <div class="form-floating">
                                            <input type="text" placeholder="Landmark" required class="form-control" />
                                            <label>Landmark</label>
                                        </div>
                                    </div>
                                    <div class="invalid-feedback">Please enter valid input</div>
                                </div>
                                <div class="col-12 col-md-6 col-lg-4">
                                    <div class="form-group mb-3 position-relative check-valid">
                                        <div class="form-floating">
                                            <input type="email" placeholder="Street" required class="form-control" />
                                            <label>Street</label>
                                        </div>
                                    </div>
                                    <div class="invalid-feedback mb-3">Add insert valid data</div>
                                </div>
                                <div class="col-12 col-md-6 col-lg-4">
                                    <div class="form-group mb-3 position-relative check-valid">
                                        <div class="form-floating">
                                            <input type="text" placeholder="Country" value="" required class="form-control" />
                                            <label>Country</label>
                                        </div>
                                    </div>
                                    <div class="invalid-feedback">Please enter valid input</div>
                                </div>
                                <div class="col-12 col-md-6 col-lg-4">
                                    <div class="form-group mb-3 position-relative check-valid">
                                        <div class="form-floating">
                                            <input type="text" placeholder="Pincode" value="" required class="form-control" />
                                            <label>Pincode</label>
                                        </div>
                                    </div>
                                    <div class="invalid-feedback">Please enter valid input</div>
                                </div>
                                <div class="col-12 col-md-6 col-lg-4">
                                    <div class="form-group mb-3 position-relative check-valid">
                                        <div class="form-floating">
                                            <input type="text" placeholder="State" value="" required class="form-control" />
                                            <label>State</label>
                                        </div>
                                    </div>
                                    <div class="invalid-feedback">Please enter valid input</div>
                                </div>
                                <div class="col-12 col-md-6 col-lg-4">
                                    <div class="form-group mb-3 position-relative check-valid">
                                        <div class="form-floating">
                                            <input type="text" placeholder="City" value="" required class="form-control" />
                                            <label>City</label>
                                        </div>
                                    </div>
                                    <div class="invalid-feedback">Please enter valid input</div>
                                </div>
                            </div>

                            <h6 class="mb-3 mb-lg-4">Company Details</h6>
                            <div class="row mb-3">
                                <div class="col-12 col-md-6 col-lg-4">
                                    <div class="form-group mb-3 position-relative check-valid">
                                        <div class="form-floating">
                                            <input type="text" placeholder="Company name" value="" required class="form-control" />
                                            <label>Company name</label>
                                        </div>
                                    </div>
                                    <div class="invalid-feedback">Please enter valid input</div>
                                </div>
                                <div class="col-12 col-md-6 col-lg-4">
                                    <div class="form-group mb-3 position-relative check-valid">
                                        <div class="form-floating">
                                            <input type="email" placeholder="Company Registration" required class="form-control" />
                                            <label>Company Registration</label>
                                        </div>
                                    </div>
                                    <div class="invalid-feedback mb-3">Add insert valid data</div>
                                </div>
                                <div class="col-12 col-md-6 col-lg-4">
                                    <div class="form-group mb-3 position-relative check-valid">
                                        <div class="form-floating">
                                            <input type="email" placeholder="Company ID" required class="form-control" />
                                            <label>Company ID</label>
                                        </div>
                                    </div>
                                    <div class="invalid-feedback mb-3">Add insert valid data</div>
                                </div>

                                <div class="col-12 col-md-6 col-lg-4">
                                    <div class="form-group mb-3 position-relative check-valid">
                                        <div class="form-floating">
                                            <input type="text" placeholder="Address Line 1" value="" required class="form-control" />
                                            <label>Address Line 1</label>
                                        </div>
                                    </div>
                                    <div class="invalid-feedback">Please enter valid input</div>
                                </div>
                                <div class="col-12 col-md-6 col-lg-4">
                                    <div class="form-group mb-3 position-relative check-valid">
                                        <div class="form-floating">
                                            <input type="email" placeholder="Address Line 2" required class="form-control" />
                                            <label>Address Line 2</label>
                                        </div>
                                    </div>
                                    <div class="invalid-feedback mb-3">Add insert valid data</div>
                                </div>

                                <div class="col-12 col-md-6 col-lg-4">
                                    <div class="form-group mb-3 position-relative check-valid">
                                        <div class="form-floating">
                                            <input type="text" placeholder="Landmark" required class="form-control" />
                                            <label>Landmark</label>
                                        </div>
                                    </div>
                                    <div class="invalid-feedback">Please enter valid input</div>
                                </div>
                                <div class="col-12 col-md-6 col-lg-4">
                                    <div class="form-group mb-3 position-relative check-valid">
                                        <div class="form-floating">
                                            <input type="email" placeholder="Street" required class="form-control" />
                                            <label>Street</label>
                                        </div>
                                    </div>
                                    <div class="invalid-feedback mb-3">Add insert valid data</div>
                                </div>
                                <div class="col-12 col-md-6 col-lg-4">
                                    <div class="form-group mb-3 position-relative check-valid">
                                        <div class="form-floating">
                                            <input type="text" placeholder="Country" value="" required class="form-control" />
                                            <label>Country</label>
                                        </div>
                                    </div>
                                    <div class="invalid-feedback">Please enter valid input</div>
                                </div>
                                <div class="col-12 col-md-6 col-lg-4">
                                    <div class="form-group mb-3 position-relative check-valid">
                                        <div class="form-floating">
                                            <input type="text" placeholder="Pincode" value="" required class="form-control" />
                                            <label>Pincode</label>
                                        </div>
                                    </div>
                                    <div class="invalid-feedback">Please enter valid input</div>
                                </div>
                                <div class="col-12 col-md-6 col-lg-4">
                                    <div class="form-group mb-3 position-relative check-valid">
                                        <div class="form-floating">
                                            <input type="text" placeholder="State" value="" required class="form-control" />
                                            <label>State</label>
                                        </div>
                                    </div>
                                    <div class="invalid-feedback">Please enter valid input</div>
                                </div>
                                <div class="col-12 col-md-6 col-lg-4">
                                    <div class="form-group mb-3 position-relative check-valid">
                                        <div class="form-floating">
                                            <input type="text" placeholder="City" value="" required class="form-control" />
                                            <label>City</label>
                                        </div>
                                    </div>
                                    <div class="invalid-feedback">Please enter valid input</div>
                                </div>
                            </div>

                            <div class="row gx-3">
                                <div class="col">
                                    <!-- submit button -->
                                    <button class="btn btn-theme" type="button">Submit</button>
                                </div>
                                <div class="col-auto">
                                    <button class="btn btn-link theme-red" type="button">Cancel</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- profile tab-->
                <div class="tab-pane fade" id="profile" role="tabpanel" aria-labelledby="profile-tab">
                    <div class="card adminuiux-card mb-3 mb-lg-4">
                        <div class="card-body">
                            <h6 class="mb-3 mb-lg-4">Company details</h6>
                            <div class="row gx-3 gx-lg-4 justify-content-center align-items-center mb-3 mb-lg-4">
                                <div class="col-12 col-md-6 col-lg-4">
                                    <div class="row gx-3 align-items-center">
                                        <div class="col-auto">
                                            <div class="avatar avatar-100 text-center rounded">
                                                <img src="assets/img/logo-512.png" alt="" class="mw-100" id="companylogolight" />
                                            </div>
                                        </div>
                                        <div class="col">
                                            <div>
                                                <label for="companylogolightinput" class="form-label">Upload company logo (Light layout)</label><br />
                                                <input class="form-control d-none" accept="image/*" type="file" id="companylogolightinput" />
                                                <button class="btn btn-theme" onclick="this.previousElementSibling.click()"><i class="bi bi-camera"></i> Upload</button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-12 col-md-6 col-lg-4">
                                    <div class="form-group my-2 position-relative check-valid">
                                        <div class="form-floating">
                                            <input type="text" placeholder="Company Name" value="AdminUX" required class="form-control" />
                                            <label>Company Name</label>
                                        </div>
                                    </div>
                                    <div class="invalid-feedback">Please enter valid input</div>
                                </div>
                                <div class="col-12 col-md-6 col-lg-4">
                                    <div class="form-group my-2 position-relative check-valid">
                                        <div class="form-floating">
                                            <input type="text" placeholder="Company Tagline" value="Admin app UI" required class="form-control" />
                                            <label>Company Tagline</label>
                                        </div>
                                    </div>
                                    <div class="invalid-feedback">Please enter valid input</div>
                                </div>
                            </div>
                            <h6 class="mb-3 mb-lg-4">Profile details</h6>
                            <div class="row gx-3 gx-lg-4 mb-3">
                                <div class="col-12 col-md-6 col-lg-4">
                                    <div class="form-group mb-3 position-relative check-valid">
                                        <div class="form-floating">
                                            <input type="text" placeholder="UserName" value="Adminuiux" required class="form-control" />
                                            <label>UserName</label>
                                        </div>
                                    </div>
                                    <div class="invalid-feedback">Please enter valid input</div>
                                </div>
                                <div class="col-12 col-md-6 col-lg-8">
                                    <div class="form-group mb-3 position-relative check-valid">
                                        <div class="form-floating">
                                            <input type="text" placeholder="Tagline" value="" required class="form-control" />
                                            <label>Tagline</label>
                                        </div>
                                    </div>
                                    <div class="invalid-feedback">Please enter valid input</div>
                                </div>
                                <div class="col-12">
                                    <div class="form-group mb-3 position-relative check-valid">
                                        <div class="form-floating">
                                            <input type="text" placeholder="Headline" value="" required class="form-control" />
                                            <label>Headline</label>
                                        </div>
                                    </div>
                                    <div class="invalid-feedback">Please enter valid input</div>
                                </div>
                                <div class="col-12">
                                    <div class="form-group mb-3 position-relative check-valid">
                                        <div class="form-floating">
                                            <textarea placeholder="About me" rows="5" class="form-control h-auto"></textarea>
                                            <label>About me</label>
                                        </div>
                                    </div>
                                    <div class="invalid-feedback">Please enter valid input</div>
                                </div>
                            </div>
                            <h6 class="mb-3 mb-lg-4">Public Visibility</h6>
                            <div class="row mb-3 mb-lg-4">
                                <div class="col-12 col-md-6 col-lg-4 col-xl-3">
                                    <div class="form-check form-switch">
                                        <input class="form-check-input" type="checkbox" id="profileswitch1" checked />
                                        <label class="form-check-label" for="profileswitch1">Show my profile publicly</label>
                                    </div>
                                </div>
                                <div class="col-12 col-md-6 col-lg-4 col-xl-3">
                                    <div class="form-check form-switch">
                                        <input class="form-check-input" type="checkbox" id="profileswitch2" checked />
                                        <label class="form-check-label" for="profileswitch2">Show my availability</label>
                                    </div>
                                </div>
                                <div class="col-12 col-md-6 col-lg-4 col-xl-3">
                                    <div class="form-check form-switch">
                                        <input class="form-check-input" type="checkbox" id="profileswitch3" />
                                        <label class="form-check-label" for="profileswitch3">Show tagline in profile</label>
                                    </div>
                                </div>
                                <div class="col-12 col-md-6 col-lg-4 col-xl-3">
                                    <div class="form-check form-switch">
                                        <input class="form-check-input" type="checkbox" id="profileswitch4" />
                                        <label class="form-check-label" for="profileswitch4">Make profile inactive</label>
                                    </div>
                                </div>
                            </div>

                            <div class="row gx-3">
                                <div class="col">
                                    <!-- submit button -->
                                    <button class="btn btn-theme" type="button">Submit</button>
                                </div>
                                <div class="col-auto">
                                    <button class="btn btn-link theme-red" type="button">Cancel</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- payment tab-->
                <div class="tab-pane fade" id="payment" role="tabpanel" aria-labelledby="payment-tab">
                    <div class="card adminuiux-card mb-3 mb-lg-4">
                        <div class="card-body overflow-hidden">
                            <div class="collapse show" id="addcard">
                                <div class="card adminuiux-card border border-theme-1 bg-l-gradient-light theme-blue mb-3">
                                    <div class="card-header">
                                        <h6>Add new card</h6>
                                    </div>
                                    <div class="card-body">
                                        <div class="row gx-3">
                                            <div class="col-12 col-md-6 col-lg-4">
                                                <div class="row mb-3">
                                                    <div class="col-7">
                                                        <div class="form-group position-relative check-valid">
                                                            <div class="form-floating">
                                                                <input type="text" placeholder="Card Number" value="" required class="form-control" />
                                                                <label>Card Number</label>
                                                            </div>
                                                        </div>
                                                        <div class="invalid-feedback">Please enter valid input</div>
                                                    </div>
                                                    <div class="col-5">
                                                        <div class="form-group position-relative check-valid">
                                                            <div class="form-floating">
                                                                <input type="text" placeholder="Code" value="205" required class="form-control" />
                                                                <label>Code</label>
                                                            </div>
                                                        </div>
                                                        <div class="invalid-feedback">Please enter valid input</div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div class="col-12 col-md-6 col-lg-4">
                                                <div class="row mb-3">
                                                    <div class="col-7">
                                                        <div class="form-group position-relative check-valid">
                                                            <div class="form-floating">
                                                                <select class="form-control">
                                                                    <option selected>January</option>
                                                                    <option>February</option>
                                                                    <option>March</option>
                                                                    <option>April</option>
                                                                    <option>May</option>
                                                                    <option>June</option>
                                                                    <option>July</option>
                                                                    <option>August</option>
                                                                    <option>September</option>
                                                                    <option>October</option>
                                                                    <option>November</option>
                                                                    <option>December</option>
                                                                </select>
                                                                <label>Expiry month</label>
                                                            </div>
                                                        </div>
                                                        <div class="invalid-feedback">Please enter valid input</div>
                                                    </div>
                                                    <div class="col-5">
                                                        <div class="form-group position-relative check-valid">
                                                            <div class="form-floating">
                                                                <select class="form-control">
                                                                    <option selected>2022</option>
                                                                    <option>2023</option>
                                                                    <option>2024</option>
                                                                    <option>2025</option>
                                                                    <option>2026</option>
                                                                    <option>2027</option>
                                                                    <option>2028</option>
                                                                    <option>2029</option>
                                                                </select>
                                                                <label>Expiry year</label>
                                                            </div>
                                                        </div>
                                                        <div class="invalid-feedback">Please enter valid input</div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div class="col-12 col-md-6 col-lg-4">
                                                <div class="form-group position-relative check-valid">
                                                    <div class="form-floating">
                                                        <input type="text" placeholder="Card Holder" required class="form-control" />
                                                        <label>Card Holder</label>
                                                    </div>
                                                </div>
                                                <div class="invalid-feedback">Please enter valid input</div>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="card-footer">
                                        <button class="btn btn-theme" type="button">Add Card</button>
                                        <button class="btn btn-white ms-1" type="button" data-bs-toggle="collapse" data-bs-target="#addcard">Cancel</button>
                                    </div>
                                </div>
                            </div>

                            <div class="mb-3 mb-lg-4">
                                <div class="row gx-3 align-items-center">
                                    <div class="col">
                                        <h6>My cards</h6>
                                    </div>
                                    <div class="col-auto">
                                        <button class="btn btn-sm btn-link" type="button" data-bs-toggle="collapse" data-bs-target="#addcard" aria-expanded="true" aria-controls="addcard"><i class="bi bi-plus"></i> Add Card</button>
                                    </div>
                                </div>
                            </div>
                            <!-- Credit cards carousel card -->
                            <swiper-container slides-per-view="auto" space-between="16" autoplay="true" class="swiper swipernav overflow-visible">
                                <swiper-slide class="width-240">
                                    <div class="card adminuiux-card mb-2 theme-blue bg-theme-r-gradient overflow-hidden">
                                        <div class="coverimg top-0 start-0 h-100 w-100 position-absolute z-index-0 opacity-25">
                                            <img src="assets/img/modern-ai-image/peacoke-2.jpg" alt="" style="display: none;" />
                                        </div>
                                        <div class="card-body position-relative z-index-1">
                                            <div class="row gx-3 align-items-center mb-4">
                                                <div class="col-auto align-self-center">
                                                    <i class="bi bi-amazon fs-4"></i>
                                                </div>
                                                <div class="col text-end">
                                                    <p class="fs-12">
                                                        <span class="opacity-50 small">City Bank</span><br />
                                                        <span class="">Credit Card</span>
                                                    </p>
                                                </div>
                                            </div>
                                            <p class="fw-medium h6 mb-3">000 0000 0001 546598</p>
                                            <div class="row gx-3 gx-lg-4">
                                                <div class="col-auto fs-12">
                                                    <p class="mb-0 opacity-50 small">Expiry</p>
                                                    <p>09/023</p>
                                                </div>
                                                <div class="col text-end fs-12">
                                                    <p class="mb-0 opacity-50 small">Card Holder</p>
                                                    <p>AdminUIUX</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="row gx-3 mb-3">
                                        <div class="col">
                                            <p class="opacity-50 small mb-1">Expense</p>
                                            <h6>
                                                1500.00 <small class="text-success">18.0% <i class="bi bi-arrow-up"></i></small>
                                            </h6>
                                        </div>
                                        <div class="col-auto text-end">
                                            <p class="opacity-50 small mb-1">Limit Remain</p>
                                            <h6>13500.00</h6>
                                        </div>
                                    </div>
                                    <div class="list-group list-group-flush border-0 bg-transparent">
                                        <a href="" class="list-group-item">
                                            <div class="row gx-3">
                                                <div class="col-auto align-self-center">
                                                    <figure class="avatar avatar-40 rounded-circle coverimg vm">
                                                        <img src="assets/img/modern-ai-image/user-4.jpg" alt="" style="display: none;" />
                                                    </figure>
                                                </div>
                                                <div class="col px-0 align-self-center">
                                                    <p class="mb-0">David Warner</p>
                                                    <p class="small text-secondary">$ 410.00</p>
                                                </div>
                                                <div class="col-auto ps-0 align-self-center">
                                                    <i class="bi bi-chevron-right text-muted small vm"></i>
                                                </div>
                                            </div>
                                        </a>
                                        <a href="" class="list-group-item">
                                            <div class="row gx-3">
                                                <div class="col-auto align-self-center">
                                                    <figure class="avatar avatar-40 rounded-circle coverimg vm">
                                                        <img src="assets/img/modern-ai-image/user-3.jpg" alt="" style="display: none;" />
                                                    </figure>
                                                </div>
                                                <div class="col px-0 align-self-center">
                                                    <p class="mb-0">Shelvey Doe</p>
                                                    <p class="small text-secondary">$ 180.00</p>
                                                </div>
                                                <div class="col-auto ps-0 align-self-center">
                                                    <i class="bi bi-chevron-right text-muted small vm"></i>
                                                </div>
                                            </div>
                                        </a>
                                    </div>
                                </swiper-slide>
                                <swiper-slide class="width-240">
                                    <div class="card adminuiux-card theme-pink bg-theme-r-gradient mb-2 overflow-hidden">
                                        <div class="coverimg top-0 start-0 h-100 w-100 position-absolute z-index-0 opacity-25">
                                            <img src="assets/img/modern-ai-image/flamingo-2.jpg" alt="" style="display: none;" />
                                        </div>
                                        <div class="card-body position-relative z-index-1">
                                            <div class="row gx-3 align-items-center mb-4">
                                                <div class="col-auto align-self-center">
                                                    <i class="bi bi-apple fs-4"></i>
                                                </div>
                                                <div class="col text-end">
                                                    <p class="fs-12">
                                                        <span class="opacity-50 small">City Bank</span><br />
                                                        <span class="">Credit Card</span>
                                                    </p>
                                                </div>
                                            </div>
                                            <p class="fw-medium h6 mb-3">000 0000 0001 546598</p>
                                            <div class="row gx-3 gx-lg-4">
                                                <div class="col-auto fs-12">
                                                    <p class="mb-0 opacity-50 small">Expiry</p>
                                                    <p>09/023</p>
                                                </div>
                                                <div class="col text-end fs-12">
                                                    <p class="mb-0 opacity-50 small">Card Holder</p>
                                                    <p>AdminUIUX</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="row gx-3 mb-3">
                                        <div class="col">
                                            <p class="text-secondary small mb-1">Expense</p>
                                            <h6>
                                                3650.00 <small class="text-danger">11.0% <i class="bi bi-arrow-down"></i></small>
                                            </h6>
                                        </div>
                                        <div class="col-auto text-end">
                                            <p class="text-secondary small mb-1">Limit Remain</p>
                                            <h6>35500.00</h6>
                                        </div>
                                    </div>
                                    <ul class="list-group list-group-flush border-0 bg-transparent">
                                        <li class="list-group-item">
                                            <div class="row gx-3">
                                                <div class="col-auto align-self-center">
                                                    <figure class="avatar avatar-40 rounded-circle coverimg vm">
                                                        <img src="assets/img/modern-ai-image/user-4.jpg" alt="" style="display: none;" />
                                                    </figure>
                                                </div>
                                                <div class="col px-0 align-self-center">
                                                    <p class="mb-0">David Warner</p>
                                                    <p class="small text-secondary">$ 410.00</p>
                                                </div>
                                                <div class="col-auto ps-0 align-self-center">
                                                    <i class="bi bi-chevron-right text-muted small vm"></i>
                                                </div>
                                            </div>
                                        </li>
                                        <li class="list-group-item">
                                            <div class="row gx-3">
                                                <div class="col-auto align-self-center">
                                                    <figure class="avatar avatar-40 rounded-circle coverimg vm">
                                                        <img src="assets/img/modern-ai-image/user-3.jpg" alt="" style="display: none;" />
                                                    </figure>
                                                </div>
                                                <div class="col px-0 align-self-center">
                                                    <p class="mb-0">Shelvey Doe</p>
                                                    <p class="small text-secondary">$ 180.00</p>
                                                </div>
                                                <div class="col-auto ps-0 align-self-center">
                                                    <i class="bi bi-chevron-right text-muted small vm"></i>
                                                </div>
                                            </div>
                                        </li>
                                    </ul>
                                </swiper-slide>
                                <swiper-slide class="width-240">
                                    <div class="card adminuiux-card theme-yellow bg-r-gradient mb-2">
                                        <div class="card-body">
                                            <div class="row gx-3 align-items-center mb-4">
                                                <div class="col-auto align-self-center">
                                                    <i class="bi bi-amazon fs-4"></i>
                                                </div>
                                                <div class="col text-end">
                                                    <p class="fs-12">
                                                        <span class="opacity-50 small">City Bank</span><br />
                                                        <span class="">Credit Card</span>
                                                    </p>
                                                </div>
                                            </div>
                                            <p class="fw-medium h6 mb-3">000 0000 0001 546598</p>
                                            <div class="row gx-3 gx-lg-4">
                                                <div class="col-auto fs-12">
                                                    <p class="mb-0 opacity-50 small">Expiry</p>
                                                    <p>09/023</p>
                                                </div>
                                                <div class="col text-end fs-12">
                                                    <p class="mb-0 opacity-50 small">Card Holder</p>
                                                    <p>AdminUIUX</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="row gx-3 mb-3">
                                        <div class="col">
                                            <p class="text-secondary small mb-1">Expense</p>
                                            <h6>
                                                1500.00 <small class="text-success">18.0 <i class="bi bi-arrow-up"></i></small>
                                            </h6>
                                        </div>
                                        <div class="col-auto text-end">
                                            <p class="text-secondary small mb-1">Limit Remain</p>
                                            <h6>13500.00</h6>
                                        </div>
                                    </div>
                                    <ul class="list-group list-group-flush border-0 bg-transparent">
                                        <li class="list-group-item">
                                            <div class="row gx-3">
                                                <div class="col-auto align-self-center">
                                                    <figure class="avatar avatar-40 rounded-circle coverimg vm">
                                                        <img src="assets/img/modern-ai-image/user-4.jpg" alt="" style="display: none;" />
                                                    </figure>
                                                </div>
                                                <div class="col px-0 align-self-center">
                                                    <p class="mb-0">David Warner</p>
                                                    <p class="small text-secondary">$ 410.00</p>
                                                </div>
                                                <div class="col-auto ps-0 align-self-center">
                                                    <i class="bi bi-chevron-right text-muted small vm"></i>
                                                </div>
                                            </div>
                                        </li>
                                        <li class="list-group-item">
                                            <div class="row gx-3">
                                                <div class="col-auto align-self-center">
                                                    <figure class="avatar avatar-40 rounded-circle coverimg vm">
                                                        <img src="assets/img/modern-ai-image/user-3.jpg" alt="" style="display: none;" />
                                                    </figure>
                                                </div>
                                                <div class="col px-0 align-self-center">
                                                    <p class="mb-0">Shelvey Doe</p>
                                                    <p class="small text-secondary">$ 180.00</p>
                                                </div>
                                                <div class="col-auto ps-0 align-self-center">
                                                    <i class="bi bi-chevron-right text-muted small vm"></i>
                                                </div>
                                            </div>
                                        </li>
                                    </ul>
                                </swiper-slide>
                            </swiper-container>

                            <h6 class="mb-3 mb-lg-4">PayPal Address <small class="text-secondary fw-normal">(Provide to receive payouts)</small></h6>
                            <div class="row mb-3">
                                <div class="col-12 col-md-6 col-lg-4">
                                    <div class="form-group mb-3 position-relative check-valid">
                                        <div class="form-floating">
                                            <input type="email" placeholder="Email" value="testmail&#64;adminuiux.com" required class="form-control" />
                                            <label>Email</label>
                                        </div>
                                    </div>
                                    <div class="invalid-feedback">Please enter valid input</div>
                                </div>
                                <div class="col-12 col-md-6 col-lg-4 align-self-center">
                                    <p class="mb-2 text-success"><i class="bi bi-patch-check me-1"></i> Verified</p>
                                </div>
                            </div>

                            <div class="row gx-3">
                                <div class="col">
                                    <!-- submit button -->
                                    <button class="btn btn-theme" type="button">Submit</button>
                                </div>
                                <div class="col-auto">
                                    <button class="btn btn-link theme-red" type="button">Cancel</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <!-- email and social tab-->
                <div class="tab-pane fade" id="emailsocials" role="tabpanel" aria-labelledby="emailsocials-tab">
                    <div class="card adminuiux-card mb-3 mb-lg-4">
                        <div class="card-body">
                            <h6 class="mb-3 mb-lg-4">Website</h6>
                            <div class="row gx-3 mb-3">
                                <div class="col-12 col-md-12 col-lg-4">
                                    <div class="form-group mb-3 position-relative check-valid">
                                        <div class="form-floating">
                                            <input type="text" placeholder="Provide website url" value="https://www.adminuiux.com" required class="form-control" />
                                            <label>Website</label>
                                        </div>
                                    </div>
                                    <div class="invalid-feedback">Please enter valid input</div>
                                </div>
                            </div>

                            <h6 class="mb-3 mb-lg-4">Social account <small class="text-secondary fw-normal">(Provide username, page name only)</small></h6>
                            <div class="row gx-3 mb-3">
                                <div class="col-12 col-md-6 col-lg-4">
                                    <div class="form-group mb-3 position-relative check-valid">
                                        <div class="form-floating">
                                            <input type="email" placeholder="Provide twitter username" value="adminuiux" required class="form-control" />
                                            <label>Twitter</label>
                                        </div>
                                    </div>
                                    <div class="invalid-feedback">Please enter valid input</div>
                                </div>
                                <div class="col-12 col-md-6 col-lg-4">
                                    <div class="form-group mb-3 position-relative check-valid">
                                        <div class="form-floating">
                                            <input type="email" placeholder="Provide Facebook username" value="adminuiux" required class="form-control" />
                                            <label>Facebook</label>
                                        </div>
                                    </div>
                                    <div class="invalid-feedback">Please enter valid input</div>
                                </div>
                                <div class="col-12 col-md-6 col-lg-4">
                                    <div class="form-group mb-3 position-relative check-valid">
                                        <div class="form-floating">
                                            <input type="email" placeholder="Provide Linkdein username" value="adminuiux" required class="form-control" />
                                            <label>LinkdeIn</label>
                                        </div>
                                    </div>
                                    <div class="invalid-feedback">Please enter valid input</div>
                                </div>
                                <div class="col-12 col-md-6 col-lg-4">
                                    <div class="form-group mb-3 position-relative check-valid">
                                        <div class="form-floating">
                                            <input type="email" placeholder="Provide Pinterest username" value="adminuiux" required class="form-control" />
                                            <label>Pinterest</label>
                                        </div>
                                    </div>
                                    <div class="invalid-feedback">Please enter valid input</div>
                                </div>
                            </div>

                            <h6 class="mb-3 mb-lg-4">Email settings</h6>
                            <ul class="list-group list-group-flush bg-none mb-4">
                                <li class="list-group-item">
                                    <div class="row gx-3">
                                        <div class="col">Show emails to publicly</div>
                                        <div class="col-auto">
                                            <div class="form-check form-switch">
                                                <input class="form-check-input" type="checkbox" id="emailsocial1" />
                                                <label class="form-check-label" for="emailsocial1"></label>
                                            </div>
                                        </div>
                                    </div>
                                </li>
                                <li class="list-group-item">
                                    <div class="row gx-3">
                                        <div class="col">Send an email reminding me to rate an item a week after purchase</div>
                                        <div class="col-auto">
                                            <div class="form-check form-switch">
                                                <input class="form-check-input" type="checkbox" id="emailsocial2" checked="" />
                                                <label class="form-check-label" for="emailsocial2"></label>
                                            </div>
                                        </div>
                                    </div>
                                </li>
                                <li class="list-group-item">
                                    <div class="row gx-3">
                                        <div class="col">Send an email when an item I've purchased is updated</div>
                                        <div class="col-auto">
                                            <div class="form-check form-switch">
                                                <input class="form-check-input" type="checkbox" id="emailsocial3" checked="" />
                                                <label class="form-check-label" for="emailsocial3"></label>
                                            </div>
                                        </div>
                                    </div>
                                </li>
                                <li class="list-group-item">
                                    <div class="row gx-3">
                                        <div class="col">Send me a daily summary of all items approved or rejected</div>
                                        <div class="col-auto">
                                            <div class="form-check form-switch">
                                                <input class="form-check-input" type="checkbox" id="emailsocial4" />
                                                <label class="form-check-label" for="emailsocial4"></label>
                                            </div>
                                        </div>
                                    </div>
                                </li>
                            </ul>

                            <div class="row gx-3">
                                <div class="col">
                                    <!-- submit button -->
                                    <button class="btn btn-theme" type="button">Submit</button>
                                </div>
                                <div class="col-auto">
                                    <button class="btn btn-link theme-red" type="button">Cancel</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <!-- tax information tab-->
                <div class="tab-pane fade" id="taxinfo" role="tabpanel" aria-labelledby="taxinfo-tab">
                    <div class="card adminuiux-card mb-3 mb-lg-4">
                        <div class="card-body">
                            <div class="card adminuiux-card border border-theme-1 bg-l-gradient-light theme-green mb-3 mb-lg-4">
                                <div class="card-body p-3">
                                    <h6>You successfully submitted your tax information on 25 Jun 2021 18:26:20 UTC.</h6>
                                    <p>Your tax information will expire on 1st July 2025. Please re-submit your form before expiry.</p>
                                    <p>If you wish to update these details, please re-submit the form below.</p>
                                </div>
                                <div class="card-footer p-3">
                                    <p>For questions relating to why we need this information,<br />please check our help center for <a href="">W-9</a>, <a href="">W-8</a> articles or email <a href="">testmail&#64;adminuiux.com</a>.</p>
                                </div>
                            </div>
                            <p>US federal tax law requires getAdminUX to collect US Author tax information through an IRS Form W-9 and report on income paid.</p>
                            <br />
                            <h5>If you are a U.S. Person</h5>
                            <p>No matter where you are worldwide you can submit a Form W-9 to getAdminUX to satisfy your filing requirement. Typically there will be no withholding of taxes on any of your getAdminUX income. If you do not submit a valid Form W-9, getAdminUX will be required to deduct 24% withholding tax from sales proceeds and remit these directly to the Internal Revenue Service. If you have any questions, please check our help center for W-9 articles.</p>
                            <br />
                            <h5>If you are not a U.S. Person</h5>
                            <p>You will need to submit a Form W-8. If you are a resident of a country that has a tax treaty with the U.S., you will benefit from the reduced or zero withholding rate that is specified in your country's tax treaty. If you are a resident of a country that does not have a tax treaty with the U.S., then your U.S. source income from AdminUX will be subject to a 30% withholding tax. If you have any questions, please check our help center for W-8 articles.</p>
                            <br />
                            <p>While getAdminUX cannot give tax and/or legal advice, we will do our best to provide you with the information you need to make your own decision about how to comply with applicable U.S. tax laws. If you still have questions after reviewing the information provided by the IRS, please contact your legal and/or tax advisor.</p>

                            <p>Please indicate whether you are a US Person and we will direct you to the correct Forms. More information- An individual who is a US citizen or US resident alien, or who satisfies the substantial presence test.</p>

                            <p>- A partnership, corporation, company, or association created or organized in the United States or under the laws of the United States.</p>

                            <p>- An estate (other than a foreign estate), or</p>

                            <p>- A domestic trust (as defined in US tax regulations).</p>
                            <br />
                            <ul class="list-group list-group-flush bg-none mb-3 mb-lg-4">
                                <li class="list-group-item">
                                    <div class="form-check form-switch">
                                        <input class="form-check-input" name="usnoneus" type="radio" id="usnoneus1" checked />
                                        <label class="form-check-label" for="usnoneus1">I am a US Person</label>
                                    </div>
                                </li>
                                <li class="list-group-item">
                                    <div class="form-check form-switch">
                                        <input class="form-check-input" name="usnoneus" type="radio" id="usnoneus2" />
                                        <label class="form-check-label" for="usnoneus2">I am not a US Person</label>
                                    </div>
                                </li>
                            </ul>
                            <div class="row gx-3">
                                <div class="col">
                                    <!-- submit button -->
                                    <button class="btn btn-theme" type="button">Submit</button>
                                </div>
                                <div class="col-auto">
                                    <button class="btn btn-link theme-red" type="button">Cancel</button>
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
export class AccountSettingsComponent {
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
