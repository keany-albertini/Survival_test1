import * as THREE from 'three';

const cid=()=>sessionStorage.getItem('survival_character_id')||'guest';
const ikey=()=>`survival_inventory_${cid()}`;
const bkey=()=>`survival_builds_${cid()}`;
const readInv=()=>{try{return JSON.parse(localStorage.getItem(ikey())||'{}')}catch{return{}}};
const saveInv=v=>{localStorage.setItem(ikey(),JSON.stringify(v));window.refreshInventoryQuantityBadges?.();window.refreshInventoryVisibility?.();window.refreshGroundInventory?.()};
const readBuilds=()=>{try{return JSON.parse(localStorage.getItem(bkey())||'[]')}catch{return[]}};
const saveBuilds=v=>localStorage.setItem(bkey(),JSON.stringify(v));
const toast=t=>{const e=document.getElementById('toast');if(!e)return;e.textContent=t;e.classList.add('show');clearTimeout(window.__buildToast);window.__buildToast=setTimeout(()=>e.classList.remove('show'),1800)};

const DEF={
 foundation:{name:'Fondation bois',icon:'🧱',station:'workbench',cost:{wood:12},size:[8,.6,8]},
 wall:{name:'Mur bois',icon:'🪵',station:'workbench',cost:{wood:8},size:[8,5,.5]},
 halfwall:{name:'Demi-mur bois',icon:'🪵',station:'workbench',cost:{wood:5},size:[8,2.5,.5]},
 ceiling:{name:'Plafond bois',icon:'▦',station:'workbench',cost:{wood:8},size:[8,.5,8]},
 pillar:{name:'Pilier bois',icon:'🪵',station:'workbench',cost:{wood:6},size:[.6,5,.6]},
 doorframe:{name:'Cadre de porte',icon:'🚪',station:'workbench',cost:{wood:9},size:[8,5,.5]},
 stairs:{name:'Escalier bois',icon:'🪜',station:'workbench',cost:{wood:10},size:[8,4,8]},
 ramp:{name:'Rampe bois',icon:'📐',station:'workbench',cost:{wood:8},size:[8,3,8]},
 roof:{name:'Toit bois',icon:'🏠',station:'workbench',cost:{wood:10},size:[8,1.8,8]}
};
window.survivalBuildDefs=DEF;

const S={scene:null,camera:null,ready:false,preview:null,previewType:null,previewValid:false,previewSnap:null,rot:0,objects:[],records:[]};
const prevRender=THREE.WebGLRenderer.prototype.render;
THREE.WebGLRenderer.prototype.render=function(scene,camera){S.scene=scene;S.camera=camera;if(!S.ready&&scene.children.length>6){S.ready=true;setTimeout(init,300)}updatePreview();return prevRender.call(this,scene,camera)};

const wood=()=>new THREE.MeshStandardMaterial({color:0x7a5231,roughness:.95});
const ghost=()=>new THREE.MeshStandardMaterial({color:0x42c96b,transparent:true,opacity:.48,roughness:.8,depthWrite:false});
function groundY(x,z){if(!S.scene)return 1;const ray=new THREE.Raycaster(new THREE.Vector3(x,300,z),new THREE.Vector3(0,-1,0),0,500);const hits=ray.intersectObjects(S.scene.children,true).filter(h=>!h.object.userData.buildPiece&&!h.object.userData.expansion&&!h.object.userData.animal&&!h.object.userData.progressionNode&&!h.object.userData.sleepObject);return hits[0]?.point.y??1}
function meshFor(type,preview=false){const d=DEF[type],m=preview?ghost():wood();let o;
 if(type==='doorframe'){o=new THREE.Group();const sideGeo=new THREE.BoxGeometry(.65,5,.5),topGeo=new THREE.BoxGeometry(8,.65,.5);for(const x of[-3.65,3.65]){const p=new THREE.Mesh(sideGeo,m);p.position.set(x,2.5,0);o.add(p)}const top=new THREE.Mesh(topGeo,m);top.position.set(0,4.68,0);o.add(top)}
 else if(type==='stairs'||type==='ramp'){o=new THREE.Group();for(let i=0;i<6;i++){const step=new THREE.Mesh(new THREE.BoxGeometry(8,.55,1.35),m);step.position.set(0,.32+i*.58,-3.3+i*1.3);o.add(step)}}
 else if(type==='roof'){o=new THREE.Group();const a=new THREE.Mesh(new THREE.BoxGeometry(8,.35,4.6),m),b=a.clone();a.rotation.x=.43;b.rotation.x=-.43;a.position.set(0,1, -1.8);b.position.set(0,1,1.8);o.add(a,b)}
 else {o=new THREE.Mesh(new THREE.BoxGeometry(...d.size),m);if(type==='wall'||type==='halfwall'||type==='pillar')o.position.y=d.size[1]/2;else o.position.y=d.size[1]/2}
 o.userData.buildPiece=true;o.userData.buildType=type;return o}
