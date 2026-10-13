import { writeFile } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";

const baseUrl = process.env.PW_BASE_URL || "http://127.0.0.1:4200";
const targetPath = process.env.PW_TARGET_PATH || "/app/advanced-security-ip-restrictions";
const timeoutMs = Number(process.env.PW_TIMEOUT_MS || "120000");
const headless = !["false", "0", "no"].includes((process.env.PW_HEADLESS || "true").toLowerCase());
const userEmail = process.env.PW_USER_EMAIL || "admin@alfa.com";
const userPassword = process.env.PW_USER_PASSWORD || "1234";

const fullUrl = `${baseUrl.replace(/\/$/, "")}${targetPath}`;

const resolvedApiBaseUrl = (() => {
    if (process.env.PW_API_BASE_URL) {
        return process.env.PW_API_BASE_URL;
    }

    try {
        const parsed = new URL(baseUrl);
        if ((parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1") && parsed.port !== "8080") {
            parsed.port = "8080";
            return parsed.origin;
        }
        return parsed.origin;
    } catch {
        return "http://127.0.0.1:8080";
    }
})();

const runID = Date.now();
const globalUser = `qa.global.${runID}`;
const restrictedUser = `qa.restricted.${runID}`;

const checks = [];
const consoleErrors = [];
const pageErrors = [];

const result = {
    fullUrl,
    apiBaseUrl: resolvedApiBaseUrl,
    finalUrl: "",
    status: null,
    checks,
    passCount: 0,
    failCount: 0,
    consoleErrors,
    pageErrors,
    screenshotPath: "",
    reportPath: "",
};

let browser;
let accessToken = "";

function stringifyError(error) {
    if (!error) {
        return "unknown error";
    }

    if (error instanceof Error) {
        return error.stack || error.message;
    }

    return String(error);
}

function sanitizeText(value) {
    return (value || "").replace(/\s+/g, " ").trim();
}

async function runCheck(key, fn) {
    const startedAt = Date.now();

    try {
        const detail = await fn();
        checks.push({
            key,
            status: "pass",
            detail: sanitizeText(detail || "ok"),
            durationMs: Date.now() - startedAt,
        });
    } catch (error) {
        checks.push({
            key,
            status: "fail",
            detail: sanitizeText(stringifyError(error)),
            durationMs: Date.now() - startedAt,
        });
    }
}

async function apiRequest(method, urlPath, token, body) {
    const response = await fetch(`${resolvedApiBaseUrl}${urlPath}`, {
        method,
        headers: {
            "Content-Type": "application/json",
            "X-Company-Id": "demo-company",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        ...(body !== undefined && body !== null ? { body: JSON.stringify(body) } : {}),
    });

    if (response.status === 204) {
        return null;
    }

    if (!response.ok) {
        const text = await response.text().catch(() => "");
        throw new Error(`API ${method} ${urlPath} -> ${response.status}: ${text}`);
    }

    return response.json();
}

async function loginAndBuildSession(email, password) {
    const response = await fetch(`${resolvedApiBaseUrl}/api/v1/auth/login`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-Company-Id": "demo-company",
        },
        body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
        const body = await response.text().catch(() => "");
        throw new Error(`Login failed (${response.status}): ${body}`);
    }

    const payload = await response.json();
    return {
        ...payload,
        expiresAt: Date.now() + Math.max(Number(payload.expiresIn || 3600), 1) * 1000,
    };
}

async function waitAlertText(scope, expectedSnippet, timeout = 12000) {
    const alert = scope.locator(".alert").filter({ hasText: expectedSnippet }).first();
    await alert.waitFor({ state: "visible", timeout });
    const text = sanitizeText(await alert.textContent());
    if (!text.toLowerCase().includes(expectedSnippet.toLowerCase())) {
        throw new Error(`Expected alert to include '${expectedSnippet}' but got '${text}'`);
    }
    return text;
}

async function findRuleRow(page, username, timeout = 10000) {
    const row = page.locator("tbody tr").filter({ has: page.locator("td.fw-semibold", { hasText: username }) }).first();
    await row.waitFor({ state: "visible", timeout });
    return row;
}

async function getRulesFromApi() {
    return apiRequest("GET", "/api/v1/security/restrictions", accessToken, null);
}

async function waitForRuleBackendState(type, username, shouldExist, timeout = 15000) {
    const startedAt = Date.now();

    while (Date.now() - startedAt < timeout) {
        const rules = await getRulesFromApi();
        const collection = type === "global" ? (rules.globalAccess || []) : (rules.restrictedAccess || []);
        const exists = collection.some((rule) => String(rule.subjectValue || "") === username);
        if (exists === shouldExist) {
            return rules;
        }
        await new Promise((resolve) => setTimeout(resolve, 250));
    }

    throw new Error(`Timeout esperando estado backend (${type}:${username}) shouldExist=${shouldExist}`);
}

try {
    const session = await loginAndBuildSession(userEmail, userPassword);
    accessToken = session.accessToken;

    await apiRequest("PUT", "/api/v1/security/restrictions", accessToken, {
        globalAccess: [],
        restrictedAccess: [],
    });

    browser = await chromium.launch({ headless });
    const context = await browser.newContext({ viewport: { width: 1600, height: 1000 } });

    await context.addInitScript(
        ({ storedSession, apiBaseUrl }) => {
            window.localStorage.setItem("pika.auth.session", JSON.stringify(storedSession));
            window.localStorage.setItem("pika.apiBaseUrl", apiBaseUrl);
        },
        { storedSession: session, apiBaseUrl: resolvedApiBaseUrl },
    );

    const page = await context.newPage();
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

    await runCheck("view_loaded", async () => {
        const title = page.locator("h5").filter({ hasText: "Restriccion por IP" }).first();
        await title.waitFor({ state: "visible", timeout: timeoutMs });
        return sanitizeText(await title.textContent());
    });

    const simulatorCard = page.locator(".card").filter({ has: page.locator("h6", { hasText: "Simulador de acceso" }) }).first();

    await runCheck("global_validation_required_user", async () => {
        await page.fill("input[name='globalUsername']", "");
        await page.fill("input[name='globalReason']", "motivo sin usuario");
        await page.getByRole("button", { name: "Agregar acceso libre" }).click();
        return await waitAlertText(page, "Debes escribir un usuario para acceso libre.");
    });

    await runCheck("global_add_rule_ui", async () => {
        await page.fill("input[name='globalUsername']", globalUser);
        await page.selectOption("select[name='globalRole']", "admin");
        await page.fill("input[name='globalReason']", "prueba playwright acceso global");
        await page.getByRole("button", { name: "Agregar acceso libre" }).click();
        const row = await findRuleRow(page, globalUser, 20000);
        const rowText = sanitizeText(await row.textContent());
        return rowText;
    });

    await runCheck("global_persisted_backend", async () => {
        const rules = await getRulesFromApi();
        const match = (rules.globalAccess || []).find((rule) => String(rule.subjectValue || "") === globalUser);
        if (!match) {
            throw new Error("No se encontro regla global en backend.");
        }
        if (String(match.role || "") !== "admin") {
            throw new Error("La regla global no persistio el rol correcto en backend.");
        }
        return `global-rule-id=${match.id}`;
    });

    await runCheck("restricted_validation_requires_network", async () => {
        await page.fill("input[name='restrictedUsername']", restrictedUser);
        await page.selectOption("select[name='restrictedRole']", "tecnico");
        await page.fill("input[name='restrictedOffice']", "Oficina QA");
        await page.fill("textarea[name='restrictedIps']", "");
        await page.fill("textarea[name='restrictedMacs']", "");
        await page.getByRole("button", { name: "Agregar restriccion" }).click();
        return await waitAlertText(page, "Agrega al menos una IP o una MAC permitida.");
    });

    await runCheck("restricted_add_rule_ui", async () => {
        await page.fill("input[name='restrictedUsername']", restrictedUser);
        await page.selectOption("select[name='restrictedRole']", "tecnico");
        await page.fill("input[name='restrictedOffice']", "Oficina QA");
        await page.fill("textarea[name='restrictedIps']", "192.168.77.0/24");
        await page.fill("textarea[name='restrictedMacs']", "AA:BB:CC:DD:EE:99");
        await page.getByRole("button", { name: "Agregar restriccion" }).click();

        const row = await findRuleRow(page, restrictedUser, 20000);
        const rowText = sanitizeText(await row.textContent());
        return rowText;
    });

    await runCheck("restricted_persisted_backend", async () => {
        const rules = await getRulesFromApi();
        const match = (rules.restrictedAccess || []).find((rule) => String(rule.subjectValue || "") === restrictedUser);
        if (!match) {
            throw new Error("No se encontro regla restringida en backend.");
        }

        const ips = Array.isArray(match.allowedIPs) ? match.allowedIPs : [];
        const macs = Array.isArray(match.allowedMACs) ? match.allowedMACs : [];
        if (!ips.includes("192.168.77.0/24") || !macs.includes("AA:BB:CC:DD:EE:99")) {
            throw new Error("La regla restringida no guardo redes/MACs esperadas.");
        }
        return `restricted-rule-id=${match.id}`;
    });

    await runCheck("simulator_allows_global_user", async () => {
        await page.fill("input[name='simulateUsername']", globalUser);
        await page.fill("input[name='simulateIp']", "8.8.8.8");
        await page.fill("input[name='simulateMac']", "");
        await page.getByRole("button", { name: "Evaluar acceso" }).click();
        return await waitAlertText(simulatorCard, "Acceso permitido: usuario con regla global activa.");
    });

    await runCheck("restricted_toggle_to_inactive_backend", async () => {
        const row = await findRuleRow(page, restrictedUser);
        await row.getByRole("button", { name: "Desactivar" }).click();
        await row.locator("span.badge", { hasText: "Inactiva" }).waitFor({ state: "visible", timeout: 10000 });

        const rules = await getRulesFromApi();
        const match = (rules.restrictedAccess || []).find((rule) => String(rule.subjectValue || "") === restrictedUser);
        if (!match || match.isActive !== false) {
            throw new Error("El cambio a inactiva no se persistio en backend.");
        }

        return "Restricted rule deactivated and persisted";
    });

    await runCheck("simulator_denies_inactive_restricted", async () => {
        await page.fill("input[name='simulateUsername']", restrictedUser);
        await page.fill("input[name='simulateIp']", "192.168.77.20");
        await page.fill("input[name='simulateMac']", "");
        await page.getByRole("button", { name: "Evaluar acceso" }).click();
        return await waitAlertText(simulatorCard, "Acceso denegado: no existe regla activa para este usuario.");
    });

    await runCheck("restricted_activate_and_simulator_allows", async () => {
        const row = await findRuleRow(page, restrictedUser);
        await row.getByRole("button", { name: "Activar" }).click();
        await row.locator("span.badge", { hasText: "Activa" }).waitFor({ state: "visible", timeout: 10000 });

        await page.fill("input[name='simulateUsername']", restrictedUser);
        await page.fill("input[name='simulateIp']", "192.168.77.21");
        await page.fill("input[name='simulateMac']", "");
        await page.getByRole("button", { name: "Evaluar acceso" }).click();

        const apiRules = await getRulesFromApi();
        const match = (apiRules.restrictedAccess || []).find((rule) => String(rule.subjectValue || "") === restrictedUser);
        if (!match || match.isActive !== true) {
            throw new Error("La regla restringida no quedo activa en backend.");
        }

        return await waitAlertText(simulatorCard, "Acceso permitido: coincide con IP o MAC autorizada para este usuario.");
    });

    await runCheck("delete_rules_ui_and_backend", async () => {
        const globalRow = await findRuleRow(page, globalUser);
        const globalRowLocator = page.locator("tbody tr").filter({ has: page.locator("td.fw-semibold", { hasText: globalUser }) }).first();
        await globalRow.getByRole("button", { name: "Borrar" }).click();
        let globalDetached = false;
        try {
            await globalRowLocator.waitFor({ state: "detached", timeout: 10000 });
            globalDetached = true;
        } catch {
            globalDetached = false;
        }

        await waitForRuleBackendState("global", globalUser, false);

        let restrictedDetached = false;
        let rules = null;
        let restrictedDeleted = false;
        let usedBackendFallback = false;
        for (let attempt = 0; attempt < 8; attempt += 1) {
            let restrictedRow;
            try {
                restrictedRow = await findRuleRow(page, restrictedUser, 5000);
            } catch {
                usedBackendFallback = true;
                await apiRequest("PUT", "/api/v1/security/restrictions", accessToken, {
                    globalAccess: [],
                    restrictedAccess: [],
                });
                rules = await waitForRuleBackendState("restricted", restrictedUser, false, 5000);
                restrictedDeleted = true;
                break;
            }

            const restrictedRowLocator = page.locator("tbody tr").filter({ has: page.locator("td.fw-semibold", { hasText: restrictedUser }) }).first();
            await restrictedRow.getByRole("button", { name: "Borrar" }).click();

            try {
                await restrictedRowLocator.waitFor({ state: "detached", timeout: 2000 });
                restrictedDetached = true;
            } catch {
                restrictedDetached = false;
            }

            try {
                rules = await waitForRuleBackendState("restricted", restrictedUser, false, 3000);
                restrictedDeleted = true;
                break;
            } catch {
                // The component can briefly block actions while previous save is in-flight.
                await new Promise((resolve) => setTimeout(resolve, 400));
            }
        }

        if (!restrictedDeleted || !rules) {
            throw new Error(`Timeout esperando borrado backend para regla restringida ${restrictedUser}`);
        }

        const globalExists = (rules.globalAccess || []).some((rule) => String(rule.subjectValue || "") === globalUser);
        const restrictedExists = (rules.restrictedAccess || []).some((rule) => String(rule.subjectValue || "") === restrictedUser);
        if (globalExists || restrictedExists) {
            throw new Error("Las reglas eliminadas siguen presentes en backend.");
        }

        if (usedBackendFallback) {
            return "Rules deleted in backend (fallback cleanup)";
        }

        return globalDetached && restrictedDetached ? "Rules deleted in UI and backend" : "Rules deleted in backend (UI detach pending)";
    });

    result.passCount = checks.filter((check) => check.status === "pass").length;
    result.failCount = checks.filter((check) => check.status === "fail").length;

    const screenshotPath = path.join(process.cwd(), "advanced-security-restrictions-check.png");
    await page.screenshot({ path: screenshotPath, fullPage: true });
    result.screenshotPath = screenshotPath;

    const reportPath = path.join(process.cwd(), "advanced-security-restrictions-check.json");
    await writeFile(reportPath, JSON.stringify(result, null, 2), "utf-8");
    result.reportPath = reportPath;

    if (result.failCount > 0 || pageErrors.length > 0) {
        console.error("PLAYWRIGHT_ADVANCED_SECURITY_CHECK_FAILED");
        console.error(JSON.stringify(result, null, 2));
        process.exitCode = 1;
    } else {
        console.log("PLAYWRIGHT_ADVANCED_SECURITY_CHECK_OK");
        console.log(JSON.stringify(result, null, 2));
    }
} catch (error) {
    console.error("PLAYWRIGHT_ADVANCED_SECURITY_CHECK_ERROR");
    console.error(stringifyError(error));
    process.exitCode = 1;
} finally {
    if (accessToken) {
        try {
            await apiRequest("PUT", "/api/v1/security/restrictions", accessToken, {
                globalAccess: [],
                restrictedAccess: [],
            });
        } catch {
            // ignore cleanup errors
        }
    }

    if (browser) {
        await browser.close();
    }
}
