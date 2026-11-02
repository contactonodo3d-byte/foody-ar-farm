import {AnimalDimensions} from '../config/BrandConfig';
import {modelBounds} from '../engine/ModelBounds';
import { useLayoutEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { SphereGeometry, type Group } from 'three';
import type { Animal } from '../engine/AnimalAI';
import type { GameEngine } from '../engine/GameEngine';
const animalSphere = new SphereGeometry(1, 12, 8);
function Ball({at,scale,color}:{at:[number,number,number];scale:[number,number,number];color:string}){
 return <mesh geometry={animalSphere} position={at} scale={scale} castShadow raycast={()=>{}}><meshStandardMaterial color={color} roughness={.85}/></mesh>;
}
function AnimalModel({animal,paused}:{animal:Animal;paused:boolean}){
 const root=useRef<Group>(null),body=useRef<Group>(null),head=useRef<Group>(null);
 const rabbit=animal.species==='rabbit',chick=animal.species==='chick';
 const floorOffset=useRef(0);
 useLayoutEffect(()=>{if(!root.current||!body.current)return;const bounds=modelBounds(body.current),height=bounds.max.y-bounds.min.y;const scale=AnimalDimensions[animal.species].height/height;root.current.scale.setScalar(scale);floorOffset.current=-bounds.min.y*scale;},[animal.species]);
 const coat=rabbit?'#e1c9ac':chick?'#ffe078':'#fff5df';
 useFrame(()=>{
  if(!root.current||!body.current||!head.current)return;
  root.current.position.set(animal.position.x,floorOffset.current,animal.position.z);root.current.rotation.y=animal.heading;
  const bounce=!paused&&animal.moving?Math.max(0,Math.sin(animal.phase*(rabbit?10:16)))*(rabbit?.12:.025):0;
  body.current.position.y=bounce;
  body.current.rotation.z=!paused&&animal.moving&&!rabbit?Math.sin(animal.phase*16)*.055:0;
  head.current.rotation.x=!paused&&(animal.state==='peck'||animal.state==='eat')?Math.max(0,Math.sin(animal.phase*13))*.85:0;
  if(!paused&&animal.state==='happy')body.current.position.y=Math.abs(Math.sin(animal.phase*14))*.09;
 });
 return <group ref={root} name={animal.id} >
 <group ref={body}>
 <Ball at={[0,.2,0]} scale={rabbit?[.15,.14,.23]:[.17,.19,.19]} color={coat}/>
 <Ball at={[-.145,.21,0]} scale={[.045,.10,.12]} color={rabbit?'#d6b895':chick?'#f6c551':'#eadbb9'}/>
 <Ball at={[.145,.21,0]} scale={[.045,.10,.12]} color={rabbit?'#d6b895':chick?'#f6c551':'#eadbb9'}/>
 <Ball at={[0,.23,-.18]} scale={[.065,.075,.07]} color={rabbit?'#fff6e5':coat}/>
 <group ref={head} position={[0,.29,.12]}>
 <Ball at={[0,0,.025]} scale={[.12,.125,.12]} color={coat}/>
 {rabbit?<>{[-1,1].map(side=><group key={side} position={[side*.06,.15,0]} rotation={[0,0,-side*.17]}><Ball at={[0,.045,0]} scale={[.041,.15,.043]} color={coat}/><Ball at={[0,.05,.034]} scale={[.022,.10,.012]} color="#e6a6a0"/></group>)}<Ball at={[0,-.025,.135]} scale={[.032,.022,.02]} color="#d6938b"/></>:<><mesh position={[0,-.025,.155]} rotation={[Math.PI/2,0,0]} raycast={()=>{}}><coneGeometry args={[.055,.11,4]}/><meshStandardMaterial color="#eaa23d"/></mesh>{!chick&&<><Ball at={[0,.12,.015]} scale={[.04,.065,.07]} color="#e45e4d"/><Ball at={[0,-.09,.11]} scale={[.035,.05,.028]} color="#e45e4d"/></>}</>}
 {[-1,1].map(side=><Ball key={side} at={[side*.083,.025,.108]} scale={[.017,.023,.013]} color="#283c35"/>)}
 </group>
 {[-1,1].map(side=><Ball key={side} at={[side*.075,.035,.07]} scale={rabbit?[.063,.035,.11]:[.035,.025,.065]} color={rabbit?'#d4b89a':'#eaa23d'}/>)}
 </group></group>;
}
export function Animals({engine,paused}:{engine:GameEngine;paused:boolean}){
 return <group name="farm-animals">{engine.ai.animals.map(animal=><AnimalModel key={animal.id} animal={animal} paused={paused}/>)}</group>;
}
