"use client"

import { useForm, Controller } from "react-hook-form"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useCreateTransport, useUpdateTransport } from "@/lib/hooks/use-transport"
import { transportSchema, type TransportFormValues } from "@/lib/validators/transport"
import type { Transport, TransportCreate } from "@/types/transport"
import type { ApiError } from "@/types/common"

interface TransportFormProps {
  transport?: Transport
  onSuccess: () => void
  onCancel: () => void
}

export function TransportForm({ transport, onSuccess, onCancel }: TransportFormProps) {
  const createMutation = useCreateTransport()
  const updateMutation = useUpdateTransport()

  const isPending = createMutation.isPending || updateMutation.isPending

  const form = useForm<TransportFormValues>({
    resolver: zodResolver(transportSchema),
    defaultValues: transport
      ? {
          plate_number: transport.plate_number,
          transport_type: transport.transport_type,
          brand: transport.brand,
          model: transport.model,
          year: transport.year,
          capacity_kg: parseFloat(transport.capacity_kg),
          capacity_m3: parseFloat(transport.capacity_m3),
          is_available: transport.is_available,
        }
      : {
          plate_number: "",
          transport_type: "TRUCK",
          brand: "",
          model: "",
          year: new Date().getFullYear(),
          capacity_kg: 0,
          capacity_m3: 0,
          is_available: true,
        },
  })

  function handleBackendErrors(error: unknown) {
    if (axios.isAxiosError(error) && error.response?.status === 400) {
      const data = error.response.data as ApiError
      const fieldKeys = Object.keys(data)

      for (const key of fieldKeys) {
        if (key === "non_field_errors") continue
        const formKey = key as keyof TransportFormValues
        const msg = data[key]
        if (msg) {
          form.setError(formKey, {
            message: Array.isArray(msg) ? msg[0] : (msg as string),
          })
        }
      }
    }
  }

  function onSubmit(values: TransportFormValues) {
    const payload: TransportCreate = {
      plate_number: values.plate_number,
      transport_type: values.transport_type,
      brand: values.brand,
      model: values.model,
      year: values.year,
      capacity_kg: values.capacity_kg,
      capacity_m3: values.capacity_m3,
      is_available: values.is_available,
    }

    if (transport) {
      updateMutation.mutate(
        { id: transport.id, data: payload },
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
        {/* Fila 1: plate_number | transport_type */}
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="plate_number"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Placa</FormLabel>
                <FormControl>
                  <Input placeholder="Ej: ABC-123" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormItem>
            <FormLabel>Tipo de transporte</FormLabel>
            <Controller
              control={form.control}
              name="transport_type"
              render={({ field, fieldState }) => (
                <>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue
                        placeholder="Seleccionar tipo"
                        label={
                          {
                            TRUCK: "Camión",
                            VAN: "Van",
                            MOTORCYCLE: "Moto",
                            CARGO_BIKE: "Cargo Bike",
                          }[field.value as "TRUCK" | "VAN" | "MOTORCYCLE" | "CARGO_BIKE"]
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TRUCK">Camión</SelectItem>
                      <SelectItem value="VAN">Van</SelectItem>
                      <SelectItem value="MOTORCYCLE">Moto</SelectItem>
                      <SelectItem value="CARGO_BIKE">Cargo Bike</SelectItem>
                    </SelectContent>
                  </Select>
                  {fieldState.error && (
                    <p className="text-destructive text-sm font-medium">
                      {fieldState.error.message}
                    </p>
                  )}
                </>
              )}
            />
          </FormItem>
        </div>

        {/* Fila 2: brand | model */}
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="brand"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Marca</FormLabel>
                <FormControl>
                  <Input placeholder="Ej: Ford" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="model"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Modelo</FormLabel>
                <FormControl>
                  <Input placeholder="Ej: Transit" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Fila 3: year | is_available */}
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="year"
            render={() => (
              <FormItem>
                <FormLabel>Año</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="Ej: 2022"
                    {...form.register("year", { valueAsNumber: true })}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormItem>
            <FormLabel>Disponible</FormLabel>
            <div className="flex items-center gap-2 h-10">
              <input
                type="checkbox"
                id="is_available"
                className="h-4 w-4 rounded border-gray-300 accent-primary cursor-pointer"
                {...form.register("is_available")}
                defaultChecked={form.getValues("is_available")}
              />
              <label htmlFor="is_available" className="text-sm cursor-pointer select-none">
                El vehículo está disponible
              </label>
            </div>
            {form.formState.errors.is_available && (
              <p className="text-destructive text-sm font-medium">
                {form.formState.errors.is_available.message}
              </p>
            )}
          </FormItem>
        </div>

        {/* Fila 4: capacity_kg | capacity_m3 */}
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="capacity_kg"
            render={() => (
              <FormItem>
                <FormLabel>Capacidad (kg)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="Ej: 1500.00"
                    {...form.register("capacity_kg", { valueAsNumber: true })}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="capacity_m3"
            render={() => (
              <FormItem>
                <FormLabel>Capacidad (m³)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="Ej: 12.50"
                    {...form.register("capacity_m3", { valueAsNumber: true })}
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
                {transport ? "Guardando..." : "Creando..."}
              </span>
            ) : transport ? (
              "Guardar cambios"
            ) : (
              "Crear transporte"
            )}
          </Button>
        </div>
      </form>
    </Form>
  )
}
