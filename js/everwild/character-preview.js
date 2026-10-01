import * as THREE from 'three';
import {createPlayer} from '../v20/models.js?v=ew5';
import {applyAppearance} from './appearance.js?v=ew5';
let renderer=null,scene,camera,model,active=false,last=0;
export function previewCharacter(canvas,profile){
 if(!renderer){renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:true,powerPreference:'low-power'});renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.25;scene=new THREE.Scene();scene.add(new THREE.HemisphereLight(0xe0ecf1,0x7e7157,2.5));const sun=new THREE.DirectionalLight(0xffe6c7,3);sun.position.set(3,5,4);scene.add(sun);const rim=new THREE.DirectionalLight(0x98c7e5,1.7);rim.position.set(-3,3,-4);scene.add(rim);camera=new THREE.PerspectiveCamera(34,1,.1,20);camera.position.set(0,1.22,3.6);camera.lookAt(0,1.02,0);}
 if(model){scene.remove(model);model.traverse(o=>{if(o.isMesh&&o.geometry&&!o.isInstancedMesh)o.geometry.dispose();});}
 model=createPlayer();applyAppearance(model,profile);model.rotation.y=-.15;scene.add(model);const w=Math.max(220,canvas.clientWidth||280),h=canvas.clientHeight||330;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();renderer.render(scene,camera);active=true;if(!last){last=1;requestAnimationFrame(frame);}
}
function frame(time){if(active&&model&&renderer){model.rotation.y=Math.sin(time*.0003)*.33;renderer.render(scene,camera);}if(active)requestAnimationFrame(frame);else last=0;}
export function stopPreview(){active=false;}
