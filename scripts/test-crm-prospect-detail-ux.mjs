import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync("src/app/pages/app/crm/crm-prospect-detail.component.ts", "utf8");
assert.match(source, /role="tablist"/);
assert.equal((source.match(/role="tab"/g) ?? []).length, 9);
assert.match(source, /\[attr\.aria-selected\]/);
assert.match(source, /role="tabpanel"/);
assert.match(source, /overflow-auto/);
assert.match(source, /Información del perfil/);
assert.match(source, /Nueva acción comercial/);
console.log("OK: navegación y lenguaje de la ficha de prospecto normalizados.");
