import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync("src/app/pages/app/crm/crm-prospects.component.ts", "utf8");

assert.match(source, /\*ngIf="!showProspectForm"/);
assert.match(source, /data-testid="prospects-search"/);
assert.match(source, /data-testid="prospects-status-filter"/);
assert.match(source, /data-testid="prospects-page-size"/);
assert.match(source, /data-testid="prospects-pagination"/);
assert.match(source, /filteredProspectRows/);
assert.match(source, /exportProspects\(\)/);
assert.match(source, /routerLink="\/app\/crm-carga-bases"/);
assert.doesNotMatch(source, /<th[^>]*><input type="checkbox"/);
assert.doesNotMatch(source, /<td><input type="checkbox"/);
assert.match(source, /Información básica/);
assert.match(source, /Clasificación y responsable/);
assert.match(source, /Valor, estado y servicio/);

console.log("OK: estructura UX de CRM Prospectos lista para verificación funcional.");
