(()=>{
  const characterId=sessionStorage.getItem('survival_character_id')||'guest';
  const inventoryKey='survival_inventory_'+characterId;
  const equippedKey='survival_equipped_'+characterId;
  const topinfo=document.getElementById('topinfo');
  const inventoryBtn=document.getElementById('inventoryBtn');
  const toast=document.getElementById('toast');
  const panel=document.getElementById('inventoryPanel');
  if(!topinfo||!panel)return;

  const defaults={wood:0,stone:0,water:0,berries:0,axe:0,pickaxe:0,shovel:0,sand:0,dirt:0,snow:0};
  const readInventory=()=>{try{return {...defaults,...JSON.parse(localStorage.getItem(inventoryKey)||'{}')}}catch{return {...defaults}}};
  const saveInventory=inv=>localStorage.setItem(inventoryKey,JSON.stringify(inv));
  const equipped=()=>localStorage.getItem(equippedKey)||'';
  const showToast=text=>{if(!toast)return;toast.textContent=text;toast.classList.add('show');clearTimeout(window.__digToast);window.__digToast=setTimeout(()=>toast.classList.remove('show'),1300)};

  const style=document.createElement('style');
  style.textContent=`.dig-action{position:fixed;z-index:31;right:102px;bottom:238px;width:98px;height:46px;border-radius:12px;font-size:9px;padding:6px;color:#fff;border:1px solid #d7c58b88;background:#665032e6;box-shadow:0 3px 10px #0008;font-weight:900}.dig-action[hidden]{display:none}`;
  document.head.appendChild(style);

  const digBtn=document.createElement('button');
  digBtn.id='digBtn';digBtn.className='dig-action';digBtn.hidden=true;digBtn.textContent='CREUSER';document.body.appendChild(digBtn);

  function currentBiome(){
    const parts=(topinfo.textContent||'').split('•').map(x=>x.trim());
    return parts[1]||'';
  }
  function groundResource(){
    const b=currentBiome();
    if(b==='Plage'||b==='Désert')return{key:'sand',label:'Sable'};
    if(b==='Neige')return{key:'snow',label:'Neige'};
    if(b==='Eau')return null;
    return{key:'dirt',label:'Terre'};
  }
  function ensureRows(){
    const bag=panel.querySelector('.bag-view');if(!bag)return;
    const defs=[['sand','invSand','rowSand','🏖️ Sable'],['dirt','invDirt','rowDirt','🟫 Terre'],['snow','invSnow','rowSnow','❄️ Neige']];
    defs.forEach(([key,id,rowId,label])=>{if(!document.getElementById(id)){const r=document.createElement('div');r.className='inv-row';r.id=rowId;r.innerHTML=`<span>${label}</span><b id="${id}">0</b>`;bag.appendChild(r)}})
  }
  function refreshRows(){
    ensureRows();const inv=readInventory();
    [['invSand','rowSand','sand'],['invDirt','rowDirt','dirt'],['invSnow','rowSnow','snow']].forEach(([id,rowId,key])=>{const el=document.getElementById(id),row=document.getElementById(rowId);if(el)el.textContent=inv[key]||0;if(row)row.hidden=!(inv[key]>0)})
  }
  function updateButton(){
    const ground=groundResource();
    digBtn.hidden=equipped()!=='shovel'||!ground;
    if(!digBtn.hidden)digBtn.textContent='CREUSER '+ground.label.toUpperCase();
  }
  function dig(){
    if(equipped()!=='shovel'){showToast('Équipe la pelle');return}
    const ground=groundResource();if(!ground)return;
    const inv=readInventory();inv[ground.key]=(inv[ground.key]||0)+3;saveInventory(inv);refreshRows();window.refreshCraftInventory?.();showToast('+3 '+ground.label);
    const held=document.getElementById('heldTool');if(held?.classList.contains('show')){held.classList.remove('swing');void held.offsetWidth;held.classList.add('swing')}
  }

  digBtn.addEventListener('click',dig);
  inventoryBtn?.addEventListener('click',refreshRows);
  window.refreshGroundInventory=refreshRows;
  refreshRows();updateButton();setInterval(updateButton,250);
})();