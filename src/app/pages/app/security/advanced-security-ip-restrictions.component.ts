import { CommonModule } from "@angular/common";
import { Component, OnInit } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { RouterLink } from "@angular/router";
import { AdvancedSecurityApiService, ReplaceSecurityRulesRequest, SecurityRulesResponse } from "../../../services/advanced-security-api.service";

interface GlobalAccessRule {
    id: number;
    username: string;
    role: string;
    reason: string;
    active: boolean;
    createdAt: string;
}

interface RestrictedAccessRule {
    id: number;
    username: string;
    role: string;
    office: string;
    allowedIps: string[];
    allowedMacs: string[];
    active: boolean;
    createdAt: string;
}

interface GlobalRuleDraft {
    username: string;
    role: string;
    reason: string;
}

interface RestrictedRuleDraft {
    username: string;
    role: string;
    office: string;
    ipInput: string;
    macInput: string;
}

interface AccessSimulationDraft {
    username: string;
    ip: string;
    mac: string;
}

@Component({
    selector: "app-advanced-security-ip-restrictions",
    standalone: true,
    imports: [CommonModule, FormsModule, RouterLink],
    template: `
        <div class="container-fluid py-3">
            <div class="row gx-3 gx-lg-4 align-items-center page-title">
                <div class="col col-sm mb-3 mb-sm-0">
                    <h5 class="mb-0">Restriccion por IP</h5>
                    <p class="text-secondary small mb-0">Configura que usuarios pueden ingresar solo desde IPs corporativas y quienes pueden ingresar desde cualquier ubicacion.</p>
                </div>
                <div class="col-12 col-sm-auto text-sm-end d-flex flex-wrap justify-content-sm-end gap-2">
                    <span class="badge rounded-pill text-bg-success">Accesos globales</span>
                    <span class="badge rounded-pill text-bg-primary">Accesos restringidos</span>
                </div>
            </div>

            <nav aria-label="breadcrumb" class="breadcrumb-theme mt-3 rounded">
                <ol class="breadcrumb mb-0">
                    <li class="breadcrumb-item bi"><a routerLink="/app/dashboard"><i class="bi bi-house-door me-2"></i>AdminUX</a></li>
                    <li class="breadcrumb-item bi">Seguridad avanzada</li>
                    <li class="breadcrumb-item bi active" aria-current="page">Restriccion por IP</li>
                </ol>
            </nav>
        </div>

        <div class="container mt-3" id="main-content">
            <div class="alert alert-danger border mb-3 feedback-alert">{{ errorMessage }}</div>

            <div class="card adminuiux-card mb-3 mb-lg-4">
                <div class="card-header d-flex flex-wrap justify-content-between align-items-start gap-2">
                    <div>
                        <h6 class="mb-0">Acceso libre desde cualquier ubicacion</h6>
                        <p class="text-secondary small mb-0">Usuarios como superadmin o perfiles excepcion pueden iniciar sesion desde cualquier IP/MAC.</p>
                    </div>
                </div>
                <div class="card-body border-bottom">
                    <form class="row gx-3 gy-3" (ngSubmit)="addGlobalRule()">
                        <div class="col-12 col-md-4">
                            <label class="form-label">Usuario</label>
                            <input class="form-control" type="text" name="globalUsername" [(ngModel)]="globalDraft.username" placeholder="Ej: superadmin" />
                        </div>
                        <div class="col-12 col-md-3">
                            <label class="form-label">Rol</label>
                            <select class="form-select" name="globalRole" [(ngModel)]="globalDraft.role">
                                @for (role of roles; track role) {
                                    <option [value]="role">{{ role }}</option>
                                }
                            </select>
                        </div>
                        <div class="col-12 col-md-5">
                            <label class="form-label">Motivo</label>
                            <input class="form-control" type="text" name="globalReason" [(ngModel)]="globalDraft.reason" placeholder="Ej: soporte fuera de oficina" />
                        </div>
                        <div class="col-12">
                            <button class="btn btn-theme" type="submit">
                                <i class="bi bi-plus-lg me-2"></i>Agregar acceso libre
                            </button>
                        </div>
                    </form>
                </div>
                <div class="card-body p-0">
                    <div class="table-responsive">
                        <table class="table align-middle mb-0">
                            <thead>
                                <tr>
                                    <th>Usuario</th>
                                    <th>Rol</th>
                                    <th>Motivo</th>
                                    <th>Estado</th>
                                    <th>Creado</th>
                                    <th class="text-end">Accion</th>
                                </tr>
                            </thead>
                            <tbody>
                                @for (rule of globalRules; track rule.id) {
                                    <tr>
                                        <td class="fw-semibold">{{ rule.username }}</td>
                                        <td>{{ rule.role }}</td>
                                        <td>{{ rule.reason }}</td>
                                        <td>
                                            <span class="badge rounded-pill" [class.text-bg-success]="rule.active" [class.text-bg-secondary]="!rule.active">
                                                {{ rule.active ? "Activa" : "Inactiva" }}
                                            </span>
                                        </td>
                                        <td>{{ rule.createdAt }}</td>
                                        <td class="text-end">
                                            <div class="d-flex justify-content-end gap-1">
                                                <button class="btn btn-sm btn-outline-secondary" type="button" (click)="toggleGlobalRule(rule.id)">
                                                    {{ rule.active ? "Desactivar" : "Activar" }}
                                                </button>
                                                <button class="btn btn-sm btn-outline-danger" type="button" (click)="removeGlobalRule(rule.id)">Borrar</button>
                                            </div>
                                        </td>
                                    </tr>
                                } @empty {
                                    <tr>
                                        <td colspan="6" class="text-center py-4 text-secondary">No hay usuarios con acceso global.</td>
                                    </tr>
                                }
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <div class="card adminuiux-card mb-3 mb-lg-4">
                <div class="card-header">
                    <h6 class="mb-0">Acceso restringido por IP o MAC</h6>
                    <p class="text-secondary small mb-0">Usuarios que solo deben entrar desde red de oficina o desde dispositivos permitidos.</p>
                </div>
                <div class="card-body border-bottom">
                    <form class="row gx-3 gy-3" (ngSubmit)="addRestrictedRule()">
                        <div class="col-12 col-md-4">
                            <label class="form-label">Usuario</label>
                            <input class="form-control" type="text" name="restrictedUsername" [(ngModel)]="restrictedDraft.username" placeholder="Ej: tecnico.oficina" />
                        </div>
                        <div class="col-12 col-md-2">
                            <label class="form-label">Rol</label>
                            <select class="form-select" name="restrictedRole" [(ngModel)]="restrictedDraft.role">
                                @for (role of roles; track role) {
                                    <option [value]="role">{{ role }}</option>
                                }
                            </select>
                        </div>
                        <div class="col-12 col-md-6">
                            <label class="form-label">Sede</label>
                            <input class="form-control" type="text" name="restrictedOffice" [(ngModel)]="restrictedDraft.office" placeholder="Ej: Oficina Medellin" />
                        </div>

                        <div class="col-12 col-lg-6">
                            <label class="form-label">IPs permitidas</label>
                            <textarea
                                class="form-control"
                                rows="2"
                                name="restrictedIps"
                                [(ngModel)]="restrictedDraft.ipInput"
                                placeholder="Ej: 192.168.1.10, 192.168.1.0/24"
                            ></textarea>
                        </div>
                        <div class="col-12 col-lg-6">
                            <label class="form-label">MACs permitidas</label>
                            <textarea
                                class="form-control"
                                rows="2"
                                name="restrictedMacs"
                                [(ngModel)]="restrictedDraft.macInput"
                                placeholder="Ej: AA:BB:CC:DD:EE:01, 11-22-33-44-55-66"
                            ></textarea>
                        </div>

                        <div class="col-12 d-flex flex-wrap gap-2 align-items-center">
                            <button class="btn btn-theme" type="submit">
                                <i class="bi bi-plus-lg me-2"></i>Agregar restriccion
                            </button>
                            <span class="small text-secondary">Puedes separar valores por coma o por salto de linea.</span>
                        </div>
                    </form>
                </div>
                <div class="card-body p-0">
                    <div class="table-responsive">
                        <table class="table align-middle mb-0">
                            <thead>
                                <tr>
                                    <th>Usuario</th>
                                    <th>Rol</th>
                                    <th>IPs permitidas</th>
                                    <th>MACs permitidas</th>
                                    <th>Sede</th>
                                    <th>Estado</th>
                                    <th class="text-end">Accion</th>
                                </tr>
                            </thead>
                            <tbody>
                                @for (rule of restrictedRules; track rule.id) {
                                    <tr>
                                        <td class="fw-semibold">{{ rule.username }}</td>
                                        <td>{{ rule.role }}</td>
                                        <td>
                                            <div class="d-flex flex-wrap gap-1">
                                                @for (ip of rule.allowedIps; track ip) {
                                                    <span class="badge text-bg-light border">{{ ip }}</span>
                                                } @empty {
                                                    <span class="small text-secondary">Sin IPs</span>
                                                }
                                            </div>
                                        </td>
                                        <td>
                                            <div class="d-flex flex-wrap gap-1">
                                                @for (mac of rule.allowedMacs; track mac) {
                                                    <span class="badge text-bg-light border">{{ mac }}</span>
                                                } @empty {
                                                    <span class="small text-secondary">Sin MACs</span>
                                                }
                                            </div>
                                        </td>
                                        <td>{{ rule.office }}</td>
                                        <td>
                                            <span class="badge rounded-pill" [class.text-bg-success]="rule.active" [class.text-bg-secondary]="!rule.active">
                                                {{ rule.active ? "Activa" : "Inactiva" }}
                                            </span>
                                        </td>
                                        <td class="text-end">
                                            <div class="d-flex justify-content-end gap-1">
                                                <button class="btn btn-sm btn-outline-secondary" type="button" (click)="toggleRestrictedRule(rule.id)">
                                                    {{ rule.active ? "Desactivar" : "Activar" }}
                                                </button>
                                                <button class="btn btn-sm btn-outline-danger" type="button" (click)="removeRestrictedRule(rule.id)">Borrar</button>
                                            </div>
                                        </td>
                                    </tr>
                                } @empty {
                                    <tr>
                                        <td colspan="7" class="text-center py-4 text-secondary">No hay reglas de restriccion configuradas.</td>
                                    </tr>
                                }
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <div class="card adminuiux-card mb-3 mb-lg-4 border-warning">
                <div class="card-header">
                    <h6 class="mb-0">Simulador de acceso</h6>
                    <p class="text-secondary small mb-0">Permite probar rapidamente si un usuario seria aprobado o rechazado segun las reglas actuales.</p>
                </div>
                <div class="card-body">
                    <form class="row gx-3 gy-3" (ngSubmit)="simulateAccess()">
                        <div class="col-12 col-md-4">
                            <label class="form-label">Usuario</label>
                            <input class="form-control" type="text" name="simulateUsername" [(ngModel)]="simulationDraft.username" placeholder="Ej: tecnico.oficina" />
                        </div>
                        <div class="col-12 col-md-4">
                            <label class="form-label">IP origen</label>
                            <input class="form-control" type="text" name="simulateIp" [(ngModel)]="simulationDraft.ip" placeholder="Ej: 192.168.1.45" />
                        </div>
                        <div class="col-12 col-md-4">
                            <label class="form-label">MAC origen</label>
                            <input class="form-control" type="text" name="simulateMac" [(ngModel)]="simulationDraft.mac" placeholder="Ej: AA:BB:CC:DD:EE:01" />
                        </div>
                        <div class="col-12">
                            <button class="btn btn-outline-theme" type="submit">
                                <i class="bi bi-shield-check me-2"></i>Evaluar acceso
                            </button>
                        </div>
                    </form>

                    @if (simulationMessage) {
                        <div
                            class="alert mt-3 mb-0"
                            [ngClass]="{
                                'alert-success': simulationTone === 'success',
                                'alert-danger': simulationTone === 'danger',
                                'alert-warning': simulationTone === 'warning'
                            }"
                        >
                            {{ simulationMessage }}
                        </div>
                    }
                </div>
            </div>

            <div class="card adminuiux-card mb-3 mb-lg-4">
                <div class="card-body d-flex align-items-start gap-3">
                    <i class="bi bi-info-circle fs-4 text-theme-1"></i>
                    <div>
                        <h6 class="mb-1">Nota de mockup</h6>
                        <p class="text-secondary mb-0">Este flujo ya opera contra backend: las reglas se validan y persisten en base de datos para enforcement real al iniciar sesion.</p>
                    </div>
                </div>
            </div>
        </div>
    `,
    styles: [
        `
            .table td,
            .table th {
                vertical-align: middle;
            }

            .feedback-alert:empty {
                display: none;
            }
        `,
    ],
})
export class AdvancedSecurityIpRestrictionsComponent implements OnInit {
    readonly roles = ["superadmin", "admin", "lider", "analista", "tecnico", "invitado"];

