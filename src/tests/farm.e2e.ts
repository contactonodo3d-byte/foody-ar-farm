import { test, expect } from '@playwright/test';
test('mobile farm renders and virtual boundaries respond',async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/');await expect(page.getByRole('heading',{name:'Tu pequeña granja'})).toBeVisible();
 await expect(page.locator('canvas[data-engine]')).toBeVisible();await page.waitForTimeout(1500);
 await page.getByText('Mover explorador y probar límites',{exact:true}).click();
 await page.getByRole('button',{name:'Probar límites'}).click();
 for(const state of ['SAFE','WARNING','DANGER','OUTSIDE']){await page.getByRole('button',{name:state,exact:true}).click();await expect(page.getByTestId('boundary-state')).toContainText(state);}
 await page.getByRole('button',{name:'Centrar',exact:true}).click();await expect(page.getByTestId('boundary-state')).toContainText('SAFE');
 await page.getByRole('button',{name:'Mover a la derecha',exact:true}).click();await expect(page.getByLabel('Posición x')).toHaveValue('0.15');
 await page.keyboard.press('ArrowRight');await expect(page.getByLabel('Posición x')).toHaveValue('0.3');
 await page.locator('canvas[data-engine]').tap({position:{x:190,y:170}});
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 expect(errors).toEqual([]);await page.screenshot({path:'test-results/mobile-farm.png',fullPage:true});
});

test('capture warnings on all four edges and a corner', async({page})=>{
 await page.goto('/');
 await page.getByText('Mover explorador y probar límites',{exact:true}).click();
 await page.getByRole('button',{name:'Probar límites'}).click();
 for(const [name,x,z] of [['east',1.35,0],['west',-1.35,0],['south',0,1.35],['north',0,-1.35],['corner',1.35,1.35]] as const){
  await page.getByLabel('Posición x').fill(String(x));
  await page.getByLabel('Posición z').fill(String(z));
  await expect(page.getByTestId('boundary-state')).toContainText('DANGER');
  await page.waitForTimeout(900);
  await page.locator('.farm').screenshot({path:`test-results/wall-${name}.png`});
 }
});
