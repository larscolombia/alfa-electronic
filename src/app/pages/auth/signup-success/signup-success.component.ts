import { Component, OnInit } from "@angular/core";
import { NgIf } from "@angular/common";
import { ActivatedRoute, Router } from "@angular/router";
import { finalize } from "rxjs";
import { AuthFlowsApiService } from "../../../services/auth-flows-api.service";

@Component({
    selector: "app-signup-success",
    standalone: true,
    imports: [NgIf],
    template: `
        <!--Page body-->
        <div class="row justify-content-center minheight-dynamic z-index-1 position-relative" style="--mih-dynamic: calc(100vh - 135px)">
            <div class="col-12 col-md-8 col-xl-6">
                <div class="h-100 py-4 px-md-3">
                    <div class="row h-100 align-items-center justify-content-center mt-md-3">
                        <div class="col-12 col-sm-8 col-md-11 col-xl-11 col-xxl-10 login-box">
                            <div class="card adminuiux-card mb-2">
                                <div class="card-body">
                                    <div class="text-center mb-3 mb-lg-4">
                                        <h1 class="mb-1 text-theme-1">Congratulations!</h1>
                                        <p class="text-secondary">You come so far and ready!</p>
                                    </div>

                                    <div *ngIf="errorMessage" class="alert alert-danger py-2 mb-3">{{ errorMessage }}</div>

                                    <div class="row gx-3 gx-lg-4 align-items-center p-2">
                                        <div class="col-6">
                                            <button type="button" class="btn btn-lg btn-link border border-theme-1 h-auto w-100" [disabled]="isSubmitting" (click)="selectSignupType('Individual')">
                                                <i class="bi bi-shop fs-1 avatar avatar-40 w-auto my-3"></i>
                                                <h5 class="mb-0">Individual</h5>
                                                <p class="fs-12 mb-2">Managing alone</p>
                                                <i class="bi bi-arrow-right avatar avatar-40 w-auto mb-2"></i>
                                            </button>
                                        </div>
                                        <div class="col-6">
                                            <button type="button" class="btn btn-lg btn-theme h-auto w-100" [disabled]="isSubmitting" (click)="selectSignupType('Business')">
                                                <i class="bi bi-buildings fs-1 avatar avatar-40 w-auto my-3"></i>
                                                <h5 class="mb-0">Business</h5>
                                                <p class="fs-12 mb-2">Multi-user access</p>
                                                <i class="bi bi-arrow-right avatar avatar-40 w-auto mb-2"></i>
                                            </button>
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
export class SignupSuccessComponent implements OnInit {
    signupId = "";
    errorMessage = "";
    isSubmitting = false;

    constructor(
        private readonly route: ActivatedRoute,
        private readonly router: Router,
        private readonly authFlowsApi: AuthFlowsApiService,
    ) {}

    ngOnInit(): void {
        this.signupId = this.route.snapshot.queryParamMap.get("signupId")?.trim() || "";
        if (!this.signupId) {
            this.errorMessage = "No encontramos un registro de signup activo. Vuelve al formulario de registro.";
        }
    }

    selectSignupType(signupType: "Individual" | "Business"): void {
        if (this.isSubmitting) {
            return;
        }

        if (!this.signupId) {
            this.errorMessage = "No encontramos un registro de signup activo. Vuelve al formulario de registro.";
            return;
        }

        this.errorMessage = "";
        this.isSubmitting = true;

        this.authFlowsApi
            .setSignupSuccess(this.signupId, { signupType })
            .pipe(finalize(() => (this.isSubmitting = false)))
            .subscribe({
                next: () => {
                    void this.router.navigate(["/auth/onboarding"], {
                        queryParams: {
                            signupId: this.signupId,
                        },
                    });
                },
                error: (error: unknown) => {
                    this.errorMessage = error instanceof Error && error.message.trim()
                        ? error.message
                        : "No fue posible guardar el tipo de cuenta.";
                },
            });
    }
}
