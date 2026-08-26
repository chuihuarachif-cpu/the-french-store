/* THE FRENCH STORE — R92 full private Admin PWA.
   Only the public Supabase anon key is present in the browser. Every administrative
   read/write is re-authorized server-side by admin_app_* RPCs bound to the single
   allowed account. No service-role key or provider credential is exposed. */
(() => {
  'use strict';

  const SUPABASE_URL='https://jivaaripugjdpxjvjnsu.supabase.co';
  const SUPABASE_ANON_KEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImppdmFhcmlwdWdqZHB4anZqbnN1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU2NDY3MzIsImV4cCI6MjEwMTIyMjczMn0.N60Xb1PqqPo12HdKEzPc4qCp1aFvVzwZz4VG04q_Es4';
  const DEFAULT_MAINTENANCE_MESSAGE='Temporalmente no disponible. Estamos terminando de habilitar las compras de este juego.';
  const sb=window.supabase.createClient(SUPABASE_URL,SUPABASE_ANON_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});

  let products=[];
  let topups=[];
  let bankPayments=[];
  let orders=[];
  let gamerhubState=null;
  let activeFilter='editable';
  let currentTab='overview';
  let toastTimer=null;

  const $=(id)=>document.getElementById(id);
  const esc=(value)=>String(value??'').replace(/[&<>"']/g,(char)=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[char]));
  const money=(value)=>`Bs ${Number(value||0).toLocaleString('es-BO',{minimumFractionDigits:2,maximumFractionDigits:2})}`;
  const qty=(value)=>Number(value||0).toLocaleString('es-BO',{minimumFractionDigits:2,maximumFractionDigits:4});
  const rate=(value)=>Number.isFinite(Number(value))?`Bs ${Number(value).toFixed(2)}`:'—';
  const fmtDate=(value)=>value?new Intl.DateTimeFormat('es-BO',{dateStyle:'short',timeStyle:'short'}).format(new Date(value)):'—';
  const norm=(value)=>String(value||'').toUpperCase();

  const STATUS_LABELS={PENDING:'Pendiente',APPROVED:'Aprobado',REJECTED:'Rechazado',AMBIGUOUS:'Revisión Admin',MATCHED:'Vinculado',PAID:'Pagado',PENDING_PAYMENT:'Pendiente de pago',MANUAL_REQUIRED:'Atención manual',AWAITING_CODE:'Esperando código',PROCESSING:'Procesando',DELIVERED:'Entregado',ERROR:'Error',CANCELLED:'Cancelado',REFUNDED:'Reembolsado'};
  function badge(status){
    const s=norm(status);
    const cls=['APPROVED','MATCHED','PAID','DELIVERED'].includes(s)?'ok':['REJECTED','ERROR'].includes(s)?'bad':'warn';
    return `<span class="badge ${cls}">${esc(STATUS_LABELS[s]||s||'—')}</span>`;
  }

  function showOnly(viewId){
    ['loadingView','loginView','deniedView','appView'].forEach((id)=>$(id)?.classList.toggle('hidden',id!==viewId));
    $('logoutButton')?.classList.toggle('hidden',viewId!=='appView');
  }
  function toast(message){
    const el=$('toast'); if(!el)return;
    if(toastTimer)clearTimeout(toastTimer);
    el.textContent=message; el.classList.remove('hidden');
    toastTimer=setTimeout(()=>el.classList.add('hidden'),3400);
  }
  function showLoginError(message){const el=$('loginMessage');if(!el)return;el.textContent=message;el.classList.remove('hidden')}

  async function confirmAction(title,html,confirmText='Confirmar'){
    const modal=$('confirmModal');
    $('confirmTitle').textContent=title;
    $('confirmBody').innerHTML=html;
    $('confirmAccept').textContent=confirmText;
    modal.classList.remove('hidden');
    return new Promise((resolve)=>{
      const finish=(value)=>{modal.classList.add('hidden');$('confirmAccept').onclick=null;$('confirmCancel').onclick=null;resolve(value)};
      $('confirmAccept').onclick=()=>finish(true);
      $('confirmCancel').onclick=()=>finish(false);
    });
  }
  function showInfo(title,html){
    $('infoTitle').textContent=title;$('infoBody').innerHTML=html;$('infoModal').classList.remove('hidden');
  }
  function closeInfo(){$('infoModal').classList.add('hidden');$('infoBody').innerHTML=''}

  async function loginWithGoogle(){
    const button=$('googleLogin');button.disabled=true;button.textContent='Conectando con Google…';$('loginMessage').classList.add('hidden');
    try{const{error}=await sb.auth.signInWithOAuth({provider:'google',options:{redirectTo:`${location.origin}/admin/`}});if(error)throw error}
    catch{showLoginError('No se pudo iniciar sesión con Google. Intenta nuevamente.');button.disabled=false;button.textContent='G  Continuar con Google'}
  }
  async function logout(){await sb.auth.signOut();products=[];topups=[];bankPayments=[];orders=[];gamerhubState=null;showOnly('loginView')}

  async function verifyPrivateAccess(){
    const{data:sessionData}=await sb.auth.getSession();const session=sessionData?.session;
    if(!session){showOnly('loginView');return false}
    const{data,error}=await sb.rpc('admin_app_is_allowed');
    if(error||data!==true){showOnly('deniedView');return false}
    $('adminSessionEmail').textContent=session.user?.email||'';
    showOnly('appView');
    await Promise.all([loadProducts(),loadDashboard()]);
    return true;
  }

  async function rpc(name,args){
    const result=await sb.rpc(name,args);
    if(result.error)throw result.error;
    return result.data;
  }

  async function loadDashboard(){
    const host=$('overviewList');if(host)host.innerHTML='<article class="summary-card"><span>Cargando…</span></article>';
    try{
      const d=await rpc('admin_app_dashboard');
      if(!host)return;
      host.innerHTML=[
        ['Wallet pendiente',d?.wallet_pending||0,'Solicitudes por aprobar/rechazar'],
        ['ACH por revisar',d?.ach_review||0,'Pagos ambiguos'],
        ['Pedidos a gestionar',d?.orders_attention||0,'Pagados/manuales/en proceso/error'],
        ['Pedidos hoy',d?.orders_today||0,'Creados desde medianoche'],
        ['GamerHub cargado',`${qty(d?.gamerhub_loaded_usdt)} USDT`,'Total histórico registrado'],
        ['GamerHub disponible',`${qty(d?.gamerhub_balance_usdt)} USDT`,'Saldo contable actual'],
        ['GamerHub consumido',`${qty(d?.gamerhub_consumed_usdt)} USDT`,'Compras + ajustes'],
        ['Capital restante',money(d?.gamerhub_cost_total_bob),'Costo contable del saldo actual']
      ].map(([label,value,small])=>`<article class="summary-card"><span>${esc(label)}</span><strong>${esc(value)}</strong><small>${esc(small)}</small></article>`).join('');
    }catch(error){if(host)host.innerHTML=`<article class="card"><small>${esc(error.message||'No se pudo cargar el resumen.')}</small></article>`}
  }

  async function loadProducts(){
    try{const data=await rpc('admin_app_list_products');products=Array.isArray(data)?data:[];renderMaintenance();renderPrices()}
    catch(error){toast(error.message==='ADMIN_APP_FORBIDDEN'?'Acceso administrativo rechazado.':'No se pudo cargar el catálogo administrativo.')}
  }

  function groupedAccountGames(){
    const map=new Map();
    products.filter((p)=>p.activo===true&&p.maintenance_editable===true).forEach((p)=>{const key=String(p.juego||'Sin nombre');if(!map.has(key))map.set(key,[]);map.get(key).push(p)});
    return[...map.entries()].sort((a,b)=>a[0].localeCompare(b[0],'es',{sensitivity:'base'}));
  }
  function renderMaintenance(){
    const host=$('maintenanceList');if(!host)return;
    const groups=groupedAccountGames();
    host.innerHTML=groups.length?groups.map(([game,items])=>{
      const enabled=items.filter((p)=>p.mantenimiento===true).length;
      const all=enabled===items.length&&items.length>0;const mixed=enabled>0&&!all;
      const ids=items.map((p)=>Number(p.id)).filter(Number.isSafeInteger).join(',');
      return `<article class="card"><div class="card-top"><div><b>${esc(game)}</b><small>${items.length} producto${items.length===1?'':'s'} · Recargas por Cuenta</small></div><span class="badge ${all||mixed?'warn':'ok'}">${all?'EN MANTENIMIENTO':mixed?'MIXTO':'DISPONIBLE'}</span></div><div class="card-actions"><button class="${all?'secondary':'primary'}" type="button" data-maintenance-ids="${ids}" data-maintenance-enable="${all?'0':'1'}" data-game="${esc(game)}">${all?'Reactivar juego':'Poner en mantenimiento'}</button></div></article>`;
    }).join(''):'<article class="card"><small>No hay juegos activos de Recargas por Cuenta.</small></article>';
    host.querySelectorAll('[data-maintenance-ids]').forEach((button)=>button.addEventListener('click',()=>toggleMaintenance(button)));
  }
  async function toggleMaintenance(button){
    const ids=String(button.dataset.maintenanceIds||'').split(',').map(Number).filter((id)=>Number.isSafeInteger(id)&&id>0);const enable=button.dataset.maintenanceEnable==='1';const game=button.dataset.game||'este juego';if(!ids.length)return;
    const accepted=await confirmAction(enable?'Poner en mantenimiento':'Reactivar juego',`<p><b>${esc(game)}</b></p><p>${enable?'Los productos seguirán visibles, pero no podrán comprarse hasta que los reactives.':'Los productos volverán a poder comprarse inmediatamente.'}</p>`);if(!accepted)return;
    button.disabled=true;
    try{const data=await rpc('admin_app_set_account_game_maintenance',{p_product_ids:ids,p_enabled:enable,p_message:enable?DEFAULT_MAINTENANCE_MESSAGE:null});if(!data?.ok)throw new Error('UPDATE_FAILED');await loadProducts();toast(enable?`${game}: mantenimiento activado.`:`${game}: compras reactivadas.`)}catch(error){toast(error?.message==='ADMIN_APP_FORBIDDEN'?'Acceso rechazado.':'No se pudo cambiar el mantenimiento.');button.disabled=false}
  }

  function matchesSearch(product,query){if(!query)return true;return `${product.juego} ${product.paquete} ${product.categoria}`.toLowerCase().includes(query.toLowerCase())}
  function renderPrices(){
    const host=$('priceList');if(!host)return;
    const query=$('priceSearch')?.value.trim()||'';
    const list=products.filter((p)=>p.activo===true).filter((p)=>activeFilter==='all'||p.price_editable===true).filter((p)=>matchesSearch(p,query));
    host.innerHTML=list.length?list.map((p)=>{
      const editable=p.price_editable===true;
      const weekly=String(p.juego).toLowerCase().startsWith('mobile legends')&&String(p.paquete).toLowerCase().includes('pase semanal');
      const reason=editable?(p.categoria==='Recargas por Cuenta'?'Recarga por Cuenta · precio manual administrable':'Precio fijo administrable'):weekly?'Regla de precio protegida':'Precio gestionado por proveedor o fórmula';
      return `<article class="card"><div class="card-top"><div><b>${esc(p.juego)}</b><small>${esc(p.paquete)} · ${esc(p.categoria)}</small><small>${esc(reason)}</small></div><span class="badge ${editable?'ok':'lock'}">${editable?'EDITABLE':'PROTEGIDO'}</span></div><div class="card-actions"><input type="number" min="0.50" max="5000" step="0.01" inputmode="decimal" value="${Number(p.precio).toFixed(2)}" ${editable?'':'disabled'}><button class="${editable?'primary':'secondary'}" type="button" data-price-id="${p.id}" ${editable?'':'disabled'}>${editable?'Guardar precio':'Bloqueado'}</button></div></article>`;
    }).join(''):'<article class="card"><small>No hay productos que coincidan con este filtro.</small></article>';
    host.querySelectorAll('[data-price-id]').forEach((button)=>button.addEventListener('click',()=>savePrice(button)));
  }
  async function savePrice(button){
    const id=Number(button.dataset.priceId);const product=products.find((p)=>Number(p.id)===id);const input=button.parentElement?.querySelector('input');const next=Number(input?.value);
    if(!product||product.price_editable!==true||!Number.isFinite(next)||next<0.5||next>5000){toast('Escribe un precio válido entre Bs 0,50 y Bs 5.000.');return}
    const old=Number(product.precio);if(Math.abs(old-next)<.001){toast('El precio nuevo es igual al actual.');return}
    const accepted=await confirmAction('Confirmar cambio de precio',`<p><b>${esc(product.juego)} — ${esc(product.paquete)}</b></p><p><span class="price-change"><span class="old">${money(old)}</span><span class="new">→ ${money(next)}</span></span></p><p>El cambio se aplicará a pedidos nuevos.</p>`);if(!accepted)return;
    button.disabled=true;
    try{const data=await rpc('admin_app_set_fixed_price',{p_product_id:id,p_new_price:next});if(!data?.ok)throw new Error('UPDATE_FAILED');await loadProducts();toast(`${product.juego}: precio actualizado a ${money(next)}.`)}catch(error){const map={ADMIN_APP_FORBIDDEN:'Acceso administrativo rechazado.',PROVIDER_MANAGED_PRICE:'Este precio está gestionado por proveedor o fórmula.',PRICE_RULE_MANAGED:'Este producto tiene una regla de precio protegida.',INVALID_PRICE:'El precio no es válido.'};toast(map[error?.message]||'No se pudo guardar el precio.');button.disabled=false}
  }

  async function loadWallet(){
    const host=$('walletAdminList');host.innerHTML='<article class="card"><small>Cargando solicitudes…</small></article>';
    try{const data=await rpc('admin_app_list_wallet_topups',{p_limit:100});topups=Array.isArray(data)?data:[];renderWallet()}
    catch(error){host.innerHTML=`<article class="card"><small>${esc(error.message||'No se pudo cargar Wallet.')}</small></article>`}
  }
  function renderWallet(){
    const host=$('walletAdminList');
    host.innerHTML=topups.length?topups.map((t)=>`<article class="card ${t.status==='PENDING'?'attention':''}"><div class="card-top"><div><b>${money(t.amount)} · ${esc(t.payment_reference||'Sin referencia')}</b><small>${esc(t.customer_email||'Sin correo')} · ${fmtDate(t.created_at)}</small></div>${badge(t.status)}</div><div class="meta"><span>Método: ${esc(t.payment_method||'—')}</span>${t.reviewed_at?`<span>Revisado: ${fmtDate(t.reviewed_at)}</span>`:''}${t.expires_at?`<span>Expira: ${fmtDate(t.expires_at)}</span>`:''}</div>${t.status==='PENDING'?`<div class="card-actions"><button class="primary" data-topup-action="APPROVE" data-id="${t.id}">Aprobar</button><button class="danger-btn" data-topup-action="REJECT" data-id="${t.id}">Rechazar</button></div>`:''}</article>`).join(''):'<article class="card"><small>No hay solicitudes Wallet registradas.</small></article>';
    host.querySelectorAll('[data-topup-action]').forEach((button)=>button.addEventListener('click',()=>reviewTopup(button)));
  }
  async function reviewTopup(button){
    const action=button.dataset.topupAction;const id=button.dataset.id;const item=topups.find((x)=>x.id===id);const accepted=await confirmAction(action==='APPROVE'?'Aprobar carga Wallet':'Rechazar carga Wallet',`<p><b>${item?money(item.amount):''}</b> · ${esc(item?.payment_reference||'')}</p><p>${action==='APPROVE'?'El saldo se acreditará según la lógica existente de Wallet.':'La solicitud quedará rechazada.'}</p>`,action==='APPROVE'?'Aprobar':'Rechazar');if(!accepted)return;
    button.disabled=true;
    try{await rpc('admin_app_review_wallet_topup',{p_request_id:id,p_action:action});await Promise.all([loadWallet(),loadDashboard()]);toast(action==='APPROVE'?'Carga Wallet aprobada.':'Carga Wallet rechazada.')}
    catch(error){toast(error.message||'No se pudo revisar la solicitud.');button.disabled=false}
  }

  async function loadAch(){
    const host=$('achList');host.innerHTML='<article class="card"><small>Cargando pagos ACH…</small></article>';
    try{const data=await rpc('admin_app_list_bank_payments',{p_limit:100});bankPayments=Array.isArray(data)?data:[];renderAch()}
    catch(error){host.innerHTML=`<article class="card"><small>${esc(error.message||'No se pudieron cargar los pagos.')}</small></article>`}
  }
  function renderAch(){
    const host=$('achList');
    host.innerHTML=bankPayments.length?bankPayments.map((p)=>`<article class="card ${p.match_status==='AMBIGUOUS'?'attention':''}"><div class="card-top"><div><b>${money(p.amount)} · ${esc(p.origin_name||'Origen no identificado')}</b><small>${esc(p.origin_bank||'')} · ACH ${esc(p.ach_order_number||'—')} · ${fmtDate(p.transaction_at||p.created_at)}</small></div>${badge(p.match_status)}</div><div class="meta"><span>${esc(p.match_reason||'Sin observación')}</span>${p.matched_payment_reference?`<span>Vinculado: ${esc(p.matched_payment_reference)}</span>`:''}${p.applied_at?`<span>Aplicado: ${fmtDate(p.applied_at)}</span>`:''}</div>${p.match_status==='AMBIGUOUS'?`<div class="card-actions"><button class="primary" data-match-payment="${p.id}">Vincular a solicitud Wallet</button></div>`:''}</article>`).join(''):'<article class="card"><small>No hay pagos ACH registrados.</small></article>';
    host.querySelectorAll('[data-match-payment]').forEach((button)=>button.addEventListener('click',()=>matchPayment(button.dataset.matchPayment)));
  }
  async function matchPayment(eventId){
    if(!topups.length)await loadWallet();
    const pending=topups.filter((t)=>t.status==='PENDING');
    if(!pending.length){toast('No hay solicitudes Wallet pendientes para vincular.');return}
    const options=pending.map((t)=>`<option value="${t.id}">${esc(t.payment_reference||'Sin ref')} · ${money(t.amount)} · ${esc(t.customer_email||'')}</option>`).join('');
    const accepted=await confirmAction('Vincular pago ACH',`<p>Elige la solicitud Wallet correcta.</p><label>Solicitud<select id="matchTopupSelect">${options}</select></label>`,'Vincular');if(!accepted)return;
    const requestId=$('matchTopupSelect')?.value;if(!requestId)return;
    try{await rpc('admin_app_match_bank_payment',{p_event_id:eventId,p_request_id:requestId});await Promise.all([loadAch(),loadWallet(),loadDashboard()]);toast('Pago ACH vinculado correctamente.')}
    catch(error){toast(error.message||'No se pudo vincular el pago.')}
  }

  async function loadOrdersAdmin(){
    const host=$('ordersAdminList');host.innerHTML='<article class="card"><small>Cargando pedidos…</small></article>';
    try{const data=await rpc('admin_app_list_orders',{p_limit:100});orders=Array.isArray(data)?data:[];renderOrders()}
    catch(error){host.innerHTML=`<article class="card"><small>${esc(error.message||'No se pudieron cargar los pedidos.')}</small></article>`}
  }
  function orderNeedsActions(order){return!['PENDING_PAYMENT','DELIVERED','CANCELLED','REFUNDED'].includes(norm(order.status))}
  function renderOrders(){
    const host=$('ordersAdminList');
    host.innerHTML=orders.length?orders.map((o)=>{
      const s=norm(o.status);const attention=['PAID','MANUAL_REQUIRED','AWAITING_CODE','PROCESSING','ERROR'].includes(s);
      const canData=['PAID','MANUAL_REQUIRED','PROCESSING','ERROR'].includes(s);
      const actions=[];
      if(orderNeedsActions(o)&&s!=='PROCESSING')actions.push(`<button data-order-status="PROCESSING" data-id="${o.id}">Procesando</button>`);
      if(orderNeedsActions(o)&&s!=='DELIVERED')actions.push(`<button class="primary" data-order-status="DELIVERED" data-id="${o.id}">Entregado</button>`);
      if(orderNeedsActions(o)&&s!=='ERROR')actions.push(`<button class="danger-btn" data-order-status="ERROR" data-id="${o.id}">Error</button>`);
      if(canData)actions.push(`<button data-order-data="${o.id}">Datos recarga</button>`);
      return `<article class="card ${attention?'attention':''}"><div class="card-top"><div><b>${esc(o.order_code)} · ${money(o.total_amount)}</b><small>${esc(o.customer_email||'Sin correo')} · ${esc(o.payment_method||'—')} · ${fmtDate(o.created_at)}</small></div>${badge(o.status)}</div><div class="meta">${o.paid_at?`<span>Pagado: ${fmtDate(o.paid_at)}</span>`:''}${o.processing_at?`<span>Procesando: ${fmtDate(o.processing_at)}</span>`:''}${o.delivered_at?`<span>Entregado: ${fmtDate(o.delivered_at)}</span>`:''}${o.admin_note?`<span>Nota: ${esc(o.admin_note)}</span>`:''}</div>${actions.length?`<div class="card-actions">${actions.join('')}</div>`:''}</article>`;
    }).join(''):'<article class="card"><small>No hay pedidos registrados.</small></article>';
    host.querySelectorAll('[data-order-status]').forEach((button)=>button.addEventListener('click',()=>updateOrderStatus(button)));
    host.querySelectorAll('[data-order-data]').forEach((button)=>button.addEventListener('click',()=>openOrderData(button.dataset.orderData)));
  }
  async function updateOrderStatus(button){
    const id=button.dataset.id;const status=button.dataset.orderStatus;const order=orders.find((x)=>x.id===id);
    const accepted=await confirmAction(`Marcar ${STATUS_LABELS[status]||status}`,`<p><b>${esc(order?.order_code||'Pedido')}</b></p><label>Nota Admin (opcional)<textarea id="orderAdminNote" rows="3" maxlength="300" placeholder="Ej. Entrega confirmada"></textarea></label>`,'Guardar estado');if(!accepted)return;
    const note=$('orderAdminNote')?.value.trim()||null;
    button.disabled=true;
    try{await rpc('admin_app_update_order_status',{p_order_id:id,p_new_status:status,p_admin_note:note});await Promise.all([loadOrdersAdmin(),loadDashboard()]);toast('Estado del pedido actualizado.')}
    catch(error){toast(error.message||'No se pudo actualizar el pedido.');button.disabled=false}
  }
  async function openOrderData(orderId){
    showInfo('Datos de recarga','<article class="card"><small>Cargando datos privados…</small></article>');
    try{const data=await rpc('admin_app_get_order_fulfillment_inputs',{p_order_id:orderId});const rows=Array.isArray(data)?data:[];
      $('infoBody').innerHTML=rows.length?rows.map((row)=>{
        const inputs=row?.input_values&&typeof row.input_values==='object'&&!Array.isArray(row.input_values)?row.input_values:{};
        const labels={user_id:'ID de usuario',player_id:'Player ID',zone_id:'Zone ID',server:'Servidor / región'};
        const fields=Object.entries(inputs).filter(([key])=>labels[key]).map(([key,value])=>`<div class="row"><span>${esc(labels[key])}</span><strong>${esc(value)}</strong></div>`).join('');
        return `<article class="card"><b>${esc(row.product_name||`Producto ${row.product_id||''}`)}</b><div class="private-data">${fields||'<div class="row"><span>Sin identificadores reconocidos</span></div>'}</div><small>Validación: ${esc(row.validation_status||'Pendiente')}</small></article>`;
      }).join(''):'<article class="card"><small>Este pedido no tiene datos de recarga guardados.</small></article>';
    }catch(error){$('infoBody').innerHTML=`<article class="card"><small>${esc(error.message||'No se pudieron cargar los datos.')}</small></article>`}
  }

  async function loadGamerhub(){
    const host=$('gamerhubList');host.innerHTML='<article class="card"><small>Cargando inventario GamerHub…</small></article>';
    try{gamerhubState=await rpc('admin_app_gamerhub_state');renderGamerhub()}
    catch(error){host.innerHTML=`<article class="card"><small>${esc(error.message||'No se pudo cargar GamerHub.')}</small></article>`}
  }
  function renderGamerhub(){
    const s=gamerhubState||{};const history=Array.isArray(s.history)?s.history:[];const host=$('gamerhubList');
    host.innerHTML=`<div class="summary-grid">
      <article class="summary-card"><span>Total cargado</span><strong>${qty(s.total_loaded_usdt)} USDT</strong><small>${money(s.total_loaded_bob)} invertidos históricamente</small></article>
      <article class="summary-card"><span>Saldo actual</span><strong>${qty(s.balance_usdt)} USDT</strong><small>Saldo contable registrado</small></article>
      <article class="summary-card"><span>Total consumido</span><strong>${qty(s.total_consumed_usdt)} USDT</strong><small>Compras automáticas + ajustes</small></article>
      <article class="summary-card"><span>Capital restante</span><strong>${money(s.cost_total_bob)}</strong><small>Costo contable del saldo actual</small></article>
      <article class="summary-card"><span>Costo medio</span><strong>${rate(s.average_rate_bob)}</strong><small>por USDT</small></article>
      <article class="summary-card"><span>Binance RAW</span><strong>${rate(s.binance_raw_bob)}</strong><small>sin Bs 0,25</small></article>
      <article class="summary-card"><span>Tasa usada</span><strong>${rate(s.effective_rate_bob)}</strong><small>máx. mercado/costo medio</small></article>
      <article class="summary-card"><span>Protección costo</span><strong>${s.protection_active?'ACTIVA':'NO'}</strong><small>${s.protection_active?'Tu costo medio es el piso.':'Binance está igual o arriba.'}</small></article>
    </div>
    <article class="card"><b>Registrar USDT añadidos a GamerHub</b><small>Registra únicamente capital realmente comprado/acreditado. No realiza ningún depósito.</small><div class="form-grid"><label><span>USDT añadidos</span><input id="ghAddAmount" type="number" min="0.01" max="100000" step="0.01" inputmode="decimal" placeholder="Ej. 50"></label><label><span>Costo real Bs/USDT</span><input id="ghAddRate" type="number" min="1" max="100" step="0.01" inputmode="decimal" placeholder="Ej. 11.62"></label><label class="wide"><span>Nota opcional</span><input id="ghAddNote" type="text" maxlength="120" placeholder="Ej. Binance P2P agosto"></label></div><div class="card-actions"><button class="primary" id="ghAddButton" type="button">Registrar USDT</button></div></article>
    <article class="card"><b>Ajuste manual excepcional</b><small>El consumo normal ya es automático. Úsalo solo para reconciliar compras manuales o corregir el saldo contable.</small><div class="card-actions"><input id="ghConsumeAmount" type="number" min="0.01" max="100000" step="0.01" inputmode="decimal" placeholder="USDT a descontar"><button id="ghConsumeButton" type="button">Registrar ajuste</button></div></article>
    <div class="history-section"><h3>MOVIMIENTOS RECIENTES</h3>${history.length?history.map((h)=>`<article class="card"><div class="card-top"><div><b>${h.operation==='PURCHASE'?'+':'−'}${qty(h.amount_usdt)} USDT · ${h.operation==='PURCHASE'?'Entrada':'Salida'}</b><small>${fmtDate(h.created_at)}</small></div><span class="badge ${h.operation==='PURCHASE'?'ok':'warn'}">${esc(h.operation)}</span></div><div class="meta"><span>${rate(h.rate_bob)}/USDT</span><span>${money(h.total_bob)}</span>${h.note?`<span>${esc(h.note)}</span>`:''}</div></article>`).join(''):'<article class="card"><small>Sin movimientos registrados.</small></article>'}</div>`;
    $('ghAddButton').addEventListener('click',addGamerhubBalance);$('ghConsumeButton').addEventListener('click',consumeGamerhubBalance);
  }
  async function addGamerhubBalance(){
    const amount=Number($('ghAddAmount')?.value);const acquisitionRate=Number($('ghAddRate')?.value);const note=$('ghAddNote')?.value.trim()||null;
    if(!(amount>0)||!(acquisitionRate>=1)){toast('Completa USDT y costo real por USDT.');return}
    const accepted=await confirmAction('Registrar USDT GamerHub',`<p><b>${qty(amount)} USDT</b> a ${rate(acquisitionRate)}/USDT</p><p>Total contable: <b>${money(amount*acquisitionRate)}</b></p>`,'Registrar');if(!accepted)return;
    try{await rpc('admin_app_gamerhub_add',{p_usdt:amount,p_rate_bob:acquisitionRate,p_note:note});await Promise.all([loadGamerhub(),loadDashboard()]);toast('USDT registrados en el inventario GamerHub.')}
    catch(error){toast(error.message||'No se pudo registrar el saldo.')}
  }
  async function consumeGamerhubBalance(){
    const amount=Number($('ghConsumeAmount')?.value);if(!(amount>0)){toast('Escribe un monto válido.');return}
    const accepted=await confirmAction('Ajuste manual GamerHub',`<p>Descontar <b>${qty(amount)} USDT</b> del saldo contable registrado.</p><p>El consumo automático normal no necesita este ajuste.</p>`,'Descontar');if(!accepted)return;
    try{await rpc('admin_app_gamerhub_consume',{p_usdt:amount,p_note:'Ajuste manual desde Admin privado'});await Promise.all([loadGamerhub(),loadDashboard()]);toast('Ajuste GamerHub registrado.')}
    catch(error){toast(error.message||'No se pudo registrar el ajuste.')}
  }

  async function loadHistory(){
    const host=$('historyList');host.innerHTML='<article class="card"><small>Cargando historial…</small></article>';
    try{
      const [priceRows]=await Promise.all([
        rpc('admin_app_price_history',{p_limit:30}),
        topups.length?Promise.resolve(topups):loadWallet(),
        bankPayments.length?Promise.resolve(bankPayments):loadAch(),
        orders.length?Promise.resolve(orders):loadOrdersAdmin(),
        gamerhubState?Promise.resolve(gamerhubState):loadGamerhub()
      ]);
      const prices=Array.isArray(priceRows)?priceRows:[];
      const walletHistory=topups.slice(0,15);
      const achHistory=bankPayments.slice(0,15);
      const orderHistory=orders.slice(0,15);
      const ghHistory=Array.isArray(gamerhubState?.history)?gamerhubState.history.slice(0,12):[];
      host.innerHTML=`
        <div class="history-section"><h3>FRENCH WALLET</h3>${walletHistory.map((t)=>`<article class="card"><div class="card-top"><div><b>${money(t.amount)} · ${esc(t.payment_reference||'Sin referencia')}</b><small>${esc(t.customer_email||'')} · ${fmtDate(t.created_at)}${t.reviewed_at?` · revisado ${fmtDate(t.reviewed_at)}`:''}</small></div>${badge(t.status)}</div></article>`).join('')||'<article class="card"><small>Sin historial Wallet.</small></article>'}</div>
        <div class="history-section"><h3>PAGOS ACH</h3>${achHistory.map((p)=>`<article class="card"><div class="card-top"><div><b>${money(p.amount)} · ${esc(p.origin_name||'Origen no identificado')}</b><small>ACH ${esc(p.ach_order_number||'—')} · ${fmtDate(p.transaction_at||p.created_at)}</small></div>${badge(p.match_status)}</div></article>`).join('')||'<article class="card"><small>Sin historial ACH.</small></article>'}</div>
        <div class="history-section"><h3>PEDIDOS</h3>${orderHistory.map((o)=>`<article class="card"><div class="card-top"><div><b>${esc(o.order_code)} · ${money(o.total_amount)}</b><small>${esc(o.customer_email||'')} · ${fmtDate(o.created_at)}</small></div>${badge(o.status)}</div></article>`).join('')||'<article class="card"><small>Sin pedidos.</small></article>'}</div>
        <div class="history-section"><h3>CAMBIOS DE PRECIO</h3>${prices.map((row)=>`<article class="card history-row"><div><b>${esc(row.juego)}</b><small>${esc(row.paquete)} · ${fmtDate(row.changed_at)}</small></div><div class="price-change"><span class="old">${money(row.old_price)}</span><span class="new">→ ${money(row.new_price)}</span></div></article>`).join('')||'<article class="card"><small>Sin cambios de precio desde esta app.</small></article>'}</div>
        <div class="history-section"><h3>GAMERHUB</h3>${ghHistory.map((h)=>`<article class="card"><div class="card-top"><div><b>${h.operation==='PURCHASE'?'+':'−'}${qty(h.amount_usdt)} USDT</b><small>${fmtDate(h.created_at)} · ${esc(h.note||'')}</small></div><span class="badge ${h.operation==='PURCHASE'?'ok':'warn'}">${esc(h.operation)}</span></div></article>`).join('')||'<article class="card"><small>Sin movimientos GamerHub.</small></article>'}</div>`;
    }catch(error){host.innerHTML=`<article class="card"><small>${esc(error.message||'No se pudo cargar el historial.')}</small></article>`}
  }

  async function loadTab(name){
    if(name==='overview')return loadDashboard();
    if(name==='wallet')return loadWallet();
    if(name==='ach')return loadAch();
    if(name==='orders')return loadOrdersAdmin();
    if(name==='maintenance')return loadProducts();
    if(name==='prices')return loadProducts();
    if(name==='gamerhub')return loadGamerhub();
    if(name==='history')return loadHistory();
  }
  async function selectTab(name){
    currentTab=name;
    document.querySelectorAll('[data-tab]').forEach((button)=>button.classList.toggle('active',button.dataset.tab===name));
    document.querySelectorAll('[data-panel]').forEach((panel)=>panel.classList.toggle('hidden',panel.dataset.panel!==name));
    await loadTab(name);
  }

  function bindUi(){
    $('googleLogin').addEventListener('click',loginWithGoogle);
    $('logoutButton').addEventListener('click',logout);
    $('deniedLogout').addEventListener('click',logout);
    $('infoClose').addEventListener('click',closeInfo);
    $('infoModal').addEventListener('click',(event)=>{if(event.target===$('infoModal'))closeInfo()});
    document.querySelectorAll('[data-tab]').forEach((button)=>button.addEventListener('click',()=>selectTab(button.dataset.tab)));
    document.querySelectorAll('[data-refresh]').forEach((button)=>button.addEventListener('click',async()=>{await loadTab(button.dataset.refresh);toast('Datos actualizados.')}));
    $('priceSearch').addEventListener('input',renderPrices);
    $('priceFilters').querySelectorAll('[data-filter]').forEach((button)=>button.addEventListener('click',()=>{activeFilter=button.dataset.filter;$('priceFilters').querySelectorAll('[data-filter]').forEach((item)=>item.classList.toggle('active',item===button));renderPrices()}));
  }

  async function boot(){
    bindUi();
    if('serviceWorker'in navigator)navigator.serviceWorker.register('./sw.js?v=20260826-r92').catch(()=>{});
    try{
      await verifyPrivateAccess();
      sb.auth.onAuthStateChange((_event,session)=>{setTimeout(()=>{if(!session)showOnly('loginView');else verifyPrivateAccess().catch(()=>showOnly('deniedView'))},0)});
    }catch{showOnly('loginView');showLoginError('No se pudo comprobar la sesión. Revisa tu conexión e intenta nuevamente.')}
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
