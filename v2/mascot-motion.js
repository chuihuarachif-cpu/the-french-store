/* THE FRENCH STORE — Chibi mascot motion layer v2 (visual only).
   Safer “living mascot” version with micro-interactions, particles and layered effects.
   It must never change Auth, prices, cart truth, Wallet balances, QR/payment truth or backend calls. */
(() => {
  'use strict';

  const VERSION = 'chibi-mascot-motion-v2-20260901';
  const ASSETS = Object.freeze({
    neutral: './assets/mascot/mascot-neutral.webp',
    login: './assets/mascot/mascot-login.webp',
    qr: './assets/mascot/mascot-qr.webp',
    shopping: './assets/mascot/mascot-shopping.webp',
    success: './assets/mascot/mascot-success.webp'
  });

  const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches === true;
  const slots = new Map();
  const timers = new WeakMap();
  const observers = [];

  function markError(slot) {
    slot?.classList.add('is-error');
  }

  function ensureAsset(slot) {
    if (!slot) return;
    const img = slot.querySelector('.fs-chibi-img');
    if (!img || img.dataset.loaded === '1' || img.dataset.loading === '1') return;
    img.dataset.loading = '1';
    slot.classList.add('is-busy');
    img.addEventListener('load', () => {
      img.dataset.loaded = '1';
      delete img.dataset.loading;
      slot.classList.remove('is-busy');
      slot.classList.add('is-ready');
    }, { once: true });
    img.addEventListener('error', () => markError(slot), { once: true });
    img.src = img.dataset.src;
  }

  function clearReactionClasses(slot) {
    if (!slot) return;
    slot.classList.remove(
      'is-reacting',
      'is-wave',
      'is-scan',
      'is-shop',
      'is-celebrate',
      'is-blink'
    );
  }

  function forceReplay(slot) {
    void slot.offsetWidth;
  }

  function react(slotOrKey, reaction = 'reacting') {
    const slot = typeof slotOrKey === 'string' ? slots.get(slotOrKey) : slotOrKey;
    if (!slot) return;
    ensureAsset(slot);
    if (reduceMotion) return;

    const oldTimer = timers.get(slot);
    if (oldTimer) clearTimeout(oldTimer);

    clearReactionClasses(slot);
    forceReplay(slot);
    const className = `is-${reaction}`;
    slot.classList.add(className);

    const durationMap = {
      reacting: 760,
      wave: 980,
      scan: 1200,
      shop: 900,
      celebrate: 1300,
      blink: 240
    };
    const timer = setTimeout(() => clearReactionClasses(slot), durationMap[reaction] || 800);
    timers.set(slot, timer);
  }

  function blink(slotOrKey) {
    const slot = typeof slotOrKey === 'string' ? slots.get(slotOrKey) : slotOrKey;
    if (!slot || reduceMotion) return;
    slot.classList.add('is-blink');
    setTimeout(() => slot.classList.remove('is-blink'), 220);
  }

  function scheduleAutoBlink(slot) {
    if (!slot || reduceMotion) return;
    const loop = () => {
      if (!slot.isConnected) return;
      const wait = 2400 + Math.floor(Math.random() * 2600);
      setTimeout(() => {
        if (!slot.isConnected) return;
        if (slot.classList.contains('is-ready')) blink(slot);
        loop();
      }, wait);
    };
    loop();
  }

  function addPointerReaction(slot, reaction) {
    if (!slot) return;

    slot.addEventListener('pointerdown', () => react(slot, reaction), { passive: true });

    if (reduceMotion || !window.matchMedia?.('(pointer:fine)')?.matches) return;

    slot.addEventListener('pointermove', (event) => {
      const rect = slot.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      slot.style.setProperty('--fs-chibi-tilt-y', `${(x * 7).toFixed(2)}deg`);
      slot.style.setProperty('--fs-chibi-tilt-x', `${(-y * 5).toFixed(2)}deg`);
    }, { passive: true });

    slot.addEventListener('pointerleave', () => {
      slot.style.setProperty('--fs-chibi-tilt-x', '0deg');
      slot.style.setProperty('--fs-chibi-tilt-y', '0deg');
    }, { passive: true });
  }

  function createDecor(className) {
    const node = document.createElement('span');
    node.className = className;
    node.setAttribute('aria-hidden', 'true');
    return node;
  }

  function createSlot(key, asset, variant, reaction, label) {
    const slot = document.createElement('div');
    slot.className = `fs-chibi-slot fs-chibi-slot--${variant}`;
    slot.dataset.fsChibi = key;
    slot.dataset.fsReaction = reaction;
    slot.setAttribute('role', 'img');
    slot.setAttribute('aria-label', label);

    const stage = document.createElement('div');
    stage.className = 'fs-chibi-stage';

    const aura = createDecor('fs-chibi-aura');
    const shadow = createDecor('fs-chibi-shadow');
    const actor = document.createElement('div');
    actor.className = 'fs-chibi-actor';

    const img = document.createElement('img');
    img.className = 'fs-chibi-img';
    img.alt = '';
    img.loading = key === 'profile' ? 'lazy' : 'eager';
    img.decoding = 'async';
    img.draggable = false;
    img.dataset.src = asset;

    const eyes = createDecor('fs-chibi-eyes');
    const scanline = createDecor('fs-chibi-scanline');
    const sparkles = createDecor('fs-chibi-sparkles');
    const chips = createDecor('fs-chibi-chips');

    actor.append(img, eyes, scanline, sparkles, chips);
    stage.append(aura, shadow, actor);
    slot.appendChild(stage);

    slots.set(key, slot);
    addPointerReaction(slot, reaction);
    scheduleAutoBlink(slot);
    return slot;
  }

  function insertAfter(reference, node) {
    if (!reference?.parentNode || !node) return false;
    reference.parentNode.insertBefore(node, reference.nextSibling);
    return true;
  }

  function observeAttributes(node, callback, attributeFilter) {
    if (!node) return;
    const observer = new MutationObserver(callback);
    observer.observe(node, { attributes: true, attributeFilter });
    observers.push(observer);
  }

  function observeChildren(node, callback) {
    if (!node) return;
    const observer = new MutationObserver(callback);
    observer.observe(node, { childList: true, subtree: true, characterData: true });
    observers.push(observer);
  }

  function mount() {
    if (document.documentElement.dataset.fsChibiMounted === '1') return;
    document.documentElement.dataset.fsChibiMounted = '1';

    const authCard = document.querySelector('#authModal .modal-card');
    if (authCard && !authCard.querySelector('[data-fs-chibi="login"]')) {
      const slot = createSlot('login', ASSETS.login, 'login', 'wave', 'Mascota FRENCH STORE dando la bienvenida');
      const intro = [...authCard.children].find((el) => el.tagName === 'P');
      if (intro) insertAfter(intro, slot); else authCard.prepend(slot);
    }

    const cartCard = document.querySelector('#cartModal .modal-card');
    if (cartCard && !cartCard.querySelector('[data-fs-chibi="cart"]')) {
      const slot = createSlot('cart', ASSETS.shopping, 'cart', 'shop', 'Mascota FRENCH STORE de compras');
      const cartItems = document.getElementById('cartItems');
      if (cartItems) cartCard.insertBefore(slot, cartItems); else cartCard.appendChild(slot);
    }

    ['qrModal', 'topupQrModal'].forEach((modalId, index) => {
      const modal = document.getElementById(modalId);
      const qrBox = modal?.querySelector('.qr-box');
      if (!modal || !qrBox || modal.querySelector('[data-fs-chibi^="qr"]')) return;
      const key = index === 0 ? 'qr' : 'qrTopup';
      const slot = createSlot(key, ASSETS.qr, 'qr', 'scan', 'Mascota FRENCH STORE señalando el pago QR');
      insertAfter(qrBox, slot);
    });

    const walletPanel = document.querySelector('#view-wallet .panel');
    const balance = walletPanel?.querySelector('.balance-card');
    if (walletPanel && balance && !walletPanel.querySelector('[data-fs-chibi="wallet"]')) {
      const slot = createSlot('wallet', ASSETS.shopping, 'wallet', 'shop', 'Mascota FRENCH STORE con French Wallet');
      insertAfter(balance, slot);
    }

    const ordersPanel = document.querySelector('#view-pedidos .panel');
    const ordersHead = ordersPanel?.querySelector('.panel-head');
    if (ordersPanel && ordersHead && !ordersPanel.querySelector('[data-fs-chibi="orders"]')) {
      const slot = createSlot('orders', ASSETS.success, 'orders', 'celebrate', 'Mascota FRENCH STORE celebrando el estado del pedido');
      insertAfter(ordersHead, slot);
    }

    const profilePanel = document.querySelector('#view-perfil .profile-panel');
    const profileTitle = profilePanel?.querySelector('h2');
    if (profilePanel && profileTitle && !profilePanel.querySelector('[data-fs-chibi="profile"]')) {
      const slot = createSlot('profile', ASSETS.neutral, 'profile', 'reacting', 'Mascota FRENCH STORE');
      insertAfter(profileTitle, slot);
    }

    installObservers();
    installActionReactions();
    activateVisible();
  }

  function observeOpen(modalId, slotKey, reaction) {
    const modal = document.getElementById(modalId);
    const slot = slots.get(slotKey);
    if (!modal || !slot) return;
    const update = () => {
      if (modal.classList.contains('open') || modal.getAttribute('aria-hidden') === 'false') {
        ensureAsset(slot);
        react(slot, reaction);
      }
    };
    observeAttributes(modal, update, ['class', 'aria-hidden']);
    update();
  }

  function observeView(viewId, slotKey, reaction) {
    const view = document.getElementById(viewId);
    const slot = slots.get(slotKey);
    if (!view || !slot) return;
    const update = () => {
      if (view.classList.contains('active')) {
        ensureAsset(slot);
        react(slot, reaction);
      }
    };
    observeAttributes(view, update, ['class']);
    update();
  }

  function installObservers() {
    observeOpen('authModal', 'login', 'wave');
    observeOpen('cartModal', 'cart', 'shop');
    observeOpen('qrModal', 'qr', 'scan');
    observeOpen('topupQrModal', 'qrTopup', 'scan');
    observeView('view-wallet', 'wallet', 'shop');
    observeView('view-pedidos', 'orders', 'celebrate');
    observeView('view-perfil', 'profile', 'reacting');

    const watchQrImage = (modalId, slotKey) => {
      const img = document.querySelector(`#${modalId} .qr-box img`);
      if (!img) return;
      observeAttributes(img, () => {
        if (img.getAttribute('src')) react(slotKey, 'scan');
      }, ['src']);
    };
    watchQrImage('qrModal', 'qr');
    watchQrImage('topupQrModal', 'qrTopup');

    const ordersList = document.getElementById('ordersList');
    if (ordersList) {
      observeChildren(ordersList, () => {
        if (!document.getElementById('view-pedidos')?.classList.contains('active')) return;
        const text = ordersList.textContent || '';
        react('orders', /ENTREGADO|COMPLETADO|PAGADO|APROBADO/i.test(text) ? 'celebrate' : 'reacting');
      });
    }

    const cartItems = document.getElementById('cartItems');
    if (cartItems) {
      observeChildren(cartItems, () => {
        if (document.getElementById('cartModal')?.classList.contains('open')) react('cart', 'shop');
      });
    }
  }

  function installActionReactions() {
    document.addEventListener('click', (event) => {
      const target = event.target instanceof Element ? event.target.closest('button,a,[data-nav]') : null;
      if (!target) return;
      if (target.id === 'authChoiceGoogle' || target.id === 'authButton') react('login', 'wave');
      if (target.id === 'cartButton' || target.id === 'cartInline' || target.id === 'checkoutWallet' || target.id === 'checkoutQR') react('cart', 'shop');
      if (target.id === 'requestTopup' || target.id === 'refreshWallet') react('wallet', 'shop');
      if (target.id === 'qrWhatsapp') react('qr', 'scan');
      if (target.id === 'cancelTopupRequest') react('qrTopup', 'scan');
      if (target.id === 'refreshOrders' || target.dataset.nav === 'pedidos') react('orders', 'celebrate');
      if (target.dataset.nav === 'perfil') react('profile', 'reacting');
      if (target.dataset.nav === 'wallet') react('wallet', 'shop');
    }, true);
  }

  function activateVisible() {
    if (document.getElementById('authModal')?.classList.contains('open')) ensureAsset(slots.get('login'));
    if (document.getElementById('cartModal')?.classList.contains('open')) ensureAsset(slots.get('cart'));
    if (document.getElementById('qrModal')?.classList.contains('open')) ensureAsset(slots.get('qr'));
    if (document.getElementById('topupQrModal')?.classList.contains('open')) ensureAsset(slots.get('qrTopup'));
    if (document.getElementById('view-wallet')?.classList.contains('active')) ensureAsset(slots.get('wallet'));
    if (document.getElementById('view-pedidos')?.classList.contains('active')) ensureAsset(slots.get('orders'));
    if (document.getElementById('view-perfil')?.classList.contains('active')) ensureAsset(slots.get('profile'));
  }

  function boot() {
    try {
      mount();
    } catch (error) {
      console.warn(`[${VERSION}] mascot layer disabled`, error);
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();

  window.FSChibiMascot = Object.freeze({ version: VERSION, react, blink });
})();
