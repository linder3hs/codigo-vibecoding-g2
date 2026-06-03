# Spec — Warehouses

**Módulo:** warehouses
**Endpoint base:** /api/v1/warehouses/
**Estado:** implementado — validado
**Fecha:** 2026-05-27

---

## 1. Tipos TypeScript

### Archivo: `types/warehouse.ts`

#### Interface de lectura (GET response)

```typescript
export interface Warehouse {
  id: number
  name: string
  address: string
  city: string
  country: string
  latitude: number | null
  longitude: number | null
  capacity_m3: string       // llega como string desde el API: "5000.00"
  is_active: boolean
  created_at: string
  updated_at: string
}
```

> **Nota:** `capacity_m3` llega como string decimal del backend (ej: `"5000.00"`). `latitude` y `longitude` llegan como `number | null` — el response de ejemplo muestra valores numéricos, no string, para las coordenadas.

#### Interface de escritura (POST / PATCH body)

```typescript
export interface WarehouseCreate {
  name: string
  address: string
  city: string
  country: string
  capacity_m3: string | number    // se envía como número decimal
  latitude?: number | null
  longitude?: number | null
}
```

> Los campos `id`, `is_active`, `created_at`, `updated_at` nunca se envían al backend.

#### Interface de params (query string para filtros)

```typescript
export interface WarehouseParams {
  page?: number
  city?: string
  country?: string
  capacity_m3_gte?: number
  capacity_m3_lte?: number
  search?: string
  ordering?: 'name' | 'capacity_m3' | 'created_at' | '-name' | '-capacity_m3' | '-created_at'
}
```

---

## 2. API Client

### Archivo: `lib/api/warehouses.ts`

Objeto `warehouseApi` con los siguientes métodos. Importa la instancia axios de `@/lib/axios` y los tipos de `@/types/warehouse`.

```typescript
import axiosInstance from "@/lib/axios"
import type { Warehouse, WarehouseCreate, WarehouseParams } from "@/types/warehouse"
import type { PaginatedResponse } from "@/types/common"

export const warehouseApi = {
  list,
  get,
  create,
  update,
  remove,
}
```

- **`list(params?: WarehouseParams): Promise<PaginatedResponse<Warehouse>>`**
  - `GET /api/v1/warehouses/`
  - Pasar `params` como `{ params }` en la config de axios (se serializa automáticamente como query string)
  - Retorna la respuesta paginada completa `{ count, next, previous, results }`

- **`get(id: number): Promise<Warehouse>`**
  - `GET /api/v1/warehouses/{id}/`
  - Retorna un único objeto `Warehouse`

- **`create(data: WarehouseCreate): Promise<Warehouse>`**
  - `POST /api/v1/warehouses/`
  - Body: objeto `WarehouseCreate`
  - Response HTTP 201 → retorna el `Warehouse` creado

- **`update(id: number, data: Partial<WarehouseCreate>): Promise<Warehouse>`**
  - `PATCH /api/v1/warehouses/{id}/`
  - Body: campos parciales de `WarehouseCreate`
  - Response HTTP 200 → retorna el `Warehouse` actualizado

- **`remove(id: number): Promise<void>`**
  - `DELETE /api/v1/warehouses/{id}/`
  - Soft delete — el backend pone `is_active=false`
  - Response HTTP 204 → sin cuerpo

---

## 3. TanStack Query Hooks

### Archivo: `lib/hooks/use-warehouses.ts`

Todos los hooks usan la sintaxis TanStack Query **v5**. Importa `warehouseApi` de `@/lib/api/warehouses`.

#### `useWarehouseList(params?: WarehouseParams)`

```typescript
useQuery({
  queryKey: ['warehouses', params],
  queryFn: () => warehouseApi.list(params),
  staleTime: 30_000,
})
```

Retorna `{ data: PaginatedResponse<Warehouse> | undefined, isPending, isError, error }`.

#### `useWarehouse(id: number)`

```typescript
useQuery({
  queryKey: ['warehouses', id],
  queryFn: () => warehouseApi.get(id),
  enabled: !!id,
  staleTime: 30_000,
})
```

#### `useCreateWarehouse()`

```typescript
useMutation({
  mutationFn: (data: WarehouseCreate) => warehouseApi.create(data),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['warehouses'] })
  },
})
```

Invalida: `['warehouses']` (la lista completa).

#### `useUpdateWarehouse()`

