"use client"

import { useForm } from "react-hook-form"
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
import { useCreateRouteStop, useUpdateRouteStop } from "@/lib/hooks/use-routes"
import type { RouteStop, RouteStopCreate } from "@/types/route"
import type { ApiError } from "@/types/common"

const stopSchema = z.object({
  stop_order: z.number({ error: "Requerido" }).int({ error: "Debe ser entero" }).min(1, { error: "Mínimo 1" }),
  address: z.string().min(1, { error: "Requerido" }),
  city: z.string().min(1, { error: "Requerido" }),
  estimated_offset_hours: z.number({ error: "Requerido" }).min(0, { error: "Debe ser >= 0" }),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
})

type StopFormValues = z.infer<typeof stopSchema>

interface StopFormProps {
  routeId: number
  stop?: RouteStop
  onSuccess: () => void
  onCancel: () => void
}

export function StopForm({ routeId, stop, onSuccess, onCancel }: StopFormProps) {
  const createMutation = useCreateRouteStop(routeId)
  const updateMutation = useUpdateRouteStop(routeId)

  const isPending = createMutation.isPending || updateMutation.isPending

  const form = useForm<StopFormValues>({
    resolver: zodResolver(stopSchema),
    defaultValues: stop
      ? {
          stop_order: stop.stop_order,
          address: stop.address,
          city: stop.city,
          estimated_offset_hours: parseFloat(stop.estimated_offset_hours),
          latitude: stop.latitude ? parseFloat(stop.latitude) : undefined,
          longitude: stop.longitude ? parseFloat(stop.longitude) : undefined,
        }
      : {
          stop_order: 1,
          address: "",
          city: "",
          estimated_offset_hours: 0,
          latitude: undefined,
          longitude: undefined,
        },
  })

  function handleBackendErrors(error: unknown) {
    if (axios.isAxiosError(error) && error.response?.status === 400) {
      const data = error.response.data as ApiError
      for (const key of Object.keys(data)) {
        if (key === "non_field_errors") continue
        const msg = data[key]
        if (msg) {
          form.setError(key as keyof StopFormValues, {
            message: Array.isArray(msg) ? msg[0] : (msg as string),
          })
        }
      }
    }
  }

  function onSubmit(values: StopFormValues) {
    const payload: RouteStopCreate = {
      stop_order: values.stop_order,
      address: values.address,
      city: values.city,
      estimated_offset_hours: values.estimated_offset_hours,
      latitude: values.latitude !== undefined && !isNaN(values.latitude) ? values.latitude : undefined,
      longitude: values.longitude !== undefined && !isNaN(values.longitude) ? values.longitude : undefined,
    }

    if (stop) {
      updateMutation.mutate({ stopId: stop.id, data: payload }, { onSuccess, onError: handleBackendErrors })
    } else {
      createMutation.mutate(payload, { onSuccess, onError: handleBackendErrors })
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="stop_order"
            render={() => (
              <FormItem>
                <FormLabel>Orden</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="Ej: 1"
                    {...form.register("stop_order", { valueAsNumber: true })}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="estimated_offset_hours"
            render={() => (
              <FormItem>
                <FormLabel>Horas desde origen</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="Ej: 2.50"
                    {...form.register("estimated_offset_hours", { valueAsNumber: true })}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Dirección</FormLabel>
              <FormControl>
                <Input placeholder="Ej: Calle 10 # 20-30" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="city"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Ciudad</FormLabel>
              <FormControl>
                <Input placeholder="Ej: Medellín" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="latitude"
            render={() => (
              <FormItem>
                <FormLabel>Latitud (opcional)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="any"
                    placeholder="Ej: 6.2442"
                    {...form.register("latitude", { valueAsNumber: true })}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="longitude"
            render={() => (
              <FormItem>
                <FormLabel>Longitud (opcional)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="any"
                    placeholder="Ej: -75.5812"
                    {...form.register("longitude", { valueAsNumber: true })}
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
                {stop ? "Guardando..." : "Agregar"}
              </span>
            ) : stop ? (
              "Guardar cambios"
            ) : (
              "Agregar parada"
            )}
          </Button>
        </div>
      </form>
    </Form>
  )
}
