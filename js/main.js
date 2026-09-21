/* =====================================================================
   PROYECTO CRECER FELICES – JavaScript principal
   Funcionalidades: navbar, scroll, filtros, formularios, animaciones
   ===================================================================== */

'use strict';

/* --- Configuración de Google Apps Script ---
   IMPORTANTE: Para activar los formularios, seguí las instrucciones del README.md.
   Una vez que tengas el URL del Web App de Google Apps Script, pegalo aquí: */
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/REEMPLAZAR_CON_TU_URL/exec';

/* =====================================================================
   NAVBAR: scroll shadow + link activo + mobile menu
   ===================================================================== */
(function initNavbar() {
  const navbar     = document.getElementById('navbar');
  const toggle     = document.getElementById('menuToggle');
  const mobileMenu = document.getElementById('mobileMenu');
  const mobileLinks = document.querySelectorAll('.mobile-link');

  // Sombra al hacer scroll
  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 20);
  }, { passive: true });

  // Hamburguesa — abre/cierra con una transición suave (alto + opacidad)
  function abrirMobileMenu() {
    toggle.classList.add('open');
    toggle.setAttribute('aria-expanded', 'true');
    mobileMenu.hidden = false;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => mobileMenu.classList.add('mobile-menu-open'));
    });
  }

  function cerrarMobileMenu() {
    toggle.classList.remove('open');
    toggle.setAttribute('aria-expanded', 'false');
    mobileMenu.classList.remove('mobile-menu-open');
    mobileMenu.addEventListener('transitionend', () => {
      if (!mobileMenu.classList.contains('mobile-menu-open')) mobileMenu.hidden = true;
    }, { once: true });
  }

  toggle.addEventListener('click', () => {
    if (toggle.classList.contains('open')) cerrarMobileMenu();
    else abrirMobileMenu();
  });

  // Cerrar menú al hacer clic en un link
  mobileLinks.forEach(link => {
    link.addEventListener('click', cerrarMobileMenu);
  });

  // Cerrar con Escape
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && !mobileMenu.hidden) {
      cerrarMobileMenu();
      toggle.focus();
    }
  });

  // Link activo según posición de scroll
  const sections  = document.querySelectorAll('section[id]');
  const navLinks  = document.querySelectorAll('.nav-links a');
  const OFFSET    = 100;

  const observerNav = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        navLinks.forEach(a => a.classList.remove('active'));
        const active = document.querySelector(`.nav-links a[href="#${entry.target.id}"]`);
        if (active) active.classList.add('active');
      }
    });
  }, { threshold: 0.35, rootMargin: `-${OFFSET}px 0px 0px 0px` });

  sections.forEach(s => observerNav.observe(s));
})();


/* =====================================================================
   SALUDO DEL LOGO
   Las manitos del logo hacen un pequeño saludo apenas carga la página
   (una sola vez), además de saludar cada vez que se les pasa el mouse
   (ver CSS: .nav-logo:hover .logo-nav).
   ===================================================================== */
