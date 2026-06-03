# Spec — Transport

**Módulo:** transport
**Endpoint base:** /api/v1/transport/
**Estado:** implementado — validado
**Fecha:** 2026-05-27

---

## 1. Tipos TypeScript

### Archivo: `types/transport.ts`

#### Interface de lectura (GET response)

```typescript
export type TransportType = 'TRUCK' | 'VAN' | 'MOTORCYCLE' | 'CARGO_BIKE'

export interface Transport {
  id: number
  plate_number: string
  transport_type: TransportType
  brand: string
  model: string
  year: number
  capacity_kg: string   // llega como string decimal del API
  capacity_m3: string   // llega como string decimal del API
  is_available: boolean
  created_at: string
  updated_at: string
}
```

> `transport_type` es un union type estricto, nunca `string` genérico. `capacity_kg` y `capacity_m3` se tipan como `string` porque el API de Django los serializa como cadenas decimales. `year` es `number` (integer). `is_available` es `boolean`. No hay campo `is_active` (no hay soft delete).

#### Interface de escritura (POST / PATCH body)

```typescript
export interface TransportCreate {
  plate_number: string
  transport_type: TransportType
  brand: string
  model: string
  year: number
  capacity_kg: number
  capacity_m3: number
  is_available: boolean
}
```

> Los campos `id`, `created_at`, `updated_at` nunca se envían al backend.

#### Interface de params (query string para filtros)

```typescript
export interface TransportParams {
  page?: number
  transport_type?: TransportType
  is_available?: boolean
  capacity_kg_gte?: number
  capacity_kg_lte?: number
  capacity_m3_gte?: number
  capacity_m3_lte?: number
  search?: string
  ordering?: 'brand' | 'year' | 'capacity_kg' | 'created_at' | '-brand' | '-year' | '-capacity_kg' | '-created_at'
}
```

---

## 2. API Client

### Archivo: `lib/api/transport.ts`

Objeto `transportApi` con los siguientes métodos. Importa la instancia axios de `@/lib/axios` y los tipos de `@/types/transport`.

```typescript
export const transportApi = {
  list,
  get,
  create,
  update,
  remove,
}
```

- **`list(params?: TransportParams): Promise<PaginatedResponse<Transport>>`**
  - `GET /api/v1/transport/`
  - Pasar `params` como `{ params }` en la config de axios
  - Retorna la respuesta paginada completa `{ count, next, previous, results }`

- **`get(id: number): Promise<Transport>`**
  - `GET /api/v1/transport/{id}/`
  - Retorna un único objeto `Transport`

- **`create(data: TransportCreate): Promise<Transport>`**
  - `POST /api/v1/transport/`
  - Body: objeto `TransportCreate`
  - Response HTTP 201 → retorna el `Transport` creado

- **`update(id: number, data: Partial<TransportCreate>): Promise<Transport>`**
  - `PATCH /api/v1/transport/{id}/`
  - Body: campos parciales de `TransportCreate`
  - Response HTTP 200 → retorna el `Transport` actualizado

- **`remove(id: number): Promise<void>`**
  - `DELETE /api/v1/transport/{id}/`
  - **Hard delete permanente** — el registro se elimina definitivamente de la base de datos
  - Response HTTP 204 → sin cuerpo

---

## 3. TanStack Query Hooks

### Archivo: `lib/hooks/use-transport.ts`

Todos los hooks usan la sintaxis TanStack Query **v5**. Importa `transportApi` de `@/lib/api/transport`.

#### `useTransportList(params?: TransportParams)`

```typescript
useQuery({
  queryKey: ['transport', params],
  queryFn: () => transportApi.list(params),
  staleTime: 30_000,
})
```

#### `useTransport(id: number)`

```typescript
useQuery({
  queryKey: ['transport', id],
  queryFn: () => transportApi.get(id),
  enabled: !!id,
  staleTime: 30_000,
})
```

#### `useCreateTransport()`

