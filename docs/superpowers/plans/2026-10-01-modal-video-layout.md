# Modal eventos: texto + video vertical — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reemplazar el contenido multimedia de los 4 modales de eventos por texto izquierda + un video vertical derecha, igual que "Quiénes somos", sin fotos.

**Architecture:** Sitio estático. Los modales viven en `index.html`. Se agrega una clase CSS nueva `.modal-evento-layout` en `styles.css` que replica el patrón de `.quienes-layout` adaptado al ancho del modal panel (max-width 860px). Los videos se referencian con rutas relativas + `#t=0.1`.

**Tech Stack:** HTML5, CSS3 (grid/flex), ffmpeg vía imageio-ffmpeg (pip --user), Playwright MCP para pruebas.

---

### Task 0: Auditoría de contenido público antes del push

**Files:**
- Read: `docs/` (recursivo) — verificar contenido
- Read: `.superpowers/` — verificar contenido
- Read: `.gitignore`

- [ ] **Step 1: Listar y leer `docs/`**

```bash
find docs/ -type f | sort
```

Leer cada archivo. Identificar si hay claves, tokens, URLs internas, o notas sensibles.

- [ ] **Step 2: Listar y leer `.superpowers/`**

```bash
find .superpowers/ -type f | sort
```

Leer cada archivo. Verificar lo mismo.

- [ ] **Step 3: Reportar al usuario**

Enumerar qué contiene cada carpeta y si algo es sensible.
Si hay algo sensible, agregar al `.gitignore` ANTES de continuar.
Si no hay nada sensible, confirmar y continuar.

---

### Task 1: Verificar archivos y reportar audio

**Files:**
- Read: `videos/bienvenida-voluntarios.mp4` (solo existencia + audio)
- Read: `videos/locro-9-de-julio.mp4` (solo existencia)
- Read: `videos/un-dia-para-recordar.mp4` (solo existencia)
- Read: `videos/salida-cae-granja.mp4` (solo existencia + audio)

- [ ] **Step 1: Verificar que los 4 archivos existen**

```powershell
$videos = @(
  "videos/bienvenida-voluntarios.mp4",
  "videos/locro-9-de-julio.mp4",
  "videos/un-dia-para-recordar.mp4",
  "videos/salida-cae-granja.mp4"
)
foreach ($v in $videos) {
  $exists = Test-Path $v
  Write-Output "$v : exists=$exists size=$((Get-Item $v -ErrorAction SilentlyContinue).Length)"
}
```

Si alguno no existe → PARAR y reportar.

- [ ] **Step 2: Detectar pistas de audio vía átomos MP4 (Python)**

```python
import struct

def has_audio_track(path):
    """Lee átomos MP4 buscando un trak con handler 'soun'."""
    def read_box(f):
        data = f.read(8)
        if len(data) < 8: return None, 0
        size, box_type = struct.unpack('>I4s', data)
        return box_type.decode('latin-1'), size if size > 0 else None
    
    with open(path, 'rb') as f:
        f.seek(0, 2); file_end = f.tell(); f.seek(0)
        # find moov
        while f.tell() < file_end:
            pos = f.tell()
            bt, sz = read_box(f)
            if bt is None: break
            if bt == 'moov':
                moov_end = pos + sz
                # scan trak boxes
                while f.tell() < moov_end:
                    tp = f.tell()
                    bt2, sz2 = read_box(f)
                    if bt2 is None: break
                    if bt2 == 'trak':
                        trak_end = tp + sz2
                        while f.tell() < trak_end:
                            tp2 = f.tell()
                            bt3, sz3 = read_box(f)
                            if bt3 is None: break
                            if bt3 == 'mdia':
                                mdia_end = tp2 + sz3
                                while f.tell() < mdia_end:
                                    tp3 = f.tell()
                                    bt4, sz4 = read_box(f)
                                    if bt4 is None: break
                                    if bt4 == 'hdlr':
                                        f.read(8)  # version + flags + pre_defined
                                        handler = f.read(4).decode('latin-1')
                                        if handler == 'soun':
                                            return True
                                    f.seek(tp3 + sz4)
                            f.seek(tp2 + sz3)
                    else:
                        f.seek(tp + sz2)
                return False
            f.seek(pos + sz)
    return False

for fname in ['videos/bienvenida-voluntarios.mp4', 'videos/salida-cae-granja.mp4']:
    result = has_audio_track(fname)
    print(f'{fname}: audio={result}')
```

