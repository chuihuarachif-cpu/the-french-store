/* THE FRENCH STORE — Buy Now v1
   Additive UX only. Reuses the existing cart + secure checkout path so player
   inputs, server-side prices, QR, Wallet and order RPCs remain authoritative. */
(() => {
  'use strict';

  const VERSION = 'buy-now-v1-20260823';
  let scheduled = false;

  function productIdFromAddButton(button) {
    const value = Number(button?.dataset?.add);
    return Number.isFinite(value) && value > 0 ? value : null;
  }

  function ensureStyle() {
    if (document.getElementById('fsBuyNowStyle')) return;
    const style = document.createElement('style');
    style.id = 'fsBuyNowStyle';
    style.textContent = `
      .fs-buy-actions{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
      .fs-buy-now{border:1px solid rgba(75,218,255,.5);background:linear-gradient(135deg,rgba(13,115,154,.96),rgba(7,66,101,.98));color:#f3fcff;border-radius:10px;padding:9px 12px;font:inherit;font-weight:800;cursor:pointer;white-space:nowrap;box-shadow:0 7px 18px rgba(0,0,0,.16)}
      .fs-buy-now:hover{filter:brightness(1.08)}
      .fs-buy-now:disabled{opacity:.55;cursor:wait}
      .package-row .fs-buy-actions,.r6-package-actions .fs-buy-actions{justify-content:flex-end}
      @media(max-width:560px){.fs-buy-actions{width:100%}.fs-buy-actions .add-btn,.fs-buy-actions .fs-buy-now{flex:1;min-width:0}}
    `;
    document.head.appendChild(style);
  }

  async function ensureCheckoutFeature() {
    if (!window.FSFeatureLoader?.ensure) throw new Error('FEATURE_LOADER_UNAVAILABLE');
    await window.FSFeatureLoader.ensure('checkout');
  }

  function cartHasProduct(productId) {
    try {
      return Array.isArray(cart) && cart.some((item) => Number(item?.product_id) === productId);
    } catch {
      return false;
    }
  }

  function cartCount() {
    try {
      return Array.isArray(cart) ? cart.reduce((n, item) => n + Number(item?.quantity || 0), 0) : 0;
    } catch {
      return 0;
    }
  }

  function openExistingCart() {
    if (typeof renderCart === 'function') renderCart();
    if (typeof openModal === 'function') openModal('cartModal');
  }

  async function buyNow(button, productId) {
    const old = button.textContent;
    button.disabled = true;
    button.textContent = 'Preparando…';
    try {
      await ensureCheckoutFeature();
      if (typeof currentProduct !== 'function' || !currentProduct(productId)) return;

      // Never discard an existing customer cart. Buy Now means: ensure one unit of
      // this product is present and open the existing secure checkout immediately.
      // If the product was already present, do not create an accidental duplicate.
      if (!cartHasProduct(productId)) {
        if (typeof addToCart !== 'function') throw new Error('CART_UNAVAILABLE');
        addToCart(productId);
      }
      openExistingCart();

      const result = document.getElementById('checkoutResult');
      if (result && cartCount() > 1 && typeof showNotice === 'function') {
        showNotice(result,'Comprar ahora abrió tu carrito. Ya tenías otros productos: revísalos antes de pagar.','');
      } else if (result && typeof hideNotice === 'function') {
        hideNotice(result);
      }
    } catch {
      const result = document.getElementById('checkoutResult');
      if (result && typeof showNotice === 'function') {
        showNotice(result,'No se pudo preparar la compra segura. Recarga la página e inténtalo nuevamente.','error');
      }
    } finally {
      if (button.isConnected) {
        button.disabled = false;
        button.textContent = old;
      }
    }
  }

  function decorateAddButton(addButton) {
    if (!addButton || addButton.dataset.fsBuyNowDecorated === '1') return;
    const productId = productIdFromAddButton(addButton);
    if (!productId) return;

    addButton.dataset.fsBuyNowDecorated = '1';
    const parent = addButton.parentElement;
    if (!parent) return;

    let actions = addButton.closest('.fs-buy-actions');
    if (!actions) {
      actions = document.createElement('span');
      actions.className = 'fs-buy-actions';
      parent.insertBefore(actions, addButton);
      actions.appendChild(addButton);
    }

    const buy = document.createElement('button');
    buy.type = 'button';
    buy.className = 'fs-buy-now';
    buy.dataset.fsBuyNow = String(productId);
    buy.textContent = 'Comprar ahora';
    buy.setAttribute('aria-label','Comprar este producto ahora');
    buy.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      buyNow(buy, productId);
    });
    actions.insertBefore(buy, addButton);
  }

  function decorate() {
    scheduled = false;
    ensureStyle();
    document.querySelectorAll('#catalogList [data-add],#featuredList [data-add]').forEach(decorateAddButton);
  }

  function schedule() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(decorate);
  }

  function install() {
    ensureStyle();
    ['catalogList','featuredList'].forEach((id) => {
      const root = document.getElementById(id);
      if (!root) return;
      new MutationObserver(schedule).observe(root,{childList:true,subtree:true});
    });
    document.addEventListener('click',(event) => {
      if (event.target.closest?.('[data-r6-game],[data-r6-feature],[data-r6-back],[data-cat]')) schedule();
    },true);
    schedule();
  }

  window.FSBuyNow = Object.freeze({ version: VERSION, refresh: schedule });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',install,{once:true});
  else install();
})();