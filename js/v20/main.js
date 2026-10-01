import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.169.0/build/three.module.js";
import { createPlayer, makeGhost } from "./models.js?v=ew2";
import { createWorld, terrainHeight, getRiverX, setWorldSeason, updateWorld, createBuildObject } from "./world.js?v=ew2";

import { newProgress,train,limits,allocate,validateProgress,practiceLevel,BRANCHES,RECIPES } from "../everwild/rules.js?v=ew2";
import { applyAppearance } from "../everwild/appearance.js?v=ew2";
import { updateCharacter } from "../v28/animation.js?v=ew2";
import { createAmbience } from "../v27/ambience.js?v=ew2";

import {createDragon} from '../everwild/fantasy.js?v=ew2';
import {REGIONS,WORLD_LIMIT,landDistance,regionAt,spawnAt} from '../everwild/geography.js?v=ew2';
const canvas=document.getElementById("game3d");
const renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:"high-performance"});
function graphicsQuality(settings={}){
  const quality=settings.quality||"balanced",ratio=quality==="light"?1:quality==="high"?1.7:1.3;
  renderer.setPixelRatio(Math.min(devicePixelRatio||1,ratio));renderer.shadowMap.enabled=quality!=="light";
}
graphicsQuality(window.everwildSettings);
window.addEventListener("everwild-settings",event=>{graphicsQuality(event.detail);resize();});
renderer.shadowMap.enabled=window.everwildSettings?.quality!=="light";
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

let viewSize=15;
const camera=new THREE.OrthographicCamera(-viewSize,viewSize,viewSize,-viewSize,.1,160);
camera.position.set(14,17,14);

const world=createWorld(scene);
const ambience=createAmbience(scene,world,terrainHeight,getRiverX);
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
    const premiumModule=await import("../v26/premiumZone.js?v=ew2");
    loadingProgress(76,"Chargement des modèles GLTF/PBR");

    const premiumPromise=premiumModule.initPremiumZone(
      scene,world,renderer,terrainHeight,
      (value,label)=>loadingProgress(76+value*20,label)
    );

    // Keep the late result: slow mobile connections still receive animated models.
    premiumZone=await premiumPromise;
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
applyAppearance(player,window.everwildProfile||{race:"human",body:"male"});
const SAVE_KEY="everwild-save-"+(window.everwildProfile?.id||"local");
scene.add(player);

const state={
  x:-4,z:4,facing:new THREE.Vector3(0,0,1),
  hp:100,hunger:100,thirst:100,stamina:100,
  inventory:{wood:8,stone:12,ore:0,gold:0,berries:5,meat:0,cooked:0,seeds:2,grain:0,ingot:0,plank:0,egg:0},
  bagCapacity:80,progress:newProgress(),ownedTools:["axe"],deathBags:[],
  objectives:{cooked:false},selected:"axe",mounted:false,day:1,dayProgress:.31,season:0,
  buildMode:false,buildIndex:0,buildings:[],stationTiers:{},pet:false,lastSave:0
};

