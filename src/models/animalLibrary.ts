import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { buildAnimal, type AnimalSpecies } from './farmAnimals';
import type { Group } from 'three';

const templates: Record<AnimalSpecies, Group> = {
  chicken: buildAnimal('chicken'),
  chick: buildAnimal('chick'),
  rabbit: buildAnimal('rabbit'),
};
let version = 0;
const listeners = new Set<() => void>();
let started = false;

export function getTemplate(species: AnimalSpecies) { return templates[species]; }
export function getTemplateVersion() { return version; }
export function subscribeTemplates(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Prefer the bundled GLB when it has the rig names. The in-code rig stays if the file is missing. */
export function loadAnimalModels() {
  if (started) return;
  started = true;
  const loader = new GLTFLoader();
  (['chicken', 'chick', 'rabbit'] as AnimalSpecies[]).forEach(species => {
    loader.load(import.meta.env.BASE_URL + `models/${species}.glb`, gltf => {
      if (!gltf.scene.getObjectByName('Body') || !gltf.scene.getObjectByName('Torso')) return;
      templates[species] = gltf.scene;
      version += 1;
      listeners.forEach(listener => listener());
    }, undefined, () => { /* Procedural rig already on screen. */ });
  });
}
