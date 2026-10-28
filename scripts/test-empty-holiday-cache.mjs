import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

const source = fs.readFileSync('src/app/pages/app/company/hr/worktime-calendar.util.ts', 'utf8');
const js = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS } }).outputText;
async function run(code) {
  let requests = 0;
  let token = 'first-session';
  const sandbox = {
    exports: {},
    require: () => ({ resolveApiBaseUrl: () => 'http://calendar.test' }),
    window: { localStorage: { getItem: key => key === 'pika.auth.session' ? JSON.stringify({ accessToken: token }) : null } },
    fetch: async () => { requests++; return { ok: true, json: async () => ({ items: [] }) }; },
  };
  vm.runInNewContext(code, sandbox);
  for (let render = 0; render < 5; render++) {
    for (let card = 0; card < 100; card++) sandbox.exports.loadBusinessCalendarFromStorage();
    await new Promise(resolve => setImmediate(resolve));
  }
  const first = requests;
  token = 'second-session';
  sandbox.exports.loadBusinessCalendarFromStorage();
  await new Promise(resolve => setImmediate(resolve));
  return { first, total: requests };
}
const actual = await run(js);
assert.equal(actual.first, 3, 'An empty holiday result must count as loaded, not refetch on every compact render');
assert.equal(actual.total, 6, 'A new session should receive its own holiday load');
const mutant = js.replace(/if \(holidaysLoadKey === loadKey\)\s*return;/, '');
assert.ok(mutant !== js, 'Mutation target must exist');
assert.ok((await run(mutant)).first > 3, 'Mutation control must reproduce the request/render loop');
console.log('PASS: empty calendar, repeated compact renders, session change and mutation control');
