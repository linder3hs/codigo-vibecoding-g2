# Spec — Routes

**Módulo:** routes
**Endpoint base:** /api/v1/routes/
**Estado:** implementado — validado
**Fecha:** 2026-05-28

---

## 1. Tipos TypeScript

### Archivo: `types/route.ts`

#### Interface de lectura — Ruta (GET response)

```ts
export interface Route {
  id: number
  name: string
  origin_warehouse: number        // FK id
  estimated_duration_hours: string  // decimal llega como string
  estimated_distance_km: string     // decimal llega como string
  is_active: boolean
  created_at: string
  updated_at: string
}
```

#### Interface de lectura — Parada (GET /routes/{id}/stops/ response)

```ts
export interface RouteStop {
  id: number
  route: number                     // FK id de la ruta padre
  stop_order: number
  address: string
  city: string
  estimated_offset_hours: string    // decimal llega como string
  latitude: string | null           // decimal llega como string
  longitude: string | null          // decimal llega como string
  created_at: string
  updated_at: string
}
```

#### Interface de escritura — Ruta (POST / PATCH body)

```ts
export interface RouteCreate {
  name: string
  origin_warehouse: number          // FK id (int)
  estimated_duration_hours: number
  estimated_distance_km: number
}
```

#### Interface de escritura — Parada (POST / PUT body)

```ts
export interface RouteStopCreate {
  stop_order: number
  address: string
  city: string
  estimated_offset_hours: number
  latitude?: number
  longitude?: number
}
```

#### Interface de params — Rutas (query string para filtros)

```ts
export interface RouteParams {
  page?: number
  origin_warehouse?: number
  search?: string
  ordering?: 'name' | 'estimated_duration_hours' | 'estimated_distance_km' | 'created_at' | '-name' | '-estimated_duration_hours' | '-estimated_distance_km' | '-created_at'
}
```

---

## 2. API Client

### Archivo: `lib/api/routes.ts`

Objeto `routesApi` con métodos:

```ts
// Métodos para rutas
routesApi.list(params?: RouteParams): Promise<PaginatedResponse<Route>>
  // GET /api/v1/routes/
  // params se pasan como query string

routesApi.get(id: number): Promise<Route>
  // GET /api/v1/routes/{id}/

routesApi.create(data: RouteCreate): Promise<Route>
  // POST /api/v1/routes/

routesApi.update(id: number, data: Partial<RouteCreate>): Promise<Route>
  // PATCH /api/v1/routes/{id}/

routesApi.remove(id: number): Promise<void>
  // DELETE /api/v1/routes/{id}/
  // Soft delete — pone is_active=false, retorna 204

// Métodos para paradas (sub-recurso)
routesApi.listStops(routeId: number): Promise<RouteStop[]>
  // GET /api/v1/routes/{routeId}/stops/
  // Retorna lista ordenada por stop_order (no paginada)

routesApi.createStop(routeId: number, data: RouteStopCreate): Promise<RouteStop>
  // POST /api/v1/routes/{routeId}/stops/

routesApi.updateStop(routeId: number, stopId: number, data: Partial<RouteStopCreate>): Promise<RouteStop>
  // PATCH /api/v1/routes/{routeId}/stops/{stopId}/

routesApi.deleteStop(routeId: number, stopId: number): Promise<void>
  // DELETE /api/v1/routes/{routeId}/stops/{stopId}/
  // Retorna 204
```

**Nota sobre stops:** el endpoint de lista de paradas retorna un array directo (no paginado), ya que son un sub-recurso anidado a una ruta específica.

---

## 3. TanStack Query Hooks

### Archivo: `lib/hooks/use-routes.ts`

#### `useRouteList(params?: RouteParams)`

```ts
queryKey: ['routes', params]
queryFn: () => routesApi.list(params)
staleTime: 30_000
```

#### `useRoute(id: number)`

```ts
queryKey: ['routes', id]
queryFn: () => routesApi.get(id)
enabled: !!id
staleTime: 30_000
```

#### `useCreateRoute()`

