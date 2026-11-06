/**
 * Verificación visual de la recuperación bidireccional Clientes↔Prospectos en
 * el constructor de extracciones personalizadas (http://127.0.0.1:4200/app/extracciones).
 *
 * Solo UI (Playwright): login real, wizard pasos 1-5, escenarios S1-S5 del spec
 * + filas no emparejadas (sin cruce de datos), selección individual de una sola
 * fuente y exportación a Excel. Requiere las fixtures ZZBIDIR* en la BD local.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import { chromium } from "playwright";

const baseUrl = process.env["APP_URL"] || "http://127.0.0.1:4200";
const exportPath = process.env["BIDIR_EXPORT_PATH"] || "/tmp/bidir-export.xlsx";
const browser = await chromium.launch({ headless: true });

try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    page.setDefaultTimeout(25_000);
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));

    // ── Login real ────────────────────────────────────────────────────────
    await page.goto(`${baseUrl}/auth/signin`, { waitUntil: "networkidle" });
    await page.locator('input[type="email"]').fill(process.env["PW_ADMIN_EMAIL"] || "admin@alfa.com");
    const adminPassword = process.env["PW_ADMIN_PASSWORD"];
    assert.ok(adminPassword, "define PW_ADMIN_PASSWORD para ejecutar esta prueba");
    await page.locator('input[type="password"]').fill(adminPassword);
    await page.locator('button[type="submit"]').click();
    await page.waitForURL(/\/app\//);

    // ── Entrada al módulo y modalidad personalizada ──────────────────────
    await page.goto(`${baseUrl}/app/extracciones`, { waitUntil: "networkidle" });
    await page.getByRole("heading", { name: "Centro de extracciones" }).waitFor();
    await page.getByRole("button", { name: /Extracción personalizada/ }).click();
    const wizard = page.locator(".custom-extraction");
    await wizard.getByText("1. Módulos y tablas").waitFor();

    // Los <select> del layout están envueltos por Choices v11 (el nativo queda
    // hidden). Convención probada en el repo: abrir con mouse crudo sobre
    // .choices__inner y elegir div[role="option"] dentro del dropdown activo.
    const SPECIALS = [".", "*", "+", "?", "^", "$", "{", "}", "(", ")", "|", "[", "]", "\\"];
    const escapeRegex = (text) => text.split("").map((ch) => (SPECIALS.includes(ch) ? `\\${ch}` : ch)).join("");

    async function chooseOption(selectId, optionText) {
        const expectedValue = await page.evaluate(({ id, text }) => {
            const sel = document.getElementById(id);
            if (!sel) throw new Error(`el select #${id} no existe`);
            const match = Array.from(sel.options).find((o) => o.textContent.trim() === text);
            if (!match) {
                const available = Array.from(sel.options).map((o) => o.textContent.trim()).join(" | ");
                throw new Error(`la opción \u201c${text}\u201d no existe en #${id}; disponibles: ${available}`);
            }
            return match.value;
        }, { id: selectId, text: optionText });

        const wrap = page.locator(".choices").filter({ has: page.locator(`#${selectId}`) }).first();
        const option = wrap.locator("[role=\"option\"]")
            .filter({ hasText: new RegExp("^\\s*" + escapeRegex(optionText) + "\\s*$") })
            .first();

        const valueNow = () => page.evaluate((id) => document.getElementById(id).value, selectId);
        let lastValue = "<sin leer>";
        for (let attempt = 1; attempt <= 3; attempt++) {
            const otherOpen = page.locator(".choices__list--dropdown.is-active").count();
            if (otherOpen > 0) {
                await page.mouse.click(10, 10);
                await page.waitForTimeout(150);
            }

            // El mouse crudo solo alcanza lo que está dentro del viewport:
            // el select puede estar bajo el pliegue (wizard largo).
            await wrap.scrollIntoViewIfNeeded();
            const pos = await wrap.evaluate((el) => {
                const inner = el.querySelector(".choices__inner");
                const target = (inner && inner.getBoundingClientRect().width > 0) ? inner : el;
                const rect = target.getBoundingClientRect();
                return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
            });
            await page.mouse.move(pos.x, pos.y);
            await page.mouse.down();
            await page.mouse.up();

            const opened = await option.waitFor({ state: "visible", timeout: 3_000 }).then(
                () => true,
                () => false,
            );
            if (!opened) continue;

            await option.click({ timeout: 3_000 }).catch(() => {});

            try {
                await page.waitForFunction(
                    ({ id, value }) => document.getElementById(id)?.value === value,
                    { id: selectId, value: expectedValue },
                    { timeout: 4_000 },
                );
                await page.waitForTimeout(150);
                return expectedValue;
            } catch {
                lastValue = await valueNow();
            }
        }

        throw new Error(
            `no se pudo fijar \u201c${optionText}\u201d en #${selectId}: valor esperado \u201c${expectedValue}\u201d, actual \u201c${lastValue}\u201d`,
        );
    }

    // ── Paso 1: módulo CRM + tablas Clientes y Prospectos ────────────────
    const cardTables = wizard.locator(".card").filter({ hasText: /1\. Módulos y tablas/ }).first();
    await cardTables.getByRole("button", { name: "CRM y clientes" }).click();

    // hasText con regex prueba contra el textContent crudo (con espacios de
    // plantilla), por eso los anclajes toleran whitespace a ambos lados.
    const tableOption = (label, tableName) =>
        cardTables.locator(".column-option").filter({ hasText: new RegExp(`^\\s*${escapeRegex(label)}\\s*${escapeRegex(tableName)}\\s*$`) });
    await tableOption("Clientes", "crm_clients").locator('input[type="checkbox"]').check();
    await tableOption("Prospectos", "crm_prospects").locator('input[type="checkbox"]').check();

    // ── Paso 2: columnas equivalentes de ambas fuentes ───────────────────
    const cardColumns = wizard.locator(".card").filter({ hasText: /2\. Columnas del reporte/ }).first();
    await cardColumns.waitFor();
    const MODULE = "CRM y clientes";
    const columnOption = (label, tableLabel) =>
        cardColumns.locator(".column-option").filter({ hasText: new RegExp(`^\\s*${escapeRegex(label)}\\s*${escapeRegex(tableLabel)} · ${escapeRegex(MODULE)}\\s*$`) });

    for (const [label, table] of [
        ["Nombre", "Clientes"], ["Nombre", "Prospectos"],
        ["Empresa", "Clientes"], ["Empresa", "Prospectos"],
        ["NIT", "Clientes"], ["NIT", "Prospectos"],
        ["Ciudad", "Clientes"], ["Ciudad", "Prospectos"],
        ["Fecha de registro", "Clientes"], ["Fecha de registro", "Prospectos"],
    ]) {
        await columnOption(label, table).locator('input[type="checkbox"]').check();
    }

    // ── Paso 3 + 5: ejecutar con filtro y leer la tabla de resultados ────
    const runButton = wizard.getByRole("button", { name: /Preparar consulta/ });
    const errorAlert = wizard.locator(".alert-danger");
    const resultsTable = wizard.locator(".table-responsive");

    /** Ejecuta la consulta y espera respuesta 200 + render de filas. */
    async function runAndRead() {
        await Promise.all([
            page.waitForResponse((resp) => resp.url().includes("/extractions/query") && resp.status() === 200),
            runButton.click(),
        ]);
        assert.equal(await errorAlert.count(), 0, `error inesperado: ${await errorAlert.first().innerText().catch(() => "")}`);
        await resultsTable.waitFor();
        const headers = await resultsTable.locator("thead th").allInnerTexts();
        const rowEls = resultsTable.locator("tbody tr");
        await page.waitForFunction(
            () => {
                for (const tr of document.querySelectorAll(".custom-extraction .table-responsive tbody tr")) {
                    if (tr.querySelectorAll("td").length > 1) return true; // fila de datos o estado vacío multi-celda
                }
                return false;
            },
            undefined,
            { timeout: 15_000 },
        );
        const rows = [];
        for (let i = 0; i < await rowEls.count(); i++) {
            const cells = await rowEls.nth(i).locator("td").allInnerTexts();
            if (cells.length !== headers.length) continue; // descarta spinner/estado vacío
            const obj = {};
            headers.forEach((h, j) => { obj[h.trim()] = cells[j].trim(); });
            rows.push(obj);
        }
        return { headers, rows };
    }

    const C = (label) => `Clientes · ${label}`;
    const P = (label) => `Prospectos · ${label}`;
    const EMPTY = "—";

    // ── Consulta A: filtro sobre Clientes·Empresa → S1-S5 + SoloCliente ──
    await chooseOption("customFilterField", C("Empresa"));
    await page.locator("#customFilterValue").fill("ZZBIDIR");
    await wizard.getByRole("button", { name: /Agregar/ }).click();

    let result = await runAndRead();
    assert.equal(result.rows.length, 6, `consulta A debe devolver 6 filas (5 emparejadas + SoloCliente), hay ${result.rows.length}`);
    const rowA = (empresa) => result.rows.find((r) => r[C("Empresa")] === empresa || r[P("Empresa")] === empresa);

    // S1: cliente con información, prospecto vacío → ambos muestran el valor del cliente.
    let s1 = rowA("ZZBIDIR Uno");
    assert.ok(s1, "falta la fila ZZBIDIR Uno");
    assert.equal(s1[C("Nombre")], "Cliente Uno", "S1: nombre de clientes");
    assert.equal(s1[P("Nombre")], "Cliente Uno", "S1: el prospecto vacío recupera el nombre del cliente");
    assert.equal(s1[C("Ciudad")], "Cali", "S1: ciudad de clientes");
    assert.equal(s1[P("Ciudad")], "Cali", "S1: la ciudad vacía del prospecto se recupera del cliente");

    // S2: prospecto con información, cliente vacío → ambos muestran el valor del prospecto.
    let s2 = rowA("ZZBIDIR Dos");
    assert.ok(s2, "falta la fila ZZBIDIR Dos");
    assert.equal(s2[C("Nombre")], "Prospecto Dos", "S2: el cliente vacío recupera el nombre del prospecto");
    assert.equal(s2[P("Nombre")], "Prospecto Dos", "S2: nombre de prospectos");
    assert.equal(s2[C("Ciudad")], "Medellín", "S2: la ciudad vacía del cliente se recupera del prospecto");

    // S3: ambos con el mismo valor → se conserva.
    let s3 = rowA("ZZBIDIR Tres");
    assert.ok(s3, "falta la fila ZZBIDIR Tres");
    assert.equal(s3[C("Nombre")], "Compartido Tres", "S3: nombre de clientes");
    assert.equal(s3[P("Nombre")], "Compartido Tres", "S3: nombre de prospectos");
    assert.equal(s3[C("NIT")], "123", "S3: NIT de clientes");
    assert.equal(s3[P("NIT")], "123", "S3: NIT de prospectos");

    // S4: ambos con valores diferentes → cada fuente conserva el suyo.
    let s4 = rowA("ZZBIDIR Cuatro");
    assert.ok(s4, "falta la fila ZZBIDIR Cuatro");
    assert.equal(s4[C("Nombre")], "Lado Cliente", "S4: clientes conserva su nombre");
    assert.equal(s4[P("Nombre")], "Lado Prospecto", "S4: prospectos conserva su nombre");
    assert.equal(s4[C("Ciudad")], "Pereira", "S4: ciudad de clientes intacta");
    assert.equal(s4[P("Ciudad")], "Barranquilla", "S4: ciudad de prospectos intacta");
    assert.equal(s4[C("NIT")], "456", "S4: NIT de clientes intacto");
    assert.equal(s4[P("NIT")], "789", "S4: NIT de prospectos intacto");

    // S5: ambos sin información → vacío.
    let s5 = rowA("ZZBIDIR Cinco");
    assert.ok(s5, "falta la fila ZZBIDIR Cinco");
    for (const col of [C("Nombre"), P("Nombre"), C("Ciudad"), P("Ciudad")]) {
        assert.equal(s5[col], EMPTY, `S5: ${col} debe quedar vacío`);
    }

    // SoloCliente: sin prospecto emparejado → columnas de prospectos NUNCA se rellenan.
    let soloC = rowA("ZZBIDIR SoloCliente");
    assert.ok(soloC, "falta la fila ZZBIDIR SoloCliente");
    assert.equal(soloC[C("Nombre")], "Solo Cliente", "SoloCliente: nombre propio del cliente");
    for (const col of [P("Nombre"), P("Empresa"), P("Ciudad"), P("Fecha de registro")]) {
        assert.equal(soloC[col], EMPTY, `SoloCliente: ${col} no debe cruzar datos (sin prospecto emparejado)`);
    }

    // Fechas: ambos lados con valor propio → cada uno conserva su fecha original.
    for (const [row, col] of [[s1, C("Fecha de registro")], [s1, P("Fecha de registro")]]) {
        assert.match(row[col], /^2026-11-05/, `la fecha debe mostrarse con su valor real (${col})`);
    }

    // ── Consulta B: filtro sobre Prospectos·Empresa → SoloProspecto ──────
    await wizard.locator(".badge .btn-close").first().click(); // quita el filtro A
    await chooseOption("customFilterField", P("Empresa"));
    await page.locator("#customFilterValue").fill("ZZBIDIR");
    await wizard.getByRole("button", { name: /Agregar/ }).click();

    result = await runAndRead();
    assert.equal(result.rows.length, 6, `consulta B debe devolver 6 filas (5 emparejadas + SoloProspecto), hay ${result.rows.length}`);
    const rowB = (empresa) => result.rows.find((r) => r[C("Empresa")] === empresa || r[P("Empresa")] === empresa);

    // SoloProspecto: sin cliente emparejado → columnas de clientes NUNCA se rellenan.
    let soloP = rowB("ZZBIDIR SoloProspecto");
    assert.ok(soloP, "falta la fila ZZBIDIR SoloProspecto");
    assert.equal(soloP[P("Nombre")], "Solo Prospecto", "SoloProspecto: nombre propio del prospecto");
    for (const col of [C("Nombre"), C("Empresa"), C("Ciudad"), C("Fecha de registro")]) {
        assert.equal(soloP[col], EMPTY, `SoloProspecto: ${col} no debe cruzar datos (sin cliente emparejado)`);
    }

    // Spot-check: la recuperación sigue activa en filas emparejadas.
    let b1 = rowB("ZZBIDIR Uno");
    assert.ok(b1, "falta la fila ZZBIDIR Uno en consulta B");
    assert.equal(b1[P("Nombre")], "Cliente Uno", "consulta B: el prospecto vacío sigue recuperando del cliente");

    // ── Exportación a Excel con datos bidireccionales ────────────────────
    const [download] = await Promise.all([
        page.waitForEvent("download"),
        wizard.getByRole("button", { name: /Exportar Excel/ }).click(),
    ]);
    await download.saveAs(exportPath);
    const stat = fs.statSync(exportPath);
    assert.ok(stat.size > 1024, `el XLSX exportado es sospechosamente pequeño (${stat.size} bytes)`);
    const head = Buffer.alloc(4);
    const fd = fs.openSync(exportPath, "r");
    fs.readSync(fd, head, 0, 4, 0);
    fs.closeSync(fd);
    assert.equal(head.toString("latin1", 0, 2), "PK", "el archivo exportado no es un XLSX válido (firmatura ZIP)");

    // ── Selección individual: solo Clientes (sin recuperación) ───────────
    await tableOption("Prospectos", "crm_prospects").locator('input[type="checkbox"]').uncheck();
    result = await runAndRead();
    assert.ok(result.rows.length >= 10, `la selección individual de clientes debe devolver los clientes demo (>=10), hay ${result.rows.length}`);
    for (const h of result.headers) {
        assert.match(h, /^Clientes · /, `con una sola fuente no deben aparecer columnas ajenas: ${h}`);
    }

    // ── Sin errores de página en todo el flujo ───────────────────────────
    assert.deepEqual(errors, [], `errores de página durante la prueba: ${errors.join(" | ")}`);

    console.log("OK recuperación bidireccional Clientes↔Prospectos (S1-S5 + sin cruce + export XLSX + fuente individual)");
} finally {
    await browser.close();
}
