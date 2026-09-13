import fs from 'node:fs';
import assert from 'node:assert/strict';

const read = (path) => fs.readFileSync(path, 'utf8');
const bootstrap = read('v2/bootstrap.js');
const loader = read('v2/storefront-safety-overlays.js');
const badges = read('v2/delivery-mode-badges.js');
const paymentGuard = read('v2/payment-action-guard.js');
const bisa = read('v2/bisa-checkout.js');
const paidWhatsapp = read('v2/paid-whatsapp.js');
const categories = read('v2/config/storefront.js');

assert.match(bootstrap, /storefront-safety-overlays\.js/);
assert.match(loader, /delivery-mode-badges\.js/);
assert.match(loader, /payment-action-guard\.js/);

// Storefront delivery presentation is manual-only and does not query provider capabilities.
assert.match(badges, /Entrega manual/);
assert.match(badges, /MANUAL/);
assert.doesNotMatch(badges, /Automático 24\/7|FSAutomationCapabilities|gamerhub|provider_execution_map|service_role/i);

// One explicit QR verification request per order window; BISA remains authoritative.
assert.match(paymentGuard, /QR_PREFIX/);
assert.match(paymentGuard, /QR_TTL_MS = 30 \* 60 \* 1000/);
assert.match(paymentGuard, /Ya pagué · verificar una vez/);
assert.match(paymentGuard, /Verificación solicitada · esperando banco/);
assert.match(paymentGuard, /addEventListener\('click', onCaptureClick, true\)/);
assert.doesNotMatch(paymentGuard, /create_qr_order|provider_purchase|wallet_transactions|service_role/i);
assert.match(bisa, /Payment is confirmed only by the backend\/SIP/);
assert.match(bisa, /verifyCurrentPayment/);
assert.match(bisa, /startQrPolling/);

// Manual paid notice remains protected against repeated accidental WhatsApp opens.
assert.match(paymentGuard, /MANUAL_PREFIX/);
assert.match(paymentGuard, /Avisar pago · 1 intento/);
assert.match(paymentGuard, /Aviso de pago ya abierto/);
assert.match(paidWhatsapp, /paid-whatsapp-active/);

for (const expected of ['Recargas por ID', 'Recargas por Cuenta', 'Streaming', 'Gift Cards']) {
  assert.ok(categories.includes(expected), `missing category: ${expected}`);
}

console.log('Manual delivery/payment safety: PASS');