```ts
mutationFn: (data: RouteCreate) => routesApi.create(data)
onSuccess: invalidate ['routes']
```

#### `useUpdateRoute()`

```ts
mutationFn: ({ id, data }: { id: number; data: Partial<RouteCreate> }) => routesApi.update(id, data)
onSuccess: invalidate ['routes'] y ['routes', id]
```

#### `useDeleteRoute()`

```ts
mutationFn: (id: number) => routesApi.remove(id)
onSuccess: invalidate ['routes']
```

#### `useRouteStops(routeId: number)`

```ts
queryKey: ['routes', routeId, 'stops']
queryFn: () => routesApi.listStops(routeId)
enabled: !!routeId
staleTime: 30_000
```

#### `useCreateRouteStop(routeId: number)`

```ts
mutationFn: (data: RouteStopCreate) => routesApi.createStop(routeId, data)
onSuccess: invalidate ['routes', routeId, 'stops']
```

#### `useUpdateRouteStop(routeId: number)`

```ts
mutationFn: ({ stopId, data }: { stopId: number; data: Partial<RouteStopCreate> }) => routesApi.updateStop(routeId, stopId, data)
onSuccess: invalidate ['routes', routeId, 'stops']
```

#### `useDeleteRouteStop(routeId: number)`

```ts
mutationFn: (stopId: number) => routesApi.deleteStop(routeId, stopId)
onSuccess: invalidate ['routes', routeId, 'stops']
```

---

## 4. Columnas TanStack Table

### Archivo: `lib/columns/route-columns.tsx`

```ts
ColumnDef<Route>[] con las siguientes columnas:

1. accessorKey: 'name'
   header: 'Nombre'
   cell: valor directo (string)

2. accessorKey: 'origin_warehouse'
   header: 'Almacén origen'
   cell: mostrar el id del warehouse (en la página, el componente padre puede enriquecer con nombre via select de warehouses cargado por separado)
   // Nota: el API retorna origin_warehouse como number (FK id).
   // En la página de lista se puede cargar la lista de warehouses para resolver el nombre.
   // Si se decide mostrar solo el id por ahora, documentar deuda técnica.

3. accessorKey: 'estimated_distance_km'
   header: 'Distancia (km)'
   cell: parseFloat(value).toFixed(2)

4. accessorKey: 'estimated_duration_hours'
   header: 'Duración (horas)'
   cell: parseFloat(value).toFixed(2)

5. id: 'actions'
   header: 'Acciones'
   cell: botones Editar y Eliminar
         Editar → llama onEdit(row.original)
         Eliminar → llama onDelete(row.original)
```

**Nota sobre `origin_warehouse`:** el API de Routes retorna el campo como `number` (FK id), no como objeto anidado. Para mostrar el nombre del almacén en la tabla se necesita una de estas estrategias:
- Opción A (recomendada): cargar `useWarehouseList({ page: 1 })` en la página y construir un mapa `id → name` que se pasa a las columnas vía `meta`.
- Opción B: agregar columna con el id numerico y un tooltip con el nombre (requiere mismo mapa).

La implementación debe seguir Opción A.

---

## 5. Componentes

### 5.1 `RouteFilters`

**Archivo:** `components/modules/routes/RouteFilters.tsx`

**Props:**

```ts
interface RouteFiltersProps {
  params: RouteParams
  onParamsChange: (params: RouteParams) => void
}
```

**Campos:**

- Search input: busca en `name` (query param `search`)
- Select de almacén origen: lista de warehouses activos, filtro exacto por `origin_warehouse` (id numérico). Usar `Controller` de RHF si está dentro de un form, o `useState` local si es filtro independiente.
- Select de ordering: opciones `name`, `-name`, `estimated_distance_km`, `-estimated_distance_km`, `estimated_duration_hours`, `-estimated_duration_hours`, `created_at`, `-created_at`
- Botón "Limpiar filtros" que resetea params a `{ page: 1 }`

**Dependencias:** necesita `useWarehouseList` para poblar el select de almacén origen.

---

### 5.2 `RouteForm`

