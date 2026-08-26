/* THE FRENCH STORE — R57 Admin-only manual final prices for Streaming.
   Isolated from provider costs and every other pricing category/rule.
   Security is enforced again in Supabase by admin_update_streaming_price_v2(). */
(() => {
  'use strict';

  const previousLoadAdmin = loadAdmin;

  const adminContent = () => document.getElementById('adminContent');

  function errorMessage(error) {
    const raw = String(error?.message || error || '');
    const code = String(error?.code || '');
    if (raw.includes('AUTH_REQUIRED') || raw.includes('JWT')) return 'Tu sesión venció. Inicia sesión nuevamente.';
    if (raw.includes('ADMIN_REQUIRED')) return 'Esta función está disponible únicamente para administradores.';
    if (raw.includes('STREAMING_ONLY')) return 'Solo se pueden editar productos de la categoría Streaming.';
    if (raw.includes('INVALID_STREAMING_PRICE')) return 'Usa un precio válido entre Bs 0,50 y Bs 5.000,00.';
    if (raw.includes('PRODUCT_NOT_FOUND')) return 'Ese producto ya no existe o cambió. Recarga la lista e inténtalo otra vez.';
    if (code === 'PGRST202' || /schema cache|Could not find the function/i.test(raw)) return 'El servidor está actualizando sus funciones. Recarga la página e inténtalo nuevamente.';
    if (raw.includes('Failed to fetch') || raw.includes('NetworkError')) return 'No hubo conexión con el servidor. Revisa tu conexión y vuelve a intentar.';
    return 'No se pudo guardar el precio. No se realizó ningún cambio.';
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
    const id = Number(product.id);
    const current = Number(product.precio || 0);
    return `<div class="record streaming-price-record" data-streaming-product="${esc(String(id))}">
      <div class="record-top"><div><b>${esc(product.juego)} · ${money(current)}</b><small>${esc(product.paquete || 'Streaming')} · precio final manual en Bs</small></div><span class="status ok">Fijo</span></div>
      <div class="record-meta"><span>Precio visible actual: <b data-streaming-current>${money(current)}</b></span></div>
      <div class="input-row" style="margin-top:10px">
        <input type="number" inputmode="decimal" min="0.50" max="5000" step="0.01" value="${esc(current.toFixed(2))}" aria-label="Nuevo precio de ${esc(product.juego)}" data-streaming-price-input>
        <button type="button" class="primary-btn" data-streaming-price-save>Guardar precio</button>
      </div>
      <div class="notice hidden" data-streaming-price-message role="status" aria-live="polite"></div>
    </div>`;
  }

  function rowMessage(row, message, type = 'success') {
    const box = row?.querySelector('[data-streaming-price-message]');
    if (!box) return;
    box.textContent = message;
    box.className = `notice ${type}`;
    box.classList.remove('hidden');
  }

  async function callPriceRpc(productId, value) {
    let result = await sb.rpc('admin_update_streaming_price_v2', {
      p_product_id: productId,
      p_sale_price: Number(value.toFixed(2))
    });
    if (result.error) {
      const raw = String(result.error?.message || result.error || '');
      const code = String(result.error?.code || '');
      if (code === 'PGRST202' || /Could not find the function|schema cache/i.test(raw)) {
        result = await sb.rpc('admin_update_streaming_price', {
          p_product_id: productId,
          p_sale_price: Number(value.toFixed(2))
        });
      }
    }
    return result;
  }

  async function saveStreamingPrice(button) {
    const row = button?.closest('[data-streaming-product]');
    if (!admin || !row) return;

    const productId = Number(row.dataset.streamingProduct);
    const input = row.querySelector('[data-streaming-price-input]');
    const value = Number(input?.value);
    if (!Number.isSafeInteger(productId) || productId <= 0) {
      rowMessage(row, 'No pudimos identificar este producto. Recarga la lista.', 'error');
      return;
    }
    if (!Number.isFinite(value) || value < 0.50 || value > 5000) {
      rowMessage(row, 'Usa un precio válido entre Bs 0,50 y Bs 5.000,00.', 'error');
      return;
    }

    const oldText = button.textContent;
    button.disabled = true;
    button.textContent = 'Guardando…';
    try {
      const { data, error } = await callPriceRpc(productId, value);
      if (error) {
        rowMessage(row, errorMessage(error), 'error');
        return;
      }
      const newPrice = Number(data?.new_price ?? value);
      if (input) input.value = newPrice.toFixed(2);
      const current = row.querySelector('[data-streaming-current]');
      if (current) current.textContent = money(newPrice);
      const title = row.querySelector('.record-top b');
      if (title) title.textContent = `${String(data?.product_name || '').split(' — ')[0] || title.textContent.split(' · ')[0]} · ${money(newPrice)}`;
      rowMessage(row, `Precio actualizado a ${money(newPrice)}. Los pedidos nuevos ya usarán este valor.`, 'success');
      if (typeof loadProducts === 'function') await loadProducts().catch(() => {});
    } catch (error) {
      rowMessage(row, errorMessage(error), 'error');
    } finally {
      button.disabled = false;
      button.textContent = oldText;
    }
  }

  function bindPriceButtons() {
    adminContent()?.querySelectorAll('[data-streaming-price-save]').forEach((button) => {
      button.onclick = () => saveStreamingPrice(button);
    });
  }

  async function loadStreamingPrices() {
    const content = adminContent();
    if (!content || !admin) return;
    content.innerHTML = '<div class="record"><small>Cargando precios fijos…</small></div>';
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
    content.innerHTML = `<div class="record"><b>Precios fijos de Streaming</b><small>El valor que guardes aquí es el precio final en Bs. No modifica costos de proveedor ni precios de otras categorías.</small></div>${(data || []).map(priceRow).join('') || empty('No hay productos de Streaming activos.')}`;
    bindPriceButtons();
  }

  loadAdmin = async function streamingAwareLoadAdmin() {
    if (!admin) return;
    if (adminTab !== 'streaming') return previousLoadAdmin();
    return loadStreamingPrices();
  };

  const refresh = document.getElementById('refreshAdmin');
  if (refresh) refresh.onclick = () => loadAdmin();
  ensureStreamingTab();
})();
