/* THE FRENCH STORE — admin-only fulfillment data viewer.
   Reads player/account identifiers only through admin_get_order_fulfillment_inputs.
   The underlying fulfillment table remains inaccessible to browser roles.
*/
(() => {
  'use strict';

  const ALLOWED_STATUSES = new Set(['PAID', 'MANUAL_REQUIRED', 'PROCESSING', 'ERROR']);
  const FIELD_LABELS = {
    user_id: 'ID de usuario',
    player_id: 'Player ID',
    zone_id: 'Zone ID',
    server: 'Servidor / región'
  };

  const safeText = (value) => String(value ?? '').trim();
  const escapeHtml = (value) => safeText(value).replace(/[&<>"']/g, (m) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
  }[m]));

  function injectStyles() {
    if (document.getElementById('fsAdminFulfillmentStyles')) return;
    const style = document.createElement('style');
    style.id = 'fsAdminFulfillmentStyles';
    style.textContent = `
      .fs-admin-fi-list{display:grid;gap:10px;margin-top:12px}
      .fs-admin-fi-card{border:1px solid rgba(91,203,255,.22);border-radius:14px;padding:12px;background:rgba(5,20,32,.72)}
      .fs-admin-fi-card b{display:block;color:#eefaff;margin-bottom:8px}
      .fs-admin-fi-fields{display:grid;gap:7px}
      .fs-admin-fi-row{display:grid;grid-template-columns:minmax(110px,.65fr) minmax(0,1fr);gap:10px;align-items:start}
      .fs-admin-fi-row span{color:#8fa8b9}.fs-admin-fi-row strong{color:#fff;word-break:break-word}
      .fs-admin-fi-state{margin-top:9px;color:#8fa8b9;font-size:.82rem}
      .fs-admin-fi-state.valid{color:#7ff1a8}.fs-admin-fi-state.pending{color:#ffd978}
      @media(max-width:560px){.fs-admin-fi-row{grid-template-columns:1fr;gap:2px}}
    `;
    document.head.appendChild(style);
  }

  function ensureModal() {
    let modal = document.getElementById('adminFulfillmentModal');
    if (modal) return modal;

    modal = document.createElement('div');
    modal.id = 'adminFulfillmentModal';
    modal.className = 'modal';
    modal.setAttribute('aria-hidden', 'true');
    modal.innerHTML = `
      <div class="modal-card small-modal" role="dialog" aria-modal="true" aria-labelledby="adminFulfillmentTitle">
        <button type="button" class="modal-close" id="adminFulfillmentClose" aria-label="Cerrar">×</button>
        <span class="eyebrow">DATOS DE RECARGA</span>
        <h2 id="adminFulfillmentTitle">Destino del pedido</h2>
        <p class="security-note">Datos privados del pedido. Úsalos solo para verificar o entregar la recarga correspondiente.</p>
        <div id="adminFulfillmentContent" class="fs-admin-fi-list"></div>
        <div id="adminFulfillmentError" class="notice error hidden"></div>
        <button type="button" id="adminFulfillmentDone" class="secondary-btn full">Cerrar</button>
      </div>`;
    document.body.appendChild(modal);

    const close = () => {
      modal.classList.remove('open');
      modal.setAttribute('aria-hidden', 'true');
      const content = document.getElementById('adminFulfillmentContent');
      if (content) content.innerHTML = '';
      const error = document.getElementById('adminFulfillmentError');
      if (error) { error.textContent = ''; error.classList.add('hidden'); }
    };

    document.getElementById('adminFulfillmentClose').onclick = close;
    document.getElementById('adminFulfillmentDone').onclick = close;
    modal.addEventListener('click', (event) => { if (event.target === modal) close(); });
    return modal;
  }

  function validationCopy(status) {
    const value = safeText(status).toUpperCase();
    if (value === 'VALID') return { text: 'Cuenta verificada', cls: 'valid' };
    if (value === 'FORMAT_VALID') return { text: 'Formato completo · pendiente de verificación', cls: 'pending' };
    if (value === 'INVALID') return { text: 'Datos rechazados · revisar', cls: '' };
    return { text: value || 'Pendiente', cls: '' };
  }

  function renderRows(rows) {
    if (!Array.isArray(rows) || !rows.length) {
      return '<div class="notice">Este pedido no tiene identificadores de recarga guardados.</div>';
    }

    return rows.map((row) => {
      const inputs = row?.input_values && typeof row.input_values === 'object' && !Array.isArray(row.input_values)
        ? row.input_values : {};
      const fields = Object.entries(inputs)
        .filter(([key]) => Object.prototype.hasOwnProperty.call(FIELD_LABELS, key))
        .map(([key, value]) => `<div class="fs-admin-fi-row"><span>${escapeHtml(FIELD_LABELS[key])}</span><strong>${escapeHtml(value)}</strong></div>`)
        .join('');
      const state = validationCopy(row?.validation_status);
      return `<section class="fs-admin-fi-card"><b>${escapeHtml(row?.product_name || `Producto ${row?.product_id || ''}`)}</b><div class="fs-admin-fi-fields">${fields || '<span>Sin campos reconocidos.</span>'}</div><div class="fs-admin-fi-state ${state.cls}">${escapeHtml(state.text)}</div></section>`;
    }).join('');
  }

  async function openFulfillment(orderId, button) {
    if (!orderId || button?.dataset.fsFulfillmentBusy === '1') return;
    injectStyles();
    const modal = ensureModal();
    const content = document.getElementById('adminFulfillmentContent');
    const errorBox = document.getElementById('adminFulfillmentError');
    const oldText = button?.textContent || 'Datos recarga';

    if (button) {
      button.dataset.fsFulfillmentBusy = '1';
      button.disabled = true;
      button.textContent = 'Cargando…';
    }
    content.innerHTML = '<div class="record"><small>Cargando datos privados…</small></div>';
    errorBox.classList.add('hidden');
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');

    try {
      const { data, error } = await sb.rpc('admin_get_order_fulfillment_inputs', { p_order_id: orderId });
      if (error) throw error;
      content.innerHTML = renderRows(data || []);
    } catch (error) {
      content.innerHTML = '';
      errorBox.textContent = error?.message || 'No se pudieron cargar los datos de recarga.';
      errorBox.classList.remove('hidden');
    } finally {
      if (button) {
        delete button.dataset.fsFulfillmentBusy;
        button.disabled = false;
        button.textContent = oldText;
      }
    }
  }

  function enhanceAdminOrders() {
    const root = document.getElementById('adminContent');
    if (!root) return;
    root.querySelectorAll('.admin-order-overview').forEach((record) => {
      const status = safeText(record.dataset.adminOrderStatus).toUpperCase();
      if (!ALLOWED_STATUSES.has(status)) return;
      const actionBox = record.querySelector('.admin-actions');
      const sourceButton = actionBox?.querySelector('[data-order-status][data-id]');
      const orderId = safeText(sourceButton?.dataset.id);
      if (!actionBox || !orderId || actionBox.querySelector('[data-admin-fulfillment]')) return;

      const button = document.createElement('button');
      button.type = 'button';
      button.dataset.adminFulfillment = '1';
      button.textContent = 'Datos recarga';
      button.addEventListener('click', () => openFulfillment(orderId, button));
      actionBox.appendChild(button);
    });
  }

  function install() {
    injectStyles();
    const root = document.getElementById('adminContent');
    if (!root) return;
    enhanceAdminOrders();
    const observer = new MutationObserver(() => enhanceAdminOrders());
    observer.observe(root, { childList: true, subtree: false });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once: true });
  else install();
})();
