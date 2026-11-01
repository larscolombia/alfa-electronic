import { chromium } from "playwright";

/**
 * Suite visual: el campo "Ubicación de almacenamiento" del modal de equipos debe ser
 * de libre diligenciamiento EN MAYÚSCULAS (acepta letras y números) y SIN lista
 * desplegable (<datalist> removido). El modal es compartido; se verifica en recepción
 * (/app/work-equipment-reception), su vista con trigger visible.
 *
 * Escenarios:
 *   A) Creación nueva ("Nuevo equipo"): en el paso "Equipos" NO existe <datalist>,
 *      se digita texto mixto (letras + números) y el campo fuerza mayúsculas
 *      tanto en el input como en la tarjeta del equipo.
 *   B) Edición de una recepción existente: sin datalist; re-digitar en minúscula
 *      vuelve a forzar mayúsculas sobre el valor guardado.
 */

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

async function openReceptionPage(context) {
    const page = await context.newPage();
    await page.goto(`${baseUrl}/app/work-equipment-reception`, { waitUntil: "domcontentloaded" });
    return page;
}

/** Abre el modal (creación o edición) y avanza al paso "Equipos". */
async function goToEquipmentStep(page, label) {
    const nextBtn = page.locator('[data-testid="equipment-modal-next"]');
    await nextBtn.waitFor({ state: "visible", timeout: 15000 });

    // El draft por defecto es intakeMethod=personal → avanza con un clic.
    await nextBtn.click();

    const equipmentCard = page.locator(".equipment-card").first();
    try {
        await equipmentCard.waitFor({ state: "visible", timeout: 15000 });
    } catch (error) {
        const validationText = await page.locator('[data-testid="equipment-modal-validation-message"]').innerText().catch(() => "(sin mensaje de validación)");
        throw new Error(`${label}: no se pudo llegar al paso Equipos. Validación: ${validationText}. Original: ${String(error)}`);
    }
    if (!(await page.locator('[data-testid="equipment-modal-previous"]').isVisible())) {
        throw new Error(`${label}: no se llegó al paso Equipos (el botón Atrás no está visible).`);
    }
    return equipmentCard;
}

/** La lista desplegable (datalist) debe estar removida del modal. */
async function assertNoDatalist(page, label) {
    const datalistCount = await page.locator("datalist").count();
    if (datalistCount > 0) throw new Error(`${label}: sigue existiendo <datalist> en el modal (${datalistCount}); la lista desplegable no fue removida.`);
}

try {
    const session = await loginSession();
    browser = await chromium.launch({ headless: false, slowMo: 250 });

    // ── Escenario A: creación nueva — mayúsculas + números, sin datalist ──
    {
        const context = await browser.newContext();
        await context.addInitScript(({ authenticatedSession, apiUrl }) => {
            localStorage.setItem("pika.auth.session", JSON.stringify(authenticatedSession));
            localStorage.setItem("pika.apiBaseUrl", apiUrl);
        }, { authenticatedSession: session, apiUrl: apiBaseUrl });

        const page = await openReceptionPage(context);
        console.log("[A] Página de recepción abierta");
        await page.locator('[data-testid="work-equipment-create"]').click();
        await goToEquipmentStep(page, "[A]");
        await assertNoDatalist(page, "[A]");

        const storageInput = page.locator('[data-testid="equipment-modal-storage-location-0"]');
        await storageInput.waitFor({ state: "visible", timeout: 15000 });

        // Texto mixto con letras y números; el campo debe forzar mayúsculas al escribir.
        const suffix = Date.now().toString(36).toUpperCase();
        const typedValue = `bodega qa ${suffix}`;
        await storageInput.fill(typedValue);
        const upperExpected = typedValue.toUpperCase();
        const actualValue = await storageInput.inputValue();
        if (actualValue !== upperExpected) throw new Error(`[A]: el campo no fuerza mayúsculas. Esperado "${upperExpected}", recibido "${actualValue}".`);

        // La tarjeta del equipo refleja la ubicación en mayúsculas.
        const cardText = await page.locator(".equipment-card").first().innerText();
        if (!cardText.includes(`Ubicación ${upperExpected}`)) throw new Error(`[A]: la tarjeta no muestra "Ubicación ${upperExpected}".`);

        // Blur/change: resuelve/crea la ubicación sin mostrar error de validación.
        await storageInput.press("Tab");
        await page.waitForTimeout(1200);
        const validationVisible = await page.locator('[data-testid="equipment-modal-validation-message"]').isVisible().catch(() => false);
        if (validationVisible) {
            const msg = await page.locator('[data-testid="equipment-modal-validation-message"]').innerText();
            throw new Error(`[A]: tras digitar la ubicación apareció un error de validación: ${msg}`);
        }

        await page.locator('[data-testid="equipment-modal-cancel"]').click();
        console.log(JSON.stringify({ ok: true, scenario: "ubicacion-mayusculas-sin-datalist", value: upperExpected }));
        await context.close();
    }

    // ── Escenario B: edición de una recepción existente (si hay datos) ──
    {
        const context = await browser.newContext();
        await context.addInitScript(({ authenticatedSession, apiUrl }) => {
            localStorage.setItem("pika.auth.session", JSON.stringify(authenticatedSession));
            localStorage.setItem("pika.apiBaseUrl", apiUrl);
        }, { authenticatedSession: session, apiUrl: apiBaseUrl });

        const page = await openReceptionPage(context);
        console.log("[B] Página de recepción abierta (edición)");

        try {
            await page.locator("tbody [data-record-id]").first().waitFor({ state: "visible", timeout: 20000 });
        } catch {
            const emptyVisible = await page.locator('[data-testid="work-equipment-empty-state"]').isVisible().catch(() => false);
            if (!emptyVisible) throw new Error("[B]: la tabla no cargó ni filas ni estado vacío.");
            console.log(JSON.stringify({ ok: true, scenario: "edicion-ubicacion-mayusculas", skipped: true }));
            await context.close();
        }

        const firstRow = page.locator("tbody [data-record-id]").first();
        const recordId = await firstRow.getAttribute("data-record-id");

        await page.locator(`[data-testid="work-equipment-edit-${recordId}"]`).click();
        await goToEquipmentStep(page, "[B]");
        await assertNoDatalist(page, "[B]");

        const storageInput = page.locator('[data-testid="equipment-modal-storage-location-0"]');
        await storageInput.waitFor({ state: "visible", timeout: 15000 });

        // Re-digitar en minúscula debe volver a forzar mayúsculas (sobre el valor guardado).
        const retyped = `estanteria b ${Date.now().toString(36).toUpperCase()}`;
        await storageInput.fill(retyped);
        const actualValue = await storageInput.inputValue();
        if (actualValue !== retyped.toUpperCase()) throw new Error(`[B]: al editar, el campo no fuerza mayúsculas. Esperado "${retyped.toUpperCase()}", recibido "${actualValue}".`);

        await page.locator('[data-testid="equipment-modal-cancel"]').click();
        console.log(JSON.stringify({ ok: true, scenario: "edicion-ubicacion-mayusculas", recordId }));
        await context.close();
    }

    console.log("OK: ubicación de almacenamiento en mayúsculas (letras y números), sin lista desplegable.");
} catch (error) {
    console.error(error instanceof Error ? error.stack : String(error));
    process.exitCode = 1;
} finally {
    await browser?.close();
}
