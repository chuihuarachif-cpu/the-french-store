/* R169 — recordatorios privados de vencimiento de Streaming.
   Solo guarda servicio, perfil/usuario, fecha, nota y configuración del aviso.
   El correo se usa únicamente en el navegador para generar un hash de deduplicación;
   correo, contraseña y PIN nunca se almacenan en la tabla de recordatorios. */
(() => {
  'use strict';

  const SUPABASE_URL = 'https://jivaaripugjdpxjvjnsu.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImppdmFhcmlwdWdqZHB4anZqbnN1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU2NDY3MzIsImV4cCI6MjEwMTIyMjczMn0.N60Xb1PqqPo12HdKEzPc4qCp1aFvVzwZz4VG04q_Es4';
  const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
  });

  const $ = (id) => document.getElementById(id);
  const text = (value) => String(value ?? '').trim();
  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
  }[char]));

  let reminders = [];
  let installed = false;

  function setStatus(message, kind = '') {
    const el = $('streamingReminderStatus');
    if (!el) return;
    el.className = `r168-status ${kind}`.trim();
    el.textContent = message;
  }

  function selectedOrder(selectId) {
    const id = text($(selectId)?.value);
    return recentOrders.find((row) => String(row.order_id) === id) || null;
  }

  function renderOrderOptions() {
    const options = ['<option value="">Sin vincular · solo recordatorio Admin</option>']
      .concat(recentOrders.map((row) => {
        const label = [row.order_code, row.products, row.customer_email].filter(Boolean).join(' · ');
        return `<option value="${esc(row.order_id)}">${esc(label)}</option>`;
      })).join('');
    ['deliveryReminderOrder','manualReminderOrder'].forEach((id) => {
      const select = $(id);
      if (!select) return;
      const current = select.value;
      select.innerHTML = options;
      if ([...select.options].some((option) => option.value === current)) select.value = current;
    });
  }

  async function loadRecentOrders() {
    try {
      const { data, error } = await sb.rpc('admin_app_recent_streaming_orders');
      if (error) throw error;
      recentOrders = Array.isArray(data) ? data : [];
      renderOrderOptions();
    } catch {
      recentOrders = [];
      renderOrderOptions();
    }
  }

  function parseDeliveryDate(value) {
    const raw = text(value);
    const iso = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (iso) return raw;

    const match = raw.match(/(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);
    if (!match) return '';
    const day = String(Number(match[1])).padStart(2, '0');
    const month = String(Number(match[2])).padStart(2, '0');
    const year = match[3].length === 2 ? `20${match[3]}` : match[3];
    const candidate = `${year}-${month}-${day}`;
    const date = new Date(`${candidate}T00:00:00Z`);
    if (
      Number.isNaN(date.getTime()) ||
      date.getUTCFullYear() !== Number(year) ||
      date.getUTCMonth() + 1 !== Number(month) ||
      date.getUTCDate() !== Number(day)
    ) return '';
    return candidate;
  }

  function formatDate(iso) {
    const match = text(iso).match(/^(\d{4})-(\d{2})-(\d{2})$/);
    return match ? `${match[3]}/${match[2]}/${match[1]}` : text(iso);
  }

  function todayIso() {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/La_Paz',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).formatToParts(new Date());
    const get = (type) => parts.find((part) => part.type === type)?.value || '';
    return `${get('year')}-${get('month')}-${get('day')}`;
  }

  function daysLeft(iso) {
    const today = new Date(`${todayIso()}T00:00:00Z`);
    const expiry = new Date(`${iso}T00:00:00Z`);
    if (Number.isNaN(expiry.getTime())) return null;
    return Math.round((expiry.getTime() - today.getTime()) / 86400000);
  }

  function countdownLabel(iso) {
    const left = daysLeft(iso);
    if (left == null) return '';
    if (left < 0) return `Venció hace ${Math.abs(left)} día(s)`;
    if (left === 0) return 'Vence hoy';
    if (left === 1) return 'Vence mañana';
    return `Faltan ${left} días`;
  }

  async function sha256Hex(value) {
    const bytes = new TextEncoder().encode(String(value));
    const digest = await crypto.subtle.digest('SHA-256', bytes);
    return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
  }

  async function deliveryFingerprint(service, email, profile) {
    const seed = [text(service).toLowerCase(), text(email).toLowerCase(), text(profile).toLowerCase()].join('|');
    return `delivery:${await sha256Hex(seed)}`;
  }

  async function saveDeliveryReminder() {
    const service = text($('deliveryService')?.value);
    const profile = text($('deliveryProfile')?.value) || text($('deliveryHolder')?.value);
    const email = text($('deliveryEmail')?.value);
    const expiresOn = parseDeliveryDate($('deliveryEnd')?.value);
    const order = selectedOrder('deliveryReminderOrder');

    if (!service || !expiresOn) {
      setStatus('No guardé recordatorio: falta servicio o una fecha de vencimiento válida.', 'warn');
      return false;
    }

    try {
      const fingerprint = await deliveryFingerprint(service, email, profile);
      const row = {
        service,
        profile_name: profile,
        expires_on: expiresOn,
        note: 'Guardado automáticamente desde Entregas.',
        source: 'DELIVERY',
        fingerprint,
        notify_days_before: [3, 1, 0],
        active: true,
        last_notified_on: null,
        order_id: order?.order_id || null,
        customer_user_id: order?.customer_user_id || null
      };
      const { error } = await sb.from('streaming_reminders').upsert(row, { onConflict: 'fingerprint' });
      if (error) throw error;
      setStatus(`Recordatorio guardado: ${service} · ${profile || 'sin perfil'} · vence ${formatDate(expiresOn)}.${order ? ' Cliente vinculado para Push.' : ' Sin pedido vinculado: solo recibirás el aviso Admin.'}`, 'ok');
      await loadReminders();
      return true;
    } catch (error) {
      setStatus(`No pude guardar el recordatorio: ${text(error?.message).slice(0, 120)}`, 'warn');
      return false;
    }
  }

  async function saveManualReminder() {
    const service = text($('manualReminderService')?.value);
    const profile = text($('manualReminderProfile')?.value);
    const expiresOn = text($('manualReminderDate')?.value);
    const note = text($('manualReminderNote')?.value);
    const order = selectedOrder('manualReminderOrder');

    if (!service || !/^\d{4}-\d{2}-\d{2}$/.test(expiresOn)) {
      setStatus('Para el recordatorio manual necesito plataforma y fecha de corte.', 'warn');
      return;
    }

    try {
      const row = {
        service,
        profile_name: profile,
        expires_on: expiresOn,
        note,
        source: 'MANUAL',
        fingerprint: `manual:${crypto.randomUUID()}`,
        notify_days_before: [3, 1, 0],
        active: true,
        order_id: order?.order_id || null,
        customer_user_id: order?.customer_user_id || null
      };
      const { error } = await sb.from('streaming_reminders').insert(row);
      if (error) throw error;
      ['manualReminderService', 'manualReminderProfile', 'manualReminderDate', 'manualReminderNote', 'manualReminderOrder']
        .forEach((id) => { const el = $(id); if (el) el.value = ''; });
      setStatus(`Recordatorio manual creado para ${service}.`, 'ok');
      await loadReminders();
    } catch (error) {
      setStatus(`No pude crear el recordatorio: ${text(error?.message).slice(0, 120)}`, 'warn');
    }
  }

  async function updateDate(id) {
    const input = document.querySelector(`[data-reminder-date="${CSS.escape(String(id))}"]`);
    const expiresOn = text(input?.value);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(expiresOn)) return setStatus('Elige una fecha válida.', 'warn');
    try {
      const { error } = await sb.from('streaming_reminders')
        .update({ expires_on: expiresOn, active: true, last_notified_on: null })
        .eq('id', id);
      if (error) throw error;
      setStatus('Fecha renovada. Los avisos quedan activos otra vez.', 'ok');
      await loadReminders();
    } catch (error) {
      setStatus(`No pude renovar la fecha: ${text(error?.message).slice(0, 120)}`, 'warn');
    }
  }

  async function toggleReminder(id, active) {
    try {
      const { error } = await sb.from('streaming_reminders')
        .update({ active: !active, last_notified_on: null })
        .eq('id', id);
      if (error) throw error;
      setStatus(!active ? 'Recordatorio activado.' : 'Recordatorio pausado.', 'ok');
      await loadReminders();
    } catch (error) {
      setStatus(`No pude cambiar el estado: ${text(error?.message).slice(0, 120)}`, 'warn');
    }
  }

  async function deleteReminder(id) {
    if (!window.confirm('¿Borrar este recordatorio de vencimiento?')) return;
    try {
      const { error } = await sb.from('streaming_reminders').delete().eq('id', id);
      if (error) throw error;
      setStatus('Recordatorio borrado.', 'ok');
      await loadReminders();
    } catch (error) {
      setStatus(`No pude borrar el recordatorio: ${text(error?.message).slice(0, 120)}`, 'warn');
    }
  }

  function renderReminders() {
    const host = $('streamingReminderList');
    if (!host) return;
    if (!reminders.length) {
      host.innerHTML = '<div class="r169-empty">Aún no tienes vencimientos guardados.</div>';
      return;
    }

    host.innerHTML = reminders.map((row) => {
      const expired = (daysLeft(row.expires_on) ?? 0) < 0;
      return `
        <article class="r169-reminder ${row.active ? '' : 'is-paused'} ${expired ? 'is-expired' : ''}">
          <div class="r169-reminder-main">
            <div>
              <strong>${esc(row.service)}</strong>
              <span>${esc(row.profile_name || 'Sin perfil/usuario')} · ${row.source === 'DELIVERY' ? 'Desde Entregas' : 'Manual'} · ${row.customer_user_id ? 'Push cliente ✓' : 'Solo Admin'}</span>
            </div>
            <b class="r169-countdown">${esc(countdownLabel(row.expires_on))}</b>
          </div>
          ${row.note ? `<p>${esc(row.note)}</p>` : ''}
          <div class="r169-reminder-actions">
            <input type="date" value="${esc(row.expires_on)}" data-reminder-date="${esc(row.id)}" aria-label="Nueva fecha de vencimiento">
            <button type="button" data-reminder-save="${esc(row.id)}">Guardar fecha</button>
            <button type="button" data-reminder-toggle="${esc(row.id)}" data-active="${row.active ? '1' : '0'}">${row.active ? 'Pausar' : 'Activar'}</button>
            <button type="button" data-reminder-delete="${esc(row.id)}">Borrar</button>
          </div>
        </article>`;
    }).join('');

    host.querySelectorAll('[data-reminder-save]').forEach((button) => {
      button.addEventListener('click', () => updateDate(button.dataset.reminderSave));
    });
    host.querySelectorAll('[data-reminder-toggle]').forEach((button) => {
      button.addEventListener('click', () => toggleReminder(button.dataset.reminderToggle, button.dataset.active === '1'));
    });
    host.querySelectorAll('[data-reminder-delete]').forEach((button) => {
      button.addEventListener('click', () => deleteReminder(button.dataset.reminderDelete));
    });
  }

  async function loadReminders() {
    const host = $('streamingReminderList');
    if (!host) return;
    host.innerHTML = '<div class="r169-empty">Cargando vencimientos…</div>';
    try {
      const { data, error } = await sb.from('streaming_reminders')
        .select('id,service,profile_name,expires_on,note,source,active,last_notified_on,created_at,order_id,customer_user_id')
        .order('active', { ascending: false })
        .order('expires_on', { ascending: true });
      if (error) throw error;
      reminders = Array.isArray(data) ? data : [];
      renderReminders();
    } catch (error) {
      host.innerHTML = `<div class="r169-empty">No pude cargar recordatorios: ${esc(text(error?.message).slice(0, 120))}</div>`;
    }
  }

  function markup() {
    return `<section class="r169-reminders" id="streamingRemindersBox">
      <div class="r169-head">
        <div>
          <span class="eyebrow">VENCIMIENTOS</span>
          <h3>Recordatorios de cuentas Streaming</h3>
          <p>Al copiar una entrega se guarda automáticamente plataforma, perfil/usuario y vencimiento. Telegram avisa 3 días antes, 1 día antes y el mismo día.</p>
        </div>
      </div>
      <div id="streamingReminderStatus" class="r168-status">No se guardan contraseñas ni PIN. El correo solo se usa localmente para evitar duplicados.</div>
      <div class="r169-customer-link">
        <label class="r168-label"><span>Pedido del cliente · para avisarle por Push</span><select id="deliveryReminderOrder"><option value="">Cargando pedidos Streaming…</option></select></label>
        <small>Selecciona el pedido correspondiente antes de copiar la entrega. Si lo dejas sin vincular, el recordatorio seguirá funcionando solo para tu Telegram/Admin.</small>
      </div>
      <div class="r169-manual">
        <h4>Agregar recordatorio independiente</h4>
        <div class="r168-fields">
          <label class="r168-label"><span>Plataforma</span><input id="manualReminderService" type="text" autocomplete="off" placeholder="Netflix, Disney+, Spotify…"></label>
          <label class="r168-label"><span>Perfil / usuario</span><input id="manualReminderProfile" type="text" autocomplete="off" placeholder="YEISON, Familiar 2…"></label>
          <label class="r168-label"><span>Fecha de corte</span><input id="manualReminderDate" type="date"></label>
          <label class="r168-label"><span>Nota opcional</span><input id="manualReminderNote" type="text" maxlength="500" autocomplete="off" placeholder="Proveedor, cuenta propia, renovar tarjeta…"></label>
          <label class="r168-label wide"><span>Pedido del cliente · opcional</span><select id="manualReminderOrder"><option value="">Sin vincular · solo recordatorio Admin</option></select></label>
        </div>
        <div class="r168-actions"><button id="manualReminderSave" class="primary" type="button">🔔 Guardar recordatorio</button></div>
      </div>
      <div class="r169-list-head"><h4>Próximos vencimientos</h4><button id="streamingReminderRefresh" class="secondary" type="button">↻ Actualizar</button></div>
      <div id="streamingReminderList" class="r169-list"></div>
    </section>`;
  }

  function install() {
    if (installed || !$('deliveriesPanel')) return;
    installed = true;

    const panel = $('deliveriesPanel');
    const preview = panel.querySelector('.r168-preview');
    const shell = document.createElement('div');
    shell.innerHTML = markup();
    const section = shell.firstElementChild;
    panel.insertBefore(section, preview || null);

    $('manualReminderSave')?.addEventListener('click', saveManualReminder);
    $('streamingReminderRefresh')?.addEventListener('click', () => { loadRecentOrders().catch(() => {}); loadReminders().catch(() => {}); });
    $('deliveryCopy')?.addEventListener('click', () => { saveDeliveryReminder().catch(() => {}); });
    document.querySelector('[data-tab="deliveries"]')?.addEventListener('click', () => { loadReminders().catch(() => {}); });

    loadRecentOrders().catch(() => {});
    loadReminders().catch(() => {});
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once: true });
  else install();
})();
