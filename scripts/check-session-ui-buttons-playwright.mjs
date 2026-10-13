import path from 'node:path';
import { chromium } from 'playwright';

const baseUrl = process.env.PW_BASE_URL || 'http://127.0.0.1:4200';
const timeoutMs = Number(process.env.PW_TIMEOUT_MS || '90000');
const slowMoMs = Number(process.env.PW_SLOW_MO_MS || '150');
const holdOpenMs = Number(process.env.PW_HOLD_OPEN_MS || '0');
const browserChannel = process.env.PW_BROWSER_CHANNEL || 'chrome';
const headless = !['false', '0', 'no'].includes((process.env.PW_HEADLESS || 'false').toLowerCase());

const consoleErrors = [];
const pageErrors = [];

const result = {
  baseUrl,
  browserChannel,
  headless,
  companyProjectsConfig: {},
  workTestBatches: {},
  workProjects: {},
  consoleErrors,
  pageErrors,
  screenshotPath: '',
};

function fail(message) {
  throw new Error(message);
}

async function waitFor(check, message, timeout = 15000) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeout) {
    if (await check()) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 120));
  }
  fail(message);
}

async function gotoRoute(page, route, waitSelector) {
  const normalizedBaseUrl = baseUrl.replace(/\/$/, '');
  const url = `${normalizedBaseUrl}${route}`;
  const response = await page.goto(url, {
    waitUntil: 'networkidle',
    timeout: timeoutMs,
  });

  if (response && response.status() >= 400) {
    const rootResponse = await page.goto(normalizedBaseUrl, {
      waitUntil: 'networkidle',
      timeout: timeoutMs,
    });

    if (rootResponse && rootResponse.status() >= 400) {
      fail(`La preview base respondio con estado ${rootResponse.status()} al intentar recuperar la ruta ${route}.`);
    }

    if (route && route !== '/') {
      await page.evaluate((nextRoute) => {
        window.history.pushState({}, '', nextRoute);
        window.dispatchEvent(new PopStateEvent('popstate'));
      }, route);
      await page.waitForLoadState('networkidle', { timeout: timeoutMs }).catch(() => undefined);
    }
  }

  if (waitSelector) {
    await page.waitForSelector(waitSelector, { timeout: timeoutMs });
  }
}

async function getRowIndexByText(page, text) {
  return page.locator('tbody tr').evaluateAll((rows, targetText) => rows.findIndex((row) => {
    const content = row.textContent || '';
    return content.includes(String(targetText));
  }), text);
}

async function getCompanyRowIndexByColumnId(page, columnId) {
  return page.locator('tbody tr').evaluateAll((rows, targetColumnId) => rows.findIndex((row) => {
    return Boolean(row.querySelector(`[data-testid="company-projects-edit-${String(targetColumnId)}"]`));
  }), columnId);
}

async function fillTransitionPrompt(modal) {
  const questions = modal.locator('.transition-question');
  const count = await questions.count();

  for (let index = 0; index < count; index += 1) {
    const question = questions.nth(index);
    const select = question.locator('select.form-select').first();
    const numberInput = question.locator('input[type="number"]').first();
    const textarea = question.locator('textarea').first();

    if (await select.count()) {
      const values = await select.locator('option').evaluateAll((options) => options
        .map((option) => option.value)
        .filter((value) => value));
      if (!values.length) {
        fail('No se encontraron opciones seleccionables dentro del lote de pruebas.');
      }
      await select.selectOption(values[0]);
      continue;
    }

    if (await numberInput.count()) {
      await numberInput.fill(String(80 + index));
      continue;
    }

    if (await textarea.count()) {
      await textarea.fill(`Respuesta automatizada ${index + 1}`);
      continue;
    }

    fail(`No se pudo resolver el tipo de control para la pregunta ${index + 1}.`);
  }
}