**Archivo:** `components/modules/routes/RouteForm.tsx`

**Props:**

```ts
interface RouteFormProps {
  route?: Route              // undefined = modo crear, objeto = modo editar
  onSuccess: () => void
  onCancel: () => void
}
```

**Campos del formulario:**

| Campo | Input | Validación Zod |
|-------|-------|----------------|
| `name` | Input texto | `z.string().min(1, { error: "Requerido" })` |
| `origin_warehouse` | Select de warehouses (FK) | `z.number({ error: "Requerido" })` |
| `estimated_duration_hours` | Input número decimal | `z.number({ error: "Requerido" }).positive({ error: "Debe ser mayor a 0" })` |
| `estimated_distance_km` | Input número decimal | `z.number({ error: "Requerido" }).positive({ error: "Debe ser mayor a 0" })` |

**Modo editar:** pre-cargar valores con `defaultValues` del `useForm`:
- `name`: `route.name`
- `origin_warehouse`: `route.origin_warehouse`
- `estimated_duration_hours`: `parseFloat(route.estimated_duration_hours)`
- `estimated_distance_km`: `parseFloat(route.estimated_distance_km)`

**Submit crear:** llama `useCreateRoute()`, en `onSuccess` llama `onSuccess()`
**Submit editar:** llama `useUpdateRoute()`, en `onSuccess` llama `onSuccess()`

**Inputs numéricos:** usar `{ valueAsNumber: true }` en `register()` para `estimated_duration_hours` y `estimated_distance_km`.

**Select de FK `origin_warehouse`:** usar `Controller` de React Hook Form envolviendo el componente `Select` de shadcn/ui. NO usar `FormControl` con `Slot`.

**Dependencias:** necesita `useWarehouseList` para poblar el select de almacén origen.

---

### 5.3 `DeleteRouteDialog`

**Archivo:** `components/modules/routes/DeleteRouteDialog.tsx`

**Props:**

```ts
interface DeleteRouteDialogProps {
  route: Route
  open: boolean
  onOpenChange: (open: boolean) => void
}
```

Usa `AlertDialog` de shadcn/ui. Muestra el nombre de la ruta en el mensaje de confirmación. Llama a `useDeleteRoute()` al confirmar. Cierra el dialog en `onSuccess`.

---

### 5.4 `RouteTable`

**Archivo:** `components/modules/routes/RouteTable.tsx`

**Props:**

```ts
interface RouteTableProps {
  data: PaginatedResponse<Route> | undefined
  isLoading: boolean
  pagination: PaginationState
  onPaginationChange: OnChangeFn<PaginationState>
  onEdit: (route: Route) => void
  onDelete: (route: Route) => void
  warehouseMap: Record<number, string>   // id → nombre del almacén
}
```

Usa `useReactTable` con:
- `getCoreRowModel()`
- `manualPagination: true`
- `pageCount`: calculado desde `Math.ceil((data?.count ?? 0) / 20)`
- `state: { pagination }`
- `onPaginationChange`

El `warehouseMap` se pasa como `meta` a la tabla para que las columnas puedan resolver el nombre del almacén origen.

---

### 5.5 `StopForm`

**Archivo:** `components/modules/routes/StopForm.tsx`

**Props:**

```ts
interface StopFormProps {
  routeId: number
  stop?: RouteStop              // undefined = modo agregar, objeto = modo editar
  onSuccess: () => void
  onCancel: () => void
}
```

**Campos del formulario:**

| Campo | Input | Validación Zod |
|-------|-------|----------------|
| `stop_order` | Input número entero | `z.number({ error: "Requerido" }).int({ error: "Debe ser entero" }).min(1, { error: "Mínimo 1" })` |
| `address` | Input texto | `z.string().min(1, { error: "Requerido" })` |
| `city` | Input texto | `z.string().min(1, { error: "Requerido" })` |
| `estimated_offset_hours` | Input número decimal | `z.number({ error: "Requerido" }).min(0, { error: "Debe ser >= 0" })` |
| `latitude` | Input número decimal (opcional) | `z.number().optional()` |
| `longitude` | Input número decimal (opcional) | `z.number().optional()` |

