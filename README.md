# Gestor de Alquiler de Vehículos

Aplicación web para administrar la flota y los clientes de una empresa de alquiler de vehículos,
construida con **arquitectura de microservicios** usando solo HTML5, CSS3, JavaScript y JSON.

El proyecto está dividido en dos partes:

| Parte | Responsable | Contenido | Estado |
|-------|-------------|-----------|--------|
| **Parte 1** | Estudiante 1 | Microservicio de vehículos, microservicio de clientes, interfaz de administración | ✅ Terminada |
| **Parte 2** | Estudiante 2 | Microservicios de reservas, alquileres/devoluciones y reportes | 📐 Estructura y contratos listos |

---

## 1. Objetivo general

Desarrollar un sistema que permita registrar, consultar, editar y eliminar vehículos y clientes,
donde cada responsabilidad del negocio vive en un microservicio independiente que se comunica
mediante peticiones HTTP y respuestas JSON, y que pueda ampliarse con nuevos servicios sin
modificar los existentes.

## 2. Tecnologías

| Tecnología | Uso |
|------------|-----|
| **HTML5** | Estructura de las páginas (`frontend/index.html`, `frontend/pages/*.html`) |
| **CSS3** | Estilos en archivos `.css` separados (sin `<style>` ni atributos `style`) |
| **JavaScript** | Frontend con módulos ES (`frontend/js`) y microservicios con **Node.js** (`microservices/`) |
| **JSON** | Formato de todas las respuestas HTTP y almacenamiento de datos por servicio |

Sin frameworks (ni React, Angular, Vue, Bootstrap, Tailwind ni Express).
Los servidores usan solo el módulo `http` que trae Node.js, por eso **no hay que instalar dependencias**.

## 3. Arquitectura

```
                         Navegador (http://localhost:3000)
                    ┌──────────────────────────────────────┐
                    │  frontend/  HTML + CSS + JS (módulos) │
                    │  js/api.js = único punto de fetch()   │
                    └───────┬─────────────────┬────────────┘
                 HTTP + JSON│                 │HTTP + JSON
              ┌─────────────▼──────┐   ┌──────▼─────────────┐
   PARTE 1    │ vehiculos-service  │   │ clientes-service   │
              │ puerto 3001        │   │ puerto 3002        │
              │ data/vehiculos.json│   │ data/clientes.json │
              └─────────▲──────────┘   └──────────▲─────────┘
                        │  HTTP + JSON (solo lectura y PATCH de estado)
              ┌─────────┴──────────┬──────────────┴──────┬──────────────────┐
   PARTE 2    │ reservas-service   │ alquileres-service  │ reportes-service │
  (pendiente) │ puerto 3003        │ puerto 3004         │ puerto 3005      │
              └────────────────────┴─────────────────────┴──────────────────┘
```

Cada microservicio:

- Es un **proceso independiente** con su propio `server.js`, puerto y archivo de datos.
- No lee los datos de otro servicio: si los necesita, los pide por HTTP.
- Sigue las mismas capas, cada una con una sola responsabilidad:

```
server.js  →  routes/  →  controllers/  →  services/  →  repositories/  →  data/*.json
(arranque)    (URL→fn)    (HTTP↔datos)     (reglas)       (acceso a datos)
                                ↑
                            models/ (campos permitidos y validación)
```

`microservices/shared/` contiene piezas **genéricas** que no conocen ningún dominio
(enrutador, servidor con CORS y manejo de errores, formato de respuestas, validadores,
repositorio JSON). Se comparten para no duplicar código; las reglas de negocio de cada
servicio nunca se mezclan.

### Puertos

| Servicio | Puerto | Variable de entorno | Parte |
|----------|--------|---------------------|-------|
| frontend | 3000 | `FRONTEND_PORT` | 1 |
| vehiculos-service | 3001 | `VEHICULOS_PORT` | 1 |
| clientes-service | 3002 | `CLIENTES_PORT` | 1 |
| reservas-service | 3003 | `RESERVAS_PORT` | 2 |
| alquileres-service | 3004 | `ALQUILERES_PORT` | 2 |
| reportes-service | 3005 | `REPORTES_PORT` | 2 |

## 4. Función de cada microservicio

- **vehiculos-service**: registro, consulta, búsqueda por ID, edición y eliminación de vehículos;
  filtros y clasificación por marca, modelo, año, categoría y estado; consulta y cambio de estado;
  resumen para el panel. Reglas: placa única, año entre 1980 y el año siguiente, categoría y estado
  dentro de los valores permitidos, no se elimina un vehículo `Alquilado`.
