/* THE FRENCH STORE — R163 panel privado "Cuentas en Venta".
   Solo el propietario puede usarlo: la tabla y el bucket tienen RLS que exige
   admin_app_is_allowed(), así que aunque alguien abriera este panel, Supabase
   rechazaría cualquier escritura.

   No toca productos, precios, Wallet, pedidos, checkout ni proveedores.

   Las fotos se reescalan en el navegador antes de subirlas: una captura de
   teléfono de 4 MB queda en ~250 KB WebP sin pérdida visible. Así la vitrina
   carga rápido y el bucket no se llena. No se instala ninguna librería: lo
   hace el propio canvas del navegador. */
(() => {
  'use strict';

  const VERSION = 'r163-cuentas-20260911';
  const SUPABASE_URL = 'https://jivaaripugjdpxjvjnsu.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImppdmFhcmlwdWdqZHB4anZqbnN1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU2NDY3MzIsImV4cCI6MjEwMTIyMjczMn0.N60Xb1PqqPo12HdKEzPc4qCp1aFvVzwZz4VG04q_Es4';
  const BUCKET = 'cuentas';
  const MAX_LADO = 1600;
  const CALIDAD = 0.86;

  const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY,
    { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } });

  const $ = (id) => document.getElementById(id);
  const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[c]));
  const text = (v) => String(v ?? '').trim();
  const money = (v) => `Bs ${Number(v || 0).toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  let cuentas = [];
  let fotosActuales = [];
  let editandoId = null;
  let instalado = false;

  function aviso(mensaje) {
    const el = $('cuentasAviso');
    if (!el) return;
    el.textContent = mensaje;
    el.classList.remove('hidden');
    setTimeout(() => el.classList.add('hidden'), 4200);
  }

  function fotoUrl(ruta) {
    const limpia = text(ruta).replace(/^\/+/, '');
    return limpia ? `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${limpia}` : '';
  }

  /* Reescala y convierte a WebP en el navegador. Devuelve un Blob. */
  function comprimir(archivo) {
    return new Promise((resolve, reject) => {
      const lector = new FileReader();
      lector.onerror = () => reject(new Error('No se pudo leer la imagen.'));
      lector.onload = () => {
        const img = new Image();
        img.onerror = () => reject(new Error('La imagen no es válida.'));
        img.onload = () => {
          const escala = Math.min(1, MAX_LADO / Math.max(img.width, img.height));
          const ancho = Math.round(img.width * escala);
          const alto = Math.round(img.height * escala);
          const lienzo = document.createElement('canvas');
          lienzo.width = ancho;
          lienzo.height = alto;
          const ctx = lienzo.getContext('2d');
          if (!ctx) return reject(new Error('El navegador no permite procesar la imagen.'));
          ctx.drawImage(img, 0, 0, ancho, alto);
          lienzo.toBlob(
            (blob) => blob ? resolve(blob) : reject(new Error('No se pudo convertir la imagen.')),
            'image/webp',
            CALIDAD
          );
        };
        img.src = lector.result;
      };
      lector.readAsDataURL(archivo);
    });
  }

  async function subirFotos(archivos) {
    const barra = $('cuentasSubiendo');
    const total = archivos.length;
    let hechas = 0;
    if (barra) { barra.classList.remove('hidden'); barra.textContent = `Subiendo 0/${total}…`; }

    for (const archivo of archivos) {
      try {
        const blob = await comprimir(archivo);
        const nombre = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.webp`;
        const { error } = await sb.storage.from(BUCKET).upload(nombre, blob, {
          contentType: 'image/webp',
          upsert: false
        });
        if (error) throw error;
        fotosActuales.push(nombre);
      } catch (error) {
        aviso(`No se pudo subir una foto: ${text(error?.message).slice(0, 90)}`);
      }
      hechas += 1;
      if (barra) barra.textContent = `Subiendo ${hechas}/${total}…`;
    }

    if (barra) barra.classList.add('hidden');
    pintarFotos();
  }

  function pintarFotos() {
    const host = $('cuentasFotos');
    if (!host) return;
    if (!fotosActuales.length) {
      host.innerHTML = '<small>Sin fotos todavía. La primera es la portada.</small>';
      return;
    }
    host.innerHTML = fotosActuales.map((ruta, i) => `
      <div class="cuenta-foto">
        <img src="${esc(fotoUrl(ruta))}" alt="Foto ${i + 1}">
        <div class="cuenta-foto-acciones">
          ${i > 0 ? `<button type="button" data-mover="${i}" title="Mover antes">◀</button>` : ''}
          <button type="button" data-quitar="${i}" title="Quitar">✕</button>
        </div>
        ${i === 0 ? '<span class="cuenta-foto-portada">Portada</span>' : ''}
      </div>`).join('');

    host.querySelectorAll('[data-quitar]').forEach((b) => b.addEventListener('click', () => {
      fotosActuales.splice(Number(b.dataset.quitar), 1);
      pintarFotos();
    }));
    host.querySelectorAll('[data-mover]').forEach((b) => b.addEventListener('click', () => {
      const i = Number(b.dataset.mover);
      [fotosActuales[i - 1], fotosActuales[i]] = [fotosActuales[i], fotosActuales[i - 1]];
      pintarFotos();
    }));
  }

  function leerDestacados() {
    return text($('cuentaDestacados')?.value)
      .split('\n')
      .map((linea) => {
        const [etiqueta, ...resto] = linea.split(':');
        return { etiqueta: text(etiqueta), valor: text(resto.join(':')) };
      })
      .filter((d) => d.etiqueta && d.valor)
      .slice(0, 6);
  }

  function limpiarFormulario() {
    editandoId = null;
    fotosActuales = [];
    ['cuentaJuego', 'cuentaTitulo', 'cuentaPrecio', 'cuentaOrden', 'cuentaDescripcion', 'cuentaDestacados']
      .forEach((id) => { const el = $(id); if (el) el.value = ''; });
    const estado = $('cuentaEstado');
    if (estado) estado.value = 'DISPONIBLE';
    const boton = $('cuentaGuardar');
    if (boton) boton.textContent = 'Publicar cuenta';
    pintarFotos();
  }

  async function guardar() {
    const fila = {
      juego: text($('cuentaJuego')?.value),
      titulo: text($('cuentaTitulo')?.value),
      descripcion: text($('cuentaDescripcion')?.value),
      destacados: leerDestacados(),
      precio_bs: Number($('cuentaPrecio')?.value),
      fotos: fotosActuales.slice(),
      estado: text($('cuentaEstado')?.value) || 'DISPONIBLE',
      orden: Number($('cuentaOrden')?.value) || 0
    };

    if (!fila.juego || !fila.titulo) return aviso('Falta el juego o el título.');
    if (!Number.isFinite(fila.precio_bs) || fila.precio_bs <= 0) return aviso('El precio debe ser mayor a 0.');

    try {
      const { error } = editandoId
        ? await sb.from('cuentas_en_venta').update(fila).eq('id', editandoId)
        : await sb.from('cuentas_en_venta').insert(fila);
      if (error) throw error;
      aviso(editandoId ? 'Cuenta actualizada.' : 'Cuenta publicada.');
      limpiarFormulario();
      await cargar();
    } catch (error) {
      aviso(`No se pudo guardar: ${text(error?.message).slice(0, 110)}`);
    }
  }

  function editar(id) {
    const cuenta = cuentas.find((c) => String(c.id) === String(id));
    if (!cuenta) return;
    editandoId = cuenta.id;
    fotosActuales = Array.isArray(cuenta.fotos) ? cuenta.fotos.slice() : [];
    $('cuentaJuego').value = cuenta.juego || '';
    $('cuentaTitulo').value = cuenta.titulo || '';
    $('cuentaPrecio').value = cuenta.precio_bs || '';
    $('cuentaOrden').value = cuenta.orden || 0;
    $('cuentaEstado').value = cuenta.estado || 'DISPONIBLE';
    $('cuentaDescripcion').value = cuenta.descripcion || '';
    $('cuentaDestacados').value = (Array.isArray(cuenta.destacados) ? cuenta.destacados : [])
      .map((d) => `${text(d?.etiqueta)}: ${text(d?.valor)}`).join('\n');
    const boton = $('cuentaGuardar');
    if (boton) boton.textContent = 'Guardar cambios';
    pintarFotos();
    $('cuentaJuego')?.scrollIntoView({ block: 'center' });
  }

  async function borrar(id) {
    const cuenta = cuentas.find((c) => String(c.id) === String(id));
    if (!cuenta) return;
    if (!window.confirm(`¿Borrar "${cuenta.titulo}"? Las fotos también se eliminan.`)) return;
    try {
      const rutas = Array.isArray(cuenta.fotos) ? cuenta.fotos : [];
      if (rutas.length) await sb.storage.from(BUCKET).remove(rutas);
      const { error } = await sb.from('cuentas_en_venta').delete().eq('id', id);
      if (error) throw error;
      aviso('Cuenta borrada.');
      if (String(editandoId) === String(id)) limpiarFormulario();
      await cargar();
    } catch (error) {
      aviso(`No se pudo borrar: ${text(error?.message).slice(0, 110)}`);
    }
  }

  async function cargar() {
    const host = $('cuentasLista');
    if (!host) return;
    host.innerHTML = '<article class="card"><small>Cargando cuentas…</small></article>';
    try {
      const { data, error } = await sb
        .from('cuentas_en_venta')
        .select('*')
        .order('orden', { ascending: true })
        .order('creado_en', { ascending: false });
      if (error) throw error;
      cuentas = Array.isArray(data) ? data : [];
    } catch (error) {
      host.innerHTML = `<article class="card"><small>${esc(text(error?.message) || 'No se pudieron cargar las cuentas.')}</small></article>`;
      return;
    }

    if (!cuentas.length) {
      host.innerHTML = '<article class="card"><small>Todavía no publicaste ninguna cuenta.</small></article>';
      return;
    }

    host.innerHTML = cuentas.map((c) => `
      <article class="card">
        <div class="card-top">
          <div>
            <b>${esc(c.juego)} · ${esc(c.titulo)}</b>
            <small>${money(c.precio_bs)} · ${esc(c.estado)} · ${Array.isArray(c.fotos) ? c.fotos.length : 0} foto(s) · orden ${Number(c.orden) || 0}</small>
          </div>
        </div>
        <div class="card-actions">
          <button class="primary" type="button" data-editar="${esc(c.id)}">Editar</button>
          <button type="button" data-borrar="${esc(c.id)}">Borrar</button>
        </div>
      </article>`).join('');

    host.querySelectorAll('[data-editar]').forEach((b) => b.addEventListener('click', () => editar(b.dataset.editar)));
    host.querySelectorAll('[data-borrar]').forEach((b) => b.addEventListener('click', () => borrar(b.dataset.borrar)));
  }

  function install() {
    if (instalado || !$('cuentasPanel')) return;
    instalado = true;

    $('cuentaGuardar')?.addEventListener('click', guardar);
    $('cuentaLimpiar')?.addEventListener('click', limpiarFormulario);
    $('cuentaArchivos')?.addEventListener('change', (evento) => {
      const archivos = [...(evento.target.files || [])];
      evento.target.value = '';
      if (archivos.length) subirFotos(archivos);
    });

    document.querySelector('[data-tab="cuentas"]')?.addEventListener('click', () => { cargar().catch(() => {}); });
    pintarFotos();
  }

  window.FSAdminCuentas = Object.freeze({ version: VERSION, recargar: cargar });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once: true });
  else install();
})();
