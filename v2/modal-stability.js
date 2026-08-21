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

  const MODAL_FORCED_PROPS = [
    'position',
    'inset',
    'z-index',
    'display',
    'visibility',
    'opacity',
    'pointer-events'
  ];

  const CARD_FORCED_PROPS = [
    'position',
    'z-index',
    'max-height',
    'overflow-y',
    'pointer-events',
    'width',
    'min-height'
  ];

  let qrWatchdogTimer = null;
  let repairTimer = null;

  const byId = (id) => document.getElementById(id);
  const isOpen = (modal) => Boolean(modal?.classList.contains('open'));
  const isCriticalModal = (node) => Boolean(node?.id && CRITICAL_MODAL_IDS.includes(node.id));

  function setImportant(el, property, value) {
    if (!el) return;
    const currentValue = el.style.getPropertyValue(property);
    const currentPriority = el.style.getPropertyPriority(property);
    if (currentValue === value && currentPriority === 'important') return;
    el.style.setProperty(property, value, 'important');
  }

  function clearForcedModalStyles(modal) {
    if (!modal) return;
    MODAL_FORCED_PROPS.forEach((property) => modal.style.removeProperty(property));
    const card = modal.querySelector('.modal-card');
    CARD_FORCED_PROPS.forEach((property) => card?.style.removeProperty(property));
  }

  function anyCriticalModalOpen() {
    return CRITICAL_MODAL_IDS.some((id) => isOpen(byId(id)));
  }

  function stopRepairTimerIfIdle() {
    if (anyCriticalModalOpen() || !repairTimer) return;
    clearInterval(repairTimer);
    repairTimer = null;
  }

  function ensureRepairTimer() {
    if (repairTimer) return;
    repairTimer = window.setInterval(() => {
      if (!anyCriticalModalOpen()) {
        clearInterval(repairTimer);
        repairTimer = null;
        return;
      }
      repairOpenModals();
    }, 750);
  }

  function syncDocumentLock() {
    const locked = anyCriticalModalOpen();
    document.documentElement.classList.toggle('fs-modal-open', locked);
    document.body?.classList.toggle('fs-modal-open', locked);
    if (!locked) stopRepairTimerIfIdle();
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

  function resetModalScrollOnce(modal, card) {
    requestAnimationFrame(() => {
      modal.scrollTop = 0;
      if (card) card.scrollTop = 0;
      const rect = card?.getBoundingClientRect?.();
      if (card && rect && (rect.width < 40 || rect.height < 40)) {
        setImportant(card, 'width', 'min(92vw, 520px)');
        setImportant(card, 'min-height', '120px');
      }
    });
  }

  function forceOpenModal(modal, { resetScroll = false } = {}) {
    if (!modal) return false;

    /* Keep the dialog outside any transformed/contained layout context. */
    if (modal.parentElement !== document.body) document.body.appendChild(modal);

    if (!modal.classList.contains('open')) modal.classList.add('open');
    if (modal.getAttribute('aria-hidden') !== 'false') modal.setAttribute('aria-hidden', 'false');

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
    }

    syncDocumentLock();
    ensureRepairTimer();
    if (resetScroll) resetModalScrollOnce(modal, card);
    armQrWatchdog(modal);
    return true;
  }

  function normalizeClosedModal(modal) {
    if (!modal) return;
    if (modal.getAttribute('aria-hidden') !== 'true') modal.setAttribute('aria-hidden', 'true');
    clearForcedModalStyles(modal);
    if (modal.id === 'qrModal') {
      clearTimeout(qrWatchdogTimer);
      qrWatchdogTimer = null;
      removeQrDelayHint(modal);
    }
  }

  function forceCloseModal(modal) {
    if (!modal) return false;
    if (modal.classList.contains('open')) modal.classList.remove('open');
    normalizeClosedModal(modal);
    syncDocumentLock();
    stopRepairTimerIfIdle();
    return true;
  }

  function repairOpenModals() {
    CRITICAL_MODAL_IDS.forEach((id) => {
      const modal = byId(id);
      if (!modal) return;
      if (isOpen(modal)) {
        /* Repairs must never reset the user's scroll position. */
        forceOpenModal(modal, { resetScroll: false });
        if (id === 'qrModal' && qrIsReady(modal)) removeQrDelayHint(modal);
      } else {
        /* If any module removed .open directly, also remove guard styles so an
           invisible/stale overlay can never keep trapping taps. */
        normalizeClosedModal(modal);
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
      if (modal) forceOpenModal(modal, { resetScroll: true });
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

  function mutationTouchesCriticalModal(record) {
    if (record.type === 'attributes') return isCriticalModal(record.target);
    if (record.type !== 'childList') return false;
    if (record.target?.closest?.('.modal.open')) return true;
    return [...record.addedNodes].some((node) => {
      if (isCriticalModal(node)) return true;
      return Boolean(node?.querySelector?.('#authModal,#cartModal,#qrModal,#topupQrModal,#orderCancelConfirmModal'));
    });
  }

  function installObservers() {
    const observer = new MutationObserver((records) => {
      if (!records.some(mutationTouchesCriticalModal)) return;
      queueMicrotask(() => {
        repairOpenModals();
        if (anyCriticalModalOpen()) ensureRepairTimer();
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'aria-hidden']
    });
  }

  function installCloseFallbacks() {
    document.addEventListener('click', (event) => {
      const closeButton = event.target.closest?.('[data-close]');
      if (!closeButton) return;
      const id = closeButton.dataset.close;
      if (!CRITICAL_MODAL_IDS.includes(id)) return;
      setTimeout(() => {
        const modal = byId(id);
        if (modal) forceCloseModal(modal);
      }, 0);
    }, true);

    document.addEventListener('keydown', (event) => {
      if (event.key !== 'Escape') return;
      const open = [...CRITICAL_MODAL_IDS].reverse().map(byId).find(isOpen);
      if (open) setTimeout(() => forceCloseModal(open), 0);
    });
  }

  function installPublicApi() {
    window.FSModalStability = {
      open(id) {
        return forceOpenModal(byId(id), { resetScroll: true });
      },
      close(id) {
        return forceCloseModal(byId(id));
      },
      repair() {
        repairOpenModals();
      }
    };
  }

  function install() {
    patchGlobalModalHelpers();
    installPublicApi();
    installObservers();
    installCloseFallbacks();
    repairOpenModals();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once: true });
  else install();

  window.addEventListener('pagehide', () => {
    clearTimeout(qrWatchdogTimer);
    if (repairTimer) clearInterval(repairTimer);
    repairTimer = null;
  }, { once: true });
})();
