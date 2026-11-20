/**
 * Utilidades de interfaz reutilizadas por todas las páginas:
 * escapar HTML, íconos, notificaciones, confirmaciones, formato de datos y
 * etiquetas de estado.
 */

/** Evita que un texto escrito por el usuario se interprete como HTML. */
export function escaparHtml(valor) {
  return String(valor ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

/** Ruta hasta la carpeta frontend/ desde la página actual ("" o "../"). */
export function raiz() {
  return document.body.dataset.raiz || '';
}

/** HTML de un ícono del sprite assets/icons.svg */
export function icono(nombre, clase = 'icono') {
  return `<svg class="${clase}" aria-hidden="true" focusable="false"><use href="${raiz()}assets/icons.svg#${nombre}"></use></svg>`;
}

/** Muestra un mensaje temporal en la esquina inferior derecha. */
export function notificar(mensaje, tipo = 'exito') {
  const contenedor = document.getElementById('notificaciones');
  if (!contenedor) return;

  const elemento = document.createElement('div');
  elemento.className = `notificacion notificacion--${tipo}`;
  elemento.setAttribute('role', tipo === 'error' ? 'alert' : 'status');
  elemento.innerHTML = `${icono(tipo === 'error' ? 'alerta' : 'check')}<span>${escaparHtml(mensaje)}</span>`;
  contenedor.append(elemento);

  setTimeout(() => elemento.remove(), tipo === 'error' ? 6000 : 3500);
}

/**
 * Pide confirmación con un <dialog> nativo. Devuelve una promesa con true/false.
 * El diálogo se crea una sola vez y se reutiliza.
 */
export function confirmar({ titulo, mensaje, textoConfirmar = 'Confirmar', peligro = false }) {
  let dialogo = document.getElementById('dialogo-confirmacion');
  if (!dialogo) {
    dialogo = document.createElement('dialog');
    dialogo.id = 'dialogo-confirmacion';
    dialogo.className = 'dialogo';
    dialogo.setAttribute('aria-labelledby', 'confirmacion-titulo');
    dialogo.innerHTML = `
      <form method="dialog">
        <div class="dialogo__cabecera"><h2 id="confirmacion-titulo"></h2></div>
        <div class="dialogo__cuerpo"><p id="confirmacion-mensaje"></p></div>
        <div class="dialogo__pie">
          <button class="boton boton--secundario" value="cancelar">Cancelar</button>
          <button class="boton" id="confirmacion-aceptar" value="aceptar"></button>
        </div>
      </form>`;
    document.body.append(dialogo);
  }

  dialogo.querySelector('#confirmacion-titulo').textContent = titulo;
  dialogo.querySelector('#confirmacion-mensaje').textContent = mensaje;
  const botonAceptar = dialogo.querySelector('#confirmacion-aceptar');
  botonAceptar.textContent = textoConfirmar;
  botonAceptar.className = `boton ${peligro ? 'boton--peligro' : 'boton--primario'}`;

  return new Promise((resolve) => {
    dialogo.returnValue = '';
    dialogo.addEventListener('close', () => resolve(dialogo.returnValue === 'aceptar'), { once: true });
    dialogo.showModal();
  });
}

/** Clase CSS para cada estado del vehículo. */
const CLASES_ESTADO = {
  Disponible: 'estado--disponible',
  Alquilado: 'estado--alquilado',
  'En mantenimiento': 'estado--mantenimiento',
};

export function etiquetaEstado(estado) {
  return `<span class="estado ${CLASES_ESTADO[estado] || ''}">${escaparHtml(estado)}</span>`;
}

/** Muestra la placa como placa colombiana: "KLM482" -> "KLM 482". */
export function formatearPlaca(placa) {
  return String(placa || '').replace(/^([A-Z]{3})(\d{2,3}[A-Z]?)$/, '$1 $2');
}

export function etiquetaPlaca(placa, grande = false) {
  return `<span class="placa${grande ? ' placa--grande' : ''}">${escaparHtml(formatearPlaca(placa))}</span>`;
}

export function formatearFecha(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' });
}

/** Ejecuta una función después de que el usuario deja de escribir. */
export function retrasar(funcion, milisegundos = 300) {
  let temporizador;
  return (...args) => {
    clearTimeout(temporizador);
    temporizador = setTimeout(() => funcion(...args), milisegundos);
  };
}

/** Llena un <select> con opciones, conservando la primera si es "Todas". */
export function llenarSelect(select, valores, { conservarPrimera = true } = {}) {
  const valorActual = select.value;
  const primera = conservarPrimera ? select.options[0] : null;
  select.replaceChildren(...(primera ? [primera] : []));
  valores.forEach((valor) => select.append(new Option(valor, valor)));
  if ([...select.options].some((opcion) => opcion.value === valorActual)) select.value = valorActual;
}
