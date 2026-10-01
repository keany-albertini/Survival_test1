import * as THREE from 'three';
import {RACES} from './rules.js?v=ew5';
import {validateAppearance} from './characters.js?v=ew5';
import {naturalMaterial} from './nature.js?v=ew5';
export function applyAppearance(player,profile){
 const race=RACES.find(r=>r.id===profile.race)||RACES[0],r=player.userData,a=validateAppearance(profile.appearance,race.id);player.name='EverwildSurvivor';
 const skin=new THREE.MeshStandardMaterial({color:a.skin,roughness:.73}),hair=naturalMaterial('fur',parseInt(a.hairColor.slice(1),16),.94),eyes=new THREE.MeshStandardMaterial({color:a.eyes,roughness:.24});
 player.traverse(o=>{if(!o.isMesh||!o.material?.color)return;const role=o.material.userData.role,hex=o.material.color.getHex();if(role==='skin'||hex===0xc99770||hex===0xc18e68)o.material=skin;else if(role==='hair'||role==='beard')o.material=hair;else if(role==='eye')o.material=eyes;else if(hex===0x64745a||hex===0x515247)o.material.color.setHex(race.cloth);});
 r.baseScale=(race.id==='dwarf'?.82:race.id==='elf'?1.08:race.id==='orc'?1.09:1)*a.stature;player.scale.setScalar(r.baseScale);
 if(race.id==='orc'){r.torso.scale.set(1.26,1,1.1);r.head.scale.x*=1.09;}
 if(race.id==='dwarf'){r.torso.scale.set(1.22,.96,1.13);r.head.scale.x*=1.1;r.legs.forEach(l=>l.scale.y=.87);}
 if(race.id==='elf'){r.torso.scale.x=.91;r.head.scale.x*=.95;}
 if(profile.body==='female'){r.torso.scale.x*=.93;r.arms.forEach((arm,i)=>arm.position.x=(i?1:-1)*.31);}
 const add=(geo,material,x,y,z,scale=[1,1,1])=>{const m=new THREE.Mesh(geo,material);m.position.set(x,y,z);m.scale.set(...scale);m.castShadow=true;r.head.add(m);return m;};
 if(r.defaultHair)r.defaultHair.visible=a.hair!=='shaved';if(r.defaultBeard)r.defaultBeard.visible=a.beard==='stubble';
 const strand=(x,y,z,length,width=.065)=>add(new THREE.CapsuleGeometry(width,length,4,10),hair,x,y,z,[1,1,.75]);
 if(a.hair==='long'){for(let i=0;i<7;i++)strand((i-3)*.052,.02,-.17,.35);}
 if(a.hair==='ponytail'){strand(0,.06,-.25,.4,.075).rotation.x=-.2;add(new THREE.TorusGeometry(.055,.014,4,10),naturalMaterial('cloth',0xc09d59),0,.20,-.23).rotation.x=Math.PI/2;}
 if(a.hair==='braids'){for(const side of [-1,1])for(let i=0;i<7;i++)add(new THREE.SphereGeometry(.035,8,6),hair,side*(.17+Math.sin(i*2)*.01),.14-i*.041,-.04,[1,1.15,1]);}
 if(a.hair==='mohawk'){if(r.defaultHair)r.defaultHair.visible=false;for(let i=0;i<6;i++)add(new THREE.ConeGeometry(.055,.15,8),hair,0,.4,-.10+i*.035).rotation.x=.1;}
 if(a.beard==='full'||a.beard==='braided'){const b=add(new THREE.SphereGeometry(.13,16,10),hair,0,-.065,.10,[.92,1.3,.70]);if(a.beard==='braided')for(const side of [-1,1])for(let i=0;i<4;i++)add(new THREE.SphereGeometry(.035,8,6),hair,side*.06,-.15-i*.035,.09,[.8,1.1,.8]);}
 if(race.id==='elf')for(const side of [-1,1]){const e=add(new THREE.ConeGeometry(.055,.23,9),skin,side*.20,.20,0);e.rotation.z=-side*1.04;}
 if(race.id==='orc')for(const side of [-1,1]){const tusk=add(new THREE.ConeGeometry(.025,.10,9),new THREE.MeshStandardMaterial({color:0xded5b9}),side*.087,.075,.19);tusk.rotation.x=.2;}
 if(race.id==='draconian'){for(const side of [-1,1]){const horn=add(new THREE.ConeGeometry(.061,.29,12),naturalMaterial('bark',0x69543b),side*.13,.43,-.045);horn.rotation.z=-side*.35;horn.rotation.x=-.2;}for(let i=0;i<6;i++)add(new THREE.SphereGeometry(.04,8,6),naturalMaterial('cap',parseInt(a.skin.slice(1),16)),(i%2?1:-1)*.12,.09+Math.floor(i/2)*.08,.135,[1,.65,.18]);}
 if(race.id==='trees'){for(const side of [-1,1]){const twig=add(new THREE.CylinderGeometry(.009,.02,.27,6),naturalMaterial('bark',0x6d684b),side*.15,.4,-.06);twig.rotation.z=-side*.6;add(new THREE.SphereGeometry(.05,8,6),naturalMaterial('cap',0x8b9b66),side*.22,.5,-.06,[1,.35,1]);}}
 if(race.id==='desert'){const wrap=add(new THREE.TorusGeometry(.18,.052,7,24),naturalMaterial('cloth',0xb9a584),0,.31,-.025,[1,.8,.85]);wrap.rotation.x=Math.PI/2;}
 if(race.id==='snow'){const collar=new THREE.Mesh(new THREE.TorusGeometry(.16,.05,8,20),naturalMaterial('fur',0xb9c5c8));collar.rotation.x=Math.PI/2;collar.position.y=.67;r.torso.add(collar);}
 if(a.marks==='freckles')for(let i=0;i<12;i++)add(new THREE.SphereGeometry(.006,5,4),naturalMaterial('cap',0x775947),(i%2?1:-1)*(.08+(i%3)*.015),.12+Math.floor(i/6)*.016,.16,[1,1,.2]);
 if(a.marks==='scar'){const mark=add(new THREE.BoxGeometry(.011,.095,.003),naturalMaterial('cap',0xa27364),.096,.19,.174);mark.rotation.z=.28;}
 r.appearance=a;r.race=race.id;
}