```typescript
useMutation({
  mutationFn: ({ id, data }: { id: number; data: Partial<WarehouseCreate> }) =>
    warehouseApi.update(id, data),
  onSuccess: (_data, { id }) => {
    queryClient.invalidateQueries({ queryKey: ['warehouses'] })
    queryClient.invalidateQueries({ queryKey: ['warehouses', id] })
  },
})
```

Invalida: `['warehouses']` (lista) y `['warehouses', id]` (el ítem editado).

#### `useDeleteWarehouse()`

```typescript
useMutation({
  mutationFn: (id: number) => warehouseApi.remove(id),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['warehouses'] })
  },
})
```

Invalida: `['warehouses']` (la lista, para que el ítem eliminado desaparezca).

> Todos los hooks que usan `queryClient` deben llamar a `useQueryClient()` del mismo paquete.

---

## 4. Columnas TanStack Table

### Archivo: `lib/columns/warehouse-columns.tsx`

```typescript
import type { ColumnDef } from "@tanstack/react-table"
import type { Warehouse } from "@/types/warehouse"
```

Lista de `ColumnDef<Warehouse>[]`:

| `accessorKey` / `id` | `header`      | `cell` (render especial)                                            |
| -------------------- | ------------- | ------------------------------------------------------------------- |
| `name`               | "Nombre"      | Texto directo                                                       |
| `city`               | "Ciudad"      | Texto directo                                                       |
| `country`            | "País"        | Texto directo                                                       |
| `capacity_m3`        | "Capacidad m³"| `parseFloat(row.getValue("capacity_m3")).toLocaleString("es-CO")` + " m³" |
| `actions`            | "" (vacío)    | Botones Editar y Eliminar (ver detalle abajo)                        |

**Columna `actions` (id: `'actions'`, no tiene `accessorKey`):**

```typescript
{
  id: 'actions',
  header: '',
  cell: ({ row }) => {
    const warehouse = row.original
    return (
      <div className="flex gap-2 justify-end">
        <Button variant="ghost" size="sm" onClick={() => onEdit(warehouse)}>
          <Pencil className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" onClick={() => onDelete(warehouse)}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    )
  },
}
```

> Los callbacks `onEdit` y `onDelete` se inyectan como parámetros en una función factory:
> `export function getWarehouseColumns(onEdit: (w: Warehouse) => void, onDelete: (w: Warehouse) => void): ColumnDef<Warehouse>[]`

Iconos a usar: `Pencil` y `Trash2` de `lucide-react`.

---

## 5. Componentes

### 5.1 `WarehouseFilters`

**Archivo:** `components/modules/warehouses/WarehouseFilters.tsx`
**Tipo:** `"use client"`

**Props:**

```typescript
interface WarehouseFiltersProps {
  params: WarehouseParams
  onParamsChange: (params: WarehouseParams) => void
}
```

**Campos del UI:**

- **Search input:** placeholder "Buscar por nombre, ciudad o dirección...". Al cambiar, actualiza `params.search` y resetea `params.page` a `1`. Aplicar debounce de 300ms para no disparar una request por cada tecla.
- **Select Ciudad (`city`):** Input de texto libre (no select fijo — las ciudades son datos abiertos). Placeholder: "Filtrar por ciudad". Al cambiar, actualiza `params.city` y resetea `params.page` a `1`.
- **Select País (`country`):** Input de texto libre. Placeholder: "Filtrar por país". Al cambiar, actualiza `params.country`.
- **Input capacidad mínima (`capacity_m3_gte`):** tipo `number`, placeholder "Capacidad mín (m³)". Al cambiar, actualiza `params.capacity_m3_gte`.
- **Input capacidad máxima (`capacity_m3_lte`):** tipo `number`, placeholder "Capacidad máx (m³)". Al cambiar, actualiza `params.capacity_m3_lte`.

**Notas de implementación:**
- Usar un `useEffect` interno para el debounce del search (o la librería `use-debounce` si está disponible).
- Los inputs de capacidad se pueden agrupar visualmente con un label "Capacidad m³" y una línea "mín — máx".
- Botón "Limpiar filtros" que resetea `params` a `{ page: 1 }`.

---

### 5.2 `WarehouseForm`

**Archivo:** `components/modules/warehouses/WarehouseForm.tsx`
**Tipo:** `"use client"`

**Props:**

```typescript
interface WarehouseFormProps {
  warehouse?: Warehouse      // undefined = modo crear, objeto = modo editar
  onSuccess: () => void
  onCancel: () => void
}
```

**Campos del formulario:**

