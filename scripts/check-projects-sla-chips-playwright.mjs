/**
 * Playwright headless test — Chips de resumen SLA clickeables en el tablero de proyectos
 *
 * Verifies:
 *  - los sla-summary-chip son <button> (accesibles con teclado, Enter/Espacio)
 *  - cada chip tiene tooltip "Ir a la columna <titulo>"
 *  - al hacer clic en el chip de una columna lejana el contenedor del tablero
 *    desplaza su scroll horizontal (scrollLeft cambia)
 *  - tras el clic el header de esa columna queda visible dentro del viewport
 *  - la columna destino recibe el resalte temporal kanban-column--jump-highlight
 *
 * Exit codes: 0 = script finished without exception, 1 = failure
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

const VIEWPORT = { width: 1540, height: 980 };

const result = {
    test: "projects-sla-chips",
    requirement: "Chips de resumen SLA clickeables: navegan con scroll suave a la columna del tablero",
    baseUrl: normalizedBaseUrl,
    checks: {
        loggedIn: false,
        landedKanban: false,
        summaryBarVisible: false,
        chipsAreButtons: false,
        chipsHaveTooltip: false,
        clickScrollsBoard: false,
        targetColumnVisibleAfterClick: false,
        highlightApplied: false,
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

/** Reads the horizontal scroll position of the column's scrollable ancestor and the header rect. */
function readScrollState(columnId) {
    const header = document.querySelector(`[data-testid='column-header-${columnId}']`);
    if (!header) return null;
    let el = header.parentElement;
    while (el && el.scrollWidth <= el.clientWidth + 1) el = el.parentElement;
    const container = el && el.scrollWidth > el.clientWidth + 1 ? el : null;
    const rect = header.getBoundingClientRect();
    return {
        hasScroller: !!container,
        scrollLeft: container ? container.scrollLeft : 0,
        headerLeft: rect.left,
        headerRight: rect.right,
        viewportWidth: window.innerWidth,
    };
}

