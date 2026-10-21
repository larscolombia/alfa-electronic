import { Injectable, inject } from "@angular/core";
import { firstValueFrom } from "rxjs";

import { CrmEquipmentApiService } from "./crm-equipment-api.service";

/**
 * Fuente única de "personas de RRHH" para todos los selects de responsable /
 * técnico / jefe del sistema.
 *
 * Antes cada formulario resolvía esto por su cuenta y mal: el RESPONSABLE de la
 * ficha de proyecto y el catálogo de jefes del perfil eran arrays hardcodeados
 * ("Juan Pérez", "Steven Jobs"…), y otros caían en esos mismos nombres como
 * fallback cuando RRHH venía vacío. Eso ocultaba el problema real (no había
 * empleados activos) y permitía asignar trabajo a gente que no existe.
 *
 * Reutiliza GET /api/v1/crm-equipment/technicians, que ya devuelve los
 * empleados ACTIVOS de hr_employees (soft_delete=false y status='Activo') y ya
 * está abierto a cualquier rol autenticado — el mismo dato que consumen el modal
 * de recepción y "Asignar técnico", así que no se agrega un segundo endpoint ni
 * una segunda superficie de ACL. La deuda pendiente es de nombre: cuando exista
 * un GET /hr/people con esta misma proyección, este servicio debe apuntar ahí.
 *
 * Regla dura: si RRHH no tiene empleados activos, las opciones quedan VACÍAS.
 * Nunca se rellenan con nombres inventados.
 */
@Injectable({ providedIn: "root" })
export class HrPeoplePickerService {
    private readonly crmEquipmentApi = inject(CrmEquipmentApiService);

    private cache: string[] | null = null;
    private loading: Promise<string[]> | null = null;

    /** Nombres de empleados activos, ordenados y sin duplicados. */
    names(): Promise<string[]> {
        if (this.cache) {
            return Promise.resolve(this.cache);
        }
        return this.refresh();
    }

    /** Fuerza una recarga (botones "Actualizar lista", o tras crear un empleado). */
    refresh(): Promise<string[]> {
        if (this.loading) {
            return this.loading;
        }

        this.loading = firstValueFrom(this.crmEquipmentApi.listTechnicians())
            .then((people) => {
                const names = Array.from(
                    new Set(people.map((person) => person.name.trim()).filter((name) => name.length > 0)),
                ).sort((left, right) => left.localeCompare(right, "es"));
                this.cache = names;
                return names;
            })
            .catch(() => {
                // Sin RRHH activo el picker queda vacío a propósito: un fallback de
                // nombres demo es justamente el bug que este servicio viene a matar.
                this.cache = [];
                return [] as string[];
            })
            .finally(() => {
                this.loading = null;
            });

        return this.loading;
    }

    /**
     * Opciones para un select: empleados activos MÁS el valor ya guardado y los
     * extras que pase el llamador. El valor guardado se incluye siempre porque
     * hay registros históricos asignados a personas que hoy están inactivas o
     * borradas, y un select que no lo contenga lo pintaría en blanco.
     */
    optionsFor(current?: string | null, extra: Array<string | null | undefined> = []): Promise<string[]> {
        return this.names().then((names) => this.merge(names, current, extra));
    }

    /** Versión síncrona sobre la caché, para getters de plantilla tras la carga. */
    merge(names: string[], current?: string | null, extra: Array<string | null | undefined> = []): string[] {
        const merged = new Set(names);
        for (const value of [...extra, current]) {
            const trimmed = String(value ?? "").trim();
            if (trimmed) {
                merged.add(trimmed);
            }
        }
        return Array.from(merged);
    }
}