**Modo editar:** pre-cargar valores con `defaultValues`:
- `stop_order`: `stop.stop_order`
- `address`: `stop.address`
- `city`: `stop.city`
- `estimated_offset_hours`: `parseFloat(stop.estimated_offset_hours)`
- `latitude`: `stop.latitude ? parseFloat(stop.latitude) : undefined`
- `longitude`: `stop.longitude ? parseFloat(stop.longitude) : undefined`

**Submit agregar:** llama `useCreateRouteStop(routeId)`, en `onSuccess` llama `onSuccess()`
**Submit editar:** llama `useUpdateRouteStop(routeId)`, en `onSuccess` llama `onSuccess()`

**Inputs numéricos:** usar `{ valueAsNumber: true }` en `register()` para todos los campos numéricos.

---

### 5.6 `StopList`

**Archivo:** `components/modules/routes/StopList.tsx`

**Props:**

```ts
interface StopListProps {
  routeId: number
}
```

**Comportamiento:**

- Llama `useRouteStops(routeId)` para obtener la lista de paradas
- Muestra estado loading mientras carga
- Muestra las paradas en una tabla o lista ordenada por `stop_order`
- Columnas/campos visibles: `stop_order`, `address`, `city`, `estimated_offset_hours`, acciones (Editar, Eliminar)
- Botón "Agregar parada" que abre `StopForm` en modo crear (inline o en un `Dialog`)
- Al hacer click en Editar → abre `StopForm` con la parada seleccionada
- Al hacer click en Eliminar → abre `DeleteStopDialog` con confirmación

**Estado interno:**

```ts
const [formOpen, setFormOpen] = useState(false)
const [editingStop, setEditingStop] = useState<RouteStop | undefined>()
const [deletingStop, setDeletingStop] = useState<RouteStop | undefined>()
```

---

### 5.7 `DeleteStopDialog`

**Archivo:** `components/modules/routes/DeleteStopDialog.tsx`

**Props:**

```ts
interface DeleteStopDialogProps {
  routeId: number
  stop: RouteStop
  open: boolean
  onOpenChange: (open: boolean) => void
}
```

Usa `AlertDialog` de shadcn/ui. Muestra la dirección y ciudad de la parada en el mensaje de confirmación. Llama a `useDeleteRouteStop(routeId)` con `stop.id` al confirmar. Cierra el dialog en `onSuccess`.

---

## 6. Páginas

### 6.1 Página de lista

**Archivo:** `app/(dashboard)/routes/page.tsx`
**Tipo:** Client Component (`"use client"`)

**Estado interno:**

```ts
const [params, setParams] = useState<RouteParams>({ page: 1 })
const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 20 })
const [formOpen, setFormOpen] = useState(false)
const [editing, setEditing] = useState<Route | undefined>()
const [deleting, setDeleting] = useState<Route | undefined>()
```

**Queries:**

```ts
const { data, isPending } = useRouteList(params)
const { data: warehousesData } = useWarehouseList({ page: 1 })
// Construir warehouseMap desde warehousesData.results
const warehouseMap = useMemo(
  () => Object.fromEntries((warehousesData?.results ?? []).map(w => [w.id, w.name])),
  [warehousesData]
)
```

**Sincronización pagination ↔ params:**

```ts
// Cuando cambia pagination.pageIndex → actualizar params.page
// Cuando cambia params → resetear pagination.pageIndex a 0
```

**Estructura JSX:**

