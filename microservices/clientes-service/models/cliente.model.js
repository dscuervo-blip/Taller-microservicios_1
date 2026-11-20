/**
 * Modelo de Cliente
 * Define cómo se limpian y validan los datos de un cliente.
 */
const {
  limpiarTexto,
  validarTexto,
  validarPatron,
  recolectarErrores,
} = require('../../shared/utils/validacion');

const CAMPOS_ORDEN = Object.freeze(['id', 'nombreCompleto', 'identificacion', 'correo', 'fechaCreacion']);

// Cédula, cédula de extranjería o pasaporte: letras/números, 5 a 15 caracteres.
const PATRON_IDENTIFICACION = /^[A-Z0-9]{5,15}$/;
// Teléfono: 7 a 15 dígitos, opcionalmente con + al inicio.
const PATRON_TELEFONO = /^\+?\d{7,15}$/;
const PATRON_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
// Licencia de conducción: letras, números y guiones, 5 a 20 caracteres.
const PATRON_LICENCIA = /^[A-Z0-9-]{5,20}$/;

/** Mayúsculas y sin espacios, puntos ni guiones (p. ej. "1.020.345" -> "1020345"). */
function normalizarIdentificacion(valor) {
  return limpiarTexto(valor).toUpperCase().replace(/[\s.-]/g, '');
}

function normalizarTelefono(valor) {
  return limpiarTexto(valor).replace(/[\s()-]/g, '');
}

function normalizarLicencia(valor) {
  return limpiarTexto(valor).toUpperCase().replace(/\s+/g, '');
}

function normalizarCliente(datos) {
  return {
    nombreCompleto: limpiarTexto(datos.nombreCompleto),
    identificacion: normalizarIdentificacion(datos.identificacion),
    telefono: normalizarTelefono(datos.telefono),
    correo: limpiarTexto(datos.correo).toLowerCase(),
    licencia: normalizarLicencia(datos.licencia),
  };
}

function validarCliente(cliente) {
  return recolectarErrores({
    nombreCompleto: validarTexto(cliente.nombreCompleto, { etiqueta: 'El nombre completo', min: 3, max: 80 })
      || (/\d/.test(cliente.nombreCompleto) ? 'El nombre completo no debe contener números.' : null),
    identificacion: validarPatron(cliente.identificacion, {
      etiqueta: 'El número de identificación',
      patron: PATRON_IDENTIFICACION,
      mensaje: 'La identificación debe tener entre 5 y 15 letras o números.',
    }),
    telefono: validarPatron(cliente.telefono, {
      etiqueta: 'El teléfono',
      patron: PATRON_TELEFONO,
      mensaje: 'El teléfono debe tener entre 7 y 15 dígitos.',
    }),
    correo: validarPatron(cliente.correo, {
      etiqueta: 'El correo electrónico',
      patron: PATRON_CORREO,
      mensaje: 'El correo electrónico no tiene un formato válido.',
    }),
    licencia: validarPatron(cliente.licencia, {
      etiqueta: 'El número de licencia',
      patron: PATRON_LICENCIA,
      mensaje: 'La licencia debe tener entre 5 y 20 letras, números o guiones.',
    }),
  });
}

module.exports = {
  CAMPOS_ORDEN,
  normalizarIdentificacion,
  normalizarCliente,
  validarCliente,
};
