import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.169.0/build/three.module.js";
import { loadPremiumModel, clonePremium } from "./assets.js?v=264";

const ASSETS={
  oak:"assets/v26/trees/oak_01.gltf",
  pine:"assets/v26/trees/pine_01.gltf",
  rock:"assets/v26/rocks/rock_01.gltf",
  shelter:"assets/v26/camp/shelter_01.gltf"
};

function seeded(n){
  const x=Math.sin(n*12.9898+78.233)*43758.5453;
  return x-Math.floor(x);
}

function removeLegacyZone(world,cx,cz,radius){
  const r2=radius*radius;
  for(const it of world.interactables){
    if(it.removed||!it.object)continue;
    if(!["tree","rock","ore","berries"].includes(it.type))continue;
    const dx=it.object.position.x-cx,dz=it.object.position.z-cz;
    if(dx*dx+dz*dz>r2)continue;
    it.object.visible=false;
    it.removed=true;
    const col=world.colliders.find(c=>c.object===it.object);
    if(col)col.active=false;
  }

  for(const obj of [...(world.treeGroups||[]),...(world.bushGroups||[])]){
    const dx=obj.position.x-cx,dz=obj.position.z-cz;
    if(dx*dx+dz*dz<=r2)obj.visible=false;
  }
}

function addResource(world,object,type,radius,maxHits,extra={}){
  const it={
    type,object,radius,hits:0,maxHits,
    position:()=>object.position,
    label:type==="tree"?"Couper l'arbre":"Casser le rocher",
    ...extra
  };
  world.interactables.push(it);
  world.colliders.push({object,radius:type==="tree"?.72:.68,active:true});
  return it;
}

function makeGroundTexture(renderer){
  const size=512;
  const canvas=document.createElement("canvas");
  const bumpCanvas=document.createElement("canvas");
  canvas.width=canvas.height=size;
  bumpCanvas.width=bumpCanvas.height=size;
  const ctx=canvas.getContext("2d");
  const bumpCtx=bumpCanvas.getContext("2d");
  const img=ctx.createImageData(size,size);
  const bump=bumpCtx.createImageData(size,size);

  for(let y=0;y<size;y++)for(let x=0;x<size;x++){
    const i=(y*size+x)*4;
    const n1=Math.sin(x*.075)+Math.cos(y*.069);
    const n2=Math.sin((x+y)*.026)+Math.cos((x-y)*.043);
    const grain=(n1+n2)*6+seeded(x*3+y*7)*15;
    img.data[i]=112+grain;
    img.data[i+1]=93+grain*.72;
    img.data[i+2]=62+grain*.44;
    img.data[i+3]=255;
    const v=120+grain*2;
    bump.data[i]=bump.data[i+1]=bump.data[i+2]=Math.max(0,Math.min(255,v));
    bump.data[i+3]=255;
  }
  ctx.putImageData(img,0,0);
  bumpCtx.putImageData(bump,0,0);

  for(let i=0;i<220;i++){
    const x=seeded(100+i*7)*size,y=seeded(300+i*11)*size;
    const rx=3+seeded(500+i*5)*18,ry=2+seeded(700+i*3)*11;
    ctx.fillStyle=i%4===0?"rgba(49,76,38,.16)":i%3===0?"rgba(74,56,39,.17)":"rgba(130,117,78,.08)";
    ctx.beginPath();ctx.ellipse(x,y,rx,ry,seeded(900+i)*Math.PI,0,Math.PI*2);ctx.fill();
  }

  const map=new THREE.CanvasTexture(canvas);
  map.wrapS=map.wrapT=THREE.RepeatWrapping;
  map.repeat.set(4.5,4.5);
  map.colorSpace=THREE.SRGBColorSpace;
  map.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());

  const bumpMap=new THREE.CanvasTexture(bumpCanvas);
  bumpMap.wrapS=bumpMap.wrapT=THREE.RepeatWrapping;
  bumpMap.repeat.copy(map.repeat);
  bumpMap.colorSpace=THREE.NoColorSpace;
  return {map,bumpMap};
}