```typescript
useMutation({
  mutationFn: (data: TransportCreate) => transportApi.create(data),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['transport'] })
  },
})
```

#### `useUpdateTransport()`

```typescript
useMutation({
  mutationFn: ({ id, data }: { id: number; data: Partial<TransportCreate> }) =>
    transportApi.update(id, data),
  onSuccess: (_data, { id }) => {
    queryClient.invalidateQueries({ queryKey: ['transport'] })
    queryClient.invalidateQueries({ queryKey: ['transport', id] })
  },
})
```

#### `useDeleteTransport()`

```typescript
useMutation({
  mutationFn: (id: number) => transportApi.remove(id),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['transport'] })
  },
})
```

> queryKey usa `['transport']` (singular, sin 's') — consistente con el nombre del recurso en el backend.

---

## 4. Columnas TanStack Table

### Archivo: `lib/columns/transport-columns.tsx`

Lista de `ColumnDef<Transport>[]`:

| `accessorKey` / `id` | `header`         | `cell` (render especial)                                              |
| -------------------- | ---------------- | --------------------------------------------------------------------- |
| `plate_number`       | "Placa"          | Texto directo                                                         |
| `transport_type`     | "Tipo"           | Badge con 4 variantes (ver abajo)                                     |
| `brand_model`        | "Marca / Modelo" | `${row.original.brand} ${row.original.model}` — columna id, no accessor |
| `capacity_kg`        | "Cap. (kg)"      | Texto directo (string del API)                                        |
| `is_available`       | "Disponibilidad" | Badge: true → "Disponible" default, false → "No disponible" destructive |
| `actions`            | "" (vacío)       | Botones Editar y Eliminar                                             |

**Badge de `transport_type`:**
- `TRUCK` → `<Badge variant="default">Camión</Badge>`
- `VAN` → `<Badge variant="secondary">Van</Badge>`
- `MOTORCYCLE` → `<Badge variant="outline">Moto</Badge>`
- `CARGO_BIKE` → `<Badge variant="destructive">Cargo Bike</Badge>`

**Badge de `is_available`:**
- `true` → `<Badge variant="default">Disponible</Badge>`
- `false` → `<Badge variant="destructive">No disponible</Badge>`

**Columna `brand_model`** (concatenación, no `accessorKey`):

```typescript
{
  id: 'brand_model',
  header: 'Marca / Modelo',
  cell: ({ row }) => `${row.original.brand} ${row.original.model}`,
}
```

Factory: `export function getTransportColumns(onEdit: (t: Transport) => void, onDelete: (t: Transport) => void): ColumnDef<Transport>[]`

---

## 5. Componentes

### 5.1 `TransportFilters`

**Archivo:** `components/modules/transport/TransportFilters.tsx`
**Tipo:** `"use client"`

**Props:**

```typescript
interface TransportFiltersProps {
  params: TransportParams
  onParamsChange: (params: TransportParams) => void
}
```

**Campos del UI:**

- **Search input:** placeholder "Buscar por placa, marca o modelo...". Debounce 300ms. Actualiza `params.search` y resetea `params.page` a `1`.
- **Select de tipo (`transport_type`):** value="" (Todos los tipos), TRUCK, VAN, MOTORCYCLE, CARGO_BIKE.
- **Select de disponibilidad (`is_available`):** 3 opciones exactas:
  - value="" → "Todos"
  - value="true" → "Disponible"
  - value="false" → "No disponible"
- **Input capacidad mínima kg (`capacity_kg_gte`):** Input tipo number, placeholder "Cap. mín. (kg)".
- **Input capacidad máxima kg (`capacity_kg_lte`):** Input tipo number, placeholder "Cap. máx. (kg)".
- **Botón "Limpiar filtros":** resetea `params` a `{ page: 1 }`.

---

### 5.2 `TransportForm`

**Archivo:** `components/modules/transport/TransportForm.tsx`
**Tipo:** `"use client"`

**Props:**

