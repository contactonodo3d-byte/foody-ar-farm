import { ConeGeometry, CylinderGeometry, Group, Mesh, MeshStandardMaterial, SphereGeometry, type Object3D } from 'three';

export type AnimalSpecies = 'chicken' | 'chick' | 'rabbit';
export interface PoseInput { species: AnimalSpecies; state: string; phase: number; moving: boolean; heading: number }

const geo = {
  body: new SphereGeometry(1, 10, 8),
  head: new SphereGeometry(1, 10, 8),
  limb: new SphereGeometry(1, 8, 6),
  beak: new ConeGeometry(1, 1, 5),
  leg: new CylinderGeometry(1, 1, 1, 5),
  eye: new SphereGeometry(1, 6, 5),
};

const coat = new Map<string, MeshStandardMaterial>();
function mat(color: string) {
  let material = coat.get(color);
  if (!material) {
    material = new MeshStandardMaterial({ color, roughness: 0.68, flatShading: true });
    coat.set(color, material);
  }
  return material;
}

function part(name: string, geometry: SphereGeometry | ConeGeometry | CylinderGeometry, color: string, position: [number, number, number], scale: [number, number, number], rotation?: [number, number, number]) {
  const mesh = new Mesh(geometry, mat(color));
  mesh.name = name;
  mesh.position.set(...position);
  mesh.scale.set(...scale);
  if (rotation) mesh.rotation.set(...rotation);
  mesh.castShadow = true;
  mesh.raycast = () => {};
  return mesh;
}

function pivot(name: string, position: [number, number, number]) {
  const group = new Group();
  group.name = name;
  group.position.set(...position);
  return group;
}

function eye(x: number, color = '#24362f') {
  return part('Eye', geo.eye, color, [x, 0.02, 0.08], [0.018, 0.022, 0.012]);
}

export function buildAnimal(species: AnimalSpecies) {
  if (species === 'rabbit') return buildRabbit();
  if (species === 'chick') return buildChick();
  return buildChicken();
}

function buildChicken() {
  const root = new Group();
  root.name = 'chicken';
  const body = pivot('Body', [0, 0.22, 0]);
  body.add(part('Torso', geo.body, '#fff4df', [0, 0, 0], [0.16, 0.14, 0.2]));
  body.add(part('Breast', geo.limb, '#fffaf0', [0, -0.01, 0.1], [0.1, 0.09, 0.08]));
  const tail = pivot('Tail', [0, 0.06, -0.16]);
  tail.rotation.x = -0.7;
  tail.add(part('TailFeather', geo.beak, '#f0d7b0', [0, 0.06, 0], [0.05, 0.16, 0.035]));
  tail.add(part('TailFeather', geo.beak, '#e7c89a', [-0.05, 0.05, 0.01], [0.035, 0.13, 0.03], [0, 0, 0.35]));
  tail.add(part('TailFeather', geo.beak, '#e7c89a', [0.05, 0.05, 0.01], [0.035, 0.13, 0.03], [0, 0, -0.35]));
  body.add(tail);
  const wingL = pivot('WingL', [-0.12, 0.02, 0]);
  wingL.add(part('WingMesh', geo.body, '#f0e0c4', [-0.06, -0.01, 0], [0.035, 0.07, 0.12]));
  const wingR = pivot('WingR', [0.12, 0.02, 0]);
  wingR.add(part('WingMesh', geo.body, '#f0e0c4', [0.06, -0.01, 0], [0.035, 0.07, 0.12]));
  body.add(wingL, wingR);
  const legL = pivot('LegL', [-0.05, -0.1, 0.02]);
  legL.add(part('LegMesh', geo.leg, '#e8a23d', [0, -0.055, 0], [0.012, 0.1, 0.012]));
  legL.add(part('Foot', geo.limb, '#e8a23d', [0, -0.1, 0.03], [0.02, 0.012, 0.045]));
  const legR = pivot('LegR', [0.05, -0.1, 0.02]);
  legR.add(part('LegMesh', geo.leg, '#e8a23d', [0, -0.055, 0], [0.012, 0.1, 0.012]));
  legR.add(part('Foot', geo.limb, '#e8a23d', [0, -0.1, 0.03], [0.02, 0.012, 0.045]));
  body.add(legL, legR);
  const head = pivot('Head', [0, 0.12, 0.14]);
  head.add(part('Skull', geo.head, '#fff4df', [0, 0.02, 0.02], [0.075, 0.078, 0.072]));
  head.add(part('Beak', geo.beak, '#e8a23d', [0, -0.01, 0.09], [0.028, 0.07, 0.028], [Math.PI / 2, 0, 0]));
  head.add(part('Comb', geo.limb, '#e4544a', [0, 0.09, 0], [0.02, 0.045, 0.04]));
  head.add(part('Comb', geo.limb, '#e4544a', [0, 0.07, 0.035], [0.016, 0.035, 0.028]));
  head.add(part('Wattle', geo.limb, '#e4544a', [0, -0.05, 0.05], [0.018, 0.028, 0.016]));
  head.add(eye(-0.04), eye(0.04));
  body.add(head);
  root.add(body);
  return root;
}

