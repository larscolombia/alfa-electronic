import { Component, OnDestroy, OnInit } from "@angular/core";
import { NgIf } from "@angular/common";
import { RouterLink, Router, ActivatedRoute } from "@angular/router";
import { FormsModule } from "@angular/forms";
import { finalize } from "rxjs";
import { AuthService } from "../../../services/auth.service";
import { FormDraftService } from "../../../services/form-draft.service";

const SIGNIN_DRAFT_KEY = "auth.signin";

@Component({
    selector: "app-signin",
    standalone: true,
    imports: [RouterLink, FormsModule, NgIf],
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
                                            <h2 class="mb-1 text-theme-1">Login</h2>
                                            <p class="text-secondary">Take a deep dive into the new modern era</p>
                                        </div>
                                        <div *ngIf="infoMessage" class="alert alert-warning py-2 mb-3" role="alert" aria-live="polite">
                                            {{ infoMessage }}
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
                                                (ngModelChange)="onCredentialInput()"
                                                autocomplete="username"
                                                autofocus=""
                                                required
                                            />
                                            <label for="emailadd">Email Address</label>
                                            <div class="invalid-feedback">Ingresa un correo valido.</div>
                                        </div>
                                        <div class="position-relative">
                                            <div class="form-floating mb-3">
                                                <input
                                                    [type]="passwordVisible ? 'text' : 'password'"
                                                    class="form-control"
                                                    [class.is-invalid]="passwordInvalid"
                                                    id="passwd"
                                                    name="password"
                                                    placeholder="Enter your password"
                                                    [(ngModel)]="password"
                                                    (ngModelChange)="onCredentialInput()"
                                                    autocomplete="current-password"
                                                    required
                                                />
                                                <label for="passwd">Password</label>
                                                <div class="invalid-feedback">Ingresa tu clave.</div>
                                            </div>
                                            <button
                                                type="button"
                                                class="btn btn-square btn-link text-theme-1 position-absolute end-0 top-0 mt-2 me-2 "
                                                (click)="togglePasswordVisibility()"
                                                [attr.aria-label]="passwordVisible ? 'Ocultar clave' : 'Mostrar clave'"
                                            >
                                                <i class="bi" [class.bi-eye]="!passwordVisible" [class.bi-eye-slash]="passwordVisible"></i>
                                            </button>
                                        </div>
                                        <div *ngIf="errorMessage" class="alert alert-danger py-2 mb-3" role="alert" aria-live="assertive">
                                            {{ errorMessage }}
                                        </div>
                                        <div class="row gx-3 align-items-center mb-3">
                                            <div class="col">
                                                <div class="form-check">
                                                    <input class="form-check-input" type="checkbox" name="rememberme" id="rememberme" />
                                                    <label class="form-check-label" for="rememberme">Remember me</label>
                                                </div>
                                            </div>
                                            <div class="col-auto">
                                                <a routerLink="/auth/forgot-password" class="btn btn-link">Forgot Password?</a>
                                            </div>
                                        </div>
                                        <div class="row gx-3 align-items-center mb-4">
                                            <div class="col">
                                                <button type="submit" class="btn btn-lg btn-theme w-100 " [disabled]="isSubmitting">
                                                    {{ isSubmitting ? "Ingresando..." : "Login" }}
                                                </button>
                                            </div>
                                            <div class="col">
                                                <a routerLink="/auth/signup" class="btn btn-lg btn-link w-100">Signup <i class="bi bi-chevron-right"></i></a>
                                            </div>
                                        </div>
                                        <div class="row gx-3 align-items-center mb-4">
                                            <div class="col">
                                                <hr class="" />
                                            </div>
                                            <div class="col-auto">
                                                <p class="text-secondary">OR Continue with</p>
                                            </div>
                                            <div class="col">
                                                <hr class="" />
                                            </div>
                                        </div>
                                        <div class="row gx-2 justify-content-center align-items-center">
                                            <div class="col-auto">
                                                <button class="btn btn-link text-start"><img src="assets/img/g-logo.png" alt="" class="me-1 me-md-2" /> Google</button>
                                            </div>
                                            <div class="col-auto">
                                                <button class="btn btn-link text-start"><img src="assets/img/f-logo.png" alt="" class="me-1 me-md-2" /> Facebook</button>
                                            </div>
                                        </div>
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
export class SigninComponent implements OnInit, OnDestroy {
    private stopDraftWatch: () => void = () => undefined;

    constructor(
        private router: Router,
        private route: ActivatedRoute,
        private authService: AuthService,
        private formDraftService: FormDraftService,
    ) {}

    email: string = "admin@alfa.com";
    password: string = "1234";
    isSubmitting = false;
    showValidationErrors = false;
    passwordVisible = false;
    errorMessage: string | null = null;
    infoMessage: string | null = null;

    ngOnInit() {
        const draft = this.formDraftService.load<{ email?: string }>(SIGNIN_DRAFT_KEY);
        if (draft?.email) {
            const draftEmail = String(draft.email).trim().toLowerCase();
            this.email = draftEmail === "admin@pika.com" ? "admin@alfa.com" : String(draft.email);
        }

        this.stopDraftWatch = this.formDraftService.watch(SIGNIN_DRAFT_KEY, () => ({
            email: this.email,
        }));

        const reason = this.route.snapshot.queryParamMap.get("reason");
        if (reason === "session_expired") {
            this.infoMessage = "Tu sesion expiro. Inicia sesion de nuevo para continuar.";
        }
    }

    ngOnDestroy(): void {
        this.stopDraftWatch();
    }

    get emailInvalid(): boolean {
        return this.showValidationErrors && !this.isValidEmail(this.email);
    }

    get passwordInvalid(): boolean {
        return this.showValidationErrors && this.password.trim().length === 0;
    }

    onCredentialInput(): void {
        if (this.errorMessage) {
            this.errorMessage = null;
        }
    }

    togglePasswordVisibility(): void {
        this.passwordVisible = !this.passwordVisible;
    }

    onSubmit() {
        if (this.isSubmitting) {
            return;
        }

        const email = this.email.trim().toLowerCase();
        this.showValidationErrors = true;
        if (!this.isValidEmail(email) || !this.password.trim()) {
            this.errorMessage = "Debes ingresar correo y clave.";
            return;
        }

        this.infoMessage = null;
        this.errorMessage = null;
        this.isSubmitting = true;

        this.authService
            .login({ email, password: this.password })
            .pipe(finalize(() => (this.isSubmitting = false)))
            .subscribe({
                next: () => {
                    this.formDraftService.remove(SIGNIN_DRAFT_KEY);
                    const redirectTo = this.route.snapshot.queryParamMap.get("redirectTo");
                    void this.router.navigateByUrl(redirectTo && redirectTo.startsWith("/") ? redirectTo : "/app/main-menu");
                },
                error: (error: unknown) => {
                    this.errorMessage = this.mapLoginError(error);
                    this.password = "";
                },
            });
    }

    private isValidEmail(value: string): boolean {
        const email = value.trim();
        if (!email) {
            return false;
        }
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    private mapLoginError(error: unknown): string {
        const message = error instanceof Error ? error.message.toLowerCase() : "";

        if (message.includes("invalid email or password")) {
            return "Correo o clave incorrectos. Intenta nuevamente.";
        }

        if (message.includes("required")) {
            return "Debes ingresar correo y clave para continuar.";
        }

        if (message.includes("failed to fetch") || message.includes("network")) {
            return "No se pudo conectar con el servidor. Verifica la conexion e intenta de nuevo.";
        }

        if (message.includes("status 500")) {
            return "El servidor presento un error. Intenta nuevamente en unos minutos.";
        }

        if (message.includes("status 404")) {
            return "No se encontro el endpoint de autenticacion en este dominio. Revisa el proxy para /api/v1 o configura apiBaseUrl apuntando al backend real (puede incluir path, por ejemplo ?apiBaseUrl=https://tu-dominio/backend).";
        }

        if (message.includes("auth endpoint not found at")) {
            return "El frontend no encuentra /api/v1/auth/login en la URL API configurada. Ajusta apiBaseUrl o publica el backend detras de /api/v1 en nginx.";
        }

        return "No fue posible iniciar sesion. Intenta nuevamente.";
    }
}

