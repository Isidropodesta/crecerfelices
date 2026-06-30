'use strict';

/* =====================================================================
   PANEL DE ADMINISTRACIÓN — lógica de secciones
   Requiere: db (de supabase-client.js)
   ===================================================================== */

/* ─── Utilidades compartidas ─────────────────────────────────────────── */

function mostrarMsg(elId, texto, tipo) {
  const el = document.getElementById(elId);
  if (!el) return;
  el.textContent = texto;
  el.className = tipo === 'ok' ? 'msg-ok' : 'msg-err';
  el.style.display = 'block';
  setTimeout(() => { el.style.display = 'none'; }, 5000);
}

async function subirImagen(archivo, carpeta) {
  const ext  = archivo.name.split('.').pop().toLowerCase();
  const path = `${carpeta}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const { error } = await db.storage.from('imagenes').upload(path, archivo);
  if (error) throw new Error(error.message);
  const { data } = db.storage.from('imagenes').getPublicUrl(path);
  return data.publicUrl;
}

/* =====================================================================
   TESTIMONIOS
   ===================================================================== */

let tEditandoId      = null;
let tEditandoFotoUrl = null;

function tResetForm() {
  tEditandoId      = null;
  tEditandoFotoUrl = null;
  document.getElementById('tFormTitulo').textContent  = 'Agregar testimonio';
  document.getElementById('tNombre').value            = '';
  document.getElementById('tRol').value               = '';
  document.getElementById('tTexto').value             = '';
  document.getElementById('tOrden').value             = '0';
  document.getElementById('tActivo').checked          = true;
  document.getElementById('tFoto').value              = '';
  const prev = document.getElementById('tFotoPreview');
  prev.src = ''; prev.style.display = 'none';
  document.getElementById('tBtnCancelar').style.display = 'none';
}

async function tCargar() {
  const lista = document.getElementById('tLista');
  lista.innerHTML = '<p style="color:var(--texto-suave);font-size:0.9rem;">Cargando…</p>';

  const { data, error } = await db
    .from('testimonios')
    .select('*')
    .order('orden')
    .order('created_at');

  if (error) {
    lista.innerHTML = '<p class="msg-err">Error al cargar los testimonios.</p>';
    return;
  }
  if (!data.length) {
    lista.innerHTML = '<p style="color:var(--texto-suave);font-size:0.9rem;">Todavía no hay testimonios. Usá el formulario de arriba para agregar el primero.</p>';
    return;
  }

  window._tData = data;

  lista.innerHTML = data.map(t => `
    <div class="item-admin">
      ${t.foto_url
        ? `<img src="${t.foto_url}" style="width:52px;height:52px;border-radius:50%;object-fit:cover;border:2px solid var(--gris-borde);flex-shrink:0;" alt="">`
        : `<div style="width:52px;height:52px;border-radius:50%;background:var(--fucsia);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:1.2rem;flex-shrink:0;">${(t.nombre[0]||'?').toUpperCase()}</div>`
      }
      <div class="item-admin-info">
        <div class="item-admin-nombre">${t.nombre}</div>
        <div class="item-admin-sub">${t.rol || '—'}</div>
      </div>
      <div class="item-admin-acciones">
        <span class="${t.activo ? 'badge-activo' : 'badge-inactivo'}">${t.activo ? 'Visible' : 'Oculto'}</span>
        <button class="btn-secundario" data-id="${t.id}" data-accion="editar">Editar</button>
        <button class="btn-peligro"    data-id="${t.id}" data-accion="eliminar">Eliminar</button>
      </div>
    </div>
  `).join('');

  lista.querySelectorAll('button[data-accion]').forEach(btn => {
    btn.addEventListener('click', () => {
      if (btn.dataset.accion === 'editar')   tIniciarEdicion(btn.dataset.id);
      if (btn.dataset.accion === 'eliminar') tEliminar(btn.dataset.id);
    });
  });
}

function tIniciarEdicion(id) {
  const t = (window._tData || []).find(x => x.id === id);
  if (!t) return;

  tEditandoId      = id;
  tEditandoFotoUrl = t.foto_url || null;

  document.getElementById('tFormTitulo').textContent  = 'Editar testimonio';
  document.getElementById('tNombre').value            = t.nombre;
  document.getElementById('tRol').value               = t.rol || '';
  document.getElementById('tTexto').value             = t.texto;
  document.getElementById('tOrden').value             = t.orden;
  document.getElementById('tActivo').checked          = t.activo;
  document.getElementById('tFoto').value              = '';

  const prev = document.getElementById('tFotoPreview');
  if (t.foto_url) { prev.src = t.foto_url; prev.style.display = 'block'; }
  else              { prev.style.display = 'none'; }

  document.getElementById('tBtnCancelar').style.display = '';
  document.getElementById('tForm').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

async function tEliminar(id) {
  if (!confirm('¿Eliminar este testimonio? No se puede deshacer.')) return;
  const { error } = await db.from('testimonios').delete().eq('id', id);
  if (error) { alert('Error al eliminar: ' + error.message); return; }
  tCargar();
}

document.getElementById('tFoto').addEventListener('change', (e) => {
  const archivo = e.target.files[0];
  const prev    = document.getElementById('tFotoPreview');
  if (archivo) { prev.src = URL.createObjectURL(archivo); prev.style.display = 'block'; }
  else          { prev.style.display = 'none'; }
});

document.getElementById('tBtnGuardar').addEventListener('click', async () => {
  const nombre = document.getElementById('tNombre').value.trim();
  const texto  = document.getElementById('tTexto').value.trim();

  if (!nombre || !texto) {
    mostrarMsg('tMsg', 'El nombre y el texto son obligatorios.', 'err');
    return;
  }

  const btn = document.getElementById('tBtnGuardar');
  btn.disabled = true; btn.textContent = 'Guardando…';

  try {
    let foto_url = tEditandoFotoUrl;
    const archivo = document.getElementById('tFoto').files[0];
    if (archivo) foto_url = await subirImagen(archivo, 'testimonios');

    const datos = {
      nombre,
      rol:      document.getElementById('tRol').value.trim() || null,
      texto,
      foto_url: foto_url || null,
      orden:    parseInt(document.getElementById('tOrden').value) || 0,
      activo:   document.getElementById('tActivo').checked,
    };

    const { error } = tEditandoId
      ? await db.from('testimonios').update(datos).eq('id', tEditandoId)
      : await db.from('testimonios').insert(datos);

    if (error) throw new Error(error.message);

    mostrarMsg('tMsg', tEditandoId ? '✅ Testimonio actualizado.' : '✅ Testimonio agregado.', 'ok');
    tResetForm();
    tCargar();

  } catch (e) {
    mostrarMsg('tMsg', '❌ Error: ' + e.message, 'err');
  } finally {
    btn.disabled = false; btn.textContent = 'Guardar';
  }
});

document.getElementById('tBtnCancelar').addEventListener('click', tResetForm);

// Carga inicial (testimonios es el tab activo por defecto)
tCargar();

/* =====================================================================
   ALIADOS
   ===================================================================== */

let aEditandoId      = null;
let aEditandoLogoUrl = null;

function aResetForm() {
  aEditandoId      = null;
  aEditandoLogoUrl = null;
  document.getElementById('aFormTitulo').textContent = 'Agregar aliado';
  document.getElementById('aNombre').value   = '';
  document.getElementById('aLink').value     = '';
  document.getElementById('aOrden').value    = '0';
  document.getElementById('aActivo').checked = true;
  document.getElementById('aLogo').value     = '';
  const prev = document.getElementById('aLogoPreview');
  prev.src = ''; prev.style.display = 'none';
  document.getElementById('aBtnCancelar').style.display = 'none';
}

async function aCargar() {
  const lista = document.getElementById('aLista');
  lista.innerHTML = '<p style="color:var(--texto-suave);font-size:0.9rem;">Cargando…</p>';

  const { data, error } = await db
    .from('aliados')
    .select('*')
    .order('orden')
    .order('created_at');

  if (error) {
    lista.innerHTML = '<p class="msg-err">Error al cargar los aliados.</p>';
    return;
  }
  if (!data.length) {
    lista.innerHTML = '<p style="color:var(--texto-suave);font-size:0.9rem;">Todavía no hay aliados. Usá el formulario de arriba para agregar el primero.</p>';
    return;
  }

  window._aData = data;

  lista.innerHTML = data.map(a => `
    <div class="item-admin">
      ${a.logo_url
        ? `<img src="${a.logo_url}" style="width:80px;height:52px;object-fit:contain;border:1.5px solid var(--gris-borde);border-radius:8px;padding:4px;background:#fff;flex-shrink:0;" alt="">`
        : `<div style="width:80px;height:52px;background:var(--gris-borde);border-radius:8px;flex-shrink:0;"></div>`
      }
      <div class="item-admin-info">
        <div class="item-admin-nombre">${a.nombre}</div>
        <div class="item-admin-sub">${a.link || 'Sin link'}</div>
      </div>
      <div class="item-admin-acciones">
        <span class="${a.activo ? 'badge-activo' : 'badge-inactivo'}">${a.activo ? 'Visible' : 'Oculto'}</span>
        <button class="btn-secundario" data-id="${a.id}" data-accion="editar">Editar</button>
        <button class="btn-peligro"    data-id="${a.id}" data-accion="eliminar">Eliminar</button>
      </div>
    </div>
  `).join('');

  lista.querySelectorAll('button[data-accion]').forEach(btn => {
    btn.addEventListener('click', () => {
      if (btn.dataset.accion === 'editar')   aIniciarEdicion(btn.dataset.id);
      if (btn.dataset.accion === 'eliminar') aEliminar(btn.dataset.id);
    });
  });
}

function aIniciarEdicion(id) {
  const a = (window._aData || []).find(x => x.id === id);
  if (!a) return;

  aEditandoId      = id;
  aEditandoLogoUrl = a.logo_url || null;

  document.getElementById('aFormTitulo').textContent = 'Editar aliado';
  document.getElementById('aNombre').value   = a.nombre;
  document.getElementById('aLink').value     = a.link || '';
  document.getElementById('aOrden').value    = a.orden;
  document.getElementById('aActivo').checked = a.activo;
  document.getElementById('aLogo').value     = '';

  const prev = document.getElementById('aLogoPreview');
  if (a.logo_url) { prev.src = a.logo_url; prev.style.display = 'block'; }
  else              { prev.style.display = 'none'; }

  document.getElementById('aBtnCancelar').style.display = '';
  document.getElementById('aForm').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

async function aEliminar(id) {
  if (!confirm('¿Eliminar este aliado? No se puede deshacer.')) return;
  const { error } = await db.from('aliados').delete().eq('id', id);
  if (error) { alert('Error al eliminar: ' + error.message); return; }
  aCargar();
}

document.getElementById('aLogo').addEventListener('change', (e) => {
  const archivo = e.target.files[0];
  const prev    = document.getElementById('aLogoPreview');
  if (archivo) { prev.src = URL.createObjectURL(archivo); prev.style.display = 'block'; }
  else          { prev.style.display = 'none'; }
});

document.getElementById('aBtnGuardar').addEventListener('click', async () => {
  const nombre = document.getElementById('aNombre').value.trim();
  if (!nombre) {
    mostrarMsg('aMsg', 'El nombre es obligatorio.', 'err');
    return;
  }

  const btn = document.getElementById('aBtnGuardar');
  btn.disabled = true; btn.textContent = 'Guardando…';

  try {
    let logo_url = aEditandoLogoUrl;
    const archivo = document.getElementById('aLogo').files[0];
    if (archivo) logo_url = await subirImagen(archivo, 'aliados');

    const datos = {
      nombre,
      link:     document.getElementById('aLink').value.trim() || null,
      logo_url: logo_url || null,
      orden:    parseInt(document.getElementById('aOrden').value) || 0,
      activo:   document.getElementById('aActivo').checked,
    };

    const { error } = aEditandoId
      ? await db.from('aliados').update(datos).eq('id', aEditandoId)
      : await db.from('aliados').insert(datos);

    if (error) throw new Error(error.message);

    mostrarMsg('aMsg', aEditandoId ? '✅ Aliado actualizado.' : '✅ Aliado agregado.', 'ok');
    aResetForm();
    aCargar();

  } catch (e) {
    mostrarMsg('aMsg', '❌ Error: ' + e.message, 'err');
  } finally {
    btn.disabled = false; btn.textContent = 'Guardar';
  }
});

document.getElementById('aBtnCancelar').addEventListener('click', aResetForm);

// Carga inicial de aliados
aCargar();

/* =====================================================================
   TALLERES
   ===================================================================== */

let tlEditandoId      = null;
let tlEditandoFotoUrl = null;

function tlResetForm() {
  tlEditandoId      = null;
  tlEditandoFotoUrl = null;
  document.getElementById('tlFormTitulo').textContent = 'Agregar taller';
  document.getElementById('tlNombre').value   = '';
  document.getElementById('tlDepto').value    = 'godoy-cruz';
  document.getElementById('tlHorario').value  = '';
  document.getElementById('tlBarrio').value   = '';
  document.getElementById('tlMapsUrl').value  = '';
  document.getElementById('tlOrden').value    = '0';
  document.getElementById('tlActivo').checked = true;
  document.getElementById('tlFoto').value     = '';
  const prev = document.getElementById('tlFotoPreview');
  prev.src = ''; prev.style.display = 'none';
  document.getElementById('tlBtnCancelar').style.display = 'none';
}

async function tlCargar() {
  const lista = document.getElementById('tlLista');
  lista.innerHTML = '<p style="color:var(--texto-suave);font-size:0.9rem;">Cargando…</p>';

  const { data, error } = await db
    .from('talleres')
    .select('*')
    .order('orden')
    .order('created_at');

  if (error) {
    lista.innerHTML = '<p class="msg-err">Error al cargar los talleres.</p>';
    return;
  }
  if (!data.length) {
    lista.innerHTML = '<p style="color:var(--texto-suave);font-size:0.9rem;">Todavía no hay talleres.</p>';
    return;
  }

  const DEPTOS = { 'godoy-cruz': 'Godoy Cruz', 'lujan-de-cuyo': 'Luján de Cuyo' };
  window._tlData = data;

  lista.innerHTML = data.map(t => `
    <div class="item-admin">
      ${t.foto_url
        ? `<img src="${t.foto_url}" style="width:80px;height:52px;object-fit:cover;border:1.5px solid var(--gris-borde);border-radius:8px;flex-shrink:0;" alt="">`
        : `<div style="width:80px;height:52px;background:var(--gris-borde);border-radius:8px;flex-shrink:0;"></div>`
      }
      <div class="item-admin-info">
        <div class="item-admin-nombre">${t.nombre}</div>
        <div class="item-admin-sub">${DEPTOS[t.departamento] || t.departamento} · ${t.barrio || '—'}</div>
      </div>
      <div class="item-admin-acciones">
        <span class="${t.activo ? 'badge-activo' : 'badge-inactivo'}">${t.activo ? 'Visible' : 'Oculto'}</span>
        <button class="btn-secundario" data-id="${t.id}" data-accion="editar">Editar</button>
        <button class="btn-peligro"    data-id="${t.id}" data-accion="eliminar">Eliminar</button>
      </div>
    </div>
  `).join('');

  lista.querySelectorAll('button[data-accion]').forEach(btn => {
    btn.addEventListener('click', () => {
      if (btn.dataset.accion === 'editar')   tlIniciarEdicion(btn.dataset.id);
      if (btn.dataset.accion === 'eliminar') tlEliminar(btn.dataset.id);
    });
  });
}

function tlIniciarEdicion(id) {
  const t = (window._tlData || []).find(x => x.id === id);
  if (!t) return;

  tlEditandoId      = id;
  tlEditandoFotoUrl = t.foto_url || null;

  document.getElementById('tlFormTitulo').textContent = 'Editar taller';
  document.getElementById('tlNombre').value   = t.nombre;
  document.getElementById('tlDepto').value    = t.departamento;
  document.getElementById('tlHorario').value  = t.horario || '';
  document.getElementById('tlBarrio').value   = t.barrio || '';
  document.getElementById('tlMapsUrl').value  = t.maps_url || '';
  document.getElementById('tlOrden').value    = t.orden;
  document.getElementById('tlActivo').checked = t.activo;
  document.getElementById('tlFoto').value     = '';

  const prev = document.getElementById('tlFotoPreview');
  if (t.foto_url) { prev.src = t.foto_url; prev.style.display = 'block'; }
  else              { prev.style.display = 'none'; }

  document.getElementById('tlBtnCancelar').style.display = '';
  document.getElementById('tlForm').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

async function tlEliminar(id) {
  if (!confirm('¿Eliminar este taller? No se puede deshacer.')) return;
  const { error } = await db.from('talleres').delete().eq('id', id);
  if (error) { alert('Error al eliminar: ' + error.message); return; }
  tlCargar();
}

document.getElementById('tlFoto').addEventListener('change', (e) => {
  const archivo = e.target.files[0];
  const prev    = document.getElementById('tlFotoPreview');
  if (archivo) { prev.src = URL.createObjectURL(archivo); prev.style.display = 'block'; }
  else          { prev.style.display = 'none'; }
});

document.getElementById('tlBtnGuardar').addEventListener('click', async () => {
  const nombre = document.getElementById('tlNombre').value.trim();
  if (!nombre) {
    mostrarMsg('tlMsg', 'El nombre es obligatorio.', 'err');
    return;
  }

  const btn = document.getElementById('tlBtnGuardar');
  btn.disabled = true; btn.textContent = 'Guardando…';

  try {
    let foto_url = tlEditandoFotoUrl;
    const archivo = document.getElementById('tlFoto').files[0];
    if (archivo) foto_url = await subirImagen(archivo, 'talleres');

    const datos = {
      nombre,
      departamento: document.getElementById('tlDepto').value,
      horario:      document.getElementById('tlHorario').value.trim() || null,
      barrio:       document.getElementById('tlBarrio').value.trim() || null,
      maps_url:     document.getElementById('tlMapsUrl').value.trim() || null,
      foto_url:     foto_url || null,
      orden:        parseInt(document.getElementById('tlOrden').value) || 0,
      activo:       document.getElementById('tlActivo').checked,
    };

    const { error } = tlEditandoId
      ? await db.from('talleres').update(datos).eq('id', tlEditandoId)
      : await db.from('talleres').insert(datos);

    if (error) throw new Error(error.message);

    mostrarMsg('tlMsg', tlEditandoId ? '✅ Taller actualizado.' : '✅ Taller agregado.', 'ok');
    tlResetForm();
    tlCargar();

  } catch (e) {
    mostrarMsg('tlMsg', '❌ Error: ' + e.message, 'err');
  } finally {
    btn.disabled = false; btn.textContent = 'Guardar';
  }
});

document.getElementById('tlBtnCancelar').addEventListener('click', tlResetForm);

// Carga inicial de talleres
tlCargar();
