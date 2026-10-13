import path from "node:path";
import { chromium } from "playwright";

const baseUrl = process.env.PW_BASE_URL || "http://127.0.0.1:4200";
const targetPath = process.env.PW_TARGET_PATH || "/app/work-projects";
const timeoutMs = Number(process.env.PW_TIMEOUT_MS || "60000");
const headless = !["false", "0", "no"].includes((process.env.PW_HEADLESS || "true").toLowerCase());
const slowMoMs = Number(process.env.PW_SLOW_MO_MS || "0");
const stepDelayMs = Number(process.env.PW_STEP_DELAY_MS || "250");
const modalHoldMs = Number(process.env.PW_MODAL_HOLD_MS || "700");
const holdOpenMs = Number(process.env.PW_HOLD_OPEN_MS || "0");
const fullUrl = `${baseUrl.replace(/\/$/, "")}${targetPath}`;

const targetDefinitions = [
    { key: "meta-code", selector: ".project-card__meta-code", multiple: false, label: "codigo" },
    { key: "meta-client", selector: ".project-card__meta-client", multiple: false, label: "cliente" },
    { key: "icon", selector: ".project-card__icon", multiple: false, label: "icono" },
    { key: "title", selector: ".card-title", multiple: false, label: "titulo" },
    { key: "description", selector: ".card-description", multiple: false, label: "descripcion" },
    { key: "badge", selector: ".card-badges .badge", multiple: true, label: "badge" },
    { key: "progress-section", selector: ".progress-section", multiple: false, label: "progreso" },
    { key: "footer-person", selector: ".project-card__footer-person", multiple: false, label: "responsable" },
    { key: "open-hint", selector: ".project-card__open-hint", multiple: false, label: "abrir" },
];

const consoleErrors = [];
const pageErrors = [];

const result = {
    fullUrl,
    finalUrl: "",
    status: null,
    cardCount: 0,
    stepCount: 0,
    successfulSteps: 0,
    failedSteps: 0,
    steps: [],
    consoleErrors,
    pageErrors,
    screenshotPath: "",
};

let browser;

async function setOverlay(page, text) {
    await page.evaluate((overlayText) => {
        let overlay = document.getElementById("pw-work-projects-walk-overlay");
        if (!overlay) {
            overlay = document.createElement("div");
            overlay.id = "pw-work-projects-walk-overlay";
            Object.assign(overlay.style, {
                position: "fixed",
                top: "16px",
                right: "16px",
                zIndex: "999999",
                padding: "10px 14px",
                borderRadius: "12px",
                background: "rgba(15, 23, 42, 0.9)",
                color: "#fff",
                fontFamily: "Segoe UI, sans-serif",
                fontSize: "13px",
                fontWeight: "600",
                boxShadow: "0 12px 30px rgba(15, 23, 42, 0.28)",
                pointerEvents: "none",
                maxWidth: "340px",
                whiteSpace: "pre-wrap",
            });
            document.body.appendChild(overlay);
        }

        overlay.textContent = overlayText;
    }, text);
}

async function clearHighlights(page) {
    await page.evaluate(() => {
        document.querySelectorAll("[data-pw-highlight='true']").forEach((element) => {
            element.removeAttribute("data-pw-highlight");
            element.style.outline = "";
            element.style.outlineOffset = "";
            element.style.boxShadow = "";
        });
    });
}

async function highlightLocator(locator) {
    await locator.evaluate((element) => {
        element.setAttribute("data-pw-highlight", "true");
        element.style.outline = "3px solid rgba(37, 99, 235, 0.95)";
        element.style.outlineOffset = "2px";
        element.style.boxShadow = "0 0 0 4px rgba(37, 99, 235, 0.18)";
    });
}

async function describeLocator(locator, fallback) {
    try {
        const text = ((await locator.innerText()) || "").trim().replace(/\s+/g, " ");
        return text ? text.slice(0, 80) : fallback;
    } catch {
        return fallback;
    }
}

