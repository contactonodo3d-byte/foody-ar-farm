/** Minimal contracts from the public XR8 camera-pipeline API. No vendor runtime is bundled. */
export interface WorldPoint { x:number; y:number; z:number }
export interface WorldRotation {x:number;y:number;z:number;w:number}
export interface WorldFrame {position:WorldPoint;rotation:WorldRotation;intrinsics:ArrayLike<number>;trackingStatus?:string;trackingReason?:string}
export interface WorldHit {type:string;position:WorldPoint;rotation?:WorldRotation;distance:number}
export interface CameraPipelineModule {
 name:string;
 onStart?:()=>void;
 onUpdate?:(args:{processCpuResult?:{reality?:WorldFrame}})=>void;
 onException?:(error:unknown)=>void;
 onCameraStatusChange?:(args:{status:string})=>void;
 onDeviceOrientationChange?:()=>void;
}
export interface XR8Runtime {
 initialize?():Promise<void>;
 loadChunk?(name:'slam'):Promise<void>;
 isInitialized?():boolean;
 addCameraPipelineModules(modules:CameraPipelineModule[]):void;
 removeCameraPipelineModules(names:string[]):void;
 run(options:{canvas:HTMLCanvasElement;allowedDevices:string;cameraConfig:{direction:string};glContextConfig:{alpha:boolean}}):void|Promise<void>;
 stop():void|Promise<void>;
 GlTextureRenderer:{pipelineModule():CameraPipelineModule};
 XrConfig:{device():{MOBILE:string};camera():{BACK:string}};
 XrController:{
  configure(options:{disableWorldTracking:boolean;scale:'responsive';enableLighting:boolean;enableWorldPoints:boolean}):void;
  pipelineModule():CameraPipelineModule;
  hitTest(x:number,y:number,includedTypes?:string[]):WorldHit[];
  updateCameraProjectionMatrix(options:{cam:{pixelRectWidth:number;pixelRectHeight:number;nearClipPlane:number;farClipPlane:number};origin?:WorldPoint;facing?:WorldRotation}):void;
 };
}
declare global {interface Window {XR8?:XR8Runtime}}
