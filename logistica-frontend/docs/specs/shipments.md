# Spec — Shipments

**Modulo:** shipments
**Endpoint base:** /api/v1/shipments/
**Estado:** implementado — validado
**Fecha:** 2026-05-28

---

## 1. Tipos TypeScript

### Archivo: `types/shipments.ts`

#### Interface de lectura — Shipment (GET response)

```ts
export interface Shipment {
  id: number
  tracking_number: string
  customer: number
  customer_name: string          // campo calculado retornado por el backend
  origin_warehouse: number
  destination_address: string
  destination_city: string
  destination_country: string
  status: ShipmentStatus
  estimated_delivery_date: string | null   // "YYYY-MM-DD" o null
  driver: number | null
  transport: number | null
  route: number | null
  notes: string
  weight_total_kg: string        // decimal como string, calculado desde items
  base_cost: string              // decimal como string, calculado desde items
  calculated_cost: string        // decimal como string, calculado desde items
  created_at: string
  updated_at: string
}
```

> **Nota sobre customer_name:** si el backend no retorna este campo calculado, la columna de la tabla debe resolver el nombre a partir de un lookup separado o mostrar el id. Verificar en Swagger.

#### Interface de escritura — ShipmentCreate (POST / PATCH body)

```ts
export interface ShipmentCreate {
  customer: number
  origin_warehouse: number
  destination_address: string
  destination_city: string
  destination_country: string
  status: ShipmentStatus
  estimated_delivery_date?: string | null   // "YYYY-MM-DD"
  driver?: number | null
  transport?: number | null
  route?: number | null
  notes?: string
}
```

> Campos excluidos: `tracking_number` (auto-generado), `weight_total_kg`, `base_cost`, `calculated_cost` (calculados desde items), `id`, `created_at`, `updated_at`.

#### Interface de lectura — ShipmentItem (GET response)

```ts
export interface ShipmentItem {
  id: number
  shipment: number
  product: number
  product_name: string           // campo calculado retornado por el backend
  product_sku: string            // campo calculado retornado por el backend
  quantity: number
  unit_price_at_time: string     // decimal como string
  subtotal: string               // decimal como string, calculado automáticamente
  created_at: string
  updated_at: string
}
```

> **Nota:** `subtotal = quantity × unit_price_at_time` calculado por el backend. Verificar campos exactos en Swagger (`product_name`, `product_sku` pueden no existir).

#### Interface de escritura — ShipmentItemCreate (POST body)

```ts
export interface ShipmentItemCreate {
  product: number
  quantity: number
  unit_price_at_time: string     // decimal como string
}
```

> Campos excluidos: `subtotal` (calculado), `id`, `shipment`, `created_at`, `updated_at`.

#### Interface de params — ShipmentParams (query string para filtros)

```ts
export interface ShipmentParams {
  page?: number
  status?: ShipmentStatus
  customer?: number
  driver?: number
  origin_warehouse?: number
  destination_city?: string
  search?: string
  ordering?: ShipmentOrdering
}
```

#### Enums / Union types

```ts
export type ShipmentStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'IN_TRANSIT'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'RETURNED'

export type ShipmentOrdering =
  | 'status'
  | '-status'
  | 'estimated_delivery_date'
  | '-estimated_delivery_date'
  | 'created_at'
  | '-created_at'
  | 'calculated_cost'
  | '-calculated_cost'
```

---

## 2. API Client

### Archivo: `lib/api/shipments.ts`

Objeto `shipmentsApi` con metodos:

```ts
import api from '@/lib/axios'
import type {
  Shipment,
  ShipmentCreate,
  ShipmentItem,
  ShipmentItemCreate,
  ShipmentParams,
} from '@/types/shipments'
import type { PaginatedResponse } from '@/types/common'

export const shipmentsApi = {
  // --- Shipments ---

  list(params?: ShipmentParams): Promise<PaginatedResponse<Shipment>>
  // GET /api/v1/shipments/
  // params se pasan como query string

  get(id: number): Promise<Shipment>
  // GET /api/v1/shipments/{id}/

  create(data: ShipmentCreate): Promise<Shipment>
  // POST /api/v1/shipments/
  // Response 201

  update(id: number, data: Partial<ShipmentCreate>): Promise<Shipment>
  // PATCH /api/v1/shipments/{id}/
  // Response 200

  remove(id: number): Promise<void>
  // DELETE /api/v1/shipments/{id}/
  // Response 204
  // Nota: no hay soft delete en shipments — DELETE real o no expuesto en UI

  // --- ShipmentItems ---

  listItems(shipmentId: number): Promise<ShipmentItem[]>
  // GET /api/v1/shipments/{shipmentId}/items/
  // Retorna array (no paginado, todos los items del envio)

  createItem(shipmentId: number, data: ShipmentItemCreate): Promise<ShipmentItem>
  // POST /api/v1/shipments/{shipmentId}/items/
  // Response 201

  deleteItem(shipmentId: number, itemId: number): Promise<void>
  // DELETE /api/v1/shipments/{shipmentId}/items/{itemId}/
  // Response 204
  // No hay PATCH de item — si se necesita editar, eliminar y crear nuevamente
}
```

