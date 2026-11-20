/**
 * Pruebas de integración del microservicio de clientes.
 * Ejecutar desde la raíz del proyecto:  npm test
 */
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { crearAppClientes } = require('../app');
const config = require('../config');
const { levantarServicioDePrueba } = require('../../shared/testing/servidorPrueba');

let api;

before(async () => {
  api = await levantarServicioDePrueba(crearAppClientes, {
    archivoSemilla: config.archivoSemilla,
    nombreArchivo: 'clientes.json',
  });
});

after(async () => {
  await api.cerrar();
});

const nuevoCliente = {
  nombreCompleto: '  Camila   Andrea Rojas  ',
  identificacion: '1.098.765.432',
  telefono: '310 555 1234',
  correo: 'Camila.Rojas@Correo.com',
  licencia: 'lic-1098765432',
};

test('GET /clientes devuelve los datos iniciales', async () => {
  const { status, cuerpo } = await api.pedir('GET', '/clientes');
  assert.equal(status, 200);
  assert.ok(cuerpo.datos.length >= 4);
});

test('CRUD completo de un cliente', async () => {
  const creado = await api.pedir('POST', '/clientes', nuevoCliente);
  assert.equal(creado.status, 201);
  const cliente = creado.cuerpo.datos;
  assert.match(cliente.id, /^CLI-\d{4}$/);
  assert.equal(cliente.nombreCompleto, 'Camila Andrea Rojas');
  assert.equal(cliente.identificacion, '1098765432');
  assert.equal(cliente.telefono, '3105551234');
  assert.equal(cliente.correo, 'camila.rojas@correo.com');
  assert.equal(cliente.licencia, 'LIC-1098765432');

  const porId = await api.pedir('GET', `/clientes/${cliente.id}`);
  assert.equal(porId.status, 200);

  const porIdentificacion = await api.pedir('GET', '/clientes/identificacion/1098765432');
  assert.equal(porIdentificacion.status, 200);
  assert.equal(porIdentificacion.cuerpo.datos.id, cliente.id);

  const editado = await api.pedir('PUT', `/clientes/${cliente.id}`, { ...nuevoCliente, telefono: '3209998877' });
  assert.equal(editado.status, 200);
  assert.equal(editado.cuerpo.datos.telefono, '3209998877');

  const eliminado = await api.pedir('DELETE', `/clientes/${cliente.id}`);
  assert.equal(eliminado.status, 200);
  assert.equal((await api.pedir('GET', `/clientes/${cliente.id}`)).status, 404);
});

test('rechaza clientes incompletos o con formato inválido', async () => {
  const { status, cuerpo } = await api.pedir('POST', '/clientes', {
    nombreCompleto: 'Ana 3',
    identificacion: '12',
    telefono: 'abc',
    correo: 'sin-arroba',
  });
  assert.equal(status, 400);
  ['nombreCompleto', 'identificacion', 'telefono', 'correo', 'licencia'].forEach((campo) => {
    assert.ok(cuerpo.error.detalles[campo], `debe reportar error en ${campo}`);
  });
});

test('no permite identificación, correo ni licencia repetidos', async () => {
  const { status, cuerpo } = await api.pedir('POST', '/clientes', {
    ...nuevoCliente,
    identificacion: '1049632587',
    correo: 'laura.gomez@correo.com',
    licencia: 'LIC-1049632587',
  });
  assert.equal(status, 409);
  assert.ok(cuerpo.error.detalles.identificacion);
  assert.ok(cuerpo.error.detalles.correo);
  assert.ok(cuerpo.error.detalles.licencia);
});

test('al editar, un cliente puede conservar sus propios datos únicos', async () => {
  const { status } = await api.pedir('PUT', '/clientes/CLI-0001', { telefono: '3110000000' });
  assert.equal(status, 200);
});

test('busca por texto y por identificación inexistente', async () => {
  const busqueda = await api.pedir('GET', '/clientes?buscar=perez');
  assert.ok(busqueda.cuerpo.datos.some((c) => c.id === 'CLI-0003'));

  const inexistente = await api.pedir('GET', '/clientes/identificacion/999999999');
  assert.equal(inexistente.status, 404);
});

test('GET /clientes/resumen devuelve el total', async () => {
  const lista = await api.pedir('GET', '/clientes');
  const resumen = await api.pedir('GET', '/clientes/resumen');
  assert.equal(resumen.cuerpo.datos.total, lista.cuerpo.datos.length);
});
