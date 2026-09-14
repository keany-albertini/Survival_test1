import * as THREE from 'three';

const cid=()=>sessionStorage.getItem('survival_character_id')||'guest';
const invKey=()=>`survival_inventory_${cid()}`;
const progKey=()=>`survival_progression_${cid()}`;
const equipKey=()=>`survival_equipped_${cid()}`;
const depKey=()=>`survival_depleted_resources_${cid()}`;
const readJSON=(k,d={})=>{try{return {...d,...JSON.parse(localStorage.getItem(k)||'{}')}}catch{return {...d}}};
const readInv=()=>readJSON(invKey());
const saveInv=v=>{localStorage.setItem(invKey(),JSON.stringify(v));window.refreshInventoryVisibility?.();window.refreshInventoryQuantityBadges?.();window.refreshInventoryManagement?.();window.refreshRecoveredInventory?.();window.refreshCraftInventory?.()};
const level=()=>readJSON(progKey(),{level:1}).level||1;
const equipped=()=>localStorage.getItem(equipKey())||'';
const toast=t=>{const e=document.getElementById('toast');if(!e)return;e.textContent=t;e.classList.add('show');clearTimeout(window.__worldV2Toast);window.__worldV2Toast=setTimeout(()=>e.classList.remove('show'),1600)};

const TOOL_TIER={axe:1,pickaxe:1,shovel:1,reinforced_axe:2,reinforced_pickaxe:2,iron_axe:3,iron_pickaxe:3};
const TOOL_NAMES={axe:'hache primitive',pickaxe:'pioche primitive',shovel:'pelle',reinforced_axe:'hache renforcée',reinforced_pickaxe:'pioche renforcée',iron_axe:'hache en fer',iron_pickaxe:'pioche en fer'};
const ADV_TOOLS={
 reinforced_axe:{name:'Hache renforcée',icon:'🪓',level:21,cost:{wood:6,stone:4,resin:2},tier:2,kind:'axe'},
 reinforced_pickaxe:{name:'Pioche renforcée',icon:'⛏️',level:21,cost:{wood:4,stone:6,resin:2},tier:2,kind:'pickaxe'},
 iron_axe:{name:'Hache en fer',icon:'🪓',level:38,cost:{iron_ingot:4,wood:3},tier:3,kind:'axe'},
 iron_pickaxe:{name:'Pioche en fer',icon:'⛏️',level:38,cost:{iron_ingot:5,wood:2},tier:3,kind:'pickaxe'}
};
window.survivalItemDefs=window.survivalItemDefs||{};
for(const[k,d]of Object.entries(ADV_TOOLS))window.survivalItemDefs[k]={label:d.name,icon:d.icon,kind:'tool'};

const RES={
 branches:{name:'Branches',icon:'🌿',level:1,tool:'hand',tier:0,kind:'plant',respawn:30000},
 fiber:{name:'Fibres / paille',icon:'🌾',level:1,tool:'hand',tier:0,kind:'plant',respawn:30000},
 medicinal:{name:'Plantes médicinales',icon:'🌿',level:7,tool:'hand',tier:0,kind:'plant',respawn:45000},
 textilePlants:{name:'Plantes textiles',icon:'🌱',level:12,tool:'hand',tier:0,kind:'plant',respawn:45000},
 wood:{name:'Bois',icon:'🪵',level:2,tool:'axe',tier:1,kind:'tree',respawn:60000},
 resin:{name:'Résine',icon:'🟠',level:13,tool:'axe',tier:1,kind:'tree',respawn:60000},
 stone:{name:'Pierre',icon:'🪨',level:2,tool:'pickaxe',tier:1,kind:'rock',respawn:55000},
 clay:{name:'Argile',icon:'🧱',level:5,tool:'shovel',tier:1,kind:'soil',respawn:45000},
 limestone:{name:'Calcaire',icon:'⬜',level:21,tool:'pickaxe',tier:2,kind:'rock',respawn:70000},
 salt:{name:'Sel',icon:'🧂',level:24,tool:'pickaxe',tier:2,kind:'rock',respawn:70000},
 ice:{name:'Glace',icon:'🧊',level:23,tool:'pickaxe',tier:2,kind:'rock',respawn:70000},
 basalt:{name:'Basalte',icon:'⬛',level:31,tool:'pickaxe',tier:2,kind:'rock',respawn:80000},
 copper:{name:'Cuivre',icon:'🟠',level:35,tool:'pickaxe',tier:2,kind:'ore',respawn:85000},
 tin:{name:'Étain',icon:'⚪',level:36,tool:'pickaxe',tier:2,kind:'ore',respawn:85000},
 iron:{name:'Fer',icon:'⛓️',level:38,tool:'pickaxe',tier:2,kind:'ore',respawn:90000},
 sulfur:{name:'Soufre',icon:'🟨',level:40,tool:'pickaxe',tier:2,kind:'ore',respawn:90000},
 obsidian:{name:'Obsidienne',icon:'🔮',level:42,tool:'pickaxe',tier:3,kind:'rock',respawn:100000},
 silver:{name:'Argent',icon:'⚪',level:44,tool:'pickaxe',tier:3,kind:'ore',respawn:110000},
 gold:{name:'Or',icon:'🟡',level:47,tool:'pickaxe',tier:3,kind:'ore',respawn:120000}
};
window.survivalAllResourceDefs=RES;

