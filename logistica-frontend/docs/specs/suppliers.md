# Spec — Suppliers

**Módulo:** suppliers
**Endpoint base:** /api/v1/suppliers/
**Estado:** implementado — validado
**Fecha:** 2026-05-27

---

## 1. Tipos TypeScript

### Archivo: `types/supplier.ts`

#### Interface de lectura (GET response)

```typescript
export interface Supplier {
  id: number
  name: string
  contact_name: string
  email: string
  phone: string
  address: string
  city: string
  country: string
  tax_id: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}
```

> **Nota:** Todos los campos de texto llegan como `string` del backend. `tax_id` es nullable — puede ser `null` si no se proporcionó. No hay campos decimales en este módulo.

#### Interface de escritura (POST / PATCH body)

```typescript
export interface SupplierCreate {
  name: string
  contact_name: string
  email: string
  phone: string
  address: string
  city: string
  country: string
  tax_id?: string
}
```

> Los campos `id`, `is_active`, `created_at`, `updated_at` nunca se envían al backend.

#### Interface de params (query string para filtros)

```typescript
export interface SupplierParams {
  page?: number
  city?: string
  country?: string
  search?: string
  ordering?: 'name' | 'created_at' | '-name' | '-created_at'
}
```

---

## 2. API Client

### Archivo: `lib/api/suppliers.ts`

Objeto `supplierApi` con los siguientes métodos. Importa la instancia axios de `@/lib/axios` y los tipos de `@/types/supplier`.

```typescript
import axiosInstance from "@/lib/axios"
import type { Supplier, SupplierCreate, SupplierParams } from "@/types/supplier"
import type { PaginatedResponse } from "@/types/common"

export const supplierApi = {
  list,
  get,
  create,
  update,
  remove,
}
```

- **`list(params?: SupplierParams): Promise<PaginatedResponse<Supplier>>`**
  - `GET /api/v1/suppliers/`
  - Pasar `params` como `{ params }` en la config de axios (se serializa automáticamente como query string)
  - Retorna la respuesta paginada completa `{ count, next, previous, results }`

- **`get(id: number): Promise<Supplier>`**
  - `GET /api/v1/suppliers/{id}/`
  - Retorna un único objeto `Supplier`

- **`create(data: SupplierCreate): Promise<Supplier>`**
  - `POST /api/v1/suppliers/`
  - Body: objeto `SupplierCreate`
  - Response HTTP 201 → retorna el `Supplier` creado

- **`update(id: number, data: Partial<SupplierCreate>): Promise<Supplier>`**
  - `PATCH /api/v1/suppliers/{id}/`
  - Body: campos parciales de `SupplierCreate`
  - Response HTTP 200 → retorna el `Supplier` actualizado

- **`remove(id: number): Promise<void>`**
  - `DELETE /api/v1/suppliers/{id}/`
  - Soft delete — el backend pone `is_active=false`
  - Response HTTP 204 → sin cuerpo

---

## 3. TanStack Query Hooks

### Archivo: `lib/hooks/use-suppliers.ts`

Todos los hooks usan la sintaxis TanStack Query **v5**. Importa `supplierApi` de `@/lib/api/suppliers`.

#### `useSupplierList(params?: SupplierParams)`

```typescript
useQuery({
  queryKey: ['suppliers', params],
  queryFn: () => supplierApi.list(params),
  staleTime: 30_000,
})
```

Retorna `{ data: PaginatedResponse<Supplier> | undefined, isPending, isError, error }`.

#### `useSupplier(id: number)`

```typescript
useQuery({
  queryKey: ['suppliers', id],
  queryFn: () => supplierApi.get(id),
  enabled: !!id,
  staleTime: 30_000,
})
```

#### `useCreateSupplier()`

```typescript
useMutation({
  mutationFn: (data: SupplierCreate) => supplierApi.create(data),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['suppliers'] })
  },
})
```

Invalida: `['suppliers']` (la lista completa).

#### `useUpdateSupplier()`

```typescript
useMutation({
  mutationFn: ({ id, data }: { id: number; data: Partial<SupplierCreate> }) =>
    supplierApi.update(id, data),
  onSuccess: (_data, { id }) => {
    queryClient.invalidateQueries({ queryKey: ['suppliers'] })
    queryClient.invalidateQueries({ queryKey: ['suppliers', id] })
  },
})
```

