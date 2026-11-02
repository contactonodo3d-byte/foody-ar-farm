import {useEffect,useRef,type RefObject} from 'react';
import {useFrame,useThree} from '@react-three/fiber';
import * as THREE from 'three';
import type {MarkerPose} from '../hooks/useMarkerTracking';
export function MarkerScene({farm,pose,enabled}:{farm:RefObject<THREE.Group|null>;pose:RefObject<MarkerPose|null>;enabled:boolean}){
 const {camera}=useThree();const orientation=useRef(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1,0,0),Math.PI/2));
 const position=useRef(new THREE.Vector3()),rotation=useRef(new THREE.Quaternion()),scale=useRef(new THREE.Vector3());
 const snapped=useRef(false);
 useEffect(()=>{
  if(!enabled||!(camera instanceof THREE.PerspectiveCamera))return;
  const old={position:camera.position.clone(),rotation:camera.quaternion.clone(),fov:camera.fov};
  camera.position.set(0,0,0);camera.quaternion.identity();snapped.current=false;
  return()=>{camera.position.copy(old.position);camera.quaternion.copy(old.rotation);camera.fov=old.fov;camera.updateProjectionMatrix();if(farm.current){farm.current.position.set(0,0,0);farm.current.quaternion.identity();farm.current.scale.setScalar(1);farm.current.visible=true;}};
 },[enabled,camera,farm]);
 useFrame(()=>{
  if(!enabled||!farm.current||!(camera instanceof THREE.PerspectiveCamera))return;
  const data=pose.current;farm.current.visible=!!data?.adapter.visible;
  if(!data?.adapter.visible){snapped.current=false;return;}
  if(camera.fov!==data.fov){camera.fov=data.fov;camera.updateProjectionMatrix();}
  data.matrix.decompose(position.current,rotation.current,scale.current);rotation.current.multiply(orientation.current);
  if(!snapped.current){farm.current.position.copy(position.current);farm.current.quaternion.copy(rotation.current);snapped.current=true;}
  else{farm.current.position.lerp(position.current,.4);farm.current.quaternion.slerp(rotation.current,.4);}
  // A tracked miniature in marker-relative units, deliberately not a metric world anchor.
  farm.current.scale.setScalar(.8);
 });
 return null;
}
