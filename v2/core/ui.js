/* THE FRENCH STORE — base UI wiring and initial bootstrap. */
function quoteWhatsApp(){
  window.open(`https://wa.me/${WHATSAPP}?text=${encodeURIComponent('Hola, FRENCH STORE. No encontré el producto que busco y quisiera una cotización.')}`,'_blank','noopener,noreferrer');
}
function qrWhatsApp(){
  if(!lastQrOrder)return;
  window.open(`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(`Hola, ya realicé el pago del pedido ${lastQrOrder.order_code} por ${money(lastQrOrder.total)}.`)}`,'_blank','noopener,noreferrer');
}
function wireUI(){
  document.querySelectorAll('[data-nav]').forEach(b=>b.onclick=()=>navigate(b.dataset.nav));
  document.querySelectorAll('[data-category]').forEach(b=>b.onclick=()=>{category=b.dataset.category;renderCategoryTabs();renderCatalog();navigate('tienda')});
  document.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>closeModal(b.dataset.close));
  document.querySelectorAll('.modal').forEach(m=>m.onclick=e=>{if(e.target===m)closeModal(m.id)});
  $('authButton').onclick=()=>session?navigate('perfil'):openModal('authModal');
  $('cartButton').onclick=$('cartInline').onclick=()=>{renderCart();openModal('cartModal')};
  $('loginSubmit').onclick=signIn;
  $('logoutButton').onclick=signOut;
  $('requestTopup').onclick=requestTopup;
  $('cancelTopupRequest').onclick=()=>{if(lastTopupRequest)cancelTopup(lastTopupRequest.request_id||lastTopupRequest.id)};
  $('refreshWallet').onclick=loadWallet;
  $('refreshOrders').onclick=loadOrders;
  $('checkoutWallet').onclick=()=>checkout('wallet');
  $('checkoutQR').onclick=()=>checkout('qr');
  $('whatsappQuote').onclick=$('floatingWhatsapp').onclick=quoteWhatsApp;
  $('qrWhatsapp').onclick=qrWhatsApp;
  $('openAdmin').onclick=()=>navigate('admin');
  $('refreshAdmin').onclick=loadAdmin;
  document.querySelectorAll('[data-admin-tab]').forEach(b=>b.onclick=()=>{adminTab=b.dataset.adminTab;document.querySelectorAll('[data-admin-tab]').forEach(x=>x.classList.toggle('active',x===b));loadAdmin()});
  document.addEventListener('keydown',e=>{if(e.key==='Escape')document.querySelectorAll('.modal.open').forEach(m=>closeModal(m.id))});
}
// New customer registration is Google-only. Email/password login remains available
// as a recovery/admin fallback, but the browser no longer creates email signup controls.
function addSignupButton(){ return null }
function enforceGoogleOnlySignupUI(){
  const clean=()=>{
    document.getElementById('authChoiceSignup')?.remove();
    document.getElementById('authLegacySignupFallback')?.remove();
  };
  clean();
  const modal=$('authModal');
  if(modal)new MutationObserver(clean).observe(modal,{childList:true,subtree:true});
}
async function init(){
  wireUI();enforceGoogleOnlySignupUI();renderCartCounters();
  await Promise.all([loadProducts(),refreshSession()]);
  sb.auth.onAuthStateChange(async(_event,newSession)=>{await refreshSession(newSession);if(newSession)closeModal('authModal')});
}
init();
