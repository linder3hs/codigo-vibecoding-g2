# Spec — Customers

**Módulo:** customers
**Endpoint base:** /api/v1/customers/
**Estado:** implementado — validado
**Fecha:** 2026-05-27

---

## 1. Tipos TypeScript

### Archivo: `types/customer.ts`

#### Interface de lectura (GET response)

```typescript
export type CustomerType = 'COMPANY' | 'INDIVIDUAL'

export interface Customer {
  id: number
  name: string
  customer_type: CustomerType
  tax_id: string | null
  email: string
  phone: string
  address: string
  city: string
  country: string
  is_active: boolean
  created_at: string
  updated_at: string
}
```

> `customer_type` es un union type estricto, nunca `string` genérico. `tax_id` es nullable — puede ser `null` si no se proporcionó.

#### Interface de escritura (POST / PATCH body)

```typescript
export interface CustomerCreate {
  name: string
  customer_type: CustomerType
  email: string
  phone: string
  address: string
  city: string
  country: string
  tax_id?: string | null
}
```

> Los campos `id`, `is_active`, `created_at`, `updated_at` nunca se envían al backend.

#### Interface de params (query string para filtros)

```typescript
export interface CustomerParams {
  page?: number
  customer_type?: CustomerType
  city?: string
  country?: string
  search?: string
  ordering?: 'name' | 'created_at' | '-name' | '-created_at'
}
```

---

## 2. API Client

### Archivo: `lib/api/customers.ts`

Objeto `customerApi` con los siguientes métodos. Importa la instancia axios de `@/lib/axios` y los tipos de `@/types/customer`.

```typescript
import axiosInstance from "@/lib/axios"
import type { Customer, CustomerCreate, CustomerParams } from "@/types/customer"
import type { PaginatedResponse } from "@/types/common"

export const customerApi = {
  list,
  get,
  create,
  update,
  remove,
}
```

- **`list(params?: CustomerParams): Promise<PaginatedResponse<Customer>>`**
  - `GET /api/v1/customers/`
  - Pasar `params` como `{ params }` en la config de axios
  - Retorna la respuesta paginada completa `{ count, next, previous, results }`

- **`get(id: number): Promise<Customer>`**
  - `GET /api/v1/customers/{id}/`
  - Retorna un único objeto `Customer`

- **`create(data: CustomerCreate): Promise<Customer>`**
  - `POST /api/v1/customers/`
  - Body: objeto `CustomerCreate`
  - Response HTTP 201 → retorna el `Customer` creado

- **`update(id: number, data: Partial<CustomerCreate>): Promise<Customer>`**
  - `PATCH /api/v1/customers/{id}/`
  - Body: campos parciales de `CustomerCreate`
  - Response HTTP 200 → retorna el `Customer` actualizado

- **`remove(id: number): Promise<void>`**
  - `DELETE /api/v1/customers/{id}/`
  - Soft delete — el backend pone `is_active=false`
  - Response HTTP 204 → sin cuerpo

---

## 3. TanStack Query Hooks

### Archivo: `lib/hooks/use-customers.ts`

Todos los hooks usan la sintaxis TanStack Query **v5**. Importa `customerApi` de `@/lib/api/customers`.

#### `useCustomerList(params?: CustomerParams)`

```typescript
useQuery({
  queryKey: ['customers', params],
  queryFn: () => customerApi.list(params),
  staleTime: 30_000,
})
```

#### `useCustomer(id: number)`

```typescript
useQuery({
  queryKey: ['customers', id],
  queryFn: () => customerApi.get(id),
  enabled: !!id,
  staleTime: 30_000,
})
```

#### `useCreateCustomer()`

```typescript
useMutation({
  mutationFn: (data: CustomerCreate) => customerApi.create(data),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['customers'] })
  },
})
```

#### `useUpdateCustomer()`

```typescript
useMutation({
  mutationFn: ({ id, data }: { id: number; data: Partial<CustomerCreate> }) =>
    customerApi.update(id, data),
  onSuccess: (_data, { id }) => {
    queryClient.invalidateQueries({ queryKey: ['customers'] })
    queryClient.invalidateQueries({ queryKey: ['customers', id] })
  },
})
```

#### `useDeleteCustomer()`

```typescript
useMutation({
  mutationFn: (id: number) => customerApi.remove(id),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['customers'] })
  },
})
```

---

## 4. Columnas TanStack Table

