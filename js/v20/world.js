import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.169.0/build/three.module.js";
import {
  createTree, createPine, createBush, createRockCluster, createCampfire,
  createChest, createSkeleton, createHorse, createFarmPlot, createDeer,
  createStoneWall, createStoneTower, createPalisade, updateFarmVisual
} from "./models.js?v=22";

const WORLD_SIZE=116;
const HALF=WORLD_SIZE/2;
const SEASON_COLORS=[
  {ground:0x61794b,light:0x80965a,leaf:0x3f743d,fog:0x9eb38d,sky:0xa9bf9d},
  {ground:0x6d7d47,light:0x9aa35d,leaf:0x356838,fog:0xb6b28a,sky:0xb9b78d},
  {ground:0x7c7546,light:0xa58b4d,leaf:0xa45131,fog:0xa88668,sky:0xa98a70},
  {ground:0x79847b,light:0xaeb5aa,leaf:0x58665a,fog:0xaab8bd,sky:0x9eafb6}
];

function seeded(n){
  const x=Math.sin(n*12.9898+78.233)*43758.5453;
  return x-Math.floor(x);
}
function randRange(seed,a,b){return a+(b-a)*seeded(seed);}
function riverX(z){return 30+Math.sin(z*.055)*7+Math.sin(z*.018)*4;}

export function terrainHeight(x,z){
  let h=.22*Math.sin(x*.12)+.25*Math.cos(z*.11)+.16*Math.sin((x+z)*.08);
  h+=.75*Math.sin(x*.026)*Math.cos(z*.029);
  h+=Math.max(0,(Math.abs(x)-42)/16)*1.8;
  h+=Math.max(0,(Math.abs(z)-44)/14)*1.4;
  const d=Math.abs(x-riverX(z));
  if(d<7.5)h-=1.0*(1-d/7.5);
  return h;
}
export function getRiverX(z){return riverX(z);}

function addShadowFlags(obj,cast=true,receive=true){
  obj.traverse(o=>{if(o.isMesh){o.castShadow=cast;o.receiveShadow=receive;}});
}

function createGroundTextures(){
  const size=512;
  const colorCanvas=document.createElement("canvas");
  const bumpCanvas=document.createElement("canvas");
  colorCanvas.width=colorCanvas.height=size;
  bumpCanvas.width=bumpCanvas.height=size;
  const c=colorCanvas.getContext("2d");
  const b=bumpCanvas.getContext("2d");

  let seed=192837;
  const rand=()=>{
    seed=(seed*1664525+1013904223)>>>0;
    return seed/4294967296;
  };

  const img=c.createImageData(size,size);
  const bumpImg=b.createImageData(size,size);

  for(let i=0;i<img.data.length;i+=4){
    const n=(rand()+rand()+rand()+rand())/4;
    const v=175+Math.floor(n*70);
    img.data[i]=v-7;
    img.data[i+1]=v;
    img.data[i+2]=v-12;
    img.data[i+3]=255;

    const bv=118+Math.floor(n*116);
    bumpImg.data[i]=bv;
    bumpImg.data[i+1]=bv;
    bumpImg.data[i+2]=bv;
    bumpImg.data[i+3]=255;
  }
  c.putImageData(img,0,0);
  b.putImageData(bumpImg,0,0);

  for(let i=0;i<78;i++){
    const x=rand()*size,y=rand()*size,rx=8+rand()*38,ry=5+rand()*24;
    c.fillStyle="rgba("+(90+Math.floor(rand()*35))+","+(82+Math.floor(rand()*32))+","+(64+Math.floor(rand()*24))+","+(0.035+rand()*.07)+")";
    c.beginPath();c.ellipse(x,y,rx,ry,rand()*Math.PI,0,Math.PI*2);c.fill();
  }

  for(let i=0;i<120;i++){
    const x=rand()*size,y=rand()*size;
    c.fillStyle="rgba(52,64,42,"+(0.05+rand()*.08)+")";
    c.beginPath();c.arc(x,y,1+rand()*2.6,0,Math.PI*2);c.fill();
  }

  const map=new THREE.CanvasTexture(colorCanvas);
  map.wrapS=map.wrapT=THREE.RepeatWrapping;
  map.repeat.set(9,9);
  map.colorSpace=THREE.SRGBColorSpace;

  const bump=new THREE.CanvasTexture(bumpCanvas);
  bump.wrapS=bump.wrapT=THREE.RepeatWrapping;
  bump.repeat.set(9,9);
  bump.colorSpace=THREE.NoColorSpace;

  return {map,bump};
}

