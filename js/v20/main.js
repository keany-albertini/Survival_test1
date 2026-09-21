import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.169.0/build/three.module.js";
import { createPlayer, makeGhost } from "./models.js?v=265";
import { createWorld, terrainHeight, getRiverX, setWorldSeason, updateWorld, createBuildObject } from "./world.js?v=265";

const canvas=document.getElementById("game3d");
const renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:"high-performance"});
renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.7));
renderer.shadowMap.enabled=true;
renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=1.16;

const scene=new THREE.Scene();
scene.background=new THREE.Color(0xa8b994);
scene.fog=new THREE.Fog(0x9eb38d,30,88);

const hemi=new THREE.HemisphereLight(0xd9e4d1,0x42382d,1.05);
scene.add(hemi);
const sun=new THREE.DirectionalLight(0xffddb0,2.42);
sun.castShadow=true;
sun.shadow.mapSize.set(1536,1536);
sun.shadow.camera.left=-28;sun.shadow.camera.right=28;sun.shadow.camera.top=28;sun.shadow.camera.bottom=-28;
sun.shadow.camera.near=.5;sun.shadow.camera.far=90;
sun.shadow.bias=-.00035;
scene.add(sun);
const fill=new THREE.DirectionalLight(0x9fb6cf,.34);fill.position.set(-20,14,-18);scene.add(fill);

let viewSize=18;
const camera=new THREE.OrthographicCamera(-viewSize,viewSize,viewSize,-viewSize,.1,160);
camera.position.set(14,17,14);

const world=createWorld(scene);
let premiumZone=null;
let premiumZoneUpdater=null;

function loadingProgress(percent,label){
  window.dispatchEvent(new CustomEvent("survival-loading",{
    detail:{percent:Math.max(0,Math.min(100,percent)),label}
  }));
}

async function bootPremiumZone(){
  loadingProgress(68,"Monde jouable prêt");
  try{
    const premiumModule=await import("../v26/premiumZone.js?v=265");
    loadingProgress(76,"Chargement des modèles GLTF/PBR");

    const premiumPromise=premiumModule.initPremiumZone(
      scene,world,renderer,terrainHeight,
      (value,label)=>loadingProgress(76+value*.20,label)
    );

    const timeout=new Promise((_,reject)=>
      setTimeout(()=>reject(new Error("premium-timeout")),12000)
    );

    premiumZone=await Promise.race([premiumPromise,timeout]);
    premiumZoneUpdater=premiumModule.updatePremiumZone;
    loadingProgress(100,"Monde prêt");
  }catch(err){
    console.warn("V26 premium zone disabled; base game continues.",err);
    premiumZone=null;
    premiumZoneUpdater=null;
    loadingProgress(100,"Monde prêt · mode compatible");
  }finally{
    setTimeout(()=>document.getElementById("loading")?.classList.add("hidden"),180);
  }
}

const player=createPlayer();
scene.add(player);

const state={
  x:-4,z:4,facing:new THREE.Vector3(0,0,1),
  hp:100,hunger:100,thirst:100,stamina:100,
  inventory:{wood:64,stone:96,ore:12,gold:2,berries:10,meat:3,cooked:2,seeds:10,grain:0},
  bagCapacity:260,
  selected:"axe",mounted:false,day:1,dayProgress:.31,season:0,
  buildMode:false,buildIndex:0,buildings:[],lastSave:0
};

const buildTypes=[
  {id:"stone_wall",label:"Mur de pierre",cost:{stone:8,wood:2},radius:1.65,chainStep:3.35},
  {id:"stone_tower",label:"Tour de guet",cost:{stone:22,wood:6},radius:1.45,chainStep:0},
  {id:"palisade",label:"Palissade",cost:{wood:10},radius:1.8,chainStep:3.45}
];
let buildPreview=null;
let buildValid=false;
let buildChainPoint=null;

