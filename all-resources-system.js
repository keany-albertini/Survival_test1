import * as THREE from 'three';

const cid=()=>sessionStorage.getItem('survival_character_id')||'guest';
const invKey=()=>`survival_inventory_${cid()}`;
const progKey=()=>`survival_progression_${cid()}`;
const readInv=()=>{try{return JSON.parse(localStorage.getItem(invKey())||'{}')}catch{return{}}};
const saveInv=v=>{localStorage.setItem(invKey(),JSON.stringify(v));window.refreshInventoryVisibility?.();window.refreshInventoryQuantityBadges?.();window.refreshInventoryManagement?.();window.refreshRecoveredInventory?.()};
const readLevel=()=>{try{return JSON.parse(localStorage.getItem(progKey())||'{}').level||1}catch{return 1}};
const toast=t=>{const e=document.getElementById('toast');if(!e)return;e.textContent=t;e.classList.add('show');clearTimeout(window.__allResToast);window.__allResToast=setTimeout(()=>e.classList.remove('show'),1500)};

const RES={
 branches:{name:'Branches',icon:'🌿',level:1,kind:'plant'},
 fiber:{name:'Fibres / paille',icon:'🌾',level:1,kind:'plant'},
 water:{name:'Eau',icon:'💧',level:1,kind:'water'},
 wood:{name:'Bois',icon:'🪵',level:2,kind:'wood'},
 stone:{name:'Pierre',icon:'🪨',level:2,kind:'rock'},
 dirt:{name:'Terre',icon:'🟫',level:3,kind:'soil'},
 sand:{name:'Sable',icon:'🏖️',level:3,kind:'soil'},
 clay:{name:'Argile',icon:'🧱',level:5,kind:'soil'},
 hide:{name:'Peau',icon:'🟤',level:6,kind:'animal'},
 medicinal:{name:'Plantes médicinales',icon:'🌿',level:7,kind:'plant'},
 bone:{name:'Os / cornes / dents',icon:'🦴',level:8,kind:'animal'},
 fat:{name:'Graisse animale',icon:'🟡',level:9,kind:'animal'},
 textilePlants:{name:'Plantes textiles',icon:'🌱',level:12,kind:'plant'},
 resin:{name:'Résine',icon:'🟠',level:13,kind:'plant'},
 fur:{name:'Fourrure',icon:'🐺',level:14,kind:'animal'},
 wool:{name:'Laine',icon:'☁️',level:18,kind:'animal'},
 limestone:{name:'Calcaire',icon:'⬜',level:21,kind:'rock'},
 ice:{name:'Glace',icon:'🧊',level:23,kind:'rock'},
 salt:{name:'Sel',icon:'🧂',level:24,kind:'rock'},
 basalt:{name:'Basalte',icon:'⬛',level:31,kind:'rock'},
 venom:{name:'Venins / glandes',icon:'🧪',level:32,kind:'animal'},
 copper:{name:'Cuivre',icon:'🟠',level:35,kind:'ore'},
 tin:{name:'Étain',icon:'⚪',level:36,kind:'ore'},
 iron:{name:'Fer',icon:'⛓️',level:38,kind:'ore'},
 sulfur:{name:'Soufre',icon:'🟨',level:40,kind:'ore'},
 obsidian:{name:'Obsidienne',icon:'🔮',level:42,kind:'rock'},
 silver:{name:'Argent',icon:'⚪',level:44,kind:'ore'},
 gold:{name:'Or',icon:'🟡',level:47,kind:'ore'}
};
window.survivalAllResourceDefs=RES;

const S={scene:null,camera:null,ready:false,nodes:[],nearest:null};
const oldRender=THREE.WebGLRenderer.prototype.render;
THREE.WebGLRenderer.prototype.render=function(scene,camera){S.scene=scene;S.camera=camera;if(!S.ready&&scene.children.length>6){S.ready=true;setTimeout(init,700)}return oldRender.call(this,scene,camera)};

