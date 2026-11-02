import {useEffect,useState} from 'react';
import {inspectARCapabilities,capabilityReport,type ARCapabilities} from '../ar/Capabilities';
export function ARDiagnostics(){
 const [capabilities,setCapabilities]=useState<ARCapabilities|null>(null),[busy,setBusy]=useState(false),[message,setMessage]=useState('');
 useEffect(()=>{let active=true;void inspectARCapabilities().then(result=>{if(active)setCapabilities(result);});return()=>{active=false;};},[]);
 const inspect=async()=>{setBusy(true);setMessage('');try{setCapabilities(await inspectARCapabilities());}finally{setBusy(false);}};
 const copy=async()=>{if(!capabilities)return;try{await navigator.clipboard.writeText(capabilityReport(capabilities));setMessage('Diagnóstico copiado. No se envió ningún dato.');}catch{setMessage('No se pudo copiar. Podés leer los resultados abajo.');}};
 return <details className="ar-diagnostics"><summary>¿Puede este teléfono anclar la granja al piso?</summary><h2>Capacidades de este navegador</h2>
 {capabilities?<dl><div><dt>Conexión segura</dt><dd>{capabilities.secureContext?'Sí':'No: usá HTTPS confiable'}</dd></div><div><dt>Cámara</dt><dd>{capabilities.cameraAvailable?'API disponible; permiso pendiente':'API no disponible'}</dd></div><div><dt>AR espacial WebXR</dt><dd>{capabilities.spatialStatus==='available'?'Disponible para intentar una sesión':capabilities.spatialStatus==='error'?'No se pudo comprobar':'No disponible en este navegador'}</dd></div></dl>:<p>Comprobando capacidades…</p>}
 <p>La cámara sola muestra video. Anclar al entorno requiere seguimiento espacial o una referencia visual. Este diagnóstico no abre la cámara ni prueba sensores.</p>
 <button disabled={busy} onClick={()=>void inspect()}>{busy?'Comprobando…':'Volver a comprobar'}</button><button disabled={!capabilities} onClick={()=>void copy()}>Copiar diagnóstico</button>{message&&<p role="status">{message}</p>}
 </details>;
}
