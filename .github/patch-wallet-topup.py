from pathlib import Path
import re

app_path = Path('v2/app.js')
html_path = Path('v2/index.html')
app = app_path.read_text(encoding='utf-8')
html = html_path.read_text(encoding='utf-8')

old_state = "let inventory=[],category='Recargas por ID',cart=loadCart(),session=null,profile=null,admin=false,adminTab='topups',lastQrOrder=null;"
new_state = "let inventory=[],category='Recargas por ID',cart=loadCart(),session=null,profile=null,admin=false,adminTab='topups',lastQrOrder=null,lastTopupRequest=null;"
if old_state in app:
    app = app.replace(old_state, new_state, 1)
elif new_state not in app:
    raise SystemExit('Wallet state marker not found')

wallet_pattern = re.compile(
    r"async function loadWallet\(\)\{.*?\}function recordTopup\(t\)\{.*?\}\nasync function requestTopup\(\)",
    re.S,
)
wallet_replacement = """async function loadWallet(){if(!session)return;const[bal,acc,topups,tx]=await Promise.all([sb.rpc('get_my_wallet_balance'),sb.from('wallet_accounts').select('status,currency').eq('user_id',session.user.id).maybeSingle(),sb.from('wallet_topup_requests').select('id,amount,status,payment_reference,created_at,expires_at').eq('user_id',session.user.id).order('created_at',{ascending:false}).limit(20),sb.from('wallet_transactions').select('id,transaction_type,amount,description,created_at').eq('user_id',session.user.id).order('created_at',{ascending:false}).limit(30)]);$('walletBalance').textContent=money(bal.data||0);$('walletStatus').textContent=acc.data?`Wallet ${acc.data.status} · ${acc.data.currency}`:'Wallet no encontrada';$('topupHistory').innerHTML=(topups.data||[]).map(recordTopup).join('')||'<div class=\"record\"><small>Aún no tienes solicitudes.</small></div>';bindTopupActions();$('walletHistory').innerHTML=(tx.data||[]).map(t=>`<div class=\"record\"><div class=\"record-top\"><div><b>${esc(t.description||t.transaction_type)}</b><small>${dateFmt(t.created_at)}</small></div><b>${Number(t.amount)>=0?'+':''}${money(t.amount)}</b></div></div>`).join('')||'<div class=\"record\"><small>Aún no tienes movimientos.</small></div>'}
function recordTopup(t){const pending=t.status==='PENDING';return `<div class=\"record\"><div class=\"record-top\"><div><b>${money(t.amount)}</b><small>${esc(t.payment_reference||'Sin referencia')} · ${dateFmt(t.created_at)}</small></div>${statusHtml(t.status)}</div><div class=\"record-meta\"><span>Vence: ${dateFmt(t.expires_at)}</span></div>${pending?`<div class=\"admin-actions\"><button class=\"secondary-btn\" data-open-topup-qr=\"${esc(t.id)}\" data-amount=\"${esc(t.amount)}\" data-ref=\"${esc(t.payment_reference||'')}\" data-expires=\"${esc(t.expires_at||'')}\">Ver QR</button><button class=\"danger-btn\" data-cancel-topup=\"${esc(t.id)}\">Cancelar solicitud</button></div>`:''}</div>`}
function bindTopupActions(){document.querySelectorAll('[data-cancel-topup]').forEach(b=>b.onclick=()=>cancelTopup(b.dataset.cancelTopup));document.querySelectorAll('[data-open-topup-qr]').forEach(b=>b.onclick=()=>showTopupPayment({request_id:b.dataset.openTopupQr,amount:Number(b.dataset.amount),payment_reference:b.dataset.ref,expires_at:b.dataset.expires}))}
async function requestTopup()"""
app, wallet_count = wallet_pattern.subn(wallet_replacement, app, count=1)
if wallet_count != 1 and 'function bindTopupActions()' not in app:
    raise SystemExit('Wallet history block not patched')

