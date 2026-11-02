import { describe, it, expect } from 'vitest';
import { evaluateBoundary, evaluateBoundaryEdges, contain } from '../engine/BoundarySystem';
describe('metric square boundary', () => {
 it.each([[0,'SAFE'],[0.899,'SAFE'],[0.9,'WARNING'],[1.2,'WARNING'],[1.201,'DANGER'],[1.5,'DANGER'],[1.501,'OUTSIDE']])('x=%s is %s', (x,state) => { expect(evaluateBoundary({x:Number(x),z:0}).state).toBe(state); });
 it('is symmetric on every edge and corner', () => { for (const x of [-1.4,1.4]) for (const z of [-1.4,1.4]) expect(evaluateBoundary({x,z}).state).toBe('DANGER'); expect(evaluateBoundary({x:0,z:-1.6}).state).toBe('OUTSIDE'); });
 it('never pauses virtual or unreliable tracking', () => { expect(evaluateBoundary({x:2,z:0}).shouldPause).toBe(false); expect(evaluateBoundary({x:2,z:0},true).shouldPause).toBe(true); expect(evaluateBoundary({x:0,z:0},true).shouldPause).toBe(false); });
 it('contains animal centers with their radius', () => { expect(contain({x:3,z:-4},0.2)).toEqual({x:1.3,z:-1.3}); });
 it('rejects invalid tracking data', () => { expect(() => evaluateBoundary({x:NaN,z:0})).toThrow(); });
});

describe('directional wall activation', () => {
 it.each([
  [{x:1.35,z:0}, 'east'], [{x:-1.35,z:0}, 'west'],
  [{x:0,z:1.35}, 'south'], [{x:0,z:-1.35}, 'north'],
 ])('activates only the approached side at %j', (position,id) => {
  const edges=evaluateBoundaryEdges(position);
  expect(edges.filter(e=>e.state!=='SAFE').map(e=>e.id)).toEqual([id]);
  expect(edges.find(e=>e.id===id)?.state).toBe('DANGER');
 });
 it('activates both neighboring walls at corners', () => {
  expect(evaluateBoundaryEdges({x:-1.35,z:1.35}).filter(e=>e.state==='DANGER').map(e=>e.id)).toEqual(['south','west']);
 });
 it('keeps the crossed wall active outside and hides all walls at center', () => {
  expect(evaluateBoundaryEdges({x:1.7,z:0}).filter(e=>e.state!=='SAFE').map(e=>e.id)).toEqual(['east']);
  expect(evaluateBoundaryEdges({x:0,z:0}).every(e=>e.state==='SAFE')).toBe(true);
 });
});

describe('perimeter context effects', () => {
 it.each([{x:1.35,z:0},{x:-1.35,z:0},{x:0,z:1.35},{x:0,z:-1.35},{x:1.7,z:0}])('shows all walls and emphasizes the approached edge at %j', position => {
  const edges=evaluateBoundaryEdges(position);
  expect(edges.every(e=>e.intensity>0)).toBe(true);
  expect(edges.filter(e=>e.intensity===0.48)).toHaveLength(1);
  expect(edges.filter(e=>e.intensity===0.12)).toHaveLength(3);
 });
 it('shows softer context during warning', () => {
  const edges=evaluateBoundaryEdges({x:1.05,z:0});
  expect(edges.find(e=>e.id==='east')?.intensity).toBe(0.24);
  expect(edges.find(e=>e.id==='west')?.intensity).toBe(0.06);
  expect(edges.every(e=>e.effectState==='WARNING')).toBe(true);
 });
 it('emphasizes both corner walls and clears effects at center', () => {
  expect(evaluateBoundaryEdges({x:1.35,z:-1.35}).filter(e=>e.intensity===0.48)).toHaveLength(2);
  expect(evaluateBoundaryEdges({x:0,z:0}).every(e=>e.intensity===0)).toBe(true);
 });
});
