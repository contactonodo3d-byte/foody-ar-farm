import { describe, it, expect } from 'vitest';
import { AnimalAI, animalConfig, walkable } from '../engine/AnimalAI';
describe('animal simulation',()=>{
 it('contains every animal for five simulated minutes',()=>{
  const ai=new AnimalAI();const states=new Set<string>();
  for(let i=0;i<9000;i++){ai.update(1/30);for(const a of ai.animals){states.add(a.state);const r=animalConfig[a.species].radius;expect(Math.abs(a.position.x)).toBeLessThanOrEqual(1.5-r+1e-8);expect(Math.abs(a.position.z)).toBeLessThanOrEqual(1.5-r+1e-8);expect(walkable(a.position,r)).toEqual(a.position);}}
  expect(states.has('follow')).toBe(true);expect(states.has('peck')).toBe(true);expect(states.has('wander')).toBe(true);
 });
 it('moves every species and is deterministic with a fixed seed',()=>{const a=new AnimalAI(9),b=new AnimalAI(9);const initial=structuredClone(a.animals);for(let i=0;i<300;i++){a.update(1/30);b.update(1/30);}expect(a.animals).toEqual(b.animals);for(const animal of a.animals)expect(animal.position).not.toEqual(initial.find(x=>x.id===animal.id)?.position);});
 it('ignores invalid time and caps long background gaps',()=>{const ai=new AnimalAI();const initial=structuredClone(ai.animals);ai.update(NaN);ai.update(-1);expect(ai.animals).toEqual(initial);ai.update(100);expect(ai.animals[0].phase).toBeCloseTo(.25);});
 it('projects targets outside the barn and within the farm',()=>{const p=walkable({x:-.85,z:-.85},.18);expect(p.x<=-1.33||p.x>=-.37||p.z<=-1.27||p.z>=-.43).toBe(true);expect(walkable({x:4,z:-4},.18)).toEqual({x:1.32,z:-1.32});});
});
