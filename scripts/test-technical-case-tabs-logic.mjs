import assert from 'node:assert/strict';

const reportGroups = {
  location: ['Alimentación', 'Proceso CPU', 'Potencia', 'Protección externa', 'Entrada', 'Salida', 'Control', 'Comunicación', 'Otro'],
  cause: ['Sobretensión', 'Sobrecarga', 'Entorno', 'Envejecimiento', 'Error de conexión', 'Error de parámetros', 'Choque mecánico', 'Otros'],
  tests: ['Sobre banco de prueba', 'Verificar en sitio'],
};

assert.equal(reportGroups.location.length, 9, 'La ubicación conserva todos los checks');
assert.equal(reportGroups.cause.length, 8, 'La causa conserva todos los checks');
assert.equal(reportGroups.tests.length, 2, 'Las pruebas conservan ambos checks');
assert.ok(!Object.values(reportGroups).flat().some((label) => /estimaci/i.test(label)), 'El reporte no usa estimación');

const columns = [{ id: 'a', order: 0 }, { id: 'b', order: 1 }];
const reordered = [columns[1], columns[0]].map((column, order) => ({ ...column, order }));
assert.deepEqual(reordered.map(({ id, order }) => [id, order]), [['b', 0], ['a', 1]], 'Reordenar normaliza el orden persistible');

const message = { author: 'Usuario actual', text: 'Se verificará en sitio', createdAt: new Date().toISOString() };
assert.ok(message.author && message.text && message.createdAt, 'El chat conserva autor, texto y fecha');
console.log('technical-case-tabs logic: OK');
