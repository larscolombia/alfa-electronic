import { Component, HostListener, Inject, OnInit, OnDestroy, AfterViewChecked, AfterViewInit, ElementRef, Renderer2, ApplicationConfig } from "@angular/core";
import { CommonModule, DOCUMENT } from "@angular/common";
import { NavigationCancel, NavigationEnd, NavigationError, NavigationStart, Router, RouterOutlet } from "@angular/router";
import { Subscription } from "rxjs";
import { WorkTimeTrackerService } from "./services/work-time-tracker.service";
import { ConfirmationModalService } from "./services/confirmation-modal.service";
import { CompanyProfile, CompanySettingsApiService } from "./services/company-settings-api.service";
import { SelectEnhancementService } from "./services/select-enhancement.service";

@Component({
    selector: "app-root",
    standalone: true,
    imports: [RouterOutlet, CommonModule],
    template: `
        <a class="app-skip-link" href="#main-content">Saltar al contenido principal</a>
        <div *ngIf="isNavigating" class="app-route-progress" role="progressbar" aria-label="Cargando vista" aria-valuetext="Cargando"></div>
        <div class="visually-hidden" aria-live="polite" aria-atomic="true">{{ navigationAnnouncement }}</div>
        <router-outlet></router-outlet>

        <div class="app-confirm-backdrop" *ngIf="confirmationModal.state() as dialog" (click)="cancelDialog()">
            <div class="app-confirm-modal" role="dialog" aria-modal="true" aria-labelledby="app-confirm-title" (click)="stopDialogPropagation($event)">
                <div class="app-confirm-header" [attr.data-variant]="dialog.variant">
                    <div class="app-confirm-icon">
                        <i class="bi bi-shield-exclamation"></i>
                    </div>
                    <h5 class="mb-0" id="app-confirm-title">{{ dialog.title }}</h5>
                </div>

                <div class="app-confirm-body">
                    <p class="mb-0 text-secondary">{{ dialog.message }}</p>
                </div>

                <div class="app-confirm-actions">
                    <button type="button" class="btn btn-outline-secondary" (click)="cancelDialog()">{{ dialog.cancelText }}</button>
                    <button type="button" class="btn app-confirm-primary-btn" [attr.data-variant]="dialog.variant" (click)="confirmDialog()">{{ dialog.confirmText }}</button>
                </div>
            </div>
        </div>
    `,
    styles: [`
        .app-skip-link { position: fixed; left: 1rem; top: -5rem; z-index: 1100; padding: .65rem 1rem; border-radius: .5rem; background: var(--bs-body-bg); color: var(--bs-body-color); box-shadow: 0 .25rem 1rem rgba(0,0,0,.2); }
        .app-skip-link:focus { top: 1rem; }
        .app-route-progress { position: fixed; inset: 0 0 auto; z-index: 1200; height: 3px; overflow: hidden; background: color-mix(in srgb, var(--bs-primary) 20%, transparent); }
        .app-route-progress::after { content: ""; display: block; width: 35%; height: 100%; background: var(--bs-primary); animation: app-route-loading 1s ease-in-out infinite; }
        @keyframes app-route-loading { from { transform: translateX(-110%); } to { transform: translateX(300%); } }
        @media (prefers-reduced-motion: reduce) { .app-route-progress::after { animation: none; width: 100%; } }
    `],
})
export class AppComponent implements OnDestroy {
    name = "Angular";
    lastScrollTop: number = 0;
    pagelength: number = 0;
    isNavigating = false;
    navigationAnnouncement = "";
    private routerSub!: Subscription;

    constructor(
        private el: ElementRef,
        private renderer: Renderer2,
        private router: Router,
        private tracker: WorkTimeTrackerService,
        public readonly confirmationModal: ConfirmationModalService,
        private companySettingsApi: CompanySettingsApiService,
        private readonly selectEnhancement: SelectEnhancementService,
        @Inject(DOCUMENT) private document: Document
    ) {
        this.tracker.startTracking();
        this.selectEnhancement.start();
        this.loadCompanyIdentity();
        this.routerSub = this.router.events.subscribe((event) => {
            if (event instanceof NavigationStart) {
                this.isNavigating = true;
                this.navigationAnnouncement = "Cargando vista";
            } else if (event instanceof NavigationEnd) {
                this.isNavigating = false;
                this.navigationAnnouncement = "Vista cargada";
                this.document.documentElement.scrollTop = 0;
                this.document.body.scrollTop = 0;
                queueMicrotask(() => this.focusPageContent());
            } else if (event instanceof NavigationCancel || event instanceof NavigationError) {
                this.isNavigating = false;
                this.navigationAnnouncement = "No se pudo completar la navegación";
            }
        });
    }