function setTint(obj,ok){obj.traverse?.(n=>{if(n.material&&n.material.color)n.material.color.setHex(ok?0x42c96b:0xd94a44)});if(obj.material?.color)obj.material.color.setHex(ok?0x42c96b:0xd94a44)}

function snapPoints(r){const a=[],x=r.x,z=r.z,y=r.y||0,rot=r.rot||0;const c=Math.cos(rot),s=Math.sin(rot);const tx=(lx,lz)=>({x:x+lx*c-lz*s,z:z+lx*s+lz*c});
 const add=(kind,lx,ly,lz,rr=rot,extra={})=>{const p=tx(lx,lz);a.push({kind,x:p.x,y:y+ly,z:p.z,rot:rr,owner:r.id,...extra})};
 if(r.type==='foundation'){add('wall',0,.3,-4,rot);add('wall',4,.3,0,rot+Math.PI/2);add('wall',0,.3,4,rot+Math.PI);add('wall',-4,.3,0,rot-Math.PI/2);add('pillar',-4,.3,-4);add('pillar',4,.3,-4);add('pillar',4,.3,4);add('pillar',-4,.3,4);add('ceiling',0,5.3,0,rot,{supportDepth:0});add('foundation',8,0,0,rot);add('foundation',-8,0,0,rot);add('foundation',0,0,8,rot);add('foundation',0,0,-8,rot)}
 if(['wall','halfwall','doorframe'].includes(r.type)){add('ceiling',0,r.type==='halfwall'?2.5:5,0,rot,{supportDepth:0});add('wall',0,r.type==='halfwall'?2.5:5,0,rot)}
 if(r.type==='pillar')add('ceiling',0,5,0,rot,{supportDepth:0});
 if(r.type==='ceiling'){const dep=r.supportDepth??1;if(dep<2){add('ceiling',8,0,0,rot,{supportDepth:dep+1});add('ceiling',-8,0,0,rot,{supportDepth:dep+1});add('ceiling',0,0,8,rot,{supportDepth:dep+1});add('ceiling',0,0,-8,rot,{supportDepth:dep+1})}add('wall',0,0,-4,rot);add('wall',4,0,0,rot+Math.PI/2);add('wall',0,0,4,rot+Math.PI);add('wall',-4,0,0,rot-Math.PI/2);add('pillar',-4,0,-4);add('pillar',4,0,-4);add('pillar',4,0,4);add('pillar',-4,0,4)}
 return a}
function allSnaps(){return S.records.flatMap(snapPoints)}
function compatible(type,kind){if(type==='foundation')return kind==='foundation';if(['wall','halfwall','doorframe'].includes(type))return kind==='wall';if(type==='pillar')return kind==='pillar';if(['ceiling','stairs','ramp','roof'].includes(type))return kind==='ceiling';return false}
function nearestSnap(type,target,max=5){let best=null,bd=max;for(const s of allSnaps()){if(!compatible(type,s.kind))continue;const d=Math.hypot(s.x-target.x,s.z-target.z,(s.y??0)-target.y);if(d<bd){best=s;bd=d}}return best}
function occupied(s,type){return S.records.some(r=>r.id!==s.owner&&Math.hypot(r.x-s.x,r.z-s.z,(r.y||0)-(s.y||0))<1.1&&r.type===type)}
function stationNear(kind){if(!S.camera)return false;return S.records.some(r=>r.type===kind&&Math.hypot(r.x-S.camera.position.x,r.z-S.camera.position.z)<14)}

