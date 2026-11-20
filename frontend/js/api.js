/**
 * Cliente HTTP del frontend.
 * Es el ÚNICO archivo que hace fetch() a los microservicios. Las páginas usan
 * vehiculosApi y clientesApi y reciben directamente los datos (o un ApiError).
 */
import { SERVICIOS } from './config.js';

/** Error con la información que devuelve el microservicio. */
export class ApiError extends Error {
  constructor(mensaje, { status = 0, codigo = 'ERROR', detalles = null } = {}) {
    super(mensaje);
    this.name = 'ApiError';
    this.status = status;
    this.codigo = codigo;
    this.detalles = detalles;
  }
}

/** Convierte { a: 1, b: '' } en "?a=1" (omite valores vacíos). */
function construirQuery(parametros = {}) {
  const busqueda = new URLSearchParams();
  Object.entries(parametros).forEach(([clave, valor]) => {
    if (valor !== undefined && valor !== null && String(valor).trim() !== '') {
      busqueda.append(clave, valor);
    }
  });
  const texto = busqueda.toString();
  return texto ? `?${texto}` : '';
}

/**
 * Hace una petición a un microservicio y devuelve { datos, mensaje }.
 * Se exporta para que los módulos de la Parte 2 creen su propio cliente
 * (p. ej. reservasApi en js/reservas-api.js) sin modificar este archivo.
 * @param {string} servicio  Clave en SERVICIOS (vehiculos, clientes, reservas...).
 */
export async function solicitar(servicio, ruta, { metodo = 'GET', cuerpo, query } = {}) {
  const configuracion = SERVICIOS[servicio];
  const url = `${configuracion.url}${ruta}${construirQuery(query)}`;

  let respuesta;
  try {
    respuesta = await fetch(url, {
      method: metodo,
      headers: cuerpo ? { 'Content-Type': 'application/json' } : undefined,
      body: cuerpo ? JSON.stringify(cuerpo) : undefined,
    });
  } catch {
    throw new ApiError(
      `No se pudo conectar con el servicio de ${configuracion.nombre.toLowerCase()} (puerto ${configuracion.puerto}). Verifique que esté en ejecución.`,
      { codigo: 'SIN_CONEXION' },
    );
  }

  let json;
  try {
    json = await respuesta.json();
  } catch {
    throw new ApiError('El servicio respondió con un formato inesperado.', { status: respuesta.status });
  }

  if (!respuesta.ok || json.ok === false) {
    const error = json.error || {};
    throw new ApiError(error.mensaje || 'La operación no se pudo completar.', {
      status: respuesta.status,
      codigo: error.codigo,
      detalles: error.detalles,
    });
  }

  return { datos: json.datos, mensaje: json.mensaje };
}

/** Atajo: devuelve solo los datos. */
const obtener = async (...args) => (await solicitar(...args)).datos;
const id = (valor) => encodeURIComponent(valor);

export const vehiculosApi = {
  catalogos: () => obtener('vehiculos', '/vehiculos/catalogos'),
  listar: (filtros) => obtener('vehiculos', '/vehiculos', { query: filtros }),
  obtener: (idVehiculo) => obtener('vehiculos', `/vehiculos/${id(idVehiculo)}`),
  estado: (idVehiculo) => obtener('vehiculos', `/vehiculos/${id(idVehiculo)}/estado`),
  resumen: () => obtener('vehiculos', '/vehiculos/resumen'),
  clasificar: (campo) => obtener('vehiculos', `/vehiculos/clasificacion/${id(campo)}`),
  crear: (vehiculo) => solicitar('vehiculos', '/vehiculos', { metodo: 'POST', cuerpo: vehiculo }),
  actualizar: (idVehiculo, vehiculo) =>
    solicitar('vehiculos', `/vehiculos/${id(idVehiculo)}`, { metodo: 'PUT', cuerpo: vehiculo }),
  cambiarEstado: (idVehiculo, estado) =>
    solicitar('vehiculos', `/vehiculos/${id(idVehiculo)}/estado`, { metodo: 'PATCH', cuerpo: { estado } }),
  eliminar: (idVehiculo) => solicitar('vehiculos', `/vehiculos/${id(idVehiculo)}`, { metodo: 'DELETE' }),
};

export const clientesApi = {
  listar: (filtros) => obtener('clientes', '/clientes', { query: filtros }),
  obtener: (idCliente) => obtener('clientes', `/clientes/${id(idCliente)}`),
  buscarPorIdentificacion: (numero) => obtener('clientes', `/clientes/identificacion/${id(numero)}`),
  resumen: () => obtener('clientes', '/clientes/resumen'),
  crear: (cliente) => solicitar('clientes', '/clientes', { metodo: 'POST', cuerpo: cliente }),
  actualizar: (idCliente, cliente) =>
    solicitar('clientes', `/clientes/${id(idCliente)}`, { metodo: 'PUT', cuerpo: cliente }),
  eliminar: (idCliente) => solicitar('clientes', `/clientes/${id(idCliente)}`, { metodo: 'DELETE' }),
};

/**
 * Comprueba si un microservicio responde en GET /salud.
 * @returns {Promise<'activo'|'caido'|'pendiente'>}
 */
export async function verificarServicio(clave) {
  const servicio = SERVICIOS[clave];
  if (!servicio.implementado) return 'pendiente';
  try {
    const controlador = new AbortController();
    const temporizador = setTimeout(() => controlador.abort(), 3000);
    const respuesta = await fetch(`${servicio.url}/salud`, { signal: controlador.signal });
    clearTimeout(temporizador);
    return respuesta.ok ? 'activo' : 'caido';
  } catch {
    return 'caido';
  }
}
