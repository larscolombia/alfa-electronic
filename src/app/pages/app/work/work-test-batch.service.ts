import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, catchError, filter, firstValueFrom, throwError } from 'rxjs';
import { AuthService } from '../../../services/auth.service';
import { WorktimeApiService } from '../../../services/worktime-api.service';
import {
  WorkTestBatch,
  WorkTestBatchState,
  WorkTestFlowRule,
  WorkTestQuestion,
  WorkTestQuestionOption,
  WorkTestTransitionPrompt,
} from './work-test-batch.models';

// Fase 4: los lotes de pruebas funcionales y sus reglas de flujo viven en el
// servidor (backend internal/worktime). El localStorage['lars.work.test-batches.v2']
// solo se lee UNA vez para migrar lo que el usuario ya tuviera y se borra
// unicamente si la migracion termino sin errores; si falla se conserva y se
// reintenta en el proximo arranque con el error visible (lastError$). Ya no se
// hace setItem de datos de negocio.
//
// La API publica sigue siendo sincrona (state$, getSnapshot, upsertBatch,
// getTransitionPrompt) porque sus consumidores (work-test-batches.component y
// el kanban) la usan en caliente: las mutaciones son optimistas sobre la cache
// y se revierten si el servidor falla.
@Injectable({
  providedIn: 'root',
})
export class WorkTestBatchService {
  private readonly legacyStorageKey = 'lars.work.test-batches.v2';

  private readonly api = inject(WorktimeApiService);
  private readonly auth = inject(AuthService);
  private readonly stateSubject = new BehaviorSubject<WorkTestBatchState>({ batches: [], flowRules: [] });

  readonly state$ = this.stateSubject.asObservable();

  private readonly lastErrorSubject = new BehaviorSubject<string | null>(null);
  /** Ultimo error de sincronizacion con el servidor (null si todo fue bien). */
  readonly lastError$: Observable<string | null> = this.lastErrorSubject.asObservable();

  private initializationStarted = false;

  constructor() {
    void this.initialize();

    // El servicio puede instanciarse antes del login (la SPA no recarga la
    // pagina al autenticarse): cuando aparece una sesion se reintenta la carga
    // del servidor y la migracion unica desde localStorage.
    this.auth.session$
      .pipe(filter((session): session is NonNullable<typeof session> => session !== null))
      .subscribe(() => void this.initialize());
  }

  getSnapshot(): WorkTestBatchState {
    return this.cloneState(this.stateSubject.value);
  }

  upsertBatch(batch: Omit<WorkTestBatch, 'id' | 'updatedAt'> & { id?: string }): WorkTestBatch {
    const previous = this.cloneState(this.stateSubject.value);
    const nextBatch: WorkTestBatch = {
      id: batch.id?.trim() || this.buildId('batch'),
      name: batch.name.trim(),
      description: batch.description.trim(),
      active: Boolean(batch.active),
      questions: batch.questions.map((question) => this.normalizeQuestion(question)),
      updatedAt: new Date().toISOString(),
    };

    const draft = this.cloneState(previous);
    draft.batches = [nextBatch, ...draft.batches.filter((item) => item.id !== nextBatch.id)]
      .sort((left, right) => left.name.localeCompare(right.name));
    this.commit(draft);

    this.api.upsertTestBatch(nextBatch).pipe(
      catchError((error) => {
        // Sin fallback silencioso: se revierte la cache y el error queda
        // expuesto en lastError$.
        this.commit(previous);
        this.lastErrorSubject.next(`No se pudo guardar el grupo de preguntas en el servidor: ${this.errorMessage(error)}`);
        return throwError(() => error);
      }),
    ).subscribe({
      next: (saved) => {
        this.lastErrorSubject.next(null);
        const current = this.cloneState(this.stateSubject.value);
        current.batches = current.batches.map((item) => (item.id === saved.id ? this.normalizeBatch(saved) : item));
        this.commit(current);
      },
      error: () => { /* ya revertido en catchError */ },
    });

    return nextBatch;
  }

