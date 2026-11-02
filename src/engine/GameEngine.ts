import { evaluateBoundary, type Position } from './BoundarySystem';
import { AnimalAI } from './AnimalAI';
import { FeedingSystem, type FeedEvent } from './FeedingSystem';
import { ScoreSystem } from './ScoreSystem';
import { FarmConfig } from '../config/BrandConfig';
import type { ExperienceAdapter } from '../ar/ExperienceAdapter';
export type GamePhase='ready'|'playing'|'results';
export class GameEngine {
 ai = new AnimalAI(); readonly feeding=new FeedingSystem(); readonly score=new ScoreSystem();
 paused=false;
 phase:GamePhase='ready'; elapsed=0; events:FeedEvent[]=[]; selectedFood='grain';
 constructor(public adapter: ExperienceAdapter) {}
 start(){this.ai=new AnimalAI();this.feeding.reset();this.score.reset();this.events=[];this.elapsed=0;this.phase='playing';}
 update(dt:number){
  if(!Number.isFinite(dt)||dt<=0||this.paused||this.safetyMessage)return;
  if(this.phase==='results')return;
  if(this.phase==='ready'){this.ai.update(dt);return;}
  // Time uses elapsed seconds; only simulation steps are bounded after a dropped frame.
  const activeTime=Math.min(dt,FarmConfig.duration-this.elapsed);
  this.elapsed=Math.min(FarmConfig.duration,this.elapsed+activeTime);
  this.score.update(this.elapsed);
  let remaining=Math.min(activeTime,.25);
  while(remaining>1e-8){const step=Math.min(remaining,1/30);this.ai.update(step);this.feeding.update(step,this.ai.animals,a=>{
   const points=this.score.award(this.elapsed);this.events.push({animalId:a.id,position:{...a.position},time:this.elapsed,points});
  });remaining-=step;}
  this.events=this.events.filter(e=>this.elapsed-e.time<1.8);
  if(this.elapsed>=FarmConfig.duration){this.phase='results';this.feeding.drops=[];}
 }
 placeFood(position:Position){if(this.paused||this.safetyMessage)return 'Partida pausada. Volvé al área y recuperá el seguimiento.';if(this.phase!=='playing')return 'Empezá una partida para alimentar.';return this.feeding.place(this.selectedFood,position,this.elapsed);}
 get safetyMessage(){
  if(this.adapter.mode==='marker'||this.adapter.mode==='world')return this.adapter.getPauseReason?.()??'';
  if(this.adapter.mode!=='spatial')return '';
  const tracking=this.adapter.getPauseReason?.();
  if(tracking)return tracking;
  if(!this.adapter.reliablePhysicalTracking)return 'Esperando seguimiento espacial fiable.';
  return this.getBoundary().shouldPause?'¡Volvé al área! Partida pausada.':'';
 }
 get remaining(){return Math.max(0,FarmConfig.duration-this.elapsed);}
 getBoundary(position: Position = this.adapter.getPosition()) { return evaluateBoundary(position, this.adapter.reliablePhysicalTracking); }
 snapshot(){return {safetyMessage:this.safetyMessage,trackedPosition:this.adapter.mode==='spatial'?this.adapter.getPosition():this.adapter.getTrackedPosition?.()??null,phase:this.phase,seconds:Math.ceil(this.remaining),points:this.score.points,fed:this.score.fed,combo:this.score.combo,bestCombo:this.score.bestCombo,multiplier:this.score.multiplier};}
}
