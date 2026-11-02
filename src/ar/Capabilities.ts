export interface ARCapabilities {
 secureContext:boolean;
 cameraAvailable:boolean;
 spatialStatus:'available'|'unavailable'|'error';
 checkedAt:string;
}
export async function inspectARCapabilities():Promise<ARCapabilities>{
 let spatialStatus:ARCapabilities['spatialStatus']='unavailable';
 if(window.isSecureContext&&navigator.xr?.isSessionSupported){
  try{spatialStatus=await navigator.xr.isSessionSupported('immersive-ar')?'available':'unavailable';}
  catch{spatialStatus='error';}
 }
 return {secureContext:window.isSecureContext,cameraAvailable:!!navigator.mediaDevices?.getUserMedia,spatialStatus,checkedAt:new Date().toISOString()};
}
export function capabilityReport(c:ARCapabilities){
 return ['Foody AR Farm — diagnóstico local',`Contexto seguro: ${c.secureContext?'sí':'no'}`,`API de cámara: ${c.cameraAvailable?'disponible':'no disponible'} (permiso y captura no comprobados)`,`Sesión immersive-ar: ${c.spatialStatus==='available'?'anunciada como disponible, hit-test y controles pendientes de sesión':c.spatialStatus==='error'?'no se pudo comprobar':'no disponible'}`,'La superposición de cámara no detecta superficies ni rastrea el teléfono.',`Fecha: ${c.checkedAt}`].join('\n');
}
