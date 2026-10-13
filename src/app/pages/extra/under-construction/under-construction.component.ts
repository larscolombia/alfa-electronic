import { Component } from "@angular/core";
import { RouterLink } from "@angular/router";

@Component({
    selector: "app-under-construction",
    standalone: true,
    imports: [RouterLink],
    template: `
        <!-- content -->
        <div class="container">
            <div class="auth-wrapper">
                <!--Page body-->
                <div class="coverimg h-100 w-100 top-0 start-0 position-absolute z-index-0 overlay-gradiant blur-overlay blur-theme">
                    <img src="assets/img/adminux/maintenance.jpg" alt="" />
                </div>
                <!-- center wrap -->
                <div class="row justify-content-center align-items-center minheight-dynamic position-relative z-index-1" style="--mih-dynamic: calc(100vh - 2rem)">
                    <div class="col-12 col-md-9 col-lg-8 col-xl-7 text-white text-center py-3 py-lg-4">
                        <h1>Maintenance Ongoing</h1>
                        <h4 class="mb-4">This page is under maintenance.</h4>
                        <figure class="height-240 coverimg rounded shadow mx-auto mb-3 mb-lg-4">
                            <img src="assets/img/adminux/maintenance.jpg" alt="" />
                        </figure>
                        <p class="mb-3 mb-lg-4">We are in the process of updating features and provide you a best experience.<br />Kindly wait for <b>21-12-2022, 12:00 pm GMT 30:00</b> till we setup all our new feature. All the other things are working fine and you can continue with your tasks.</p>
                        <a routerLink="/app/dashboard" class="btn btn-theme z-index-5"><i class="bi bi-arrow-left"></i> Go back to Home </a>
                        <br />

                        <p class="opacity-50 my-2 my-lg-3">Stay tuned with us</p>
                        <ul class="nav justify-content-center">
                            <li class="nav-item">
                                <a class="nav-link text-white" href="https://www.facebook.com/adminuiux/" target="_blank">
                                    <i class="bi bi-facebook h5"></i>
                                </a>
                            </li>
                            <li class="nav-item">
                                <a class="nav-link text-white" href="https://twitter.com/admiinuiux" target="_blank">
                                    <i class="bi bi-twitter h5"></i>
                                </a>
                            </li>
                            <li class="nav-item">
                                <a class="nav-link text-white" href="https://linkedin.com/company/adminuiux" target="_blank">
                                    <i class="bi bi-linkedin h5"></i>
                                </a>
                            </li>
                            <li class="nav-item">
                                <a class="nav-link text-white" href="https://www.instagram.com/adminuiux/" target="_blank">
                                    <i class="bi bi-instagram h5"></i>
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    `,
})
export class UnderConstructionComponent {}
