/* THE FRENCH STORE — Admin-only manual final prices for Streaming.
   Isolated from game topups, Gift Cards, provider costs and MLBB pricing rules.
   Security is enforced again in Supabase by admin_update_streaming_price(). */
(() => {
  'use strict';

  const previousLoadAdmin = loadAdmin;

  function adminContent() {
    return document.getElementById('adminContent');
  }

  function errorMessage(error) {
    const raw = String(error?.message || error || '');
    if (raw.includes('AUTH_REQUIRED')) return 'Tu sesión venció. Inicia sesión nuevamente.';
    if (raw.includes('ADMIN_REQUIRED')) return 'Esta función está disponible únicamente para administradores.';
    if (raw.includes('STREAMING_ONLY')) return 'Solo se pueden editar productos de la categoría Streaming.';
    if (raw.includes('INVALID_STREAMING_PRICE')) return 'Usa un precio válido entre Bs 0,50 y Bs 5.000,00.';
    if (raw.includes('PRODUCT_NOT_FOUND')) return 'El producto ya no existe.';
    return 'No se pudo guardar el precio. Intenta nuevamente.';
  }

  function ensureStreamingTab() {
    const tabs = document.querySelector('#view-admin .admin-tabs');
    if (!tabs) return null;
    let button = tabs.querySelector('[data-admin-tab="streaming"]');
    if (button) return button;

    button = document.createElement('button');
    button.type = 'button';
    button.dataset.adminTab = 'streaming';
    button.textContent = 'Streaming';
    button.setAttribute('aria-label', 'Editar precios de Streaming');
    button.onclick = async () => {
      if (!admin) return;
      adminTab = 'streaming';
      tabs.querySelectorAll('[data-admin-tab]').forEach((item) => item.classList.toggle('active', item === button));
      await loadAdmin();
    };
    tabs.appendChild(button);
    return button;
  }

  function priceRow(product) {
    const id = String(product.id);
    const current = Number(product.precio || 0);
    return `<div class="record streaming-price-record" data-streaming-product="${esc(id)}">
      <div class="record-top">
        <div>
          <b>${esc(product.juego)} · ${money(current)}</b>
          <small>${esc(product.paquete || 'Streaming')} · precio final manual en Bs</small>
        </div>
        <span class="status ok">Manual</span>
      </div>
      <div class="record-meta">
        <span>Precio visible actual: <b data-streaming-current>${money(current)}</b></span>
      </div>
      <div class="input-row" style="margin-top:10px">
        <input
          type="number"
          inputmode="decimal"
          min="0.50"
          max="5000"
          step="0.01"
          value="${esc(current.toFixed(2))}"
          aria-label="Nuevo precio de ${esc(product.juego)}"
          data-streaming-price-input="${esc(id)}">
        <button type="button" class="primary-btn" data-streaming-price-save="${esc(id)}">Guardar precio</button>
      </div>
      <div class="notice hidden" data-streaming-price-message="${esc(id)}" role="status" aria-live="polite"></div>
    </div>`;
  }

  function showRowMessage(id, message, type) {
    const box = document.querySelector(`[data-streaming-price-message="${CSS.escape(String(id))}"]`);
    if (!box) return;
    box.textContent = message;
    box.className = `notice ${type || 'success'}`;
    box.classList.remove('hidden');
  }

  async function saveStreamingPrice(id, button) {
    if (!admin) return;
    const input = document.querySelector(`[data-streaming-price-input="${CSS.escape(String(id))}"]`);
    const value = Number(input?.value);
    if (!Number.isFinite(value) || value < 0.50 || value > 5000) {
      showRowMessage(id, 'Usa un precio válido entre Bs 0,50 y Bs 5.000,00.', 'error');
      return;
    }

    const oldText = button.textContent;
    button.disabled = true;
    button.textContent = 'Guardando…';
    try {
      const { data, error } = await sb.rpc('admin_update_streaming_price', {
        p_product_id: Number(id),
        p_sale_price: Number(value.toFixed(2))
      });
      if (error) {
        showRowMessage(id, errorMessage(error), 'error');
        return;
      }
      const newPrice = Number(data?.new_price ?? value);
      if (input) input.value = newPrice.toFixed(2);
      const row = button.closest('[data-streaming-product]');
      const current = row?.querySelector('[data-streaming-current]');
      if (current) current.textContent = money(newPrice);
      const title = row?.querySelector('.record-top b');
      if (title) title.textContent = `${title.textContent.split(' · ')[0]} · ${money(newPrice)}`;
      showRowMessage(id, `Precio actualizado a ${money(newPrice)}. Los pedidos nuevos usarán este valor.`, 'success');

      // Refresh this browser's public catalog immediately. Other clients receive the
      // new database price on their next catalog load; checkout always recalculates
      // the authoritative price in Supabase.
      if (typeof loadProducts === 'function') await loadProducts().catch(() => {});
    } finally {
      button.disabled = false;
      button.textContent = oldText;
    }
  }

  function bindPriceButtons() {
    adminContent()?.querySelectorAll('[data-streaming-price-save]').forEach((button) => {
      button.onclick = () => saveStreamingPrice(button.dataset.streamingPriceSave, button);
    });
  }

  async function loadStreamingPrices() {
    const content = adminContent();
    if (!content || !admin) return;
    content.innerHTML = '<div class="record"><small>Cargando precios de Streaming…</small></div>';

    const { data, error } = await sb
      .from('productos')
      .select('id,juego,paquete,categoria,precio,precio_venta_fijo,activo,ultima_actualizacion')
      .eq('categoria', 'Streaming')
      .eq('activo', true)
      .order('juego', { ascending: true });

    if (error) {
      content.innerHTML = `<div class="notice error">${esc(errorMessage(error))}</div>`;
      return;
    }

    content.innerHTML = `<div class="record">
      <b>Precios manuales de Streaming</b>
      <small>Define aquí el precio final que verá el cliente. No modifica costos de proveedor ni reglas de precios de otras categorías.</small>
    </div>${(data || []).map(priceRow).join('') || empty('No hay productos de Streaming activos.')}`;
    bindPriceButtons();
  }

  loadAdmin = async function streamingAwareLoadAdmin() {
    if (!admin) return;
    if (adminTab !== 'streaming') return previousLoadAdmin();
    return loadStreamingPrices();
  };

  // refreshAdmin was bound before lazy Admin modules existed, so rebind it to the
  // final composed loadAdmin function now that this module is active.
  const refresh = document.getElementById('refreshAdmin');
  if (refresh) refresh.onclick = () => loadAdmin();
  ensureStreamingTab();
})();
