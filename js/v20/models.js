import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.169.0/build/three.module.js";

function mat(color, roughness=.86, metalness=.02) {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness });
}
function mesh(geo, material, cast=true, receive=true) {
  const m = new THREE.Mesh(geo, material);
  m.castShadow = cast;
  m.receiveShadow = receive;
  return m;
}
function cyl(r1,r2,h,segments,color) {
  return mesh(new THREE.CylinderGeometry(r1,r2,h,segments), mat(color));
}
function box(x,y,z,color) {
  return mesh(new THREE.BoxGeometry(x,y,z), mat(color));
}
function sphere(r,color,scale=[1,1,1],detail=1) {
  const s=mesh(new THREE.IcosahedronGeometry(r,detail),mat(color));
  s.scale.set(...scale);
  return s;
}

const surfaceCache=new Map();

function makeSurfaceTexture(kind){
  if(surfaceCache.has(kind))return surfaceCache.get(kind);

  const size=256;
  const canvas=document.createElement("canvas");
  canvas.width=size;canvas.height=size;
  const ctx=canvas.getContext("2d");
  ctx.fillStyle="#c8c8c8";
  ctx.fillRect(0,0,size,size);

  let seed=kind==="bark"?771:kind==="stone"?993:517;
  const rand=()=>{
    seed=(seed*1664525+1013904223)>>>0;
    return seed/4294967296;
  };

  if(kind==="bark"){
    ctx.fillStyle="#a7a7a7";
    ctx.fillRect(0,0,size,size);
    for(let i=0;i<68;i++){
      const x=rand()*size;
      const w=2+rand()*7;
      const shade=75+Math.floor(rand()*85);
      ctx.fillStyle="rgb("+shade+","+shade+","+shade+")";
      ctx.beginPath();
      ctx.moveTo(x,0);
      ctx.bezierCurveTo(x+rand()*10-5,70,x+rand()*14-7,170,x+rand()*10-5,size);
      ctx.lineWidth=w;
      ctx.strokeStyle=ctx.fillStyle;
      ctx.stroke();
    }
    for(let i=0;i<45;i++){
      const y=rand()*size;
      ctx.strokeStyle="rgba(235,235,235,"+(0.08+rand()*.12)+")";
      ctx.lineWidth=1+rand()*2;
      ctx.beginPath();ctx.moveTo(rand()*size*.25,y);ctx.lineTo(size*(.55+rand()*.4),y+rand()*9-4);ctx.stroke();
    }
  }else if(kind==="stone"){
    const img=ctx.createImageData(size,size);
    for(let i=0;i<img.data.length;i+=4){
      const n=(rand()+rand()+rand())/3;
      const v=Math.floor(118+n*92);
      img.data[i]=v;img.data[i+1]=v;img.data[i+2]=v;img.data[i+3]=255;
    }
    ctx.putImageData(img,0,0);
    for(let i=0;i<34;i++){
      const x=rand()*size,y=rand()*size,r=4+rand()*19;
      const g=ctx.createRadialGradient(x,y,0,x,y,r);
      g.addColorStop(0,"rgba(70,70,70,.28)");
      g.addColorStop(1,"rgba(220,220,220,0)");
      ctx.fillStyle=g;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();
    }
  }else{
    const img=ctx.createImageData(size,size);
    for(let i=0;i<img.data.length;i+=4){
      const n=(rand()+rand()+rand()+rand())/4;
      const v=Math.floor(140+n*90);
      img.data[i]=v;img.data[i+1]=v;img.data[i+2]=v;img.data[i+3]=255;
    }
    ctx.putImageData(img,0,0);
  }

  const map=new THREE.CanvasTexture(canvas);
  map.wrapS=map.wrapT=THREE.RepeatWrapping;
  map.repeat.set(kind==="bark"?1.5:2.4,kind==="bark"?4.5:2.4);
  map.colorSpace=THREE.SRGBColorSpace;

  const bump=map.clone();
  bump.colorSpace=THREE.NoColorSpace;

  const value={map,bump};
  surfaceCache.set(kind,value);
  return value;
}

function organicMaterial(kind,color,roughness=.92,metalness=.01){
  const tex=makeSurfaceTexture(kind);
  return new THREE.MeshStandardMaterial({
    color,
    roughness,
    metalness,
    map:tex.map,
    bumpMap:tex.bump,
    bumpScale:kind==="bark"?.12:kind==="stone"?.10:.06
  });
}

function leafMaterial(color){
  return new THREE.MeshStandardMaterial({
    color,
    roughness:.88,
    metalness:0,
    side:THREE.FrontSide
  });
}

function organicGeometry(seed=1,detail=1,strength=.12){
  const geo=new THREE.IcosahedronGeometry(1,detail);
  const p=geo.attributes.position;
  for(let i=0;i<p.count;i++){
    const x=p.getX(i),y=p.getY(i),z=p.getZ(i);
    const n=Math.sin((x*3.17+y*5.31+z*7.73+seed)*2.4)*.5+
      Math.sin((x*8.7-z*4.9+seed*.37))* .25;
    const f=1+n*strength;
    p.setXYZ(i,x*f,y*f,z*f);
  }
  geo.computeVertexNormals();
  return geo;
}

