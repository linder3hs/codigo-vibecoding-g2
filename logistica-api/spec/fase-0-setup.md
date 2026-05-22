# Spec: Fase 0 — Setup del Proyecto

## Objetivo

Configurar la base del proyecto para habilitar DRF, JWT, CORS, filtros, documentación automática y split de settings dev/prod.

---

## 1. Dependencias a instalar

```
djangorestframework-simplejwt
django-cors-headers
django-filter
drf-spectacular
dj-database-url
```

Actualizar `requirements.txt` con versiones fijadas tras instalación.

---

## 2. Split de settings

### Estructura

```
config/
└── settings/
    ├── __init__.py    (vacío)
    ├── base.py        (todo lo compartido)
    ├── development.py (SQLite, DEBUG=True)
    └── production.py  (PostgreSQL via DATABASE_URL, DEBUG=False)
```

Eliminar `config/settings.py` existente.

### base.py — contenido

**`BASE_DIR`**: `Path(__file__).resolve().parent.parent.parent` (3 niveles: settings/ → config/ → raíz)

**`SECRET_KEY`**: `config('SECRET_KEY')`

**`INSTALLED_APPS`**:
```python
[
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    # Third-party
    'rest_framework',
    'rest_framework_simplejwt',
    'corsheaders',
    'django_filters',
    'drf_spectacular',
    # Local apps (agregar aquí cada nueva app)
    'products',
]
```

**`MIDDLEWARE`** — agregar `corsheaders.middleware.CorsMiddleware` después de `SecurityMiddleware` y antes de `CommonMiddleware`:
```python
'django.middleware.security.SecurityMiddleware',
'corsheaders.middleware.CorsMiddleware',
'django.contrib.sessions.middleware.SessionMiddleware',
'django.middleware.common.CommonMiddleware',
...
```

**`REST_FRAMEWORK`**:
```python
{
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
    'DEFAULT_FILTER_BACKENDS': [
        'django_filters.rest_framework.DjangoFilterBackend',
        'rest_framework.filters.SearchFilter',
        'rest_framework.filters.OrderingFilter',
    ],
    'DEFAULT_SCHEMA_CLASS': 'drf_spectacular.openapi.AutoSchema',
}
```

**`SIMPLE_JWT`**:
```python
from datetime import timedelta
{
    'ACCESS_TOKEN_LIFETIME': timedelta(hours=1),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
    'AUTH_HEADER_TYPES': ('Bearer',),
}
```

**`SPECTACULAR_SETTINGS`**:
```python
{
    'TITLE': 'Logistica API',
    'DESCRIPTION': 'API REST para gestión logística de envíos de productos tecnológicos',
    'VERSION': '1.0.0',
    'SERVE_INCLUDE_SCHEMA': False,
}
```

**`CORS_ALLOWED_ORIGINS`**: leer de env var `CORS_ALLOWED_ORIGINS`, default `'http://localhost:3000,http://localhost:5173'`, split por coma.

**`STATIC_ROOT`**: `BASE_DIR / 'staticfiles'`

**`DEFAULT_AUTO_FIELD`**: `'django.db.models.BigAutoField'`

El resto (TEMPLATES, AUTH_PASSWORD_VALIDATORS, i18n, LANGUAGE_CODE, TIME_ZONE, USE_TZ) igual que el settings.py actual.

### development.py — contenido

```python
from .base import *

DEBUG = True
ALLOWED_HOSTS = ['localhost', '127.0.0.1']

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}
```

### production.py — contenido

```python
from .base import *
import dj_database_url

DEBUG = False
ALLOWED_HOSTS = config('ALLOWED_HOSTS', default='').split(',')

DATABASES = {
    'default': dj_database_url.config(default=config('DATABASE_URL'))
}

STATIC_ROOT = BASE_DIR / 'staticfiles'
```

---

## 3. Archivos a actualizar para el nuevo módulo de settings

| Archivo           | Cambio                                                              |
| ----------------- | ------------------------------------------------------------------- |
| `manage.py`       | `DJANGO_SETTINGS_MODULE` → `'config.settings.development'`         |
| `config/wsgi.py`  | `DJANGO_SETTINGS_MODULE` → `'config.settings.development'`         |
| `config/asgi.py`  | `DJANGO_SETTINGS_MODULE` → `'config.settings.development'`         |

---

## 4. Archivo `.env.example`

Crear en la raíz del proyecto:

```
SECRET_KEY=your-secret-key-here
DEBUG=True
DATABASE_URL=sqlite:///db.sqlite3
ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
```

---

## 5. `config/urls.py` — actualizar

```python
from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/v1/auth/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/v1/auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/v1/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/v1/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
]
```

---

## Criterios de aceptación

- [ ] `source .venv/bin/activate && python manage.py check` — sin errores
- [ ] `source .venv/bin/activate && python manage.py migrate` — aplica limpiamente
- [ ] Carpeta `config/settings/` existe con 4 archivos (`__init__.py`, `base.py`, `development.py`, `production.py`)
- [ ] `config/settings.py` eliminado
- [ ] `manage.py` apunta a `config.settings.development`
- [ ] `.env.example` existe en la raíz
- [ ] `requirements.txt` actualizado con nuevas dependencias
