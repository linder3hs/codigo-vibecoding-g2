# Schema de Base de Datos — Logística API

## Tablas de Django (ya existentes, no se crean)

| Tabla Django      | Uso en este proyecto                                           |
| ----------------- | -------------------------------------------------------------- |
| `auth_user`       | Base para `drivers` — los conductores tienen acceso al sistema |
| `auth_group`      | Roles: admin, dispatcher, driver                               |
| `auth_permission` | Permisos por rol                                               |

---

## 1. `customers` — Clientes

Empresa o persona que genera envíos.

| Columna         | Tipo         | Restricciones                | Descripción                       |
| --------------- | ------------ | ---------------------------- | --------------------------------- |
| `id`            | INTEGER      | PK, autoincrement            | Identificador único               |
| `name`          | VARCHAR(255) | NOT NULL                     | Nombre de la empresa o persona    |
| `customer_type` | VARCHAR(10)  | NOT NULL, default=`COMPANY`  | `COMPANY` o `INDIVIDUAL`          |
| `tax_id`        | VARCHAR(50)  | UNIQUE, nullable             | RUC / NIT / identificación fiscal |
| `email`         | VARCHAR(254) | NOT NULL, UNIQUE             | Correo de contacto principal      |
| `phone`         | VARCHAR(20)  | NOT NULL                     | Teléfono de contacto              |
| `address`       | VARCHAR(500) | NOT NULL                     | Dirección completa                |
| `city`          | VARCHAR(100) | NOT NULL                     | Ciudad                            |
| `country`       | VARCHAR(100) | NOT NULL, default=`Colombia` | País                              |
| `is_active`     | BOOLEAN      | NOT NULL, default=`True`     | Soft delete                       |
| `created_at`    | DATETIME     | NOT NULL, auto               | Fecha de registro                 |
| `updated_at`    | DATETIME     | NOT NULL, auto               | Última actualización              |

---

## 2. `warehouses` — Almacenes

Puntos de partida y almacenamiento de productos.

| Columna       | Tipo          | Restricciones                | Descripción                       |
| ------------- | ------------- | ---------------------------- | --------------------------------- |
| `id`          | INTEGER       | PK, autoincrement            | Identificador único               |
| `name`        | VARCHAR(255)  | NOT NULL                     | Nombre del almacén                |
| `address`     | VARCHAR(500)  | NOT NULL                     | Dirección completa                |
| `city`        | VARCHAR(100)  | NOT NULL                     | Ciudad                            |
| `country`     | VARCHAR(100)  | NOT NULL, default=`Colombia` | País                              |
| `latitude`    | DECIMAL(9,6)  | nullable                     | Coordenada geográfica             |
| `longitude`   | DECIMAL(9,6)  | nullable                     | Coordenada geográfica             |
| `capacity_m3` | DECIMAL(10,2) | NOT NULL                     | Capacidad total en metros cúbicos |
| `is_active`   | BOOLEAN       | NOT NULL, default=`True`     | Soft delete                       |
| `created_at`  | DATETIME      | NOT NULL, auto               | Fecha de creación                 |
| `updated_at`  | DATETIME      | NOT NULL, auto               | Última actualización              |

---

## 3. `suppliers` — Proveedores

Empresas que venden los productos.

| Columna        | Tipo         | Restricciones                | Descripción             |
| -------------- | ------------ | ---------------------------- | ----------------------- |
| `id`           | INTEGER      | PK, autoincrement            | Identificador único     |
| `name`         | VARCHAR(255) | NOT NULL                     | Nombre del proveedor    |
| `tax_id`       | VARCHAR(50)  | UNIQUE, nullable             | Identificación fiscal   |
| `contact_name` | VARCHAR(255) | NOT NULL                     | Nombre del contacto     |
| `email`        | VARCHAR(254) | NOT NULL                     | Correo de contacto      |
| `phone`        | VARCHAR(20)  | NOT NULL                     | Teléfono de contacto    |
| `address`      | VARCHAR(500) | NOT NULL                     | Dirección del proveedor |
| `city`         | VARCHAR(100) | NOT NULL                     | Ciudad                  |
| `country`      | VARCHAR(100) | NOT NULL, default=`Colombia` | País                    |
| `is_active`    | BOOLEAN      | NOT NULL, default=`True`     | Soft delete             |
| `created_at`   | DATETIME     | NOT NULL, auto               | Fecha de registro       |
| `updated_at`   | DATETIME     | NOT NULL, auto               | Última actualización    |

