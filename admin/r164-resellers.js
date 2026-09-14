/* THE FRENCH STORE — R166 private reseller control center.
   Admin only adds an email. Number, rank and monthly progression are automatic.
   The storefront receives final prices only; internal rank economics stay private. */
(() => {
  'use strict';

  const VERSION='r166-resellers-20260913';
  const $=id=>document.getElementById(id);
  const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#039;'}[char]));
  const money=value=>`Bs ${Number(value||0).toLocaleString('es-BO',{minimumFractionDigits:2,maximumFractionDigits:2})}`;
  const date=value=>value?new Intl.DateTimeFormat('es-BO',{dateStyle:'short',timeStyle:'short'}).format(new Date(value)):'—';
  const resellerNo=value=>`#${String(Number(value||0)).padStart(4,'0')}`;
  let rows=[];
  let installed=false;
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
      .r164-add{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px;align-items:end}
      .r164-add label{display:grid;gap:6px}.r164-add input{width:100%;box-sizing:border-box}
      .r164-metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin:0 0 12px}
      .r164-metric{border:1px solid rgba(91,203,255,.2);border-radius:14px;padding:12px;background:rgba(5,20,32,.58)}
      .r164-metric small{display:block}.r164-metric b{display:block;font-size:1.08rem;margin-top:4px}
      .r164-private{border:1px solid rgba(91,203,255,.22);border-radius:14px;padding:12px;background:rgba(9,25,39,.72);margin-bottom:14px}
      .r164-private b{color:#9eefff}.r164-search{margin:10px 0 14px}.r164-search input{width:100%}
      .r164-activity{margin-top:18px}.r164-items{display:grid;gap:6px;margin-top:8px}.r164-item{font-size:.9rem;opacity:.9}
      .r164-level{font-weight:800;color:#9eefff}.r164-number{font-weight:800;letter-spacing:.06em}
      @media(min-width:900px){.r164-grid{grid-template-columns:minmax(330px,.72fr) minmax(0,1.28fr)}}
      @media(max-width:680px){.r164-add{grid-template-columns:1fr}.r164-metrics{grid-template-columns:repeat(2,minmax(0,1fr))}}
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
        <div class="panel-head"><div><span class="eyebrow">REVENDEDORES</span><h2>Control automático</h2><p>Solo agrega el correo. El sistema asigna número, nivel y progreso mensual automáticamente.</p></div><button id="resellerRefresh" class="icon-btn" type="button" aria-label="Actualizar">↻</button></div>
        <div class="r164-private"><b>Reglas automáticas:</b> todo revendedor nuevo inicia en Bronce. Sube a Plata desde Bs 150 de compras del mes y a Oro desde Bs 300. Si termina un mes sin ninguna compra, baja un nivel. La tienda pública solo muestra su precio final.</div>
        <div class="r164-grid">
          <article class="card">
            <div class="card-top"><div><b>Agregar revendedor</b><small>El correo debe ser exactamente el que usa para iniciar sesión.</small></div><span class="badge ok">AUTOMÁTICO</span></div>
            <div class="r164-add">
              <label><span>Correo del revendedor</span><input id="resellerEmail" type="email" autocomplete="off" placeholder="cliente@gmail.com"></label>
              <button id="resellerSave" class="primary" type="button">Añadir</button>
            </div>
            <small>El número de revendedor y el nivel se generan solos. No necesitas configurar porcentajes ni escalas por persona.</small>
          </article>
          <div><div id="resellerMetrics" class="r164-metrics"></div><label class="search r164-search"><span>Buscar</span><input id="resellerSearch" type="search" placeholder="Correo, número o nivel" autocomplete="off"></label><div id="resellerList" class="list"></div></div>
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

  function renderMetrics(){
    const active=rows.filter(r=>r.active).length;
    const month=rows.reduce((s,r)=>s+Number(r.month_spend||0),0);
    const orders=rows.reduce((s,r)=>s+Number(r.order_count||0),0);
    const gold=rows.filter(r=>r.active&&Number(r.rank_level)===3).length;
    const host=$('resellerMetrics');
    if(host)host.innerHTML=[['Activos',active],['Compras del mes',money(month)],['Pedidos',orders],['Nivel Oro',gold]].map(([k,v])=>`<div class="r164-metric"><small>${esc(k)}</small><b>${esc(v)}</b></div>`).join('');
  }

  function rankName(row){
    return row.rank_name||({1:'Bronce',2:'Plata',3:'Oro'}[Number(row.rank_level)]||'Bronce');
  }

  function render(){
    renderMetrics();
    const host=$('resellerList');
    if(!host)return;
    const q=String($('resellerSearch')?.value||'').trim().toLowerCase();
    const list=rows.filter(r=>{
      const haystack=`${r.email||''} ${r.reseller_number||''} ${rankName(r)}`.toLowerCase();
      return !q||haystack.includes(q);
    });
    host.innerHTML=list.length?list.map(r=>{
      const target=r.next_level_target==null?'Nivel máximo':`Siguiente nivel: ${money(r.next_level_target)}/mes`;
      return `<article class="card ${r.active?'':'attention'}">
        <div class="card-top"><div><b><span class="r164-number">${esc(resellerNo(r.reseller_number))}</span> · ${esc(r.email)}</b><small><span class="r164-level">${esc(rankName(r))}</span> · ${r.active?'Activo':'Pausado'} · última compra ${esc(date(r.last_order_at))}</small></div><span class="badge ${r.active?'ok':'warn'}">${esc(rankName(r).toUpperCase())}</span></div>
        <div class="meta"><span>Este mes: ${esc(money(r.month_spend))}</span><span>Mes anterior: ${esc(money(r.previous_month_spend))}</span><span>${esc(target)}</span><span>Total: ${esc(money(r.lifetime_spend))}</span><span>Pedidos: ${esc(r.order_count)}</span></div>
        <div class="card-actions"><button type="button" data-reseller-activity="${esc(r.email)}">Ver actividad</button><button class="${r.active?'danger-btn':'secondary'}" type="button" data-reseller-toggle="${esc(r.email)}">${r.active?'Pausar':'Reactivar'}</button></div>
      </article>`;
    }).join(''):'<article class="card"><small>No hay revendedores que coincidan.</small></article>';
    host.querySelectorAll('[data-reseller-toggle]').forEach(b=>b.addEventListener('click',()=>toggle(b.dataset.resellerToggle)));
    host.querySelectorAll('[data-reseller-activity]').forEach(b=>b.addEventListener('click',()=>activity(b.dataset.resellerActivity)));
  }

  async function save(){
    const input=$('resellerEmail');
    const email=String(input?.value||'').trim().toLowerCase();
    if(!email.includes('@'))return notify('Escribe un correo válido.');
    const button=$('resellerSave');button.disabled=true;
    try{
      const data=await rpc('admin_app_add_reseller',{p_email:email});
      notify(`Revendedor ${resellerNo(data?.reseller_number)} añadido en nivel ${data?.rank_name||'Bronce'}.`);
      input.value='';
      await load();
    }catch(error){
      const messages={ADMIN_APP_FORBIDDEN:'Acceso rechazado.',INVALID_EMAIL:'El correo no es válido.'};
      notify(messages[error?.message]||'No se pudo añadir el revendedor.');
    }finally{button.disabled=false;}
  }

  async function toggle(email){
    const row=rows.find(x=>String(x.email).toLowerCase()===String(email).toLowerCase());
    if(!row)return;
    try{
      await rpc('admin_app_set_reseller_active',{p_email:row.email,p_active:!row.active});
      notify(row.active?'Revendedor pausado.':'Revendedor reactivado.');
      await load();
    }catch{notify('No se pudo cambiar el estado.');}
  }

  async function activity(email){
    const host=$('resellerActivity');if(!host)return;
    host.innerHTML=`<article class="card"><b>${esc(email)}</b><small>Cargando actividad…</small></article>`;
    try{
      const data=await rpc('admin_app_reseller_orders_v2',{p_email:email,p_limit:50});
      const orders=Array.isArray(data)?data:[];
      host.innerHTML=`<div class="panel-head"><div><span class="eyebrow">ACTIVIDAD</span><h2>${esc(email)}</h2><p>Últimos ${orders.length} pedidos.</p></div><button id="resellerActivityClose" type="button">Cerrar</button></div>${orders.length?orders.map(o=>`<article class="card"><div class="card-top"><div><b>${esc(o.order_code)} · ${esc(money(o.total_amount))}</b><small>${esc(date(o.created_at))} · ${esc(o.payment_method||'—')}</small></div><span class="badge">${esc(o.status||'—')}</span></div><div class="r164-items">${(Array.isArray(o.items)?o.items:[]).map(i=>`<div class="r164-item">${esc(i.quantity)} × ${esc(i.name)} · ${esc(money(i.total_price))}</div>`).join('')||'<small>Sin detalle de productos.</small>'}</div></article>`).join(''):'<article class="card"><small>Este revendedor todavía no tiene pedidos.</small></article>'}`;
      $('resellerActivityClose')?.addEventListener('click',()=>{host.innerHTML='';});
      host.scrollIntoView({behavior:'smooth',block:'start'});
    }catch{host.innerHTML='<article class="card"><small>No se pudo cargar la actividad.</small></article>';}
  }

  async function load(){
    const host=$('resellerList');if(host)host.innerHTML='<article class="card"><small>Cargando revendedores…</small></article>';
    try{const data=await rpc('admin_app_list_resellers');rows=Array.isArray(data)?data:[];render();}
    catch(error){if(host)host.innerHTML=`<article class="card"><small>${esc(error?.message||'No se pudieron cargar los revendedores.')}</small></article>`;}
  }

  function install(){
    if(installed)return;injectStyle();if(!ensureUi())return;installed=true;
    $('resellerSave')?.addEventListener('click',save);
    $('resellerEmail')?.addEventListener('keydown',event=>{if(event.key==='Enter'){event.preventDefault();save();}});
    $('resellerRefresh')?.addEventListener('click',()=>load().catch(()=>{}));
    $('resellerSearch')?.addEventListener('input',render);
  }

  window.FSAdminResellers=Object.freeze({version:VERSION,reload:load});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();
