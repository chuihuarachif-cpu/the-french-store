/* THE FRENCH STORE — R137 temporary manual price overrides for Recargas por Cuenta.
   Security: public anon key + protected admin_app_* RPCs only. No service-role or provider credentials.
   The provider cost and automatic pricing formula stay intact; clearing the override returns immediately to automatic pricing. */
(() => {
  'use strict';

  const SUPABASE_URL='https://jivaaripugjdpxjvjnsu.supabase.co';
  const SUPABASE_ANON_KEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYXNlIiwicmVmIjoiaml2YWFyaXB1Z2pkcHhqdmpuc3UiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTc4NTY0NjczMiwiZXhwIjoyMTAxMjIyNzMyfQ.N60Xb1PqqPo12HdKEzPc4qCp1aFvVzwZz4VG04q_Es4';
  const sb=window.supabase.createClient(SUPABASE_URL,SUPABASE_ANON_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});

  let productMap=new Map();
  let loading=false;
  let refreshTimer=null;
  let observer=null;

  const money=(value)=>`Bs ${Number(value||0).toLocaleString('es-BO',{minimumFractionDigits:2,maximumFractionDigits:2})}`;
  const host=()=>document.getElementById('priceList');
  const panel=()=>document.getElementById('pricesPanel');

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

  function decorate(){
    const target=host();
    if(!target)return;

    target.querySelectorAll('[data-price-id]').forEach((saveButton)=>{
      const id=Number(saveButton.dataset.priceId);
      const product=productMap.get(id);
      if(!product)return;

      const card=saveButton.closest('.card');
      if(!card)return;
      const actions=saveButton.parentElement;
      const badge=card.querySelector('.badge');
      const oldMode=card.querySelector('[data-r137-price-mode]');
      if(oldMode)oldMode.remove();
      actions?.querySelectorAll('[data-r137-auto-id]').forEach((item)=>item.remove());

      if(product.categoria!=='Recargas por Cuenta')return;

      const manual=product.precio_venta_fijo!==null&&product.precio_venta_fijo!==undefined;
      if(badge){
        badge.textContent=manual?'MANUAL':'AUTOMÁTICO';
        badge.classList.toggle('ok',true);
        badge.classList.toggle('lock',false);
      }

      saveButton.textContent=manual?'Actualizar temporal':'Fijar precio temporal';

      const copy=card.querySelector('.card-top > div');
      if(copy){
        const note=document.createElement('small');
        note.dataset.r137PriceMode='1';
        note.textContent=manual
          ? `Precio manual temporal activo · ${money(product.precio_venta_fijo)}`
          : 'Precio automático · costo + margen de la tienda';
        copy.appendChild(note);
      }

      if(manual&&actions){
        const reset=document.createElement('button');
        reset.type='button';
        reset.className='secondary';
        reset.dataset.r137AutoId=String(id);
        reset.textContent='Volver a automático';
        actions.appendChild(reset);
      }
    });
  }

  async function loadProducts(){
    if(loading)return;
    loading=true;
    try{
      const allowed=await rpc('admin_app_is_allowed');
      if(allowed!==true)return;
      const data=await rpc('admin_app_list_products');
      productMap=new Map((Array.isArray(data)?data:[]).map((product)=>[Number(product.id),product]));
      decorate();
    }catch(error){
      if(error?.message==='ADMIN_APP_FORBIDDEN')notify('Acceso administrativo rechazado.');
    }finally{
      loading=false;
    }
  }

  function scheduleLoad(){
    window.clearTimeout(refreshTimer);
    refreshTimer=window.setTimeout(loadProducts,80);
  }

  async function clearOverride(button){
    const id=Number(button.dataset.r137AutoId);
    if(!Number.isSafeInteger(id)||id<=0)return;
    const product=productMap.get(id);
    if(!product||product.categoria!=='Recargas por Cuenta')return;

    const accepted=window.confirm(`¿Volver “${product.juego} — ${product.paquete}” al precio automático?\n\nSe eliminará únicamente el precio manual temporal. El costo del proveedor y la fórmula automática no se modifican.`);
    if(!accepted)return;

    button.disabled=true;
    try{
      const data=await rpc('admin_app_clear_account_price_override',{p_product_id:id});
      if(!data?.ok)throw new Error('RESET_FAILED');
      notify(`${product.juego}: volvió a precio automático (${money(data.new_price)}).`);
      const refresh=document.querySelector('[data-refresh="prices"]');
      if(refresh)refresh.click();
      window.setTimeout(loadProducts,180);
    }catch(error){
      const map={
        ADMIN_APP_FORBIDDEN:'Acceso administrativo rechazado.',
        PRICE_RULE_MANAGED:'Este producto tiene una regla de precio protegida.'
      };
      notify(map[error?.message]||'No se pudo volver al precio automático.');
      button.disabled=false;
    }
  }

  function install(){
    const target=host();
    if(!target)return;

    target.addEventListener('click',(event)=>{
      const button=event.target.closest?.('[data-r137-auto-id]');
      if(button){
        event.preventDefault();
        event.stopPropagation();
        clearOverride(button);
      }
    });

    observer=new MutationObserver(()=>{
      if(panel()?.classList.contains('hidden'))return;
      scheduleLoad();
    });
    observer.observe(target,{childList:true});

    document.addEventListener('click',(event)=>{
      const pricesTab=event.target.closest?.('[data-tab="prices"]');
      const pricesRefresh=event.target.closest?.('[data-refresh="prices"]');
      if(pricesTab||pricesRefresh)window.setTimeout(loadProducts,120);
    },true);

    if(!panel()?.classList.contains('hidden'))loadProducts();
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});
  else install();
})();
