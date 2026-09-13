/* 💎 French Store 💎 — manual fulfillment capability shim.
   Supplier automation is currently disabled. Keep the small public API so
   existing UI modules fail closed without calling the Worker. */
(() => {
  'use strict';

  const manual = Object.freeze({ known: true, automatic: false, mixed: false });
  const api = Object.freeze({
    version: 'manual-fulfillment-20260913',
    load: async () => true,
    reload: async () => true,
    capability: () => null,
    verificationRequired: () => false,
    isAutomatic: () => false,
    classifyProducts: async () => manual
  });

  window.FSAutomationCapabilities = api;
})();
