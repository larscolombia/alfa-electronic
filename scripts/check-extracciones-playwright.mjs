/**
 * Verificación visual del módulo Extracciones en http://127.0.0.1:4200/app/extracciones.
 * Solo UI (Playwright): login real, entidades con datos y vacías, filtros, columnas
 * y descargas CSV/XLSX reales.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import os from "node:os";

import { chromium } from "playwright";

const baseUrl = process.env["APP_URL"] || "http://127.0.0.1:4200";
const browser = await chromium.launch({ headless: true });

try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    page.setDefaultTimeout(20_000);
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));

    // ── Login real ────────────────────────────────────────────────────────
    await page.goto(`${baseUrl}/auth/signin`, { waitUntil: "networkidle" });
    await page.locator('input[type="email"]').fill(process.env["PW_ADMIN_EMAIL"] || "admin@alfa.com");
    await page.locator('input[type="password"]').fill(process.env["PW_ADMIN_PASSWORD"] || "1234");
    await page.locator('button[type="submit"]').click();
    await page.waitForURL(/\/app\//);

    // ── Entrada al módulo: entidad por defecto = clientes ────────────────
    await page.goto(`${baseUrl}/app/extracciones`, { waitUntil: "networkidle" });
    await page.getByRole("heading", { name: "Centro de extracciones" }).waitFor();

    const entitySelect = page.locator("#extractionEntity");
    const options = await entitySelect.locator("option").allInnerTexts();
    assert.equal(options.length, 7, `Se esperan 7 entidades, hay ${options.length}: ${options.join(", ")}`);
    assert.equal(await entitySelect.inputValue(), "clientes", "la entidad por defecto debe ser clientes");

    // mt-3/mb-0 es el scope de las alertas del módulo (el layout global usa mb-2).
    const runButton = page.getByRole("button", { name: /Preparar consulta/i });
    const messageAlert = page.locator(".alert-warning.mt-3");
    const errorAlert = page.locator(".alert-danger.mt-3");
    const emptyState = page.getByText("No se encontraron registros");
    const exportCsvButton = page.getByRole("button", { name: /Exportar CSV/i });
    const exportXlsxButton = page.getByRole("button", { name: /Exportar Excel/i });

    /** Ejecuta la consulta y deja visible el mensaje de éxito (falla si hubo error). */
    async function runAndExpectSuccess() {
        await runButton.click();

        // La ejecución limpia primero la alerta anterior; esperar ese vacío evita
        // resolver contra un resultado viejo antes de que llegue el nuevo.
        const staleAlert = page.locator(".alert-warning.mt-3, .alert-danger.mt-3").first();
        try {
            await staleAlert.waitFor({ state: "hidden", timeout: 5_000 });
        } catch { /* completó demasiado rápido; el race abajo lo resuelve */ }

        await Promise.race([
            messageAlert.waitFor({ state: "visible", timeout: 20_000 }),
            errorAlert.waitFor({ state: "visible", timeout: 20_000 }),
        ]);
        assert.equal(await messageAlert.count(), 1, `Error inesperado: ${await errorAlert.count() ? (await errorAlert.innerText()) : ""}`);
    }

    function matchedCount(message) {
        return Number(/(\d+) de \d+ registros/.exec(message)?.[1]);
    }

    // Los <select> del layout están envueltos por Choices v11 (el nativo queda hidden).
    // Convención probada en el repo: abrir con mouse crudo sobre .choices__inner y
    // elegir div[role="option"] dentro del dropdown activo.
    const SPECIALS = [".", "*", "+", "?", "^", "$", "{", "}", "(", ")", "|", "[", "]", "\\"];
    const escapeRegex = (text) => text.split("").map((ch) => (SPECIALS.includes(ch) ? `\\${ch}` : ch)).join("");

    /**
     * Elige una opción de un select envuelto por Choices v11.
     *
     * Contrato verificable (no confía en sleeps): al terminar, el valor nativo
     * del <select> es EXACTAMENTE el value del <option> cuyo texto coincide.
     * Por cómo resincroniza SelectEnhancementService (CustomEvent detail.value →
     * select.value + re-dispatch de change limpio), ese estado garantiza que el
     * ngModel de Angular ya recibió la opción. Si no llega en 3 intentos, falla
     * con diagnóstico (valor actual vs esperado) en vez de continuar.
     */
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

        // El dropdown se busca dentro del wrapper .choices de ESTE select para no
        // chocar con opciones de otros desplegables que estén abiertos.
        const wrap = page.locator(".choices").filter({ has: page.locator(`#${selectId}`) }).first();
        const option = wrap.locator("[role=\"option\"]")
            .filter({ hasText: new RegExp("^\\s*" + escapeRegex(optionText) + "\\s*$") })
            .first();

        const valueNow = () => page.evaluate((id) => document.getElementById(id).value, selectId);
        let lastValue = "<sin leer>";
        for (let attempt = 1; attempt <= 3; attempt++) {
            // Si otro dropdown quedó abierto, un clic en el cuerpo lo cierra antes
            // de que compita con la apertura del nuestro.
            const otherOpen = page.locator(".choices__list--dropdown.is-active").count();
            if (otherOpen > 0) {
                await page.mouse.click(10, 10);
                await page.waitForTimeout(150);
            }

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

            // Clic directo sobre la opción (locator, no coordenadas cached): evita
            // que un rect desactualizado golpee a una vecina.
            await option.click({ timeout: 3_000 }).catch(() => {});

            try {
                await page.waitForFunction(
                    ({ id, value }) => document.getElementById(id)?.value === value,
                    { id: selectId, value: expectedValue },
                    { timeout: 4_000 },
                );
                // Respiro para que la zona de Angular procese el re-dispatch antes
                // de la siguiente interacción (el estado ya es determinista).
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

    // ── Clientes con datos ────────────────────────────────────────────────
    await page.locator("#extractionName").fill("Clientes demo");
    await runAndExpectSuccess();

    const clientMessage = await messageAlert.innerText();
    assert.match(clientMessage, /\d+ de \d+ registros cumplen la consulta\./, `mensaje inválido: ${clientMessage}`);
    const totalClients = matchedCount(clientMessage);
    assert.ok(totalClients >= 10, `se esperaban al menos 10 clientes en el backend, hay ${totalClients}`);

    const bodyRows = page.locator(".table-responsive tbody tr");
    assert.equal(await bodyRows.count(), totalClients, "la tabla debe mostrar todas las filas cargadas");
    assert.deepEqual(
        await page.locator(".table-responsive thead th").allInnerTexts(),
        ["Nombre / Razón social", "NIT", "Empresa", "Correo electrónico", "Ciudad", "Estado"],
        "columnas por defecto de clientes",
    );

    // ── Filtro equals sin coincidencias → vacío guiado + export bloqueada ─
    if (process.env["EXTR_DEBUG"] === "1") {
        await page.evaluate(() => {
            window.__ev = [];
            for (const id of ["filterField", "filterOperator"]) {
                document.getElementById(id).addEventListener("change", (e) => {
                    const isCustom = e instanceof CustomEvent;
                    let detailValue = null;
                    try { detailValue = isCustom && e.detail ? String(e.detail.value ?? "(sin value)") : null; } catch {}
                    window.__ev.push({ id, isCustom, detailValue, target: (e.target && e.target.value) || null });
                }, true);
            }
        });
    }

    const dbg = async (label) => {
        if (process.env["EXTR_DEBUG"] !== "1") return;
        const state = await page.evaluate(() => ({
            field: document.getElementById("filterField").value,
            operator: document.getElementById("filterOperator").value,
            chips: Array.from(document.querySelectorAll(".adminuiux-card .badge.rounded-pill")).map(b => b.textContent.replace(/\s+/g, " ").trim()).join(" | ") || "(ninguno)",
            ev: window.__ev ?? [],
        }));
        console.log(`[dbg] ${label}:`, JSON.stringify(state));
    };

    await chooseOption("filterField", "Nombre o razón social");
    await dbg("tras field");
    await chooseOption("filterOperator", "Es igual a");
    await dbg("tras operator");
    await page.locator("#filterValue").fill("zzz-no-existe-xyz");
    const addFilterBtn = page.getByRole("button", { name: /Agregar filtro/i });
    console.log(process.env["EXTR_DEBUG"] === "1" ? `[dbg] Agregar disabled=${await addFilterBtn.isDisabled()}` : "");
    await addFilterBtn.click();
    await dbg("tras Agregar");
    assert.equal(await page.locator(".badge.rounded-pill", { hasText: "Es igual a" }).count(), 1, `el filtro agregado debe verse como badge; estado: ${await dbg2()}`);

    async function dbg2() {
        return JSON.stringify(await page.evaluate(() => ({
            field: document.getElementById("filterField").value,
            operator: document.getElementById("filterOperator").value,
            chips: Array.from(document.querySelectorAll(".adminuiux-card .badge.rounded-pill")).map(b => b.textContent.replace(/\s+/g, " ").trim()).join(" | ") || "(ninguno)",
        })));
    }

    await runAndExpectSuccess();
    assert.match(await messageAlert.innerText(), /^0 de \d+ registros/, "equals sin coincidencias debe devolver 0 filas");
    await emptyState.waitFor();
    assert.ok((await exportCsvButton.isDisabled()) && (await exportXlsxButton.isDisabled()), "sin resultados la exportación debe quedar deshabilitada");

    // ── Filtro different con valor imposible → todas las filas pasan ─────
    await page.getByRole("button", { name: "Limpiar filtros y resultados" }).click();
    const filterChips = page.locator(".adminuiux-card .badge.rounded-pill");
    const chipTexts = (await filterChips.allInnerTexts()).join(" | ");
    assert.equal(await filterChips.count(), 0, `limpiar debe quitar los chips de filtro; quedan: ${chipTexts}`);

    await chooseOption("filterOperator", "Es diferente de");
    await page.locator("#filterValue").fill("zzz-no-existe-xyz");
    await page.getByRole("button", { name: /Agregar filtro/i }).click();
    await runAndExpectSuccess();
    assert.match(await messageAlert.innerText(), new RegExp(`^${totalClients} de ${totalClients} registros`), "different con valor imposible debe conservar todas las filas (incluidas vacías)");

    // ── Filtro contains case-insensitive ──────────────────────────────────
    await page.getByRole("button", { name: /Limpiar filtros y resultados/i }).click();
    await chooseOption("filterField", "Nombre o razón social");
    await chooseOption("filterOperator", "Contiene");
    await page.locator("#filterValue").fill("e");
    await page.getByRole("button", { name: /Agregar filtro/i }).click();
    await runAndExpectSuccess();

    const containsCount = matchedCount(await messageAlert.innerText());
    assert.ok(containsCount >= 1 && containsCount <= totalClients, `contains "e" debe devolver entre 1 y ${totalClients} filas (${containsCount})`);

    // ── Columnas: todas / ninguna / una sola ─────────────────────────────
    await page.getByRole("button", { name: /Limpiar filtros y resultados/i }).click();

    /**
     * Clic en un botón de columnas reintentando hasta que el contador del DOM
     * ("X de Y columnas seleccionadas") confirme el efecto. Un clic puede llegar
     * antes de que la zona de Angular termine el render; el contador es la prueba.
     */
    async function clickColumns(name, expectPattern) {
        let lastCounter = "<sin leer>";
        for (let attempt = 1; attempt <= 3; attempt++) {
            await page.getByRole("button", { name }).click();
            try {
                await page.waitForFunction((pattern) => {
                    const text = Array.from(document.querySelectorAll(".small.text-secondary"))
                        .map((e) => e.textContent.trim())
                        .find((t) => /columnas seleccionadas/.test(t)) ?? "";
                    return new RegExp(pattern).test(text);
                }, expectPattern, { timeout: 3_000 });
                await page.waitForTimeout(150);
                return;
            } catch {
                lastCounter = await page.evaluate(() => Array.from(document.querySelectorAll(".small.text-secondary"))
                    .map((e) => e.textContent.trim())
                    .find((t) => /columnas seleccionadas/.test(t)) ?? "<sin contador>");
            }
        }
        throw new Error(`botón \u201c${name}\u201d: el contador de columnas quedó en \u201c${lastCounter}\u201d`);
    }

    await clickColumns("Seleccionar todas", "^(\\d+) de \\1 columnas seleccionadas$");
    assert.equal(await page.locator(".column-option").count(), 13, "clientes expone 13 columnas");

    await runAndExpectSuccess();
    assert.equal((await page.locator(".table-responsive thead th").allInnerTexts()).length, 13, "con todo seleccionado la tabla muestra las 13 columnas");

    await clickColumns("Ninguna", "^0 de 13 columnas seleccionadas$");
    assert.ok(await runButton.isDisabled(), "sin columnas seleccionadas no se puede preparar consulta");
    await page.locator(".column-option").first().locator('input[type="checkbox"]').check();
    await page.waitForFunction(() => {
        const text = Array.from(document.querySelectorAll(".small.text-secondary"))
            .map((e) => e.textContent.trim())
            .find((t) => /columnas seleccionadas/.test(t)) ?? "";
        return /^1 de 13 columnas seleccionadas$/.test(text);
    }, null, { timeout: 3_000 });
    assert.ok(await runButton.isEnabled(), "al volver a marcar una columna la consulta se reactiva");

    // ── Equipos con datos ─────────────────────────────────────────────────
    await chooseOption("extractionEntity", "Equipos y servicios");
    await messageAlert.waitFor({ state: "visible" });
    assert.match(await messageAlert.innerText(), /Ahora estás consultando equipos/i, "cambiar entidad debe avisar y limpiar resultados");

    await runAndExpectSuccess();
    const equipmentCount = matchedCount(await messageAlert.innerText());
    assert.ok(equipmentCount >= 1, "equipos debe traer al menos 1 ítem");

    // ── Cotizaciones: estado vacío si el entorno no tiene datos, conteo consistente si los tiene ──
    // (local: 0 registros → valida empty state + exports bloqueados; producción: N ≥ 1 → valida
    // que la consulta reporta un conteo coherente X ≤ Y sin romper la UI)
    await chooseOption("extractionEntity", "Cotizaciones comerciales");
    await runAndExpectSuccess();
    const quotesText = (await messageAlert.innerText()).trim();
    assert.match(quotesText, /^(\d+) de (\d+) registros/, `cotizaciones debe reportar un conteo: ${quotesText}`);
    const quotesShown = Number(quotesText.match(/^(\d+) de/)[1]);
    const quotesTotal = Number(quotesText.match(/^\d+ de (\d+)/)[1]);
    assert.ok(quotesShown <= quotesTotal, "las filas mostradas no pueden exceder el total cargado");
    if (quotesTotal === 0) {
        await emptyState.waitFor();
        assert.ok((await exportCsvButton.isDisabled()) && (await exportXlsxButton.isDisabled()), "con 0 filas no se puede exportar");
    } else {
        assert.ok(await exportCsvButton.isEnabled(), "con datos cargados la exportación debe estar habilitada");
    }

    // ── Descargas reales (CSV y XLSX) con clientes ────────────────────────
    await chooseOption("extractionEntity", "Clientes y contactos");
    await page.getByRole("button", { name: "Seleccionar todas" }).click();
    await runAndExpectSuccess();
    const finalTotal = matchedCount(await messageAlert.innerText());

    let downloadPromise = page.waitForEvent("download");
    await exportCsvButton.click();
    const csvDownload = await downloadPromise;
    assert.match(csvDownload.suggestedFilename(), /^Clientes-demo_\d{4}-\d{2}-\d{2}\.csv$/, `CSV: ${csvDownload.suggestedFilename()}`);

    const csvPath = path.join(os.tmpdir(), "extracciones-test.csv");
    await csvDownload.saveAs(csvPath);
    const csvText = readFileSync(csvPath, "utf8");
    assert.ok(csvText.startsWith("\uFEFF"), "el CSV debe abrir con BOM UTF-8");
    const [csvHeader] = csvText.slice(1).split(/\r\n/);
    assert.equal(
        csvHeader,
        ["Nombre / Razón social", "NIT", "Empresa", "Correo electrónico", "Teléfono", "Ciudad", "País", "Zona", "Dirección", "Estado", "Correo de facturación", "Código postal", "Gran contribuyente"].join(","),
        `CSV header: ${csvHeader}`,
    );
    const csvDataRows = csvText.slice(1).split(/\r\n/).filter((line) => line.trim()).length - 1;
    assert.equal(csvDataRows, finalTotal, "el CSV debe contener todas las filas visibles");

    downloadPromise = page.waitForEvent("download");
    await exportXlsxButton.click();
    const xlsxDownload = await downloadPromise;
    assert.match(xlsxDownload.suggestedFilename(), /^Clientes-demo_\d{4}-\d{2}-\d{2}\.xlsx$/, `XLSX: ${xlsxDownload.suggestedFilename()}`);

    const xlsxPath = path.join(os.tmpdir(), "extracciones-test.xlsx");
    await xlsxDownload.saveAs(xlsxPath);
    const xlsxBytes = readFileSync(xlsxPath);
    assert.equal(xlsxBytes.subarray(0, 2).toString("latin1"), "PK", "el XLSX debe ser un contenedor ZIP válido");
    assert.ok(xlsxBytes.length > 500, `XLSX demasiado pequeño: ${xlsxBytes.length} bytes`);

    // ── Sin errores de página en toda la sesión ───────────────────────────
    assert.equal(errors.length, 0, `errores de runtime detectados: ${errors.join("; ")}`);

    console.log(JSON.stringify({ totalClients, equipmentCount, containsCount, finalTotal }, null, 2));
    console.log("OK: módulo Extracciones verificado visualmente (entidades, filtros, columnas y exportaciones).");
} finally {
    await browser.close();
}