    globalRules: GlobalAccessRule[] = [];
    restrictedRules: RestrictedAccessRule[] = [];

    globalDraft: GlobalRuleDraft = {
        username: "",
        role: "superadmin",
        reason: "",
    };

    restrictedDraft: RestrictedRuleDraft = {
        username: "",
        role: "tecnico",
        office: "Oficina principal",
        ipInput: "",
        macInput: "",
    };

    simulationDraft: AccessSimulationDraft = {
        username: "",
        ip: "",
        mac: "",
    };

    errorMessage = "";
    isSaving = false;

    simulationMessage = "";
    simulationTone: "success" | "danger" | "warning" = "warning";

    constructor(private readonly advancedSecurityApi: AdvancedSecurityApiService) {}

    ngOnInit(): void {
        this.loadRulesFromApi();
    }

    addGlobalRule(): void {
        if (this.isSaving) {
            return;
        }

        this.clearMessages();

        const username = this.normalizeUsername(this.globalDraft.username);
        const role = this.normalizeRole(this.globalDraft.role, "superadmin");
        const reason = this.globalDraft.reason.trim();

        if (!username) {
            this.errorMessage = "Debes escribir un usuario para acceso libre.";
            return;
        }

        if (!reason) {
            this.errorMessage = "Debes registrar un motivo para la excepcion global.";
            return;
        }

        if (this.globalRules.some((rule) => rule.username === username)) {
            this.errorMessage = "Ese usuario ya existe en acceso libre.";
            return;
        }

        const nextGlobalRules: GlobalAccessRule[] = [
            {
            id: this.nextId(this.globalRules),
            username,
            role,
            reason,
            active: true,
            createdAt: this.nowLabel(),
            },
            ...this.globalRules,
        ];

        this.saveRulesSnapshot(nextGlobalRules, this.restrictedRules);
    }

