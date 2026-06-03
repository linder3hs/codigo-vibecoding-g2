"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
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
import { useCreateWarehouse, useUpdateWarehouse } from "@/lib/hooks/use-warehouses"
import { warehouseSchema, type WarehouseFormValues } from "@/lib/validators/warehouse"
import type { Warehouse, WarehouseCreate } from "@/types/warehouse"
import type { ApiError } from "@/types/common"

interface WarehouseFormProps {
  warehouse?: Warehouse
  onSuccess: () => void
  onCancel: () => void
}

export function WarehouseForm({ warehouse, onSuccess, onCancel }: WarehouseFormProps) {
  const createMutation = useCreateWarehouse()
  const updateMutation = useUpdateWarehouse()

  const isPending = createMutation.isPending || updateMutation.isPending

  const form = useForm<WarehouseFormValues, unknown, WarehouseFormValues>({
    resolver: zodResolver(warehouseSchema),
    defaultValues: warehouse
      ? {
          name: warehouse.name,
          address: warehouse.address,
          city: warehouse.city,
          country: warehouse.country,
          capacity_m3: parseFloat(warehouse.capacity_m3),
          latitude: warehouse.latitude ?? undefined,
          longitude: warehouse.longitude ?? undefined,
        }
      : {
          name: "",
          address: "",
          city: "",
          country: "Colombia",
          capacity_m3: undefined,
          latitude: undefined,
          longitude: undefined,
        },
  })

  function handleBackendErrors(error: unknown) {
    if (axios.isAxiosError(error) && error.response?.status === 400) {
      const data = error.response.data as ApiError
      const fieldKeys = Object.keys(data)

      for (const key of fieldKeys) {
        if (key === "non_field_errors") continue
        const formKey = key as keyof WarehouseFormValues
        const msg = data[key]
        if (msg) {
          form.setError(formKey, {
            message: Array.isArray(msg) ? msg[0] : (msg as string),
          })
        }
      }
    }
  }

  function onSubmit(values: WarehouseFormValues) {
    const payload: WarehouseCreate = {
      name: values.name,
      address: values.address,
      city: values.city,
      country: values.country,
      capacity_m3: values.capacity_m3,
      latitude: values.latitude ?? null,
      longitude: values.longitude ?? null,
    }

    if (warehouse) {
      updateMutation.mutate(
        { id: warehouse.id, data: payload },
        {
          onSuccess,
          onError: handleBackendErrors,
        }
      )
    } else {
      createMutation.mutate(payload, {
        onSuccess,
        onError: handleBackendErrors,
      })
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre del almacén</FormLabel>
              <FormControl>
                <Input placeholder="Ej: CEDI Bogotá" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Dirección</FormLabel>
              <FormControl>
                <Input placeholder="Ej: Zona Franca, Bodega 5" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="city"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Ciudad</FormLabel>
                <FormControl>
                  <Input placeholder="Ej: Bogotá" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="country"
            render={({ field }) => (
              <FormItem>
                <FormLabel>País</FormLabel>
                <FormControl>
                  <Input placeholder="Ej: Colombia" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="capacity_m3"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Capacidad (m³)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder="Ej: 5000"
                  value={field.value ?? ""}
                  onChange={(e) => field.onChange(e.target.valueAsNumber)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="latitude"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Latitud (opcional)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="any"
                    placeholder="Ej: 4.711"
                    value={field.value ?? ""}
                    onChange={(e) =>
                      field.onChange(
                        e.target.value === "" ? null : e.target.valueAsNumber
                      )
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="longitude"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Longitud (opcional)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="any"
                    placeholder="Ej: -74.0721"
                    value={field.value ?? ""}
                    onChange={(e) =>
                      field.onChange(
                        e.target.value === "" ? null : e.target.valueAsNumber
                      )
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isPending}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                {warehouse ? "Guardando..." : "Creando..."}
              </span>
            ) : warehouse ? (
              "Guardar cambios"
            ) : (
              "Crear almacén"
            )}
          </Button>
        </div>
      </form>
    </Form>
  )
}