---

## 4. `products` — Productos

Productos tecnológicos que serán enviados.

| Columna          | Tipo          | Restricciones                  | Descripción                       |
| ---------------- | ------------- | ------------------------------ | --------------------------------- |
| `id`             | INTEGER       | PK, autoincrement              | Identificador único               |
| `supplier_id`    | INTEGER       | FK → `suppliers.id`, NOT NULL  | Proveedor del producto            |
| `warehouse_id`   | INTEGER       | FK → `warehouses.id`, NOT NULL | Almacén donde está guardado       |
| `name`           | VARCHAR(255)  | NOT NULL                       | Nombre del producto               |
| `sku`            | VARCHAR(100)  | NOT NULL, UNIQUE               | Código único del producto         |
| `description`    | TEXT          | nullable                       | Descripción detallada             |
| `category`       | VARCHAR(100)  | NOT NULL                       | Categoría (laptop, celular, etc.) |
| `weight_kg`      | DECIMAL(8,3)  | NOT NULL                       | Peso en kilogramos                |
| `width_cm`       | DECIMAL(8,2)  | NOT NULL                       | Ancho en centímetros              |
| `height_cm`      | DECIMAL(8,2)  | NOT NULL                       | Alto en centímetros               |
| `depth_cm`       | DECIMAL(8,2)  | NOT NULL                       | Profundidad en centímetros        |
| `unit_price`     | DECIMAL(12,2) | NOT NULL                       | Precio unitario de venta          |
| `stock_quantity` | INTEGER       | NOT NULL, default=`0`          | Unidades disponibles en almacén   |
| `is_active`      | BOOLEAN       | NOT NULL, default=`True`       | Soft delete                       |
| `created_at`     | DATETIME      | NOT NULL, auto                 | Fecha de creación                 |
| `updated_at`     | DATETIME      | NOT NULL, auto                 | Última actualización              |

---

## 5. `transport` — Transporte

Medio físico (vehículo) para entregar los productos.

| Columna          | Tipo          | Restricciones            | Descripción                                |
| ---------------- | ------------- | ------------------------ | ------------------------------------------ |
| `id`             | INTEGER       | PK, autoincrement        | Identificador único                        |
| `plate_number`   | VARCHAR(20)   | NOT NULL, UNIQUE         | Placa del vehículo                         |
| `transport_type` | VARCHAR(20)   | NOT NULL                 | `TRUCK`, `VAN`, `MOTORCYCLE`, `CARGO_BIKE` |
| `brand`          | VARCHAR(100)  | NOT NULL                 | Marca del vehículo                         |
| `model`          | VARCHAR(100)  | NOT NULL                 | Modelo del vehículo                        |
| `year`           | INTEGER       | NOT NULL                 | Año de fabricación                         |
| `capacity_kg`    | DECIMAL(10,2) | NOT NULL                 | Capacidad máxima en kilogramos             |
| `capacity_m3`    | DECIMAL(8,2)  | NOT NULL                 | Capacidad máxima en metros cúbicos         |
| `is_available`   | BOOLEAN       | NOT NULL, default=`True` | Disponible para asignación                 |
| `created_at`     | DATETIME      | NOT NULL, auto           | Fecha de registro                          |
| `updated_at`     | DATETIME      | NOT NULL, auto           | Última actualización                       |

---

## 6. `drivers` — Conductores

Persona asignada a un transporte. Extiende `auth_user` de Django.

