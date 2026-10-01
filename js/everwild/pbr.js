import * as THREE from 'three';
// Photographic CC0 surfaces. Assets are hosted with the game, so playing requires no third-party asset API.
const loader=typeof document!=='undefined'&&typeof Image!=='undefined'?new THREE.TextureLoader():null,cache=new Map();
export function photoTexture(id,map='Diffuse',color=true){if(!loader)return null;const key=id+map;if(cache.has(key))return cache.get(key);const tex=loader.load('assets/everwild/pbr/'+id+'_'+map+'.jpg');tex.colorSpace=color?THREE.SRGBColorSpace:THREE.NoColorSpace;tex.wrapS=tex.wrapT=THREE.RepeatWrapping;tex.anisotropy=4;cache.set(key,tex);return tex;}
export function photographicMaterial(material,kind){const id=kind==='bark'?'bark_brown_02':kind==='stone'?'mossy_rock':null;if(!id)return material;const diffuse=photoTexture(id),normal=photoTexture(id,'nor_gl',false),rough=photoTexture(id,'Rough',false);if(diffuse){material.map=diffuse;material.bumpMap=null;material.normalMap=normal;material.normalScale=new THREE.Vector2(.65,.65);material.roughnessMap=rough;material.color.lerp(new THREE.Color(0xffffff),.65);}return material;}
export function terrainPBR(material,geo,regionAt){
 if(!loader)return;
 const ids=['forest_leaves_02','sandy_gravel_02','mossy_rock','snow_02'],maps=ids.map(id=>photoTexture(id)),normals=ids.map(id=>photoTexture(id,'nor_gl',false)),roughs=ids.map(id=>photoTexture(id,'Rough',false));
 const weights=[];for(let i=0;i<geo.attributes.position.count;i++){const x=geo.attributes.position.getX(i),z=geo.attributes.position.getZ(i),bio=regionAt(x,z).id;const type=['snow','island4'].includes(bio)?3:['mountain','volcanic','island1','island5'].includes(bio)?2:['steppe','desert','canyon','coast','ocean'].includes(bio)?1:0;weights.push(...[0,1,2,3].map(k=>k===type?1:0));}
 geo.setAttribute('biomeWeights',new THREE.Float32BufferAttribute(weights,4));material.map=maps[0];material.normalMap=normals[0];material.normalScale=new THREE.Vector2(.75,.75);material.bumpMap=null;material.roughnessMap=roughs[0];
 material.onBeforeCompile=shader=>{
  const names=['Forest','Sand','Rock','Snow'];for(let i=0;i<4;i++){shader.uniforms['ew'+names[i]]={value:maps[i]};}
  shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nattribute vec4 biomeWeights;varying vec4 ewBiome;varying vec3 ewWorld;').replace('#include <begin_vertex>','#include <begin_vertex>\newBiome=biomeWeights;ewWorld=(modelMatrix*vec4(position,1.)).xyz;');
  shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>\nvarying vec4 ewBiome;varying vec3 ewWorld;\n'+names.map(n=>'uniform sampler2D ew'+n+';').join('\n'));
  const blend=(prefix)=>names.map((n,i)=>'texture2D('+prefix+n+',ewUV)*ewW.'+'xyzw'[i]).join('+');
  shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>','vec2 ewUV=vec2(ewWorld.x,-ewWorld.z)*.28;vec4 ewW=ewBiome/max(dot(ewBiome,vec4(1.)),.001);vec4 ewSurface='+blend('ew')+';diffuseColor*=ewSurface;');

 };
 material.customProgramCacheKey=()=> 'everwild-photo-biomes-05';material.needsUpdate=true;
}
