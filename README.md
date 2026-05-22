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

**Qué construimos:**
- API REST de logística con 8 módulos Django (warehouses, suppliers, customers, transport, products, routes, drivers, shipments)
- Metodología SDD con 4 agentes de IA: Spec, Implement, Validator, Orchestrator
- Autenticación JWT con `djangorestframework-simplejwt`
- Documentación automática OpenAPI 3.0 con `drf-spectacular`
- Soft delete, recursos anidados (`/routes/{id}/stops/`), dual serializer pattern

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

## ¿Por dónde empezar?

Si es tu primera vez, sigue las clases **en orden**.

Si quieres repasar algo específico, entra directo al archivo que necesitas.

> Si algo no funciona, avisa en el grupo. No te quedes atascado solo.

---

_Vibe Coding G2 · 2026_
