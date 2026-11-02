import {test,expect} from '@playwright/test';
test('native share gets a PNG and cancellation leaves download available',async({page})=>{
 await page.addInitScript(()=>{
  Object.defineProperty(navigator,'canShare',{value:()=>true});
  Object.defineProperty(navigator,'share',{value:async(data:ShareData)=>{
   const file=data.files?.[0];(window as unknown as {sharedFile:unknown}).sharedFile={type:file?.type,name:file?.name,size:file?.size};
   throw new DOMException('cancelled','AbortError');
  }});
 });
 await page.clock.install();
 await page.goto('/');await page.getByRole('button',{name:'¡A jugar! · 60 segundos'}).click();
 await page.getByRole('button',{name:'Activar sonido',exact:true}).click();await expect(page.getByRole('button',{name:'Silenciar sonido'})).toBeVisible();
 await page.clock.fastForward(61000);await page.clock.runFor(300);
 await expect(page.getByRole('heading',{name:'¡Una granja llena de felicidad!'})).toBeVisible();
 await page.getByRole('button',{name:'Compartir resultado'}).click();
 expect(await page.evaluate(()=>(window as unknown as {sharedFile:{type:string;name:string}}).sharedFile)).toMatchObject({type:'image/png',name:'mi-granja-foody.png'});
 await expect(page.getByRole('link',{name:'Guardar imagen'})).toBeVisible();
 await expect(page.getByText('No se pudo compartir.',{exact:false})).toHaveCount(0);
});
test('unsupported spatial AR keeps a playable virtual experience',async({page})=>{
 await page.addInitScript(()=>{Object.defineProperty(navigator,'xr',{value:undefined});});
 await page.goto('/');await expect(page.getByText('AR espacial no disponible en este navegador.')).toBeVisible();
 await expect(page.getByRole('button',{name:'Probar AR espacial · experimental'})).toHaveCount(0);
 await page.getByRole('button',{name:'¡A jugar! · 60 segundos'}).click();await expect(page.getByTestId('timer')).toBeVisible();
});
test('rejected immersive session returns an honest fallback',async({page})=>{
 await page.addInitScript(()=>{Object.defineProperty(navigator,'xr',{value:{isSessionSupported:async()=>true,requestSession:async()=>{throw new DOMException('not supported','NotSupportedError');}}});});
 await page.goto('/');await page.getByRole('button',{name:'Probar AR espacial · experimental'}).click();
 await expect(page.getByText('No se pudo iniciar AR espacial con detección de piso y controles. Usá la demo o el modo cámara.')).toBeVisible();
 await expect(page.getByText('Demo virtual',{exact:true})).toBeVisible();
});
