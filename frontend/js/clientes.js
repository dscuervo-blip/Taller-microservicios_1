/**
 * Página de clientes: registrar, listar, filtrar, buscar por identificación,
 * ver detalle, editar y eliminar. Usa clientesApi (api.js).
 */
import { iniciarLayout } from './layout.js';
import { clientesApi, ApiError } from './api.js';
import { escaparHtml, icono, notificar, confirmar, formatearFecha, retrasar } from './ui.js';
import {
  validarFormulario, mostrarErroresServidor, leerFormulario, cargarFormulario,
  limpiarErrores, activarLimpiezaAlEscribir, conBotonOcupado,
} from './formularios.js';

// ---------------------------------------------------------------- elementos
const formulario = document.getElementById('formulario-cliente');
const tituloFormulario = document.getElementById('titulo-formulario');
const botonGuardar = document.getElementById('boton-guardar');
const botonCancelar = document.getElementById('boton-cancelar');
const formularioFiltros = document.getElementById('filtros-clientes');
const buscadorIdentificacion = document.getElementById('buscador-identificacion');
const cuerpoTabla = document.getElementById('cuerpo-clientes');
const vacio = document.getElementById('vacio-clientes');
const contador = document.getElementById('contador-clientes');
const dialogo = document.getElementById('dialogo-cliente');
const detalleCuerpo = document.getElementById('detalle-cuerpo');

const estado = {
  editandoId: null,
  detalleId: null,
};

/** "Laura Patricia Gómez" -> "LG" (primer nombre y primer apellido aproximado). */
function iniciales(nombre) {
  const partes = String(nombre).trim().split(/\s+/);
  const ultima = partes.length > 2 ? partes[partes.length - 2] : partes[partes.length - 1];
  return `${partes[0]?.[0] || ''}${partes.length > 1 ? ultima[0] : ''}`.toUpperCase();
}

// ---------------------------------------------------------------- tabla
async function cargarClientes() {
  try {
    const clientes = await clientesApi.listar({ ...leerFormulario(formularioFiltros), ordenarPor: 'nombreCompleto' });
    dibujarTabla(clientes);
  } catch (error) {
    dibujarError(error);
  }
}

function dibujarTabla(clientes) {
  contador.textContent = `${clientes.length} ${clientes.length === 1 ? 'cliente' : 'clientes'}`;

  if (clientes.length === 0) {
    cuerpoTabla.replaceChildren();
    vacio.innerHTML = formularioFiltros.elements.buscar.value.trim()
      ? '<strong>Ningún cliente coincide con la búsqueda.</strong>Revise lo que escribió o borre el filtro.'
      : '<strong>Aún no hay clientes registrados.</strong>Use el formulario de arriba para registrar el primero.';
    vacio.hidden = false;
    return;
  }

  vacio.hidden = true;
  cuerpoTabla.innerHTML = clientes.map((c) => `
    <tr data-id="${escaparHtml(c.id)}">
      <td>
        <div class="cliente">
          <span class="cliente__iniciales" aria-hidden="true">${escaparHtml(iniciales(c.nombreCompleto))}</span>
          <span class="cliente__nombre">${escaparHtml(c.nombreCompleto)}</span>
        </div>
      </td>
      <td class="tabla__numero">${escaparHtml(c.identificacion)}</td>
      <td class="tabla__numero">${escaparHtml(c.telefono)}</td>
      <td><a href="mailto:${escaparHtml(c.correo)}">${escaparHtml(c.correo)}</a></td>
      <td class="licencia">${escaparHtml(c.licencia)}</td>
      <td class="tabla__codigo">${escaparHtml(c.id)}</td>
      <td class="tabla__acciones">
        <div class="acciones-fila">
          <button type="button" class="boton-icono" data-accion="ver" aria-label="Ver a ${escaparHtml(c.nombreCompleto)}" title="Ver detalle">${icono('ver')}</button>
          <button type="button" class="boton-icono" data-accion="editar" aria-label="Editar a ${escaparHtml(c.nombreCompleto)}" title="Editar">${icono('editar')}</button>
          <button type="button" class="boton-icono boton-icono--peligro" data-accion="eliminar" aria-label="Eliminar a ${escaparHtml(c.nombreCompleto)}" title="Eliminar">${icono('eliminar')}</button>
        </div>
      </td>
    </tr>`).join('');
}

function dibujarError(error) {
  cuerpoTabla.replaceChildren();
  contador.textContent = '';
  vacio.innerHTML = `<strong>No se pudo cargar la lista de clientes.</strong>${escaparHtml(error.message)}
    <p><button type="button" class="boton boton--secundario" data-accion="reintentar">${icono('refrescar')}Reintentar</button></p>`;
  vacio.hidden = false;
}

// ---------------------------------------------------------------- formulario
function modoRegistro() {
  estado.editandoId = null;
  formulario.reset();
  limpiarErrores(formulario);
  tituloFormulario.textContent = 'Registrar cliente';
  botonGuardar.textContent = 'Registrar cliente';
  botonCancelar.hidden = true;
}