```
<PageHeader title="Rutas" action={<Button onClick={() => setFormOpen(true)}>Nueva ruta</Button>} />
<RouteFilters params={params} onParamsChange={(p) => { setParams(p); setPagination(prev => ({ ...prev, pageIndex: 0 })) }} />
<RouteTable
  data={data}
  isLoading={isPending}
  pagination={pagination}
  onPaginationChange={setPagination}
  onEdit={(route) => { setEditing(route); setFormOpen(true) }}
  onDelete={(route) => setDeleting(route)}
  warehouseMap={warehouseMap}
/>
<Dialog open={formOpen} onOpenChange={setFormOpen}>
  <RouteForm
    route={editing}
    onSuccess={() => { setFormOpen(false); setEditing(undefined) }}
    onCancel={() => { setFormOpen(false); setEditing(undefined) }}
  />
</Dialog>
{deleting && (
  <DeleteRouteDialog
    route={deleting}
    open={!!deleting}
    onOpenChange={(open) => { if (!open) setDeleting(undefined) }}
  />
)}
```

---

### 6.2 Página de detalle

**Archivo:** `app/(dashboard)/routes/[id]/page.tsx`
**Tipo:** Client Component (`"use client"`)

**Parámetros:** recibe `params.id` (string) desde Next.js App Router, convertir a número con `parseInt`.

**Estado interno:**

```ts
const [editFormOpen, setEditFormOpen] = useState(false)
const [deleting, setDeleting] = useState(false)
```

**Queries:**

```ts
const { data: route, isPending } = useRoute(id)
// StopList maneja internamente su propio useRouteStops(id)
```

**Estructura JSX:**

```
// Sección de datos de la ruta
<PageHeader
  title={route?.name ?? 'Cargando...'}
  action={
    <>
      <Button variant="outline" onClick={() => setEditFormOpen(true)}>Editar ruta</Button>
      <Button variant="destructive" onClick={() => setDeleting(true)}>Eliminar ruta</Button>
    </>
  }
/>

// Tarjeta con detalles de la ruta
<Card>
  <CardContent>
    <dl>
      <dt>Almacén origen</dt><dd>{warehouseName}</dd>
      <dt>Distancia</dt><dd>{parseFloat(route.estimated_distance_km).toFixed(2)} km</dd>
      <dt>Duración estimada</dt><dd>{parseFloat(route.estimated_duration_hours).toFixed(2)} horas</dd>
      <dt>Creado</dt><dd>{formatDate(route.created_at)}</dd>
    </dl>
  </CardContent>
</Card>

// Sección de paradas inline
<section>
  <h2>Paradas</h2>
  <StopList routeId={id} />
</section>

// Dialog de edición de ruta
<Dialog open={editFormOpen} onOpenChange={setEditFormOpen}>
  <RouteForm
    route={route}
    onSuccess={() => setEditFormOpen(false)}
    onCancel={() => setEditFormOpen(false)}
  />
</Dialog>

// AlertDialog de eliminación de ruta
{route && (
  <DeleteRouteDialog
    route={route}
    open={deleting}
    onOpenChange={setDeleting}
  />
)}
```

**Nota:** al confirmar la eliminación de la ruta, redirigir a `/routes` usando `useRouter().push('/routes')`.

**Dependencias:** necesita `useWarehouseList` para resolver el nombre del almacén origen en la tarjeta de detalles.

---

## 7. Schema de validación Zod

### Schema de ruta

```ts
// En components/modules/routes/RouteForm.tsx
import { z } from 'zod'

const routeSchema = z.object({
  name: z.string().min(1, { error: 'Requerido' }),
  origin_warehouse: z.number({ error: 'Requerido' }),
  estimated_duration_hours: z.number({ error: 'Requerido' }).positive({ error: 'Debe ser mayor a 0' }),
  estimated_distance_km: z.number({ error: 'Requerido' }).positive({ error: 'Debe ser mayor a 0' }),
})

type RouteFormValues = z.infer<typeof routeSchema>
```

**Validaciones campo por campo:**
- `name`: requerido, mínimo 1 carácter
- `origin_warehouse`: número requerido (FK id entero)
- `estimated_duration_hours`: número positivo requerido (> 0)
- `estimated_distance_km`: número positivo requerido (> 0)

### Schema de parada

