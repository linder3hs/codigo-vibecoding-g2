# Spec — Products

**Módulo:** products
**Endpoint base:** /api/v1/products/
**Estado:** implementado — validado
**Fecha:** 2026-05-27

---

## 1. Tipos TypeScript

### Archivo: `types/product.ts`

#### Interface de lectura (GET response)

```ts
export interface Product {
  id: number
  name: string
  sku: string
  category: string
  supplier: number          // FK id
  warehouse: number         // FK id
  weight_kg: string         // decimal llega como string
  width_cm: string          // decimal llega como string
  height_cm: string         // decimal llega como string
  depth_cm: string          // decimal llega como string
  unit_price: string        // decimal llega como string
  stock_quantity: number    // entero
  description: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}
```

#### Interface de escritura (POST / PATCH body)

```ts
export interface ProductCreate {
  name: string
  sku: string
  category: string
  supplier: number          // FK id (int)
  warehouse: number         // FK id (int)
  weight_kg: number
  width_cm: number
  height_cm: number
  depth_cm: number
  unit_price: number
  stock_quantity: number
  description?: string
}
```

#### Interface de params (query string para filtros)

```ts
export interface ProductParams {
  page?: number
  search?: string
  ordering?: 'name' | '-name' | 'unit_price' | '-unit_price' | 'stock_quantity' | '-stock_quantity' | 'created_at' | '-created_at'
  supplier?: number
  warehouse?: number
  category?: string
  unit_price_gte?: number
  unit_price_lte?: number
  stock_quantity_gte?: number
  stock_quantity_lte?: number
}
```

---

## 2. API Client

### Archivo: `lib/api/products.ts`

Objeto `productsApi` con métodos:

- `list(params?: ProductParams): Promise<PaginatedResponse<Product>>`
  - GET `/api/v1/products/`
  - params se pasan como query string

- `get(id: number): Promise<Product>`
  - GET `/api/v1/products/{id}/`

- `create(data: ProductCreate): Promise<Product>`
  - POST `/api/v1/products/`

- `update(id: number, data: Partial<ProductCreate>): Promise<Product>`
  - PATCH `/api/v1/products/{id}/`

- `remove(id: number): Promise<void>`
  - DELETE `/api/v1/products/{id}/`

```ts
import axiosInstance from '@/lib/axios'
import type { PaginatedResponse } from '@/types/common'
import type { Product, ProductCreate, ProductParams } from '@/types/product'

export const productsApi = {
  list: (params?: ProductParams) =>
    axiosInstance.get<PaginatedResponse<Product>>('/products/', { params }).then(r => r.data),

  get: (id: number) =>
    axiosInstance.get<Product>(`/products/${id}/`).then(r => r.data),

  create: (data: ProductCreate) =>
    axiosInstance.post<Product>('/products/', data).then(r => r.data),

  update: (id: number, data: Partial<ProductCreate>) =>
    axiosInstance.patch<Product>(`/products/${id}/`, data).then(r => r.data),

  remove: (id: number) =>
    axiosInstance.delete(`/products/${id}/`).then(() => undefined),
}
```

---

## 3. TanStack Query Hooks

### Archivo: `lib/hooks/use-products.ts`

#### `useProductList(params?: ProductParams)`

```ts
queryKey: ['products', params]
queryFn: () => productsApi.list(params)
staleTime: 30_000
```

#### `useProduct(id: number)`

```ts
queryKey: ['products', id]
queryFn: () => productsApi.get(id)
enabled: !!id
staleTime: 30_000
```

#### `useCreateProduct()`

```ts
mutationFn: (data: ProductCreate) => productsApi.create(data)
onSuccess: invalidate ['products']
```

#### `useUpdateProduct()`

```ts
mutationFn: ({ id, data }: { id: number; data: Partial<ProductCreate> }) => productsApi.update(id, data)
onSuccess: invalidate ['products'] y ['products', id]
```

#### `useDeleteProduct()`

```ts
mutationFn: (id: number) => productsApi.remove(id)
onSuccess: invalidate ['products']
```

Implementación de referencia:

```ts
'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { productsApi } from '@/lib/api/products'
import type { ProductCreate, ProductParams } from '@/types/product'

export function useProductList(params?: ProductParams) {
  return useQuery({
    queryKey: ['products', params],
    queryFn: () => productsApi.list(params),
    staleTime: 30_000,
  })
}

export function useProduct(id: number) {
  return useQuery({
    queryKey: ['products', id],
    queryFn: () => productsApi.get(id),
    enabled: !!id,
    staleTime: 30_000,
  })
}

export function useCreateProduct() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: ProductCreate) => productsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
    },
  })
}

export function useUpdateProduct() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<ProductCreate> }) =>
      productsApi.update(id, data),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['products', id] })
    },
  })
}

export function useDeleteProduct() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => productsApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
    },
  })
}
```

