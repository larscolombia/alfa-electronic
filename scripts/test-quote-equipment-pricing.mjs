import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync("src/app/pages/app/crm/quote-cost.logic.ts", "utf8");

assert.match(source, /laborCost/);
assert.match(source, /associatedCosts/);
assert.match(source, /profit/);
assert.match(source, /profitMargin/);
assert.match(source, /Math\.max\(0/);

console.log("quote-equipment-pricing: ok");
