/* THE FRENCH STORE — French Rank Pass + French Rewards v3
   Isolated authenticated loyalty UI. No provider logic, no BISA modification,
   no service-role, no catalog category changes. Rank Pass purchases use French Wallet
   through authenticated RPCs; Rewards are awarded server-side only after launch. */
(() => {
  'use strict';

  const VERSION = 'french-rank-pass-v3-20260823';
  const state = { summary: null, launch: null, loading: null, mounted: false };
  const root = document.documentElement;

  const text = (value) => String(value ?? '').trim();
  const html = (value) => text(value).replace(/[&<>"']/g, (m) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
  }[m]));
  const bob = (value) => `Bs ${Number(value || 0).toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const int = (value) => Math.max(0, Math.trunc(Number(value || 0)));
  const date = (value) => value ? new Intl.DateTimeFormat('es-BO', { dateStyle: 'medium' }).format(new Date(value)) : '—';
  const pct = (value, goal) => goal > 0 ? Math.min(100, Math.max(0, (Number(value || 0) / Number(goal)) * 100)) : 100;

  function authenticated() {
    try { return !!session; } catch { return false; }
  }

  function launched() {
    return state.launch?.program_launched === true;
  }

  function adminView() {
    return state.launch?.admin_view === true;
  }

  function clearTheme() {
    delete root.dataset.fsMembership;
    const chip = document.getElementById('fsLoyaltyChip');
    if (chip) chip.classList.add('hidden');
  }

  function ensureShell() {
    if (state.mounted) return;

    const profilePanel = document.querySelector('#view-perfil .profile-panel');
    const profileActions = profilePanel?.querySelector('.profile-actions');
    if (profilePanel && !document.getElementById('fsLoyaltyPanel')) {
      const panel = document.createElement('section');
      panel.id = 'fsLoyaltyPanel';
      panel.className = 'fs-loyalty-panel';
      panel.innerHTML = '<div class="fs-loyalty-loading">Cargando French Rank Pass…</div>';
      if (profileActions) profilePanel.insertBefore(panel, profileActions);
      else profilePanel.appendChild(panel);
    }

    const topActions = document.querySelector('.top-actions');
    if (topActions && !document.getElementById('fsLoyaltyChip')) {
      const chip = document.createElement('button');
      chip.id = 'fsLoyaltyChip';
      chip.type = 'button';
      chip.className = 'fs-loyalty-chip hidden';
      chip.setAttribute('aria-label', 'Abrir French Rank Pass');
      chip.onclick = () => { try { navigate('perfil'); } catch {} };
      topActions.prepend(chip);
    }

    document.addEventListener('click', onClick);
    state.mounted = true;
  }

  function errorMessage(error) {
    const raw = text(error?.message || error);
    if (raw.includes('LOYALTY_NOT_LAUNCHED')) return 'French Rewards todavía está en construcción. El Rank Pass sí puede estar activo, pero los puntos aún no se generan ni se canjean.';
    if (raw.includes('INSUFFICIENT_WALLET_BALANCE')) return 'No tienes saldo suficiente en French Wallet para activar este rango.';
    if (raw.includes('WALLET_NOT_FOUND')) return 'Primero activa French Wallet en tu cuenta.';
    if (raw.includes('WALLET_BLOCKED')) return 'French Wallet no está disponible en este momento.';
    if (raw.includes('ACTIVE_PASS_CHANGE_AFTER_EXPIRY')) return 'Tu rango actual sigue activo. Si tienes Gold Rank puedes usar la mejora a Diamond; los demás cambios se realizan al vencer.';
    if (raw.includes('INSUFFICIENT_REWARD_POINTS')) return 'No tienes suficientes puntos disponibles para ese canje.';
    if (raw.includes('MIN_REDEEM_NOT_MET')) return 'Aún no alcanzaste el mínimo de puntos para canjear.';
    if (raw.includes('MAX_REDEEM_EXCEEDED')) return 'El canje supera el máximo permitido por operación.';
    if (raw.includes('REDEEM_MULTIPLE_100_REQUIRED')) return 'El canje debe hacerse en múltiplos de 100 puntos.';
    return 'No se pudo completar la operación. Intenta nuevamente en unos segundos.';
  }

  async function fetchSummary(force = false) {
    if (!authenticated()) {
      state.summary = null;
      state.launch = null;
      clearTheme();
      render();
      return null;
    }
    if (state.loading && !force) return state.loading;
    state.loading = (async () => {
      const [summaryResult, launchResult] = await Promise.all([
        sb.rpc('get_my_loyalty_summary'),
        sb.rpc('get_my_loyalty_launch_progress')
      ]);
      if (summaryResult.error) throw summaryResult.error;
      if (launchResult.error) throw launchResult.error;
      state.summary = summaryResult.data && summaryResult.data.ok ? summaryResult.data : null;
      state.launch = launchResult.data && typeof launchResult.data === 'object' ? launchResult.data : null;
      if (!state.launch) throw new Error('LOYALTY_LAUNCH_STATE_MISSING');
      applyTheme();
      render();
      return state.summary;
    })().catch((error) => {
      console.warn('FRENCH STORE loyalty unavailable:', text(error?.message || error).slice(0, 100));
      clearTheme();
      renderError('French Rank Pass no está disponible temporalmente. Tus compras y Wallet siguen funcionando normalmente.');
      return null;
    }).finally(() => { state.loading = null; });
    return state.loading;
  }

  function applyTheme() {
    const pass = state.summary?.active_pass || null;
    const theme = text(pass?.theme);
    if (theme === 'gold' || theme === 'diamond') root.dataset.fsMembership = theme;
    else delete root.dataset.fsMembership;

    const chip = document.getElementById('fsLoyaltyChip');
    if (!chip || !authenticated()) return;
    const points = int(state.summary?.points_available);
    chip.classList.remove('hidden');
    chip.dataset.theme = theme || 'base';

    if (pass) {
      chip.innerHTML = `${theme === 'diamond' ? '💎' : '🏆'} <span>${html(pass.name)}</span>`;
    } else if (launched()) {
      chip.innerHTML = `⭐ <span>${points.toLocaleString('es-BO')} pts</span>`;
    } else if (adminView()) {
      chip.innerHTML = '🎯 <span>Meta Rewards</span>';
    } else {
      chip.innerHTML = '🎮 <span>Rank Pass</span>';
    }
  }

  function planBenefits(plan, isLaunched) {
    if (plan.code === 'DIAMANT_BLEU') return [
      'Tema Diamond Rank e insignia premium desde ahora',
      isLaunched ? 'x2 French Rewards en compras elegibles' : 'x2 French Rewards cuando el programa se lance',
      isLaunched ? 'Bonus de miembro superior, limitado por margen seguro' : 'Bonus Diamond reservado para cuando Rewards esté activo',
      '30 días · sin renovación automática'
    ];
    return [
      'Tema Gold Rank e insignia dorada desde ahora',
      isLaunched ? 'x1.5 French Rewards en compras elegibles' : 'x1.5 French Rewards cuando el programa se lance',
      isLaunched ? 'Bonus de miembro, limitado por margen seguro' : 'Bonus Gold reservado para cuando Rewards esté activo',
      '30 días · sin renovación automática'
    ];
  }

  function planCard(plan, activePass, isLaunched) {
    const same = activePass?.code === plan.code;
    const blockedByPass = !!activePass && !same;
    const benefits = planBenefits(plan, isLaunched).map((item) => `<li>${html(item)}</li>`).join('');
    const action = same ? 'Renovar +30 días' : 'Activar con Wallet';
    const label = blockedByPass ? 'Disponible al vencer tu rango actual' : action;
    const reserve = !isLaunched ? '<span class="fs-pass-reserve">Rewards en reserva</span>' : '';
    return `<article class="fs-pass-card fs-pass-${html(plan.theme)} ${same ? 'active' : ''}">
      ${reserve}
      <div class="fs-pass-title"><span>${plan.theme === 'diamond' ? '💎' : '🏆'}</span><div><b>${html(plan.name)}</b><small>${html(plan.subtitle)}</small></div></div>
      <div class="fs-pass-price"><strong>${bob(plan.price_bob)}</strong><span>/ ${int(plan.duration_days)} días</span></div>
      <ul>${benefits}</ul>
      <button class="${plan.theme === 'diamond' ? 'primary-btn' : 'secondary-btn'} full" data-fs-pass-buy="${html(plan.code)}" ${blockedByPass ? 'disabled' : ''}>${html(label)}</button>
    </article>`;
  }

  function recentRows(rows) {
    if (!Array.isArray(rows) || !rows.length) return '<p class="fs-loyalty-muted">Todavía no tienes movimientos de Rewards.</p>';
    const labels = {
      PURCHASE_REWARD: 'Compra entregada', PASS_BONUS: 'Bonus Rank Pass', REDEMPTION: 'Canje a Wallet',
      REFUND_REVERSAL: 'Ajuste por reembolso', AD_REWARD: 'Rewarded Ads', ADMIN_ADJUSTMENT: 'Ajuste'
    };
    return rows.map((row) => {
      const points = Number(row.points || 0);
      return `<div class="fs-reward-row"><div><b>${html(labels[row.type] || row.type)}</b><small>${html(date(row.created_at))}</small></div><strong class="${points < 0 ? 'negative' : ''}">${points > 0 ? '+' : ''}${points.toLocaleString('es-BO')} pts</strong></div>`;
    }).join('');
  }

  function progressRow(label, value, goal, suffix = '') {
    const percent = pct(value, goal);
    const shownValue = suffix === 'bob' ? bob(value) : int(value).toLocaleString('es-BO');
    const shownGoal = suffix === 'bob' ? bob(goal) : int(goal).toLocaleString('es-BO');
    return `<div class="fs-launch-progress-row">
      <div><span>${html(label)}</span><b>${html(shownValue)} / ${html(shownGoal)}</b></div>
      <div class="fs-launch-progress-track" aria-hidden="true"><i style="width:${percent.toFixed(2)}%"></i></div>
    </div>`;
  }

  function renderLaunchGoal() {
    const l = state.launch;
    if (!l || l.program_launched === true || l.admin_view !== true) return '';
    return `<section class="fs-launch-goal fs-admin-launch-goal">
      <div class="fs-launch-goal-head"><div><span class="eyebrow">ADMIN · META INTERNA</span><h3>Progreso real de French Rewards</h3></div><span class="fs-launch-lock">🎯</span></div>
      <p>Este detalle es privado del administrador. Los clientes solo ven que Rewards está en construcción.</p>
      <div class="fs-launch-progress">
        ${progressRow('Pedidos entregados', l.delivered_orders, l.min_delivered_orders)}
        ${progressRow('Clientes distintos', l.unique_buyers, l.min_unique_buyers)}
        ${progressRow('Margen elegible acumulado', l.eligible_margin_bob, l.min_eligible_margin_bob, 'bob')}
      </div>
      <small>El lanzamiento sigue siendo automático al cumplirse simultáneamente las tres condiciones.</small>
    </section>`;
  }

  function renderPublicRewardsReserve() {
    return `<section class="fs-rewards-reserve">
      <div class="fs-reserve-icon">⭐</div>
      <div><span class="eyebrow">FRENCH REWARDS</span><h3>En construcción</h3>
      <p>Estamos preparando el sistema de puntos y canjes para que sea sostenible y seguro. No necesitas hacer nada: cuando esté listo se habilitará automáticamente.</p>
      <small>Tu Rank Pass funciona desde ahora. Antes del lanzamiento de Rewards no se generan puntos ni se realizan canjes.</small></div>
    </section>`;
  }

  function renderRankIntro() {
    return `<section class="fs-rank-intro">
      <div class="fs-rank-intro-icon">🎮</div>
      <div><span class="eyebrow">¿QUÉ ES FRENCH RANK PASS?</span><h3>Tu rango gamer dentro de FRENCH STORE</h3>
      <p>Es una membresía opcional de 30 días pagada con French Wallet. Activa de inmediato un estilo exclusivo en tu cuenta y, cuando French Rewards esté disponible, el rango vigente aplica automáticamente su multiplicador y bonus.</p>
      <div class="fs-rank-pills"><span>✓ Sin renovación automática</span><span>✓ Tema exclusivo inmediato</span><span>✓ Rewards limitado por margen</span></div>
      <small>Si Rewards todavía está en construcción, comprar un Rank Pass no crea puntos retroactivos. Si Rewards se activa mientras tu rango sigue vigente, sus beneficios de puntos empiezan desde ese momento.</small></div>
    </section>`;
  }

  function renderRewardsLive(s) {
    const available = int(s.points_available);
    const pending = int(s.points_pending);
    const minRedeem = int(s.min_redeem_points || 500);
    const maxRedeem = Math.min(int(s.max_redeem_points || 10000), Math.floor(available / 100) * 100);
    const canRedeem = maxRedeem >= minRedeem;
    return `<div class="fs-reward-balance-grid">
        <div class="fs-reward-balance"><span>Disponibles</span><strong>${available.toLocaleString('es-BO')} pts</strong><small>${int(s.points_per_bob)} pts = Bs 1,00</small></div>
        <div class="fs-reward-balance secondary"><span>Pendientes</span><strong>${pending.toLocaleString('es-BO')} pts</strong><small>Se liberan después del período de seguridad.</small></div>
      </div>
      <div class="fs-redeem-box"><div><b>Canjear a French Wallet</b><small>Mínimo ${minRedeem.toLocaleString('es-BO')} puntos. Los puntos se convierten en saldo de Wallet.</small></div>
        <div class="fs-redeem-actions"><input id="fsRedeemPoints" type="number" inputmode="numeric" min="${minRedeem}" max="${Math.max(maxRedeem,minRedeem)}" step="100" value="${canRedeem ? minRedeem : ''}" placeholder="${minRedeem}"><button class="secondary-btn" data-fs-redeem ${canRedeem ? '' : 'disabled'}>Canjear</button></div>
      </div>
      <div class="fs-recent-rewards"><h4>Actividad reciente</h4>${recentRows(s.recent)}</div>`;
  }

  function render() {
    ensureShell();
    const panel = document.getElementById('fsLoyaltyPanel');
    if (!panel) return;
    if (!authenticated()) {
      panel.innerHTML = '';
      panel.classList.add('hidden');
      return;
    }
    panel.classList.remove('hidden');
    const s = state.summary;
    const l = state.launch;
    if (!s || !l) {
      panel.innerHTML = '<div class="fs-loyalty-loading">Cargando French Rank Pass…</div>';
      return;
    }

    const isLaunched = l.program_launched === true;
    const active = s.active_pass || null;
    const passStatus = active
      ? `<div class="fs-active-pass"><span>${active.theme === 'diamond' ? '💎' : '🏆'}</span><div><small>FRENCH RANK PASS ACTIVO</small><b>${html(active.name)}</b><em>Hasta ${html(date(active.ends_at))}</em></div></div>`
      : '<p class="fs-loyalty-muted">No tienes un French Rank Pass activo.</p>';

    panel.innerHTML = `
      <div class="fs-loyalty-head"><div><span class="eyebrow">FRENCH RANK PASS</span><h3>Sube de rango. Personaliza tu cuenta.</h3></div><button class="icon-btn" data-fs-loyalty-refresh aria-label="Actualizar Rank Pass">↻</button></div>
      ${renderRankIntro()}
      <div class="fs-cercle-section">${passStatus}
        <div class="fs-pass-grid">${(s.plans || []).map((plan) => planCard(plan, active, isLaunched)).join('')}</div>
        <p class="fs-loyalty-fine">El Rank Pass se paga con French Wallet, dura 30 días y nunca se renueva automáticamente. Gold y Diamond cambian visualmente tu cuenta desde el momento de activación. Los multiplicadores y bonus de puntos solo operan cuando French Rewards está activo. <a href="./loyalty-terms.html" target="_blank" rel="noopener noreferrer">Ver condiciones.</a></p>
      </div>
      <div class="fs-rewards-divider"></div>
      <div class="fs-loyalty-head"><div><span class="eyebrow">FRENCH REWARDS</span><h3>${isLaunched ? 'Tus puntos y beneficios' : 'Próximo programa de beneficios'}</h3></div></div>
      ${renderLaunchGoal()}
      ${isLaunched ? renderRewardsLive(s) : renderPublicRewardsReserve()}`;
  }

  function renderError(message) {
    ensureShell();
    const panel = document.getElementById('fsLoyaltyPanel');
    if (!panel || !authenticated()) return;
    panel.classList.remove('hidden');
    panel.innerHTML = `<div class="notice error">${html(message)}</div>`;
  }

  async function purchasePass(code, button) {
    const plan = state.summary?.plans?.find?.((item) => item.code === code);
    if (!plan) return;
    const verb = state.summary?.active_pass?.code === code ? 'renovar' : 'activar';
    const rewardsNote = launched()
      ? 'Los beneficios de Rewards se aplican mientras el rango esté vigente.'
      : 'French Rewards aún está en construcción; el tema se activa ahora y los puntos solo empezarán si Rewards se lanza mientras este rango siga vigente.';
    if (!window.confirm(`¿Quieres ${verb} ${plan.name} por ${bob(plan.price_bob)} usando French Wallet?\n\n${rewardsNote}\n\nNo hay renovación automática.`)) return;
    const old = button.textContent;
    button.disabled = true; button.textContent = 'Procesando…';
    try {
      const { data, error } = await sb.rpc('purchase_my_loyalty_pass', { p_plan_code: code });
      if (error) throw error;
      await fetchSummary(true);
      try { if (typeof loadWallet === 'function') await loadWallet(); } catch {}
      window.alert(`${data.plan_name} quedó activo. Vigencia hasta ${date(data.period_ends_at)}.`);
    } catch (error) {
      window.alert(errorMessage(error));
    } finally {
      if (button.isConnected) { button.disabled = false; button.textContent = old; }
    }
  }

  async function redeem(button) {
    if (!launched()) { window.alert(errorMessage(new Error('LOYALTY_NOT_LAUNCHED'))); return; }
    const input = document.getElementById('fsRedeemPoints');
    const points = int(input?.value);
    const s = state.summary;
    if (!s || points < int(s.min_redeem_points) || points > int(s.points_available) || points % 100 !== 0) {
      window.alert('Revisa la cantidad de puntos. Debe cumplir el mínimo, ser múltiplo de 100 y no superar tus puntos disponibles.');
      return;
    }
    const credit = points / Number(s.points_per_bob || 100);
    if (!window.confirm(`¿Canjear ${points.toLocaleString('es-BO')} puntos por ${bob(credit)} en French Wallet?`)) return;
    const old = button.textContent;
    button.disabled = true; button.textContent = 'Canjeando…';
    try {
      const { data, error } = await sb.rpc('redeem_my_rewards', { p_points: points });
      if (error) throw error;
      await fetchSummary(true);
      try { if (typeof loadWallet === 'function') await loadWallet(); } catch {}
      window.alert(`Listo: ${bob(data.wallet_credit_bob)} fueron acreditados a French Wallet.`);
    } catch (error) {
      window.alert(errorMessage(error));
    } finally {
      if (button.isConnected) { button.disabled = false; button.textContent = old; }
    }
  }

  function onClick(event) {
    const target = event.target.closest?.('[data-fs-pass-buy],[data-fs-redeem],[data-fs-loyalty-refresh]');
    if (!target) return;
    if (target.dataset.fsPassBuy) { purchasePass(target.dataset.fsPassBuy, target); return; }
    if (target.hasAttribute('data-fs-redeem')) { redeem(target); return; }
    if (target.hasAttribute('data-fs-loyalty-refresh')) fetchSummary(true);
  }

  async function init() {
    ensureShell();
    if (!authenticated()) {
      const { data } = await sb.auth.getSession();
      if (!data?.session) { clearTheme(); render(); return; }
    }
    await fetchSummary(true);
    sb.auth.onAuthStateChange((_event, newSession) => {
      if (!newSession) { state.summary = null; state.launch = null; clearTheme(); render(); }
      else setTimeout(() => fetchSummary(true), 0);
    });
  }

  function loadRankExtras() {
    if (document.getElementById('fs-loyalty-rank-extras-js')) return;
    const script = document.createElement('script');
    script.id = 'fs-loyalty-rank-extras-js';
    script.src = './loyalty-rank-extras.js?v=20260823-1';
    script.async = false;
    script.addEventListener('error', () => console.warn('FRENCH STORE Rank extras failed to load; base Rank Pass remains available.'), { once: true });
    document.head.appendChild(script);
  }

  window.FSLoyalty = Object.freeze({ version: VERSION, refresh: () => fetchSummary(true) });
  init();
  loadRankExtras();
})();