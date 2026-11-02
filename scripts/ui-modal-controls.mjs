/** Controles custom del modal de recepción de equipos (dropdown y fecha-hora).
 *  Sustituye a selectOption/fill sobre los <select> y <input type=datetime-local>
 *  nativos, reemplazados por app-crm-modal-select / app-crm-modal-datetime. */

export async function openCustomSelectMenu(page, triggerLocator) {
  const trigger = triggerLocator.first();
  // El menú vive DENTRO del root .crm-modal-select que envuelve al trigger
  // (ver crm-modal-select.component.ts). Escopiar el locator al root elimina la
  // ambigüedad de ".crm-modal-select-menu:visible" global, que bajo slowMo +
  // CD de Angular podía resolver contra un estado transitorio del menú y fallar
  // aunque segundos después (forense post-fallo) el mismo menú estuviera abierto,
  // posicionado y con opciones visibles.
  const root = trigger.locator("xpath=ancestor::div[contains(@class,'crm-modal-select')][1]");
  const menu = root.locator(".crm-modal-select-menu").first();
  // Condición de éxito real: el menú visible Y con al menos una opción visible.
  // (El *ngIf renderiza opciones y vacío; la visibilidad de opción implica que
  // positionMenu() ya dimensionó el contenedor, es decir, que no colapsó a 0px.)
  const optionVisible = async (ms) => {
    await menu.waitFor({ state: "visible", timeout: ms }).catch(() => {});
    return root.locator(".crm-modal-select-option").first().isVisible().catch(() => false);
  };

  // Click inicial: el trigger es la UI pública del componente (toggle()).
  await trigger.click();
  let opened = await optionVisible(2500);

  if (!opened) {
    // Estado transitorio posible: aria-expanded=true pero menú colapsado/cerrado
    // por el listener document:scroll (capture) o pointerdown. Escape resetea el
    // componente desde cualquier estado interno; si estaba cerrado, re-abrimos.
    await trigger.press("Escape").catch(() => {});
    await page.waitForTimeout(150).catch(() => {});
    const expanded = (await trigger.getAttribute("aria-expanded").catch(() => "")) === "true";
    if (!expanded) {
      // Click de re-apertura: el trigger sigue siendo la UI pública del componente.
      await trigger.click();
    }
    opened = await optionVisible(2500);
  }

  if (!opened) {
    // Último recurso accesible: teclado. ArrowDown abre (o navega si ya abierto).
    await trigger.press("ArrowDown");
    opened = await optionVisible(2500);
  }

  if (!opened) {
    const expanded = await trigger.getAttribute("aria-expanded").catch(() => "(sin atributo)");
    const menuCount = await root.locator(".crm-modal-select-menu").count();
    const optCount = await root.locator(".crm-modal-select-option").count().catch(() => 0);
    throw new Error(`El selector custom no abrió su menú (aria-expanded=${expanded}, menus-en-root=${menuCount}, opciones=${optCount})`);
  }
  return menu;
}

/** option: string (data-value) | { value } | { label } | { labelRegex } | { index } */
export async function selectCustomModal(page, triggerLocator, option) {
  const trigger = triggerLocator.first();
  // La suite sirve tanto durante la migración de los selectores nativos como
  // con app-crm-modal-select. Ambos caminos se operan por la UI; nunca se
  // escribe el modelo Angular ni se consulta una API.
  const nativeSelect = (await trigger.evaluate(element => element.tagName).catch(() => "")) === "SELECT"
    ? trigger
    : trigger.locator("select").first();
  if (await nativeSelect.count()) {
    if (typeof option === "string") await nativeSelect.selectOption(option);
    else if (option.value !== undefined) await nativeSelect.selectOption(String(option.value));
    else if (option.label !== undefined) await nativeSelect.selectOption({ label: option.label });
    else if (option.labelRegex) {
      const options = await nativeSelect.locator("option").allTextContents();
      const index = options.findIndex(label => option.labelRegex.test(label));
      if (index < 0) throw new Error(`No existe una opción que coincida con ${option.labelRegex}`);
      await nativeSelect.selectOption({ index });
    } else await nativeSelect.selectOption({ index: option.index ?? 0 });
    await page.waitForTimeout(300);
    return;
  }
  const menu = await openCustomSelectMenu(page, triggerLocator);
  let target;
  if (typeof option === "string") {
    target = menu.locator(`[data-value="${cssEscape(option)}"]`).first();
  } else if (option.value !== undefined) {
    target = menu.locator(`[data-value="${cssEscape(String(option.value))}"]`).first();
  } else if (option.labelRegex) {
    target = menu.locator(".crm-modal-select-option", { hasText: option.labelRegex }).first();
  } else if (option.label !== undefined) {
    target = menu.locator(".crm-modal-select-option", { hasText: exactText(option.label) }).first();
  } else {
    target = menu.locator(".crm-modal-select-option").nth(option.index ?? 0);
  }
  await target.click();
  await page.waitForTimeout(300);
}