Invalida: `['suppliers']` (lista) y `['suppliers', id]` (el ítem editado).

#### `useDeleteSupplier()`

```typescript
useMutation({
  mutationFn: (id: number) => supplierApi.remove(id),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['suppliers'] })
  },
})
```

Invalida: `['suppliers']` (la lista, para que el ítem eliminado desaparezca).

> Todos los hooks que usan `queryClient` deben llamar a `useQueryClient()` del mismo paquete.

---

## 4. Columnas TanStack Table

### Archivo: `lib/columns/supplier-columns.tsx`

```typescript
import type { ColumnDef } from "@tanstack/react-table"
import type { Supplier } from "@/types/supplier"
```

Lista de `ColumnDef<Supplier>[]`:

| `accessorKey` / `id` | `header`          | `cell` (render especial)                         |
| -------------------- | ----------------- | ------------------------------------------------ |
| `name`               | "Proveedor"       | Texto directo                                    |
| `contact_name`       | "Contacto"        | Texto directo                                    |
| `email`              | "Email"           | Texto directo                                    |
| `city`               | "Ciudad"          | Texto directo                                    |
| `actions`            | "" (vacío)        | Botones Editar y Eliminar (ver detalle abajo)    |

**Columna `actions` (id: `'actions'`, no tiene `accessorKey`):**

```typescript
{
  id: 'actions',
  header: '',
  cell: ({ row }) => {
    const supplier = row.original
    return (
      <div className="flex gap-2 justify-end">
        <Button variant="ghost" size="sm" onClick={() => onEdit(supplier)}>
          <Pencil className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" onClick={() => onDelete(supplier)}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    )
  },
}
```

> Los callbacks `onEdit` y `onDelete` se inyectan como parámetros en una función factory:
> `export function getSupplierColumns(onEdit: (s: Supplier) => void, onDelete: (s: Supplier) => void): ColumnDef<Supplier>[]`

Iconos a usar: `Pencil` y `Trash2` de `lucide-react`.

---

## 5. Componentes

### 5.1 `SupplierFilters`

**Archivo:** `components/modules/suppliers/SupplierFilters.tsx`
**Tipo:** `"use client"`

**Props:**

```typescript
interface SupplierFiltersProps {
  params: SupplierParams
  onParamsChange: (params: SupplierParams) => void
}
```

**Campos del UI:**

- **Search input:** placeholder "Buscar por nombre, contacto, email o NIT...". Al cambiar, actualiza `params.search` y resetea `params.page` a `1`. Aplicar debounce de 300ms para no disparar una request por cada tecla.
- **Input Ciudad (`city`):** Input de texto libre. Placeholder: "Filtrar por ciudad". Al cambiar, actualiza `params.city` y resetea `params.page` a `1`.
- **Input País (`country`):** Input de texto libre. Placeholder: "Filtrar por país". Al cambiar, actualiza `params.country`.

**Notas de implementación:**
- Usar un `useEffect` interno para el debounce del search (o la librería `use-debounce` si está disponible).
- Botón "Limpiar filtros" que resetea `params` a `{ page: 1 }`.

---

### 5.2 `SupplierForm`

**Archivo:** `components/modules/suppliers/SupplierForm.tsx`
**Tipo:** `"use client"`

**Props:**

```typescript
interface SupplierFormProps {
  supplier?: Supplier      // undefined = modo crear, objeto = modo editar
  onSuccess: () => void
  onCancel: () => void
}
```

**Campos del formulario:**

| Campo          | Tipo de input   | Label                        | Requerido | Default    |
| -------------- | --------------- | ---------------------------- | --------- | ---------- |
| `name`         | `Input` texto   | "Nombre del proveedor"       | Sí        | —          |
| `contact_name` | `Input` texto   | "Nombre de contacto"         | Sí        | —          |
| `email`        | `Input` email   | "Email"                      | Sí        | —          |
| `phone`        | `Input` texto   | "Teléfono"                   | Sí        | —          |
| `address`      | `Input` texto   | "Dirección"                  | Sí        | —          |
| `city`         | `Input` texto   | "Ciudad"                     | Sí        | —          |
| `country`      | `Input` texto   | "País"                       | Sí        | "Colombia" |
| `tax_id`       | `Input` texto   | "NIT / Tax ID (opcional)"    | No        | —          |

