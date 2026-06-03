# Plan SDD — Frontend Logística

Metodología: **Spec Driven Development**  
Stack: Next.js 16 App Router · React 19 · TypeScript · Tailwind CSS v4

## Flujo SDD obligatorio

```
[Spec] → docs/specs/<módulo>.md
[Implement] → lee spec → escribe código
[Review] → audita código → reporta o confirma OK
```

Nunca implementar sin spec. Crear `docs/specs/<módulo>.md` antes de escribir código de ese módulo.

---

## Arquitectura de carpetas proyectada

```
app/
├── (auth)/
│   └── login/
│       └── page.tsx
├── (dashboard)/
│   ├── layout.tsx              ← layout con sidebar + navbar autenticado
│   ├── page.tsx                ← dashboard / home
│   ├── customers/
│   │   ├── page.tsx            ← lista
│   │   └── [id]/page.tsx       ← detalle / edición
│   ├── warehouses/
│   ├── suppliers/
│   ├── products/
│   ├── transport/
│   ├── drivers/
│   ├── routes/
│   │   └── [id]/stops/
│   └── shipments/
│       └── [id]/items/
│
├── components/
│   ├── ui/                     ← componentes base (Button, Input, Table, Badge...)
│   ├── layout/                 ← Sidebar, Navbar, PageHeader
│   └── modules/                ← componentes específicos de dominio
│
├── lib/
│   ├── api/                    ← clientes axios por módulo
│   │   ├── auth.ts
│   │   ├── customers.ts
│   │   └── ...
│   ├── auth.ts                 ← helpers JWT (get/set/clear token)
│   └── utils.ts
│
└── types/
    ├── auth.ts
    ├── customer.ts
    ├── warehouse.ts
    ├── supplier.ts
    ├── product.ts
    ├── transport.ts
    ├── driver.ts
    ├── route.ts
    └── shipment.ts
```

---

## Orden de desarrollo (por dependencias de datos)

### Fase 0 — Infraestructura
- [ ] Configurar axios con `baseURL`, interceptores JWT y refresh automático
- [ ] Tipos TypeScript para todos los módulos (desde `docs/api-reference.md`)
- [ ] Layout dashboard con sidebar de navegación
- [ ] Página de login con flujo JWT completo
- [ ] Guard de rutas (redirect a login si no hay token)

### Fase 1 — Módulos sin dependencias entre sí
- [ ] `warehouses` — CRUD completo
- [ ] `suppliers` — CRUD completo
- [ ] `customers` — CRUD completo
- [ ] `transport` — CRUD completo

### Fase 2 — Dependen de Fase 1
- [ ] `products` (necesita `warehouse` y `supplier` en selects)
- [ ] `routes` + `route_stops` (necesita `warehouse`)

### Fase 3 — Depende de Fase 1 + 2
- [ ] `drivers` (necesita `transport`)

### Fase 4 — Módulo central
- [ ] `shipments` + `shipment_items` (necesita todo)

---

## Patrones de implementación

### Llamadas a la API
Cada módulo tiene su propio archivo en `lib/api/<módulo>.ts`:
```ts
// lib/api/customers.ts
export const customersApi = {
  list: (params?: CustomerParams) => api.get('/customers/', { params }),
  get: (id: number) => api.get(`/customers/${id}/`),
  create: (data: CustomerCreate) => api.post('/customers/', data),
  update: (id: number, data: Partial<CustomerCreate>) => api.patch(`/customers/${id}/`, data),
  remove: (id: number) => api.delete(`/customers/${id}/`),
}
```

### Tipos TypeScript base
```ts
// Todos los módulos tienen esta estructura de respuesta paginada
interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}
```

### Auth flow
1. `POST /auth/token/` → guardar `access` y `refresh` en `localStorage`
2. Axios interceptor agrega `Authorization: Bearer <access>` a cada request
3. En error 401 → intentar refresh → si falla → redirect a login
4. `refresh` token se renueva con `POST /auth/token/refresh/`

---

## Specs pendientes de crear

Antes de implementar cada módulo, crear el archivo de spec correspondiente:

| Módulo | Spec a crear |
|--------|-------------|
| Auth + Layout | `docs/specs/auth-layout.md` |
| Customers | `docs/specs/customers.md` |
| Warehouses | `docs/specs/warehouses.md` |
| Suppliers | `docs/specs/suppliers.md` |
| Products | `docs/specs/products.md` |
| Transport | `docs/specs/transport.md` |
| Drivers | `docs/specs/drivers.md` |
| Routes | `docs/specs/routes.md` |
| Shipments | `docs/specs/shipments.md` |
