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
const prospectName = `PW-Prospecto-t03-${ts}`;
const prospectEmail = `pw-prospecto-t03-${ts}@alfa.local`;
const companyName = `PW Empresa t03 ${ts}`;
const contactName = `Contacto t03 ${ts}`;
const companyEmail = `pw-empresa-t03-${ts}@alfa.local`;
const serie = `SERIE-T03-${ts}`;
const marca = `PWBrand-t03-${String(ts).slice(-6)}`;
const tipo = "Variador de velocidad";
const familia = "Variadores de velocidad";
const falla = `No enciende, error E-01 reportado por cliente (pw t03 ${ts})`;

const consoleErrors = [];
const pageErrors = [];
const observations = [];

const result = {
    test: "e2e-lars-t03-asignacion-tecnico",
    baseUrl,
    startedAt: new Date().toISOString(),
    data: { prospectName, prospectEmail, companyName, serie, techEmail },
    checks: {
        setupTechnicianUser: false,
        setupTechnicianEmployee: false,
        setupTechnicianInCatalog: false,
        prospectCreatedViaUi: false,
        receptionWizardCompleted: false,
        technicianAssignedInWizard: false,
        repairProjectGenerated: false,
        projectVisibleInKanbanRecibido: false,
        assigneeSetViaUi: false,
        projectMovedToDiagnosticoViaUi: false,
        cardInDiagnosticoWithSla: false,
        cardShowsTechnician: false,
        apiProjectStatusDiagnostico: false,
        apiAssigneeMatchesTechnician: false,
    },
    project: { id: "", title: "", status: "", shortCode: "" },
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

/** Localiza un <select> junto a un label con texto exacto y selecciona una opción. */
async function selectByLabel(scope, labelPattern, optionMatcher) {
    const label = scope.locator("label.form-label").filter({ hasText: labelPattern }).first();
    await label.waitFor({ state: "visible", timeout: 15000 });
    const select = label.locator("xpath=following-sibling::select");
    await select.waitFor({ state: "visible", timeout: 15000 });
    await select.selectOption(optionMatcher);
    return select;
}

/** Localiza un input junto a un label con texto exacto y lo rellena. */
async function fillByLabel(scope, exactLabel, value) {
    const label = scope.locator("label.form-label").filter({ hasText: new RegExp(`^\\s*${exactLabel}\\s*$`) }).first();
    await label.waitFor({ state: "visible", timeout: 15000 });
    const input = label.locator("xpath=following-sibling::input");
    await input.waitFor({ state: "visible", timeout: 15000 });
    await input.fill(value);
    return input;
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

    await page.goto(`${baseUrl}/app/crm-prospectos`, { waitUntil: "networkidle", timeout: timeoutMs });
    await waitForHeading(page, "prospect");

    const addButton = page.getByRole("button", { name: /Agregar Prospecto/i }).first();
    await addButton.click();
    await page.waitForFunction(
        () => Array.from(document.querySelectorAll("h5")).some((n) =>
            (n.textContent || "").toLowerCase().includes("detalles del prospecto")),
        null, { timeout: timeoutMs },
    );

    await page.locator("input[name='formNombre']").fill(prospectName);
    await page.locator("input[name='formCorreo']").fill(prospectEmail);
    await page.locator("input[name='formCompania']").fill(companyName);
    const movil = page.locator("input[name='formMovil']");
    if (await movil.isVisible().catch(() => false)) await movil.fill("3005550003");

    await page.locator(".card-footer button", { hasText: "Guardar" }).first().click();

    // Modal de duplicado (si aparece): confirmar y continuar.
    await page.waitForTimeout(1200);
    const dupModal = page.locator(".modal.show, .modal.fade.show").filter({ hasText: /duplicad/i }).first();
    if (await dupModal.isVisible().catch(() => false)) {
        note("Apareció el modal de prospecto duplicado; se confirma para continuar.");
        await screenshot(page, "01b-duplicado-modal");
        await dupModal.locator("button", { hasText: /guardar|confirmar|sí|aceptar/i }).first()
            .click().catch(() => page.keyboard.press("Enter"));
    }

    await page.waitForFunction(
        () => !Array.from(document.querySelectorAll("h5")).some((n) =>
            (n.textContent || "").toLowerCase().includes("detalles del prospecto")),
        null, { timeout: timeoutMs },
    );
    result.checks.prospectCreatedViaUi = true;
    await screenshot(page, "01-prospecto-creado");

    // ── STEP 2 (UI): abrir wizard "Asociar equipo" ──
    // Hallazgo conocido: la tabla asigna id numérico = posición en lista y oculta
    // filas cuyo id colisiona con un prospecto convertido; un prospecto recién
    // creado puede NO renderizar hasta que otros registros lo desplacen de índice.
    // Se reintenta con recarga hasta que la fila sea visible.
    console.log("STEP 2: wizard Asociar equipo (recepción)...");
    let prospectRow = null;
    for (let attempt = 1; attempt <= 30; attempt += 1) {
        await page.goto(`${baseUrl}/app/crm-prospectos`, { waitUntil: "networkidle", timeout: timeoutMs }).catch(() => null);
        await page.waitForSelector("tbody tr", { timeout: 45000 }).catch(() => null);
        await page.waitForTimeout(2000);
        const row = page.locator("tbody tr").filter({ hasText: prospectName }).first();
        if (await row.isVisible().catch(() => false)) {
            prospectRow = row;
            if (attempt > 1) note(`La fila del prospecto apareció en el intento ${attempt} tras recargas (índice de lista desplazado).`);
            break;
        }
        // Diagnóstico: ¿está el nombre en el DOM pero oculto, o ni siquiera llegó la fila?
        const diag = await page.evaluate((name) => {
            const tbody = document.querySelector("tbody");
            const text = tbody?.innerText || "";
            return {
                rowCount: document.querySelectorAll("tbody tr").length,
                nameInDom: text.includes(name),
                firstRowSnippet: (text.split("\n").slice(0, 6).join(" | ") || "").slice(0, 220),
            };
        }, prospectName).catch(() => null);
        note(`Intento ${attempt}/30: fila no visible. diag=${JSON.stringify(diag)}`);
        if (attempt === 4) await screenshot(page, "02a-fila-prospecto-no-visible");
        await page.waitForTimeout(8000);
    }
    if (!prospectRow) {
        await screenshot(page, "02a-fila-prospecto-no-visible");
        throw new Error(`La fila del prospecto ${prospectName} nunca apareció en la tabla tras 30 recargas (bug de filtrado por id de lista).`);
    }
    await prospectRow.locator("button.dropdown-toggle", { hasText: /Acciones/i }).first().click();
    const openMenuItem = prospectRow.locator(".dropdown-menu.show button.dropdown-item", { hasText: /Asociar equipo/i }).first();
    await openMenuItem.waitFor({ state: "visible", timeout: 15000 });
    await openMenuItem.click().catch(async () => {
        note("Clic normal en 'Asociar equipo' falló; se reintenta con force.");
        await openMenuItem.click({ force: true, timeout: 15000 });
    });

    const wizard = page.locator("app-crm-prospect-equipment-modal .modal-content").first();
    await wizard.waitFor({ state: "visible", timeout: timeoutMs });
    await page.locator(".modal-title", { hasText: /Asociar equipo/i }).first()
        .waitFor({ state: "visible", timeout: timeoutMs });

    // Paso 1/5 Recepción
    await fillByLabel(wizard, "Contacto", contactName);
    await fillByLabel(wizard, "E-mail", companyEmail);
    await fillByLabel(wizard, "Ciudad", "Bogotá");
    await page.locator("[data-testid='equipment-modal-company-search']").fill(companyName);
    await page.waitForTimeout(800);
    await page.locator("[data-testid='equipment-modal-company-create']").click();
    await page.waitForFunction(
        (name) => document.body.innerText.includes("Empresa seleccionada:") &&
            document.body.innerText.includes(name),
        companyName,
        { timeout: timeoutMs },
    );
    await screenshot(page, "02-wizard-recepcion");
    await page.locator("[data-testid='equipment-modal-next']").click();

    // Paso 2/5 Equipos (modo manual)
    await page.locator("[data-testid='equipment-modal-registration-mode-0']").selectOption("manual");
    const card = wizard.locator(".equipment-card").first();
    await card.locator("input[placeholder='Familia libre']").fill(familia);
    await selectByLabel(card, /Tipo de servicio$/, { label: "Reparación" });
    await selectByLabel(card, /Ubicación de almacenamiento/, { label: "Estantería" });
    await card.locator("input[placeholder='Marca del equipo']").fill(marca);
    await card.locator("input[placeholder='Tipo / referencia']").fill(tipo);
    await card.locator("input[placeholder='Serie o referencia visible']").fill(serie);
    await card.locator("textarea").first().fill(falla);

    // Asignación técnica en el wizard (Técnico responsable)
    await page.waitForFunction(
        () => {
            const select = Array.from(document.querySelectorAll("app-crm-prospect-equipment-modal select"))
                .find((s) => Array.from(s.options).some((o) => (o.textContent || "").includes("carga")));
            return !!select;
        },
        null, { timeout: timeoutMs },
    );
    const techSelect = page.locator("app-crm-prospect-equipment-modal select").filter({
        has: page.locator("option", { hasText: "carga" }),
    }).first();
    const techOptionValue = await techSelect.evaluate((selectEl) => {
        const opt = Array.from(selectEl.options).find((o) => (o.textContent || "").includes("Tecnico PW T03"));
        return opt ? opt.value : "";
    });
    if (!techOptionValue) throw new Error("La opción 'Tecnico PW T03' no está en el select de técnico responsable del wizard.");
    await techSelect.selectOption({ value: techOptionValue });
    await page.waitForTimeout(500);
    result.checks.technicianAssignedInWizard = true;
    await screenshot(page, "03-wizard-asignacion-tecnico");
    await page.locator("[data-testid='equipment-modal-next']").click();

    // Paso 3/5 Preguntas (autorización jefe técnico si el filtro industrial lo exige)
    const overrideAlert = page.locator(".modal-body", { hasText: /Bloqueo por filtro industrial/i }).first();
    if (await overrideAlert.isVisible().catch(() => false)) {
        note("El equipo no industrial exige autorización de jefe técnico (filtro industrial); se diligencia.");
        await wizard.locator("input[placeholder='Nombre del jefe']").fill("Jefe Taller PW t03");
        await wizard.locator("input[placeholder='Justificación operativa']").fill("Equipo de prueba E2E t03, autorización de prueba.");
    }
    await page.locator("[data-testid='equipment-modal-next']").click();

    // Paso 4/5 Evidencias: 4 fotos obligatorias (frente/atrás/izquierda/derecha)
    const fileInput = wizard.locator("input[type='file']").first();
    await fileInput.waitFor({ state: "visible", timeout: timeoutMs });
    const faceColors = [[214, 40, 40], [30, 120, 220], [240, 160, 20], [20, 160, 90]];
    const files = faceColors.map((rgb, i) => ({
        name: `evidencia-t03-${i + 1}.png`,
        mimeType: "image/png",
        buffer: makePng(320, 240, rgb),
    }));
    await fileInput.setInputFiles(files);
    await page.waitForFunction(
        () => document.querySelectorAll(".evidence-photo-card").length >= 4,
        null, { timeout: timeoutMs },
    );
    await page.waitForFunction(
        () => !document.body.innerText.includes("Procesando evidencias"),
        null, { timeout: timeoutMs },
    ).catch(() => null);
    const faceLabels = ["Cara frente", "Cara atrás", "Cara izquierda", "Cara derecha"];
    for (let i = 0; i < 4; i += 1) {
        const photoCard = wizard.locator(".evidence-photo-card").nth(i);
        await photoCard.locator("select").first().selectOption({ label: faceLabels[i] });
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
    result.project.title = project.title;
    result.project.status = project.status;
    result.project.shortCode = project.properties?.shortCode || "";
    result.checks.repairProjectGenerated = true;
    if ((project.properties?.assignee || "") === techName) {
        note(`INTERCONEXIÓN OK: la asignación del wizard sí llegó a properties.assignee del proyecto.`);
    } else {
        note(`INTERCONEXIÓN FALLIDA: la asignación del wizard NO llegó al proyecto (properties.assignee="${project.properties?.assignee || ""}"). El técnico se asignará en la ficha del tablero.`);
    }

    // ── STEP 3 (UI): tablero — asignar responsable y mover a Diagnóstico ──
    console.log("STEP 3: /app/work-projects — asignar técnico y mover a Diagnóstico...");
    await page.goto(`${baseUrl}/app/work-projects`, { waitUntil: "networkidle", timeout: timeoutMs });
    await page.waitForSelector(".kanban-board", { timeout: timeoutMs });
    await page.waitForTimeout(1500);

    const recibidoColumn = page.locator(".cards-sortable[data-column-id='recibido']").first();
    const cardInRecibido = recibidoColumn.locator(".project-card", { hasText: serie }).first();
    result.checks.projectVisibleInKanbanRecibido = await cardInRecibido.isVisible({ timeout: 15000 }).catch(() => false);
    await screenshot(page, "06-tablero-recibido");
    if (!result.checks.projectVisibleInKanbanRecibido) {
        note(`HALLAZGO: la tarjeta de la serie ${serie} no apareció en la columna "recibido" tras guardar la recepción.`);
    }

    // Abrir ficha (desde cualquier columna donde esté)
    const ourCard = page.locator(".project-card", { hasText: serie }).first();
    await ourCard.waitFor({ state: "visible", timeout: timeoutMs });
    await ourCard.click();
    const dialog = page.locator(".project-detail-dialog").first();
    await dialog.waitFor({ state: "visible", timeout: timeoutMs });

    // Pestaña "Planeacion y notas" → Responsable
    await dialog.getByText("Planeacion y notas", { exact: false }).click();
    const responsableSelect = dialog.locator("label.project-detail-field", { hasText: "Responsable" })
        .locator("select").first();
    await responsableSelect.waitFor({ state: "visible", timeout: 15000 });
    await responsableSelect.selectOption({ label: techName });
    result.checks.assigneeSetViaUi = true;
    await screenshot(page, "07-ficha-responsable");

    // Mover a Diagnóstico con el chip de estado
    await dialog.locator("button.status-chip", { hasText: "Diagnostico" }).first().click();
    await page.waitForTimeout(800);

    // Si la transición exige checklist (modal), diligenciar lo requerido
    const transitionModal = page.locator(".project-transition-check-modal, .modal-dialog").filter({
        hasText: /transici|confirmar|checklist/i,
    }).first();
    if (await transitionModal.isVisible().catch(() => false)) {
        note("La transición abrió modal de checklist; se diligencia y confirma.");
        await screenshot(page, "07b-modal-transicion");
        const inputs = transitionModal.locator("input[type='text'], textarea");
        const count = await inputs.count();
        for (let i = 0; i < count; i += 1) {
            await inputs.nth(i).fill("Autorizado E2E t03").catch(() => null);
        }
        await transitionModal.locator("button", { hasText: /confirmar|continuar|aplicar|guardar/i }).first()
            .click().catch(() => null);
        await page.waitForTimeout(800);
    }

    await dialog.getByRole("button", { name: "Guardar cambios", exact: true })
        .first().click({ timeout: 45000 });
    await page.waitForFunction(
        () => !document.querySelector(".project-detail-dialog") ||
            !document.querySelector(".project-detail-dialog").classList.contains("is-open"),
        null, { timeout: timeoutMs },
    ).catch(() => page.locator(".project-detail-dialog__close, .project-detail-dialog .btn-close").first().click().catch(() => null));
    await page.waitForTimeout(2000);
    result.checks.projectMovedToDiagnosticoViaUi = true;
    await page.waitForLoadState("networkidle", { timeout: 30000 }).catch(() => null);

    // ── STEP 4 (UI): verificación final en el tablero ──
    console.log("STEP 4: verificar tarjeta en Diagnóstico con SLA y técnico...");
    await page.goto(`${baseUrl}/app/work-projects`, { waitUntil: "networkidle", timeout: timeoutMs });
    await page.waitForSelector(".kanban-board", { timeout: timeoutMs });
    await page.waitForTimeout(2000);

    const diagnosticoColumn = page.locator(".cards-sortable[data-column-id='diagnostico']").first();
    const finalCard = diagnosticoColumn.locator(".project-card", { hasText: serie }).first();
    result.checks.cardInDiagnosticoWithSla = await finalCard.isVisible({ timeout: 20000 }).catch(() => false);

    if (result.checks.cardInDiagnosticoWithSla) {
        const slaSeverity = await finalCard.getAttribute("data-sla-severity").catch(() => "");
        const slaBadge = finalCard.locator(".project-card__badge--sla-success, .project-card__badge--sla-warning, .project-card__badge--sla-overdue, .project-card__badge--sla-critical").first();
        const slaText = await slaBadge.innerText().catch(() => "");
        const personText = ((await finalCard.locator(".project-card__footer-person").innerText().catch(() => "")) || "").trim();
        result.checks.cardShowsTechnician = personText.includes(techName);
        note(`Tarjeta en Diagnóstico: data-sla-severity="${slaSeverity}", badge SLA="${slaText.replace(/\s+/g, " ").trim()}", responsable="${personText.replace(/\s+/g, " ").trim()}".`);
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

    const failed = Object.entries(result.checks).filter(([, v]) => v !== true).map(([k]) => k);
    result.finishedAt = new Date().toISOString();
    result.failedChecks = failed;

    await fs.writeFile(path.resolve(artifactsDir, "e2e-lars-t03-results.json"), JSON.stringify(result, null, 2));

    console.log("E2E_LARS_T03_COMPLETED");
    console.log(JSON.stringify({ failedChecks: failed, checks: result.checks, project: result.project, observations }, null, 2));
    if (failed.length > 0) process.exitCode = 1;
} catch (error) {
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