```typescript
interface TransportFormProps {
  transport?: Transport
  onSuccess: () => void
  onCancel: () => void
}
```

**Layout:** Modal con max-w-2xl. Formulario en 2 columnas con `grid grid-cols-2 gap-4`.

**Distribución de campos en el formulario (2 cols):**

| Col 1            | Col 2                  |
| ---------------- | ---------------------- |
| `plate_number`   | `transport_type`       |
| `brand`          | `model`                |
| `year`           | `is_available`         |
| `capacity_kg`    | `capacity_m3`          |

**Detalle de cada campo:**

| Campo            | Tipo de input                   | Label                 | Requerido | Default  |
| ---------------- | ------------------------------- | --------------------- | --------- | -------- |
| `plate_number`   | `Input` texto                   | "Placa"               | Sí        | —        |
| `transport_type` | `Select` (Controller)           | "Tipo de transporte"  | Sí        | "TRUCK"  |
| `brand`          | `Input` texto                   | "Marca"               | Sí        | —        |
| `model`          | `Input` texto                   | "Modelo"              | Sí        | —        |
| `year`           | `Input` type="number"           | "Año"                 | Sí        | —        |
| `is_available`   | `input type="checkbox"` nativo  | "Disponible"          | Sí        | true     |
| `capacity_kg`    | `Input` type="number" step="0.01" | "Capacidad (kg)"    | Sí        | —        |
| `capacity_m3`    | `Input` type="number" step="0.01" | "Capacidad (m³)"    | Sí        | —        |

> `year`, `capacity_kg`, `capacity_m3`: usar `valueAsNumber: true` en el `register` de React Hook Form.
> `transport_type`: usar `<Controller>` con `<Select>` de shadcn.
> `is_available`: usar `<div className="flex items-center gap-2">` + `<input type="checkbox">` nativo + label. Usar `register('is_available')`.

**Lógica de payload:** Los valores numéricos (`year`, `capacity_kg`, `capacity_m3`) se pasan directamente como `number`. `is_available` como `boolean`.

**Modo editar:** pre-cargar defaultValues con los valores del transport. `capacity_kg` y `capacity_m3` vienen como string del API pero el formulario los usa como number.

---

### 5.3 `DeleteTransportDialog`

**Archivo:** `components/modules/transport/DeleteTransportDialog.tsx`
**Tipo:** `"use client"`

**Props:**

```typescript
interface DeleteTransportDialogProps {
  transport: Transport
  open: boolean
  onOpenChange: (open: boolean) => void
}
```

- Usa `AlertDialog` de shadcn/ui
- Título: "¿Eliminar transporte?"
- Descripción: **Debe indicar explícitamente que la eliminación es PERMANENTE** — ejemplo: `"Esta acción eliminará permanentemente el vehículo \"${transport.plate_number}\" (${transport.brand} ${transport.model}). Esta operación no se puede deshacer."`
- Botón confirmar: variante destructiva. Llama a `useDeleteTransport().mutate(transport.id)`.
- En `onSuccess`: `onOpenChange(false)`.
- Mientras `isPending`: ambos botones deshabilitados.

> A diferencia de otros módulos, el DELETE es un **hard delete permanente** (no soft delete). El mensaje DEBE dejar esto claro.

---

### 5.4 `TransportTable`

**Archivo:** `components/modules/transport/TransportTable.tsx`
**Tipo:** `"use client"`

**Props:**

```typescript
interface TransportTableProps {
  data: PaginatedResponse<Transport> | undefined
  isLoading: boolean
  pagination: PaginationState
  onPaginationChange: OnChangeFn<PaginationState>
  onEdit: (transport: Transport) => void
  onDelete: (transport: Transport) => void
}
```

- Usa `useReactTable` con `manualPagination: true`
- Estado de carga: skeleton de 5 filas × 6 columnas
- Sin datos: "No hay transportes registrados."
- Paginación: botones "Anterior" / "Siguiente" + texto `"Mostrando {start}-{end} de {total} transportes"`

