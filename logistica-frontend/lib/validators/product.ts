import { z } from "zod"

export const productSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  sku: z.string().min(1, "El SKU es requerido"),
  category: z.string().min(1, "La categoría es requerida"),
  supplier: z.coerce.number().int().positive("Selecciona un proveedor"),
  warehouse: z.coerce.number().int().positive("Selecciona un almacén"),
  weight_kg: z.coerce.number().positive("El peso debe ser mayor a 0"),
  width_cm: z.coerce.number().positive("El ancho debe ser mayor a 0"),
  height_cm: z.coerce.number().positive("El alto debe ser mayor a 0"),
  depth_cm: z.coerce.number().positive("La profundidad debe ser mayor a 0"),
  unit_price: z.coerce.number().positive("El precio debe ser mayor a 0"),
  stock_quantity: z.coerce.number().int().min(0, "El stock no puede ser negativo"),
  description: z.string().optional(),
})

export type ProductFormValues = z.infer<typeof productSchema>
