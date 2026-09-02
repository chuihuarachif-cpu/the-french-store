/* THE FRENCH STORE — R138 purchase-cost editor for Recargas por Cuenta.
   Admin-only UI. The browser uses only the public Supabase anon key and protected RPCs.
   For Recargas por Cuenta the operator edits provider purchase cost, never the final sale price.
   USD products keep their automatic BINANCE_P2P exchange-rate policy; Bs products use direct Bs cost. */
(() => {
  'use strict';

  const SUPABASE_URL='https://jivaaripugjdpxjvjnsu.supabase.co';
  const SUPABASE_ANON_KEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImppdmFhcmlwdWdqZHB4anZqbnN1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU2NDY3MzIsImV4cCI6MjEwMTIyMjczMn0.N60Xb1PqqPo12HdKEzPc4qCp1aFvVzwZz4VG04q_Es4';
  const sb=window.supabase.createClient(SUPABASE_URL,SUPABASE_ANON_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});

  let baseProducts=[];
  let accountProducts=[];
  let loading=false;
  let renderGuard=false;
  let refreshTimer=null;
  let observer=null;

  const esc=(value)=>String(value??'').replace(/[&<>"']/g,(char)=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[char]));
  const money=(value)=>`Bs ${Number(value||0).toLocaleString('es-BO',{minimumFractionDigits:2,maximumFractionDigits:2})}`;
  const amount=(value,digits=2)=>Number(value||0).toLocaleString('es-BO',{minimumFractionDigits:digits,maximumFractionDigits:digits});
  const host=()=>document.getElementById('priceList');
  const panel=()=>document.getElementById('pricesPanel');
  const query=()=>String(document.getElementById('priceSearch')?.value||'').trim().toLowerCase();
  const filter=()=>document.querySelector('#priceFilters [data-filter].active')?.dataset.filter||'editable';

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
    notify.timer=window.setTimeout(()=>toast.classList.add('hidden'),3400);
  }

  function matches(item){
    const q=query();
    if(!q)return true;
    return `${item.juego||''} ${item.paquete||''} ${item.categoria||''} ${item.moneda||''}`.toLowerCase().includes(q);
  }

  function currencyLabel(product){
    return String(product.moneda||'').toUpperCase()==='USD'?'USD':'Bs';
  }

  function costText(product){
    return currencyLabel(product)==='USD'?`$ ${amount(product.precio_proveedor)} USD`:`Bs ${amount(product.precio_proveedor)}`;
  }

  function accountCard(product){
    const currency=currencyLabel(product);
    const editable=product.cost_editable===true;
    const fx=Number(product.tipo_cambio||0);
    const fxInfo=currency==='USD'
      ? `<small><b>Conversión:</b> ${money(product.costo_bob)} · <b>TC:</b> ${money(fx)}/USDT · ${esc(product.fuente_tipo_cambio||'')}</small><small>El tipo de cambio se actualiza con la política automática de la tienda; aquí solo cambias el costo USD que cobra la página/proveedor.</small>`
      : `<small><b>Compra directa en Bs:</b> no usa conversión de dólar.</small>`;
    return `<article class="card" data-r138-account-card="${esc(product.id)}">
      <div class="card-top">
        <div>
          <b>${esc(product.juego)}</b>
          <small>${esc(product.paquete)} · Recargas por Cuenta</small>
          <small><b>Costo de compra actual:</b> ${esc(costText(product))}</small>
          ${fxInfo}
          <small><b>Precio al cliente:</b> ${money(product.precio)} · <b>Margen:</b> ${money(product.margen)}</small>
        </div>
        <span class="badge ${editable?'ok':'lock'}">${editable?`COSTO ${esc(currency)}`:'PROTEGIDO'}</span>
      </div>
      <div class="form-grid">
        <label class="wide"><span>Costo de compra (${esc(currency)})</span><input type="number" min="0.01" max="10000" step="0.01" inputmode="decimal" value="${Number(product.precio_proveedor||0).toFixed(2)}" data-r138-cost-input="${esc(product.id)}" ${editable?'':'disabled'}></label>
      </div>
      <div class="card-actions"><button class="${editable?'primary':'secondary'} full" type="button" data-r138-cost-id="${esc(product.id)}" ${editable?'':'disabled'}>${editable?'Guardar costo de compra':'Costo gestionado automáticamente'}</button></div>
    </article>`;
  }

  function streamingCard(product){
    const editable=product.price_editable===true;
    return `<article class="card" data-r138-stream-card="${esc(product.id)}">
      <div class="card-top"><div><b>${esc(product.juego)}</b><small>${esc(product.paquete)} · Streaming</small><small>Precio final fijo en bolivianos.</small></div><span class="badge ${editable?'ok':'lock'}">${editable?'PRECIO FIJO Bs':'PROTEGIDO'}</span></div>
      <div class="form-grid"><label class="wide"><span>Precio final al cliente (Bs)</span><input type="number" min="0.50" max="5000" step="0.01" inputmode="decimal" value="${Number(product.precio||0).toFixed(2)}" data-r138-stream-input="${esc(product.id)}" ${editable?'':'disabled'}></label></div>
      <div class="card-actions"><button class="${editable?'primary':'secondary'} full" type="button" data-r138-stream-id="${esc(product.id)}" ${editable?'':'disabled'}>${editable?'Guardar precio fijo':'Bloqueado'}</button></div>
    </article>`;
  }

  function protectedCard(product){
    return `<article class="card"><div class="card-top"><div><b>${esc(product.juego)}</b><small>${esc(product.paquete)} · ${esc(product.categoria)}</small><small>Regla especial protegida. No se modifica desde este panel.</small></div><span class="badge lock">PROTEGIDO</span></div><div class="card-actions"><button class="secondary full" type="button" disabled>Bloqueado</button></div></article>`;
  }

  function render(){
    const target=host();
    if(!target)return;
    const active=filter();
    const accounts=accountProducts.filter((p)=>p.activo===true).filter((p)=>active==='all'||p.cost_editable===true).filter(matches);
    const streaming=baseProducts.filter((p)=>p.activo===true&&p.categoria==='Streaming').filter((p)=>active==='all'||p.price_editable===true).filter(matches);
    const protectedItems=active==='all'?baseProducts.filter((p)=>p.activo===true&&Number(p.id)===54).filter(matches):[];
    const cards=[...accounts.map(accountCard),...streaming.map(streamingCard),...protectedItems.map(protectedCard)];

    renderGuard=true;
    try{
      target.innerHTML=`<div data-r138-pricing-root>${cards.length?cards.join(''):'<article class="card"><small>No hay productos que coincidan con este filtro.</small></article>'}</div>`;
    }finally{
      renderGuard=false;
    }
  }

  async function load(force=false){
    const target=host();
    if(!target||loading)return;
    if(!force&&panel()?.classList.contains('hidden'))return;
    loading=true;
    try{
      const allowed=await rpc('admin_app_is_allowed');
      if(allowed!==true)throw new Error('ADMIN_APP_FORBIDDEN');
      const [base,accounts]=await Promise.all([
        rpc('admin_app_list_products'),
        rpc('admin_app_list_account_pricing')
      ]);
      baseProducts=Array.isArray(base)?base:[];
      accountProducts=Array.isArray(accounts)?accounts:[];
      render();
    }catch(error){
      if(target&&!target.querySelector('[data-r138-pricing-root]'))target.innerHTML=`<article class="card"><small>${esc(error?.message||'No se pudieron cargar los costos de compra.')}</small></article>`;
      if(error?.message==='ADMIN_APP_FORBIDDEN')notify('Acceso administrativo rechazado.');
    }finally{
      loading=false;
    }
  }

  async function saveCost(button){
    const id=Number(button.dataset.r138CostId);
    const product=accountProducts.find((p)=>Number(p.id)===id);
    const input=host()?.querySelector(`[data-r138-cost-input="${id}"]`);
    const next=Number(input?.value);
    if(!product||product.cost_editable!==true||!Number.isFinite(next)||next<=0||next>10000){notify('Escribe un costo de compra válido.');return;}
    const old=Number(product.precio_proveedor);
    if(Math.abs(old-next)<0.0001){notify('El costo nuevo es igual al actual.');return;}
    const currency=currencyLabel(product);
    const oldText=currency==='USD'?`$ ${amount(old)} USD`:`Bs ${amount(old)}`;
    const newText=currency==='USD'?`$ ${amount(next)} USD`:`Bs ${amount(next)}`;
    const fxNote=currency==='USD'?`\n\nEl tipo de cambio seguirá siendo automático (${money(product.tipo_cambio)}/USDT, ${product.fuente_tipo_cambio||''}).`:'';
    if(!window.confirm(`¿Actualizar el costo de compra de “${product.juego} — ${product.paquete}”?\n\n${oldText} → ${newText}\n\nLa tienda recalculará automáticamente el precio de venta aplicando el margen correspondiente.${fxNote}`))return;

    button.disabled=true;
    try{
      const data=await rpc('admin_app_update_account_purchase_cost',{p_product_id:id,p_new_cost:next});
      if(!data?.ok)throw new Error('UPDATE_FAILED');
      notify(`${product.juego}: costo guardado. Nuevo precio cliente ${money(data.new_price)}.`);
      await load(true);
    }catch(error){
      const messages={ADMIN_APP_FORBIDDEN:'Acceso administrativo rechazado.',ACCOUNT_RECHARGE_ONLY:'Solo se permite en Recargas por Cuenta.',PROVIDER_MANAGED_COST:'Este costo está gestionado automáticamente por un proveedor.',INVALID_COST:'El costo no es válido.',UNSUPPORTED_CURRENCY:'La moneda de este producto no es compatible con edición manual.'};
      notify(messages[error?.message]||'No se pudo guardar el costo de compra.');
      button.disabled=false;
    }
  }

  async function saveStreaming(button){
    const id=Number(button.dataset.r138StreamId);
    const product=baseProducts.find((p)=>Number(p.id)===id);
    const input=host()?.querySelector(`[data-r138-stream-input="${id}"]`);
    const next=Number(input?.value);
    if(!product||product.categoria!=='Streaming'||product.price_editable!==true||!Number.isFinite(next)||next<0.50||next>5000){notify('Escribe un precio fijo válido entre Bs 0,50 y Bs 5.000.');return;}
    const old=Number(product.precio);
    if(Math.abs(old-next)<0.001){notify('El precio nuevo es igual al actual.');return;}
    if(!window.confirm(`¿Cambiar “${product.juego} — ${product.paquete}” de ${money(old)} a ${money(next)}?\n\nStreaming seguirá usando precio final fijo.`))return;

    button.disabled=true;
    try{
      const data=await rpc('admin_app_set_fixed_price',{p_product_id:id,p_new_price:next});
      if(!data?.ok)throw new Error('UPDATE_FAILED');
      notify(`${product.juego}: precio fijo actualizado a ${money(data.new_price)}.`);
      await load(true);
    }catch(error){
      const messages={ADMIN_APP_FORBIDDEN:'Acceso administrativo rechazado.',PRICE_RULE_MANAGED:'Este producto tiene una regla de precio protegida.',INVALID_PRICE:'El precio no es válido.'};
      notify(messages[error?.message]||'No se pudo guardar el precio fijo.');
      button.disabled=false;
    }
  }

  function scheduleLoad(){
    window.clearTimeout(refreshTimer);
    refreshTimer=window.setTimeout(()=>load(true),90);
  }

  function install(){
    const target=host();
    if(!target)return;

    target.addEventListener('click',(event)=>{
      const costButton=event.target.closest?.('[data-r138-cost-id]');
      if(costButton){event.preventDefault();event.stopPropagation();saveCost(costButton);return;}
      const streamButton=event.target.closest?.('[data-r138-stream-id]');
      if(streamButton){event.preventDefault();event.stopPropagation();saveStreaming(streamButton);}
    },true);

    document.addEventListener('click',(event)=>{
      if(event.target.closest?.('[data-tab="prices"]')||event.target.closest?.('[data-refresh="prices"]')||event.target.closest?.('#priceFilters [data-filter]'))scheduleLoad();
    },true);
    document.getElementById('priceSearch')?.addEventListener('input',scheduleLoad,true);

    observer=new MutationObserver(()=>{
      if(renderGuard||loading||panel()?.classList.contains('hidden'))return;
      if(!target.querySelector('[data-r138-pricing-root]'))scheduleLoad();
    });
    observer.observe(target,{childList:true,subtree:false});

    if(!panel()?.classList.contains('hidden'))load(true);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();