    addRestrictedRule(): void {
        if (this.isSaving) {
            return;
        }

        this.clearMessages();

        const username = this.normalizeUsername(this.restrictedDraft.username);
        const role = this.normalizeRole(this.restrictedDraft.role, "tecnico");
        const office = this.restrictedDraft.office.trim() || "Oficina principal";
        const ipTokens = this.parseTokens(this.restrictedDraft.ipInput);
        const macTokens = this.parseTokens(this.restrictedDraft.macInput);

        if (!username) {
            this.errorMessage = "Debes escribir un usuario para acceso restringido.";
            return;
        }

        if (this.restrictedRules.some((rule) => rule.username === username)) {
            this.errorMessage = "Ese usuario ya existe en reglas restringidas.";
            return;
        }

        if (ipTokens.length === 0 && macTokens.length === 0) {
            this.errorMessage = "Agrega al menos una IP o una MAC permitida.";
            return;
        }

        const invalidIps = ipTokens.filter((token) => !this.isValidIpToken(token));
        if (invalidIps.length > 0) {
            this.errorMessage = "IPs invalidas: " + invalidIps.join(", ");
            return;
        }

        const normalizedMacs = macTokens.map((token) => ({
            original: token,
            normalized: this.normalizeMacInput(token),
        }));

        const invalidMacs = normalizedMacs.filter((item) => !this.isValidMac(item.normalized)).map((item) => item.original);
        if (invalidMacs.length > 0) {
            this.errorMessage = "MACs invalidas: " + invalidMacs.join(", ");
            return;
        }

        const allowedMacs = Array.from(new Set(normalizedMacs.map((item) => item.normalized)));

        const nextRestrictedRules: RestrictedAccessRule[] = [
            {
            id: this.nextId(this.restrictedRules),
            username,
            role,
            office,
            allowedIps: Array.from(new Set(ipTokens)),
            allowedMacs,
            active: true,
            createdAt: this.nowLabel(),
            },
            ...this.restrictedRules,
        ];

        this.saveRulesSnapshot(this.globalRules, nextRestrictedRules);
    }

