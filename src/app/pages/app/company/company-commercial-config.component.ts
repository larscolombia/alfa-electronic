import { CommonModule } from "@angular/common";
import { Component } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { RouterLink } from "@angular/router";
import {
    CommercialDocumentPrefixEntry,
    CommercialDocumentType,
    getCommercialDocumentPrefixEntries,
    resetCommercialDocumentPrefixes,
    sanitizeCommercialPrefix,
    saveCommercialDocumentPrefixes,
} from "./company-commercial-settings.store";
import { getCrmClients, reassignCrmClientsZone, saveCrmClients } from "../crm/crm-clients.store";
import { CrmZoneRecord, getCrmZones, saveCrmZones } from "../crm/crm-zones.store";

type CommissionChannel = "Directo" | "Referido" | "Distribuidor" | "Renovacion";

interface CommissionRule {
    id: number;
    channel: CommissionChannel;
    line: string;
    minAmount: number;
    maxAmount: number | null;
    baseRate: number;
    bonusFrom: number;
    bonusRate: number;
    active: boolean;
    updatedAt: string;
}

interface CommissionRuleDraft {
    channel: CommissionChannel;
    line: string;
    minAmount: number | null;
    maxAmount: number | null;
    baseRate: number | null;
    bonusFrom: number | null;
    bonusRate: number | null;
    active: boolean;
}

interface ZoneDraft {
    name: string;
}

const COMMISSIONS_STORAGE_KEY = "adminux.company.commercial.commissions.v1";