---

## 4. Columnas TanStack Table

### Archivo: `lib/columns/products-columns.tsx`

Lista de `ColumnDef<Product>`:

```ts
import type { ColumnDef } from '@tanstack/react-table'
import type { Product } from '@/types/product'

// Las columnas de supplier y warehouse muestran el id porque el API retorna
// solo el FK id. Si se necesita el nombre, el endpoint tendría que expandirlo
// o se puede hacer lookup local contra la lista ya cargada en el formulario.
// Para la tabla de lista, se muestra el id como referencia (ver nota en sección 5).

[
  {
    accessorKey: 'name',
    header: 'Nombre',
  },
  {
    accessorKey: 'sku',
    header: 'SKU',
  },
  {
    accessorKey: 'category',
    header: 'Categoría',
  },
  {
    accessorKey: 'supplier',
    header: 'Proveedor',
    cell: ({ row }) => `#${row.original.supplier}`,
    // Nota: si se desea mostrar el nombre del proveedor, pasar un mapa
    // de id→name como prop adicional a ProductTable y renderizar desde allí.
  },
  {
    accessorKey: 'warehouse',
    header: 'Almacén',
    cell: ({ row }) => `#${row.original.warehouse}`,
  },
  {
    accessorKey: 'unit_price',
    header: 'Precio unitario',
    cell: ({ row }) => `$${parseFloat(row.original.unit_price).toLocaleString('es-CO')}`,
  },
  {
    accessorKey: 'stock_quantity',
    header: 'Stock',
  },
  {
    id: 'actions',
    header: 'Acciones',
    cell: ({ row }) => (
      // Botones Editar y Eliminar — se conectan desde ProductTable vía onEdit/onDelete
      <ActionsCell product={row.original} onEdit={onEdit} onDelete={onDelete} />
    ),
  },
]
```

**Nota sobre supplier/warehouse en tabla:** El API retorna estos campos como FK ids (numbers). La columna los mostrará como `#id`. Si en el futuro se requiere mostrar el nombre, la página de lista deberá cargar las listas de suppliers y warehouses con `useSupplierList` y `useWarehouseList` y pasarlas como prop de lookup al componente `ProductTable`. No añadir esta complejidad en la implementación inicial — mostrar id es suficiente para MVP.

---

## 5. Componentes

### 5.1 `ProductFilters`

**Archivo:** `components/modules/products/ProductFilters.tsx`

```ts
interface ProductFiltersProps {
  params: ProductParams
  onParamsChange: (params: ProductParams) => void
}
```

**Campos:**
- Search input (`search`): busca en `name`, `sku`, `category`, `description`
- Input texto (`category`): filtro por categoría exacta
- Select (`supplier`): lista de suppliers cargada con `useSupplierList()` — muestra `name`, envía `id`
- Select (`warehouse`): lista de warehouses cargada con `useWarehouseList()` — muestra `name`, envía `id`
- Input número (`unit_price_gte`): precio mínimo
- Input número (`unit_price_lte`): precio máximo
- Input número (`stock_quantity_gte`): stock mínimo
- Input número (`stock_quantity_lte`): stock máximo
- Select (`ordering`): opciones `name`, `-name`, `unit_price`, `-unit_price`, `stock_quantity`, `-stock_quantity`, `created_at`, `-created_at`

**Comportamiento:** cada cambio en un filtro llama `onParamsChange` reseteando `page: 1`.

**Importante:** los selects de supplier y warehouse dentro de `ProductFilters` usan `useSupplierList()` y `useWarehouseList()` importados de sus respectivos hooks de Fase 1. Se deben cargar sin paginación (pasar `{ page: 1 }` o sin params si el hook lo permite) para tener la lista completa. Si hay más de 20 proveedores/almacenes, considerar un combobox con búsqueda en lugar de select simple.

### 5.2 `ProductForm`

**Archivo:** `components/modules/products/ProductForm.tsx`

```ts
interface ProductFormProps {
  product?: Product          // undefined = modo crear, objeto = modo editar
  onSuccess: () => void
  onCancel: () => void
}
```

**Campos del formulario:**

