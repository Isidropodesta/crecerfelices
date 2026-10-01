# Modal eventos: texto + video vertical

**Fecha:** 2026-10-01
**Rama:** `claude/crecer-felices-nuevo-diseno`

## Objetivo

Reemplazar el contenido multimedia de los 4 modales de eventos por el patrón
"texto a la izquierda, un solo video vertical a la derecha", idéntico al layout de
"Quiénes somos". Sin fotos.

## Alcance

Archivos modificados: `index.html`, `css/styles.css`, `.gitignore`.
No se toca: hero, Quiénes somos, Talleres, admin.js, Supabase, main.js, portadas.
No se hace deploy ni merge a main.

---

## Paso 1 — Verificación de archivos y audio

Verificar existencia de los 4 videos requeridos. Si falta alguno, parar.

Reportar (sin modificar) si `bienvenida-voluntarios.mp4` y `salida-cae-granja.mp4`
tienen pista de audio. Si tienen audio, se informa y el usuario decide qué hacer.

## Paso 2 — Compresión de salida-cae-granja.mp4

El original (18.92 MB) supera el límite de 8 MB.

- Crear `_originales/` y mover el original ahí.
- Agregar `_originales/` al `.gitignore`.
- Instalar `imageio-ffmpeg` vía `pip install --user` para obtener un binario estático
  de ffmpeg solo para el usuario (sin tocar el sistema).
- Comprimir con: H.264, CRF 28, ancho 720 px (mantiene aspect ratio vertical),
  `-movflags +faststart`.
- Guardar resultado en `videos/salida-cae-granja.mp4`.
- Objetivo: < 8 MB.

## Paso 3 — Cambios HTML (4 modales)

Cada `.modal-body` pasa a tener este único patrón:

```html
<div class="modal-body">
  <div class="modal-evento-layout">
    <div class="modal-desc">
      <!-- texto existente sin cambios -->
    </div>
    <div class="modal-video-col">
      <div class="video-wrapper video-vertical">
        <video controls playsinline preload="metadata"
               aria-label="[descripción del evento]">
          <source src="videos/nombre.mp4#t=0.1" type="video/mp4">
        </video>
      </div>
    </div>
  </div>
</div>
```

Detalles:
- `#t=0.1` en el `src` para que el navegador muestre fotograma de portada. Sin `poster`.
- Sin `autoplay`. Controles nativos simples (`controls`).
- `preload="metadata"` para no precargar el video completo.
- Se eliminan: `.modal-fotos`, `.locro-layout`, `.locro-collage`, `.nino-grid`,
  `un-dia-para-ellos.mp4` (video extra del Día del Niño).

Videos por evento:
| Evento | Archivo |
|--------|---------|
| Bienvenida a voluntarios | `videos/bienvenida-voluntarios.mp4#t=0.1` |
| Locro del 9 de Julio | `videos/locro-9-de-julio.mp4#t=0.1` |
| Día del Niño | `videos/un-dia-para-recordar.mp4#t=0.1` |
| Salida de cada CAE | `videos/salida-cae-granja.mp4#t=0.1` |

## Paso 4 — CSS nuevo

Agregar en `css/styles.css` (en la sección de modales):

```css
/* Modal: layout texto-izquierda / video-derecha */
.modal-evento-layout {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* Video en mobile: centrado, acotado para no empujar el texto */
.modal-video-col {
  display: flex;
  justify-content: center;
}
.modal-video-col .video-vertical {
  width: 100%;
  max-width: 300px;
  max-height: 70vh;
  overflow: hidden;
}
.modal-video-col .video-vertical video {
  width: 100%;
  max-height: 70vh;
  object-fit: contain;
}

@media (min-width: 768px) {
  .modal-evento-layout {
    display: grid;
    grid-template-columns: 1fr 260px;
    gap: 32px;
    align-items: start;
  }
  .modal-video-col .video-vertical {
    max-width: 260px;
    max-height: none;
  }
  .modal-video-col .video-vertical video {
    max-height: none;
  }
}
```

Reutiliza `.video-wrapper` y `.video-vertical` ya existentes.
No modifica `.quienes-layout` ni ninguna clase existente.

Si un evento no tuviera video (caso edge), el layout cae a solo la columna de texto sin
hueco vacío gracias a `grid-template-columns: 1fr`.

## Paso 5 — git log (solo lectura)

```
git log --all -S"evento_media" --oneline
```

Solo reportar. Sin restaurar ni modificar nada.

## Paso 6 — Commit y push

Commit en `claude/crecer-felices-nuevo-diseno` con mensaje descriptivo.
Push para generar URL de preview en Vercel.
No tocar main ni hacer merge.

## Paso 7 — Pruebas con Playwright

Servidor de desarrollo local (`npx serve .` o similar).
Viewports: 1440×900 (desktop) y 390×844 (mobile).

Por cada modal:
1. Abrir haciendo clic en su tarjeta (no cargando el HTML directo).
2. Verificar: texto izquierda + video derecha (desktop); texto arriba + video abajo
   (mobile).
3. Reproducir el video y confirmar que carga sin 404.
4. Cerrar con la X → verificar que el video se pausa.
5. Abrir de nuevo → cerrar con Escape → verificar pausa.
6. Abrir de nuevo → clic en el fondo → verificar pausa y cierre.
7. Revisar consola: sin errores ni 404.

Captura de pantalla de cada modal (desktop + mobile) guardada como evidencia.
Reportar peso final de cada video.

## Criterio de falla

Cualquier test fallido → parar y reportar antes de continuar.
