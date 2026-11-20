/**
 * Router
 * Enrutador mínimo (sin dependencias) que asocia "método + ruta" con una función.
 * Soporta parámetros en la ruta, por ejemplo: /vehiculos/:id
 *
 * Uso:
 *   const router = new Router();
 *   router.get('/vehiculos/:id', (ctx) => { ... ctx.params.id ... });
 *
 * IMPORTANTE: las rutas se evalúan en el orden en que se registran, por eso las
 * rutas fijas (/vehiculos/resumen) deben registrarse antes que las que tienen
 * parámetros (/vehiculos/:id).
 */
class Router {
  constructor() {
    this.rutas = [];
  }

  agregar(metodo, patron, manejador) {
    const nombresParametros = [];
    // Convierte "/vehiculos/:id" en la expresión regular ^/vehiculos/([^/]+)$
    const fuente = patron
      .split('/')
      .map((segmento) => {
        if (segmento.startsWith(':')) {
          nombresParametros.push(segmento.slice(1));
          return '([^/]+)';
        }
        return segmento.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      })
      .join('/');

    this.rutas.push({
      metodo: metodo.toUpperCase(),
      patron,
      expresion: new RegExp(`^${fuente}/?$`),
      nombresParametros,
      manejador,
    });
    return this;
  }

  get(patron, manejador) { return this.agregar('GET', patron, manejador); }
  post(patron, manejador) { return this.agregar('POST', patron, manejador); }
  put(patron, manejador) { return this.agregar('PUT', patron, manejador); }
  patch(patron, manejador) { return this.agregar('PATCH', patron, manejador); }
  delete(patron, manejador) { return this.agregar('DELETE', patron, manejador); }

  /**
   * Busca la ruta que corresponde a la petición.
   * @returns {{manejador: Function, params: object} | {metodoNoPermitido: true} | null}
   */
  resolver(metodo, ruta) {
    let coincideRutaConOtroMetodo = false;

    for (const definicion of this.rutas) {
      const coincidencia = definicion.expresion.exec(ruta);
      if (!coincidencia) continue;

      if (definicion.metodo !== metodo.toUpperCase()) {
        coincideRutaConOtroMetodo = true;
        continue;
      }

      const params = {};
      definicion.nombresParametros.forEach((nombre, i) => {
        params[nombre] = decodeURIComponent(coincidencia[i + 1]);
      });
      return { manejador: definicion.manejador, params };
    }

    return coincideRutaConOtroMetodo ? { metodoNoPermitido: true } : null;
  }

  /** Lista legible de rutas, útil para documentar el servicio en GET / */
  listar() {
    return this.rutas.map((r) => `${r.metodo} ${r.patron}`);
  }
}

module.exports = Router;
