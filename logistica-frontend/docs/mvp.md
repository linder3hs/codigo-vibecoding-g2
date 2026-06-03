# MVP — Logística Frontend

**Stack:** Next.js 16 · React 19 · TypeScript 5 · Tailwind CSS v4 · shadcn/ui · TanStack Query v5 · TanStack Table v8 · Axios · Zustand · React Hook Form · Zod

**Backend:** Django 6 + DRF 3.17 en `http://localhost:8000/api/v1/`  
**Referencia completa:** `docs/api-reference.md` y `docs/backend-modules.md`

---

## Patrón CRUD estándar

Todos los módulos (excepto auth y setup) siguen este patrón:

### Página de lista

- TanStack Table con columnas configuradas
- Búsqueda por texto (query param `search`)
- Filtros específicos del módulo (selects, inputs)
- Paginación controlada (query param `page`, 20 por página)
- Botón "Nuevo" → abre modal o navega a formulario

### Formulario Crear/Editar

- Modal (para entidades con pocos campos) o página separada (muchos campos o sub-recursos)
- Validación client-side con Zod + React Hook Form
- `useMutation` de TanStack Query para POST / PATCH
- Invalida queries de lista al completar exitosamente

### Eliminar

- Confirmación con `AlertDialog` de shadcn
- Soft delete (DELETE → HTTP 204)
- Invalida queries de lista al completar

### Hooks TanStack Query por módulo

- `useXxxList(params)` → `useQuery` paginado
- `useXxx(id)` → `useQuery` individual
- `useCreateXxx()` → `useMutation` POST
- `useUpdateXxx()` → `useMutation` PATCH
- `useDeleteXxx()` → `useMutation` DELETE

---

## Fase 0 — Setup e Infraestructura

**Estado:** `pendiente`  
**Spec:** `docs/specs/setup.md`

### Tareas

**`app/providers.tsx`** — QueryClientProvider (Client Component)

- `QueryClient` con `staleTime: 60_000`, `retry: 1`
- `ReactQueryDevtools` solo en desarrollo

**`lib/axios.ts`** — Instancia axios configurada

- `baseURL: http://localhost:8000/api/v1/`
- Interceptor request: agrega `Authorization: Bearer <token>`
- Interceptor response: en 401 → intenta refresh → si falla → limpia tokens + redirige a `/login`

**`types/common.ts`** — Tipos base reutilizables

- `PaginatedResponse<T>`
- `ApiError`

**`lib/auth.ts`** — Helpers JWT

- `getAccessToken()`, `getRefreshToken()`, `setTokens()`, `clearTokens()`, `isAuthenticated()`

**`lib/api/auth.ts`** — API client de auth

- `login(credentials)` → POST `/auth/token/`
- `refreshToken(refresh)` → POST `/auth/token/refresh/`

**`app/(auth)/login/page.tsx`** — Página de login

- Formulario `username` + `password` con React Hook Form + Zod
- `useMutation` para llamar al API de login
- Guarda tokens en `localStorage` tras éxito
- Redirige a `/dashboard` tras éxito
- Muestra error descriptivo si las credenciales son inválidas

**`middleware.ts`** — Route guard

- Redirige a `/login` si no hay access token
- Protege todas las rutas bajo `/(dashboard)/`

**`app/(dashboard)/layout.tsx`** — Layout autenticado

- Sidebar con navegación a todos los módulos
- Navbar superior con nombre de usuario y botón logout
- Requiere autenticación

### Criterios de aceptación Fase 0

- [ ] Login funciona con usuario existente en Django
- [ ] Token se almacena y se envía en cada request
- [ ] Refresh automático funciona sin interrupción para el usuario
- [ ] Sin token → redirige a `/login`
- [ ] Con token válido → muestra el dashboard
- [ ] Logout limpia tokens y redirige a `/login`

---

## Fase 1 — Módulos sin dependencias entre sí

### 1.1 Warehouses — Almacenes

**Estado:** `pendiente`  
**Spec:** `docs/specs/warehouses.md`  
**Endpoint:** `/api/v1/warehouses/`

