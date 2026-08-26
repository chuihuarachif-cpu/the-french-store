/* THE FRENCH STORE — R93 hard maintenance interaction guard.
   Complements the existing maintenance module. It only blocks UI interaction for
   nodes already marked as maintenance; Supabase remains the source of truth. */
(() => {
  'use strict';

  const VERSION = 'maintenance-interaction-lock-v1-20260826';
  const BLOCKED_SELECTOR = '.fs-game-maintenance,.fs-maintenance-item';
  let scheduled = false;

  function disableNode(node) {
    if (!(node instanceof HTMLElement)) return;
    node.setAttribute('aria-disabled', 'true');
    node.setAttribute('tabindex', '-1');
    if ('disabled' in node) {
      try { node.disabled = true; } catch {}
    }
    node.querySelectorAll('a,button,[role="button"],[tabindex]').forEach((child) => {
      child.setAttribute('aria-disabled', 'true');
      child.setAttribute('tabindex', '-1');
      if ('disabled' in child) {
        try { child.disabled = true; } catch {}
      }
    });
  }

  function restoreNode(node) {
    if (!(node instanceof HTMLElement)) return;
    if (node.matches(BLOCKED_SELECTOR)) return;
    if (node.dataset.fsMaintenanceLock !== '1') return;
    node.removeAttribute('aria-disabled');
    node.removeAttribute('tabindex');
    delete node.dataset.fsMaintenanceLock;
  }

  function applyLocks() {
    scheduled = false;
    document.querySelectorAll(BLOCKED_SELECTOR).forEach((node) => {
      node.dataset.fsMaintenanceLock = '1';
      disableNode(node);
    });
    document.querySelectorAll('[data-fs-maintenance-lock="1"]').forEach(restoreNode);
  }

  function scheduleLocks() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(applyLocks);
  }

  function isBlockedTarget(target) {
    return target instanceof Element ? target.closest(BLOCKED_SELECTOR) : null;
  }

  document.addEventListener('click', (event) => {
    if (!isBlockedTarget(event.target)) return;
    event.preventDefault();
    event.stopImmediatePropagation();
  }, true);

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    if (!isBlockedTarget(event.target)) return;
    event.preventDefault();
    event.stopImmediatePropagation();
  }, true);

  const observer = new MutationObserver(scheduleLocks);
  observer.observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
  document.addEventListener('fs:catalog-updated', scheduleLocks);
  scheduleLocks();

  window.FSMaintenanceInteractionLock = Object.freeze({ version: VERSION, refresh: scheduleLocks });
})();
