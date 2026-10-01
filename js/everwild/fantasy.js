import * as THREE from 'three';
import {REGIONS,ISLANDS,landDistance,regionAt,RIVERS} from './geography.js?v=ew5';
import {naturalMaterial,naturalMushroom,naturalPalm,detailAnimal,noise} from './nature.js?v=ew5';
const rng=n=>{const a=Math.sin(n*78.23+1.83)*43871.28;return a-Math.floor(a)};
const materials=new Map();
function mat(color,metal=0){const key=color+':'+metal;if(!materials.has(key))materials.set(key,metal?new THREE.MeshStandardMaterial({color,roughness:.58,metalness:metal}):naturalMaterial('stone',color));return materials.get(key);}
function mesh(g,geo,color,x,y,z,s=[1,1,1],metal=0){const m=new THREE.Mesh(geo,mat(color,metal));m.position.set(x,y,z);m.scale.set(...s);m.castShadow=true;m.receiveShadow=true;g.add(m);return m;}
const sphere=new THREE.SphereGeometry(1,12,8),box=new THREE.BoxGeometry(1,1,1);
function link(g,a,b,r,color){const d=new THREE.Vector3().subVectors(b,a);const m=mesh(g,new THREE.CylinderGeometry(r*.8,r,d.length(),7),color,...a.clone().add(b).multiplyScalar(.5).toArray());m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize());return m;}
function taperedCurve(points,radius,endRadius){
 const curve=new THREE.CatmullRomCurve3(points),frames=curve.computeFrenetFrames(20,false),verts=[],indices=[];
 for(let j=0;j<=20;j++){const t=j/20,p=curve.getPointAt(t),r=radius*(1-t)+endRadius*t;for(let k=0;k<=8;k++){const a=k/8*Math.PI*2,n=frames.normals[j].clone().multiplyScalar(Math.cos(a)*r).addScaledVector(frames.binormals[j],Math.sin(a)*r);verts.push(p.x+n.x,p.y+n.y,p.z+n.z);if(j<20&&k<8){const q=j*9+k;indices.push(q,q+9,q+1,q+1,q+9,q+10);}}}
 const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(verts,3));geo.setIndex(indices);geo.computeVertexNormals();return geo;
}
let scaleTexture=null;
function dragonSkin(color){if(!scaleTexture){const c=document.createElement('canvas');c.width=c.height=256;const ctx=c.getContext('2d');ctx.fillStyle='#ecebe5';ctx.fillRect(0,0,256,256);for(let y=-12;y<270;y+=16)for(let x=-12;x<270;x+=20){const offset=(Math.floor(y/16)%2)*10;ctx.strokeStyle='#a8a99e';ctx.lineWidth=1.2;ctx.beginPath();ctx.moveTo(x+offset,y);ctx.quadraticCurveTo(x+offset+10,y+22,x+offset+20,y);ctx.stroke();ctx.strokeStyle='#ffffff';ctx.beginPath();ctx.moveTo(x+offset+3,y+2);ctx.lineTo(x+offset+10,y+10);ctx.stroke();}scaleTexture=new THREE.CanvasTexture(c);scaleTexture.wrapS=scaleTexture.wrapT=THREE.RepeatWrapping;scaleTexture.repeat.set(3,3);scaleTexture.colorSpace=THREE.SRGBColorSpace;}
 return new THREE.MeshStandardMaterial({color,map:scaleTexture,bumpMap:scaleTexture,bumpScale:.045,roughness:.77});}
