/* THE FRENCH STORE — Gold / Diamond premium UX v1.
   Isolated presentation + Rank Pass interaction decorator.
   Safety: no payment provider logic, no service-role, no catalog mutation, no order writes.
   If this module fails, the existing loyalty.js + loyalty-rank-extras.js behavior remains available. */
(() => {
  'use strict';

  const VERSION = 'rank-pass-premium-v1-20260825';
  const GOLD_CODE = 'ECLAT_OR';
  const DIAMOND_CODE = 'DIAMANT_BLEU';
  const root = document.documentElement;
  const state = { summary: null, launch: null, syncing: null, busy: false };

  const text = (value) => String(value ?? '').trim();
  const bob = (value) => `Bs ${Number(value || 0).toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const date = (value) => value ? new Intl.DateTimeFormat('es-BO', { dateStyle: 'medium' }).format(new Date(value)) : '—';
  const dateTime = (value) => value ? new Intl.DateTimeFormat('es-BO', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) : '—';
  const int = (value) => Math.max(0, Math.trunc(Number(value || 0)));

  function authenticated() {
    try { return typeof session !== 'undefined' && !!session; } catch { return false; }
  }

  function toneFor(theme) {
    return theme === 'diamond' ? 'diamond' : theme === 'gold' ? 'gold' : 'info';
  }

  function multiplierFor(pass) {
    return pass?.code === DIAMOND_CODE ? 'x2' : pass?.code === GOLD_CODE ? 'x1.5' : null;
  }

  function errorMessage(error) {
    const raw = text(error?.message || error);
    if (raw.includes('LOYALTY_NOT_LAUNCHED')) return 'French Rewards todavía está en construcción. El Rank Pass puede estar activo, pero los puntos aún no se generan ni se canjean.';
    if (raw.includes('INSUFFICIENT_WALLET_BALANCE')) return 'No tienes saldo suficiente en French Wallet para completar esta operación.';
    if (raw.includes('WALLET_NOT_FOUND')) return 'Primero activa French Wallet en tu cuenta.';
    if (raw.includes('WALLET_BLOCKED')) return 'French Wallet no está disponible en este momento.';
    if (raw.includes('ACTIVE_PASS_CHANGE_AFTER_EXPIRY')) return 'Tu rango actual sigue vigente. Gold puede mejorarse a Diamond; otros cambios se hacen cuando vence el rango.';
    if (raw.includes('UPGRADE_NOT_AVAILABLE')) return 'La mejora a Diamond ya no está disponible con el estado actual de tu rango.';
    if (raw.includes('INSUFFICIENT_REWARD_POINTS')) return 'No tienes suficientes FRENCH Points disponibles para ese canje.';
    if (raw.includes('MIN_REDEEM_NOT_MET')) return 'Todavía no alcanzaste el mínimo de puntos para canjear.';
    if (raw.includes('MAX_REDEEM_EXCEEDED')) return 'El canje supera el máximo permitido por operación.';
    if (raw.includes('REDEEM_MULTIPLE_100_REQUIRED')) return 'El canje debe hacerse en múltiplos de 100 puntos.';
    return 'No se pudo completar la operación. No se aplicaron cambios inesperados; intenta nuevamente.';
  }

  async function readState() {
    if (!authenticated()) return { summary: null, launch: null };
    const [summaryResult, launchResult] = await Promise.all([
      sb.rpc('get_my_loyalty_summary'),
      sb.rpc('get_my_loyalty_launch_progress')
    ]);
    if (summaryResult.error) throw summaryResult.error;
    if (launchResult.error) throw launchResult.error;
    return {
      summary: summaryResult.data?.ok === true ? summaryResult.data : null,
      launch: launchResult.data && typeof launchResult.data === 'object' ? launchResult.data : null
    };
  }

  function removePremiumUi() {
    document.getElementById('fsRankPremiumRibbon')?.remove();
    document.getElementById('fsRankProfileBadge')?.remove();
    delete document.body?.dataset.fsRankVisual;
  }

  function mountPremiumUi() {
    const pass = state.summary?.active_pass || null;
    const theme = text(pass?.theme);
    if (!pass || !['gold','diamond'].includes(theme)) {
      removePremiumUi();
      return;
    }

    root.dataset.fsMembership = theme;
    if (document.body) document.body.dataset.fsRankVisual = theme;

    const multiplier = multiplierFor(pass);
    const topbar = document.querySelector('.topbar');
    if (topbar) {
      let ribbon = document.getElementById('fsRankPremiumRibbon');
      if (!ribbon) {
        ribbon = document.createElement('button');
        ribbon.id = 'fsRankPremiumRibbon';
        ribbon.type = 'button';
        ribbon.className = 'fs-rank-premium-ribbon';
        ribbon.setAttribute('aria-label', 'Abrir información de French Rank Pass');
        ribbon.addEventListener('click', () => { try { navigate('perfil'); } catch {} });
        topbar.insertAdjacentElement('afterend', ribbon);
      }
      ribbon.dataset.theme = theme;
      ribbon.replaceChildren();
      const icon = document.createElement('span');
      icon.className = 'fs-rank-premium-icon';
      icon.textContent = theme === 'diamond' ? '💎' : '🏆';
      const copy = document.createElement('span');
      copy.className = 'fs-rank-premium-copy';
      const title = document.createElement('b');
      title.textContent = theme === 'diamond' ? 'DIAMOND RANK ACTIVO' : 'GOLD RANK ACTIVO';
      const meta = document.createElement('small');
      meta.textContent = `${multiplier || ''} Rewards · vigente hasta ${date(pass.ends_at)}`;
      copy.append(title, meta);
      const end = document.createElement('span');
      end.className = 'fs-rank-premium-end';
      end.textContent = theme === 'diamond' ? 'NIVEL MÁXIMO' : 'RANGO PREMIUM';
      ribbon.append(icon, copy, end);
    }

    const profileCard = document.querySelector('#view-perfil .profile-card');
    if (profileCard) {
      let badge = document.getElementById('fsRankProfileBadge');
      if (!badge) {
        badge = document.createElement('div');
        badge.id = 'fsRankProfileBadge';
        badge.className = 'fs-rank-profile-badge';
        profileCard.appendChild(badge);
      }
      badge.dataset.theme = theme;
      badge.replaceChildren();
      const mark = document.createElement('span');
      mark.textContent = theme === 'diamond' ? '◆' : '★';
      const copy = document.createElement('span');
      const strong = document.createElement('b');
      strong.textContent = pass.name || (theme === 'diamond' ? 'Diamond Rank' : 'Gold Rank');
      const small = document.createElement('small');
      small.textContent = `${multiplier || ''} Rewards · ${date(pass.ends_at)}`;
      copy.append(strong, small);
      badge.append(mark, copy);
    }
  }

  async function sync(force = false) {
    if (state.syncing && !force) return state.syncing;
    state.syncing = (async () => {
      if (!authenticated()) {
        state.summary = null;
        state.launch = null;
        removePremiumUi();
        return null;
      }
      const current = await readState();
      state.summary = current.summary;
      state.launch = current.launch;
      mountPremiumUi();
      return current;
    })().catch((error) => {
      console.warn('FRENCH STORE premium Rank UI unavailable:', text(error?.message || error).slice(0, 120));
      return null;
    }).finally(() => { state.syncing = null; });
    return state.syncing;
  }

  async function refreshAll() {
    await Promise.allSettled([
      window.FSLoyalty?.refresh?.(),
      window.FSRankExtras?.refresh?.(),
      typeof loadWallet === 'function' ? loadWallet() : Promise.resolve()
    ]);
    await sync(true);
  }

  function notifyError(error) {
    const message = errorMessage(error);
    if (window.FSNotify?.error) window.FSNotify.error(message);
  }

  async function purchasePass(code, button) {
    if (state.busy) return;
    state.busy = true;
    const old = button.textContent;
    button.disabled = true;
    button.textContent = 'Preparando…';
    try {
      const current = await readState();
      const summary = current.summary;
      const plan = summary?.plans?.find?.((item) => item.code === code);
      if (!plan) throw new Error('PLAN_NOT_AVAILABLE');

      const active = summary?.active_pass || null;
      const renew = active?.code === code;
      const launched = current.launch?.program_launched === true;
      const theme = text(plan.theme) === 'diamond' ? 'diamond' : 'gold';
      const multiplier = code === DIAMOND_CODE ? 'x2' : 'x1.5';
      const accepted = await window.FSNotify.confirm({
        tone: toneFor(theme),
        icon: theme === 'diamond' ? '💎' : '🏆',
        eyebrow: 'FRENCH RANK PASS',
        title: `${renew ? 'Renovar' : 'Activar'} ${plan.name}`,
        message: `Se cobrarán ${bob(plan.price_bob)} desde French Wallet.`,
        details: [
          `Tema ${theme === 'diamond' ? 'Diamond' : 'Gold'} visible desde la activación`,
          `${multiplier} French Rewards mientras el rango esté vigente${launched ? '' : ' cuando Rewards esté disponible'}`,
          `${int(plan.duration_days || 30)} días por período`,
          'Sin renovación automática'
        ],
        note: launched
          ? 'Los Rewards se calculan únicamente sobre compras y eventos elegibles confirmados por el servidor.'
          : 'French Rewards sigue en preparación. Comprar el rango no crea puntos retroactivos.',
        confirmLabel: renew ? 'Renovar rango' : `Activar ${plan.name}`
      });
      if (!accepted) return;

      button.textContent = 'Procesando…';
      const { data, error } = await sb.rpc('purchase_my_loyalty_pass', { p_plan_code: code });
      if (error) throw error;
      await refreshAll();
      window.FSNotify.toast({
        tone: toneFor(theme),
        icon: theme === 'diamond' ? '💎' : '🏆',
        title: `${data.plan_name || plan.name} activado`,
        message: `Vigencia hasta ${date(data.period_ends_at)}. No hay renovación automática.`,
        duration: 6000
      });
    } catch (error) {
      notifyError(error);
    } finally {
      state.busy = false;
      if (button.isConnected) { button.disabled = false; button.textContent = old; }
    }
  }

  async function upgradeToDiamond(button) {
    if (state.busy) return;
    state.busy = true;
    const old = button.textContent;
    button.disabled = true;
    button.textContent = 'Cotizando…';
    try {
      const { data: quote, error: quoteError } = await sb.rpc('get_my_loyalty_upgrade_quote');
      if (quoteError) throw quoteError;
      if (!quote?.eligible) throw new Error('UPGRADE_NOT_AVAILABLE');

      const accepted = await window.FSNotify.confirm({
        tone: 'diamond',
        icon: '💎',
        eyebrow: 'MEJORA DE RANGO',
        title: 'Gold Rank → Diamond Rank',
        message: `La mejora cuesta ${bob(quote.charged_bob)} y se cobra desde French Wallet.`,
        details: [
          'Diamond se activa inmediatamente',
          `Conservas la fecha de vencimiento: ${dateTime(quote.ends_at)}`,
          'No se agregan días por la mejora',
          'Sin renovación automática'
        ],
        note: 'La cotización usa el tiempo restante de Gold, la diferencia proporcional y el cargo de cambio vigente.',
        confirmLabel: 'Mejorar a Diamond'
      });
      if (!accepted) return;

      button.textContent = 'Mejorando…';
      const { data, error } = await sb.rpc('upgrade_my_loyalty_pass');
      if (error) throw error;
      await refreshAll();
      window.FSNotify.toast({
        tone: 'diamond', icon: '💎', title: 'Diamond Rank activado',
        message: `Se cobraron ${bob(data.charged_bob)}. Tu vigencia se mantiene hasta ${date(data.period_ends_at)}.`,
        duration: 6500
      });
    } catch (error) {
      notifyError(error);
    } finally {
      state.busy = false;
      if (button.isConnected) { button.disabled = false; button.textContent = old; }
    }
  }

  async function redeemPoints(button) {
    if (state.busy) return;
    state.busy = true;
    const old = button.textContent;
    try {
      const current = await readState();
      if (current.launch?.program_launched !== true) throw new Error('LOYALTY_NOT_LAUNCHED');
      const summary = current.summary;
      const input = document.getElementById('fsRedeemPoints');
      const points = int(input?.value);
      const min = int(summary?.min_redeem_points || 500);
      const available = int(summary?.points_available);
      if (!summary || points < min || points > available || points % 100 !== 0) throw new Error('REDEEM_INPUT_INVALID');
      const credit = points / Number(summary.points_per_bob || 100);

      const accepted = await window.FSNotify.confirm({
        tone: toneFor(summary.active_pass?.theme),
        icon: '⭐', eyebrow: 'FRENCH REWARDS', title: 'Canjear puntos a French Wallet',
        message: `${points.toLocaleString('es-BO')} FRENCH Points se convertirán en ${bob(credit)} de saldo Wallet.`,
        details: ['El canje es irreversible una vez confirmado', 'French Wallet se actualizará después de la confirmación del servidor'],
        confirmLabel: 'Canjear puntos'
      });
      if (!accepted) return;

      button.disabled = true;
      button.textContent = 'Canjeando…';
      const { data, error } = await sb.rpc('redeem_my_rewards', { p_points: points });
      if (error) throw error;
      await refreshAll();
      window.FSNotify.success(`${bob(data.wallet_credit_bob)} fueron acreditados a French Wallet.`, 'Canje completado');
    } catch (error) {
      if (text(error?.message || error).includes('REDEEM_INPUT_INVALID')) {
        window.FSNotify?.error?.('Revisa la cantidad: debe cumplir el mínimo, ser múltiplo de 100 y no superar tus puntos disponibles.', 'Cantidad inválida');
      } else notifyError(error);
    } finally {
      state.busy = false;
      if (button.isConnected) { button.disabled = false; button.textContent = old; }
    }
  }

  function intercept(event) {
    if (!window.FSNotify?.confirm) return;
    const target = event.target.closest?.('[data-fs-pass-buy],[data-fs-rank-upgrade],[data-fs-redeem]');
    if (!target) return;
    event.preventDefault();
    event.stopImmediatePropagation();

    if (target.dataset.fsPassBuy) {
      purchasePass(target.dataset.fsPassBuy, target);
      return;
    }
    if (target.hasAttribute('data-fs-rank-upgrade')) {
      upgradeToDiamond(target);
      return;
    }
    if (target.hasAttribute('data-fs-redeem')) redeemPoints(target);
  }

  document.addEventListener('click', intercept, true);
  document.addEventListener('click', (event) => {
    if (event.target.closest?.('[data-nav="perfil"]')) window.setTimeout(() => sync(true), 180);
  });

  try {
    sb.auth.onAuthStateChange((_event, newSession) => {
      if (!newSession) {
        state.summary = null;
        state.launch = null;
        removePremiumUi();
      } else window.setTimeout(() => sync(true), 120);
    });
  } catch {}

  window.FSRankPremium = Object.freeze({ version: VERSION, refresh: () => sync(true) });
  window.setTimeout(() => sync(true), 180);
})();