| Campo | Tipo input | Validación Zod |
|-------|-----------|----------------|
| `name` | Input texto | `z.string().min(1, "Requerido")` |
| `sku` | Input texto | `z.string().min(1, "Requerido")` |
| `category` | Input texto | `z.string().min(1, "Requerido")` |
| `supplier` | Select (id) | `z.coerce.number().int().positive("Selecciona un proveedor")` |
| `warehouse` | Select (id) | `z.coerce.number().int().positive("Selecciona un almacén")` |
| `weight_kg` | Input número decimal | `z.coerce.number().positive("Debe ser positivo")` |
| `width_cm` | Input número decimal | `z.coerce.number().positive("Debe ser positivo")` |
| `height_cm` | Input número decimal | `z.coerce.number().positive("Debe ser positivo")` |
| `depth_cm` | Input número decimal | `z.coerce.number().positive("Debe ser positivo")` |
| `unit_price` | Input número decimal | `z.coerce.number().positive("Debe ser positivo")` |
| `stock_quantity` | Input número entero | `z.coerce.number().int().min(0, "No puede ser negativo")` |
| `description` | Textarea | `z.string().optional()` |

**Modo editar:** pre-cargar con `defaultValues` del `useForm`. Los campos decimales (`weight_kg`, `unit_price`, etc.) llegan como `string` del API — convertir con `parseFloat()` para el `defaultValue` numérico del formulario.

**Submits:**
- Crear: `useCreateProduct()` → POST → `onSuccess()`
- Editar: `useUpdateProduct()` → PATCH → `onSuccess()`

**Selects de dependencias:** cargar `useSupplierList()` y `useWarehouseList()` dentro del componente para poblar los selects. Mostrar estado loading mientras cargan.

**Nota importante sobre `sku`:** el backend valida que sea único. Si el POST/PATCH retorna error 400 con campo `sku`, mostrar el error inline bajo el campo con `setError('sku', { message: error })`.

### 5.3 `DeleteProductDialog`

**Archivo:** `components/modules/products/DeleteProductDialog.tsx`

```ts
interface DeleteProductDialogProps {
  product: Product
  open: boolean
  onOpenChange: (open: boolean) => void
}
```

Usa `AlertDialog` de shadcn. Muestra nombre y SKU del producto para confirmación. Llama a `useDeleteProduct()` al confirmar. Invalida la lista automáticamente vía el hook.

### 5.4 `ProductTable`

**Archivo:** `components/modules/products/ProductTable.tsx`

```ts
interface ProductTableProps {
  data: PaginatedResponse<Product> | undefined
  isLoading: boolean
  pagination: PaginationState
  onPaginationChange: OnChangeFn<PaginationState>
  onEdit: (product: Product) => void
  onDelete: (product: Product) => void
}
```

Usa `useReactTable` con:
- `getCoreRowModel()`
- `manualPagination: true`
- `pageCount` calculado: `Math.ceil((data?.count ?? 0) / 20)`
- Columnas importadas de `lib/columns/products-columns.tsx`

---

## 6. Página

Como este módulo tiene 13 campos, se usa **página separada** en lugar de modal.

### 6.1 Página de lista

**Archivo:** `app/(dashboard)/products/page.tsx`
**Tipo:** Client Component (`"use client"`)

**Estado interno:**

```ts
const [params, setParams] = useState<ProductParams>({ page: 1 })
const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 20 })
const [deleting, setDeleting] = useState<Product | undefined>()
```

**Estructura JSX:**

```tsx
<PageHeader
  title="Productos"
  action={
    <Button onClick={() => router.push('/products/new')}>
      Nuevo producto
    </Button>
  }
/>
<ProductFilters params={params} onParamsChange={(p) => { setParams(p); setPagination(prev => ({ ...prev, pageIndex: 0 })) }} />
<ProductTable
  data={data}
  isLoading={isPending}
  pagination={pagination}
  onPaginationChange={setPagination}
  onEdit={(product) => router.push(`/products/${product.id}/edit`)}
  onDelete={(product) => setDeleting(product)}
/>
<DeleteProductDialog
  product={deleting!}
  open={!!deleting}
  onOpenChange={(open) => !open && setDeleting(undefined)}
/>
```

**Sincronización pagination ↔ params:** cuando `pagination.pageIndex` cambia, actualizar `params.page = pagination.pageIndex + 1`.

### 6.2 Página de creación

**Archivo:** `app/(dashboard)/products/new/page.tsx`
**Tipo:** Client Component (`"use client"`)

Renderiza `ProductForm` sin `product` prop. Al `onSuccess`, navegar con `router.push('/products')`. Al `onCancel`, `router.back()`.

### 6.3 Página de edición

**Archivo:** `app/(dashboard)/products/[id]/edit/page.tsx`
**Tipo:** Client Component (`"use client"`)

Usa `useProduct(id)` para cargar el producto. Mientras carga: skeleton o spinner. Renderiza `ProductForm` con `product={data}`. Al `onSuccess`, navegar con `router.push('/products')`. Al `onCancel`, `router.back()`.

El `id` se obtiene de `useParams()` — convertir a número con `Number(params.id)`.

---

## 7. Schema de validación Zod