Reportar resultado. No modificar nada.

---

### Task 2: Comprimir salida-cae-granja.mp4

**Files:**
- Create: `_originales/salida-cae-granja.mp4` (copia del original)
- Modify: `videos/salida-cae-granja.mp4` (reemplazado por versión comprimida)
- Modify: `.gitignore` (agregar `_originales/`)

- [ ] **Step 1: Crear `_originales/` y mover el original**

```powershell
New-Item -ItemType Directory -Force "_originales"
Copy-Item "videos/salida-cae-granja.mp4" "_originales/salida-cae-granja.mp4"
```

Verificar que `_originales/salida-cae-granja.mp4` existe y tiene el mismo tamaño (18.92 MB).

- [ ] **Step 2: Agregar `_originales/` al `.gitignore`**

Abrir `.gitignore` y agregar al final:
```
_originales/
```

- [ ] **Step 3: Instalar imageio-ffmpeg (obtiene binario estático de ffmpeg)**

```powershell
pip install --user imageio-ffmpeg 2>&1
```

Luego obtener ruta del binario:
```python
import imageio_ffmpeg
print(imageio_ffmpeg.get_ffmpeg_exe())
```

Guardar la ruta para el siguiente paso.

- [ ] **Step 4: Comprimir con ffmpeg**

Usar la ruta obtenida en el paso anterior (ej: `C:\Users\isidr\AppData\...`).

```powershell
$ffmpeg = python -c "import imageio_ffmpeg; print(imageio_ffmpeg.get_ffmpeg_exe())"
& $ffmpeg -i "_originales/salida-cae-granja.mp4" `
  -vf "scale=720:-2" `
  -c:v libx264 -crf 28 -preset medium `
  -c:a aac -b:a 96k `
  -movflags +faststart `
  "videos/salida-cae-granja.mp4" -y
```

- [ ] **Step 5: Verificar peso del resultado**

```powershell
$size = (Get-Item "videos/salida-cae-granja.mp4").Length
Write-Output "Peso: $([math]::Round($size/1MB,2)) MB"
```

Si peso >= 8 MB → incrementar CRF a 30 y repetir el paso 4.
Si peso < 8 MB → continuar.

---

### Task 3: Modificar los 4 modales en index.html

**Files:**
- Modify: `index.html` (secciones de los 4 modales)

**Patrón HTML a aplicar en cada modal (dentro de `.modal-body`):**

```html
<div class="modal-body">
  <div class="modal-evento-layout">
    <div class="modal-desc">
      <!-- texto existente, sin cambios -->
    </div>
    <div class="modal-video-col">
      <div class="video-wrapper video-vertical">
        <video controls playsinline preload="metadata"
               aria-label="[descripción legible del evento]">
          <source src="videos/NOMBRE.mp4#t=0.1" type="video/mp4">
        </video>
      </div>
    </div>
  </div>
</div>
```

- [ ] **Step 1: Modal Bienvenida a voluntarios (`#modal-bienvenida`)**

