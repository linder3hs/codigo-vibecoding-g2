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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useCreateShipmentItem } from "@/lib/hooks/use-shipments"
import { useProductList } from "@/lib/hooks/use-products"
import type { ShipmentItemCreate } from "@/types/shipment"
import type { ApiError } from "@/types/common"

const itemSchema = z.object({
  product: z.string().min(1, { error: "Selecciona un producto" }),
  quantity: z.number({ error: "La cantidad es requerida" }).int().min(1, "Mínimo 1"),
  unit_price_at_time: z.number({ error: "El precio unitario es requerido" }).positive("Debe ser mayor a 0"),
})

type ItemFormValues = z.infer<typeof itemSchema>

interface ItemFormProps {
  shipmentId: number
  onSuccess: () => void
  onCancel: () => void
}

export function ItemForm({ shipmentId, onSuccess, onCancel }: ItemFormProps) {
  const createMutation = useCreateShipmentItem()
  const { data: productsData, isPending: loadingProducts } = useProductList({ page: 1 })

  const form = useForm<ItemFormValues>({
    resolver: zodResolver(itemSchema),
    defaultValues: {
      product: "",
      quantity: 1,
      unit_price_at_time: 0,
    },
  })

  function handleBackendErrors(error: unknown) {
    if (axios.isAxiosError(error) && error.response?.status === 400) {
      const data = error.response.data as ApiError
      for (const key of Object.keys(data)) {
        if (key === "non_field_errors") {
          const errMsg = data[key] as string | string[] | undefined
          form.setError("product", { message: Array.isArray(errMsg) ? errMsg[0] : (errMsg ?? "") })
          continue
        }
        const msg = data[key]
        if (msg) {
          form.setError(key as keyof ItemFormValues, {
            message: Array.isArray(msg) ? msg[0] : (msg as string),
          })
        }
      }
    }
  }

  function onSubmit(values: ItemFormValues) {
    const payload: ShipmentItemCreate = {
      product: Number(values.product),
      quantity: values.quantity,
      unit_price_at_time: values.unit_price_at_time.toString(),
    }
    createMutation.mutate({ shipmentId, data: payload }, { onSuccess, onError: handleBackendErrors })
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormItem>
          <FormLabel>Producto</FormLabel>
          <Controller
            control={form.control}
            name="product"
            render={({ field, fieldState }) => (
              <>
                <Select value={field.value} onValueChange={field.onChange} disabled={loadingProducts}>
                  <SelectTrigger className="w-full">
                    <SelectValue
                      placeholder={loadingProducts ? "Cargando..." : "Seleccionar producto"}
                      label={(() => {
                        const found = productsData?.results.find(
                          (p) => String(p.id) === field.value
                        )
                        return found
                          ? `${found.name} — ${found.sku}`
                          : loadingProducts
                            ? "Cargando..."
                            : undefined
                      })()}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {productsData?.results.map((p) => (
                      <SelectItem key={p.id} value={String(p.id)}>
                        {p.name} — {p.sku}
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

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="quantity"
            render={() => (
              <FormItem>
                <FormLabel>Cantidad</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="Ej: 5"
                    {...form.register("quantity", { valueAsNumber: true })}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="unit_price_at_time"
            render={() => (
              <FormItem>
                <FormLabel>Precio unitario</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="Ej: 9500.00"
                    {...form.register("unit_price_at_time", { valueAsNumber: true })}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onCancel} disabled={createMutation.isPending}>
            Cancelar
          </Button>
          <Button type="submit" disabled={createMutation.isPending}>
            {createMutation.isPending ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Agregando...
              </span>
            ) : "Agregar ítem"}
          </Button>
        </div>
      </form>
    </Form>
  )
}