(function initLogoSaludo() {
  const logo = document.querySelector('.logo-nav');
  if (!logo || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  setTimeout(() => logo.classList.add('logo-welcome'), 700);
})();


/* =====================================================================
   BOTÓN "VOLVER ARRIBA"
   ===================================================================== */
(function initScrollTop() {
  const btn = document.getElementById('scrollTopBtn');

  window.addEventListener('scroll', () => {
    btn.hidden = window.scrollY < 400;
  }, { passive: true });

  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
})();


/* =====================================================================
   ANIMACIONES DE APARICIÓN EN SCROLL (Intersection Observer)
   Soporta 4 variantes (.reveal, .reveal-scale, .reveal-left, .reveal-right)
   y aplica un stagger automático según la posición del elemento entre sus
   hermanos animados, para que las grillas de tarjetas entren en cascada.
   window.CFReveal.observe(root) permite enganchar contenido agregado
   después (por ejemplo, tarjetas cargadas desde Supabase).
   ===================================================================== */
(function initReveal() {
  const SELECTOR    = '.reveal, .reveal-scale, .reveal-left, .reveal-right';
  const STAGGER_MS  = 70;
  const STAGGER_MAX = 6;

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      el.classList.add('visible', 'revealing');
      el.addEventListener('animationend', () => el.classList.remove('revealing'), { once: true });
      observer.unobserve(el);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  function observeReveal(root) {
    const scope = root || document;
    const elements = scope.matches && scope.matches(SELECTOR)
      ? [scope]
      : Array.from(scope.querySelectorAll(SELECTOR));

    elements.forEach(el => {
      if (el.dataset.cfObserved) return;
      el.dataset.cfObserved = '1';

      const parent = el.parentElement;
      if (parent) {
        const siblings = Array.from(parent.children).filter(s => s.matches && s.matches(SELECTOR));
        const idx = siblings.indexOf(el);
        if (idx > 0) el.style.animationDelay = `${Math.min(idx, STAGGER_MAX) * STAGGER_MS}ms`;
      }

      observer.observe(el);
    });
  }

  observeReveal();
  window.CFReveal = { observe: observeReveal };
})();


/* =====================================================================
   CONTADORES ANIMADOS (para secciones de impacto y stats)
   ===================================================================== */
(function initCounters() {
  const counters = document.querySelectorAll('.counter, .stat-num[data-target]');

  function animateCounter(el) {
    const target   = parseInt(el.dataset.target, 10);
    const duration = 1600;
    const start    = performance.now();

    function update(now) {
      const elapsed  = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // Easing: ease-out
      const eased    = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.round(eased * target);
      if (progress < 1) requestAnimationFrame(update);
    }

    requestAnimationFrame(update);
  }

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateCounter(entry.target);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });

  counters.forEach(el => observer.observe(el));
})();


/* =====================================================================
   FILTRO DE TALLERES por departamento
   ===================================================================== */
(function initFiltroTalleres() {
  const botones = document.querySelectorAll('.filtro-btn');
  const tarjetas = document.querySelectorAll('.taller-card');

  if (!botones.length) return;

  botones.forEach(btn => {
    btn.addEventListener('click', () => {
      // Actualizar estado de botones
      botones.forEach(b => {
        b.classList.remove('active');
        b.removeAttribute('aria-pressed');
      });
      btn.classList.add('active');
      btn.setAttribute('aria-pressed', 'true');

      const filtro = btn.dataset.filtro;

      // Re-query en cada click para capturar tarjetas cargadas dinámicamente
      const tarjetas = document.querySelectorAll('.taller-card');
      tarjetas.forEach(tarjeta => {
        if (filtro === 'todos') {
          tarjeta.classList.remove('hidden');
        } else {
          const coincide = tarjeta.dataset.depto === filtro;
          tarjeta.classList.toggle('hidden', !coincide);
        }
      });
    });
  });
})();


/* =====================================================================
   MODALES DE EVENTOS
   Cada tarjeta tiene data-modal="modal-ID" que apunta al overlay correspondiente.
   ===================================================================== */
(function initModalEventos() {
  let anteriorFoco = null;

  function abrirModal(id) {
    const overlay = document.getElementById(id);
    if (!overlay) return;
    anteriorFoco = document.activeElement;
    overlay.hidden = false;
    document.body.classList.add('modal-open');
    requestAnimationFrame(() => {
      requestAnimationFrame(() => overlay.classList.add('modal-visible'));
    });
    const closeBtn = overlay.querySelector('.modal-close');
    if (closeBtn) closeBtn.focus();
  }

  function cerrarModal(overlay) {
    overlay.classList.remove('modal-visible');
    overlay.querySelectorAll('video').forEach(v => { v.pause(); });
    overlay.addEventListener('transitionend', () => {
      overlay.hidden = true;
      document.body.classList.remove('modal-open');
      if (anteriorFoco) anteriorFoco.focus();
    }, { once: true });
  }

  // Delegación de eventos — funciona con tarjetas y modales generados dinámicamente
  document.addEventListener('click', (e) => {
    const card = e.target.closest('.evento-card[data-modal]');
    if (card) { abrirModal(card.dataset.modal); return; }

    const closeBtn = e.target.closest('.modal-close');
    if (closeBtn) {
      const overlay = closeBtn.closest('.modal-overlay');
      if (overlay) { cerrarModal(overlay); return; }
    }

    if (e.target.classList.contains('modal-overlay')) {
      cerrarModal(e.target);
    }
  });

  document.addEventListener('keydown', e => {
    if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('.evento-card[data-modal]')) {
      e.preventDefault();
      abrirModal(e.target.dataset.modal);
    }
    if (e.key === 'Escape') {
      const abierto = document.querySelector('.modal-overlay.modal-visible');
      if (abierto) cerrarModal(abierto);
    }
  });
})();