| Campo         | Tipo de input       | Label                    | Requerido | Default     |
| ------------- | ------------------- | ------------------------ | --------- | ----------- |
| `name`        | `Input` texto       | "Nombre del almacén"     | Sí        | —           |
| `address`     | `Input` texto       | "Dirección"              | Sí        | —           |
| `city`        | `Input` texto       | "Ciudad"                 | Sí        | —           |
| `country`     | `Input` texto       | "País"                   | Sí        | "Colombia"  |
| `capacity_m3` | `Input` número      | "Capacidad (m³)"         | Sí        | —           |
| `latitude`    | `Input` número      | "Latitud (opcional)"     | No        | —           |
| `longitude`   | `Input` número      | "Longitud (opcional)"    | No        | —           |

**Modo editar:** cuando `warehouse` está definido, pre-cargar `defaultValues` del `useForm` con los valores actuales. `capacity_m3` llega como string, usar `parseFloat(warehouse.capacity_m3)` como defaultValue para el campo numérico.

**Lógica de submit:**

- Modo crear (`!warehouse`): llamar a `useCreateWarehouse().mutate(data)`.
- Modo editar (`!!warehouse`): llamar a `useUpdateWarehouse().mutate({ id: warehouse.id, data })`.
- En ambos casos: en `onSuccess` de la mutation → llamar a `props.onSuccess()` para cerrar el modal y actualizar la lista.

**Manejo de errores del backend (HTTP 400):**

Si el backend retorna errores de campo (ej: `{ name: ["Ya existe un almacén con este nombre."] }`), usar `form.setError(fieldName, { message: errorMessage })` para mostrarlos inline en cada campo.

**Estado del botón submit:**

- Texto: "Crear almacén" (modo crear) o "Guardar cambios" (modo editar).
- Deshabilitar y mostrar spinner mientras la mutation está en `isPending`.

**Importaciones esperadas:**

```typescript
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useCreateWarehouse, useUpdateWarehouse } from "@/lib/hooks/use-warehouses"
import { warehouseSchema, type WarehouseFormValues } from "@/lib/validators/warehouse"
```

> El schema Zod se define en `lib/validators/warehouse.ts` (ver Sección 7).

---

### 5.3 `DeleteWarehouseDialog`

**Archivo:** `components/modules/warehouses/DeleteWarehouseDialog.tsx`
**Tipo:** `"use client"`

**Props:**

```typescript
interface DeleteWarehouseDialogProps {
  warehouse: Warehouse
  open: boolean
  onOpenChange: (open: boolean) => void
}
```

**Comportamiento:**

- Usa `AlertDialog` de shadcn/ui.
- Título: "¿Eliminar almacén?"
- Descripción: `"Esta acción desactivará el almacén \"${warehouse.name}\". Podrás restaurarlo desde el panel de administración de Django si es necesario."`
- Botón cancelar: cierra el dialog con `onOpenChange(false)`.
- Botón confirmar (variante destructiva): llama a `useDeleteWarehouse().mutate(warehouse.id)`.
- En `onSuccess` de la mutation: llamar a `onOpenChange(false)` para cerrar el dialog.
- Mientras la mutation está en `isPending`: deshabilitar ambos botones.

---

### 5.4 `WarehouseTable`

**Archivo:** `components/modules/warehouses/WarehouseTable.tsx`
**Tipo:** `"use client"`

**Props:**

```typescript
import type { PaginationState, OnChangeFn } from "@tanstack/react-table"
import type { PaginatedResponse } from "@/types/common"
import type { Warehouse } from "@/types/warehouse"

interface WarehouseTableProps {
  data: PaginatedResponse<Warehouse> | undefined
  isLoading: boolean
  pagination: PaginationState
  onPaginationChange: OnChangeFn<PaginationState>
  onEdit: (warehouse: Warehouse) => void
  onDelete: (warehouse: Warehouse) => void
}
```

**Implementación con TanStack Table v8:**

```typescript
const table = useReactTable({
  data: data?.results ?? [],
  columns: getWarehouseColumns(onEdit, onDelete),
  pageCount: data ? Math.ceil(data.count / 20) : -1,
  state: { pagination },
  onPaginationChange,
  getCoreRowModel: getCoreRowModel(),
  manualPagination: true,
})
```

**Estado de carga:**

- Cuando `isLoading === true`: mostrar un skeleton de tabla (filas con fondo gris animado) o un spinner centrado.
- Cuando `data` es undefined y no está cargando: mostrar mensaje "No hay almacenes registrados."

