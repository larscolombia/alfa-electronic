import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync('src/app/pages/app/work/work-workload.component.ts', 'utf8');
assert.match(source, /data-testid="workload-status-summary"/);
assert.match(source, /workflowSummary/);
assert.match(source, /this\.projects\.filter\(\(project\) => project\.status === stage\.id\)\.length/);
console.log('OK: resumen de estados en carga laboral verificado.');