/* =====================================================================
   TABS DE EVENTOS
   ===================================================================== */
(function initTabs() {
  const tabBtns   = document.querySelectorAll('.tab-btn');
  const tabPanels = document.querySelectorAll('.tab-panel');

  if (!tabBtns.length) return;

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetTab = btn.dataset.tab;

      // Actualizar botones
      tabBtns.forEach(b => {
        b.classList.remove('active');
        b.setAttribute('aria-selected', 'false');
      });
      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');

      // Mostrar panel correcto
      tabPanels.forEach(panel => {
        const esActivo = panel.id === `tab-${targetTab}`;
        panel.hidden = !esActivo;
        panel.classList.toggle('active', esActivo);

        // Re-disparar animaciones reveal del panel nuevo
        if (esActivo) {
          const reveals = panel.querySelectorAll('.reveal:not(.visible)');
          reveals.forEach(el => el.classList.add('visible'));
        }
      });
    });
  });
})();


/* =====================================================================
   ENVÍO DE FORMULARIOS A GOOGLE SHEETS
   Usamos fetch con mode: 'no-cors' porque Google Apps Script
   no retorna cabeceras CORS en todos los casos. Mostramos éxito
   de forma optimista. Ver README.md para instrucciones de configuración.
   ===================================================================== */

/**
 * Maneja el envío de un formulario a Google Sheets.
 * @param {HTMLFormElement} form - El formulario a enviar
 * @param {HTMLButtonElement} submitBtn - El botón de submit
 * @param {HTMLElement} successEl - Elemento para mensaje de éxito
 * @param {HTMLElement} errorEl - Elemento para mensaje de error
 */
function manejarEnvio(form, submitBtn, successEl, errorEl) {
  const btnText    = submitBtn.querySelector('.btn-text');
  const btnLoading = submitBtn.querySelector('.btn-loading');

  // Validación HTML5
  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }

  // Recopilar datos del formulario
  const formData = new FormData(form);
  const params   = new URLSearchParams();
  formData.forEach((value, key) => params.append(key, value));

  // Mostrar estado de carga
  submitBtn.disabled = true;
  if (btnText)    btnText.hidden = true;
  if (btnLoading) btnLoading.hidden = false;

  // Si no hay URL configurado, mostrar aviso de configuración pendiente
  if (GOOGLE_SCRIPT_URL.includes('REEMPLAZAR')) {
    setTimeout(() => {
      submitBtn.disabled = false;
      if (btnText)    btnText.hidden = false;
      if (btnLoading) btnLoading.hidden = true;
      successEl.hidden = false;
      successEl.textContent = '✅ Formulario recibido (modo demo – ver README para conectar con Google Sheets)';
      form.reset();
    }, 800);
    return;
  }

  // Envío real a Google Apps Script
  fetch(GOOGLE_SCRIPT_URL, {
    method: 'POST',
    mode: 'no-cors', // CORS de GAS requiere este modo
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString()
  })
  .then(() => {
    // Con no-cors no podemos leer la respuesta, asumimos éxito
    successEl.hidden = false;
    errorEl.hidden   = true;
    form.reset();
  })
  .catch(() => {
    errorEl.hidden   = false;
    successEl.hidden = true;
  })
  .finally(() => {
    submitBtn.disabled = false;
    if (btnText)    btnText.hidden = false;
    if (btnLoading) btnLoading.hidden = true;
  });
}

