import { test, expect } from '@playwright/test';

test('a round shows dianas, scores a hit, respawns, and ranks points', async ({ page }) => {
 const errors: string[] = [];
 page.on('pageerror', error => errors.push(error.message));
 await page.goto('/');
 await expect(page.getByRole('button', { name: 'Activar cámara', exact: true })).toBeVisible();
 await expect(page.getByRole('button', { name: 'Cámara', exact: true })).toBeVisible();
 await page.screenshot({ path: 'test-results/targets-start.png', fullPage: true });
 await page.getByRole('button', { name: '¡A jugar! · 60 segundos' }).click();
 await expect(page.getByTestId('target')).toHaveCount(2);
 await expect(page.getByText('El centro de la diana suma más', { exact: false })).toBeVisible();
 const hit = await page.evaluate(() => {
  const engine = (window as unknown as { __foody: {
   targets: { active: { id: number; x: number; z: number }[] };
   feeding: { drops: unknown[] };
   score: { points: number; rings: number };
   placeFood: (position: { x: number; z: number }) => string | null;
  } }).__foody;
  const target = engine.targets.active[0];
  const before = { id: target.id, drops: engine.feeding.drops.length, points: engine.score.points };
  const error = engine.placeFood({ x: target.x, z: target.z });
  return {
   error,
   before,
   points: engine.score.points,
   rings: engine.score.rings,
   drops: engine.feeding.drops.length,
   gone: !engine.targets.active.some(item => item.id === before.id),
   count: engine.targets.active.length,
  };
 });
 expect(hit.error).toBeNull();
 expect(hit.gone).toBe(true);
 expect(hit.count).toBe(2);
 expect(hit.drops).toBe(hit.before.drops + 1);
 expect(hit.rings).toBeGreaterThan(0);
 expect(hit.points).toBeGreaterThan(hit.before.points);
 await expect(page.getByTestId('score')).toHaveText(String(hit.points));
 await expect(page.getByTestId('score-pop')).toContainText(`+${hit.rings}`);
 await page.locator('.farm').screenshot({ path: 'test-results/targets-hit.png' });
 await page.evaluate(() => {
  (window as unknown as { __foody: { update: (dt: number) => void } }).__foody.update(61);
 });
 await expect(page.getByRole('heading', { name: '¡Una granja llena de felicidad!' })).toBeVisible();
 await expect(page.getByRole('list', { name: 'Récords de hoy' })).toBeVisible();
 await expect(page.getByRole('link', { name: 'Guardar imagen' })).toBeVisible();
 const caption = await page.getByRole('textbox', { name: 'Texto para la historia' }).inputValue();
 expect(caption).toContain(String(hit.points));
 expect(caption).toContain('@foody');
 expect(caption).toContain('@Agroalimentos_SA');
 await page.screenshot({ path: 'test-results/targets-results.png', fullPage: true });
 expect(errors).toEqual([]);
});
