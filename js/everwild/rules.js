export const RACES=[
  {id:"human",name:"Humains",symbol:"☉",color:"#d4b78d",description:"Les peuples des plaines et des cités.",skin:0xc99770,cloth:0x617258},
  {id:"elf",name:"Elfes",symbol:"❧",color:"#91bb9c",description:"Une silhouette élancée, des oreilles pointues.",skin:0xd5b7a0,cloth:0x496a58},
  {id:"orc",name:"Orcs",symbol:"⟁",color:"#a2af75",description:"Une carrure puissante et une peau verdoyante.",skin:0x82986b,cloth:0x5d6250},
  {id:"dwarf",name:"Nains",symbol:"⬡",color:"#cfaa75",description:"Petits, robustes, à la barbe fournie.",skin:0xc09172,cloth:0x795e45},
  {id:"draconian",name:"Draconiens",symbol:"♜",color:"#cd947a",description:"Le Peuple du Feu, marqué par ses cornes.",skin:0xb17355,cloth:0x73524a},
  {id:"snow",name:"Peuple de la Neige",symbol:"❄",color:"#b4cfdd",description:"Peau pâle et teintes des terres glacées.",skin:0xd0dbe0,cloth:0x6c8391},
  {id:"trees",name:"Peuple des Arbres",symbol:"♧",color:"#a0b985",description:"Des teintes d’écorce et de sous-bois.",skin:0x928368,cloth:0x557447},
  {id:"desert",name:"Peuple du Désert",symbol:"◇",color:"#dbc491",description:"Des étoffes aux couleurs du sable.",skin:0xad805d,cloth:0xb19b70}
];
export const STAT_FIELDS=[
  ["health","Santé","+10 PV"],["stamina","Endurance","+10 endurance"],
  ["weight","Poids","+10 capacité"],["resistance","Résistance","Climat · à venir"],
  ["damage","Dégâts","+5 % dégâts"],["oxygen","Oxygène","Plongée · à venir"],
  ["hunger","Faim","+10 réserve"],["thirst","Soif","+10 réserve"]
];
export const PRACTICES=[["wood","Abattage"],["stone","Minage"],["gather","Ramassage"],["craft","Artisanat"]];
export const BRANCHES=[
  {id:"tools",name:"Outils",cost:{wood:4,stone:4},detail:"Débloque l’épée et les outils de métal."},
  {id:"structures",name:"Structures",cost:{stone:12,wood:8},detail:"Débloque les fortifications de pierre."},
  {id:"agriculture",name:"Agriculture",cost:{seeds:5,wood:4},detail:"Permet de semer le champ près du camp."},
  {id:"alchemy",name:"Alchimie",cost:{berries:8,ore:2},detail:"Débloque l’élixir de redistribution des points."}
];
export const RECIPES=[
  {id:"axe",name:"Hache",icon:"🪓",cost:{wood:4,stone:3},gear:true},
  {id:"pickaxe",name:"Pioche",icon:"⛏",cost:{wood:6,stone:8},gear:true},
  {id:"sword",name:"Épée",icon:"⚔",cost:{wood:5,ore:4},gear:true,tech:"tools"},
  {id:"respec",name:"Élixir de redistribution",icon:"⚗",cost:{berries:6,ore:2},tech:"alchemy"}
];
export function newProgress(){return {level:1,xp:0,points:0,stats:Object.fromEntries(STAT_FIELDS.map(([id])=>[id,0])),practice:Object.fromEntries(PRACTICES.map(([id])=>[id,0])),research:[],researchPoints:1};}
export function xpRequired(level){return 50+Math.max(0,level-1)*25;}
export function practiceLevel(progress,id){return Math.floor((progress.practice[id]||0)/10);}
export function train(progress,id,amount=1){
  if(!PRACTICES.some(([key])=>key===id))return 0;
  progress.practice[id]=(progress.practice[id]||0)+amount;
  progress.xp+=amount*8;let gained=0;
  while(progress.xp>=xpRequired(progress.level)){
    progress.xp-=xpRequired(progress.level);progress.level++;gained++;
    progress.points+=progress.level%5===0?3:2;progress.researchPoints++;
  }
  return gained;
}
export function limits(progress){const s=progress.stats;return {health:100+s.health*10,stamina:100+s.stamina*10,weight:80+s.weight*10,hunger:100+s.hunger*10,thirst:100+s.thirst*10,oxygen:100+s.oxygen*10,resistance:s.resistance,damage:1+s.damage*.05};}
export function allocate(progress,id){if(progress.points<1||!STAT_FIELDS.some(([key])=>key===id))return false;progress.stats[id]++;progress.points--;return true;}
export function validateProgress(value){
  const p=newProgress();if(!value||typeof value!=="object")return p;
  for(const key of ["level","xp","points","researchPoints"]){if(Number.isFinite(value[key])&&value[key]>=0)p[key]=Math.floor(value[key]);}
  p.level=Math.max(1,p.level);
  for(const key of Object.keys(p.stats))if(Number.isFinite(value.stats?.[key])&&value.stats[key]>=0)p.stats[key]=Math.floor(value.stats[key]);
  for(const key of Object.keys(p.practice))if(Number.isFinite(value.practice?.[key])&&value.practice[key]>=0)p.practice[key]=Math.floor(value.practice[key]);
  p.research=Array.isArray(value.research)?value.research.filter(id=>BRANCHES.some(x=>x.id===id)):[];return p;
}