```ts
// En components/modules/products/ProductForm.tsx
import { z } from 'zod'

const productSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  sku: z.string().min(1, "El SKU es requerido"),
  category: z.string().min(1, "La categoría es requerida"),
  supplier: z.coerce.number().int().positive("Selecciona un proveedor"),
  warehouse: z.coerce.number().int().positive("Selecciona un almacén"),
  weight_kg: z.coerce.number().positive("El peso debe ser mayor a 0"),
  width_cm: z.coerce.number().positive("El ancho debe ser mayor a 0"),
  height_cm: z.coerce.number().positive("El alto debe ser mayor a 0"),
  depth_cm: z.coerce.number().positive("La profundidad debe ser mayor a 0"),
  unit_price: z.coerce.number().positive("El precio debe ser mayor a 0"),
  stock_quantity: z.coerce.number().int().min(0, "El stock no puede ser negativo"),
  description: z.string().optional(),
})

type ProductFormValues = z.infer<typeof productSchema>
```

**Validaciones campo por campo:**

| Campo | Regla |
|-------|-------|
| `name` | `z.string().min(1)` — requerido |
| `sku` | `z.string().min(1)` — requerido, único en backend |
| `category` | `z.string().min(1)` — requerido |
| `supplier` | `z.coerce.number().int().positive()` — debe seleccionarse |
| `warehouse` | `z.coerce.number().int().positive()` — debe seleccionarse |
| `weight_kg` | `z.coerce.number().positive()` — decimal, mayor a 0 |
| `width_cm` | `z.coerce.number().positive()` — decimal, mayor a 0 |
| `height_cm` | `z.coerce.number().positive()` — decimal, mayor a 0 |
| `depth_cm` | `z.coerce.number().positive()` — decimal, mayor a 0 |
| `unit_price` | `z.coerce.number().positive()` — decimal, mayor a 0 |
| `stock_quantity` | `z.coerce.number().int().min(0)` — entero, puede ser 0 |
| `description` | `z.string().optional()` — campo libre, no requerido |

**Nota sobre `z.coerce.number()`:** se usa para inputs HTML que siempre retornan string, forzando conversión a número antes de validar. Es la práctica estándar con React Hook Form + Zod para inputs numéricos.

---

## 8. Manejo de errores

- **Error 400 (validación backend):** el backend puede retornar errores por campo (ej: `{ "sku": ["Ya existe un producto con este SKU."] }`). Iterar sobre los campos del error y llamar `setError(campo, { message: mensajes.join(', ') })` de React Hook Form para mostrar el error inline bajo el campo correspondiente.
- **Error 401:** manejado automáticamente por el interceptor de axios en `lib/axios.ts` (refresh + redirect a `/login`).
- **Error 404 (página de edición):** si `useProduct(id)` retorna error 404, mostrar mensaje "Producto no encontrado" con botón para volver a la lista.
- **Error de red / 500:** mostrar toast de error genérico ("Error al procesar la solicitud. Intente nuevamente.") usando el componente `Toaster` de shadcn.
- **Loading de selects:** mientras cargan las listas de suppliers/warehouses en el formulario, deshabilitar los selects y mostrar "Cargando..." como opción placeholder.

---

## 9. Criterios de aceptación

- [x] La tabla muestra los productos del backend paginados correctamente (20 por página)
- [x] La búsqueda por texto funciona (`search` en `name`, `sku`, `category`, `description`)
- [x] El filtro por categoría funciona
- [x] El filtro por proveedor (supplier id) funciona
- [x] El filtro por almacén (warehouse id) funciona
- [x] Los filtros de rango de precio (`unit_price_gte`, `unit_price_lte`) funcionan
- [x] Los filtros de rango de stock (`stock_quantity_gte`, `stock_quantity_lte`) funcionan
- [x] El botón "Nuevo producto" navega a `/products/new`
- [x] Se puede crear un nuevo producto exitosamente (POST → 201)
- [x] Se puede editar un producto existente desde `/products/[id]/edit` (PATCH → 200)
- [x] Al editar, el formulario pre-carga los valores del producto correctamente
- [x] Los selects de supplier y warehouse muestran los nombres y envían los ids correctos
- [x] Se puede eliminar un producto con confirmación (DELETE → 204)
- [x] Tras crear/editar/eliminar, la lista se actualiza automáticamente
- [x] Error de SKU duplicado se muestra inline bajo el campo SKU
- [x] Otros errores de validación del backend (400) se muestran en el formulario
- [x] El estado loading se muestra mientras carga la lista
- [x] El estado loading se muestra mientras se guardan cambios en el formulario
- [x] Sin token → redirige a `/login` (manejado por middleware)
- [x] La página de edición muestra "Producto no encontrado" si el id no existe
