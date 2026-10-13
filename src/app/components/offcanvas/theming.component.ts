import { Component, Renderer2, Inject } from "@angular/core";
import { RouterLink } from "@angular/router";
import { DOCUMENT } from "@angular/common";

@Component({
    selector: "app-theming",
    standalone: true,
    imports: [RouterLink],
    template: `
        <div class="offcanvas-header border-bottom">
            <div>
                <h5 class="offcanvas-title" id="theminglabel">Personalize</h5>
                <p class="text-secondary small">Make it more like your own</p>
            </div>
            <button type="button" class="btn-close" data-bs-dismiss="offcanvas" aria-label="Close"></button>
        </div>
        <div class="offcanvas-body">
            <h6 class="offcanvas-title">Colors</h6>
            <p class="text-secondary small mb-4">Change colors of templates</p>

            <div class="row gx-2 mb-4 theme-select">
                <div class="col-auto">
                    <div class="select-box text-center mb-2" data-title="default" (click)="selectTheme('default', $event)">
                        <span class="avatar avatar-40 rounded-circle mb-2 bg-default">
                            <i class="bi bi-arrow-clockwise"></i>
                        </span>
                    </div>
                </div>
                <div class="col-auto">
                    <div class="select-box text-center mb-2" data-title="theme-blue" (click)="selectTheme('theme-blue', $event)">
                        <span class="avatar avatar-40 rounded-circle mb-2 bg-blue"></span>
                    </div>
                </div>
                <div class="col-auto">
                    <div class="select-box text-center mb-2" data-title="theme-indigo" (click)="selectTheme('theme-indigo', $event)">
                        <span class="avatar avatar-40 rounded-circle mb-2 bg-indigo"></span>
                    </div>
                </div>
                <div class="col-auto">
                    <div class="select-box text-center mb-2" data-title="theme-purple" (click)="selectTheme('theme-purple', $event)">
                        <span class="avatar avatar-40 rounded-circle mb-2 bg-purple"></span>
                    </div>
                </div>
                <div class="col-auto">
                    <div class="select-box text-center mb-2" data-title="theme-pink" (click)="selectTheme('theme-pink', $event)">
                        <span class="avatar avatar-40 rounded-circle mb-2 bg-pink"></span>
                    </div>
                </div>
                <div class="col-auto">
                    <div class="select-box text-center mb-2" data-title="theme-red" (click)="selectTheme('theme-red', $event)">
                        <span class="avatar avatar-40 rounded-circle mb-2 bg-red"></span>
                    </div>
                </div>
                <div class="col-auto">
                    <div class="select-box text-center mb-2" data-title="theme-orange" (click)="selectTheme('theme-orange', $event)">
                        <span class="avatar avatar-40 rounded-circle mb-2 bg-orange"></span>
                    </div>
                </div>
                <div class="col-auto">
                    <div class="select-box text-center mb-2" data-title="theme-yellow" (click)="selectTheme('theme-yellow', $event)">
                        <span class="avatar avatar-40 rounded-circle mb-2 bg-yellow"></span>
                    </div>
                </div>
                <div class="col-auto">
                    <div class="select-box text-center mb-2" data-title="theme-green" (click)="selectTheme('theme-green', $event)">
                        <span class="avatar avatar-40 rounded-circle mb-2 bg-green"></span>
                    </div>
                </div>
                <div class="col-auto">
                    <div class="select-box text-center mb-2" data-title="theme-teal" (click)="selectTheme('theme-teal', $event)">
                        <span class="avatar avatar-40 rounded-circle mb-2 bg-teal"></span>
                    </div>
                </div>
                <div class="col-auto">
                    <div class="select-box text-center mb-2" data-title="theme-pista" (click)="selectTheme('theme-pista', $event)">
                        <span class="avatar avatar-40 rounded-circle mb-2 bg-pista"></span>
                    </div>
                </div>
                <div class="col-auto">
                    <div class="select-box text-center mb-2" data-title="theme-cyan" (click)="selectTheme('theme-cyan', $event)">
                        <span class="avatar avatar-40 rounded-circle mb-2 bg-cyan"></span>
                    </div>
                </div>
                <div class="col-auto">
                    <div class="select-box text-center mb-2" data-title="theme-grey" (click)="selectTheme('theme-grey', $event)">
                        <span class="avatar avatar-40 rounded-circle mb-2 bg-grey"></span>
                    </div>
                </div>
                <div class="col-auto">
                    <div class="select-box text-center mb-2" data-title="theme-brown" (click)="selectTheme('theme-brown', $event)">
                        <span class="avatar avatar-40 rounded-circle mb-2 bg-brown"></span>
                    </div>
                </div>
                <div class="col-auto">
                    <div class="select-box text-center mb-2" data-title="theme-chocolate" (click)="selectTheme('theme-chocolate', $event)">
                        <span class="avatar avatar-40 rounded-circle mb-2 bg-chocolate"></span>
                    </div>
                </div>
                <div class="col-auto">
                    <div class="select-box text-center mb-2" data-title="theme-black" (click)="selectTheme('theme-black', $event)">
                        <span class="avatar avatar-40 rounded-circle mb-2 bg-dark"></span>
                    </div>
                </div>
            </div>

            <h6 class="offcanvas-title">Backgrounds</h6>
            <p class="text-secondary small mb-4">Change color for background</p>
            <div class="row gx-2 mb-4 theme-background">
                <div class="col-auto">
                    <div class="gradient-box text-center mb-2" data-title="bg-default" (click)="selectBGradient('bg-default', $event)">
                        <span class="avatar avatar-40 rounded-circle mb-2 bg-default"><i class="bi bi-arrow-clockwise"></i></span>
                    </div>
                </div>
                <div class="col-auto">
                    <div class="gradient-box text-center mb-2" data-title="bg-white" (click)="selectBGradient('bg-white', $event)">
                        <span class="avatar avatar-40 rounded-circle mb-2 bg-white"></span>
                    </div>
                </div>
                <div class="col-auto">
                    <div class="gradient-box text-center mb-2" data-title="bg-r-gradient" (click)="selectBGradient('bg-r-gradient', $event)">
                        <span class="avatar avatar-40 rounded-circle mb-2 bg-r-gradient"></span>
                    </div>
                </div>
                <div class="col-auto">
                    <div class="gradient-box text-center mb-2" data-title="bg-gradient-1" (click)="selectBGradient('bg-gradient-1', $event)">
                        <span class="avatar avatar-40 rounded-circle mb-2 bg-gradient-1"></span>
                    </div>
                </div>
                <div class="col-auto">
                    <div class="gradient-box text-center mb-2" data-title="bg-gradient-2" (click)="selectBGradient('bg-gradient-2', $event)">
                        <span class="avatar avatar-40 rounded-circle mb-2 bg-gradient-2"></span>
                    </div>
                </div>
                <div class="col-auto">
                    <div class="gradient-box text-center mb-2" data-title="bg-gradient-3" (click)="selectBGradient('bg-gradient-3', $event)">
                        <span class="avatar avatar-40 rounded-circle mb-2 bg-gradient-3"></span>
                    </div>
                </div>
                <div class="col-auto">
                    <div class="gradient-box text-center mb-2" data-title="bg-gradient-4" (click)="selectBGradient('bg-gradient-4', $event)">
                        <span class="avatar avatar-40 rounded-circle mb-2 bg-gradient-4"></span>
                    </div>
                </div>
                <div class="col-auto">
                    <div class="gradient-box text-center mb-2" data-title="bg-gradient-5" (click)="selectBGradient('bg-gradient-5', $event)">
                        <span class="avatar avatar-40 rounded-circle mb-2 bg-gradient-5"></span>
                    </div>
                </div>
                <div class="col-auto">
                    <div class="gradient-box text-center mb-2" data-title="bg-gradient-6" (click)="selectBGradient('bg-gradient-6', $event)">
                        <span class="avatar avatar-40 rounded-circle mb-2 bg-gradient-6"></span>
                    </div>
                </div>
                <div class="col-auto">
                    <div class="gradient-box text-center mb-2" data-title="bg-gradient-7" (click)="selectBGradient('bg-gradient-7', $event)">
                        <span class="avatar avatar-40 rounded-circle mb-2 bg-gradient-7"></span>
                    </div>
                </div>
                <div class="col-auto">
                    <div class="gradient-box text-center mb-2" data-title="bg-gradient-8" (click)="selectBGradient('bg-gradient-8', $event)">
                        <span class="avatar avatar-40 rounded-circle mb-2 bg-gradient-8"></span>
                    </div>
                </div>
                <div class="col-auto">
                    <div class="gradient-box text-center mb-2" data-title="bg-gradient-9" (click)="selectBGradient('bg-gradient-9', $event)">
                        <span class="avatar avatar-40 rounded-circle mb-2 bg-gradient-9"></span>
                    </div>
                </div>
                <div class="col-auto">
                    <div class="gradient-box text-center mb-2" data-title="bg-gradient-10" (click)="selectBGradient('bg-gradient-10', $event)">
                        <span class="avatar avatar-40 rounded-circle mb-2 bg-gradient-10"></span>
                    </div>
                </div>
            </div>

            <h6 class="offcanvas-title">Sidebar Layout</h6>
            <p class="text-secondary small mb-4">Change sidebar layout style</p>

            <div class="row gx-2 mb-4 sidebar-layout">
                <div class="col-auto">
                    <div class="select-box text-center mb-2" data-title="adminuiux-sidebar-standard" data-bs-toggle="tooltip" title="None" (click)="selectSidebarStyle('adminuiux-sidebar-standard', $event)">
                        <span class="avatar avatar-40 rounded-circle mb-2 bg-default">
                            <i class="bi bi-arrow-clockwise"></i>
                        </span>
                    </div>
                </div>
                <div class="col-auto">
                    <div class="select-box text-center mb-2" data-title="adminuiux-sidebar-iconic" data-bs-toggle="tooltip" title="Iconic" (click)="selectSidebarStyle('adminuiux-sidebar-iconic', $event)">
                        <span class="avatar avatar-40 rounded-circle mb-2 bg-default">
                            <i class="bi bi-bezier h4"></i>
                        </span>
                    </div>
                </div>
                <div class="col-auto">
                    <div class="select-box text-center mb-2" data-title="adminuiux-sidebar-boxed" data-bs-toggle="tooltip" title="Boxed" (click)="selectSidebarStyle('adminuiux-sidebar-boxed', $event)">
                        <span class="avatar avatar-40 rounded-circle mb-2 bg-default">
                            <i class="bi bi-box h5"></i>
                        </span>
                    </div>
                </div>
                <div class="col-auto">
                    <div class="select-box text-center mb-2" data-title="adminuiux-sidebar-boxed adminuiux-sidebar-iconic" data-bs-toggle="tooltip" title="Iconic+Boxed" (click)="selectSidebarStyle('adminuiux-sidebar-boxed adminuiux-sidebar-iconic', $event)">
                        <span class="avatar avatar-40 rounded-circle mb-2 bg-default">
                            <i class="bi bi-bounding-box h5"></i>
                        </span>
                    </div>
                </div>
            </div>

            <div class="text-center mb-4">
                <a routerLink="/app/personalization" class="btn btn-sm btn-outline-theme">More options <i class="bi bi-arrow-right-short"></i></a>
            </div>
        </div>
    `,
})
export class ThemingComponent {
    // theme color
    appliedTheme: string | null = null;
    currentTheme: string | null = null;

