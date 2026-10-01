// A compact exploration map; the final Unreal V7 geography is a separate asset.
export const WORLD_LIMIT=248;
export const ISLANDS=[{x:178,z:0,r:27},{x:162,z:152,r:30},{x:-166,z:132,r:31},{x:-174,z:-130,r:29},{x:98,z:-185,r:27}];
export const REGIONS=[
 {id:'meadow',name:'Val-des-Roches',subtitle:'Forêts tempérées & plaines',x:-4,z:4,color:0x91a879,min:1,max:10},
 {id:'steppe',name:'Steppes d’Aure',subtitle:'Hautes herbes & grands horizons',x:72,z:0,color:0xb9a56b,min:8,max:22},
 {id:'desert',name:'Dunes d’Ambre',subtitle:'Désert & oasis',x:80,z:70,color:0xddbf86,min:15,max:35},
 {id:'tropical',name:'Canopée d’Émeraude',subtitle:'Forêt tropicale',x:-80,z:55,color:0x527f58,min:12,max:30},
 {id:'swamp',name:'Marais des Murmures',subtitle:'Brume & arbres anciens',x:-80,z:-55,color:0x778877,min:20,max:42},
 {id:'mountain',name:'Vantuman · contreforts',subtitle:'Montagnes & veines métalliques',x:0,z:-63,color:0x96928b,min:25,max:50},
 {id:'snow',name:'Couronne de Givre',subtitle:'Glacier & forêt boréale',x:-15,z:-104,color:0xdce8e9,min:30,max:60},
 {id:'volcanic',name:'Terres de Braise',subtitle:'Cendres & cristaux de feu',x:85,z:-72,color:0x71605b,min:40,max:70},
 {id:'coast',name:'Rivage des Voiles',subtitle:'Plages & océan',x:0,z:114,color:0xc9bb99,min:5,max:18},
 {id:'island1',name:'Île du Dragon',subtitle:'Nid des drakes',x:178,z:0,color:0x9c9980,min:35,max:65},
 {id:'island2',name:'Île des Palmes',subtitle:'Archipel tropical',x:162,z:152,color:0x699667,min:18,max:38},
 {id:'island3',name:'Île des Anciens',subtitle:'Ruines & gardiens sylvestres',x:-166,z:132,color:0x838f74,min:25,max:48},
 {id:'island4',name:'Île des Brumes',subtitle:'Rochers & forêt boréale',x:-174,z:-130,color:0xa1b6b6,min:32,max:55},
 {id:'island5',name:'Île de Cendre',subtitle:'Basalte & dragons de feu',x:98,z:-185,color:0x856c63,min:45,max:75}
];
export function landDistance(x,z){let d=125-Math.hypot(x,z*1.03);for(const i of ISLANDS)d=Math.max(d,i.r-Math.hypot(x-i.x,z-i.z));return d;}
export function regionAt(x,z){if(landDistance(x,z)<-3)return {id:'ocean',name:'Mer des Cinq Îles',subtitle:'Océan',color:0x437e8e,min:1,max:75};let best=REGIONS[0],d=Infinity;for(const r of REGIONS){const n=Math.hypot(x-r.x,z-r.z);if(n<d){d=n;best=r;}}return best;}
export function outerHeight(x,z){const shore=landDistance(x,z);if(shore<0)return -1.8;
 const ridge=21*Math.exp(-((x/26)**2+((z+83)/28)**2));
 const volcano=13*Math.exp(-(((x-85)/20)**2+((z+72)/22)**2));
 const roll=1.2+1.4*Math.sin(x*.07)*Math.cos(z*.06)+.7*Math.sin((x+z)*.14);
 return Math.max(-.5,(roll+ridge+volcano)*Math.min(1,shore/12));}
export function spawnAt(id){const r=REGIONS.find(r=>r.id===id);return r?{x:r.x,z:r.z}:null;}
