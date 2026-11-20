/**
 * Rutas REST del microservicio de vehículos.
 * Las rutas fijas van ANTES que /vehiculos/:id para que no se confundan con un ID.
 */
const Router = require('../../shared/http/Router');

function crearRutasVehiculos(controlador) {
  const router = new Router();

  router.get('/vehiculos/catalogos', controlador.catalogos);
  router.get('/vehiculos/resumen', controlador.resumen);
  router.get('/vehiculos/clasificacion/:campo', controlador.clasificar);

  router.get('/vehiculos', controlador.listar);
  router.post('/vehiculos', controlador.crear);

  router.get('/vehiculos/:id/estado', controlador.estado);
  router.patch('/vehiculos/:id/estado', controlador.cambiarEstado);

  router.get('/vehiculos/:id', controlador.obtener);
  router.put('/vehiculos/:id', controlador.actualizar);
  router.delete('/vehiculos/:id', controlador.eliminar);

  return router;
}

module.exports = { crearRutasVehiculos };
