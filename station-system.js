import * as THREE from 'three';
const id=sessionStorage.getItem('survival_character_id')||'guest',ik='survival_inventory_'+id,sk='survival_stations_'+id;
const read=()=>{try{return JSON.parse(localStorage.getItem(ik)||'{}')}catch{return{}}};
const save=v=>localStorage.setItem(ik,JSON.stringify(v));
let scene,camera,ready=false;const old=THREE.WebGLRenderer.prototype.render;
THREE.WebGLRenderer.prototype.render=function(s,c){scene=s;camera=c;if(!ready&&s.children.length>6){ready=true;setTimeout(init,500)}return old.call(this,s,c)};
function ground(x,z){const r=new THREE.Raycaster(new THREE.Vector3(x,300,z),new THREE.Vector3(0,-1,0),0,500),h=r.intersectObjects(scene.children,true);return h[0]?.point.y??1}
function model(type){const m=new THREE.Mesh(type==='forge'?new THREE.CylinderGeometry(2.5,2.8,2.2,10):new THREE.BoxGeometry(5,.5,2.4),new THREE.MeshStandardMaterial({color:type==='forge'?0x55504b:0x654426,roughness:1}));m.userData.station=true;return m}
function place(type){const v=read();if(!(v[type]>0))return;const d=new THREE.Vector3();camera.getWorldDirection(d);d.y=0;d.normalize();const p=camera.position.clone().add(d.multiplyScalar(7)),m=model(type);m.position.set(p.x,ground(p.x,p.z)+(type==='forge'?1.1:2.2),p.z);scene.add(m);v[type]--;save(v);const a=JSON.parse(localStorage.getItem(sk)||'[]');a.push({type,x:p.x,z:p.z});localStorage.setItem(sk,JSON.stringify(a))}
function init(){const b=document.createElement('button');b.textContent='🏗️ POSER STATION';b.style='position:fixed;z-index:36;left:10px;top:240px';b.onclick=()=>{const v=read();if(v.workbench>0)place('workbench');else if(v.forge>0)place('forge')};document.body.appendChild(b)}
