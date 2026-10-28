import assert from 'node:assert/strict';
import fs from 'node:fs';

const list = fs.readFileSync('src/app/pages/app/crm/crm-prospects.component.ts', 'utf8');
const detail = fs.readFileSync('src/app/pages/app/crm/crm-prospect-detail.component.ts', 'utf8');
assert.doesNotMatch(list, /formValor|row\.valor|Valor del Prospecto|Valor, estado/);
assert.doesNotMatch(detail, /Valor potencial/);
assert.match(list, /prospectValue: 0,/);
assert.match(detail, /prospectValue: Math\.max\(0, Math\.floor\(Number\(prospect\.valor\)/);
console.log('PASS: estimated value removed; historical edit payload preserved');