@Component({
    selector: "app-company-commercial-config",
    standalone: true,
    imports: [CommonModule, FormsModule, RouterLink],
    template: `
        <div class="container-fluid py-3">
            <div class="row gx-3 gx-lg-4 align-items-center page-title">
                <div class="col col-sm mb-3 mb-sm-0">
                    <h5 class="mb-0">Config. Comercial</h5>
                    <p class="text-secondary small mb-0">Define reglas de comisiones comerciales por canal, linea y rango de venta.</p>
                </div>
                <div class="col-12 col-sm-auto text-sm-end">
                    @if (viewMode === "list") {
                        <button class="btn btn-theme" type="button" (click)="openCreateForm()"><i class="bi bi-plus-lg me-2"></i>Nueva regla</button>
                    } @else {
                        <button class="btn btn-outline-secondary" type="button" (click)="goToList()">Ver reglas</button>
                    }
                </div>
            </div>

            <nav aria-label="breadcrumb" class="breadcrumb-theme mt-3 rounded">
                <ol class="breadcrumb mb-0">
                    <li class="breadcrumb-item bi"><a routerLink="/app/dashboard"><i class="bi bi-house-door me-2"></i>AdminUX</a></li>
                    <li class="breadcrumb-item bi">Company</li>
                    <li class="breadcrumb-item bi active" aria-current="page">Config. Comercial</li>
                </ol>
            </nav>
        </div>

        <div class="container mt-3" id="main-content">
            @if (successMessage) {
                <div class="alert alert-success border mb-3">{{ successMessage }}</div>
            }
            @if (formError) {
                <div class="alert alert-danger border mb-3">{{ formError }}</div>
            }

            @if (viewMode === "list") {
                <div class="card adminuiux-card mb-3 mb-lg-4">
                    <div class="card-header border-bottom d-flex flex-wrap gap-2 justify-content-between align-items-start">
                        <div>
                            <h6 class="mb-1">Prefijos documentales</h6>
                            <p class="small text-secondary mb-0">Centraliza consecutivos para los documentos comerciales activos en el sistema.</p>
                        </div>
                        <div class="d-flex gap-2">
                            <button class="btn btn-sm btn-outline-secondary" type="button" (click)="resetDocumentPrefixes()">Restablecer</button>
                            <button class="btn btn-sm btn-theme" type="button" (click)="saveDocumentPrefixes()">Guardar prefijos</button>
                        </div>
                    </div>
                    <div class="card-body">
                        @if (prefixFormError) {
                            <div class="alert alert-danger border mb-3">{{ prefixFormError }}</div>
                        }

                        <div class="table-responsive">
                            <table class="table align-middle mb-0">
                                <thead>
                                    <tr>
                                        <th>Documento</th>
                                        <th>Prefijo</th>
                                        <th>Vista previa</th>
                                        <th>Uso</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    @for (prefixEntry of documentPrefixDrafts; track prefixEntry.type) {
                                        <tr>
                                            <td>
                                                <div class="fw-semibold">{{ prefixEntry.label }}</div>
                                            </td>
                                            <td>
                                                <input class="form-control" type="text" maxlength="12" [(ngModel)]="prefixEntry.prefix" [name]="'prefix-' + prefixEntry.type" />
                                            </td>
                                            <td>
                                                <span class="badge text-bg-light border">{{ previewDocumentCode(prefixEntry) }}</span>
                                            </td>
                                            <td class="text-secondary small">{{ prefixEntry.description }}</td>
                                        </tr>
                                    }
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <div class="card adminuiux-card mb-3 mb-lg-4">
                    <div class="card-body">
                        <div class="row gx-3 gy-3 align-items-end">
                            <div class="col-12 col-lg-4">
                                <label class="form-label">Buscar</label>
                                <input class="form-control" type="text" placeholder="Canal o linea comercial" [(ngModel)]="searchTerm" name="searchTerm" />
                            </div>
                            <div class="col-12 col-md-6 col-lg-3">
                                <label class="form-label">Canal</label>
                                <select class="form-select" [(ngModel)]="selectedChannel" name="selectedChannel">
                                    <option value="">Todos</option>
                                    @for (channel of channels; track channel) {
                                        <option [value]="channel">{{ channel }}</option>
                                    }
                                </select>
                            </div>
                            <div class="col-12 col-md-6 col-lg-3">
                                <label class="form-label">Estado</label>
                                <select class="form-select" [(ngModel)]="selectedActivity" name="selectedActivity">
                                    <option value="all">Todas</option>
                                    <option value="active">Activas</option>
                                    <option value="inactive">Inactivas</option>
                                </select>
                            </div>
                            <div class="col-12 col-lg-2 d-grid">
                                <button class="btn btn-outline-secondary" type="button" (click)="clearFilters()">Limpiar</button>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="card adminuiux-card mb-3 mb-lg-4">
                    <div class="card-body p-0">
                        <div class="table-responsive">
                            <table class="table align-middle mb-0">
                                <thead>
                                    <tr>
                                        <th>Canal</th>
                                        <th>Linea comercial</th>
                                        <th>Rango de venta</th>
                                        <th>Comision base</th>
                                        <th>Bono acelerador</th>
                                        <th>Estado</th>
                                        <th>Actualizado</th>
                                        <th class="text-end">Accion</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    @for (rule of filteredRules; track rule.id) {
                                        <tr>
                                            <td>{{ rule.channel }}</td>
                                            <td>{{ rule.line }}</td>
                                            <td>{{ formatRange(rule) }}</td>
                                            <td>{{ rule.baseRate }}%</td>
                                            <td>+{{ rule.bonusRate }}% desde {{ formatMoney(rule.bonusFrom) }}</td>
                                            <td>
                                                <span class="badge rounded-pill" [class.text-bg-success]="rule.active" [class.text-bg-secondary]="!rule.active">
                                                    {{ rule.active ? "Activa" : "Inactiva" }}
                                                </span>
                                            </td>
                                            <td>{{ rule.updatedAt }}</td>
                                            <td class="text-end">
                                                <div class="d-flex justify-content-end gap-1">
                                                    <button class="btn btn-sm btn-outline-secondary" type="button" (click)="editRule(rule.id)">Editar</button>
                                                    <button class="btn btn-sm btn-outline-theme" type="button" (click)="toggleRule(rule.id)">
                                                        {{ rule.active ? "Desactivar" : "Activar" }}
                                                    </button>
                                                    <button class="btn btn-sm btn-outline-danger" type="button" (click)="removeRule(rule.id)">Eliminar</button>
                                                </div>
                                            </td>
                                        </tr>
                                    } @empty {
                                        <tr>
                                            <td colspan="8" class="text-center py-4 text-secondary">No hay reglas para el filtro aplicado.</td>
                                        </tr>
                                    }
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <div class="card-footer bg-transparent border-0 pt-3">
                        <p class="small text-secondary mb-0">Mostrando {{ filteredRules.length }} de {{ rules.length }} reglas.</p>
                    </div>
                </div>

                <div class="card adminuiux-card mb-3 mb-lg-4">
                    <div class="card-header border-bottom d-flex justify-content-between align-items-center">
                        <h6 class="mb-0">Configuracion de zonas</h6>
                        <button class="btn btn-sm btn-theme" type="button" (click)="openCreateZoneForm()">
                            <i class="bi bi-plus-lg me-1"></i>Nueva zona
                        </button>
                    </div>
                    <div class="card-body p-0">
                        @if (zoneFormError) {
                            <div class="alert alert-danger border rounded-0 m-0">{{ zoneFormError }}</div>
                        }

                        <div class="table-responsive">
                            <table class="table align-middle mb-0">
                                <thead>
                                    <tr>
                                        <th>Zona</th>
                                        <th class="text-end">Clientes asignados</th>
                                        <th class="text-end">Accion</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    @for (zone of zones; track zone.id) {
                                        <tr>
                                            <td>{{ zone.name }}</td>
                                            <td class="text-end">{{ getClientCountByZone(zone.name) }}</td>
                                            <td class="text-end">
                                                <button class="btn btn-sm btn-outline-secondary me-2" type="button" (click)="editZone(zone.id)">Editar</button>
                                                <button class="btn btn-sm btn-outline-danger" type="button" (click)="openDeleteZoneModal(zone.id)">Borrar</button>
                                            </td>
                                        </tr>
                                    } @empty {
                                        <tr>
                                            <td colspan="3" class="text-center py-4 text-secondary">No hay zonas configuradas.</td>
                                        </tr>
                                    }
                                </tbody>
                            </table>
                        </div>
                    </div>

                    @if (showZoneForm) {
                        <div class="card-footer border-top">
                            <div class="row gx-3 gy-3 align-items-end">
                                <div class="col-12 col-lg-6">
                                    <label class="form-label">Nombre de zona</label>
                                    <input class="form-control" type="text" [(ngModel)]="zoneDraft.name" name="zoneDraftName" placeholder="Ej: Bogotá" />
                                </div>
                                <div class="col-12 col-lg-6 d-flex gap-2 justify-content-lg-end">
                                    <button class="btn btn-theme" type="button" (click)="saveZone()">Guardar zona</button>
                                    <button class="btn btn-outline-secondary" type="button" (click)="cancelZoneForm()">Cancelar</button>
                                </div>
                            </div>
                        </div>
                    }
                </div>

                <div class="card adminuiux-card mb-3 mb-lg-4">
                    <div class="card-header border-bottom">
                        <h6 class="mb-0">Simulador de comision</h6>
                    </div>
                    <div class="card-body">
                        <div class="row gx-3 gy-3 align-items-end">
                            <div class="col-12 col-lg-4">
                                <label class="form-label">Regla</label>
                                <select class="form-select" [(ngModel)]="simRuleId" name="simRuleId">
                                    <option [ngValue]="null">Selecciona una regla</option>
                                    @for (rule of activeRules; track rule.id) {
                                        <option [ngValue]="rule.id">{{ rule.channel }} - {{ rule.line }}</option>
                                    }
                                </select>
                            </div>
                            <div class="col-12 col-lg-4">
                                <label class="form-label">Monto de venta</label>
                                <input class="form-control" type="number" min="0" step="1000" [(ngModel)]="simAmount" name="simAmount" />
                            </div>
                        </div>

                        @if (simulation) {
                            <div class="row gx-3 gy-3 mt-1">
                                <div class="col-12 col-md-4">
                                    <div class="border rounded p-3 h-100">
                                        <p class="small text-secondary mb-1">Comision base</p>
                                        <h6 class="mb-0">{{ formatMoney(simulation.baseCommission) }}</h6>
                                    </div>
                                </div>
                                <div class="col-12 col-md-4">
                                    <div class="border rounded p-3 h-100">
                                        <p class="small text-secondary mb-1">Bono acelerador</p>
                                        <h6 class="mb-0">{{ formatMoney(simulation.bonusCommission) }}</h6>
                                    </div>
                                </div>
                                <div class="col-12 col-md-4">
                                    <div class="border rounded p-3 h-100">
                                        <p class="small text-secondary mb-1">Total estimado</p>
                                        <h6 class="mb-0 text-theme">{{ formatMoney(simulation.totalCommission) }}</h6>
                                    </div>
                                </div>
                            </div>
                        } @else {
                            <p class="small text-secondary mb-0 mt-3">Selecciona una regla activa para ver el calculo estimado.</p>
                        }
                    </div>
                </div>
            } @else {
                <div class="card adminuiux-card mb-3 mb-lg-4">
                    <div class="card-header">
                        <h6 class="mb-0">{{ editingRuleId === null ? "Nueva regla comercial" : "Editar regla comercial" }}</h6>
                    </div>
                    <div class="card-body">
                        <form (ngSubmit)="saveRule()" novalidate>
                            <div class="row gx-3 gy-3">
                                <div class="col-12 col-lg-3">
                                    <label class="form-label">Canal</label>
                                    <select class="form-select" [(ngModel)]="draft.channel" name="channel">
                                        @for (channel of channels; track channel) {
                                            <option [value]="channel">{{ channel }}</option>
                                        }
                                    </select>
                                </div>
                                <div class="col-12 col-lg-3">
                                    <label class="form-label">Linea comercial</label>
                                    <input class="form-control" type="text" [(ngModel)]="draft.line" name="line" placeholder="Ej: Mantenimiento anual" />
                                </div>
                                <div class="col-12 col-lg-3">
                                    <label class="form-label">Monto minimo</label>
                                    <input class="form-control" type="number" min="0" step="1000" [(ngModel)]="draft.minAmount" name="minAmount" />
                                </div>
                                <div class="col-12 col-lg-3">
                                    <label class="form-label">Monto maximo (opcional)</label>
                                    <input class="form-control" type="number" min="0" step="1000" [(ngModel)]="draft.maxAmount" name="maxAmount" />
                                </div>

                                <div class="col-12 col-lg-3">
                                    <label class="form-label">Comision base (%)</label>
                                    <input class="form-control" type="number" min="0" max="100" step="0.1" [(ngModel)]="draft.baseRate" name="baseRate" />
                                </div>
                                <div class="col-12 col-lg-3">
                                    <label class="form-label">Bono desde</label>
                                    <input class="form-control" type="number" min="0" step="1000" [(ngModel)]="draft.bonusFrom" name="bonusFrom" />
                                </div>
                                <div class="col-12 col-lg-3">
                                    <label class="form-label">Bono (%)</label>
                                    <input class="form-control" type="number" min="0" max="100" step="0.1" [(ngModel)]="draft.bonusRate" name="bonusRate" />
                                </div>
                                <div class="col-12 col-lg-3 d-flex align-items-center">
                                    <div class="form-check mt-4">
                                        <input class="form-check-input" type="checkbox" id="draftRuleActive" [(ngModel)]="draft.active" name="active" />
                                        <label class="form-check-label" for="draftRuleActive">Regla activa</label>
                                    </div>
                                </div>
                            </div>

                            <div class="mt-3 d-flex gap-2">
                                <button class="btn btn-theme" type="submit">Guardar</button>
                                <button class="btn btn-outline-secondary" type="button" (click)="goToList()">Cancelar</button>
                            </div>
                        </form>
                    </div>
                </div>
            }
        </div>

        @if (showDeleteZoneModal && zoneToDelete) {
            <div class="modal fade show d-block" tabindex="-1" role="dialog" aria-modal="true" (click)="closeDeleteZoneModal()">
                <div class="modal-dialog modal-dialog-centered" role="document" (click)="$event.stopPropagation()">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Reasignar clientes antes de borrar zona</h5>
                            <button type="button" class="btn-close" aria-label="Cerrar" (click)="closeDeleteZoneModal()"></button>
                        </div>
                        <div class="modal-body">
                            <p class="mb-2">Vas a eliminar la zona <strong>{{ zoneToDelete.name }}</strong>.</p>
                            <p class="text-secondary small mb-3">Debes reasignar todos los clientes de esta zona a una nueva zona para continuar.</p>

                            <label class="form-label">Nueva zona para reasignacion</label>
                            <select class="form-select" [(ngModel)]="zoneReassignTargetId" name="zoneReassignTargetId">
                                <option [ngValue]="null">Selecciona una zona</option>
                                @for (zone of zoneReassignOptions; track zone.id) {
                                    <option [ngValue]="zone.id">{{ zone.name }}</option>
                                }
                            </select>

                            @if (zoneDeleteError) {
                                <div class="alert alert-danger border mt-3 mb-0">{{ zoneDeleteError }}</div>
                            }
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-outline-secondary" (click)="closeDeleteZoneModal()">Cancelar</button>
                            <button type="button" class="btn btn-danger" (click)="confirmDeleteZone()">Reasignar y borrar</button>
                        </div>
                    </div>
                </div>
            </div>
            <div class="modal-backdrop fade show"></div>
        }
    `,
})
export class CompanyCommercialConfigComponent {
    readonly channels: CommissionChannel[] = ["Directo", "Referido", "Distribuidor", "Renovacion"];

