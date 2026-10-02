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
   Todo texto del público se inserta con textContent, nunca innerHTML.
   ===================================================================== */

let tEditandoId = null;

const T_SOSPECHOSO = /https?:|www\.|\.com\b|\.net\b|\.ru\b|\.ar\/|bit\.ly|wa\.me|t\.me|@\w|casino|apuesta|bitcoin|crypto|viagra|pr[eé]stamo|ganá dinero|ganar dinero|click aqu[ií]/i;

function tEl(tag, clase, texto) {
  const e = document.createElement(tag);
  if (clase) e.className = clase;
  if (texto !== undefined) e.textContent = texto;
  return e;
}

function tBoton(texto, clase, onClick) {
  const b = tEl('button', clase, texto);
  b.type = 'button';
  b.addEventListener('click', onClick);
  return b;
}

function tResetForm() {
  tEditandoId = null;
  document.getElementById('tForm').style.display = 'none';
}

async function tActualizar(id, cambios) {
  const { error } = await db.from('testimonios').update(cambios).eq('id', id);
  if (error) { alert('Error: ' + error.message); return false; }
  return true;
}

async function tEliminar(id) {
  if (!confirm('¿Eliminar este testimonio? No se puede deshacer.')) return;
  const { error } = await db.from('testimonios').delete().eq('id', id);
  if (error) { alert('Error al eliminar: ' + error.message); return; }
  tCargar();
}

function tTarjeta(t, acciones) {
  const item = tEl('div', 'item-admin');
  item.style.flexWrap = 'wrap';

  const info = tEl('div', 'item-admin-info');
  const nombre = tEl('div', 'item-admin-nombre', t.nombre);
  if (t.es_maqueta) {
    const tag = tEl('span', 'badge-inactivo', 'Maqueta');
    tag.style.marginLeft = '8px';
    nombre.appendChild(tag);
  }
  if (t.estado === 'pendiente' && T_SOSPECHOSO.test(`${t.nombre} ${t.texto} ${t.rol || ''} ${t.taller || ''}`)) {
    const alerta = tEl('span', 'badge-inactivo', '⚠ Revisar: link o palabra sospechosa');
    alerta.style.marginLeft = '8px';
    alerta.style.background = '#FFF3C0';
    alerta.style.color = '#7a5b00';
    nombre.appendChild(alerta);
  }
  info.appendChild(nombre);
  info.appendChild(tEl('div', 'item-admin-sub', [t.rol, t.taller].filter(Boolean).join(' · ') || '—'));
  const msg = tEl('div', 'item-admin-sub', t.texto);
  msg.style.marginTop = '6px';
  msg.style.whiteSpace = 'pre-wrap';
  info.appendChild(msg);
  item.appendChild(info);

  const acc = tEl('div', 'item-admin-acciones');
  acciones.forEach(a => acc.appendChild(a));
  item.appendChild(acc);
  return item;
}

function tInterruptor(t) {
  const label = tEl('label');
  label.style.cssText = 'display:inline-flex;align-items:center;gap:6px;font-weight:700;font-size:0.82rem;cursor:pointer;';
  const chk = document.createElement('input');
  chk.type = 'checkbox';
  chk.checked = t.visible;
  chk.style.cssText = 'width:auto;accent-color:var(--fucsia);';
  const txt = tEl('span', '', t.visible ? 'Visible' : 'Oculto');
  chk.addEventListener('change', async () => {
    chk.disabled = true;
    const ok = await tActualizar(t.id, { visible: chk.checked });
    if (ok) { t.visible = chk.checked; txt.textContent = chk.checked ? 'Visible' : 'Oculto'; }
    else chk.checked = !chk.checked;
    chk.disabled = false;
  });
  label.append(chk, txt);
  return label;
}