    toggleGlobalRule(ruleID: number): void {
        if (this.isSaving) {
            return;
        }

        const exists = this.globalRules.some((entry) => entry.id === ruleID);
        if (!exists) {
            return;
        }

        const nextGlobalRules = this.globalRules.map((entry) => (entry.id === ruleID ? { ...entry, active: !entry.active } : entry));
        this.saveRulesSnapshot(nextGlobalRules, this.restrictedRules);
    }

    toggleRestrictedRule(ruleID: number): void {
        if (this.isSaving) {
            return;
        }

        const exists = this.restrictedRules.some((entry) => entry.id === ruleID);
        if (!exists) {
            return;
        }

        const nextRestrictedRules = this.restrictedRules.map((entry) => (entry.id === ruleID ? { ...entry, active: !entry.active } : entry));
        this.saveRulesSnapshot(this.globalRules, nextRestrictedRules);
    }

    removeGlobalRule(ruleID: number): void {
        if (this.isSaving) {
            return;
        }

        const nextGlobalRules = this.globalRules.filter((entry) => entry.id !== ruleID);
        this.saveRulesSnapshot(nextGlobalRules, this.restrictedRules);
    }

    removeRestrictedRule(ruleID: number): void {
        if (this.isSaving) {
            return;
        }

        const nextRestrictedRules = this.restrictedRules.filter((entry) => entry.id !== ruleID);
        this.saveRulesSnapshot(this.globalRules, nextRestrictedRules);
    }

