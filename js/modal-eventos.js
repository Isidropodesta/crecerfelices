/* Alto del video de los modales de Eventos = alto del texto (entre 280 y 480 px).
   El ResizeObserver dispara cuando el modal se muestra, no al cargar la página. */
(function initAltoVideoModales() {
  if (!('ResizeObserver' in window)) return;

  document.querySelectorAll('.modal-evento-layout').forEach(layout => {
    const desc = layout.querySelector('.modal-desc');
    const col = layout.querySelector('.modal-video-col');
    if (!desc || !col) return;

    let ultimo = 0;
    new ResizeObserver(() => {
      const h = Math.min(480, Math.max(280, Math.round(desc.offsetHeight)));
      // el ancho del texto depende del video: se ignoran cambios de 1px para no oscilar
      if (Math.abs(h - ultimo) < 2) return;
      ultimo = h;
      col.style.setProperty('--video-h', h + 'px');
    }).observe(desc);
  });
})();
