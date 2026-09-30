import * as THREE from "three";

const random = n => { const v=Math.sin(n*127.1+311.7)*43758.5453; return v-Math.floor(v); };

// A meadow costs two draw calls regardless of the number of flowers.
export function createAmbience(scene, world, height, riverX) {
  const group=new THREE.Group(); group.name="LivingMeadow"; scene.add(group);
  const canvas=document.createElement("canvas"); canvas.width=canvas.height=128;
  const ctx=canvas.getContext("2d");
  ctx.strokeStyle="#789147"; ctx.lineWidth=5;
  ctx.beginPath(); ctx.moveTo(64,128); ctx.quadraticCurveTo(55,80,64,38); ctx.stroke();
  ctx.fillStyle="#65823d";
  ctx.beginPath(); ctx.ellipse(47,87,19,7,-.55,0,Math.PI*2); ctx.fill();
  ctx.fillStyle="#fff3cf";
  for(let i=0;i<6;i++) {const a=i*Math.PI/3; ctx.beginPath();ctx.ellipse(64+Math.cos(a)*16,34+Math.sin(a)*16,14,7,a,0,Math.PI*2);ctx.fill();}
  ctx.fillStyle="#e1ae42";ctx.beginPath();ctx.arc(64,34,8,0,Math.PI*2);ctx.fill();
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
  const mat=new THREE.MeshStandardMaterial({map:texture,alphaTest:.45,side:THREE.DoubleSide,roughness:1});
  mat.onBeforeCompile=shader=>{
    shader.uniforms.meadowTime={value:0};mat.userData.shader=shader;
    shader.vertexShader=shader.vertexShader.replace("#include <common>","#include <common>\nuniform float meadowTime;")
      .replace("#include <begin_vertex>","#include <begin_vertex>\n#ifdef USE_INSTANCING\ntransformed.x += sin(meadowTime*1.3+instanceMatrix[3].x*.5+instanceMatrix[3].z*.3)*.08*max(position.y,0.0);\n#endif");
  };
  const geo=new THREE.PlaneGeometry(.42,.65);geo.translate(0,.325,0);
  const count=650,flowers=new THREE.InstancedMesh(geo,mat,count),cross=new THREE.InstancedMesh(geo,mat,count);
  const dummy=new THREE.Object3D(),color=new THREE.Color();let n=0;
  for(let i=0;i<2200&&n<count;i++) {
    const x=random(i*3+1)*104-52,z=random(i*3+2)*104-52;
    if(Math.abs(x-riverX(z))<6||Math.hypot(x+8,z-8)<5||Math.hypot(x+34,z+25)<8)continue;
    // Patches, with open ground between them rather than a uniform carpet.
    if(Math.sin(x*.27)+Math.cos(z*.31)<.3)continue;
    const scale=.55+random(i*3+3)*.7;
    dummy.position.set(x,height(x,z)+.03,z);dummy.scale.setScalar(scale);
    dummy.rotation.set(0,random(i+6000)*Math.PI,0);dummy.updateMatrix();flowers.setMatrixAt(n,dummy.matrix);
    dummy.rotation.y+=Math.PI/2;dummy.updateMatrix();cross.setMatrixAt(n,dummy.matrix);
    color.set(n%5===0?0xb5a0de:0xffffff);flowers.setColorAt(n,color);cross.setColorAt(n,color);n++;
  }
  for(const mesh of [flowers,cross]) {mesh.count=n;mesh.receiveShadow=true;mesh.instanceMatrix.needsUpdate=true;group.add(mesh);}

  const positions=new Float32Array(64*3),base=new Float32Array(64*3);
  for(let i=0;i<64;i++){base[i*3]=random(i+8100)*50-25;base[i*3+2]=random(i+9100)*50-20;base[i*3+1]=height(base[i*3],base[i*3+2])+.7+random(i+10100)*2;}
  positions.set(base);
  const pointsGeo=new THREE.BufferGeometry();pointsGeo.setAttribute("position",new THREE.BufferAttribute(positions,3));
  const glowCanvas=document.createElement("canvas");glowCanvas.width=glowCanvas.height=32;
  const gctx=glowCanvas.getContext("2d"),gradient=gctx.createRadialGradient(16,16,0,16,16,16);
  gradient.addColorStop(0,"rgba(255,245,164,1)");gradient.addColorStop(.25,"rgba(214,238,117,.7)");gradient.addColorStop(1,"rgba(214,238,117,0)");gctx.fillStyle=gradient;gctx.fillRect(0,0,32,32);
  const glow=new THREE.CanvasTexture(glowCanvas);
  const sparks=new THREE.Points(pointsGeo,new THREE.PointsMaterial({map:glow,color:0xe5f6ab,size:.17,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending}));
  group.add(sparks);

  // Preserve Three's lighting and add flowing highlights in world coordinates.
  if(world.water){
    const water=world.water.material;water.color.set(0x387f83);water.roughness=.26;
    water.onBeforeCompile=shader=>{
      shader.uniforms.riverTime={value:0};water.userData.flowShader=shader;
      shader.vertexShader=shader.vertexShader.replace("#include <common>","#include <common>\nvarying vec3 riverPosition;").replace("#include <begin_vertex>","#include <begin_vertex>\nriverPosition=(modelMatrix*vec4(position,1.0)).xyz;");
      shader.fragmentShader=shader.fragmentShader.replace("#include <common>","#include <common>\nuniform float riverTime;\nvarying vec3 riverPosition;")
        .replace("#include <color_fragment>","#include <color_fragment>\nfloat ripples=sin(riverPosition.z*4.8-riverTime*2.7+sin(riverPosition.x*3.4+riverTime*.7));\nfloat shimmer=pow(max(ripples,0.0),14.0);\ndiffuseColor.rgb=mix(diffuseColor.rgb,vec3(.57,.78,.75),shimmer*.28);");
    };water.needsUpdate=true;
  }
  return {
    update(time,dayProgress,season){
      if(mat.userData.shader)mat.userData.shader.uniforms.meadowTime.value=time;
      if(world.water?.material.userData.flowShader)world.water.material.userData.flowShader.uniforms.riverTime.value=time;
      flowers.visible=cross.visible=season!==3;
      const night=Math.max(0,1-Math.sin(dayProgress*Math.PI*2-Math.PI/2)*2);
      sparks.visible=night>.1&&season!==3;sparks.material.opacity=Math.min(.8,night*.65);
      for(let i=0;i<64;i++){positions[i*3]=base[i*3]+Math.sin(time*.4+i)*.6;positions[i*3+1]=base[i*3+1]+Math.sin(time*.7+i*2)*.25;positions[i*3+2]=base[i*3+2]+Math.cos(time*.35+i)*.5;}
      pointsGeo.attributes.position.needsUpdate=true;
    }
  };
}
