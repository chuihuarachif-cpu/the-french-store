/* THE FRENCH STORE — Admin-only manual final prices for Streaming.
   Isolated from provider costs and every other pricing category/rule.
   Security and current product identity are enforced again in Supabase. */
(() => {
  'use strict';

  const previousLoadAdmin = loadAdmin;

  function adminContent() {
    return document.getElementById('adminContent');
  }

  function errorMessage(error) {
    const raw = String(error?.message || error || '');
    if (raw.includes('AUTH_REQUIRED') || raw.includes('JWT')) return 'Tu sesión venció. Inicia sesión nuevamente.';
    if (raw.includes('ADMIN_REQUIRED')) return 'Esta función está disponible únicamente para administradores.';
    if (raw.includes('STREAMING_ONLY')) return 'Solo se pueden editar productos de la categoría Streaming.';
    if (raw.includes('INVALID_STREAMING_PRICE')) return 'Usa un precio válido entre Bs 0,50 y Bs 5.000,00.';
    if (raw.includes('INVALID_STREAMING_IDENTITY')) return 'No pudimos identificar este producto de Streaming. Recarga la lista.';
    if (raw.includes('STREAMING_IDENTITY_AMBIGUOUS')) return 'Hay más de un producto activo con el mismo nombre. No se guardó ningún cambio.';
    if (raw.includes('PRODUCT_NOT_FOUND')) return 'La lista estaba desactualizada. Ya la recargamos; vuelve a guardar el precio.';
    if (raw.includes('Failed to fetch') || raw.includes('NetworkError')) return 'No hubo conexión con el servidor. Revisa tu conexión y vuelve a intentar.';
    return 'No se pudo guardar el precio. La lista se recargará para evitar datos desactualizados.';
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
    return `<div class="record streaming-price-record" data-streaming-product="${esc(id)}" data-streaming-game="${esc(product.juego || '')}" data-streaming-package="${esc(product.paquete || '')}">
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

  async function reloadStreamingWithNotice(message) {
    await loadStreamingPrices();
    const content = adminContent();
    if (!content) return;
    content.insertAdjacentHTML('afterbegin', `<div class="notice error" role="status">${esc(message)}</div>`);
  }

  async function saveStreamingPrice(id, button) {
    if (!admin) return;
    const input = document.querySelector(`[data-streaming-price-input="${CSS.escape(String(id))}"]`);
    const value = Number(input?.value);
    if (!Number.isFinite(value) || value < 0.50 || value > 5000) {
      showRowMessage(id, 'Usa un precio válido entre Bs 0,50 y Bs 5.000,00.', 'error');
      return;
    }

    const row = button.closest('[data-streaming-product]');
    const game = String(row?.dataset.streamingGame || '').trim();
    const pack = String(row?.dataset.streamingPackage || '').trim();
    if (!game || !pack) {
      await reloadStreamingWithNotice('No pudimos identificar este producto. Ya recargamos la lista; vuelve a intentarlo.');
      return;
    }

    const oldText = button.textContent;
    button.disabled = true;
    button.textContent = 'Guardando…';
    try {
      const { data, error } = await sb.rpc('admin_update_streaming_price_by_identity', {
        p_game: game,
        p_package: pack,
        p_sale_price: Number(value.toFixed(2))
      });

      if (error) {
        const message = errorMessage(error);
        if (String(error?.message || error).includes('PRODUCT_NOT_FOUND') ||
            String(error?.message || error).includes('STREAMING_IDENTITY_AMBIGUOUS')) {
          await reloadStreamingWithNotice(message);
          return;
        }
        showRowMessage(id, message, 'error');
        return;
      }

      const newPrice = Number(data?.new_price ?? value);
      if (input) input.value = newPrice.toFixed(2);
      const current = row?.querySelector('[data-streaming-current]');
      if (current) current.textContent = money(newPrice);
      const title = row?.querySelector('.record-top b');
      if (title) title.textContent = `${game} · ${money(newPrice)}`;
      showRowMessage(id, `Precio actualizado a ${money(newPrice)}. Los pedidos nuevos usarán este valor.`, 'success');

      if (typeof loadProducts === 'function') await loadProducts().catch(() => {});
    } catch (error) {
      const message = errorMessage(error);
      showRowMessage(id, message, 'error');
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

  const refresh = document.getElementById('refreshAdmin');
  if (refresh) refresh.onclick = () => loadAdmin();
  ensureStreamingTab();
})();
