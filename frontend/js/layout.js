/**
 * Estructura común de todas las páginas:
 *  - Dibuja el menú lateral a partir de MENU (config.js).
 *  - Abre/cierra el menú en pantallas pequeñas.
 *  - Muestra en la barra superior si los microservicios responden.
 *
 * Cada página solo necesita en su <body>:
 *   data-pagina="clave-del-menu"  y  data-raiz="" (index) o "../" (pages/)
 */
import { MENU, SERVICIOS } from './config.js';
import { verificarServicio } from './api.js';
import { escaparHtml, icono, raiz } from './ui.js';

function dibujarMenu() {
  const nav = document.getElementById('menu-principal');
  if (!nav) return;
  const paginaActual = document.body.dataset.pagina;

  nav.innerHTML = MENU.map((grupo) => `
    <div class="menu__grupo">
      <p class="menu__titulo">${escaparHtml(grupo.titulo)}</p>
      <ul class="menu__lista">
        ${grupo.opciones.map((opcion) => dibujarOpcion(opcion, paginaActual)).join('')}
      </ul>
    </div>`).join('');
}

function dibujarOpcion(opcion, paginaActual) {
  const disponible = !opcion.servicio || SERVICIOS[opcion.servicio]?.implementado;
  const contenido = `${icono(opcion.icono)}<span>${escaparHtml(opcion.texto)}</span>`;

  if (!disponible) {
    return `<li><span class="menu__enlace menu__enlace--pendiente" title="Módulo de la Parte 2, aún no implementado">
      ${contenido}<span class="menu__nota">Parte 2</span></span></li>`;
  }

  const activo = opcion.clave === paginaActual;
  return `<li><a class="menu__enlace${activo ? ' menu__enlace--activo' : ''}" href="${raiz()}${opcion.ruta}"
    ${activo ? 'aria-current="page"' : ''}>${contenido}</a></li>`;
}

function activarMenuMovil() {
  const boton = document.getElementById('boton-menu');
  const barra = document.getElementById('barra-lateral');
  const fondo = document.getElementById('fondo-menu');
  if (!boton || !barra || !fondo) return;

  const cambiar = (abrir) => {
    barra.classList.toggle('barra-lateral--abierta', abrir);
    fondo.hidden = !abrir;
    boton.setAttribute('aria-expanded', String(abrir));
  };

  boton.addEventListener('click', () => cambiar(!barra.classList.contains('barra-lateral--abierta')));
  fondo.addEventListener('click', () => cambiar(false));
  document.addEventListener('keydown', (evento) => {
    if (evento.key === 'Escape') cambiar(false);
  });
}

/** Pastillas de estado (verde/rojo) de los servicios implementados. */
async function mostrarEstadoServicios() {
  const contenedor = document.getElementById('estado-servicios');
  if (!contenedor) return;

  const claves = Object.keys(SERVICIOS).filter((clave) => SERVICIOS[clave].implementado);
  const estados = await Promise.all(claves.map(verificarServicio));

  contenedor.innerHTML = claves.map((clave, i) => {
    const activo = estados[i] === 'activo';
    const texto = `${SERVICIOS[clave].nombre}: ${activo ? 'en línea' : 'sin conexión'}`;
    return `<span class="pastilla-servicio pastilla-servicio--${activo ? 'activo' : 'caido'}">${escaparHtml(texto)}</span>`;
  }).join('');
}

export function iniciarLayout() {
  dibujarMenu();
  activarMenuMovil();
  mostrarEstadoServicios();
}
