import { Component, OnInit, OnDestroy, ChangeDetectorRef } from "@angular/core";
import { NgFor, NgIf } from "@angular/common";
import { RouterLink, Router, ActivatedRoute } from "@angular/router";
import { Subject, Subscription, of } from "rxjs";
import { debounceTime, distinctUntilChanged, switchMap, catchError } from "rxjs/operators";
import { GlobalSearchService, GlobalSearchResult } from "../../../services/global-search.service";

interface SubItem { label: string; icon: string; route: string; }
interface AppModule {
    label: string; sublabel: string; icon: string; color: string;
    route?: string; routeKey?: string; children?: SubItem[];
}

@Component({
    selector: "app-main-menu",
    standalone: true,
    imports: [NgFor, NgIf, RouterLink],
    template: `
        <div class="mm-root" [class.mm-root--searching]="!isSearchLoading && !!query && !selected">

            <!-- NIVEL RAIZ -->
            <ng-container *ngIf="!selected">
                <div class="mm-top mm-panel" [class.mm-panel--bck]="animDir === 'bck'">
                    <div class="mm-logo-frame">
                        <img src="assets/img/logo-pika.png" alt="PIKA" class="mm-logo" />
                    </div>
                    <h1 class="mm-title">Menu principal</h1>
                </div>

                <div class="mm-search-wrap mm-panel" [class.mm-panel--bck]="animDir === 'bck'">
                    <div class="mm-search-box">
                        <i class="bi bi-search mm-search-icon"></i>
                        <input
                            class="mm-search-input"
                            type="text"
                            placeholder="Buscar clientes, prospectos, proyectos..."
                            [value]="query"
                            (input)="onSearch($event)"
                            autocomplete="off"
                            spellcheck="false"
                        />
                        <button *ngIf="query" class="mm-search-clear" (click)="clearSearch()" aria-label="Limpiar">
                            <i class="bi bi-x-circle-fill"></i>
                        </button>
                    </div>
                </div>

                <!-- preloader -->
                <div class="mm-loader mm-panel" *ngIf="isSearchLoading">
                    <div class="mm-loader-dots">
                        <span></span><span></span><span></span>
                    </div>
                    <p class="mm-loader-label">Buscando en el sistema&hellip;</p>
                </div>

                <!-- resultados -->
                <div class="mm-results-area mm-panel" *ngIf="!isSearchLoading && query">
                    <ng-container *ngIf="globalResults.length > 0">
                        <p class="mm-results-count">
                            <span class="mm-results-num">{{ globalResults.length }}</span>
                            resultado{{ globalResults.length !== 1 ? 's' : '' }} para
                            <strong>"{{ query }}"</strong>
                        </p>
                        <div class="mm-result-list">
                            <a
                                class="mm-result-card"
                                *ngFor="let r of globalResults; let i = index"
                                [routerLink]="r.route"
                                [style.animation-delay.ms]="i * 38"
                            >
                                <div class="mm-result-icon" [style.background]="r.color">
                                    <i class="bi {{ r.icon }}"></i>
                                </div>
                                <div class="mm-result-body">
                                    <span class="mm-result-title">{{ r.title }}</span>
                                    <span class="mm-result-sub" *ngIf="r.subtitle">{{ r.subtitle }}</span>
                                </div>
                                <span class="mm-result-badge mm-badge--{{ r.type }}">{{ r.typeLabel }}</span>
                                <i class="bi bi-arrow-up-right mm-result-arrow"></i>
                            </a>
                        </div>
                    </ng-container>
                    <div class="mm-no-results" *ngIf="globalResults.length === 0">
                        <i class="bi bi-search"></i>
                        <p>Sin resultados para <strong>"{{ query }}"</strong></p>
                        <p class="mm-no-hint">Intenta con nombre, empresa o ciudad</p>
                    </div>
                </div>

                <!-- grid principal -->
                <div class="mm-grid mm-panel" [class.mm-panel--bck]="animDir === 'bck'" *ngIf="!query">
                    <ng-container *ngFor="let m of modules">
                        <button *ngIf="m.children" class="mm-icon-btn" (click)="open(m)">
                            <div class="mm-icon" [style.background]="m.color"><i class="bi {{ m.icon }}"></i></div>
                            <span class="mm-label">{{ m.label }}</span>
                            <span class="mm-sublabel">{{ m.sublabel }}</span>
                        </button>
                        <a *ngIf="!m.children" class="mm-icon-btn" [routerLink]="m.route!">
                            <div class="mm-icon" [style.background]="m.color"><i class="bi {{ m.icon }}"></i></div>
                            <span class="mm-label">{{ m.label }}</span>
                            <span class="mm-sublabel">{{ m.sublabel }}</span>
                        </a>
                    </ng-container>
                </div>
            </ng-container>

            <!-- NIVEL SUB-OPCIONES -->
            <ng-container *ngIf="selected">
                <div class="mm-sub-topbar mm-panel" [class.mm-panel--bck]="animDir === 'bck'">
                    <img src="assets/img/logo-pika.png" alt="PIKA" class="mm-logo-sm" />
                    <button class="mm-back-btn" (click)="back()">
                        <i class="bi bi-chevron-left"></i> Menu principal
                    </button>
                </div>
                <div class="mm-breadcrumb mm-panel" [class.mm-panel--bck]="animDir === 'bck'">
                    <div class="mm-breadcrumb-icon" [style.background]="selected.color">
                        <i class="bi {{ selected.icon }}"></i>
                    </div>
                    <div class="mm-breadcrumb-text">
                        <h1 class="mm-title mb-0">{{ selected.label }}</h1>
                        <p class="mm-subtitle mb-0">{{ selected.sublabel }}</p>
                    </div>
                </div>
                <div class="mm-grid mm-grid--sub mm-panel" [class.mm-panel--bck]="animDir === 'bck'">
                    <a class="mm-icon-btn" *ngFor="let s of selected.children" [routerLink]="s.route">
                        <div class="mm-icon mm-icon--sub" [style.background]="selected.color"><i class="bi {{ s.icon }}"></i></div>
                        <span class="mm-label">{{ s.label }}</span>
                    </a>
                </div>
            </ng-container>

        </div>
    `,
    styles: [`
        :host { display: block; }
        .mm-root {
            position: fixed; inset: 0; overflow-y: auto; overflow-x: hidden;
            display: flex; flex-direction: column;
            align-items: center; justify-content: safe center; padding: 2.5rem 1rem 2rem;
            overscroll-behavior-y: none;
            scrollbar-width: thin; scrollbar-color: rgba(100,130,200,0.28) transparent;
            background:
                radial-gradient(ellipse 80% 55% at 50% -5%, rgba(90,130,255,0.12) 0%, transparent 65%),
                linear-gradient(160deg,#eef2ff 0%,#fdf8f2 50%,#eff6f4 100%);
        }
        .mm-root::-webkit-scrollbar { width: 4px; }
        .mm-root::-webkit-scrollbar-track { background: transparent; }
        .mm-root::-webkit-scrollbar-thumb { background: rgba(100,130,200,0.28); border-radius: 2px; }
        .mm-root--searching { justify-content: flex-start; }
        @keyframes slideInFwd { from{opacity:0;transform:translateX(36px)} to{opacity:1;transform:translateX(0)} }
        @keyframes slideInBck { from{opacity:0;transform:translateX(-36px)} to{opacity:1;transform:translateX(0)} }
        .mm-panel { animation: slideInFwd 0.22s ease both; }
        .mm-panel--bck { animation: slideInBck 0.22s ease both; }

        /* top */
        .mm-top { display:flex; flex-direction:column; align-items:center; margin-bottom:2rem; }
        .mm-logo-frame {
            padding:1rem 1.5rem; border-radius:20px; margin-bottom:1.1rem;
            background:linear-gradient(160deg,#ffffff 0%,#f4f7fc 100%);
            box-shadow:
                0 8px 28px rgba(30,55,120,0.14),
                0 2px 6px rgba(30,55,120,0.09),
                inset 0 1px 0 rgba(255,255,255,0.95);
            border:1px solid rgba(140,170,220,0.22);
        }
        .mm-logo {
            height:88px; width:auto; object-fit:contain;
            filter:drop-shadow(0 3px 6px rgba(25,45,95,0.22)) drop-shadow(0 1px 2px rgba(25,45,95,0.14));
        }
        .mm-title { font-size:1.85rem; font-weight:800; color:#1a2540; margin:0 0 0.2rem; line-height:1; letter-spacing:-0.03em; }
        .mm-subtitle { font-size:0.88rem; color:#6b7c9e; margin:0; }

        /* search bar */
        .mm-search-wrap { width:100%; max-width:540px; margin-bottom:2rem; }
        .mm-search-box {
            position:relative; display:flex; align-items:center;
            background:rgba(255,255,255,0.9); backdrop-filter:blur(10px);
            border:1.5px solid rgba(100,130,200,0.18); border-radius:14px;
            box-shadow:0 2px 16px rgba(30,50,100,0.08),0 1px 0 rgba(255,255,255,0.95) inset;
            transition:border-color 0.16s,box-shadow 0.16s;
        }
        .mm-search-box:focus-within {
            border-color:rgba(80,120,220,0.4);
            box-shadow:0 4px 24px rgba(80,120,220,0.14),0 1px 0 rgba(255,255,255,0.95) inset;
        }
        .mm-search-icon { flex-shrink:0; padding:0 0.75rem 0 1.1rem; font-size:1rem; color:#8a9cbf; pointer-events:none; }
        .mm-search-input { flex:1; border:none; background:transparent; outline:none; font-size:0.95rem; color:#1c2b45; padding:0.88rem 0; min-width:0; }
        .mm-search-input::placeholder { color:#b0bdd4; }
        .mm-search-clear { flex-shrink:0; background:none; border:none; padding:0.5rem 1rem; color:#b0bdd4; cursor:pointer; font-size:0.95rem; transition:color 0.12s; line-height:1; }
        .mm-search-clear:hover { color:#6b7c9e; }

        /* loader */
        .mm-loader { display:flex; flex-direction:column; align-items:center; gap:0.7rem; padding:2rem 0; }
        .mm-loader-dots { display:flex; gap:0.45rem; }
        .mm-loader-dots span {
            width:9px; height:9px; border-radius:50%;
            background:linear-gradient(135deg,#5a82e6,#38bdf8);
            animation:dotPulse 1.2s ease-in-out infinite;
        }
        .mm-loader-dots span:nth-child(2) { animation-delay:0.2s; }
        .mm-loader-dots span:nth-child(3) { animation-delay:0.4s; }
        @keyframes dotPulse {
            0%,80%,100% { transform:scale(0.7); opacity:0.35; }
            40%          { transform:scale(1.1); opacity:1; }
        }
        .mm-loader-label { font-size:0.85rem; color:#8a9cbf; margin:0; }

        /* results */
        .mm-results-area {
            flex: 1; min-height: 0;
            overflow-y: auto; overflow-x: hidden;
            width: 100%; max-width: 560px;
            padding-bottom: 1rem;
            scrollbar-width: thin;
            scrollbar-color: rgba(100,130,200,0.28) transparent;
        }
        .mm-results-area::-webkit-scrollbar { width: 4px; }
        .mm-results-area::-webkit-scrollbar-track { background: transparent; }
        .mm-results-area::-webkit-scrollbar-thumb { background: rgba(100,130,200,0.28); border-radius: 2px; }
        .mm-results-count { font-size:0.82rem; color:#8a9cbf; margin:0 0 0.85rem; text-align:center; }
        .mm-results-num { font-weight:700; color:#4a6080; }
        .mm-result-list { display:flex; flex-direction:column; gap:0.55rem; }

        @keyframes fadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        .mm-result-card {
            display:flex; align-items:center; gap:0.85rem;
            padding:0.75rem 1rem;
            background:rgba(255,255,255,0.88); backdrop-filter:blur(8px);
            border:1.5px solid rgba(100,130,200,0.14); border-radius:14px;
            box-shadow:0 2px 10px rgba(24,40,80,0.06);
            text-decoration:none; transition:border-color 0.14s,transform 0.14s,box-shadow 0.14s;
            animation:fadeUp 0.22s ease both;
        }
        .mm-result-card:hover {
            border-color:rgba(80,120,220,0.32);
            transform:translateY(-2px);
            box-shadow:0 6px 18px rgba(24,40,80,0.11);
        }
        .mm-result-icon {
            width:44px; height:44px; border-radius:11px; flex-shrink:0;
            display:flex; align-items:center; justify-content:center;
            font-size:1.2rem; color:#fff;
            box-shadow:0 3px 8px rgba(0,0,0,0.16),inset 0 1px 0 rgba(255,255,255,0.22);
            position:relative; overflow:hidden;
        }
        .mm-result-icon::before {
            content:""; position:absolute; top:0;left:0;right:0; height:45%;
            background:linear-gradient(180deg,rgba(255,255,255,0.2) 0%,transparent 100%);
            border-radius:11px 11px 40% 40%; pointer-events:none;
        }
        .mm-result-body { flex:1; min-width:0; }
        .mm-result-title { display:block; font-size:0.9rem; font-weight:700; color:#1a2540; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .mm-result-sub { display:block; font-size:0.76rem; color:#8a9bb8; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .mm-result-badge {
            flex-shrink:0; font-size:0.67rem; font-weight:700; letter-spacing:0.06em;
            text-transform:uppercase; padding:0.15rem 0.55rem; border-radius:999px;
        }
        .mm-badge--cliente   { background:rgba(27,138,107,0.12); color:#1b8a6b; }
        .mm-badge--prospecto { background:rgba(46,134,222,0.12); color:#2e86de; }
        .mm-badge--proyecto  { background:rgba(224,123,57,0.12);  color:#c06b28; }
        .mm-badge--proveedor { background:rgba(181,134,13,0.12);  color:#967006; }
        .mm-result-arrow { flex-shrink:0; color:#c0cde0; font-size:0.9rem; transition:color 0.12s; }
        .mm-result-card:hover .mm-result-arrow { color:#5a82e6; }

        /* no results */
        .mm-no-results { display:flex; flex-direction:column; align-items:center; gap:0.4rem; color:#b0bdd4; font-size:0.9rem; padding:1.5rem 0; }
        .mm-no-results i { font-size:2.2rem; }
        .mm-no-hint { font-size:0.78rem; margin:0; opacity:0.8; }

        /* sub topbar */
        .mm-sub-topbar { display:flex; align-items:center; justify-content:space-between; width:100%; max-width:700px; margin-bottom:1.6rem; }
        .mm-logo-sm { height:26px; width:auto; object-fit:contain; opacity:0.7; }
        .mm-back-btn {
            display:inline-flex; align-items:center; gap:0.3rem;
            background:rgba(90,110,160,0.08); border:1px solid rgba(90,110,160,0.15);
            padding:0.38rem 0.85rem; border-radius:8px; font-size:0.84rem; font-weight:600;
            color:#5a6e92; cursor:pointer; transition:background 0.12s,color 0.12s;
        }
        .mm-back-btn:hover { background:rgba(90,110,160,0.16); color:#2e4070; }

        /* breadcrumb */
        .mm-breadcrumb { display:flex; align-items:center; gap:0.9rem; margin-bottom:2rem; }
        .mm-breadcrumb-icon { width:48px; height:48px; border-radius:13px; display:flex; align-items:center; justify-content:center; font-size:1.4rem; color:#fff; flex-shrink:0; box-shadow:0 4px 12px rgba(0,0,0,0.2); }
        .mm-breadcrumb-text { text-align:left; }

        /* grid */
        .mm-grid { display:grid; grid-template-columns:repeat(4,106px); gap:1.75rem 2rem; justify-content:center; }
        .mm-grid--sub { grid-template-columns:repeat(5,96px); gap:1.5rem 1.6rem; }
        .mm-icon-btn { display:flex; flex-direction:column; align-items:center; gap:0.55rem; text-decoration:none; background:none; border:none; padding:0; cursor:pointer; }
        .mm-icon {
            width:80px; height:80px; border-radius:20px; display:flex; align-items:center; justify-content:center;
            font-size:2rem; color:#fff;
            box-shadow:0 4px 14px rgba(0,0,0,0.18),inset 0 1px 0 rgba(255,255,255,0.28);
            transition:transform 0.14s ease,box-shadow 0.14s ease; position:relative; overflow:hidden;
        }
        .mm-icon--sub { width:66px; height:66px; font-size:1.55rem; border-radius:16px; }
        .mm-icon::before {
            content:""; position:absolute; top:0;left:0;right:0; height:46%;
            background:linear-gradient(180deg,rgba(255,255,255,0.22) 0%,transparent 100%);
            border-radius:20px 20px 40% 40%; pointer-events:none;
        }
        .mm-icon-btn:hover .mm-icon,.mm-icon-btn:focus-visible .mm-icon { transform:scale(1.09) translateY(-3px); box-shadow:0 10px 28px rgba(0,0,0,0.22),inset 0 1px 0 rgba(255,255,255,0.28); }
        .mm-icon-btn:active .mm-icon { transform:scale(0.97) translateY(0); }
        .mm-label { font-size:0.82rem; font-weight:700; color:#1c2b45; text-align:center; line-height:1.2; }
        .mm-sublabel { font-size:0.7rem; color:#8a9bb8; text-align:center; line-height:1.1; margin-top:-0.25rem; }

        @media (max-width:575.98px) {
            .mm-grid { grid-template-columns:repeat(3,86px); gap:1.4rem 1.2rem; }
            .mm-grid--sub { grid-template-columns:repeat(3,80px); gap:1.3rem 1rem; }
            .mm-icon { width:68px; height:68px; font-size:1.6rem; border-radius:16px; }
            .mm-icon--sub { width:60px; height:60px; font-size:1.35rem; }
            .mm-title { font-size:1.5rem; } .mm-search-wrap { margin-bottom:1.5rem; }
            .mm-results-area { max-width:100%; }
        }
        @media (min-width:576px) and (max-width:767.98px) {
            .mm-grid { grid-template-columns:repeat(4,86px); gap:1.4rem 1.4rem; }
            .mm-grid--sub { grid-template-columns:repeat(4,82px); gap:1.4rem 1.2rem; }
            .mm-icon { width:72px; height:72px; font-size:1.75rem; }
            .mm-icon--sub { width:62px; height:62px; font-size:1.45rem; }
        }
        @media (min-width:1200px) {
            .mm-grid { grid-template-columns:repeat(4,120px); gap:2.25rem 2.75rem; }
            .mm-grid--sub { grid-template-columns:repeat(5,108px); gap:2rem 2.25rem; }
            .mm-icon { width:92px; height:92px; font-size:2.25rem; border-radius:22px; }
            .mm-icon--sub { width:76px; height:76px; font-size:1.85rem; border-radius:18px; }
            .mm-search-wrap { max-width:580px; } .mm-results-area { max-width:580px; }
        }
    `],
})
export class MainMenuComponent implements OnInit, OnDestroy {
    selected: AppModule | null = null;
    animDir: "fwd" | "bck" = "fwd";
    query = "";
    globalResults: GlobalSearchResult[] = [];
    isSearchLoading = false;

