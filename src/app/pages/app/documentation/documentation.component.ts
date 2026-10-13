import { CommonModule } from "@angular/common";
import { Component, OnInit } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { resolveApiBaseUrl } from "../../../services/api-base-url.util";

interface Document {
    id: string;
    title: string;
    type: string;
    equipmentModel: string;
    url: string;
    description: string;
    deletable: boolean;
    createdAt: string;
}

interface SoftwareBackup {
    id: string;
    equipmentModel: string;
    fileName: string;
    url: string;
    version: string;
    createdAt: string;
}

@Component({
    selector: "app-documentation",
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
<div class="container-fluid p-4">
    <h4 class="mb-3"><i class="bi bi-book me-2"></i>Biblioteca Tecnica</h4>

    <div class="row mb-3">
        <div class="col-md-6">
            <input class="form-control" [(ngModel)]="searchQuery" placeholder="Buscar documentacion..." (input)="filterDocuments()" data-testid="doc-search-input" />
        </div>
        <div class="col-md-6 text-end">
            <button class="btn btn-theme me-2" (click)="showDocForm = !showDocForm"><i class="bi bi-plus-lg me-1"></i>Agregar documento</button>
            <button class="btn btn-outline-primary" (click)="showBackupForm = !showBackupForm"><i class="bi bi-cloud-upload me-1"></i>Backup de software</button>
        </div>
    </div>

    <div class="card mb-3" *ngIf="showDocForm">
        <div class="card-body">
            <h5>Agregar documento</h5>
            <div class="row g-3">
                <div class="col-md-4"><label class="form-label">Titulo</label><input class="form-control" [(ngModel)]="newDoc.title" /></div>
                <div class="col-md-3">
                    <label class="form-label">Tipo</label>
                    <select class="form-select" [(ngModel)]="newDoc.type">
                        <option value="manual">Manual</option>
                        <option value="plano">Plano / Diagrama</option>
                        <option value="video">Video</option>
                        <option value="otro">Otro</option>
                    </select>
                </div>
                <div class="col-md-3"><label class="form-label">Modelo de equipo</label><input class="form-control" [(ngModel)]="newDoc.equipmentModel" /></div>
                <div class="col-md-2"><label class="form-label">URL</label><input class="form-control" [(ngModel)]="newDoc.url" /></div>
            </div>
            <div class="mt-2"><label class="form-label">Descripcion</label><textarea class="form-control" rows="2" [(ngModel)]="newDoc.description"></textarea></div>
            <button class="btn btn-theme mt-2" (click)="saveDoc()"><i class="bi bi-save me-1"></i>Guardar</button>
        </div>
    </div>

    <div class="card mb-3" *ngIf="showBackupForm">
        <div class="card-body">
            <h5>Backup de software</h5>
            <div class="row g-3">
                <div class="col-md-4"><label class="form-label">Modelo de equipo/tarjeta</label><input class="form-control" [(ngModel)]="newBackup.equipmentModel" /></div>
                <div class="col-md-3"><label class="form-label">Version</label><input class="form-control" [(ngModel)]="newBackup.version" /></div>
                <div class="col-md-3"><label class="form-label">Archivo</label><input type="file" class="form-control" (change)="onBackupFileSelected($event)" /></div>
            </div>
            <button class="btn btn-primary mt-2" (click)="saveBackup()"><i class="bi bi-cloud-upload me-1"></i>Subir backup</button>
        </div>
    </div>

    <div class="row">
        <div class="col-md-8">
            <div class="card">
                <div class="card-header"><h6 class="mb-0">Documentos</h6></div>
                <div class="list-group list-group-flush">
                    <div *ngFor="let doc of filteredDocs" class="list-group-item d-flex justify-content-between align-items-center">
                        <div>
                            <span class="badge me-2" [ngClass]="{'bg-primary': doc.type === 'manual', 'bg-success': doc.type === 'plano', 'bg-danger': doc.type === 'video', 'bg-secondary': doc.type === 'otro'}">{{ doc.type }}</span>
                            <strong>{{ doc.title }}</strong>
                            <small class="text-muted ms-2">{{ doc.equipmentModel }}</small>
                        </div>
                        <a *ngIf="doc.url" [href]="doc.url" target="_blank" class="btn btn-sm btn-outline-primary"><i class="bi bi-eye"></i></a>
                    </div>
                    <div *ngIf="filteredDocs.length === 0" class="list-group-item text-center text-secondary py-4">No hay documentos</div>
                </div>
            </div>
        </div>
        <div class="col-md-4">
            <div class="card">
                <div class="card-header"><h6 class="mb-0">Backups de software</h6></div>
                <div class="list-group list-group-flush">
                    <div *ngFor="let bak of backups" class="list-group-item">
                        <div class="d-flex justify-content-between">
                            <strong>{{ bak.equipmentModel }}</strong>
                            <small class="text-muted">v{{ bak.version }}</small>
                        </div>
                        <a *ngIf="bak.url" [href]="bak.url" class="btn btn-sm btn-outline-success mt-1" data-testid="download-backup-btn"><i class="bi bi-download me-1"></i>Descargar</a>
                    </div>
                    <div *ngIf="backups.length === 0" class="list-group-item text-center text-secondary py-4">No hay backups</div>
                </div>
            </div>
        </div>
    </div>
</div>
    `,
})
export class DocumentationComponent implements OnInit {
    private apiBaseUrl = resolveApiBaseUrl();
    documents: Document[] = [];
    filteredDocs: Document[] = [];
    backups: SoftwareBackup[] = [];
    searchQuery = "";
    showDocForm = false;
    showBackupForm = false;
    newDoc = { title: "", type: "manual", equipmentModel: "", url: "", description: "" };
    newBackup = { equipmentModel: "", version: "", fileName: "", url: "" };

    ngOnInit() { this.loadData(); }

    private getAuthHeaders() {
        const token = JSON.parse(localStorage.getItem("pika.auth.session") || "{}").accessToken;
        return { "Content-Type": "application/json", "X-Company-Id": "demo-company", Authorization: "Bearer " + token };
    }

    async loadData() {
        const headers = this.getAuthHeaders();
        try {
            const docRes = await fetch(this.apiBaseUrl + "/api/v1/documentation/documents", { headers });
            if (docRes.ok) { const d = await docRes.json(); this.documents = d.items || []; this.filteredDocs = this.documents; }
            const bakRes = await fetch(this.apiBaseUrl + "/api/v1/documentation/backups", { headers });
            if (bakRes.ok) { const b = await bakRes.json(); this.backups = b.items || []; }
        } catch { /* ignore */ }
    }

    filterDocuments() {
        const q = this.searchQuery.toLowerCase();
        this.filteredDocs = this.documents.filter(d =>
            d.title.toLowerCase().includes(q) || d.equipmentModel.toLowerCase().includes(q) || d.type.toLowerCase().includes(q)
        );
    }

    onBackupFileSelected(event: any) {
        const file = event.target.files?.[0];
        if (!file) return;
        this.newBackup.fileName = file.name;
        const reader = new FileReader();
        reader.onload = () => { this.newBackup.url = String(reader.result || ""); };
        reader.readAsDataURL(file);
    }

    async saveDoc() {
        await fetch(this.apiBaseUrl + "/api/v1/documentation/documents", {
            method: "POST",
            headers: this.getAuthHeaders(),
            body: JSON.stringify(this.newDoc),
        });
        this.showDocForm = false;
        this.newDoc = { title: "", type: "manual", equipmentModel: "", url: "", description: "" };
        this.loadData();
    }

    async saveBackup() {
        await fetch(this.apiBaseUrl + "/api/v1/documentation/backups", {
            method: "POST",
            headers: this.getAuthHeaders(),
            body: JSON.stringify(this.newBackup),
        });
        this.showBackupForm = false;
        this.newBackup = { equipmentModel: "", version: "", fileName: "", url: "" };
        this.loadData();
    }
}