---

## 3. TanStack Query Hooks

### Archivo: `lib/hooks/use-shipments.ts`

#### `useShipmentList(params?: ShipmentParams)`

```ts
queryKey: ['shipments', params]
queryFn: () => shipmentsApi.list(params)
staleTime: 30_000
```

#### `useShipment(id: number)`

```ts
queryKey: ['shipments', id]
queryFn: () => shipmentsApi.get(id)
enabled: !!id
staleTime: 30_000
```

#### `useCreateShipment()`

```ts
mutationFn: (data: ShipmentCreate) => shipmentsApi.create(data)
onSuccess: invalidate ['shipments']
```

#### `useUpdateShipment()`

```ts
mutationFn: ({ id, data }: { id: number; data: Partial<ShipmentCreate> }) =>
  shipmentsApi.update(id, data)
onSuccess: invalidate ['shipments'] e invalidate ['shipments', id]
```

#### `useDeleteShipment()`

```ts
mutationFn: (id: number) => shipmentsApi.remove(id)
onSuccess: invalidate ['shipments']
```

> Nota: useDeleteShipment se define pero puede no usarse en la UI — los envios se controlan por status, no se eliminan.

#### `useShipmentItems(shipmentId: number)`

```ts
queryKey: ['shipments', shipmentId, 'items']
queryFn: () => shipmentsApi.listItems(shipmentId)
enabled: !!shipmentId
staleTime: 30_000
```

#### `useCreateShipmentItem()`

```ts
mutationFn: ({ shipmentId, data }: { shipmentId: number; data: ShipmentItemCreate }) =>
  shipmentsApi.createItem(shipmentId, data)
onSuccess: invalidate ['shipments', shipmentId, 'items'] e invalidate ['shipments', shipmentId]
// invalidar el shipment individual para actualizar weight_total_kg, calculated_cost
```

#### `useDeleteShipmentItem()`

```ts
mutationFn: ({ shipmentId, itemId }: { shipmentId: number; itemId: number }) =>
  shipmentsApi.deleteItem(shipmentId, itemId)
onSuccess: invalidate ['shipments', shipmentId, 'items'] e invalidate ['shipments', shipmentId]
```

---

## 4. Columnas TanStack Table

### Archivo: `lib/columns/shipment-columns.tsx`

Lista de `ColumnDef<Shipment>`:

| accessorKey / id | header | cell render |
|---|---|---|
| `tracking_number` | "Tracking" | texto plano con fuente mono si posible |
| `customer_name` | "Cliente" | texto plano (o `customer` como fallback si no hay campo calculado) |
| `status` | "Estado" | Badge shadcn con variante y color por valor (ver tabla abajo) |
| `destination_city` | "Ciudad destino" | texto plano |
| `estimated_delivery_date` | "Entrega estimada" | `value ? new Intl.DateTimeFormat('es-CO', { dateStyle: 'medium' }).format(new Date(value + 'T00:00:00')) : '—'` |
| `calculated_cost` | "Costo calculado" | `parseFloat(value).toFixed(2)` — mostrar con simbolo `$` |
| `actions` | "" | Botones: Editar (navega a `/shipments/[id]/edit`) y Ver detalle (navega a `/shipments/[id]`) |

**Variantes de Badge por status:**

| Status | Variant / clase |
|---|---|
| `PENDING` | `secondary` (gris) |
| `CONFIRMED` | `default` (azul) |
| `IN_TRANSIT` | `outline` + clase `text-orange-600 border-orange-600` |
| `DELIVERED` | clase `bg-green-100 text-green-800` |
| `CANCELLED` | `destructive` (rojo) |
| `RETURNED` | clase `bg-yellow-100 text-yellow-800` |

