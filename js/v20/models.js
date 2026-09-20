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
  g.userData.baseRotation=new THREE.Euler();
  const trunkColors=[0x65452d,0x704a31,0x5a3e29,0x6d4b31];
  const trunk=cyl(.22,.34,2.55,9,trunkColors[variant%4]); trunk.position.y=1.25; trunk.rotation.z=(variant-1.5)*.035; g.add(trunk);

  const rootMat=mat(0x51351f);
  for(let i=0;i<5;i++){
    const root=mesh(new THREE.CylinderGeometry(.05,.12,.72,6),rootMat); root.position.set(0,.16,0); root.rotation.z=Math.PI/2.25; root.rotation.y=i*Math.PI*2/5; root.translateY(.18); g.add(root);
  }

  const branchMat=mat(0x543721);
  for(const side of [-1,1]){
    const b=mesh(new THREE.CylinderGeometry(.05,.10,1.15,7),branchMat);
    b.position.set(side*.32,1.95,0); b.rotation.z=side*.74; b.rotation.x=.18; g.add(b);
  }

  const palettes=[
    [0x254a2d,0x3d6c38,0x658e49],
    [0x1f462b,0x356337,0x5e8746],
    [0x5f3826,0xa14d2e,0xd17a34],
    [0x425046,0x58645a,0x788079]
  ];
  const p=palettes[season]||palettes[0];
  const crown=new THREE.Group();
  const blobs=variant===2
    ? [[-.42,2.62,.0,.82,.62,.72],[.36,2.79,.06,.77,.65,.70],[.02,3.32,-.03,.72,.67,.70]]
    : [[-.58,2.64,.02,.86,.65,.76],[.55,2.68,.02,.91,.67,.78],[-.06,3.12,0,.98,.78,.82],[.13,3.62,-.03,.69,.55,.62]];
  blobs.forEach((b,i)=>{
    const leaf=sphere(1,p[Math.min(2,i%3)],[b[3],b[4],b[5]],2); leaf.position.set(b[0],b[1],b[2]); crown.add(leaf);
  });
  g.add(crown); g.userData.crown=crown;
  g.userData.foliageMeshes=crown.children;
  return g;
}

export function createPine(variant=0, season=0) {
  const g=new THREE.Group();
  g.userData.kind="tree"; g.userData.windPhase=Math.random()*10;
  const trunk=cyl(.14,.22,3.1,8,0x5d402a); trunk.position.y=1.52; g.add(trunk);
  const colors=season===2?[0x244331,0x36553b,0x4f6b47]:season===3?[0x24433a,0x315247,0x496b59]:[0x173b2b,0x25543a,0x3e744b];
  const crown=new THREE.Group();
  for(let i=0;i<5;i++){
    const cone=mesh(new THREE.ConeGeometry(.92-i*.11,1.35,10),mat(colors[i%3])); cone.position.y=1.25+i*.53; cone.rotation.y=(i+variant)*.4; crown.add(cone);
    if(season===3){
      const snow=mesh(new THREE.ConeGeometry(.68-i*.075,.22,10),mat(0xdde5e1)); snow.position.y=1.83+i*.53; crown.add(snow);
    }
  }
  g.add(crown); g.userData.crown=crown; g.userData.foliageMeshes=crown.children.filter((_,i)=>season!==3||i%2===0);
  return g;
}