function branchBetween(a,b,rBase,rTip,material,segments=9){
  const dir=new THREE.Vector3().subVectors(b,a);
  const len=dir.length();
  const m=mesh(new THREE.CylinderGeometry(rTip,rBase,len,segments),material);
  m.position.copy(a).add(b).multiplyScalar(.5);
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),dir.normalize());
  return m;
}

let leafTextureCache=null;
function getLeafTexture(){
  if(leafTextureCache)return leafTextureCache;
  const canvas=document.createElement("canvas");
  canvas.width=96;canvas.height=64;
  const ctx=canvas.getContext("2d");
  ctx.clearRect(0,0,96,64);

  const grad=ctx.createLinearGradient(18,32,78,32);
  grad.addColorStop(0,"rgba(255,255,255,.04)");
  grad.addColorStop(.35,"rgba(255,255,255,.96)");
  grad.addColorStop(1,"rgba(255,255,255,.10)");
  ctx.fillStyle=grad;

  ctx.beginPath();
  ctx.moveTo(8,32);
  ctx.bezierCurveTo(24,9,62,8,88,31);
  ctx.bezierCurveTo(64,56,25,55,8,32);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle="rgba(255,255,255,.65)";
  ctx.lineWidth=2;
  ctx.beginPath();ctx.moveTo(14,32);ctx.lineTo(82,31);ctx.stroke();
  ctx.lineWidth=1;
  for(let i=0;i<5;i++){
    const x=25+i*11;
    ctx.beginPath();ctx.moveTo(x,31);ctx.lineTo(x-6,20+i%2*3);ctx.stroke();
    ctx.beginPath();ctx.moveTo(x,32);ctx.lineTo(x-5,43-i%2*2);ctx.stroke();
  }

  const tex=new THREE.CanvasTexture(canvas);
  tex.colorSpace=THREE.SRGBColorSpace;
  tex.wrapS=tex.wrapT=THREE.ClampToEdgeWrapping;
  leafTextureCache=tex;
  return tex;
}

function createLeafLayer(seed,color,count=26,spread=[.9,.52,.78],center=[0,0,0],scale=.22){
  const group=new THREE.Group();
  const geo=new THREE.PlaneGeometry(1.0,.58);
  const material=new THREE.MeshStandardMaterial({
    color,
    map:getLeafTexture(),
    transparent:true,
    alphaTest:.26,
    roughness:.90,
    metalness:0,
    side:THREE.DoubleSide,
    depthWrite:true
  });
  material.userData.isLeafCard=true;
  const inst=new THREE.InstancedMesh(geo,material,count);
  inst.castShadow=true;
  inst.receiveShadow=true;

  let s=seed>>>0;
  const rnd=()=>{
    s=(s*1664525+1013904223)>>>0;
    return s/4294967296;
  };
  const dummy=new THREE.Object3D();

  for(let i=0;i<count;i++){
    const a=rnd()*Math.PI*2;
    const r=Math.sqrt(rnd());
    const x=center[0]+Math.cos(a)*spread[0]*r;
    const y=center[1]+(rnd()-.5)*spread[1];
    const z=center[2]+Math.sin(a)*spread[2]*r;
    dummy.position.set(x,y,z);
    dummy.rotation.set(
      (rnd()-.5)*1.15,
      rnd()*Math.PI*2,
      (rnd()-.5)*1.0
    );
    const sc=scale*(.72+rnd()*.70);
    dummy.scale.set(sc,sc,sc);
    dummy.updateMatrix();
    inst.setMatrixAt(i,dummy.matrix);
  }
  inst.instanceMatrix.needsUpdate=true;
  group.add(inst);
  group.userData.leafMesh=inst;
  return group;
}