try {
    session = await login();
    result.checks.loggedIn = true;

    await fs.mkdir(artifactsDir, { recursive: true });
    browser = await chromium.launch({ headless, slowMo: slowMoMs });
    const context = await browser.newContext({ viewport: VIEWPORT });
    await context.addInitScript(
        ({ authSession, apiBase }) => {
            window.localStorage.setItem("pika.auth.session", JSON.stringify(authSession));
            window.localStorage.setItem("pika.apiBaseUrl", apiBase);
        },
        { authSession: session, apiBase: apiBaseUrl },
    );

    const page = await context.newPage();
    page.on("console", (msg) => { if (msg.type() === "error") pushUnique(result.consoleErrors, msg.text()); });
    page.on("pageerror", (err) => pushUnique(result.pageErrors, err?.stack || err?.message || String(err)));

    // ── Step 1: Kanban — chips are buttons with tooltip ──
    await page.goto(`${normalizedBaseUrl}/app/work-projects`, { waitUntil: "networkidle", timeout: timeoutMs });
    result.checks.landedKanban = !page.url().includes("/auth/signin");
    await page.waitForTimeout(3000);

    const summaryBar = page.locator("[data-testid='sla-summary-bar']").first();
    result.checks.summaryBarVisible = await summaryBar.isVisible({ timeout: 8000 }).catch(() => false);

    if (result.checks.summaryBarVisible) {
        const allChips = summaryBar.locator("[data-testid='sla-summary-chip']");
        const buttonChips = summaryBar.locator("button[data-testid='sla-summary-chip']");
        const chipCount = await allChips.count();
        const buttonCount = await buttonChips.count();
        result.checks.chipsAreButtons = chipCount > 0 && chipCount === buttonCount;
        if (!result.checks.chipsAreButtons) {
            result.observations.push(`OBSERVACION: chips SLA totales=${chipCount} vs botones=${buttonCount}; todos los chips deben ser <button>.`);
        }

        // Every chip must carry the "Ir a la columna <titulo>" tooltip
        let chipsWithTooltip = 0;
        for (let i = 0; i < chipCount; i++) {
            const title = ((await allChips.nth(i).getAttribute("title").catch(() => "")) || "").trim();
            if (/^Ir a la columna\s+\S/.test(title)) chipsWithTooltip++;
        }
        result.checks.chipsHaveTooltip = chipCount > 0 && chipsWithTooltip === chipCount;
        if (!result.checks.chipsHaveTooltip) {
            result.observations.push(`OBSERVACION: solo ${chipsWithTooltip}/${chipCount} chips tienen tooltip 'Ir a la columna ...'.`);
        }

        // ── Step 2: Click on the last chip (far column) scrolls the board ──
        const lastChip = allChips.nth(chipCount - 1);
        const targetColumnId = (await lastChip.getAttribute("data-column-id").catch(() => "")) || "";
        if (!targetColumnId) {
            result.observations.push("OBSERVACION: el ultimo chip no expone data-column-id; no se pudo verificar la navegacion.");
        } else {
            const before = await page.evaluate(readScrollState, targetColumnId);
            if (!before) {
                result.observations.push(`OBSERVACION: no se encontro el header de la columna '${targetColumnId}'.`);
            } else {
                const headerVisibleBefore =
                    before.headerLeft >= 0 && before.headerRight <= before.viewportWidth;

                await lastChip.click();

                // The highlight class is transient (~1.6s); assert it right after the click
                const highlightLocator = page.locator("section.kanban-column--jump-highlight");
                result.checks.highlightApplied = await highlightLocator
                    .first()
                    .isVisible({ timeout: 1500 })
                    .catch(() => false);
                if (!result.checks.highlightApplied) {
                    result.observations.push("OBSERVACION: no se detecto el resalte temporal kanban-column--jump-highlight tras el clic.");
                }

                // Wait for the smooth scroll to settle
                await page.waitForTimeout(1600);
                const after = await page.evaluate(readScrollState, targetColumnId);

                if (!after) {
                    result.observations.push("OBSERVACION: no se pudo medir el estado del scroll tras el clic.");
                } else if (!before.hasScroller) {
                    // Board fits the viewport: no scroll needed, header must simply be visible
                    result.checks.clickScrollsBoard = true; // N/A por entorno
                    result.observations.push("DATO (entorno): el tablero cabe en el viewport; no hay scroll horizontal que medir.");
                } else if (headerVisibleBefore) {
                    result.checks.clickScrollsBoard = true; // N/A: la columna ya era visible
                    result.observations.push("DATO (entorno): la columna destino ya era visible antes del clic; scrollLeft no debia cambiar.");
                } else {
                    result.checks.clickScrollsBoard = Math.abs(after.scrollLeft - before.scrollLeft) > 1;
                    if (!result.checks.clickScrollsBoard) {
                        result.observations.push(
                            `OBSERVACION: scrollLeft no cambio tras el clic (antes=${Math.round(before.scrollLeft)}, despues=${Math.round(after.scrollLeft)}).`,
                        );
                    }
                }

                if (after) {
                    const headerVisibleAfter =
                        after.headerLeft >= 0 && after.headerRight <= after.viewportWidth + 1;
                    result.checks.targetColumnVisibleAfterClick = headerVisibleAfter;
                    if (!headerVisibleAfter) {
                        result.observations.push(
                            `OBSERVACION: tras el clic el header de '${targetColumnId}' sigue fuera del viewport (left=${Math.round(after.headerLeft)}, right=${Math.round(after.headerRight)}, viewport=${after.viewportWidth}).`,
                        );
                    }
                }
            }
        }
    } else {
        result.observations.push("OBSERVACION: no se encontro sla-summary-bar en /app/work-projects (frontend nuevo posiblemente no desplegado).");
    }

    // Screenshot
    const screenshotPath = path.resolve(artifactsDir, `projects-sla-chips-${Date.now()}.png`);
    await page.screenshot({ path: screenshotPath, fullPage: true });
    result.screenshotPath = screenshotPath;

    const failedChecks = Object.entries(result.checks).filter(([, v]) => v !== true);
    if (failedChecks.length > 0) {
        result.observations.push(`Checks no aprobados: ${failedChecks.map(([k]) => k).join(", ")}`);
    }

    console.log("PLAYWRIGHT_PROJECTS_SLA_CHIPS_CHECK_COMPLETED");
    console.log(JSON.stringify(result, null, 2));
} catch (error) {
    result.error = String(error?.stack || error);
    try {
        if (browser?.contexts()?.[0]?.pages()?.[0]) {
            const sp = path.resolve(artifactsDir, `projects-sla-chips-fail-${Date.now()}.png`);
            await browser.contexts()[0].pages()[0].screenshot({ path: sp, fullPage: true });
            result.screenshotPath = sp;
        }
    } catch {}
    console.error("PLAYWRIGHT_PROJECTS_SLA_CHIPS_CHECK_ERROR");
    console.error(JSON.stringify(result, null, 2));
    process.exitCode = 1;
} finally {
    if (browser) await browser.close();
}
