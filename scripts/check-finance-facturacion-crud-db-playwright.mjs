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
        createdViaUi: false,
        foundInApi: false,
        visibleInList: false,
        updatedInApi: false,
        deletedInApi: false,
    },
    createdInvoiceId: 0,
};

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
        await api("POST", "/api/v1/finance/invoices", token, {
            clientId: "",
            clientName: "",
            items: [],
            status: "Pendiente",
        });
    } catch {
        rejected = true;
    }
    if (!rejected) throw new Error("backend validation failed");
    result.checks.backendValidation = true;

    browser = await chromium.launch({ headless });
    const ctx = await browser.newContext({ viewport: { width: 1366, height: 900 } });
    await ctx.addInitScript(({ storedSession, apiBase }) => {
        window.localStorage.setItem("pika.auth.session", JSON.stringify(storedSession));
        window.localStorage.setItem("pika.apiBaseUrl", apiBase);
    }, { storedSession: session, apiBase: apiBaseUrl });

    const page = await ctx.newPage();
    await page.goto(`${baseUrl.replace(/\/$/, "")}/app/finance-facturacion-crear`, { waitUntil: "networkidle", timeout: timeoutMs });

    await page.getByRole("button", { name: /^Guardar$/ }).first().click();
    result.checks.frontendValidation = await page.locator(".alert-danger").filter({ hasText: /cliente|item/i }).first().isVisible().catch(() => false);

    await page.locator("select[name='clientId']").selectOption({ index: 1 });
    await page.locator("input[placeholder='Nombre del ítem']").first().fill("Servicio QA");
    await page.locator("input[type='number'][step='100']").first().fill("250000");
    await page.getByRole("button", { name: /^Guardar$/ }).first().click();
    await page.waitForURL(/finance-facturacion$/, { timeout: timeoutMs });
    result.checks.createdViaUi = true;

    const invoices = await api("GET", "/api/v1/finance/invoices", token);
    const created = (invoices.items || []).find((inv) => (inv.items || []).some((it) => it.name === "Servicio QA"));
    if (!created) throw new Error("created invoice not in api");
    result.createdInvoiceId = Number(created.id || 0);
    result.checks.foundInApi = result.createdInvoiceId > 0;

    await page.goto(`${baseUrl.replace(/\/$/, "")}/app/finance-facturacion`, { waitUntil: "networkidle", timeout: timeoutMs });
    result.checks.visibleInList = await page.locator("tbody tr").filter({ hasText: created.clientName }).first().isVisible().catch(() => false);

    created.status = "Pagado";
    await api("PUT", `/api/v1/finance/invoices/${result.createdInvoiceId}`, token, created);
    const updated = await api("GET", `/api/v1/finance/invoices/${result.createdInvoiceId}`, token);
    if (String(updated.status) !== "Pagado") throw new Error("status update not persisted");
    result.checks.updatedInApi = true;

    await api("DELETE", `/api/v1/finance/invoices/${result.createdInvoiceId}`, token);
    const afterDelete = await api("GET", "/api/v1/finance/invoices", token);
    if ((afterDelete.items || []).some((it) => Number(it.id) === result.createdInvoiceId)) throw new Error("invoice delete not persisted");
    result.checks.deletedInApi = true;

    console.log("RESULT_JSON=" + JSON.stringify(result, null, 2));
} catch (error) {
    console.error("RESULT_JSON=" + JSON.stringify(result, null, 2));
    console.error("CHECK_ERROR=" + (error?.stack || error?.message || String(error)));
    process.exitCode = 1;
} finally {
    if (browser) await browser.close();
}
