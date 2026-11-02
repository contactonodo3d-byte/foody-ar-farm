import type { ExperienceAdapter } from './ExperienceAdapter';
import type { Position } from '../engine/BoundarySystem';
export interface SpatialPoint {x:number;y:number;z:number}
export class SpatialAdapter implements ExperienceAdapter {
 readonly mode='spatial';reliablePhysicalTracking=false;
 origin:SpatialPoint|null=null;
 private position:Position={x:0,z:0};private stableFrames=0;
 place(origin:SpatialPoint){if(![origin.x,origin.y,origin.z].every(Number.isFinite)){this.resetPlacement();return;}this.origin={...origin};this.stableFrames=0;this.reliablePhysicalTracking=false;}
 updateTracking(point:SpatialPoint|null,emulated=false){
  if(!this.origin||!point||emulated||![point.x,point.y,point.z].every(Number.isFinite)){this.stableFrames=0;this.reliablePhysicalTracking=false;return;}
  this.position={x:point.x-this.origin.x,z:point.z-this.origin.z};
  this.stableFrames++;this.reliablePhysicalTracking=this.stableFrames>=3;
 }
 getPosition(){return {...this.position};}
 getPauseReason(){return !this.origin?'Buscá una superficie horizontal y tocá para colocar la granja.':!this.reliablePhysicalTracking?'Seguimiento perdido. Apuntá de nuevo al área para continuar.':null;}
 resetPlacement(){this.origin=null;this.stableFrames=0;this.reliablePhysicalTracking=false;}
 dispose(){this.resetPlacement();}
}
