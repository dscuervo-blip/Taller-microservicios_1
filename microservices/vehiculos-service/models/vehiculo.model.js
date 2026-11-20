/**
 * Modelo de Vehículo
 * Define los valores permitidos, cómo se limpian los datos que llegan y cómo
 * se validan. Toda regla sobre "qué es un vehículo válido" vive aquí.
 */
const {
  limpiarTexto,
  validarTexto,
  validarPatron,
  validarEntero,
  validarOpcion,
  recolectarErrores,
} = require('../../shared/utils/validacion');

const ESTADOS = Object.freeze({
  DISPONIBLE: 'Disponible',
  ALQUILADO: 'Alquilado',
  MANTENIMIENTO: 'En mantenimiento',
});

const LISTA_ESTADOS = Object.values(ESTADOS);

const CATEGORIAS = Object.freeze([
  'Económico',
  'Sedán',
  'Hatchback',
  'SUV',
  'Camioneta',
  'Van',
  'Deportivo',
  'Lujo',
]);

/** Campos por los que se puede ordenar o agrupar la lista ("clasificar"). */
const CAMPOS_CLASIFICACION = Object.freeze(['marca', 'modelo', 'anio', 'categoria', 'estado']);
const CAMPOS_ORDEN = Object.freeze([...CAMPOS_CLASIFICACION, 'placa', 'id', 'fechaCreacion']);

const ANIO_MINIMO = 1980;
const anioMaximo = () => new Date().getFullYear() + 1;

// Placa: letras, números y guiones, entre 5 y 8 caracteres (p. ej. ABC123, ABC-12D).
const PATRON_PLACA = /^[A-Z0-9-]{5,8}$/;

/** Normaliza la placa: mayúsculas y sin espacios. */
function normalizarPlaca(placa) {
  return limpiarTexto(placa).toUpperCase().replace(/\s+/g, '');
}

/** Toma solo los campos conocidos y los limpia. */
function normalizarVehiculo(datos) {
  return {
    marca: limpiarTexto(datos.marca),
    modelo: limpiarTexto(datos.modelo),
    anio: limpiarTexto(datos.anio) === '' ? '' : Number(datos.anio),
    placa: normalizarPlaca(datos.placa),
    categoria: limpiarTexto(datos.categoria),
    descripcion: limpiarTexto(datos.descripcion),
    estado: limpiarTexto(datos.estado) || ESTADOS.DISPONIBLE,
  };
}

/** Valida un vehículo ya normalizado. Devuelve { campo: mensaje } o null. */
function validarVehiculo(vehiculo) {
  return recolectarErrores({
    marca: validarTexto(vehiculo.marca, { etiqueta: 'La marca', min: 2, max: 40 }),
    modelo: validarTexto(vehiculo.modelo, { etiqueta: 'El modelo', min: 1, max: 40 }),
    anio: validarEntero(vehiculo.anio, { etiqueta: 'El año', min: ANIO_MINIMO, max: anioMaximo() }),
    placa: validarPatron(vehiculo.placa, {
      etiqueta: 'La placa',
      patron: PATRON_PLACA,
      mensaje: 'La placa debe tener entre 5 y 8 caracteres (letras, números o guiones).',
    }),
    categoria: validarOpcion(vehiculo.categoria, { etiqueta: 'La categoría', opciones: CATEGORIAS }),
    descripcion: validarTexto(vehiculo.descripcion, { etiqueta: 'La descripción', min: 5, max: 300 }),
    estado: validarOpcion(vehiculo.estado, { etiqueta: 'El estado', opciones: LISTA_ESTADOS }),
  });
}

module.exports = {
  ESTADOS,
  LISTA_ESTADOS,
  CATEGORIAS,
  CAMPOS_CLASIFICACION,
  CAMPOS_ORDEN,
  ANIO_MINIMO,
  anioMaximo,
  normalizarPlaca,
  normalizarVehiculo,
  validarVehiculo,
};
