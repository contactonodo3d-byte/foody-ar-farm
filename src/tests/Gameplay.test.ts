import { describe,it,expect } from 'vitest';
import { ScoreSystem } from '../engine/ScoreSystem';
import { GameEngine } from '../engine/GameEngine';
import { VirtualAdapter } from '../ar/ExperienceAdapter';
import { FeedingSystem } from '../engine/FeedingSystem';
import { AnimalAI } from '../engine/AnimalAI';
describe('feeding and scoring',()=>{
 it('awards increasing multipliers, caps at four, and expires combos',()=>{const s=new ScoreSystem();for(let i=0;i<15;i++)s.award(i);expect(s.multiplier).toBe(4);expect(s.bestCombo).toBe(15);s.update(21);expect(s.combo).toBe(0);expect(s.award(22)).toBe(100);});
 it('rejects unknown food, outside positions, flooding, and too many drops',()=>{const f=new FeedingSystem();expect(f.place('bad',{x:0,z:0},0)).not.toBeNull();expect(f.place('grain',{x:2,z:0},0)).not.toBeNull();expect(f.place('grain',{x:0,z:0},0)).toBeNull();expect(f.place('grain',{x:0,z:0},.1)).not.toBeNull();for(let i=1;i<8;i++)expect(f.place('grain',{x:0,z:0},i)).toBeNull();expect(f.place('grain',{x:0,z:0},9)).not.toBeNull();});
 it('assigns correct species and rewards each portion once',()=>{const f=new FeedingSystem(),ai=new AnimalAI();const chicken=ai.animals[0];f.place('grain',{...chicken.position},0);let fed=0;for(let i=0;i<80;i++)f.update(1/30,ai.animals,()=>fed++);expect(fed).toBe(1);expect(f.drops).toHaveLength(0);expect(chicken.state).toBe('happy');});
 it('expires food and releases the animal',()=>{const f=new FeedingSystem(),ai=new AnimalAI();f.place('greens',{x:-1,z:1},0);f.update(.1,ai.animals,()=>{});expect(f.drops[0].eater).toContain('rabbit');const eater=ai.animals.find(a=>a.id===f.drops[0].eater)!;f.update(13,ai.animals,()=>{});expect(f.drops).toHaveLength(0);expect(eater.state).toBe('idle');});
 it('finishes exactly at 60 seconds and resets a new round',()=>{const g=new GameEngine(new VirtualAdapter());expect(g.placeFood({x:0,z:0})).not.toBeNull();g.start();g.update(59.9);expect(g.phase).toBe('playing');g.update(.2);expect(g.phase).toBe('results');expect(g.remaining).toBe(0);expect(g.placeFood({x:0,z:0})).not.toBeNull();g.start();expect(g.remaining).toBe(60);expect(g.score.points).toBe(0);});
 it('feeds all species through real AI movement',()=>{const g=new GameEngine(new VirtualAdapter());g.start();for(const species of ['chicken','chick','rabbit']){g.selectedFood={chicken:'grain',chick:'starter',rabbit:'greens'}[species]!;const animal=g.ai.animals.find(a=>a.species===species)!;expect(g.placeFood({...animal.position})).toBeNull();for(let i=0;i<90;i++)g.update(1/30);}expect(g.score.fed).toBeGreaterThanOrEqual(3);expect(g.score.points).toBeGreaterThanOrEqual(300);});
});
