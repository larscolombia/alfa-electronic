import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const reception = readFileSync('src/app/pages/app/crm/crm-prospect-equipment-modal.component.ts', 'utf8');
const workload = readFileSync('src/app/pages/app/work/work-workload.component.ts', 'utf8');

assert.match(reception, /Descargar reporte/);
assert.match(reception, /Guardar\"/);
assert.doesNotMatch(reception, /Guardar asociación/);
assert.doesNotMatch(reception, />Guardar borrador</);
assert.match(workload, /type WorkloadTab = "pending" \| "queue" \| "history"/);
assert.match(workload, /data-testid="workload-tab-pending"/);
assert.match(workload, /data-testid="workload-tab-queue"/);
assert.match(workload, /data-testid="affectation-queue-detail"/);
assert.match(workload, /Evidencias de recepción/);
console.log('OK: recepción y asignación cumplen los controles solicitados.');
