import { chromium } from "playwright";
const base=(process.env.PW_BASE_URL||"http://127.0.0.1:4200").replace(/\/$/,"");
const wait=p=>p.waitForTimeout(500);
const result={case:"LOG-06",frontendOnly:true,login:false,formOpened:false,blocked:false,error:""};let browser;
try{
 browser=await chromium.launch({headless:false,slowMo:500});const page=await(await browser.newContext()).newPage();
 await page.goto(`${base}/auth/signin`,{waitUntil:"networkidle"});await page.locator("#emailadd").fill(process.env.PW_USER_EMAIL||"admin@alfa.com");await wait(page);await page.locator("#passwd").fill(process.env.PW_USER_PASSWORD||"1234");await wait(page);await page.locator("form.auth-form button[type='submit']").click();await page.waitForURL(u=>u.href.includes("/app"));result.login=true;await wait(page);
 await page.goto(`${base}/app/remissions`,{waitUntil:"networkidle"});await page.getByTestId("create-remission-btn").click();await wait(page);result.formOpened=true;
 await page.getByTestId("remission-client").fill(`LOG06 QA ${Date.now()}`);await page.getByTestId("remission-contact-name").fill("Contacto QA");await page.getByTestId("dispatch-type-select").selectOption("servientrega");await wait(page);
 await page.getByTestId("add-remission-item").click();await wait(page);const inputs=page.locator("input[placeholder='Identificador']");await inputs.last().fill(`EQ-LOG06-${Date.now()}`);await page.locator("input[placeholder='Descripcion']").last().fill("Equipo QA");await wait(page);
 await page.locator("button").filter({hasText:"Guardar"}).last().click();await wait(page);const block=page.getByTestId("remission-save-block");await block.waitFor({state:"visible"});const text=await block.innerText();result.blocked=/transportadora|gu[ií]a|carrier/i.test(text);if(!result.blocked)throw new Error(`Mensaje inesperado: ${text}`);
}catch(e){result.error=String(e?.stack||e)}finally{if(browser)await browser.close()}console.log(JSON.stringify(result));process.exit(result.error?1:0);
