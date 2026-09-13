/* THE FRENCH STORE — R165 manual fixed pricing for Streaming.
   In Streaming, purchase cost and final sale price are both chosen by Admin.
   No automatic margin formula is applied to the sale price. */
(() => {
  'use strict';

  const SUPABASE_URL='https://jivaaripugjdpxjvjnsu.supabase.co';
  const SUPABASE_ANON_KEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJqaXZhYXJpcHVnamRweGp2am5zdSIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNzg1NjQ2NzMyLCJleHAiOjIxMDEyMjI3MzJ9.N60Xb1PqqPo12HdKEzPc4qCp1aFvVzwZz4VG04q_Es4';
  const sb=window.supabase.createClient(SUPABASE_URL,SUPABASE_ANON_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});

  const $=id=>document.getElementById(id);
  const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[char]));
  const money=value=>`Bs ${Number(value||0).toLocaleString('es-BO',{minimumFractionDigits:2,maximumFractionDigits:2})}`;
  const rows=new Map();
  let loading=false;
  let installed=false;
  let observer=null;

  function notify(message){
    const toast=$('toast');
    if(!toast)return;
    toast.textContent=message;
    toast.classList.remove('hidden');
    clearTimeout(notify.timer);
    notify.timer=setTimeout(()=>toast.classList.add('hidden'),3400);
  }

  async function rpc(name,args){
    const result=await sb.rpc(name,args);
    if(result.error)throw result.error;
    return result.data;
  }

  function panelVisible(){return !$('pricesPanel')?.classList.contains('hidden');}

  function cardHtml(product){
    const id=Number(product.id);
    const purchase=Number(product.precio_proveedor||0);
    const sale=Number(product.precio_venta_fijo??product.precio??0);
    return `
      <div class="card-top">
        <div>
          <b>${esc(product.paquete)}</b>
          <small>${esc(product.juego)} · Streaming</small>
          <small><b>Precio fijo manual:</b> tú decides cuánto cuesta comprarlo y a cuánto venderlo.</small>
          <small>El precio de venta <b>no</b> se calcula con margen automático.</small>
        </div>
        <span class="badge ok">FIJO MANUAL Bs</span>
      </div>
      <div class="form-grid">
        <label><span>Precio de compra (Bs)</span><input type="number" min="0" max="10000" step="0.01" inputmode="decimal" value="${purchase.toFixed(2)}" data-r165-purchase="${id}"></label>
        <label><span>Precio de venta (Bs)</span><input type="number" min="0.50" max="5000" step="0.01" inputmode="decimal" value="${sale.toFixed(2)}" data-r165-sale="${id}"></label>
      </div>
      <div class="meta"><span>Compra actual: <b>${money(purchase)}</b></span><span>Venta actual: <b>${money(sale)}</b></span></div>
      <div class="card-actions"><button class="primary full" type="button" data-r165-stream-save="${id}">Guardar compra y venta</button></div>`;
  }

  function enhanceCards(){
    const host=$('priceList');
    if(!host)return;
    host.querySelectorAll('[data-r138-stream-card]').forEach(card=>{
      const id=Number(card.dataset.r138StreamCard);
      const product=rows.get(id);
      if(!product)return;
      const purchaseInput=card.querySelector(`[data-r165-purchase="${id}"]`);
      const saleInput=card.querySelector(`[data-r165-sale="${id}"]`);
      if(purchaseInput&&saleInput)return;
      card.innerHTML=cardHtml(product);
      card.dataset.r165FixedPricing='1';
    });
  }

  async function load(){
    const host=$('priceList');
    if(loading||!panelVisible()||!host?.querySelector('[data-r138-stream-card]'))return;
    loading=true;
    try{
      const data=await rpc('admin_app_list_streaming_fixed_pricing');
      rows.clear();
      (Array.isArray(data)?data:[]).forEach(item=>rows.set(Number(item.id),item));
      enhanceCards();
    }catch(error){
      if(error?.message==='ADMIN_APP_FORBIDDEN')notify('Acceso administrativo rechazado.');
      else notify('No se pudieron cargar los precios fijos de Streaming.');
    }finally{loading=false;}
  }

  async function save(button){
    const id=Number(button.dataset.r165StreamSave);
    const product=rows.get(id);
    const card=button.closest('[data-r138-stream-card]');
    const purchase=Number(card?.querySelector(`[data-r165-purchase="${id}"]`)?.value);
    const sale=Number(card?.querySelector(`[data-r165-sale="${id}"]`)?.value);
    if(!product||!Number.isFinite(purchase)||purchase<0||purchase>10000){notify('Escribe un precio de compra válido entre Bs 0 y Bs 10.000.');return;}
    if(!Number.isFinite(sale)||sale<0.50||sale>5000){notify('Escribe un precio de venta válido entre Bs 0,50 y Bs 5.000.');return;}

    const oldPurchase=Number(product.precio_proveedor||0);
    const oldSale=Number(product.precio_venta_fijo??product.precio??0);
    if(Math.abs(oldPurchase-purchase)<0.001&&Math.abs(oldSale-sale)<0.001){notify('No cambiaste ni el precio de compra ni el de venta.');return;}

    if(!window.confirm(`¿Guardar precios de “${product.juego} — ${product.paquete}”?\n\nCompra: ${money(oldPurchase)} → ${money(purchase)}\nVenta: ${money(oldSale)} → ${money(sale)}\n\nEl precio de venta quedará exactamente como lo escribiste; no se aplicará margen automático.`))return;

    const oldText=button.textContent;
    button.disabled=true;
    button.textContent='Guardando…';
    try{
      const data=await rpc('admin_app_set_streaming_fixed_pricing',{
        p_product_id:id,
        p_purchase_price:Number(purchase.toFixed(2)),
        p_sale_price:Number(sale.toFixed(2))
      });
      if(!data?.ok)throw new Error('UPDATE_FAILED');
      rows.set(id,{...product,precio_proveedor:Number(data.new_purchase_price),precio_venta_fijo:Number(data.new_sale_price),precio:Number(data.new_sale_price)});
      if(card)card.innerHTML=cardHtml(rows.get(id));
      notify(`${product.juego}: compra ${money(data.new_purchase_price)} · venta ${money(data.new_sale_price)}.`);
    }catch(error){
      const messages={
        ADMIN_APP_FORBIDDEN:'Acceso administrativo rechazado.',
        PRODUCT_NOT_FOUND:'El producto ya no existe.',
        STREAMING_ONLY:'Este control solo se usa para Streaming.',
        STREAMING_BOB_ONLY:'Streaming debe estar configurado en bolivianos.',
        INVALID_PURCHASE_PRICE:'El precio de compra no es válido.',
        INVALID_SALE_PRICE:'El precio de venta no es válido.'
      };
      notify(messages[error?.message]||'No se pudieron guardar los precios de Streaming.');
      button.disabled=false;
      button.textContent=oldText;
    }
  }

  function install(){
    if(installed)return;
    installed=true;
    const host=$('priceList');
    if(!host)return;
    const panelText=$('pricesPanel')?.querySelector('.panel-head p');
    if(panelText)panelText.textContent='Recargas por Cuenta conserva su cálculo automático. En Streaming tú defines manualmente el precio de compra y el precio de venta; no se aplica margen automático al precio final.';

    host.addEventListener('click',event=>{
      const button=event.target.closest?.('[data-r165-stream-save]');
      if(!button)return;
      event.preventDefault();
      event.stopPropagation();
      save(button);
    },true);

    document.addEventListener('click',event=>{
      if(event.target.closest?.('[data-tab="prices"]')||event.target.closest?.('[data-refresh="prices"]'))setTimeout(load,120);
      if(event.target.closest?.('[data-r140-open-game]')||event.target.closest?.('[data-r140-back]'))setTimeout(()=>{if(rows.size)enhanceCards();else load();},30);
    },true);

    observer=new MutationObserver(()=>{
      if(!panelVisible())return;
      if(rows.size)enhanceCards();
      else load();
    });
    observer.observe(host,{childList:true,subtree:true});

    if(panelVisible())load();
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();
