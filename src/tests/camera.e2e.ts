import { test,expect } from '@playwright/test';
test('camera denial preserves virtual gameplay',async({page})=>{
 await page.addInitScript(()=>{Object.defineProperty(navigator.mediaDevices,'getUserMedia',{value:async()=>{throw new DOMException('denied','NotAllowedError');}});});
 await page.goto('/');await page.getByRole('button',{name:'Activar cámara',exact:true}).click();
 await expect(page.getByRole('alert')).toContainText('no tiene permiso');
 await expect(page.getByText('Demo virtual',{exact:true})).toBeVisible();
 await page.getByRole('button',{name:'¡A jugar! · 60 segundos'}).click();await expect(page.getByTestId('timer')).toBeVisible();
});
test('camera overlay starts a video and stops its tracks on return',async({page})=>{
 await page.addInitScript(()=>{Object.defineProperty(navigator.mediaDevices,'getUserMedia',{value:async()=>{const canvas=document.createElement('canvas');canvas.width=640;canvas.height=480;const ctx=canvas.getContext('2d')!;ctx.fillStyle='#7caaa6';ctx.fillRect(0,0,640,480);const stream=canvas.captureStream(5);(window as unknown as {cameraTestStream:MediaStream}).cameraTestStream=stream;return stream;}});});
 await page.goto('/');await page.getByRole('button',{name:'Activar cámara',exact:true}).click();
 await expect(page.getByText('Cámara + granja',{exact:true})).toBeVisible();
 await expect(page.locator('video')).toBeVisible();
 await expect(page.getByText('Superposición sin rastreo físico',{exact:true})).toBeVisible();
 await page.screenshot({path:'test-results/camera-overlay.png',fullPage:true});
 await page.getByRole('button',{name:'Volver a modo virtual'}).click();
 await expect(page.locator('video')).toBeHidden();
 expect(await page.evaluate(()=>(window as unknown as {cameraTestStream:MediaStream}).cameraTestStream.getTracks().every(t=>t.readyState==='ended'))).toBe(true);
});
