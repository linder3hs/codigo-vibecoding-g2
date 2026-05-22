# Spec: Transport (Transporte)

## Modelo

| Campo            | Tipo Django            | Constraints                    | Notas                                      |
| ---------------- | ---------------------- | ------------------------------ | ------------------------------------------ |
| `id`             | BigAutoField (default) | PK, autoincrement              | No declarar — Django auto                  |
| `plate_number`   | CharField(20)          | NOT NULL, unique=True          | Placa del vehículo                         |
| `transport_type` | CharField(20)          | NOT NULL                       | choices: TRUCK, VAN, MOTORCYCLE, CARGO_BIKE |
| `brand`          | CharField(100)         | NOT NULL                       |                                            |
| `model`          | CharField(100)         | NOT NULL                       | Modelo del vehículo                        |
| `year`           | IntegerField           | NOT NULL                       | Año de fabricación                         |
| `capacity_kg`    | DecimalField(10,2)     | NOT NULL                       | Capacidad máxima en kg                     |
| `capacity_m3`    | DecimalField(8,2)      | NOT NULL                       | Capacidad máxima en m³                     |
| `is_available`   | BooleanField           | NOT NULL, default=True         | Disponible para asignación — NO es soft delete |
| `created_at`     | DateTimeField          | auto_now_add=True              |                                            |
| `updated_at`     | DateTimeField          | auto_now=True                  |                                            |

- `db_table = 'transport'`
- Sin FKs en este modelo
- `ordering = ['-created_at']`
- Choices en el modelo:
  ```python
  TRUCK = 'TRUCK'
  VAN = 'VAN'
  MOTORCYCLE = 'MOTORCYCLE'
  CARGO_BIKE = 'CARGO_BIKE'
  TYPE_CHOICES = [
      (TRUCK, 'Truck'),
      (VAN, 'Van'),
      (MOTORCYCLE, 'Motorcycle'),
      (CARGO_BIKE, 'Cargo Bike'),
  ]
  ```

> **Importante:** `is_available` NO es soft delete. Indica si el vehículo está libre para ser asignado. El DELETE físico está permitido. No sobreescribir `perform_destroy`.

## Serializer

- Clase: `TransportSerializer`
- Hereda: `ModelSerializer`
- Campos: `__all__`
- Campos de solo lectura: `['id', 'created_at', 'updated_at']`
- Validaciones custom: ninguna
- Serializers anidados: ninguno

## ViewSet

- Clase: `TransportViewSet`
- Hereda: `ModelViewSet`
- Queryset base: `Transport.objects.all()` — sin filtro por `is_available` (admin debe ver todos)
- Permisos: `IsAuthenticated` (default global)
- Acciones personalizadas: ninguna
- Overrides: ninguno — DELETE físico, no soft delete

## URLs

- Router: `DefaultRouter`
- Prefix: `transport`
- Basename: `transport`
- Resultado: `/api/v1/transport/` y `/api/v1/transport/{id}/`
- Rutas nested: ninguna

## Filtros (django-filter)

- Clase: `TransportFilter`
- Campos filtrables:
  - `transport_type` — exact
  - `is_available` — exact
  - `capacity_kg` — gte, lte
  - `capacity_m3` — gte, lte
- Búsqueda por texto (`SearchFilter`): `plate_number`, `brand`, `model`
- Ordenamiento (`OrderingFilter`): `brand`, `year`, `capacity_kg`, `created_at`

## Admin

- `@admin.register(Transport)`
- `list_display`: `['plate_number', 'transport_type', 'brand', 'model', 'year', 'capacity_kg', 'is_available']`
- `search_fields`: `['plate_number', 'brand', 'model']`
- `list_filter`: `['transport_type', 'is_available']`

## Comportamientos especiales

- **Sin soft delete** — `is_available` es estado operativo, no de borrado
- DELETE elimina el registro físicamente
- List devuelve todos los transportes (activos e inactivos) — el filtro `?is_available=true` permite buscar solo los disponibles
- Nested resources: ninguno
- Lógica de negocio: ninguna adicional

## Ubicación

App en `apps/transport/` siguiendo la estructura establecida.

- `apps.py`: `name = 'apps.transport'`
- `INSTALLED_APPS`: `'apps.transport'`
- `config/urls.py`: `include('apps.transport.urls')`

## Criterios de aceptación

- [ ] `apps/transport/apps.py` con `name = 'apps.transport'`
- [ ] `INSTALLED_APPS` incluye `'apps.transport'`
- [ ] `python manage.py makemigrations transport` genera migración limpia
- [ ] `python manage.py migrate` aplica sin errores
- [ ] `python manage.py check` — 0 errores
- [ ] `POST /api/v1/transport/` con `transport_type=TRUCK` → 201
- [ ] `POST /api/v1/transport/` con `plate_number` duplicado → 400
- [ ] `GET /api/v1/transport/?transport_type=VAN` filtra correctamente
- [ ] `GET /api/v1/transport/?is_available=true` devuelve solo disponibles
- [ ] `GET /api/v1/transport/?capacity_kg_gte=1000` filtra por capacidad
- [ ] `DELETE /api/v1/transport/{id}/` → 204, registro eliminado físicamente de BD
- [ ] Acceso sin token → 401
