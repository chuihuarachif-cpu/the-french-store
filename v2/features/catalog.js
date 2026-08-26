/* THE FRENCH STORE — catalog data/rendering.
   Product IDs, names, categories and prices continue to come from Supabase. */
function renderCategoryTabs(){
  const box=$('categoryTabs');
  box.innerHTML=CATEGORIES.map(c=>`<button class="${c===category?'active':''}" data-cat="${esc(c)}">${esc(c)}</button>`).join('');
  box.querySelectorAll('button').forEach(b=>b.onclick=()=>{category=b.dataset.cat;renderCategoryTabs();renderCatalog()});
}
function productGroups(items){
  const groups={};
  items.forEach(p=>{const n=canonicalGame(p.juego);(groups[n]??=[]).push(p)});
  return Object.entries(groups).sort((a,b)=>a[0].localeCompare(b[0],'es',{sensitivity:'base'}));
}
function gameCard(game,products,compact=false){
  const logo=logoUrl(game);
  const rows=compact?'':`<div class="package-list">${products.sort((a,b)=>Number(a.precio)-Number(b.precio)).map(p=>`<div class="package-row"><div class="package-name">${esc(p.paquete)}</div><span class="package-price">${money(p.precio)}</span><button class="add-btn" data-add="${p.id}">+ Carrito</button></div>`).join('')}</div>`;
  return `<article class="game-card"><div class="game-card-head">${logo?`<img class="game-logo" src="${esc(logo)}" alt="${esc(game)}" loading="lazy" decoding="async">`:`<div class="game-logo" aria-hidden="true"></div>`}<div class="game-info"><b>${esc(game)}</b><small>${products.length} paquete${products.length===1?'':'s'} disponible${products.length===1?'':'s'}</small></div>${compact?`<div class="game-actions"><button class="plus-btn" data-open-category="${esc(category)}">+</button></div>`:''}</div>${rows}</article>`;
}
function bindAddButtons(root=document){
  root.querySelectorAll('[data-add]').forEach(b=>b.onclick=()=>addToCart(b.dataset.add));
  root.querySelectorAll('[data-open-category]').forEach(b=>b.onclick=()=>navigate('tienda'));
}
function renderFeatured(){
  const groups=productGroups(inventory.filter(p=>p.activo===true));
  const preferred=STOREFRONT_CONFIG.featuredPriority;
  const picked=[...groups].sort((a,b)=>{const score=x=>{const i=preferred.findIndex(p=>normalize(x).includes(normalize(p)));return i<0?99:i};return score(a[0])-score(b[0])}).slice(0,4);
  $('featuredList').innerHTML=picked.length?picked.map(([g,p])=>gameCard(g,p,true)).join(''):'<div class="auth-required">No hay productos destacados.</div>';
  bindAddButtons($('featuredList'));
}
function renderCatalog(){
  const items=inventory.filter(p=>p.activo===true&&p.categoria===category),groups=productGroups(items);
  $('categoryEyebrow').textContent=category.toUpperCase();
  $('catalogMeta').textContent=`${groups.length} juego${groups.length===1?'':'s'} · ${items.length} paquete${items.length===1?'':'s'}`;
  $('catalogList').innerHTML=groups.length?groups.map(([g,p])=>gameCard(g,p)).join(''):'<div class="auth-required"><b>Sin productos disponibles</b>Esta sección no tiene productos activos.</div>';
  bindAddButtons($('catalogList'));
}
async function loadProducts(){
  const{data,error}=await sb.from('productos').select('id,juego,paquete,categoria,precio,activo,mantenimiento,mantenimiento_mensaje,mantenimiento_actualizado_en').eq('activo',true).order('juego').order('precio');
  if(error){$('catalogList').innerHTML=`<div class="notice error">No se pudo cargar el catálogo: ${esc(error.message)}</div>`;return}
  inventory=data||[];
  renderCategoryTabs();renderCatalog();renderFeatured();renderCart();
  document.dispatchEvent(new CustomEvent('fs:catalog-updated'));
}
