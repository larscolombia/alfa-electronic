import assert from 'node:assert/strict';
import fs from 'node:fs';
const detail = fs.readFileSync('src/app/pages/app/crm/crm-prospect-detail.component.ts', 'utf8');
assert.match(detail, /titulo: "Prospecto creado"/);
assert.match(detail, /this\.refreshTimelineFromCommercialActions\(\);\s*\n\s*this\.commercialActionLoadErrorMessage/);
assert.match(detail, /this\.timelineItems = \[\.\.\.lifecycleEvent, \.\.\.followupEvents\]/);
console.log('PASS: traceability retains a lifecycle event without followups');
