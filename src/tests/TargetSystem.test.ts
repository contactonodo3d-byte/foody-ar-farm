import { describe, expect, it } from 'vitest';
import { AnimalAI } from '../engine/AnimalAI';
import { VirtualAdapter } from '../ar/ExperienceAdapter';
import { GameEngine } from '../engine/GameEngine';
import { SPREAD_BONUS, ScoreSystem } from '../engine/ScoreSystem';
import { TargetRules, TargetSystem, coversBarn, fullyInside, innerLimit, outerRadius, overlapsTargets, ringPoints } from '../engine/TargetSystem';

function mulberry(seed: number) {
 let state = seed >>> 0;
 return () => {
  state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
  return state / 4294967296;
 };
}

describe('diana rings', () => {
 it('scores the bullseye, then less on each outer ring', () => {
  const [bull, mid, outer] = TargetRules.rings;
  expect(ringPoints(0)).toBe(bull.points);
  expect(ringPoints(bull.radius)).toBe(bull.points);
  expect(ringPoints(bull.radius + 0.001)).toBe(mid.points);
  expect(ringPoints(mid.radius)).toBe(mid.points);
  expect(ringPoints(mid.radius + 0.001)).toBe(outer.points);
  expect(ringPoints(outer.radius)).toBe(outer.points);
  expect(ringPoints(outer.radius + 0.001)).toBeNull();
  expect(bull.points).toBeGreaterThan(mid.points);
  expect(mid.points).toBeGreaterThan(outer.points);
  expect(ringPoints(-0.1)).toBeNull();
  expect(ringPoints(Number.NaN)).toBeNull();
 });

 it('spawns every target fully inside the field, clear of the barn and of each other', () => {
  for (let seed = 1; seed <= 40; seed += 1) {
   const animals = new AnimalAI(seed).animals;
   const system = new TargetSystem(mulberry(seed));
   system.reset(animals);
   expect(system.active).toHaveLength(TargetRules.count);
   for (const target of system.active) {
    expect(fullyInside(target)).toBe(true);
    expect(Math.abs(target.x)).toBeLessThanOrEqual(innerLimit() + 1e-6);
    expect(Math.abs(target.z)).toBeLessThanOrEqual(innerLimit() + 1e-6);
    expect(coversBarn(target)).toBe(false);
    expect(Math.abs(target.x) + outerRadius()).toBeLessThanOrEqual(1.5 + 1e-6);
    expect(Math.abs(target.z) + outerRadius()).toBeLessThanOrEqual(1.5 + 1e-6);
   }
   const [first, second] = system.active;
   expect(overlapsTargets(first, [second])).toBe(false);
   expect(Math.hypot(first.x - second.x, first.z - second.z)).toBeGreaterThanOrEqual(outerRadius() * 2 + TargetRules.gap - 1e-6);
  }
 });

 it('prefers a spot that is not under an animal when another spot is free', () => {
  const sequence = [0.5, 0.5, 0.92, 0.18];
  let index = 0;
  const system = new TargetSystem(() => sequence[index++]);
  const placed = system.spawn([{ position: { x: 0, z: 0 } }], null);
  expect(placed).not.toBeNull();
  expect(Math.hypot(placed!.x, placed!.z)).toBeGreaterThan(outerRadius());
 });

 it('removes a hit target and respawns another inside the field', () => {
  const system = new TargetSystem(mulberry(7));
  system.reset([]);
  const target = system.active[0];
  const before = system.active.map(item => item.id);
  const hit = system.claim({ x: target.x, z: target.z }, 1, []);
  expect(hit?.points).toBe(TargetRules.rings[0].points);
  expect(hit?.id).toBe(target.id);
  expect(system.active.some(item => item.id === target.id)).toBe(false);
  expect(system.active).toHaveLength(TargetRules.count);
  expect(system.active.map(item => item.id)).not.toEqual(before);
  expect(system.pops).toHaveLength(1);
  for (const next of system.active) expect(fullyInside(next)).toBe(true);
  expect(system.claim({ x: 1.45, z: 1.45 }, 1.2, [])).toBeNull();
  expect(system.active).toHaveLength(TargetRules.count);
 });
});

describe('food stays when a diana scores', () => {
 it('awards the ring, respawns, and leaves the portion for the animal', () => {
  const game = new GameEngine(new VirtualAdapter(), mulberry(4));
  game.start();
  const chicken = game.ai.animals.find(animal => animal.species === 'chicken')!;
  game.targets.clear();
  const target = game.targets.force({ ...chicken.position });
  game.targets.force({ x: 1, z: 0.2 });
  expect(game.placeFood({ ...chicken.position })).toBeNull();
  expect(game.feeding.drops).toHaveLength(1);
  expect(game.score.points).toBe(TargetRules.rings[0].points);
  expect(game.score.rings).toBe(TargetRules.rings[0].points);
  expect(game.targets.active.some(item => item.id === target.id)).toBe(false);
  expect(game.targets.active.length).toBe(TargetRules.count);
  for (let frame = 0; frame < 90; frame += 1) game.update(1 / 30);
  expect(game.score.fed).toBeGreaterThanOrEqual(1);
  expect(game.score.points).toBeGreaterThan(TargetRules.rings[0].points);
 });

 it('keeps thrown food that settles on a diana', () => {
  const game = new GameEngine(new VirtualAdapter(), mulberry(9));
  game.start();
  game.targets.clear();
  const target = game.targets.force({ x: 0.4, z: -0.35 });
  game.flights.push({ id: 99, productId: 'grain', x: 0.4, y: 0.02, z: -0.35, vx: 0, vy: 0, vz: 0, age: 0, settled: true, spin: 0 });
  game.update(1 / 30);
  expect(game.flights).toHaveLength(0);
  expect(game.feeding.drops).toHaveLength(1);
  expect(game.feeding.drops[0].position.x).toBeCloseTo(0.4, 1);
  expect(game.targets.active.some(item => item.id === target.id)).toBe(false);
  expect(game.targets.active).toHaveLength(TargetRules.count);
  expect(game.score.rings).toBe(TargetRules.rings[0].points);
 });

 it('does not remove a diana or the food when the landing misses', () => {
  const game = new GameEngine(new VirtualAdapter(), () => 0.2);
  game.start();
  game.targets.clear();
  game.targets.force({ x: 1, z: 0 });
  game.targets.force({ x: 0.2, z: 1 });
  const ids = game.targets.active.map(item => item.id);
  expect(game.placeFood({ x: -1, z: -0.2 })).toBeNull();
  expect(game.feeding.drops).toHaveLength(1);
  expect(game.score.rings).toBe(0);
  expect(game.targets.active.map(item => item.id)).toEqual(ids);
 });

 it('pays the spread bonus once, after every animal has eaten', () => {
  const score = new ScoreSystem();
  const ids = ['chicken-0', 'rabbit-5'];
  score.award(0, ids[0]);
  expect(score.collectBonus(ids)).toBe(0);
  score.award(1, ids[1]);
  expect(score.collectBonus(ids)).toBe(SPREAD_BONUS);
  expect(score.collectBonus(ids)).toBe(0);
  expect(score.points).toBe(400);
  expect(score.fedByAnimal[ids[0]]).toBe(1);
 });
});
