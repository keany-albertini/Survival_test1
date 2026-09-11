(()=>{
  const panel=document.getElementById('inventoryPanel');
  if(!panel)return;
  const characterId=sessionStorage.getItem('survival_character_id')||'guest';
  const inventoryKey='survival_inventory_'+characterId;
  const equippedKey='survival_equipped_'+characterId;
  const quickbarKey='survival_quickbar_'+characterId;
  const defs={
    axe:{label:'Hache',icon:'🪓'},
    pickaxe:{label:'Pioche',icon:'⛏️'},
    shovel:{label:'Pelle',icon:'🛠️'}
  };
  const readInv=()=>{try{return JSON.parse(localStorage.getItem(inventoryKey)||'{}')}catch{return {}}};
  const readBar=()=>{try{const q=JSON.parse(localStorage.getItem(quickbarKey)||'[]');return Array.from({length:8},(_,i)=>q[i]||'')}catch{return Array(8).fill('')}};
  const saveBar=q=>localStorage.setItem(quickbarKey,JSON.stringify(q));
  const showToast=text=>{const el=document.getElementById('toast');if(!el)return;el.textContent=text;el.classList.add('show');clearTimeout(window.__barOrgToast);window.__barOrgToast=setTimeout(()=>el.classList.remove('show'),1300)};

  const style=document.createElement('style');
  style.textContent=`
    .bar-editor{margin:0 0 12px;padding:10px;border:1px solid #ffffff18;border-radius:11px;background:#09151bcc}
    .bar-editor-title{display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;color:#f0d28e;font-size:9px;font-weight:900}
    .bar-editor-title small{color:#96a8ad;font-size:7px;font-weight:700}
    .bar-editor-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:5px}
    .bar-edit-slot{position:relative;min-width:0;height:48px;border:1px solid #ffffff25;border-radius:7px;background:#152027;color:#fff;padding:4px 3px 3px;text-align:center}
    .bar-edit-slot.selected{border-color:#f0cf75;box-shadow:0 0 0 1px #f0cf7555 inset;background:#313326}
    .bar-edit-slot.target{border-color:#80c98a;box-shadow:0 0 0 1px #80c98a55 inset}
    .bar-edit-slot .bar-num{position:absolute;left:3px;top:2px;color:#ffffff66;font-size:7px}
    .bar-edit-slot .bar-icon{font-size:17px;line-height:23px;display:block}
    .bar-edit-slot .bar-name{display:block;font-size:6px;font-weight:900;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .bar-edit-slot.empty .bar-name{color:#ffffff45}
    .bar-remove{position:absolute;right:2px;top:2px;width:15px;height:15px;padding:0;border:0;border-radius:50%;background:#702f2fd9;color:#fff;font-size:9px;line-height:15px}
    .equip-btn.bar-placing{background:#5a6332;border-color:#e7cf7a;color:#fff4b8}
    @media(max-width:520px){.bar-editor-grid{grid-template-columns:repeat(4,1fr)}.bar-edit-slot{height:45px}}
  `;
  document.head.appendChild(style);

  const bag=panel.querySelector('.bag-view');
  if(!bag)return;
  const editor=document.createElement('div');
  editor.className='bar-editor';
  editor.innerHTML='<div class="bar-editor-title"><span>BARRE D’ÉQUIPEMENT</span><small id="barEditHint">Touchez une case pour la déplacer</small></div><div class="bar-editor-grid" id="barEditorGrid"></div>';
  bag.insertBefore(editor,bag.firstChild);
  const grid=editor.querySelector('#barEditorGrid');
  const hint=editor.querySelector('#barEditHint');
  let selected=-1,pendingTool='';

  function validItem(item){const inv=readInv();return item&&defs[item]&&(inv[item]||0)>0}
  function cleanBar(q){let changed=false;for(let i=0;i<q.length;i++){if(q[i]&&!validItem(q[i])){q[i]='';changed=true}}if(changed)saveBar(q);return q}
  function sync(){window.refreshCraftInventory?.();window.refreshGroundInventory?.()}
  function render(){
    const q=cleanBar(readBar());
    grid.innerHTML='';
    q.forEach((item,i)=>{
      const b=document.createElement('button');b.type='button';b.className='bar-edit-slot'+(item?'':' empty')+(selected===i?' selected':'')+(pendingTool?' target':'');b.dataset.index=i;
      b.innerHTML=`<span class="bar-num">${i+1}</span>${item?`<span class="bar-icon">${defs[item].icon}</span><span class="bar-name">${defs[item].label}</span><span class="bar-remove" data-remove="${i}">×</span>`:'<span class="bar-icon">＋</span><span class="bar-name">VIDE</span>'}`;
      grid.appendChild(b)
    });
    hint.textContent=pendingTool?`Choisis la case pour ${defs[pendingTool]?.label||'l’objet'}`:selected>=0?'Choisis une autre case pour échanger':'Touchez une case pour la déplacer';
    bag.querySelectorAll('.equip-btn').forEach(btn=>btn.classList.toggle('bar-placing',btn.dataset.tool===pendingTool));
  }

  grid.addEventListener('click',e=>{
    const rem=e.target.closest('.bar-remove');
    if(rem){
      e.preventDefault();e.stopPropagation();
      const i=Number(rem.dataset.remove),q=readBar(),item=q[i];q[i]='';saveBar(q);
      if(item&&localStorage.getItem(equippedKey)===item&&!q.includes(item))localStorage.setItem(equippedKey,'');
      selected=-1;pendingTool='';sync();render();showToast('Objet retiré de la barre');return
    }
    const slot=e.target.closest('.bar-edit-slot');if(!slot)return;
    const i=Number(slot.dataset.index),q=readBar();
    if(pendingTool){
      const old=q.findIndex(x=>x===pendingTool);
      if(old>=0)q[old]='';
      q[i]=pendingTool;saveBar(q);localStorage.setItem(equippedKey,pendingTool);
      showToast((defs[pendingTool]?.label||'Objet')+' placé en case '+(i+1));
      pendingTool='';selected=-1;sync();render();return
    }
    if(selected<0){
      if(!q[i])return;
      selected=i;render();return
    }
    if(selected===i){selected=-1;render();return}
    const tmp=q[selected];q[selected]=q[i];q[i]=tmp;saveBar(q);showToast('Cases '+(selected+1)+' et '+(i+1)+' échangées');selected=-1;sync();render()
  });

  bag.addEventListener('click',e=>{
    const btn=e.target.closest('.equip-btn');if(!btn)return;
    const tool=btn.dataset.tool;if(!validItem(tool))return;
    e.preventDefault();e.stopImmediatePropagation();
    pendingTool=tool;selected=-1;render();showToast('Choisis une case de la barre')
  },true);

  document.getElementById('inventoryBtn')?.addEventListener('click',()=>requestAnimationFrame(render));
  window.refreshQuickbarOrganizer=render;
  render();
})();