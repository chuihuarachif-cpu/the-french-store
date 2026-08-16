/* THE FRENCH STORE — Web V2 Revision 6 patch
   Loaded after app.js. Keeps backend/business logic intact and replaces only UX/catalog/auth presentation. */
(() => {
  'use strict';

  let selectedGameR6 = null;
  let selectedCategoryR6 = null;
  let signupCooldownUntilR6 = 0;

  const GAME_THEMES_R6 = [
    { keys:['asphalt'], theme:'racing', genre:'Carreras', icon:'🏎️', line:'Velocidad, autos y competición.' },
    { keys:['minecraft'], theme:'sandbox', genre:'Sandbox', icon:'⛏️', line:'Bloques, exploración y construcción.' },
    { keys:['roblox'], theme:'sandbox', genre:'Experiencias', icon:'🧱', line:'Mundos, experiencias y comunidad.' },
    { keys:['mobilelegends','honorofkings','teamfighttactics','magicchess'], theme:'moba', genre:'MOBA / estrategia', icon:'⚔️', line:'Héroes, estrategia y competición.' },
    { keys:['wutheringwaves','genshinimpact','honkaistarrail','zenlesszonezero'], theme:'rpg', genre:'RPG / gacha', icon:'✨', line:'Personajes, exploración y progreso.' },
    { keys:['freefire','pubgmobile','bloodstrike','arenabreakout','deltaforce','standoff2','marvelrivals','fortnite'], theme:'shooter', genre:'Acción / shooter', icon:'🎯', line:'Combate, acción y partidas competitivas.' },
    { keys:['clashofclans','clashroyale'], theme:'strategy', genre:'Estrategia', icon:'🛡️', line:'Ejércitos, arenas y progreso.' },
    { keys:['valorant','leagueoflegends'], theme:'competitive', genre:'Competitivo', icon:'🏆', line:'Rango, competición y progreso.' },
    { keys:['steam','tiktok','netflix','disney','hbomax','primevideo','spotify','crunchyroll','vix'], theme:'digital', genre:'Digital', icon:'🎮', line:'Servicios y contenido digital.' }
  ];

  function gameThemeR6(game){
    const key = normalize(game);
    return GAME_THEMES_R6.find(t => t.keys.some(k => key.includes(k) || k.includes(key))) ||
      { theme:'default', genre: category === 'Streaming' ? 'Streaming' : category === 'Gift Cards' ? 'Gift Card' : 'Gaming', icon:'💎', line:'Contenido digital para tu cuenta.' };
  }

  function minPriceR6(products){
    const nums = products.map(p => Number(p.precio)).filter(n => Number.isFinite(n) && n > 0);
    return nums.length ? Math.min(...nums) : 0;
  }

  function currentGroupsR6(){
    return productGroups(inventory.filter(p => p.activo === true && p.categoria === category));
  }

  function categoryLabelR6(){
    if(category === 'Streaming') return 'plataforma';
    if(category === 'Gift Cards') return 'marca';
    return 'juego';
  }

  function catalogCardR6(game, products){
    const logo = logoUrl(game);
    const theme = gameThemeR6(game);
    const from = minPriceR6(products);
    return `<button class="r6-game-card theme-${theme.theme}" type="button" data-r6-game="${esc(game)}" aria-label="Abrir ${esc(game)}">
      <span class="r6-game-art">${logo ? `<img src="${esc(logo)}" alt="${esc(game)}" loading="lazy" decoding="async">` : `<span class="r6-game-fallback">${theme.icon}</span>`}</span>
      <span class="r6-game-card-body">
        <span class="r6-game-genre">${esc(theme.genre)}</span>
        <strong>${esc(game)}</strong>
        <small>${products.length} ${products.length === 1 ? 'opción' : 'opciones'}</small>
        <span class="r6-game-card-foot"><b>${from ? `Desde ${money(from)}` : 'Ver opciones'}</b><i aria-hidden="true">→</i></span>
      </span>
    </button>`;
  }

  function packageCardR6(product){
    return `<article class="r6-package-card">
      <div class="r6-package-copy">
        <strong>${esc(product.paquete)}</strong>
        ${product.categoria === 'Gift Cards' ? '<small>🔑 Código digital · Entrega manual</small>' : '<small>Producto disponible</small>'}
      </div>
      <div class="r6-package-actions">
        <b>${money(product.precio)}</b>
        <button class="add-btn" type="button" data-add="${product.id}">+ Carrito</button>
      </div>
    </article>`;
  }

  function renderGameDetailR6(game, products){
    const box = $('catalogList');
    const theme = gameThemeR6(game);
    const logo = logoUrl(game);
    const sorted = [...products].sort((a,b) => Number(a.precio) - Number(b.precio));
    $('categoryEyebrow').textContent = `${category.toUpperCase()} · ${theme.genre.toUpperCase()}`;
    $('catalogMeta').textContent = `${sorted.length} ${sorted.length === 1 ? 'opción disponible' : 'opciones disponibles'}`;
    box.className = 'game-list r6-detail-list';
    box.innerHTML = `<section class="r6-game-detail theme-${theme.theme}" style="--r6-hero:${logo ? `url('${esc(logo)}')` : 'none'}">
      <button class="r6-back" type="button" data-r6-back>← Volver al catálogo</button>
      <div class="r6-hero">
        <div class="r6-hero-glow" aria-hidden="true"></div>
        <div class="r6-hero-logo">${logo ? `<img src="${esc(logo)}" alt="${esc(game)}" decoding="async">` : `<span>${theme.icon}</span>`}</div>
        <div class="r6-hero-copy">
          <span class="r6-game-genre">${esc(theme.genre)} · FRENCH STORE</span>
          <h3>${esc(game)}</h3>
          <p>${esc(theme.line)} Elige el paquete que necesitas.</p>
          <div class="r6-hero-tags"><span>${esc(category)}</span><span>${sorted.length} opciones</span>${category === 'Gift Cards' ? '<span>Entrega manual</span>' : ''}</div>
        </div>
      </div>
      <div class="r6-packages-head"><div><span class="eyebrow">PAQUETES</span><h3>Elige tu recarga</h3></div><span>${sorted.length} disponibles</span></div>
      <div class="r6-package-grid">${sorted.map(packageCardR6).join('')}</div>
    </section>`;
    box.querySelector('[data-r6-back]')?.addEventListener('click', () => closeGameR6(true));
    bindAddButtons(box);
    window.scrollTo({top:0,behavior:'auto'});
  }

  function setGameUrlR6(game, replace=false){
    const url = new URL(location.href);
    if(game){
      url.searchParams.set('game', game);
      url.searchParams.set('cat', category);
    } else {
      url.searchParams.delete('game');
      url.searchParams.delete('cat');
    }
    history[replace ? 'replaceState' : 'pushState']({r6Game:game||null},'',url.pathname + url.search + url.hash);
  }

  function openGameR6(game, push=true){
    const groups = currentGroupsR6();
    const found = groups.find(([name]) => name === game);
    if(!found) return;
    selectedGameR6 = found[0];
    selectedCategoryR6 = category;
    if(push) setGameUrlR6(selectedGameR6, false);
    renderGameDetailR6(found[0], found[1]);
  }

  function closeGameR6(useHistory=false){
    selectedGameR6 = null;
    selectedCategoryR6 = null;
    if(useHistory && new URL(location.href).searchParams.has('game')) history.back();
    else { setGameUrlR6(null, true); renderCatalogR6(); }
  }

  function bindCatalogCardsR6(){
    $('catalogList')?.querySelectorAll('[data-r6-game]').forEach(btn => {
      btn.addEventListener('click', () => openGameR6(btn.dataset.r6Game, true));
    });
  }

  function renderCatalogR6(){
    if(selectedGameR6 && selectedCategoryR6 !== category){
      selectedGameR6 = null;
      selectedCategoryR6 = null;
    }
    const groups = currentGroupsR6();
    if(selectedGameR6){
      const found = groups.find(([g]) => g === selectedGameR6);
      if(found){ renderGameDetailR6(found[0], found[1]); return; }
      selectedGameR6 = null;
    }
    const items = inventory.filter(p => p.activo === true && p.categoria === category);
    $('categoryEyebrow').textContent = category.toUpperCase();
    $('catalogMeta').textContent = `${groups.length} ${categoryLabelR6()}${groups.length===1?'':'s'} · ${items.length} opciones`;
    $('catalogList').className = 'game-list r6-game-grid';
    $('catalogList').innerHTML = groups.length
      ? groups.map(([g,p]) => catalogCardR6(g,p)).join('')
      : '<div class="auth-required"><b>Sin productos disponibles</b>Esta sección no tiene productos activos.</div>';
    bindCatalogCardsR6();
  }

  function renderCategoryTabsR6(){
    const box = $('categoryTabs');
    box.innerHTML = CATEGORIES.map(c=>`<button class="${c===category?'active':''}" data-cat="${esc(c)}">${esc(c)}</button>`).join('');
    box.querySelectorAll('button').forEach(b => b.onclick = () => {
      category = b.dataset.cat;
      selectedGameR6 = null;
      selectedCategoryR6 = null;
      setGameUrlR6(null, true);
      renderCategoryTabsR6();
      renderCatalogR6();
    });
  }

  function renderFeaturedR6(){
    const groups = productGroups(inventory.filter(p => p.activo === true));
    const preferred=['Mobile Legends','Free Fire','Wuthering Waves','Clash Of Clans','PUBG'];
    const score = name => { const i = preferred.findIndex(p => normalize(name).includes(normalize(p))); return i < 0 ? 99 : i; };
    const picked = [...groups].sort((a,b)=>score(a[0])-score(b[0])).slice(0,4);
    const box = $('featuredList');
    box.innerHTML = picked.length ? picked.map(([g,p]) => {
      const logo = logoUrl(g), theme = gameThemeR6(g);
      const firstCat = p[0]?.categoria || 'Recargas por ID';
      return `<button class="r6-feature-card theme-${theme.theme}" type="button" data-r6-feature="${esc(g)}" data-r6-feature-cat="${esc(firstCat)}">
        ${logo ? `<img src="${esc(logo)}" alt="${esc(g)}" loading="lazy" decoding="async">` : `<span class="r6-feature-fallback">${theme.icon}</span>`}
        <span><b>${esc(g)}</b><small>${p.length} opciones disponibles</small></span><i>→</i>
      </button>`;
    }).join('') : '<div class="auth-required">No hay productos destacados.</div>';
    box.querySelectorAll('[data-r6-feature]').forEach(btn => btn.onclick = () => {
      category = btn.dataset.r6FeatureCat;
      selectedGameR6 = null;
      selectedCategoryR6 = null;
      renderCategoryTabsR6();
      navigate('tienda');
      requestAnimationFrame(() => openGameR6(btn.dataset.r6Feature, true));
    });
  }

  function friendlyAuthErrorR6(error){
    const raw = String(error?.message || error || '').toLowerCase();
    if(raw.includes('email rate limit')) return 'Se alcanzó temporalmente el límite de correos de confirmación. No vuelvas a pulsar varias veces. Intenta más tarde; estamos preparando un servidor de correo propio para evitar este límite.';
    if(raw.includes('email not confirmed')) return 'Tu cuenta existe, pero falta confirmar el correo. Abre el email de confirmación antes de entrar.';
    if(raw.includes('already registered') || raw.includes('user already')) return 'Ese correo ya está registrado. Usa “Entrar” o recupera tu contraseña.';
    if(raw.includes('password')) return 'La contraseña no cumple los requisitos. Usa al menos 8 caracteres.';
    return 'No se pudo completar el registro. Intenta nuevamente en unos minutos.';
  }

  async function signUpR6(){
    hideNotice($('loginMessage'));
    const email = $('loginEmail').value.trim();
    const password = $('loginPassword').value;
    if(!email || !/^\S+@\S+\.\S+$/.test(email) || password.length < 8){
      showNotice($('loginMessage'),'Usa un correo válido y una contraseña de al menos 8 caracteres.','error');
      return;
    }
    const now = Date.now();
    if(now < signupCooldownUntilR6){
      const sec = Math.ceil((signupCooldownUntilR6-now)/1000);
      showNotice($('loginMessage'),`Espera ${sec} s antes de volver a solicitar otro correo.`, 'error');
      return;
    }
    signupCooldownUntilR6 = now + 60000;
    const redirectTo = `${location.origin}${location.pathname}`;
    const {data,error} = await sb.auth.signUp({email,password,options:{emailRedirectTo:redirectTo}});
    if(error){
      showNotice($('loginMessage'),friendlyAuthErrorR6(error),'error');
      return;
    }
    if(data?.session){
      closeModal('authModal');
      return;
    }
    showNotice($('loginMessage'),'Cuenta creada. Te enviamos un correo de confirmación. Ábrelo una sola vez y volverás a FRENCH STORE.','success');
  }

  async function signInR6(){
    hideNotice($('loginMessage'));
    const email = $('loginEmail').value.trim(), password = $('loginPassword').value;
    if(!email || !password){ showNotice($('loginMessage'),'Completa correo y contraseña.','error'); return; }
    const {error} = await sb.auth.signInWithPassword({email,password});
    if(error){ showNotice($('loginMessage'),friendlyAuthErrorR6(error),'error'); return; }
    closeModal('authModal');
  }

  function formatDateR6(v){
    if(!v) return '—';
    try { return new Intl.DateTimeFormat('es-BO',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'}).format(new Date(v)); }
    catch { return dateFmt(v); }
  }

  async function loadOrdersR6(){
    if(!session) return;
    const {data,error} = await sb.from('orders').select('id,order_code,status,payment_method,total_amount,currency,created_at,updated_at,customer_note').eq('user_id',session.user.id).order('created_at',{ascending:false}).limit(50);
    $('ordersList').innerHTML = error ? `<div class="notice error">${esc(error.message)}</div>` : (data||[]).map(o => `<article class="record r6-order">
      <div class="r6-order-main"><div><b class="r6-order-code">${esc(o.order_code)}</b><span class="r6-order-date">${formatDateR6(o.created_at)}</span></div>${statusHtml(o.status)}</div>
      <div class="r6-order-meta"><strong>${money(o.total_amount)}</strong><span>${esc(o.payment_method)}</span>${o.customer_note?`<span>${esc(o.customer_note)}</span>`:''}</div>
    </article>`).join('') || '<div class="record"><small>Aún no tienes pedidos.</small></div>';
  }

  function applyAuthPatchR6(){
    $('loginSubmit').onclick = signInR6;
    const modal = $('authModal');
    const signup = [...modal.querySelectorAll('button')].find(b => b.textContent.trim() === 'Crear cuenta');
    if(signup){ signup.onclick = signUpR6; signup.dataset.r6Signup='1'; }
    $('refreshOrders').onclick = loadOrdersR6;
  }

  function restoreFromUrlR6(){
    const params = new URLSearchParams(location.search);
    const game = params.get('game');
    const cat = params.get('cat');
    if(cat && CATEGORIES.includes(cat)) category = cat;
    if(game){ selectedGameR6 = game; selectedCategoryR6 = category; }
  }

  function patchCategoryCardsR6(){
    document.querySelectorAll('[data-category]').forEach(btn => btn.onclick = () => {
      category = btn.dataset.category;
      selectedGameR6 = null;
      selectedCategoryR6 = null;
      setGameUrlR6(null, true);
      renderCategoryTabsR6();
      renderCatalogR6();
      navigate('tienda');
    });
  }

  function bootR6(){
    restoreFromUrlR6();
    window.renderCatalog = renderCatalogR6;
    window.renderCategoryTabs = renderCategoryTabsR6;
    window.renderFeatured = renderFeaturedR6;
    window.signUp = signUpR6;
    window.signIn = signInR6;
    window.loadOrders = loadOrdersR6;
    applyAuthPatchR6();
    patchCategoryCardsR6();
    if(inventory.length){ renderCategoryTabsR6(); renderCatalogR6(); renderFeaturedR6(); }
    window.addEventListener('popstate', () => {
      selectedGameR6 = null; selectedCategoryR6 = null;
      restoreFromUrlR6();
      if(document.getElementById('view-tienda')?.classList.contains('active')) renderCatalogR6();
    });
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bootR6, {once:true});
  else bootR6();
})();
