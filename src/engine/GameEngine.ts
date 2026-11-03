import { contain, evaluateBoundary, type Position } from './BoundarySystem';
import { AnimalAI, type Species } from './AnimalAI';
import { FeedingSystem, type FeedEvent } from './FeedingSystem';
import { SPREAD_BONUS, ScoreSystem } from './ScoreSystem';
import { TargetSystem } from './TargetSystem';
import { BrandConfig, FarmConfig } from '../config/BrandConfig';
import type { ExperienceAdapter } from '../ar/ExperienceAdapter';
import { stepFlight, type Flight } from './ThrowPhysics';

export type GamePhase = 'ready' | 'playing' | 'results';
export interface Burst { x: number; y: number; z: number; time: number; kind: 'land' | 'eat'; color: string }
export interface AimPreview { x: number; y: number; z: number; charge: number; arc: { x: number; y: number; z: number }[]; color: string }
export interface ScorePopup { x: number; y: number; z: number; points: number; time: number; kind: 'ring' | 'bonus' }
export interface FeedGroup { id: Species; label: string; meals: number; fed: number; total: number; dots: boolean[] }
const COOLDOWN = 'Un poquito más despacio: dejá que lleguen.';
const FULL = 'Hay comida esperando. Dejá que coman primero.';
const FEED_LABELS = { chicken: 'Gallinas', chick: 'Pollitos', rabbit: 'Conejos' } as const;

