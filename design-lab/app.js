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

  function money(value){ return "Bs " + Number(value).toFixed(2).replace(".", ","); }

  function toast(message){
    const el = $("#toast");
    if (!el) return;
    el.textContent = message;
    el.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove("show"), 2600);
  }

  function setInfoHub(open){
    const hub = $("#infoHub");
    const backdrop = $("#infoHubBackdrop");
    const toggle = $("[data-info-toggle]");
    const isOpen = Boolean(open);
    hub?.classList.toggle("open", isOpen);
    backdrop?.classList.toggle("open", isOpen);
    hub?.setAttribute("aria-hidden", isOpen ? "false" : "true");
    toggle?.setAttribute("aria-expanded", isOpen ? "true" : "false");
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
    return '<button class="category-card category-arena-card" type="button" data-category-index="' + index + '" data-category="' + item.id + '" style="--accent-rgb:' + accent + '" aria-label="' + item.name + '"><span class="category-card-grid" aria-hidden="true"></span><span class="category-card-top"><span class="category-code">' + (item.code || String(index + 1).padStart(2, "0")) + '</span><span class="category-tag">' + (item.tag || "FRENCH") + '</span></span><span class="category-icon-stage" aria-hidden="true"><span class="category-icon-orbit"></span><span class="icon">' + item.icon + '</span></span><span class="category-copy"><small>' + item.subtitle + '</small><b>' + item.name + '</b></span><span class="category-enter">Explorar <i>→</i></span></button>';
  }

  function renderCategoryArena(){
    const grid = $("#categoryGrid");
    const count = data.categories.length;
    if (!grid || !count) return;
    grid.innerHTML = data.categories.map(categoryCard).join("");
    const dots = $("#categoryArenaDots");
    if (dots) dots.innerHTML = data.categories.map((_, index) => '<button type="button" data-arena-dot="' + index + '" aria-label="Ir a categoría ' + (index + 1) + '"></button>').join("");
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
      card.tabIndex = distance <= 1 ? 0 : -1;
      if (instant) card.classList.add("roulette-instant");
      else card.classList.remove("roulette-instant");
    });

    if (instant) requestAnimationFrame(() => cards.forEach(card => card.classList.remove("roulette-instant")));

    all("#categoryArenaDots [data-arena-dot]").forEach((dot, dotIndex) => dot.classList.toggle("active", dotIndex === next));
    const counter = $("#categoryArenaCounter");
    if (counter) counter.textContent = String(next + 1).padStart(2, "0") + " / " + String(count).padStart(2, "0");

    const prev = $(".arena-arrow-prev");
    const nextButton = $(".arena-arrow-next");
    if (prev) prev.disabled = false;
    if (nextButton) nextButton.disabled = false;
  }

  function moveCategory(direction){
    if (!direction) return;
    setCategoryActive(activeCategoryIndex + (direction < 0 ? -1 : 1));
  }

  function productCard(item){
    return '<article class="product-card" tabindex="0" role="button" data-open-product="' + item.id + '"><div class="product-thumb">' + item.icon + '</div><div class="product-meta"><span>' + item.category + '</span><b>' + item.name + '</b><div class="product-price"><strong>' + money(item.price) + '</strong><small>DEMO</small></div></div></article>';
  }

  function render(){
    renderCategoryArena();

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
  }

  function setView(view){
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
  }

  function setRole(role){
    const safeRole = roleMap[role] ? role : "visitor";
    document.documentElement.dataset.role = safeRole;
    const label = roleMap[safeRole];
    const banner = $("#roleBanner");
    if (banner) banner.textContent = "Vista simulada: " + label;
    const profile = $("#profileRole");
    if (profile) profile.textContent = label;
    if (safeRole !== "admin" && currentView === "admin") setView("inicio");
    toast("Estado simulado: " + label + ". No se consultó ninguna cuenta real.");
  }

  document.addEventListener("submit", (event) => {
    event.preventDefault();
    toast("Formularios bloqueados en Design Lab.");
  }, true);

  document.addEventListener("click", (event) => {
    const infoToggle = event.target.closest("[data-info-toggle]");
    if (infoToggle) {
      setInfoHub(infoToggle.getAttribute("aria-expanded") !== "true");
      return;
    }

    if (event.target.closest("[data-info-close]")) {
      setInfoHub(false);
      return;
    }

    const infoAction = event.target.closest("[data-info-action]");
    if (infoAction) {
      toast(infoAction.dataset.infoAction + " se abrirá aquí cuando conectemos la versión real.");
      return;
    }

    const arenaArrow = event.target.closest("[data-arena-direction]");
    if (arenaArrow) { moveCategory(Number(arenaArrow.dataset.arenaDirection || 0)); return; }

    const arenaDot = event.target.closest("[data-arena-dot]");
    if (arenaDot) { setCategoryActive(Number(arenaDot.dataset.arenaDot), true); return; }

    const category = event.target.closest("[data-category-index]");
    if (category) {
      const index = wrapCategoryIndex(Number(category.dataset.categoryIndex));
      if (index === activeCategoryIndex) {
        const selected = data.categories[index];
        activeFilter = categoryFilterMap[selected?.id] || "Todos";
        render();
        setView("catalogo");
        toast("Abriendo " + (selected?.name || "French Store") + ".");
        requestAnimationFrame(() => $("#catalogSearch")?.focus({preventScroll:true}));
      } else {
        setCategoryActive(index, true);
      }
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

  const devicePresets = {
    mobile: { width: 390, height: 844, label: "Celular" },
    "mobile-landscape": { width: 844, height: 390, label: "Celular horizontal" },
    tablet: { width: 820, height: 1180, label: "Tablet" },
    laptop: { width: 1180, height: 768, label: "Laptop" },
    desktop: { width: 1440, height: 900, label: "PC" }
  };

  function updateDeviceScale(){
    const root = document.documentElement;
    const viewport = $("#deviceViewport");
    const frame = $("#deviceFrame");
    if (!viewport || !frame) return;
    const preset = devicePresets[root.dataset.device] || devicePresets.desktop;
    const available = Math.max(1, viewport.clientWidth);
    const scale = Math.min(1, available / preset.width);
    root.style.setProperty("--device-width", preset.width + "px");
    root.style.setProperty("--device-height", preset.height + "px");
    root.style.setProperty("--device-scale", scale.toFixed(4));
    requestAnimationFrame(() => {
      viewport.style.height = Math.ceil(frame.scrollHeight * scale) + "px";
    });
  }

  function setDevice(device){
    const safeDevice = devicePresets[device] ? device : "desktop";
    document.documentElement.dataset.device = safeDevice;
    document.querySelectorAll("#devicePreviewButtons [data-device-preview]").forEach(el => {
      el.classList.toggle("active", el.dataset.devicePreview === safeDevice);
    });
    updateDeviceScale();
    requestAnimationFrame(() => setCategoryActive(activeCategoryIndex, false, true));
  }

  $("#devicePreviewButtons")?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-device-preview]");
    if (!button) return;
    setDevice(button.dataset.devicePreview);
  });

  window.addEventListener("resize", updateDeviceScale);

  $("#roleSelect")?.addEventListener("change", (event) => setRole(event.target.value));

  $("#motionToggle")?.addEventListener("click", (event) => {
    const disabled = document.documentElement.classList.toggle("motion-off");
    event.currentTarget.textContent = "Animaciones: " + (disabled ? "OFF" : "ON");
  });


  let loadingRaf = 0;
  let loadingHideTimer = 0;
  let loadingPhaseTimer = 0;

  function runLoadingDemo(){
    const overlay = $("#loadingDemo");
    const runner = $("#loadingRunner");
    const zone = $("#loadingRunnerZone");
    const fill = $("#loadingProgressBar");
    const percent = $("#loadingPercent");
    const message = $("#loadingMessage");
    const button = $("#loadingDemoButton");
    if (!overlay || !runner || !zone || !fill || !percent || !message) return;

    cancelAnimationFrame(loadingRaf);
    clearTimeout(loadingHideTimer);
    clearTimeout(loadingPhaseTimer);
    overlay.classList.remove("leaving","run-phase");
    overlay.classList.add("active","brand-phase");
    overlay.setAttribute("aria-hidden","false");
    fill.style.transform = "scaleX(0)";
    percent.textContent = "0%";
    runner.style.setProperty("--runner-x","0px");
    runner.style.setProperty("--runner-bob","0px");
    runner.style.opacity = "1";
    runner.style.visibility = "visible";
    runner.style.display = "block";
    runner.removeAttribute("hidden");
    message.textContent = "Estamos corriendo para actualizar precios...";
    if (button) button.textContent = "↻ Reiniciar carga";

    const reduced = document.documentElement.classList.contains("motion-off") || window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    const device = document.documentElement.dataset.device || "desktop";
    const compactMobile = device === "mobile" || device === "mobile-landscape";
    const brandDuration = reduced ? 420 : (compactMobile ? 1250 : 1180);
    const runDuration = reduced ? 1050 : (compactMobile ? 3600 : device === "tablet" ? 3900 : 3700);

    loadingPhaseTimer = setTimeout(() => {
      overlay.classList.remove("brand-phase");
      overlay.classList.add("run-phase");
      const start = performance.now();

      function tick(now){
        const raw = Math.min(1, Math.max(0, (now - start) / runDuration));
        const eased = 1 - Math.pow(1 - raw, 2.05);
        const value = Math.round(eased * 100);
        const zoneWidth = zone.clientWidth;
        const rootScale = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--device-scale")) || 1;
        const runnerWidth = runner.getBoundingClientRect().width / rootScale;
        const travel = Math.max(0, zoneWidth - Math.min(runnerWidth, zoneWidth * .58));
        runner.style.setProperty("--runner-x",(travel * eased) + "px");
        runner.style.setProperty("--runner-bob", reduced ? "0px" : (Math.sin(raw * Math.PI * 18) * 3.8) + "px");
        fill.style.transform = "scaleX(" + eased.toFixed(4) + ")";
        percent.textContent = value + "%";
        if (value < 38) message.textContent = "Estamos corriendo para actualizar precios...";
        else if (value < 76) message.textContent = "Un sprint más: ordenando ofertas y recargas...";
        else if (value < 100) message.textContent = "Últimos metros: dejando todo listo...";
        else message.textContent = "¡Llegamos! French Store está listo.";

        if (raw < 1) { loadingRaf = requestAnimationFrame(tick); return; }

        loadingHideTimer = setTimeout(() => {
          overlay.classList.add("leaving");
          loadingHideTimer = setTimeout(() => {
            overlay.classList.remove("active","leaving","brand-phase","run-phase");
            overlay.setAttribute("aria-hidden","true");
            if (button) button.textContent = "▶ Probar carga";
          }, reduced ? 40 : 480);
        }, reduced ? 180 : 560);
      }
      loadingRaf = requestAnimationFrame(tick);
    }, brandDuration);
  }

  $("#loadingDemoButton")?.addEventListener("click", runLoadingDemo);
  $("#settingsMotionShortcut")?.addEventListener("click", () => $("#motionToggle")?.click());

  setDevice(document.documentElement.dataset.device || "desktop");
  const frameObserver = ("ResizeObserver" in window && $("#deviceFrame")) ? new ResizeObserver(updateDeviceScale) : null;
  if (frameObserver) frameObserver.observe($("#deviceFrame"));
  render();
  const initial = location.hash.replace("#", "");
  setView(titleMap[initial] ? initial : "inicio");
  setTimeout(runLoadingDemo, 220);
})();
