import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.169.0/build/three.module.js";
import { createPlayer, makeGhost } from "./models.js?v=21";
import { createWorld, terrainHeight, getRiverX, setWorldSeason, updateWorld, createBuildObject } from "./world.js?v=21";

const canvas=document.getElementById("game3d");
const renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:"high-performance"});
renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.7));
renderer.shadowMap.enabled=true;
renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=1.12;

const scene=new THREE.Scene();
scene.background=new THREE.Color(0xa8b994);
scene.fog=new THREE.Fog(0x9eb38d,30,88);

const hemi=new THREE.HemisphereLight(0xcde2bd,0x3b3024,1.05);
scene.add(hemi);
const sun=new THREE.DirectionalLight(0xffe0a8,1.85);
sun.castShadow=true;
sun.shadow.mapSize.set(1536,1536);
sun.shadow.camera.left=-28;sun.shadow.camera.right=28;sun.shadow.camera.top=28;sun.shadow.camera.bottom=-28;
sun.shadow.camera.near=.5;sun.shadow.camera.far=90;
sun.shadow.bias=-.00035;
scene.add(sun);
const fill=new THREE.DirectionalLight(0x8ca5c7,.30);fill.position.set(-20,14,-18);scene.add(fill);

let viewSize=18;
const camera=new THREE.OrthographicCamera(-viewSize,viewSize,viewSize,-viewSize,.1,160);
camera.position.set(14,17,14);

const world=createWorld(scene);
const player=createPlayer();
scene.add(player);

const state={
  x:-4,z:4,facing:new THREE.Vector3(0,0,1),
  hp:100,hunger:100,thirst:100,stamina:100,
  inventory:{wood:18,stone:18,ore:0,gold:0,berries:5,meat:1,cooked:0,seeds:4,grain:0},
  selected:"axe",mounted:false,day:1,dayProgress:.31,season:0,
  buildMode:false,buildIndex:0,buildings:[],lastSave:0
};

const buildTypes=[
  {id:"stone_wall",label:"Mur de pierre",cost:{stone:12,wood:4},radius:1.65},
  {id:"stone_tower",label:"Tour de guet",cost:{stone:28,wood:8},radius:1.45},
  {id:"palisade",label:"Palissade",cost:{wood:18},radius:1.8}
];
let buildPreview=null;
let buildValid=false;

const keys=Object.create(null);
const joy={x:0,y:0,id:null,originX:0,originY:0,strength:0};
const motion={
  velocity:new THREE.Vector2(0,0),
  yaw:0,
  targetYaw:0,
  cameraFocus:new THREE.Vector3(-4,0,4)
};
let last=performance.now(),elapsed=0,toastTimer=null,nearest=null;

const ui={
  hpBar:document.getElementById("hpBar"),hpText:document.getElementById("hpText"),
  hungerBar:document.getElementById("hungerBar"),hungerText:document.getElementById("hungerText"),
  thirstBar:document.getElementById("thirstBar"),thirstText:document.getElementById("thirstText"),
  staminaBar:document.getElementById("staminaBar"),staminaText:document.getElementById("staminaText"),
  day:document.getElementById("dayLabel"),clock:document.getElementById("clockLabel"),season:document.getElementById("seasonLabel"),
  prompt:document.getElementById("prompt"),toast:document.getElementById("toast"),loot:document.getElementById("lootFeed"),
  quickbar:document.getElementById("quickbar"),minimap:document.getElementById("minimap"),
  buildPanel:document.getElementById("buildPanel"),buildPiece:document.getElementById("buildPieceLabel"),buildCost:document.getElementById("buildCostLabel"),
  actionBtn:document.getElementById("actionBtn"),buildBtn:document.getElementById("buildBtn")
};

const seasonNames=["🌱 Printemps","☀️ Été","🍂 Automne","❄️ Hiver"];
const seasonSky=[0xa9bf9d,0xc4bb87,0xb38b68,0x9dacb3];

function resize(){
  const w=innerWidth,h=innerHeight;
  renderer.setSize(w,h,false);
  const aspect=w/h;
  camera.left=-viewSize*aspect;camera.right=viewSize*aspect;camera.top=viewSize;camera.bottom=-viewSize;camera.updateProjectionMatrix();
}
addEventListener("resize",resize);resize();

