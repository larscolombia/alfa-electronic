/** Helpers UI-only para el recorrido de equipo: sin endpoints de negocio. */
import zlib from "node:zlib";

export function png() {
  const crc = b => { let c = 0xffffffff; for (const x of b) { c ^= x; for (let i=0;i<8;i++) c=(c>>>1)^((c&1)?0xedb88320:0); } return (c^0xffffffff)>>>0; };
  const chunk = (t,d) => { const n=Buffer.alloc(4); n.writeUInt32BE(d.length); const b=Buffer.concat([Buffer.from(t),d]); const z=Buffer.alloc(4); z.writeUInt32BE(crc(b)); return Buffer.concat([n,b,z]); };
  const h=Buffer.from([0,0,0,2,0,0,0,2,8,6,0,0,0]); const raw=Buffer.from([0,210,40,40,255,40,80,210,255,0,20,160,90,255,240,160,20,255,0]);
  return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk("IHDR",h),chunk("IDAT",zlib.deflateSync(raw)),chunk("IEND",Buffer.alloc(0))]);
}

const FOCUS_OUTLINE = "4px solid #ff00aa";
function paint(locator) { return locator.evaluate(e=>{e.classList.add("ui-journey-focus"); e.style.outline=FOCUS_OUTLINE; e.style.outlineOffset="3px";}).catch(()=>{}); }

