(()=>{
  const id=sessionStorage.getItem('survival_character_id');
  if(!id||!window.sb)return;
  const force=new URLSearchParams(location.search).get('spawn')==='1';
  const marker='survival_spawn_selected_'+id;
  if(localStorage.getItem(marker)&&!force)return;

  const points=[
    {tier:'easy',title:'Plage calme',desc:'Peu de danger, eau et ressources proches.',x:-180,z:-260,ico:'🏖️'},
    {tier:'easy',title:'Prairie du sud',desc:'Terrain ouvert, bois et pierre accessibles.',x:120,z:-300,ico:'🌾'},
    {tier:'easy',title:'Rive tranquille',desc:'Départ proche de l’eau et des baies.',x:180,z:80,ico:'💧'},
    {tier:'medium',title:'Lisière tropicale',desc:'Ressources riches, animaux plus présents.',x:300,z:220,ico:'🌴'},
    {tier:'medium',title:'Savane rocheuse',desc:'Moins d’eau, davantage de pierre et métal.',x:330,z:-120,ico:'🪨'},
    {tier:'medium',title:'Collines de l’ouest',desc:'Relief marqué et faune plus dangereuse.',x:-280,z:220,ico:'⛰️'},
    {tier:'hard',title:'Grande montagne',desc:'Froid, fortes pentes et accès difficile.',x:-420,z:-100,ico:'🏔️'},
    {tier:'hard',title:'Terres enneigées',desc:'Peu de nourriture et environnement hostile.',x:-80,z:390,ico:'❄️'},
    {tier:'hard',title:'Terres du volcan',desc:'Zone extrême proche du volcan et des prédateurs.',x:390,z:-300,ico:'🌋'}
  ];

  const css=document.createElement('style');
  css.textContent=`
  .spawn-select{position:fixed;z-index:120;inset:0;background:radial-gradient(circle at 50% 20%,#1a3140f7,#03090dfd 65%);display:flex;align-items:center;justify-content:center;padding:16px;color:#fff;font-family:Arial,sans-serif;overflow:auto}
  .spawn-select-card{width:min(94vw,760px);max-height:94vh;overflow:auto;background:linear-gradient(180deg,#122029f7,#081116fa);border:1px solid #d3ad5b66;border-radius:18px;box-shadow:0 20px 70px #000c;padding:18px}
  .spawn-select h2{margin:0;text-align:center;font-family:Georgia,serif;color:#f0d28e;font-size:22px}.spawn-select .sub{text-align:center;color:#aebcc0;font-size:10px;margin:6px 0 15px}
  .spawn-tier{margin:13px 0 6px;font-size:9px;font-weight:900;letter-spacing:1.5px}.spawn-tier.easy{color:#8fd978}.spawn-tier.medium{color:#e3bc63}.spawn-tier.hard{color:#ef796d}
  .spawn-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}.spawn-point{border:1px solid #ffffff20;background:linear-gradient(145deg,#17262e,#0b151b);border-radius:12px;padding:11px;color:#fff;text-align:left;min-height:104px}.spawn-point:active{transform:scale(.98)}.spawn-point .ico{font-size:22px}.spawn-point strong{display:block;color:#f1d48d;margin:5px 0 3px;font-size:10px}.spawn-point small{display:block;color:#9eacb0;font-size:7px;line-height:1.35}.spawn-point .go{display:block;margin-top:8px;color:#dfe9dc;font-size:7px;font-weight:900}.spawn-wait{text-align:center;color:#f1d28d;font-size:10px;margin-top:10px;min-height:14px}
  @media(max-width:600px){.spawn-select-card{padding:13px}.spawn-grid{grid-template-columns:1fr}.spawn-point{min-height:72px;display:grid;grid-template-columns:36px 1fr;column-gap:7px}.spawn-point .ico{grid-row:1/4}.spawn-point strong{margin:0 0 3px}.spawn-point .go{margin-top:4px}}
  `;
  document.head.appendChild(css);

  const wrap=document.createElement('div');wrap.className='spawn-select';
  wrap.innerHTML='<div class="spawn-select-card"><h2>CHOISIS TON POINT DE DÉPART</h2><div class="sub">Le niveau choisi détermine la difficulté de tes premières minutes de survie.</div><div id="spawnChoices"></div><div id="spawnWait" class="spawn-wait"></div></div>';
  document.body.appendChild(wrap);
  const root=wrap.querySelector('#spawnChoices');
  const wait=wrap.querySelector('#spawnWait');
  const groups=[['easy','SPAWNS FACILES'],['medium','SPAWNS INTERMÉDIAIRES'],['hard','SPAWNS DIFFICILES']];
  for(const [tier,label] of groups){
    const h=document.createElement('div');h.className='spawn-tier '+tier;h.textContent=label;root.appendChild(h);
    const grid=document.createElement('div');grid.className='spawn-grid';root.appendChild(grid);
    points.filter(p=>p.tier===tier).forEach(p=>{const b=document.createElement('button');b.className='spawn-point';b.innerHTML=`<span class="ico">${p.ico}</span><strong>${p.title}</strong><small>${p.desc}</small><span class="go">CHOISIR CE SPAWN</span>`;b.onclick=()=>choose(p,b);grid.appendChild(b)});
  }

  async function choose(p,button){
    if(wrap.dataset.busy)return;wrap.dataset.busy='1';
    wrap.querySelectorAll('button').forEach(b=>b.disabled=true);button.style.borderColor=p.tier==='easy'?'#78ca68':p.tier==='medium'?'#dcb85e':'#e36b61';
    wait.textContent='Préparation de ton arrivée...';
    try{
      const {error}=await window.sb.from('characters').update({position_x:p.x,position_y:p.z,has_spawned:true,biome:p.title}).eq('id',id);
      if(error)throw error;
      localStorage.setItem(marker,JSON.stringify({tier:p.tier,title:p.title,x:p.x,z:p.z}));
      wait.textContent='Spawn sélectionné. Chargement...';
      const u=new URL(location.href);u.searchParams.delete('spawn');
      location.replace(u.toString());
    }catch(e){
      console.error('spawn select',e);wrap.dataset.busy='';wrap.querySelectorAll('button').forEach(b=>b.disabled=false);wait.textContent='Impossible d’enregistrer le spawn. Réessaie.';
    }
  }
})();