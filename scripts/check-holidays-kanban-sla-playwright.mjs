import { chromium } from "playwright";

const baseUrl = process.env.PW_BASE_URL || "http://127.0.0.1:4200";
const timeoutMs = Number(process.env.PW_TIMEOUT_MS || "120000");
const headless = false;
const slowMoMs = Number(process.env.PW_SLOW_MO_MS || "200");
const artifactsDir = process.env.PW_ARTIFACTS_DIR || "playwright-artifacts";

const AUTH_STORAGE_KEY = "pika.auth.session";
const API_BASE_STORAGE_KEY = "pika.apiBaseUrl";
const PROJECTS_STORAGE_KEY = "lars.projects.items.v3";
const BOARD_STORAGE_KEY = "lars.projects.board.v3";
const HOLIDAYS_STORAGE_KEY = "lars.hr.worktime.holidays";
const BUSINESS_DAYS_STORAGE_KEY = "lars.hr.worktime.business-days.v1";

const SLA_FIXTURES = [
    { title: "PW SLA RECIBIDO", columnId: "recibido", ageDays: 1, expectedSeverity: "success" },
    { title: "PW SLA DIAGNOSTICO", columnId: "diagnostico", ageDays: 3, expectedSeverity: "warning" },
    { title: "PW SLA REPARACION", columnId: "reparacion", ageDays: 5, expectedSeverity: "overdue" },
    { title: "PW SLA PRUEBAS", columnId: "pruebas", ageDays: 7, expectedSeverity: "critical" },
    { title: "PW SLA LISTO", columnId: "listo-entrega", ageDays: 2, expectedSeverity: "success" },
    { title: "PW SLA ENTREGADO", columnId: "entregado", ageDays: 4, expectedSeverity: "warning" },
];

const result = {
    fullUrl: "",
    finalUrl: "",
    artifacts: {
        videoPath: "",
        screenshots: [],
    },
    checks: {
        businessDaysConfigured: false,
        holidayCreated: false,
        holidayPersisted: false,
        projectColumnsValidated: false,
        semaphoreValidated: false,
    },
    projectsChecked: [],
    severityCounts: {
        success: 0,
        warning: 0,
        overdue: 0,
        critical: 0,
    },
};

function assertOrThrow(condition, message) {
    if (!condition) {
        throw new Error(message);
    }
}

function buildMockSession() {
    return {
        accessToken: "pw-mock-token",
        tokenType: "Bearer",
        expiresIn: 3600,
        expiresAt: Date.now() + 3600000,
        user: {
            email: "admin@alfa.com",
            name: "Playwright Admin",
            role: "admin",
        },
    };
}

