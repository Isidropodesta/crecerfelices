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

/* =====================================================================
   EVENTOS
   ===================================================================== */

let evEditandoId         = null;
let evEditandoPortadaUrl = null;

function evResetForm() {
  evEditandoId         = null;
  evEditandoPortadaUrl = null;
  document.getElementById('evFormTitulo').textContent  = 'Agregar evento';
  document.getElementById('evTitulo').value   = '';
  document.getElementById('evDesc').value     = '';
  document.getElementById('evOrden').value    = '0';
  document.getElementById('evActivo').checked = true;
  document.getElementById('evPortada').value  = '';
  const prev = document.getElementById('evPortadaPreview');
  prev.src = ''; prev.style.display = 'none';
  document.getElementById('evBtnCancelar').style.display  = 'none';
  document.getElementById('evMediaSection').style.display = 'none';
}

async function evCargar() {
  const lista = document.getElementById('evLista');
  lista.innerHTML = '<p style="color:var(--texto-suave);font-size:0.9rem;">Cargando…</p>';

  const { data, error } = await db
    .from('eventos')
    .select('*')
    .order('orden')
    .order('created_at');

  if (error) {
    lista.innerHTML = '<p class="msg-err">Error al cargar los eventos.</p>';
    return;
  }
  if (!data.length) {
    lista.innerHTML = '<p style="color:var(--texto-suave);font-size:0.9rem;">Todavía no hay eventos.</p>';
    return;
  }

  window._evData = data;

  lista.innerHTML = data.map(ev => `
    <div class="item-admin">
      ${ev.foto_portada_url
        ? `<img src="${ev.foto_portada_url}" style="width:80px;height:52px;object-fit:cover;border:1.5px solid var(--gris-borde);border-radius:8px;flex-shrink:0;" alt="">`
        : `<div style="width:80px;height:52px;background:var(--gris-borde);border-radius:8px;flex-shrink:0;"></div>`
      }
      <div class="item-admin-info">
        <div class="item-admin-nombre">${ev.titulo}</div>
        <div class="item-admin-sub">${(ev.descripcion || '').slice(0, 70)}…</div>
      </div>
      <div class="item-admin-acciones">
        <span class="${ev.activo ? 'badge-activo' : 'badge-inactivo'}">${ev.activo ? 'Visible' : 'Oculto'}</span>
        <button class="btn-secundario" data-id="${ev.id}" data-accion="editar">Editar</button>
        <button class="btn-peligro"    data-id="${ev.id}" data-accion="eliminar">Eliminar</button>
      </div>
    </div>
  `).join('');

  lista.querySelectorAll('button[data-accion]').forEach(btn => {
    btn.addEventListener('click', () => {
      if (btn.dataset.accion === 'editar')   evIniciarEdicion(btn.dataset.id);
      if (btn.dataset.accion === 'eliminar') evEliminar(btn.dataset.id);
    });
  });
}

