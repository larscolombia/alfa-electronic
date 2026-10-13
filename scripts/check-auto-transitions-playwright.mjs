/**
 * Playwright headless test — Transiciones automaticas del flujo tecnico
 *
 * Verifies (board "Flujo tecnico de reparacion", /app/work-projects):
 *  - Seeding: projects injected into localStorage (lars.projects.items.v3) render on the board
 *  - Pruebas -> listo-entrega: card in "pruebas" with a real closing test type moves
 *    to "listo-entrega" after clicking "Finalizar pruebas y marcar listo" (success toast shown)
 *  - Negative: card in "pruebas" with testType "sin-pruebas" and no checklist stays put
 *    and shows a clear validation error
 *  - Parts-request auto-advance (diagnostico/por-cotizar -> reparacion on material
 *    reservation / purchase line / purchase request) is covered by unit tests
 *    (scripts/test-auto-transitions-logic.mjs); seeding the inventory references
 *    required by the live reservation form is too fragile for this environment (see observations)
 *  - Cleanup: seeded projects are removed from localStorage at the end
 *
 * Exit codes: 0 = all checks passed, 1 = failure
 */

import path from "node:path";
import { promises as fs } from "node:fs";
import { chromium } from "playwright";

const baseUrl = process.env.PW_BASE_URL || "https://alfa.software.net.co";
const timeoutMs = Number(process.env.PW_TIMEOUT_MS || "120000");
const headless = !["false", "0", "no"].includes((process.env.PW_HEADLESS || "true").toLowerCase());
const slowMoMs = Number(process.env.PW_SLOW_MO_MS || "0");
const userEmail = process.env.PW_USER_EMAIL || "admin@alfa.com";
const userPassword = process.env.PW_USER_PASSWORD || "1234";
const companyId = process.env.PW_COMPANY_ID || "demo-company";
const artifactsDir = process.env.PW_ARTIFACTS_DIR || "playwright-artifacts";

const normalizedBaseUrl = baseUrl.replace(/\/+$/, "");
const apiBaseUrl = (() => {
    if (process.env.PW_API_BASE_URL) return String(process.env.PW_API_BASE_URL).replace(/\/+$/, "");
    return new URL(normalizedBaseUrl).origin;
})();

const stamp = Date.now();
const seedIds = {
    pruebasOk: `qa-auto-pruebas-ok-${stamp}`,
    pruebasSin: `qa-auto-pruebas-sin-${stamp}`,
    diagnostico: `qa-auto-diagnostico-${stamp}`,
};

const result = {
    test: "auto-transitions",
    requirement: "Pruebas->listo-entrega con boton validado; repuestos avanzan diagnostico/por-cotizar a reparacion",
    baseUrl: normalizedBaseUrl,
    checks: {
        loggedIn: false,
        boardLoaded: false,
        seedRendered: false,
        finishTestsButtonVisible: false,
        pruebasMovedToListo: false,
        successToastShown: false,
        negativeBlockedWithMessage: false,
        negativeStaysInPruebas: false,
        cleanupDone: false,
    },
    observations: [],
    consoleErrors: [],
    pageErrors: [],
    screenshotPath: "",
    error: "",
};

let browser;
let session;

function pushUnique(target, text) {
    const value = String(text || "").trim();
    if (!value || target.includes(value)) return;
    if (target.length < 20) target.push(value);
}

