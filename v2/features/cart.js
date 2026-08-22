/* THE FRENCH STORE — cart and base checkout.
   Server-side RPCs remain authoritative for product validity and final totals. */
function addToCart(id){
  if(!currentProduct(id))return;
  const x=cart.find(i=>String(i.product_id)===String(id));
  if(x)x.quantity=Math.min(99,x.quantity+1);else cart.push({product_id:Number(id),quantity:1});
  saveCart();renderCart();
}
function setQty(id,delta){
  const x=cart.find(i=>String(i.product_id)===String(id));if(!x)return;
  x.quantity+=delta;
  if(x.quantity<=0)cart=cart.filter(i=>String(i.product_id)!==String(id));else x.quantity=Math.min(99,x.quantity);
  saveCart();renderCart();
}
function renderCart(){
  const box=$('cartItems');
  cart=cart.filter(i=>currentProduct(i.product_id));
  saveCart();
  if(!cart.length){box.innerHTML='<div class="auth-required"><b>Tu carrito está vacío</b>Agrega productos desde la tienda.</div>';$('cartTotal').textContent=money(0);return}
  box.innerHTML=cart.map(i=>{const p=currentProduct(i.product_id);return `<div class="record"><div class="record-top"><div><b>${esc(canonicalGame(p.juego))}</b><small>${esc(p.paquete)}</small></div><b>${money(Number(p.precio)*i.quantity)}</b></div><div class="admin-actions"><button data-minus="${p.id}">−</button><span class="status">x${i.quantity}</span><button data-plus="${p.id}">+</button><button data-remove="${p.id}">Quitar</button></div></div>`}).join('');
  $('cartTotal').textContent=money(cartVisualTotal());
  box.querySelectorAll('[data-minus]').forEach(b=>b.onclick=()=>setQty(b.dataset.minus,-1));
  box.querySelectorAll('[data-plus]').forEach(b=>b.onclick=()=>setQty(b.dataset.plus,1));
  box.querySelectorAll('[data-remove]').forEach(b=>b.onclick=()=>{cart=cart.filter(i=>String(i.product_id)!==String(b.dataset.remove));saveCart();renderCart()});
}
function rpcItems(){return cart.map(i=>({product_id:Number(i.product_id),quantity:Number(i.quantity)}))}
async function checkout(method){
  hideNotice($('checkoutResult'));
  if(!session){closeModal('cartModal');openModal('authModal');return}
  if(!cart.length){showNotice($('checkoutResult'),'Tu carrito está vacío.','error');return}
  const fn=method==='wallet'?'create_wallet_order':'create_qr_order';
  const{data,error}=await sb.rpc(fn,{p_items:rpcItems(),p_customer_note:null});
  if(error){const map={INSUFFICIENT_WALLET_BALANCE:'Saldo insuficiente en French Wallet.',WALLET_BLOCKED:'Tu Wallet no está disponible.',INVALID_OR_INACTIVE_PRODUCT:'Un producto cambió o ya no está disponible.',AUTH_REQUIRED:'Debes iniciar sesión.'};showNotice($('checkoutResult'),map[error.message]||error.message,'error');return}
  if(!data?.ok){showNotice($('checkoutResult'),'No se pudo crear el pedido.','error');return}
  cart=[];saveCart();renderCart();
  if(method==='wallet'){
    showNotice($('checkoutResult'),`Pedido ${data.order_code} creado. Total ${money(data.total)}. Estado: ${statusLabel(data.status)}.`,'success');
    await loadWallet();
  }else{
    lastQrOrder=data;closeModal('cartModal');$('qrOrderCode').textContent=`Pedido ${data.order_code}`;$('qrOrderTotal').textContent=`Total: ${money(data.total)}`;openModal('qrModal');
  }
  await loadOrders();
}
