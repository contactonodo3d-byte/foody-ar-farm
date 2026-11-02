import {PlacementGestures} from '../ar/PlacementGestures';
import { WorldTrackingScene } from '../ar/WorldTrackingScene';
import type { WorldTrackingAdapter } from '../ar/WorldTrackingAdapter';
import { MarkerScene } from '../ar/MarkerScene';
import type { MarkerPose } from '../hooks/useMarkerTracking';
import { SpatialSession, type SpatialControls, type SpatialStatus } from '../ar/SpatialSession';
import type { RefObject } from 'react';
import { FoodEffects } from './FoodEffects';
import { Animals } from './Animals';
import type { GameEngine } from '../engine/GameEngine';
import { Canvas, useFrame, type ThreeEvent } from '@react-three/fiber';
import { Component, Suspense, useRef, type ReactNode } from 'react';
import * as THREE from 'three';
import { evaluateBoundaryEdges, type Position, type BoundaryState } from '../engine/BoundarySystem';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { FarmConfig } from '../config/BrandConfig';

function AreaOutline() {
 const half = FarmConfig.halfSize;
 return <group name="virtual-area-outline">
  {[-half, half].map(edge => <group key={edge}>
   <mesh position={[0, .018, edge]} raycast={() => {}}>
    <boxGeometry args={[half * 2, .022, .035]}/>
    <meshBasicMaterial color="#fff7ce"/>
   </mesh>
   <mesh position={[edge, .018, 0]} raycast={() => {}}>
    <boxGeometry args={[.035, .022, half * 2]}/>
    <meshBasicMaterial color="#fff7ce"/>
   </mesh>
  </group>)}
  {[-half, half].flatMap(x => [-half, half].map(z =>
   <mesh key={`${x}:${z}`} position={[x, .04, z]} raycast={() => {}}>
    <cylinderGeometry args={[.055, .055, .08, 12]}/>
    <meshStandardMaterial color="#315e4b"/>
   </mesh>
  ))}
 </group>;
}

function BoundaryWall({edge,paused}:{edge:ReturnType<typeof evaluateBoundaryEdges>[number];paused:boolean}) {
 const material = useRef<THREE.ShaderMaterial>(null);
 const target = edge.intensity;
 const color = new THREE.Color(edge.effectState === 'WARNING' ? '#bbeb68' : '#ff6948');
 const uniforms = useRef({time:{value:0},strength:{value:0},tint:{value:new THREE.Color('#bbeb68')}});
 useFrame((_,dt)=>{
  if (!material.current) return;
  const u=material.current.uniforms;
  if(!paused) u.time.value+=Math.min(dt,0.05);
  u.strength.value=THREE.MathUtils.damp(u.strength.value,target,6,dt);
  u.tint.value.lerp(color,Math.min(dt*6,1));
 });
 const offset=FarmConfig.halfSize*edge.sign;
 return <mesh name={'boundary-'+edge.id} position={[edge.axis==='x'?offset:0,FarmConfig.wallHeight/2,edge.axis==='z'?offset:0]} rotation={[0,edge.axis==='x'?Math.PI/2:0,0]} raycast={() => {}}>
  <planeGeometry args={[FarmConfig.halfSize*2,FarmConfig.wallHeight]}/>
  <shaderMaterial ref={material} uniforms={uniforms.current} transparent side={THREE.DoubleSide} depthWrite={false}
   vertexShader={'varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }'}
   fragmentShader={'varying vec2 vUv; uniform float time; uniform float strength; uniform vec3 tint; void main(){float wave=.8+.2*sin(vUv.x*18.-time*2.);float dots=step(.988,sin(vUv.x*140.+time)*sin(vUv.y*90.-time));float alpha=(pow(1.-vUv.y,1.6)*wave+dots*.2)*strength;gl_FragColor=vec4(mix(tint,vec3(1.,.95,.3),vUv.y),alpha);}'}/>
 </mesh>;
}
function Walls({position,paused}:{position:Position;paused:boolean}) {
 return <group>{evaluateBoundaryEdges(position).map(edge=><BoundaryWall key={edge.id} edge={edge} paused={paused}/>)}</group>;
}
function ToyBarn(){return <group position={[-0.85,0,-0.85]}>
 <mesh position={[0,.25,0]} castShadow><boxGeometry args={[.6,.5,.48]}/><meshStandardMaterial color="#e87455"/></mesh>
 <mesh position={[0,.57,0]} rotation={[0,Math.PI/4,0]} castShadow><coneGeometry args={[.47,.35,4]}/><meshStandardMaterial color="#934f43"/></mesh>
 <mesh position={[0,.17,.246]}><boxGeometry args={[.19,.34,.01]}/><meshStandardMaterial color="#754a39"/></mesh>
 <mesh position={[0,.2,.26]}><boxGeometry args={[.018,.3,.01]}/><meshStandardMaterial color="#fff3d4"/></mesh>
 </group>}
