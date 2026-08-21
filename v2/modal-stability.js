/* THE FRENCH STORE — deterministic modal manager.
   R30 removes the global page lock, MutationObserver and repair interval that
   could leave Android with a frozen storefront after a modal changed state.
   Payment/Auth/business logic is unchanged. */
(() => {
  'use strict';

  const CRITICAL_MODAL_IDS = [
    'authModal',
    'cartModal',
    'qrModal',
    'topupQrModal',
    'orderCancelConfirmModal'
  ];

  const MODAL_OPEN_PROPS = {
    position: 'fixed',
    inset: '0px',
    'z-index': '2147483000',
    display: 'flex',
    visibility: 'visible',
    opacity: '1',
    'pointer-events': 'auto'
  };

  const CARD_OPEN_PROPS = {
    position: 'relative',
    'z-index': '1',
    'max-height': 'calc(100dvh - 24px)',
    'overflow-y': 'auto',
    'pointer-events': 'auto'
  };

  const byId = (id) => document.getElementById(id);
  const isManaged = (id) => CRITICAL_MODAL_IDS.includes(String(id || ''));
  const setImportant = (el, property, value) => el?.style.setProperty(property, value, 'important');

  function clearLegacyPageLock() {
    /* Never freeze the storefront globally. The fixed overlay captures input
       while open; when it closes the page remains naturally scrollable. */
    document.documentElement.classList.remove('fs-modal-open');
    document.body?.classList.remove('fs-modal-open');
  }

  function hideModal(modal) {
    if (!modal) return false;
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    setImportant(modal, 'display', 'none');
    setImportant(modal, 'visibility', 'hidden');
    setImportant(modal, 'opacity', '0');
    setImportant(modal, 'pointer-events', 'none');
    ['position', 'inset', 'z-index'].forEach((property) => modal.style.removeProperty(property));

    const card = modal.querySelector('.modal-card');
    if (card) {
      Object.keys(CARD_OPEN_PROPS).forEach((property) => card.style.removeProperty(property));
      card.style.removeProperty('transform');
      card.style.removeProperty('opacity');
    }

    clearLegacyPageLock();
    return true;
  }

  function showModal(modal) {
    if (!modal) return false;

    /* A modal is always a direct body child so transformed catalog/cards cannot
       create a stacking context above it. */
    if (modal.parentElement !== document.body) document.body.appendChild(modal);

    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    Object.entries(MODAL_OPEN_PROPS).forEach(([property, value]) => setImportant(modal, property, value));

    const card = modal.querySelector('.modal-card');
    if (card) {
      Object.entries(CARD_OPEN_PROPS).forEach(([property, value]) => setImportant(card, property, value));
      setImportant(card, 'transform', 'none');
      setImportant(card, 'opacity', '1');
    }

    clearLegacyPageLock();
    requestAnimationFrame(() => {
      modal.scrollTop = 0;
      if (card) card.scrollTop = 0;
    });
    return true;
  }

  function patchGlobalHelpers() {
    const previousOpenModal = typeof window.openModal === 'function' ? window.openModal : null;
    const previousCloseModal = typeof window.closeModal === 'function' ? window.closeModal : null;

    window.openModal = function stableOpenModal(id) {
      let result;
      try {
        if (previousOpenModal) result = previousOpenModal.apply(this, arguments);
      } finally {
        if (isManaged(id)) showModal(byId(id));
      }
      return result;
    };

    window.closeModal = function stableCloseModal(id) {
      let result;
      try {
        if (previousCloseModal) result = previousCloseModal.apply(this, arguments);
      } finally {
        if (isManaged(id)) hideModal(byId(id));
      }
      return result;
    };
  }

  function installPublicApi() {
    window.FSModalStability = {
      open(id) {
        return isManaged(id) ? showModal(byId(id)) : false;
      },
      close(id) {
        return isManaged(id) ? hideModal(byId(id)) : false;
      },
      isOpen(id) {
        const modal = byId(id);
        return Boolean(modal?.classList.contains('open') && modal.getAttribute('aria-hidden') !== 'true');
      },
      repair() {
        clearLegacyPageLock();
        CRITICAL_MODAL_IDS.forEach((id) => {
          const modal = byId(id);
          if (!modal) return;
          if (modal.classList.contains('open')) showModal(modal);
          else hideModal(modal);
        });
      }
    };
  }

  function installCloseFallbacks() {
    document.addEventListener('click', (event) => {
      const closeButton = event.target.closest?.('[data-close]');
      const id = closeButton?.dataset?.close;
      if (isManaged(id)) hideModal(byId(id));
    }, true);

    document.addEventListener('keydown', (event) => {
      if (event.key !== 'Escape') return;
      const openModal = [...CRITICAL_MODAL_IDS].reverse()
        .map(byId)
        .find((modal) => modal?.classList.contains('open'));
      if (openModal) hideModal(openModal);
    });
  }

  function normalizeInitialState() {
    clearLegacyPageLock();
    CRITICAL_MODAL_IDS.forEach((id) => {
      const modal = byId(id);
      if (!modal) return;
      if (modal.classList.contains('open')) showModal(modal);
      else hideModal(modal);
    });
  }

  function install() {
    patchGlobalHelpers();
    installPublicApi();
    installCloseFallbacks();
    normalizeInitialState();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once: true });
  else install();

  /* BFCache/back-navigation must never restore a stale page lock. */
  window.addEventListener('pageshow', () => clearLegacyPageLock());
})();
