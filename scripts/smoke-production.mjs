import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import {chromium} from '@playwright/test';
const prefix='/lab/foody-ar-game/',root=resolve('dist');
const types={'.html':'text/html','.js':'application/javascript','.css':'text/css','.json':'application/json','.wasm':'application/wasm','.svg':'image/svg+xml'};
const server=createServer(async(req,res)=>{
 try{
  const url=new URL(req.url,'http://localhost');if(!url.pathname.startsWith(prefix)){res.writeHead(404);res.end();return;}
  const file=resolve(root,decodeURIComponent(url.pathname.slice(prefix.length))||'index.html');
  if(!file.startsWith(root+'/'))throw new Error('Invalid path');
  const data=await readFile(file);res.writeHead(200,{'Content-Type':types[extname(file)]||'application/octet-stream'});res.end(req.method==='HEAD'?undefined:data);
 }catch{res.writeHead(404);res.end();}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const origin=`http://127.0.0.1:${server.address().port}`;
let browser;
try{
 browser=await chromium.launch({channel:'chrome',headless:true});
 const page=await browser.newPage({viewport:{width:390,height:844}}),failures=[];
 page.on('response',r=>{if(r.status()>=400)failures.push(`${r.status()} ${r.url()}`);});
 await page.route('**/*',r=>new URL(r.request().url()).origin===origin?r.continue():r.abort());
 await page.addInitScript(()=>{navigator.mediaDevices.getUserMedia=async()=>{throw new DOMException('Production smoke test blocks camera','NotAllowedError');};});
 await page.goto(origin+prefix);await page.getByRole('heading',{name:'Tu pequeña granja'}).waitFor();
 await page.getByRole('button',{name:'Probar AR sin marcador',exact:true}).click();
 await page.waitForFunction(()=>window.XR8?.isInitialized?.(),{},{timeout:45000});
 if(failures.length)throw new Error(failures.join('\n'));
 const links=await page.locator('a[aria-label="Foody inicio"]').getAttribute('href');
 if(links!==prefix)throw new Error('Home link escaped subpath');
 const marker=await page.request.get(origin+prefix+'marker.html');if(!marker.ok())throw new Error('Missing printable marker');
 console.log('PASS: production subpath, game, same-origin XR8/SLAM/WASM initialization and marker. Camera blocked intentionally.');
}finally{await browser?.close();server.close();}