function clamp(v,a,b){return Math.max(a,Math.min(b,v));}
function damp(current,target,lambda,dt){return current+(target-current)*(1-Math.exp(-lambda*dt));}
function dampAngle(current,target,lambda,dt){
  const delta=Math.atan2(Math.sin(target-current),Math.cos(target-current));
  return current+delta*(1-Math.exp(-lambda*dt));
}
function dampRotation(obj,axis,target,lambda,dt){
  obj.rotation[axis]=damp(obj.rotation[axis],target,lambda,dt);
}
function setBar(el,text,val){const v=clamp(val,0,100);el.style.width=v+"%";text.textContent=Math.round(v);}
function showToast(msg){
  clearTimeout(toastTimer);ui.toast.textContent=msg;ui.toast.classList.add("show");
  toastTimer=setTimeout(()=>ui.toast.classList.remove("show"),1800);
}
function addLoot(icon,label,amount=1){
  const line=document.createElement("div");line.className="loot-line";line.innerHTML="<span>"+icon+"</span><strong>"+label+" +"+amount+"</strong>";
  ui.loot.prepend(line);while(ui.loot.children.length>5)ui.loot.lastChild.remove();
  setTimeout(()=>{line.style.opacity="0";setTimeout(()=>line.remove(),240)},5200);
}
function give(id,amount,icon,label){
  state.inventory[id]=(state.inventory[id]||0)+amount;addLoot(icon,label,amount);renderQuickbar();
}
function hasCost(cost){return Object.entries(cost).every(([k,v])=>(state.inventory[k]||0)>=v);}
function payCost(cost){for(const [k,v] of Object.entries(cost))state.inventory[k]-=v;renderQuickbar();}
function costText(cost){const names={wood:"bois",stone:"pierre"};return Object.entries(cost).map(([k,v])=>v+" "+(names[k]||k)).join(" • ");}

const quickItems=[
  {id:"axe",icon:"🪓",key:"1"},{id:"pickaxe",icon:"⛏️",key:"2"},{id:"sword",icon:"🗡️",key:"3"},
  {id:"build",icon:"🏰",key:"4"},{id:"berries",icon:"🍒",key:"5",count:"berries"},
  {id:"cooked",icon:"🍖",key:"6",count:"cooked"},{id:"wood",icon:"🪵",key:"7",count:"wood"},
  {id:"stone",icon:"🪨",key:"8",count:"stone"},{id:"ore",icon:"💎",key:"9",count:"ore"}
];
function renderQuickbar(){
  ui.quickbar.innerHTML="";
  for(const it of quickItems){
    const b=document.createElement("button");b.className="qslot"+(state.selected===it.id?" active":"");b.innerHTML="<span>"+it.icon+"</span><small>"+it.key+"</small>"+(it.count?"<b>"+(state.inventory[it.count]||0)+"</b>":"");
    b.addEventListener("click",()=>selectItem(it.id));ui.quickbar.appendChild(b);
  }
}
function selectItem(id){
  if(id==="build"){toggleBuild(true);return;}
  state.selected=id;renderQuickbar();
}

const inputForward=new THREE.Vector3();
const inputRight=new THREE.Vector3();
const worldUp=new THREE.Vector3(0,1,0);

function inputVector(){
  let sx=0,sy=0;
  if(keys.KeyA||keys.KeyQ||keys.ArrowLeft)sx-=1;
  if(keys.KeyD||keys.ArrowRight)sx+=1;
  if(keys.KeyW||keys.KeyZ||keys.ArrowUp)sy-=1;
  if(keys.KeyS||keys.ArrowDown)sy+=1;

  if(Math.abs(sx)+Math.abs(sy)===0){
    sx=joy.x;
    sy=joy.y;
  }

  const length=Math.hypot(sx,sy);
  if(length<=.08)return {x:0,z:0,strength:0};

  const nx=sx/length;
  const ny=sy/length;

  // Déplacement relatif à la caméra : pousser le doigt vers le haut
  // déplace réellement le personnage vers le haut de l'écran.
  camera.getWorldDirection(inputForward);
  inputForward.y=0;
  inputForward.normalize();
  inputRight.crossVectors(inputForward,worldUp).normalize();

  const wx=inputRight.x*nx + inputForward.x*(-ny);
  const wz=inputRight.z*nx + inputForward.z*(-ny);

  return {x:wx,z:wz,strength:Math.min(1,length)};
}