    simulateAccess(): void {
        const username = this.normalizeUsername(this.simulationDraft.username);
        const ip = this.simulationDraft.ip.trim();
        const macRaw = this.simulationDraft.mac.trim();
        const mac = this.normalizeMacInput(macRaw);

        if (!username) {
            this.setSimulationResult("warning", "Debes escribir el usuario para evaluar el acceso.");
            return;
        }

        if (!ip && !macRaw) {
            this.setSimulationResult("warning", "Debes enviar al menos IP o MAC para la simulacion.");
            return;
        }

        if (ip && !this.isValidIpv4(ip)) {
            this.setSimulationResult("warning", "La IP de simulacion no es valida.");
            return;
        }

        if (macRaw && !this.isValidMac(mac)) {
            this.setSimulationResult("warning", "La MAC de simulacion no es valida.");
            return;
        }

        const globalRule = this.globalRules.find((rule) => rule.active && rule.username === username);
        if (globalRule) {
            this.setSimulationResult("success", "Acceso permitido: usuario con regla global activa.");
            return;
        }

        const restrictedRule = this.restrictedRules.find((rule) => rule.active && rule.username === username);
        if (!restrictedRule) {
            this.setSimulationResult("danger", "Acceso denegado: no existe regla activa para este usuario.");
            return;
        }

        const ipAllowed = ip ? this.isIpAllowed(ip, restrictedRule.allowedIps) : false;
        const macAllowed = mac ? restrictedRule.allowedMacs.includes(mac) : false;

        if (ipAllowed || macAllowed) {
            this.setSimulationResult("success", "Acceso permitido: coincide con IP o MAC autorizada para este usuario.");
            return;
        }

        this.setSimulationResult("danger", "Acceso denegado: IP/MAC no autorizada para la regla activa del usuario.");
    }