function createGroundScatter(){
  const group=new THREE.Group();

  const pebbleGeo=new THREE.DodecahedronGeometry(.10,0);
  const pebbleMat=new THREE.MeshStandardMaterial({color:0x777b72,roughness:.96});
  const pebbles=new THREE.InstancedMesh(pebbleGeo,pebbleMat,260);
  pebbles.castShadow=false;pebbles.receiveShadow=true;

  const leafGeo=new THREE.PlaneGeometry(.16,.09);
  leafGeo.rotateX(-Math.PI/2);
  const leafMat=new THREE.MeshStandardMaterial({color:0x6e6036,roughness:1,side:THREE.DoubleSide});
  const leaves=new THREE.InstancedMesh(leafGeo,leafMat,300);
  leaves.castShadow=false;leaves.receiveShadow=true;

  const dummy=new THREE.Object3D();
  let pn=0,ln=0;

  for(let i=0;i<900&&(pn<260||ln<300);i++){
    const x=randRange(2100+i*2.7,-HALF+2,HALF-2);
    const z=randRange(2600+i*5.3,-HALF+2,HALF-2);
    if(Math.abs(x-riverX(z))<6.4)continue;
    if(Math.hypot(x+8,z-8)<5.2)continue;

    const y=terrainHeight(x,z)+.025;
    const r=seeded(i*11.7);

    if(r<.46&&pn<260){
      dummy.position.set(x,y,z);
      dummy.rotation.set(seeded(i*6.2)*.5,seeded(i*9.1)*Math.PI*2,seeded(i*7.6)*.4);
      const s=.45+seeded(i*4.4)*1.1;
      dummy.scale.set(s,.45+s*.18,s*.82);
      dummy.updateMatrix();
      pebbles.setMatrixAt(pn++,dummy.matrix);
    }else if(ln<300){
      dummy.position.set(x,y+.012,z);
      dummy.rotation.set(0,seeded(i*8.8)*Math.PI*2,0);
      const s=.65+seeded(i*3.1)*.85;
      dummy.scale.set(s,s,s);
      dummy.updateMatrix();
      leaves.setMatrixAt(ln++,dummy.matrix);
    }
  }

  pebbles.count=pn;leaves.count=ln;
  pebbles.instanceMatrix.needsUpdate=true;leaves.instanceMatrix.needsUpdate=true;
  group.add(pebbles,leaves);
  return group;
}

function createGrassMaterial(){
  const m=new THREE.MeshStandardMaterial({color:0x5f8247,roughness:.95,side:THREE.DoubleSide});
  m.onBeforeCompile=shader=>{
    shader.uniforms.uTime={value:0};
    m.userData.shader=shader;
    shader.vertexShader=shader.vertexShader
      .replace("#include <common>","#include <common>\nuniform float uTime;")
      .replace("#include <begin_vertex>","#include <begin_vertex>\n#ifdef USE_INSTANCING\nfloat gust=sin(uTime*1.55 + instanceMatrix[3].x*.28 + instanceMatrix[3].z*.22 + position.y*3.0);\ntransformed.x += gust*.055*(position.y+.25);\n#endif");
  };
  return m;
}