function evIniciarEdicion(id) {
  const ev = (window._evData || []).find(x => x.id === id);
  if (!ev) return;

  evEditandoId         = id;
  evEditandoPortadaUrl = ev.foto_portada_url || null;

  document.getElementById('evFormTitulo').textContent  = 'Editar evento';
  document.getElementById('evTitulo').value   = ev.titulo;
  document.getElementById('evDesc').value     = ev.descripcion || '';
  document.getElementById('evOrden').value    = ev.orden;
  document.getElementById('evActivo').checked = ev.activo;
  document.getElementById('evPortada').value  = '';

  const prev = document.getElementById('evPortadaPreview');
  if (ev.foto_portada_url) { prev.src = ev.foto_portada_url; prev.style.display = 'block'; }
  else                      { prev.style.display = 'none'; }

  document.getElementById('evBtnCancelar').style.display  = '';
  document.getElementById('evMediaSection').style.display = 'block';

  evMCargar(id);
  document.getElementById('evForm').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

async function evEliminar(id) {
  if (!confirm('¿Eliminar este evento? Se borran también todas sus fotos y videos. No se puede deshacer.')) return;
  const { error } = await db.from('eventos').delete().eq('id', id);
  if (error) { alert('Error al eliminar: ' + error.message); return; }
  evResetForm();
  evCargar();
}

document.getElementById('evPortada').addEventListener('change', (e) => {
  const archivo = e.target.files[0];
  const prev    = document.getElementById('evPortadaPreview');
  if (archivo) { prev.src = URL.createObjectURL(archivo); prev.style.display = 'block'; }
  else          { prev.style.display = 'none'; }
});

document.getElementById('evBtnGuardar').addEventListener('click', async () => {
  const titulo = document.getElementById('evTitulo').value.trim();
  if (!titulo) {
    mostrarMsg('evMsg', 'El título es obligatorio.', 'err');
    return;
  }

  const btn = document.getElementById('evBtnGuardar');
  btn.disabled = true; btn.textContent = 'Guardando…';

  try {
    let foto_portada_url = evEditandoPortadaUrl;
    const archivo = document.getElementById('evPortada').files[0];
    if (archivo) foto_portada_url = await subirImagen(archivo, 'eventos/portadas');

    const datos = {
      titulo,
      descripcion:      document.getElementById('evDesc').value.trim() || null,
      foto_portada_url: foto_portada_url || null,
      orden:            parseInt(document.getElementById('evOrden').value) || 0,
      activo:           document.getElementById('evActivo').checked,
    };

    if (evEditandoId) {
      const { error } = await db.from('eventos').update(datos).eq('id', evEditandoId);
      if (error) throw new Error(error.message);
      evEditandoPortadaUrl = foto_portada_url;
      mostrarMsg('evMsg', '✅ Evento actualizado.', 'ok');
      evCargar();
    } else {
      const { data, error } = await db.from('eventos').insert(datos).select().single();
      if (error) throw new Error(error.message);
      evEditandoId         = data.id;
      evEditandoPortadaUrl = data.foto_portada_url;
      document.getElementById('evFormTitulo').textContent  = 'Editar evento';
      document.getElementById('evBtnCancelar').style.display  = '';
      document.getElementById('evMediaSection').style.display = 'block';
      window._evData = [...(window._evData || []), data];
      mostrarMsg('evMsg', '✅ Evento creado. Ahora podés agregar sus fotos y videos.', 'ok');
      evMCargar(data.id);
      evCargar();
    }
  } catch (e) {
    mostrarMsg('evMsg', '❌ Error: ' + e.message, 'err');
  } finally {
    btn.disabled = false; btn.textContent = 'Guardar';
  }
});

document.getElementById('evBtnCancelar').addEventListener('click', evResetForm);

/* ── Media del evento ────────────────────────────────────────────────── */

async function evMCargar(eventoId) {
  const lista = document.getElementById('evMLista');
  lista.innerHTML = '<p style="color:var(--texto-suave);font-size:0.9rem;">Cargando media…</p>';

  const { data, error } = await db
    .from('evento_media')
    .select('*')
    .eq('evento_id', eventoId)
    .order('orden')
    .order('created_at');

  if (error) {
    lista.innerHTML = '<p class="msg-err">Error al cargar la media.</p>';
    return;
  }
  if (!data.length) {
    lista.innerHTML = '<p style="color:var(--texto-suave);font-size:0.9rem;">Sin fotos ni videos todavía. Usá el formulario de abajo para agregar.</p>';
    return;
  }

  lista.innerHTML = data.map(m => `
    <div class="item-admin">
      ${m.tipo === 'foto'
        ? `<img src="${m.url}" style="width:80px;height:52px;object-fit:cover;border-radius:8px;border:1.5px solid var(--gris-borde);flex-shrink:0;" alt="">`
        : `<div style="width:80px;height:52px;background:#111;border-radius:8px;display:flex;align-items:center;justify-content:center;flex-shrink:0;color:#fff;font-size:1.4rem;">▶</div>`
      }
      <div class="item-admin-info">
        <div class="item-admin-nombre">${m.tipo === 'foto' ? 'Foto' : 'Video'} · orden ${m.orden}</div>
        <div class="item-admin-sub" style="word-break:break-all;">${m.alt_text || '—'}</div>
      </div>
      <div class="item-admin-acciones">
        <button class="btn-peligro" data-mid="${m.id}">Eliminar</button>
      </div>
    </div>
  `).join('');

  lista.querySelectorAll('button[data-mid]').forEach(btn => {
    btn.addEventListener('click', () => evMEliminar(btn.dataset.mid, eventoId));
  });
}

async function evMEliminar(mediaId, eventoId) {
  if (!confirm('¿Eliminar este elemento de la galería?')) return;
  const { error } = await db.from('evento_media').delete().eq('id', mediaId);
  if (error) { alert('Error al eliminar: ' + error.message); return; }
  evMCargar(eventoId);
}

document.querySelectorAll('input[name="evMFuente"]').forEach(radio => {
  radio.addEventListener('change', () => {
    const esArchivo = document.querySelector('input[name="evMFuente"]:checked').value === 'archivo';
    document.getElementById('evMArchivoField').style.display = esArchivo ? '' : 'none';
    document.getElementById('evMUrlField').style.display     = esArchivo ? 'none' : '';
  });
});

document.getElementById('evMBtnAgregar').addEventListener('click', async () => {
  if (!evEditandoId) return;

  const tipo   = document.getElementById('evMTipo').value;
  const fuente = document.querySelector('input[name="evMFuente"]:checked').value;
  const alt    = document.getElementById('evMAlt').value.trim() || null;
  const orden  = parseInt(document.getElementById('evMOrden').value) || 0;

  const btn = document.getElementById('evMBtnAgregar');
  btn.disabled = true; btn.textContent = 'Guardando…';

  try {
    let url;

    if (fuente === 'archivo') {
      const archivo = document.getElementById('evMArchivo').files[0];
      if (!archivo) throw new Error('Seleccioná un archivo.');
      const carpeta = tipo === 'foto' ? 'eventos/fotos' : 'eventos/videos';
      url = await subirImagen(archivo, carpeta);
    } else {
      url = document.getElementById('evMUrl').value.trim();
      if (!url) throw new Error('Ingresá una URL válida.');
    }

    const { error } = await db.from('evento_media').insert({
      evento_id: evEditandoId,
      tipo, url, alt_text: alt, orden,
    });
    if (error) throw new Error(error.message);

    mostrarMsg('evMMsg', '✅ Agregado correctamente.', 'ok');
    document.getElementById('evMArchivo').value = '';
    document.getElementById('evMUrl').value     = '';
    document.getElementById('evMAlt').value     = '';
    document.getElementById('evMOrden').value   = '0';
    evMCargar(evEditandoId);

  } catch (e) {
    mostrarMsg('evMMsg', '❌ ' + e.message, 'err');
  } finally {
    btn.disabled = false; btn.textContent = 'Agregar';
  }
});

// Carga inicial de eventos
evCargar();

/* =====================================================================
   MENSAJES — Inscripciones de voluntarios + mensajes de contacto
   ===================================================================== */

const MS_LABELS = { nuevo: 'Nuevo', leido: 'Leído', respondido: 'Respondido' };
const MS_CLASES = { nuevo: 'badge-nuevo', leido: 'badge-activo', respondido: 'badge-respondido' };

function msFormatearFecha(ts) {
  if (!ts) return '—';
  const d = new Date(ts);
  return d.toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })
       + ' · ' + d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
}