---

## 6. Página

**Archivo:** `app/(dashboard)/transport/page.tsx`
**Tipo:** Client Component (`"use client"`)

- Header: "Transportes" / "Gestiona la flota de vehículos"
- Botón: "Nuevo transporte"
- Modal max-w-2xl
- Estado: `params`, `pagination`, `formOpen`, `editing`, `deleting`
- Sincroniza paginación → `params.page` con `useEffect`

---

## 7. Schema de validación Zod

### Archivo: `lib/validators/transport.ts`

```typescript
import { z } from "zod"

export const transportSchema = z.object({
  plate_number: z.string().min(1, "La placa es requerida").max(20, "Máximo 20 caracteres"),
  transport_type: z.enum(['TRUCK', 'VAN', 'MOTORCYCLE', 'CARGO_BIKE'], {
    error: "El tipo de transporte es requerido",
  }),
  brand: z.string().min(1, "La marca es requerida"),
  model: z.string().min(1, "El modelo es requerido"),
  year: z.number({ error: "El año debe ser un número" }).int("El año debe ser un número entero").min(1990, "Año mínimo 1990").max(new Date().getFullYear() + 1, "Año inválido"),
  capacity_kg: z.number({ error: "La capacidad debe ser un número" }).positive("La capacidad debe ser mayor a 0"),
  capacity_m3: z.number({ error: "La capacidad debe ser un número" }).positive("La capacidad debe ser mayor a 0"),
  is_available: z.boolean(),
})

export type TransportFormValues = z.infer<typeof transportSchema>
```

> Nota: se usa `z.number()` (no `z.coerce.number()`) porque la conversión string→number se delega a `valueAsNumber: true` en RHF. Zod v4 no acepta `invalid_type_error` — usar `error` en su lugar.

---

## 8. Manejo de errores

Igual que el módulo Customers:
- **Error 400:** `form.setError(fieldName, { message })` para errores de campo inline.
- **Error 401:** Manejado por interceptor axios.
- **Error de red:** Mensaje genérico.

---

## 9. Criterios de aceptación

- [x] `transport_type` es union type `'TRUCK' | 'VAN' | 'MOTORCYCLE' | 'CARGO_BIKE'` (no string genérico)
- [x] `capacity_kg` y `capacity_m3` tipados como `string` en interface de lectura (`Transport`)
- [x] `year` tipado como `number` en lectura y escritura
- [x] `is_available` tipado como `boolean` en lectura y escritura
- [x] queryKey usa `['transport']` (singular, sin 's')
- [x] DeleteTransportDialog advierte que la eliminación es PERMANENTE (no recuperable)
- [x] Columna `brand_model` concatena `brand` + espacio + `model`
- [x] Select de `is_available` en filtros con 3 opciones (Todos / Disponible / No disponible)
- [x] Badge de `is_available`: variant `default` para true, `destructive` para false
- [x] Badge de `transport_type`: 4 variantes distintas (default/secondary/outline/destructive)
- [x] `year`, `capacity_kg`, `capacity_m3` usan `valueAsNumber: true` en RHF
- [x] `is_available` en formulario usa checkbox (nativo o shadcn)
- [x] La tabla muestra los transportes del backend paginados (20 por página)
- [x] El total de registros se muestra en los controles de paginación
- [x] Los botones "Anterior" y "Siguiente" navegan correctamente entre páginas
- [x] La búsqueda por texto (`search`) filtra con debounce
- [x] Se puede crear un nuevo transporte exitosamente (POST → 201)
- [x] Se puede editar un transporte existente (PATCH → 200)
- [x] Se puede eliminar un transporte con confirmación (DELETE → 204)
- [x] Tras crear/editar/eliminar, la lista se actualiza automáticamente
- [x] Los errores de validación del backend (400) se muestran inline
- [x] Todo el código TypeScript pasa `npx tsc --noEmit` sin errores
