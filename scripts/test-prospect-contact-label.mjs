import assert from 'node:assert/strict';
import fs from 'node:fs';

const list = fs.readFileSync('src/app/pages/app/crm/crm-prospects.component.ts', 'utf8');
const detail = fs.readFileSync('src/app/pages/app/crm/crm-prospect-detail.component.ts', 'utf8');
assert.doesNotMatch(list + detail, /nombre del prospecto|nombre del cliente potencial/i);
assert.match(list, /for="prospect-contact-name">Nombre del contacto \*/);
assert.match(list, /id="prospect-contact-name"[^>]*\[\(ngModel\)\]="formNombre"/);
assert.match(list, /id="prospect-company"[\s\S]*?\[ngModel\]="formCompania"/);
assert.ok(list.indexOf('id="prospect-company"') < list.indexOf('id="prospect-contact-name"'));
const fields = detail.slice(detail.indexOf('readonly profileEditableFields:'), detail.indexOf('noteTitle ='));
assert.ok(fields.indexOf('key: "compania"') < fields.indexOf('key: "nombre"'));
assert.match(fields, /key: "nombre", label: "Nombre del contacto"/);
assert.match(list, /\["Empresa", "Nombre del contacto", "Correo electrónico"/);
assert.match(list, /\[row.compania, row.nombre, row.correo/);
console.log('PASS: contact terminology, field ordering, bindings and CSV alignment');