    viewMode: "list" | "form" = "list";
    rules: CommissionRule[] = [];
    editingRuleId: number | null = null;

    searchTerm = "";
    selectedChannel: CommissionChannel | "" = "";
    selectedActivity: "all" | "active" | "inactive" = "all";

    successMessage = "";
    formError = "";

    simRuleId: number | null = null;
    simAmount = 12000000;

    zones: CrmZoneRecord[] = [];
    showZoneForm = false;
    editingZoneId: number | null = null;
    zoneDraft: ZoneDraft = this.createDefaultZoneDraft();
    zoneFormError = "";

    showDeleteZoneModal = false;
    zoneDeleteId: number | null = null;
    zoneReassignTargetId: number | null = null;
    zoneDeleteError = "";
    documentPrefixDrafts: CommercialDocumentPrefixEntry[] = getCommercialDocumentPrefixEntries();
    prefixFormError = "";

    draft: CommissionRuleDraft = this.createDefaultDraft();

    constructor() {
        this.rules = this.loadRules();
        this.simRuleId = this.activeRules[0]?.id ?? null;
        this.zones = this.loadZones();
    }

    get zoneToDelete(): CrmZoneRecord | null {
        return this.zones.find((zone) => zone.id === this.zoneDeleteId) ?? null;
    }

