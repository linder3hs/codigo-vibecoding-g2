# Módulos del Backend — Logística API

Backend: Django 6 + Django REST Framework 3.17  
Puerto: `8000`  
Auth: JWT via `djangorestframework-simplejwt`

## Mapa de módulos

| Módulo | App Django | Endpoint base | Descripción |
|--------|-----------|--------------|-------------|
| Auth | `authentication` | `/api/v1/auth/` | JWT login y refresh |
| Clientes | `customers` | `/api/v1/customers/` | Empresa o persona que genera envíos |
| Almacenes | `warehouses` | `/api/v1/warehouses/` | Punto de almacenamiento y origen de envíos |
| Proveedores | `suppliers` | `/api/v1/suppliers/` | Empresas que venden los productos |
| Productos | `products` | `/api/v1/products/` | Inventario de productos tecnológicos |
| Transporte | `transport` | `/api/v1/transport/` | Vehículos disponibles para envíos |
| Conductores | `drivers` | `/api/v1/drivers/` | Conductor asignado a un transporte |
| Rutas | `routes` | `/api/v1/routes/` | Secuencia de paradas de un transporte |
| Envíos | `shipments` | `/api/v1/shipments/` | Unidad central — une todo el sistema |

---

## Grafo de dependencias

```
auth_user (Django built-in)
    │
    └──► drivers ◄── transport
              │
customers ────┤
              │
              ▼
           shipments ◄── routes ◄── warehouses
              │               │
              │           route_stops
              │
         shipment_items
              │
           products ◄── suppliers
              │
           warehouses
```

**Orden de creación de datos requerido:**
1. `warehouses` + `suppliers` + `customers` + `transport` (sin dependencias entre ellos)
2. `products` (necesita `warehouse` y `supplier`)
3. `routes` (necesita `warehouse` como origen)
4. `drivers` (necesita `auth_user` y opcionalmente `transport`)
5. `shipments` (necesita todo lo anterior)

---

## Detalle por módulo

### 1. Authentication
- No tiene modelo propio — usa `auth_user` de Django
- Endpoints solo para obtener y refrescar tokens JWT
- Todos los demás módulos requieren `Authorization: Bearer <token>`

### 2. Customers
- `customer_type`: `COMPANY` (default) o `INDIVIDUAL`
- `tax_id` único, nullable (RUC/NIT)
- Soft delete con `is_active`
- Filtros: `customer_type`, `city`, `country`
- Search: `name`, `email`, `tax_id`

### 3. Warehouses
- Tiene coordenadas geográficas opcionales (`latitude`, `longitude`)
- `capacity_m3` define el espacio disponible
- Soft delete con `is_active`
- Filtros: `city`, `country`, rangos de `capacity_m3`
- Usado como `origin_warehouse` en `routes` y `shipments`

### 4. Suppliers
- Proveedor de productos tecnológicos
- Soft delete con `is_active`
- Filtros: `city`, `country`
- Search: `name`, `contact_name`, `email`, `tax_id`

### 5. Products
- Referencia a `supplier` y `warehouse` (FK requeridos)
- `sku` único por producto
- `stock_quantity` representa unidades disponibles
- Dimensiones físicas: `weight_kg`, `width_cm`, `height_cm`, `depth_cm`
- Soft delete con `is_active`
- Filtros: `supplier`, `warehouse`, `category`, rangos de precio y stock
- Search: `name`, `sku`, `category`, `description`

### 6. Transport
- `transport_type`: `TRUCK`, `VAN`, `MOTORCYCLE`, `CARGO_BIKE`
- `is_available` indica si puede asignarse a un conductor/envío
- No usa soft delete (no tiene `is_active`)
- Filtros: `transport_type`, `is_available`, rangos de capacidad

### 7. Drivers
- Extiende `auth_user` vía `OneToOneField`
- Lectura (GET/LIST) usa `DriverReadSerializer` con campos calculados:
  - `user_full_name`, `user_email`, `user_username`
- Escritura (POST/PUT/PATCH) usa `DriverSerializer` con `user` como FK int
- `transport` es nullable (conductor sin vehículo asignado)
- Soft delete con `is_active`
- Para crear un driver, el `auth_user` debe existir primero

### 8. Routes
- Cada ruta tiene un `origin_warehouse` (almacén de salida)
- Las paradas (`route_stops`) son sub-recurso: `GET/POST /routes/{id}/stops/`
- `stop_order` define el orden y es único por ruta (validación en serializer)
- Soft delete con `is_active`
- Filtro: `origin_warehouse`

### 9. Shipments
- Módulo central — relaciones con `customer`, `driver`, `transport`, `route`, `warehouse`
- `tracking_number` auto-generado (no enviar en POST)
- `status` progresa: `PENDING` → `CONFIRMED` → `IN_TRANSIT` → `DELIVERED`
  - También puede ser `CANCELLED` o `RETURNED`
- Los ítems son sub-recurso: `GET/POST /shipments/{id}/items/`
- En `ShipmentItem`, `subtotal = quantity × unit_price_at_time` (calculado automáticamente)
- Un producto no puede repetirse en el mismo envío (validación en serializer)
- Filtros: `status`, `customer`, `driver`, `origin_warehouse`, `destination_city`

---

## Comportamiento común a todos los módulos

- **Paginación:** 20 registros por página, formato `{ count, next, previous, results }`
- **Soft delete:** Los DELETE no eliminan filas, ponen `is_active=false`. Los GET solo retornan `is_active=true` (excepto `transport` y `shipments`)
- **Read-only fields:** `id`, `created_at`, `updated_at` nunca se envían en POST/PUT/PATCH
- **Filtros combinables:** Todos los query params se pueden combinar en la misma URL
- **Ordering descendente:** Prefijo `-` (ej: `?ordering=-created_at`)