    private parseTokens(value: string): string[] {
        const unique = new Set<string>();

        value
            .split(/[\n,;]+/)
            .map((token) => token.trim())
            .filter((token) => token.length > 0)
            .forEach((token) => unique.add(token));

        return Array.from(unique);
    }

    private isValidIpToken(token: string): boolean {
        if (!token.includes("/")) {
            return this.isValidIpv4(token);
        }

        const [network, prefixText] = token.split("/");
        if (!this.isValidIpv4(network)) {
            return false;
        }

        const prefix = Number(prefixText);
        return Number.isInteger(prefix) && prefix >= 0 && prefix <= 32;
    }

    private isValidIpv4(ip: string): boolean {
        const parts = ip.split(".");
        if (parts.length !== 4) {
            return false;
        }

        return parts.every((part) => {
            if (!/^\d{1,3}$/.test(part)) {
                return false;
            }

            if (part.length > 1 && part.startsWith("0")) {
                return false;
            }

            const value = Number(part);
            return value >= 0 && value <= 255;
        });
    }

    private isIpAllowed(inputIp: string, allowedIps: string[]): boolean {
        const inputNumeric = this.ipv4ToNumber(inputIp);
        if (inputNumeric === null) {
            return false;
        }

        for (const token of allowedIps) {
            if (!token.includes("/")) {
                if (token === inputIp) {
                    return true;
                }
                continue;
            }

            const [network, prefixText] = token.split("/");
            const networkNumeric = this.ipv4ToNumber(network);
            const prefix = Number(prefixText);

            if (networkNumeric === null || !Number.isInteger(prefix) || prefix < 0 || prefix > 32) {
                continue;
            }

            const mask = prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0;
            if (((inputNumeric & mask) >>> 0) === ((networkNumeric & mask) >>> 0)) {
                return true;
            }
        }

        return false;
    }

    private ipv4ToNumber(ip: string): number | null {
        if (!this.isValidIpv4(ip)) {
            return null;
        }

        const [a, b, c, d] = ip.split(".").map((part) => Number(part));
        return (((a << 24) >>> 0) + ((b << 16) >>> 0) + ((c << 8) >>> 0) + d) >>> 0;
    }

    private normalizeMacInput(value: string): string {
        const hex = value.toUpperCase().replace(/[^0-9A-F]/g, "");

        if (hex.length !== 12) {
            return "";
        }

        const pairs = hex.match(/.{1,2}/g);
        return pairs ? pairs.join(":") : "";
    }

    private isValidMac(value: string): boolean {
        return /^([0-9A-F]{2}:){5}[0-9A-F]{2}$/.test(value);
    }

    private setSimulationResult(tone: "success" | "danger" | "warning", message: string): void {
        this.simulationTone = tone;
        this.simulationMessage = message;
    }

    private normalizeUsername(value: string): string {
        return value.trim().toLowerCase();
    }

    private nextId(collection: Array<{ id: number }>): number {
        if (collection.length === 0) {
            return 1;
        }

        return Math.max(...collection.map((entry) => entry.id)) + 1;
    }