function createTerrain(){
  const geo=new THREE.PlaneGeometry(WORLD_SIZE,WORLD_SIZE,70,70);
  geo.rotateX(-Math.PI/2);
  const pos=geo.attributes.position;
  const colors=[];
  const c1=new THREE.Color(0x5e7648),c2=new THREE.Color(0x829358),soil=new THREE.Color(0x81694b);
  for(let i=0;i<pos.count;i++){
    const x=pos.getX(i), z=pos.getZ(i), y=terrainHeight(x,z);
    pos.setY(i,y);
    const n=seeded(i*1.73);
    const river=Math.abs(x-riverX(z));
    const col=river<8?soil.clone().lerp(c1,.45):c1.clone().lerp(c2,n*.42);
    if(y>1.8)col.lerp(new THREE.Color(0x78806d),.35);
    colors.push(col.r,col.g,col.b);
  }
  geo.setAttribute("color",new THREE.Float32BufferAttribute(colors,3));
  geo.computeVertexNormals();

  const textures=createGroundTextures();
  const m=new THREE.MeshStandardMaterial({
    vertexColors:true,
    map:textures.map,
    bumpMap:textures.bump,
    bumpScale:.16,
    roughnessMap:textures.bump,
    roughness:.94,
    metalness:0
  });

  const terrain=new THREE.Mesh(geo,m);
  terrain.receiveShadow=true;
  terrain.userData.surfaceTextures=textures;
  return terrain;
}

function createRiver(){
  const samples=90,width=4.9,verts=[],indices=[];
  for(let i=0;i<samples;i++){
    const t=i/(samples-1); const z=-HALF+t*WORLD_SIZE; const x=riverX(z);
    const nextZ=Math.min(HALF,z+.2), nextX=riverX(nextZ);
    const tx=nextX-x,tz=nextZ-z; const len=Math.hypot(tx,tz)||1;
    const nx=-tz/len,nz=tx/len;
    const y=-.53+.06*Math.sin(z*.05);
    verts.push(x+nx*width,y,z+nz*width,x-nx*width,y,z-nz*width);
    if(i<samples-1){const a=i*2,b=a+1,c=a+2,d=a+3;indices.push(a,b,c,b,d,c);}
  }
  const geo=new THREE.BufferGeometry();
  geo.setAttribute("position",new THREE.Float32BufferAttribute(verts,3));geo.setIndex(indices);geo.computeVertexNormals();
  const mat=new THREE.MeshPhysicalMaterial({color:0x2e7789,roughness:.20,metalness:.0,transmission:.06,transparent:true,opacity:.88,clearcoat:.35,clearcoatRoughness:.18});
  const water=new THREE.Mesh(geo,mat);water.receiveShadow=true;water.userData.baseY=0;return water;
}

function createBridge(){
  const g=new THREE.Group(); const z=0; const cx=riverX(z); const wood=new THREE.MeshStandardMaterial({color:0x6d472a,roughness:.88});
  for(let i=-7;i<=7;i++){
    const p=new THREE.Mesh(new THREE.BoxGeometry(.58,.13,2.15),wood);p.position.set(cx+i*.55,.02,z);p.castShadow=true;p.receiveShadow=true;g.add(p);
  }
  for(const side of [-1,1]){
    const rail=new THREE.Mesh(new THREE.BoxGeometry(8.2,.12,.12),wood);rail.position.set(cx,.72,z+side*1.03);g.add(rail);
    for(let i=-6;i<=6;i+=3){const post=new THREE.Mesh(new THREE.BoxGeometry(.13,.82,.13),wood);post.position.set(cx+i*.55,.38,z+side*1.03);g.add(post);}
  }
  g.position.y=.08;return g;
}

