/* In-memory UI fixture. Local audit server only. No live credentials or writes. */
(() => {
 'use strict';
 const params=new URLSearchParams(location.search),rank=params.get('rank')||'guest',view=params.get('view')||'inicio',scenario=params.get('state')||'normal';
 const user={id:'00000000-0000-4000-8000-000000000001',email:'qa@example.invalid',user_metadata:{full_name:'Cliente de prueba'}};
 let currentSession=rank==='guest'?null:{user,access_token:'qa-fixture-no-network'};
 const counters={},errors=[],blockedWrites=[],focusChecks=[],started=Date.now();
 const plans=[{code:'ECLAT_OR',name:'Gold Rank',theme:'gold',subtitle:'Éclat Or',price_bob:7,duration_days:30},{code:'DIAMANT_BLEU',name:'Diamond Rank',theme:'diamond',subtitle:'Diamant Bleu',price_bob:15,duration_days:30}];
 const pass=plans.find(p=>p.theme===rank);
 const summary={ok:true,active_pass:pass?{...pass,ends_at:'2026-10-06T12:00:00Z'}:null,plans,points_available:1250,points_pending:180,points_per_bob:100,min_redeem_points:100,max_redeem_points:10000,history:[],recent:[]};
 const product=(id,juego,paquete,categoria,precio,mantenimiento=false)=>({id,juego,paquete,categoria,precio,activo:true,mantenimiento,mantenimiento_mensaje:mantenimiento?'Compras temporalmente en mantenimiento.':''});
 const products=[product(54,'Mobile Legends: Bang Bang','Pase Semanal','Recargas por ID',18.28),product(39,'Mobile Legends: Bang Bang','50 + 50 Diamantes','Recargas por ID',12.12),product(903,'Free Fire','110 Diamantes','Recargas por ID',9.90),product(904,'Steam Wallet','5 USD','Recargas por Cuenta',70.30),product(905,'Clash of Clans (Sin Bonus)','Pase de oro','Recargas por Cuenta',89.21,true),product(906,'Netflix','1 perfil · 30 días','Streaming',28),product(907,'Roblox','50 Robux','Gift Cards',8.12),product(908,'Wuthering Waves','60 Lunites','Recargas por ID',8.50)];
 const orders=['PENDING_PAYMENT','PAID','PROCESSING','DELIVERED','CANCELLED'].map((status,i)=>({id:'00000000-0000-4000-8000-00000000001'+i,order_code:'QA-00'+(i+1),user_id:user.id,status,payment_method:i%2?'WALLET':'QR',total_amount:18.28,currency:'BOB',created_at:'2026-09-05T18:00:00Z',updated_at:'2026-09-05T18:02:00Z',customer_note:null,requires_manual_action:true}));
 const tableData={productos:products,profiles:[{...user,display_name:'Cliente de prueba'}],checkout_input_requirements:[{product_id:54,field_key:'user_id',label:'ID de jugador',input_type:'text',required:true,active:true,enforce:true},{product_id:39,field_key:'user_id',label:'ID de jugador',input_type:'text',required:true,active:true,enforce:true}],wallet_accounts:[{user_id:user.id,status:'ACTIVE',currency:'BOB'}],wallet_topup_requests:[],wallet_transactions:[{id:'qa-tx',user_id:user.id,transaction_type:'CREDIT',description:'Movimiento ficticio de prueba',amount:70.30,created_at:'2026-09-05T12:00:00Z'}],orders};
 const result=(data,error=null)=>Promise.resolve({data,error});
 class Query {
  constructor(table){this.table=table;this.filters=[];this.one=false;this.max=1000;}
  select(){return this;} eq(k,v){this.filters.push(x=>x[k]===v);return this;} in(k,v){this.filters.push(x=>v.includes(x[k]));return this;} order(){return this;} limit(n){this.max=n;return this;} maybeSingle(){this.one=true;return this;} single(){this.one=true;return this;}
  then(a,b){counters['table:'+this.table]=(counters['table:'+this.table]||0)+1;let rows=(tableData[this.table]||[]).filter(x=>this.filters.every(f=>f(x))).slice(0,this.max);if(scenario==='empty'&&['orders','wallet_transactions','wallet_topup_requests'].includes(this.table))rows=[];if(scenario==='loading'&&this.table.startsWith('wallet_'))return new Promise(()=>{}).then(a,b);const failed=(scenario==='error'&&this.table!=='profiles')||(scenario==='transaction_error'&&this.table==='wallet_transactions');return result(this.one?rows[0]||null:rows,failed?{message:'QA_READ_ERROR'}:null).then(a,b);}
 }
 const client={from:table=>new Query(table),rpc(name){counters[name]=(counters[name]||0)+1;
  const data={is_admin:false,admin_app_is_allowed:false,get_my_wallet_balance:scenario==='zero'?0:70.30,get_my_loyalty_summary:summary,get_my_loyalty_launch_progress:{program_launched:true,admin_view:false,rewarded_ads_enabled:false},get_my_loyalty_upgrade_quote:{eligible:rank==='gold',charged_bob:8,ends_at:'2026-10-06T12:00:00Z',remaining_days:30},get_my_paid_whatsapp_notice_status:{available:false},get_my_rewards_ad_preferences:{enabled:false},get_my_ad_reward_status:{enabled:false}};
  if(scenario==='loading'&&name==='get_my_wallet_balance')return new Promise(()=>{});
  if(name==='get_my_rewarded_ad_preferences')return result({enabled:false});
  if(Object.hasOwn(data,name))return result(data[name],scenario==='error'&&name==='get_my_wallet_balance'?{message:'QA_READ_ERROR'}:null);
  blockedWrites.push('rpc:'+name);
  return result(null,{message:'QA_READ_ONLY'});
 },auth:{getSession:()=>result({session:currentSession}),getUser:()=>result({user}),onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}}),signOut:async()=>{currentSession=null;return result(null);},signInWithOAuth:()=>result(null,{message:'QA_SIGN_IN_DISABLED'}),updateUser:()=>result({user})}};
 window.supabase={createClient:()=>client};
 const originalFetch=window.fetch.bind(window);
 window.fetch=async(input,options)=>{
  const url=new URL(typeof input==='string'?input:input.url,location.href);
  const method=String(options?.method||input?.method||'GET').toUpperCase();
  if(!['GET','HEAD'].includes(method)){blockedWrites.push(method+':'+url.pathname);throw new Error('QA_WRITE_BLOCKED');}
  if(url.origin===location.origin)return originalFetch(input,options);
  counters['fetch:'+url.pathname]=(counters['fetch:'+url.pathname]||0)+1;
  if(url.pathname==='/auth/v1/settings')return new Response(JSON.stringify({external:{google:true}}),{headers:{'Content-Type':'application/json'}});
  if(url.hostname==='api.frenchstorebo.com'&&url.pathname==='/api/storefront-automation-capabilities')return new Response(JSON.stringify({ok:true,automatic_product_ids:[],products:[],purchase_enabled:false,manual_fulfillment:true}),{headers:{'Content-Type':'application/json'}});
  throw new Error('QA_EXTERNAL_REQUEST_BLOCKED');
 };
 if(scenario==='lite'){Object.defineProperty(navigator,'deviceMemory',{value:2,configurable:true});Object.defineProperty(navigator,'hardwareConcurrency',{value:2,configurable:true});}
 window.addEventListener('error',e=>errors.push(String(e.message||'resource error')));
 window.addEventListener('unhandledrejection',e=>errors.push(String(e.reason?.message||e.reason)));
 function report(){const root=document.documentElement;const evidence={qa:true,rank,view,scenario,width:innerWidth,bootstrap:root.dataset.fsBootstrap,membership:root.dataset.fsMembership||'base',motion:root.dataset.r8Motion,features:{wallet:root.dataset.fsWalletReady,orders:root.dataset.fsOrdersReady,checkout:root.dataset.fsCheckoutReady},qrDecorator:document.getElementById('qrWhatsapp')?.dataset.bisaReady==='1',heroAnimation:getComputedStyle(document.querySelector('.hero'),'::after').animationName,ribbonAnimation:document.getElementById('fsRankPremiumRibbon')?getComputedStyle(document.getElementById('fsRankPremiumRibbon'),'::after').animationName:'none',wallet:{state:document.getElementById('walletBalance')?.dataset.state,balance:document.getElementById('walletBalance')?.textContent,history:document.getElementById('walletHistory')?.dataset.state,topups:document.getElementById('topupHistory')?.dataset.state},focusChecks,blockedWrites,overflow:root.scrollWidth>innerWidth,overflowElements:Array.from(document.querySelectorAll('body *')).filter(e=>e.getClientRects().length&&getComputedStyle(e).position!=='fixed'&&e.getBoundingClientRect().right>innerWidth+1).slice(0,6).map(e=>e.id||e.className),errors:errors.slice(0,8),calls:counters,elapsed:Date.now()-started};let out=document.getElementById('fsQaEvidence');if(!out){out=document.createElement('pre');out.id='fsQaEvidence';out.hidden=true;document.body.append(out);}out.textContent=JSON.stringify(evidence);if(parent!==window)parent.postMessage(evidence,location.origin);}
 function checkDialog(id){
  const modal=document.getElementById(id),opener=document.getElementById('cartButton');
  const check=(pass,label)=>{if(!pass)throw new Error('QA_DIALOG_'+id+'_'+label);focusChecks.push(id+':'+label);};
  closeModal(id);opener.focus();openModal(id);
  check(modal.contains(document.activeElement),'opening');
  const controls=[...modal.querySelectorAll('button,input,select,textarea,a[href],[tabindex]')].filter(el=>!el.disabled&&el.tabIndex>=0&&el.getClientRects().length);
  const first=controls[0],last=controls[controls.length-1];
  last.focus();document.dispatchEvent(new KeyboardEvent('keydown',{key:'Tab',bubbles:true,cancelable:true}));check(document.activeElement===first,'tab');
  first.focus();document.dispatchEvent(new KeyboardEvent('keydown',{key:'Tab',shiftKey:true,bubbles:true,cancelable:true}));check(document.activeElement===last,'shift-tab');
  opener.focus();check(modal.contains(document.activeElement),'background');
  document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true,cancelable:true}));check(!modal.classList.contains('open'),'escape');
  check(document.activeElement===opener,'restore');
  openModal(id);
 }
 window.addEventListener('load',async()=>{
  for(let i=0;i<100&&document.documentElement.dataset.fsBootstrap!=='ready';i++)await new Promise(r=>setTimeout(r,60));
  if(currentSession&&window.FSFeatureLoader)await window.FSFeatureLoader.ensure('loyalty');
  const feature={wallet:'wallet',topup:'wallet',pedidos:'orders',cart:'checkout',qr:'checkout'}[view];
  if(feature)await window.FSFeatureLoader.ensure(feature);
  if(view==='cart'){if(scenario!=='empty'){addToCart(904);setQty(904,1);}renderCart();openModal('cartModal');}
  else if(view==='qr'){document.getElementById('qrOrderCode').textContent='QA · vista sin pedido real';document.getElementById('qrOrderTotal').textContent='Total de ejemplo: Bs 18,28';document.getElementById('qrOrderImage').style.display='none';document.getElementById('qrPaymentState').textContent='Vista de prueba: QR sin generar.';openModal('qrModal');}
  else if(view==='auth')openModal('authModal');
  else if(view==='topup')openModal('topupQrModal');
  else if(view!=='admin')navigate(view);
  if(params.get('checks')==='r151'&&['cart','qr','auth','topup'].includes(view))checkDialog({cart:'cartModal',qr:'qrModal',auth:'authModal',topup:'topupQrModal'}[view]);
  setTimeout(report,500);setTimeout(report,1500);setTimeout(report,3000);
 });
 document.addEventListener('click',()=>setTimeout(report,800));
})();
