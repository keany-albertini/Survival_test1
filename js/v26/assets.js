import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.169.0/build/three.module.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

const loader=new GLTFLoader();
const cache=new Map();

function hash(x,y,seed){
  const v=Math.sin(x*12.9898+y*78.233+seed*37.719)*43758.5453;
  return v-Math.floor(v);
}

function makeTexture(kind,renderer){
  const size=kind==="leaf"||kind==="leafLight"||kind==="needle"?512:256;
  const canvas=document.createElement("canvas");
  canvas.width=canvas.height=size;
  const ctx=canvas.getContext("2d");

  // Foliage gets a real alpha silhouette instead of an opaque green square.
  if(kind==="leaf"||kind==="leafLight"){
    ctx.clearRect(0,0,size,size);

    const base=kind==="leafLight"
      ? {r:83,g:143,b:62}
      : {r:45,g:105,b:45};

    const grad=ctx.createRadialGradient(size*.48,size*.46,size*.06,size*.5,size*.5,size*.50);
    grad.addColorStop(0,`rgba(${base.r+34},${base.g+42},${base.b+20},1)`);
    grad.addColorStop(.68,`rgba(${base.r},${base.g},${base.b},1)`);
    grad.addColorStop(1,`rgba(${Math.max(0,base.r-18)},${Math.max(0,base.g-26)},${Math.max(0,base.b-14)},.96)`);

    ctx.fillStyle=grad;
    ctx.beginPath();
    ctx.moveTo(size*.07,size*.51);
    ctx.bezierCurveTo(size*.18,size*.16,size*.61,size*.05,size*.92,size*.46);
    ctx.bezierCurveTo(size*.70,size*.91,size*.25,size*.91,size*.07,size*.51);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle="rgba(225,236,192,.30)";
    ctx.lineWidth=size*.018;
    ctx.beginPath();
    ctx.moveTo(size*.10,size*.51);
    ctx.quadraticCurveTo(size*.48,size*.47,size*.88,size*.47);
    ctx.stroke();

    ctx.lineWidth=size*.009;
    for(let i=0;i<7;i++){
      const x=size*(.22+i*.085);
      ctx.beginPath();ctx.moveTo(x,size*.49);ctx.lineTo(x-size*.085,size*(.31+(i%2)*.035));ctx.stroke();
      ctx.beginPath();ctx.moveTo(x,size*.51);ctx.lineTo(x-size*.070,size*(.70-(i%2)*.025));ctx.stroke();
    }

    // subtle edge noise to keep the silhouette organic
    ctx.globalCompositeOperation="destination-out";
    for(let i=0;i<50;i++){
      const a=i/50*Math.PI*2;
      const x=size*.5+Math.cos(a)*size*(.43+hash(i,3,11)*.035);
      const y=size*.5+Math.sin(a)*size*(.38+hash(i,5,17)*.030);
      ctx.beginPath();ctx.arc(x,y,size*(.006+hash(i,7,23)*.012),0,Math.PI*2);ctx.fill();
    }
    ctx.globalCompositeOperation="source-over";
  }else if(kind==="needle"){
    ctx.clearRect(0,0,size,size);
    ctx.strokeStyle="rgba(43,104,53,.96)";
    ctx.lineCap="round";

    ctx.lineWidth=size*.020;
    ctx.beginPath();ctx.moveTo(size*.10,size*.52);ctx.lineTo(size*.90,size*.48);ctx.stroke();

    for(let i=0;i<18;i++){
      const t=(i+1)/19;
      const x=size*(.12+t*.76);
      const spread=size*(.12*(1-Math.abs(t-.5)*.9));
      ctx.lineWidth=size*(.006+hash(i,4,29)*.004);

      ctx.strokeStyle=i%3===0?"rgba(93,151,76,.96)":"rgba(35,88,45,.96)";
      ctx.beginPath();ctx.moveTo(x,size*.50);ctx.lineTo(x-size*.045,size*.50-spread);ctx.stroke();
      ctx.beginPath();ctx.moveTo(x,size*.50);ctx.lineTo(x-size*.045,size*.50+spread);ctx.stroke();
    }
  }else{
    const img=ctx.createImageData(size,size);

    for(let y=0;y<size;y++){
      for(let x=0;x<size;x++){
        const i=(y*size+x)*4;
        const n=(hash(x,y,3)+hash(x*.37,y*.61,7)+hash(x*.11,y*.19,13))/3;
        let r,g,b;

        if(kind==="bark"){
          const streak=Math.sin(x*.33+Math.sin(y*.07)*2.2)*.5+.5;
          r=63+n*34+streak*20; g=40+n*26+streak*13; b=23+n*18+streak*8;
        }else if(kind==="stone"){
          r=88+n*60; g=94+n*62; b=90+n*57;
        }else if(kind==="wood"){
          const streak=Math.sin(x*.27+Math.sin(y*.055)*1.7)*.5+.5;
          r=78+n*46+streak*22; g=46+n*30+streak*12; b=24+n*20+streak*7;
        }else if(kind==="thatch"){
          const stripe=Math.sin((x+y*.18)*.45)*.5+.5;
          r=92+n*46+stripe*18; g=69+n*38+stripe*14; b=36+n*23+stripe*8;
        }else if(kind==="fur"){
          const streak=Math.sin((x*.48+y*.10)+Math.sin(y*.07)*1.8)*.5+.5;
          r=112+n*74+streak*20; g=101+n*62+streak*15; b=83+n*52+streak*10;
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

    if(kind==="wood"){
      ctx.strokeStyle="rgba(38,20,10,.24)";
      for(let y=10;y<size;y+=18){
        ctx.beginPath();
        ctx.moveTo(0,y+Math.sin(y*.2)*3);
        ctx.bezierCurveTo(size*.3,y-3,size*.7,y+4,size,y-1);
        ctx.stroke();
      }
    }

    if(kind==="thatch"){
      ctx.strokeStyle="rgba(55,37,18,.22)";
      for(let x=-20;x<size+20;x+=11){
        ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x+30,size);ctx.stroke();
      }
    }

    if(kind==="fur"){
      ctx.strokeStyle="rgba(55,45,36,.22)";
      ctx.lineWidth=.7;
      for(let i=0;i<900;i++){
        const x=hash(i,7,31)*size,y=hash(i,13,37)*size,len=2+hash(i,17,41)*7;
        ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+len,y+len*.18);ctx.stroke();
      }
    }
  }

  const tex=new THREE.CanvasTexture(canvas);
  tex.wrapS=tex.wrapT=(kind==="leaf"||kind==="leafLight"||kind==="needle")
    ? THREE.ClampToEdgeWrapping
    : THREE.RepeatWrapping;

  if(!(kind==="leaf"||kind==="leafLight"||kind==="needle")){
    tex.repeat.set(
      kind==="bark"?2:kind==="wood"?3:kind==="thatch"?4:1.8,
      kind==="bark"?5:kind==="wood"?2.2:kind==="thatch"?5:1.8
    );
  }

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
    moss:makeTexture("moss",renderer),
    wood:makeTexture("wood",renderer),
    thatch:makeTexture("thatch",renderer),
    needle:makeTexture("needle",renderer),
    fur:makeTexture("fur",renderer)
  };

  root.traverse(o=>{
    if(!o.isMesh)return;
    o.castShadow=true;
    o.receiveShadow=true;

    const name=(o.material?.name||"").toLowerCase();
    const material=o.material?.clone?.()||new THREE.MeshStandardMaterial();
    let pack=null;

    if(name.includes("bark")||name.includes("antler"))pack=mats.bark;
    else if(name.includes("fur"))pack=mats.fur;
    else if(name.includes("needle"))pack=mats.needle;
    else if(name.includes("leaf")||name.includes("foliage"))pack=name.includes("light")?mats.leafLight:mats.leaf;
    else if(name.includes("moss"))pack=mats.moss;
    else if(name.includes("stone"))pack=mats.stone;
    else if(name.includes("thatch"))pack=mats.thatch;
    else if(name.includes("wood")||name.includes("plank"))pack=mats.wood;

    if(pack){
      material.map=pack.map;
      material.bumpMap=pack.bump;

      // La texture contient déjà sa couleur. On neutralise le BaseColor GLTF
      // afin d'éviter la double multiplication qui rendait certains pins noirs.
      material.color.set(0xffffff);

      material.bumpScale=name.includes("stone")?.14:name.includes("bark")?.12:name.includes("wood")?.09:name.includes("thatch")?.11:.045;
      material.roughness=(name.includes("leaf")||name.includes("needle"))?.84:name.includes("stone")?.93:name.includes("thatch")?.98:.93;
      material.metalness=0;

      if(name.includes("leaf")||name.includes("needle")){
        material.side=THREE.DoubleSide;
        material.transparent=false;
        material.alphaTest=name.includes("needle")?.20:.26;
        material.depthWrite=true;
      }

      material.needsUpdate=true;
    }

    o.material=material;
  });
}

export async function loadPremiumModel(url,renderer,onProgress){
  if(cache.has(url)){
    onProgress?.(1);
    return cache.get(url).clone(true);
  }

  const gltf=await new Promise((resolve,reject)=>{
    loader.load(
      url,
      resolve,
      evt=>{
        if(!onProgress)return;
        if(evt.lengthComputable&&evt.total>0)onProgress(Math.min(1,evt.loaded/evt.total));
        else onProgress(.45);
      },
      reject
    );
  });

  enhanceMaterials(gltf.scene,renderer);
  cache.set(url,gltf.scene);
  onProgress?.(1);
  return gltf.scene.clone(true);
}

export function clonePremium(model){
  const clone=model.clone(true);
  clone.traverse(o=>{
    if(o.isMesh&&o.material)o.material=o.material.clone();
  });
  return clone;
}
