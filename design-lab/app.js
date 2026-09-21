(() => {
  "use strict";

  // Defense in depth: this lab must never talk to production or third-party services.
  const blocked = (name) => () => Promise.reject(new Error("[Design Lab] " + name + " está bloqueado."));
  try { window.fetch = blocked("fetch"); } catch (_) {}
  try { window.XMLHttpRequest = class { constructor(){ throw new Error("[Design Lab] XMLHttpRequest está bloqueado."); } }; } catch (_) {}
  try { window.WebSocket = class { constructor(){ throw new Error("[Design Lab] WebSocket está bloqueado."); } }; } catch (_) {}
  try { window.EventSource = class { constructor(){ throw new Error("[Design Lab] EventSource está bloqueado."); } }; } catch (_) {}

  const data = window.FS_LAB_DATA || { categories: [], products: [], checkout: [] };
  const $ = (s, root = document) => root.querySelector(s);
  const all = (s, root = document) => [...root.querySelectorAll(s)];
  const titleMap = { inicio: "Inicio", catalogo: "Tienda", wallet: "Wallet", pedidos: "Pedidos", perfil: "Perfil", pases: "Pases", ajustes: "Ajustes", producto: "Producto", checkout: "Checkout", admin: "Admin" };
  const roleMap = { visitor: "Visitante", user: "Usuario", reseller: "Reseller", admin: "Admin" };
  const standalone = new URLSearchParams(location.search).has('standalone');
  document.documentElement.classList.toggle('standalone', standalone);
  let infoReturnFocus = null;
  let cartReturnFocus = null;
  let experienceReturnFocus = null;
  let currentView = "inicio";
  let activeFilter = "Todos";
  let toastTimer;
  let activeCategoryIndex = 0;
  let categoryGestureStartX = null;
  let categoryGestureStartY = null;
  const categoryFilterMap = {
    "recargas-id": "Recargas",
    "recargas-cuenta": "Recargas",
    "giftcards": "Gift Cards",
    "streaming": "Streaming",
    "cuentas": "Cuentas",
    "paginas": "Páginas Web"
  };

  const experienceCategoryMap = {
    "recargas-id": "Recargas por ID",
    "recargas-cuenta": "Recargas por Cuenta",
    "giftcards": "Gift Cards",
    "streaming": "Streaming",
    "cuentas": "Venta de Cuentas",
    "paginas": "Venta de Páginas"
  };
  const prefersLitePerformance = Boolean(
    new URLSearchParams(location.search).get("performance") === "lite" ||
    navigator.connection?.saveData ||
    window.matchMedia?.("(max-width: 700px)")?.matches ||
    (navigator.deviceMemory && navigator.deviceMemory <= 4) ||
    (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4)
  );
  document.documentElement.classList.toggle("perf-lite", prefersLitePerformance);

  const favoriteStorageKey = "fs-design-lab-favorite-games-v1";
  const cartStorageKey = "fs-design-lab-cart-v1";
  let experienceCategoryId = "recargas-id";
  let experienceGames = [];
  let activeExperienceGame = 0;
  let selectedExperienceProduct = null;
  let experienceFieldValues = {};
  let experienceGestureStartY = null;
  let experienceGestureStartX = null;
  let experienceForceLandscape = false;
  let experienceOrientationManaged = false;
  let favoriteOrder = loadLocalList(favoriteStorageKey);
  let labCart = loadLocalList(cartStorageKey);

  function loadLocalList(key){
    try {
      const value = JSON.parse(localStorage.getItem(key) || "[]");
      return Array.isArray(value) ? value : [];
    } catch (_) { return []; }
  }

  function saveLocalList(key, value){
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (_) {}
  }

  function escapeHtml(value){
    return String(value ?? "").replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  }

  function initials(value){
    const parts = String(value || "French Store").trim().split(/\s+/).filter(Boolean);
    return (parts.slice(0,2).map(part => part[0] || "").join("") || "FS").toUpperCase();
  }

  function favoriteKey(categoryId, gameName){
    return categoryId + "::" + String(gameName || "");
  }

  function isFavoriteGame(gameName){
    return favoriteOrder.includes(favoriteKey(experienceCategoryId, gameName));
  }

  function money(value){ return "Bs " + Number(value).toFixed(2).replace(".", ","); }

  function toast(message){
    const el = $("#toast");
    if (!el) return;
    el.textContent = message;
    el.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove("show"), 2600);
  }

  function syncOverlayInert(){
    const infoOpen=$('#infoHub')?.classList.contains('open');
    const cartOpen=$('#xCartDrawer')?.classList.contains('open');
    const experienceOpen=$('#xExperience')?.classList.contains('open');
    all('.store-header,.welcome-ticker,.store-view,.xarena-dock,.whatsapp-float').forEach(el=>el.inert=Boolean(infoOpen||cartOpen||experienceOpen));
    if ($('#xExperience')) $('#xExperience').inert=Boolean(!experienceOpen||infoOpen||cartOpen);
  }

  function setInfoHub(open){
    const hub = $("#infoHub");
    const backdrop = $("#infoHubBackdrop");
    const toggles = all("[data-info-toggle]");
    const isOpen = Boolean(open);
    if (isOpen) infoReturnFocus = document.activeElement;
    if (hub) hub.inert = !isOpen;
    hub?.classList.toggle("open", isOpen);
    backdrop?.classList.toggle("open", isOpen);
    hub?.setAttribute("aria-hidden", isOpen ? "false" : "true");
    toggles.forEach(toggle => toggle.setAttribute("aria-expanded", isOpen ? "true" : "false"));
    document.body.classList.toggle("info-center-open", isOpen);
    syncOverlayInert();
    if (isOpen) { setInfoPanel("social"); hub?.querySelector('[data-info-close]')?.focus({preventScroll:true}); }
    else if (infoReturnFocus) { infoReturnFocus.focus({preventScroll:true}); infoReturnFocus=null; }
    scheduleDeviceScale();
  }

  function setInfoPanel(name){
    const target=String(name||"social");
    all("[data-info-panel]").forEach(button=>{
      const selected=button.dataset.infoPanel===target;button.classList.toggle("active",selected);
      if(button.closest('.info-hub-nav')) {if(selected)button.setAttribute('aria-current','page');else button.removeAttribute('aria-current');}
    });
    all("[data-info-panel-view]").forEach(panel=>panel.classList.toggle("active",panel.dataset.infoPanelView===target));
  }

  function wrapCategoryIndex(index){
    const count = data.categories.length;
    if (!count) return 0;
    return ((Number(index) % count) + count) % count;
  }

  function circularDifference(cardIndex, activeIndex){
    const count = data.categories.length;
    if (!count) return 0;
    let diff = cardIndex - activeIndex;
    if (diff > count / 2) diff -= count;
    if (diff < -count / 2) diff += count;
    return diff;
  }

  function categoryCard(item, index){
    const accent = /^\d{1,3},\d{1,3},\d{1,3}$/.test(String(item.accentRgb || "").replace(/\s/g, "")) ? item.accentRgb : "98,231,255";
    return '<article class="category-card category-arena-card" data-category-index="' + index + '" data-category="' + item.id + '" style="--accent-rgb:' + accent + '" aria-label="' + escapeHtml(item.name) + '" role="group">'+
      '<div class="category-glass"><span class="hud-module-edge" aria-hidden="true"></span>'+
      '<span class="category-card-grid" aria-hidden="true"></span>'+
      '<span class="category-card-top"><span class="hud-module-label">FRENCH STORE</span><span class="category-tag">' + escapeHtml(item.tag || "FRENCH") + '</span></span>'+
      '<span class="category-art" aria-hidden="true"><img src="./assets/' + item.id + '.svg" width="480" height="300" alt="" decoding="async"></span>'+
      '<div class="category-console"><span class="category-copy"><b>' + escapeHtml(item.name) + '</b><small>' + escapeHtml(item.subtitle) + '</small></span>'+
      '<button class="category-enter" type="button" data-category-enter="' + index + '">Ingresar <i>→</i></button>'+
      '</div><div class="hud-module-foot" aria-hidden="true"><i></i><span>EXPLORA · ELIGE · INGRESA</span><i></i></div></div></article>';
  }

  function renderCategoryArena(){
    const grid = $("#categoryGrid");
    const count = data.categories.length;
    if (!grid || !count) return;
    grid.innerHTML = data.categories.map(categoryCard).join("");
    activeCategoryIndex = wrapCategoryIndex(activeCategoryIndex);
    requestAnimationFrame(() => setCategoryActive(activeCategoryIndex, false, true));
  }

  function setCategoryActive(index, _shouldMove = true, instant = false){
    const cards = all(".category-arena-card");
    const count = data.categories.length;
    if (!cards.length || !count) return;

    const next = wrapCategoryIndex(index);
    activeCategoryIndex = next;

    cards.forEach((card, cardIndex) => {
      const diff = circularDifference(cardIndex, next);
      const distance = Math.abs(diff);
      card.dataset.rouletteSlot = String(diff);
      card.dataset.distance = String(distance);
      card.dataset.side = diff < 0 ? "left" : diff > 0 ? "right" : "center";
      card.classList.toggle("active", diff === 0);
      card.classList.toggle("roulette-hidden", distance >= 3);
      card.setAttribute("aria-current", diff === 0 ? "true" : "false");
      card.setAttribute("aria-hidden", distance >= 3 ? "true" : "false");
      card.tabIndex = -1;
      card.inert = distance > 1;
      card.querySelector('button').tabIndex = distance <= 1 ? 0 : -1;
      if (instant) card.classList.add("roulette-instant");
      else card.classList.remove("roulette-instant");
    });

    if (instant) requestAnimationFrame(() => cards.forEach(card => card.classList.remove("roulette-instant")));

    const prev = $(".arena-arrow-prev");
    const nextButton = $(".arena-arrow-next");
    if (prev) prev.disabled = false;
    if (nextButton) nextButton.disabled = false;
  }

  function moveCategory(direction){
    if (!direction) return;
    setCategoryActive(activeCategoryIndex + (direction < 0 ? -1 : 1));
  }

  function categorySnapshot(categoryId){
    const mapped = experienceCategoryMap[categoryId];
    if (!mapped) return [];

    if (categoryId === "cuentas") {
      const grouped = new Map();
      (data.accountListings || []).forEach(item => {
        const key = item.game || "Cuentas";
        if (!grouped.has(key)) grouped.set(key, []);
        grouped.get(key).push({
          id:item.id, category:mapped, game:key, package:item.package, price:item.price,
          priceLabel:money(item.price), description:item.description || "", inputs:[], icon:""
        });
      });
      return [...grouped].map(([name,packages],originalIndex)=>({name,packages,originalIndex,icon:""}));
    }

    if (categoryId === "paginas") {
      return (data.webPlans || []).map((item,originalIndex)=>({
        name:item.game, originalIndex, icon:"",
        packages:[{
          id:item.id, category:mapped, game:item.game, package:item.package, price:null,
          priceLabel:item.priceLabel, description:item.description || "", inputs:[]
        }]
      }));
    }

    const grouped = new Map();
    (data.experienceProducts || []).filter(item => item.category === mapped).forEach(item => {
      if (!grouped.has(item.game)) grouped.set(item.game, []);
      grouped.get(item.game).push(item);
    });
    return [...grouped].map(([name,packages],originalIndex)=>({
      name, packages, originalIndex, icon:packages.find(p=>p.icon)?.icon || ""
    }));
  }

  function sortExperienceGames(games){
    const ranks = new Map(favoriteOrder.map((key,index)=>[key,index]));
    return [...games].sort((a,b)=>{
      const ar=ranks.get(favoriteKey(experienceCategoryId,a.name));
      const br=ranks.get(favoriteKey(experienceCategoryId,b.name));
      const af=Number.isInteger(ar), bf=Number.isInteger(br);
      if (af && bf) return ar-br;
      if (af) return -1;
      if (bf) return 1;
      return a.originalIndex-b.originalIndex;
    });
  }

  function activeExperience(){
    return experienceGames[activeExperienceGame] || null;
  }

  function unionInputs(packages){
    const map = new Map();
    (packages || []).forEach(product => (product.inputs || []).forEach(field => {
      if (!map.has(field.field_key)) map.set(field.field_key, field);
    }));
    if (!map.size && experienceCategoryId === "recargas-cuenta") {
      map.set("account_user",{field_key:"account_user",label:"Correo o usuario",input_type:"text",required:true,placeholder:"Dato de acceso de la cuenta",options:[],sort_order:10});
      map.set("account_password",{field_key:"account_password",label:"Contraseña",input_type:"text",required:true,placeholder:"Contraseña de la cuenta",options:[],sort_order:20});
    }
    return [...map.values()].sort((a,b)=>(a.sort_order||0)-(b.sort_order||0));
  }

  function priceLabel(product){
    if (product?.priceLabel) return product.priceLabel;
    return Number.isFinite(Number(product?.price)) ? money(product.price) : "Cotizar";
  }

  function gameCardMarkup(game,index){
    const image = game.icon ? '<img class="x-game-thumb" data-src="'+escapeHtml(game.icon)+'" alt="" decoding="async" fetchpriority="low">' : '';
    return '<button class="x-game-card" type="button" data-x-game-index="'+index+'" aria-label="'+escapeHtml(game.name)+'">'+
      '<span class="x-game-thumb-shell">'+image+'<i>'+escapeHtml(initials(game.name))+'</i></span>'+
      '<span class="x-game-name">'+escapeHtml(game.name)+'</span>'+
      '</button>';
  }

  function wrapExperienceIndex(index){
    const count=experienceGames.length;
    if (!count) return 0;
    return ((Number(index)%count)+count)%count;
  }

  function experienceCircularDifference(cardIndex,activeIndex){
    const count=experienceGames.length;
    if (!count) return 0;
    let diff=cardIndex-activeIndex;
    if (diff>count/2) diff-=count;
    if (diff<-count/2) diff+=count;
    return diff;
  }

  function renderExperienceWheel(instant=false){
    const wheel=$("#xGameWheel");
    if (!wheel) return;
    wheel.innerHTML=experienceGames.map(gameCardMarkup).join("");
    setExperienceGame(activeExperienceGame, instant);
  }

  function setExperienceGame(index, instant=false){
    if (!experienceGames.length) return;
    const next=wrapExperienceIndex(index);
    activeExperienceGame=next;
    selectedExperienceProduct=null;
    experienceFieldValues={};

    all(".x-game-card").forEach((card,cardIndex)=>{
      const diff=experienceCircularDifference(cardIndex,next);
      const distance=Math.abs(diff);
      card.dataset.xSlot=String(diff);
      card.dataset.xDistance=String(distance);
      card.classList.toggle("active",diff===0);
      card.classList.toggle("x-hidden",distance>2);
      card.setAttribute("aria-current",diff===0?"true":"false");
      card.setAttribute("aria-hidden",distance>2?"true":"false");
      card.tabIndex=distance<=1?0:-1;
      const thumb=card.querySelector(".x-game-thumb");
      if (thumb) {
        thumb.fetchPriority=distance<=1?"high":"low";
        if (distance<=2 && !thumb.getAttribute("src") && thumb.dataset.src) {
          thumb.setAttribute("src",thumb.dataset.src);
        }
      }
      card.classList.toggle("x-instant",Boolean(instant));
    });
    if (instant) requestAnimationFrame(()=>all(".x-game-card").forEach(card=>card.classList.remove("x-instant")));

    const up=$('[data-x-game-step="-1"]');
    const down=$('[data-x-game-step="1"]');
    if (up) up.disabled=false;
    if (down) down.disabled=false;
    renderExperienceDetail();
  }

  function renderExperienceDetail(){
    const game=activeExperience();
    if (!game) return;

    const category=data.categories.find(item=>item.id===experienceCategoryId);
    const categoryLabel=$("#xCategoryLabel");
    const breadcrumb=$("#xGameBreadcrumb");
    const title=$("#xShowcaseTitle");
    const type=$("#xShowcaseType");
    const meta=$("#xShowcaseMeta");
    const image=$("#xShowcaseImage");
    const fallback=$("#xShowcaseFallback");
    if (categoryLabel) categoryLabel.textContent=(category?.name || experienceCategoryMap[experienceCategoryId] || "French Store").toUpperCase();
    if (breadcrumb) breadcrumb.textContent=game.name;
    if (title) title.textContent=game.name;
    if (type) type.textContent=category?.tag || "FRENCH STORE";
    if (meta) meta.textContent=category?.subtitle || "Elige tu experiencia";
    if (fallback) fallback.textContent=initials(game.name);
    if (image) {
      image.classList.remove("loaded","failed");
      if (game.icon) image.src=game.icon;
      else image.removeAttribute("src");
    }

    const favorite=$("[data-x-favorite]");
    if (favorite) {
      const active=isFavoriteGame(game.name);
      favorite.classList.toggle("active",active);
      favorite.textContent=active?"♥":"♡";
      favorite.setAttribute("aria-label",active?"Quitar de favoritos":"Agregar a favoritos");
    }

    const fields=unionInputs(game.packages);
    const fieldWrap=$("#xInputFields");
    if (fieldWrap) {
      fieldWrap.innerHTML=fields.length?fields.map(field=>{
        const key=escapeHtml(field.field_key);
        const label=escapeHtml(field.label || field.field_key);
        const placeholder=escapeHtml(field.placeholder || "Completa este dato");
        if (field.input_type==="select" && Array.isArray(field.options)) {
          return '<label class="x-input-field"><span>'+label+'</span><select data-x-field="'+key+'" '+(field.required?"required":"")+'><option value="">Seleccionar…</option>'+
            field.options.map(opt=>'<option value="'+escapeHtml(opt.value)+'">'+escapeHtml(opt.label)+'</option>').join("")+
            '</select></label>';
        }
        const typeAttr=field.field_key==="account_password"?"password":"text";
        return '<label class="x-input-field"><span>'+label+'</span><input type="'+typeAttr+'" data-x-field="'+key+'" placeholder="'+placeholder+'" '+(field.required?"required":"")+' autocomplete="off"></label>';
      }).join(""):'<div class="x-no-inputs">No necesitas datos adicionales para seleccionar este producto.</div>';
    }

    const list=$("#xPackageList");
    if (list) {
      list.innerHTML=game.packages.map((product,index)=>{
        return '<article class="x-package-card" data-x-package-index="'+index+'">'+
          '<button class="x-package-select" type="button" data-x-select-package="'+index+'" aria-pressed="false">'+
            '<span class="x-package-name">'+escapeHtml(product.package)+'</span>'+
            '<strong class="x-package-price">'+escapeHtml(priceLabel(product))+'</strong>'+
          '</button>'+
          '<button class="x-package-cart" type="button" data-x-add-package="'+index+'">Añadir al carrito</button>'+
          '</article>';
      }).join("");
    }
    updateExperienceBuyState();
  }

  function currentFieldsValid(){
    const game=activeExperience();
    if (!game || !selectedExperienceProduct) return false;
    const fields=unionInputs(game.packages);
    return fields.every(field=>{
      if (!field.required) return true;
      return String(experienceFieldValues[field.field_key] || "").trim().length>0;
    });
  }

  function updateExperienceBuyState(){
    const button=$("#xBuyButton");
    const label=$("#xSelectedProductLabel");
    if (label) label.textContent=selectedExperienceProduct ? selectedExperienceProduct.package+" · "+priceLabel(selectedExperienceProduct) : "Selecciona un producto";
    if (button) button.disabled=!currentFieldsValid();
  }

  function selectExperiencePackage(index){
    const game=activeExperience();
    const selectedIndex=Number(index);
    const product=game?.packages?.[selectedIndex];
    if (!product) return;
    selectedExperienceProduct=product;
    all(".x-package-card").forEach((card,cardIndex)=>{
      const active=cardIndex===selectedIndex;
      card.classList.toggle("active",active);
      card.querySelector("[data-x-select-package]")?.setAttribute("aria-pressed",active?"true":"false");
    });
    updateExperienceBuyState();
  }

  function sanitizedCartItem(product){
    const game=activeExperience();
    return {
      id:String(product.id),
      category:experienceCategoryId,
      game:game?.name || product.game || "French Store",
      package:product.package || "Producto",
      price:Number.isFinite(Number(product.price))?Number(product.price):null,
      priceLabel:priceLabel(product)
    };
  }

  function addCurrentToCart(){
    if (!selectedExperienceProduct) {
      toast("Selecciona primero un producto.");
      return false;
    }
    if (!currentFieldsValid()) {
      toast("Completa los datos requeridos antes de continuar.");
      all(".x-input-field input:invalid,.x-input-field select:invalid").forEach(el=>el.classList.add("needs-value"));
      return false;
    }
    labCart.push(sanitizedCartItem(selectedExperienceProduct));
    saveLocalList(cartStorageKey,labCart);
    updateCartBadges();
    renderLabCart();
    toast("Añadido al carrito del laboratorio.");
    return true;
  }

  function updateCartBadges(){
    const count=labCart.length;
    const main=$("#cartCount");
    const local=$("#xCartCount");
    if (main) main.textContent=String(count);
    if (local) local.textContent=String(count);
  }

  function renderLabCart(){
    const wrap=$("#xCartItems");
    if (!wrap) return;
    if (!labCart.length) {
      wrap.innerHTML='<div class="x-cart-empty"><b>Tu carrito está vacío</b><span>Agrega productos para probar un pago conjunto.</span></div>';
    } else {
      wrap.innerHTML=labCart.map((item,index)=>'<article class="x-cart-item"><div><b>'+escapeHtml(item.game)+'</b><span>'+escapeHtml(item.package)+'</span></div><strong>'+escapeHtml(item.priceLabel)+'</strong><button type="button" data-x-remove-cart="'+index+'" aria-label="Quitar">×</button></article>').join("");
    }
    const total=labCart.reduce((sum,item)=>sum+(Number.isFinite(Number(item.price))?Number(item.price):0),0);
    const totalEl=$("#xCartTotal");
    if (totalEl) totalEl.textContent=money(total)+(labCart.some(item=>item.price==null)?" + cotización":"");
  }

  function setCartDrawer(open){
    const drawer=$("#xCartDrawer");
    const backdrop=$("#xCartBackdrop");
    const active=Boolean(open);
    if (active) cartReturnFocus=document.activeElement;
    if (drawer) drawer.inert=!active;
    drawer?.classList.toggle("open",active);
    backdrop?.classList.toggle("open",active);
    drawer?.setAttribute("aria-hidden",active?"false":"true");
    syncOverlayInert();
    if (active) { renderLabCart(); drawer?.querySelector('[data-x-cart-close]')?.focus({preventScroll:true}); }
    else if (cartReturnFocus) {cartReturnFocus.focus({preventScroll:true});cartReturnFocus=null;}
  }

  function toggleExperienceFavorite(){
    const game=activeExperience();
    if (!game) return;
    const key=favoriteKey(experienceCategoryId,game.name);
    const existing=favoriteOrder.indexOf(key);
    if (existing>=0) favoriteOrder.splice(existing,1);
    else favoriteOrder.push(key);
    saveLocalList(favoriteStorageKey,favoriteOrder);

    const currentName=game.name;
    experienceGames=sortExperienceGames(categorySnapshot(experienceCategoryId));
    activeExperienceGame=Math.max(0,experienceGames.findIndex(item=>item.name===currentName));
    renderExperienceWheel(true);
    toast(existing>=0?"Quitado de favoritos.":"Favorito guardado; aparecerá primero la próxima vez.");
  }

  function isTouchMobileViewport(){
    return Boolean(
      (navigator.maxTouchPoints || 0) > 0 &&
      window.matchMedia?.("(max-width: 980px)")?.matches
    );
  }

  function physicalPortrait(){
    return Boolean(window.matchMedia?.("(orientation: portrait)")?.matches);
  }

  function setOrientationGate(open){
    const gate=$("#xOrientationGate");
    if (!gate) return;
    gate.classList.toggle("open",Boolean(open));
    gate.setAttribute("aria-hidden",open?"false":"true");
  }

  function syncExperienceOrientation(){
    const overlay=$("#xExperience");
    if (!overlay?.classList.contains("open")) return;

    if (standalone) { overlay.classList.remove("force-landscape"); setOrientationGate(false); return; }
    const mobile=isTouchMobileViewport();
    if (!mobile) {
      experienceForceLandscape=false;
      overlay.classList.remove("force-landscape");
      setOrientationGate(false);
      return;
    }

    const portrait=physicalPortrait();
    if (portrait && experienceForceLandscape) {
      overlay.classList.add("force-landscape");
      setOrientationGate(false);
      return;
    }

    overlay.classList.remove("force-landscape");

    if (portrait) {
      setOrientationGate(true);
      if (document.documentElement.dataset.device==="mobile-landscape") setDevice("mobile");
    } else {
      setOrientationGate(false);
      if (document.documentElement.dataset.device==="mobile") setDevice("mobile-landscape");
    }
  }

  function tryLandscapeLock(){
    if (!isTouchMobileViewport()) return;
    const orientation=screen.orientation;
    if (!orientation || typeof orientation.lock!=="function") return;
    Promise.resolve(orientation.lock("landscape")).then(()=>{
      experienceOrientationManaged=true;
      setTimeout(syncExperienceOrientation,120);
    }).catch(()=>{});
  }

  function unlockExperienceOrientation(){
    if (!experienceOrientationManaged) return;
    try { screen.orientation?.unlock?.(); } catch (_) {}
    experienceOrientationManaged=false;
  }

  function forceLandscapeInsidePortrait(){
    const overlay=$("#xExperience");
    if (!overlay) return;
    experienceForceLandscape=true;
    overlay.classList.add("force-landscape");
    setOrientationGate(false);
  }

  function openExperience(categoryId){
    experienceReturnFocus=document.activeElement;
    experienceCategoryId=experienceCategoryMap[categoryId]?categoryId:"recargas-id";
    experienceGames=sortExperienceGames(categorySnapshot(experienceCategoryId));
    activeExperienceGame=0;
    selectedExperienceProduct=null;
    experienceFieldValues={};
    experienceForceLandscape=false;
    const overlay=$("#xExperience");
    overlay?.classList.remove("force-landscape");
    overlay?.classList.add("open");
    overlay?.setAttribute("aria-hidden","false");
    document.body.classList.add("experience-open");
    syncOverlayInert();
    overlay?.querySelector("[data-x-back]")?.focus({preventScroll:true});
    renderExperienceWheel(true);
    updateCartBadges();
    syncExperienceOrientation();
    if (!standalone) tryLandscapeLock();
    scheduleDeviceScale();
  }

  function closeExperience(goHome=false){
    setCartDrawer(false);
    const overlay=$("#xExperience");
    overlay?.classList.remove("open","force-landscape");
    overlay?.setAttribute("aria-hidden","true");
    setOrientationGate(false);
    experienceForceLandscape=false;
    unlockExperienceOrientation();
    document.body.classList.remove("experience-open");
    syncOverlayInert();
    experienceReturnFocus?.focus({preventScroll:true});
    experienceReturnFocus=null;
    if (goHome) setView("inicio");
    scheduleDeviceScale();
  }

  function moveExperienceGame(direction){
    if (!direction || !experienceGames.length) return;
    setExperienceGame(activeExperienceGame+(direction<0?-1:1));
  }

  function productCard(item){
    return '<article class="product-card" tabindex="0" role="button" data-open-product="' + item.id + '"><div class="product-thumb">' + item.icon + '</div><div class="product-meta"><span>' + item.category + '</span><b>' + item.name + '</b><div class="product-price"><strong>' + money(item.price) + '</strong><small>DEMO</small></div></div></article>';
  }

  function render(){
    renderCategoryArena();
    updateCartBadges();

    const featuredGrid = $("#featuredGrid");
    if (featuredGrid) featuredGrid.innerHTML = data.products.filter(p => p.featured).map(productCard).join("");

    const categories = ["Todos", ...new Set(data.products.map(p => p.category))];
    const filterRow = $("#filterRow");
    if (filterRow) filterRow.innerHTML = categories.map(c => '<button type="button" data-filter="' + c + '" class="' + (c === activeFilter ? "active" : "") + '">' + c + '</button>').join("");

    renderCatalog();

    const checkout = $("#checkoutItems");
    if (checkout) checkout.innerHTML = data.checkout.map(item => '<div class="checkout-item"><span class="checkout-icon">' + item.icon + '</span><div><b>' + item.name + '</b><small>' + item.detail + '</small></div><strong>' + money(item.price) + '</strong></div>').join("");
  }

  function renderCatalog(){
    const query = ($("#catalogSearch")?.value || "").trim().toLowerCase();
    const items = data.products.filter(item => {
      const matchesFilter = activeFilter === "Todos" || item.category === activeFilter;
      const matchesQuery = !query || (item.name + " " + item.category).toLowerCase().includes(query);
      return matchesFilter && matchesQuery;
    });
    const grid = $("#catalogGrid");
    if (grid) grid.innerHTML = items.length ? items.map(productCard).join("") : '<div class="lab-note"><b>Sin resultados</b><p>Prueba otra búsqueda. Estos datos son ficticios.</p></div>';
    scheduleDeviceScale();
  }

  function setView(view){
    if ($("#xExperience")?.classList.contains("open")) closeExperience(false);
    currentView = titleMap[view] ? view : "inicio";
    all(".store-view").forEach(el => el.classList.toggle("active", el.dataset.view === currentView));
    all("[data-nav-view]").forEach(el => el.classList.toggle("active", el.dataset.navView === currentView));
    all("#labMenu [data-lab-view]").forEach(el => el.classList.toggle("active", el.dataset.labView === currentView));
    const title = $("#previewTitle");
    if (title) title.textContent = titleMap[currentView];
    const stage = $(".store-app");
    if (stage) stage.scrollTop = 0;
    setInfoHub(false);
    history.replaceState(null, "", "#" + currentView);
    scheduleDeviceScale();
  }

  function setRole(role){
    const safeRole = roleMap[role] ? role : "visitor";
    document.documentElement.dataset.role = safeRole;
    const label = roleMap[safeRole];
    const banner = $("#roleBanner");
    if (banner) banner.textContent = "Vista simulada: " + label;
    const profile = $("#profileRole");
    if (profile) profile.textContent = label;
    const headerRole = $("#headerRoleName");
    if (headerRole) headerRole.textContent = "Hola, " + label;
    if (safeRole !== "admin" && currentView === "admin") setView("inicio");
    toast("Estado simulado: " + label + ". No se consultó ninguna cuenta real.");
  }

  document.addEventListener("submit", (event) => {
    event.preventDefault();
    toast("Formularios bloqueados en Design Lab.");
  }, true);

  document.addEventListener("click", (event) => {
    const pause = event.target.closest('.ticker-pause');
    if (pause) { const paused = pause.getAttribute('aria-pressed') !== 'true'; pause.setAttribute('aria-pressed', String(paused)); pause.setAttribute('aria-label', paused ? 'Reanudar bienvenida' : 'Pausar bienvenida'); pause.textContent = paused ? '▷' : 'Ⅱ'; $('.welcome-ticker').classList.toggle('paused',paused); return; }
    const infoToggle = event.target.closest("[data-info-toggle]");
    if (infoToggle) {
      setInfoHub(infoToggle.getAttribute("aria-expanded") !== "true");
      return;
    }

    if (event.target.closest("[data-info-close]")) {
      setInfoHub(false);
      return;
    }

    const infoPanel = event.target.closest("[data-info-panel]");
    if (infoPanel) {
      setInfoPanel(infoPanel.dataset.infoPanel);
      return;
    }

    const infoAction = event.target.closest("[data-info-action]");
    if (infoAction) {
      if (infoAction.dataset.infoAction === 'WhatsApp') window.open('https://wa.me/59177057379','_blank','noopener,noreferrer');
      else { setInfoHub(true); setInfoPanel('support'); }
      return;
    }

    const arenaArrow = event.target.closest("[data-arena-direction]");
    if (arenaArrow) { moveCategory(Number(arenaArrow.dataset.arenaDirection || 0)); return; }

    const arenaDot = event.target.closest("[data-arena-dot]");
    if (arenaDot) { setCategoryActive(Number(arenaDot.dataset.arenaDot), true); return; }

    const categoryEnter = event.target.closest("[data-category-enter]");
    if (categoryEnter) {
      const index=wrapCategoryIndex(Number(categoryEnter.dataset.categoryEnter));
      const selected=data.categories[index];
      if (selected) {
        setCategoryActive(index,true);
        openExperience(selected.id);
      }
      return;
    }

    const category = event.target.closest("[data-category-index]");
    if (category) {
      const index = wrapCategoryIndex(Number(category.dataset.categoryIndex));
      if (index !== activeCategoryIndex) setCategoryActive(index, true);
      return;
    }

    const gameStep=event.target.closest("[data-x-game-step]");
    if (gameStep) { moveExperienceGame(Number(gameStep.dataset.xGameStep || 0)); return; }

    const gameCard=event.target.closest("[data-x-game-index]");
    if (gameCard) { setExperienceGame(Number(gameCard.dataset.xGameIndex)); return; }

    if (event.target.closest("[data-x-force-landscape]")) { forceLandscapeInsidePortrait(); return; }
    if (event.target.closest("[data-x-back]")) { closeExperience(false); return; }
    if (event.target.closest("[data-x-favorite]")) { toggleExperienceFavorite(); return; }
    if (event.target.closest("[data-x-cart]")) { setCartDrawer(true); return; }
    if (event.target.closest("[data-x-cart-close]")) { setCartDrawer(false); return; }

    const selectPackage=event.target.closest("[data-x-select-package]");
    if (selectPackage) { selectExperiencePackage(Number(selectPackage.dataset.xSelectPackage)); return; }

    const addPackage=event.target.closest("[data-x-add-package]");
    if (addPackage) {
      selectExperiencePackage(Number(addPackage.dataset.xAddPackage));
      addCurrentToCart();
      return;
    }

    const removeCart=event.target.closest("[data-x-remove-cart]");
    if (removeCart) {
      labCart.splice(Number(removeCart.dataset.xRemoveCart),1);
      saveLocalList(cartStorageKey,labCart);
      updateCartBadges();
      renderLabCart();
      return;
    }

    if (event.target.closest("[data-x-checkout]")) {
      toast(labCart.length?"Pago conjunto listo como demostración; todavía no se envía nada.":"Añade productos antes de continuar.");
      return;
    }

    if (event.target.closest("#xBuyButton")) {
      if (addCurrentToCart()) setCartDrawer(true);
      return;
    }

    const searchButton = event.target.closest("[data-open-search]");
    if (searchButton) {
      setView("catalogo");
      requestAnimationFrame(() => $("#catalogSearch")?.focus({preventScroll:false}));
      return;
    }

    const accountAction = event.target.closest("[data-account-action]");
    if (accountAction) {
      const label = accountAction.dataset.accountAction || "Esta sección";
      toast(label + " está disponible como interacción de diseño en el Lab.");
      return;
    }

    const nav = event.target.closest("[data-nav-view]");
    if (nav) {
      setView(nav.dataset.navView);
      return;
    }

    const labNav = event.target.closest("[data-lab-view]");
    if (labNav) {
      setView(labNav.dataset.labView);
      return;
    }

    const filter = event.target.closest("[data-filter]");
    if (filter) {
      activeFilter = filter.dataset.filter;
      render();
      return;
    }

    const product = event.target.closest("[data-open-product]");
    if (product) {
      setView("producto");
      return;
    }

    const demo = event.target.closest("[data-demo-action]");
    if (demo) {
      toast("🧪 Acción simulada. No se enviaron datos ni se realizó ningún pago.");
    }
  });

  $("#catalogSearch")?.addEventListener("input", renderCatalog);

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    const product = event.target.closest?.("[data-open-product]");
    if (!product) return;
    event.preventDefault();
    setView("producto");
  });

  const categoryViewport = $("#categoryArenaViewport");
  categoryViewport?.addEventListener("pointerdown", (event) => {
    categoryGestureStartX = event.clientX;
    categoryGestureStartY = event.clientY;
  }, {passive:true});

  categoryViewport?.addEventListener("pointerup", (event) => {
    if (categoryGestureStartX == null || categoryGestureStartY == null) return;
    const dx = event.clientX - categoryGestureStartX;
    const dy = event.clientY - categoryGestureStartY;
    categoryGestureStartX = null;
    categoryGestureStartY = null;
    if (Math.abs(dx) < 42 || Math.abs(dx) <= Math.abs(dy) * 1.15) return;
    moveCategory(dx < 0 ? 1 : -1);
  }, {passive:true});

  categoryViewport?.addEventListener("pointercancel", () => {
    categoryGestureStartX = null;
    categoryGestureStartY = null;
  }, {passive:true});

  $("#xInputFields")?.addEventListener("input",(event)=>{
    const field=event.target.closest("[data-x-field]");
    if (!field) return;
    experienceFieldValues[field.dataset.xField]=field.value;
    field.classList.remove("needs-value");
    updateExperienceBuyState();
  });
  $("#xInputFields")?.addEventListener("change",(event)=>{
    const field=event.target.closest("[data-x-field]");
    if (!field) return;
    experienceFieldValues[field.dataset.xField]=field.value;
    field.classList.remove("needs-value");
    updateExperienceBuyState();
  });

  const xWheel=$("#xGameWheel");
  xWheel?.addEventListener("pointerdown",(event)=>{
    experienceGestureStartY=event.clientY;
    experienceGestureStartX=event.clientX;
  },{passive:true});
  xWheel?.addEventListener("pointerup",(event)=>{
    if (experienceGestureStartY==null || experienceGestureStartX==null) return;
    const dy=event.clientY-experienceGestureStartY;
    const dx=event.clientX-experienceGestureStartX;
    experienceGestureStartY=null;
    experienceGestureStartX=null;
    if (standalone && window.innerWidth<=600) { if(Math.abs(dx)>=34 && Math.abs(dx)>Math.abs(dy)*1.05) moveExperienceGame(dx<0?1:-1); return; }
    if (Math.abs(dy)<34 || Math.abs(dy)<=Math.abs(dx)*1.05) return;
    moveExperienceGame(dy<0?1:-1);
  },{passive:true});
  xWheel?.addEventListener("pointercancel",()=>{
    experienceGestureStartY=null;
    experienceGestureStartX=null;
  },{passive:true});

  document.addEventListener("error",(event)=>{
    const image=event.target;
    if (!(image instanceof HTMLImageElement)) return;
    if (image.matches(".x-game-thumb,.x-showcase-img")) image.classList.add("failed");
  },true);
  document.addEventListener("load",(event)=>{
    const image=event.target;
    if (!(image instanceof HTMLImageElement)) return;
    if (image.matches(".x-game-thumb,.x-showcase-img")) image.classList.add("loaded");
  },true);

  const devicePresets = {
    mobile: { width: 390, height: 844, label: "Celular" },
    "mobile-landscape": { width: 844, height: 390, label: "Celular horizontal" },
    tablet: { width: 820, height: 1180, label: "Tablet" },
    laptop: { width: 1180, height: 768, label: "Laptop" },
    desktop: { width: 1440, height: 900, label: "PC" }
  };

  let scaleFrame = 0;
  let lastScaleKey = "";
  function updateDeviceScale(){
    const root = document.documentElement;
    const viewport = $("#deviceViewport");
    const frame = $("#deviceFrame");
    if (!viewport || !frame) return;
    if (standalone) { root.style.setProperty("--device-height", window.innerHeight + "px"); return; }
    const preset = devicePresets[root.dataset.device] || devicePresets.desktop;
    const available = Math.max(1, viewport.clientWidth);
    const scale = Math.min(1, available / preset.width);
    const frameHeight = frame.scrollHeight;
    const targetHeight = Math.ceil(frameHeight * scale);
    const key = preset.width+"|"+preset.height+"|"+available+"|"+frameHeight+"|"+scale.toFixed(4);
    if (key===lastScaleKey) return;
    lastScaleKey=key;
    root.style.setProperty("--device-width", preset.width + "px");
    root.style.setProperty("--device-height", preset.height + "px");
    root.style.setProperty("--device-scale", scale.toFixed(4));
    if (viewport.style.height !== targetHeight + "px") viewport.style.height = targetHeight + "px";
  }

  function scheduleDeviceScale(){
    if (scaleFrame) return;
    scaleFrame=requestAnimationFrame(()=>{
      scaleFrame=0;
      updateDeviceScale();
    });
  }

  function setDevice(device){
    const safeDevice = devicePresets[device] ? device : "desktop";
    document.documentElement.dataset.device = safeDevice;
    document.querySelectorAll("#devicePreviewButtons [data-device-preview]").forEach(el => {
      el.classList.toggle("active", el.dataset.devicePreview === safeDevice);
    });
    lastScaleKey="";
    scheduleDeviceScale();
    requestAnimationFrame(() => setCategoryActive(activeCategoryIndex, false, true));
  }

  $("#devicePreviewButtons")?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-device-preview]");
    if (!button) return;
    setDevice(button.dataset.devicePreview);
  });

  let resizeTimer = 0;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      lastScaleKey="";
      scheduleDeviceScale();
      if (document.body.classList.contains("experience-open")) syncExperienceOrientation();
    }, 100);
  }, {passive:true});

  $("#roleSelect")?.addEventListener("change", (event) => setRole(event.target.value));

  $("#motionToggle")?.addEventListener("click", (event) => {
    const disabled = document.documentElement.classList.toggle("motion-off");
    event.currentTarget.textContent = "Animaciones: " + (disabled ? "OFF" : "ON");
  });


  let loadingHideTimer = 0;
  let loadingProgressInterval = 0;

  function stopLoadingTimers(){
    clearTimeout(loadingHideTimer);
    clearInterval(loadingProgressInterval);
    loadingHideTimer = 0;
    loadingProgressInterval = 0;
  }

  function finishLoadingDemo(overlay, button, reduced){
    overlay.classList.add("loading-complete");
    loadingHideTimer = setTimeout(() => {
      overlay.classList.add("leaving");
      loadingHideTimer = setTimeout(() => {
        overlay.classList.remove("active","leaving","run-phase","loading-complete");
        overlay.setAttribute("aria-hidden","true");
        if (button) button.textContent = "▶ Probar carga";
      }, reduced ? 40 : 360);
    }, reduced ? 150 : 360);
  }

  function runLoadingDemo(){
    const overlay = $("#loadingDemo");
    const fill = $("#loadingProgressBar");
    const percent = $("#loadingPercent");
    const message = $("#loadingMessage");
    const button = $("#loadingDemoButton");
    if (!overlay || !fill || !percent || !message) return;

    stopLoadingTimers();
    overlay.classList.remove("leaving","loading-complete");
    overlay.classList.add("active","run-phase");
    overlay.setAttribute("aria-hidden","false");

    let progress = 0;
    fill.style.transform = "scaleX(0)";
    percent.textContent = "0%";
    message.textContent = "Preparando French Store...";
    if (button) button.textContent = "↻ Reiniciar carga";

    const reduced = document.documentElement.classList.contains("motion-off") ||
      window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;

    loadingProgressInterval = setInterval(() => {
      progress += reduced ? 12 : (1.8 + Math.random() * 2.4);

      if (progress >= 100) {
        progress = 100;
        clearInterval(loadingProgressInterval);
        loadingProgressInterval = 0;
        fill.style.transform = "scaleX(1)";
        percent.textContent = "100%";
        message.textContent = "¡Todo listo! Entrando a French Store...";
        finishLoadingDemo(overlay, button, reduced);
        return;
      }

      const visible = Math.floor(progress);
      fill.style.transform = "scaleX(" + (progress / 100) + ")";
      percent.textContent = visible + "%";

      message.textContent = visible < 70 ? "Preparando French Store..." : "Últimos detalles...";
    }, 65);
  }

  $("#loadingDemoButton")?.addEventListener("click", runLoadingDemo);
  $("#settingsMotionShortcut")?.addEventListener("click", () => $("#motionToggle")?.click());

  document.addEventListener("visibilitychange", () => {
    document.documentElement.classList.toggle("page-hidden", document.hidden);
  }, {passive:true});

  const initialDevice = window.matchMedia?.("(max-width: 700px)")?.matches ? "mobile" : (document.documentElement.dataset.device || "desktop");
  setDevice(standalone ? (window.innerWidth <= 600 ? "mobile" : window.innerWidth <= 1000 ? "tablet" : "desktop") : initialDevice);
  window.addEventListener("orientationchange", () => {
    if (!document.body.classList.contains("experience-open")) return;
    setTimeout(syncExperienceOrientation,120);
  }, {passive:true});

  // The Lab recalculates scale only after real UI/device changes.
  // Avoid observing the whole frame continuously: on mobile it can cause
  // repeated layout reads while cards, drawers and orientation states change.
  render();
  const initial = location.hash.replace("#", "");
  setView(titleMap[initial] ? initial : "inicio");
  // The intro stays available in the lab; it must not delay the review or navigation.
  if (new URLSearchParams(location.search).has('intro')) runLoadingDemo();
  document.addEventListener('keydown', event => {
    const cartOpen=$('#xCartDrawer')?.classList.contains('open');
    const infoOpen=$('#infoHub')?.classList.contains('open');
    if(cartOpen && event.key==='Escape'){event.preventDefault();setCartDrawer(false);return;}
    if(!cartOpen && !infoOpen && $('#xExperience')?.classList.contains('open') && event.key==='Escape'){event.preventDefault();closeExperience(false);return;}
    if(!cartOpen && !infoOpen) return;
    if (event.key === 'Escape') { event.preventDefault(); setInfoHub(false); return; }
    if (event.key !== 'Tab') return;
    const focusable=all('button,a[href]', $(cartOpen ? '#xCartDrawer' : '#infoHub')).filter(el=>el.getClientRects().length && !el.disabled);
    const first=focusable[0], last=focusable.at(-1);
    if(event.shiftKey && document.activeElement===first) {event.preventDefault();last?.focus();}
    else if(!event.shiftKey && document.activeElement===last) {event.preventDefault();first?.focus();}
  });
})();
