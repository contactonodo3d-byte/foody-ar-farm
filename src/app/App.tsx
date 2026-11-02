import {PlacementControls} from '../components/PlacementControls';
import { useWorldTracking } from '../hooks/useWorldTracking';
import { useMarkerTracking } from '../hooks/useMarkerTracking';
import { ARDiagnostics } from '../components/ARDiagnostics';
import type { SpatialControls, SpatialStatus } from '../ar/SpatialSession';
import { useCamera } from '../hooks/useCamera';
import { ShareCard } from '../components/ShareCard';
import { useSound } from '../hooks/useSound';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FarmScene } from '../components/FarmScene';
import { GameEngine } from '../engine/GameEngine';
import { VirtualAdapter } from '../ar/ExperienceAdapter';
import type { Position } from '../engine/BoundarySystem';
import { BrandConfig } from '../config/BrandConfig';
import { useGame } from '../hooks/useGame';
const labels={SAFE:'Todo bien por acá',WARNING:'Te acercás al borde',DANGER:'¡Volvé al área!',OUTSIDE:'Fuera del área virtual'};
export function App(){
 const engine=useMemo(()=>new GameEngine(new VirtualAdapter()),[]);
 const [position,setPosition]=useState<Position>({x:0,z:0});
 const [debug,setDebug]=useState(false),[paused,setPaused]=useState(false),[food,setFood]=useState('grain'),[message,setMessage]=useState('');
 const [sceneReady,setSceneReady]=useState(false),[editing,setEditing]=useState(false);
 const spatialControls=useRef<SpatialControls|null>(null);
 const [spatial,setSpatial]=useState(false),[spatialSupported,setSpatialSupported]=useState(false),[spatialBusy,setSpatialBusy]=useState(false),[spatialMessage,setSpatialMessage]=useState('');
 const onSpatialStatus=useCallback((status:SpatialStatus)=>{setSpatial(status.active);setSpatialMessage(status.message);if(status.ready!==undefined)setSceneReady(status.ready);},[]);
 useEffect(()=>{let active=true;void navigator.xr?.isSessionSupported('immersive-ar').then(supported=>{if(active)setSpatialSupported(supported);}).catch(()=>{});return()=>{active=false;};},[]);
 const camera=useCamera(engine);
 const world=useWorldTracking(engine);
 const [placement,setPlacement]=useState({scale:1,yaw:0});
 const onPlacementChange=useCallback(()=>setPlacement({scale:world.adapter.placement.scale,yaw:world.adapter.placement.yaw}),[world.adapter]);
 const [markerRequested,setMarkerRequested]=useState(false);
 const marker=markerRequested&&camera.active;
 const markerTracking=useMarkerTracking(camera.video,marker,engine);
 const beginMarker=async()=>{if(camera.active||await camera.start())setMarkerRequested(true);};
 const stopCamera=()=>{setMarkerRequested(false);camera.stop();};
 const beginSpatial=async()=>{if(!spatialControls.current){setSpatialMessage('La vista 3D todavía no está lista. Volvé a intentar.');return;}setMarkerRequested(false);camera.stop();setSpatialBusy(true);try{await spatialControls.current.start();}finally{setSpatialBusy(false);}};
 const beginWorld=async()=>{setMarkerRequested(false);camera.stop();await world.start();};
 const augmented=spatial||world.active||camera.active;
 useEffect(()=>{if(!world.active)setEditing(false);},[world.active]);
 const game=useGame(engine,editing||paused||camera.busy||spatialBusy||world.status.phase==='starting');
 const sound=useSound(game.points);
 const displayPosition=game.trackedPosition??position;
 const boundary=engine.getBoundary(displayPosition);
 const blocked=editing||paused||camera.busy||spatialBusy||world.status.phase==='starting'||!!game.safetyMessage;
 const move=useCallback((p:Position)=>setPosition({x:Math.max(-2,Math.min(2,p.x)),z:Math.max(-2,Math.min(2,p.z))}),[]);
 const feed=useCallback((p:Position)=>{
  if(engine.phase==='playing') {if(paused||engine.safetyMessage){setMessage(engine.safetyMessage||'Reanudá la granja para alimentar.');return;}setMessage(engine.placeFood(p)??'¡Alimento servido! Mirá quién se acerca.');}
  else move(p);
 },[engine,move,paused,game.phase]);
 const step=useCallback((x:number,z:number)=>setPosition(p=>({x:Math.max(-2,Math.min(2,p.x+x)),z:Math.max(-2,Math.min(2,p.z+z))})),[]);
 const start=()=>{engine.start();setPaused(false);setEditing(false);setMessage('Elegí alimento y tocá el campo.');};
 useEffect(()=>{const key=(e:KeyboardEvent)=>{if((e.target as HTMLElement).tagName==='INPUT')return;const delta:Record<string,[number,number]>={ArrowUp:[0,-.15],ArrowDown:[0,.15],ArrowLeft:[-.15,0],ArrowRight:[.15,0]};if(delta[e.key]){e.preventDefault();step(...delta[e.key]);}};window.addEventListener('keydown',key);return()=>window.removeEventListener('keydown',key)},[step]);
 return <main className={'phase-'+game.phase+(augmented?' spatial-ui':'')}><a className="skip" href="#controls">Ir a los controles</a>
 <header><a className="brand" href={import.meta.env.BASE_URL} aria-label="Foody inicio" translate="no">{BrandConfig.name}<span>AR Farm</span></a><span className="mode"><i/>{world.active?'AR sin marcador':spatial?'AR espacial':marker?'AR con marcador':camera.active?'Cámara + granja':'Demo virtual'}</span></header>
 <section className="intro"><span className="chapter">Una granja en la palma de tu mano</span><h1>{BrandConfig.title}</h1><p>{game.phase==='playing'?'¡Comida rica, animales felices!':'Gallinas curiosas, pollitos inquietos y conejos saltarines.'}</p></section>
 {game.phase==='playing'&&<section className="scoreboard" aria-label="Partida en curso"><div><span>Tiempo</span><strong className={game.seconds<=10?'urgent':''} data-testid="timer">{game.seconds}s</strong></div><div><span>Puntos</span><strong data-testid="score">{game.points}</strong></div><div><span>Combo {game.combo}</span><strong>×{game.multiplier}</strong></div></section>}
 <section className="farm" aria-label="Granja 3D interactiva de tres por tres metros">
 <canvas ref={world.canvas} hidden={!world.active} className="world-feed" aria-hidden="true"/>
 <video ref={camera.video} className="camera-feed" hidden={!camera.active} autoPlay playsInline muted aria-hidden="true"/>
 <FarmScene onPlacementChange={onPlacementChange} editing={editing||game.phase==='ready'} world={world.active} worldAdapter={world.adapter} marker={marker} markerPose={markerTracking.pose} spatial={spatial} spatialControls={spatialControls} onSpatialStatus={onSpatialStatus} cameraOverlay={camera.active} engine={engine} position={displayPosition} state={boundary.state} onMove={feed} paused={blocked||game.phase==='results'}/>
 <span className="area">{world.active?'Granja anclada · escala aproximada':spatial?'3 × 3 m · seguimiento WebXR':marker?'Maqueta con marcador · escala aproximada':camera.active?'Superposición · sin rastreo físico':'3 × 3 m · espacio virtual'}</span><button className="motion" aria-pressed={paused} onClick={()=>setPaused(!paused)}>{paused?'Reanudar granja':'Pausar granja'}</button>
 <div className={'status '+boundary.state} role="status"><span className="status-dot"/>{game.safetyMessage||labels[boundary.state]}</div>{augmented&&<p className="spatial-help" role="status">{world.active?(game.safetyMessage||(!world.adapter.origin?world.status.message:'')):marker?markerTracking.message:camera.active?'Superposición sin rastreo físico':spatialMessage}</p>}</section>
 <p className="animal-roster" aria-label="Animales de la granja">2 gallinas · 3 pollitos · 2 conejos</p>
 <section className="play-panel" id="controls" aria-label="Alimentar animales">
 {game.phase==='ready'&&<><h2>Un minuto para hacerlos felices</h2><p>Elegí el alimento de cada animal y tocá el suelo. Encadená comidas para multiplicar tus puntos.</p><button className="primary" disabled={!sceneReady} onClick={start}>¡A jugar! · 60 segundos</button></>}
 {game.phase==='playing'&&<><h2>¿Qué les damos de comer?</h2><div className="foods" role="group" aria-label="Alimento seleccionado">{BrandConfig.foods.map(product=><button key={product.id} disabled={blocked} aria-pressed={food===product.id} onClick={()=>{engine.selectedFood=product.id;setFood(product.id);setMessage(`${product.name} para ${product.animalLabel.toLowerCase()}. Tocá el campo.`);}}><span aria-hidden="true">{product.icon}</span><strong>{product.name}</strong><small>{product.animalLabel}</small></button>)}</div><p className="game-message" data-blocked={!!game.safetyMessage||paused||editing} role="status">{game.safetyMessage|| (editing?'Ajustando la granja. Tocá Listo para seguir.':paused?'Partida pausada. Reanudá cuando quieras.':message)}</p><button className="serve" disabled={blocked} onClick={()=>feed(displayPosition)}>Servir en el explorador</button><small className="placeholder-note">Alimentos de demostración. Catálogo Foody pendiente.</small></>}
 {game.phase==='results'&&<><span className="result-icon" aria-hidden="true">♡</span><h2>¡Una granja llena de felicidad!</h2><strong className="result-points">{game.points} <small>puntos</small></strong><p>{game.fed} {game.fed===1?'comida servida':'comidas servidas'} · mejor combo de {game.bestCombo}</p><ShareCard result={{points:game.points,fed:game.fed,bestCombo:game.bestCombo}}/><button className="primary" onClick={start}>Volver a jugar</button></>}
 </section>
 <details className="explore-controls" hidden={augmented}><summary>Mover explorador y probar límites</summary><section className="controls" aria-label="Navegación virtual"><div className="instruction"><span className="footprint" aria-hidden="true">⌖</span><div><h2>Mové tu explorador</h2><p>Usá las flechas para elegir dónde servir.</p></div><button className="reset" onClick={()=>move({x:0,z:0})}>Centrar</button></div><div className="direction"><button aria-label="Mover a la izquierda" onClick={()=>step(-.15,0)}>←</button><button aria-label="Mover hacia el fondo" onClick={()=>step(0,-.15)}>↑</button><button aria-label="Mover hacia adelante" onClick={()=>step(0,.15)}>↓</button><button aria-label="Mover a la derecha" onClick={()=>step(.15,0)}>→</button></div><button className="debug-toggle" aria-expanded={debug} aria-controls="debug-panel" onClick={()=>setDebug(!debug)}>{debug?'Cerrar pruebas':'Probar límites'}</button></section>
 {debug&&<section className="debug" id="debug-panel"><h2>Simulador de posición virtual</h2><p data-testid="boundary-state">{boundary.state} · al borde: {boundary.distance.toFixed(2)} m</p><div className="presets">{(['SAFE','WARNING','DANGER','OUTSIDE'] as const).map((state,i)=><button key={state} onClick={()=>move({x:[0,1.05,1.35,1.7][i],z:0})}>{state}</button>)}</div>{(['x','z'] as const).map(axis=><label key={axis}>Eje {axis.toUpperCase()}: {position[axis].toFixed(2)} m<input aria-label={'Posición '+axis} type="range" min="-2" max="2" step="0.01" value={position[axis]} onChange={e=>move({...position,[axis]:Number(e.target.value)})}/></label>)}<p>Fuera del área: aviso sin pausa. La pausa automática requiere seguimiento espacial fiable.</p></section>}
 </details>
 <section className="camera-controls" aria-label="Modo cámara" hidden={augmented}><button disabled={camera.busy} aria-pressed={camera.active} onClick={()=>camera.active?stopCamera():void camera.start()}>{camera.busy?'Abriendo cámara…':camera.active?'Volver a modo virtual':'Activar cámara'}</button><p>{marker?'La maqueta sigue el marcador visible. No detecta el piso ni mide límites físicos.':camera.active?'La granja se superpone al video. No detecta el piso ni tu posición física.':'Cámara opcional. La demo virtual funciona sin permisos.'}</p>{camera.error&&<p role="alert">{camera.error}</p>}<details className="marker-controls"><summary>Prueba técnica opcional con marcador</summary><button disabled={camera.busy||!sceneReady} aria-pressed={marker} onClick={()=>marker?setMarkerRequested(false):void beginMarker()}>{marker?'Dejar de rastrear marcador':'Probar AR con marcador'}</button><a href={import.meta.env.BASE_URL+'marker.html'} target="_blank" rel="noreferrer">Abrir marcador para imprimir</a>{marker&&!augmented&&<p role="status">{markerTracking.message}</p>}</details>{spatialSupported?<button disabled={!sceneReady||spatialBusy||camera.busy} onClick={()=>void beginSpatial()}>{spatialBusy?'Abriendo AR espacial…':'Probar AR espacial · experimental'}</button>:<small>AR espacial no disponible en este navegador.</small>}{spatialMessage&&!spatial&&<p role="status">{spatialMessage}</p>}</section>
 {!augmented&&<section className="world-controls" aria-label="AR sin marcador"><h2>La granja en tu espacio</h2><p>Sin app ni marcador. Conservá el juego mientras recorrés la granja.</p><button className="primary" disabled={!world.installed||!sceneReady||camera.busy||spatialBusy} onClick={()=>void beginWorld()}>Probar AR sin marcador</button>{!world.installed&&<p>Motor pendiente de activar para esta prueba local.</p>}{world.status.phase==='error'&&<p role="alert">{world.status.message}</p>}</section>}
 {world.active&&!world.adapter.origin&&<><span className="world-aim" aria-hidden="true"/><div className="world-placement"><button className="primary" disabled={!world.status.canPlace} onClick={()=>world.place()}>Colocar granja aquí</button><small>Elegí un punto del suelo. Escala aproximada; límites físicos sin calibrar.</small></div></>}
 {world.active&&world.adapter.origin&&<PlacementControls onChange={onPlacementChange} adapter={world.adapter} editing={editing} onEdit={()=>{onPlacementChange();setEditing(value=>!value);}} onReposition={()=>{setEditing(false);world.reposition();}}/>}
 {world.active&&world.adapter.origin&&(editing||game.phase==='ready')&&<p className="gesture-hint" role="status">Arrastrá · Pellizcá · Girá con dos dedos{editing&&<output aria-label="Transformación de la granja">{Math.round(placement.scale*100)}% · {Math.round(placement.yaw)}°</output>}</p>}
 {augmented&&(!world.active||world.adapter.origin)&&game.phase==='playing'&&!editing&&!game.safetyMessage&&<p className="gesture-hint">Elegí alimento y tocá el suelo</p>}
 {camera.active&&<button className="exit-spatial" onClick={stopCamera}>Volver a modo virtual</button>}
 {marker&&<button className="marker-exit" onClick={()=>setMarkerRequested(false)}>Dejar de rastrear marcador</button>}
 {world.active&&<button className="exit-spatial" onClick={()=>void world.stop()}>Salir de AR</button>}
 {!augmented&&<ARDiagnostics/>}
 {spatial&&<button className="exit-spatial" onClick={()=>void spatialControls.current?.end()}>Salir de AR</button>}
 <p className="notice" hidden={augmented}>{marker?'Rastreo visual limitado al marcador visible. Sin detección de superficies ni límites físicos.':'El límite es virtual. Este modo no rastrea la posición física de tu teléfono.'}</p><footer><span>Hecho para explorar, con Foody.</span><a href={import.meta.env.BASE_URL+'vendor/xr8/LICENSE'} target="_blank" rel="noreferrer" className="sdk-license">Licencia del motor AR</a> <div className="sound-control"><button aria-pressed={sound.enabled} onClick={()=>void sound.toggle()}>{sound.enabled?'Silenciar sonido':'Activar sonido'}</button>{sound.error&&<span role="status">{sound.error}</span>}</div>
</footer>
 </main>;
}