Reemplazar todo el contenido de `<div class="modal-body">` por:
```html
    <div class="modal-body">
      <div class="modal-evento-layout">
        <div class="modal-desc">
          <p>El comienzo de cada ciclo anual trae consigo un momento especial: la bienvenida a los nuevos voluntarios. En este encuentro, quienes se suman por primera vez conocen el proyecto, los barrios donde trabajamos y al equipo con el que van a compartir el año.</p>
          <p>Es un momento de presentaciones, de contar la historia del proyecto, y de generar el primer vínculo entre pares. Los que llevan más tiempo transmiten el espíritu; los nuevos traen energía fresca. Así se renueva el equipo año a año.</p>
        </div>
        <div class="modal-video-col">
          <div class="video-wrapper video-vertical">
            <video controls playsinline preload="metadata"
                   aria-label="Video de bienvenida a voluntarios">
              <source src="videos/bienvenida-voluntarios.mp4#t=0.1" type="video/mp4">
            </video>
          </div>
        </div>
      </div>
    </div>
```

- [ ] **Step 2: Modal Locro del 9 de Julio (`#modal-locro`)**

Reemplazar todo el contenido de `<div class="modal-body">` por:
```html
    <div class="modal-body">
      <div class="modal-evento-layout">
        <div class="modal-desc">
          <p>Cada 9 de Julio preparamos locro para toda la comunidad. Voluntarios, familias y vecinos de los barrios se reúnen a compartir la comida y festejar la fecha patria juntos.</p>
          <p>Lo que empezó como una iniciativa pequeña se convirtió en uno de los eventos más esperados del año: una excusa para juntarnos, para que los chicos vean a sus voluntarios también en un contexto festivo, y para fortalecer el vínculo con cada barrio.</p>
        </div>
        <div class="modal-video-col">
          <div class="video-wrapper video-vertical">
            <video controls playsinline preload="metadata"
                   aria-label="Video del Locro del 9 de Julio">
              <source src="videos/locro-9-de-julio.mp4#t=0.1" type="video/mp4">
            </video>
          </div>
        </div>
      </div>
    </div>
```

- [ ] **Step 3: Modal Día del Niño (`#modal-dia-del-nino`)**

Reemplazar todo el contenido de `<div class="modal-body">` por:
```html
    <div class="modal-body">
      <div class="modal-evento-layout">
        <div class="modal-desc">
          <p>El Día del Niño es uno de los momentos más esperados del año en cada taller. Los voluntarios preparan actividades y juegos especiales para el festejo.</p>
          <p>El contexto es el de siempre, los chicos de siempre, pero con una energía distinta. Es un día en el que todo el esfuerzo del año vale la pena de un vistazo.</p>
        </div>
        <div class="modal-video-col">
          <div class="video-wrapper video-vertical">
            <video controls playsinline preload="metadata"
                   aria-label="Video del Día del Niño">
              <source src="videos/un-dia-para-recordar.mp4#t=0.1" type="video/mp4">
            </video>
          </div>
        </div>
      </div>
    </div>
```

- [ ] **Step 4: Modal Salida de cada CAE (`#modal-salida-cae`)**

Reemplazar todo el contenido de `<div class="modal-body">` por:
```html
    <div class="modal-body">
      <div class="modal-evento-layout">
        <div class="modal-desc">
          <p>Más allá de los talleres semanales, cada CAE organiza al menos una salida anual para sus chicos. Estas salidas son una oportunidad para que los niños y adolescentes vivan experiencias fuera del barrio: ir al parque, visitar un museo, conocer lugares de la ciudad que quizás nunca habían visto.</p>
          <p>Para muchos chicos, es la primera vez que salen de su barrio para hacer algo recreativo. Esa mirada de asombro es difícil de olvidar.</p>
        </div>
        <div class="modal-video-col">
          <div class="video-wrapper video-vertical">
            <video controls playsinline preload="metadata"
                   aria-label="Video de salida de cada CAE">
              <source src="videos/salida-cae-granja.mp4#t=0.1" type="video/mp4">
            </video>
          </div>
        </div>
      </div>
    </div>
```

---

### Task 4: Agregar CSS para .modal-evento-layout

