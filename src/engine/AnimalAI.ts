import {AnimalDimensions} from '../config/BrandConfig';
import { contain, type Position } from './BoundarySystem';
export type Species = 'chicken' | 'chick' | 'rabbit';
export type AnimalState = 'idle' | 'wander' | 'follow' | 'peck' | 'approach' | 'eat' | 'happy';
export interface Animal {
 id: string; species: Species; position: Position; target: Position; heading: number;
 state: AnimalState; remaining: number; phase: number; moving: boolean;
}
export const animalConfig: Record<Species, { radius: number; speed: number }> = {
 chicken: { radius: AnimalDimensions.chicken.radius, speed: .22 }, chick: { radius: AnimalDimensions.chick.radius, speed: .37 }, rabbit: { radius: AnimalDimensions.rabbit.radius, speed: .32 },
};
export function walkable(p: Position, radius: number): Position {
 const q = contain(p, radius);
 // Keep animals outside the barn footprint, including their body radius.
 const left = -1.15 - radius, right = -.55 + radius, back = -1.09 - radius, front = -.61 + radius;
 if (q.x > left && q.x < right && q.z > back && q.z < front) {
  const exits = [{d:q.x-left,x:left,z:q.z},{d:right-q.x,x:right,z:q.z},{d:q.z-back,x:q.x,z:back},{d:front-q.z,x:q.x,z:front}];
  exits.sort((a,b)=>a.d-b.d); return contain(exits[0],radius);
 }
 return q;
}
export class AnimalAI {
 animals: Animal[];
 private seed: number;
 constructor(seed = 42) {
  this.seed=seed;
  const roster: [Species,number,number][]=[['chicken',-.7,.45],['chicken',.65,-.5],['chick',-.4,.7],['chick',-.8,.85],['chick',.9,-.25],['rabbit',.65,.65],['rabbit',.1,-.85]];
  this.animals=roster.map(([species,x,z],i)=>({id:`${species}-${i}`,species,position:{x,z},target:{x,z},heading:i,state:'idle',remaining:.4+i*.25,phase:i*1.7,moving:false}));
 }
 private random() { this.seed=(Math.imul(this.seed,1664525)+1013904223)>>>0; return this.seed/4294967296; }
 private choose(animal:Animal) {
  animal.remaining=1.2+this.random()*2.6;
  animal.state=this.random()<.3?(animal.species==='rabbit'?'idle':'peck'):'wander';
  animal.target=walkable({x:(this.random()-.5)*2.6,z:(this.random()-.5)*2.6},animalConfig[animal.species].radius);
 }
 update(dt:number) {
  if (!Number.isFinite(dt) || dt<=0) return;
  let time=Math.min(dt,.25);
  while(time>1e-8){ const step=Math.min(time,1/30);this.step(step);time-=step; }
 }
 private step(dt:number) {
  for(const a of this.animals){
   a.phase+=dt; a.remaining-=dt; a.moving=false;
   if(a.remaining<=0) this.choose(a);
   if(a.state==='happy'||a.state==='eat'||a.state==='idle'||a.state==='peck') continue;
   let target=a.target;
   if(a.species==='chick'){
    const leader=this.animals.filter(b=>b.species==='chicken').sort((b,c)=>Math.hypot(b.position.x-a.position.x,b.position.z-a.position.z)-Math.hypot(c.position.x-a.position.x,c.position.z-a.position.z))[0];
    if(leader && a.state!=='approach'){
     const distance=Math.hypot(leader.position.x-a.position.x,leader.position.z-a.position.z);
     if(distance>.36){a.state='follow';target=leader.position;}else{a.state='idle';a.remaining=.4;continue;}
    }
   }
   const dx=target.x-a.position.x,dz=target.z-a.position.z,distance=Math.hypot(dx,dz);
   if(distance<.07){a.state=a.state==='approach'?'eat':a.species==='rabbit'?'idle':'peck';a.remaining=.8;continue;}
   let vx=dx/distance,vz=dz/distance;
   for(const b of this.animals){if(a===b)continue;const bx=a.position.x-b.position.x,bz=a.position.z-b.position.z,d=Math.hypot(bx,bz),limit=animalConfig[a.species].radius+animalConfig[b.species].radius;
    if(d>1e-5&&d<limit){vx+=bx/d*(1-d/limit)*1.8;vz+=bz/d*(1-d/limit)*1.8;}
   }
   const length=Math.hypot(vx,vz)||1; const speed=animalConfig[a.species].speed;
   const stride=a.species==='rabbit'?(Math.sin(a.phase*10)>-.25?1.5:.12):1;
   a.position=walkable({x:a.position.x+vx/length*Math.min(distance,speed*dt*stride),z:a.position.z+vz/length*Math.min(distance,speed*dt*stride)},animalConfig[a.species].radius);
   const angle=Math.atan2(vx,vz),diff=Math.atan2(Math.sin(angle-a.heading),Math.cos(angle-a.heading));
   a.heading+=diff*Math.min(1,dt*8);a.moving=true;
  }
 }
}
