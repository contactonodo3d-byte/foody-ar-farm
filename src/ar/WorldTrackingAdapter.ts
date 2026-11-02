import type {ExperienceAdapter} from './ExperienceAdapter';
import type {WorldFrame,WorldPoint} from './XR8Types';
export function validWorldFrame(frame:WorldFrame|undefined):frame is WorldFrame {
 if(!frame||frame.trackingStatus!=='NORMAL'||frame.intrinsics?.length!==16)return false;
 const {position:p,rotation:q}=frame;
 if(!p||!q||![p.x,p.y,p.z,q.x,q.y,q.z,q.w,...Array.from(frame.intrinsics)].every(Number.isFinite))return false;
 const norm=Math.hypot(q.x,q.y,q.z,q.w);
 return norm>.9&&norm<1.1&&frame.intrinsics[0]>0&&frame.intrinsics[5]>0&&Math.abs(frame.intrinsics[11])>.5;
}
export class WorldTrackingAdapter implements ExperienceAdapter {
 readonly mode='world';
 // Responsive SLAM units are deliberately not treated as calibrated physical meters.
 readonly reliablePhysicalTracking=false;
 origin:WorldPoint|null=null;frame:WorldFrame|null=null;
 placement={scale:1,x:0,y:0,z:0,yaw:0};
 setPlacement(patch:Partial<typeof this.placement>){
  for(const key of ['scale','x','y','z','yaw'] as const){
   const value=patch[key];if(value===undefined||!Number.isFinite(value))continue;
   this.placement[key]=Math.max(key==='scale'?.25:key==='yaw'?-180:-3,Math.min(key==='scale'?3:key==='yaw'?180:3,value));
  }
 }
 resetTransform(){this.placement={scale:1,x:0,y:0,z:0,yaw:0};}
 get farmOrigin(){return this.origin?{x:this.origin.x+this.placement.x,y:this.origin.y+this.placement.y,z:this.origin.z+this.placement.z}:null;}
 tracking=false;private stableFrames=0;private lastFrame=-Infinity;
 update(frame:WorldFrame|undefined,now:number){
  if(!validWorldFrame(frame)){this.loseTracking();return;}
  this.frame={...frame,position:{...frame.position},rotation:{...frame.rotation},intrinsics:Array.from(frame.intrinsics)};
  this.lastFrame=now;this.stableFrames++;this.tracking=this.stableFrames>=3;
 }
 expire(now:number){if(now-this.lastFrame>500)this.loseTracking();}
 place(origin:WorldPoint){if(!this.tracking||![origin.x,origin.y,origin.z].every(Number.isFinite))return false;this.origin={...origin};return true;}
 loseTracking(){this.stableFrames=0;this.tracking=false;}
 resetPlacement(){this.origin=null;this.loseTracking();}
 getPosition(){
  const origin=this.farmOrigin;if(!origin||!this.frame)return {x:0,z:0};
  const dx=this.frame.position.x-origin.x,dz=this.frame.position.z-origin.z;
  const angle=this.placement.yaw*Math.PI/180,c=Math.cos(angle),s=Math.sin(angle);
  return {x:(c*dx-s*dz)/this.placement.scale,z:(s*dx+c*dz)/this.placement.scale};
 }
 // Visual coordinates share the farm reference frame; they do not establish metric calibration.
 getTrackedPosition(){return this.tracking&&this.origin&&this.frame?this.getPosition():null;}
 getPauseReason(){return !this.tracking?'Mové el teléfono despacio para recuperar el seguimiento.':!this.origin?'Apuntá al suelo y colocá la granja para empezar.':null;}
 dispose(){this.resetTransform();this.origin=null;this.frame=null;this.loseTracking();}
}