**Labels de display para status:**

```ts
const STATUS_LABELS: Record<ShipmentStatus, string> = {
  PENDING: 'Pendiente',
  CONFIRMED: 'Confirmado',
  IN_TRANSIT: 'En tránsito',
  DELIVERED: 'Entregado',
  CANCELLED: 'Cancelado',
  RETURNED: 'Devuelto',
}
```

---

## 5. Componentes

### 5.1 `ShipmentFilters`

**Archivo:** `components/modules/shipments/ShipmentFilters.tsx`

**Directiva:** `"use client"`

**Props:**

```ts
interface ShipmentFiltersProps {
  params: ShipmentParams
  onParamsChange: (params: ShipmentParams) => void
}
```

**Campos:**

- Search input: busca en `tracking_number`, `destination_address`, `destination_city` — query param `search`
- Select `status`: opciones PENDING, CONFIRMED, IN_TRANSIT, DELIVERED, CANCELLED, RETURNED con labels en español + opcion "Todos"
- Input texto `destination_city`: filtro exacto por ciudad destino
- Select `ordering`: opciones de orden (created_at desc por defecto)

> Los filtros por `customer`, `driver`, `origin_warehouse` son opcionales para la UI inicial — se pueden agregar como selects con carga lazy si el MVP lo requiere.

**Nota de implementacion:** Usar `Controller` de RHF o `useState` local para los selects. Cada cambio llama `onParamsChange` con los params actualizados y resetea `page` a `1`.

---

### 5.2 `ShipmentForm`

**Archivo:** `components/modules/shipments/ShipmentForm.tsx`

**Directiva:** `"use client"`

**Props:**

```ts
interface ShipmentFormProps {
  shipment?: Shipment          // undefined = modo crear, objeto = modo editar
  onSuccess: () => void
  onCancel: () => void
}
```

**Campos del formulario con tipos de input:**

| Campo | Input | Validacion |
|---|---|---|
| `customer` | Select de customers via `useCustomerList` | requerido, FK int |
| `origin_warehouse` | Select de warehouses via `useWarehouseList` | requerido, FK int |
| `destination_address` | Input texto | requerido, min 1 |
| `destination_city` | Input texto | requerido, min 1 |
| `destination_country` | Input texto (default "Colombia") | requerido, min 1 |
| `status` | Select con ShipmentStatus | requerido, enum |
| `estimated_delivery_date` | Input tipo `date` | opcional |
| `driver` | Select de drivers via `useDriverList` + opcion "Sin asignar" | opcional, FK int o null |
| `transport` | Select de transportes via `useTransportList` + opcion "Sin asignar" | opcional, FK int o null |
| `route` | Select de rutas via `useRouteList` + opcion "Sin asignar" | opcional, FK int o null |
| `notes` | Textarea | opcional |

**Carga de FKs:**

- `useCustomerList({ page: 1 })` — listar todos para el select (sin paginacion en el select, cargar primera pagina o implementar busqueda inline)
- `useWarehouseList()` — igual
- `useDriverList()` — igual
- `useTransportList()` — igual
- `useRouteList()` — igual

**Modo editar:** pre-cargar valores con `defaultValues` del `useForm`. Para FK opcionales (driver, transport, route) que llegan como `null`, inicializar como el string especial `"__none__"` en el select y convertir a `null` al enviar.

**Submits:**
- Crear: `useCreateShipment` — tras exito navega a `/shipments`
- Editar: `useUpdateShipment` — tras exito navega a `/shipments` o llama `onSuccess`

**Manejo de selects FK con `Controller`:**

```tsx
<Controller
  control={control}
  name="customer"
  render={({ field }) => (
    <Select
      value={field.value?.toString()}
      onValueChange={(val) => field.onChange(Number(val))}
    >
      ...
    </Select>
  )}
/>
```

Para campos opcionales (driver, transport, route) que pueden ser null:

```tsx
onValueChange={(val) => field.onChange(val === '__none__' ? null : Number(val))}
value={field.value == null ? '__none__' : field.value.toString()}
```

---

### 5.3 `DeleteShipmentItemDialog`

**Archivo:** `components/modules/shipments/DeleteShipmentItemDialog.tsx`

**Directiva:** `"use client"`

**Props:**

