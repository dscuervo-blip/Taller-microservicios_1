/**
 * Configuración del microservicio de vehículos.
 * Los valores pueden cambiarse con variables de entorno sin tocar el código.
 */
const path = require('path');

module.exports = {
  nombre: 'vehiculos-service',
  puerto: Number(process.env.VEHICULOS_PORT) || 3001,
  archivoDatos: process.env.VEHICULOS_DATA_FILE || path.join(__dirname, 'data', 'vehiculos.json'),
  archivoSemilla: path.join(__dirname, 'data', 'vehiculos.seed.json'),
};
