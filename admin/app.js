/* THE FRENCH STORE — R88 private admin PWA.
   Browser contains only the public Supabase anon key. Every write is re-authorized
   server-side by private admin-app RPCs; no service-role or provider secret is used. */
(() => {
  'use strict';

  const SUPABASE_URL = 'https://jivaaripugjdpxjvjnsu.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJIUzI1NiIsInJlZiI6ImppdmFhcmlwdWdqZHB4anZqbnN1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU2NDY3MzIsImV4cCI6MjEwMTIyMjczMn0.N60Xb1PqqPo12HdKEzPc4qCp1aFvVzwZz4VG04q_Es4';
  const DEFAULT_MAINTENANCE_MESSAGE = 'Temporalmente no disponible. Estamos terminando de habilitar las compras de este juego.';
  const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
  });

  let products = [];
  let activeFilter = 'editable';
  let toastTimer = null;

  const $ = (id) => document.getElementById(id);
  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[char]));
  const money = (value) => `Bs ${Number(value || 0).toLocaleString('es-BO',{minimumFractionDigits:2,maximumFractionDigits:2})}`;
  const fmtDate = (value) => value ? new Intl.DateTimeFormat('es-BO',{dateStyle:'short',timeStyle:'short'}).format(new Date(value)) : '—';

  function showOnly(viewId) {
    ['loadingView','loginView','deniedView','appView'].forEach((id) => $(id)?.classList.toggle('hidden', id !== viewId));
    $('logoutButton')?.classList.toggle('hidden', viewId !== 'appView');
  }

  function toast(message) {
    const el = $('toast');
    if (!el) return;
    if (toastTimer) clearTimeout(toastTimer);
    el.textContent = message;
    el.classList.remove('hidden');
    toastTimer = setTimeout(() => el.classList.add('hidden'), 3200);
  }

  function showLoginError(message) {
    const el = $('loginMessage');
    el.textContent = message;
    el.classList.remove('hidden');
  }

  async function confirmAction(title, html) {
    const modal = $('confirmModal');
    $('confirmTitle').textContent = title;
    $('confirmBody').innerHTML = html;
    modal.classList.remove('hidden');
    return new Promise((resolve) => {
      const finish = (value) => {
        modal.classList.add('hidden');
        $('confirmAccept').onclick = null;
        $('confirmCancel').onclick = null;
        resolve(value);
      };
      $('confirmAccept').onclick = () => finish(true);
      $('confirmCancel').onclick = () => finish(false);
    });
  }

  async function loginWithGoogle() {
    const button = $('googleLogin');
    button.disabled = true;
    button.textContent = 'Conectando con Google…';
    $('loginMessage').classList.add('hidden');
    try {
      const { error } = await sb.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${location.origin}/admin/` }
      });
      if (error) throw error;
    } catch {
      showLoginError('No se pudo iniciar sesión con Google. Intenta nuevamente.');
      button.disabled = false;
      button.textContent = 'G  Continuar con Google';
    }
  }

  async function logout() {
    await sb.auth.signOut();
    products = [];
    showOnly('loginView');
  }

  async function verifyPrivateAccess() {
    const { data: sessionData } = await sb.auth.getSession();
    const session = sessionData?.session;
    if (!session) {
      showOnly('loginView');
      return false;
    }

    const { data, error } = await sb.rpc('admin_app_is_allowed');
    if (error || data !== true) {
      showOnly('deniedView');
      return false;
    }

    showOnly('appView');
    await loadProducts();
    return true;
  }

  async function loadProducts() {
    const { data, error } = await sb.rpc('admin_app_list_products');
    if (error) {
      toast(error.message === 'ADMIN_APP_FORBIDDEN' ? 'Acceso administrativo rechazado.' : 'No se pudo cargar el catálogo administrativo.');
      return;
    }
    products = Array.isArray(data) ? data : [];
    renderMaintenance();
    renderPrices();
  }

  function groupedAccountGames() {
    const map = new Map();
    products.filter((p) => p.activo === true && p.maintenance_editable === true).forEach((p) => {
      const key = String(p.juego || 'Sin nombre');
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(p);
    });
    return [...map.entries()].sort((a,b) => a[0].localeCompare(b[0],'es',{sensitivity:'base'}));
  }

  function renderMaintenance() {
    const host = $('maintenanceList');
    const groups = groupedAccountGames();
    host.innerHTML = groups.length ? groups.map(([game, items]) => {
      const enabledCount = items.filter((p) => p.mantenimiento === true).length;
      const allMaintenance = enabledCount === items.length && items.length > 0;
      const mixed = enabledCount > 0 && !allMaintenance;
      const ids = items.map((p) => Number(p.id)).filter(Number.isSafeInteger).join(',');
      const badge = allMaintenance ? '<span class="badge warn">EN MANTENIMIENTO</span>' : mixed ? '<span class="badge warn">MIXTO</span>' : '<span class="badge ok">DISPONIBLE</span>';
      const action = allMaintenance ? 'Reactivar juego' : 'Poner en mantenimiento';
      return `<article class="card">
        <div class="card-top"><div><b>${esc(game)}</b><small>${items.length} producto${items.length===1?'':'s'} · Recargas por Cuenta</small></div>${badge}</div>
        <div class="card-actions"><button class="${allMaintenance?'secondary':'primary'}" type="button" data-maintenance-ids="${ids}" data-maintenance-enable="${allMaintenance?'0':'1'}" data-game="${esc(game)}">${action}</button></div>
      </article>`;
    }).join('') : '<article class="card"><small>No hay juegos activos de Recargas por Cuenta.</small></article>';

    host.querySelectorAll('[data-maintenance-ids]').forEach((button) => {
      button.addEventListener('click', () => toggleMaintenance(button));
    });
  }

  async function toggleMaintenance(button) {
    const ids = String(button.dataset.maintenanceIds || '').split(',').map(Number).filter((id) => Number.isSafeInteger(id) && id > 0);
    const enable = button.dataset.maintenanceEnable === '1';
    const game = button.dataset.game || 'este juego';
    if (!ids.length) return;

    const accepted = await confirmAction(
      enable ? 'Poner en mantenimiento' : 'Reactivar juego',
      `<p><b>${esc(game)}</b></p><p>${enable ? 'Los productos seguirán visibles, pero no podrán comprarse hasta que los reactives.' : 'Los productos volverán a poder comprarse inmediatamente.'}</p>`
    );
    if (!accepted) return;

    button.disabled = true;
    try {
      const { data, error } = await sb.rpc('admin_app_set_account_game_maintenance', {
        p_product_ids: ids,
        p_enabled: enable,
        p_message: enable ? DEFAULT_MAINTENANCE_MESSAGE : null
      });
      if (error || !data?.ok) throw error || new Error('UPDATE_FAILED');
      await loadProducts();
      toast(enable ? `${game}: mantenimiento activado.` : `${game}: compras reactivadas.`);
    } catch (error) {
      toast(error?.message === 'ADMIN_APP_FORBIDDEN' ? 'Acceso rechazado.' : 'No se pudo cambiar el mantenimiento.');
      button.disabled = false;
    }
  }

  function matchesSearch(product, query) {
    if (!query) return true;
    const text = `${product.juego} ${product.paquete} ${product.categoria}`.toLowerCase();
    return text.includes(query.toLowerCase());
  }

  function renderPrices() {
    const host = $('priceList');
    const query = $('priceSearch')?.value.trim() || '';
    const list = products
      .filter((p) => p.activo === true)
      .filter((p) => activeFilter === 'all' || p.price_editable === true)
      .filter((p) => matchesSearch(p, query));

    host.innerHTML = list.length ? list.map((p) => {
      const editable = p.price_editable === true;
      const badge = editable ? '<span class="badge ok">EDITABLE</span>' : '<span class="badge lock">PROTEGIDO</span>';
      const reason = editable ? 'Precio fijo administrable' : (String(p.juego).toLowerCase().startsWith('mobile legends') && String(p.paquete).toLowerCase().includes('pase semanal')) ? 'Regla de precio protegida' : 'Precio gestionado por proveedor o fórmula';
      return `<article class="card">
        <div class="card-top"><div><b>${esc(p.juego)}</b><small>${esc(p.paquete)} · ${esc(p.categoria)}</small><small>${esc(reason)}</small></div>${badge}</div>
        <div class="card-actions"><input type="number" min="0.50" max="5000" step="0.01" inputmode="decimal" value="${Number(p.precio).toFixed(2)}" ${editable?'':'disabled'} aria-label="Nuevo precio de ${esc(p.juego)} ${esc(p.paquete)}"><button class="${editable?'primary':'secondary'}" type="button" data-price-id="${p.id}" ${editable?'':'disabled'}>${editable?'Guardar precio':'Bloqueado'}</button></div>
      </article>`;
    }).join('') : '<article class="card"><small>No hay productos que coincidan con este filtro.</small></article>';

    host.querySelectorAll('[data-price-id]').forEach((button) => button.addEventListener('click', () => savePrice(button)));
  }

  async function savePrice(button) {
    const id = Number(button.dataset.priceId);
    const product = products.find((p) => Number(p.id) === id);
    const input = button.parentElement?.querySelector('input');
    const next = Number(input?.value);
    if (!product || product.price_editable !== true || !Number.isFinite(next) || next < 0.50 || next > 5000) {
      toast('Escribe un precio válido entre Bs 0,50 y Bs 5.000.');
      return;
    }

    const old = Number(product.precio);
    if (Math.abs(old - next) < 0.001) {
      toast('El precio nuevo es igual al actual.');
      return;
    }

    const accepted = await confirmAction('Confirmar cambio de precio', `<p><b>${esc(product.juego)} — ${esc(product.paquete)}</b></p><p><span class="price-change"><span class="old">${money(old)}</span><span class="new">→ ${money(next)}</span></span></p><p>El cambio se aplicará a la tienda después de confirmar.</p>`);
    if (!accepted) return;

    button.disabled = true;
    try {
      const { data, error } = await sb.rpc('admin_app_set_fixed_price', { p_product_id: id, p_new_price: next });
      if (error || !data?.ok) throw error || new Error('UPDATE_FAILED');
      await loadProducts();
      toast(`${product.juego}: precio actualizado a ${money(next)}.`);
    } catch (error) {
      const map = {
        ADMIN_APP_FORBIDDEN: 'Acceso administrativo rechazado.',
        PROVIDER_MANAGED_PRICE: 'Este precio está gestionado por proveedor o fórmula.',
        PRICE_RULE_MANAGED: 'Este producto tiene una regla de precio protegida.',
        INVALID_PRICE: 'El precio no es válido.'
      };
      toast(map[error?.message] || 'No se pudo guardar el precio.');
      button.disabled = false;
    }
  }

  async function loadHistory() {
    const host = $('historyList');
    host.innerHTML = '<article class="card"><small>Cargando historial…</small></article>';
    const { data, error } = await sb.rpc('admin_app_price_history', { p_limit: 50 });
    if (error) {
      host.innerHTML = '<article class="card"><small>No se pudo cargar el historial.</small></article>';
      return;
    }
    const rows = Array.isArray(data) ? data : [];
    host.innerHTML = rows.length ? rows.map((row) => `<article class="card history-row"><div><b>${esc(row.juego)}</b><small>${esc(row.paquete)}</small><small>${esc(fmtDate(row.changed_at))}</small></div><div class="price-change"><span class="old">${money(row.old_price)}</span><span class="new">${money(row.new_price)}</span></div></article>`).join('') : '<article class="card"><small>Aún no hay cambios hechos desde esta app.</small></article>';
  }

  function selectTab(name) {
    document.querySelectorAll('[data-tab]').forEach((button) => button.classList.toggle('active', button.dataset.tab === name));
    $('maintenancePanel').classList.toggle('hidden', name !== 'maintenance');
    $('pricesPanel').classList.toggle('hidden', name !== 'prices');
    $('historyPanel').classList.toggle('hidden', name !== 'history');
    if (name === 'history') loadHistory();
  }

  function bindUi() {
    $('googleLogin').addEventListener('click', loginWithGoogle);
    $('logoutButton').addEventListener('click', logout);
    $('deniedLogout').addEventListener('click', logout);
    document.querySelectorAll('[data-tab]').forEach((button) => button.addEventListener('click', () => selectTab(button.dataset.tab)));
    document.querySelectorAll('[data-refresh]').forEach((button) => button.addEventListener('click', async () => {
      if (button.dataset.refresh === 'history') await loadHistory();
      else await loadProducts();
      toast('Datos actualizados.');
    }));
    $('priceSearch').addEventListener('input', renderPrices);
    $('priceFilters').querySelectorAll('[data-filter]').forEach((button) => button.addEventListener('click', () => {
      activeFilter = button.dataset.filter;
      $('priceFilters').querySelectorAll('[data-filter]').forEach((item) => item.classList.toggle('active', item === button));
      renderPrices();
    }));
  }

  async function boot() {
    bindUi();
    if ('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js?v=20260826-r88').catch(() => {});
    try {
      await verifyPrivateAccess();
      sb.auth.onAuthStateChange((_event, session) => {
        setTimeout(() => {
          if (!session) showOnly('loginView');
          else verifyPrivateAccess().catch(() => showOnly('deniedView'));
        }, 0);
      });
    } catch {
      showOnly('loginView');
      showLoginError('No se pudo comprobar la sesión. Revisa tu conexión e intenta nuevamente.');
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, {once:true});
  else boot();
})();