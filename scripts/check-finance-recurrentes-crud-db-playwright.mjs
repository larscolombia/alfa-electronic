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
        toggledViaUi: false,
        toggledInApi: false,
        deletedViaUi: false,
        deletedInApi: false,
    },
    createdRecurringId: 0,
};

const testTag = `PW-RC-${Date.now()}`;

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
        await api("POST", "/api/v1/finance/recurring-invoices", token, {
            clientId: "",
            clientName: "",
            items: [],
            frequency: "Raro",
            status: "Activa",
        });
    } catch {
        rejected = true;
    }
    if (!rejected) throw new Error("backend recurring validation failed");
    result.checks.backendValidation = true;

    browser = await chromium.launch({ headless });
    const ctx = await browser.newContext({ viewport: { width: 1366, height: 900 } });
    await ctx.addInitScript(({ storedSession, apiBase }) => {
        window.localStorage.setItem("pika.auth.session", JSON.stringify(storedSession));
        window.localStorage.setItem("pika.apiBaseUrl", apiBase);
    }, { storedSession: session, apiBase: apiBaseUrl });

    const page = await ctx.newPage();
    await page.goto(`${baseUrl.replace(/\/$/, "")}/app/finance-facturacion-recurrentes-crear`, { waitUntil: "networkidle", timeout: timeoutMs });

    await page.getByRole("button", { name: /^Guardar$/ }).first().click();
    result.checks.frontendValidation = await page.locator(".alert-danger").filter({ hasText: /cliente|item/i }).first().isVisible().catch(() => false);

    await page.locator("select[name='clientId']").selectOption({ index: 1 });
    await page.locator("select[name='frequency']").selectOption({ index: 1 }).catch(() => {});
    await page.locator("input[name='cycles']").fill("-1").catch(() => {});
    await page.locator("input[placeholder='Nombre del ítem']").first().fill(`Servicio recurrente QA ${testTag}`);
    await page.locator("input[name^='recurring-qty-']").first().fill("1").catch(() => {});
    await page.locator("input[type='number'][step='100']").first().fill("80000");
    await page.locator("select[name^='recurring-tax-']").first().selectOption({ index: 1 }).catch(() => {});
    await page.getByRole("button", { name: /^Guardar$/ }).first().click();
    let redirected = false;
    try {
        await page.waitForURL(/finance-facturacion-recurrente(s)?$/, { timeout: Math.min(timeoutMs, 30000) });
        redirected = true;
    } catch {
        redirected = false;
    }
    if (!redirected) {
        const errorText = await page.locator(".alert-danger,.alert,[role='alert']").first().textContent().catch(() => "");
        throw new Error(`save recurring did not redirect. frontend error: ${String(errorText || "sin detalle")}`);
    }
    result.checks.createdViaUi = true;

    const list = await api("GET", "/api/v1/finance/recurring-invoices", token);
    const created = (list.items || []).find((inv) => (inv.items || []).some((it) => String(it.name || "").includes(testTag)));
    if (!created) throw new Error("created recurring not in api");
    result.createdRecurringId = Number(created.id || 0);
    result.checks.foundInApi = result.createdRecurringId > 0;

    const initialStatus = String(created.status || "");
    const row = page.locator("tbody tr").filter({ hasText: created.clientName }).first();
    await row.locator("button.dropdown-toggle").click();
    await page.getByRole("button", { name: /Pausar|Activar/i }).first().click();
    result.checks.toggledViaUi = true;

    const afterToggle = await api("GET", `/api/v1/finance/recurring-invoices/${result.createdRecurringId}`, token);
    const toggledStatus = String(afterToggle.status || "");
    if (!["Activa", "Pausada"].includes(toggledStatus) || toggledStatus === initialStatus) {
        throw new Error("toggle not persisted");
    }
    result.checks.toggledInApi = true;

    const rowDelete = page.locator("tbody tr").filter({ hasText: created.clientName }).first();
    await rowDelete.locator("button.dropdown-toggle").click();
    await page.getByRole("button", { name: /Eliminar/i }).first().click();
    result.checks.deletedViaUi = true;

    const afterDelete = await api("GET", "/api/v1/finance/recurring-invoices", token);
    if ((afterDelete.items || []).some((it) => Number(it.id) === result.createdRecurringId)) throw new Error("recurring delete not persisted");
    result.checks.deletedInApi = true;

    console.log("RESULT_JSON=" + JSON.stringify(result, null, 2));
} catch (error) {
    console.error("RESULT_JSON=" + JSON.stringify(result, null, 2));
    console.error("CHECK_ERROR=" + (error?.stack || error?.message || String(error)));
    process.exitCode = 1;
} finally {
    if (browser) await browser.close();
}
