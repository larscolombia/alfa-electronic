/**
 * AUDITORÍA DE ENCADENAMIENTO UX — flujo LARS de punta a punta.
 * Recorrido de SOLO LECTURA sobre la cadena t16 existente:
 *   prospecto "LARS T16 1792907307431" / serie SER-LARS-T16-1792907307431 /
 *   equipo CO-T16-1792907307431 / cotización COT-LARS-T16-1792907307431 /
 *   OC OC-LARS-1042-t16-1792907307431 / repuesto IGBT-LARS-t16-1792907307431 /
 *   proyecto PRJ-T16-1792907307431 / remisión E-CO-2610-0033 / factura FAC-2026-055.
 *
 * Por cada módulo captura: (a) ¿el dato del eslabón anterior está visible e
 * íntegro? (b) ¿qué CTAs (botones/enlaces) ofrece la página? (c) screenshot.
 * No muta nada: navega, lee y fotografía.
 *
 * Uso: xvfb-run -a env PW_BASE_URL=https://alfa.software.net.co PW_HEADLESS=false \
 *        node scripts/auditor-chaining-lars.mjs
 */
import path from "node:path";
import { chromium } from "playwright";

const baseUrl = (process.env.PW_BASE_URL || "https://alfa.software.net.co").replace(/\/+$/, "");
const apiBaseUrl = new URL(baseUrl).origin;
const artifactsDir = process.env.PW_ARTIFACTS_DIR || "playwright-artifacts";
const headless = !["false", "0", "no"].includes((process.env.PW_HEADLESS || "true").toLowerCase());

const CHAIN = {
    prospecto: "LARS T16 1792907307431",
    prospectoId: "c09920b7-ca72-4d91-bcd1-f7e73e29a94b",
    empresa: "LARS Industrial T16 1792907307431",
    serie: "SER-LARS-T16-1792907307431",
    equipo: "CO-T16-1792907307431",
    cotizacion: "COT-LARS-T16-1792907307431",
    oc: "OC-LARS-1042-t16-1792907307431",
    repuesto: "IGBT-LARS-t16-1792907307431",
    proyecto: "PRJ-T16-1792907307431",
    proyectoId: "proj-lars-t16-1792907307431",
    remision: "E-CO-2610-0033",
    factura: "FAC-2026-055",
};

const report = { baseUrl, modules: {}, uxViolations: [], startedAt: new Date().toISOString() };

