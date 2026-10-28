import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import fs from 'node:fs/promises';

const origin = 'http://127.0.0.1:4200';
const api = 'http://127.0.0.1:8080';
const login = await fetch(`${api}/api/v1/auth/login`, {
  method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Company-Id': 'demo-company' },
  body: JSON.stringify({ email: 'admin@alfa.com', password: '1234' }),
});
assert.ok(login.ok);
const session = await login.json();
session.expiresAt = Date.now() + session.expiresIn * 1000;
const browser = await chromium.launch({ headless: false });
const page = await browser.newPage({ viewport: { width: 1500, height: 950 } });
await page.addInitScript(({ session, api }) => {
  localStorage.setItem('pika.auth.session', JSON.stringify(session));
  localStorage.setItem('pika.apiBaseUrl', api);
}, { session, api });
const errors = [];
page.on('pageerror', error => errors.push(error.message));
page.on('console', message => { if (message.type() === 'error') { errors.push(message.text()); console.log('BROWSER ERROR', message.text()); } });
process.on('uncaughtException', async error => {
  console.log('FAILED', error.message, 'pageErrors=', errors);
  console.log('PAGE STATE', await page.evaluate(() => ({ url: location.href, text: document.body.innerText.slice(0, 1600) })));
  await page.screenshot({ path: '/tmp/alfa-lab-failed.png' });
});
const requests = [];
page.on('request', request => requests.push(request.url()));
const results = { coldMs: 0, warmMs: [], volumeMs: 0, errors };
const lab = page.locator('[data-testid="lab-board"][data-ready="true"]');
let start = performance.now();
await page.goto(`${origin}/app/work-projects-lab`, { waitUntil: 'domcontentloaded' });
await lab.waitFor({ timeout: 60000 });
results.coldMs = performance.now() - start;
console.log('COLD', results.coldMs);
const afterInitialRequests = requests.slice();
assert.ok(!afterInitialRequests.some(url => /crm-equipment\/items|inventory\/state/.test(url)), 'Heavy detail data loaded on initial board');
await page.getByText('Modo compacto', { exact: false }).click();
await page.locator('[data-testid="lab-mine"]').click();
await page.locator('[data-testid="lab-mine"]').click();
const navigate = path => page.evaluate(path => {
  history.pushState({}, '', path);
  dispatchEvent(new PopStateEvent('popstate', { state: {} }));
}, path);
for (let index = 0; index < 3; index++) {
  await navigate('/app/main-menu');
  await lab.waitFor({ state: 'detached' });
  const elapsed = await page.evaluate(async () => {
    const start = performance.now();
    history.pushState({}, '', '/app/work-projects-lab');
    dispatchEvent(new PopStateEvent('popstate', { state: {} }));
    while (!document.querySelector('[data-testid="lab-board"][data-ready="true"]')) {
      await new Promise(resolve => requestAnimationFrame(resolve));
      if (performance.now() - start > 10000) throw Error('Lab navigation timeout');
    }
    await new Promise(resolve => requestAnimationFrame(resolve));
    return performance.now() - start;
  });
  results.warmMs.push(elapsed);
}
const date = new Date().toISOString();
const items = Array.from({ length: 10000 }, (_, i) => ({
  id: `lab-volume-${i}`, status: 'diagnostico', createdAt: date, updatedAt: date,
  properties: { title: `Prueba de laboratorio ${i}`, assignee: 'Ana', stageEnteredAt: date },
}));
const volumeRoute = '**/api/v1/projects?*';
await page.route(volumeRoute, route => {
  const params = new URL(route.request().url()).searchParams;
  const matching = items.filter(item => item.status === params.get('status'));
  return route.fulfill({ json: { items: matching.slice(0, Number(params.get('limit'))) } });
});
results.volumeMs = await page.evaluate(async () => {
  const start = performance.now();
  Array.from(document.querySelectorAll('button')).find(button => button.textContent.trim() === 'Actualizar').click();
  while (!document.querySelector('[data-testid="lab-more-diagnostico"]')) {
    await new Promise(resolve => requestAnimationFrame(resolve));
    if (performance.now() - start > 10000) throw Error('Lab data timeout');
  }
  await new Promise(resolve => requestAnimationFrame(resolve));
  return performance.now() - start;
});
assert.equal(await page.locator('[data-project-id]').count(), 12);
await page.locator('[data-testid="lab-more-diagnostico"]').click();
await page.waitForFunction(() => document.querySelectorAll('[data-project-id]').length === 24);
assert.equal(await page.locator('[data-project-id]').count(), 24);
await page.waitForTimeout(3000);
await page.screenshot({ path: '/tmp/alfa-lab-volume.png' });
console.log('RESULTS', JSON.stringify(results));
results.apiTimings = await page.evaluate(() => performance.getEntriesByType('resource')
  .filter(entry => entry.name.includes('/api/v1/projects'))
  .map(entry => ({ url: entry.name, ms: entry.duration, bytes: entry.transferSize })));
await fs.writeFile('/tmp/alfa-lab-performance.json', JSON.stringify(results, null, 2));
assert.equal(errors.length, 0);
assert.ok(Math.max(...results.warmMs) < 1000, 'Warm navigation exceeds 1 second');
assert.ok(results.volumeMs < 1000, 'Volume update exceeds 1 second');
await page.route('**/api/v1/projects/lab-volume-*', route => route.fulfill({ json: {
  ...items[0], ...(route.request().method() === 'PUT' ? route.request().postDataJSON() : {}),
} }));
await page.locator('[data-project-id]').first().click();
await page.locator('.project-detail-dialog.is-open').waitFor({ timeout: 30000 });
await page.locator('.project-detail-dialog__close').click();
await page.locator('.project-detail-dialog.is-open').waitFor({ state: 'detached' });
console.log('DETAIL: deferred open and close passed; project writes intercepted');
await page.unroute(volumeRoute);
await page.getByRole('button', { name: 'Actualizar', exact: true }).click();
await page.getByRole('link', { name: 'Abrir vista original', exact: true }).click();
await page.locator('app-work-projects .kanban-board').waitFor({ timeout: 30000 });
console.log('ORIGINAL: normal startup still works');
await page.goto(`${origin}/app/work-projects-lab`, { waitUntil: 'domcontentloaded' });
await lab.waitFor();
console.log('PASS — lab visible, original route unchanged');
await new Promise(() => {});
