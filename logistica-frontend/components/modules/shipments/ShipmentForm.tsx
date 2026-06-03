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
import { DatePicker } from "@/components/ui/date-picker"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useCreateShipment, useUpdateShipment } from "@/lib/hooks/use-shipments"
import { useCustomerList } from "@/lib/hooks/use-customers"
import { useWarehouseList } from "@/lib/hooks/use-warehouses"
import { useDriverList } from "@/lib/hooks/use-drivers"
import { useTransportList } from "@/lib/hooks/use-transport"
import { useRouteList } from "@/lib/hooks/use-routes"
import { STATUS_LABELS } from "@/lib/columns/shipment-columns"
import { cn } from "@/lib/utils"
import type { Shipment, ShipmentCreate, ShipmentStatus } from "@/types/shipment"
import type { ApiError } from "@/types/common"

const ALL_STATUSES: ShipmentStatus[] = [
  "PENDING", "CONFIRMED", "IN_TRANSIT", "DELIVERED", "CANCELLED", "RETURNED",
]

const shipmentSchema = z.object({
  customer: z.string().min(1, { error: "Selecciona un cliente" }),
  origin_warehouse: z.string().min(1, { error: "Selecciona un almacén de origen" }),
  destination_address: z.string().min(1, { error: "La dirección de destino es requerida" }),
  destination_city: z.string().min(1, { error: "La ciudad de destino es requerida" }),
  destination_country: z.string().min(1, { error: "El país de destino es requerido" }),
  status: z.string().min(1, { error: "Selecciona un estado" }),
  estimated_delivery_date: z.string().optional(),
  driver: z.string().optional(),
  transport: z.string().optional(),
  route: z.string().optional(),
  notes: z.string().optional(),
})

type ShipmentFormValues = z.infer<typeof shipmentSchema>

interface ShipmentFormProps {
  shipment?: Shipment
  onSuccess: () => void
  onCancel: () => void
}

function toSelectValue(val: number | null | undefined): string {
  return val == null ? "__none__" : String(val)
}

function fromSelectValue(val: string | undefined): number | null {
  return !val || val === "__none__" ? null : Number(val)
}

/** Muestra el label resuelto o el placeholder cuando el select tiene datos async */
function ResolvedValue({ label, placeholder, loading }: { label?: string; placeholder: string; loading?: boolean }) {
  const text = label ?? (loading ? "Cargando..." : placeholder)
  return (
    <span className={cn("flex flex-1 text-left text-sm", !label && "text-muted-foreground")}>
      {text}
    </span>
  )
}

