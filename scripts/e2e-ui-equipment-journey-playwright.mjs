/** UI-only journey: no business endpoint is called by this runner. */
import { chromium } from "playwright";
import fs from "node:fs/promises";
import { png, makeUtils } from "./ui-journey-helpers.mjs";
import { makeStages } from "./ui-journey-stages.mjs";

const base = (process.env.PW_BASE_URL || "http://127.0.0.1:4200").replace(/\/+$/, "");
const headless = !["false", "0", "no"].includes((process.env.PW_HEADLESS || "false").toLowerCase());
const pause = Number(process.env.PW_SLOW_MO_MS || "300");
const stamp = Date.now();
const data = { prospect: `UI Cliente ${stamp}`, email: `ui.${stamp}@prueba.local`, company: `UI Industria ${stamp}`, nit: `900${String(stamp).slice(-7)}-7`, serviceType: "Reparación", serie: `UI-MB-10M-${stamp}`, oc: `OC-UI-${stamp}` };
const utils = makeUtils({ base, pause, data });
const { visible, click, fillFocus, selectFocus, awaitSelectReady, attachFocus, openCard, ensureBoardFullView, awaitEquipmentDialogSettled, moveAndSave } = utils;

let currentPage=null;
const snap=s=>{ if(!currentPage) return Promise.resolve(); return currentPage.screenshot({path:`playwright-artifacts/ui-journey-${stamp}-${s}.png`,fullPage:true}).catch(()=>{}); };
const stages = makeStages({ base, pause, data, stamp, snap, utils });