- **clientes-service**: registro, consulta, búsqueda por número de identificación, actualización y
  eliminación de clientes. Reglas: identificación, correo y licencia únicos; formatos válidos de
  teléfono, correo y licencia; el nombre no admite números.
- **reservas / alquileres / reportes** (Parte 2): ver el `README.md` de cada carpeta.

## 5. Estructura de carpetas

```
Taller-microservicios/
├── package.json              # scripts: start, test, vehiculos, clientes, frontend
├── servicios.json            # qué procesos inicia "npm start" (y sus puertos)
├── scripts/iniciar-todo.js   # inicia todos los servicios implementados
├── frontend/
│   ├── index.html            # panel principal (dashboard)
│   ├── server.js             # servidor estático del frontend (puerto 3000)
│   ├── pages/
│   │   ├── vehiculos.html
│   │   └── clientes.html
│   ├── css/
│   │   ├── styles.css        # variables, estructura y componentes comunes
│   │   ├── dashboard.css
│   │   ├── vehiculos.css
│   │   └── clientes.css
│   ├── js/
│   │   ├── config.js         # URLs de los servicios y opciones del menú
│   │   ├── api.js            # cliente HTTP (único archivo con fetch)
│   │   ├── ui.js             # notificaciones, confirmaciones, formato, íconos
│   │   ├── formularios.js    # validación y lectura de formularios
│   │   ├── layout.js         # menú lateral, menú móvil, estado de servicios
│   │   ├── app.js            # lógica del dashboard
│   │   ├── vehiculos.js
│   │   └── clientes.js
│   └── assets/icons.svg      # íconos SVG
└── microservices/
    ├── shared/               # utilidades genéricas reutilizables
    │   ├── errors/AppError.js
    │   ├── http/             # Router, crearServidor, respuestas, cuerpo
    │   ├── storage/JsonFileRepository.js
    │   ├── utils/            # validacion, listas
    │   └── testing/          # ayuda para pruebas automáticas
    ├── vehiculos-service/
    │   ├── server.js · app.js · config.js · package.json
    │   ├── models/ · repositories/ · services/ · controllers/ · routes/
    │   ├── data/vehiculos.seed.json   # datos iniciales de demostración
    │   └── tests/vehiculos.test.js
    ├── clientes-service/              # misma estructura
    ├── reservas-service/README.md     # Parte 2
    ├── alquileres-service/README.md   # Parte 2
    └── reportes-service/README.md     # Parte 2
```

## 6. Instalación

Requisito: **Node.js 18 o superior** (`node --version`).

```bash
git clone https://github.com/dscuervo-blip/Taller-microservicios.git
cd Taller-microservicios
```

No hay paquetes que instalar (`npm install` no es necesario).

## 7. Ejecución

**Todo a la vez** (frontend + vehículos + clientes, cada uno en su propio proceso):

```bash
npm start
```

**Cada servicio por separado** (una terminal por servicio):

```bash
npm run vehiculos
```

```bash
npm run clientes
```

```bash
npm run frontend
```

También se puede entrar a la carpeta del servicio y ejecutar `npm start` (o `node server.js`).
Se detienen con `Ctrl + C`.

## 8. Abrir la aplicación

- Con el servidor del frontend: **http://localhost:3000**
- O con Apache de XAMPP (el proyecto está en `htdocs`): **http://localhost/Taller-microservicios/frontend/**
  (los microservicios deben estar ejecutándose igualmente).

La barra superior muestra en verde los servicios que responden. Si uno está apagado, la página
lo indica y el resto sigue funcionando.

## 9. Endpoints

### Formato de respuesta (todos los servicios)

```json
{ "ok": true, "mensaje": "Vehículo registrado correctamente.", "datos": { "...": "..." } }
```

```json
{ "ok": false, "error": { "codigo": "VALIDACION", "mensaje": "Los datos enviados no son válidos.",
  "detalles": { "placa": "La placa debe tener entre 5 y 8 caracteres..." } } }
```

Códigos HTTP usados: `200` OK, `201` creado, `400` datos inválidos, `404` no existe,
`405` método no permitido, `409` conflicto (duplicado o regla de negocio), `500` error interno.
Todos los servicios responden también `GET /salud` y `GET /` (lista de endpoints).

