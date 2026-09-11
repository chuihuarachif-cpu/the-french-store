/* THE FRENCH STORE — visual tier layer: confirmation events.
   Presentation only.

   This module does NOT decide whether a payment happened and does not touch
   bisa-checkout.js or bisa-wallet.js. It observes the DOM marker those
   modules render only after the backend reports the confirmation:

     bisa-checkout.js setPaymentUi() -> paid === true
     bisa-wallet.js   setTopupUi()   -> credited === true

   Both write the same markers: `.payment-state.paid` on the state line and
   `.payment-complete-box` on the QR box. A browser click can never produce
   them, so a click can never trigger the money sound. If the payment modules
   ever stop rendering those markers, this module simply goes quiet — it can
   never report a payment that did not happen. */
(() => {
  'use strict';

  const VERSION = 'tier-events-v1-20260911';

  /* modal id -> what a confirmation there means */
  const WATCHED = Object.freeze({
    qrModal: 'order',
    topupQrModal: 'wallet'
  });

  const fired = new Set();
  const observers = new Map();

  function tier() {
    return document.documentElement.dataset.fsTier || null;
  }

  function isConfirmed(modal) {
    return !!modal.querySelector('.payment-state.paid, .payment-complete-box');
  }

  function celebrate(modal, kind) {
    if (fired.has(kind)) return;
    fired.add(kind);

    const level = tier();
    if (!level) return;

    try { window.FSTierSound?.money?.(level); } catch {}

    /* Restrained visual echo: one scale-in on the checkmark. transform and
       opacity only, and it never blocks or delays anything. */
    const mark = modal.querySelector('.payment-checkmark');
    if (mark) {
      mark.classList.remove('fs-tier-confirm');
      void mark.offsetWidth; // restart the animation if it already ran
      mark.classList.add('fs-tier-confirm');
    }
  }

  function watch(id) {
    const modal = document.getElementById(id);
    if (!modal || observers.has(id)) return;

    const kind = WATCHED[id];
    const check = () => {
      if (!modal.classList.contains('open')) {
        /* Reset when the surface closes so the next payment can sound. */
        fired.delete(kind);
        return;
      }
      if (isConfirmed(modal)) celebrate(modal, kind);
    };

    const observer = new MutationObserver(check);
    observer.observe(modal, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ['class']
    });
    observers.set(id, observer);
    check();
  }

  function start() {
    for (const id of Object.keys(WATCHED)) watch(id);

    /* The payment modals exist in the shell, but guard against a late shell
       in case markup order ever changes. */
    if (observers.size < Object.keys(WATCHED).length) {
      const retry = new MutationObserver(() => {
        for (const id of Object.keys(WATCHED)) watch(id);
        if (observers.size === Object.keys(WATCHED).length) retry.disconnect();
      });
      retry.observe(document.body, { childList: true, subtree: true });
    }
  }

  window.FSTierEvents = Object.freeze({
    version: VERSION,
    watched: () => [...observers.keys()],
    firedKinds: () => [...fired],
    /* Test-only: verify the wiring without a real payment. */
    __check: () => { for (const id of Object.keys(WATCHED)) { const m = document.getElementById(id); if (m?.classList.contains('open') && isConfirmed(m)) celebrate(m, WATCHED[id]); } }
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
})();
