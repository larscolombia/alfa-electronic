import { readFileSync } from 'node:fs';
import { strict as assert } from 'node:assert';

const handler = readFileSync('backend/internal/crm/equipment/handler.go', 'utf8');

assert(!handler.includes('errIndustrialOverrideRequired'));
assert(!handler.includes('validateIndustrialOverrides'));
assert(!handler.includes('requiresIndustrialOverride'));
assert(!handler.includes('applyIndustrialOverrideTimestamps(req.Items)'));

console.log('OK: la recepción no exige autorización de jefe por costo o tipo de equipo.');
