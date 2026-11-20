/**
 * Pruebas de integración del microservicio de vehículos.
 * Ejecutar desde la raíz del proyecto:  npm test
 */
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { crearAppVehiculos } = require('../app');
const config = require('../config');
const { levantarServicioDePrueba } = require('../../shared/testing/servidorPrueba');

let api;

before(async () => {
  api = await levantarServicioDePrueba(crearAppVehiculos, {
    archivoSemilla: config.archivoSemilla,
    nombreArchivo: 'vehiculos.json',
  });
});

after(async () => {
  await api.cerrar();
});

const nuevoVehiculo = {
  marca: 'Hyundai',
  modelo: 'Accent',
  anio: 2023,
  placa: 'xyz 987',
  categoria: 'Sedán',
  descripcion: 'Sedán de prueba automatizada.',
};

test('GET /salud responde que el servicio está activo', async () => {
  const { status, cuerpo } = await api.pedir('GET', '/salud');
  assert.equal(status, 200);
  assert.equal(cuerpo.datos.estado, 'activo');
});

test('GET /vehiculos devuelve los datos iniciales', async () => {
  const { status, cuerpo } = await api.pedir('GET', '/vehiculos');
  assert.equal(status, 200);
  assert.equal(cuerpo.ok, true);
  assert.ok(cuerpo.datos.length >= 6);
});

test('CRUD completo de un vehículo', async () => {
  // Crear
  const creado = await api.pedir('POST', '/vehiculos', nuevoVehiculo);
  assert.equal(creado.status, 201);
  const vehiculo = creado.cuerpo.datos;
  assert.match(vehiculo.id, /^VEH-\d{4}$/);
  assert.equal(vehiculo.placa, 'XYZ987', 'la placa se normaliza');
  assert.equal(vehiculo.estado, 'Disponible', 'estado por defecto');

  // Buscar por ID
  const encontrado = await api.pedir('GET', `/vehiculos/${vehiculo.id}`);
  assert.equal(encontrado.status, 200);
  assert.equal(encontrado.cuerpo.datos.modelo, 'Accent');

  // Editar
  const editado = await api.pedir('PUT', `/vehiculos/${vehiculo.id}`, { ...nuevoVehiculo, modelo: 'Accent Vision' });
  assert.equal(editado.status, 200);
  assert.equal(editado.cuerpo.datos.modelo, 'Accent Vision');
  assert.equal(editado.cuerpo.datos.fechaCreacion, vehiculo.fechaCreacion);

  // Cambiar estado y consultarlo
  const cambio = await api.pedir('PATCH', `/vehiculos/${vehiculo.id}/estado`, { estado: 'En mantenimiento' });
  assert.equal(cambio.status, 200);
  const estado = await api.pedir('GET', `/vehiculos/${vehiculo.id}/estado`);
  assert.deepEqual(estado.cuerpo.datos, {
    id: vehiculo.id, placa: 'XYZ987', estado: 'En mantenimiento', disponible: false,
  });

  // Eliminar
  const eliminado = await api.pedir('DELETE', `/vehiculos/${vehiculo.id}`);
  assert.equal(eliminado.status, 200);
  const despues = await api.pedir('GET', `/vehiculos/${vehiculo.id}`);
  assert.equal(despues.status, 404);
});

test('rechaza registros incompletos con errores por campo', async () => {
  const { status, cuerpo } = await api.pedir('POST', '/vehiculos', { marca: 'X' });
  assert.equal(status, 400);
  assert.equal(cuerpo.error.codigo, 'VALIDACION');
  ['marca', 'modelo', 'anio', 'placa', 'categoria', 'descripcion'].forEach((campo) => {
    assert.ok(cuerpo.error.detalles[campo], `debe reportar error en ${campo}`);
  });
});

test('rechaza placas duplicadas', async () => {
  const { status, cuerpo } = await api.pedir('POST', '/vehiculos', { ...nuevoVehiculo, placa: 'KLM482' });
  assert.equal(status, 409);
  assert.ok(cuerpo.error.detalles.placa);
});

test('rechaza estados no permitidos', async () => {
  const { status } = await api.pedir('PATCH', '/vehiculos/VEH-0001/estado', { estado: 'Perdido' });
  assert.equal(status, 400);
});

test('no permite eliminar un vehículo alquilado', async () => {
  const { status } = await api.pedir('DELETE', '/vehiculos/VEH-0002');
  assert.equal(status, 409);
});

test('filtra y ordena (clasificar por marca, año, categoría y estado)', async () => {
  const porMarca = await api.pedir('GET', '/vehiculos?marca=renault');
  assert.ok(porMarca.cuerpo.datos.length >= 2);
  assert.ok(porMarca.cuerpo.datos.every((v) => v.marca === 'Renault'));

  const porCategoria = await api.pedir('GET', `/vehiculos?categoria=${encodeURIComponent('SUV')}&estado=Disponible`);
  assert.ok(porCategoria.cuerpo.datos.every((v) => v.categoria === 'SUV' && v.estado === 'Disponible'));

  const ordenados = await api.pedir('GET', '/vehiculos?ordenarPor=anio&orden=desc');
  const anios = ordenados.cuerpo.datos.map((v) => v.anio);
  assert.deepEqual(anios, [...anios].sort((a, b) => b - a));

  const agrupados = await api.pedir('GET', '/vehiculos/clasificacion/categoria');
  assert.equal(agrupados.cuerpo.datos.criterio, 'categoria');
  assert.ok(agrupados.cuerpo.datos.grupos.length > 0);

  const invalido = await api.pedir('GET', '/vehiculos/clasificacion/color');
  assert.equal(invalido.status, 400);
});

test('GET /vehiculos/resumen cuenta los vehículos por estado', async () => {
  const { cuerpo } = await api.pedir('GET', '/vehiculos/resumen');
  const { total, porEstado } = cuerpo.datos;
  assert.equal(total, porEstado.Disponible + porEstado.Alquilado + porEstado['En mantenimiento']);
});

test('responde 404 con JSON en rutas inexistentes y 400 con JSON inválido', async () => {
  const inexistente = await api.pedir('GET', '/no-existe');
  assert.equal(inexistente.status, 404);
  assert.equal(inexistente.cuerpo.ok, false);

  const malFormado = await api.pedir('POST', '/vehiculos', '{ esto no es json');
  assert.equal(malFormado.status, 400);
});
