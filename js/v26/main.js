window.dispatchEvent(new CustomEvent("survival-loading",{
  detail:{percent:12,label:"Chargement du moteur de survie"}
}));

try{
  await import("../v20/main.js?v=265");
}catch(err){
  console.error("V26 base engine failed to start",err);
  window.dispatchEvent(new CustomEvent("survival-loading",{
    detail:{percent:100,label:"Erreur moteur · rechargement conseillé"}
  }));
  window.dispatchEvent(new CustomEvent("survival-fatal",{
    detail:{message:String(err?.message||err)}
  }));
}
