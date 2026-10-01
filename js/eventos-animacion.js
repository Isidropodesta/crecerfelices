/* Entrada de las tarjetas de Eventos: se abren desde el centro de la grilla (una vez por carga). */
(function initEventosEntrada() {
  const grid = document.getElementById('eventosGrid');
  if (!grid || !('IntersectionObserver' in window) || !('animate' in grid)) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const cards = [...grid.querySelectorAll('.evento-card')];
  const mobile = window.matchMedia('(max-width: 600px)');
  const ROTACIONES = [-3, -1, 1, 3];
  const EASING = 'cubic-bezier(0.22, 1, 0.36, 1)';

  function estadoInicial(card, i) {
    if (mobile.matches) return 'translateY(24px)';
    const g = grid.getBoundingClientRect();
    const c = card.getBoundingClientRect();
    const dx = (g.left + g.width / 2) - (c.left + c.width / 2);
    const dy = (g.top + g.height / 2) - (c.top + c.height / 2);
    return `translate(${dx}px, ${dy}px) scale(0.92) rotate(${ROTACIONES[i]}deg)`;
  }

  // Las tarjetas tienen .reveal en el HTML; los estilos inline pisan ese fade.
  function aplicarInicial() {
    cards.forEach((card, i) => {
      card.style.transform = 'none';
      card.style.transform = estadoInicial(card, i);
      card.style.opacity = '0';
      card.style.pointerEvents = 'none';
      card.style.zIndex = String(cards.length - i);
    });
  }

  function limpiar(card) {
    card.style.transform = '';
    card.style.opacity = '';
    card.style.pointerEvents = '';
    card.style.zIndex = '';
    card.style.willChange = '';
  }

  function animar(baseDelay) {
    const duracion = mobile.matches ? 500 : 800;
    cards.forEach((card, i) => {
      // transform inline se resetea primero para medir la posición final real
      card.style.transform = 'none';
      const desde = estadoInicial(card, i);
      const delay = baseDelay + i * 60;
      card.style.willChange = 'transform';

      const mov = card.animate(
        [{ transform: desde }, { transform: 'none' }],
        { duration: duracion, delay, easing: EASING, fill: 'backwards' }
      );
      card.animate(
        [{ opacity: 0 }, { opacity: 1 }],
        { duration: 250, delay, easing: 'ease-out', fill: 'backwards' }
      );
      card.style.transform = '';
      card.style.opacity = '';
      mov.onfinish = () => limpiar(card);
    });
  }

  aplicarInicial();

  let disparada = false;
  const onResize = () => { if (!disparada) aplicarInicial(); };
  window.addEventListener('resize', onResize);

  const r = grid.getBoundingClientRect();
  const visible = Math.min(r.bottom, window.innerHeight) - Math.max(r.top, 0);
  const yaVisible = visible >= r.height * 0.25;

  const observer = new IntersectionObserver(entries => {
    if (!entries.some(e => e.isIntersecting)) return;
    disparada = true;
    observer.disconnect();
    window.removeEventListener('resize', onResize);
    animar(yaVisible ? 150 : 0);
  }, { threshold: 0.25 });
  observer.observe(grid);
})();
