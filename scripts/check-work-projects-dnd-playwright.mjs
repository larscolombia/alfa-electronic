import path from "node:path";
import { chromium } from "playwright";

const baseUrl = process.env.PW_BASE_URL || "http://127.0.0.1:4200";
const targetPath = process.env.PW_TARGET_PATH || "/app/work-projects";
const timeoutMs = Number(process.env.PW_TIMEOUT_MS || "60000");
const headless = !["false", "0", "no"].includes((process.env.PW_HEADLESS || "true").toLowerCase());
const slowMoMs = Number(process.env.PW_SLOW_MO_MS || "0");
const browserChannel = process.env.PW_BROWSER_CHANNEL || undefined;
const fullUrl = `${baseUrl.replace(/\/$/, "")}${targetPath}`;

const consoleErrors = [];
const pageErrors = [];

const result = {
    fullUrl,
    finalUrl: "",
    status: null,
    sourceColumnId: "",
    targetColumnId: "",
    beforeColumnId: "",
    afterColumnId: "",
    projectId: "",
    projectTitle: "",
    promptOpenedOnCancel: false,
    promptOpenedOnConfirm: false,
    cancelledBackToSource: false,
    movedAfterConfirm: false,
    clickTriggered: false,
    detailOpened: false,
    detailTitle: "",
    consoleErrors,
    pageErrors,
    screenshotPath: "",
};

let browser;

