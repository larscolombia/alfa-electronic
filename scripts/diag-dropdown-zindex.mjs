import { chromium } from "playwright";

const baseUrl = process.env.PW_BASE_URL || "http://127.0.0.1:4200";
const apiBaseUrl = "http://127.0.0.1:8080";

const loginRes = await fetch(`${apiBaseUrl}/api/v1/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Company-Id": "demo-company" },
    body: JSON.stringify({ email: "admin@alfa.com", password: "1234" }),
});
const session = await loginRes.json();
session.expiresAt = Date.now() + 3600_000;

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1600, height: 960 } });
await context.addInitScript(
    ({ storedSession, api }) => {
        window.localStorage.setItem("pika.auth.session", JSON.stringify(storedSession));
        window.localStorage.setItem("pika.apiBaseUrl", api);
    },
    { storedSession: session, api: apiBaseUrl },
);
const page = await context.newPage();
await page.goto(`${baseUrl}/app/crm-prospectos`, { waitUntil: "networkidle", timeout: 60000 });

const row = page.locator("tbody tr").first();
await row.waitFor({ state: "visible", timeout: 30000 });
await row.getByRole("button", { name: /Acciones/i }).click();
await page.waitForTimeout(600);

const diag = await page.evaluate(() => {
    const menu = document.querySelector(".dropdown-menu.show");
    if (!menu) return { error: "menu no abierto" };
    const rect = menu.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + Math.min(rect.height / 2, 40);
    const top = document.elementFromPoint(cx, cy);
    const chain = [];
    let el = menu;
    while (el && el !== document.body) {
        const cs = getComputedStyle(el);
        if (
            parseInt(cs.zIndex) > 0 ||
            cs.position !== "static" ||
            cs.transform !== "none" ||
            cs.filter !== "none" ||
            cs.backdropFilter !== "none" ||
            cs.opacity !== "1" ||
            cs.willChange !== "auto" ||
            cs.contain.includes("paint")
        ) {
            chain.push({
                el: el.className?.toString().slice(0, 80) || el.tagName,
                zIndex: cs.zIndex,
                position: cs.position,
                transform: cs.transform !== "none" ? "yes" : "",
                backdropFilter: cs.backdropFilter !== "none" ? "yes" : "",
                filter: cs.filter !== "none" ? "yes" : "",
                opacity: cs.opacity !== "1" ? cs.opacity : "",
            });
        }
        el = el.parentElement;
    }
    const topChain = [];
    let t = top;
    while (t && topChain.length < 6) {
        const cs = getComputedStyle(t);
        topChain.push(`${t.tagName}.${String(t.className).split(" ").slice(0, 3).join(".")} z=${cs.zIndex} pos=${cs.position}`);
        t = t.parentElement;
    }
    return {
        menuRect: { x: rect.x, y: rect.y, w: rect.width, h: rect.height },
        elementOnTop: top
            ? `${top.tagName}.${String(top.className).split(" ").slice(0, 4).join(".")} z=${getComputedStyle(top).zIndex}`
            : "none",
        topChain,
        menuZIndex: getComputedStyle(menu).zIndex,
        menuPosition: getComputedStyle(menu).position,
        stackingChain: chain,
    };
});

console.log(JSON.stringify(diag, null, 2));
await page.screenshot({ path: "diag-dropdown.png" });
await browser.close();
