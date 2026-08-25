import fs from 'node:fs';
import assert from 'node:assert/strict';

const read = (path) => fs.readFileSync(path, 'utf8');
const bootstrap = read('v2/bootstrap.js');
const loader = read('v2/storefront-safety-overlays.js');
const badges = read('v2/delivery-mode-badges.js');
const badgeCss = read('v2/delivery-mode-badges.css');
const paymentGuard = read('v2/payment-action-guard.js');
const adminGuard = read('v2/admin-auto-delivery-guard.js');
const capabilities = read('v2/automation-capabilities.js');
const bisa = read('v2/bisa-checkout.js');
const paidWhatsapp = read('v2/paid-whatsapp.js');
const categories = read('v2/config/storefront.js');

// The change stays isolated: stable core delegates to one overlay loader.
assert.match(bootstrap, /storefront-safety-overlays\.js/);
assert.match(loader, /automation-capabilities\.js/);
assert.match(loader, /delivery-mode-badges\.js/);
assert.match(loader, /payment-action-guard\.js/);
assert.match(loader, /admin-auto-delivery-guard\.js/);
assert.match(loader, /delivery-mode-badges\.css/);

// Catalog badges use only the sanitized capability signal and fail closed to manual.
assert.match(badges, /FSAutomationCapabilities/);
assert.match(badges, /Automático 24\/7/);
assert.match(badges, /Entrega manual/);
assert.match(badges, /capabilityReady/);
assert.doesNotMatch(badges, /gamerhub|GAMERHUB|provider_execution_map|service_role|SUPABASE_SERVICE_ROLE/i);
assert.match(capabilities, /unknown product is treated as manual\/non-automatic/);
assert.match(badgeCss, /\.fs-delivery-badge\.is-auto/);
assert.match(badgeCss, /\.fs-delivery-badge\.is-manual/);

// One explicit QR verification request per order window; BISA remains authoritative.
assert.match(paymentGuard, /QR_PREFIX/);
assert.match(paymentGuard, /QR_TTL_MS = 30 \* 60 \* 1000/);
assert.match(paymentGuard, /Ya pagué · verificar una vez/);
assert.match(paymentGuard, /Verificación solicitada · esperando banco/);
assert.match(paymentGuard, /addEventListener\('click', onCaptureClick, true\)/);
assert.doesNotMatch(paymentGuard, /create_qr_order|order-status|provider_purchase|wallet_transactions|service_role|SUPABASE_SERVICE_ROLE/i);
assert.match(bisa, /Payment is confirmed only by the backend\/SIP/);
assert.match(bisa, /verifyCurrentPayment/);
assert.match(bisa, /startQrPolling/);

// Manual paid notice is also protected against repeated accidental WhatsApp opens.
assert.match(paymentGuard, /MANUAL_PREFIX/);
assert.match(paymentGuard, /Avisar pago · 1 intento/);
assert.match(paymentGuard, /Aviso de pago ya abierto/);
assert.match(paidWhatsapp, /paid-whatsapp-active/);

// Automatic orders cannot be manually marked delivered from Admin while live processing.
assert.match(adminGuard, /requires_manual_action/);
assert.match(adminGuard, /\['PAID', 'PROCESSING'\]/);
assert.match(adminGuard, /Se entrega automáticamente/);
assert.match(adminGuard, /fsAutoDeliveryLocked/);
assert.doesNotMatch(adminGuard, /admin_update_order_status|provider_purchase_jobs|GAMERHUB|service_role/i);

// Critical storefront categories are unchanged.
for (const expected of ['Recargas por ID', 'Recargas por Cuenta', 'Streaming', 'Gift Cards']) {
  assert.ok(categories.includes(expected), `missing category: ${expected}`);
}

console.log('R48 delivery/payment safety: PASS');
