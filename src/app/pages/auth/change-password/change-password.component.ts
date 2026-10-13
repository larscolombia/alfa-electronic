import { Component, OnInit } from "@angular/core";
import { NgIf } from "@angular/common";
import { ActivatedRoute, Router, RouterLink } from "@angular/router";
import { FormsModule } from "@angular/forms";
import { finalize } from "rxjs";
import { AuthFlowsApiService } from "../../../services/auth-flows-api.service";

@Component({
    selector: "app-change-password",
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
                                            <h1 class="mb-1 text-theme-1">Thats great step!</h1>
                                            <h4 class="mb-3">You are now one step away</h4>
                                            <p class="text-secondary">Provide you new password and confirm password here and you're all set to go and use Adminuiux template preview.</p>
                                        </div>

                                        <div *ngIf="errorMessage" class="alert alert-danger py-2 mb-3">{{ errorMessage }}</div>
                                        <div *ngIf="tokenWarning" class="alert alert-warning py-2 mb-3">{{ tokenWarning }}</div>

                                        <div class="position-relative">
                                            <div class="form-floating mb-3">
                                                <input
                                                    [type]="passwordVisible ? 'text' : 'password'"
                                                    class="form-control"
                                                    [class.is-invalid]="newPasswordInvalid"
                                                    id="newPassword"
                                                    name="newPassword"
                                                    placeholder="New password"
                                                    [(ngModel)]="newPassword"
                                                    autocomplete="new-password"
                                                />
                                                <label for="newPassword">New Password</label>
                                                <div class="invalid-feedback">Usa al menos 8 caracteres con mayuscula, minuscula, numero y simbolo.</div>
                                            </div>
                                            <button type="button" class="btn btn-square btn-link text-theme-1 position-absolute end-0 top-0 mt-2 me-2" (click)="togglePasswordVisibility()">
                                                <i class="bi" [class.bi-eye]="!passwordVisible" [class.bi-eye-slash]="passwordVisible"></i>
                                            </button>
                                        </div>

                                        <div class="position-relative">
                                            <div class="form-floating mb-4">
                                                <input
                                                    [type]="confirmPasswordVisible ? 'text' : 'password'"
                                                    class="form-control"
                                                    [class.is-invalid]="confirmPasswordInvalid"
                                                    id="passwdconfirm"
                                                    name="confirmPassword"
                                                    placeholder="Confirm your new password"
                                                    [(ngModel)]="confirmPassword"
                                                    autocomplete="new-password"
                                                />
                                                <label for="passwdconfirm">Confirm Password</label>
                                                <div class="invalid-feedback">La confirmacion no coincide.</div>
                                            </div>
                                            <button type="button" class="btn btn-square btn-link text-theme-1 position-absolute end-0 top-0 mt-2 me-2" (click)="toggleConfirmPasswordVisibility()">
                                                <i class="bi" [class.bi-eye]="!confirmPasswordVisible" [class.bi-eye-slash]="confirmPasswordVisible"></i>
                                            </button>
                                        </div>

                                        <button type="submit" class="btn btn-lg btn-theme w-100 mb-3 mb-lg-4" [disabled]="isSubmitting || !resetToken">
                                            {{ isSubmitting ? 'Actualizando...' : 'Change Now' }}
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
export class ChangePasswordComponent implements OnInit {
    constructor(
        private readonly router: Router,
        private readonly route: ActivatedRoute,
        private readonly authFlowsApi: AuthFlowsApiService,
    ) {}

    resetToken = "";
    newPassword = "";
    confirmPassword = "";

    showValidationErrors = false;
    isSubmitting = false;
    errorMessage = "";
    tokenWarning = "";
    passwordVisible = false;
    confirmPasswordVisible = false;

    ngOnInit(): void {
        this.resetToken = this.route.snapshot.queryParamMap.get("token")?.trim() || "";
        if (!this.resetToken) {
            this.tokenWarning = "No encontramos token de recuperacion. Solicita uno nuevamente.";
        }
    }

    get newPasswordInvalid(): boolean {
        return this.showValidationErrors && !this.isStrongPassword(this.newPassword);
    }

    get confirmPasswordInvalid(): boolean {
        return this.showValidationErrors && this.confirmPassword.trim() !== this.newPassword.trim();
    }

    togglePasswordVisibility(): void {
        this.passwordVisible = !this.passwordVisible;
    }

    toggleConfirmPasswordVisibility(): void {
        this.confirmPasswordVisible = !this.confirmPasswordVisible;
    }

    onSubmit(): void {
        if (this.isSubmitting) {
            return;
        }

        this.showValidationErrors = true;
        this.errorMessage = "";

        if (!this.resetToken) {
            this.errorMessage = "Token de recuperacion no disponible.";
            return;
        }

        if (this.newPasswordInvalid || this.confirmPasswordInvalid) {
            this.errorMessage = "Revisa los campos de clave antes de continuar.";
            return;
        }

        this.isSubmitting = true;
        this.authFlowsApi
            .changePassword({
                resetToken: this.resetToken,
                newPassword: this.newPassword,
                confirmPassword: this.confirmPassword,
            })
            .pipe(finalize(() => (this.isSubmitting = false)))
            .subscribe({
                next: () => {
                    void this.router.navigate(["/auth/signin"], {
                        queryParams: { reason: "password_changed" },
                    });
                },
                error: (error: unknown) => {
                    this.errorMessage = error instanceof Error && error.message.trim()
                        ? error.message
                        : "No fue posible actualizar la clave.";
                },
            });
    }

    private isStrongPassword(value: string): boolean {
        const password = value.trim();
        return password.length >= 8
            && /[A-Z]/.test(password)
            && /[a-z]/.test(password)
            && /[0-9]/.test(password)
            && /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password);
    }
}
