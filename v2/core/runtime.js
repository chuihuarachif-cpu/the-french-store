/* THE FRENCH STORE — core runtime/state.
   Shared public browser state and helpers only. No provider secrets, no service-role. */
const SUPABASE_URL='https://jivaaripugjdpxjvjnsu.supabase.co';
const SUPABASE_KEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImppdmFhcmlwdWdqZHB4anZqbnN1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU2NDY3MzIsImV4cCI6MjEwMTIyMjczMn0.N60Xb1PqqPo12HdKEzPc4qCp1aFvVzwZz4VG04q_Es4';
const WHATSAPP=STOREFRONT_CONFIG.whatsapp;
const CATEGORIES=STOREFRONT_CONFIG.categories;
const PLAY_ICONS=STOREFRONT_CONFIG.gameIcons;
const sb=window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
let inventory=[],category='Recargas por ID',cart=loadCart(),session=null,profile=null,admin=false,adminTab='topups',lastQrOrder=null,lastTopupRequest=null;
const $=id=>document.getElementById(id);
const money=n=>`Bs ${Number(n||0).toLocaleString('es-BO',{minimumFractionDigits:2,maximumFractionDigits:2})}`;
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#039;'}[m]));
const dateFmt=v=>v?new Intl.DateTimeFormat('es-BO',{dateStyle:'short',timeStyle:'short'}).format(new Date(v)):'—';
const normalize=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'');
function showNotice(el,msg,type=''){el.textContent=msg;el.className=`notice ${type}`.trim();el.classList.remove('hidden')}
function hideNotice(el){el.classList.add('hidden')}
function openModal(id){$(id).classList.add('open');$(id).setAttribute('aria-hidden','false')}
function closeModal(id){$(id).classList.remove('open');$(id).setAttribute('aria-hidden','true')}
function loadCart(){try{const x=JSON.parse(localStorage.getItem('fs_cart_v2')||'[]');return Array.isArray(x)?x.filter(i=>i&&i.product_id&&i.quantity>0):[]}catch{return[]}}
function saveCart(){localStorage.setItem('fs_cart_v2',JSON.stringify(cart));renderCartCounters()}
function renderCartCounters(){const n=cart.reduce((a,i)=>a+Number(i.quantity||0),0);$('cartCount').textContent=n;$('cartInlineCount').textContent=n}
function currentProduct(id){return inventory.find(p=>String(p.id)===String(id))}
function cartVisualTotal(){return cart.reduce((a,i)=>{const p=currentProduct(i.product_id);return a+(p?Number(p.precio||0)*i.quantity:0)},0)}
function canonicalGame(name){const k=normalize(name);if(k==='magicchessgogo'||k==='magicchess')return'Magic Chess';if(k==='mobilelegendsbangbang'||k==='mobilelegends')return'Mobile Legends: Bang Bang';return String(name||'Sin nombre').trim()}
function logoUrl(name){
  const k=normalize(name);
  if(k.includes('clashofclansclashroyale')) return PLAY_ICONS.clashofclans;
  if(PLAY_ICONS[k]) return PLAY_ICONS[k];
  const found=Object.entries(PLAY_ICONS).find(([key])=>k.includes(key)||key.includes(k));
  return found?found[1]:'';
}
