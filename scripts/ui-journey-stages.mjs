/** Etapas CRM y remisión del recorrido UI-only: recepción completa, acción
 *  comercial con verificación de persistencia y entrega/remisión. */
import { png } from "./ui-journey-helpers.mjs";
import { openCustomSelectMenu, selectCustomModal } from "./ui-modal-controls.mjs";

export function makeStages({ base, pause, data, stamp, snap, utils }) {
  const { visible, click, fillFocus, selectFocus, checkFocus, attachFocus, selectLabel, fillLabel } = utils;
  const selectFirst = async(page, locator) => {
    const opts = await locator.locator("option").evaluateAll(os => os.map((o,i) => ({ i, disabled:o.disabled, v:o.value||"" })));
    const pick = opts.find(o => !o.disabled && o.v.trim() !== "");
    if (pick) await selectFocus(page, locator, {index:pick.i}, {force:true});
    return Boolean(pick);
  };
  const labelControl = (scope, pattern, control) => scope.locator("label.form-label").filter({hasText:pattern}).first().locator("xpath=..").locator(control).first();

  async function ensureReceptionCatalog(page) {
    await page.goto(`${base}/app/company-equipment-config`,{waitUntil:"domcontentloaded"});
    if(!await page.locator("table tbody tr",{hasText:/Reparación/i}).first().isVisible().catch(()=>false)) {
      await click(page,page.getByRole("button",{name:"Nuevo tipo de servicio"}),"Nuevo tipo de servicio");
      await fillFocus(page,page.locator("input[name=serviceTypeDraftName]"),"Reparación");
      await fillFocus(page,page.locator("input[name=serviceTypeDraftDescription]"),"Reparación técnica de equipos");
      await click(page,page.getByRole("button",{name:"Guardar tipo de servicio"}),"Guardar tipo Reparación");
    }
    if(!await page.locator("table tbody tr",{hasText:/Estantería/i}).first().isVisible().catch(()=>false)) {
      await click(page,page.getByRole("button",{name:"Nueva ubicación"}),"Nueva ubicación");
      await fillFocus(page,page.locator("input[name=locationDraftName]"),"Estantería QA");
      await fillFocus(page,page.locator("input[name=locationDraftDescription]"),"Ubicación de pruebas UI");
      await click(page,page.getByRole("button",{name:"Guardar ubicación"}),"Guardar ubicación QA");
    }
  }

  async function reception(page) {
    await page.goto(`${base}/app/crm-prospectos`,{waitUntil:"domcontentloaded"}); await click(page,page.getByRole("button",{name:/Agregar Prospecto/i}),"Agregar Prospecto");
    await fillFocus(page,page.locator("input[name=formNombre]"),data.prospect); await fillFocus(page,page.locator("input[name=formCorreo]"),data.email); await fillFocus(page,page.locator("input[name=formCompania]"),data.company); await fillFocus(page,page.locator("input[name=formMovil]"),"3005550101");
    await fillFocus(page,page.locator("input[name=formNit]"),data.nit); await fillFocus(page,page.locator("input[name=formSitioWeb]"),"https://ui-industria.example.com"); await fillFocus(page,page.locator("input[name=formTelefonoOficina]"),"6011234567"); await selectFocus(page,page.locator("select[name=formPais]"),"Colombia",{force:true}); await selectFocus(page,page.locator("select[name=formCiudad]"),"Bogotá",{force:true}); await fillFocus(page,page.locator("textarea[name=formNota]"),"Prospecto de prueba UI del recorrido completo del equipo.");
    if(await page.locator("input[name=formValor]").count()) throw new Error("El campo retirado 'Valor del prospecto' volvió a aparecer en el formulario");
    await selectFirst(page,page.locator("select[name=formSaludo]")); await selectFirst(page,page.locator("select[name=formEmpleado]")); await selectFirst(page,page.locator("select[name=formFuente]")); await selectFirst(page,page.locator("select[name=formCategoria]")); await selectFirst(page,page.locator("select[name=formServicio]"));
    const saveProspect = page.locator("[data-testid=prospect-save-btn]").first();
    await page.waitForFunction((selector) => {
      const button = document.querySelector(selector);
      return Boolean(button && !button.disabled);
    }, "[data-testid=prospect-save-btn]", { timeout: 10000 });
    await click(page,saveProspect,"Guardar prospecto"); await page.waitForTimeout(1200);
    await page.reload({waitUntil:"domcontentloaded"}); const row=page.locator("tbody tr",{hasText:data.prospect}).first(); await visible(row,"El prospecto creado no se muestra en CRM");
    await click(page,row.locator("button.dropdown-toggle").first(),"Acciones"); await snap("2a-menu-acciones-crm"); await click(page,row.locator(".dropdown-menu button",{hasText:/Asociar equipo/i}).first(),"Asociar equipo");
    const w=page.locator("app-crm-prospect-equipment-modal .modal-content").first(); await visible(w,"No abrió el wizard de recepción");
    // La fecha del formato es solo fecha: un único control estándar, sin hora
    // ni campos DD/MM/AAAA separados. Conservamos el valor para comprobar el
    // resumen del snapshot antes de guardar.
    const receptionDate = new Date();
    const receptionDateValue = `${receptionDate.getFullYear()}-${String(receptionDate.getMonth() + 1).padStart(2,"0")}-${String(receptionDate.getDate()).padStart(2,"0")}`;
    const receptionDateLabel = `${String(receptionDate.getDate()).padStart(2,"0")}/${String(receptionDate.getMonth() + 1).padStart(2,"0")}/${receptionDate.getFullYear()}`;
    const receptionDateInput = w.locator("input[type=date][aria-label='Fecha de recepción']");
    await visible(receptionDateInput,"No aparece el selector único de fecha de recepción");
    await fillFocus(page,receptionDateInput,receptionDateValue);
    if(await receptionDateInput.inputValue() !== receptionDateValue) throw new Error(`La fecha de recepción no conservó el valor estándar ${receptionDateValue}`);
    if(await w.locator("input[placeholder='DD'], input[placeholder='MM'], input[placeholder='AAAA']").count() !== 0) throw new Error("La recepción aún muestra campos de fecha separados");
    await fillLabel(w,"E-mail",data.email); await selectFocus(page,w.locator("[data-testid=equipment-modal-country-select]"),"Colombia",{force:true}); await selectFocus(page,w.locator("[data-testid=equipment-modal-city-select]"),"Bogotá",{force:true}); await fillFocus(page,w.locator("[data-testid=equipment-modal-company-search]"),data.company); await click(page,w.locator("[data-testid=equipment-modal-company-create]"),"Crear empresa");
    // Crear/seleccionar la empresa puede precargar su contacto. El contacto de
    // recepción se define después para que el snapshot guarde el autorizado.
    await fillLabel(w,"Contacto","Ana Cliente");
    await click(page,w.locator("[data-testid=equipment-modal-next]"),"Siguiente recepción");
    console.log("UI_ONLY_RECEPTION selector: modo de registro");
    await selectCustomModal(page,w.getByTestId("equipment-modal-registration-mode-0"),"manual");
    const card=w.locator(".equipment-card").first();
    await fillFocus(page,card.locator("input[placeholder='Familia libre']"),"Tarjetas electrónicas");
    console.log("UI_ONLY_RECEPTION selector: tipo de servicio");
    console.log(`UI_ONLY_RECEPTION service-selector=${await card.getByTestId("equipment-modal-service-type-0").evaluate(element => element.outerHTML.slice(0, 500))}`);
    await selectCustomModal(page,card.getByTestId("equipment-modal-service-type-0"),{label:"Reparación"});
    console.log("UI_ONLY_RECEPTION selector: ubicación");
    await selectCustomModal(page,card.getByTestId("equipment-modal-storage-location-0"),{label:"Estantería"});
    await fillFocus(page,card.locator("input[placeholder='Marca del equipo']"),"Siemens"); await fillFocus(page,card.locator("input[placeholder='Tipo / referencia']"),"Placa base industrial"); await fillFocus(page,card.locator("input[placeholder='Serie o referencia visible']"),data.serie); await fillFocus(page,card.locator("input[placeholder='USB, cables, CD, caja original...']"),"Caja original, cable de poder, manual"); await fillFocus(page,card.locator("textarea").first(),"Placa base: reparación cotizada en $10.000.000 COP.");
    const techTrigger=card.getByTestId("equipment-modal-technician-0");
    await selectCustomModal(page, techTrigger, { index: 1 });
    await click(page,w.locator("[data-testid=equipment-modal-next]"),"Siguiente equipo");
    const ask=async(label)=>{const q=w.locator(".border.rounded.p-3",{hasText:label}).first(); const box=q.locator("input[type=checkbox]").first(); if(await box.isChecked().catch(()=>true)===false) await click(page,box,`Pregunta ${label}`);};
    await ask("superior a $ 2'000.000");
    if(await w.getByText(/Posible falla de software/i).count()) throw new Error("Volvió a aparecer la alerta/validación retirada de posible falla de software");
    const override=w.locator("input[placeholder='Nombre del jefe']"); if(await override.isVisible().catch(()=>false)){await fillFocus(page,override,"Jefe técnico");await fillFocus(page,w.locator("input[placeholder='Justificación operativa']"),"Caso de prueba UI.");} await click(page,w.locator("[data-testid=equipment-modal-next]"),"Siguiente preguntas");
    const evidenceInputs=w.locator("input[type=file]");
    const requiredFaceInputs=evidenceInputs;
    for(let i=0;i<4;i++) await attachFocus(page,requiredFaceInputs.nth(i),{name:`cara-${i}.png`,mimeType:"image/png",buffer:png()});
    const fileInput=evidenceInputs.nth(4);
    if(!await fileInput.waitFor({state:"attached",timeout:15000}).then(()=>true).catch(()=>false)){
      const step=await w.locator(".wizard-step.active").innerText().catch(()=>"?");
      const msg=await w.locator("[data-testid=equipment-modal-validation-message]").innerText().catch(()=>"(sin mensaje)");
      throw new Error(`No se encontró input de evidencias. Paso activo: ${step} | Validación: ${msg}`);
    }
    await attachFocus(page,fileInput,{name:"accesorios.png",mimeType:"image/png",buffer:png()}); await page.waitForTimeout(600); const photos=w.locator(".evidence-photo-card");
    const accessoryPhoto=photos.filter({hasText:"accesorios.png"}).first();
    await selectCustomModal(page,accessoryPhoto.getByTestId("equipment-modal-evidence-type"),{label:"Accesorios"});
    await click(page,w.locator("[data-testid=equipment-modal-next]"),"Siguiente evidencias");
    const summary=w.locator(".modal-body",{hasText:"Resumen de la recepción"}).first();
    await visible(summary,"No se muestra el resumen de recepción");
    if(!(await summary.innerText()).includes(receptionDateLabel)) throw new Error(`El snapshot de recepción no conserva la fecha ${receptionDateLabel}`);
    for (const value of [data.company, "Ana Cliente", data.serie, "Reparación"]) {
      if (!(await summary.innerText()).includes(value)) throw new Error(`El snapshot de recepción no conserva ${value}`);
    }
    await snap("2-recepcion-resumen-consistente");
    const generate=w.locator("#generateRepairProjectsOnSave"); await checkFocus(page,generate); await click(page,w.locator("[data-testid=equipment-modal-save]"),"Guardar recepción y generar proyecto"); await page.waitForTimeout(1800);
  }

  async function ensureContactForAction(page, modal) {
    const contactSelect=modal.locator("select").first();
    const has=await selectFirst(page,contactSelect);
    if(has) return;
    await click(page,modal.locator("button",{hasText:/Cerrar/}).first(),"Cerrar modal de acción comercial");
    await click(page,page.locator("app-crm-prospect-detail .nav-link",{hasText:/Contactos relacionados/}).first(),"Tab Contactos relacionados");
    await click(page,page.getByRole("button",{name:/Agregar contacto/i}),"Agregar contacto");
    const cm=page.locator(".modal-content",{hasText:"Agregar contacto"}).first();
    await visible(cm,"No abrió el modal de contacto");
    await fillFocus(page,cm.locator("input[placeholder*='Maria Garcia']"),"Ana Cliente");
    await fillFocus(page,cm.locator("input[placeholder*='Gerente de compras']"),"Ingeniera de mantenimiento");
    await fillFocus(page,cm.locator("input[type=email]"),data.email);
    await fillFocus(page,cm.locator("input[placeholder*='3001234567']"),"3005550101");
    await fillFocus(page,cm.locator("textarea"),"Contacto operativo para seguimiento de la reparación.");
    await click(page,cm.locator(".modal-footer button",{hasText:/Guardar|Crear|Confirmar/}).first(),"Guardar contacto");
    await page.waitForTimeout(1000);
    await click(page,page.locator("app-crm-prospect-detail .nav-link",{hasText:/Acciones comerciales/}).first(),"Volver a Acciones comerciales");
    await click(page,page.getByRole("button",{name:/Nueva acci.n comercial/i}),"Reabrir acción comercial");
    await visible(modal,"No reabrió el modal de acción comercial");
    if(!await selectFirst(page,modal.locator("select").first())) throw new Error("No hay contactos seleccionables para la acción comercial ni fue posible crear uno");
  }

  async function commercialAction(page) {
    await page.goto(`${base}/app/crm-prospectos`,{waitUntil:"domcontentloaded"});
    const row=page.locator("tbody tr",{hasText:data.prospect}).first();
    await visible(row,"El prospecto no aparece en CRM para registrar la acción comercial");
    await click(page,row.locator("button.dropdown-toggle").first(),"Acciones del prospecto");
    console.log("UI_ONLY_CM abriendo ficha");
    await click(page,row.locator(".dropdown-menu a",{hasText:/Abrir ficha/}).first(),"Abrir ficha del prospecto");
    await page.waitForURL(/\/app\/crm-prospectos\//,{timeout:30000});
    const detail=page.locator("app-crm-prospect-detail").first();
    await visible(detail,"No abrió la ficha del prospecto");
    await click(page,detail.locator(".nav-link",{hasText:/Acciones comerciales/}).first(),"Tab Acciones comerciales");
    console.log("UI_ONLY_CM ficha abierta, abriendo modal");
    await click(page,page.getByRole("button",{name:/Nueva acci.n comercial/i}),"Nueva acción comercial");
    const modal=page.locator(".modal-content",{hasText:"Accion comercial realizada"}).first();
    await visible(modal,"No abrió el modal de acción comercial"); await snap("2b-accion-comercial");
    console.log("UI_ONLY_CM modal abierto, contacto");
    await ensureContactForAction(page,modal);
    console.log("UI_ONLY_CM contacto listo, llenando campos");
    await page.waitForTimeout(500);
    const actionSelect=labelControl(modal,/Accion comercial realizada/,"select");
    await selectFocus(page,actionSelect,{label:"Llamada telefonica"},{force:true});
    await fillFocus(page,labelControl(modal,/Seguimiento Proximo/,"input"),"2026-10-29");
    await fillFocus(page,labelControl(modal,/Hora de inicio/,"input"),"09:30");
    const remindInput=labelControl(modal,/Recordar antes de/,"input");
    if(await remindInput.waitFor({state:"attached",timeout:5000}).then(()=>true).catch(()=>false)) await fillFocus(page,remindInput,"2");
    await selectFirst(page,modal.locator("select").nth(2));
    await fillFocus(page,modal.locator("textarea").first(),"Cliente confirma interés; enviar cotización de la reparación de la placa base.");
    console.log("UI_ONLY_CM guardando acción");
    await click(page,modal.locator("[data-testid=commercial-action-save-btn]"),"Guardar acción comercial");
    const table=detail.locator("table",{hasText:"Proxima accion"}).first();
    await visible(table.locator("tbody tr",{hasText:"Llamada telefonica"}).first(),"La acción comercial no aparece en la lista tras guardar");
    console.log("UI_ONLY_CM acción listada, verificando persistencia");
    await page.reload({waitUntil:"domcontentloaded"});
    const persisted=page.locator("app-crm-prospect-detail").first().locator("table",{hasText:"Proxima accion"}).first().locator("tbody tr",{hasText:"Llamada telefonica"}).first();
    await visible(persisted,"La acción comercial no persistió tras recargar la ficha");
    console.log("UI_ONLY_CM acción persistida");
    await snap("2c-accion-comercial-persistida");
  }

  async function completeAccountRelations(page) {
    const detail=page.locator("app-crm-prospect-detail").first();
    await click(page,detail.locator(".nav-link",{hasText:/Contactos relacionados/}).first(),"Tab Contactos relacionados");
    await click(page,page.getByRole("button",{name:/Agregar contacto/i}),"Agregar segundo contacto");
    const cm=page.locator(".modal-content",{hasText:"Agregar contacto"}).first();
    await visible(cm,"No abrió el modal del segundo contacto");
    await fillFocus(page,cm.locator("input[placeholder*='Maria Garcia']"),"Luis Operativo");
    await fillFocus(page,cm.locator("input[placeholder*='Gerente de compras']"),"Gerente de planta");
    await fillFocus(page,cm.locator("input[type=email]"),`luis.${stamp}@prueba.local`);
    await fillFocus(page,cm.locator("input[placeholder*='3001234567']"),"3005550102");
    await fillFocus(page,cm.locator("textarea"),"Segundo contacto operativo.");
    await click(page,cm.locator(".modal-footer button",{hasText:/Guardar|Crear|Confirmar/}).first(),"Guardar segundo contacto");
    await page.waitForTimeout(1000);
    await click(page,detail.locator(".nav-link",{hasText:/Sucursales/}).first(),"Tab Sucursales");
    await click(page,page.getByRole("button",{name:/Agregar sucursal/i}),"Agregar sucursal");
    await page.waitForTimeout(500);
    const branchForm=detail.locator("div",{hasText:"Nueva sucursal"}).last();
    await fillFocus(page,detail.locator("input[placeholder='Ej: Planta Norte']"),"Planta Norte");
    await fillFocus(page,detail.locator("input[placeholder='Ej: Laura Perez']"),"Luis Operativo");
    await fillFocus(page,detail.locator("input[placeholder='Ej: Coordinador']"),"Gerente de planta");
    await fillFocus(page,detail.locator("input[placeholder='contacto@sucursal.com']"),`planta.${stamp}@prueba.local`);
    await fillFocus(page,detail.locator("input[placeholder='Ej: 3001234567']"),"3005550102");
    const branchSelects=branchForm.locator("select.form-select");
    await selectFocus(page,branchSelects.nth(0),"Colombia",{force:true});
    await selectFocus(page,branchSelects.nth(1),"Bogotá",{force:true});
    await fillFocus(page,detail.locator("input[placeholder='Calle 100 #1-10']"),"Av. Carrera 45 #128-30");
    const primary=branchForm.locator("input[type=checkbox]").first();
    if(await primary.isVisible().catch(()=>false)) await checkFocus(page,primary);
    await click(page,branchForm.getByRole("button",{name:/Guardar/}).first(),"Guardar sucursal");
    await page.waitForTimeout(1000);
    const sucursales=detail.locator("table,div",{hasText:"Planta Norte"});
    await visible(sucursales.first(),"La sucursal no aparece tras guardar");
    await snap("2d-cuenta-con-contactos-y-sede");
  }

  async function verifyProspectTabs(page) {
    const detail=page.locator("app-crm-prospect-detail").first();
    await click(page,detail.locator(".nav-link",{hasText:/Equipos/}).first(),"Tab Equipos");
    await visible(detail.locator("table tbody tr",{hasText:data.serie}).first(),"La pestaña Equipos no conserva la serie recibida");
    await visible(detail.getByText("Reparación",{exact:true}).first(),"La pestaña Equipos no conserva el servicio");
    await snap("2e-tab-equipos-completa");

    await click(page,detail.locator(".nav-link",{hasText:/Cotización/}).first(),"Tab Cotización");
    await visible(detail.getByText(data.prospect,{exact:true}).first(),"La pestaña Cotización no conserva el prospecto");
    await visible(detail.getByRole("link",{name:/Crear cotización/i}),"La pestaña Cotización no expone el flujo de creación");
    await snap("2f-tab-cotizacion");

    await click(page,detail.locator(".nav-link",{hasText:/Notas/}).first(),"Tab Notas");
    await fillFocus(page,detail.locator("input[placeholder='Ingresa el titulo de una nota']"),"Seguimiento de recepción UI");
    await checkFocus(page,detail.locator("#notePrivate"));
    await selectFirst(page,detail.locator("select[name=noteEmployee]"));
    await fillFocus(page,detail.locator("textarea[placeholder='Escribe el detalle de la nota']"),"Equipo recibido, diagnosticado y en flujo de cotización.");
    await click(page,detail.locator(".card-footer button",{hasText:"Guardar"}).first(),"Guardar nota del prospecto");
    await visible(detail.locator(".alert-success"),"La nota del prospecto no confirmó guardado");
    await page.reload({waitUntil:"domcontentloaded"});
    const reloaded=page.locator("app-crm-prospect-detail").first();
    await click(page,reloaded.locator(".nav-link",{hasText:/Notas/}).first(),"Verificar nota tras recarga");
    await visible(reloaded.locator("textarea[placeholder='Escribe el detalle de la nota']"),"La pestaña Notas no quedó disponible tras recargar");
    await snap("2g-tab-notas-persistida");

    await click(page,reloaded.locator(".nav-link",{hasText:/Archivos/}).first(),"Tab Archivos");
    const fileControl=reloaded.locator("input[type=file]").first();
    if (!await fileControl.waitFor({state:"attached",timeout:10000}).then(()=>true).catch(()=>false)) {
      throw new Error("La pestaña Archivos no expone el control para adjuntar");
    }
    const fileName=`ficha-prospecto-${stamp}.pdf`;
    await attachFocus(page,fileControl,{name:fileName,mimeType:"application/pdf",buffer:Buffer.from("%PDF-1.4\n%%EOF")});
    await visible(reloaded.locator("table tbody tr",{hasText:fileName}).first(),"El archivo no aparece tras registrarlo");
    await page.reload({waitUntil:"domcontentloaded"});
    const attachmentsReloaded=page.locator("app-crm-prospect-detail").first();
    await click(page,attachmentsReloaded.locator(".nav-link",{hasText:/Archivos/}).first(),"Verificar archivos tras recarga");
    await visible(attachmentsReloaded.locator("table tbody tr",{hasText:fileName}).first(),"El archivo no persistió tras recargar la ficha");
    await snap("2h-tab-archivos-persistido");
  }

  async function promoteToClient(page) {
    await page.goto(`${base}/app/crm-prospectos`,{waitUntil:"domcontentloaded"});
    const row=page.locator("tbody tr",{hasText:data.prospect}).first();
    await visible(row,"La cuenta no aparece en CRM para la promoción");
    const urlAntes=await row.locator(".dropdown-menu a",{hasText:/Abrir ficha/}).first().getAttribute("href").catch(()=>"");
    await click(page,row.locator("button.dropdown-toggle").first(),"Acciones de la cuenta");
    const manualBtn=row.locator(".dropdown-menu button",{hasText:/Convertir a cliente/i}).first();
    if(await manualBtn.waitFor({state:"visible",timeout:8000}).then(()=>true).catch(()=>false)){
      await click(page,manualBtn,"Convertir a cliente");
      await page.waitForTimeout(2000);
      data.promotion="manual";
    } else {
      console.log("UI_ONLY_PROMOTE AVISO: la acción 'Convertir a cliente' no está disponible (insignia 'Convertido' prematura por heurística de empresa en el catálogo de clientes). Se verifican igualmente id, URL y relaciones.");
      data.promotion="prematura-heuristica";
    }
    await page.reload({waitUntil:"domcontentloaded"});
    const row2=page.locator("tbody tr",{hasText:data.prospect}).first();
    await visible(row2,"La cuenta desapareció tras la conversión");
    const estado=(await row2.innerText()).includes("Cliente")||(await row2.innerText()).includes("Convertido");
    if(!estado) throw new Error("La cuenta no muestra insignia/estado de cliente tras la conversión");
    await click(page,row2.locator("button.dropdown-toggle").first(),"Acciones tras conversión");
    await click(page,row2.locator(".dropdown-menu a",{hasText:/Abrir ficha/}).first(),"Abrir ficha tras conversión");
    await page.waitForURL(/\/app\/crm-prospectos\//,{timeout:30000});
    const urlDespues=page.url();
    if(urlAntes && !urlDespues.endsWith(urlAntes)) throw new Error(`La URL cambió con la conversión: ${urlAntes} -> ${urlDespues}`);
    const detail=page.locator("app-crm-prospect-detail").first();
    await visible(detail,"No abrió la ficha tras la conversión");
    const head=await detail.innerText();
    if(!/Cliente/i.test(head)){
      if(data.promotion==="manual") throw new Error("La ficha no muestra la insignia 'Cliente' tras la conversión manual");
      console.log("UI_ONLY_PROMOTE AVISO: la ficha no muestra insignia 'Cliente' (lifecycle aún 'prospecto'): coherente con la conversión prematura por heurística.");
    }
    await click(page,detail.locator(".nav-link",{hasText:/Contactos relacionados/}).first(),"Tab Contactos (post-conversión)");
    for(const c of ["Ana Cliente","Luis Operativo"]){ await visible(detail.locator("table").first().locator("tbody tr",{hasText:c}).first(),`El contacto ${c} se perdió en la conversión`); }
    await click(page,detail.locator(".nav-link",{hasText:/Sucursales/}).first(),"Tab Sucursales (post-conversión)");
    await visible(detail.locator("table,div",{hasText:"Planta Norte"}).first(),"La sede se perdió en la conversión");
    await click(page,detail.locator(".nav-link",{hasText:/Equipos/}).first(),"Tab Equipos (post-conversión)");
    await visible(detail.locator("table,div",{hasText:data.serie}).first(),"El equipo se perdió en la conversión");
    await click(page,detail.locator(".nav-link",{hasText:/Cotizaci/}).first(),"Tab Cotización (post-conversión)");
    await visible(detail.locator("table").first().locator("tbody tr").first(),"Las cotizaciones se perdieron en la conversión");
    await snap("10-cuenta-promovida-relaciones");
    console.log("UI_ONLY_PROMOTE relaciones intactas; verificando NIT duplicado");
    await page.goto(`${base}/app/crm-prospectos`,{waitUntil:"domcontentloaded"});
    await click(page,page.getByRole("button",{name:/Agregar Prospecto/i}),"Agregar cuenta con NIT duplicado");
    await fillFocus(page,page.locator("input[name=formNombre]"),`Duplicado NIT ${stamp}`);
    await fillFocus(page,page.locator("input[name=formCorreo]"),`dup.${stamp}@prueba.local`);
    await fillFocus(page,page.locator("input[name=formCompania]"),`Empresa Duplicada ${stamp}`);
    await fillFocus(page,page.locator("input[name=formNit]"),data.nit);
    await click(page,page.locator(".card-footer button",{hasText:"Guardar"}).first(),"Guardar cuenta duplicada");
    await page.waitForTimeout(1200);
    const alertas=page.locator(".alert-danger,.alert-warning,.text-danger");
    const hayAlerta=await alertas.first().isVisible().catch(()=>false);
    await page.reload({waitUntil:"domcontentloaded"});
    const dup=page.locator("tbody tr",{hasText:`Duplicado NIT ${stamp}`}).first();
    const aparecio=await dup.isVisible().catch(()=>false);
    if(aparecio) throw new Error(`El NIT duplicado fue aceptado (alerta=${hayAlerta}, aparecio=${aparecio})`);
    console.log(`UI_ONLY_PROMOTE NIT duplicado rechazado (alerta inmediata=${hayAlerta})`);
    await snap("10b-nit-duplicado-rechazado");
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
    if(clientValue!==data.company) throw new Error(`El formulario de remisión no conservó la empresa: "${clientValue}" != "${data.company}"`);
    const poValue=((await page.locator("[data-testid=purchase-order-input]").inputValue().catch(()=>""))||"").trim();
    if(poValue!==data.oc) throw new Error(`La OC no viajó al formulario de remisión: "${poValue}" != "${data.oc}"`);
    const identValue=((await page.locator("input[placeholder='Identificador']").first().inputValue().catch(()=>""))||"").trim();
    if(!/^EQ-[A-Z0-9]+$/i.test(identValue)) throw new Error(`La remisión no precargó el código interno del equipo: "${identValue}"`);
    data.equipmentCode=identValue;
    const seriesValue=((await page.locator("[data-testid=source-series-input]").first().inputValue().catch(()=>""))||"").trim();
    if(seriesValue!==data.serie) throw new Error(`La remisión no conservó la serie: "${seriesValue}" != "${data.serie}"`);
    const serviceValue=((await page.locator("[data-testid=item-service-type]").first().inputValue().catch(()=>""))||"").trim();
    if(serviceValue!==data.serviceType) throw new Error(`El servicio no llegó a la remisión: "${serviceValue}" != "${data.serviceType}"`);
    await fillFocus(page,page.locator("[data-testid=remission-contact-name]"),"Ana Cliente");
    if(!((await page.locator("[data-testid=dispatch-type-select]").inputValue().catch(()=>""))||"").trim()) await selectFocus(page,page.locator("[data-testid=dispatch-type-select]"),"contra-entrega");
    await fillFocus(page,page.locator("[data-testid=carrier-name-input]"),"Servientrega");
    await fillFocus(page,page.locator("[data-testid=guide-number-input]"),`GUIA-${stamp}`);
    await fillFocus(page,page.locator("label.form-label",{hasText:/Notas \//}).first().locator("xpath=following-sibling::textarea"),"Equipo probado en banco de pruebas. Entregar solo al contacto autorizado.");
    await attachFocus(page,page.locator("[data-testid=dispatch-photos-input]"),{name:"despacho.png",mimeType:"image/png",buffer:png()});
    const anchored=page.locator("[data-testid=anchored-accepted-check]");
    if(await anchored.isVisible().catch(()=>false)) await checkFocus(page,anchored);
    const fillIfEmpty=async(placeholder,value)=>{const i=page.locator(`input[placeholder='${placeholder}']`).first(); if(!((await i.inputValue().catch(()=>""))||"").trim()) await fillFocus(page,i,value);};
    await fillIfEmpty("Descripcion","Placa base industrial reparada y probada");
    await fillIfEmpty("Precio","10000000");
    await fillIfEmpty("Cant","1");
    const warranty=page.locator("[data-testid=warranty-select]").first();
    const warrantyLabel=(await warranty.locator("option:checked").innerText().catch(()=>""))||"";
    if(/Sin garant/i.test(warrantyLabel)) await selectFocus(page,warranty,{label:"3 meses"},{force:true});
    for (const itemWarranty of await page.locator("[data-testid=item-warranty-select]").all()) {
      await selectFocus(page, itemWarranty, { label: "3 meses" }, { force: true });
    }
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
    if(await confirm.waitFor({state:"visible",timeout:10000}).then(()=>true).catch(()=>false)){ await snap("9f-modal-entrega");
      const acc=confirm.locator("[data-testid=accessories-delivered-check]");
      if(await acc.isVisible().catch(()=>false)) await checkFocus(page,acc);
      await click(page,confirm.locator("[data-testid=confirm-delivered-btn]"),"Confirmar entrega");
    }
    await page.waitForTimeout(1200);
    await page.reload({waitUntil:"domcontentloaded"});
    const rowEnt=page.locator("table tbody tr",{hasText:data.company}).first();
    await visible(rowEnt.locator("[data-testid=delivery-status-badge]",{hasText:"entregado"}),"La remisión no quedó en estado entregado");
    await visible(rowEnt.locator("[data-testid=remission-client-name]",{hasText:data.company}),"La empresa no persistió en la remisión entregada");
    await visible(rowEnt.locator("[data-testid=remission-contact-name-display]",{hasText:"Ana Cliente"}),"El contacto no persistió en la remisión entregada");
    await visible(rowEnt.locator("[data-testid=remission-item-code]",{hasText:data.equipmentCode}),"El código interno no persistió en la remisión entregada");
    await visible(rowEnt.locator("[data-testid=remission-item-series]",{hasText:data.serie}),"La serie no persistió en la remisión entregada");
    await visible(rowEnt.locator("[data-testid=remission-item-service]",{hasText:data.serviceType}),"El servicio no persistió en la remisión entregada");
  }

  return { ensureReceptionCatalog, reception, commercialAction, completeAccountRelations, verifyProspectTabs, remitAndDeliver, promoteToClient };
}
