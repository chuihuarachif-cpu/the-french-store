/* THE FRENCH STORE — R7 hotfix layered over R6 */
(() => {
  'use strict';

  const KNOWN = {
    leagueoflegends:'LOL', valorant:'VAL', netflix:'NETFLIX', disneypremium:'DISNEY+',
    crunchyroll:'CR', hbomax:'MAX', primevideo:'PRIME', spotify:'SPOTIFY',
    vixplus:'ViX', flujotv:'FLUJO', magistvpro:'MAGIS', marvelrivals:'MARVEL'
  };

  function svgBadge(name){
    const key=normalize(name), label=(KNOWN[key]||String(name||'?')).slice(0,12);
    const safe=label.replace(/[&<>\"]/g,'');
    const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#0b2537"/><stop offset="1" stop-color="#071019"/></linearGradient></defs><rect width="256" height="256" rx="48" fill="url(#g)"/><rect x="7" y="7" width="242" height="242" rx="42" fill="none" stroke="#39d9ef" stroke-opacity=".45" stroke-width="5"/><text x="128" y="136" text-anchor="middle" dominant-baseline="middle" fill="#f5fbff" font-family="Arial,sans-serif" font-weight="800" font-size="${safe.length>7?28:38}">${safe}</text><circle cx="205" cy="48" r="13" fill="#54e8fa" fill-opacity=".75"/></svg>`;
    return 'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg);
  }

  const baseLogo = logoUrl;
  logoUrl = function(name){
    const found=baseLogo(name);
    if(found) return found;
    return svgBadge(name);
  };

  if(typeof LABELS==='object') LABELS.CANCELLED='Cancelado';

  async function cancelOrderR7(id,code){
    if(!confirm(`¿Cancelar el pedido ${code}? Solo puedes hacerlo mientras siga pendiente de pago.`)) return;
    const {error}=await sb.rpc('cancel_my_order',{p_order_id:id});
    if(error){
      const msg=error.message==='ORDER_CANNOT_BE_CANCELLED'
        ? 'Este pedido ya cambió de estado y ya no puede cancelarse desde el cliente.'
        : error.message;
      alert(msg); return;
    }
    await loadOrders();
  }

  loadOrders = async function(){
    if(!session) return;
    const {data,error}=await sb.from('orders')
      .select('id,order_code,status,payment_method,total_amount,currency,created_at,updated_at,customer_note')
      .eq('user_id',session.user.id).order('created_at',{ascending:false}).limit(50);
    if(error){$('ordersList').innerHTML=`<div class="notice error">${esc(error.message)}</div>`;return;}
    $('ordersList').innerHTML=(data||[]).map(o=>`<article class="record r7-order"><div class="r7-order-top"><div><b>${esc(o.order_code)}</b><small>${dateFmt(o.created_at)}</small></div>${statusHtml(o.status)}</div><div class="r7-order-meta"><strong>${money(o.total_amount)}</strong><span>${esc(o.payment_method)}</span></div>${o.status==='PENDING_PAYMENT'?`<button class="r7-cancel-order" type="button" data-cancel-order="${o.id}" data-code="${esc(o.order_code)}">Cancelar pedido</button>`:''}</article>`).join('')||'<div class="record"><small>Aún no tienes pedidos.</small></div>';
    $('ordersList').querySelectorAll('[data-cancel-order]').forEach(b=>b.onclick=()=>cancelOrderR7(b.dataset.cancelOrder,b.dataset.code));
  };

  /* R32 startup diagnostics/resilience.
     R6 replaces the base render functions before this file runs. Wrap those
     active functions so one bad render stage cannot abort loadProducts() and
     leave the rest of the storefront permanently empty. */
  const startupDiag = window.FSStartupDiagnostics ||= {
    version:'R32', startedAt:Date.now(), stages:[], errors:[], lastStage:null,
    inventoryLen:null, completed:false
  };

  function pushStage(stage,status,error=null){
    const entry={stage,status,at:Date.now()};
    startupDiag.lastStage=stage;
    try { startupDiag.inventoryLen=typeof inventory!=='undefined'?inventory.length:null; } catch {}
    if(error){
      entry.message=String(error?.message||error||'Error desconocido').slice(0,300);
      entry.name=String(error?.name||'Error').slice(0,80);
      startupDiag.errors.push(entry);
      if(startupDiag.errors.length>20) startupDiag.errors.splice(0,startupDiag.errors.length-20);
    }
    startupDiag.stages.push(entry);
    if(startupDiag.stages.length>60) startupDiag.stages.splice(0,startupDiag.stages.length-60);
    document.documentElement.dataset.fsStartupStage=`${stage}:${status}`;
    window.dispatchEvent(new CustomEvent(error?'fs:startup-error':'fs:startup-stage',{detail:entry}));
  }

  function safeStageFallback(name){
    if(name==='renderFeatured'){
      const box=$('featuredList');
      if(box && !box.children.length) box.innerHTML='<div class="notice error"><b>No se pudieron mostrar los destacados.</b><br>Abre “Tienda” para ver el catálogo completo o pulsa Reintentar.</div>';
    }
    if(name==='renderCatalog'){
      const box=$('catalogList');
      if(box && !box.children.length) box.innerHTML='<div class="notice error"><b>No se pudo mostrar esta parte del catálogo.</b><br>Puedes cambiar de categoría o reintentar.</div>';
    }
  }

  function wrapStartupRender(name){
    const original=window[name];
    if(typeof original!=='function' || original.__fsR32Wrapped) return;
    const wrapped=function(...args){
      pushStage(name,'start');
      try{
        const result=original.apply(this,args);
        pushStage(name,'ok');
        if(name==='renderFeatured'){
          const featured=$('featuredList');
          if(featured?.children?.length) startupDiag.featuredRendered=true;
        }
        if(name==='renderCatalog'){
          const catalog=$('catalogList');
          if(catalog?.children?.length) startupDiag.catalogRendered=true;
        }
        if(startupDiag.featuredRendered && startupDiag.catalogRendered){
          startupDiag.completed=true;
          window.dispatchEvent(new CustomEvent('fs:startup-complete',{detail:{at:Date.now(),inventoryLen:startupDiag.inventoryLen}}));
        }
        return result;
      }catch(error){
        pushStage(name,'error',error);
        console.error(`[FRENCH STORE R32] ${name} falló`,error);
        safeStageFallback(name);
        return undefined;
      }
    };
    wrapped.__fsR32Wrapped=true;
    wrapped.__fsR32Original=original;
    window[name]=wrapped;
  }

  ['renderCategoryTabs','renderCatalog','renderFeatured','renderCart'].forEach(wrapStartupRender);
  window.FSR32Startup={
    diagnostics:()=>JSON.parse(JSON.stringify(startupDiag)),
    rewrap:()=>['renderCategoryTabs','renderCatalog','renderFeatured','renderCart'].forEach(wrapStartupRender)
  };

  function upgradeDetails(){
    const detail=document.querySelector('.r6-game-detail');
    if(!detail || detail.dataset.r7Upgraded) return;
    detail.dataset.r7Upgraded='1';
    const hero=detail.querySelector('.r6-hero');
    if(!hero) return;
    const stage=document.createElement('div');
    stage.className='r7-motion-stage';
    stage.innerHTML='<span class="r7-light a"></span><span class="r7-light b"></span><span class="r7-scan"></span>';
    hero.append(stage);
  }

  const obs=new MutationObserver(upgradeDetails);
  document.addEventListener('DOMContentLoaded',()=>{
    const target=$('catalogList');
    if(target) obs.observe(target,{childList:true,subtree:true});
    $('refreshOrders').onclick=loadOrders;
    upgradeDetails();
  },{once:true});
})();