(async () => {
    let browser;
    let context;
    let page;

    try {
        const session = buildMockSession();
        const holidayName = `PW Festivo ${Date.now()}`;
        const holidayYear = new Date().getFullYear();
        const holidayDate = `${holidayYear}-12-31`;

        console.log("Running Playwright in non-headless mode (headless=false) with virtual display support.");
        browser = await chromium.launch({ headless, slowMo: slowMoMs });
        context = await browser.newContext({
            viewport: { width: 1600, height: 1000 },
            recordVideo: { dir: artifactsDir, size: { width: 1280, height: 720 } },
        });

        await context.addInitScript(
            ({ authStorageKey, apiStorageKey, mockSession }) => {
                window.localStorage.setItem(authStorageKey, JSON.stringify(mockSession));
                window.localStorage.setItem(apiStorageKey, "http://127.0.0.1:8080");
            },
            {
                authStorageKey: AUTH_STORAGE_KEY,
                apiStorageKey: API_BASE_STORAGE_KEY,
                mockSession: session,
            }
        );

        page = await context.newPage();

        const capture = async (name) => {
            const safeName = String(name || "step").replace(/[^a-zA-Z0-9_-]/g, "-");
            const path = `${artifactsDir}/${Date.now()}-${safeName}.png`;
            await page.screenshot({ path, fullPage: true });
            result.artifacts.screenshots.push(path);
        };

        result.fullUrl = `${baseUrl}/app/company-hr-worktime`;
        await page.goto(result.fullUrl, { waitUntil: "domcontentloaded", timeout: timeoutMs });
        await page.waitForSelector("text=RRHH - Horarios y festivos", { timeout: timeoutMs });
        await capture("01-hr-worktime-loaded");

        const saturdayCheckbox = page.locator("#business-day-Sab");
        await saturdayCheckbox.waitFor({ state: "visible", timeout: timeoutMs });
        const saturdayBefore = await saturdayCheckbox.isChecked();
        await saturdayCheckbox.click({ force: true });
        await page.waitForTimeout(200);
        const saturdayAfter = await saturdayCheckbox.isChecked();
        assertOrThrow(saturdayBefore !== saturdayAfter, "No fue posible cambiar el estado del dia Sab en la configuracion laboral.");

        const holidayYearInput = page.locator('label:has-text("Ano") + input').first();
        const holidayDateInput = page.locator('label:has-text("Fecha") + input').first();
        const holidayNameInput = page.locator('label:has-text("Nombre del festivo") + input').first();
        const addHolidayButton = page.locator('button.btn.btn-outline-theme.w-100').first();

        await holidayYearInput.fill(String(holidayYear));
        await holidayDateInput.fill(holidayDate);
        await holidayNameInput.fill(holidayName);
        await addHolidayButton.click({ force: true });

        await page.getByRole("button", { name: "Guardar configuracion" }).first().click({ force: true });
        await capture("02-holiday-created-and-saved");

        const calendarStorage = await page.evaluate(
            ({ businessDaysKey, holidaysKey }) => {
                const businessDaysRaw = window.localStorage.getItem(businessDaysKey) || "[]";
                const holidaysRaw = window.localStorage.getItem(holidaysKey) || "[]";
                return {
                    businessDays: JSON.parse(businessDaysRaw),
                    holidays: JSON.parse(holidaysRaw),
                };
            },
            {
                businessDaysKey: BUSINESS_DAYS_STORAGE_KEY,
                holidaysKey: HOLIDAYS_STORAGE_KEY,
            }
        );

        result.checks.businessDaysConfigured = Array.isArray(calendarStorage.businessDays) && calendarStorage.businessDays.includes("Sab") === saturdayAfter;
        assertOrThrow(result.checks.businessDaysConfigured, "El cambio de dias de semana no quedo persistido correctamente.");

        result.checks.holidayCreated = (await page.locator("table tbody tr", { hasText: holidayName }).count()) > 0;
        assertOrThrow(result.checks.holidayCreated, "No se visualiza el festivo creado en la tabla.");

        result.checks.holidayPersisted = Array.isArray(calendarStorage.holidays)
            && calendarStorage.holidays.some((entry) => String(entry?.name ?? "") === holidayName && String(entry?.date ?? "") === holidayDate);
        assertOrThrow(result.checks.holidayPersisted, "El festivo creado no quedo persistido en localStorage.");

        await page.evaluate((businessDaysKey) => {
            window.localStorage.setItem(businessDaysKey, JSON.stringify(["Lun", "Mar", "Mie", "Jue", "Vie", "Sab", "Dom"]));
        }, BUSINESS_DAYS_STORAGE_KEY);

        await page.evaluate(
            ({ fixtures, boardStorageKey, projectsStorageKey }) => {
                const board = {
                    id: "board-1",
                    name: "Flujo tecnico de reparacion",
                    icon: "bi-kanban",
                    defaultView: "kanban",
                    propertyTemplates: [],
                    columns: [
                        { id: "recibido", name: "Recibido", color: "#64748b", order: 1, greenDays: 2, yellowDays: 2, includeInWorkload: true, trackAging: true },
                        { id: "diagnostico", name: "Diagnostico", color: "#2563eb", order: 2, greenDays: 2, yellowDays: 2, includeInWorkload: true, trackAging: true },
                        { id: "reparacion", name: "Reparacion", color: "#7c3aed", order: 3, greenDays: 2, yellowDays: 2, includeInWorkload: true, trackAging: true },
                        { id: "pruebas", name: "Pruebas QA", color: "#0f766e", order: 4, greenDays: 2, yellowDays: 2, includeInWorkload: true, trackAging: true },
                        { id: "listo-entrega", name: "Listo para entrega", color: "#10b981", order: 5, greenDays: 2, yellowDays: 2, includeInWorkload: true, trackAging: true },
                        { id: "entregado", name: "Entregado", color: "#94a3b8", order: 6, greenDays: 2, yellowDays: 2, includeInWorkload: true, trackAging: true },
                    ],
                };

                const projects = fixtures.map((fixture, index) => ({
                    id: `pw-sla-${index + 1}`,
                    title: fixture.title,
                    description: `Fixture ${fixture.expectedSeverity}`,
                    status: fixture.columnId,
                    boardId: "board-1",
                    createdBy: "playwright",
                    createdAt: new Date(Date.now() - (fixture.ageDays + 1) * 24 * 60 * 60 * 1000).toISOString(),
                    updatedAt: new Date(Date.now() - fixture.ageDays * 24 * 60 * 60 * 1000).toISOString(),
                    properties: {
                        stageEnteredAt: new Date(Date.now() - fixture.ageDays * 24 * 60 * 60 * 1000).toISOString(),
                        priority: "low",
                    },
                }));

                window.localStorage.setItem(boardStorageKey, JSON.stringify(board));
                window.localStorage.setItem(projectsStorageKey, JSON.stringify(projects));
            },
            {
                fixtures: SLA_FIXTURES,
                boardStorageKey: BOARD_STORAGE_KEY,
                projectsStorageKey: PROJECTS_STORAGE_KEY,
            }
        );

        const projectsUrl = `${baseUrl}/app/work-projects`;
        await page.goto(projectsUrl, { waitUntil: "domcontentloaded", timeout: timeoutMs });
        await page.waitForSelector(".kanban-board", { timeout: timeoutMs });
        await capture("03-work-projects-loaded");

        for (const fixture of SLA_FIXTURES) {
            const card = page
                .locator(".project-card")
                .filter({ has: page.locator(".card-title", { hasText: fixture.title }) })
                .first();

            await card.waitFor({ state: "visible", timeout: timeoutMs });

            const actualSeverity = String(await card.getAttribute("data-sla-severity") || "");
            const actualColumn = String(
                await card.evaluate((node) => node.closest(".cards-sortable")?.getAttribute("data-column-id") || "")
            );

            result.projectsChecked.push({
                title: fixture.title,
                expectedSeverity: fixture.expectedSeverity,
                actualSeverity,
                expectedColumn: fixture.columnId,
                actualColumn,
            });

            assertOrThrow(
                actualColumn === fixture.columnId,
                `Proyecto ${fixture.title} quedo en columna ${actualColumn} y se esperaba ${fixture.columnId}.`
            );

            assertOrThrow(
                actualSeverity === fixture.expectedSeverity,
                `Proyecto ${fixture.title} quedo en semaforo ${actualSeverity} y se esperaba ${fixture.expectedSeverity}.`
            );
        }

        result.severityCounts.success = await page.locator('.project-card[data-sla-severity="success"]').count();
        result.severityCounts.warning = await page.locator('.project-card[data-sla-severity="warning"]').count();
        result.severityCounts.overdue = await page.locator('.project-card[data-sla-severity="overdue"]').count();
        result.severityCounts.critical = await page.locator('.project-card[data-sla-severity="critical"]').count();

        assertOrThrow(result.severityCounts.success > 0, "No se detecto ningun proyecto en semaforo verde.");
        assertOrThrow(result.severityCounts.warning > 0, "No se detecto ningun proyecto en semaforo amarillo.");
        assertOrThrow(result.severityCounts.overdue > 0, "No se detecto ningun proyecto en semaforo naranja.");
        assertOrThrow(result.severityCounts.critical > 0, "No se detecto ningun proyecto en semaforo rojo.");

        result.checks.projectColumnsValidated = true;
        result.checks.semaphoreValidated = true;
        result.finalUrl = page.url();
        await capture("04-semaphore-validated");

        console.log("PLAYWRIGHT_HOLIDAYS_KANBAN_SLA_OK");
        console.log(JSON.stringify(result, null, 2));
    } catch (error) {
        console.error("PLAYWRIGHT_HOLIDAYS_KANBAN_SLA_ERROR");
        console.error(String(error?.stack || error));
        console.error(JSON.stringify(result, null, 2));
        process.exitCode = 1;
    } finally {
        if (context) {
            await context.close();
        }
        if (page?.video) {
            try {
                const video = page.video();
                if (video) {
                    result.artifacts.videoPath = await video.path();
                    console.log(`PLAYWRIGHT_VIDEO_PATH=${result.artifacts.videoPath}`);
                }
            } catch {
                // Keep script resilient if video path is not available.
            }
        }
        if (browser) {
            await browser.close();
        }
    }
})();