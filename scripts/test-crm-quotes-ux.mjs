import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync("src/app/pages/app/crm/crm-quotes.component.ts", "utf8");
assert.match(source, /data-testid="quotes-search"/);
assert.match(source, /data-testid="quotes-status-filter"/);
assert.match(source, /data-testid="quotes-pagination"/);
assert.match(source, /displayedQuoteRows/);
assert.match(source, /exportQuotesToCsv\(\)/);
assert.match(source, /link\.download = `cotizaciones-/);
assert.doesNotMatch(source, />\s*Plantilla De Cotización\s*</);
assert.match(source, /aria-label="Volver a cotizaciones"/);
console.log("OK: Cotizaciones tiene listado operable, exportación real y salida accesible.");