| Columna          | Tipo        | Restricciones                         | Descripción                               |
| ---------------- | ----------- | ------------------------------------- | ----------------------------------------- |
| `id`             | INTEGER     | PK, autoincrement                     | Identificador único                       |
| `user_id`        | INTEGER     | FK → `auth_user.id`, UNIQUE, NOT NULL | Cuenta del sistema (login, nombre, email) |
| `transport_id`   | INTEGER     | FK → `transport.id`, nullable         | Vehículo asignado actualmente             |
| `license_number` | VARCHAR(50) | NOT NULL, UNIQUE                      | Número de licencia de conducción          |
| `license_expiry` | DATE        | NOT NULL                              | Fecha de vencimiento de la licencia       |
| `phone`          | VARCHAR(20) | NOT NULL                              | Teléfono del conductor                    |
| `is_active`      | BOOLEAN     | NOT NULL, default=`True`              | Soft delete                               |
| `created_at`     | DATETIME    | NOT NULL, auto                        | Fecha de registro                         |
| `updated_at`     | DATETIME    | NOT NULL, auto                        | Última actualización                      |

> `auth_user` provee: `first_name`, `last_name`, `email`, `username`, `password`, `is_active`.

---

## 7. `routes` — Rutas

Secuencia de paradas que sigue un transporte.

| Columna                    | Tipo          | Restricciones                  | Descripción                   |
| -------------------------- | ------------- | ------------------------------ | ----------------------------- |
| `id`                       | INTEGER       | PK, autoincrement              | Identificador único           |
| `name`                     | VARCHAR(255)  | NOT NULL                       | Nombre descriptivo de la ruta |
| `origin_warehouse_id`      | INTEGER       | FK → `warehouses.id`, NOT NULL | Almacén de salida             |
| `estimated_duration_hours` | DECIMAL(6,2)  | NOT NULL                       | Duración estimada total       |
| `estimated_distance_km`    | DECIMAL(10,2) | NOT NULL                       | Distancia total estimada      |
| `is_active`                | BOOLEAN       | NOT NULL, default=`True`       | Soft delete                   |
| `created_at`               | DATETIME      | NOT NULL, auto                 | Fecha de creación             |
| `updated_at`               | DATETIME      | NOT NULL, auto                 | Última actualización          |

### 7b. `route_stops` — Paradas de ruta

Cada parada individual dentro de una ruta.

| Columna                  | Tipo         | Restricciones              | Descripción                      |
| ------------------------ | ------------ | -------------------------- | -------------------------------- |
| `id`                     | INTEGER      | PK, autoincrement          | Identificador único              |
| `route_id`               | INTEGER      | FK → `routes.id`, NOT NULL | Ruta a la que pertenece          |
| `stop_order`             | INTEGER      | NOT NULL                   | Orden de la parada (1, 2, 3…)    |
| `address`                | VARCHAR(500) | NOT NULL                   | Dirección de la parada           |
| `city`                   | VARCHAR(100) | NOT NULL                   | Ciudad de la parada              |
| `latitude`               | DECIMAL(9,6) | nullable                   | Coordenada geográfica            |
| `longitude`              | DECIMAL(9,6) | nullable                   | Coordenada geográfica            |
| `estimated_offset_hours` | DECIMAL(6,2) | NOT NULL                   | Horas desde el inicio de la ruta |

> `UNIQUE TOGETHER`: (`route_id`, `stop_order`)

---

## 8. `shipments` — Envíos

Unidad central de negocio. Relaciona customer, driver, transport, route y warehouse.

