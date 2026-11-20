/**
 * crearServidor
 * Crea el servidor HTTP de un microservicio a partir de su Router.
 *
 * Se encarga de lo que es común a TODOS los microservicios:
 *  - Cabeceras CORS (el frontend corre en otro puerto).
 *  - Ruta GET /salud para comprobar que el servicio está activo.
 *  - Ruta GET / con la lista de endpoints disponibles.
 *  - Resolución de la ruta y construcción del "contexto" de la petición.
 *  - Manejo centralizado de errores y registro en consola.
 *
 * Cada microservicio solo define SUS rutas; no repite esta lógica.
 */
const http = require('http');
const AppError = require('../errors/AppError');
const { enviarExito, enviarError } = require('./respuestas');
const { leerCuerpoJson } = require('./cuerpo');

const CABECERAS_CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Max-Age': '86400',
};

/**
 * @param {object} opciones
 * @param {string} opciones.nombre  Nombre del servicio (aparece en /salud y en los logs).
 * @param {import('./Router')} opciones.router  Rutas del servicio.
 * @param {boolean} [opciones.registrarPeticiones=true]  Mostrar cada petición en consola.
 */
function crearServidor({ nombre, router, registrarPeticiones = true }) {
  const inicio = new Date();

  return http.createServer(async (req, res) => {
    const comienzo = Date.now();
    Object.entries(CABECERAS_CORS).forEach(([clave, valor]) => res.setHeader(clave, valor));

    res.on('finish', () => {
      if (registrarPeticiones) {
        console.log(`[${nombre}] ${req.method} ${req.url} -> ${res.statusCode} (${Date.now() - comienzo} ms)`);
      }
    });

    // Petición "preflight" del navegador antes de un POST/PUT/PATCH/DELETE.
    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    try {
      const url = new URL(req.url, 'http://localhost');
      const ruta = url.pathname;

      if (req.method === 'GET' && ruta === '/salud') {
        enviarExito(res, {
          servicio: nombre,
          estado: 'activo',
          iniciadoEn: inicio.toISOString(),
          fecha: new Date().toISOString(),
        });
        return;
      }

      if (req.method === 'GET' && ruta === '/') {
        enviarExito(res, { servicio: nombre, endpoints: ['GET /salud', ...router.listar()] });
        return;
      }

      const resultado = router.resolver(req.method, ruta);
      if (!resultado) throw AppError.noEncontrado(`La ruta ${req.method} ${ruta} no existe en ${nombre}.`);
      if (resultado.metodoNoPermitido) throw AppError.metodoNoPermitido();

      const contexto = {
        req,
        res,
        params: resultado.params,
        query: Object.fromEntries(url.searchParams),
        leerCuerpo: () => leerCuerpoJson(req),
      };

      await resultado.manejador(contexto);
    } catch (error) {
      enviarError(res, error);
    }
  });
}

/**
 * Inicia el servidor en el puerto indicado y muestra un mensaje claro si el
 * puerto ya está ocupado (error muy común al ejecutar el proyecto dos veces).
 */
function iniciarServidor(servidor, { nombre, puerto }) {
  servidor.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      console.error(`[${nombre}] El puerto ${puerto} ya está en uso. ¿El servicio ya se está ejecutando?`);
    } else {
      console.error(`[${nombre}] No se pudo iniciar:`, error);
    }
    process.exit(1);
  });

  servidor.listen(puerto, () => {
    console.log(`[${nombre}] escuchando en http://localhost:${puerto}`);
  });
}

module.exports = { crearServidor, iniciarServidor };