    get zoneReassignOptions(): CrmZoneRecord[] {
        return this.zones.filter((zone) => zone.id !== this.zoneDeleteId);
    }

    get filteredRules(): CommissionRule[] {
        const normalizedSearch = this.searchTerm.trim().toLowerCase();

        return this.rules.filter((rule) => {
            const matchesChannel = this.selectedChannel ? rule.channel === this.selectedChannel : true;
            const matchesActivity = this.selectedActivity === "all" ? true : this.selectedActivity === "active" ? rule.active : !rule.active;

            const searchable = [rule.channel, rule.line].join(" ").toLowerCase();
            const matchesSearch = normalizedSearch ? searchable.includes(normalizedSearch) : true;

            return matchesChannel && matchesActivity && matchesSearch;
        });
    }

    get activeRules(): CommissionRule[] {
        return this.rules.filter((rule) => rule.active);
    }

    get simulation(): { baseCommission: number; bonusCommission: number; totalCommission: number } | null {
        const rule = this.rules.find((item) => item.id === this.simRuleId && item.active);
        if (!rule) {
            return null;
        }

        const amount = Number.isFinite(this.simAmount) ? Math.max(0, this.simAmount) : 0;
        const baseCommission = amount * (rule.baseRate / 100);
        const bonusCommission = amount >= rule.bonusFrom ? amount * (rule.bonusRate / 100) : 0;

        return {
            baseCommission,
            bonusCommission,
            totalCommission: baseCommission + bonusCommission,
        };
    }

