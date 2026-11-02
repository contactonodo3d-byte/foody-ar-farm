import {useCallback,useEffect,useMemo,useRef,useState} from 'react';
import {XR8Session,type WorldStatus} from '../ar/XR8Session';
import {inspectXR8Installation} from '../ar/XR8Loader';
import type {GameEngine} from '../engine/GameEngine';
export function useWorldTracking(engine:GameEngine){
 const canvas=useRef<HTMLCanvasElement>(null),mounted=useRef(true);
 const [installed,setInstalled]=useState(false),[status,setStatus]=useState<WorldStatus>({phase:'idle',message:'',canPlace:false});
 const session=useMemo(()=>new XR8Session(engine,status=>{if(mounted.current)setStatus(status);}),[engine]);
 useEffect(()=>{mounted.current=true;let current=true;void inspectXR8Installation().then(result=>{if(current)setInstalled(result.installed);});const hide=()=>{if(document.hidden)void session.stop();};document.addEventListener('visibilitychange',hide);window.addEventListener('pagehide',hide);return()=>{current=false;mounted.current=false;document.removeEventListener('visibilitychange',hide);window.removeEventListener('pagehide',hide);void session.stop();};},[session]);
 const start=useCallback(async()=>{if(canvas.current)await session.start(canvas.current);},[session]);
 const stop=useCallback(()=>session.stop(),[session]);
 const place=useCallback(()=>session.place(),[session]);
 return {canvas,installed,status,start,stop,place,reposition:()=>session.reposition(),adapter:session.adapter,active:['starting','scanning','placed'].includes(status.phase)};
}
