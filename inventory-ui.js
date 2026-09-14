(()=>{
  const panel=document.getElementById('inventoryPanel');
  if(!panel)return;
  function refreshInventoryVisibility(){
    panel.querySelectorAll('.inv-row').forEach(row=>{
      const qty=row.querySelector('b');
      if(!qty)return;
      const value=Number(String(qty.textContent).replace(/[^0-9.-]/g,''));
      row.hidden=!Number.isFinite(value)||value<=0;
    });
  }
  document.getElementById('inventoryBtn')?.addEventListener('click',()=>requestAnimationFrame(refreshInventoryVisibility));
  window.addEventListener('survival-inventory-changed',refreshInventoryVisibility);
  window.refreshInventoryVisibility=refreshInventoryVisibility;
})();