```ts
// En components/modules/routes/StopForm.tsx
import { z } from 'zod'

const stopSchema = z.object({
  stop_order: z.number({ error: 'Requerido' }).int({ error: 'Debe ser entero' }).min(1, { error: 'Mínimo 1' }),
  address: z.string().min(1, { error: 'Requerido' }),
  city: z.string().min(1, { error: 'Requerido' }),
  estimated_offset_hours: z.number({ error: 'Requerido' }).min(0, { error: 'Debe ser >= 0' }),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
})

type StopFormValues = z.infer<typeof stopSchema>
```

**Validaciones campo por campo:**
- `stop_order`: entero requerido, mínimo 1. Debe ser único por ruta (validación en backend — mostrar error 400 inline).
- `address`: requerido, mínimo 1 carácter
- `city`: requerido, mínimo 1 carácter
- `estimated_offset_hours`: número requerido, >= 0 (puede ser 0 para la primera parada)
- `latitude`: opcional, número decimal si se ingresa
- `longitude`: opcional, número decimal si se ingresa

**Nota `stop_order` único:** la validación de unicidad por ruta la hace el backend y retorna error 400. El frontend debe capturar el error 400 y usar `setError('stop_order', { message: '...' })` para mostrarlo inline en el formulario.

---

## 8. Manejo de errores

- **Error 400 (validación backend):** capturar el objeto de errores del response e iterar sobre las claves para llamar `setError(campo, { message: '...' })` de React Hook Form. Mostrar errores inline en el formulario. Caso especial: `stop_order` único por ruta.
- **Error 401:** manejado automáticamente por el interceptor de axios (`lib/axios.ts`) — intenta refresh y si falla redirige a `/login`.
- **Error 404:** en la página de detalle mostrar un mensaje "Ruta no encontrada" con un botón para volver al listado.
- **Error de red:** mostrar `toast` de shadcn/ui con mensaje genérico "Error de conexión, intenta nuevamente".
- **Eliminación de ruta con envíos asociados:** el backend puede retornar error 400 o 409 si la ruta está referenciada por envíos activos. Mostrar el mensaje del backend en un toast o dialog de error.

---

## 9. Criterios de aceptación

### Módulo de rutas (lista)

- [x] La tabla muestra las rutas activas del backend paginadas (20 por página)
- [x] La búsqueda por texto en `name` funciona (query param `search`)
- [x] El filtro por `origin_warehouse` funciona (muestra nombre del almacén en el select)
- [x] El filtro de `ordering` funciona con todas las opciones disponibles
- [x] Se puede crear una nueva ruta exitosamente (POST → 201)
- [x] Se puede editar una ruta existente desde el modal (PATCH → 200)
- [x] Se puede eliminar una ruta con confirmación (DELETE → 204, soft delete)
- [x] Tras crear/editar/eliminar, la lista se actualiza automáticamente (invalidate query)
- [x] Los errores de validación del backend se muestran inline en el formulario
- [x] El estado loading se muestra mientras carga la lista (skeleton o spinner)
- [x] El estado loading se muestra mientras se procesa el formulario (botón deshabilitado)
- [x] Sin token → redirige a /login (manejado por middleware)
- [x] La columna `origin_warehouse` muestra el nombre del almacén (no el id numérico)

### Página de detalle de ruta

- [x] Muestra los datos de la ruta (nombre, almacén origen, distancia, duración)
- [x] El nombre del almacén origen se resuelve correctamente
- [x] Se puede editar la ruta desde el dialog de la página de detalle
- [x] Se puede eliminar la ruta desde la página de detalle con confirmación y redirección a /routes
- [x] La sección de paradas muestra todas las paradas ordenadas por `stop_order`
- [x] Se puede agregar una nueva parada (POST → 201) y la lista se actualiza
- [x] Se puede editar una parada existente (PATCH → 200) y la lista se actualiza
- [x] Se puede eliminar una parada con confirmación (DELETE → 204) y la lista se actualiza
- [x] El error de `stop_order` duplicado se muestra inline en el formulario de parada
- [x] Los errores de validación del backend para paradas se muestran inline en el formulario
- [x] El estado loading de la sección de paradas se muestra correctamente
- [x] Ruta no encontrada (404) muestra mensaje con opción de volver al listado
