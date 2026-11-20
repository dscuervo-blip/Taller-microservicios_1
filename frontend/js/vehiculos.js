/**
 * Página de vehículos: registrar, listar, filtrar/clasificar, ver detalle,
 * cambiar estado, editar y eliminar. Toda la comunicación con el
 * microservicio pasa por vehiculosApi (api.js).
 */
import { iniciarLayout } from './layout.js';
import { vehiculosApi, ApiError } from './api.js';
import {
  escaparHtml, icono, notificar, confirmar, etiquetaEstado, etiquetaPlaca,
  formatearFecha, retrasar, llenarSelect,
} from './ui.js';
import {
  validarFormulario, mostrarErroresServidor, leerFormulario, cargarFormulario,
  limpiarErrores, activarLimpiezaAlEscribir, conBotonOcupado,
} from './formularios.js';

// ---------------------------------------------------------------- elementos
const formulario = document.getElementById('formulario-vehiculo');
const tituloFormulario = document.getElementById('titulo-formulario');
const botonGuardar = document.getElementById('boton-guardar');
const botonCancelar = document.getElementById('boton-cancelar');
const formularioFiltros = document.getElementById('filtros-vehiculos');
const buscadorId = document.getElementById('buscador-id');
const cuerpoTabla = document.getElementById('cuerpo-vehiculos');
const vacio = document.getElementById('vacio-vehiculos');
const contador = document.getElementById('contador-vehiculos');
const dialogo = document.getElementById('dialogo-vehiculo');
const detalleCuerpo = document.getElementById('detalle-cuerpo');
const formularioEstado = document.getElementById('formulario-estado');
const selectEstadoDetalle = document.getElementById('detalle-nuevo-estado');

// ---------------------------------------------------------------- estado
const estado = {
  editandoId: null,     // ID del vehículo en edición (null = registrando)
  detalleId: null,      // ID del vehículo abierto en el diálogo
  catalogos: null,      // estados y categorías permitidos (vienen del servicio)
};

// ---------------------------------------------------------------- carga
async function cargarCatalogos() {
  estado.catalogos = await vehiculosApi.catalogos();
  const { categorias, estados, anioMinimo, anioMaximo } = estado.catalogos;

  llenarSelect(formulario.elements.categoria, categorias);
  llenarSelect(formulario.elements.estado, estados, { conservarPrimera: false });
  llenarSelect(formularioFiltros.elements.categoria, categorias);
  llenarSelect(formularioFiltros.elements.estado, estados);
  llenarSelect(selectEstadoDetalle, estados, { conservarPrimera: false });

  formulario.elements.anio.min = anioMinimo;
  formulario.elements.anio.max = anioMaximo;
}

/** Llena los filtros de marca, modelo y año con los valores que existen. */
async function actualizarOpcionesFiltros() {
  const todos = await vehiculosApi.listar();
  const unicos = (campo) => [...new Set(todos.map((v) => v[campo]))];
  const alfabetico = (a, b) => String(a).localeCompare(String(b), 'es');

  const marcas = unicos('marca').sort(alfabetico);
  llenarSelect(formularioFiltros.elements.marca, marcas);
  llenarSelect(formularioFiltros.elements.modelo, unicos('modelo').sort(alfabetico));
  llenarSelect(formularioFiltros.elements.anio, unicos('anio').sort((a, b) => b - a));

  // Sugerencias para el campo "Marca" del formulario.
  document.getElementById('lista-marcas').replaceChildren(...marcas.map((m) => new Option(m)));
}

function leerFiltros() {
  return leerFormulario(formularioFiltros);
}

async function cargarVehiculos() {
  const filtros = leerFiltros();
  marcarColumnaOrdenada(filtros.ordenarPor, filtros.orden);

  try {
    const vehiculos = await vehiculosApi.listar(filtros);
    dibujarTabla(vehiculos);
  } catch (error) {
    dibujarError(error);
  }
}

