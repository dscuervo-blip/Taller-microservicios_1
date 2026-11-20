/**
 * Utilidades para ordenar y agrupar listas de registros.
 * Las usan los servicios para "clasificar" la información (por marca, año, etc.).
 */
const { normalizarComparacion } = require('./validacion');

/**
 * Devuelve una copia de la lista ordenada por un campo.
 * Los números se comparan como números y los textos sin importar mayúsculas/tildes.
 */
function ordenarPor(lista, campo, orden = 'asc') {
  const factor = orden === 'desc' ? -1 : 1;
  return [...lista].sort((a, b) => {
    const va = a[campo];
    const vb = b[campo];
    if (typeof va === 'number' && typeof vb === 'number') return (va - vb) * factor;
    return normalizarComparacion(va).localeCompare(normalizarComparacion(vb), 'es') * factor;
  });
}

/**
 * Agrupa una lista por el valor de un campo.
 * @returns {Array<{valor: any, cantidad: number, registros: Array}>}
 */
function agruparPor(lista, campo) {
  const grupos = new Map();
  lista.forEach((registro) => {
    const valor = registro[campo];
    if (!grupos.has(valor)) grupos.set(valor, []);
    grupos.get(valor).push(registro);
  });
  return [...grupos.entries()]
    .map(([valor, registros]) => ({ valor, cantidad: registros.length, registros }))
    .sort((a, b) => b.cantidad - a.cantidad || String(a.valor).localeCompare(String(b.valor), 'es'));
}

/** Cuenta cuántos registros hay por cada valor de un campo: { valor: cantidad } */
function contarPor(lista, campo, valoresIniciales = []) {
  const conteo = Object.fromEntries(valoresIniciales.map((v) => [v, 0]));
  lista.forEach((registro) => {
    const valor = registro[campo];
    conteo[valor] = (conteo[valor] || 0) + 1;
  });
  return conteo;
}

module.exports = { ordenarPor, agruparPor, contarPor };
