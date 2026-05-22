# JWT y Documentación con drf-spectacular

[← Anterior: DRF](./03-django-rest-framework.md) | [Siguiente: Glosario →](./glosario-clase-sdd.md)

---

## JWT en Django — djangorestframework-simplejwt

### ¿Qué es JWT?

Un **JSON Web Token** es un token firmado criptográficamente que el servidor genera al hacer login. El cliente lo guarda y lo envía en cada petición para demostrar su identidad.

```
POST /api/v1/auth/token/ { username, password }
   → { access: "eyJ...", refresh: "eyJ..." }

GET /api/v1/warehouses/
   → Headers: Authorization: Bearer eyJ...
```

El servidor no necesita consultar la base de datos para validar el token: la firma criptográfica es suficiente.

---

### Configuración en el proyecto

```python
# config/settings/base.py
from datetime import timedelta

INSTALLED_APPS = [
    # ...
    'rest_framework_simplejwt',
]

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',  # todo requiere auth
    ],
}

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME':  timedelta(hours=1),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS':  True,
    'AUTH_HEADER_TYPES':      ('Bearer',),
}
```

```python
# config/urls.py
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

urlpatterns = [
    path('api/v1/auth/token/',         TokenObtainPairView.as_view()),
    path('api/v1/auth/token/refresh/', TokenRefreshView.as_view()),
    # ... resto de las apps
]
```

---

### Flujo de autenticación

```
1. Login
   POST /api/v1/auth/token/
   Body: { "username": "admin", "password": "1234" }
   Response: { "access": "eyJ...", "refresh": "eyJ..." }

2. Usar la API
   GET /api/v1/shipments/
   Header: Authorization: Bearer eyJ...
   Response: { "count": 5, "results": [...] }

3. Renovar cuando expira (1 hora)
   POST /api/v1/auth/token/refresh/
   Body: { "refresh": "eyJ..." }
   Response: { "access": "nuevo_token_eyJ..." }
```

---

### Access vs Refresh token

| | Access Token | Refresh Token |
|---|---|---|
| **Duración** | 1 hora | 7 días |
| **Uso** | En cada petición | Solo para renovar el access |
| **Si se compromete** | Atacante tiene acceso 1h | Atacante puede regenerar access tokens |

El refresh token es más peligroso si se filtra. Por eso tiene su propio endpoint separado y se guarda más cuidadosamente (HttpOnly cookie en producción).

---

## Documentación con drf-spectacular

### ¿Qué es drf-spectacular?

**drf-spectacular** lee el código del proyecto (modelos, serializers, viewsets) y genera automáticamente la documentación OpenAPI 3.0 con interfaz Swagger UI.

A diferencia de la clase anterior donde la documentación se escribía manualmente, aquí se **genera sola** a partir del código.

---

### Configuración

```python
# config/settings/base.py
INSTALLED_APPS = [
    # ...
    'drf_spectacular',
]

REST_FRAMEWORK = {
    'DEFAULT_SCHEMA_CLASS': 'drf_spectacular.openapi.AutoSchema',
}

SPECTACULAR_SETTINGS = {
    'TITLE':       'Logistica API',
    'DESCRIPTION': 'API REST para gestión logística de envíos de productos tecnológicos',
    'VERSION':     '1.0.0',
    'SERVE_INCLUDE_SCHEMA': False,
}
```

```python
# config/urls.py
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

urlpatterns = [
    path('api/v1/schema/', SpectacularAPIView.as_view(),                   name='schema'),
    path('api/v1/docs/',   SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
]
```

Con el servidor corriendo, la documentación está en `http://localhost:8000/api/v1/docs/`.

---

### SerializerMethodField y @extend_schema_field

Los campos calculados en un serializer (como `user_full_name` en drivers) no tienen tipo definido automáticamente. drf-spectacular lanza un warning si no se especifica:

```
Warning: unable to resolve type hint for function "get_user_full_name"
```

Se resuelve con `@extend_schema_field`:

```python
from drf_spectacular.utils import extend_schema_field

class DriverReadSerializer(serializers.ModelSerializer):

    @extend_schema_field(serializers.CharField())   # ← le dice el tipo a Spectacular
    def get_user_full_name(self, instance):
        return f'{instance.user.first_name} {instance.user.last_name}'.strip()

    @extend_schema_field(serializers.EmailField())  # ← tipo más específico
    def get_user_email(self, instance):
        return instance.user.email
```

---

### Validar el schema antes de desplegar

drf-spectacular incluye un comando para validar que el schema genera sin errores:

```bash
source .venv/bin/activate && python manage.py spectacular --validate --fail-on-warn
```

- Sin errores: imprime el schema YAML completo y sale con código 0
- Con errores: lista los problemas y sale con código 1

Este comando es útil como check antes de un deploy o para depurar cuando Swagger no carga.

---

### Diferencia con la clase anterior

| | Task Manager (clase 04) | Logística API (clase 05) |
|---|---|---|
| **Librería** | swagger-jsdoc + swagger-ui-express | drf-spectacular |
| **Cómo se documenta** | Se escribe manualmente en el código | Se genera automáticamente del código |
| **Mantenimiento** | Hay que actualizar la doc cuando cambia el código | Se actualiza sola al cambiar el código |
| **Riesgo** | Doc puede quedar desincronizada | Doc siempre refleja el código real |

---

[Siguiente: Glosario →](./glosario-clase-sdd.md)