/** Establece fecha y hora local ("yyyy-MM-ddTHH:mm") en app-crm-modal-datetime.
 *  El calendario abre SIEMPRE en el mes actual del browser (new Date() en
 *  crm-modal-datetime.component.ts). Si la fecha objetivo está en otro mes, su
 *  celda existe como .other-month pero con visibility:hidden + disabled: hay que
 *  navegar primero con los botones "Mes anterior/siguiente" de la cabecera. */
export async function setCustomModalDateTime(page, triggerLocator, localValue) {
  const [datePart, timePart = ""] = String(localValue).split("T");
  const m = /^\d{4}-\d{2}(-\d{2})?$/.test(String(datePart)) ? String(datePart) : null;
  if (!m || !/^\d{4}-\d{2}-\d{2}$/.test(m)) {
    throw new Error(`setCustomModalDateTime: fecha inválida "${localValue}" (esperado yyyy-MM-dd[THH:mm])`);
  }
  const trigger = triggerLocator.first();
  await trigger.click();
  // Misma disciplina que openCustomSelectMenu: escopiar al root del componente
  // (.crm-modal-dt envuelve a trigger y menú) en vez de ":visible.last()" global.
  const root = trigger.locator("xpath=ancestor::div[contains(@class,'crm-modal-dt')][1]");
  const menu = root.locator(".crm-modal-dt-menu").first();
  await menu.waitFor({ state: "visible", timeout: 5000 });

  // Navegación por meses: delta entre el mes objetivo y el mes en que abre el
  // calendario (el actual). Cap de 61 para no buclear sobre entrada basura.
  const [ty, tm] = String(datePart).split("-").map(Number);
  const now = new Date();
  const deltaMonths = (ty - now.getFullYear()) * 12 + ((tm - 1) - now.getMonth());
  if (deltaMonths !== 0) {
    const navButton = menu.locator(`button[aria-label="${deltaMonths < 0 ? "Mes anterior" : "Mes siguiente"}"]`);
    for (let i = Math.abs(deltaMonths); i > 0; i -= 1) {
      await navButton.click();
      await page.waitForTimeout(120);
    }
  }

  // Tras navegar, la celda del día objetivo debe ser visible y habilitada.
  const dayCell = menu.locator(`.crm-modal-dt-day[data-date="${datePart}"]`);
  if (!(await dayCell.waitFor({ state: "visible", timeout: 3000 }).then(() => true, () => false))) {
    const label = (await menu.locator("span.fw-semibold").first().innerText().catch(() => "(sin etiqueta)")) || "(sin etiqueta)";
    throw new Error(`La celda ${datePart} no quedó visible tras navegar el calendario (mes mostrado: "${label}")`);
  }
  await dayCell.click();
  const [hour = "00", minute = "00"] = timePart.split(":");
  await menu.locator("[data-testid='dt-hour']").fill(hour);
  await menu.locator("[data-testid='dt-minute']").fill(minute);
  // Escape cierra el menú desde cualquier foco interno (keydown burbujea a .crm-modal-dt-menu).
  await page.keyboard.press("Escape");
  await menu.waitFor({ state: "hidden", timeout: 5000 }).catch(() => {});

  // Verificación de commit contra la UI: el trigger debe mostrar fecha/hora legible
  // (formato es-CO "dd/mm/aaaa hh:mm") y no el placeholder.
  const display = ((await triggerLocator.first().textContent().catch(() => "")) || "").trim();
  if (!/\d{2}\/\d{2}\/\d{4}/.test(display)) {
    throw new Error(`app-crm-modal-datetime no registró la fecha/hora tras la selección (trigger="${display}", valor esperado ~${localValue}).`);
  }
  await page.waitForTimeout(300);
}

function exactText(text) {
  return new RegExp(`^\\s*${escapeRegExp(text)}\\s*$`);
}

function escapeRegExp(text) {
  return String(text).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function cssEscape(value) {
  if (typeof CSS !== "undefined" && CSS.escape) return CSS.escape(value);
  return escapeRegExp(value);
}
