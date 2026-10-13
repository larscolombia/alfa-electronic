import { Component, Renderer2, Inject } from "@angular/core";
import { RouterLink } from "@angular/router";
import { DOCUMENT } from "@angular/common";
import { DatePickerComponent } from "../input-fields/date-picker/date-picker.component";

@Component({
    selector: "app-notification",
    standalone: true,
    imports: [RouterLink, DatePickerComponent],
    template: `
        <div class="offcanvas-header border-bottom">
            <div class="flex-grow-1">
                <h6 class="mb-0">Notifications</h6>
                <p class="text-secondary">6 new updates</p>
            </div>
            <button type="button" class="btn-close" data-bs-dismiss="offcanvas" aria-label="Close"></button>
        </div>
        <div class="small text-center px-3 py-2 bg-theme-1-subtle text-theme-1 border-bottom">
            <app-date-picker></app-date-picker>
        </div>
        <div class="offcanvas-body">
            <div class="card bg-none mb-2">
                <div class="card-body">
                    <div class="row gx-3">
                        <div class="col-auto">
                            <figure class="avatar avatar-30 coverimg rounded-circle">
                                <img src="assets/img/modern-ai-image/user-2.jpg" alt="" />
                            </figure>
                        </div>
                        <div class="col">
                            <p class="small mb-2"><a routerLink="/app/profile-professional" class="text-theme-1 style-none">Alex Smith</a>, <a routerLink="/app/profile-professional" class="text-theme-1 style-none">John McMillan</a> and <span class="fw-medium">36 others</span> are also ordered from same website</p>

                            <div class="row gx-3 align-items-center">
                                <div class="col">
                                    <p class="text-secondary small">2:14 pm</p>
                                </div>
                                <div class="col-auto">
                                    <a href="javascript:void(0)" class="btn btn-sm btn-square btn-link theme-red"><i class="bi bi-trash"></i></a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="card bg-none mb-2">
                <div class="card-body">
                    <div class="row gx-3">
                        <div class="col-auto">
                            <figure class="avatar avatar-30 rounded-circle bg-theme-1 border border-theme-1">
                                <h6>JM</h6>
                            </figure>
                        </div>
                        <div class="col">
                            <p class="small mb-2"><a routerLink="/app/profile-professional" class="text-theme-1 style-none">Jack Mario</a> commented: "This one is most usable design with great user experience. w..."</p>

                            <div class="row gx-3 align-items-center">
                                <div class="col">
                                    <p class="text-secondary small">2 days ago</p>
                                </div>
                                <div class="col-auto">
                                    <a href="javascript:void(0)" class="btn btn-sm btn-square btn-link theme-red"><i class="bi bi-trash"></i></a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="alert alert-warning mb-2">
                <div class="row gx-3">
                    <div class="col-auto">
                        <figure class="avatar avatar-30 rounded-circle bg-warning text-white">
                            <i class="bi bi-bell"></i>
                        </figure>
                    </div>
                    <div class="col">
                        <p class="small mb-2">Your subscription going to expire soon. Please <a routerLink="/app/subscription">upgrade</a> to get service interrupt free.</p>

                        <div class="row gx-3 align-items-center">
                            <div class="col">
                                <p class="text-secondary small">4 days ago</p>
                            </div>
                            <div class="col-auto">
                                <a href="javascript:void(0)" class="btn btn-sm btn-square btn-link theme-red"><i class="bi bi-trash"></i></a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="card bg-none mb-2">
                <div class="card-body">
                    <div class="row gx-3">
                        <div class="col-auto">
                            <figure class="avatar avatar-30 coverimg rounded-circle">
                                <img src="assets/img/modern-ai-image/user-4.jpg" alt="" />
                            </figure>
                        </div>
                        <div class="col">
                            <p class="small mb-2"><a routerLink="/app/invoice" class="text-theme-1 style-none">Roberto Carlos</a> has requested to send $120.00 money.</p>

                            <div class="row gx-3 align-items-center">
                                <div class="col">
                                    <p class="text-secondary small">6 days ago</p>
                                </div>
                                <div class="col-auto">
                                    <a href="javascript:void(0)" class="btn btn-sm btn-square btn-link theme-red"><i class="bi bi-trash"></i></a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="card bg-none mb-2">
                <div class="card-body">
                    <div class="row gx-3">
                        <div class="col-auto">
                            <figure class="avatar avatar-30 rounded-circle bg-theme-1-subtle text-theme-1 theme-orange">
                                <i class="bi bi-calendar-event"></i>
                            </figure>
                        </div>
                        <div class="col">
                            <h6 class="mb-1">Adminuiux: #1 HTML Templates</h6>
                            <p class="small mb-2">Learning for better user experience on Universal app. development</p>
                            <div class="avatar-group mb-2">
                                <figure class="avatar avatar-20 coverimg rounded-circle" data-bs-toggle="tooltip" title="Mickey">
                                    <img src="assets/img/modern-ai-image/user-3.jpg" alt="" style="display: none;" />
                                </figure>
                                <figure class="avatar avatar-20 coverimg rounded-circle" data-bs-toggle="tooltip" title="Jacky">
                                    <img src="assets/img/modern-ai-image/user-4.jpg" alt="" />
                                </figure>
                                <div class="avatar avatar-20 bg-theme-1 rounded-circle">
                                    <small class="fs-10 vm">9+</small>
                                </div>
                                <span class="text-secondary small"> are attending</span>
                            </div>

                            <div class="row gx-3 align-items-center">
                                <div class="col">
                                    <p class="text-secondary small">7 days ago</p>
                                </div>
                                <div class="col-auto">
                                    <a href="javascript:void(0)" class="btn btn-sm btn-square btn-link theme-red"><i class="bi bi-trash"></i></a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="card bg-none mb-2">
                <div class="card-body">
                    <div class="row gx-3">
                        <div class="col-auto">
                            <figure class="avatar avatar-30 coverimg rounded-circle">
                                <img src="assets/img/modern-ai-image/user-3.jpg" alt="" />
                            </figure>
                        </div>
                        <div class="col">
                            <p class="small mb-2"><a routerLink="/app/profile-professional" class="text-theme-1 style-none">The AdminUIUX</a> commented: "Thank you so much for this deep view at Adminuiux..."</p>

                            <div class="row gx-3 align-items-center">
                                <div class="col">
                                    <p class="text-secondary small">1 year ago</p>
                                </div>
                                <div class="col-auto">
                                    <a href="javascript:void(0)" class="btn btn-sm btn-square btn-link theme-red"><i class="bi bi-trash"></i></a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `,
})
export class NotificationComponent {}