// Formulario de voluntarios — guarda en Supabase
(function initFormVoluntarios() {
  const form = document.getElementById('formVoluntarios');
  if (!form) return;

  const submitBtn = form.querySelector('[type="submit"]');
  const successEl = form.querySelector('.form-success');
  const errorEl   = form.querySelector('.form-error');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!form.checkValidity()) { form.reportValidity(); return; }

    submitBtn.disabled = true;
    submitBtn.querySelector('.btn-text').hidden    = true;
    submitBtn.querySelector('.btn-loading').hidden = false;

    const datos = {
      nombre:         form.querySelector('[name="nombre"]').value.trim(),
      edad:           parseInt(form.querySelector('[name="edad"]').value) || null,
      telefono:       form.querySelector('[name="telefono"]').value.trim(),
      email:          form.querySelector('[name="email"]').value.trim(),
      disponibilidad: form.querySelector('[name="disponibilidad"]').value || null,
      mensaje:        form.querySelector('[name="mensaje"]').value.trim() || null,
    };

    const { error } = await db.from('voluntarios_inscripciones').insert(datos);

    submitBtn.disabled = false;
    submitBtn.querySelector('.btn-text').hidden    = false;
    submitBtn.querySelector('.btn-loading').hidden = true;

    if (error) {
      errorEl.hidden   = false;
      successEl.hidden = true;
    } else {
      successEl.hidden = false;
      errorEl.hidden   = true;
      form.reset();
      fetch('https://eixjvwaneetpebcelgcb.supabase.co/functions/v1/enviar-aviso', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ table: 'voluntarios_inscripciones', record: datos }),
      }).catch(() => {});
    }
  });
})();

// Formulario de contacto — guarda en Supabase
(function initFormContacto() {
  const form = document.getElementById('formContacto');
  if (!form) return;

  const submitBtn = form.querySelector('[type="submit"]');
  const successEl = form.querySelector('.form-success');
  const errorEl   = form.querySelector('.form-error');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!form.checkValidity()) { form.reportValidity(); return; }

    submitBtn.disabled = true;
    submitBtn.querySelector('.btn-text').hidden    = true;
    submitBtn.querySelector('.btn-loading').hidden = false;

    const datos = {
      nombre:  form.querySelector('[name="nombre"]').value.trim(),
      email:   form.querySelector('[name="email"]').value.trim(),
      asunto:  form.querySelector('[name="asunto"]').value || null,
      mensaje: form.querySelector('[name="mensaje"]').value.trim(),
    };

    const { error } = await db.from('contacto_mensajes').insert(datos);

    submitBtn.disabled = false;
    submitBtn.querySelector('.btn-text').hidden    = false;
    submitBtn.querySelector('.btn-loading').hidden = true;

    if (error) {
      errorEl.hidden   = false;
      successEl.hidden = true;
    } else {
      successEl.hidden = false;
      errorEl.hidden   = true;
      form.reset();
      fetch('https://eixjvwaneetpebcelgcb.supabase.co/functions/v1/enviar-aviso', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ table: 'contacto_mensajes', record: datos }),
      }).catch(() => {});
    }
  });
})();


/* =====================================================================
   BARRAS DE TRANSPARENCIA – animación al entrar en vista
   ===================================================================== */
(function initBarras() {
  const barras = document.querySelectorAll('.barra-fill');
  if (!barras.length) return;

  // Guardamos el width original y lo ponemos en 0 hasta que sea visible
  barras.forEach(barra => {
    const targetWidth = barra.style.width;
    barra.style.width = '0';
    barra.dataset.target = targetWidth;
  });

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.width = entry.target.dataset.target;
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });

  barras.forEach(barra => observer.observe(barra));
})();


