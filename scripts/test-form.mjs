import {server} from '../server.mjs';
import {chromium} from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import assert from 'node:assert/strict';
await new Promise(r=>server.listen(4194,'127.0.0.1',r));
const browser=await chromium.launch({...(process.env.PLAYWRIGHT_EXECUTABLE_PATH ? {executablePath:process.env.PLAYWRIGHT_EXECUTABLE_PATH,args:['--no-sandbox','--disable-gpu','--single-process','--no-zygote']} : {})});
try{
const context=await browser.newContext({bypassCSP:true,reducedMotion:'reduce'});const page=await context.newPage();
await page.goto('http://127.0.0.1:4194/kontakt.html');
await page.locator('form button').click();
assert.equal(await page.locator('[aria-invalid="true"]').count(),3);
assert.equal(await page.locator('[data-form-errors]').evaluate(e=>e===document.activeElement),true);
await page.locator('[data-form-errors] a').first().click();
assert.equal(await page.locator('#example-name').evaluate(e=>e===document.activeElement),true);
await page.locator('#example-name').fill('Anna');await page.locator('#example-email').fill('bledny');await page.locator('#example-message').fill('Chcę sprawdzić sklep.');
await page.locator('form button').click();assert.equal(await page.locator('[aria-invalid="true"]').count(),1);assert.equal(await page.locator('#example-name').inputValue(),'Anna');
let checks=0;
for(const theme of ['light','dark','reading']){await page.locator(`[data-theme-choice="${theme}"]`).click();for(const width of [1280,320]){await page.setViewportSize({width,height:900});const scan=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag2aaa','wcag21aa','wcag22aa','wcag22aaa']).analyze();assert.deepEqual(scan.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)})),[]);checks++;}}
await page.locator('#example-email').fill('anna@example.com');await page.locator('form button').click();assert.equal(await page.locator('[aria-invalid="true"]').count(),0);assert.match(await page.locator('[data-form-result]').textContent(),/wiadomość nie została wysłana/);
await page.locator('[data-text-size-choice="aaa"]').click();assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true);

console.log(JSON.stringify({axeStates:checks,emptyErrors:true,errorFocus:true,errorLink:true,emailValidation:true,valuesPreserved:true,success:true,noOverflowAt200:true}));
}finally{await browser.close();server.close();}
