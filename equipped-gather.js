(()=>{
  const characterId=sessionStorage.getItem('survival_character_id')||'guest';
  const equippedKey='survival_equipped_'+characterId;
  const gatherBtn=document.getElementById('gatherBtn');
  const toast=document.getElementById('toast');
  if(!gatherBtn)return;

  const equipped=()=>localStorage.getItem(equippedKey)||'';
  const showToast=text=>{
    if(!toast)return;
    toast.textContent=text;
    toast.classList.add('show');
    clearTimeout(window.__equippedGatherToast);
    window.__equippedGatherToast=setTimeout(()=>toast.classList.remove('show'),1300);
  };

  const requiredToolFromLabel=()=>{
    const text=(gatherBtn.textContent||'').toUpperCase();
    if(text.includes('BOIS')||text.includes('HACHE'))return 'axe';
    if(text.includes('PIERRE')||text.includes('PIOCHE'))return 'pickaxe';
    return '';
  };

  gatherBtn.addEventListener('click',e=>{
    const required=requiredToolFromLabel();
    if(!required)return;
    const tool=equipped();
    if(tool!==required){
      e.preventDefault();
      e.stopImmediatePropagation();
      showToast(required==='axe'?'Équipe la hache pour couper cet arbre':'Équipe la pioche pour casser ce rocher');
    }
  },true);
})();