function Scene({onPlacementChange,editing,position,state,onMove,paused,engine,reduced,cameraOverlay,marker,markerPose,world,worldAdapter,spatial,spatialControls,onSpatialStatus}:{onPlacementChange:()=>void;editing:boolean;world:boolean;worldAdapter:WorldTrackingAdapter;marker:boolean;markerPose:RefObject<MarkerPose|null>;spatial:boolean;spatialControls:RefObject<SpatialControls|null>;onSpatialStatus:(status:SpatialStatus)=>void;cameraOverlay:boolean;reduced:boolean;engine:GameEngine;position:Position;state:BoundaryState;onMove:(p:Position)=>void;paused:boolean}){
 const farm=useRef<THREE.Group>(null);
 const transparent=cameraOverlay||spatial||world;
 const click=(e:ThreeEvent<PointerEvent>)=>{if(spatial)return;e.stopPropagation();if(e.delta<8)onMove(farm.current?farm.current.worldToLocal(e.point.clone()):{x:e.point.x,z:e.point.z});};
 return <>{!transparent&&<color attach="background" args={['#dff3ff']}/>}<ambientLight intensity={1.8}/><directionalLight position={[3,6,4]} intensity={2.4} castShadow shadow-mapSize={[1024,1024]} shadow-camera-left={-4} shadow-camera-right={4} shadow-camera-top={4} shadow-camera-bottom={-4}/>
 <SpatialSession engine={engine} farm={farm} controls={spatialControls} onStatus={onSpatialStatus}/>
 <PlacementGestures adapter={worldAdapter} enabled={world&&editing} onChange={onPlacementChange}/>
 <WorldTrackingScene active={world} adapter={worldAdapter} farm={farm}/>
 <MarkerScene farm={farm} pose={markerPose} enabled={marker}/>
 <group ref={farm}>
 <mesh visible={!transparent} rotation={[-Math.PI/2,0,0]} position={[0,-.09,0]} onPointerUp={click} receiveShadow><planeGeometry args={[200,200]}/><meshBasicMaterial color="#dff3ff" toneMapped={false}/></mesh>
 <mesh visible={!transparent} position={[0,-.07,0]} receiveShadow><boxGeometry args={[3,.14,3]}/><meshStandardMaterial color="#80ad50"/></mesh>
 <mesh rotation={[-Math.PI/2,0,0]} position={[0,.004,0]} onPointerUp={click} receiveShadow><planeGeometry args={[3,3]}/><meshStandardMaterial color="#b7d878" transparent={transparent} opacity={transparent?.10:1}/></mesh>
 <gridHelper visible={!transparent} args={[3,6,'#a0c466','#a7ce70']} position={[0,.006,0]}/><AreaOutline/><ToyBarn/>
 {Array.from({length:16},(_,i)=><mesh key={i} position={[Math.sin(i*27)*1.25,.025,Math.cos(i*17)*1.25]} rotation={[-Math.PI/2,0,0]}><circleGeometry args={[.018,5]}/><meshBasicMaterial color={i%3?'#f6f8b6':'#fffef4'}/></mesh>)}
 <mesh position={[position.x,.035,position.z]} rotation={[-Math.PI/2,0,0]}><ringGeometry args={[.09,.14,32]}/><meshBasicMaterial color="#244e49" side={THREE.DoubleSide}/></mesh>
 <mesh position={[position.x,.13,position.z]} castShadow><sphereGeometry args={[.075,16,12]}/><meshStandardMaterial color="#fff9e8"/></mesh>
 <Animals engine={engine} paused={paused||reduced}/><FoodEffects engine={engine} reduced={reduced}/><Walls position={position} paused={paused||reduced}/>
 </group></>;
}
class SceneError extends Component<{children:ReactNode},{failed:boolean}>{state={failed:false};static getDerivedStateFromError(){return {failed:true}}render(){return this.state.failed?<p className="scene-error" role="alert">No se pudo abrir la vista 3D. Activá WebGL y recargá la página. Los controles virtuales siguen disponibles.</p>:this.props.children}}
export function FarmScene(props:Omit<Parameters<typeof Scene>[0], 'reduced'>){const reduced=useReducedMotion();return <SceneError><Suspense fallback={<p>Cargando granja…</p>}><Canvas shadows dpr={[1,1.5]} camera={{position:[3.5,4.4,4.8],fov:43}} gl={{alpha:true,antialias:true,powerPreference:'low-power'}} onCreated={({camera})=>camera.lookAt(0,0,0)}><Scene {...props} reduced={reduced}/></Canvas></Suspense></SceneError>}