export function createPlayer() {
  const g=new THREE.Group();
  g.name="player";

  const bootMat=mat(0x3a2b20), trouserMat=mat(0x2f362e), tunicMat=mat(0x43543a);
  const leatherMat=mat(0x6b4a2f), skinMat=mat(0xc99770), steel=mat(0x9da5a1,.45,.18);

  const shadow=mesh(new THREE.CircleGeometry(.48,24),new THREE.MeshBasicMaterial({color:0x071008,transparent:true,opacity:.24}),false,false);
  shadow.rotation.x=-Math.PI/2;
  shadow.position.y=.015;
  shadow.scale.y=.52;
  g.add(shadow);

  const hips=new THREE.Group();
  hips.position.y=.77;
  g.add(hips);

  const legPivots=[];
  for(const sx of [-.16,.16]){
    const pivot=new THREE.Group();
    pivot.position.set(sx,0,0);
    hips.add(pivot);

    const leg=mesh(new THREE.CylinderGeometry(.09,.11,.58,7),trouserMat);
    leg.position.y=-.30;
    pivot.add(leg);

    const boot=box(.22,.16,.34,0x3b2a1e);
    boot.position.set(0,-.63,.07);
    pivot.add(boot);

    legPivots.push(pivot);
  }

  const torsoPivot=new THREE.Group();
  torsoPivot.position.y=.80;
  g.add(torsoPivot);

  const body=mesh(new THREE.CapsuleGeometry(.30,.55,5,9),tunicMat);
  body.position.y=.25;
  torsoPivot.add(body);

  const vest=mesh(new THREE.CapsuleGeometry(.315,.32,4,8),leatherMat);
  vest.position.y=.27;
  vest.scale.z=.92;
  torsoPivot.add(vest);

  const belt=mesh(new THREE.CylinderGeometry(.34,.34,.10,10),mat(0x3f3023));
  belt.position.y=.0;
  torsoPivot.add(belt);

  const buckle=box(.11,.09,.04,0xb89450);
  buckle.position.set(0,.01,.32);
  torsoPivot.add(buckle);

  const armPivots=[];
  for(const sx of [-1,1]){
    const pivot=new THREE.Group();
    pivot.position.set(sx*.34,.52,0);
    torsoPivot.add(pivot);

    const arm=mesh(new THREE.CylinderGeometry(.075,.09,.58,7),skinMat);
    arm.position.y=-.28;
    arm.rotation.z=sx*.06;
    pivot.add(arm);

    armPivots.push(pivot);
  }

  const neck=cyl(.09,.1,.15,8,0xc18e68);
  neck.position.y=.66;
  torsoPivot.add(neck);

  const head=sphere(.23,0xd2a078,[.88,1.06,.92],2);
  head.position.y=.92;
  torsoPivot.add(head);

  const hair=sphere(.235,0x30241d,[.93,.55,.95],1);
  hair.position.set(0,1.06,-.01);
  torsoPivot.add(hair);

  const pack=box(.42,.50,.23,0x5a402b);
  pack.position.set(0,.28,-.31);
  pack.rotation.x=.05;
  torsoPivot.add(pack);

  const roll=cyl(.09,.09,.46,8,0x817150);
  roll.rotation.z=Math.PI/2;
  roll.position.set(0,.61,-.38);
  torsoPivot.add(roll);

  const rightArm=armPivots[1];
  const toolRoot=new THREE.Group();
  toolRoot.position.set(0,-.57,.02);
  rightArm.add(toolRoot);

  const axe=new THREE.Group();
  const axeHandle=cyl(.025,.032,.78,6,0x6b4727);
  axeHandle.position.y=-.27;
  axe.add(axeHandle);
  const axeBlade=mesh(new THREE.ConeGeometry(.17,.28,4),steel);
  axeBlade.rotation.z=Math.PI/2;
  axeBlade.scale.z=.34;
  axeBlade.position.set(.12,-.62,0);
  axe.add(axeBlade);
  axe.rotation.z=-.10;
  toolRoot.add(axe);

  const pickaxe=new THREE.Group();
  const pickHandle=cyl(.025,.032,.82,6,0x684426);
  pickHandle.position.y=-.29;
  pickaxe.add(pickHandle);
  const pickHead=mesh(new THREE.BoxGeometry(.58,.075,.075),steel);
  pickHead.position.y=-.69;
  pickHead.rotation.z=.03;
  pickaxe.add(pickHead);
  const pickTipL=mesh(new THREE.ConeGeometry(.055,.22,5),steel);
  pickTipL.rotation.z=Math.PI/2;
  pickTipL.position.set(-.38,-.69,0);
  pickaxe.add(pickTipL);
  const pickTipR=pickTipL.clone();
  pickTipR.rotation.z=-Math.PI/2;
  pickTipR.position.x=.38;
  pickaxe.add(pickTipR);
  pickaxe.visible=false;
  toolRoot.add(pickaxe);

  const sword=new THREE.Group();
  const grip=cyl(.028,.035,.24,6,0x4d3424);
  grip.position.y=-.10;
  sword.add(grip);
  const guard=mesh(new THREE.BoxGeometry(.30,.045,.055),mat(0xb09a71,.4,.30));
  guard.position.y=-.24;
  sword.add(guard);
  const swordBlade=mesh(new THREE.BoxGeometry(.075,.72,.035),steel);
  swordBlade.position.y=-.62;
  sword.add(swordBlade);
  const swordTip=mesh(new THREE.ConeGeometry(.055,.18,4),steel);
  swordTip.position.y=-1.06;
  sword.add(swordTip);
  sword.visible=false;
  toolRoot.add(sword);

  g.userData.shadow=shadow;
  g.userData.hips=hips;
  g.userData.torso=torsoPivot;
  g.userData.legs=legPivots;
  g.userData.arms=armPivots;
  g.userData.toolRoot=toolRoot;
  g.userData.tools={axe,pickaxe,sword};
  g.userData.walkPhase=0;
  g.userData.speed01=0;

  return g;
}

