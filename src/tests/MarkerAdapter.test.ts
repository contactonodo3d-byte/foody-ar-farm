import {describe,it,expect} from 'vitest';
import {MarkerAdapter} from '../ar/MarkerAdapter';
import {GameEngine} from '../engine/GameEngine';
describe('marker visibility gate',()=>{
 it('requires consecutive detections, expires stale data, and never claims physical tracking',()=>{const a=new MarkerAdapter();a.update(true,0);a.update(true,80);expect(a.visible).toBe(false);a.update(true,160);expect(a.visible).toBe(true);expect(a.reliablePhysicalTracking).toBe(false);a.expire(500);expect(a.visible).toBe(false);a.update(true,510);expect(a.visible).toBe(false);});
 it('pauses the game when marker is lost, without creating metric boundary positions',()=>{const a=new MarkerAdapter(),g=new GameEngine(a);g.start();g.update(1);expect(g.remaining).toBe(60);for(let i=0;i<3;i++)a.update(true,i*80);g.update(1);expect(g.remaining).toBe(59);a.update(false,300);g.update(1);expect(g.remaining).toBe(59);expect(a.getPosition()).toEqual({x:0,z:0});expect(g.placeFood({x:0,z:0})).not.toBeNull();});
});