    ngOnDestroy(): void {
        this.tracker.stopTracking();
        this.selectEnhancement.stop();
        this.routerSub?.unsubscribe();
    }

    private focusPageContent(): void {
        const target = this.document.querySelector<HTMLElement>("#main-content, main, [role='main'], h1, h2, h5");
        if (!target) return;
        if (!target.hasAttribute("tabindex")) target.setAttribute("tabindex", "-1");
        target.focus({ preventScroll: true });
    }

    /**
     * Identidad de la empresa en el navegador: <title> y favicon (logo).
     * Se aplica una vez al arrancar, con los valores configurados en
     * /app/company-profile. Mejor esfuerzo: si el GET falla, se conserva el
     * titulo/fallback de index.html y la app sigue funcionando igual.
     */
    private loadCompanyIdentity(): void {
        this.companySettingsApi.getProfile().subscribe({
            next: (profile) => this.applyCompanyIdentity(profile),
            error: () => undefined,
        });
    }

    private applyCompanyIdentity(profile: CompanyProfile): void {
        const title = (profile?.pageTitle ?? "").trim();
        if (title) {
            this.document.title = title;
        }

        const favicon = (profile?.logoDataUrl ?? "").trim();
        if (!favicon.startsWith("data:image/")) {
            return;
        }
        let link = this.document.querySelector<HTMLLinkElement>("link[rel='icon']");
        if (!link) {
            link = this.document.createElement("link");
            link.rel = "icon";
            this.document.head.appendChild(link);
        }
        link.href = favicon;
    }

    ngAfterViewChecked(): void {
        this.processCoverImages(); // Process on initial load
        // page direction check
        const lastScrollTop = document.documentElement.scrollTop;
        this.pagelength = this.document.documentElement.scrollHeight - 50;

        // fixed button initial space when mobile footer
        this.fixedButton();
    }

    private processCoverImages() {
        const coverImages = this.el.nativeElement.querySelectorAll(".coverimg");

        coverImages.forEach((coverImage: HTMLElement) => {
            const imgElement = coverImage.querySelector("img");
            if (imgElement) {
                const imgSrc = imgElement.getAttribute("src");
                if (imgSrc) {
                    this.renderer.setStyle(coverImage, "background-image", `url('${imgSrc}')`);
                    this.renderer.removeChild(coverImage, imgElement); // Remove the img element
                }
            }
        });
    }

    @HostListener("window:scroll")
    onWindowScroll() {
        const st = this.document.documentElement.scrollTop;

        if (st + this.document.documentElement.clientHeight <= this.pagelength && st >= 50) {
            if (st > this.lastScrollTop) {
                this.renderer.addClass(this.document.body, "scrolldown");
                this.renderer.removeClass(this.document.body, "scrollup");
            } else if (st <= this.lastScrollTop) {
                this.renderer.addClass(this.document.body, "scrollup");
                this.renderer.removeClass(this.document.body, "scrolldown");
            }
            this.lastScrollTop = st;
        } else {
            this.renderer.addClass(this.document.body, "scrollup");
            this.renderer.removeClass(this.document.body, "scrolldown");
        }
        this.fixedButton();
    }

    @HostListener("document:keydown.escape")
    onEscapeKey(): void {
        if (this.confirmationModal.state()) {
            this.confirmationModal.cancel();
        }
    }

    stopDialogPropagation(event: MouseEvent): void {
        event.stopPropagation();
    }

    confirmDialog(): void {
        this.confirmationModal.confirm();
    }

    cancelDialog(): void {
        this.confirmationModal.cancel();
    }

    fixedButton() {
        /* fixed buttons space */
        const mobileFooter = this.document.querySelector(".adminuiux-mobile-footer") as HTMLElement;
        const fixedButtons = this.document.getElementById("fixedbuttons") as HTMLElement;

        if (mobileFooter && this.document.body.classList.contains("scrollup") && fixedButtons) {
            this.renderer.setStyle(fixedButtons, "paddingBottom", `${mobileFooter.offsetHeight}px`);
        } else if (fixedButtons) {
            this.renderer.setStyle(fixedButtons, "paddingBottom", "0px");
        }
    }
}
