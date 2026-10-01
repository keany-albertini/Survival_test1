import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.169.0/build/three.module.js";

import {naturalTree,naturalRock,naturalMaterial,detailAnimal} from '../everwild/nature.js?v=ew5';
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

  let seed=kind==="bark"?771:kind==="stone"?993:kind==="fur"?641:517;
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
  }else if(kind==="fur"){
    const img=ctx.createImageData(size,size);
    for(let i=0;i<img.data.length;i+=4){
      const n=(rand()+rand()+rand()+rand())/4;
      const v=Math.floor(160+n*62);
      img.data[i]=v;img.data[i+1]=v;img.data[i+2]=v;img.data[i+3]=255;
    }
    ctx.putImageData(img,0,0);
    ctx.strokeStyle="rgba(65,65,65,.16)";
    ctx.lineWidth=1;
    for(let i=0;i<520;i++){
      const x=rand()*size,y=rand()*size,len=3+rand()*9;
      ctx.beginPath();
      ctx.moveTo(x,y);
      ctx.lineTo(x+len*(.55+rand()*.35),y+len*(.15+rand()*.25));
      ctx.stroke();
    }
    ctx.strokeStyle="rgba(245,245,245,.08)";
    for(let i=0;i<180;i++){
      const x=rand()*size,y=rand()*size,len=2+rand()*6;
      ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+len,y+len*.18);ctx.stroke();
    }
  }else if(kind==="cloth"){
    ctx.fillStyle="#c8c6bd";ctx.fillRect(0,0,size,size);
    for(let i=0;i<size;i+=3){
      ctx.strokeStyle=i%6===0?"rgba(65,62,55,.20)":"rgba(245,240,225,.18)";ctx.lineWidth=1;
      ctx.beginPath();ctx.moveTo(i,0);ctx.lineTo(i,size);ctx.stroke();
      ctx.beginPath();ctx.moveTo(0,i);ctx.lineTo(size,i);ctx.stroke();
    }
  }else if(kind==="leather"){
    const img=ctx.createImageData(size,size);
    for(let i=0;i<img.data.length;i+=4){const v=165+rand()*42;img.data[i]=img.data[i+1]=img.data[i+2]=v;img.data[i+3]=255;}
    ctx.putImageData(img,0,0);
    ctx.strokeStyle="rgba(55,48,39,.22)";ctx.lineWidth=1;
    for(let i=0;i<85;i++){const x=rand()*size,y=rand()*size;ctx.beginPath();ctx.moveTo(x,y);ctx.quadraticCurveTo(x+6,y-3,x+14,y+1);ctx.stroke();}
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
  map.repeat.set(kind==="bark"?1.5:kind==="fur"?3.2:2.4,kind==="bark"?4.5:kind==="fur"?3.2:2.4);
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
    bumpScale:kind==="bark"?.12:kind==="stone"?.10:kind==="fur"?.035:.06
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

function fittedGarment(profile){
  const vertices=[],uv=[],indices=[],segments=24;
  for(let ring=0;ring<profile.length;ring++){
    const [y,rx,rz]=profile[ring];
    for(let i=0;i<=segments;i++){const a=i/segments*Math.PI*2;vertices.push(Math.sin(a)*rx,y,Math.cos(a)*rz);uv.push(i/segments,ring/(profile.length-1));}
  }
  for(let r=0;r<profile.length-1;r++)for(let i=0;i<segments;i++){
    const a=r*(segments+1)+i,b=a+segments+1;indices.push(a,a+1,b,a+1,b+1,b);
  }
  const geometry=new THREE.BufferGeometry();geometry.setAttribute("position",new THREE.Float32BufferAttribute(vertices,3));
  geometry.setAttribute("uv",new THREE.Float32BufferAttribute(uv,2));geometry.setIndex(indices);geometry.computeVertexNormals();return geometry;
}

export function createPlayer() {
  const g=new THREE.Group();
  g.name="player";

  const bootMat=organicMaterial("leather",0x51412f), trouserMat=organicMaterial("cloth",0x515247), tunicMat=organicMaterial("cloth",0x64745a);
  const leatherMat=organicMaterial("leather",0x806044), skinMat=mat(0xc99770,.72,0), steel=mat(0xbfc5c3,.28,.65);

  skinMat.userData.role='skin';
  const shadow=mesh(new THREE.CircleGeometry(.48,24),new THREE.MeshBasicMaterial({color:0x071008,transparent:true,opacity:.24}),false,false);
  shadow.rotation.x=-Math.PI/2;
  shadow.position.y=.015;
  shadow.scale.y=.52;
  g.add(shadow);

  const hips=new THREE.Group();
  hips.position.y=.77;
  g.add(hips);

  const legPivots=[],knees=[],ankles=[];
  for(const sx of [-.16,.16]){
    const pivot=new THREE.Group();
    pivot.position.set(sx,0,0);
    hips.add(pivot);

    const thigh=mesh(new THREE.CapsuleGeometry(.09,.19,4,12),trouserMat);
    thigh.position.y=-.16;pivot.add(thigh);
    const knee=new THREE.Group();knee.position.y=-.33;pivot.add(knee);knees.push(knee);
    const calf=mesh(new THREE.CapsuleGeometry(.075,.19,4,12),trouserMat);
    calf.position.y=-.16;knee.add(calf);
    const ankle=new THREE.Group();ankle.position.y=-.29;knee.add(ankle);ankles.push(ankle);
    const boot=mesh(new THREE.CapsuleGeometry(.085,.15,4,10),bootMat);
    boot.rotation.x=Math.PI/2;boot.scale.x=1.12;boot.position.set(0,-.025,.045);ankle.add(boot);
    const bootTop=mesh(new THREE.CylinderGeometry(.085,.08,.15,12),bootMat);
    bootTop.position.y=.07;ankle.add(bootTop);
    legPivots.push(pivot);
  }

  const torsoPivot=new THREE.Group();
  torsoPivot.position.y=.80;
  g.add(torsoPivot);

  const body=mesh(fittedGarment([[-.37,.235,.15],[-.25,.215,.14],[-.08,.24,.15],[.13,.29,.16],[.30,.32,.16],[.40,.15,.09],[.43,.10,.08]]),tunicMat);
  body.position.y=.25;
  torsoPivot.add(body);

  const vest=mesh(fittedGarment([[-.24,.224,.149],[-.08,.25,.159],[.13,.300,.169],[.27,.32,.17],[.37,.19,.125]]),leatherMat);
  vest.position.y=.25;
  vest.scale.z=1;
  torsoPivot.add(vest);

  const hem=mesh(new THREE.CylinderGeometry(.25,.29,.23,16),tunicMat);hem.scale.z=.70;hem.position.y=-.04;torsoPivot.add(hem);
  const belt=mesh(new THREE.CylinderGeometry(.34,.34,.10,10),mat(0x3f3023));
  belt.position.y=.0;belt.scale.z=.68;
  torsoPivot.add(belt);

  const buckle=box(.11,.09,.04,0xb89450);
  buckle.position.set(0,.01,.225);
  torsoPivot.add(buckle);

  const armPivots=[],elbows=[],hands=[];
  for(const sx of [-1,1]){
    const pivot=new THREE.Group();
    pivot.position.set(sx*.34,.52,0);
    torsoPivot.add(pivot);

    const upperArm=mesh(new THREE.CapsuleGeometry(.068,.16,4,12),tunicMat);
    upperArm.position.y=-.135;pivot.add(upperArm);
    const elbow=new THREE.Group();elbow.position.y=-.28;pivot.add(elbow);elbows.push(elbow);
    const forearm=mesh(new THREE.CapsuleGeometry(.058,.14,4,12),skinMat);
    forearm.position.y=-.115;elbow.add(forearm);
    const cuff=mesh(new THREE.CylinderGeometry(.065,.058,.09,12),leatherMat);
    cuff.position.y=-.19;elbow.add(cuff);
    const hand=new THREE.Group();hand.position.y=-.27;elbow.add(hand);hands.push(hand);
    const palm=mesh(new THREE.SphereGeometry(.058,12,8),skinMat);palm.scale.set(.75,1.25,.65);hand.add(palm);
    const thumb=mesh(new THREE.CapsuleGeometry(.022,.05,3,8),skinMat);thumb.position.set(-sx*.046,-.015,.02);thumb.rotation.z=sx*.35;hand.add(thumb);
    armPivots.push(pivot);
  }

  const neck=cyl(.09,.1,.15,8,0xc18e68);
  neck.position.y=.66;
  torsoPivot.add(neck);

  const headPivot=new THREE.Group();headPivot.position.y=.77;headPivot.scale.setScalar(.8);torsoPivot.add(headPivot);
  const head=mesh(new THREE.SphereGeometry(.205,20,14),skinMat);
  head.position.y=.15;head.scale.set(.82,1.12,.91);headPivot.add(head);
  const hair=mesh(new THREE.SphereGeometry(.211,18,10,0,Math.PI*2,0,Math.PI*.54),mat(0x352b24));
  hair.name="DefaultHair";hair.material.userData.role="hair";hair.position.set(0,.17,-.01);hair.scale.set(.86,1.12,.95);headPivot.add(hair);
  const nose=mesh(new THREE.SphereGeometry(.04,10,8),skinMat);nose.scale.set(.65,1,1.15);nose.position.set(0,.14,.178);headPivot.add(nose);
  for(const side of [-1,1]){
    const eye=mesh(new THREE.SphereGeometry(.014,8,6),mat(0x302c24));eye.name="Eye";eye.material.userData.role="eye";eye.position.set(side*.064,.19,.174);headPivot.add(eye);
    const ear=mesh(new THREE.SphereGeometry(.04,10,8),skinMat);ear.scale.set(.45,1,.65);ear.position.set(side*.169,.15,0);headPivot.add(ear);
  }
  const beard=mesh(new THREE.SphereGeometry(.14,14,8,0,Math.PI*2,Math.PI*.3,Math.PI*.6),mat(0x49392b));
  beard.name="DefaultBeard";beard.material.userData.role="beard";beard.scale.set(.87,.7,.6);beard.position.set(0,.047,.065);headPivot.add(beard);
  // Leather shoulder straps connect the pack to the chest.
  for(const side of [-1,1]){
    const strap=mesh(new THREE.BoxGeometry(.05,.52,.032),leatherMat);strap.position.set(side*.17,.32,.17);strap.rotation.z=side*.07;torsoPivot.add(strap);
  }
  const pack=mesh(new THREE.BoxGeometry(.37,.44,.18),leatherMat);
  pack.position.set(0,.28,-.26);
  pack.rotation.x=.05;
  torsoPivot.add(pack);

  const roll=cyl(.09,.09,.46,8,0x817150);
  roll.rotation.z=Math.PI/2;
  roll.position.set(0,.61,-.38);
  torsoPivot.add(roll);

  const pouch=mesh(new THREE.SphereGeometry(.12,12,10),leatherMat);pouch.scale.set(.72,1,.7);pouch.position.set(-.24,-.04,.10);torsoPivot.add(pouch);
  const foodProp=mesh(new THREE.SphereGeometry(.058,10,8),mat(0xa64c37));foodProp.position.set(0,-.02,.07);hands[1].add(foodProp);foodProp.visible=false;
  const flask=mesh(new THREE.CylinderGeometry(.06,.08,.18,12),leatherMat);flask.position.set(0,-.02,.07);hands[1].add(flask);flask.visible=false;
  g.userData.foodProp=foodProp;g.userData.flask=flask;
  const rightArm=armPivots[1];
  const toolRoot=new THREE.Group();
  toolRoot.position.set(0,-.02,.035);
  hands[1].add(toolRoot);

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

  g.userData.skinMaterial=skinMat;g.userData.defaultHair=hair;g.userData.defaultBeard=beard;
  g.userData.shadow=shadow;
  g.userData.hips=hips;
  g.userData.torso=torsoPivot;
  g.userData.legs=legPivots;
  g.userData.knees=knees;g.userData.ankles=ankles;
  g.userData.elbows=elbows;g.userData.hands=hands;g.userData.head=headPivot;g.userData.pack=pack;
  g.userData.arms=armPivots;
  g.userData.toolRoot=toolRoot;
  g.userData.tools={axe,pickaxe,sword};
  g.userData.walkPhase=0;
  g.userData.speed01=0;

  return g;
}

export function createTree(variant=0,season=0){return naturalTree(variant,season,false);}

export function createPine(variant=0,season=0){return naturalTree(variant,season,true);}

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

export function createRockCluster(kind="rock",variant=0,season=0){return naturalRock(kind,variant,season);}

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
  const coat=naturalMaterial("fur",0x826a52), dark=naturalMaterial("fur",0x433e36), light=naturalMaterial("fur",0x9b7049);
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

export function createDeer(male=false,variant=0) {
  const g=new THREE.Group();
  g.userData.kind="deer";

  const coatColors=[0x855f3d,0x916b46,0x76543a];
  const coat=organicMaterial("fur",coatColors[variant%coatColors.length],.92,0);
  const dark=mat(0x443328,.96,0);
  const cream=mat(0xd7c19a,.92,0);
  const noseMat=mat(0x241f1b,.78,.02);
  const antlerMat=organicMaterial("bark",0x6b5136,.94,0);

  const bodyRoot=new THREE.Group();
  bodyRoot.position.y=.88;
  g.add(bodyRoot);

  const chest=sphere(.34,coatColors[variant%coatColors.length],[1.05,1.12,.88],2);
  chest.material=coat;
  chest.position.set(.26,0,0);
  bodyRoot.add(chest);

  const belly=sphere(.40,coatColors[variant%coatColors.length],[1.55,.92,.95],2);
  belly.material=coat;
  belly.position.set(-.16,-.02,0);
  bodyRoot.add(belly);

  const rump=sphere(.35,coatColors[variant%coatColors.length],[1.05,1.0,.92],2);
  rump.material=coat;
  rump.position.set(-.55,.03,0);
  bodyRoot.add(rump);

  const bellyPatch=sphere(.22,0xcdb58e,[1.45,.35,.78],1);
  bellyPatch.position.set(-.05,-.27,.05);
  bodyRoot.add(bellyPatch);

  const neckPivot=new THREE.Group();
  neckPivot.position.set(.46,.22,0);
  bodyRoot.add(neckPivot);

  const neck=mesh(new THREE.CylinderGeometry(.12,.20,.72,10),coat);
  neck.position.set(.18,.24,0);
  neck.rotation.z=-.46;
  neckPivot.add(neck);

  const headRoot=new THREE.Group();
  headRoot.position.set(.49,.55,0);
  neckPivot.add(headRoot);

  const head=sphere(.20,coatColors[variant%coatColors.length],[1.22,.88,.78],2);
  head.material=coat;
  head.position.set(.04,0,0);
  headRoot.add(head);

  const muzzle=sphere(.105,0xa9845f,[1.45,.66,.72],2);
  muzzle.position.set(.22,-.035,0);
  headRoot.add(muzzle);

  const nose=sphere(.052,0x211d19,[1.15,.80,.86],1);
  nose.material=noseMat;
  nose.position.set(.34,-.045,0);
  headRoot.add(nose);

  const ears=[];
  for(const z of [-.13,.13]){
    const ear=mesh(new THREE.CapsuleGeometry(.045,.17,4,8),coat);
    ear.position.set(-.06,.22,z);
    ear.rotation.x=z>0?.20:-.20;
    ear.rotation.z=z>0?.28:-.28;
    ear.userData.baseX=ear.rotation.x;
    ear.userData.baseZ=ear.rotation.z;
    headRoot.add(ear);
    ears.push(ear);
  }

  for(const z of [-.145,.145]){
    const eye=sphere(.025,0x13110f,[1,1,1],1);
    eye.position.set(.14,.055,z);
    headRoot.add(eye);

    const gleam=sphere(.008,0xffffff,[1,1,1],1);
    gleam.position.set(.155,.068,z+(z>0?.004:-.004));
    headRoot.add(gleam);
  }

  // Bois plus réalistes pour certains individus.
  const antlers=new THREE.Group();
  antlers.visible=male;
  for(const side of [-1,1]){
    const base=new THREE.Vector3(-.02,.20,side*.07);
    const a1=new THREE.Vector3(-.05,.43,side*.16);
    const a2=new THREE.Vector3(.04,.62,side*.23);
    antlers.add(branchBetween(base,a1,.022,.014,antlerMat,7));
    antlers.add(branchBetween(a1,a2,.015,.009,antlerMat,7));
    antlers.add(branchBetween(
      new THREE.Vector3(-.03,.39,side*.14),
      new THREE.Vector3(-.16,.55,side*.23),
      .012,.006,antlerMat,6
    ));
    antlers.add(branchBetween(
      new THREE.Vector3(.00,.51,side*.20),
      new THREE.Vector3(.16,.63,side*.29),
      .011,.005,antlerMat,6
    ));
  }
  headRoot.add(antlers);

  const legRigs=[];
  const legDefs=[
    [.29,-.17,-.20],[.29,-.17,.20],
    [-.46,-.14,-.20],[-.46,-.14,.20]
  ];
  for(let i=0;i<legDefs.length;i++){
    const d=legDefs[i];
    const hip=new THREE.Group();
    hip.position.set(d[0],d[1],d[2]);
    bodyRoot.add(hip);

    const upper=mesh(new THREE.CylinderGeometry(.055,.075,.43,8),coat);
    upper.position.y=-.21;
    hip.add(upper);

    const knee=new THREE.Group();
    knee.position.y=-.42;
    hip.add(knee);

    const lower=mesh(new THREE.CylinderGeometry(.038,.052,.42,8),dark);
    lower.position.y=-.20;
    knee.add(lower);

    const hoof=mesh(new THREE.BoxGeometry(.09,.08,.13),dark);
    hoof.position.set(.02,-.43,.02);
    hoof.rotation.z=-.10;
    knee.add(hoof);

    legRigs.push({hip,knee,hoof,index:i});
  }

  const tailRoot=new THREE.Group();
  tailRoot.position.set(-.86,.08,0);
  bodyRoot.add(tailRoot);
  const tail=sphere(.10,0xd7c19a,[1.25,.78,.85],1);
  tail.position.set(-.03,.03,0);
  tailRoot.add(tail);

  g.userData.bodyRoot=bodyRoot;
  g.userData.body=belly;
  g.userData.neck=neckPivot;
  g.userData.head=headRoot;
  g.userData.ears=ears;
  g.userData.antlers=antlers;
  g.userData.legRigs=legRigs;
  g.userData.legs=legRigs.map(r=>r.hip);
  g.userData.tail=tailRoot;
  detailAnimal(g);
  return g;
}

export function createRabbit(variant=0) {
  const g=new THREE.Group();
  g.userData.kind="rabbit";

  const furColors=[0x8f806d,0x9b8d77,0x7d7467];
  const fur=organicMaterial("fur",furColors[variant%furColors.length],.94,0);
  const dark=mat(0x5b554d,.96,0);
  const light=mat(0xd9cfbd,.94,0);

  const bodyRoot=new THREE.Group();
  bodyRoot.position.y=.29;
  g.add(bodyRoot);

  const body=sphere(.27,furColors[variant%furColors.length],[1.34,.92,1.0],2);
  body.material=fur;
  body.position.set(-.10,0,0);
  bodyRoot.add(body);

  const chest=sphere(.20,furColors[variant%furColors.length],[.92,1.10,.90],2);
  chest.material=fur;
  chest.position.set(.16,.04,0);
  bodyRoot.add(chest);

  const headPivot=new THREE.Group();
  headPivot.position.set(.29,.18,0);
  bodyRoot.add(headPivot);

  const head=sphere(.17,furColors[variant%furColors.length],[1.02,.97,.92],2);
  head.material=fur;
  headPivot.add(head);

  const muzzle=sphere(.075,0xc6b39a,[1.28,.72,.80],1);
  muzzle.position.set(.13,-.04,0);
  headPivot.add(muzzle);

  const nose=sphere(.026,0x2a2420,[1,1,1],1);
  nose.position.set(.205,-.045,0);
  headPivot.add(nose);

  const ears=[];
  for(const z of [-.072,.072]){
    const ear=mesh(new THREE.CapsuleGeometry(.040,.22,4,8),fur);
    ear.position.set(-.015,.27,z);
    ear.rotation.z=z>0?.08:-.06;
    ear.rotation.x=z>0?.12:-.12;
    ear.userData.baseX=ear.rotation.x;
    ear.userData.baseZ=ear.rotation.z;
    headPivot.add(ear);
    ears.push(ear);
  }

  for(const z of [-.12,.12]){
    const eye=sphere(.021,0x161310,[1,1,1],1);
    eye.position.set(.08,.035,z);
    headPivot.add(eye);
  }

  const hind=[];
  for(const z of [-.14,.14]){
    const hip=new THREE.Group();
    hip.position.set(-.20,-.10,z);
    bodyRoot.add(hip);

    const thigh=sphere(.11,furColors[variant%furColors.length],[1.2,.72,.90],1);
    thigh.position.set(-.04,-.02,0);
    hip.add(thigh);

    const foot=mesh(new THREE.CapsuleGeometry(.035,.18,3,6),dark);
    foot.position.set(.04,-.14,.01);
    foot.rotation.z=Math.PI/2.7;
    hip.add(foot);

    hind.push(hip);
  }

  const fore=[];
  for(const z of [-.10,.10]){
    const leg=mesh(new THREE.CapsuleGeometry(.028,.13,3,6),dark);
    leg.position.set(.19,-.19,z);
    leg.rotation.z=.06;
    bodyRoot.add(leg);
    fore.push(leg);
  }

  const tail=sphere(.085,0xe5dccb,[1,1,1],1);
  tail.position.set(-.44,.03,0);
  bodyRoot.add(tail);

  g.userData.bodyRoot=bodyRoot;
  g.userData.head=headPivot;
  g.userData.ears=ears;
  g.userData.tail=tail;
  g.userData.hind=hind;
  g.userData.fore=fore;
  g.userData.body=body;
  detailAnimal(g);
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
