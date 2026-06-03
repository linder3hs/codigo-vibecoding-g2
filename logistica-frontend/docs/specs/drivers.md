# Spec — Drivers

**Modulo:** drivers
**Endpoint base:** /api/v1/drivers/
**Estado:** implementado — validado
**Fecha:** 2026-05-28

---

## 1. Tipos TypeScript

### Archivo: `types/drivers.ts`

#### Interface de lectura (GET response)

```ts
export interface Driver {
  id: number
  user: number
  user_full_name: string
  user_email: string
  user_username: string
  transport: number | null
  license_number: string
  license_expiry: string       // "YYYY-MM-DD"
  phone: string
  is_active: boolean
  created_at: string
  updated_at: string
}
```

> Nota: `transport` puede ser `null` si el conductor no tiene vehiculo asignado. `license_expiry` llega como string ISO date.

#### Interface de escritura (POST / PATCH body)

```ts
export interface DriverCreate {
  user: number                 // FK a auth_user — debe existir previamente
  license_number: string
  license_expiry: string       // "YYYY-MM-DD"
  phone: string
  transport: number | null     // FK a transport, nullable
  is_active: boolean
}
```

> Nota: `user` es int (id del auth_user). No incluir `id`, `created_at`, `updated_at`, ni los campos calculados `user_full_name`, `user_email`, `user_username`.

#### Interface de params (query string para filtros)

```ts
export interface DriverParams {
  transport?: number
  is_active?: boolean
  search?: string
  ordering?: 'license_expiry' | 'created_at' | '-license_expiry' | '-created_at'
  page?: number
}
```

#### Enums / Union types

No aplica enums propios para este modulo. `is_active` es boolean.

---

## 2. API Client

### Archivo: `lib/api/drivers.ts`

Objeto `driversApi` con metodos:

- `list(params?: DriverParams): Promise<PaginatedResponse<Driver>>`
  - GET `/api/v1/drivers/`
  - params se pasan como query string

- `get(id: number): Promise<Driver>`
  - GET `/api/v1/drivers/{id}/`
  - Respuesta usa `DriverReadSerializer` con campos calculados

- `create(data: DriverCreate): Promise<Driver>`
  - POST `/api/v1/drivers/`
  - Usa `DriverSerializer` (write) en el backend

- `update(id: number, data: Partial<DriverCreate>): Promise<Driver>`
  - PATCH `/api/v1/drivers/{id}/`
  - Usa `DriverSerializer` (write) en el backend

- `remove(id: number): Promise<void>`
  - DELETE `/api/v1/drivers/{id}/`
  - Soft delete: pone `is_active=false`, retorna 204

```ts
import api from '@/lib/axios'
import { PaginatedResponse } from '@/types/common'
import { Driver, DriverCreate, DriverParams } from '@/types/drivers'

export const driversApi = {
  list: (params?: DriverParams) =>
    api.get<PaginatedResponse<Driver>>('/drivers/', { params }).then(r => r.data),

  get: (id: number) =>
    api.get<Driver>(`/drivers/${id}/`).then(r => r.data),

  create: (data: DriverCreate) =>
    api.post<Driver>('/drivers/', data).then(r => r.data),

  update: (id: number, data: Partial<DriverCreate>) =>
    api.patch<Driver>(`/drivers/${id}/`, data).then(r => r.data),

  remove: (id: number) =>
    api.delete(`/drivers/${id}/`).then(() => undefined),
}
```

---

## 3. TanStack Query Hooks

### Archivo: `lib/hooks/use-drivers.ts`

#### `useDriverList(params?: DriverParams)`

```ts
queryKey: ['drivers', params]
queryFn: () => driversApi.list(params)
staleTime: 30_000
```

#### `useDriver(id: number)`

```ts
queryKey: ['drivers', id]
queryFn: () => driversApi.get(id)
enabled: !!id
```

#### `useCreateDriver()`

```ts
mutationFn: (data: DriverCreate) => driversApi.create(data)
onSuccess: invalidate ['drivers']
```

#### `useUpdateDriver()`

```ts
mutationFn: ({ id, data }: { id: number; data: Partial<DriverCreate> }) =>
  driversApi.update(id, data)
onSuccess: invalidate ['drivers'] y ['drivers', id]
```

