import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const base = 'http://127.0.0.1:4200', api = 'http://127.0.0.1:8080';
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
const errors = [], requests = [];
page.on('pageerror', error => { errors.push(error.message); console.log('PAGE ERROR', error.message); });
page.on('console', message => { if (message.type() === 'error' && /ERROR|TypeError|NG\d+/.test(message.text())) errors.push(message.text()); });
page.on('request', request => requests.push(request.url()));
const date = new Date().toISOString();
const projects = Array.from({ length: 10000 }, (_, index) => ({
  id: `compact-regression-${index}`, status: 'diagnostico', createdAt: date, updatedAt: date,
  properties: { title: `Equipo de prueba ${index}`, equipmentIdentifier: `EQ-${index}`, stageEnteredAt: date },
}));
await page.route('**/api/v1/projects', route => route.fulfill({ json: { items: projects } }));
await page.route('**/api/v1/worktime/holidays?*', route => route.fulfill({ json: { items: [] } }));
await page.route(/\/api\/v1\/crm-equipment\/items(?:\?|$)/, route => route.fulfill({ json: { items: [{
  recordId: 'qa-record', itemId: 'qa-item', prospectId: 1, displayName: 'Equipo diferido QA',
  prospectName: 'Cliente QA', receivedIdentifier: 'QA-EQ', repairStatus: 'recibido',
}] } }));
await page.route('**/api/v1/projects/compact-regression-*', route => route.fulfill({ json: {
  ...projects[0], ...(route.request().method() === 'PUT' ? route.request().postDataJSON() : {}),
} }));
const started = performance.now();
await page.goto(`${base}/app/work-projects`, { waitUntil: 'domcontentloaded' });
await page.locator('.compact-code-chip').first().waitFor({ timeout: 60000 });
console.log('OFFICIAL BOARD LOADED', Math.round(performance.now() - started), 'ms');
const toggle = page.getByRole('checkbox', { name: 'Modo compacto' });
assert.equal(await toggle.isChecked(), true);
assert.equal(await page.locator('app-project-card').count(), 0);
assert.equal(await page.locator('.project-drag-item').count(), 12);
await page.waitForTimeout(3000);
const holidayCount = () => requests.filter(url => url.includes('/worktime/holidays?')).length;
assert.equal(holidayCount(), 3, 'Empty holiday calendar must not refetch forever');
assert.equal(requests.filter(url => new URL(url).pathname === '/api/v1/projects').length, 1, 'First load must not fetch the project snapshot twice');
assert.ok(!requests.some(url => /crm-equipment\/items|inventory\/state|@zxing_browser/.test(url)), 'Detail/scanner data must load on demand');
await toggle.uncheck();
await page.locator('app-project-card').first().waitFor();
assert.equal(await page.locator('app-project-card').count(), 12);
for (let index = 0; index < 3; index++) { await toggle.check(); await toggle.uncheck(); }
await page.waitForTimeout(2000);
assert.equal(holidayCount(), 3);
await page.screenshot({ path: '/tmp/alfa-official-full.png' });
await toggle.check();
await page.screenshot({ path: '/tmp/alfa-official-compact.png' });
await page.locator('.compact-code-chip').first().click();
await page.locator('.project-detail-dialog.is-open').waitFor({ timeout: 30000 });
await page.locator('select option').filter({ hasText: 'Equipo diferido QA' }).first().waitFor({ state: 'attached' });
await page.locator('.project-detail-dialog__close').click();
await page.locator('.compact-code-chip').first().waitFor();
assert.equal(await toggle.isChecked(), true);
assert.equal(errors.length, 0);
console.log('PASS OFFICIAL: default compact, full toggle, 10000 cases/12 mounted, bounded holiday requests, deferred detail, open/close');
await page.unrouteAll({ behavior: 'wait' });
await page.reload({ waitUntil: 'domcontentloaded' });
await page.locator('app-kanban-view').waitFor({ timeout: 30000 });
await page.waitForTimeout(1000);
assert.equal(await toggle.isChecked(), true);
assert.equal(errors.length, 0);
console.log('REAL OFFICIAL BOARD: loaded; visible window remains open');
await new Promise(() => {});
