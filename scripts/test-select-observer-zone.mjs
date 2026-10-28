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

// ── Debounce + relevancia: no re-escanear el documento en cada mutación ────
class FakeElement {
  constructor(tagName, containsSelect = false) { this.nodeType = 1; this.tagName = tagName; this._containsSelect = containsSelect; }
  querySelector(sel) { return sel === 'select' && this._containsSelect ? {} : null; }
}
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
let scanCount = 0;
const countingDocument = { body: {}, querySelectorAll: () => { scanCount += 1; return []; } };
const elementSandbox = {
  ...sandbox,
  exports: {},
  HTMLElement: FakeElement,
  setTimeout,
  clearTimeout,
};
let elementCallback;
elementSandbox.MutationObserver = class {
  constructor(fn) { elementCallback = fn; }
  observe() {}
  disconnect() {}
};
vm.runInNewContext(js, elementSandbox);
const elementService = new elementSandbox.exports.SelectEnhancementService(countingDocument, zone);
elementService.start();
const initialScans = scanCount;
// Mutación irrelevante (solo texto): no debe programar ningún re-scan.
elementCallback([{ addedNodes: [{ nodeType: 3, textContent: 'hola' }], removedNodes: [] }]);
await sleep(120);
assert.equal(scanCount, initialScans, 'text-only mutations must not trigger a document re-scan');
// Dos mutaciones relevantes seguidas: un solo re-scan (debounce).
elementCallback([{ addedNodes: [new FakeElement('SELECT')], removedNodes: [] }]);
elementCallback([{ addedNodes: [new FakeElement('DIV', true)], removedNodes: [] }]);
await sleep(120);
assert.equal(scanCount, initialScans + 1, 'relevant mutations must be debounced into a single re-scan');
elementService.stop();
console.log('PASS: irrelevant mutations skipped; relevant mutations debounced into one scan');
