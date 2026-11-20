# reportes-service (Parte 2, pendiente)

> **Responsable:** compañero (Parte 2). Esta carpeta solo contiene el diseño acordado.

## Responsabilidad

Generar reportes **de solo lectura** combinando datos de los demás microservicios. No guarda datos propios:
consulta a los otros servicios por HTTP y calcula los resultados.

| Dato | Valor |
|------|-------|
| Puerto | **3005** (variable `REPORTES_PORT`) |
| Almacenamiento | Ninguno (agrega datos de otros servicios) |

## Endpoints propuestos y fuentes de datos

| Reporte | Endpoint propuesto | Fuente |
|---------|-------------------|--------|
| Historial de alquileres | `GET /reportes/historial-alquileres` | `GET :3004/alquileres` + nombres de `:3002/clientes` y placas de `:3001/vehiculos` |
| Vehículos más alquilados | `GET /reportes/vehiculos-mas-alquilados?limite=5` | `GET :3004/alquileres` agrupado por `vehiculoId` |
| Clientes con alquileres | `GET /reportes/clientes-con-alquileres` | `GET :3004/alquileres` + `GET :3002/clientes` |
| Vehículos disponibles | `GET /reportes/vehiculos-disponibles` | `GET :3001/vehiculos?estado=Disponible` |
| Vehículos en mantenimiento | `GET /reportes/vehiculos-mantenimiento` | `GET :3001/vehiculos?estado=En%20mantenimiento` |

Endpoints de la Parte 1 que ya resumen información:

- `GET http://localhost:3001/vehiculos/resumen` → `{ total, porEstado, porCategoria, porMarca }`
- `GET http://localhost:3001/vehiculos/clasificacion/:campo` → grupos por `marca`, `modelo`, `anio`, `categoria` o `estado`
- `GET http://localhost:3002/clientes/resumen` → `{ total }`

Use `fetch` (incluido en Node 18+) para llamar a los servicios y responda con `enviarExito` de `shared/http/respuestas.js`.
Si un servicio de origen no responde, devuelva `503` con un mensaje claro en lugar de un reporte incompleto.

## Activarlo

Igual que en `reservas-service/README.md`: `servicios.json` → `implementado: true`, `frontend/js/config.js` → `implementado: true`, y crear `pages/reportes.html`.