#### `useDeleteDriver()`

```ts
mutationFn: (id: number) => driversApi.remove(id)
onSuccess: invalidate ['drivers']
```

Implementacion de referencia:

```ts
'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { driversApi } from '@/lib/api/drivers'
import { DriverCreate, DriverParams } from '@/types/drivers'

export function useDriverList(params?: DriverParams) {
  return useQuery({
    queryKey: ['drivers', params],
    queryFn: () => driversApi.list(params),
    staleTime: 30_000,
  })
}

export function useDriver(id: number) {
  return useQuery({
    queryKey: ['drivers', id],
    queryFn: () => driversApi.get(id),
    enabled: !!id,
  })
}

export function useCreateDriver() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: DriverCreate) => driversApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drivers'] })
    },
  })
}

export function useUpdateDriver() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<DriverCreate> }) =>
      driversApi.update(id, data),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['drivers'] })
      queryClient.invalidateQueries({ queryKey: ['drivers', id] })
    },
  })
}

export function useDeleteDriver() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => driversApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drivers'] })
    },
  })
}
```

---

## 4. Columnas TanStack Table

### Archivo: `lib/columns/driver-columns.tsx`

```ts
ColumnDef<Driver>[]
```

| accessorKey / id  | header          | render especial                                           |
| ----------------- | --------------- | --------------------------------------------------------- |
| `user_full_name`  | Conductor       | Texto directo                                             |
| `user_email`      | Email           | Texto directo                                             |
| `license_number`  | Licencia        | Texto directo                                             |
| `license_expiry`  | Vence           | Formatear con `Intl.DateTimeFormat('es-CO', { dateStyle: 'short' })` |
| `transport`       | Transporte      | Mostrar id o "—" si null (ver nota sobre nombre de transporte) |
| `is_active`       | Estado          | `Badge` de shadcn: `default` (verde) si true, `secondary` (gris) si false. Texto: "Activo" / "Inactivo" |
| `actions`         | (vacio)         | Botones Editar y Eliminar                                 |

> Nota sobre columna `transport`: el objeto `Driver` en lectura retorna `transport` como `number | null` (id del vehiculo), no el nombre. Si se desea mostrar la placa o marca, se necesitaria cargar la lista de transportes y hacer join en el cliente, o que el backend expanda el campo. Para el MVP se muestra el ID o "Sin asignar" si es null. Si se dispone del hook `useTransportList`, se puede enriquecer la columna en la pagina.

Implementacion de referencia:

