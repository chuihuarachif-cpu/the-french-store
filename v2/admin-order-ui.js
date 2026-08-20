/* THE FRENCH STORE — themed admin order status modal.
   Replaces the browser-native prompt used by adminOrderStatus without changing the RPC or status flow. */
(() => {
  'use strict';

  let pendingAction = null;

  const STATUS_COPY = {
    PROCESSING: {
      eyebrow: 'GESTIÓN DE PEDIDO',
      title: 'Marcar como procesando',
      summary: 'El pedido pasará a estado Procesando.',
      button: 'Confirmar procesamiento',
      buttonClass: 'primary-btn full'
    },
    DELIVERED: {
      eyebrow: 'ENTREGA DE PEDIDO',
      title: 'Confirmar entrega',
      summary: 'El pedido se marcará como Entregado.',
      button: '✓ Marcar como entregado',
      buttonClass: 'primary-btn full'
    },
    ERROR: {
      eyebrow: 'REVISIÓN DE PEDIDO',
      title: 'Reportar problema',
      summary: 'El pedido se marcará con error para revisión.',
      button: 'Marcar con error',
      buttonClass: 'danger-btn full'
    }
  };

  function orderCodeFor(id) {
    const button = document.querySelector(`[data-order-status][data-id="${CSS.escape(String(id))}"]`);
    const text = button?.closest('.record')?.querySelector('.record-top b')?.textContent || '';
    const match = text.match(/FS-\d{6}-[A-Z0-9]{4}/i);
    return match ? match[0].toUpperCase() : 'Pedido seleccionado';
  }

  function ensureModal() {
    let modal = document.getElementById('adminOrderActionModal');
    if (modal) return modal;

    modal = document.createElement('div');
    modal.id = 'adminOrderActionModal';
    modal.className = 'modal';
    modal.setAttribute('aria-hidden', 'true');
    modal.innerHTML = `
      <div class="modal-card small-modal" role="dialog" aria-modal="true" aria-labelledby="adminOrderActionTitle">
        <button type="button" class="modal-close" id="adminOrderActionClose" aria-label="Cerrar">×</button>
        <span class="eyebrow" id="adminOrderActionEyebrow">GESTIÓN DE PEDIDO</span>
        <h2 id="adminOrderActionTitle">Actualizar pedido</h2>
        <div id="adminOrderActionSummary" class="notice success"></div>
        <label>
          Nota Admin <small>(opcional)</small>
          <input id="adminOrderActionNote" type="text" maxlength="300" autocomplete="off" placeholder="Ej. Entrega confirmada por WhatsApp">
        </label>
        <p class="security-note">Este cambio se guardará en el estado interno del pedido.</p>
        <div id="adminOrderActionError" class="notice error hidden"></div>
        <div class="checkout-grid">
          <button type="button" id="adminOrderActionCancel" class="secondary-btn">Cancelar</button>
          <button type="button" id="adminOrderActionConfirm" class="primary-btn">Confirmar</button>
        </div>
      </div>`;
    document.body.appendChild(modal);

    const close = () => {
      pendingAction = null;
      modal.classList.remove('open');
      modal.setAttribute('aria-hidden', 'true');
      const error = document.getElementById('adminOrderActionError');
      if (error) error.classList.add('hidden');
    };

    document.getElementById('adminOrderActionClose').onclick = close;
    document.getElementById('adminOrderActionCancel').onclick = close;
    modal.addEventListener('click', (event) => {
      if (event.target === modal) close();
    });

    document.getElementById('adminOrderActionConfirm').onclick = async () => {
      if (!pendingAction) return;
      const confirmButton = document.getElementById('adminOrderActionConfirm');
      const errorBox = document.getElementById('adminOrderActionError');
      const note = document.getElementById('adminOrderActionNote').value.trim() || null;
      const { id, status } = pendingAction;
      const copy = STATUS_COPY[status] || STATUS_COPY.PROCESSING;

      confirmButton.disabled = true;
      confirmButton.textContent = 'Guardando…';
      errorBox.classList.add('hidden');
      try {
        const { error } = await sb.rpc('admin_update_order_status', {
          p_order_id: id,
          p_new_status: status,
          p_admin_note: note
        });
        if (error) {
          errorBox.textContent = error.message || 'No se pudo actualizar el pedido.';
          errorBox.classList.remove('hidden');
          return;
        }
        close();
        await loadAdmin();
      } finally {
        confirmButton.disabled = false;
        confirmButton.textContent = copy.button;
      }
    };

    return modal;
  }

  adminOrderStatus = async function themedAdminOrderStatus(id, status) {
    const normalized = String(status || '').toUpperCase();
    const copy = STATUS_COPY[normalized] || STATUS_COPY.PROCESSING;
    const modal = ensureModal();
    pendingAction = { id, status: normalized };

    document.getElementById('adminOrderActionEyebrow').textContent = copy.eyebrow;
    document.getElementById('adminOrderActionTitle').textContent = copy.title;
    document.getElementById('adminOrderActionSummary').textContent = `${orderCodeFor(id)} · ${copy.summary}`;
    document.getElementById('adminOrderActionNote').value = '';
    const confirmButton = document.getElementById('adminOrderActionConfirm');
    confirmButton.className = copy.buttonClass;
    confirmButton.textContent = copy.button;

    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    requestAnimationFrame(() => document.getElementById('adminOrderActionNote')?.focus({ preventScroll: true }));
  };
})();
