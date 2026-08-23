/* THE FRENCH STORE — Buy Now v2
   Two clear actions stay available on each package:
   - Comprar ahora: opens the existing secure checkout immediately.
   - Añadir al carrito: keeps shopping and supports repeated quantities.
   No second payment/order implementation is introduced. */
(() => {
  'use strict';

  const VERSION = 'buy-now-v2-20260823';
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
      .fs-buy-actions .add-btn{white-space:nowrap}
      .package-row .fs-buy-actions,.r6-package-actions .fs-buy-actions{justify-content:flex-end}
      #cartModal.fs-buy-now-mode .modal-card{box-shadow:0 22px 70px rgba(0,0,0,.48),0 0 0 1px rgba(54,206,255,.16)}
      @media(max-width:560px){.fs-buy-actions{width:100%}.fs-buy-actions .add-btn,.fs-buy-actions .fs-buy-now{flex:1;min-width:0;padding:10px 8px}}
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

  function cartHeading() {
    const modal = document.getElementById('cartModal');
    return {
      modal,
      eyebrow: modal?.querySelector('.eyebrow') || null,
      title: modal?.querySelector('h2') || null
    };
  }

  function setQuickMode(enabled) {
    const { modal, eyebrow, title } = cartHeading();
    if (!modal) return;
    modal.classList.toggle('fs-buy-now-mode', enabled);
    if (eyebrow) eyebrow.textContent = enabled ? 'COMPRA RÁPIDA' : 'TU COMPRA';
    if (title) title.textContent = enabled ? 'Finalizar compra' : 'Carrito';
  }

  function openExistingCheckout() {
    if (typeof renderCart === 'function') renderCart();
    setQuickMode(true);
    if (typeof openModal === 'function') openModal('cartModal');
    requestAnimationFrame(() => {
      try { window.FSPlayerVerify?.syncCartInputs?.(); } catch {}
      const target = document.getElementById('fulfillmentInputs') || document.querySelector('#cartModal .checkout-grid');
      target?.scrollIntoView?.({ block:'nearest', behavior:'smooth' });
    });
  }

  async function buyNow(button, productId) {
    const old = button.textContent;
    button.disabled = true;
    button.textContent = 'Preparando…';
    try {
      await ensureCheckoutFeature();
      if (typeof currentProduct !== 'function' || !currentProduct(productId)) return;

      // Never erase an existing cart. If this product is not already present, add
      // exactly one unit. If it is already there (for example 3 Weekly Passes), keep
      // the customer's chosen quantity intact and jump directly to checkout.
      if (!cartHasProduct(productId)) {
        if (typeof addToCart !== 'function') throw new Error('CART_UNAVAILABLE');
        addToCart(productId);
      }
      openExistingCheckout();

      const result = document.getElementById('checkoutResult');
      if (result && cartCount() > 1 && typeof showNotice === 'function') {
        showNotice(result,'Revisa las cantidades y datos del juego antes de pagar.','');
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
    addButton.textContent = 'Añadir al carrito';
    addButton.setAttribute('aria-label','Añadir este producto al carrito');

    addButton.addEventListener('click', () => {
      const expected = 'Añadir al carrito';
      requestAnimationFrame(() => {
        if (!addButton.isConnected) return;
        addButton.textContent = 'Añadido ✓';
        setTimeout(() => { if (addButton.isConnected) addButton.textContent = expected; }, 700);
      });
    });

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
      const target = event.target.closest?.('button,a');
      if (!target) return;
      if (target.id === 'cartButton' || target.id === 'cartInline') setQuickMode(false);
      if (target.dataset.close === 'cartModal') setQuickMode(false);
      if (target.matches?.('[data-r6-game],[data-r6-feature],[data-r6-back],[data-cat]')) schedule();
    },true);
    schedule();
  }

  window.FSBuyNow = Object.freeze({ version: VERSION, refresh: schedule, setQuickMode });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',install,{once:true});
  else install();
})();
