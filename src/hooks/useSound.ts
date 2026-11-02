import { useCallback, useEffect, useRef, useState } from 'react';
function blip(context: AudioContext, from: number, to: number, duration: number) {
 const oscillator = context.createOscillator(), gain = context.createGain(), start = context.currentTime;
 oscillator.type = 'sine'; oscillator.frequency.setValueAtTime(from, start); oscillator.frequency.exponentialRampToValueAtTime(Math.max(40, to), start + duration);
 gain.gain.setValueAtTime(.0001, start); gain.gain.exponentialRampToValueAtTime(.045, start + .015); gain.gain.exponentialRampToValueAtTime(.0001, start + duration);
 oscillator.connect(gain); gain.connect(context.destination); oscillator.start(start); oscillator.stop(start + duration + .02);
 oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
}
export function useSound(points: number, cues: { thrown: number; landed: number } = { thrown: 0, landed: 0 }) {
 const context = useRef<AudioContext | null>(null), lastScore = useRef(points), lastThrow = useRef(cues.thrown), lastLand = useRef(cues.landed);
 const [enabled, setEnabled] = useState(false), [error, setError] = useState('');
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
 useEffect(()=>{ if(cues.thrown>lastThrow.current&&enabled&&context.current?.state==='running') blip(context.current,720,180,.12); lastThrow.current=cues.thrown; },[cues.thrown,enabled]);
 useEffect(()=>{ if(cues.landed>lastLand.current&&enabled&&context.current?.state==='running') blip(context.current,260,140,.08); lastLand.current=cues.landed; },[cues.landed,enabled]);
 useEffect(()=>()=>{void context.current?.close();context.current=null;},[]);
 return {enabled,toggle,error};
}
