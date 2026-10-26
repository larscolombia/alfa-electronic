/**
 * E2E t10 — REPARACION Y CIERRE TECNICO (rol: Tecnico)
 *
 * Flujo validado (acciones de negocio 100% por UI como usuario Tecnico):
 *  1. Login admin (API) + alta/verificacion de usuario Tecnico (sufijo t10).
 *  2. Setup (API): caso de reparacion en etapa "reparacion".
 *  3. Login UI como Tecnico y aterrizaje en el tablero tecnico.
 *  4. Registrar horas trabajadas (Horas reales acumuladas) en la ficha del caso.
 *  5. Memo de reparacion ("se reemplazaron optoacopladores...").
 *  6. Prueba de cierre / checklist (Banco de pruebas).
 *  7. Guardar cambios y verificar persistencia via API.
 *  8. "Validar cierre y marcar listo" -> caso pasa a listo-entrega.
 *  9. Generar reporte de intervencion imprimible y verificar contenido
 *     (memo, horas, prueba) + accion Imprimir (window.print stubbed).
 * 10. Verificar el caso visible en la columna Listo para entrega del tablero.
 *
 * Uso:
 *   xvfb-run -a env PW_BASE_URL=https://alfa.software.net.co PW_HEADLESS=false \
 *     node scripts/e2e-lars-t10-reparacion-cierre-playwright.mjs
 */

import path from "node:path";
import { promises as fs } from "node:fs";
import { chromium } from "playwright";

const baseUrl = (process.env.PW_BASE_URL || "https://alfa.software.net.co").replace(/\/+$/, "");
const timeoutMs = Number(process.env.PW_TIMEOUT_MS || "120000");
const headless = !["false", "0", "no"].includes((process.env.PW_HEADLESS || "true").toLowerCase());
const companyId = process.env.PW_COMPANY_ID || "demo-company";
const artifactsDir = process.env.PW_ARTIFACTS_DIR || "playwright-artifacts";
const apiBaseUrl = new URL(baseUrl).origin;

const now = Date.now();
const IDENTIFIER = `PW-T10-${now}`;
const SHORT_CODE = `CO-T10-${now}`;
const TITLE = `Reparacion PLC optoacopladores ${IDENTIFIER}`;
const HOURS = "3.5";
const MEMO = `Se reemplazaron optoacopladores de aislamiento en las entradas digitales, se verificaron niveles de senal y se realizo prueba funcional completa. Caso ${IDENTIFIER}.`;
const TECH_EMAIL = "pw-tecnico-t10@alfa.local";
const TECH_PASSWORD = "Alfa2026!Pw";
const ADMIN_EMAIL = process.env.PW_ADMIN_EMAIL || "admin@alfa.com";
const ADMIN_PASSWORD = process.env.PW_ADMIN_PASSWORD || "1234";

const shot = (name) => path.resolve(artifactsDir, `e2e-lars-t10-${name}-${Date.now()}.png`);

const result = {
    test: "e2e-lars-t10-reparacion-cierre",
    role: "Tecnico",
    baseUrl,
    identifier: IDENTIFIER,
    shortCode: SHORT_CODE,
    projectId: "",
    checks: {
        adminLoggedIn: false,
        tecnicoUserReady: false,
        casoCreatedInReparacion: false,
        tecnicoLoggedIn: false,
        boardVisibleAsTecnico: false,
        casoVisibleInBoard: false,
        projectsBoardRouteDead: false,
        detailOpened: false,
        memoReparacionEntered: false,
        horasRegistradas: false,
        pruebaDeCierreSeleccionada: false,
        cambiosPersistidos: false,
        cierreValidated: false,
        casoEnListoEntregaApi: false,
        casoEnColumnaListoEntrega: false,
        reportButtonVisibleAfterCierre: false,
        reporteGeneradoConMemo: false,
        reporteIncluyeHorasYPrueba: false,
        reporteImprimible: false,
    },
    screenshots: {},
    observations: [],
    consoleErrors: [],
    pageErrors: [],
    error: "",
};

let browser;
let adminSession;
let techSession;

function pushUnique(target, text) {
    const value = String(text || "").trim();
    if (!value || target.includes(value)) return;
    if (target.length < 20) target.push(value);
}