function canMove(x,z){
  if(Math.abs(x)>56||Math.abs(z)>56)return false;
  for(const c of world.colliders){
    if(!c.active||!c.object.visible)continue;
    if(state.mounted&&c.object===world.horse)continue;
    const dx=x-c.object.position.x,dz=z-c.object.position.z;
    if(dx*dx+dz*dz<(c.radius+.34)*(c.radius+.34))return false;
  }
  for(const b of world.buildings){
    if(!b.object.visible)continue;
    const dx=x-b.object.position.x,dz=z-b.object.position.z;
    if(dx*dx+dz*dz<(b.radius+.34)*(b.radius+.34))return false;
  }
  return true;
}

function nearestInteraction(){
  let best=null,bestD=Infinity;
  for(const it of world.interactables){
    if(it.removed||!it.object?.visible)continue;
    const p=it.position();const d=Math.hypot(state.x-p.x,state.z-p.z);
    if(d<it.radius&&d<bestD){best=it;bestD=d;}
  }
  return best;
}

function removeResource(it){
  it.removed=true;it.object.visible=false;
  const c=world.colliders.find(c=>c.object===it.object);if(c)c.active=false;
}

function doAction(){
  if(state.hp<=0)return;
  if(state.buildMode){placeBuild();return;}

  if(state.mounted){
    state.mounted=false;
    world.horse.position.set(state.x+1.2,terrainHeight(state.x+1.2,state.z),state.z+.4);
    player.scale.setScalar(1);showToast("Tu descends du cheval.");return;
  }

  const it=nearestInteraction();
  if(!it){showToast("Rien à portée.");return;}

  if(it.type==="tree"){
    if(state.selected!=="axe"){showToast("Équipe la hache pour couper cet arbre.");return;}
    it.hits++;it.object.scale.y*=.985;showToast("Coup de hache "+it.hits+"/"+it.maxHits);
    if(it.hits>=it.maxHits){removeResource(it);give("wood",6,"🪵","Bois");}
  } else if(it.type==="rock"){
    if(state.selected!=="pickaxe"){showToast("Équipe la pioche pour casser ce rocher.");return;}
    it.hits++;it.object.rotation.y+=.08;showToast("Pioche "+it.hits+"/"+it.maxHits);
    if(it.hits>=it.maxHits){removeResource(it);give("stone",5,"🪨","Pierre");}
  } else if(it.type==="ore"){
    if(state.selected!=="pickaxe"){showToast("Équipe la pioche pour extraire le minerai.");return;}
    it.hits++;showToast("Extraction "+it.hits+"/"+it.maxHits);
    if(it.hits>=it.maxHits){
      removeResource(it);give("stone",2,"🪨","Pierre");
      if(it.oreKind==="gold"){give("gold",3,"🟡","Or");}
      else {give("ore",4,"💎","Minerai");}
    }
  } else if(it.type==="berries"){
    const now=performance.now();
    if((it.cooldown||0)>now){showToast("Le buisson n'a pas encore repoussé.");return;}
    it.cooldown=now+30000;give("berries",3,"🍒","Baies");give("seeds",1,"🌱","Graines");
  } else if(it.type==="chest"){
    if(it.object.userData.opened){showToast("Le coffre est vide.");return;}
    it.object.userData.opened=true;
    if(it.object.userData.lid)it.object.userData.lid.rotation.y=-.9;
    give("gold",5,"🟡","Or");give("stone",6,"🪨","Pierre");give("wood",4,"🪵","Bois");give("meat",2,"🥩","Viande crue");give("seeds",3,"🌱","Graines");
    showToast("Butin des ruines récupéré.");
  } else if(it.type==="campfire"){
    if(state.inventory.meat<=0){showToast("Tu n'as pas de viande crue.");return;}
    state.inventory.meat--;state.inventory.cooked++;addLoot("🍖","Viande cuite",1);showToast("La viande grille sur le feu.");renderQuickbar();
  } else if(it.type==="horse"){
    if(!it.object.userData.tamed){
      if(state.inventory.berries<3){showToast("Il te faut 3 baies pour gagner sa confiance.");return;}
      state.inventory.berries-=3;it.object.userData.tamed=true;showToast("Cheval apprivoisé ! Approche-toi et appuie sur E pour monter.");renderQuickbar();return;
    }
    state.mounted=true;player.scale.setScalar(.86);showToast("Monture équipée — E pour descendre.");
  } else if(it.type==="farm"){
    const f=it.object.userData;
    if(!f.planted){
      if(state.inventory.seeds<1){showToast("Il te faut des graines.");return;}
      state.inventory.seeds--;f.planted=true;f.plantedAt=performance.now();f.stage=1;showToast("Champ semé. Les cultures vont pousser.");renderQuickbar();
    } else if(f.ready){
      f.planted=false;f.ready=false;f.stage=0;f.crops.visible=false;give("grain",6,"🌾","Récolte");give("seeds",2,"🌱","Graines");showToast("Récolte terminée.");
    } else showToast("Les cultures poussent encore.");
  } else if(it.type==="skeleton"){
    if(state.selected!=="sword"){showToast("Équipe ton épée pour combattre.");return;}
    it.object.userData.hp-=36;it.object.rotation.y+=.35;showToast("Squelette : "+Math.max(0,it.object.userData.hp)+" PV");
    if(it.object.userData.hp<=0){it.object.visible=false;it.removed=true;give("gold",2,"🟡","Or ancien");showToast("Squelette vaincu.");}
  }
  updateUI();
}

