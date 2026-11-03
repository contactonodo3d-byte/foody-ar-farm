import { FarmConfig } from '../config/BrandConfig';
import type { Position } from './BoundarySystem';

/** Flat ground targets. Outer ring is the full footprint that must stay inside the field. */
export const TargetRules = {
  count: 2,
  edgePad: 0.04,
  gap: 0.12,
  animalClear: 0.2,
  rings: [
    { radius: 0.14, points: 150 },
    { radius: 0.28, points: 80 },
    { radius: 0.42, points: 40 },
  ],
} as const;


export interface Target {
  id: number;
  x: number;
  z: number;
}

export interface TargetPop {
  id: number;
  x: number;
  z: number;
  time: number;
}

export interface TargetHit {
  id: number;
  x: number;
  z: number;
  points: number;
}

export function outerRadius() {
  return TargetRules.rings[TargetRules.rings.length - 1].radius;
}

/** Center must sit this far inside so the whole ring stays on the 3×3 terrain. */
export function innerLimit() {
  return FarmConfig.halfSize - outerRadius() - TargetRules.edgePad;
}

export function ringPoints(distance: number) {
  if (!Number.isFinite(distance) || distance < 0) return null;
  for (const ring of TargetRules.rings) {
    if (distance <= ring.radius + 1e-9) return ring.points;
  }
  return null;
}

export function fullyInside(position: Position) {
  if (!Number.isFinite(position.x) || !Number.isFinite(position.z)) return false;
  const limit = innerLimit();
  return Math.abs(position.x) <= limit + 1e-9 && Math.abs(position.z) <= limit + 1e-9;
}

export function overlapsTargets(position: Position, others: Position[]) {
  const need = outerRadius() * 2 + TargetRules.gap;
  return others.some(other => Math.hypot(position.x - other.x, position.z - other.z) < need - 1e-9);
}

export function crowdsAnimal(position: Position, animals: { position: Position }[]) {
  const need = outerRadius() + TargetRules.animalClear;
  return animals.some(animal => Math.hypot(animal.position.x - position.x, animal.position.z - position.z) < need);
}

export class TargetSystem {
  active: Target[] = [];
  pops: TargetPop[] = [];
  private seq = 1;
  constructor(private random: () => number = Math.random) {}

  reset(animals: { position: Position }[] = []) {
    this.active = [];
    this.pops = [];
    this.seq = 1;
    this.fill(animals);
  }

  clear() {
    this.active = [];
    this.pops = [];
  }

  /** Test hook: place a target without the random search. */
  force(position: Position): Target {
    const target = { id: this.seq++, x: position.x, z: position.z };
    this.active.push(target);
    return target;
  }

  fill(animals: { position: Position }[]) {
    let guard = 0;
    while (this.active.length < TargetRules.count && guard < TargetRules.count + 2) {
      guard += 1;
      if (!this.spawn(animals, null)) break;
    }
  }

  spawn(animals: { position: Position }[], away: Position | null) {
    return this.search(animals, away, true) ?? this.search(animals, away, false);
  }

  claim(position: Position, time: number, animals: { position: Position }[]): TargetHit | null {
    if (!Number.isFinite(position.x) || !Number.isFinite(position.z)) return null;
    let best: { target: Target; points: number; distance: number } | null = null;
    for (const target of this.active) {
      const distance = Math.hypot(target.x - position.x, target.z - position.z);
      const points = ringPoints(distance);
      if (points == null) continue;
      if (!best || distance < best.distance) best = { target, points, distance };
    }
    if (!best) return null;
    const { target, points } = best;
    this.active = this.active.filter(item => item.id !== target.id);
    this.pops.push({ id: target.id, x: target.x, z: target.z, time });
    this.spawn(animals, { x: target.x, z: target.z });
    this.fill(animals);
    return { id: target.id, x: target.x, z: target.z, points };
  }

  expire(time: number, life = 0.32) {
    this.pops = this.pops.filter(pop => time - pop.time < life);
  }

  private search(animals: { position: Position }[], away: Position | null, strict: boolean) {
    for (let attempt = 0; attempt < 36; attempt += 1) {
      const position = this.sample();
      if (!fullyInside(position) || overlapsTargets(position, this.active)) continue;
      if (strict && crowdsAnimal(position, animals)) continue;
      if (strict && away && Math.hypot(position.x - away.x, position.z - away.z) < outerRadius() + TargetRules.gap) continue;
      const target = { id: this.seq++, x: position.x, z: position.z };
      this.active.push(target);
      return target;
    }
    return null;
  }

  private sample(): Position {
    const limit = innerLimit();
    return { x: (this.random() * 2 - 1) * limit, z: (this.random() * 2 - 1) * limit };
  }
}
