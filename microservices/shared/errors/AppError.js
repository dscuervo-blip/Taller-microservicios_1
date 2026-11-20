/**
 * AppError
 * Error controlado de la aplicación. Lleva el código HTTP que debe devolverse
 * al cliente, un código corto legible por máquinas y (opcionalmente) detalles,
 * por ejemplo los errores de validación por campo.
 *
 * Cualquier error que NO sea AppError se trata como error interno (500).
 */
class AppError extends Error {
  /**
   * @param {number} status   Código HTTP (400, 404, 409...).
   * @param {string} codigo   Código corto, p. ej. "VALIDACION" o "NO_ENCONTRADO".
   * @param {string} mensaje  Mensaje para mostrar al usuario.
   * @param {object} [detalles] Información adicional (p. ej. { placa: "Ya existe" }).
   */
  constructor(status, codigo, mensaje, detalles) {
    super(mensaje);
    this.name = 'AppError';
    this.status = status;
    this.codigo = codigo;
    this.detalles = detalles;
  }

  static validacion(detalles, mensaje = 'Los datos enviados no son válidos.') {
    return new AppError(400, 'VALIDACION', mensaje, detalles);
  }

  static peticionInvalida(mensaje) {
    return new AppError(400, 'PETICION_INVALIDA', mensaje);
  }

  static noEncontrado(mensaje = 'El recurso solicitado no existe.') {
    return new AppError(404, 'NO_ENCONTRADO', mensaje);
  }

  static metodoNoPermitido(mensaje = 'Método HTTP no permitido para esta ruta.') {
    return new AppError(405, 'METODO_NO_PERMITIDO', mensaje);
  }

  static conflicto(mensaje, detalles) {
    return new AppError(409, 'CONFLICTO', mensaje, detalles);
  }
}

module.exports = AppError;