  deleteBatch(batchId: string): void {
    const previous = this.cloneState(this.stateSubject.value);
    const draft = this.cloneState(previous);
    draft.batches = draft.batches.filter((batch) => batch.id !== batchId);
    draft.flowRules = draft.flowRules.map((rule) => ({
      ...rule,
      batchIds: rule.batchIds.filter((id) => id !== batchId),
      updatedAt: new Date().toISOString(),
    }));
    this.commit(draft);

    this.api.deleteTestBatch(batchId).pipe(
      catchError((error) => {
        this.commit(previous);
        this.lastErrorSubject.next(`No se pudo eliminar el grupo de preguntas del servidor: ${this.errorMessage(error)}`);
        return throwError(() => error);
      }),
    ).subscribe({
      next: () => this.lastErrorSubject.next(null),
      error: () => { /* ya revertido en catchError */ },
    });
  }

  upsertFlowRule(rule: Omit<WorkTestFlowRule, 'id' | 'updatedAt'> & { id?: string }): WorkTestFlowRule {
    const previous = this.cloneState(this.stateSubject.value);
    const nextRule: WorkTestFlowRule = {
      id: rule.id?.trim() || this.buildId('flow'),
      name: rule.name.trim(),
      fromStatusId: rule.fromStatusId.trim(),
      toStatusId: rule.toStatusId.trim(),
      batchIds: [...new Set(rule.batchIds.map((id) => id.trim()).filter(Boolean))],
      requiredToContinue: Boolean(rule.requiredToContinue),
      triggerMode: rule.triggerMode,
      active: Boolean(rule.active),
      updatedAt: new Date().toISOString(),
    };

    const draft = this.cloneState(previous);
    draft.flowRules = [nextRule, ...draft.flowRules.filter((item) => item.id !== nextRule.id)]
      .sort((left, right) => left.name.localeCompare(right.name));
    this.commit(draft);

    this.api.upsertFlowRule(nextRule).pipe(
      catchError((error) => {
        this.commit(previous);
        this.lastErrorSubject.next(`No se pudo guardar el flujo en el servidor: ${this.errorMessage(error)}`);
        return throwError(() => error);
      }),
    ).subscribe({
      next: (saved) => {
        this.lastErrorSubject.next(null);
        const current = this.cloneState(this.stateSubject.value);
        current.flowRules = current.flowRules.map((item) => (item.id === saved.id ? this.normalizeFlowRule(saved) : item));
        this.commit(current);
      },
      error: () => { /* ya revertido en catchError */ },
    });

    return nextRule;
  }

  deleteFlowRule(ruleId: string): void {
    const previous = this.cloneState(this.stateSubject.value);
    const draft = this.cloneState(previous);
    draft.flowRules = draft.flowRules.filter((rule) => rule.id !== ruleId);
    this.commit(draft);

    this.api.deleteFlowRule(ruleId).pipe(
      catchError((error) => {
        this.commit(previous);
        this.lastErrorSubject.next(`No se pudo eliminar el flujo del servidor: ${this.errorMessage(error)}`);
        return throwError(() => error);
      }),
    ).subscribe({
      next: () => this.lastErrorSubject.next(null),
      error: () => { /* ya revertido en catchError */ },
    });
  }

  getTransitionPrompt(fromStatusId: string, toStatusId: string, priority: string): WorkTestTransitionPrompt | null {
    const state = this.stateSubject.value;
    const normalizedPriority = String(priority ?? '').trim().toLowerCase();

    const rules = state.flowRules.filter((rule) => {
      if (!rule.active || rule.fromStatusId !== fromStatusId || rule.toStatusId !== toStatusId || !rule.batchIds.length) {
        return false;
      }

      if (rule.triggerMode === 'only-high-priority') {
        return normalizedPriority === 'high' || normalizedPriority === 'critical';
      }

      return true;
    });

    if (!rules.length) {
      return null;
    }

    const allowedBatchIds = new Set(rules.flatMap((rule) => rule.batchIds));
    const batches = state.batches.filter((batch) => batch.active && allowedBatchIds.has(batch.id) && batch.questions.length > 0);

    if (!batches.length) {
      return null;
    }

    return {
      fromStatusId,
      toStatusId,
      rules: rules.map((rule) => ({ ...rule, batchIds: [...rule.batchIds] })),
      batches: batches.map((batch) => ({
        ...batch,
        questions: batch.questions.map((question) => ({
          ...question,
          options: question.options?.map((option) => ({ ...option })) ?? [],
        })),
      })),
    };
  }

  // ── Carga inicial y migracion unica ────────────────────────────────────────

