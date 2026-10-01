/* Entrada de tarjetas (Eventos y Talleres): aparecen apiladas en el centro de la grilla,
   quedan quietas un momento y se abren hacia su lugar. Una sola vez por carga. */
(function initTarjetasEntrada() {
  if (!('IntersectionObserver' in window) || !document.documentElement.animate) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const mobile = window.matchMedia('(max-width: 599px)');
  const ROTACIONES = [-3, -1, 1, 3, -2, 2];
  const EASING_ABRIR = 'cubic-bezier(0.65, 0, 0.35, 1)';
  const VIEWPORT_UTIL = 0.88; // rootMargin inferior de -12%

  /* orden: 'indice' (orden del DOM) | 'horario' (sentido horario desde arriba a la izquierda) */
  function abrirTarjetas(grilla, obtenerTarjetas, opciones) {
    const op = { aparecer: 480, quieta: 600, abrir: 1320, escalon: 90, orden: 'indice', ...opciones };
    let disparada = false;

    // Las ocultas por un filtro (display: none) no se animan ni se apilan.
    const visibles = () => obtenerTarjetas().filter(c => c.offsetParent !== null);

    function apilado(dx, dy, i, escala) {
      return `translate(${dx}px, ${dy}px) scale(${escala}) rotate(${ROTACIONES[i % ROTACIONES.length]}deg)`;
    }

    // Mide con transform en none para obtener la posición final real.
    function medir(cards) {
      cards.forEach(c => { c.style.transform = 'none'; });
      const g = grilla.getBoundingClientRect();
      const gx = g.left + g.width / 2;
      const gy = g.top + g.height / 2;
      return cards.map(c => {
        const r = c.getBoundingClientRect();
        const cx = r.left + r.width / 2;
        const cy = r.top + r.height / 2;
        // 0 = arriba, crece en sentido horario; se parte desde la izquierda (-90°) con holgura
        const ang = Math.atan2(cx - gx, -(cy - gy));
        const rel = (ang + Math.PI / 2 + 0.1 + 4 * Math.PI) % (2 * Math.PI);
        return { dx: gx - cx, dy: gy - cy, rel };
      });
    }

    function rangos(medidas) {
      const idx = medidas.map((_, i) => i);
      if (op.orden === 'horario') idx.sort((a, b) => medidas[a].rel - medidas[b].rel);
      const rango = [];
      idx.forEach((i, r) => { rango[i] = r; });
      return rango;
    }

    function limpiar(card) {
      ['transform', 'opacity', 'pointerEvents', 'zIndex', 'willChange', 'transition']
        .forEach(p => { card.style[p] = ''; });
    }

    // Las tarjetas pueden traer .reveal o una transición propia; el inline las pisa.
    function aplicarInicial() {
      const cards = visibles();
      const medidas = mobile.matches ? [] : medir(cards);
      cards.forEach((card, i) => {
        card.style.transition = 'none';
        card.style.transform = mobile.matches ? 'translateY(24px)' : apilado(medidas[i].dx, medidas[i].dy, i, 0.92);
        card.style.opacity = '0';
        card.style.pointerEvents = 'none';
        card.style.zIndex = String(cards.length - i);
      });
    }

    function animar(base) {
      const todas = obtenerTarjetas();
      const cards = visibles();
      todas.filter(c => !cards.includes(c)).forEach(limpiar);
      const medidas = mobile.matches ? [] : medir(cards);
      const rango = rangos(medidas.length ? medidas : cards.map(() => ({ rel: 0 })));
      const n = cards.length;

      cards.forEach((card, i) => {
        card.style.willChange = 'transform';
        let anim;
        if (mobile.matches) {
          anim = card.animate(
            [{ transform: 'translateY(24px)', opacity: 0 }, { transform: 'none', opacity: 1 }],
            { duration: 500, delay: base + i * 80, easing: 'ease-out', fill: 'both' }
          );
        } else {
          const { dx, dy } = medidas[i];
          const total = op.aparecer + op.quieta + op.abrir + op.escalon * (n - 1);
          const inicioAbrir = op.aparecer + op.quieta + rango[i] * op.escalon;
          const juntas = apilado(dx, dy, i, 0.92);
          anim = card.animate([
            { offset: 0, transform: apilado(dx, dy, i, 0.9), opacity: 0, easing: 'ease-out' },
            { offset: op.aparecer / total, transform: juntas, opacity: 1, easing: 'linear' },
            { offset: inicioAbrir / total, transform: juntas, opacity: 1, easing: EASING_ABRIR },
            { offset: (inicioAbrir + op.abrir) / total, transform: 'none', opacity: 1 },
            { offset: 1, transform: 'none', opacity: 1 }
          ], { duration: total, delay: base, fill: 'both' });
        }
        // Con las animaciones en marcha, el estado inline ya no hace falta; al terminar se cancelan
        // para que hover y foco recuperen el transform normal.
        card.style.transform = '';
        card.style.opacity = '';
        anim.onfinish = () => { limpiar(card); anim.cancel(); };
      });
    }

    aplicarInicial();
    const onResize = () => { if (!disparada) aplicarInicial(); };
    window.addEventListener('resize', onResize);

    // En pantallas chicas la grilla puede ser más alta que lo que cabe: se baja el umbral para que dispare.
    const alto = Math.max(grilla.offsetHeight, 1);
    const umbral = Math.min(0.45, (window.innerHeight * VIEWPORT_UTIL * 0.9) / alto);
    const r = grilla.getBoundingClientRect();
    const visible = Math.min(r.bottom, window.innerHeight * VIEWPORT_UTIL) - Math.max(r.top, 0);
    const yaVisible = visible >= r.height * umbral;

    const observer = new IntersectionObserver(entries => {
      if (!entries.some(e => e.isIntersecting)) return;
      disparada = true;
      observer.disconnect();
      window.removeEventListener('resize', onResize);
      animar(yaVisible ? 150 : 0);
    }, { threshold: umbral, rootMargin: '0px 0px -12% 0px' });
    observer.observe(grilla);
  }

  const eventos = document.getElementById('eventosGrid');
  if (eventos) {
    abrirTarjetas(eventos, () => [...eventos.querySelectorAll('.evento-card')], { orden: 'indice' });
  }

  // Los talleres se cargan de forma asíncrona: se espera a que existan las tarjetas.
  const talleres = document.getElementById('talleresGrid');
  if (talleres) {
    const tarjetas = () => [...talleres.querySelectorAll('.taller-card')];
    const armar = () => abrirTarjetas(talleres, tarjetas, { orden: 'horario' });
    if (tarjetas().length) {
      armar();
    } else {
      const mo = new MutationObserver(() => {
        if (!tarjetas().length) return;
        mo.disconnect();
        armar();
      });
      mo.observe(talleres, { childList: true });
    }
  }
})();
