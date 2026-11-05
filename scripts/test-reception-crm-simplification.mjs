import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const reception = readFileSync("src/app/pages/app/crm/crm-prospect-equipment-modal.component.ts", "utf8");
const prospectForm = readFileSync("src/app/pages/app/crm/crm-prospects.component.ts", "utf8");
const prospectDetail = readFileSync("src/app/pages/app/crm/crm-prospect-detail.component.ts", "utf8");
const clientForm = readFileSync("src/app/pages/app/crm/crm-clients.component.ts", "utf8");
const clientDetail = readFileSync("src/app/pages/app/crm/crm-client-detail.component.ts", "utf8");

assert.match(prospectForm, /<div class="col-12 mb-2" \*ngIf="false">/);
assert.doesNotMatch(prospectDetail, /activeTab === "sucursales"/);
assert.match(clientForm, /<div class="col-12 mb-3" \*ngIf="false">/);
assert.doesNotMatch(clientDetail, /activeTab === 'sucursales'/);

assert.match(reception, /createClientContact\(/);
assert.match(reception, /resolveContactTargetClientId/);
assert.match(reception, /reception-branch" \*ngIf="false"/);
assert.doesNotMatch(reception, /Desde el celular este paso puede abrir la cámara trasera/);
assert.doesNotMatch(reception, /En móvil, el atributo capture intenta abrir la cámara trasera/);
assert.doesNotMatch(reception, /Generar proyectos de reparación al guardar/);
assert.doesNotMatch(reception, /Autorización industrial requerida/);
assert.match(reception, /Registro de asignación/);
assert.match(reception, /priority-question-closure/);
assert.match(reception, /máximo 10MB por archivo/);

console.log("OK: CRM sin sucursales y recepción simplificada con contacto para clientes.");
