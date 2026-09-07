/* THE FRENCH STORE — base French Wallet UI/data.
   BISA/SIP QR automation remains in bisa-wallet.js and is loaded on demand. */
let walletReadRevision=0;
async function loadWallet(){
  const revision=++walletReadRevision;
  const userId=session?.user?.id;
  const balance=$('walletBalance'),status=$('walletStatus');
  const historyState=(id,state,message)=>{
    const el=$(id);
    el.dataset.state=state;
    el.setAttribute('aria-busy',String(state==='loading'));
    el.innerHTML=`<div class="record"><small role="status">${esc(message)}</small></div>`;
  };
  balance.textContent='—';
  balance.dataset.state=userId?'loading':'unavailable';
  balance.setAttribute('aria-busy',String(!!userId));
  status.textContent=userId?'Actualizando saldo…':'Inicia sesión para usar French Wallet.';
  historyState('topupHistory',userId?'loading':'empty',userId?'Cargando solicitudes…':'Inicia sesión para ver tus solicitudes.');
  historyState('walletHistory',userId?'loading':'empty',userId?'Cargando movimientos…':'Inicia sesión para ver tus movimientos.');
  if(!userId)return;
  const reads=await Promise.allSettled([
    sb.rpc('get_my_wallet_balance'),
    sb.from('wallet_accounts').select('status,currency').eq('user_id',userId).maybeSingle(),
    sb.from('wallet_topup_requests').select('id,amount,status,payment_reference,created_at,expires_at').eq('user_id',userId).order('created_at',{ascending:false}).limit(20),
    sb.from('wallet_transactions').select('id,transaction_type,amount,description,created_at').eq('user_id',userId).order('created_at',{ascending:false}).limit(30)
  ]);
  // Newer refreshes and authentication changes must not display an older account's data.
  if(revision!==walletReadRevision||session?.user?.id!==userId)return;
  const [bal,acc,topups,tx]=reads.map(read=>read.status==='fulfilled'?read.value:{error:true});
  const numericBalance=(typeof bal?.data==='number'||(typeof bal?.data==='string'&&bal.data.trim()!==''))&&Number.isFinite(Number(bal.data));
  const balanceReady=!bal?.error&&numericBalance;
  balance.textContent=balanceReady?money(bal.data):'—';
  balance.dataset.state=balanceReady?'ready':'error';
  balance.setAttribute('aria-busy','false');
  status.textContent=!balanceReady?'No pudimos cargar el saldo. Pulsa Actualizar para reintentar.':acc?.error?'Saldo actualizado. No pudimos cargar el estado de la cuenta.':acc?.data?`Wallet ${acc.data.status} · ${acc.data.currency}`:'Saldo actualizado. Cuenta Wallet no disponible.';
  if(topups?.error||!Array.isArray(topups?.data))historyState('topupHistory','error','No pudimos cargar las solicitudes. Pulsa Actualizar para reintentar.');
  else if(!topups.data.length)historyState('topupHistory','empty','Aún no tienes solicitudes.');
  else{
    $('topupHistory').dataset.state='ready';
    $('topupHistory').setAttribute('aria-busy','false');
    $('topupHistory').innerHTML=topups.data.map(recordTopup).join('');
    bindTopupActions();
  }
  if(tx?.error||!Array.isArray(tx?.data))historyState('walletHistory','error','No pudimos cargar los movimientos. Pulsa Actualizar para reintentar.');
  else if(!tx.data.length)historyState('walletHistory','empty','Aún no tienes movimientos.');
  else{
    $('walletHistory').dataset.state='ready';
    $('walletHistory').setAttribute('aria-busy','false');
    $('walletHistory').innerHTML=tx.data.map(t=>`<div class="record"><div class="record-top"><div><b>${esc(t.description||t.transaction_type)}</b><small>${dateFmt(t.created_at)}</small></div><b>${Number(t.amount)>=0?'+':''}${money(t.amount)}</b></div></div>`).join('');
  }
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
