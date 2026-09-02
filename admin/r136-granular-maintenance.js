/* THE FRENCH STORE — R136 granular maintenance inside the main Admin panel.
   Visual/admin convenience only: uses the existing protected admin_app_* RPCs.
   No service-role key, provider credential or direct product-table write is present here. */
(() => {
  'use strict';

  const SUPABASE_URL='https://jivaaripugjdpxjvjnsu.supabase.co';
  const SUPABASE_ANON_KEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYXNlIiwicmVmIjoiaml2YWFyaXB1Z2pkcHhqdmpuc3UiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTc4NTY0NjczMiwiZXhwIjoyMTAxMjIyNzMyfQ.N60Xb1PqqPo12HdKEzPc4qCp1aFvVzwZz4VG04q_Es4';
  const GAME_MESSAGE='Temporalmente no disponible. Estamos terminando de habilitar las compras de este juego.';
  const OFFER_MESSAGE='Temporalmente no disponible. Esta oferta está en mantenimiento.';
  const sb=window.supabase.createClient(SUPABASE_URL,SUPABASE_ANON_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});

  let products=[];
  let loading=false;
  let renderGuard=false;
  let observer=null;

  const esc=(value)=>String(value??'').replace(/[&<>"']/g,(char)=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[char]));
  const money=(value)=>`Bs ${Number(value||0).toLocaleString('es-BO',{minimumFractionDigits:2,maximumFractionDigits:2})}`;
  const host=()=>document.getElementById('maintenanceList');
  const panel=()=>document.getElementById('maintenancePanel');

  async function rpc(name,args){
    const result=await sb.rpc(name,args);
    if(result.error)throw result.error;
    return result.data;
  }

  function notify(message){
    const toast=document.getElementById('toast');
    if(!toast)return;
    toast.textContent=message;
    toast.classList.remove('hidden');
    window.clearTimeout(notify.timer);
    notify.timer=window.setTimeout(()=>toast.classList.add('hidden'),3200);
  }

  function groupedProducts(list){
    const map=new Map();
    list.forEach((product)=>{
      const game=String(product.juego||'Sin nombre');
      if(!map.has(game))map.set(game,[]);
      map.get(game).push(product);
    });
    return [...map.entries()]
      .map(([game,items])=>[game,items.sort((a,b)=>Number(a.precio)-Number(b.precio)||String(a.paquete||'').localeCompare(String(b.paquete||''),'es',{numeric:true,sensitivity:'base'}))])
      .sort((a,b)=>a[0].localeCompare(b[0],'es',{sensitivity:'base'}));
  }

  function statusFor(items){
    const maintenance=items.filter((item)=>item.mantenimiento===true).length;
    return {
      all:items.length>0&&maintenance===items.length,
      mixed:maintenance>0&&maintenance<items.length,
      maintenance
    };
  }

  function render(){
    const target=host();
    if(!target)return;
    const source=products.filter((p)=>p.activo===true&&p.maintenance_editable===true);
    const groups=groupedProducts(source);
    renderGuard=true;
    try{
      target.innerHTML=`<div data-r136-maintenance-root>${groups.length?groups.map(([game,items])=>{
        const state=statusFor(items);
        const ids=items.map((p)=>Number(p.id)).filter(Number.isSafeInteger).join(',');
        const badge=state.all?'EN MANTENIMIENTO':state.mixed?'MIXTO':'DISPONIBLE';
        const badgeClass=state.all||state.mixed?'warn':'ok';
        const offers=items.map((product)=>{
          const blocked=product.mantenimiento===true;
          return `<div class="offer-row">
            <div class="offer-copy">
              <b>${esc(product.paquete||'Recarga')}</b>
              <small>${money(product.precio)} · ID ${esc(product.id)}</small>
            </div>
            <div class="offer-state">
              <span class="badge ${blocked?'warn':'ok'}">${blocked?'EN MANTENIMIENTO':'DISPONIBLE'}</span>
              <button type="button" class="${blocked?'secondary':'primary'}" data-r136-offer-id="${esc(product.id)}" data-r136-enable="${blocked?'0':'1'}" data-r136-label="${esc(product.paquete||'Recarga')}">${blocked?'Reactivar recarga':'Poner en mantenimiento'}</button>
            </div>
          </div>`;
        }).join('');
        return `<article class="card game-maintenance-card">
          <div class="game-maintenance-head">
            <div><b>${esc(game)}</b><small>${items.length} recarga${items.length===1?'':'s'} · ${state.maintenance} en mantenimiento</small></div>
            <span class="badge ${badgeClass}">${badge}</span>
          </div>
          <div class="game-maintenance-actions">
            <button type="button" class="${state.all?'secondary':'primary'} full" data-r136-game-ids="${ids}" data-r136-enable="${state.all?'0':'1'}" data-r136-label="${esc(game)}">${state.all?'Reactivar juego completo':'Poner juego completo en mantenimiento'}</button>
          </div>
          <div class="offer-list">${offers}</div>
        </article>`;
      }).join(''):'<article class="card"><small>No hay Recargas por Cuenta activas para administrar.</small></article>'}</div>`;
    } finally {
      renderGuard=false;
    }
    target.querySelectorAll('[data-r136-offer-id]').forEach((button)=>button.addEventListener('click',()=>toggleOffer(button)));
    target.querySelectorAll('[data-r136-game-ids]').forEach((button)=>button.addEventListener('click',()=>toggleGame(button)));
  }

  async function changeMaintenance(ids,enabled,message,label,kind,button){
    const action=enabled?'Poner en mantenimiento':'Reactivar';
    if(!window.confirm(`¿${action} ${kind} “${label}”?`))return;
    if(button)button.disabled=true;
    try{
      const data=await rpc('admin_app_set_account_game_maintenance',{p_product_ids:ids,p_enabled:enabled,p_message:enabled?message:null});
      if(!data?.ok)throw new Error('MAINTENANCE_UPDATE_FAILED');
      await refresh(true);
      notify(enabled?`${label}: mantenimiento activado.`:`${label}: reactivado.`);
    }catch(error){
      notify(error?.message==='ADMIN_APP_FORBIDDEN'?'Acceso administrativo rechazado.':'No se pudo cambiar el mantenimiento.');
      if(button)button.disabled=false;
    }
  }

  async function toggleOffer(button){
    const id=Number(button.dataset.r136OfferId);
    if(!Number.isSafeInteger(id)||id<=0)return;
    await changeMaintenance([id],button.dataset.r136Enable==='1',OFFER_MESSAGE,button.dataset.r136Label||'esta recarga','la recarga',button);
  }

  async function toggleGame(button){
    const ids=String(button.dataset.r136GameIds||'').split(',').map(Number).filter((id)=>Number.isSafeInteger(id)&&id>0);
    if(!ids.length)return;
    await changeMaintenance(ids,button.dataset.r136Enable==='1',GAME_MESSAGE,button.dataset.r136Label||'este juego','el juego completo',button);
  }

  async function refresh(force=false){
    const target=host();
    if(!target||loading)return;
    if(!force&&panel()?.classList.contains('hidden'))return;
    loading=true;
    try{
      const data=await rpc('admin_app_list_products');
      products=Array.isArray(data)?data:[];
      render();
    }catch(error){
      if(target&&!target.querySelector('[data-r136-maintenance-root]'))target.innerHTML=`<article class="card"><small>${esc(error?.message||'No se pudo cargar el mantenimiento individual.')}</small></article>`;
    }finally{
      loading=false;
    }
  }

  function install(){
    const target=host();
    if(!target)return;

    document.addEventListener('click',(event)=>{
      const tab=event.target.closest?.('[data-tab="maintenance"]');
      const reload=event.target.closest?.('[data-refresh="maintenance"]');
      if(tab||reload)window.setTimeout(()=>refresh(true),0);
    },true);

    observer=new MutationObserver(()=>{
      if(renderGuard||loading||panel()?.classList.contains('hidden'))return;
      if(!target.querySelector('[data-r136-maintenance-root]'))window.setTimeout(()=>refresh(true),0);
    });
    observer.observe(target,{childList:true,subtree:false});

    if(!panel()?.classList.contains('hidden'))refresh(true);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();

/* R137 loader: kept outside the R136 feature so maintenance remains fail-safe. */
(() => {
  'use strict';
  if(document.querySelector('script[data-r137-price-overrides]'))return;
  const script=document.createElement('script');
  script.src='./r137-price-overrides.js?v=20260902-r137';
  script.defer=true;
  script.dataset.r137PriceOverrides='1';
  script.addEventListener('error',()=>console.warn('FRENCH STORE R137 price controls did not load; core Admin remains available.'),{once:true});
  document.head.appendChild(script);
})();