async function login() {
    const response = await fetch(`${apiBaseUrl}/api/v1/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Company-Id": companyId },
        body: JSON.stringify({ email: userEmail, password: userPassword }),
    });
    if (!response.ok) throw new Error(`login failed ${response.status}`);
    const payload = await response.json();
    return { ...payload, expiresAt: Date.now() + Math.max(Number(payload.expiresIn || 3600), 1) * 1000 };
}

function buildSeedProjects() {
    const now = new Date().toISOString();
    const base = {
        boardId: "board-1",
        createdBy: "qa-auto-transitions",
        createdAt: now,
        updatedAt: now,
        attachments: [],
        tasks: [],
    };
    const props = (status, extra) => ({
        stageEnteredAt: now,
        stageName: status,
        equipmentRepairStatus: status,
        equipmentRepairStatusLabel: status,
        testType: "sin-pruebas",
        ...extra,
    });
    return [
        {
            ...base,
            id: seedIds.pruebasOk,
            title: `QA Auto pruebas OK ${stamp}`,
            status: "pruebas",
            properties: props("pruebas", { testType: "banco-pruebas" }),
        },
        {
            ...base,
            id: seedIds.pruebasSin,
            title: `QA Auto pruebas sin prueba ${stamp}`,
            status: "pruebas",
            properties: props("pruebas", { testType: "sin-pruebas" }),
        },
        {
            ...base,
            id: seedIds.diagnostico,
            title: `QA Auto diagnostico ${stamp}`,
            status: "diagnostico",
            properties: props("diagnostico", {}),
        },
    ];
}

function cardInColumn(columnId, projectId) {
    return `.cards-sortable[data-column-id='${columnId}'] .project-drag-item[data-project-id='${projectId}']`;
}

try {
    session = await login();
    result.checks.loggedIn = true;

    await fs.mkdir(artifactsDir, { recursive: true });
    browser = await chromium.launch({ headless, slowMo: slowMoMs });
    const context = await browser.newContext({ viewport: { width: 1540, height: 980 } });
    await context.addInitScript(
        ({ authSession, apiBase, projects, ids }) => {
            window.localStorage.setItem("pika.auth.session", JSON.stringify(authSession));
            window.localStorage.setItem("pika.apiBaseUrl", apiBase);
            const key = "lars.projects.items.v3";
            let existing = [];
            try {
                const parsed = JSON.parse(window.localStorage.getItem(key) || "[]");
                if (Array.isArray(parsed)) existing = parsed;
            } catch {}
            const kept = existing.filter((item) => !ids.includes(String(item?.id ?? "")));
            window.localStorage.setItem(key, JSON.stringify([...kept, ...projects]));
        },
        { authSession: session, apiBase: apiBaseUrl, projects: buildSeedProjects(), ids: Object.values(seedIds) },
    );

    const page = await context.newPage();
    page.on("console", (msg) => { if (msg.type() === "error") pushUnique(result.consoleErrors, msg.text()); });
    page.on("pageerror", (err) => pushUnique(result.pageErrors, err?.stack || err?.message || String(err)));

    // ── Step 1: board loads with the seeded cards ──
    await page.goto(`${normalizedBaseUrl}/app/work-projects`, { waitUntil: "networkidle", timeout: timeoutMs });
    await page.waitForTimeout(3000);

    result.checks.boardLoaded = await page.locator(".kanban-board").isVisible().catch(() => false);
    const seededOkCard = page.locator(cardInColumn("pruebas", seedIds.pruebasOk));
    const seededSinCard = page.locator(cardInColumn("pruebas", seedIds.pruebasSin));
    const seededDiagCard = page.locator(cardInColumn("diagnostico", seedIds.diagnostico));
    result.checks.seedRendered = (await seededOkCard.count()) === 1
        && (await seededSinCard.count()) === 1
        && (await seededDiagCard.count()) === 1;
    if (!result.checks.seedRendered) {
        result.observations.push("OBSERVACION: las tarjetas sembradas no se renderizaron en sus columnas.");
    }

    // ── Step 2: pruebas -> listo-entrega via "Finalizar pruebas y marcar listo" ──
    if (result.checks.seedRendered) {
        await seededOkCard.click();
        await page.waitForTimeout(1000);

        const finishBtn = page.locator("[data-testid='finish-tests-btn']");
        result.checks.finishTestsButtonVisible = await finishBtn.isVisible({ timeout: 8000 }).catch(() => false);

        if (result.checks.finishTestsButtonVisible) {
            await finishBtn.click();
            await page.waitForTimeout(1500);

            // The board suspends card rendering while the detail dialog is open:
            // assert the in-dialog feedback first, then close and verify the column.
            await page.waitForTimeout(700);
            const dialogText = await page.locator(".project-detail-shell.is-open").textContent().catch(() => "");
            result.checks.successToastShown = /listo para entrega/i.test(String(dialogText || ""));
            await page.locator(".project-detail-dialog__actions button", { hasText: /cancelar/i }).first().click().catch(() => {});
            await page.waitForTimeout(1200);

            result.checks.pruebasMovedToListo = (await page.locator(cardInColumn("listo-entrega", seedIds.pruebasOk)).count()) === 1;

            if (!result.checks.pruebasMovedToListo) {
                result.observations.push("OBSERVACION: la tarjeta en pruebas no llego a la columna listo-entrega tras finalizar pruebas.");
            }

            // ── Step 3: negative — sin pruebas reales queda bloqueado con mensaje claro ──
            // Reload to guarantee the detail dialog is closed before clicking the next card.
            await page.goto(`${normalizedBaseUrl}/app/work-projects`, { waitUntil: "networkidle", timeout: timeoutMs });
            await page.waitForTimeout(3000);

            await page.locator(cardInColumn("pruebas", seedIds.pruebasSin)).click();
            await page.waitForTimeout(1000);
            const finishBtnSin = page.locator("[data-testid='finish-tests-btn']");
            if (await finishBtnSin.isVisible({ timeout: 8000 }).catch(() => false)) {
                await finishBtnSin.click();
                await page.waitForTimeout(1200);
                const errorText = await page.locator(".project-detail-dialog__feedback.text-danger").textContent().catch(() => "");
                result.checks.negativeBlockedWithMessage = /prueba de cierre|checklist/i.test(String(errorText || ""));
                // Close the dialog first: the board suspends card rendering while it is open.
                await page.locator(".project-detail-dialog__actions button", { hasText: /cancelar/i }).first().click().catch(() => {});
                await page.waitForTimeout(1200);
                result.checks.negativeStaysInPruebas = (await page.locator(cardInColumn("pruebas", seedIds.pruebasSin)).count()) === 1
                    && (await page.locator(cardInColumn("listo-entrega", seedIds.pruebasSin)).count()) === 0;
                if (!result.checks.negativeBlockedWithMessage) {
                    result.observations.push("OBSERVACION: el bloqueo de pruebas sin tipo real no mostro mensaje claro.");
                }
            } else {
                result.observations.push("OBSERVACION: no aparecio el boton de finalizar pruebas para el caso negativo.");
            }
        } else {
            result.observations.push(
                "OBSERVACION: no aparecio el boton 'Finalizar pruebas y marcar listo'. "
                + "Si el despliegue actual es anterior a este cambio, re-ejecutar tras el build/deploy final.",
            );
        }
    }

    result.observations.push(
        "LIMITACION: el auto-avance por solicitud de repuestos (diagnostico/por-cotizar -> reparacion al crear "
        + "reserva de material, linea de compra o solicitud de compra) no se ejercita E2E: la reserva requiere "
        + "referencias de inventario reales del entorno. Cobertura: scripts/test-auto-transitions-logic.mjs "
        + "(resolveStatusAfterPartsRequest) + integracion en kanban-view.component.ts.",
    );

    // ── Step 4: cleanup — remove seeded projects from localStorage ──
    await page.evaluate((ids) => {
        const key = "lars.projects.items.v3";
        try {
            const parsed = JSON.parse(window.localStorage.getItem(key) || "[]");
            const kept = Array.isArray(parsed) ? parsed.filter((item) => !ids.includes(String(item?.id ?? ""))) : [];
            window.localStorage.setItem(key, JSON.stringify(kept));
        } catch {}
    }, Object.values(seedIds));
    result.checks.cleanupDone = true;

    const screenshotPath = path.resolve(artifactsDir, `auto-transitions-${stamp}.png`);
    await page.screenshot({ path: screenshotPath, fullPage: true });
    result.screenshotPath = screenshotPath;

    const failedChecks = Object.entries(result.checks).filter(([, v]) => v !== true);
    if (failedChecks.length > 0) {
        result.observations.push(`Checks no aprobados: ${failedChecks.map(([k]) => k).join(", ")}`);
    }

    console.log("PLAYWRIGHT_AUTO_TRANSITIONS_CHECK_COMPLETED");
    console.log(JSON.stringify(result, null, 2));
    if (failedChecks.length > 0) process.exitCode = 1;
} catch (error) {
    result.error = String(error?.stack || error);
    try {
        if (browser?.contexts()?.[0]?.pages()?.[0]) {
            await browser.contexts()[0].pages()[0].evaluate((ids) => {
                const key = "lars.projects.items.v3";
                try {
                    const parsed = JSON.parse(window.localStorage.getItem(key) || "[]");
                    const kept = Array.isArray(parsed) ? parsed.filter((item) => !ids.includes(String(item?.id ?? ""))) : [];
                    window.localStorage.setItem(key, JSON.stringify(kept));
                } catch {}
            }, Object.values(seedIds));
            const sp = path.resolve(artifactsDir, `auto-transitions-fail-${stamp}.png`);
            await browser.contexts()[0].pages()[0].screenshot({ path: sp, fullPage: true });
            result.screenshotPath = sp;
        }
    } catch {}
    console.error("PLAYWRIGHT_AUTO_TRANSITIONS_CHECK_ERROR");
    console.error(JSON.stringify(result, null, 2));
    process.exitCode = 1;
} finally {
    if (browser) await browser.close();
}
