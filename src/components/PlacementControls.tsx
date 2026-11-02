import {useEffect,useRef} from 'react';
import type {WorldTrackingAdapter} from '../ar/WorldTrackingAdapter';
export function PlacementControls({adapter,editing,onEdit,onReposition,onChange}:{onChange:()=>void;adapter:WorldTrackingAdapter;editing:boolean;onEdit:()=>void;onReposition:()=>void}){
 const dialog=useRef<HTMLDialogElement>(null),opener=useRef<HTMLButtonElement>(null);
 useEffect(()=>{if(!editing)dialog.current?.close();},[editing]);
 const close=()=>{dialog.current?.close();opener.current?.focus();};
 const nudge=(key:keyof typeof adapter.placement,amount:number)=>{adapter.setPlacement({[key]:adapter.placement[key]+amount});onChange();};
 return <div className="ar-tools"><button className="adjust-toggle" aria-pressed={editing} onClick={onEdit}>{editing?'Listo':'Ajustar'}</button>
 {editing&&<><button ref={opener} aria-label="Más opciones de colocación" onClick={()=>dialog.current?.showModal()}>•••</button><dialog ref={dialog} className="placement-options" aria-labelledby="placement-title"><h2 id="placement-title">Colocar la granja</h2><p>Alternativas a los gestos. Escala física aproximada.</p><div className="placement-nudges">
 {([['x','Izquierda',-.1],['x','Derecha',.1],['z','Fondo',-.1],['z','Frente',.1],['scale','Más pequeña',-.1],['scale','Más grande',.1],['yaw','Girar izquierda',-15],['yaw','Girar derecha',15],['y','Bajar',-.05],['y','Subir',.05]] as const).map(([key,label,amount])=><button key={label} onClick={()=>nudge(key,amount)}>{label}</button>)}
 </div><button onClick={()=>{adapter.resetTransform();onChange();close();}}>Restablecer</button><button onClick={()=>{close();onReposition();}}>Volver a colocar</button><button className="primary" onClick={close}>Cerrar opciones</button></dialog></>}
 </div>;
}
