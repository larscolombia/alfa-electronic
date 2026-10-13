import { Component } from "@angular/core";
import { Location } from "@angular/common";
import { RouterLink } from "@angular/router";

@Component({
    selector: "app-auth-header",
    standalone: true,
    imports: [RouterLink],
    template: `
        <nav class="navbar ">
            <div class="container-fluid">
                <!-- logo -->
                <a class="navbar-brand text-white" routerLink="/auth/signin">
                    <img src="assets/img/logo-pika.png" alt="PIKA logo" class="logo-pika" />
                </a>

                <div class=" ms-auto "></div>
                <!-- right icons button -->
                <div class="ms-auto"></div>
            </div>
        </nav>
    `,
})
export class AuthHeaderComponent {
    constructor(private location: Location) { }
}