async function apiLogin(email, password) {
    const response = await fetch(`${apiBaseUrl}/api/v1/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Company-Id": companyId },
        body: JSON.stringify({ email, password }),
    });
    if (!response.ok) throw new Error(`login ${email} failed ${response.status}: ${await response.text()}`);
    const payload = await response.json();
    return { ...payload, expiresAt: Date.now() + Math.max(Number(payload.expiresIn || 3600), 1) * 1000 };
}

function headers(session) {
    return {
        "Content-Type": "application/json",
        "X-Company-Id": companyId,
        Authorization: `Bearer ${session.accessToken}`,
    };
}

async function createTecnicoUser() {
    const response = await fetch(`${apiBaseUrl}/api/v1/users`, {
        method: "POST",
        headers: headers(adminSession),
        body: JSON.stringify({
            email: TECH_EMAIL,
            password: TECH_PASSWORD,
            confirmPassword: TECH_PASSWORD,
            name: "PW Tecnico t10",
            role: "Técnico",
        }),
    });
    if (response.ok) return { created: true };
    if (response.status === 409) return { created: false, existed: true };
    throw new Error(`create tecnico user failed ${response.status}: ${await response.text()}`);
}

async function createCasoReparacion() {
    const project = {
        id: `t10-proj-${now}`,
        status: "reparacion",
        properties: {
            title: TITLE,
            shortCode: SHORT_CODE,
            equipmentIdentifier: IDENTIFIER,
            clientName: `Cliente PW T10 ${now}`,
            equipmentName: `PLC Marca T10 ${now}`,
            equipmentFailureDescription: "Entradas digitales sin respuesta, sospecha de optoacopladores quemados.",
            diagnosticNotes: "Diagnostico previo (setup t10): falla aislada en etapa de entrada, reparacion viable.",
            repairNotes: "",
            estimatedHours: 2,
            actualHours: 0,
            testType: "sin-pruebas",
        },
    };
    let response = await fetch(`${apiBaseUrl}/api/v1/projects`, {
        method: "POST",
        headers: headers(adminSession),
        body: JSON.stringify(project),
    });
    if (!response.ok) {
        response = await fetch(`${apiBaseUrl}/api/v1/projects/${encodeURIComponent(project.id)}`, {
            method: "PUT",
            headers: headers(adminSession),
            body: JSON.stringify(project),
        });
    }
    if (!response.ok) throw new Error(`create caso failed ${response.status}: ${await response.text()}`);
    const saved = await response.json();
    return String(saved?.id || project.id);
}

async function getProject(session, projectId) {
    const response = await fetch(`${apiBaseUrl}/api/v1/projects/${encodeURIComponent(projectId)}`, {
        method: "GET",
        headers: headers(session),
    });
    if (!response.ok) throw new Error(`get project failed ${response.status}`);
    return response.json();
}

async function shotStep(page, name) {
    const p = shot(name);
    await page.screenshot({ path: p, fullPage: true });
    result.screenshots[name] = p;
}

try {
    await fs.mkdir(artifactsDir, { recursive: true });

    // ── Setup 1: admin + tecnico user ──
    adminSession = await apiLogin(ADMIN_EMAIL, ADMIN_PASSWORD);
    result.checks.adminLoggedIn = true;
    const techUser = await createTecnicoUser();
    result.checks.tecnicoUserReady = true;
    result.observations.push(`Usuario Tecnico ${techUser.created ? "creado" : "ya existia (409)"}: ${TECH_EMAIL}`);

    // ── Setup 2: caso en reparacion via API ──
    result.projectId = await createCasoReparacion();
    const created = await getProject(adminSession, result.projectId);
    result.checks.casoCreatedInReparacion = created.status === "reparacion";
    if (!result.checks.casoCreatedInReparacion) {
        result.observations.push(`OBSERVACION: el caso se creo con status '${created.status}', no 'reparacion'.`);
    }

    // ── Setup 3: login UI como Tecnico ──
    techSession = await apiLogin(TECH_EMAIL, TECH_PASSWORD);
    result.checks.tecnicoLoggedIn = true;

    browser = await chromium.launch({ headless });
    const context = await browser.newContext({ viewport: { width: 1540, height: 980 } });
    await context.addInitScript(
        ({ authSession, apiBase }) => {
            window.localStorage.setItem("pika.auth.session", JSON.stringify(authSession));
            window.localStorage.setItem("pika.apiBaseUrl", apiBase);
            window.print = () => {
                window.__t10Printed = true;
            };
        },
        { authSession: techSession, apiBase: apiBaseUrl },
    );
    const page = await context.newPage();
    page.on("console", (msg) => { if (msg.type() === "error") pushUnique(result.consoleErrors, msg.text()); });
    page.on("pageerror", (err) => pushUnique(result.pageErrors, err?.stack || err?.message || String(err)));

    // ── Step A0: /app/projects-board es ruta muerta (HTTP 200, shell vacio) ──
    // Correccion auditor: la ruta responde 200 pero no renderiza tablero;
    // la ruta operativa del tecnico es /app/work-projects (se valida en Step A).
    await page.goto(`${baseUrl}/app/projects-board`, { waitUntil: "networkidle", timeout: timeoutMs });
    await page.waitForTimeout(3000);
    const deadRouteColumns = await page.locator("[data-testid^='column-header-']").count();
    const deadRouteBoard = await page.locator(".kanban-board").count();
    const deadRouteSignin = page.url().includes("/auth/signin");
    result.checks.projectsBoardRouteDead = !deadRouteSignin && deadRouteColumns === 0 && deadRouteBoard === 0;
    if (result.checks.projectsBoardRouteDead) {
        result.observations.push(
            "Ruta muerta confirmada: /app/projects-board responde 200 pero renderiza shell vacio sin tablero " +
            `(columnas=${deadRouteColumns}, kanban-board=${deadRouteBoard}); la ruta operativa del Tecnico es /app/work-projects.`,
        );
    } else {
        result.observations.push(
            `OBSERVACION: /app/projects-board renderizo tablero (columnas=${deadRouteColumns}, kanban-board=${deadRouteBoard}, signin=${deadRouteSignin}); ` +
            "la ruta muerta pudo ser corregida o el comportamiento cambio.",
        );
    }
    await shotStep(page, "00-projects-board-shell-vacio");

    // ── Step A: tablero tecnico visible para el rol Tecnico (ACL) ──
    await page.goto(`${baseUrl}/app/work-projects`, { waitUntil: "networkidle", timeout: timeoutMs });
    result.checks.boardVisibleAsTecnico =
        !page.url().includes("/auth/signin") &&
        (await page.locator("[data-testid='column-header-reparacion']").first().isVisible({ timeout: 60000 }).catch(() => false));
    if (!result.checks.boardVisibleAsTecnico) {
        result.observations.push("FALLO ACL/UX: el rol Tecnico no ve el tablero tecnico (redirige a signin o sin columnas).");
        throw new Error("Board not visible for Tecnico role");
    }
    await shotStep(page, "01-board-tecnico");

    // ── Step B: el caso del setup es visible en el tablero ──
    let card = page.locator(`[data-project-id="${result.projectId}"]`).first();
    if (!(await card.isVisible({ timeout: 5000 }).catch(() => false))) {
        const onlyMine = page.locator("[data-testid='only-my-projects-toggle']").first();
        if (await onlyMine.isVisible({ timeout: 3000 }).catch(() => false)) {
            const active = await onlyMine.evaluate((el) => el.classList.contains("is-active")).catch(() => false);
            if (active) {
                await onlyMine.click();
                await page.waitForTimeout(2000);
            }
        }
        card = page.locator(`[data-project-id="${result.projectId}"]`).first();
    }
    result.checks.casoVisibleInBoard = await card.isVisible({ timeout: 8000 }).catch(() => false);
    if (!result.checks.casoVisibleInBoard) {
        result.observations.push("FALLO: el caso creado en reparacion no aparece en el tablero del Tecnico.");
        throw new Error("Case card not visible on board");
    }

    // ── Step C: abrir la ficha del caso ──
    await card.click();
    await page.waitForSelector(".project-detail-dialog.is-open", { timeout: timeoutMs });
    await page.waitForSelector('textarea[placeholder*="Acciones de reparacion"]', { timeout: timeoutMs });
    result.checks.detailOpened = true;
    await shotStep(page, "02-ficha-caso-abierta");

    // ── Step D: registrar memo de reparacion + horas + prueba de cierre ──
    const memoInput = page.locator('textarea[placeholder*="Acciones de reparacion"]').first();
    await memoInput.fill(MEMO);
    result.checks.memoReparacionEntered = (await memoInput.inputValue()) === MEMO;

    const hoursInput = page.locator("label.project-detail-field", { hasText: "Horas reales acumuladas" }).locator("input").first();
    await hoursInput.fill(HOURS);
    result.checks.horasRegistradas = (await hoursInput.inputValue()) === HOURS;

    const testSelect = page.locator("label.project-detail-field", { hasText: "Prueba de cierre" }).locator("select").first();
    await testSelect.selectOption("banco-pruebas");
    result.checks.pruebaDeCierreSeleccionada = (await testSelect.inputValue()) === "banco-pruebas";
    await shotStep(page, "03-campos-reparacion-llenos");

    // ── Step E: Guardar cambios y verificar persistencia via API ──
    await page.getByRole("button", { name: "Guardar cambios" }).click();
    await page.waitForTimeout(2500);
    const saveError = await page.locator("[data-testid='detail-save-error'], .project-detail-dialog__feedback.text-danger")
        .first().isVisible({ timeout: 3000 }).catch(() => false);
    const saved = await getProject(adminSession, result.projectId);
    const props = saved.properties ?? {};
    const memoOk = String(props.repairNotes ?? "").includes("optoacopladores");
    const hoursSaved = Number(props.actualHours ?? -1);
    const hoursOk = hoursSaved >= Number(HOURS);
    const testOk = String(props.testType ?? "") === "banco-pruebas";
    result.checks.cambiosPersistidos = memoOk && hoursOk && testOk;
    if (hoursSaved > Number(HOURS)) {
        result.observations.push(
            `INFO: al guardar, el punto de sesion del tablero sumo tiempo al contador (actualHours API=${hoursSaved} vs digitado=${HOURS}). Comportamiento 'Pointage de sesion'.`,
        );
    }
    if (!result.checks.cambiosPersistidos || saveError) {
        result.observations.push(
            `FALLO persistencia: memoOk=${memoOk} hoursOk=${hoursOk} testOk=${testOk} visibleSaveError=${saveError}. ` +
            `API actual: repairNotes='${String(props.repairNotes ?? "").slice(0, 80)}' actualHours=${props.actualHours} testType=${props.testType}`,
        );
    }
    await shotStep(page, "04-cambios-guardados");

    // ── Step F: reabrir la ficha y validar cierre (marcar listo) ──
    const cardAfterSave = page.locator(`[data-project-id="${result.projectId}"]`).first();
    await cardAfterSave.waitFor({ state: "visible", timeout: timeoutMs });
    await cardAfterSave.click();
    await page.waitForSelector(".project-detail-dialog.is-open", { timeout: timeoutMs });
    const finishBtn = page.getByTestId("finish-tests-btn");
    if (!(await finishBtn.isVisible({ timeout: 5000 }).catch(() => false))) {
        result.observations.push("FALLO: no aparece el boton 'Validar cierre y marcar listo' en reparacion.");
        throw new Error("finish-tests button not visible");
    }
    await finishBtn.click();
    const closeOk = await page.locator(".project-detail-dialog__feedback.text-success", { hasText: /Cierre validado/ })
        .first().isVisible({ timeout: 4000 }).catch(() => false);
    const closeErrText = await page.locator(".project-detail-dialog__feedback.text-danger").first().textContent().catch(() => "");
    await page.waitForTimeout(1500);
    // Fuente de verdad del cierre: el status API debe pasar a listo-entrega
    // (el mensaje en pantalla puede limpiarse con el refresco del tablero).
    const afterFinish = await getProject(adminSession, result.projectId);
    result.checks.cierreValidated = closeOk || afterFinish.status === "listo-entrega";
    if (!closeOk && afterFinish.status === "listo-entrega") {
        result.observations.push("INFO: el mensaje 'Cierre validado' no fue detectable en pantalla, pero el caso paso a listo-entrega (verificado por API).");
    }
    if (!result.checks.cierreValidated) {
        result.observations.push(`FALLO cierre: mensaje de error visible='${String(closeErrText).trim()}' status API='${afterFinish.status}'`);
    }
    await shotStep(page, "05-cierre-validado");

    // ── Step G: verificar listo-entrega via API y columna del tablero ──
    await page.waitForTimeout(1500);
    const afterClose = afterFinish;
    result.checks.casoEnListoEntregaApi = afterClose.status === "listo-entrega";
    if (!result.checks.casoEnListoEntregaApi) {
        result.observations.push(`FALLO interconexion: status API tras cierre='${afterClose.status}', se esperaba 'listo-entrega'.`);
    }

    const printBtn = page.getByTestId("print-technical-report-btn");
    result.checks.reportButtonVisibleAfterCierre = await printBtn.isVisible({ timeout: 5000 }).catch(() => false);
    if (!result.checks.reportButtonVisibleAfterCierre) {
        result.observations.push("FALLO UX: tras el cierre no aparece 'Imprimir reporte tecnico' (canPrintTechnicalReport requiere listo-entrega).");
    }

    // ── Step H: reporte de intervencion imprimible ──
    if (result.checks.reportButtonVisibleAfterCierre) {
        await printBtn.click();
        await page.waitForSelector("[data-testid='technical-report-modal']", { timeout: timeoutMs });
        const reportText = await page.locator("[data-testid='technical-report-content']").textContent().catch(() => "");
        const reportMeta = await page.locator("[data-testid='technical-report-meta']").textContent().catch(() => "");
        const persistedHours = String(Number((afterClose.properties ?? {}).actualHours ?? -1));
        result.checks.reporteGeneradoConMemo = reportText.includes("optoacopladores");
        const hoursInReport = persistedHours !== "-1" && (reportText.includes(persistedHours) || reportMeta.includes(persistedHours));
        result.checks.reporteIncluyeHorasYPrueba = reportText.includes("Banco de pruebas") && hoursInReport;
        if (!result.checks.reporteGeneradoConMemo || !result.checks.reporteIncluyeHorasYPrueba) {
            result.observations.push(
                `FALLO reporte: contieneMemo=${reportText.includes("optoacopladores")} ` +
                `prueba=${reportText.includes("Banco de pruebas")} horasPersistidas=${persistedHours} horasEnReporte=${hoursInReport} meta='${String(reportMeta).replace(/\s+/g, " ").slice(0, 200)}'`,
            );
        }
        await shotStep(page, "06-reporte-intervencion");

        await page.getByTestId("technical-report-print-action").click();
        await page.waitForTimeout(800);
        result.checks.reporteImprimible = await page.evaluate(() => Boolean(window.__t10Printed));
        await page.getByTestId("technical-report-close").click();
        await page.waitForTimeout(500);
    }

    // ── Step I: cerrar ficha y verificar columna Listo para entrega ──
    await page.keyboard.press("Escape").catch(() => {});
    const closeDetail = page.locator(".project-detail-dialog__actions button", { hasText: /Cancelar/ }).first();
    if (await closeDetail.isVisible({ timeout: 2000 }).catch(() => false)) await closeDetail.click();
    await page.waitForTimeout(2000);
    result.checks.casoEnColumnaListoEntrega = await page
        .locator(`[data-column-id="listo-entrega"] [data-project-id="${result.projectId}"]`)
        .first().isVisible({ timeout: 8000 }).catch(() => false);
    if (!result.checks.casoEnColumnaListoEntrega) {
        result.observations.push("FALLO UX: el caso no se visualiza en la columna 'Listo para entrega' del tablero tras el cierre.");
    }
    await shotStep(page, "07-board-listo-entrega");

    const failed = Object.entries(result.checks).filter(([, v]) => v !== true);
    result.summary = failed.length === 0
        ? "ALL_CHECKS_PASSED"
        : `FAILED: ${failed.map(([k]) => k).join(", ")}`;
    console.log(failed.length === 0 ? "E2E_LARS_T10_ALL_OK" : "E2E_LARS_T10_COMPLETED_WITH_FAILURES");
    console.log(JSON.stringify(result, null, 2));
    await fs.writeFile("e2e-lars-t10-result.json", JSON.stringify(result, null, 2));
    if (failed.length > 0) process.exitCode = 1;
} catch (error) {
    result.error = String(error?.stack || error);
    try {
        if (browser?.contexts()?.[0]?.pages()?.[0]) {
            const p = shot("fatal-error");
            await browser.contexts()[0].pages()[0].screenshot({ path: p, fullPage: true });
            result.screenshots.fatal = p;
        }
    } catch {}
    console.error("E2E_LARS_T10_ERROR");
    console.error(JSON.stringify(result, null, 2));
    try { await fs.writeFile("e2e-lars-t10-result.json", JSON.stringify(result, null, 2)); } catch {}
    process.exitCode = 1;
} finally {
    if (browser) await browser.close();
}
