/**
 * Punto de entrada del microservicio de vehículos.
 * Ejecutar con:  node microservices/vehiculos-service/server.js
 * Puerto por defecto: 3001 (variable de entorno VEHICULOS_PORT).
 */
const { iniciarServidor } = require('../shared/http/crearServidor');
const { crearAppVehiculos } = require('./app');
const config = require('./config');

iniciarServidor(crearAppVehiculos(), config);
