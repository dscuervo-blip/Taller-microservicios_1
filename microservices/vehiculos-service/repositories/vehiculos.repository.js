/**
 * Repositorio de vehículos.
 * Hoy guarda los datos en un archivo JSON. Para usar una base de datos se crea
 * otra clase con los mismos métodos (listar, buscarPorId, buscarUno, crear,
 * actualizar, eliminar) y se cambia aquí, sin tocar servicios ni controladores.
 */
const JsonFileRepository = require('../../shared/storage/JsonFileRepository');

function crearRepositorioVehiculos({ archivoDatos, archivoSemilla }) {
  return new JsonFileRepository({
    archivo: archivoDatos,
    archivoSemilla,
    prefijoId: 'VEH',
  });
}

module.exports = { crearRepositorioVehiculos };
