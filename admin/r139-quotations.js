/* THE FRENCH STORE — R139 private quotations calculator.
   Admin-only helper. It never changes products, prices, Wallet, orders or checkout.
   Sale prices are calculated by a protected Supabase RPC that reuses the store margin rule. */
(() => {
  'use strict';

  const SUPABASE_URL='https://jivaaripugjdpxjvjnsu.supabase.co';
  const SUPABASE_ANON_KEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImppdmFhcmlwdWdqZHB4anZqbnN1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU2NDY3MzIsImV4cCI6MjEwMTIyMjczMn0.N60Xb1PqqPo12HdKEzPc4qCp1aFvVzwZz4VG04q_Es4';
  const STORAGE_KEY='fs_admin_quotes_r139';
  const sb=window.supabase.createClient(SUPABASE_URL,SUPABASE_ANON_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});

  const quoteTimers=new Map();
  let requestCounter=0;
  let usdRate=null;
  let usdRawRate=null;
  let usdBuffer=null;
  let installed=false;

  const $=(id)=>document.getElementById(id);
  const esc=(value)=>String(value??'').replace(/[&<>"']/g,(char)=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[char]));
  const compact=(value)=>{
    const n=Number(value);
    if(!Number.isFinite(n))return '—';
    return n.toFixed(2).replace(/\.00$/,'').replace(/(\.\d)0$/,'$1');
  };
  const money=(value)=>`Bs ${Number(value||0).toLocaleString('es-BO',{minimumFractionDigits:2,maximumFractionDigits:2})}`;
  const newId=()=>window.crypto?.randomUUID?.()||`q-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const blank=()=>({id:newId(),name:'',cost:'',result:null,error:'',requestId:0});

  function freshState(){return {BS:[blank()],USD:[blank()]};}

  function loadState(){
    try{
      const parsed=JSON.parse(localStorage.getItem(STORAGE_KEY)||'null');
      if(!parsed||typeof parsed!=='object')return freshState();
      const normalize=(items)=>Array.isArray(items)&&items.length?items.slice(0,30).map((item)=>({id:newId(),name:String(item?.name||'').slice(0,120),cost:String(item?.cost||'').slice(0,30),result:null,error:'',requestId:0})):[blank()];
      return {BS:normalize(parsed.BS),USD:normalize(parsed.USD)};
    }catch{return freshState();}
  }

  const state=loadState();

  function persist(){
    try{
      localStorage.setItem(STORAGE_KEY,JSON.stringify({
        BS:state.BS.map(({name,cost})=>({name,cost})),
        USD:state.USD.map(({name,cost})=>({name,cost}))
      }));
    }catch{}
  }

  async function rpc(name,args){
    const result=await sb.rpc(name,args);
    if(result.error)throw result.error;
    return result.data;
  }

  function notify(message){
    const toast=$('toast');
    if(!toast)return;
    toast.textContent=message;
    toast.classList.remove('hidden');
    window.clearTimeout(notify.timer);
    notify.timer=window.setTimeout(()=>toast.classList.add('hidden'),3200);
  }

  function panel(){return $('quotationsPanel');}
  function panelVisible(){return panel()&&!panel().classList.contains('hidden');}
  function findItem(currency,id){return state[currency]?.find((item)=>item.id===id)||null;}

  function copyLine(item){
    if(!item?.result?.ok)return '';
    const name=String(item.name||'').trim()||'Producto';
    return `${name} → ${compact(item.result.sale_price)} Bs 💸`;
  }

  async function copyText(text){
    if(!text)return false;
    try{
      if(navigator.clipboard?.writeText){await navigator.clipboard.writeText(text);return true;}
    }catch{}
    try{
      const area=document.createElement('textarea');
      area.value=text;area.setAttribute('readonly','');area.style.position='fixed';area.style.opacity='0';
      document.body.appendChild(area);area.select();const ok=document.execCommand('copy');area.remove();return ok;
    }catch{return false;}
  }

  function rateMarkup(currency){
    if(currency==='BS')return '<span class="r139-rate-dot ok"></span><b>Bolivianos:</b> costo directo, sin conversión de dólar.';
    if(!Number.isFinite(Number(usdRate)))return '<span class="r139-rate-dot"></span>Consultando cotización USD vigente…';
    const raw=Number.isFinite(Number(usdRawRate))?` · Binance raw ${money(usdRawRate)}`:'';
    const buffer=Number.isFinite(Number(usdBuffer))?` + colchón ${money(usdBuffer)}`:'';
    return `<span class="r139-rate-dot ok"></span><b>USD operativo:</b> ${money(usdRate)}/USDT${raw}${buffer}`;
  }

  function resultMarkup(item,currency){
    if(item.error)return `<div class="r139-result bad">${esc(item.error)}</div>`;
    if(!item.cost)return '<div class="r139-result muted-result">Escribe el costo para calcular.</div>';
    if(!item.result)return '<div class="r139-result loading-result">Calculando…</div>';
    const r=item.result;
    const conversion=currency==='USD'?`<small>Costo convertido: ${money(r.cost_bob)} · TC ${money(r.fx)}/USDT</small>`:'';
    return `<div class="r139-result good"><strong>${esc(copyLine(item))}</strong><small>Margen aplicado: ${money(r.margin)}</small>${conversion}</div>`;
  }

  function rowMarkup(currency,item,index){
    const label=currency==='USD'?'Costo USD':'Costo Bs';
    const placeholder=currency==='USD'?'Ej. 5.90':'Ej. 35';
    return `<article class="r139-quote-row" data-r139-row="${esc(item.id)}" data-r139-currency="${currency}">
      <div class="r139-row-number">${index+1}</div>
      <div class="r139-row-fields">
        <label><span>Producto / cantidad</span><input type="text" maxlength="120" placeholder="Ej. 🟢 30 Gemas" value="${esc(item.name)}" data-r139-name></label>
        <label><span>${label}</span><input type="number" min="0.01" max="10000" step="0.01" inputmode="decimal" placeholder="${placeholder}" value="${esc(item.cost)}" data-r139-cost></label>
      </div>
      <div data-r139-result>${resultMarkup(item,currency)}</div>
      <div class="r139-row-actions">
        <button class="primary" type="button" data-r139-copy ${item.result?.ok?'':'disabled'}>📋 Copiar</button>
        <button class="secondary" type="button" data-r139-remove>Quitar</button>
      </div>
    </article>`;
  }

  function currencyMarkup(currency){
    const isUsd=currency==='USD';
    const title=isUsd?'Cotización en dólares':'Cotización en bolivianos';
    const subtitle=isUsd?'Escribe el costo que te cobra la página/proveedor en USD. Se convierte con la tasa operativa vigente y después se añade el margen de la tienda.':'Escribe el costo de compra en bolivianos. Se añade directamente el margen vigente de la tienda.';
    return `<section class="r139-currency-card" data-r139-currency-card="${currency}">
      <div class="r139-currency-head"><div><span class="eyebrow">${currency}</span><h3>${title}</h3><p>${subtitle}</p></div><span class="badge ok">${isUsd?'USD → Bs':'Bs'}</span></div>
      <div class="r139-rate" data-r139-rate="${currency}">${rateMarkup(currency)}</div>
      <div class="r139-rows" data-r139-rows="${currency}">${state[currency].map((item,index)=>rowMarkup(currency,item,index)).join('')}</div>
      <div class="r139-section-actions">
        <button class="primary" type="button" data-r139-add="${currency}">＋ Agregar producto</button>
        <button class="secondary" type="button" data-r139-copy-all="${currency}">📋 Copiar todos</button>
      </div>
    </section>`;
  }

  function render(){
    const host=$('quotationsList');
    if(!host)return;
    host.innerHTML=`<div class="r139-quote-grid">${currencyMarkup('BS')}${currencyMarkup('USD')}</div>`;
  }

  function refreshRow(currency,item){
    const row=document.querySelector(`[data-r139-row="${CSS.escape(item.id)}"][data-r139-currency="${currency}"]`);
    if(!row)return;
    const result=row.querySelector('[data-r139-result]');
    if(result)result.innerHTML=resultMarkup(item,currency);
    const copy=row.querySelector('[data-r139-copy]');
    if(copy)copy.disabled=!item.result?.ok;
    const rate=document.querySelector(`[data-r139-rate="${currency}"]`);
    if(rate)rate.innerHTML=rateMarkup(currency);
  }

  async function calculate(currency,item){
    const cost=Number(item.cost);
    if(!Number.isFinite(cost)||cost<=0||cost>10000){
      item.result=null;
      item.error=item.cost?'Costo inválido. Usa un valor mayor que 0.':'';
      refreshRow(currency,item);
      return;
    }
    item.error='';item.result=null;
    const requestId=++requestCounter;item.requestId=requestId;
    refreshRow(currency,item);
    try{
      const data=await rpc('admin_app_quote_sale_price',{p_cost:cost,p_currency:currency});
      if(item.requestId!==requestId)return;
      if(!data?.ok)throw new Error('QUOTE_FAILED');
      item.result=data;
      if(currency==='USD'){
        usdRate=Number(data.fx);
        usdRawRate=data.fx_raw==null?null:Number(data.fx_raw);
        usdBuffer=data.fx_buffer==null?null:Number(data.fx_buffer);
      }
      refreshRow(currency,item);
    }catch(error){
      if(item.requestId!==requestId)return;
      const messages={ADMIN_APP_FORBIDDEN:'Acceso administrativo rechazado.',INVALID_COST:'Costo inválido.',USD_RATE_UNAVAILABLE:'No hay cotización USD vigente.',UNSUPPORTED_CURRENCY:'Moneda no compatible.'};
      item.error=messages[error?.message]||'No se pudo calcular la cotización.';
      refreshRow(currency,item);
    }
  }

  function scheduleCalculate(currency,item,delay=260){
    const key=`${currency}:${item.id}`;
    window.clearTimeout(quoteTimers.get(key));
    quoteTimers.set(key,window.setTimeout(()=>calculate(currency,item),delay));
  }

  async function loadUsdRate(){
    if(Number.isFinite(Number(usdRate)))return;
    try{
      const data=await rpc('admin_app_quote_sale_price',{p_cost:1,p_currency:'USD'});
      if(data?.ok){
        usdRate=Number(data.fx);
        usdRawRate=data.fx_raw==null?null:Number(data.fx_raw);
        usdBuffer=data.fx_buffer==null?null:Number(data.fx_buffer);
        const rate=document.querySelector('[data-r139-rate="USD"]');
        if(rate)rate.innerHTML=rateMarkup('USD');
      }
    }catch(error){
      const rate=document.querySelector('[data-r139-rate="USD"]');
      if(rate)rate.textContent=error?.message==='ADMIN_APP_FORBIDDEN'?'Acceso administrativo rechazado.':'No se pudo consultar el tipo de cambio USD.';
    }
  }

  function addRow(currency){
    if(state[currency].length>=30){notify('Máximo 30 productos por bloque para evitar errores.');return;}
    state[currency].push(blank());persist();render();
    if(currency==='USD')loadUsdRate();
    const rows=document.querySelector(`[data-r139-rows="${currency}"]`);
    rows?.lastElementChild?.querySelector('[data-r139-name]')?.focus();
  }

  function removeRow(currency,item){
    if(state[currency].length===1){
      item.name='';item.cost='';item.result=null;item.error='';persist();render();if(currency==='USD')loadUsdRate();return;
    }
    state[currency]=state[currency].filter((candidate)=>candidate.id!==item.id);
    persist();render();if(currency==='USD')loadUsdRate();
  }

  async function copyAll(currency){
    const lines=state[currency].map(copyLine).filter(Boolean);
    if(!lines.length){notify('Aún no hay cotizaciones calculadas para copiar.');return;}
    const ok=await copyText(lines.join('\n'));
    notify(ok?`${lines.length} cotización${lines.length===1?'':'es'} copiada${lines.length===1?'':'s'}.`:'No se pudo copiar automáticamente.');
  }

  function recalculateSaved(){
    ['BS','USD'].forEach((currency)=>state[currency].forEach((item)=>{if(item.cost)scheduleCalculate(currency,item,40);}));
  }

  function install(){
    if(installed)return;installed=true;
    render();

    document.addEventListener('input',(event)=>{
      const row=event.target.closest?.('[data-r139-row]');
      if(!row)return;
      const currency=row.dataset.r139Currency;
      const item=findItem(currency,row.dataset.r139Row);
      if(!item)return;
      if(event.target.matches('[data-r139-name]')){
        item.name=event.target.value;persist();refreshRow(currency,item);return;
      }
      if(event.target.matches('[data-r139-cost]')){
        item.cost=event.target.value;item.result=null;item.error='';persist();scheduleCalculate(currency,item);
      }
    },true);

    document.addEventListener('click',async(event)=>{
      const tab=event.target.closest?.('[data-tab="quotations"]');
      if(tab){window.setTimeout(()=>{loadUsdRate();recalculateSaved();},60);return;}

      const add=event.target.closest?.('[data-r139-add]');
      if(add){addRow(add.dataset.r139Add);return;}

      const all=event.target.closest?.('[data-r139-copy-all]');
      if(all){await copyAll(all.dataset.r139CopyAll);return;}

      const row=event.target.closest?.('[data-r139-row]');
      if(!row)return;
      const currency=row.dataset.r139Currency;
      const item=findItem(currency,row.dataset.r139Row);
      if(!item)return;

      if(event.target.closest?.('[data-r139-remove]')){removeRow(currency,item);return;}
      if(event.target.closest?.('[data-r139-copy]')){
        const text=copyLine(item);
        if(!text){notify('Primero calcula esta cotización.');return;}
        const ok=await copyText(text);notify(ok?'Cotización copiada.':'No se pudo copiar automáticamente.');
      }
    },true);

    if(panelVisible()){loadUsdRate();recalculateSaved();}
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();
