import { AnimalDimensions } from '../config/BrandConfig';
import { modelBounds } from '../engine/ModelBounds';
import { getTemplate, getTemplateVersion, loadAnimalModels, subscribeTemplates } from '../models/animalLibrary';
import { poseAnimal, type AnimalSpecies } from '../models/farmAnimals';
import { useLayoutEffect, useMemo, useRef, useSyncExternalStore } from 'react';
import { useFrame } from '@react-three/fiber';
import { useEffect } from 'react';
import type { Group } from 'three';
import type { Animal } from '../engine/AnimalAI';
import type { GameEngine } from '../engine/GameEngine';

function AnimalModel({ animal, paused, reduced, version }: { animal: Animal; paused: boolean; reduced: boolean; version: number }) {
 const root = useRef<Group>(null);
 const rig = useMemo(() => getTemplate(animal.species as AnimalSpecies).clone(true), [animal.species, version]);
 const floorOffset = useRef(0);
 const heading = useRef(animal.heading);
 useLayoutEffect(() => {
  if (!root.current) return;
  const bounds = modelBounds(rig);
  const height = Math.max(0.001, bounds.max.y - bounds.min.y);
  const scale = AnimalDimensions[animal.species].height / height;
  root.current.scale.setScalar(scale);
  floorOffset.current = -bounds.min.y * scale;
 }, [animal.species, rig]);
 useFrame((_, dt) => {
  if (!root.current) return;
  const turn = Math.atan2(Math.sin(animal.heading - heading.current), Math.cos(animal.heading - heading.current));
  heading.current += turn * Math.min(1, (paused ? 1 : dt * 10));
  root.current.position.set(animal.position.x, floorOffset.current, animal.position.z);
  root.current.rotation.y = heading.current;
  if (!paused) poseAnimal(rig, animal, reduced);
 });
 return <group ref={root} name={animal.id}><primitive object={rig}/></group>;
}

export function Animals({ engine, paused, reduced }: { engine: GameEngine; paused: boolean; reduced: boolean }) {
 const version = useSyncExternalStore(subscribeTemplates, getTemplateVersion, getTemplateVersion);
 useEffect(() => { loadAnimalModels(); }, []);
 return <group name="farm-animals">{engine.ai.animals.map(animal => <AnimalModel key={animal.id} animal={animal} paused={paused} reduced={reduced} version={version}/>)}</group>;
}