function buildChick() {
  const root = new Group();
  root.name = 'chick';
  const body = pivot('Body', [0, 0.11, 0]);
  body.add(part('Torso', geo.body, '#ffe56a', [0, 0, 0], [0.09, 0.08, 0.1]));
  const wingL = pivot('WingL', [-0.07, 0.01, 0]);
  wingL.add(part('WingMesh', geo.body, '#f6d35a', [-0.03, 0, 0], [0.02, 0.035, 0.05]));
  const wingR = pivot('WingR', [0.07, 0.01, 0]);
  wingR.add(part('WingMesh', geo.body, '#f6d35a', [0.03, 0, 0], [0.02, 0.035, 0.05]));
  body.add(wingL, wingR);
  const legL = pivot('LegL', [-0.025, -0.06, 0.01]);
  legL.add(part('LegMesh', geo.leg, '#e8a23d', [0, -0.025, 0], [0.008, 0.04, 0.008]));
  const legR = pivot('LegR', [0.025, -0.06, 0.01]);
  legR.add(part('LegMesh', geo.leg, '#e8a23d', [0, -0.025, 0], [0.008, 0.04, 0.008]));
  body.add(legL, legR);
  const head = pivot('Head', [0, 0.07, 0.06]);
  head.add(part('Skull', geo.head, '#ffe56a', [0, 0.01, 0.01], [0.055, 0.055, 0.052]));
  head.add(part('Beak', geo.beak, '#f0a43a', [0, -0.005, 0.055], [0.016, 0.04, 0.016], [Math.PI / 2, 0, 0]));
  head.add(eye(-0.028), eye(0.028));
  body.add(head);
  root.add(body);
  return root;
}

function buildRabbit() {
  const root = new Group();
  root.name = 'rabbit';
  const body = pivot('Body', [0, 0.16, 0]);
  body.add(part('Torso', geo.body, '#f3e0cf', [0, 0.02, 0], [0.15, 0.12, 0.22]));
  body.add(part('Haunch', geo.limb, '#e7d0b8', [0, 0.02, -0.1], [0.11, 0.1, 0.1]));
  body.add(part('Tail', geo.limb, '#fffaf4', [0, 0.06, -0.2], [0.045, 0.045, 0.04]));
  const legL = pivot('LegL', [-0.06, -0.05, 0.06]);
  legL.add(part('LegMesh', geo.limb, '#e7d0b8', [0, -0.02, 0.02], [0.04, 0.03, 0.07]));
  const legR = pivot('LegR', [0.06, -0.05, 0.06]);
  legR.add(part('LegMesh', geo.limb, '#e7d0b8', [0, -0.02, 0.02], [0.04, 0.03, 0.07]));
  body.add(legL, legR);
  const head = pivot('Head', [0, 0.08, 0.16]);
  head.add(part('Skull', geo.head, '#f6e6d6', [0, 0.02, 0.02], [0.08, 0.075, 0.08]));
  head.add(part('Cheek', geo.limb, '#fff6ee', [0, -0.01, 0.06], [0.05, 0.04, 0.04]));
  head.add(part('Nose', geo.eye, '#e7a0a0', [0, 0, 0.095], [0.016, 0.012, 0.012]));
  const earL = pivot('EarL', [-0.035, 0.08, 0]);
  earL.rotation.z = 0.18;
  earL.add(part('EarMesh', geo.limb, '#f3e0cf', [0, 0.08, 0], [0.02, 0.11, 0.015]));
  earL.add(part('EarInner', geo.limb, '#f0b7b7', [0, 0.08, 0.008], [0.01, 0.08, 0.008]));
  const earR = pivot('EarR', [0.035, 0.08, 0]);
  earR.rotation.z = -0.18;
  earR.add(part('EarMesh', geo.limb, '#f3e0cf', [0, 0.08, 0], [0.02, 0.11, 0.015]));
  earR.add(part('EarInner', geo.limb, '#f0b7b7', [0, 0.08, 0.008], [0.01, 0.08, 0.008]));
  head.add(earL, earR, eye(-0.035), eye(0.035));
  body.add(head);
  root.add(body);
  return root;
}

