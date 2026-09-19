/* R226 — loader visual progresivo para Google OAuth.
   No modifica autenticación ni sesión; si falla, el flujo de acceso sigue funcionando. */
(() => {
  'use strict';

  let overlay=null;
  let safetyTimer=null;

  function oauthReturnPending(){
    try{
      const url=new URL(location.href);
      return url.searchParams.has('code') ||
        /(?:[#&](?:access_token|refresh_token|provider_token|type)=)/i.test(location.href);
    }catch{return false}
  }

  function ensureOverlay(){
    if(overlay?.isConnected)return overlay;
    const node=document.createElement('div');
    node.id='fsAuthLoading';
    node.className='fs-auth-loading';
    node.hidden=true;
    node.setAttribute('role','status');
    node.setAttribute('aria-live','polite');
    node.innerHTML=`
      <div class="fs-auth-loading-card">
        <div class="fs-auth-loading-mark" aria-hidden="true">
          <img class="fs-auth-loading-logo" src="/v2/assets/brand/icon-192.png" alt="" width="138" height="138" decoding="async">
        </div>
        <div class="fs-auth-loading-title">FRENCH STORE</div>
        <p id="fsAuthLoadingCopy" class="fs-auth-loading-copy">Conectando con Google…</p>
        <span class="fs-auth-loading-dots" aria-hidden="true"><i></i><i></i><i></i></span>
      </div>`;
    document.body.appendChild(node);
    overlay=node;
    return node;
  }

  function show(copy='Conectando con Google…'){
    try{
      const node=ensureOverlay();
      node.classList.remove('is-leaving');
      node.hidden=false;
      const label=document.getElementById('fsAuthLoadingCopy');
      if(label)label.textContent=copy;
      clearTimeout(safetyTimer);
      safetyTimer=setTimeout(()=>hide(),12000);
    }catch{}
  }

  function hide(){
    try{
      if(!overlay)return;
      clearTimeout(safetyTimer);
      overlay.classList.add('is-leaving');
      setTimeout(()=>{
        if(!overlay)return;
        overlay.hidden=true;
        overlay.classList.remove('is-leaving');
      },230);
    }catch{}
  }

  async function waitForReturnedSession(){
    if(!oauthReturnPending())return;
    show('Finalizando tu inicio de sesión…');
    for(let i=0;i<45;i+=1){
      try{
        if(typeof sb!=='undefined'&&sb?.auth){
          const {data}=await sb.auth.getSession();
          if(data?.session){hide();return}
        }
      }catch{}
      await new Promise(resolve=>setTimeout(resolve,160));
    }
    hide();
  }

  function install(){
    document.addEventListener('click',(event)=>{
      const button=event.target?.closest?.('#authChoiceGoogle');
      if(button&&!button.disabled)show('Conectando con Google…');
    },true);

    const message=document.getElementById('loginMessage');
    if(message){
      new MutationObserver(()=>{
        if(!message.classList.contains('hidden')&&message.textContent.trim())hide();
      }).observe(message,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});
    }

    window.addEventListener('pageshow',()=>{
      if(!oauthReturnPending())hide();
    });

    waitForReturnedSession().catch(()=>hide());
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});
  else install();
})();