function createRuins(){
  const g=new THREE.Group();const stoneMats=[0x777970,0x8b8b80,0x666a63];
  function block(x,y,z,sx,sy,sz,i=0){const b=new THREE.Mesh(new THREE.BoxGeometry(sx,sy,sz),new THREE.MeshStandardMaterial({color:stoneMats[i%3],roughness:.96}));b.position.set(x,y,z);b.castShadow=true;b.receiveShadow=true;g.add(b);}
  for(let i=0;i<7;i++)block(-3+i*.85,.34,0,.82,.68,.72,i);
  for(let y=1;y<4;y++)for(let i=0;i<7;i++){if((i===2||i===3)&&y<3)continue;if(y===3&&i>4)continue;block(-3+i*.85,.34+y*.64,0,.82,.62,.72,i+y);}
  for(let i=0;i<5;i++)block(-3,.34,1+i*.78,.72,.68,.75,i);
  for(let y=1;y<3;y++)for(let i=0;i<5;i++){if(i===3&&y===2)continue;block(-3,.34+y*.64,1+i*.78,.72,.62,.75,i+y);}
  const columnGeo=new THREE.CylinderGeometry(.31,.38,2.9,9);
  for(const p of [[2.8,1.45,2.2],[-3.0,1.45,4.3],[3.2,1.45,-.3]]){const c=new THREE.Mesh(columnGeo,new THREE.MeshStandardMaterial({color:0x777970,roughness:.96}));c.position.set(...p);c.castShadow=true;g.add(c);}
  g.position.set(-34,terrainHeight(-34,-25),-25);
  return g;
}

function createCamp(){
  const g=new THREE.Group();
  const fire=createCampfire();fire.position.set(0,0,0);g.add(fire);
  const wood=new THREE.MeshStandardMaterial({color:0x6b4528,roughness:.92});
  for(const z of [-2.2,2.2]){const bench=new THREE.Mesh(new THREE.BoxGeometry(2.4,.22,.58),wood);bench.position.set(0,.36,z);bench.castShadow=true;g.add(bench);for(const x of [-.85,.85]){const leg=new THREE.Mesh(new THREE.BoxGeometry(.16,.55,.16),wood);leg.position.set(x,.18,z);g.add(leg);}}
  const rack=new THREE.Group();
  for(const x of [-1.25,1.25]){const p=new THREE.Mesh(new THREE.CylinderGeometry(.06,.07,2.2,6),wood);p.position.set(x,1.1,0);rack.add(p);}
  const top=new THREE.Mesh(new THREE.CylinderGeometry(.05,.05,2.65,6),wood);top.rotation.z=Math.PI/2;top.position.y=2.05;rack.add(top);rack.position.set(-3,0,0);g.add(rack);
  const cauldron=new THREE.Mesh(new THREE.SphereGeometry(.42,12,8,0,Math.PI*2,Math.PI*.48,Math.PI*.52),new THREE.MeshStandardMaterial({color:0x2f302b,roughness:.5,metalness:.35}));cauldron.position.set(0,.65,0);g.add(cauldron);
  return {group:g,fire};
}

function createSmallHut(){
  const g=new THREE.Group();const wood=new THREE.MeshStandardMaterial({color:0x67442a,roughness:.92});const dark=new THREE.MeshStandardMaterial({color:0x3b2b1f,roughness:.96});
  const floor=new THREE.Mesh(new THREE.BoxGeometry(5.2,.25,4.1),wood);floor.position.y=.14;g.add(floor);
  for(const x of [-2.3,2.3])for(const z of [-1.75,1.75]){const post=new THREE.Mesh(new THREE.BoxGeometry(.25,2.3,.25),dark);post.position.set(x,1.25,z);post.castShadow=true;g.add(post);}
  const back=new THREE.Mesh(new THREE.BoxGeometry(5.0,2.1,.18),wood);back.position.set(0,1.25,-1.9);g.add(back);
  const side1=new THREE.Mesh(new THREE.BoxGeometry(.18,2.1,3.8),wood);side1.position.set(-2.4,1.25,0);g.add(side1);
  const roof1=new THREE.Mesh(new THREE.BoxGeometry(5.7,.18,2.8),dark);roof1.position.set(0,2.55,-.95);roof1.rotation.x=.45;g.add(roof1);
  const roof2=roof1.clone();roof2.position.z=.95;roof2.rotation.x=-.45;g.add(roof2);
  addShadowFlags(g,true,true);return g;
}