### Archivo: `lib/columns/customer-columns.tsx`

Lista de `ColumnDef<Customer>[]`:

| `accessorKey` / `id` | `header`        | `cell` (render especial)                         |
| -------------------- | --------------- | ------------------------------------------------ |
| `name`               | "Cliente"       | Texto directo                                    |
| `customer_type`      | "Tipo"          | Badge: COMPANY → `default`, INDIVIDUAL → `secondary` |
| `email`              | "Email"         | Texto directo                                    |
| `city`               | "Ciudad"        | Texto directo                                    |
| `actions`            | "" (vacío)      | Botones Editar y Eliminar                        |

**Badge de `customer_type`:**
- `COMPANY` → `<Badge variant="default">Empresa</Badge>` (fondo oscuro/primary)
- `INDIVIDUAL` → `<Badge variant="secondary">Persona</Badge>` (fondo gris/secondary)

**Columna `actions`:**

```typescript
{
  id: 'actions',
  header: '',
  cell: ({ row }) => {
    const customer = row.original
    return (
      <div className="flex gap-2 justify-end">
        <Button variant="ghost" size="sm" onClick={() => onEdit(customer)}>
          <Pencil className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" onClick={() => onDelete(customer)}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    )
  },
}
```

Factory: `export function getCustomerColumns(onEdit: (c: Customer) => void, onDelete: (c: Customer) => void): ColumnDef<Customer>[]`

---

## 5. Componentes

### 5.1 `CustomerFilters`

**Archivo:** `components/modules/customers/CustomerFilters.tsx`
**Tipo:** `"use client"`

**Props:**

```typescript
interface CustomerFiltersProps {
  params: CustomerParams
  onParamsChange: (params: CustomerParams) => void
}
```

**Campos del UI:**

- **Search input:** placeholder "Buscar por nombre, email o NIT...". Debounce 300ms. Actualiza `params.search` y resetea `params.page` a `1`.
- **Select de tipo (`customer_type`):** Opciones: `""` (todos), `"COMPANY"` (Empresa), `"INDIVIDUAL"` (Persona). Actualiza `params.customer_type` y resetea `params.page` a `1`.
- **Input Ciudad (`city`):** placeholder "Filtrar por ciudad". Actualiza `params.city` y resetea `params.page` a `1`.
- **Input País (`country`):** placeholder "Filtrar por país". Actualiza `params.country` y resetea `params.page` a `1`.
- **Botón "Limpiar filtros":** resetea `params` a `{ page: 1 }`.

---

### 5.2 `CustomerForm`

**Archivo:** `components/modules/customers/CustomerForm.tsx`
**Tipo:** `"use client"`

**Props:**

```typescript
interface CustomerFormProps {
  customer?: Customer
  onSuccess: () => void
  onCancel: () => void
}
```

**Layout:** Modal con max-w-2xl. Formulario en 2 columnas con `grid grid-cols-2 gap-4`.

**Campos del formulario:**

| Campo           | Tipo de input        | Label                     | Requerido | Default    |
| --------------- | -------------------- | ------------------------- | --------- | ---------- |
| `name`          | `Input` texto        | "Nombre"                  | Sí        | —          |
| `customer_type` | `Select`             | "Tipo de cliente"         | Sí        | "COMPANY"  |
| `email`         | `Input` email        | "Email"                   | Sí        | —          |
| `phone`         | `Input` texto        | "Teléfono"                | Sí        | —          |
| `address`       | `Input` texto        | "Dirección"               | Sí        | —          |
| `city`          | `Input` texto        | "Ciudad"                  | Sí        | —          |
| `country`       | `Input` texto        | "País"                    | Sí        | "Colombia" |
| `tax_id`        | `Input` texto        | "NIT / Tax ID (opcional)" | No        | —          |

> `customer_type` debe ser un `<Select>` (no input de texto) con opciones COMPANY y INDIVIDUAL.

**Lógica de payload:**

```typescript
const payload: CustomerCreate = {
  ...values,
  tax_id: values.tax_id || null,
}
```

**Modo editar:** pre-cargar defaultValues con los valores del customer. `tax_id` nulo → usar `customer.tax_id ?? ""` como defaultValue.

---

### 5.3 `DeleteCustomerDialog`

**Archivo:** `components/modules/customers/DeleteCustomerDialog.tsx`
**Tipo:** `"use client"`

**Props:**

