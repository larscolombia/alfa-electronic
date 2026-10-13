import { Component, Inject, OnInit, OnDestroy, AfterViewInit, AfterViewChecked, ElementRef, Renderer2, HostListener } from "@angular/core";
import { CommonModule, DOCUMENT } from "@angular/common";
import { NavigationEnd, Router, RouterOutlet } from "@angular/router";
import { FormsModule } from "@angular/forms";
import { Subscription } from "rxjs";
import { MainHeaderComponent } from "../../components/header-footer-sidebar/main-header/main-header.component";
import { SidebarComponent } from "../../components/header-footer-sidebar/sidebar/sidebar.component";
import { MainFooterComponent } from "../../components/header-footer-sidebar/main-footer/main-footer.component";
import { ThemingComponent } from "../../components/offcanvas/theming.component";
import { NotificationComponent } from "../../components/offcanvas/notification.component";

@Component({
    selector: "app-internal-layout",
    standalone: true,
    imports: [RouterOutlet, CommonModule, FormsModule, MainHeaderComponent, SidebarComponent, MainFooterComponent, ThemingComponent, NotificationComponent],
    template: `
        <!-- header -->
        <app-main-header *ngIf="!hideHeader" class="adminuiux-header inner-page"></app-main-header>

        <div class="adminuiux-wrap">
            <!-- sidebar -->
            <app-sidebar *ngIf="!hideSidebar"></app-sidebar>
            <!-- page content -->
            <main [class.has-sidebar]="!hideSidebar" class="adminuiux-content" (click)="contentClick()">
                <router-outlet></router-outlet>
            </main>
        </div>

        <!-- color change pallette -->
        <app-theming class="offcanvas offcanvas-end shadow border-0 width-280" tabindex="-1" id="theming" data-bs-scroll="true" data-bs-backdrop="false" aria-labelledby="theminglabel"></app-theming>

        <!-- notification -->
        <app-notification class="offcanvas offcanvas-end shadow border-0 width-300" tabindex="-1" id="notification" data-bs-scroll="true" data-bs-backdrop="false" aria-labelledby="notificationlabel"></app-notification>

        <!-- standard footer -->
        <app-main-footer *ngIf="!hideMainFooter"></app-main-footer>
    `,
})
export class InternalLayoutComponent implements OnInit, AfterViewInit, AfterViewChecked, OnDestroy {
    private static readonly HEADER_CONTENT_GAP_PX = 12;

    showHeader = true;
    showBackHeader = false;
    hideMainFooter = false;
    hideSidebar = false;
    hideHeader = false;
    private resizeObserver!: ResizeObserver;
    private routerSubscription?: Subscription;

    constructor(
        private el: ElementRef,
        private renderer: Renderer2,
        private router: Router,
        @Inject(DOCUMENT) private document: Document,
    ) {}

    @HostListener("window:resize", ["$event"])
    onResize(event: any) {
        this.adjustPadding();
    }

    @HostListener("window:scroll")
    onScrolls() {
        const headerElement = this.el.nativeElement.querySelector(".adminuiux-header");
        if (window.pageYOffset > 30) {
            this.renderer.addClass(headerElement, "active");
        } else {
            this.renderer.removeClass(headerElement, "active");
        }
    }

    ngOnInit() {
        this.updateRouteScopedLayoutState(this.router.url);
        this.routerSubscription = this.router.events.subscribe((event) => {
            if (event instanceof NavigationEnd) {
                this.updateRouteScopedLayoutState(event.urlAfterRedirects);
            }
        });
        this.adjustPadding();
    }

    ngAfterViewInit() {
        this.observeHeaderResize();
        this.adjustPadding();
    }

    ngAfterViewChecked() {}

    ngOnDestroy() {
        this.routerSubscription?.unsubscribe();
        this.resizeObserver?.disconnect();
        // Reset body bottom padding on layout teardown
        this.renderer.setStyle(this.document.body, "padding-bottom", "0");
    }

    private readonly SIDEBAR_HIDDEN_ROUTES = ["/app/main-menu", "/app/grid-view"];

    private updateRouteScopedLayoutState(url: string) {
        this.hideMainFooter = url.includes("/app/profile-professional");
        const noSidebar = this.SIDEBAR_HIDDEN_ROUTES.some((r) => url.startsWith(r));
        this.hideSidebar = noSidebar;
        this.hideHeader = noSidebar;
        if (noSidebar) {
            this.renderer.removeClass(this.document.body, "sidebar-open");
            this.renderer.removeClass(this.document.body, "sidebar-close");
            // The header is removed via *ngIf so its padding-top must be cleared immediately;
            // we use setTimeout(0) so Angular's CD has removed the element before we measure.
            setTimeout(() => {
                const content = this.el.nativeElement.querySelector(".adminuiux-content");
                if (content) {
                    this.renderer.setStyle(content, "padding-top", "0");
                }
            }, 0);
        } else {
            this.openSidebarForCurrentBreakpoint();
            // Ensure spacing is refreshed when the header is mounted again.
            setTimeout(() => {
                this.observeHeaderResize();
                this.adjustPadding();
            }, 0);
        }
    }

    private observeHeaderResize() {
        this.resizeObserver?.disconnect();

        const navbar = this.el.nativeElement.querySelector(".adminuiux-header .navbar");
        if (navbar && typeof ResizeObserver !== "undefined") {
            this.resizeObserver = new ResizeObserver(() => this.adjustPadding());
            this.resizeObserver.observe(navbar);
        }
    }

    private openSidebarForCurrentBreakpoint() {
        if (window.innerWidth >= 992) {
            this.renderer.addClass(this.document.body, "sidebar-open");
            this.renderer.removeClass(this.document.body, "sidebar-close");
        } else {
            this.renderer.addClass(this.document.body, "sidebar-close");
            this.renderer.removeClass(this.document.body, "sidebar-open");
        }
    }

    adjustPadding() {
        const headerElement = this.el.nativeElement.querySelector(".adminuiux-header .navbar");
        const sidebarPadding = this.el.nativeElement.querySelector(".adminuiux-sidebar");
        const contentPadding = this.el.nativeElement.querySelector(".adminuiux-content");

        if (headerElement) {
            const headerHeight = headerElement.offsetHeight + InternalLayoutComponent.HEADER_CONTENT_GAP_PX;
            this.renderer.setStyle(contentPadding, "padding-top", `${headerHeight}px`);
            if (sidebarPadding) { this.renderer.setStyle(sidebarPadding, "padding-top", `${headerHeight}px`); }
        } else if (this.hideHeader && contentPadding) {
            this.renderer.setStyle(contentPadding, "padding-top", "0");
        }

        const footerMobileElement = this.el.nativeElement.querySelector(".adminuiux-mobile-footer");

        if (footerMobileElement) {
            const footerMobileHeight = footerMobileElement.offsetHeight;
            this.renderer.setStyle(this.document.body, "padding-bottom", `calc(${footerMobileHeight}px + 10px + env(safe-area-inset-bottom) )`);
        } else {
            this.renderer.setStyle(this.document.body, "padding-bottom", "0");
        }
    }
    contentClick() {
        const windowWidth = window.innerWidth;
        if (windowWidth < 992) {
            this.renderer.removeClass(this.document.body, "sidebar-open");
            this.renderer.addClass(this.document.body, "sidebar-close");
        }
    }
}