function toggleBuild(force){
  const next=force===undefined?!state.buildMode:Boolean(force);
  state.buildMode=next;
  ui.buildPanel.classList.toggle("open",next);
  if(next){state.selected="build";updateBuildPreview(true);}else removeBuildPreview();
  renderQuickbar();updateBuildPanel();
}
function updateBuildPanel(){
  const b=buildTypes[state.buildIndex];ui.buildPiece.textContent=b.label;ui.buildCost.textContent=costText(b.cost);
}
function removeBuildPreview(){
  if(buildPreview){scene.remove(buildPreview);buildPreview=null;}
}
function cycleBuild(){
  if(!state.buildMode)toggleBuild(true);
  state.buildIndex=(state.buildIndex+1)%buildTypes.length;updateBuildPreview(true);updateBuildPanel();
}
function updateBuildPreview(force=false){
  if(!state.buildMode)return;
  const b=buildTypes[state.buildIndex];
  if(force||!buildPreview){
    removeBuildPreview();buildPreview=makeGhost(createBuildObject(b.id),true);scene.add(buildPreview);
  }
  const fx=state.facing.x||0,fz=state.facing.z||1;
  let x=Math.round((state.x+fx*3.6)*2)/2,z=Math.round((state.z+fz*3.6)*2)/2;
  buildPreview.position.set(x,terrainHeight(x,z),z);
  buildPreview.rotation.y=Math.round(Math.atan2(fx,fz)/(Math.PI/2))*(Math.PI/2);
  buildValid=hasCost(b.cost)&&Math.abs(x)<54&&Math.abs(z)<54&&Math.abs(x-getRiverX(z))>5.2;
  buildPreview.traverse(o=>{if(o.isMesh&&o.material){o.material.color.set(buildValid?0x86c978:0xc86460);}});
}
function placeBuild(){
  const b=buildTypes[state.buildIndex];
  if(!buildValid){showToast(hasCost(b.cost)?"Impossible de construire ici.":"Ressources insuffisantes.");return;}
  payCost(b.cost);
  const obj=createBuildObject(b.id);obj.position.copy(buildPreview.position);obj.rotation.y=buildPreview.rotation.y;scene.add(obj);
  world.buildings.push({object:obj,type:b.id,radius:b.radius});
  state.buildings.push({type:b.id,x:obj.position.x,z:obj.position.z,rot:obj.rotation.y});
  showToast(b.label+" construit.");updateBuildPreview(true);saveGame();
}

function updatePrompt(){
  if(state.buildMode){
    const b=buildTypes[state.buildIndex];ui.prompt.textContent=(buildValid?"E — Construire ":"Ressources requises — ")+b.label+" · R : changer";return;
  }
  if(state.mounted){ui.prompt.textContent="E — Descendre de la monture";return;}
  nearest=nearestInteraction();
  if(!nearest){ui.prompt.textContent="Explore, récolte, construis, survis";return;}
  if(nearest.type==="horse"&&nearest.object.userData.tamed)ui.prompt.textContent="E — Monter à cheval";
  else if(nearest.type==="farm"&&nearest.object.userData.ready)ui.prompt.textContent="E — Récolter les cultures";
  else ui.prompt.textContent="E — "+nearest.label;
}