function begin(type){const v=readInv();if(!(v[type]>0)){toast('Fabrique d’abord cette pièce');return}cancelPreview();S.previewType=type;S.rot=0;S.preview=meshFor(type,true);S.scene.add(S.preview);document.getElementById('buildPlaceBtn').hidden=false;document.getElementById('buildRotateBtn').hidden=false;document.getElementById('buildCancelBtn').hidden=false;toast('Mode construction : vert = autorisé, rouge = interdit')}
function cancelPreview(){if(S.preview){S.scene.remove(S.preview);S.preview=null}S.previewType=null;S.previewSnap=null;for(const id of['buildPlaceBtn','buildRotateBtn','buildCancelBtn']){const e=document.getElementById(id);if(e)e.hidden=true}}
function updatePreview(){if(!S.preview||!S.camera)return;const d=new THREE.Vector3();S.camera.getWorldDirection(d);d.y=0;d.normalize();const t=S.camera.position.clone().add(d.multiplyScalar(11));t.y=groundY(t.x,t.z);let pos={x:t.x,y:t.y,z:t.z,rot:S.rot},snap=nearestSnap(S.previewType,t);
 let valid=true;if(S.previewType==='foundation'){if(snap){pos={x:snap.x,y:snap.y,z:snap.z,rot:snap.rot+S.rot};valid=!occupied(snap,'foundation')}else valid=t.y>0.2}
 else {if(!snap)valid=false;else{pos={x:snap.x,y:snap.y,z:snap.z,rot:snap.rot+S.rot};valid=!occupied(snap,S.previewType);if(S.previewType==='ceiling')pos.supportDepth=snap.supportDepth??0}}
 S.preview.position.set(pos.x,pos.y,pos.z);S.preview.rotation.y=pos.rot;S.previewValid=valid;S.previewSnap={...pos};setTint(S.preview,valid)}
function placePreview(){if(!S.preview||!S.previewType)return;if(!S.previewValid){toast('Placement impossible ici');return}const v=readInv(),type=S.previewType;if(!(v[type]>0)){cancelPreview();return}const r={id:Date.now().toString(36)+Math.random().toString(36).slice(2,5),type,x:S.previewSnap.x,y:S.previewSnap.y,z:S.previewSnap.z,rot:S.previewSnap.rot,supportDepth:S.previewSnap.supportDepth??0};v[type]--;saveInv(v);S.records.push(r);saveBuilds(S.records);spawnRecord(r);window.addSurvivalXP?.(5,'Construction');toast(DEF[type].name+' posé');cancelPreview()}
function spawnRecord(r){const o=meshFor(r.type,false);o.position.set(r.x,r.y,r.z);o.rotation.y=r.rot||0;o.userData.recordId=r.id;S.scene.add(o);S.objects.push(o)}

