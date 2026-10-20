import {createRequire} from 'node:module';
import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
const require=createRequire('/tmp/property-demo-browser/package.json');
const {chromium}=require('playwright');
const browser=await chromium.launch();
const html=readFileSync('demo/index.html','utf8');
try {
for(const width of [320,375,390,430,768,1280]){
 const page=await browser.newPage({viewport:{width,height:844},isMobile:width<761,hasTouch:width<761});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.setContent(html);
 assert.equal(await page.locator('.page.active').getAttribute('id'),'properties');
 const ids=await page.locator('.nav').evaluateAll(ns=>ns.map(n=>n.dataset.page));
 for(const id of ids){
  if(width<761){await page.locator('#menuToggle').click();await page.locator('#closeMenu').waitFor({state:'visible'});}
  await page.locator('.nav[data-page="'+id+'"]').click();
  assert.equal(await page.locator('.page.active').getAttribute('id'),id);
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Horizontal page overflow at '+width+' on '+id);
  if(width<761)assert.equal(await page.locator('#menuToggle').getAttribute('aria-expanded'),'false');
 }
 if(width<761){await page.locator('#menuToggle').click();await page.keyboard.press('Escape');assert.equal(await page.locator('#menuToggle').getAttribute('aria-expanded'),'false');}
 await page.evaluate(()=>showPage('properties'));
 await page.locator('#properties [data-property="1"]').click();
 assert.ok((await page.locator('#propertyDetail').innerText()).includes('Freehold ownership has no expiry'));
 assert.ok((await page.locator('#propertyDetail').innerText()).includes('30 Jun 2027'));
 await page.evaluate(()=>showPage('leaseDetail'));
 await page.locator('#adjustBtn').click();
 assert.ok(await page.locator('.modal').isVisible());
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
 await page.locator('#mcancel').click();
 assert.deepEqual(errors,[]);
 console.log('PASS navigation, property details, modal and width '+width);
 await page.close();
}
} finally {await browser.close();}
let live=false;
for(let i=0;i<24;i++){
 try {
 const r=await fetch('https://property-runway-demo.onrender.com/?v=property-mobile-v2',{signal:AbortSignal.timeout(20000)});
 const body=await r.text();
 if(r.ok&&body.includes('property-mobile-v2')){live=true;break;}
 } catch(error) {console.log('Waiting for Render:',error.message);}
 await new Promise(resolve=>setTimeout(resolve,10000));
}
assert.ok(live,'Updated demo must be live on Render');
console.log('PASS updated property and mobile demo is live on Render');
