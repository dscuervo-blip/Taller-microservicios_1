/**
 * Ayudas para formularios, compartidas por vehículos y clientes:
 *  - Validación en el navegador usando los atributos HTML5 (required, min,
 *    max, pattern...) pero mostrando los mensajes bajo cada campo.
 *  - Mostrar los errores por campo que devuelve el microservicio.
 *  - Leer y cargar los valores del formulario.
 *
 * La validación del navegador es solo una ayuda: el microservicio vuelve a
 * validar todo, porque cualquier cliente podría saltarse el formulario.
 */

function contenedorError(campo) {
  return campo.closest('.campo')?.querySelector('.campo__error');
}

function mostrarErrorCampo(campo, mensaje) {
  campo.setAttribute('aria-invalid', 'true');
  const error = contenedorError(campo);
  if (error) error.textContent = mensaje;
}

function limpiarErrorCampo(campo) {
  campo.removeAttribute('aria-invalid');
  const error = contenedorError(campo);
  if (error) error.textContent = '';
}

export function limpiarErrores(formulario) {
  [...formulario.elements].forEach(limpiarErrorCampo);
}

/** Mensaje en español según la regla HTML5 que no se cumple. */
function mensajeValidacion(campo) {
  const { validity } = campo;
  const nombre = campo.dataset.etiqueta || 'Este campo';
  if (validity.valueMissing) return `${nombre} es obligatorio.`;
  if (validity.typeMismatch && campo.type === 'email') return 'Escriba un correo válido, por ejemplo nombre@correo.com.';
  if (validity.badInput) return `${nombre} debe ser un número.`;
  if (validity.rangeUnderflow) return `${nombre} no puede ser menor que ${campo.min}.`;
  if (validity.rangeOverflow) return `${nombre} no puede ser mayor que ${campo.max}.`;
  if (validity.tooShort) return `${nombre} debe tener al menos ${campo.minLength} caracteres.`;
  if (validity.tooLong) return `${nombre} no puede superar ${campo.maxLength} caracteres.`;
  if (validity.patternMismatch || validity.stepMismatch) return campo.dataset.mensajePatron || `${nombre} no tiene un formato válido.`;
  return campo.validationMessage;
}

/**
 * Valida el formulario. Devuelve true si todo es correcto; si no, muestra los
 * errores y pone el foco en el primer campo con problemas.
 */
export function validarFormulario(formulario) {
  limpiarErrores(formulario);
  let primerInvalido = null;

  [...formulario.elements].forEach((campo) => {
    if (!campo.willValidate) return;
    // Quita espacios al inicio y al final antes de validar.
    if (typeof campo.value === 'string' && campo.type !== 'number' && campo.tagName !== 'SELECT') {
      campo.value = campo.value.trim();
    }
    if (!campo.checkValidity()) {
      mostrarErrorCampo(campo, mensajeValidacion(campo));
      primerInvalido ??= campo;
    }
  });

  primerInvalido?.focus();
  return primerInvalido === null;
}

/** Muestra bajo cada campo los errores { campo: mensaje } del microservicio. */
export function mostrarErroresServidor(formulario, detalles) {
  if (!detalles) return;
  let primero = null;
  Object.entries(detalles).forEach(([nombre, mensaje]) => {
    const campo = formulario.elements.namedItem(nombre);
    if (campo) {
      mostrarErrorCampo(campo, mensaje);
      primero ??= campo;
    }
  });
  primero?.focus();
}

/** Convierte el formulario en un objeto { nombreCampo: valor }. */
export function leerFormulario(formulario) {
  return Object.fromEntries(new FormData(formulario).entries());
}

/** Carga un objeto en los campos del formulario con el mismo nombre. */
export function cargarFormulario(formulario, datos) {
  Object.entries(datos).forEach(([nombre, valor]) => {
    const campo = formulario.elements.namedItem(nombre);
    if (campo && 'value' in campo) campo.value = valor ?? '';
  });
}

/** Quita el error de un campo en cuanto el usuario lo corrige. */
export function activarLimpiezaAlEscribir(formulario) {
  formulario.addEventListener('input', (evento) => {
    if (evento.target.getAttribute('aria-invalid') === 'true') limpiarErrorCampo(evento.target);
  });
}

/** Deshabilita el botón mientras se guarda, para evitar envíos dobles. */
export async function conBotonOcupado(boton, textoOcupado, accion) {
  const textoOriginal = boton.textContent;
  boton.disabled = true;
  boton.textContent = textoOcupado;
  try {
    return await accion();
  } finally {
    boton.disabled = false;
    boton.textContent = textoOriginal;
  }
}