async function expectDownload(page, button, label, namePattern, snapName) {
  const [download]=await Promise.all([page.waitForEvent("download",{timeout:30000}),click(page,button,label)]);
  const name=download.suggestedFilename();
  if(!namePattern.test(name)) throw new Error(`La descarga "${label}" generó el archivo "${name}", se esperaba ${namePattern}`);
  const tmp=await download.path().catch(()=>null);
  const size=tmp?(await fs.stat(tmp)).size:0;
  if(size<=0) throw new Error(`La descarga "${label}" quedó vacía (${name})`);
  console.log(`UI_ONLY_DOWNLOAD ${label} -> ${name} (${size} bytes)`);
  await snap(snapName);
  return name;
}
async function login(page) {
  await page.goto(`${base}/auth/signin`,{waitUntil:"domcontentloaded"}); await fillFocus(page,page.locator("#emailadd"),process.env.PW_USER_EMAIL||"admin@alfa.com"); await fillFocus(page,page.locator("#passwd"),process.env.PW_USER_PASSWORD||"1234");
  await click(page,page.getByRole("button",{name:"Login"}),"Login"); await page.waitForURL(/\/app\//,{timeout:30000});
}
async function verifyReceptionAssignmentRoute(page) {
  await page.goto(`${base}/app/work-equipment-reception`,{waitUntil:"domcontentloaded"});
  const equipmentLink=page.locator(".equipment-preview .btn").first();
  await visible(equipmentLink,"La columna Equipos no muestra el enlace del equipo");
  const equipmentTextStyle=await equipmentLink.evaluate((element) => ({
    whiteSpace: getComputedStyle(element).whiteSpace,
    overflowWrap: getComputedStyle(element).overflowWrap,
  }));
  if(equipmentTextStyle.whiteSpace !== "normal" || !["anywhere","break-word"].includes(equipmentTextStyle.overflowWrap)) {
    throw new Error(`La columna Equipos aún no permite saltos de línea: ${JSON.stringify(equipmentTextStyle)}`);
  }
  const assign=page.getByRole("button",{name:/Asignar técnico/i}).first();
  await visible(assign,"La bandeja de recepción no expone la acción Asignar técnico");
  await click(page,assign,"Ir a carga laboral para asignar técnico");
  await page.waitForURL(/\/app\/work-workload/,{timeout:30000});
  if(await page.locator(".modal-content",{hasText:/Asignar técnico/i}).count()) throw new Error("Asignar técnico abrió el modal retirado en vez de dirigir a Carga laboral");
  await visible(page.getByText(/Carga laboral|Carga estimada/i).first(),"La vista de Carga laboral no quedó disponible para asignar el técnico");
  await snap("2a-asignacion-dirige-carga-laboral");
}
async function diagnoseAndQuote(page) {
  await page.goto(`${base}/app/work-projects`,{waitUntil:"domcontentloaded"}); await ensureBoardFullView(page); let card=page.locator(".project-card",{hasText:data.serie}).first();
  if(!await card.waitFor({state:"visible",timeout:20000}).then(()=>true).catch(()=>false)){
    await page.waitForTimeout(8000); card=page.locator(".project-card",{hasText:data.serie}).first();
  }
  if(!await card.waitFor({state:"visible",timeout:5000}).then(()=>true).catch(()=>false)){
    const cols=await page.locator("[data-testid^=column-header-]").allInnerTexts().catch(()=>[]);
    const cards=await page.locator(".project-card,.project-drag-item").allInnerTexts().catch(()=>[]);
    throw new Error(`La tarjeta del proyecto no aparece. Columnas: ${JSON.stringify(cols)} | Tarjetas: ${JSON.stringify(cards.slice(0,5))}`);
  }
  const diagnosticCard=page.locator("[data-column-id=diagnostico] .project-card",{hasText:data.serie}).first();
  if(await diagnosticCard.isVisible().catch(()=>false)) {
    await click(page,diagnosticCard,"Caso asignado en diagnóstico");
  } else {
    await click(page,card,"Proyecto recibido"); const receivedDialog=page.locator(".project-detail-dialog").first();
    await click(page,receivedDialog.locator("button.status-chip",{hasText:"Diagnostico"}).first(),"Mover a diagnóstico"); await click(page,receivedDialog.getByRole("button",{name:"Guardar cambios"}),"Guardar diagnóstico"); await page.waitForTimeout(800); await page.goto(`${base}/app/work-projects`,{waitUntil:"domcontentloaded"}); await ensureBoardFullView(page); await click(page,page.locator("[data-column-id=diagnostico] .project-card",{hasText:data.serie}).first(),"Caso en diagnóstico");
  }
  const d=page.locator(".project-detail-dialog").first();
  for(const x of ["Equipo desarmado","Prueba estatica realizada","Prueba de encendido realizada","Falla identificada"]){const l=d.locator("label.project-switch",{hasText:x}).first(); if(!await l.locator("input").isChecked()) await click(page,l,x);}
  const fields=d.locator(".project-detail-field"); await fillFocus(page,fields.filter({hasText:"Memo diagnostico"}).locator("textarea,input"),"Diagnóstico de placa principal; reparación viable."); await fillFocus(page,fields.filter({hasText:"Horas hombre estimadas"}).locator("input"),"8"); await fillFocus(page,fields.filter({hasText:"Presupuesto repuestos"}).locator("input"),"10000000");
  await click(page,d.getByRole("button",{name:/Cerrar diagnóstico/}),"Cerrar diagnóstico"); await page.waitForTimeout(1000); await click(page,d.getByRole("button",{name:/Crear cotización con diagnóstico/}),"Crear cotización con diagnóstico"); await page.waitForURL(/crm-cotizaciones/,{timeout:30000});
  const form=page.locator("[data-testid=quote-form-card]"); await visible(form,"No llegó la cotización precargada"); await visible(form.getByText(`Servicio: ${data.serviceType}`,{exact:true}),"El servicio no llegó desde recepción a cotización");
  if(!await form.getByText("Empresa",{exact:true}).isVisible().catch(()=>false)) throw new Error("La cotización no muestra el campo Empresa");
  const companyValue=await form.locator("select").first().inputValue().catch(()=>"");
  if(!companyValue) throw new Error("La cotización no quedó vinculada a una empresa de la recepción");
  const equipment=form.locator("label.form-check",{hasText:data.serie}).first();
  if(!await equipment.locator("input[type=checkbox]").isChecked()) await click(page,equipment,"Seleccionar equipo en cotización");
  const row=form.locator("table tbody tr").first();
  const lineServiceSelect=row.locator("td").first().locator("select").first();
  // El catálogo de servicios puede no incluir el servicio de recepción
  // ("Reparación"): como un usuario real, se elige si existe o la primera opción.
  const lineServiceOptions=(await lineServiceSelect.locator("option").allInnerTexts()).map(o=>o.trim()).filter(Boolean);
  if(!lineServiceOptions.length) throw new Error("El select de servicio de la línea de cotización no tiene opciones disponibles");
  const lineService=lineServiceOptions.find(o=>o.toLowerCase().includes(data.serviceType.toLowerCase()))??lineServiceOptions[0];
  await selectFocus(page,lineServiceSelect,{label:lineService},{force:true});
  await fillFocus(page,row.locator("td").nth(2).locator("input[type=number]").first(),"10000000");
  await fillFocus(page,form.locator("textarea").nth(0),"Reparación aprobada de placa base."); await fillFocus(page,form.locator("textarea").nth(1),"Vigencia 15 días.");
  await click(page,form.locator("button.dropdown-toggle").first(),"Opciones de guardado"); await snap("3a-menu-guardado-cotizacion"); await click(page,form.locator(".dropdown-menu button",{hasText:/Guardar y marcar como enviado/}).first(),"Guardar y enviar cotización"); await page.waitForTimeout(1500);
}
async function order(page) {
  // La tabla de cotizaciones muestra la empresa (row.empresa), no el nombre del prospecto.
  const row=page.locator("table tbody tr",{hasText:data.company}).first();
  if(!await row.waitFor({state:"visible",timeout:15000}).then(()=>true).catch(()=>false)){
    const url=page.url();
    const formVisible=await page.locator("[data-testid=quote-form-card]").isVisible().catch(()=>false);
    const errs=await page.locator(".alert-danger,.text-danger").allInnerTexts().catch(()=>[]);
    const rows=await page.locator("table tbody tr").allInnerTexts().catch(()=>[]);
    throw new Error(`No aparece la cotización creada. URL: ${url} | Formulario visible: ${formVisible} | Errores: ${JSON.stringify(errs.slice(0,3))} | Filas: ${JSON.stringify(rows.slice(0,5))}`);
  }
  await click(page,row.locator("button",{hasText:/Cargar OC/}).first(),"Cargar OC"); const m=page.locator(".modal-content",{hasText:"Cargar OC"}).first();
  const ocInput=m.locator("input[placeholder='Ejemplo: OC-2026-00158']");
  await fillFocus(page,ocInput,data.oc); await snap("4a-modal-oc");
  if((await ocInput.inputValue().catch(()=>""))!==data.oc){ await ocInput.click(); await ocInput.pressSequentially(data.oc,{delay:20}); }
  await fillFocus(page,m.locator("input[type=date]"),"2026-10-28"); await attachFocus(page,m.locator("input[type=file]"),{name:"oc-ui.pdf",mimeType:"application/pdf",buffer:Buffer.from("%PDF-1.4\n%%EOF")});
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
  const field=async(label,value)=>{const l=page.locator("label.form-label").filter({hasText:new RegExp(`^\\s*${label}`)}).first(); await fillFocus(page,l.locator("xpath=following-sibling::input").first(),value);};
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
  await fillFocus(page,pf("Referencia del componente").locator("input"),"CAP-DC-LINK-470UF");
  await fillFocus(page,pf("Cantidad").locator("input"),"2");
  await fillFocus(page,pf("Descripcion").locator("input"),"Capacitor DC-Link para placa base industrial");
  await fillFocus(page,pf("Proveedor sugerido").locator("input"),"DigiKey");
  await fillFocus(page,pf("Costo estimado").locator("input"),"350000");
  await fillFocus(page,pf("Plazo entrega").locator("input"),"3");
  await fillFocus(page,pf("Memo tecnico").locator("textarea"),"Componente para la reparación aprobada de la placa base.");
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
  await expectDownload(page,page.locator("[data-testid=download-purchase-lines-excel]"),"Descargar Excel de repuestos",/\.xlsx$/i,"5g-excel-repuestos");
  await expectDownload(page,page.locator("[data-testid=download-purchase-lines-bom]"),"BOM proveedor (2 columnas)",/^BOM.*\.xlsx$/i,"5h-bom-proveedor");
  await click(page,line.locator("button",{hasText:/^\s*Enviar/}).first(),"Enviar orden al proveedor");
  await page.waitForTimeout(1000);
  const qtyInput=line.locator("input[placeholder='Cant.']");
  await fillFocus(page,qtyInput,(await qtyInput.getAttribute("max"))||"1");
  await click(page,line.locator("[data-testid=receive-purchase-line]"),"Registrar llegada del componente");
  await page.waitForTimeout(1000); await snap("5f-componente-recibido");
}
async function repairAndClose(page) {
  let d=await openCard(page);
  const locationSelect=d.getByTestId("equipment-location-select");
  // El <select> nativo puede quedar oculto tras el widget Choices: esperar el
  // control real visible, como lo haría un usuario ante el desplegable.
  await awaitSelectReady(page,locationSelect,"No aparece el selector de ubicación del equipo");
  // Tras el goto completo el catálogo llega asíncrono por API: espera estado estable
  // (ubicación resuelta) antes de interactuar, como lo haría un usuario real.
  await awaitEquipmentDialogSettled(page);
  const equipmentError=d.locator(".alert-danger",{hasText:/ya no existe en recepcion|No se pudo cargar el catalogo/}).first();
  if(await equipmentError.isVisible().catch(()=>false)) throw new Error(`La app reporta error al vincular el equipo: ${await equipmentError.innerText()}`);
  const locationOptions=await locationSelect.locator("option").evaluateAll(options=>options.map(option=>({value:option.value,label:(option.textContent||"").trim()})).filter(option=>Boolean(option.value)));
  if(!locationOptions.length) throw new Error("El selector de ubicación no tiene opciones disponibles");
  const targetLocation=locationOptions.at(-1);
  await selectFocus(page,locationSelect,{value:targetLocation.value,label:targetLocation.label},{force:true});
  await click(page,d.getByTestId("equipment-update-location-btn"),"Actualizar ubicación");
  await visible(d.locator(".alert-success",{hasText:/Estado actualizado/}),"Actualizar ubicación no produjo confirmación visible");
  const updatedLocation=await locationSelect.inputValue();
  await click(page,d.locator("button.project-detail-dialog__close").first(),"Cerrar detalle para verificar ubicación");
  d=await openCard(page);
  // El reload completo vuelve a cargar el catálogo por API: espera el estado real
  // del diálogo (ubicación resuelta o error visible) antes de asertar persistencia.
  await awaitEquipmentDialogSettled(page);
  const reopenedError=d.locator(".alert-danger",{hasText:/ya no existe en recepcion|No se pudo cargar el catalogo/}).first();
  if(await reopenedError.isVisible().catch(()=>false)) throw new Error(`Al reabrir la ficha la app reporta: ${await reopenedError.innerText()}`);
  const reopenedValue=await d.getByTestId("equipment-location-select").inputValue();
  if(reopenedValue!==updatedLocation) throw new Error(`La ubicación del equipo no persistió al reabrir la ficha (esperado "${updatedLocation}", actual "${reopenedValue}")`);
  await moveAndSave(page,d,"Esperando proveedor");
  d=await openCard(page);
  // La llegada de componentes ya se registró en la etapa 5 (receive-purchase-line, cantidad=max),
  // así que el gate de materiales está abierto. La app actual no tiene el flujo inline
  // "Registrar llegada → Guardar cambios": la transición a reparación es por chip de estado,
  // con confirmación modal si hay reglas activas — mismo mecanismo que Esperando proveedor.
  await moveAndSave(page,d,"Reparacion");
  d=await openCard(page); await snap("6a-ficha-reparacion");
  if(await d.locator("textarea[placeholder*='Memo diagnostico']").count()) throw new Error("El memo diagnóstico sigue editable durante reparación");
  await visible(d.getByText("Diagnóstico de placa principal; reparación viable.",{exact:false}),"El memo diagnóstico no quedó visible como historial durante reparación");
  const sessionTimer=d.getByTestId("equipment-session-timer");
  const accumulatedTimer=d.getByTestId("equipment-accumulated-repair-time");
  await visible(sessionTimer,"No aparece el contador de reparación de la sesión");
  await visible(accumulatedTimer,"No aparece el tiempo acumulado de reparación");
  const parseTime=text=>{const values=String(text).match(/(\d{2}):(\d{2})(?::(\d{2}))?/)?.slice(1).map(Number); return values ? values[0]*3600+values[1]*60+(values[2]||0) : -1;};
  const sessionBefore=parseTime(await sessionTimer.innerText());
  const accumulatedBefore=parseTime(await accumulatedTimer.innerText());
  await page.waitForTimeout(2200);
  const sessionAfter=parseTime(await sessionTimer.innerText());
  const accumulatedAfter=parseTime(await accumulatedTimer.innerText());
  if(sessionAfter <= sessionBefore || accumulatedAfter <= accumulatedBefore) throw new Error(`El contador no avanzó (sesión ${sessionBefore}->${sessionAfter}, acumulado ${accumulatedBefore}->${accumulatedAfter})`);
  if(await d.locator("label.project-detail-field",{hasText:"Horas reales acumuladas"}).count()) throw new Error("Las horas reales siguen expuestas como un campo editable");
  await snap("6a-contador-reparacion-activo");
  await fillFocus(page,d.locator("textarea[placeholder*='Acciones de reparacion']"),"Cambio de capacitor DC-Link y prueba funcional de la placa base.");
  const pf=label=>d.locator("label.project-detail-field").filter({hasText:label}).first();
  // El <option [value]="banco-pruebas"> muestra la etiqueta "Banco de pruebas":
  // seleccionar por label visible funciona tanto con Choices.js como con el select nativo.
  await selectFocus(page,pf("Prueba de cierre").locator("select"),{label:"Banco de pruebas"},{force:true});
  await click(page,d.getByRole("button",{name:"Guardar cambios"}),"Guardar cambios");
  await page.waitForTimeout(800);
  d=await openCard(page);
  await click(page,d.locator("[data-testid=finish-tests-btn]"),"Validar cierre y marcar listo");
  await visible(d.locator(".project-detail-dialog__feedback.text-success"),"No se validó el cierre del proyecto"); await snap("6b-cierre-validado");
}
async function toInvoice(page) {
  await page.goto(`${base}/app/crm-cotizaciones`,{waitUntil:"domcontentloaded"});
  // La fila de cotización conserva la empresa del prospecto (nombre=compania).
  const row=page.locator("table tbody tr",{hasText:data.company}).first();
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
  await selectFocus(page,sel,{index:pick.i},{force:true});
  await fillFocus(page,page.locator("input[name=paidAt]"),"2026-10-28");
  await fillFocus(page,page.locator("input[name=amount]"),"10000000");
  await click(page,page.locator("button[type=submit]",{hasText:"Guardar"}),"Guardar pago");
  await page.waitForTimeout(1500); await snap("8b-pago-registrado");
}
let browser; let page; try { browser=await chromium.launch({headless,slowMo:0}); page=await (await browser.newContext({viewport:{width:1600,height:950}})).newPage(); page.on("dialog",d=>void d.accept()); currentPage=page;
  console.log("UI_ONLY login"); await login(page); await snap("1-login");
  console.log("UI_ONLY catálogo de recepción"); await stages.ensureReceptionCatalog(page); await snap("1b-catalogo-recepcion");
  console.log("UI_ONLY reception"); await stages.reception(page); await snap("2-recepcion");
  console.log("UI_ONLY ruta de asignación a carga laboral"); await verifyReceptionAssignmentRoute(page);
  console.log("UI_ONLY commercial action"); await stages.commercialAction(page);
  console.log("UI_ONLY account relations"); await stages.completeAccountRelations(page);
  console.log("UI_ONLY prospect tabs"); await stages.verifyProspectTabs(page);
  console.log("UI_ONLY diagnosis and quote"); await diagnoseAndQuote(page); await snap("3-cotizacion");
  console.log("UI_ONLY order"); await order(page); await snap("4-oc");
  console.log("UI_ONLY parts and purchases"); await partsAndPurchases(page); await snap("5-repuestos");
  console.log("UI_ONLY repair close"); await repairAndClose(page); await snap("6-cierre");
  console.log("UI_ONLY promote to client"); await stages.promoteToClient(page); await snap("10-cliente");
  console.log("UI_ONLY invoice"); await toInvoice(page); await snap("7-factura");
  console.log("UI_ONLY emit invoice"); await emitInvoice(page);
  console.log("UI_ONLY payment"); await payInvoice(page); await snap("8-pago");
  console.log("UI_ONLY remission"); await stages.remitAndDeliver(page); await snap("9-remision");
  console.log(`UI_ONLY_SUCCESS ${JSON.stringify(data)}`); } catch(e) { if(page) await page.screenshot({path:`playwright-artifacts/ui-journey-${stamp}-FAILURE.png`,fullPage:true}).catch(()=>{}); await fs.writeFile(`playwright-artifacts/ui-journey-${stamp}-FAILURE.txt`,String(e.stack||e)).catch(()=>{}); console.error(`UI_ONLY_FAILURE ${e.stack||e}`); process.exitCode=1; } finally { if(browser) await browser.close(); }