function createGroundPatch(renderer,rx,rz,color=0xd5c08a,opacity=.68,seed=1){
  const tex=makeGroundTexture(renderer);
  const segments=64;
  const positions=[0,0,0];
  const normals=[0,1,0];
  const uvs=[.5,.5];
  const indices=[];

  for(let i=0;i<=segments;i++){
    const a=i/segments*Math.PI*2;
    const wobble=1+
      Math.sin(a*3+seed*.7)*.07+
      Math.sin(a*7+seed*1.3)*.035+
      (seeded(seed*97+i*11)-.5)*.07;
    const x=Math.cos(a)*rx*wobble;
    const z=Math.sin(a)*rz*wobble;
    positions.push(x,0,z);
    normals.push(0,1,0);
    uvs.push(.5+x/(rx*2.25),.5+z/(rz*2.25));
    if(i<segments)indices.push(0,i+1,i+2);
  }

  const geo=new THREE.BufferGeometry();
  geo.setAttribute("position",new THREE.Float32BufferAttribute(positions,3));
  geo.setAttribute("normal",new THREE.Float32BufferAttribute(normals,3));
  geo.setAttribute("uv",new THREE.Float32BufferAttribute(uvs,2));
  geo.setIndex(indices);

  const mat=new THREE.MeshStandardMaterial({
    map:tex.map,
    bumpMap:tex.bumpMap,
    bumpScale:.16,
    color,
    roughness:.96,
    metalness:0,
    transparent:true,
    opacity,
    depthWrite:false,
    polygonOffset:true,
    polygonOffsetFactor:-3
  });

  const mesh=new THREE.Mesh(geo,mat);
  mesh.receiveShadow=true;
  return mesh;
}

function createPathPatches(group,terrainHeight){
  const mat=new THREE.MeshStandardMaterial({
    color:0x8f7652,roughness:.98,transparent:true,opacity:.70,
    polygonOffset:true,polygonOffsetFactor:-4
  });
  const points=[
    [-8,8],[-6.6,6.8],[-5.0,5.9],[-3.2,5.3],[-1.3,5.1],[.8,5.4],[2.7,6.2]
  ];
  points.forEach((p,i)=>{
    const patch=new THREE.Mesh(new THREE.CircleGeometry(.72+(i%3)*.12,24),mat);
    patch.scale.set(1.7,.72,1);
    patch.rotation.x=-Math.PI/2;
    patch.rotation.z=.3+Math.sin(i)*.35;
    patch.position.set(p[0],terrainHeight(p[0],p[1])+.038,p[1]);
    patch.receiveShadow=true;
    group.add(patch);
  });
}

function createWoodMaterial(){
  return new THREE.MeshStandardMaterial({color:0x5d3820,roughness:.90,metalness:0});
}
function createDarkWoodMaterial(){
  return new THREE.MeshStandardMaterial({color:0x2f2118,roughness:.95,metalness:0});
}

function createPremiumCampfire(){
  const g=new THREE.Group();
  g.userData.kind="premiumFire";

  const stoneMat=new THREE.MeshStandardMaterial({color:0x6f7470,roughness:.94});
  for(let i=0;i<12;i++){
    const a=i/12*Math.PI*2;
    const s=new THREE.Mesh(new THREE.DodecahedronGeometry(.14+(i%3)*.015,1),stoneMat);
    s.scale.y=.72;
    s.position.set(Math.cos(a)*.53,.10,Math.sin(a)*.53);
    s.rotation.set(i*.17,i*.71,i*.08);
    s.castShadow=true;s.receiveShadow=true;g.add(s);
  }

  const wood=createWoodMaterial();
  for(const rot of [-.58,.58,0]){
    const log=new THREE.Mesh(new THREE.CylinderGeometry(.075,.095,.92,9),wood);
    log.rotation.z=Math.PI/2;log.rotation.y=rot;log.position.y=.16;log.castShadow=true;g.add(log);
  }

  const flameOuter=new THREE.Mesh(
    new THREE.ConeGeometry(.25,.78,12),
    new THREE.MeshBasicMaterial({color:0xff6b21,transparent:true,opacity:.82,depthWrite:false})
  );
  flameOuter.position.y=.58;g.add(flameOuter);

  const flameMid=new THREE.Mesh(
    new THREE.ConeGeometry(.16,.60,10),
    new THREE.MeshBasicMaterial({color:0xffa62b,transparent:true,opacity:.88,depthWrite:false})
  );
  flameMid.position.y=.50;g.add(flameMid);

  const flameInner=new THREE.Mesh(
    new THREE.ConeGeometry(.08,.38,8),
    new THREE.MeshBasicMaterial({color:0xffe16b,transparent:true,opacity:.95,depthWrite:false})
  );
  flameInner.position.y=.41;g.add(flameInner);

  const light=new THREE.PointLight(0xffa044,2.8,10,2);
  light.position.y=.9;g.add(light);

  const smokeMat=new THREE.MeshBasicMaterial({color:0x74776f,transparent:true,opacity:.18,depthWrite:false});
  const smoke=[];
  for(let i=0;i<7;i++){
    const puff=new THREE.Mesh(new THREE.SphereGeometry(.10+i*.018,10,8),smokeMat.clone());
    puff.position.set((seeded(i*9)-.5)*.18,.85+i*.23,(seeded(i*13)-.5)*.18);
    g.add(puff);smoke.push(puff);
  }

  g.userData.flames=[flameOuter,flameMid,flameInner];
  g.userData.light=light;
  g.userData.smoke=smoke;
  return g;
}

