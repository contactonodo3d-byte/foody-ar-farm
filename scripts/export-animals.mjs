import { mkdirSync, writeFileSync } from 'node:fs';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import { buildAnimal } from '../src/models/farmAnimals.ts';

if (typeof FileReader === 'undefined') {
 globalThis.FileReader = class {
  readAsArrayBuffer(blob) { blob.arrayBuffer().then(buffer => { this.result = buffer; this.onloadend?.(); }); }
  readAsDataURL(blob) { blob.arrayBuffer().then(buffer => { this.result = `data:application/octet-stream;base64,${Buffer.from(buffer).toString('base64')}`; this.onloadend?.(); }); }
 };
}

const exporter = new GLTFExporter();
mkdirSync('public/models', { recursive: true });
for (const species of ['chicken', 'chick', 'rabbit']) {
 const glb = await new Promise((resolve, reject) => {
  exporter.parse(buildAnimal(species), resolve, reject, { binary: true });
 });
 const file = `public/models/${species}.glb`;
 writeFileSync(file, Buffer.from(glb));
 console.log(`${file} ${Buffer.from(glb).length} bytes`);
}
