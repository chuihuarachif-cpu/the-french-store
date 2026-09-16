/* FRENCH STORE R167 — data-only seasonal event bridge. No visual effects here. */
(() => {
  'use strict';
  const root = document.documentElement;
  let signature = '';
  function publish(value) {
    const events = Array.isArray(value) ? value.filter(x => x && typeof x.slug === 'string') : [];
    const slugs = events.map(x => String(x.slug));
    const keys = events.map(x => String(x.decoration_key || x.slug));
    const next = JSON.stringify([slugs, keys]);
    if (slugs.length) {
      root.dataset.fsSeasonalEvents = slugs.join(',');
      root.dataset.fsSeasonalPrimary = slugs[0];
    } else {
      delete root.dataset.fsSeasonalEvents;
      delete root.dataset.fsSeasonalPrimary;
    }
    window.FSSeasonal = Object.freeze({ version:'r167', events, slugs, decorationKeys:keys, refreshedAt:new Date().toISOString() });
    if (next !== signature) {
      signature = next;
      window.dispatchEvent(new CustomEvent('fs:seasonal-events', { detail:{ events, slugs, decorationKeys:keys } }));
    }
  }
  async function refresh() {
    try {
      if (typeof sb === 'undefined' || !sb?.rpc) return publish([]);
      const { data, error } = await sb.rpc('storefront_active_seasonal_events');
      if (error) throw error;
      publish(data);
    } catch (error) {
      console.warn('FRENCH STORE seasonal events unavailable:', String(error?.message || error).slice(0,120));
      publish([]);
    }
  }
  refresh();
  setInterval(refresh, 15 * 60 * 1000);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') refresh(); });
})();
