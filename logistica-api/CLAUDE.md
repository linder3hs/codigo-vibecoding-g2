# CLAUDE.md

Este archivo proporciona orientación a Claude Code (claude.ai/code) al trabajar con el código de este repositorio.

## Reglas del proyecto

### Idioma

- **Comunicación y documentación** (respuestas, comentarios explicativos, mensajes de error para el usuario, texto de este archivo): **español**
- **Código y elementos de desarrollo** (nombres de variables, funciones, clases, archivos, carpetas, tablas, columnas, ramas de git, mensajes de commit): **inglés**

### Entorno virtual

- Antes de ejecutar **cualquier comando** dentro del proyecto, siempre activar el entorno virtual: `source .venv/bin/activate`
- Se puede encadenar con `&&` para no olvidarlo: `source .venv/bin/activate && <comando>`

### Comandos permitidos vs manuales

- Claude Code **puede ejecutar** cualquier comando del proyecto (`migrate`, `makemigrations`, `test`, `pip install`, etc.)
- `python manage.py runserver` es **siempre manual** — nunca ejecutarlo automáticamente

### Skills de Django

- Este proyecto usa el plugin **`django-skills`** — invocar las skills de ese plugin para cualquier tarea Django (modelos, vistas, serializers, migraciones, tests, configuración, etc.)
- Siempre preferir las skills de `django-skills` sobre enfoques genéricos al trabajar en este proyecto

---

## Documentación de referencia obligatoria

Leer **ambos archivos antes de cualquier tarea de desarrollo**:

| Documento        | Ruta                                                 | Cuándo consultar                                                           |
| ---------------- | ---------------------------------------------------- | -------------------------------------------------------------------------- |
| Schema de BD     | [`docs/database-schema.md`](docs/database-schema.md) | Modelos, migraciones, relaciones, queries                                  |
| Arquitectura MVP | [`docs/architecture.md`](docs/architecture.md)       | Estructura de carpetas, endpoints, patrones de código, orden de desarrollo |

## Schema de base de datos

Referencia completa en [`docs/database-schema.md`](docs/database-schema.md).

**Leer este archivo antes de cualquier tarea de desarrollo** — modelos, migraciones, serializers, vistas o queries.

Resumen rápido de tablas propias:

| App          | Tabla(s)                             |
| ------------ | ------------------------------------ |
| `customers`  | `customers`                          |
| `warehouses` | `warehouses`                         |
| `suppliers`  | `suppliers`                          |
| `products`   | `products`                           |
| `transport`  | `transport`                          |
| `drivers`    | `drivers` (OneToOne con `auth_user`) |
| `routes`     | `routes`, `route_stops`              |
| `shipments`  | `shipments`, `shipment_items`        |

---

## Contexto del proyecto

API REST de logística para gestionar el ciclo completo de envío de productos tecnológicos: desde el almacenamiento y la compra a proveedores, hasta la entrega al cliente final a través de transportes y rutas definidas.

## Módulos del sistema

| Módulo      | App Django   | Descripción                                                                            |
| ----------- | ------------ | -------------------------------------------------------------------------------------- |
| Cliente     | `customers`  | Empresa o persona que genera envíos                                                    |
| Envío       | `shipments`  | Unidad central de negocio — origen, destino, estado, fecha de entrega, costo calculado |
| Productos   | `products`   | Productos de tecnología que serán enviados                                             |
| Transporte  | `transport`  | Medio físico para entregar los productos                                               |
| Conductor   | `drivers`    | Persona asignada a un transporte                                                       |
| Ruta        | `routes`     | Secuencia de paradas de un transporte                                                  |
| Almacén     | `warehouses` | Punto de partida y almacenamiento de productos                                         |
| Proveedores | `suppliers`  | Empresas que venden los productos                                                      |

> El módulo `products` ya está scaffolded en el proyecto. Los demás se crearán en la fase de desarrollo.

---

## Stack

|           |                                                                                   |
| --------- | --------------------------------------------------------------------------------- |
| Runtime   | Python 3.14                                                                       |
| Framework | Django 6 + Django REST Framework 3.17                                             |
| BD        | SQLite (`db.sqlite3`) en desarrollo; `psycopg2-binary` disponible para PostgreSQL |
| Config    | `python-decouple` para variables de entorno                                       |
| Puerto    | `8000` (Django por defecto)                                                       |

## Comandos

> Siempre activar el entorno virtual antes de cualquier comando. Usar `&&` para encadenar.

```bash
# Servidor de desarrollo — SIEMPRE MANUAL, nunca ejecutar automáticamente
source .venv/bin/activate && python manage.py runserver

# Migraciones
source .venv/bin/activate && python manage.py makemigrations
source .venv/bin/activate && python manage.py migrate

# Tests
source .venv/bin/activate && python manage.py test
source .venv/bin/activate && python manage.py test products  # app individual

# Crear superusuario
source .venv/bin/activate && python manage.py createsuperuser

# Instalar dependencias
source .venv/bin/activate && pip install -r requirements.txt
```

## Arquitectura

```
logistica-api/
├── config/           # Configuración del proyecto Django (settings, urls, wsgi, asgi)
├── products/         # Primera app de dominio — models, views, tests (scaffolded, sin implementar)
├── manage.py
├── requirements.txt
└── db.sqlite3        # BD de desarrollo — no commitear en producción
```

**La configuración del proyecto vive en `config/`**, no en un directorio interno homónimo. `ROOT_URLCONF = 'config.urls'`.

`rest_framework` y `products` **aún no están en `INSTALLED_APPS`** — agregar ambos al conectar DRF o la app products.

## Agregar una nueva app de dominio

1. `python manage.py startapp <name>`
2. Agregar a `INSTALLED_APPS` en `config/settings.py`
3. Definir models → `makemigrations` → `migrate`
4. Agregar serializers, views (ModelViewSet o APIView), URL router
5. Incluir URLs de la app en `config/urls.py`

## Estado actual

- App `products` está scaffolded pero vacía (sin models, views, URLs ni serializers).
- DRF instalado (`djangorestframework` en requirements) pero no registrado en `INSTALLED_APPS` aún.
- Sin archivo `.env` — `python-decouple` disponible pero no conectado a settings.
- `SECRET_KEY` es el valor inseguro generado por defecto — reemplazar con variable de entorno antes de cualquier despliegue compartido.

---

## Metodología SDD (Spec Driven Development)

**Consultar el agente Orchestrator antes de iniciar cualquier módulo nuevo.**

El agente Orchestrator coordina el flujo obligatorio:

```
[Spec] → genera spec/[módulo].md
[Implement] → lee spec → escribe código
[Validator] → audita código → reporta errores o confirma OK
[Orchestrator] → decide si corregir o avanzar
```

### Agentes disponibles en `.claude/agents/`

| Archivo             | Rol                                                       |
| ------------------- | --------------------------------------------------------- |
| `orchestrator.md`   | Coordinador del flujo — no escribe código                 |
| `spec.md`           | Genera `spec/[módulo].md` con requerimientos detallados   |
| `implement.md`      | Implementa el código Django siguiendo la spec             |
| `validator.md`      | Audita el código — no escribe código, solo reporta        |

### Carpeta `spec/`

Contiene las especificaciones generadas por el agente Spec:
- `spec/[módulo].md` — spec del módulo
- `spec/validation-report-[módulo].md` — reporte de errores del Validator (si existen)

### Regla fundamental

**Implement nunca toca código sin spec. Validator nunca escribe código.**
