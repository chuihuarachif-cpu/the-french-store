/* R172 — safe cart recovery.
   Stores only product IDs/quantities already used by the core cart; never player/account credentials. */
(() => {
  'use strict';

  const STORAGE_KEY='fs_cart_v2';
  const $=id=>document.getElementById(id);
  let observer=null;

  function readCart(){
    try{
      const raw=JSON.parse(localStorage.getItem(STORAGE_KEY)||'[]');
      return Array.isArray(raw)?raw.filter(item=>Number(item?.product_id)>0&&Number(item?.quantity)>0):[];
    }catch{return[]}
  }

  function countItems(items){return items.reduce((sum,item)=>sum+Math.min(99,Math.max(0,Number(item.quantity)||0)),0)}

  function ensureBanner(){
    let banner=$('fsCartRecovery');
    if(banner)return banner;
    const home=$('view-inicio');
    const hero=home?.querySelector('.hero');
    if(!home||!hero)return null;
    banner=document.createElement('section');
    banner.id='fsCartRecovery';
    banner.className='fs-cart-recovery';
    banner.hidden=true;
    banner.innerHTML=`
      <div class="fs-cart-recovery-copy">
        <b id="fsCartRecoveryTitle">Tienes una compra pendiente</b>
        <small id="fsCartRecoveryText">Tu carrito sigue guardado en este dispositivo.</small>
      </div>
      <div class="fs-cart-recovery-actions">
        <button id="fsCartRecoveryContinue" type="button" class="primary-btn">Continuar compra</button>
        <button id="fsCartRecoveryDiscard" type="button" class="secondary-btn">Descartar</button>
      </div>`;
    hero.insertAdjacentElement('afterend',banner);

    $('fsCartRecoveryContinue')?.addEventListener('click',()=>{
      try{window.FSFeatureLoader?.ensure?.('checkout').catch(()=>{});}catch{}
      if(typeof openModal==='function')openModal('cartModal');
      else $('cartButton')?.click();
    });
    $('fsCartRecoveryDiscard')?.addEventListener('click',()=>{
      try{
        cart=[];
        saveCart();
        renderCart();
      }catch{
        localStorage.removeItem(STORAGE_KEY);
      }
      render();
    });
    return banner;
  }

  function render(){
    const banner=ensureBanner();
    if(!banner)return;
    const items=readCart();
    const count=countItems(items);
    banner.hidden=count<=0;
    if(count<=0)return;
    const title=$('fsCartRecoveryTitle');
    const copy=$('fsCartRecoveryText');
    if(title)title.textContent=`Tienes ${count} producto${count===1?'':'s'} pendiente${count===1?'':'s'}`;
    if(copy)copy.textContent='Tu carrito quedó guardado en este dispositivo. Puedes continuar cuando quieras.';
  }

  function watch(){
    const counter=$('cartCount');
    if(counter){
      observer=new MutationObserver(render);
      observer.observe(counter,{childList:true,characterData:true,subtree:true});
    }
    window.addEventListener('storage',event=>{if(event.key===STORAGE_KEY)render();});
    document.addEventListener('fs:catalog-updated',render);
    render();
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',watch,{once:true});else watch();
})();