const keys=Object.create(null);
const joy={x:0,y:0,id:null,originX:0,originY:0,strength:0};
const motion={
  velocity:new THREE.Vector2(0,0),
  yaw:0,
  targetYaw:0,
  cameraFocus:new THREE.Vector3(-4,0,4)
};
const actionState={
  active:false,
  kind:null,
  target:null,
  time:0,
  duration:0,
  impactAt:0,
  impacted:false,
  lockMovement:false
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
  actionBtn:document.getElementById("actionBtn"),buildBtn:document.getElementById("buildBtn"),
  bagBtn:document.getElementById("bagBtn"),bagTouchBtn:document.getElementById("bagTouchBtn"),
  bagPanel:document.getElementById("bagPanel"),bagClose:document.getElementById("bagClose"),
  bagGrid:document.getElementById("bagGrid"),bagWeightText:document.getElementById("bagWeightText"),
  bagWeightBar:document.getElementById("bagWeightBar"),bagWeightMini:document.getElementById("bagWeightMini")
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
const itemWeights={wood:.50,stone:.72,ore:.85,gold:.25,berries:.08,meat:.40,cooked:.40,seeds:.04,grain:.10};
const bagItems=[
  {id:"wood",icon:"🪵",label:"Bois"},
  {id:"stone",icon:"🪨",label:"Pierre"},
  {id:"ore",icon:"💎",label:"Minerai"},
  {id:"gold",icon:"🟡",label:"Or"},
  {id:"berries",icon:"🍒",label:"Baies"},
  {id:"meat",icon:"🥩",label:"Viande crue"},
  {id:"cooked",icon:"🍖",label:"Viande cuite"},
  {id:"seeds",icon:"🌱",label:"Graines"},
  {id:"grain",icon:"🌾",label:"Récolte"}
];

function bagWeight(){
  return Object.entries(state.inventory).reduce((sum,[id,count])=>sum+(itemWeights[id]||0)*Math.max(0,count||0),0);
}
function bagRemaining(){return Math.max(0,state.bagCapacity-bagWeight());}
function maxFit(id,amount){
  const w=itemWeights[id]||0;
  if(w<=0)return amount;
  return Math.max(0,Math.min(amount,Math.floor((bagRemaining()+1e-6)/w)));
}
function renderBag(){
  const weight=bagWeight();
  const pct=clamp(weight/state.bagCapacity*100,0,100);
  ui.bagWeightText.textContent=weight.toFixed(1)+" / "+state.bagCapacity;
  ui.bagWeightMini.textContent=Math.round(weight)+" / "+state.bagCapacity;
  ui.bagWeightBar.style.width=pct+"%";
  ui.bagGrid.innerHTML="";
  for(const it of bagItems){
    const count=state.inventory[it.id]||0;
    const card=document.createElement("div");
    card.className="bag-item";
    card.innerHTML="<span>"+it.icon+"</span><div><strong>"+it.label+"</strong><small>x"+count+" · "+((itemWeights[it.id]||0)*count).toFixed(1)+" charge</small></div>";
    ui.bagGrid.appendChild(card);
  }
}
function isBagOpen(){return ui.bagPanel.classList.contains("open");}
function toggleBag(force){
  const open=force===undefined?!isBagOpen():Boolean(force);
  ui.bagPanel.classList.toggle("open",open);
  ui.bagPanel.setAttribute("aria-hidden",open?"false":"true");
  if(open){resetJoy();renderBag();}
}
function give(id,amount,icon,label){
  const accepted=maxFit(id,amount);
  if(accepted<=0){showToast("🎒 Sac plein.");return 0;}
  state.inventory[id]=(state.inventory[id]||0)+accepted;
  addLoot(icon,label,accepted);
  if(accepted<amount)showToast("Sac presque plein : "+accepted+"/"+amount+" récupéré.");
  renderQuickbar();renderBag();
  return accepted;
}
function hasCost(cost){return Object.entries(cost).every(([k,v])=>(state.inventory[k]||0)>=v);}
function payCost(cost){for(const [k,v] of Object.entries(cost))state.inventory[k]-=v;renderQuickbar();renderBag();}
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
function syncEquippedTool(){
  const tools=player.userData.tools;
  if(!tools)return;
  for(const [id,obj] of Object.entries(tools))obj.visible=state.selected===id;
}
function selectItem(id){
  if(id==="build"){toggleBuild(true);return;}
  state.selected=id;
  syncEquippedTool();
  renderQuickbar();
}

const inputForward=new THREE.Vector3();
const inputRight=new THREE.Vector3();
const worldUp=new THREE.Vector3(0,1,0);

function inputVector(){
  if(isBagOpen())return {x:0,z:0,strength:0};
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

function faceTarget(it){
  if(!it)return;
  const p=it.position();
  const dx=p.x-state.x,dz=p.z-state.z;
  const len=Math.hypot(dx,dz);
  if(len<.001)return;
  state.facing.set(dx/len,0,dz/len);
  motion.targetYaw=Math.atan2(state.facing.x,state.facing.z);
  motion.yaw=dampAngle(motion.yaw,motion.targetYaw,24,.12);
  player.rotation.y=motion.yaw;
}

function beginAction(kind,it){
  if(actionState.active)return false;
  const defs={
    chop:{duration:.82,impactAt:.49,lockMovement:true},
    mine:{duration:.92,impactAt:.56,lockMovement:true},
    attack:{duration:.60,impactAt:.31,lockMovement:true},
    gather:{duration:.66,impactAt:.39,lockMovement:true},
    interact:{duration:.62,impactAt:.34,lockMovement:true}
  };
  const def=defs[kind]||defs.interact;
  actionState.active=true;
  actionState.kind=kind;
  actionState.target=it;
  actionState.time=0;
  actionState.duration=def.duration;
  actionState.impactAt=def.impactAt;
  actionState.impacted=false;
  actionState.lockMovement=def.lockMovement;
  motion.velocity.multiplyScalar(.18);
  faceTarget(it);
  return true;
}

function triggerImpactPulse(it){
  if(!it?.object)return;
  if(!it.object.userData.baseImpactScale)it.object.userData.baseImpactScale=it.object.scale.clone();
  it.object.userData.hitPulse=1;
}

function resolveActionImpact(it){
  if(!it||it.removed||!it.object?.visible)return;

  if(it.type==="tree"){
    it.hits++;
    triggerImpactPulse(it);
    showToast("Coup de hache "+it.hits+"/"+it.maxHits);
    if(it.hits>=it.maxHits){removeResource(it);give("wood",6,"🪵","Bois");}
  } else if(it.type==="rock"){
    it.hits++;
    triggerImpactPulse(it);
    showToast("Pioche "+it.hits+"/"+it.maxHits);
    if(it.hits>=it.maxHits){removeResource(it);give("stone",5,"🪨","Pierre");}
  } else if(it.type==="ore"){
    it.hits++;
    triggerImpactPulse(it);
    showToast("Extraction "+it.hits+"/"+it.maxHits);
    if(it.hits>=it.maxHits){
      removeResource(it);give("stone",2,"🪨","Pierre");
      if(it.oreKind==="gold")give("gold",3,"🟡","Or");
      else give("ore",4,"💎","Minerai");
    }
  } else if(it.type==="berries"){
    const now=performance.now();
    if((it.cooldown||0)>now){showToast("Le buisson n'a pas encore repoussé.");return;}
    it.cooldown=now+30000;
    triggerImpactPulse(it);
    give("berries",3,"🍒","Baies");
    give("seeds",1,"🌱","Graines");
  } else if(it.type==="chest"){
    if(it.object.userData.opened){showToast("Le coffre est vide.");return;}
    it.object.userData.opened=true;
    if(it.object.userData.lid)it.object.userData.lid.rotation.y=-.9;
    give("gold",5,"🟡","Or");give("stone",6,"🪨","Pierre");give("wood",4,"🪵","Bois");
    give("meat",2,"🥩","Viande crue");give("seeds",3,"🌱","Graines");
    showToast("Butin des ruines récupéré.");
  } else if(it.type==="campfire"){
    if(state.inventory.meat<=0){showToast("Tu n'as pas de viande crue.");return;}
    state.inventory.meat--;state.inventory.cooked++;
    addLoot("🍖","Viande cuite",1);
    showToast("La viande grille sur le feu.");
    renderQuickbar();
  } else if(it.type==="farm"){
    const f=it.object.userData;
    if(!f.planted){
      if(state.inventory.seeds<1){showToast("Il te faut des graines.");return;}
      state.inventory.seeds--;f.planted=true;f.plantedAt=performance.now();f.stage=1;
      showToast("Champ semé. Les cultures vont pousser.");renderQuickbar();
    } else if(f.ready){
      f.planted=false;f.ready=false;f.stage=0;f.crops.visible=false;
      give("grain",6,"🌾","Récolte");give("seeds",2,"🌱","Graines");
      showToast("Récolte terminée.");
    } else showToast("Les cultures poussent encore.");
  } else if(it.type==="skeleton"){
    it.object.userData.hp-=36;
    triggerImpactPulse(it);
    showToast("Squelette : "+Math.max(0,it.object.userData.hp)+" PV");
    if(it.object.userData.hp<=0){
      it.object.visible=false;it.removed=true;
      give("gold",2,"🟡","Or ancien");
      showToast("Squelette vaincu.");
    }
  }
  updateUI();
}

function actionCurve(t,start,end){
  return clamp((t-start)/(end-start),0,1);
}

function updateActionAnimation(dt){
  const rig=player.userData;
  if(!rig?.arms||!rig?.torso)return;

  if(!actionState.active){
    if(rig.toolRoot){
      dampRotation(rig.toolRoot,"x",0,13,dt);
      dampRotation(rig.toolRoot,"z",0,13,dt);
    }
    return;
  }

  actionState.time+=dt;
  const n=clamp(actionState.time/actionState.duration,0,1);
  const impactN=actionState.impactAt/actionState.duration;
  const before=n<=impactN;
  const wind=actionCurve(n,0,impactN);
  const recover=actionCurve(n,impactN,1);

  let rightX=0,leftX=0,rightZ=0,leftZ=0,torsoX=0,torsoY=0,toolX=0,toolZ=0;

  if(actionState.kind==="chop"){
    if(before){
      const e=wind*wind*(3-2*wind);
      rightX=-1.55*e;leftX=-.86*e;rightZ=-.18*e;leftZ=.12*e;torsoX=-.16*e;torsoY=-.34*e;toolX=-.24*e;
    }else{
      const snap=1-Math.pow(recover,1.8);
      rightX=.92*snap;leftX=.32*snap;rightZ=.12*snap;torsoX=.22*snap;torsoY=.28*snap;toolX=.18*snap;
    }
  } else if(actionState.kind==="mine"){
    if(before){
      const e=wind*wind*(3-2*wind);
      rightX=-1.72*e;leftX=-1.30*e;rightZ=-.12*e;leftZ=.10*e;torsoX=-.12*e;toolX=-.35*e;
    }else{
      const snap=1-Math.pow(recover,1.7);
      rightX=1.02*snap;leftX=.72*snap;torsoX=.28*snap;toolX=.24*snap;
    }
  } else if(actionState.kind==="attack"){
    if(before){
      const e=wind*wind*(3-2*wind);
      rightX=-.68*e;rightZ=-1.02*e;leftX=.18*e;torsoY=-.52*e;toolZ=-.45*e;
    }else{
      const snap=1-Math.pow(recover,2.0);
      rightX=.35*snap;rightZ=.92*snap;torsoY=.58*snap;toolZ=.38*snap;
    }
  } else {
    const dip=Math.sin(Math.PI*n);
    rightX=-.78*dip;leftX=-.52*dip;torsoX=.34*dip;
  }

  rig.arms[0].rotation.x=leftX;
  rig.arms[0].rotation.z=leftZ;
  rig.arms[1].rotation.x=rightX;
  rig.arms[1].rotation.z=rightZ;
  rig.torso.rotation.x=torsoX;
  rig.torso.rotation.y=torsoY;
  if(rig.toolRoot){
    rig.toolRoot.rotation.x=toolX;
    rig.toolRoot.rotation.z=toolZ;
  }

  if(!actionState.impacted&&actionState.time>=actionState.impactAt){
    actionState.impacted=true;
    resolveActionImpact(actionState.target);
  }

  if(n>=1){
    actionState.active=false;
    actionState.kind=null;
    actionState.target=null;
    actionState.time=0;
    actionState.impacted=false;
    actionState.lockMovement=false;
  }
}

function doAction(){
  if(state.hp<=0||actionState.active)return;
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
    beginAction("chop",it);return;
  } else if(it.type==="rock"){
    if(state.selected!=="pickaxe"){showToast("Équipe la pioche pour casser ce rocher.");return;}
    beginAction("mine",it);return;
  } else if(it.type==="ore"){
    if(state.selected!=="pickaxe"){showToast("Équipe la pioche pour extraire le minerai.");return;}
    beginAction("mine",it);return;
  } else if(it.type==="berries"){
    const now=performance.now();
    if((it.cooldown||0)>now){showToast("Le buisson n'a pas encore repoussé.");return;}
    beginAction("gather",it);return;
  } else if(it.type==="chest"){
    if(it.object.userData.opened){showToast("Le coffre est vide.");return;}
    beginAction("interact",it);return;
  } else if(it.type==="campfire"){
    if(state.inventory.meat<=0){showToast("Tu n'as pas de viande crue.");return;}
    beginAction("interact",it);return;
  } else if(it.type==="horse"){
    if(!it.object.userData.tamed){
      if(state.inventory.berries<3){showToast("Il te faut 3 baies pour gagner sa confiance.");return;}
      state.inventory.berries-=3;it.object.userData.tamed=true;showToast("Cheval apprivoisé ! Approche-toi et appuie sur E pour monter.");renderQuickbar();return;
    }
    state.mounted=true;player.scale.setScalar(.86);showToast("Monture équipée — E pour descendre.");
  } else if(it.type==="farm"){
    const f=it.object.userData;
    if(!f.planted&&state.inventory.seeds<1){showToast("Il te faut des graines.");return;}
    beginAction("gather",it);return;
  } else if(it.type==="skeleton"){
    if(state.selected!=="sword"){showToast("Équipe ton épée pour combattre.");return;}
    beginAction("attack",it);return;
  }
  updateUI();
}

function setBuildPanelVisible(open){
  ui.buildPanel.classList.toggle("open",open);
  ui.buildPanel.setAttribute("aria-hidden",open?"false":"true");
}
function toggleBuild(force){
  const next=force===undefined?!state.buildMode:Boolean(force);
  state.buildMode=next;
  setBuildPanelVisible(next);
  if(next){
    toggleBag(false);
    state.selected="build";
    updateBuildPreview(true);
  }else{
    buildChainPoint=null;
    removeBuildPreview();
  }
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
  state.buildIndex=(state.buildIndex+1)%buildTypes.length;
  buildChainPoint=null;
  updateBuildPreview(true);updateBuildPanel();
}
function updateBuildPreview(force=false){
  if(!state.buildMode)return;
  const b=buildTypes[state.buildIndex];
  if(force||!buildPreview){
    removeBuildPreview();buildPreview=makeGhost(createBuildObject(b.id),true);scene.add(buildPreview);
  }
  const fx=state.facing.x||0,fz=state.facing.z||1;
  let x,z,rot;
  if(buildChainPoint&&buildChainPoint.type===b.id){
    x=buildChainPoint.x;z=buildChainPoint.z;rot=buildChainPoint.rot;
  }else{
    x=Math.round((state.x+fx*3.6)*2)/2;
    z=Math.round((state.z+fz*3.6)*2)/2;
    rot=Math.round(Math.atan2(fx,fz)/(Math.PI/2))*(Math.PI/2);
  }
  buildPreview.position.set(x,terrainHeight(x,z),z);
  buildPreview.rotation.y=rot;
  const clear=world.buildings.every(existing=>{
    const dx=x-existing.object.position.x,dz=z-existing.object.position.z;
    const minDist=(b.radius+existing.radius)*.72;
    return dx*dx+dz*dz>minDist*minDist;
  });
  buildValid=hasCost(b.cost)&&clear&&Math.abs(x)<54&&Math.abs(z)<54&&Math.abs(x-getRiverX(z))>5.2;
  buildPreview.traverse(o=>{if(o.isMesh&&o.material){o.material.color.set(buildValid?0x86c978:0xc86460);}});
}
function placeBuild(){
  const b=buildTypes[state.buildIndex];
  if(!buildValid){
    showToast(hasCost(b.cost)?"Impossible de construire ici.":"Ressources insuffisantes — le mode construction reste actif.");
    state.buildMode=true;
    setBuildPanelVisible(true);
    return;
  }

  payCost(b.cost);
  const obj=createBuildObject(b.id);
  obj.position.copy(buildPreview.position);
  obj.rotation.y=buildPreview.rotation.y;
  scene.add(obj);

  world.buildings.push({object:obj,type:b.id,radius:b.radius});
  state.buildings.push({type:b.id,x:obj.position.x,z:obj.position.z,rot:obj.rotation.y});

  // V23 : placement continu. Le prochain mur/palisade est déjà proposé à côté.
  if(b.chainStep>0){
    const stepX=Math.cos(obj.rotation.y)*b.chainStep;
    const stepZ=-Math.sin(obj.rotation.y)*b.chainStep;
    buildChainPoint={
      type:b.id,
      x:Math.round((obj.position.x+stepX)*2)/2,
      z:Math.round((obj.position.z+stepZ)*2)/2,
      rot:obj.rotation.y
    };
  }else buildChainPoint=null;

  state.buildMode=true;
  state.selected="build";
  setBuildPanelVisible(true);
  showToast(b.label+" construit · placement continu actif.");
  updateBuildPreview(true);
  saveGame();
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
  if(ui.bagWeightMini)ui.bagWeightMini.textContent=Math.round(bagWeight())+" / "+state.bagCapacity;
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
      buildings:state.buildings,version:25
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

    // Migration V23 : une seule fois, on crédite un vrai stock de chantier aux anciennes sauvegardes.
    if(!Number.isFinite(s.version)||s.version<23){
      state.inventory.wood=(state.inventory.wood||0)+60;
      state.inventory.stone=(state.inventory.stone||0)+90;
      state.inventory.ore=(state.inventory.ore||0)+10;
      state.inventory.berries=(state.inventory.berries||0)+5;
      state.inventory.seeds=(state.inventory.seeds||0)+6;
    }

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
  const v=actionState.active&&actionState.lockMovement?{x:0,z:0,strength:0}:inputVector();
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
    if(!actionState.active)updatePlayerLocomotion(dt,speed01,actualSpeed>.08,sprint);
    const bob=actionState.active?0:Math.abs(Math.sin((player.userData.walkPhase||0)*2))*0.022*speed01;
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
  const a=state.dayProgress*Math.PI*2-Math.PI/2, daylight=clamp(Math.sin(a)*.66+.46,.18,1);
  hemi.intensity=.72+daylight*.78;sun.intensity=.58+daylight*1.72;
  sun.color.set(daylight>.55?0xffdda0:0xc1b4b0);
  sun.position.set(state.x+Math.cos(a)*28,10+daylight*31,state.z+Math.sin(a)*24);sun.target.position.set(state.x,0,state.z);scene.add(sun.target);
  const base=new THREE.Color(seasonSky[state.season]);const night=new THREE.Color(0x243448);scene.background.copy(night).lerp(base,.20+daylight*.80);
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

function forceCleanSpawnUI(){
  // V24 : une sauvegarde peut retenir "build" comme sélection,
  // mais le joueur ne doit jamais apparaître avec le panneau Construction ouvert.
  state.buildMode=false;
  buildChainPoint=null;
  removeBuildPreview();
  setBuildPanelVisible(false);

  if(state.selected==="build")state.selected="axe";
}

function frame(now){
  const dt=Math.min((now-last)/1000,.05);last=now;elapsed+=dt;
  updateMovement(dt,elapsed);updateActionAnimation(dt);updateSurvival(dt);updateBuildPreview();updateWorld(world,dt,elapsed,new THREE.Vector3(state.x,0,state.z));if(premiumZoneUpdater)premiumZoneUpdater(premiumZone,elapsed);updateEnemyDamage();updateDayLight();updateCamera(dt);updatePrompt();updateUI();drawMinimap();
  renderer.render(scene,camera);
  if(now-state.lastSave>10000){state.lastSave=now;saveGame();}
  requestAnimationFrame(frame);
}

addEventListener("keydown",e=>{
  keys[e.code]=true;
  if(e.code==="KeyE"||e.code==="Space"){e.preventDefault();doAction();}
  else if(e.code==="KeyB"){e.preventDefault();toggleBuild();}
  else if(e.code==="KeyI"){e.preventDefault();toggleBag();}
  else if(e.code==="Escape"){toggleBag(false);}
  else if(e.code==="KeyR"){e.preventDefault();cycleBuild();}
  else if(/^Digit[1-9]$/.test(e.code)){const item=quickItems[Number(e.code.slice(-1))-1];if(item)selectItem(item.id);}
});
addEventListener("keyup",e=>keys[e.code]=false);
addEventListener("blur",()=>{for(const k of Object.keys(keys))keys[k]=false;resetJoy();});
addEventListener("beforeunload",saveGame);
addEventListener("wheel",e=>{viewSize=clamp(viewSize+Math.sign(e.deltaY)*1.2,13,26);resize();},{passive:true});

ui.actionBtn.addEventListener("pointerdown",e=>{e.preventDefault();doAction();});
ui.buildBtn.addEventListener("click",()=>toggleBuild());
ui.bagBtn?.addEventListener("click",()=>toggleBag());
ui.bagTouchBtn?.addEventListener("click",()=>toggleBag());
ui.bagClose?.addEventListener("click",()=>toggleBag(false));
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
forceCleanSpawnUI();
state.season=Math.floor((state.day-1)/3)%4;setWorldSeason(world,state.season);scene.background.set(seasonSky[state.season]);
player.position.set(state.x,terrainHeight(state.x,state.z),state.z);
motion.cameraFocus.set(state.x,terrainHeight(state.x,state.z)+.82,state.z);
motion.yaw=player.rotation.y;motion.targetYaw=motion.yaw;
syncEquippedTool();renderQuickbar();renderBag();updateBuildPanel();updateUI();
loadingProgress(62,"Initialisation du joueur et de la carte");
showToast("Bienvenue à Val-des-Roches.");
requestAnimationFrame(frame);
bootPremiumZone();
