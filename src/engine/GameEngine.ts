import { contain, evaluateBoundary, type Position } from './BoundarySystem';
import { AnimalAI } from './AnimalAI';
import { FeedingSystem, type FeedEvent } from './FeedingSystem';
import { ScoreSystem } from './ScoreSystem';
import { BrandConfig, FarmConfig } from '../config/BrandConfig';
import type { ExperienceAdapter } from '../ar/ExperienceAdapter';
import { stepFlight, type Flight } from './ThrowPhysics';

export type GamePhase = 'ready' | 'playing' | 'results';
export interface Burst { x: number; y: number; z: number; time: number; kind: 'land' | 'eat'; color: string }
export interface AimPreview { x: number; y: number; z: number; charge: number; arc: { x: number; y: number; z: number }[]; color: string }
const COOLDOWN = 'Un poquito más despacio: dejá que lleguen.';
const FULL = 'Hay comida esperando. Dejá que coman primero.';

export class GameEngine {
 ai = new AnimalAI(); readonly feeding = new FeedingSystem(); readonly score = new ScoreSystem();
 paused = false;
 phase: GamePhase = 'ready'; elapsed = 0; events: FeedEvent[] = []; selectedFood = 'grain';
 flights: Flight[] = []; aim: AimPreview | null = null; bursts: Burst[] = [];
 cues = { thrown: 0, landed: 0 };
 private flightSeq = 1;
 constructor(public adapter: ExperienceAdapter) {}
 start() {
  this.ai = new AnimalAI(); this.feeding.reset(); this.score.reset(); this.events = []; this.elapsed = 0; this.phase = 'playing';
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
     const color = this.feeding.drops.at(-1)?.product.color ?? '#f4bd47';
     this.bursts.push({ x: spot.x, y: 0.05, z: spot.z, time: this.elapsed, kind: 'land', color });
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
    const points = this.score.award(this.elapsed);
    this.events.push({ animalId: animal.id, position: { ...animal.position }, time: this.elapsed, points });
    this.bursts.push({ x: animal.position.x, y: 0.2, z: animal.position.z, time: this.elapsed, kind: 'eat', color: '#ee6e77' });
   });
   remaining -= step;
  }
  this.events = this.events.filter(event => this.elapsed - event.time < 1.8);
  if (this.elapsed >= FarmConfig.duration) { this.phase = 'results'; this.feeding.drops = []; this.flights = []; this.aim = null; }
 }
 placeFood(position: Position) { if (this.paused || this.safetyMessage) return 'Partida pausada. Volvé al área y recuperá el seguimiento.'; if (this.phase !== 'playing') return 'Empezá una partida para alimentar.'; return this.feeding.place(this.selectedFood, position, this.elapsed); }
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
 snapshot() { return { safetyMessage: this.safetyMessage, trackedPosition: this.adapter.mode === 'spatial' ? this.adapter.getPosition() : this.adapter.getTrackedPosition?.() ?? null, phase: this.phase, seconds: Math.ceil(this.remaining), points: this.score.points, fed: this.score.fed, combo: this.score.combo, bestCombo: this.score.bestCombo, multiplier: this.score.multiplier, cues: { ...this.cues } }; }
}
