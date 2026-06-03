# API Reference — Logística API

Backend: `http://localhost:8000`  
Base URL: `/api/v1/`  
Docs Swagger: `http://localhost:8000/api/v1/docs/`

## Autenticación

Todos los endpoints (excepto auth) requieren header:

```
Authorization: Bearer <access_token>
```

### POST `/api/v1/auth/token/`

Obtener access + refresh token.

**Body:**

```json
{ "username": "string", "password": "string" }
```

**Response 200:**

```json
{ "access": "jwt_string", "refresh": "jwt_string" }
```

### POST `/api/v1/auth/token/refresh/`

Renovar access token.

**Body:**

```json
{ "refresh": "jwt_string" }
```

**Response 200:**

```json
{ "access": "jwt_string" }
```

---

## Customers — Clientes

### GET `/api/v1/customers/`

Lista paginada. Solo registros con `is_active=true`.

**Query params:**
| Param | Tipo | Descripción |
|-------|------|-------------|
| `customer_type` | `COMPANY` \| `INDIVIDUAL` | Filtro exacto |
| `city` | string | Filtro exacto |
| `country` | string | Filtro exacto |
| `search` | string | Busca en `name`, `email`, `tax_id` |
| `ordering` | `name` \| `created_at` \| `-name` \| `-created_at` | Orden |
| `page` | int | Paginación (20 por página) |

**Response 200:**

```json
{
  "count": 42,
  "next": "url | null",
  "previous": "url | null",
  "results": [{ ...customer }]
}
```

### POST `/api/v1/customers/`

**Body (required):**

```json
{
  "name": "string",
  "customer_type": "COMPANY | INDIVIDUAL",
  "email": "string (unique)",
  "phone": "string",
  "address": "string",
  "city": "string",
  "country": "string (default: Colombia)",
  "tax_id": "string (optional, unique)"
}
```

### GET `/api/v1/customers/{id}/`

### PUT `/api/v1/customers/{id}/`

### PATCH `/api/v1/customers/{id}/`

### DELETE `/api/v1/customers/{id}/`

Soft delete — pone `is_active=false`.

**Customer object:**

```json
{
  "id": 1,
  "name": "Tech Corp",
  "customer_type": "COMPANY",
  "tax_id": "900123456-1",
  "email": "contact@techcorp.com",
  "phone": "+57 300 0000000",
  "address": "Calle 100 #10-20",
  "city": "Bogotá",
  "country": "Colombia",
  "is_active": true,
  "created_at": "2025-01-01T00:00:00Z",
  "updated_at": "2025-01-01T00:00:00Z"
}
```

---

## Warehouses — Almacenes

### GET `/api/v1/warehouses/`

**Query params:**
| Param | Tipo | Descripción |
|-------|------|-------------|
| `city` | string | Filtro exacto |
| `country` | string | Filtro exacto |
| `capacity_m3_gte` | number | Capacidad mínima |
| `capacity_m3_lte` | number | Capacidad máxima |
| `search` | string | Busca en `name`, `city`, `address` |
| `ordering` | `name` \| `capacity_m3` \| `created_at` | Orden |

### POST `/api/v1/warehouses/`

**Body (required):**

```json
{
  "name": "string",
  "address": "string",
  "city": "string",
  "country": "string",
  "capacity_m3": "decimal",
  "latitude": "decimal (optional)",
  "longitude": "decimal (optional)"
}
```

### GET/PUT/PATCH/DELETE `/api/v1/warehouses/{id}/`

**Warehouse object:**

```json
{
  "id": 1,
  "name": "CEDI Bogotá",
  "address": "Zona Franca, Bodega 5",
  "city": "Bogotá",
  "country": "Colombia",
  "latitude": 4.711,
  "longitude": -74.0721,
  "capacity_m3": "5000.00",
  "is_active": true,
  "created_at": "...",
  "updated_at": "..."
}
```

---

## Suppliers — Proveedores

### GET `/api/v1/suppliers/`

**Query params:**
| Param | Tipo |
|-------|------|
| `city` | string |
| `country` | string |
| `search` | string (busca en `name`, `contact_name`, `email`, `tax_id`) |
| `ordering` | `name` \| `created_at` |

### POST `/api/v1/suppliers/`

**Body (required):**

```json
{
  "name": "string",
  "contact_name": "string",
  "email": "string",
  "phone": "string",
  "address": "string",
  "city": "string",
  "country": "string",
  "tax_id": "string (optional)"
}
```

### GET/PUT/PATCH/DELETE `/api/v1/suppliers/{id}/`

---

## Products — Productos

### GET `/api/v1/products/`

**Query params:**
| Param | Tipo |
|-------|------|
| `supplier` | int (FK id) |
| `warehouse` | int (FK id) |
| `category` | string |
| `unit_price_gte` / `unit_price_lte` | number |
| `stock_quantity_gte` / `stock_quantity_lte` | number |
| `search` | string (busca en `name`, `sku`, `category`, `description`) |
| `ordering` | `name` \| `unit_price` \| `stock_quantity` \| `created_at` |

### POST `/api/v1/products/`

**Body (required):**

```json
{
  "supplier": 1,
  "warehouse": 1,
  "name": "string",
  "sku": "string (unique)",
  "category": "string",
  "weight_kg": "decimal",
  "width_cm": "decimal",
  "height_cm": "decimal",
  "depth_cm": "decimal",
  "unit_price": "decimal",
  "stock_quantity": 0,
  "description": "string (optional)"
}
```

### GET/PUT/PATCH/DELETE `/api/v1/products/{id}/`

---

## Transport — Transportes

### GET `/api/v1/transport/`

