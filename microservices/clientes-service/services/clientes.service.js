/**
 * Servicio de clientes (lógica de negocio).
 * Reglas: datos completos y válidos; identificación, correo y licencia únicos.
 */
const AppError = require('../../shared/errors/AppError');
const { ordenarPor } = require('../../shared/utils/listas');
const { limpiarTexto, normalizarComparacion } = require('../../shared/utils/validacion');
const {
  CAMPOS_ORDEN,
  normalizarIdentificacion,
  normalizarCliente,
  validarCliente,
} = require('../models/cliente.model');

/** Campos que no se pueden repetir entre clientes, con su nombre legible. */
const CAMPOS_UNICOS = {
  identificacion: 'número de identificación',
  correo: 'correo electrónico',
  licencia: 'número de licencia',
};

class ClientesService {
  constructor(repositorio) {
    this.repositorio = repositorio;
  }

  /** @param {object} filtros  buscar, ordenarPor, orden */
  async listar(filtros = {}) {
    let clientes = await this.repositorio.listar();

    if (limpiarTexto(filtros.buscar) !== '') {
      const texto = normalizarComparacion(filtros.buscar);
      clientes = clientes.filter((c) =>
        [c.id, c.nombreCompleto, c.identificacion, c.telefono, c.correo, c.licencia]
          .some((valor) => normalizarComparacion(valor).includes(texto)));
    }

    const campoOrden = limpiarTexto(filtros.ordenarPor) || 'id';
    if (!CAMPOS_ORDEN.includes(campoOrden)) {
      throw AppError.peticionInvalida(`No se puede ordenar por "${campoOrden}". Use: ${CAMPOS_ORDEN.join(', ')}.`);
    }
    return ordenarPor(clientes, campoOrden, filtros.orden === 'desc' ? 'desc' : 'asc');
  }

  async obtenerPorId(id) {
    const cliente = await this.repositorio.buscarPorId(id);
    if (!cliente) throw AppError.noEncontrado(`No existe un cliente con ID ${id}.`);
    return cliente;
  }

  /** Busca por número de identificación (cédula, pasaporte...). */
  async obtenerPorIdentificacion(numero) {
    const identificacion = normalizarIdentificacion(numero);
    const cliente = await this.repositorio.buscarUno((c) => c.identificacion === identificacion);
    if (!cliente) throw AppError.noEncontrado(`No existe un cliente con identificación ${identificacion}.`);
    return cliente;
  }

  async crear(datos) {
    const cliente = normalizarCliente(datos);
    this._validar(cliente);
    await this._verificarUnicos(cliente);
    return this.repositorio.crear(cliente);
  }

  async actualizar(id, datos) {
    const actual = await this.obtenerPorId(id);
    const cliente = normalizarCliente({ ...actual, ...datos });
    this._validar(cliente);
    await this._verificarUnicos(cliente, id);
    return this.repositorio.actualizar(id, cliente);
  }

  async eliminar(id) {
    await this.obtenerPorId(id);
    return this.repositorio.eliminar(id);
  }

  async obtenerResumen() {
    const clientes = await this.repositorio.listar();
    return { total: clientes.length };
  }

  // ---------------------------------------------------------------- privados

  _validar(cliente) {
    const errores = validarCliente(cliente);
    if (errores) throw AppError.validacion(errores);
  }

  async _verificarUnicos(cliente, idExcluido) {
    const clientes = await this.repositorio.listar();
    const errores = {};

    Object.entries(CAMPOS_UNICOS).forEach(([campo, etiqueta]) => {
      const repetido = clientes.find((c) => c.id !== idExcluido && c[campo] === cliente[campo]);
      if (repetido) errores[campo] = `Ya existe un cliente con ese ${etiqueta} (${repetido.id}).`;
    });

    if (Object.keys(errores).length > 0) {
      throw AppError.conflicto('Ya existe un cliente registrado con algunos de esos datos.', errores);
    }
  }
}

module.exports = ClientesService;
