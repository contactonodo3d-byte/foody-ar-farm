import type {XR8Runtime} from './XR8Types';
export interface XR8Installation {installed:boolean;script:string;reason:string}
const scriptPath=import.meta.env.BASE_URL+'vendor/xr8/xr.js';
export async function inspectXR8Installation():Promise<XR8Installation>{
 try{
  const response=await fetch(import.meta.env.BASE_URL+'vendor/xr8/manifest.json',{cache:'no-store'});
  if(response.ok&&response.headers.get('content-type')?.includes('application/json')){
   const data=await response.json() as {enabled?:boolean;licenseAccepted?:boolean;script?:string};
   if(data.enabled===true&&data.licenseAccepted===true&&(data.script==='/vendor/xr8/xr.js'||data.script===scriptPath)){
    const script=await fetch(scriptPath,{method:'HEAD',cache:'no-store'});
    if(script.ok&&/javascript/.test(script.headers.get('content-type')??''))return {installed:true,script:scriptPath,reason:''};
   }
  }
 }catch{/* The virtual experience remains available without an SDK or network. */}
 return {installed:false,script:scriptPath,reason:'El motor AR sin marcador está pendiente de activar en esta prueba local.'};
}
let loading:Promise<XR8Runtime>|null=null;
export async function loadXR8():Promise<XR8Runtime>{
 const installation=await inspectXR8Installation();
 if(!installation.installed)throw new Error(installation.reason);
 if(loading)return loading;
 loading=new Promise<XR8Runtime>((resolve,reject)=>{
  let script:HTMLScriptElement|null=null,settled=false,initializing=false;
  const cleanup=()=>{clearTimeout(timeout);window.removeEventListener('xrloaded',done);if(script){script.onload=null;script.onerror=null;}};
  const fail=()=>{if(settled)return;settled=true;cleanup();script?.remove();reject(new Error('No se pudo cargar el motor AR. Podés seguir en modo virtual.'));};
  const done=()=>{
   const runtime=window.XR8;if(!runtime||settled||initializing)return;initializing=true;
   void (async()=>{
    try{
     if(runtime.loadChunk)await runtime.loadChunk('slam');
     if(runtime.initialize&&!runtime.isInitialized?.())await runtime.initialize();
     if(settled)return;settled=true;cleanup();resolve(runtime);
    }catch{fail();}
   })();
  };
  const timeout=setTimeout(fail,45000);
  window.addEventListener('xrloaded',done);
  if(window.XR8)done();
  else{script=document.createElement('script');script.src=installation.script;script.async=true;script.setAttribute('data-preload-chunks','slam');script.onload=done;script.onerror=fail;document.head.append(script);}
 });
 try{return await loading;}catch(error){loading=null;throw error;}
}
