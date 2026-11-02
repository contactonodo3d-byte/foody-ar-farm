import { BrandConfig } from '../config/BrandConfig';
import { predictArc, swipeToVelocity } from '../engine/ThrowPhysics';
import type { GameEngine } from '../engine/GameEngine';
import { useEffect, type RefObject } from 'react';
import { useThree } from '@react-three/fiber';
import { Matrix4, Plane, Raycaster, Vector2, Vector3, type Camera, type Group } from 'three';

function farmPoint(event: PointerEvent, canvas: HTMLCanvasElement, camera: Camera, farm: Group) {
 const rect = canvas.getBoundingClientRect();
 if (rect.width < 2 || rect.height < 2) return null;
 const ray = new Raycaster();
 ray.setFromCamera(new Vector2((event.clientX - rect.left) / rect.width * 2 - 1, -((event.clientY - rect.top) / rect.height) * 2 + 1), camera);
 const normal = new Vector3(0, 1, 0).transformDirection(farm.matrixWorld);
 const origin = farm.localToWorld(new Vector3(0, 0, 0));
 const hit = ray.ray.intersectPlane(new Plane().setFromNormalAndCoplanarPoint(normal, origin), new Vector3());
 if (!hit) return null;
 const local = farm.worldToLocal(hit.clone());
 if (!Number.isFinite(local.x) || !Number.isFinite(local.z) || Math.abs(local.x) > 3 || Math.abs(local.z) > 3) return null;
 return { x: local.x, z: local.z };
}

function lookDirection(camera: Camera, farm: Group) {
 const direction = new Vector3();
 camera.getWorldDirection(direction);
 direction.transformDirection(new Matrix4().copy(farm.matrixWorld).invert());
 direction.y = 0;
 if (direction.lengthSq() < 1e-6) direction.set(0, 0, -1);
 direction.normalize();
 return { x: direction.x, z: direction.z };
}

export function ThrowControl({ farm, engine, enabled, onNotice }: { farm: RefObject<Group | null>; engine: GameEngine; enabled: boolean; onNotice: (message: string) => void }) {
 const { camera, gl } = useThree();
 useEffect(() => {
  if (!enabled) { engine.aim = null; return; }
  const canvas = gl.domElement;
  let raf = 0;
  let active: { id: number; sx: number; sz: number; px: number; pz: number; t: number } | null = null;
  const refresh = () => {
   const group = farm.current;
   if (!active || !group) return;
   const held = Math.max(0, (performance.now() - active.t) / 1000);
   const charge = Math.min(1, held / 0.5);
   const velocity = swipeToVelocity(active.px - active.sx, active.pz - active.sz, Math.max(0.08, held), charge, lookDirection(camera, group));
   const color = BrandConfig.foods.find(food => food.id === engine.selectedFood)?.color ?? '#f4bd47';
   engine.aim = { x: active.px, y: 0.62, z: active.pz, charge, color, arc: predictArc({ x: active.px, y: 0.62, z: active.pz }, velocity) };
  };
  const down = (event: PointerEvent) => {
   if (event.button !== 0 || active || !farm.current) return;
   const point = farmPoint(event, canvas, camera, farm.current);
   if (!point || Math.max(Math.abs(point.x), Math.abs(point.z)) > 1.65) return;
   event.preventDefault();
   active = { id: event.pointerId, sx: point.x, sz: point.z, px: point.x, pz: point.z, t: performance.now() };
   canvas.setPointerCapture(event.pointerId);
   refresh();
   cancelAnimationFrame(raf);
   const tick = () => { refresh(); raf = requestAnimationFrame(tick); };
   raf = requestAnimationFrame(tick);
  };
  const move = (event: PointerEvent) => {
   if (!active || event.pointerId !== active.id || !farm.current) return;
   const point = farmPoint(event, canvas, camera, farm.current);
   if (!point) return;
   active.px = point.x; active.pz = point.z;
   refresh();
  };
  const up = (event: PointerEvent) => {
   if (!active || event.pointerId !== active.id) return;
   const group = farm.current;
   const held = Math.max(0.08, (performance.now() - active.t) / 1000);
   const charge = Math.min(1, held / 0.5);
   const fallback = group ? lookDirection(camera, group) : { x: 0, z: -1 };
   const velocity = swipeToVelocity(active.px - active.sx, active.pz - active.sz, held, charge, fallback);
   const product = BrandConfig.foods.find(food => food.id === engine.selectedFood);
   const error = engine.launch(engine.selectedFood, { x: active.px, y: 0.62, z: active.pz }, velocity);
   onNotice(error ?? `¡Ahí va ${product?.name ?? 'el alimento'}!`);
   engine.aim = null;
   active = null;
   cancelAnimationFrame(raf);
   if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
  };
  canvas.addEventListener('pointerdown', down);
  canvas.addEventListener('pointermove', move);
  canvas.addEventListener('pointerup', up);
  canvas.addEventListener('pointercancel', up);
  return () => {
   cancelAnimationFrame(raf);
   engine.aim = null;
   canvas.removeEventListener('pointerdown', down);
   canvas.removeEventListener('pointermove', move);
   canvas.removeEventListener('pointerup', up);
   canvas.removeEventListener('pointercancel', up);
  };
 }, [camera, enabled, engine, farm, gl, onNotice]);
 return null;
}