```tsx
import { ColumnDef } from '@tanstack/react-table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Driver } from '@/types/drivers'
import { Pencil, Trash2 } from 'lucide-react'

interface DriverColumnsOptions {
  onEdit: (driver: Driver) => void
  onDelete: (driver: Driver) => void
}

const dateFormatter = new Intl.DateTimeFormat('es-CO', { dateStyle: 'short' })

export function getDriverColumns({ onEdit, onDelete }: DriverColumnsOptions): ColumnDef<Driver>[] {
  return [
    {
      accessorKey: 'user_full_name',
      header: 'Conductor',
    },
    {
      accessorKey: 'user_email',
      header: 'Email',
    },
    {
      accessorKey: 'license_number',
      header: 'Licencia',
    },
    {
      accessorKey: 'license_expiry',
      header: 'Vence',
      cell: ({ getValue }) => {
        const value = getValue<string>()
        if (!value) return '—'
        // license_expiry es "YYYY-MM-DD" — parsearlo sin zona horaria
        const [year, month, day] = value.split('-').map(Number)
        return dateFormatter.format(new Date(year, month - 1, day))
      },
    },
    {
      accessorKey: 'transport',
      header: 'Transporte',
      cell: ({ getValue }) => {
        const value = getValue<number | null>()
        return value !== null ? `#${value}` : '—'
      },
    },
    {
      accessorKey: 'is_active',
      header: 'Estado',
      cell: ({ getValue }) => {
        const active = getValue<boolean>()
        return (
          <Badge variant={active ? 'default' : 'secondary'}>
            {active ? 'Activo' : 'Inactivo'}
          </Badge>
        )
      },
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <div className="flex gap-2">
          <Button variant="ghost" size="icon" onClick={() => onEdit(row.original)}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => onDelete(row.original)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ]
}
```

---

## 5. Componentes

### 5.1 `DriverFilters`

**Archivo:** `components/modules/drivers/DriverFilters.tsx`

**Props:**

```ts
interface DriverFiltersProps {
  params: DriverParams
  onParamsChange: (params: DriverParams) => void
}
```

**Campos:**

- Search input: busca en `license_number`, `phone`, `user__first_name`, `user__last_name`, `user__email`
  - `onChange` con debounce de 300ms, actualiza `params.search`
  - Resetea `page` a 1 al cambiar
- Select "Estado": opciones `Todos` (sin filtro), `Activo` (`is_active=true`), `Inactivo` (`is_active=false`)
  - Actualiza `params.is_active`
- Select "Transporte": lista de transportes via `useTransportList` del modulo de Fase 1
  - Opcion "Todos" sin filtro, luego una opcion por transporte mostrando `plate_number` o `brand + model`
  - Actualiza `params.transport` con el id numerico
- Select "Ordenar": opciones `Vencimiento asc`, `Vencimiento desc`, `Fecha registro asc`, `Fecha registro desc`
  - Actualiza `params.ordering`

**Comportamiento:** cada cambio en cualquier filtro resetea `params.page` a 1.

**Directiva:** `"use client"` — usa hooks y event handlers.

---

### 5.2 `DriverForm`

**Archivo:** `components/modules/drivers/DriverForm.tsx`

**Props:**

```ts
interface DriverFormProps {
  driver?: Driver          // undefined = modo crear, objeto = modo editar
  onSuccess: () => void
  onCancel: () => void
}
```

**Campos del formulario:**

| Campo            | Tipo input               | Notas                                                    |
| ---------------- | ------------------------ | -------------------------------------------------------- |
| `user`           | Input numero             | Ingreso manual del ID del auth_user (ver limitacion abajo). Solo editable en modo crear. En modo editar mostrar readonly con `user_full_name` como referencia visual. |
| `license_number` | Input texto              | Requerido                                                |
| `license_expiry` | Input tipo `date`        | Requerido. Formato nativo `YYYY-MM-DD`                   |
| `phone`          | Input texto              | Requerido                                                |
| `transport`      | Select con Controller    | Opcional. Lista de transportes via `useTransportList`. Opcion "Sin asignar" envia `null`. |
| `is_active`      | Switch (shadcn)          | Default `true` en modo crear                             |

**Limitacion documentada — campo `user`:**

No existe endpoint en la API para listar `auth_user`. Por lo tanto, no es posible construir un Select dinamico de usuarios. La alternativa implementada es un `Input` de tipo numero donde el operador ingresa manualmente el ID del `auth_user`. El sistema muestra un helper text: "El usuario debe existir previamente en Django Admin. Ingresa el ID numerico del usuario."

En modo editar, el campo `user` se muestra como texto de solo lectura con el `user_full_name` del conductor actual (el ID no se puede cambiar en PATCH de forma habitual — si el backend lo permite, se puede enviar, pero lo mas seguro es omitirlo en PATCH y solo enviarlo en POST).

**Modo editar:** `defaultValues` pre-carga todos los campos desde el objeto `driver`. El campo `user` se omite del PATCH payload.

**Submits:**
- Modo crear: `useCreateDriver()` con todos los campos incluyendo `user`
- Modo editar: `useUpdateDriver()` con todos los campos excepto `user`

**Select de `transport` con Controller:**

```tsx
<Controller
  name="transport"
  control={control}
  render={({ field }) => (
    <Select
      value={field.value !== null && field.value !== undefined ? String(field.value) : ''}
      onValueChange={(val) => field.onChange(val === '' ? null : Number(val))}
    >
      <SelectTrigger>
        <SelectValue placeholder="Sin asignar" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="">Sin asignar</SelectItem>
        {transportList?.results.map((t) => (
          <SelectItem key={t.id} value={String(t.id)}>
            {t.plate_number} — {t.brand} {t.model}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )}
/>
```

**Directiva:** `"use client"` — usa `useForm`, `useMutation`, hooks.

---

### 5.3 `DeleteDriverDialog`

**Archivo:** `components/modules/drivers/DeleteDriverDialog.tsx`

**Props:**

```ts
interface DeleteDriverDialogProps {
  driver: Driver
  open: boolean
  onOpenChange: (open: boolean) => void
}
```

Usa `AlertDialog` de shadcn. Muestra el nombre del conductor (`driver.user_full_name`) en el mensaje de confirmacion. Llama a `useDeleteDriver()` al confirmar. Cierra el dialog en `onSuccess` via `onOpenChange(false)`.

**Directiva:** `"use client"` — usa mutation y estado de dialogo.

---

### 5.4 `DriverTable`

**Archivo:** `components/modules/drivers/DriverTable.tsx`

**Props:**

```ts
interface DriverTableProps {
  data: PaginatedResponse<Driver> | undefined
  isLoading: boolean
  pagination: PaginationState
  onPaginationChange: OnChangeFn<PaginationState>
  onEdit: (driver: Driver) => void
  onDelete: (driver: Driver) => void
}
```

Usa `useReactTable` con:
- `getCoreRowModel()`
- `manualPagination: true`
- `pageCount: Math.ceil((data?.count ?? 0) / 20)`
- Columnas desde `getDriverColumns({ onEdit, onDelete })`

Cuando `isLoading` es true, mostrar skeleton de tabla (filas con `animate-pulse`).
Cuando `data?.results` es vacio y no esta cargando, mostrar mensaje "No se encontraron conductores".

**Directiva:** `"use client"` — usa hooks de TanStack Table.

---

## 6. Pagina

**Archivo:** `app/(dashboard)/drivers/page.tsx`

**Tipo:** Client Component (`"use client"`)

**Estado interno:**

```ts
const [params, setParams] = useState<DriverParams>({ page: 1 })
const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 20 })
const [formOpen, setFormOpen] = useState(false)
const [editing, setEditing] = useState<Driver | undefined>()
const [deleting, setDeleting] = useState<Driver | undefined>()
```

**Sincronizacion params — pagination:**

Cuando `pagination.pageIndex` cambia, actualizar `params.page = pagination.pageIndex + 1`.

**Handlers:**

```ts
const handleEdit = (driver: Driver) => {
  setEditing(driver)
  setFormOpen(true)
}

const handleDelete = (driver: Driver) => {
  setDeleting(driver)
}

const handleFormSuccess = () => {
  setFormOpen(false)
  setEditing(undefined)
}

const handleFormCancel = () => {
  setFormOpen(false)
  setEditing(undefined)
}
```

**Query:**

```ts
const { data, isPending } = useDriverList(params)
```

**Estructura JSX:**

```tsx
<div>
  <PageHeader
    title="Conductores"
    action={
      <Button onClick={() => { setEditing(undefined); setFormOpen(true) }}>
        Nuevo conductor
      </Button>
    }
  />

  <DriverFilters params={params} onParamsChange={setParams} />

  <DriverTable
    data={data}
    isLoading={isPending}
    pagination={pagination}
    onPaginationChange={setPagination}
    onEdit={handleEdit}
    onDelete={handleDelete}
  />

  <Dialog open={formOpen} onOpenChange={setFormOpen}>
    <DialogContent>
      <DriverForm
        driver={editing}
        onSuccess={handleFormSuccess}
        onCancel={handleFormCancel}
      />
    </DialogContent>
  </Dialog>

  {deleting && (
    <DeleteDriverDialog
      driver={deleting}
      open={!!deleting}
      onOpenChange={(open) => { if (!open) setDeleting(undefined) }}
    />
  )}
</div>
```

---

## 7. Schema de validacion Zod

```ts
// En components/modules/drivers/DriverForm.tsx
import { z } from 'zod'

const driverSchema = z.object({
  user: z.number({
    error: 'El ID del usuario es requerido y debe ser un numero entero positivo',
  }).int().positive(),

  license_number: z.string({
    error: 'El numero de licencia es requerido',
  }).min(1, 'El numero de licencia es requerido'),

  license_expiry: z.string({
    error: 'La fecha de vencimiento es requerida',
  }).regex(
    /^\d{4}-\d{2}-\d{2}$/,
    'La fecha debe tener el formato YYYY-MM-DD'
  ),

  phone: z.string({
    error: 'El telefono es requerido',
  }).min(1, 'El telefono es requerido'),

  transport: z.number().int().positive().nullable().optional(),

  is_active: z.boolean().default(true),
})

type DriverFormValues = z.infer<typeof driverSchema>
```

**Validaciones campo por campo:**

| Campo            | Regla Zod                                     | Mensaje de error                                           |
| ---------------- | --------------------------------------------- | ---------------------------------------------------------- |
| `user`           | `z.number().int().positive()`                 | "El ID del usuario es requerido y debe ser un numero entero positivo" |
| `license_number` | `z.string().min(1)`                           | "El numero de licencia es requerido"                       |
| `license_expiry` | `z.string().regex(/^\d{4}-\d{2}-\d{2}$/)`    | "La fecha debe tener el formato YYYY-MM-DD"                |
| `phone`          | `z.string().min(1)`                           | "El telefono es requerido"                                 |
| `transport`      | `z.number().int().positive().nullable().optional()` | —                                                    |
| `is_active`      | `z.boolean().default(true)`                   | —                                                          |

**Registro en `useForm`:**

- `user`: `register('user', { valueAsNumber: true })` — convierte el string del input a number
- `license_expiry`: `register('license_expiry')` — el input `type="date"` entrega el string `YYYY-MM-DD` directamente
- `transport`: usar `Controller` (no `register`) — el Select entrega string, convertir a number o null en `onValueChange`
- `is_active`: usar `Controller` con componente Switch de shadcn

**Modo editar — campos a omitir en PATCH:**

En modo editar, el campo `user` NO se incluye en el payload enviado al backend. Construir el objeto de datos manualmente antes de llamar a `useUpdateDriver`:

```ts
const { user: _user, ...updateData } = formValues
useUpdateDriver.mutate({ id: driver.id, data: updateData })
```

---

## 8. Manejo de errores

- **Error 400 (validacion backend):** el backend puede retornar errores de campo como `{ "license_number": ["Ya existe un conductor con este numero de licencia."], "user": ["Ya existe un perfil de conductor para este usuario."] }`. Iterar las claves del response body y llamar a `setError(campo, { message })` de React Hook Form para mostrar errores inline.
- **Error 401:** manejado automaticamente por el interceptor de axios en `lib/axios.ts` (refresh + redirect a `/login`).
- **Error 404:** mostrar mensaje "Conductor no encontrado" en el area de contenido.
- **Error de red / 500:** mostrar toast con mensaje "Error al conectar con el servidor. Intenta de nuevo."
- **Campo `user` invalido (400 con clave `user`):** mostrar inline en el input de ID con el mensaje del backend. El error mas comun es "Ya existe un perfil de conductor para este usuario."

---

## 9. Criterios de aceptacion

- [x] La tabla muestra los conductores del backend paginados correctamente (20 por pagina)
- [x] La busqueda por texto funciona (query param `search`) — busca en licencia, telefono, nombre, apellido y email del usuario
- [x] El filtro por `is_active` funciona (Activo / Inactivo / Todos)
- [x] El filtro por `transport` funciona mostrando solo conductores con ese vehiculo asignado
- [x] El filtro de ordenamiento funciona por `license_expiry` y `created_at`
- [x] Se puede crear un nuevo conductor exitosamente (POST → 201) ingresando el ID de un auth_user existente
- [x] Se puede editar un conductor existente (PATCH → 200) — el campo `user` no se envia en el PATCH
- [x] Se puede eliminar con confirmacion (DELETE → 204, soft delete)
- [x] Tras crear/editar/eliminar, la lista se actualiza automaticamente (invalidacion de queries)
- [x] Los errores de validacion del backend se muestran inline en el formulario (ej: licencia duplicada, usuario ya tiene perfil)
- [x] El estado loading se muestra mientras carga la lista (skeleton de tabla)
- [x] El estado loading se muestra mientras se procesa el formulario (boton deshabilitado con spinner)
- [x] El campo `user` muestra un helper text explicando que el usuario debe existir en Django Admin
- [x] En modo editar, el campo `user` es de solo lectura y muestra `user_full_name`
- [x] El campo `transport` permite seleccionar "Sin asignar" (envia `null`)
- [x] La columna `license_expiry` muestra la fecha formateada en locale `es-CO`
- [x] La columna `is_active` muestra Badge "Activo" (verde) o "Inactivo" (gris)
- [x] Sin token → redirige a /login (manejado por middleware)