```typescript
interface DeleteCustomerDialogProps {
  customer: Customer
  open: boolean
  onOpenChange: (open: boolean) => void
}
```

- Usa `AlertDialog` de shadcn/ui
- Título: "¿Eliminar cliente?"
- Descripción: `"Esta acción desactivará el cliente \"${customer.name}\". Podrás restaurarlo desde el panel de administración de Django si es necesario."`
- Botón confirmar: variante destructiva. Llama a `useDeleteCustomer().mutate(customer.id)`.
- En `onSuccess`: `onOpenChange(false)`.
- Mientras `isPending`: ambos botones deshabilitados.

---

### 5.4 `CustomerTable`

**Archivo:** `components/modules/customers/CustomerTable.tsx`
**Tipo:** `"use client"`

**Props:**

```typescript
interface CustomerTableProps {
  data: PaginatedResponse<Customer> | undefined
  isLoading: boolean
  pagination: PaginationState
  onPaginationChange: OnChangeFn<PaginationState>
  onEdit: (customer: Customer) => void
  onDelete: (customer: Customer) => void
}
```

- Usa `useReactTable` con `manualPagination: true`
- Estado de carga: skeleton de 5 filas × 5 columnas
- Sin datos: "No hay clientes registrados."
- Paginación: botones "Anterior" / "Siguiente" + texto `"Mostrando {start}-{end} de {total} clientes"`

---

## 6. Página

**Archivo:** `app/(dashboard)/customers/page.tsx`
**Tipo:** Client Component (`"use client"`)

- Misma estructura que `suppliers/page.tsx`
- Header: "Clientes" / "Gestiona los clientes registrados"
- Botón: "Nuevo cliente"
- Modal max-w-2xl
- Estado: `params`, `pagination`, `formOpen`, `editing`, `deleting`

---

## 7. Schema de validación Zod

### Archivo: `lib/validators/customer.ts`

```typescript
import { z } from "zod"

export const customerSchema = z.object({
  name: z.string().min(1, "El nombre es requerido").max(200, "Máximo 200 caracteres"),
  customer_type: z.enum(['COMPANY', 'INDIVIDUAL'], {
    required_error: "El tipo de cliente es requerido",
  }),
  email: z.string().min(1, "El email es requerido").email("Email inválido"),
  phone: z.string().min(1, "El teléfono es requerido"),
  address: z.string().min(1, "La dirección es requerida"),
  city: z.string().min(1, "La ciudad es requerida"),
  country: z.string().min(1, "El país es requerido"),
  tax_id: z.string().optional(),
})

export type CustomerFormValues = z.infer<typeof customerSchema>
```

---

## 8. Manejo de errores

Igual que el módulo Suppliers:
- **Error 400:** `form.setError(fieldName, { message })` para errores de campo inline.
- **Error 401:** Manejado por interceptor axios.
- **Error de red:** Mensaje genérico.

---

## 9. Criterios de aceptación

- [x] `customer_type` es union type `'COMPANY' | 'INDIVIDUAL'` en TypeScript (no string genérico)
- [x] Badge en columna con variante diferente para COMPANY (default) vs INDIVIDUAL (secondary)
- [x] Select de customer_type en CustomerFilters con valores exactos del backend
- [x] `CustomerForm` tiene el Select de customer_type (no input de texto)
- [x] `tax_id` vacío → null en payload
- [x] Formulario en 2 columnas max-w-2xl
- [x] La tabla muestra los clientes del backend paginados (20 por página)
- [x] El total de registros se muestra en los controles de paginación
- [x] Los botones "Anterior" y "Siguiente" navegan correctamente entre páginas
- [x] La búsqueda por texto (`search`) filtra con debounce
- [x] El filtro por tipo de cliente funciona correctamente
- [x] El filtro por ciudad y país funciona correctamente
- [x] El botón "Limpiar filtros" resetea todos los filtros y regresa a la página 1
- [x] Se puede crear un nuevo cliente exitosamente (POST → 201)
- [x] Se puede editar un cliente existente (PATCH → 200)
- [x] Se puede eliminar un cliente con confirmación (DELETE → 204)
- [x] Tras crear/editar/eliminar, la lista se actualiza automáticamente
- [x] Los errores de validación del backend (400) se muestran inline
- [x] El botón de submit se deshabilita mientras la mutation está en progreso
- [x] Todo el código TypeScript pasa `npx tsc --noEmit` sin errores