**Files:**
- Modify: `css/styles.css` (agregar después de la sección `.modal-fotos`)

- [ ] **Step 1: Agregar las clases nuevas**

Insertar después de la línea `.modal-fotos img:hover { ... }` (aprox. línea 769):

```css
/* Modal: layout texto-izquierda / video-derecha (mismo patrón que .quienes-layout) */
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

---

### Task 5: git log sobre evento_media (solo lectura)

**Files:** ninguno — solo lectura de git history

- [ ] **Step 1: Ejecutar git log**

```bash
git log --all -S"evento_media" --oneline
```

Reportar output completo al usuario. Sin tocar nada.

---

### Task 6: Commit y push

**Files:**
- Modified: `index.html`, `css/styles.css`, `.gitignore`
- Created: `_originales/salida-cae-granja.mp4` (no commiteado por .gitignore)
- Modified: `videos/salida-cae-granja.mp4` (comprimido)

- [ ] **Step 1: Verificar estado git**

```bash
git status
git diff --stat
```

Confirmar que solo están los archivos esperados. Si aparece algo inesperado → PARAR.

- [ ] **Step 2: Commit**

```bash
git add index.html css/styles.css .gitignore videos/salida-cae-granja.mp4
git commit -m "feat: modales con texto+video vertical, sin fotos

- 4 modales: texto izq, video vertical der (patrón quienes-somos)
- CSS: .modal-evento-layout con responsive mobile/desktop
- #t=0.1 en cada source para portada sin poster
- salida-cae-granja.mp4 comprimido de 18.92MB a <8MB (H.264 CRF28)
- _originales/ en .gitignore

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

- [ ] **Step 3: Push a la rama actual**

```bash
git push origin claude/crecer-felices-nuevo-diseno
```

Reportar la URL de preview generada por Vercel.

---

### Task 7: Pruebas con Playwright

**Setup:** Servidor local en puerto 3000 con `npx serve . -l 3000`

**Viewports:** 1440×900 (desktop), 390×844 (mobile/iPhone 14 Pro)

Para cada uno de los 4 modales (`bienvenida`, `locro`, `dia-del-nino`, `salida-cae`):

- [ ] **Subtarea A — Desktop (1440×900)**

1. Navegar a `http://localhost:3000`
2. Scroll hasta la sección de eventos
3. Clic en la tarjeta del evento → el modal se abre
4. Screenshot completo del modal abierto
5. Verificar: div `.modal-evento-layout` existe con 2 hijos (`.modal-desc` + `.modal-video-col`)
6. Verificar: no existe ningún `<img>` dentro del modal-body
7. Verificar: existe exactamente un `<video>` con el src correcto (sin 404)
8. Clic en play → verificar que el video carga y reproduce (sin error en consola)
9. Clic en X → verificar que el modal se cierra y el video se pausa

- [ ] **Subtarea B — Cierre con Esc y fondo (desktop)**

10. Abrir el modal de nuevo → presionar Escape → verificar cierre y pausa
11. Abrir el modal de nuevo → clic en el fondo oscuro (`.modal-overlay`) → verificar cierre y pausa

- [ ] **Subtarea C — Mobile (390×844)**

12. Cambiar viewport a 390×844
13. Abrir el modal → screenshot
14. Verificar: layout es columna (texto arriba, video abajo)
15. Verificar: video tiene max-width ≤ 300px y no desborda la pantalla

- [ ] **Subtarea D — Consola y 404**

16. Leer consola: ningún error JavaScript
17. Leer network: ningún video devuelve 404

- [ ] **Step final: Guardar evidencia**

Archivar todas las capturas. Reportar:
- Peso final de `videos/salida-cae-granja.mp4`
- Audio de bienvenida-voluntarios.mp4 y salida-cae-granja.mp4
- Resultado del git log sobre evento_media
- URL del preview
- 8 capturas (4 modales × desktop + mobile)
