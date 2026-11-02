import {useEffect,type RefObject} from 'react';
import {useFrame,useThree} from '@react-three/fiber';
import * as THREE from 'three';
import type {WorldTrackingAdapter} from './WorldTrackingAdapter';
export function WorldTrackingScene({active,adapter,farm}:{active:boolean;adapter:WorldTrackingAdapter;farm:RefObject<THREE.Group|null>}){
 const {camera}=useThree();
 useEffect(()=>{
  if(!active)return;
  const position=camera.position.clone(),rotation=camera.quaternion.clone(),projection=camera.projectionMatrix.clone(),inverse=camera.projectionMatrixInverse.clone();
  return()=>{camera.position.copy(position);camera.quaternion.copy(rotation);camera.projectionMatrix.copy(projection);camera.projectionMatrixInverse.copy(inverse);camera.updateMatrixWorld();if(farm.current){farm.current.position.set(0,0,0);farm.current.scale.setScalar(1);farm.current.rotation.set(0,0,0);farm.current.visible=true;}};
 },[active,camera,farm]);
 useFrame(()=>{
  if(!active||!farm.current)return;
  adapter.expire(performance.now());
  const frame=adapter.frame;
  if(frame){
   camera.position.set(frame.position.x,frame.position.y,frame.position.z);
   camera.quaternion.set(frame.rotation.x,frame.rotation.y,frame.rotation.z,frame.rotation.w).normalize();
   // Preserve the vendor's complete projection (including off-center terms).
   camera.projectionMatrix.fromArray(Array.from(frame.intrinsics));camera.projectionMatrixInverse.copy(camera.projectionMatrix).invert();camera.updateMatrixWorld();
  }
  farm.current.visible=!!adapter.origin&&adapter.tracking;
  const origin=adapter.farmOrigin;
  if(origin){farm.current.position.set(origin.x,origin.y,origin.z);farm.current.scale.setScalar(adapter.placement.scale);farm.current.rotation.set(0,adapter.placement.yaw*Math.PI/180,0);farm.current.updateMatrixWorld(true);}
 },-2);
 return null;
}
