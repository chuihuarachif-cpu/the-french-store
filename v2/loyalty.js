/* THE FRENCH STORE — Le Cercle French + French Rewards v2
   Isolated authenticated loyalty UI. No provider logic, no BISA modification,
   no service-role, no catalog category changes. Pass purchases use French Wallet
   through authenticated RPCs; rewards are awarded server-side on DELIVERED orders. */
(() => {
  'use strict';

  const VERSION = 'le-cercle-v2-auto-launch-20260823';
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
      panel.innerHTML = '<div class="fs-loyalty-loading">Cargando French Rewards…</div>';
      if (profileActions) profilePanel.insertBefore(panel, profileActions);
      else profilePanel.appendChild(panel);
    }

    const topActions = document.querySelector('.top-actions');
    if (topActions && !document.getElementById('fsLoyaltyChip')) {
      const chip = document.createElement('button');
      chip.id = 'fsLoyaltyChip';
      chip.type = 'button';
      chip.className = 'fs-loyalty-chip hidden';
      chip.setAttribute('aria-label', 'Abrir French Rewards');
      chip.onclick = () => { try { navigate('perfil'); } catch {} };
      topActions.prepend(chip);
    }

    document.addEventListener('click', onClick);
    state.mounted = true;
  }

  function errorMessage(error) {
    const raw = text(error?.message || error);
    if (raw.includes('LOYALTY_NOT_LAUNCHED')) return 'French Rewards todavía está cumpliendo su meta de lanzamiento. Se activará automáticamente al alcanzarla.';
    if (raw.includes('INSUFFICIENT_WALLET_BALANCE')) return 'No tienes saldo suficiente en French Wallet para activar este nivel.';
    if (raw.includes('WALLET_NOT_FOUND')) return 'Primero activa French Wallet en tu cuenta.';
    if (raw.includes('WALLET_BLOCKED')) return 'French Wallet no está disponible en este momento.';
    if (raw.includes('ACTIVE_PASS_CHANGE_AFTER_EXPIRY')) return 'Tu nivel actual sigue activo. Puedes renovarlo ahora; para cambiar de nivel espera a su vencimiento.';
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
      renderError('French Rewards no está disponible temporalmente. Tus compras y Wallet siguen funcionando normalmente.');
      return null;
    }).finally(() => { state.loading = null; });
    return state.loading;
  }

  function applyTheme() {
    const pass = launched() ? state.summary?.active_pass : null;
    const theme = text(pass?.theme);
    if (theme === 'gold' || theme === 'diamond') root.dataset.fsMembership = theme;
    else delete root.dataset.fsMembership;

    const chip = document.getElementById('fsLoyaltyChip');
    if (!chip || !authenticated()) return;
    const points = int(state.summary?.points_available);
    chip.classList.remove('hidden');
    chip.dataset.theme = theme || 'base';
    if (!launched()) {
      chip.innerHTML = '🎯 <span>Meta Rewards</span>';
    } else {
      chip.innerHTML = pass
        ? `${theme === 'diamond' ? '💎' : '✨'} <span>${html(pass.name)}</span>`
        : `⭐ <span>${points.toLocaleString('es-BO')} pts</span>`;
    }
  }

  function planBenefits(plan) {
    if (plan.code === 'DIAMANT_BLEU') return [
      'x2 French Rewards en compras elegibles',
      'Ahorro premium devuelto como Rewards',
      'Tema visual Diamant Bleu en tu cuenta',
      '30 días · sin renovación automática'
    ];
    return [
      'x1.5 French Rewards en compras elegibles',
      'Ahorro extra devuelto como Rewards',
      'Tema visual Éclat d’Or en tu cuenta',
      '30 días · sin renovación automática'
    ];
  }

  function planCard(plan, activePass, isLaunched) {
    const same = activePass?.code === plan.code;
    const blockedByPass = !!activePass && !same;
    const blocked = !isLaunched || blockedByPass;
    const benefits = planBenefits(plan).map((item) => `<li>${html(item)}</li>`).join('');
    const action = same ? 'Renovar +30 días' : 'Activar con Wallet';
    const label = !isLaunched ? 'Se habilita con French Rewards' : (blockedByPass ? 'Disponible al vencer tu nivel actual' : action);
    return `<article class="fs-pass-card fs-pass-${html(plan.theme)} ${same ? 'active' : ''} ${!isLaunched ? 'prelaunch' : ''}">
      <div class="fs-pass-title"><span>${plan.theme === 'diamond' ? '💎' : '✨'}</span><div><b>${html(plan.name)}</b><small>${html(plan.subtitle)}</small></div></div>
      <div class="fs-pass-price"><strong>${bob(plan.price_bob)}</strong><span>/ ${int(plan.duration_days)} días</span></div>
      <ul>${benefits}</ul>
      <button class="${plan.theme === 'diamond' ? 'primary-btn' : 'secondary-btn'} full" data-fs-pass-buy="${html(plan.code)}" ${blocked ? 'disabled' : ''}>${html(label)}</button>
    </article>`;
  }

  function recentRows(rows) {
    if (!Array.isArray(rows) || !rows.length) return '<p class="fs-loyalty-muted">Todavía no tienes movimientos de Rewards.</p>';
    const labels = {
      PURCHASE_REWARD: 'Compra entregada', PASS_BONUS: 'Beneficio Le Cercle', REDEMPTION: 'Canje a Wallet',
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
    if (!l || l.program_launched === true) return '';
    return `<section class="fs-launch-goal">
      <div class="fs-launch-goal-head"><div><span class="eyebrow">META DE LANZAMIENTO</span><h3>French Rewards se activará automáticamente</h3></div><span class="fs-launch-lock">🎯</span></div>
      <p>No necesitas pedir que lo activemos. Cuando la tienda alcance las tres metas de seguridad, French Rewards y Le Cercle quedarán habilitados automáticamente desde el siguiente estado entregado que complete la meta.</p>
      <div class="fs-launch-progress">
        ${progressRow('Pedidos entregados', l.delivered_orders, l.min_delivered_orders)}
        ${progressRow('Clientes distintos', l.unique_buyers, l.min_unique_buyers)}
        ${progressRow('Margen elegible acumulado', l.eligible_margin_bob, l.min_eligible_margin_bob, 'bob')}
      </div>
      <small>La meta usa pedidos realmente entregados y margen elegible; no depende solo del volumen de ventas. Esto evita lanzar un programa que pueda comprometer la rentabilidad.</small>
    </section>`;
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
      panel.innerHTML = '<div class="fs-loyalty-loading">Cargando French Rewards…</div>';
      return;
    }

    const isLaunched = l.program_launched === true;
    const available = int(s.points_available);
    const pending = int(s.points_pending);
    const minRedeem = int(s.min_redeem_points || 500);
    const maxRedeem = Math.min(int(s.max_redeem_points || 10000), Math.floor(available / 100) * 100);
    const canRedeem = isLaunched && maxRedeem >= minRedeem;
    const active = isLaunched ? s.active_pass : null;
    const passStatus = active
      ? `<div class="fs-active-pass"><span>${active.theme === 'diamond' ? '💎' : '✨'}</span><div><small>LE CERCLE ACTIVO</small><b>${html(active.name)}</b><em>Hasta ${html(date(active.ends_at))}</em></div></div>`
      : `<p class="fs-loyalty-muted">${isLaunched ? 'No tienes una membresía Le Cercle activa.' : 'Le Cercle se habilitará automáticamente junto con French Rewards.'}</p>`;

    panel.innerHTML = `
      <div class="fs-loyalty-head"><div><span class="eyebrow">FRENCH REWARDS</span><h3>${isLaunched ? 'Tus puntos y beneficios' : 'Próximo programa de beneficios'}</h3></div><button class="icon-btn" data-fs-loyalty-refresh aria-label="Actualizar Rewards">↻</button></div>
      ${renderLaunchGoal()}
      <div class="fs-reward-balance-grid ${isLaunched ? '' : 'prelaunch'}">
        <div class="fs-reward-balance"><span>Disponibles</span><strong>${available.toLocaleString('es-BO')} pts</strong><small>${int(s.points_per_bob)} pts = Bs 1,00</small></div>
        <div class="fs-reward-balance secondary"><span>Pendientes</span><strong>${pending.toLocaleString('es-BO')} pts</strong><small>${isLaunched ? 'Se liberan después del período de seguridad.' : 'Los Rewards comenzarán cuando se complete la meta.'}</small></div>
      </div>
      <div class="fs-redeem-box ${isLaunched ? '' : 'prelaunch'}"><div><b>Canjear a French Wallet</b><small>${isLaunched ? `Mínimo ${minRedeem.toLocaleString('es-BO')} puntos. Los puntos se convierten en saldo real de Wallet.` : 'El canje permanecerá bloqueado hasta el lanzamiento automático.'}</small></div>
        <div class="fs-redeem-actions"><input id="fsRedeemPoints" type="number" inputmode="numeric" min="${minRedeem}" max="${Math.max(maxRedeem,minRedeem)}" step="100" value="${canRedeem ? minRedeem : ''}" placeholder="${minRedeem}" ${isLaunched ? '' : 'disabled'}><button class="secondary-btn" data-fs-redeem ${canRedeem ? '' : 'disabled'}>Canjear</button></div>
      </div>
      <div class="fs-cercle-section"><div class="fs-cercle-heading"><span class="eyebrow">LE CERCLE FRENCH</span><h3>Tu membresía de FRENCH STORE</h3><p>Mejores beneficios sin alterar el precio base de pago: el ahorro se devuelve como French Rewards y cada producto conserva un margen de seguridad.</p></div>${passStatus}
        <div class="fs-pass-grid">${(s.plans || []).map((plan) => planCard(plan, active, isLaunched)).join('')}</div>
        <p class="fs-loyalty-fine">Le Cercle se paga con French Wallet, dura 30 días y no se renueva automáticamente. Los puntos varían según el producto y se generan únicamente cuando el pedido queda entregado. Rewarded Ads permanece desactivado hasta contar con una integración publicitaria verificada. <a href="./loyalty-terms.html" target="_blank" rel="noopener noreferrer">Ver condiciones.</a></p>
      </div>
      ${isLaunched ? `<div class="fs-recent-rewards"><h4>Actividad reciente</h4>${recentRows(s.recent)}</div>` : ''}`;
  }

  function renderError(message) {
    ensureShell();
    const panel = document.getElementById('fsLoyaltyPanel');
    if (!panel || !authenticated()) return;
    panel.classList.remove('hidden');
    panel.innerHTML = `<div class="notice error">${html(message)}</div>`;
  }

  async function purchasePass(code, button) {
    if (!launched()) { window.alert(errorMessage(new Error('LOYALTY_NOT_LAUNCHED'))); return; }
    const plan = state.summary?.plans?.find?.((item) => item.code === code);
    if (!plan) return;
    const verb = state.summary?.active_pass?.code === code ? 'renovar' : 'activar';
    if (!window.confirm(`¿Quieres ${verb} ${plan.name} por ${bob(plan.price_bob)} usando French Wallet? No hay renovación automática.`)) return;
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

  window.FSLoyalty = Object.freeze({ version: VERSION, refresh: () => fetchSummary(true) });
  init();
})();
