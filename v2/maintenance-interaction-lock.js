/* THE FRENCH STORE — R93 hard maintenance interaction guard.
   Complements the existing maintenance module. It only blocks UI interaction for
   nodes already marked as maintenance; Supabase remains the source of truth. */
(() => {
  'use strict';

  const VERSION = 'maintenance-interaction-lock-v2-20260826';
  const BLOCKED_SELECTOR = '.fs-game-maintenance,.fs-maintenance-item';
  let scheduled = false;

  function lockFocusable(element, owner) {
    if (!(element instanceof HTMLElement)) return;
    if (element.dataset.fsMaintenanceFocusLock === '1') return;
    element.dataset.fsMaintenanceFocusLock = '1';
    element.dataset.fsMaintenancePrevTabindex = element.hasAttribute('tabindex') ? element.getAttribute('tabindex') : '__NONE__';
    element.setAttribute('aria-disabled', 'true');
    element.setAttribute('tabindex', '-1');
    if (owner) element.dataset.fsMaintenanceOwner = owner;
  }

  function unlockFocusable(element) {
    if (!(element instanceof HTMLElement) || element.dataset.fsMaintenanceFocusLock !== '1') return;
    const previous = element.dataset.fsMaintenancePrevTabindex;
    if (previous === '__NONE__') element.removeAttribute('tabindex');
    else if (previous != null) element.setAttribute('tabindex', previous);
    element.removeAttribute('aria-disabled');
    delete element.dataset.fsMaintenanceFocusLock;
    delete element.dataset.fsMaintenancePrevTabindex;
    delete element.dataset.fsMaintenanceOwner;
  }

  function lockNode(node) {
    if (!(node instanceof HTMLElement)) return;
    const owner = node.dataset.fsMaintenanceLockId || `m${Math.random().toString(36).slice(2,9)}`;
    node.dataset.fsMaintenanceLockId = owner;
    node.dataset.fsMaintenanceLock = '1';
    lockFocusable(node, owner);
    node.querySelectorAll('a,button,[role="button"],[tabindex]').forEach((child) => lockFocusable(child, owner));
  }

  function restoreNode(node) {
    if (!(node instanceof HTMLElement)) return;
    if (node.matches(BLOCKED_SELECTOR)) return;
    if (node.dataset.fsMaintenanceLock !== '1') return;
    const owner = node.dataset.fsMaintenanceLockId || '';
    unlockFocusable(node);
    if (owner) node.querySelectorAll(`[data-fs-maintenance-owner="${owner}"]`).forEach(unlockFocusable);
    delete node.dataset.fsMaintenanceLock;
    delete node.dataset.fsMaintenanceLockId;
  }

  function applyLocks() {
    scheduled = false;
    document.querySelectorAll(BLOCKED_SELECTOR).forEach(lockNode);
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