    openCreateForm(): void {
        this.viewMode = "form";
        this.editingRuleId = null;
        this.formError = "";
        this.successMessage = "";
        this.draft = this.createDefaultDraft();
    }

    goToList(): void {
        this.viewMode = "list";
        this.editingRuleId = null;
        this.formError = "";
        this.draft = this.createDefaultDraft();
    }

    clearFilters(): void {
        this.searchTerm = "";
        this.selectedChannel = "";
        this.selectedActivity = "all";
    }

    previewDocumentCode(prefixEntry: CommercialDocumentPrefixEntry): string {
        const currentYear = new Date().getFullYear();
        const currentMonth = String(new Date().getMonth() + 1).padStart(2, "0");
        const normalizedPrefix = sanitizeCommercialPrefix(prefixEntry.prefix, prefixEntry.defaultPrefix);
        return prefixEntry.type === "dispatch"
            ? `${normalizedPrefix}-${currentYear}-${currentMonth}-001`
            : `${normalizedPrefix}-${currentYear}-001`;
    }

    saveDocumentPrefixes(): void {
        this.prefixFormError = "";
        this.successMessage = "";

        const normalizedEntries = this.documentPrefixDrafts.map((entry) => ({
            type: entry.type,
            prefix: sanitizeCommercialPrefix(entry.prefix, entry.defaultPrefix),
        }));

        const duplicates = normalizedEntries.filter(
            (entry, index) => normalizedEntries.findIndex((candidate) => candidate.prefix === entry.prefix) !== index
        );

        if (duplicates.length) {
            this.prefixFormError = "Cada documento debe tener un prefijo unico para evitar consecutivos duplicados.";
            return;
        }

        const nextPrefixes = normalizedEntries.reduce((accumulator, entry) => {
            accumulator[entry.type] = entry.prefix;
            return accumulator;
        }, {} as Partial<Record<CommercialDocumentType, string>>);

        this.documentPrefixDrafts = saveCommercialDocumentPrefixes(nextPrefixes);
        this.successMessage = "Prefijos comerciales actualizados correctamente.";
    }

