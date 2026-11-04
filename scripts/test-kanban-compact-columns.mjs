/** Contract test for a compact, single-count technical board header. */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync("src/app/pages/app/projects/kanban-view.component.ts", "utf8");
const header = source.match(/<header class="column-header">([\s\S]*?)<\/header>/)?.[1] ?? "";

assert.equal((header.match(/columnProjects\.length/g) ?? []).length, 1, "cada columna debe mostrar un solo contador");
assert.match(source, /class="kanban-column flex-shrink-0" style="width: 220px;"/);
assert.match(source, /\.kanban-column \{[\s\S]*padding: 0\.75rem;/);
assert.match(source, /\.project-count \{[\s\S]*min-width: 1\.875rem;/);

console.log("OK: tablero técnico compacto y con contador único verificado.");