function updateUI(){
  setBar(ui.hpBar,ui.hpText,state.hp);setBar(ui.hungerBar,ui.hungerText,state.hunger);setBar(ui.thirstBar,ui.thirstText,state.thirst);setBar(ui.staminaBar,ui.staminaText,state.stamina);
  const mins=Math.floor(state.dayProgress*24*60),h=Math.floor(mins/60)%24,m=mins%60;
  ui.day.textContent="Jour "+state.day;ui.clock.textContent=String(h).padStart(2,"0")+":"+String(m).padStart(2,"0");ui.season.textContent=seasonNames[state.season];
}

function drawMinimap(){
  const c=ui.minimap,ctx=c.getContext("2d"),w=c.width,h=c.height;ctx.clearRect(0,0,w,h);
  ctx.save();ctx.beginPath();ctx.arc(w/2,h/2,w/2-2,0,Math.PI*2);ctx.clip();
  ctx.fillStyle=state.season===3?"#77857c":state.season===2?"#776c43":"#536f46";ctx.fillRect(0,0,w,h);
  const scale=1.05,ox=w/2-state.x*scale,oz=h/2-state.z*scale;
  ctx.strokeStyle="rgba(54,135,155,.88)";ctx.lineWidth=9;ctx.beginPath();
  for(let z=-60;z<=60;z+=2){const x=getRiverX(z);const px=ox+x*scale,py=oz+z*scale;if(z===-60)ctx.moveTo(px,py);else ctx.lineTo(px,py);}ctx.stroke();
  ctx.fillStyle="#b3a584";ctx.fillRect(ox-36*scale,oz-27*scale,7,7);
  ctx.fillStyle="#d5a04e";ctx.beginPath();ctx.arc(ox-8*scale,oz+8*scale,3,0,Math.PI*2);ctx.fill();
  ctx.fillStyle="#c68d54";ctx.beginPath();ctx.arc(ox+13*scale,oz+23*scale,3,0,Math.PI*2);ctx.fill();
  if(world.horse.visible){ctx.fillStyle="#a47754";ctx.beginPath();ctx.arc(ox+world.horse.position.x*scale,oz+world.horse.position.z*scale,2.5,0,Math.PI*2);ctx.fill();}
  ctx.translate(w/2,h/2);ctx.rotate(-Math.atan2(state.facing.x,state.facing.z));ctx.fillStyle="#f1ead2";ctx.beginPath();ctx.moveTo(0,-6);ctx.lineTo(4,5);ctx.lineTo(-4,5);ctx.closePath();ctx.fill();
  ctx.restore();
}

function saveGame(){
  try{
    localStorage.setItem("survival-v20-save",JSON.stringify({
      x:state.x,z:state.z,hp:state.hp,hunger:state.hunger,thirst:state.thirst,inventory:state.inventory,selected:state.selected,
      day:state.day,dayProgress:state.dayProgress,horseTamed:world.horse.userData.tamed,chestOpened:world.chest.userData.opened,
      buildings:state.buildings
    }));
  }catch(_){}
}
function loadGame(){
  try{
    const raw=localStorage.getItem("survival-v20-save");if(!raw)return;
    const s=JSON.parse(raw);
    if(Number.isFinite(s.x)&&Number.isFinite(s.z)){state.x=s.x;state.z=s.z;}
    for(const k of ["hp","hunger","thirst","dayProgress"])if(Number.isFinite(s[k]))state[k]=s[k];
    if(Number.isFinite(s.day))state.day=Math.max(1,Math.floor(s.day));
    if(s.inventory&&typeof s.inventory==="object")for(const k of Object.keys(state.inventory))if(Number.isFinite(s.inventory[k]))state.inventory[k]=Math.max(0,Math.floor(s.inventory[k]));
    if(typeof s.selected==="string")state.selected=s.selected;
    world.horse.userData.tamed=Boolean(s.horseTamed);
    if(s.chestOpened){world.chest.userData.opened=true;if(world.chest.userData.lid)world.chest.userData.lid.rotation.y=-.9;}
    if(Array.isArray(s.buildings))for(const b of s.buildings){
      if(!b||!buildTypes.some(x=>x.id===b.type)||!Number.isFinite(b.x)||!Number.isFinite(b.z))continue;
      const obj=createBuildObject(b.type);obj.position.set(b.x,terrainHeight(b.x,b.z),b.z);obj.rotation.y=Number.isFinite(b.rot)?b.rot:0;scene.add(obj);
      const def=buildTypes.find(x=>x.id===b.type);world.buildings.push({object:obj,type:b.type,radius:def.radius});state.buildings.push({type:b.type,x:b.x,z:b.z,rot:obj.rotation.y});
    }
  }catch(_){}
}

