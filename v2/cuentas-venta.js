/* THE FRENCH STORE — R163 sección "Cuentas en Venta".
   R164: el bloque de entrada vive DENTRO de la rejilla de categorías, a lo
   ancho y debajo de Streaming y Gift Cards, y lleva a una vista propia
   (`view-cuentas`), igual que Gift Cards lleva al catálogo.

   NO es una quinta categoría: las categorías públicas siguen siendo exactamente
   `Recargas por ID`, `Recargas por Cuenta`, `Streaming` y `Gift Cards`. Esta
   sección vive aparte y no toca catálogo, precios, checkout, Wallet ni
   proveedores.

   Inventario de UNA unidad: cada cuenta se vende una sola vez. Por eso la ficha
   lleva estado y la compra se cierra por WhatsApp, no por el carrito.

   Presentación pura: lee la tabla `cuentas_en_venta` (solo SELECT) y arma un
   enlace de WhatsApp. No escribe nada. */
(() => {
  'use strict';

  const VERSION = 'cuentas-venta-r163-20260911';
  const BUCKET = 'cuentas';

  const ESTADOS = Object.freeze({
    DISPONIBLE: { clase: 'disponible', texto: 'Disponible' },
    RESERVADA:  { clase: 'reservada',  texto: 'Reservada' },
    VENDIDA:    { clase: 'vendida',    texto: 'Vendida' }
  });

  function text(value) { return String(value ?? '').trim(); }

  function money(value) {
    return `Bs ${Number(value || 0).toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  function esc(value) {
    return String(value ?? '').replace(/[&<>"']/g, (c) => (
      { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[c]
    ));
  }

  /* Las fotos viven en un bucket público; la CSP ya permite img-src https:. */
  function fotoUrl(ruta) {
    const limpia = text(ruta).replace(/^\/+/, '');
    if (!limpia) return '';
    if (/^https?:\/\//i.test(limpia)) return limpia;
    try {
      return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${limpia}`;
    } catch { return ''; }
  }

  function listaFotos(cuenta) {
    return Array.isArray(cuenta?.fotos) ? cuenta.fotos.map(fotoUrl).filter(Boolean) : [];
  }

  function listaChips(cuenta) {
    if (!Array.isArray(cuenta?.destacados)) return [];
    return cuenta.destacados
      .map((d) => ({ etiqueta: text(d?.etiqueta), valor: text(d?.valor) }))
      .filter((d) => d.etiqueta && d.valor)
      .slice(0, 6);
  }

  function whatsappNumero() {
    const configurado = text(window.FSStorefrontConfig?.whatsapp);
    if (configurado) return configurado.replace(/\D+/g, '');
    try { return text(WHATSAPP).replace(/\D+/g, ''); } catch { return ''; }
  }

  function enlaceWhatsapp(cuenta) {
    const numero = whatsappNumero();
    if (!numero) return '';
    const mensaje = [
      '¡Hola! Me interesa esta cuenta de FRENCH STORE:',
      '',
      `🎮 ${text(cuenta?.juego)}`,
      `📋 ${text(cuenta?.titulo)}`,
      `💰 ${money(cuenta?.precio_bs)}`,
      '',
      '¿Sigue disponible?'
    ].join('\n');
    return `https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`;
  }

  function tarjeta(cuenta) {
    const fotos = listaFotos(cuenta);
    const chips = listaChips(cuenta);
    const estado = ESTADOS[text(cuenta?.estado).toUpperCase()] || ESTADOS.DISPONIBLE;
    const vendida = estado === ESTADOS.VENDIDA;

    const portada = fotos.length
      ? `<img src="${esc(fotos[0])}" alt="Vista de la cuenta: ${esc(cuenta?.titulo)}" loading="lazy" decoding="async">`
      : '<div class="cv-sin-foto">Sin fotos todavía</div>';

    const contador = fotos.length > 1 ? `<span class="cv-count">🖼 ${fotos.length}</span>` : '';

    return `
      <button type="button" class="cv-card${vendida ? ' es-vendida' : ''}" data-cuenta="${esc(cuenta.id)}">
        <div class="cv-shot">${portada}${contador}</div>
        <div class="cv-body">
          <span class="cv-juego">${esc(cuenta?.juego)}</span>
          <h3 class="cv-titulo">${esc(cuenta?.titulo)}</h3>
          ${chips.length ? `<div class="cv-chips">${chips.map((c) => `<span class="cv-chip">${esc(c.etiqueta)}: ${esc(c.valor)}</span>`).join('')}</div>` : ''}
          <div class="cv-pie">
            <span class="cv-precio">${money(cuenta?.precio_bs)}</span>
            <span class="cv-estado ${estado.clase}">${estado.texto}</span>
          </div>
        </div>
      </button>`;
  }

  let cuentas = [];

  function abrirFicha(id) {
    const cuenta = cuentas.find((c) => String(c.id) === String(id));
    if (!cuenta) return;

    const fotos = listaFotos(cuenta);
    const chips = listaChips(cuenta);
    const estado = ESTADOS[text(cuenta?.estado).toUpperCase()] || ESTADOS.DISPONIBLE;
    const disponible = estado === ESTADOS.DISPONIBLE;
    const enlace = enlaceWhatsapp(cuenta);

    const galeria = fotos.length ? `
      <div class="cv-galeria">
        <div class="cv-galeria-principal">
          <img id="cvFotoGrande" src="${esc(fotos[0])}" alt="Vista de la cuenta: ${esc(cuenta.titulo)}" decoding="async">
        </div>
        ${fotos.length > 1 ? `<div class="cv-miniaturas">${fotos.map((f, i) => `
          <button type="button" data-foto="${esc(f)}" aria-current="${i === 0}" aria-label="Foto ${i + 1}">
            <img src="${esc(f)}" alt="" loading="lazy" decoding="async">
          </button>`).join('')}</div>` : ''}
      </div>` : '';

    const cuerpo = `
      <div class="cv-detalle">
        ${galeria}
        <div class="cv-pie">
          <span class="cv-precio">${money(cuenta.precio_bs)}</span>
          <span class="cv-estado ${estado.clase}">${estado.texto}</span>
        </div>
        ${chips.length ? `<div class="cv-chips">${chips.map((c) => `<span class="cv-chip">${esc(c.etiqueta)}: ${esc(c.valor)}</span>`).join('')}</div>` : ''}
        ${text(cuenta.descripcion) ? `<p class="cv-desc">${esc(cuenta.descripcion)}</p>` : ''}
        <p class="cv-aviso">Cada cuenta es única y se vende una sola vez. La entrega es manual y personal: conversamos por WhatsApp y coordinamos el traspaso contigo.</p>
        ${disponible && enlace
          ? `<a class="primary-btn full" href="${esc(enlace)}" target="_blank" rel="noopener noreferrer">Consultar por WhatsApp</a>`
          : `<button class="secondary-btn full" type="button" disabled>${estado === ESTADOS.VENDIDA ? 'Esta cuenta ya se vendió' : 'Reservada por otro cliente'}</button>`}
      </div>`;

    const modal = document.getElementById('cuentaModal');
    const host = document.getElementById('cuentaModalBody');
    const titulo = document.getElementById('cuentaModalTitle');
    if (!modal || !host) return;

    if (titulo) titulo.textContent = text(cuenta.titulo) || 'Cuenta en venta';
    host.innerHTML = cuerpo;

    host.querySelectorAll('.cv-miniaturas button').forEach((boton) => {
      boton.addEventListener('click', () => {
        const grande = document.getElementById('cvFotoGrande');
        if (grande) grande.src = boton.dataset.foto || '';
        host.querySelectorAll('.cv-miniaturas button').forEach((b) => b.setAttribute('aria-current', String(b === boton)));
      });
    });

    if (typeof openModal === 'function') openModal('cuentaModal');
    else modal.classList.add('open');
  }

  async function cargar() {
    const grid = document.getElementById('cuentasVentaGrid');
    const vacio = document.getElementById('cuentasVacio');
    if (!grid) return;

    let filas = [];
    try {
      const { data, error } = await sb
        .from('cuentas_en_venta')
        .select('id,juego,titulo,descripcion,destacados,precio_bs,fotos,estado,orden')
        .neq('estado', 'OCULTA')
        .order('orden', { ascending: true })
        .order('creado_en', { ascending: false });
      if (error) throw error;
      filas = Array.isArray(data) ? data : [];
    } catch {
      // Fail-closed: si no se puede leer, la vista queda con su mensaje y el
      // resto de la tienda sigue igual. Nunca bloquea catálogo ni checkout.
      grid.innerHTML = '';
      if (vacio) vacio.hidden = false;
      return;
    }

    if (!filas.length) {
      grid.innerHTML = '';
      if (vacio) vacio.hidden = false;
      return;
    }

    // Las disponibles primero; las vendidas al final como prueba social.
    const peso = { DISPONIBLE: 0, RESERVADA: 1, VENDIDA: 2 };
    cuentas = filas.slice().sort((a, b) =>
      (peso[text(a.estado).toUpperCase()] ?? 3) - (peso[text(b.estado).toUpperCase()] ?? 3));

    grid.innerHTML = cuentas.map(tarjeta).join('');
    if (vacio) vacio.hidden = true;

    grid.querySelectorAll('.cv-card').forEach((card) => {
      card.addEventListener('click', () => abrirFicha(card.dataset.cuenta));
    });
  }

  function install() {
    /* El bloque de la portada lleva a la vista, como Gift Cards lleva al
       catálogo. Se carga al entrar, no antes: así no pesa en la portada. */
    document.getElementById('cuentasEntry')?.addEventListener('click', () => {
      cargar().catch(() => {});
      if (typeof navigate === 'function') navigate('cuentas');
    });
  }

  window.FSCuentasVenta = Object.freeze({ version: VERSION, recargar: cargar });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once: true });
  else install();
})();