    resetDocumentPrefixes(): void {
        this.prefixFormError = "";
        this.documentPrefixDrafts = resetCommercialDocumentPrefixes();
        this.successMessage = "Prefijos comerciales restablecidos a sus valores por defecto.";
    }

    editRule(id: number): void {
        const rule = this.rules.find((item) => item.id === id);
        if (!rule) {
            return;
        }

        this.viewMode = "form";
        this.editingRuleId = id;
        this.formError = "";
        this.successMessage = "";
        this.draft = {
            channel: rule.channel,
            line: rule.line,
            minAmount: rule.minAmount,
            maxAmount: rule.maxAmount,
            baseRate: rule.baseRate,
            bonusFrom: rule.bonusFrom,
            bonusRate: rule.bonusRate,
            active: rule.active,
        };
    }

    saveRule(): void {
        this.formError = "";
        this.successMessage = "";

        const line = this.draft.line.trim();
        const minAmount = Number(this.draft.minAmount);
        const maxAmount = this.draft.maxAmount === null || this.draft.maxAmount === undefined || this.draft.maxAmount === 0 ? null : Number(this.draft.maxAmount);
        const baseRate = Number(this.draft.baseRate);
        const bonusFrom = Number(this.draft.bonusFrom);
        const bonusRate = Number(this.draft.bonusRate);

        if (!line) {
            this.formError = "La linea comercial es obligatoria.";
            return;
        }

        if (!Number.isFinite(minAmount) || minAmount < 0) {
            this.formError = "El monto minimo debe ser un numero valido.";
            return;
        }

        if (maxAmount !== null && (!Number.isFinite(maxAmount) || maxAmount < minAmount)) {
            this.formError = "El monto maximo debe ser mayor o igual al minimo.";
            return;
        }

        if (!Number.isFinite(baseRate) || baseRate < 0 || baseRate > 100) {
            this.formError = "La comision base debe estar entre 0 y 100.";
            return;
        }

        if (!Number.isFinite(bonusFrom) || bonusFrom < 0) {
            this.formError = "El monto de bono desde debe ser valido.";
            return;
        }

        if (!Number.isFinite(bonusRate) || bonusRate < 0 || bonusRate > 100) {
            this.formError = "El porcentaje de bono debe estar entre 0 y 100.";
            return;
        }

        const updatedAt = this.todayLabel();

        if (this.editingRuleId === null) {
            const nextRule: CommissionRule = {
                id: Date.now(),
                channel: this.draft.channel,
                line,
                minAmount,
                maxAmount,
                baseRate,
                bonusFrom,
                bonusRate,
                active: this.draft.active,
                updatedAt,
            };

            this.rules = [nextRule, ...this.rules];
            this.successMessage = "Regla comercial creada correctamente.";
        } else {
            this.rules = this.rules.map((rule) => {
                if (rule.id !== this.editingRuleId) {
                    return rule;
                }

                return {
                    ...rule,
                    channel: this.draft.channel,
                    line,
                    minAmount,
                    maxAmount,
                    baseRate,
                    bonusFrom,
                    bonusRate,
                    active: this.draft.active,
                    updatedAt,
                };
            });
            this.successMessage = "Regla comercial actualizada correctamente.";
        }

        this.persistRules();
        this.simRuleId = this.activeRules[0]?.id ?? null;
        this.goToList();
    }

