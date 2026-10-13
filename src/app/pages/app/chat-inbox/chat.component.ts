import { Component, Renderer2, Inject, CUSTOM_ELEMENTS_SCHEMA } from "@angular/core";
import { DOCUMENT } from "@angular/common";
import Swiper from "swiper";
import { register } from "swiper/element/bundle";
register();

@Component({
    selector: "app-chat",
    standalone: true,
    imports: [],
    template: `
        <!-- page title -->
        <div class="container-fluid py-3">
            <div class="row align-items-center page-title">
                <div class="col col-sm mb-3 mb-sm-0 order-1">
                    <h5 class="mb-0">Chat Messages</h5>
                    <p class="text-secondary small">Let's make communication much faster</p>
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
                </div>
            </div>
            <nav aria-label="breadcrumb" class="breadcrumb-theme mt-3 rounded">
                <ol class="breadcrumb mb-0">
                    <li class="breadcrumb-item bi">
                        <a routerLink="/app/dashboard"><i class="bi bi-house-door me-2"></i> AdminUX</a>
                    </li>
                    <li class="breadcrumb-item bi active" aria-current="page">Chat Messages</li>
                </ol>
            </nav>
        </div>

        <!-- content -->
        <div class="container mt-3" id="main-content">
            <div class="inner-sidebar-wrap">
                <div class="inner-sidebar py-0 height-dynamic bg-none" style="--h-dynamic: calc(100vh - 250px)">
                    <div class="card adminuiux-card overflow-hidden h-100">
                        <div class="card-header ">
                            <div class="row gx-3 align-items-center">
                                <div class="col-auto d-block d-lg-none">
                                    <button class="btn btn-link btn-square innersidebar-btn" (click)="innersidebar()"><i class="bi bi-layout-sidebar h5 align-middle"></i></button>
                                </div>
                                <div class="col">
                                    <div class="input-group">
                                        <input class="form-control border-0" placeholder="Search contact... " value="" />
                                        <div class="dropdown input-group-text border-0 p-0">
                                            <button class="btn btn-square btn-link caret-none" type="button" id="statuschat" data-bs-toggle="dropdown" data-bs-auto-close="true" aria-expanded="false"><i class="bi bi-three-dots-vertical"></i></button>
                                            <ul class="dropdown-menu dropdown-menu-end" aria-labelledby="statuschat" style="">
                                                <li>
                                                    <a class="dropdown-item" href="javascript:void(0)"><span class="align-middle me-1 bg-success rounded-circle d-inline-block p-1"></span> Online</a>
                                                </li>
                                                <li>
                                                    <a class="dropdown-item" href="javascript:void(0)"><span class="align-middle me-1 bg-warning rounded-circle d-inline-block p-1"></span> Away</a>
                                                </li>
                                                <li>
                                                    <a class="dropdown-item" href="javascript:void(0)"><span class="align-middle me-1 bg-danger rounded-circle d-inline-block p-1"></span> Offline</a>
                                                </li>
                                                <li>
                                                    <a class="dropdown-item" href="javascript:void(0)"><span class="align-middle me-1 bg-secondary rounded-circle d-inline-block p-1"></span> Disabled</a>
                                                </li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="card-body overflow-y-auto p-1">
                            <ul class="list-group adminuiux-list-group list-group-flush chat-list-contacts bg-none rounded-0">
                                <li class="list-group-item active px-2">
                                    <div class="row flex-nowrap">
                                        <div class="col-auto">
                                            <figure class="avatar avatar-40 coverimg rounded-circle">
                                                <img src="assets/img/modern-ai-image/user-7.jpg" alt="" />
                                            </figure>
                                        </div>
                                        <div class="col-9 align-self-center ps-0">
                                            <div class="row g-0">
                                                <div class="col-8">
                                                    <p class="text-truncate mb-0">UX Design Group</p>
                                                </div>
                                                <div class="col-4 text-end">
                                                    <small class="opacity-50 fs-10 mb-1"><i class="bi bi-check"></i> 2:00 am</small>
                                                </div>
                                            </div>
                                            <p class="opacity-75 small text-truncate">Spread love and spread this template</p>
                                        </div>
                                    </div>
                                </li>
                                <li class="list-group-item new px-2">
                                    <div class="row gx-3">
                                        <div class="col-auto">
                                            <figure class="avatar avatar-40 rounded-circle bg-theme-1"><span class="h6 align-middle">JM</span></figure>
                                        </div>
                                        <div class="col-9 align-self-center ps-0">
                                            <div class="row g-0">
                                                <div class="col-8">
                                                    <p class="text-truncate mb-0">Mr. Jack Mario</p>
                                                </div>
                                                <div class="col-4 text-end">
                                                    <small class="opacity-50 fs-10 mb-1"><i class="bi bi-check-all"></i> 2:00 am</small>
                                                </div>
                                            </div>
                                            <p class="opacity-75 small text-truncate">Spread love and spread this template</p>
                                        </div>
                                    </div>
                                </li>
                                <li class="list-group-item new px-2">
                                    <div class="row gx-3">
                                        <div class="col-auto">
                                            <figure class="avatar avatar-40 coverimg rounded-circle">
                                                <img src="assets/img/modern-ai-image/user-3.jpg" alt="" />
                                            </figure>
                                        </div>
                                        <div class="col-9 align-self-center ps-0">
                                            <div class="row g-0">
                                                <div class="col-8">
                                                    <p class="text-truncate mb-0">Roberto Carlos</p>
                                                </div>
                                                <div class="col-4 text-end">
                                                    <small class="opacity-50 fs-10 mb-1"><i class="bi bi-check-all text-info"></i> 2:00 am</small>
                                                </div>
                                            </div>
                                            <p class="opacity-75 small text-truncate">Spread love and spread this template</p>
                                        </div>
                                    </div>
                                </li>
                                <li class="list-group-item px-2">
                                    <div class="row gx-3">
                                        <div class="col-auto">
                                            <figure class="avatar avatar-40 coverimg rounded-circle">
                                                <img src="assets/img/modern-ai-image/user-2.jpg" alt="" />
                                            </figure>
                                        </div>
                                        <div class="col-9 align-self-center ps-0">
                                            <div class="row g-0">
                                                <div class="col-8">
                                                    <p class="text-truncate mb-0">The Adminuiux</p>
                                                </div>
                                                <div class="col-4 text-end">
                                                    <small class="opacity-50 fs-10 mb-1"><i class="bi bi-check-all text-success"></i> 2 days</small>
                                                </div>
                                            </div>
                                            <p class="opacity-75 small text-truncate">Spread love and spread this template</p>
                                        </div>
                                    </div>
                                </li>
                                <li class="list-group-item px-2">
                                    <div class="row gx-3">
                                        <div class="col-auto">
                                            <figure class="avatar avatar-40 rounded-circle bg-warning text-white"><span class="h6 align-middle">JC</span></figure>
                                        </div>
                                        <div class="col-9 align-self-center ps-0">
                                            <div class="row g-0">
                                                <div class="col-8">
                                                    <p class="text-truncate mb-0">Ms. Jully CTO</p>
                                                </div>
                                                <div class="col-4 text-end">
                                                    <small class="opacity-50 fs-10 mb-1"><i class="bi bi-check-all"></i> 4 days</small>
                                                </div>
                                            </div>
                                            <p class="opacity-75 small text-truncate">Spread love and spread this template</p>
                                        </div>
                                    </div>
                                </li>
                                <li class="list-group-item px-2" data-bs-toggle="modal" data-bs-target="#chatmodalwindow">
                                    <div class="row gx-3">
                                        <div class="col-auto">
                                            <figure class="avatar avatar-40 rounded-circle bg-success text-white"><span class="h6 align-middle">JC</span></figure>
                                        </div>
                                        <div class="col-9 align-self-center ps-0">
                                            <div class="row g-0">
                                                <div class="col-8">
                                                    <p class="text-truncate mb-0">Aswatthma D-Plan</p>
                                                </div>
                                                <div class="col-4 text-end">
                                                    <small class="opacity-50 fs-10 mb-1"><i class="bi bi-check"></i> 1 mo</small>
                                                </div>
                                            </div>
                                            <p class="opacity-75 small text-truncate">Spread love and spread this template</p>
                                        </div>
                                    </div>
                                </li>
                                <li class="list-group-item px-2">
                                    <div class="row gx-3">
                                        <div class="col-auto">
                                            <figure class="avatar avatar-40 coverimg rounded-circle bg-theme-1">
                                                <img src="assets/img/modern-ai-image/user-1.jpg" alt="" />
                                            </figure>
                                        </div>
                                        <div class="col-9 align-self-center ps-0">
                                            <div class="row g-0">
                                                <div class="col-8">
                                                    <p class="text-truncate mb-0">Adminuiux Support</p>
                                                </div>
                                                <div class="col-4 text-end">
                                                    <small class="opacity-50 fs-10 mb-1"><i class="bi bi-check"></i> 2:00 am</small>
                                                </div>
                                            </div>
                                            <p class="opacity-75 small text-truncate">Thank you for connecting</p>
                                        </div>
                                    </div>
                                </li>
                                <li class="list-group-item px-2">
                                    <div class="row gx-3">
                                        <div class="col-auto">
                                            <figure class="avatar avatar-40 rounded-circle bg-theme-1"><span class="h6 align-middle">JM</span></figure>
                                        </div>
                                        <div class="col-9 align-self-center ps-0">
                                            <div class="row g-0">
                                                <div class="col-8">
                                                    <p class="text-truncate mb-0">Mr. Jack Mario</p>
                                                </div>
                                                <div class="col-4 text-end">
                                                    <small class="opacity-50 fs-10 mb-1"><i class="bi bi-check-all"></i> 2:00 am</small>
                                                </div>
                                            </div>
                                            <p class="opacity-75 small text-truncate">Spread love and spread this template</p>
                                        </div>
                                    </div>
                                </li>
                                <li class="list-group-item px-2">
                                    <div class="row gx-3">
                                        <div class="col-auto">
                                            <figure class="avatar avatar-40 coverimg rounded-circle">
                                                <img src="assets/img/modern-ai-image/user-4.jpg" alt="" />
                                            </figure>
                                        </div>
                                        <div class="col-9 align-self-center ps-0">
                                            <div class="row g-0">
                                                <div class="col-8">
                                                    <p class="text-truncate mb-0">Rubby Carlos</p>
                                                </div>
                                                <div class="col-4 text-end">
                                                    <small class="opacity-50 fs-10 mb-1"><i class="bi bi-check-all text-info"></i> 2:00 am</small>
                                                </div>
                                            </div>
                                            <p class="opacity-75 small text-truncate">Spread love and spread this template</p>
                                        </div>
                                    </div>
                                </li>
                                <li class="list-group-item px-2">
                                    <div class="row gx-3">
                                        <div class="col-auto">
                                            <figure class="avatar avatar-40 coverimg rounded-circle">
                                                <img src="assets/img/modern-ai-image/user-1.jpg" alt="" />
                                            </figure>
                                        </div>
                                        <div class="col-9 align-self-center ps-0">
                                            <div class="row g-0">
                                                <div class="col-8">
                                                    <p class="text-truncate mb-0">The Adminuiux</p>
                                                </div>
                                                <div class="col-4 text-end">
                                                    <small class="opacity-50 fs-10 mb-1"><i class="bi bi-check-all text-success"></i> 2 days</small>
                                                </div>
                                            </div>
                                            <p class="opacity-75 small text-truncate">Spread love and spread this template</p>
                                        </div>
                                    </div>
                                </li>
                                <li class="list-group-item px-2">
                                    <div class="row gx-3">
                                        <div class="col-auto">
                                            <figure class="avatar avatar-40 rounded-circle bg-warning text-white"><span class="h6 align-middle">JC</span></figure>
                                        </div>
                                        <div class="col-9 align-self-center ps-0">
                                            <div class="row g-0">
                                                <div class="col-8">
                                                    <p class="text-truncate mb-0">Ms. Jully CTO</p>
                                                </div>
                                                <div class="col-4 text-end">
                                                    <small class="opacity-50 fs-10 mb-1"><i class="bi bi-check-all"></i> 4 days</small>
                                                </div>
                                            </div>
                                            <p class="opacity-75 small text-truncate">Spread love and spread this template</p>
                                        </div>
                                    </div>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
                <div class="inner-sidebar-content h-100">
                    <div class="row gx-3 h-100 mx-0">
                        <div class="col-12 col-md-6 col-lg-12 col-xl-7 col-xxl-8 height-dynamic mb-4 mb-xl-0" style="--h-dynamic: calc(100vh - 250px)">
                            <div class="card adminuiux-card h-100 mb-3">
                                <div class="card-header pb-0">
                                    <div class="row align-items-center gx-2 mb-3">
                                        <div class="col-auto d-block d-lg-none">
                                            <button class="btn btn-link btn-square innersidebar-btn" onclick="innersidebar()"><i class="bi bi-layout-sidebar h5 align-middle"></i></button>
                                        </div>
                                        <div class="col-auto">
                                            <div class="row align-items-center gx-2 gx-lg-3">
                                                <div class="col-auto">
                                                    <figure class="avatar avatar-40 coverimg rounded">
                                                        <img src="assets/img/modern-ai-image/user-3.jpg" alt="" />
                                                    </figure>
                                                </div>
                                                <div class="col align-self-center">
                                                    <h6 class="mb-0">
                                                        <span class="position-relative"
                                                            >UX Design Group <span class="position-absolute top-50 start-100 translate-middle p-1 bg-success rounded-circle mx-2"><span class="visually-hidden">New alerts</span></span></span
                                                        >
                                                    </h6>
                                                    <p class="text-secondary small">35 members, 10 online</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="col-auto">
                                            <button type="button" class="btn btn-link btn-square text-success" data-bs-toggle="modal" data-bs-target="#callmodal"><i class="bi bi-camera-video text-success"></i></button>
                                        </div>
                                        <div class="col"></div>
                                        <div class="col-auto">
                                            <button class="btn btn-link btn-square" data-bs-toggle="collapse" data-bs-target="#searchchat" aria-expanded="false" aria-controls="searchchat"><i class="bi bi-search"></i></button>
                                        </div>
                                        <div class="col-auto">
                                            <div class="dropdown">
                                                <button class="btn btn-square btn-link caret-none" type="button" id="statuschat2" data-bs-toggle="dropdown" data-bs-auto-close="true" aria-expanded="false"><i class="bi bi-three-dots-vertical"></i></button>
                                                <ul class="dropdown-menu dropdown-menu-end" aria-labelledby="statuschat2" style="">
                                                    <li><a class="dropdown-item" href="javascript:void(0)">Clear Chat</a></li>
                                                    <li><a class="dropdown-item" href="javascript:void(0)">Delete</a></li>
                                                    <li><a class="dropdown-item theme-red" href="javascript:void(0)">Report</a></li>
                                                </ul>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="collapse" id="searchchat">
                                        <div class="d-block pb-3">
                                            <input type="search" class="form-control d-block" placeholder="Search in chat... " value="" />
                                        </div>
                                    </div>
                                </div>

                                <div class="card-body overflow-y-auto chat-list">
                                    <div class="row gx-0 left-chat">
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
                                            <div class="alert alert-light mx-auto small px-2 py-0 mb-3">26 November 2025</div>
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
                                                        <div class="position-relative mb-0 d-block">
                                                            <div class="position-absolute end-0 top-0">
                                                                <button class="btn btn-square btn-theme m-2"><i class="bi bi-download"></i></button>
                                                            </div>
                                                            <img src="assets/img/modern-ai-image/image-1.jpg" alt="" />
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
                                            <div class="alert alert-light mx-auto small px-2 py-0 mb-3">27 November 2024</div>
                                        </div>
                                    </div>
                                    <div class="row no-margin left-chat first">
                                        <div class="col-12">
                                            <div class="chat-block">
                                                <div class="row gx-3">
                                                    <div class="col">
                                                        <p class="small mb-2"><a href="" class="style-none">Ms. Jully CTO</a></p>
                                                        <div class="position-relative figure"><video src="https://adminuiux.com/adminuiux/adminuiux.mp4" controls="" preload="none"></video></div>
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
                                <div class="card-footer bg-none border-top">
                                    <div class="input-group">
                                        <button class="btn btn-square btn-link border"><i class="bi bi-emoji-smile"></i></button>
                                        <button class="btn btn-square btn-link border"><i class="bi bi-paperclip"></i></button>
                                        <input class="form-control bg-none" placeholder="Type your message... " value="" />
                                        <button class="btn btn-square btn-link border" type="button"><i class="bi bi-send"></i></button>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="col-12 col-md-6 col-lg-12 col-xl-5 col-xxl-4">
                            <div class="card adminuiux-card mb-3 mb-lg-4">
                                <div class="card-header">
                                    <h6>Media Details</h6>
                                </div>
                                <div class="card-body p-1">
                                    <div class="accordion adminuiux-accordion" id="detailaccord">
                                        <div class="accordion-item bg-none">
                                            <p class="accordion-header">
                                                <button class="accordion-button collapsed p-2" type="button" data-bs-toggle="collapse" data-bs-target="#detail1" aria-expanded="false" aria-controls="detail1"><i class="bi bi-image me-2"></i> 365 Photos</button>
                                            </p>
                                            <div id="detail1" class="accordion-collapse collapsed collapse bg-none" data-bs-parent="#detailaccord">
                                                <div class="accordion-body p-3">
                                                    <swiper-container slides-per-view="auto" space-between="16" autoplay="true" class="swiper swipernav">
                                                        <swiper-slide class="w-auto">
                                                            <figure class="avatar avatar-80 coverimg rounded">
                                                                <img src="assets/img/modern-ai-image/image-1.jpg" alt="" />
                                                            </figure>
                                                        </swiper-slide>
                                                        <swiper-slide class="w-auto">
                                                            <figure class="avatar avatar-80 coverimg rounded">
                                                                <img src="assets/img/modern-ai-image/image-2.jpg" alt="" />
                                                            </figure>
                                                        </swiper-slide>
                                                        <swiper-slide class="w-auto">
                                                            <figure class="avatar avatar-80 coverimg rounded">
                                                                <img src="assets/img/modern-ai-image/pet-4.jpg" alt="" />
                                                            </figure>
                                                        </swiper-slide>
                                                        <swiper-slide class="w-auto">
                                                            <figure class="avatar avatar-80 coverimg rounded">
                                                                <img src="assets/img/modern-ai-image/tree-4.jpg" alt="" />
                                                            </figure>
                                                        </swiper-slide>
                                                        <swiper-slide class="w-auto">
                                                            <div class="avatar hegiht-80 width-80 rounded bg-theme-1-subtle text-theme-1 text-center">
                                                                <div class="py-3">
                                                                    <p class="h5 mb-0">150+</p>
                                                                    <p class="opacity-75 small">More files</p>
                                                                </div>
                                                            </div>
                                                        </swiper-slide>
                                                    </swiper-container>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="accordion-item bg-none">
                                            <p class="accordion-header">
                                                <button class="accordion-button p-2 collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#detail2" aria-expanded="false" aria-controls="detail2"><i class="bi bi-camera-reels me-2"></i> 235 Videos</button>
                                            </p>
                                            <div id="detail2" class="accordion-collapse collapse bg-none" data-bs-parent="#detailaccord">
                                                <div class="accordion-body p-3">
                                                    <swiper-container slides-per-view="auto" space-between="16" autoplay="true" class="swiper swipernav">
                                                        <swiper-slide class="width-100">
                                                            <figure class="coverimg height-80 w-100 rounded d-flex justify-content-center align-items-center">
                                                                <img src="assets/img/modern-ai-image/image-1.jpg" alt="" />
                                                                <i class="bi bi-play text-white fs-4 rounded-circle avatar avatar-40 bg-theme-1 theme-red d-block mx-auto"></i>
                                                            </figure>
                                                        </swiper-slide>
                                                        <swiper-slide class="width-100">
                                                            <figure class="coverimg height-80 w-100 rounded d-flex justify-content-center align-items-center">
                                                                <img src="assets/img/modern-ai-image/image-2.jpg" alt="" />
                                                                <i class="bi bi-play text-white fs-4 rounded-circle avatar avatar-40 bg-theme-1 theme-red d-block mx-auto"></i>
                                                            </figure>
                                                        </swiper-slide>
                                                        <swiper-slide class="width-100">
                                                            <figure class="coverimg height-80 w-100 rounded d-flex justify-content-center align-items-center">
                                                                <img src="assets/img/modern-ai-image/PET-2.jpg" alt="" />
                                                                <i class="bi bi-play text-white fs-4 rounded-circle avatar avatar-40 bg-theme-1 theme-red d-block mx-auto"></i>
                                                            </figure>
                                                        </swiper-slide>
                                                        <swiper-slide class="width-100">
                                                            <figure class="coverimg height-80 w-100 rounded d-flex justify-content-center align-items-center">
                                                                <img src="assets/img/modern-ai-image/tree-2.jpg" alt="" />
                                                                <i class="bi bi-play text-white fs-4 rounded-circle avatar avatar-40 bg-theme-1 theme-red d-block mx-auto"></i>
                                                            </figure>
                                                        </swiper-slide>
                                                        <swiper-slide class="width-100">
                                                            <div class="bg-theme-1-subtle text-theme-1 height-80 w-100 rounded text-center">
                                                                <div class="py-3">
                                                                    <p class="h5 mb-0">150+</p>
                                                                    <p class="opacity-75 small">More files</p>
                                                                </div>
                                                            </div>
                                                        </swiper-slide>
                                                    </swiper-container>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="accordion-item bg-none">
                                            <p class="accordion-header">
                                                <button class="accordion-button p-2 collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#detail3" aria-expanded="false" aria-controls="detail3"><i class="bi bi-globe me-2"></i> 11 Links</button>
                                            </p>
                                            <div id="detail3" class="accordion-collapse collapse bg-none" data-bs-parent="#detailaccord">
                                                <div class="accordion-body p-3">
                                                    <p>
                                                        <a href="" class="badge badge-lg badge-light text-bg-theme-1 me-1 mb-1">Youtube Channel <i class="bi bi-box-arrow-up-right ms-1"></i></a>
                                                        <a href="" class="badge badge-lg badge-light text-bg-theme-1 me-1 mb-1">adminuiux.com <i class="bi bi-box-arrow-up-right ms-1"></i></a>
                                                        <a href="" class="badge badge-lg badge-light text-bg-theme-1 me-1 mb-1">best mobile template <i class="bi bi-box-arrow-up-right ms-1"></i></a>
                                                        <a href="" class="badge badge-lg badge-light text-bg-theme-1 me-1 mb-1">Read to care <i class="bi bi-box-arrow-up-right"></i></a>
                                                        <a href="" class="badge badge-lg badge-light text-bg-theme-1 me-1 mb-1">6+ more..</a>
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="accordion-item bg-none">
                                            <p class="accordion-header">
                                                <button class="accordion-button collapsed p-2" type="button" data-bs-toggle="collapse" data-bs-target="#detail4" aria-expanded="false" aria-controls="detail4"><i class="bi bi-music-note-beamed me-2"></i> 12 Music Files</button>
                                            </p>
                                            <div id="detail4" class="accordion-collapse collapse bg-none" data-bs-parent="#detailaccord">
                                                <div class="accordion-body p-3">
                                                    <swiper-container slides-per-view="auto" space-between="16" autoplay="true" class="swiper swipernav ">
                                                        <swiper-slide class="width-100">
                                                            <figure class="coverimg height-80 w-100 rounded d-flex align-items-center justify-content-center text-center">
                                                                <img src="assets/img/modern-ai-image/bus-3.jpg" alt="" />
                                                                <i class="bi bi-music-note-beamed text-white fs-5 rounded-circle avatar avatar-40 bg-theme-1 theme-yellow d-block mx-auto"></i>
                                                            </figure>
                                                        </swiper-slide>
                                                        <swiper-slide class="width-100">
                                                            <figure class="coverimg height-80 w-100 rounded d-flex align-items-center justify-content-center text-center">
                                                                <img src="assets/img/modern-ai-image/peacoke-3.jpg" alt="" />
                                                                <i class="bi bi-music-note-beamed text-white fs-5 rounded-circle avatar avatar-40 bg-theme-1 theme-yellow d-block mx-auto"></i>
                                                            </figure>
                                                        </swiper-slide>
                                                        <swiper-slide class="width-100">
                                                            <figure class="coverimg height-80 w-100 rounded d-flex align-items-center justify-content-center text-center">
                                                                <img src="assets/img/modern-ai-image/user-1.jpg" alt="" />
                                                                <i class="bi bi-music-note-beamed text-white fs-5 rounded-circle avatar avatar-40 bg-theme-1 theme-yellow d-block mx-auto"></i>
                                                            </figure>
                                                        </swiper-slide>
                                                        <swiper-slide class="width-100">
                                                            <figure class="coverimg height-80 w-100 rounded d-flex align-items-center justify-content-center text-center">
                                                                <img src="assets/img/modern-ai-image/user5-kid.jpg" alt="" />
                                                                <i class="bi bi-music-note-beamed text-white fs-5 rounded-circle avatar avatar-40 bg-theme-1 theme-yellow d-block mx-auto"></i>
                                                            </figure>
                                                        </swiper-slide>
                                                        <swiper-slide class="width-100">
                                                            <div class="bg-theme-1-subtle text-theme-1 height-80 w-100 rounded text-center">
                                                                <div class="py-3">
                                                                    <p class="h5 mb-0">150+</p>
                                                                    <p class="opacity-75 small">More files</p>
                                                                </div>
                                                            </div>
                                                        </swiper-slide>
                                                    </swiper-container>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="card adminuiux-card mb-3 mb-lg-4">
                                <div class="card-header">
                                    <h6>23 Team Members</h6>
                                </div>
                                <div class="card-body p-1">
                                    <div class="overflow-y-auto height-dynamic" style="--h-dynamic: 226px">
                                        <ul class="list-group adminuiux-list-group list-group-flush chat-list-contacts bg-none rounded-0">
                                            <li class="list-group-item">
                                                <div class="row gx-3">
                                                    <div class="col-auto">
                                                        <figure class="avatar avatar-40 coverimg rounded-circle">
                                                            <img src="assets/img/modern-ai-image/user-1.jpg" alt="" />
                                                        </figure>
                                                    </div>
                                                    <div class="col-9 align-self-center ps-0">
                                                        <p class="text-truncate mb-0">The Adminuiux</p>
                                                        <p class="small text-secondary text-truncate">Admin, admin&#64;testgmail.com</p>
                                                    </div>
                                                </div>
                                            </li>
                                            <li class="list-group-item">
                                                <div class="row gx-3">
                                                    <div class="col-auto">
                                                        <figure class="avatar avatar-40 rounded-circle bg-warning text-white"><span class="h6 align-middle">JC</span></figure>
                                                    </div>
                                                    <div class="col-9 align-self-center ps-0">
                                                        <p class="text-truncate mb-0">Ms. Jully CTO</p>
                                                        <p class="small text-secondary text-truncate">admin, +56598511A4562</p>
                                                    </div>
                                                </div>
                                            </li>
                                            <li class="list-group-item" data-bs-toggle="modal" data-bs-target="#chatmodalwindow">
                                                <div class="row gx-3">
                                                    <div class="col-auto">
                                                        <figure class="avatar avatar-40 rounded-circle bg-success text-white"><span class="h6 align-middle">JC</span></figure>
                                                    </div>
                                                    <div class="col-9 align-self-center ps-0">
                                                        <p class="text-truncate mb-0">Aswatthma D-Plan</p>
                                                        <p class="small text-secondary text-truncate">+3698550015</p>
                                                    </div>
                                                </div>
                                            </li>
                                            <li class="list-group-item">
                                                <div class="row gx-3">
                                                    <div class="col-auto">
                                                        <figure class="avatar avatar-40 coverimg rounded-circle bg-theme-1">
                                                            <img src="assets/img/modern-ai-image/user-2.jpg" alt="" />
                                                        </figure>
                                                    </div>
                                                    <div class="col-9 align-self-center ps-0">
                                                        <p class="text-truncate mb-0">Adminuiux Support</p>
                                                        <p class="small text-secondary text-truncate">support&#64;testmai.com</p>
                                                    </div>
                                                </div>
                                            </li>
                                            <li class="list-group-item">
                                                <div class="row gx-3">
                                                    <div class="col-auto">
                                                        <figure class="avatar avatar-40 rounded-circle bg-theme-1"><span class="h6 align-middle">JM</span></figure>
                                                    </div>
                                                    <div class="col-9 align-self-center ps-0">
                                                        <p class="text-truncate mb-0">Mr. Jack Mario</p>
                                                        <p class="small text-secondary text-truncate">jackma&#64;gmailtest.com</p>
                                                    </div>
                                                </div>
                                            </li>
                                            <li class="list-group-item">
                                                <div class="row gx-3">
                                                    <div class="col-auto">
                                                        <figure class="avatar avatar-40 coverimg rounded-circle">
                                                            <img src="assets/img/modern-ai-image/user-3.jpg" alt="" />
                                                        </figure>
                                                    </div>
                                                    <div class="col-9 align-self-center ps-0">
                                                        <p class="text-truncate mb-0">Rubby Carlos</p>
                                                        <p class="small text-secondary text-truncate">+79946469852A00</p>
                                                    </div>
                                                </div>
                                            </li>
                                            <li class="list-group-item">
                                                <div class="row gx-3">
                                                    <div class="col-auto">
                                                        <figure class="avatar avatar-40 coverimg rounded-circle">
                                                            <img src="assets/img/modern-ai-image/user-4.jpg" alt="" />
                                                        </figure>
                                                    </div>
                                                    <div class="col-9 align-self-center ps-0">
                                                        <p class="text-truncate mb-0">The Adminuiux</p>
                                                        <p class="small text-secondary text-truncate">hello&#64;adminuiux.co</p>
                                                    </div>
                                                </div>
                                            </li>
                                            <li class="list-group-item">
                                                <div class="row gx-3">
                                                    <div class="col-auto">
                                                        <figure class="avatar avatar-40 rounded-circle bg-warning text-white"><span class="h6 align-middle">JC</span></figure>
                                                    </div>
                                                    <div class="col-9 align-self-center ps-0">
                                                        <p class="text-truncate mb-0">Ms. Jully CTO</p>
                                                        <p class="small text-secondary text-truncate">+9589621510A00</p>
                                                    </div>
                                                </div>
                                            </li>
                                        </ul>
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
export class ChatComponent {
    constructor(
        private renderer: Renderer2,
        @Inject(DOCUMENT) private document: Document // Inject the DOCUMENT token
    ) {}

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