**Modo editar:** cuando `supplier` está definido, pre-cargar `defaultValues` del `useForm` con los valores actuales. `tax_id` puede ser `null` — usar `supplier.tax_id ?? ''` como defaultValue.

**Lógica de submit:**

- Modo crear (`!supplier`): llamar a `useCreateSupplier().mutate(data)`.
- Modo editar (`!!supplier`): llamar a `useUpdateSupplier().mutate({ id: supplier.id, data })`.
- En ambos casos: en `onSuccess` de la mutation → llamar a `props.onSuccess()` para cerrar el modal y actualizar la lista.

**Manejo de errores del backend (HTTP 400):**

Si el backend retorna errores de campo (ej: `{ email: ["Ya existe un proveedor con este email."] }`), usar `form.setError(fieldName, { message: errorMessage })` para mostrarlos inline en cada campo.

**Estado del botón submit:**

- Texto: "Crear proveedor" (modo crear) o "Guardar cambios" (modo editar).
- Deshabilitar y mostrar spinner mientras la mutation está en `isPending`.

**Importaciones esperadas:**

```typescript
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useCreateSupplier, useUpdateSupplier } from "@/lib/hooks/use-suppliers"
import { supplierSchema, type SupplierFormValues } from "@/lib/validators/supplier"
```

> El schema Zod se define en `lib/validators/supplier.ts` (ver Sección 7).

---

### 5.3 `DeleteSupplierDialog`

**Archivo:** `components/modules/suppliers/DeleteSupplierDialog.tsx`
**Tipo:** `"use client"`

**Props:**

```typescript
interface DeleteSupplierDialogProps {
  supplier: Supplier
  open: boolean
  onOpenChange: (open: boolean) => void
}
```

**Comportamiento:**

- Usa `AlertDialog` de shadcn/ui.
- Título: "¿Eliminar proveedor?"
- Descripción: `"Esta acción desactivará el proveedor \"${supplier.name}\". Podrás restaurarlo desde el panel de administración de Django si es necesario."`
- Botón cancelar: cierra el dialog con `onOpenChange(false)`.
- Botón confirmar (variante destructiva): llama a `useDeleteSupplier().mutate(supplier.id)`.
- En `onSuccess` de la mutation: llamar a `onOpenChange(false)` para cerrar el dialog.
- Mientras la mutation está en `isPending`: deshabilitar ambos botones.

---

### 5.4 `SupplierTable`

**Archivo:** `components/modules/suppliers/SupplierTable.tsx`
**Tipo:** `"use client"`

**Props:**

```typescript
import type { PaginationState, OnChangeFn } from "@tanstack/react-table"
import type { PaginatedResponse } from "@/types/common"
import type { Supplier } from "@/types/supplier"

interface SupplierTableProps {
  data: PaginatedResponse<Supplier> | undefined
  isLoading: boolean
  pagination: PaginationState
  onPaginationChange: OnChangeFn<PaginationState>
  onEdit: (supplier: Supplier) => void
  onDelete: (supplier: Supplier) => void
}
```

**Implementación con TanStack Table v8:**

```typescript
const table = useReactTable({
  data: data?.results ?? [],
  columns: getSupplierColumns(onEdit, onDelete),
  pageCount: data ? Math.ceil(data.count / 20) : -1,
  state: { pagination },
  onPaginationChange,
  getCoreRowModel: getCoreRowModel(),
  manualPagination: true,
})
```

**Estado de carga:**

- Cuando `isLoading === true`: mostrar un skeleton de tabla (filas con fondo gris animado) o un spinner centrado.
- Cuando `data` es undefined y no está cargando: mostrar mensaje "No hay proveedores registrados."

**Paginación:**

- Mostrar controles de paginación debajo de la tabla: botones "Anterior" / "Siguiente".
- Mostrar texto informativo: `"Mostrando {start}-{end} de {total} proveedores"`.
- Botón "Anterior" deshabilitado si `!table.getCanPreviousPage()`.
- Botón "Siguiente" deshabilitado si `!table.getCanNextPage()`.

**Render de la tabla:**

Usar `flexRender` de `@tanstack/react-table` con los componentes `Table`, `TableHeader`, `TableBody`, `TableRow`, `TableHead`, `TableCell` de `@/components/ui/table`.

---

## 6. Página