    private nowLabel(): string {
        return new Date().toLocaleString("es-CO");
    }

    private clearMessages(): void {
        this.errorMessage = "";
    }

    private loadRulesFromApi(): void {
        this.clearMessages();
        this.advancedSecurityApi.getRules().subscribe({
            next: (rules) => {
                this.applyRulesResponse(rules);
            },
            error: (error: unknown) => {
                this.errorMessage = this.resolveErrorMessage(error, "No se pudieron cargar las reglas desde backend.");
            },
        });
    }

    private saveRulesSnapshot(
        globalRules: GlobalAccessRule[] = this.globalRules,
        restrictedRules: RestrictedAccessRule[] = this.restrictedRules,
    ): void {
        const payload = this.buildReplaceRequest(globalRules, restrictedRules);
        this.isSaving = true;
        this.errorMessage = "";

        this.advancedSecurityApi.replaceRules(payload).subscribe({
            next: (rules) => {
                this.applyRulesResponse(rules);
                this.isSaving = false;
            },
            error: (error: unknown) => {
                this.errorMessage = this.resolveErrorMessage(error, "No se pudieron guardar las reglas en backend.");
                this.isSaving = false;
            },
        });
    }

    private buildReplaceRequest(globalRules: GlobalAccessRule[], restrictedRules: RestrictedAccessRule[]): ReplaceSecurityRulesRequest {
        return {
            globalAccess: globalRules.map((rule) => ({
                subjectType: "user",
                subjectValue: this.normalizeUsername(rule.username),
                role: this.normalizeRole(rule.role, "superadmin"),
                reason: rule.reason.trim(),
                isActive: rule.active,
            })),
            restrictedAccess: restrictedRules.map((rule) => ({
                subjectType: "user",
                subjectValue: this.normalizeUsername(rule.username),
                role: this.normalizeRole(rule.role, "tecnico"),
                office: rule.office.trim() || "Oficina principal",
                allowedIPs: [...rule.allowedIps],
                allowedMACs: [...rule.allowedMacs],
                isActive: rule.active,
            })),
        };
    }

    private applyRulesResponse(rules: SecurityRulesResponse): void {
        this.globalRules = (rules.globalAccess ?? []).map((rule, index) => ({
            id: Number(rule.id ?? index + 1),
            username: this.normalizeUsername(rule.subjectValue),
            role: this.normalizeRole(rule.role, "superadmin"),
            reason: String(rule.reason ?? "").trim(),
            active: Boolean(rule.isActive),
            createdAt: this.toDateLabel(rule.createdAt),
        }));

        this.restrictedRules = (rules.restrictedAccess ?? []).map((rule, index) => ({
            id: Number(rule.id ?? index + 1),
            username: this.normalizeUsername(rule.subjectValue),
            role: this.normalizeRole(rule.role, "tecnico"),
            office: String(rule.office ?? "Oficina principal").trim() || "Oficina principal",
            allowedIps: Array.isArray(rule.allowedIPs) ? rule.allowedIPs.map((value) => String(value)) : [],
            allowedMacs: Array.isArray(rule.allowedMACs) ? rule.allowedMACs.map((value) => String(value)) : [],
            active: Boolean(rule.isActive),
            createdAt: this.toDateLabel(rule.createdAt),
        }));

    }

    private toDateLabel(value: string): string {
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) {
            return this.nowLabel();
        }
        return date.toLocaleString("es-CO");
    }

    private normalizeRole(rawRole: string, fallback: string): string {
        const role = String(rawRole ?? "").trim().toLowerCase();
        if (this.roles.includes(role)) {
            return role;
        }
        return fallback;
    }

    private resolveErrorMessage(error: unknown, fallback: string): string {
        if (error instanceof Error && error.message.trim()) {
            return error.message;
        }
        return fallback;
    }
}
