/**
 * Servicio de vehículos (lógica de negocio).
 * No sabe nada de HTTP: recibe datos, aplica las reglas y usa el repositorio.
 * Si algo no cumple una regla, lanza un AppError que el controlador convierte
 * en una respuesta JSON con el código HTTP adecuado.
 */
const AppError = require('../../shared/errors/AppError');
const { ordenarPor, agruparPor, contarPor } = require('../../shared/utils/listas');
const { limpiarTexto, normalizarComparacion } = require('../../shared/utils/validacion');
const {
  ESTADOS,
  LISTA_ESTADOS,
  CATEGORIAS,
  CAMPOS_CLASIFICACION,
  CAMPOS_ORDEN,
  ANIO_MINIMO,
  anioMaximo,
  normalizarVehiculo,
  validarVehiculo,
} = require('../models/vehiculo.model');

class VehiculosService {
  constructor(repositorio) {
    this.repositorio = repositorio;
  }

  /** Valores permitidos, para que los formularios no los escriban "a mano". */
  obtenerCatalogos() {
    return {
      estados: LISTA_ESTADOS,
      categorias: CATEGORIAS,
      camposClasificacion: CAMPOS_CLASIFICACION,
      anioMinimo: ANIO_MINIMO,
      anioMaximo: anioMaximo(),
    };
  }

  /**
   * Lista los vehículos aplicando filtros opcionales y orden.
   * @param {object} filtros  marca, modelo, anio, categoria, estado, buscar, ordenarPor, orden
   */
  async listar(filtros = {}) {
    let vehiculos = await this.repositorio.listar();

    // Filtros exactos (sin importar mayúsculas ni tildes).
    ['marca', 'modelo', 'categoria', 'estado'].forEach((campo) => {
      if (limpiarTexto(filtros[campo]) !== '') {
        const buscado = normalizarComparacion(filtros[campo]);
        vehiculos = vehiculos.filter((v) => normalizarComparacion(v[campo]) === buscado);
      }
    });

    if (limpiarTexto(filtros.anio) !== '') {
      const anio = Number(filtros.anio);
      if (!Number.isInteger(anio)) throw AppError.peticionInvalida('El filtro "anio" debe ser un número entero.');
      vehiculos = vehiculos.filter((v) => v.anio === anio);
    }

    // Búsqueda libre en varios campos.
    if (limpiarTexto(filtros.buscar) !== '') {
      const texto = normalizarComparacion(filtros.buscar);
      vehiculos = vehiculos.filter((v) =>
        [v.id, v.placa, v.marca, v.modelo, v.categoria, v.descripcion, v.anio]
          .some((valor) => normalizarComparacion(valor).includes(texto)));
    }

    const campoOrden = limpiarTexto(filtros.ordenarPor) || 'id';
    if (!CAMPOS_ORDEN.includes(campoOrden)) {
      throw AppError.peticionInvalida(`No se puede ordenar por "${campoOrden}". Use: ${CAMPOS_ORDEN.join(', ')}.`);
    }
    const orden = filtros.orden === 'desc' ? 'desc' : 'asc';
    return ordenarPor(vehiculos, campoOrden, orden);
  }

  async obtenerPorId(id) {
    const vehiculo = await this.repositorio.buscarPorId(id);
    if (!vehiculo) throw AppError.noEncontrado(`No existe un vehículo con ID ${id}.`);
    return vehiculo;
  }

  /** Estado actual del vehículo. Lo usarán reservas y alquileres (Parte 2). */
  async obtenerEstado(id) {
    const vehiculo = await this.obtenerPorId(id);
    return {
      id: vehiculo.id,
      placa: vehiculo.placa,
      estado: vehiculo.estado,
      disponible: vehiculo.estado === ESTADOS.DISPONIBLE,
    };
  }

  async crear(datos) {
    const vehiculo = normalizarVehiculo(datos);
    this._validar(vehiculo);
    await this._verificarPlacaUnica(vehiculo.placa);
    return this.repositorio.crear(vehiculo);
  }

  /** Actualización completa (PUT). Los campos que no se envían conservan su valor. */
  async actualizar(id, datos) {
    const actual = await this.obtenerPorId(id);
    const vehiculo = normalizarVehiculo({ ...actual, ...datos });
    this._validar(vehiculo);
    await this._verificarPlacaUnica(vehiculo.placa, id);
    return this.repositorio.actualizar(id, vehiculo);
  }

  /** Cambia solo el estado (PATCH). Punto de integración para alquileres. */
  async cambiarEstado(id, estado) {
    await this.obtenerPorId(id);
    const nuevoEstado = limpiarTexto(estado);
    if (!LISTA_ESTADOS.includes(nuevoEstado)) {
      throw AppError.validacion({ estado: `El estado debe ser uno de: ${LISTA_ESTADOS.join(', ')}.` });
    }
    return this.repositorio.actualizar(id, { estado: nuevoEstado });
  }

  async eliminar(id) {
    const vehiculo = await this.obtenerPorId(id);
    if (vehiculo.estado === ESTADOS.ALQUILADO) {
      throw AppError.conflicto('No se puede eliminar un vehículo que está alquilado. Registre primero su devolución.');
    }
    return this.repositorio.eliminar(id);
  }

  /** Totales para el dashboard y para el futuro servicio de reportes. */
  async obtenerResumen() {
    const vehiculos = await this.repositorio.listar();
    return {
      total: vehiculos.length,
      porEstado: contarPor(vehiculos, 'estado', LISTA_ESTADOS),
      porCategoria: contarPor(vehiculos, 'categoria'),
      porMarca: contarPor(vehiculos, 'marca'),
    };
  }

  /** Agrupa los vehículos por marca, modelo, año, categoría o estado. */
  async clasificar(campo) {
    if (!CAMPOS_CLASIFICACION.includes(campo)) {
      throw AppError.peticionInvalida(`Solo se puede clasificar por: ${CAMPOS_CLASIFICACION.join(', ')}.`);
    }
    const vehiculos = await this.repositorio.listar();
    const grupos = agruparPor(vehiculos, campo).map((g) => ({
      valor: g.valor,
      cantidad: g.cantidad,
      vehiculos: ordenarPor(g.registros, 'placa'),
    }));
    return { criterio: campo, grupos };
  }

  // ---------------------------------------------------------------- privados

  _validar(vehiculo) {
    const errores = validarVehiculo(vehiculo);
    if (errores) throw AppError.validacion(errores);
  }

  async _verificarPlacaUnica(placa, idExcluido) {
    const existente = await this.repositorio.buscarUno((v) => v.placa === placa && v.id !== idExcluido);
    if (existente) {
      throw AppError.conflicto(`Ya existe un vehículo con la placa ${placa}.`, {
        placa: `La placa ${placa} ya está registrada (${existente.id}).`,
      });
    }
  }
}

module.exports = VehiculosService;
