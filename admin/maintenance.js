/* THE FRENCH STORE — R141 private maintenance manager.
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
  let selectedGame=null;
  let toastTimer=null;

  const $=(id)=>document.getElementById(id);
  const esc=(value)=>String(value??'').replace(/[&<>"']/g,(char)=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[char]));
  const money=(value)=>`Bs ${Number(value||0).toLocaleString('es-BO',{minimumFractionDigits:2,maximumFractionDigits:2})}`;

  function showOnly(id){['loadingView','deniedView','appView'].forEach((view)=>$(view)?.classList.toggle('hidden',view!==id))}
  function toast(message){const el=$('toast');if(!el)return;if(toastTimer)clearTimeout(toastTimer);el.textContent=message;el.classList.remove('hidden');toastTimer=setTimeout(()=>el.classList.add('hidden'),3200)}
  async function rpc(name,args){const result=await sb.rpc(name,args);if(result.error)throw result.error;return result.data}

  function groupedProducts(list){
    const map=new Map();
    list.forEach((product)=>{const game=String(product.juego||'Sin nombre');if(!map.has(game))map.set(game,[]);map.get(game).push(product)});
    return [...map.entries()].map(([game,items])=>[game,items.sort((a,b)=>String(a.paquete||'').localeCompare(String(b.paquete||''),'es',{numeric:true,sensitivity:'base'}))]).sort((a,b)=>a[0].localeCompare(b[0],'es',{sensitivity:'base'}));
  }
  function statusFor(items){const maintenance=items.filter((item)=>item.mantenimiento===true).length;return{all:items.length>0&&maintenance===items.length,mixed:maintenance>0&&maintenance<items.length,maintenance}}
  function sourceProducts(){return products.filter((p)=>p.activo===true&&p.maintenance_editable===true)}

  function renderGameGrid(source,query){
    const host=$('maintenanceDetailList');
    const groups=groupedProducts(source).filter(([game,items])=>!query||game.toLowerCase().includes(query)||items.some((p)=>String(p.paquete||'').toLowerCase().includes(query)));
    if(!groups.length){host.innerHTML='<div class="empty-filter">No hay juegos u ofertas que coincidan.</div>';return}
    host.innerHTML=`<div class="maintenance-game-grid">${groups.map(([game,items])=>{
      const state=statusFor(items);const badge=state.all?'EN MANTENIMIENTO':state.mixed?'MIXTO':'DISPONIBLE';const badgeClass=state.all||state.mixed?'warn':'ok';
      return `<button type="button" class="maintenance-game-tile" data-open-maintenance-game="${esc(game)}"><span class="maintenance-game-title">${esc(game)}</span><span class="badge ${badgeClass}">${badge}</span><small>${items.length} oferta${items.length===1?'':'s'} · ${state.maintenance} en mantenimiento</small><span class="maintenance-game-enter">Entrar a modificar →</span></button>`;
    }).join('')}</div>`;
    host.querySelectorAll('[data-open-maintenance-game]').forEach((button)=>button.addEventListener('click',()=>{selectedGame=button.dataset.openMaintenanceGame||null;const input=$('searchInput');if(input)input.value='';render()}));
  }

  function renderGameDetail(source,query){
    const host=$('maintenanceDetailList');
    const allItems=source.filter((p)=>String(p.juego||'')===selectedGame);
    if(!allItems.length){selectedGame=null;render();return}
    const visibleItems=query?allItems.filter((p)=>String(p.paquete||'').toLowerCase().includes(query)):allItems;
    const state=statusFor(allItems);const ids=allItems.map((p)=>Number(p.id)).filter(Number.isSafeInteger).join(',');
    const badge=state.all?'EN MANTENIMIENTO':state.mixed?'MIXTO':'DISPONIBLE';const badgeClass=state.all||state.mixed?'warn':'ok';
    const offers=visibleItems.map((product)=>{const blocked=product.mantenimiento===true;return `<div class="offer-row"><div class="offer-copy"><b>${esc(product.paquete||'Oferta')}</b><small>${money(product.precio)} · ID ${esc(product.id)}</small></div><div class="offer-state"><span class="badge ${blocked?'warn':'ok'}">${blocked?'EN MANTENIMIENTO':'DISPONIBLE'}</span><button type="button" class="${blocked?'secondary':'primary'}" data-offer-id="${esc(product.id)}" data-enable="${blocked?'0':'1'}" data-label="${esc(product.paquete||'Oferta')}">${blocked?'Reactivar oferta':'Poner en mantenimiento'}</button></div></div>`}).join('');
    host.innerHTML=`<div class="maintenance-detail-toolbar"><button type="button" class="secondary" data-maintenance-back>← Volver a juegos</button></div><article class="card game-maintenance-card"><div class="game-maintenance-head"><div><b>${esc(selectedGame)}</b><small>${allItems.length} oferta${allItems.length===1?'':'s'} · ${state.maintenance} en mantenimiento</small></div><span class="badge ${badgeClass}">${badge}</span></div><div class="game-maintenance-actions"><button type="button" class="${state.all?'secondary':'primary'} full" data-game-ids="${ids}" data-enable="${state.all?'0':'1'}" data-label="${esc(selectedGame)}">${state.all?'Reactivar juego completo':'Poner juego completo en mantenimiento'}</button></div><div class="offer-list">${offers||'<div class="empty-filter">No hay ofertas que coincidan dentro de este juego.</div>'}</div></article>`;
    host.querySelector('[data-maintenance-back]')?.addEventListener('click',()=>{selectedGame=null;const input=$('searchInput');if(input)input.value='';render()});
    host.querySelectorAll('[data-offer-id]').forEach((button)=>button.addEventListener('click',()=>toggleOffer(button)));
    host.querySelectorAll('[data-game-ids]').forEach((button)=>button.addEventListener('click',()=>toggleGame(button)));
  }

  function render(){const host=$('maintenanceDetailList');if(!host)return;const query=String($('searchInput')?.value||'').trim().toLowerCase();const source=sourceProducts();selectedGame?renderGameDetail(source,query):renderGameGrid(source,query)}

  async function changeMaintenance(ids,enabled,message,label,kind){const action=enabled?'poner en mantenimiento':'reactivar';if(!confirm(`¿${action.charAt(0).toUpperCase()+action.slice(1)} ${kind} “${label}”?`))return false;try{const data=await rpc('admin_app_set_account_game_maintenance',{p_product_ids:ids,p_enabled:enabled,p_message:enabled?message:null});if(!data?.ok)throw new Error('MAINTENANCE_UPDATE_FAILED');await loadProducts();toast(enabled?`${label}: mantenimiento activado.`:`${label}: reactivado.`);return true}catch(error){toast(error?.message==='ADMIN_APP_FORBIDDEN'?'Acceso administrativo rechazado.':'No se pudo cambiar el mantenimiento.');return false}}
  async function toggleOffer(button){const id=Number(button.dataset.offerId);if(!Number.isSafeInteger(id)||id<=0)return;button.disabled=true;const ok=await changeMaintenance([id],button.dataset.enable==='1',OFFER_MESSAGE,button.dataset.label||'esta oferta','la oferta');if(!ok)button.disabled=false}
  async function toggleGame(button){const ids=String(button.dataset.gameIds||'').split(',').map(Number).filter((id)=>Number.isSafeInteger(id)&&id>0);if(!ids.length)return;button.disabled=true;const ok=await changeMaintenance(ids,button.dataset.enable==='1',GAME_MESSAGE,button.dataset.label||'este juego','el juego');if(!ok)button.disabled=false}

  async function loadProducts(){const host=$('maintenanceDetailList');if(host)host.innerHTML='<article class="card"><small>Cargando mantenimiento…</small></article>';try{const data=await rpc('admin_app_list_products');products=Array.isArray(data)?data:[];render()}catch(error){if(host)host.innerHTML=`<article class="card"><small>${esc(error?.message||'No se pudo cargar el catálogo.')}</small></article>`}}

  async function boot(){
    const{data:sessionData}=await sb.auth.getSession();const session=sessionData?.session;if(!session){showOnly('deniedView');return}
    const{data,error}=await sb.rpc('admin_app_is_allowed');if(error||data!==true){showOnly('deniedView');return}
    $('adminEmail').textContent=session.user?.email||'';showOnly('appView');
    const requestedGame=new URLSearchParams(location.search).get('game');if(requestedGame)selectedGame=requestedGame;
    $('refreshButton').addEventListener('click',loadProducts);$('searchInput').addEventListener('input',render);await loadProducts();
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>boot().catch(()=>showOnly('deniedView')),{once:true});else boot().catch(()=>showOnly('deniedView'));
})();
