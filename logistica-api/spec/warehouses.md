# Spec: Warehouses (Almacenes)

## Modelo

| Campo         | Tipo Django            | Constraints                  | Notas                     |
| ------------- | ---------------------- | ---------------------------- | ------------------------- |
| `id`          | BigAutoField (default) | PK, autoincrement            | No declarar — Django auto |
| `name`        | CharField(255)         | NOT NULL                     |                           |
| `address`     | CharField(500)         | NOT NULL                     |                           |
| `city`        | CharField(100)         | NOT NULL                     |                           |
| `country`     | CharField(100)         | NOT NULL, default='Colombia' |                           |
| `latitude`    | DecimalField(9,6)      | null=True, blank=True        | Coordenada opcional       |
| `longitude`   | DecimalField(9,6)      | null=True, blank=True        | Coordenada opcional       |
| `capacity_m3` | DecimalField(10,2)     | NOT NULL                     | Metros cúbicos            |
| `is_active`   | BooleanField           | NOT NULL, default=True       | Soft delete               |
| `created_at`  | DateTimeField          | auto_now_add=True            |                           |
| `updated_at`  | DateTimeField          | auto_now=True                |                           |

- `db_table = 'warehouses'`
- Sin FKs en este modelo
- `ordering = ['-created_at']`

## Serializer

- Clase: `WarehouseSerializer`
- Hereda: `ModelSerializer`
- Campos: `__all__`
- Campos de solo lectura: `['id', 'created_at', 'updated_at']`
- Validaciones custom: ninguna
- Serializers anidados: ninguno

## ViewSet

- Clase: `WarehouseViewSet`
- Hereda: `ModelViewSet`
- Queryset base: `Warehouse.objects.filter(is_active=True)`
- Permisos: `IsAuthenticated` (default global)
- Acciones personalizadas: ninguna
- Overrides:
  - `get_queryset`: filtrar `is_active=True`
  - `perform_destroy`: soft delete — setear `is_active=False` y `save()`, no borrar el registro

## URLs

- Router: `DefaultRouter`
- Prefix: `warehouses`
- Basename: `warehouse`
- Resultado: `/api/v1/warehouses/` y `/api/v1/warehouses/{id}/`
- Rutas nested: ninguna

## Filtros (django-filter)

- Clase: `WarehouseFilter`
- Campos filtrables:
  - `city` — exact
  - `country` — exact
  - `capacity_m3` — gte, lte
- Búsqueda por texto (`SearchFilter`): `name`, `city`, `address`
- Ordenamiento (`OrderingFilter`): `name`, `capacity_m3`, `created_at`

## Admin

- `@admin.register(Warehouse)`
- `list_display`: `['name', 'city', 'country', 'capacity_m3', 'is_active']`
- `search_fields`: `['name', 'city', 'address']`
- `list_filter`: `['is_active', 'country', 'city']`

## Comportamientos especiales

- **Soft delete: sí** — `DELETE /warehouses/{id}/` no borra el registro, solo `is_active=False`
- El GET list solo devuelve registros con `is_active=True`
- El GET detail de un warehouse inactivo devuelve 404
- Nested resources: ninguno
- Lógica de negocio: ninguna adicional

## Ubicación de apps (corrección de estructura)

Según `docs/architecture.md`, todas las apps de dominio viven en `apps/`. Esta carpeta no existe aún — crearla como parte de esta tarea.

### Paso previo obligatorio: mover `products`

Antes de crear `warehouses`, mover la app `products` existente a `apps/products/`:

1. Crear carpeta `apps/` en la raíz con `apps/__init__.py`
2. Mover `products/` → `apps/products/`
3. Actualizar `apps/products/apps.py`: `name = 'apps.products'`
4. Actualizar `INSTALLED_APPS` en `config/settings/base.py`: `'apps.products'`
5. Verificar que `python manage.py check` pasa sin errores

### Crear `warehouses` en `apps/`

```
apps/
├── __init__.py
├── products/          ← movido desde raíz
└── warehouses/        ← nueva app
    ├── __init__.py
    ├── apps.py        → name = 'apps.warehouses'
    ├── admin.py
    ├── models.py
    ├── serializers.py
    ├── views.py
    ├── urls.py
    ├── filters.py
    └── migrations/
        └── __init__.py
```

- `INSTALLED_APPS` usa `'apps.warehouses'`
- `config/urls.py` incluye con `include('apps.warehouses.urls')`

## Criterios de aceptación

- [ ] Carpeta `apps/` existe con `__init__.py`
- [ ] `products` movido a `apps/products/` y `apps.py` actualizado con `name = 'apps.products'`
- [ ] `warehouses` creado en `apps/warehouses/` con `name = 'apps.warehouses'`
- [ ] `INSTALLED_APPS` usa `'apps.products'` y `'apps.warehouses'`
- [ ] `python manage.py makemigrations warehouses` genera migración limpia
- [ ] `python manage.py migrate` aplica sin errores
- [ ] `python manage.py check` — 0 errores
- [ ] `GET /api/v1/warehouses/` sin token → 401
- [ ] `POST /api/v1/warehouses/` con token y payload válido → 201
- [ ] `DELETE /api/v1/warehouses/{id}/` → 204, registro sigue en BD con `is_active=False`
- [ ] `GET /api/v1/warehouses/{id}/` del registro eliminado → 404
- [ ] `GET /api/v1/warehouses/?city=Bogotá` filtra correctamente
- [ ] `GET /api/v1/warehouses/?search=central` busca en name, city, address
- [ ] Warehouse visible en Django Admin en `/admin/`
