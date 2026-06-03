import { z } from "zod"

export const transportSchema = z.object({
  plate_number: z.string().min(1, "La placa es requerida").max(20, "Máximo 20 caracteres"),
  transport_type: z.enum(['TRUCK', 'VAN', 'MOTORCYCLE', 'CARGO_BIKE'], {
    error: "El tipo de transporte es requerido",
  }),
  brand: z.string().min(1, "La marca es requerida"),
  model: z.string().min(1, "El modelo es requerido"),
  year: z.number({ error: "El año debe ser un número" }).int("El año debe ser un número entero").min(1990, "Año mínimo 1990").max(new Date().getFullYear() + 1, "Año inválido"),
  capacity_kg: z.number({ error: "La capacidad debe ser un número" }).positive("La capacidad debe ser mayor a 0"),
  capacity_m3: z.number({ error: "La capacidad debe ser un número" }).positive("La capacidad debe ser mayor a 0"),
  is_available: z.boolean(),
})

export type TransportFormValues = z.infer<typeof transportSchema>