function createCrate(){
  const g=new THREE.Group();
  const wood=createWoodMaterial(),dark=createDarkWoodMaterial();
  const base=new THREE.Mesh(new THREE.BoxGeometry(.86,.70,.74),wood);
  base.position.y=.35;base.castShadow=true;base.receiveShadow=true;g.add(base);
  for(const x of [-.34,.34]){
    const b=new THREE.Mesh(new THREE.BoxGeometry(.08,.74,.78),dark);b.position.set(x,.36,0);g.add(b);
  }
  for(const y of [.10,.60]){
    const b=new THREE.Mesh(new THREE.BoxGeometry(.90,.08,.78),dark);b.position.set(0,y,0);g.add(b);
  }
  return g;
}

function createBarrel(){
  const g=new THREE.Group();
  const wood=createWoodMaterial();
  const metal=new THREE.MeshStandardMaterial({color:0x4d4c43,roughness:.55,metalness:.55});
  const body=new THREE.Mesh(new THREE.CylinderGeometry(.33,.31,.82,14),wood);
  body.position.y=.41;body.castShadow=true;body.receiveShadow=true;g.add(body);
  for(const y of [.16,.42,.68]){
    const band=new THREE.Mesh(new THREE.TorusGeometry(.325,.025,6,16),metal);
    band.rotation.x=Math.PI/2;band.position.y=y;g.add(band);
  }
  return g;
}

function createLogPile(){
  const g=new THREE.Group(),wood=createWoodMaterial();
  for(let i=0;i<7;i++){
    const log=new THREE.Mesh(new THREE.CylinderGeometry(.075,.085,1.18,8),wood);
    log.rotation.z=Math.PI/2;
    log.position.set((i%3-.8)*.23,.11+Math.floor(i/3)*.16,(i%2-.5)*.18);
    log.rotation.y=(i%2-.5)*.12;log.castShadow=true;g.add(log);
  }
  return g;
}

function createFernCluster(seed=1){
  const g=new THREE.Group();
  const mat=new THREE.MeshStandardMaterial({color:0x456f3e,roughness:.92,side:THREE.DoubleSide});
  for(let i=0;i<9;i++){
    const blade=new THREE.Mesh(new THREE.PlaneGeometry(.16,.75,1,3),mat);
    blade.geometry.translate(0,.375,0);
    blade.rotation.y=i/9*Math.PI*2+seed*.17;
    blade.rotation.z=(seeded(seed*13+i)-.5)*.42;
    blade.position.y=.02;
    g.add(blade);
  }
  g.userData.windPhase=seed*.73;
  return g;
}

function collectFoliage(model){
  const arr=[];
  model.traverse(o=>{
    const name=(o.name||"").toLowerCase();
    if(name.includes("foliage")||name.includes("needle")||name.includes("leaf")) {
      o.userData.baseRot={x:o.rotation.x,y:o.rotation.y,z:o.rotation.z};
      arr.push(o);
    }
  });
  model.userData.foliageNodes=arr;
}

