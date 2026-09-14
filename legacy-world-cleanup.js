import * as THREE from 'three';
let cleaned=false;
const old=THREE.WebGLRenderer.prototype.render;
THREE.WebGLRenderer.prototype.render=function(scene,camera){
  if(!cleaned&&scene.children.length>8){
    cleaned=true;
    setTimeout(()=>{
      scene.traverse(o=>{
        if(o.userData?.expansion||o.userData?.progressionNode||o.userData?.allResource||o.userData?.biomeExtra)o.visible=false;
      });
      document.querySelectorAll('.hunt-btn,.build-btn,.world-chip,#allResourceBtn,#resourceAction').forEach(e=>e.remove());
    },1400);
  }
  return old.call(this,scene,camera);
};
setInterval(()=>document.querySelectorAll('.hunt-btn,.build-btn,.world-chip,#allResourceBtn,#resourceAction').forEach(e=>e.remove()),2500);
