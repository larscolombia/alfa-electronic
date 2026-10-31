import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { take } from 'rxjs/operators';
import { PROJECT_REPAIR_STATUS_OPTIONS } from './project-equipment-options';
export type { ProjectRepairStatusOption } from './project-equipment-options';

import { EquipmentLocationRecord, ensureEquipmentCatalogLoaded, getEquipmentLocations } from '../../company/company-equipment-config.store';
import { CrmEquipmentApiService } from '../../../../services/crm-equipment-api.service';
import { resolveEquipmentCode } from '../../crm/equipment-qr.util';
import {
  ProspectEquipmentItem,
  ProspectEquipmentRecord,
  ProspectEquipmentRepairStatus,
  ProspectEquipmentSummary,
  findProspectEquipmentItemByIdentifier,
  formatProspectEquipmentReception,
  getAllProspectEquipmentItems,
  getProspectEquipmentRepairStatusLabel,
  getProspectEquipmentItemByReference,
  updateProspectEquipmentWorkflow,
} from '../../crm/crm-prospect-equipment.store';

export interface ProjectEquipmentOption extends ProspectEquipmentSummary {
  reference: string;
  searchableText: string;
}

@Injectable({
  providedIn: 'root',
})
export class ProjectEquipmentService {
  private readonly optionsChangedSubject = new Subject<void>();
  readonly optionsChanged$ = this.optionsChangedSubject.asObservable();
  private readonly apiCacheTtlMs = 45_000;
  private readonly apiOptionsByReference = new Map<string, ProjectEquipmentOption>();
  private apiCacheLoadedAt = 0;
  private loadingApiCache = false;

  readonly repairStatusOptions = PROJECT_REPAIR_STATUS_OPTIONS;

  constructor(private readonly crmEquipmentApi: CrmEquipmentApiService) {
    void ensureEquipmentCatalogLoaded().then(() => this.optionsChangedSubject.next());
    this.refreshEquipmentOptionsFromApi(true);
  }

  getLocations(): EquipmentLocationRecord[] {
    return getEquipmentLocations().filter((location) => location.active);
  }

  getEquipmentOptions(): ProjectEquipmentOption[] {
    this.refreshEquipmentOptionsFromApi();

    if (this.apiOptionsByReference.size > 0) {
      return Array.from(this.apiOptionsByReference.values());
    }

    return getAllProspectEquipmentItems().map((item) => this.toOption(item));
  }

  getEquipmentByReference(reference: string): ProjectEquipmentOption | null {
    this.refreshEquipmentOptionsFromApi();

    const cached = this.apiOptionsByReference.get(reference);
    if (cached) {
      return cached;
    }

    const parsedReference = this.parseReference(reference);
    if (!parsedReference) {
      return null;
    }

    const match = getProspectEquipmentItemByReference(parsedReference.recordId, parsedReference.itemId);
    return match ? this.toOption(match) : null;
  }

  findEquipmentByIdentifier(identifier: string): ProjectEquipmentOption | null {
    this.refreshEquipmentOptionsFromApi();

    const normalizedIdentifier = this.normalizeSearchValue(identifier);
    if (normalizedIdentifier) {
      const cachedMatch = Array.from(this.apiOptionsByReference.values()).find((item) => {
        const candidates = [item.equipmentCode, item.receivedIdentifier, item.serie, item.customerShipmentReference];
        return candidates.some((value) => this.normalizeSearchValue(value) === normalizedIdentifier);
      });
      if (cachedMatch) {
        return cachedMatch;
      }
    }

    const match = findProspectEquipmentItemByIdentifier(identifier);
    return match ? this.toOption(match) : null;
  }

  updateEquipmentWorkflow(
    reference: string,
    repairStatus: ProspectEquipmentRepairStatus,
    locationId: string,
    updatedBy: string,
  ): ProjectEquipmentOption | null {
    const parsedReference = this.parseReference(reference);
    if (!parsedReference) {
      return null;
    }

    const location = this.getLocations().find((entry) => entry.id === locationId);
    if (!location) {
      return null;
    }

    const updated = updateProspectEquipmentWorkflow({
      recordId: parsedReference.recordId,
      itemId: parsedReference.itemId,
      repairStatus,
      storageLocationId: locationId,
      updatedBy,
    });

    this.syncWorkflowToApi(parsedReference.recordId, parsedReference.itemId, repairStatus, location.id, location.name, updatedBy);
    this.refreshEquipmentOptionsFromApi(true);

    if (updated) {
      return this.toOption(updated);
    }

    const cached = this.apiOptionsByReference.get(reference);
    if (!cached) {
      return null;
    }

    const optimistic: ProjectEquipmentOption = {
      ...cached,
      storageLocationId: location.id,
      storageLocationName: location.name,
      repairStatus,
      repairStatusLabel: this.repairStatusOptions.find((option) => option.id === repairStatus)?.label ?? cached.repairStatusLabel,
      repairStatusUpdatedAt: new Date().toISOString(),
    };

    this.apiOptionsByReference.set(reference, optimistic);
    return optimistic;
  }

  buildReference(summary: Pick<ProspectEquipmentSummary, 'recordId' | 'itemId'>): string {
    return `${summary.recordId}::${summary.itemId}`;
  }

