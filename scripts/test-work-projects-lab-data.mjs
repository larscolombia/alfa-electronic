import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

const source = fs.readFileSync('src/app/pages/app/projects/lab/board-lab-data.service.ts', 'utf8');
const js = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, experimentalDecorators: true } }).outputText;
class Api {}
class Auth {}
let token = 'session-a';
const calls = [];
const population = Array.from({ length: 10000 }, (_, index) => ({
  id: String(index), status: index % 2 ? 'diagnostico' : 'reparacion',
  properties: { title: `Caso ${index}` }, createdAt: '2026-10-28', updatedAt: '2026-10-28',
}));
const api = {
  getBoardConfig: () => ({}), getSlaConfig: () => [],
  listProjects: query => { calls.push(query); return population.filter(item => item.status === query.status).slice(0, query.limit); },
};
const sandbox = {
  exports: {},
  require(name) {
    if (name === '@angular/core') return { Injectable: () => value => value, inject: type => type === Api ? api : { getAccessToken: () => token } };
    if (name === 'rxjs') return { firstValueFrom: value => Promise.resolve(value) };
    if (name.includes('projects-api.service')) return { ProjectsApiService: Api };
    if (name.includes('auth.service')) return { AuthService: Auth };
    if (name.includes('project-workflow.config')) return {
      buildTechnicalProjectBoard: () => ({ id: 'board-1', columns: [{ id: 'diagnostico', order: 1 }, { id: 'reparacion', order: 2 }] }),
      mapLegacyProjectStatus: status => status,
    };
    if (name.includes('project-sla.logic')) return { applySlaConfigToColumns: columns => columns, slaConfigFromApiPayload: () => ({}) };
    throw Error(`Unexpected module ${name}`);
  },
};
vm.runInNewContext(js, sandbox);
const service = new sandbox.exports.BoardLabDataService();
const first = await service.load();
assert.equal(first.projects.length, 24);
assert.equal(first.hasMore.size, 2);
assert.ok(calls.every(query => query.limit === 13));
assert.equal(await service.load(), first);
assert.equal(calls.length, 2, 'Cache must avoid duplicate loads');
const next = await service.page(first.board, 'diagnostico', 24);
assert.equal(next.projects.length, 24);
assert.equal(next.more, true);
assert.equal(calls.at(-1).limit, 25);
const capped = await service.page(first.board, 'diagnostico', 1000);
assert.equal(calls.at(-1).limit, 1000);
assert.equal(capped.more, true, 'API cap must never masquerade as a complete column');
token = 'session-b';
assert.equal(service.peek(), undefined, 'Do not reuse a previous session snapshot');
console.log('PASS: 10000-source population; bounded transfer, paging, cache, cap and session isolation');
