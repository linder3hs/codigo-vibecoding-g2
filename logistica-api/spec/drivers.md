# Spec: Drivers (Conductores)

## Modelo

| Campo            | Tipo Django            | Constraints                            | Notas                                           |
| ---------------- | ---------------------- | -------------------------------------- | ----------------------------------------------- |
| `id`             | BigAutoField (default) | PK, autoincrement                      | No declarar — Django auto                       |
| `user`           | OneToOneField          | FK → settings.AUTH_USER_MODEL, PROTECT | unique implícito, related_name='driver_profile' |
| `transport`      | ForeignKey             | FK → Transport, nullable, SET_NULL     | on_delete=SET_NULL, related_name='drivers'      |
| `license_number` | CharField(50)          | NOT NULL, unique=True                  |                                                 |
| `license_expiry` | DateField              | NOT NULL                               |                                                 |
| `phone`          | CharField(20)          | NOT NULL                               |                                                 |
| `is_active`      | BooleanField           | NOT NULL, default=True                 | Soft delete                                     |
| `created_at`     | DateTimeField          | auto_now_add=True                      |                                                 |
| `updated_at`     | DateTimeField          | auto_now=True                          |                                                 |

- `db_table = 'drivers'`
- `ordering = ['-created_at']`
- `user` — usar `settings.AUTH_USER_MODEL` en lugar de importar `User` directamente
- `transport` — `SET_NULL`: si se elimina el transporte, el conductor queda sin vehículo asignado (no se borra)
- `user` — `PROTECT`: no se puede eliminar un usuario que tenga perfil de conductor

### Imports del modelo

```python
from django.conf import settings
from apps.transport.models import Transport
```

## Serializers

### DriverSerializer

- Clase: `DriverSerializer`
- Hereda: `ModelSerializer`
- Campos: `__all__`
- Campos de solo lectura: `['id', 'created_at', 'updated_at']`
- Validaciones custom: ninguna
- Serializers anidados: ninguno — `user` y `transport` se envían/reciben como IDs

### DriverReadSerializer

- Clase: `DriverReadSerializer`
- Hereda: `ModelSerializer`
- Propósito: mostrar info del usuario en las respuestas GET (nombre, email)
- Campos extra (SerializerMethodField):
  - `user_full_name` — `f"{instance.user.first_name} {instance.user.last_name}".strip()`
  - `user_email` — `instance.user.email`
  - `user_username` — `instance.user.username`
- Campos: `__all__` + los 3 campos calculados
- Campos de solo lectura: todos (es solo para lectura)

### Uso en ViewSet:

- `GET` (list, retrieve) → `DriverReadSerializer`
- `POST`, `PUT`, `PATCH` → `DriverSerializer`

## ViewSet

- Clase: `DriverViewSet`
- Hereda: `ModelViewSet`
- Queryset: `Driver.objects.filter(is_active=True).select_related('user', 'transport')`
- Permisos: `IsAuthenticated`
- Overrides:
  - `get_queryset`: filtrar `is_active=True` con `select_related`
  - `get_serializer_class`: retornar `DriverReadSerializer` para GET, `DriverSerializer` para escritura
  - `perform_destroy`: soft delete — `is_active=False` y `save()`

## URLs

- Router: `DefaultRouter`
- Prefix: `drivers`
- Basename: `driver`
- Resultado: `/api/v1/drivers/` y `/api/v1/drivers/{id}/`
- Rutas nested: ninguna

## Filtros (django-filter)

- Clase: `DriverFilter`
- Campos filtrables:
  - `transport` — exact (por ID)
  - `is_active` — exact
- Búsqueda por texto (`SearchFilter`): `license_number`, `phone`, `user__first_name`, `user__last_name`, `user__email`
- Ordenamiento (`OrderingFilter`): `license_expiry`, `created_at`

## Admin

```python
@admin.register(Driver)
class DriverAdmin(admin.ModelAdmin):
    list_display = ['get_full_name', 'license_number', 'license_expiry', 'transport', 'is_active']
    search_fields = ['license_number', 'user__first_name', 'user__last_name', 'user__email']
    list_filter = ['is_active', 'transport']

    @admin.display(description='Conductor')
    def get_full_name(self, obj):
        return f'{obj.user.get_full_name()} ({obj.user.username})'
```

## Comportamientos especiales

- **Soft delete: sí** — `DELETE /drivers/{id}/` → `is_active=False`
- List solo devuelve `is_active=True`
- GET detail de inactivo → 404
- `user` es OneToOne: un usuario solo puede tener un perfil de conductor — DRF retorna `400` si se intenta duplicar
- `transport` nullable: conductor puede existir sin vehículo asignado
- `transport` con `SET_NULL`: si se elimina físicamente un transport, el campo queda `null` (no falla)
- Las respuestas GET incluyen `user_full_name`, `user_email`, `user_username` para facilitar la UI

## Prerrequisito para crear un driver

El `user` debe existir en `auth_user` antes de crear el driver. En desarrollo, crear con:

```bash
source .venv/bin/activate && python manage.py createsuperuser
```

O via Django Admin en `/admin/auth/user/add/`.

## Ubicación

App nueva en `apps/drivers/`:

- `apps.py`: `name = 'apps.drivers'`
- `INSTALLED_APPS`: `'apps.drivers'`
- `config/urls.py`: `include('apps.drivers.urls')`

## Criterios de aceptación

- [ ] `apps/drivers/apps.py` con `name = 'apps.drivers'`
- [ ] `python manage.py makemigrations drivers` genera migración con OneToOneField y FK a transport
- [ ] `python manage.py migrate` aplica sin errores
- [ ] `python manage.py check` — 0 errores
- [ ] `POST /api/v1/drivers/` con user válido → 201
- [ ] `POST /api/v1/drivers/` con el mismo user → 400 (OneToOne constraint)
- [ ] `POST /api/v1/drivers/` sin transport (campo omitido) → 201 con `transport: null`
- [ ] `GET /api/v1/drivers/` incluye `user_full_name`, `user_email`, `user_username`
- [ ] `GET /api/v1/drivers/?transport=<id>` filtra por vehículo asignado
- [ ] `DELETE /api/v1/drivers/{id}/` → 204, `is_active=False` en BD
- [ ] Acceso sin token → 401
