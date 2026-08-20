/* THE FRENCH STORE — shared modal stability guard.
   Keeps critical dialogs visible and usable on mobile without changing Auth,
   Wallet, checkout, BISA or business rules. */
(() => {
  'use strict';

  const CRITICAL_MODAL_IDS = [
    'authModal',
    'cartModal',
    'qrModal',
    'topupQrModal',
    'orderCancelConfirmModal'
  ];

  let qrWatchdogTimer = null;
  let repairTimer = null;

  const byId = (id) => document.getElementById(id);
  const isOpen = (modal) => Boolean(modal?.classList.contains('open'));

  function setImportant(el, property, value) {
    if (!el) return;
    const currentValue = el.style.getPropertyValue(property);
    const currentPriority = el.style.getPropertyPriority(property);
    if (currentValue === value && currentPriority === 'important') return;
    el.style.setProperty(property, value, 'important');
  }

  function clearForcedVisibility(modal) {
    if (!modal) return;
    ['display', 'visibility', 'opacity', 'pointer-events'].forEach((property) => {
      modal.style.removeProperty(property);
    });
  }

  function anyCriticalModalOpen() {
    return CRITICAL_MODAL_IDS.some((id) => isOpen(byId(id)));
  }

  function syncDocumentLock() {
    const locked = anyCriticalModalOpen();
    document.documentElement.classList.toggle('fs-modal-open', locked);
    document.body?.classList.toggle('fs-modal-open', locked);
  }

  function qrIsReady(modal) {
    if (!modal) return false;
    const state = modal.querySelector('#qrPaymentState');
    const stateText = String(state?.textContent || '').toLowerCase();
    if (state?.classList.contains('paid') || state?.classList.contains('error')) return true;
    if (stateText.includes('pagado') || stateText.includes('confirmado') || stateText.includes('error')) return true;
    const img = modal.querySelector('.qr-box img');
    const src = String(img?.getAttribute('src') || '');
    return src.startsWith('data:image/') || src.startsWith('https://') || src.startsWith('http://');
  }

  function removeQrDelayHint(modal) {
    modal?.querySelector('[data-modal-stability-hint]')?.remove();
  }

  function armQrWatchdog(modal) {
    if (!modal || modal.id !== 'qrModal' || !isOpen(modal)) return;

    if (qrIsReady(modal)) {
      clearTimeout(qrWatchdogTimer);
      qrWatchdogTimer = null;
      removeQrDelayHint(modal);
      return;
    }

    /* Do not restart the 12 s clock on every repair pass. */
    if (qrWatchdogTimer) return;

    qrWatchdogTimer = setTimeout(() => {
      qrWatchdogTimer = null;
      if (!isOpen(modal) || qrIsReady(modal)) return;
      const card = modal.querySelector('.modal-card');
      if (!card || card.querySelector('[data-modal-stability-hint]')) return;
      const hint = document.createElement('div');
      hint.className = 'notice warn modal-stability-hint';
      hint.dataset.modalStabilityHint = '1';
      hint.setAttribute('role', 'status');
      hint.setAttribute('aria-live', 'polite');
      hint.textContent = 'El QR está tardando más de lo normal. Puedes cerrar esta ventana y volver a tocar “Pagar / Ver QR”. No realices ningún pago hasta que el QR sea visible.';
      const meta = modal.querySelector('#qrOrderMeta');
      if (meta?.parentNode) meta.parentNode.insertBefore(hint, meta.nextSibling);
      else card.appendChild(hint);
    }, 12000);
  }

  function forceOpenModal(modal) {
    if (!modal) return;

    /* Keep the dialog outside any transformed/contained layout context. */
    if (modal.parentElement !== document.body) document.body.appendChild(modal);

    if (!modal.classList.contains('open')) modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');

    setImportant(modal, 'position', 'fixed');
    setImportant(modal, 'inset', '0px');
    setImportant(modal, 'z-index', '2147483000');
    setImportant(modal, 'display', 'flex');
    setImportant(modal, 'visibility', 'visible');
    setImportant(modal, 'opacity', '1');
    setImportant(modal, 'pointer-events', 'auto');

    const card = modal.querySelector('.modal-card');
    if (card) {
      setImportant(card, 'position', 'relative');
      setImportant(card, 'z-index', '1');
      setImportant(card, 'max-height', 'calc(100dvh - 24px)');
      setImportant(card, 'overflow-y', 'auto');
      setImportant(card, 'pointer-events', 'auto');
      card.style.removeProperty('transform');
      card.style.removeProperty('opacity');
    }

    syncDocumentLock();

    requestAnimationFrame(() => {
      modal.scrollTop = 0;
      if (card) card.scrollTop = 0;
      const rect = card?.getBoundingClientRect?.();
      if (card && rect && (rect.width < 40 || rect.height < 40)) {
        setImportant(card, 'width', 'min(92vw, 520px)');
        setImportant(card, 'min-height', '120px');
      }
    });

    armQrWatchdog(modal);
  }

  function forceCloseModal(modal) {
    if (!modal) return;
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    clearForcedVisibility(modal);
    if (modal.id === 'qrModal') {
      clearTimeout(qrWatchdogTimer);
      qrWatchdogTimer = null;
      removeQrDelayHint(modal);
    }
    syncDocumentLock();
  }

  function repairOpenModals() {
    CRITICAL_MODAL_IDS.forEach((id) => {
      const modal = byId(id);
      if (!modal) return;
      if (isOpen(modal)) {
        forceOpenModal(modal);
        if (id === 'qrModal' && qrIsReady(modal)) removeQrDelayHint(modal);
      } else if (modal.getAttribute('aria-hidden') === 'false') {
        modal.setAttribute('aria-hidden', 'true');
      }
    });
    syncDocumentLock();
  }

  function patchGlobalModalHelpers() {
    const previousOpenModal = typeof window.openModal === 'function' ? window.openModal : null;
    const previousCloseModal = typeof window.closeModal === 'function' ? window.closeModal : null;

    window.openModal = function stableOpenModal(id) {
      let result;
      if (previousOpenModal) result = previousOpenModal.apply(this, arguments);
      const modal = byId(id);
      if (modal) forceOpenModal(modal);
      return result;
    };

    window.closeModal = function stableCloseModal(id) {
      let result;
      try {
        if (previousCloseModal) result = previousCloseModal.apply(this, arguments);
      } finally {
        const modal = byId(id);
        if (modal) forceCloseModal(modal);
      }
      return result;
    };
  }

  function installObservers() {
    const observer = new MutationObserver((records) => {
      let relevant = false;
      for (const record of records) {
        if (record.type === 'childList') {
          relevant = true;
          break;
        }
        const target = record.target;
        if (target?.id && CRITICAL_MODAL_IDS.includes(target.id)) {
          relevant = true;
          break;
        }
      }
      if (!relevant) return;
      queueMicrotask(repairOpenModals);
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'aria-hidden']
    });

    repairTimer = window.setInterval(() => {
      if (anyCriticalModalOpen()) repairOpenModals();
    }, 750);
  }

  function installCloseFallbacks() {
    document.addEventListener('click', (event) => {
      const closeButton = event.target.closest?.('[data-close]');
      if (!closeButton) return;
      const id = closeButton.dataset.close;
      if (!CRITICAL_MODAL_IDS.includes(id)) return;
      setTimeout(() => {
        const modal = byId(id);
        if (isOpen(modal)) forceCloseModal(modal);
      }, 0);
    }, true);

    document.addEventListener('keydown', (event) => {
      if (event.key !== 'Escape') return;
      const open = [...CRITICAL_MODAL_IDS].reverse().map(byId).find(isOpen);
      if (open) setTimeout(() => forceCloseModal(open), 0);
    });
  }

  function install() {
    patchGlobalModalHelpers();
    installObservers();
    installCloseFallbacks();
    repairOpenModals();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once: true });
  else install();

  window.addEventListener('pagehide', () => {
    clearTimeout(qrWatchdogTimer);
    if (repairTimer) clearInterval(repairTimer);
  }, { once: true });
})();