const BIOMES={
 'Prairies':{trees:28,rocks:14,resources:{branches:14,fiber:18,wood:16,stone:8,medicinal:5},animals:[['Lapin',0x9a9184,.48,{meat:1}],['Cerf',0x886748,1,{meat:4,hide:1,bone:1}],['Sanglier',0x4c392d,.9,{meat:4,hide:1,fat:1}]]},
 'Vallée fluviale':{trees:38,rocks:12,resources:{branches:14,fiber:18,wood:22,stone:7,clay:9,medicinal:8},animals:[['Cerf',0x886748,1,{meat:4,hide:1,bone:1}],['Sanglier',0x4c392d,.9,{meat:4,hide:1,fat:1}],['Loutre',0x594536,.55,{meat:2,hide:1}]]},
 'Forêt tropicale':{trees:58,rocks:12,resources:{branches:18,fiber:16,wood:30,resin:12,medicinal:10,stone:6},animals:[['Sanglier',0x4c392d,.9,{meat:4,hide:1,fat:1}],['Cerf',0x886748,1,{meat:4,hide:1,bone:1}]]},
 'Jungle':{trees:70,rocks:10,resources:{branches:20,fiber:22,wood:34,resin:14,medicinal:12,textilePlants:10},animals:[['Sanglier',0x4c392d,.9,{meat:4,hide:1,fat:1}],['Varan',0x526044,.65,{meat:2,hide:1,venom:1}]]},
 'Savane':{trees:18,rocks:22,resources:{branches:8,fiber:14,wood:8,stone:12,medicinal:3},animals:[['Gazelle',0xa98958,.8,{meat:3,hide:1}],['Lion',0xb58a4c,1.05,{meat:5,hide:2,bone:1}]]},
 'Désert':{trees:5,rocks:28,resources:{branches:3,fiber:8,stone:15,salt:9,sulfur:4},animals:[['Chacal',0x8b704d,.72,{meat:2,hide:1}],['Dromadaire',0xa77f52,1.15,{meat:5,hide:2}]]},
 'Oasis':{trees:28,rocks:8,resources:{branches:10,fiber:16,wood:12,medicinal:8,clay:6},animals:[['Gazelle',0xa98958,.8,{meat:3,hide:1}],['Dromadaire',0xa77f52,1.1,{meat:5,hide:2}]]},
 'Montagnes':{trees:18,rocks:50,resources:{wood:8,stone:24,limestone:12,copper:7,tin:6,iron:8,silver:3,gold:2},animals:[['Bouquetin',0x746553,.85,{meat:3,hide:1,bone:1}],['Loup',0x5b6266,.85,{meat:3,hide:1,fur:1}],['Ours',0x49362c,1.2,{meat:7,hide:2,fur:2,fat:2}]]},
 'Toundra':{trees:14,rocks:32,resources:{branches:5,wood:6,stone:16,ice:6,iron:3},animals:[['Loup',0x666d72,.85,{meat:3,hide:1,fur:1}],['Renard',0xa9683c,.62,{meat:1,fur:1}]]},
 'Neige':{trees:18,rocks:38,resources:{wood:5,stone:16,ice:18,iron:4,silver:2},animals:[['Loup blanc',0xc7d0d2,.85,{meat:3,hide:1,fur:2}],['Renard polaire',0xe4e8e7,.6,{meat:1,fur:1}],['Ours blanc',0xd9ddda,1.25,{meat:7,hide:2,fur:3,fat:2}]]},
 'Plage':{trees:10,rocks:16,resources:{branches:8,fiber:7,wood:5,stone:7,salt:5},animals:[['Tortue',0x526b45,.55,{meat:2,hide:1}]]},
 'Volcan':{trees:2,rocks:58,resources:{stone:15,basalt:20,sulfur:12,obsidian:9,iron:6,gold:3},animals:[['Varan',0x4d4a3c,.7,{meat:2,hide:1,venom:1}]]}
};
window.survivalBiomeProfiles=BIOMES;

