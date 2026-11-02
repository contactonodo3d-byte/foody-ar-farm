import { useCallback, useEffect, useRef, useState } from 'react';
import { CameraOverlayAdapter } from '../ar/CameraOverlayAdapter';
import { VirtualAdapter } from '../ar/ExperienceAdapter';
import type { GameEngine } from '../engine/GameEngine';
export function useCamera(engine:GameEngine){
 const video=useRef<HTMLVideoElement>(null),adapter=useRef<CameraOverlayAdapter|null>(null);
 const [active,setActive]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const stop=useCallback(()=>{adapter.current?.dispose();adapter.current=null;if(video.current)video.current.srcObject=null;if(engine.adapter.mode==='camera'||engine.adapter.mode==='marker')engine.adapter=new VirtualAdapter();setActive(false);setBusy(false);},[engine]);
 const start=useCallback(async()=>{
  if(!video.current)return false;setBusy(true);setError('');
  const camera=new CameraOverlayAdapter();adapter.current?.dispose();adapter.current=camera;
  try{if(await camera.start(video.current)){engine.adapter=camera;setActive(true);return true;}return false;}
  catch(error){if(adapter.current===camera){camera.dispose();setError(error instanceof Error?error.message:'No se pudo abrir la cámara.');}return false;}
  finally{if(adapter.current===camera)setBusy(false);}
 },[engine]);
 useEffect(()=>{const hide=()=>{if(document.hidden)stop();};document.addEventListener('visibilitychange',hide);window.addEventListener('pagehide',stop);return()=>{document.removeEventListener('visibilitychange',hide);window.removeEventListener('pagehide',stop);adapter.current?.dispose();};},[stop]);
 return {video,active,busy,error,start,stop};
}
