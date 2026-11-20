# alquileres-service (Parte 2, pendiente)

> **Responsable:** compañero (Parte 2). Esta carpeta solo contiene el diseño acordado.
> No modifique `vehiculos-service`: el cambio de estado del vehículo ya está disponible con `PATCH /vehiculos/:id/estado`.

## Responsabilidad

Registrar la entrega (salida) y la devolución de un vehículo, con sus novedades, y mantener el historial de alquileres.
Al entregar o devolver, actualiza automáticamente el estado del vehículo en `vehiculos-service`.

| Dato | Valor |
|------|-------|
| Puerto | **3004** (variable `ALQUILERES_PORT`) |
| Prefijo de ID | `ALQ-0001` |
| Archivo de datos | `data/alquileres.json` |

## Estructura sugerida

La misma de `vehiculos-service` (server, app, config, models, repositories, services, clients, controllers, routes, data, tests), reutilizando `microservices/shared/`.

## Modelo de datos

```json
{
  "id": "ALQ-0001",
  "reservaId": "RES-0001",
  "clienteId": "CLI-0001",
  "vehiculoId": "VEH-0003",
  "fechaEntrega": "2026-12-01T09:00:00.000Z",
  "fechaDevolucion": null,
  "kilometrajeEntrega": 15200,
  "kilometrajeDevolucion": null,
  "novedades": [],
  "estado": "En curso"
}
```

Estados sugeridos: `En curso`, `Finalizado`. Cada novedad: `{ "tipo": "Daño" | "Combustible" | "Limpieza" | "Otro", "descripcion": "...", "fecha": "..." }`.

## Endpoints propuestos

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/alquileres` | Historial (filtros `clienteId`, `vehiculoId`, `estado`) |
| GET | `/alquileres/:id` | Detalle |
| POST | `/alquileres` | Registrar entrega del vehículo |
| PATCH | `/alquileres/:id/devolucion` | Registrar devolución y novedades |

## Integración con la Parte 1

| Momento | Llamada a vehiculos-service (puerto 3001) |
|---------|-------------------------------------------|
| Antes de entregar | `GET /vehiculos/:id/estado` → debe tener `disponible: true` |
| Al entregar | `PATCH /vehiculos/:id/estado` con `{ "estado": "Alquilado" }` |
| Al devolver sin novedades | `PATCH /vehiculos/:id/estado` con `{ "estado": "Disponible" }` |
| Al devolver con daños | `PATCH /vehiculos/:id/estado` con `{ "estado": "En mantenimiento" }` |

Validar el cliente con `GET http://localhost:3002/clientes/:id`.

> `vehiculos-service` ya impide eliminar un vehículo en estado `Alquilado` (responde `409`),
> así que un vehículo entregado no puede borrarse hasta registrar su devolución.

Si la llamada a `vehiculos-service` falla, no guarde el alquiler (o reviértalo) para no dejar datos inconsistentes.

## Activarlo

Igual que en `reservas-service/README.md`: `servicios.json` → `implementado: true`, `frontend/js/config.js` → `implementado: true`, y crear sus páginas y `js/alquileres-api.js`.
