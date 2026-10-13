import { Component, HostListener, OnInit, Renderer2, Inject } from "@angular/core";
import { DOCUMENT } from "@angular/common";
import { Router, RouterLink } from "@angular/router";
import { AuthService } from "../../../services/auth.service";

@Component({
    selector: "app-main-header",
    standalone: true,
    imports: [RouterLink],
    template: `
        <!-- Fixed navbar -->
        <nav class="navbar navbar-expand-lg fixed-top">
            <div class="container-fluid">
                <!-- main sidebar toggle -->
                <button class="btn btn-link btn-square sidebar-toggler" type="button" (click)="toggleSidebar()">
                    <i class="sidebar-svg bi bi-list"></i>
                </button>

                <a class="btn btn-link btn-square btn-icon btn-link-header" routerLink="/app/main-menu" title="Menu principal" aria-label="Menu principal">
                    <i class="bi bi-grid-3x3-gap-fill"></i>
                </a>

                <!-- logo -->
                <a class="navbar-brand" routerLink="/app/dashboard">
                    <img src="assets/img/logo-pika.png" alt="PIKA logo" class="logo-pika" />
                </a>

                <!-- search -->
                <div class="px-3 justify-content-center d-none d-lg-flex">
                    <div class="input-group input-group-md rounded search-wrap width-300 mx-auto">
                        <span class="input-group-text border-0 bg-none">
                            <i class="bi bi-search"></i>
                        </span>
                        <input class="form-control border-0 bg-none" type="search" placeholder="Search here..." id="searchglobal" />
                        <div class="dropdown input-group-text border-0 px-2">
                            <button class="dropdown-toggle btn btn-sm btn-link btn-square no-caret" type="button" id="searchfilter" data-bs-toggle="dropdown" aria-expanded="false">
                                <i class="bi bi-sliders fs-6"></i>
                            </button>
                            <div class="dropdown-menu dropdown-menu-end dropdown-dontclose width-300" aria-labelledby="searchfilter" style="">
                                <ul class="nav nav-underline" id="searchtab" role="tablist">
                                    <li class="nav-item" role="presentation"><button class="nav-link active" id="searchall-tab" data-bs-toggle="tab" data-bs-target="#searchall" type="button" role="tab" aria-controls="searchall" aria-selected="true">All</button></li>
                                    <li class="nav-item" role="presentation"><button class="nav-link" id="searchorders-tab" data-bs-toggle="tab" data-bs-target="#searchorders" type="button" role="tab" aria-controls="searchorders" aria-selected="false" tabindex="-1">Orders</button></li>
                                    <li class="nav-item" role="presentation"><button class="nav-link" id="searchcontacts-tab" data-bs-toggle="tab" data-bs-target="#searchcontacts" type="button" role="tab" aria-controls="searchcontacts" aria-selected="false" tabindex="-1">Contacts</button></li>
                                </ul>
                                <div class="tab-content py-3" id="searchtabContent">
                                    <div class="tab-pane fade active show" id="searchall" role="tabpanel" aria-labelledby="searchall-tab">
                                        <ul class="list-group adminuiux-list-group list-group-flush bg-none show">
                                            <li class="list-group-item">
                                                <div class="row gx-3 gx-lg-4">
                                                    <div class="col">Search apps</div>
                                                    <div class="col-auto">
                                                        <div class="form-check form-switch"><input class="form-check-input" type="checkbox" role="switch" id="isearchswitch1" /> <label class="form-check-label" for="isearchswitch1"></label></div>
                                                    </div>
                                                </div>
                                            </li>
                                            <li class="list-group-item">
                                                <div class="row gx-3 gx-lg-4">
                                                    <div class="col">Include Pages</div>
                                                    <div class="col-auto">
                                                        <div class="form-check form-switch"><input class="form-check-input" type="checkbox" role="switch" id="isearchswitch2" checked="" /> <label class="form-check-label" for="isearchswitch2"></label></div>
                                                    </div>
                                                </div>
                                            </li>
                                            <li class="list-group-item">
                                                <div class="row gx-3 gx-lg-4">
                                                    <div class="col">Internet resource</div>
                                                    <div class="col-auto">
                                                        <div class="form-check form-switch"><input class="form-check-input" type="checkbox" role="switch" id="isearchswitch3" checked="" /> <label class="form-check-label" for="isearchswitch3"></label></div>
                                                    </div>
                                                </div>
                                            </li>
                                            <li class="list-group-item">
                                                <div class="row gx-3 gx-lg-4">
                                                    <div class="col">News and Blogs</div>
                                                    <div class="col-auto">
                                                        <div class="form-check form-switch"><input class="form-check-input" type="checkbox" role="switch" id="isearchswitch4" /> <label class="form-check-label" for="isearchswitch4"></label></div>
                                                    </div>
                                                </div>
                                            </li>
                                        </ul>
                                    </div>
                                    <div class="tab-pane fade" id="searchorders" role="tabpanel" aria-labelledby="searchorders-tab">
                                        <ul class="list-group adminuiux-list-group list-group-flush bg-none show">
                                            <li class="list-group-item">
                                                <div class="row gx-3 gx-lg-4">
                                                    <div class="col">Show order ID</div>
                                                    <div class="col-auto">
                                                        <div class="form-check form-switch"><input class="form-check-input" type="checkbox" role="switch" id="isearchswitch5" /> <label class="form-check-label" for="isearchswitch5"></label></div>
                                                    </div>
                                                </div>
                                            </li>
                                            <li class="list-group-item">
                                                <div class="row gx-3 gx-lg-4">
                                                    <div class="col">International Order</div>
                                                    <div class="col-auto">
                                                        <div class="form-check form-switch"><input class="form-check-input" type="checkbox" role="switch" id="isearchswitch6" checked="" /> <label class="form-check-label" for="isearchswitch6"></label></div>
                                                    </div>
                                                </div>
                                            </li>
                                            <li class="list-group-item">
                                                <div class="row gx-3 gx-lg-4">
                                                    <div class="col">Taxable Product</div>
                                                    <div class="col-auto">
                                                        <div class="form-check form-switch"><input class="form-check-input" type="checkbox" role="switch" id="isearchswitch7" checked="" /> <label class="form-check-label" for="isearchswitch7"></label></div>
                                                    </div>
                                                </div>
                                            </li>
                                            <li class="list-group-item">
                                                <div class="row gx-3 gx-lg-4">
                                                    <div class="col">Published Product</div>
                                                    <div class="col-auto">
                                                        <div class="form-check form-switch"><input class="form-check-input" type="checkbox" role="switch" id="isearchswitch8" /> <label class="form-check-label" for="isearchswitch8"></label></div>
                                                    </div>
                                                </div>
                                            </li>
                                        </ul>
                                    </div>
                                    <div class="tab-pane fade" id="searchcontacts" role="tabpanel" aria-labelledby="searchcontacts-tab">
                                        <ul class="list-group adminuiux-list-group list-group-flush bg-none show">
                                            <li class="list-group-item">
                                                <div class="row gx-3 gx-lg-4">
                                                    <div class="col">Have email ID</div>
                                                    <div class="col-auto">
                                                        <div class="form-check form-switch"><input class="form-check-input" type="checkbox" role="switch" id="isearchswitch9" /> <label class="form-check-label" for="isearchswitch9"></label></div>
                                                    </div>
                                                </div>
                                            </li>
                                            <li class="list-group-item">
                                                <div class="row gx-3 gx-lg-4">
                                                    <div class="col">Have phone number</div>
                                                    <div class="col-auto">
                                                        <div class="form-check form-switch"><input class="form-check-input" type="checkbox" role="switch" id="isearchswitch10" checked="" /> <label class="form-check-label" for="isearchswitch10"></label></div>
                                                    </div>
                                                </div>
                                            </li>
                                            <li class="list-group-item">
                                                <div class="row gx-3 gx-lg-4">
                                                    <div class="col">Photo available</div>
                                                    <div class="col-auto">
                                                        <div class="form-check form-switch"><input class="form-check-input" type="checkbox" role="switch" id="isearchswitch11" checked="" /> <label class="form-check-label" for="isearchswitch11"></label></div>
                                                    </div>
                                                </div>
                                            </li>
                                            <li class="list-group-item">
                                                <div class="row gx-3 gx-lg-4">
                                                    <div class="col">Referral</div>
                                                    <div class="col-auto">
                                                        <div class="form-check form-switch"><input class="form-check-input" type="checkbox" role="switch" id="isearchswitch12" /> <label class="form-check-label" for="isearchswitch12"></label></div>
                                                    </div>
                                                </div>
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                                <div class="">
                                    <div class="row gx-3 gx-lg-4">
                                        <div class="col"><button class="btn btn-link">Reset</button></div>
                                        <div class="col-auto"><button class="btn btn-theme">Apply</button></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- menu -->
                <div class="navbar-expand-xl d-none d-xl-block ms-3">
                    <div class="collapse navbar-collapse" id="mainheaderNavbar">
                        <ul class="navbar-nav">
                            <li class="nav-item dropdown">
                                <a class="nav-link dropdown-toggle no-caret" data-bs-toggle="dropdown" role="button" aria-expanded="false" data-bs-auto-close="outside">Pages</a>
                                <div class="dropdown-menu">
                                    <div><a class="dropdown-item" routerLink="/app/profile-professional">Profile</a></div>
                                    <div class="dropend">
                                        <a class="dropdown-item" data-bs-toggle="dropdown" aria-expanded="false" role="button" data-bs-auto-close="outside"> Company <span class="arrow bi bi-chevron-right"></span> </a>
                                        <div class="dropdown-menu">
                                            <div><a class="dropdown-item active" routerLink="/app/company-profile">Company Profile</a></div>
                                            <div><a class="dropdown-item" routerLink="/app/company-user-roles">User Roles </a></div>
                                            <div><a class="dropdown-item" routerLink="/app/company-resources">Resources</a></div>
                                        </div>
                                    </div>
                                    <div class="dropend">
                                        <a class="dropdown-item" data-bs-toggle="dropdown" aria-expanded="false" role="button" data-bs-auto-close="outside"> Proveedores <span class="arrow bi bi-chevron-right"></span> </a>
                                        <div class="dropdown-menu">
                                            <div><a class="dropdown-item" routerLink="/app/suppliers-dashboard">Dashboard</a></div>
                                            <div><a class="dropdown-item" routerLink="/app/suppliers-crud">CRUD</a></div>
                                            <div><a class="dropdown-item" routerLink="/app/suppliers-orders-history">Historial de pedidos</a></div>
                                        </div>
                                    </div>
                                    <div><a class="dropdown-item" routerLink="/app/company-management">Management</a></div>
                                    <div><a class="dropdown-item" routerLink="/app/company-career">Career</a></div>
                                    <div><a class="dropdown-item" routerLink="/app/forum">Forum</a></div>
                                    <div>
                                        <hr class="dropdown-divider" />
                                    </div>
                                    <div><a class="dropdown-item" routerLink="/app/company-help-center">Help Center</a></div>
                                    <div><a class="dropdown-item" routerLink="/auth/onboarding">Onboarding</a></div>
                                </div>
                            </li>
                            <li class="nav-item dropdown">
                                <a class="nav-link dropdown-toggle no-caret" data-bs-toggle="dropdown" role="button" aria-expanded="false">Supportive</a>
                                <div class="dropdown-menu width-300">
                                    <div class="dropdown-title mb-3 p-2">
                                        <p>Supportive &amp; Helpful Pages</p>
                                        <p class="text-secondary small">Do not make your user lost somewhere else from where they can't come back. Make important journey flawless.</p>
                                    </div>
                                    <div class="row g-0">
                                        <div class="col-12 col-md-12 col-lg-6">
                                            <div>
                                                <a class="dropdown-item" routerLink="../auth/signin"><i class="bi bi-person me-2 text-theme-1"></i>Sign in</a>
                                            </div>
                                            <div>
                                                <a class="dropdown-item" routerLink="../auth/signup"><i class="bi bi-person-plus me-2 text-theme-1"></i>Sign up</a>
                                            </div>
                                            <div>
                                                <a class="dropdown-item" routerLink="../auth/forgot-password"><i class="bi bi-key me-2 text-theme-1"></i>Password</a>
                                            </div>
                                            <div>
                                                <a class="dropdown-item" routerLink="../under-construction"><i class="bi bi-gear me-2"></i>Maintenance</a>
                                            </div>
                                            <div>
                                                <a class="dropdown-item" routerLink="../coming-soon"><i class="bi bi-alarm me-2"></i>Coming Soon</a>
                                            </div>
                                        </div>
                                        <div class="col-12 col-md-12 col-lg-6">
                                            <div>
                                                <a class="dropdown-item" routerLink="../page-not-found-2"><i class="bi bi-bug me-2"></i>Error</a>
                                            </div>
                                            <div>
                                                <a class="dropdown-item" routerLink="../auth/onboarding"><i class="bi bi-emoji-smile me-2"></i>Onboarding</a>
                                            </div>
                                            <div>
                                                <a class="dropdown-item" routerLink="/app/contact-us"><i class="bi bi-envelope me-2"></i>Contact</a>
                                            </div>
                                            <div>
                                                <a class="dropdown-item" routerLink="/app/timeline"><i class="bi bi-calendar-week me-2"></i>Timeline</a>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </li>
                        </ul>
                    </div>
                </div>

                <!-- right icons button -->
                <div class="ms-auto header-actions">
                    <!-- global search toggle -->
                    <button class="btn btn-link btn-square btn-icon btn-link-header d-lg-none" type="button" (click)="toggleSearch()">
                        <i class="bi bi-search"></i>
                    </button>

                    <!-- dark mode -->
                    <button class="btn btn-link btn-square btnsunmoon btn-link-header" id="btn-layout-modes-dark-page" (click)="toggleDarkMode()">
                        <i class="sun mx-auto bi bi-sun"></i>
                        <i class="moon mx-auto bi bi-moon"></i>
                    </button>

                    <!-- application list dropdown -->
                    <div class="dropdown d-none d-sm-inline-block">
                        <button class="btn btn-link btn-square btn-icon btn-link-header dropdown-toggle no-caret" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                            <i class="bi bi-grid"></i>
                        </button>
                        <div class="dropdown-menu dropdown-menu-end width-300 pt-0 px-0 overflow-hidden">
                            <div class="p-3 rounded mb-2">
                                <h5 class="mb-0">Applications</h5>
                                <p class="text-secondary small">Make your app innovative</p>
                            </div>
                            <div class="px-2">
                                <div class="row g-2 text-center mb-2">
                                    <div class="col-4">
                                        <a class="dropdown-item square-item position-relative" routerLink="/app/finance-dashboard">
                                            <div class="avatar avatar-40 rounded my-2">
                                                <i class="bi bi-bank fs-5 mx-0"></i>
                                            </div>
                                            <p class="mb-0">Finance</p>
                                            <p class="fs-12 opacity-50 mb-2">Accounting</p>
                                        </a>
                                    </div>
                                    <div class="col-4">
                                        <a class="dropdown-item square-item position-relative" routerLink="/app/network-dashboard">
                                            <div class="avatar avatar-40 rounded my-2">
                                                <i class="bi bi-globe fs-5 mx-0"></i>
                                            </div>
                                            <p class="mb-0">Network</p>
                                            <p class="fs-12 opacity-50 mb-2">Stabilize</p>
                                        </a>
                                    </div>
                                    <div class="col-4">
                                        <a class="dropdown-item square-item position-relative" routerLink="/app/inventory-dashboard">
                                            <div class="avatar avatar-40 rounded my-2">
                                                <i class="bi bi-box fs-5 mx-0"></i>
                                            </div>
                                            <p class="mb-0">Inventory</p>
                                            <p class="fs-12 opacity-50 mb-2">Assuring</p>
                                        </a>
                                    </div>
                                    <div class="col-4">
                                        <a class="dropdown-item square-item position-relative" routerLink="/app/project-dashboard">
                                            <div class="avatar avatar-40 rounded my-2">
                                                <i class="bi bi-folder fs-5 mx-0"></i>
                                            </div>
                                            <p class="mb-0">Project</p>
                                            <p class="fs-12 opacity-50 mb-2">Management</p>
                                        </a>
                                    </div>
                                    <div class="col-4">
                                        <a class="dropdown-item square-item position-relative" routerLink="/app/social-dashboard">
                                            <div class="avatar avatar-40 rounded my-2">
                                                <i class="bi bi-people fs-5 mx-0"></i>
                                            </div>
                                            <p class="mb-0">Social</p>
                                            <p class="fs-12 opacity-50 mb-2">Tracking</p>
                                        </a>
                                    </div>
                                    <div class="col-4">
                                        <a class="dropdown-item square-item position-relative" routerLink="/app/learning-dashboard">
                                            <div class="avatar avatar-40 rounded my-2">
                                                <i class="bi bi-journal-bookmark fs-5 mx-0"></i>
                                            </div>
                                            <p class="mb-0">Learning</p>
                                            <p class="fs-12 opacity-50 mb-2">Make-easy</p>
                                        </a>
                                    </div>
                                </div>
                            </div>
                            <div class="text-center">
                                <a class="btn btn-link text-center" routerLink="/app/main-menu"> View all <i class="bi bi-arrow-right fs-14"></i> </a>
                            </div>
                        </div>
                    </div>

                    <!-- notification dropdown -->
                    <button class="btn btn-link btn-square btn-icon btn-link-header dropdown-toggle position-relative no-caret" type="button" data-bs-toggle="offcanvas" data-bs-target="#notification" aria-expanded="false">
                        <i class="bi bi-bell"></i>
                        <span class="position-absolute top-0 end-0 badge rounded-pill bg-danger p-1">
                            <small>9+</small>
                            <span class="visually-hidden">unread messages</span>
                        </span>
                    </button>

                    <!-- profile dropdown -->
                    <div class="dropdown d-inline-block">
                        <a class="dropdown-toggle btn btn-link btn-square btn-link-header style-none no-caret px-0" id="userprofiledd" data-bs-toggle="dropdown" aria-expanded="false" role="button">
                            <div class="row gx-0 d-inline-flex">
                                <div class="col-auto align-self-center">
                                    <figure class="avatar avatar-28 rounded-circle coverimg align-middle">
                                        <img src="assets/img/modern-ai-image/user-6.jpg" alt="" id="userphotoonboarding2" />
                                    </figure>
                                </div>
                            </div>
                        </a>
                        <div class="dropdown-menu dropdown-menu-end width-300 px-0 pt-0" aria-labelledby="userprofiledd">
                            <div class="p-3 rounded mb-2">
                                <a routerLink="/app/my-profile" class="dropdown-item">
                                    <div class="row gx-3">
                                        <div class="col-auto ">
                                            <figure class="avatar avatar-50 rounded-circle coverimg align-middle">
                                                <img src="assets/img/modern-ai-image/user-6.jpg" alt="" />
                                            </figure>
                                        </div>
                                        <div class="col align-self-center ">
                                            <h5 class="mb-1">AdminUIUX</h5>
                                            <p class="small"><i class="bi bi-trophy me-2"></i> 3 Courses</p>
                                        </div>
                                    </div>
                                </a>
                            </div>
                            <div class="px-2">
                                <div>
                                    <a class="dropdown-item" routerLink="/app/my-profile"><i class="avatar avatar-30 rounded-circle me-1 bi bi-person"></i> My Profile</a>
                                </div>
                                <div>
                                    <a class="dropdown-item" routerLink="/app/dashboard">
                                        <div class="row g-0">
                                            <div class="col align-self-center">
                                                <i class="avatar avatar-30 rounded-circle me-1 bi bi-layout-sidebar"></i>
                                                My Dashboard
                                            </div>
                                            <div class="col-auto avatar-group">
                                                <figure class="avatar avatar-20 coverimg rounded-circle">
                                                    <img src="assets/img/modern-ai-image/user-1.jpg" alt="" />
                                                </figure>
                                                <figure class="avatar avatar-20 coverimg rounded-circle">
                                                    <img src="assets/img/modern-ai-image/user-2.jpg" alt="" />
                                                </figure>
                                                <figure class="avatar avatar-20 coverimg rounded-circle">
                                                    <img src="assets/img/modern-ai-image/user-4.jpg" alt="" />
                                                </figure>
                                                <div class="avatar avatar-20 bg-theme-1 rounded-circle text-center align-middle">
                                                    <small class="fs-10 align-middle">9+</small>
                                                </div>
                                            </div>
                                        </div>
                                    </a>
                                </div>
                                <div>
                                    <a class="dropdown-item" routerLink="/app/my-earning"> <i class="avatar avatar-30 rounded-circle me-1 bi bi-cash-stack"></i> Earning </a>
                                </div>
                                <div>
                                    <a class="dropdown-item" routerLink="/app/my-subscription">
                                        <div class="row gx-3 gx-lg-4">
                                            <div class="col"><i class="avatar avatar-30 rounded-circle me-1 bi bi-gift"></i> Subscription</div>
                                            <div class="col-auto">
                                                <p class="small text-success">Upgrade</p>
                                            </div>
                                        </div>
                                    </a>
                                </div>
                                <div>
                                    <a class="dropdown-item" routerLink="/app/statement"> <i class="avatar avatar-30 rounded-circle me-1 bi bi-clipboard"></i> Statement </a>
                                </div>
                                <div>
                                    <a class="dropdown-item" routerLink="/app/account-settings"> <i class="avatar avatar-30 rounded-circle me-1 bi bi-gear"></i> Account Setting </a>
                                </div>
                                <div>
                                    <a class="dropdown-item theme-red" href="#" (click)="onLogout($event)"> <i class="avatar avatar-30 rounded-circle me-1 bi bi-power"></i> Logout </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </nav>

        <!-- search global wrap -->
        <div class="adminuiux-search-full">
            <div class="row gx-2 align-items-center">
                <div class="col-auto">
                    <!-- close global search toggle -->
                    <button class="btn btn-link btn-square " type="button" (click)="toggleSearch()">
                        <i class="bi bi-arrow-left"></i>
                    </button>
                </div>
                <div class="col">
                    <input class="form-control pe-0 border-0" type="search" placeholder="Type something here..." />
                </div>
                <div class="col-auto">
                    <!-- filter dropdown -->
                    <div class="dropdown input-group-text border-0 p-0">
                        <button class="dropdown-toggle btn btn-link btn-square no-caret" type="button" id="searchfilter2" data-bs-toggle="dropdown" aria-expanded="false">
                            <i class="bi bi-sliders2"></i>
                        </button>
                        <div class="dropdown-menu dropdown-menu-end dropdown-dontclose width-300">
                            <ul class="nav adminuiux-nav" id="searchtab2" role="tablist">
                                <li class="nav-item" role="presentation">
                                    <button class="nav-link active" id="searchall-tab2" data-bs-toggle="tab" data-bs-target="#searchall2" type="button" role="tab" aria-controls="searchall2" aria-selected="true">All</button>
                                </li>
                                <li class="nav-item" role="presentation">
                                    <button class="nav-link" id="searchorders-tab2" data-bs-toggle="tab" data-bs-target="#searchorders2" type="button" role="tab" aria-controls="searchorders2" aria-selected="false" tabindex="-1">Orders</button>
                                </li>
                                <li class="nav-item" role="presentation">
                                    <button class="nav-link" id="searchcontacts-tab2" data-bs-toggle="tab" data-bs-target="#searchcontacts2" type="button" role="tab" aria-controls="searchcontacts2" aria-selected="false" tabindex="-1">Contacts</button>
                                </li>
                            </ul>
                            <div class="tab-content py-3" id="searchtabContent2">
                                <div class="tab-pane fade active show" id="searchall2" role="tabpanel" aria-labelledby="searchall-tab2">
                                    <ul class="list-group adminuiux-list-group list-group-flush bg-none show">
                                        <li class="list-group-item">
                                            <div class="row gx-3 gx-lg-4">
                                                <div class="col">Search apps</div>
                                                <div class="col-auto">
                                                    <div class="form-check form-switch">
                                                        <input class="form-check-input" type="checkbox" role="switch" id="searchswitch1" />
                                                        <label class="form-check-label" for="searchswitch1"></label>
                                                    </div>
                                                </div>
                                            </div>
                                        </li>
                                        <li class="list-group-item">
                                            <div class="row gx-3 gx-lg-4">
                                                <div class="col">Include Pages</div>
                                                <div class="col-auto">
                                                    <div class="form-check form-switch">
                                                        <input class="form-check-input" type="checkbox" role="switch" id="searchswitch2" checked="" />
                                                        <label class="form-check-label" for="searchswitch2"></label>
                                                    </div>
                                                </div>
                                            </div>
                                        </li>
                                        <li class="list-group-item">
                                            <div class="row gx-3 gx-lg-4">
                                                <div class="col">Internet resource</div>
                                                <div class="col-auto">
                                                    <div class="form-check form-switch">
                                                        <input class="form-check-input" type="checkbox" role="switch" id="searchswitch3" checked="" />
                                                        <label class="form-check-label" for="searchswitch3"></label>
                                                    </div>
                                                </div>
                                            </div>
                                        </li>
                                        <li class="list-group-item">
                                            <div class="row gx-3 gx-lg-4">
                                                <div class="col">News and Blogs</div>
                                                <div class="col-auto">
                                                    <div class="form-check form-switch">
                                                        <input class="form-check-input" type="checkbox" role="switch" id="searchswitch4" />
                                                        <label class="form-check-label" for="searchswitch4"></label>
                                                    </div>
                                                </div>
                                            </div>
                                        </li>
                                    </ul>
                                </div>
                                <div class="tab-pane fade" id="searchorders2" role="tabpanel" aria-labelledby="searchorders-tab2">
                                    <ul class="list-group adminuiux-list-group list-group-flush bg-none show">
                                        <li class="list-group-item">
                                            <div class="row gx-3 gx-lg-4">
                                                <div class="col">Show order ID</div>
                                                <div class="col-auto">
                                                    <div class="form-check form-switch">
                                                        <input class="form-check-input" type="checkbox" role="switch" id="searchswitch5" />
                                                        <label class="form-check-label" for="searchswitch5"></label>
                                                    </div>
                                                </div>
                                            </div>
                                        </li>
                                        <li class="list-group-item">
                                            <div class="row gx-3 gx-lg-4">
                                                <div class="col">International Order</div>
                                                <div class="col-auto">
                                                    <div class="form-check form-switch">
                                                        <input class="form-check-input" type="checkbox" role="switch" id="searchswitch6" checked="" />
                                                        <label class="form-check-label" for="searchswitch6"></label>
                                                    </div>
                                                </div>
                                            </div>
                                        </li>
                                        <li class="list-group-item">
                                            <div class="row gx-3 gx-lg-4">
                                                <div class="col">Taxable Product</div>
                                                <div class="col-auto">
                                                    <div class="form-check form-switch">
                                                        <input class="form-check-input" type="checkbox" role="switch" id="searchswitch7" checked="" />
                                                        <label class="form-check-label" for="searchswitch7"></label>
                                                    </div>
                                                </div>
                                            </div>
                                        </li>
                                        <li class="list-group-item">
                                            <div class="row gx-3 gx-lg-4">
                                                <div class="col">Published Product</div>
                                                <div class="col-auto">
                                                    <div class="form-check form-switch">
                                                        <input class="form-check-input" type="checkbox" role="switch" id="searchswitch8" />
                                                        <label class="form-check-label" for="searchswitch8"></label>
                                                    </div>
                                                </div>
                                            </div>
                                        </li>
                                    </ul>
                                </div>
                                <div class="tab-pane fade" id="searchcontacts2" role="tabpanel" aria-labelledby="searchcontacts-tab2">
                                    <ul class="list-group adminuiux-list-group list-group-flush bg-none show">
                                        <li class="list-group-item">
                                            <div class="row gx-3 gx-lg-4">
                                                <div class="col">Have email ID</div>
                                                <div class="col-auto">
                                                    <div class="form-check form-switch">
                                                        <input class="form-check-input" type="checkbox" role="switch" id="searchswitch9" />
                                                        <label class="form-check-label" for="searchswitch9"></label>
                                                    </div>
                                                </div>
                                            </div>
                                        </li>
                                        <li class="list-group-item">
                                            <div class="row gx-3 gx-lg-4">
                                                <div class="col">Have phone number</div>
                                                <div class="col-auto">
                                                    <div class="form-check form-switch">
                                                        <input class="form-check-input" type="checkbox" role="switch" id="searchswitch10" checked="" />
                                                        <label class="form-check-label" for="searchswitch10"></label>
                                                    </div>
                                                </div>
                                            </div>
                                        </li>
                                        <li class="list-group-item">
                                            <div class="row gx-3 gx-lg-4">
                                                <div class="col">Photo available</div>
                                                <div class="col-auto">
                                                    <div class="form-check form-switch">
                                                        <input class="form-check-input" type="checkbox" role="switch" id="searchswitch11" checked="" />
                                                        <label class="form-check-label" for="searchswitch11"></label>
                                                    </div>
                                                </div>
                                            </div>
                                        </li>
                                        <li class="list-group-item">
                                            <div class="row gx-3 gx-lg-4">
                                                <div class="col">Referral</div>
                                                <div class="col-auto">
                                                    <div class="form-check form-switch">
                                                        <input class="form-check-input" type="checkbox" role="switch" id="searchswitch12" />
                                                        <label class="form-check-label" for="searchswitch12"></label>
                                                    </div>
                                                </div>
                                            </div>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                            <div class="">
                                <div class="row gx-3 gx-lg-4">
                                    <div class="col"><button class="btn btn-link">Reset</button></div>
                                    <div class="col-auto">
                                        <button class="btn btn-theme">Apply</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `,
})
export class MainHeaderComponent {
    htmlElement: any | null = null;
    buttonElement: any | null = null;

