import { z } from "zod"

export const warehouseSchema = z.object({
  name: z
    .string()
    .min(1, "El nombre es requerido")
    .max(200, "Máximo 200 caracteres"),
  address: z.string().min(1, "La dirección es requerida"),
  city: z.string().min(1, "La ciudad es requerida"),
  country: z.string().min(1, "El país es requerido"),
  capacity_m3: z
    .number({ error: "Debe ser un número" })
    .positive("La capacidad debe ser mayor a 0"),
  latitude: z
    .number({ error: "Debe ser un número" })
    .min(-90, "Latitud mínima: -90")
    .max(90, "Latitud máxima: 90")
    .optional()
    .nullable(),
  longitude: z
    .number({ error: "Debe ser un número" })
    .min(-180, "Longitud mínima: -180")
    .max(180, "Longitud máxima: 180")
    .optional()
    .nullable(),
})

export type WarehouseFormValues = z.infer<typeof warehouseSchema>