/* ── Voluntarios ─────────────────────────────────────────────────── */

async function msVCargar() {
  const lista = document.getElementById('msVLista');
  if (!lista) return;
  lista.innerHTML = '<p style="color:var(--texto-suave);font-size:0.9rem;">Cargando…</p>';

  const { data, error } = await db
    .from('voluntarios_inscripciones')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) { lista.innerHTML = '<p class="msg-err">Error al cargar.</p>'; return; }
  if (!data.length) {
    lista.innerHTML = '<p style="color:var(--texto-suave);font-size:0.9rem;">Todavía no hay inscripciones.</p>';
    return;
  }

  lista.innerHTML = data.map(v => `
    <div class="item-admin" style="flex-direction:column;align-items:stretch;gap:10px;">
      <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
        <span class="${MS_CLASES[v.estado] || 'badge-nuevo'}">${MS_LABELS[v.estado] || v.estado}</span>
        <strong>${v.nombre}</strong>
        <span style="color:var(--texto-suave);font-size:0.85rem;">${msFormatearFecha(v.created_at)}</span>
      </div>
      <div style="font-size:0.88rem;color:var(--texto);line-height:1.8;border-left:3px solid var(--gris-borde);padding-left:12px;">
        <div><b>Edad:</b> ${v.edad || '—'} &nbsp;·&nbsp; <b>Tel:</b> ${v.telefono || '—'} &nbsp;·&nbsp; <b>Email:</b> ${v.email || '—'}</div>
        <div><b>Disponibilidad:</b> ${v.disponibilidad || '—'}</div>
        ${v.mensaje ? `<div><b>¿Por qué quiere sumarse?</b> "${v.mensaje}"</div>` : ''}
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;">
        ${v.estado !== 'leido'      ? `<button class="btn-secundario" data-id="${v.id}" data-estado="leido"    data-tabla="v">Marcar leído</button>`      : ''}
        ${v.estado !== 'respondido' ? `<button class="btn-secundario" data-id="${v.id}" data-estado="respondido" data-tabla="v">Marcar respondido</button>` : ''}
        <button class="btn-peligro" data-id="${v.id}" data-eliminar="v">Eliminar</button>
      </div>
    </div>
  `).join('');

  lista.querySelectorAll('[data-tabla="v"][data-estado]').forEach(btn =>
    btn.addEventListener('click', () => msVMarcarEstado(btn.dataset.id, btn.dataset.estado)));
  lista.querySelectorAll('[data-eliminar="v"]').forEach(btn =>
    btn.addEventListener('click', () => msVEliminar(btn.dataset.id)));
}

