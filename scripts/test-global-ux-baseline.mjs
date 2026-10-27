import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { globSync } from "node:fs";

const app = readFileSync("src/app/app.component.ts", "utf8");
const service = readFileSync("src/app/services/select-enhancement.service.ts", "utf8");

assert.match(service, /querySelectorAll<HTMLSelectElement>\("select"\)/);
assert.match(service, /MutationObserver/);
assert.match(service, /searchEnabled:\s*true/);
assert.match(service, /classList\.contains\("choices"\)/);
assert.match(service, /noResultsText:\s*"No se encontraron resultados"/);
assert.match(service, /noChoicesText:\s*"No hay opciones disponibles"/);
assert.match(service, /\.refresh\(\)/);
assert.match(service, /\.destroy\(\)/);
assert.match(app, /selectEnhancement\.start\(\)/);
assert.match(app, /selectEnhancement\.stop\(\)/);

assert.match(app, /NavigationStart/);
assert.match(app, /NavigationCancel/);
assert.match(app, /NavigationError/);
assert.match(app, /role="progressbar"/);
assert.match(app, /aria-live="polite"/);
assert.match(app, /focusPageContent/);

for (const path of globSync("src/app/**/*.ts")) {
    const source = readFileSync(path, "utf8");
    assert.doesNotMatch(source, /searchEnabled:\s*false/, `${path} desactiva la búsqueda`);
}

console.log("OK: búsqueda global y feedback accesible de navegación configurados.");
