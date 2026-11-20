/**
 * Ensambla el microservicio de clientes:
 *   repositorio -> servicio -> controlador -> rutas -> servidor HTTP
 */
const { crearServidor } = require('../shared/http/crearServidor');
const { crearRepositorioClientes } = require('./repositories/clientes.repository');
const ClientesService = require('./services/clientes.service');
const { crearControladorClientes } = require('./controllers/clientes.controller');
const { crearRutasClientes } = require('./routes/clientes.routes');
const config = require('./config');

function crearAppClientes(opciones = {}) {
  const ajustes = { ...config, ...opciones };

  const repositorio = crearRepositorioClientes(ajustes);
  const servicio = new ClientesService(repositorio);
  const controlador = crearControladorClientes(servicio);
  const router = crearRutasClientes(controlador);

  return crearServidor({
    nombre: ajustes.nombre,
    router,
    registrarPeticiones: ajustes.registrarPeticiones !== false,
  });
}

module.exports = { crearAppClientes };
