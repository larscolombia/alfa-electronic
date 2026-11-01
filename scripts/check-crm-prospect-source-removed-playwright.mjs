import { chromium } from "playwright";

const baseUrl = process.env.PW_BASE_URL || "http://localhost:4200";
const apiBaseUrl = process.env.PW_API_BASE_URL || "http://localhost:8080";
const email = "admin@alfa.com";
const password = "1234";

let browser;

async function loginSession() {
    const response = await fetch(`${apiBaseUrl}/api/v1/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Company-Id": "demo-company" },
        body: JSON.stringify({ email, password }),
    });
    if (!response.ok) throw new Error(`No se pudo iniciar sesión como admin (${response.status}).`);
    const login = await response.json();
    return { ...login, expiresAt: Date.now() + login.expiresIn * 1000 };
}

async function openProspectsPage(context) {
    const page = await context.newPage();
    await page.goto(`${baseUrl}/app/crm-prospectos`, { waitUntil: "domcontentloaded" });
    return page;
}

/** Identidad única por corrida para no chocar con datos previos. */
function makeIdentity() {
    const stamp = Date.now().toString(36);
    return {
        company: `QA SinFuente ${stamp}`,
        nit: `9${String(Date.now()).slice(-8)}-7`, // válido para /^\d+-\d+$/
        contactEmail: `qa-${stamp}@example.com`,
    };
}

/** El formulario debe estar ABIERTO (evita falsos positivos) y sin campo fuente. */
async function assertNoSourceField(page, label) {
    await page.locator("#prospect-company").waitFor({ state: "visible", timeout: 15000 });
    const selectCount = await page.locator("#prospect-source").count();
    if (selectCount > 0) throw new Error(`${label}: el select #prospect-source sigue existiendo en el DOM.`);
    const textCount = await page.getByText("Fuente del Prospecto", { exact: false }).count();
    if (textCount > 0) throw new Error(`${label}: el texto "Fuente del Prospecto" sigue visible (${textCount} ocurrencias).`);
}

try {
    const session = await loginSession();
    browser = await chromium.launch({ headless: false, slowMo: 250 });

    // ── Escenario A: formulario nuevo sin "Fuente del Prospecto" ──
    {
        const context = await browser.newContext();
        await context.addInitScript(({ authenticatedSession, apiUrl }) => {
            localStorage.setItem("pika.auth.session", JSON.stringify(authenticatedSession));
            localStorage.setItem("pika.apiBaseUrl", apiUrl);
        }, { authenticatedSession: session, apiUrl: apiBaseUrl });

        const page = await openProspectsPage(context);
        console.log("[A] Página de prospectos abierta");
        await page.getByRole("button", { name: /Agregar Prospecto/i }).click();
        await assertNoSourceField(page, "[A]");
        console.log(JSON.stringify({ ok: true, scenario: "formulario-sin-fuente" }));
        await context.close();
    }

    // ── Escenarios B + C: creación end-to-end y detalle sin fuente (mismo contexto) ──
    const identity = makeIdentity();
    {
        const context = await browser.newContext();
        await context.addInitScript(({ authenticatedSession, apiUrl }) => {
            localStorage.setItem("pika.auth.session", JSON.stringify(authenticatedSession));
            localStorage.setItem("pika.apiBaseUrl", apiUrl);
        }, { authenticatedSession: session, apiUrl: apiBaseUrl });

        const page = await openProspectsPage(context);
        console.log("[B] Creando prospecto end-to-end:", identity.company);
        await page.getByRole("button", { name: /Agregar Prospecto/i }).click();
        await assertNoSourceField(page, "[B]");

        await page.locator("#prospect-company").fill(identity.company);
        await page.getByPlaceholder("por ejemplo, juanperez@example.com").fill(identity.contactEmail);
        await page.locator("#prospect-nit").fill(identity.nit);

        const saveBtn = page.locator('[data-testid="prospect-save-btn"]');
        await saveBtn.waitFor({ state: "visible", timeout: 15000 });
        if (!(await saveBtn.isEnabled())) {
            throw new Error("[B] El botón Guardar quedó deshabilitado con NIT y compañía válidos.");
        }
        await saveBtn.click();

        // Éxito = el formulario se cierra y vuelve la vista de búsqueda.
        try {
            await page.locator("#prospects-search").waitFor({ state: "visible", timeout: 30000 });
        } catch (error) {
            const alertTexts = await page.locator(".alert-danger").allTextContents();
            throw new Error(`[B] El guardado no cerró el formulario. Alertas: ${JSON.stringify(alertTexts)}. Original: ${String(error)}`);
        }

        // Verificación en la lista vía búsqueda.
        // El índice BM25 del backend se reconstruye cada 45s (solo ticker, sin hook de escritura):
        // tras crear el prospecto puede tardar hasta ~45s en indexarse. Además el match BM25 es
        // suelto (tokens comunes como "qa" traen cards antiguas), así que hay que esperar la fila
        // EXACTA del registro nuevo, nunca .first() del contenedor de resultados.
        const deadline = Date.now() + 95_000; // margen 2x sobre el intervalo de refresco del índice
        let exactRowFound = false;
        while (Date.now() < deadline && !exactRowFound) {
            await page.locator("#prospects-search").fill("");
            await page.waitForTimeout(150);
            await page.locator("#prospects-search").fill(identity.company);
            const exactRow = page.locator('[data-testid="prospect-search-results"] a.list-group-item', { hasText: identity.company });
            try {
                await exactRow.first().waitFor({ state: "visible", timeout: 3500 });
                exactRowFound = true;
            } catch {
                // El índice aún no incluye el registro nuevo; se reintenta refrescando la búsqueda.
            }
        }
        if (!exactRowFound) {
            throw new Error(`[B] El prospecto creado (${identity.company}) no aparece en la búsqueda tras reintentar 95s. Revisa el guardado y/o el refresco del índice de búsqueda del backend.`);
        }
        console.log(JSON.stringify({ ok: true, scenario: "creacion-end-to-end" }));

        // ── Escenario C: detalle del prospecto recién creado sin campo fuente ──
        const exactRow = page.locator('[data-testid="prospect-search-results"] a.list-group-item', { hasText: identity.company });
        await exactRow.first().click();
        await page.waitForURL(/\/app\/crm-prospectos\/[^/]+/, { timeout: 20000 });
        console.log("[C] Detalle abierto:", page.url());
        const notFound = await page.getByText("No encontramos el prospecto solicitado.").count();
        if (notFound > 0) throw new Error("[C] El detalle no encontró el prospecto recién creado.");
        await page.locator("h5").filter({ hasText: identity.company }).first().waitFor({ state: "visible", timeout: 15000 });

        const selectCount = await page.locator("#prospect-source").count();
        if (selectCount > 0) throw new Error("[C]: el select #prospect-source sigue existiendo en el detalle.");
        const textCount = await page.getByText("Fuente del Prospecto", { exact: false }).count();
        if (textCount > 0) throw new Error(`[C]: el texto "Fuente del Prospecto" sigue visible en el detalle (${textCount} ocurrencias).`);
        console.log(JSON.stringify({ ok: true, scenario: "detalle-sin-fuente", url: page.url() }));
        await context.close();
    }

    // ── Escenario D: clientes carga y sin campo fuente ──
    {
        const context = await browser.newContext();
        await context.addInitScript(({ authenticatedSession, apiUrl }) => {
            localStorage.setItem("pika.auth.session", JSON.stringify(authenticatedSession));
            localStorage.setItem("pika.apiBaseUrl", apiUrl);
        }, { authenticatedSession: session, apiUrl: apiBaseUrl });

        const page = await context.newPage();
        await page.goto(`${baseUrl}/app/crm-clientes`, { waitUntil: "domcontentloaded" });
        console.log("[D] Página de clientes abierta");
        await page.locator('[data-testid="clients-list-card"]').waitFor({ state: "visible", timeout: 20000 });

        const selectCount = await page.locator("#prospect-source").count();
        if (selectCount > 0) throw new Error("[D]: el select #prospect-source sigue existiendo en clientes.");
        const textCount = await page.getByText("Fuente del Prospecto", { exact: false }).count();
        if (textCount > 0) throw new Error(`[D]: el texto "Fuente del Prospecto" sigue visible en clientes (${textCount} ocurrencias).`);
        console.log(JSON.stringify({ ok: true, scenario: "clientes-sin-fuente" }));
        await context.close();
    }

    console.log("OK: campo 'Fuente del Prospecto' eliminado de formulario, detalle y clientes; creación end-to-end funciona.");
} catch (error) {
    console.error(error instanceof Error ? error.stack : String(error));
    process.exitCode = 1;
} finally {
    await browser?.close();
}
