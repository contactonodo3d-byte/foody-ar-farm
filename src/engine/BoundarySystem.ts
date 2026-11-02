import { FarmConfig } from '../config/BrandConfig';
export type Position = { x: number; z: number };
export type BoundaryState = 'SAFE' | 'WARNING' | 'DANGER' | 'OUTSIDE';
export function evaluateBoundary(position: Position, reliablePhysicalTracking = false) {
 if (!Number.isFinite(position.x) || !Number.isFinite(position.z)) throw new Error('Invalid position');
 const distance = FarmConfig.halfSize - Math.max(Math.abs(position.x), Math.abs(position.z));
 const state: BoundaryState = distance < 0 ? 'OUTSIDE' : distance < FarmConfig.dangerDistance - 1e-9 ? 'DANGER' : distance <= FarmConfig.warningDistance + 1e-9 ? 'WARNING' : 'SAFE';
 return { distance, state, shouldPause: reliablePhysicalTracking && state === 'OUTSIDE' };
}
export function contain(position: Position, radius = 0) {
 const limit = Math.max(0, FarmConfig.halfSize - radius);
 return { x: Math.max(-limit, Math.min(limit, position.x)), z: Math.max(-limit, Math.min(limit, position.z)) };
}

export const boundaryEdges = [
 { id: 'south', axis: 'z', sign: 1 },
 { id: 'east', axis: 'x', sign: 1 },
 { id: 'north', axis: 'z', sign: -1 },
 { id: 'west', axis: 'x', sign: -1 },
] as const;
function wallIntensity(state: BoundaryState) {
 return state === 'SAFE' ? 0 : state === 'WARNING' ? 0.24 : 0.48;
}
export function evaluateBoundaryEdges(position: Position) {
 const overall = evaluateBoundary(position);
 const ambientIntensity = wallIntensity(overall.state) * 0.25;
 return boundaryEdges.map(edge => {
  const local = evaluateBoundary({ x: Math.max(0, position[edge.axis] * edge.sign), z: 0 });
  return {
   ...edge,
   ...local,
   intensity: Math.max(wallIntensity(local.state), ambientIntensity),
   effectState: local.state === 'SAFE' ? overall.state : local.state,
  };
 });
}