| Campo         | UI                              |
| ------------- | ------------------------------- |
| `name`        | Input texto                     |
| `address`     | Input texto                     |
| `city`        | Input texto                     |
| `country`     | Input texto (default: Colombia) |
| `capacity_m3` | Input número decimal            |
| `latitude`    | Input número decimal (opcional) |
| `longitude`   | Input número decimal (opcional) |

**Filtros:** `city`, `country`, `capacity_m3_gte`, `capacity_m3_lte`, `search`, `ordering`  
**Columnas tabla:** name, city, country, capacity_m3, actions  
**Formulario:** modal  
**Soft delete:** sí

### 1.2 Suppliers — Proveedores

**Estado:** `pendiente`  
**Spec:** `docs/specs/suppliers.md`  
**Endpoint:** `/api/v1/suppliers/`

| Campo          | UI                     |
| -------------- | ---------------------- |
| `name`         | Input texto            |
| `contact_name` | Input texto            |
| `email`        | Input email            |
| `phone`        | Input texto            |
| `address`      | Input texto            |
| `city`         | Input texto            |
| `country`      | Input texto            |
| `tax_id`       | Input texto (opcional) |

**Filtros:** `city`, `country`, `search`, `ordering`  
**Columnas tabla:** name, contact_name, email, city, actions  
**Formulario:** modal  
**Soft delete:** sí

### 1.3 Customers — Clientes

**Estado:** `pendiente`  
**Spec:** `docs/specs/customers.md`  
**Endpoint:** `/api/v1/customers/`

| Campo           | UI                            |
| --------------- | ----------------------------- |
| `name`          | Input texto                   |
| `customer_type` | Select: COMPANY \| INDIVIDUAL |
| `email`         | Input email                   |
| `phone`         | Input texto                   |
| `address`       | Input texto                   |
| `city`          | Input texto                   |
| `country`       | Input texto                   |
| `tax_id`        | Input texto (opcional)        |

**Filtros:** `customer_type`, `city`, `country`, `search`, `ordering`  
**Columnas tabla:** name, customer_type (Badge), email, city, actions  
**Formulario:** modal  
**Soft delete:** sí

### 1.4 Transport — Transportes

**Estado:** `pendiente`  
**Spec:** `docs/specs/transport.md`  
**Endpoint:** `/api/v1/transport/`

| Campo            | UI                                               |
| ---------------- | ------------------------------------------------ |
| `plate_number`   | Input texto                                      |
| `transport_type` | Select: TRUCK \| VAN \| MOTORCYCLE \| CARGO_BIKE |
| `brand`          | Input texto                                      |
| `model`          | Input texto                                      |
| `year`           | Input número entero                              |
| `capacity_kg`    | Input número decimal                             |
| `capacity_m3`    | Input número decimal                             |
| `is_available`   | Switch / Checkbox                                |

**Filtros:** `transport_type`, `is_available`, `capacity_kg_gte/lte`, `search`, `ordering`  
**Columnas tabla:** plate_number, transport_type (Badge), brand + model, capacity_kg, is_available (Badge), actions  
**Formulario:** modal  
**Soft delete:** NO (no tiene `is_active`)

---

## Fase 2 — Dependen de Fase 1

### 2.1 Products — Productos

**Estado:** `implementado — validado`  
**Spec:** `docs/specs/products.md`  
**Endpoint:** `/api/v1/products/`

| Campo            | UI                        |
| ---------------- | ------------------------- |
| `name`           | Input texto               |
| `sku`            | Input texto               |
| `category`       | Input texto               |
| `supplier`       | Select de suppliers (FK)  |
| `warehouse`      | Select de warehouses (FK) |
| `weight_kg`      | Input número decimal      |
| `width_cm`       | Input número decimal      |
| `height_cm`      | Input número decimal      |
| `depth_cm`       | Input número decimal      |
| `unit_price`     | Input número decimal      |
| `stock_quantity` | Input número entero       |
| `description`    | Textarea (opcional)       |

**Dependencias FK:** requiere listas de suppliers y warehouses en selects  
**Filtros:** `supplier`, `warehouse`, `category`, `unit_price_gte/lte`, `stock_quantity_gte/lte`, `search`, `ordering`  
**Columnas tabla:** name, sku, category, supplier, warehouse, unit_price, stock_quantity, actions  
**Formulario:** página separada (muchos campos)  
**Soft delete:** sí

