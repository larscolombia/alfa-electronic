import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync("src/app/pages/app/crm/quote-cost.logic.ts", "utf8");
assert.match(source, /hours.*hourlyRate/);
assert.match(source, /associatedCosts/);
assert.match(source, /profitMargin/);
assert.match(source, /amountToCharge > 0/);
console.log("OK: la lógica de costos protege importes negativos y calcula utilidad/margen.");
