/* THE FRENCH STORE — R57 GamerHub USDT inventory cost protection.
   Admin-only UI. Records accounting inventory; it never moves provider money,
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
    if (raw.includes('ADMIN_REQUIRED')) return 'Solo un administrador puede modificar el inventario USDT de GamerHub.';
    if (raw.includes('INVALID_GAMERHUB_AMOUNT')) return 'Ingresa una cantidad válida mayor a 0.';
    if (raw.includes('INVALID_GAMERHUB_RATE')) return 'Ingresa un costo válido en Bs por USDT.';
    if (raw.includes('GAMERHUB_CONSUME_EXCEEDS_BALANCE')) return 'El ajuste no puede superar el saldo registrado.';
    if (raw.includes('GAMERHUB_BALANCE_NOT_FOUND')) return 'Todavía no existe inventario registrado de GamerHub.';
    return 'No se pudo actualizar el inventario USDT de GamerHub.';
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
    button.setAttribute('aria-label', 'Administrar inventario USDT de GamerHub');
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
      const title = purchase ? 'USDT registrados' : (String(item.note || '').startsWith('AUTO') ? 'Consumo automático' : 'Ajuste/consumo');
      const total = Number(item.total_bob || 0);
      return `<div class="record">
        <div class="record-top"><div><b>${title} · ${sign}${qty(item.amount_usdt)} USDT</b><small>${dateFmt(item.created_at)}</small></div><span class="status ${purchase ? 'ok' : 'warn'}">${purchase ? 'Entrada' : 'Salida'}</span></div>
        <div class="record-meta"><span>Costo contable: ${rate(item.rate_bob)}/USDT</span>${total > 0 ? `<span>Total: ${money(total)}</span>` : ''}${item.note ? `<span>${esc(item.note)}</span>` : ''}</div>
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
      <div class="record-top"><div><b>Inventario USDT · GamerHub</b><small>Las recargas automáticas de GamerHub usan el mayor valor entre Binance RAW y tu costo medio real. No se añaden Bs 0,25 aquí.</small></div><span class="status ok">Auto consumo activo</span></div>
      <div class="record-meta">
        <span>Saldo registrado: <b>${qty(balance)} USDT</b></span>
        <span>Costo acumulado restante: <b>${money(totalCost)}</b></span>
        <span>Costo medio real: <b>${rate(avg)}/USDT</b></span>
        <span>Binance RAW actual: <b>${rate(raw)}/USDT</b></span>
        <span>Tasa usada por GamerHub: <b>${rate(effective)}/USDT</b></span>
      </div>
      <small>${protectedNow ? 'Tu costo medio está por encima de Binance; se mantiene como piso para no vender ese inventario por debajo de lo que te costó.' : 'Binance está igual o por encima de tu costo medio; se usa el mercado actual.'} Cada compra GamerHub que termine SUCCEEDED descuenta automáticamente del inventario el USD cobrado por el proveedor.</small>
    </div>

    <div class="record">
      <b>Registrar compra de USDT</b>
      <small>Registra solo USDT realmente comprados/acreditados y su costo real. El promedio se calcula automáticamente.</small>
      <label style="display:block;margin-top:10px">USDT comprados
        <input type="number" min="0.01" max="100000" step="0.01" inputmode="decimal" placeholder="Ej. 50" data-gh-add-amount>
      </label>
      <label style="display:block;margin-top:10px">Precio real pagado por USDT (Bs)
        <input type="number" min="1" max="100" step="0.01" inputmode="decimal" placeholder="Ej. 11.62" data-gh-add-rate>
      </label>
      <label style="display:block;margin-top:10px">Nota opcional
        <input type="text" maxlength="120" placeholder="Ej. Binance P2P agosto" data-gh-add-note>
      </label>
      <div class="record-meta" style="margin-top:10px"><span data-gh-add-total>Costo total: —</span></div>
      <div class="admin-actions"><button type="button" class="primary-btn" data-gh-add>Registrar USDT</button></div>
      <div class="notice hidden" data-gh-message role="status" aria-live="polite"></div>
    </div>

    <div class="record">
      <b>Ajuste manual excepcional</b>
      <small>El consumo normal ya es automático. Usa esto solo para reconciliar una compra hecha manualmente fuera del sistema o corregir el saldo contable contra el saldo real del panel.</small>
      <div class="input-row" style="margin-top:10px"><input type="number" min="0.01" max="100000" step="0.01" inputmode="decimal" placeholder="USDT a descontar" data-gh-consume-amount><button type="button" data-gh-consume>Registrar ajuste</button></div>
    </div>

    <div class="record"><b>Movimientos recientes</b><small>Entradas manuales y consumos automáticos del inventario GamerHub.</small></div>
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
    box.innerHTML = '<div class="record"><small>Cargando inventario GamerHub…</small></div>';
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
      showMessage('Completa la cantidad de USDT y el precio real que pagaste.', 'error');
      return;
    }
    const total = amount * acquisitionRate;
    if (!confirm(`Registrar ${qty(amount)} USDT a ${rate(acquisitionRate)}/USDT (${money(total)} en total)?`)) return;
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
    showMessage('USDT registrados. El costo medio y el piso GamerHub ya fueron recalculados.', 'success');
    if (typeof loadProducts === 'function') await loadProducts().catch(() => {});
  }

  async function consumeBalance(button) {
    const box = content();
    const amount = num(box?.querySelector('[data-gh-consume-amount]')?.value);
    if (!(amount > 0)) return;
    if (!confirm(`¿Registrar un ajuste manual de ${qty(amount)} USDT? El consumo normal de compras automáticas ya no requiere este botón.`)) return;
    const old = button.textContent;
    button.disabled = true;
    button.textContent = 'Registrando…';
    const { error } = await sb.rpc('admin_gamerhub_wallet_consume', { p_usdt: amount, p_note: 'Ajuste manual desde Admin' });
    button.disabled = false;
    button.textContent = old;
    if (error) {
      showMessage(errorText(error), 'error');
      return;
    }
    await loadState();
    showMessage('Ajuste registrado.', 'success');
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
