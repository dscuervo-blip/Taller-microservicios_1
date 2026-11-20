# reservas-service (Parte 2, pendiente)

> **Responsable:** compañero (Parte 2). Esta carpeta solo contiene el diseño acordado.
> No modifique `vehiculos-service` ni `clientes-service`: todo lo que necesita está expuesto por sus endpoints.

## Responsabilidad

Registrar y cancelar reservas de un vehículo para un cliente entre dos fechas, sin permitir que dos reservas se crucen para el mismo vehículo.

| Dato | Valor |
|------|-------|
| Puerto | **3003** (variable `RESERVAS_PORT`) |
| Prefijo de ID | `RES-0001` |
| Archivo de datos | `data/reservas.json` (semilla en `data/reservas.seed.json`) |

## Estructura sugerida (igual a los servicios de la Parte 1)

```
reservas-service/
├── server.js            # iniciarServidor(crearAppReservas(), config)
├── app.js               # repositorio -> servicio -> controlador -> rutas
├── config.js            # nombre, puerto, archivoDatos, archivoSemilla, URLs de otros servicios
├── models/reserva.model.js
├── repositories/reservas.repository.js   # new JsonFileRepository({ prefijoId: 'RES', ... })
├── services/reservas.service.js          # reglas de negocio
├── clients/                               # llamadas HTTP a vehiculos-service y clientes-service
├── controllers/reservas.controller.js
├── routes/reservas.routes.js
├── data/reservas.seed.json
└── tests/reservas.test.js
```

Reutilice `microservices/shared/` (Router, crearServidor, respuestas, AppError, JsonFileRepository, validacion).
Copiar `vehiculos-service` y renombrar es el camino más rápido.

## Modelo de datos

```json
{
  "id": "RES-0001",
  "clienteId": "CLI-0001",
  "vehiculoId": "VEH-0003",
  "fechaInicio": "2026-12-01",
  "fechaFin": "2026-12-05",
  "estado": "Activa",
  "fechaCreacion": "...",
  "fechaActualizacion": "..."
}
```

Estados sugeridos: `Activa`, `Cancelada`, `Finalizada`.

## Endpoints propuestos

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/reservas` | Listar (filtros opcionales `clienteId`, `vehiculoId`, `estado`) |
| GET | `/reservas/:id` | Consultar una reserva |
| POST | `/reservas` | Registrar reserva |
| PATCH | `/reservas/:id/cancelar` | Cancelar reserva |
| GET | `/reservas/disponibilidad?vehiculoId=&fechaInicio=&fechaFin=` | ¿El vehículo está libre en esas fechas? |

## Integración con la Parte 1 (solo por HTTP)

| Necesidad | Llamada | Respuesta útil |
|-----------|---------|----------------|
| Validar que el cliente existe | `GET http://localhost:3002/clientes/:id` | 404 si no existe |
| Listar clientes para el `<select>` | `GET http://localhost:3002/clientes` | `datos: [...]` |
| Listar vehículos disponibles | `GET http://localhost:3001/vehiculos?estado=Disponible` | `datos: [...]` |
| Validar el vehículo | `GET http://localhost:3001/vehiculos/:id/estado` | `{ estado, disponible }` |

Regla de cruce de fechas para el mismo vehículo (reservas activas):
`nuevaInicio <= existenteFin && nuevaFin >= existenteInicio` → rechazar con `409 CONFLICTO`.

Todas las respuestas usan el formato común:
`{ "ok": true, "mensaje": "...", "datos": ... }` o `{ "ok": false, "error": { "codigo", "mensaje", "detalles" } }`.

## Activarlo cuando esté listo

1. En `servicios.json` (raíz): `"implementado": true` en `reservas` → `npm start` lo inicia.
2. En `frontend/js/config.js`: `implementado: true` en `SERVICIOS.reservas` → aparece en el menú y en el panel.
3. Crear `frontend/pages/reservas.html`, `frontend/css/reservas.css` y `frontend/js/reservas.js` copiando la estructura de `pages/clientes.html`.
4. Crear `frontend/js/reservas-api.js` usando `solicitar('reservas', '/reservas', ...)` exportado por `api.js`.
5. Agregar el archivo de pruebas al script `test` del `package.json` raíz.
