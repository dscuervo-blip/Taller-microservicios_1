/**
 * Funciones para responder SIEMPRE con el mismo formato JSON.
 *
 * Respuesta exitosa:
 *   { "ok": true, "mensaje": "...", "datos": { ... } }
 *
 * Respuesta con error:
 *   { "ok": false, "error": { "codigo": "VALIDACION", "mensaje": "...", "detalles": { ... } } }
 *
 * Usar un formato único permite que el frontend (y los microservicios de la
 * Parte 2) procesen las respuestas de cualquier servicio de la misma manera.
 */
const AppError = require('../errors/AppError');

function enviarJson(res, status, cuerpo) {
  if (res.headersSent) return;
  const texto = JSON.stringify(cuerpo);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(texto),
  });
  res.end(texto);
}

function enviarExito(res, datos, { status = 200, mensaje } = {}) {
  const cuerpo = { ok: true };
  if (mensaje) cuerpo.mensaje = mensaje;
  cuerpo.datos = datos;
  enviarJson(res, status, cuerpo);
}

function enviarError(res, error) {
  if (error instanceof AppError) {
    const cuerpo = { ok: false, error: { codigo: error.codigo, mensaje: error.message } };
    if (error.detalles) cuerpo.error.detalles = error.detalles;
    enviarJson(res, error.status, cuerpo);
    return;
  }

  // Error inesperado: se registra en consola pero no se exponen detalles internos.
  console.error('[error interno]', error);
  enviarJson(res, 500, {
    ok: false,
    error: { codigo: 'ERROR_INTERNO', mensaje: 'Ocurrió un error interno en el servicio.' },
  });
}

module.exports = { enviarJson, enviarExito, enviarError };
