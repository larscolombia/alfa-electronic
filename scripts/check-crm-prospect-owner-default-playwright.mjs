import { chromium } from "playwright";

const baseUrl = process.env.PW_BASE_URL || "http://localhost:4200";
const apiBaseUrl = process.env.PW_API_BASE_URL || "http://localhost:8080";
const email = "admin@alfa.com";
const password = "1234";
const DRAFT_KEY = "pika.form.draft.app.crm.prospects.form";

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

async function openProspectsPage(context, extraInit = {}) {
    const page = await context.newPage();
    await page.goto(`${baseUrl}/app/crm-prospectos`, { waitUntil: "domcontentloaded" });
    return page;
}

/** Aserta que el select #prospect-owner muestra exactamente `expected` (modelo y visible). */
async function assertOwnerFilled(page, expected) {
    const owner = page.locator("#prospect-owner");
    await owner.waitFor({ state: "attached", timeout: 15000 });
    await page.waitForTimeout(1500); // carga async de opciones RRHH

    const value = await owner.inputValue();
    const options = await owner.locator("option").allTextContents();
    console.log(JSON.stringify({ expected, value, options }));
    if (value !== expected) {
        throw new Error(`Empleado responsable esperado: ${expected}; recibido: ${value || "(vacío)"}`);
    }
}

try {
    const session = await loginSession();
    const expected = String(session?.user?.name || session?.user?.email || "").trim();
    if (!expected) throw new Error("La sesión autenticada no incluye nombre ni correo de usuario.");

    browser = await chromium.launch({ headless: false, slowMo: 250 });

    // ── Escenario A: clic en "Agregar Prospecto" precarga el empleado logueado ──
    {
        const context = await browser.newContext();
        await context.addInitScript(({ authenticatedSession, apiUrl }) => {
            localStorage.setItem("pika.auth.session", JSON.stringify(authenticatedSession));
            localStorage.setItem("pika.apiBaseUrl", apiUrl);
        }, { authenticatedSession: session, apiUrl: apiBaseUrl });

        const page = await openProspectsPage(context);
        console.log("[A] Ruta de prospectos abierta");
        await page.getByRole("button", { name: /Agregar Prospecto/i }).click();
        console.log("[A] Formulario de prospecto abierto por clic");
        await assertOwnerFilled(page, expected);
        console.log(JSON.stringify({ ok: true, scenario: "clic" }));
        await context.close();
    }

    // ── Escenario B: borrador viejo (formEmpleado vacío) no deja el select en blanco ──
    {
        const staleDraft = {
            updatedAt: new Date().toISOString(),
            data: {
                showProspectForm: true,
                selectedProspectZone: "",
                formCorreo: "",
                formCompania: "",
                formNit: "",
                formMovil: "",
                formSitioWeb: "",
                formTelefonoOficina: "",
                formPais: "Colombia",
                formCiudad: "",
                formDireccion: "",
                formEmpleado: "", // borrador guardado antes del default
                formFuente: "",
                formCiiuCode: "",
                formEstado: "Pendiente",
                formServicio: "",
                formNota: "",
                prospectBranches: [],
            },
        };

        const context = await browser.newContext();
        // OJO: el callback corre en contexto navegador; DRAFT_KEY (constante Node)
        // debe pasar como argumento, no referenciarse dentro del script.
        await context.addInitScript(({ authenticatedSession, apiUrl, draftKey, draft }) => {
            localStorage.setItem("pika.auth.session", JSON.stringify(authenticatedSession));
            localStorage.setItem("pika.apiBaseUrl", apiUrl);
            localStorage.setItem(draftKey, JSON.stringify(draft));
        }, { authenticatedSession: session, apiUrl: apiBaseUrl, draftKey: DRAFT_KEY, draft: staleDraft });

        const page = await openProspectsPage(context);
        console.log("[B] Página abierta con borrador viejo (formEmpleado vacío)");
        // El formulario se reabre solo por el borrador; sin clic.
        await assertOwnerFilled(page, expected);
        console.log(JSON.stringify({ ok: true, scenario: "borrador-viejo" }));
        await context.close();
    }

    // ── Escenario C: clic directo en el summary del <details> (toggle nativo) ──
    {
        const context = await browser.newContext();
        await context.addInitScript(({ authenticatedSession, apiUrl }) => {
            localStorage.setItem("pika.auth.session", JSON.stringify(authenticatedSession));
            localStorage.setItem("pika.apiBaseUrl", apiUrl);
        }, { authenticatedSession: session, apiUrl: apiBaseUrl });

        const page = await openProspectsPage(context);
        console.log("[C] Página fresca; abriendo el formulario por clic en el summary");
        // El summary se abre por comportamiento nativo de <details>, sin pasar
        // por openProspectForm(); el guard de onProspectFormToggle debe completar.
        await page.locator("#prospect-form-card > summary").click();
        await assertOwnerFilled(page, expected);
        console.log(JSON.stringify({ ok: true, scenario: "summary-toggle" }));
        await context.close();
    }

    console.log("OK: Empleado responsable autocompletado en los tres escenarios.");
} catch (error) {
    console.error(error instanceof Error ? error.stack : String(error));
    process.exitCode = 1;
} finally {
    await browser?.close();
}
