import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync("src/app/pages/app/crm/crm-client-detail.component.ts", "utf8");
assert.match(source, /clientLoading = true/);
assert.match(source, /role="tablist"/);
assert.match(source, /role="tab"/);
assert.match(source, /aria-selected/);
assert.match(source, /role="tabpanel"/);
assert.match(source, /aria-live="polite"/);
assert.match(source, /\[attr\.aria-label\]="'Editar ' \+ field\.label"/);
assert.doesNotMatch(source, /<th>Documento<\/th>\s*<th>Documento<\/th>/);
assert.match(source, /Información de perfil/);
assert.match(source, /Cupo máximo/);
console.log("OK: la ficha de cliente cubre carga, pestañas, nombres accesibles y tabla coherente.");
