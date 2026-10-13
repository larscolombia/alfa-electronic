import { Component } from "@angular/core";
import { NgIf } from "@angular/common";
import { Router, RouterLink } from "@angular/router";
import { FormsModule } from "@angular/forms";
import { finalize } from "rxjs";
import { AuthFlowsApiService } from "../../../services/auth-flows-api.service";

@Component({
    selector: "app-signup",
    standalone: true,
    imports: [FormsModule, RouterLink, NgIf],
    template: `
        <div class="row justify-content-center minheight-dynamic z-index-1 position-relative" style="--mih-dynamic: calc(100vh - 135px)">
            <div class="col-12 col-md-8 col-xl-6">
                <div class="h-100 py-4 px-md-3">
                    <div class="row h-100 align-items-center justify-content-center mt-md-3">
                        <div class="col-12 col-sm-8 col-md-11 col-xl-11 col-xxl-10 login-box">
                            <form class="auth-form" (ngSubmit)="onSubmit()">
                                <div class="card adminuiux-card mb-2">
                                    <div class="card-body">
                                        <div class="text-center mb-3 mb-lg-4">
                                            <h1 class="mb-1 text-theme-1">Let's get started!</h1>
                                            <p class="text-secondary">Provide your few details</p>
                                        </div>

                                        <div *ngIf="errorMessage" class="alert alert-danger py-2 mb-3" role="alert">{{ errorMessage }}</div>

                                        <div class="row gx-3 gx-lg-4">
                                            <div class="col">
                                                <div class="form-floating mb-3">
                                                    <input
                                                        type="text"
                                                        class="form-control"
                                                        [class.is-invalid]="firstNameInvalid"
                                                        id="namef"
                                                        name="firstName"
                                                        placeholder="Enter first name"
                                                        [(ngModel)]="firstName"
                                                        autofocus=""
                                                    />
                                                    <label for="namef">First Name</label>
                                                    <div class="invalid-feedback">Ingresa un nombre valido.</div>
                                                </div>
                                            </div>
                                            <div class="col">
                                                <div class="form-floating mb-3">
                                                    <input
                                                        type="text"
                                                        class="form-control"
                                                        [class.is-invalid]="lastNameInvalid"
                                                        id="namel"
                                                        name="lastName"
                                                        placeholder="Enter last name"
                                                        [(ngModel)]="lastName"
                                                    />
                                                    <label for="namel">Last Name</label>
                                                    <div class="invalid-feedback">Ingresa un apellido valido.</div>
                                                </div>
                                            </div>
                                        </div>

                                        <div class="form-floating mb-3">
                                            <input
                                                type="email"
                                                class="form-control"
                                                [class.is-invalid]="emailInvalid"
                                                id="emailadd"
                                                name="email"
                                                placeholder="Enter email address"
                                                [(ngModel)]="email"
                                            />
                                            <label for="emailadd">Email Address</label>
                                            <div class="invalid-feedback">Ingresa un correo valido.</div>
                                        </div>

                                        <div class="input-group mb-3">
                                            <div class="form-floating maxwidth-100">
                                                <select class="form-select" [class.is-invalid]="countryCodeInvalid" id="code" aria-label="Country code" name="countryCode" [(ngModel)]="countryCode">
                                                    <option value="+1">+1</option>
                                                    <option value="+44">+44</option>
                                                    <option value="+57">+57</option>
                                                    <option value="+66">+66</option>
                                                    <option value="+91">+91</option>
                                                </select>
                                                <label for="code">Code</label>
                                            </div>
                                            <div class="form-floating">
                                                <input
                                                    type="text"
                                                    class="form-control"
                                                    [class.is-invalid]="phoneInvalid"
                                                    id="phonen"
                                                    name="phone"
                                                    placeholder="Enter your phone number"
                                                    [(ngModel)]="phone"
                                                />
                                                <label for="phonen">Phone Number</label>
                                                <div class="invalid-feedback">Ingresa un telefono valido.</div>
                                            </div>
                                        </div>

                                        <div class="position-relative">
                                            <div class="form-floating mb-3">
                                                <input
                                                    [type]="passwordVisible ? 'text' : 'password'"
                                                    class="form-control"
                                                    [class.is-invalid]="passwordInvalid"
                                                    id="password"
                                                    name="password"
                                                    placeholder="Password"
                                                    [(ngModel)]="password"
                                                    autocomplete="new-password"
                                                />
                                                <label for="password">Password</label>
                                                <div class="invalid-feedback">Usa al menos 8 caracteres con mayuscula, minuscula, numero y simbolo.</div>
                                            </div>
                                            <button type="button" class="btn btn-square btn-link text-theme-1 position-absolute end-0 top-0 mt-2 me-2" (click)="togglePasswordVisibility()">
                                                <i class="bi" [class.bi-eye]="!passwordVisible" [class.bi-eye-slash]="passwordVisible"></i>
                                            </button>
                                        </div>

                                        <div class="position-relative">
                                            <div class="form-floating mb-3">
                                                <input
                                                    [type]="confirmPasswordVisible ? 'text' : 'password'"
                                                    class="form-control"
                                                    [class.is-invalid]="confirmPasswordInvalid"
                                                    id="passwd"
                                                    name="confirmPassword"
                                                    placeholder="Confirm your password"
                                                    [(ngModel)]="confirmPassword"
                                                    autocomplete="new-password"
                                                />
                                                <label for="passwd">Confirm Password</label>
                                                <div class="invalid-feedback">La confirmacion no coincide.</div>
                                            </div>
                                            <button type="button" class="btn btn-square btn-link text-theme-1 position-absolute end-0 top-0 mt-2 me-2" (click)="toggleConfirmPasswordVisibility()">
                                                <i class="bi" [class.bi-eye]="!confirmPasswordVisible" [class.bi-eye-slash]="confirmPasswordVisible"></i>
                                            </button>
                                        </div>

                                        <button type="submit" class="btn btn-lg btn-theme w-100 mb-4" [disabled]="isSubmitting">
                                            {{ isSubmitting ? 'Registrando...' : 'Signup' }}
                                        </button>

                                        <div class="text-center">Already have account? <a routerLink="/auth/signin" class=" ">Login</a> here.</div>
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
export class SignupComponent {
    constructor(
        private readonly router: Router,
        private readonly authFlowsApi: AuthFlowsApiService,
    ) {}

    firstName = "";
    lastName = "";
    email = "";
    countryCode = "+57";
    phone = "";
    password = "";
    confirmPassword = "";

    isSubmitting = false;
    showValidationErrors = false;
    errorMessage = "";
    passwordVisible = false;
    confirmPasswordVisible = false;

    get firstNameInvalid(): boolean {
        return this.showValidationErrors && this.firstName.trim().length < 2;
    }

    get lastNameInvalid(): boolean {
        return this.showValidationErrors && this.lastName.trim().length < 2;
    }

    get emailInvalid(): boolean {
        return this.showValidationErrors && !this.isValidEmail(this.email);
    }

    get countryCodeInvalid(): boolean {
        return this.showValidationErrors && !/^\+[0-9]{1,4}$/.test(this.countryCode.trim());
    }

    get phoneInvalid(): boolean {
        return this.showValidationErrors && !/^[0-9+\-()\s]{7,40}$/.test(this.phone.trim());
    }

    get passwordInvalid(): boolean {
        return this.showValidationErrors && !this.isStrongPassword(this.password);
    }

    get confirmPasswordInvalid(): boolean {
        return this.showValidationErrors && this.confirmPassword.trim() !== this.password.trim();
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

        if (
            this.firstNameInvalid ||
            this.lastNameInvalid ||
            this.emailInvalid ||
            this.countryCodeInvalid ||
            this.phoneInvalid ||
            this.passwordInvalid ||
            this.confirmPasswordInvalid
        ) {
            this.errorMessage = "Revisa los campos obligatorios antes de continuar.";
            return;
        }

        this.isSubmitting = true;
        this.authFlowsApi
            .signup({
                firstName: this.firstName.trim(),
                lastName: this.lastName.trim(),
                email: this.email.trim().toLowerCase(),
                countryCode: this.countryCode.trim(),
                phone: this.phone.trim(),
                password: this.password,
                confirmPassword: this.confirmPassword,
            })
            .pipe(finalize(() => (this.isSubmitting = false)))
            .subscribe({
                next: (record) => {
                    void this.router.navigate(["/auth/signup-success"], {
                        queryParams: {
                            signupId: record.id,
                            email: record.email,
                        },
                    });
                },
                error: (error: unknown) => {
                    this.errorMessage = error instanceof Error && error.message.trim()
                        ? error.message
                        : "No fue posible registrar el usuario.";
                },
            });
    }

    private isValidEmail(value: string): boolean {
        const email = value.trim();
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
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