// ---------------------------------------------------------------- tabla
function dibujarTabla(vehiculos) {
  contador.textContent = `${vehiculos.length} ${vehiculos.length === 1 ? 'vehículo' : 'vehículos'}`;

  if (vehiculos.length === 0) {
    cuerpoTabla.replaceChildren();
    const hayFiltros = Object.entries(leerFiltros())
      .some(([clave, valor]) => !['ordenarPor', 'orden'].includes(clave) && valor !== '');
    vacio.innerHTML = hayFiltros
      ? '<strong>Ningún vehículo coincide con los filtros.</strong>Cambie los filtros o use "Quitar filtros".'
      : '<strong>Aún no hay vehículos registrados.</strong>Use el formulario de arriba para registrar el primero.';
    vacio.hidden = false;
    return;
  }

  vacio.hidden = true;
  cuerpoTabla.innerHTML = vehiculos.map((v) => `
    <tr data-id="${escaparHtml(v.id)}">
      <td>
        ${etiquetaPlaca(v.placa)}
        <span class="tabla__secundario tabla__codigo">${escaparHtml(v.id)}</span>
      </td>
      <td>
        <span class="vehiculo-nombre">${escaparHtml(v.marca)} ${escaparHtml(v.modelo)}</span>
        <span class="tabla__secundario vehiculo-descripcion" title="${escaparHtml(v.descripcion)}">${escaparHtml(v.descripcion)}</span>
      </td>
      <td class="tabla__numero">${escaparHtml(v.anio)}</td>
      <td>${escaparHtml(v.categoria)}</td>
      <td>${etiquetaEstado(v.estado)}</td>
      <td class="tabla__acciones">
        <div class="acciones-fila">
          <button type="button" class="boton-icono" data-accion="ver" aria-label="Ver ${escaparHtml(v.placa)}" title="Ver detalle y estado">${icono('ver')}</button>
          <button type="button" class="boton-icono" data-accion="editar" aria-label="Editar ${escaparHtml(v.placa)}" title="Editar">${icono('editar')}</button>
          <button type="button" class="boton-icono boton-icono--peligro" data-accion="eliminar" aria-label="Eliminar ${escaparHtml(v.placa)}" title="Eliminar">${icono('eliminar')}</button>
        </div>
      </td>
    </tr>`).join('');
}

function dibujarError(error) {
  cuerpoTabla.replaceChildren();
  contador.textContent = '';
  vacio.innerHTML = `<strong>No se pudo cargar la flota.</strong>${escaparHtml(error.message)}
    <p><button type="button" class="boton boton--secundario" data-accion="reintentar">${icono('refrescar')}Reintentar</button></p>`;
  vacio.hidden = false;
}

/** Indica en el encabezado de la tabla por qué columna está ordenada. */
function marcarColumnaOrdenada(campo, orden) {
  document.querySelectorAll('#tabla-vehiculos th[data-orden]').forEach((th) => {
    if (th.dataset.orden === campo) {
      th.setAttribute('aria-sort', orden === 'desc' ? 'descending' : 'ascending');
    } else {
      th.removeAttribute('aria-sort');
    }
  });
}

// ---------------------------------------------------------------- formulario
function modoRegistro() {
  estado.editandoId = null;
  formulario.reset();
  limpiarErrores(formulario);
  tituloFormulario.textContent = 'Registrar vehículo';
  botonGuardar.textContent = 'Registrar vehículo';
  botonCancelar.hidden = true;
}

async function modoEdicion(id) {
  try {
    const vehiculo = await vehiculosApi.obtener(id);
    estado.editandoId = vehiculo.id;
    limpiarErrores(formulario);
    cargarFormulario(formulario, vehiculo);
    tituloFormulario.textContent = `Editar vehículo ${vehiculo.id}`;
    botonGuardar.textContent = 'Guardar cambios';
    botonCancelar.hidden = false;
    document.getElementById('seccion-formulario').scrollIntoView({ behavior: 'smooth', block: 'start' });
    formulario.elements.marca.focus({ preventScroll: true });
  } catch (error) {
    notificar(error.message, 'error');
  }
}

async function guardar(evento) {
  evento.preventDefault();
  if (!validarFormulario(formulario)) {
    notificar('Revise los campos marcados antes de guardar.', 'error');
    return;
  }

  const datos = leerFormulario(formulario);
  datos.anio = Number(datos.anio);

  try {
    const { mensaje } = await conBotonOcupado(botonGuardar, 'Guardando...', () => (
      estado.editandoId
        ? vehiculosApi.actualizar(estado.editandoId, datos)
        : vehiculosApi.crear(datos)
    ));
    notificar(mensaje);
    modoRegistro();
    await refrescarTodo();
  } catch (error) {
    if (error instanceof ApiError && error.detalles) mostrarErroresServidor(formulario, error.detalles);
    notificar(error.message, 'error');
  }
}

// ---------------------------------------------------------------- acciones
async function eliminar(id) {
  const fila = cuerpoTabla.querySelector(`tr[data-id="${CSS.escape(id)}"]`);
  const placa = fila?.querySelector('.placa')?.textContent || id;

  const aceptado = await confirmar({
    titulo: 'Eliminar vehículo',
    mensaje: `Se eliminará el vehículo con placa ${placa} (${id}). Esta acción no se puede deshacer.`,
    textoConfirmar: 'Eliminar vehículo',
    peligro: true,
  });
  if (!aceptado) return;

  try {
    const { mensaje } = await vehiculosApi.eliminar(id);
    notificar(mensaje);
    if (estado.editandoId === id) modoRegistro();
    await refrescarTodo();
  } catch (error) {
    notificar(error.message, 'error');
  }
}