async function modoEdicion(id) {
  try {
    const cliente = await clientesApi.obtener(id);
    estado.editandoId = cliente.id;
    limpiarErrores(formulario);
    cargarFormulario(formulario, cliente);
    tituloFormulario.textContent = `Editar cliente ${cliente.id}`;
    botonGuardar.textContent = 'Guardar cambios';
    botonCancelar.hidden = false;
    if (dialogo.open) dialogo.close();
    document.getElementById('seccion-formulario').scrollIntoView({ behavior: 'smooth', block: 'start' });
    formulario.elements.nombreCompleto.focus({ preventScroll: true });
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
  try {
    const { mensaje } = await conBotonOcupado(botonGuardar, 'Guardando...', () => (
      estado.editandoId
        ? clientesApi.actualizar(estado.editandoId, datos)
        : clientesApi.crear(datos)
    ));
    notificar(mensaje);
    modoRegistro();
    await cargarClientes();
  } catch (error) {
    if (error instanceof ApiError && error.detalles) mostrarErroresServidor(formulario, error.detalles);
    notificar(error.message, 'error');
  }
}

// ---------------------------------------------------------------- acciones
async function eliminar(id) {
  const nombre = cuerpoTabla.querySelector(`tr[data-id="${CSS.escape(id)}"] .cliente__nombre`)?.textContent || id;
  const aceptado = await confirmar({
    titulo: 'Eliminar cliente',
    mensaje: `Se eliminará a ${nombre} (${id}). Esta acción no se puede deshacer.`,
    textoConfirmar: 'Eliminar cliente',
    peligro: true,
  });
  if (!aceptado) return;

  try {
    const { mensaje } = await clientesApi.eliminar(id);
    notificar(mensaje);
    if (estado.editandoId === id) modoRegistro();
    await cargarClientes();
  } catch (error) {
    notificar(error.message, 'error');
  }
}

function mostrarDetalle(cliente) {
  estado.detalleId = cliente.id;
  detalleCuerpo.innerHTML = `
    <div class="detalle-cliente__encabezado">
      <span class="cliente__iniciales" aria-hidden="true">${escaparHtml(iniciales(cliente.nombreCompleto))}</span>
      <p class="detalle-cliente__nombre">${escaparHtml(cliente.nombreCompleto)}</p>
    </div>
    <dl class="lista-datos">
      <dt>ID</dt><dd>${escaparHtml(cliente.id)}</dd>
      <dt>Identificación</dt><dd>${escaparHtml(cliente.identificacion)}</dd>
      <dt>Teléfono</dt><dd>${escaparHtml(cliente.telefono)}</dd>
      <dt>Correo</dt><dd>${escaparHtml(cliente.correo)}</dd>
      <dt>Licencia</dt><dd>${escaparHtml(cliente.licencia)}</dd>
      <dt>Registrado</dt><dd>${formatearFecha(cliente.fechaCreacion)}</dd>
      <dt>Última modificación</dt><dd>${formatearFecha(cliente.fechaActualizacion)}</dd>
    </dl>`;
  if (!dialogo.open) dialogo.showModal();
}

async function verDetalle(id) {
  try {
    mostrarDetalle(await clientesApi.obtener(id));
  } catch (error) {
    notificar(error.message, 'error');
  }
}

async function buscarPorIdentificacion(evento) {
  evento.preventDefault();
  const campo = buscadorIdentificacion.elements.identificacion;
  const numero = campo.value.trim();
  if (!numero) {
    notificar('Escriba el número de identificación que desea buscar.', 'error');
    campo.focus();
    return;
  }
  try {
    mostrarDetalle(await clientesApi.buscarPorIdentificacion(numero));
  } catch (error) {
    notificar(error.message, 'error');
  }
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

  formularioFiltros.addEventListener('input', retrasar(cargarClientes, 300));
  formularioFiltros.addEventListener('submit', (evento) => evento.preventDefault());
  buscadorIdentificacion.addEventListener('submit', buscarPorIdentificacion);

  cuerpoTabla.addEventListener('click', (evento) => {
    const boton = evento.target.closest('button[data-accion]');
    if (!boton) return;
    const { id } = boton.closest('tr').dataset;
    if (boton.dataset.accion === 'ver') verDetalle(id);
    if (boton.dataset.accion === 'editar') modoEdicion(id);
    if (boton.dataset.accion === 'eliminar') eliminar(id);
  });

  vacio.addEventListener('click', (evento) => {
    if (evento.target.closest('[data-accion="reintentar"]')) cargarClientes();
  });

  dialogo.querySelectorAll('[data-cerrar]').forEach((boton) => boton.addEventListener('click', () => dialogo.close()));
  document.getElementById('detalle-editar').addEventListener('click', () => modoEdicion(estado.detalleId));
}

iniciarLayout();
registrarEventos();
cargarClientes();