async function runCompanyProjectsConfigChecks(page) {
  const section = {
    initialRowCount: 0,
    editedColumnName: '',
    actions: [],
  };

  await gotoRoute(page, '/app/company-projects-config', '[data-testid="company-projects-new-column"]');
  await waitFor(async () => await page.locator('tbody tr').count() > 0,
    'Config. Proyectos no termino de cargar las filas del tablero.');

  section.initialRowCount = await page.locator('tbody tr').count();

  await page.getByTestId('company-projects-new-column').click();
  await page.locator('input[name="columnName"]').fill('PW temporal ver columnas');
  await page.getByTestId('company-projects-view-columns').click();
  await page.waitForSelector('[data-testid="company-projects-new-column"]', { timeout: timeoutMs });
  section.actions.push('view-columns');

  await page.getByTestId('company-projects-new-column').click();
  await page.locator('input[name="columnName"]').fill('PW temporal cancelar');
  await page.getByTestId('company-projects-cancel-column').click();
  await page.waitForSelector('[data-testid="company-projects-new-column"]', { timeout: timeoutMs });
  section.actions.push('cancel-column');

  if (section.initialRowCount < 2) {
    fail('Config. Proyectos necesita al menos dos filas para validar edicion y reordenamiento.');
  }

  const editableRow = page.locator('tbody tr').nth(1);
  const editedColumnName = ((await editableRow.locator('.fw-semibold').first().textContent()) || '').trim();
  const editButton = editableRow.locator('[data-testid^="company-projects-edit-"]').first();
  const editButtonTestId = await editButton.getAttribute('data-testid');
  const editedColumnId = String(editButtonTestId || '').replace('company-projects-edit-', '').trim();
  if (!editedColumnName) {
    fail('No se pudo resolver el nombre de la columna base para validar Config. Proyectos.');
  }
  if (!editedColumnId) {
    fail('No se pudo resolver el id de la columna base para validar Config. Proyectos.');
  }

  section.editedColumnName = editedColumnName;

  await editButton.click();
  await waitFor(async () => (await page.locator('input[name="columnName"]').inputValue()) === editedColumnName,
    'Editar columna no cargo el nombre base en el formulario.');
  section.actions.push('edit-column');

  await page.locator('input[name="columnName"]').fill('A');
  await page.locator('form').evaluate((form) => form.requestSubmit());
  await waitFor(async () => (await page.locator('body').textContent())?.includes('El nombre debe tener al menos 2 caracteres.') ?? false,
    'Guardar columna no mostro la validacion esperada con un nombre invalido.');
  section.actions.push('save-column-validation');

  await page.getByTestId('company-projects-cancel-column').click();
  await page.waitForSelector('[data-testid="company-projects-new-column"]', { timeout: timeoutMs });

  const editedRow = page.locator('tbody tr').filter({ has: page.locator(`[data-testid="company-projects-edit-${editedColumnId}"]`) }).first();

  const editedIndex = await getCompanyRowIndexByColumnId(page, editedColumnId);
  if (editedIndex < 1) {
    fail('La columna base no quedo en una posicion valida para probar mover hacia arriba.');
  }

  await editedRow.locator(`[data-testid^="company-projects-move-up-"]`).click();
  await waitFor(async () => {
    return (await getCompanyRowIndexByColumnId(page, editedColumnId)) !== -1
      && await page.locator('tbody tr').count() === section.initialRowCount;
  }, 'Mover arriba rompio la tabla o hizo desaparecer la columna objetivo.');
  section.actions.push('move-column-up');

  const movedRow = page.locator('tbody tr').filter({ has: page.locator(`[data-testid="company-projects-edit-${editedColumnId}"]`) }).first();
  await movedRow.locator(`[data-testid^="company-projects-move-down-"]`).click();
  await waitFor(async () => {
    return (await getCompanyRowIndexByColumnId(page, editedColumnId)) !== -1
      && await page.locator('tbody tr').count() === section.initialRowCount;
  }, 'Mover abajo rompio la tabla o hizo desaparecer la columna objetivo.');
  section.actions.push('move-column-down');

  await page.getByTestId('company-projects-reset-technical-flow').click();
  await waitFor(async () => ((await page.locator('tbody tr .fw-semibold').first().textContent()) || '').trim() === 'Recibido',
    'Reset tecnico no restablecio el flujo tecnico esperado en la primera columna.');
  section.actions.push('reset-technical-flow');

  return section;
}

