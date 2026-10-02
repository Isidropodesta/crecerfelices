'use strict';

/* Inscripción de voluntarios. El DNI nunca se escribe en consola ni se muestra en pantalla. */
(function () {
  const form    = document.getElementById('form-inscripcion');
  if (!form) return;

  const errorEl  = document.getElementById('f-error');
  const gracias  = document.getElementById('f-gracias');
  const enviar   = document.getElementById('f-enviar');
  const CLAVE    = 'cf_inscripcion_ultimo_envio';
  const ESPERA   = 60000;
  const abiertoEn = Date.now();

  const hoy = new Date();
  hoy.setMinutes(hoy.getMinutes() - hoy.getTimezoneOffset());
  document.getElementById('f-fecha').max = hoy.toISOString().slice(0, 10);

  const mostrarError = msg => { errorEl.textContent = msg; errorEl.hidden = false; };
  const exito = () => { form.hidden = true; gracias.hidden = false; gracias.scrollIntoView({ behavior: 'smooth', block: 'center' }); };

  form.addEventListener('submit', async e => {
    e.preventDefault();
    errorEl.hidden = true;

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    if (document.getElementById('f-web').value || Date.now() - abiertoEn < 3000) {
      return exito();
    }

    let ultimo = 0;
    try { ultimo = Number(localStorage.getItem(CLAVE)) || 0; } catch (_) {}
    if (Date.now() - ultimo < ESPERA) {
      return mostrarError('Esperá un minuto antes de enviar otra inscripción.');
    }

    const v = id => document.getElementById(id).value.trim();
    const datos = {
      nombre:           v('f-nombre'),
      dni:              v('f-dni'),
      fecha_nacimiento: v('f-fecha'),
      email:            v('f-mail'),
      instagram:        v('f-instagram'),
      celular:          v('f-celular'),
      ocupacion:        v('f-ocupacion'),
      taller:           form.elements.taller.value,
    };

    enviar.disabled = true;
    const { error } = await db.from('voluntarios_inscripciones').insert(datos);
    enviar.disabled = false;

    if (error) {
      return mostrarError('No pudimos enviar tu inscripción. Probá de nuevo en un rato.');
    }
    try { localStorage.setItem(CLAVE, String(Date.now())); } catch (_) {}
    form.reset();
    exito();
  });
})();