**Paginación:**

- Mostrar controles de paginación debajo de la tabla: botones "Anterior" / "Siguiente".
- Mostrar texto informativo: `"Mostrando {start}-{end} de {total} almacenes"`.
- Botón "Anterior" deshabilitado si `!table.getCanPreviousPage()`.
- Botón "Siguiente" deshabilitado si `!table.getCanNextPage()`.

**Render de la tabla:**

Usar `flexRender` de `@tanstack/react-table` con los componentes `Table`, `TableHeader`, `TableBody`, `TableRow`, `TableHead`, `TableCell` de `@/components/ui/table`.

---

## 6. Página

**Archivo:** `app/(dashboard)/warehouses/page.tsx`
**Tipo:** Client Component (`"use client"`)

**Estado interno:**

```typescript
const [params, setParams] = useState<WarehouseParams>({ page: 1 })
const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 20 })
const [formOpen, setFormOpen] = useState(false)
const [editing, setEditing] = useState<Warehouse | undefined>()
const [deleting, setDeleting] = useState<Warehouse | undefined>()
```

**Sincronización params ↔ pagination:**

Cuando el usuario navega de página via `onPaginationChange`, actualizar `params.page = pagination.pageIndex + 1`. Usar un `useEffect` que escuche cambios en `pagination.pageIndex`.

**Data:**

```typescript
const { data, isPending } = useWarehouseList(params)
```

**Handlers:**

```typescript
const handleEdit = (warehouse: Warehouse) => {
  setEditing(warehouse)
  setFormOpen(true)
}

const handleDelete = (warehouse: Warehouse) => {
  setDeleting(warehouse)
}

const handleFormSuccess = () => {
  setFormOpen(false)
  setEditing(undefined)
}

const handleNewWarehouse = () => {
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
      <h1 className="text-2xl font-bold">Almacenes</h1>
      <p className="text-muted-foreground">Gestiona los puntos de almacenamiento</p>
    </div>
    <Button onClick={handleNewWarehouse}>
      <Plus className="h-4 w-4 mr-2" />
      Nuevo almacén
    </Button>
  </div>

  {/* Filtros */}
  <WarehouseFilters params={params} onParamsChange={setParams} />

  {/* Tabla */}
  <WarehouseTable
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
        <DialogTitle>{editing ? "Editar almacén" : "Nuevo almacén"}</DialogTitle>
      </DialogHeader>
      <WarehouseForm
        warehouse={editing}
        onSuccess={handleFormSuccess}
        onCancel={() => { setFormOpen(false); setEditing(undefined) }}
      />
    </DialogContent>
  </Dialog>

  {/* Dialog de confirmación eliminación */}
  {deleting && (
    <DeleteWarehouseDialog
      warehouse={deleting}
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
import { useWarehouseList } from "@/lib/hooks/use-warehouses"
import type { Warehouse, WarehouseParams } from "@/types/warehouse"
import { WarehouseFilters } from "@/components/modules/warehouses/WarehouseFilters"
import { WarehouseTable } from "@/components/modules/warehouses/WarehouseTable"
import { WarehouseForm } from "@/components/modules/warehouses/WarehouseForm"
import { DeleteWarehouseDialog } from "@/components/modules/warehouses/DeleteWarehouseDialog"
```

---

## 7. Schema de validación Zod

### Archivo: `lib/validators/warehouse.ts`

```typescript
import { z } from "zod"

export const warehouseSchema = z.object({
  name: z.string().min(1, "El nombre es requerido").max(200, "Máximo 200 caracteres"),
  address: z.string().min(1, "La dirección es requerida"),
  city: z.string().min(1, "La ciudad es requerida"),
  country: z.string().min(1, "El país es requerido").default("Colombia"),
  capacity_m3: z.coerce
    .number({ invalid_type_error: "Debe ser un número" })
    .positive("La capacidad debe ser mayor a 0"),
  latitude: z.coerce
    .number({ invalid_type_error: "Debe ser un número" })
    .min(-90, "Latitud mínima: -90")
    .max(90, "Latitud máxima: 90")
    .optional()
    .nullable(),
  longitude: z.coerce
    .number({ invalid_type_error: "Debe ser un número" })
    .min(-180, "Longitud mínima: -180")
    .max(180, "Longitud máxima: 180")
    .optional()
    .nullable(),
})

export type WarehouseFormValues = z.infer<typeof warehouseSchema>
```

**Validaciones campo por campo:**