async function msVMarcarEstado(id, estado) {
  const { error } = await db.from('voluntarios_inscripciones').update({ estado }).eq('id', id);
  if (error) { alert('Error: ' + error.message); return; }
  msVCargar();
}

async function msVEliminar(id) {
  if (!confirm('¿Eliminar esta inscripción? No se puede deshacer.')) return;
  const { error } = await db.from('voluntarios_inscripciones').delete().eq('id', id);
  if (error) { alert('Error: ' + error.message); return; }
  msVCargar();
}

/* ── Contacto ────────────────────────────────────────────────────── */

async function msCCargar() {
  const lista = document.getElementById('msCLista');
  if (!lista) return;
  lista.innerHTML = '<p style="color:var(--texto-suave);font-size:0.9rem;">Cargando…</p>';

  const { data, error } = await db
    .from('contacto_mensajes')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) { lista.innerHTML = '<p class="msg-err">Error al cargar.</p>'; return; }
  if (!data.length) {
    lista.innerHTML = '<p style="color:var(--texto-suave);font-size:0.9rem;">Todavía no hay mensajes.</p>';
    return;
  }

  const ASUNTOS = {
    voluntariado: 'Quiero ser voluntario',
    donacion:     'Quiero hacer una donación',
    alianza:      'Propuesta de alianza',
    prensa:       'Prensa',
    otro:         'Otro',
  };

  lista.innerHTML = data.map(c => `
    <div class="item-admin" style="flex-direction:column;align-items:stretch;gap:10px;">
      <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
        <span class="${MS_CLASES[c.estado] || 'badge-nuevo'}">${MS_LABELS[c.estado] || c.estado}</span>
        <strong>${c.nombre}</strong>
        <span style="color:var(--texto-suave);font-size:0.85rem;">${msFormatearFecha(c.created_at)}</span>
      </div>
      <div style="font-size:0.88rem;color:var(--texto);line-height:1.8;border-left:3px solid var(--gris-borde);padding-left:12px;">
        <div><b>Email:</b> ${c.email || '—'}${c.asunto ? ` &nbsp;·&nbsp; <b>Asunto:</b> ${ASUNTOS[c.asunto] || c.asunto}` : ''}</div>
        <div><b>Mensaje:</b> "${c.mensaje || '—'}"</div>
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;">
        ${c.estado !== 'leido'      ? `<button class="btn-secundario" data-id="${c.id}" data-estado="leido"    data-tabla="c">Marcar leído</button>`      : ''}
        ${c.estado !== 'respondido' ? `<button class="btn-secundario" data-id="${c.id}" data-estado="respondido" data-tabla="c">Marcar respondido</button>` : ''}
        <button class="btn-peligro" data-id="${c.id}" data-eliminar="c">Eliminar</button>
      </div>
    </div>
  `).join('');

  lista.querySelectorAll('[data-tabla="c"][data-estado]').forEach(btn =>
    btn.addEventListener('click', () => msCMarcarEstado(btn.dataset.id, btn.dataset.estado)));
  lista.querySelectorAll('[data-eliminar="c"]').forEach(btn =>
    btn.addEventListener('click', () => msCEliminar(btn.dataset.id)));
}

