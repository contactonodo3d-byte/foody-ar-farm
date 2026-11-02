import { useCallback, useEffect, useRef, useState } from 'react';
export function useSound(points:number){
 const context=useRef<AudioContext|null>(null),lastScore=useRef(points);
 const [enabled,setEnabled]=useState(false),[error,setError]=useState('');
 const toggle=useCallback(async()=>{
  if(enabled){setEnabled(false);return;}
  try{context.current??=new AudioContext();await context.current.resume();setEnabled(true);setError('');}catch{setError('El sonido no está disponible en este navegador.');}
 },[enabled]);
 useEffect(()=>{
  if(points>lastScore.current&&enabled&&context.current?.state==='running'){
   const ctx=context.current;
   for(let i=0;i<3;i++){
    const oscillator=ctx.createOscillator(),gain=ctx.createGain(),start=ctx.currentTime+i*.075;
    oscillator.type='sine';oscillator.frequency.setValueAtTime([523.25,659.25,783.99][i],start);
    gain.gain.setValueAtTime(0,start);gain.gain.linearRampToValueAtTime(.055,start+.012);gain.gain.exponentialRampToValueAtTime(.001,start+.16);
    oscillator.connect(gain);gain.connect(ctx.destination);oscillator.start(start);oscillator.stop(start+.18);oscillator.onended=()=>{oscillator.disconnect();gain.disconnect();};
   }
  }
  lastScore.current=points;
 },[points,enabled]);
 useEffect(()=>()=>{void context.current?.close();context.current=null;},[]);
 return {enabled,toggle,error};
}
