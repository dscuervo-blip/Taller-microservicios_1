/**
 * Panel principal (dashboard).
 * Todas las cifras se piden a los microservicios:
 *   - GET /vehiculos/resumen  (vehículos por estado y categoría)
 *   - GET /clientes/resumen   (total de clientes)
 *   - GET /vehiculos?ordenarPor=fechaCreacion&orden=desc (últimos registros)
 *   - GET /salud de cada servicio (estado de los microservicios)
 * Si un servicio no responde, el resto del panel sigue funcionando.
 */
import { iniciarLayout } from './layout.js';
import { vehiculosApi, clientesApi, verificarServicio } from './api.js';
import { SERVICIOS } from './config.js';
import { escaparHtml, icono, notificar, etiquetaEstado, etiquetaPlaca } from './ui.js';

const ESTADOS = [
  { nombre: 'Disponible', clase: 'disponible', id: 'total-disponibles' },
  { nombre: 'Alquilado', clase: 'alquilado', id: 'total-alquilados' },
  { nombre: 'En mantenimiento', clase: 'mantenimiento', id: 'total-mantenimiento' },
];

const escribir = (id, valor) => {
  document.getElementById(id).textContent = valor;
};

// ---------------------------------------------------------------- vehículos
function dibujarResumenVehiculos(resumen) {
  escribir('total-vehiculos', resumen.total);
  ESTADOS.forEach((e) => escribir(e.id, resumen.porEstado[e.nombre] ?? 0));
  dibujarBarraFlota(resumen);
  dibujarCategorias(resumen.porCategoria, resumen.total);
}

/**
 * Barra horizontal dividida por estado. Se dibuja con SVG para poder dar a
 * cada segmento su ancho exacto sin usar estilos en línea.
 */
function dibujarBarraFlota({ total, porEstado }) {
  const barra = document.getElementById('barra-flota');
  const leyenda = document.getElementById('leyenda-flota');
  const alquilados = porEstado.Alquilado ?? 0;

  document.getElementById('resumen-ocupacion').textContent = total > 0
    ? `${Math.round((alquilados / total) * 100)} % de la flota está alquilada en este momento`
    : 'Aún no hay vehículos registrados';

  let x = 0;
  const segmentos = ESTADOS.map((e) => {
    const ancho = total > 0 ? ((porEstado[e.nombre] ?? 0) / total) * 100 : 0;
    const rect = `<rect class="segmento--${e.clase}" x="${x}" y="0" width="${ancho}" height="44"></rect>`;
    x += ancho;
    return rect;
  }).join('');

  barra.innerHTML = `<svg viewBox="0 0 100 44" preserveAspectRatio="none" aria-hidden="true">
    ${segmentos}
    <line class="linea-carril" x1="0" y1="22" x2="100" y2="22" vector-effect="non-scaling-stroke"></line>
  </svg>`;
  barra.setAttribute('aria-label', ESTADOS.map((e) => `${e.nombre}: ${porEstado[e.nombre] ?? 0}`).join(', '));

  leyenda.innerHTML = ESTADOS.map((e) => `
    <li><strong>${porEstado[e.nombre] ?? 0}</strong>${etiquetaEstado(e.nombre)}</li>`).join('');
}

function dibujarCategorias(porCategoria, total) {
  const lista = document.getElementById('lista-categorias');
  const categorias = Object.entries(porCategoria).sort((a, b) => b[1] - a[1]);

  if (categorias.length === 0) {
    lista.innerHTML = '<li class="panel-vacio">Las categorías aparecerán cuando registre vehículos.</li>';
    return;
  }

  lista.innerHTML = categorias.map(([categoria, cantidad]) => `
    <li class="categoria">
      <span>${escaparHtml(categoria)}</span>
      <span class="categoria__cantidad">${cantidad}</span>
      <meter min="0" max="${total}" value="${cantidad}" aria-label="${escaparHtml(categoria)}: ${cantidad} de ${total}"></meter>
    </li>`).join('');
}

function dibujarRecientes(vehiculos) {
  const cuerpo = document.getElementById('cuerpo-recientes');
  if (vehiculos.length === 0) {
    cuerpo.innerHTML = '<tr><td colspan="4" class="panel-vacio">Todavía no hay vehículos registrados.</td></tr>';
    return;
  }
  cuerpo.innerHTML = vehiculos.slice(0, 5).map((v) => `
    <tr>
      <td>${etiquetaPlaca(v.placa)}</td>
      <td>${escaparHtml(v.marca)} ${escaparHtml(v.modelo)} <span class="tabla__secundario">${escaparHtml(v.anio)}</span></td>
      <td>${escaparHtml(v.categoria)}</td>
      <td>${etiquetaEstado(v.estado)}</td>
    </tr>`).join('');
}

function vehiculosSinConexion(error) {
  ['total-vehiculos', ...ESTADOS.map((e) => e.id)].forEach((id) => escribir(id, '–'));
  document.getElementById('resumen-ocupacion').textContent = error.message;
  document.getElementById('barra-flota').replaceChildren();
  document.getElementById('leyenda-flota').replaceChildren();
  document.getElementById('lista-categorias').innerHTML = '<li class="panel-vacio">Sin datos del servicio de vehículos.</li>';
  document.getElementById('cuerpo-recientes').innerHTML = '<tr><td colspan="4" class="panel-vacio">Sin datos del servicio de vehículos.</td></tr>';
}

// ---------------------------------------------------------------- servicios
async function dibujarServicios() {
  const lista = document.getElementById('lista-servicios');
  const claves = Object.keys(SERVICIOS);
  const estados = await Promise.all(claves.map(verificarServicio));
  const textos = { activo: 'En línea', caido: 'Sin conexión', pendiente: 'Parte 2' };

  lista.innerHTML = claves.map((clave, i) => {
    const servicio = SERVICIOS[clave];
    return `
      <li class="servicio servicio--${estados[i]}">
        ${icono('servidor')}
        <span class="servicio__nombre">${escaparHtml(servicio.nombre)}
          <span class="servicio__puerto">Puerto ${servicio.puerto}</span></span>
        <span class="servicio__estado">${textos[estados[i]]}</span>
      </li>`;
  }).join('');
}

// ---------------------------------------------------------------- carga
async function cargarPanel() {
  const [resumen, recientes, clientes] = await Promise.allSettled([
    vehiculosApi.resumen(),
    vehiculosApi.listar({ ordenarPor: 'fechaCreacion', orden: 'desc' }),
    clientesApi.resumen(),
    dibujarServicios(),
  ]);

  if (resumen.status === 'fulfilled') {
    dibujarResumenVehiculos(resumen.value);
    if (recientes.status === 'fulfilled') dibujarRecientes(recientes.value);
  } else {
    vehiculosSinConexion(resumen.reason);
    notificar(resumen.reason.message, 'error');
  }

  if (clientes.status === 'fulfilled') {
    escribir('total-clientes', clientes.value.total);
  } else {
    escribir('total-clientes', '–');
    notificar(clientes.reason.message, 'error');
  }
}

function mostrarFecha() {
  const hoy = new Date().toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  escribir('fecha-actual', `Resumen al ${hoy}`);
}

iniciarLayout();
mostrarFecha();
cargarPanel();
document.getElementById('boton-actualizar').addEventListener('click', cargarPanel);