function updatePlayerLocomotion(dt,speed01,isMoving,isSprinting){
  const rig=player.userData;
  const phaseSpeed=isSprinting?10.4:7.0;
  rig.walkPhase=(rig.walkPhase||0)+dt*phaseSpeed*(.35+speed01*.9);

  const phase=rig.walkPhase;
  const swing=Math.sin(phase)*(isSprinting?.72:.52)*speed01;
  const armSwing=-swing*.78;
  const bob=Math.abs(Math.sin(phase*2))*0.035*speed01;
  const side=Math.sin(phase)*.022*speed01;

  if(rig.legs?.length===2){
    dampRotation(rig.legs[0],"x",isMoving?swing:0,11,dt);
    dampRotation(rig.legs[1],"x",isMoving?-swing:0,11,dt);
  }
  if(rig.arms?.length===2){
    dampRotation(rig.arms[0],"x",isMoving?armSwing:0,10,dt);
    dampRotation(rig.arms[1],"x",isMoving?-armSwing*.78:0,10,dt);
  }
  if(rig.hips){
    dampRotation(rig.hips,"y",isMoving?side:0,12,dt);
    dampRotation(rig.hips,"z",isMoving?-side*.45:0,12,dt);
  }
  if(rig.torso){
    dampRotation(rig.torso,"x",isMoving?(isSprinting?-.10:-.045):0,8,dt);
    dampRotation(rig.torso,"z",isMoving?-side*.55:0,10,dt);
    rig.torso.position.y=damp(rig.torso.position.y,.80+bob,14,dt);
  }
  if(rig.shadow){
    const squash=1-speed01*.08;
    rig.shadow.scale.x=damp(rig.shadow.scale.x,1+speed01*.05,10,dt);
    rig.shadow.scale.y=damp(rig.shadow.scale.y,.52*squash,10,dt);
  }
}

function updateMovement(dt,time){
  const v=inputVector();
  const hasInput=v.strength>0;
  const touchSprint=joy.id!==null&&joy.strength>.86;
  const sprint=((keys.ShiftLeft||keys.ShiftRight)||touchSprint)&&state.stamina>2&&!state.mounted;

  let maxSpeed=state.mounted?8.3:sprint?6.25:4.15;
  const riverDist=Math.abs(state.x-getRiverX(state.z));
  if(riverDist<4.4&&Math.abs(state.z)>2.0&&!state.mounted)maxSpeed*=.48;

  const targetVX=hasInput?v.x*maxSpeed*v.strength:0;
  const targetVZ=hasInput?v.z*maxSpeed*v.strength:0;
  const response=hasInput?(state.mounted?7.2:10.5):14.5;

  motion.velocity.x=damp(motion.velocity.x,targetVX,response,dt);
  motion.velocity.y=damp(motion.velocity.y,targetVZ,response,dt);

  if(Math.abs(motion.velocity.x)<.015)motion.velocity.x=0;
  if(Math.abs(motion.velocity.y)<.015)motion.velocity.y=0;

  const nx=state.x+motion.velocity.x*dt;
  const nz=state.z+motion.velocity.y*dt;

  if(canMove(nx,state.z))state.x=nx;
  else motion.velocity.x*=.16;

  if(canMove(state.x,nz))state.z=nz;
  else motion.velocity.y*=.16;

  const actualSpeed=Math.hypot(motion.velocity.x,motion.velocity.y);
  const speed01=clamp(actualSpeed/Math.max(.01,maxSpeed),0,1);

  if(actualSpeed>.08){
    const fx=motion.velocity.x/actualSpeed;
    const fz=motion.velocity.y/actualSpeed;
    state.facing.x=damp(state.facing.x,fx,14,dt);
    state.facing.z=damp(state.facing.z,fz,14,dt);
    const fl=Math.hypot(state.facing.x,state.facing.z)||1;
    state.facing.x/=fl;state.facing.z/=fl;

    motion.targetYaw=Math.atan2(fx,fz);
    motion.yaw=dampAngle(motion.yaw,motion.targetYaw,state.mounted?7.5:11.5,dt);
    if(state.mounted)world.horse.rotation.y=motion.yaw;
    else player.rotation.y=motion.yaw;
  }

  if(sprint&&hasInput)state.stamina=clamp(state.stamina-dt*19*clamp(v.strength,.55,1),0,100);
  else state.stamina=clamp(state.stamina+dt*15,0,100);

  const ground=terrainHeight(state.x,state.z);
  if(state.mounted){
    const gait=Math.sin(time*(6.6+speed01*3.5))*0.035*speed01;
    world.horse.position.set(state.x,ground+Math.abs(gait)*.45,state.z);
    player.position.set(state.x,ground+1.48+Math.abs(gait),state.z);
    player.rotation.y=world.horse.rotation.y;
    updatePlayerLocomotion(dt,0,false,false);
  }else{
    updatePlayerLocomotion(dt,speed01,actualSpeed>.08,sprint);
    const bob=Math.abs(Math.sin((player.userData.walkPhase||0)*2))*0.022*speed01;
    player.position.set(state.x,ground+bob,state.z);
  }
}

