/** Helpers UI-only para el recorrido de equipo: sin endpoints de negocio. */
import zlib from "node:zlib";

export function png() {
  const crc = b => { let c = 0xffffffff; for (const x of b) { c ^= x; for (let i=0;i<8;i++) c=(c>>>1)^((c&1)?0xedb88320:0); } return (c^0xffffffff)>>>0; };
  const chunk = (t,d) => { const n=Buffer.alloc(4); n.writeUInt32BE(d.length); const b=Buffer.concat([Buffer.from(t),d]); const z=Buffer.alloc(4); z.writeUInt32BE(crc(b)); return Buffer.concat([n,b,z]); };
  const h=Buffer.from([0,0,0,2,0,0,0,2,8,6,0,0,0]); const raw=Buffer.from([0,210,40,40,255,40,80,210,255,0,20,160,90,255,240,160,20,255,0]);
  return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk("IHDR",h),chunk("IDAT",zlib.deflateSync(raw)),chunk("IEND",Buffer.alloc(0))]);
}

export function makeUtils({ base, pause, data }) {
  async function visible(locator, message) { if (!await locator.waitFor({state:"visible",timeout:30000}).then(()=>true).catch(()=>false)) throw new Error(message); return locator; }
  async function click(page, locator, label) {
    await visible(locator, `No encontré CTA: ${label}`); await locator.scrollIntoViewIfNeeded(); const b=await locator.boundingBox();
    if (b) await page.mouse.move(b.x+b.width/2,b.y+b.height/2,{steps:12});
    await locator.evaluate(e=>{e.classList.add("ui-journey-cta"); e.style.outline="4px solid #ff00aa"; e.style.outlineOffset="4px";});
    await page.waitForTimeout(pause); await locator.click(); await page.waitForTimeout(pause);
  }
  async function selectLabel(scope, pattern, option) { const label=scope.locator("label.form-label").filter({hasText:pattern}).first(); const s=label.locator("xpath=..").locator("select"); await s.selectOption(option,{force:true}); }
  async function fillLabel(scope, text, value) { const label=scope.locator("label.form-label").filter({hasText:new RegExp(`^\\s*${text}\\s*$`)}).first(); await label.locator("xpath=following-sibling::input").fill(value); }
  async function openCard(page) {
    await page.goto(`${base}/app/work-projects`,{waitUntil:"domcontentloaded"});
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
  return { visible, click, selectLabel, fillLabel, openCard, confirmTransitionIfAsked, moveAndSave };
}
