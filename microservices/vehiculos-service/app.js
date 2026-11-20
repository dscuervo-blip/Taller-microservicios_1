/**
 * Ensambla el microservicio de vehículos:
 *   repositorio -> servicio -> controlador -> rutas -> servidor HTTP
 *
 * Recibir las rutas de los archivos como parámetros permite que las pruebas
 * automáticas usen un archivo de datos temporal sin tocar los datos reales.
 */
const { crearServidor } = require('../shared/http/crearServidor');
const { crearRepositorioVehiculos } = require('./repositories/vehiculos.repository');
const VehiculosService = require('./services/vehiculos.service');
const { crearControladorVehiculos } = require('./controllers/vehiculos.controller');
const { crearRutasVehiculos } = require('./routes/vehiculos.routes');
const config = require('./config');

function crearAppVehiculos(opciones = {}) {
  const ajustes = { ...config, ...opciones };

  const repositorio = crearRepositorioVehiculos(ajustes);
  const servicio = new VehiculosService(repositorio);
  const controlador = crearControladorVehiculos(servicio);
  const router = crearRutasVehiculos(controlador);

  return crearServidor({
    nombre: ajustes.nombre,
    router,
    registrarPeticiones: ajustes.registrarPeticiones !== false,
  });
}

module.exports = { crearAppVehiculos };