/* =====================================================================
   LAZY LOADING de imágenes reales (cuando se agreguen)
   Usar: <img loading="lazy" src="..." alt="...">
   El atributo loading="lazy" ya es suficiente en navegadores modernos.
   Este bloque agrega soporte para browsers más viejos si fuera necesario.
   ===================================================================== */
(function initLazyLoad() {
  // Los browsers modernos ya soportan loading="lazy" de forma nativa.
  // Solo actuamos si no hay soporte nativo.
  if ('loading' in HTMLImageElement.prototype) return;

  const imgs = document.querySelectorAll('img[loading="lazy"]');
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        img.src = img.dataset.src || img.src;
        observer.unobserve(img);
      }
    });
  });

  imgs.forEach(img => observer.observe(img));
})();


/* =====================================================================
   CHAT BOT ASISTENTE
   Sin backend · Sin IA · Respuestas hardcodeadas
   ===================================================================== */
(function initChatBot() {
  const toggle = document.getElementById('chatBotToggle');
  const panel  = document.getElementById('chatBotPanel');
  const body   = document.getElementById('chatBotBody');
  if (!toggle || !panel || !body) return;

  const PREGUNTAS = [
    '¿Cómo me sumo como voluntario?',
    '¿Qué días y horarios son los talleres?',
    '¿Necesito experiencia para ser voluntario?',
    '¿Cómo puedo colaborar o donar?',
    '¿Cómo los contacto?',
  ];

  const WA_SVG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="16" height="16" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>';

  function waHref() {
    const el = document.querySelector('a[data-cfg="wa"]');
    return (el && el.href) ? el.href : 'https://wa.me/5492617257242';
  }

  function getRespuesta(idx) {
    const RESP = [
      {
        html: '<p>¡Nos encanta que quieras sumarte! Completá el formulario con tus datos y nos ponemos en contacto con vos.</p>',
        btns: [{ label: 'Ir al formulario', href: '#voluntarios' }],
      },
      {
        html: `<p><strong>Nuestros talleres:</strong></p>
<ul class="chatbot-lista">
  <li><strong>Mi Solcito</strong><br>Martes 10:00 – 11:30<br><span>Bº Tres Estrellas, Godoy Cruz</span></li>
  <li><strong>Picardías</strong><br>Martes 15:00 – 16:30<br><span>Bº Dolores Prats de Huisi, Godoy Cruz</span></li>
  <li><strong>Rinconcito de Luz</strong><br>Miérc. 14:00–16:00 y Viernes 9:00–11:00<br><span>Bº Renacer del Plata, Perdriel, Luján</span></li>
  <li><strong>Multicolores</strong><br>Miérc. 14:30–16:00 y Viernes 10:00–11:30<br><span>Bº Sarmiento, Godoy Cruz</span></li>
  <li><strong>Mundo Explorador</strong><br>Jueves 15:00 – 17:00<br><span>Bº Sol y Sierra, Godoy Cruz</span></li>
  <li><strong>Mi Angelito</strong><br>Jueves 16:00 – 17:30<br><span>Bº ATSA, Godoy Cruz</span></li>
</ul>`,
        btns: [],
      },
      {
        html: '<p>¡Para nada! No hace falta experiencia previa. Lo importante son las ganas de acompañar a los chicos. El equipo te va guiando en todo.</p>',
        btns: [],
      },
      {
        html: '<p>Podés donar dinero por Mercado Pago o al alias de Ualá: <strong>proyectocrecerf.uala</strong>. También podés donar cosas o dar una mano puntual.</p>',
        btns: [{ label: 'Ver cómo colaborar', href: '#colaborar' }],
      },
      {
        html: '<p>Escribinos por WhatsApp y te respondemos lo antes posible.</p>',
        btns: [{ label: WA_SVG + ' Escribir por WhatsApp', href: waHref(), cls: 'chatbot-btn-wa', external: true }],
      },
    ];
    return RESP[idx];
  }

  // Cambia el contenido del cuerpo con un cruce de opacidad breve, en vez
  // de reemplazarlo en seco — se nota mucho al ir y volver de una respuesta.
  function render(html) {
    body.style.opacity = '0';
    body.style.transform = 'translateY(6px)';
    setTimeout(function() {
      body.innerHTML = html;
      body.scrollTop = 0;
      requestAnimationFrame(function() {
        body.style.opacity = '1';
        body.style.transform = 'translateY(0)';
      });
    }, 140);
  }

  function mostrarPreguntas() {
    render(
      '<p class="chatbot-saludo">¡Hola! ¿En qué te podemos ayudar? 👋</p>' +
      '<div class="chatbot-preguntas">' +
      PREGUNTAS.map((p, i) => '<button class="chatbot-pregunta-btn" data-idx="' + i + '">' + p + '</button>').join('') +
      '</div>'
    );
  }

  function mostrarRespuesta(idx) {
    const r = getRespuesta(idx);
    const btnsHTML = r.btns.map(function(b) {
      const ext = b.external ? ' target="_blank" rel="noopener noreferrer"' : '';
      return '<a href="' + b.href + '" class="chatbot-action-btn ' + (b.cls || '') + '"' + ext + '>' + b.label + '</a>';
    }).join('');
    render(
      '<button class="chatbot-back-btn">← Volver a las preguntas</button>' +
      '<div class="chatbot-respuesta">' + r.html +
      (btnsHTML ? '<div class="chatbot-btns">' + btnsHTML + '</div>' : '') +
      '</div>'
    );
  }

  // Abre/cierra con el mismo patrón que el menú mobile y los modales:
  // sacar [hidden], animar un frame después; al cerrar, esperar la
  // transición antes de volver a ocultar.
  function abrir() {
    panel.hidden = false;
    requestAnimationFrame(function() {
      requestAnimationFrame(function() { panel.classList.add('cf-abierto'); });
    });
    toggle.setAttribute('aria-expanded', 'true');
    toggle.classList.add('abierto');
    mostrarPreguntas();
  }

  function cerrar() {
    panel.classList.remove('cf-abierto');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.classList.remove('abierto');
    panel.addEventListener('transitionend', function onEnd() {
      if (!panel.classList.contains('cf-abierto')) panel.hidden = true;
    }, { once: true });
  }

  toggle.addEventListener('click', function() { panel.hidden ? abrir() : cerrar(); });

  body.addEventListener('click', function(e) {
    const pregBtn = e.target.closest('.chatbot-pregunta-btn');
    if (pregBtn) { mostrarRespuesta(parseInt(pregBtn.dataset.idx, 10)); return; }

    if (e.target.closest('.chatbot-back-btn')) { mostrarPreguntas(); return; }

    const actionBtn = e.target.closest('.chatbot-action-btn:not([target="_blank"])');
    if (actionBtn) {
      e.preventDefault();
      const dest = document.querySelector(actionBtn.getAttribute('href'));
      if (dest) {
        cerrar();
        setTimeout(function() { dest.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 220);
      }
    }
  });

  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && !panel.hidden) cerrar();
  });
})();