export function createBush(variant=0, season=0, berries=false) {
  const g=new THREE.Group(); g.userData.kind="bush"; g.userData.windPhase=Math.random()*9;
  const twig=mat(0x5a3b23);
  for(let i=0;i<5;i++){
    const b=mesh(new THREE.CylinderGeometry(.018,.035,.64,5),twig); b.position.y=.29; b.rotation.z=(i-2)*.19; b.rotation.y=i*1.2; g.add(b);
  }
  const palettes=[[0x29502f,0x3f733c,0x679552],[0x22472c,0x356838,0x5b8845],[0x683a28,0xa45131,0xcc7137],[0x4b584e,0x647064,0x7e897e]];
  const p=palettes[season]||palettes[0];
  const crown=new THREE.Group();
  [[-.28,.45,0,.38],[.25,.46,.02,.42],[0,.66,-.03,.44],[-.05,.34,.12,.38]].forEach((a,i)=>{
    const s=sphere(1,p[(i+variant)%3],[a[3],a[3]*.72,a[3]],1); s.position.set(a[0],a[1],a[2]); crown.add(s);
  });
  if(season===3){
    const snow=sphere(1,0xdce4df,[.48,.10,.38],1); snow.position.set(0,.83,0); crown.add(snow);
  }
  if(berries && season!==3){
    for(const [x,y,z] of [[-.22,.61,.30],[.25,.55,.32],[.05,.75,.28],[-.05,.48,.35]]){
      const b=sphere(.045,season===2?0x8c2c2c:0x394b9d,[1,1,1],1); b.position.set(x,y,z); crown.add(b);
    }
  }
  g.add(crown); g.userData.crown=crown; return g;
}

export function createRockCluster(kind="rock",variant=0,season=0) {
  const g=new THREE.Group(); g.userData.kind=kind;
  const rockColors=season===3?[0x727b7a,0x8c9694,0x5e6766]:[0x5e665f,0x788078,0x919990];
  const positions=[[-.35,.28,0,.52],[.20,.38,-.05,.66],[.54,.24,.14,.43],[-.02,.18,.38,.38]];
  positions.forEach((p,i)=>{
    const r=mesh(new THREE.DodecahedronGeometry(1,0),mat(rockColors[(i+variant)%3]));
    r.scale.set(p[3],p[3]*(.82+(i%2)*.15),p[3]*(.9+(i%3)*.08)); r.position.set(p[0],p[1],p[2]); r.rotation.set(i*.3,i*.8,i*.13); g.add(r);
  });
  if(season===3){
    const snow=mesh(new THREE.SphereGeometry(.48,10,7,0,Math.PI*2,0,Math.PI*.42),mat(0xdde5e1)); snow.scale.set(1.5,.32,1.0); snow.position.set(.05,.84,-.02); g.add(snow);
  }
  if(kind!=="rock"){
    const oreColor=kind==="copper"?0xc6713e:kind==="gold"?0xd7b449:kind==="tin"?0xcbd3d1:0x597fa9;
    const oreMat=new THREE.MeshStandardMaterial({color:oreColor,roughness:.38,metalness:.42,emissive:new THREE.Color(oreColor).multiplyScalar(.08)});
    for(const [x,y,z,s] of [[-.18,.48,.47,.13],[.20,.66,.35,.16],[.46,.37,.37,.12],[-.36,.32,.34,.10]]){
      const o=mesh(new THREE.OctahedronGeometry(s,0),oreMat); o.position.set(x,y,z); o.rotation.y=x*3; g.add(o);
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
  const coat=mat(0x8b6541), dark=mat(0x57432f), cream=mat(0xd0b58d);
  const body=mesh(new THREE.CapsuleGeometry(.30,.66,4,8),coat);body.rotation.z=Math.PI/2;body.position.y=.75;g.add(body);
  const neck=cyl(.12,.18,.55,7,0x8b6541);neck.position.set(.45,1.02,0);neck.rotation.z=-.45;g.add(neck);
  const head=sphere(.18,0x8b6541,[1.2,.8,.75],1);head.position.set(.68,1.25,0);g.add(head);
  for(const z of [-.15,.15])for(const x of [-.30,.30]){const leg=cyl(.035,.045,.55,5,0x57432f);leg.position.set(x,.34,z);g.add(leg);}
  const tail=sphere(.09,0xd0b58d,[1.1,.9,1],1);tail.position.set(-.62,.80,0);g.add(tail);
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