    // background gradient color
    appliedbgGrad: string | null = null;
    currentbgGrad: string | null = null;

    // sidebar style gradient color
    appliedSidebarStyle: string | null = null;
    currentSidebarStyle: string | null = null;

    constructor(private renderer: Renderer2, @Inject(DOCUMENT) private document: Document) {}

    ngOnInit() {
        // theme color set
        this.appliedTheme = localStorage.getItem("data-theme");
        this.currentTheme = this.document.body.getAttribute("data-theme");

        if (this.appliedTheme && this.currentTheme) {
            this.renderer.removeClass(this.document.body, this.currentTheme);
            this.renderer.addClass(this.document.body, this.appliedTheme);
            this.document.body.setAttribute("data-theme", this.appliedTheme);

            const activeThemeEle = this.document.querySelector(`[data-title="${this.appliedTheme}"]`);
            this.renderer.addClass(activeThemeEle, "active");
        }

        // background Gradient color set
        this.appliedbgGrad = localStorage.getItem("data-bggradient");
        this.currentbgGrad = this.document.body.getAttribute("data-bggradient");

        if (this.appliedbgGrad && this.currentbgGrad) {
            this.renderer.removeClass(this.document.body, this.currentbgGrad);
            this.renderer.addClass(this.document.body, this.appliedbgGrad);
            this.document.body.setAttribute("data-bggradient", this.appliedbgGrad);

            const activebgGradEle = this.document.querySelector(`[data-title="${this.appliedbgGrad}"]`);
            this.renderer.addClass(activebgGradEle, "active");
        }

        // sidebar style set
        this.appliedSidebarStyle = localStorage.getItem("data-sidebarlayout");
        this.currentSidebarStyle = this.document.body.getAttribute("data-sidebarlayout");

        if (this.appliedSidebarStyle && this.currentSidebarStyle) {
            const sidebarClassesCurrent = this.currentSidebarStyle.split(" ");
            sidebarClassesCurrent.forEach((sidebarClassCurrent) => {
                if (sidebarClassCurrent) {
                    // Check for empty strings
                    this.renderer.addClass(this.document.body, sidebarClassCurrent);
                }
            });

            const sidebarClasses = this.appliedSidebarStyle.split(" ");
            sidebarClasses.forEach((sidebarClass) => {
                if (sidebarClass) {
                    // Check for empty strings
                    this.renderer.addClass(this.document.body, sidebarClass);
                }
            });
            this.document.body.setAttribute("data-sidebarlayout", this.appliedSidebarStyle);

            const activeSidebarEle = this.document.querySelector(`[data-title="${this.appliedSidebarStyle}"]`);
            this.renderer.addClass(activeSidebarEle, "active");
        }
    }

