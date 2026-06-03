# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Reglas

- **Comunicación y documentación:** español
- **Código, nombres de archivos, carpetas, variables, commits:** inglés

---

## Stack frontend

- **Next.js 16** — App Router (`app/` directory)
- **React 19**
- **TypeScript 5** — strict mode activado
- **Tailwind CSS v4** (via `@tailwindcss/postcss`)
- **shadcn/ui** — estilo `base-nova`, componentes en `components/ui/`
- **TanStack Query v5** (`@tanstack/react-query`) — server state y peticiones HTTP
- **TanStack Table v8** (`@tanstack/react-table`) — todas las tablas del proyecto
- **Axios** — HTTP client, instance configurada en `lib/axios.ts`
- **Zustand** — estado UI global (NO para datos del servidor)
- **React Hook Form + Zod** — formularios y validación (`shadcn <Form>` está construido sobre ellos)
- **Fonts:** Geist Sans + Geist Mono via `next/font/google`

### Notas críticas del stack

**TanStack Query v5** — diferencias con v4:
- `useQuery` solo acepta objeto: `useQuery({ queryKey, queryFn })`
- `status: 'pending'` en lugar de `'loading'`; usar `isPending`
- `onSuccess`/`onError` eliminados de `useQuery` — no usar
- `invalidateQueries` requiere objeto: `queryClient.invalidateQueries({ queryKey: [...] })`

**`"use client"` — regla estricta:**
- Por defecto todos los archivos son React Server Components (sin directiva)
- Agregar SOLO cuando se usan: `useState`, `useEffect`, hooks de TanStack Query, event handlers, browser APIs
- Las páginas de lista SIEMPRE son `"use client"` — usan hooks
- Los formularios SIEMPRE son `"use client"` — usan `useForm`

**Zustand vs TanStack Query:**
- TanStack Query: datos del servidor (listas, entidades, mutations)
- Zustand: estado UI solamente (sidebar open, modal open, selected row)

**Imports:**
- Siempre usar el alias `@/` (configurado en `tsconfig.json`)
- Nunca rutas relativas largas `../../..`

---

## Comandos

```bash
npm run dev      # servidor dev en :3000 — SIEMPRE MANUAL, nunca ejecutar automáticamente
npm run build    # build de producción
npm run start    # servir build de producción
npm run lint     # ESLint (eslint-config-next)
npx tsc --noEmit # verificar TypeScript sin compilar
```

---

## Backend conectado

| Campo | Valor |
|-------|-------|
| Ruta en monorepo | `../logistica-api/` |
| Framework | Django 6 + DRF 3.17 |
| Puerto | `8000` |
| Base URL API | `http://localhost:8000/api/v1/` |
| Auth | JWT (`Authorization: Bearer <token>`) |
| Swagger | `http://localhost:8000/api/v1/docs/` |

### Módulos del backend

| Módulo | Endpoint base | Notas clave |
|--------|--------------|-------------|
| **Auth** | `/api/v1/auth/token/` | POST login, POST `/token/refresh/` para renovar |
| **Customers** | `/api/v1/customers/` | `customer_type`: COMPANY \| INDIVIDUAL. Soft delete |
| **Warehouses** | `/api/v1/warehouses/` | lat/long opcionales. Soft delete |
| **Suppliers** | `/api/v1/suppliers/` | Soft delete |
| **Products** | `/api/v1/products/` | FK a `supplier` y `warehouse`. SKU único. Soft delete |
| **Transport** | `/api/v1/transport/` | `transport_type`: TRUCK \| VAN \| MOTORCYCLE \| CARGO_BIKE. Sin soft delete |
| **Drivers** | `/api/v1/drivers/` | Extiende `auth_user`. GET retorna `user_full_name/email/username`. Soft delete |
| **Routes** | `/api/v1/routes/` + `/routes/{id}/stops/` | Paradas como sub-recurso. Soft delete |
| **Shipments** | `/api/v1/shipments/` + `/shipments/{id}/items/` | Módulo central. `tracking_number` auto. Status: PENDING→CONFIRMED→IN_TRANSIT→DELIVERED |

**Orden de dependencias para crear datos:**
```
warehouses + suppliers + customers + transport
    → products (necesita warehouse + supplier)
    → routes (necesita warehouse)
    → drivers (necesita auth_user + transport)
    → shipments (necesita todo)
```

**Referencia completa de la API:** `docs/api-reference.md`  
**Módulos y relaciones:** `docs/backend-modules.md`

---

## Arquitectura frontend

```
app/
├── (auth)/login/           ← página de login
├── (dashboard)/
│   ├── layout.tsx          ← sidebar + navbar (requiere auth)
│   ├── customers/
│   ├── warehouses/
│   ├── suppliers/
│   ├── products/
│   ├── transport/
│   ├── drivers/
│   ├── routes/[id]/
│   └── shipments/[id]/
├── providers.tsx           ← QueryClientProvider (client component)
├── layout.tsx              ← root layout con Providers
└── globals.css
components/
├── ui/                     ← generado por shadcn — NO modificar manualmente
├── layout/                 ← Sidebar, Navbar
└── modules/
    └── <modulo>/           ← componentes específicos de dominio
lib/
├── axios.ts                ← instancia axios con interceptores JWT
├── auth.ts                 ← helpers JWT (get/set/clear tokens)
├── api/                    ← un archivo por módulo
├── hooks/                  ← hooks TanStack Query por módulo
├── columns/                ← columnas TanStack Table por módulo
└── store/                  ← stores Zustand (solo UI state)
types/
└── <modulo>.ts             ← interfaces TypeScript por módulo
```

---

## Sistema de agentes SDD

El proyecto usa metodología **Spec Driven Development** con 4 agentes especializados en `.claude/agents/`.

**El punto de entrada para construir cualquier módulo es siempre el Orchestrator.**

### Flujo obligatorio

```
orchestrator → spec → [APROBACIÓN HUMANA] → implement → validator → [si errores: implement] → completado
```

Nunca saltar la aprobación de spec. Nunca implementar sin spec aprobada.

### Agentes disponibles

| Agente | Archivo | Responsabilidad |
|--------|---------|-----------------|
| **orchestrator** | `.claude/agents/orchestrator.md` | Coordinador del flujo SDD. Punto de entrada para cada módulo. |
| **spec** | `.claude/agents/spec.md` | Genera `docs/specs/<modulo>.md`. Se detiene para aprobación humana. |
| **implement** | `.claude/agents/implement.md` | Implementa código según spec aprobada. |
| **validator** | `.claude/agents/validator.md` | Audita código. Genera reporte o aprueba y marca criterios. |

### Estado del proyecto por módulo

Ver `docs/mvp.md` para el estado actualizado de cada fase y módulo.

### Documentación de referencia para agentes

| Documento | Cuándo consultar |
|-----------|-----------------|
| `docs/api-reference.md` | Endpoints, payloads, query params — leer SIEMPRE antes de generar spec |
| `docs/backend-modules.md` | Lógica de negocio, relaciones, validaciones — leer SIEMPRE antes de generar spec |
| `docs/mvp.md` | Estado de fases, alcance de módulos, patrón CRUD estándar |
| `docs/specs/<modulo>.md` | Spec del módulo — leer SIEMPRE antes de implementar |
| `docs/specs/validation-report-<modulo>.md` | Reporte de errores del validator |
