/* THE FRENCH STORE — R84 per-game maintenance for Recargas por Cuenta.
   Public users can see maintenance state but cannot change it.
   Admin changes are authorized again by Supabase RPC; browser state is never authoritative. */
(() => {
  'use strict';

  const VERSION = 'account-game-maintenance-v1-20260826';
  const ACCOUNT_CATEGORY = 'Recargas por Cuenta';
  const DEFAULT_MESSAGE = 'Temporalmente no disponible. Estamos terminando de habilitar las compras de este juego.';
  let annotateScheduled = false;

  function safeProducts() {
    try { return Array.isArray(inventory) ? inventory : []; } catch { return []; }
  }

  function safeCurrentCategory() {
    try { return String(category || ''); } catch { return ''; }
  }

  function messageFor(product) {
    return String(product?.mantenimiento_mensaje || DEFAULT_MESSAGE);
  }

  function productById(id) {
    const value = Number(id);
    if (!Number.isSafeInteger(value) || value <= 0) return null;
    return safeProducts().find((product) => Number(product?.id) === value) || null;
  }

  function isMaintenance(product) {
    return product?.mantenimiento === true;
  }

  function productsForGame(game, cat = safeCurrentCategory()) {
    if (!game) return [];
    const normalizedGame = String(game).trim();
    return safeProducts().filter((product) =>
      product?.activo === true &&
      String(product?.categoria || '') === cat &&
      String(typeof canonicalGame === 'function' ? canonicalGame(product?.juego) : product?.juego || '').trim() === normalizedGame
    );
  }

  function gameState(game, cat = safeCurrentCategory()) {
    const products = productsForGame(game, cat);
    const maintenance = products.filter(isMaintenance);
    return {
      products,
      allMaintenance: products.length > 0 && maintenance.length === products.length,
      anyMaintenance: maintenance.length > 0,
      message: maintenance.length ? messageFor(maintenance[0]) : DEFAULT_MESSAGE
    };
  }

  function ensureBadge(host, text = '🛠️ En mantenimiento') {
    if (!host) return null;
    let badge = host.querySelector(':scope > .fs-maintenance-badge');
    if (!badge) {
      badge = document.createElement('span');
      badge.className = 'fs-maintenance-badge';
      host.appendChild(badge);
    }
    badge.textContent = text;
    return badge;
  }

  function removeBadge(host) {
    host?.querySelector?.(':scope > .fs-maintenance-badge')?.remove();
  }

  function setAddButtonState(button, product) {
    if (!button || !product) return;
    if (isMaintenance(product)) {
      if (!button.dataset.fsMaintenanceOriginalText) button.dataset.fsMaintenanceOriginalText = button.textContent || '+ Carrito';
      button.dataset.fsMaintenance = '1';
      button.disabled = true;
      button.textContent = 'En mantenimiento';
      button.title = messageFor(product);
      button.setAttribute('aria-disabled', 'true');
    } else if (button.dataset.fsMaintenance === '1') {
      button.disabled = false;
      button.textContent = button.dataset.fsMaintenanceOriginalText || '+ Carrito';
      button.removeAttribute('title');
      button.removeAttribute('aria-disabled');
      delete button.dataset.fsMaintenance;
      delete button.dataset.fsMaintenanceOriginalText;
    }
  }

  function annotatePackages(root = document) {
    root.querySelectorAll?.('[data-add]').forEach((button) => {
      const product = productById(button.dataset.add);
      if (!product) return;
      setAddButtonState(button, product);

      const card = button.closest('.r6-package-card,.package-row');
      const copy = card?.querySelector('.r6-package-copy,.package-name') || card;
      if (isMaintenance(product)) {
        card?.classList.add('fs-maintenance-item');
        ensureBadge(copy);
      } else {
        card?.classList.remove('fs-maintenance-item');
        removeBadge(copy);
      }
    });
  }

  function annotateR6GameCards(root = document) {
    root.querySelectorAll?.('[data-r6-game]').forEach((card) => {
      const game = card.dataset.r6Game || card.querySelector('strong')?.textContent || '';
      const state = gameState(game);
      const body = card.querySelector('.r6-game-card-body') || card;
      card.classList.toggle('fs-game-maintenance', state.allMaintenance);
      if (state.allMaintenance) {
        ensureBadge(body);
        card.title = state.message;
      } else {
        removeBadge(body);
        if (card.classList.contains('fs-game-maintenance') === false) card.removeAttribute('title');
      }
    });
  }

  function annotateLegacyGameCards(root = document) {
    root.querySelectorAll?.('.game-card').forEach((card) => {
      const game = card.querySelector('.game-info b')?.textContent || '';
      const state = gameState(game);
      const info = card.querySelector('.game-info') || card;
      card.classList.toggle('fs-game-maintenance', state.allMaintenance);
      if (state.allMaintenance) ensureBadge(info);
      else removeBadge(info);
    });
  }

  function annotateFeatured(root = document) {
    root.querySelectorAll?.('[data-r6-feature]').forEach((card) => {
      const game = card.dataset.r6Feature || '';
      const cat = card.dataset.r6FeatureCat || '';
      const state = gameState(game, cat);
      const host = card.querySelector('span:nth-of-type(2)') || card;
      card.classList.toggle('fs-game-maintenance', state.allMaintenance);
      if (state.allMaintenance) ensureBadge(host);
      else removeBadge(host);
    });
  }

  function ensureDetailNotice() {
    const detail = document.querySelector('#catalogList .r6-game-detail');
    if (!detail) return;
    const game = detail.querySelector('.r6-hero-copy h3')?.textContent || '';
    const state = gameState(game);
    let notice = detail.querySelector(':scope > .fs-maintenance-notice');
    if (!state.allMaintenance) {
      notice?.remove();
      return;
    }
    if (!notice) {
      notice = document.createElement('div');
      notice.className = 'fs-maintenance-notice';
      const back = detail.querySelector('.r6-back');
      if (back) back.insertAdjacentElement('afterend', notice);
      else detail.prepend(notice);
    }
    notice.innerHTML = `<b>🛠️ Este juego está temporalmente en mantenimiento</b><span>${typeof esc === 'function' ? esc(state.message) : state.message}</span>`;
  }

  function annotateCart(root = document) {
    const cartBox = root.id === 'cartItems' ? root : root.querySelector?.('#cartItems');
    if (!cartBox) return;
    cartBox.querySelectorAll('.record').forEach((record) => {
      const source = record.querySelector('[data-plus],[data-minus],[data-remove]');
      const product = productById(source?.dataset.plus || source?.dataset.minus || source?.dataset.remove);
      if (!product) return;
      record.classList.toggle('fs-cart-maintenance', isMaintenance(product));
    });
  }

  function annotateAll() {
    annotateScheduled = false;
    annotatePackages(document);
    annotateR6GameCards(document);
    annotateLegacyGameCards(document);
    annotateFeatured(document);
    annotateCart(document);
    ensureDetailNotice();
  }

  function scheduleAnnotate() {
    if (annotateScheduled) return;
    annotateScheduled = true;
    requestAnimationFrame(annotateAll);
  }

  function adminTabs() {
    return document.querySelector('#view-admin .admin-tabs');
  }

  function ensureAdminTab() {
    const tabs = adminTabs();
    let button = tabs?.querySelector('[data-admin-tab="maintenance"]') || null;
    let isAdmin = false;
    try { isAdmin = admin === true; } catch {}

    if (!isAdmin) {
      button?.remove();
      return null;
    }
    if (!tabs) return null;
    if (button) return button;

    button = document.createElement('button');
    button.type = 'button';
    button.dataset.adminTab = 'maintenance';
    button.textContent = 'Mantenimiento';
    button.setAttribute('aria-label', 'Administrar mantenimiento por juego');
    button.onclick = async () => {
      if (admin !== true) return;
      adminTab = 'maintenance';
      tabs.querySelectorAll('[data-admin-tab]').forEach((item) => item.classList.toggle('active', item === button));
      await loadAdmin();
    };
    tabs.appendChild(button);
    return button;
  }

  function maintenanceGroups() {
    const items = safeProducts().filter((product) => product?.activo === true && product?.categoria === ACCOUNT_CATEGORY);
    if (typeof productGroups === 'function') return productGroups(items);
    const groups = new Map();
    items.forEach((product) => {
      const game = String(product?.juego || 'Sin nombre');
      if (!groups.has(game)) groups.set(game, []);
      groups.get(game).push(product);
    });
    return [...groups.entries()];
  }

  function maintenanceRow(game, products) {
    const maintenanceCount = products.filter(isMaintenance).length;
    const allMaintenance = products.length > 0 && maintenanceCount === products.length;
    const partial = maintenanceCount > 0 && !allMaintenance;
    const ids = products.map((product) => Number(product.id)).filter((id) => Number.isSafeInteger(id) && id > 0);
    const status = allMaintenance ? 'EN MANTENIMIENTO' : partial ? 'MIXTO' : 'DISPONIBLE';
    const statusClass = allMaintenance ? 'warn' : partial ? 'warn' : 'ok';
    const action = allMaintenance ? 'Reactivar juego' : 'Poner en mantenimiento';
    return `<div class="record fs-maintenance-admin-row">
      <div class="record-top"><div><b>${esc(game)}</b><small>${products.length} producto${products.length===1?'':'s'} de ${ACCOUNT_CATEGORY}</small></div><span class="status ${statusClass}">${status}</span></div>
      <div class="record-meta"><span>${allMaintenance ? esc(messageFor(products.find(isMaintenance))) : partial ? 'Hay productos con estados distintos. El botón unificará todo el juego.' : 'Las compras están habilitadas.'}</span></div>
      <div class="admin-actions"><button type="button" class="${allMaintenance?'secondary-btn':'primary-btn'}" data-fs-maintenance-ids="${ids.join(',')}" data-fs-maintenance-enable="${allMaintenance?'0':'1'}">${action}</button></div>
    </div>`;
  }

  async function toggleMaintenance(button) {
    if (admin !== true || !button) return;
    const ids = String(button.dataset.fsMaintenanceIds || '').split(',').map(Number).filter((id) => Number.isSafeInteger(id) && id > 0);
    const enable = button.dataset.fsMaintenanceEnable === '1';
    if (!ids.length) return;
    const game = button.closest('.record')?.querySelector('.record-top b')?.textContent || 'este juego';
    const question = enable
      ? `¿Poner ${game} en mantenimiento? Los clientes podrán verlo, pero no podrán comprar sus paquetes.`
      : `¿Reactivar ${game}? Sus paquetes volverán a poder comprarse.`;
    if (!confirm(question)) return;

    const oldText = button.textContent;
    button.disabled = true;
    button.textContent = enable ? 'Activando…' : 'Reactivando…';
    try {
      const { data, error } = await sb.rpc('admin_set_account_game_maintenance', {
        p_product_ids: ids,
        p_enabled: enable,
        p_message: enable ? DEFAULT_MESSAGE : null
      });
      if (error) throw error;
      if (!data?.ok) throw new Error('MAINTENANCE_UPDATE_FAILED');
      await loadProducts();
      await loadMaintenanceAdmin();
      scheduleAnnotate();
    } catch (error) {
      alert(String(error?.message || error || 'No se pudo cambiar el estado de mantenimiento.'));
      button.disabled = false;
      button.textContent = oldText;
    }
  }

  function bindMaintenanceAdminActions() {
    document.querySelectorAll('#adminContent [data-fs-maintenance-ids]').forEach((button) => {
      button.onclick = () => toggleMaintenance(button);
    });
  }

  async function loadMaintenanceAdmin() {
    if (admin !== true) return;
    const content = document.getElementById('adminContent');
    if (!content) return;
    if (!safeProducts().length && typeof loadProducts === 'function') await loadProducts();
    const groups = maintenanceGroups();
    content.innerHTML = `<div class="record fs-maintenance-admin-head"><b>Mantenimiento por juego</b><small>Solo afecta al juego que elijas dentro de Recargas por Cuenta. No desactiva la categoría, no cambia precios y no toca Recargas por ID, Streaming ni Gift Cards.</small></div>${groups.map(([game, products]) => maintenanceRow(game, products)).join('') || '<div class="record"><small>No hay juegos activos en Recargas por Cuenta.</small></div>'}`;
    bindMaintenanceAdminActions();
  }

  const previousLoadAdmin = typeof loadAdmin === 'function' ? loadAdmin : null;
  if (previousLoadAdmin) {
    loadAdmin = async function maintenanceAwareLoadAdmin() {
      if (admin !== true) return;
      if (adminTab === 'maintenance') return loadMaintenanceAdmin();
      return previousLoadAdmin();
    };
  }

  const previousRefreshSession = typeof refreshSession === 'function' ? refreshSession : null;
  if (previousRefreshSession) {
    refreshSession = async function maintenanceAwareRefreshSession(newSession = null) {
      const result = await previousRefreshSession(newSession);
      ensureAdminTab();
      scheduleAnnotate();
      return result;
    };
  }

  function install() {
    ['catalogList', 'featuredList', 'cartItems', 'adminContent'].forEach((id) => {
      const node = document.getElementById(id);
      if (!node) return;
      new MutationObserver(scheduleAnnotate).observe(node, { childList: true, subtree: true });
    });
    document.addEventListener('fs:catalog-updated', () => {
      ensureAdminTab();
      scheduleAnnotate();
      if (admin === true && adminTab === 'maintenance') loadMaintenanceAdmin().catch(() => {});
    });
    document.addEventListener('click', (event) => {
      const target = event.target.closest?.('[data-add]');
      if (!target) return;
      const product = productById(target.dataset.add);
      if (!isMaintenance(product)) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      alert(messageFor(product));
    }, true);
    ensureAdminTab();
    scheduleAnnotate();
  }

  window.FSGameMaintenance = Object.freeze({
    version: VERSION,
    refresh: scheduleAnnotate,
    isProductBlocked: (id) => isMaintenance(productById(id))
  });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once: true });
  else install();
})();