| Campo         | Tipo Zod                                | Mensaje de error                       |
| ------------- | --------------------------------------- | -------------------------------------- |
| `name`        | `z.string().min(1).max(200)`           | "El nombre es requerido"               |
| `address`     | `z.string().min(1)`                    | "La dirección es requerida"            |
| `city`        | `z.string().min(1)`                    | "La ciudad es requerida"               |
| `country`     | `z.string().min(1).default("Colombia")`| "El país es requerido"                 |
| `capacity_m3` | `z.coerce.number().positive()`         | "La capacidad debe ser mayor a 0"      |
| `latitude`    | `z.coerce.number().min(-90).max(90)`   | "Latitud mínima: -90 / máxima: 90"    |
| `longitude`   | `z.coerce.number().min(-180).max(180)` | "Longitud mínima: -180 / máxima: 180" |

> `z.coerce.number()` convierte automáticamente el string del input HTML a número antes de validar. Campos opcionales (`latitude`, `longitude`) aceptan string vacío → se deben limpiar antes de enviar al API (`undefined` o `null`).

**Transformación antes de enviar al API:**

En el `onSubmit` del formulario, transformar `WarehouseFormValues` a `WarehouseCreate`:

```typescript
const payload: WarehouseCreate = {
  name: values.name,
  address: values.address,
  city: values.city,
  country: values.country,
  capacity_m3: values.capacity_m3,
  latitude: values.latitude ?? null,
  longitude: values.longitude ?? null,
}
```

---

## 8. Manejo de errores

- **Error 400 (validación backend):** Iterar sobre las claves del objeto `error.response.data` y llamar a `form.setError(fieldName, { message: Array.isArray(msg) ? msg[0] : msg })` para mostrar errores de campo inline. Mostrar `non_field_errors` como un `Alert` visible sobre el formulario.
- **Error 401:** Manejado automáticamente por el interceptor de axios en `lib/axios.ts` (refresh + redirect a `/login`).
- **Error 404:** Mostrar mensaje "Almacén no encontrado." (aplica principalmente si se carga la página de detalle individual en el futuro).
- **Error de red:** Mostrar un mensaje genérico dentro del formulario o como un `Alert` de shadcn: "Error de conexión. Verifica que el servidor esté disponible."

---

## 9. Criterios de aceptación

- [x] La tabla muestra los almacenes del backend paginados (20 por página)
- [x] El total de registros se muestra en los controles de paginación
- [x] Los botones "Anterior" y "Siguiente" navegan correctamente entre páginas
- [x] La búsqueda por texto (`search`) filtra por nombre, ciudad y dirección en tiempo real (con debounce)
- [x] El filtro por ciudad (`city`) funciona correctamente
- [x] El filtro por país (`country`) funciona correctamente
- [x] Los filtros de rango de capacidad (`capacity_m3_gte` / `capacity_m3_lte`) funcionan
- [x] El botón "Limpiar filtros" resetea todos los filtros y regresa a la página 1
- [x] El botón "Nuevo almacén" abre el modal en modo crear
- [x] Se puede crear un nuevo almacén exitosamente (POST → 201)
- [x] Se puede editar un almacén existente haciendo clic en el ícono de edición (PATCH → 200)
- [x] Al hacer clic en editar, el formulario se pre-carga con los valores actuales del almacén
- [x] El campo `country` tiene "Colombia" como valor por defecto en el formulario de creación
- [x] Se puede eliminar un almacén con confirmación (DELETE → 204)
- [x] El dialog de eliminación muestra el nombre del almacén en la descripción
- [x] Tras crear un almacén, la lista se actualiza automáticamente (TanStack Query invalida)
- [x] Tras editar un almacén, la lista se actualiza automáticamente
- [x] Tras eliminar un almacén, desaparece de la lista automáticamente
- [x] Los errores de validación del backend (400) se muestran inline en cada campo del formulario
- [x] Los errores de validación client-side (Zod) se muestran antes del submit
- [x] El botón de submit se deshabilita mientras la mutation está en progreso
- [x] El estado de carga (skeleton o spinner) se muestra mientras la lista está cargando
- [x] La columna `capacity_m3` muestra el valor formateado con separador de miles (ej: "5.000 m³")
- [x] Los campos `latitude` y `longitude` son opcionales y aceptan ser enviados vacíos
- [x] Sin token → redirige a `/login` (manejado por el AuthGuard del layout)
- [x] Todo el código TypeScript pasa `npx tsc --noEmit` sin errores
