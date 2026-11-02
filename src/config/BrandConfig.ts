import type { Species } from '../engine/AnimalAI';
export interface FoodProduct { id:string; name:string; animalLabel:string; species:Species; color:string; icon:string }
export const BrandConfig = {
 name: 'Foody', title: 'Tu pequeña granja', accent: '#ec5938',
 foods: [
  {id:'grain',name:'Maíz',animalLabel:'Gallinas',species:'chicken',color:'#f4bd47',icon:'🌽'},
  {id:'starter',name:'Mix mini',animalLabel:'Pollitos',species:'chick',color:'#efce71',icon:'🌾'},
  {id:'greens',name:'Verdecitos',animalLabel:'Conejos',species:'rabbit',color:'#75ab5b',icon:'🥬'},
 ] satisfies FoodProduct[],
};
export const FarmConfig = { halfSize: 1.5, wallHeight: 1.5, warningDistance: 0.6, dangerDistance: 0.3, duration: 60 };

// Nominal adult/chick reference heights, not breed-specific measurements. Rabbit includes ears.
export const AnimalDimensions = {chicken:{height:.50,radius:.36},chick:{height:.14,radius:.12},rabbit:{height:.40,radius:.22}} satisfies Record<Species,{height:number;radius:number}>;