export async function initPremiumZone(scene,world,renderer,terrainHeight,onProgress){
  const zone={
    group:new THREE.Group(),trees:[],rocks:[],plants:[],fires:[],ground:[],
    shelter:null,light:null
  };
  zone.group.name="V26_3_Premium_Spawn_Zone";
  scene.add(zone.group);

  const center={x:-8,z:8};
  removeLegacyZone(world,center.x,center.z,19);

  let oakP=0,pineP=0,rockP=0,shelterP=0;
  const report=(label)=>{
    const value=(oakP+pineP+rockP+shelterP)/4;
    onProgress?.(value,label);
  };

  const [oakBase,pineBase,rockBase,shelterBase]=await Promise.all([
    loadPremiumModel(ASSETS.oak,renderer,p=>{oakP=p;report("Chêne premium");}),
    loadPremiumModel(ASSETS.pine,renderer,p=>{pineP=p;report("Conifère premium");}),
    loadPremiumModel(ASSETS.rock,renderer,p=>{rockP=p;report("Pierre premium");}),
    loadPremiumModel(ASSETS.shelter,renderer,p=>{shelterP=p;report("Abri premium");})
  ]);
  onProgress?.(1,"Zone premium prête");

  // On ne masque l'ancien camp qu'une fois les nouveaux assets prêts.
  if(world.campGroup)world.campGroup.visible=false;
  if(world.campfire)world.campfire.visible=false;
  if(world.hut)world.hut.visible=false;

  const groundPatches=[
    [-8.2,8.0,4.9,3.8,0xb69a6b,.64,11],
    [-12.2,12.1,4.2,3.0,0xa98e63,.58,17],
    [-5.1,6.0,3.6,2.0,0xb79c70,.50,23],
    [-9.8,9.8,6.5,4.7,0x6f7d50,.18,31]
  ];
  for(const [x,z,rx,rz,color,opacity,seed] of groundPatches){
    const patch=createGroundPatch(renderer,rx,rz,color,opacity,seed);
    patch.position.set(x,terrainHeight(x,z)+.030,z);
    patch.rotation.y=seed*.17;
    zone.group.add(patch);
    zone.ground.push(patch);
  }

  createPathPatches(zone.group,terrainHeight);

  const shelter=clonePremium(shelterBase);
  shelter.position.set(-13.3,terrainHeight(-13.3,13.0),13.0);
  shelter.rotation.y=.28;
  shelter.scale.setScalar(.98);
  zone.group.add(shelter);zone.shelter=shelter;

  const fire=createPremiumCampfire();
  fire.position.set(-8,terrainHeight(-8,8),8);
  zone.group.add(fire);zone.fires.push(fire);
  world.interactables.push({
    type:"campfire",object:fire,position:()=>fire.position,radius:2.1,label:"Utiliser le feu de camp"
  });

  const crate=createCrate();crate.position.set(-11.2,terrainHeight(-11.2,10.1),10.1);crate.rotation.y=.35;zone.group.add(crate);
  const barrel=createBarrel();barrel.position.set(-12.1,terrainHeight(-12.1,9.5),9.5);zone.group.add(barrel);
  const logs=createLogPile();logs.position.set(-5.7,terrainHeight(-5.7,9.1),9.1);logs.rotation.y=-.25;zone.group.add(logs);

  const treeSpots=[
    ["oak",-15.4,3.5,1.24,.10],
    ["oak",-2.2,11.3,1.06,-.58],
    ["oak",-10.6,16.6,1.02,.68],
    ["oak",3.2,8.8,.90,-.30],
    ["oak",-18.6,15.2,.92,.42],
    ["oak",5.0,15.5,.84,-.76],
    ["pine",2.3,2.0,1.08,-.35],
    ["pine",-17.6,8.8,.96,.48],
    ["pine",-4.0,17.2,.84,.18],
    ["pine",5.4,3.6,.82,.64],
    ["pine",-20.0,1.8,.88,-.18],
    ["pine",1.4,19.2,.78,.30]
  ];
  for(let i=0;i<treeSpots.length;i++){
    const [kind,x,z,s,r]=treeSpots[i];
    const tree=clonePremium(kind==="oak"?oakBase:pineBase);
    tree.position.set(x,terrainHeight(x,z),z);
    tree.scale.setScalar(s);
    tree.rotation.y=r;
    collectFoliage(tree);
    zone.group.add(tree);zone.trees.push(tree);
    addResource(world,tree,"tree",1.8,4,{yield:{wood:kind==="oak"?9:7}});
  }

  const rockSpots=[
    [-3.8,4.1,.98,.15],[-14.6,11.0,.76,.88],[-3.2,14.2,.65,-.42],[-10.2,3.0,.54,.28]
  ];
  for(const [x,z,s,r] of rockSpots){
    const rock=clonePremium(rockBase);
    rock.position.set(x,terrainHeight(x,z),z);
    rock.scale.setScalar(s);rock.rotation.y=r;
    zone.group.add(rock);zone.rocks.push(rock);
    addResource(world,rock,"rock",1.6,5);
  }

  // Sous-bois autour de la zone, en évitant le cœur du camp.
  for(let i=0;i<32;i++){
    const a=seeded(600+i*3)*Math.PI*2;
    const radius=8.2+seeded(800+i*5)*6.0;
    const x=center.x+Math.cos(a)*radius;
    const z=center.z+Math.sin(a)*radius;
    const fern=createFernCluster(i+1);
    const s=.55+seeded(1000+i*7)*.75;
    fern.scale.setScalar(s);
    fern.position.set(x,terrainHeight(x,z),z);
    fern.rotation.y=seeded(1200+i)*Math.PI*2;
    zone.group.add(fern);zone.plants.push(fern);
  }

  // Petites pierres, branches et feuilles mortes.
  const pebbleMat=new THREE.MeshStandardMaterial({color:0x7e8178,roughness:.97});
  const twigMat=createDarkWoodMaterial();
  for(let i=0;i<48;i++){
    const a=seeded(1400+i)*Math.PI*2;
    const radius=2.8+seeded(1500+i*3)*10.5;
    const x=center.x+Math.cos(a)*radius,z=center.z+Math.sin(a)*radius;
    if(i%3===0){
      const twig=new THREE.Mesh(new THREE.CylinderGeometry(.018,.028,.42+seeded(i)*.35,6),twigMat);
      twig.rotation.z=Math.PI/2;twig.rotation.y=a+.4;
      twig.position.set(x,terrainHeight(x,z)+.025,z);zone.group.add(twig);
    }else{
      const stone=new THREE.Mesh(new THREE.DodecahedronGeometry(.07+seeded(i*9)*.08,0),pebbleMat);
      stone.scale.y=.55;
      stone.position.set(x,terrainHeight(x,z)+.025,z);stone.rotation.y=a;zone.group.add(stone);
    }
  }

  const warmFill=new THREE.PointLight(0xffc780,.55,18,2);
  warmFill.position.set(-9,5.0,9);
  zone.group.add(warmFill);zone.light=warmFill;

  return zone;
}

