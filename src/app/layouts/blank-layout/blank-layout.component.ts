import { Component } from "@angular/core";
import { RouterOutlet } from "@angular/router";

@Component({
    selector: "app-blank-layout",
    standalone: true,
    imports: [RouterOutlet],
    template: `
        <!-- main content -->
        <div class="adminuiux-wrap">
            <main class="adminuiux-content z-index-1 position-relative">
                <router-outlet></router-outlet>
            </main>
        </div>
    `,
})
export class BlankLayoutComponent {}
