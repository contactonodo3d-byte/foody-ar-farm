import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { CanvasTexture, Object3D, SRGBColorSpace, type Group, type InstancedMesh } from 'three';
import * as THREE from 'three';
import { BrandConfig } from '../config/BrandConfig';
import type { GameEngine } from '../engine/GameEngine';

const heartShape = new THREE.Shape();
heartShape.moveTo(0, -.65); heartShape.bezierCurveTo(-1, .05, -.8, .85, -.35, .85); heartShape.bezierCurveTo(-.1, .85, 0, .6, 0, .5); heartShape.bezierCurveTo(0, .6, .1, .85, .35, .85); heartShape.bezierCurveTo(.8, .85, 1, .05, 0, -.65);
const heartGeometry = new THREE.ShapeGeometry(heartShape, 8);
const pelletGeometry = new THREE.SphereGeometry(.016, 6, 4);
const crumbGeometry = new THREE.SphereGeometry(.02, 6, 4);
const labels = new Map<string, CanvasTexture>();

function labelTexture(name: string, color: string) {
 const key = `${name}:${color}`;
 const cached = labels.get(key);
 if (cached) return cached;
 const canvas = document.createElement('canvas');
 canvas.width = 256; canvas.height = 128;
 const ctx = canvas.getContext('2d');
 if (!ctx) return null;
 ctx.fillStyle = '#fffdf2'; ctx.fillRect(0, 0, 256, 128);
 ctx.fillStyle = color; ctx.fillRect(0, 0, 256, 36);
 ctx.fillStyle = '#fffdf2'; ctx.font = '700 22px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('FOODY', 128, 25);
 ctx.fillStyle = BrandConfig.colors.ink; ctx.font = '800 40px sans-serif'; ctx.fillText(name, 128, 92);
 const texture = new CanvasTexture(canvas);
 texture.colorSpace = SRGBColorSpace;
 labels.set(key, texture);
 return texture;
}

function Bag({ color, label }: { color: string; label: string }) {
 const texture = labelTexture(label, color);
 return <group>
  <mesh position={[0, .055, 0]} castShadow raycast={() => {}}><boxGeometry args={[.12, .1, .07]}/><meshStandardMaterial color={color} roughness={.55}/></mesh>
  <mesh position={[0, .11, 0]} raycast={() => {}}><boxGeometry args={[.07, .025, .05]}/><meshStandardMaterial color="#fffdf2"/></mesh>
  <mesh position={[0, .058, .037]} raycast={() => {}}><planeGeometry args={[.09, .055]}/>{texture ? <meshBasicMaterial map={texture}/> : <meshBasicMaterial color="#fffdf2"/>}</mesh>
 </group>;
}

function Bowl({ color }: { color: string }) {
 return <group>
  <mesh position={[0, .03, 0]} castShadow raycast={() => {}}><cylinderGeometry args={[.075, .05, .05, 10]}/><meshStandardMaterial color="#fffdf2" roughness={.45}/></mesh>
  <mesh position={[0, .05, 0]} rotation={[-Math.PI / 2, 0, 0]} raycast={() => {}}><torusGeometry args={[.068, .01, 6, 12]}/><meshStandardMaterial color={color}/></mesh>
  <mesh position={[0, .045, 0]} rotation={[-Math.PI / 2, 0, 0]} raycast={() => {}}><circleGeometry args={[.055, 10]}/><meshStandardMaterial color={color}/></mesh>
 </group>;
}

function FeedChoices() {
 return <>{BrandConfig.foods.map(product => <group key={product.id} name={product.id}>{product.species === 'chick' ? <Bowl color={product.color}/> : <Bag color={product.color} label={product.bagLabel}/>}</group>)}</>;
}
function showProduct(group: { children: { name: string; visible: boolean }[] }, productId: string) {
 group.children.forEach(child => { if (BrandConfig.foods.some(food => food.id === child.name)) child.visible = child.name === productId; });
}