function createGrassField(){
  const geo=new THREE.BoxGeometry(.045,.48,.026);
  geo.translate(0,.24,0);
  const material=createGrassMaterial();
  const count=1280;const inst=new THREE.InstancedMesh(geo,material,count);inst.castShadow=false;inst.receiveShadow=true;
  const dummy=new THREE.Object3D();let n=0;
  for(let i=0;i<count*2&&n<count;i++){
    const x=randRange(i*2.1,-HALF+2,HALF-2),z=randRange(i*4.7+8,-HALF+2,HALF-2);
    if(Math.abs(x-riverX(z))<7)continue;
    if(Math.hypot(x+8,z-8)<9||Math.hypot(x+34,z+25)<10||Math.hypot(x-13,z-24)<7)continue;
    const y=terrainHeight(x,z);
    dummy.position.set(x,y,z);dummy.rotation.y=seeded(i*9.2)*Math.PI;dummy.rotation.z=(seeded(i*7.1)-.5)*.20;const s=.65+seeded(i*3.3)*.9;dummy.scale.set(s,s,s);dummy.updateMatrix();inst.setMatrixAt(n++,dummy.matrix);
  }
  inst.count=n;inst.instanceMatrix.needsUpdate=true;return {mesh:inst,material};
}

function createSnowParticles(){
  const count=650,arr=new Float32Array(count*3);
  for(let i=0;i<count;i++){arr[i*3]=randRange(i*2,-HALF,HALF);arr[i*3+1]=randRange(i*3+1,2,22);arr[i*3+2]=randRange(i*5+4,-HALF,HALF);}
  const geo=new THREE.BufferGeometry();geo.setAttribute("position",new THREE.BufferAttribute(arr,3));
  const mat=new THREE.PointsMaterial({color:0xf2f5f2,size:.10,transparent:true,opacity:.75,depthWrite:false});
  const p=new THREE.Points(geo,mat);p.visible=false;return p;
}

