import { Component, ViewChild, ElementRef, OnInit } from "@angular/core";
import { NgIf } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { RouterLink, Router, ActivatedRoute } from "@angular/router";
import { AuthFlowsApiService } from "../../../services/auth-flows-api.service";

@Component({
    selector: "app-onboarding2",
    standalone: true,
    imports: [RouterLink, NgIf, FormsModule],
    template: `
        <!--Page body-->
        <div class="row gx-3 gx-lg-4 justify-content-center minheight-dynamic" style="--mih-dynamic: calc(100vh - 135px)">
            <div class="col-12 col-md-11 col-lg-10 col-xl-9 col-xxl-8">
                <div class="row gx-3 gx-lg-4 h-100 py-3 px-md-3 align-items-center">
                    <div class="col-12">
                        <div class="card adminuiux-card mb-3 mb-lg-4">
                            <div class="card-header">
                                <div class="row gx-3">
                                    <div class="col-auto">
                                        <img src="assets/img/logo-512.png" alt="" class="avatar avatar-30" />
                                    </div>
                                    <div class="col align-self-center text-center">
                                        <h5>User Onboarding</h5>
                                    </div>
                                    <div class="col-auto">
                                        <a routerLink="/app/dashboard" class="btn btn-sm btn-link">Skip <i class="bi bi-arrow-right"></i></a>
                                    </div>
                                </div>
                            </div>
                            <div class="card-body pb-0">
                                <div *ngIf="errorMessage" class="alert alert-danger py-2 mb-3">{{ errorMessage }}</div>
                                <!-- content -->
                                <div class="row gx-3 gx-lg-4">
                                    <div class="col-12 col-md-6 text-left position-relative d-none d-md-block">
                                        <img src="assets/img/adminux/onboardingsummary.png" alt="" class="mw-100" />
                                    </div>
                                    <div class="col-12 col-md-6 align-self-center py-3 py-lg-4">
                                        <h2 class="text-theme-1">Thank you!</h2>
                                        <h4 class="mb-3 mb-lg-4">Taking you to the Dashboard</h4>
                                        <p class="text-secondary mb-3 mb-lg-4">You have done smart selection for your project. You can now customize color scheme, font, sidebar, header style and content styles from our creative customizer from dashboard inner pages. You can skip waiting by <a routerLink="/app/dashboard" id="redirecttolink">Clicking Here</a></p>

                                        <div class="form-floating mb-3">
                                            <input
                                                type="text"
                                                class="form-control"
                                                [class.is-invalid]="showValidationErrors && country.trim().length < 2"
                                                id="country"
                                                name="country"
                                                placeholder="Country"
                                                [(ngModel)]="country" />
                                            <label for="country">Country</label>
                                            <div class="invalid-feedback">Ingresa un pais valido.</div>
                                        </div>

                                        <button type="button" class="btn btn-theme" [disabled]="isCompleting" (click)="completeNow()">
                                            {{ isCompleting ? 'Finalizando...' : 'Finalizar ahora' }}
                                        </button>
                                    </div>
                                </div>
                                <!-- content ends -->
                            </div>
                            <div class="card-footer">
                                <div class="row gx-3">
                                    <div class="col-auto align-self-center">
                                        <div class="row gx-3">
                                            <div class="col-auto">
                                                <div class="avatar avatar-50 coverimg rounded-circle">
                                                    <img src="assets/img/modern-ai-image/user-1.jpg" alt="" id="userimage" />
                                                </div>
                                            </div>
                                            <div class="col ps-0 align-self-center">
                                                <p class="mb-0 text-theme-1" id="usernamedisplay">{{ displayName || 'AdminUIUX' }}</p>
                                                <p class="small text-secondary">{{ country || '--' }}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="col align-self-center"></div>
                                    <div class="col-auto">
                                        <div class="row gx-3 text-end">
                                            <div class="col align-self-center">
                                                <p class="mb-0"><a routerLink="/app/dashboard" class="style-none text-theme-1">Please wait</a></p>
                                                <p class="small text-secondary">Preparing greatest...</p>
                                            </div>
                                            <div class="col-auto align-self-center">
                                                <!-- waiting loader -->
                                                <div class="d-block z-index-0 position-relative">
                                                    <div class="loader8 d-block mx-auto z-index-0"></div>
                                                    <p #timerDisplay class="position-absolute start-50 top-50 translate-middle small text-secondary text-center z-index-1">0:10</p>
                                                </div>
                                            </div>
                                        </div>
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
export class Onboarding2Component implements OnInit {
    @ViewChild("timerDisplay") timerElementRef!: ElementRef;
    initialSeconds = 10;
    totalSeconds = this.initialSeconds;
    private timerIntervalId: ReturnType<typeof setTimeout> | null = null;
    private completionTriggered = false;

    signupId = "";
    displayName = "";
    country = "Colombia";
    showValidationErrors = false;
    isCompleting = false;
    errorMessage = "";

    constructor(
        private readonly router: Router,
        private readonly route: ActivatedRoute,
        private readonly authFlowsApi: AuthFlowsApiService,
    ) {}

    ngOnInit(): void {
        this.signupId = this.route.snapshot.queryParamMap.get("signupId")?.trim() || "";
        this.displayName = this.route.snapshot.queryParamMap.get("name")?.trim() || "";

        if (!this.signupId) {
            this.errorMessage = "No encontramos un signup activo. Vuelve al registro para completar el flujo.";
            return;
        }

        this.startTimer();
    }

    updateTimerDisplay(): void {
        const minutes = Math.floor(this.totalSeconds / 60);
        const seconds = this.totalSeconds % 60;

        const formattedMinutes = String(minutes).padStart(1, "0");
        const formattedSeconds = String(seconds).padStart(2, "0");

        if (this.timerElementRef && this.timerElementRef.nativeElement) {
            this.timerElementRef.nativeElement.innerHTML = `${formattedMinutes}:${formattedSeconds}`;
        }
    }

    startTimer(): void {
        if (this.timerIntervalId) {
            clearTimeout(this.timerIntervalId);
        }

        if (this.totalSeconds <= 0) {
            this.updateTimerDisplay();
            this.completeNow();
            return;
        }

        this.totalSeconds--;
        this.updateTimerDisplay();
        this.timerIntervalId = setTimeout(() => this.startTimer(), 1000);
    }

    completeNow(): void {
        if (this.isCompleting || this.completionTriggered) {
            return;
        }

        this.showValidationErrors = true;
        this.errorMessage = "";

        if (!this.signupId) {
            this.errorMessage = "No encontramos un signup activo. Vuelve al registro para completar el flujo.";
            return;
        }

        if (this.country.trim().length < 2) {
            this.errorMessage = "Debes registrar un pais valido para finalizar onboarding.";
            return;
        }

        this.completionTriggered = true;
        this.isCompleting = true;
        this.authFlowsApi.completeOnboarding({
            signupId: this.signupId,
            country: this.country.trim(),
        }).subscribe({
            next: () => {
                void this.router.navigateByUrl("/app/dashboard");
            },
            error: (error: unknown) => {
                this.completionTriggered = false;
                this.isCompleting = false;
                this.errorMessage = error instanceof Error && error.message.trim()
                    ? error.message
                    : "No fue posible finalizar onboarding.";
            },
        });
    }
}