function updateSurvival(dt){
  state.hunger=clamp(state.hunger-dt*.055,0,100);state.thirst=clamp(state.thirst-dt*.078,0,100);
  if(state.hunger<=0||state.thirst<=0)state.hp=clamp(state.hp-dt*1.7,0,100);
  state.dayProgress+=dt/300;
  if(state.dayProgress>=1){state.dayProgress-=1;state.day++;}
  const season=Math.floor((state.day-1)/3)%4;
  if(season!==state.season){state.season=season;setWorldSeason(world,season);scene.background.set(seasonSky[season]);showToast("Nouvelle saison : "+seasonNames[season]);}
}

function updateEnemyDamage(){
  for(const sk of world.enemies){
    if(!sk.visible||sk.userData.hp<=0)continue;
    const d=Math.hypot(state.x-sk.position.x,state.z-sk.position.z);
    if(d<1.65&&sk.userData.cooldown<=0){
      sk.userData.cooldown=1.15;state.hp=clamp(state.hp-12,0,100);showToast("Le squelette te frappe !");
      if(state.hp<=0){showToast("Tu es tombé au combat. Retour au camp.");state.x=-5;state.z=6;state.hp=65;state.hunger=55;state.thirst=55;}
    }
  }
}

function updateDayLight(){
  const a=state.dayProgress*Math.PI*2-Math.PI/2, daylight=clamp(Math.sin(a)*.72+.38,.10,1);
  hemi.intensity=.46+daylight*.72;sun.intensity=.32+daylight*1.55;
  sun.color.set(daylight>.55?0xffdda0:0xc1b4b0);
  sun.position.set(state.x+Math.cos(a)*28,10+daylight*31,state.z+Math.sin(a)*24);sun.target.position.set(state.x,0,state.z);scene.add(sun.target);
  const base=new THREE.Color(seasonSky[state.season]);const night=new THREE.Color(0x172232);scene.background.copy(night).lerp(base,daylight*.92);
  scene.fog.color.copy(scene.background).lerp(new THREE.Color(seasonSky[state.season]),.38);
}

function updateCamera(dt){
  const lookAheadX=motion.velocity.x*.42;
  const lookAheadZ=motion.velocity.y*.42;
  const targetY=terrainHeight(state.x,state.z)+(state.mounted?1.15:.82);
  const focusTarget=new THREE.Vector3(state.x+lookAheadX,targetY,state.z+lookAheadZ);

  motion.cameraFocus.lerp(focusTarget,1-Math.exp(-dt*5.2));

  const desired=new THREE.Vector3(
    motion.cameraFocus.x+12.7,
    motion.cameraFocus.y+(state.mounted?15.6:14.8),
    motion.cameraFocus.z+12.7
  );
  camera.position.lerp(desired,1-Math.exp(-dt*3.8));
  camera.lookAt(motion.cameraFocus);
  sun.shadow.camera.updateProjectionMatrix();
}

