import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';

const runtime=readFileSync('v2/core/runtime.js','utf8'),cartSource=readFileSync('v2/features/cart.js','utf8');
let stored=JSON.stringify([{product_id:'1',quantity:'2',price:0},{product_id:1,quantity:3},{product_id:2,quantity:999},{product_id:3,quantity:1.5},{product_id:'x',quantity:1},null]);
let storageFails=false,notices=0;
const elements=new Map();
const el=id=>{if(!elements.has(id))elements.set(id,{textContent:'',innerHTML:'',contains:()=>false,querySelectorAll:()=>[]});return elements.get(id);};
const esc=s=>String(s??'').replaceAll('<','&lt;').replaceAll('"','&quot;');
const cartContext=vm.createContext({cart:[],inventory:[{id:1,precio:18.28,paquete:'Pase',juego:'Juego'},{id:2,precio:70.30,paquete:'Otro',juego:'Juego'}],localStorage:{getItem:()=>stored,setItem:(_key,value)=>{if(storageFails)throw new Error('STORAGE_DENIED');stored=value;}},window:{FSNotify:{info:()=>notices++}},$:el,document:{activeElement:null},money:n=>'Bs '+Number(n).toFixed(2),canonicalGame:s=>s,esc,alert:()=>{}});
vm.runInContext(runtime.slice(runtime.indexOf('function loadCart()'),runtime.indexOf('function canonicalGame(')),cartContext);
const loaded=JSON.parse(JSON.stringify(cartContext.loadCart()));
assert.deepEqual(loaded,[{product_id:1,quantity:5},{product_id:2,quantity:99}]);
stored='broken json';assert.equal(cartContext.loadCart().length,0);
cartContext.cart=[{product_id:1,quantity:'2'}];vm.runInContext(cartSource,cartContext);
cartContext.setQty(1,1);assert.equal(cartContext.cart[0].quantity,3,'String quantity must not concatenate');
assert.equal(el('cartTotal').textContent,'Bs 54.84');
cartContext.setQty(1,0.5);assert.equal(cartContext.cart[0].quantity,3);
storageFails=true;cartContext.addToCart(1);cartContext.addToCart(1);
assert.equal(cartContext.cart[0].quantity,5);assert.equal(notices,1);assert.equal(el('cartCount').textContent,5);
assert.match(el('cartItems').innerHTML,/aria-label="Aumentar cantidad/);
assert.deepEqual(JSON.parse(JSON.stringify(cartContext.rpcItems())),[{product_id:1,quantity:5}],'RPC payload remains IDs and quantities only');
cartContext.inventory[0].mantenimiento=true;cartContext.setQty(1,1);assert.equal(cartContext.cart[0].quantity,5);
cartContext.inventory[0].mantenimiento=false;cartContext.cart[0].quantity=99;
cartContext.addToCart(1);cartContext.setQty(1,1);assert.equal(cartContext.cart[0].quantity,99);
cartContext.setQty(1,-1);assert.equal(cartContext.cart[0].quantity,98);
cartContext.cart[0].quantity=1;cartContext.setQty(1,-1);assert.equal(cartContext.cart.length,0);

const base=readFileSync('v2/features/orders-admin.js','utf8');
const bisa=readFileSync('v2/bisa-checkout.js','utf8');
const paymentRenderer=bisa.slice(bisa.indexOf('  loadOrders = async function loadOrdersWithPayments()'),bisa.indexOf('\n  function install()',bisa.indexOf('  loadOrders =')));
for(const decorated of [false,true]){
  let response;
  const list={innerHTML:'',dataset:{},setAttribute(k,v){this[k]=v;},querySelectorAll:()=>[]};
  const ctx=vm.createContext({session:{user:{id:'account-a'}},$:()=>list,esc,money:n=>'Bs '+Number(n).toFixed(2),dateFmt:()=>'',sb:{from(table){assert.equal(table,'orders');const captured=response,q={select(){return q;},eq(k,v){assert.equal(k,'user_id');assert.equal(v,ctx.session.user.id);return q;},order(){return q;},limit(n){assert.equal(n,50);return q;},then(a,b){return Promise.resolve(captured).then(a,b);}};return q;}}});
  vm.runInContext(base.slice(0,base.indexOf('async function loadAdmin(')),ctx);
  if(decorated)vm.runInContext(paymentRenderer,ctx);
  let release;response=new Promise(resolve=>{release=resolve;});const loading=ctx.loadOrders();
  assert.equal(list.dataset.state,'loading');assert.equal(list['aria-busy'],'true');
  release({data:[],error:null});await loading;assert.equal(list.dataset.state,'empty');
  for(const failed of [{data:null,error:null},{data:null,error:{message:'PRIVATE_BACKEND_DETAILS'}},Promise.reject(new Error('PRIVATE_BACKEND_DETAILS'))]){
    response=failed;await ctx.loadOrders();assert.equal(list.dataset.state,'error');assert.doesNotMatch(list.innerHTML,/PRIVATE_BACKEND_DETAILS/);assert.equal(list['aria-busy'],'false');
  }
  response={data:[{id:'qa',order_code:'<img unsafe>',status:'PENDING_PAYMENT',payment_method:'QR',total_amount:18.28}],error:null};await ctx.loadOrders();
  assert.equal(list.dataset.state,'ready');assert.match(list.innerHTML,/&lt;img/);assert.match(list.innerHTML,/18\.28/);
  if(decorated){
    assert.match(list.innerHTML,/data-order-qr/);
    response={data:[{id:'qa',status:'PAID',payment_method:'QR',total_amount:18.28}],error:null};await ctx.loadOrders();assert.doesNotMatch(list.innerHTML,/data-order-qr/);assert.match(list.innerHTML,/✓ Pagado/);
    response={data:[{id:'qa',status:'DELIVERED',payment_method:'QR',total_amount:18.28}],error:null};await ctx.loadOrders();assert.match(list.innerHTML,/✓ Entregado/);assert.doesNotMatch(list.innerHTML,/data-order-qr/);
  }
  response=new Promise(resolve=>{release=resolve;});const old=ctx.loadOrders();
  ctx.session={user:{id:'account-b'}};response={data:[],error:null};await ctx.loadOrders();release({data:[{order_code:'OLD_ACCOUNT'}],error:null});await old;
  assert.equal(list.dataset.state,'empty');assert.doesNotMatch(list.innerHTML,/OLD_ACCOUNT/);
  response=new Promise(resolve=>{release=resolve;});const beforeSignout=ctx.loadOrders();
  ctx.session=null;await ctx.loadOrders();release({data:[{order_code:'SIGNED_OUT_ACCOUNT'}],error:null});await beforeSignout;
  assert.equal(list.dataset.state,'signed-out');assert.equal(list['aria-busy'],'false');assert.doesNotMatch(list.innerHTML,/SIGNED_OUT_ACCOUNT/);
}

// The real presentation wrapper, with an inert handler instead of any payment RPC.
const fulfillment=readFileSync('v2/fulfillment-inputs.js','utf8');
let releaseValidation,releaseHandler,handlerCalls=0,noticeText='';
const progress={textContent:'',classList:{remove(){},add(){}}};
const buttons=['checkoutWallet','checkoutQR'].map(id=>({id,disabled:false,dataset:{},attrs:{},setAttribute(k,v){this.attrs[k]=v;},removeAttribute(k){delete this.attrs[k];},onclick:async()=>{handlerCalls++;return new Promise(resolve=>{releaseHandler=resolve;});}}));
const wrapperContext=vm.createContext({document:{getElementById:id=>id==='checkoutProgress'?progress:buttons.find(b=>b.id===id)},validateBeforeCheckout:()=>new Promise(resolve=>{releaseValidation=resolve;}),notice:text=>{noticeText=text;},cartItems:()=>[{}]});
vm.runInContext(fulfillment.slice(fulfillment.indexOf('  let checkoutBusy ='),fulfillment.indexOf('  function install()')),wrapperContext);
for(const b of buttons)wrapperContext.patchCheckoutButton(b.id);
const submit=buttons[0].onclick({});
assert.ok(buttons.every(b=>b.disabled&&b.attrs['aria-busy']==='true'));
assert.match(progress.textContent,/Revisando/);
await buttons[1].onclick({});assert.equal(handlerCalls,0,'The other payment button cannot start a parallel submission');
releaseValidation({ok:true});await new Promise(resolve=>setImmediate(resolve));assert.equal(handlerCalls,1);
await buttons[0].onclick({});assert.equal(handlerCalls,1,'Repeated clicks do not repeat submission');
releaseHandler();await submit;assert.ok(buttons.every(b=>!b.disabled&&!b.attrs['aria-busy']));
wrapperContext.validateBeforeCheckout=async()=>{throw new Error('PRIVATE_NETWORK_DETAILS');};
await buttons[0].onclick({});assert.match(noticeText,/Revisa Mis Pedidos/);assert.doesNotMatch(noticeText,/PRIVATE_NETWORK/);
assert.ok(buttons.every(b=>!b.disabled));
console.log('R153: quantity/storage/cents/limits, Orders read states/account races, checkout loading/re-entry/error presentation PASS; no financial writes');

const bootstrap=readFileSync('v2/bootstrap.js','utf8');
assert.ok(bootstrap.indexOf('const customerOrders = loadOrders')<bootstrap.indexOf("'fs-r6-js'"));
assert.ok(bootstrap.indexOf('loadOrders = customerOrders')>bootstrap.indexOf("'fs-r7fix-js'"));
assert.match(bootstrap,/view-pedidos.*classList.contains\('active'\).*loadOrders\(\)/);
assert.match(readFileSync('v2/premium-surfaces.css','utf8'),/\.checkout-grid button\[aria-busy="true"\]\{[^}]*transition:none/,'Busy state must appear immediately, independently of the interaction transition');
