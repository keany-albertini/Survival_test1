(()=>{
  const panel=document.getElementById('inventoryPanel');
  if(!panel)return;
  function hideUnownedTools(){
    ['rowAxe','rowPickaxe'].forEach(id=>{
      const row=document.getElementById(id);
      if(!row)return;
      const qty=Number(row.querySelector('b')?.textContent||0);
      row.style.display=qty>0?'':'none';
    });
  }
  new MutationObserver(hideUnownedTools).observe(panel,{subtree:true,childList:true,characterData:true,attributes:true});
  document.getElementById('inventoryBtn')?.addEventListener('click',()=>requestAnimationFrame(hideUnownedTools));
  hideUnownedTools();
})();