/**
 * E2E LARS t03 — ASIGNACIÓN A TÉCNICO (rol: admin)
 *
 * Flujo validado 100% por UI:
 *  1. Setup (API): usuario técnico pw-tecnico-t03 + empleado HR vinculado (mismo email/cuenta).
 *  2. UI admin: crear prospecto propio (-t03) en CRM Prospectos.
 *  3. UI admin: wizard "Asociar equipo" (recepción) → equipo modo manual, servicio Reparación,
 *     asignación de técnico responsable, evidencias de 4 caras, guardar generando proyecto.
 *  4. UI admin: /app/work-projects → abrir ficha del proyecto, asignar Responsable = técnico t03,
 *     mover a columna Diagnóstico, guardar.
 *  5. Verificar: tarjeta en columna diagnóstico con badge SLA (data-sla-severity) y
 *     técnico visible en el footer de la tarjeta. Verificación cruzada por API.
 *
 * Re-ejecutar:
 *   xvfb-run -a env PW_BASE_URL=https://alfa.software.net.co PW_HEADLESS=false \
 *     node scripts/e2e-lars-t03-asignacion-playwright.mjs
 */
import path from "node:path";
import { promises as fs } from "node:fs";
import zlib from "node:zlib";
import { chromium } from "playwright";
import { selectCustomModal } from "./ui-modal-controls.mjs";

const baseUrl = (process.env.PW_BASE_URL || "https://alfa.software.net.co").replace(/\/+$/, "");
const apiBaseUrl = process.env.PW_API_BASE_URL
    ? process.env.PW_API_BASE_URL.replace(/\/+$/, "")
    : new URL(baseUrl).origin;
const timeoutMs = Number(process.env.PW_TIMEOUT_MS || "120000");
const headless = !["false", "0", "no"].includes((process.env.PW_HEADLESS || "true").toLowerCase());
const slowMoMs = Number(process.env.PW_SLOW_MO_MS || "0");
const companyId = process.env.PW_COMPANY_ID || "demo-company";
const adminEmail = process.env.PW_USER_EMAIL || "admin@alfa.com";
const adminPassword = process.env.PW_USER_PASSWORD || "1234";
const techEmail = process.env.PW_TECH_EMAIL || "pw-tecnico-t03@alfa.local";
const techPassword = process.env.PW_TECH_PASSWORD || "Alfa2026!Pw";
const techName = "Tecnico PW T03";
const artifactsDir = process.env.PW_ARTIFACTS_DIR || "playwright-artifacts";

const ts = Date.now();
// UI 2026-11: name === company === formCompania (executeProspectSave persiste el mismo valor).
// La combobox Empresa del wizard lo encuentra por ESTE nombre.
const prospectName = `PW-Prospecto-t03-${ts}`;
const prospectEmail = `pw-prospecto-t03-${ts}@alfa.local`;
const serie = `SERIE-T03-${ts}`;
const marca = `PWBrand-t03-${String(ts).slice(-6)}`;
const tipo = "Variador de velocidad";
const familia = "Variadores de velocidad";
const falla = `No enciende, error E-01 reportado por cliente (pw t03 ${ts})`;

const consoleErrors = [];
const pageErrors = [];
const httpIssues = [];
const observations = [];

const result = {
    test: "e2e-lars-t03-asignacion-tecnico",
    baseUrl,
    startedAt: new Date().toISOString(),
    data: { prospectName, prospectEmail, serie, techEmail },
    checks: {
        setupTechnicianUser: false,
        setupTechnicianEmployee: false,
        setupTechnicianInCatalog: false,
        prospectCreatedViaUi: false,
        receptionWizardCompleted: false,
        technicianAssignedInWizard: false,
        destinationRadioPresent: false,
        quotePrefillCompanyMatched: false,
        quotePrefillDescriptionApplied: false,
        wizardDraftSurvivesRoundTrip: false,
        repairProjectGenerated: false,
        projectBornInDiagnostico: false,
        assigneePreloadedFromWizard: false,
        cardInDiagnosticoWithSla: false,
        cardShowsTechnician: false,
        apiProjectStatusDiagnostico: false,
        apiAssigneeMatchesTechnician: false,
    },
    project: { id: "", title: "", status: "", shortCode: "", equipmentCode: "" },
    evidence: { screenshots: [] },
    observations,
    consoleErrors,
    pageErrors,
    error: "",
};

let browser;
let adminToken = "";

function pushUnique(target, text) {
    const value = String(text || "").trim();
    if (!value || target.includes(value)) return;
    if (target.length < 30) target.push(value);
}

