/**
 * Punto de entrada del microservicio de clientes.
 * Ejecutar con:  node microservices/clientes-service/server.js
 * Puerto por defecto: 3002 (variable de entorno CLIENTES_PORT).
 */
const { iniciarServidor } = require('../shared/http/crearServidor');
const { crearAppClientes } = require('./app');
const config = require('./config');

iniciarServidor(crearAppClientes(), config);
