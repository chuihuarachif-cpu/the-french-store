/* THE FRENCH STORE — customer orders and base Admin logic.
   The themed admin modal/private fulfillment viewer remain dedicated lazy modules. */
const LABELS={PENDING_PAYMENT:'Pendiente de pago',PAID:'Pagado',MANUAL_REQUIRED:'Requiere atención manual',AWAITING_CODE:'Esperando código',PROCESSING:'Procesando',DELIVERED:'Entregado',ERROR:'Error',PENDING:'Pendiente',APPROVED:'Aprobado',REJECTED:'Rechazado',CANCELLED:'Cancelado',AMBIGUOUS:'Revisión Admin',MATCHED:'Vinculado'};
function statusLabel(s){return LABELS[s]||String(s||'').replaceAll('_',' ')}
function statusHtml(s){const cls=['APPROVED','DELIVERED','MATCHED','PAID'].includes(s)?'ok':['ERROR','REJECTED'].includes(s)?'bad':'warn';return `<span class="status ${cls}">${esc(statusLabel(s))}</span>`}
async function loadOrders(){
  if(!session)return;
  const{data,error}=await sb.from('orders').select('id,order_code,status,payment_method,total_amount,currency,created_at,updated_at,customer_note').eq('user_id',session.user.id).order('created_at',{ascending:false}).limit(50);
  $('ordersList').innerHTML=error?`<div class="notice error">${esc(error.message)}</div>`:(data||[]).map(o=>`<div class="record"><div class="record-top"><div><b>${esc(o.order_code)}</b><small>${dateFmt(o.created_at)} · ${esc(o.payment_method)}</small></div>${statusHtml(o.status)}</div><div class="record-meta"><b>${money(o.total_amount)}</b>${o.customer_note?`<span>${esc(o.customer_note)}</span>`:''}</div></div>`).join('')||'<div class="record"><small>Aún no tienes pedidos.</small></div>';
}
async function loadAdmin(){
  if(!admin)return;
  $('adminContent').innerHTML='<div class="record"><small>Cargando…</small></div>';
  if(adminTab==='topups'){
    const{data,error}=await sb.from('wallet_topup_requests').select('id,user_id,amount,status,payment_reference,created_at,expires_at').eq('status','PENDING').order('created_at',{ascending:true}).limit(100);
    $('adminContent').innerHTML=error?err(error):(data||[]).map(t=>`<div class="record"><div class="record-top"><div><b>${money(t.amount)} · ${esc(t.payment_reference||'')}</b><small>${dateFmt(t.created_at)}</small></div>${statusHtml(t.status)}</div><div class="admin-actions"><button data-topup-action="APPROVE" data-id="${t.id}">Aprobar</button><button data-topup-action="REJECT" data-id="${t.id}">Rechazar</button></div></div>`).join('')||empty('No hay cargas pendientes.');bindAdminActions();
  }else if(adminTab==='payments'){
    const{data,error}=await sb.from('bank_payment_events').select('id,amount,currency,origin_name,origin_bank,ach_order_number,transaction_at,match_status,match_reason').eq('match_status','AMBIGUOUS').order('transaction_at',{ascending:false}).limit(100);
    $('adminContent').innerHTML=error?err(error):(data||[]).map(p=>`<div class="record"><div class="record-top"><div><b>${money(p.amount)} · ${esc(p.origin_name||'Origen no identificado')}</b><small>${esc(p.origin_bank||'')} · ACH ${esc(p.ach_order_number||'')} · ${dateFmt(p.transaction_at)}</small></div>${statusHtml(p.match_status)}</div><div class="record-meta"><span>${esc(p.match_reason||'Requiere vinculación manual')}</span></div><div class="admin-actions"><button data-match-payment="${p.id}">Vincular a solicitud</button></div></div>`).join('')||empty('No hay pagos ACH ambiguos.');bindAdminActions();
  }else{
    const{data,error}=await sb.from('orders').select('id,order_code,customer_email,status,payment_method,total_amount,created_at,requires_manual_action').in('status',['PAID','MANUAL_REQUIRED','AWAITING_CODE','PROCESSING','ERROR']).order('created_at',{ascending:true}).limit(100);
    $('adminContent').innerHTML=error?err(error):(data||[]).map(o=>`<div class="record"><div class="record-top"><div><b>${esc(o.order_code)} · ${money(o.total_amount)}</b><small>${esc(o.customer_email)} · ${esc(o.payment_method)} · ${dateFmt(o.created_at)}</small></div>${statusHtml(o.status)}</div><div class="admin-actions"><button data-order-status="PROCESSING" data-id="${o.id}">Procesando</button><button data-order-status="DELIVERED" data-id="${o.id}">Entregado</button><button data-order-status="ERROR" data-id="${o.id}">Error</button></div></div>`).join('')||empty('No hay pedidos pendientes de gestión.');bindAdminActions();
  }
}
function empty(t){return `<div class="record"><small>${esc(t)}</small></div>`}
function err(e){return `<div class="notice error">${esc(e.message)}</div>`}
function bindAdminActions(){
  $('adminContent').querySelectorAll('[data-topup-action]').forEach(b=>b.onclick=()=>adminReviewTopup(b.dataset.id,b.dataset.topupAction));
  $('adminContent').querySelectorAll('[data-order-status]').forEach(b=>b.onclick=()=>adminOrderStatus(b.dataset.id,b.dataset.orderStatus));
  $('adminContent').querySelectorAll('[data-match-payment]').forEach(b=>b.onclick=()=>adminMatchPrompt(b.dataset.matchPayment));
}
async function adminReviewTopup(id,action){
  if(!confirm(`${action==='APPROVE'?'Aprobar':'Rechazar'} esta solicitud?`))return;
  const{error}=await sb.rpc('admin_review_wallet_topup',{p_request_id:id,p_action:action});
  if(error)alert(error.message);loadAdmin();
}
async function adminOrderStatus(id,status){
  const note=prompt('Nota Admin opcional:','')??null;
  const{error}=await sb.rpc('admin_update_order_status',{p_order_id:id,p_new_status:status,p_admin_note:note});
  if(error)alert(error.message);loadAdmin();
}
async function adminMatchPrompt(eventId){
  const{data,error}=await sb.from('wallet_topup_requests').select('id,payment_reference,amount,created_at').eq('status','PENDING').order('created_at',{ascending:true}).limit(30);
  if(error){alert(error.message);return}
  if(!data?.length){alert('No hay solicitudes PENDING para vincular.');return}
  const menu=data.map((r,i)=>`${i+1}. ${r.payment_reference} · ${money(r.amount)}`).join('\n');
  const pick=Number(prompt(`Elige el número de solicitud:\n${menu}`));
  if(!pick||!data[pick-1])return;
  const{error:e}=await sb.rpc('admin_match_bank_payment',{p_event_id:eventId,p_request_id:data[pick-1].id});
  if(e)alert(e.message);loadAdmin();
}
