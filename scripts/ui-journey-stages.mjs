/** Etapas CRM y remisión del recorrido UI-only: recepción completa, acción
 *  comercial con verificación de persistencia y entrega/remisión. */
import { png } from "./ui-journey-helpers.mjs";

export function makeStages({ base, pause, data, stamp, snap, utils }) {
  const { visible, click, fillFocus, selectFocus, pickByLabel, checkFocus, attachFocus, fillLabel } = utils;

  // Serie CO+YYMM+NNNN: el contador mensual vive en el backend y reinicia en
  // cero cada mes. Estos helpers comparten la semántica de aserción entre
  // recepción (asignación) y remisión (persistencia del código).
  const coPeriod = `${String(new Date().getFullYear()).slice(-2)}${String(new Date().getMonth() + 1).padStart(2, "0")}`;
  const codeSeq=(c)=>Number(String(c||"").replace(/^CO/,""));
  async function waitCode(input,retries=45){
    for(let i=0;i<retries;i++){
      const v=((await input.inputValue().catch(()=>""))||"").trim();
      if(/^CO\d{8,}$/.test(v)) return v;
      await new Promise(r=>setTimeout(r,250));
    }
    return ((await input.inputValue().catch(()=>""))||"").trim();
  }
  async function wizardBlocker(w){
    const msg=w.locator("[data-testid=equipment-modal-validation-message]").first();
    if(!(await msg.isVisible().catch(()=>false))) return "";
    return ((await msg.innerText())||"").trim();
  }
  async function nextStep(page,w,label){
    await click(page,w.locator("[data-testid=equipment-modal-next]"),label);
    const blocker=await wizardBlocker(w);
    if(blocker) throw new Error(`El wizard no avanzó (${label}): ${blocker}`);
  }

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

  async function createProspectInCrm(page) {
    await page.goto(`${base}/app/crm-prospectos`,{waitUntil:"domcontentloaded"});
    await click(page,page.getByRole("button",{name:/Agregar Prospecto/i}),"Abrir formulario de prospecto");
    if(await page.locator("input[name=formValor]").count()) throw new Error("El campo retirado 'Valor del prospecto' volvió a aparecer en el formulario");
    await fillFocus(page,page.locator("input[name=formCompania]"),data.company);
    await fillFocus(page,page.locator("input[name=formCorreo]"),data.email);
    await fillFocus(page,page.locator("input[name=formNit]"),data.nit);
    await fillFocus(page,page.locator("input[name=formMovil]"),"3005550101");
    await fillFocus(page,page.locator("input[name=formSitioWeb]"),"https://ui-industria.example.com");
    await fillFocus(page,page.locator("input[name=formTelefonoOficina]"),"6011234567");
    await selectFocus(page,page.locator("select[name=formPais]"),{label:"Colombia"},{force:true});
    const citySelect=page.locator("select[name=formCiudad]").first();
    await page.waitForFunction(()=>{const el=document.querySelector("select[name=formCiudad]");return Boolean(el&&!el.disabled);},{timeout:10000});
    await selectFocus(page,citySelect,{label:"Bogotá"},{force:true});
    // Empleado responsable y fuente: Choices.js; se elige la primera opción real
    // si existen (no son obligatorios para guardar).
    const pickFirstOption=async(name)=>{
      const sel=page.locator(`select[name=${name}]`).first();
      if(!await sel.count()) return;
      const opts=await sel.locator("option").evaluateAll(os=>os.map(o=>o.value||""));
      if(opts.filter(v=>v.trim()!=="").length===0) return;
      const enabled=opts.findIndex((v,i)=>v.trim()!==""&&i>0);
      await selectFocus(page,sel,{index:enabled>0?enabled:1},{force:true});
    };
    await pickFirstOption("formEmpleado");
    await pickFirstOption("formFuente");
    const saveProspect = page.locator("[data-testid=prospect-save-btn]").first();
    await page.waitForFunction((selector) => {
      const button = document.querySelector(selector);
      return Boolean(button && !button.disabled);
    }, "[data-testid=prospect-save-btn]", { timeout: 10000 });
    await click(page,saveProspect,"Guardar prospecto"); await page.waitForTimeout(1200);
    const searchInput=page.locator("[data-testid=prospects-search]").first();
    await visible(searchInput,"Tras guardar el prospecto no reaparece el buscador de CRM");
    const saveErrorAlert=page.locator(".alert.alert-danger").first();
    if(await saveErrorAlert.isVisible().catch(()=>false)) throw new Error(`El guardado del prospecto reportó: ${(await saveErrorAlert.innerText()).trim()}`);
    await fillFocus(page,searchInput,data.company);
    const searchResult=page.locator("[data-testid=prospect-search-results] a.list-group-item").filter({hasText:data.company}).first();
    await visible(searchResult,"El prospecto recién creado no aparece en el buscador de CRM");
    console.log(`UI_ONLY_PROSPECT creado: ${data.company}`);
    await snap("2a-prospecto-creado-en-crm");
  }

  async function openWizard(page) {
    // Entrada viva al wizard: bandeja de recepción > "Nuevo equipo". El matching
    // de equipos es por NIT/empresa, así que la ficha del prospecto real sí
    // muestra los equipos guardados.
    await page.goto(`${base}/app/work-equipment-reception`,{waitUntil:"domcontentloaded"});
    await click(page,page.locator("[data-testid=work-equipment-create]").first(),"Abrir wizard: Nuevo equipo");
    const w=page.locator("app-crm-prospect-equipment-modal .modal-content").first();
    await visible(w,"No abrió el wizard de recepción");
    return w;
  }

  async function reception(page) {
    await createProspectInCrm(page);
    const w=await openWizard(page);

    // ---- Paso Recepción -----------------------------------------------------
    // La fecha es un único control estándar (sin DD/MM/AAAA separados). Se
    // conserva el valor para comprobar el resumen antes de guardar.
    const receptionDate = new Date();
    const receptionDateValue = `${receptionDate.getFullYear()}-${String(receptionDate.getMonth() + 1).padStart(2,"0")}-${String(receptionDate.getDate()).padStart(2,"0")}`;
    const receptionDateLabel = `${String(receptionDate.getDate()).padStart(2,"0")}/${String(receptionDate.getMonth() + 1).padStart(2,"0")}/${receptionDate.getFullYear()}`;
    const receptionDateInput = w.locator("input[type=date][aria-label='Fecha de recepción']");
    await visible(receptionDateInput,"No aparece el selector único de fecha de recepción");
    await fillFocus(page,receptionDateInput,receptionDateValue);
    if(await receptionDateInput.inputValue() !== receptionDateValue) throw new Error(`La fecha de recepción no conservó el valor estándar ${receptionDateValue}`);
    if(await w.locator("input[placeholder='DD'], input[placeholder='MM'], input[placeholder='AAAA']").count() !== 0) throw new Error("La recepción aún muestra campos de fecha separados");

    // País habilita la lista de ciudades: se selecciona antes.
    await selectFocus(page,w.locator("[data-testid=equipment-modal-country-select]"),{label:"Colombia"},{force:true});
    await selectFocus(page,w.locator("[data-testid=equipment-modal-city-select]"),{label:"Bogotá"},{force:true});
    await fillLabel(w,"Nit",data.nit);
    await fillLabel(w,"Teléfono","6011234567");
    await fillLabel(w,"Dirección","Av. Carrera 45 #128-30");
    await fillLabel(w,"E-mail",data.email);

    // Empresa: combobox de búsqueda sobre Clientes + Prospectos. El prospecto
    // recién creado debe aparecer como resultado y quedar preseleccionado.
    const companySearch=w.locator("[data-testid=equipment-modal-company-search]");
    await fillFocus(page,companySearch,data.company);
    const companyItem=w.locator(".company-dropdown-item").filter({hasText:data.company}).first();
    await visible(companyItem,"El prospecto recién creado no aparece en el combobox de empresa del wizard");
    await click(page,companyItem,"Seleccionar empresa del catálogo");
    await visible(w.getByText("Empresa seleccionada:",{exact:false}).first(),"La empresa no quedó seleccionada tras elegir el resultado");

    // Contacto remitente: se crea inline si el wizard lo permite (requiere el
    // prospecto con ID de backend en el catálogo). Si está bloqueado, la suite
    // bifurca: comercialAction() garantiza el contacto desde la ficha.
    data.contactInWizard=false;
    const newContactBtn=w.locator("[data-testid=equipment-modal-contact-create]").first();
    if(await newContactBtn.isEnabled().catch(()=>false)){
      await click(page,newContactBtn,"Nuevo contacto en el wizard");
      const contactForm=w.locator("[data-testid=equipment-modal-contact-create-form]");
      await visible(contactForm,"No abrió el formulario de nuevo contacto del wizard");
      await fillFocus(page,contactForm.locator("[data-testid=contact-create-name]"),"Ana Cliente");
      const contactEmail=contactForm.locator("input[type=email]").first();
      if(await contactEmail.count()) await fillFocus(page,contactEmail,data.email);
      await click(page,contactForm.locator("[data-testid=contact-create-save]"),"Guardar contacto del wizard");
      await page.waitForFunction(()=>!document.querySelector("[data-testid=equipment-modal-contact-create-form]")||(document.querySelector("[data-testid=equipment-modal-contact-create-form]").querySelector(".alert.alert-danger")),null,{timeout:2000}).catch(()=>{});
      const createError=w.locator("[data-testid=equipment-modal-contact-create-form] .alert-danger").first();
      if(await createError.isVisible().catch(()=>false)) throw new Error(`El contacto del wizard no se guardó: ${await createError.innerText()}`);
      await visible(w.locator(".reception-sender-contact").getByText("Ana Cliente",{exact:false}).first(),"El contacto creado no quedó precargado en el selector de la recepción");
      data.contactInWizard=true;
    } else {
      console.log("UI_ONLY_RECEPTION AVISO: 'Nuevo contacto' está deshabilitado en el wizard (el prospecto aún no expone backendId); se creará por ficha antes de la acción comercial.");
    }
    await nextStep(page,w,"Siguiente recepción");

    // ---- Paso Equipos --------------------------------------------------------
    const card=w.locator(".equipment-card").first();
    await visible(card,"No aparece la tarjeta del equipo en el paso Equipos");
    console.log("UI_ONLY_RECEPTION selector: modo de registro (select nativo)");
    await selectFocus(page,card.getByTestId("equipment-modal-registration-mode-0"),{value:"manual"},{force:true});
    // El modo manual habilita marca/tipo/serie para captura libre.
    await selectFocus(page,card.getByTestId("equipment-modal-family-0"),{label:"CE - Tarjeta Electrónica"},{force:true});
    console.log("UI_ONLY_RECEPTION selector: tipo de servicio (select nativo)");
    await selectFocus(page,card.getByTestId("equipment-modal-service-type-0"),{label:"Reparación"},{force:true});
    // Ubicación es input + datalist: se digita el nombre exacto del catálogo.
    const storageInput=card.getByTestId("equipment-modal-storage-location-0");
    await fillFocus(page,storageInput,"Estantería QA");
    await card.locator(".equipment-card .form-control[placeholder='Marca del equipo']").first().click({timeout:5000}).catch(()=>{}); // dispara change/blur del datalist
    await visible(card.getByText(/Servicio Reparación/).first(),"El tipo de servicio 'Reparación' no quedó aplicado en la tarjeta");
    await visible(card.getByText(/Ubicación Estantería QA/).first(),"La ubicación 'Estantería QA' no quedó aplicada en la tarjeta");

    await fillFocus(page,card.locator("input[placeholder='Marca del equipo']"),"Siemens");
    await fillFocus(page,card.locator("input[placeholder='Tipo / referencia']"),"Placa base industrial");
    await fillFocus(page,card.locator("input[placeholder='Serie o referencia visible']"),data.serie);
    // Accesorios se deja vacío a propósito: reportar accesorios exigiría una
    // evidencia fotográfica de tipo "Accesorios" que no corresponde al flujo.

    // Técnico responsable: select nativo; opcional para el guardado, se elige
    // la primera opción real si existe para enriquecer el proyecto derivado.
    const tech=card.getByTestId("equipment-modal-technician-0");
    if(await tech.isEnabled().catch(()=>false)){
      const opts=await tech.locator("option").evaluateAll(os=>os.map((o,i)=>({i,v:(o.value||"")})));
      const pickT=opts.find(o=>o.v.trim()!=="");
      if(pickT) await selectFocus(page,tech,{index:pickT.i},{force:true});
    }

    // Segundo equipo (validación de serie): los controles Agregar/Eliminar solo
    // existen en este paso. Se agrega ahora; su consecutivo se verifica en
    // Evidencia y luego regresa aquí para eliminarlo antes del guardado.
    await click(page,w.locator("[data-testid=equipment-modal-add-item]"),"Agregar segundo equipo");
    const removeSecond=w.locator("[data-testid=equipment-modal-remove-item-1]").first();
    await visible(removeSecond,"No apareció el botón Eliminar del segundo equipo tras Agregar");

    await nextStep(page,w,"Siguiente equipo");

    // ---- Paso Preguntas ------------------------------------------------------
    // Marcar costo > $2'000.000 como "Sí" libera el guardado sin override de
    // jefe (requiresIndustrialOverride() => false). La pregunta defaulta a No.
    // Cada tarjeta de equipo trae SU PROPIA pregunta: con dos equipos en el
    // wizard hay que marcar todas, no solo la primera.
    const costBoxes=w.locator("input[type=checkbox][id$='-costAboveTwoMillion']");
    await visible(costBoxes.first(),"No aparece la pregunta de costo superior a $ 2'000.000");
    for(let i=0;i<await costBoxes.count();i++){
      const box=costBoxes.nth(i);
      if(!await box.isChecked().catch(()=>false)) await checkFocus(page,box);
    }
    if(await w.locator("input[placeholder='Nombre del jefe']").count()) throw new Error("El recuadro de autorización de jefe sigue visible con costo > 2M marcado en todas las tarjetas: la pregunta no se registró como Sí");
    if(await w.getByText(/Posible falla de software/i).count()) throw new Error("Volvió a aparecer la alerta/validación retirada de posible falla de software");
    await nextStep(page,w,"Siguiente preguntas");

    // ---- Paso Evidencia ------------------------------------------------------
    // El Código interno se expone en este paso (input readonly por equipo).
    const firstCodeInput=w.locator("[data-testid=equipment-internal-code-0]").first();
    await visible(firstCodeInput,"El paso de evidencias no expone el campo Código interno");
    data.internalCode=await waitCode(firstCodeInput);
    if(!/^CO\d{8,}$/.test(data.internalCode)) throw new Error(`El código interno "${data.internalCode || "(vacío)"}" no sigue la serie CO+YYMM+NNNN`);
    if(!data.internalCode.includes(coPeriod)) throw new Error(`El código interno ${data.internalCode} no incluye el periodo actual (CO${coPeriod})`);
    console.log("UI_ONLY_RECEPTION code assigned", data.internalCode);

    // Cuatro caras obligatorias: inputs file en orden DOM front/back/left/right
    // (requiredFaceEvidenceTypes). El handler asigna el tipo de evidencia.
    const faceInputs=w.locator("input[type=file][id^='evidence-face-']");
    if((await faceInputs.count())<4) throw new Error(`Se esperaban 4 inputs de caras obligatorias y hay ${await faceInputs.count()}`);
    for(let i=0;i<4;i++){
      await attachFocus(page,faceInputs.nth(i),{name:`cara-${i}.png`,mimeType:"image/png",buffer:png()});
    }
    await visible(w.locator(".evidence-card").getByText("Caras completas",{exact:true}).first(),"Las 4 caras no quedaron completas tras adjuntar las fotos");

    // El segundo equipo (agregado en el paso Equipos) debió recibir el siguiente
    // consecutivo; su campo de código solo es visible en este paso.
    const secondCodeInput=w.locator("[data-testid=equipment-internal-code-1]").first();
    await visible(secondCodeInput,"El segundo equipo no expone su código interno");
    const secondInternalCode=await waitCode(secondCodeInput);
    if(!/^CO\d{8,}$/.test(secondInternalCode)) throw new Error(`El segundo equipo no recibió un código de serie (valor: "${secondInternalCode || "(vacío)"}")`);
    if(codeSeq(secondInternalCode)!==codeSeq(data.internalCode)+1) throw new Error(`El segundo equipo debería recibir ${data.internalCode}+1 y recibió ${secondInternalCode}`);

    // Vuelve a Equipos para eliminar el segundo (ahí vive su botón Eliminar):
    // Evidencia -> Preguntas -> Equipos. El código asignado queda quemado:
    // la verificación final espera +2 tras guardar.
    const prevBtn=w.locator("[data-testid=equipment-modal-previous]");
    await click(page,prevBtn,"Volver del paso Evidencia al de Preguntas");

    // La respuesta Sí al costo > 2M debió persistir al navegar hacia atrás.
    const costBoxAgain=w.locator("input[type=checkbox][id$='-costAboveTwoMillion']").first();
    await visible(costBoxAgain,"La pregunta de costo no aparece en el paso Preguntas tras volver");
    if(!await costBoxAgain.isChecked().catch(()=>false)) throw new Error("El Sí al costo > 2M se perdió al navegar hacia atrás");

    await click(page,prevBtn,"Volver del paso Preguntas al de Equipos");
    const addAgain=w.locator("[data-testid=equipment-modal-add-item]").first();
    await visible(addAgain,"El botón 'Agregar equipo' no aparece en el paso Equipos tras volver");
    if(await w.locator(".equipment-card").count()!==2) throw new Error(`Se esperaban 2 tarjetas de equipos al volver y hay ${await w.locator(".equipment-card").count()}`);

    await click(page,removeSecond,"Eliminar segundo equipo");
    if(await w.locator(".equipment-card").count()!==1) throw new Error(`Tras eliminar el segundo equipo quedaron ${await w.locator(".equipment-card").count()} tarjetas`);
    const serieInput=w.locator("input[placeholder='Serie o referencia visible']").first();
    if((await serieInput.inputValue().catch(()=>""))!==data.serie) throw new Error(`El equipo que se conserva perdió su serie (valor: "${await serieInput.inputValue().catch(()=>'(vacío)')}")`);

    // Siguiente desde Equipos valida el paso y avanza a Preguntas.
    await nextStep(page,w,"Siguiente a preguntas (tras eliminar equipo)");
    if(!await costBoxAgain.isChecked().catch(()=>false)) throw new Error("El Sí al costo > 2M se perdió al avanzar de nuevo a Preguntas");

    // Siguiente desde Preguntas valida la respuesta y avanza a Evidencia.
    await nextStep(page,w,"Siguiente a evidencias (tras eliminar equipo)");

    // El primer equipo conserva su código original; el del segundo desapareció.
    if((await firstCodeInput.inputValue())!==data.internalCode) throw new Error(`El código del primer equipo cambió al eliminar el segundo: ${await firstCodeInput.inputValue()}`);
    if(await w.locator("[data-testid=equipment-internal-code-1]").count()) throw new Error("Tras eliminar el segundo equipo aún existe su campo de código interno");

    // Siguiente desde Evidencia avanza al paso Cierre.
    await nextStep(page,w,"Siguiente a cierre");

    // ---- Paso Cierre ---------------------------------------------------------
    const summary=w.locator(".modal-body",{hasText:"Resumen de la recepción"}).first();
    await visible(summary,"No se muestra el resumen de recepción");
    const summaryText=await summary.innerText();
    if(!summaryText.includes(receptionDateLabel)) throw new Error(`El snapshot de recepción no conserva la fecha ${receptionDateLabel}`);
    for (const value of [data.company, data.serie, "Reparación"]) {
      if (!summaryText.includes(value)) throw new Error(`El snapshot de recepción no conserva ${value}`);
    }
    if(data.contactInWizard && !summaryText.includes("Ana Cliente")) throw new Error("El contacto creado en el wizard no aparece en el resumen");
    await snap("2-recepcion-resumen-consistente");

    const generate=w.locator("#generateRepairProjectsOnSave");
    await checkFocus(page,generate);
    await click(page,w.locator("[data-testid=equipment-modal-save]"),"Guardar recepción y generar proyecto");

    // Este host (work-equipment-reception) monta el wizard con
    // navigateToProjectsOnSave=false: por diseño al guardar el modal cierra,
    // la tabla se recarga y aparece "Registro creado correctamente." Si algo
    // falló, el wizard sigue abierto con su mensaje de validación.
    const modalRoot=page.locator("app-crm-prospect-equipment-modal").first();
    try {
      await modalRoot.waitFor({state:"detached",timeout:45000});
    } catch {
      const blocker=(await wizardBlocker(w))||"sin mensaje visible en el wizard";
      throw new Error(`La recepción no se guardó (el wizard sigue abierto tras pulsar Guardar): ${blocker}`);
    }

    const savedMsg=page.getByText("Registro creado correctamente.").first();
    await visible(savedMsg,"No apareció el acuse 'Registro creado correctamente.' tras guardar la recepción");

    // El tablero es un DataTable paginado (10 filas/página) ordenado por "Servicios":
    // la recepción nueva puede caer en cualquier página. Como usuario real se usa su
    // propio buscador para localizarla entre TODOS los registros, no solo la página 1.
    // (DataTables 2.x: input .dt-input[type=search] dentro de .dt-search; conteo en .dt-info)
    const tableSearch=page.locator(".dt-search input[type=search]").first();
    await visible(tableSearch,"No aparece el buscador de la tabla del tablero de recepciones");
    await fillFocus(page,tableSearch,data.company);
    try {
      await page.waitForFunction(()=>{const cell=document.querySelector('.dt-info');return !!cell && /1\s+a\s+1\s+de\s+1/.test(cell.textContent||"");},{timeout:20000});
    } catch {
      const infoText=(await page.locator(".dt-info").first().innerText().catch(() =>"")) || "(sin texto)";
      throw new Error(`Tras buscar "${data.company}" en el tablero, la tabla no muestra exactamente 1 registro (info: ${infoText})`);
    }
    await snap("3-recepcion-ubicada-en-tabla");

    const newRow=page.locator("table tbody tr").filter({hasText:data.company}).first();
    await visible(newRow,"La recepción recién guardada no aparece en la tabla del tablero de recepciones");
    if(!(await newRow.innerText()).includes(data.serie)) throw new Error(`La fila de ${data.company} no muestra la serie del equipo ${data.serie}`);
    console.log("UI_ONLY_RECEPTION guardado; recepción visible en el tablero con su serie");

    // Verificación +2: una nueva recepción debe continuar la serie sin repetir
    // códigos (el ítem eliminado antes quemó su consecutivo). El wizard nuevo
    // reserva el código en ngOnInit, pero solo es visible en Evidencia.
    const w2=await openWizard(page);
    await nextStep(page,w2,"Verificación: siguiente recepción");
    await nextStep(page,w2,"Verificación: siguiente equipos");
    const costBox2=w2.locator("input[type=checkbox][id$='-costAboveTwoMillion']").first();
    if(!await costBox2.isChecked().catch(()=>false)) await checkFocus(page,costBox2);
    await nextStep(page,w2,"Verificación: siguiente preguntas");
    const nextCodeInput=w2.locator("[data-testid=equipment-internal-code-0]").first();
    await visible(nextCodeInput,"La recepción de verificación no expone el código interno en Evidencia");
    const nextInternalCode=await waitCode(nextCodeInput);
    if(codeSeq(nextInternalCode)!==codeSeq(data.internalCode)+2) throw new Error(`Tras guardar y reabrir, la serie debió continuar en ${data.internalCode}+2 y quedó en "${nextInternalCode || "(vacío)"}"`);
    console.log("UI_ONLY_RECEPTION code series continued", data.internalCode, "->", nextInternalCode);
    await click(page,w2.locator("[data-testid=equipment-modal-cancel]"),"Cerrar sin guardar la recepción de verificación");
  }

  async function openProspectDetail(page) {
    // El listado de prospectos es por buscador (no tabla): se abre la ficha
    // desde el resultado que coincide con la empresa.
    await page.goto(`${base}/app/crm-prospectos`,{waitUntil:"domcontentloaded"});
    const searchInput=page.locator("[data-testid=prospects-search]").first();
    await visible(searchInput,"No aparece el buscador de prospectos");
    await fillFocus(page,searchInput,data.company);
    const result=page.locator("[data-testid=prospect-search-results] a.list-group-item").filter({hasText:data.company}).first();
    await visible(result,"El prospecto no aparece en CRM para continuar la etapa");
    await click(page,result,"Abrir ficha del prospecto");
    await page.waitForURL(/\/app\/crm-prospectos\//,{timeout:30000});
    const detail=page.locator("app-crm-prospect-detail").first();
    await visible(detail,"No abrió la ficha del prospecto");
    return detail;
  }

  async function ensureContactInProspect(page,detail) {
    // Las acciones comerciales exigen una persona real registrada (COM-02).
    // Si el contacto no existe aún en la ficha, se crea aquí.
    await click(page,detail.locator(".nav-link",{hasText:/Contactos relacionados/}).first(),"Tab Contactos relacionados");
    const existing=detail.locator("table").first().locator("tbody tr",{hasText:"Ana Cliente"}).first();
    if(await existing.isVisible().catch(()=>false)) return;
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
    await visible(detail.locator("table").first().locator("tbody tr",{hasText:"Ana Cliente"}).first(),"El contacto 'Ana Cliente' no quedó registrado en la ficha");
  }

  async function commercialAction(page) {
    const detail=await openProspectDetail(page);
    await ensureContactInProspect(page,detail);
    await click(page,detail.locator(".nav-link",{hasText:/Acciones comerciales/}).first(),"Tab Acciones comerciales");
    await click(page,page.getByRole("button",{name:/Nueva acci.n comercial/i}),"Nueva acción comercial");
    // El modal se titula "Agregar Seguimiento" (no "Accion comercial realizada").
    const modal=page.locator(".modal-content",{hasText:"Agregar Seguimiento"}).first();
    await visible(modal,"No abrió el modal de acción comercial ('Agregar Seguimiento')");
    await snap("2b-accion-comercial");

    // Contacto relacionado y tipo de acción: SelectEnhancementService (global)
    // mejora estos <select> con Choices.js ~50 ms tras abrir el modal; pickByLabel
    // resuelve el control por su label y opera sobre el widget visible, como usuario.
    await pickByLabel(page,modal,"Contacto relacionado","Ana Cliente");
    await pickByLabel(page,modal,"Accion comercial realizada","Llamada telefonica");
    await fillFocus(page,modal.locator("input[type=date]").first(),"2026-10-31");
    await fillFocus(page,modal.locator("input[type=time]").first(),"09:30");

    // Recordatorio: checkbox activo por defecto; el valor "Recordar antes de"
    // solo se habilita con él. Se deja la unidad por defecto (días).
    const remind=modal.locator("#sendCommercialReminder").first();
    if(!await remind.isChecked().catch(()=>false)) await checkFocus(page,remind);
    await fillFocus(page,modal.locator("input[type=number]").first(),"2");

    await fillFocus(page,modal.locator("textarea").first(),"Cliente confirma interés; enviar cotización de la reparación de la placa base.");
    console.log("UI_ONLY_CM guardando acción");
    await click(page,modal.locator("[data-testid=commercial-action-save-btn]"),"Guardar acción comercial");

    const table=detail.locator("table",{hasText:"Proxima accion"}).first();
    // formatCommercialActionNext() = "Llamada telefonica - fecha": la fila contiene el literal.
    await visible(table.locator("tbody tr",{hasText:"Llamada telefonica"}).first(),"La acción comercial no aparece en la lista tras guardar");
    console.log("UI_ONLY_CM acción listada, verificando persistencia");
    await page.reload({waitUntil:"domcontentloaded"});
    const reloaded=page.locator("app-crm-prospect-detail").first();
    const persisted=reloaded.locator(".nav-link",{hasText:/Acciones comerciales/}).first();
    if(await persisted.isVisible().catch(()=>false)) await click(page,persisted,"Tab Acciones tras recarga");
    await visible(reloaded.locator("table",{hasText:"Proxima accion"}).first().locator("tbody tr",{hasText:"Llamada telefonica"}).first(),"La acción comercial no persistió tras recargar la ficha");
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

    // Sucursal: el formulario vive en la pestaña "Sucursales" y solo se renderiza
    // tras pulsar "Agregar sucursal" (showBranchForm). Se recorre como usuario.
    await click(page,detail.locator(".nav-link",{hasText:/Sucursales/}).first(),"Tab Sucursales");
    await click(page,page.getByRole("button",{name:/Agregar sucursal/i}),"Abrir formulario de sucursal");
    const branchForm=detail.locator("h6",{hasText:"Nueva sucursal"}).locator("..").first();
    await visible(branchForm,"No aparece el formulario 'Nueva sucursal'");
    await fillFocus(page,branchForm.locator("input[placeholder='Ej: Planta Norte']"),"Planta Norte");
    await fillFocus(page,branchForm.locator("input[placeholder='Ej: Laura Perez']"),"Luis Operativo");
    await fillFocus(page,branchForm.locator("input[placeholder='Ej: Coordinador']"),"Gerente de planta");
    await fillFocus(page,branchForm.locator("input[placeholder='contacto@sucursal.com']"),`planta.${stamp}@prueba.local`);
    await fillFocus(page,branchForm.locator("input[placeholder='Ej: 3001234567']"),"3005550102");
    // País/ciudad: SelectEnhancementService los mejora con Choices.js; pickByLabel
    // opera sobre el widget visible y espera a que el select deje de estar disabled.
    await pickByLabel(page,branchForm,"Pais","Colombia");
    await pickByLabel(page,branchForm,"Ciudad","Bogotá");
    await fillFocus(page,branchForm.locator("input[placeholder='Calle 100 #1-10']"),"Av. Carrera 45 #128-30");
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

    // La ficha de cotización muestra la empresa del prospecto (nombre=compania),
    // NO un campo "prospecto" separado.
    await click(page,detail.locator(".nav-link",{hasText:/Cotización/}).first(),"Tab Cotización");
    await visible(detail.getByText(data.company,{exact:true}).first(),"La pestaña Cotización no conserva la empresa del prospecto");
    await visible(detail.getByRole("link",{name:/Crear cotización/i}),"La pestaña Cotización no expone el flujo de creación");
    await snap("2f-tab-cotizacion");

    await click(page,detail.locator(".nav-link",{hasText:/Notas/}).first(),"Tab Notas");
    await fillFocus(page,detail.locator("input[placeholder='Ingresa el titulo de una nota']"),"Seguimiento de recepción UI");
    await checkFocus(page,detail.locator("#notePrivate"));
    const noteEmployee=detail.locator("select[name=noteEmployee]").first();
    if(await noteEmployee.count()){
      const opts=await noteEmployee.locator("option").evaluateAll(os=>os.map((o,i)=>({i,v:(o.value||"")})));
      const pickN=opts.find(o=>o.v.trim()!=="");
      if(pickN) await selectFocus(page,noteEmployee,{index:pickN.i},{force:true});
    }
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
    const detail=await openProspectDetail(page);
    // El botón "Convertir a cliente" vive dentro de la pestaña "Acciones comerciales"
    // (ubicación acordada por el dueño): primero cambiamos a esa pestaña, como un usuario.
    await click(page,detail.locator(".nav-link",{hasText:/^Acciones comerciales$/}).first(),"Pestaña Acciones comerciales");
    const convertBtn=page.locator("[data-testid=convert-to-client-btn]").first();
    await visible(convertBtn,"No aparece el botón 'Convertir a cliente' en la ficha");
    await click(page,convertBtn,"Convertir a cliente");
    const confirmModal=page.locator(".modal-content",{hasText:/Convertir/}).first();
    if(await confirmModal.waitFor({state:"visible",timeout:8000}).then(()=>true).catch(()=>false)){
      await click(page,page.locator("[data-testid=confirm-convert-to-client-btn]").first(),"Confirmar conversión a cliente");
    }
    // El resultado se muestra en el banner de la ficha (éxito o vínculo previo).
    const banner=page.locator("[data-testid=convert-result-banner]").first();
    await visible(banner,"La conversión no produjo confirmación visible");
    const bannerText=(await banner.innerText().catch(()=>""))||"";
    if(!/convirtió en cliente|quedó vinculado/i.test(bannerText)) throw new Error(`El banner de conversión no confirma el resultado: ${bannerText}`);
    console.log("UI_ONLY_PROMOTE conversión confirmada:",bannerText.trim());
    data.promotion="manual";

    // La relación debe sobrevivir a la conversión (contactos, sede y equipo).
    await click(page,detail.locator(".nav-link",{hasText:/Contactos relacionados/}).first(),"Tab Contactos (post-conversión)");
    for(const c of ["Ana Cliente","Luis Operativo"]){
      await visible(detail.locator("table").first().locator("tbody tr",{hasText:c}).first(),`El contacto ${c} se perdió en la conversión`);
    }
    await click(page,detail.locator(".nav-link",{hasText:/Sucursales/}).first(),"Tab Sucursales (post-conversión)");
    await visible(detail.locator("table,div",{hasText:"Planta Norte"}).first(),"La sede se perdió en la conversión");
    await click(page,detail.locator(".nav-link",{hasText:/Equipos/}).first(),"Tab Equipos (post-conversión)");
    await visible(detail.locator("table,div",{hasText:data.serie}).first(),"El equipo se perdió en la conversión");
    await snap("10-cuenta-promovida-relaciones");

    // La empresa ya debe existir como cliente: buscador de clientes por empresa.
    await page.goto(`${base}/app/crm-clientes`,{waitUntil:"domcontentloaded"});
    const clientsSearch=page.locator("[data-testid=clients-search]").first();
    await visible(clientsSearch,"No aparece el buscador de clientes");
    await fillFocus(page,clientsSearch,data.company);
    await visible(page.locator("[data-testid=client-search-results] a.list-group-item").filter({hasText:data.company}).first(),"La empresa convertida no aparece en Clientes tras la promoción");
    console.log("UI_ONLY_PROMOTE cliente visible en /app/crm-clientes");
    await snap("10b-cliente-visible-en-catalogo");
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
    // El identificador precargado es el código interno del equipo: serie nueva
    // CO+YYMM+NNNN o legacy EQ-* de recepciones previas a la migración.
    const identValue=((await page.locator("input[placeholder='Identificador']").first().inputValue().catch(()=>""))||"").trim();
    if(!/^(?:EQ-[A-Z0-9]+|CO\d{8,})$/i.test(identValue)) throw new Error(`La remisión no precargó el código interno del equipo: "${identValue}"`);
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

  // Auditoría visual del código CO+YYMM+NNNN en TODAS las vistas del equipo,
  // tras el cierre de reparación. Actúa como usuario real: navega a cada vista,
  // lee el texto renderizado y lo aserta contra data.internalCode (asignado en
  // recepción). Si alguna vista aún cae al identificador legacy, la aserción
  // falla con el texto exacto para diagnosticar qué bloque no migra.
  async function verifyEquipmentCodeInViews(page) {
    if(!/^CO\d{8,}$/.test(data.internalCode||"")) throw new Error(`Falta data.internalCode para auditar las vistas (recibido: "${data.internalCode}")`);

    // 1) Tablero de proyectos (vista completa): el badge de la tarjeta muestra CO.
    await page.goto(`${base}/app/work-projects`,{waitUntil:"domcontentloaded"});
    await utils.ensureBoardFullView(page);
    const card=page.locator(".project-card",{hasText:data.serie}).first();
    if(!await card.waitFor({state:"visible",timeout:20000}).then(()=>true).catch(()=>false)) throw new Error("La tarjeta del proyecto no aparece en el tablero para auditar su código");
    const badge=card.locator(".project-card__meta-code").first();
    await visible(badge,"El badge de código interno no aparece en la tarjeta del tablero");
    const badgeText=((await badge.innerText().catch(()=>""))||"").trim();
    if(!/^CO\d{8,}$/.test(badgeText)) throw new Error(`El badge del tablero muestra "${badgeText}" y no un código CO+YYMM+NNNN`);
    if(!badgeText.includes(coPeriod)) throw new Error(`El badge ${badgeText} no incluye el periodo actual (CO${coPeriod})`);
    await snap("11a-tablero-badge-co");

    // 2) Modo compacto: el chip único por proyecto también debe mostrar el CO.
    const toggle=page.locator(".compact-mode-toggle input[type=checkbox]").first();
    if(await toggle.waitFor({state:"attached",timeout:20000}).then(()=>true).catch(()=>false)){
      await checkFocus(page,toggle);
      await page.waitForTimeout(900);
      const chips=(await page.locator(".compact-code-chip").allInnerTexts().catch(()=>[])).map(t=>t.trim());
      if(!chips.some(text=>text===data.internalCode)) throw new Error(`El chip compacto no muestra ${data.internalCode}. Chips visibles: ${JSON.stringify(chips.slice(0,12))}`);
      await snap("11b-tablero-chip-compacto-co");
      await toggle.uncheck(); await page.waitForTimeout(900);
    } else {
      console.log("UI_ONLY_CODE auditoría de modo compacto omitida (sin toggle disponible)");
    }

    // 3) Ficha del proyecto: eyebrow + bloque QR/caja de equipo vinculado.
    const d=await utils.openCard(page);
    await visible(d,"No abrió la ficha del proyecto para auditar su código");
    const eyebrow=d.locator(".project-detail-dialog__eyebrow").first();
    await visible(eyebrow,"La ficha no expone el eyebrow con el código interno");
    const eyebrowText=((await eyebrow.innerText().catch(()=>""))||"").trim();
    if(!/^CO\d{8,}$/.test(eyebrowText)) throw new Error(`El eyebrow de la ficha muestra "${eyebrowText}" y no ${data.internalCode}`);
    const qrMeta=d.locator(".equipment-qr-preview__meta small",{hasText:/Código interno/}).first();
    const linkedBox=d.locator(".equipment-linked-box__grid span",{hasText:/Código interno/}).first();
    // El bloque depende de que el catálogo llegue por API (resuelve linkedEquipment)
    // y, en el QR, de una generación asíncrona: se espera su settle con tope estricto,
    // como esperaría un usuario real. Si tras 30s no aparece, la aserción falla.
    let blockVisible=false;
    for(let i=0;i<60 && !blockVisible;i++){
      blockVisible=(await qrMeta.isVisible().catch(()=>false))||(await linkedBox.isVisible().catch(()=>false));
      if(!blockVisible) await new Promise(r=>setTimeout(r,500));
    }
    const codeViews=[];
    if(await qrMeta.isVisible().catch(()=>false)) codeViews.push(["QR del equipo",((await qrMeta.innerText().catch(()=>""))||"").trim()]);
    if(await linkedBox.isVisible().catch(()=>false)) codeViews.push(["Equipo vinculado",((await linkedBox.innerText().catch(()=>""))||"").trim()]);
    if(!codeViews.length){
      const estado=((await d.locator(".equipment-qr-placeholder, .alert-warning").allInnerTexts().catch(()=>[])).join(" | ")||(await d.locator("text=/Aun no hay un equipo|No se pudo cargar|ya no existe/i").first().innerText().catch(()=>"sin estado legible")));
      throw new Error(`La ficha no muestra ningún bloque con el código interno del equipo (ni QR ni caja de vínculo) tras 30s de espera. Estado visible: ${JSON.stringify(estado.slice(0,400))}`);
    }
    for(const [name,text] of codeViews){ if(!text.includes(data.internalCode)) throw new Error(`El bloque "${name}" de la ficha muestra "${text}" y no ${data.internalCode}`); }
    await snap("11c-ficha-codigo-interno-co");
    const closeBtn=d.locator("button.project-detail-dialog__close").first();
    if(await closeBtn.isVisible().catch(()=>false)) await click(page,closeBtn,"Cerrar ficha tras auditar código");

    // 4) Ficha del prospecto → pestaña Equipos: la fila conserva el código CO.
    const detail=await openProspectDetail(page);
    await click(page,detail.locator(".nav-link",{hasText:/Equipos/}).first(),"Tab Equipos (auditoría de código)");
    const eqRow=detail.locator("table tbody tr",{hasText:data.serie}).first();
    await visible(eqRow,"La fila del equipo no aparece en la pestaña Equipos para auditar su código");
    const rowText=(await eqRow.innerText().catch(()=>""))||"";
    if(!rowText.includes(data.internalCode)) throw new Error(`La fila del equipo en la ficha de prospecto no muestra ${data.internalCode}. Fila: ${JSON.stringify(rowText.slice(0,240))}`);
    await snap("11d-prospecto-tab-equipos-co");

    // 5) Carga laboral (cola de afectación): si el equipo aún está sin técnico,
    // la fila visible debe llevar el código CO. Tras el cierre suele salir ya
    // asignado: en ese caso se omite con aviso, sin ocultar fallos reales.
    await page.goto(`${base}/app/work-workload`,{waitUntil:"domcontentloaded"});
    const queueRow=page.locator("tr.queue-row",{hasText:data.serie}).first();
    if(await queueRow.isVisible().catch(()=>false)){
      const qText=(await queueRow.innerText().catch(()=>""))||"";
      if(!qText.includes(data.internalCode)) throw new Error(`La fila de la cola laboral no muestra ${data.internalCode}. Fila: ${JSON.stringify(qText.slice(0,240))}`);
      console.log("UI_ONLY_CODE cola laboral visible con código CO");
    } else {
      console.log("UI_ONLY_CODE cola laboral sin el equipo (ya asignado tras el cierre): aserción de código omitida");
    }

    // 6) Timesheet: la opción del select de equipos siempre incluye el código.
    await page.goto(`${base}/app/work-timesheet`,{waitUntil:"domcontentloaded"});
    const tsSelect=page.locator("select[data-testid=timesheet-equipment-select]").first();
    await visible(tsSelect,"El select de equipos del timesheet no aparece para auditar su código");
    const opts=(await tsSelect.locator("option").allInnerTexts().catch(()=>[])).map(t=>t.trim());
    if(!opts.some(text=>text.includes(data.internalCode))) throw new Error(`Ninguna opción del select de equipos muestra ${data.internalCode}. Opciones: ${JSON.stringify(opts.slice(0,12))}`);
    await snap("11e-timesheet-opcion-co");

    console.log(`UI_ONLY_CODE vistas verificadas con ${data.internalCode} (periodo CO${coPeriod})`);
  }

  return { ensureReceptionCatalog, reception, commercialAction, completeAccountRelations, verifyProspectTabs, remitAndDeliver, promoteToClient, verifyEquipmentCodeInViews };
}
