import {test,expect} from '@playwright/test';
test('official local SDK initializes SLAM without camera or external requests',async({page})=>{
 test.setTimeout(60000);
 const requests:string[]=[],external:string[]=[];
 await page.route('**/*',route=>{
  const url=new URL(route.request().url());
  if(['127.0.0.1','localhost'].includes(url.hostname))return route.continue();
  external.push(url.origin);return route.abort();
 });
 page.on('request',request=>requests.push(request.url()));
 await page.addInitScript(()=>{(window as unknown as {cameraRequests:number}).cameraRequests=0;Object.defineProperty(navigator.mediaDevices,'getUserMedia',{value:async()=>{(window as unknown as {cameraRequests:number}).cameraRequests++;throw new DOMException('Test does not access hardware','NotAllowedError');}});});
 await page.goto('/');
 await expect(page.getByRole('button',{name:'Probar AR sin marcador',exact:true})).toBeEnabled();
 const initialized=await page.evaluate(async()=>{
  const path='/src/ar/XR8Loader.ts';
  const {loadXR8}=await import(path);
  const runtime=await loadXR8();
  return {initialized:runtime.isInitialized?.(),controller:typeof runtime.XrController?.configure,hitTest:typeof runtime.XrController?.hitTest,cameraRequests:(window as unknown as {cameraRequests:number}).cameraRequests};
 });
 expect(initialized).toMatchObject({initialized:true,controller:'function',hitTest:'function',cameraRequests:0});
 expect(requests.some(url=>url.includes('/vendor/xr8/xr-slam.js'))).toBe(true);
 expect(external).toEqual([]);
 await expect(page.getByText('Demo virtual',{exact:true})).toBeVisible();
});
test('actual SDK startup failure restores the virtual game without hardware access',async({page})=>{
 test.setTimeout(60000);
 await page.route('**/*',route=>{const url=new URL(route.request().url());return ['127.0.0.1','localhost'].includes(url.hostname)?route.continue():route.abort();});
 await page.addInitScript(()=>{Object.defineProperty(navigator.mediaDevices,'getUserMedia',{value:async()=>{throw new DOMException('Camera intentionally blocked by test','NotAllowedError');}});});
 page.on('dialog',dialog=>void dialog.dismiss());
 await page.goto('/');await page.getByRole('button',{name:'Probar AR sin marcador',exact:true}).click();
 await expect(page.locator('.world-controls [role=alert]')).toBeVisible({timeout:35000});
 await expect(page.getByText('Demo virtual',{exact:true})).toBeVisible();
 await page.getByRole('button',{name:'¡A jugar! · 60 segundos'}).click();await expect(page.getByTestId('timer')).toBeVisible();
});