### 2.2 Routes — Rutas + Paradas

**Estado:** `implementado — validado`  
**Spec:** `docs/specs/routes.md`  
**Endpoints:** `/api/v1/routes/` + `/api/v1/routes/{id}/stops/`

**Ruta:**

| Campo                      | UI                        |
| -------------------------- | ------------------------- |
| `name`                     | Input texto               |
| `origin_warehouse`         | Select de warehouses (FK) |
| `estimated_duration_hours` | Input número decimal      |
| `estimated_distance_km`    | Input número decimal      |

**Parada (sub-recurso):**

| Campo                    | UI                              |
| ------------------------ | ------------------------------- |
| `stop_order`             | Input número entero             |
| `address`                | Input texto                     |
| `city`                   | Input texto                     |
| `estimated_offset_hours` | Input número decimal            |
| `latitude`               | Input número decimal (opcional) |
| `longitude`              | Input número decimal (opcional) |

**Filtros rutas:** `origin_warehouse`, `search`, `ordering`  
**Columnas tabla rutas:** name, origin_warehouse, estimated_distance_km, estimated_duration_hours, actions  
**Formulario ruta:** modal  
**Paradas:** sección inline en página de detalle `/routes/[id]`  
**Soft delete:** sí (solo ruta)

---

## Fase 3 — Depende de Fase 1

### 3.1 Drivers — Conductores

**Estado:** `implementado — validado`  
**Spec:** `docs/specs/drivers.md`  
**Endpoint:** `/api/v1/drivers/`

> **Nota importante:** POST/PATCH envía `user` como int (FK a auth_user). GET retorna `user_full_name`, `user_email`, `user_username` calculados. El `auth_user` debe existir previamente (vía Django Admin).

| Campo escritura  | UI                                 |
| ---------------- | ---------------------------------- |
| `user`           | Select de usuarios (int FK)        |
| `license_number` | Input texto                        |
| `license_expiry` | Input fecha                        |
| `phone`          | Input texto                        |
| `transport`      | Select de transport (FK, opcional) |
| `is_active`      | Switch / Checkbox                  |

**Filtros:** `transport`, `is_active`, `search`, `ordering`  
**Columnas tabla:** user_full_name, user_email, license_number, license_expiry, transport, is_active (Badge), actions  
**Formulario:** modal  
**Soft delete:** sí

---

## Fase 4 — Módulo central

### 4.1 Shipments — Envíos + Ítems

**Estado:** `implementado — validado`  
**Spec:** `docs/specs/shipments.md`  
**Endpoints:** `/api/v1/shipments/` + `/api/v1/shipments/{id}/items/`

> **Notas:** `tracking_number` es auto-generado (no enviar en POST). `weight_total_kg`, `base_cost`, `calculated_cost` se calculan desde los ítems. Status flow: `PENDING` → `CONFIRMED` → `IN_TRANSIT` → `DELIVERED` (también `CANCELLED`, `RETURNED`).

**Envío:**

| Campo                     | UI                                 |
| ------------------------- | ---------------------------------- |
| `customer`                | Select de customers (FK)           |
| `origin_warehouse`        | Select de warehouses (FK)          |
| `destination_address`     | Input texto                        |
| `destination_city`        | Input texto                        |
| `destination_country`     | Input texto                        |
| `status`                  | Select de estados                  |
| `estimated_delivery_date` | Input fecha (opcional)             |
| `driver`                  | Select de drivers (FK, opcional)   |
| `transport`               | Select de transport (FK, opcional) |
| `route`                   | Select de routes (FK, opcional)    |
| `notes`                   | Textarea (opcional)                |

**Ítem (sub-recurso):**

| Campo                | UI                      |
| -------------------- | ----------------------- |
| `product`            | Select de products (FK) |
| `quantity`           | Input número entero     |
| `unit_price_at_time` | Input número decimal    |

**Filtros:** `status`, `customer`, `driver`, `origin_warehouse`, `destination_city`, `search`, `ordering`  
**Columnas tabla:** tracking_number, customer, status (Badge), destination_city, estimated_delivery_date, calculated_cost, actions  
**Formulario envío:** página separada  
**Ítems:** sección inline en página de detalle `/shipments/[id]`  
**Soft delete:** no aplica (control por `status`)
