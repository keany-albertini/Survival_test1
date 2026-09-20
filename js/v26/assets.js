import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.169.0/build/three.module.js";
import { GLTFLoader } from "https://cdn.jsdelivr.net/npm/three@0.169.0/examples/jsm/loaders/GLTFLoader.js";

const loader=new GLTFLoader();
const cache=new Map();

function hash(x,y,seed){
  const v=Math.sin(x*12.9898+y*78.233+seed*37.719)*43758.5453;
  return v-Math.floor(v);
}

function makeTexture(kind,renderer){
  const size=128;
  const canvas=document.createElement("canvas");
  canvas.width=canvas.height=size;
  const ctx=canvas.getContext("2d");
  const img=ctx.createImageData(size,size);

  for(let y=0;y<size;y++){
    for(let x=0;x<size;x++){
      const i=(y*size+x)*4;
      const n=(hash(x,y,3)+hash(x*.37,y*.61,7)+hash(x*.11,y*.19,13))/3;
      let r,g,b;
      if(kind==="bark"){
        const streak=Math.sin(x*.33+Math.sin(y*.07)*2.2)*.5+.5;
        r=63+n*34+streak*20; g=40+n*26+streak*13; b=23+n*18+streak*8;
      }else if(kind==="leaf"){
        r=35+n*36; g=82+n*72; b=33+n*36;
      }else if(kind==="leafLight"){
        r=66+n*50; g=108+n*78; b=45+n*42;
      }else if(kind==="stone"){
        r=88+n*60; g=94+n*62; b=90+n*57;
      }else{
        r=61+n*40; g=88+n*48; b=48+n*30;
      }
      img.data[i]=Math.max(0,Math.min(255,r));
      img.data[i+1]=Math.max(0,Math.min(255,g));
      img.data[i+2]=Math.max(0,Math.min(255,b));
      img.data[i+3]=255;
    }
  }
  ctx.putImageData(img,0,0);

  if(kind==="bark"){
    ctx.strokeStyle="rgba(28,17,10,.34)";
    for(let x=8;x<size;x+=13){
      ctx.lineWidth=2+(x%3);
      ctx.beginPath();
      ctx.moveTo(x,0);
      ctx.bezierCurveTo(x-4,size*.35,x+5,size*.72,x-2,size);
      ctx.stroke();
    }
  }
  if(kind==="stone"){
    ctx.strokeStyle="rgba(34,37,34,.22)";
    for(let i=0;i<16;i++){
      const x=hash(i,2,9)*size,y=hash(i,4,11)*size;
      ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+12+hash(i,8,4)*22,y+6+hash(i,7,5)*18);ctx.stroke();
    }
  }

  const tex=new THREE.CanvasTexture(canvas);
  tex.wrapS=tex.wrapT=THREE.RepeatWrapping;
  tex.repeat.set(kind==="bark"?2:1.8,kind==="bark"?5:1.8);
  tex.colorSpace=THREE.SRGBColorSpace;
  tex.anisotropy=Math.min(8,renderer?.capabilities?.getMaxAnisotropy?.()||4);

  const bump=tex.clone();
  bump.colorSpace=THREE.NoColorSpace;
  return {map:tex,bump};
}

function enhanceMaterials(root,renderer){
  const mats={
    bark:makeTexture("bark",renderer),
    leaf:makeTexture("leaf",renderer),
    leafLight:makeTexture("leafLight",renderer),
    stone:makeTexture("stone",renderer),
    moss:makeTexture("moss",renderer)
  };

  root.traverse(o=>{
    if(!o.isMesh)return;
    o.castShadow=true;
    o.receiveShadow=true;

    const name=(o.material?.name||"").toLowerCase();
    const material=o.material?.clone?.()||new THREE.MeshStandardMaterial();
    let pack=null;

    if(name.includes("bark"))pack=mats.bark;
    else if(name.includes("leaf")||name.includes("foliage"))pack=name.includes("light")?mats.leafLight:mats.leaf;
    else if(name.includes("moss"))pack=mats.moss;
    else if(name.includes("stone"))pack=mats.stone;

    if(pack){
      material.map=pack.map;
      material.bumpMap=pack.bump;
      material.bumpScale=name.includes("stone")?.12:name.includes("bark")?.10:.035;
      material.roughness=name.includes("leaf")?.84:name.includes("stone")?.94:.96;
      material.metalness=0;
      if(name.includes("leaf")){
        material.side=THREE.DoubleSide;
        material.alphaTest=.12;
      }
      material.needsUpdate=true;
    }

    o.material=material;
  });
}

export async function loadPremiumModel(url,renderer){
  if(cache.has(url))return cache.get(url).clone(true);

  const gltf=await loader.loadAsync(url);
  enhanceMaterials(gltf.scene,renderer);
  cache.set(url,gltf.scene);
  return gltf.scene.clone(true);
}

export function clonePremium(model){
  const clone=model.clone(true);
  clone.traverse(o=>{
    if(o.isMesh&&o.material)o.material=o.material.clone();
  });
  return clone;
}