### Vehículos — `http://localhost:3001`

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/vehiculos` | Listar. Filtros opcionales: `marca`, `modelo`, `anio`, `categoria`, `estado`, `buscar`; orden: `ordenarPor` (`marca`, `modelo`, `anio`, `categoria`, `estado`, `placa`, `id`, `fechaCreacion`) y `orden` (`asc`/`desc`) |
| GET | `/vehiculos/:id` | Buscar por ID |
| POST | `/vehiculos` | Registrar |
| PUT | `/vehiculos/:id` | Editar |
| DELETE | `/vehiculos/:id` | Eliminar (409 si está alquilado) |
| GET | `/vehiculos/:id/estado` | Estado actual: `{ id, placa, estado, disponible }` |
| PATCH | `/vehiculos/:id/estado` | Cambiar solo el estado: `{ "estado": "Alquilado" }` |
| GET | `/vehiculos/clasificacion/:campo` | Agrupar por `marca`, `modelo`, `anio`, `categoria` o `estado` |
| GET | `/vehiculos/resumen` | Totales por estado, categoría y marca |
| GET | `/vehiculos/catalogos` | Estados, categorías y rango de años permitidos |

Cuerpo de `POST`/`PUT`:

```json
{ "marca": "Chevrolet", "modelo": "Onix", "anio": 2024, "placa": "ABC123",
  "categoria": "Sedán", "descripcion": "Automático, 5 pasajeros", "estado": "Disponible" }
```

Estados: `Disponible`, `Alquilado`, `En mantenimiento`.
Categorías: `Económico`, `Sedán`, `Hatchback`, `SUV`, `Camioneta`, `Van`, `Deportivo`, `Lujo`.

### Clientes — `http://localhost:3002`

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/clientes` | Listar. Filtros: `buscar`, `ordenarPor` (`id`, `nombreCompleto`, `identificacion`, `correo`, `fechaCreacion`), `orden` |
| GET | `/clientes/:id` | Buscar por ID |
| GET | `/clientes/identificacion/:numero` | Buscar por número de identificación |
| POST | `/clientes` | Registrar |
| PUT | `/clientes/:id` | Actualizar |
| DELETE | `/clientes/:id` | Eliminar |
| GET | `/clientes/resumen` | `{ total }` |

```json
{ "nombreCompleto": "Laura Gómez", "identificacion": "1049632587", "telefono": "3104567821",
  "correo": "laura@correo.com", "licencia": "LIC-1049632587" }
