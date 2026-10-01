import {REGIONS} from './geography.js?v=ew2';
import { RACES,STAT_FIELDS,PRACTICES,BRANCHES,RECIPES,xpRequired,practiceLevel } from "./rules.js?v=ew2";
const $=id=>document.getElementById(id);
let profile=null,started=false,starting=false,selection="human",latest=null;
let settings={quality:(matchMedia("(pointer:coarse)").matches||innerWidth<=600)?"light":"balanced"};
try{
  const saved=JSON.parse(localStorage.getItem("everwild-profile"));
  if(saved&&RACES.some(r=>r.id===saved.race)&&typeof saved.name==="string"&&typeof saved.id==="string")profile=saved;
  const stored=JSON.parse(localStorage.getItem("everwild-settings"));if(["light","balanced","high"].includes(stored?.quality))settings.quality=stored.quality;
}catch{}
window.everwildProfile=profile;window.everwildSettings=settings;window.everwildPaused=true;
const command=(type,id)=>window.dispatchEvent(new CustomEvent("everwild-command",{detail:{type,id}}));
function showPanel(id){$("ewMenu").scrollTop=0;for(const panel of document.querySelectorAll(".ew-page"))panel.hidden=panel.id!==id;}
function menu(){window.everwildPaused=true;$("ewMenu").hidden=false;$("atlasPanel").hidden=true;$("journeyPanel").hidden=true;$("loading").classList.add("hidden");showPanel("ewHome");$("ewPlay").textContent=started?"Reprendre l’aventure":profile?"Continuer l’aventure":"Commencer l’aventure";}
function raceSelection(){
  $("raceGrid").replaceChildren();
  for(const race of RACES){
    const button=document.createElement("button");button.type="button";button.className="race-card";
    button.setAttribute("aria-pressed",String(selection===race.id));button.style.setProperty("--race",race.color);
    const icon=document.createElement("span");icon.className="race-symbol";icon.textContent=race.symbol;
    const label=document.createElement("strong");label.textContent=race.name;
    const note=document.createElement("small");note.textContent=race.description;
    button.append(icon,label,note);button.addEventListener("click",()=>{selection=race.id;raceSelection();});$("raceGrid").append(button);
  }
  $("chosenRace").textContent=RACES.find(r=>r.id===selection).name;
}
async function play(){
  if(starting)return;
  if(!profile){showPanel("ewCharacter");raceSelection();return;}
  $("ewMenu").hidden=true;window.everwildPaused=false;
  if(started)return;
  starting=true;$("loading").classList.remove("hidden");$("loadingLabel").textContent="Ouverture des terres d’Everwild…";$("loadingErrorBack").hidden=true;
  try{
    await import("../v20/main.js?v=ew2c");started=true;
    $("loading").classList.add("hidden");
    $("survivorName").textContent=profile.name;$("survivorRace").textContent=RACES.find(r=>r.id===profile.race).name;
  }catch(error){
    window.everwildPaused=true;$("loadingLabel").textContent="Le moteur 3D n’a pas pu démarrer.";
    $("loadingHint").textContent="Essaie dans Chrome avec l’accélération graphique activée.";
    $("loadingErrorBack").hidden=false;console.error("Everwild startup",error);
  }finally{starting=false;}
}
$("ewPlay").addEventListener("click",play);
$("characterName").addEventListener("input",()=>$("characterName").setCustomValidity(""));
$("characterForm").addEventListener("submit",event=>{
  event.preventDefault();if(profile)return;
  const name=$("characterName").value.trim();if(!name){$("characterName").setCustomValidity("Choisis un nom pour ton personnage.");$("characterName").reportValidity();return;}
  profile={id:crypto.randomUUID(),name:name.slice(0,24),race:selection,body:$("characterBody").value};
  window.everwildProfile=profile;
  try{localStorage.setItem("everwild-profile",JSON.stringify(profile));}catch{}
  play();
});
$("ewSettings").addEventListener("click",()=>showPanel("ewSettingsPage"));
$("ewWorld").addEventListener("click",()=>showPanel("ewWorldPage"));
$("ewServers").addEventListener("click",()=>showPanel("ewServersPage"));
for(const back of document.querySelectorAll("[data-home]"))back.addEventListener("click",menu);
$("menuBtn").addEventListener("click",menu);$("loadingErrorBack").addEventListener("click",menu);
$("qualitySelect").value=settings.quality;
$("qualitySelect").addEventListener("change",()=>{
  settings.quality=$("qualitySelect").value;window.everwildSettings=settings;
  try{localStorage.setItem("everwild-settings",JSON.stringify(settings));}catch{}
  window.dispatchEvent(new CustomEvent("everwild-settings",{detail:settings}));
});
$("fullscreenBtn").addEventListener("click",async()=>{
  try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}
  catch{$("settingsFeedback").textContent="Le plein écran n’est pas disponible dans ce navigateur.";}
});
window.addEventListener("survival-loading",event=>{
  const {percent,label}=event.detail||{};$("loadingBar").style.width=Math.max(0,Math.min(100,percent||0))+"%";
  $("loadingPercent").textContent=Math.round(percent||0)+"%";if(label)$("loadingLabel").textContent=label;
});