export function makeUtils({ base, pause, data }) {
  async function visible(locator, message) { if (!await locator.waitFor({state:"visible",timeout:30000}).then(()=>true).catch(()=>false)) throw new Error(message); return locator; }
  async function click(page, locator, label) {
    await visible(locator, `No encontré CTA: ${label}`); await locator.scrollIntoViewIfNeeded(); const b=await locator.boundingBox();
    if (b) await page.mouse.move(b.x+b.width/2,b.y+b.height/2,{steps:12});
    await paint(locator);
    await page.waitForTimeout(pause); await locator.click(); await page.waitForTimeout(pause);
  }
  async function mark(page, locator) {
    const target=locator.first();
    if (!await target.waitFor({state:"attached",timeout:5000}).then(()=>true).catch(()=>false)) return;
    let painted=target;
    if (await target.isVisible().catch(()=>false)) {
      await target.scrollIntoViewIfNeeded().catch(()=>{});
      const b=await target.boundingBox().catch(()=>null);
      if (b) await page.mouse.move(b.x+b.width/2,b.y+b.height/2,{steps:8});
    } else {
      // Choices.js oculta el <select> nativo: se resalta el control visible.
      const wrapper=target.locator("xpath=ancestor::div[contains(@class,'choices')][1]");
      if (await wrapper.count().catch(()=>0)) painted=wrapper.first();
    }
    await paint(painted);
    await page.waitForTimeout(pause);
  }
  async function fillFocus(page, locator, value) { await mark(page,locator); await locator.fill(value); await page.waitForTimeout(pause); }
  async function selectFocus(page, locator, option, opts) {
    const select = locator.first();
    await mark(page, select);
    // Los selectores mejorados con Choices.js esconden el <select> original.
    // Elegimos la opción del control visible para que Angular reciba el mismo
    // evento de usuario que en producción, en vez de mutar el nodo oculto.
    if ((await select.getAttribute("data-choice").catch(() => null)) === "active") {
      const label = typeof option === "string"
        ? option
        : option?.index !== undefined
          ? (await select.locator("option").nth(Number(option.index)).innerText()).trim()
          : String(option?.label ?? option?.value ?? "");
      if (!label) throw new Error("No se pudo determinar la opción visible del selector");
      const name = await select.getAttribute("name");
      // Sin `name` (ngModel standalone), el ancestro más cercano que contiene
      // "choices" es div.choices__inner, no el wrapper: se resuelve por token
      // exacto de la clase exterior para poder leer .choices__inner dentro.
      const wrapper = name
        ? page.locator(`.choices:has(select[name="${escapeCssAttribute(name)}"])`).first()
        : select.locator("xpath=ancestor::*[contains(concat(' ', normalize-space(@class), ' '), ' choices ')][1]");
      if (await wrapper.count()) {
        const trigger = wrapper.locator(".choices__inner").first();
        if (await trigger.isVisible().catch(() => false)) {
          await trigger.click();
          const choice = wrapper.locator(".choices__list--dropdown .choices__item--choice").filter({ hasText: new RegExp(`^\\s*${escapeRegExp(label)}\\s*$`) }).first();
          await visible(choice, `No encontré la opción visible: ${label}`);
          await choice.click();
        } else {
          await select.selectOption(option, { ...opts, force: true });
        }
      } else {
        await select.selectOption(option, { ...opts, force: true });
      }
    } else {
      await select.selectOption(option, opts);
    }
    await page.waitForTimeout(pause);
  }
  // Selección por label de campo cuando SelectEnhancementService puede mejorar el
  // <select> con Choices.js (~50 ms tras renderizar el modal). Resuelve ambos casos:
  // widget .choices visible o select nativo aún no mejorado. La coincidencia es
  // parcial porque las opciones reales son "Nombre (Contacto)".
  async function pickByLabel(page, scope, labelText, optionText) {
    const label = scope.locator("label.form-label").filter({ hasText: labelText }).first();
    await visible(label, `No aparece el campo "${labelText}"`);
    const widget = label.locator("xpath=following-sibling::*[contains(@class,'choices')][1]");
    const native = label.locator("xpath=following-sibling::select").first();
    let mode = null;
    const deadline = Date.now() + 30000;
    while (!mode && Date.now() < deadline) {
      if ((await widget.count()) && (await widget.first().isVisible().catch(() => false))) mode = "choices";
      else if (await native.isVisible().catch(() => false)) mode = "native";
      else await page.waitForTimeout(150);
    }
    if (!mode) throw new Error(`El selector "${labelText}" no quedó disponible ni como widget Choices ni como select nativo`);
    if (mode === "choices") {
      const w = widget.first();
      const trigger = w.locator(".choices__inner").first();
      await paint(trigger);
      // El select puede nacer disabled (p. ej. Ciudad antes de elegir País).
      const enabledBy = Date.now() + 10000;
      while (!(await trigger.isEnabled().catch(() => true)) && Date.now() < enabledBy) {
        await page.waitForTimeout(150);
      }
      if (!(await trigger.isEnabled().catch(() => false))) throw new Error(`El selector "${labelText}" quedó inhabilitado`);
      await trigger.click();
      const items = w.locator(".choices__list--dropdown .choices__item--choice");
      await visible(items.first(), `No se desplegaron opciones en "${labelText}"`);
      const item = items.filter({ hasText: new RegExp(escapeRegExp(optionText)) }).first();
      if (await item.isVisible().catch(() => false)) {
        await paint(item);
        await item.click();
      } else {
        const list = await items.allInnerTexts().catch(() => []);
        throw new Error(`No encontré la opción "${optionText}" en "${labelText}". Opciones visibles: ${JSON.stringify(list.slice(0, 10))}`);
      }
    } else {
      const sel = native;
      await paint(sel);
      const opts = await sel.locator("option").evaluateAll((os) => os.map((o) => (o.textContent || "").trim()));
      const idx = opts.findIndex((t) => t.includes(optionText));
      if (idx < 0) throw new Error(`No encontré la opción "${optionText}" en "${labelText}" entre: ${JSON.stringify(opts.slice(0, 8))}`);
      await sel.selectOption({ index: idx });
    }
    // Verifica que el valor quedó fijado en el control real (widget o nativo).
    const fixed = mode === "choices"
      ? ((await widget.first().locator("select").first().inputValue().catch(() => "")) || "")
      : ((await native.inputValue().catch(() => "")) || "");
    if (!fixed) throw new Error(`La selección "${optionText}" en "${labelText}" no quedó fijada`);
    await page.waitForTimeout(pause);
  }
  // SelectEnhancementService monta Choices.js (~50 ms) y oculta el <select>
  // nativo. Espera a que el control quede interactuable como un usuario real:
  // select nativo visible o widget .choices activo y visible.
  async function awaitSelectReady(page, select, message) {
    const first=select.first();
    if(!await first.waitFor({state:"attached",timeout:30000}).then(()=>true).catch(()=>false)) throw new Error(message);
    const deadline = Date.now() + 30000;
    for(;;) {
      if(await first.isVisible().catch(()=>false)) return "native";
      if((await first.getAttribute("data-choice").catch(()=>null))==="active") {
        const wrapper=first.locator("xpath=ancestor::*[contains(concat(' ', normalize-space(@class), ' '), ' choices ')][1]");
        if(await wrapper.count().then(c=>c>0).catch(()=>false) && await wrapper.first().isVisible().catch(()=>false)) return "choices";
      }
      if(Date.now()>deadline) throw new Error(`${message} (ni select nativo visible ni widget Choices activo)`);
      await page.waitForTimeout(150);
    }
  }
  async function checkFocus(page, locator) { await mark(page,locator); if (!await locator.isChecked().catch(()=>false)) await locator.check(); await page.waitForTimeout(pause); }
  async function attachFocus(page, locator, files) { await mark(page,locator); await locator.setInputFiles(files); await page.waitForTimeout(pause); }
  async function selectLabel(scope, pattern, option) { const label=scope.locator("label.form-label").filter({hasText:pattern}).first(); const s=label.locator("xpath=..").locator("select"); await paint(s.first()); await s.selectOption(option,{force:true}); }
  async function fillLabel(scope, text, value) { const label=scope.locator("label.form-label").filter({hasText:new RegExp(`^\\s*${text}\\s*$`)}).first(); const input=label.locator("xpath=following-sibling::input"); await paint(input.first()); await input.fill(value); }
  async function ensureBoardFullView(page) {
    const box=page.locator(".compact-mode-toggle input[type=checkbox]").first();
    if(!await box.waitFor({state:"attached",timeout:20000}).then(()=>true).catch(()=>false)) return;
    if(await box.isChecked().catch(()=>false)){ await mark(page,box); await box.uncheck(); await page.waitForTimeout(pause); await page.waitForTimeout(600); }
  }
  async function openCard(page) {
    await page.goto(`${base}/app/work-projects`,{waitUntil:"domcontentloaded"});
    await ensureBoardFullView(page);
    const card=page.locator(".project-card",{hasText:data.serie}).first();
    if(!await card.waitFor({state:"visible",timeout:20000}).then(()=>true).catch(()=>false)) await page.waitForTimeout(8000);
    await visible(card,"La tarjeta del proyecto no aparece en el tablero");
    await click(page,card,"Tarjeta del proyecto");
    return page.locator(".project-detail-dialog").first();
  }
  async function confirmTransitionIfAsked(page) {
    const modal=page.locator("app-project-transition-check-modal .project-transition-dialog");
    if(!await modal.waitFor({state:"visible",timeout:5000}).then(()=>true).catch(()=>false)) return;
    for(const q of await modal.locator(".transition-question").all()){
      const select=q.locator("select");
      if(await select.count()>0){ if(!((await select.first().inputValue().catch(()=>""))||"").trim()) await select.first().selectOption({index:1},{force:true}); continue; }
      const num=q.locator("input[type=number]");
      if(await num.count()>0){ await num.first().fill("1"); continue; }
      const ta=q.locator("textarea");
      if(await ta.count()>0) await ta.first().fill("Verificado en campo durante la transición.");
    }
    await click(page,modal.getByRole("button",{name:"Confirmar transicion"}),"Confirmar transicion");
  }
  async function moveAndSave(page,d,chip) {
    await click(page,d.locator("button.status-chip",{hasText:chip}).first(),`Mover a ${chip}`);
    await confirmTransitionIfAsked(page);
    await click(page,d.getByRole("button",{name:"Guardar cambios"}),"Guardar cambios");
    await page.waitForTimeout(1000);
  }
  return { visible, click, mark, fillFocus, selectFocus, awaitSelectReady, pickByLabel, checkFocus, attachFocus, selectLabel, fillLabel, openCard, ensureBoardFullView, confirmTransitionIfAsked, moveAndSave };
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function escapeCssAttribute(value) {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}
