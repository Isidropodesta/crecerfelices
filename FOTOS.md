# Guía de fotos – Proyecto Crecer Felices

Este archivo te indica qué foto va en cada lugar del sitio y dónde agregarla en el código.
Todas las fotos van en la carpeta `/images/`. Los nombres de archivo son los que figuran acá.

---

## HERO

| ID        | Nombre de archivo      | Descripción                                       | Dónde cambiarla |
|-----------|------------------------|--------------------------------------------------|-----------------|
| FOTO_01   | `hero-fondo.jpg`       | Foto grupal o de actividad emotiva con niños (horizontal, preferentemente horizontal o cuadrada grande). Es el fondo principal del sitio, muy importante. Debe quedar bien con un overlay oscuro encima. | En `css/styles.css`, buscar `.hero-placeholder-img` y agregar `background-image: url('../images/hero-fondo.jpg')`. También eliminar el fondo degradado y descomentar las líneas de `background-size: cover` y `background-position: center`. |

---

## QUIÉNES SOMOS

| ID        | Nombre de archivo      | Descripción                                       | Dónde cambiarla |
|-----------|------------------------|--------------------------------------------------|-----------------|
| FOTO_02   | `equipo-voluntarios.jpg` | Foto del equipo de voluntarios reunidos, sonriendo. Formato cuadrado o 4:3. | En `index.html`, sección `#quienes-somos`, buscar el comentario `FOTO_02_EQUIPO` y reemplazar el `.placeholder-img` por `<img src="../images/equipo-voluntarios.jpg" alt="Equipo de voluntarios de Proyecto Crecer Felices" loading="lazy">` |

---

## TALLERES (CAEs)

| ID        | Nombre de archivo        | Descripción                                           | Taller                  |
|-----------|--------------------------|-------------------------------------------------------|-------------------------|
| FOTO_T01  | `taller-mi-solcito.jpg`  | Foto de actividad en Mi Solcito (Barrio Tres Estrellas, Godoy Cruz)     | Mi Solcito              |
| FOTO_T02  | `taller-picardias.jpg`   | Foto de actividad en Picardías (Barrio Dolores Prats, Godoy Cruz)       | Picardías               |
| FOTO_T03  | `taller-rinconcito.jpg`  | Foto de actividad en Rinconcito de Luz (Perdriel, Luján de Cuyo)        | Rinconcito de Luz       |
| FOTO_T04  | `taller-multicolores.jpg`| Foto de actividad en Multicolores (Barrio Sarmiento, Godoy Cruz)        | Multicolores            |
| FOTO_T05  | `taller-mundo.jpg`       | Foto de actividad en Mundo Explorador (Barrio Sol y Sierra, Godoy Cruz) | Mundo Explorador        |
| FOTO_T06  | `taller-mi-angelito.jpg` | Foto de actividad en Mi Angelito (Barrio ATSA, Godoy Cruz)              | Mi Angelito             |
| FOTO_T07  | `taller-multicolores-v.jpg`| Foto de Multicolores viernes (mismo barrio que T04, puede ser misma) | Multicolores (viernes)  |
| FOTO_T08  | `taller-rinconcito-v.jpg`| Foto de Rinconcito de Luz viernes (puede ser misma que T03)             | Rinconcito de Luz (vie) |

**Cómo reemplazar en el código:**
En cada tarjeta de taller en `index.html`, buscar el comentario `<!-- FOTO: actividad en [nombre]. Ver FOTOS.md - FOTO_T0X -->` y reemplazar el `<div class="taller-img placeholder-img small">` por:
```html
<img src="images/taller-NOMBRE.jpg" alt="Actividad en [nombre del taller]" loading="lazy" class="taller-img">
```

---

## EVENTOS

### Con los niños

| ID        | Nombre de archivo         | Descripción                                    |
|-----------|---------------------------|------------------------------------------------|
| FOTO_E01  | `evento-dia-nino-1.jpg`   | Foto del Día del Niño (festejo, torta, globos) |
| FOTO_E02  | `evento-dia-nino-2.jpg`   | Segunda foto del Día del Niño                  |
| FOTO_E03  | `evento-dia-nino-3.jpg`   | Tercera foto opcional                          |
| FOTO_E04  | `evento-bomberos.jpg`     | Foto de visita de bomberos                     |
| FOTO_E05  | `evento-arqueologos.jpg`  | Foto de visita de arqueólogos                  |
| FOTO_E06  | `evento-visita-especial.jpg` | Foto de otra visita especial               |
| FOTO_E07  | `evento-cierre-ninos-1.jpg` | Foto del cierre de año con los chicos       |
| FOTO_E08  | `evento-cierre-ninos-2.jpg` | Segunda foto del cierre                     |
| FOTO_E09  | `evento-diplomas.jpg`     | Foto de entrega de diplomas                    |

### Comunidad y voluntarios

