import { Component, AfterViewInit, CUSTOM_ELEMENTS_SCHEMA, ViewChild, ElementRef, Renderer2, OnInit } from "@angular/core";
import { NgIf } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { RouterLink, Router, ActivatedRoute } from "@angular/router";
import Swiper from "swiper";
import { AuthFlowsApiService, OnboardingPayload } from "../../../services/auth-flows-api.service";
import { register } from "swiper/element/bundle";
register();

@Component({
    selector: "app-onboarding",
    standalone: true,
    imports: [RouterLink, FormsModule, NgIf],
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
                                <!-- content swiper -->
                                <div #swiperContainer class="swiper swipernavpaginationarrow swiper-no-swiping h-100 w-100">
                                    <div class="swiper-wrapper">
                                        <div class="swiper-slide">
                                            <div class="row gx-3 gx-lg-4">
                                                <div class="col-12 col-md-6 text-center position-relative py-4">
                                                    <img src="assets/img/adminux/onboarding1.png" alt="" class="mw-100 mb-3 mb-lg-4" />

                                                    <div class="avatar avatar-120 coverimg rounded-circle position-absolute start-50 bottom-0 z-index-0">
                                                        <input type="file" accept="image/*" id="userphotoonboarding" class="position-absolute h-100 w-100 opacity-0 z-index-1" (change)="handlePhotoUpload($event)" />
                                                        <i class="bi bi-upload bg-theme-1 fs-5 avatar avatar-40 rounded-circle z-index-0"></i>
                                                        <img src="assets/img/modern-ai-image/user-1.jpg" alt="" id="journeyuserpic" />
                                                    </div>
                                                </div>
                                                <div class="col-12 col-md-6 align-self-center py-5">
                                                    <h4>Who is going to use this app?</h4>
                                                    <p class="text-secondary mb-3 mb-lg-4">Please share your <b>Name</b> and <b>Photo</b> to display in application. This will be logged in user name wherever mentioned. This is just to make more intuitive communication with interface.</p>
                                                    <form class="">
                                                        <!-- Form elements -->
                                                        <div class="form-group mb-2 position-relative check-valid is-valid">
                                                            <div class="input-group input-group-lg">
                                                                <span class="input-group-text text-theme-1"><i class="bi bi-person-circle"></i></span>
                                                                <div class="form-floating">
                                                                    <input
                                                                        type="text"
                                                                        placeholder="Username"
                                                                        required
                                                                        class="form-control"
                                                                        [class.is-invalid]="showValidationErrors && displayName.trim().length < 2"
                                                                        autofocus
                                                                        id="usernamevalue"
                                                                        name="displayName"
                                                                        [(ngModel)]="displayName" />
                                                                    <label for="usernamevalue">Your good name</label>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </form>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="swiper-slide">
                                            <div class="row gx-3">
                                                <div class="col-12 col-md-6 text-center position-relative py-2">
                                                    <img src="assets/img/adminux/onboarding-2.png" alt="" class="mw-100" />
                                                </div>
                                                <div class="col-12 col-md-6 align-self-center">
                                                    <h4>What's your<br />Industries or Business Domain?</h4>
                                                    <p class="text-secondary mb-3 mb-lg-4">Selection of Industry or Business domain helps us to choose demo layout or formatting you would like as most of the preferences and based on market standard practices.</p>
                                                    <div class="row gx-3" id="domain-select">
                                                        <div class="col-4">
                                                            <div class="card shadow-none selectable anyone active text-center mb-3" data-title="finance" (click)="selectable($event)">
                                                                <div class="card-body">
                                                                    <div class="avatar avatar-30 text-theme-1 fs-4 mb-2">
                                                                        <i class="bi bi-coin"></i>
                                                                    </div>
                                                                    <p class="small text-secondary text-truncated">Finance</p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div class="col-4">
                                                            <div class="card shadow-none text-center selectable anyone mb-3" data-title="network" (click)="selectable($event)">
                                                                <div class="card-body">
                                                                    <div class="avatar avatar-30 text-theme-1 fs-4 mb-2">
                                                                        <i class="bi bi-wifi"></i>
                                                                    </div>
                                                                    <p class="small text-secondary text-truncated">Network</p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div class="col-4">
                                                            <div class="card shadow-none text-center selectable anyone mb-3" data-title="social" (click)="selectable($event)">
                                                                <div class="card-body">
                                                                    <div class="avatar avatar-30 text-theme-1 fs-4 mb-2">
                                                                        <i class="bi bi-people"></i>
                                                                    </div>
                                                                    <p class="small text-secondary text-truncated">Social</p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div class="col-4">
                                                            <div class="card shadow-none text-center selectable anyone mb-3" data-title="inventory" (click)="selectable($event)">
                                                                <div class="card-body">
                                                                    <div class="avatar avatar-30 text-theme-1 fs-4 mb-2">
                                                                        <i class="bi bi-basket"></i>
                                                                    </div>
                                                                    <p class="small text-secondary text-truncated">Inventory</p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div class="col-4">
                                                            <div class="card shadow-none text-center selectable anyone mb-3" data-title="learning" (click)="selectable($event)">
                                                                <div class="card-body">
                                                                    <div class="avatar avatar-30 text-theme-1 fs-4 mb-2">
                                                                        <i class="bi bi-book"></i>
                                                                    </div>
                                                                    <p class="small text-secondary text-truncated">Learing</p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="swiper-slide">
                                            <h4>Best brand color<br />It create identity as well as trust.</h4>
                                            <p class="text-secondary mb-3 mb-lg-4">Our template comes with Unlimited customized color scheme possibility. Here some color set are predefined to choose from.</p>
                                            <div class="row gx-3" id="theme-select">
                                                <div class="col-4 col-md-3 col-lg-2">
                                                    <div class="card shadow-none selectable anyone active text-center mb-2" data-title="theme-blue" (click)="selectable($event)">
                                                        <div class="card-body">
                                                            <div class="avatar avatar-30 rounded mb-2">
                                                                <span class="avatar avatar-40 bg-blue"></span>
                                                            </div>
                                                            <p class="text-secondary small">Blue</p>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div class="col-4 col-md-3 col-lg-2">
                                                    <div class="card shadow-none selectable anyone text-center mb-3" data-title="theme-indigo" (click)="selectable($event)">
                                                        <div class="card-body">
                                                            <div class="avatar avatar-30 rounded mb-2">
                                                                <span class="avatar avatar-40 bg-indigo"></span>
                                                            </div>
                                                            <p class="text-secondary small">Indigo</p>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div class="col-4 col-md-3 col-lg-2">
                                                    <div class="card shadow-none selectable anyone text-center mb-3" data-title="theme-purple" (click)="selectable($event)">
                                                        <div class="card-body">
                                                            <div class="avatar avatar-30 rounded mb-2">
                                                                <span class="avatar avatar-40 bg-purple"></span>
                                                            </div>
                                                            <p class="text-secondary small">Purple</p>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div class="col-4 col-md-3 col-lg-2">
                                                    <div class="card shadow-none selectable anyone text-center mb-3" data-title="theme-pink" (click)="selectable($event)">
                                                        <div class="card-body">
                                                            <div class="avatar avatar-30 rounded mb-2">
                                                                <span class="avatar avatar-40 bg-pink"></span>
                                                            </div>
                                                            <p class="text-secondary small">Pink</p>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div class="col-4 col-md-3 col-lg-2">
                                                    <div class="card shadow-none selectable anyone text-center mb-3" data-title="theme-red" (click)="selectable($event)">
                                                        <div class="card-body">
                                                            <div class="avatar avatar-30 rounded mb-2">
                                                                <span class="avatar avatar-40 bg-red"></span>
                                                            </div>
                                                            <p class="text-secondary small">Red</p>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div class="col-4 col-md-3 col-lg-2">
                                                    <div class="card shadow-none selectable anyone text-center mb-3" data-title="theme-orange" (click)="selectable($event)">
                                                        <div class="card-body">
                                                            <div class="avatar avatar-30 rounded mb-2">
                                                                <span class="avatar avatar-40 bg-orange"></span>
                                                            </div>
                                                            <p class="text-secondary small">Orange</p>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div class="col-4 col-md-3 col-lg-2">
                                                    <div class="card shadow-none selectable anyone text-center mb-3" data-title="theme-yellow" (click)="selectable($event)">
                                                        <div class="card-body">
                                                            <div class="avatar avatar-30 rounded mb-2">
                                                                <span class="avatar avatar-40 bg-yellow"></span>
                                                            </div>
                                                            <p class="text-secondary small">Yellow</p>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div class="col-4 col-md-3 col-lg-2">
                                                    <div class="card shadow-none selectable anyone text-center mb-3" data-title="theme-green" (click)="selectable($event)">
                                                        <div class="card-body">
                                                            <div class="avatar avatar-30 rounded mb-2">
                                                                <span class="avatar avatar-40 bg-green"></span>
                                                            </div>
                                                            <p class="text-secondary small">Green</p>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div class="col-4 col-md-3 col-lg-2">
                                                    <div class="card shadow-none selectable anyone text-center mb-3" data-title="theme-teal" (click)="selectable($event)">
                                                        <div class="card-body">
                                                            <div class="avatar avatar-30 rounded mb-2">
                                                                <span class="avatar avatar-40 bg-teal"></span>
                                                            </div>
                                                            <p class="text-secondary small">Teal</p>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div class="col-4 col-md-3 col-lg-2">
                                                    <div class="card shadow-none selectable anyone text-center mb-3" data-title="theme-cyan" (click)="selectable($event)">
                                                        <div class="card-body">
                                                            <div class="avatar avatar-30 rounded mb-2">
                                                                <span class="avatar avatar-40 bg-cyan"></span>
                                                            </div>
                                                            <p class="text-secondary small">Cyan</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div class="row gx-3 gx-lg-4 align-items-center mb-3 mb-lg-4">
                                                <div class="col-auto">
                                                    <div class="avatar avatar-70 my-3 text-center rounded">
                                                        <img src="assets/img/logo-512.png" alt="" class="mw-100" id="companylogolight" />
                                                    </div>
                                                </div>
                                                <div class="col">
                                                    <div>
                                                        <label for="companylogolightinput" class="form-label">Upload company logo </label><br />
                                                        <input class="form-control d-none" accept="image/*" type="file" id="companylogolightinput" />
                                                        <button class="btn btn-theme" onclick="this.previousElementSibling.click()"><i class="bi bi-camera"></i> Upload</button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <!-- content ends -->
                            </div>
                            <div class="card-footer">
                                <div class="row gx-3 gx-lg-4 justify-content-between">
                                    <div class="col-auto">
                                        <button #customPrevButton class="btn btn-theme btn-square btn-prev"><i class="bi bi-arrow-left"></i></button>
                                    </div>
                                    <div class="col-auto align-self-center">
                                        <div class="swiper-pagination line inline position-relative bottom-0"></div>
                                    </div>
                                    <div class="col-auto">
                                        <button #customNextButton class="btn btn-theme btn-square btn-next"><i class="bi bi-arrow-right"></i></button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `,
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class OnboardingComponent implements OnInit, AfterViewInit {
    @ViewChild("swiperContainer") swiperContainer!: ElementRef;
    @ViewChild("customNextButton") customNextButton!: ElementRef;
    @ViewChild("customPrevButton") customPrevButton!: ElementRef;
    swiperInstance!: Swiper;

    signupId = "";
    displayName = "";
    selectedPhotoDataUrl = "";
    errorMessage = "";
    showValidationErrors = false;
    isSaving = false;

    constructor(
        private readonly renderer: Renderer2,
        private readonly router: Router,
        private readonly route: ActivatedRoute,
        private readonly authFlowsApi: AuthFlowsApiService,
    ) {}

    ngOnInit(): void {
        this.signupId = this.route.snapshot.queryParamMap.get("signupId")?.trim() || "";
        this.displayName = this.route.snapshot.queryParamMap.get("name")?.trim() || "Adminuiux";

        if (!this.signupId) {
            this.errorMessage = "No encontramos un signup activo. Vuelve al registro para continuar.";
        }
    }

    ngAfterViewInit(): void {
        if (this.swiperContainer && this.customNextButton && this.customPrevButton) {
            this.swiperInstance = new Swiper(this.swiperContainer.nativeElement, {
                slidesPerView: 1,
                spaceBetween: 0,
                autoplay: false,
                navigation: {
                    nextEl: this.customNextButton.nativeElement,
                    prevEl: this.customPrevButton.nativeElement,
                },
                watchOverflow: false,
                on: {
                    reachEnd: () => {
                        setTimeout(() => {
                            this.customNextButton.nativeElement.disabled = false;
                            this.customPrevButton.nativeElement.disabled = true;
                            this.customNextButton.nativeElement.addEventListener("click", this.handleNextButtonClick.bind(this));
                        }, 50);
                    },
                },
            });
        } else {
            console.error("Swiper container or custom next button element not found.");
        }
    }

    handleNextButtonClick = (): void => {
        if (this.isSaving) {
            return;
        }

        this.showValidationErrors = true;
        this.errorMessage = "";

        if (!this.signupId) {
            this.errorMessage = "No encontramos un signup activo. Vuelve al registro para continuar.";
            return;
        }

        if (this.displayName.trim().length < 2) {
            this.errorMessage = "Debes escribir tu nombre para continuar el onboarding.";
            return;
        }

        const businessDomain = this.readActiveDataTitle("#domain-select") as OnboardingPayload["businessDomain"] | "";
        const theme = this.readActiveDataTitle("#theme-select") as OnboardingPayload["theme"] | "";
        if (!businessDomain || !theme) {
            this.errorMessage = "Selecciona dominio de negocio y tema antes de continuar.";
            return;
        }

        const buttonElement = this.customNextButton.nativeElement as HTMLButtonElement;
        const originalLabel = buttonElement.innerHTML;
        this.isSaving = true;
        buttonElement.disabled = true;
        buttonElement.innerHTML = '<div class="spinner-border text-white spinner-border-sm" role="status"><span class="visually-hidden"> Loading...</span></div>';
        this.authFlowsApi.upsertOnboarding({
            signupId: this.signupId,
            displayName: this.displayName.trim(),
            businessDomain,
            theme,
            country: "",
            photoDataUrl: this.selectedPhotoDataUrl,
            summaryAcknowledged: false,
        }).subscribe({
            next: () => {
                void this.router.navigate(["/auth/onboarding2"], {
                    queryParams: {
                        signupId: this.signupId,
                        name: this.displayName.trim(),
                    },
                });
            },
            error: (error: unknown) => {
                this.isSaving = false;
                buttonElement.disabled = false;
                buttonElement.innerHTML = originalLabel;
                this.errorMessage = this.resolveErrorMessage(error, "No fue posible guardar el onboarding.");
            },
            complete: () => {
                this.isSaving = false;
            },
        });
    };

    handlePhotoUpload(event: Event): void {
        const input = event.target as HTMLInputElement | null;
        const file = input?.files?.[0];
        if (!file) {
            return;
        }

        if (file.size > 1024 * 1024) {
            this.errorMessage = "La foto supera el tamano maximo permitido (1MB).";
            return;
        }

        const reader = new FileReader();
        reader.onload = () => {
            this.selectedPhotoDataUrl = String(reader.result ?? "");
            this.errorMessage = "";
        };
        reader.readAsDataURL(file);
    }

    selectable(event: Event) {
        let targetElement = event.target as HTMLElement | null;

        while (targetElement && !targetElement.classList.contains("selectable")) {
            targetElement = targetElement.parentElement;
        }

        if (!targetElement) {
            return;
        }

        const container = targetElement.closest("#domain-select, #theme-select");
        if (container) {
            const selectables = container.querySelectorAll(".selectable");
            selectables.forEach((element) => {
                this.renderer.removeClass(element, "active");
            });

            this.renderer.addClass(targetElement, "active");
            return;
        }

        this.renderer.addClass(targetElement, "active");
    }

    private readActiveDataTitle(containerSelector: string): string {
        const container = document.querySelector(containerSelector);
        if (!container) {
            return "";
        }

        const active = container.querySelector<HTMLElement>(".selectable.active");
        if (!active) {
            return "";
        }

        return String(active.dataset["title"] ?? "").trim().toLowerCase();
    }

    private resolveErrorMessage(error: unknown, fallback: string): string {
        if (error instanceof Error && error.message.trim()) {
            return error.message;
        }
        return fallback;
    }
}
