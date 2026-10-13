import { BoardColumn } from './models';

/**
 * Pure SLA semaphore logic for the technical board.
 *
 * The backend exposes the config as a list of per-stage day thresholds
 * (`GET/PUT /api/v1/projects/sla-config`); these helpers translate that
 * payload to/from board columns without mutating inputs.
 */

export interface SlaDays {
  greenDays: number;
  yellowDays: number;
}

/**
 * Config accepted by applySlaConfigToColumns: a global threshold and/or
 * per-column overrides keyed by column id.
 */
export interface SlaConfigInput {
  greenDays?: number;
  yellowDays?: number;
  columns?: Record<string, Partial<SlaDays>>;
}

/** Item shape of the backend sla-config API. */
export interface SlaConfigApiItem {
  stage: string;
  greenDays: number;
  yellowDays: number;
}

function normalizeSlaDays(value: unknown): number | null {
  const numeric = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(numeric)) {
    return null;
  }

  return Math.max(0, Math.round(numeric));
}

/**
 * Returns new columns with the SLA days applied, without mutating the input.
 * Only columns with trackAging enabled receive thresholds (columns without
 * trackAging stay untouched). Per-column config wins over the global one.
 */
export function applySlaConfigToColumns(columns: BoardColumn[], config: SlaConfigInput | null | undefined): BoardColumn[] {
  const globalGreen = normalizeSlaDays(config?.greenDays);
  const globalYellow = normalizeSlaDays(config?.yellowDays);
  const perColumn = config?.columns ?? {};
  const hasGlobal = globalGreen !== null || globalYellow !== null;
  const hasPerColumn = Object.keys(perColumn).length > 0;

  if (!hasGlobal && !hasPerColumn) {
    return columns.slice();
  }

  return columns.map((column) => {
    if (!column.trackAging) {
      return column;
    }

    const override = perColumn[column.id] ?? {};
    const overrideGreen = normalizeSlaDays(override.greenDays);
    const overrideYellow = normalizeSlaDays(override.yellowDays);
    const nextGreen = overrideGreen ?? globalGreen;
    const nextYellow = overrideYellow ?? globalYellow;

    if (nextGreen === null && nextYellow === null) {
      return column;
    }

    return {
      ...column,
      greenDays: nextGreen ?? column.greenDays ?? 0,
      yellowDays: nextYellow ?? column.yellowDays ?? 0,
    };
  });
}

/**
 * Converts the backend API payload (list per stage) into the per-column
 * config shape understood by applySlaConfigToColumns.
 */
export function slaConfigFromApiPayload(items: SlaConfigApiItem[] | null | undefined): SlaConfigInput {
  const columns: Record<string, SlaDays> = {};

  for (const item of items ?? []) {
    const stage = String(item?.stage ?? '').trim();
    const greenDays = normalizeSlaDays(item?.greenDays);
    const yellowDays = normalizeSlaDays(item?.yellowDays);

    if (!stage || greenDays === null || yellowDays === null) {
      continue;
    }

    columns[stage] = { greenDays, yellowDays };
  }

  return { columns };
}

/**
 * Builds the backend API payload from the current board columns; only
 * columns with trackAging participate in the SLA semaphore.
 */
export function buildSlaConfigApiPayload(columns: BoardColumn[]): SlaConfigApiItem[] {
  return columns
    .filter((column) => column.trackAging)
    .map((column) => ({
      stage: column.id,
      greenDays: normalizeSlaDays(column.greenDays) ?? 0,
      yellowDays: normalizeSlaDays(column.yellowDays) ?? 0,
    }));
}