    constructor(
        private renderer: Renderer2,
        @Inject(DOCUMENT) private document: Document,
        private authService: AuthService,
        private router: Router
    ) { }

    ngOnInit() {
        this.openSidebar();

        // dark light mode initial
        this.htmlElement = this.document.querySelector("html");
        this.buttonElement = document.querySelector("#btn-layout-modes-dark-page");

        if (localStorage.getItem("layout-mode") === "dark") {
            this.renderer.addClass(this.buttonElement, "active");
            this.renderer.addClass(this.htmlElement, "dark-mode");
            this.renderer.removeClass(this.htmlElement, "dark-mode");
            this.renderer.setAttribute(this.htmlElement, "data-bs-theme", "dark");
        } else {
            this.renderer.removeClass(this.buttonElement, "active");
            this.renderer.removeClass(this.htmlElement, "dark-mode");
            this.renderer.addClass(this.htmlElement, "light-mode");
            this.renderer.setAttribute(this.htmlElement, "data-bs-theme", "light");
        }
    }
    @HostListener("window:resize", ["$event"])
    onResize(event: any) {
        this.openSidebar();
    }

    toggleSidebar() {
        const windowWidth = window.innerWidth;
        const body = document.body; // or use this.renderer.selectRootElement(document.body)

        if (windowWidth >= 992) {
            if (body.classList.contains("sidebar-close")) {
                this.renderer.removeClass(body, "sidebar-close");
                this.renderer.addClass(body, "sidebar-open");
            } else {
                this.renderer.removeClass(body, "sidebar-open");
                this.renderer.addClass(body, "sidebar-close");
            }
        } else {
            if (body.classList.contains("sidebar-close")) {
                this.renderer.removeClass(body, "sidebar-close");
                this.renderer.addClass(body, "sidebar-open");
            } else {
                this.renderer.removeClass(body, "sidebar-open");
                this.renderer.addClass(body, "sidebar-close");
            }
        }
    }

