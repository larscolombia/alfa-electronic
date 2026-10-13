import { CommonModule } from "@angular/common";
import { ChangeDetectorRef, Component, Input, OnInit, inject } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { Observable } from "rxjs";
import { ClientContactRecord, CrmClientsApiService, UpsertClientContactRequest } from "../../../services/crm-clients-api.service";
import { CrmProspectContact, CrmProspectsApiService } from "../../../services/crm-prospects-api.service";
import { UnifiedClientContact, buildContactPayload, mergeClientContacts, EMPTY_CONTACT_FORM } from "./crm-client-contacts.util";

@Component({
    selector: "app-crm-client-contacts",
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: "./crm-client-contacts.component.html",
})
export class CrmClientContactsComponent implements OnInit {
    @Input({ required: true }) clientId = "";
    @Input() empresa = "";

    clientContacts: ClientContactRecord[] = [];
    prospectContacts: CrmProspectContact[] = [];
    clientLoading = false;
    prospectLoading = false;

    showForm = false;
    saving = false;
    deletingId = "";
    successMessage = "";
    errorMessage = "";
    formError = "";
    form: UpsertClientContactRequest = { ...EMPTY_CONTACT_FORM };

    editingId = "";
    savingEdit = false;
    editError = "";
    editForm: UpsertClientContactRequest = { ...EMPTY_CONTACT_FORM };

    private readonly crmClientsApi = inject(CrmClientsApiService);
    private readonly crmProspectsApi = inject(CrmProspectsApiService);
    private readonly cdr = inject(ChangeDetectorRef);

    get rows(): UnifiedClientContact[] {
        return mergeClientContacts(this.clientContacts, this.prospectContacts);
    }

    get loading(): boolean {
        return this.clientLoading || this.prospectLoading;
    }

    ngOnInit(): void {
        this.loadClientContacts();
        this.loadProspectContacts();
    }

    openForm(): void {
        this.showForm = true;
        this.formError = "";
        this.successMessage = "";
        this.errorMessage = "";
    }

    cancelForm(): void {
        if (this.saving) return;
        this.showForm = false;
        this.formError = "";
        this.form = { ...EMPTY_CONTACT_FORM };
    }

    saveContact(): void {
        const { payload, error } = buildContactPayload(this.form);
        if (!payload) {
            this.formError = error;
            return;
        }

        this.saving = true;
        this.formError = "";
        this.errorMessage = "";
        this.crmClientsApi.createClientContact(this.clientId, payload).subscribe({
            next: () => {
                this.saving = false;
                this.showForm = false;
                this.form = { ...EMPTY_CONTACT_FORM };
                this.successMessage = "Contacto agregado exitosamente.";
                this.loadClientContacts();
            },
            error: (err: Error) => {
                this.saving = false;
                this.formError = err?.message || "No se pudo crear el contacto.";
                this.cdr.detectChanges();
            },
        });
    }

    startEdit(row: UnifiedClientContact): void {
        this.editingId = `${row.source}:${row.id}`;
        this.editError = "";
        this.successMessage = "";
        this.errorMessage = "";
        this.editForm = { name: row.name, role: row.role, email: row.email, phone: row.phone, notes: row.notes };
    }

    cancelEdit(): void {
        if (this.savingEdit) return;
        this.editingId = "";
        this.editError = "";
    }

    saveEdit(row: UnifiedClientContact): void {
        const { payload, error } = buildContactPayload(this.editForm);
        if (!payload) {
            this.editError = error;
            return;
        }

        this.savingEdit = true;
        this.editError = "";
        const request: Observable<unknown> = row.source === "client"
            ? this.crmClientsApi.updateClientContact(this.clientId, row.id, payload)
            : this.crmProspectsApi.updateProspectContact(row.prospectId, row.id, payload);

        request.subscribe({
            next: () => {
                this.savingEdit = false;
                this.editingId = "";
                this.successMessage = "Contacto actualizado exitosamente.";
                this.applyEdit(row, payload);
                this.cdr.detectChanges();
            },
            error: (err: Error) => {
                this.savingEdit = false;
                this.editError = err?.message || "No se pudo actualizar el contacto.";
                this.cdr.detectChanges();
            },
        });
    }

    deleteContact(row: UnifiedClientContact): void {
        if (this.deletingId) return;
        if (!confirm(`¿Eliminar el contacto "${row.name}"? Esta accion no se puede deshacer.`)) return;

        this.deletingId = `${row.source}:${row.id}`;
        this.errorMessage = "";
        this.successMessage = "";
        const request: Observable<void> = row.source === "client"
            ? this.crmClientsApi.deleteClientContact(this.clientId, row.id)
            : this.crmProspectsApi.deleteProspectContact(row.prospectId, row.id);

        request.subscribe({
            next: () => {
                this.deletingId = "";
                this.successMessage = "Contacto eliminado.";
                this.removeRow(row);
                this.cdr.detectChanges();
            },
            error: (err: Error) => {
                this.deletingId = "";
                this.errorMessage = err?.message || "No se pudo eliminar el contacto.";
                this.cdr.detectChanges();
            },
        });
    }

    private applyEdit(row: UnifiedClientContact, payload: UpsertClientContactRequest): void {
        const list = row.source === "client" ? this.clientContacts : this.prospectContacts;
        const target = list.find((c) => c.id === row.id);
        if (target) {
            Object.assign(target, payload);
        }
    }

    private removeRow(row: UnifiedClientContact): void {
        if (row.source === "client") {
            this.clientContacts = this.clientContacts.filter((c) => c.id !== row.id);
        } else {
            this.prospectContacts = this.prospectContacts.filter((c) => c.id !== row.id);
        }
    }

    private loadClientContacts(): void {
        this.clientLoading = true;
        this.crmClientsApi.listClientContacts(this.clientId).subscribe({
            next: (contacts) => {
                this.clientContacts = contacts;
                this.clientLoading = false;
                this.cdr.detectChanges();
            },
            error: (err: Error) => {
                this.clientContacts = [];
                this.clientLoading = false;
                this.errorMessage = err?.message || "No se pudieron cargar los contactos del cliente.";
                this.cdr.detectChanges();
            },
        });
    }

    private loadProspectContacts(): void {
        this.prospectLoading = true;
        this.crmProspectsApi.listProspects().subscribe({
            next: (prospects) => {
                const company = this.empresa.trim().toLowerCase();
                const matching = prospects.filter((p) => p.compania.trim().toLowerCase() === company);
                if (matching.length === 0) {
                    this.prospectContacts = [];
                    this.prospectLoading = false;
                    this.cdr.detectChanges();
                    return;
                }
                const all: CrmProspectContact[] = [];
                let done = 0;
                matching.forEach((p) => {
                    this.crmProspectsApi.listProspectContacts(p.backendId).subscribe({
                        next: (batch) => {
                            all.push(...batch);
                            if (++done === matching.length) this.finishProspectLoad(all);
                        },
                        error: () => {
                            if (++done === matching.length) this.finishProspectLoad(all);
                        },
                    });
                });
            },
            error: () => {
                this.prospectContacts = [];
                this.prospectLoading = false;
                this.errorMessage = "No se pudieron cargar los contactos de prospectos.";
                this.cdr.detectChanges();
            },
        });
    }

    private finishProspectLoad(contacts: CrmProspectContact[]): void {
        this.prospectContacts = contacts;
        this.prospectLoading = false;
        this.cdr.detectChanges();
    }
}
