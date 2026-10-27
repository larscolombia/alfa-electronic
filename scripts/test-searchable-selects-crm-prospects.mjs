import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const directivePath = "src/app/components/input-fields/searchable-select/searchable-select.directive.ts";
const componentPath = "src/app/pages/app/crm/crm-prospects.component.ts";

const directive = readFileSync(directivePath, "utf8");
const component = readFileSync(componentPath, "utf8");

assert.match(directive, /selector:\s*["']select\[appSearchableSelect\]["']/);
assert.match(directive, /searchEnabled:\s*true/);
assert.match(directive, /MutationObserver/);
assert.match(directive, /ngOnDestroy/);

const selects = component.match(/<select\b[\s\S]*?<\/select>/g) ?? [];
assert.equal(selects.length, 9, "CRM Prospectos debe tener 9 selectores buscables, incluidos filtros y paginación");

for (const select of selects) {
    assert.match(select, /appSearchableSelect/, "Cada selector debe activar búsqueda");
    assert.match(select, /(?:\bid|\[id\])="[^"]+"/, "Cada selector debe tener id accesible");
}

const ids = selects.flatMap((select) => {
    const id = select.match(/\bid="([^"]+)"/)?.[1];
    return id ? [id] : [];
});
for (const id of ids) {
    assert.match(component, new RegExp(`<label[^>]*for="${id}"`), `Falta label asociado a ${id}`);
}
assert.match(component, /<label[^>]*\[for\]="'prospect-branch-contact-' \+ branchIndex"/);

console.log("OK: los 9 selectores de CRM Prospectos tienen búsqueda y etiqueta asociada.");
