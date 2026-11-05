/** Unit test — contrato de navegación de la ficha técnica. */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync('src/app/pages/app/projects/kanban-view.component.ts', 'utf8');
const expectedTabs = [
  ['equipo', 'Información del equipo'],
  ['repuestos', 'Repuestos'],
  ['adjuntos', 'Adjuntos'],
  ['memo', 'Memo'],
  ['chat', 'Chat'],
  ['reporte-intervencion', 'Reporte de intervención'],
];

for (const [id, label] of expectedTabs) {
  assert.match(source, new RegExp(`activeDetailTab === '${id}'`), `falta el panel ${id}`);
  assert.match(source, new RegExp(`setActiveDetailTab\\('${id}'\\)[\\s\\S]{0,120}>${label}<`), `falta la pestaña ${label}`);
}

for (const legacyLabel of ['Equipo técnico', '>Materiales<', '>Identidad<', 'Planeacion y notas']) {
  assert.doesNotMatch(source, new RegExp(legacyLabel), `no debe mostrarse ${legacyLabel}`);
}

for (const label of ['Marca', 'Tipo', 'Serie', 'Familia', 'Código CO', 'Código QR', 'Falla detectada', 'Fecha de recepción', 'Técnico asignado', 'Plazo de reparación (días)', 'Fecha de entrega programada']) {
  assert.ok(source.includes(`>${label}<`), `falta el dato ${label}`);
}

console.log('OK — test-project-detail-tabs: contrato de pestañas y datos del equipo validado');