try {
    browser = await chromium.launch({ headless, slowMo: slowMoMs });
    const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });

    page.on("console", (msg) => {
        if (msg.type() === "error") {
            consoleErrors.push(msg.text());
        }
    });

    page.on("pageerror", (error) => {
        pageErrors.push(error.stack || error.message || String(error));
    });

    const response = await page.goto(fullUrl, {
        waitUntil: "networkidle",
        timeout: timeoutMs,
    });

    result.status = response ? response.status() : null;
    result.finalUrl = page.url();

    await page.waitForSelector(".kanban-board", { timeout: timeoutMs });

    const cards = page.locator(".project-card");
    result.cardCount = await cards.count();

    if (!result.cardCount) {
        throw new Error("No se encontraron fichas de proyecto en el tablero.");
    }

    for (let cardIndex = 0; cardIndex < result.cardCount; cardIndex += 1) {
        const card = cards.nth(cardIndex);
        await card.scrollIntoViewIfNeeded();

        const cardTitle = await describeLocator(card.locator(".card-title").first(), `Proyecto ${cardIndex + 1}`);

        const targets = [];

        for (const definition of targetDefinitions) {
            const locator = card.locator(definition.selector);
            const count = await locator.count();

            if (!count) {
                continue;
            }

            if (definition.multiple) {
                for (let targetIndex = 0; targetIndex < count; targetIndex += 1) {
                    targets.push({
                        definition,
                        targetIndex,
                    });
                }
            } else {
                targets.push({
                    definition,
                    targetIndex: 0,
                });
            }
        }

        for (const target of targets) {
            const targetLocator = card.locator(target.definition.selector).nth(target.targetIndex);
            const labelText = await describeLocator(
                targetLocator,
                `${target.definition.label}${target.definition.multiple ? ` ${target.targetIndex + 1}` : ""}`,
            );

            result.stepCount += 1;

            await clearHighlights(page);
            await targetLocator.scrollIntoViewIfNeeded();
            await highlightLocator(targetLocator);
            await setOverlay(
                page,
                `Ficha ${cardIndex + 1}/${result.cardCount}\n${cardTitle}\nElemento: ${labelText}`,
            );

            const stepResult = {
                cardIndex,
                cardTitle,
                targetKey: target.definition.key,
                targetIndex: target.targetIndex,
                targetLabel: labelText,
                opened: false,
                modalTitle: "",
            };

            try {
                await targetLocator.click();

                await page.waitForSelector(".project-detail-dialog", {
                    state: "visible",
                    timeout: 10000,
                });

                stepResult.modalTitle = await describeLocator(
                    page.locator(".project-detail-dialog__title").first(),
                    "",
                );
                stepResult.opened = stepResult.modalTitle.length > 0;

                if (stepResult.opened) {
                    result.successfulSteps += 1;
                } else {
                    result.failedSteps += 1;
                }

                result.steps.push(stepResult);

                await page.waitForTimeout(modalHoldMs);
                await page.locator(".project-detail-dialog__close").click();
                await page.waitForSelector(".project-detail-dialog", {
                    state: "hidden",
                    timeout: 10000,
                });
                await page.waitForTimeout(stepDelayMs);
            } catch (error) {
                stepResult.opened = false;
                stepResult.error = String(error?.message || error);
                result.failedSteps += 1;
                result.steps.push(stepResult);

                const screenshotPath = path.join(process.cwd(), "playwright-work-projects-element-walk-failure.png");
                await page.screenshot({ path: screenshotPath, fullPage: true });
                result.screenshotPath = screenshotPath;
                throw error;
            }
        }
    }

    await clearHighlights(page);
    await setOverlay(
        page,
        `Recorrido completado\nPasos OK: ${result.successfulSteps}\nPasos fallidos: ${result.failedSteps}`,
    );

    const screenshotPath = path.join(process.cwd(), "playwright-work-projects-element-walk.png");
    await page.screenshot({ path: screenshotPath, fullPage: true });
    result.screenshotPath = screenshotPath;

    if (holdOpenMs > 0) {
        await page.waitForTimeout(holdOpenMs);
    }

    const isBroken = pageErrors.length > 0 || result.failedSteps > 0;

    if (isBroken) {
        console.error("PLAYWRIGHT_WORK_PROJECTS_ELEMENT_WALK_FAILED");
        console.error(JSON.stringify(result, null, 2));
        process.exitCode = 1;
    } else {
        console.log("PLAYWRIGHT_WORK_PROJECTS_ELEMENT_WALK_OK");
        console.log(JSON.stringify(result, null, 2));
    }
} catch (error) {
    console.error("PLAYWRIGHT_WORK_PROJECTS_ELEMENT_WALK_ERROR");
    console.error(String(error?.stack || error));
    console.error(JSON.stringify(result, null, 2));
    process.exitCode = 1;
} finally {
    if (browser) {
        await browser.close();
    }
}