```ts
interface DeleteShipmentItemDialogProps {
  item: ShipmentItem
  shipmentId: number
  open: boolean
  onOpenChange: (open: boolean) => void
}
```

Usa `AlertDialog` de shadcn. Llama a `useDeleteShipmentItem` al confirmar con `{ shipmentId, itemId: item.id }`.

Muestra en el mensaje: nombre del producto (`item.product_name || item.product`) y cantidad (`item.quantity`).

> No hay `DeleteShipmentDialog` — los envios no se eliminan desde la UI. Se controlan por status.

---

### 5.4 `ShipmentTable`

**Archivo:** `components/modules/shipments/ShipmentTable.tsx`

**Directiva:** `"use client"`

**Props:**

```ts
interface ShipmentTableProps {
  data: PaginatedResponse<Shipment> | undefined
  isLoading: boolean
  pagination: PaginationState
  onPaginationChange: OnChangeFn<PaginationState>
  onEdit: (shipment: Shipment) => void
}
```

> `onDelete` no aplica para shipments. `onEdit` navega a `/shipments/[id]/edit` o se puede manejar via `router.push`.

Usa `useReactTable` con:
- `getCoreRowModel()`
- `manualPagination: true`
- `pageCount: Math.ceil((data?.count ?? 0) / 20)`
- `state: { pagination }`
- `onPaginationChange`

Incluir columna de acciones con:
- Boton "Ver" → navega a `/shipments/[id]`
- Boton "Editar" → navega a `/shipments/[id]/edit`

---

### 5.5 `ItemForm`

**Archivo:** `components/modules/shipments/ItemForm.tsx`

**Directiva:** `"use client"`

**Props:**

```ts
interface ItemFormProps {
  shipmentId: number
  onSuccess: () => void
  onCancel: () => void
}
```

**Campos:**

| Campo | Input | Validacion |
|---|---|---|
| `product` | Select de products via `useProductList` | requerido, FK int |
| `quantity` | Input numero entero | requerido, entero positivo >= 1 |
| `unit_price_at_time` | Input numero decimal | requerido, positivo |

**Submit:** `useCreateShipmentItem` con `{ shipmentId, data }`.

**Nota:** El select de producto debe mostrar nombre y SKU para facilitar identificacion. Usar `Controller` de RHF.

---

### 5.6 `ItemList`

**Archivo:** `components/modules/shipments/ItemList.tsx`

**Directiva:** `"use client"`

**Props:**

```ts
interface ItemListProps {
  shipmentId: number
}
```

Llama a `useShipmentItems(shipmentId)`. Muestra tabla inline con columnas:

| Campo | Display |
|---|---|
| `product_name` | Nombre del producto |
| `product_sku` | SKU |
| `quantity` | Numero |
| `unit_price_at_time` | `parseFloat(value).toFixed(2)` |
| `subtotal` | `parseFloat(value).toFixed(2)` |
| acciones | Boton "Eliminar" → abre `DeleteShipmentItemDialog` |

Muestra boton "Agregar item" que expande el `ItemForm` inline (o abre un Sheet/Dialog).

Estado interno:
- `showForm: boolean` — controla visibilidad del form
- `deletingItem: ShipmentItem | undefined` — item seleccionado para eliminar

---

## 6. Pagina lista

**Archivo:** `app/(dashboard)/shipments/page.tsx`

**Directiva:** `"use client"`

**Estado interno:**

```ts
const [params, setParams] = useState<ShipmentParams>({ page: 1 })
const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 20 })
```

Cuando `pagination.pageIndex` cambia, actualizar `params.page = pagination.pageIndex + 1`.

**Queries:**

```ts
const { data, isPending } = useShipmentList(params)
```

**Estructura JSX:**

```tsx
<div>
  <PageHeader
    title="Envios"
    action={
      <Button asChild>
        <Link href="/shipments/new">Nuevo envio</Link>
      </Button>
    }
  />
  <ShipmentFilters params={params} onParamsChange={(p) => { setParams({ ...p, page: 1 }); setPagination(prev => ({ ...prev, pageIndex: 0 })) }} />
  <ShipmentTable
    data={data}
    isLoading={isPending}
    pagination={pagination}
    onPaginationChange={setPagination}
    onEdit={(shipment) => router.push(`/shipments/${shipment.id}/edit`)}
  />
</div>
```

---

## 7. Pagina crear