function craft(type){const d=DEF[type],v=readInv();if(d.station==='workbench'&&!stationNear('workbench')){toast('Approche-toi d’un atelier pour fabriquer cette pièce');return}if(Object.entries(d.cost).some(([k,n])=>(v[k]||0)<n)){toast('Ressources insuffisantes');return}for(const[k,n]of Object.entries(d.cost))v[k]-=n;v[type]=(v[type]||0)+1;saveInv(v);window.addSurvivalXP?.(7,'Craft construction');toast(d.name+' fabriqué');refreshPanel()}
function refreshPanel(){const root=document.getElementById('snapCraftList');if(!root)return;const v=readInv(),near=stationNear('workbench');root.querySelectorAll('[data-buildcraft]').forEach(c=>{const k=c.dataset.buildcraft,d=DEF[k],btn=c.querySelector('button'),can=near&&Object.entries(d.cost).every(([a,n])=>(v[a]||0)>=n);btn.disabled=!can;c.querySelector('small').textContent=(near?'Atelier proche':'Atelier requis')+' • '+Object.entries(d.cost).map(([a,n])=>`${n} ${a==='wood'?'bois':a}`).join(' + ')})}
function openCraft(){let p=document.getElementById('snapCraftPanel');if(p){p.remove();return}p=document.createElement('div');p.id='snapCraftPanel';p.className='snap-panel';p.innerHTML='<div class="snap-card"><button class="snap-close">✕</button><h3>ATELIER DE CONSTRUCTION</h3><p>Les pièces de structure se fabriquent près d’un atelier placé.</p><div id="snapCraftList" class="snap-list"></div></div>';document.body.appendChild(p);p.querySelector('.snap-close').onclick=()=>p.remove();const root=p.querySelector('#snapCraftList');for(const[k,d]of Object.entries(DEF)){const c=document.createElement('div');c.className='snap-recipe';c.dataset.buildcraft=k;c.innerHTML=`<b>${d.icon} ${d.name}</b><small></small><button>FABRIQUER</button>`;c.querySelector('button').onclick=()=>craft(k);root.appendChild(c)}refreshPanel()}
function openBuild(){const v=readInv(),a=Object.keys(DEF).filter(k=>(v[k]||0)>0);if(!a.length){toast('Aucune pièce de construction dans le sac');return}let p=document.getElementById('snapBuildPanel');p?.remove();p=document.createElement('div');p.id='snapBuildPanel';p.className='snap-panel';p.innerHTML='<div class="snap-card"><button class="snap-close">✕</button><h3>CONSTRUIRE</h3><div class="snap-list"></div></div>';document.body.appendChild(p);p.querySelector('.snap-close').onclick=()=>p.remove();const root=p.querySelector('.snap-list');for(const k of a){const d=DEF[k],b=document.createElement('button');b.className='snap-choice';b.textContent=`${d.icon} ${d.name} ×${v[k]}`;b.onclick=()=>{p.remove();begin(k)};root.appendChild(b)}}
function ui(){const st=document.createElement('style');st.textContent=`.snap-actions{position:fixed;z-index:45;right:18px;bottom:350px;display:flex;flex-direction:column;gap:6px}.snap-actions button,.snap-main{border:1px solid #d0ad5c77;background:#102029e8;color:#f0d28e;border-radius:9px;padding:8px 10px;font-size:8px;font-weight:900}.snap-main{position:fixed;z-index:35;right:20px;bottom:338px}.snap-craft-main{position:fixed;z-index:35;right:20px;bottom:382px}.snap-panel{position:fixed;z-index:90;inset:0;background:#02070bdd;display:grid;place-items:center;padding:12px}.snap-card{position:relative;width:min(94vw,520px);max-height:82vh;overflow:auto;background:#0a141af8;border:1px solid #caa75d77;border-radius:15px;padding:14px;color:#fff}.snap-card h3{color:#efd184;margin:0 0 6px}.snap-card p{color:#9fb0b5;font-size:9px}.snap-close{position:absolute;right:10px;top:10px}.snap-list{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px}.snap-recipe,.snap-choice{border:1px solid #ffffff18;background:#122028;color:#fff;border-radius:9px;padding:9px;text-align:left}.snap-recipe b{display:block;color:#efd184;font-size:9px}.snap-recipe small{display:block;color:#a6b4b8;font-size:7px;margin:4px 0 7px}.snap-recipe button{width:100%;padding:6px;background:#29402a;color:#e6f0dc;border:1px solid #ffffff20;border-radius:6px;font-size:7px}.snap-recipe button:disabled{opacity:.35}.snap-choice{font-size:9px;color:#efd184}.snap-place{position:fixed;z-index:46;right:20px;bottom:430px}.snap-rotate{position:fixed;z-index:46;right:108px;bottom:430px}.snap-cancel{position:fixed;z-index:46;right:196px;bottom:430px}@media(max-width:520px){.snap-list{grid-template-columns:1fr}}`;document.head.appendChild(st);
 const b=document.createElement('button');b.className='snap-main';b.textContent='🏗️ CONSTRUIRE';b.onclick=openBuild;document.body.appendChild(b);const c=document.createElement('button');c.className='snap-main snap-craft-main';c.textContent='🛠️ ATELIER';c.onclick=openCraft;document.body.appendChild(c);
 const mk=(id,cls,txt,fn)=>{const x=document.createElement('button');x.id=id;x.className=cls;x.textContent=txt;x.hidden=true;x.onclick=fn;document.body.appendChild(x)};mk('buildPlaceBtn','snap-main snap-place','POSER',placePreview);mk('buildRotateBtn','snap-main snap-rotate','TOURNER',()=>{S.rot+=Math.PI/2});mk('buildCancelBtn','snap-main snap-cancel','ANNULER',cancelPreview);
 document.getElementById('buildModeBtn')?.remove();document.querySelectorAll('[data-exp-recipe="foundation"],[data-exp-recipe="wall"],[data-exp-recipe="ceiling"]').forEach(e=>e.style.display='none')}
function init(){S.records=readBuilds();for(const r of S.records)spawnRecord(r);ui();setInterval(refreshPanel,800)}
