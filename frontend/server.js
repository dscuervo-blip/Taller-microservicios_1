/**
 * Servidor estático del frontend (solo entrega archivos HTML, CSS, JS e íconos).
 * No contiene lógica de negocio: los datos los dan los microservicios.
 *
 * Ejecutar con:  node frontend/server.js   ->  http://localhost:3000
 * Puerto configurable con la variable de entorno FRONTEND_PORT.
 *
 * También se puede abrir con Apache de XAMPP:
 *   http://localhost/Taller-microservicios/frontend/
 */
const http = require('http');
const fs = require('fs');
const path = require('path');

const PUERTO = Number(process.env.FRONTEND_PORT) || 3000;
const CARPETA = __dirname;

const TIPOS = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
};

const servidor = http.createServer((req, res) => {
  const ruta = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  let archivo = path.normalize(path.join(CARPETA, ruta));

  // Seguridad: no permitir salir de la carpeta frontend/ (p. ej. /../microservices).
  const dentroDeFrontend = archivo === CARPETA || archivo.startsWith(CARPETA + path.sep);
  if (!dentroDeFrontend || path.basename(archivo) === 'server.js') {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Acceso denegado');
    return;
  }

  if (fs.existsSync(archivo) && fs.statSync(archivo).isDirectory()) {
    archivo = path.join(archivo, 'index.html');
  }

  fs.readFile(archivo, (error, contenido) => {
    if (error) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Página no encontrada');
      return;
    }
    res.writeHead(200, {
      'Content-Type': TIPOS[path.extname(archivo).toLowerCase()] || 'application/octet-stream',
      'Cache-Control': 'no-cache',
    });
    res.end(contenido);
  });
});

servidor.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`[frontend] El puerto ${PUERTO} ya está en uso.`);
  } else {
    console.error('[frontend] No se pudo iniciar:', error);
  }
  process.exit(1);
});

servidor.listen(PUERTO, () => {
  console.log(`[frontend] Abra http://localhost:${PUERTO} en el navegador`);
});