export function createTree(variant=0, season=0) {
  const g=new THREE.Group();
  g.userData.kind="tree";
  g.userData.windPhase=Math.random()*10;

  const barkColors=[0x6a4930,0x735037,0x5e422d,0x68472f];
  const bark=organicMaterial("bark",barkColors[variant%4],.96,0);
  const darkBark=organicMaterial("bark",0x4a3120,.98,0);

  const lean=(variant-1.5)*.065;
  const p0=new THREE.Vector3(0,.04,0);
  const p1=new THREE.Vector3(lean*.25,1.00,lean*.08);
  const p2=new THREE.Vector3(lean*.60,2.08,-lean*.15);
  const p3=new THREE.Vector3(lean,2.96,lean*.10);

  const trunkPieces=[
    branchBetween(p0,p1,.36,.30,bark,12),
    branchBetween(p1,p2,.30,.22,bark,12),
    branchBetween(p2,p3,.22,.12,bark,11)
  ];
  trunkPieces.forEach(x=>g.add(x));

  // Racines visibles au sol.
  for(let i=0;i<7;i++){
    const a=i/7*Math.PI*2+variant*.19;
    const endRoot=new THREE.Vector3(Math.cos(a)*(.55+(i%2)*.15),.10,Math.sin(a)*(.55+(i%3)*.08));
    g.add(branchBetween(new THREE.Vector3(0,.12,0),endRoot,.12,.026,darkBark,7));
  }

  // Grosses branches + branches secondaires.
  const branches=new THREE.Group();
  const branchEnds=[
    [-.92,2.52,.18],[.88,2.63,-.18],[-.52,2.88,-.62],[.56,3.02,.54],
    [-.42,3.30,.22],[.40,3.36,-.26]
  ];
  branchEnds.forEach((v,i)=>{
    const startP=i<2?p2:new THREE.Vector3(lean*.82,2.48+(i%2)*.18,0);
    const endP=new THREE.Vector3(v[0]+lean*.55,v[1],v[2]);
    branches.add(branchBetween(startP,endP,.115-(i*.008),.026,bark,8));

    const sideDir=new THREE.Vector3(
      endP.x+(i%2?-.26:.27),
      endP.y+.24,
      endP.z+(i%3===0?.24:-.20)
    );
    branches.add(branchBetween(
      new THREE.Vector3().lerpVectors(startP,endP,.72),
      sideDir,
      .045,.012,bark,7
    ));
  });
  g.add(branches);

  const palettes=[
    [0x244b2c,0x3b703a,0x63934b,0x8daf64],
    [0x20462a,0x35653a,0x5d8a48,0x789f56],
    [0x6b3b25,0xa34e2e,0xcf7634,0xe3a04a],
    [0x465349,0x5f6b60,0x7f8a7d,0x9aa397]
  ];
  const pal=palettes[season]||palettes[0];

  const crown=new THREE.Group();
  const massData=variant===2
    ? [[-.52,2.74,.02,.65,.50,.58],[.48,2.86,.06,.67,.53,.60],[.04,3.26,-.04,.74,.64,.68],[-.12,3.66,.02,.55,.46,.51]]
    : [[-.72,2.66,.02,.73,.54,.65],[.70,2.72,.02,.75,.56,.67],[-.18,3.08,.10,.83,.65,.72],[.42,3.24,-.12,.68,.52,.61],[0,3.58,.02,.59,.45,.53]];

  massData.forEach((b,i)=>{
    const leafMass=mesh(organicGeometry(variant*17+i*11+3,2,.065),leafMaterial(pal[i%pal.length]));
    leafMass.scale.set(b[3],b[4],b[5]);
    leafMass.position.set(b[0]+lean*.7,b[1],b[2]);
    crown.add(leafMass);
  });

  // Vraies feuilles visibles en deux couches qui peuvent bouger séparément.
  const leafLayers=[
    createLeafLayer(1000+variant*31,pal[2],34,[1.02,.78,.90],[0,3.05,0],.23),
    createLeafLayer(2000+variant*47,pal[3],28,[.82,.66,.72],[-.08,3.45,.04],.21),
    createLeafLayer(3000+variant*59,pal[1],22,[.95,.52,.80],[.12,2.72,-.03],.20)
  ];
  leafLayers.forEach(l=>crown.add(l));

  g.add(crown);
  g.userData.crown=crown;
  g.userData.leafLayers=leafLayers;
  g.userData.branches=branches;
  g.userData.foliageMeshes=crown.children;
  g.userData.trunkMaterial=bark;
  return g;
}

export function createPine(variant=0, season=0) {
  const g=new THREE.Group();
  g.userData.kind="tree";
  g.userData.windPhase=Math.random()*10;

  const bark=organicMaterial("bark",0x5c402d,.96,0);
  const trunk=branchBetween(new THREE.Vector3(0,.03,0),new THREE.Vector3((variant-1.5)*.035,3.65,0),.24,.09,bark,10);
  g.add(trunk);

  const colors=season===2
    ? [0x263f31,0x3a573e,0x506b49]
    : season===3
    ? [0x253f37,0x365449,0x4f6e5c]
    : [0x17392b,0x255239,0x3f744d];

  const crown=new THREE.Group();
  for(let tier=0;tier<7;tier++){
    const y=1.05+tier*.42;
    const radius=1.12-tier*.105;
    const count=5+(tier%2);
    for(let i=0;i<count;i++){
      const a=i/count*Math.PI*2+tier*.47+variant*.19;
      const len=radius*(.72+(i%2)*.12);
      const start=new THREE.Vector3(0,y,0);
      const end=new THREE.Vector3(Math.cos(a)*len,y-.12-tier*.008,Math.sin(a)*len);
      const branch=branchBetween(start,end,.055,.018,bark,6);
      crown.add(branch);

      const needle=mesh(organicGeometry(tier*31+i*13+variant,1,.07),leafMaterial(colors[(tier+i)%3]));
      needle.scale.set(.34+radius*.22,.18+.03*(i%2),.48+radius*.20);
      needle.position.copy(end).lerp(start,.25);
      needle.rotation.y=a;
      crown.add(needle);
    }
  }

  const top=mesh(organicGeometry(variant*53+7,1,.06),leafMaterial(colors[1]));
  top.scale.set(.40,.78,.40);
  top.position.y=3.58;
  crown.add(top);

  if(season===3){
    for(let i=0;i<5;i++){
      const snow=mesh(new THREE.SphereGeometry(.42-i*.035,12,8),mat(0xdde5e1,.98,0));
      snow.scale.set(1.25,.12,1.0);
      snow.position.y=1.45+i*.47;
      crown.add(snow);
    }
  }

  g.add(crown);
  g.userData.crown=crown;
  g.userData.foliageMeshes=crown.children;
  return g;
}

