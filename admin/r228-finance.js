/* THE FRENCH STORE — R228 private finance dashboard. */
(() => {
  'use strict';
  const VERSION='r228-finance-20260919';
  const $=id=>document.getElementById(id);
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  const money=v=>'Bs '+Number(v||0).toLocaleString('es-BO',{minimumFractionDigits:2,maximumFractionDigits:2});
  const num=v=>Number(v||0);
  const pad=v=>String(v).padStart(2,'0');
  const iso=d=>d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());
  const today=()=>iso(new Date());
  const CAT={SUPPLIERS:'Proveedores',ADVERTISING:'Publicidad',SOFTWARE:'Software y suscripciones',BANK_FEES:'Comisiones bancarias',OPERATIONS:'Operación',TAXES:'Impuestos',OTHER:'Otros'};
  let installed=false,clientPromise=null,summary={},expenses=[],editingId=null,deleteId=null,deleteTimer=null;

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
  async function rpc(name,args={}){const sb=await client();const r=await sb.rpc(name,args);if(r.error)throw r.error;return r.data}
  function notify(msg){const t=$('toast');if(!t)return;t.textContent=msg;t.classList.remove('hidden');clearTimeout(notify.timer);notify.timer=setTimeout(()=>t.classList.add('hidden'),3500)}

  function injectStyle(){
    if($('r228FinanceStyle'))return;
    const s=document.createElement('style');s.id='r228FinanceStyle';
    s.textContent='.r228-toolbar{display:flex;gap:10px;align-items:end;flex-wrap:wrap;margin:0 0 14px}.r228-toolbar label{display:grid;gap:6px;min-width:150px}.r228-toolbar select,.r228-toolbar input,.r228-form input,.r228-form select,.r228-form textarea{width:100%;box-sizing:border-box}.r228-custom{display:flex;gap:10px;flex-wrap:wrap;align-items:end}.r228-custom.hidden{display:none}.r228-metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin-bottom:14px}.r228-metric{border:1px solid rgba(91,203,255,.2);border-radius:14px;padding:13px;background:rgba(5,20,32,.62);min-width:0}.r228-metric small{display:block;color:#90a9b9}.r228-metric b{display:block;font-size:1.16rem;margin-top:5px;overflow-wrap:anywhere}.r228-metric em{display:block;font-style:normal;font-size:.78rem;margin-top:4px;color:#7f9aab}.r228-metric.good b{color:#8af0b1}.r228-metric.bad b{color:#ff9e9e}.r228-layout{display:grid;grid-template-columns:minmax(0,1.2fr) minmax(300px,.8fr);gap:14px;align-items:start}.r228-subgrid{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-top:14px}.r228-card{border:1px solid rgba(91,203,255,.18);border-radius:16px;background:rgba(5,18,29,.58);padding:14px}.r228-card h3{margin:0 0 5px}.r228-card>small{display:block;margin-bottom:12px}.r228-note{border:1px solid rgba(255,205,99,.28);background:rgba(255,205,99,.08);border-radius:12px;padding:10px 12px;margin-bottom:14px;color:#ead9a6}.r228-note.hidden{display:none}.r228-form{display:grid;grid-template-columns:1fr 1fr;gap:10px}.r228-form label{display:grid;gap:6px}.r228-form .wide{grid-column:1/-1}.r228-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}.r228-actions .hidden{display:none}.r228-expenses{display:grid;gap:8px}.r228-expense{border-top:1px solid rgba(91,203,255,.15);padding-top:10px}.r228-expense:first-child{border-top:0;padding-top:0}.r228-expense-top{display:flex;justify-content:space-between;gap:12px}.r228-expense-top>span{text-align:right}.r228-expense-actions{display:flex;gap:6px;flex-wrap:wrap;margin-top:8px}.r228-table{width:100%;border-collapse:collapse;font-size:.87rem}.r228-table th,.r228-table td{padding:9px 8px;border-bottom:1px solid rgba(91,203,255,.12);text-align:left;vertical-align:top}.r228-table th{color:#9cb3c1}.r228-table .num{text-align:right;white-space:nowrap}.r228-empty{padding:12px;border:1px dashed rgba(91,203,255,.2);border-radius:12px;color:#8fa8b9}.r228-loading{opacity:.7;pointer-events:none}@media(max-width:900px){.r228-metrics{grid-template-columns:repeat(2,minmax(0,1fr))}.r228-layout,.r228-subgrid{grid-template-columns:1fr}}@media(max-width:560px){.r228-form{grid-template-columns:1fr}.r228-form .wide{grid-column:auto}.r228-toolbar,.r228-custom{display:grid;grid-template-columns:1fr;width:100%}.r228-custom.hidden{display:none}.r228-toolbar label{min-width:0}.r228-expense-top{display:block}.r228-expense-top>span{display:block;text-align:left;margin-top:5px}}';
    document.head.appendChild(s);
  }

  function ensureUi(){
    const nav=document.querySelector('.tabs'),app=$('appView');if(!nav||!app)return false;
    let b=document.querySelector('[data-tab="finance"]');
    if(!b){b=document.createElement('button');b.type='button';b.dataset.tab='finance';b.textContent='💰 Finanzas';nav.insertBefore(b,document.querySelector('[data-tab="maintenance"]')||document.querySelector('[data-tab="history"]')||null)}
    if(!$('financePanel')){
      const p=document.createElement('section');p.id='financePanel';p.className='panel hidden';p.dataset.panel='finance';
      p.innerHTML=[
        '<div class="panel-head"><div><span class="eyebrow">FINANZAS</span><h2>Ingresos, costos y ganancia</h2><p>Las ventas se toman de pedidos pagados. Los costos de producto quedan congelados y los demás gastos los registras aquí.</p></div><button id="financeRefresh" class="icon-btn" type="button" aria-label="Actualizar">↻</button></div>',
        '<div class="r228-toolbar"><label><span>Periodo</span><select id="financePeriod"><option value="today">Hoy</option><option value="7d">Últimos 7 días</option><option value="month" selected>Este mes</option><option value="previous-month">Mes anterior</option><option value="year">Este año</option><option value="custom">Personalizado</option></select></label><div id="financeCustomDates" class="r228-custom hidden"><label><span>Desde</span><input id="financeFrom" type="date"></label><label><span>Hasta</span><input id="financeTo" type="date"></label><button id="financeApplyDates" class="secondary" type="button">Aplicar</button></div></div>',
        '<div id="financeLegacyNote" class="r228-note hidden"></div><div id="financeMetrics" class="r228-metrics"></div>',
        '<div class="r228-layout"><article class="r228-card"><h3>Productos con mayor ganancia</h3><small>Calculado usando el costo congelado de cada venta.</small><div id="financeTopProducts"></div></article>',
        '<article class="r228-card"><h3>Registrar gasto</h3><small>Publicidad, suscripciones, comisiones u otros gastos fuera de los pedidos.</small><div class="r228-form">',
        '<label class="wide"><span>Descripción</span><input id="financeExpenseDescription" maxlength="160" placeholder="Ej. ChatGPT Plus"></label>',
        '<label><span>Categoría</span><select id="financeExpenseCategory"><option value="SOFTWARE">Software y suscripciones</option><option value="ADVERTISING">Publicidad</option><option value="SUPPLIERS">Proveedores</option><option value="BANK_FEES">Comisiones bancarias</option><option value="OPERATIONS">Operación</option><option value="TAXES">Impuestos</option><option value="OTHER">Otros</option></select></label>',
        '<label><span>Fecha</span><input id="financeExpenseDate" type="date"></label><label><span>Monto</span><input id="financeExpenseAmount" type="number" min="0.01" step="0.01" inputmode="decimal" placeholder="0.00"></label>',
        '<label><span>Moneda</span><select id="financeExpenseCurrency"><option value="BOB">Bolivianos (Bs)</option><option value="USD">Dólares (USD)</option></select></label>',
        '<label id="financeFxWrap" class="wide hidden"><span>Tipo de cambio USD → Bs</span><input id="financeExpenseFx" type="number" min="0.01" step="0.01" inputmode="decimal"><small>Se sugiere el tipo de cambio de la tienda; puedes cambiarlo por el cobrado por tu banco.</small></label>',
        '<label class="wide"><span>Nota opcional</span><textarea id="financeExpenseNotes" rows="2" maxlength="800"></textarea></label></div>',
        '<div class="r228-actions"><button id="financeExpenseSave" class="primary" type="button">Guardar gasto</button><button id="financeExpenseCancel" class="secondary hidden" type="button">Cancelar edición</button></div></article></div>',
        '<div class="r228-subgrid"><article class="r228-card"><h3>Gastos del periodo</h3><small id="financeExpenseSubtitle">Movimientos manuales.</small><div id="financeExpenseList" class="r228-expenses"></div></article><article class="r228-card"><h3>Resumen del periodo</h3><small>Comparación con el periodo inmediatamente anterior.</small><div id="financeComparison"></div></article></div>'
      ].join('');
      app.insertBefore(p,$('historyPanel')||null);
    }
    if(!b.dataset.r228Bound){b.dataset.r228Bound='1';b.addEventListener('click',()=>{document.querySelectorAll('[data-tab]').forEach(x=>x.classList.toggle('active',x===b));document.querySelectorAll('[data-panel]').forEach(x=>x.classList.toggle('hidden',x.id!=='financePanel'));load()})}
    return true;
  }

  function setPeriod(v){
    const n=new Date();let f=new Date(n.getFullYear(),n.getMonth(),1),t=new Date(n.getFullYear(),n.getMonth()+1,0);
    if(v==='today'){f=new Date(n.getFullYear(),n.getMonth(),n.getDate());t=new Date(f)}
    if(v==='7d'){t=new Date(n.getFullYear(),n.getMonth(),n.getDate());f=new Date(t);f.setDate(f.getDate()-6)}
    if(v==='previous-month'){f=new Date(n.getFullYear(),n.getMonth()-1,1);t=new Date(n.getFullYear(),n.getMonth(),0)}
    if(v==='year'){f=new Date(n.getFullYear(),0,1);t=new Date(n.getFullYear(),11,31)}
    $('financeFrom').value=iso(f);$('financeTo').value=iso(t);
  }
  const range=()=>({from:$('financeFrom')?.value||today(),to:$('financeTo')?.value||today()});
  function delta(c,p){c=num(c);p=num(p);if(!p)return c?'Sin base anterior':'Sin cambio';const x=(c-p)/Math.abs(p)*100;return (x>0?'+':'')+x.toFixed(1)+'% vs periodo anterior'}

  function renderMetrics(){
    const h=$('financeMetrics'),p=summary.previous||{};if(!h)return;
    const cards=[
      ['💵 Ventas',money(summary.sales_bob),delta(summary.sales_bob,p.sales_bob),''],
      ['📦 Costo de productos',money(summary.product_cost_bob),(summary.order_count||0)+' pedido(s)',''],
      ['🧾 Otros gastos',money(summary.other_expenses_bob),'Gastos manuales del periodo',''],
      ['📈 Ganancia neta',money(summary.net_profit_bob),delta(summary.net_profit_bob,p.net_profit_bob),num(summary.net_profit_bob)>=0?'good':'bad'],
      ['🟢 Ganancia bruta',money(summary.gross_profit_bob),'Ventas menos costo de productos',num(summary.gross_profit_bob)>=0?'good':'bad'],
      ['🛒 Ticket promedio',money(summary.average_ticket_bob),(summary.order_count||0)+' ventas pagadas',''],
      ['📊 Margen neto',num(summary.net_margin_pct).toFixed(2)+'%','Sobre las ventas',''],
      ['💱 USD → Bs','Bs '+num(summary.usd_bob_rate).toFixed(2),'Sugerencia para gastos USD','']
    ];
    h.innerHTML=cards.map(x=>'<div class="r228-metric '+x[3]+'"><small>'+esc(x[0])+'</small><b>'+esc(x[1])+'</b><em>'+esc(x[2])+'</em></div>').join('');
    const note=$('financeLegacyNote'),n=Number(summary.estimated_cost_items||0);note.classList.toggle('hidden',!n);note.innerHTML=n?'<b>Dato histórico:</b> '+n+' artículo(s) anteriores a este módulo usan el margen que ya guardaba la tienda para estimar su costo. Las ventas nuevas guardan el costo de compra directamente.':'';
    const c=$('financeComparison');if(c)c.innerHTML='<table class="r228-table"><tbody><tr><td>Ventas periodo anterior</td><td class="num">'+esc(money(p.sales_bob))+'</td></tr><tr><td>Ganancia neta anterior</td><td class="num">'+esc(money(p.net_profit_bob))+'</td></tr><tr><td>Pedidos actuales</td><td class="num">'+esc(summary.order_count||0)+'</td></tr><tr><td>Pedidos anteriores</td><td class="num">'+esc(p.order_count||0)+'</td></tr></tbody></table>';
  }

  function renderTop(){
    const h=$('financeTopProducts'),rows=Array.isArray(summary.top_products)?summary.top_products:[];if(!h)return;
    if(!rows.length){h.innerHTML='<div class="r228-empty">No hay productos vendidos en este periodo.</div>';return}
    h.innerHTML='<div style="overflow-x:auto"><table class="r228-table"><thead><tr><th>Producto</th><th class="num">Cant.</th><th class="num">Ventas</th><th class="num">Ganancia</th></tr></thead><tbody>'+rows.map(r=>'<tr><td>'+esc(r.product)+'</td><td class="num">'+esc(r.quantity)+'</td><td class="num">'+esc(money(r.revenue_bob))+'</td><td class="num">'+esc(money(r.profit_bob))+'</td></tr>').join('')+'</tbody></table></div>';
  }

  function renderExpenses(){
    const h=$('financeExpenseList');if(!h)return;const total=expenses.reduce((s,r)=>s+num(r.amount_bob),0);$('financeExpenseSubtitle').textContent=expenses.length+' movimiento(s) · '+money(total);
    if(!expenses.length){h.innerHTML='<div class="r228-empty">No registraste otros gastos en este periodo.</div>';return}
    h.innerHTML=expenses.map(r=>{const orig=r.currency==='USD'?'$ '+num(r.amount).toFixed(2)+' · TC '+num(r.fx_rate_to_bob).toFixed(2):money(r.amount),armed=deleteId===r.id;return '<div class="r228-expense"><div class="r228-expense-top"><div><b>'+esc(r.description)+'</b><small>'+esc(CAT[r.category]||r.category)+' · '+esc(r.spent_at)+(r.notes?' · '+esc(r.notes):'')+'</small></div><span><b>'+esc(money(r.amount_bob))+'</b><small>'+esc(orig)+'</small></span></div><div class="r228-expense-actions"><button type="button" data-fedit="'+esc(r.id)+'">Editar</button><button class="'+(armed?'danger-btn':'secondary')+'" type="button" data-fdelete="'+esc(r.id)+'">'+(armed?'Confirmar eliminar':'Eliminar')+'</button></div></div>'}).join('');
    h.querySelectorAll('[data-fedit]').forEach(b=>b.addEventListener('click',()=>edit(b.dataset.fedit)));h.querySelectorAll('[data-fdelete]').forEach(b=>b.addEventListener('click',()=>armDelete(b.dataset.fdelete)));
  }

  function fxVisibility(){const usd=$('financeExpenseCurrency').value==='USD';$('financeFxWrap').classList.toggle('hidden',!usd);if(usd&&!$('financeExpenseFx').value&&summary.usd_bob_rate)$('financeExpenseFx').value=num(summary.usd_bob_rate).toFixed(2)}
  function resetForm(){editingId=null;$('financeExpenseDescription').value='';$('financeExpenseCategory').value='SOFTWARE';$('financeExpenseDate').value=today();$('financeExpenseAmount').value='';$('financeExpenseCurrency').value='BOB';$('financeExpenseFx').value=summary.usd_bob_rate?num(summary.usd_bob_rate).toFixed(2):'';$('financeExpenseNotes').value='';$('financeExpenseSave').textContent='Guardar gasto';$('financeExpenseCancel').classList.add('hidden');fxVisibility()}
  function edit(id){const r=expenses.find(x=>x.id===id);if(!r)return;editingId=id;$('financeExpenseDescription').value=r.description||'';$('financeExpenseCategory').value=r.category||'OTHER';$('financeExpenseDate').value=r.spent_at||today();$('financeExpenseAmount').value=num(r.amount).toFixed(2);$('financeExpenseCurrency').value=r.currency||'BOB';$('financeExpenseFx').value=num(r.fx_rate_to_bob||1).toFixed(2);$('financeExpenseNotes').value=r.notes||'';$('financeExpenseSave').textContent='Guardar cambios';$('financeExpenseCancel').classList.remove('hidden');fxVisibility();$('financeExpenseDescription').scrollIntoView({behavior:'smooth',block:'center'});$('financeExpenseDescription').focus()}

  async function saveExpense(){
    const desc=$('financeExpenseDescription').value.trim(),amount=Number($('financeExpenseAmount').value||0),currency=$('financeExpenseCurrency').value,fx=Number($('financeExpenseFx').value||0);
    if(!desc)return notify('Escribe una descripción del gasto.');if(!(amount>0))return notify('Escribe un monto mayor que cero.');if(currency==='USD'&&!(fx>0))return notify('Escribe el tipo de cambio.');
    const b=$('financeExpenseSave');b.disabled=true;
    try{await rpc('admin_app_finance_save_expense',{p_id:editingId,p_description:desc,p_category:$('financeExpenseCategory').value,p_amount:amount,p_currency:currency,p_fx_rate_to_bob:currency==='USD'?fx:null,p_spent_at:$('financeExpenseDate').value||today(),p_notes:$('financeExpenseNotes').value.trim()||null});notify(editingId?'Gasto actualizado.':'Gasto registrado.');resetForm();await load()}catch(e){notify(e?.message||'No se pudo guardar el gasto.')}finally{b.disabled=false}
  }
  function armDelete(id){if(deleteId!==id){deleteId=id;renderExpenses();clearTimeout(deleteTimer);deleteTimer=setTimeout(()=>{deleteId=null;renderExpenses()},4500);return}removeExpense(id)}
  async function removeExpense(id){try{await rpc('admin_app_finance_delete_expense',{p_id:id});deleteId=null;notify('Gasto eliminado.');await load()}catch(e){notify(e?.message||'No se pudo eliminar el gasto.')}}

  async function load(){
    const p=$('financePanel'),r=range();if(!p||!r.from||!r.to||r.to<r.from)return notify('Revisa el rango de fechas.');p.classList.add('r228-loading');
    try{const x=await Promise.all([rpc('admin_app_finance_summary',{p_from:r.from,p_to:r.to}),rpc('admin_app_finance_list_expenses',{p_from:r.from,p_to:r.to})]);summary=x[0]||{};expenses=Array.isArray(x[1])?x[1]:[];renderMetrics();renderTop();renderExpenses();if($('financeExpenseCurrency').value==='USD'&&!$('financeExpenseFx').value)$('financeExpenseFx').value=num(summary.usd_bob_rate).toFixed(2)}catch(e){notify(e?.message||'No se pudieron cargar las finanzas.');$('financeMetrics').innerHTML='<div class="r228-empty">No se pudieron cargar los datos financieros.</div>'}finally{p.classList.remove('r228-loading')}
  }

  function install(){
    if(installed)return;injectStyle();if(!ensureUi())return;installed=true;setPeriod('month');resetForm();
    $('financePeriod').addEventListener('change',e=>{const custom=e.target.value==='custom';$('financeCustomDates').classList.toggle('hidden',!custom);if(!custom){setPeriod(e.target.value);load()}});
    $('financeApplyDates').addEventListener('click',load);$('financeRefresh').addEventListener('click',load);$('financeExpenseCurrency').addEventListener('change',fxVisibility);$('financeExpenseSave').addEventListener('click',saveExpense);$('financeExpenseCancel').addEventListener('click',resetForm);
  }
  window.FSAdminFinance=Object.freeze({version:VERSION,reload:load});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();