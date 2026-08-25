/* THE FRENCH STORE — deterministic package ordering for Recargas por ID.
   Goal:
   - Mobile Legends normal Pase Semanal is the first package and marked POPULAR.
   - Pure in-game currency packages follow, ordered by delivered quantity ascending.
   - Mobile Legends x2/Event diamonds use the EFFECTIVE delivered amount:
       50+50 => 100, 150+150 => 300, 500+500 => 1000, etc.
   - Other passes/subscriptions/bundles stay after pure currency packages.
   - Other categories keep their existing order.

   This is presentation-only. It does not change prices, product IDs, providers or checkout data.
*/
(() => {
  'use strict';

  const RESOURCE_RE = /(diamant|diamond|\buc\b|\bcp\b|coin|moneda|cristal|crystal|gem|jade|bond|robux|v[- ]?bucks?|point|punto|credit|token|gold|oro|cash|coupon|cupon)/i;
  const PASS_RE = /(pase|pass|weekly|semanal|mensual|crep[uú]sculo|twilight|subscription|suscripci[oó]n|membres[ií]a|membership|battle\s*(?:pass|bounty)|elite\s*pass|\blv\.?\s*\d|level\s*\d)/i;
  const EVENT_RE = /(evento|event|x\s*2|2\s*x|doble|double)/i;

  let scheduled = false;

  function norm(value) {
    return String(value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '');
  }

  function isFeaturedMlbbWeeklyPass(game, name) {
    return norm(game).includes('mobilelegends') && norm(name) === 'pasesemanal';
  }

  function parseCountToken(token) {
    const clean = String(token || '').replace(/[^0-9.,]/g, '');
    if (!clean) return NaN;

    // Package quantities are integral in the recharge catalog. Treat punctuation
    // between digit groups as a thousands separator (1.000 / 1,000 -> 1000).
    const compact = clean.replace(/[.,]/g, '');
    const n = Number(compact);
    return Number.isFinite(n) ? n : NaN;
  }

  function quantityFromName(name) {
    const tokens = String(name || '').match(/\d[\d.,]*/g) || [];
    const nums = tokens.map(parseCountToken).filter(Number.isFinite);
    if (!nums.length) return Number.POSITIVE_INFINITY;

    // For recharge packs written as A+B (bonus/event), the customer receives
    // the combined amount. This is especially important for MLBB x2/Event packs.
    return nums.reduce((sum, n) => sum + n, 0);
  }

  function priceFromNode(node) {
    const raw = node?.querySelector?.('.r6-package-actions b, .package-price')?.textContent || '';
    const normalized = raw
      .replace(/[^0-9.,-]/g, '')
      .replace(/\./g, '')
      .replace(',', '.');
    const n = Number(normalized);
    return Number.isFinite(n) ? n : Number.POSITIVE_INFINITY;
  }

  function keyFor(name, game, node) {
    const text = String(name || '').trim();
    const mlbb = norm(game).includes('mobilelegends');
    const featuredWeeklyPass = isFeaturedMlbbWeeklyPass(game, text);
    const mlbbLabeledEvent = mlbb && /diamant|diamond/i.test(text) && EVENT_RE.test(text);
    const mlbbGemX2 = mlbb && /💎/.test(text) && /\d[\d.,]*\s*\+\s*\d[\d.,]*/.test(text);
    const mlbbEventDiamonds = mlbbLabeledEvent || mlbbGemX2;
    const hasResource = RESOURCE_RE.test(text) || mlbbGemX2;
    const passLike = PASS_RE.test(text);
    const pureCurrency = hasResource && (!passLike || mlbbEventDiamonds);

    return {
      group: featuredWeeklyPass ? -1 : (pureCurrency ? 0 : 1),
      quantity: featuredWeeklyPass ? -1 : (pureCurrency ? quantityFromName(text) : Number.POSITIVE_INFINITY),
      price: priceFromNode(node),
      name: text
    };
  }

  function compareEntries(a, b) {
    if (a.key.group !== b.key.group) return a.key.group - b.key.group;
    if (a.key.quantity !== b.key.quantity) return a.key.quantity - b.key.quantity;
    if (a.key.price !== b.key.price) return a.key.price - b.key.price;
    return a.key.name.localeCompare(b.key.name, 'es', { numeric: true, sensitivity: 'base' });
  }

  function currentCategoryIsRechargeById() {
    try {
      return typeof category !== 'undefined' && category === 'Recargas por ID';
    } catch {
      return false;
    }
  }

  function decorateFeaturedNode(node, game, name) {
    if (!node) return;
    const featured = isFeaturedMlbbWeeklyPass(game, name);
    node.classList.toggle('fs-featured-weekly-pass', featured);

    const existing = node.querySelector(':scope > .fs-popular-badge');
    if (featured && !existing) {
      const badge = document.createElement('span');
      badge.className = 'fs-popular-badge';
      badge.textContent = 'POPULAR';
      badge.setAttribute('aria-label', 'Producto popular');
      node.appendChild(badge);
    } else if (!featured && existing) {
      existing.remove();
    }
  }

  function reorderNodes(container, nodes, getName, game) {
    if (!container || nodes.length < 2) return;

    const entries = nodes.map((node) => ({
      node,
      key: keyFor(getName(node), game, node)
    }));
    const sorted = [...entries].sort(compareEntries).map((entry) => entry.node);
    const changed = nodes.some((node, index) => node !== sorted[index]);
    if (!changed) return;

    const fragment = document.createDocumentFragment();
    sorted.forEach((node) => fragment.appendChild(node));
    container.appendChild(fragment);
  }

  function sortR6Detail() {
    if (!currentCategoryIsRechargeById()) return;

    const detail = document.querySelector('#catalogList .r6-game-detail');
    const grid = detail?.querySelector?.('.r6-package-grid');
    if (!detail || !grid) return;

    const game = detail.querySelector('.r6-hero-copy h3')?.textContent || '';
    const cards = [...grid.children].filter((node) => node.classList?.contains('r6-package-card'));
    reorderNodes(
      grid,
      cards,
      (node) => node.querySelector('.r6-package-copy strong')?.textContent || '',
      game
    );
    cards.forEach((node) => {
      const name = node.querySelector('.r6-package-copy strong')?.textContent || '';
      decorateFeaturedNode(node, game, name);
    });
  }

  function sortLegacyCatalog() {
    if (!currentCategoryIsRechargeById()) return;

    document.querySelectorAll('#catalogList .game-card').forEach((card) => {
      const list = card.querySelector('.package-list');
      if (!list) return;
      const game = card.querySelector('.game-info b')?.textContent || '';
      const rows = [...list.children].filter((node) => node.classList?.contains('package-row'));
      reorderNodes(
        list,
        rows,
        (node) => node.querySelector('.package-name')?.textContent || '',
        game
      );
      rows.forEach((node) => {
        const name = node.querySelector('.package-name')?.textContent || '';
        decorateFeaturedNode(node, game, name);
      });
    });
  }

  function sortVisiblePackages() {
    scheduled = false;
    sortR6Detail();
    sortLegacyCatalog();
  }

  function scheduleSort() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(sortVisiblePackages);
  }

  function install() {
    const catalog = document.getElementById('catalogList');
    if (!catalog) return;

    scheduleSort();
    const observer = new MutationObserver(() => scheduleSort());
    observer.observe(catalog, { childList: true, subtree: true });

    // R6 writes the detail view synchronously after a game click. Scheduling from
    // capture phase guarantees a post-render sort without replacing R6 logic.
    catalog.addEventListener('click', () => scheduleSort(), true);
    document.getElementById('categoryTabs')?.addEventListener('click', () => scheduleSort(), true);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once: true });
  else install();
})();