try {
    browser = await chromium.launch({ headless, slowMo: slowMoMs, channel: browserChannel });
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

    const selection = await page.evaluate(() => {
        const columns = Array.from(document.querySelectorAll(".cards-sortable"))
            .map((column) => ({
                columnId: column.getAttribute("data-column-id") || "",
                items: Array.from(column.querySelectorAll(".project-drag-item")).map((item) => ({
                    projectId: item.getAttribute("data-project-id") || "",
                    title: item.querySelector(".card-title")?.textContent?.trim() || "",
                })),
            }))
            .filter((column) => column.columnId);

        const sourceColumn = columns.find((column) => column.columnId === "reparacion" && column.items.length > 0);
        const targetColumn = columns.find((column) => column.columnId === "pruebas");

        return {
            sourceColumnId: sourceColumn?.columnId || "",
            targetColumnId: targetColumn?.columnId || "",
            projectId: sourceColumn?.items[0]?.projectId || "",
            projectTitle: sourceColumn?.items[0]?.title || "",
        };
    });

    result.sourceColumnId = selection.sourceColumnId;
    result.targetColumnId = selection.targetColumnId;
    result.beforeColumnId = selection.sourceColumnId;
    result.projectId = selection.projectId;
    result.projectTitle = selection.projectTitle;

    if (!result.projectId || !result.sourceColumnId || !result.targetColumnId) {
        throw new Error("No se pudo encontrar un proyecto origen y una columna destino para probar drag and drop.");
    }

    const handle = page.locator(`.project-drag-item[data-project-id="${result.projectId}"] .project-card__drag-handle`).first();
    const targetZone = page.locator(`.cards-sortable[data-column-id="${result.targetColumnId}"]`).first();

    const resolveColumnId = async () => page.evaluate((projectId) => {
        const projectElement = document.querySelector(`.project-drag-item[data-project-id="${projectId}"]`);
        return projectElement?.closest(".cards-sortable")?.getAttribute("data-column-id") || "";
    }, result.projectId);

    const transitionPrompt = page.locator(".project-transition-dialog").first();

    const performDrag = async () => {
        await handle.scrollIntoViewIfNeeded();
        await targetZone.scrollIntoViewIfNeeded();

        const currentHandleBox = await handle.boundingBox();
        const currentTargetBox = await targetZone.boundingBox();
        if (!currentHandleBox || !currentTargetBox) {
            throw new Error("No fue posible calcular las coordenadas para el gesto de arrastre.");
        }

        const startX = currentHandleBox.x + currentHandleBox.width / 2;
        const startY = currentHandleBox.y + currentHandleBox.height / 2;
        const targetX = currentTargetBox.x + Math.min(currentTargetBox.width / 2, 140);
        const targetY = currentTargetBox.y + Math.min(Math.max(currentTargetBox.height / 2, 90), currentTargetBox.height - 20);

        await page.mouse.move(startX, startY);
        await page.mouse.down();
        await page.mouse.move(startX + 12, startY + 12, { steps: 8 });
        await page.mouse.move(targetX, targetY, { steps: 24 });
        await page.mouse.up();
    };

    const fillTransitionPrompt = async () => {
        const questions = transitionPrompt.locator(".transition-question");
        const count = await questions.count();

        for (let index = 0; index < count; index += 1) {
            const question = questions.nth(index);
            const select = question.locator("select.form-select").first();
            const numberInput = question.locator('input[type="number"]').first();
            const textarea = question.locator("textarea").first();

            if (await select.count()) {
                const values = await select.locator("option").evaluateAll((options) => options.map((option) => option.value).filter(Boolean));
                if (!values.length) {
                    throw new Error("No se encontraron opciones dentro del lote de pruebas del flujo.");
                }
                await select.selectOption(values[0]);
                continue;
            }

            if (await numberInput.count()) {
                await numberInput.fill(String(70 + index));
                continue;
            }

            if (await textarea.count()) {
                await textarea.fill(`Respuesta drag ${index + 1}`);
            }
        }
    };

    await performDrag();
    await transitionPrompt.waitFor({ state: "visible", timeout: 20000 });
    result.promptOpenedOnCancel = true;
    await transitionPrompt.getByRole("button", { name: "Cancelar" }).evaluate((button) => button.click());
    await transitionPrompt.waitFor({ state: "hidden", timeout: 20000 });

    result.afterColumnId = await resolveColumnId();
    result.cancelledBackToSource = result.afterColumnId === result.beforeColumnId;
    if (!result.cancelledBackToSource) {
        throw new Error("Cancelar el lote de pruebas no devolvio el proyecto a la columna origen.");
    }

    await performDrag();
    await transitionPrompt.waitFor({ state: "visible", timeout: 20000 });
    result.promptOpenedOnConfirm = true;
    await fillTransitionPrompt();
    await transitionPrompt.getByRole("button", { name: "Confirmar transicion" }).evaluate((button) => button.click());
    await transitionPrompt.waitFor({ state: "hidden", timeout: 20000 });

    await page.waitForFunction(
        ({ projectId, targetColumnId }) => {
            const projectElement = document.querySelector(`.project-drag-item[data-project-id="${projectId}"]`);
            const parentColumnId = projectElement?.closest(".cards-sortable")?.getAttribute("data-column-id") || "";
            return parentColumnId === targetColumnId;
        },
        { projectId: result.projectId, targetColumnId: result.targetColumnId },
        { timeout: 20000 },
    );

    result.afterColumnId = await resolveColumnId();
    result.movedAfterConfirm = result.afterColumnId === result.targetColumnId && result.afterColumnId !== result.beforeColumnId;

    const movedCardSelector = `.project-drag-item[data-project-id="${result.projectId}"] .project-card`;
    await page.waitForSelector(movedCardSelector, {
        state: "visible",
        timeout: 15000,
    });
    await page.click(movedCardSelector, { position: { x: 40, y: 40 } });
    result.clickTriggered = true;

    try {
        await page.waitForSelector(".project-detail-dialog", {
            state: "visible",
            timeout: 15000,
        });

        await page.waitForFunction(() => {
            const title = document.querySelector(".project-detail-dialog__title")?.textContent?.trim() || "";
            return title.length > 0;
        }, { timeout: 15000 });

        result.detailTitle = ((await page.locator(".project-detail-dialog__title").first().innerText()) || "").trim();
        result.detailOpened = result.detailTitle.length > 0;
    } catch {
        result.detailOpened = false;
    }

    const screenshotPath = path.join(process.cwd(), "playwright-work-projects-dnd-check.png");
    await page.screenshot({ path: screenshotPath, fullPage: true });
    result.screenshotPath = screenshotPath;

    const isBroken = pageErrors.length > 0
        || !result.promptOpenedOnCancel
        || !result.promptOpenedOnConfirm
        || !result.cancelledBackToSource
        || !result.movedAfterConfirm
        || !result.detailOpened;

    if (isBroken) {
        console.error("PLAYWRIGHT_WORK_PROJECTS_DND_CHECK_FAILED");
        console.error(JSON.stringify(result, null, 2));
        process.exitCode = 1;
    } else {
        console.log("PLAYWRIGHT_WORK_PROJECTS_DND_CHECK_OK");
        console.log(JSON.stringify(result, null, 2));
    }
} catch (error) {
    console.error("PLAYWRIGHT_WORK_PROJECTS_DND_CHECK_ERROR");
    console.error(String(error?.stack || error));
    console.error(JSON.stringify(result, null, 2));
    process.exitCode = 1;
} finally {
    if (browser) {
        await browser.close();
    }
}