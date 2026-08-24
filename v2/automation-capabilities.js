/* THE FRENCH STORE — safe storefront automation capability client.
   Reads only sanitized product flags from the Worker. Provider identity/codes,
   prices, balances and secrets never reach this module. Failure is fail-closed:
   an unknown product is treated as manual/non-automatic. */
(() => {
  'use strict';

  const VERSION = 'automation-capabilities-v1-20260824';
  const API_URL = 'https://api.frenchstorebo.com/api/storefront-automation-capabilities';
  const state = { loaded:false, loading:null, byProduct:new Map() };

  function productId(value) {
    const id = Number(value);
    return Number.isSafeInteger(id) && id > 0 ? id : null;
  }

  async function load(force = false) {
    if (state.loaded && !force) return true;
    if (state.loading && !force) return state.loading;
    state.loading = (async () => {
      try {
        const response = await fetch(API_URL, {
          method: 'GET',
          mode: 'cors',
          cache: 'no-store',
          headers: { Accept: 'application/json' }
        });
        const data = await response.json().catch(() => null);
        if (!response.ok || data?.ok !== true || !Array.isArray(data?.products)) throw new Error('CAPABILITIES_UNAVAILABLE');
        const map = new Map();
        data.products.forEach((row) => {
          const id = productId(row?.product_id);
          if (!id) return;
          map.set(id, {
            verificationRequired: row?.verification_required === true,
            automatic24x7: row?.automatic_24_7 === true
          });
        });
        state.byProduct = map;
        state.loaded = true;
        return true;
      } catch {
        state.loaded = false;
        state.byProduct = new Map();
        return false;
      } finally {
        state.loading = null;
      }
    })();
    return state.loading;
  }

  function capability(value) {
    const id = productId(value);
    return id ? state.byProduct.get(id) || null : null;
  }

  function verificationRequired(value) {
    return capability(value)?.verificationRequired === true;
  }

  function isAutomatic(value) {
    return capability(value)?.automatic24x7 === true;
  }

  async function classifyProducts(values) {
    const ids = [...new Set((Array.isArray(values) ? values : []).map(productId).filter(Boolean))];
    const loaded = await load();
    if (!loaded || !ids.length) return { known:false, automatic:false, mixed:false };
    const flags = ids.map((id) => isAutomatic(id));
    const automatic = flags.every(Boolean);
    const mixed = flags.some(Boolean) && !automatic;
    return { known:true, automatic, mixed };
  }

  window.FSAutomationCapabilities = Object.freeze({
    version: VERSION,
    load,
    reload: () => load(true),
    capability,
    verificationRequired,
    isAutomatic,
    classifyProducts
  });

  load().catch(() => {});
})();