export function createDragon(color=0x5d7563){
 const g=new THREE.Group();g.name='Dragon';const rigs=[];
 mesh(g,sphere,color,0,1.8,0,[.8,.85,1.55]);mesh(g,sphere,0xab9671,0,1.5,-.7,[.59,.66,.7]);
 const neck=new THREE.Group();neck.position.set(0,2.1,-1);g.add(neck);
 mesh(neck,taperedCurve([new THREE.Vector3(),new THREE.Vector3(0,.3,-.3),new THREE.Vector3(0,.68,-.6),new THREE.Vector3(0,.75,-1)],.38,.25),color,0,0,0);
 mesh(neck,sphere,color,0,.85,-1.15,[.42,.38,.68]);mesh(neck,sphere,color,0,.7,-1.68,[.29,.21,.46]);
 const jaw=mesh(neck,sphere,0xa59573,0,.54,-1.53,[.28,.10,.43]);
 for(const side of [-1,1]){mesh(neck,sphere,0x29372b,side*.18,.84,-1.89,[.035,.022,.03]);for(let j=0;j<4;j++){const tooth=mesh(neck,new THREE.ConeGeometry(.034,.11,6),0xd6cfad,side*.25,.60,-1.34-j*.13);tooth.rotation.z=Math.PI;}mesh(neck,sphere,color,side*.28,1.06,-1.32,[.18,.09,.3]);}
 for(const side of [-1,1]){
  mesh(neck,sphere,0xe6b859,side*.34,.97,-1.42,[.065,.08,.09]);mesh(neck,sphere,0x17261c,side*.385,.98,-1.43,[.016,.06,.043]);
  const horn=mesh(neck,new THREE.ConeGeometry(.12,.64,8),0xc6b794,side*.3,1.33,-.85);horn.rotation.x=.5;horn.rotation.z=-side*.3;
  for(const z of [-.95,.95]){const leg=new THREE.Group();leg.position.set(side*.65,1.5,z);g.add(leg);mesh(leg,sphere,color,side*.17,-.32,.12,[.24,.52,.30]);link(leg,new THREE.Vector3(side*.2,-.55,.18),new THREE.Vector3(side*.26,-1.25,-.12),.13,color);mesh(leg,sphere,color,side*.27,-1.33,-.29,[.22,.12,.4]);for(let t=0;t<3;t++)mesh(leg,new THREE.ConeGeometry(.047,.22,6),0xd5c9a9,side*.27+(t-1)*.13,-1.34,-.61).rotation.x=-Math.PI/2;rigs.push(leg);}
 }
 const tail=new THREE.Group();tail.position.set(0,1.55,1.25);g.add(tail);
 const curve=new THREE.CatmullRomCurve3([new THREE.Vector3(0,0,0),new THREE.Vector3(.3,-.1,.8),new THREE.Vector3(.5,-.35,1.7),new THREE.Vector3(.3,-.15,2.7)]);
 mesh(tail,taperedCurve(curve.points,.30,.045),color,0,0,0);mesh(tail,new THREE.ConeGeometry(.2,.62,7),0x69765a,.3,-.14,2.8).rotation.x=Math.PI/2;
 for(let i=0;i<9;i++){const spike=mesh(g,new THREE.ConeGeometry(.11,.35+(i%3)*.05,6),0xb4ae89,0,2.45-Math.abs(i-4)*.08,-1+i*.32);spike.rotation.x=.18;}
 const surfaceWing={map:naturalMaterial('cap',0xffffff).map,bump:naturalMaterial('cap',0xffffff).bumpMap};
 const wings=[];
 for(const side of [-1,1]){const wing=new THREE.Group();wing.position.set(side*.55,2.2,-.35);g.add(wing);
  const p=[[0,0,0],[side*1.25,.85,.15],[side*3.2,.65,1.35],[side*1.8,-.1,1.6],[side*.6,-.2,1.2]];
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(p.flat(),3));geo.setAttribute('uv',new THREE.Float32BufferAttribute([0,0,.35,.4,1,1,.7,1,.2,.8],2));geo.setIndex([0,1,4,1,2,3,1,3,4]);geo.computeVertexNormals();
  const membrane=new THREE.Mesh(geo,new THREE.MeshStandardMaterial({color:0x9d927d,map:surfaceWing.map,bumpMap:surfaceWing.bump,bumpScale:.026,side:THREE.DoubleSide,roughness:.8}));membrane.castShadow=true;wing.add(membrane);
  for(const [a,b] of [[0,1],[1,2],[1,3],[1,4]])link(wing,new THREE.Vector3(...p[a]),new THREE.Vector3(...p[b]),.055,color);
  wing.rotation.z=side*.2;wings.push(wing);
 }
 const skin=dragonSkin(color);g.traverse(o=>{if(o.isMesh&&o.material===mat(color))o.material=skin;});
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
  const coat=naturalMaterial('fur',color,.87),cream=naturalMaterial('fur',0xc7c0a9),bodyGeo=new THREE.SphereGeometry(1,20,14);
  const part=(parent,x,y,z,scale,material=coat)=>{const m=new THREE.Mesh(bodyGeo,material);m.position.set(x,y,z);m.scale.set(...scale);m.castShadow=m.receiveShadow=true;parent.add(m);return m;};
  part(g,0,.91,.05,[.29,.37,.79]);part(g,0,1.04,-.42,[.34,.45,.36]);part(g,0,.97,.56,[.32,.39,.31]);part(g,0,.71,-.1,[.24,.15,.52],cream);
  const neck=new THREE.Group();neck.position.set(0,1.19,-.54);g.add(neck);part(neck,0,.12,-.15,[.26,.31,.31]);part(neck,0,.26,-.43,[.235,.24,.28]);part(neck,0,.15,-.67,[.13,.12,.32],cream);part(neck,0,.17,-.95,[.10,.08,.06],naturalMaterial('fur',0x302e29));
  for(const side of [-1,1]){const ear=mesh(neck,new THREE.ConeGeometry(.12,.30,10),color,side*.17,.57,-.34);ear.rotation.z=-side*.16;mesh(neck,sphere,0xd2a36b,side*.207,.32,-.52,[.034,.026,.035]);mesh(neck,sphere,0x151a16,side*.218,.32,-.535,[.012,.018,.016]);}
  const legs=[];for(const side of [-1,1])for(const z of [-.44,.56]){const leg=new THREE.Group();leg.position.set(side*.21,.91,z);g.add(leg);part(leg,0,-.12,.04,[.105,.25,.14]);part(leg,0,-.4,z>0?.13:-.04,[.065,.22,.065]);part(leg,0,-.65,z>0?.11:-.03,[.055,.16,.05],cream);part(leg,0,-.78,-.10,[.085,.067,.14]);legs.push(leg);}
  const tail=mesh(g,taperedCurve([new THREE.Vector3(0,0,0),new THREE.Vector3(0,-.12,.4),new THREE.Vector3(.1,-.42,.8)],.13,.045),color,0,1.13,.71);tail.material=coat;g.userData.tail=tail;g.userData.legs=legs;g.userData.neck=neck;
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
 // Timber frame, pitched overlapping shingles and foundation edging.
 const roofColor=tier>1?0x53616a:0x604d39;
 for(const side of [-1,1]){const roof=mesh(g,box,roofColor,0,2.87,side*.73,[3.6,.11,1.85]);roof.rotation.x=side*.44;}
 const tiles=new THREE.InstancedMesh(new THREE.BoxGeometry(.39,.055,.48),mat(0x9a8060),80);const dummy=new THREE.Object3D();let tn=0;
 for(const side of [-1,1])for(let row=0;row<4;row++)for(let col=0;col<10;col++){
  const z=side*(.17+row*.36);dummy.position.set(-1.73+col*.38,3.24-Math.abs(z)*.47,z);dummy.rotation.set(side*.44,0,0);dummy.updateMatrix();tiles.setMatrixAt(tn,dummy.matrix);tiles.setColorAt(tn,new THREE.Color(tier>1?0x7c8b92:col%3===0?0xb79b74:0x99815e));tn++;
 }tiles.castShadow=true;tiles.receiveShadow=true;g.add(tiles);
 mesh(g,box,0x604832,0,3.25,0,[3.75,.13,.13]);
 for(const x of [-1.3,1.3])for(const z of [-.88,.88]){mesh(g,box,wood,x,1.3,z,[.17,2.4,.17]);mesh(g,new THREE.CylinderGeometry(.2,.23,.24,6),stone,x,.36,z);}
 for(const z of [-.9,.9])mesh(g,box,0x5b4230,0,2.45,z,[2.9,.14,.14]);
 for(const x of [-1.3,1.3]){link(g,new THREE.Vector3(x,2.0,.88),new THREE.Vector3(x*.6,2.45,.88),.06,0x5e4630);mesh(g,box,0x5b4230,x,2.45,0,[.15,.15,2]);}
 for(let j=0;j<8;j++){mesh(g,box,j%2?0x737d76:0x939b8e,-1.35+j*.39,.21,-1.15,[.37,.17,.15]);mesh(g,box,j%2?0x737d76:0x939b8e,-1.35+j*.39,.21,1.15,[.37,.17,.15]);}
 if(type==='forge'){for(let j=0;j<5;j++)for(const x of [.13,1.27])mesh(g,box,0xa39d8b,x,.32+j*.19,.3,[.13,.15,1.12]);for(let j=0;j<7;j++)mesh(g,new THREE.TorusGeometry(.335,.025,4,8),0x646f69,.7,1+j*.27,.3).rotation.x=Math.PI/2;}
 for(let i=0;i<tier;i++)mesh(g,new THREE.OctahedronGeometry(.1),0xd8b975,-.3+i*.3,2.45,-1);

 g.userData={kind:'workshop',type,tier};return g;
}
function palm(){return naturalPalm(3);}
function cactus(){const g=new THREE.Group();mesh(g,new THREE.CylinderGeometry(.25,.30,2.3,8),0x789177,0,1.15,0);for(const s of [-1,1]){link(g,new THREE.Vector3(0,1,0),new THREE.Vector3(s*.55,1.05,0),.14,0x789177);mesh(g,new THREE.CylinderGeometry(.14,.16,.85,7),0x789177,s*.55,1.43,0);}return g;}
export function enrichWorld(scene,world,height,factories){
 const group=new THREE.Group();group.name='Everwild-Biomes';scene.add(group);world.fantasy=[];world.workshops=[];
 const ocean=new THREE.Mesh(new THREE.PlaneGeometry(540,540,32,32),new THREE.MeshPhysicalMaterial({color:0x428b9b,roughness:.25,metalness:.12,transparent:true,opacity:.91,clearcoat:.7}));ocean.rotation.x=-Math.PI/2;ocean.position.y=-1.4;group.add(ocean);world.ocean=ocean;
 for(let i=0;i<1700;i++){
  const x=rng(i*3+70)*460-230,z=rng(i*3+71)*460-230;if(Math.hypot(x,z)<59||landDistance(x,z)<3)continue;
  const r=regionAt(x,z);let obj;
  if(['tropical','island2'].includes(r.id))obj=palm();
  else if(r.id==='mushroom')obj=i%3===0?naturalMushroom(i):factories.tree(i%6,0);
  else if(r.id==='canyon'){obj=factories.rock('rock',i%3,0);obj.scale.y=2.3;obj.traverse(o=>{if(o.isMesh&&o.material){o.material=o.material.clone();o.material.color.set(0x9b7050);}});}
  else if(r.id==='desert')obj=i%3===0?cactus():factories.rock('rock',i%3,0);
  else if(['volcanic','island5','mountain','island1'].includes(r.id)){obj=factories.rock(i%4===0?'iron':'rock',i%3,0);if(r.id==='volcanic'||r.id==='island5')obj.traverse(o=>{if(o.isMesh&&o.material){o.material=o.material.clone();o.material.color.set(0x514a48);}});}
  else if(r.id==='steppe'||r.id==='coast'){if(i%3)continue;obj=factories.bush(i%3,0,true);}
  else obj=(r.id==='snow'||r.id==='island4'||r.id==='island1')?factories.pine(i%6,r.id==='snow'?3:0):factories.tree(i%6,0);
  const s=.75+rng(i+700)*.6;obj.scale.multiplyScalar(s);obj.position.set(x,height(x,z),z);group.add(obj);if(obj.userData.natural){world.treeGroups.push(obj);world.animated.push(obj);}
  const type=r.id==='desert'&&i%3===0?'tree':['desert','canyon','volcanic','island5','mountain','island1'].includes(r.id)?(i%4===0&&r.id!=='desert'?'ore':'rock'):(r.id==='steppe'||r.id==='coast'?'berries':'tree');
  world.interactables.push({type,object:obj,position:()=>obj.position,radius:1.8,hits:0,maxHits:4,label:type==='tree'?'Couper l’arbre':type==='berries'?'Cueillir les baies':type==='ore'?'Extraire le minerai':'Casser le rocher'});
  if(type!=='berries')world.colliders.push({object:obj,radius:.55*s,active:true});
 }
 // Tributaries descending from Vantuman toward the forest and coastal valleys.
 for(const route of RIVERS){const curve=new THREE.CatmullRomCurve3(route.map(([x,z])=>new THREE.Vector3(x,0,z)));const points=curve.getPoints(120),verts=[],idx=[];
  for(let k=0;k<points.length;k++){const p=points[k],q=points[Math.min(k+1,points.length-1)],prev=points[Math.max(0,k-1)],dx=q.x-prev.x,dz=q.z-prev.z,len=Math.hypot(dx,dz)||1;
   for(const side of [-1,1]){const x=p.x-dz/len*side*.85,z=p.z+dx/len*side*.85;verts.push(x,height(x,z)+.07,z);}if(k<points.length-1){const n=k*2;idx.push(n,n+1,n+2,n+1,n+3,n+2);}}
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(verts,3));geo.setIndex(idx);geo.computeVertexNormals();const water=new THREE.Mesh(geo,new THREE.MeshStandardMaterial({color:0x548f9b,roughness:.27,metalness:.18,side:THREE.DoubleSide}));group.add(water);
 }
 // Tall steppe grasses: one draw call, varied warm colors, curved geometry.
 const geo=new THREE.PlaneGeometry(.16,1.2,1,3);geo.translate(0,.6,0);const grass=new THREE.InstancedMesh(geo,new THREE.MeshStandardMaterial({color:0xb5a26a,side:THREE.DoubleSide,roughness:1}),1600);const dummy=new THREE.Object3D();let n=0;
 for(let i=0;i<6500&&n<1600;i++){const x=rng(i*2+900)*460-230,z=rng(i*2+901)*460-230;const r=regionAt(x,z);if(!['steppe','desert','tropical','coast'].includes(r.id)||landDistance(x,z)<4)continue;dummy.position.set(x,height(x,z),z);dummy.rotation.set(0,rng(i+90)*6.28,.1);dummy.scale.set(1,.45+rng(i)*1.1,1);dummy.updateMatrix();grass.setMatrixAt(n++,dummy.matrix);}grass.count=n;group.add(grass);
 // Fauna has actual random levels and combat statistics, concentrated around landmarks.
 for(let j=0;j<REGIONS.length;j++){
  const r=REGIONS[j];if(j===0||r.id==='coast')continue;
  const kind=['volcanic','island1','island5'].includes(r.id)?'dragon':['tropical','swamp','island3'].includes(r.id)?'treant':'direwolf';
  const animal=createFantasyCreature(kind,r.id==='snow'?0xc4cdd0:r.id==='volcanic'||r.id==='island5'?0x8e5946:0x667567);
  const level=r.min+Math.floor(rng(j+3000)*(r.max-r.min+1));animal.userData.level=level;animal.userData.hp=60+level*5;animal.userData.maxHp=animal.userData.hp;animal.userData.damage=5+level*.3;animal.userData.cooldown=0;animal.userData.home={x:r.x,z:r.z};animal.userData.name=kind==='dragon'?'Dragon':kind==='treant'?'Gardien sylvestre':'Loup des anciens';
  animal.position.set(r.x,height(r.x,r.z),r.z);if(kind==='dragon')animal.scale.setScalar(1.5);group.add(animal);world.enemies.push(animal);world.fantasy.push(animal);
  world.interactables.push({type:'fantasy',object:animal,position:()=>animal.position,radius:kind==='dragon'?4:2.3,label:animal.userData.name+' · niv. '+level});
 }
 const sites=[['carpenter',-1,12],['forge',-12,-2],['alchemy',-17,9],['forge',65,-30],['alchemy',-5,-123],['carpenter',-43,55]];
 for(const [type,x,z] of sites){const o=createWorkshop(type);o.position.set(x,height(x,z),z);group.add(o);world.workshops.push(o);world.interactables.push({type:'workshop',object:o,position:()=>o.position,radius:3.3,label:(type==='forge'?'Forge':type==='alchemy'?'Table d’alchimie':'Établi de menuiserie')+' · ouvrir l’atelier'});world.colliders.push({object:o,radius:1.1,active:true});}
 // Navigable island destinations, marked by a small medieval beacon.
 for(const r of REGIONS){if(!r.id.startsWith('island')&&r.id!=='coast')continue;const post=new THREE.Group();link(post,new THREE.Vector3(),new THREE.Vector3(0,3,0),.12,0x76583b);const banner=mesh(post,box,0x8faaa0,.5,2.4,0,[.9,.6,.05]);post.position.set(r.x-5,height(r.x-5,r.z),r.z);group.add(post);}
 return {update(dt,time,player){ocean.position.y=-1.4+Math.sin(time*.6)*.015;
  for(const a of world.fantasy){if(!a.visible)continue;const u=a.userData,dist=Math.hypot(a.position.x-player.x,a.position.z-player.z);if(dist>13){const targetX=u.home.x+Math.sin(time*.16+u.level)*3,targetZ=u.home.z+Math.cos(time*.16+u.level)*3;const dx=targetX-a.position.x,dz=targetZ-a.position.z,d=Math.hypot(dx,dz)||1;a.position.x+=dx/d*dt*.55;a.position.z+=dz/d*dt*.55;a.rotation.y=Math.atan2(-dx,-dz);a.position.y=height(a.position.x,a.position.z);}else a.rotation.y+=Math.atan2(Math.sin(Math.atan2(a.position.x-player.x,a.position.z-player.z)-a.rotation.y),Math.cos(Math.atan2(a.position.x-player.x,a.position.z-player.z)-a.rotation.y))*.06;
   if(u.kind==='dragon'){u.wings.forEach((w,i)=>w.rotation.z=(i===0?-1:1)*(.22+Math.sin(time*1.4)*.11));u.tail.rotation.y=Math.sin(time*.9)*.15;u.neck.rotation.x=Math.sin(time*.7)*.035;u.jaw.rotation.x=dist<8?Math.max(0,Math.sin(time*2))*.18:0;u.legs.forEach((l,i)=>l.rotation.x=Math.sin(time*2+i*Math.PI/2)*.07);}else if(u.tail){u.tail.rotation.z=Math.sin(time*1.2)*.1;if(u.legs)u.legs.forEach((l,i)=>l.rotation.x=dist>13?Math.sin(time*3.4+(i===0||i===3?0:Math.PI))*.23:Math.sin(time*.8+i)*.018);}
  }
 }};
}
