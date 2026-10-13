import { Injectable, inject } from "@angular/core";
import { BehaviorSubject, firstValueFrom } from "rxjs";
import { SuppliersApiService } from "./suppliers-api.service";

export type SupplierGrade = "A" | "B" | "C" | "D";
export type ContactTitle = "Sr." | "Sra.";

export interface SupplierRecord {
    id: number;
    supplierNumber: string;
    legalName: string;
    mainAddress: string;
    addressExtra: string;
    postalCode: string;
    city: string;
    country: string;
    taxIdentification: string;
    intraVatNumber: string;
    language: string;
    currency: string;
    defaultContact: string;
    title: ContactTitle;
    lastName: string;
    firstName: string;
    mobilePhone: string;
    contactRole: string;
    accountsPayableAccount: string;
    sector: string;
    rseCompliant: boolean;
    subscriptionActive: boolean;
    notes: string;
    accountingNumber: string;
    paymentTerms: string;
    shippingTerms: string;
    minimumOrder: number;
    taxRate: number;
    responsiblePerson: string;
    confidenceGrade: SupplierGrade;
    performanceNotes: string;
}

export type SupplierDraft = Omit<SupplierRecord, "id">;

@Injectable({
    providedIn: "root",
})
export class SuppliersCatalogService {
    private readonly suppliersSubject = new BehaviorSubject<SupplierRecord[]>([]);
    readonly suppliers$ = this.suppliersSubject.asObservable();

    private readonly api = inject(SuppliersApiService);
    private loaded = false;
    private loading = false;

    constructor() {
        this.loadFromApi();
    }

    async loadFromApi(): Promise<void> {
        if (this.loading) return;
        this.loading = true;
        try {
            const items = await firstValueFrom(this.api.listSuppliers());
            this.suppliersSubject.next(items);
            this.loaded = true;
        } catch {
            // Keep current state on error
        } finally {
            this.loading = false;
        }
    }

    private async refreshFromApi(): Promise<void> {
        try {
            const items = await firstValueFrom(this.api.listSuppliers());
            this.suppliersSubject.next(items);
        } catch {
            // Silently fail
        }
    }

    getSnapshot(): SupplierRecord[] {
        return this.cloneSuppliers(this.suppliersSubject.value);
    }

    findById(supplierId: number | null | undefined): SupplierRecord | undefined {
        if (!Number.isFinite(Number(supplierId))) {
            return undefined;
        }
        return this.suppliersSubject.value.find((supplier) => supplier.id === supplierId);
    }

    findBySupplierNumber(supplierNumber: string): SupplierRecord | undefined {
        const normalized = this.normalizeToken(supplierNumber);
        if (!normalized) return undefined;
        return this.suppliersSubject.value.find((supplier) => this.normalizeToken(supplier.supplierNumber) === normalized);
    }

    findByLegalName(legalName: string): SupplierRecord | undefined {
        const normalized = this.normalizeToken(legalName);
        if (!normalized) return undefined;
        return this.suppliersSubject.value.find((supplier) => this.normalizeToken(supplier.legalName) === normalized);
    }

    createSupplier(draft: SupplierDraft): SupplierRecord {
        const normalizedDraft = this.normalizeDraft(draft);
        const tempId = Date.now();
        const supplier: SupplierRecord = { id: tempId, ...normalizedDraft };

        this.suppliersSubject.next([supplier, ...this.suppliersSubject.value]);

        firstValueFrom(this.api.createSupplier(normalizedDraft)).then(
            () => this.refreshFromApi(),
            () => this.refreshFromApi(),
        );

        return supplier;
    }

    updateSupplier(supplierId: number, draft: SupplierDraft): SupplierRecord | null {
        const normalizedDraft = this.normalizeDraft(draft);
        const updated: SupplierRecord = { id: supplierId, ...normalizedDraft };

        this.suppliersSubject.next(
            this.suppliersSubject.value.map((s) => (s.id === supplierId ? updated : s))
        );

        firstValueFrom(this.api.updateSupplier(supplierId, normalizedDraft)).then(
            () => this.refreshFromApi(),
            () => this.refreshFromApi(),
        );

        return updated;
    }

    removeSupplier(supplierId: number): boolean {
        const existed = this.suppliersSubject.value.some((s) => s.id === supplierId);
        if (!existed) return false;

        this.suppliersSubject.next(this.suppliersSubject.value.filter((s) => s.id !== supplierId));

        firstValueFrom(this.api.deleteSupplier(supplierId)).then(
            () => this.refreshFromApi(),
            () => this.refreshFromApi(),
        );

        return true;
    }

    private normalizeToken(value: string): string {
        return value.trim().toLowerCase().replace(/\s+/g, " ");
    }

    private normalizeGrade(value: string | undefined): SupplierGrade {
        if (value === "B" || value === "C" || value === "D") return value;
        return "A";
    }

    private normalizeDraft(draft: SupplierDraft): SupplierDraft {
        return {
            ...draft,
            supplierNumber: String(draft.supplierNumber ?? "").trim(),
            legalName: String(draft.legalName ?? "").trim(),
            mainAddress: String(draft.mainAddress ?? "").trim(),
            addressExtra: String(draft.addressExtra ?? "").trim(),
            postalCode: String(draft.postalCode ?? "").trim(),
            city: String(draft.city ?? "").trim(),
            country: String(draft.country ?? "").trim(),
            taxIdentification: String(draft.taxIdentification ?? "").trim(),
            intraVatNumber: String(draft.intraVatNumber ?? "").trim(),
            language: String(draft.language ?? "").trim() || "Espanol",
            currency: String(draft.currency ?? "").trim() || "Pesos",
            defaultContact: String(draft.defaultContact ?? "").trim(),
            title: draft.title === "Sra." ? "Sra." : "Sr.",
            lastName: String(draft.lastName ?? "").trim(),
            firstName: String(draft.firstName ?? "").trim(),
            mobilePhone: String(draft.mobilePhone ?? "").trim(),
            contactRole: String(draft.contactRole ?? "").trim(),
            accountsPayableAccount: String(draft.accountsPayableAccount ?? "").trim(),
            sector: String(draft.sector ?? "").trim(),
            rseCompliant: Boolean(draft.rseCompliant),
            subscriptionActive: Boolean(draft.subscriptionActive),
            notes: String(draft.notes ?? "").trim(),
            accountingNumber: String(draft.accountingNumber ?? "").trim(),
            paymentTerms: String(draft.paymentTerms ?? "").trim() || "Transferencia a 45 dias",
            shippingTerms: String(draft.shippingTerms ?? "").trim(),
            minimumOrder: Math.max(0, Number(draft.minimumOrder) || 0),
            taxRate: Math.max(0, Number(draft.taxRate) || 0),
            responsiblePerson: String(draft.responsiblePerson ?? "").trim(),
            confidenceGrade: this.normalizeGrade(draft.confidenceGrade),
            performanceNotes: String(draft.performanceNotes ?? "").trim(),
        };
    }

    private cloneSuppliers(rows: SupplierRecord[]): SupplierRecord[] {
        return rows.map((supplier) => ({ ...supplier }));
    }
}
