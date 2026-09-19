/* R172 — smart catalog search + local/remote favorites.
   Presentation only. Prices and availability remain server-authoritative. */
(() => {
  'use strict';

  const LOCAL_KEY='fs_favorites_v1';
  const $=id=>document.getElementById(id);
  const norm=value=>String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'');
  const escHtml=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[char]));
  const aliases={
    freefire:['ff','freefire','garena'],
    mobilelegendsbangbang:['ml','mlbb','mobilelegends','mobilelegendsbangbang'],
    mobilelegends:['ml','mlbb','mobilelegends','mobilelegendsbangbang'],
    magicchess:['mc','magicchess'],
    netflix:['netflix'],
    disney:['disney','disneyplus'],
    spotify:['spotify'],
    youtube:['youtube','youtubepremium'],
    roblox:['roblox','robux'],
    pubgmobile:['pubg','pubgm','pubgmobile']
  };

  let favorites=readLocal();
  let favoritesOnly=false;
  let installed=false;
  let applying=false;
  let deepLinkHandled=false;
  let observer=null;

  function readLocal(){
    try{
      const raw=JSON.parse(localStorage.getItem(LOCAL_KEY)||'[]');
      const map=new Map();
      for(const item of Array.isArray(raw)?raw:[]){
        const key=norm(item?.key||item?.label);
        if(!key)continue;
        map.set(key,{key,label:String(item?.label||key).slice(0,160),category:String(item?.category||'').slice(0,80)});
      }
      return map;
    }catch{return new Map()}
  }

  function persistLocal(){
    try{localStorage.setItem(LOCAL_KEY,JSON.stringify([...favorites.values()]))}catch{}
  }

  function allProducts(){
    try{return Array.isArray(inventory)?inventory.filter(p=>p?.activo===true):[]}catch{return[]}
  }

  function aliasText(game){
    const key=norm(game);
    const extra=[];
    for(const [aliasKey,values] of Object.entries(aliases)){
      if(key.includes(aliasKey)||aliasKey.includes(key))extra.push(...values);
    }
    return extra.join(' ');
  }

  function matchesProduct(product,query){
    const q=norm(query);
    if(!q)return true;
    const game=canonicalGame(product?.juego);
    const haystack=norm([game,product?.paquete,product?.categoria,aliasText(game)].join(' '));
    return haystack.includes(q);
  }

  function matchedGameKeys(query){
    const set=new Set();
    for(const product of allProducts()){
      if(matchesProduct(product,query))set.add(norm(canonicalGame(product.juego)));
    }
    return set;
  }

  function gameMeta(key,label=''){
    const product=allProducts().find(p=>norm(canonicalGame(p.juego))===key);
    return {key,label:label||canonicalGame(product?.juego)||key,category:product?.categoria||''};
  }

  function saveFavoriteRemote(meta,enabled){
    return (async()=>{
      const {data}=await sb.auth.getSession();
      const user=data?.session?.user;
      if(!user)return;
      if(enabled){
        await sb.from('user_favorites').upsert({
          user_id:user.id,
          favorite_key:meta.key,
          label:meta.label,
          category:meta.category||null
        },{onConflict:'user_id,favorite_key',ignoreDuplicates:true});
      }else{
        await sb.from('user_favorites').delete().eq('user_id',user.id).eq('favorite_key',meta.key);
      }
    })().catch(()=>{});
  }

  async function syncRemote(){
    try{
      const {data}=await sb.auth.getSession();
      const user=data?.session?.user;
      if(!user)return;

      const {data:remote,error}=await sb.from('user_favorites')
        .select('favorite_key,label,category')
        .eq('user_id',user.id);
      if(error)throw error;

      const remoteKeys=new Set((remote||[]).map(row=>norm(row.favorite_key)));
      const missing=[];
      for(const meta of favorites.values()){
        if(!remoteKeys.has(meta.key))missing.push({
          user_id:user.id,favorite_key:meta.key,label:meta.label,category:meta.category||null
        });
      }
      if(missing.length){
        await sb.from('user_favorites').upsert(missing,{onConflict:'user_id,favorite_key',ignoreDuplicates:true});
      }
      for(const row of remote||[]){
        const key=norm(row.favorite_key);
        if(key&&!favorites.has(key))favorites.set(key,{key,label:row.label||key,category:row.category||''});
      }
      persistLocal();
      scheduleApply();
    }catch{}
  }

  function toggleFavorite(key,label,categoryName){
    const meta={key:norm(key),label:String(label||'Favorito').slice(0,160),category:String(categoryName||'').slice(0,80)};
    if(!meta.key)return;
    const enabled=!favorites.has(meta.key);
    if(enabled)favorites.set(meta.key,meta);else favorites.delete(meta.key);
    persistLocal();
    saveFavoriteRemote(meta,enabled);
    scheduleApply();
  }

  function injectUi(){
    if(installed)return;
    const tabs=$('categoryTabs');
    const panel=tabs?.closest('.catalog-panel');
    if(!tabs||!panel)return;
    installed=true;

    const wrap=document.createElement('section');
    wrap.id='fsCatalogAssist';
    wrap.className='fs-catalog-assist';
    wrap.innerHTML=`
      <div class="fs-search-wrap">
        <input id="fsCatalogSearch" type="search" autocomplete="off" spellcheck="false" inputmode="search"
          aria-label="Buscar juegos, plataformas o paquetes" placeholder="Buscar: Free Fire, ML, Netflix, diamantes…">
        <button id="fsCatalogSearchClear" class="fs-search-clear" type="button" aria-label="Limpiar búsqueda">×</button>
      </div>
      <div id="fsCatalogSuggestions" class="fs-search-suggestions" hidden></div>
      <div id="fsFavoriteStrip" class="fs-favorite-strip" hidden></div>`;
    panel.insertBefore(wrap,tabs);

    $('fsCatalogSearch')?.addEventListener('input',()=>{renderSuggestions();scheduleApply();});
    $('fsCatalogSearch')?.addEventListener('keydown',event=>{
      if(event.key==='Escape'){event.currentTarget.value='';renderSuggestions();scheduleApply();}
    });
    $('fsCatalogSearchClear')?.addEventListener('click',()=>{
      const input=$('fsCatalogSearch');if(input)input.value='';
      favoritesOnly=false;renderSuggestions();scheduleApply();input?.focus();
    });
  }

  function renderSuggestions(){
    const host=$('fsCatalogSuggestions');
    const input=$('fsCatalogSearch');
    if(!host||!input)return;
    const q=input.value.trim();
    if(!q){host.hidden=true;host.innerHTML='';return}

    const seen=new Set(),rows=[];
    for(const product of allProducts()){
      const game=canonicalGame(product.juego),key=norm(game);
      if(seen.has(key)||!matchesProduct(product,q))continue;
      seen.add(key);
      rows.push({game,key,category:product.categoria});
      if(rows.length>=6)break;
    }
    host.innerHTML=rows.map(row=>`<button class="fs-search-suggestion" type="button" data-fs-suggest="${escHtml(row.key)}"><b>${escHtml(row.game)}</b><small>${escHtml(row.category)}</small></button>`).join('');
    host.hidden=!rows.length;
    host.querySelectorAll('[data-fs-suggest]').forEach(button=>button.addEventListener('click',()=>{
      const row=rows.find(item=>item.key===button.dataset.fsSuggest);
      if(!row)return;
      selectGame(row.game,row.category);
      host.hidden=true;
    }));
  }

  function selectGame(game,categoryName){
    try{
      if(CATEGORIES.includes(categoryName)){
        category=categoryName;
        renderCategoryTabs();
        renderCatalog();
      }
      const input=$('fsCatalogSearch');
      if(input)input.value=game;
      favoritesOnly=false;
      scheduleApply();
      setTimeout(()=>{
        const card=[...document.querySelectorAll('#catalogList .game-card')]
          .find(node=>norm(node.querySelector('.game-info b')?.textContent)===norm(game));
        card?.scrollIntoView({behavior:'smooth',block:'center'});
      },30);
    }catch{}
  }

  function decorateCards(){
    document.querySelectorAll('#catalogList .game-card').forEach(card=>{
      const head=card.querySelector('.game-card-head');
      const label=card.querySelector('.game-info b')?.textContent?.trim()||'';
      if(!head||!label)return;
      const key=norm(label);
      let button=head.querySelector('.fs-favorite-btn');
      if(!button){
        button=document.createElement('button');
        button.type='button';
        button.className='fs-favorite-btn';
        button.setAttribute('aria-label',`Guardar ${label} en favoritos`);
        button.addEventListener('click',event=>{
          event.preventDefault();event.stopPropagation();
          toggleFavorite(key,label,category);
        });
        head.appendChild(button);
      }
      const active=favorites.has(key);
      button.dataset.active=active?'1':'0';
      button.textContent=active?'♥':'♡';
      button.setAttribute('aria-pressed',active?'true':'false');
    });
  }

  function renderFavoriteStrip(){
    const host=$('fsFavoriteStrip');
    if(!host)return;
    const metas=[...favorites.values()]
      .map(meta=>gameMeta(meta.key,meta.label))
      .filter(meta=>allProducts().some(p=>norm(canonicalGame(p.juego))===meta.key))
      .slice(0,12);
    if(!metas.length){host.hidden=true;host.innerHTML='';favoritesOnly=false;return}
    host.hidden=false;
    host.innerHTML=`<button type="button" class="fs-favorite-chip is-filter" data-fs-fav-filter="1">♥ Favoritos (${metas.length})</button>`+
      metas.map(meta=>`<button type="button" class="fs-favorite-chip" data-fs-fav-game="${escHtml(meta.key)}">${escHtml(meta.label)}</button>`).join('');
    host.querySelector('[data-fs-fav-filter]')?.addEventListener('click',()=>{
      favoritesOnly=!favoritesOnly;
      scheduleApply();
    });
    host.querySelectorAll('[data-fs-fav-game]').forEach(button=>button.addEventListener('click',()=>{
      const meta=metas.find(item=>item.key===button.dataset.fsFavGame);
      if(meta)selectGame(meta.label,meta.category);
    }));
  }

  function applyFilter(){
    applying=false;
    injectUi();
    decorateCards();
    renderFavoriteStrip();

    const input=$('fsCatalogSearch');
    const q=input?.value?.trim()||'';
    const matches=matchedGameKeys(q);
    let visible=0;
    document.querySelectorAll('#catalogList .game-card').forEach(card=>{
      const key=norm(card.querySelector('.game-info b')?.textContent);
      const show=(!q||matches.has(key))&&(!favoritesOnly||favorites.has(key));
      card.classList.toggle('fs-search-hidden',!show);
      if(show)visible+=1;
    });
    const meta=$('catalogMeta');
    if(meta&&(q||favoritesOnly)){
      meta.textContent=visible
        ? `${visible} resultado${visible===1?'':'s'} ${favoritesOnly?'en favoritos':''}`.trim()
        : 'No encontramos coincidencias. Prueba otro nombre o abre otra categoría.';
    }
    document.querySelector('[data-fs-fav-filter]')?.classList.toggle('is-filter',favoritesOnly);
  }

  function scheduleApply(){
    if(applying)return;
    applying=true;
    requestAnimationFrame(applyFilter);
  }

  function handleDeepLink(){
    if(deepLinkHandled||!allProducts().length)return;
    const params=new URL(location.href).searchParams;
    const renew=norm(params.get('renew'));
    if(!renew)return;
    deepLinkHandled=true;

    const product=allProducts().find(p=>{
      const gameKey=norm(canonicalGame(p.juego));
      return p.categoria==='Streaming'&&(gameKey.includes(renew)||renew.includes(gameKey));
    });
    try{
      category='Streaming';
      renderCategoryTabs();
      renderCatalog();
      navigate('tienda');
      const input=$('fsCatalogSearch');
      if(input)input.value=product?canonicalGame(product.juego):params.get('renew')||'';
      scheduleApply();
      setTimeout(()=>{
        const card=[...document.querySelectorAll('#catalogList .game-card')]
          .find(node=>norm(node.querySelector('.game-info b')?.textContent)===norm(product?canonicalGame(product.juego):renew));
        if(card){card.classList.add('fs-renew-target');card.scrollIntoView({behavior:'smooth',block:'center'});}
      },80);
    }catch{}
  }

  function boot(){
    injectUi();
    const list=$('catalogList');
    if(list){
      observer=new MutationObserver(()=>scheduleApply());
      observer.observe(list,{childList:true,subtree:true});
    }
    document.addEventListener('fs:catalog-updated',()=>{scheduleApply();handleDeepLink();});
    try{sb.auth.onAuthStateChange((_event,newSession)=>{if(newSession)setTimeout(syncRemote,0);});}catch{}
    syncRemote();
    scheduleApply();
    handleDeepLink();
  }

  window.FSSmartCatalog=Object.freeze({
    refresh:scheduleApply,
    favorites:()=>[...favorites.values()]
  });

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();