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

  const observer=new MutationObserver(refreshInventoryVisibility);
  observer.observe(panel,{subtree:true,childList:true,characterData:true});

  document.getElementById('inventoryBtn')?.addEventListener('click',()=>{
    requestAnimationFrame(refreshInventoryVisibility);
  });

  refreshInventoryVisibility();
  window.refreshInventoryVisibility=refreshInventoryVisibility;
})();
