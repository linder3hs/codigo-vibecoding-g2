"use client"

import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import axios from "axios"
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { useCreateProduct, useUpdateProduct } from "@/lib/hooks/use-products"
import { useSupplierList } from "@/lib/hooks/use-suppliers"
import { useWarehouseList } from "@/lib/hooks/use-warehouses"
import type { Product, ProductCreate } from "@/types/product"
import type { ApiError } from "@/types/common"

const productSchema = z.object({
  name: z.string().min(1, { error: "El nombre es requerido" }),
  sku: z.string().min(1, { error: "El SKU es requerido" }),
  category: z.string().min(1, { error: "La categoría es requerida" }),
  supplier: z.string().min(1, { error: "Selecciona un proveedor" }),
  warehouse: z.string().min(1, { error: "Selecciona un almacén" }),
  weight_kg: z.number({ error: "El peso debe ser mayor a 0" }).positive("El peso debe ser mayor a 0"),
  width_cm: z.number({ error: "El ancho debe ser mayor a 0" }).positive("El ancho debe ser mayor a 0"),
  height_cm: z.number({ error: "El alto debe ser mayor a 0" }).positive("El alto debe ser mayor a 0"),
  depth_cm: z.number({ error: "La profundidad debe ser mayor a 0" }).positive("La profundidad debe ser mayor a 0"),
  unit_price: z.number({ error: "El precio debe ser mayor a 0" }).positive("El precio debe ser mayor a 0"),
  stock_quantity: z.number({ error: "El stock no puede ser negativo" }).int().min(0, "El stock no puede ser negativo"),
  description: z.string().optional(),
})

type ProductFormValues = z.infer<typeof productSchema>

interface ProductFormProps {
  product?: Product
  onSuccess: () => void
  onCancel: () => void
}

