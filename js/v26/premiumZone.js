import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.169.0/build/three.module.js";
import { loadPremiumModel, clonePremium } from "./assets.js?v=26";

const ASSETS={
  oak:"assets/v26/trees/oak_01.gltf",
  rock:"assets/v26/rocks/rock_01.gltf"
};

function removePlaceholderArea(world,cx,cz,radius){
  const r2=radius*radius;
  for(const it of world.interactables){
    if(it.removed||!it.object)continue;
    if(it.type!=="tree"&&it.type!=="rock"&&it.type!=="ore")continue;
    const dx=it.object.position.x-cx,dz=it.object.position.z-cz;
    if(dx*dx+dz*dz>r2)continue;
    it.object.visible=false;
    it.removed=true;
    const col=world.colliders.find(c=>c.object===it.object);
    if(col)col.active=false;
  }
}

function addResource(world,object,type,radius,maxHits,extra={}){
  const it={
    type,object,radius,hits:0,maxHits,
    position:()=>object.position,
    label:type==="tree"?"Couper le chêne":"Casser le rocher",
    ...extra
  };
  world.interactables.push(it);
  world.colliders.push({object,radius:type==="tree"?.78:.68,active:true});
  return it;
}

function createGroundPatch(renderer){
  const size=256;
  const canvas=document.createElement("canvas");
  canvas.width=canvas.height=size;
  const ctx=canvas.getContext("2d");
  const img=ctx.createImageData(size,size);

  for(let y=0;y<size;y++)for(let x=0;x<size;x++){
    const i=(y*size+x)*4;
    const n=(Math.sin(x*.18)+Math.cos(y*.14)+Math.sin((x+y)*.07))*7;
    img.data[i]=116+n;
    img.data[i+1]=103+n*.65;
    img.data[i+2]=72+n*.42;
    img.data[i+3]=255;
  }
  ctx.putImageData(img,0,0);

  for(let i=0;i<100;i++){
    const x=(i*73)%size,y=(i*41)%size;
    ctx.fillStyle=i%3?"rgba(64,92,49,.18)":"rgba(85,68,48,.20)";
    ctx.beginPath();ctx.ellipse(x,y,5+(i%11),3+(i%7),i*.29,0,Math.PI*2);ctx.fill();
  }

  const map=new THREE.CanvasTexture(canvas);
  map.wrapS=map.wrapT=THREE.RepeatWrapping;
  map.repeat.set(3,3);
  map.colorSpace=THREE.SRGBColorSpace;
  map.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());

  const mat=new THREE.MeshStandardMaterial({
    map,
    color:0xd6c99d,
    roughness:.94,
    metalness:0,
    transparent:true,
    opacity:.82,
    depthWrite:false,
    polygonOffset:true,
    polygonOffsetFactor:-2
  });

  const mesh=new THREE.Mesh(new THREE.CircleGeometry(11.5,48),mat);
  mesh.rotation.x=-Math.PI/2;
  mesh.receiveShadow=true;
  return mesh;
}

export async function initPremiumZone(scene,world,renderer,terrainHeight){
  const zone={group:new THREE.Group(),trees:[],rocks:[],ground:null};
  zone.group.name="V26_Premium_Test_Zone";
  scene.add(zone.group);

  const center={x:-5,z:5};
  removePlaceholderArea(world,center.x,center.z,13);

  const [oakBase,rockBase]=await Promise.all([
    loadPremiumModel(ASSETS.oak,renderer),
    loadPremiumModel(ASSETS.rock,renderer)
  ]);

  zone.ground=createGroundPatch(renderer);
  zone.ground.position.set(center.x,terrainHeight(center.x,center.z)+.028,center.z);
  zone.group.add(zone.ground);

  const treeSpots=[
    [-10,3,1.10,.15],[-1,9,.92,-.5],[-8,12,1.0,.75],[3,3,.84,-1.1]
  ];
  for(const [x,z,s,r] of treeSpots){
    const tree=clonePremium(oakBase);
    tree.position.set(x,terrainHeight(x,z),z);
    tree.scale.setScalar(s);
    tree.rotation.y=r;
    zone.group.add(tree);
    zone.trees.push(tree);
    addResource(world,tree,"tree",1.8,4,{yield:{wood:8}});
  }

  const rockSpots=[
    [-2,1,.95,.1],[-11,8,.82,.8],[1,12,.68,-.4]
  ];
  for(const [x,z,s,r] of rockSpots){
    const rock=clonePremium(rockBase);
    rock.position.set(x,terrainHeight(x,z),z);
    rock.scale.setScalar(s);
    rock.rotation.y=r;
    zone.group.add(rock);
    zone.rocks.push(rock);
    addResource(world,rock,"rock",1.6,5);
  }

  return zone;
}

export function updatePremiumZone(zone,time){
  if(!zone)return;
  for(let i=0;i<zone.trees.length;i++){
    const tree=zone.trees[i];
    const sway=Math.sin(time*.55+i*1.7)*.004;
    tree.rotation.z=sway;
    tree.rotation.x=Math.cos(time*.47+i)*.0018;
  }
}
