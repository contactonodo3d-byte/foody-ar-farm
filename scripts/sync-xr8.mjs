import {cpSync,existsSync,mkdirSync,readFileSync,writeFileSync,readdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root=fileURLToPath(new URL('../',import.meta.url));
const consent=JSON.parse(readFileSync(path.join(root,'xr8-installation.json'),'utf8'));
const source=path.join(root,'node_modules/@8thwall/engine-binary');
if(!consent.accepted)throw new Error('Owner license acceptance is required before activating the runtime.');
if(!existsSync(source))throw new Error('Run npm install to restore the pinned official SDK.');
const pkg=JSON.parse(readFileSync(path.join(source,'package.json'),'utf8'));
if(pkg.version!==consent.acceptedVersion)throw new Error('The installed SDK version differs from the version approved for local evaluation.');
const target=path.join(root,'public/vendor/xr8');mkdirSync(target,{recursive:true});
cpSync(path.join(source,'dist'),target,{recursive:true});
cpSync(path.join(source,'LICENSE'),path.join(target,'PACKAGE-LICENSE.txt'));
const hashes={};
function inventory(directory,prefix=''){
 for(const entry of readdirSync(directory,{withFileTypes:true})){
  const relative=path.posix.join(prefix,entry.name),file=path.join(directory,entry.name);
  if(entry.isDirectory())inventory(file,relative);
  else hashes[relative]=createHash('sha256').update(readFileSync(file)).digest('hex');
 }
}
inventory(path.join(source,'dist'));
writeFileSync(path.join(target,'installation.json'),JSON.stringify({package:pkg.name,version:pkg.version,acceptedOn:consent.acceptedOn,license:consent.license,sha256:hashes},null,2)+'\n');
writeFileSync(path.join(target,'manifest.json'),JSON.stringify({enabled:true,licenseAccepted:true,script:'/vendor/xr8/xr.js',version:pkg.version},null,2)+'\n');
console.log(`Official XR8 ${pkg.version}: ${Object.keys(hashes).length} unmodified artifacts synchronized locally.`);
