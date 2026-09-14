(()=>{
  const cid=()=>sessionStorage.getItem('survival_character_id')||'guest';
  const ikey=()=>`survival_inventory_${cid()}`;
  const pkey=()=>`survival_progression_${cid()}`;
  const ekey=()=>`survival_equipped_${cid()}`;
  const readInv=()=>{try{return JSON.parse(localStorage.getItem(ikey())||'{}')}catch{return{}}};
  const saveInv=v=>{localStorage.setItem(ikey(),JSON.stringify(v));window.refreshInventoryVisibility?.();window.refreshInventoryManagement?.();window.refreshRecoveredInventory?.()};
  const level=()=>{try{return JSON.parse(localStorage.getItem(pkey())||'{}').level||1}catch{return 1}};
  const toast=t=>{const e=document.getElementById('toast');if(!e)return;e.textContent=t;e.classList.add('show');clearTimeout(window.__resourceRuleToast);window.__resourceRuleToast=setTimeout(()=>e.classList.remove('show'),1600)};

  const defs={
    iron_pickaxe:{name:'Pioche en fer',icon:'⛏️',level:38,cost:{iron_ingot:5,wood:2}},
    iron_axe:{name:'Hache en fer',icon:'🪓',level:38,cost:{iron_ingot:4,wood:3}}
  };
  window.survivalItemDefs=window.survivalItemDefs||{};
  Object.assign(window.survivalItemDefs,{iron_pickaxe:{label:'Pioche en fer',icon:'⛏️',kind:'tool'},iron_axe:{label:'Hache en fer',icon:'🪓',kind:'tool'}});

  const RULES={
    'BRANCHES':{tool:'hand'},'FIBRES / PAILLE':{tool:'hand'},'PLANTES MÉDICINALES':{tool:'hand'},'PLANTES TEXTILES':{tool:'hand'},'EAU':{tool:'hand'},
    'BOIS':{tool:'axe'},'RÉSINE':{tool:'axe'},
    'PIERRE':{tool:'pickaxe'},'CALCAIRE':{tool:'pickaxe'},'SEL':{tool:'pickaxe'},'CUIVRE':{tool:'pickaxe'},'ÉTAIN':{tool:'pickaxe'},'FER':{tool:'pickaxe'},'BASALTE':{tool:'pickaxe'},'ROCHE VOLCANIQUE / BASALTE':{tool:'pickaxe'},'SOUFRE':{tool:'pickaxe'},
    'ARGILE':{tool:'shovel'},'TERRE':{tool:'shovel'},'SABLE':{tool:'shovel'},'NEIGE':{tool:'shovel'},
    'ARGENT':{tool:'iron_pickaxe'},'OR':{tool:'iron_pickaxe'},'OBSIDIENNE':{tool:'iron_pickaxe'},
    'PEAU':{source:'animal'},'FOURRURE':{source:'animal'},'LAINE':{source:'animal'},'OS / CORNES / DENTS':{source:'animal'},'GRAISSE ANIMALE':{source:'animal'},'VENINS / GLANDES':{source:'animal'}
  };
  const toolNames={axe:'hache primitive',pickaxe:'pioche primitive',shovel:'pelle',iron_pickaxe:'pioche en fer'};
  const equipped=()=>localStorage.getItem(ekey())||'';
  const toolOk=req=>req==='hand'||equipped()===req||(req==='axe'&&equipped()==='iron_axe')||(req==='pickaxe'&&equipped()==='iron_pickaxe');
  const extractName=txt=>String(txt||'').toUpperCase().replace(/^.*RÉCOLTER\s+/,'').replace(/\s*•.*$/,'').trim();

  document.addEventListener('click',e=>{
    const b=e.target.closest?.('#resourceAction');if(!b)return;
    const name=extractName(b.textContent),r=RULES[name];if(!r)return;
    if(r.source==='animal'){
      e.preventDefault();e.stopImmediatePropagation();toast(`${name} se récupère sur les animaux, pas au sol`);return;
    }
    if(!toolOk(r.tool)){
      e.preventDefault();e.stopImmediatePropagation();toast(`Il faut équiper ${toolNames[r.tool]||r.tool} pour récolter ${name.toLowerCase()}`);
    }
  },true);

  function addAdvancedCraft(){
    const cv=document.querySelector('#inventoryPanel .craft-view');if(!cv)return;
    for(const[k,d]of Object.entries(defs)){
      if(cv.querySelector(`[data-advanced-tool="${k}"]`))continue;
      const c=document.createElement('div');c.className='craft-card';c.dataset.advancedTool=k;
      c.innerHTML=`<div class="craft-title"><span>${d.icon} ${d.name}</span><button class="craft-btn">FABRIQUER</button></div><div class="craft-cost">Niv. ${d.level} • ${Object.entries(d.cost).map(([a,n])=>`${n} ${a==='iron_ingot'?'lingots de fer':a==='wood'?'bois':a}`).join(' + ')}</div>`;
      const btn=c.querySelector('button');btn.onclick=()=>{const v=readInv();if(level()<d.level)return toast(`Niveau ${d.level} requis`);if(Object.entries(d.cost).some(([a,n])=>(v[a]||0)<n))return toast('Ressources insuffisantes');for(const[a,n]of Object.entries(d.cost))v[a]-=n;v[k]=(v[k]||0)+1;saveInv(v);window.addSurvivalXP?.(18,'Outil en fer');toast(`${d.name} fabriquée`);refresh()};
      cv.appendChild(c);
    }
  }
  function addToolRows(){
    const bag=document.querySelector('#inventoryPanel .bag-view');if(!bag)return;const v=readInv();
    for(const[k,d]of Object.entries(defs)){
      let r=bag.querySelector(`[data-item="${k}"]`);if(!r){r=document.createElement('div');r.className='tool-row';r.dataset.item=k;r.innerHTML=`<div class="tool-main"><span>${d.icon} ${d.name}</span></div><button class="equip-advanced">ÉQUIPER</button><b>0</b>`;r.querySelector('button').onclick=()=>{if((readInv()[k]||0)<=0)return;localStorage.setItem(ekey(),k);toast(`${d.name} équipée`);window.refreshSurvivalQuickbar?.()};bag.appendChild(r)}r.querySelector('b').textContent=v[k]||0;r.hidden=!(v[k]>0)
    }
  }
  function refresh(){addAdvancedCraft();addToolRows();const v=readInv();document.querySelectorAll('[data-advanced-tool]').forEach(c=>{const k=c.dataset.advancedTool,d=defs[k],b=c.querySelector('button');b.disabled=level()<d.level||Object.entries(d.cost).some(([a,n])=>(v[a]||0)<n)})}
  let n=0;(function wait(){if(document.querySelector('#inventoryPanel .craft-view')){refresh();setInterval(refresh,1200);return}if(n++<100)setTimeout(wait,100)})();
})();