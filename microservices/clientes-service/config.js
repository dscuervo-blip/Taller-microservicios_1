/**
 * Configuración del microservicio de clientes.
 * Los valores pueden cambiarse con variables de entorno sin tocar el código.
 */
const path = require('path');

module.exports = {
  nombre: 'clientes-service',
  puerto: Number(process.env.CLIENTES_PORT) || 3002,
  archivoDatos: process.env.CLIENTES_DATA_FILE || path.join(__dirname, 'data', 'clientes.json'),
  archivoSemilla: path.join(__dirname, 'data', 'clientes.seed.json'),
};
