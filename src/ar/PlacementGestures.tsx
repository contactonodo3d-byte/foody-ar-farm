import {useEffect} from 'react';
import {useThree} from '@react-three/fiber';
import {Plane,Raycaster,Vector2,Vector3} from 'three';
import {pairGesture,type ScreenPoint} from '../engine/PlacementGesture';
import type {WorldTrackingAdapter} from './WorldTrackingAdapter';
export function PlacementGestures({adapter,enabled,onChange}:{adapter:WorldTrackingAdapter;enabled:boolean;onChange:()=>void}){
 const {camera,gl}=useThree();
 useEffect(()=>{
  if(!enabled)return;
  const canvas=gl.domElement,points=new Map<number,ScreenPoint>(),ray=new Raycaster(),plane=new Plane();
  let baseline:ScreenPoint[]=[],initial={...adapter.placement},anchor:Vector3|null=null;
  const ground=(point:ScreenPoint)=>{
   const origin=adapter.farmOrigin;if(!origin)return null;
   const rect=canvas.getBoundingClientRect();ray.setFromCamera(new Vector2((point.x-rect.left)/rect.width*2-1,-(point.y-rect.top)/rect.height*2+1),camera);
   plane.setFromNormalAndCoplanarPoint(new Vector3(0,1,0),new Vector3(origin.x,origin.y,origin.z));
   const target=ray.ray.intersectPlane(plane,new Vector3());
   return target&&target.distanceTo(camera.position)<20?target:null;
  };
  const reset=()=>{baseline=[...points.values()];initial={...adapter.placement};anchor=baseline.length===1?ground(baseline[0]):null;};
  const down=(event:PointerEvent)=>{
   if(!adapter.tracking||!adapter.origin||event.button!==0)return;
   event.preventDefault();event.stopImmediatePropagation();canvas.setPointerCapture(event.pointerId);
   points.set(event.pointerId,{x:event.clientX,y:event.clientY});reset();
  };
  const move=(event:PointerEvent)=>{
   if(!points.has(event.pointerId))return;event.preventDefault();event.stopImmediatePropagation();
   points.set(event.pointerId,{x:event.clientX,y:event.clientY});
   if(!adapter.tracking){reset();return;}
   const current=[...points.values()];
   if(current.length===2){adapter.setPlacement(pairGesture(baseline,current,initial));onChange();return;}
   if(current.length===1&&anchor){const target=ground(current[0]);if(target){adapter.setPlacement({x:initial.x+target.x-anchor.x,z:initial.z+target.z-anchor.z});onChange();}}
  };
  const up=(event:PointerEvent)=>{if(!points.has(event.pointerId))return;event.preventDefault();event.stopImmediatePropagation();points.delete(event.pointerId);if(canvas.hasPointerCapture(event.pointerId))canvas.releasePointerCapture(event.pointerId);reset();};
  const safari=(event:Event)=>event.preventDefault();
  canvas.addEventListener('pointerdown',down,true);canvas.addEventListener('pointermove',move,true);canvas.addEventListener('pointerup',up,true);canvas.addEventListener('pointercancel',up,true);canvas.addEventListener('lostpointercapture',up,true);
  canvas.addEventListener('gesturestart',safari,{passive:false});canvas.addEventListener('gesturechange',safari,{passive:false});
  return()=>{for(const id of points.keys())if(canvas.hasPointerCapture(id))canvas.releasePointerCapture(id);canvas.removeEventListener('pointerdown',down,true);canvas.removeEventListener('pointermove',move,true);canvas.removeEventListener('pointerup',up,true);canvas.removeEventListener('pointercancel',up,true);canvas.removeEventListener('lostpointercapture',up,true);canvas.removeEventListener('gesturestart',safari);canvas.removeEventListener('gesturechange',safari);};
 },[adapter,enabled,camera,gl,onChange]);
 return null;
}