  private async initialize(): Promise<void> {
    if (this.initializationStarted) {
      return;
    }
    this.initializationStarted = true;

    if (!this.api.isAuthenticated()) {
      // Sin sesion no hay servidor; se reintenta en la primera mutacion o al
      // recargar la pagina ya autenticado.
      this.initializationStarted = false;
      return;
    }

    const legacy = this.readLegacyState();

    try {
      const remote = await firstValueFrom(this.api.getTestBatchState());
      const remoteState: WorkTestBatchState = {
        batches: (remote.batches ?? []).map((batch) => this.normalizeBatch(batch)),
        flowRules: (remote.flowRules ?? []).map((rule) => this.normalizeFlowRule(rule)),
      };

      if (legacy) {
        await this.migrateLegacyState(legacy, remoteState);
        return;
      }

      if (remoteState.batches.length === 0 && remoteState.flowRules.length === 0) {
        // Empresa nueva en el servidor: se siembran los lotes y flujos por
        // defecto (antes los sembraba el navegador en cada perfil nuevo).
        await this.seedServerState();
        return;
      }

      this.commit(remoteState);
      this.lastErrorSubject.next(null);
    } catch (error) {
      this.lastErrorSubject.next(`No se pudieron cargar los lotes de prueba del servidor: ${this.errorMessage(error)}`);
      this.initializationStarted = false;
    }
  }

