/**
 * CRM — Selects del modal "Agregar Seguimiento" + precarga de "Empleado responsable".
 *
 * Verifica (UI, modo no-headless opcional) que los dos selects afectados por el
 * fix `applyBoundValue` funcionan como un usuario real:
 *
 *   1. "Accion comercial realizada" — al hacer click DESPLIEGA su lista de opciones
 *      visibles y permite ligar una opción (valor nativo + texto visible).
 *   2. "Empleado responsable" (formulario de prospecto) — PRECARGA el empleado logueado,
 *      aunque las opciones carguen async después de fijarse el modelo.
 *
 * Detección de dropdown abierto por la clase canónica de Choices v11 que usa esta app:
 * `.choices__list--dropdown.is-active` / `.is-visible` (verificado con probes ad-hoc durante el desarrollo),
 * con respaldo en `.is-open`. Nunca se escribe el modelo Angular ni se consulta una API
 * para fijar valores: todo por interacción de UI.
 */
import path from "node:path";
import { promises as fs } from "node:fs";
import { chromium } from "playwright";

const baseUrl = (process.env.PW_BASE_URL || "https://alfa.software.net.co").replace(/\/+$/, "");
// Origen del API: igual que la app en prod; en local dev (:4200) apunta al backend
// directo (http://localhost:8080) porque el dev server no tiene proxy de /api.
const apiOrigin = (process.env.PW_API_ORIGIN || baseUrl).replace(/\/+$/, "");
const email = process.env.PW_USER_EMAIL || "admin@alfa.com";
const password = process.env.PW_USER_PASSWORD || "1234";
const headless = !["false", "0", "no"].includes((process.env.PW_HEADLESS || "true").toLowerCase());
const slowMo = Number(process.env.PW_SLOW_MO_MS || "150");
const timeout = Number(process.env.PW_TIMEOUT_MS || "30000");

const artifacts = path.resolve("playwright-artifacts/crm-followup-selects");
const result = {
    baseUrl,
    login: false,
    prospectId: "",
    prospectName: "",
    accionComercial: { opens: false, optionCount: 0, sampleOptions: [], pickedLabel: "", nativeValue: "", visibleText: "" },
    empleadoResponsable: { expected: "", value: "", visibleText: "" },
    screenshots: [],
    error: "",
};

async function capture(page, step) {
    try {
        const file = path.join(artifacts, `${step}.png`);
        await page.screenshot({ path: file, fullPage: true });
        result.screenshots.push(file);
    } catch { /* screenshot no bloqueante */ }
}

