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
    .inventory{width:min(94vw,680px);padding:calc(env(safe-area-inset-top) + 18px) 14px 18px;overflow:hidden}
    .inventory-layout{height:100%;display:grid;grid-template-columns:minmax(170px,42%) 1fr;gap:12px;padding-top:34px}
    .equipment-pane,.inventory-content{min-width:0;overflow-y:auto;border-radius:14px;border:1px solid #ffffff16;background:#08111699}
    .equipment-pane{position:relative;padding:12px 10px 16px;overflow:hidden;background:linear-gradient(180deg,#16242af2,#0a1217f2)}
    .inventory-content{padding:12px;background:linear-gradient(180deg,#101a20ee,#091116ee)}
    .inventory-content h2,.equipment-pane h3{margin:0 0 12px;color:#f0d28e;font-family:Georgia,serif}
    .equipment-pane h3{text-align:center;font-size:16px}
    .inv-tabs{display:flex;gap:7px;margin:0 0 14px}.inv-tab{flex:1;border:1px solid #ffffff20;background:#142128;color:#b9c8ca;padding:9px 7px;border-radius:8px;font-size:9px;font-weight:900}.inv-tab.active{background:#3d4f2d;color:#f2d897;border-color:#d0a85b88}
    .craft-view{display:none}.craft-view.active{display:block}.bag-view.hidden{display:none}.craft-card{padding:12px;margin:9px 0;border-radius:11px;background:#ffffff0b;border:1px solid #ffffff18}.craft-title{display:flex;justify-content:space-between;align-items:center;gap:8px;font-weight:900;color:#f0d28e}.craft-cost{font-size:9px;color:#aab9bb;margin:8px 0}.craft-btn,.equip-btn{border:1px solid #ffffff25;background:#35482b;color:#eaf7d8;border-radius:8px;padding:8px 10px;font-size:9px;font-weight:900}.craft-btn:disabled{opacity:.38}.tool-row{display:flex;justify-content:space-between;align-items:center;padding:13px 12px;margin:8px 0;border-radius:10px;background:#ffffff0b;border:1px solid #ffffff16}.tool-main{display:flex;align-items:center;gap:8px}.tool-row b{color:#f3d58b;font-size:18px}
    .paperdoll{position:relative;height:390px;max-height:56vh;min-height:300px;margin-top:2px}
    .doll-person{position:absolute;left:50%;top:42px;transform:translateX(-50%);width:105px;height:250px;filter:drop-shadow(0 10px 12px #0008)}
    .doll-head{position:absolute;left:35px;top:0;width:36px;height:42px;border-radius:50% 50% 46% 46%;background:#b9825c;border:2px solid #d6aa82}
    .doll-body{position:absolute;left:23px;top:40px;width:60px;height:95px;border-radius:25px 25px 14px 14px;background:#66513f;border:2px solid #8c735d}
    .doll-arm{position:absolute;top:48px;width:23px;height:105px;border-radius:14px;background:#ad7957;border:2px solid #c99875}.doll-arm.l{left:3px;transform:rotate(7deg)}.doll-arm.r{right:3px;transform:rotate(-7deg)}
    .doll-leg{position:absolute;top:128px;width:28px;height:115px;border-radius:10px 10px 15px 15px;background:#4b4139;border:2px solid #6c5d50}.doll-leg.l{left:23px}.doll-leg.r{right:23px}
    .equip-slot{position:absolute;width:76px;min-height:49px;padding:6px;border-radius:9px;background:#0b151bbf;border:1px solid #ffffff23;color:#9fb0b5;font-size:7px;text-align:center;font-weight:900}.equip-slot strong{display:block;margin-top:4px;color:#f1d58d;font-size:9px;line-height:1.15}.equip-slot.head{left:50%;top:0;transform:translateX(-50%)}.equip-slot.chest{left:0;top:110px}.equip-slot.hand{right:0;top:110px}.equip-slot.legs{left:50%;bottom:0;transform:translateX(-50%)}
    .equip-slot.active{border-color:#d1aa5b99;background:#2f3526cc}.equip-slot.active strong{color:#fff0b0}
    .held-tool{position:fixed;z-index:23;right:7%;bottom:8%;width:118px;height:180px;pointer-events:none;transform-origin:75% 85%;filter:drop-shadow(0 8px 8px #0008);display:none}.held-tool.show{display:block}.held-tool.swing{animation:toolSwing .28s ease-out}.tool-handle{position:absolute;width:18px;height:140px;right:31px;bottom:0;border-radius:9px;background:linear-gradient(90deg,#5a351e,#8a5a32,#4b2b18);transform:rotate(-23deg);transform-origin:bottom}.tool-head{position:absolute;right:2px;top:20px;background:#7c8587;border:2px solid #b7c0c0;transform:rotate(-23deg)}.held-tool.axe .tool-head{width:63px;height:28px;border-radius:50% 9px 9px 50%;clip-path:polygon(0 50%,35% 0,100% 12%,100% 88%,35% 100%)}.held-tool.pickaxe .tool-head{width:88px;height:17px;border-radius:50%;clip-path:polygon(0 50%,20% 10%,50% 0,80% 10%,100% 50%,80% 90%,50% 100%,20% 90%)}
    @keyframes toolSwing{0%{transform:rotate(0deg)}45%{transform:rotate(-35deg) translate(-8px,8px)}100%{transform:rotate(0deg)}}
    @media(max-width:520px){.inventory{width:96vw}.inventory-layout{grid-template-columns:42% 58%;gap:7px}.equipment-pane,.inventory-content{padding:8px}.paperdoll{min-height:280px}.equip-slot{width:66px;font-size:6px}.equip-slot strong{font-size:8px}.craft-title{flex-direction:column;align-items:flex-start}.craft-btn{width:100%}}
  `;
  document.head.appendChild(style);

  const heading=panel.querySelector('h2');
  const tabs=document.createElement('div');
  tabs.className='inv-tabs';
  tabs.innerHTML='<button class="inv-tab active" data-tab="bag">INVENTAIRE</button><button class="inv-tab" data-tab="craft">CRAFT</button>';
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

  const equipment=document.createElement('section');
  equipment.className='equipment-pane';
  equipment.innerHTML=`<h3>Équipement</h3><div class="paperdoll">
    <div class="equip-slot head">TÊTE<strong>—</strong></div>
    <div class="equip-slot chest">TORSE<strong>—</strong></div>
    <div class="equip-slot hand" id="equipHand">MAIN<strong id="equipHandValue">Vide</strong></div>
    <div class="equip-slot legs">JAMBES<strong>—</strong></div>
    <div class="doll-person"><div class="doll-head"></div><div class="doll-body"></div><div class="doll-arm l"></div><div class="doll-arm r"></div><div class="doll-leg l"></div><div class="doll-leg r"></div></div>
  </div>`;

  const content=document.createElement('section');
  content.className='inventory-content';
  [heading,tabs,bag,craft].forEach(el=>content.appendChild(el));
  const layout=document.createElement('div');layout.className='inventory-layout';layout.append(equipment,content);
  panel.appendChild(layout);

  const held=document.createElement('div');
  held.id='heldTool';held.className='held-tool';
  held.innerHTML='<div class="tool-handle"></div><div class="tool-head"></div>';
  document.body.appendChild(held);

  function ensureToolRows(){
    if(!document.getElementById('invAxe')){
      const r=document.createElement('div');r.className='tool-row';r.id='rowAxe';r.innerHTML='<div class="tool-main"><span>🪓 Hache primitive</span><button class="equip-btn" data-tool="axe">ÉQUIPER</button></div><b id="invAxe">0</b>';bag.appendChild(r)
    }
    if(!document.getElementById('invPickaxe')){
      const r=document.createElement('div');r.className='tool-row';r.id='rowPickaxe';r.innerHTML='<div class="tool-main"><span>⛏️ Pioche primitive</span><button class="equip-btn" data-tool="pickaxe">ÉQUIPER</button></div><b id="invPickaxe">0</b>';bag.appendChild(r)
    }
  }

  function updateHeldTool(){
    const inv=readInventory(),tool=localStorage.getItem(equippedKey)||'';
    held.className='held-tool';
    const valid=tool&&inv[tool]>0;
    if(valid)held.classList.add('show',tool);
    bag.querySelectorAll('.equip-btn').forEach(btn=>{btn.textContent=btn.dataset.tool===tool&&valid?'ÉQUIPÉ':'ÉQUIPER'});
    const hand=document.getElementById('equipHand'),value=document.getElementById('equipHandValue');
    if(hand&&value){hand.classList.toggle('active',!!valid);value.textContent=valid?(tool==='axe'?'🪓 Hache':'⛏️ Pioche'):'Vide'}
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