# Proyecto Logística API

[← Volver al índice](../README.md) | [Siguiente: SDD →](./02-sdd-metodologia.md)

---

## ¿Qué construimos?

Una **API REST de logística** para gestionar el ciclo completo de envío de productos tecnológicos: desde el almacenamiento y la compra a proveedores, hasta la entrega al cliente final.

El proyecto completo se llama `logistica-api` y está construido con **Python + Django + Django REST Framework**.

---

## Stack del proyecto

| Capa | Tecnología | Versión |
|---|---|---|
| Lenguaje | Python | 3.14 |
| Framework web | Django | 6.0.5 |
| API REST | Django REST Framework (DRF) | 3.17.1 |
| Autenticación | djangorestframework-simplejwt | JWT |
| Documentación | drf-spectacular | OpenAPI 3.0 |
| Filtros | django-filter | — |
| CORS | django-cors-headers | — |
| Config | python-decouple | `.env` |
| BD desarrollo | SQLite | — |
| BD producción | PostgreSQL (Railway) | — |

---

## Los 8 módulos del sistema

El sistema tiene 8 módulos Django, cada uno como una app independiente:

| Módulo | App | Descripción |
|---|---|---|
| Almacenes | `apps.warehouses` | Puntos de partida y almacenamiento |
| Proveedores | `apps.suppliers` | Empresas que venden los productos |
| Clientes | `apps.customers` | Empresas o personas que generan envíos |
| Transporte | `apps.transport` | Vehículos disponibles para entregas |
| Productos | `apps.products` | Productos tecnológicos a enviar |
| Rutas | `apps.routes` | Secuencias de paradas de un transporte |
| Conductores | `apps.drivers` | Personas asignadas a un transporte |
| Envíos | `apps.shipments` | Módulo central — une todo el sistema |

---

## Estructura del proyecto

```
logistica-api/
├── config/
│   ├── settings/
│   │   ├── base.py       # configuración compartida
│   │   ├── development.py
│   │   └── production.py
│   ├── urls.py           # router principal
│   └── wsgi.py
├── apps/
│   ├── warehouses/       # models, serializers, views, urls, admin, filters
│   ├── suppliers/
│   ├── customers/
│   ├── transport/
│   ├── products/
│   ├── routes/
│   ├── drivers/
│   └── shipments/
├── spec/                 # especificaciones generadas por el agente Spec
├── docs/
│   ├── database-schema.md
│   └── architecture.md
└── manage.py
```

Todas las apps viven bajo `apps/` para mantener el proyecto ordenado. El `config/` contiene la configuración del proyecto Django (equivalente a lo que en otros frameworks sería el directorio raíz del proyecto).

---

## Orden de desarrollo (fases)

Las apps se desarrollaron en fases según sus dependencias:

```
Fase 0 → Setup del proyecto (settings, JWT, Swagger, CORS)
Fase 1 → warehouses, suppliers, customers, transport  (sin dependencias)
Fase 2 → products, routes                             (dependen de Fase 1)
Fase 3 → drivers                                      (depende de auth_user + transport)
Fase 4 → shipments, shipment_items                    (depende de todo)
```

Este orden es crítico: no se puede crear `products` sin haber creado antes `warehouses` y `suppliers`, porque `products` tiene FKs hacia ellas.

---

## Cada módulo tiene la misma estructura interna

```python
apps/warehouses/
├── models.py       # definición del modelo Django (tabla en BD)
├── serializers.py  # convierte modelo ↔ JSON
├── views.py        # lógica de los endpoints (ModelViewSet)
├── urls.py         # registra las URLs con el router DRF
├── admin.py        # registra el modelo en el panel de administración
└── filters.py      # filtros para los endpoints GET (django-filter)
```

Esta consistencia es intencional: cualquier desarrollador puede navegar cualquier app y encontrar exactamente lo que espera en el lugar esperado.

---

## Endpoints generados automáticamente

Usando `ModelViewSet` + `DefaultRouter` de DRF, cada app genera 5 endpoints automáticamente:

```
GET    /api/v1/warehouses/         → lista todos (con paginación y filtros)
POST   /api/v1/warehouses/         → crea uno nuevo
GET    /api/v1/warehouses/{id}/    → detalle de uno
PUT    /api/v1/warehouses/{id}/    → reemplaza completo
PATCH  /api/v1/warehouses/{id}/    → actualiza parcial
DELETE /api/v1/warehouses/{id}/    → elimina (soft delete)
```

---

## Auth: JWT en todos los endpoints

Todas las rutas están protegidas por defecto:

```python
# config/settings/base.py
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
}
```

Para acceder a cualquier endpoint hay que:

1. Obtener token: `POST /api/v1/auth/token/` con `username` + `password`
2. Incluir en cada request: `Authorization: Bearer <access_token>`
3. Renovar cuando expira (1h): `POST /api/v1/auth/token/refresh/`

---

[Siguiente: SDD →](./02-sdd-metodologia.md)
