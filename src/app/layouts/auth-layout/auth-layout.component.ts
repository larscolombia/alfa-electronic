import { Component } from "@angular/core";
import { RouterOutlet } from "@angular/router";
import { AuthHeaderComponent } from "../../components/header-footer-sidebar/auth-header/auth-header.component";
import { AuthFooterComponent } from "../../components/header-footer-sidebar/auth-footer/auth-footer.component";

@Component({
    selector: "app-auth-layout",
    standalone: true,
    imports: [RouterOutlet, AuthHeaderComponent, AuthFooterComponent],
    template: `
        <!-- main content -->
        <app-auth-header class="adminuiux-header inner-page z-index-5 position-relative"></app-auth-header>
        <main class="flex-shrink-0 pt-0">
            <div class="container">
                <div class="auth-wrapper">
                    <!--Page body-->
                    <div class="coverimg h-100 w-100 top-0 start-0 position-absolute z-index-0">
                        <img src="assets/img/background-image/backgorund-image-13.jpg" alt="" />
                    </div>
                    <!-- login wrap -->
                    <router-outlet></router-outlet>
                </div>
            </div>
        </main>
        <app-auth-footer class="adminuiux-footer mt-auto bg-theme-1 z-index-1 position-relative"></app-auth-footer>
    `,
})
export class AuthLayoutComponent {}
