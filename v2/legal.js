/* FRENCH STORE — aceptación legal en el checkout.
   Solo presentación. No toca precios, checkout, pedidos, Wallet ni proveedores.

   R160: se retiró por completo el subsistema de correo y contraseña que vivía
   en este archivo. El ingreso público es exclusivamente Google (AGENTS.md).

   Lo que se eliminó y por qué:
   - creación de cuenta con contraseña (signUp)
   - solicitud de restablecimiento (resetPasswordForEmail)
   - definición de una contraseña nueva (updateUser con password)
   - reenvío de confirmación de correo (resend)
   - la caja "Nueva contraseña" y los botones "Olvidé mi contraseña" y
     "Reenviar confirmación"
   - el manejo del evento PASSWORD_RECOVERY y la bandera fs_password_recovery

   Ya no queda ninguna forma, desde la tienda pública, de crear una cuenta con
   contraseña ni de establecer una. Verificado en base de datos antes de
   retirarlo: 0 usuarios dependen solo de correo; el único con identidad
   `email` también tiene identidad `google`. No se tocó ninguna identidad. */
(() => {
  'use strict';

  function notice(el, message, type = 'error'){
    if(!el) return;
    if(typeof showNotice === 'function') showNotice(el, message, type);
    else { el.textContent = message; el.className = `notice ${type}`; el.classList.remove('hidden'); }
  }

  /* Limpieza de la bandera histórica de recuperación: si quedó escrita en una
     sesión anterior del navegador ya no significa nada y se descarta. */
  try{ sessionStorage.removeItem('fs_password_recovery'); }catch{}

  /* Puerta legal del checkout. Es lo único que conserva este módulo. */
  document.addEventListener('click', (event) => {
    const button = event.target.closest?.('button');
    if(!button) return;

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
