// Playable V7 silhouette derived from the validated land mask, at compact web scale.
import {LAND_SIZE,LAND_SDF} from './v7-land.js?v=ew5';
export const WORLD_LIMIT=248;
export const ISLANDS=[{x:210,z:192,r:25},{x:-177,z:161,r:41},{x:-187,z:-192,r:30},{x:207,z:-177,r:28},{x:-205,z:-43,r:25}];
export const REGIONS=[
 {id:'meadow',name:'Val-des-Roches',subtitle:'Forêts tempérées & plaines',x:-4,z:4,color:0x789465,min:1,max:10},
 {id:'steppe',name:'Steppes d’Aure',subtitle:'Hautes herbes & grands horizons',x:-40,z:55,color:0xab9860,min:8,max:22},
 {id:'desert',name:'Dunes d’Ambre',subtitle:'Désert & oasis',x:-85,z:80,color:0xddbf86,min:15,max:35},
 {id:'tropical',name:'Canopée d’Émeraude',subtitle:'Forêt tropicale',x:0,z:-125,color:0x527f58,min:12,max:30},
 {id:'swamp',name:'Marais des Murmures',subtitle:'Brume & arbres anciens',x:-120,z:0,color:0x778877,min:20,max:42},
 {id:'mountain',name:'Vantuman · contreforts',subtitle:'Montagnes & veines métalliques',x:65,z:-30,color:0x96928b,min:25,max:50},
 {id:'snow',name:'Couronne de Givre',subtitle:'Glacier & forêt boréale',x:145,z:0,color:0xdce8e9,min:30,max:60},
 {id:'volcanic',name:'Terres de Braise',subtitle:'Cendres & cristaux de feu',x:-42,z:165,color:0x71605b,min:40,max:70},
 {id:'canyon',name:'Canyon des Ombres',subtitle:'Falaises & ressources rares',x:-116,z:108,color:0xad805e,min:28,max:55},
 {id:'mushroom',name:'Bois des Champignons',subtitle:'Champignons géants & sous-bois lumineux',x:5,z:131,color:0x687b82,min:24,max:48},
 {id:'coast',name:'Rivage des Voiles',subtitle:'Plages & océan',x:-143,z:-98,color:0xc9bb99,min:5,max:18},
 {id:'island1',name:'Île du Nord-Est',subtitle:'Nid des drakes',x:210,z:192,color:0x9c9980,min:35,max:65},
 {id:'island2',name:'Île Tropicale',subtitle:'Archipel tropical',x:-177,z:161,color:0x699667,min:18,max:38},
 {id:'island3',name:'Île du Sud-Ouest',subtitle:'Ruines & gardiens sylvestres',x:-187,z:-192,color:0x838f74,min:25,max:48},
 {id:'island4',name:'Île du Nord-Ouest',subtitle:'Rochers & forêt boréale',x:207,z:-177,color:0xa1b6b6,min:32,max:55},
 {id:'island5',name:'Île du Sud',subtitle:'Basalte & dragons de feu',x:-205,z:-43,color:0x856c63,min:45,max:75}
];
export function landDistance(x,z){
 if(!Number.isFinite(x)||!Number.isFinite(z)||Math.abs(x)>248||Math.abs(z)>248)return -100;
 const u=(x+248)/496*(LAND_SIZE-1),v=(z+248)/496*(LAND_SIZE-1),i=Math.floor(u),j=Math.floor(v),tx=u-i,tz=v-j;
 const at=(a,b)=>LAND_SDF[Math.min(LAND_SIZE-1,b)*LAND_SIZE+Math.min(LAND_SIZE-1,a)]/4;
 return (at(i,j)*(1-tx)+at(i+1,j)*tx)*(1-tz)+(at(i,j+1)*(1-tx)+at(i+1,j+1)*tx)*tz;
}
export function regionAt(x,z){if(landDistance(x,z)<-3)return {id:'ocean',name:'Mer des Cinq Îles',subtitle:'Océan',color:0x437e8e,min:1,max:75};let best=REGIONS[0],d=Infinity;for(const r of REGIONS){const n=Math.hypot(x-r.x,z-r.z);if(n<d){d=n;best=r;}}return best;}
// Vantuman runs diagonally across the continent, with northern glacial ridges.
export function outerHeight(x,z){
 const shore=landDistance(x,z);if(shore<0)return -1.8-Math.min(8,-shore*.16);
 const gaussian=(cx,cz,rx,rz)=>Math.exp(-(((x-cx)/rx)**2+((z-cz)/rz)**2));
 const ridge=34*gaussian(65,-30,23,35)+25*gaussian(2,14,25,28)+23*gaussian(-41,49,24,29)+19*gaussian(-76,78,20,22);
 const glacier=30*gaussian(142,-10,23,77)+18*gaussian(173,36,21,38);
 const volcano=19*gaussian(-42,165,20,22)+12*gaussian(-177,161,17,21);
 const rugged=1+.13*Math.sin(x*.39)*Math.cos(z*.31)+.08*Math.sin((x+z)*.61);
 const roll=1.6+1.1*Math.sin(x*.055)*Math.cos(z*.048)+.5*Math.sin((x+z)*.12);
 const valley=Math.min(1,Math.max(0,(Math.hypot(x,z)-30)/24));
 return Math.max(-.6,(roll+(ridge+glacier+volcano)*rugged*valley)*Math.min(1,shore/7));
}
export function spawnAt(id){const r=REGIONS.find(r=>r.id===id);return r?{x:r.x,z:r.z}:null;}

export const RIVERS=[[[105,-15],[80,-39],[43,-65],[15,-94],[-8,-153]],[[25,15],[-12,-9],[-47,-23],[-82,-37],[-152,-58]],[[-45,64],[-69,43],[-104,32],[-146,12]]];
