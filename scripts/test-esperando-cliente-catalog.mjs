/** Contract test for the shared technical-state catalog. */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const frontend = readFileSync("src/app/pages/app/projects/project-workflow.config.ts", "utf8");
const backend = readFileSync("backend/internal/projects/service.go", "utf8");
const transitions = readFileSync("backend/internal/projects/transitions.go", "utf8");

assert.match(frontend, /id: 'esperando-cliente',[\s\S]*label: 'Esperando Cliente'/);
assert.match(frontend, /id: 'por-cotizar',[\s\S]*id: 'esperando-cliente',[\s\S]*id: 'pedir-repuestos'/);
assert.match(backend, /"esperando-cliente":\s*\{\}/);
assert.match(transitions, /"por-cotizar":\s*\{[^}]*"esperando-cliente"/);
assert.match(transitions, /"esperando-cliente":\s*\{[^}]*"pedir-repuestos"/);

console.log("OK: catálogo y transiciones de Esperando Cliente verificados.");