export function createWorld(scene){
  const world={
    scene,interactables:[],colliders:[],animated:[],buildings:[],enemies:[],ambientAnimals:[],
    season:0,seasonables:[],treeGroups:[],bushGroups:[],terrain:null,water:null,grass:null,snow:null,
    horse:null,farm:null,chest:null,campfire:null,ruins:null,snowGround:null,groundScatter:null
  };

  world.terrain=createTerrain();scene.add(world.terrain);
  world.groundScatter=createGroundScatter();scene.add(world.groundScatter);
  world.snowGround=new THREE.Mesh(
    world.terrain.geometry.clone(),
    new THREE.MeshStandardMaterial({color:0xe1e7e2,roughness:.98,transparent:true,opacity:.64,polygonOffset:true,polygonOffsetFactor:-1})
  );
  world.snowGround.position.y=.035;
  world.snowGround.receiveShadow=true;
  world.snowGround.visible=false;
  scene.add(world.snowGround);

  world.water=createRiver();scene.add(world.water);
  const bridge=createBridge();scene.add(bridge);

  // Cascade et chaos rocheux dans le secteur nord-est, comme sur la référence.
  const waterfallZ=-46, waterfallX=riverX(waterfallZ);
  const fallGroup=new THREE.Group();
  const cliffMat=new THREE.MeshStandardMaterial({color:0x737b77,roughness:.96});
  for(let i=0;i<14;i++){
    const a=i/14*Math.PI*2;
    const r=new THREE.Mesh(new THREE.DodecahedronGeometry(.8+seeded(i+210)*.75,0),cliffMat);
    r.scale.set(1,.9+seeded(i+240)*.7,1);
    r.position.set(Math.cos(a)*3.5,1.0+seeded(i+260)*1.9,Math.sin(a)*2.2);
    r.rotation.set(seeded(i+280),seeded(i+300)*3,seeded(i+320));
    r.castShadow=true;r.receiveShadow=true;fallGroup.add(r);
  }
  const fallMat=new THREE.MeshPhysicalMaterial({color:0x7fc6d0,transparent:true,opacity:.76,roughness:.15,transmission:.12,side:THREE.DoubleSide});
  const fall=new THREE.Mesh(new THREE.PlaneGeometry(4.8,4.2,10,12),fallMat);
  fall.position.set(0,2.0,0);fall.rotation.y=Math.PI/2;fallGroup.add(fall);
  fallGroup.position.set(waterfallX,terrainHeight(waterfallX,waterfallZ)-.4,waterfallZ);
  scene.add(fallGroup);
  world.animated.push({userData:{kind:"waterfall",windPhase:0},rotation:fallGroup.rotation});

  const camp=createCamp();camp.group.position.set(-8,terrainHeight(-8,8),8);scene.add(camp.group);world.campfire=camp.fire;
  world.interactables.push({type:"campfire",object:camp.fire,position:()=>new THREE.Vector3(-8,terrainHeight(-8,8),8),radius:2.1,label:"Utiliser le feu de camp"});

  const hut=createSmallHut();hut.position.set(-14,terrainHeight(-14,14),14);hut.rotation.y=.24;scene.add(hut);

  world.ruins=createRuins();scene.add(world.ruins);

  const chest=createChest();chest.position.set(-35.5,terrainHeight(-35.5,-23.5),-23.5);scene.add(chest);world.chest=chest;
  world.interactables.push({type:"chest",object:chest,position:()=>chest.position,radius:1.7,label:"Fouiller le coffre des ruines"});

  const sk=createSkeleton();sk.position.set(-31,terrainHeight(-31,-28),-28);scene.add(sk);world.enemies.push(sk);world.interactables.push({type:"skeleton",object:sk,position:()=>sk.position,radius:2.0,label:"Attaquer le squelette"});

  const horse=createHorse();horse.position.set(9,terrainHeight(9,-11),-11);horse.rotation.y=-.6;scene.add(horse);world.horse=horse;
  world.interactables.push({type:"horse",object:horse,position:()=>horse.position,radius:2.2,label:"Approcher le cheval"});

  const farm=createFarmPlot();farm.position.set(13,terrainHeight(13,23),23);scene.add(farm);world.farm=farm;
  world.interactables.push({type:"farm",object:farm,position:()=>farm.position,radius:2.6,label:"Cultiver la parcelle"});

  for(let i=0;i<4;i++){const deer=createDeer();const x=-18+i*6,z=-10-i*3;deer.position.set(x,terrainHeight(x,z),z);deer.rotation.y=i*.8;scene.add(deer);world.ambientAnimals.push(deer);}

  let seed=20;
  for(let i=0;i<58;i++){
    let x,z,tries=0;
    do{x=randRange(seed++,-HALF+3,HALF-3);z=randRange(seed++,-HALF+3,HALF-3);tries++;}while(tries<20&&(Math.abs(x-riverX(z))<8||Math.hypot(x+8,z-8)<11||Math.hypot(x+34,z+25)<11||Math.hypot(x-13,z-23)<7));
    const variant=Math.floor(seeded(seed++)*4);const tree=variant===1||variant===3?createPine(variant,0):createTree(variant,0);
    const s=.85+seeded(seed++)*.55;tree.scale.setScalar(s);tree.position.set(x,terrainHeight(x,z),z);tree.rotation.y=seeded(seed++)*Math.PI*2;scene.add(tree);
    world.treeGroups.push(tree);world.animated.push(tree);world.seasonables.push(tree);
    world.interactables.push({type:"tree",object:tree,position:()=>tree.position,radius:1.8,hits:0,maxHits:3,label:"Couper l'arbre",yield:{wood:6}});
    world.colliders.push({object:tree,radius:.55*s,active:true});
  }

  for(let i=0;i<66;i++){
    let x=randRange(500+i*2,-HALF+2,HALF-2),z=randRange(800+i*5,-HALF+2,HALF-2);
    if(Math.abs(x-riverX(z))<5.5||Math.hypot(x+8,z-8)<6)continue;
    const berries=i%8===0;const bush=createBush(i%4,0,berries);const s=.70+seeded(i*4.3)*.72;bush.scale.setScalar(s);bush.position.set(x,terrainHeight(x,z),z);scene.add(bush);world.bushGroups.push(bush);world.animated.push(bush);world.seasonables.push(bush);
    if(berries)world.interactables.push({type:"berries",object:bush,position:()=>bush.position,radius:1.4,label:"Cueillir les baies",cooldown:0});
  }

  for(let i=0;i<24;i++){
    let x=randRange(1000+i*2,-HALF+3,HALF-3),z=randRange(1200+i*4,-HALF+3,HALF-3);
    if(Math.abs(x-riverX(z))<6||Math.hypot(x+8,z-8)<7)continue;
    const oreRoll=seeded(i*8.1),kind=oreRoll>.82?"gold":oreRoll>.62?"copper":oreRoll>.48?"tin":oreRoll>.35?"iron":"rock";
    const r=createRockCluster(kind,i%4,0);const s=.85+seeded(i*11.2)*.55;r.scale.setScalar(s);r.position.set(x,terrainHeight(x,z),z);r.rotation.y=seeded(i*5)*Math.PI;scene.add(r);
    world.interactables.push({type:kind==="rock"?"rock":"ore",oreKind:kind,object:r,position:()=>r.position,radius:1.7,hits:0,maxHits:kind==="rock"?4:5,label:kind==="rock"?"Casser le rocher":"Extraire le minerai"});
    world.colliders.push({object:r,radius:.62*s,active:true});
  }

  const grass=createGrassField();scene.add(grass.mesh);world.grass=grass;

  world.snow=createSnowParticles();scene.add(world.snow);

  const pathMat=new THREE.MeshStandardMaterial({color:0x8b806b,roughness:1});
  for(let i=0;i<34;i++){
    const t=i/33, x=-20+t*40, z=5+Math.sin(t*5)*3;
    const p=new THREE.Mesh(new THREE.DodecahedronGeometry(.25+seeded(i)*.18,0),pathMat);
    p.scale.y=.28;p.position.set(x,terrainHeight(x,z)+.04,z);p.rotation.y=seeded(i+90)*6.28;p.receiveShadow=true;scene.add(p);
  }

  return world;
}

