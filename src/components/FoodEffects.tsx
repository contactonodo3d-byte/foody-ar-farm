import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { GameEngine } from '../engine/GameEngine';
const heartShape=new THREE.Shape();
heartShape.moveTo(0,-.65);heartShape.bezierCurveTo(-1,.05,-.8,.85,-.35,.85);heartShape.bezierCurveTo(-.1,.85,0,.6,0,.5);heartShape.bezierCurveTo(0,.6,.1,.85,.35,.85);heartShape.bezierCurveTo(.8,.85,1,.05,0,-.65);
const heartGeometry=new THREE.ShapeGeometry(heartShape,8);
const pelletGeometry=new THREE.SphereGeometry(.018,6,4);
export function FoodEffects({engine,reduced}:{engine:GameEngine;reduced:boolean}){
 const drops=useRef<THREE.Group>(null),hearts=useRef<THREE.Group>(null);
 useFrame(({camera})=>{
  drops.current?.children.forEach((child,i)=>{
   const food=engine.feeding.drops[i];child.visible=!!food;
   if(food){child.position.set(food.position.x,.035,food.position.z);const scale=Math.min(1,food.age*5+.3);child.scale.setScalar(reduced?1:scale);child.children.forEach(pellet=>((pellet as THREE.Mesh).material as THREE.MeshStandardMaterial).color.set(food.product.color));}
  });
  hearts.current?.children.forEach((child,i)=>{
   const event=engine.events[i];child.visible=!!event;
   if(event){const age=engine.elapsed-event.time;child.position.set(event.position.x,.45+(reduced?0:age*.3),event.position.z);child.quaternion.copy(camera.quaternion);child.scale.setScalar(.095*(reduced?1:1+Math.sin(Math.min(age,1)*Math.PI)*.2));((child as THREE.Mesh).material as THREE.MeshBasicMaterial).opacity=Math.max(0,1-age/1.8);}
  });
 });
 return <><group ref={drops}>{Array.from({length:8},(_,i)=><group key={i} visible={false} raycast={()=>{}}>{Array.from({length:7},(_,j)=><mesh key={j} geometry={pelletGeometry} position={[Math.sin(j*2.4)*.07,0,Math.cos(j*2.4)*.07]} raycast={()=>{}}><meshStandardMaterial color="#f4bd47"/></mesh>)}</group>)}</group><group ref={hearts}>{Array.from({length:12},(_,i)=><mesh key={i} geometry={heartGeometry} visible={false} raycast={()=>{}}><meshBasicMaterial color="#ee6e77" transparent side={THREE.DoubleSide} depthWrite={false}/></mesh>)}</group></>;
}
