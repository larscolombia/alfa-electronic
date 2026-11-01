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

/** Lee modelo + render visible del select #prospect-owner en un solo salto a página. */
async function readOwnerState(page) {
    return page.evaluate(() => {
        const select = document.querySelector("#prospect-owner");
        if (!select) return null;
        // El usuario ve el wrapper de Choices, no el select nativo: si el item
        // visible difiere del modelo, una suite solo-DOM da verde igual (falso verde).
        const wrapper = select.closest(".choices") || select.parentElement;
        const list = wrapper ? wrapper.querySelector(".choices__list.choices__list--single") : null;
        const visibleText = list
            ? (list.textContent || "").trim()
            : (wrapper ? (wrapper.innerText || "").trim() : "");
        return {
            value: select.value,
            visibleText,
            options: Array.from(select.options).map((option) => option.textContent.trim()),
        };
    });
}

/** Aserta que #prospect-owner termina mostrando `expected` en modelo Y render visible.
 * RRHH puede tardar (escenario D) o caer (E): se espera activamente hasta la
 * coincidencia con tope de 12s; el valor SIEMPRE debe llegar autocompletado. */
async function assertOwnerFilled(page, expected) {
    const owner = page.locator("#prospect-owner");
    await owner.waitFor({ state: "attached", timeout: 15000 });

    const deadline = Date.now() + 12000;
    let state = null;
    while (Date.now() < deadline) {
        state = await readOwnerState(page);
        if (state && state.value === expected && state.visibleText === expected) break;
        await page.waitForTimeout(250);
    }
    console.log(JSON.stringify({ expected, ...(state ?? { value: null, visibleText: null, options: [] }) }));
    if (!state || !state.value) {
        throw new Error(`Empleado responsable esperado en el modelo: ${expected}; recibido vacío tras 12s de espera.`);
    }
    if (state.value !== expected) {
        throw new Error(`Empleado responsable esperado en el modelo: ${expected}; recibido: ${state.value || "(vacío)"}.`);
    }
    if (state.visibleText !== expected) {
        throw new Error(`Empleado responsable visible para el usuario: ${JSON.stringify(state.visibleText)}; esperado: ${expected}. El select nativo tiene valor pero Choices no lo pinta.`);
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

    // ── Escenario D: RRHH responde LENTO (la opción llega después de que ngModel escribió el valor) ──
    {
        const context = await browser.newContext();
        await context.addInitScript(({ authenticatedSession, apiUrl }) => {
            localStorage.setItem("pika.auth.session", JSON.stringify(authenticatedSession));
            localStorage.setItem("pika.apiBaseUrl", apiUrl);
        }, { authenticatedSession: session, apiUrl: apiBaseUrl });

        const page = await context.newPage();
        // El endpoint de RRHH tarda 2.5s en responder: el formulario se abre con
        // formEmpleado escrito pero SIN su <option> todavía (la carrera real).
        // La route debe existir ANTES del goto: la llamada sale en ngOnInit.
        await page.route(/crm-equipment\/technicians/, async (route) => {
            await new Promise((resolve) => setTimeout(resolve, 2500));
            await route.continue();
        });
        await page.goto(`${baseUrl}/app/crm-prospectos`, { waitUntil: "domcontentloaded" });
        console.log("[D] RRHH lento; abriendo formulario por clic");
        await page.getByRole("button", { name: /Agregar Prospecto/i }).click();
        await assertOwnerFilled(page, expected);
        console.log(JSON.stringify({ ok: true, scenario: "rrhh-lento" }));
        await context.close();
    }

    // ── Escenario E: RRHH caído (optionsFor resuelve [] + current vía merge) ──
    {
        const context = await browser.newContext();
        await context.addInitScript(({ authenticatedSession, apiUrl }) => {
            localStorage.setItem("pika.auth.session", JSON.stringify(authenticatedSession));
            localStorage.setItem("pika.apiBaseUrl", apiUrl);
        }, { authenticatedSession: session, apiUrl: apiBaseUrl });

        const page = await context.newPage();
        // Aborto ANTES del goto: ngOnInit dispara la primera llamada a RRHH.
        await page.route(/crm-equipment\/technicians/, (route) => route.abort());
        await page.goto(`${baseUrl}/app/crm-prospectos`, { waitUntil: "domcontentloaded" });
        console.log("[E] RRHH caído; abriendo formulario por clic");
        await page.getByRole("button", { name: /Agregar Prospecto/i }).click();
        await assertOwnerFilled(page, expected);
        console.log(JSON.stringify({ ok: true, scenario: "rrhh-caido" }));
        await context.close();
    }

    console.log("OK: Empleado responsable autocompletado en los cinco escenarios (modelo + render visible).");
} catch (error) {
    console.error(error instanceof Error ? error.stack : String(error));
    process.exitCode = 1;
} finally {
    await browser?.close();
}
