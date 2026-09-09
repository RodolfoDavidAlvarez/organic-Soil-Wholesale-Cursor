import assert from 'node:assert/strict';
import { mkdirSync } from 'node:fs';
import puppeteer from 'puppeteer';
const base=process.env.REP_BASE_URL||'http://127.0.0.1:4198';
const out=process.env.REP_QA_DIR||'/tmp/osw-representative-qa';mkdirSync(out,{recursive:true});
const browser=await puppeteer.launch({headless:true,args:['--no-sandbox']});
try{
  const page=await browser.newPage();
  for(const width of [390,1440]){
    await page.setViewport({width,height:844,deviceScaleFactor:1});
    for(const [id,name,phone,email] of [['rodolfo','Rodolfo Alvarez','+16028330615','ralvarez@soilseedandwater.com'],['sabrina','Sabrina Moses','+16029753224','sabrina@soilseedandwater.com'],['jonathan','Jonathan Carrasco','+19282324022','jcarrasco@soilseedandwater.com'],['astrid','Astrid Lopez','+16025841535','astrid@soilseedandwater.com'],['vanessa','Vanessa Martinez','+14807719889','vanessa@soilseedandwater.com']]){
      await page.goto(base+'/rep/'+id,{waitUntil:'networkidle2'});
      await page.waitForSelector('.representative-profile-page .identity h1');
      const state=await page.evaluate(()=>({name:document.querySelector('.identity h1').textContent,text:document.body.innerText,links:[...document.querySelectorAll('.representative-profile-page a')].map(a=>a.getAttribute('href')),overflow:document.documentElement.scrollWidth>innerWidth,broken:[...document.querySelectorAll('.representative-profile-page img')].filter(i=>!i.complete||!i.naturalWidth).map(i=>i.src),canonical:document.querySelector('link[rel=canonical]')?.href,excluded:document.documentElement.getAttribute('data-callrail-ignore'),smallTargets:[...document.querySelectorAll('.contact-actions a,.socials a,.save,.skb-shop,.skb-phone')].filter(a=>a.getBoundingClientRect().height<44).map(a=>a.textContent)}));
      assert.equal(state.name,name);assert.equal(state.overflow,false);assert.deepEqual(state.broken,[]);assert.deepEqual(state.smallTargets,[]);
      assert.equal(state.canonical,'https://www.organicsoilwholesale.com/rep/'+id);
      assert.equal(state.excluded,'true');assert(state.links.includes('tel:'+phone));assert(state.links.includes('sms:'+phone));assert(state.links.includes('mailto:'+email));
      assert(!/pending|Bio TEST|928.?550.?1649|bettersystems.ai/i.test(state.text));
      if(id==='sabrina'){assert(state.links.includes('tel:+15204796360'));assert(state.links.includes('https://sabrinakillsbugs.com/'));assert(!state.links.includes('tel:+16028330615'));}
      const contactUrl=state.links.find(x=>x.endsWith('.vcf'));const response=await fetch(base+contactUrl);assert(response.ok);const vcard=await response.text();assert(vcard.includes(name)&&vcard.includes(phone)&&vcard.includes(email));assert(vcard.includes('URL:https://www.organicsoilwholesale.com/rep/'+id));
      await page.screenshot({path:out+'/'+id+'-'+width+'.png',fullPage:true});
      console.log(JSON.stringify({base,id,width,phone,email,canonical:state.canonical,images:'loaded',overflow:false,contact:'matched'}));
    }
  }
}finally{await browser.close();}
