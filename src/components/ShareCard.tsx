import { useEffect, useState } from 'react';
import { BrandConfig } from '../config/BrandConfig';
export interface ResultData {points:number;fed:number;bestCombo:number}
function circle(ctx:CanvasRenderingContext2D,x:number,y:number,r:number,color:string){ctx.fillStyle=color;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();}
export async function createResultCard(result:ResultData):Promise<Blob>{
 const canvas=document.createElement('canvas');canvas.width=1080;canvas.height=1920;
 const ctx=canvas.getContext('2d');if(!ctx)throw new Error('No se pudo crear la imagen.');
 ctx.fillStyle='#dff3ff';ctx.fillRect(0,0,1080,1920);
 circle(ctx,100,1800,580,'#b7d878');circle(ctx,1020,1840,600,'#91be6c');
 ctx.textAlign='center';ctx.fillStyle=BrandConfig.accent;ctx.font='900 142px "Avenir Next", sans-serif';ctx.fillText(BrandConfig.name,540,240);
 ctx.fillStyle='#274e43';ctx.font='700 32px "Avenir Next", sans-serif';ctx.fillText('AR Farm',540,300);
 ctx.fillStyle='#fffdf2';ctx.beginPath();ctx.roundRect(84,410,912,825,64);ctx.fill();
 ctx.fillStyle='#274e43';ctx.font='800 57px "Avenir Next", sans-serif';ctx.fillText('¡Una granja llena',540,535);ctx.fillText('de felicidad!',540,608);
 ctx.font='900 204px "Avenir Next", sans-serif';ctx.fillText(String(result.points),540,856);
 ctx.font='700 37px "Avenir Next", sans-serif';ctx.fillText('puntos de pura alegría',540,925);
 ctx.font='500 36px "Avenir Next", sans-serif';ctx.fillText(`${result.fed} ${result.fed===1?'comida servida':'comidas servidas'}`,540,1050);ctx.fillText(`Mejor combo: ${result.bestCombo}`,540,1110);
 // Original, lightweight illustrated farm mascots; no remote assets in exported cards.
 circle(ctx,380,1535,114,'#fff5df');circle(ctx,390,1410,77,'#fff5df');circle(ctx,368,1340,23,'#e45e4d');
 circle(ctx,414,1398,10,'#274e43');ctx.fillStyle='#eaa23d';ctx.beginPath();ctx.moveTo(450,1410);ctx.lineTo(495,1430);ctx.lineTo(450,1447);ctx.fill();
 circle(ctx,580,1600,65,'#ffe078');circle(ctx,592,1536,46,'#ffe078');circle(ctx,607,1528,7,'#274e43');
 circle(ctx,760,1535,100,'#e1c9ac');circle(ctx,760,1435,69,'#e1c9ac');
 ctx.fillStyle='#e1c9ac';ctx.beginPath();ctx.ellipse(727,1320,24,104,-.15,0,Math.PI*2);ctx.ellipse(792,1320,24,104,.15,0,Math.PI*2);ctx.fill();
 circle(ctx,738,1430,8,'#274e43');circle(ctx,783,1430,8,'#274e43');circle(ctx,761,1455,10,'#d6938b');
 ctx.fillStyle='#274e43';ctx.font='700 38px "Avenir Next", sans-serif';ctx.fillText('Yo ya cuidé mi granja.',540,1770);ctx.fillText('¿Te animás a superar mi puntaje?',540,1828);
 return new Promise((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(new Error('No se pudo generar el PNG.')),'image/png'));
}
export function ShareCard({result}:{result:ResultData}){
 const [asset,setAsset]=useState<{blob:Blob;url:string;native:boolean}|null>(null),[message,setMessage]=useState(''),[busy,setBusy]=useState(false);
 useEffect(()=>{
  let active=true,url='';setAsset(null);setMessage('');
  void createResultCard(result).then(blob=>{
   if(!active)return;url=URL.createObjectURL(blob);const file=new File([blob],'mi-granja-foody.png',{type:'image/png'});
   let native=false;try{native=!!navigator.canShare?.({files:[file]});}catch{/* Download remains available. */}
   setAsset({blob,url,native});
  }).catch(()=>{if(active)setMessage('No se pudo crear la tarjeta. Volvé a intentarlo al terminar otra partida.');});
  return()=>{active=false;if(url)URL.revokeObjectURL(url);};
 },[result.points,result.fed,result.bestCombo]);
 const share=async()=>{
  if(!asset)return;setBusy(true);setMessage('');
  try{await navigator.share({title:'Mi granja Foody',files:[new File([asset.blob],'mi-granja-foody.png',{type:'image/png'})]});setMessage('Tarjeta compartida.');}
  catch(error){if(!(error instanceof Error&&error.name==='AbortError'))setMessage('No se pudo compartir. Usá “Guardar imagen” y compartila desde Fotos.');}
  finally{setBusy(false);}
 };
 return <div className="share-card">
 {asset?<><img src={asset.url} width="1080" height="1920" alt={`Tarjeta Foody con ${result.points} puntos, ${result.fed} comidas y mejor combo de ${result.bestCombo}.`}/>
 {asset.native&&<button className="primary" disabled={busy} onClick={()=>void share()}>{busy?'Abriendo opciones…':'Compartir resultado'}</button>}
 <a className="download" href={asset.url} download="mi-granja-foody.png">Guardar imagen</a><small>Formato Stories · 9:16</small></>:<p>Preparando tu tarjeta…</p>}
 {message&&<p role="status">{message}</p>}
 </div>;
}
