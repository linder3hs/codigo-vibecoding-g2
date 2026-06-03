"use client"

import { useForm } from "react-hook-form"
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
import { Switch } from "@/components/ui/switch"
import { useCreateAdminUser, useUpdateAdminUser } from "@/lib/hooks/use-admin-users"
import {
  adminUserCreateSchema,
  adminUserEditSchema,
  type AdminUserCreateValues,
  type AdminUserEditValues,
} from "@/lib/validators/admin"
import type { AdminUser } from "@/types/admin"
import type { ApiError } from "@/types/common"

interface UserFormProps {
  user?: AdminUser
  onSuccess: () => void
  onCancel: () => void
}

export function UserForm({ user, onSuccess, onCancel }: UserFormProps) {
  const createMutation = useCreateAdminUser()
  const updateMutation = useUpdateAdminUser()
  const isPending = createMutation.isPending || updateMutation.isPending

  const form = useForm<AdminUserCreateValues | AdminUserEditValues>({
    resolver: zodResolver(user ? adminUserEditSchema : adminUserCreateSchema),
    defaultValues: user
      ? {
          username: user.username,
          email: user.email,
          password: "",
          first_name: user.first_name,
          last_name: user.last_name,
          is_active: user.is_active,
          is_superuser: user.is_superuser,
          is_staff: user.is_staff,
        }
      : {
          username: "",
          email: "",
          password: "",
          first_name: "",
          last_name: "",
          is_active: true,
          is_superuser: false,
          is_staff: false,
        },
  })

  function handleBackendErrors(error: unknown) {
    if (axios.isAxiosError(error) && error.response?.status === 400) {
      const data = error.response.data as ApiError
      for (const key of Object.keys(data)) {
        if (key === "non_field_errors") continue
        const msg = data[key]
        form.setError(key as keyof AdminUserCreateValues, {
          message: Array.isArray(msg) ? msg[0] : (msg as string),
        })
      }
    }
  }

  function onSubmit(values: AdminUserCreateValues | AdminUserEditValues) {
    const payload = { ...values }
    if (user && !payload.password) {
      delete payload.password
    }

    if (user) {
      updateMutation.mutate(
        { id: user.id, data: payload },
        { onSuccess, onError: handleBackendErrors }
      )
    } else {
      createMutation.mutate(payload as AdminUserCreateValues, {
        onSuccess,
        onError: handleBackendErrors,
      })
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Usuario</FormLabel>
                <FormControl>
                  <Input placeholder="nombre_usuario" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="usuario@ejemplo.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{user ? "Nueva contraseña (opcional)" : "Contraseña"}</FormLabel>
              <FormControl>
                <Input type="password" placeholder="••••••••" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="first_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre</FormLabel>
                <FormControl>
                  <Input placeholder="Juan" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="last_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Apellido</FormLabel>
                <FormControl>
                  <Input placeholder="García" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-3 pt-2">
          <FormField
            control={form.control}
            name="is_active"
            render={({ field }) => (
              <FormItem className="flex items-center justify-between rounded-lg border px-3 py-2.5">
                <FormLabel className="cursor-pointer text-sm">Activo</FormLabel>
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="is_staff"
            render={({ field }) => (
              <FormItem className="flex items-center justify-between rounded-lg border px-3 py-2.5">
                <FormLabel className="cursor-pointer text-sm">Staff</FormLabel>
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="is_superuser"
            render={({ field }) => (
              <FormItem className="flex items-center justify-between rounded-lg border px-3 py-2.5">
                <FormLabel className="cursor-pointer text-sm">Superadmin</FormLabel>
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
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
                {user ? "Guardando..." : "Creando..."}
              </span>
            ) : user ? (
              "Guardar cambios"
            ) : (
              "Crear usuario"
            )}
          </Button>
        </div>
      </form>
    </Form>
  )
}
