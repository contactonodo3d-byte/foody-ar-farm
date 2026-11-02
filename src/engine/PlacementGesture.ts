export interface ScreenPoint {x:number;y:number}
export interface GestureTransform {scale:number;yaw:number}
export function pairGesture(start:readonly ScreenPoint[],current:readonly ScreenPoint[],initial:GestureTransform):GestureTransform {
 const [a,b]=start,[c,d]=current;
 if(!a||!b||!c||!d)return initial;
 const distance=Math.hypot(b.x-a.x,b.y-a.y),next=Math.hypot(d.x-c.x,d.y-c.y);
 if(distance<12||next<12)return initial;
 const angle=Math.atan2(d.y-c.y,d.x-c.x)-Math.atan2(b.y-a.y,b.x-a.x);
 const delta=Math.atan2(Math.sin(angle),Math.cos(angle))*180/Math.PI;
 return {scale:Math.max(.25,Math.min(3,initial.scale*next/distance)),yaw:((initial.yaw-delta+180)%360+360)%360-180};
}
