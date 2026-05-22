# Spec: Products (Productos)

## Modelo

| Campo            | Tipo Django            | Constraints                       | Notas                                      |
| ---------------- | ---------------------- | --------------------------------- | ------------------------------------------ |
| `id`             | BigAutoField (default) | PK, autoincrement                 | No declarar — Django auto                  |
| `supplier`       | ForeignKey             | FK → Supplier, NOT NULL, PROTECT  | on_delete=PROTECT, related_name='products' |
| `warehouse`      | ForeignKey             | FK → Warehouse, NOT NULL, PROTECT | on_delete=PROTECT, related_name='products' |
| `name`           | CharField(255)         | NOT NULL                          |                                            |
| `sku`            | CharField(100)         | NOT NULL, unique=True             | Código único del producto                  |
| `description`    | TextField              | null=True, blank=True             |                                            |
| `category`       | CharField(100)         | NOT NULL                          | laptop, celular, etc.                      |
| `weight_kg`      | DecimalField(8,3)      | NOT NULL                          |                                            |
| `width_cm`       | DecimalField(8,2)      | NOT NULL                          |                                            |
| `height_cm`      | DecimalField(8,2)      | NOT NULL                          |                                            |
| `depth_cm`       | DecimalField(8,2)      | NOT NULL                          |                                            |
| `unit_price`     | DecimalField(12,2)     | NOT NULL                          |                                            |
| `stock_quantity` | IntegerField           | NOT NULL, default=0               |                                            |
| `is_active`      | BooleanField           | NOT NULL, default=True            | Soft delete                                |
| `created_at`     | DateTimeField          | auto_now_add=True                 |                                            |
| `updated_at`     | DateTimeField          | auto_now=True                     |                                            |

- `db_table = 'products'`
- `ordering = ['-created_at']`
- FKs con `PROTECT`: no se puede eliminar un supplier o warehouse que tenga productos asociados
- Imports necesarios: `from apps.suppliers.models import Supplier` y `from apps.warehouses.models import Warehouse`

> **Nota:** La app `products` ya existe en `apps/products/` (fue movida en Fase 1). No ejecutar `startapp` — solo implementar los archivos.

## Serializer

- Clase: `ProductSerializer`
- Hereda: `ModelSerializer`
- Campos: `__all__`
- Campos de solo lectura: `['id', 'created_at', 'updated_at']`
- Validaciones custom: ninguna
- Serializers anidados: ninguno (FKs se envían/reciben como IDs)

## ViewSet

- Clase: `ProductViewSet`
- Hereda: `ModelViewSet`
- Queryset base: `Product.objects.filter(is_active=True).select_related('supplier', 'warehouse')`
- Permisos: `IsAuthenticated` (default global)
- Acciones personalizadas: ninguna
- Overrides:
  - `get_queryset`: filtrar `is_active=True` con `select_related`
  - `perform_destroy`: soft delete — `is_active=False` y `save()`

## URLs

- Router: `DefaultRouter`
- Prefix: `products`
- Basename: `product`
- Resultado: `/api/v1/products/` y `/api/v1/products/{id}/`
- Rutas nested: ninguna

## Filtros (django-filter)

- Clase: `ProductFilter`
- Campos filtrables:
  - `supplier` — exact (por ID)
  - `warehouse` — exact (por ID)
  - `category` — exact
  - `unit_price` — gte, lte
  - `stock_quantity` — gte, lte
- Búsqueda por texto (`SearchFilter`): `name`, `sku`, `category`, `description`
- Ordenamiento (`OrderingFilter`): `name`, `unit_price`, `stock_quantity`, `created_at`

## Admin

- `@admin.register(Product)`
- `list_display`: `['name', 'sku', 'category', 'supplier', 'warehouse', 'unit_price', 'stock_quantity', 'is_active']`
- `search_fields`: `['name', 'sku', 'category']`
- `list_filter`: `['is_active', 'category', 'supplier', 'warehouse']`

## Comportamientos especiales

- **Soft delete: sí** — `DELETE /products/{id}/` → `is_active=False`
- List solo devuelve `is_active=True`
- GET detail de inactivo → 404
- `supplier` y `warehouse` con `PROTECT`: intentar eliminar un supplier/warehouse con productos activos → error de BD (DRF retorna `400`)
- Nested resources: ninguno
- Lógica de negocio: ninguna adicional

## Ubicación

App ya existe en `apps/products/`. Solo implementar archivos faltantes:

- `models.py` — vacío, rellenar
- `serializers.py` — crear
- `views.py` — vacío, rellenar
- `urls.py` — crear
- `filters.py` — crear
- `admin.py` — vacío, rellenar

`apps/products/apps.py` ya tiene `name = 'apps.products'` ✅
`INSTALLED_APPS` ya tiene `'apps.products'` ✅

Agregar en `config/urls.py`: `include('apps.products.urls')`

## Criterios de aceptación

- [ ] `python manage.py makemigrations products` genera migración con FKs correctas
- [ ] `python manage.py migrate` aplica sin errores
- [ ] `python manage.py check` — 0 errores
- [ ] `POST /api/v1/products/` con supplier y warehouse válidos → 201
- [ ] `POST /api/v1/products/` con supplier inexistente → 400
- [ ] `POST /api/v1/products/` con sku duplicado → 400
- [ ] `GET /api/v1/products/?category=laptop` filtra correctamente
- [ ] `GET /api/v1/products/?supplier=<id>` filtra por proveedor
- [ ] `GET /api/v1/products/?warehouse=<id>` filtra por almacén
- [ ] `GET /api/v1/products/?unit_price_gte=100` filtra por precio mínimo
- [ ] `DELETE /api/v1/products/{id}/` → 204, `is_active=False` en BD
- [ ] Acceso sin token → 401
