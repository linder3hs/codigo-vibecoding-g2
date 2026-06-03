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
import { DatePicker } from "@/components/ui/date-picker"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { useCreateDriver, useUpdateDriver } from "@/lib/hooks/use-drivers"
import { useTransportList } from "@/lib/hooks/use-transport"
import type { Driver, DriverCreate } from "@/types/driver"
import type { ApiError } from "@/types/common"

const driverSchema = z.object({
  user: z.number({ error: "El ID del usuario es requerido" }).int().positive(),
  license_number: z.string().min(1, { error: "El número de licencia es requerido" }),
  license_expiry: z
    .string()
    .min(1, { error: "La fecha de vencimiento es requerida" })
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Formato requerido: YYYY-MM-DD"),
  phone: z.string().min(1, { error: "El teléfono es requerido" }),
  transport: z.number().int().positive().nullable().optional(),
  is_active: z.boolean(),
})

type DriverFormValues = z.infer<typeof driverSchema>

interface DriverFormProps {
  driver?: Driver
  onSuccess: () => void
  onCancel: () => void
}

export function DriverForm({ driver, onSuccess, onCancel }: DriverFormProps) {
  const createMutation = useCreateDriver()
  const updateMutation = useUpdateDriver()
  const { data: transportData, isPending: loadingTransport } = useTransportList({ page: 1 })

  const isPending = createMutation.isPending || updateMutation.isPending

  const form = useForm<DriverFormValues>({
    resolver: zodResolver(driverSchema),
    defaultValues: driver
      ? {
          user: driver.user,
          license_number: driver.license_number,
          license_expiry: driver.license_expiry,
          phone: driver.phone,
          transport: driver.transport,
          is_active: driver.is_active,
        }
      : {
          user: 0,
          license_number: "",
          license_expiry: "",
          phone: "",
          transport: null,
          is_active: true,
        },
  })

  function handleBackendErrors(error: unknown) {
    if (axios.isAxiosError(error) && error.response?.status === 400) {
      const data = error.response.data as ApiError
      for (const key of Object.keys(data)) {
        if (key === "non_field_errors") continue
        const msg = data[key]
        if (msg) {
          form.setError(key as keyof DriverFormValues, {
            message: Array.isArray(msg) ? msg[0] : (msg as string),
          })
        }
      }
    }
  }

  function onSubmit(values: DriverFormValues) {
    if (driver) {
      const { user: _user, ...updateData } = values
      updateMutation.mutate(
        { id: driver.id, data: updateData as Partial<DriverCreate> },
        { onSuccess, onError: handleBackendErrors }
      )
    } else {
      const payload: DriverCreate = {
        user: values.user,
        license_number: values.license_number,
        license_expiry: values.license_expiry,
        phone: values.phone,
        transport: values.transport ?? null,
        is_active: values.is_active,
      }
      createMutation.mutate(payload, { onSuccess, onError: handleBackendErrors })
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* Campo user — solo editable en crear, readonly en editar */}
        {driver ? (
          <div className="space-y-1">
            <p className="text-sm font-medium">Usuario</p>
            <p className="text-sm text-muted-foreground border rounded-md px-3 py-2 bg-muted">
              {driver.user_full_name} ({driver.user_username})
            </p>
          </div>
        ) : (
          <FormField
            control={form.control}
            name="user"
            render={() => (
              <FormItem>
                <FormLabel>ID de usuario</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="Ej: 3"
                    {...form.register("user", { valueAsNumber: true })}
                  />
                </FormControl>
                <p className="text-xs text-muted-foreground">
                  El usuario debe existir previamente en Django Admin. Ingresa el ID numérico.
                </p>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="license_number"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Número de licencia</FormLabel>
                <FormControl>
                  <Input placeholder="Ej: LIC-001234" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="license_expiry"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Vencimiento de licencia</FormLabel>
                <FormControl>
                  <DatePicker
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Seleccionar fecha"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Teléfono</FormLabel>
              <FormControl>
                <Input placeholder="Ej: +57 310 000 0000" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormItem>
          <FormLabel>Transporte asignado (opcional)</FormLabel>
          <Controller
            control={form.control}
            name="transport"
            render={({ field, fieldState }) => {
              const selectedTransport = transportData?.results.find(t => String(t.id) === String(field.value))
              return (
              <>
                <Select
                  value={field.value !== null && field.value !== undefined ? String(field.value) : ""}
                  onValueChange={(val: string | null) =>
                    field.onChange(!val || val === "" ? null : Number(val))
                  }
                  disabled={loadingTransport}
                >
                  <SelectTrigger className="w-full">
                    <span className={cn("flex flex-1 text-left text-sm", !selectedTransport && "text-muted-foreground")}>
                      {selectedTransport
                        ? `${selectedTransport.plate_number} — ${selectedTransport.brand} ${selectedTransport.model}`
                        : (loadingTransport ? "Cargando..." : "Sin asignar")}
                    </span>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Sin asignar</SelectItem>
                    {transportData?.results.map((t) => (
                      <SelectItem key={t.id} value={String(t.id)}>
                        {t.plate_number} — {t.brand} {t.model}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {fieldState.error && (
                  <p className="text-destructive text-sm font-medium">{fieldState.error.message}</p>
                )}
              </>
            )}}
          />
        </FormItem>

        <FormItem>
          <FormLabel>Estado</FormLabel>
          <div className="flex items-center gap-2 h-10">
            <input
              type="checkbox"
              id="is_active"
              className="h-4 w-4 rounded border-gray-300 accent-primary cursor-pointer"
              {...form.register("is_active")}
              defaultChecked={form.getValues("is_active")}
            />
            <label htmlFor="is_active" className="text-sm cursor-pointer select-none">
              Conductor activo
            </label>
          </div>
          {form.formState.errors.is_active && (
            <p className="text-destructive text-sm font-medium">
              {form.formState.errors.is_active.message}
            </p>
          )}
        </FormItem>

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isPending}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                {driver ? "Guardando..." : "Creando..."}
              </span>
            ) : driver ? (
              "Guardar cambios"
            ) : (
              "Crear conductor"
            )}
          </Button>
        </div>
      </form>
    </Form>
  )
}
