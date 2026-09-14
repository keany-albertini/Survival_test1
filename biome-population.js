import * as THREE from 'three';
const S={scene:null,camera:null,ready:false,objects:[]};
const old=THREE.WebGLRenderer.prototype.render;
THREE.WebGLRenderer.prototype.render=function(scene,camera){S.scene=scene;S.camera=camera;if(!S.ready&&scene.children.length>8){S.ready=true;setTimeout(init,900)}return old.call(this,scene,camera)};
const ground=(x,z)=>{const r=new THREE.Raycaster(new THREE.Vector3(x,250,z),new THREE.Vector3(0,-1,0),0,500),h=r.intersectObjects(S.scene.children,true).filter(v=>!v.object.userData.biomeExtra);return h[0]?.point.y??-5};
const mat=c=>new THREE.MeshStandardMaterial({color:c,roughness:.95});
function addTree(x,z,type){const y=ground(x,z);if(y<.5)return;const g=new THREE.Group();g.userData.biomeExtra=true;const tr=new THREE.Mesh(new THREE.CylinderGeometry(.35,.6,4.8,6),mat(0x5b3d24));tr.position.y=2.4;g.add(tr);const color=type==='snow'?0xdce8e8:type==='dry'?0x6e7438:0x356a36;for(let i=0;i<3;i++){const c=new THREE.Mesh(type==='pine'||type==='snow'?new THREE.ConeGeometry(2.3-i*.35,3.2,7):new THREE.IcosahedronGeometry(1.7,1),mat(color));c.position.set((type==='pine'||type==='snow')?0:(i-1)*1.1,5.0+i*1.4,0);g.add(c)}g.position.set(x,y,z);g.scale.setScalar(.7+Math.random()*.6);S.scene.add(g);S.objects.push(g)}
function addRock(x,z,dark=false){const y=ground(x,z);if(y<.5)return;const r=new THREE.Mesh(new THREE.DodecahedronGeometry(1.8,0),mat(dark?0x3c3a3a:0x707573));r.userData.biomeExtra=true;r.position.set(x,y+1,z);r.scale.setScalar(.55+Math.random()*.9);S.scene.add(r);S.objects.push(r)}
function addAnimal(x,z,name,color,size){const y=ground(x,z);if(y<.5)return;const g=new THREE.Group();g.userData.biomeExtra=true;g.userData.species=name;const b=new THREE.Mesh(new THREE.SphereGeometry(1,8,6),mat(color));b.scale.set(1.5,.75,.65);b.position.y=1.1;const h=new THREE.Mesh(new THREE.SphereGeometry(.5,8,6),mat(color));h.position.set(1.25,1.35,0);g.add(b,h);for(const xx of[-.6,.6])for(const zz of[-.35,.35]){const l=new THREE.Mesh(new THREE.CylinderGeometry(.08,.1,.9,5),mat(color));l.position.set(xx,.45,zz);g.add(l)}g.position.set(x,y,z);g.scale.setScalar(size);S.scene.add(g);S.objects.push(g)}
const cfg={
'Prairies':[32,18,'normal',[['Cerf',0x8a694b,1],['Lapin',0x8b8378,.45],['Sanglier',0x4c3c32,.8]]],
'Vallée fluviale':[38,15,'normal',[['Cerf',0x8a694b,1],['Sanglier',0x4c3c32,.8],['Loutre',0x594536,.5]]],
'Forêt tropicale':[54,14,'normal',[['Sanglier',0x4c3c32,.8],['Cerf',0x8a694b,1]]],
'Jungle':[64,12,'normal',[['Sanglier',0x4c3c32,.8],['Varan',0x526044,.55]]],
'Savane':[20,26,'dry',[['Gazelle',0xa98958,.75],['Lion',0xb58a4c,1.05]]],
'Désert':[6,30,'dry',[['Chacal',0x8b704d,.7],['Dromadaire',0xa77f52,1.15]]],
'Oasis':[28,10,'normal',[['Gazelle',0xa98958,.75],['Dromadaire',0xa77f52,1.1]]],
'Montagnes':[20,48,'pine',[['Bouquetin',0x746553,.8],['Loup',0x555b60,.8],['Ours',0x49362c,1.2]]],
'Toundra':[15,35,'pine',[['Loup',0x666d72,.8],['Renard',0xa9683c,.6]]],
'Neige':[20,40,'snow',[['Loup blanc',0xc7d0d2,.8],['Renard polaire',0xe4e8e7,.55],['Ours blanc',0xd9ddda,1.2]]],
'Plage':[14,16,'normal',[['Tortue',0x526b45,.55]]]
};
function current(){const t=(document.getElementById('topinfo')?.textContent||'').split('•').map(v=>v.trim());return t[1]||'Prairies'}
function clear(){for(const o of S.objects)S.scene.remove(o);S.objects.length=0}
function populate(){if(!S.camera)return;clear();const b=current(),c=cfg[b]||cfg.Prairies,[nt,nr,type,animals]=c,x0=S.camera.position.x,z0=S.camera.position.z;for(let i=0;i<nt;i++){const a=Math.random()*6.283,r=30+Math.random()*180;addTree(x0+Math.cos(a)*r,z0+Math.sin(a)*r,type)}for(let i=0;i<nr;i++){const a=Math.random()*6.283,r=25+Math.random()*190;addRock(x0+Math.cos(a)*r,z0+Math.sin(a)*r,b==='Montagnes'||b==='Neige')}for(let i=0;i<Math.min(14,animals.length*5);i++){const a=Math.random()*6.283,r=45+Math.random()*170,[n,col,s]=animals[i%animals.length];addAnimal(x0+Math.cos(a)*r,z0+Math.sin(a)*r,n,col,s)}}
function init(){let last='';setInterval(()=>{const b=current();if(b!==last){last=b;populate()}},1500)}