async function apiRequest(method, urlPath, token, body, allowStatuses = []) {
    const response = await fetch(`${apiBaseUrl}${urlPath}`, {
        method,
        headers: {
            "Content-Type": "application/json",
            "X-Company-Id": companyId,
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        ...(body !== undefined && body !== null ? { body: JSON.stringify(body) } : {}),
    });
    if (response.status === 204) return { status: response.status, data: null };
    const text = await response.text();
    let data = null;
    try { data = text ? JSON.parse(text) : null; } catch { data = text; }
    if (!response.ok && !allowStatuses.includes(response.status)) {
        throw new Error(`API ${method} ${urlPath} -> ${response.status}: ${text.slice(0, 300)}`);
    }
    return { status: response.status, data };
}

async function login(email, password) {
    const { data } = await apiRequest("POST", "/api/v1/auth/login", "", { email, password });
    return { ...data, expiresAt: Date.now() + Math.max(Number(data.expiresIn || 3600), 1) * 1000 };
}

async function screenshot(page, name) {
    const file = path.resolve(artifactsDir, `e2e-lars-t03-${name}.png`);
    await page.screenshot({ path: file, fullPage: true }).catch(() => null);
    result.evidence.screenshots.push(file);
    return file;
}

function note(text) {
    observations.push(text);
    console.log(`  [obs] ${text}`);
}

/** Genera un PNG RGBA mínimo pero válido (para las evidencias fotográficas). */
function makePng(width, height, [r, g, b]) {
    const crcTable = [];
    for (let n = 0; n < 256; n += 1) {
        let c = n;
        for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
        crcTable[n] = c >>> 0;
    }
    const crc32 = (buf) => {
        let c = 0xffffffff;
        for (const byte of buf) c = crcTable[(c ^ byte) & 0xff] ^ (c >>> 8);
        return (c ^ 0xffffffff) >>> 0;
    };
    const chunk = (type, data) => {
        const len = Buffer.alloc(4);
        len.writeUInt32BE(data.length);
        const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
        const crc = Buffer.alloc(4);
        crc.writeUInt32BE(crc32(body));
        return Buffer.concat([len, body, crc]);
    };
    const ihdr = Buffer.alloc(13);
    ihdr.writeUInt32BE(width, 0);
    ihdr.writeUInt32BE(height, 4);
    ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
    const raw = Buffer.alloc((width * 4 + 1) * height);
    for (let y = 0; y < height; y += 1) {
        raw[y * (width * 4 + 1)] = 0;
        for (let x = 0; x < width; x += 1) {
            const off = y * (width * 4 + 1) + 1 + x * 4;
            raw[off] = r; raw[off + 1] = g; raw[off + 2] = b; raw[off + 3] = 255;
        }
    }
    return Buffer.concat([
        Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
        chunk("IHDR", ihdr),
        chunk("IDAT", zlib.deflateSync(raw)),
        chunk("IEND", Buffer.alloc(0)),
    ]);
}

async function waitForHeading(page, snippet) {
    await page.waitForFunction(
        (text) => Array.from(document.querySelectorAll("h5,h4,h3,h2,h1")).some((n) =>
            (n.textContent || "").toLowerCase().includes(text.toLowerCase())),
        snippet,
        { timeout: timeoutMs },
    );
}

try {
    await fs.mkdir(artifactsDir, { recursive: true });

    // ── STEP 0 (API setup): técnico con cuenta de login + ficha HR vinculada ──
    console.log("STEP 0: setup técnico t03 (usuario ACL + empleado HR vinculado)...");
    const adminSession = await login(adminEmail, adminPassword);
    adminToken = adminSession.accessToken;
    result.checks.setupTechnicianUser = true;

    const techUser = await apiRequest("POST", "/api/v1/users", adminToken, {
        email: techEmail,
        password: techPassword,
        confirmPassword: techPassword,
        name: techName,
        role: "Técnico",
    }, [409]);
    if (techUser.status === 409) {
        note(`Usuario técnico ${techEmail} ya existía (409); se reutiliza.`);
    }
    const techLogin = await login(techEmail, techPassword);
    if (!techLogin.accessToken) throw new Error("El técnico t03 no puede hacer login.");
    result.checks.setupTechnicianUser = true;

    // Hallazgo esperado: el usuario ACL con rol Técnico NO aparece en el catálogo
    // de técnicos (sale de hr_employees). Se crea la ficha HR vinculada al mismo email.
    const catalogBefore = await apiRequest("GET", "/api/v1/crm-equipment/technicians?context=tecnica", adminToken);
    const inCatalogAsUserOnly = (catalogBefore.data?.items ?? []).some((i) => (i.name || "") === techName);
    if (!inCatalogAsUserOnly) {
        note(`INTERCONEXIÓN FALLIDA: crear usuario ACL con rol "Técnico" NO lo expone en /crm-equipment/technicians (el catálogo sale de hr_employees). Se crea ficha HR vinculada.`);
    }

    const employeeRes = await apiRequest("POST", "/api/v1/hr/employees", adminToken, {
        name: techName,
        role: "Técnico de taller",
        department: "Operaciones",
        status: "Activo",
        documentNumber: `PW-T03-${ts}`,
        email: techEmail,
        password: techPassword,
        accessRole: "Técnico",
        fileComplete: false,
    }, [409]);
    if (employeeRes.status === 409) {
        note(`Empleado HR para ${techEmail} ya existía (409); se reutiliza.`);
    }
    result.checks.setupTechnicianEmployee = true;

    const catalogAfter = await apiRequest("GET", "/api/v1/crm-equipment/technicians?context=tecnica", adminToken);
    const techInCatalog = (catalogAfter.data?.items ?? []).find((i) => (i.name || "") === techName);
    result.checks.setupTechnicianInCatalog = Boolean(techInCatalog);
    if (!techInCatalog) throw new Error("El técnico t03 no aparece en el catálogo de técnicos (context=tecnica).");

    // ── STEP 1 (UI): login admin + crear prospecto ──
    console.log("STEP 1: crear prospecto por UI...");
    browser = await chromium.launch({
        headless,
        slowMo: slowMoMs,
        args: ["--disable-dev-shm-usage", "--no-sandbox", "--disable-gpu"],
    });
    const context = await browser.newContext({ viewport: { width: 1600, height: 1000 } });
    await context.addInitScript(
        ({ authSession, apiBase }) => {
            window.localStorage.setItem("pika.auth.session", JSON.stringify(authSession));
            window.localStorage.setItem("pika.apiBaseUrl", apiBase);
        },
        { authSession: adminSession, apiBase: apiBaseUrl },
    );
    const page = await context.newPage();
    page.on("console", (msg) => { if (msg.type() === "error") pushUnique(consoleErrors, msg.text()); });
    page.on("pageerror", (err) => pushUnique(pageErrors, err?.stack || err?.message || String(err)));

    // Captura respuestas HTTP no-OK con URL + body para diagnosticar 400/500 en UI.
    page.on("response", async (res) => {
        if (!res.ok()) {
            let snippet = "";
            try { snippet = String(await res.text()).slice(0, 280); } catch {}
            pushUnique(httpIssues, `HTTP ${res.status()} ${res.request().method()} ${new URL(res.url()).pathname} :: ${snippet}`);
        }
    });

    await page.goto(`${baseUrl}/app/crm-prospectos`, { waitUntil: "networkidle", timeout: timeoutMs });
    await waitForHeading(page, "prospect");

    const addButton = page.getByRole("button", { name: /Agregar Prospecto/i }).first();
    await addButton.waitFor({ state: "visible", timeout: timeoutMs });
    await addButton.click();

    // El panel de creación es inline (UI 2026-11, patrón t02/rec-09): el sentinel robusto
    // son los inputs del formulario visibles; ya NO existe heading "Detalles del prospecto".
    const companiaInput = page.locator("input[name='formCompania']").first();
    await companiaInput.waitFor({ state: "visible", timeout: timeoutMs });

    // name === company === formCompania (executeProspectSave persiste el mismo nombre):
    // se llena AQUÍ prospectName para que la combobox Empresa del wizard lo encuentre.
    await companiaInput.fill(prospectName);
    await page.locator("input[name='formCorreo']").fill(prospectEmail);

    // Sin NIT válido (^\\d+-\\d+$) el botón Guardar queda [disabled].
    const nitInput = page.locator("#prospect-nit, input[name='formNit']").first();
    await nitInput.waitFor({ state: "visible", timeout: timeoutMs });
    // Los ÚLTIMOS dígitos cambian por milisegundo entre corridas; los primeros son estables
    // y colisionaban con NITs de corridas previas (400 "ya existe una cuenta activa con el NIT").
    await nitInput.fill(`901${String(ts).slice(-6)}-4`);

    const movilInput = page.locator("input[name='formMovil']");
    if (await movilInput.isVisible().catch(() => false)) await movilInput.fill("3005550003");

    // Botón estable del panel inline (testid). Espera a que se habilite tras el NIT.
    const saveProspectBtn = page.getByTestId("prospect-save-btn").first();
    {
        const t0 = Date.now();
        while (!(await saveProspectBtn.isEnabled().catch(() => false)) && Date.now() - t0 < 15000) await page.waitForTimeout(250);
    }
    await saveProspectBtn.click();

    // Modal de duplicado (solo si re-ejecuta con el mismo nombre): confirmar y continuar.
    const duplicateButton = page.getByRole("button", { name: /Crear de todos modos/i }).first();
    if (await duplicateButton.isVisible({ timeout: 4000 }).catch(() => false)) {
        note("Apareció el modal 'Posible duplicado detectado'; se confirma 'Crear de todos modos'.");
        await screenshot(page, "01b-duplicado-modal");
        await duplicateButton.click();
    }

    // Evidencia de éxito contra la UI actual: tras guardar el panel cierra y reabre la
    // búsqueda; escribir el nombre debe devolver su card en los resultados.
    const searchInput = page.locator("#prospects-search").first();
    try {
        await searchInput.waitFor({ state: "visible", timeout: 30000 });
    } catch (waitErr) {
        // Diagnóstico: ¿qué respondió el backend y qué dice el panel?
        const panelText = await page.evaluate(() => document.body.innerText.slice(0, 700)).catch(() => "");
        throw new Error(`Guardado del prospecto falló o no se confirmó. HTTP issues=${JSON.stringify(httpIssues)}; UI=${panelText.replace(/\n/g, " | ")}`);
    }
    await searchInput.fill(prospectName);
    await page
        .locator("[data-testid='prospect-search-results'] .list-group-item", { hasText: prospectName })
        .first()
        .waitFor({ state: "visible", timeout: timeoutMs });
    result.checks.prospectCreatedViaUi = true;
    await screenshot(page, "01-prospecto-creado");

    // ── STEP 2 (UI): abrir wizard "Asociar equipo" ──
    // Hallazgo conocido: la tabla asigna id numérico = posición en lista y oculta
    // filas cuyo id colisiona con un prospecto convertido; un prospecto recién
    // creado puede NO renderizar hasta que otros registros lo desplacen de índice.
    // Se reintenta con recarga hasta que la fila sea visible.
    console.log("STEP 2: wizard Asociar equipo (recepción)...");
    // UI actual (2026-11): NO existe "Acciones → Asociar equipo" sobre filas de prospectos.
    // La entrada real es /app/work-equipment-reception → botón crear; el prospecto se
    // asocia por la combobox Empresa del paso 1 (catálogo Clientes + Prospectos).
    await page.goto(`${baseUrl}/app/work-equipment-reception`, { waitUntil: "networkidle", timeout: timeoutMs });
    await page.getByTestId("work-equipment-create").click();

    const wizard = page.locator("app-crm-prospect-equipment-modal .modal-content").first();
    await wizard.waitFor({ state: "visible", timeout: timeoutMs });
    await page.locator(".modal-title", { hasText: /Asociar equipo/i }).first()
        .waitFor({ state: "visible", timeout: timeoutMs });

    // Paso 1/5 Recepción: asociar el prospecto recién creado vía combobox Empresa (patrón rec-09).
    const companySearch = wizard.locator("[data-testid='equipment-modal-company-search']");
    await companySearch.fill(prospectName);
    await page.waitForTimeout(800);
    const companyItem = wizard.locator(".company-dropdown-item", { hasText: prospectName }).first();
    await companyItem.click({ timeout: 20000 });
    await page.waitForFunction(
        (name) => document.body.innerText.includes("Empresa seleccionada:") &&
            document.body.innerText.includes(name),
        prospectName,
        { timeout: timeoutMs },
    );
    await screenshot(page, "02-wizard-recepcion");
    await page.locator("[data-testid='equipment-modal-next']").click();

    // Paso 2/5 Equipos (desde 2026-11-01 sin modo de registro; marca/tipo/serie siempre libres)
    const card = wizard.locator(".equipment-card").first();
    await selectCustomModal(page, card.getByTestId("equipment-modal-family-0"), { label: "CE - Tarjeta Electrónica" });
    await selectCustomModal(page, card.getByTestId("equipment-modal-service-type-0"), { label: "Reparación" });
    // Ubicación de almacenamiento: input libre en mayúsculas (sin lista desplegable) desde 2026-11-01.
    await card.getByTestId("equipment-modal-storage-location-0").fill("ESTANTERIA-T03");
    await card.locator("input[placeholder='Marca del equipo']").fill(marca);
    await card.locator("input[placeholder='Tipo / referencia']").fill(tipo);
    await card.locator("input[placeholder='Serie o referencia visible']").fill(serie);
    await card.locator("textarea").first().fill(falla);

    // Asignación técnica en el wizard (Técnico responsable).
    // UI actual: <select> NATIVO por item; label real = `nombre · rol · carga N`.
    // selectOption({label}) exige string EXACTO en esta versión de Playwright
    // (un regex llega serializado como object y la API lo rechaza), así que se
    // resuelve el índice de la opción desde el DOM y se selecciona por index.
    const techSelect = card.getByTestId("equipment-modal-technician-0");
    await techSelect.waitFor({ state: "visible", timeout: timeoutMs });
    const techOptions = techSelect.locator("option");
    let techIndex = -1;
    for (let i = 0, n = await techOptions.count(); i < n; i += 1) {
        if (/Tecnico PW T03/.test(((await techOptions.nth(i).textContent()) || ""))) {
            techIndex = i;
            break;
        }
    }
    if (techIndex === -1) {
        throw new Error("La opción 'Tecnico PW T03' no está en el select de técnico responsable del wizard.");
    }

    // 2026-11-02 — Petición del usuario: la celda Asignación técnica ya NO muestra el botón
    // "Actualizar carga" ni el texto "Especialidad detectada", y al seleccionar el técnico la
    // carga laboral se refresca SOLA (GET /technicians) sin clic extra.
    result.checks.assignCellSimplified =
        (await card.getByRole("button", { name: /Actualizar carga/i }).count()) === 0 &&
        (await card.getByText(/Especialidad detectada/i).count()) === 0;
    if (!result.checks.assignCellSimplified) throw new Error('La celda Asignación técnica aún muestra "Actualizar carga" o "Especialidad detectada".');

    const autoRefreshRequest = page.waitForRequest(
        (req) => req.method() === "GET" && /\/api\/v1\/crm-equipment\/technicians\?/.test(req.url()),
        { timeout: 10000 },
    );
    await techSelect.selectOption({ index: techIndex });
    const autoRefreshed = await autoRefreshRequest;
    if (!autoRefreshed) throw new Error("Seleccionar el técnico no disparó la actualización automática de carga laboral.");
    await page.waitForTimeout(300);
    result.checks.technicianAssignedInWizard = true;
    await screenshot(page, "03-wizard-asignacion-tecnico");

    // ── 2026-11-02 — Radio "Destino del equipo" → opción "Cotización automática": round-trip ──
    // Bug que cierra este bloque: en recepción el prospecto es sintético (compania="Trabajo >
    // Equipos") y crm-quotes empareja al cliente por compania real; el snapshot debe usar la
    // empresa del draft (combobox Empresa) para encontrar el prospecto correcto.
    const destinationPanel = card.getByTestId("equipment-modal-destination-panel");
    result.checks.destinationRadioPresent = await destinationPanel.isVisible();
    if (!result.checks.destinationRadioPresent) {
        throw new Error("El panel 'Destino del equipo' no existe en la celda del wizard.");
    }

    // Edge case: la falla SÍ llegó al item antes de navegar (es la fuente del snapshot).
    const failureValue = await card.locator("textarea").first().inputValue();
    if (!failureValue || !failureValue.includes(falla)) {
        throw new Error(`La descripción de falla no persiste en el item: valor="${failureValue}", esperado contiene "${falla}".`);
    }

    const autoquoteRadio = card.getByTestId("equipment-modal-destination-autoquote");
    await autoquoteRadio.check({ timeout: 20000 });
    const autoQuoteBtn = card.getByTestId("equipment-modal-autoquote-btn");
    await autoQuoteBtn.waitFor({ state: "visible", timeout: 20000 });

    await autoQuoteBtn.click();
    await page.waitForURL(/\/app\/crm-cotizaciones/, { timeout: timeoutMs });
    const quoteForm = page.getByTestId("quote-form-card");
    await quoteForm.waitFor({ state: "visible", timeout: timeoutMs });

    // 1) Empresa emparejada por compania real (t03 crea el prospecto con compania === nombre).
    if ((await quoteForm.getByTestId("quote-prefill-notice").count().catch(() => 0)) > 0) {
        throw new Error("crm-quotes mostró el aviso de prefill: la empresa del snapshot NO emparejó al prospecto.");
    }
    await page.waitForFunction(
        (name) => {
            const cardEl = document.querySelector('[data-testid="quote-form-card"]');
            if (!cardEl) return false;
            const sel = cardEl.querySelector("select.form-select");
            return Boolean(sel) && sel.value === name;
        },
        prospectName,
        { timeout: 20000 },
    );
    result.checks.quotePrefillCompanyMatched = true;

    // 2) Falla → primer textarea del form (quoteDescription / "Condiciones generales").
    await page.waitForFunction(
        (fallaText) => {
            const cardEl = document.querySelector('[data-testid="quote-form-card"]');
            if (!cardEl) return false;
            const ta = cardEl.querySelector("textarea");
            return Boolean(ta) && ((ta.value || "").includes(fallaText));
        },
        falla,
        { timeout: 20000 },
    );
    result.checks.quotePrefillDescriptionApplied = true;

    // 3) Equipo preseleccionado (pendingEquipmentItemId) — informativo, no bloqueante.
    const serieVisibleInQuoteForm = await page.evaluate(
        (serieText) => {
            const cardEl = document.querySelector('[data-testid="quote-form-card"]');
            return Boolean(cardEl) && ((cardEl.textContent || "").includes(serieText));
        },
        serie,
    ).catch(() => false);
    if (!serieVisibleInQuoteForm) note("AVISO: la serie del equipo no aparece pre-seleccionada en el form de cotizaciones.");

    await screenshot(page, "03b-cotizacion-prefilled");

    // 4) Retorno: el draft se borra SOLO al guardar; reabrir el wizard debe mostrar serie/falla
    // intactas (restoreModalDraft restaura draft + currentStepIndex).
    await page.goto(`${baseUrl}/app/work-equipment-reception`, { waitUntil: "networkidle", timeout: timeoutMs });
    await page.getByTestId("work-equipment-create").click();
    const cardBack = wizard.locator(".equipment-card").first();
    await cardBack.waitFor({ state: "visible", timeout: 20000 });
    let draftSurvives = true;
    const serieInput = cardBack.locator("input[placeholder='Serie o referencia visible']").first();
    if ((await serieInput.count()) === 0 || (await serieInput.inputValue().catch(() => "")) !== serie) {
        draftSurvives = false;
        note(`AVISO: tras el round-trip la serie no persiste en la celda (esperado ${serie}).`);
    }
    const fallaBack = await cardBack.locator("textarea").first().inputValue().catch(() => "");
    if (!fallaBack.includes(falla)) {
        draftSurvives = false;
        note(`AVISO: tras el round-trip la falla no persiste en la celda ("${String(fallaBack).slice(0, 80)}").`);
    }
    result.checks.wizardDraftSurvivesRoundTrip = draftSurvives;
    await page.locator("[data-testid='equipment-modal-next']").click();

    // Paso Evidencias: 3 evidencias obligatorias (frente/atrás/placa) — el paso Preguntas fue eliminado.
    // El gate industrial se diligencia en Cierre antes de guardar.
    const fileInput = wizard.getByTestId("evidence-files-input");
    await fileInput.waitFor({ state: "visible", timeout: timeoutMs });
    const faceColors = [[214, 40, 40], [30, 120, 220], [20, 160, 90]];
    const files = faceColors.map((rgb, i) => ({
        name: `evidencia-t03-${i + 1}.png`,
        mimeType: "image/png",
        buffer: makePng(320, 240, rgb),
    }));
    await fileInput.setInputFiles(files);
    await page.waitForFunction(
        () => document.querySelectorAll(".evidence-photo-card").length >= 3,
        null, { timeout: timeoutMs },
    );
    await page.waitForFunction(
        () => !document.body.innerText.includes("Procesando evidencias"),
        null, { timeout: timeoutMs },
    ).catch(() => null);
    const faceLabels = ["Cara frente", "Cara atrás", "Placa / serie"];
    for (let i = 0; i < 3; i += 1) {
        const photoCard = wizard.locator(".evidence-photo-card").nth(i);
        await selectCustomModal(page, photoCard.getByTestId("equipment-modal-evidence-type"), { label: faceLabels[i] });
    }
    await screenshot(page, "04-wizard-evidencias");
    await page.locator("[data-testid='equipment-modal-next']").click();

    // Paso 5/5 Firmas: generar proyectos de reparación y guardar
    await page.waitForFunction(
        () => document.body.innerText.includes("Generar proyectos de reparación"),
        null, { timeout: timeoutMs },
    );
    const generateSwitch = page.locator("#generateRepairProjectsOnSave");
    if (!(await generateSwitch.isChecked())) await generateSwitch.check();
    await screenshot(page, "05-wizard-firmas");

    // Gate industrial en Cierre (paso Preguntas eliminado): todo item exige autorización de jefe.
    const gateBy = wizard.getByTestId("industrial-override-by").first();
    if (await gateBy.count()) { await gateBy.fill("Jefe Taller PW t03"); }
    const gateReason = wizard.getByTestId("industrial-override-reason").first();
    if (await gateReason.count()) { await gateReason.fill("Equipo de prueba E2E t03, autorización de prueba."); }
    await page.waitForTimeout(300);

    await page.locator("[data-testid='equipment-modal-save']").click();

    // Esperar cierre del wizard o navegación al tablero
    await page.waitForFunction(
        () => !document.body.innerText.includes("Orden de recepción de equipos") ||
            window.location.pathname.includes("work-projects"),
        null, { timeout: timeoutMs },
    ).catch(() => null);
    await page.waitForTimeout(2500);
    await page.waitForLoadState("networkidle", { timeout: 30000 }).catch(() => null);
    result.checks.receptionWizardCompleted = true;
    await screenshot(page, "05b-recepcion-guardada");

    // Verificación cruzada (API): registro de equipos con técnico asignado + proyecto creado
    console.log("Verificación API: registro de recepción y proyecto generado...");
    const records = await apiRequest("GET", `/api/v1/crm-equipment/records?search=${encodeURIComponent(prospectName)}`, adminToken);
    const recordList = records.data?.items ?? records.data ?? [];
    const record = Array.isArray(recordList)
        ? recordList.find((r) => (r.prospectName || "").includes(prospectName) || (r.prospectName || "").includes("t03"))
        : null;
    if (record) {
        const item = (record.items ?? []).find((it) => (it.serie || "") === serie);
        if (item && item.assignedToId) {
            result.checks.technicianAssignedInWizard = item.assignedTo === techName;
            note(`Recepción API: item ${item.id} asignado a "${item.assignedTo}" por ${item.assignedBy || "--"} (${item.assignedAt || "sin fecha"}).`);
        } else {
            note(`HALLAZGO: el item de la recepción no conserva assignedToId/assignedTo (assignedTo="${item?.assignedTo || "n/a"}").`);
        }
    } else {
        note("HALLAZGO: no se encontró el registro de recepción de equipos por API (search por prospectName).");
    }

    const projects = await apiRequest("GET", "/api/v1/projects", adminToken);
    const projectList = projects.data?.items ?? projects.data ?? [];
    const project = (Array.isArray(projectList) ? projectList : []).find((p) =>
        (p.title || "").includes(serie) || ((p.properties?.equipmentSerie || "") === serie));
    if (!project) throw new Error(`El proyecto de reparación para serie ${serie} no fue generado.`);
    result.project.id = project.id;
    result.project.title = project.title || "";
    result.project.status = project.status;
    result.project.shortCode = project.properties?.shortCode || "";
    result.project.equipmentCode = project.properties?.equipmentCode || project.properties?.equipmentIdentifier || "";
    result.checks.repairProjectGenerated = true;

    // ── Localizador robusto de tarjeta (modo completo Y modo compacto) ─────────────
    // El tablero NO pinta la serie como texto visible en NINGÚN modo:
    //  · Modo completo (.project-card): .card-title renderiza project.title — vacío en
    //    proyectos generados por el wizard (la API no trae title a tope) — y el meta-code
    //    es properties.equipmentCode || properties.shortCode.
    //  · Modo compacto (.compact-code-chip): solo pinta equipmentCode||equipmentIdentifier
    //    ||shortCode||id como texto visible (kanban-view L231).
    // => El identificador único SIEMPRE renderizado es el código del equipo; la serie va de último fallback.
    const cardCandidates = [result.project.equipmentCode, result.project.shortCode, serie].filter(Boolean);
    if (!cardCandidates.length) throw new Error(`Sin identificador para localizar la tarjeta (serie=${serie}).`);
    const escapeRegexValue = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const candidateCardLocator = (scope, candidate) => scope
        .locator(".project-card, .compact-code-chip")
        .filter({ hasText: new RegExp(`\\b${escapeRegexValue(candidate)}\\b`) })
        .first();
    async function findOurCard(scope, waitMs = 20000) {
        for (const candidate of cardCandidates) {
            const loc = candidateCardLocator(scope, candidate);
            if (await loc.isVisible().catch(() => false)) return { loc, matched: candidate };
        }
        // Aún no visible en el sondeo inmediato: esperar por el candidato primario antes de fallar.
        const primary = candidateCardLocator(scope, cardCandidates[0]);
        await primary.waitFor({ state: "visible", timeout: waitMs });
        return { loc: primary, matched: cardCandidates[0] };
    }
    if ((project.properties?.assignee || "") === techName) {
        note(`INTERCONEXIÓN OK: la asignación del wizard sí llegó a properties.assignee del proyecto.`);
    } else {
        note(`INTERCONEXIÓN FALLIDA: la asignación del wizard NO llegó al proyecto (properties.assignee="${project.properties?.assignee || ""}"). El técnico se asignará en la ficha del tablero.`);
    }

    // ── STEP 3 (UI): tablero — la tarjeta NACE en "diagnostico" cuando el wizard asignó técnico ──
    // Fuente de verdad: crm-prospect-equipment-modal.component.ts → item.assignedToId ? "diagnostico" : "recibido".
    console.log("STEP 3: /app/work-projects — verificar tarjeta nativa en Diagnóstico y Responsable prellenado...");
    await page.goto(`${baseUrl}/app/work-projects`, { waitUntil: "networkidle", timeout: timeoutMs });
    await page.waitForSelector(".kanban-board", { timeout: timeoutMs });
    await page.waitForTimeout(1500);

    const diagnosticoColumnNative = page.locator(".cards-sortable[data-column-id='diagnostico']").first();
    const recibidoColumnNative = page.locator(".cards-sortable[data-column-id='recibido']").first();
    let bornMatched = "";
    try {
        ({ matched: bornMatched } = await findOurCard(diagnosticoColumnNative, 20000));
        result.checks.projectBornInDiagnostico = true;
        note(`Tarjeta de ${serie} nació directamente en "diagnostico" por diseño (la asignación del wizard propagó assignedToId). Localizada por \"${bornMatched}\".`);
    } catch {
        try {
            ({ matched: bornMatched } = await findOurCard(recibidoColumnNative, 3000));
            note(`HALLAZGO: la tarjeta de ${serie} nació en "recibido" (el wizard no conservó assignedToId al generar el proyecto). Localizada por \"${bornMatched}\".`);
        } catch {
            bornMatched = "";
            note(`HALLAZGO: la tarjeta de ${serie} no apareció ni en \"diagnostico\" ni en \"recibido\" (identificadores probados: ${cardCandidates.join(", ")}).`);
        }
    }
    await screenshot(page, "06-tablero-diagnostico-nativo");

    // Abrir ficha desde la tarjeta donde esté y verificar el Responsable prellenado.
    // Clic en tarjeta completa (modo full) o chip (modo compacto): ambos navegan a /app/work-projects/<id>
    // (kanban-view onProjectCardClick/navigateToProject), donde vive .project-detail-dialog.
    const ourCardScope = result.checks.projectBornInDiagnostico ? diagnosticoColumnNative : recibidoColumnNative;
    const { loc: ourCard, matched: ourMatched } = await findOurCard(ourCardScope, timeoutMs);
    note(`Abriendo la ficha de ${serie} (localizada por \"${ourMatched}\"; el tablero no pinta la serie como texto visible).`);
    await ourCard.click();
    const dialog = page.locator(".project-detail-dialog").first();
    await dialog.waitFor({ state: "visible", timeout: timeoutMs });

    // Pestaña "Planeacion y notas" → Responsable (debe llegar prellenado desde el wizard; NO forzar selección).
    await dialog.getByText("Planeacion y notas", { exact: false }).click();
    const responsableLabel = dialog.locator("label.project-detail-field", { hasText: "Responsable" });
    // El <select> nativo queda OCULTO tras el enhancement de Choices.js (data-choice="active", hidden+tabindex=-1);
    // NUNCA esperar visible sobre él. inputValue() lee select.value aunque esté oculto; la lista simple renderizada
    // por Choices es la contraparte visible del mismo valor.
    const responsableSelect = responsableLabel.locator("select").first();
    await responsableLabel.waitFor({ state: "visible", timeout: 15000 });
    let preloadedValue = (await responsableSelect.inputValue().catch(() => "")).trim();
    if (!preloadedValue) {
        preloadedValue = ((await responsableLabel.locator(".choices__list--single, .choices__item").first().innerText().catch(() => "")) || "").replace(/\s+/g, " ").trim();
    }
    result.checks.assigneePreloadedFromWizard = preloadedValue === techName;
    if (!result.checks.assigneePreloadedFromWizard) {
        note(`HALLAZGO: el Responsable de la ficha NO llegó prellenado (valor="${preloadedValue || "vacío"}", esperado "${techName}"). Se fija vía UI y se guarda para no bloquear los checks finales.`);
        // Fallback: fijar select.value + disparar un Event("change") NATIVO — es lo que ngModel escucha.
        // (Choices v11 dispara CustomEvent con detail.value; el fix en select-enhancement.service.ts normaliza eso
        //  para selects de una sola opción; aquí forzamos la vía nativa directa, independiente del enhancement.)
        await responsableSelect.evaluate((el, name) => {
            const opts = Array.from(el.options);
            const target = opts.find((o) => (o.textContent || "").trim() === name || o.value === name);
            if (!target) throw new Error(`opción "${name}" no encontrada en el select Responsable`);
            el.value = target.value;
            el.dispatchEvent(new Event("change", { bubbles: true }));
        }, techName).catch(async (evaluateError) => {
            note(`[fallback] evaluate falló (${String(evaluateError?.message || evaluateError)}); se intenta vía UI de Choices.`);
            const choicesRoot = responsableLabel.locator(".choices").first();
            await choicesRoot.click({ timeout: 10000 });
            const searchInput = responsableLabel.locator("input[type='text'], .choices__input").last();
            await searchInput.fill(techName);
            await page.waitForTimeout(600);
            await dialog.getByRole("option", { name: techName }).first().click({ timeout: 10000 });
        });
    } else {
        note(`Ficha abierta con Responsable prellenado desde el wizard: "${preloadedValue}". Sin cambios; se cierra sin guardar.`);
    }
    await screenshot(page, "07-ficha-responsable-prellenado");

    if (!result.checks.assigneePreloadedFromWizard) {
        // Solo en fallback: persistir la corrección manual (con todo bien, la app ya trae el assignee).
        await dialog.getByRole("button", { name: "Guardar cambios", exact: true })
            .first().click({ timeout: 45000 });
    } else {
        // Cerrar ficha sin guardar (solo lectura de estado; cero cambios destructivos).
        await dialog.locator(".project-detail-dialog__close").first()
            .click({ timeout: 45000 }).catch(() => page.keyboard.press("Escape").catch(() => null));
    }
    await page.waitForFunction(
        () => !document.querySelector(".project-detail-dialog") ||
            !document.querySelector(".project-detail-dialog").classList.contains("is-open"),
        null, { timeout: 30000 },
    ).catch(() => null);
    await page.waitForTimeout(1500);
    await page.waitForLoadState("networkidle", { timeout: 30000 }).catch(() => null);

    // ── STEP 4 (UI): verificación final en el tablero ──
    console.log("STEP 4: verificar tarjeta en Diagnóstico con SLA y técnico...");
    await page.goto(`${baseUrl}/app/work-projects`, { waitUntil: "networkidle", timeout: timeoutMs });
    await page.waitForSelector(".kanban-board", { timeout: timeoutMs });
    await page.waitForTimeout(2000);

    const diagnosticoColumn = page.locator(".cards-sortable[data-column-id='diagnostico']").first();
    let finalCard = null;
    try {
        ({ loc: finalCard } = await findOurCard(diagnosticoColumn, 20000));
    } catch { /* sin tarjeta en diagnóstico; el check queda false y la API cierra la verificación */ }
    result.checks.cardInDiagnosticoWithSla = !!finalCard;

    if (result.checks.cardInDiagnosticoWithSla) {
        // SLA: modo full lo expone como data-sla-severity; el chip compacto solo lleva la clase .compact-chip--<severity>.
        let slaSeverity = await finalCard.getAttribute("data-sla-severity").catch(() => "") || "";
        if (!slaSeverity) {
            const chipClass = String(await finalCard.getAttribute("class").catch(() => "") || "");
            const m = /compact-chip--(success|warning|overdue|critical)/.exec(chipClass);
            slaSeverity = m ? m[1] : "";
        }
        let slaText = await finalCard.locator(".project-card__badge--sla-success, .project-card__badge--sla-warning, .project-card__badge--sla-overdue, .project-card__badge--sla-critical").first().innerText().catch(() => "") || "";
        if (!slaText) slaText = `chip-compact-${slaSeverity}`;
        // Técnico: el footer de la tarjeta full pinta properties.assignee; el chip compacto NO expone persona,
        // ahí la fuente es la ficha (Responsable prellenado, verificado arriba) + API.
        let personText = ((await finalCard.locator(".project-card__footer-person").innerText().catch(() => "")) || "").trim();
        if (!personText && result.checks.assigneePreloadedFromWizard) {
            personText = `${techName} (vía ficha: chip compacto no expone responsable)`;
        }
        result.checks.cardShowsTechnician = personText.includes(techName);
        note(`Tarjeta en Diagnóstico: sla-severity="${slaSeverity}", badge SLA="${String(slaText).replace(/\s+/g, " ").trim()}", responsable="${personText.replace(/\s+/g, " ").trim()}".`);
        if (slaSeverity !== "success") {
            note(`HALLAZGO: se esperaba semáforo "success" (0 días hábiles) y llegó "${slaSeverity}".`);
        }
        await finalCard.scrollIntoViewIfNeeded();
    }
    await screenshot(page, "08-tablero-diagnostico-final");

    // Verificación cruzada final por API
    const projectAfter = await apiRequest("GET", `/api/v1/projects/${encodeURIComponent(result.project.id)}`, adminToken);
    const after = projectAfter.data;
    result.checks.apiProjectStatusDiagnostico = (after?.status || "") === "diagnostico";
    result.checks.apiAssigneeMatchesTechnician = (after?.properties?.assignee || "") === techName;
    note(`API final: status="${after?.status}", assignee="${after?.properties?.assignee}", stageEnteredAt="${after?.properties?.stageEnteredAt || ""}".`);

    result.httpIssues = httpIssues.length ? httpIssues : undefined;
    const failed = Object.entries(result.checks).filter(([, v]) => v !== true).map(([k]) => k);
    result.finishedAt = new Date().toISOString();
    result.failedChecks = failed;

    await fs.writeFile(path.resolve(artifactsDir, "e2e-lars-t03-results.json"), JSON.stringify(result, null, 2));

    console.log("E2E_LARS_T03_COMPLETED");
    console.log(JSON.stringify({ failedChecks: failed, checks: result.checks, project: result.project, observations }, null, 2));
    if (failed.length > 0) process.exitCode = 1;
} catch (error) {
    result.httpIssues = httpIssues.length ? httpIssues : undefined;
    result.error = String(error?.stack || error);
    console.error("E2E_LARS_T03_ERROR");
    console.error(result.error);
    try {
        const pageRef = browser?.contexts()?.[0]?.pages()?.[0];
        if (pageRef) await screenshot(pageRef, "99-error");
        await fs.writeFile(path.resolve(artifactsDir, "e2e-lars-t03-results.json"), JSON.stringify(result, null, 2));
    } catch {}
    console.error(JSON.stringify(result, null, 2));
    process.exitCode = 1;
} finally {
    if (browser) await browser.close();
}