export function setWorldSeason(world,index){
  world.season=index;
  const c=SEASON_COLORS[index];
  world.scene.fog.color.set(c.fog);
  world.terrain.material.vertexColors=true;
  world.terrain.material.color.set(index===0?0xffffff:index===1?0xf3ebc7:index===2?0xd5b77b:0xdce6e7);
  world.terrain.material.needsUpdate=true;
  if(world.grass?.material)world.grass.material.color.set(index===2?0x8a7037:index===3?0x879287:0x5f8247);
  world.snow.visible=index===3;
  if(world.snowGround)world.snowGround.visible=index===3;

  const autumn=new THREE.Color(0xb85d30), winter=new THREE.Color(0x78857b), summer=new THREE.Color(0x35683a);
  for(const item of [...world.treeGroups,...world.bushGroups]){
    const crown=item.userData.crown;
    if(!crown)continue;
    crown.traverse(o=>{
      if(!o.isMesh||!o.material?.color)return;
      // Les matériaux d'écorce/roche ont une map texturée : on ne les recolore pas comme des feuilles.
      if(o.material.map)return;
      if(!o.userData.baseSeasonColor)o.userData.baseSeasonColor=o.material.color.clone();
      const base=o.userData.baseSeasonColor;
      o.material.color.copy(base);
      const hex=base.getHex();
      if(hex>0xd0d0d0)return;
      if(index===1)o.material.color.lerp(summer,.20);
      else if(index===2)o.material.color.lerp(autumn,o.geometry?.type==="ConeGeometry"?.12:.70);
      else if(index===3)o.material.color.lerp(winter,o.geometry?.type==="ConeGeometry"?.22:.60);
    });
  }
}

