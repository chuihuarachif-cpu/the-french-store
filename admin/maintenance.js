/* THE FRENCH STORE — R93 private maintenance manager.
   Uses the public anon key and private admin_app_* RPCs only. No service-role key,
   provider credential or direct product-table write is present in the browser. */
(() => {
  'use strict';

  const SUPABASE_URL='https://jivaaripugjdpxjvjnsu.supabase.co';
  const SUPABASE_ANON_KEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImppdmFhcmlwdWdqZHB4anZqbnN1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU2NDY3MzIsImV4cCI6MjEwMTIyMjczMn0.N60Xb1PqqPo12HdKEzPc4qCp1aFvVzwZz4VG04q_Es4';
  const GAME_MESSAGE='Temporalmente no disponible. Estamos terminando de habilitar las compras de este juego.';
  const OFFER_MESSAGE='Temporalmente no disponible. Esta oferta está en mantenimiento.';
  const sb=window.supabase.createClient(SUPABASE_URL,SUPABASE_ANON_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});

  let products=[];
  let toastTimer=null;

  const $=(id)=>document.getElementById(id);
  const esc=(value)=>String(value??'').replace(/[&<>"']/g,(char)=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[char]));
  const money=(value)=>`Bs ${Number(value||0).toLocaleString('es-BO',{minimumFractionDigits:2,maximumFractionDigits:2})}`;

  function showOnly(id){
    ['loadingView','deniedView','appView'].forEach((view)=>$(view)?.classList.toggle('hidden',view!==id));
  }

  function toast(message){
    const el=$('toast');
    if(!el)return;
    if(toastTimer)clearTimeout(toastTimer);
    el.textContent=message;
    el.classList.remove('hidden');
    toastTimer=setTimeout(()=>el.classList.add('hidden'),3200);
  }

  async function rpc(name,args){
    const result=await sb.rpc(name,args);
    if(result.error)throw result.error;
    return result.data;
  }

  function groupedProducts(list){
    const map=new Map();
    list.forEach((product)=>{
      const game=String(product.juego||'Sin nombre');
      if(!map.has(game))map.set(game,[]);
      map.get(game).push(product);
    });
    return [...map.entries()]
      .map(([game,items])=>[game,items.sort((a,b)=>String(a.paquete||'').localeCompare(String(b.paquete||''),'es',{numeric:true,sensitivity:'base'}))])
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
    const host=$('maintenanceDetailList');
    if(!host)return;
    const query=String($('searchInput')?.value||'').trim().toLowerCase();
    const source=products.filter((p)=>p.activo===true&&p.maintenance_editable===true);
    const groups=groupedProducts(source).map(([game,items])=>{
      if(!query)return[game,items];
      const gameMatches=game.toLowerCase().includes(query);
      const filtered=gameMatches?items:items.filter((p)=>`${p.paquete||''} ${p.juego||''}`.toLowerCase().includes(query));
      return[game,filtered];
    }).filter(([,items])=>items.length>0);

    if(!groups.length){
      host.innerHTML='<div class="empty-filter">No hay juegos u ofertas que coincidan.</div>';
      return;
    }

    host.innerHTML=groups.map(([game,visibleItems])=>{
      const allGameItems=source.filter((p)=>String(p.juego||'')===game);
      const gameState=statusFor(allGameItems);
      const gameIds=allGameItems.map((p)=>Number(p.id)).filter(Number.isSafeInteger).join(',');
      const gameBadge=gameState.all?'EN MANTENIMIENTO':gameState.mixed?'MIXTO':'DISPONIBLE';
      const gameClass=gameState.all||gameState.mixed?'warn':'ok';
      const offers=visibleItems.map((product)=>{
        const blocked=product.mantenimiento===true;
        return `<div class="offer-row">
          <div class="offer-copy">
            <b>${esc(product.paquete||'Oferta')}</b>
            <small>${money(product.precio)} · ID ${esc(product.id)}</small>
          </div>
          <div class="offer-state">
            <span class="badge ${blocked?'warn':'ok'}">${blocked?'EN MANTENIMIENTO':'DISPONIBLE'}</span>
            <button type="button" class="${blocked?'secondary':'primary'}" data-offer-id="${esc(product.id)}" data-enable="${blocked?'0':'1'}" data-label="${esc(product.paquete||'Oferta')}">${blocked?'Reactivar oferta':'Poner en mantenimiento'}</button>
          </div>
        </div>`;
      }).join('');

      return `<article class="card game-maintenance-card">
        <div class="game-maintenance-head">
          <div><b>${esc(game)}</b><small>${allGameItems.length} oferta${allGameItems.length===1?'':'s'} · ${gameState.maintenance} en mantenimiento</small></div>
          <span class="badge ${gameClass}">${gameBadge}</span>
        </div>
        <div class="game-maintenance-actions">
          <button type="button" class="${gameState.all?'secondary':'primary'} full" data-game-ids="${gameIds}" data-enable="${gameState.all?'0':'1'}" data-label="${esc(game)}">${gameState.all?'Reactivar juego completo':'Poner juego completo en mantenimiento'}</button>
        </div>
        <div class="offer-list">${offers}</div>
      </article>`;
    }).join('');

    host.querySelectorAll('[data-offer-id]').forEach((button)=>button.addEventListener('click',()=>toggleOffer(button)));
    host.querySelectorAll('[data-game-ids]').forEach((button)=>button.addEventListener('click',()=>toggleGame(button)));
  }

  async function changeMaintenance(ids,enabled,message,label,kind){
    const action=enabled?'poner en mantenimiento':'reactivar';
    if(!confirm(`¿${action.charAt(0).toUpperCase()+action.slice(1)} ${kind} “${label}”?`))return false;
    try{
      const data=await rpc('admin_app_set_account_game_maintenance',{p_product_ids:ids,p_enabled:enabled,p_message:enabled?message:null});
      if(!data?.ok)throw new Error('MAINTENANCE_UPDATE_FAILED');
      await loadProducts();
      toast(enabled?`${label}: mantenimiento activado.`:`${label}: reactivado.`);
      return true;
    }catch(error){
      toast(error?.message==='ADMIN_APP_FORBIDDEN'?'Acceso administrativo rechazado.':'No se pudo cambiar el mantenimiento.');
      return false;
    }
  }

  async function toggleOffer(button){
    const id=Number(button.dataset.offerId);
    if(!Number.isSafeInteger(id)||id<=0)return;
    const enabled=button.dataset.enable==='1';
    const label=button.dataset.label||'esta oferta';
    button.disabled=true;
    const ok=await changeMaintenance([id],enabled,OFFER_MESSAGE,label,'la oferta');
    if(!ok)button.disabled=false;
  }

  async function toggleGame(button){
    const ids=String(button.dataset.gameIds||'').split(',').map(Number).filter((id)=>Number.isSafeInteger(id)&&id>0);
    if(!ids.length)return;
    const enabled=button.dataset.enable==='1';
    const label=button.dataset.label||'este juego';
    button.disabled=true;
    const ok=await changeMaintenance(ids,enabled,GAME_MESSAGE,label,'el juego');
    if(!ok)button.disabled=false;
  }

  async function loadProducts(){
    const host=$('maintenanceDetailList');
    if(host)host.innerHTML='<article class="card"><small>Cargando mantenimiento…</small></article>';
    try{
      const data=await rpc('admin_app_list_products');
      products=Array.isArray(data)?data:[];
      render();
    }catch(error){
      if(host)host.innerHTML=`<article class="card"><small>${esc(error?.message||'No se pudo cargar el catálogo.')}</small></article>`;
    }
  }

  async function boot(){
    const{data:sessionData}=await sb.auth.getSession();
    const session=sessionData?.session;
    if(!session){showOnly('deniedView');return}
    const{data,error}=await sb.rpc('admin_app_is_allowed');
    if(error||data!==true){showOnly('deniedView');return}
    $('adminEmail').textContent=session.user?.email||'';
    showOnly('appView');
    $('refreshButton').addEventListener('click',loadProducts);
    $('searchInput').addEventListener('input',render);
    await loadProducts();
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>boot().catch(()=>showOnly('deniedView')),{once:true});
  else boot().catch(()=>showOnly('deniedView'));
})();
