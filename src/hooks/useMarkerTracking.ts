import {useEffect,useRef,useState,type RefObject} from 'react';
import * as THREE from 'three';
import {MarkerAdapter} from '../ar/MarkerAdapter';
import type {GameEngine} from '../engine/GameEngine';
export interface MarkerPose {matrix:THREE.Matrix4;fov:number;adapter:MarkerAdapter}
export function useMarkerTracking(video:RefObject<HTMLVideoElement|null>,enabled:boolean,engine:GameEngine){
 const pose=useRef<MarkerPose|null>(null);
 const [message,setMessage]=useState('');
 useEffect(()=>{
  if(!enabled)return;
  let stopped=false,frame=0,last=0,previous='';
  const adapter=new MarkerAdapter(),prior=engine.adapter;
  const canvas=document.createElement('canvas'),ctx=canvas.getContext('2d',{willReadFrequently:true});
  const say=(text:string)=>{if(text!==previous){previous=text;setMessage(text);}};
  engine.adapter=adapter;
  const run=async()=>{
   try{
    const [{default:{AR}},{default:{POS}}]=await Promise.all([import('js-aruco2'),import('js-aruco2/src/posit1.js')]);
    if(stopped)return;
    const detector=new AR.Detector({dictionaryName:'ARUCO_MIP_36h12',maxHammingDistance:1});
    const tick=(now:number)=>{
     if(stopped)return;
     adapter.expire(now);
     const element=video.current;
     if(ctx&&element&&element.readyState>=2&&now-last>=85&&!document.hidden){
      last=now;
      try{
       const bounds=element.getBoundingClientRect(),aspect=bounds.width/Math.max(1,bounds.height);
       canvas.width=Math.min(640,2*Math.round(240*aspect));canvas.height=2*Math.round(canvas.width/(2*aspect));
       const vw=element.videoWidth,vh=element.videoHeight;
       if(vw&&vh&&canvas.width>0&&canvas.height>0){
        // Match object-fit:cover exactly, including portrait and landscape crops.
        const cropWidth=Math.min(vw,vh*aspect),cropHeight=Math.min(vh,vw/aspect);
        ctx.drawImage(element,(vw-cropWidth)/2,(vh-cropHeight)/2,cropWidth,cropHeight,0,0,canvas.width,canvas.height);
        const marker=detector.detect(ctx.getImageData(0,0,canvas.width,canvas.height)).find(m=>m.id===7);
        let valid=false;
        if(marker){
         const estimate=new POS.Posit(1,canvas.width).pose(marker.corners.map(c=>({x:c.x-canvas.width/2,y:canvas.height/2-c.y})));
         const r=estimate.bestRotation,t=estimate.bestTranslation;
         valid=Number.isFinite(estimate.bestError)&&estimate.bestError<=4&&t.length===3&&t[2]>.2&&[...t,...r.flat()].every(Number.isFinite);
         if(valid){
          const matrix=new THREE.Matrix4().set(r[0][0],r[0][1],-r[0][2],t[0],r[1][0],r[1][1],-r[1][2],t[1],-r[2][0],-r[2][1],r[2][2],-t[2],0,0,0,1);
          pose.current={matrix,fov:THREE.MathUtils.radToDeg(2*Math.atan(canvas.height/(2*canvas.width))),adapter};
         }
        }
        adapter.update(valid,now);
       }else adapter.update(false,now);
      }catch{adapter.update(false,now);}
     }
     say(adapter.visible?'Marcador reconocido. Mantenelo dentro de la imagen.':'Buscando marcador Foody… Mostrá el dibujo completo, con buena luz.');
     frame=requestAnimationFrame(tick);
    };
    frame=requestAnimationFrame(tick);
   }catch{say('No se pudo cargar el rastreador. Volvé al modo cámara e intentá de nuevo.');}
  };
  void run();
  return()=>{stopped=true;cancelAnimationFrame(frame);adapter.dispose();pose.current=null;if(engine.adapter===adapter)engine.adapter=prior;};
 },[enabled,engine,video]);
 return {pose,message};
}
