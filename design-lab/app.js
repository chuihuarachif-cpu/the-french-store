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
  const $$ = (s, root = document) => [...root.querySelectorAll(s)];
  const titleMap = { inicio: "Inicio", catalogo: "Tienda", wallet: "Wallet", pedidos: "Pedidos", perfil: "Perfil", producto: "Producto", checkout: "Checkout", admin: "Admin" };
  const roleMap = { visitor: "Visitante", user: "Usuario", reseller: "Reseller", admin: "Admin" };
  let currentView = "inicio";
  let activeFilter = "Todos";
  let toastTimer;

  function money(value){ return "Bs " + Number(value).toFixed(2).replace(".", ","); }

  function toast(message){
    const el = $("#toast");
    if (!el) return;
    el.textContent = message;
    el.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove("show"), 2600);
  }

  function categoryCard(item){
    return '<button class="category-card" type="button" data-nav-view="catalogo" data-category="' + item.id + '"><span class="icon">' + item.icon + '</span><b>' + item.name + '</b><small>' + item.subtitle + '</small></button>';
  }

  function productCard(item){
    return '<article class="product-card" tabindex="0" role="button" data-open-product="' + item.id + '"><div class="product-thumb">' + item.icon + '</div><div class="product-meta"><span>' + item.category + '</span><b>' + item.name + '</b><div class="product-price"><strong>' + money(item.price) + '</strong><small>DEMO</small></div></div></article>';
  }

  function render(){
    const categoryGrid = $("#categoryGrid");
    if (categoryGrid) categoryGrid.innerHTML = data.categories.map(categoryCard).join("");

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
    $$(".store-view").forEach(el => el.classList.toggle("active", el.dataset.view === currentView));
    $$("[data-nav-view]").forEach(el => el.classList.toggle("active", el.dataset.navView === currentView));
    $$("#labMenu [data-lab-view]").forEach(el => el.classList.toggle("active", el.dataset.labView === currentView));
    const title = $("#previewTitle");
    if (title) title.textContent = titleMap[currentView];
    const stage = $(".store-app");
    if (stage) stage.scrollTop = 0;
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

  const devicePresets = {
    mobile: { width: 390, height: 844, label: "Celular" },
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
    overlay.classList.remove("leaving");
    overlay.classList.add("active");
    overlay.setAttribute("aria-hidden","false");
    fill.style.transform = "scaleX(0)";
    percent.textContent = "0%";
    runner.style.setProperty("--runner-x","0px");
    runner.style.setProperty("--runner-bob","0px");
    message.textContent = "Estamos corriendo para actualizar precios...";
    if (button) button.textContent = "↻ Reiniciar carga";

    const reduced = document.documentElement.classList.contains("motion-off") ||
      window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    const device = document.documentElement.dataset.device || "desktop";
    const duration = reduced ? 1100 : (device === "mobile" ? 4600 : device === "tablet" ? 4350 : 4100);
    const start = performance.now();

    function tick(now){
      const raw = Math.min(1, Math.max(0, (now - start) / duration));
      const eased = 1 - Math.pow(1 - raw, 2.05);
      const value = Math.round(eased * 100);
      const zoneWidth = zone.clientWidth;
      const runnerWidth = runner.getBoundingClientRect().width / (parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--device-scale")) || 1);
      const travel = Math.max(0, zoneWidth - Math.min(runnerWidth, zoneWidth * .58));
      runner.style.setProperty("--runner-x",(travel * eased) + "px");
      runner.style.setProperty("--runner-bob", reduced ? "0px" : (Math.sin(raw * Math.PI * 18) * 3.8) + "px");
      fill.style.transform = "scaleX(" + eased.toFixed(4) + ")";
      percent.textContent = value + "%";

      if (value < 38) {
        message.textContent = "Estamos corriendo para actualizar precios...";
      } else if (value < 76) {
        message.textContent = "Un sprint más: ordenando ofertas y recargas...";
      } else if (value < 100) {
        message.textContent = "Últimos metros: dejando todo listo...";
      } else {
        message.textContent = "¡Llegamos! Precios listos para revisar.";
      }

      if (raw < 1) {
        loadingRaf = requestAnimationFrame(tick);
        return;
      }

      loadingHideTimer = setTimeout(() => {
        overlay.classList.add("leaving");
        loadingHideTimer = setTimeout(() => {
          overlay.classList.remove("active","leaving");
          overlay.setAttribute("aria-hidden","true");
          if (button) button.textContent = "▶ Probar carga";
        }, reduced ? 40 : 480);
      }, reduced ? 220 : 650);
    }

    loadingRaf = requestAnimationFrame(tick);
  }

  $("#loadingDemoButton")?.addEventListener("click", runLoadingDemo);

  setDevice(document.documentElement.dataset.device || "desktop");
  const frameObserver = ("ResizeObserver" in window && $("#deviceFrame")) ? new ResizeObserver(updateDeviceScale) : null;
  if (frameObserver) frameObserver.observe($("#deviceFrame"));
  render();
  const initial = location.hash.replace("#", "");
  setView(titleMap[initial] ? initial : "inicio");
})();
