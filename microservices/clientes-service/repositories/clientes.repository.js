/**
 * Repositorio de clientes.
 * Hoy guarda los datos en un archivo JSON. Para usar una base de datos se crea
 * otra clase con los mismos métodos y se cambia aquí.
 */
const JsonFileRepository = require('../../shared/storage/JsonFileRepository');

function crearRepositorioClientes({ archivoDatos, archivoSemilla }) {
  return new JsonFileRepository({
    archivo: archivoDatos,
    archivoSemilla,
    prefijoId: 'CLI',
  });
}

module.exports = { crearRepositorioClientes };