**Archivo:** `app/(dashboard)/suppliers/page.tsx`
**Tipo:** Client Component (`"use client"`)

**Estado interno:**

```typescript
const [params, setParams] = useState<SupplierParams>({ page: 1 })
const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 20 })
const [formOpen, setFormOpen] = useState(false)
const [editing, setEditing] = useState<Supplier | undefined>()
const [deleting, setDeleting] = useState<Supplier | undefined>()
```

**Sincronización params ↔ pagination:**

Cuando el usuario navega de página via `onPaginationChange`, actualizar `params.page = pagination.pageIndex + 1`. Usar un `useEffect` que escuche cambios en `pagination.pageIndex`.

**Data:**

```typescript
const { data, isPending } = useSupplierList(params)
```

**Handlers:**

```typescript
const handleEdit = (supplier: Supplier) => {
  setEditing(supplier)
  setFormOpen(true)
}

const handleDelete = (supplier: Supplier) => {
  setDeleting(supplier)
}

const handleFormSuccess = () => {
  setFormOpen(false)
  setEditing(undefined)
}

const handleNewSupplier = () => {
  setEditing(undefined)
  setFormOpen(true)
}
```

**Estructura JSX:**

```tsx
<div className="space-y-6">
  {/* Header de página */}
  <div className="flex items-center justify-between">
    <div>
      <h1 className="text-2xl font-bold">Proveedores</h1>
      <p className="text-muted-foreground">Gestiona los proveedores de productos</p>
    </div>
    <Button onClick={handleNewSupplier}>
      <Plus className="h-4 w-4 mr-2" />
      Nuevo proveedor
    </Button>
  </div>

  {/* Filtros */}
  <SupplierFilters params={params} onParamsChange={setParams} />

  {/* Tabla */}
  <SupplierTable
    data={data}
    isLoading={isPending}
    pagination={pagination}
    onPaginationChange={setPagination}
    onEdit={handleEdit}
    onDelete={handleDelete}
  />

  {/* Modal crear/editar */}
  <Dialog open={formOpen} onOpenChange={(open) => { if (!open) { setFormOpen(false); setEditing(undefined) } }}>
    <DialogContent className="max-w-lg">
      <DialogHeader>
        <DialogTitle>{editing ? "Editar proveedor" : "Nuevo proveedor"}</DialogTitle>
      </DialogHeader>
      <SupplierForm
        supplier={editing}
        onSuccess={handleFormSuccess}
        onCancel={() => { setFormOpen(false); setEditing(undefined) }}
      />
    </DialogContent>
  </Dialog>

  {/* Dialog de confirmación eliminación */}
  {deleting && (
    <DeleteSupplierDialog
      supplier={deleting}
      open={!!deleting}
      onOpenChange={(open) => { if (!open) setDeleting(undefined) }}
    />
  )}
</div>
```

**Importaciones esperadas en la página:**

```typescript
import { useState } from "react"
import type { PaginationState } from "@tanstack/react-table"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useSupplierList } from "@/lib/hooks/use-suppliers"
import type { Supplier, SupplierParams } from "@/types/supplier"
import { SupplierFilters } from "@/components/modules/suppliers/SupplierFilters"
import { SupplierTable } from "@/components/modules/suppliers/SupplierTable"
import { SupplierForm } from "@/components/modules/suppliers/SupplierForm"
import { DeleteSupplierDialog } from "@/components/modules/suppliers/DeleteSupplierDialog"
```

---

## 7. Schema de validación Zod

### Archivo: `lib/validators/supplier.ts`

```typescript
import { z } from "zod"

export const supplierSchema = z.object({
  name: z.string().min(1, "El nombre es requerido").max(200, "Máximo 200 caracteres"),
  contact_name: z.string().min(1, "El nombre de contacto es requerido"),
  email: z.string().min(1, "El email es requerido").email("Email inválido"),
  phone: z.string().min(1, "El teléfono es requerido"),
  address: z.string().min(1, "La dirección es requerida"),
  city: z.string().min(1, "La ciudad es requerida"),
  country: z.string().min(1, "El país es requerido").default("Colombia"),
  tax_id: z.string().optional(),
})

export type SupplierFormValues = z.infer<typeof supplierSchema>
```

**Validaciones campo por campo:**

