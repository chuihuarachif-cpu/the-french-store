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

  $("#deviceSelect")?.addEventListener("change", (event) => {
    document.documentElement.dataset.device = event.target.value;
  });

  $("#roleSelect")?.addEventListener("change", (event) => setRole(event.target.value));

  $("#motionToggle")?.addEventListener("click", (event) => {
    const disabled = document.documentElement.classList.toggle("motion-off");
    event.currentTarget.textContent = "Animaciones: " + (disabled ? "OFF" : "ON");
  });

  render();
  const initial = location.hash.replace("#", "");
  setView(titleMap[initial] ? initial : "inicio");
})();
