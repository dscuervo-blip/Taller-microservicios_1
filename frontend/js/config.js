/**
 * Configuración del frontend: dónde está cada microservicio y qué muestra el menú.
 *
 * PARTE 2 (compañero): cuando un microservicio nuevo esté listo, cambie
 * "implementado" a true y agregue la "ruta" de su página. No hace falta tocar
 * ningún otro archivo de la Parte 1 para que aparezca en el menú y en el
 * panel de estado de servicios.
 */

// Se usa el mismo nombre de equipo con el que se abrió la página (localhost,
// 127.0.0.1 o la IP de la red), para que funcione también desde otro equipo.
const HOST = window.location.hostname || 'localhost';
const urlServicio = (puerto) => `http://${HOST}:${puerto}`;

export const SERVICIOS = {
  vehiculos: {
    nombre: 'Vehículos',
    url: urlServicio(3001),
    puerto: 3001,
    implementado: true,
  },
  clientes: {
    nombre: 'Clientes',
    url: urlServicio(3002),
    puerto: 3002,
    implementado: true,
  },
  // ---- Parte 2: responsabilidad del compañero ----
  reservas: {
    nombre: 'Reservas',
    url: urlServicio(3003),
    puerto: 3003,
    implementado: false,
  },
  alquileres: {
    nombre: 'Alquileres',
    url: urlServicio(3004),
    puerto: 3004,
    implementado: false,
  },
  reportes: {
    nombre: 'Reportes',
    url: urlServicio(3005),
    puerto: 3005,
    implementado: false,
  },
};

/**
 * Opciones del menú lateral. "ruta" es relativa a la carpeta frontend/.
 * "servicio" relaciona la opción con un microservicio de SERVICIOS.
 */
export const MENU = [
  {
    titulo: 'General',
    opciones: [
      { clave: 'dashboard', texto: 'Panel principal', icono: 'tablero', ruta: 'index.html' },
    ],
  },
  {
    titulo: 'Administración',
    opciones: [
      { clave: 'vehiculos', texto: 'Vehículos', icono: 'auto', ruta: 'pages/vehiculos.html', servicio: 'vehiculos' },
      { clave: 'clientes', texto: 'Clientes', icono: 'usuarios', ruta: 'pages/clientes.html', servicio: 'clientes' },
    ],
  },
  {
    titulo: 'Operación',
    opciones: [
      { clave: 'reservas', texto: 'Reservas', icono: 'calendario', ruta: 'pages/reservas.html', servicio: 'reservas' },
      { clave: 'alquileres', texto: 'Alquileres', icono: 'llave', ruta: 'pages/alquileres.html', servicio: 'alquileres' },
      { clave: 'reportes', texto: 'Reportes', icono: 'grafica', ruta: 'pages/reportes.html', servicio: 'reportes' },
    ],
  },
];