export class GameEngine {
 ai = new AnimalAI(); readonly feeding = new FeedingSystem(); readonly score = new ScoreSystem();
 readonly targets: TargetSystem;
 paused = false;
 phase: GamePhase = 'ready'; elapsed = 0; events: FeedEvent[] = []; selectedFood = 'grain';
 flights: Flight[] = []; aim: AimPreview | null = null; bursts: Burst[] = []; popups: ScorePopup[] = [];
 cues = { thrown: 0, landed: 0 };
 private flightSeq = 1;
 constructor(public adapter: ExperienceAdapter, random: () => number = Math.random) {
  this.targets = new TargetSystem(random);
 }
 start() {
  this.ai = new AnimalAI(); this.feeding.reset(); this.score.reset(); this.targets.reset(this.ai.animals);
  this.events = []; this.popups = []; this.elapsed = 0; this.phase = 'playing';
  this.flights = []; this.aim = null; this.bursts = []; this.cues = { thrown: 0, landed: 0 }; this.flightSeq = 1;
 }
 launch(productId: string, origin: { x: number; y: number; z: number }, velocity: { vx: number; vy: number; vz: number }) {
  if (this.paused || this.safetyMessage) return 'Partida pausada. Volvé al área y recuperá el seguimiento.';
  if (this.phase !== 'playing') return 'Empezá una partida para alimentar.';
  if (!BrandConfig.foods.some(food => food.id === productId)) return 'Elegí un alimento primero.';
  if (![origin.x, origin.y, origin.z, velocity.vx, velocity.vy, velocity.vz].every(Number.isFinite)) return 'No se pudo tirar. Intentá de nuevo.';
  if (this.flights.length >= 6) return FULL;
  this.flights.push({ id: this.flightSeq++, productId, x: origin.x, y: Math.max(0.25, origin.y), z: origin.z, vx: velocity.vx, vy: velocity.vy, vz: velocity.vz, age: 0, settled: false, spin: 0 });
  this.cues.thrown += 1;
  return null;
 }
 private scoreLanding(spot: Position) {
  const hit = this.targets.claim(spot, this.elapsed, this.ai.animals);
  if (!hit) return;
  this.score.grant(hit.points);
  this.popups.push({ x: hit.x, y: 0.4, z: hit.z, points: hit.points, time: this.elapsed, kind: 'ring' });
 }
 private stepFlights(dt: number) {
  const keep: Flight[] = [];
  for (const flight of this.flights) {
   if (!flight.settled) stepFlight(flight, dt);
   if (flight.settled) {
    const spot = contain({ x: flight.x, z: flight.z }, 0.2);
    flight.x = spot.x; flight.z = spot.z; flight.y = 0.02; flight.vx = 0; flight.vy = 0; flight.vz = 0;
    const error = this.feeding.place(flight.productId, spot, this.elapsed);
    if (!error) {
     this.cues.landed += 1;
     const landed = this.feeding.drops.at(-1)?.position ?? spot;
     const color = this.feeding.drops.at(-1)?.product.color ?? BrandConfig.colors.glow;
     this.bursts.push({ x: landed.x, y: 0.05, z: landed.z, time: this.elapsed, kind: 'land', color });
     this.scoreLanding(landed);
     continue;
    }
    if (error === COOLDOWN || error === FULL) keep.push(flight);
    continue;
   }
   keep.push(flight);
  }
  this.flights = keep;
  this.bursts = this.bursts.filter(burst => this.elapsed - burst.time < 0.85);
 }
 update(dt: number) {
  if (!Number.isFinite(dt) || dt <= 0 || this.paused || this.safetyMessage) return;
  if (this.phase === 'results') return;
  if (this.phase === 'ready') { this.ai.update(dt); return; }
  const activeTime = Math.min(dt, FarmConfig.duration - this.elapsed);
  this.elapsed = Math.min(FarmConfig.duration, this.elapsed + activeTime);
  this.score.update(this.elapsed);
  let remaining = Math.min(activeTime, .25);
  while (remaining > 1e-8) {
   const step = Math.min(remaining, 1 / 30);
   this.stepFlights(step);
   this.ai.update(step);
   this.feeding.update(step, this.ai.animals, animal => {
    const points = this.score.award(this.elapsed, animal.id);
    const bonus = this.score.collectBonus(this.ai.animals.map(item => item.id), SPREAD_BONUS);
    this.events.push({ animalId: animal.id, position: { ...animal.position }, time: this.elapsed, points });
    this.bursts.push({ x: animal.position.x, y: 0.2, z: animal.position.z, time: this.elapsed, kind: 'eat', color: '#ee6e77' });
    if (bonus) this.popups.push({ x: animal.position.x, y: 0.7, z: animal.position.z, points: bonus, time: this.elapsed, kind: 'bonus' });
   });
   remaining -= step;
  }
  this.events = this.events.filter(event => this.elapsed - event.time < 1.8);
  this.popups = this.popups.filter(popup => this.elapsed - popup.time < 1.15);
  this.targets.expire(this.elapsed);
  if (this.elapsed >= FarmConfig.duration) {
   this.phase = 'results'; this.feeding.drops = []; this.flights = []; this.aim = null; this.targets.clear();
  }
 }
 placeFood(position: Position) {
  if (this.paused || this.safetyMessage) return 'Partida pausada. Volvé al área y recuperá el seguimiento.';
  if (this.phase !== 'playing') return 'Empezá una partida para alimentar.';
  const error = this.feeding.place(this.selectedFood, position, this.elapsed);
  if (error) return error;
  const spot = this.feeding.drops.at(-1)?.position ?? position;
  this.cues.landed += 1;
  this.scoreLanding(spot);
  return null;
 }
 private feedRoster(): FeedGroup[] {
  return (['chicken', 'chick', 'rabbit'] as const).map(species => {
   const animals = this.ai.animals.filter(animal => animal.species === species);
   const dots = animals.map(animal => (this.score.fedByAnimal[animal.id] ?? 0) > 0);
   return {
    id: species,
    label: FEED_LABELS[species],
    meals: animals.reduce((sum, animal) => sum + (this.score.fedByAnimal[animal.id] ?? 0), 0),
    fed: dots.filter(Boolean).length,
    total: animals.length,
    dots,
   };
  });
 }
 get safetyMessage() {
  if (this.adapter.mode === 'marker' || this.adapter.mode === 'world') return this.adapter.getPauseReason?.() ?? '';
  if (this.adapter.mode !== 'spatial') return '';
  const tracking = this.adapter.getPauseReason?.();
  if (tracking) return tracking;
  if (!this.adapter.reliablePhysicalTracking) return 'Esperando seguimiento espacial fiable.';
  return this.getBoundary().shouldPause ? '¡Volvé al área! Partida pausada.' : '';
 }
 get remaining() { return Math.max(0, FarmConfig.duration - this.elapsed); }
 getBoundary(position: Position = this.adapter.getPosition()) { return evaluateBoundary(position, this.adapter.reliablePhysicalTracking); }
 snapshot() {
  const popup = [...this.popups].reverse().find(item => this.elapsed - item.time < 1.15) ?? null;
  return {
   safetyMessage: this.safetyMessage,
   trackedPosition: this.adapter.mode === 'spatial' ? this.adapter.getPosition() : this.adapter.getTrackedPosition?.() ?? null,
   phase: this.phase,
   seconds: Math.ceil(this.remaining),
   points: this.score.points,
   fed: this.score.fed,
   combo: this.score.combo,
   bestCombo: this.score.bestCombo,
   multiplier: this.score.multiplier,
   rings: this.score.rings,
   bonus: this.score.bonus,
   spread: this.score.spreadAwarded,
   roster: this.feedRoster(),
   targets: this.phase === 'playing' ? this.targets.active.map(target => ({ id: target.id, x: target.x, z: target.z })) : [],
   popup: popup ? { points: popup.points, time: popup.time, kind: popup.kind } : null,
   cues: { ...this.cues },
  };
 }
}
