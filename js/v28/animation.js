const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const smooth=t=>t*t*(3-2*t);
const damp=(a,b,rate,dt)=>a+(b-a)*(1-Math.exp(-rate*dt));
const axes=["lx","rx","lz","rz","le","re","tx","ty","tz","hx","hy","lk","rk","ll","rl","toolx","toolz"];
const zero=()=>Object.fromEntries(axes.map(k=>[k,0]));

// Keyframes include anticipation, a continuous strike through impact, and recovery.
// The same impact marker drives the animation and the gameplay event.
export function actionPose(kind,t,impact=.6){
  let anticipation={},contact={},follow={};
  if(kind==="chop"){
    anticipation={rx:-1.9,lx:-1.30,re:-.8,le:-.75,rz:-.2,tx:-.12,ty:-.40,hx:.10,toolx:-.12};
    contact={rx:-.78,lx:-.75,re:-.20,le:-.35,tx:.16,ty:.18,hx:-.12,lk:.15,rk:.24};
    follow={rx:.30,lx:-.15,re:-.35,le:-.5,tx:.23,ty:.36,hx:-.18,lk:.18,rk:.30};
  }else if(kind==="mine"){
    anticipation={rx:-2.25,lx:-1.9,re:-.65,le:-.75,tx:-.10,hx:.18,toolx:-.12};
    contact={rx:-.7,lx:-.6,re:-.25,le:-.4,tx:.32,hx:-.25,lk:.28,rk:.28};
    follow={rx:.22,lx:.04,re:-.4,le:-.6,tx:.42,hx:-.20,lk:.32,rk:.32};
  }else if(kind==="attack"){
    anticipation={rx:-.62,rz:-1.0,re:-.95,lx:-.25,le:-1.0,ty:-.55,tx:-.05,lk:.12,rk:.25};
    contact={rx:-.35,rz:.25,re:-.22,lx:-.3,le:-.8,ty:.25,tx:.10,lk:.2,rk:.12};
    follow={rx:.25,rz:.82,re:-.5,lx:-.15,le:-.65,ty:.6,tx:.13,lk:.22,rk:.12};
  }else if(kind==="eat"||kind==="drink"){
    anticipation={rx:-.60,re:-1.8,hx:.05,rz:-.15};
    contact={rx:-.7,re:-2.0,hx:kind==="drink"?-.16:.08,rz:-.10};follow={...contact};
  }else if(kind==="build"){
    anticipation={rx:-1.35,re:-.9,tx:.04};contact={rx:-.45,re:-.4,tx:.18};follow={rx:.12,re:-.55,tx:.22};
  }else{
    anticipation={rx:-.60,lx:-.40,re:-.6,le:-.5,tx:.15,hx:.12,lk:.25,rk:.25};
    contact={rx:-1.0,lx:-.55,re:-.45,le:-.7,tx:.36,hx:.15,lk:.42,rk:.42};
    follow={rx:-.75,lx:-.4,re:-.8,le:-.7,tx:.28,lk:.35,rk:.35};
  }
  const frames=[[0,{}],[impact*.65,anticipation],[impact,contact],[Math.min(.86,impact+.14),follow],[1,{}]];
  t=clamp(t,0,1);let a=frames[0],b=frames[1];
  for(let i=1;i<frames.length;i++){a=frames[i-1];b=frames[i];if(t<=b[0])break;}
  const u=smooth(clamp((t-a[0])/Math.max(.001,b[0]-a[0]),0,1)),pose=zero();
  for(const k of axes)pose[k]=(a[1][k]||0)*(1-u)+(b[1][k]||0)*u;
  return pose;
}

