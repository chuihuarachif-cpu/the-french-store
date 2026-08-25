/* THE FRENCH STORE — premium notification layer v1.
   UI only: replaces Rank Pass browser dialogs when the premium layer is available.
   It never changes Wallet, orders, payment state, Rewards balances or provider data. */
(() => {
  'use strict';

  const VERSION = 'fs-notify-v1-20260825';
  let activeDialog = null;
  let activeResolve = null;
  let previousFocus = null;

  const text = (value) => String(value ?? '').trim();

  function ensureShell() {
    let toasts = document.getElementById('fsNotifyToasts');
    if (!toasts) {
      toasts = document.createElement('div');
      toasts.id = 'fsNotifyToasts';
      toasts.className = 'fs-notify-toasts';
      toasts.setAttribute('aria-live', 'polite');
      toasts.setAttribute('aria-relevant', 'additions');
      document.body.appendChild(toasts);
    }
    return toasts;
  }

  function iconFor(tone) {
    if (tone === 'success') return '✓';
    if (tone === 'error') return '!';
    if (tone === 'gold') return '🏆';
    if (tone === 'diamond') return '💎';
    if (tone === 'warning') return '⚠';
    return '✦';
  }

  function make(tag, className, value) {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (value !== undefined && value !== null) el.textContent = text(value);
    return el;
  }

  function dismissToast(toast) {
    if (!toast?.isConnected) return;
    toast.classList.add('leaving');
    window.setTimeout(() => toast.remove(), 180);
  }

  function toast(options = {}) {
    const host = ensureShell();
    const tone = ['success','error','info','warning','gold','diamond'].includes(options.tone) ? options.tone : 'info';
    const card = make('section', 'fs-notify-toast');
    card.dataset.tone = tone;
    card.setAttribute('role', tone === 'error' ? 'alert' : 'status');

    const icon = make('div', 'fs-notify-toast-icon', options.icon || iconFor(tone));
    const copy = make('div', 'fs-notify-toast-copy');
    if (options.title) copy.appendChild(make('strong', '', options.title));
    if (options.message) copy.appendChild(make('span', '', options.message));

    const actions = make('div', 'fs-notify-toast-actions');
    if (options.actionLabel && typeof options.onAction === 'function') {
      const action = make('button', 'fs-notify-toast-action', options.actionLabel);
      action.type = 'button';
      action.addEventListener('click', async () => {
        action.disabled = true;
        try { await options.onAction(); }
        finally { dismissToast(card); }
      });
      actions.appendChild(action);
    }
    const close = make('button', 'fs-notify-toast-close', '×');
    close.type = 'button';
    close.setAttribute('aria-label', 'Cerrar notificación');
    close.addEventListener('click', () => dismissToast(card));
    actions.appendChild(close);

    card.append(icon, copy, actions);
    host.appendChild(card);
    requestAnimationFrame(() => card.classList.add('shown'));

    const duration = Math.max(1800, Math.min(15000, Number(options.duration || (options.actionLabel ? 9000 : 4200))));
    const timer = window.setTimeout(() => dismissToast(card), duration);
    card.addEventListener('mouseenter', () => clearTimeout(timer), { once: true });
    return card;
  }

  function closeDialog(result) {
    const overlay = activeDialog;
    const resolve = activeResolve;
    activeDialog = null;
    activeResolve = null;
    if (overlay?.isConnected) {
      overlay.classList.remove('open');
      window.setTimeout(() => overlay.remove(), 170);
    }
    document.body.classList.remove('fs-notify-open');
    try { previousFocus?.focus?.({ preventScroll: true }); } catch {}
    previousFocus = null;
    if (resolve) resolve(result === true);
  }

  function confirm(options = {}) {
    if (activeDialog) closeDialog(false);
    previousFocus = document.activeElement;

    const tone = ['gold','diamond','info','warning','danger'].includes(options.tone) ? options.tone : 'info';
    const overlay = make('div', 'fs-notify-overlay');
    overlay.setAttribute('aria-hidden', 'false');

    const dialog = make('section', 'fs-notify-dialog');
    dialog.dataset.tone = tone;
    dialog.setAttribute('role', 'dialog');
    dialog.setAttribute('aria-modal', 'true');

    const head = make('div', 'fs-notify-dialog-head');
    const emblem = make('div', 'fs-notify-dialog-emblem', options.icon || iconFor(tone));
    const titleBox = make('div', 'fs-notify-dialog-title');
    if (options.eyebrow) titleBox.appendChild(make('span', 'eyebrow', options.eyebrow));
    titleBox.appendChild(make('h2', '', options.title || 'Confirmar'));
    head.append(emblem, titleBox);

    const body = make('div', 'fs-notify-dialog-body');
    if (options.message) body.appendChild(make('p', 'fs-notify-dialog-message', options.message));

    if (Array.isArray(options.details) && options.details.length) {
      const list = make('ul', 'fs-notify-dialog-details');
      options.details.filter(Boolean).forEach((item) => {
        const li = make('li');
        li.appendChild(make('span', '', '✓'));
        li.appendChild(make('span', '', item));
        list.appendChild(li);
      });
      body.appendChild(list);
    }

    if (options.note) body.appendChild(make('small', 'fs-notify-dialog-note', options.note));

    const footer = make('div', 'fs-notify-dialog-actions');
    const cancel = make('button', 'fs-notify-btn secondary', options.cancelLabel || 'Cancelar');
    cancel.type = 'button';
    const accept = make('button', 'fs-notify-btn primary', options.confirmLabel || 'Confirmar');
    accept.type = 'button';
    footer.append(cancel, accept);

    dialog.append(head, body, footer);
    overlay.appendChild(dialog);
    document.body.appendChild(overlay);
    document.body.classList.add('fs-notify-open');
    activeDialog = overlay;

    return new Promise((resolve) => {
      activeResolve = resolve;
      cancel.addEventListener('click', () => closeDialog(false));
      accept.addEventListener('click', () => closeDialog(true));
      overlay.addEventListener('click', (event) => { if (event.target === overlay) closeDialog(false); });
      const onKey = (event) => {
        if (!overlay.isConnected) { document.removeEventListener('keydown', onKey, true); return; }
        if (event.key === 'Escape') { event.preventDefault(); closeDialog(false); }
        if (event.key === 'Tab') {
          const focusable = [cancel, accept].filter((el) => !el.disabled);
          if (!focusable.length) return;
          const first = focusable[0];
          const last = focusable[focusable.length - 1];
          if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
          else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
        }
      };
      document.addEventListener('keydown', onKey, true);
      window.setTimeout(() => {
        overlay.classList.add('open');
        accept.focus({ preventScroll: true });
      }, 0);
    });
  }

  window.FSNotify = Object.freeze({
    version: VERSION,
    toast,
    confirm,
    success: (message, title = 'Listo') => toast({ tone: 'success', title, message }),
    error: (message, title = 'No se pudo completar') => toast({ tone: 'error', title, message }),
    info: (message, title = 'FRENCH STORE') => toast({ tone: 'info', title, message })
  });
})();