export function createBush(variant=0, season=0, berries=false) {
  const g=new THREE.Group();
  g.userData.kind="bush";
  g.userData.windPhase=Math.random()*9;

  const twig=organicMaterial("bark",0x594029,.97,0);
  const branches=new THREE.Group();
  for(let i=0;i<9;i++){
    const a=i/9*Math.PI*2;
    const end=new THREE.Vector3(
      Math.cos(a)*(.34+(i%2)*.13),
      .48+(i%4)*.075,
      Math.sin(a)*(.34+(i%3)*.11)
    );
    branches.add(branchBetween(new THREE.Vector3(0,.035,0),end,.035,.010,twig,6));
  }
  g.add(branches);

  const palettes=[
    [0x28512f,0x3f763d,0x699953,0x83aa63],
    [0x22492d,0x356a3a,0x5f8c49,0x789e57],
    [0x663824,0xa24d2d,0xcc7037,0xe09a48],
    [0x4b584e,0x647064,0x7e897e,0x939d92]
  ];
  const p=palettes[season]||palettes[0];

  const crown=new THREE.Group();
  const clusters=[
    [-.32,.39,-.04,.33,.23,.30],[.30,.41,.05,.37,.26,.34],[0,.61,-.05,.40,.29,.36],
    [-.15,.32,.28,.31,.22,.29],[.13,.34,-.27,.30,.21,.28]
  ];
  clusters.forEach((a,i)=>{
    const s=mesh(organicGeometry(variant*19+i*9+5,2,.075),leafMaterial(p[(i+variant)%p.length]));
    s.scale.set(a[3],a[4],a[5]);s.position.set(a[0],a[1],a[2]);crown.add(s);
  });

  const leafLayers=[
    createLeafLayer(4100+variant*41,p[2],18,[.52,.36,.47],[0,.48,0],.15),
    createLeafLayer(5200+variant*53,p[3],14,[.43,.30,.39],[.02,.64,.01],.14)
  ];
  leafLayers.forEach(l=>crown.add(l));

  if(season===3){
    const snow=mesh(new THREE.SphereGeometry(.44,12,8),mat(0xdce4df,.98,0));
    snow.scale.set(1.1,.10,.86);snow.position.set(0,.82,0);crown.add(snow);
  }

  if(berries&&season!==3){
    const berryMat=mat(season===2?0x8f2e2e:0x3b4b9c,.62,0);
    for(const [x,y,z] of [[-.23,.58,.30],[.25,.52,.32],[.05,.72,.28],[-.05,.46,.35],[-.30,.44,.13],[.29,.61,-.08]]){
      const b=mesh(new THREE.SphereGeometry(.045,8,6),berryMat);b.position.set(x,y,z);crown.add(b);
    }
  }

  g.add(crown);
  g.userData.crown=crown;
  g.userData.leafLayers=leafLayers;
  g.userData.branches=branches;
  return g;
}

