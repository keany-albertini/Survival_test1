// Pure collision rules, shared by startup recovery and regular movement.
export function isClear(x,z,obstacles,limit=248,padding=.34){
 if(!Number.isFinite(x)||!Number.isFinite(z)||Math.abs(x)>limit||Math.abs(z)>limit)return false;
 return obstacles.every(o=>Math.hypot(x-o.x,z-o.z)>=o.radius+padding);
}
export function canStep(x,z,fromX,fromZ,obstacles,limit=248,padding=.34){
 if(!Number.isFinite(x)||!Number.isFinite(z)||Math.abs(x)>limit||Math.abs(z)>limit)return false;
 let oldPenetration=0,newPenetration=0;
 for(const o of obstacles){const radius=o.radius+padding,before=Math.max(0,radius-Math.hypot(fromX-o.x,fromZ-o.z)),after=Math.max(0,radius-Math.hypot(x-o.x,z-o.z));
  // A late-loading collider must never imprison an existing character.
  if(after>0&&before<=0)return false;oldPenetration+=before;newPenetration+=after;
 }
 return newPenetration<=0||(oldPenetration>0&&newPenetration<oldPenetration-1e-7);
}
export function nearestClear(x,z,obstacles,{limit=248,land=()=>true,maxRadius=24,padding=.50}={}){
 if(isClear(x,z,obstacles,limit,padding)&&land(x,z))return {x,z};
 for(let radius=.5;radius<=maxRadius;radius+=.5){const samples=Math.max(16,Math.ceil(radius*16));for(let i=0;i<samples;i++){const a=i/samples*Math.PI*2,nx=x+Math.cos(a)*radius,nz=z+Math.sin(a)*radius;if(isClear(nx,nz,obstacles,limit,padding)&&land(nx,nz))return {x:nx,z:nz};}}
 return null;
}