    // theme color set
    selectTheme(theme: string, event: MouseEvent) {
        const body = this.document.body;

        // remove previous class
        if (this.currentTheme) {
            this.renderer.removeClass(body, this.currentTheme);
        }
        if (this.appliedTheme) {
            this.renderer.removeClass(body, this.appliedTheme);
            this.appliedTheme = theme;
        } else {
            this.appliedTheme = theme;
        }

        // Add the new theme class
        this.renderer.addClass(body, theme);
        this.renderer.setAttribute(body, "data-theme", theme);

        // set theme as local storage
        localStorage.setItem("data-theme", theme);

        // remove active class from other themes
        if (event.currentTarget) {
            const target = event.currentTarget as HTMLElement;
            const selectBoxes = this.document.querySelectorAll(".select-box");

            selectBoxes.forEach((box) => {
                if (box !== event.currentTarget) {
                    this.renderer.removeClass(box, "active");
                }
            });
            this.renderer.addClass(target, "active");
        }
    }

    // background gradient set
    selectBGradient(bgGrad: string, event: MouseEvent) {
        const body = this.document.body;
        // remove previous class
        if (this.currentbgGrad) {
            this.renderer.removeClass(body, this.currentbgGrad);
        }

        if (this.appliedbgGrad) {
            this.renderer.removeClass(body, this.appliedbgGrad);
            this.appliedbgGrad = bgGrad;
        } else {
            this.appliedbgGrad = bgGrad;
        }

        // Add the new theme class
        this.renderer.addClass(body, bgGrad);
        this.renderer.setAttribute(body, "data-bggradient", bgGrad);

        // set theme as local storage
        localStorage.setItem("data-bggradient", bgGrad);

        // remove active class from other themes
        if (event.currentTarget) {
            const targetBg = event.currentTarget as HTMLElement;
            const selectBoxes = this.document.querySelectorAll(".gradient-box");

            selectBoxes.forEach((boxBg) => {
                if (boxBg !== event.currentTarget) {
                    this.renderer.removeClass(boxBg, "active");
                }
            });
            this.renderer.addClass(targetBg, "active");
        }
    }

