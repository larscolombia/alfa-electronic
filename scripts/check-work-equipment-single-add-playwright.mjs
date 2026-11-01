import { chromium } from "playwright";

/**
 * Suite visual: en /app/work-equipment-reception el botón "Agregar equipo" del modal
 * de recepción debe estar OCULTO (solo se registra un equipo a la vez).
 * La funcionalidad multi-item del modal sigue intacta; solo se oculta el botón.
 *
 * Escenarios:
 *   A) Creación nueva ("Nuevo equipo"): al llegar al paso "Equipos" NO existe
 *      [data-testid="equipment-modal-add-item"] y el flujo de un solo ítem queda sano
 *      (botón Eliminar deshabilitado con 1 ítem).
 *   B) Edición de una recepción existente: mismo assert en el paso "Equipos",
 *      verificando además que TODOS los ítems del registro siguen visibles.
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

/** Abre el modal (creación o edición), avanza al paso "Equipos" y aserta que el botón no existe. */
async function assertNoAddItemButtonOnEquipmentStep(page, label) {
    const nextBtn = page.locator('[data-testid="equipment-modal-next"]');
    await nextBtn.waitFor({ state: "visible", timeout: 15000 });

    // Paso recepción (sanity): el botón tampoco debe estar aquí.
    let addCount = await page.locator('[data-testid="equipment-modal-add-item"]').count();
    if (addCount > 0) throw new Error(`${label}: el botón "Agregar equipo" ya existe en el paso Recepción.`);

    // Avanza al paso Equipos (el draft por defecto es intakeMethod=personal, sin validaciones bloqueantes).
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

    addCount = await page.locator('[data-testid="equipment-modal-add-item"]').count();
    if (addCount > 0) throw new Error(`${label}: el botón "Agregar equipo" sigue existiendo en el paso Equipos de recepción.`);

    return equipmentCard;
}

try {
    const session = await loginSession();
    browser = await chromium.launch({ headless: false, slowMo: 250 });

    // ── Escenario A: creación nueva ──
    {
        const context = await browser.newContext();
        await context.addInitScript(({ authenticatedSession, apiUrl }) => {
            localStorage.setItem("pika.auth.session", JSON.stringify(authenticatedSession));
            localStorage.setItem("pika.apiBaseUrl", apiUrl);
        }, { authenticatedSession: session, apiUrl: apiBaseUrl });

        const page = await openReceptionPage(context);
        console.log("[A] Página de recepción abierta");
        await page.locator('[data-testid="work-equipment-create"]').click();
        await assertNoAddItemButtonOnEquipmentStep(page, "[A]");

        // Sanity del flujo de un solo ítem: con 1 equipo el botón Eliminar queda deshabilitado.
        const removeBtn = page.locator('[data-testid="equipment-modal-remove-item-0"]');
        if (!(await removeBtn.count())) throw new Error("[A]: no existe la tarjeta del único equipo (remove-item-0 ausente).");
        if (await removeBtn.isEnabled()) throw new Error("[A]: con un solo ítem el botón Eliminar debería estar deshabilitado.");

        await page.locator('[data-testid="equipment-modal-cancel"]').click();
        console.log(JSON.stringify({ ok: true, scenario: "creacion-nueva-sin-agregar-equipo" }));
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

        // Espera a que la tabla termine de cargar (filas o estado vacío).
        try {
            await page.locator("tbody [data-record-id]").first().waitFor({ state: "visible", timeout: 20000 });
        } catch {
            const emptyVisible = await page.locator('[data-testid="work-equipment-empty-state"]').isVisible().catch(() => false);
            if (!emptyVisible) throw new Error("[B]: la tabla no cargó ni filas ni estado vacío.");
            console.log(JSON.stringify({ ok: true, scenario: "edicion-sin-datos", skipped: true }));
            await context.close();
        }

        const firstRow = page.locator("tbody [data-record-id]").first();
        const recordId = await firstRow.getAttribute("data-record-id");
        // Cantidad de equipos declarada en la fila ("N equipo(s)").
        const itemsText = await firstRow.locator("td").first().innerText();
        const match = itemsText.match(/(\d+)\s+equipo/);
        const declaredItems = match ? Number(match[1]) : 0;

        await page.locator(`[data-testid="work-equipment-edit-${recordId}"]`).click();
        await assertNoAddItemButtonOnEquipmentStep(page, "[B]");

        // Todos los ítems del registro deben seguir visibles en el paso Equipos.
        const cardCount = await page.locator(".equipment-card").count();
        if (declaredItems > 0 && cardCount !== declaredItems) {
            throw new Error(`[B]: la fila declara ${declaredItems} equipo(s) pero el modal muestra ${cardCount} tarjeta(s).`);
        }

        await page.locator('[data-testid="equipment-modal-cancel"]').click();
        console.log(JSON.stringify({ ok: true, scenario: "edicion-sin-agregar-equipo", recordId, items: cardCount }));
        await context.close();
    }

    console.log("OK: botón 'Agregar equipo' oculto en recepción (creación y edición); flujo de un solo ítem intacto.");
} catch (error) {
    console.error(error instanceof Error ? error.stack : String(error));
    process.exitCode = 1;
} finally {
    await browser?.close();
}
