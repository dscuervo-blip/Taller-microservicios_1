/**
 * JsonFileRepository
 * Repositorio genérico que guarda una lista de registros en un archivo JSON.
 *
 * Es la ÚNICA pieza que sabe que los datos viven en un archivo. Los servicios
 * solo llaman a sus métodos (listar, buscarPorId, crear, actualizar, eliminar).
 * Para migrar a una base de datos (MySQL, MongoDB...) basta con escribir otro
 * repositorio con estos mismos métodos y cambiarlo en el server.js del servicio.
 *
 * Detalles importantes:
 *  - Si el archivo de datos no existe, se crea copiando el archivo "semilla"
 *    (datos iniciales de demostración) o como una lista vacía.
 *  - Las escrituras se hacen en cola (una tras otra) para que dos peticiones
 *    simultáneas no se pisen los cambios.
 *  - Se escribe primero en un archivo temporal y luego se renombra, para no
 *    dejar el JSON a medio escribir si el proceso se detiene.
 */
const fs = require('fs/promises');
const path = require('path');

class JsonFileRepository {
  /**
   * @param {object} opciones
   * @param {string} opciones.archivo         Ruta del archivo JSON con los datos.
   * @param {string} [opciones.archivoSemilla] Ruta del JSON con los datos iniciales.
   * @param {string} opciones.prefijoId       Prefijo de los IDs, p. ej. "VEH" -> VEH-0001.
   */
  constructor({ archivo, archivoSemilla, prefijoId }) {
    this.archivo = archivo;
    this.archivoSemilla = archivoSemilla;
    this.prefijoId = prefijoId;
    this.cola = Promise.resolve();
    this.inicializado = null;
  }

  /** Crea el archivo de datos si todavía no existe. Se ejecuta una sola vez. */
  inicializar() {
    if (!this.inicializado) {
      this.inicializado = (async () => {
        try {
          await fs.access(this.archivo);
        } catch {
          let datosIniciales = [];
          if (this.archivoSemilla) {
            try {
              datosIniciales = JSON.parse(await fs.readFile(this.archivoSemilla, 'utf8'));
            } catch {
              datosIniciales = [];
            }
          }
          await fs.mkdir(path.dirname(this.archivo), { recursive: true });
          await this._escribir(datosIniciales);
        }
      })();
    }
    return this.inicializado;
  }

  async listar() {
    await this.inicializar();
    const texto = await fs.readFile(this.archivo, 'utf8');
    const datos = JSON.parse(texto || '[]');
    if (!Array.isArray(datos)) {
      throw new Error(`El archivo ${this.archivo} no contiene una lista JSON.`);
    }
    return datos;
  }

  async buscarPorId(id) {
    const registros = await this.listar();
    return registros.find((r) => r.id === id) || null;
  }

  async buscarUno(predicado) {
    const registros = await this.listar();
    return registros.find(predicado) || null;
  }

  /** Crea un registro asignándole ID y fechas. Devuelve el registro creado. */
  crear(datos) {
    return this._enCola(async () => {
      const registros = await this.listar();
      const ahora = new Date().toISOString();
      const nuevo = {
        id: this._generarId(registros),
        ...datos,
        fechaCreacion: ahora,
        fechaActualizacion: ahora,
      };
      registros.push(nuevo);
      await this._escribir(registros);
      return nuevo;
    });
  }

  /** Actualiza un registro existente. Devuelve null si el ID no existe. */
  actualizar(id, cambios) {
    return this._enCola(async () => {
      const registros = await this.listar();
      const indice = registros.findIndex((r) => r.id === id);
      if (indice === -1) return null;

      const actualizado = {
        ...registros[indice],
        ...cambios,
        id, // el ID nunca cambia
        fechaCreacion: registros[indice].fechaCreacion,
        fechaActualizacion: new Date().toISOString(),
      };
      registros[indice] = actualizado;
      await this._escribir(registros);
      return actualizado;
    });
  }

  /** Elimina un registro. Devuelve el registro eliminado o null si no existía. */
  eliminar(id) {
    return this._enCola(async () => {
      const registros = await this.listar();
      const indice = registros.findIndex((r) => r.id === id);
      if (indice === -1) return null;
      const [eliminado] = registros.splice(indice, 1);
      await this._escribir(registros);
      return eliminado;
    });
  }

  // ---------------------------------------------------------------- privados

  /** Ejecuta las operaciones de escritura una después de otra. */
  _enCola(operacion) {
    const resultado = this.cola.then(operacion);
    // Si una operación falla, la cola sigue funcionando para las siguientes.
    this.cola = resultado.catch(() => {});
    return resultado;
  }

  /** Genera IDs legibles y únicos: PREFIJO-0001, PREFIJO-0002... */
  _generarId(registros) {
    const patron = new RegExp(`^${this.prefijoId}-(\\d+)$`);
    const mayor = registros.reduce((max, r) => {
      const coincidencia = patron.exec(r.id || '');
      return coincidencia ? Math.max(max, Number(coincidencia[1])) : max;
    }, 0);
    return `${this.prefijoId}-${String(mayor + 1).padStart(4, '0')}`;
  }

  async _escribir(registros) {
    const texto = `${JSON.stringify(registros, null, 2)}\n`;
    const temporal = `${this.archivo}.${process.pid}.tmp`;
    await fs.writeFile(temporal, texto, 'utf8');
    try {
      await fs.rename(temporal, this.archivo);
    } catch (error) {
      await fs.rm(temporal, { force: true });
      // En Windows el antivirus puede bloquear el renombrado; se escribe directo.
      if (!['EPERM', 'EACCES', 'EBUSY'].includes(error.code)) throw error;
      await fs.writeFile(this.archivo, texto, 'utf8');
    }
  }
}

module.exports = JsonFileRepository;