let browser;
try {
    // Login vía API (mismo contrato que la app) → sesión inyectada en localStorage.
    const loginRes = await fetch(`${apiOrigin}/api/v1/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
    });
    if (!loginRes.ok) throw new Error(`Login falló (${loginRes.status}) — ver credenciales`);
    const login = await loginRes.json();
    const session = { ...login, expiresAt: Date.now() + (login.expiresIn || 3600) * 1000 };
    const expectedUser = String(session?.user?.name || session?.user?.email || "").trim();

    browser = await chromium.launch({ headless, slowMo });
    const page = await (await browser.newContext({ viewport: { width: 1540, height: 980 } })).newPage();
    page.on("pageerror", (e) => console.error("[PAGEERROR]", e.message.slice(0, 200)));
    await page.addInitScript(({ s, url }) => {
        localStorage.setItem("pika.auth.session", JSON.stringify(s));
        localStorage.setItem("pika.apiBaseUrl", url);
    }, { s: session, url: apiOrigin });

    // Un prospecto real (solo leemos su id; no mutamos datos).
    const listRes = await fetch(`${apiOrigin}/api/v1/crm/prospects`, { headers: { Authorization: `Bearer ${session.accessToken}` } });
    if (!listRes.ok) throw new Error(`No pude listar prospectos (${listRes.status})`);
    const prospect = (await listRes.json()).items?.[0];
    if (!prospect?.id) throw new Error("No hay prospectos disponibles para probar el modal");
    result.prospectId = prospect.id;
    result.prospectName = prospect.name || "";
    console.log(`Prospecto de prueba: ${result.prospectName}`);

    // ── 1. Modal "Agregar Seguimiento": select "Accion comercial realizada" ────────
    await page.goto(`${baseUrl}/app/crm-prospectos/${prospect.id}`, { waitUntil: "domcontentloaded", timeout });
    const tab = page.getByRole("tab", { name: /Acciones comerciales/i }).first();
    await tab.waitFor({ state: "visible", timeout });
    await tab.click();
    await page.waitForTimeout(1200);
    await page.getByRole("button", { name: /Nueva accion comercial|Nueva acción comercial/i }).first().click({ timeout, force: true });

    const modal = page.locator(".modal-dialog", { hasText: "Agregar Seguimiento" });
    await modal.waitFor({ state: "visible", timeout });
    result.login = true; // si llegamos acá la sesión es válida (el detalle cargó)
    await capture(page, "01-modal-seguimiento");

    const accion = { ...result.accionComercial };
    // Localizar el select nativo por su label (Choices lo envuelve pero el <select> sigue en el DOM).
    const nativeSelect = modal.locator('label:has-text("Accion comercial realizada")').locator("xpath=following::select[1]");
    await nativeSelect.waitFor({ state: "attached", timeout });

    accion.optionCount = (await nativeSelect.locator("option").all()).length;
    if (accion.optionCount <= 1) throw new Error(`Carga async de opciones falló: solo ${accion.optionCount} opción(es)`);
    accion.sampleOptions = (await nativeSelect.locator("option").allTextContents()).slice(1, 5).map((t) => t.trim());

    // ── Apertura y selección con MOUSE CRUDO sobre .choices__inner ──────────────
    // Choices v11 registra su _onClick en <html> (documentElement) y exige que el
    // event.target esté dentro del contenedor .choices; locator.click() de Playwright
    // no logra abrir el dropdown en este DOM, pero la secuencia move/down/up cruda sí
    // (verificado con un probe ad-hoc durante el desarrollo: abre en <1 s). Por eso toda esta sección
    // usa coordenadas + page.mouse, sin locator.click().
    // aria-label que SelectEnhancementService garantiza en el <select> (resolveAccessibleName).
    const ACCION_ARIA = /accion comercial/i;

    // v11 renderiza las opciones como div[role="option"] (NO <li>), dentro del modal
    // abierto (.modal.show) para no confundirlo con selects de la página de fondo.
    const accionDropdownState = () => page.evaluate((re) => {
        const root = document.querySelector(".modal.show") || document;
        const sel = Array.from(root.querySelectorAll("select")).find((s) => new RegExp(re, "i").test(s.getAttribute("aria-label") || ""));
        const dd = sel?.closest(".choices")?.querySelector(".choices__list--dropdown");
        if (!dd) return { open: false, items: 0, texts: [] };
        const opts = Array.from(dd.querySelectorAll('[role="option"]'));
        return {
            open: dd.classList.contains("is-active") || dd.classList.contains("is-visible"),
            items: opts.length,
            texts: opts.map((o) => (o.textContent || "").trim()),
        };
    }, ACCION_ARIA.source);

    const innerCenter = await page.evaluate((re) => {
        const root = document.querySelector(".modal.show") || document;
        const sel = Array.from(root.querySelectorAll("select")).find((s) => new RegExp(re, "i").test(s.getAttribute("aria-label") || ""));
        const inner = sel?.closest(".choices")?.querySelector(".choices__inner");
        if (!inner) return null;
        const b = inner.getBoundingClientRect();
        return { x: b.x + b.width / 2, y: b.y + b.height / 2 };
    }, ACCION_ARIA.source);
    if (!innerCenter) throw new Error('"Accion comercial realizada": no encontré el wrapper .choices__inner del select');

    // move/down/up crudos = un clic humano real (misma secuencia que __probe-tmp.mjs).
    const rawMouseClick = async (pos) => {
        await page.mouse.move(pos.x, pos.y);
        await page.waitForTimeout(150);
        await page.mouse.down();
        await page.waitForTimeout(80);
        await page.mouse.up();
    };

    const waitAccionDropdown = async () => {
        for (let i = 0; i < 10; i++) {
            const s = await accionDropdownState();
            if (s.open) return s;
            await page.waitForTimeout(150);
        }
        return accionDropdownState();
    };

    await rawMouseClick(innerCenter);
    let ddState = await waitAccionDropdown();
    if (!ddState.open) {
        // Como un usuario: reintentar el clic una vez más (el dropdown seguía cerrado, no se togglea).
        console.warn("Primer clic no abrió el dropdown — reintento con mouse crudo");
        await rawMouseClick(innerCenter);
        ddState = await waitAccionDropdown();
    }
    accion.opens = ddState.open;

    if (!accion.opens) {
        // FALLO DURO: no hay fallback silencioso. selectOption sobre el <select hidden>
        // era justo lo que rompía la suite (timeout de visibilidad).
        throw new Error(`"Accion comercial realizada": clic real no abrió el dropdown (items=${ddState.items})`);
    }

    // Seleccionar la primera opción REAL desde el desplegable abierto, por mouse crudo.
    const firstRealLabel = accion.sampleOptions[0];
    await page.waitForTimeout(250); // deja asentar los items del dropdown
    // v11: cada opción es div[role="option"]; la selección se dispara por mousedown
    // (_onMouseDown → _handleChoiceAction), que rawMouseClick cubre.
    const optCenter = await page.evaluate((label) => {
        const root = document.querySelector(".modal.show") || document;
        const sel = Array.from(root.querySelectorAll("select")).find((s) => /accion comercial/i.test(s.getAttribute("aria-label") || ""));
        const dd = sel?.closest(".choices")?.querySelector(".choices__list--dropdown");
        if (!dd) return null;
        for (const li of Array.from(dd.querySelectorAll('[role="option"]'))) {
            const t = (li.textContent || "").trim();
            if (t === label.trim() || t.toLowerCase().includes(label.toLowerCase())) {
                const b = li.getBoundingClientRect();
                if (b.width > 0 && b.height > 0) return { x: b.x + b.width / 2, y: b.y + b.height / 2 };
            }
        }
        return null; // si no hay coincidencia, mejor fallar que adivinar un item
    }, firstRealLabel);
    if (!optCenter) throw new Error(`"Accion comercial realizada": la opción "${firstRealLabel}" no está en el dropdown abierto`);
    await rawMouseClick(optCenter);
    await page.waitForTimeout(600);

    accion.pickedLabel = firstRealLabel;
    accion.nativeValue = (await nativeSelect.inputValue().catch(() => "")) || "";
    // Texto visible dentro del wrapper Choices DE ESTE select (no el de otro select del modal).
    accion.visibleText = await page.evaluate((re) => {
        const root = document.querySelector(".modal.show") || document;
        const sel = Array.from(root.querySelectorAll("select")).find((s) => new RegExp(re, "i").test(s.getAttribute("aria-label") || ""));
        return (sel?.closest(".choices")?.querySelector(".choices__item--selectable")?.textContent || "").trim();
    }, ACCION_ARIA.source);
    result.accionComercial = accion;

    if (!accion.nativeValue) throw new Error(`"Accion comercial realizada": no quedó fijado ningún valor tras seleccionar`);
    console.log(JSON.stringify({ step: "accion-comercial", ...accion }, null, 1));
    await capture(page, "02-accion-seleccionada");

    // Regresión del cierre por backdrop (fix select): un clic DENTRO del contenido no debe
    // cerrar el modal; un clic en el fondo (.modal, fuera del dialog) SÍ debe cerrarlo.
    const followupDialog = page.locator('.modal-dialog', { hasText: 'Agregar Seguimiento' });
    await followupDialog.locator("h5.modal-title").click({ timeout: 5000 }).catch(() => {});
    await page.waitForTimeout(300);
    if ((await followupDialog.count()) === 0) throw new Error("Regresión: un clic dentro del modal lo cerró");
    await page.mouse.click(6, 6); // esquina superior izquierda = zona de fondo (.modal)
    await page.waitForTimeout(400);
    if ((await followupDialog.count()) !== 0) {
        throw new Error("Regresión: un clic en el fondo del modal no lo cerró");
    }
    console.log(JSON.stringify({ step: "backdrop-regression", ok: true }, null, 1));

    // ── 2. Formulario de prospecto: "Empleado responsable" precarga el logueado ─────
    await page.goto(`${baseUrl}/app/crm-prospectos`, { waitUntil: "domcontentloaded", timeout });
    await page.getByRole("button", { name: /Agregar Prospecto/i }).click();
    const owner = page.locator("#prospect-owner");
    await owner.waitFor({ state: "attached", timeout });
    await page.waitForTimeout(1500); // da tiempo a la carga async de opciones

    result.empleadoResponsable.expected = expectedUser;
    result.empleadoResponsable.value = (await owner.inputValue().catch(() => "")) || "";
    const ownerInner = owner.locator("xpath=ancestor::div[contains(@class,'choices')][1]//div[@class='choices__item--selectable']").first();
    result.empleadoResponsable.visibleText = (await ownerInner.textContent({ timeout: 2000 }).catch(() => "") || "").trim();

    if (!result.empleadoResponsable.value) throw new Error(`"Empleado responsable": el modelo no tiene valor precargado`);
    console.log(JSON.stringify({ step: "empleado-responsable", ...result.empleadoResponsable }, null, 1));
} catch (error) {
    result.error = String(error?.stack || error);
    const page = browser?.contexts()?.[0]?.pages()?.[0];
    if (page) await capture(page, "99-error");
} finally {
    if (browser) await browser.close();
}

await fs.mkdir(artifacts, { recursive: true }).catch(() => {});
await fs.writeFile(path.join(artifacts, `result-${Date.now()}.json`), JSON.stringify(result, null, 2)).catch(() => {});
console.log(JSON.stringify({ ...result, screenshots: undefined }, null, 2));

const pass =
    !result.error &&
    result.accionComercial.opens === true &&
    result.accionComercial.nativeValue !== "" &&
    result.empleadoResponsable.value === result.empleadoResponsable.expected;
process.exit(pass ? 0 : 1);
