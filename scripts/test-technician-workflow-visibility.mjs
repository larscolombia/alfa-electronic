import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync('src/app/pages/app/projects/board-audience.logic.ts', 'utf8');
const detail = readFileSync('src/app/pages/app/projects/kanban-view.component.ts', 'utf8');
const expected = ['diagnostico', 'pedir-repuestos', 'reparacion', 'esperando-proveedor', 'garantia', 'garantia-espera-repuestos', 'prestamo'];

for (const status of expected) assert.match(source, new RegExp(`'${status}'`));
for (const excluded of ['recibido', 'por-cotizar', 'esperando-cliente', 'listo-entrega', 'entregado']) {
  assert.doesNotMatch(source.match(/TECHNICIAN_WORKFLOW_STATUS_IDS[\s\S]*?\]\);/)?.[0] ?? '', new RegExp(`'${excluded}'`));
}
assert.match(source, /column\.equipmentStatusId \|\| column\.id/);
assert.match(detail, /equipment-linked-box__qr/);
assert.doesNotMatch(detail.match(/<ng-container \*ngIf="activeDetailTab === 'equipo'">([\s\S]*?)<\/ng-container>/)?.[1] ?? '', /Cambiar equipo|Buscar equipo|Escanear QR|Equipo recibido/);
console.log('OK: visibilidad técnica del flujo verificada.');
