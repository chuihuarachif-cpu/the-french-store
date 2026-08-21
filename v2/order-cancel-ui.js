/* THE FRENCH STORE — customer cancellation UI for unpaid QR orders. */
(() => {
  const API_BASE = 'https://api.frenchstorebo.com';
  const ORDER_CANCEL_PATH = '/bisa-sip/order-cancel';
  const cancellingOrders = new Set();

  const $id = (id) => document.getElementById(id);

  function openCancellationModal(modal) {
    if (!modal) return;
    if (window.FSModalStability?.open) {
      window.FSModalStability.open(modal.id);
      return;
    }
    if (typeof window.openModal === 'function') {
      window.openModal(modal.id);
      return;
    }
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
  }

  function closeCancellationModal(modal) {
    if (!modal) return;
    if (window.FSModalStability?.close) {
      window.FSModalStability.close(modal.id);
      return;
    }
    if (typeof window.closeModal === 'function') {
      window.closeModal(modal.id);
      return;
    }
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    ['position', 'inset', 'z-index', 'display', 'visibility', 'opacity', 'pointer-events'].forEach((property) => {
      modal.style.removeProperty(property);
    });
  }

  async function accessToken() {
    const { data } = await sb.auth.getSession();
    return data?.session?.access_token || session?.access_token || null;
  }

  async function cancelApi(orderId) {
    const token = await accessToken();
    if (!token) throw Object.assign(new Error('AUTH_REQUIRED'), { code: 'AUTH_REQUIRED' });

    const response = await fetch(`${API_BASE}${ORDER_CANCEL_PATH}`, {
      method: 'POST',
      mode: 'cors',
      cache: 'no-store',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Accept: 'application/json'
      },
      body: JSON.stringify({ order_id: orderId })
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data?.ok) {
      const code = data?.error || `HTTP_${response.status}`;
      throw Object.assign(new Error(code), { code, status: response.status });
    }
    return data;
  }

  function errorMessage(code) {
    const map = {
      AUTH_REQUIRED: 'Tu sesión venció. Inicia sesión nuevamente.',
      ORDER_NOT_FOUND: 'No se encontró este pedido o no pertenece a tu cuenta.',
      ORDER_NOT_CANCELLABLE: 'Este pedido ya no puede cancelarse.',
      PAYMENT_ALREADY_CONFIRMED: 'El pago ya fue confirmado. El pedido no puede cancelarse.',
      INVALID_ORDER_ID: 'El pedido no es válido.'
    };
    return map[code] || 'No se pudo cancelar el pedido en este momento. Intenta nuevamente.';
  }

  function showToast(message, type = 'success') {
    let toast = $id('orderCancelToast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'orderCancelToast';
      toast.className = 'order-cancel-toast';
      toast.setAttribute('role', 'status');
      toast.setAttribute('aria-live', 'polite');
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.className = `order-cancel-toast ${type}`;
    toast.classList.add('show');
    clearTimeout(toast._hideTimer);
    toast._hideTimer = setTimeout(() => toast.classList.remove('show'), 4200);
  }

  function ensureConfirmModal() {
    let modal = $id('orderCancelConfirmModal');
    if (modal) return modal;

    modal = document.createElement('div');
    modal.id = 'orderCancelConfirmModal';
    modal.className = 'modal order-cancel-confirm-modal';
    modal.setAttribute('aria-hidden', 'true');
    modal.innerHTML = `
      <div class="modal-card small-modal order-cancel-confirm-card" role="dialog" aria-modal="true" aria-labelledby="orderCancelConfirmTitle">
        <button type="button" class="modal-close" data-order-cancel-close data-close="orderCancelConfirmModal" aria-label="Cerrar">×</button>
        <span class="eyebrow">CONFIRMACIÓN</span>
        <h2 id="orderCancelConfirmTitle">Cancelar pedido</h2>
        <p class="order-cancel-copy">Hazlo únicamente si <b>todavía no realizaste el pago</b>. Al confirmar, el QR dejará de ser válido y el pedido quedará cancelado.</p>
        <div id="orderCancelConfirmCode" class="order-cancel-code"></div>
        <div class="order-cancel-actions">
          <button type="button" class="secondary-btn" data-order-cancel-close data-close="orderCancelConfirmModal">Volver</button>
          <button type="button" class="danger-btn order-cancel-confirm-btn" id="orderCancelConfirmButton">Sí, cancelar pedido</button>
        </div>
      </div>`;
    document.body.appendChild(modal);
    return modal;
  }

  function setCancellationBusy(modal, busy) {
    const card = modal?.querySelector('.modal-card');
    const confirmButton = $id('orderCancelConfirmButton');
    if (card) card.setAttribute('aria-busy', busy ? 'true' : 'false');
    if (confirmButton) {
      confirmButton.disabled = busy;
      confirmButton.textContent = busy ? 'Cancelando…' : 'Sí, cancelar pedido';
    }
  }

  function askCancellation(orderCode) {
    return new Promise((resolve) => {
      const modal = ensureConfirmModal();
      const code = $id('orderCancelConfirmCode');
      const confirmButton = $id('orderCancelConfirmButton');
      if (code) code.textContent = orderCode ? `Pedido ${orderCode}` : 'Pedido seleccionado';

      let settled = false;
      const closeButtons = [...modal.querySelectorAll('[data-order-cancel-close]')];
      const cleanupHandlers = () => {
        if (confirmButton) confirmButton.onclick = null;
        closeButtons.forEach((button) => { button.onclick = null; });
        modal.onclick = null;
      };
      const finish = (value) => {
        if (settled) return;
        settled = true;
        cleanupHandlers();
        if (!value) closeCancellationModal(modal);
        resolve(value);
      };

      setCancellationBusy(modal, false);
      if (confirmButton) confirmButton.onclick = () => finish(true);
      closeButtons.forEach((button) => { button.onclick = () => finish(false); });
      modal.onclick = (event) => { if (event.target === modal) finish(false); };
      openCancellationModal(modal);
    });
  }

  async function cancelOrder(orderId, orderCode = '') {
    if (!orderId || cancellingOrders.has(String(orderId))) return;

    const confirmed = await askCancellation(orderCode);
    if (!confirmed) return;

    const key = String(orderId);
    cancellingOrders.add(key);
    const modal = ensureConfirmModal();
    setCancellationBusy(modal, true);

    try {
      const data = await cancelApi(orderId);
      closeCancellationModal(modal);

      if (String(lastQrOrder?.order_id || '') === key && $id('qrModal')?.classList.contains('open')) {
        if (window.FSModalStability?.close) window.FSModalStability.close('qrModal');
        else if (typeof window.closeModal === 'function') window.closeModal('qrModal');
      }
      if (String(lastQrOrder?.order_id || '') === key) lastQrOrder = null;

      await Promise.resolve(loadOrders()).catch(() => {});
      showToast(`Pedido ${data?.order_code || orderCode || ''} cancelado. El QR ya no es válido.`.replace(/\s+/g, ' ').trim(), 'success');
    } catch (error) {
      closeCancellationModal(modal);
      const code = error?.code || error?.message;
      if (code === 'PAYMENT_ALREADY_CONFIRMED') {
        showToast(errorMessage(code), 'error');
        await Promise.resolve(loadOrders()).catch(() => {});
        if (String(lastQrOrder?.order_id || '') === key && $id('qrModal')?.classList.contains('open')) {
          $id('qrWhatsapp')?.click();
        }
        return;
      }
      showToast(errorMessage(code), 'error');
    } finally {
      cancellingOrders.delete(key);
      setCancellationBusy(modal, false);
      window.FSModalStability?.repair?.();
    }
  }

  function currentQrOrder() {
    const id = lastQrOrder?.order_id || lastQrOrder?.id || null;
    const code = lastQrOrder?.order_code || '';
    return { id, code };
  }

  function syncQrCancelButton() {
    const qrModal = $id('qrModal');
    const verify = $id('qrWhatsapp');
    if (!qrModal || !verify) return;

    let button = $id('qrCancelOrder');
    if (!button) {
      button = document.createElement('button');
      button.id = 'qrCancelOrder';
      button.type = 'button';
      button.className = 'danger-btn full order-cancel-btn';
      button.textContent = 'Cancelar pedido';
      verify.after(button);
      button.onclick = () => {
        const order = currentQrOrder();
        if (order.id) cancelOrder(order.id, order.code);
      };
    }

    const state = $id('qrPaymentState');
    const stateText = String(state?.textContent || '').toLowerCase();
    const verifyText = String(verify.textContent || '').toLowerCase();
    const paid = state?.classList.contains('paid') || verifyText.includes('pagado') || verifyText.includes('confirmado');
    const cancelled = stateText.includes('cancelado');
    const generating = stateText.includes('generando') || verifyText.includes('generando');

    button.hidden = paid || cancelled;
    button.disabled = generating || !currentQrOrder().id;
  }

  function decorateOrdersList() {
    const list = $id('ordersList');
    if (!list) return;

    list.querySelectorAll('.qr-order-btn[data-order-qr]').forEach((payButton) => {
      const orderId = payButton.dataset.orderQr;
      const actions = payButton.closest('.admin-actions');
      if (!orderId || !actions || actions.querySelector(`[data-order-cancel="${CSS.escape(orderId)}"]`)) return;

      const cancelButton = document.createElement('button');
      cancelButton.type = 'button';
      cancelButton.className = 'danger-btn order-list-cancel-btn';
      cancelButton.dataset.orderCancel = orderId;
      cancelButton.textContent = 'Cancelar pedido';
      const record = payButton.closest('.record');
      const orderCode = record?.querySelector('.record-top b')?.textContent?.trim() || '';
      cancelButton.onclick = () => cancelOrder(orderId, orderCode);
      actions.appendChild(cancelButton);
    });
  }

  function install() {
    const confirmModal = ensureConfirmModal();
    closeCancellationModal(confirmModal);
    syncQrCancelButton();
    decorateOrdersList();

    const qrModal = $id('qrModal');
    if (qrModal) {
      new MutationObserver(() => syncQrCancelButton()).observe(qrModal, {
        childList: true,
        subtree: true,
        characterData: true,
        attributes: true,
        attributeFilter: ['class', 'disabled']
      });
    }

    const ordersList = $id('ordersList');
    if (ordersList) {
      new MutationObserver(() => decorateOrdersList()).observe(ordersList, {
        childList: true,
        subtree: true
      });
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once: true });
  else install();
})();
