# Spec: Customers (Clientes)

## Modelo

| Campo           | Tipo Django            | Constraints                        | Notas                        |
| --------------- | ---------------------- | ---------------------------------- | ---------------------------- |
| `id`            | BigAutoField (default) | PK, autoincrement                  | No declarar — Django auto    |
| `name`          | CharField(255)         | NOT NULL                           |                              |
| `customer_type` | CharField(10)          | NOT NULL, default='COMPANY'        | choices: COMPANY, INDIVIDUAL |
| `tax_id`        | CharField(50)          | unique=True, null=True, blank=True | RUC/NIT, opcional            |
| `email`         | CharField(254)         | NOT NULL, unique=True              | Correo único por cliente     |
| `phone`         | CharField(20)          | NOT NULL                           |                              |
| `address`       | CharField(500)         | NOT NULL                           |                              |
| `city`          | CharField(100)         | NOT NULL                           |                              |
| `country`       | CharField(100)         | NOT NULL, default='Colombia'       |                              |
| `is_active`     | BooleanField           | NOT NULL, default=True             | Soft delete                  |
| `created_at`    | DateTimeField          | auto_now_add=True                  |                              |
| `updated_at`    | DateTimeField          | auto_now=True                      |                              |

- `db_table = 'customers'`
- Sin FKs en este modelo
- `ordering = ['-created_at']`
- Choices en el modelo:
  ```python
  COMPANY = 'COMPANY'
  INDIVIDUAL = 'INDIVIDUAL'
  TYPE_CHOICES = [(COMPANY, 'Company'), (INDIVIDUAL, 'Individual')]
  ```

## Serializer

- Clase: `CustomerSerializer`
- Hereda: `ModelSerializer`
- Campos: `__all__`
- Campos de solo lectura: `['id', 'created_at', 'updated_at']`
- Validaciones custom: ninguna
- Serializers anidados: ninguno

## ViewSet

- Clase: `CustomerViewSet`
- Hereda: `ModelViewSet`
- Queryset base: `Customer.objects.filter(is_active=True)`
- Permisos: `IsAuthenticated` (default global)
- Acciones personalizadas: ninguna
- Overrides:
  - `get_queryset`: filtrar `is_active=True`
  - `perform_destroy`: soft delete — `is_active=False` y `save()`

## URLs

- Router: `DefaultRouter`
- Prefix: `customers`
- Basename: `customer`
- Resultado: `/api/v1/customers/` y `/api/v1/customers/{id}/`
- Rutas nested: ninguna

## Filtros (django-filter)

- Clase: `CustomerFilter`
- Campos filtrables:
  - `customer_type` — exact
  - `city` — exact
  - `country` — exact
- Búsqueda por texto (`SearchFilter`): `name`, `email`, `tax_id`
- Ordenamiento (`OrderingFilter`): `name`, `created_at`

## Admin

- `@admin.register(Customer)`
- `list_display`: `['name', 'customer_type', 'email', 'city', 'is_active']`
- `search_fields`: `['name', 'email', 'tax_id']`
- `list_filter`: `['is_active', 'customer_type', 'country', 'city']`

## Comportamientos especiales

- **Soft delete: sí** — `DELETE /customers/{id}/` → `is_active=False`
- List solo devuelve `is_active=True`
- GET detail de inactivo → 404
- `email` único a nivel de BD — DRF retornará `400` si se intenta crear duplicado
- Nested resources: ninguno
- Lógica de negocio: ninguna adicional

## Ubicación

App en `apps/customers/` siguiendo la estructura establecida.

- `apps.py`: `name = 'apps.customers'`
- `INSTALLED_APPS`: `'apps.customers'`
- `config/urls.py`: `include('apps.customers.urls')`

## Criterios de aceptación

- [ ] `apps/customers/apps.py` con `name = 'apps.customers'`
- [ ] `INSTALLED_APPS` incluye `'apps.customers'`
- [ ] `python manage.py makemigrations customers` genera migración limpia
- [ ] `python manage.py migrate` aplica sin errores
- [ ] `python manage.py check` — 0 errores
- [ ] `POST /api/v1/customers/` con `customer_type=COMPANY` → 201
- [ ] `POST /api/v1/customers/` con `customer_type=INDIVIDUAL` → 201
- [ ] `POST /api/v1/customers/` con email duplicado → 400
- [ ] `GET /api/v1/customers/?customer_type=COMPANY` filtra correctamente
- [ ] `DELETE /api/v1/customers/{id}/` → 204, registro con `is_active=False` en BD
- [ ] `GET /api/v1/customers/{id}/` del eliminado → 404
- [ ] Acceso sin token → 401