export function updateCharacter(player,dt,options){
  const r=player.userData, {time,speed,sprinting,mounted,action,ground,height,x,z,yaw}=options;
  r.toolRoot.visible=!mounted&&!(action?.active&&["eat","drink","gather","interact"].includes(action.kind));
  if(r.foodProp)r.foodProp.visible=Boolean(action?.active&&action.kind==="eat");
  if(r.flask)r.flask.visible=Boolean(action?.active&&action.kind==="drink");
  r.gaitWeight=damp(r.gaitWeight||0,clamp(speed/3.5,0,1),9,dt);
  const w=r.gaitWeight,run=sprinting?1:0;
  // Cadence follows distance covered, keeping footsteps tied to movement.
  r.walkPhase=(r.walkPhase||0)+dt*speed*(run?2.65:3.55);
  const p=r.walkPhase,pose=zero(),breath=Math.sin(time*2.2)*.008;
  pose.ll=Math.sin(p)*(run?.78:.48)*w;pose.rl=-pose.ll;
  pose.lk=(.06+Math.max(0,-Math.sin(p))*(run?1.05:.64))*w;
  pose.rk=(.06+Math.max(0,Math.sin(p))*(run?1.05:.64))*w;
  pose.lx=-pose.ll*.65;pose.rx=-pose.rl*.56;
  pose.le=-.17-run*.65*w;pose.re=-.22-run*.6*w;
  pose.lz=.05;pose.rz=-.05;
  pose.tx=-.045*w-run*.08*w+breath;
  pose.ty=Math.sin(p)*.035*w;pose.tz=Math.cos(p)*.02*w;
  pose.hy=-Math.sin(p)*.045*w;pose.hx=-pose.tx*.45;
  const turning=clamp((yaw-(r.lastYaw??yaw))/Math.max(dt,.001),-3,3);
  r.lastYaw=yaw;pose.tz-=turning*.028*w;
  if(mounted){
    pose.ll=pose.rl=-.85;pose.lk=pose.rk=1.35;pose.lz=.28;pose.rz=-.28;
    pose.lx=pose.rx=-.60;pose.le=pose.re=-.85;pose.tx=.06;
  }
  if(action?.active){
    const ap=actionPose(action.kind,action.time/action.duration,action.impactAt/action.duration);
    // Gentle entry blend, then full-body action; no frame snaps at impact.
    const weight=smooth(clamp(action.time/.09,0,1));
    for(const k of axes)pose[k]=pose[k]*(1-weight)+ap[k]*weight;
    pose.le-=.08;pose.re-=.08;
  }
  r.hurt=Math.max(0,(r.hurt||0)-dt*3.5);
  pose.tx-=Math.sin(r.hurt*Math.PI)*.18;pose.hx+=Math.sin(r.hurt*Math.PI)*.14;
  const apply=(object,axis,target,rate=18)=>{if(object)object.rotation[axis]=damp(object.rotation[axis],target,rate,dt);};
  apply(r.legs[0],"x",pose.ll);apply(r.legs[1],"x",pose.rl);
  for(let i=0;i<2;i++){
    apply(r.legs[i],"z",mounted?(i?-.23:.23):0);
    apply(r.knees[i],"x",i?pose.rk:pose.lk);
    apply(r.ankles[i],"x",-(i?pose.rk:pose.lk)*.45-(i?pose.rl:pose.ll)*.25);
    apply(r.arms[i],"x",i?pose.rx:pose.lx);apply(r.arms[i],"z",i?pose.rz:pose.lz);
    apply(r.elbows[i],"x",i?pose.re:pose.le);
    // Small ankle adjustment when standing on uneven ground.
    const side=i?.16:-.16,fx=x+Math.cos(yaw)*side,fz=z-Math.sin(yaw)*side;
    r.legs[i].position.y=damp(r.legs[i].position.y,mounted?0:clamp(height(fx,fz)-ground,-.08,.08),12,dt);
  }
  apply(r.torso,"x",pose.tx);apply(r.torso,"y",pose.ty);apply(r.torso,"z",pose.tz);
  apply(r.head,"x",pose.hx);apply(r.head,"y",pose.hy);
  apply(r.hips,"y",-pose.ty*.55);apply(r.hips,"z",-pose.tz*.3);
  apply(r.toolRoot,"x",pose.toolx);apply(r.toolRoot,"z",pose.toolz);
  const bob=Math.cos(p*2)*.018*w;
  r.hips.position.y=damp(r.hips.position.y,.77+bob,15,dt);
  r.torso.position.y=damp(r.torso.position.y,.80+bob+breath,15,dt);
  if(r.pack)apply(r.pack,"x",.05+Math.sin(p+.35)*.035*w,8);
}
