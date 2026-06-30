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

  // Hamburguesa
  toggle.addEventListener('click', () => {
    const isOpen = toggle.classList.toggle('open');
    toggle.setAttribute('aria-expanded', isOpen);
    mobileMenu.hidden = !isOpen;
  });

  // Cerrar menú al hacer clic en un link
  mobileLinks.forEach(link => {
    link.addEventListener('click', () => {
      toggle.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
      mobileMenu.hidden = true;
    });
  });

  // Cerrar con Escape
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && !mobileMenu.hidden) {
      toggle.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
      mobileMenu.hidden = true;
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
   ===================================================================== */
(function initReveal() {
  const elements = document.querySelectorAll('.reveal');

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target); // solo animar una vez
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  elements.forEach(el => observer.observe(el));
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
  const cards    = document.querySelectorAll('.evento-card[data-modal]');
  const overlays = document.querySelectorAll('.modal-overlay');
  if (!cards.length) return;

  let anteriorFoco = null; // para devolver el foco al cerrar

  function abrirModal(id) {
    const overlay = document.getElementById(id);
    if (!overlay) return;

    anteriorFoco = document.activeElement;

    overlay.hidden = false;
    document.body.classList.add('modal-open');

    // Animación de entrada (un tick después para que el display:flex se aplique)
    requestAnimationFrame(() => {
      requestAnimationFrame(() => overlay.classList.add('modal-visible'));
    });

    // Foco al botón de cerrar
    const closeBtn = overlay.querySelector('.modal-close');
    if (closeBtn) closeBtn.focus();
  }

  function cerrarModal(overlay) {
    overlay.classList.remove('modal-visible');

    // Pausar todos los videos dentro del modal al cerrar
    overlay.querySelectorAll('video').forEach(v => { v.pause(); });

    // Esperar la transición antes de ocultar
    overlay.addEventListener('transitionend', () => {
      overlay.hidden = true;
      document.body.classList.remove('modal-open');
      if (anteriorFoco) anteriorFoco.focus();
    }, { once: true });
  }

  // Abrir modal al hacer clic o Enter/Espacio en la tarjeta
  cards.forEach(card => {
    const openModal = () => abrirModal(card.dataset.modal);
    card.addEventListener('click', openModal);
    card.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openModal(); }
    });
  });

  // Cerrar con botón X
  overlays.forEach(overlay => {
    const closeBtn = overlay.querySelector('.modal-close');
    if (closeBtn) closeBtn.addEventListener('click', () => cerrarModal(overlay));

    // Cerrar al hacer clic en el fondo oscuro (fuera del panel)
    overlay.addEventListener('click', e => {
      if (e.target === overlay) cerrarModal(overlay);
    });
  });

  // Cerrar con Escape
  document.addEventListener('keydown', e => {
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

// Formulario de voluntarios
(function initFormVoluntarios() {
  const form      = document.getElementById('formVoluntarios');
  if (!form) return;

  const submitBtn = form.querySelector('[type="submit"]');
  const successEl = form.querySelector('.form-success');
  const errorEl   = form.querySelector('.form-error');

  form.addEventListener('submit', e => {
    e.preventDefault();
    manejarEnvio(form, submitBtn, successEl, errorEl);
  });
})();

// Formulario de contacto
(function initFormContacto() {
  const form      = document.getElementById('formContacto');
  if (!form) return;

  const submitBtn = form.querySelector('[type="submit"]');
  const successEl = form.querySelector('.form-success');
  const errorEl   = form.querySelector('.form-error');

  form.addEventListener('submit', e => {
    e.preventDefault();
    manejarEnvio(form, submitBtn, successEl, errorEl);
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
