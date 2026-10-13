import { Component, OnInit, AfterViewInit, AfterContentChecked, OnDestroy, ViewChild, ElementRef, CUSTOM_ELEMENTS_SCHEMA } from "@angular/core";
import { RouterLink } from "@angular/router";
import Choices, { ClassNames } from "choices.js";

import { DaterangePickerRangesComponent } from "../../../components/input-fields/daterange-picker/daterange-picker-ranges.component";

@Component({
    selector: "app-forum-details",
    standalone: true,
    imports: [RouterLink, DaterangePickerRangesComponent],
    template: `
        <!-- page title -->
        <div class="container-fluid py-3">
            <div class="row gx-3 gx-lg-4 align-items-center page-title">
                <div class="col col-sm mb-3 mb-sm-0 order-1">
                    <h5 class="mb-0">Forum Details</h5>
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
                    <li class="breadcrumb-item bi"><a routerLink="/app/forum"> Forum</a></li>
                    <li class="breadcrumb-item bi active" aria-current="page">Forum Details</li>
                </ol>
            </nav>
        </div>

        <!-- content -->
        <div class="container mt-3" id="main-content">
            <!-- search -->
            <div class="row gx-3 gx-lg-4 align-items-center justify-content-center mb-3 mb-lg-4">
                <div class="col-12 col-md mb-3 mb-md-0">
                    <div class="input-group input-group-lg shadow-sm rounded">
                        <span class="input-group-text text-theme-1 border-0"><i class="bi bi-search"></i></span>
                        <input class="form-control border-0" type="search" placeholder="Search your query here..." />
                    </div>
                </div>
                <div class="col-auto">
                    <button class="btn btn-lg btn-theme me-2">Ask Query</button>
                    <button class="btn btn-lg btn-theme">Write Post</button>
                </div>
            </div>

            <!-- questions and answer-->
            <div class="row gx-3 gx-lg-4">
                <div class="col-12 col-md-8 col-lg-9 col-xl-9">
                    <div class="card adminuiux-card mb-3 mb-lg-4">
                        <div class="card-body">
                            <div class="row gx-3 align-items-center mb-3">
                                <div class="col">
                                    <h4>How to create admin dashboard for Finance Application?</h4>
                                </div>
                                <div class="col-auto">
                                    <div class="dropdown">
                                        <button class="btn btn-square btn-link dropdown-toggle no-caret" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                                            <i class="bi bi-three-dots-vertical vm"></i>
                                        </button>
                                        <ul class="dropdown-menu dropdown-menu-end ">
                                            <li><a class="dropdown-item">Hide from Timeline</a></li>
                                            <li><a class="dropdown-item">Report</a></li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                            <div class="row gx-3 align-items-center mb-3">
                                <div class="col-auto">
                                    <figure class="avatar avatar-40 rounded-circle coverimg vm">
                                        <img src="assets/img/modern-ai-image/user-4.jpg" alt="" />
                                    </figure>
                                </div>
                                <div class="col">
                                    <p class="small text-secondary mb-0">Asked by</p>
                                    <p class="mb-0">David Warner <small class="text-secondary">1 hr ago</small></p>
                                </div>
                                <div class="col-auto text-end">
                                    <p class="small text-secondary mb-0">Modified</p>
                                    <p class="mb-0">8 min ago</p>
                                </div>
                            </div>
                            <p class="text-secondary">You can easily find template for UI with best customize facility named "GetAdminUX". AdminUX just because every home with windows needs door. everWhen you get older many people will listen you carefully, no matter if its correct discussion or not.</p>
                            <p>
                                <span class="badge badge-lg badge-light text-bg-theme-1 theme-red me-1 mt-1">Support</span>
                                <span class="badge badge-lg badge-light text-bg-theme-1 theme-red me-1 mt-1">Development</span>
                            </p>
                        </div>
                        <div class="card-footer">
                            <div class="row gx-3 align-items-center mb-3">
                                <div class="col-auto">
                                    <div class="btn btn-outline-theme theme-red btn-square rounded-circle">
                                        <i class="bi bi-heart h5"></i>
                                    </div>
                                </div>
                                <div class="col-auto">
                                    <p class="text-secondary small mb-0">Liked by</p>
                                    <h5>1.2k</h5>
                                </div>
                                <div class="col-auto">
                                    <div class="avatar avatar-40 coverimg rounded-circle me-1">
                                        <img src="assets/img/modern-ai-image/user-2.jpg" alt="" />
                                    </div>
                                    <div class="avatar avatar-40 coverimg rounded-circle me-1">
                                        <img src="assets/img/modern-ai-image/user-3.jpg" alt="" />
                                    </div>
                                    <div class="avatar avatar-40 coverimg rounded-circle me-1">
                                        <img src="assets/img/modern-ai-image/user-4.jpg" alt="" />
                                    </div>
                                </div>
                                <div class="col">
                                    <p class="text-secondary small mb-0">Answered by</p>
                                    <h5>9+</h5>
                                </div>
                                <div class="col-auto text-center">
                                    <p class="small text-secondary mb-0">Views</p>
                                    <h5>152</h5>
                                </div>
                                <div class="col-auto text-center">
                                    <p class="small text-secondary mb-0">Watching</p>
                                    <h5>256</h5>
                                </div>
                            </div>
                            <div class="input-group">
                                <input type="text" class="form-control border" placeholder="Your comment here..." />
                                <button class="btn btn-light border" type="button">Comment</button>
                            </div>
                        </div>
                    </div>

                    <!-- posted answer -->
                    <h5 class="title">Answers</h5>
                    <div class="card adminuiux-card bg-l-gradient-light theme-green mb-3 mb-lg-4">
                        <div class="card-body">
                            <p><span class="badge badge-lg text-bg-theme-1">Correct Answer</span></p>
                            <p class="text-secondary">
                                I found a solution to your problem. <br />
                                The installer works fine once I removed it out of my cluttered download folder<br />
                                I ran various tests and I'm pretty sure that i found the root to the problem.<br />
                                You can easily find template for UI with best customize facility named "GetAdminUX". AdminUX just because every home with windows needs door. everWhen you get older many people will listen you carefully, no matter if its correct discussion or not.
                            </p>

                            <div class="row gx-3 align-items-center mt-3">
                                <div class="col-auto">
                                    <figure class="avatar avatar-40 rounded-circle coverimg vm">
                                        <img src="assets/img/modern-ai-image/user-1.jpg" alt="" />
                                    </figure>
                                </div>
                                <div class="col">
                                    <p class="small text-secondary mb-0">Answer by</p>
                                    <p class="mb-0">Jack Manelia <small class="text-secondary">30 min ago</small></p>
                                </div>
                                <div class="col-auto text-end">
                                    <p class="small text-secondary mb-0">Modified</p>
                                    <p class="mb-0">8 min ago</p>
                                </div>
                                <div class="col-auto">
                                    <div class="dropdown">
                                        <button class="btn btn-square btn-link dropdown-toggle no-caret" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                                            <i class="bi bi-three-dots-vertical vm"></i>
                                        </button>
                                        <ul class="dropdown-menu dropdown-menu-end ">
                                            <li><a class="dropdown-item">Mark as Correct</a></li>
                                            <li><a class="dropdown-item">Hide from Timeline</a></li>
                                            <li><a class="dropdown-item">Report</a></li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="card-footer border-top">
                            <div class="row gx-3 align-items-center mb-3">
                                <div class="col-auto">
                                    <div class="btn btn-theme theme-red btn-square rounded-circle">
                                        <i class="bi bi-heart-fill h5"></i>
                                    </div>
                                </div>
                                <div class="col-auto">
                                    <p class="text-secondary small mb-0">Liked by</p>
                                    <h5>1.2k</h5>
                                </div>
                                <div class="col-auto">
                                    <div class="avatar avatar-40 coverimg rounded-circle me-1">
                                        <img src="assets/img/modern-ai-image/user-2.jpg" alt="" />
                                    </div>
                                    <div class="avatar avatar-40 coverimg rounded-circle me-1">
                                        <img src="assets/img/modern-ai-image/user-3.jpg" alt="" />
                                    </div>
                                    <div class="avatar avatar-40 coverimg rounded-circle me-1">
                                        <img src="assets/img/modern-ai-image/user-4.jpg" alt="" />
                                    </div>
                                </div>
                            </div>
                            <div class="input-group">
                                <input type="text" class="form-control border" placeholder="Your comment here..." />
                                <button class="btn btn-light border" type="button">Comment</button>
                            </div>

                            <!-- answer comments -->
                            <div class="row gx-3 mt-3">
                                <a href="" class="col-auto">
                                    <figure class="avatar avatar-40 rounded-circle vm shadow-sm">
                                        <img src="assets/img/modern-ai-image/user-4.jpg" alt="" />
                                    </figure>
                                </a>
                                <div class="col">
                                    <p class="mb-1"><a href="">Jack Lee</a> <span class="text-secondary d-inline-block ms-2 small">2 min ago</span></p>
                                    <p>This works for me</p>
                                    <div class="mt-2">
                                        <a class="btn btn-sm btn-link text-theme"> <i class="bi bi-heart vm"></i> Like <small class="ms-2">3</small> </a>

                                        <a class="btn btn-sm btn-link theme-yellow ms-2"> <i class="bi bi-chat-right-text vm small"></i> Reply <small class="ms-2">5</small> </a>
                                    </div>

                                    <!-- nested post -->
                                    <div class="row gx-3 mt-3">
                                        <a href="" class="col-auto">
                                            <figure class="avatar avatar-40 rounded-circle vm shadow-sm">
                                                <img src="assets/img/modern-ai-image/user-2.jpg" alt="" />
                                            </figure>
                                        </a>
                                        <div class="col">
                                            <p class="mb-1"><a href="">Kavyaa Johnson</a> <span class="text-secondary d-inline-block ms-2 small">2 min ago</span></p>
                                            <p>Yes I did it too.</p>
                                            <div class="mt-2">
                                                <a class="btn btn-sm btn-link text-theme"> <i class="bi bi-heart vm"></i> Like <small class="ms-2">3</small> </a>

                                                <a class="btn btn-sm btn-link theme-yellow ms-2"> <i class="bi bi-chat-right-text vm small"></i> Reply <small class="ms-2">5</small> </a>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="card adminuiux-card mb-3 mb-lg-4">
                        <div class="card-body">
                            <p class="text-secondary">
                                I found a solution to your problem. <br />
                                The installer works fine once I removed it out of my cluttered download folder<br />
                                I ran various tests and I'm pretty sure that i found the root to the problem.<br />
                                You can easily find template for UI with best customize facility named "GetAdminUX". AdminUX just because every home with windows needs door. everWhen you get older many people will listen you carefully, no matter if its correct discussion or not.
                            </p>

                            <div class="row gx-3 align-items-center mt-3">
                                <div class="col-auto">
                                    <figure class="avatar avatar-40 rounded-circle coverimg vm">
                                        <img src="assets/img/modern-ai-image/user-1.jpg" alt="" />
                                    </figure>
                                </div>
                                <div class="col">
                                    <p class="small text-secondary mb-0">Answer by</p>
                                    <p class="mb-0">Jack Manelia <small class="text-secondary">30 min ago</small></p>
                                </div>
                                <div class="col-auto text-end">
                                    <p class="small text-secondary mb-0">Modified</p>
                                    <p class="mb-0">8 min ago</p>
                                </div>
                                <div class="col-auto">
                                    <div class="dropdown">
                                        <button class="btn btn-square btn-link dropdown-toggle no-caret" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                                            <i class="bi bi-three-dots-vertical vm"></i>
                                        </button>
                                        <ul class="dropdown-menu dropdown-menu-end ">
                                            <li><a class="dropdown-item">Mark as Correct</a></li>
                                            <li><a class="dropdown-item">Hide from Timeline</a></li>
                                            <li><a class="dropdown-item">Report</a></li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="card-footer border-top">
                            <div class="row gx-3 align-items-center mb-3">
                                <div class="col-auto">
                                    <div class="btn btn-outline-theme theme-red btn-square rounded-circle">
                                        <i class="bi bi-heart h5"></i>
                                    </div>
                                </div>
                                <div class="col-auto">
                                    <p class="text-secondary small mb-0">Liked by</p>
                                    <h5>1.2k</h5>
                                </div>
                                <div class="col-auto">
                                    <div class="avatar avatar-40 coverimg rounded-circle me-1">
                                        <img src="assets/img/modern-ai-image/user-2.jpg" alt="" />
                                    </div>
                                    <div class="avatar avatar-40 coverimg rounded-circle me-1">
                                        <img src="assets/img/modern-ai-image/user-3.jpg" alt="" />
                                    </div>
                                    <div class="avatar avatar-40 coverimg rounded-circle me-1">
                                        <img src="assets/img/modern-ai-image/user-4.jpg" alt="" />
                                    </div>
                                </div>
                            </div>
                            <div class="input-group">
                                <input type="text" class="form-control border" placeholder="Your comment here..." />
                                <button class="btn btn-light border" type="button">Comment</button>
                            </div>
                        </div>
                    </div>

                    <!-- advertisement -->
                    <div class="card adminuiux-card overflow-hidden mb-3 mb-lg-4">
                        <div class="card-body position-relative bg-l-gradient-light">
                            <div class="coverimg w-75 h-100 end-0 top-0 position-absolute cover-right-center-img">
                                <img src=" assets/img/adminux/offer-1.png" class="w-100" alt="" />
                            </div>
                            <div class="row align-items-center justify-content-center h-100">
                                <div class="col-10 py-3 py-xl-5">
                                    <h3 class="text-theme mb-1">Refer &amp; Earn 20%</h3>
                                    <h5 class="fw-medium">Make your wallet even bigger</h5>
                                    <p class="text-secondary">Share your referral code to your friends and earn flat 20% amount.</p>
                                </div>
                            </div>
                        </div>
                        <div class="card-footer">
                            <div class="row gx-3 align-items-center">
                                <div class="col">
                                    <a href="" class="btn btn-link ">Learn more <i class="bi bi-arrow-right"></i></a>
                                </div>
                                <div class="col-auto avatar-group">
                                    <figure class="avatar avatar-40 rounded-circle coverimg overlay-ms-15" data-bs-toggle="tooltip" data-bs-placement="top" title="Shelvey Doe">
                                        <img src="assets/img/modern-ai-image/user-2.jpg" alt="" />
                                    </figure>
                                    <figure class="avatar avatar-40 rounded-circle coverimg overlay-ms-15" data-bs-toggle="tooltip" data-bs-placement="top" title="Maria Smith">
                                        <img src="assets/img/modern-ai-image/user-3.jpg" alt="" />
                                    </figure>
                                    <figure class="avatar avatar-40 rounded-circle coverimg overlay-ms-15" data-bs-toggle="tooltip" data-bs-placement="top" title="Steve Branden">
                                        <img src="assets/img/modern-ai-image/user-4.jpg" alt="" />
                                    </figure>
                                </div>
                                <div class="col-auto">
                                    <p class="mb-0">20+ Contacts</p>
                                    <p class="text-secondary small">Already Refereed</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- post answer -->
                    <div class="card adminuiux-card mb-3 mb-lg-4">
                        <div class="card-body">
                            <h5 class="mb-3 mb-lg-4">Your Answer</h5>
                            <div class="FroalaEditor"></div>
                            <p class="text-secondary my-3"><span class="badge bg-yellow fw-medium me-1 vm">Froala Editor Demo</span> Awesome features & pricing <a href="https://cart.froala.com/" target="_blank">Read more</a></p>
                            <div class="row gx-3 mb-3 mb-lg-4">
                                <div class="col-auto">
                                    <button class="btn btn-sm btn-outline-theme" type="button"><i class="bi bi-paperclip me-0 me-md-2"></i> <span class="d-none d-md-inline-block">Attachment</span></button>
                                </div>
                                <div class="col-auto">
                                    <button class="btn btn-sm btn-outline-theme" type="button"><i class="bi bi-link"></i> <span class="d-none d-md-inline-block">Insert Link</span></button>
                                </div>
                            </div>

                            <div class="row gx-3">
                                <div class="col">
                                    <button class="btn btn-theme" type="button"><i class="bi bi-send me-2"></i> Send</button>
                                </div>
                                <div class="col-auto">
                                    <button class="btn btn-link theme-red" type="button"><i class="bi bi-trash h4 me-2"></i> Discard</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-12 col-md-4 col-lg-3 col-xl-3">
                    <div class="card adminuiux-card bg-l-gradient-light mb-3 mb-lg-4">
                        <div class="card-header border-bottom">
                            <h6>Featured Questions</h6>
                        </div>
                        <div class="card-body p-0">
                            <div class="list-group list-group-flush bg-none">
                                <a routerLink="/app/forum-details" class="list-group-item list-group-item-action">How to become most powerful development partner?</a>
                                <a routerLink="/app/forum-details" class="list-group-item list-group-item-action">The best way to get started with the getAdminUX</a>
                                <a routerLink="/app/forum-details" class="list-group-item list-group-item-action">I have found egyptian assets, What I should do with it?</a>
                                <a routerLink="/app/forum-details" class="list-group-item list-group-item-action">How long it will take to make world record for traveling?</a>
                                <a routerLink="/app/forum-details" class="list-group-item list-group-item-action ">I am disabled person by my hands. What is my career options?</a>
                            </div>
                        </div>
                    </div>
                    <!-- advertisement -->
                    <p class="text-secondary text-center small">Advertisement</p>
                    <div class="card adminuiux-card overflow-hidden mb-3 mb-lg-4">
                        <div class="row gx-0">
                            <div class="col-6 bg-theme-1 text-white text-center p-3 z-index-1">
                                <div class="position-relative">
                                    <h4 class="mb-2">15% OFF</h4>
                                    <p class="opacity-75 small mb-3">Price including with our launch offer get 5% Extra</p>
                                    <button class="copy-text btn btn-sm btn-rounded btn-outline-dashed text-white border-white">GOREELLAUNCH</button>
                                </div>
                            </div>
                            <div class="col-6 position-relative">
                                <figure class="coverimg position-absolute w-100 h-100 start-0 top-0 m-0">
                                    <img src="assets/img/modern-ai-image/image-10.jpg" class="mw-100" alt="" />
                                </figure>
                            </div>
                        </div>
                    </div>
                    <h6 class="mb-3 mb-lg-4">Trending Tags</h6>
                    <div>
                        <a href="" class="badge badge-lg badge-light text-bg-theme-1 me-1 my-1">Android</a>
                        <a href="" class="badge badge-lg badge-light text-bg-theme-1 me-1 my-1">iOS</a>
                        <a href="" class="badge badge-lg badge-light text-bg-theme-1 me-1 my-1">Windows11</a>
                        <a href="" class="badge badge-lg badge-light text-bg-theme-1 me-1 my-1">Fluent ui</a>
                        <a href="" class="badge badge-lg badge-light text-bg-theme-1 me-1 my-1">Win UI</a>
                        <a href="" class="badge badge-lg badge-light text-bg-theme-1 me-1 my-1">Template</a>
                        <a href="" class="badge badge-lg badge-light text-bg-theme-1 me-1 my-1">Dashboard</a>
                        <a href="" class="badge badge-lg badge-light text-bg-theme-1 me-1 my-1">Bootstrap</a>
                        <a href="" class="badge badge-lg badge-light text-bg-theme-1 me-1 my-1">Angular admin</a>
                        <a href="" class="badge badge-lg badge-light text-bg-theme-1 me-1 my-1">Free Dashboard</a>
                    </div>
                </div>
            </div>
        </div>
    `,
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class ForumDetailsComponent {
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
