import type { Position } from '../engine/BoundarySystem';
export interface ExperienceAdapter { mode: 'virtual' | 'camera' | 'spatial' | 'marker' | 'world'; reliablePhysicalTracking: boolean; getPosition(): Position; getTrackedPosition?(): Position | null; getPauseReason?(): string | null; dispose(): void }
export class VirtualAdapter implements ExperienceAdapter {
 readonly mode = 'virtual'; readonly reliablePhysicalTracking = false;
 position: Position = { x: 0, z: 0 };
 getPosition() { return this.position; }
 dispose() {}
}