  private toOption(summary: ProspectEquipmentSummary): ProjectEquipmentOption {
    const searchableText = [
      summary.displayName,
      summary.equipmentCode,
      summary.receivedIdentifier,
      summary.serie,
      summary.customerShipmentReference,
      summary.prospectName,
      summary.storageLocationName,
      summary.serviceTypeName,
      summary.failureDescription,
    ]
      .map((value) => String(value ?? '').trim().toLowerCase())
      .filter(Boolean)
      .join(' | ');

    return {
      ...summary,
      reference: this.buildReference(summary),
      searchableText,
    };
  }

  private parseReference(reference: string): { recordId: string; itemId: string } | null {
    const [recordIdRaw, itemIdRaw] = reference.split('::');
    const recordId = recordIdRaw?.trim() ?? '';
    const itemId = itemIdRaw?.trim() ?? '';

    if (!recordId || !itemId) {
      return null;
    }

    return { recordId, itemId };
  }

  private refreshEquipmentOptionsFromApi(force = false): void {
    const now = Date.now();
    if (!force && this.apiCacheLoadedAt > 0 && now - this.apiCacheLoadedAt < this.apiCacheTtlMs) {
      return;
    }

    if (this.loadingApiCache) {
      return;
    }

    this.loadingApiCache = true;
    this.crmEquipmentApi
      .listItems({ includeArchived: false })
      .pipe(take(1))
      .subscribe({
        next: (items) => {
          this.apiOptionsByReference.clear();
          items.forEach((item) => {
            const option = this.toOption(item);
            this.apiOptionsByReference.set(option.reference, option);
          });
          this.apiCacheLoadedAt = Date.now();
          this.loadingApiCache = false;
          this.optionsChangedSubject.next();
        },
        error: () => {
          this.loadingApiCache = false;
        },
      });
  }

  private syncWorkflowToApi(
    recordId: string,
    itemId: string,
    repairStatus: ProspectEquipmentRepairStatus,
    storageLocationId: string,
    storageLocationName: string,
    updatedBy: string,
  ): void {
    this.crmEquipmentApi
      .getRecord(recordId, true)
      .pipe(take(1))
      .subscribe({
        next: (record) => {
          const nextRecord = this.applyItemWorkflowUpdate(record, itemId, repairStatus, storageLocationId, storageLocationName, updatedBy);
          if (!nextRecord) {
            return;
          }

          this.crmEquipmentApi
            .upsertRecord(nextRecord)
            .pipe(take(1))
            .subscribe({
              next: (savedRecord) => {
                this.upsertApiCacheFromRecord(savedRecord);
                this.apiCacheLoadedAt = Date.now();
              },
              error: () => {
                // Keep local fallback when API sync fails.
              },
            });
        },
        error: () => {
          // Keep local fallback when API is not available.
        },
      });
  }

  private applyItemWorkflowUpdate(
    record: ProspectEquipmentRecord,
    itemId: string,
    repairStatus: ProspectEquipmentRepairStatus,
    storageLocationId: string,
    storageLocationName: string,
    updatedBy: string,
  ): ProspectEquipmentRecord | null {
    let updated = false;
    const updatedAt = new Date().toISOString();

    const nextItems = (record.items ?? []).map((item) => {
      if (item.id !== itemId) {
        return item;
      }

      updated = true;
      return {
        ...item,
        repairStatus,
        repairStatusUpdatedAt: updatedAt,
        repairStatusUpdatedBy: updatedBy || 'asignado',
        storageLocationId,
        storageLocationName,
      } satisfies ProspectEquipmentItem;
    });

    if (!updated) {
      return null;
    }

    return {
      ...record,
      items: nextItems,
      updatedAt,
    };
  }

  private upsertApiCacheFromRecord(record: ProspectEquipmentRecord): void {
    const receptionLabel = formatProspectEquipmentReception(record);

    (record.items ?? []).forEach((item) => {
      const repairStatus = item.repairStatus ?? 'recibido';
      const summary: ProspectEquipmentSummary = {
        recordId: record.id,
        itemId: item.id,
        equipmentCode: resolveEquipmentCode(item),
        prospectId: record.prospectId,
        prospectName: record.prospectName,
        receptionLabel,
        serviceTypeName: item.serviceTypeName ?? '',
        storageLocationId: item.storageLocationId ?? '',
        storageLocationName: item.storageLocationName ?? '',
        familyName: item.familyName ?? '',
        marca: item.marca ?? '',
        tipo: item.tipo ?? '',
        serie: item.serie ?? '',
        receivedIdentifier: item.receivedIdentifier ?? '',
        customerShipmentReference: item.customerShipmentReference ?? '',
        accessories: item.accessories ?? '',
        borrowedEquipments: [...(item.borrowedEquipments ?? [])],
        failureDescription: item.failureDescription ?? '',
        evidenceCount: item.evidencePhotos?.length ?? 0,
        displayName: [item.familyName, item.marca, item.tipo, item.serie].map((value) => String(value ?? '').trim()).filter(Boolean).join(' · ') || 'Equipo',
        repairStatus,
        repairStatusLabel: getProspectEquipmentRepairStatusLabel(repairStatus),
        repairStatusUpdatedAt: item.repairStatusUpdatedAt ?? '',
        priorityBilling: Boolean(item.priorityBilling),
      };

      const option = this.toOption(summary);
      this.apiOptionsByReference.set(option.reference, option);
    });
  }

  private normalizeSearchValue(value: unknown): string {
    return String(value ?? '').trim().toLowerCase();
  }
}
