/* THE FRENCH STORE — R164 private reseller control center.
   Reseller rules stay in /admin/. The public storefront receives final prices only. */
(() => {
  'use strict';

  const VERSION='r164-resellers-20260913';
  const $=id=>document.getElementById(id);
  const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[char]));
  const money=value=>`Bs ${Number(value||0).toLocaleString('es-BO',{minimumFractionDigits:2,maximumFractionDigits:2})}`;
  const date=value=>value?new Intl.DateTimeFormat('es-BO',{dateStyle:'short',timeStyle:'short'}).format(new Date(value)):'—';
  const num=(id,fallback=0)=>{const n=Number($(id)?.value);return Number.isFinite(n)?n:fallback};
  let rows=[];
  let installed=false;
  let editingEmail='';
  let clientPromise=null;

  async function client(){
    if(clientPromise)return clientPromise;
    clientPromise=(async()=>{
      const script=[...document.scripts].find(s=>/\/admin\/app\.js(?:\?|$)/.test(s.src));
      if(!script)throw new Error('ADMIN_RUNTIME_NOT_FOUND');
      const source=await fetch(script.src,{cache:'no-store'}).then(r=>{if(!r.ok)throw new Error('ADMIN_RUNTIME_LOAD_FAILED');return r.text()});
      const url=source.match(/const SUPABASE_URL='([^']+)'/)?.[1];
      const key=source.match(/const SUPABASE_ANON_KEY='([^']+)'/)?.[1];
      if(!url||!key)throw new Error('ADMIN_RUNTIME_CONFIG_NOT_FOUND');
      return window.supabase.createClient(url,key,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
    })();
    return clientPromise;
  }

  async function rpc(name,args){
    const sb=await client();
    const {data,error}=await sb.rpc(name,args);
    if(error)throw error;
    return data;
  }

  function notify(message){
    const toast=$('toast');
    if(!toast)return;
    toast.textContent=message;
    toast.classList.remove('hidden');
    clearTimeout(notify.timer);
    notify.timer=setTimeout(()=>toast.classList.add('hidden'),3600);
  }

  function injectStyle(){
    if($('r164ResellerStyle'))return;
    const style=document.createElement('style');
    style.id='r164ResellerStyle';
    style.textContent=`
      .r164-grid{display:grid;grid-template-columns:minmax(0,1fr);gap:14px}
      .r164-form{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
      .r164-form label{display:grid;gap:6px}.r164-form .wide{grid-column:1/-1}
      .r164-form input,.r164-form textarea,.r164-form select{width:100%;box-sizing:border-box}
      .r164-metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin:0 0 12px}
      .r164-metric{border:1px solid rgba(91,203,255,.2);border-radius:14px;padding:12px;background:rgba(5,20,32,.58)}
      .r164-metric small{display:block}.r164-metric b{display:block;font-size:1.08rem;margin-top:4px}
      .r164-private{border:1px solid rgba(91,203,255,.22);border-radius:14px;padding:12px;background:rgba(9,25,39,.72);margin-bottom:14px}
      .r164-private b{color:#9eefff}.r164-search{margin:10px 0 14px}.r164-search input{width:100%}
      .r164-activity{margin-top:18px}.r164-items{display:grid;gap:6px;margin-top:8px}.r164-item{font-size:.9rem;opacity:.9}
      .r164-level{font-weight:700;color:#9eefff}
      @media(min-width:900px){.r164-grid{grid-template-columns:minmax(330px,.8fr) minmax(0,1.2fr)}}
      @media(max-width:680px){.r164-form{grid-template-columns:1fr}.r164-form .wide{grid-column:auto}.r164-metrics{grid-template-columns:repeat(2,minmax(0,1fr))}}
    `;
    document.head.appendChild(style);
  }

  function ensureUi(){
    const nav=document.querySelector('.tabs');
    const app=$('appView');
    if(!nav||!app)return false;
    let button=document.querySelector('[data-tab="resellers"]');
    if(!button){
      button=document.createElement('button');
      button.type='button';
      button.dataset.tab='resellers';
      button.textContent='🤝 Revendedores';
      nav.insertBefore(button,document.querySelector('[data-tab="history"]')||null);
    }
    if(!$('resellersPanel')){
      const panel=document.createElement('section');
      panel.id='resellersPanel';
      panel.className='panel hidden';
      panel.dataset.panel='resellers';
      panel.innerHTML=`
        <div class="panel-head"><div><span class="eyebrow">REVENDEDORES</span><h2>Control privado</h2><p>Autoriza correos, ajusta niveles internos y revisa compras. Esta configuración no aparece en la tienda pública.</p></div><button id="resellerRefresh" class="icon-btn" type="button" aria-label="Actualizar">↻</button></div>
        <div class="r164-private"><b>Regla privada:</b> el revendedor solo ve su precio final. La tienda nunca muestra porcentajes ni explica cuánto de tu margen se cedió.</div>
        <div class="r164-grid">
          <article class="card">
            <div class="card-top"><div><b id="resellerFormTitle">Activar revendedor</b><small>El correo debe coincidir con el usado para iniciar sesión.</small></div></div>
            <div class="r164-form">
              <label class="wide"><span>Correo</span><input id="resellerEmail" type="email" autocomplete="off" placeholder="cliente@gmail.com"></label>
              <label><span>Nivel base · porción del margen (%)</span><input id="resellerBaseShare" type="number" min="0" max="60" step="1" value="40"></label>
              <label><span>Estado</span><select id="resellerActive"><option value="1">Activo</option><option value="0">Pausado</option></select></label>
              <label><span>Sube de nivel desde (Bs/mes)</span><input id="resellerTier2Spend" type="number" min="0" step="1" value="150"></label>
              <label><span>Nivel intermedio · porción del margen (%)</span><input id="resellerTier2Share" type="number" min="0" max="60" step="1" value="50"></label>
              <label><span>Nivel máximo desde (Bs/mes)</span><input id="resellerTier3Spend" type="number" min="0" step="1" value="300"></label>
              <label><span>Nivel máximo · porción del margen (%)</span><input id="resellerTier3Share" type="number" min="0" max="60" step="1" value="60"></label>
              <label class="wide"><span>Nota interna</span><textarea id="resellerNotes" rows="3" maxlength="500" placeholder="Ej. Primer revendedor"></textarea></label>
            </div>
            <div class="card-actions"><button id="resellerSave" class="primary" type="button">Guardar revendedor</button><button id="resellerClear" type="button">Limpiar</button></div>
          </article>
          <div><div id="resellerMetrics" class="r164-metrics"></div><label class="search r164-search"><span>Buscar</span><input id="resellerSearch" type="search" placeholder="Correo" autocomplete="off"></label><div id="resellerList" class="list"></div></div>
        </div>
        <div id="resellerActivity" class="r164-activity"></div>`;
      app.insertBefore(panel,$('historyPanel')||null);
    }
    button.addEventListener('click',()=>{
      document.querySelectorAll('[data-tab]').forEach(b=>b.classList.toggle('active',b===button));
      document.querySelectorAll('[data-panel]').forEach(p=>p.classList.toggle('hidden',p.id!=='resellersPanel'));
      load().catch(()=>{});
    });
    return true;
  }

  function levelOf(r){
    const current=Number(r.current_margin_share||0);
    if(current>=Number(r.tier3_margin_share||0)-0.00001)return 'Máximo';
    if(current>=Number(r.tier2_margin_share||0)-0.00001)return 'Intermedio';
    return 'Base';
  }

  function renderMetrics(){
    const active=rows.filter(r=>r.active).length;
    const month=rows.reduce((s,r)=>s+Number(r.month_spend||0),0);
    const lifetime=rows.reduce((s,r)=>s+Number(r.lifetime_spend||0),0);
    const orders=rows.reduce((s,r)=>s+Number(r.order_count||0),0);
    const host=$('resellerMetrics');
    if(host)host.innerHTML=[['Activos',active],['Compras del mes',money(month)],['Histórico',money(lifetime)],['Pedidos',orders]].map(([k,v])=>`<div class="r164-metric"><small>${esc(k)}</small><b>${esc(v)}</b></div>`).join('');
  }

  function render(){
    renderMetrics();
    const host=$('resellerList');
    if(!host)return;
    const q=String($('resellerSearch')?.value||'').trim().toLowerCase();
    const list=rows.filter(r=>!q||String(r.email||'').toLowerCase().includes(q));
    host.innerHTML=list.length?list.map(r=>`
      <article class="card ${r.active?'':'attention'}"><div class="card-top"><div><b>${esc(r.email)}</b><small><span class="r164-level">Nivel ${esc(levelOf(r))}</span> · ${r.active?'Activo':'Pausado'} · última compra ${esc(date(r.last_order_at))}</small></div><span class="badge ${r.active?'ok':'warn'}">${r.active?'ACTIVO':'PAUSADO'}</span></div><div class="meta"><span>Este mes: ${esc(money(r.month_spend))}</span><span>Total: ${esc(money(r.lifetime_spend))}</span><span>Pedidos: ${esc(r.order_count)}</span></div><div class="card-actions"><button class="primary" type="button" data-reseller-edit="${esc(r.email)}">Editar</button><button type="button" data-reseller-activity="${esc(r.email)}">Ver actividad</button><button class="${r.active?'danger-btn':'secondary'}" type="button" data-reseller-toggle="${esc(r.email)}">${r.active?'Pausar':'Reactivar'}</button></div></article>`).join(''):'<article class="card"><small>No hay revendedores que coincidan.</small></article>';
    host.querySelectorAll('[data-reseller-edit]').forEach(b=>b.addEventListener('click',()=>edit(b.dataset.resellerEdit)));
    host.querySelectorAll('[data-reseller-toggle]').forEach(b=>b.addEventListener('click',()=>toggle(b.dataset.resellerToggle)));
    host.querySelectorAll('[data-reseller-activity]').forEach(b=>b.addEventListener('click',()=>activity(b.dataset.resellerActivity)));
  }

  function reset(){
    editingEmail='';
    $('resellerFormTitle').textContent='Activar revendedor';
    $('resellerEmail').value='';$('resellerEmail').disabled=false;$('resellerActive').value='1';
    $('resellerBaseShare').value='40';$('resellerTier2Spend').value='150';$('resellerTier2Share').value='50';$('resellerTier3Spend').value='300';$('resellerTier3Share').value='60';$('resellerNotes').value='';
  }

  function edit(email){
    const r=rows.find(x=>String(x.email).toLowerCase()===String(email).toLowerCase());
    if(!r)return;
    editingEmail=r.email;$('resellerFormTitle').textContent='Editar revendedor';$('resellerEmail').value=r.email;$('resellerEmail').disabled=true;$('resellerActive').value=r.active?'1':'0';
    $('resellerBaseShare').value=Math.round(Number(r.base_margin_share||0)*100);$('resellerTier2Spend').value=Number(r.tier2_monthly_spend||0);$('resellerTier2Share').value=Math.round(Number(r.tier2_margin_share||0)*100);$('resellerTier3Spend').value=Number(r.tier3_monthly_spend||0);$('resellerTier3Share').value=Math.round(Number(r.tier3_margin_share||0)*100);$('resellerNotes').value=r.notes||'';
    $('resellerEmail').scrollIntoView({behavior:'smooth',block:'center'});
  }

  async function save(){
    const email=String(editingEmail||$('resellerEmail')?.value||'').trim().toLowerCase();
    const base=num('resellerBaseShare')/100,t2s=num('resellerTier2Spend'),t2=num('resellerTier2Share')/100,t3s=num('resellerTier3Spend'),t3=num('resellerTier3Share')/100;
    if(!email.includes('@'))return notify('Escribe un correo válido.');
    if([base,t2,t3].some(v=>v<0||v>0.60)||base>t2||t2>t3)return notify('Los niveles internos deben subir de forma ordenada y no superar el máximo permitido.');
    if(t2s<0||t3s<t2s)return notify('Los límites mensuales no son válidos.');
    const button=$('resellerSave');button.disabled=true;
    try{
      await rpc('admin_app_upsert_reseller',{p_email:email,p_active:$('resellerActive').value==='1',p_base_margin_share:base,p_tier2_monthly_spend:t2s,p_tier2_margin_share:t2,p_tier3_monthly_spend:t3s,p_tier3_margin_share:t3,p_notes:String($('resellerNotes').value||'').trim()||null});
      notify('Revendedor guardado.');reset();await load();
    }catch(error){notify(error?.message==='ADMIN_APP_FORBIDDEN'?'Acceso rechazado.':'No se pudo guardar el revendedor.');}
    finally{button.disabled=false;}
  }

  async function toggle(email){
    const r=rows.find(x=>String(x.email).toLowerCase()===String(email).toLowerCase());
    if(!r)return;
    try{
      await rpc('admin_app_upsert_reseller',{p_email:r.email,p_active:!r.active,p_base_margin_share:Number(r.base_margin_share),p_tier2_monthly_spend:Number(r.tier2_monthly_spend),p_tier2_margin_share:Number(r.tier2_margin_share),p_tier3_monthly_spend:Number(r.tier3_monthly_spend),p_tier3_margin_share:Number(r.tier3_margin_share),p_notes:r.notes||null});
      notify(r.active?'Revendedor pausado.':'Revendedor reactivado.');await load();
    }catch{notify('No se pudo cambiar el estado.');}
  }

  async function activity(email){
    const host=$('resellerActivity');if(!host)return;
    host.innerHTML=`<article class="card"><b>${esc(email)}</b><small>Cargando actividad…</small></article>`;
    try{
      const data=await rpc('admin_app_reseller_orders_v2',{p_email:email,p_limit:50});
      const orders=Array.isArray(data)?data:[];
      host.innerHTML=`<div class="panel-head"><div><span class="eyebrow">ACTIVIDAD</span><h2>${esc(email)}</h2><p>Últimos ${orders.length} pedidos.</p></div><button id="resellerActivityClose" type="button">Cerrar</button></div>${orders.length?orders.map(o=>`<article class="card"><div class="card-top"><div><b>${esc(o.order_code)} · ${esc(money(o.total_amount))}</b><small>${esc(date(o.created_at))} · ${esc(o.payment_method||'—')}</small></div><span class="badge">${esc(o.status||'—')}</span></div><div class="r164-items">${(Array.isArray(o.items)?o.items:[]).map(i=>`<div class="r164-item">${esc(i.quantity)} × ${esc(i.name)} · ${esc(money(i.total_price))}</div>`).join('')||'<small>Sin detalle de productos.</small>'}</div></article>`).join(''):'<article class="card"><small>Este revendedor todavía no tiene pedidos.</small></article>'}`;
      $('resellerActivityClose')?.addEventListener('click',()=>{host.innerHTML='';});host.scrollIntoView({behavior:'smooth',block:'start'});
    }catch{host.innerHTML='<article class="card"><small>No se pudo cargar la actividad.</small></article>';}
  }

  async function load(){
    const host=$('resellerList');if(host)host.innerHTML='<article class="card"><small>Cargando revendedores…</small></article>';
    try{const data=await rpc('admin_app_list_resellers');rows=Array.isArray(data)?data:[];render();}
    catch(error){if(host)host.innerHTML=`<article class="card"><small>${esc(error?.message||'No se pudieron cargar los revendedores.')}</small></article>`;}
  }

  function install(){
    if(installed)return;injectStyle();if(!ensureUi())return;installed=true;
    $('resellerSave')?.addEventListener('click',save);$('resellerClear')?.addEventListener('click',reset);$('resellerRefresh')?.addEventListener('click',()=>load().catch(()=>{}));$('resellerSearch')?.addEventListener('input',render);reset();
  }

  window.FSAdminResellers=Object.freeze({version:VERSION,reload:load});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();
