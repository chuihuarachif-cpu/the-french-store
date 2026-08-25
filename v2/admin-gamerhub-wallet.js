/* THE FRENCH STORE — R51 GamerHub wallet cost protection.
   Admin-only UI. It records accounting inventory only; it never moves provider money,
   never purchases provider products, and never exposes provider credentials. */
(() => {
  'use strict';

  const previousLoadAdmin = loadAdmin;

  const content = () => document.getElementById('adminContent');
  const num = (value) => Number(value || 0);
  const rate = (value) => Number.isFinite(Number(value)) ? `Bs ${Number(value).toFixed(2)}` : '—';
  const qty = (value) => Number(value || 0).toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 4 });

  function errorText(error) {
    const raw = String(error?.message || error || '');
    if (raw.includes('AUTH_REQUIRED')) return 'Tu sesión venció. Inicia sesión nuevamente.';
    if (raw.includes('ADMIN_REQUIRED')) return 'Solo un administrador puede modificar el saldo protegido de GamerHub.';
    if (raw.includes('INVALID_GAMERHUB_AMOUNT')) return 'Ingresa una cantidad válida mayor a 0.';
    if (raw.includes('INVALID_GAMERHUB_RATE')) return 'Ingresa un costo válido en Bs por USDT/USD.';
    if (raw.includes('GAMERHUB_CONSUME_EXCEEDS_BALANCE')) return 'El consumo no puede superar el saldo protegido registrado.';
    if (raw.includes('GAMERHUB_BALANCE_NOT_FOUND')) return 'Todavía no existe saldo protegido de GamerHub.';
    return 'No se pudo actualizar el saldo protegido de GamerHub.';
  }

  function ensureTab() {
    const tabs = document.querySelector('#view-admin .admin-tabs');
    if (!tabs) return null;
    let button = tabs.querySelector('[data-admin-tab="gamerhub"]');
    if (button) return button;
    button = document.createElement('button');
    button.type = 'button';
    button.dataset.adminTab = 'gamerhub';
    button.textContent = 'GamerHub';
    button.setAttribute('aria-label', 'Administrar saldo y costo de GamerHub');
    button.onclick = async () => {
      if (!admin) return;
      adminTab = 'gamerhub';
      tabs.querySelectorAll('[data-admin-tab]').forEach((item) => item.classList.toggle('active', item === button));
      await loadAdmin();
    };
    tabs.appendChild(button);
    return button;
  }

  function historyHtml(history) {
    const rows = Array.isArray(history) ? history : [];
    if (!rows.length) return '<div class="record"><small>Aún no hay movimientos registrados para GamerHub.</small></div>';
    return rows.map((item) => {
      const purchase = item.operation === 'PURCHASE';
      const sign = purchase ? '+' : '−';
      const title = purchase ? 'Carga registrada' : 'Consumo registrado';
      const total = Number(item.total_bob || 0);
      return `<div class="record">
        <div class="record-top"><div><b>${title} · ${sign}${qty(item.amount_usdt)} USDT</b><small>${dateFmt(item.created_at)}</small></div><span class="status ${purchase ? 'ok' : 'warn'}">${purchase ? 'Entrada' : 'Salida'}</span></div>
        <div class="record-meta"><span>Costo usado: ${rate(item.rate_bob)}/USDT</span>${total > 0 ? `<span>Total contable: ${money(total)}</span>` : ''}${item.note ? `<span>${esc(item.note)}</span>` : ''}</div>
      </div>`;
    }).join('');
  }

  function renderState(state) {
    const box = content();
    if (!box) return;
    const balance = num(state?.balance_usdt);
    const avg = state?.average_rate_bob;
    const raw = state?.binance_raw_bob;
    const effective = state?.effective_rate_bob;
    const protectedNow = state?.protection_active === true;
    const totalCost = num(state?.cost_total_bob);

    box.innerHTML = `<div class="record">
      <div class="record-top"><div><b>GamerHub Wallet · protección de costo</b><small>Protege el saldo comprado si Binance baja. No añade los Bs 0,25 usados en otras reglas.</small></div><span class="status ${protectedNow ? 'warn' : 'ok'}">${protectedNow ? 'Protección activa' : 'Mercado'}</span></div>
      <div class="record-meta">
        <span>Saldo protegido: <b>${qty(balance)} USDT</b></span>
        <span>Costo acumulado: <b>${money(totalCost)}</b></span>
        <span>Costo medio real: <b>${rate(avg)}/USDT</b></span>
        <span>Binance RAW actual: <b>${rate(raw)}/USDT</b></span>
        <span>Tasa usada para GamerHub: <b>${rate(effective)}/USDT</b></span>
      </div>
      <small>Regla: mientras quede saldo registrado, GamerHub usa el mayor valor entre Binance RAW y tu costo medio real. Si Binance sube, sigue Binance; si baja por debajo de tu costo, conserva tu costo como piso.</small>
    </div>

    <div class="record">
      <b>Registrar carga a GamerHub</b>
      <small>Escribe lo que realmente quedó acreditado y cuánto pagaste por cada USDT/USD. Esto solo registra el costo; no mueve dinero.</small>
      <label style="display:block;margin-top:10px">USDT/USD acreditados
        <input type="number" min="0.01" max="100000" step="0.01" inputmode="decimal" placeholder="Ej. 50" data-gh-add-amount>
      </label>
      <label style="display:block;margin-top:10px">Costo real por USDT en Bs
        <input type="number" min="1" max="100" step="0.01" inputmode="decimal" placeholder="Ej. 11.20" data-gh-add-rate>
      </label>
      <label style="display:block;margin-top:10px">Nota opcional
        <input type="text" maxlength="120" placeholder="Ej. Carga GamerHub agosto" data-gh-add-note>
      </label>
      <div class="record-meta" style="margin-top:10px"><span data-gh-add-total>Costo total: —</span></div>
      <div class="admin-actions"><button type="button" class="primary-btn" data-gh-add>Registrar carga</button></div>
      <div class="notice hidden" data-gh-message role="status" aria-live="polite"></div>
    </div>

    <div class="record">
      <b>Registrar consumo del saldo</b>
      <small>Úsalo cuando el saldo de GamerHub se haya gastado y aún no exista descuento automático del inventario contable.</small>
      <div class="input-row" style="margin-top:10px"><input type="number" min="0.01" max="100000" step="0.01" inputmode="decimal" placeholder="USDT consumidos" data-gh-consume-amount><button type="button" data-gh-consume>Registrar consumo</button></div>
    </div>

    <div class="record"><b>Movimientos recientes</b><small>Historial contable del saldo protegido de GamerHub.</small></div>
    ${historyHtml(state?.history)}`;

    bindActions();
  }

  function showMessage(message, type = 'success') {
    const el = content()?.querySelector('[data-gh-message]');
    if (!el) return;
    el.textContent = message;
    el.className = `notice ${type}`;
    el.classList.remove('hidden');
  }

  function updateTotal() {
    const box = content();
    const amount = num(box?.querySelector('[data-gh-add-amount]')?.value);
    const acquisitionRate = num(box?.querySelector('[data-gh-add-rate]')?.value);
    const out = box?.querySelector('[data-gh-add-total]');
    if (!out) return;
    out.textContent = amount > 0 && acquisitionRate > 0 ? `Costo total: ${money(amount * acquisitionRate)}` : 'Costo total: —';
  }

  async function loadState() {
    const box = content();
    if (!box || !admin) return;
    box.innerHTML = '<div class="record"><small>Cargando protección de GamerHub…</small></div>';
    const { data, error } = await sb.rpc('admin_gamerhub_wallet_state');
    if (error) {
      box.innerHTML = `<div class="notice error">${esc(errorText(error))}</div>`;
      return;
    }
    renderState(data || {});
  }

  async function addBalance(button) {
    const box = content();
    const amount = num(box?.querySelector('[data-gh-add-amount]')?.value);
    const acquisitionRate = num(box?.querySelector('[data-gh-add-rate]')?.value);
    const note = String(box?.querySelector('[data-gh-add-note]')?.value || '').trim() || null;
    if (!(amount > 0) || !(acquisitionRate >= 1)) {
      showMessage('Completa una cantidad y un costo real válidos.', 'error');
      return;
    }
    const total = amount * acquisitionRate;
    if (!confirm(`Registrar ${qty(amount)} USDT a ${rate(acquisitionRate)} por USDT (${money(total)} en total)?`)) return;
    const old = button.textContent;
    button.disabled = true;
    button.textContent = 'Registrando…';
    const { error } = await sb.rpc('admin_gamerhub_wallet_add', { p_usdt: amount, p_rate_bob: acquisitionRate, p_note: note });
    button.disabled = false;
    button.textContent = old;
    if (error) {
      showMessage(errorText(error), 'error');
      return;
    }
    await loadState();
    showMessage('Carga registrada. El piso de costo de GamerHub ya fue recalculado.', 'success');
    if (typeof loadProducts === 'function') await loadProducts().catch(() => {});
  }

  async function consumeBalance(button) {
    const box = content();
    const amount = num(box?.querySelector('[data-gh-consume-amount]')?.value);
    if (!(amount > 0)) return;
    if (!confirm(`Registrar consumo de ${qty(amount)} USDT del saldo protegido de GamerHub?`)) return;
    const old = button.textContent;
    button.disabled = true;
    button.textContent = 'Registrando…';
    const { error } = await sb.rpc('admin_gamerhub_wallet_consume', { p_usdt: amount, p_note: 'Consumo registrado desde Admin' });
    button.disabled = false;
    button.textContent = old;
    if (error) {
      showMessage(errorText(error), 'error');
      return;
    }
    await loadState();
    showMessage('Consumo registrado y protección recalculada.', 'success');
    if (typeof loadProducts === 'function') await loadProducts().catch(() => {});
  }

  function bindActions() {
    const box = content();
    box?.querySelector('[data-gh-add-amount]')?.addEventListener('input', updateTotal);
    box?.querySelector('[data-gh-add-rate]')?.addEventListener('input', updateTotal);
    const add = box?.querySelector('[data-gh-add]');
    if (add) add.onclick = () => addBalance(add);
    const consume = box?.querySelector('[data-gh-consume]');
    if (consume) consume.onclick = () => consumeBalance(consume);
  }

  loadAdmin = async function gamerhubAwareLoadAdmin() {
    if (!admin) return;
    if (adminTab !== 'gamerhub') return previousLoadAdmin();
    return loadState();
  };

  const refresh = document.getElementById('refreshAdmin');
  if (refresh) refresh.onclick = () => loadAdmin();
  ensureTab();
})();
