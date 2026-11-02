import {WorldTrackingAdapter} from './WorldTrackingAdapter';
import {loadXR8} from './XR8Loader';
import {VirtualAdapter} from './ExperienceAdapter';
import type {XR8Runtime,WorldHit} from './XR8Types';
import type {GameEngine} from '../engine/GameEngine';
export type WorldPhase='idle'|'starting'|'scanning'|'placed'|'error';
export interface WorldStatus {phase:WorldPhase;message:string;canPlace:boolean}
export class XR8Session {
 readonly adapter=new WorldTrackingAdapter();
 private runtime:XR8Runtime|null=null;private generation=0;private modules:string[]=[];
 private running=false;private started=false;private poll:ReturnType<typeof setInterval>|null=null;private startup:ReturnType<typeof setTimeout>|null=null;
 private canvas:HTMLCanvasElement|null=null;private observer:ResizeObserver|null=null;private candidate:WorldHit|null=null;
 constructor(private engine:GameEngine,private onStatus:(status:WorldStatus)=>void,private loader=loadXR8){}
 private publish(message?:string){this.onStatus({phase:this.adapter.origin?'placed':'scanning',message:message??this.adapter.getPauseReason()??'Granja colocada. Tocá su suelo para alimentar.',canPlace:!!this.candidate&&this.adapter.tracking&&!this.adapter.origin});}
 async start(canvas:HTMLCanvasElement){
  if(this.running)return;this.running=true;const generation=++this.generation;
  this.onStatus({phase:'starting',message:'Preparando la cámara y el seguimiento…',canPlace:false});
  try{
   if(!window.isSecureContext)throw new Error('Para usar AR necesitás HTTPS confiable.');
   const xr=await this.loader();if(generation!==this.generation)return;
   this.runtime=xr;this.canvas=canvas;this.engine.adapter=this.adapter;this.adapter.resetPlacement();
   xr.XrController.configure({disableWorldTracking:false,scale:'responsive',enableLighting:false,enableWorldPoints:false});
   const current=()=>generation===this.generation&&this.running;
   const module={
    name:'foody-world-tracking',
    onStart:()=>{if(!current()){void xr.stop();return;}this.started=true;if(this.startup)clearTimeout(this.startup);this.startup=null;this.resize(true);this.publish();},
    onUpdate:({processCpuResult}:{processCpuResult?:{reality?:import('./XR8Types').WorldFrame}})=>{
     if(!current())return;
     this.adapter.update(document.hidden?undefined:processCpuResult?.reality,performance.now());
     this.updateCandidate();
    },
    onCameraStatusChange:({status}:{status:string})=>{if(current()&&status==='failed')void this.fail('No se pudo abrir la cámara. Revisá el permiso o seguí en modo virtual.');},
    onException:()=>{if(current())void this.fail('Se interrumpió el motor AR. Podés volver a iniciar o seguir en modo virtual.');},
    onDeviceOrientationChange:()=>{if(current()){this.adapter.resetPlacement();this.candidate=null;this.publish('Cambió la orientación. Volvé a colocar la granja.');}},
   };
   const modules=[xr.GlTextureRenderer.pipelineModule(),xr.XrController.pipelineModule(),module];this.modules=modules.map(m=>m.name);
   xr.addCameraPipelineModules(modules);
   this.observer=new ResizeObserver(()=>this.resize(false));this.observer.observe(canvas);
   this.resize(false);
   this.poll=setInterval(()=>{if(current()){this.adapter.expire(performance.now());if(!this.adapter.tracking)this.candidate=null;this.publish();}},150);
   this.startup=setTimeout(()=>{if(current())void this.fail('La cámara tardó demasiado en abrir. Volvé a intentar.');},25000);
   await xr.run({canvas,allowedDevices:xr.XrConfig.device().MOBILE,cameraConfig:{direction:xr.XrConfig.camera().BACK},glContextConfig:{alpha:false}});
  }catch(error){if(generation===this.generation)await this.fail(error instanceof Error?error.message:'No se pudo iniciar AR.');}
 }
 private resize(force:boolean){
  if(!this.canvas||!this.runtime)return;
  const rect=this.canvas.getBoundingClientRect(),dpr=Math.min(devicePixelRatio||1,1.5),w=Math.max(1,Math.round(rect.width*dpr)),h=Math.max(1,Math.round(rect.height*dpr));
  if(!force&&w===this.canvas.width&&h===this.canvas.height)return;
  this.canvas.width=w;this.canvas.height=h;
  if(!this.started)return;
  const frame=this.adapter.frame;
  this.runtime.XrController.updateCameraProjectionMatrix({cam:{pixelRectWidth:w,pixelRectHeight:h,nearClipPlane:.01,farClipPlane:100},...(frame?{origin:frame.position,facing:frame.rotation}:{})});
  if(this.adapter.origin){this.adapter.resetPlacement();this.candidate=null;}
 }
 private updateCandidate(){
  this.candidate=null;if(!this.adapter.tracking||this.adapter.origin||!this.runtime)return;
  // A user-selected estimated point is not advertised as semantic floor detection.
  try{this.candidate=this.runtime.XrController.hitTest(.5,.55,['FEATURE_POINT']).find(hit=>
   ['FEATURE_POINT','DETECTED_SURFACE','ESTIMATED_SURFACE'].includes(hit.type)&&Number.isFinite(hit.distance)&&hit.distance>0&&hit.distance<20&&[hit.position.x,hit.position.y,hit.position.z].every(Number.isFinite))??null;}catch{/* Retry with a future tracked camera frame. */}
 }
 reposition(){this.adapter.resetPlacement();this.adapter.resetTransform();this.candidate=null;this.publish();}
 place(){if(!this.candidate||!this.adapter.place(this.candidate.position))return false;this.candidate=null;this.publish();return true;}
 private async fail(message:string){await this.stop();this.onStatus({phase:'error',message,canPlace:false});}
 async stop(){
  this.generation++;this.running=false;this.started=false;
  if(this.poll)clearInterval(this.poll);if(this.startup)clearTimeout(this.startup);this.poll=null;this.startup=null;
  this.observer?.disconnect();this.observer=null;
  const xr=this.runtime;this.runtime=null;
  try{await xr?.stop();}catch{/* Continue restoring the virtual mode even if the vendor stop fails. */}
  try{xr?.removeCameraPipelineModules(this.modules);}catch{/* Cleanup remains idempotent. */}
  this.modules=[];this.canvas=null;this.candidate=null;this.adapter.dispose();
  if(this.engine.adapter===this.adapter)this.engine.adapter=new VirtualAdapter();
  this.onStatus({phase:'idle',message:'',canPlace:false});
 }
}
