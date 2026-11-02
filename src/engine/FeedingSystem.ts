import { BrandConfig, type FoodProduct } from '../config/BrandConfig';
import { evaluateBoundary, type Position } from './BoundarySystem';
import { type Animal, walkable, animalConfig } from './AnimalAI';
export interface FoodDrop { id:number; product:FoodProduct; position:Position; age:number; eater?:string; eatenFor:number }
export interface FeedEvent { animalId:string; position:Position; time:number; points:number }
export class FeedingSystem {
 drops:FoodDrop[]=[];
 private nextId=0; private lastPlaced=-Infinity;
 reset(){this.drops=[];this.nextId=0;this.lastPlaced=-Infinity;}
 place(productId:string,position:Position,time:number){
  const product=BrandConfig.foods.find(p=>p.id===productId);
  if(!product||!Number.isFinite(position.x)||!Number.isFinite(position.z)||evaluateBoundary(position).state==='OUTSIDE')return 'Tocá dentro del campo para dejar alimento.';
  if(time-this.lastPlaced<.4)return 'Un poquito más despacio: dejá que lleguen.';
  if(this.drops.length>=8)return 'Hay comida esperando. Dejá que coman primero.';
  this.drops.push({id:this.nextId++,product,position:walkable(position,.20),age:0,eatenFor:0});this.lastPlaced=time;
  return null;
 }
 update(dt:number,animals:Animal[],onFed:(a:Animal)=>void){
  const finished=new Set<number>();
  for(const drop of this.drops){
   drop.age+=dt;
   if(drop.age>12){finished.add(drop.id);continue;}
   let eater=animals.find(a=>a.id===drop.eater);
   if(!eater){
    const busy=new Set(this.drops.filter(d=>d.eater).map(d=>d.eater));
    eater=animals.filter(a=>a.species===drop.product.species&&!busy.has(a.id)&&a.state!=='happy').sort((a,b)=>Math.hypot(a.position.x-drop.position.x,a.position.z-drop.position.z)-Math.hypot(b.position.x-drop.position.x,b.position.z-drop.position.z))[0];
    if(eater)drop.eater=eater.id;
   }
   if(!eater)continue;
   const radius=animalConfig[eater.species].radius;
   eater.target=walkable(drop.position,radius);eater.remaining=1;
   if(Math.hypot(eater.position.x-eater.target.x,eater.position.z-eater.target.z)<.19){
    eater.state='eat';eater.moving=false;drop.eatenFor+=dt;
    if(drop.eatenFor>=.8){eater.state='happy';eater.remaining=1.3;finished.add(drop.id);onFed(eater);}
   }else{eater.state='approach';drop.eatenFor=0;}
  }
  const expired=this.drops.filter(d=>finished.has(d.id));
  this.drops=this.drops.filter(d=>!finished.has(d.id));
  for(const drop of expired){const eater=animals.find(a=>a.id===drop.eater);if(eater?.state==='approach'||eater?.state==='eat'){eater.state='idle';eater.remaining=.3;}}
 }
}