export function FoodEffects({ engine, reduced }: { engine: GameEngine; reduced: boolean }) {
 const drops = useRef<Group>(null);
 const hearts = useRef<Group>(null);
 const flights = useRef<Group>(null);
 const aim = useRef<Group>(null);
 const crumbs = useRef<InstancedMesh>(null);
 const dots = useRef<InstancedMesh>(null);
 const dummy = useMemo(() => new Object3D(), []);
 useFrame(({ camera }) => {
  drops.current?.children.forEach((child, index) => {
   const food = engine.feeding.drops[index];
   child.visible = !!food;
   if (!food) return;
   child.position.set(food.position.x, .02, food.position.z);
   const scale = Math.min(1, food.age * 6 + .35);
   child.scale.setScalar(reduced ? 1 : scale);
   showProduct(child, food.product.id);
   child.traverse(node => {
    const mesh = node as THREE.Mesh;
    if (mesh.geometry === pelletGeometry) ((mesh.material as THREE.MeshStandardMaterial).color).set(food.product.color);
   });
  });
  flights.current?.children.forEach((child, index) => {
   const flight = engine.flights[index];
   child.visible = !!flight;
   if (!flight) return;
   child.position.set(flight.x, flight.y, flight.z);
   child.rotation.x = flight.spin;
   child.rotation.z = flight.spin * .6;
   showProduct(child, flight.productId);
  });
  const preview = engine.aim;
  if (aim.current) {
   aim.current.visible = !!preview;
   if (preview) {
    aim.current.position.set(preview.x, preview.y, preview.z);
    aim.current.scale.setScalar(1.35);
    showProduct(aim.current, engine.selectedFood);
    const ring = aim.current.getObjectByName('Charge');
    if (ring) { ring.scale.setScalar(.7 + preview.charge * .8); (ring as THREE.Mesh<THREE.BufferGeometry, THREE.MeshBasicMaterial>).material.color.set(preview.color); }
   }
  }
  const dotMesh = dots.current;
  if (dotMesh) {
   const arc = preview?.arc ?? [];
   for (let index = 0; index < dotMesh.count; index += 1) {
    const point = arc.length ? arc[Math.round(index / Math.max(1, dotMesh.count - 1) * (arc.length - 1))] : undefined;
    if (!preview || !point) dummy.scale.setScalar(0);
    else {
     dummy.position.set(point.x, point.y, point.z);
     dummy.scale.setScalar(index === dotMesh.count - 1 ? .11 : .055);
    }
    dummy.rotation.set(0, 0, 0);
    dummy.updateMatrix();
    dotMesh.setMatrixAt(index, dummy.matrix);
   }
   dotMesh.instanceMatrix.needsUpdate = true;
  }
  const crumbMesh = crumbs.current;
  if (crumbMesh) {
   let slot = 0;
   const recent = engine.bursts.slice(-4);
   for (const burst of recent) {
    const age = engine.elapsed - burst.time;
    for (let index = 0; index < 6 && slot < crumbMesh.count; index += 1, slot += 1) {
     if (reduced || age < 0 || age > .7) dummy.scale.setScalar(0);
     else {
      const angle = index / 6 * Math.PI * 2 + burst.x;
      const dist = age * (.35 + (index % 3) * .12);
      dummy.position.set(burst.x + Math.cos(angle) * dist, burst.y + age * 1.1 - age * age * 2.4, burst.z + Math.sin(angle) * dist);
      dummy.scale.setScalar(.02 * (1 - age / .7));
     }
     dummy.rotation.set(0, 0, 0);
     dummy.updateMatrix();
     crumbMesh.setMatrixAt(slot, dummy.matrix);
    }
   }
   for (; slot < crumbMesh.count; slot += 1) {
    dummy.scale.setScalar(0); dummy.updateMatrix(); crumbMesh.setMatrixAt(slot, dummy.matrix);
   }
   crumbMesh.instanceMatrix.needsUpdate = true;
  }
  hearts.current?.children.forEach((child, index) => {
   const event = engine.events[index];
   child.visible = !!event;
   if (!event) return;
   const age = engine.elapsed - event.time;
   child.position.set(event.position.x, .45 + (reduced ? 0 : age * .3), event.position.z);
   child.quaternion.copy(camera.quaternion);
   child.scale.setScalar(.095 * (reduced ? 1 : 1 + Math.sin(Math.min(age, 1) * Math.PI) * .2));
   ((child as THREE.Mesh).material as THREE.MeshBasicMaterial).opacity = Math.max(0, 1 - age / 1.8);
  });
 });
 return <>
  <group ref={drops}>{Array.from({ length: 8 }, (_, index) => <group key={index} visible={false}>
   <FeedChoices/>
   {Array.from({ length: 5 }, (_, pellet) => <mesh key={pellet} geometry={pelletGeometry} position={[Math.sin(pellet * 2.4) * .08, .02, Math.cos(pellet * 2.4) * .08]} raycast={() => {}}><meshStandardMaterial color="#f4bd47"/></mesh>)}
  </group>)}</group>
  <group ref={flights}>{Array.from({ length: 6 }, (_, index) => <group key={index} visible={false}><FeedChoices/></group>)}</group>
  <group ref={aim} visible={false}>
   <FeedChoices/>
   <mesh name="Charge" position={[0, -.55, 0]} rotation={[-Math.PI / 2, 0, 0]} raycast={() => {}}><ringGeometry args={[.12, .18, 28]}/><meshBasicMaterial color={BrandConfig.colors.olive} transparent opacity={.95} side={THREE.DoubleSide}/></mesh>
  </group>
  <instancedMesh ref={dots} args={[crumbGeometry, undefined, 28]} raycast={() => {}}><meshBasicMaterial color={BrandConfig.colors.olive}/></instancedMesh>
  <instancedMesh ref={crumbs} args={[crumbGeometry, undefined, 24]} raycast={() => {}}><meshBasicMaterial color="#f4bd47"/></instancedMesh>
  <group ref={hearts}>{Array.from({ length: 12 }, (_, index) => <mesh key={index} geometry={heartGeometry} visible={false} raycast={() => {}}><meshBasicMaterial color="#ee6e77" transparent side={THREE.DoubleSide} depthWrite={false}/></mesh>)}</group>
 </>;
}
