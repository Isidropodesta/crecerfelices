/**
 * PROYECTO CRECER FELICES
 * Google Apps Script – Web App para recibir datos de formularios
 *
 * INSTRUCCIONES COMPLETAS en README.md
 *
 * Este script se pega en el editor de Google Apps Script (script.google.com),
 * se despliega como Web App, y su URL se pone en js/main.js
 *
 * Recibe dos tipos de formularios:
 *   - formulario=voluntarios  → escribe en la hoja "Voluntarios"
 *   - formulario=contacto     → escribe en la hoja "Contacto"
 */

// =====================================================================
// CONFIGURACIÓN: reemplazá con el ID de tu Google Sheet
// Lo encontrás en la URL: docs.google.com/spreadsheets/d/ESTE_ID/edit
// =====================================================================
const SHEET_ID = 'REEMPLAZAR_CON_TU_SHEET_ID';


/**
 * Función principal que recibe los POST del sitio web.
 * Google Apps Script la llama automáticamente cuando llega un POST.
 */
function doPost(e) {
  try {
    const params = e.parameter;
    const tipo   = params.formulario || 'contacto';

    const ss    = SpreadsheetApp.openById(SHEET_ID);
    let sheet   = ss.getSheetByName(tipo === 'voluntarios' ? 'Voluntarios' : 'Contacto');

    // Crear la hoja si no existe
    if (!sheet) {
      sheet = ss.insertSheet(tipo === 'voluntarios' ? 'Voluntarios' : 'Contacto');
      agregarEncabezados(sheet, tipo);
    }

    // Agrega la fila con los datos
    const fila = construirFila(params, tipo);
    sheet.appendRow(fila);

    return ContentService
      .createTextOutput(JSON.stringify({ resultado: 'ok' }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ resultado: 'error', mensaje: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}


/**
 * Responde a solicitudes GET (útil para probar que el endpoint funciona).
 */
function doGet() {
  return ContentService
    .createTextOutput('Proyecto Crecer Felices – Web App activa ✓')
    .setMimeType(ContentService.MimeType.TEXT);
}


/**
 * Construye la fila a guardar según el tipo de formulario.
 */
function construirFila(params, tipo) {
  const ahora = new Date().toLocaleString('es-AR', { timeZone: 'America/Argentina/Mendoza' });

  if (tipo === 'voluntarios') {
    return [
      ahora,
      params.nombre        || '',
      params.edad          || '',
      params.telefono      || '',
      params.email         || '',
      params.disponibilidad|| '',
      params.mensaje       || ''
    ];
  }

  // Contacto (default)
  return [
    ahora,
    params.nombre  || '',
    params.email   || '',
    params.asunto  || '',
    params.mensaje || ''
  ];
}


/**
 * Agrega encabezados a una hoja nueva.
 */
function agregarEncabezados(sheet, tipo) {
  if (tipo === 'voluntarios') {
    sheet.appendRow(['Fecha y hora', 'Nombre', 'Edad', 'Teléfono', 'Email', 'Disponibilidad', 'Mensaje']);
  } else {
    sheet.appendRow(['Fecha y hora', 'Nombre', 'Email', 'Asunto', 'Mensaje']);
  }

  // Formato de encabezados
  const range = sheet.getRange(1, 1, 1, sheet.getLastColumn());
  range.setFontWeight('bold');
  range.setBackground('#D6006E');
  range.setFontColor('#FFFFFF');
}