**Archivo:** `app/(dashboard)/shipments/new/page.tsx`

**Directiva:** `"use client"`

Pagina full que renderiza `ShipmentForm` sin `shipment` prop (modo crear).

```tsx
export default function NewShipmentPage() {
  const router = useRouter()

  return (
    <div>
      <PageHeader title="Nuevo envio" />
      <ShipmentForm
        onSuccess={() => router.push('/shipments')}
        onCancel={() => router.push('/shipments')}
      />
    </div>
  )
}
```

---

## 8. Pagina editar

**Archivo:** `app/(dashboard)/shipments/[id]/edit/page.tsx`

**Directiva:** `"use client"`

Carga el envio con `useShipment(id)` y renderiza `ShipmentForm` con el objeto como prop (modo editar).

```tsx
export default function EditShipmentPage({ params }: { params: { id: string } }) {
  const id = Number(params.id)
  const router = useRouter()
  const { data: shipment, isPending } = useShipment(id)

  if (isPending) return <LoadingSpinner />
  if (!shipment) return <div>Envio no encontrado</div>

  return (
    <div>
      <PageHeader title={`Editar envio ${shipment.tracking_number}`} />
      <ShipmentForm
        shipment={shipment}
        onSuccess={() => router.push('/shipments')}
        onCancel={() => router.push(`/shipments/${id}`)}
      />
    </div>
  )
}
```

---

## 9. Pagina detalle

**Archivo:** `app/(dashboard)/shipments/[id]/page.tsx`

**Directiva:** `"use client"`

Muestra todos los datos del envio y la seccion inline de items.

**Queries:**

```ts
const { data: shipment, isPending } = useShipment(id)
```

**Estructura JSX:**

```tsx
<div>
  <PageHeader
    title={`Envio ${shipment.tracking_number}`}
    action={
      <Button asChild variant="outline">
        <Link href={`/shipments/${id}/edit`}>Editar</Link>
      </Button>
    }
  />

  {/* Tarjeta con datos del envio */}
  <Card>
    <CardContent>
      {/* Grid de campos: status, customer, origin_warehouse, destination, driver, transport, route, dates, costs, notes */}
      <div className="grid grid-cols-2 gap-4">
        <DetailField label="Estado" value={<StatusBadge status={shipment.status} />} />
        <DetailField label="Cliente" value={shipment.customer_name ?? shipment.customer} />
        <DetailField label="Almacen origen" value={shipment.origin_warehouse} />
        <DetailField label="Destino" value={`${shipment.destination_address}, ${shipment.destination_city}, ${shipment.destination_country}`} />
        <DetailField label="Conductor" value={shipment.driver ?? '—'} />
        <DetailField label="Transporte" value={shipment.transport ?? '—'} />
        <DetailField label="Ruta" value={shipment.route ?? '—'} />
        <DetailField label="Entrega estimada" value={shipment.estimated_delivery_date ?? '—'} />
        <DetailField label="Peso total" value={`${shipment.weight_total_kg} kg`} />
        <DetailField label="Costo calculado" value={`$${parseFloat(shipment.calculated_cost).toFixed(2)}`} />
        <DetailField label="Notas" value={shipment.notes || '—'} />
      </div>
    </CardContent>
  </Card>

  {/* Seccion de items */}
  <section>
    <h2>Items del envio</h2>
    <ItemList shipmentId={id} />
  </section>
</div>
```

**Estado interno:**

```ts
const [id] = useState(() => Number(params.id))
```

---

## 10. Schema de validacion Zod

### Archivo: `components/modules/shipments/ShipmentForm.tsx` (o `lib/validators/shipments.ts`)

```ts
import { z } from 'zod'

export const shipmentSchema = z.object({
  customer: z.number({ error: 'Selecciona un cliente' }),
  origin_warehouse: z.number({ error: 'Selecciona un almacen de origen' }),
  destination_address: z.string().min(1, 'La direccion de destino es requerida'),
  destination_city: z.string().min(1, 'La ciudad de destino es requerida'),
  destination_country: z.string().min(1, 'El pais de destino es requerido'),
  status: z.enum(
    ['PENDING', 'CONFIRMED', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED', 'RETURNED'],
    { error: 'Selecciona un estado valido' }
  ),
  estimated_delivery_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha invalido (YYYY-MM-DD)')
    .optional()
    .nullable(),
  driver: z.number().optional().nullable(),
  transport: z.number().optional().nullable(),
  route: z.number().optional().nullable(),
  notes: z.string().optional(),
})

export type ShipmentFormValues = z.infer<typeof shipmentSchema>
```

