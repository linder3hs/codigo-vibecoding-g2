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
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { useCreateRoute, useUpdateRoute } from "@/lib/hooks/use-routes"
import { useWarehouseList } from "@/lib/hooks/use-warehouses"
import type { Route, RouteCreate } from "@/types/route"
import type { ApiError } from "@/types/common"

const routeSchema = z.object({
  name: z.string().min(1, { error: "El nombre es requerido" }),
  origin_warehouse: z.string().min(1, { error: "Selecciona un almacén" }),
  estimated_duration_hours: z.number({ error: "Requerido" }).positive({ error: "Debe ser mayor a 0" }),
  estimated_distance_km: z.number({ error: "Requerido" }).positive({ error: "Debe ser mayor a 0" }),
})

type RouteFormValues = z.infer<typeof routeSchema>

interface RouteFormProps {
  route?: Route
  onSuccess: () => void
  onCancel: () => void
}

export function RouteForm({ route, onSuccess, onCancel }: RouteFormProps) {
  const createMutation = useCreateRoute()
  const updateMutation = useUpdateRoute()
  const { data: warehousesData, isPending: loadingWarehouses } = useWarehouseList({ page: 1 })

  const isPending = createMutation.isPending || updateMutation.isPending

  const form = useForm<RouteFormValues>({
    resolver: zodResolver(routeSchema),
    defaultValues: route
      ? {
          name: route.name,
          origin_warehouse: String(route.origin_warehouse),
          estimated_duration_hours: parseFloat(route.estimated_duration_hours),
          estimated_distance_km: parseFloat(route.estimated_distance_km),
        }
      : {
          name: "",
          origin_warehouse: "",
          estimated_duration_hours: 0,
          estimated_distance_km: 0,
        },
  })

  function handleBackendErrors(error: unknown) {
    if (axios.isAxiosError(error) && error.response?.status === 400) {
      const data = error.response.data as ApiError
      for (const key of Object.keys(data)) {
        if (key === "non_field_errors") continue
        const msg = data[key]
        if (msg) {
          form.setError(key as keyof RouteFormValues, {
            message: Array.isArray(msg) ? msg[0] : (msg as string),
          })
        }
      }
    }
  }

  function onSubmit(values: RouteFormValues) {
    const payload: RouteCreate = {
      name: values.name,
      origin_warehouse: Number(values.origin_warehouse),
      estimated_duration_hours: values.estimated_duration_hours,
      estimated_distance_km: values.estimated_distance_km,
    }

    if (route) {
      updateMutation.mutate({ id: route.id, data: payload }, { onSuccess, onError: handleBackendErrors })
    } else {
      createMutation.mutate(payload, { onSuccess, onError: handleBackendErrors })
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
              <FormLabel>Nombre</FormLabel>
              <FormControl>
                <Input placeholder="Ej: Ruta Bogotá - Medellín" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormItem>
          <FormLabel>Almacén origen</FormLabel>
          <Controller
            control={form.control}
            name="origin_warehouse"
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

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="estimated_distance_km"
            render={() => (
              <FormItem>
                <FormLabel>Distancia (km)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="Ej: 450.00"
                    {...form.register("estimated_distance_km", { valueAsNumber: true })}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="estimated_duration_hours"
            render={() => (
              <FormItem>
                <FormLabel>Duración estimada (horas)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="Ej: 8.50"
                    {...form.register("estimated_duration_hours", { valueAsNumber: true })}
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
                {route ? "Guardando..." : "Creando..."}
              </span>
            ) : route ? (
              "Guardar cambios"
            ) : (
              "Crear ruta"
            )}
          </Button>
        </div>
      </form>
    </Form>
  )
}