    openSidebar() {
        const windowWidth = window.innerWidth;
        const body = document.body;
        if (windowWidth >= 992) {
            this.renderer.addClass(body, "sidebar-open");
            this.renderer.removeClass(body, "sidebar-close");
        } else {
            this.renderer.addClass(body, "sidebar-close");
            this.renderer.removeClass(body, "sidebar-open");
        }
    }

    toggleDarkMode() {
        if (this.htmlElement && this.buttonElement) {
            if (this.buttonElement.classList.contains("active")) {
                this.renderer.removeClass(this.buttonElement, "active");
                this.renderer.removeClass(this.htmlElement, "dark-mode");
                this.renderer.addClass(this.htmlElement, "light-mode");
                this.renderer.setAttribute(this.htmlElement, "data-bs-theme", "light");
                localStorage.setItem("layout-mode", "light");
            } else {
                this.renderer.addClass(this.buttonElement, "active");
                this.renderer.removeClass(this.htmlElement, "light-mode");
                this.renderer.addClass(this.htmlElement, "dark-mode");
                this.renderer.setAttribute(this.htmlElement, "data-bs-theme", "dark");
                localStorage.setItem("layout-mode", "dark");
            }
        }
    }
    toggleSearch() {
        const searchEl = this.document.querySelector(".adminuiux-search-full");
        if (searchEl?.classList.contains("active")) {
            this.renderer.removeClass(searchEl, "active");
        } else {
            this.renderer.addClass(searchEl, "active");
        }
    }

    onLogout(event: Event): void {
        event.preventDefault();
        this.authService.logout();
        void this.router.navigate(["/auth/signin"]);
    }
}

