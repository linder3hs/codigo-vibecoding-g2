# Vibe Coding G2

> Material de todas las clases. Sigue el orden — cada clase construye sobre la anterior.

---

## Clases

### Clase 01 — Configuración del entorno

> Instala todo lo necesario para empezar a programar.

| Paso                                   | Tema                        | Descripción                                            |
| -------------------------------------- | --------------------------- | ------------------------------------------------------ |
| [Paso 1](./clase-01/01-terminal.md)    | Terminal y comandos básicos | Aprende a moverte por tu computadora desde la terminal |
| [Paso 2](./clase-01/02-nodejs.md)      | Node.js                     | Instala el motor que necesita todo lo demás            |
| [Paso 3](./clase-01/03-cursor.md)      | Cursor                      | Tu editor de código con IA integrada                   |
| [Paso 4](./clase-01/04-warp.md)        | Warp y alternativas         | Terminal moderna — y qué hacer si no funciona          |
| [Paso 5](./clase-01/05-claude-code.md) | Claude Code                 | Asistente de IA en tu terminal (requiere cuenta Pro)   |
| [Paso 6](./clase-01/06-opencode.md)    | OpenCode                    | Alternativa gratuita a Claude Code                     |

**Checklist antes de la Clase 02:**
- [ ] Terminal abierta y comandos básicos funcionando
- [ ] `node --version` muestra un número
- [ ] `npm --version` muestra un número
- [ ] Cursor instalado y abierto
- [ ] Una terminal que funciona (Warp u alternativa)
- [ ] **Opción A:** Claude Code autenticado con cuenta Pro
- [ ] **Opción B:** OpenCode configurado con un proveedor gratuito

---

### Clase 02 — Task Manager Backend

> Construimos una API REST desde cero con Node.js y Express usando Vibe Coding.

| Archivo                                                        | Qué contiene                                         |
| -------------------------------------------------------------- | ---------------------------------------------------- |
| [Conceptos de Backend](./clase-02/conceptos-backend.md)        | Backend, API, REST, endpoints, HTTP, JSON explicados |
| [Glosario de la Clase](./clase-02/glosario-clase-02.md)        | Todos los términos vistos en clase con ejemplos      |
| [Prompt usado en clase](./clase-02/prompt1.md)                 | El prompt real con el que construimos el proyecto    |
| [Código del proyecto](./task-manager-backend/)                 | Backend completo — Node.js + Express                 |

**Qué construimos:**
- API REST con 5 endpoints CRUD para tareas
- Organización por dominio (model / controller / routes)
- IDs únicos automáticos con UUID
- Documentación interactiva en `/api-docs` (Swagger)

**Para correr el proyecto:**
```bash
cd task-manager-backend
npm install
npm run dev
# API en http://localhost:3000
# Docs en http://localhost:3000/api-docs
```

---

### Clase 03 — Task Manager Frontend

> Construimos la interfaz de usuario con React, TypeScript y Tailwind CSS.

| Archivo | Qué contiene |
| --- | --- |
| [¿Qué es el Frontend?](./clase-03/01-que-es-el-frontend.md) | Frontend vs backend, el stack elegido |
| [React y TypeScript](./clase-03/02-react-typescript.md) | Componentes, props, estado, hooks, JSX |
| [Vite y Tailwind](./clase-03/03-vite-tailwind.md) | Herramientas de desarrollo y estilos |
| [Estructura del Proyecto](./clase-03/04-estructura-proyecto.md) | Componentes, páginas, services — cómo encaja todo |
| [Glosario de la Clase](./clase-03/glosario-clase-03.md) | Todos los términos de React, TypeScript y web |
| [Código del proyecto](./task-manager-frontend/) | Frontend completo — React + TypeScript + Vite |

**Qué construimos:**
- SPA con React 19 + TypeScript + Vite + Tailwind CSS v4
- Lista de tareas con crear, editar, eliminar y toggle de completado
- Página de login con validación en tiempo real
- Página de detalle de tarea con React Router
- Capa de servicios con Axios para comunicarse con el backend

**Para correr el proyecto:**
```bash
cd task-manager-frontend
npm install
npm run dev
# App en http://localhost:5173
# (requiere backend corriendo en localhost:3000)
```

---

### Clase 04 — Backend Evolucionado

> Migramos de memoria local a PostgreSQL con Prisma, y agregamos autenticación de usuarios.

