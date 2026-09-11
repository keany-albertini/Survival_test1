(()=>{
  const panel=document.getElementById('inventoryPanel');
  if(!panel)return;
  const characterId=sessionStorage.getItem('survival_character_id')||'guest';
  const inventoryKey='survival_inventory_'+characterId;
  const equippedKey='survival_equipped_'+characterId;

  const readInventory=()=>{
    try{return {wood:0,stone:0,water:0,berries:0,axe:0,pickaxe:0,...JSON.parse(localStorage.getItem(inventoryKey)||'{}')}}catch{return {wood:0,stone:0,water:0,berries:0,axe:0,pickaxe:0}}
  };
  const saveInventory=inv=>localStorage.setItem(inventoryKey,JSON.stringify(inv));
  const toast=text=>{
    const el=document.getElementById('toast');
    if(!el)return;
    el.textContent=text;el.classList.add('show');
    clearTimeout(window.__craftToastTimer);
    window.__craftToastTimer=setTimeout(()=>el.classList.remove('show'),1400);
  };

  const style=document.createElement('style');
  style.textContent=`
    .inv-tabs{display:flex;gap:7px;margin:0 0 14px}.inv-tab{flex:1;border:1px solid #ffffff20;background:#142128;color:#b9c8ca;padding:9px 7px;border-radius:8px;font-size:9px;font-weight:900}.inv-tab.active{background:#3d4f2d;color:#f2d897;border-color:#d0a85b88}
    .craft-view{display:none}.craft-view.active{display:block}.bag-view.hidden{display:none}.craft-card{padding:12px;margin:9px 0;border-radius:11px;background:#ffffff0b;border:1px solid #ffffff18}.craft-title{display:flex;justify-content:space-between;align-items:center;gap:8px;font-weight:900;color:#f0d28e}.craft-cost{font-size:9px;color:#aab9bb;margin:8px 0}.craft-btn,.equip-btn{border:1px solid #ffffff25;background:#35482b;color:#eaf7d8;border-radius:8px;padding:8px 10px;font-size:9px;font-weight:900}.craft-btn:disabled{opacity:.38}.tool-row{display:flex;justify-content:space-between;align-items:center;padding:13px 12px;margin:8px 0;border-radius:10px;background:#ffffff0b;border:1px solid #ffffff16}.tool-main{display:flex;align-items:center;gap:8px}.tool-row b{color:#f3d58b;font-size:18px}
    .held-tool{position:fixed;z-index:23;right:7%;bottom:8%;width:118px;height:180px;pointer-events:none;transform-origin:75% 85%;filter:drop-shadow(0 8px 8px #0008);display:none}.held-tool.show{display:block}.held-tool.swing{animation:toolSwing .28s ease-out}.tool-handle{position:absolute;width:18px;height:140px;right:31px;bottom:0;border-radius:9px;background:linear-gradient(90deg,#5a351e,#8a5a32,#4b2b18);transform:rotate(-23deg);transform-origin:bottom}.tool-head{position:absolute;right:2px;top:20px;background:#7c8587;border:2px solid #b7c0c0;transform:rotate(-23deg)}.held-tool.axe .tool-head{width:63px;height:28px;border-radius:50% 9px 9px 50%;clip-path:polygon(0 50%,35% 0,100% 12%,100% 88%,35% 100%)}.held-tool.pickaxe .tool-head{width:88px;height:17px;border-radius:50%;clip-path:polygon(0 50%,20% 10%,50% 0,80% 10%,100% 50%,80% 90%,50% 100%,20% 90%)}
    @keyframes toolSwing{0%{transform:rotate(0deg)}45%{transform:rotate(-35deg) translate(-8px,8px)}100%{transform:rotate(0deg)}}
  `;
  document.head.appendChild(style);

  const heading=panel.querySelector('h2');
  const tabs=document.createElement('div');
  tabs.className='inv-tabs';
  tabs.innerHTML='<button class="inv-tab active" data-tab="bag">SAC</button><button class="inv-tab" data-tab="craft">CRAFT</button>';
  heading.insertAdjacentElement('afterend',tabs);

  const bag=document.createElement('div');
  bag.className='bag-view';
  const rows=[...panel.querySelectorAll(':scope > .inv-row')];
  rows.forEach(r=>bag.appendChild(r));
  panel.insertBefore(bag,tabs.nextSibling);

  const craft=document.createElement('div');
  craft.className='craft-view';
  craft.innerHTML=`
    <div class="craft-card" data-recipe="axe"><div class="craft-title"><span>🪓 Hache primitive</span><button class="craft-btn">FABRIQUER</button></div><div class="craft-cost">Coût : 3 bois + 2 pierres</div></div>
    <div class="craft-card" data-recipe="pickaxe"><div class="craft-title"><span>⛏️ Pioche primitive</span><button class="craft-btn">FABRIQUER</button></div><div class="craft-cost">Coût : 2 bois + 3 pierres</div></div>`;
  panel.insertBefore(craft,bag.nextSibling);

  const held=document.createElement('div');
  held.id='heldTool';held.className='held-tool';
  held.innerHTML='<div class="tool-handle"></div><div class="tool-head"></div>';
  document.body.appendChild(held);

  function ensureToolRows(){
    let axe=document.getElementById('invAxe');
    if(!axe){
      const r=document.createElement('div');r.className='tool-row';r.id='rowAxe';r.innerHTML='<div class="tool-main"><span>🪓 Hache primitive</span><button class="equip-btn" data-tool="axe">ÉQUIPER</button></div><b id="invAxe">0</b>';bag.appendChild(r)
    }
    let pick=document.getElementById('invPickaxe');
    if(!pick){
      const r=document.createElement('div');r.className='tool-row';r.id='rowPickaxe';r.innerHTML='<div class="tool-main"><span>⛏️ Pioche primitive</span><button class="equip-btn" data-tool="pickaxe">ÉQUIPER</button></div><b id="invPickaxe">0</b>';bag.appendChild(r)
    }
  }

  function updateHeldTool(){
    const inv=readInventory(),tool=localStorage.getItem(equippedKey)||'';
    held.className='held-tool';
    if(tool&&inv[tool]>0)held.classList.add('show',tool);
    bag.querySelectorAll('.equip-btn').forEach(btn=>{btn.textContent=btn.dataset.tool===tool?'ÉQUIPÉ':'ÉQUIPER'});
  }

  function refresh(){
    ensureToolRows();
    const inv=readInventory();
    const axe=document.getElementById('invAxe'),pick=document.getElementById('invPickaxe');
    if(axe)axe.textContent=inv.axe||0;if(pick)pick.textContent=inv.pickaxe||0;
    const rowAxe=document.getElementById('rowAxe'),rowPick=document.getElementById('rowPickaxe');
    if(rowAxe)rowAxe.hidden=!(inv.axe>0);if(rowPick)rowPick.hidden=!(inv.pickaxe>0);
    craft.querySelectorAll('.craft-card').forEach(card=>{
      const b=card.querySelector('.craft-btn'),type=card.dataset.recipe;
      b.disabled=type==='axe'?!(inv.wood>=3&&inv.stone>=2):!(inv.wood>=2&&inv.stone>=3);
    });
    updateHeldTool();
  }

  function craftTool(type){
    const inv=readInventory();
    const cost=type==='axe'?{wood:3,stone:2}:{wood:2,stone:3};
    if(inv.wood<cost.wood||inv.stone<cost.stone){toast('Pas assez de ressources');return}
    inv.wood-=cost.wood;inv.stone-=cost.stone;inv[type]=(inv[type]||0)+1;
    saveInventory(inv);
    localStorage.setItem(equippedKey,type);
    sessionStorage.setItem('survival_open_inventory','1');
    toast(type==='axe'?'Hache fabriquée':'Pioche fabriquée');
    setTimeout(()=>location.reload(),420);
  }

  tabs.addEventListener('click',e=>{
    const btn=e.target.closest('.inv-tab');if(!btn)return;
    tabs.querySelectorAll('.inv-tab').forEach(x=>x.classList.toggle('active',x===btn));
    const isCraft=btn.dataset.tab==='craft';bag.classList.toggle('hidden',isCraft);craft.classList.toggle('active',isCraft);refresh();
  });
  craft.addEventListener('click',e=>{const b=e.target.closest('.craft-btn');if(b&&!b.disabled)craftTool(b.closest('.craft-card').dataset.recipe)});
  bag.addEventListener('click',e=>{
    const b=e.target.closest('.equip-btn');if(!b)return;
    const inv=readInventory(),tool=b.dataset.tool;if(!(inv[tool]>0))return;
    const current=localStorage.getItem(equippedKey)||'';
    localStorage.setItem(equippedKey,current===tool?'':tool);updateHeldTool();toast(current===tool?'Outil rangé':(tool==='axe'?'Hache équipée':'Pioche équipée'));
  });
  document.getElementById('gatherBtn')?.addEventListener('click',()=>{if(held.classList.contains('show')){held.classList.remove('swing');void held.offsetWidth;held.classList.add('swing')}});
  document.getElementById('inventoryBtn')?.addEventListener('click',refresh);
  if(sessionStorage.getItem('survival_open_inventory')==='1'){sessionStorage.removeItem('survival_open_inventory');requestAnimationFrame(()=>panel.classList.add('open'))}
  refresh();
})();