export function createRockCluster(kind="rock",variant=0,season=0) {
  const g=new THREE.Group();
  g.userData.kind=kind;

  const rockColors=season===3
    ? [0x747d7a,0x8d9692,0x606966,0x818984]
    : [0x5d655f,0x747c75,0x90978f,0x68726a,0x808780];
  const mossMat=leafMaterial(season===2?0x65703b:0x506c3f);

  const positions=[
    [-.46,.28,-.04,.62,.50,.56],
    [.14,.43,-.10,.78,.69,.68],
    [.62,.25,.16,.47,.41,.50],
    [-.04,.17,.49,.42,.34,.45],
    [-.54,.13,.42,.28,.22,.30],
    [.49,.12,-.35,.31,.24,.28]
  ];

  positions.forEach((p,i)=>{
    const geo=organicGeometry(variant*41+i*17+11,2,.16);
    const r=mesh(geo,organicMaterial("stone",rockColors[(i+variant)%rockColors.length],.97,.01));
    r.scale.set(p[3],p[4],p[5]);
    r.position.set(p[0],p[1],p[2]);
    r.rotation.set(i*.18+.05,variant*.36+i*.61,i*.07);
    g.add(r);

    if(kind==="rock"&&season!==3&&i<3){
      const moss=mesh(new THREE.SphereGeometry(.20+i*.015,12,8),mossMat);
      moss.scale.set(1.35,.10,.86);
      moss.position.set(p[0]-.05,p[1]+p[4]*.88,p[2]+.03);
      moss.rotation.y=i*.78;
      g.add(moss);
    }
  });

  // Éclats au pied pour casser la forme "patate".
  for(let i=0;i<7;i++){
    const a=i/7*Math.PI*2+variant*.23;
    const chip=mesh(
      organicGeometry(900+variant*23+i*7,1,.18),
      organicMaterial("stone",rockColors[(i+2)%rockColors.length],.98,.005)
    );
    const s=.09+(i%3)*.025;
    chip.scale.set(s*1.4,s*.65,s);
    chip.position.set(Math.cos(a)*(.65+(i%2)*.12),.055,Math.sin(a)*(.58+(i%3)*.06));
    chip.rotation.set(.2,i*.7,.1);
    g.add(chip);
  }

  // Fissures sombres visibles depuis la caméra isométrique.
  const crackMat=mat(0x353b37,.98,0);
  for(let i=0;i<3;i++){
    const crack=mesh(new THREE.CylinderGeometry(.012,.018,.42,5),crackMat);
    crack.position.set(-.18+i*.24,.50+i*.035,.48);
    crack.rotation.x=1.30;
    crack.rotation.z=.68-i*.33;
    g.add(crack);
  }

  if(season===3){
    const snow=mesh(new THREE.SphereGeometry(.54,14,9),mat(0xdde5e1,.98,0));
    snow.scale.set(1.55,.15,1.05);snow.position.set(.02,.96,-.03);g.add(snow);
  }

  if(kind!=="rock"){
    const oreColor=kind==="copper"?0xc27345:kind==="gold"?0xd6b64b:kind==="tin"?0xc9d1cf:0x6f8fa9;
    const oreMat=new THREE.MeshStandardMaterial({
      color:oreColor,roughness:.33,metalness:.52,
      emissive:new THREE.Color(oreColor).multiplyScalar(.05)
    });

    const veins=[
      [-.31,.54,.43,.13,.30],[.08,.73,.46,.16,-.22],[.43,.42,.38,.115,.55],[-.08,.36,.57,.10,-.40],
      [.27,.55,-.34,.095,.18]
    ];
    veins.forEach((v,i)=>{
      const crystal=mesh(organicGeometry(variant*71+i*13+4,1,.10),oreMat);
      crystal.scale.set(v[3],v[3]*1.55,v[3]*.66);
      crystal.position.set(v[0],v[1],v[2]);
      crystal.rotation.set(v[4],i*.8,.15);
      g.add(crystal);
    });

    for(let i=0;i<4;i++){
      const vein=mesh(new THREE.CylinderGeometry(.016,.027,.55,6),oreMat);
      vein.position.set(-.32+i*.21,.45+i*.07,.49);
      vein.rotation.z=.78-i*.28;
      vein.rotation.x=1.24;
      g.add(vein);
    }
  }

  return g;
}

export function createCampfire() {
  const g=new THREE.Group(); g.userData.kind="campfire";
  const stone=mat(0x777b72);
  for(let i=0;i<10;i++){const a=i/10*Math.PI*2;const s=sphere(.14,0x777b72,[1,.72,1],1);s.position.set(Math.cos(a)*.48,.11,Math.sin(a)*.48);g.add(s);}
  for(const rot of [-.55,.55]){
    const log=cyl(.09,.11,.82,7,0x5a3820); log.rotation.z=Math.PI/2; log.rotation.y=rot; log.position.y=.14; g.add(log);
  }
  const flameMat=new THREE.MeshBasicMaterial({color:0xff7b23,transparent:true,opacity:.88,depthWrite:false});
  const flame=mesh(new THREE.ConeGeometry(.23,.70,8),flameMat,false,false); flame.position.y=.53; g.add(flame);
  const inner=mesh(new THREE.ConeGeometry(.12,.44,7),new THREE.MeshBasicMaterial({color:0xffd65a,transparent:true,opacity:.92,depthWrite:false}),false,false); inner.position.y=.45; g.add(inner);
  const light=new THREE.PointLight(0xffa244,2.2,9,2); light.position.y=.8; light.castShadow=false; g.add(light);
  g.userData.flame=flame; g.userData.inner=inner; g.userData.light=light;
  return g;
}

export function createChest() {
  const g=new THREE.Group();
  const wood=mat(0x6f4728), dark=mat(0x432d1c), metal=mat(0xb38a45,.5,.45);
  const base=box(1.0,.55,.70,0x6f4728); base.position.y=.28; g.add(base);
  const lid=mesh(new THREE.CylinderGeometry(.5,.5,1.0,10,1,false,0,Math.PI),wood); lid.rotation.z=Math.PI/2; lid.rotation.x=Math.PI/2; lid.scale.z=.70; lid.position.set(0,.63,0); g.add(lid);
  for(const x of [-.34,.34]){const band=box(.10,.63,.73,0x4b4538);band.position.set(x,.31,0);g.add(band);}
  const lock=box(.15,.18,.05,0xb38a45); lock.position.set(0,.37,.38); g.add(lock);
  g.userData.lid=lid; g.userData.opened=false; return g;
}

