# Proyecto Crecer Felices – Sitio Web

Sitio web completo de Proyecto Crecer Felices, Asociación Civil sin fines de lucro de Mendoza.

## Estructura del proyecto

```
crecerfelices/
├── index.html                  → Página principal (todo el sitio en un archivo)
├── css/
│   └── styles.css              → Todos los estilos
├── js/
│   └── main.js                 → JavaScript (menú, animaciones, formularios, filtros)
├── assets/
│   └── google-apps-script.js  → Script para conectar formularios con Google Sheets
├── images/
│   └── (acá van todas las fotos reales – ver FOTOS.md)
└── FOTOS.md                   → Guía completa de qué foto va en cada lugar
```

---

## Publicación gratuita en Vercel

### Paso 1 – Crear cuenta en Vercel
Ir a [vercel.com](https://vercel.com), crear cuenta gratuita (podés entrar con GitHub/Google).

### Paso 2 – Subir el proyecto
**Opción A – Arrastrar y soltar (más fácil):**
1. Ir a [vercel.com/new](https://vercel.com/new)
2. Elegir "Browse..." o arrastrar la carpeta `crecerfelices` completa
3. Hacer clic en "Deploy"
4. En 2 minutos el sitio está en línea con una URL del tipo `proyecto-crecer-felices.vercel.app`

**Opción B – Desde GitHub (recomendado para actualizaciones):**
1. Subir la carpeta a un repositorio de GitHub
2. En Vercel, hacer clic en "Import Project" y conectar el repo
3. Cada vez que actualizás el repo, Vercel actualiza el sitio automáticamente

### Publicación gratuita en Netlify (alternativa)
1. Ir a [app.netlify.com](https://app.netlify.com) y crear cuenta
2. En "Sites", hacer clic en "Add new site" → "Deploy manually"
3. Arrastrar la carpeta del proyecto
4. Listo, el sitio queda en línea

---

## Conectar los formularios a Google Sheets

Los formularios de "Voluntarios" y "Contacto" envían datos a Google Sheets mediante un Google Apps Script. Seguí estos pasos exactos:

### Paso 1 – Crear el Google Sheet
1. Ir a [sheets.google.com](https://sheets.google.com) con la cuenta de Gmail de la organización
2. Crear una hoja de cálculo nueva
3. Ponerle nombre: "Proyecto Crecer Felices – Formularios"
4. Copiar el **ID del Sheet** desde la URL:
   - La URL es algo como: `https://docs.google.com/spreadsheets/d/1AbCdEf123456/edit`
   - El ID es la parte entre `/d/` y `/edit`: en este ejemplo, `1AbCdEf123456`

### Paso 2 – Crear el Apps Script
1. En el Google Sheet, ir a: **Extensiones → Apps Script**
2. Borrar todo el código que aparece por defecto
3. Abrir el archivo `assets/google-apps-script.js` de este proyecto
4. Copiar **todo** su contenido y pegarlo en el editor de Apps Script
5. En la línea `const SHEET_ID = 'REEMPLAZAR_CON_TU_SHEET_ID';`, reemplazar con el ID copiado en el Paso 1
6. Guardar el script con Ctrl+S (o el botón "Guardar")

### Paso 3 – Desplegar el script como Web App
1. En el editor de Apps Script, hacer clic en **"Implementar" → "Nueva implementación"**
2. En el tipo de implementación, elegir **"Aplicación web"**
3. Completar así:
   - **Descripción:** Formularios Crecer Felices
   - **Ejecutar como:** Yo (la cuenta de Gmail)
   - **Quién puede acceder:** Cualquier persona (Anyone)
4. Hacer clic en **"Implementar"**
5. Puede pedir que otorgues permisos – hacer clic en "Autorizar acceso" y aceptar
6. **Copiar el URL de la aplicación web** que aparece al final (es algo como `https://script.google.com/macros/s/AKfycb.../exec`)

### Paso 4 – Pegar la URL en el sitio
1. Abrir el archivo `js/main.js`
2. En la línea que dice:
   ```javascript
   const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/REEMPLAZAR_CON_TU_URL/exec';
   ```
3. Reemplazar `REEMPLAZAR_CON_TU_URL` con la URL copiada en el Paso 3
4. Guardar el archivo y volver a subir el sitio a Vercel/Netlify

### ¡Listo! Probar el formulario
- Completar el formulario de voluntarios en el sitio
- Ir al Google Sheet → debería aparecer una hoja "Voluntarios" con los datos enviados
- Lo mismo con el formulario de contacto → hoja "Contacto"

---

## Personalizar contenido editable

### Números de impacto
En `index.html`, buscar `data-target="150"` (y los otros números) para cambiar las estadísticas.
Los hay en dos lugares: en `.hero > .stats-bar` y en la sección `#impacto`.

### WhatsApp
Buscar `wa.me/5492614000000` en todo el proyecto y reemplazar con el número real.
Formato: `wa.me/549XXXXXXXXXX` (código de país 54, código de área 9, número).

### Email
Buscar `contacto@proyectocrecerfelices.org` y reemplazar con el email real.

### Porcentajes de transparencia
En la sección `#transparencia`, los `style="width: X%"` y los `aria-valuenow="X"` son los porcentajes del gráfico de barras. Cambiarlos según los datos reales.

### Testimonios
En la sección `#historias`, los textos de los testimonios son ejemplos. Reemplazarlos con testimonios reales junto con las fotos correspondientes (ver FOTOS.md).

### Novedades
Para agregar nuevas novedades, copiar la estructura de una `.novedad-card` en `index.html` y modificar los datos.

---

## Dominio personalizado (opcional, gratuito con Vercel)
1. Comprar un dominio (Ej: `proyectocrecerfelices.org.ar`) – puede ser en Nic.ar o en Namecheap
2. En el panel de Vercel, ir al proyecto → "Settings" → "Domains"
3. Agregar el dominio y seguir las instrucciones de DNS

---

## Soporte técnico
Si tienen dudas o problemas con el sitio, las secciones más comunes de modificar son:
- **Fotos:** seguir `FOTOS.md` paso a paso
- **Formularios:** seguir la sección "Conectar formularios" de este README
- **Textos:** buscar el texto a cambiar directamente en `index.html`
- **Colores:** los colores principales están como variables en las primeras líneas de `css/styles.css`