| Columna                   | Tipo          | Restricciones                  | Descripción                                                                |
| ------------------------- | ------------- | ------------------------------ | -------------------------------------------------------------------------- |
| `id`                      | INTEGER       | PK, autoincrement              | Identificador único                                                        |
| `tracking_number`         | VARCHAR(50)   | NOT NULL, UNIQUE               | Código de rastreo público                                                  |
| `customer_id`             | INTEGER       | FK → `customers.id`, NOT NULL  | Cliente que genera el envío                                                |
| `driver_id`               | INTEGER       | FK → `drivers.id`, nullable    | Conductor asignado                                                         |
| `transport_id`            | INTEGER       | FK → `transport.id`, nullable  | Vehículo asignado                                                          |
| `route_id`                | INTEGER       | FK → `routes.id`, nullable     | Ruta asignada                                                              |
| `origin_warehouse_id`     | INTEGER       | FK → `warehouses.id`, NOT NULL | Almacén de origen                                                          |
| `destination_address`     | VARCHAR(500)  | NOT NULL                       | Dirección de entrega                                                       |
| `destination_city`        | VARCHAR(100)  | NOT NULL                       | Ciudad de destino                                                          |
| `destination_country`     | VARCHAR(100)  | NOT NULL, default=`Colombia`   | País de destino                                                            |
| `status`                  | VARCHAR(20)   | NOT NULL, default=`PENDING`    | `PENDING`, `CONFIRMED`, `IN_TRANSIT`, `DELIVERED`, `CANCELLED`, `RETURNED` |
| `estimated_delivery_date` | DATE          | nullable                       | Fecha estimada de entrega                                                  |
| `actual_delivery_date`    | DATETIME      | nullable                       | Fecha y hora real de entrega                                               |
| `weight_total_kg`         | DECIMAL(10,3) | NOT NULL, default=`0`          | Peso total calculado del envío                                             |
| `base_cost`               | DECIMAL(12,2) | NOT NULL, default=`0`          | Costo base antes de ajustes                                                |
| `calculated_cost`         | DECIMAL(12,2) | NOT NULL, default=`0`          | Costo final al cliente                                                     |
| `notes`                   | TEXT          | nullable                       | Instrucciones especiales de entrega                                        |
| `created_at`              | DATETIME      | NOT NULL, auto                 | Fecha de creación                                                          |
| `updated_at`              | DATETIME      | NOT NULL, auto                 | Última actualización                                                       |

### 8b. `shipment_items` — Ítems del envío

Productos incluidos en cada envío (relación M2M con cantidad).

| Columna              | Tipo          | Restricciones                 | Descripción                                   |
| -------------------- | ------------- | ----------------------------- | --------------------------------------------- |
| `id`                 | INTEGER       | PK, autoincrement             | Identificador único                           |
| `shipment_id`        | INTEGER       | FK → `shipments.id`, NOT NULL | Envío al que pertenece                        |
| `product_id`         | INTEGER       | FK → `products.id`, NOT NULL  | Producto incluido                             |
| `quantity`           | INTEGER       | NOT NULL                      | Cantidad de unidades                          |
| `unit_price_at_time` | DECIMAL(12,2) | NOT NULL                      | Precio unitario snapshot al momento del envío |
| `subtotal`           | DECIMAL(12,2) | NOT NULL                      | `quantity × unit_price_at_time`               |

> `UNIQUE TOGETHER`: (`shipment_id`, `product_id`)

---

## Diagrama de relaciones

```
auth_user ──────────────── drivers ──────────────── transport
                               │
customers ──── shipments ◄─────┘
                  │  │
                  │  └──── routes ──── route_stops
                  │            │
                  │        warehouses (origin)
                  │
           shipment_items
                  │
              products ──── suppliers
                  │
              warehouses (storage)
```

## Tabla de relaciones

| Relación                       | Tipo                | Detalle                                           |
| ------------------------------ | ------------------- | ------------------------------------------------- |
| `drivers` → `auth_user`        | OneToOne            | Un conductor = una cuenta de sistema              |
| `drivers` → `transport`        | ManyToOne, nullable | Vehículo asignado actualmente                     |
| `products` → `suppliers`       | ManyToOne           | Un proveedor tiene muchos productos               |
| `products` → `warehouses`      | ManyToOne           | Un producto almacenado en un almacén              |
| `shipments` → `customers`      | ManyToOne           | Un cliente genera muchos envíos                   |
| `shipments` → `drivers`        | ManyToOne, nullable | El conductor se asigna después de crear el envío  |
| `shipments` → `transport`      | ManyToOne, nullable | El transporte se asigna después de crear el envío |
| `shipments` → `routes`         | ManyToOne, nullable | La ruta se asigna al despachar                    |
| `shipments` → `warehouses`     | ManyToOne           | Almacén de origen del envío                       |
| `shipment_items` → `shipments` | ManyToOne           | Un envío tiene muchos ítems                       |
| `shipment_items` → `products`  | ManyToOne           | Un ítem referencia un producto                    |
| `routes` → `warehouses`        | ManyToOne           | Toda ruta parte de un almacén                     |
| `route_stops` → `routes`       | ManyToOne           | Una ruta tiene N paradas ordenadas                |
