/** Controles custom del modal de recepción de equipos (dropdown y fecha-hora).
 *  Sustituye a selectOption/fill sobre los <select> y <input type=datetime-local>
 *  nativos, reemplazados por app-crm-modal-select / app-crm-modal-datetime. */

export async function openCustomSelectMenu(page, triggerLocator) {
  const trigger = triggerLocator.first();
  await trigger.click();
  const menu = page.locator(".crm-modal-select-menu:visible").last();
  // Algunos navegadores cierran el popup visual de un control con apariencia
  // de select al hacer click. El componente también es accesible por teclado;
  // usamos ArrowDown como interacción UI de respaldo, no como mutación DOM.
  if (!await menu.isVisible().catch(() => false)) {
    await trigger.press("ArrowDown");
  }
  if (!await menu.isVisible().catch(() => false)) {
    const expanded = await trigger.getAttribute("aria-expanded").catch(() => "(sin atributo)");
    const menus = await page.locator(".crm-modal-select-menu").count();
    throw new Error(`El selector custom no abrió su menú (aria-expanded=${expanded}, menus-en-DOM=${menus})`);
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

/** Establece fecha y hora local ("yyyy-MM-ddTHH:mm") en app-crm-modal-datetime. */
export async function setCustomModalDateTime(page, triggerLocator, localValue) {
  const [datePart, timePart = ""] = String(localValue).split("T");
  await triggerLocator.first().click();
  const menu = page.locator(".crm-modal-dt-menu:visible").last();
  await menu.waitFor({ state: "visible", timeout: 5000 });
  await menu.locator(`[data-date="${datePart}"]`).click();
  const [hour = "00", minute = "00"] = timePart.split(":");
  await menu.locator("[data-testid='dt-hour']").fill(hour);
  await menu.locator("[data-testid='dt-minute']").fill(minute);
  await page.keyboard.press("Escape");
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
