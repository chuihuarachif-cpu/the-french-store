/* THE FRENCH STORE — base French Wallet UI/data.
   BISA/SIP QR automation remains in bisa-wallet.js and is loaded on demand. */
async function loadWallet(){
  if(!session)return;
  const[bal,acc,topups,tx]=await Promise.all([
    sb.rpc('get_my_wallet_balance'),
    sb.from('wallet_accounts').select('status,currency').eq('user_id',session.user.id).maybeSingle(),
    sb.from('wallet_topup_requests').select('id,amount,status,payment_reference,created_at,expires_at').eq('user_id',session.user.id).order('created_at',{ascending:false}).limit(20),
    sb.from('wallet_transactions').select('id,transaction_type,amount,description,created_at').eq('user_id',session.user.id).order('created_at',{ascending:false}).limit(30)
  ]);
  $('walletBalance').textContent=money(bal.data||0);
  $('walletStatus').textContent=acc.data?`Wallet ${acc.data.status} · ${acc.data.currency}`:'Wallet no encontrada';
  $('topupHistory').innerHTML=(topups.data||[]).map(recordTopup).join('')||'<div class="record"><small>Aún no tienes solicitudes.</small></div>';
  bindTopupActions();
  $('walletHistory').innerHTML=(tx.data||[]).map(t=>`<div class="record"><div class="record-top"><div><b>${esc(t.description||t.transaction_type)}</b><small>${dateFmt(t.created_at)}</small></div><b>${Number(t.amount)>=0?'+':''}${money(t.amount)}</b></div></div>`).join('')||'<div class="record"><small>Aún no tienes movimientos.</small></div>';
}
function recordTopup(t){
  const pending=t.status==='PENDING';
  return `<div class="record"><div class="record-top"><div><b>${money(t.amount)}</b><small>${esc(t.payment_reference||'Sin referencia')} · ${dateFmt(t.created_at)}</small></div>${statusHtml(t.status)}</div><div class="record-meta"><span>Vence: ${dateFmt(t.expires_at)}</span></div>${pending?`<div class="admin-actions"><button class="secondary-btn" data-open-topup-qr="${esc(t.id)}" data-amount="${esc(t.amount)}" data-ref="${esc(t.payment_reference||'')}" data-expires="${esc(t.expires_at||'')}">Ver QR</button><button class="danger-btn" data-cancel-topup="${esc(t.id)}">Cancelar solicitud</button></div>`:''}</div>`;
}
function bindTopupActions(){
  document.querySelectorAll('[data-cancel-topup]').forEach(b=>b.onclick=()=>cancelTopup(b.dataset.cancelTopup));
  document.querySelectorAll('[data-open-topup-qr]').forEach(b=>b.onclick=()=>showTopupPayment({request_id:b.dataset.openTopupQr,amount:Number(b.dataset.amount),payment_reference:b.dataset.ref,expires_at:b.dataset.expires}));
}
async function requestTopup(){
  hideNotice($('topupResult'));
  const amount=Number($('topupAmount').value);
  if(!amount||amount<=0){showNotice($('topupResult'),'Introduce un monto válido.','error');return}
  const{data,error}=await sb.rpc('request_wallet_topup_v2',{p_amount:amount});
  if(error){showNotice($('topupResult'),error.message,'error');return}
  showNotice($('topupResult'),`Solicitud creada: ${data.payment_reference}. Paga exactamente ${money(data.amount)}. Una vez realizado el pago, espera hasta 5 minutos para la acreditación.`,'success');
  $('topupAmount').value='';showTopupPayment(data);await loadWallet();
}
function showTopupPayment(data){
  if(!data)return;
  lastTopupRequest=data;
  $('topupQrAmount').textContent=`Paga exactamente ${money(data.amount)}`;
  $('topupQrReference').textContent=`Referencia de solicitud: ${data.payment_reference||'—'} · Vence: ${dateFmt(data.expires_at)}`;
  openModal('topupQrModal');
}
async function cancelTopup(id){
  if(!id)return;
  if(!confirm('Cancela esta solicitud solo si todavía NO realizaste el pago. Si ya pagaste, no la canceles. ¿Deseas continuar?'))return;
  const{data,error}=await sb.rpc('cancel_my_wallet_topup',{p_request_id:id});
  if(error){
    const map={TOPUP_NOT_FOUND:'No se encontró esta solicitud.',TOPUP_NOT_PENDING:'Esta solicitud ya no está pendiente y no puede cancelarse.',TOPUP_PAYMENT_ALREADY_LINKED:'El pago ya fue detectado; no se puede cancelar.',AUTH_REQUIRED:'Debes iniciar sesión.'};
    showNotice($('topupResult'),map[error.message]||error.message,'error');return;
  }
  if(lastTopupRequest&&String(lastTopupRequest.request_id||lastTopupRequest.id)===String(id)){lastTopupRequest=null;closeModal('topupQrModal')}
  showNotice($('topupResult'),`Solicitud ${data?.payment_reference||''} cancelada. No realices el pago de esa solicitud.`,'success');
  await loadWallet();
}