async function abrirDetalle(id) {
  try {
    // Se consultan los dos endpoints: el detalle completo y el estado actual.
    const [vehiculo, estadoActual] = await Promise.all([vehiculosApi.obtener(id), vehiculosApi.estado(id)]);
    estado.detalleId = vehiculo.id;

    detalleCuerpo.innerHTML = `
      <div class="detalle-vehiculo__encabezado">
        ${etiquetaPlaca(vehiculo.placa, true)}
        ${etiquetaEstado(estadoActual.estado)}
      </div>
      <p class="detalle-vehiculo__nombre">${escaparHtml(vehiculo.marca)} ${escaparHtml(vehiculo.modelo)}
        <small>${estadoActual.disponible ? 'Disponible para alquilar' : 'No disponible para alquilar en este momento'}</small></p>
      <dl class="lista-datos">
        <dt>ID</dt><dd>${escaparHtml(vehiculo.id)}</dd>
        <dt>Año</dt><dd>${escaparHtml(vehiculo.anio)}</dd>
        <dt>Categoría</dt><dd>${escaparHtml(vehiculo.categoria)}</dd>
        <dt>Descripción</dt><dd>${escaparHtml(vehiculo.descripcion)}</dd>
        <dt>Registrado</dt><dd>${formatearFecha(vehiculo.fechaCreacion)}</dd>
        <dt>Última modificación</dt><dd>${formatearFecha(vehiculo.fechaActualizacion)}</dd>
      </dl>`;
    selectEstadoDetalle.value = estadoActual.estado;
    if (!dialogo.open) dialogo.showModal();
  } catch (error) {
    notificar(error.message, 'error');
  }
}

async function cambiarEstado(evento) {
  evento.preventDefault();
  const boton = document.getElementById('boton-cambiar-estado');
  try {
    const { mensaje } = await conBotonOcupado(boton, 'Actualizando...', () =>
      vehiculosApi.cambiarEstado(estado.detalleId, selectEstadoDetalle.value));
    notificar(mensaje);
    await Promise.all([abrirDetalle(estado.detalleId), cargarVehiculos()]);
  } catch (error) {
    notificar(error.message, 'error');
  }
}

async function buscarPorId(evento) {
  evento.preventDefault();
  const id = buscadorId.elements.id.value.trim().toUpperCase();
  if (!id) {
    notificar('Escriba el ID del vehículo, por ejemplo VEH-0001.', 'error');
    buscadorId.elements.id.focus();
    return;
  }
  await abrirDetalle(id);
}

async function refrescarTodo() {
  await Promise.all([cargarVehiculos(), actualizarOpcionesFiltros().catch(() => {})]);
}

// ---------------------------------------------------------------- eventos
function registrarEventos() {
  activarLimpiezaAlEscribir(formulario);
  formulario.addEventListener('submit', guardar);
  formulario.addEventListener('reset', () => {
    limpiarErrores(formulario);
    if (estado.editandoId) setTimeout(modoRegistro);
  });
  botonCancelar.addEventListener('click', modoRegistro);

  const recargar = retrasar(cargarVehiculos, 300);
  formularioFiltros.addEventListener('input', recargar);
  formularioFiltros.addEventListener('reset', () => setTimeout(cargarVehiculos));
  formularioFiltros.addEventListener('submit', (evento) => evento.preventDefault());

  // Clic en el encabezado: ordena por esa columna (o invierte el orden).
  document.querySelectorAll('#tabla-vehiculos th[data-orden] .boton-orden').forEach((boton) => {
    boton.addEventListener('click', () => {
      const campo = boton.closest('th').dataset.orden;
      const { ordenarPor, orden } = formularioFiltros.elements;
      orden.value = ordenarPor.value === campo && orden.value === 'asc' ? 'desc' : 'asc';
      ordenarPor.value = campo;
      cargarVehiculos();
    });
  });

  // Delegación: un solo listener para los botones de todas las filas.
  cuerpoTabla.addEventListener('click', (evento) => {
    const boton = evento.target.closest('button[data-accion]');
    if (!boton) return;
    const { id } = boton.closest('tr').dataset;
    if (boton.dataset.accion === 'ver') abrirDetalle(id);
    if (boton.dataset.accion === 'editar') modoEdicion(id);
    if (boton.dataset.accion === 'eliminar') eliminar(id);
  });

  vacio.addEventListener('click', (evento) => {
    if (evento.target.closest('[data-accion="reintentar"]')) iniciar();
  });

  buscadorId.addEventListener('submit', buscarPorId);
  formularioEstado.addEventListener('submit', cambiarEstado);
  dialogo.querySelector('[data-cerrar]').addEventListener('click', () => dialogo.close());
}

async function iniciar() {
  try {
    await cargarCatalogos();
    await refrescarTodo();
  } catch (error) {
    dibujarError(error);
  }
}

iniciarLayout();
registrarEventos();
iniciar();
