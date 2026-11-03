import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Group, Mesh, MeshBasicMaterial } from 'three';
import { BrandConfig } from '../config/BrandConfig';
import { TargetRules } from '../engine/TargetSystem';
import type { GameEngine } from '../engine/GameEngine';

function paint(group: Group, opacity: number) {
 group.traverse(node => {
  const material = (node as Mesh).material as MeshBasicMaterial | undefined;
  if (material && 'opacity' in material) material.opacity = opacity;
 });
}

function Rings() {
 const [bull, mid, outer] = TargetRules.rings;
 return <>
  <mesh raycast={() => {}}><circleGeometry args={[bull.radius, 24]} /><meshBasicMaterial color={BrandConfig.colors.glow} transparent depthWrite={false} /></mesh>
  <mesh raycast={() => {}}><ringGeometry args={[bull.radius + 0.012, mid.radius - 0.01, 32]} /><meshBasicMaterial color={BrandConfig.colors.paper} transparent depthWrite={false} /></mesh>
  <mesh raycast={() => {}}><ringGeometry args={[mid.radius + 0.01, outer.radius - 0.02, 40]} /><meshBasicMaterial color={BrandConfig.colors.olive} transparent depthWrite={false} /></mesh>
  <mesh raycast={() => {}}><ringGeometry args={[outer.radius - 0.02, outer.radius, 40]} /><meshBasicMaterial color={BrandConfig.colors.paper} transparent depthWrite={false} /></mesh>
 </>;
}

/** Flat dianas. The score number is a DOM popup so it stays readable over the camera. */
export function Targets({ engine, reduced }: { engine: GameEngine; reduced: boolean }) {
 const live = useRef<Group>(null);
 const fading = useRef<Group>(null);
 useFrame(({ clock }) => {
  const targets = engine.targets.active;
  live.current?.children.forEach((child, index) => {
   const target = targets[index];
   const group = child as Group;
   group.visible = !!target;
   if (!target) return;
   group.position.set(target.x, 0.012, target.z);
   group.scale.setScalar(reduced ? 1 : 1 + Math.sin(clock.elapsedTime * 2.6 + index) * 0.025);
   paint(group, 1);
  });
  const gone = engine.targets.pops;
  fading.current?.children.forEach((child, index) => {
   const pop = gone[index];
   const group = child as Group;
   if (!pop) { group.visible = false; return; }
   const life = Math.min(1, Math.max(0, (engine.elapsed - pop.time) / 0.36));
   group.visible = life < 1;
   group.position.set(pop.x, 0.014, pop.z);
   group.scale.setScalar(reduced ? 1 : 1 + life * 0.2);
   paint(group, 1 - life);
  });
 });
 return <>
  <group ref={live}>{Array.from({ length: 3 }, (_, index) => <group key={index} visible={false} rotation={[-Math.PI / 2, 0, 0]}><Rings /></group>)}</group>
  <group ref={fading}>{Array.from({ length: 4 }, (_, index) => <group key={index} visible={false} rotation={[-Math.PI / 2, 0, 0]}><Rings /></group>)}</group>
 </>;
}
