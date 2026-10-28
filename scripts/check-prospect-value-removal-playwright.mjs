import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const base = process.env.APP_URL || 'http://127.0.0.1:4200';
const api = process.env.API_URL || 'https://alfa.software.net.co';
const login = await fetch(`${api}/api/v1/auth/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'X-Company-Id': 'demo-company' },
  body: JSON.stringify({ email: process.env.PW_ADMIN_EMAIL || 'admin@alfa.com', password: process.env.PW_ADMIN_PASSWORD || '1234' }),
});
assert.ok(login.ok, `Login HTTP ${login.status}`);
const session = await login.json();
session.expiresAt = Date.now() + session.expiresIn * 1000;
const browser = await chromium.launch({ headless: false });
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const errors = [];
  let payload;
  page.on('pageerror', error => errors.push(error.message));
  await page.addInitScript(({ session, api }) => {
    localStorage.setItem('pika.auth.session', JSON.stringify(session));
    localStorage.setItem('pika.apiBaseUrl', api);
  }, { session, api });
  await page.route('**/api/v1/crm/clients?*', route => route.fulfill({ json: { items: [] } }));
  await page.route('**/api/v1/crm/prospects', async route => {
    if (route.request().method() !== 'POST') return route.continue();
    payload = route.request().postDataJSON();
    await route.fulfill({ status: 422, json: { error: 'Prueba sin crear registros', message: 'Prueba sin crear registros' } });
  });
  await page.goto(`${base}/app/crm-prospectos`, { waitUntil: 'networkidle' });
  const company = page.locator('#prospect-company');
  if (!await company.isVisible()) {
    await page.locator('button').filter({ hasText: /Agregar Prospecto/i }).click();
  }
  await page.locator('#prospect-contact-name').fill('Prueba sin persistencia');
  await company.fill('QA sin persistencia');
  assert.equal(await page.locator('[name="formValor"]').count(), 0);
  assert.equal(await page.getByText(/Valor del prospecto|Valor potencial/i).count(), 0);
  await page.getByTestId('prospect-save-btn').click();
  await page.waitForFunction(() => document.querySelector('.alert-danger')?.textContent?.includes('Prueba sin crear registros'));
  assert.equal(payload.prospectValue, 0);
  assert.equal(payload.name, 'Prueba sin persistencia');
  assert.deepEqual(errors, []);
  await page.screenshot({ path: '/tmp/alfa-prospect-value-removed.png', fullPage: true });
  console.log(JSON.stringify({ base, visible: true, estimatedValueControls: 0, createPayloadValue: payload.prospectValue, errors }));
} finally {
  await browser.close();
}
