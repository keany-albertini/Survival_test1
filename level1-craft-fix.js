(()=>{
  const cid=()=>sessionStorage.getItem('survival_character_id')||'guest';
  const ikey=()=>`survival_inventory_${cid()}`;
  const pkey=()=>`survival_progression_${cid()}`;
  const readInv=()=>{try{return JSON.parse(localStorage.getItem(ikey())||'{}')}catch{return{}}};
  const saveInv=v=>{localStorage.setItem(ikey(),JSON.stringify(v));window.refreshCraftInventory?.();window.refreshInventoryManagement?.();window.refreshInventoryVisibility?.();window.refreshInventoryQuantityBadges?.()};
  const level=()=>{try{return JSON.parse(localStorage.getItem(pkey())||'{}').level||1}catch{return 1}};
  const toast=t=>{const e=document.getElementById('toast');if(!e)return;e.textContent=t;e.classList.add('show');clearTimeout(window.__l1Toast);window.__l1Toast=setTimeout(()=>e.classList.remove('show'),1500)};

  const REC={
    campfire:{name:'Feu de camp',icon:'🔥',level:1,cost:{branches:5,fiber:3}},
    axe:{name:'Hache primitive',icon:'🪓',level:2,cost:{wood:3,stone:2}},
    pickaxe:{name:'Pioche primitive',icon:'⛏️',level:2,cost:{wood:2,stone:3}},
    shovel:{name:'Pelle primitive',icon:'🛠️',level:3,cost:{wood:3,stone:1}},
    sleeping_bag:{name:'Sac de couchage',icon:'🛌',level:3,cost:{branches:8,fiber:10}},
    simple_bed:{name:'Lit de fortune',icon:'🛏️',level:4,cost:{wood:8,branches:6,fiber:8}},
    workbench:{name:'Établi primitif',icon:'🛠️',level:9,cost:{wood:20,stone:8}},
    forge:{name:'Forge',icon:'🔥',level:35,cost:{stone:25,wood:8,metal:6}}
  };
  const labels={branches:'branches',fiber:'fibres',wood:'bois',stone:'pierres',metal:'métal'};

  function craftOne(k){
    const r=REC[k],lv=level(),v=readInv();
    if(lv<r.level)return toast(`Niveau ${r.level} requis`);
    if(Object.entries(r.cost).some(([a,n])=>(v[a]||0)<n))return toast('Ressources insuffisantes');
    for(const[a,n]of Object.entries(r.cost))v[a]=(v[a]||0)-n;
    v[k]=(v[k]||0)+1;
    saveInv(v);
    window.addSurvivalXP?.(12,'Craft');
    toast(r.name+' fabriqué');
    render();
  }

  function ensureBagRows(){
    const bag=document.querySelector('#inventoryPanel .bag-view');if(!bag)return;
    const v=readInv();
    for(const [k,r] of Object.entries(REC)){
      let row=bag.querySelector(`[data-item="${k}"]`);
      if(!row){row=document.createElement('div');row.className='inv-row';row.dataset.item=k;row.innerHTML=`<span>${r.icon} ${r.name}</span><b>0</b>`;bag.appendChild(row)}
      row.querySelector('b').textContent=v[k]||0;
      row.hidden=!(v[k]>0);
    }
    for(const [k,name,icon] of [['branches','Branches','🌿'],['fiber','Fibres / paille','🌾']]){
      let row=bag.querySelector(`[data-item="${k}"]`);
      if(!row){row=document.createElement('div');row.className='inv-row';row.dataset.item=k;row.innerHTML=`<span>${icon} ${name}</span><b>0</b>`;bag.appendChild(row)}
      row.querySelector('b').textContent=v[k]||0;row.hidden=!(v[k]>0)
    }
  }

  function render(){
    const panel=document.getElementById('inventoryPanel'),craft=panel?.querySelector('.craft-view');
    if(!craft)return false;
    const lv=level(),v=readInv();
    craft.innerHTML='';
    const title=document.createElement('div');title.style='color:#f0d28e;font-weight:900;margin:6px 0 10px';title.textContent='CRAFT DISPONIBLE';craft.appendChild(title);
    for(const[k,r]of Object.entries(REC)){
      if(lv<r.level)continue;
      const card=document.createElement('div');card.className='craft-card';card.dataset.recipe=k;
      card.innerHTML=`<div class="craft-title"><span>${r.icon} ${r.name}</span><button class="craft-btn">FABRIQUER</button></div><div class="craft-cost">Coût : ${Object.entries(r.cost).map(([a,n])=>`${n} ${labels[a]||a}`).join(' + ')}</div>`;
      const b=card.querySelector('button');b.disabled=Object.entries(r.cost).some(([a,n])=>(v[a]||0)<n);b.onclick=e=>{e.preventDefault();e.stopPropagation();craftOne(k)};craft.appendChild(card)
    }
    ensureBagRows();
    return true;
  }

  function wire(){
    const panel=document.getElementById('inventoryPanel');if(!panel)return false;
    const bag=panel.querySelector('.bag-view'),craft=panel.querySelector('.craft-view');if(!bag||!craft)return false;
    panel.querySelectorAll('.inv-tab').forEach(tab=>{
      if(tab.dataset.integratedCraft==='1')return;tab.dataset.integratedCraft='1';
      tab.addEventListener('click',()=>{
        const isCraft=tab.dataset.tab==='craft';
        panel.querySelectorAll('.inv-tab').forEach(t=>t.classList.toggle('active',t===tab));
        bag.classList.toggle('hidden',isCraft);craft.classList.toggle('active',isCraft);
        if(isCraft)render();
      },true)
    });
    return true;
  }

  function boostXP(){const f=window.addSurvivalXP;if(!f||f.__x15)return;const g=(a,r)=>f(Math.ceil((Number(a)||0)*1.5),r);g.__x15=true;window.addSurvivalXP=g}

  let tries=0;(function init(){if(!wire()||!render()){if(tries++<120)setTimeout(init,100);return}document.getElementById('inventoryBtn')?.addEventListener('click',()=>setTimeout(()=>{wire();render();ensureBagRows()},80));window.addEventListener('survival-level-up',()=>setTimeout(render,50));setInterval(()=>{wire();boostXP();ensureBagRows()},500)})();
})();