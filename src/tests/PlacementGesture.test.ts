import {describe,it,expect} from 'vitest';
import {BoxGeometry,Group,Mesh} from 'three';
import {pairGesture} from '../engine/PlacementGesture';
import {modelBounds} from '../engine/ModelBounds';
import {AnimalDimensions,FarmConfig} from '../config/BrandConfig';
describe('farm proportions and gesture math',()=>{
 it('pinches proportionally and rotates without jumping at the angle seam',()=>{
  expect(pairGesture([{x:0,y:0},{x:100,y:0}],[{x:0,y:0},{x:200,y:0}],{scale:1,yaw:0})).toEqual({scale:2,yaw:0});
  expect(pairGesture([{x:0,y:0},{x:100,y:0}],[{x:0,y:0},{x:0,y:100}],{scale:1,yaw:0}).yaw).toBe(-90);
  const p=(angle:number)=>({x:100*Math.cos(angle*Math.PI/180),y:100*Math.sin(angle*Math.PI/180)});
  expect(pairGesture([{x:0,y:0},p(179)],[{x:0,y:0},p(-179)],{scale:1,yaw:0}).yaw).toBeCloseTo(-2);
 });
 it('ignores coincident fingers and clamps scale',()=>{
  expect(pairGesture([{x:0,y:0},{x:1,y:0}],[{x:0,y:0},{x:100,y:0}],{scale:1,yaw:12})).toEqual({scale:1,yaw:12});
  expect(pairGesture([{x:0,y:0},{x:20,y:0}],[{x:0,y:0},{x:400,y:0}],{scale:1,yaw:0}).scale).toBe(3);
 });
 it('measures model-local size regardless of AR parent scale and rotation',()=>{
  const parent=new Group(),model=new Group(),mesh=new Mesh(new BoxGeometry(.4,.5,.6));
  parent.position.set(12,7,3);parent.scale.setScalar(2);parent.rotation.y=.7;
  mesh.position.y=.25;model.add(mesh);parent.add(model);
  const bounds=modelBounds(model);expect(bounds.min.y).toBeCloseTo(0);expect(bounds.max.y).toBeCloseTo(.5);
  expect(bounds.max.x-bounds.min.x).toBeCloseTo(.4);
  mesh.geometry.dispose();
 });
 it('sets the 3m area, 1.5m wall and nominal species reference heights',()=>{
  expect(FarmConfig.halfSize*2).toBe(3);expect(FarmConfig.wallHeight).toBe(1.5);
  expect(AnimalDimensions.chicken.height).toBe(.5);expect(AnimalDimensions.chick.height).toBe(.14);expect(AnimalDimensions.rabbit.height).toBe(.4);
 });
});
