import { chromium } from 'playwright';
import assert from 'node:assert/strict';

const api = 'http://127.0.0.1:8080';
const response = await fetch(`${api}/api/v1/auth/login`, {
  method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Company-Id': 'demo-company' },
  body: JSON.stringify({ email: 'admin@alfa.com', password: '1234' }),
});
if (!response.ok) throw new Error(`Login ${response.status}`);
const session = await response.json();
session.expiresAt = Date.now() + session.expiresIn * 1000;
const browser = await chromium.launch({ headless: false });
const page = await browser.newPage({ viewport: { width: 1500, height: 950 } });
await page.addInitScript(({ session, api }) => {
  localStorage.setItem('pika.auth.session', JSON.stringify(session));
  localStorage.setItem('pika.apiBaseUrl', api);
}, { session, api });
const pageErrors = [];
page.on('pageerror', error => { pageErrors.push(error.message); console.log('PAGE ERROR', error.message); });
page.on('console', message => { if (message.type() === 'error') console.log('CONSOLE', message.text()); });
const cdp = await page.context().newCDPSession(page);
await cdp.send('Debugger.enable');
cdp.on('Debugger.paused', async event => {
  console.log('PAUSED STACK', JSON.stringify(event.callFrames.slice(0, 18).map(frame => ({ name: frame.functionName, url: frame.url, location: frame.location }))));
  await cdp.send('Debugger.resume');
});
console.log('Opening authenticated board in visible Chrome');
await page.setContent('<title>Prueba visible del tablero</title><h1>Prueba de work-projects</h1><p>Esperando a que termine la compilación local…</p>');
await page.bringToFront();
while (true) {
  try {
    const ready = await fetch('http://127.0.0.1:4200/', { signal: AbortSignal.timeout(3000) });
    if (ready.ok) break;
  } catch {}
  await new Promise(resolve => setTimeout(resolve, 2000));
}
const started = Date.now();
await page.goto('http://127.0.0.1:4200/app/work-projects', { waitUntil: 'domcontentloaded', timeout: 60000 });
console.log('DOM LOADED');
const pauseTimer = setTimeout(() => void cdp.send('Debugger.pause'), 15000);
try {
  await page.locator('.kanban-board').waitFor({ timeout: 20000 });
  clearTimeout(pauseTimer);
  console.log('BOARD VISIBLE', Date.now() - started, 'ms');
  await page.getByText('Modo compacto', { exact: true }).click({ timeout: 5000 });
  console.log('COMPACT TOGGLED');
  await page.locator('[data-testid="only-my-projects-toggle"]').click({ timeout: 5000 });
  await page.locator('[data-testid="only-my-projects-toggle"]').click({ timeout: 5000 });
  await page.waitForTimeout(10000);
  console.log('STABLE', await page.evaluate(() => ({
    columns: document.querySelectorAll('.kanban-column').length,
    spinner: !!document.querySelector('.spinner-border'),
  })));
  assert.equal(await page.locator('.spinner-border').count(), 0);
  assert.ok(await page.locator('.kanban-column').count() > 0);
  await page.screenshot({ path: '/tmp/alfa-board-visible.png' });
  const projects = Array.from({ length: 10000 }, (_, index) => ({
    id: `perf-${index}`, status: 'diagnostico', properties: { title: `Prueba de volumen ${index}`, boardId: 'board-1' },
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  }));
  await page.route('**/api/v1/projects', route => route.fulfill({ json: { items: projects } }));
  const volumeStarted = Date.now();
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.locator('[data-testid="load-more-projects-diagnostico"]').waitFor({ timeout: 20000 });
  console.log('VOLUME', JSON.stringify({ ms: Date.now() - volumeStarted, cards: await page.locator('[data-project-id]').count() }));
  assert.equal(await page.locator('[data-project-id]').count(), 40);
  await page.locator('[data-testid="load-more-projects-diagnostico"]').click();
  console.log('AFTER LOAD MORE', await page.locator('[data-project-id]').count());
  assert.equal(await page.locator('[data-project-id]').count(), 80);
  await page.screenshot({ path: '/tmp/alfa-board-volume-visible.png' });
  await page.unroute('**/api/v1/projects');
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.locator('.kanban-board').waitFor({ timeout: 20000 });
  if (pageErrors.length) throw new Error(`Page errors: ${pageErrors.join('; ')}`);
  console.log('PASS — visible browser remains open');
} catch (error) { console.log('CHECK FAILED', error.message); }
await new Promise(() => {});