async function runWorkTestBatchesChecks(page) {
  const section = {
    createdBatchName: '',
    createdFlowName: '',
    actions: [],
  };

  await gotoRoute(page, '/app/work-test-batches', '[data-testid="work-test-batches-new-group"]');

  const panels = page.locator('.col-12.col-xl-6');
  const batchPanel = panels.nth(0);
  const flowPanel = panels.nth(1);
  const batchNameInput = batchPanel.locator('input.form-control').nth(0);

  await batchNameInput.fill('PW temporal limpiar con nuevo grupo');
  await page.getByTestId('work-test-batches-new-group').click();
  await waitFor(async () => (await batchNameInput.inputValue()) === '',
    'El boton Nuevo grupo no limpio el formulario.');
  section.actions.push('new-group');

  const questionCards = batchPanel.locator('.question-editor-card');
  const beforeAddCount = await questionCards.count();
  await page.getByTestId('work-test-batches-add-question').click();
  await waitFor(async () => await questionCards.count() === beforeAddCount + 1,
    'Agregar pregunta no incremento el total de bloques.');
  section.actions.push('add-question');

  await questionCards.last().getByRole('button', { name: 'Quitar' }).click();
  await waitFor(async () => await questionCards.count() === beforeAddCount,
    'Quitar no elimino la pregunta agregada.');
  section.actions.push('remove-question');

  const createdBatchName = `PW Grupo ${Date.now()}`;
  section.createdBatchName = createdBatchName;
  await batchNameInput.fill(createdBatchName);
  await batchPanel.locator('textarea.form-control').first().fill('Grupo temporal para validar botones y resultados.');
  const firstQuestionCard = questionCards.first();
  await firstQuestionCard.locator('input.form-control').first().fill('La revision inicial quedo documentada?');
  await firstQuestionCard.locator('input.form-control').nth(1).fill('Debe quedar trazabilidad del lote.');
  await page.getByTestId('work-test-batches-save-group').click();

  const batchRow = batchPanel.locator('tbody tr').filter({ hasText: createdBatchName }).first();
  await waitFor(async () => await batchRow.count() === 1, 'El grupo guardado no aparecio en la tabla.');
  section.actions.push('save-group');

  await batchRow.getByRole('button', { name: 'Editar' }).click();
  await waitFor(async () => (await batchNameInput.inputValue()) === createdBatchName,
    'Editar grupo no cargo el nombre en el formulario.');
  section.actions.push('edit-group');

  await batchNameInput.fill('PW grupo a limpiar');
  await page.getByTestId('work-test-batches-clear-group').click();
  await waitFor(async () => (await batchNameInput.inputValue()) === '',
    'Limpiar grupo no reinicio el formulario.');
  section.actions.push('clear-group');

  const flowNameInput = flowPanel.locator('input.form-control').first();
  await flowNameInput.fill('PW flujo temporal limpiar con nuevo flujo');
  await page.getByTestId('work-test-batches-new-flow').click();
  await waitFor(async () => (await flowNameInput.inputValue()) === '',
    'Nuevo flujo no limpio el formulario.');
  section.actions.push('new-flow');

  const createdFlowName = `PW Flujo ${Date.now()}`;
  section.createdFlowName = createdFlowName;
  await flowNameInput.fill(createdFlowName);

  const flowSelects = flowPanel.locator('select.form-select');
  await flowSelects.nth(0).selectOption('diagnostico');
  await flowSelects.nth(1).selectOption('pedir-repuestos');
  await flowSelects.nth(2).selectOption('always');

  const tempBatchOption = flowPanel.locator('.flow-batch-option').filter({ hasText: createdBatchName }).first();
  await tempBatchOption.locator('input[type="checkbox"]').check();
  await page.getByTestId('work-test-batches-save-flow').click();

  const flowRow = flowPanel.locator('tbody tr').filter({ hasText: createdFlowName }).first();
  await waitFor(async () => await flowRow.count() === 1, 'El flujo guardado no aparecio en la tabla.');
  section.actions.push('save-flow');

  await flowRow.getByRole('button', { name: 'Editar' }).click();
  await waitFor(async () => (await flowNameInput.inputValue()) === createdFlowName,
    'Editar flujo no cargo el formulario.');
  section.actions.push('edit-flow');

  await page.getByTestId('work-test-batches-clear-flow').click();
  await waitFor(async () => (await flowNameInput.inputValue()) === '',
    'Limpiar flujo no reinicio el formulario.');
  section.actions.push('clear-flow');

  await flowRow.getByRole('button', { name: 'Borrar' }).click();
  await waitFor(async () => await flowRow.count() === 0, 'Borrar flujo no elimino la fila del listado.');
  section.actions.push('delete-flow');

  await batchRow.getByRole('button', { name: 'Borrar' }).click();
  await waitFor(async () => await batchRow.count() === 0, 'Borrar grupo no elimino la fila del listado.');
  section.actions.push('delete-group');

  return section;
}