| Archivo | Qué contiene |
| --- | --- |
| [Bases de Datos y PostgreSQL](./clase-04/01-base-de-datos-postgresql.md) | Por qué necesitamos BD, tablas, relaciones, SQL |
| [Prisma ORM](./clase-04/02-prisma-orm.md) | Schema, migraciones, Prisma Client, operaciones CRUD |
| [Autenticación](./clase-04/03-autenticacion.md) | bcrypt, hash de contraseñas, registro, login, tokens |
| [Swagger](./clase-04/04-swagger.md) | Documentación interactiva de la API |
| [Glosario de la Clase](./clase-04/glosario-clase-04.md) | BD, ORM, auth, JWT, variables de entorno |
| [Código del proyecto](./task-manager-backend/) | Backend actualizado — Node.js + Express + Prisma + PostgreSQL |

**Qué construimos:**
- Migración de arrays en memoria a PostgreSQL con Prisma ORM
- Modelos `User` y `Task` con relación entre ellos
- Migraciones versionadas con Prisma Migrate
- Módulo de usuarios: registro con bcrypt + login con token
- Documentación Swagger actualizada con endpoints de usuarios

**Para correr el proyecto:**
```bash
cd task-manager-backend
npm install
# Configurar DATABASE_URL en .env
npx prisma migrate dev
npm run dev
# API en http://localhost:3000
# Docs en http://localhost:3000/api-docs
```

---

### Clase SDD — Logística API con Django

> Construimos una API REST de logística con Python + Django + DRF usando la metodología SDD (Spec Driven Development).

| Archivo | Qué contiene |
| --- | --- |
| [Proyecto Logística API](./clase-sdd/01-proyecto-logistica-api.md) | Stack, 8 módulos, estructura de carpetas, fases de desarrollo |
| [SDD — Spec Driven Development](./clase-sdd/02-sdd-metodologia.md) | Qué es SDD, flujo, los 4 agentes, ejemplo paso a paso |
| [Django REST Framework](./clase-sdd/03-django-rest-framework.md) | ModelViewSet, serializers, soft delete, filtros, recursos anidados |
| [JWT y Swagger](./clase-sdd/04-jwt-swagger.md) | JWT con SimpleJWT, drf-spectacular, documentación automática |
| [Glosario de la Clase](./clase-sdd/glosario-clase-sdd.md) | SDD, agentes, DRF, JWT, relaciones Django |
| [Código del proyecto](./logistica-api/) | API completa — Python + Django 6 + DRF 3.17 |

**Stack:**

| | |
| --- | --- |
| Runtime | Python 3.14 |
| Framework | Django 6.0.5 + DRF 3.17.1 |
| Auth | `djangorestframework-simplejwt` 5.5.1 |
| BD | SQLite (desarrollo) · PostgreSQL (producción) |
| Docs | `drf-spectacular` 0.29.0 → Swagger UI |
| Filtros | `django-filter` 25.2 |
| Tests | `model-bakery` + `coverage` |

**Qué construimos:**

*Módulos de dominio — 8 apps Django:*

| App | Tabla(s) | Endpoints |
| --- | --- | --- |
| `warehouses` | `warehouse` | CRUD `/api/v1/warehouses/` |
| `suppliers` | `supplier` | CRUD `/api/v1/suppliers/` |
| `customers` | `customer` | CRUD `/api/v1/customers/` |
| `products` | `product` | CRUD `/api/v1/products/` |
| `transport` | `transport` | CRUD `/api/v1/transport/` |
| `drivers` | `driver` (OneToOne con `auth_user`) | CRUD `/api/v1/drivers/` |
| `routes` | `route`, `route_stop` | CRUD `/api/v1/routes/` |
| `shipments` | `shipment`, `shipment_item` | CRUD + `/api/v1/shipments/{id}/items/` |

*Sistema de autenticación y gestión de usuarios:*