function tPintar(contenedorId, titulo, lista, vacio, fnAcciones) {
  const cont = document.getElementById(contenedorId);
  cont.replaceChildren();
  const h = tEl('h3', 'seccion-titulo', `${titulo} (${lista.length})`);
  cont.appendChild(h);
  if (!lista.length) {
    const p = tEl('p', '', vacio);
    p.style.cssText = 'color:var(--texto-suave);font-size:0.9rem;';
    cont.appendChild(p);
    return;
  }
  const wrap = tEl('div', 'lista-items');
  lista.forEach(t => wrap.appendChild(tTarjeta(t, fnAcciones(t))));
  cont.appendChild(wrap);
}

async function tCargar() {
  const { data, error } = await db
    .from('testimonios')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    const c = document.getElementById('tPendientes');
    c.replaceChildren(tEl('p', 'msg-err', 'Error al cargar los testimonios.'));
    return;
  }

  window._tData = data;
  const editar = t => tBoton('Editar', 'btn-secundario', () => tIniciarEdicion(t.id));
  const eliminar = t => tBoton('Eliminar', 'btn-peligro', () => tEliminar(t.id));

  tPintar('tPendientes', 'Pendientes', data.filter(t => t.estado === 'pendiente'),
    'No hay testimonios esperando aprobación.',
    t => [
      tBoton('Aprobar', 'btn-primario', async () => { if (await tActualizar(t.id, { estado: 'aprobado', visible: true })) tCargar(); }),
      tBoton('Rechazar', 'btn-peligro', async () => { if (await tActualizar(t.id, { estado: 'rechazado', visible: false })) tCargar(); }),
      editar(t),
    ]);

  tPintar('tAprobados', 'Aprobados', data.filter(t => t.estado === 'aprobado'),
    'Todavía no hay testimonios aprobados.',
    t => [tInterruptor(t), editar(t), eliminar(t)]);

  tPintar('tRechazados', 'Rechazados', data.filter(t => t.estado === 'rechazado'),
    'No hay testimonios rechazados.',
    t => [
      tBoton('Aprobar', 'btn-secundario', async () => { if (await tActualizar(t.id, { estado: 'aprobado', visible: true })) tCargar(); }),
      eliminar(t),
    ]);
}

