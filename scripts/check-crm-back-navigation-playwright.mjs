// Suite visual "Volver" — valida la pila compartida (AppBackNavigationService)
// tal y como se ve en la UI, sin tocar el API directamente para navegar.
//
// Escenarios:
//   A. Stack compartido por clics de UI: main-menu -> CRM/Clientes (búsqueda -> ficha)
//      -> botón "Volver" de la ficha regresa al listado; luego el "Volver" del header
//      regresa a main-menu (mismo stack, sin re-empujar la página saliente).
//   B. Carga directa a ficha (sin historial SPA): "Volver" cae al fallback determinista.
//   C. Carga directa a panel de inventario: "Volver al panel" cae a /app/inventory-dashboard.

import { chromium } from "playwright";

const appUrl = process.env.PW_BASE_URL || "http://localhost:4200";
const apiUrl = process.env.PW_API_BASE_URL || "http://localhost:8080";

let browser;
const failures = [];

function assertUrl(label, actual, expectedRe) {
    if (!expectedRe.test(actual)) {
        failures.push(`${label}: se esperaba ${expectedRe}, llegó "${actual}".`);
        return false;
    }
    console.log(`ok - ${label} -> ${actual}`);
    return true;
}

// Clic "Volver" tolerante a la ventana donde el DOM ya pinta pero Angular
// aún no ha enganchado los listeners (pasa en carga directa tras domcontentloaded):
// reintenta hasta que la URL efectivamente cambie.
async function clickBackUntil(page, backLocator, expectedRe, label) {
    for (let attempt = 1; attempt <= 6; attempt++) {
        try {
            // En prod la ficha puede estar cargando datos y re-renderizar el DOM
            // (el boton se detacha); resolver + verificar estabilidad por intento.
            await backLocator.waitFor({ state: "visible", timeout: 4000 });
            await backLocator.click({ timeout: 5000 });
        } catch { // El DOM re-renderizo a mitad del clic: reintenta de cero.
            await page.waitForTimeout(300);
            continue;
        }
        await page.waitForTimeout(400);
        if (expectedRe.test(page.url())) break;
    }
    assertUrl(label, page.url(), expectedRe);
}

async function loginAndSeed(page) {
    const response = await fetch(`${apiUrl}/api/v1/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Company-Id": "demo-company" },
        body: JSON.stringify({ email: process.env.PW_ADMIN_EMAIL || "admin@alfa.com", password: process.env.PW_ADMIN_PASSWORD || "1234" }),
    });
    if (!response.ok) throw new Error(`Login admin falló (${response.status}).`);
    const login = await response.json();
    const session = { ...login, expiresAt: Date.now() + login.expiresIn * 1000 };

    const headers = { Authorization: `Bearer ${login.accessToken}`, "X-Company-Id": "demo-company" };
    const clientResponse = await fetch(`${apiUrl}/api/v1/crm/clients?limit=1`, { headers });
    if (!clientResponse.ok) throw new Error(`No se pudo listar clientes (${clientResponse.status}).`);
    const [client] = ((await clientResponse.json()).items ?? []);
    if (!client?.id) throw new Error("Se requiere al menos un cliente para verificar los botones Volver.");

    await page.addInitScript(({ storedSession, storedApiUrl }) => {
        localStorage.setItem("pika.auth.session", JSON.stringify(storedSession));
        localStorage.setItem("pika.apiBaseUrl", storedApiUrl);
    }, { storedSession: session, storedApiUrl: apiUrl });

    return client;
}

try {
    browser = await chromium.launch({ headless: true });

    // ── A. Pila compartida por navegación de UI ──────────────────────────────
    {
        const page = await browser.newPage();
        const client = await loginAndSeed(page);

        await page.goto(`${appUrl}/app/main-menu`, { waitUntil: "domcontentloaded" });
        // Acordeón CRM -> subgrid -> enlace "Clientes".
        await page.locator("button.mm-icon-btn", { hasText: "CRM" }).first().click();
        await page.locator(".mm-grid--sub a.mm-icon-btn", { hasText: "Clientes" }).first().click();
        await page.waitForURL(/\/app\/crm-clientes$/, { timeout: 20000 });

        // Búsqueda -> ficha del cliente (navegación SPA, empuja el listado al stack).
        const searchTerm = client.empresa || client.name || client.nit || String(client.id);
        await page.getByTestId("clients-search").fill(searchTerm);
        const resultLink = page.locator('[data-testid="client-search-results"] a').first();
        await resultLink.waitFor({ state: "visible", timeout: 20000 });
        await resultLink.click();
        // El id puede ser numerico (BD local) o UUID (produccion): aceptar ambos.
        await page.waitForURL(/\/app\/crm-clientes\/[^/?#]+/, { timeout: 20000 });

        // Botón de la ficha (no el del header): regresa al listado por el stack.
        const back = page.locator(".page-title button", { hasText: "Volver" }).first();
        await clickBackUntil(page, back, /\/app\/crm-clientes$/, "A1 ficha->listado (stack)");

        // Header ahora consume el mismo stack: debe llegar a main-menu.
        const headerBack = page.locator("button.pika-rail-back").first();
        await clickBackUntil(page, headerBack, /\/app\/main-menu/, "A2 listado->main-menu (stack compartido)");

        if (failures.length === 0) console.log(JSON.stringify({ scenarioA: true }));
    }

    // ── B. Carga directa a ficha sin historial -> fallback determinista ───────
    {
        const page = await browser.newPage();
        const client = await loginAndSeed(page);

        await page.goto(`${appUrl}/app/crm-clientes/${client.id}`, { waitUntil: "domcontentloaded" });
        const back = page.locator(".page-title button", { hasText: "Volver" }).first();
        await clickBackUntil(page, back, /\/app\/crm-clientes$/, "B carga directa ficha->fallback listado");
    }

    // ── C. Carga directa a panel de inventario -> fallback del botón convertido ─
    {
        const page = await browser.newPage();
        await loginAndSeed(page);

        await page.goto(`${appUrl}/app/inventory-movements`, { waitUntil: "domcontentloaded" });
        const back = page.locator("button", { hasText: "Volver al panel" }).first();
        await clickBackUntil(page, back, /\/app\/inventory-dashboard/, "C movimientos->inventory-dashboard (fallback)");
    }

    if (failures.length > 0) {
        console.error(failures.join("\n"));
        process.exitCode = 1;
    } else {
        console.log(JSON.stringify({ ok: true, scenarios: ["A", "B", "C"] }));
    }
} catch (error) {
    console.error(error instanceof Error ? error.stack : String(error));
    process.exitCode = 1;
} finally {
    await browser?.close();
}
