/* THE FRENCH STORE — customer cancellation UI for unpaid QR orders. */
(() => {
  const API_BASE = 'https://api.frenchstorebo.com';
  const ORDER_CANCEL_PATH = '/bisa-sip/order-cancel';

  const $id = (id) => document.getElementById(id);

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
      INVALID_ORDER_ID: 'El pedido no es válido.',
      BANK_AUTH_UNAVAILABLE: 'Por seguridad no se canceló el pedido porque no pudimos iniciar la verificación bancaria. Intenta nuevamente en unos minutos.',
      BANK_STATUS_UNAVAILABLE: 'Por seguridad no se canceló el pedido porque no pudimos confirmar su estado con BISA. Intenta nuevamente en unos minutos.',
      BANK_QR_DISABLE_FAILED: 'BISA respondió, pero no pudimos inhabilitar el QR de forma segura. El pedido no fue cancelado. Intenta nuevamente en unos minutos.',
      CANCELLATION_TEMPORARILY_UNAVAILABLE: 'No se pudo completar la cancelación de forma segura. El pedido sigue sin cambios. Intenta nuevamente en unos minutos.'
    };
    return map[code] || 'No se pudo cancelar el pedido en este momento. El pedido sigue sin cambios. Intenta nuevamente.';
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
        <button type="button" class="modal-close" data-order-cancel-close aria-label="Cerrar">×</button>
        <span class="eyebrow">CONFIRMACIÓN</span>
        <h2 id="orderCancelConfirmTitle">Cancelar pedido</h2>
        <p class="order-cancel-copy">Hazlo únicamente si <b>todavía no realizaste el pago</b>. Al confirmar, el QR dejará de ser válido y el pedido quedará cancelado.</p>
        <div id="orderCancelConfirmCode" class="order-cancel-code"></div>
        <div class="order-cancel-actions">
          <button type="button" class="secondary-btn" data-order-cancel-close>Volver</button>
          <button type="button" class="danger-btn order-cancel-confirm-btn" id="orderCancelConfirmButton">Sí, cancelar pedido</button>
        </div>
      </div>`;
    document.body.appendChild(modal);
    return modal;
  }

  function askCancellation(orderCode) {
    return new Promise((resolve) => {
      const modal = ensureConfirmModal();
      const code = $id('orderCancelConfirmCode');
      const confirmButton = $id('orderCancelConfirmButton');
      if (code) code.textContent = orderCode ? `Pedido ${orderCode}` : 'Pedido seleccionado';

      let settled = false;
      const finish = (value) => {
        if (settled) return;
        settled = true;
        modal.classList.remove('open');
        modal.setAttribute('aria-hidden', 'true');
        confirmButton.onclick = null;
        modal.querySelectorAll('[data-order-cancel-close]').forEach((button) => { button.onclick = null; });
        modal.onclick = null;
        resolve(value);
      };

      confirmButton.disabled = false;
      confirmButton.textContent = 'Sí, cancelar pedido';
      confirmButton.onclick = () => finish(true);
      modal.querySelectorAll('[data-order-cancel-close]').forEach((button) => { button.onclick = () => finish(false); });
      modal.onclick = (event) => { if (event.target === modal) finish(false); };
      modal.classList.add('open');
      modal.setAttribute('aria-hidden', 'false');
    });
  }

  async function cancelOrder(orderId, orderCode = '') {
    if (!orderId) return;
    const confirmed = await askCancellation(orderCode);
    if (!confirmed) return;

    const modal = ensureConfirmModal();
    const confirmButton = $id('orderCancelConfirmButton');
    confirmButton.disabled = true;
    confirmButton.textContent = 'Cancelando…';

    try {
      const data = await cancelApi(orderId);
      modal.classList.remove('open');
      modal.setAttribute('aria-hidden', 'true');

      if (String(lastQrOrder?.order_id || '') === String(orderId) && $id('qrModal')?.classList.contains('open')) {
        closeModal('qrModal');
      }
      if (String(lastQrOrder?.order_id || '') === String(orderId)) lastQrOrder = null;

      await Promise.resolve(loadOrders()).catch(() => {});
      showToast(`Pedido ${data?.order_code || orderCode || ''} cancelado. El QR ya no es válido.`.replace(/\s+/g, ' ').trim(), 'success');
    } catch (error) {
      modal.classList.remove('open');
      modal.setAttribute('aria-hidden', 'true');
      const code = error?.code || error?.message;
      if (code === 'PAYMENT_ALREADY_CONFIRMED') {
        showToast(errorMessage(code), 'error');
        await Promise.resolve(loadOrders()).catch(() => {});
        if (String(lastQrOrder?.order_id || '') === String(orderId) && $id('qrModal')?.classList.contains('open')) {
          $id('qrWhatsapp')?.click();
        }
        return;
      }
      showToast(errorMessage(code), 'error');
    } finally {
      confirmButton.disabled = false;
      confirmButton.textContent = 'Sí, cancelar pedido';
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

    // IMPORTANT: keep observer updates idempotent. The old code watched `disabled`
    // and then wrote `button.disabled` inside its own callback, which can create a
    // MutationObserver feedback loop and starve the browser event loop on mobile.
    const shouldHide = paid || cancelled;
    const shouldDisable = generating || !currentQrOrder().id;
    if (button.hidden !== shouldHide) button.hidden = shouldHide;
    if (button.disabled !== shouldDisable) button.disabled = shouldDisable;
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
    ensureConfirmModal();
    syncQrCancelButton();
    decorateOrdersList();

    const qrModal = $id('qrModal');
    if (qrModal) {
      new MutationObserver(() => syncQrCancelButton()).observe(qrModal, {
        childList: true,
        subtree: true,
        characterData: true,
        attributes: true,
        // Do not observe `disabled`: syncQrCancelButton itself owns that attribute.
        attributeFilter: ['class']
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
