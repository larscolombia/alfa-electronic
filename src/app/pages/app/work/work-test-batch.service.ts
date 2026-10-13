import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import {
  WorkTestBatch,
  WorkTestBatchState,
  WorkTestFlowRule,
  WorkTestQuestion,
  WorkTestQuestionOption,
  WorkTestTransitionPrompt,
} from './work-test-batch.models';

@Injectable({
  providedIn: 'root',
})
export class WorkTestBatchService {
  private readonly storageKey = 'lars.work.test-batches.v2';
  private readonly stateSubject = new BehaviorSubject<WorkTestBatchState>(this.restoreState());

  readonly state$ = this.stateSubject.asObservable();

  getSnapshot(): WorkTestBatchState {
    return this.cloneState(this.stateSubject.value);
  }

  upsertBatch(batch: Omit<WorkTestBatch, 'id' | 'updatedAt'> & { id?: string }): WorkTestBatch {
    const draft = this.cloneState(this.stateSubject.value);
    const nextBatch: WorkTestBatch = {
      id: batch.id?.trim() || this.buildId('batch'),
      name: batch.name.trim(),
      description: batch.description.trim(),
      active: Boolean(batch.active),
      questions: batch.questions.map((question) => this.normalizeQuestion(question)),
      updatedAt: new Date().toISOString(),
    };

    draft.batches = [nextBatch, ...draft.batches.filter((item) => item.id !== nextBatch.id)]
      .sort((left, right) => left.name.localeCompare(right.name));
    this.commit(draft);
    return nextBatch;
  }

  deleteBatch(batchId: string): void {
    const draft = this.cloneState(this.stateSubject.value);
    draft.batches = draft.batches.filter((batch) => batch.id !== batchId);
    draft.flowRules = draft.flowRules.map((rule) => ({
      ...rule,
      batchIds: rule.batchIds.filter((id) => id !== batchId),
      updatedAt: new Date().toISOString(),
    }));
    this.commit(draft);
  }

  upsertFlowRule(rule: Omit<WorkTestFlowRule, 'id' | 'updatedAt'> & { id?: string }): WorkTestFlowRule {
    const draft = this.cloneState(this.stateSubject.value);
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

    draft.flowRules = [nextRule, ...draft.flowRules.filter((item) => item.id !== nextRule.id)]
      .sort((left, right) => left.name.localeCompare(right.name));
    this.commit(draft);
    return nextRule;
  }

  deleteFlowRule(ruleId: string): void {
    const draft = this.cloneState(this.stateSubject.value);
    draft.flowRules = draft.flowRules.filter((rule) => rule.id !== ruleId);
    this.commit(draft);
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

  private restoreState(): WorkTestBatchState {
    const fallback = this.seedState();
    if (typeof window === 'undefined') {
      return fallback;
    }

    const raw = window.localStorage.getItem(this.storageKey);
    if (!raw) {
      return fallback;
    }

    try {
      const parsed = JSON.parse(raw) as Partial<WorkTestBatchState>;
      const batches = Array.isArray(parsed.batches) ? parsed.batches.map((batch) => this.normalizeBatch(batch)) : fallback.batches;
      const flowRules = Array.isArray(parsed.flowRules) ? parsed.flowRules.map((rule) => this.normalizeFlowRule(rule)) : fallback.flowRules;

      return { batches, flowRules };
    } catch {
      return fallback;
    }
  }

  private commit(state: WorkTestBatchState): void {
    const snapshot = this.cloneState(state);
    this.stateSubject.next(snapshot);

    if (typeof window !== 'undefined') {
      window.localStorage.setItem(this.storageKey, JSON.stringify(snapshot));
    }
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
          id: 'batch-reparacion-pruebas',
          name: 'Lote reparacion -> pruebas',
          description: 'Checklist previo a enviar el equipo al lote de pruebas o QA final.',
          active: true,
          updatedAt: '2026-04-19T09:05:00.000Z',
          questions: [
            {
              id: 'rep-ajustes',
              label: 'Se registraron ajustes, cambios y piezas reemplazadas en el memo?',
              type: 'boolean',
              required: true,
              helperText: 'El memo tecnico debe quedar listo antes de pasar a pruebas.',
            },
            {
              id: 'rep-tipo-prueba',
              label: 'Que modalidad de prueba requiere el lote?',
              type: 'single-select',
              required: true,
              helperText: 'Selecciona el tipo de prueba que espera QA.',
              options: [
                { id: 'banco-pruebas', label: 'Banco de pruebas' },
                { id: 'laboratorio', label: 'Laboratorio parcial' },
                { id: 'multimetro-scan', label: 'Multimetro / scan' },
              ],
            },
            {
              id: 'rep-observaciones',
              label: 'Observaciones para QA o lote de pruebas',
              type: 'text',
              required: false,
              helperText: 'Notas especificas para pruebas funcionales, banco o validacion final.',
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
          id: 'flow-reparacion-pruebas',
          name: 'Paso reparacion a pruebas',
          fromStatusId: 'reparacion',
          toStatusId: 'pruebas',
          batchIds: ['batch-reparacion-pruebas'],
          requiredToContinue: true,
          triggerMode: 'always',
          active: true,
          updatedAt: '2026-04-19T09:20:00.000Z',
        },
        {
          id: 'flow-pruebas-listo',
          name: 'Cierre con informe de intervencion',
          fromStatusId: 'pruebas',
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