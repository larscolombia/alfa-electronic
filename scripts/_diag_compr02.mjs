import { cfg, pause, apiLogin, launchBrowser, uiLogin, createReference, findReference, apiPost, apiGet } from "./e2e-compr-helpers.mjs";
const ref = `DIAG-${Date.now()}`; const projId=`pw-diag-${Date.now()}`; const title=`PW DIAG ${Date.now()%100000}`;
const s = await apiLogin();
await createReference(s, ref, { designation:"Diag cap", brand:"QA" });
await apiPost(s,"/api/v1/inventory/movements",{reference:ref,quantity:5,type:"entrada",reason:"diag"});
// crear proyecto pedir-repuestos con tecnico asignado en properties
const pr = await fetch(`${cfg.baseUrl.replace(/\/+$/,'')}`); // noop
import { createProject } from "./e2e-compr-helpers.mjs";
await createProject(s,{id:projId,status:"pedir-repuestos",title,extraProps:{ technician:"Técnico Mesa 1 - Alfa" }});
const ctx=await launchBrowser(); const {page}=ctx; const browser=ctx.browser;
try{
 await uiLogin(page,{});
 await page.goto(`${cfg.baseUrl}/app/work-projects`,{waitUntil:"networkidle"});
 const col=page.locator('[data-column-id="pedir-repuestos"].cards-sortable').first();
 await col.waitFor({state:"visible",timeout:30000});
 const card=col.locator(".project-drag-item").filter({hasText:title}).first();
 console.log("card visible:", await card.isVisible().catch(()=>false));
 if(await card.isVisible()){ await card.click(); await pause(page); }
 const mt=page.locator('a.nav-link',{hasText:/^Materiales$/}).first();
 console.log("materials tab:", await mt.isVisible({timeout:15000}).catch(()=>false));
 if(await mt.isVisible().catch(()=>false)){ await mt.click(); await pause(page); }
 const si=page.locator('input[placeholder="Busca una referencia por codigo o descripcion..."]');
 console.log("search input:", await si.isVisible({timeout:15000}).catch(()=>false));
 if(await si.isVisible().catch(()=>false)){ await si.fill(ref); await pause(page); }
 const opt=page.locator(".material-search-option",{hasText:ref}).first();
 console.log("option visible:", await opt.isVisible({timeout:15000}).catch(()=>false), "text:", (await opt.innerText().catch(()=>'')).replace(/\s+/g,' '));
 // volcar los campos del form de reserva presentes
 const fields=await page.locator(".project-detail-field").evaluateAll(els=>els.map(e=>e.textContent.trim()).slice(0,40)).catch(()=>[]);
 console.log("form fields:", JSON.stringify(fields));
 if(await opt.isVisible().catch(()=>false)){ await opt.click(); await pause(page); }
 const af=page.locator(".project-detail-field",{hasText:"Asignado a"}).first();
 console.log("assigned field visible:", await af.isVisible({timeout:4000}).catch(()=>false));
 if(await af.isVisible().catch(()=>false)){ await af.locator("input").fill("Técnico Mesa 1 - Alfa"); await pause(page); }
 const btn=page.locator("button",{hasText:/^\s*Solicitar repuesto\s*$/}).first();
 console.log("btn enabled:", await btn.isEnabled({timeout:5000}).catch(()=>false));
 if(await btn.isEnabled().catch(()=>false)){ await btn.click(); }
 await page.waitForTimeout(3500);
 const alerts=await page.locator(".alert").evaluateAll(e=>e.map(x=>x.textContent.trim())).catch(()=>[]);
 console.log("ALERTS:", JSON.stringify(alerts));
 const resList = await apiGet(s,"/api/v1/inventory/reservations");
 const arr=(resList.payload && (Array.isArray(resList.payload)?resList.payload:(resList.payload.reservations||[]))) || [];
 console.log("reservations for ref:", JSON.stringify(arr.filter(r=>String(r.reference)===ref).map(r=>({id:r.id,qty:r.quantity,status:r.status}))));
 const projAfter=await (await apiGet(s,`/api/v1/projects/${projId}`)).payload;
 console.log("project status after:", projAfter?.status);
}catch(e){console.log("ERR", e.message)}finally{ await browser.close().catch(()=>{}); }