```

### Probar los endpoints desde la terminal

```bash
curl http://localhost:3001/vehiculos?estado=Disponible
```

```bash
curl -X POST http://localhost:3001/vehiculos -H "Content-Type: application/json" -d "{\"marca\":\"Kia\",\"modelo\":\"Rio\",\"anio\":2024,\"placa\":\"XYZ789\",\"categoria\":\"Sedán\",\"descripcion\":\"Vehículo de prueba\"}"
```

```bash
curl -X PATCH http://localhost:3001/vehiculos/VEH-0001/estado -H "Content-Type: application/json" -d "{\"estado\":\"En mantenimiento\"}"
```

## 10. Pruebas automáticas

```bash
npm test
```

Ejecuta 17 pruebas de integración (`node:test`, incluido en Node) que levantan cada servicio con
un archivo de datos **temporal** y verifican el CRUD completo, las validaciones, los duplicados,
los filtros, la clasificación, el resumen y los errores. No modifican los datos reales.

## 11. Cómo probar cada funcionalidad en la interfaz

| Funcionalidad | Dónde | Qué hacer |
|---------------|-------|-----------|
| Estadísticas reales | Panel principal | Registre o elimine un vehículo y pulse **Actualizar**: las cifras cambian |
| Registrar vehículo | Vehículos → formulario | Llene los campos; pruebe enviar vacío para ver las validaciones |
| Placa duplicada | Vehículos | Registre otra vez la placa `KLM482`: aparece el error bajo el campo Placa |
| Consultar / clasificar | Vehículos → tabla | Use los filtros de marca, modelo, año, categoría y estado, o pulse los encabezados para ordenar |
| Buscar por ID | Vehículos → "Buscar por ID" | Escriba `VEH-0001` |
| Consultar y cambiar estado | Vehículos → ícono 👁 | El detalle muestra el estado y permite cambiarlo |
| Editar / eliminar | Vehículos → íconos ✏️ / 🗑 | Eliminar `VEH-0002` (alquilado) muestra que no está permitido |
| Registrar cliente | Clientes → formulario | Pruebe un correo sin `@` o una identificación repetida (`1049632587`) |
| Buscar por identificación | Clientes → "Buscar" | Escriba `1049632587` (también acepta `1.049.632.587`) |
| Editar / eliminar cliente | Clientes → íconos | Desde la tabla o desde el detalle |
| Servicio caído | Cualquier página | Detenga `clientes-service`: la pastilla se pone roja y la página explica el problema |

## 12. Almacenamiento en JSON y paso a una base de datos

Cada servicio guarda sus datos en **su propio** archivo (`data/vehiculos.json`, `data/clientes.json`).
La primera vez se crean copiando `*.seed.json` (datos de demostración). Para volver a los datos
iniciales basta con borrar el archivo `data/*.json` (no el `.seed.json`) y reiniciar el servicio.
Los archivos generados están en `.gitignore`.

**Limitaciones de los archivos JSON** (solución educativa):

- Se lee y escribe el archivo completo en cada operación: no escala a muchos registros.
- Un solo proceso puede escribir con seguridad (las escrituras se encolan dentro del proceso,
  pero dos instancias del mismo servicio podrían pisarse).
- No hay transacciones, índices, consultas complejas ni respaldo automático.
- La unicidad (placa, identificación) se verifica en código, no con restricciones de la base de datos.

**Cómo migrar**: solo la capa `repositories/` sabe que existe un archivo. Basta con crear, por
ejemplo, `MysqlVehiculosRepository` con los mismos métodos (`listar`, `buscarPorId`, `buscarUno`,
`crear`, `actualizar`, `eliminar`) y usarlo en `repositories/vehiculos.repository.js`. Servicios,
controladores, rutas y frontend no cambian. Cada microservicio debería tener su propia base de datos.

## 13. División del trabajo

### Archivos de la Parte 1 (no deben modificarse en la Parte 2)

- `microservices/vehiculos-service/**`
- `microservices/clientes-service/**`
- `microservices/shared/**` (se pueden **usar**; si hace falta algo nuevo, agréguelo en un archivo nuevo)
- `frontend/index.html`, `frontend/pages/vehiculos.html`, `frontend/pages/clientes.html`
- `frontend/css/*.css` y `frontend/js/{api,ui,formularios,layout,app,vehiculos,clientes}.js`

### Lo que la Parte 2 sí toca (solo configuración)

- `servicios.json`: poner `"implementado": true` en su servicio.
- `frontend/js/config.js`: poner `implementado: true` en su servicio (aparece en el menú y en el panel).
- `package.json`: agregar su archivo de pruebas al script `test`.

### Lo que la Parte 2 crea

- `microservices/reservas-service/`, `alquileres-service/`, `reportes-service/` (diseño en el README de cada uno).
- `frontend/pages/{reservas,alquileres,reportes}.html`, sus `.css` y `.js`.
- `frontend/js/{reservas,alquileres,reportes}-api.js` usando `solicitar()` exportado por `api.js`.

## 14. Cómo se integran los futuros microservicios

La Parte 2 se conecta **solo por HTTP** a los endpoints ya publicados; no necesita cambiar código de la Parte 1:

| Servicio futuro | Usa de la Parte 1 |
|-----------------|-------------------|
| Reservas | `GET /clientes`, `GET /clientes/:id`, `GET /vehiculos?estado=Disponible`, `GET /vehiculos/:id/estado` |
| Alquileres | `GET /vehiculos/:id/estado`, `PATCH /vehiculos/:id/estado` (Alquilado → Disponible / En mantenimiento), `GET /clientes/:id` |
| Reportes | `GET /vehiculos`, `GET /vehiculos/resumen`, `GET /vehiculos/clasificacion/:campo`, `GET /clientes`, `GET /clientes/resumen` |

Pasos para activar un servicio nuevo:

1. Crear el servicio copiando la estructura de `vehiculos-service` y usando `microservices/shared/`.
2. Marcarlo como implementado en `servicios.json` → `npm start` lo inicia.
3. Marcarlo como implementado en `frontend/js/config.js` → aparece en el menú y en el estado de servicios.
4. Crear su página en `frontend/pages/` copiando la estructura de `clientes.html`
   (`<body data-pagina="reservas" data-raiz="../">` y `iniciarLayout()`).

**Mejora futura acordada**: cuando exista `reservas-service`, conviene impedir eliminar un cliente o
un vehículo con reservas activas. Se puede hacer agregando una consulta HTTP opcional a
`GET /reservas?clienteId=...` en el servicio correspondiente, activada por configuración.
