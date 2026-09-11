(()=>{
  const panel=document.getElementById('inventoryPanel');
  if(!panel)return;
  const characterId=sessionStorage.getItem('survival_character_id')||'guest';
  const inventoryKey='survival_inventory_'+characterId;
  const equippedKey='survival_equipped_'+characterId;
  const quickbarKey='survival_quickbar_'+characterId;

  const itemDefs={
    wood:{label:'Bois',icon:'🪵',kind:'resource'},
    stone:{label:'Pierre',icon:'🪨',kind:'resource'},
    berries:{label:'Baies',icon:'🫐',kind:'consumable'},
    water:{label:'Bocal d’eau',icon:'🫙',kind:'consumable'},
    sand:{label:'Sable',icon:'🏖️',kind:'resource'},
    dirt:{label:'Terre',icon:'🟫',kind:'resource'},
    snow:{label:'Neige',icon:'❄️',kind:'resource'},
    axe:{label:'Hache',full:'Hache primitive',icon:'🪓',kind:'tool'},
    pickaxe:{label:'Pioche',full:'Pioche primitive',icon:'⛏️',kind:'tool'},
    shovel:{label:'Pelle',full:'Pelle primitive',icon:'🛠️',kind:'tool'}
  };
  window.survivalItemDefs=itemDefs;

  const recipes={axe:{wood:3,stone:2},pickaxe:{wood:2,stone:3},shovel:{wood:3,stone:1}};
  const defaults={wood:0,stone:0,water:0,berries:0,axe:0,pickaxe:0,shovel:0,sand:0,dirt:0,snow:0};
  const readInventory=()=>{try{return {...defaults,...JSON.parse(localStorage.getItem(inventoryKey)||'{}')}}catch{return {...defaults}}};
  const saveInventory=inv=>localStorage.setItem(inventoryKey,JSON.stringify(inv));
  const readQuickbar=()=>{try{const q=JSON.parse(localStorage.getItem(quickbarKey)||'[]');return Array.from({length:8},(_,i)=>q[i]||'')}catch{return Array(8).fill('')}};
  const saveQuickbar=q=>localStorage.setItem(quickbarKey,JSON.stringify(q));
  const toast=text=>{const el=document.getElementById('toast');if(!el)return;el.textContent=text;el.classList.add('show');clearTimeout(window.__craftToastTimer);window.__craftToastTimer=setTimeout(()=>el.classList.remove('show'),1400)};

  const style=document.createElement('style');
  style.textContent=`
    .inventory{width:min(94vw,680px);padding:calc(env(safe-area-inset-top) + 18px) 14px 18px;overflow:hidden}
    .inventory-layout{height:100%;display:grid;grid-template-columns:minmax(170px,42%) 1fr;gap:12px;padding-top:34px}
    .equipment-pane,.inventory-content{min-width:0;overflow-y:auto;border-radius:14px;border:1px solid #ffffff16;background:#08111699}
    .equipment-pane{position:relative;padding:12px 10px 16px;overflow:hidden;background:linear-gradient(180deg,#16242af2,#0a1217f2)}
    .inventory-content{padding:12px;background:linear-gradient(180deg,#101a20ee,#091116ee)}
    .inventory-content h2,.equipment-pane h3{margin:0 0 12px;color:#f0d28e;font-family:Georgia,serif}.equipment-pane h3{text-align:center;font-size:16px}
    .inv-tabs{display:flex;gap:7px;margin:0 0 14px}.inv-tab{flex:1;border:1px solid #ffffff20;background:#142128;color:#b9c8ca;padding:9px 7px;border-radius:8px;font-size:9px;font-weight:900}.inv-tab.active{background:#3d4f2d;color:#f2d897;border-color:#d0a85b88}
    .craft-view{display:none}.craft-view.active{display:block}.bag-view.hidden{display:none}.craft-card{padding:12px;margin:9px 0;border-radius:11px;background:#ffffff0b;border:1px solid #ffffff18}.craft-title{display:flex;justify-content:space-between;align-items:center;gap:8px;font-weight:900;color:#f0d28e}.craft-cost{font-size:9px;color:#aab9bb;margin:8px 0}.craft-btn,.equip-btn{border:1px solid #ffffff25;background:#35482b;color:#eaf7d8;border-radius:8px;padding:8px 10px;font-size:9px;font-weight:900}.craft-btn:disabled{opacity:.38}.tool-row{display:flex;justify-content:space-between;align-items:center;padding:13px 12px;margin:8px 0;border-radius:10px;background:#ffffff0b;border:1px solid #ffffff16}.tool-row[hidden]{display:none}.tool-main{display:flex;align-items:center;gap:8px}.tool-row b{color:#f3d58b;font-size:18px}
    .paperdoll{position:relative;height:390px;max-height:56vh;min-height:300px;margin-top:2px}.doll-person{position:absolute;left:50%;top:42px;transform:translateX(-50%);width:105px;height:250px;filter:drop-shadow(0 10px 12px #0008)}.doll-head{position:absolute;left:35px;top:0;width:36px;height:42px;border-radius:50% 50% 46% 46%;background:#b9825c;border:2px solid #d6aa82}.doll-body{position:absolute;left:23px;top:40px;width:60px;height:95px;border-radius:25px 25px 14px 14px;background:#66513f;border:2px solid #8c735d}.doll-arm{position:absolute;top:48px;width:23px;height:105px;border-radius:14px;background:#ad7957;border:2px solid #c99875}.doll-arm.l{left:3px;transform:rotate(7deg)}.doll-arm.r{right:3px;transform:rotate(-7deg)}.doll-leg{position:absolute;top:128px;width:28px;height:115px;border-radius:10px 10px 15px 15px;background:#4b4139;border:2px solid #6c5d50}.doll-leg.l{left:23px}.doll-leg.r{right:23px}
    .equip-slot{position:absolute;width:76px;min-height:49px;padding:6px;border-radius:9px;background:#0b151bbf;border:1px solid #ffffff23;color:#9fb0b5;font-size:7px;text-align:center;font-weight:900}.equip-slot strong{display:block;margin-top:4px;color:#f1d58d;font-size:9px;line-height:1.15}.equip-slot.head{left:50%;top:0;transform:translateX(-50%)}.equip-slot.chest{left:0;top:110px}.equip-slot.hand{right:0;top:110px}.equip-slot.legs{left:50%;bottom:0;transform:translateX(-50%)}.equip-slot.active{border-color:#d1aa5b99;background:#2f3526cc}.equip-slot.active strong{color:#fff0b0}
    .held-tool{position:fixed;z-index:23;right:7%;bottom:8%;width:118px;height:180px;pointer-events:none;transform-origin:75% 85%;filter:drop-shadow(0 8px 8px #0008);display:none}.held-tool.show{display:block}.held-tool.swing{animation:toolSwing .28s ease-out}.tool-handle{position:absolute;width:18px;height:140px;right:31px;bottom:0;border-radius:9px;background:linear-gradient(90deg,#5a351e,#8a5a32,#4b2b18);transform:rotate(-23deg);transform-origin:bottom}.tool-head{position:absolute;right:2px;top:20px;background:#7c8587;border:2px solid #b7c0c0;transform:rotate(-23deg)}.held-tool.axe .tool-head{width:63px;height:28px;border-radius:50% 9px 9px 50%;clip-path:polygon(0 50%,35% 0,100% 12%,100% 88%,35% 100%)}.held-tool.pickaxe .tool-head{width:88px;height:17px;border-radius:50%;clip-path:polygon(0 50%,20% 10%,50% 0,80% 10%,100% 50%,80% 90%,50% 100%,20% 90%)}.held-tool.shovel .tool-head{width:38px;height:48px;border-radius:9px 9px 18px 18px;clip-path:polygon(15% 0,85% 0,100% 65%,50% 100%,0 65%)}
    .quickbar .slot{cursor:pointer}.quickbar .slot .item-icon{position:absolute;inset:5px 3px 9px;display:flex;align-items:center;justify-content:center;font-size:17px}.quickbar .slot .type{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.quickbar .slot .qty{position:absolute;right:3px;top:2px;color:#f7dda0;font-size:7px;font-weight:900}.quickbar .slot.empty .type{color:#ffffff38}.quickbar .slot.active{border-color:#f0cf75;box-shadow:0 0 0 1px #f0cf7544 inset}
    @keyframes toolSwing{0%{transform:rotate(0deg)}45%{transform:rotate(-35deg) translate(-8px,8px)}100%{transform:rotate(0deg)}}
    @media(max-width:520px){.inventory{width:96vw}.inventory-layout{grid-template-columns:42% 58%;gap:7px}.equipment-pane,.inventory-content{padding:8px}.paperdoll{min-height:280px}.equip-slot{width:66px;font-size:6px}.equip-slot strong{font-size:8px}.craft-title{flex-direction:column;align-items:flex-start}.craft-btn{width:100%}}
  `;
  document.head.appendChild(style);

  const heading=panel.querySelector('h2');
  const tabs=document.createElement('div');tabs.className='inv-tabs';tabs.innerHTML='<button class="inv-tab active" data-tab="bag">INVENTAIRE</button><button class="inv-tab" data-tab="craft">CRAFT</button>';heading.insertAdjacentElement('afterend',tabs);
  const bag=document.createElement('div');bag.className='bag-view';[...panel.querySelectorAll(':scope > .inv-row')].forEach(r=>bag.appendChild(r));panel.insertBefore(bag,tabs.nextSibling);
  const craft=document.createElement('div');craft.className='craft-view';craft.innerHTML=`
    <div class="craft-card" data-recipe="axe"><div class="craft-title"><span>🪓 Hache primitive</span><button class="craft-btn">FABRIQUER</button></div><div class="craft-cost">Coût : 3 bois + 2 pierres</div></div>
    <div class="craft-card" data-recipe="pickaxe"><div class="craft-title"><span>⛏️ Pioche primitive</span><button class="craft-btn">FABRIQUER</button></div><div class="craft-cost">Coût : 2 bois + 3 pierres</div></div>
    <div class="craft-card" data-recipe="shovel"><div class="craft-title"><span>🛠️ Pelle primitive</span><button class="craft-btn">FABRIQUER</button></div><div class="craft-cost">Coût : 3 bois + 1 pierre</div></div>`;panel.insertBefore(craft,bag.nextSibling);

  const equipment=document.createElement('section');equipment.className='equipment-pane';equipment.innerHTML=`<h3>Équipement</h3><div class="paperdoll"><div class="equip-slot head">TÊTE<strong>—</strong></div><div class="equip-slot chest">TORSE<strong>—</strong></div><div class="equip-slot hand" id="equipHand">MAIN<strong id="equipHandValue">Vide</strong></div><div class="equip-slot legs">JAMBES<strong>—</strong></div><div class="doll-person"><div class="doll-head"></div><div class="doll-body"></div><div class="doll-arm l"></div><div class="doll-arm r"></div><div class="doll-leg l"></div><div class="doll-leg r"></div></div></div>`;
  const content=document.createElement('section');content.className='inventory-content';[heading,tabs,bag,craft].forEach(el=>content.appendChild(el));const layout=document.createElement('div');layout.className='inventory-layout';layout.append(equipment,content);panel.appendChild(layout);
  const held=document.createElement('div');held.id='heldTool';held.className='held-tool';held.innerHTML='<div class="tool-handle"></div><div class="tool-head"></div>';document.body.appendChild(held);
  const quickSlots=[...document.querySelectorAll('.quickbar .slot')];

  function ensureToolRows(){
    const tools=[['axe','invAxe','rowAxe','🪓 Hache primitive'],['pickaxe','invPickaxe','rowPickaxe','⛏️ Pioche primitive'],['shovel','invShovel','rowShovel','🛠️ Pelle primitive']];
    tools.forEach(([tool,id,rowId,label])=>{if(!document.getElementById(id)){const r=document.createElement('div');r.className='tool-row';r.id=rowId;r.dataset.item=tool;r.innerHTML=`<div class="tool-main"><span>${label}</span></div><b id="${id}">0</b>`;bag.appendChild(r)}})
  }
  function tagBaseRows(){
    const ids={invWood:'wood',invStone:'stone',invWater:'water',invBerries:'berries'};
    Object.entries(ids).forEach(([id,key])=>{const el=document.getElementById(id);const row=el?.closest('.inv-row');if(row)row.dataset.item=key})
  }
  function setEquipped(item){const inv=readInventory();if(item&&!(inv[item]>0))item='';localStorage.setItem(equippedKey,item||'');updateHeldTool()}
  function updateQuickbar(){
    const inv=readInventory(),q=readQuickbar(),equipped=localStorage.getItem(equippedKey)||'';
    quickSlots.forEach((slot,i)=>{
      const item=q[i]&&itemDefs[q[i]]&&inv[q[i]]>0?q[i]:'';if(q[i]&&!item)q[i]='';
      const def=itemDefs[item];slot.classList.toggle('active',!!item&&item===equipped);slot.classList.toggle('empty',!item);slot.classList.remove('weapon','tool','consumable');if(def)slot.classList.add(def.kind==='tool'?'tool':def.kind==='consumable'?'consumable':'tool');
      slot.innerHTML=`<span class="num">${i+1}</span>${item?`<span class="item-icon">${def.icon}</span><span class="type">${def.label}</span>${inv[item]>1?`<span class="qty">${inv[item]}</span>`:''}`:'<span class="type">VIDE</span>'}`;slot.dataset.item=item
    });saveQuickbar(q)
  }
  function updateHeldTool(){
    const inv=readInventory(),item=localStorage.getItem(equippedKey)||'',def=itemDefs[item],valid=item&&def&&inv[item]>0;
    held.className='held-tool';if(valid&&def.kind==='tool')held.classList.add('show',item);
    const hand=document.getElementById('equipHand'),value=document.getElementById('equipHandValue');if(hand&&value){hand.classList.toggle('active',!!valid);value.textContent=valid?def.icon+' '+def.label:'Vide'}
    updateQuickbar();window.refreshQuickbarOrganizer?.()
  }
  function refreshResourceRows(inv){const map={invWood:'wood',invStone:'stone',invWater:'water',invBerries:'berries'};Object.entries(map).forEach(([id,key])=>{const el=document.getElementById(id);if(el)el.textContent=inv[key]||0})}
  function applyBagVisibility(){
    const inv=readInventory(),q=readQuickbar();
    bag.querySelectorAll('[data-item]').forEach(row=>{const key=row.dataset.item;row.hidden=!(inv[key]>0)||q.includes(key)})
  }
  function refresh(){
    ensureToolRows();tagBaseRows();const inv=readInventory();refreshResourceRows(inv);
    [['invAxe','axe'],['invPickaxe','pickaxe'],['invShovel','shovel']].forEach(([id,key])=>{const el=document.getElementById(id);if(el)el.textContent=inv[key]||0});
    craft.querySelectorAll('.craft-card').forEach(card=>{const type=card.dataset.recipe,cost=recipes[type],b=card.querySelector('.craft-btn');b.disabled=!cost||Object.entries(cost).some(([k,v])=>(inv[k]||0)<v)});
    applyBagVisibility();updateHeldTool();window.refreshGroundInventory?.();window.refreshQuickbarOrganizer?.()
  }
  function craftTool(type){
    const inv=readInventory(),cost=recipes[type];if(!cost)return;
    if(Object.entries(cost).some(([k,v])=>(inv[k]||0)<v)){toast('Ressources insuffisantes');refresh();return}
    Object.entries(cost).forEach(([k,v])=>inv[k]-=v);inv[type]=(inv[type]||0)+1;saveInventory(inv);refresh();window.refreshInventoryVisibility?.();toast(itemDefs[type].full+' ajoutée au sac')
  }

  tabs.addEventListener('click',e=>{const btn=e.target.closest('.inv-tab');if(!btn)return;tabs.querySelectorAll('.inv-tab').forEach(x=>x.classList.toggle('active',x===btn));const isCraft=btn.dataset.tab==='craft';bag.classList.toggle('hidden',isCraft);craft.classList.toggle('active',isCraft);refresh()});
  craft.addEventListener('click',e=>{const b=e.target.closest('.craft-btn');if(b&&!b.disabled)craftTool(b.closest('.craft-card').dataset.recipe)});
  quickSlots.forEach((slot,i)=>slot.addEventListener('click',()=>{const q=readQuickbar(),item=q[i];if(!item||!itemDefs[item])return;setEquipped(item);toast(itemDefs[item].label+' sélectionné')}));
  document.getElementById('gatherBtn')?.addEventListener('click',()=>{if(held.classList.contains('show')){held.classList.remove('swing');void held.offsetWidth;held.classList.add('swing')}});
  document.getElementById('inventoryBtn')?.addEventListener('click',refresh);
  window.refreshCraftInventory=refresh;
  window.refreshSurvivalQuickbar=updateQuickbar;
  window.refreshSurvivalBagVisibility=applyBagVisibility;
  refresh();
})();