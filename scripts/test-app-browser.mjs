import {createRequire} from 'node:module';import assert from 'node:assert/strict';import {spawn} from 'node:child_process';
const require=createRequire('/tmp/property-app-browser/package.json');const {chromium}=require('playwright');
const server=spawn(process.execPath,['node_modules/next/dist/bin/next','dev','-H','127.0.0.1','-p','3001'],{env:{...process.env,NODE_ENV:'development',DEMO_ONLY:'false',ALLOW_DEV_AUTH:'true',DEV_ORG_SLUG:'acme-demo',DEV_USER_EMAIL:'owner@example.com'},stdio:'inherit'});
let browser;
try{
 let ready=false;for(let i=0;i<90;i++){try{const r=await fetch('http://127.0.0.1:3001/api/health');if(r.ok){ready=true;break}}catch{}await new Promise(r=>setTimeout(r,1000))}
 assert.ok(ready,'Application must start');browser=await chromium.launch();
 for(const width of [375,768,1280]){
  const page=await browser.newPage({viewport:{width,height:844},isMobile:width<761});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  for(const route of ['/properties','/properties/new','/runway','/leases','/settings']){
   await page.goto('http://127.0.0.1:3001'+route);
   await page.locator('h1').waitFor();
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Overflow '+route+' at '+width);
  }
  if(width<761){await page.getByRole('button',{name:'☰ Menu'}).click();await page.getByRole('link',{name:'Property register',exact:true}).click();await page.waitForURL('**/properties');assert.equal(await page.getByRole('button',{name:'☰ Menu'}).getAttribute('aria-expanded'),'false');}
  await page.goto('http://127.0.0.1:3001/properties/new');
  await page.getByLabel('Name',{exact:true}).fill('Browser Freehold '+width);
  await page.getByLabel('Reference',{exact:true}).fill('BROWSER-'+width);
  await page.getByLabel('Address',{exact:true}).fill('10 Sample Street');
  await page.getByLabel('Tenure',{exact:true}).selectOption('FREEHOLD');
  await page.getByRole('button',{name:'Save property',exact:true}).click();
  await page.waitForURL(url=>url.pathname.startsWith('/properties/')&&url.pathname!=='/properties/new');
  assert.ok((await page.locator('main').innerText()).includes('Freehold ownership has no expiry'));
  await page.getByText('+ Add a property event',{exact:true}).click();
  await page.getByLabel('Event title').fill('Building inspection');
  await page.getByLabel('Type',{exact:true}).selectOption('COMPLIANCE');
  await page.getByLabel('Event date',{exact:true}).fill('2028-06-30');
  await page.getByLabel('Confirmed notice / action deadline').fill('2028-05-31');
  await page.getByRole('button',{name:'Add event',exact:true}).click();
  await page.locator('summary').filter({hasText:'Building inspection'}).waitFor();
  await page.goto('http://127.0.0.1:3001/properties?q=BROWSER-'+width);
  assert.ok((await page.locator('main').innerText()).includes('1 matching active properties'));
  assert.deepEqual(errors,[]);
  console.log('PASS full app mobile navigation, property creation, confirmed event and search at '+width);
  await page.close();
 }
}finally{if(browser)await browser.close();server.kill('SIGTERM');}