    toggleRule(id: number): void {
        this.rules = this.rules.map((rule) => {
            if (rule.id !== id) {
                return rule;
            }

            return {
                ...rule,
                active: !rule.active,
                updatedAt: this.todayLabel(),
            };
        });

        this.persistRules();
        if (!this.rules.some((rule) => rule.id === this.simRuleId && rule.active)) {
            this.simRuleId = this.activeRules[0]?.id ?? null;
        }
        this.successMessage = "Estado de regla actualizado.";
    }

    removeRule(id: number): void {
        this.rules = this.rules.filter((rule) => rule.id !== id);
        this.persistRules();

        if (!this.rules.some((rule) => rule.id === this.simRuleId && rule.active)) {
            this.simRuleId = this.activeRules[0]?.id ?? null;
        }

        this.successMessage = "Regla eliminada.";
    }

    getClientCountByZone(zoneName: string): number {
        return getCrmClients().filter((client) => client.zona === zoneName).length;
    }

    openCreateZoneForm(): void {
        this.zoneFormError = "";
        this.editingZoneId = null;
        this.zoneDraft = this.createDefaultZoneDraft();
        this.showZoneForm = true;
    }

    editZone(zoneId: number): void {
        this.zoneFormError = "";
        const zone = this.zones.find((item) => item.id === zoneId);
        if (!zone) {
            return;
        }

        this.editingZoneId = zone.id;
        this.zoneDraft = { name: zone.name };
        this.showZoneForm = true;
    }

    cancelZoneForm(): void {
        this.showZoneForm = false;
        this.editingZoneId = null;
        this.zoneDraft = this.createDefaultZoneDraft();
        this.zoneFormError = "";
    }

    saveZone(): void {
        this.zoneFormError = "";
        const name = this.zoneDraft.name.trim();

        if (!name) {
            this.zoneFormError = "El nombre de la zona es obligatorio.";
            return;
        }

        const duplicate = this.zones.some((zone) => zone.name.toLowerCase() === name.toLowerCase() && zone.id !== this.editingZoneId);
        if (duplicate) {
            this.zoneFormError = "Ya existe una zona con ese nombre.";
            return;
        }

        if (this.editingZoneId === null) {
            const nextId = this.zones.length ? Math.max(...this.zones.map((zone) => zone.id)) + 1 : 1;
            this.zones = [...this.zones, { id: nextId, name }];
            saveCrmZones(this.zones);
            this.successMessage = "Zona creada correctamente.";
        } else {
            const previous = this.zones.find((zone) => zone.id === this.editingZoneId);
            if (!previous) {
                return;
            }

            this.zones = this.zones.map((zone) => (zone.id === this.editingZoneId ? { ...zone, name } : zone));
            saveCrmZones(this.zones);

            if (previous.name !== name) {
                const renamedClients = getCrmClients().map((client) => {
                    if (client.zona !== previous.name) {
                        return client;
                    }

                    return {
                        ...client,
                        zona: name,
                    };
                });
                saveCrmClients(renamedClients);
            }

            this.successMessage = "Zona actualizada correctamente.";
        }

        this.cancelZoneForm();
    }

    openDeleteZoneModal(zoneId: number): void {
        this.zoneDeleteError = "";
        this.zoneDeleteId = zoneId;

        if (this.zoneReassignOptions.length === 0) {
            this.zoneDeleteError = "No puedes borrar la unica zona existente. Crea otra zona primero.";
            this.zoneDeleteId = null;
            this.formError = this.zoneDeleteError;
            return;
        }

        this.zoneReassignTargetId = this.zoneReassignOptions[0]?.id ?? null;
        this.showDeleteZoneModal = true;
    }

