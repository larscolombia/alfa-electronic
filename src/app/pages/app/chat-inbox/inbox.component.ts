import { Component, Inject, Renderer2 } from "@angular/core";
import { NgxEditorComponent, NgxEditorMenuComponent, Editor } from "ngx-editor";
import { FormsModule } from "@angular/forms";
import { DOCUMENT } from "@angular/common";

import Dropzone from "dropzone";
Dropzone.autoDiscover = false;

@Component({
    selector: "app-inbox",
    standalone: true,
    imports: [NgxEditorComponent, NgxEditorMenuComponent, FormsModule],
    template: `
        <!-- page title -->
        <div class="container-fluid py-3">
            <div class="row align-items-center page-title">
                <div class="col col-sm mb-3 mb-sm-0 order-1">
                    <h5 class="mb-0">Email Inbox</h5>
                    <p class="text-secondary small">Stay up to date with communication</p>
                </div>
                <div class="col-12 col-sm-auto order-3 order-sm-2">
                    <div class="input-group input-group-md width-250">
                        <input type="text" class="form-control bg-transparent" placeholder="Search email, conract..." />
                        <span class="input-group-text text-theme-1 bg-transparent"><i class="bi bi-search"></i></span>
                    </div>
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
                                    <select class="form-control choices" id="titltfilterlist" multiple>
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
                    <button class="btn btn-theme ms-2" type="button" data-bs-toggle="modal" data-bs-target="#emailcompose"><i class="bi bi-envelope-plus me-2 align-middle"></i> Compose</button>
                </div>
            </div>
            <nav aria-label="breadcrumb" class="breadcrumb-theme mt-3 rounded">
                <ol class="breadcrumb mb-0">
                    <li class="breadcrumb-item bi">
                        <a routerLink="/app/dashboard"><i class="bi bi-house-door me-2"></i> AdminUX</a>
                    </li>
                    <li class="breadcrumb-item bi active" aria-current="page">Email</li>
                </ol>
            </nav>
        </div>

        <!-- content -->
        <div class="container mt-3" id="main-content">
            <ul class="nav rounded p-1 mb-3">
                <li class="nav-item">
                    <button class="btn btn-link btn-square innersidebar-btn" (click)="innersidebar()">
                        <i class="bi bi-layout-sidebar h5 align-middle"></i>
                    </button>
                </li>
                <li class="nav-item">
                    <div class="nav-link px-lg-3"><input class="form-check-input align-middle mt-0 me-1" type="checkbox" value="" aria-label="..." checked="" /> All</div>
                </li>
                <li class="nav-item d-none d-lg-block">
                    <a class="nav-link px-lg-3"><i class="bi bi-arrow-clockwise h5 align-middle"></i></a>
                </li>
                <li class="nav-item">
                    <a class="nav-link px-lg-3"><i class="bi bi-trash align-middle"></i></a>
                </li>
                <li class="nav-item">
                    <a class="nav-link px-lg-3"><i class="bi bi-envelope-open align-middle"></i></a>
                </li>
                <li class="nav-item dropdown">
                    <a class="nav-link text-secondary px-lg-3" data-bs-toggle="dropdown" aria-expanded="false" data-bs-display="static" role="button">
                        <i class="bi bi-three-dots-vertical"></i>
                    </a>
                    <ul class="dropdown-menu dropdown-menu-end">
                        <li><a class="dropdown-item" href="javascript:void(0)">Mark all read</a></li>
                        <li><a class="dropdown-item" href="javascript:void(0)">Junk</a></li>
                        <li><a class="dropdown-item" href="javascript:void(0)">Spam</a></li>
                        <li><a class="dropdown-item theme-red" href="javascript:void(0)">Report</a></li>
                    </ul>
                </li>
                <li class="nav-item  ms-auto">
                    <a class="nav-link"><i class="bi bi-question-circle"></i></a>
                </li>
                <li class="nav-item">
                    <a class="nav-link d-inline-block"><i class="bi bi-chevron-left"></i></a>
                    <span class="d-none d-xl-inline-block align-middle">15 out of 12548</span>
                    <a class="nav-link d-inline-block"><i class="bi bi-chevron-right"></i></a>
                </li>
            </ul>

            <div class="inner-sidebar-wrap">
                <div class="inner-sidebar height-dynamic bg-transparent" style="--h-dynamic:auto">
                    <div class="card adminuiux-card h-100">
                        <div class="card-body">
                            <div class="input-group mb-3">
                                <input type="text" class="form-control" placeholder="Search mail... " value="" />
                                <button class="btn border" type="button">
                                    <i class="bi bi-search"></i>
                                </button>
                            </div>
                            <ul class="nav flex-column">
                                <li class="nav-item">
                                    <a class="nav-link active" aria-current="page" routerLink="/app/inbox">
                                        <div class="avatar avatar-28 icon"><i class="bi bi-inbox"></i></div>
                                        <div class="col">Inbox</div>
                                        <div class="col-auto align-self-center">
                                            <figure class="avatar avatar-28 coverimg rounded-circle">
                                                <img src="assets/img/modern-ai-image/user-4.jpg" alt="" style="display: none;" />
                                            </figure>
                                            <figure class="avatar avatar-28 coverimg rounded-circle">
                                                <img src="assets/img/modern-ai-image/user-1.jpg" alt="" style="display: none;" />
                                            </figure>
                                            <figure class="avatar avatar-28 bg-theme-1 rounded-circle">
                                                <small>9+</small>
                                            </figure>
                                        </div>
                                    </a>
                                </li>
                                <li class="nav-item dropdown">
                                    <a class="nav-link dropdown-toggle" data-bs-toggle="dropdown" data-bs-auto-close="false" data-bs-display="static" role="button" aria-expanded="false">
                                        <div class="avatar avatar-28 icon"><i class="bi bi-tags"></i></div>
                                        <div class="col">Categories</div>
                                    </a>
                                    <ul class="dropdown-menu">
                                        <li>
                                            <a class="dropdown-item nav-link">
                                                <div class="avatar avatar-28 icon"><i class="bi bi-inbox-fill"></i></div>
                                                <div class="col align-self-center">Important</div>
                                                <div class="col-auto align-items-center">
                                                    <span class="badge text-bg-primary mx-2">9+</span>
                                                </div>
                                                <div class="arrow"><i class="bi bi-chevron-right"></i></div>
                                            </a>
                                        </li>
                                        <li>
                                            <a class="dropdown-item nav-link">
                                                <div class="avatar avatar-28 icon"><i class="bi bi-people"></i></div>
                                                <div class="col align-self-center">Social</div>
                                                <div class="arrow"><i class="bi bi-chevron-right"></i></div>
                                            </a>
                                        </li>
                                        <li>
                                            <a class="dropdown-item nav-link">
                                                <div class="avatar avatar-28 icon"><i class="bi bi-cart"></i></div>
                                                <div class="col align-self-center">eCommerce</div>
                                                <div class="arrow"><i class="bi bi-chevron-right"></i></div>
                                            </a>
                                        </li>
                                        <li>
                                            <a class="dropdown-item nav-link">
                                                <div class="avatar avatar-28 icon"><i class="bi bi-megaphone"></i></div>
                                                <div class="col align-self-center">Marketing</div>
                                                <div class="arrow"><i class="bi bi-chevron-right"></i></div>
                                            </a>
                                        </li>
                                        <li>
                                            <a class="dropdown-item nav-link">
                                                <div class="avatar avatar-28 icon"><i class="bi bi-chat-right-dots"></i></div>
                                                <div class="col align-self-center">Forum</div>
                                                <div class="arrow"><i class="bi bi-chevron-right"></i></div>
                                            </a>
                                        </li>
                                    </ul>
                                </li>
                                <li class="nav-item">
                                    <a class="nav-link" aria-current="page">
                                        <div class="avatar avatar-28 icon"><i class="bi bi-clock"></i></div>
                                        <div class="col">Snoozed</div>
                                    </a>
                                </li>
                                <li class="nav-item">
                                    <a class="nav-link" aria-current="page">
                                        <div class="avatar avatar-28 icon"><i class="bi bi-star"></i></div>
                                        <div class="col">Favorite</div>
                                    </a>
                                </li>
                                <li class="nav-item">
                                    <a class="nav-link" aria-current="page">
                                        <div class="avatar avatar-28 icon"><i class="bi bi-send"></i></div>
                                        <div class="col">Sent</div>
                                    </a>
                                </li>
                                <li class="nav-item">
                                    <a class="nav-link" aria-current="page">
                                        <div class="avatar avatar-28 icon"><i class="bi bi-save"></i></div>
                                        <div class="col">Draft</div>
                                    </a>
                                </li>
                                <li class="nav-item">
                                    <a class="nav-link" aria-current="page">
                                        <div class="avatar avatar-28 icon"><i class="bi bi-exclamation-circle"></i></div>
                                        <div class="col">Spam</div>
                                        <div class="col-auto">
                                            <span class="badge text-bg-warning mx-2">99+</span>
                                        </div>
                                    </a>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
                <div class="inner-sidebar-content">
                    <div class="list-group adminuiux-list-group list-group-flush hover-highlight-list bg-none">
                        <div class="list-group-item new">
                            <div class="row gx-3">
                                <div class="col-auto align-self-center order-1 order-md-1">
                                    <input class="form-check-input me-1" type="checkbox" value="" />
                                </div>
                                <div class="col-auto order-2 order-md-2 align-self-center"><i class="bi bi-star text-secondary align-middle"></i></div>
                                <div class="col-auto order-3 order-md-3 align-self-center"><i class="bi bi-flag text-yellow align-middle"></i></div>
                                <div class="col-12 col-md order-5 order-md-4" data-bs-toggle="modal" data-bs-target="#emailread">
                                    <p class="mb-0">Max Smith, Zeel Smith</p>
                                    <p class="text-secondary text-truncated">Online Survey for ew project we have started!</p>
                                </div>
                                <div class="col-auto text-end ms-auto ms-md-0 order-4 order-md-5" data-bs-toggle="modal" data-bs-target="#emailread">
                                    <p class="mb-1 small">
                                        Feb 22
                                        <span class="text-secondary">8:00pm</span>
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div class="list-group-item new">
                            <div class="row gx-3">
                                <div class="col-auto align-self-center order-1 order-md-1">
                                    <input class="form-check-input me-1" type="checkbox" value="" />
                                </div>
                                <div class="col-auto order-2 order-md-2 align-self-center"><i class="bi bi-star text-secondary align-middle"></i></div>
                                <div class="col-auto order-3 order-md-3 align-self-center"><i class="bi bi-flag text-secondary  align-middle"></i></div>
                                <div class="col-12 col-md order-5 order-md-4" data-bs-toggle="modal" data-bs-target="#emailread">
                                    <p class="mb-0">Shelvey Doe</p>
                                    <p class="text-secondary text-truncated">Start course you have subscribed.</p>
                                </div>
                                <div class="col-auto text-end ms-auto ms-md-0 order-4 order-md-5" data-bs-toggle="modal" data-bs-target="#emailread">
                                    <p class="mb-1 small">
                                        Feb 20
                                        <span class="text-secondary">6:45pm</span>
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div class="list-group-item">
                            <div class="row gx-3">
                                <div class="col-auto align-self-center order-1 order-md-1">
                                    <input class="form-check-input me-1" type="checkbox" value="" />
                                </div>
                                <div class="col-auto order-2 order-md-2 align-self-center"><i class="bi bi-star text-secondary align-middle"></i></div>
                                <div class="col-auto order-3 order-md-3 align-self-center"><i class="bi bi-flag text-secondary  align-middle"></i></div>
                                <div class="col-12 col-md order-5 order-md-4" data-bs-toggle="modal" data-bs-target="#emailread">
                                    <p class="mb-0">Maria Johnson</p>
                                    <p class="text-secondary text-truncated">Start course you have subscribed.</p>
                                </div>
                                <div class="col-auto text-end ms-auto ms-md-0 order-4 order-md-5" data-bs-toggle="modal" data-bs-target="#emailread">
                                    <p class="mb-1 small">
                                        Feb 20
                                        <span class="text-secondary">6:45pm</span>
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div class="list-group-item">
                            <div class="row gx-3">
                                <div class="col-auto align-self-center order-1 order-md-1">
                                    <input class="form-check-input me-1" type="checkbox" value="" />
                                </div>
                                <div class="col-auto order-2 order-md-2 align-self-center"><i class="bi bi-star text-secondary align-middle"></i></div>
                                <div class="col-auto order-3 order-md-3 align-self-center"><i class="bi bi-flag text-secondary  align-middle"></i></div>
                                <div class="col-12 col-md order-5 order-md-4" data-bs-toggle="modal" data-bs-target="#emailread">
                                    <p class="mb-0">Jack Daniel</p>
                                    <p class="text-secondary text-truncated">Your Behance portfolio updated recently</p>
                                </div>
                                <div class="col-auto text-end ms-auto ms-md-0 order-4 order-md-5" data-bs-toggle="modal" data-bs-target="#emailread">
                                    <p class="mb-1 small">
                                        Feb 18
                                        <span class="text-secondary">12:00pm</span>
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div class="list-group-item">
                            <div class="row gx-3">
                                <div class="col-auto align-self-center order-1 order-md-1">
                                    <input class="form-check-input me-1" type="checkbox" value="" />
                                </div>
                                <div class="col-auto order-2 order-md-2 align-self-center"><i class="bi bi-star text-secondary align-middle"></i></div>
                                <div class="col-auto order-3 order-md-3 align-self-center"><i class="bi bi-flag text-yellow align-middle"></i></div>
                                <div class="col-12 col-md order-5 order-md-4">
                                    <p class="mb-0">Dhiren Nagar</p>
                                    <p class="text-secondary text-truncated">Welcome to the team adminuiux your are the most awaited player.</p>
                                </div>
                                <div class="col-auto text-end ms-auto ms-md-0 order-4 order-md-5">
                                    <p class="mb-1 small">
                                        Feb 18
                                        <span class="text-secondary">11:00am</span>
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div class="list-group-item">
                            <div class="row gx-3">
                                <div class="col-auto align-self-center order-1 order-md-1">
                                    <input class="form-check-input me-1" type="checkbox" value="" />
                                </div>
                                <div class="col-auto order-2 order-md-2 align-self-center"><i class="bi bi-star text-secondary align-middle"></i></div>
                                <div class="col-auto order-3 order-md-3 align-self-center"><i class="bi bi-flag text-yellow align-middle"></i></div>
                                <div class="col-12 col-md order-5 order-md-4">
                                    <p class="mb-0">Max Smith, Zeel Smith</p>
                                    <p class="text-secondary text-truncated">Online Survey for ew project we have started!</p>
                                </div>
                                <div class="col-auto text-end ms-auto ms-md-0 order-4 order-md-5">
                                    <p class="mb-1 small">
                                        Feb 22
                                        <span class="text-secondary">8:00pm</span>
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div class="list-group-item">
                            <div class="row gx-3">
                                <div class="col-auto align-self-center order-1 order-md-1">
                                    <input class="form-check-input me-1" type="checkbox" value="" />
                                </div>
                                <div class="col-auto order-2 order-md-2 align-self-center"><i class="bi bi-star text-secondary align-middle"></i></div>
                                <div class="col-auto order-3 order-md-3 align-self-center"><i class="bi bi-flag text-secondary  align-middle"></i></div>
                                <div class="col-12 col-md order-5 order-md-4">
                                    <p class="mb-0">Shelvey Doe</p>
                                    <p class="text-secondary text-truncated">Start course you have subscribed.</p>
                                </div>
                                <div class="col-auto text-end ms-auto ms-md-0 order-4 order-md-5">
                                    <p class="mb-1 small">
                                        Feb 20
                                        <span class="text-secondary">6:45pm</span>
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div class="list-group-item">
                            <div class="row gx-3">
                                <div class="col-auto align-self-center order-1 order-md-1">
                                    <input class="form-check-input me-1" type="checkbox" value="" />
                                </div>
                                <div class="col-auto order-2 order-md-2 align-self-center"><i class="bi bi-star text-secondary align-middle"></i></div>
                                <div class="col-auto order-3 order-md-3 align-self-center"><i class="bi bi-flag text-secondary  align-middle"></i></div>
                                <div class="col-12 col-md order-5 order-md-4">
                                    <p class="mb-0">Jack Daniel</p>
                                    <p class="text-secondary text-truncated">Your Behance portfolio updated recently</p>
                                </div>
                                <div class="col-auto text-end ms-auto ms-md-0 order-4 order-md-5">
                                    <p class="mb-1 small">
                                        Feb 18
                                        <span class="text-secondary">12:00pm</span>
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div class="list-group-item">
                            <div class="row gx-3">
                                <div class="col-auto align-self-center order-1 order-md-1">
                                    <input class="form-check-input me-1" type="checkbox" value="" />
                                </div>
                                <div class="col-auto order-2 order-md-2 align-self-center"><i class="bi bi-star text-secondary align-middle"></i></div>
                                <div class="col-auto order-3 order-md-3 align-self-center"><i class="bi bi-flag text-yellow align-middle"></i></div>
                                <div class="col-12 col-md order-5 order-md-4">
                                    <p class="mb-0">Dhiren Nagar</p>
                                    <p class="text-secondary text-truncated">Welcome to the team adminuiux your are the most awaited player.</p>
                                </div>
                                <div class="col-auto text-end ms-auto ms-md-0 order-4 order-md-5">
                                    <p class="mb-1 small">
                                        Feb 18
                                        <span class="text-secondary">11:00am</span>
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div class="list-group-item">
                            <div class="row gx-3">
                                <div class="col-auto align-self-center order-1 order-md-1">
                                    <input class="form-check-input me-1" type="checkbox" value="" />
                                </div>
                                <div class="col-auto order-2 order-md-2 align-self-center"><i class="bi bi-star text-secondary align-middle"></i></div>
                                <div class="col-auto order-3 order-md-3 align-self-center"><i class="bi bi-flag text-yellow align-middle"></i></div>
                                <div class="col-12 col-md order-5 order-md-4">
                                    <p class="mb-0">Max Smith, Zeel Smith</p>
                                    <p class="text-secondary text-truncated">Online Survey for ew project we have started!</p>
                                </div>
                                <div class="col-auto text-end ms-auto ms-md-0 order-4 order-md-5">
                                    <p class="mb-0">
                                        Feb 22
                                        <span class="text-secondary">8:00pm</span>
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div class="list-group-item">
                            <div class="row gx-3">
                                <div class="col-auto align-self-center order-1 order-md-1">
                                    <input class="form-check-input me-1" type="checkbox" value="" />
                                </div>
                                <div class="col-auto order-2 order-md-2 align-self-center"><i class="bi bi-star text-secondary align-middle"></i></div>
                                <div class="col-auto order-3 order-md-3 align-self-center"><i class="bi bi-flag text-secondary  align-middle"></i></div>
                                <div class="col-12 col-md order-5 order-md-4">
                                    <p class="mb-0">Shelvey Doe</p>
                                    <p class="text-secondary text-truncated">Start course you have subscribed.</p>
                                </div>
                                <div class="col-auto text-end ms-auto ms-md-0 order-4 order-md-5">
                                    <p class="mb-1 small">
                                        Feb 20
                                        <span class="text-secondary">6:45pm</span>
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div class="list-group-item">
                            <div class="row gx-3">
                                <div class="col-auto align-self-center order-1 order-md-1">
                                    <input class="form-check-input me-1" type="checkbox" value="" />
                                </div>
                                <div class="col-auto order-2 order-md-2 align-self-center"><i class="bi bi-star text-secondary align-middle"></i></div>
                                <div class="col-auto order-3 order-md-3 align-self-center"><i class="bi bi-flag text-secondary  align-middle"></i></div>
                                <div class="col-12 col-md order-5 order-md-4">
                                    <p class="mb-0">Jack Daniel</p>
                                    <p class="text-secondary text-truncated">Your Behance portfolio updated recently</p>
                                </div>
                                <div class="col-auto text-end ms-auto ms-md-0 order-4 order-md-5">
                                    <p class="mb-1 small">
                                        Feb 18
                                        <span class="text-secondary">12:00pm</span>
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- modal compose email -->
        <div class="modal fade adminuiux-modal" id="emailcompose" tabindex="-1" aria-hidden="true">
            <div class="modal-dialog modal-lg modal-dialog-centered ">
                <div class="modal-content">
                    <div class="modal-header">
                        <p class="h6">Create New Email</p>
                    </div>
                    <div class="modal-body d-block">
                        <!-- Title -->
                        <div class="form-floating mb-3">
                            <input type="text" class="form-control" id="sendto" placeholder="Select Send to" value="cotact&#64;testmail.com" />
                            <label for="sendto">Send to</label>
                        </div>

                        <!-- Title -->
                        <div class="form-floating mb-3">
                            <input type="text" class="form-control" id="subject" placeholder="Subject" value="Adminuiux template for your all need for business" />
                            <label for="subject">Subject</label>
                        </div>

                        <!-- Textarea -->
                        <h6 class="mb-3">Your Message</h6>
                        <div class="NgxEditor__Wrapper mb-3 mb-lg-4">
                            <ngx-editor-menu [editor]="editor"> </ngx-editor-menu>
                            <ngx-editor [editor]="editor" [ngModel]="html" [disabled]="false" [placeholder]="'Type here...'"></ngx-editor>
                        </div>

                        <!-- dropzone -->
                        <h6 class="mb-3">Attachments</h6>
                        <form action="/target" class="dropzone mb-3 mb-lg-4">
                            <div class="dz-default dz-message my-2">
                                <i class="h1 bi bi-cloud-upload"></i><br />
                                <button class="dz-button" type="button">Drag and Drop or Click here to upload</button>
                            </div>
                        </form>

                        <p class="text-secondary small">Upload only .jpeg, .png, .mp4, .mpeg4 file format max. file size 6MB</p>

                        <div class="row gx-3 mt-3">
                            <div class="col">
                                <button class="btn btn-link theme-red" type="button" data-bs-dismiss="modal" aria-label="Close"><i class="bi bi-trash h4 me-2"></i> Discard</button>
                            </div>
                            <div class="col-auto">
                                <button class="btn btn-theme" type="button"><i class="bi bi-send me-2"></i> Send</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- modal read email -->
        <div class="modal fade adminuiux-modal" id="emailread" tabindex="-1" aria-hidden="true">
            <div class="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable ">
                <div class="modal-content">
                    <div class="modal-header border-bottom">
                        <div class="w-100">
                            <ul class="nav w-100 mb-3">
                                <li class="nav-item">
                                    <a class="nav-link" data-bs-dismiss="modal" aria-label="Close"><i class="bi bi-arrow-left"></i></a>
                                </li>
                                <li class="nav-item">
                                    <a class="nav-link theme-red"><i class="bi bi-trash align-middle"></i></a>
                                </li>
                                <li class="nav-item d-none d-sm-block">
                                    <a class="nav-link"><i class="bi bi-reply h5"></i></a>
                                </li>
                                <li class="nav-item ms-auto">
                                    <a class="nav-link"><i class="bi bi-star text-secondary align-middle"></i></a>
                                </li>
                                <li class="nav-item">
                                    <a class="nav-link"><i class="bi bi-flag-fill text-yellow align-middle"></i></a>
                                </li>
                                <li class="nav-item dropdown">
                                    <a class="nav-link text-secondary " data-bs-toggle="dropdown" aria-expanded="false" data-bs-display="static" role="button">
                                        <i class="bi bi-three-dots-vertical"></i>
                                    </a>
                                    <ul class="dropdown-menu dropdown-menu-end">
                                        <li><a class="dropdown-item" href="javascript:void(0)">Mark as read</a></li>
                                        <li><a class="dropdown-item" href="javascript:void(0)">Junk</a></li>
                                        <li><a class="dropdown-item" href="javascript:void(0)">Spam</a></li>
                                        <li><a class="dropdown-item text-danger" href="javascript:void(0)">Report</a></li>
                                    </ul>
                                </li>
                            </ul>

                            <!-- sender -->
                            <div class="row gx-3">
                                <div class="col-3 col-sm-auto align-self-center">
                                    <div class="avatar avatar-60 rounded-circle coverimg">
                                        <img src="assets/img/modern-ai-image/user-2.jpg" alt="" />
                                    </div>
                                </div>
                                <div class="col-9 col-sm ">
                                    <h6 class="mb-0">Shelvey Doe</h6>
                                    <p class="text-truncate mb-0">shelvey.shen&#64;gmailtest.com</p>
                                    <p class="text-secondary small">Feb 20 <span>6:45pm</span></p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="modal-body d-block">
                        <!-- subject -->
                        <p class="mb-1 text-secondary small">Subject</p>
                        <h5>This is awesome product & I am very happy with delivery & product packaging.</h5>
                        <hr />

                        <!-- mail content  -->
                        <div>
                            <p>Hello InvestmentUX and Team,</p>
                            <p class="h6">"Greetings from AdminUIUX"</p>
                            <br />
                            <p>
                                This is awesome product and, I am very happy with delivery &amp; product is awesome product and, I am very happy with delivery &amp; product packaging Lorem ipsum dolor sit amet, consectetur adipiscing elit. Pellentesque eleifend Lorem ipsum dolor sit amet, consectetur adipiscing elit. Pellentesque eleifend Lorem ipsum dolor sit amet, consectetur adipiscing elit. Pellentesque eleifend Lorem ipsum dolor sit amet, consectetur adipiscing elit. Pellentesque eleifend
                                Lorem ipsum dolor sit
                            </p>

                            <p>Lipsum dolor sit amet, consectetur adipiscing elit. Pellentesque eleifend Lorem ipsum dolor sit amet, consectetur adipiscing elit. Pellentesque eleifend Lorem ipsum dolor sit amet, consectetur adipiscing elit. Lipsum dolor sit amet, consectetur adipiscing elit. Pellentesque eleifend Lorem ipsum dolor sit amet, consectetur adipiscing elit. Pellentesque eleifend Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>
                            <br />
                            <figure class="text-center">
                                <blockquote class="blockquote">
                                    <p>This is awesome product &amp; I am very happy with delivery &amp; product packaging.</p>
                                </blockquote>
                                <figcaption class="blockquote-footer">Team Lead <cite title="Source Title">AdminUIUX</cite></figcaption>
                            </figure>
                            <br />
                            <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Pellentesque eleifend Lorem ipsum dolor sit amet, consectetur adipiscing elit. Pellentesque eleifend</p>

                            <p>Thanks,</p>

                            <p class="h6">John Smith</p>
                            <p>CEO-Apples Solution</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `,
})
export class InboxComponent {
    html = "";
    editor!: Editor;

    constructor(
        private renderer: Renderer2,
        @Inject(DOCUMENT) private document: Document // Inject the DOCUMENT token
    ) {}

    ngOnInit(): void {
        this.editor = new Editor();

        let myDropzone = new Dropzone(".dropzone");
        myDropzone.on("addedfile", (file: any) => {
            // console.log(`File added: ${file.name}`);
        });
    }

    ngOnDestroy(): void {
        this.editor.destroy();
    }
    innersidebar(): void {
        // Access the body element via the injected DOCUMENT
        const body = this.document.body;
        const className = "innermenu-close";

        // Check if the class exists and toggle it using native classList
        // This is safe because Renderer2 is used for add/remove,
        // and we're checking the native element's classList.
        if (body.classList.contains(className)) {
            this.renderer.removeClass(body, className);
        } else {
            this.renderer.addClass(body, className);
        }
    }
}
