import { z } from "zod"

export const supplierSchema = z.object({
  name: z.string().min(1, "El nombre es requerido").max(200, "Máximo 200 caracteres"),
  contact_name: z.string().min(1, "El nombre de contacto es requerido"),
  email: z.string().min(1, "El email es requerido").email("Email inválido"),
  phone: z.string().min(1, "El teléfono es requerido"),
  address: z.string().min(1, "La dirección es requerida"),
  city: z.string().min(1, "La ciudad es requerida"),
  country: z.string().min(1, "El país es requerido"),
  tax_id: z.string().optional(),
})

export type SupplierFormValues = z.infer<typeof supplierSchema>
