import { z } from "zod"

export const adminUserCreateSchema = z.object({
  username: z.string().min(1, "El usuario es requerido").max(150),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  password: z.string().min(8, "Mínimo 8 caracteres"),
  first_name: z.string().max(150).optional().or(z.literal("")),
  last_name: z.string().max(150).optional().or(z.literal("")),
  is_active: z.boolean().optional(),
  is_superuser: z.boolean().optional(),
  is_staff: z.boolean().optional(),
})

export const adminUserEditSchema = adminUserCreateSchema.extend({
  password: z.string().min(8, "Mínimo 8 caracteres").optional().or(z.literal("")),
})

export const adminGroupSchema = z.object({
  name: z.string().min(1, "El nombre es requerido").max(150),
})

export type AdminUserCreateValues = z.infer<typeof adminUserCreateSchema>
export type AdminUserEditValues = z.infer<typeof adminUserEditSchema>
export type AdminGroupValues = z.infer<typeof adminGroupSchema>