    private readonly searchSubject$ = new Subject<string>();
    private searchSub?: Subscription;
    private routeSub?: Subscription;

    constructor(
        private readonly searchService: GlobalSearchService,
        private readonly cdr: ChangeDetectorRef,
        private readonly router: Router,
        private readonly route: ActivatedRoute,
    ) {}

    ngOnInit(): void {
        this.searchService.syncFrontendData();

        // Si llegamos con un modulo en la URL (ej. /app/main-menu/crm), abrimos esa carpeta.
        this.routeSub = this.route.paramMap.subscribe(params => {
            const key = params.get("moduleId");
            if (!key) return;
            const mod = this.modules.find(m => m.routeKey === key && !!m.children?.length);
            if (mod) {
                this.animDir = "fwd";
                this.selected = mod;
            } else {
                // Modulo desconocido o sin opciones: devolvemos al menu de carpetas.
                void this.router.navigate(["/app", "main-menu"], { replaceUrl: true });
            }
        });

        this.searchSub = this.searchSubject$.pipe(
            debounceTime(350),
            distinctUntilChanged(),
            switchMap(q => {
                if (!q.trim()) return of([] as GlobalSearchResult[]);
                return this.searchService.search(q).pipe(catchError(() => of([])));
            }),
        ).subscribe(results => {
            this.isSearchLoading = false;
            this.globalResults = results;
            this.cdr.detectChanges();
        });
    }