function tIniciarEdicion(id) {
  const t = (window._tData || []).find(x => x.id === id);
  if (!t) return;
  tEditandoId = id;
  document.getElementById('tNombre').value = t.nombre;
  document.getElementById('tRol').value    = t.rol || '';
  document.getElementById('tTaller').value = t.taller || '';
  document.getElementById('tTexto').value  = t.texto;
  document.getElementById('tForm').style.display = '';
  document.getElementById('tForm').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

document.getElementById('tBtnGuardar').addEventListener('click', async () => {
  const nombre = document.getElementById('tNombre').value.trim();
  const texto  = document.getElementById('tTexto').value.trim();
  if (!nombre || !texto) {
    mostrarMsg('tMsg', 'El nombre y el texto son obligatorios.', 'err');
    return;
  }
  if (texto.length > 400) {
    mostrarMsg('tMsg', 'El texto no puede pasar de 400 caracteres.', 'err');
    return;
  }

  const btn = document.getElementById('tBtnGuardar');
  btn.disabled = true; btn.textContent = 'Guardando…';

  const ok = await tActualizar(tEditandoId, {
    nombre,
    texto,
    rol:    document.getElementById('tRol').value.trim() || null,
    taller: document.getElementById('tTaller').value.trim() || null,
  });
  btn.disabled = false; btn.textContent = 'Guardar cambios';
  if (ok) { tResetForm(); tCargar(); }
});

document.getElementById('tBtnCancelar').addEventListener('click', tResetForm);

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
   VOLUNTARIOS (inscripciones)
   Todo texto del público se inserta con textContent. El DNI no se registra en consola.
   ===================================================================== */

let vData = [];

const V_FECHA = new Intl.DateTimeFormat('es-AR', { dateStyle: 'short', timeStyle: 'short' });

function vFechaNac(iso) {
  const [a, m, d] = String(iso).split('-');
  return `${d}/${m}/${a}`;
}

function vDato(etiqueta, valor) {
  const linea = tEl('div', 'item-admin-sub');
  linea.append(tEl('strong', '', etiqueta + ': '), document.createTextNode(valor || '—'));
  return linea;
}

function vInterruptor(v) {
  const label = tEl('label');
  label.style.cssText = 'display:inline-flex;align-items:center;gap:6px;font-weight:700;font-size:0.82rem;cursor:pointer;';
  const chk = document.createElement('input');
  chk.type = 'checkbox';
  chk.checked = v.estado === 'contactado';
  chk.style.cssText = 'width:auto;accent-color:var(--fucsia);';
  const txt = tEl('span', '', chk.checked ? 'Contactado' : 'Nuevo');
  chk.addEventListener('change', async () => {
    chk.disabled = true;
    const nuevo = chk.checked ? 'contactado' : 'nuevo';
    const { error } = await db.from('voluntarios_inscripciones').update({ estado: nuevo }).eq('id', v.id);
    if (error) { chk.checked = !chk.checked; alert('Error al guardar el cambio.'); }
    else { v.estado = nuevo; txt.textContent = chk.checked ? 'Contactado' : 'Nuevo'; }
    chk.disabled = false;
  });
  label.append(chk, txt);
  return label;
}

async function vEliminar(id) {
  if (!confirm('¿Eliminar esta inscripción? No se puede deshacer.')) return;
  const { error } = await db.from('voluntarios_inscripciones').delete().eq('id', id);
  if (error) { alert('Error al eliminar la inscripción.'); return; }
  vCargar();
}

function vPintar() {
  const q = document.getElementById('vBuscar').value.trim().toLowerCase();
  const taller = document.getElementById('vTaller').value;
  const lista = vData.filter(v => (!taller || v.taller === taller) && (!q || v.nombre.toLowerCase().includes(q)));

  document.getElementById('vResumen').textContent = `${lista.length} de ${vData.length} inscripciones`;
  const cont = document.getElementById('vLista');
  cont.replaceChildren();
  if (!lista.length) {
    const p = tEl('p', '', vData.length ? 'Ninguna inscripción coincide con el filtro.' : 'Todavía no hay inscripciones.');
    p.style.cssText = 'color:var(--texto-suave);font-size:0.9rem;';
    cont.appendChild(p);
    return;
  }

  lista.forEach(v => {
    const item = tEl('div', 'item-admin');
    item.style.flexWrap = 'wrap';
    const info = tEl('div', 'item-admin-info');
    info.style.flex = '1 1 100%';
    info.appendChild(tEl('div', 'item-admin-nombre', v.nombre));
    info.append(
      vDato('Taller', v.taller),
      vDato('Celular', v.celular),
      vDato('Mail', v.email),
      vDato('Instagram', v.instagram),
      vDato('Ocupación', v.ocupacion),
      vDato('Fecha de nacimiento', vFechaNac(v.fecha_nacimiento)),
      vDato('DNI', v.dni),
      vDato('Inscripción', V_FECHA.format(new Date(v.created_at))),
    );
    item.appendChild(info);
    const acc = tEl('div', 'item-admin-acciones');
    acc.append(vInterruptor(v), tBoton('Eliminar', 'btn-peligro', () => vEliminar(v.id)));
    item.appendChild(acc);
    cont.appendChild(item);
  });
}

async function vCargar() {
  const { data, error } = await db
    .from('voluntarios_inscripciones')
    .select('id, nombre, dni, fecha_nacimiento, email, instagram, celular, ocupacion, taller, estado, created_at')
    .order('created_at', { ascending: false });

  if (error) {
    document.getElementById('vLista').replaceChildren(tEl('p', 'msg-err', 'Error al cargar las inscripciones.'));
    return;
  }
  vData = data;
  vPintar();
}

document.getElementById('vBuscar').addEventListener('input', vPintar);
document.getElementById('vTaller').addEventListener('change', vPintar);

vCargar();