| Endpoint | Método | Descripción |
| --- | --- | --- |
| `/api/v1/auth/token/` | POST | Login — retorna `access` + `refresh`. El JWT incluye `is_superuser` como claim custom |
| `/api/v1/auth/token/refresh/` | POST | Renueva el access token |
| `/api/v1/auth/me/` | GET | Perfil del usuario autenticado (datos + grupos + permisos) |
| `/api/v1/auth/me/` | PATCH | Actualizar nombre, apellido, email o contraseña propia |
| `/api/v1/admin/users/` | GET · POST | Listar / crear usuarios — solo superadmin |
| `/api/v1/admin/users/{id}/` | GET · PATCH · DELETE | Detalle / editar / eliminar usuario |
| `/api/v1/admin/users/{id}/assign-groups/` | POST | Asignar grupos (roles) a un usuario |
| `/api/v1/admin/groups/` | GET · POST | Listar / crear grupos |
| `/api/v1/admin/groups/{id}/` | GET · PUT · DELETE | Detalle / editar / eliminar grupo |
| `/api/v1/admin/groups/{id}/assign-permissions/` | POST | Asignar permisos de Django a un grupo |
| `/api/v1/admin/permissions/` | GET | Listar todos los permisos disponibles (`?search=`, `?page_size=`) |

*Patrones de arquitectura:*
- Metodología SDD con 4 agentes de IA: Spec → Implement → Validator → Orchestrator
- `IsSuperAdmin` — permission class para endpoints de administración
- `StrictDjangoModelPermissions` — chequea `view_/add_/change_/delete_<model>` en todos los ViewSets de dominio; superadmins lo pasan automáticamente
- JWT custom con `is_superuser` en payload
- Paginación flexible con `page_size` query param
- Soft delete (`is_active = False`) en todos los módulos de dominio
- 545 tests (unit + integración) con `model-bakery`

**Para correr el proyecto:**
```bash
cd logistica-api
source .venv/bin/activate
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
# API en http://localhost:8000/api/v1/
# Docs en http://localhost:8000/api/v1/docs/
```

---

### Logística Frontend — Next.js + React

> Dashboard web para gestionar el sistema de logística. Se conecta a la Logística API y respeta los roles y permisos de cada usuario.

| Código | |
| --- | --- |
| [Código del proyecto](./logistica-frontend/) | Frontend completo — Next.js 16 + React 19 + TypeScript |

**Stack:**

| | |
| --- | --- |
| Framework | Next.js 16.2 (App Router) |
| UI | React 19 + TypeScript + Tailwind CSS v4 |
| Componentes | shadcn/ui (style: base-nova) + Lucide icons |
| Estado servidor | TanStack Query v5 |
| Estado cliente | Zustand v5 |
| Tablas | TanStack Table v8 |
| Formularios | React Hook Form + Zod v4 |
| HTTP | Axios — interceptor automático para refresh de token |

**Páginas:**

| Ruta | Descripción |
| --- | --- |
| `/login` | Formulario de autenticación |
| `/dashboard` | Panel principal |
| `/customers` | CRUD clientes |
| `/suppliers` | CRUD proveedores |
| `/warehouses` | CRUD almacenes |
| `/products` | CRUD productos (con página dedicada crear/editar) |
| `/transport` | CRUD transportes |
| `/drivers` | CRUD conductores |
| `/routes` | CRUD rutas + detalle de paradas |
| `/shipments` | CRUD envíos + detalle con items |
| `/profile` | Perfil del usuario — editar nombre, email y contraseña |
| `/admin/users` | Gestión de usuarios — solo superadmin |
| `/admin/groups` | Gestión de grupos y sus permisos — solo superadmin |

**Qué construimos:**

- Auth flow completo: login → JWT → refresh automático → logout con limpieza de store
- Roles y permisos reflejados en la UI:
  - Sidebar oculta links donde el usuario no tiene `view_<model>`
  - Botones "Nuevo" ocultos si no tiene `add_<model>`
  - Botones editar/eliminar en tablas ocultos según `change_`/`delete_<model>`
  - Sección Administración visible solo a superadmins
- Superadmin puede crear usuarios, asignar grupos y asignar permisos de Django a grupos
- Perfil de usuario con datos reales desde `/me/` y formulario de edición
- Topbar muestra username + email del usuario autenticado
- Paginación, búsqueda y filtros en todas las tablas

**Para correr el proyecto:**
```bash
cd logistica-frontend
npm install
npm run dev
# App en http://localhost:3000
# (requiere logistica-api corriendo en localhost:8000)
```

---

## ¿Por dónde empezar?

Si es tu primera vez, sigue las clases **en orden**.

Si quieres repasar algo específico, entra directo al archivo que necesitas.

> Si algo no funciona, avisa en el grupo. No te quedes atascado solo.

---

_Vibe Coding G2 · 2026_