async function msCMarcarEstado(id, estado) {
  const { error } = await db.from('contacto_mensajes').update({ estado }).eq('id', id);
  if (error) { alert('Error: ' + error.message); return; }
  msCCargar();
}

async function msCEliminar(id) {
  if (!confirm('¿Eliminar este mensaje? No se puede deshacer.')) return;
  const { error } = await db.from('contacto_mensajes').delete().eq('id', id);
  if (error) { alert('Error: ' + error.message); return; }
  msCCargar();
}

// Carga inicial de mensajes
msVCargar();
msCCargar();

/* =====================================================================
   CONFIGURACIÓN — Datos de contacto y links de donación
   ===================================================================== */

async function cfgCargar() {
  const { data, error } = await db.from('configuracion').select('clave, valor');
  if (error || !data) return;

  const cfg = Object.fromEntries(data.map(r => [r.clave, r.valor]));

  if (cfg.whatsapp)         document.getElementById('cfgWhatsapp').value     = cfg.whatsapp;
  if (cfg.email)            document.getElementById('cfgEmail').value         = cfg.email;
  if (cfg.instagram)        document.getElementById('cfgInstagram').value     = cfg.instagram;
  if (cfg.alias_donacion)   document.getElementById('cfgAlias').value         = cfg.alias_donacion;
  if (cfg.link_mercadopago) document.getElementById('cfgMercadoPago').value   = cfg.link_mercadopago;
}

document.getElementById('cfgBtnGuardar').addEventListener('click', async () => {
  const btn = document.getElementById('cfgBtnGuardar');
  btn.disabled = true; btn.textContent = 'Guardando…';

  const campos = [
    { clave: 'whatsapp',         valor: document.getElementById('cfgWhatsapp').value.trim() },
    { clave: 'email',            valor: document.getElementById('cfgEmail').value.trim() },
    { clave: 'instagram',        valor: document.getElementById('cfgInstagram').value.trim() },
    { clave: 'alias_donacion',   valor: document.getElementById('cfgAlias').value.trim() },
    { clave: 'link_mercadopago', valor: document.getElementById('cfgMercadoPago').value.trim() },
  ];

  try {
    for (const campo of campos) {
      if (!campo.valor) continue;
      const { error } = await db.from('configuracion').update({ valor: campo.valor }).eq('clave', campo.clave);
      if (error) throw new Error(campo.clave + ': ' + error.message);
    }
    mostrarMsg('cfgMsg', '✅ Configuración guardada. Los cambios ya están en el sitio.', 'ok');
  } catch (e) {
    mostrarMsg('cfgMsg', '❌ Error: ' + e.message, 'err');
  } finally {
    btn.disabled = false; btn.textContent = 'Guardar cambios';
  }
});

// Carga inicial de configuración
cfgCargar();