    closeDeleteZoneModal(): void {
        this.showDeleteZoneModal = false;
        this.zoneDeleteId = null;
        this.zoneReassignTargetId = null;
        this.zoneDeleteError = "";
    }

    confirmDeleteZone(): void {
        this.zoneDeleteError = "";

        const zoneToDelete = this.zoneToDelete;
        if (!zoneToDelete) {
            return;
        }

        const targetZone = this.zoneReassignOptions.find((zone) => zone.id === this.zoneReassignTargetId);
        if (!targetZone) {
            this.zoneDeleteError = "Debes seleccionar la nueva zona para reasignar los clientes.";
            return;
        }

        reassignCrmClientsZone(zoneToDelete.name, targetZone.name);
        this.zones = this.zones.filter((zone) => zone.id !== zoneToDelete.id);
        saveCrmZones(this.zones);

        this.successMessage = `Zona ${zoneToDelete.name} eliminada y clientes reasignados a ${targetZone.name}.`;
        this.closeDeleteZoneModal();
    }

    formatMoney(value: number): string {
        return new Intl.NumberFormat("es-CO", {
            style: "currency",
            currency: "COP",
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(value);
    }

    formatRange(rule: CommissionRule): string {
        const minLabel = this.formatMoney(rule.minAmount);
        const maxLabel = rule.maxAmount === null ? "Sin tope" : this.formatMoney(rule.maxAmount);
        return `${minLabel} - ${maxLabel}`;
    }

    private createDefaultDraft(): CommissionRuleDraft {
        return {
            channel: "Directo",
            line: "",
            minAmount: 0,
            maxAmount: null,
            baseRate: 2.5,
            bonusFrom: 10000000,
            bonusRate: 0.5,
            active: true,
        };
    }

    private createDefaultZoneDraft(): ZoneDraft {
        return {
            name: "",
        };
    }

    private loadZones(): CrmZoneRecord[] {
        return getCrmZones();
    }

    private loadRules(): CommissionRule[] {
        if (typeof window === "undefined" || typeof window.localStorage === "undefined") {
            return this.defaultRules();
        }

        const rawValue = window.localStorage.getItem(COMMISSIONS_STORAGE_KEY);
        if (!rawValue) {
            return this.defaultRules();
        }

        try {
            const parsed = JSON.parse(rawValue) as CommissionRule[];
            return Array.isArray(parsed) ? parsed : this.defaultRules();
        } catch {
            return this.defaultRules();
        }
    }

    private persistRules(): void {
        if (typeof window === "undefined" || typeof window.localStorage === "undefined") {
            return;
        }

        window.localStorage.setItem(COMMISSIONS_STORAGE_KEY, JSON.stringify(this.rules));
    }

    private defaultRules(): CommissionRule[] {
        return [
            {
                id: 1,
                channel: "Directo",
                line: "Implementacion CRM",
                minAmount: 3000000,
                maxAmount: null,
                baseRate: 3,
                bonusFrom: 15000000,
                bonusRate: 1,
                active: true,
                updatedAt: "13/04/2026",
            },
            {
                id: 2,
                channel: "Referido",
                line: "Soporte mensual",
                minAmount: 800000,
                maxAmount: 8000000,
                baseRate: 2,
                bonusFrom: 5000000,
                bonusRate: 0.5,
                active: true,
                updatedAt: "11/04/2026",
            },
            {
                id: 3,
                channel: "Distribuidor",
                line: "Repuestos electronicos",
                minAmount: 1200000,
                maxAmount: null,
                baseRate: 1.5,
                bonusFrom: 10000000,
                bonusRate: 0.8,
                active: false,
                updatedAt: "09/04/2026",
            },
        ];
    }

    private todayLabel(): string {
        const today = new Date();
        const day = String(today.getDate()).padStart(2, "0");
        const month = String(today.getMonth() + 1).padStart(2, "0");
        const year = today.getFullYear();
        return `${day}/${month}/${year}`;
    }
}
