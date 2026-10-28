import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const base = process.env.APP_URL || 'http://127.0.0.1:4200';
const api = process.env.API_URL || 'https://alfa.software.net.co';
const login = await fetch(`${api}/api/v1/auth/login`, {
  method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Company-Id': 'demo-company' },
  body: JSON.stringify({ email: process.env.PW_ADMIN_EMAIL || 'admin@alfa.com', password: process.env.PW_ADMIN_PASSWORD || '1234' }),
});
assert.ok(login.ok, `Login HTTP ${login.status}`);
const session = await login.json();
session.expiresAt = Date.now() + session.expiresIn * 1000;
const prospect = {
  id: 'qa-prospect-safe', salutation: 'Sr.', name: 'Pepito QA', email: '', mobile: '', nit: '900123456-7', zone: 'General', prospectValue: 0,
  allowFollowUp: true, quotations: 0, assignedEmployee: 'Comercial QA', status: 'Pendiente', service: '', company: 'Empresa QA', website: '', officePhone: '', country: '', city: '', address: '', source: '', category: '', note: '', createdAt: '2026-10-28T14:00:00Z', branches: [],
};
const browser = await chromium.launch({ headless: false });
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const errors = []; let deletedId = '';
  page.on('pageerror', error => errors.push(error.message));
  await page.addInitScript(({ session, api }) => { localStorage.setItem('pika.auth.session', JSON.stringify(session)); localStorage.setItem('pika.apiBaseUrl', api); }, { session, api });
  await page.route('**/api/v1/crm/clients?*', route => route.fulfill({ json: { items: [] } }));
  await page.route('**/api/v1/crm/catalogs', route => route.fulfill({ json: { employees: [], sources: [], categories: [], services: [], zones: [] } }));
  await page.route('**/api/v1/crm/prospects/qa-prospect-safe/followups', route => route.fulfill({ status: 500, json: { error: 'Simulación de fallo' } }));
  await page.route('**/api/v1/crm/prospects/qa-prospect-safe', route => {
    if (route.request().method() === 'DELETE') { deletedId = 'qa-prospect-safe'; return route.fulfill({ status: 204 }); }
    return route.continue();
  });
  await page.route('**/api/v1/crm/prospects', route => route.fulfill({ json: { items: deletedId ? [] : [prospect] } }));
  await page.goto(`${base}/app/crm-prospectos`, { waitUntil: 'networkidle' });
  await page.locator('button').filter({ hasText: /Agregar Prospecto/i }).click();
  const nit = page.locator('#prospect-nit');
  await nit.fill('9001234567');
  await expectClass(nit, 'is-invalid');
  assert.equal(await page.getByTestId('prospect-save-btn').isDisabled(), true);
  await nit.fill('900123456-7');
  assert.equal(await nit.evaluate(node => node.classList.contains('is-invalid')), false);
  assert.equal(await page.getByTestId('prospect-save-btn').isDisabled(), false);
  await page.locator('button').filter({ hasText: /Cerrar/i }).click();
  await page.locator('tr', { hasText: 'Pepito QA' }).locator('button.dropdown-toggle').click();
  await page.getByRole('button', { name: 'Eliminar prospecto' }).click();
  await page.getByRole('dialog', { name: 'Eliminar prospecto' }).getByRole('button', { name: 'Sí, eliminar' }).click();
  await page.waitForFunction(() => document.body.textContent?.includes('No encontramos prospectos'));
  assert.equal(deletedId, 'qa-prospect-safe');
  assert.deepEqual(errors, []);
  await page.screenshot({ path: '/tmp/alfa-prospect-nit-delete-traceability.png', fullPage: true });
  console.log(JSON.stringify({ visible: true, deletedId, errors }));
} finally { await browser.close(); }

async function expectClass(locator, className) {
  await locator.evaluate((node, expected) => { if (!node.classList.contains(expected)) throw new Error(`Expected ${expected}`); }, className);
}