export function createSkeleton() {
  const g=new THREE.Group(); g.userData.kind="skeleton"; g.userData.hp=100; g.userData.cooldown=0;
  const bone=mat(0xd8d0b8), dark=mat(0x302d27), rust=mat(0x765039,.6,.18);
  const pelvis=box(.35,.18,.18,0xcfc7af); pelvis.position.y=.78; g.add(pelvis);
  const spine=cyl(.06,.075,.78,6,0xd8d0b8); spine.position.y=1.18; g.add(spine);
  for(let i=0;i<4;i++){const rib=mesh(new THREE.TorusGeometry(.27-i*.025,.025,5,10,Math.PI),bone);rib.rotation.x=Math.PI/2;rib.position.set(0,1.18+i*.13,.02);g.add(rib);}
  for(const sx of [-1,1]){
    const arm=cyl(.035,.045,.72,6,0xd8d0b8);arm.position.set(sx*.34,1.18,0);arm.rotation.z=sx*.18;g.add(arm);
    const leg=cyl(.045,.055,.82,6,0xd8d0b8);leg.position.set(sx*.15,.39,0);g.add(leg);
  }
  const skull=sphere(.22,0xd8d0b8,[.92,1.02,.88],1);skull.position.y=1.72;g.add(skull);
  for(const sx of [-1,1]){const eye=sphere(.035,0x090807,[1,1,1],1);eye.position.set(sx*.07,1.75,.19);g.add(eye);}
  const sword=box(.06,.72,.04,0x8d8370); sword.position.set(.48,1.05,.08); sword.rotation.z=-.42; g.add(sword);
  return g;
}

export function createHorse() {
  const g=new THREE.Group(); g.userData.kind="horse"; g.userData.tamed=false;
  const coat=mat(0x755035), dark=mat(0x3b2b22), light=mat(0x9b7049);
  const body=mesh(new THREE.CapsuleGeometry(.47,1.0,5,10),coat);body.rotation.z=Math.PI/2;body.position.y=1.08;g.add(body);
  const neck=mesh(new THREE.CylinderGeometry(.22,.31,.82,9),coat);neck.position.set(.61,1.50,0);neck.rotation.z=-.45;g.add(neck);
  const head=sphere(.28,0x755035,[1.25,.85,.75],2);head.position.set(.92,1.82,0);g.add(head);
  for(const z of [-.25,.25])for(const x of [-.43,.43]){const leg=cyl(.07,.09,.88,7,0x5b3e2d);leg.position.set(x,.48,z);g.add(leg);const hoof=box(.16,.12,.18,0x2f2722);hoof.position.set(x,.06,z+.025);g.add(hoof);}
  const mane=box(.70,.12,.10,0x30251f);mane.position.set(.42,1.76,-.03);mane.rotation.z=-.55;g.add(mane);
  const tail=mesh(new THREE.CylinderGeometry(.035,.08,.72,6),dark);tail.position.set(-.92,1.13,0);tail.rotation.z=-1.15;g.add(tail);
  const saddle=box(.55,.13,.65,0x4e3324);saddle.position.set(0,1.52,0);g.add(saddle);
  return g;
}

export function createFarmPlot() {
  const g=new THREE.Group(); g.userData.kind="farm"; g.userData.planted=false; g.userData.plantedAt=0; g.userData.ready=false;
  const soil=box(3.8,.18,2.8,0x65472d);soil.position.y=.08;g.add(soil);
  for(let i=-2;i<=2;i++){const row=box(3.5,.08,.18,0x3f2c1e);row.position.set(0,.17,i*.46);g.add(row);}
  const crops=new THREE.Group(); crops.visible=false; g.add(crops); g.userData.crops=crops;
  return g;
}

export function updateFarmVisual(plot,stage) {
  const crops=plot.userData.crops;
  while(crops.children.length)crops.remove(crops.children[0]);
  crops.visible=stage>0;
  if(stage<=0)return;
  const height=stage===1?.22:stage===2?.48:.78;
  for(let z=-.9;z<=.9;z+=.45)for(let x=-1.45;x<=1.45;x+=.48){
    const stem=cyl(.018,.028,height,5,stage===3?0x6a8b35:0x4c7b35);stem.position.set(x,.18+height/2,z);crops.add(stem);
    if(stage>=2){
      const leaf=sphere(.09,0x5d913e,[1.6,.45,.8],1);leaf.position.set(x+.08,.25+height*.62,z);leaf.rotation.z=.4;crops.add(leaf);
    }
    if(stage===3){
      const head=sphere(.10,0xd8aa45,[.7,1.2,.7],1);head.position.set(x,.20+height,z);crops.add(head);
    }
  }
}

