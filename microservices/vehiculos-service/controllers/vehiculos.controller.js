/**
 * Controlador de vehículos.
 * Traduce la petición HTTP (params, query, cuerpo) en llamadas al servicio y
 * el resultado en una respuesta JSON. No contiene reglas de negocio.
 */
const { enviarExito } = require('../../shared/http/respuestas');

function crearControladorVehiculos(servicio) {
  return {
    async catalogos({ res }) {
      enviarExito(res, servicio.obtenerCatalogos());
    },

    async listar({ res, query }) {
      const vehiculos = await servicio.listar(query);
      enviarExito(res, vehiculos);
    },

    async resumen({ res }) {
      enviarExito(res, await servicio.obtenerResumen());
    },

    async clasificar({ res, params }) {
      enviarExito(res, await servicio.clasificar(params.campo));
    },

    async obtener({ res, params }) {
      enviarExito(res, await servicio.obtenerPorId(params.id));
    },

    async estado({ res, params }) {
      enviarExito(res, await servicio.obtenerEstado(params.id));
    },

    async crear({ res, leerCuerpo }) {
      const vehiculo = await servicio.crear(await leerCuerpo());
      enviarExito(res, vehiculo, { status: 201, mensaje: 'Vehículo registrado correctamente.' });
    },

    async actualizar({ res, params, leerCuerpo }) {
      const vehiculo = await servicio.actualizar(params.id, await leerCuerpo());
      enviarExito(res, vehiculo, { mensaje: 'Vehículo actualizado correctamente.' });
    },

    async cambiarEstado({ res, params, leerCuerpo }) {
      const { estado } = await leerCuerpo();
      const vehiculo = await servicio.cambiarEstado(params.id, estado);
      enviarExito(res, vehiculo, { mensaje: `Estado actualizado a "${vehiculo.estado}".` });
    },

    async eliminar({ res, params }) {
      const vehiculo = await servicio.eliminar(params.id);
      enviarExito(res, vehiculo, { mensaje: 'Vehículo eliminado correctamente.' });
    },
  };
}

module.exports = { crearControladorVehiculos };
