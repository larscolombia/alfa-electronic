import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

const source = fs.readFileSync('src/app/services/select-enhancement.service.ts', 'utf8');
const js = ts.transpileModule(source, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, experimentalDecorators: true },
}).outputText;
let inAngular = true;
let observerZone;
let callback;
const document = { body: {}, querySelectorAll: () => [] };
const zone = { runOutsideAngular(fn) { const previous = inAngular; inAngular = false; try { return fn(); } finally { inAngular = previous; } } };
const sandbox = {
  exports: {},
  require(name) {
    if (name === '@angular/core') return { Injectable: () => value => value, Inject: () => () => {} };
    if (name === '@angular/common') return { DOCUMENT: {} };
    if (name === 'choices.js') return {};
    throw Error(name);
  },
  MutationObserver: class {
    constructor(fn) { observerZone = inAngular; callback = fn; }
    observe() {}
    disconnect() {}
  },
};
vm.runInNewContext(js, sandbox);
const service = new sandbox.exports.SelectEnhancementService(document, zone);
service.start();
assert.equal(observerZone, false, 'DOM observation must register outside Angular to prevent render feedback');
assert.equal(typeof callback, 'function');
callback();
service.stop();
const mutatedJs = js.replace('this.zone.runOutsideAngular(() => {', '((fn) => fn())(() => {');
const mutatedSandbox = { ...sandbox, exports: {} };
vm.runInNewContext(mutatedJs, mutatedSandbox);
new mutatedSandbox.exports.SelectEnhancementService(document, zone).start();
assert.equal(observerZone, true, 'mutation control must reproduce the unsafe registration');
console.log('PASS: observer registered outside Angular; mutation control detected');
