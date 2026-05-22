# Spec: Suppliers (Proveedores)

## Modelo

| Campo          | Tipo Django            | Constraints                        | Notas                     |
| -------------- | ---------------------- | ---------------------------------- | ------------------------- |
| `id`           | BigAutoField (default) | PK, autoincrement                  | No declarar — Django auto |
| `name`         | CharField(255)         | NOT NULL                           |                           |
| `tax_id`       | CharField(50)          | unique=True, null=True, blank=True | RUC/NIT, opcional         |
| `contact_name` | CharField(255)         | NOT NULL                           | Nombre del contacto       |
| `email`        | CharField(254)         | NOT NULL                           |                           |
| `phone`        | CharField(20)          | NOT NULL                           |                           |
| `address`      | CharField(500)         | NOT NULL                           |                           |
| `city`         | CharField(100)         | NOT NULL                           |                           |
| `country`      | CharField(100)         | NOT NULL, default='Colombia'       |                           |
| `is_active`    | BooleanField           | NOT NULL, default=True             | Soft delete               |
| `created_at`   | DateTimeField          | auto_now_add=True                  |                           |
| `updated_at`   | DateTimeField          | auto_now=True                      |                           |

- `db_table = 'suppliers'`
- Sin FKs en este modelo
- `ordering = ['-created_at']`

## Serializer

- Clase: `SupplierSerializer`
- Hereda: `ModelSerializer`
- Campos: `__all__`
- Campos de solo lectura: `['id', 'created_at', 'updated_at']`
- Validaciones custom: ninguna
- Serializers anidados: ninguno

## ViewSet

- Clase: `SupplierViewSet`
- Hereda: `ModelViewSet`
- Queryset base: `Supplier.objects.filter(is_active=True)`
- Permisos: `IsAuthenticated` (default global)
- Acciones personalizadas: ninguna
- Overrides:
  - `get_queryset`: filtrar `is_active=True`
  - `perform_destroy`: soft delete — setear `is_active=False` y `save()`, no borrar el registro

## URLs

- Router: `DefaultRouter`
- Prefix: `suppliers`
- Basename: `supplier`
- Resultado: `/api/v1/suppliers/` y `/api/v1/suppliers/{id}/`
- Rutas nested: ninguna

## Filtros (django-filter)

- Clase: `SupplierFilter`
- Campos filtrables:
  - `city` — exact
  - `country` — exact
- Búsqueda por texto (`SearchFilter`): `name`, `contact_name`, `email`, `tax_id`
- Ordenamiento (`OrderingFilter`): `name`, `created_at`

## Admin

- `@admin.register(Supplier)`
- `list_display`: `['name', 'contact_name', 'email', 'city', 'is_active']`
- `search_fields`: `['name', 'contact_name', 'email', 'tax_id']`
- `list_filter`: `['is_active', 'country', 'city']`

## Comportamientos especiales

- **Soft delete: sí** — `DELETE /suppliers/{id}/` no borra el registro, solo `is_active=False`
- El GET list solo devuelve registros con `is_active=True`
- El GET detail de un supplier inactivo devuelve 404
- Nested resources: ninguno
- Lógica de negocio: ninguna adicional

## Ubicación

App en `apps/suppliers/` siguiendo la estructura establecida.

- `apps.py`: `name = 'apps.suppliers'`
- `INSTALLED_APPS`: `'apps.suppliers'`
- `config/urls.py`: `include('apps.suppliers.urls')`

## Criterios de aceptación

- [ ] `python manage.py startapp suppliers apps/suppliers` ejecutado
- [ ] `apps/suppliers/apps.py` con `name = 'apps.suppliers'`
- [ ] `INSTALLED_APPS` incluye `'apps.suppliers'`
- [ ] `python manage.py makemigrations suppliers` genera migración limpia
- [ ] `python manage.py migrate` aplica sin errores
- [ ] `python manage.py check` — 0 errores
- [ ] `GET /api/v1/suppliers/` sin token → 401
- [ ] `POST /api/v1/suppliers/` con token y payload válido → 201
- [ ] `DELETE /api/v1/suppliers/{id}/` → 204, registro con `is_active=False` en BD
- [ ] `GET /api/v1/suppliers/{id}/` del eliminado → 404
- [ ] `GET /api/v1/suppliers/?city=Medellín` filtra correctamente
- [ ] `GET /api/v1/suppliers/?search=tech` busca en name, contact_name, email, tax_id
- [ ] Supplier visible en Django Admin