export function ShipmentForm({ shipment, onSuccess, onCancel }: ShipmentFormProps) {
  const createMutation = useCreateShipment()
  const updateMutation = useUpdateShipment()

  const { data: customersData, isPending: loadingCustomers } = useCustomerList({ page: 1 })
  const { data: warehousesData, isPending: loadingWarehouses } = useWarehouseList({ page: 1 })
  const { data: driversData, isPending: loadingDrivers } = useDriverList({ page: 1, is_active: true })
  const { data: transportData, isPending: loadingTransport } = useTransportList({ page: 1 })
  const { data: routesData, isPending: loadingRoutes } = useRouteList({ page: 1 })

  const isPending = createMutation.isPending || updateMutation.isPending

  const form = useForm<ShipmentFormValues>({
    resolver: zodResolver(shipmentSchema),
    defaultValues: shipment
      ? {
          customer: String(shipment.customer),
          origin_warehouse: String(shipment.origin_warehouse),
          destination_address: shipment.destination_address,
          destination_city: shipment.destination_city,
          destination_country: shipment.destination_country,
          status: shipment.status,
          estimated_delivery_date: shipment.estimated_delivery_date ?? "",
          driver: toSelectValue(shipment.driver),
          transport: toSelectValue(shipment.transport),
          route: toSelectValue(shipment.route),
          notes: shipment.notes ?? "",
        }
      : {
          customer: "",
          origin_warehouse: "",
          destination_address: "",
          destination_city: "",
          destination_country: "Colombia",
          status: "PENDING",
          estimated_delivery_date: "",
          driver: "__none__",
          transport: "__none__",
          route: "__none__",
          notes: "",
        },
  })

  function handleBackendErrors(error: unknown) {
    if (axios.isAxiosError(error) && error.response?.status === 400) {
      const data = error.response.data as ApiError
      for (const key of Object.keys(data)) {
        if (key === "non_field_errors") continue
        const msg = data[key]
        if (msg) {
          form.setError(key as keyof ShipmentFormValues, {
            message: Array.isArray(msg) ? msg[0] : (msg as string),
          })
        }
      }
    }
  }

  function onSubmit(values: ShipmentFormValues) {
    const payload: ShipmentCreate = {
      customer: Number(values.customer),
      origin_warehouse: Number(values.origin_warehouse),
      destination_address: values.destination_address,
      destination_city: values.destination_city,
      destination_country: values.destination_country,
      status: values.status as ShipmentStatus,
      estimated_delivery_date: values.estimated_delivery_date || null,
      driver: fromSelectValue(values.driver),
      transport: fromSelectValue(values.transport),
      route: fromSelectValue(values.route),
      notes: values.notes || undefined,
    }

    if (shipment) {
      updateMutation.mutate({ id: shipment.id, data: payload }, { onSuccess, onError: handleBackendErrors })
    } else {
      createMutation.mutate(payload, { onSuccess, onError: handleBackendErrors })
    }
  }

  const customerVal = form.watch("customer")
  const warehouseVal = form.watch("origin_warehouse")
  const statusVal = form.watch("status")
  const driverVal = form.watch("driver")
  const transportVal = form.watch("transport")
  const routeVal = form.watch("route")

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-w-3xl">

        {/* Fila 1: customer | status */}
        <div className="grid grid-cols-2 gap-4">
          <FormItem>
            <FormLabel>Cliente</FormLabel>
            <Controller
              control={form.control}
              name="customer"
              render={({ field, fieldState }) => (
                <>
                  <Select value={field.value} onValueChange={field.onChange} disabled={loadingCustomers}>
                    <SelectTrigger className="w-full">
                      <ResolvedValue
                        label={customersData?.results.find(c => String(c.id) === field.value)?.name}
                        placeholder="Seleccionar cliente"
                        loading={loadingCustomers}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {customersData?.results.map((c) => (
                        <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {fieldState.error && <p className="text-destructive text-sm font-medium">{fieldState.error.message}</p>}
                </>
              )}
            />
          </FormItem>

          <FormItem>
            <FormLabel>Estado</FormLabel>
            <Controller
              control={form.control}
              name="status"
              render={({ field, fieldState }) => (
                <>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full">
                      <ResolvedValue
                        label={STATUS_LABELS[field.value as ShipmentStatus]}
                        placeholder="Seleccionar estado"
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {ALL_STATUSES.map((s) => (
                        <SelectItem key={s} value={s}>{STATUS_LABELS[s]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {fieldState.error && <p className="text-destructive text-sm font-medium">{fieldState.error.message}</p>}
                </>
              )}
            />
          </FormItem>
        </div>

        {/* Fila 2: origin_warehouse | estimated_delivery_date */}
        <div className="grid grid-cols-2 gap-4">
          <FormItem>
            <FormLabel>Almacén origen</FormLabel>
            <Controller
              control={form.control}
              name="origin_warehouse"
              render={({ field, fieldState }) => (
                <>
                  <Select value={field.value} onValueChange={field.onChange} disabled={loadingWarehouses}>
                    <SelectTrigger className="w-full">
                      <ResolvedValue
                        label={warehousesData?.results.find(w => String(w.id) === field.value)?.name}
                        placeholder="Seleccionar almacén"
                        loading={loadingWarehouses}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {warehousesData?.results.map((w) => (
                        <SelectItem key={w.id} value={String(w.id)}>{w.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {fieldState.error && <p className="text-destructive text-sm font-medium">{fieldState.error.message}</p>}
                </>
              )}
            />
          </FormItem>

          <FormField
            control={form.control}
            name="estimated_delivery_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Fecha entrega estimada (opcional)</FormLabel>
                <FormControl>
                  <DatePicker
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Sin fecha estimada"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Dirección destino */}
        <FormField
          control={form.control}
          name="destination_address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Dirección destino</FormLabel>
              <FormControl>
                <Input placeholder="Ej: Calle 10 # 20-30" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="destination_city"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Ciudad destino</FormLabel>
                <FormControl>
                  <Input placeholder="Ej: Medellín" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="destination_country"
            render={({ field }) => (
              <FormItem>
                <FormLabel>País destino</FormLabel>
                <FormControl>
                  <Input placeholder="Ej: Colombia" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* FK opcionales: driver | transport | route */}
        <div className="grid grid-cols-3 gap-4">
          <FormItem>
            <FormLabel>Conductor (opcional)</FormLabel>
            <Controller
              control={form.control}
              name="driver"
              render={({ field }) => {
                const selected = driversData?.results.find(d => String(d.id) === field.value)
                return (
                  <Select value={field.value ?? "__none__"} onValueChange={field.onChange} disabled={loadingDrivers}>
                    <SelectTrigger className="w-full">
                      <ResolvedValue
                        label={selected?.user_full_name}
                        placeholder="Sin asignar"
                        loading={loadingDrivers}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">Sin asignar</SelectItem>
                      {driversData?.results.map((d) => (
                        <SelectItem key={d.id} value={String(d.id)}>{d.user_full_name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )
              }}
            />
          </FormItem>

          <FormItem>
            <FormLabel>Transporte (opcional)</FormLabel>
            <Controller
              control={form.control}
              name="transport"
              render={({ field }) => {
                const selected = transportData?.results.find(t => String(t.id) === field.value)
                return (
                  <Select value={field.value ?? "__none__"} onValueChange={field.onChange} disabled={loadingTransport}>
                    <SelectTrigger className="w-full">
                      <ResolvedValue
                        label={selected ? `${selected.plate_number} — ${selected.brand}` : undefined}
                        placeholder="Sin asignar"
                        loading={loadingTransport}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">Sin asignar</SelectItem>
                      {transportData?.results.map((t) => (
                        <SelectItem key={t.id} value={String(t.id)}>{t.plate_number} — {t.brand}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )
              }}
            />
          </FormItem>

          <FormItem>
            <FormLabel>Ruta (opcional)</FormLabel>
            <Controller
              control={form.control}
              name="route"
              render={({ field }) => {
                const selected = routesData?.results.find(r => String(r.id) === field.value)
                return (
                  <Select value={field.value ?? "__none__"} onValueChange={field.onChange} disabled={loadingRoutes}>
                    <SelectTrigger className="w-full">
                      <ResolvedValue
                        label={selected?.name}
                        placeholder="Sin asignar"
                        loading={loadingRoutes}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">Sin asignar</SelectItem>
                      {routesData?.results.map((r) => (
                        <SelectItem key={r.id} value={String(r.id)}>{r.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )
              }}
            />
          </FormItem>
        </div>

        {/* Notas */}
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notas (opcional)</FormLabel>
              <FormControl>
                <Textarea placeholder="Instrucciones especiales, observaciones..." rows={3} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Explicación de costos */}
        <div className="rounded-md border border-muted bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
          <p className="font-medium text-foreground mb-1">¿Cómo se calcula el costo?</p>
          <p>
            El <strong>costo calculado</strong> se obtiene sumando los subtotales de cada ítem:{" "}
            <code className="text-xs bg-muted px-1 py-0.5 rounded">Σ (cantidad × precio_unitario)</code>.
            El <strong>peso total</strong> suma el peso de cada producto × su cantidad.
            Estos valores se actualizan automáticamente al agregar o eliminar ítems desde la página de detalle.
          </p>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isPending}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                {shipment ? "Guardando..." : "Creando..."}
              </span>
            ) : shipment ? "Guardar cambios" : "Crear envío"}
          </Button>
        </div>
      </form>
    </Form>
  )
}