  /**
   * Migracion unica de 'lars.work.test-batches.v2': sube solo lo que no exista
   * en el servidor (por id) y borra la clave SOLO si todo salio bien. Si algo
   * falla, la clave se conserva y se reintenta en el proximo arranque.
   */
  private async migrateLegacyState(legacy: WorkTestBatchState, remote: WorkTestBatchState): Promise<void> {
    const failures: string[] = [];
    const remoteBatchIds = new Set(remote.batches.map((batch) => batch.id));
    const remoteRuleIds = new Set(remote.flowRules.map((rule) => rule.id));

    const merged: WorkTestBatchState = {
      batches: [...remote.batches],
      flowRules: [...remote.flowRules],
    };

    for (const batch of legacy.batches) {
      if (remoteBatchIds.has(batch.id)) {
        continue;
      }
      try {
        const saved = await firstValueFrom(this.api.upsertTestBatch(batch));
        merged.batches.push(this.normalizeBatch(saved));
      } catch (error) {
        failures.push(`grupo ${batch.id}: ${this.errorMessage(error)}`);
      }
    }

    for (const rule of legacy.flowRules) {
      if (remoteRuleIds.has(rule.id)) {
        continue;
      }
      try {
        const saved = await firstValueFrom(this.api.upsertFlowRule(rule));
        merged.flowRules.push(this.normalizeFlowRule(saved));
      } catch (error) {
        failures.push(`flujo ${rule.id}: ${this.errorMessage(error)}`);
      }
    }

    if (failures.length > 0) {
      // La clave SE CONSERVA: se reintenta en el proximo arranque.
      this.lastErrorSubject.next(
        `La migracion de tus lotes de prueba locales fallo y se reintentara mas tarde. Detalles: ${failures.join(' | ')}`,
      );
      this.commit(merged);
      this.initializationStarted = false;
      return;
    }

    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(this.legacyStorageKey);
    }
    this.lastErrorSubject.next(null);
    this.commit(merged);
  }

  private async seedServerState(): Promise<void> {
    const seed = this.seedState();
    const failures: string[] = [];

    for (const batch of seed.batches) {
      try {
        await firstValueFrom(this.api.upsertTestBatch(batch));
      } catch (error) {
        failures.push(`grupo ${batch.id}: ${this.errorMessage(error)}`);
      }
    }
    for (const rule of seed.flowRules) {
      try {
        await firstValueFrom(this.api.upsertFlowRule(rule));
      } catch (error) {
        failures.push(`flujo ${rule.id}: ${this.errorMessage(error)}`);
      }
    }

    if (failures.length > 0) {
      this.lastErrorSubject.next(`No se pudieron sembrar los lotes de prueba por defecto: ${failures.join(' | ')}`);
      this.initializationStarted = false;
      return;
    }

    try {
      const remote = await firstValueFrom(this.api.getTestBatchState());
      this.commit({
        batches: (remote.batches ?? []).map((batch) => this.normalizeBatch(batch)),
        flowRules: (remote.flowRules ?? []).map((rule) => this.normalizeFlowRule(rule)),
      });
      this.lastErrorSubject.next(null);
    } catch (error) {
      this.commit(seed);
      this.lastErrorSubject.next(`No se pudieron recargar los lotes de prueba: ${this.errorMessage(error)}`);
    }
  }

  private readLegacyState(): WorkTestBatchState | null {
    if (typeof window === 'undefined') {
      return null;
    }

    const raw = window.localStorage.getItem(this.legacyStorageKey);
    if (!raw) {
      return null;
    }

    try {
      const parsed = JSON.parse(raw) as Partial<WorkTestBatchState>;
      const batches = Array.isArray(parsed.batches) ? parsed.batches.map((batch) => this.normalizeBatch(batch)) : [];
      const flowRules = Array.isArray(parsed.flowRules) ? parsed.flowRules.map((rule) => this.normalizeFlowRule(rule)) : [];

      if (batches.length === 0 && flowRules.length === 0) {
        // Clave vacia/corrupta: no hay nada rescatable.
        window.localStorage.removeItem(this.legacyStorageKey);
        return null;
      }
      return { batches, flowRules };
    } catch {
      window.localStorage.removeItem(this.legacyStorageKey);
      return null;
    }
  }

  private commit(state: WorkTestBatchState): void {
    this.stateSubject.next(this.cloneState(state));
  }

  private errorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
  }

  private cloneState(state: WorkTestBatchState): WorkTestBatchState {
    return {
      batches: state.batches.map((batch) => ({
        ...batch,
        questions: batch.questions.map((question) => ({
          ...question,
          options: question.options?.map((option) => ({ ...option })) ?? [],
        })),
      })),
      flowRules: state.flowRules.map((rule) => ({
        ...rule,
        batchIds: [...rule.batchIds],
      })),
    };
  }

  private seedState(): WorkTestBatchState {
    return {
      batches: [
        {
          id: 'batch-diagnostico-reparacion',
          name: 'Lote diagnostico -> reparacion',
          description: 'Confirma que el diagnostico ya dejo claro que repuestos se necesitan y la reparabilidad esperada.',
          active: true,
          updatedAt: '2026-04-19T09:00:00.000Z',
          questions: [
            {
              id: 'diag-energiza',
              label: 'El equipo energiza o responde a la prueba base?',
              type: 'boolean',
              required: true,
              helperText: 'Marca si el equipo al menos energiza o muestra respuesta minima.',
            },
            {
              id: 'diag-repuestos',
              label: 'Que repuestos o referencias quedaron identificados?',
              type: 'text',
              required: true,
              helperText: 'Lista referencias, proveedores o modulos a pedir.',
            },
            {
              id: 'diag-reparabilidad',
              label: 'Porcentaje estimado de reparabilidad',
              type: 'number',
              required: true,
              helperText: 'Usa un valor de 0 a 100.',
            },
          ],
        },
        {
          id: 'batch-informe-intervencion',
          name: 'Informe de intervencion',
          description: 'Reporte estructurado de la intervencion tecnica para compartir con el cliente al cierre.',
          active: true,
          updatedAt: '2026-04-19T09:10:00.000Z',
          questions: [
            {
              id: 'inf-ubicacion-falla',
              label: 'Ubicacion de la falla',
              type: 'single-select',
              required: true,
              helperText: 'Selecciona el area o subsistema donde se ubico la falla principal.',
              options: [
                { id: 'entrada-potencia', label: 'Entrada de potencia' },
                { id: 'salida-potencia', label: 'Salida de potencia' },
                { id: 'control', label: 'Control' },
                { id: 'comunicacion', label: 'Comunicacion' },
                { id: 'interfaz-usuario', label: 'Interfaz de usuario' },
                { id: 'mecanico', label: 'Mecanico' },
                { id: 'software-firmware', label: 'Software / firmware' },
                { id: 'otro', label: 'Otro' },
              ],
            },
            {
              id: 'inf-causa-probable',
              label: 'Causa probable',
              type: 'single-select',
              required: true,
              helperText: 'Selecciona la causa mas probable de la falla.',
              options: [
                { id: 'sobrecarga', label: 'Sobrecarga' },
                { id: 'sobretension', label: 'Sobretension' },
                { id: 'envejecimiento', label: 'Envejecimiento' },
                { id: 'contaminacion', label: 'Contaminacion' },
                { id: 'dano-externo', label: 'Dano externo' },
                { id: 'diseno', label: 'Defecto de diseno' },
                { id: 'desgaste-normal', label: 'Desgaste normal' },
                { id: 'otro', label: 'Otro' },
              ],
            },
            {
              id: 'inf-pruebas-realizadas',
              label: 'Pruebas realizadas',
              type: 'single-select',
              required: true,
              helperText: 'Tipo de pruebas que se realizaron al equipo.',
              options: [
                { id: 'banco-pruebas', label: 'Sobre banco de prueba' },
                { id: 'laboratorio-parcial', label: 'Pruebas parciales en laboratorio' },
                { id: 'verificar-sitio', label: 'A verificar en sitio' },
                { id: 'sin-pruebas', label: 'Sin pruebas funcionales' },
              ],
            },
            {
              id: 'inf-comentarios-cliente',
              label: 'Comentarios para el cliente',
              type: 'text',
              required: true,
              helperText: 'Resumen de la intervencion para compartir con el cliente. Evita detalles tecnicos internos.',
            },
          ],
        },
      ],
      flowRules: [
        {
          id: 'flow-diagnostico-reparacion',
          name: 'Paso diagnostico a reparacion',
          fromStatusId: 'diagnostico',
          toStatusId: 'reparacion',
          batchIds: ['batch-diagnostico-reparacion'],
          requiredToContinue: true,
          triggerMode: 'always',
          active: true,
          updatedAt: '2026-04-19T09:15:00.000Z',
        },
        {
          id: 'flow-pruebas-listo',
          name: 'Cierre con informe de intervencion',
          fromStatusId: 'reparacion',
          toStatusId: 'listo-entrega',
          batchIds: ['batch-informe-intervencion'],
          requiredToContinue: true,
          triggerMode: 'always',
          active: true,
          updatedAt: '2026-04-19T09:25:00.000Z',
        },
      ],
    };
  }

  private normalizeBatch(batch: Partial<WorkTestBatch>): WorkTestBatch {
    return {
      id: String(batch.id ?? this.buildId('batch')).trim(),
      name: String(batch.name ?? '').trim(),
      description: String(batch.description ?? '').trim(),
      active: Boolean(batch.active),
      questions: Array.isArray(batch.questions) ? batch.questions.map((question) => this.normalizeQuestion(question)) : [],
      updatedAt: String(batch.updatedAt ?? new Date().toISOString()).trim(),
    };
  }

  private normalizeQuestion(question: Partial<WorkTestQuestion>): WorkTestQuestion {
    return {
      id: String(question.id ?? this.buildId('question')).trim(),
      label: String(question.label ?? '').trim(),
      type: this.normalizeQuestionType(question.type),
      required: Boolean(question.required),
      helperText: String(question.helperText ?? '').trim(),
      options: Array.isArray(question.options) ? question.options.map((option) => this.normalizeOption(option)) : [],
    };
  }

  private normalizeOption(option: Partial<WorkTestQuestionOption>): WorkTestQuestionOption {
    return {
      id: String(option.id ?? this.buildId('option')).trim(),
      label: String(option.label ?? '').trim(),
    };
  }

  private normalizeFlowRule(rule: Partial<WorkTestFlowRule>): WorkTestFlowRule {
    return {
      id: String(rule.id ?? this.buildId('flow')).trim(),
      name: String(rule.name ?? '').trim(),
      fromStatusId: String(rule.fromStatusId ?? '').trim(),
      toStatusId: String(rule.toStatusId ?? '').trim(),
      batchIds: Array.isArray(rule.batchIds) ? rule.batchIds.map((id) => String(id).trim()).filter(Boolean) : [],
      requiredToContinue: Boolean(rule.requiredToContinue),
      triggerMode: rule.triggerMode === 'only-high-priority' ? 'only-high-priority' : 'always',
      active: Boolean(rule.active),
      updatedAt: String(rule.updatedAt ?? new Date().toISOString()).trim(),
    };
  }

  private normalizeQuestionType(value: unknown): WorkTestQuestion['type'] {
    switch (String(value ?? '').trim()) {
      case 'boolean':
        return 'boolean';
      case 'number':
        return 'number';
      case 'single-select':
        return 'single-select';
      default:
        return 'text';
    }
  }

  private buildId(prefix: string): string {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }
}