const buildTypes=[
  {id:"base_core",label:"Cœur de base",cost:{stone:12,wood:8},radius:1.1,chainStep:0},
  {id:"stone_wall",tech:"structures",label:"Mur de pierre",cost:{stone:8,wood:2},radius:1.65,chainStep:3.35},
  {id:"stone_tower",tech:"structures",label:"Tour de guet",cost:{stone:22,wood:6},radius:1.45,chainStep:0},
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
let activeWorkshop=null;
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
function setBar(el,text,val,max=100){const v=clamp(val,0,max);el.style.width=(v/max*100)+"%";text.textContent=Math.round(v);}
function showToast(msg){
  clearTimeout(toastTimer);ui.toast.textContent=msg;ui.toast.classList.add("show");
  toastTimer=setTimeout(()=>ui.toast.classList.remove("show"),1800);
}
function addLoot(icon,label,amount=1){
  const line=document.createElement("div");line.className="loot-line";line.innerHTML="<span>"+icon+"</span><strong>"+label+" +"+amount+"</strong>";
  ui.loot.prepend(line);while(ui.loot.children.length>5)ui.loot.lastChild.remove();
  setTimeout(()=>{line.style.opacity="0";setTimeout(()=>line.remove(),240)},5200);
}
const gearWeights={axe:2,pickaxe:2.5,sword:3};
const itemWeights={wood:.50,stone:.72,ore:.85,gold:.25,berries:.08,meat:.40,cooked:.40,seeds:.04,grain:.10,ingot:.65,plank:.30,egg:2};
const bagItems=[
  {id:"wood",icon:"🪵",label:"Bois"},
  {id:"stone",icon:"🪨",label:"Pierre"},
  {id:"ore",icon:"💎",label:"Minerai"},
  {id:"gold",icon:"🟡",label:"Or"},
  {id:"berries",icon:"🍒",label:"Baies"},
  {id:"meat",icon:"🥩",label:"Viande crue"},
  {id:"cooked",icon:"🍖",label:"Viande cuite"},
  {id:"seeds",icon:"🌱",label:"Graines"},
  {id:"grain",icon:"🌾",label:"Récolte"},
  {id:"ingot",icon:"▰",label:"Lingots"},{id:"plank",icon:"▤",label:"Planches"},{id:"egg",icon:"🥚",label:"Œuf de dragon"}
];

function bagWeight(){
  return Object.entries(state.inventory).reduce((sum,[id,count])=>sum+(itemWeights[id]||0)*Math.max(0,count||0),0)+state.ownedTools.reduce((sum,id)=>sum+(gearWeights[id]||0),0);
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
function learn(id){
  const gained=train(state.progress,id);
  if(gained)showToast("Niveau "+state.progress.level+" · nouveaux points d’attributs et de recherche.");
}
function emitProgress(){
  window.dispatchEvent(new CustomEvent("everwild-state",{detail:{progress:structuredClone(state.progress),inventory:{...state.inventory},ownedTools:[...state.ownedTools],station:activeWorkshop?{type:activeWorkshop.userData.type,tier:activeWorkshop.userData.tier}:null}}));
}
function refreshLimits(){
  const max=limits(state.progress);state.bagCapacity=max.weight;
  state.hp=Math.min(state.hp,max.health);state.stamina=Math.min(state.stamina,max.stamina);
  state.hunger=Math.min(state.hunger,max.hunger);state.thirst=Math.min(state.thirst,max.thirst);
}
window.addEventListener("everwild-command",event=>{
  const {type,id}=event.detail||{};
  if(type==="stat"){
    if(["resistance","oxygen"].includes(id))return;
    if(!allocate(state.progress,id))return;
    refreshLimits();showToast("Attribut amélioré.");
  }else if(type==="research"){
    const branch=BRANCHES.find(b=>b.id===id);
    if(!branch||state.progress.research.includes(id)||state.progress.researchPoints<1||!hasCost(branch.cost))return;
    payCost(branch.cost);state.progress.researchPoints--;state.progress.research.push(id);showToast(branch.name+" appris.");
  }else if(type==="craft"){
    const recipe=RECIPES.find(r=>r.id===id);
    if(!recipe||!hasCost(recipe.cost)||(recipe.tech&&!state.progress.research.includes(recipe.tech))||(recipe.gear&&state.ownedTools.includes(id)))return;
    if(recipe.gear&&bagRemaining()+Object.entries(recipe.cost).reduce((sum,[key,n])=>sum+(itemWeights[key]||0)*n,0)<gearWeights[id]){showToast("Le sac est trop chargé.");return;}
    if(recipe.station&&(!activeWorkshop||activeWorkshop.userData.type!==recipe.station||activeWorkshop.userData.tier<recipe.tier||Math.hypot(state.x-activeWorkshop.position.x,state.z-activeWorkshop.position.z)>4)){showToast("Approche l’atelier requis et ouvre-le avec Action.");return;}
    if(recipe.upgrade&&(!state.ownedTools.includes(recipe.upgrade)||state.progress.toolTier[recipe.upgrade]>=2))return;
    if(recipe.output){const after=Object.entries(recipe.output).reduce((n,[id,count])=>n+(itemWeights[id]||0)*count*(activeWorkshop?.userData.tier===3?2:1),0);const removed=Object.entries(recipe.cost).reduce((n,[id,count])=>n+(itemWeights[id]||0)*count,0);if(after>bagRemaining()+removed){showToast("Sac plein.");return;}}
    payCost(recipe.cost);
    if(recipe.output)for(const [id,count]of Object.entries(recipe.output))state.inventory[id]+=count*(activeWorkshop.userData.tier===3?2:1);
    if(recipe.upgrade)state.progress.toolTier[recipe.upgrade]=2;
    if(recipe.heal)state.hp=Math.min(limits(state.progress).health,state.hp+recipe.heal);
    if(recipe.gear){state.ownedTools.push(id);state.selected=id;syncEquippedTool();}
    else if(id==="respec"){
      state.progress.points+=Object.values(state.progress.stats).reduce((sum,n)=>sum+n,0);
      for(const key of Object.keys(state.progress.stats))state.progress.stats[key]=0;refreshLimits();
    }
    learn("craft");showToast(recipe.name+" fabriqué.");
  }else if(type==='station-upgrade'){
    if(!activeWorkshop||Math.hypot(state.x-activeWorkshop.position.x,state.z-activeWorkshop.position.z)>4)return;
    const tier=activeWorkshop.userData.tier,req=tier===1?{wood:12,stone:10}:{ingot:6,plank:6};
    if(tier>=3||!state.progress.research.includes('workshops')||state.progress.level<(tier===1?3:8)||!hasCost(req)){showToast('Ateliers, niveau '+(tier===1?3:8)+' et ressources requis.');return;}
    payCost(req);activeWorkshop.userData.tier++;activeWorkshop.scale.y=1+(activeWorkshop.userData.tier-1)*.08;state.stationTiers[stationKey(activeWorkshop)]=activeWorkshop.userData.tier;openWorkshop();learn('craft');
  }else if(type==='travel'){
    const target=spawnAt(id);if(!target||actionState.active)return;
    state.x=target.x;state.z=target.z;motion.velocity.set(0,0);motion.cameraFocus.set(state.x,surfaceHeight(state.x,state.z)+.82,state.z);if(state.mounted){state.mounted=false;player.scale.setScalar(player.userData.baseScale||1);}resetJoy();activeWorkshop=null;closeAtlas();showToast(REGIONS.find(r=>r.id===id).name);updateUI();
  }else if(type==='incubate'){
    if(state.pet||!state.progress.research.includes('taming')||!hasCost({egg:1,berries:6})||Math.hypot(state.x+8,state.z-8)>8){showToast('Au camp : Domptage, 1 œuf et 6 baies requis.');return;}
    payCost({egg:1,berries:6});state.pet=true;showToast('Un jeune dragon a rejoint ton camp.');
  }else return;
  renderQuickbar();renderBag();emitProgress();saveGame();
});
function addDeathBag(data){
  const object=new THREE.Group();object.name="DeathBag";
  const bag=new THREE.Mesh(new THREE.SphereGeometry(.28,12,9),new THREE.MeshStandardMaterial({color:0x927248,roughness:.94}));
  bag.scale.set(1,.72,.82);bag.position.y=.19;bag.castShadow=true;object.add(bag);
  const strap=new THREE.Mesh(new THREE.TorusGeometry(.14,.027,6,16),new THREE.MeshStandardMaterial({color:0xc4ac7b,roughness:.9}));strap.position.y=.38;strap.rotation.x=Math.PI/2;object.add(strap);
  object.position.set(data.x,surfaceHeight(data.x,data.z),data.z);scene.add(object);
  const item={...data,object,removed:false};state.deathBags.push(item);
  world.interactables.push({type:"deathbag",object,radius:2,label:"Récupérer le sac de mort",position:()=>object.position,data:item});
}
function recoverBag(it){
  const bag=it.data;
  if(bag.expires<=Date.now()){it.removed=true;bag.removed=true;bag.object.visible=false;return;}
  for(const [id,n] of Object.entries(bag.inventory)){
    const accepted=maxFit(id,n);state.inventory[id]+=accepted;bag.inventory[id]-=accepted;
  }
  for(const id of [...bag.tools]){
    if(state.ownedTools.includes(id)||bagRemaining()>=gearWeights[id]){if(!state.ownedTools.includes(id))state.ownedTools.push(id);state.progress.toolTier[id]=Math.max(state.progress.toolTier[id],bag.toolTier?.[id]===2?2:1);bag.tools.splice(bag.tools.indexOf(id),1);}
  }
  if(Object.values(bag.inventory).every(n=>n<=0)&&bag.tools.length===0){it.removed=true;bag.removed=true;bag.object.visible=false;}
  state.selected=state.ownedTools[0]||"hands";syncEquippedTool();renderQuickbar();renderBag();saveGame();
  showToast(bag.removed?"Ton sac et ton équipement sont récupérés.":"Sac partiellement récupéré : libère de la place.");
}
function die(){
  const tools=[...state.ownedTools];
  if(Object.values(state.inventory).some(n=>n>0)||tools.length)addDeathBag({x:state.x,z:state.z,expires:Date.now()+3600000,inventory:{...state.inventory},tools,toolTier:{...state.progress.toolTier}});
  for(const id of Object.keys(state.inventory))state.inventory[id]=0;
  state.ownedTools=[];state.progress.toolTier={axe:1,pickaxe:1,sword:1};state.selected="hands";state.mounted=false;
  player.scale.setScalar(player.userData.baseScale||1);state.x=-5;state.z=6;
  state.hp=limits(state.progress).health;state.hunger=60;state.thirst=60;state.stamina=limits(state.progress).stamina;
  actionState.active=false;actionState.bare=false;actionState.lockMovement=false;motion.velocity.set(0,0);
  forceCleanSpawnUI();syncEquippedTool();renderQuickbar();renderBag();emitProgress();saveGame();
  showToast("Tu es tombé. Ton sac reste récupérable pendant une heure.");
}
function payCost(cost){for(const [k,v] of Object.entries(cost))state.inventory[k]-=v;renderQuickbar();renderBag();}
function costText(cost){const names={wood:"bois",stone:"pierre"};return Object.entries(cost).map(([k,v])=>v+" "+(names[k]||k)).join(" • ");}

const quickItems=[
  {id:"axe",icon:"🪓",key:"1"},{id:"pickaxe",icon:"⛏",key:"2"},{id:"sword",icon:"⚔",key:"3"},
  {id:"build",icon:"🔨",key:"4"},{id:"berries",icon:"🍒",key:"5",count:"berries"},{id:"cooked",icon:"🍖",key:"6",count:"cooked"}
];
function renderQuickbar(){
  ui.quickbar.innerHTML="";
  for(const it of quickItems){
    const b=document.createElement("button");b.className="qslot"+(state.selected===it.id?" active":"");b.innerHTML="<span>"+it.icon+"</span><small>"+it.key+"</small>"+(it.count?"<b>"+(state.inventory[it.count]||0)+"</b>":"");
    if(gearWeights[it.id]&&!state.ownedTools.includes(it.id)){b.disabled=true;b.title="À fabriquer dans Artisanat";}
    b.addEventListener("click",()=>selectItem(it.id));ui.quickbar.appendChild(b);
  }
}
function syncEquippedTool(){
  const tools=player.userData.tools;
  if(!tools)return;
  for(const [id,obj] of Object.entries(tools))obj.visible=state.selected===id&&state.ownedTools.includes(id);
}
function selectItem(id){
  if(gearWeights[id]&&!state.ownedTools.includes(id)){showToast("Fabrique cet outil dans Artisanat (✧).");return;}
  if(id==="build"){toggleBuild(true);return;}
  state.selected=id;
  syncEquippedTool();
  renderQuickbar();
}

const inputForward=new THREE.Vector3();
const inputRight=new THREE.Vector3();
const worldUp=new THREE.Vector3(0,1,0);

function inputVector(){
  if(window.everwildPaused||(document.getElementById("journeyPanel")?.hidden===false||document.getElementById("atlasPanel")?.hidden===false)||isBagOpen())return {x:0,z:0,strength:0};
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

function surfaceHeight(x,z){return Math.max(-.83,terrainHeight(x,z));}
function canMove(x,z){
  if(Math.abs(x)>WORLD_LIMIT||Math.abs(z)>WORLD_LIMIT)return false;
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
  if(window.everwildPaused)return false;
  if(actionState.active)return false;
  const defs={
    chop:{duration:1.02,impactAt:.60,lockMovement:true},
    mine:{duration:1.12,impactAt:.68,lockMovement:true},
    attack:{duration:.72,impactAt:.39,lockMovement:true},
    gather:{duration:.66,impactAt:.39,lockMovement:true},
    interact:{duration:.85,impactAt:.48,lockMovement:true},
    eat:{duration:1.20,impactAt:.72,lockMovement:true},
    drink:{duration:1.20,impactAt:.72,lockMovement:true},
    build:{duration:.82,impactAt:.48,lockMovement:true}
  };
  const def=defs[kind]||defs.interact;
  actionState.active=true;
  actionState.kind=kind;
  actionState.target=it;
  actionState.time=0;
  if(kind!=="gather")actionState.bare=false;
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
  if(actionState.kind==="build"){placeBuild();return;}
  if(actionState.kind==="eat"){
    const food=actionState.food;
    if((state.inventory[food]||0)>0){state.inventory[food]--;state.hunger=clamp(state.hunger+(food==="cooked"?32:10),0,limits(state.progress).hunger);if(food==="berries")state.thirst=clamp(state.thirst+4,0,limits(state.progress).thirst);showToast("Tu reprends des forces.");renderQuickbar();renderBag();}
    return;
  }
  if(actionState.kind==="drink"){state.thirst=clamp(state.thirst+35,0,limits(state.progress).thirst);showToast("Tu bois à la rivière.");return;}
  if(!it||it.removed||!it.object?.visible)return;
  if(it.type==="deathbag"){recoverBag(it);return;}
  if(actionState.bare){actionState.bare=false;it.bareCooldown=Date.now()+10000;learn(it.type==="tree"?"wood":"stone");give(it.type==="tree"?"wood":"stone",1,it.type==="tree"?"🪵":"🪨",it.type==="tree"?"Branche":"Pierre");return;}


  if(it.type==="tree"){
    it.hits++;learn(it.type==="tree"?"wood":"stone");
    triggerImpactPulse(it);
    showToast("Coup de hache "+it.hits+"/"+it.maxHits);
    if(it.hits>=it.maxHits){removeResource(it);give("wood",6+(state.progress.toolTier.axe-1)*3+practiceLevel(state.progress,"wood"),"🪵","Bois");}
  } else if(it.type==="rock"){
    it.hits++;learn(it.type==="tree"?"wood":"stone");
    triggerImpactPulse(it);
    showToast("Pioche "+it.hits+"/"+it.maxHits);
    if(it.hits>=it.maxHits){removeResource(it);give("stone",5+(state.progress.toolTier.pickaxe-1)*3+practiceLevel(state.progress,"stone"),"🪨","Pierre");}
  } else if(it.type==="ore"){
    it.hits++;learn(it.type==="tree"?"wood":"stone");
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
    it.cooldown=now+30000;learn("gather");
    triggerImpactPulse(it);
    give("berries",3+practiceLevel(state.progress,"gather"),"🍒","Baies");
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
    learn("craft");state.inventory.meat--;state.inventory.cooked++;state.objectives.cooked=true;
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
  } else if(it.type==="skeleton"||it.type==="fantasy"){
    it.object.userData.hp-=36*(state.progress.toolTier.sword||1)*limits(state.progress).damage;
    triggerImpactPulse(it);
    showToast((it.object.userData.name||"Squelette")+" : "+Math.round(Math.max(0,it.object.userData.hp))+" PV");
    if(it.object.userData.hp<=0){
      it.object.visible=false;it.removed=true;
      give("gold",2,"🟡","Or ancien");
      if(it.type==='fantasy'){give('meat',state.progress.research.includes('hunting')?5:2,'🥩','Viande');learn('gather');if(it.object.userData.kind==='dragon')give('egg',1,'🥚','Œuf de dragon');}
      showToast((it.object.userData.name||'Squelette')+' vaincu.');
    }
  }
  updateUI();
}

function updateActionAnimation(dt){
  if(!actionState.active)return;
  actionState.time=Math.min(actionState.duration,actionState.time+dt);
  if(!actionState.impacted&&actionState.time>=actionState.impactAt){
    actionState.impacted=true;resolveActionImpact(actionState.target);
  }
  if(actionState.time>=actionState.duration){
    actionState.active=false;actionState.kind=null;actionState.target=null;
    actionState.time=0;actionState.impacted=false;actionState.lockMovement=false;
  }
}

function doAction(){
  if(window.everwildPaused||(document.getElementById("journeyPanel")?.hidden===false||document.getElementById("atlasPanel")?.hidden===false)||state.hp<=0||actionState.active)return;
  if(state.buildMode){if(buildValid)beginAction("build",null);else showToast("Placement impossible ou ressources insuffisantes.");return;}

  if(state.mounted){
    state.mounted=false;
    world.horse.position.set(state.x+1.2,terrainHeight(state.x+1.2,state.z),state.z+.4);
    player.scale.setScalar(player.userData.baseScale||1);showToast("Tu descends du cheval.");return;
  }

  if(["berries","cooked"].includes(state.selected)){
    if((state.inventory[state.selected]||0)<=0){showToast("Tu n’as plus de cette nourriture.");return;}
    actionState.food=state.selected;beginAction("eat",null);return;
  }
  const it=nearestInteraction();
  if(!it&&Math.abs(state.z)<58&&Math.abs(state.x-getRiverX(state.z))<5.5){beginAction("drink",null);return;}
  if(!it&&regionAt(state.x,state.z).id==='coast'&&state.progress.research.includes('fishing')){if((state.fishingAt||0)>elapsed){showToast('Les poissons se dispersent.');return;}state.fishingAt=elapsed+15;give('meat',2,'🐟','Poisson frais');learn('gather');return;}
  if(!it){showToast("Rien à portée.");return;}

  if(it.type==="workshop"){activeWorkshop=it.object;openWorkshop();return;}
  if(it.type==="fantasy"){if(state.selected!=="sword"){showToast("Équipe une épée pour affronter cette créature.");return;}beginAction("attack",it);return;}
  if(it.type==="deathbag"){beginAction("interact",it);return;}
  if(it.type==="tree"){
    if(!state.ownedTools.includes("axe")){if((it.bareCooldown||0)>Date.now()){showToast("Pas de branche disponible pour le moment.");return;}actionState.bare=true;beginAction("gather",it);return;}
    if(state.selected!=="axe"){showToast("Équipe la hache pour couper cet arbre.");return;}
    beginAction("chop",it);return;
  } else if(it.type==="rock"){
    if(!state.ownedTools.includes("pickaxe")){if((it.bareCooldown||0)>Date.now()){showToast("Les pierres en surface ont été ramassées.");return;}actionState.bare=true;beginAction("gather",it);return;}
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
    state.mounted=true;player.scale.setScalar((player.userData.baseScale||1)*.86);showToast("Monture équipée — E pour descendre.");
  } else if(it.type==="farm"){
    const f=it.object.userData;
    if(!f.planted&&!state.progress.research.includes("agriculture")){showToast("Apprends l’agriculture dans Recherche (✧).");return;}
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
  const b=buildTypes[state.buildIndex];ui.buildPiece.textContent=b.label;ui.buildCost.textContent=costText(b.cost)+(b.id==="base_core"?" · rayon 18 m":b.tech?" · recherche Structures":" · près du cœur");
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
  const core=state.buildings.find(piece=>piece.type==="base_core");
  const baseValid=b.id==="base_core"?!core:Boolean(core&&Math.hypot(x-core.x,z-core.z)<=18);
  const techValid=!b.tech||state.progress.research.includes(b.tech);
  buildValid=baseValid&&techValid&&hasCost(b.cost)&&clear&&landDistance(x,z)>5&&Math.abs(x)<WORLD_LIMIT&&Math.abs(z)<WORLD_LIMIT&&!(Math.abs(z)<58&&Math.abs(x-getRiverX(z))<5.2);
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

  payCost(b.cost);learn("craft");
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
  if(actionState.active){ui.prompt.textContent={chop:"Abattage…",mine:"Extraction…",attack:"Attaque…",gather:"Récolte…",interact:"Interaction…",eat:"Repas…",drink:"Boire…",build:"Construction…"}[actionState.kind];return;}
  if(!state.buildMode&&!state.mounted&&["berries","cooked"].includes(state.selected)){ui.prompt.textContent="E / Action — Manger";return;}

  if(state.buildMode){
    const b=buildTypes[state.buildIndex];const core=state.buildings.find(piece=>piece.type==="base_core");
    const reason=b.tech&&!state.progress.research.includes(b.tech)?"Recherche Structures requise":b.id!=="base_core"&&!core?"Pose d’abord ton cœur de base":b.id==="base_core"&&core?"Un seul cœur de base autorisé":!hasCost(b.cost)?"Ressources requises":"Placement impossible";
    ui.prompt.textContent=(buildValid?"Action — Construire ":reason+" — ")+b.label+" · R : changer";return;
  }
  if(state.mounted){ui.prompt.textContent="E — Descendre de la monture";return;}
  nearest=nearestInteraction();
  if(!nearest){ui.prompt.textContent=Math.abs(state.z)<58&&Math.abs(state.x-getRiverX(state.z))<5.5?"E / Action — Boire à la rivière":"Explore, récolte, construis, survis";return;}
  if(nearest.type==="horse"&&nearest.object.userData.tamed)ui.prompt.textContent="E — Monter à cheval";
  else if(nearest.type==="farm"&&nearest.object.userData.ready)ui.prompt.textContent="E — Récolter les cultures";
  else ui.prompt.textContent="E — "+nearest.label;
}

let lastStateEmit=0;
function updateUI(){
  const max=limits(state.progress);state.bagCapacity=max.weight;
  setBar(ui.hpBar,ui.hpText,state.hp,max.health);setBar(ui.hungerBar,ui.hungerText,state.hunger,max.hunger);setBar(ui.thirstBar,ui.thirstText,state.thirst,max.thirst);setBar(ui.staminaBar,ui.staminaText,state.stamina,max.stamina);
  if(performance.now()-lastStateEmit>500){lastStateEmit=performance.now();emitProgress();}
  for(const bag of state.deathBags)if(!bag.removed&&bag.expires<=Date.now()){bag.removed=true;bag.object.visible=false;}

  if(ui.bagWeightMini)ui.bagWeightMini.textContent=Math.round(bagWeight())+" / "+state.bagCapacity;
  const mins=Math.floor(state.dayProgress*24*60),h=Math.floor(mins/60)%24,m=mins%60;
  const tasks=[
    ["Établis ton refuge", "Pose ton cœur de base : 🔨, puis Action. Récolte 12 pierres et 8 bois.",state.buildings.some(b=>b.type==="base_core")],
    ["Bâtis ton domaine", "Construis trois pièces près de ton cœur : 🔨 puis R pour changer. Recherche les structures de pierre.",state.buildings.length>=3],
    ["Explore les ruines", "Le coffre se trouve au nord-ouest. Garde ton épée à portée.",Boolean(world.chest.userData.opened)],
    ["Trouve ta monture", "Offre trois baies au cheval près de la rivière.",Boolean(world.horse.userData.tamed)]
  ];
  const next=tasks.find(t=>!t[2]);
  document.getElementById("questTitle").textContent=next?.[0]||"Ton domaine prend vie";
  document.getElementById("questDetail").textContent=next?.[1]||"Développe tes fortifications et continue ton exploration.";
  document.getElementById("questProgress").textContent=tasks.filter(t=>t[2]).length+" / 4";
  ui.day.textContent="Jour "+state.day;ui.clock.textContent=String(h).padStart(2,"0")+":"+String(m).padStart(2,"0");ui.season.textContent=seasonNames[state.season];
}

let petDragon=null;
let lastRegion='';
function updateRegion(){const r=regionAt(state.x,state.z);if(lastRegion!==r.id){lastRegion=r.id;document.getElementById('regionName').textContent=r.name;document.getElementById('regionDetail').textContent=r.subtitle+' · niv. '+r.min+'–'+r.max;}document.getElementById('regionDanger').textContent=r.id==='ocean'?'Nage en surface':r.min>state.progress.level+10?'Zone dangereuse':'Exploration';}
function stationKey(o){return o.userData.type+':'+Math.round(o.position.x)+':'+Math.round(o.position.z);}
function openWorkshop(){const u=activeWorkshop.userData;document.getElementById('stationBanner').hidden=false;document.getElementById('stationLabel').textContent=({forge:'Forge',alchemy:'Alchimie',carpenter:'Menuiserie'}[u.type])+' · palier '+u.tier+'/3';document.getElementById('stationUpgrade').textContent=u.tier===1?'Améliorer · niv. 3 · 12 bois / 10 pierre':u.tier===2?'Améliorer · niv. 8 · 6 lingots / 6 planches':'Palier maximal';document.getElementById('stationUpgrade').disabled=u.tier>=3;document.getElementById('journeyPanel').hidden=false;emitProgress();}
function closeAtlas(){document.getElementById('atlasPanel').hidden=true;window.everwildPaused=false;}
document.getElementById('stationUpgrade').addEventListener('click',()=>window.dispatchEvent(new CustomEvent('everwild-command',{detail:{type:'station-upgrade'}})));
function drawMinimap(){
  const c=ui.minimap,ctx=c.getContext("2d"),w=c.width,h=c.height;ctx.clearRect(0,0,w,h);
  ctx.save();ctx.beginPath();ctx.arc(w/2,h/2,w/2-2,0,Math.PI*2);ctx.clip();
  ctx.fillStyle=state.season===3?"#77857c":state.season===2?"#776c43":"#536f46";ctx.fillRect(0,0,w,h);
  const scale=.32,ox=w/2-state.x*scale,oz=h/2-state.z*scale;
  for(let pz=0;pz<h;pz+=5)for(let px=0;px<w;px+=5){const x=state.x+(px-w/2)/scale,z=state.z+(pz-h/2)/scale;ctx.fillStyle=landDistance(x,z)<0?'#367b91':'#'+regionAt(x,z).color.toString(16).padStart(6,'0');ctx.fillRect(px,pz,5,5);}
  for(const a of world.fantasy){if(!a.visible)continue;ctx.fillStyle='#d78970';ctx.fillRect(ox+a.position.x*scale-1,oz+a.position.z*scale-1,3,3);}
  ctx.strokeStyle="rgba(54,135,155,.88)";ctx.lineWidth=9;ctx.beginPath();
  for(let z=-60;z<=60;z+=2){const x=getRiverX(z);const px=ox+x*scale,py=oz+z*scale;if(z===-60)ctx.moveTo(px,py);else ctx.lineTo(px,py);}ctx.stroke();
  ctx.fillStyle="#b3a584";ctx.fillRect(ox-36*scale,oz-27*scale,7,7);
  ctx.fillStyle="#d5a04e";ctx.beginPath();ctx.arc(ox-8*scale,oz+8*scale,3,0,Math.PI*2);ctx.fill();
  ctx.fillStyle="#c68d54";ctx.beginPath();ctx.arc(ox+13*scale,oz+23*scale,3,0,Math.PI*2);ctx.fill();
  if(world.horse.visible){ctx.fillStyle="#a47754";ctx.beginPath();ctx.arc(ox+world.horse.position.x*scale,oz+world.horse.position.z*scale,2.5,0,Math.PI*2);ctx.fill();}
  for(const bag of state.deathBags){if(bag.removed)continue;ctx.fillStyle="#efbe70";ctx.beginPath();ctx.arc(ox+bag.x*scale,oz+bag.z*scale,3.5,0,Math.PI*2);ctx.fill();}
  for(const b of state.buildings){if(b.type!=="base_core")continue;ctx.fillStyle="#acdccc";ctx.fillRect(ox+b.x*scale-3,oz+b.z*scale-3,6,6);}
  ctx.translate(w/2,h/2);ctx.rotate(-Math.atan2(state.facing.x,state.facing.z));ctx.fillStyle="#f1ead2";ctx.beginPath();ctx.moveTo(0,-6);ctx.lineTo(4,5);ctx.lineTo(-4,5);ctx.closePath();ctx.fill();
  ctx.restore();
}

function saveGame(){
  try{
    localStorage.setItem(SAVE_KEY,JSON.stringify({
      x:state.x,z:state.z,hp:state.hp,hunger:state.hunger,thirst:state.thirst,inventory:state.inventory,selected:state.selected,
      day:state.day,dayProgress:state.dayProgress,horseTamed:world.horse.userData.tamed,chestOpened:world.chest.userData.opened,
      buildings:state.buildings,objectives:state.objectives,progress:state.progress,ownedTools:state.ownedTools,deathBags:state.deathBags.filter(b=>!b.removed).map(b=>({x:b.x,z:b.z,expires:b.expires,inventory:b.inventory,tools:b.tools,toolTier:b.toolTier})),stationTiers:state.stationTiers,pet:state.pet,version:2
    }));
  }catch(_){}
}
function loadGame(){
  try{
    const raw=localStorage.getItem(SAVE_KEY);if(!raw)return;
    const s=JSON.parse(raw);
    if(Number.isFinite(s.x)&&Number.isFinite(s.z)&&Math.abs(s.x)<WORLD_LIMIT&&Math.abs(s.z)<WORLD_LIMIT){state.x=s.x;state.z=s.z;}
    for(const k of ["hp","hunger","thirst","dayProgress"])if(Number.isFinite(s[k]))state[k]=Math.max(0,s[k]);
    if(Number.isFinite(s.day))state.day=Math.max(1,Math.floor(s.day));
    if(s.inventory&&typeof s.inventory==="object")for(const k of Object.keys(state.inventory))if(Number.isFinite(s.inventory[k]))state.inventory[k]=Math.max(0,Math.floor(s.inventory[k]));

    state.pet=Boolean(s.pet);
    for(const station of world.workshops){const key=stationKey(station);const tier=s.stationTiers?.[key];if([1,2,3].includes(tier)){station.userData.tier=tier;state.stationTiers[key]=tier;station.scale.y=1+(tier-1)*.08;}}
    state.progress=validateProgress(s.progress);state.bagCapacity=limits(state.progress).weight;
    if(Array.isArray(s.ownedTools))state.ownedTools=s.ownedTools.filter(id=>gearWeights[id]);
    if(Array.isArray(s.deathBags))for(const bag of s.deathBags)if(Number.isFinite(bag.x)&&Number.isFinite(bag.z)&&Number.isFinite(bag.expires)&&bag.expires>Date.now()&&Math.abs(bag.x)<WORLD_LIMIT&&Math.abs(bag.z)<WORLD_LIMIT){
      const clean={x:bag.x,z:bag.z,expires:bag.expires,inventory:{},toolTier:bag.toolTier,tools:Array.isArray(bag.tools)?bag.tools.filter(id=>gearWeights[id]):[]};
      for(const key of Object.keys(state.inventory))clean.inventory[key]=Number.isFinite(bag.inventory?.[key])?Math.max(0,Math.floor(bag.inventory[key])):0;
      addDeathBag(clean);
    }
    if(typeof s.selected==="string")state.selected=s.selected;
    world.horse.userData.tamed=Boolean(s.horseTamed);
    state.objectives.cooked=Boolean(s.objectives?.cooked||s.inventory?.cooked>=3);
    if(s.chestOpened){world.chest.userData.opened=true;if(world.chest.userData.lid)world.chest.userData.lid.rotation.y=-.9;}
    if(Array.isArray(s.buildings))for(const b of s.buildings){
      if(!b||!buildTypes.some(x=>x.id===b.type)||!Number.isFinite(b.x)||!Number.isFinite(b.z))continue;
      const obj=createBuildObject(b.type);obj.position.set(b.x,terrainHeight(b.x,b.z),b.z);obj.rotation.y=Number.isFinite(b.rot)?b.rot:0;scene.add(obj);
      const def=buildTypes.find(x=>x.id===b.type);world.buildings.push({object:obj,type:b.type,radius:def.radius});state.buildings.push({type:b.type,x:b.x,z:b.z,rot:obj.rotation.y});
    }
  }catch(_){}
}


function updateMovement(dt,time){
  const v=actionState.active&&actionState.lockMovement?{x:0,z:0,strength:0}:inputVector();
  const hasInput=v.strength>0;
  const touchSprint=joy.id!==null&&joy.strength>.86;
  const sprint=((keys.ShiftLeft||keys.ShiftRight)||touchSprint)&&state.stamina>2&&!state.mounted;

  let maxSpeed=state.mounted?8.3:sprint?6.25:4.15;
  const riverDist=Math.abs(state.z)<58?Math.abs(state.x-getRiverX(state.z)):100;
  if((riverDist<4.4&&Math.abs(state.z)>2.0||landDistance(state.x,state.z)<0)&&!state.mounted)maxSpeed*=.48;

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

  if(sprint&&hasInput)state.stamina=clamp(state.stamina-dt*19*clamp(v.strength,.55,1),0,limits(state.progress).stamina);
  else state.stamina=clamp(state.stamina+dt*15,0,limits(state.progress).stamina);

  const ground=surfaceHeight(state.x,state.z);
  if(state.mounted){
    const gait=Math.sin(time*(6.6+speed01*3.5))*0.035*speed01;
    world.horse.position.set(state.x,ground+Math.abs(gait)*.45,state.z);
    player.position.set(state.x,ground+1.48+Math.abs(gait),state.z);
    player.rotation.y=world.horse.rotation.y;
    player.userData.moveSpeed=actualSpeed;player.userData.sprinting=false;
  }else{
    player.userData.moveSpeed=actualSpeed;player.userData.sprinting=sprint;
    player.position.set(state.x,ground,state.z);
  }
}

function updateSurvival(dt){
  state.hunger=clamp(state.hunger-dt*(100/3600),0,limits(state.progress).hunger);state.thirst=clamp(state.thirst-dt*(100/3600),0,limits(state.progress).thirst);
  if(state.hunger<=0||state.thirst<=0)state.hp=clamp(state.hp-dt*1.7,0,limits(state.progress).health);
  state.dayProgress+=dt/300;
  if(state.dayProgress>=1){state.dayProgress-=1;state.day++;}
  const season=Math.floor((state.day-1)/3)%4;
  if(season!==state.season){state.season=season;setWorldSeason(world,season);scene.background.set(seasonSky[season]);showToast("Nouvelle saison : "+seasonNames[season]);}
}

function updateEnemyDamage(){
  for(const sk of world.enemies){
    if(!sk.visible||sk.userData.hp<=0)continue;
    const d=Math.hypot(state.x-sk.position.x,state.z-sk.position.z);
    if(d<(sk.userData.kind==="dragon"?4:1.65)&&sk.userData.cooldown<=0){
      sk.userData.cooldown=1.15;player.userData.hurt=1;state.hp=clamp(state.hp-(sk.userData.damage||12),0,limits(state.progress).health);showToast((sk.userData.name||"Le squelette")+" t’attaque !");
      if(state.hp<=0)die();
    }
  }
}

function updateDayLight(){
  const a=state.dayProgress*Math.PI*2-Math.PI/2, daylight=clamp(Math.sin(a)*.66+.46,.18,1);
  hemi.intensity=.78+daylight*.68;sun.intensity=.48+daylight*1.95;
  sun.color.set(daylight>.55?0xffdda0:0xc1b4b0);
  sun.position.set(state.x+Math.cos(a)*28,10+daylight*31,state.z+Math.sin(a)*24);sun.target.position.set(state.x,0,state.z);scene.add(sun.target);
  const base=new THREE.Color(seasonSky[state.season]);const night=new THREE.Color(0x243448);scene.background.copy(night).lerp(base,.20+daylight*.80);
  const biome=regionAt(state.x,state.z);const cold=['snow','island4'].includes(biome.id);
  scene.fog.color.copy(scene.background).lerp(new THREE.Color(cold?0xb7cfda:biome.id==='desert'?0xc7b18c:biome.id==='volcanic'||biome.id==='island5'?0x8d7970:0x9daf9a),.35);
  world.snow.visible=cold||(state.season===3&&!['desert','tropical','island2','volcanic','island5','ocean'].includes(biome.id));world.snow.position.set(state.x,surfaceHeight(state.x,state.z),state.z);world.snowGround.visible=false;
}

function updateCamera(dt){
  const lookAheadX=motion.velocity.x*.42;
  const lookAheadZ=motion.velocity.y*.42;
  const targetY=surfaceHeight(state.x,state.z)+(state.mounted?1.15:.82);
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

  if(state.selected==="build"||gearWeights[state.selected]&&!state.ownedTools.includes(state.selected))state.selected=state.ownedTools[0]||"hands";
}

let lastMinimap=0;
function frame(now){
  const dt=Math.min((now-last)/1000,.05);last=now;
  if(window.everwildPaused){motion.velocity.set(0,0);resetJoy();requestAnimationFrame(frame);return;}
  elapsed+=dt;
  if(state.pet&&!petDragon){petDragon=createDragon(0x709684);petDragon.scale.setScalar(.42);petDragon.position.set(-5,terrainHeight(-5,10),10);scene.add(petDragon);}
  if(petDragon){petDragon.userData.wings.forEach((w,i)=>w.rotation.z=(i===0?-1:1)*(.25+Math.sin(elapsed*2)*.18));petDragon.userData.tail.rotation.y=Math.sin(elapsed)*.25;}
  if(activeWorkshop&&Math.hypot(state.x-activeWorkshop.position.x,state.z-activeWorkshop.position.z)>4){activeWorkshop=null;document.getElementById('stationBanner').hidden=true;emitProgress();}
  updateMovement(dt,elapsed);updateActionAnimation(dt);updateSurvival(dt);updateBuildPreview();const playerWorldPos=new THREE.Vector3(state.x,0,state.z);
  updateWorld(world,dt,elapsed,playerWorldPos);
  if(premiumZoneUpdater)premiumZoneUpdater(premiumZone,elapsed,playerWorldPos);
  if(state.hp<=0)die();
  updateEnemyDamage();
  updateCharacter(player,dt,{time:elapsed,speed:player.userData.moveSpeed||0,sprinting:player.userData.sprinting,mounted:state.mounted,action:actionState,ground:surfaceHeight(state.x,state.z),height:surfaceHeight,x:state.x,z:state.z,yaw:player.rotation.y});
  updateDayLight();ambience.update(elapsed,state.dayProgress,state.season);updateCamera(dt);updatePrompt();updateUI();updateRegion();
  if(now-lastMinimap>100){drawMinimap();lastMinimap=now;}
  renderer.render(scene,camera);
  if(now-state.lastSave>10000){state.lastSave=now;saveGame();}
  requestAnimationFrame(frame);
}

addEventListener("keydown",e=>{
  if(window.everwildPaused||(document.getElementById("journeyPanel")?.hidden===false||document.getElementById("atlasPanel")?.hidden===false))return;
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
function changeZoom(delta){viewSize=clamp(viewSize+delta,10,26);resize();}
canvas.addEventListener("wheel",e=>changeZoom(Math.sign(e.deltaY)*1.2),{passive:true});
document.getElementById("zoomIn").addEventListener("click",()=>changeZoom(-2));
document.getElementById("zoomOut").addEventListener("click",()=>changeZoom(2));


ui.actionBtn.addEventListener("pointerdown",e=>{e.preventDefault();doAction();});
ui.buildBtn.addEventListener("click",()=>toggleBuild());
ui.bagBtn?.addEventListener("click",()=>toggleBag());
ui.bagTouchBtn?.addEventListener("click",()=>toggleBag());
ui.bagClose?.addEventListener("click",()=>toggleBag(false));
document.getElementById("buildCycle").addEventListener("click",cycleBuild);
document.getElementById("buildClose").addEventListener("click",()=>toggleBuild(false));

const floatingStick=document.getElementById("floatingStick");
const floatingKnob=document.getElementById("floatingKnob");
const JOY_MAX=38;
const JOY_DEADZONE=5;

function beginFloatingJoy(e){
  if(window.everwildPaused||(document.getElementById("journeyPanel")?.hidden===false||document.getElementById("atlasPanel")?.hidden===false)||e.pointerType==="mouse"||joy.id!==null)return;
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
forceCleanSpawnUI();refreshLimits();emitProgress();
state.season=Math.floor((state.day-1)/3)%4;setWorldSeason(world,state.season);scene.background.set(seasonSky[state.season]);
player.position.set(state.x,surfaceHeight(state.x,state.z),state.z);
motion.cameraFocus.set(state.x,surfaceHeight(state.x,state.z)+.82,state.z);
motion.yaw=player.rotation.y;motion.targetYaw=motion.yaw;
syncEquippedTool();renderQuickbar();renderBag();updateBuildPanel();updateUI();
loadingProgress(62,"Initialisation du joueur et de la carte");
showToast("Bienvenue dans Everwild.");
requestAnimationFrame(frame);
bootPremiumZone();