function frame(now){
  const dt=Math.min((now-last)/1000,.05);last=now;elapsed+=dt;
  updateMovement(dt,elapsed);updateSurvival(dt);updateBuildPreview();updateWorld(world,dt,elapsed,new THREE.Vector3(state.x,0,state.z));updateEnemyDamage();updateDayLight();updateCamera(dt);updatePrompt();updateUI();drawMinimap();
  renderer.render(scene,camera);
  if(now-state.lastSave>10000){state.lastSave=now;saveGame();}
  requestAnimationFrame(frame);
}

addEventListener("keydown",e=>{
  keys[e.code]=true;
  if(e.code==="KeyE"||e.code==="Space"){e.preventDefault();doAction();}
  else if(e.code==="KeyB"){e.preventDefault();toggleBuild();}
  else if(e.code==="KeyR"){e.preventDefault();cycleBuild();}
  else if(/^Digit[1-9]$/.test(e.code)){const item=quickItems[Number(e.code.slice(-1))-1];if(item)selectItem(item.id);}
});
addEventListener("keyup",e=>keys[e.code]=false);
addEventListener("blur",()=>{for(const k of Object.keys(keys))keys[k]=false;resetJoy();});
addEventListener("beforeunload",saveGame);
addEventListener("wheel",e=>{viewSize=clamp(viewSize+Math.sign(e.deltaY)*1.2,13,26);resize();},{passive:true});

ui.actionBtn.addEventListener("pointerdown",e=>{e.preventDefault();doAction();});
ui.buildBtn.addEventListener("click",()=>toggleBuild());
document.getElementById("buildClose").addEventListener("click",()=>toggleBuild(false));

const floatingStick=document.getElementById("floatingStick");
const floatingKnob=document.getElementById("floatingKnob");
const JOY_MAX=38;
const JOY_DEADZONE=5;

function beginFloatingJoy(e){
  if(e.pointerType==="mouse"||joy.id!==null)return;
  e.preventDefault();

  joy.id=e.pointerId;
  joy.originX=e.clientX;
  joy.originY=e.clientY;
  joy.x=0;joy.y=0;joy.strength=0;

  floatingStick.style.left=e.clientX+"px";
  floatingStick.style.top=e.clientY+"px";
  floatingStick.classList.add("active");
  floatingStick.setAttribute("aria-hidden","false");
  floatingKnob.style.transform="translate(0,0)";

  try{canvas.setPointerCapture(e.pointerId);}catch(_){}
}

function updateFloatingJoy(e){
  if(e.pointerId!==joy.id)return;
  e.preventDefault();

  let dx=e.clientX-joy.originX;
  let dy=e.clientY-joy.originY;
  const raw=Math.hypot(dx,dy);

  if(raw<JOY_DEADZONE){
    joy.x=0;joy.y=0;joy.strength=0;
    floatingKnob.style.transform="translate(0,0)";
    return;
  }

  const limited=Math.min(JOY_MAX,raw);
  const nx=dx/raw,ny=dy/raw;
  dx=nx*limited;dy=ny*limited;

  joy.strength=clamp((raw-JOY_DEADZONE)/(JOY_MAX-JOY_DEADZONE),0,1);
  joy.x=nx*joy.strength;
  joy.y=ny*joy.strength;
  floatingKnob.style.transform="translate("+dx+"px,"+dy+"px)";
}

function resetJoy(e){
  if(e&&joy.id!==null&&e.pointerId!==undefined&&e.pointerId!==joy.id)return;
  joy.x=0;joy.y=0;joy.strength=0;joy.id=null;
  floatingKnob.style.transform="translate(0,0)";
  floatingStick.classList.remove("active");
  floatingStick.setAttribute("aria-hidden","true");
}

canvas.addEventListener("pointerdown",beginFloatingJoy);
canvas.addEventListener("pointermove",updateFloatingJoy);
for(const name of ["pointerup","pointercancel","lostpointercapture"]){
  canvas.addEventListener(name,resetJoy);
}

loadGame();
state.season=Math.floor((state.day-1)/3)%4;setWorldSeason(world,state.season);scene.background.set(seasonSky[state.season]);
player.position.set(state.x,terrainHeight(state.x,state.z),state.z);
motion.cameraFocus.set(state.x,terrainHeight(state.x,state.z)+.82,state.z);
motion.yaw=player.rotation.y;motion.targetYaw=motion.yaw;
renderQuickbar();updateBuildPanel();updateUI();
setTimeout(()=>document.getElementById("loading").classList.add("hidden"),450);
showToast("Bienvenue à Val-des-Roches.");
requestAnimationFrame(frame);
