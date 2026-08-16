/* FRENCH STORE — launch legal acknowledgement guard.
   Presentation/consent layer only. Does not calculate prices or modify payment RPCs. */
(() => {
  'use strict';

  function notice(el, message){
    if(!el) return;
    if(typeof showNotice === 'function') showNotice(el, message, 'error');
    else { el.textContent = message; el.className = 'notice error'; }
  }

  document.addEventListener('click', (event) => {
    const button = event.target.closest?.('button');
    if(!button) return;

    if(button.closest('#authModal') && button.textContent.trim() === 'Crear cuenta'){
      const accept = document.getElementById('legalAccept');
      if(accept && !accept.checked){
        event.preventDefault();
        event.stopImmediatePropagation();
        notice(document.getElementById('loginMessage'), 'Para crear tu cuenta, confirma que leíste los Términos y la Política de Privacidad.');
      }
    }

    if(button.id === 'checkoutWallet' || button.id === 'checkoutQR'){
      const accept = document.getElementById('purchaseLegalAccept');
      if(accept && !accept.checked){
        event.preventDefault();
        event.stopImmediatePropagation();
        notice(document.getElementById('checkoutResult'), 'Confirma que revisaste el producto, el precio y las condiciones de entrega antes de continuar.');
      }
    }
  }, true);
})();
