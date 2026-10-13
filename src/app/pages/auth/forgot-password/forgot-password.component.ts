import { Component } from "@angular/core";
import { NgIf } from "@angular/common";
import { Router, RouterLink } from "@angular/router";
import { FormsModule } from "@angular/forms";
import { finalize } from "rxjs";
import { AuthFlowsApiService } from "../../../services/auth-flows-api.service";

@Component({
    selector: "app-forgot-password",
    standalone: true,
    imports: [FormsModule, RouterLink, NgIf],
    template: `
        <!--Page body-->
        <div class="row justify-content-center minheight-dynamic z-index-1 position-relative" style="--mih-dynamic: calc(100vh - 135px)">
            <div class="col-12 col-md-8 col-xl-6">
                <div class="h-100 py-4 px-md-3">
                    <div class="row h-100 align-items-center justify-content-center mt-md-3">
                        <div class="col-12 col-sm-8 col-md-11 col-xl-11 col-xxl-10 login-box">
                            <form class="auth-form" (ngSubmit)="onSubmit()">
                                <div class="card adminuiux-card mb-2">
                                    <div class="card-body">
                                        <div class="text-center mb-4">
                                            <h1 class="mb-1 text-theme-1">Sorry!</h1>
                                            <h4 class="mb-3">You have to be here</h4>
                                            <p class="text-secondary">Provide your registered email address, we will send you an email with change password link with steps.</p>
                                        </div>

                                        <div *ngIf="errorMessage" class="alert alert-danger py-2 mb-3">{{ errorMessage }}</div>

                                        <div class="form-floating mb-3">
                                            <input
                                                type="email"
                                                class="form-control"
                                                [class.is-invalid]="emailInvalid"
                                                id="emailadd"
                                                name="email"
                                                placeholder="Enter email address"
                                                [(ngModel)]="email"
                                                autofocus=""
                                            />
                                            <label for="emailadd">Email Address</label>
                                            <div class="invalid-feedback">Ingresa un correo valido.</div>
                                        </div>

                                        <button type="submit" class="btn btn-lg btn-theme w-100 mb-3 mb-lg-4" [disabled]="isSubmitting">
                                            {{ isSubmitting ? 'Procesando...' : 'Reset Now' }}
                                        </button>

                                        <div class="text-center mb-3">Already have password? <a routerLink="/auth/signin" class="style-none">Login</a> here.</div>
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `,
})
export class ForgotPasswordComponent {
    constructor(
        private readonly router: Router,
        private readonly authFlowsApi: AuthFlowsApiService,
    ) {}

    email = "";
    isSubmitting = false;
    showValidationErrors = false;
    errorMessage = "";

    get emailInvalid(): boolean {
        return this.showValidationErrors && !this.isValidEmail(this.email);
    }

    onSubmit(): void {
        if (this.isSubmitting) {
            return;
        }

        this.showValidationErrors = true;
        this.errorMessage = "";

        if (this.emailInvalid) {
            this.errorMessage = "Ingresa un correo valido para recuperar la clave.";
            return;
        }

        this.isSubmitting = true;
        this.authFlowsApi
            .forgotPassword({ email: this.email.trim().toLowerCase() })
            .pipe(finalize(() => (this.isSubmitting = false)))
            .subscribe({
                next: (response) => {
                    void this.router.navigate(["/auth/change-password"], {
                        queryParams: {
                            token: response.resetToken,
                            email: this.email.trim().toLowerCase(),
                        },
                    });
                },
                error: (error: unknown) => {
                    this.errorMessage = error instanceof Error && error.message.trim()
                        ? error.message
                        : "No fue posible generar el token de recuperacion.";
                },
            });
    }

    private isValidEmail(value: string): boolean {
        const email = value.trim();
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }
}
