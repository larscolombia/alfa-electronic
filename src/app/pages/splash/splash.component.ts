import { Component } from "@angular/core";
import { RouterLink, Router } from "@angular/router";

@Component({
    selector: "app-splash",
    standalone: true,
    imports: [],
    template: `
        <!--Page body-->
        <div class="container vh-100">
            <div class="row justify-content-center align-items-center text-center h-100">
                <div class="col-12 mb-auto pt-4"></div>
                <div class="col-auto">
                    <img src="assets/img/logo-pika.png" alt="" class="height-100 mb-3" />
                    <p class="h3 mb-0"><span class="text-gradient">AdminUX</span></p>
                    <p class="small text-secondary mb-3"><span class="">Admin Dashboard HTML Template</span></p>
                    <div class="loader6 mb-2 mx-auto" style="border-color: var(--adminuiux-theme-2);"></div>
                </div>
                <div class="col-12 mt-auto pb-4">
                    <p class="text-secondary">Petal of flower being ready to <span class="text-gradient">blossom</span>...</p>
                </div>
            </div>
        </div>
    `,
})
export class SplashComponent {
    constructor(private router: Router) {}

    ngOnInit(): void {
        setTimeout(() => {
            this.router.navigate(["/auth/signin"]);
        }, 2000);
    }
}

