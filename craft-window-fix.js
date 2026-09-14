(()=>{
  const cid=()=>sessionStorage.getItem('survival_character_id')||'guest';
  const ikey=()=>`survival_inventory_${cid()}`;
  const pkey=()=>`survival_progression_${cid()}`;
  const readInv=()=>{try{return JSON.parse(localStorage.getItem(ikey())||'{}')}catch{return{}}};
  const saveInv=v=>{localStorage.setItem(ikey(),JSON.stringify(v));window.refreshCraftInventory?.();window.refreshInventoryManagement?.();window.refreshInventoryQuantityBadges?.();window.refreshInventoryVisibility?.()};
  const level=()=>{try{return JSON.parse(localStorage.getItem(pkey())||'{}').level||1}catch{return 1}};
  const toast=t=>{const e=document.getElementById('toast');if(!e)return;e.textContent=t;e.classList.add('show');clearTimeout(window.__craftFixToast);window.__craftFixToast=setTimeout(()=>e.classList.remove('show'),1500)};
  const RECIPES={
    campfire:{name:'Feu de camp',icon:'🔥',level:1,cost:{branches:6,fiber:4}},
    axe:{name:'Hache primitive',icon:'🪓',level:2,cost:{wood:3,stone:2}},
    pickaxe:{name:'Pioche primitive',icon:'⛏️',level:2,cost:{wood:2,stone:3}},
    shovel:{name:'Pelle primitive',icon:'🛠️',level:3,cost:{wood:3,stone:1}},
    sleeping_bag:{name:'Sac de couchage',icon:'🛌',level:3,cost:{branches:8,fiber:10}},
    simple_bed:{name:'Lit de fortune',icon:'🛏️',level:4,cost:{wood:8,branches:6,fiber:8}},
    workbench:{name:'Établi primitif',icon:'🛠️',level:9,cost:{wood:20,stone:8}},
    forge:{name:'Forge',icon:'🔥',level:35,cost:{stone:25,wood:8,metal:6}}
  };
  window.survivalCoreCraftRecipes=RECIPES;
  const labels={branches:'branches',fiber:'fibres',wood:'bois',stone:'pierres',metal:'métal'};

  function craftOne(key){
    const r=RECIPES[key],lv=level(),v=readInv();
    if(!r)return;
    if(lv<r.level)return toast(`Niveau ${r.level} requis`);
    if(Object.entries(r.cost).some(([k,n])=>(v[k]||0)<n))return toast('Ressources insuffisantes');
    for(const[k,n]of Object.entries(r.cost))v[k]=(v[k]||0)-n;
    v[key]=(v[key]||0)+1;
    saveInv(v);
    window.addSurvivalXP?.(12,'Craft');
    toast(`${r.name} fabriqué`);
    render();
  }

  function render(){
    const panel=document.getElementById('inventoryPanel');
    const craft=panel?.querySelector('.craft-view');
    if(!craft)return false;
    const lv=level(),v=readInv();
    craft.innerHTML='';
    craft.style.display=craft.classList.contains('active')?'block':'';
    for(const [key,r] of Object.entries(RECIPES)){
      if(lv<r.level)continue;
      const card=document.createElement('div');
      card.className='craft-card';
      card.dataset.recipe=key;
      const ok=Object.entries(r.cost).every(([k,n])=>(v[k]||0)>=n);
      card.innerHTML=`<div class="craft-title"><span>${r.icon} ${r.name}</span><button class="craft-btn">FABRIQUER</button></div><div class="craft-cost">Coût : ${Object.entries(r.cost).map(([k,n])=>`${n} ${labels[k]||k}`).join(' + ')}</div>`;
      const b=card.querySelector('button');
      b.disabled=!ok;
      b.onclick=e=>{e.preventDefault();e.stopPropagation();craftOne(key)};
      craft.appendChild(card);
    }
    if(!craft.children.length){craft.innerHTML='<div class="craft-card"><div class="craft-title"><span>Aucun craft débloqué</span></div></div>'}
    return true;
  }

  function wireTabs(){
    const panel=document.getElementById('inventoryPanel');if(!panel)return;
    const bag=panel.querySelector('.bag-view'),craft=panel.querySelector('.craft-view');
    panel.querySelectorAll('.inv-tab').forEach(tab=>{
      if(tab.dataset.craftFix==='1')return;tab.dataset.craftFix='1';
      tab.addEventListener('click',()=>{
        const isCraft=tab.dataset.tab==='craft';
        panel.querySelectorAll('.inv-tab').forEach(t=>t.classList.toggle('active',t===tab));
        bag?.classList.toggle('hidden',isCraft);
        craft?.classList.toggle('active',isCraft);
        if(isCraft)render();
      },true)
    })
  }

  let tries=0;
  function init(){
    const panel=document.getElementById('inventoryPanel'),craft=panel?.querySelector('.craft-view');
    if(!panel||!craft){if(tries++<120)setTimeout(init,100);return}
    wireTabs();render();
    document.getElementById('inventoryBtn')?.addEventListener('click',()=>setTimeout(()=>{wireTabs();render()},80));
    window.addEventListener('survival-level-up',()=>setTimeout(render,50));
    setInterval(()=>{wireTabs();if(craft.classList.contains('active'))render()},1200);
  }
  init();
})();
