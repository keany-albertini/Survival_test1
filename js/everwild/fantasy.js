import * as THREE from 'three';
import {REGIONS,ISLANDS,landDistance,regionAt} from './geography.js';
const rng=n=>{const a=Math.sin(n*78.23+1.83)*43871.28;return a-Math.floor(a)};
const materials=new Map();
function mat(color,metal=0){const key=color+':'+metal;if(!materials.has(key))materials.set(key,new THREE.MeshStandardMaterial({color,roughness:metal?.58:.86,metalness:metal}));return materials.get(key);}
function mesh(g,geo,color,x,y,z,s=[1,1,1],metal=0){const m=new THREE.Mesh(geo,mat(color,metal));m.position.set(x,y,z);m.scale.set(...s);m.castShadow=true;m.receiveShadow=true;g.add(m);return m;}
const sphere=new THREE.SphereGeometry(1,12,8),box=new THREE.BoxGeometry(1,1,1);
function link(g,a,b,r,color){const d=new THREE.Vector3().subVectors(b,a);const m=mesh(g,new THREE.CylinderGeometry(r*.8,r,d.length(),7),color,...a.clone().add(b).multiplyScalar(.5).toArray());m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize());return m;}
export function createDragon(color=0x5d7563){
 const g=new THREE.Group();g.name='Dragon';const rigs=[];
 mesh(g,sphere,color,0,1.8,0,[.8,.85,1.55]);mesh(g,sphere,0xab9671,0,1.5,-.7,[.59,.66,.7]);
 const neck=new THREE.Group();neck.position.set(0,2.1,-1);g.add(neck);
 link(neck,new THREE.Vector3(0,0,0),new THREE.Vector3(0,.75,-1),.36,color);
 mesh(neck,sphere,color,0,.85,-1.15,[.42,.38,.68]);mesh(neck,sphere,color,0,.7,-1.68,[.29,.21,.46]);
 const jaw=mesh(neck,box,0xa59573,0,.54,-1.53,[.45,.12,.74]);
 for(const side of [-1,1]){
  mesh(neck,sphere,0xe6b859,side*.34,.97,-1.42,[.065,.08,.09]);mesh(neck,sphere,0x17261c,side*.385,.98,-1.43,[.016,.06,.043]);
  const horn=mesh(neck,new THREE.ConeGeometry(.12,.64,8),0xc6b794,side*.3,1.33,-.85);horn.rotation.x=.5;horn.rotation.z=-side*.3;
  for(const z of [-.95,.95]){const leg=new THREE.Group();leg.position.set(side*.65,1.5,z);g.add(leg);mesh(leg,sphere,color,side*.17,-.32,.12,[.24,.52,.30]);link(leg,new THREE.Vector3(side*.2,-.55,.18),new THREE.Vector3(side*.26,-1.25,-.12),.13,color);mesh(leg,sphere,color,side*.27,-1.33,-.29,[.22,.12,.4]);for(let t=0;t<3;t++)mesh(leg,new THREE.ConeGeometry(.047,.22,6),0xd5c9a9,side*.27+(t-1)*.13,-1.34,-.61).rotation.x=-Math.PI/2;rigs.push(leg);}
 }
 const tail=new THREE.Group();tail.position.set(0,1.55,1.25);g.add(tail);
 const curve=new THREE.CatmullRomCurve3([new THREE.Vector3(0,0,0),new THREE.Vector3(.3,-.1,.8),new THREE.Vector3(.5,-.35,1.7),new THREE.Vector3(.3,-.15,2.7)]);
 mesh(tail,new THREE.TubeGeometry(curve,14,.18,7,false),color,0,0,0);mesh(tail,new THREE.ConeGeometry(.2,.62,7),0x69765a,.3,-.14,2.8).rotation.x=Math.PI/2;
 for(let i=0;i<9;i++){const spike=mesh(g,new THREE.ConeGeometry(.11,.35+(i%3)*.05,6),0xb4ae89,0,2.45-Math.abs(i-4)*.08,-1+i*.32);spike.rotation.x=.18;}
 const wings=[];
 for(const side of [-1,1]){const wing=new THREE.Group();wing.position.set(side*.55,2.2,-.35);g.add(wing);
  const p=[[0,0,0],[side*1.25,.85,.15],[side*3.2,.65,1.35],[side*1.8,-.1,1.6],[side*.6,-.2,1.2]];
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(p.flat(),3));geo.setIndex([0,1,4,1,2,3,1,3,4]);geo.computeVertexNormals();
  const membrane=new THREE.Mesh(geo,new THREE.MeshStandardMaterial({color:0x9f8862,side:THREE.DoubleSide,roughness:.85}));membrane.castShadow=true;wing.add(membrane);
  for(const [a,b] of [[0,1],[1,2],[1,3],[1,4]])link(wing,new THREE.Vector3(...p[a]),new THREE.Vector3(...p[b]),.055,color);
  wing.rotation.z=side*.2;wings.push(wing);
 }
 g.userData={kind:'dragon',legs:rigs,wings,neck,jaw,tail};return g;
}
export function createFantasyCreature(kind,color){
 if(kind==='dragon')return createDragon(color);
 const g=new THREE.Group();g.name=kind;
 if(kind==='treant'){
  mesh(g,sphere,0x68513e,0,1.55,0,[.62,1.15,.5]);mesh(g,sphere,0x706046,0,2.7,0,[.53,.5,.48]);
  for(const s of [-1,1]){link(g,new THREE.Vector3(s*.4,1.9,0),new THREE.Vector3(s*1.1,.8,.15),.18,0x6b543c);link(g,new THREE.Vector3(s*.3,1,0),new THREE.Vector3(s*.5,.1,.2),.23,0x6b543c);mesh(g,sphere,0xd6dc8c,s*.18,2.8,-.44,[.065,.05,.05]);}
  for(let i=0;i<5;i++)mesh(g,sphere,0x58794b,(rng(i)-.5)*1.3,3.1+rng(i+8)*.4,(rng(i+2)-.5)*.7,[.57,.43,.5]);
 }else{
  mesh(g,sphere,color,0,.9,0,[.5,.48,.9]);mesh(g,sphere,color,0,1.26,-.87,[.3,.33,.45]);mesh(g,sphere,0xd9c499,0,1.2,-1.25,[.20,.16,.3]);
  for(const s of [-1,1]){mesh(g,new THREE.ConeGeometry(.17,.4,7),color,s*.2,1.68,-.85);for(const z of [-.55,.55])link(g,new THREE.Vector3(s*.35,.8,z),new THREE.Vector3(s*.42,.12,z-.08),.11,color);mesh(g,sphere,0xf3d087,s*.26,1.34,-1.07,[.038,.045,.048]);}
  const tail=mesh(g,new THREE.ConeGeometry(.2,.9,8),color,0,1.1,.98);tail.rotation.x=.8;g.userData.tail=tail;
 }
 g.userData.kind=kind;return g;
}
export function createWorkshop(type,tier=1){
 const g=new THREE.Group();g.name='Workshop-'+type;const wood=0x77583b,stone=0x818782;
 mesh(g,box,stone,0,.13,0,[3,.26,2.4]);
 if(type==='forge'){
  mesh(g,box,stone,.7,.7,.3,[1.2,1.15,1.2]);mesh(g,box,0x34302a,.7,.63,-.32,[.65,.5,.05]);const ember=mesh(g,sphere,0xea903b,.7,.55,-.36,[.32,.20,.04]);ember.material=new THREE.MeshStandardMaterial({color:0xf2a553,emissive:0xe15b16,emissiveIntensity:1.5});
  mesh(g,new THREE.CylinderGeometry(.31,.39,2.1,7),stone,.7,1.85,.3);mesh(g,box,0x3e4749,-.65,1,0,[.8,.3,.48],.7);mesh(g,box,wood,-.65,.5,0,[.65,.8,.65]);
 }else{
  mesh(g,box,wood,0,.95,0,[2.3,.15,1.05]);for(const x of [-.9,.9])for(const z of [-.35,.35])mesh(g,box,wood,x,.52,z,[.13,.9,.13]);
  if(type==='alchemy')for(let i=0;i<5;i++){const c=[0x74b9aa,0xb299cb,0xcab876][i%3];mesh(g,new THREE.CylinderGeometry(.10,.18,.32+i%2*.12,9),c,-.8+i*.39,1.18,0, [1,1,1],.15);mesh(g,new THREE.CylinderGeometry(.055,.065,.12,7),0xbaa079,-.8+i*.39,1.43,0);}else{mesh(g,box,0xcba16d,0,1.1,0,[1.7,.1,.3]);link(g,new THREE.Vector3(-.6,1.16,-.3),new THREE.Vector3(.1,1.16,.3),.035,0x879494);}
 }
 const roof=mesh(g,new THREE.ConeGeometry(2.1,.65,4),tier>1?0x57626b:0x655440,0,2.8,0,[1,1,.8]);roof.rotation.y=Math.PI/4;for(const x of [-1.3,1.3])mesh(g,box,wood,x,1.45,.9,[.13,2.7,.13]);
 for(let i=0;i<tier;i++)mesh(g,new THREE.OctahedronGeometry(.1),0xd8b975,-.3+i*.3,2.45,-1);
 g.userData={kind:'workshop',type,tier};return g;
}
function palm(){const g=new THREE.Group();link(g,new THREE.Vector3(),new THREE.Vector3(.35,4.8,0),.18,0x82674b);for(let j=0;j<7;j++){const a=j/7*Math.PI*2;const leaf=mesh(g,sphere,0x527e4c,.35+Math.cos(a)*1,4.65,Math.sin(a),[1.4,.1,.25]);leaf.rotation.y=-a;leaf.rotation.z=.2*Math.cos(a);}return g;}
function cactus(){const g=new THREE.Group();mesh(g,new THREE.CylinderGeometry(.25,.30,2.3,8),0x789177,0,1.15,0);for(const s of [-1,1]){link(g,new THREE.Vector3(0,1,0),new THREE.Vector3(s*.55,1.05,0),.14,0x789177);mesh(g,new THREE.CylinderGeometry(.14,.16,.85,7),0x789177,s*.55,1.43,0);}return g;}
export function enrichWorld(scene,world,height,factories){
 const group=new THREE.Group();group.name='Everwild-Biomes';scene.add(group);world.fantasy=[];world.workshops=[];
 const ocean=new THREE.Mesh(new THREE.PlaneGeometry(540,540,32,32),new THREE.MeshPhysicalMaterial({color:0x428b9b,roughness:.25,metalness:.12,transparent:true,opacity:.91,clearcoat:.7}));ocean.rotation.x=-Math.PI/2;ocean.position.y=-1.4;group.add(ocean);world.ocean=ocean;
 for(let i=0;i<430;i++){
  const x=rng(i*3+70)*460-230,z=rng(i*3+71)*460-230;if(Math.hypot(x,z)<59||landDistance(x,z)<3)continue;
  const r=regionAt(x,z);let obj;
  if(['tropical','island2'].includes(r.id))obj=palm();
  else if(r.id==='desert')obj=i%3===0?cactus():factories.rock('rock',i%3,0);
  else if(['volcanic','island5','mountain','island1'].includes(r.id)){obj=factories.rock(i%4===0?'iron':'rock',i%3,0);if(r.id==='volcanic'||r.id==='island5')obj.traverse(o=>{if(o.isMesh&&o.material){o.material=o.material.clone();o.material.color.set(0x514a48);}});}
  else if(r.id==='steppe'||r.id==='coast'){if(i%3)continue;obj=factories.bush(i%3,0,true);}
  else obj=(r.id==='snow'||r.id==='island4')?factories.pine(i%3,3):factories.tree(i%3,0);
  const s=.8+rng(i+700)*.7;obj.scale.multiplyScalar(s);obj.position.set(x,height(x,z),z);group.add(obj);
  const type=r.id==='desert'&&i%3===0?'tree':['desert','volcanic','island5','mountain','island1'].includes(r.id)?(i%4===0&&r.id!=='desert'?'ore':'rock'):(r.id==='steppe'||r.id==='coast'?'berries':'tree');
  world.interactables.push({type,object:obj,position:()=>obj.position,radius:1.8,hits:0,maxHits:4,label:type==='tree'?'Couper l’arbre':type==='berries'?'Cueillir les baies':type==='ore'?'Extraire le minerai':'Casser le rocher'});
  if(type!=='berries')world.colliders.push({object:obj,radius:.55*s,active:true});
 }
 // Tall steppe grasses: one draw call, varied warm colors, curved geometry.
 const geo=new THREE.PlaneGeometry(.16,1.2,1,3);geo.translate(0,.6,0);const grass=new THREE.InstancedMesh(geo,new THREE.MeshStandardMaterial({color:0xb5a26a,side:THREE.DoubleSide,roughness:1}),1600);const dummy=new THREE.Object3D();let n=0;
 for(let i=0;i<6500&&n<1600;i++){const x=rng(i*2+900)*240-120,z=rng(i*2+901)*240-120;const r=regionAt(x,z);if(!['steppe','desert','tropical','coast'].includes(r.id)||landDistance(x,z)<4)continue;dummy.position.set(x,height(x,z),z);dummy.rotation.set(0,rng(i+90)*6.28,.1);dummy.scale.set(1,.45+rng(i)*1.1,1);dummy.updateMatrix();grass.setMatrixAt(n++,dummy.matrix);}grass.count=n;group.add(grass);
 // Fauna has actual random levels and combat statistics, concentrated around landmarks.
 for(let j=0;j<REGIONS.length;j++){
  const r=REGIONS[j];if(j===0||r.id==='coast')continue;
  const kind=['volcanic','island1','island5'].includes(r.id)?'dragon':['tropical','swamp','island3'].includes(r.id)?'treant':'direwolf';
  const animal=createFantasyCreature(kind,r.id==='snow'?0xc4cdd0:r.id==='volcanic'||r.id==='island5'?0x8e5946:0x667567);
  const level=r.min+Math.floor(rng(j+3000)*(r.max-r.min+1));animal.userData.level=level;animal.userData.hp=60+level*5;animal.userData.maxHp=animal.userData.hp;animal.userData.damage=5+level*.3;animal.userData.cooldown=0;animal.userData.home={x:r.x+10,z:r.z+9};animal.userData.name=kind==='dragon'?'Dragon':kind==='treant'?'Gardien sylvestre':'Loup des anciens';
  animal.position.set(r.x+10,height(r.x+10,r.z+9),r.z+9);if(kind==='dragon')animal.scale.setScalar(1.5);group.add(animal);world.enemies.push(animal);world.fantasy.push(animal);
  world.interactables.push({type:'fantasy',object:animal,position:()=>animal.position,radius:kind==='dragon'?4:2.3,label:animal.userData.name+' · niv. '+level});
 }
 const sites=[['carpenter',-1,12],['forge',-12,-2],['alchemy',-17,9],['forge',-7,-63],['alchemy',-87,55],['carpenter',68,7]];
 for(const [type,x,z] of sites){const o=createWorkshop(type);o.position.set(x,height(x,z),z);group.add(o);world.workshops.push(o);world.interactables.push({type:'workshop',object:o,position:()=>o.position,radius:3.3,label:(type==='forge'?'Forge':type==='alchemy'?'Table d’alchimie':'Établi de menuiserie')+' · ouvrir l’atelier'});world.colliders.push({object:o,radius:1.1,active:true});}
 // Navigable island destinations, marked by a small medieval beacon.
 for(const r of REGIONS){if(!r.id.startsWith('island')&&r.id!=='coast')continue;const post=new THREE.Group();link(post,new THREE.Vector3(),new THREE.Vector3(0,3,0),.12,0x76583b);const banner=mesh(post,box,0x8faaa0,.5,2.4,0,[.9,.6,.05]);post.position.set(r.x-5,height(r.x-5,r.z),r.z);group.add(post);}
 return {update(dt,time,player){ocean.position.y=-1.4+Math.sin(time*.6)*.015;
  for(const a of world.fantasy){if(!a.visible)continue;const u=a.userData,dist=Math.hypot(a.position.x-player.x,a.position.z-player.z);if(dist>13){const targetX=u.home.x+Math.sin(time*.16+u.level)*3,targetZ=u.home.z+Math.cos(time*.16+u.level)*3;const dx=targetX-a.position.x,dz=targetZ-a.position.z,d=Math.hypot(dx,dz)||1;a.position.x+=dx/d*dt*.55;a.position.z+=dz/d*dt*.55;a.rotation.y=Math.atan2(-dx,-dz);a.position.y=height(a.position.x,a.position.z);}else a.rotation.y+=Math.atan2(Math.sin(Math.atan2(a.position.x-player.x,a.position.z-player.z)-a.rotation.y),Math.cos(Math.atan2(a.position.x-player.x,a.position.z-player.z)-a.rotation.y))*.06;
   if(u.kind==='dragon'){u.wings.forEach((w,i)=>w.rotation.z=(i===0?-1:1)*(.22+Math.sin(time*1.4)*.11));u.tail.rotation.y=Math.sin(time*.9)*.15;u.neck.rotation.x=Math.sin(time*.7)*.035;u.jaw.rotation.x=dist<8?Math.max(0,Math.sin(time*2))*.18:0;u.legs.forEach((l,i)=>l.rotation.x=Math.sin(time*2+i*Math.PI/2)*.07);}else if(u.tail)u.tail.rotation.z=Math.sin(time*2)*.1;
  }
 }};
}
