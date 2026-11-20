/**
 * Funciones de validación reutilizables por todos los microservicios.
 *
 * Cada validador recibe el valor y devuelve un mensaje de error (string) o
 * null si el valor es correcto. Así se pueden combinar fácilmente:
 *
 *   const errores = recolectarErrores({
 *     marca: validarTexto(datos.marca, { etiqueta: 'La marca', max: 40 }),
 *   });
 */

/** Quita espacios sobrantes de un texto; si no es texto devuelve ''. */
function limpiarTexto(valor) {
  if (valor === undefined || valor === null) return '';
  return String(valor).trim().replace(/\s+/g, ' ');
}

function validarTexto(valor, { etiqueta, min = 1, max = 100, requerido = true } = {}) {
  const texto = limpiarTexto(valor);
  if (texto === '') return requerido ? `${etiqueta} es obligatorio.` : null;
  if (texto.length < min) return `${etiqueta} debe tener al menos ${min} caracteres.`;
  if (texto.length > max) return `${etiqueta} no puede superar ${max} caracteres.`;
  return null;
}

function validarPatron(valor, { etiqueta, patron, mensaje }) {
  const texto = limpiarTexto(valor);
  if (texto === '') return `${etiqueta} es obligatorio.`;
  if (!patron.test(texto)) return mensaje;
  return null;
}

function validarEntero(valor, { etiqueta, min, max }) {
  if (valor === undefined || valor === null || String(valor).trim() === '') {
    return `${etiqueta} es obligatorio.`;
  }
  const numero = Number(valor);
  if (!Number.isInteger(numero)) return `${etiqueta} debe ser un número entero.`;
  if (min !== undefined && numero < min) return `${etiqueta} no puede ser menor que ${min}.`;
  if (max !== undefined && numero > max) return `${etiqueta} no puede ser mayor que ${max}.`;
  return null;
}

function validarOpcion(valor, { etiqueta, opciones }) {
  const texto = limpiarTexto(valor);
  if (texto === '') return `${etiqueta} es obligatorio.`;
  if (!opciones.includes(texto)) return `${etiqueta} debe ser uno de: ${opciones.join(', ')}.`;
  return null;
}

/** Convierte { campo: mensaje|null } en un objeto solo con los campos con error. */
function recolectarErrores(resultados) {
  const errores = {};
  Object.entries(resultados).forEach(([campo, mensaje]) => {
    if (mensaje) errores[campo] = mensaje;
  });
  return Object.keys(errores).length > 0 ? errores : null;
}

/** Compara textos sin importar mayúsculas, tildes ni espacios extremos. */
function normalizarComparacion(valor) {
  return limpiarTexto(valor)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

module.exports = {
  limpiarTexto,
  validarTexto,
  validarPatron,
  validarEntero,
  validarOpcion,
  recolectarErrores,
  normalizarComparacion,
};