async function loginAdmin() {
    const res = await fetch(`${apiBaseUrl}/api/v1/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Company-Id": "demo-company" },
        body: JSON.stringify({ email: "admin@alfa.com", password: "1234" }),
    });
    if (!res.ok) throw new Error(`login ${res.status}`);
    const data = await res.json();
    return { ...data, expiresAt: Date.now() + 3600 * 1000 };
}

async function shot(page, name) {
    const p = path.resolve(artifactsDir, `auditor-chain-${name}.png`);
    await page.screenshot({ path: p, fullPage: true }).catch(() => "");
    return p;
}

/** Extrae textos de botones y enlaces visibles (affordances/CTAs de la página). */
async function ctas(page) {
    return page.evaluate(() => {
        const out = [];
        document.querySelectorAll("button, a[role='button'], .btn, a.dropdown-item, .nav-link").forEach((el) => {
            const t = (el.textContent || "").replace(/\s+/g, " ").trim();
            const visible = el.offsetWidth > 0 && el.offsetHeight > 0;
            if (t && visible && t.length < 80 && !out.includes(t)) out.push(t);
        });
        return out;
    });
}

async function bodyText(page) {
    return ((await page.locator("body").innerText().catch(() => "")) || "").replace(/\s+/g, " ");
}

async function visit(page, route, name, expected = [], options = {}) {
    const mod = { route: `/app/${route}`, url: "", expectedFound: {}, expectedMissing: [], ctas: [], screenshot: "" };
    try {
        await page.goto(`${baseUrl}/app/${route}`, { waitUntil: "networkidle", timeout: 120000 });
        mod.url = page.url();
        if (options.filterTestid) {
            const input = page.locator(options.filterTestid).first();
            if (await input.isVisible({ timeout: 8000 }).catch(() => false)) {
                await input.fill(options.filterValue);
                await page.waitForTimeout(2000);
            }
        } else if (options.waitText) {
            await page.waitForSelector(`text=${options.waitText}`, { timeout: 30000 }).catch(() => null);
        }
        await page.waitForTimeout(2000);
        const text = await bodyText(page);
        for (const e of expected) mod.expectedFound[e] = text.includes(e);
        mod.expectedMissing = expected.filter((e) => !text.includes(e));
        mod.ctas = await ctas(page);
        mod.screenshot = await shot(page, name);
        if (options.clipTestid) {
            const clip = page.locator(options.clipTestid).first();
            if (await clip.isVisible({ timeout: 5000 }).catch(() => false)) {
                const p2 = path.resolve(artifactsDir, `auditor-chain-${name}-clip.png`);
                await clip.screenshot({ path: p2 }).catch(() => "");
                mod.clipScreenshot = p2;
            }
        }
    } catch (err) {
        mod.error = String(err?.message || err).slice(0, 200);
        mod.screenshot = await shot(page, `${name}-error`);
    }
    report.modules[name] = mod;
    console.log(`\n### ${name} (${mod.route})`);
    console.log(`  url final: ${mod.url}`);
    console.log(`  datos esperados: ${JSON.stringify(mod.expectedFound)}`);
    if (mod.expectedMissing.length) console.log(`  FALTAN: ${mod.expectedMissing.join(" | ")}`);
    console.log(`  CTAs visibles (${mod.ctas.length}): ${mod.ctas.slice(0, 40).join(" · ")}`);
    if (mod.error) console.log(`  ERROR: ${mod.error}`);
    return mod;
}

const browser = await chromium.launch({ headless, args: ["--disable-dev-shm-usage", "--no-sandbox"] });
const context = await browser.newContext({ viewport: { width: 1600, height: 1000 } });
const session = await loginAdmin();
await context.addInitScript(({ s, a }) => {
    window.localStorage.setItem("pika.auth.session", JSON.stringify(s));
    window.localStorage.setItem("pika.apiBaseUrl", a);
}, { s: session, a: apiBaseUrl });
const page = await context.newPage();

// 1. CRM prospectos — ¿el prospecto LARS es visible? (convertido ⇒ puede estar oculto)
const mProspectos = await visit(page, "crm-prospectos", "01-crm-prospectos",
    [CHAIN.prospecto, CHAIN.empresa],
    { filterTestid: "input[type='search'], .dataTables_filter input, .dt-search input", filterValue: "LARS T16 1792907307431" });
if (mProspectos.expectedMissing.includes(CHAIN.prospecto)) {
    report.uxViolations.push("[Nielsen #1 visibilidad del estado] El prospecto LARS (convertido a cliente) NO aparece en /app/crm-prospectos: el usuario no ve de dónde salió el cliente.");
}

// 2. Ficha directa del prospecto
await visit(page, `crm-prospectos/${CHAIN.prospectoId}`, "02-crm-prospecto-ficha",
    [CHAIN.prospecto, CHAIN.empresa]);

// 3. Work Teams — el equipo con serie + identificador
const mTeams = await visit(page, "work-teams", "03-work-teams",
    [CHAIN.serie, CHAIN.equipo],
    { filterTestid: ".dt-search input, .dataTables_filter input", filterValue: CHAIN.serie });
if (mTeams.expectedFound[CHAIN.serie] && !mTeams.expectedFound[CHAIN.equipo]) {
    report.uxViolations.push(`[Norman mapeo/íntegro] Work Teams muestra la serie ${CHAIN.serie} pero NO el identificador ${CHAIN.equipo}: el código que logística usa no es visible en técnica.`);
}
// ¿existe un enlace natural de Work Teams al historial 360?
const historialLink = (mTeams.ctas || []).some((t) => /historial/i.test(t));
report.workTeamsHasHistoryLink = historialLink;
if (!historialLink) {
    report.uxViolations.push("[Nielsen #6 reconocimiento vs recuerdo] En Work Teams no hay CTA 'Historial': para ver la trazabilidad 360 hay que saber de memoria la ruta /app/work-equipment-history.");
}

// 4. Kanban técnico — tarjeta del proyecto con datos del equipo
const mBoard = await visit(page, "work-projects", "04-work-projects",
    [CHAIN.proyecto, CHAIN.serie]);
if (!mBoard.expectedFound[CHAIN.proyecto] && !mBoard.expectedFound[CHAIN.serie]) {
    report.uxViolations.push("[Nielsen #1] La tarjeta del caso LARS T16 no muestra ni shortCode ni serie en el tablero: no es identificable sin abrir la ficha.");
}

// 5. Historial 360 (contexto sembrado como hace t16 — la vía natural carece de CTA)
await page.evaluate((identifier) => {
    window.sessionStorage.setItem("work.equipment.history.context.v1",
        JSON.stringify({ reference: "", identifier, projectId: "", origin: "auditor-chain" }));
}, CHAIN.equipo);
const mHist = await visit(page, "work-equipment-history", "05-equipment-history",
    [CHAIN.equipo, CHAIN.serie, CHAIN.proyecto, CHAIN.repuesto, "Entregado"]);
if (mHist.expectedFound[CHAIN.repuesto] === false) {
    // puede aparecer en 'Repuestos solicitados a compras' pero no en 'usados' — se registra en el dict
    report.uxViolations.push("[Integridad] El repuesto IGBT no aparece en el historial 360 (tabla 'Repuestos usados' vacía — bug conocido t16).");
}

// 6. Cotizaciones — fila con OC, estado y (ausencia de) badge facturada
const mQuotes = await visit(page, "crm-cotizaciones", "06-crm-cotizaciones",
    [CHAIN.cotizacion, CHAIN.oc],
    { filterTestid: "input[type='search']", filterValue: CHAIN.cotizacion });
if (mQuotes.expectedFound[CHAIN.cotizacion]) {
    const facturada = await page.locator("tr", { hasText: CHAIN.cotizacion }).first().innerText().catch(() => "");
    report.quoteRowShowsInvoice = /FAC-2026-055/.test(facturada) || /facturad/i.test(facturada);
    if (!report.quoteRowShowsInvoice) {
        report.uxViolations.push("[Nielsen #1 + trazabilidad] La fila de la cotización facturada no muestra el n° de factura ni badge 'Facturada': el vínculo cotización→factura es invisible (bug t16).");
    }
}

// 7. Compras — línea de compra del repuesto
await visit(page, "inventory-orders", "07-inventory-orders",
    [CHAIN.repuesto, CHAIN.equipo],
    {});

// 8. Remisiones — remisión con cliente + indicador de factura
const mRem = await visit(page, "remissions", "08-remissions",
    [CHAIN.remision, CHAIN.empresa, CHAIN.factura],
    {});

// 9. Facturación — factura con cliente
await visit(page, "finance-facturacion", "09-finance-facturas",
    [CHAIN.factura, CHAIN.empresa],
    {});

// 10. Pagos — pago contra la factura
await visit(page, "finance-pagos", "10-finance-pagos",
    [CHAIN.empresa],
    { filterTestid: "input[name='searchTerm']", filterValue: "LARS Industrial T16 1792907307431" });

// 11. Ruta fantasma /app/projects-board (claim t10: 404)
await page.goto(`${baseUrl}/app/projects-board`, { waitUntil: "networkidle", timeout: 60000 }).catch(() => null);
await page.waitForTimeout(2500);
report.projectsBoardRoute = { url: page.url(), hasBoard: await page.locator(".kanban-board").count() };
await shot(page, "11-projects-board-route");

await browser.close();

const fs = await import("node:fs/promises");
await fs.mkdir(artifactsDir, { recursive: true });
await fs.writeFile(path.resolve(artifactsDir, "auditor-chain-report.json"), JSON.stringify(report, null, 2));
console.log("\n════ RESUMEN CADENA ════");
for (const [name, mod] of Object.entries(report.modules)) {
    const found = Object.values(mod.expectedFound || {}).filter(Boolean).length;
    const total = Object.keys(mod.expectedFound || {}).length;
    console.log(`${name}: ${found}/${total} datos visibles${mod.expectedMissing?.length ? ` — FALTAN: ${mod.expectedMissing.join(", ")}` : ""}${mod.error ? ` — ERROR: ${mod.error}` : ""}`);
}
console.log(`workTeams historial link: ${report.workTeamsHasHistoryLink}`);
console.log(`quoteRow muestra factura: ${report.quoteRowShowsInvoice}`);
console.log(`projects-board: ${JSON.stringify(report.projectsBoardRoute)}`);
console.log(`Violaciones UX: ${report.uxViolations.length}`);
report.uxViolations.forEach((v) => console.log(`  ⚠️ ${v}`));