export function updatePremiumZone(zone,time){
  if(!zone)return;

  for(let i=0;i<zone.trees.length;i++){
    const tree=zone.trees[i];
    const foliage=tree.userData.foliageNodes||[];
    for(let j=0;j<foliage.length;j++){
      const node=foliage[j],base=node.userData.baseRot||{x:0,y:0,z:0};
      const gust=.55+.45*Math.sin(time*.18+i);
      node.rotation.z=base.z+Math.sin(time*(.72+j*.018)+i*1.7+j*.24)*.015*gust;
      node.rotation.x=base.x+Math.cos(time*(.59+j*.016)+i+j*.13)*.007*gust;
    }
  }

  for(let i=0;i<zone.plants.length;i++){
    const p=zone.plants[i],phase=p.userData.windPhase||0;
    p.rotation.z=Math.sin(time*1.1+phase)*.025;
    p.rotation.x=Math.cos(time*.88+phase)*.010;
  }

  for(const fire of zone.fires){
    const flames=fire.userData.flames||[];
    for(let i=0;i<flames.length;i++){
      flames[i].scale.y=.82+Math.sin(time*(8+i*1.8)+i)*.18;
      flames[i].rotation.y=time*(1.4+i*.45);
    }
    if(fire.userData.light)fire.userData.light.intensity=2.5+Math.sin(time*9)*.28+Math.sin(time*15)*.13;

    const smoke=fire.userData.smoke||[];
    for(let i=0;i<smoke.length;i++){
      const p=smoke[i],loop=(time*.24+i*.13)%1;
      p.position.y=.82+loop*2.0;
      p.position.x=Math.sin(time*.8+i)*.08+loop*.08;
      p.position.z=Math.cos(time*.65+i*.7)*.07;
      const s=.65+loop*.95;p.scale.setScalar(s);
      p.material.opacity=(1-loop)*.12;
    }
  }
}