request_pattern = re.compile(r"async function requestTopup\(\)\{.*?\}\nconst LABELS=", re.S)
request_replacement = """async function requestTopup(){hideNotice($('topupResult'));const amount=Number($('topupAmount').value);if(!amount||amount<=0){showNotice($('topupResult'),'Introduce un monto válido.','error');return}const{data,error}=await sb.rpc('request_wallet_topup_v2',{p_amount:amount});if(error){showNotice($('topupResult'),error.message,'error');return}showNotice($('topupResult'),`Solicitud creada: ${data.payment_reference}. Paga exactamente ${money(data.amount)}. Una vez realizado el pago, espera hasta 5 minutos para la acreditación.`,'success');$('topupAmount').value='';showTopupPayment(data);await loadWallet()}
function showTopupPayment(data){if(!data)return;lastTopupRequest=data;$('topupQrAmount').textContent=`Paga exactamente ${money(data.amount)}`;$('topupQrReference').textContent=`Referencia de solicitud: ${data.payment_reference||'—'} · Vence: ${dateFmt(data.expires_at)}`;openModal('topupQrModal')}
async function cancelTopup(id){if(!id)return;if(!confirm('Cancela esta solicitud solo si todavía NO realizaste el pago. Si ya pagaste, no la canceles. ¿Deseas continuar?'))return;const{data,error}=await sb.rpc('cancel_my_wallet_topup',{p_request_id:id});if(error){const map={TOPUP_NOT_FOUND:'No se encontró esta solicitud.',TOPUP_NOT_PENDING:'Esta solicitud ya no está pendiente y no puede cancelarse.',TOPUP_PAYMENT_ALREADY_LINKED:'El pago ya fue detectado; no se puede cancelar.',AUTH_REQUIRED:'Debes iniciar sesión.'};showNotice($('topupResult'),map[error.message]||error.message,'error');return}if(lastTopupRequest&&String(lastTopupRequest.request_id||lastTopupRequest.id)===String(id)){lastTopupRequest=null;closeModal('topupQrModal')}showNotice($('topupResult'),`Solicitud ${data?.payment_reference||''} cancelada. No realices el pago de esa solicitud.`,'success');await loadWallet()}
const LABELS="""
app, request_count = request_pattern.subn(request_replacement, app, count=1)
if request_count != 1 and 'async function cancelTopup(id)' not in app:
    raise SystemExit('Wallet request block not patched')

if "CANCELLED:'Cancelado'" not in app:
    old_labels = "REJECTED:'Rechazado',AMBIGUOUS"
    new_labels = "REJECTED:'Rechazado',CANCELLED:'Cancelado',AMBIGUOUS"
    if old_labels not in app:
        raise SystemExit('Status label marker not found')
    app = app.replace(old_labels, new_labels, 1)

wire_old = "$('requestTopup').onclick=requestTopup;$('refreshWallet').onclick=loadWallet;"
wire_new = "$('requestTopup').onclick=requestTopup;$('cancelTopupRequest').onclick=()=>{if(lastTopupRequest)cancelTopup(lastTopupRequest.request_id||lastTopupRequest.id)};$('refreshWallet').onclick=loadWallet;"
if wire_old in app:
    app = app.replace(wire_old, wire_new, 1)
elif wire_new not in app:
    raise SystemExit('Wallet UI wire marker not found')

if 'id="topupQrModal"' not in html:
    script_marker = '  <script src="./app.js" defer></script>'
    if script_marker not in html:
        raise SystemExit('HTML script marker not found')
    modal = '''  <div id="topupQrModal" class="modal" aria-hidden="true"><div class="modal-card small-modal"><button class="modal-close" data-close="topupQrModal">×</button><span class="eyebrow">CARGA FRENCH WALLET</span><h2 id="topupQrAmount">Paga exactamente</h2><div id="topupQrReference" class="notice success"></div><div class="qr-box"><img src="../qr-pago.png" alt="QR para cargar French Wallet" loading="lazy" decoding="async"></div><p class="security-note">Escanea este QR y paga el monto exacto. Verifica en tu banca: <b>Franz Chui</b> · <b>Banco Unión</b>. Si los datos no coinciden, no pagues.</p><p class="security-note"><b>Después de pagar, espera hasta 5 minutos.</b> El aviso ACH puede tardar un poco en llegar y la Wallet se acreditará cuando el pago sea validado. Si tarda más, no vuelvas a pagar: actualiza tu saldo o contáctanos.</p><p class="security-note">Si todavía no pagaste y cambiaste de opinión, puedes cancelar la solicitud. <b>No la canceles si ya realizaste el pago.</b></p><div class="checkout-grid"><button class="secondary-btn" data-close="topupQrModal">Cerrar</button><button id="cancelTopupRequest" class="danger-btn">Cancelar solicitud</button></div></div></div>'''
    html = html.replace(script_marker, modal + '\n\n' + script_marker, 1)

app_path.write_text(app, encoding='utf-8')
html_path.write_text(html, encoding='utf-8')

assert "cancel_my_wallet_topup" in app
assert "hasta 5 minutos" in app
assert 'id="topupQrModal"' in html
assert '../qr-pago.png' in html
assert 'Cancelar solicitud' in html
assert 'service_role' not in app.lower()
print('Wallet QR/cancel patch prepared')
