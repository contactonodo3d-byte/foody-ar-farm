import {describe,it,expect} from 'vitest';
import {WorldTrackingAdapter,validWorldFrame} from '../ar/WorldTrackingAdapter';
import {evaluateBoundaryEdges} from '../engine/BoundarySystem';
import {GameEngine} from '../engine/GameEngine';
import type {WorldFrame} from '../ar/XR8Types';
const frame=(x=0):WorldFrame=>({position:{x,y:1.6,z:0},rotation:{x:0,y:0,z:0,w:1},intrinsics:[1,0,0,0,0,1,0,0,0,0,-1,-1,0,0,-.02,0],trackingStatus:'NORMAL'});
describe('markerless SLAM tracking contract',()=>{
 it('requires NORMAL poses with valid projection and orientation',()=>{expect(validWorldFrame(frame())).toBe(true);expect(validWorldFrame({...frame(),trackingStatus:'LIMITED'})).toBe(false);expect(validWorldFrame({...frame(),intrinsics:Array(16).fill(0)})).toBe(false);expect(validWorldFrame({...frame(),rotation:{x:0,y:0,z:0,w:0}})).toBe(false);expect(validWorldFrame({...frame(),position:{x:NaN,y:1,z:0}})).toBe(false);});
 it('requires stable consecutive frames and explicit placement',()=>{const a=new WorldTrackingAdapter();expect(a.place({x:0,y:0,z:0})).toBe(false);for(let i=0;i<3;i++)a.update(frame(1),i*30);expect(a.tracking).toBe(true);expect(a.getPauseReason()).toContain('colocá');expect(a.place({x:0,y:0,z:0})).toBe(true);expect(a.getPosition().x).toBe(1);expect(a.getPauseReason()).toBeNull();});
 it('pauses timer and serving on stale frames, resumes after stable tracking',()=>{const a=new WorldTrackingAdapter(),g=new GameEngine(a);g.start();g.update(1);expect(g.remaining).toBe(60);for(let i=0;i<3;i++)a.update(frame(),i*30);a.place({x:0,y:0,z:0});g.update(1);expect(g.remaining).toBe(59);a.expire(700);g.update(1);expect(g.remaining).toBe(59);expect(g.placeFood({x:0,z:0})).not.toBeNull();for(let i=0;i<3;i++)a.update(frame(),800+i*30);g.update(1);expect(g.remaining).toBe(58);});
 it('never treats responsive SDK units as calibrated physical meters',()=>{const a=new WorldTrackingAdapter(),g=new GameEngine(a);for(let i=0;i<3;i++)a.update(frame(5),i*30);a.place({x:0,y:0,z:0});expect(a.reliablePhysicalTracking).toBe(false);expect(g.getBoundary().state).toBe('OUTSIDE');expect(g.getBoundary().shouldPause).toBe(false);});
 it('clears placement on reference change and owns a copy of frame data',()=>{const a=new WorldTrackingAdapter(),f=frame();for(let i=0;i<3;i++)a.update(f,i*30);a.place({x:0,y:0,z:0});f.position.x=99;expect(a.frame?.position.x).toBe(0);a.resetPlacement();expect(a.origin).toBeNull();expect(a.tracking).toBe(false);});
});

it('publishes live farm-relative coordinates for every boundary effect, never stale tracking',()=>{
 const a=new WorldTrackingAdapter(),g=new GameEngine(a);
 expect(g.snapshot().trackedPosition).toBeNull();
 for(let i=0;i<3;i++)a.update(frame(10),i*30);
 a.place({x:10,y:0,z:0});
 for(const [x,z,edge] of [[1.7,0,'east'],[-1.7,0,'west'],[0,1.7,'south'],[0,-1.7,'north']] as const){
  a.update({...frame(10+x),position:{x:10+x,y:1.6,z}},100);
  const position=g.snapshot().trackedPosition!;
  expect(position.x).toBeCloseTo(x);expect(position.z).toBe(z);
  const effects=evaluateBoundaryEdges(position);
  expect(effects.find(e=>e.id===edge)?.intensity).toBe(.48);
  expect(effects.filter(e=>e.id!==edge).every(e=>e.intensity===.12)).toBe(true);
  expect(g.getBoundary(position).state).toBe('OUTSIDE');
  expect(g.getBoundary(position).shouldPause).toBe(false);
 }
 a.loseTracking();expect(g.snapshot().trackedPosition).toBeNull();
 for(let i=0;i<3;i++)a.update(frame(10),200+i*30);
 expect(g.snapshot().trackedPosition).toEqual({x:0,z:0});
 a.resetPlacement();expect(g.snapshot().trackedPosition).toBeNull();
});

it('keeps rendered translation, rotation and scale consistent with boundary coordinates',()=>{
 const a=new WorldTrackingAdapter();for(let i=0;i<3;i++)a.update({...frame(),position:{x:14,y:1.6,z:20}},i*30);
 a.place({x:10,y:0,z:20});a.setPlacement({x:1,y:.5,z:0,scale:2,yaw:90});
 expect(a.farmOrigin).toEqual({x:11,y:.5,z:20});
 expect(a.getPosition().x).toBeCloseTo(0);expect(a.getPosition().z).toBeCloseTo(1.5);
 a.setPlacement({scale:0,x:Infinity,yaw:999});
 expect(a.placement.scale).toBe(.25);expect(a.placement.x).toBe(1);expect(a.placement.yaw).toBe(180);
 a.resetTransform();expect(a.getPosition()).toEqual({x:4,z:0});
});