    // sidebar style set
    selectSidebarStyle(sidebarStyle: string, event: MouseEvent) {
        const body = this.document.body;
        // remove previous class
        if (this.currentSidebarStyle) {
            const sidebarClassesCurrent = this.currentSidebarStyle.split(" ");
            sidebarClassesCurrent.forEach((sidebarClassCurrent) => {
                if (sidebarClassCurrent) {
                    // Check for empty strings
                    this.renderer.removeClass(this.document.body, sidebarClassCurrent);
                }
            });
        }

        if (this.appliedSidebarStyle) {
            const sidebarClassesApplied = this.appliedSidebarStyle.split(" ");
            sidebarClassesApplied.forEach((sidebarClass) => {
                if (sidebarClass) {
                    // Check for empty strings
                    this.renderer.removeClass(this.document.body, sidebarClass);
                }
            });
            this.appliedSidebarStyle = sidebarStyle;
        } else {
            this.appliedSidebarStyle = sidebarStyle;
        }

        // Add the new theme class
        const sidebarClasses = sidebarStyle.split(" ");
        sidebarClasses.forEach((sidebarClass) => {
            if (sidebarClass) {
                // Check for empty strings
                this.renderer.addClass(body, sidebarClass);
            }
        });
        this.renderer.setAttribute(body, "data-sidebarlayout", sidebarStyle);

        // set theme as local storage
        localStorage.setItem("data-sidebarlayout", sidebarStyle);

        // remove active class from other themes
        if (event.currentTarget) {
            const targetSidebarStyle = event.currentTarget as HTMLElement;
            const selectSidebarBoxes = this.document.querySelectorAll(".select-box");

            selectSidebarBoxes.forEach((SidebarBox) => {
                if (SidebarBox !== event.currentTarget) {
                    this.renderer.removeClass(SidebarBox, "active");
                }
            });
            this.renderer.addClass(targetSidebarStyle, "active");
        }
    }
}
