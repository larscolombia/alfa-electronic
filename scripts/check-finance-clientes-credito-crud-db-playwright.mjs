import { chromium } from "playwright";

const baseUrl = process.env.PW_BASE_URL || "http://127.0.0.1:4200";
const timeoutMs = Number(process.env.PW_TIMEOUT_MS || "120000");
const headless = !["false", "0", "no"].includes((process.env.PW_HEADLESS || "true").toLowerCase());
const userEmail = process.env.PW_USER_EMAIL || "admin@alfa.com";
const userPassword = process.env.PW_USER_PASSWORD || "1234";

const apiBaseUrl = (() => {
    if (process.env.PW_API_BASE_URL) return process.env.PW_API_BASE_URL;
    const parsed = new URL(baseUrl);
    if ((parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1") && parsed.port !== "8080") parsed.port = "8080";
    return parsed.origin;
})();

const result = {
    checks: {
        backendValidation: false,
        frontendValidation: false,
        creditUpdatedViaUi: false,
        creditUpdatedInApi: false,
        cleanupClientDeleted: false,
    },
    clientId: "",
};
let createdClientName = "";

async function login() {
    const res = await fetch(`${apiBaseUrl}/api/v1/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Company-Id": "demo-company" },
        body: JSON.stringify({ email: userEmail, password: userPassword }),
    });
    if (!res.ok) throw new Error(`login failed ${res.status}`);
    const payload = await res.json();
    return { ...payload, expiresAt: Date.now() + 3600_000 };
}

async function api(method, path, token, body) {
    const res = await fetch(`${apiBaseUrl}${path}`, {
        method,
        headers: {
            "Content-Type": "application/json",
            "X-Company-Id": "demo-company",
            Authorization: `Bearer ${token}`,
        },
        ...(body ? { body: JSON.stringify(body) } : {}),
    });
    if (res.status === 204) return null;
    const txt = await res.text();
    if (!res.ok) throw new Error(`${method} ${path} -> ${res.status}: ${txt}`);
    return txt ? JSON.parse(txt) : null;
}

let token = "";
let browser;

try {
    const session = await login();
    token = session.accessToken;

    let rejected = false;
    try {
        await api("POST", "/api/v1/crm/clients", token, {
            nombre: "",
            correo: "bad",
            empresa: "",
            zona: "",
            estado: "Activo",
            credito: { enabled: true, creditLimit: 0, consumed: 0, lastPaymentDate: "", paymentTermDays: 30 },
        });
    } catch {
        rejected = true;
    }
    if (!rejected) throw new Error("backend client validation failed");
    result.checks.backendValidation = true;

    const created = await api("POST", "/api/v1/crm/clients", token, {
        nombre: `PW Finance ${Date.now()}`,
        correo: `pw-fin-${Date.now()}@mail.com`,
        empresa: "PW Finance Inc",
        zona: "Norte",
        estado: "Activo",
        credito: { enabled: false, creditLimit: 0, consumed: 0, lastPaymentDate: "", paymentTermDays: 30 },
    });
    result.clientId = String(created.id || "");
    createdClientName = String(created.nombre || "").trim();
    if (!result.clientId) throw new Error("failed creating test client");

    browser = await chromium.launch({ headless });
    const ctx = await browser.newContext({ viewport: { width: 1366, height: 900 } });
    await ctx.addInitScript(({ storedSession, apiBase }) => {
        window.localStorage.setItem("pika.auth.session", JSON.stringify(storedSession));
        window.localStorage.setItem("pika.apiBaseUrl", apiBase);
    }, { storedSession: session, apiBase: apiBaseUrl });

    const page = await ctx.newPage();
    await page.goto(`${baseUrl.replace(/\/$/, "")}/app/finance-clientes-credito`, { waitUntil: "networkidle", timeout: timeoutMs });

    await page.getByRole("button", { name: /^Guardar$/ }).first().click();
    result.checks.frontendValidation = await page.locator(".alert-danger").filter({ hasText: /Selecciona un cliente/i }).first().isVisible().catch(() => false);

    await page.waitForFunction(
        (clientName) => {
            const select = document.querySelector("select[name='clientId']");
            if (!(select instanceof HTMLSelectElement)) return false;
            return Array.from(select.options).some((option) => (option.textContent || "").trim() === clientName);
        },
        createdClientName,
        { timeout: timeoutMs },
    );
    await page.locator("select[name='clientId']").selectOption({ label: createdClientName });
    await page.locator("#creditEnabled").check();
    await page.locator("input[name='creditLimit']").fill("5000000");
    await page.locator("input[name='consumed']").fill("1200000");
    await page.locator("input[name='paymentTermDays']").fill("45");
    await page.getByRole("button", { name: /^Guardar$/ }).first().click();
    await page.locator(".alert-success").first().waitFor({ timeout: timeoutMs });
    result.checks.creditUpdatedViaUi = true;

    const updated = await api("GET", `/api/v1/crm/clients/${encodeURIComponent(result.clientId)}`, token);
    if (!updated.credito?.enabled || Number(updated.credito?.creditLimit) !== 5000000 || Number(updated.credito?.consumed) !== 1200000) {
        throw new Error("credit fields not persisted");
    }
    result.checks.creditUpdatedInApi = true;

    await api("DELETE", `/api/v1/crm/clients/${encodeURIComponent(result.clientId)}`, token);
    result.checks.cleanupClientDeleted = true;

    console.log("RESULT_JSON=" + JSON.stringify(result, null, 2));
} catch (error) {
    console.error("RESULT_JSON=" + JSON.stringify(result, null, 2));
    console.error("CHECK_ERROR=" + (error?.stack || error?.message || String(error)));
    process.exitCode = 1;
} finally {
    if (browser) await browser.close();
}