| ID        | Nombre de archivo          | Descripción                                   |
|-----------|----------------------------|-----------------------------------------------|
| FOTO_E10  | `evento-locro-1.jpg`       | Foto del Locro del 9 de Julio                 |
| FOTO_E11  | `evento-locro-2.jpg`       | Segunda foto del locro                        |
| FOTO_E12  | `evento-comunidad.jpg`     | Foto de la comunidad reunida                  |
| FOTO_E13  | `evento-fin-ano-vol-1.jpg` | Foto del evento de fin de año de voluntarios  |
| FOTO_E14  | `evento-fin-ano-vol-2.jpg` | Segunda foto                                  |
| FOTO_E15  | `evento-brindis.jpg`       | Foto del brindis / celebración                |
| FOTO_E16  | `evento-bienvenida-1.jpg`  | Foto de bienvenida a nuevos voluntarios       |
| FOTO_E17  | `evento-bienvenida-2.jpg`  | Segunda foto de bienvenida                    |
| FOTO_E18  | `evento-grupo-nuevo.jpg`   | Foto grupal de los nuevos ingresantes         |

**Cómo reemplazar en el código:**
En cada `<div class="polaroid">` que tenga un `placeholder-img`, reemplazar el `<div class="placeholder-img" ...>` por:
```html
<img src="images/evento-NOMBRE.jpg" alt="Descripción de la foto" loading="lazy">
```

---

## HISTORIAS / TESTIMONIOS

| ID        | Nombre de archivo        | Descripción                                          |
|-----------|--------------------------|------------------------------------------------------|
| FOTO_H01  | `testimonio-maria.jpg`   | Foto de la voluntaria (retrato, formato cuadrado)    |
| FOTO_H02  | `testimonio-lorena.jpg`  | Foto de la mamá de participante                      |
| FOTO_H03  | `testimonio-lucas.jpg`   | Foto del coordinador de talleres                     |

**Nota:** Los nombres en los testimonios son de ejemplo. Reemplazar nombres, textos y fotos con testimonios reales.

**Cómo reemplazar en el código:**
En cada `.historia-card`, buscar `<div class="historia-foto placeholder-img round">` y reemplazar por:
```html
<img src="images/testimonio-NOMBRE.jpg" alt="Foto de [nombre]" class="historia-foto round-img" loading="lazy">
```
Y en `css/styles.css`, agregar:
```css
.round-img { width: 80px; height: 80px; border-radius: 50%; object-fit: cover; flex-shrink: 0; }
```

---

## ALIANZAS / LOGOS

| ID        | Nombre de archivo     | Descripción                                         |
|-----------|-----------------------|-----------------------------------------------------|
| LOGO_A01  | `aliado-1.png`        | Logo del aliado/patrocinador 1 (fondo blanco o transparente, PNG) |
| LOGO_A02  | `aliado-2.png`        | Logo del aliado 2                                   |
| LOGO_A03  | `aliado-3.png`        | Logo del aliado 3                                   |
| LOGO_A04  | `aliado-4.png`        | Logo del aliado 4                                   |
| LOGO_A05  | `aliado-5.png`        | Logo del aliado 5                                   |
| LOGO_A06  | `aliado-6.png`        | Logo del aliado 6 (opcional)                        |

**Cómo reemplazar en el código:**
En la sección `#alianzas`, reemplazar cada `<div class="placeholder-logo">Logo Aliado X</div>` por:
```html
<img src="images/aliado-X.png" alt="Logo de [nombre del aliado]" loading="lazy" style="max-height: 60px; object-fit: contain;">
```

---

## NOVEDADES / BLOG

| ID        | Nombre de archivo      | Descripción                                        |
|-----------|------------------------|----------------------------------------------------|
| FOTO_N01  | `novedad-agosto.jpg`   | Foto para la novedad del Mes de la Amistad         |
| FOTO_N02  | `novedad-julio.jpg`    | Foto para la novedad del Mes del Conocimiento      |
| FOTO_N03  | `novedad-junio.jpg`    | Foto para la novedad del Mes de la Ternura         |

**Nota:** Estas fotos son ejemplos. Cuando agregues nuevas novedades, seguí la misma estructura de tarjeta.

---

## RECOMENDACIONES GENERALES

- **Formato:** JPG para fotos, PNG para logos con fondo transparente
- **Tamaño máximo:** 800KB por foto (optimizá antes de subir con squoosh.app o similar)
- **Dimensiones recomendadas:**
  - Hero: 1920×1080px mínimo
  - Fotos de talleres y eventos: 800×600px o 1200×900px
  - Fotos redondas (testimonios): 300×300px mínimo
  - Logos de aliados: cualquier tamaño, formato horizontal
- **Nombrado:** usá los nombres exactos de este archivo para que todo encaje
- **Carpeta:** todas las fotos van en `/images/` (en la raíz del proyecto)
