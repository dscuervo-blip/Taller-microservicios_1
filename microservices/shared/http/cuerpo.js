/**
 * Lee el cuerpo de una petición HTTP y lo convierte de JSON a objeto.
 * Rechaza cuerpos demasiado grandes o con JSON mal formado.
 */
const AppError = require('../errors/AppError');

const LIMITE_BYTES = 1024 * 1024; // 1 MB es más que suficiente para estos formularios.

function leerCuerpoJson(req) {
  return new Promise((resolve, reject) => {
    const partes = [];
    let tamano = 0;
    let abortado = false;

    req.on('data', (parte) => {
      if (abortado) return;
      tamano += parte.length;
      if (tamano > LIMITE_BYTES) {
        abortado = true;
        reject(new AppError(413, 'CUERPO_DEMASIADO_GRANDE', 'El cuerpo de la petición es demasiado grande.'));
        return;
      }
      partes.push(parte);
    });

    req.on('end', () => {
      if (abortado) return;
      const texto = Buffer.concat(partes).toString('utf8').trim();
      if (texto === '') {
        reject(AppError.peticionInvalida('La petición no tiene cuerpo JSON.'));
        return;
      }
      try {
        const datos = JSON.parse(texto);
        if (datos === null || typeof datos !== 'object' || Array.isArray(datos)) {
          reject(AppError.peticionInvalida('El cuerpo debe ser un objeto JSON.'));
          return;
        }
        resolve(datos);
      } catch {
        reject(AppError.peticionInvalida('El cuerpo de la petición no es un JSON válido.'));
      }
    });

    req.on('error', reject);
  });
}

module.exports = { leerCuerpoJson };
