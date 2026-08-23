/* THE FRENCH STORE — French Rank Pass extras v1
   Isolated UX for active-pass countdown and Gold -> Diamond upgrade.
   No provider/BISA logic, no service-role, no catalog pricing changes. */
(() => {
  'use strict';

  const VERSION = 'rank-extras-v1-20260823';
  const GOLD_CODE = 'ECLAT_OR';
  const DIAMOND_CODE = 'DIAMANT_BLEU';
  const STYLE_ID = 'fs-loyalty-rank-extras-css';
  const state = { summary: null, quote: null, syncing: null, timer: null, observer: null, expiredRefreshSent: false };

  const text = (value) => String(value ?? '').trim();
  const html = (value) => text(value).replace(/[&<>"']/g, (m) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
  }[m]));
  const bob = (value) => `Bs ${Number(value || 0).toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const dateTime = (value) => value ? new Intl.DateTimeFormat('es-BO', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) : '—';

  function loadStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const link = document.createElement('link');
    link.id = STYLE_ID;
    link.rel = 'stylesheet';
    link.href = './loyalty-rank-extras.css?v=20260823-1';
    document.head.appendChild(link);
  }

  function authenticated() {
    try { return !!session; } catch { return false; }
  }

  function remainingParts(endAt) {
    const end = new Date(endAt).getTime();
    const diff = Number.isFinite(end) ? Math.max(0, end - Date.now()) : 0;
    const totalMinutes = Math.floor(diff / 60000);
    const days = Math.floor(totalMinutes / 1440);
    const hours = Math.floor((totalMinutes % 1440) / 60);
    const minutes = totalMinutes % 60;
    return { diff, days, hours, minutes };
  }

  function remainingLabel(endAt) {
    const r = remainingParts(endAt);
    if (r.diff <= 0) return 'Vencido';
    if (r.days > 0) return `${r.days} d ${String(r.hours).padStart(2, '0')} h ${String(r.minutes).padStart(2, '0')} min`;
    if (r.hours > 0) return `${r.hours} h ${String(r.minutes).padStart(2, '0')} min`;
    return `${Math.max(r.minutes, 1)} min`;
  }

  function mountCountdown(active) {
    const host = document.querySelector('#fsLoyaltyPanel .fs-active-pass');
    if (!host || !active?.ends_at) return;
    let box = host.querySelector('#fsRankCountdownBox');
    if (!box) {
      box = document.createElement('div');
      box.id = 'fsRankCountdownBox';
      box.className = 'fs-rank-countdown';
      box.innerHTML = '<span>Tiempo restante</span><strong id="fsRankCountdown">—</strong>';
      host.appendChild(box);
    }
    const output = box.querySelector('#fsRankCountdown');
    if (output) output.textContent = remainingLabel(active.ends_at);
    box.title = `Vence: ${dateTime(active.ends_at)}`;
  }

  function clearExtras() {
    document.getElementById('fsRankExtras')?.remove();
    document.getElementById('fsRankCountdownBox')?.remove();
  }

  function upgradeError(error) {
    const raw = text(error?.message || error);
    if (raw.includes('UPGRADE_NOT_AVAILABLE')) return 'La mejora ya no está disponible para este rango. Actualiza tu perfil para ver el estado vigente.';
    if (raw.includes('INSUFFICIENT_WALLET_BALANCE')) return 'No tienes saldo suficiente en French Wallet para completar la mejora.';
    if (raw.includes('WALLET_NOT_FOUND')) return 'Primero activa French Wallet en tu cuenta.';
    if (raw.includes('WALLET_BLOCKED')) return 'French Wallet no está disponible en este momento.';
    return 'No se pudo completar la mejora. No se realizó ningún cambio de rango.';
  }

  function ensureExtrasHost() {
    const section = document.querySelector('#fsLoyaltyPanel .fs-cercle-section');
    if (!section) return null;
    let host = document.getElementById('fsRankExtras');
    if (!host) {
      host = document.createElement('div');
      host.id = 'fsRankExtras';
      host.className = 'fs-rank-extras';
      const grid = section.querySelector('.fs-pass-grid');
      if (grid) section.insertBefore(host, grid);
      else section.appendChild(host);
    }
    return host;
  }

  function renderUpgrade(active, quote) {
    const host = ensureExtrasHost();
    if (!host) return;

    if (active?.code === DIAMOND_CODE) {
      host.innerHTML = `<section class="fs-rank-max-card" aria-label="Diamond Rank activo">
        <div class="fs-rank-max-gem" aria-hidden="true">💎</div>
        <div><span class="eyebrow">RANGO MÁXIMO ACTIVO</span><h4>Diamond Rank</h4><p>Tu cuenta ya tiene el nivel visual más destacado del French Rank Pass durante la vigencia actual.</p></div>
      </section>`;
      return;
    }

    if (active?.code !== GOLD_CODE) {
      host.remove();
      return;
    }

    if (!quote?.eligible) {
      host.innerHTML = `<section class="fs-rank-upgrade-card muted"><div><span class="eyebrow">MEJORA DE RANGO</span><h4>Diamond Rank</h4><p>La cotización de mejora no está disponible temporalmente. Tu Gold Rank continúa sin cambios.</p></div></section>`;
      return;
    }

    const charge = bob(quote.charged_bob);
    const days = Math.max(1, Number(quote.remaining_days || 0));
    host.innerHTML = `<section class="fs-rank-upgrade-card">
      <div class="fs-rank-upgrade-copy">
        <span class="eyebrow">💎 MEJORA DE RANGO</span>
        <h4>${html(quote.from_name || 'Gold Rank')} → ${html(quote.to_name || 'Diamond Rank')}</h4>
        <p>Sube inmediatamente a Diamond sin esperar a que termine tu rango actual. Conservas la misma fecha de vencimiento y no se activa renovación automática.</p>
        <div class="fs-rank-upgrade-rules"><span>✓ ${days} día${days === 1 ? '' : 's'} de vigencia restante</span><span>✓ Cargo de cambio incluido</span><span>✓ Cobro solo desde French Wallet</span></div>
        <small>La mejora se calcula con la diferencia proporcional del tiempo que aún tienes, añade Bs 2,00 de cargo de cambio y redondea hacia arriba a Bs 0,50. Por eso no es simplemente la diferencia entre ambos pases. Si tienes varias renovaciones acumuladas, la cotización cubre todo el tiempo restante que pasará a Diamond.</small>
      </div>
      <div class="fs-rank-upgrade-action"><span>Mejora ahora por</span><strong>${html(charge)}</strong><small>Vence ${html(dateTime(quote.ends_at))}</small><button class="primary-btn full" data-fs-rank-upgrade>Mejorar a Diamond</button></div>
    </section>`;
  }

  async function readState() {
    if (!authenticated()) return { summary: null, quote: null };
    const { data: summary, error: summaryError } = await sb.rpc('get_my_loyalty_summary');
    if (summaryError) throw summaryError;
    let quote = null;
    if (summary?.active_pass?.code === GOLD_CODE) {
      const { data, error } = await sb.rpc('get_my_loyalty_upgrade_quote');
      if (error) throw error;
      quote = data || null;
    }
    return { summary: summary?.ok ? summary : null, quote };
  }

  async function sync() {
    if (state.syncing) return state.syncing;
    state.syncing = (async () => {
      const current = await readState();
      state.summary = current.summary;
      state.quote = current.quote;
      const active = state.summary?.active_pass || null;
      if (!active) {
        clearExtras();
        return;
      }
      mountCountdown(active);
      renderUpgrade(active, state.quote);
      updateCountdown();
    })().catch((error) => {
      console.warn('FRENCH STORE Rank extras unavailable:', text(error?.message || error).slice(0, 100));
      const active = state.summary?.active_pass || null;
      if (active) mountCountdown(active);
    }).finally(() => { state.syncing = null; });
    return state.syncing;
  }

  function updateCountdown() {
    const active = state.summary?.active_pass || null;
    const output = document.getElementById('fsRankCountdown');
    if (!active?.ends_at || !output) return;
    const parts = remainingParts(active.ends_at);
    output.textContent = remainingLabel(active.ends_at);
    if (parts.diff <= 0 && !state.expiredRefreshSent) {
      state.expiredRefreshSent = true;
      Promise.resolve(window.FSLoyalty?.refresh?.()).finally(() => setTimeout(sync, 250));
    }
  }

  async function upgrade(button) {
    button.disabled = true;
    const oldText = button.textContent;
    button.textContent = 'Cotizando…';
    try {
      const { data: freshQuote, error: quoteError } = await sb.rpc('get_my_loyalty_upgrade_quote');
      if (quoteError) throw quoteError;
      if (!freshQuote?.eligible) throw new Error('UPGRADE_NOT_AVAILABLE');

      const charge = bob(freshQuote.charged_bob);
      const confirmed = window.confirm(`¿Mejorar tu Gold Rank a Diamond Rank por ${charge}?\n\nLa mejora es inmediata, conserva la fecha de vencimiento ${dateTime(freshQuote.ends_at)} y no extiende días. Se cobrará únicamente desde French Wallet.`);
      if (!confirmed) return;

      button.textContent = 'Mejorando…';
      const { data, error } = await sb.rpc('upgrade_my_loyalty_pass');
      if (error) throw error;
      try { if (typeof loadWallet === 'function') await loadWallet(); } catch {}
      try { await window.FSLoyalty?.refresh?.(); } catch {}
      state.expiredRefreshSent = false;
      await sync();
      window.alert(`${data.to_plan_name || 'Diamond Rank'} quedó activo. Se cobraron ${bob(data.charged_bob)} y la vigencia se mantiene hasta ${dateTime(data.period_ends_at)}.`);
    } catch (error) {
      window.alert(upgradeError(error));
    } finally {
      if (button.isConnected) { button.disabled = false; button.textContent = oldText; }
    }
  }

  function installObserver() {
    const profile = document.getElementById('view-perfil');
    if (!profile || state.observer) return;
    let scheduled = null;
    state.observer = new MutationObserver((mutations) => {
      const externalChange = mutations.some((mutation) => {
        const target = mutation.target?.nodeType === 1 ? mutation.target : mutation.target?.parentElement;
        return !target?.closest?.('#fsRankExtras') && !target?.closest?.('#fsRankCountdownBox');
      });
      if (!externalChange) return;
      clearTimeout(scheduled);
      scheduled = setTimeout(sync, 120);
    });
    state.observer.observe(profile, { childList: true, subtree: true });
  }

  document.addEventListener('click', (event) => {
    const upgradeButton = event.target.closest?.('[data-fs-rank-upgrade]');
    if (upgradeButton) {
      event.preventDefault();
      upgrade(upgradeButton);
      return;
    }
    const profileButton = event.target.closest?.('[data-nav="perfil"]');
    if (profileButton) setTimeout(sync, 150);
  });

  try {
    sb.auth.onAuthStateChange((_event, newSession) => {
      if (!newSession) { state.summary = null; state.quote = null; clearExtras(); }
      else setTimeout(sync, 150);
    });
  } catch {}

  loadStyles();
  installObserver();
  state.timer = window.setInterval(updateCountdown, 30000);
  setTimeout(sync, 120);

  window.FSRankExtras = Object.freeze({ version: VERSION, refresh: sync });
})();
