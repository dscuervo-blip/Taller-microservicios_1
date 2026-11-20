/**
 * Rutas REST del microservicio de clientes.
 * Las rutas fijas van ANTES que /clientes/:id.
 */
const Router = require('../../shared/http/Router');

function crearRutasClientes(controlador) {
  const router = new Router();

  router.get('/clientes/resumen', controlador.resumen);
  router.get('/clientes/identificacion/:numero', controlador.obtenerPorIdentificacion);

  router.get('/clientes', controlador.listar);
  router.post('/clientes', controlador.crear);

  router.get('/clientes/:id', controlador.obtener);
  router.put('/clientes/:id', controlador.actualizar);
  router.delete('/clientes/:id', controlador.eliminar);

  return router;
}

module.exports = { crearRutasClientes };
