import { test, expect } from '@playwright/test';

test('flick throws food and the round can still be served with the button', async ({ page }) => {
 const errors: string[] = []; page.on('pageerror', e => errors.push(e.message));
 await page.goto('/');
 await page.getByRole('button', { name: '¡A jugar! · 60 segundos' }).click();
 await expect(page.getByText('Mantené el campo, deslizá y soltá para tirar.')).toBeVisible();
 const canvas = page.locator('canvas[data-engine]');
 const box = await canvas.boundingBox();
 if (!box) throw new Error('missing farm canvas');
 await page.mouse.move(box.x + box.width * 0.48, box.y + box.height * 0.58);
 await page.mouse.down();
 await page.mouse.move(box.x + box.width * 0.55, box.y + box.height * 0.48, { steps: 6 });
 await page.mouse.up();
 await expect(page.getByText('¡Ahí va', { exact: false })).toBeVisible();
 await expect(page.getByTestId('score')).not.toHaveText('0', { timeout: 20000 });
 expect(errors).toEqual([]);
});

test('results card names Foody and the stand QR uses the public URL', async ({ page }) => {
 await page.clock.install();
 await page.goto('/');
 await page.getByRole('button', { name: '¡A jugar! · 60 segundos' }).click();
 await page.clock.fastForward(61000);
 await page.clock.runFor(300);
 await expect(page.getByText('Etiquetá a @foody en tu historia')).toBeVisible();
 await expect(page.getByRole('button', { name: 'Copiar texto' })).toBeVisible();
 await expect(page.getByRole('link', { name: 'fabrizzioruiz.com' })).toBeVisible();
 await expect(page.getByRole('link', { name: 'WhatsApp' })).toHaveAttribute('href', /wa\.me\/595972780989/);
 await page.goto('/?stand=1');
 await expect(page.getByRole('heading', { name: 'Foody AR Farm' })).toBeVisible();
 await expect(page.getByText('https://fabrizzioruiz.com/lab/foody-ar-game/')).toBeVisible();
 await expect(page.getByRole('img', { name: /Código QR/ })).toBeVisible();
});
