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
  const roleMap = { visitor: "Visitante", user: "Usuario Base", gold: "Usuario Gold", diamond: "Usuario Diamond", reseller: "Reseller", admin: "Admin" };
  // Real membership tier derived from the (simulated) account; visitors and staff roles have none.
  const planForRole = { user: "base", gold: "gold", diamond: "diamond" };
  const standalone = !new URLSearchParams(location.search).has('panel'); // Lab default = full-screen store; ?panel opens the device-test panel
  document.documentElement.classList.toggle('standalone', standalone);
  // The staged entrance is decided once by intro-gate.js (idle -> playing -> complete, persisted per session).
  // Navigation inside the app never touches it; this only finishes the running timeline.
  const introRoot = document.documentElement;
  if (introRoot.dataset.intro === "playing") {
    // Real, one-time entrance: the splash/loader (below) plays first, opaque,
    // while the staged reveal keyframes (header/lamps/blocks/dock/WhatsApp)
    // run underneath already gated by html.fs-intro. When the loader clears,
    // whatever remains of that reveal keeps playing into view. intro-gate.js
    // guarantees this whole branch never runs twice in a session.
    setTimeout(() => { introRoot.classList.remove("fs-intro"); introRoot.dataset.intro = "complete"; }, 4700);
    // app.js is loaded at the end of <body>, so the DOM (including #loadingDemo)
    // is already parsed here. Deferred with setTimeout(0) only so this runs
    // after runLoadingDemo's own state (declared later in this file) is
    // initialized — not to wait for anything else; still fires immediately.
    setTimeout(() => runLoadingDemo({ auto: true }), 0);
  }

  // Optional intro sound: synthesized (no asset), off by default, only after the user has interacted with the page.
  const SOUND_KEY = "fs-lab-intro-sound";
  let soundOn = false;
  try { soundOn = localStorage.getItem(SOUND_KEY) === "1"; } catch (_) {}
  function playPowerUp() {
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      const ctx = new AC();
      if (ctx.state === "suspended") ctx.resume().catch(() => {});
      const t = ctx.currentTime;
      const master = ctx.createGain();
      master.gain.setValueAtTime(0.0001, t);
      master.gain.exponentialRampToValueAtTime(0.14, t + 0.3);
      master.gain.exponentialRampToValueAtTime(0.0001, t + 1.7);
      master.connect(ctx.destination);
      const low = ctx.createOscillator(); low.type = "sawtooth";
      low.frequency.setValueAtTime(46, t); low.frequency.exponentialRampToValueAtTime(140, t + 1.1);
      const lp = ctx.createBiquadFilter(); lp.type = "lowpass";
      lp.frequency.setValueAtTime(180, t); lp.frequency.exponentialRampToValueAtTime(1400, t + 1.0);
      low.connect(lp); lp.connect(master);
      const hi = ctx.createOscillator(); hi.type = "sine";
      hi.frequency.setValueAtTime(92, t); hi.frequency.exponentialRampToValueAtTime(420, t + 1.2);
      const hiGain = ctx.createGain(); hiGain.gain.value = 0.3;
      hi.connect(hiGain); hiGain.connect(master);
      low.start(t); hi.start(t); low.stop(t + 1.8); hi.stop(t + 1.8);
      setTimeout(() => ctx.close().catch(() => {}), 2300);
    } catch (_) { /* audio unavailable: stay silent */ }
  }
  if (soundOn && introRoot.dataset.intro === "playing" && navigator.userActivation && navigator.userActivation.hasBeenActive) playPowerUp();
  function syncSoundToggle() {
    const btn = document.getElementById("settingsSoundToggle");
    if (!btn) return;
    btn.setAttribute("aria-pressed", String(soundOn));
    const small = btn.querySelector("small");
    if (small) small.textContent = soundOn ? "Activado \u00b7 suena al abrir la tienda" : "Desactivado";
  }
  document.addEventListener("click", (event) => {
    if (!event.target.closest("#settingsSoundToggle")) return;
    soundOn = !soundOn;
    try { localStorage.setItem(SOUND_KEY, soundOn ? "1" : "0"); } catch (_) {}
    syncSoundToggle();
    if (soundOn) playPowerUp();
  });
  syncSoundToggle();
  let infoReturnFocus = null;
  let cartReturnFocus = null;
  let experienceReturnFocus = null;
  let currentView = "inicio";
  let viewReturnFocus = null;
  let activeFilter = "Todos";
  let toastTimer;
  let activeCategoryIndex = 0;
  let categoryGestureStartX = null;
  let categoryGestureStartY = null;
  let categoryGestureLastX = null;
  let categoryGestureLastY = null;
  let categoryGesturePointerId = null;
  let categoryGestureDidDrag = false;
  let categoryGestureOffset = 0;
  let categoryGestureFrame = 0;
  let categoryIgnoreClickUntil = 0;
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
  const compactLandscapeLite = Boolean(
    window.matchMedia?.("(orientation: landscape) and (max-height: 560px)")?.matches ||
    window.matchMedia?.("(pointer: coarse) and (orientation: landscape)")?.matches
  );
  // Quality tier, decided ONCE per session (cached) so it can never oscillate:
  //   high   -> every effect
  //   medium -> same look, cheaper compositing (no live backdrop blur): class perf-lite
  //   low    -> medium + static lamp light, no fog: classes perf-lite perf-low
  // Missing APIs (deviceMemory / hardwareConcurrency / connection) never demote a device by themselves.
  const qualityKey = "fs-lab-quality-v1";
  let quality = "";
  try { quality = sessionStorage.getItem(qualityKey) || ""; } catch (_) {}
  if (!["high", "medium", "low"].includes(quality)) {
    const q = new URLSearchParams(location.search).get("performance");
    const mem = navigator.deviceMemory, cores = navigator.hardwareConcurrency;
    const coarse = Boolean(window.matchMedia?.("(pointer: coarse)")?.matches);
    if (q === "lite" || q === "low" || navigator.connection?.saveData || (mem && mem <= 2) || (cores && cores <= 2)) quality = "low";
    else if (q === "high") quality = "high";
    else if (q === "medium" || coarse || compactLandscapeLite || (mem && mem <= 4) || (cores && cores <= 4)) quality = "medium";
    else quality = "high";
    try { sessionStorage.setItem(qualityKey, quality); } catch (_) {}
  }
  document.documentElement.dataset.quality = quality;
  document.documentElement.classList.toggle("perf-lite", quality !== "high");
  document.documentElement.classList.toggle("perf-low", quality === "low");

  const favoriteStorageKey = "fs-design-lab-favorite-games-v1";
  const cartStorageKey = "fs-design-lab-cart-v1";
  let experienceCategoryId = "recargas-id";
  let experienceGames = [];
  let activeExperienceGame = 0;
  let wheelSettleTimer = 0;
  let wheelDelta = 0;
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

  // Gold glyphs used by the card footer (fill = shared gradient defined once in index.html).
  const CAT_GLYPHS = {
    "bolt": '<path d="M13.5 2 4.5 13.5H10l-1.2 8.5 9.2-12h-5.6z"/>',
    "star": '<path d="m12 2.6 2.9 6 6.5.9-4.7 4.6 1.1 6.5L12 17.5l-5.8 3.1 1.1-6.5L2.6 9.5l6.5-.9z"/>',
    "lock": '<rect x="5" y="10.5" width="14" height="10.5" rx="2.5"/><path d="M8.2 10.5V7.6a3.8 3.8 0 0 1 7.6 0v2.9" fill="none" stroke="url(#fsGold)" stroke-width="2.2" stroke-linecap="round"/>',
    "shield": '<path d="M12 2.4 4.6 5.4v5.9c0 4.4 3 8.2 7.4 9.9 4.4-1.7 7.4-5.5 7.4-9.9V5.4z"/><path d="m8.6 12 2.4 2.4 4.4-4.8" fill="none" stroke="#0b1a2c" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
    "palette": '<path d="M12 2.5a9.5 9.5 0 1 0 0 19c1.7 0 2.4-1.2 1.8-2.4-.6-1.4.4-2.7 1.9-2.7H18a3.5 3.5 0 0 0 3.5-3.6C21.4 7.4 17.2 2.5 12 2.5z"/><circle cx="7.6" cy="11" r="1.4" fill="#0b1a2c"/><circle cx="10.8" cy="7" r="1.4" fill="#0b1a2c"/><circle cx="15.6" cy="7.6" r="1.4" fill="#0b1a2c"/>',
    "gamepad": '<path d="M7 7h10a5 5 0 0 1 4.8 6.3l-1 3.4a2.4 2.4 0 0 1-4 1L15 15.5H9l-1.8 2.2a2.4 2.4 0 0 1-4-1l-1-3.4A5 5 0 0 1 7 7z"/><path d="M8 10v3M6.5 11.5h3" stroke="#0b1a2c" stroke-width="1.6" stroke-linecap="round"/><circle cx="16" cy="10.6" r="1" fill="#0b1a2c"/><circle cx="18" cy="12.4" r="1" fill="#0b1a2c"/>',
    "user-lock": '<circle cx="10" cy="7.4" r="4.1"/><path d="M2.4 20.6c0-4 3.3-6.6 7.6-6.6 1.2 0 2.3.2 3.3.6L13 20.6z"/><circle cx="18" cy="17.6" r="4.6"/><rect x="15.7" y="17" width="4.6" height="3.4" rx=".9" fill="#0b1a2c"/><path d="M16.6 17v-.9a1.4 1.4 0 0 1 2.8 0v.9" fill="none" stroke="#0b1a2c" stroke-width="1.1"/>',
    "user-shield": '<circle cx="9.6" cy="7.4" r="4.1"/><path d="M2.2 20.6c0-4 3.3-6.6 7.4-6.6 1.2 0 2.3.2 3.3.6L12.6 20.6z"/><path d="M17.6 12.4l-4.2 1.7v3.3c0 2.5 1.7 4.6 4.2 5.5 2.5-.9 4.2-3 4.2-5.5v-3.3z"/><path d="m15.6 17.6 1.6 1.6 2.8-3" fill="none" stroke="#0b1a2c" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>',
    "stream": '<rect x="2.6" y="4" width="18.8" height="13" rx="2.2" fill="none" stroke="url(#fsGold)" stroke-width="2"/><path d="m10 7.4 5 2.8-5 2.8z"/><path d="M8 20.8h8" fill="none" stroke="url(#fsGold)" stroke-width="2" stroke-linecap="round"/>',
    "window": '<rect x="3" y="4" width="18" height="16" rx="2.2" fill="none" stroke="url(#fsGold)" stroke-width="2"/><path d="M3 9h18" fill="none" stroke="url(#fsGold)" stroke-width="2"/><rect x="6" y="11.5" width="5.2" height="5" rx=".8"/><path d="M13.5 12.4h4.5M13.5 15.2h4.5" fill="none" stroke="url(#fsGold)" stroke-width="1.6" stroke-linecap="round"/>',
    "joystick": '<circle cx="12" cy="5.8" r="3.4"/><path d="M10.9 9h2.2v5.4h-2.2z"/><path d="M3.6 21v-3.4a2.6 2.6 0 0 1 2.6-2.6h11.6a2.6 2.6 0 0 1 2.6 2.6V21z"/><circle cx="8" cy="18" r="1.1" fill="#0b1a2c"/><circle cx="12" cy="18" r="1.1" fill="#0b1a2c"/>',
    "gift": '<rect x="3.2" y="9.4" width="17.6" height="11.6" rx="2"/><rect x="2.2" y="6" width="19.6" height="4.2" rx="1.2"/><path d="M12 6v15" stroke="#0b1a2c" stroke-width="1.6"/><path d="M12 6C10 2.6 6.6 3 7.2 5.2 7.6 6.4 10 6 12 6zm0 0c2-3.4 5.4-3 4.8-.8C16.4 6.4 14 6 12 6z" fill="none" stroke="url(#fsGold)" stroke-width="1.6"/>'
  };
  function catGlyph(key, cls){
    return '<svg class="' + cls + '" viewBox="0 0 24 24" fill="url(#fsGold)" aria-hidden="true" focusable="false">' + (CAT_GLYPHS[key] || CAT_GLYPHS.star) + '</svg>';
  }

  // Single reusable card. Every category (and its footer panel) is described by data.categories.
  function categoryCard(item, index){
    const accent = /^\d{1,3},\d{1,3},\d{1,3}$/.test(String(item.accentRgb || "").replace(/\s/g, "")) ? item.accentRgb : "98,231,255";
    const tags = (item.tags || []).map(tag => '<span class="cat-tag">' + catGlyph(tag.i, 'cat-tag-glyph') + '<span>' + escapeHtml(tag.t) + '</span></span>').join("");
    const cta = escapeHtml(item.cta || "Ingresar");
    const art = './assets/categories/' + item.id;
    return '<article class="category-card category-arena-card" data-category-index="' + index + '" data-category="' + item.id + '" style="--accent-rgb:' + accent + '" aria-label="' + escapeHtml(item.name) + '" role="group">'+
      '<div class="category-glass"><span class="hud-module-edge" aria-hidden="true"></span>'+
      '<span class="cat-electric" aria-hidden="true"><i class="cat-electric-ring cat-electric-ring-1"></i><i class="cat-electric-ring cat-electric-ring-2"></i></span>'+
      '<span class="category-card-grid" aria-hidden="true"></span>'+
      '<span class="category-card-top"><span class="hud-module-label">' + escapeHtml(item.eyebrow || "FRENCH STORE") + '</span><span class="category-tag">' + escapeHtml(item.tag || "FRENCH") + '</span></span>'+
      '<span class="category-art" aria-hidden="true"><img src="' + art + '-1100.webp" srcset="' + art + '-640.webp 640w, ' + art + '-1100.webp 1100w, ' + art + '-1672.webp 1672w" sizes="(max-width:999px) 320px, 55vw" width="1672" height="941" alt="" decoding="async" loading="' + (index === 0 ? 'eager' : 'lazy') + '"' + (index === 0 ? ' fetchpriority="high"' : '') + '></span>'+
      '<div class="category-console">'+
        '<svg class="cat-wave" viewBox="0 0 1000 40" preserveAspectRatio="none" aria-hidden="true" focusable="false"><path class="cat-wave-fill" d="M0 40V8C250 10 350 34 500 34S750 10 1000 8V40Z"/><path class="cat-wave-glow" d="M0 8C250 10 350 34 500 34S750 10 1000 8"/><path class="cat-wave-line" d="M0 8C250 10 350 34 500 34S750 10 1000 8"/></svg>'+
        '<span class="cat-deco" aria-hidden="true"></span>'+
        '<span class="cat-mark" aria-hidden="true">' + catGlyph(item.mark, 'cat-mark-glyph') + '</span>'+
        '<span class="category-copy"><b>' + escapeHtml(item.name) + '</b><small>' + escapeHtml(item.subtitle) + '</small></span>'+
        '<span class="cat-tags">' + tags + '</span>'+
        '<button class="category-enter" type="button" data-category-enter="' + index + '" aria-label="' + cta + ' · ' + escapeHtml(item.name) + '"><span class="cta-sheen" aria-hidden="true"></span><span>' + cta + '</span><i aria-hidden="true">→</i></button>'+
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
    // One scene change per selection; fog and floor inherit the same color.
    // Legacy fog/floor tint only exists outside the standalone theme; writing it invalidates styles for the whole app (~75ms per step).
    if (!standalone) $(".store-app").dataset.scene = data.categories[next].id;

    cards.forEach((card, cardIndex) => {
      const diff = circularDifference(cardIndex, next);
      const distance = Math.abs(diff);
      card.dataset.rouletteSlot = String(diff);
      card.dataset.distance = String(distance);
      card.dataset.side = diff < 0 ? "left" : diff > 0 ? "right" : "center";
      card.classList.toggle("active", diff === 0);
      card.classList.toggle("roulette-hidden", distance > 1);
      card.setAttribute("aria-current", diff === 0 ? "true" : "false");
      card.setAttribute("aria-hidden", distance > 1 ? "true" : "false");
      card.tabIndex = -1;
      card.inert = distance > 1;
      card.querySelector('button').tabIndex = distance <= 1 ? 0 : -1;
      if (instant) card.classList.add("roulette-instant");
      else card.classList.remove("roulette-instant");
    });

    if (instant) requestAnimationFrame(() => cards.forEach(card => card.classList.remove("roulette-instant")));

  }

  // Strict one-step state machine: idle -> moving -> idle. Any input that arrives while a card is travelling is dropped (never queued).
  let categoryMoving = false;
  let categoryMoveTimer = 0;
  function releaseCategoryMove(){
    clearTimeout(categoryMoveTimer);
    categoryMoveTimer = 0;
    categoryMoving = false;
  }
  function moveCategory(direction){
    if (!direction || categoryMoving) return false;
    categoryMoving = true;
    const active = document.querySelector(".category-arena-card.active");
    const done = event => { if (!event || (event.target === active && event.propertyName === "transform")) { active?.removeEventListener("transitionend", done); releaseCategoryMove(); } };
    active?.addEventListener("transitionend", done);
    // Fallback so a missed transitionend (reduced motion, hidden tab) can never leave the carousel locked.
    categoryMoveTimer = setTimeout(() => { active?.removeEventListener("transitionend", done); releaseCategoryMove(); }, 620);
    setCategoryActive(activeCategoryIndex + (direction < 0 ? -1 : 1));
    return true;
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

  function setExperienceGame(index, instant=false, deferDetail=false){
    clearTimeout(wheelSettleTimer);
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
    if (deferDetail) {
      setWheelPending(true);
      wheelSettleTimer=setTimeout(()=>{
        wheelSettleTimer=0;wheelDelta=0;
        if (!$("#xExperience")?.classList.contains("open")) return;
        setWheelPending(false);
        renderExperienceDetail();
      },220);
    } else {
      wheelDelta=0;setWheelPending(false);renderExperienceDetail();
    }
  }

  function setWheelPending(pending){
    const stage=$(".x-product-stage");
    stage?.classList.toggle("wheel-settling",pending);
    stage?.setAttribute("aria-busy",String(pending));
    if(stage) stage.inert=pending;
    const favorite=$("[data-x-favorite]");
    if(favorite) favorite.disabled=pending;
    if(pending){$("#xBuyButton").disabled=true;$("#xGameBreadcrumb").textContent="Eligiendo juego…";}
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
    $(".x-stage-gamehead")?.style.setProperty("--hero-img","url(\"./assets/categories/"+encodeURIComponent(experienceCategoryId)+"-1100.webp\")");
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
            '<span class="x-package-thumb" aria-hidden="true">'+(game.icon?'<img src="'+escapeHtml(game.icon)+'" alt="" loading="lazy" decoding="async">':'<i>'+escapeHtml(initials(game.name))+'</i>')+'</span>'+
            '<span class="x-package-name">'+escapeHtml(product.package)+'</span>'+
            '<strong class="x-package-price">'+escapeHtml(priceLabel(product))+'</strong>'+
            '<i class="x-package-go" aria-hidden="true">›</i>'+
          '</button>'+
          '</article>';
      }).join("");
      list.scrollTop=0;
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
    const game=activeExperience();
    const dock=$(".x-buy-dock");
    if (dock) dock.classList.toggle("has-selection",Boolean(selectedExperienceProduct));
    const add=$("[data-x-add-selected]");
    if (add) add.disabled=!selectedExperienceProduct;
    const set=(id,text)=>{const el=$(id);if(el)el.textContent=text;};
    set("#xDockName",selectedExperienceProduct?selectedExperienceProduct.package:"Selecciona un producto");
    set("#xDockGame",game?.name||"French Store");
    set("#xDockPrice",selectedExperienceProduct?priceLabel(selectedExperienceProduct):"—");
    set("#xDockFallback",initials(game?.name||"FS"));
    const img=$("#xDockImg");
    if (img) { if (game?.icon) { if (img.getAttribute("src")!==game.icon) img.src=game.icon; img.hidden=false; } else { img.removeAttribute("src"); img.hidden=true; } }
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
    all("#cartCount,#xCartCount").forEach(badge => {
      badge.classList.remove("cart-badge-pop");
      // eslint-disable-next-line no-unused-expressions
      badge.offsetWidth; // restart the animation even if it's already mid-run
      badge.classList.add("cart-badge-pop");
    });
  }

  // Compress -> check -> settle, ~450ms total. Does not open the cart so the
  // user can keep browsing; the button reverts to its normal icon afterward
  // (persistent "already in cart" state is out of scope for this pass).
  function playAddToCartFeedback(button){
    if (!button) return;
    const reduced = document.documentElement.classList.contains("motion-off") ||
      window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    button.classList.add("cta-busy");
    if (!reduced) button.classList.add("cta-added");
    setTimeout(() => button.classList.remove("cta-added", "cta-busy"), reduced ? 160 : 480);
  }

  function renderLabCart(){
    const wrap=$("#xCartItems");
    if (!wrap) return;
    if (!labCart.length) {
      wrap.innerHTML='<div class="x-cart-empty"><svg class="x-cart-art" viewBox="0 0 160 120" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><ellipse cx="80" cy="102" rx="58" ry="9" opacity=".35"/><path d="M22 22h14l12 52h64l12-40H40"/><path d="M50 46h68" opacity=".5"/><circle cx="58" cy="90" r="6"/><circle cx="106" cy="90" r="6"/></svg><b>Tu carrito está vacío</b><span>Agrega productos para probar un pago conjunto.</span></div>';
    } else {
      wrap.innerHTML=labCart.map((item,index)=>'<article class="x-cart-item"><div><b>'+escapeHtml(item.game)+'</b><span>'+escapeHtml(item.package)+'</span></div><strong>'+escapeHtml(item.priceLabel)+'</strong><button type="button" data-x-remove-cart="'+index+'" aria-label="Quitar">×</button></article>').join("");
    }
    const total=labCart.reduce((sum,item)=>sum+(Number.isFinite(Number(item.price))?Number(item.price):0),0);
    const totalEl=$("#xCartTotal");
    if (totalEl) totalEl.textContent=money(total)+(labCart.some(item=>item.price==null)?" + cotización":"");
  }

  function cartTotal(){
    return labCart.reduce((sum,item)=>sum+(Number.isFinite(Number(item.price))?Number(item.price):0),0);
  }

  // ---------- French Wallet identity card ----------
  // Identity only: initials, a chosen display name, the simulated membership
  // level and a short local code — never a bank card number, CVV or expiry.
  const WALLET_NAME_KEY = "fs-lab-wallet-name";
  const WALLET_CODE_KEY = "fs-lab-wallet-code";
  function walletCode(){
    let code = null;
    try { code = localStorage.getItem(WALLET_CODE_KEY); } catch (_) {}
    if (!code) {
      code = Array.from({length:4}, () => "0123456789ABCDEF"[Math.floor(Math.random()*16)]).join("");
      try { localStorage.setItem(WALLET_CODE_KEY, code); } catch (_) {}
    }
    return code;
  }
  function walletName(){
    let name = "";
    try { name = localStorage.getItem(WALLET_NAME_KEY) || ""; } catch (_) {}
    return name || "Visitante French Store";
  }
  function walletLevelLabel(){
    const role = document.documentElement.dataset.role || "visitor";
    const plan = planForRole[role];
    return (plan || "base").toUpperCase();
  }
  function renderWalletCard(){
    const name = walletName();
    const nameInput = $("#fsWalletNameInput");
    if (nameInput && document.activeElement !== nameInput) nameInput.value = name === "Visitante French Store" ? "" : name;
    const level = walletLevelLabel();
    const balance = $("#headerWallet")?.textContent || "Bs 0";
    const code = walletCode();
    all("#fsWalletName,#fsCheckoutWalletName").forEach(el => el.textContent = name);
    all("#fsWalletLevel,#fsCheckoutWalletLevel").forEach(el => el.textContent = level);
    const initialsEl = $("#fsWalletInitials");
    if (initialsEl) initialsEl.textContent = initials(name);
    const idEl = $("#fsWalletId");
    if (idEl) idEl.textContent = "FS • " + code;
    const balanceEl = $("#fsWalletBalanceLine");
    if (balanceEl) balanceEl.textContent = balance;
  }
  $("#fsWalletNameInput")?.addEventListener("input", (event) => {
    const value = event.target.value.trim();
    try { localStorage.setItem(WALLET_NAME_KEY, value || "Visitante French Store"); } catch (_) {}
    renderWalletCard();
  });
  // Small cursor/touch parallax on the card — a hint of 3D, not a full tilt rig.
  (() => {
    const stage = $(".fs-wallet-stage");
    const card = $("#fsWalletCard");
    if (!stage || !card) return;
    const reduced = () => document.documentElement.classList.contains("motion-off") ||
      window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    stage.addEventListener("pointermove", (event) => {
      if (reduced()) return;
      const rect = card.getBoundingClientRect();
      const px = (event.clientX - rect.left) / rect.width - 0.5;
      const py = (event.clientY - rect.top) / rect.height - 0.5;
      card.style.setProperty("--wallet-tilt-x", (-py * 10) + "deg");
      card.style.setProperty("--wallet-tilt-y", (px * 14) + "deg");
    }, {passive:true});
    stage.addEventListener("pointerleave", () => {
      card.style.setProperty("--wallet-tilt-x", "0deg");
      card.style.setProperty("--wallet-tilt-y", "0deg");
    }, {passive:true});
  })();

  // ---------- Checkout: confirm -> process -> receipt ----------
  function setCheckoutOpen(open){
    const overlay = $("#fsCheckoutOverlay"), backdrop = $("#fsCheckoutBackdrop");
    if (!overlay || !backdrop) return;
    overlay.classList.toggle("open", open);
    backdrop.classList.toggle("open", open);
    overlay.setAttribute("aria-hidden", String(!open));
    overlay.inert = !open;
    if (open) {
      renderWalletCard();
      const itemsEl = $("#fsCheckoutItems");
      if (itemsEl) {
        itemsEl.innerHTML = labCart.length
          ? labCart.map(item => '<div class="fs-checkout-item"><div><b>' + escapeHtml(item.game) + '</b><span>' + escapeHtml(item.package) + '</span></div><strong>' + escapeHtml(item.priceLabel) + '</strong></div>').join("")
          : '<div class="fs-checkout-empty">Tu carrito está vacío.</div>';
      }
      const total = cartTotal();
      $("#fsCheckoutSubtotal") && ($("#fsCheckoutSubtotal").textContent = money(total));
      $("#fsCheckoutTotal") && ($("#fsCheckoutTotal").textContent = money(total));
      const confirmBtn = $("#fsCheckoutConfirmBtn");
      if (confirmBtn) { confirmBtn.classList.remove("processing"); confirmBtn.disabled = !labCart.length; }
      const qrBtn = $("#fsCheckoutQrBtn");
      if (qrBtn) qrBtn.disabled = !labCart.length;
      requestAnimationFrame(() => $(".fs-checkout-panel button:not(:disabled)")?.focus?.({preventScroll:true}));
    }
  }
  $("[data-open-checkout]")?.addEventListener("click", () => setCheckoutOpen(true));
  document.addEventListener("click", (event) => {
    if (event.target.closest("[data-checkout-close]")) setCheckoutOpen(false);
  });
  // The overlay itself spans the full screen (so its centered layout works),
  // which would otherwise swallow clicks on the empty area around the panel
  // before they reach the backdrop underneath. Closing on a direct click on
  // the overlay element (not one of its children) is the actual "click
  // outside the panel" handler; the backdrop stays for the fade-to-dark visual.
  $("#fsCheckoutOverlay")?.addEventListener("click", (event) => {
    if (event.target === event.currentTarget) setCheckoutOpen(false);
  });

  function pad2(n){ return String(n).padStart(2, "0"); }
  function randomHex(len){
    return Array.from({length:len}, () => "0123456789ABCDEF"[Math.floor(Math.random()*16)]).join("");
  }
  // Friendly presentation only — never replaces a real internal order id.
  // The lab has no backend order id, so this *is* the order id here.
  function generateOrderId(){ return "FS-" + randomHex(8); }
  function generateTracking(){ return "FS-" + new Date().getFullYear() + "-" + randomHex(6); }

  let checkoutProcessing = false;
  document.addEventListener("click", (event) => {
    const btn = event.target.closest("[data-checkout-confirm]");
    if (!btn || checkoutProcessing || btn.disabled) return;
    if (!labCart.length) { toast("Tu carrito está vacío."); return; }
    checkoutProcessing = true;
    const method = btn.dataset.checkoutMethod === "qr" ? "qr" : "wallet";
    const confirmBtn = $("#fsCheckoutConfirmBtn");
    confirmBtn?.classList.add("processing");
    $("#fsCheckoutQrBtn")?.setAttribute("disabled", "true");
    const order = {
      id: generateOrderId(),
      tracking: generateTracking(),
      date: new Date(),
      items: labCart.slice(),
      total: cartTotal(),
      method
    };
    const reduced = document.documentElement.classList.contains("motion-off") ||
      window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    setTimeout(() => {
      checkoutProcessing = false;
      confirmBtn?.classList.remove("processing");
      setCheckoutOpen(false);
      labCart = [];
      saveLocalList(cartStorageKey, labCart);
      updateCartBadges();
      renderLabCart();
      openReceipt(order);
    }, reduced ? 120 : 1150);
  });

  function openReceipt(order){
    const overlay = $("#fsReceiptOverlay"), backdrop = $("#fsReceiptBackdrop");
    if (!overlay || !backdrop) return;
    const d = order.date;
    const dateLabel = pad2(d.getDate()) + "/" + pad2(d.getMonth()+1) + "/" + d.getFullYear() + " " + pad2(d.getHours()) + ":" + pad2(d.getMinutes());
    $("#fsReceiptOrder") && ($("#fsReceiptOrder").textContent = order.id);
    $("#fsReceiptTracking") && ($("#fsReceiptTracking").textContent = order.tracking);
    $("#fsReceiptDate") && ($("#fsReceiptDate").textContent = dateLabel);
    $("#fsReceiptMethod") && ($("#fsReceiptMethod").textContent = order.method === "qr" ? "QR" : "French Wallet");
    // Honest status: this lab has no real payment backend, so it never claims
    // a confirmed payment — QR shows "en verificación" until something real
    // confirms it (which never happens here), Wallet shows "Pedido recibido".
    $("#fsReceiptStatus") && ($("#fsReceiptStatus").textContent = order.method === "qr" ? "Pago en verificación" : "Pedido recibido");
    $("#fsReceiptTotal") && ($("#fsReceiptTotal").textContent = money(order.total));
    const productsEl = $("#fsReceiptProducts");
    if (productsEl) {
      productsEl.innerHTML = order.items.map(item =>
        '<div class="fs-receipt-product"><span>' + escapeHtml(item.game) + ' · ' + escapeHtml(item.package) + '</span><b>' + escapeHtml(item.priceLabel) + '</b></div>'
      ).join("");
    }
    const barcode = $("#fsReceiptBarcode");
    if (barcode) barcode.style.backgroundSize = (6 + (order.tracking.length % 5)) + "px 100%";
    overlay.dataset.order = order.id;
    overlay.dataset.tracking = order.tracking;
    overlay.dataset.total = money(order.total);
    overlay.dataset.method = order.method === "qr" ? "QR" : "French Wallet";
    overlay.classList.add("open");
    backdrop.classList.add("open");
    overlay.setAttribute("aria-hidden", "false");
    overlay.inert = false;
    requestAnimationFrame(() => $(".fs-receipt-actions button")?.focus?.({preventScroll:true}));
  }
  function closeReceipt(){
    const overlay = $("#fsReceiptOverlay"), backdrop = $("#fsReceiptBackdrop");
    if (!overlay) return;
    overlay.classList.remove("open");
    backdrop?.classList.remove("open");
    overlay.setAttribute("aria-hidden", "true");
    overlay.inert = true;
  }
  document.addEventListener("click", (event) => {
    if (event.target.closest("[data-receipt-close]")) { closeReceipt(); setView("inicio"); }
  });
  $("#fsReceiptOverlay")?.addEventListener("click", (event) => {
    if (event.target === event.currentTarget) { closeReceipt(); setView("inicio"); }
  });
  $("#fsReceiptWhatsapp")?.addEventListener("click", () => {
    const overlay = $("#fsReceiptOverlay");
    if (!overlay) return;
    const message = "Hola French Store 👋\n" +
      "Acabo de realizar un pedido.\n\n" +
      "Pedido: " + overlay.dataset.order + "\n" +
      "Método: " + overlay.dataset.method + "\n" +
      "Total: " + overlay.dataset.total + "\n" +
      "Seguimiento: " + overlay.dataset.tracking + "\n\n" +
      "Quisiera recibir el seguimiento de mi pedido por este chat.";
    // Opens WhatsApp with the text prefilled; the user still has to press
    // send themselves inside WhatsApp — nothing is sent automatically here.
    window.open("https://wa.me/59177057379?text=" + encodeURIComponent(message), "_blank", "noopener,noreferrer");
  });
  $("#fsReceiptCopy")?.addEventListener("click", (event) => {
    const overlay = $("#fsReceiptOverlay");
    const tracking = overlay?.dataset.tracking || "";
    const button = event.currentTarget;
    const done = () => {
      button.classList.add("copied");
      const original = button.textContent;
      button.textContent = "Copiado";
      setTimeout(() => { button.classList.remove("copied"); button.textContent = original; }, 1400);
    };
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(tracking).then(done).catch(() => toast("No se pudo copiar. Seguimiento: " + tracking));
    } else {
      toast("Seguimiento: " + tracking);
    }
  });

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
    clearTimeout(wheelSettleTimer);wheelSettleTimer=0;wheelDelta=0;setWheelPending(false);
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

  const productArt = { "Recargas": "recargas-id", "Streaming": "streaming", "Gift Cards": "giftcards", "Cuentas": "cuentas", "Páginas Web": "paginas" };
  function productCard(item){
    const art = productArt[item.category] || "recargas-id";
    return '<article class="product-card" tabindex="0" role="button" data-open-product="' + item.id + '"><div class="product-thumb" style="--art:url(./assets/categories/' + art + '-640.webp)"><i aria-hidden="true">' + item.icon + '</i></div><div class="product-meta"><span>' + item.category + '</span><b>' + item.name + '</b><div class="product-price"><strong>' + money(item.price) + '</strong><small>DEMO</small></div></div></article>';
  }

  // Single search-matching engine shared by the catalog's own search box and
  // the header quick-search overlay, so there is only ever one place that
  // knows how a query maps to a product. Aliases only widen the search terms
  // tried against real product/category names — they never invent products.
  const SEARCH_ALIASES = {
    "ff": "free fire", "freefire": "free fire",
    "ml": "mobile legends", "mlbb": "mobile legends",
    "diamante": "diamantes", "diamond": "diamantes", "diamonds": "diamantes"
  };
  function searchTermsFor(query){
    const q = String(query || "").trim().toLowerCase();
    if (!q) return [];
    const terms = new Set([q]);
    if (SEARCH_ALIASES[q]) terms.add(SEARCH_ALIASES[q]);
    return [...terms];
  }
  function productMatchesQuery(item, query){
    const terms = searchTermsFor(query);
    if (!terms.length) return true;
    const haystack = (item.name + " " + item.category).toLowerCase();
    return terms.some(term => haystack.includes(term));
  }
  function searchProducts(query, limit){
    const terms = searchTermsFor(query);
    if (!terms.length) return [];
    const results = data.products.filter(item => productMatchesQuery(item, query));
    return typeof limit === "number" ? results.slice(0, limit) : results;
  }

  function searchResultRow(item){
    const art = productArt[item.category] || "recargas-id";
    return '<button type="button" class="fs-search-result" data-search-open="' + escapeHtml(item.id) + '">' +
      '<span class="fs-search-result-thumb" style="background-image:url(./assets/categories/' + art + '-640.webp)"><i aria-hidden="true">' + item.icon + '</i></span>' +
      '<span class="fs-search-result-meta"><b>' + escapeHtml(item.name) + '</b><small>' + escapeHtml(item.category) + '</small></span>' +
      '<span class="fs-search-result-price">' + money(item.price) + '</span>' +
    '</button>';
  }

  let quickSearchTimer = 0;
  function renderQuickSearch(){
    const overlay = $("#fsSearchOverlay");
    const status = $("#fsSearchStatus");
    const results = $("#fsSearchResults");
    const query = $("#fsSearchInput")?.value || "";
    if (!overlay || !status || !results) return;
    clearTimeout(quickSearchTimer);
    if (!query.trim()) {
      overlay.classList.remove("searching");
      status.className = "fs-search-status empty";
      status.textContent = "";
      results.innerHTML = "";
      return;
    }
    overlay.classList.add("searching");
    status.className = "fs-search-status";
    status.textContent = "Buscando…";
    const reduced = document.documentElement.classList.contains("motion-off") ||
      window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    quickSearchTimer = setTimeout(() => {
      overlay.classList.remove("searching");
      const matches = searchProducts(query, 6);
      if (matches.length) {
        status.className = "fs-search-status found";
        status.textContent = "Encontrado";
        results.innerHTML = matches.map(searchResultRow).join("");
      } else {
        status.className = "fs-search-status none";
        status.textContent = "No encontramos resultados";
        results.innerHTML = "";
      }
    }, reduced ? 0 : 220);
  }

  function openQuickSearch(){
    const overlay = $("#fsSearchOverlay");
    const backdrop = $("#fsSearchBackdrop");
    const button = $("[data-open-search]");
    if (!overlay || !backdrop) return;
    overlay.classList.add("open");
    overlay.setAttribute("aria-hidden", "false");
    backdrop.classList.add("open");
    button?.setAttribute("aria-expanded", "true");
    requestAnimationFrame(() => $("#fsSearchInput")?.focus({preventScroll:true}));
  }
  function closeQuickSearch(){
    const overlay = $("#fsSearchOverlay");
    const backdrop = $("#fsSearchBackdrop");
    const button = $("[data-open-search]");
    const input = $("#fsSearchInput");
    if (!overlay || !overlay.classList.contains("open")) return;
    overlay.classList.remove("open", "searching");
    overlay.setAttribute("aria-hidden", "true");
    backdrop?.classList.remove("open");
    button?.setAttribute("aria-expanded", "false");
    if (input) input.value = "";
    const status = $("#fsSearchStatus");
    if (status) { status.textContent = ""; status.className = "fs-search-status"; }
    const results = $("#fsSearchResults");
    if (results) results.innerHTML = "";
    button?.focus({preventScroll:true});
  }
  function openSearchResult(id){
    const item = data.products.find(p => p.id === id);
    closeQuickSearch();
    activeFilter = "Todos";
    setView("catalogo");
    requestAnimationFrame(() => {
      const input = $("#catalogSearch");
      if (input && item) { input.value = item.name; renderCatalog(); }
    });
  }

  $("#fsSearchInput")?.addEventListener("input", renderQuickSearch);
  $("#fsSearchInput")?.addEventListener("keydown", (event) => {
    if (event.key === "Escape") { event.preventDefault(); closeQuickSearch(); }
  });
  $("#fsSearchResults")?.addEventListener("click", (event) => {
    const row = event.target.closest("[data-search-open]");
    if (row) openSearchResult(row.dataset.searchOpen);
  });
  document.addEventListener("click", (event) => {
    if (event.target.closest("[data-search-close]")) closeQuickSearch();
  });

  // Compact social icons: a coarse pointer (touch) never relies on :hover.
  // First tap expands to show the name; tapping the already-expanded icon
  // (or any :hover/:focus-visible expansion on a real pointer) navigates.
  document.addEventListener("click", (event) => {
    const card = event.target.closest(".social-card-grid.social-compact-row .social-card");
    if (!card) return;
    const coarse = window.matchMedia?.("(hover: none), (pointer: coarse)")?.matches;
    if (coarse && !card.classList.contains("tap-open")) {
      event.preventDefault();
      all(".social-card-grid.social-compact-row .social-card.tap-open").forEach(el => { if (el !== card) el.classList.remove("tap-open"); });
      card.classList.add("tap-open");
    }
  });
  document.addEventListener("click", (event) => {
    if (!event.target.closest(".social-card-grid.social-compact-row")) {
      all(".social-card-grid.social-compact-row .social-card.tap-open").forEach(el => el.classList.remove("tap-open"));
    }
  });

  // Orders: built only from data the lab already holds (checkout items); no status or date is invented.
  function renderOrders(){
    const panel = $("#ordersPanel");
    if (!panel) return;
    const rows = data.checkout || [];
    panel.innerHTML = '<div class="orders-tabs"><span class="active">Todos <b>' + rows.length + '</b></span></div>' +
      (rows.length ? '<div class="orders-list">' + rows.map(item => '<article class="order-row"><span class="order-thumb" aria-hidden="true">' + item.icon + '</span><div class="order-main"><b>' + escapeHtml(item.name) + '</b><small>' + escapeHtml(item.detail) + '</small></div><strong class="order-price">' + money(item.price) + '</strong><button type="button" data-account-action="Detalles del pedido">Ver detalles <span aria-hidden="true">›</span></button></article>').join("") + '</div>'
        : '<div class="lab-note"><b>Aún no tienes pedidos</b><p>Cuando compres, aparecerán aquí.</p></div>');
  }

  function render(){
    renderOrders();
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
    const query = $("#catalogSearch")?.value || "";
    const items = data.products.filter(item => {
      const matchesFilter = activeFilter === "Todos" || item.category === activeFilter;
      return matchesFilter && productMatchesQuery(item, query);
    });
    const grid = $("#catalogGrid");
    if (grid) grid.innerHTML = items.length ? items.map(productCard).join("") : '<div class="lab-note"><b>Sin resultados</b><p>Prueba otra búsqueda. Estos datos son ficticios.</p></div>';
    scheduleDeviceScale();
  }

  function setView(view){
    if ($("#xExperience")?.classList.contains("open")) closeExperience(false);
    const previousView = currentView;
    if (currentView === "inicio" && view !== "inicio" && document.activeElement && document.activeElement !== document.body) viewReturnFocus = document.activeElement;
    currentView = titleMap[view] ? view : "inicio";
    document.documentElement.dataset.view = currentView;
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
    if (currentView === "wallet") renderWalletCard();
  }

  function setRole(role){
    const safeRole = roleMap[role] ? role : "visitor";
    document.documentElement.dataset.role = safeRole;
    document.documentElement.dataset.plan = planForRole[safeRole] || "none";
    const label = roleMap[safeRole];
    const banner = $("#roleBanner");
    if (banner) banner.textContent = "Vista simulada: " + label;
    const profile = $("#profileRole");
    if (profile) profile.textContent = label;
    const plan = planForRole[safeRole];
    const note = $("#headerRoleNote");
    if (note) note.textContent = plan ? "Membresía " + plan.charAt(0).toUpperCase() + plan.slice(1) : safeRole === "visitor" ? "Inicia sesión para más beneficios" : label;
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

    const arenaMove = event.target.closest("[data-arena-move]");
    if (arenaMove) { moveCategory(Number(arenaMove.dataset.arenaMove)); return; }

    const arenaDot = event.target.closest("[data-arena-dot]");
    if (arenaDot) { setCategoryActive(Number(arenaDot.dataset.arenaDot), true); return; }

    const categoryEnter = event.target.closest("[data-category-enter]");
    if (categoryEnter) {
      const index=wrapCategoryIndex(Number(categoryEnter.dataset.categoryEnter));
      const selected=data.categories[index];
      if (selected && selected.href) { window.location.href = selected.href; return; }
      if (selected) {
        setCategoryActive(index,true);
        openExperience(selected.id);
      }
      return;
    }

    const category = event.target.closest("[data-category-index]");
    if (category) {
      if (performance.now() < categoryIgnoreClickUntil) return;
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

    if (event.target.closest("[data-x-add-selected]")) {
      const btn = event.target.closest("[data-x-add-selected]");
      if (btn.classList.contains("cta-busy")) return; // guard: ignore a second click mid-animation
      if (addCurrentToCart()) playAddToCartFeedback(btn);
      return;
    }

    if (event.target.closest("#xBuyButton")) {
      if (addCurrentToCart()) setCartDrawer(true);
      return;
    }

    const searchButton = event.target.closest("[data-open-search]");
    if (searchButton) { openQuickSearch(); return; }

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
  function categoryDragCards(){ return all(".category-arena-card").filter(card => Number(card.dataset.distance) <= 1); }
  function drawCategoryDrag(viewport, offset){
    categoryGestureOffset = Math.max(-118, Math.min(118, offset));
    if (categoryGestureFrame) return;
    categoryGestureFrame = requestAnimationFrame(() => {
      categoryGestureFrame = 0;
      const value = categoryGestureOffset + "px";
      categoryDragCards().forEach(card => card.style.setProperty("--category-drag-x", value));
    });
  }
  function clearCategoryDrag(){
    all(".category-arena-card").forEach(card => card.style.removeProperty("--category-drag-x"));
  }

  function finishCategoryGesture(viewport, event, cancelled = false, gestureId = event?.pointerId){
    if (categoryGesturePointerId == null || (gestureId != null && gestureId !== categoryGesturePointerId)) return;
    // Use the last move position (not the pointerup coordinates, which some touch stacks report as 0,0).
    const endX = categoryGestureLastX ?? event?.clientX ?? categoryGestureStartX;
    const endY = categoryGestureLastY ?? event?.clientY ?? categoryGestureStartY;
    const dx = event ? endX - categoryGestureStartX : 0;
    const dy = event ? endY - categoryGestureStartY : 0;
    const threshold = Math.min(96, Math.max(42, viewport.clientWidth * .16));
    const horizontal = Math.abs(dx) >= threshold && Math.abs(dx) > Math.abs(dy) * 1.12;
    if (categoryGestureFrame) {
      cancelAnimationFrame(categoryGestureFrame);
      categoryGestureFrame = 0;
    }
    viewport.classList.remove("is-dragging");
    clearCategoryDrag();
    const pointerId = categoryGesturePointerId;
    categoryGesturePointerId = null;
    categoryGestureStartX = null;
    categoryGestureStartY = null;
    categoryGestureLastX = null;
    categoryGestureLastY = null;
    if (typeof pointerId === "number" && viewport.hasPointerCapture?.(pointerId)) {
      viewport.releasePointerCapture(pointerId);
    }
    if (categoryGestureDidDrag) categoryIgnoreClickUntil = performance.now() + 220;
    categoryGestureDidDrag = false;
    if (!cancelled && horizontal) moveCategory(dx < 0 ? 1 : -1);
  }

  function beginCategoryGesture(viewport, gestureId, event){
    if (event.target.closest(".category-enter, .arena-nav") || categoryMoving) return;
    categoryGesturePointerId = gestureId;
    categoryGestureStartX = event.clientX;
    categoryGestureStartY = event.clientY;
    categoryGestureDidDrag = false;
    categoryGestureOffset = 0;
    categoryGestureLastX = null;
    categoryGestureLastY = null;
  }

  function continueCategoryGesture(viewport, gestureId, event){
    if (gestureId !== categoryGesturePointerId || categoryGestureStartX == null || categoryGestureStartY == null) return;
    categoryGestureLastX = event.clientX;
    categoryGestureLastY = event.clientY;
    const dx = event.clientX - categoryGestureStartX;
    const dy = event.clientY - categoryGestureStartY;
    if (!categoryGestureDidDrag && Math.abs(dx) > 6 && Math.abs(dx) > Math.abs(dy) * 1.05) {
      categoryGestureDidDrag = true;
      viewport.classList.add("is-dragging");
      if (typeof gestureId === "number") { try { viewport.setPointerCapture(gestureId); } catch (_) {} }
    }
    if (categoryGestureDidDrag) drawCategoryDrag(viewport, dx);
  }

  categoryViewport?.addEventListener("pointerdown", (event) => {
    if (event.button != null && event.button !== 0) return;
    beginCategoryGesture(categoryViewport, event.pointerId, event);
  }, {passive:true});

  categoryViewport?.addEventListener("pointermove", (event) => {
    continueCategoryGesture(categoryViewport, event.pointerId, event);
  }, {passive:true});

  categoryViewport?.addEventListener("pointerup", (event) => finishCategoryGesture(categoryViewport, event), {passive:true});
  categoryViewport?.addEventListener("pointercancel", (event) => finishCategoryGesture(categoryViewport, event, true), {passive:true});
  categoryViewport?.addEventListener("lostpointercapture", (event) => {
    // lostpointercapture bubbles: the browser's implicit touch capture on a child being handed to the viewport must not cancel the gesture.
    if (event.target !== categoryViewport) return;
    if (categoryGesturePointerId != null) finishCategoryGesture(categoryViewport, null, true);
  });

  categoryViewport?.addEventListener("dragstart", (event) => event.preventDefault());

  // Wheel / trackpad: exactly one category per physical scroll gesture.
  // Keep the gesture latched through slow input and inertial tails so one gesture can never queue a second card.
  let categoryWheelQuiet = 0, categoryWheelArmed = true, categoryWheelSum = 0;
  const CATEGORY_WHEEL_REARM_MS = 700;
  categoryViewport?.addEventListener("wheel", (event) => {
    const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
    if (!delta) return;
    event.preventDefault();
    clearTimeout(categoryWheelQuiet);
    categoryWheelQuiet = setTimeout(() => {
      categoryWheelArmed = true;
      categoryWheelSum = 0;
    }, CATEGORY_WHEEL_REARM_MS);
    if (!categoryWheelArmed) return;
    if (categoryWheelSum && Math.sign(categoryWheelSum) !== Math.sign(delta)) categoryWheelSum = 0;
    categoryWheelSum += delta;
    if (Math.abs(categoryWheelSum) < 36) return;
    categoryWheelArmed = false;
    moveCategory(categoryWheelSum > 0 ? 1 : -1);
    categoryWheelSum = 0;
  }, { passive: false });

  document.addEventListener("keydown", (event) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    if (event.repeat || event.altKey || event.ctrlKey || event.metaKey) return;
    if (document.querySelector('.store-view.active[data-view]')?.dataset.view !== "inicio") return;
    if (event.target.closest?.("input,textarea,select,[contenteditable]")) return;
    event.preventDefault();
    moveCategory(event.key === "ArrowRight" ? 1 : -1);
  });

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
  $(".x-wheel-panel")?.addEventListener("wheel",event=>{
    if(event.ctrlKey || !$("#xExperience")?.classList.contains("open") || !experienceGames.length) return;
    const raw=Math.abs(event.deltaY)>=Math.abs(event.deltaX)?event.deltaY:event.deltaX;
    if(!raw) return;
    event.preventDefault();
    const delta=raw*(event.deltaMode===1?32:event.deltaMode===2?300:1);
    // Trackpads accumulate small deltas; mouse notches move predictable steps.
    if(wheelDelta && Math.sign(wheelDelta)!==Math.sign(delta)) wheelDelta=0;
    wheelDelta+=delta;
    const steps=Math.max(-4,Math.min(4,Math.trunc(wheelDelta/80)));
    if(steps) wheelDelta-=steps*80;
    setExperienceGame(activeExperienceGame+steps,false,true);
  },{passive:false});
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
  let loadingBrandTimer = 0;
  let mascotFrameInterval = 0;

  // 4 unique flight frames (a 5th arrived as a byte-identical duplicate of
  // frame 2 and was dropped). Cycled by swapping background-image rather
  // than a sprite sheet, so replacing/adding frames later is a file swap.
  const MASCOT_FRAMES = [
    "./assets/mascot/mascot-flight-01.webp",
    "./assets/mascot/mascot-flight-02.webp",
    "./assets/mascot/mascot-flight-03.webp",
    "./assets/mascot/mascot-flight-04.webp"
  ];
  let mascotFramesReady = false;
  function preloadMascotFrames(){
    if (mascotFramesReady) return;
    mascotFramesReady = true;
    MASCOT_FRAMES.forEach(src => { const img = new Image(); img.src = src; });
  }

  function startMascotFrameLoop(reduced){
    const frameEl = $("#fsMascotFrame");
    if (!frameEl) return;
    clearInterval(mascotFrameInterval);
    let i = 0;
    frameEl.style.backgroundImage = "url('" + MASCOT_FRAMES[0] + "')";
    if (reduced) return; // static pose only, no cycling
    mascotFrameInterval = setInterval(() => {
      i = (i + 1) % MASCOT_FRAMES.length;
      frameEl.style.backgroundImage = "url('" + MASCOT_FRAMES[i] + "')";
    }, 90); // ~11fps
  }
  function stopMascotFrameLoop(){
    clearInterval(mascotFrameInterval);
    mascotFrameInterval = 0;
  }

  function stopLoadingTimers(){
    clearTimeout(loadingHideTimer);
    clearInterval(loadingProgressInterval);
    clearTimeout(loadingBrandTimer);
    stopMascotFrameLoop();
    loadingHideTimer = 0;
    loadingProgressInterval = 0;
    loadingBrandTimer = 0;
  }

  function finishLoadingDemo(overlay, button, reduced, onDone){
    overlay.classList.add("loading-complete");
    loadingHideTimer = setTimeout(() => {
      overlay.classList.add("leaving");
      loadingHideTimer = setTimeout(() => {
        overlay.classList.remove("active","leaving","run-phase","brand-phase","loading-complete");
        overlay.setAttribute("aria-hidden","true");
        $("#fsMascotTrack")?.classList.remove("mascot-dashing");
        $("#fsMascotProgress")?.classList.remove("mascot-dash-out");
        stopMascotFrameLoop();
        if (button) button.textContent = "▶ Probar carga";
        onDone?.();
      }, reduced ? 40 : 360);
    }, reduced ? 150 : 360);
  }

  // Two stages: ETAPA 1 brand-phase (diamond + wordmark power-on), then the
  // speed loader with a real progress bar. Shared by the lab's manual replay
  // button and the one-time real intro so there is only ever one loader system.
  function runLoadingDemo(opts){
    const auto = !!opts?.auto;
    const overlay = $("#loadingDemo");
    const fill = $("#loadingProgressBar");
    const percent = $("#loadingPercent");
    const message = $("#loadingMessage");
    const button = $("#loadingDemoButton");
    if (!overlay || !fill || !percent || !message) { opts?.onDone?.(); return; }

    preloadMascotFrames();
    stopLoadingTimers();
    overlay.classList.remove("leaving","loading-complete","run-phase");
    overlay.classList.add("active","brand-phase");
    overlay.setAttribute("aria-hidden","false");

    let progress = 0;
    fill.style.transform = "scaleX(0)";
    percent.textContent = "0%";
    message.textContent = "Preparando French Store...";
    if (button) button.textContent = "↻ Reiniciar carga";

    const reduced = document.documentElement.classList.contains("motion-off") ||
      window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;

    const mascotTrack = $("#fsMascotTrack");
    const mascotProgress = $("#fsMascotProgress");
    // Measured once: the track doesn't resize during the ~2s loader, so this
    // avoids a layout read on every tick.
    const mascotMaxX = (mascotTrack && mascotProgress)
      ? Math.max(0, mascotTrack.clientWidth - mascotProgress.offsetWidth)
      : 0;
    mascotProgress?.classList.remove("mascot-dash-out");
    mascotTrack?.classList.remove("mascot-dashing");
    mascotProgress?.style.setProperty("--mascot-x", "0px");
    startMascotFrameLoop(reduced);

    const startRun = () => {
      overlay.classList.remove("brand-phase");
      overlay.classList.add("run-phase");
      loadingProgressInterval = setInterval(() => {
        progress += reduced ? 20 : (3.4 + Math.random() * 3.6);

        if (progress >= 100) {
          progress = 100;
          clearInterval(loadingProgressInterval);
          loadingProgressInterval = 0;
          fill.style.transform = "scaleX(1)";
          percent.textContent = "100%";
          message.textContent = "¡Todo listo! Entrando a French Store...";
          mascotProgress?.style.setProperty("--mascot-x", mascotMaxX + "px");
          // Brief pause, then tilt forward and dash off-screen while the
          // speed lines flash; the loader's own edge clips it as it exits.
          mascotTrack?.classList.add("mascot-dashing");
          loadingHideTimer = setTimeout(() => {
            mascotProgress?.classList.add("mascot-dash-out");
          }, reduced ? 0 : 140);
          finishLoadingDemo(overlay, button, reduced, opts?.onDone);
          return;
        }

        const visible = Math.floor(progress);
        fill.style.transform = "scaleX(" + (progress / 100) + ")";
        percent.textContent = visible + "%";
        mascotProgress?.style.setProperty("--mascot-x", (progress / 100 * mascotMaxX) + "px");

        message.textContent = visible < 70 ? "Preparando French Store..." : "Últimos detalles...";
      }, 55);
    };

    // Real intro: never block on the brand card — cap it so a slow device
    // still reaches the store quickly. Manual lab replay keeps a fixed beat.
    loadingBrandTimer = setTimeout(startRun, reduced ? 80 : (auto ? 950 : 1050));
  }

  $("#loadingDemoButton")?.addEventListener("click", () => runLoadingDemo());
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
  $("#fsBackdrop")?.addEventListener("click", () => { setView("inicio"); viewReturnFocus?.focus?.({preventScroll:true}); viewReturnFocus = null; });
  const initial = location.hash.replace("#", "");
  setView(titleMap[initial] ? initial : "inicio");
  // The intro stays available in the lab; it must not delay the review or navigation.
  // Manual lab replay only; skip it when the real one-time intro already triggered the same overlay.
  if (new URLSearchParams(location.search).has('intro') && introRoot.dataset.intro !== "playing") runLoadingDemo();
  document.addEventListener('keydown', event => {
    if (event.key==='Escape' && $('#fsSearchOverlay')?.classList.contains('open')) { event.preventDefault(); closeQuickSearch(); return; }
    if (event.key==='Escape' && $('#fsReceiptOverlay')?.classList.contains('open')) { event.preventDefault(); closeReceipt(); return; }
    if (event.key==='Escape' && $('#fsCheckoutOverlay')?.classList.contains('open')) { event.preventDefault(); setCheckoutOpen(false); return; }
    const cartOpen=$('#xCartDrawer')?.classList.contains('open');
    const infoOpen=$('#infoHub')?.classList.contains('open');
    if(cartOpen && event.key==='Escape'){event.preventDefault();setCartDrawer(false);return;}
    if(!cartOpen && !infoOpen && $('#xExperience')?.classList.contains('open') && event.key==='Escape'){event.preventDefault();closeExperience(false);return;}
    if(!cartOpen && !infoOpen && event.key==='Escape' && currentView!=='inicio'){event.preventDefault();setView('inicio');viewReturnFocus?.focus?.({preventScroll:true});viewReturnFocus=null;return;}
    if(!cartOpen && !infoOpen) return;
    if (event.key === 'Escape') { event.preventDefault(); setInfoHub(false); return; }
    if (event.key !== 'Tab') return;
    const focusable=all('button,a[href]', $(cartOpen ? '#xCartDrawer' : '#infoHub')).filter(el=>el.getClientRects().length && !el.disabled);
    const first=focusable[0], last=focusable.at(-1);
    if(event.shiftKey && document.activeElement===first) {event.preventDefault();last?.focus();}
    else if(!event.shiftKey && document.activeElement===last) {event.preventDefault();first?.focus();}
  });
})();

/* iOS Safari only applies :active (pressed states) when a touchstart listener exists. */
document.addEventListener("touchstart", () => {}, { passive: true });