### Schema para ItemForm

```ts
export const shipmentItemSchema = z.object({
  product: z.number({ error: 'Selecciona un producto' }),
  quantity: z
    .number({ error: 'La cantidad es requerida' })
    .int('Debe ser un numero entero')
    .min(1, 'La cantidad minima es 1'),
  unit_price_at_time: z
    .number({ error: 'El precio unitario es requerido' })
    .positive('El precio debe ser mayor a 0'),
})

export type ShipmentItemFormValues = z.infer<typeof shipmentItemSchema>
```

**Notas sobre inputs numericos con Zod v4:**

- Usar `z.number()` (no `z.coerce.number()`)
- En los inputs HTML usar `type="number"` con `valueAsNumber: true` en `register`:
  ```tsx
  <Input type="number" {...register('quantity', { valueAsNumber: true })} />
  ```
- Para `unit_price_at_time` en ItemForm, el valor se envia como string al backend (`"decimal"`). Convertir en el `onSubmit` antes de llamar a la mutation:
  ```ts
  const submitData: ShipmentItemCreate = {
    ...values,
    unit_price_at_time: values.unit_price_at_time.toString(),
  }
  ```
- Para FK opcionales en ShipmentForm (driver, transport, route): el Select maneja un string especial `"__none__"` internamente. `defaultValues` del `useForm` usan `null` para campos no asignados. El schema acepta `null` via `.nullable()`.

---

## 11. Manejo de errores

- **Error 400 (validacion backend):** mostrar errores de campo inline usando `setError` de React Hook Form. Errores comunes esperados:
  - `tracking_number`: no aplica (auto-generado)
  - `customer`, `origin_warehouse`: FK no encontrado
  - items: "Un producto no puede repetirse en el mismo envio"
- **Error 401:** manejado automaticamente por el interceptor de axios (refresh + redirect a `/login`)
- **Error 404:** mostrar mensaje "Envio no encontrado" en pagina de detalle y editar
- **Error de red:** mostrar toast generico de error usando `sonner` o el sistema de toasts configurado en el proyecto

---

## 12. Criterios de aceptacion

- [x] La tabla muestra los envios del backend paginados (20 por pagina)
- [x] La busqueda por texto funciona (query param `search` busca en tracking_number, destination_address, destination_city)
- [x] El filtro por `status` funciona
- [x] El filtro por `destination_city` funciona
- [x] La columna `status` muestra Badge con colores correctos por estado
- [x] La columna `estimated_delivery_date` muestra fecha formateada o "—" si es null
- [x] La columna `calculated_cost` muestra el decimal formateado con 2 decimales
- [x] Se puede crear un nuevo envio exitosamente (POST → 201) desde `/shipments/new`
- [x] `tracking_number` NO se envia en POST (auto-generado por backend)
- [x] `weight_total_kg`, `base_cost`, `calculated_cost` NO se envian en POST/PATCH
- [x] Los selects de FK opcionales (driver, transport, route) permiten seleccionar "Sin asignar" y envian `null` al backend
- [x] Se puede editar un envio existente (PATCH → 200) desde `/shipments/[id]/edit`
- [x] La pagina de detalle `/shipments/[id]` muestra todos los campos del envio
- [x] La pagina de detalle muestra la seccion de items del envio
- [x] Se puede agregar un item a un envio (POST `/shipments/{id}/items/` → 201)
- [x] El backend valida que un producto no se repita en el mismo envio — el error se muestra en el formulario
- [x] Se puede eliminar un item con confirmacion (DELETE `/shipments/{id}/items/{itemId}/` → 204)
- [x] Tras agregar/eliminar item, `weight_total_kg` y `calculated_cost` del envio se actualizan (se invalida query del shipment)
- [x] Tras crear/editar envio, la lista se actualiza automaticamente (invalidacion de ['shipments'])
- [x] Los errores de validacion del backend se muestran en el formulario
- [x] Estado `isPending` se muestra mientras carga la lista
- [x] Estado `isPending` se muestra mientras se procesa el formulario o la mutation de items
- [x] Sin token → redirige a /login (manejado por middleware)
- [x] Navegar a `/shipments/[id]` con id inexistente muestra "Envio no encontrado"
