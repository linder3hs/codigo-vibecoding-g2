# Spec: Routes (Rutas)

## Modelos

### Route

| Campo                      | Tipo Django            | Constraints                       | Notas                                        |
| -------------------------- | ---------------------- | --------------------------------- | -------------------------------------------- |
| `id`                       | BigAutoField (default) | PK, autoincrement                 | No declarar — Django auto                    |
| `origin_warehouse`         | ForeignKey             | FK → Warehouse, NOT NULL, PROTECT | on_delete=PROTECT, related_name='routes'     |
| `name`                     | CharField(255)         | NOT NULL                          |                                              |
| `estimated_duration_hours` | DecimalField(6,2)      | NOT NULL                          |                                              |
| `estimated_distance_km`    | DecimalField(10,2)     | NOT NULL                          |                                              |
| `is_active`                | BooleanField           | NOT NULL, default=True            | Soft delete                                  |
| `created_at`               | DateTimeField          | auto_now_add=True                 |                                              |
| `updated_at`               | DateTimeField          | auto_now=True                     |                                              |

- `db_table = 'routes'`
- `ordering = ['-created_at']`
- FK con `PROTECT`: no se puede eliminar un warehouse que tenga rutas asociadas

### RouteStop

| Campo                    | Tipo Django            | Constraints                    | Notas                              |
| ------------------------ | ---------------------- | ------------------------------ | ---------------------------------- |
| `id`                     | BigAutoField (default) | PK, autoincrement              | No declarar — Django auto          |
| `route`                  | ForeignKey             | FK → Route, NOT NULL, CASCADE  | on_delete=CASCADE, related_name='stops' |
| `stop_order`             | IntegerField           | NOT NULL                       | Orden de la parada (1, 2, 3…)      |
| `address`                | CharField(500)         | NOT NULL                       |                                    |
| `city`                   | CharField(100)         | NOT NULL                       |                                    |
| `latitude`               | DecimalField(9,6)      | null=True, blank=True          |                                    |
| `longitude`              | DecimalField(9,6)      | null=True, blank=True          |                                    |
| `estimated_offset_hours` | DecimalField(6,2)      | NOT NULL                       | Horas desde inicio de la ruta      |

- `db_table = 'route_stops'`
- `ordering = ['stop_order']`
- `unique_together = [('route', 'stop_order')]`
- CASCADE: al eliminar una ruta, sus paradas se eliminan también

## Serializers

### RouteStopSerializer
- Clase: `RouteStopSerializer`
- Hereda: `ModelSerializer`
- Campos: `__all__`
- Campos de solo lectura: `['id', 'route']` — `route` se inyecta desde la URL, no del body

### RouteSerializer
- Clase: `RouteSerializer`
- Hereda: `ModelSerializer`
- Campos: `__all__`
- Campos de solo lectura: `['id', 'created_at', 'updated_at']`
- Serializers anidados: ninguno (FK `origin_warehouse` se envía como ID)

## ViewSets

### RouteViewSet
- Clase: `RouteViewSet`
- Hereda: `ModelViewSet`
- Queryset: `Route.objects.filter(is_active=True).select_related('origin_warehouse')`
- Permisos: `IsAuthenticated`
- Overrides:
  - `get_queryset`: filtrar `is_active=True` con `select_related`
  - `perform_destroy`: soft delete — `is_active=False` y `save()`
- Acción personalizada `stops`:
  ```python
  @action(detail=True, methods=['get', 'post'], url_path='stops')
  def stops(self, request, pk=None):
  ```
  - `GET`: listar paradas de la ruta ordenadas por `stop_order`
  - `POST`: crear nueva parada, inyectar `route` automáticamente desde el objeto de la URL

### No se crea RouteStopViewSet separado — toda la lógica de stops va en el `@action`

## URLs

- Router: `DefaultRouter`
- Prefix: `routes`, basename: `route`
- Rutas generadas por router: `/api/v1/routes/` y `/api/v1/routes/{id}/`
- Ruta nested generada por `@action`: `/api/v1/routes/{id}/stops/`

## Filtros (django-filter)

### RouteFilter
- Campos filtrables:
  - `origin_warehouse` — exact (por ID)
- Búsqueda por texto (`SearchFilter`): `name`
- Ordenamiento (`OrderingFilter`): `name`, `estimated_duration_hours`, `estimated_distance_km`, `created_at`

## Admin

```python
class RouteStopInline(admin.TabularInline):
    model = RouteStop
    extra = 0
    ordering = ['stop_order']

@admin.register(Route)
class RouteAdmin(admin.ModelAdmin):
    list_display = ['name', 'origin_warehouse', 'estimated_duration_hours', 'estimated_distance_km', 'is_active']
    search_fields = ['name']
    list_filter = ['is_active', 'origin_warehouse']
    inlines = [RouteStopInline]
```

## Comportamientos especiales

- **Soft delete en Route**: `DELETE /routes/{id}/` → `is_active=False` (las stops permanecen en BD)
- List solo devuelve rutas con `is_active=True`
- GET detail de ruta inactiva → 404
- **Stops usan CASCADE**: si se borrara físicamente una ruta, sus stops se eliminan
- `unique_together` en stops: no puede repetirse `(route_id, stop_order)` → DRF retorna `400`
- Nested `stops`:
  - `GET /api/v1/routes/{id}/stops/` — devuelve lista ordenada por `stop_order` (sin paginación)
  - `POST /api/v1/routes/{id}/stops/` — crea una parada; `route` se toma de la URL, no del body

## Ubicación

App nueva en `apps/routes/`:
- `apps.py`: `name = 'apps.routes'`
- `INSTALLED_APPS`: `'apps.routes'`
- `config/urls.py`: `include('apps.routes.urls')`

## Criterios de aceptación

- [ ] `apps/routes/apps.py` con `name = 'apps.routes'`
- [ ] Dos modelos en `models.py`: `Route` y `RouteStop`
- [ ] `python manage.py makemigrations routes` — migración con `unique_together` en `route_stops`
- [ ] `python manage.py migrate` aplica sin errores
- [ ] `python manage.py check` — 0 errores
- [ ] `POST /api/v1/routes/` con warehouse válido → 201
- [ ] `GET /api/v1/routes/{id}/stops/` → lista de paradas ordenadas por `stop_order`
- [ ] `POST /api/v1/routes/{id}/stops/` → 201, `route` asignado automáticamente
- [ ] `POST /api/v1/routes/{id}/stops/` con `stop_order` duplicado → 400
- [ ] `DELETE /api/v1/routes/{id}/` → 204, `is_active=False` en BD
- [ ] Acceso sin token → 401
