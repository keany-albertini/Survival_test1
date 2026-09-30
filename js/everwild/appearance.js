import * as THREE from "three";
import { RACES } from "./rules.js?v=ew1";
export function applyAppearance(player,profile){
  const race=RACES.find(r=>r.id===profile.race)||RACES[0],r=player.userData;
  player.name="EverwildSurvivor";
  player.traverse(o=>{if(!o.isMesh||!o.material?.color)return;
    const hex=o.material.color.getHex();
    if(hex===0xc99770||hex===0xc18e68)o.material.color.setHex(race.skin);
    if(hex===0x64745a||hex===0x515247)o.material.color.setHex(race.cloth);
  });
  r.baseScale=race.id==="dwarf"?.83:race.id==="elf"?1.04:1;
  player.scale.setScalar(r.baseScale);
  if(race.id==="orc"){r.torso.scale.x=1.13;r.head.scale.x*=1.05;}
  if(race.id==="dwarf"){r.torso.scale.x=1.14;r.head.scale.x*=1.12;}
  if(profile.body==="female"){r.torso.scale.x*=.93;r.arms.forEach((arm,i)=>arm.position.x=(i?1:-1)*.31);}
  if(race.id==="elf")for(const side of [-1,1]){
    const ear=new THREE.Mesh(new THREE.ConeGeometry(.048,.19,7),new THREE.MeshStandardMaterial({color:race.skin,roughness:.8}));
    ear.rotation.z=-side*.9;ear.position.set(side*.20,.20,0);r.head.add(ear);ear.castShadow=true;
  }
  if(race.id==="draconian")for(const side of [-1,1]){
    const horn=new THREE.Mesh(new THREE.ConeGeometry(.05,.22,9),new THREE.MeshStandardMaterial({color:0x523d2e,roughness:.85}));
    horn.position.set(side*.13,.38,-.045);horn.rotation.z=-side*.35;r.head.add(horn);horn.castShadow=true;
  }
  if(profile.body==="female"||race.id==="snow"){
    const hair=new THREE.Mesh(new THREE.CapsuleGeometry(.13,.16,4,12),new THREE.MeshStandardMaterial({color:race.id==="snow"?0xd9dedb:0x47392b,roughness:.9}));
    hair.position.set(0,.13,-.13);hair.scale.z=.45;r.head.add(hair);hair.castShadow=true;
  }
}