function renderJourney(){
  if(!latest)return;const p=latest.progress;
  $("levelLabel").textContent="Niveau "+p.level;$("xpLabel").textContent=p.xp+" / "+xpRequired(p.level)+" XP";
  $("xpBar").style.width=Math.min(100,p.xp/xpRequired(p.level)*100)+"%";
  $("pointsLabel").textContent=p.points+" point"+(p.points===1?"":"s")+" à distribuer";
  $("statGrid").replaceChildren();
  for(const [id,name,detail] of STAT_FIELDS){
    const row=document.createElement("div");row.className="ew-stat-row";
    const label=document.createElement("span");label.textContent=name;
    const info=document.createElement("small");info.textContent=detail;
    const value=document.createElement("b");value.textContent=p.stats[id];
    const button=document.createElement("button");button.textContent="+";button.disabled=p.points<1||["resistance","oxygen"].includes(id);button.setAttribute("aria-label","Améliorer "+name);button.addEventListener("click",()=>command("stat",id));
    row.append(label,info,value,button);$("statGrid").append(row);
  }
  $("practiceGrid").replaceChildren();
  for(const [id,name] of PRACTICES){
    const row=document.createElement("div");row.className="ew-practice";
    const label=document.createElement("strong");label.textContent=name;
    const detail=document.createElement("span");detail.textContent="Niv. "+practiceLevel(p,id)+" · "+(p.practice[id]%10)+" / 10";
    row.append(label,detail);$("practiceGrid").append(row);
  }
  $("researchPoints").textContent=p.researchPoints+" point"+(p.researchPoints===1?"":"s")+" de recherche";
  $("researchGrid").replaceChildren();
  for(const branch of BRANCHES){
    const card=document.createElement("div");card.className="ew-research";
    const name=document.createElement("strong");name.textContent=branch.name;
    const description=document.createElement("small");description.textContent=branch.detail;
    const cost=document.createElement("span");cost.textContent=costText(branch.cost)+" · 1 point";
    const button=document.createElement("button");const known=p.research.includes(branch.id);
    button.textContent=known?"Appris":"Rechercher";button.disabled=known||p.researchPoints<1||!afford(branch.cost);
    button.addEventListener("click",()=>command("research",branch.id));card.append(name,description,cost,button);$("researchGrid").append(card);
  }
  $("craftGrid").replaceChildren();
  for(const recipe of RECIPES){
    const row=document.createElement("div");row.className="ew-research";
    const label=document.createElement("strong");label.textContent=recipe.icon+" "+recipe.name;
    const cost=document.createElement("small");cost.textContent=costText(recipe.cost)+(recipe.station?' · '+({forge:'Forge',carpenter:'Menuiserie',alchemy:'Alchimie'}[recipe.station])+' '+recipe.tier:'');
    const button=document.createElement("button"),owned=(recipe.gear&&latest.ownedTools.includes(recipe.id))||(recipe.upgrade&&p.toolTier[recipe.upgrade]>=2),locked=recipe.tech&&!p.research.includes(recipe.tech),stationLocked=recipe.station&&(!latest.station||latest.station.type!==recipe.station||latest.station.tier<recipe.tier);
    button.textContent=owned?"Acquis":locked?"Recherche requise":stationLocked?"Atelier requis":"Fabriquer";button.disabled=Boolean(owned||locked||stationLocked||!afford(recipe.cost));
    button.addEventListener("click",()=>command("craft",recipe.id));row.append(label,cost,button);$("craftGrid").append(row);
  }
}
const itemNames={wood:"bois",stone:"pierre",ore:"minerai",seeds:"graines",berries:"baies",ingot:"lingots",plank:"planches",grain:"grain"};
function costText(cost){return Object.entries(cost).map(([id,n])=>n+" "+(itemNames[id]||id)).join(" · ");}
function afford(cost){return Object.entries(cost).every(([id,n])=>(latest?.inventory[id]||0)>=n);}
window.addEventListener("everwild-state",event=>{latest=event.detail;$("survivorLevel").textContent="Niv. "+latest.progress.level;if(!$("journeyPanel").hidden)renderJourney();});
$("journeyBtn").addEventListener("click",()=>{$("journeyPanel").hidden=!$("journeyPanel").hidden;if(!$("journeyPanel").hidden)renderJourney();});
$("journeyClose").addEventListener("click",()=>$("journeyPanel").hidden=true);
document.addEventListener("keydown",event=>{
  if(event.code==="KeyP"&&started&&$("ewMenu").hidden){$("journeyPanel").hidden=!$("journeyPanel").hidden;renderJourney();}
  if(event.code==="Escape"&&started){if(!$("journeyPanel").hidden)$("journeyPanel").hidden=true;else if($("ewMenu").hidden)menu();else play();}
});
menu();

const biomeSymbols={meadow:'❧',steppe:'〰',desert:'☀',tropical:'♧',swamp:'♒',mountain:'△',snow:'❄',volcanic:'♜',coast:'≈',island1:'♜',island2:'♧',island3:'❧',island4:'❄',island5:'♜'};
function fillAtlas(container,travel){for(const r of REGIONS){const card=document.createElement(travel?'button':'article');card.className='ew-destination';card.style.setProperty('--biome','#'+r.color.toString(16).padStart(6,'0'));const icon=document.createElement('i');icon.textContent=biomeSymbols[r.id];const title=document.createElement('strong');title.textContent=r.name;const desc=document.createElement('small');desc.textContent=r.subtitle;const level=document.createElement('span');level.textContent='Niv. '+r.min+'–'+r.max+(travel?' · Explorer ↗':'');card.append(icon,title,desc,level);if(travel)card.addEventListener('click',()=>command('travel',r.id));container.append(card);}}
fillAtlas($('worldRegionGrid'),false);fillAtlas($('atlasGrid'),true);
$('atlasBtn').addEventListener('click',()=>{if(!started)return;$('journeyPanel').hidden=true;$('atlasPanel').hidden=false;window.everwildPaused=true;});
$('atlasClose').addEventListener('click',()=>{$('atlasPanel').hidden=true;window.everwildPaused=false;});
$('incubateBtn').addEventListener('click',()=>{command('incubate');$('atlasPanel').hidden=true;window.everwildPaused=false;});