export function ProductForm({ product, onSuccess, onCancel }: ProductFormProps) {
  const createMutation = useCreateProduct()
  const updateMutation = useUpdateProduct()

  const { data: suppliersData, isPending: loadingSuppliers } = useSupplierList({ page: 1 })
  const { data: warehousesData, isPending: loadingWarehouses } = useWarehouseList({ page: 1 })

  const isPending = createMutation.isPending || updateMutation.isPending

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: product
      ? {
          name: product.name,
          sku: product.sku,
          category: product.category,
          supplier: String(product.supplier),
          warehouse: String(product.warehouse),
          weight_kg: parseFloat(product.weight_kg),
          width_cm: parseFloat(product.width_cm),
          height_cm: parseFloat(product.height_cm),
          depth_cm: parseFloat(product.depth_cm),
          unit_price: parseFloat(product.unit_price),
          stock_quantity: product.stock_quantity,
          description: product.description ?? "",
        }
      : {
          name: "",
          sku: "",
          category: "",
          supplier: "",
          warehouse: "",
          weight_kg: 0,
          width_cm: 0,
          height_cm: 0,
          depth_cm: 0,
          unit_price: 0,
          stock_quantity: 0,
          description: "",
        },
  })

  function handleBackendErrors(error: unknown) {
    if (axios.isAxiosError(error) && error.response?.status === 400) {
      const data = error.response.data as ApiError
      for (const key of Object.keys(data)) {
        if (key === "non_field_errors") continue
        const msg = data[key]
        if (msg) {
          form.setError(key as keyof ProductFormValues, {
            message: Array.isArray(msg) ? msg[0] : (msg as string),
          })
        }
      }
    }
  }

  function onSubmit(values: ProductFormValues) {
    const payload: ProductCreate = {
      name: values.name,
      sku: values.sku,
      category: values.category,
      supplier: Number(values.supplier),
      warehouse: Number(values.warehouse),
      weight_kg: values.weight_kg,
      width_cm: values.width_cm,
      height_cm: values.height_cm,
      depth_cm: values.depth_cm,
      unit_price: values.unit_price,
      stock_quantity: values.stock_quantity,
      description: values.description || undefined,
    }

    if (product) {
      updateMutation.mutate({ id: product.id, data: payload }, { onSuccess, onError: handleBackendErrors })
    } else {
      createMutation.mutate(payload, { onSuccess, onError: handleBackendErrors })
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* Fila 1: name | sku */}
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre</FormLabel>
                <FormControl>
                  <Input placeholder="Ej: Caja corrugada" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="sku"
            render={({ field }) => (
              <FormItem>
                <FormLabel>SKU</FormLabel>
                <FormControl>
                  <Input placeholder="Ej: PROD-001" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Fila 2: category | supplier */}
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Categoría</FormLabel>
                <FormControl>
                  <Input placeholder="Ej: Embalaje" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormItem>
            <FormLabel>Proveedor</FormLabel>
            <Controller
              control={form.control}
              name="supplier"
              render={({ field, fieldState }) => (
                <>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={loadingSuppliers}
                  >
                    <SelectTrigger className="w-full">
                      <span className={cn("flex flex-1 text-left text-sm", !suppliersData?.results.find(s => String(s.id) === field.value) && "text-muted-foreground")}>
                        {suppliersData?.results.find(s => String(s.id) === field.value)?.name ?? (loadingSuppliers ? "Cargando..." : "Seleccionar proveedor")}
                      </span>
                    </SelectTrigger>
                    <SelectContent>
                      {suppliersData?.results.map((s) => (
                        <SelectItem key={s.id} value={String(s.id)}>
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {fieldState.error && (
                    <p className="text-destructive text-sm font-medium">{fieldState.error.message}</p>
                  )}
                </>
              )}
            />
          </FormItem>
        </div>

        {/* Fila 3: warehouse | unit_price */}
        <div className="grid grid-cols-2 gap-4">
          <FormItem>
            <FormLabel>Almacén</FormLabel>
            <Controller
              control={form.control}
              name="warehouse"
              render={({ field, fieldState }) => (
                <>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={loadingWarehouses}
                  >
                    <SelectTrigger className="w-full">
                      <span className={cn("flex flex-1 text-left text-sm", !warehousesData?.results.find(w => String(w.id) === field.value) && "text-muted-foreground")}>
                        {warehousesData?.results.find(w => String(w.id) === field.value)?.name ?? (loadingWarehouses ? "Cargando..." : "Seleccionar almacén")}
                      </span>
                    </SelectTrigger>
                    <SelectContent>
                      {warehousesData?.results.map((w) => (
                        <SelectItem key={w.id} value={String(w.id)}>
                          {w.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {fieldState.error && (
                    <p className="text-destructive text-sm font-medium">{fieldState.error.message}</p>
                  )}
                </>
              )}
            />
          </FormItem>

          <FormField
            control={form.control}
            name="unit_price"
            render={() => (
              <FormItem>
                <FormLabel>Precio unitario</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="Ej: 9500.00"
                    {...form.register("unit_price", { valueAsNumber: true })}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Fila 4: stock_quantity | weight_kg */}
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="stock_quantity"
            render={() => (
              <FormItem>
                <FormLabel>Stock</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="Ej: 100"
                    {...form.register("stock_quantity", { valueAsNumber: true })}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="weight_kg"
            render={() => (
              <FormItem>
                <FormLabel>Peso (kg)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="Ej: 2.50"
                    {...form.register("weight_kg", { valueAsNumber: true })}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Fila 5: width_cm | height_cm | depth_cm */}
        <div className="grid grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="width_cm"
            render={() => (
              <FormItem>
                <FormLabel>Ancho (cm)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="Ej: 30.00"
                    {...form.register("width_cm", { valueAsNumber: true })}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="height_cm"
            render={() => (
              <FormItem>
                <FormLabel>Alto (cm)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="Ej: 20.00"
                    {...form.register("height_cm", { valueAsNumber: true })}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="depth_cm"
            render={() => (
              <FormItem>
                <FormLabel>Profundidad (cm)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="Ej: 15.00"
                    {...form.register("depth_cm", { valueAsNumber: true })}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* description */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descripción (opcional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Descripción del producto..."
                  rows={3}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isPending}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                {product ? "Guardando..." : "Creando..."}
              </span>
            ) : product ? (
              "Guardar cambios"
            ) : (
              "Crear producto"
            )}
          </Button>
        </div>
      </form>
    </Form>
  )
}
