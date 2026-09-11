(()=>{
  const characterId=sessionStorage.getItem('survival_character_id')||'guest';
  const inventoryKey='survival_inventory_'+characterId;
  const equippedKey='survival_equipped_'+characterId;
  const quickbarKey='survival_quickbar_'+characterId;
  const readInv=()=>{try{return JSON.parse(localStorage.getItem(inventoryKey)||'{}')}catch{return {}}};
  const readBar=()=>{try{const q=JSON.parse(localStorage.getItem(quickbarKey)||'[]');return Array.from({length:8},(_,i)=>q[i]||'')}catch{return Array(8).fill('')}};
  const saveBar=q=>localStorage.setItem(quickbarKey,JSON.stringify(q));
  let previous=readInv();

  function autoEquip(item){
    const defs=window.survivalItemDefs||{};
    const def=defs[item];
    if(!def||!['tool','weapon'].includes(def.kind))return;
    const q=readBar();
    if(!q.includes(item)){
      const free=q.findIndex(x=>!x);
      if(free<0)return;
      q[free]=item;
      saveBar(q);
    }
    localStorage.setItem(equippedKey,item);
    window.refreshSurvivalQuickbar?.();
    window.refreshSurvivalBagVisibility?.();
    window.refreshQuickbarOrganizer?.();
    window.refreshCraftInventory?.();
  }

  setInterval(()=>{
    const now=readInv();
    const defs=window.survivalItemDefs||{};
    Object.entries(defs).forEach(([key,def])=>{
      if(!['tool','weapon'].includes(def.kind))return;
      const before=Number(previous[key]||0),after=Number(now[key]||0);
      if(after>before)autoEquip(key);
    });
    previous=now;
  },120);
})();