const S={scene:null,camera:null,ready:false,objs:[],nodes:[],animals:[],lastBiome:'',lastSector:'',nearest:null};
const oldRender=THREE.WebGLRenderer.prototype.render;
THREE.WebGLRenderer.prototype.render=function(scene,camera){S.scene=scene;S.camera=camera;if(!S.ready&&scene.children.length>8){S.ready=true;setTimeout(init,900)}return oldRender.call(this,scene,camera)};
const biome=()=>{const p=(document.getElementById('topinfo')?.textContent||'').split('•').map(x=>x.trim());return p[1]||'Prairies'};
const ground=(x,z)=>{if(!S.scene)return-5;const r=new THREE.Raycaster(new THREE.Vector3(x,260,z),new THREE.Vector3(0,-1,0),0,520);const h=r.intersectObjects(S.scene.children,true).filter(v=>!v.object.userData.unifiedWorld&&!v.object.userData.progressionNode&&!v.object.userData.allResource&&!v.object.userData.biomeExtra&&!v.object.userData.animal&&!v.object.userData.buildPiece&&!v.object.userData.station);return h[0]?.point.y??-5};
const mat=(c,r=.95,m=0)=>new THREE.MeshStandardMaterial({color:c,roughness:r,metalness:m});
function seeded(seed){let x=2166136261;for(let i=0;i<seed.length;i++){x^=seed.charCodeAt(i);x=Math.imul(x,16777619)}return()=>((x=Math.imul(x^x>>>15,2246822519)^Math.imul(x^x>>>13,3266489917),((x^x>>>16)>>>0)/4294967296))}
function clear(){for(const o of S.objs)S.scene.remove(o);S.objs=[];S.nodes=[];S.animals=[]}
function tree(x,z,s=1,snow=false){const y=ground(x,z);if(y<.5)return;const g=new THREE.Group();g.userData.unifiedWorld=true;const tr=new THREE.Mesh(new THREE.CylinderGeometry(.4,.68,5.2,6),mat(0x5b3c24));tr.position.y=2.6;g.add(tr);for(let i=0;i<3;i++){const top=new THREE.Mesh(new THREE.ConeGeometry(2.6-i*.35,3.4,7),mat(snow?0xdce8e8:0x356b38));top.position.y=5.0+i*1.5;g.add(top)}g.position.set(x,y,z);g.scale.setScalar(s);S.scene.add(g);S.objs.push(g)}
function rock(x,z,s=1,dark=false){const y=ground(x,z);if(y<.5)return;const o=new THREE.Mesh(new THREE.DodecahedronGeometry(1.8,0),mat(dark?0x3a3838:0x737774));o.userData.unifiedWorld=true;o.position.set(x,y+1,z);o.scale.set(s*.9,s*.65,s);S.scene.add(o);S.objs.push(o)}
function resourceModel(k,d){let o;if(d.kind==='tree'){o=new THREE.Group();const t=new THREE.Mesh(new THREE.CylinderGeometry(.45,.7,4.8,6),mat(0x604125));t.position.y=2.4;const c=new THREE.Mesh(new THREE.ConeGeometry(2.5,5.5,7),mat(0x2e6334));c.position.y=6;o.add(t,c)}else if(d.kind==='plant'){o=new THREE.Group();for(let i=0;i<5;i++){const m=new THREE.Mesh(new THREE.ConeGeometry(.25,1.35,5),mat(k==='medicinal'?0x4f934f:0x6f9146));m.position.set((i-2)*.25,.68,Math.sin(i)*.2);o.add(m)}}else if(d.kind==='soil'){o=new THREE.Mesh(new THREE.SphereGeometry(1.05,10,7),mat(0x8a6748));o.scale.y=.45}else{o=new THREE.Group();const base=new THREE.Mesh(new THREE.DodecahedronGeometry(1.45,0),mat(d.kind==='ore'?0x5d6163:k==='obsidian'?0x241f31:k==='basalt'?0x3a393a:0x747875,.8,d.kind==='ore'?.35:0));o.add(base);if(d.kind==='ore'){const vein=new THREE.Mesh(new THREE.DodecahedronGeometry(.65,0),mat(k==='gold'?0xd4aa32:k==='silver'?0xc4cbd0:k==='copper'?0xb76d3e:k==='sulfur'?0xc9b23d:0x676e72,.45,.7));vein.position.set(.55,.45,.35);o.add(vein)}}o.userData.unifiedWorld=true;o.userData.resourceKey=k;return o}
function node(id,k,x,z){const d=RES[k],y=ground(x,z);if(!d||y<.5)return;const dep=readJSON(depKey());if((dep[id]||0)>Date.now())return;const o=resourceModel(k,d);o.position.set(x,y+(d.kind==='plant'?.15:d.kind==='soil'?.2:1),z);o.userData.nodeId=id;S.scene.add(o);S.objs.push(o);S.nodes.push(o)}
function animalModel(name,color,size,loot,x,z){const y=ground(x,z);if(y<.5)return;const g=new THREE.Group();g.userData.unifiedWorld=true;g.userData.animal=true;g.userData.species=name;g.userData.loot=loot;g.userData.hp=Math.max(1,Math.round(size*3));g.userData.dir=Math.random()*6.283;g.userData.turn=0;const b=new THREE.Mesh(new THREE.SphereGeometry(1,8,6),mat(color));b.scale.set(1.5,.75,.65);b.position.y=1.05;const h=new THREE.Mesh(new THREE.SphereGeometry(.5,8,6),mat(color));h.position.set(1.25,1.3,0);g.add(b,h);for(const xx of[-.6,.6])for(const zz of[-.35,.35]){const l=new THREE.Mesh(new THREE.CylinderGeometry(.08,.1,.9,5),mat(color));l.position.set(xx,.45,zz);g.add(l)}g.position.set(x,y,z);g.scale.setScalar(size);S.scene.add(g);S.objs.push(g);S.animals.push(g)}
function populate(){if(!S.camera)return;const b=biome(),sx=Math.floor(S.camera.position.x/180),sz=Math.floor(S.camera.position.z/180),sector=`${b}:${sx}:${sz}`;if(sector===S.lastSector)return;S.lastSector=sector;S.lastBiome=b;clear();document.querySelectorAll('#resourceAction,#allResourceBtn').forEach(e=>e.style.display='none');if(S.scene)S.scene.traverse?.(o=>{if(o.userData?.progressionNode||o.userData?.allResource||o.userData?.biomeExtra)o.visible=false});const p=BIOMES[b]||BIOMES.Prairies,rng=seeded(sector),cx=sx*180+90,cz=sz*180+90;const scatter=(count,fn,min=18,max=145)=>{for(let i=0;i<count;i++){const a=rng()*6.283,r=min+rng()*(max-min);fn(cx+Math.cos(a)*r,cz+Math.sin(a)*r,i)}};scatter(p.trees,(x,z)=>tree(x,z,.65+rng()*.75,b==='Neige'));scatter(p.rocks,(x,z)=>rock(x,z,.5+rng()*.8,b==='Volcan'||b==='Montagnes'||b==='Neige'));for(const[k,count]of Object.entries(p.resources||{}))scatter(Math.min(count,18),(x,z,i)=>node(`${sector}:${k}:${i}`,k,x,z),25,155);const animals=p.animals||[];for(let i=0;i<Math.min(12,animals.length*4);i++){const a=rng()*6.283,r=45+rng()*125,[n,c,s,l]=animals[i%animals.length];animalModel(n,c,s,l,cx+Math.cos(a)*r,cz+Math.sin(a)*r)}}
function currentToolTier(kind){const e=equipped();if(kind==='axe')return e==='iron_axe'?3:e==='reinforced_axe'?2:e==='axe'?1:0;if(kind==='pickaxe')return e==='iron_pickaxe'?3:e==='reinforced_pickaxe'?2:e==='pickaxe'?1:0;if(kind==='shovel')return e==='shovel'?1:0;return 0}
function canHarvest(d){if(level()<d.level)return[false,`Niveau ${d.level} requis`];if(d.tool==='hand')return[true,''];const t=currentToolTier(d.tool);if(t<d.tier){const need=d.tool==='axe'?(d.tier===3?'hache en fer':d.tier===2?'hache renforcée':'hache primitive'):(d.tool==='pickaxe'?(d.tier===3?'pioche en fer':d.tier===2?'pioche renforcée':'pioche primitive'):'pelle');return[false,`Il faut une ${need}`]}return[true,'']}
function actionBtn(){let b=document.getElementById('worldResourceAction');if(b)return b;b=document.createElement('button');b.id='worldResourceAction';b.hidden=true;b.style='position:fixed;z-index:36;right:102px;bottom:292px;width:112px;min-height:46px;padding:6px;border-radius:11px;border:1px solid #d1ad5d88;background:#132019e8;color:#f3dda2;font-size:8px;font-weight:900';b.onclick=harvest;document.body.appendChild(b);return b}
function nearestNode(){if(!S.camera)return null;let best=null,bd=8.5;for(const n of S.nodes){if(!n.visible)continue;const d=n.position.distanceTo(S.camera.position);if(d<bd){bd=d;best=n}}return best}
function updateAction(){const b=actionBtn(),n=nearestNode();S.nearest=n;if(!n){b.hidden=true;return}const d=RES[n.userData.resourceKey],[ok,msg]=canHarvest(d);b.hidden=false;b.textContent=ok?`${d.icon} RÉCOLTER ${d.name.toUpperCase()}`:`🔒 ${d.name.toUpperCase()} • ${msg.toUpperCase()}`}
function harvest(){const n=S.nearest||nearestNode();if(!n)return;const k=n.userData.resourceKey,d=RES[k],[ok,msg]=canHarvest(d);if(!ok)return toast(msg);const v=readInv(),tier=d.tool==='hand'?0:currentToolTier(d.tool),amt=Math.max(1,2+tier+(d.kind==='plant'?1:0));v[k]=(v[k]||0)+amt;saveInv(v);const dep=readJSON(depKey());dep[n.userData.nodeId]=Date.now()+d.respawn;localStorage.setItem(depKey(),JSON.stringify(dep));n.visible=false;window.addSurvivalXP?.(Math.round(8+d.level/6+tier*2),`Récolte ${d.name}`);toast(`+${amt} ${d.name}`)}
function hunt(){if(!S.camera)return;let best=null,bd=8.5;for(const a of S.animals){if(!a.visible)continue;const d=a.position.distanceTo(S.camera.position);if(d<bd){bd=d;best=a}}if(!best)return toast('Aucun animal à portée');best.userData.hp--;if(best.userData.hp>0)return toast(`${best.userData.species} touché`);best.visible=false;const v=readInv();for(const[k,n]of Object.entries(best.userData.loot||{}))v[k]=(v[k]||0)+n;saveInv(v);window.addSurvivalXP?.(18,'Chasse');toast(`${best.userData.species} dépouillé`)}
function huntBtn(){let b=document.getElementById('unifiedHuntBtn');if(b)return;b=document.createElement('button');b.id='unifiedHuntBtn';b.textContent='⚔️ CHASSER';b.style='position:fixed;z-index:35;right:20px;bottom:200px;padding:9px 12px;border-radius:10px;border:1px solid #c97868;background:#351714dd;color:#ffd6ca;font-size:9px;font-weight:900';b.onclick=hunt;document.body.appendChild(b)}
function rows(){const bag=document.querySelector('#inventoryPanel .bag-view');if(!bag)return;const v=readInv();const all={...RES,hide:{name:'Peau',icon:'🟤'},fur:{name:'Fourrure',icon:'🐺'},wool:{name:'Laine',icon:'☁️'},bone:{name:'Os / cornes / dents',icon:'🦴'},fat:{name:'Graisse animale',icon:'🟡'},venom:{name:'Venins / glandes',icon:'🧪'},meat:{name:'Viande',icon:'🥩'},...ADV_TOOLS};for(const[k,d]of Object.entries(all)){let r=bag.querySelector(`[data-item="${k}"]`);if(!r){r=document.createElement('div');r.className='inv-row';r.dataset.item=k;r.innerHTML=`<span>${d.icon||'◆'} ${d.name}</span>${ADV_TOOLS[k]?'<button class="equip-world-tool">ÉQUIPER</button>':''}<b>0</b>`;if(ADV_TOOLS[k])r.querySelector('button').onclick=()=>{if((readInv()[k]||0)>0){localStorage.setItem(equipKey(),k);toast(`${d.name} équipée`)}};bag.appendChild(r)}const q=v[k]||0;r.querySelector('b').textContent=q;r.hidden=!(q>0)}}
function addToolCraft(){const cv=document.querySelector('#inventoryPanel .craft-view');if(!cv)return;let root=cv.querySelector('#advancedToolCraftV2');if(!root){root=document.createElement('div');root.id='advancedToolCraftV2';root.innerHTML='<div style="color:#f0d28e;font-weight:900;margin:10px 0 6px">OUTILS AMÉLIORÉS</div>';cv.appendChild(root)}for(const[k,d]of Object.entries(ADV_TOOLS)){if(root.querySelector(`[data-tool="${k}"]`))continue;const c=document.createElement('div');c.className='craft-card';c.dataset.tool=k;c.innerHTML=`<div class="craft-title"><span>${d.icon} ${d.name}</span><button class="craft-btn">FABRIQUER</button></div><div class="craft-cost">Niv. ${d.level} • ${Object.entries(d.cost).map(([a,n])=>`${n} ${a==='iron_ingot'?'lingots de fer':a==='wood'?'bois':a==='stone'?'pierre':a==='resin'?'résine':a}`).join(' + ')}</div>`;c.querySelector('button').onclick=()=>{const v=readInv();if(level()<d.level)return toast(`Niveau ${d.level} requis`);if(Object.entries(d.cost).some(([a,n])=>(v[a]||0)<n))return toast('Ressources insuffisantes');for(const[a,n]of Object.entries(d.cost))v[a]-=n;v[k]=(v[k]||0)+1;saveInv(v);window.addSurvivalXP?.(22,'Outil amélioré');rows();toast(`${d.name} fabriquée`)};root.appendChild(c)}}
function refreshCraft(){addToolCraft();const v=readInv();document.querySelectorAll('#advancedToolCraftV2 [data-tool]').forEach(c=>{const d=ADV_TOOLS[c.dataset.tool],b=c.querySelector('button');b.disabled=level()<d.level||Object.entries(d.cost).some(([a,n])=>(v[a]||0)<n)})}
function tickAnimals(){if(!S.camera)return;for(const a of S.animals){if(!a.visible)continue;a.userData.turn-=.2;if(a.userData.turn<=0){a.userData.dir+=(Math.random()-.5)*1.4;a.userData.turn=5+Math.random()*12}a.position.x+=Math.cos(a.userData.dir)*.12;a.position.z+=Math.sin(a.userData.dir)*.12;a.rotation.y=-a.userData.dir;const y=ground(a.position.x,a.position.z);if(y>.5)a.position.y=y}}
function init(){actionBtn();huntBtn();setInterval(populate,900);setInterval(updateAction,220);setInterval(rows,900);setInterval(refreshCraft,1100);setInterval(tickAnimals,200);populate();rows();refreshCraft();document.getElementById('inventoryBtn')?.addEventListener('click',()=>setTimeout(()=>{rows();refreshCraft()},80))}
