(()=>{
  const panel=document.getElementById('inventoryPanel');
  if(!panel||panel.dataset.rpgBuilt==='1')return;
  panel.dataset.rpgBuilt='1';

  const race=(sessionStorage.getItem('survival_character_race')||'Humain').replace('Drakéide','Draconien');
  const raceMeta={
    Humain:{tag:'Polyvalents, équilibrés et résilients',motto:'L’unité fait la force.',icon:'♜'},
    Elfe:{tag:'Élégants, rapides et liés à la nature',motto:'La nature guide mes pas.',icon:'❧'},
    Nain:{tag:'Solides, ingénieux et travailleurs',motto:'Un bon outil vaut mille mots.',icon:'⚒'},
    Orc:{tag:'Brutaux, puissants et instinctifs',motto:'La force parle toujours.',icon:'☠'},
    Draconien:{tag:'Fiers, résistants et imposants',motto:'Le feu coule dans mes veines.',icon:'◆'},
    Gnome:{tag:'Ingénieux, curieux et créatifs',motto:'Une petite idée peut changer le monde.',icon:'⚙'},
    Ogre:{tag:'Massifs, endurants et redoutables',motto:'Plus grand. Plus fort. Toujours plus.',icon:'✦'},
    Lycan:{tag:'Sauvages, agiles et indomptables',motto:'Deux natures, une seule âme.',icon:'☾'}
  };
  const meta=raceMeta[race]||raceMeta.Humain;

  const oldLayout=panel.querySelector('.inventory-layout');
  const equipment=panel.querySelector('.equipment-pane');
  const content=panel.querySelector('.inventory-content');
  const heading=content?.querySelector('h2');
  const tabs=content?.querySelector('.inv-tabs');
  const bag=content?.querySelector('.bag-view');
  const craft=content?.querySelector('.craft-view');
  const close=panel.querySelector('#inventoryClose');
  if(!equipment||!content||!tabs||!bag||!craft||!close)return;

  const style=document.createElement('style');
  style.textContent=`
  body.rpg-inventory-open>.hud,body.rpg-inventory-open>.quickbar,body.rpg-inventory-open>.compass,body.rpg-inventory-open>.topinfo,body.rpg-inventory-open>.minimap,body.rpg-inventory-open>.controls,body.rpg-inventory-open>.action,body.rpg-inventory-open>.view,body.rpg-inventory-open>.inventory-btn,body.rpg-inventory-open>.back{opacity:0!important;pointer-events:none!important}
  #inventoryPanel.rpg-v2{width:min(96vw,1180px)!important;height:min(92vh,760px)!important;right:50%!important;top:50%!important;bottom:auto!important;transform:translate(50%,-50%) scale(.98)!important;padding:0!important;overflow:hidden!important;border:2px solid var(--race,#d5a64b)!important;background:#071018!important;box-shadow:0 0 0 4px #05080a,0 0 0 6px color-mix(in srgb,var(--race,#d5a64b) 55%,#000),0 35px 90px #000e!important}
  #inventoryPanel.rpg-v2.open{transform:translate(50%,-50%) scale(1)!important}
  #inventoryPanel.rpg-v2 .race-head,#inventoryPanel.rpg-v2 .race-foot,#inventoryPanel.rpg-v2>.inventory-layout{display:none!important}
  .rpg-shell{position:absolute;inset:0;display:grid;grid-template-rows:58px minmax(0,1fr) 72px;background:radial-gradient(circle at 40% 20%,color-mix(in srgb,var(--race2,#164d89) 30%,transparent),transparent 42%),linear-gradient(125deg,#06111b 0%,#0b1721 50%,#03070a 100%);color:#eee;font-family:Arial,sans-serif}
  .rpg-shell:before{content:'';position:absolute;inset:8px;border:1px solid color-mix(in srgb,var(--race,#d5a64b) 45%,transparent);pointer-events:none;box-shadow:inset 0 0 28px #000a}
  .rpg-top{z-index:2;display:flex;align-items:center;gap:12px;padding:8px 64px 8px 14px;border-bottom:1px solid color-mix(in srgb,var(--race,#d5a64b) 45%,transparent);background:linear-gradient(90deg,#0a1622ee,#071018dd)}
  .rpg-crest{width:38px;height:38px;display:grid;place-items:center;transform:rotate(45deg);border:1px solid var(--race,#d5a64b);background:linear-gradient(145deg,var(--race2,#164d89),#081018);color:var(--race,#d5a64b);font-size:19px}.rpg-crest span{transform:rotate(-45deg)}
  .rpg-title{font-family:Georgia,serif;color:#f4dfaa;font-size:22px;font-weight:900;letter-spacing:2px}.rpg-title small{display:block;margin-top:2px;font:700 8px Arial,sans-serif;color:#9fb0bb;letter-spacing:1px}
  #inventoryPanel.rpg-v2 .inv-close{z-index:20!important;top:10px!important;right:12px!important;width:40px!important;height:40px!important;padding:0!important;border-radius:2px!important;border:1px solid var(--race,#d5a64b)!important;background:#130d09!important;color:#f7e3ae!important;font-size:20px!important}
  .rpg-main{z-index:2;min-height:0;display:grid;grid-template-columns:190px minmax(260px,32%) minmax(0,1fr);gap:8px;padding:8px 10px}
  .rpg-panel{min-width:0;min-height:0;border:1px solid color-mix(in srgb,var(--race,#d5a64b) 40%,#26313a);background:linear-gradient(180deg,#0b1720e8,#050b0fe8);box-shadow:inset 0 0 24px #000a}
  .rpg-stats{padding:12px}.rpg-side-title{margin:0 0 10px;color:#f1dba5;font:900 13px Georgia,serif;letter-spacing:1px}.rpg-race-card{padding:10px 8px 12px;margin-bottom:12px;border-bottom:1px solid #ffffff14}.rpg-race-card strong{display:block;color:#f4dfaa;font:900 20px Georgia,serif;letter-spacing:1.5px}.rpg-race-card span{display:block;margin-top:4px;color:#a9b6bd;font:italic 10px Georgia,serif;line-height:1.3}
  .rpg-stat{margin:9px 0}.rpg-stat-line{display:flex;justify-content:space-between;gap:8px;font-size:9px;color:#d8dfe2}.rpg-stat-line b{color:#f2dca6}.rpg-stat-track{height:5px;margin-top:4px;background:#020507;border:1px solid #ffffff16;overflow:hidden}.rpg-stat-fill{height:100%;width:0;background:linear-gradient(90deg,var(--race2,#164d89),var(--race,#d5a64b));transition:width .2s}
  .rpg-center{position:relative;overflow:hidden;background:radial-gradient(circle at 50% 48%,color-mix(in srgb,var(--race2,#164d89) 35%,transparent),transparent 58%),linear-gradient(180deg,#0a1620,#04090d)}
  .rpg-center-title{position:absolute;left:12px;top:10px;color:#f2dca5;font:900 14px Georgia,serif;letter-spacing:1px}.rpg-avatar{position:absolute;left:50%;top:50%;transform:translate(-50%,-46%);width:116px;height:260px;filter:drop-shadow(0 12px 12px #0009)}
  .rpg-avatar .head{position:absolute;left:39px;top:0;width:38px;height:44px;border-radius:50%;background:#9b6546;border:2px solid #d1a478}.rpg-avatar .torso{position:absolute;left:25px;top:42px;width:66px;height:100px;border-radius:22px 22px 12px 12px;background:linear-gradient(180deg,var(--race2,#164d89),#1e2530);border:2px solid var(--race,#d5a64b);box-shadow:inset 0 0 0 4px #111a22}.rpg-avatar .arm{position:absolute;top:50px;width:24px;height:112px;border-radius:14px;background:#77452e;border:2px solid #b98967}.rpg-avatar .arm.l{left:4px;transform:rotate(6deg)}.rpg-avatar .arm.r{right:4px;transform:rotate(-6deg)}.rpg-avatar .leg{position:absolute;top:134px;width:29px;height:118px;border-radius:8px 8px 14px 14px;background:#292b2d;border:2px solid #555}.rpg-avatar .leg.l{left:27px}.rpg-avatar .leg.r{right:27px}
  .rpg-slot{position:absolute;width:70px;height:60px;padding:6px;border:1px solid color-mix(in srgb,var(--race,#d5a64b) 48%,#333);background:#050b0fd9;text-align:center;color:#899aa4;font-size:7px;box-shadow:inset 0 0 12px #000}.rpg-slot b{display:block;margin-top:6px;color:#f1d797;font-size:9px}.rpg-slot.head{left:50%;top:44px;transform:translateX(-50%)}.rpg-slot.chest{left:12px;top:142px}.rpg-slot.hand{right:12px;top:142px}.rpg-slot.legs{left:50%;bottom:18px;transform:translateX(-50%)}
  .rpg-inventory{display:flex;flex-direction:column;padding:10px;overflow:hidden}.rpg-inventory-head{display:flex;align-items:center;justify-content:space-between;gap:10px;padding-bottom:7px;border-bottom:1px solid #ffffff14}.rpg-inventory-head h2{margin:0!important;color:#f4dfaa!important;font:900 22px Georgia,serif!important;letter-spacing:1.5px}.rpg-inventory .inv-tabs{margin:0!important;width:210px}.rpg-inventory .inv-tab{padding:7px 6px!important;border-radius:2px!important}.rpg-content{min-height:0;flex:1;overflow:auto;padding-top:8px}.rpg-content .bag-view{display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:5px!important;align-content:start}.rpg-content .bag-view.hidden{display:none!important}.rpg-content .bar-editor{display:none!important}.rpg-content .inv-row,.rpg-content .tool-row{display:flex!important;min-height:64px!important;margin:0!important;padding:7px!important;flex-direction:column!important;justify-content:center!important;align-items:center!important;gap:4px!important;border:1px solid #38444d!important;background:#071016e8!important;text-align:center;position:relative}.rpg-content .inv-row[hidden],.rpg-content .tool-row[hidden]{display:none!important}.rpg-content .inv-row b,.rpg-content .tool-row b{font-size:14px!important}.rpg-content .inv-actions{display:flex!important;width:100%;gap:3px!important}.rpg-content .inv-action{flex:1;padding:4px 2px!important;font-size:5px!important}.rpg-content .craft-view.active{display:block!important}.rpg-content .craft-card{margin:6px 0!important;border-radius:2px!important}.rpg-content .bag-empty{grid-column:1/-1!important;min-height:140px!important}.rpg-hotbar{z-index:2;margin:0 10px 10px;border:1px solid color-mix(in srgb,var(--race,#d5a64b) 42%,#333);background:#050b0ee8;padding:7px}.rpg-hotbar-title{margin-bottom:5px;color:#d8bb75;font-size:8px;font-weight:900;letter-spacing:1px}.rpg-hotbar .bar-editor{margin:0!important;padding:0!important;border:0!important;background:transparent!important}.rpg-hotbar .bar-editor-title{display:none!important}.rpg-hotbar .bar-editor-grid{display:grid!important;grid-template-columns:repeat(8,minmax(0,1fr))!important;gap:4px!important}.rpg-hotbar .bar-edit-slot{height:48px!important;border-radius:2px!important;background:#101a21!important}.rpg-motto{position:absolute;right:16px;bottom:6px;color:#947d50;font:italic 9px Georgia,serif;pointer-events:none}
  @media(max-width:760px){#inventoryPanel.rpg-v2{height:min(91vh,760px)!important;width:97vw!important}.rpg-shell{grid-template-rows:52px minmax(0,1fr) 64px}.rpg-top{padding-left:10px}.rpg-title{font-size:17px}.rpg-main{grid-template-columns:35% 65%;grid-template-rows:238px minmax(0,1fr);gap:5px;padding:6px}.rpg-stats{grid-column:1;grid-row:1;padding:7px}.rpg-race-card{padding:5px 3px 7px;margin-bottom:6px}.rpg-race-card strong{font-size:14px}.rpg-race-card span{font-size:7px}.rpg-stat{margin:5px 0}.rpg-stat-line{font-size:7px}.rpg-center{grid-column:2;grid-row:1}.rpg-inventory{grid-column:1/-1;grid-row:2;padding:7px}.rpg-center-title{font-size:11px}.rpg-avatar{transform:translate(-50%,-44%) scale(.68)}.rpg-slot{width:52px;height:43px;padding:4px;font-size:5px}.rpg-slot b{font-size:7px;margin-top:3px}.rpg-slot.head{top:30px}.rpg-slot.chest{left:6px;top:104px}.rpg-slot.hand{right:6px;top:104px}.rpg-slot.legs{bottom:7px}.rpg-inventory-head h2{font-size:16px!important}.rpg-inventory .inv-tabs{width:150px}.rpg-inventory .inv-tab{font-size:7px!important;padding:6px 3px!important}.rpg-content .bag-view{grid-template-columns:repeat(4,minmax(0,1fr))!important;gap:3px!important}.rpg-content .inv-row,.rpg-content .tool-row{min-height:54px!important;padding:4px!important;font-size:7px!important}.rpg-hotbar{margin:0 6px 6px;padding:5px}.rpg-hotbar .bar-editor-grid{gap:2px!important}.rpg-hotbar .bar-edit-slot{height:38px!important}.rpg-hotbar .bar-edit-slot .bar-icon{font-size:12px!important;line-height:16px!important}.rpg-hotbar .bar-edit-slot .bar-name{font-size:4px!important}.rpg-motto{display:none}}
  `;
  document.head.appendChild(style);

  const shell=document.createElement('div');shell.className='rpg-shell';
  const top=document.createElement('header');top.className='rpg-top';top.innerHTML=`<div class="rpg-crest"><span>${meta.icon}</span></div><div class="rpg-title">${race.toUpperCase()}<small>${meta.tag}</small></div>`;
  const main=document.createElement('main');main.className='rpg-main';
  const stats=document.createElement('aside');stats.className='rpg-panel rpg-stats';stats.innerHTML=`<div class="rpg-race-card"><strong>${race.toUpperCase()}</strong><span>${meta.tag}</span></div><h3 class="rpg-side-title">CARACTÉRISTIQUES</h3><div id="rpgStats"></div>`;
  const center=document.createElement('section');center.className='rpg-panel rpg-center';center.innerHTML=`<div class="rpg-center-title">ÉQUIPEMENT</div><div class="rpg-slot head">TÊTE<b>—</b></div><div class="rpg-slot chest">TORSE<b>—</b></div><div class="rpg-slot hand">MAIN<b id="rpgHand">Vide</b></div><div class="rpg-slot legs">JAMBES<b>—</b></div><div class="rpg-avatar"><div class="head"></div><div class="torso"></div><div class="arm l"></div><div class="arm r"></div><div class="leg l"></div><div class="leg r"></div></div>`;
  const inv=document.createElement('section');inv.className='rpg-panel rpg-inventory';
  const invHead=document.createElement('div');invHead.className='rpg-inventory-head';if(heading)heading.textContent='INVENTAIRE';invHead.append(heading,tabs);
  const invContent=document.createElement('div');invContent.className='rpg-content';invContent.append(bag,craft);inv.append(invHead,invContent);
  main.append(stats,center,inv);
  const hot=document.createElement('footer');hot.className='rpg-hotbar';hot.innerHTML='<div class="rpg-hotbar-title">ACCÈS RAPIDE</div>';
  const bar=bag.querySelector('.bar-editor');if(bar)hot.appendChild(bar);
  const motto=document.createElement('div');motto.className='rpg-motto';motto.textContent='« '+meta.motto+' »';
  shell.append(top,main,hot,motto);
  panel.appendChild(shell);
  if(oldLayout)oldLayout.remove();
  panel.classList.add('rpg-v2');

  const statDefs=[['Vie','life','lifeFill'],['Énergie','energy','energyFill'],['Faim','hunger','hungerFill'],['Soif','thirst','thirstFill']];
  const statsHost=stats.querySelector('#rpgStats');
  const updateStats=()=>{statsHost.innerHTML='';statDefs.forEach(([label,valId,fillId])=>{const value=document.getElementById(valId)?.textContent||'--';const width=document.getElementById(fillId)?.style.width||((Number(value)||0)+'%');const row=document.createElement('div');row.className='rpg-stat';row.innerHTML=`<div class="rpg-stat-line"><span>${label}</span><b>${value}</b></div><div class="rpg-stat-track"><div class="rpg-stat-fill" style="width:${width}"></div></div>`;statsHost.appendChild(row)});const hand=document.getElementById('equipHandValue')?.textContent||'Vide';const rpgHand=document.getElementById('rpgHand');if(rpgHand)rpgHand.textContent=hand};
  updateStats();setInterval(updateStats,700);

  const syncOpen=()=>document.body.classList.toggle('rpg-inventory-open',panel.classList.contains('open'));
  new MutationObserver(syncOpen).observe(panel,{attributes:true,attributeFilter:['class']});syncOpen();
  window.refreshQuickbarOrganizer?.();window.refreshInventoryManagement?.();window.refreshCraftInventory?.();
})();