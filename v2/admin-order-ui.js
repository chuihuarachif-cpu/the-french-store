/* THE FRENCH STORE — themed admin order status modal.
   Replaces the browser-native prompt used by adminOrderStatus without changing the RPC or status flow.
   Also keeps the Admin > Pedidos tab as a real overview, including unpaid, delivered and cancelled orders. */
(() => {
  'use strict';

  let pendingAction = null;
  const originalLoadAdmin = loadAdmin;

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

  function orderAdminNote(order) {
    const status = String(order.status || '').toUpperCase();
    if (status === 'PENDING_PAYMENT') return 'Esperando pago del cliente.';
    if (status === 'DELIVERED') return 'Pedido finalizado y entregado.';
    if (status === 'CANCELLED') return 'Pedido cancelado. No requiere gestión.';
    if (status === 'REFUNDED') return 'Pedido reembolsado. No requiere gestión.';
    if (status === 'PROCESSING') return 'Pedido en proceso de entrega.';
    if (status === 'AWAITING_CODE') return 'Pago confirmado. Falta entregar el código manualmente.';
    if (status === 'MANUAL_REQUIRED') return 'Pago confirmado. Requiere gestión manual.';
    if (status === 'ERROR') return 'Pedido marcado con error para revisión.';
    return order.requires_manual_action ? 'Requiere atención manual.' : '';
  }

  function orderAdminActions(order) {
    const status = String(order.status || '').toUpperCase();
    if (['PENDING_PAYMENT', 'DELIVERED', 'CANCELLED', 'REFUNDED'].includes(status)) return '';

    const buttons = [];
    if (status !== 'PROCESSING') {
      buttons.push(`<button data-order-status="PROCESSING" data-id="${esc(order.id)}">Procesando</button>`);
    }
    if (status !== 'DELIVERED') {
      buttons.push(`<button data-order-status="DELIVERED" data-id="${esc(order.id)}">Entregado</button>`);
    }
    if (status !== 'ERROR') {
      buttons.push(`<button data-order-status="ERROR" data-id="${esc(order.id)}">Error</button>`);
    }
    return buttons.length ? `<div class="admin-actions">${buttons.join('')}</div>` : '';
  }

  async function loadAllAdminOrders() {
    if (!admin) return;
    const content = $('adminContent');
    content.innerHTML = '<div class="record"><small>Cargando pedidos…</small></div>';

    const { data, error } = await sb
      .from('orders')
      .select('id,order_code,customer_email,status,payment_method,total_amount,created_at,requires_manual_action,paid_at')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      content.innerHTML = err(error);
      return;
    }

    content.innerHTML = (data || []).map((o) => {
      const note = orderAdminNote(o);
      const paidText = o.paid_at ? ` · Pagado ${dateFmt(o.paid_at)}` : '';
      return `<div class="record admin-order-overview" data-admin-order-status="${esc(String(o.status || ''))}">
        <div class="record-top">
          <div>
            <b>${esc(o.order_code)} · ${money(o.total_amount)}</b>
            <small>${esc(o.customer_email || 'Sin correo')} · ${esc(o.payment_method || '')} · ${dateFmt(o.created_at)}${paidText}</small>
          </div>
          ${statusHtml(o.status)}
        </div>
        ${note ? `<div class="record-meta"><span>${esc(note)}</span></div>` : ''}
        ${orderAdminActions(o)}
      </div>`;
    }).join('') || empty('No hay pedidos registrados.');

    bindAdminActions();
  }

  loadAdmin = async function themedLoadAdmin() {
    if (!admin) return;
    if (adminTab !== 'orders') return originalLoadAdmin();
    return loadAllAdminOrders();
  };

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
