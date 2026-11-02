import {Box3,Matrix4,type Object3D,type Mesh} from 'three';
/** Measure in model-local space so a scaled/rotated AR parent cannot distort sizing. */
export function modelBounds(root:Object3D){
 root.updateWorldMatrix(true,true);const inverse=new Matrix4().copy(root.matrixWorld).invert(),bounds=new Box3();
 root.traverse(object=>{const mesh=object as Mesh;if(!mesh.isMesh)return;mesh.geometry.computeBoundingBox();if(mesh.geometry.boundingBox)bounds.union(mesh.geometry.boundingBox.clone().applyMatrix4(new Matrix4().multiplyMatrices(inverse,mesh.matrixWorld)));});
 return bounds;
}
