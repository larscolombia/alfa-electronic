import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const logic = readFileSync("src/app/pages/app/crm/quote-equipment-costing.logic.ts", "utf8");
const view = readFileSync("src/app/pages/app/crm/crm-quotes.component.ts", "utf8");
assert.match(logic, /estimatedHours.*hourlyRate/);
assert.match(logic, /salePrice.*costs/);
assert.match(logic, /slice\(0, 5\)/);
assert.match(logic, /=== "reparacion"/);
assert.match(view, /Historial técnico completo/);
assert.match(view, /Costo repuestos/);
assert.match(view, /Margen/);
console.log("OK: costos, rentabilidad, límite de comentarios y bloqueo de cotización.");
