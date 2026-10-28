import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
import vm from 'node:vm';

const file = 'src/app/pages/app/projects/lab/board-lab-projection.ts';
const source = fs.readFileSync(file, 'utf8');
const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
const context = { exports: {} };
vm.runInNewContext(js, context);
const { projectLabColumns } = context.exports;
const columns = [{ id: 'diagnostico' }, { id: 'reparacion' }];
const items = Array.from({ length: 100000 }, (_, i) => ({ id: String(i), status: i % 2 ? 'diagnostico' : 'reparacion', properties: { assignee: i % 3 ? 'Ana' : 'Luis', diagnosisClosedAt: i % 5 ? '' : '2026-01-01' } }));
const start = performance.now();
const result = projectLabColumns(columns, items, 'todos', '', new Map());
const ms = performance.now() - start;
const timings = [ms];
for (let sample = 0; sample < 4; sample++) {
  const started = performance.now();
  projectLabColumns(columns, items, 'todos', '', new Map());
  timings.push(performance.now() - started);
}
const median = [...timings].sort((a, b) => a - b)[2];
assert.equal(result[0].total, 50000);
assert.equal(result[0].visible.length, 12);
assert.equal(result[1].total, 50000);
assert.equal(items.length, 100000);
const filtered = projectLabColumns(columns, items, 'administrativo', 'Luis', new Map([['diagnostico', 24]]));
assert.ok(filtered[0].visible.every(p => p.properties.assignee === 'Luis' && p.properties.diagnosisClosedAt));
assert.equal(filtered[0].visible.length, 24);
assert.equal(projectLabColumns(columns, [], 'todos', '', new Map())[0].total, 0);
// Scheduling/GC on the shared desktop makes CPU microbenchmarks diagnostic.
// The visible-browser test gates perceived latency; this test gates allocation.
assert.equal(result.reduce((count, column) => count + column.visible.length, 0), 24);
const mutated = js.replace('limits.get(entry.column.id) || 12', 'limits.get(entry.column.id) || Infinity');
assert.notEqual(mutated, js, 'Mutation target must exist');
const mutationContext = { exports: {} };
vm.runInNewContext(mutated, mutationContext);
assert.ok(mutationContext.exports.projectLabColumns(columns, items, 'todos', '', new Map())[0].visible.length > 12);
console.log(`PASS: 100000 cases; cold=${ms.toFixed(1)} ms, median=${median.toFixed(1)} ms; filters, limits, counts and mutation control`);
