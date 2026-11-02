import { useEffect, useLayoutEffect, useState } from 'react';
import type { GameEngine } from '../engine/GameEngine';
export function useGame(engine:GameEngine,paused:boolean){
 const [snapshot,setSnapshot]=useState(()=>engine.snapshot());
 useLayoutEffect(()=>{engine.paused=paused;setSnapshot(engine.snapshot());},[engine,paused]);
 useEffect(()=>{
  let frame=0,last=performance.now();
  const resetClock=()=>{last=performance.now();};
  const tick=(now:number)=>{
   const dt=(now-last)/1000;last=now;
   if(engine.adapter.mode!=='spatial'&&!document.hidden)engine.update(dt);
   frame=requestAnimationFrame(tick);
  };
  document.addEventListener('visibilitychange',resetClock);frame=requestAnimationFrame(tick);
  const publish=setInterval(()=>setSnapshot(engine.snapshot()),100);
  return()=>{cancelAnimationFrame(frame);clearInterval(publish);document.removeEventListener('visibilitychange',resetClock);};
 },[engine,paused]);
 return snapshot;
}
