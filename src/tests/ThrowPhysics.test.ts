import { describe, expect, it } from 'vitest';
import { FarmConfig } from '../config/BrandConfig';
import { GameEngine } from '../engine/GameEngine';
import { VirtualAdapter } from '../ar/ExperienceAdapter';
import { fieldLimit, predictArc, stepFlight, swipeToVelocity, type Flight } from '../engine/ThrowPhysics';
import { buildAnimal } from '../models/farmAnimals';

function flight(partial: Partial<Flight> = {}): Flight {
 return { id: 1, productId: 'grain', x: 0, y: 0.6, z: 0, vx: 0, vy: 4, vz: 0, age: 0, settled: false, spin: 0, ...partial };
}

describe('throw physics', () => {
 it('keeps a hard throw inside the field and settles on the ground', () => {
  const morsel = flight({ x: 0, z: 0, vx: 12, vy: 6, vz: -9 });
  for (let i = 0; i < 240 && !morsel.settled; i += 1) stepFlight(morsel, 1 / 30);
  expect(morsel.settled).toBe(true);
  expect(morsel.y).toBeLessThanOrEqual(0.03);
  expect(Math.abs(morsel.x)).toBeLessThanOrEqual(fieldLimit() + 1e-6);
  expect(Math.abs(morsel.z)).toBeLessThanOrEqual(fieldLimit() + 1e-6);
 });
 it('predicts an arc that ends where the same throw settles', () => {
  const velocity = swipeToVelocity(0.4, -0.2, 0.2, 0.5, { x: 0, z: -1 });
  const arc = predictArc({ x: 0.2, y: 0.62, z: 0.1 }, velocity);
  const morsel = flight({ x: 0.2, y: 0.62, z: 0.1, ...velocity });
  for (let i = 0; i < 240 && !morsel.settled; i += 1) stepFlight(morsel, 1 / 30);
  const end = arc[arc.length - 1];
  expect(Math.hypot(end.x - morsel.x, end.z - morsel.z)).toBeLessThan(0.2);
  expect(Math.abs(end.x)).toBeLessThanOrEqual(FarmConfig.halfSize);
 });
 it('places food where the throw lands and animals can eat it', () => {
  const game = new GameEngine(new VirtualAdapter());
  game.start();
  expect(game.launch('grain', { x: 0, y: 0.5, z: 0 }, { vx: 0.2, vy: 3, vz: 0.1 })).toBeNull();
  let escaped = 0;
  for (let i = 0; i < 200; i += 1) {
   game.update(1 / 30);
   for (const item of game.flights) escaped = Math.max(escaped, Math.abs(item.x), Math.abs(item.z));
   for (const drop of game.feeding.drops) escaped = Math.max(escaped, Math.abs(drop.position.x), Math.abs(drop.position.z));
  }
  expect(escaped).toBeLessThanOrEqual(FarmConfig.halfSize);
  expect(game.score.fed + game.feeding.drops.length).toBeGreaterThan(0);
 });
 it('builds rigs the loader can pose', () => {
  for (const species of ['chicken', 'chick', 'rabbit'] as const) {
   const rig = buildAnimal(species);
   expect(rig.getObjectByName('Body')).toBeTruthy();
   expect(rig.getObjectByName('Torso')).toBeTruthy();
   expect(rig.getObjectByName('Head')).toBeTruthy();
   expect(rig.getObjectByName('LegL')).toBeTruthy();
  }
  expect(buildAnimal('rabbit').getObjectByName('EarL')).toBeTruthy();
 });
});