    ngOnDestroy(): void {
        this.searchSub?.unsubscribe();
        this.routeSub?.unsubscribe();
    }

    readonly modules: AppModule[] = [
        { label: "CRM", sublabel: "Comercial", routeKey: "crm", icon: "bi-person-lines-fill", color: "linear-gradient(145deg,#2e86de,#54a0ff)", children: [{ label: "Prospectos", icon: "bi-funnel-fill", route: "/app/crm-prospectos" }, { label: "Cotizaciones", icon: "bi-receipt", route: "/app/crm-cotizaciones" }, { label: "Clientes", icon: "bi-people-fill", route: "/app/crm-clientes" }, ] },
        { label: "Trabajo", sublabel: "Operaciones", routeKey: "trabajo", icon: "bi-briefcase-fill", color: "linear-gradient(145deg,#e07b39,#f9a825)", children: [{ label: "Proyectos", icon: "bi-kanban-fill", route: "/app/work-projects" }, { label: "Tareas", icon: "bi-check2-square", route: "/app/work-tasks" }, { label: "Hoja de tiempo", icon: "bi-clock-history", route: "/app/work-timesheet" }, { label: "Carga laboral", icon: "bi-bar-chart-line-fill", route: "/app/work-workload" }, { label: "Recep. equipos", icon: "bi-box-arrow-in-down", route: "/app/work-equipment-reception" }, { label: "Garantias", icon: "bi-shield-check", route: "/app/work-garantias" }, { label: "Lote pruebas", icon: "bi-ui-checks-grid", route: "/app/work-test-batches" }, { label: "Remisiones", icon: "bi-truck", route: "/app/remissions" }] },
        { label: "Inventario", sublabel: "Stock", routeKey: "inventario", icon: "bi-boxes", color: "linear-gradient(145deg,#1b8a6b,#26de8e)", children: [{ label: "Panel control", icon: "bi-speedometer2", route: "/app/inventory-dashboard" }, { label: "Stock y fichas", icon: "bi-box-seam-fill", route: "/app/inventory-stock" }, { label: "Movimientos", icon: "bi-arrow-left-right", route: "/app/inventory-movements" }, { label: "Reposicion", icon: "bi-exclamation-diamond-fill", route: "/app/inventory-orders" }, { label: "Conciliacion", icon: "bi-clipboard-data-fill", route: "/app/inventory-order-details" }, { label: "Reservas", icon: "bi-hourglass-split", route: "/app/inventory-reservations" }] },
        { label: "Financiero", sublabel: "Facturacion", routeKey: "financiero", icon: "bi-bank2", color: "linear-gradient(145deg,#c0392b,#e84393)", children: [{ label: "Dashboard", icon: "bi-speedometer2", route: "/app/finance-dashboard" }, { label: "Cuentas", icon: "bi-building", route: "/app/finance-cuentas" }, { label: "Pagos", icon: "bi-credit-card-2-front", route: "/app/finance-pagos" }, { label: "Facturas", icon: "bi-file-earmark-text-fill", route: "/app/finance-facturacion" }, { label: "Recurrentes", icon: "bi-arrow-repeat", route: "/app/finance-facturacion-recurrentes" }, { label: "Cred. clientes", icon: "bi-cash-coin", route: "/app/finance-clientes-credito" }, { label: "Garantias", icon: "bi-shield-check", route: "/app/finance-garantias" }] },
        { label: "RRHH", sublabel: "Empleados", routeKey: "rrhh", icon: "bi-people-fill", color: "linear-gradient(145deg,#6c3fcc,#a55eea)", children: [{ label: "Dashboard", icon: "bi-speedometer2", route: "/app/company-hr-dashboard" }, { label: "Empleados", icon: "bi-person-vcard-fill", route: "/app/company-hr-employees" }, { label: "Carga laboral", icon: "bi-bar-chart-line-fill", route: "/app/work-workload" }, { label: "Nomina", icon: "bi-cash-stack", route: "/app/company-hr-compensation" }, { label: "Horarios", icon: "bi-calendar3", route: "/app/company-hr-worktime" }, { label: "Salud", icon: "bi-heart-pulse-fill", route: "/app/company-hr-health" }, { label: "Vacaciones", icon: "bi-calendar2-week-fill", route: "/app/company-hr-leaves" }, { label: "Documentos", icon: "bi-folder-check", route: "/app/company-hr-documents" }, { label: "Auditoria", icon: "bi-clipboard-data-fill", route: "/app/company-hr-audit" }] },
        { label: "Proveedores", sublabel: "Red de compra", routeKey: "proveedores", icon: "bi-truck-front-fill", color: "linear-gradient(145deg,#b5860d,#f0d060)", children: [{ label: "Dashboard", icon: "bi-speedometer2", route: "/app/suppliers-dashboard" }, { label: "CRUD", icon: "bi-table", route: "/app/suppliers-crud" }, { label: "Historial", icon: "bi-clock-history", route: "/app/suppliers-orders-history" }] },
        { label: "Configuración", sublabel: "Configuracion interna", routeKey: "compania", icon: "bi-buildings", color: "linear-gradient(145deg,#4a5568,#9aa5b5)", children: [{ label: "Company Profile", icon: "bi-building", route: "/app/company-profile" }, { label: "User Roles", icon: "bi-people", route: "/app/company-user-roles" }, { label: "Config. Comercial", icon: "bi-sliders", route: "/app/company-commercial-config" }, { label: "Config. Seguimientos", icon: "bi-arrow-repeat", route: "/app/company-followups-config" }, { label: "Config. Proyectos", icon: "bi-kanban", route: "/app/company-projects-config" }, { label: "Config. Equipos", icon: "bi-cpu", route: "/app/company-equipment-config" }] },
        { label: "Seguridad avanzada", sublabel: "Proteccion", icon: "bi-shield-exclamation", color: "linear-gradient(145deg,#b7791f,#ecc94b)", route: "/app/advanced-security-ip-restrictions" },
        { label: "Paginas de soporte", sublabel: "Paginas utilitarias", routeKey: "supportive-pages", icon: "bi-life-preserver", color: "linear-gradient(145deg,#b83280,#f687b3)", children: [{ label: "Sign up", icon: "bi-person-plus-fill", route: "/auth/signup" }, { label: "Forgot Password", icon: "bi-key-fill", route: "/auth/forgot-password" }, { label: "Change Password", icon: "bi-shield-lock", route: "/auth/change-password" }, { label: "Maintenance", icon: "bi-tools", route: "/under-construction" }, { label: "Coming soon", icon: "bi-alarm", route: "/coming-soon" }, { label: "Error", icon: "bi-exclamation-octagon-fill", route: "/coming-soon" }, { label: "Onboarding", icon: "bi-person-check", route: "/auth/onboarding" }, { label: "Contact", icon: "bi-chat-dots-fill", route: "/app/contact-us" }, { label: "Timeline", icon: "bi-diagram-3", route: "/app/timeline" }] },
        { label: "Aplicaciones", sublabel: "Sistema", routeKey: "aplicaciones", icon: "bi-grid-fill", color: "linear-gradient(145deg,#3730a3,#818cf8)", children: [{ label: "Email", icon: "bi-envelope-fill", route: "/app/inbox" }, { label: "Explorer", icon: "bi-folder2-open", route: "/app/explorer" }, { label: "Calendar", icon: "bi-calendar3", route: "/app/calendar" }] },
        { label: "Perfil profesional", sublabel: "Tu perfil", icon: "bi-person-workspace", color: "linear-gradient(145deg,#0f766e,#2dd4bf)", route: "/app/profile-professional" },
    ];

    open(m: AppModule): void {
        // Cada carpeta vive en su propia URL (ej. /app/main-menu/crm) para que el
        // historial del navegador y el boton atras funcionen de forma nativa.
        if (m.routeKey) { void this.router.navigate(["/app", "main-menu", m.routeKey]); return; }
        this.animDir = "fwd"; this.selected = m;
    }
    back(): void {
        if (this.selected?.routeKey || typeof window !== "undefined" && window.history.length > 1) {
            this.router.navigate(["/app", "main-menu"]);
            return;
        }
        this.animDir = "bck"; this.selected = null;
    }

    onSearch(event: Event): void {
        this.query = (event.target as HTMLInputElement).value;
        if (!this.query.trim()) { this.globalResults = []; this.isSearchLoading = false; }
        else { this.isSearchLoading = true; }
        this.searchSubject$.next(this.query);
    }

    clearSearch(): void {
        this.query = ""; this.globalResults = []; this.isSearchLoading = false;
        this.searchSubject$.next("");
    }
}