async function runWorkProjectsChecks(page) {
  const section = {
    detailProjectId: '',
    actions: [],
  };

  await gotoRoute(page, '/app/work-projects', '.kanban-board');
  await waitFor(async () => await page.locator('.project-card').count() > 0,
    'Trabajo -> Proyectos no termino de cargar tarjetas en el kanban.');

  const projectSelection = await page.evaluate(() => {
    const pickFirstProjectId = (columnId) => {
      const column = document.querySelector(`.cards-sortable[data-column-id="${columnId}"]`);
      const item = column?.querySelector('.project-drag-item');
      return item?.getAttribute('data-project-id') || '';
    };

    return {
      detailProjectId: pickFirstProjectId('diagnostico'),
    };
  });

  if (!projectSelection.detailProjectId) {
    fail('No se encontro un proyecto en Diagnostico para validar los botones del detalle.');
  }

  section.detailProjectId = projectSelection.detailProjectId;

  const detailCard = page.locator(`.project-drag-item[data-project-id="${section.detailProjectId}"] .project-card`).first();
  await detailCard.click({ position: { x: 40, y: 40 } });
  await page.waitForSelector('.project-detail-dialog', { state: 'visible', timeout: timeoutMs });
  section.actions.push('open-project-detail');

  await page.locator('.project-detail-dialog__close').click();
  await page.waitForSelector('.project-detail-dialog', { state: 'hidden', timeout: timeoutMs });
  section.actions.push('close-project-detail');

  await detailCard.click({ position: { x: 40, y: 40 } });
  await page.waitForSelector('.project-detail-dialog', { state: 'visible', timeout: timeoutMs });

  const targetStatusChip = page.locator('.project-detail-dialog .status-chip', { hasText: 'Pedir componentes' }).first();
  await targetStatusChip.click();
  const promptModal = page.locator('.project-transition-dialog').first();
  await promptModal.waitFor({ state: 'visible', timeout: timeoutMs });
  section.actions.push('open-transition-modal-from-detail');

  await promptModal.locator('button[aria-label="Cerrar"]').evaluate((button) => button.click());
  await promptModal.waitFor({ state: 'hidden', timeout: timeoutMs });
  await waitFor(async () => (await page.locator('.project-detail-dialog .status-chip.is-active').first().textContent())?.includes('Diagnostico') ?? false,
    'Cerrar el modal con la X altero el estado del proyecto.');
  section.actions.push('close-transition-modal-with-x');

  await targetStatusChip.click();
  await promptModal.waitFor({ state: 'visible', timeout: timeoutMs });
  const confirmButton = promptModal.getByRole('button', { name: 'Confirmar transicion' });
  if (!(await confirmButton.isDisabled())) {
    fail('El boton Confirmar transicion deberia iniciar deshabilitado mientras faltan respuestas obligatorias.');
  }
  await fillTransitionPrompt(promptModal);
  await confirmButton.evaluate((button) => button.click());
  await promptModal.waitFor({ state: 'hidden', timeout: timeoutMs });
  await waitFor(async () => (await page.locator('.project-detail-dialog .status-chip.is-active').first().textContent())?.includes('Pedir componentes') ?? false,
    'Confirmar transicion no movio el proyecto a Pedir componentes.');
  section.actions.push('confirm-transition-modal-from-detail');

  await page.locator('.project-detail-dialog__close').click();
  await page.waitForSelector('.project-detail-dialog', { state: 'hidden', timeout: timeoutMs });

  return section;
}

let browser;

try {
  browser = await chromium.launch({
    channel: browserChannel,
    headless,
    slowMo: slowMoMs,
  });

  const context = await browser.newContext({
    viewport: { width: 1600, height: 1000 },
  });
  const page = await context.newPage();

  page.on('console', (message) => {
    if (message.type() === 'error') {
      consoleErrors.push(message.text());
    }
  });

  page.on('pageerror', (error) => {
    pageErrors.push(error.stack || error.message || String(error));
  });

  result.companyProjectsConfig = await runCompanyProjectsConfigChecks(page);
  result.workTestBatches = await runWorkTestBatchesChecks(page);
  result.workProjects = await runWorkProjectsChecks(page);

  const screenshotPath = path.join(process.cwd(), 'playwright-session-ui-buttons-check.png');
  await page.screenshot({ path: screenshotPath, fullPage: true });
  result.screenshotPath = screenshotPath;

  if (holdOpenMs > 0) {
    await page.waitForTimeout(holdOpenMs);
  }

  if (pageErrors.length > 0) {
    fail('Se detectaron errores de JavaScript en la pagina durante la ejecucion del smoke test.');
  }

  console.log('PLAYWRIGHT_SESSION_UI_BUTTONS_CHECK_OK');
  console.log(JSON.stringify(result, null, 2));
} catch (error) {
  console.error('PLAYWRIGHT_SESSION_UI_BUTTONS_CHECK_FAILED');
  console.error(String(error?.stack || error));
  console.error(JSON.stringify(result, null, 2));
  process.exitCode = 1;
} finally {
  if (browser) {
    await browser.close();
  }
}