**Query params:**
| Param | Tipo |
|-------|------|
| `transport_type` | `TRUCK` \| `VAN` \| `MOTORCYCLE` \| `CARGO_BIKE` |
| `is_available` | boolean |
| `capacity_kg_gte` / `capacity_kg_lte` | number |
| `capacity_m3_gte` / `capacity_m3_lte` | number |
| `search` | string (busca en `plate_number`, `brand`, `model`) |
| `ordering` | `brand` \| `year` \| `capacity_kg` \| `created_at` |

### POST `/api/v1/transport/`

**Body (required):**

```json
{
  "plate_number": "string (unique)",
  "transport_type": "TRUCK | VAN | MOTORCYCLE | CARGO_BIKE",
  "brand": "string",
  "model": "string",
  "year": 2024,
  "capacity_kg": "decimal",
  "capacity_m3": "decimal",
  "is_available": true
}
```

### GET/PUT/PATCH/DELETE `/api/v1/transport/{id}/`

---

## Drivers — Conductores

### GET `/api/v1/drivers/`

**Query params:**
| Param | Tipo |
|-------|------|
| `transport` | int (FK id) |
| `is_active` | boolean |
| `search` | string (busca en `license_number`, `phone`, `user__first_name`, `user__last_name`, `user__email`) |
| `ordering` | `license_expiry` \| `created_at` |

### POST `/api/v1/drivers/`

Usa `DriverSerializer` (write).
**Body (required):**

```json
{
  "user": 1,
  "license_number": "string (unique)",
  "license_expiry": "YYYY-MM-DD",
  "phone": "string",
  "transport": 1,
  "is_active": true
}
```

> `user` debe ser el id de un `auth_user` existente. Crear el usuario primero vía Django Admin o superusuario.

### GET/PUT/PATCH/DELETE `/api/v1/drivers/{id}/`

GET y LIST usan `DriverReadSerializer` con campos extra:

**Driver object (lectura):**

```json
{
  "id": 1,
  "user": 3,
  "user_full_name": "Juan Pérez",
  "user_email": "juan@example.com",
  "user_username": "juan.perez",
  "transport": 2,
  "license_number": "LC-12345",
  "license_expiry": "2026-12-31",
  "phone": "+57 310 0000000",
  "is_active": true,
  "created_at": "...",
  "updated_at": "..."
}
```

---

## Routes — Rutas

### GET `/api/v1/routes/`

**Query params:**
| Param | Tipo |
|-------|------|
| `origin_warehouse` | int (FK id) |
| `search` | string (busca en `name`) |
| `ordering` | `name` \| `estimated_duration_hours` \| `estimated_distance_km` \| `created_at` |

### POST `/api/v1/routes/`

**Body (required):**

```json
{
  "name": "string",
  "origin_warehouse": 1,
  "estimated_duration_hours": "decimal",
  "estimated_distance_km": "decimal"
}
```

### GET/PUT/PATCH/DELETE `/api/v1/routes/{id}/`

### GET `/api/v1/routes/{id}/stops/`

Lista de paradas ordenadas por `stop_order`.

### POST `/api/v1/routes/{id}/stops/`

**Body (required):**

```json
{
  "stop_order": 1,
  "address": "string",
  "city": "string",
  "estimated_offset_hours": "decimal",
  "latitude": "decimal (optional)",
  "longitude": "decimal (optional)"
}
```

> `stop_order` debe ser único por ruta.

---

## Shipments — Envíos

### GET `/api/v1/shipments/`

**Query params:**
| Param | Tipo |
|-------|------|
| `status` | `PENDING` \| `CONFIRMED` \| `IN_TRANSIT` \| `DELIVERED` \| `CANCELLED` \| `RETURNED` |
| `customer` | int (FK id) |
| `driver` | int (FK id) |
| `origin_warehouse` | int (FK id) |
| `destination_city` | string |
| `search` | string (busca en `tracking_number`, `destination_address`, `destination_city`) |
| `ordering` | `status` \| `estimated_delivery_date` \| `created_at` \| `calculated_cost` |

### POST `/api/v1/shipments/`

**Body (required):**

```json
{
  "customer": 1,
  "origin_warehouse": 1,
  "destination_address": "string",
  "destination_city": "string",
  "destination_country": "string",
  "status": "PENDING",
  "estimated_delivery_date": "YYYY-MM-DD (optional)",
  "driver": 1,
  "transport": 1,
  "route": 1,
  "notes": "string (optional)"
}
```

> `tracking_number` es auto-generado. `weight_total_kg`, `base_cost`, `calculated_cost` se calculan desde los items.

### GET/PUT/PATCH/DELETE `/api/v1/shipments/{id}/`

### GET `/api/v1/shipments/{id}/items/`

### POST `/api/v1/shipments/{id}/items/`

**Body (required):**

```json
{
  "product": 1,
  "quantity": 3,
  "unit_price_at_time": "decimal"
}
```

> `subtotal` se calcula automáticamente (`quantity × unit_price_at_time`).  
> Un producto no puede repetirse en el mismo envío.

---

## Paginación

Todos los endpoints de lista retornan:

```json
{
  "count": 100,
  "next": "http://localhost:8000/api/v1/customers/?page=2",
  "previous": null,
  "results": []
}
```

Tamaño de página: **20 registros**.

## Códigos de respuesta comunes

| Código | Situación                           |
| ------ | ----------------------------------- |
| 200    | OK                                  |
| 201    | Creado                              |
| 204    | Eliminado (soft delete retorna 204) |
| 400    | Validación fallida                  |
| 401    | Sin token o token inválido          |
| 404    | Recurso no encontrado               |