function groundY(x,z){if(!S.scene)return 1;const ray=new THREE.Raycaster(new THREE.Vector3(x,300,z),new THREE.Vector3(0,-1,0),0,500);const hits=ray.intersectObjects(S.scene.children,true).filter(h=>!h.object.userData.allResource&&!h.object.userData.animal&&!h.object.userData.buildPiece&&!h.object.userData.station);return hits[0]?.point.y??1}
function mat(kind,level){const colors={plant:0x5f8d43,wood:0x75502d,rock:0x777975,ore:level>=40?0x8d7a52:0x6d6f72,soil:0x8b6748,animal:0x8a6a4f,water:0x4aa4cc};return new THREE.MeshStandardMaterial({color:colors[kind]||0x777777,roughness:kind==='ore'?.65:.95,metalness:kind==='ore'?.35:0})}
function makeNode(k,d){let o;if(d.kind==='plant'){o=new THREE.Group();for(let i=0;i<5;i++){const m=new THREE.Mesh(new THREE.ConeGeometry(.28,1.5,5),mat(d.kind,d.level));m.position.set((i-2)*.28,.75,Math.sin(i)*.25);m.rotation.z=(i-2)*.08;o.add(m)}}else if(d.kind==='wood'){o=new THREE.Mesh(new THREE.CylinderGeometry(.45,.6,2.2,8),mat(d.kind,d.level));o.rotation.z=Math.PI/2}else if(d.kind==='soil'){o=new THREE.Mesh(new THREE.SphereGeometry(1.1,10,7),mat(d.kind,d.level));o.scale.y=.45}else if(d.kind==='animal'){o=new THREE.Mesh(new THREE.IcosahedronGeometry(1.1,0),mat(d.kind,d.level))}else if(d.kind==='water'){o=new THREE.Mesh(new THREE.CylinderGeometry(1.15,1.15,.18,16),new THREE.MeshStandardMaterial({color:0x4aa4cc,transparent:true,opacity:.7}))}else{o=new THREE.Mesh(new THREE.DodecahedronGeometry(1.35,0),mat(d.kind,d.level))}o.userData.allResource=true;o.userData.resourceKey=k;o.userData.requiredLevel=d.level;o.userData.amount=d.level>=35?2:3;return o}
function spawnNodes(){let i=0;for(const [k,d] of Object.entries(RES)){if(['dirt','sand'].includes(k)){i++;continue}for(let n=0;n<4;n++){const angle=(i*1.77+n*1.31)%6.283;let radius=85+((i*113+n*79)%520);if(['ice'].includes(k))radius=320+((i+n)*37)%260;if(['basalt','obsidian','sulfur'].includes(k))radius=350+((i+n)*29)%220;if(['gold','silver','iron','copper','tin','limestone'].includes(k))radius=240+((i+n)*43)%320;const x=Math.cos(angle)*radius,z=Math.sin(angle)*radius,y=groundY(x,z);if(y<.4)continue;const o=makeNode(k,d);o.position.set(x,y+(d.kind==='plant'?.2:1),z);S.scene.add(o);S.nodes.push(o)}i++}}
function button(){let b=document.getElementById('allResourceBtn');if(b)return b;b=document.createElement('button');b.id='allResourceBtn';b.hidden=true;b.style='position:fixed;z-index:34;right:102px;bottom:292px;width:108px;min-height:46px;padding:6px;border-radius:11px;border:1px solid #d1ad5d88;background:#132019e8;color:#f3dda2;font-size:8px;font-weight:900';document.body.appendChild(b);b.onclick=harvest;return b}
function nearest(){if(!S.camera)return null;let best=null,bd=8.5;for(const n of S.nodes){if(!n.visible)continue;const d=n.position.distanceTo(S.camera.position);if(d<bd){bd=d;best=n}}return best}
function update(){const b=button(),n=nearest();S.nearest=n;if(!n){b.hidden=true;return}const d=RES[n.userData.resourceKey],lvl=readLevel();b.hidden=false;b.textContent=lvl<d.level?`🔒 ${d.name} • NIV ${d.level}`:`${d.icon} RÉCOLTER ${d.name.toUpperCase()}`}
function harvest(){const n=S.nearest||nearest();if(!n)return;const k=n.userData.resourceKey,d=RES[k],lvl=readLevel();if(lvl<d.level)return toast(`${d.name} se débloque au niveau ${d.level}`);const inv=readInv(),amt=n.userData.amount||1;inv[k]=(inv[k]||0)+amt;saveInv(inv);window.addSurvivalXP?.(Math.max(6,Math.round(4+d.level/8)),'Récolte '+d.name);toast(`+${amt} ${d.name}`);n.visible=false;setTimeout(()=>n.visible=true,35000)}
function ensureInventoryRows(){const bag=document.querySelector('#inventoryPanel .bag-view');if(!bag)return;const inv=readInv();for(const[k,d]of Object.entries(RES)){let r=bag.querySelector(`[data-item="${k}"]`);if(!r){r=document.createElement('div');r.className='inv-row';r.dataset.item=k;r.innerHTML=`<span>${d.icon} ${d.name}</span><b>0</b>`;bag.appendChild(r)}const q=inv[k]||0;r.querySelector('b').textContent=q;r.hidden=!(q>0)}}
function init(){if(!S.scene)return;spawnNodes();button();setInterval(update,200);setInterval(ensureInventoryRows,800);ensureInventoryRows()}
