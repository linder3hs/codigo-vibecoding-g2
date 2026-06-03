import { z } from "zod"

export const customerSchema = z.object({
  name: z.string().min(1, "El nombre es requerido").max(200, "Máximo 200 caracteres"),
  customer_type: z.enum(['COMPANY', 'INDIVIDUAL'], {
    error: "El tipo de cliente es requerido",
  }),
  email: z.string().min(1, "El email es requerido").email("Email inválido"),
  phone: z.string().min(1, "El teléfono es requerido"),
  address: z.string().min(1, "La dirección es requerida"),
  city: z.string().min(1, "La ciudad es requerida"),
  country: z.string().min(1, "El país es requerido"),
  tax_id: z.string().optional(),
})

export type CustomerFormValues = z.infer<typeof customerSchema>
