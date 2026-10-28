import assert from 'node:assert/strict';
import fs from 'node:fs';
const component = fs.readFileSync('src/app/pages/app/crm/crm-prospects.component.ts', 'utf8');
assert.match(component, /\(click\)="toggleSort\('compania'\)"/);
assert.match(component, /\n\s*Empresa\s*\n\s*<i class="bi"/);
assert.match(component, /\{\{ prospectDisplayCompany\(row\) \}\}/);
assert.match(component, /Contacto: \{\{ row\.nombre \}\}/);
assert.match(component, /return row\.compania\.trim\(\) \|\| row\.nombre;/);
console.log('PASS: prospect list identifies records by company with contact fallback');
