declare module 'js-aruco2' {
 export const AR: {Detector:new(options?:{dictionaryName:string;maxHammingDistance?:number})=>{detect(image:ImageData):{id:number;corners:{x:number;y:number}[]}[]}};
 const api:{AR:typeof AR};export default api;
}
declare module 'js-aruco2/src/posit1.js' {
 export const POS:{Posit:new(size:number,focal:number)=>{pose(corners:{x:number;y:number}[]):{bestError:number;bestRotation:number[][];bestTranslation:number[]}}};
 const api:{POS:typeof POS};export default api;
}