export function createDeer() {
  const g=new THREE.Group();
  g.userData.kind="deer";
  const coat=mat(0x916b46), dark=mat(0x57432f), cream=mat(0xd6bc92);

  const body=mesh(new THREE.CapsuleGeometry(.30,.66,4,8),coat);
  body.rotation.z=Math.PI/2;body.position.y=.75;g.add(body);

  const neckPivot=new THREE.Group();
  neckPivot.position.set(.40,.95,0);g.add(neckPivot);
  const neck=cyl(.12,.18,.55,7,0x916b46);
  neck.position.set(.14,.16,0);neck.rotation.z=-.45;neckPivot.add(neck);

  const head=sphere(.18,0x916b46,[1.2,.8,.75],1);
  head.position.set(.40,.36,0);neckPivot.add(head);

  const muzzle=sphere(.09,0xb79268,[1.25,.68,.70],1);
  muzzle.position.set(.57,.32,0);neckPivot.add(muzzle);

  const eye=sphere(.025,0x15120f,[1,1,1],1);
  eye.position.set(.47,.40,.145);neckPivot.add(eye);

  const legs=[];
  for(const z of [-.15,.15])for(const x of [-.30,.30]){
    const pivot=new THREE.Group();pivot.position.set(x,.58,z);g.add(pivot);
    const leg=cyl(.035,.045,.55,5,0x57432f);leg.position.y=-.27;pivot.add(leg);
    legs.push(pivot);
  }

  const tail=sphere(.09,0xd6bc92,[1.1,.9,1],1);
  tail.position.set(-.62,.80,0);g.add(tail);

  g.userData.neck=neckPivot;
  g.userData.legs=legs;
  g.userData.tail=tail;
  g.userData.body=body;
  return g;
}

export function createRabbit() {
  const g=new THREE.Group();
  g.userData.kind="rabbit";
  const fur=mat(0x9b8d77),dark=mat(0x665d50),light=mat(0xd8ccb7);

  const body=sphere(.25,0x9b8d77,[1.25,.86,.92],1);
  body.position.set(-.08,.27,0);g.add(body);

  const headPivot=new THREE.Group();
  headPivot.position.set(.24,.42,0);g.add(headPivot);

  const head=sphere(.16,0x9b8d77,[1,.95,.9],1);
  headPivot.add(head);

  for(const z of [-.07,.07]){
    const ear=mesh(new THREE.CapsuleGeometry(.035,.18,3,6),fur);
    ear.position.set(-.01,.22,z);ear.rotation.z=-.10;headPivot.add(ear);
  }

  const eye=sphere(.018,0x171411,[1,1,1],1);
  eye.position.set(.11,.035,.13);headPivot.add(eye);

  const tail=sphere(.08,0xe5dccb,[1,1,1],1);
  tail.position.set(-.38,.31,0);g.add(tail);

  const hind=[];
  for(const z of [-.13,.13]){
    const leg=mesh(new THREE.CapsuleGeometry(.045,.14,3,6),dark);
    leg.position.set(-.18,.13,z);leg.rotation.z=Math.PI/2.8;g.add(leg);hind.push(leg);
  }

  g.userData.head=headPivot;
  g.userData.tail=tail;
  g.userData.hind=hind;
  g.userData.body=body;
  return g;
}

export function createStoneWall(length=3.2) {
  const g=new THREE.Group(); g.userData.kind="build"; g.userData.buildType="stone_wall";
  const stoneMats=[mat(0x77796f),mat(0x8b8b80),mat(0x62665f)];
  const rows=3, cols=Math.max(3,Math.round(length/.62));
  for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){
    if(y===2 && ((x+y)%5===0))continue;
    const b=mesh(new THREE.BoxGeometry(.64,.42,.52),stoneMats[(x+y)%3]);
    b.position.set((x-(cols-1)/2)*.60+(y%2*.29),.22+y*.40,(Math.random()-.5)*.03); b.rotation.y=(Math.random()-.5)*.05; g.add(b);
  }
  return g;
}

export function createStoneTower() {
  const g=new THREE.Group(); g.userData.kind="build"; g.userData.buildType="stone_tower";
  const m=[mat(0x77796f),mat(0x8d8c80),mat(0x62665f)];
  for(let y=0;y<5;y++)for(let i=0;i<12;i++){
    const a=i/12*Math.PI*2+(y%2)*.13;
    const b=mesh(new THREE.BoxGeometry(.62,.38,.42),m[(i+y)%3]);b.position.set(Math.cos(a)*1.15,.20+y*.36,Math.sin(a)*1.15);b.rotation.y=-a;b.castShadow=true;g.add(b);
  }
  for(let i=0;i<8;i++){const a=i/8*Math.PI*2;const mer=box(.46,.46,.46,0x77796f);mer.position.set(Math.cos(a)*1.13,2.03,Math.sin(a)*1.13);mer.rotation.y=-a;g.add(mer);}
  return g;
}

export function createPalisade(length=3.5) {
  const g=new THREE.Group();g.userData.kind="build";g.userData.buildType="palisade";
  const count=Math.round(length/.34);
  for(let i=0;i<count;i++){
    const post=mesh(new THREE.CylinderGeometry(.13,.16,1.95,7),mat(i%2?0x5e3c24:0x6b4529));post.position.set((i-(count-1)/2)*.32,.96,0);g.add(post);
    const tip=mesh(new THREE.ConeGeometry(.135,.35,7),mat(0x5a3822));tip.position.set(post.position.x,2.10,0);g.add(tip);
  }
  return g;
}

export function makeGhost(group,valid=true) {
  group.traverse(o=>{
    if(o.isMesh){
      o.material=o.material.clone();
      o.material.transparent=true;
      o.material.opacity=.48;
      o.material.color=new THREE.Color(valid?0x8cd27a:0xd56762);
      o.castShadow=false;
      o.receiveShadow=false;
    }
  });
  return group;
}
