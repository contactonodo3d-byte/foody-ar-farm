import {test,expect} from '@playwright/test';
test('real marker detector tracks synthetic video, pauses on loss, and restores camera mode',async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>{Object.defineProperty(navigator.mediaDevices,'getUserMedia',{value:async()=>{
  const canvas=document.createElement('canvas');canvas.width=640;canvas.height=480;
  const ctx=canvas.getContext('2d')!,image=new Image();image.src='/branding/foody-marker.svg';await image.decode();
  (window as unknown as {showMarker:boolean}).showMarker=true;
  const draw=()=>{ctx.fillStyle='white';ctx.fillRect(0,0,640,480);if((window as unknown as {showMarker:boolean}).showMarker)ctx.drawImage(image,230,150,180,180);requestAnimationFrame(draw);};draw();
  return canvas.captureStream(15);
 }});});
 await page.goto('/');await page.getByText('Prueba técnica opcional con marcador',{exact:true}).click();await page.getByRole('button',{name:'Probar AR con marcador',exact:true}).click();
 await expect(page.getByText('AR con marcador',{exact:true})).toBeVisible();
 await expect(page.getByText('Marcador reconocido. Mantenelo dentro de la imagen.',{exact:true})).toBeVisible({timeout:15000});
 await page.getByRole('button',{name:'¡A jugar! · 60 segundos'}).click();
 await expect(page.locator('button.serve')).toBeEnabled();
 await page.screenshot({path:'test-results/marker-tracked.png',fullPage:true});
 await page.evaluate(()=>{(window as unknown as {showMarker:boolean}).showMarker=false;});
 await expect(page.locator('button.serve')).toBeDisabled();
 const frozen=await page.getByTestId('timer').innerText();await page.waitForTimeout(1200);await expect(page.getByTestId('timer')).toHaveText(frozen);
 await page.evaluate(()=>{(window as unknown as {showMarker:boolean}).showMarker=true;});
 await page.locator('.farm').scrollIntoViewIfNeeded();
 await expect(page.locator('button.serve')).toBeEnabled({timeout:10000});
 await page.getByRole('button',{name:'Dejar de rastrear marcador'}).click();await expect(page.getByText('Cámara + granja',{exact:true})).toBeVisible();
 await page.getByRole('button',{name:'Volver a modo virtual'}).click();await expect(page.getByText('Demo virtual',{exact:true})).toBeVisible();
 expect(errors).toEqual([]);
});
test('local AR diagnostics distinguishes video APIs from world tracking',async({page})=>{
 await page.addInitScript(()=>{Object.defineProperty(navigator,'xr',{value:undefined});});
 await page.goto('/');await page.getByText('¿Puede este teléfono anclar la granja al piso?',{exact:true}).click();
 await expect(page.getByText('No disponible en este navegador',{exact:true})).toBeVisible();
 await expect(page.getByText('API disponible; permiso pendiente',{exact:true})).toBeVisible();
});
