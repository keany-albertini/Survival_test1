(()=>{
  const panel=document.getElementById('inventoryPanel');
  if(!panel)return;
  let tries=0;
  const init=()=>{
    const shell=panel.querySelector('.rpg-shell');
    if(!shell){if(tries++<80)setTimeout(init,50);return}
    if(panel.dataset.modernUi==='1')return;
    panel.dataset.modernUi='1';
    panel.classList.add('modern-ui');

    const stats=[...panel.querySelectorAll('.rpg-stat')];
    const icons=['♥','⚡','●','◆'];
    stats.forEach((el,i)=>el.dataset.icon=icons[i]||'✦');

    const content=panel.querySelector('.rpg-content');
    const bag=panel.querySelector('.bag-view');
    if(content&&bag){
      const ghosts=document.createElement('div');
      ghosts.className='modern-empty-grid';
      ghosts.innerHTML=Array.from({length:12},()=>'<div class="modern-empty-slot"></div>').join('');
      content.appendChild(ghosts);
      const note=document.createElement('div');
      note.className='modern-empty-note';
      note.textContent='Ton sac est vide';
      content.appendChild(note);
      const syncEmpty=()=>{
        const rows=[...bag.querySelectorAll('.inv-row,.tool-row')];
        const hasVisible=rows.some(r=>!r.hidden&&getComputedStyle(r).display!=='none');
        ghosts.style.display=hasVisible?'none':'grid';
        note.style.display=hasVisible?'none':'block';
      };
      new MutationObserver(syncEmpty).observe(bag,{subtree:true,childList:true,attributes:true,characterData:true});
      syncEmpty();

      bag.addEventListener('click',e=>{
        const row=e.target.closest('.inv-row,.tool-row');
        if(!row)return;
        bag.querySelectorAll('.modern-selected').forEach(x=>x!==row&&x.classList.remove('modern-selected'));
        row.classList.toggle('modern-selected');
      });
    }

    panel.querySelectorAll('.inv-tab').forEach(tab=>tab.addEventListener('click',()=>{
      panel.querySelectorAll('.modern-selected').forEach(x=>x.classList.remove('modern-selected'));
      const content=panel.querySelector('.rpg-content');
      if(content){content.animate([{opacity:.55,transform:'translateY(4px)'},{opacity:1,transform:'translateY(0)'}],{duration:180,easing:'ease-out'});}
    }));

    const openBtn=document.getElementById('inventoryBtn');
    openBtn?.addEventListener('click',()=>{
      panel.classList.remove('modern-pop');
      void panel.offsetWidth;
      panel.classList.add('modern-pop');
    });

    panel.querySelectorAll('.rpg-slot').forEach(slot=>slot.addEventListener('click',()=>{
      slot.animate([{boxShadow:'0 0 0 rgba(226,185,95,0)'},{boxShadow:'0 0 18px rgba(226,185,95,.45)'},{boxShadow:'0 0 0 rgba(226,185,95,0)'}],{duration:320});
    }));
  };
  init();
})();