/* =====================================================================
   BARRA DE PROGRESO DE SCROLL
   ===================================================================== */
(function initScrollProgress() {
  const bar = document.createElement('div');
  bar.className = 'cf-scroll-progress';
  document.body.appendChild(bar);

  let raf = null;
  function update() {
    raf = null;
    const h = document.documentElement;
    const scrollable = h.scrollHeight - h.clientHeight;
    const pct = scrollable > 0 ? (h.scrollTop / scrollable) * 100 : 0;
    bar.style.width = pct + '%';
  }

  window.addEventListener('scroll', () => {
    if (raf === null) raf = requestAnimationFrame(update);
  }, { passive: true });
  window.addEventListener('resize', () => {
    if (raf === null) raf = requestAnimationFrame(update);
  });
  update();
})();


/* =====================================================================
   CURSOR PERSONALIZADO
   Solo en dispositivos con mouse real. El anillo sigue con una leve
   demora (lerp) para que se sienta "vivo"; el punto lo sigue exacto.
   Crece sobre links, botones y tarjetas.
   ===================================================================== */
(function initCustomCursor() {
  const esMouse = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const sinMovimiento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!esMouse || sinMovimiento) return;

  const ring = document.createElement('div');
  ring.className = 'cf-cursor';
  const dot = document.createElement('div');
  dot.className = 'cf-cursor-dot';
  document.body.appendChild(ring);
  document.body.appendChild(dot);
  document.body.classList.add('cf-cursor-on');

  let mouseX = -100, mouseY = -100;
  let ringX = -100, ringY = -100;
  let activo = false;

  document.addEventListener('mousemove', e => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    dot.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0)`;
    if (!activo) { activo = true; requestAnimationFrame(loop); }
  });

  const HOVER_SELECTOR = 'a, button, .taller-card, .evento-card, .colaborar-card, input, textarea, select, [role="button"]';
  document.addEventListener('mouseover', e => {
    if (e.target.closest(HOVER_SELECTOR)) ring.classList.add('cf-cursor--hover');
  });
  document.addEventListener('mouseout', e => {
    if (e.target.closest(HOVER_SELECTOR)) ring.classList.remove('cf-cursor--hover');
  });
  document.addEventListener('mouseleave', () => {
    ring.style.transform = dot.style.transform = 'translate3d(-100px, -100px, 0)';
  });

  function loop() {
    ringX += (mouseX - ringX) * 0.18;
    ringY += (mouseY - ringY) * 0.18;
    ring.style.transform = `translate3d(${ringX}px, ${ringY}px, 0)`;
    if (Math.abs(mouseX - ringX) > 0.3 || Math.abs(mouseY - ringY) > 0.3) {
      requestAnimationFrame(loop);
    } else {
      activo = false;
    }
  }
})();


/* =====================================================================
   TEXTO QUE SE ARMA PALABRA POR PALABRA (split-text reveal)
   Envuelve cada palabra de un elemento en spans animables sin tocar el
   texto real: el contenedor recibe aria-label con el texto original y
   cada palabra queda aria-hidden, así los lectores de pantalla escuchan
   el texto tal cual, y el efecto visual queda aparte.
   ===================================================================== */
(function initSplitText() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  function splitWords(el) {
    const original = el.textContent.trim().replace(/\s+/g, ' ');
    el.setAttribute('aria-label', original);

    function walk(node) {
      Array.from(node.childNodes).forEach(child => {
        if (child.nodeType === Node.TEXT_NODE) {
          if (!child.textContent.trim()) return;
          const frag = document.createDocumentFragment();
          child.textContent.split(/(\s+)/).forEach(part => {
            if (part === '') return;
            if (/^\s+$/.test(part)) {
              frag.appendChild(document.createTextNode(part));
              return;
            }
            const outer = document.createElement('span');
            outer.className = 'cf-split-word';
            outer.setAttribute('aria-hidden', 'true');
            const inner = document.createElement('span');
            inner.className = 'cf-split-word-inner';
            inner.textContent = part;
            outer.appendChild(inner);
            frag.appendChild(outer);
          });
          node.replaceChild(frag, child);
        } else if (child.nodeType === Node.ELEMENT_NODE) {
          walk(child);
        }
      });
    }
    walk(el);
  }

  // Título del hero: se arma como parte de la secuencia de entrada
  // (ver initHeroIntro), no al hacer scroll.
  const titulo = document.querySelector('.page-title');
  if (titulo) {
    splitWords(titulo);
    titulo.querySelectorAll('.cf-split-word-inner').forEach((w, i) => {
      w.style.transitionDelay = (450 + i * 45) + 'ms';
    });
  }

  // Títulos de sección: se arman al entrar en vista, igual que el resto
  // del contenido con scroll reveal.
  const titulosSeccion = document.querySelectorAll('.section-header h2');
  if (!titulosSeccion.length) return;

  titulosSeccion.forEach(h2 => {
    splitWords(h2);
    h2.querySelectorAll('.cf-split-word-inner').forEach((w, i) => {
      w.style.transitionDelay = (i * 40) + 'ms';
    });
  });

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('cf-split-in');
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.4, rootMargin: '0px 0px -60px 0px' });

  titulosSeccion.forEach(h2 => observer.observe(h2));
})();


/* =====================================================================
   BOTONES MAGNÉTICOS
   Envuelve cada botón objetivo en un <span> y mueve ESE span siguiendo
   el cursor dentro de un radio — el propio hover del botón (scale,
   rotate, sombra) se sigue viendo encima, sin pisarse.
   ===================================================================== */
(function initMagnetic() {
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  // OJO: .btn-scroll-top queda afuera a propósito — es position:fixed, y
  // envolverlo en un span al que luego le aplicamos transform lo
  // convertiría en su nuevo contenedor de posicionamiento, rompiendo el
  // anclaje al viewport justo mientras el mouse está encima.
  const SELECTOR = '.chatbot-bubble, .colaborar-card .btn, .colaborar-card .btn-whatsapp, .contacto-redes .red-social';
  const FUERZA = 0.35;
  const MAX = 16;

  function enganchar(el) {
    if (el.dataset.cfMagnetic) return;
    el.dataset.cfMagnetic = '1';

    const wrap = document.createElement('span');
    wrap.className = 'cf-magnetic';
    el.parentNode.insertBefore(wrap, el);
    wrap.appendChild(el);

    wrap.addEventListener('mousemove', e => {
      const rect = wrap.getBoundingClientRect();
      const relX = e.clientX - (rect.left + rect.width / 2);
      const relY = e.clientY - (rect.top + rect.height / 2);
      const x = Math.max(-MAX, Math.min(MAX, relX * FUERZA));
      const y = Math.max(-MAX, Math.min(MAX, relY * FUERZA));
      wrap.style.transform = `translate(${x}px, ${y}px)`;
    });
    wrap.addEventListener('mouseleave', () => { wrap.style.transform = ''; });
  }

  document.querySelectorAll(SELECTOR).forEach(enganchar);

  // Los botones de "Colaborar" y las redes sociales de contacto ya están
  // en el HTML al cargar, pero por si algo se re-renderiza, reintentamos.
  window.addEventListener('load', () => document.querySelectorAll(SELECTOR).forEach(enganchar));
})();


/* =====================================================================
   PARALLAX SUAVE EN FOTOS DE TARJETAS (solo con mouse)
   Funciona por delegación en document, así cubre también las tarjetas
   de talleres y eventos que se generan después, desde Supabase.
   ===================================================================== */
(function initCardParallax() {
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const SELECTOR = '.taller-foto, .evento-thumb';
  let activo = null;

  document.addEventListener('mousemove', e => {
    const wrap = e.target.closest(SELECTOR);

    if (activo && activo !== wrap) {
      activo.classList.remove('cf-parallax-active');
      const img = activo.querySelector('img');
      if (img) img.style.transform = '';
      activo = null;
    }

    if (!wrap) return;
    const img = wrap.querySelector('img');
    if (!img) return;

    wrap.classList.add('cf-parallax-active');
    activo = wrap;

    const rect = wrap.getBoundingClientRect();
    const relX = (e.clientX - rect.left) / rect.width - 0.5;
    const relY = (e.clientY - rect.top) / rect.height - 0.5;
    img.style.transform = `scale(1.12) translate(${relX * -10}px, ${relY * -10}px)`;
  });
})();


/* =====================================================================
   HERO: secuencia de entrada + indicador de scroll
   ===================================================================== */
(function initHeroIntro() {
  const header = document.querySelector('.page-header');
  if (!header) return;
  const titulo = header.querySelector('.page-title');

  setTimeout(() => {
    header.classList.add('cf-hero-in');
    if (titulo) titulo.classList.add('cf-split-in');
  }, 80);

  window.addEventListener('scroll', () => {
    header.classList.toggle('cf-scrolled', window.scrollY > 60);
  }, { passive: true });
})();
