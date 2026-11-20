/**
 * Ayuda para las pruebas automáticas: levanta un microservicio en un puerto
 * libre con un archivo de datos TEMPORAL (copia de la semilla), para que las
 * pruebas nunca modifiquen los datos reales.
 */
const fs = require('fs');
const os = require('os');
const path = require('path');

async function levantarServicioDePrueba(crearApp, { archivoSemilla, nombreArchivo }) {
  const carpeta = fs.mkdtempSync(path.join(os.tmpdir(), 'gestor-alquiler-'));
  const archivoDatos = path.join(carpeta, nombreArchivo);

  const servidor = crearApp({ archivoDatos, archivoSemilla, registrarPeticiones: false });
  await new Promise((resolve) => servidor.listen(0, resolve));
  const { port } = servidor.address();
  const url = `http://127.0.0.1:${port}`;

  /** Hace una petición y devuelve { status, cuerpo } con el JSON ya convertido. */
  async function pedir(metodo, ruta, cuerpo) {
    const respuesta = await fetch(`${url}${ruta}`, {
      method: metodo,
      headers: cuerpo !== undefined ? { 'Content-Type': 'application/json' } : undefined,
      body: cuerpo !== undefined ? (typeof cuerpo === 'string' ? cuerpo : JSON.stringify(cuerpo)) : undefined,
    });
    return { status: respuesta.status, cuerpo: await respuesta.json() };
  }

  async function cerrar() {
    await new Promise((resolve) => servidor.close(resolve));
    fs.rmSync(carpeta, { recursive: true, force: true });
  }

  return { url, pedir, cerrar, archivoDatos };
}

module.exports = { levantarServicioDePrueba };
