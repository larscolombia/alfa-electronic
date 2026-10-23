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

    // Caché por contexto: 'tecnica' y 'comercial' devuelven listados distintos
    // del backend (filtro de rol/departamento). El contexto vacío es el bucket
    // de "todos los activos", compatible con llamadores que no pasen contexto.
    private readonly caches = new Map<string, string[]>();
    private readonly loadingByContext = new Map<string, Promise<string[]>>();

    /** Nombres de empleados activos del contexto (por defecto: todos), ordenados y sin duplicados. */
    names(context = ""): Promise<string[]> {
        const key = this.contextKey(context);
        if (this.caches.has(key)) {
            return Promise.resolve(this.caches.get(key) ?? []);
        }
        return this.refresh(context);
    }

    /** Fuerza una recarga del contexto (botones "Actualizar lista", o tras crear un empleado). */
    refresh(context = ""): Promise<string[]> {
        const key = this.contextKey(context);
        if (this.loadingByContext.has(key)) {
            return this.loadingByContext.get(key) as Promise<string[]>;
        }

        const pending = firstValueFrom(this.crmEquipmentApi.listTechnicians({ context: key || undefined }))
            .then((people) => {
                const names = Array.from(
                    new Set(people.map((person) => person.name.trim()).filter((name) => name.length > 0)),
                ).sort((left, right) => left.localeCompare(right, "es"));
                this.caches.set(key, names);
                return names;
            })
            .catch(() => {
                // Sin RRHH activo (o sin empleados del rol relevante en el contexto)
                // el picker queda vacío a propósito: un fallback de nombres demo es
                // justamente el bug que este servicio viene a matar. Si el select sale
                // vacío, la respuesta correcta es crear al empleado con ese rol en RRHH,
                // no inventarlo aquí.
                this.caches.set(key, []);
                return [] as string[];
            })
            .finally(() => {
                this.loadingByContext.delete(key);
            });

        this.loadingByContext.set(key, pending);
        return pending;
    }

    /**
     * Opciones para un select: empleados activos del contexto MÁS el valor ya
     * guardado y los extras que pase el llamador. El valor guardado se incluye
     * siempre porque hay registros históricos asignados a personas que hoy están
     * inactivas, borradas o de otro rol, y un select que no lo contenga lo
     * pintaría en blanco.
     */
    optionsFor(current?: string | null, extra: Array<string | null | undefined> = [], context = ""): Promise<string[]> {
        return this.names(context).then((names) => this.merge(names, current, extra));
    }

    private contextKey(context: string): string {
        return String(context ?? "").trim().toLowerCase();
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
