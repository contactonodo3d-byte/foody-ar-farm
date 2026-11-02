import type { ExperienceAdapter } from './ExperienceAdapter';
import type { Position } from '../engine/BoundarySystem';
export class CameraOverlayAdapter implements ExperienceAdapter {
 readonly mode='camera';readonly reliablePhysicalTracking=false;
 private stream:MediaStream|null=null;private generation=0;
 constructor(private getVirtualPosition:()=>Position=()=>({x:0,z:0})){}
 getPosition(){return this.getVirtualPosition();}
 async start(video:HTMLVideoElement){
  if(!window.isSecureContext)throw new Error('Para abrir la cámara usá HTTPS con un certificado confiable. La demo virtual sigue disponible.');
  if(!navigator.mediaDevices?.getUserMedia)throw new Error('Este navegador no permite usar la cámara. Probá Safari o Chrome actualizado.');
  const generation=++this.generation;
  let stream:MediaStream;
  try{stream=await navigator.mediaDevices.getUserMedia({audio:false,video:{facingMode:{ideal:'environment'},width:{ideal:1280},height:{ideal:720}}});}
  catch(error){
   if(error instanceof DOMException&&error.name==='NotAllowedError')throw new Error('La cámara no tiene permiso. Habilitala en los ajustes del sitio o seguí en modo virtual.');
   if(error instanceof DOMException&&error.name==='NotFoundError')throw new Error('No se encontró una cámara. Podés seguir en modo virtual.');
   throw new Error('No se pudo abrir la cámara. Cerrá otras apps que la usen y volvé a intentar.');
  }
  if(generation!==this.generation){stream.getTracks().forEach(track=>track.stop());return false;}
  this.stream=stream;video.srcObject=stream;
  try{await video.play();}catch{this.dispose();video.srcObject=null;throw new Error('No se pudo reproducir la cámara. Volvé a tocar “Activar cámara”.');}
  if(generation!==this.generation){video.srcObject=null;return false;}
  return true;
 }
 dispose(){this.generation++;this.stream?.getTracks().forEach(track=>track.stop());this.stream=null;}
}