| Campo          | Tipo Zod                                      | Mensaje de error                          |
| -------------- | --------------------------------------------- | ----------------------------------------- |
| `name`         | `z.string().min(1).max(200)`                 | "El nombre es requerido"                  |
| `contact_name` | `z.string().min(1)`                          | "El nombre de contacto es requerido"      |
| `email`        | `z.string().min(1).email()`                  | "El email es requerido" / "Email inválido"|
| `phone`        | `z.string().min(1)`                          | "El teléfono es requerido"                |
| `address`      | `z.string().min(1)`                          | "La dirección es requerida"               |
| `city`         | `z.string().min(1)`                          | "La ciudad es requerida"                  |
| `country`      | `z.string().min(1).default("Colombia")`      | "El país es requerido"                    |
| `tax_id`       | `z.string().optional()`                      | — (campo opcional, no requiere mensaje)   |

> No se usa `z.coerce` en ningún campo — todos los campos del módulo Suppliers son strings. El campo `tax_id` es opcional: si el usuario no lo ingresa, se envía `undefined` (el backend lo acepta como null).

**Transformación antes de enviar al API:**

En el `onSubmit` del formulario, transformar `SupplierFormValues` a `SupplierCreate`:

```typescript
const payload: SupplierCreate = {
  name: values.name,
  contact_name: values.contact_name,
  email: values.email,
  phone: values.phone,
  address: values.address,
  city: values.city,
  country: values.country,
  ...(values.tax_id ? { tax_id: values.tax_id } : {}),
}
```

> Si `tax_id` es string vacío o undefined, no se incluye en el payload para no enviar un string vacío al backend.

---

## 8. Manejo de errores

- **Error 400 (validación backend):** Iterar sobre las claves del objeto `error.response.data` y llamar a `form.setError(fieldName, { message: Array.isArray(msg) ? msg[0] : msg })` para mostrar errores de campo inline. Mostrar `non_field_errors` como un `Alert` visible sobre el formulario.
- **Error 401:** Manejado automáticamente por el interceptor de axios en `lib/axios.ts` (refresh + redirect a `/login`).
- **Error 404:** Mostrar mensaje "Proveedor no encontrado." (aplica principalmente si se carga la página de detalle individual en el futuro).
- **Error de red:** Mostrar un mensaje genérico dentro del formulario o como un `Alert` de shadcn: "Error de conexión. Verifica que el servidor esté disponible."

---

## 9. Criterios de aceptación

- [x] La tabla muestra los proveedores del backend paginados (20 por página)
- [x] El total de registros se muestra en los controles de paginación
- [x] Los botones "Anterior" y "Siguiente" navegan correctamente entre páginas
- [x] La búsqueda por texto (`search`) filtra por nombre, contacto, email y NIT en tiempo real (con debounce)
- [x] El filtro por ciudad (`city`) funciona correctamente
- [x] El filtro por país (`country`) funciona correctamente
- [x] El botón "Limpiar filtros" resetea todos los filtros y regresa a la página 1
- [x] El botón "Nuevo proveedor" abre el modal en modo crear
- [x] Se puede crear un nuevo proveedor exitosamente (POST → 201)
- [x] Se puede editar un proveedor existente haciendo clic en el ícono de edición (PATCH → 200)
- [x] Al hacer clic en editar, el formulario se pre-carga con los valores actuales del proveedor
- [x] El campo `country` tiene "Colombia" como valor por defecto en el formulario de creación
- [x] El campo `tax_id` es opcional y puede enviarse vacío sin error
- [x] Se puede eliminar un proveedor con confirmación (DELETE → 204)
- [x] El dialog de eliminación muestra el nombre del proveedor en la descripción
- [x] Tras crear un proveedor, la lista se actualiza automáticamente (TanStack Query invalida)
- [x] Tras editar un proveedor, la lista se actualiza automáticamente
- [x] Tras eliminar un proveedor, desaparece de la lista automáticamente
- [x] Los errores de validación del backend (400) se muestran inline en cada campo del formulario
- [x] Los errores de validación client-side (Zod) se muestran antes del submit
- [x] El botón de submit se deshabilita mientras la mutation está en progreso
- [x] El estado de carga (skeleton o spinner) se muestra mientras la lista está cargando
- [x] Sin token → redirige a `/login` (manejado por el AuthGuard del layout)
- [x] Todo el código TypeScript pasa `npx tsc --noEmit` sin errores