export function updateWorld(world,dt,time,playerPos){
  if(world.grass?.material?.userData.shader)world.grass.material.userData.shader.uniforms.uTime.value=time;

  for(const it of world.interactables){
    const obj=it.object;
    if(!obj||!obj.userData?.baseImpactScale)continue;

    if((obj.userData.hitPulse||0)>0){
      obj.userData.hitPulse=Math.max(0,obj.userData.hitPulse-dt*5.5);
      const pulse=Math.sin((1-obj.userData.hitPulse)*Math.PI*3.2)*obj.userData.hitPulse;
      const b=obj.userData.baseImpactScale;
      obj.scale.set(
        b.x*(1+pulse*.035),
        b.y*(1-pulse*.022),
        b.z*(1+pulse*.035)
      );
    }else{
      obj.scale.copy(obj.userData.baseImpactScale);
    }
  }

  for(const o of world.animated){
    const phase=o.userData?.windPhase||0;
    if(o.userData?.kind==="waterfall")continue;
    const amount=o.userData?.kind==="bush"?.018:.010;
    if(o.rotation){
      o.rotation.z=Math.sin(time*.85+phase)*amount;
      o.rotation.x=Math.cos(time*.72+phase)*amount*.38;
    }
  }

  if(world.campfire){
    const f=world.campfire.userData.flame,inner=world.campfire.userData.inner,l=world.campfire.userData.light;
    if(f){f.scale.y=.88+Math.sin(time*8)*.18;f.rotation.y=time*2.2;}
    if(inner)inner.scale.y=.9+Math.sin(time*10+1)*.16;
    if(l)l.intensity=2.0+Math.sin(time*9)*.25+Math.sin(time*15)*.12;
  }

  if(world.water){
    world.water.position.y=Math.sin(time*.75)*.018;
    world.water.material.opacity=.83+Math.sin(time*.55)*.03;
  }

  if(world.snow?.visible){
    const a=world.snow.geometry.attributes.position.array;
    for(let i=0;i<a.length;i+=3){a[i]+=.006*Math.sin(time+a[i+2]);a[i+1]-=dt*1.25;if(a[i+1]<-1)a[i+1]=20;}
    world.snow.geometry.attributes.position.needsUpdate=true;
  }

  for(let i=0;i<world.ambientAnimals.length;i++){
    const d=world.ambientAnimals[i];const a=time*.08+i*1.7;const baseX=-18+i*6,baseZ=-10-i*3;
    d.position.x=baseX+Math.sin(a)*2.2;d.position.z=baseZ+Math.cos(a*.83)*1.8;d.position.y=terrainHeight(d.position.x,d.position.z);
    d.rotation.y=Math.atan2(Math.cos(a)*2.2,-Math.sin(a*.83)*1.8);
  }

  if(world.farm?.userData.planted){
    const elapsed=(performance.now()-world.farm.userData.plantedAt)/1000;
    const stage=elapsed>28?3:elapsed>14?2:1;
    if(world.farm.userData.stage!==stage){world.farm.userData.stage=stage;world.farm.userData.ready=stage===3;updateFarmVisual(world.farm,stage);}
  }

  for(const sk of world.enemies){
    if(!sk.visible||sk.userData.hp<=0)continue;
    sk.userData.cooldown=Math.max(0,(sk.userData.cooldown||0)-dt);
    const dx=playerPos.x-sk.position.x,dz=playerPos.z-sk.position.z,dist=Math.hypot(dx,dz);
    if(dist<13&&dist>1.55){
      const sp=.78*dt;sk.position.x+=dx/dist*sp;sk.position.z+=dz/dist*sp;sk.position.y=terrainHeight(sk.position.x,sk.position.z);sk.rotation.y=Math.atan2(dx,dz);
    }
  }
}

export function createBuildObject(type){
  if(type==="stone_wall")return createStoneWall();
  if(type==="stone_tower")return createStoneTower();
  return createPalisade();
}
