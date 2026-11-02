import { FarmConfig } from '../config/BrandConfig';

export interface Flight {
  id: number;
  productId: string;
  x: number; y: number; z: number;
  vx: number; vy: number; vz: number;
  age: number;
  settled: boolean;
  spin: number;
}

export interface Velocity { vx: number; vy: number; vz: number }

export const ThrowTuning = {
  gravity: 14,
  restitution: 0.42,
  friction: 0.58,
  settleSpeed: 0.55,
  maxAge: 4.5,
};

/** Keep the food's center inside the play square, including a small body margin. */
export function fieldLimit() {
  return FarmConfig.halfSize - 0.08;
}

function clampEdge(value: number, speed: number, limit: number) {
  if (value > limit) return { value: limit, speed: -Math.abs(speed) * ThrowTuning.restitution };
  if (value < -limit) return { value: -limit, speed: Math.abs(speed) * ThrowTuning.restitution };
  return { value, speed };
}

/** Mutates the flight. Edges bounce; the morsel never leaves the field. */
export function stepFlight(flight: Flight, dt: number) {
  const step = Math.min(Math.max(dt, 0), 0.05);
  const limit = fieldLimit();
  flight.age += step;
  flight.vy -= ThrowTuning.gravity * step;
  flight.x += flight.vx * step;
  flight.y += flight.vy * step;
  flight.z += flight.vz * step;
  flight.spin += step * (2.5 + Math.hypot(flight.vx, flight.vz));
  const xHit = clampEdge(flight.x, flight.vx, limit);
  const zHit = clampEdge(flight.z, flight.vz, limit);
  flight.x = xHit.value; flight.vx = xHit.speed;
  flight.z = zHit.value; flight.vz = zHit.speed;
  if (flight.y <= 0.02) {
    flight.y = 0.02;
    const horiz = Math.hypot(flight.vx, flight.vz);
    if ((Math.abs(flight.vy) < 1.15 && horiz < ThrowTuning.settleSpeed) || flight.age > ThrowTuning.maxAge) {
      flight.vy = 0; flight.vx = 0; flight.vz = 0; flight.settled = true;
    } else {
      flight.vy = Math.abs(flight.vy) * ThrowTuning.restitution;
      flight.vx *= ThrowTuning.friction;
      flight.vz *= ThrowTuning.friction;
    }
  }
}

export function predictArc(origin: { x: number; y: number; z: number }, velocity: Velocity, maxTime = 1.8, dt = 1 / 30) {
  const flight: Flight = { id: 0, productId: '', age: 0, settled: false, spin: 0, ...origin, ...velocity };
  const points: { x: number; y: number; z: number }[] = [{ x: flight.x, y: flight.y, z: flight.z }];
  let time = 0;
  while (time < maxTime && !flight.settled && points.length < 48) {
    stepFlight(flight, dt);
    time += dt;
    points.push({ x: flight.x, y: flight.y, z: flight.z });
  }
  return points;
}

/**
 * Swipe on the farm plane sets direction and speed. A still release lobs along `fallback`
 * so a press-and-release still lands in the field.
 */
export function swipeToVelocity(dx: number, dz: number, seconds: number, charge: number, fallback: { x: number; z: number }): Velocity {
  const held = Math.min(1, Math.max(0, charge));
  const duration = Math.max(seconds, 0.08);
  const dist = Math.hypot(dx, dz);
  const swipeSpeed = dist / duration;
  const power = 0.82 + held * 0.4;
  let vx: number;
  let vz: number;
  if (dist >= 0.12) {
    const speed = Math.min(5.2, 1.05 + swipeSpeed * 0.42) * power;
    vx = dx / dist * speed;
    vz = dz / dist * speed;
  } else {
    const len = Math.hypot(fallback.x, fallback.z) || 1;
    const speed = (1.15 + held * 0.7) * power;
    vx = fallback.x / len * speed;
    vz = fallback.z / len * speed;
  }
  const vy = Math.min(6.2, 2.7 + Math.min(swipeSpeed, 6) * 0.2 + held * 1.15);
  return { vx, vy, vz };
}
