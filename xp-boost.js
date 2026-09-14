(()=>{
  let tries=0;
  function install(){
    const base=window.addSurvivalXP;
    if(typeof base!=='function'){if(tries++<100)setTimeout(install,100);return}
    if(base.__xpBoosted)return;
    const boosted=(amount,reason='')=>base(Math.max(1,Math.round(Number(amount||0)*2)),reason);
    boosted.__xpBoosted=true;
    window.addSurvivalXP=boosted;
  }
  install();
})();