interface Rest { px: number; py: number; pz: number; rx: number; ry: number; rz: number; sx: number; sy: number; sz: number }
function restOf(object: Object3D): Rest {
  if (!object.userData.rest) {
    object.userData.rest = {
      px: object.position.x, py: object.position.y, pz: object.position.z,
      rx: object.rotation.x, ry: object.rotation.y, rz: object.rotation.z,
      sx: object.scale.x, sy: object.scale.y, sz: object.scale.z,
    };
  }
  return object.userData.rest as Rest;
}
function reset(object: Object3D | null | undefined) {
  if (!object) return null;
  const rest = restOf(object);
  object.position.set(rest.px, rest.py, rest.pz);
  object.rotation.set(rest.rx, rest.ry, rest.rz);
  object.scale.set(rest.sx, rest.sy, rest.sz);
  return rest;
}

/** State-machine pose: walk cycle, peck/eat anticipation, happy squash. Reduced motion keeps a small step. */
export function poseAnimal(root: Object3D, animal: PoseInput, reduced: boolean) {
  const body = root.getObjectByName('Body');
  const torso = root.getObjectByName('Torso');
  const head = root.getObjectByName('Head');
  const wingL = root.getObjectByName('WingL');
  const wingR = root.getObjectByName('WingR');
  const legL = root.getObjectByName('LegL');
  const legR = root.getObjectByName('LegR');
  const earL = root.getObjectByName('EarL');
  const earR = root.getObjectByName('EarR');
  const bodyRest = reset(body);
  reset(torso); reset(head); reset(wingL); reset(wingR); reset(legL); reset(legR); reset(earL); reset(earR);
  if (!body || !bodyRest) return;
  const rabbit = animal.species === 'rabbit';
  const rate = rabbit ? 10 : animal.species === 'chick' ? 16 : 13;
  const step = Math.sin(animal.phase * rate);
  const bob = reduced ? 0 : Math.abs(step);
  if (animal.moving) {
    body.position.y = bodyRest.py + bob * (rabbit ? 0.07 : 0.028);
    body.rotation.z = reduced ? 0 : step * 0.05;
    if (legL && legR) { legL.rotation.x = step * (rabbit ? 0.35 : 0.7); legR.rotation.x = -step * (rabbit ? 0.35 : 0.7); }
    if (wingL && wingR && !reduced) { wingL.rotation.z = Math.max(0, step) * 0.55; wingR.rotation.z = -Math.max(0, -step) * 0.55; }
    if (earL && earR) { earL.rotation.z = 0.18 + step * 0.12; earR.rotation.z = -0.18 - step * 0.12; }
  } else if (!reduced && torso) {
    const breathe = 1 + Math.sin(animal.phase * 2) * 0.025;
    torso.scale.y *= breathe;
  }
  if ((animal.state === 'peck' || animal.state === 'eat') && head) {
    const wave = Math.sin(animal.phase * 9);
    const down = Math.max(0, wave);
    const anticipate = Math.max(0, -wave);
    head.rotation.x += down * 0.95 - anticipate * (reduced ? 0 : 0.28);
    if (torso && !reduced) torso.scale.y *= 1 - down * 0.1;
    if (body && !reduced) body.position.y = bodyRest.py - down * 0.02;
  }
  if (animal.state === 'happy') {
    const hop = Math.abs(Math.sin(animal.phase * 8));
    const ease = hop * hop * (3 - 2 * hop);
    body.position.y = bodyRest.py + ease * (reduced ? 0.03 : rabbit ? 0.12 : 0.09);
    if (torso && !reduced) {
      torso.scale.x *= 1 + ease * 0.1;
      torso.scale.y *= 1 - ease * 0.14;
      torso.scale.z *= 1 + ease * 0.08;
    }
  }
}
