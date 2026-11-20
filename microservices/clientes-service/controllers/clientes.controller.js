/**
 * Controlador de clientes: traduce HTTP <-> servicio. Sin reglas de negocio.
 */
const { enviarExito } = require('../../shared/http/respuestas');

function crearControladorClientes(servicio) {
  return {
    async listar({ res, query }) {
      enviarExito(res, await servicio.listar(query));
    },

    async resumen({ res }) {
      enviarExito(res, await servicio.obtenerResumen());
    },

    async obtener({ res, params }) {
      enviarExito(res, await servicio.obtenerPorId(params.id));
    },

    async obtenerPorIdentificacion({ res, params }) {
      enviarExito(res, await servicio.obtenerPorIdentificacion(params.numero));
    },

    async crear({ res, leerCuerpo }) {
      const cliente = await servicio.crear(await leerCuerpo());
      enviarExito(res, cliente, { status: 201, mensaje: 'Cliente registrado correctamente.' });
    },

    async actualizar({ res, params, leerCuerpo }) {
      const cliente = await servicio.actualizar(params.id, await leerCuerpo());
      enviarExito(res, cliente, { mensaje: 'Cliente actualizado correctamente.' });
    },

    async eliminar({ res, params }) {
      const cliente = await servicio.eliminar(params.id);
      enviarExito(res, cliente, { mensaje: 'Cliente eliminado correctamente.' });
    },
  };
}

module.exports = { crearControladorClientes };
