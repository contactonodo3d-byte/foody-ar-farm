import { useEffect, useRef, type RefObject } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { SpatialAdapter } from './SpatialAdapter';
import { VirtualAdapter } from './ExperienceAdapter';
import type { GameEngine } from '../engine/GameEngine';
export interface SpatialControls {start:()=>Promise<void>;end:()=>Promise<void>}
export interface SpatialStatus {active:boolean;message:string;ready?:boolean}
export function SpatialSession({engine,farm,controls,onStatus}:{engine:GameEngine;farm:RefObject<THREE.Group|null>;controls:RefObject<SpatialControls|null>;onStatus:(status:SpatialStatus)=>void}){
 const {gl,camera,scene}=useThree();
 const session=useRef<XRSession|null>(null),reference=useRef<XRReferenceSpace|null>(null),source=useRef<XRHitTestSource|null>(null);
 const adapter=useRef(new SpatialAdapter()),reticle=useRef<THREE.Mesh>(null),hit=useRef<THREE.Vector3|null>(null),aim=useRef<THREE.Vector3|null>(null);
 const saveCamera=()=>({position:camera.position.clone(),quaternion:camera.quaternion.clone(),projection:camera.projectionMatrix.clone(),inverse:camera.projectionMatrixInverse.clone(),fov:camera instanceof THREE.PerspectiveCamera?camera.fov:43});
 const savedCamera=useRef(saveCamera());
 const status=useRef(onStatus);status.current=onStatus;
 const matrix=useRef(new THREE.Matrix4()),direction=useRef(new THREE.Vector3()),world=useRef(new THREE.Vector3());
 useEffect(()=>{
  let disposed=false;
  const visibility=()=>adapter.current.updateTracking(null);
  const reset=()=>{
   session.current?.removeEventListener('visibilitychange',visibility);
   document.body.removeEventListener('beforexrselect',beforeSelect);
   source.current?.cancel();source.current=null;reference.current=null;session.current=null;adapter.current.dispose();
   if(engine.adapter.mode==='spatial')engine.adapter=new VirtualAdapter();
   if(farm.current){farm.current.position.set(0,0,0);farm.current.visible=true;}
   if(reticle.current)reticle.current.visible=false;
   camera.position.copy(savedCamera.current.position);camera.quaternion.copy(savedCamera.current.quaternion);camera.projectionMatrix.copy(savedCamera.current.projection);camera.projectionMatrixInverse.copy(savedCamera.current.inverse);if(camera instanceof THREE.PerspectiveCamera)camera.fov=savedCamera.current.fov;camera.updateMatrixWorld();
   document.documentElement.classList.remove('spatial-active');
   if(!disposed)status.current({active:false,message:''});
  };
  const select=()=>{
   if(!farm.current)return;
   if(!adapter.current.origin){
    if(!hit.current)return;
    adapter.current.place(hit.current);farm.current.position.copy(hit.current);farm.current.visible=true;
    status.current({active:true,message:'Granja colocada. Elegí alimento, apuntá al suelo y tocá para servir.'});
   }else if(aim.current&&engine.phase==='playing'){
    const origin=adapter.current.origin;
    const error=engine.placeFood({x:aim.current.x-origin.x,z:aim.current.z-origin.z});
    status.current({active:true,message:error??'¡Alimento servido!'});
   }
  };
  const resetReference=()=>{
   adapter.current.resetPlacement();hit.current=null;aim.current=null;if(farm.current)farm.current.visible=false;
   status.current({active:true,message:'El espacio cambió. Volvé a colocar la granja en el suelo.'});
  };
  const beforeSelect=(event:Event)=>{if((event.target as HTMLElement)?.closest('button,a,input,summary'))event.preventDefault();};
  const start=async()=>{
   if(session.current)return;
   if(!navigator.xr||!window.isSecureContext){status.current({active:false,message:'WebXR no está disponible. Usá la demo o la superposición con cámara.'});return;}
   let xr:XRSession|null=null;
   try{
    // Requested directly from the user's button gesture; no camera permission is requested first.
    xr=await navigator.xr.requestSession('immersive-ar',{requiredFeatures:['hit-test','dom-overlay'],domOverlay:{root:document.body}});
    if(disposed){await xr.end();return;}
    session.current=xr;xr.addEventListener('end',reset,{once:true});xr.addEventListener('select',select);xr.addEventListener('visibilitychange',visibility);
    gl.xr.enabled=true;gl.xr.setReferenceSpaceType('local');
    savedCamera.current=saveCamera();
    adapter.current.resetPlacement();engine.adapter=adapter.current;
    await gl.xr.setSession(xr);
    const local=gl.xr.getReferenceSpace();if(!local)throw new Error('No hay referencia espacial.');reference.current=local;
    local.addEventListener('reset',resetReference);
    const viewer=await xr.requestReferenceSpace('viewer');
    source.current=await xr.requestHitTestSource?.({space:viewer})??null;
    if(!source.current)throw new Error('El dispositivo no permite detectar superficies.');
    if(disposed){await xr.end();return;}
    document.body.addEventListener('beforexrselect',beforeSelect);
    adapter.current.resetPlacement();engine.adapter=adapter.current;
    scene.background=null;if(farm.current)farm.current.visible=false;
    document.documentElement.classList.add('spatial-active');
    status.current({active:true,message:'Apuntá a un suelo despejado. Tocá cuando aparezca el aro para colocar la granja de 3 × 3 m.'});
   }catch{
    if(xr)try{await xr.end();}catch{/* Session may already be closed. */}
    reset();
    if(!disposed)status.current({active:false,message:'No se pudo iniciar AR espacial con detección de piso y controles. Usá la demo o el modo cámara.'});
   }
  };
  controls.current={start,end:async()=>{await session.current?.end();}};
  status.current({active:false,message:'',ready:true});
  return()=>{
   disposed=true;controls.current=null;document.body.removeEventListener('beforexrselect',beforeSelect);
   reference.current?.removeEventListener('reset',resetReference);source.current?.cancel();
   if(session.current){session.current.removeEventListener('end',reset);session.current.removeEventListener('select',select);void session.current.end().catch(()=>{});}
   reset();
  };
 },[camera,controls,engine,farm,gl,scene]);
 useFrame((_,dt,frame)=>{
  const local=reference.current;
  if(!session.current||!frame||!local)return;
  const pose=frame.getViewerPose(local);
  const visible=session.current.visibilityState==='visible';
  adapter.current.updateTracking(pose&&visible?pose.transform.position:null,pose?.emulatedPosition??true);
  if(!adapter.current.origin){
   hit.current=null;
   if(visible&&source.current){
    for(const result of frame.getHitTestResults(source.current)){
     const surface=result.getPose(local);if(!surface||surface.emulatedPosition)continue;
     matrix.current.fromArray(surface.transform.matrix);
     if(matrix.current.elements[5]<.92)continue;
     hit.current=new THREE.Vector3().setFromMatrixPosition(matrix.current);break;
    }
   }
   if(reticle.current){reticle.current.visible=!!hit.current;if(hit.current)reticle.current.position.copy(hit.current).y+=.008;}
  }else{
   aim.current=null;
   if(pose&&adapter.current.reliablePhysicalTracking){
    matrix.current.fromArray(pose.transform.matrix);direction.current.set(0,0,-1).transformDirection(matrix.current);world.current.setFromMatrixPosition(matrix.current);
    if(direction.current.y<-.05){const t=(adapter.current.origin.y-world.current.y)/direction.current.y;if(t>0&&t<8)aim.current=world.current.clone().addScaledVector(direction.current,t);}
   }
   if(reticle.current){reticle.current.visible=!!aim.current;if(aim.current)reticle.current.position.copy(aim.current).y+=.008;}
  }
  // XR animation frames own gameplay time during an immersive session.
  engine.update(dt);
 });
 return <mesh ref={reticle} visible={false} rotation={[-Math.PI/2,0,0]} raycast={()=>{}}><ringGeometry args={[.09,.115,32]}/><meshBasicMaterial color="#fff7ce" side={THREE.DoubleSide} depthTest={false}/></mesh>;
}
