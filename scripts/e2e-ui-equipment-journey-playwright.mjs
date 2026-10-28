/** UI-only journey: no business endpoint is called by this runner. */
import { chromium } from "playwright";
import { png, makeUtils } from "./ui-journey-helpers.mjs";

const base = (process.env.PW_BASE_URL || "http://127.0.0.1:4200").replace(/\/+$/, "");
const headless = !["false", "0", "no"].includes((process.env.PW_HEADLESS || "false").toLowerCase());
const pause = Number(process.env.PW_SLOW_MO_MS || "300");
const stamp = Date.now();
const data = { prospect: `UI Cliente ${stamp}`, email: `ui.${stamp}@prueba.local`, company: `UI Industria ${stamp}`, serie: `UI-MB-10M-${stamp}`, oc: `OC-UI-${stamp}` };
const { visible, click, selectLabel, fillLabel, openCard, confirmTransitionIfAsked, moveAndSave } = makeUtils({ base, pause, data });

let currentPage=null;
const snap=s=>{ if(!currentPage) return Promise.resolve(); return currentPage.screenshot({path:`playwright-artifacts/ui-journey-${stamp}-${s}.png`,fullPage:true}).catch(()=>{}); };

async function login(page) {
  await page.goto(`${base}/auth/signin`,{waitUntil:"domcontentloaded"}); await page.locator("#emailadd").fill(process.env.PW_USER_EMAIL||"admin@alfa.com"); await page.locator("#passwd").fill(process.env.PW_USER_PASSWORD||"1234");
  await click(page,page.getByRole("button",{name:"Login"}),"Login"); await page.waitForURL(/\/app\//,{timeout:30000});
}
async function reception(page) {
  await page.goto(`${base}/app/crm-prospectos`,{waitUntil:"domcontentloaded"}); await click(page,page.getByRole("button",{name:/Agregar Prospecto/i}),"Agregar Prospecto");
  await page.locator("input[name=formNombre]").fill(data.prospect); await page.locator("input[name=formCorreo]").fill(data.email); await page.locator("input[name=formCompania]").fill(data.company); await page.locator("input[name=formMovil]").fill("3005550101");
  await click(page,page.locator(".card-footer button",{hasText:"Guardar"}).first(),"Guardar prospecto"); await page.waitForTimeout(1200);
  await page.reload({waitUntil:"domcontentloaded"}); const row=page.locator("tbody tr",{hasText:data.prospect}).first(); await visible(row,"El prospecto creado no se muestra en CRM");
  await click(page,row.locator("button.dropdown-toggle").first(),"Acciones"); await snap("2a-menu-acciones-crm"); await click(page,row.locator(".dropdown-menu button",{hasText:/Asociar equipo/i}).first(),"Asociar equipo");
  const w=page.locator("app-crm-prospect-equipment-modal .modal-content").first(); await visible(w,"No abrió el wizard de recepción");
  await fillLabel(w,"Contacto","Ana Cliente"); await fillLabel(w,"E-mail",data.email); await fillLabel(w,"Ciudad","Bogotá"); await w.locator("[data-testid=equipment-modal-company-search]").fill(data.company); await click(page,w.locator("[data-testid=equipment-modal-company-create]"),"Crear empresa"); await click(page,w.locator("[data-testid=equipment-modal-next]"),"Siguiente recepción");
  await w.locator("[data-testid=equipment-modal-registration-mode-0]").selectOption("manual",{force:true}); const card=w.locator(".equipment-card").first(); await card.locator("input[placeholder='Familia libre']").fill("Tarjetas electrónicas"); await selectLabel(card,/Tipo de servicio/,{label:"Reparación"}); await selectLabel(card,/Ubicación de almacenamiento/,{label:"Estantería"}); await card.locator("input[placeholder='Marca del equipo']").fill("Siemens"); await card.locator("input[placeholder='Tipo / referencia']").fill("Placa base industrial"); await card.locator("input[placeholder='Serie o referencia visible']").fill(data.serie); await card.locator("textarea").first().fill("Placa base: reparación cotizada en $10.000.000 COP.");
  const tech=card.locator("select").filter({has:card.locator("option:not([value=''])")}).last(); const value=await tech.locator("option").nth(1).getAttribute("value").catch(()=>null); if(value) await tech.selectOption(value,{force:true});
  await click(page,w.locator("[data-testid=equipment-modal-next]"),"Siguiente equipo");
  const ask=async(label)=>{const q=w.locator(".border.rounded.p-3",{hasText:label}).first(); const box=q.locator("input[type=checkbox]").first(); if(await box.isChecked().catch(()=>true)===false) await click(page,box,`Pregunta ${label}`);};
  await ask("superior a $ 2'000.000"); await ask("no es un problema de programación");
  const override=w.locator("input[placeholder='Nombre del jefe']"); if(await override.isVisible().catch(()=>false)){await override.fill("Jefe técnico");await w.locator("input[placeholder='Justificación operativa']").fill("Caso de prueba UI.");} await click(page,w.locator("[data-testid=equipment-modal-next]"),"Siguiente preguntas");
  const fileInput=w.locator("input[type=file]").first();
  if(!await fileInput.waitFor({state:"attached",timeout:15000}).then(()=>true).catch(()=>false)){
    const step=await w.locator(".wizard-step.active").innerText().catch(()=>"?");
    const msg=await w.locator("[data-testid=equipment-modal-validation-message]").innerText().catch(()=>"(sin mensaje)");
    throw new Error(`No se encontró input de evidencias. Paso activo: ${step} | Validación: ${msg}`);
  }
  await fileInput.setInputFiles([0,1,2,3].map(i=>({name:`cara-${i}.png`,mimeType:"image/png",buffer:png()}))); await page.waitForTimeout(600); const photos=w.locator(".evidence-photo-card"); for(let i=0;i<4;i++) await photos.nth(i).locator("select").selectOption({label:["Cara frente","Cara atrás","Cara izquierda","Cara derecha"][i]},{force:true}); await click(page,w.locator("[data-testid=equipment-modal-next]"),"Siguiente evidencias");
  const generate=w.locator("#generateRepairProjectsOnSave"); if(!await generate.isChecked()) await generate.check(); await click(page,w.locator("[data-testid=equipment-modal-save]"),"Guardar recepción y generar proyecto"); await page.waitForTimeout(1800);
}
async function diagnoseAndQuote(page) {
  await page.goto(`${base}/app/work-projects`,{waitUntil:"domcontentloaded"}); let card=page.locator(".project-card",{hasText:data.serie}).first();
  if(!await card.waitFor({state:"visible",timeout:20000}).then(()=>true).catch(()=>false)){
    await page.waitForTimeout(8000); card=page.locator(".project-card",{hasText:data.serie}).first();
  }
  if(!await card.waitFor({state:"visible",timeout:5000}).then(()=>true).catch(()=>false)){
    const cols=await page.locator("[data-testid^=column-header-]").allInnerTexts().catch(()=>[]);
    const cards=await page.locator(".project-card,.project-drag-item").allInnerTexts().catch(()=>[]);
    throw new Error(`La tarjeta del proyecto no aparece. Columnas: ${JSON.stringify(cols)} | Tarjetas: ${JSON.stringify(cards.slice(0,5))}`);
  }
  await click(page,card,"Proyecto recibido"); const d=page.locator(".project-detail-dialog").first();
  await click(page,d.locator("button.status-chip",{hasText:"Diagnostico"}).first(),"Mover a diagnóstico"); await click(page,d.getByRole("button",{name:"Guardar cambios"}),"Guardar diagnóstico"); await page.waitForTimeout(800); await page.goto(`${base}/app/work-projects`,{waitUntil:"domcontentloaded"}); await click(page,page.locator("[data-column-id=diagnostico] .project-card",{hasText:data.serie}).first(),"Caso en diagnóstico");
  for(const x of ["Equipo desarmado","Prueba estatica realizada","Prueba de encendido realizada","Falla identificada"]){const l=d.locator("label.project-switch",{hasText:x}).first(); if(!await l.locator("input").isChecked()) await click(page,l,x);}
  const fields=d.locator(".project-detail-field"); await fields.filter({hasText:"Memo diagnostico"}).locator("textarea,input").fill("Diagnóstico de placa principal; reparación viable."); await fields.filter({hasText:"Memo reparacion"}).locator("textarea,input").fill("Cambio de componentes y prueba funcional."); await fields.filter({hasText:"Horas hombre estimadas"}).locator("input").fill("8"); await fields.filter({hasText:"Presupuesto repuestos"}).locator("input").fill("10000000");
  await click(page,d.getByRole("button",{name:/Cerrar diagnóstico/}),"Cerrar diagnóstico"); await page.waitForTimeout(1000); await click(page,d.getByRole("button",{name:/Crear cotización con diagnóstico/}),"Crear cotización con diagnóstico"); await page.waitForURL(/crm-cotizaciones/,{timeout:30000});
  const form=page.locator("[data-testid=quote-form-card]"); await visible(form,"No llegó la cotización precargada"); const equipment=form.locator("label.form-check",{hasText:data.serie}).first(); await click(page,equipment,"Seleccionar equipo en cotización"); const row=form.locator("table tbody tr").first(); await row.locator("td").first().locator("select").first().selectOption({index:1},{force:true}); await row.locator("input[placeholder='Descripcion del servicio']").fill("Reparación placa base industrial"); await row.locator("td").nth(1).locator("input:not(.choices__input)").fill("1"); await row.locator("td").nth(2).locator("input:not(.choices__input)").fill("10000000"); await row.locator("td").nth(3).locator("select").selectOption({label:"0%"},{force:true}); await form.locator("textarea").nth(0).fill("Reparación aprobada de placa base."); await form.locator("textarea").nth(1).fill("Vigencia 15 días.");
  await click(page,form.locator("button.dropdown-toggle").first(),"Opciones de guardado"); await snap("3a-menu-guardado-cotizacion"); await click(page,form.locator(".dropdown-menu button",{hasText:/Guardar y marcar como enviado/}).first(),"Guardar y enviar cotización"); await page.waitForTimeout(1500);
}
async function order(page) {
  const row=page.locator("table tbody tr",{hasText:data.prospect}).first();
  if(!await row.waitFor({state:"visible",timeout:15000}).then(()=>true).catch(()=>false)){
    const url=page.url();
    const formVisible=await page.locator("[data-testid=quote-form-card]").isVisible().catch(()=>false);
    const errs=await page.locator(".alert-danger,.text-danger").allInnerTexts().catch(()=>[]);
    const rows=await page.locator("table tbody tr").allInnerTexts().catch(()=>[]);
    throw new Error(`No aparece la cotización creada. URL: ${url} | Formulario visible: ${formVisible} | Errores: ${JSON.stringify(errs.slice(0,3))} | Filas: ${JSON.stringify(rows.slice(0,5))}`);
  }
  await click(page,row.locator("button",{hasText:/Cargar OC/}).first(),"Cargar OC"); const m=page.locator(".modal-content",{hasText:"Cargar OC"}).first();
  const ocInput=m.locator("input[placeholder='Ejemplo: OC-2026-00158']");
  await ocInput.fill(data.oc); await snap("4a-modal-oc");
  if((await ocInput.inputValue().catch(()=>""))!==data.oc){ await ocInput.click(); await ocInput.pressSequentially(data.oc,{delay:20}); }
  await m.locator("input[type=date]").fill("2026-10-28"); await m.locator("input[type=file]").setInputFiles({name:"oc-ui.pdf",mimeType:"application/pdf",buffer:Buffer.from("%PDF-1.4\n%%EOF")});
  await click(page,m.locator("button",{hasText:/Guardar OC y pasar/}),"Guardar OC");
  await page.waitForTimeout(1500);
  const ocError=m.locator(".alert-danger");
  if(await ocError.isVisible().catch(()=>false)) throw new Error(`Error al cargar la OC: ${await ocError.innerText()}`);
  if(await m.isVisible().catch(()=>false)) throw new Error("El modal de OC no se cerró tras guardar: la OC no quedó registrada");
}
async function ensureInventoryReference(page) {
  await page.goto(`${base}/app/inventory-stock`,{waitUntil:"domcontentloaded"});
  const tab=page.locator(".nav-link",{hasText:"Alta de ficha nueva"});
  if(await tab.isVisible().catch(()=>false)) await click(page,tab,"Tab Alta de ficha nueva");
  const field=async(label,value)=>{const l=page.locator("label.form-label").filter({hasText:new RegExp(`^\\s*${label}`)}).first(); await l.locator("xpath=following-sibling::input").first().fill(value);};
  await field("Referencia","CAP-DC-LINK-470UF");
  await field("Designacion","Capacitor DC-Link 470uF 1200V");
  await field("Familia","Capacitores");
  await field("Marca","EPCOS");
  await click(page,page.locator("button",{hasText:"Crear ficha"}),"Crear ficha de inventario");
  await page.waitForTimeout(1200); await snap("5a-ficha-inventario");
}
async function partsAndPurchases(page) {
  await ensureInventoryReference(page);
  let d=await openCard(page);
  await moveAndSave(page,d,"Pedir componentes");
  d=await openCard(page);
  await click(page,d.locator(".nav-link",{hasText:"Materiales"}),"Tab Materiales"); await snap("5b-tab-materiales");
  const pf=label=>d.locator("label.project-detail-field").filter({hasText:label}).first();
  await pf("Referencia del componente").locator("input").fill("CAP-DC-LINK-470UF");
  await pf("Cantidad").locator("input").fill("2");
  await pf("Descripcion").locator("input").fill("Capacitor DC-Link para placa base industrial");
  await pf("Proveedor sugerido").locator("input").fill("DigiKey");
  await pf("Costo estimado").locator("input").fill("350000");
  await pf("Plazo entrega").locator("input").fill("3");
  await pf("Memo tecnico").locator("textarea").fill("Componente para la reparación aprobada de la placa base.");
  await click(page,d.locator("button",{hasText:"Enviar solicitud de compra"}),"Enviar solicitud de compra");
  await page.waitForTimeout(1200); await snap("5c-solicitud-enviada");
  await page.goto(`${base}/app/inventory-orders`,{waitUntil:"domcontentloaded"});
  const req=page.locator("[data-testid=purchase-request-row]",{hasText:"CAP-DC-LINK-470UF"}).first();
  await visible(req,"No aparece la solicitud de compra para aprobar");
  await click(page,req.locator("[data-testid=approve-purchase-request]"),"Aprobar solicitud de compra");
  await page.waitForTimeout(1200); await snap("5d-solicitud-aprobada");
  await click(page,page.locator("button",{hasText:"Generar lineas de compra"}),"Generar lineas de compra");
  await page.waitForTimeout(1500); await snap("5e-lineas-compra");
  const line=page.locator("[data-testid=purchase-line-row]",{hasText:"CAP-DC-LINK-470UF"}).first();
  await visible(line,"No aparece la línea de compra");
  await click(page,line.locator("button",{hasText:/^\s*Enviar/}).first(),"Enviar orden al proveedor");
  await page.waitForTimeout(1000);
  const qtyInput=line.locator("input[placeholder='Cant.']");
  await qtyInput.fill((await qtyInput.getAttribute("max"))||"1");
  await click(page,line.locator("[data-testid=receive-purchase-line]"),"Registrar llegada del componente");
  await page.waitForTimeout(1000); await snap("5f-componente-recibido");
}
async function repairAndClose(page) {
  let d=await openCard(page);
  await moveAndSave(page,d,"Esperando proveedor");
  d=await openCard(page);
  await moveAndSave(page,d,"Reparacion");
  d=await openCard(page); await snap("6a-ficha-reparacion");
  await d.locator("textarea[placeholder*='Acciones de reparacion']").fill("Cambio de capacitor DC-Link y prueba funcional de la placa base.");
  const pf=label=>d.locator("label.project-detail-field").filter({hasText:label}).first();
  await pf("Horas reales acumuladas").locator("input").fill("8");
  await pf("Prueba de cierre").locator("select").selectOption("banco-pruebas",{force:true});
  await click(page,d.getByRole("button",{name:"Guardar cambios"}),"Guardar cambios");
  await page.waitForTimeout(800);
  d=await openCard(page);
  await click(page,d.locator("[data-testid=finish-tests-btn]"),"Validar cierre y marcar listo");
  await visible(d.locator(".project-detail-dialog__feedback.text-success"),"No se validó el cierre del proyecto"); await snap("6b-cierre-validado");
}
async function toInvoice(page) {
  await page.goto(`${base}/app/crm-cotizaciones`,{waitUntil:"domcontentloaded"});
  const row=page.locator("table tbody tr",{hasText:data.prospect}).first();
  await visible(row,"No aparece la cotización aprobada"); await snap("7a-cotizacion-aprobada");
  await click(page,row.locator("[data-testid=convert-to-invoice-btn]"),"Convertir en factura");
  const ok=page.locator("[data-testid=quote-conversion-success]");
  await visible(ok,"La cotización no se convirtió en factura");
  const m=(await ok.innerText().catch(()=>"")).match(/FAC-[0-9A-Z-]+/i);
  data.invoice=m?m[0]:"";
}
async function emitInvoice(page) {
  await page.goto(`${base}/app/finance-facturacion`,{waitUntil:"domcontentloaded"});
  const row=page.locator("table tbody tr",{hasText:data.company}).first();
  await visible(row,"La factura convertida no aparece en facturación");
  data.invoice=((await row.locator("td").first().innerText().catch(()=>""))||"").trim()||data.invoice;
  await click(page,row.locator("button[data-bs-toggle=dropdown]").first(),"Acciones de la factura"); await snap("7b-menu-acciones-factura");
  await click(page,row.locator("[data-testid=edit-invoice-action]"),"Editar factura borrador");
  await page.waitForURL(/\/editar\//,{timeout:30000}); await snap("7c-editor-factura");
  await click(page,page.getByRole("button",{name:"Guardar cambios"}),"Guardar cambios y emitir factura");
  await page.waitForTimeout(1500);
  await page.goto(`${base}/app/finance-facturacion`,{waitUntil:"domcontentloaded"});
  const row2=page.locator("table tbody tr",{hasText:data.company}).first();
  await visible(row2,"La factura no aparece tras emitirla");
  if((await row2.innerText()).includes("Borrador")) throw new Error("La factura sigue en Borrador tras guardar los cambios");
  await snap("7d-factura-emitida");
}
async function payInvoice(page) {
  await page.goto(`${base}/app/finance-pagos`,{waitUntil:"domcontentloaded"});
  await click(page,page.getByRole("button",{name:"Agregar pago"}).first(),"Agregar pago"); await snap("8a-formulario-pago");
  const sel=page.locator("select[name=invoiceNumber]");
  const opts=await sel.locator("option").evaluateAll(os=>os.map((o,i)=>({i,text:o.textContent||"",value:o.value,disabled:o.disabled})));
  let pick=opts.find(o=>!o.disabled && data.invoice && o.text.includes(data.invoice));
  if(!pick) pick=opts.find(o=>!o.disabled && (o.value||"").trim()!=="");
  if(!pick) throw new Error(`No hay facturas seleccionables en el formulario de pago. Opciones: ${JSON.stringify(opts)}`);
  await sel.selectOption({index:pick.i},{force:true});
  await page.locator("input[name=paidAt]").fill("2026-10-28");
  await page.locator("input[name=amount]").fill("10000000");
  await click(page,page.locator("button[type=submit]",{hasText:"Guardar"}),"Guardar pago");
  await page.waitForTimeout(1500); await snap("8b-pago-registrado");
}
async function remitAndDeliver(page) {
  await page.goto(`${base}/app/remissions`,{waitUntil:"domcontentloaded"});
  const panel=page.locator("[data-testid=ready-for-delivery-panel]");
  await visible(panel,"No aparece el panel de proyectos listos para entrega");
  const entry=panel.locator("div.d-flex",{hasText:data.serie}).first();
  await visible(entry,"El proyecto listo para entrega no aparece en el panel de remisiones"); await snap("9a-panel-listos-entrega");
  const gateBlocked=entry.locator("[data-testid=complete-gate-blocked]");
  if(await gateBlocked.isVisible().catch(()=>false)) throw new Error(`Remisión bloqueada: ${await gateBlocked.innerText()}`);
  await click(page,entry.locator("[data-testid=complete-project-btn]"),"Completar remisión desde el proyecto");
  await page.waitForTimeout(1000); await snap("9b-formulario-precargado");
  const clientValue=((await page.locator("[data-testid=remission-client]").inputValue().catch(()=>""))||"").trim();
  if(!clientValue) throw new Error("El formulario de remisión no precargó el cliente desde el snapshot del proyecto");
  const poValue=((await page.locator("[data-testid=purchase-order-input]").inputValue().catch(()=>""))||"").trim();
  if(poValue!==data.oc) throw new Error(`La OC no viajó al formulario de remisión: "${poValue}" != "${data.oc}"`);
  const identValue=((await page.locator("input[placeholder='Identificador']").first().inputValue().catch(()=>""))||"").trim();
  if(!identValue.includes(data.serie)) throw new Error(`El equipo no precargó en la remisión: "${identValue}"`);
  await page.locator("[data-testid=remission-contact-name]").fill("Ana Cliente");
  if(!((await page.locator("[data-testid=dispatch-type-select]").inputValue().catch(()=>""))||"").trim()) await page.locator("[data-testid=dispatch-type-select]").selectOption("contra-entrega");
  await page.locator("[data-testid=carrier-name-input]").fill("Servientrega");
  await page.locator("[data-testid=guide-number-input]").fill(`GUIA-${stamp}`);
  await page.locator("[data-testid=dispatch-photos-input]").setInputFiles({name:"despacho.png",mimeType:"image/png",buffer:png()});
  const anchored=page.locator("[data-testid=anchored-accepted-check]");
  if(await anchored.isVisible().catch(()=>false) && !await anchored.isChecked()) await anchored.check();
  const fillIfEmpty=async(placeholder,value)=>{const i=page.locator(`input[placeholder='${placeholder}']`).first(); if(!((await i.inputValue().catch(()=>""))||"").trim()) await i.fill(value);};
  await fillIfEmpty("Descripcion","Placa base industrial reparada y probada");
  await fillIfEmpty("Precio","10000000");
  await fillIfEmpty("Cant","1");
  const warranty=page.locator("[data-testid=warranty-select]").first();
  const warrantyLabel=(await warranty.locator("option:checked").innerText().catch(()=>""))||"";
  if(/Sin garant/i.test(warrantyLabel)) await warranty.selectOption({label:"3 meses"},{force:true});
  await click(page,page.locator("[data-testid=print-purchase-order-btn] ~ button",{hasText:"Guardar"}),"Guardar remisión");
  await page.waitForTimeout(1500);
  const saveBlock=page.locator("[data-testid=remission-save-block]");
  if(await saveBlock.isVisible().catch(()=>false)) throw new Error(`La remisión no se pudo guardar: ${await saveBlock.innerText()}`);
  await snap("9c-remision-guardada");
  const row=page.locator("table tbody tr",{hasText:data.company}).first();
  await visible(row,"No aparece la remisión creada");
  await click(page,row.locator("[data-testid=link-invoice-btn]"),"Vincular factura al despacho");
  const modal=page.locator("[data-testid=invoice-linker-modal]").first();
  await visible(modal,"No abrió el vinculador de facturas"); await snap("9d-vincular-factura");
  await click(page,modal.locator("[data-testid=invoice-option]").first(),"Seleccionar factura vinculada");
  await click(page,modal.locator("[data-testid=confirm-link-invoice-btn]"),"Confirmar vínculo de factura");
  await visible(row.locator("[data-testid=payment-cleared]"),"El pago no quedó confirmado para la remisión"); await snap("9e-pago-confirmado");
  await click(page,row.locator("[data-testid=mark-delivered-btn]"),"Marcar entregado");
  const confirm=page.locator("[data-testid=delivery-confirm-modal]").first();
  if(await confirm.isVisible().catch(()=>false)){ await snap("9f-modal-entrega");
    const acc=confirm.locator("[data-testid=accessories-delivered-check]");
    if(await acc.isVisible().catch(()=>false) && !await acc.isChecked()) await acc.check();
    await click(page,confirm.locator("[data-testid=confirm-delivered-btn]"),"Confirmar entrega");
  }
  await page.waitForTimeout(1200);
  await visible(row.locator("[data-testid=delivery-status-badge]",{hasText:"entregado"}),"La remisión no quedó en estado entregado");
}
let browser; let page; try { browser=await chromium.launch({headless,slowMo:0}); page=await (await browser.newContext({viewport:{width:1600,height:950}})).newPage(); page.on("dialog",d=>void d.accept()); currentPage=page;
  console.log("UI_ONLY login"); await login(page); await snap("1-login");
  console.log("UI_ONLY reception"); await reception(page); await snap("2-recepcion");
  console.log("UI_ONLY diagnosis and quote"); await diagnoseAndQuote(page); await snap("3-cotizacion");
  console.log("UI_ONLY order"); await order(page); await snap("4-oc");
  console.log("UI_ONLY parts and purchases"); await partsAndPurchases(page); await snap("5-repuestos");
  console.log("UI_ONLY repair close"); await repairAndClose(page); await snap("6-cierre");
  console.log("UI_ONLY invoice"); await toInvoice(page); await snap("7-factura");
  console.log("UI_ONLY emit invoice"); await emitInvoice(page);
  console.log("UI_ONLY payment"); await payInvoice(page); await snap("8-pago");
  console.log("UI_ONLY remission"); await remitAndDeliver(page); await snap("9-remision");
  console.log(`UI_ONLY_SUCCESS ${JSON.stringify(data)}`); } catch(e) { if(page) await page.screenshot({path:`playwright-artifacts/ui-journey-${stamp}-FAILURE.png`,fullPage:true}).catch(()=>{}); console.error(`UI_ONLY_FAILURE ${e.stack||e}`); process.exitCode=1; } finally { if(browser) await browser.close(); }
