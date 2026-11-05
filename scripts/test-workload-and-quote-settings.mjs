import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const workload = readFileSync("src/app/pages/app/work/work-workload.component.ts", "utf8");
const settings = readFileSync("src/app/pages/app/company/company-quote-settings.component.ts", "utf8");

assert.match(workload, /Matriz de decisión/);
assert.match(workload, /activeTab === "pending"/);
assert.doesNotMatch(workload, /activeTab === "pending"[\s\S]{0,400}Cola de afectación/);
assert.match(workload, /Matriz de decisión[\s\S]{0,500}Cola de afectación[\s\S]{0,500}Histórico/);
assert.match(workload, /equipmentCode \|\| "Sin código CO"/);
assert.doesNotMatch(workload, /entry\.item\.internalCode/);
assert.match(settings, /Líneas de comentarios/);
assert.match(settings, /Valor hora-hombre en Colombia/);
assert.match(settings, /FINANCE_HOURLY_RATE_KEY/);
console.log("OK: carga laboral y configuración de cotizaciones cumplen el alcance.");
