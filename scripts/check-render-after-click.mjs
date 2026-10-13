import { chromium } from "playwright";

const baseUrl = "https://pika.software.net.co";
const apiBase = "https://pika.software.net.co";
const routes = [
    "/app/crm-prospectos",
    "/app/crm-cotizaciones",
    "/app/company-user-roles",
    "/app/company-hr-employees",
    "/app/advanced-security-ip-restrictions",
    "/app/calendar",
];

async function login() {
    const resp = await fetch(`${apiBase}/api/v1/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Company-Id": "demo-company" },
        body: JSON.stringify({ email: "admin@alfa.com", password: "1234" }),
    });
    if (!resp.ok) throw new Error(`login failed ${resp.status}`);
    const payload = await resp.json();
    return {
        ...payload,
        expiresAt: Date.now() + Math.max(Number(payload.expiresIn || 3600), 1) * 1000,
    };
}

function extractState() {
    const rows = Array.from(document.querySelectorAll("tbody tr"));
    const nonEmptyRows = rows.filter((r) => {
        const t = (r.textContent || "").trim();
        return t && !/ningun dato|no data|sin datos/i.test(t);
    });
    const links = Array.from(document.querySelectorAll("tbody a"))
        .map((a) => (a.textContent || "").trim())
        .filter(Boolean);
    const buttons = Array.from(document.querySelectorAll("tbody button"))
        .map((b) => (b.textContent || "").trim())
        .filter(Boolean);
    const emptyMsg = /ningun dato|no data|sin datos/i.test(document.body.textContent || "");
    return {
        rows: rows.length,
        nonEmptyRows: nonEmptyRows.length,
        links: links.length,
        buttons: buttons.length,
        emptyMsg,
    };
}

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext();
const page = await context.newPage();
const session = await login();

await page.addInitScript(
    (s, api) => {
        localStorage.setItem("pika.auth.session", JSON.stringify(s));
        localStorage.setItem("pika.apiBaseUrl", api);
    },
    session,
    apiBase,
);

for (const route of routes) {
    const url = `${baseUrl}${route}`;
    try {
        await page.goto(url, { waitUntil: "networkidle", timeout: 90000 });
        await page.waitForTimeout(1500);
        const before = await page.evaluate(extractState);
        await page.mouse.click(20, 20);
        await page.waitForTimeout(700);
        const after = await page.evaluate(extractState);
        const appearsAfterClick = before.nonEmptyRows === 0 && after.nonEmptyRows > 0;
        console.log(JSON.stringify({ route, before, after, appearsAfterClick }));
    } catch (e) {
        console.log(JSON.stringify({ route, error: String(e) }));
    }
}

await browser.close();
