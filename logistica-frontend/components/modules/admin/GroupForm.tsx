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
import { useCreateAdminGroup, useUpdateAdminGroup } from "@/lib/hooks/use-admin-groups"
import { adminGroupSchema, type AdminGroupValues } from "@/lib/validators/admin"
import type { AdminGroup } from "@/types/admin"
import type { ApiError } from "@/types/common"

interface GroupFormProps {
  group?: AdminGroup
  onSuccess: () => void
  onCancel: () => void
}

export function GroupForm({ group, onSuccess, onCancel }: GroupFormProps) {
  const createMutation = useCreateAdminGroup()
  const updateMutation = useUpdateAdminGroup()
  const isPending = createMutation.isPending || updateMutation.isPending

  const form = useForm<AdminGroupValues>({
    resolver: zodResolver(adminGroupSchema),
    defaultValues: { name: group?.name ?? "" },
  })

  function handleBackendErrors(error: unknown) {
    if (axios.isAxiosError(error) && error.response?.status === 400) {
      const data = error.response.data as ApiError
      for (const key of Object.keys(data)) {
        if (key === "non_field_errors") continue
        const msg = data[key]
        form.setError(key as keyof AdminGroupValues, {
          message: Array.isArray(msg) ? msg[0] : (msg as string),
        })
      }
    }
  }

  function onSubmit(values: AdminGroupValues) {
    if (group) {
      updateMutation.mutate(
        { id: group.id, data: values },
        { onSuccess, onError: handleBackendErrors }
      )
    } else {
      createMutation.mutate(values, { onSuccess, onError: handleBackendErrors })
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre del grupo</FormLabel>
              <FormControl>
                <Input placeholder="Ej: Operadores" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isPending}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                {group ? "Guardando..." : "Creando..."}
              </span>
            ) : group ? (
              "Guardar cambios"
            ) : (
              "Crear grupo"
            )}
          </Button>
        </div>
      </form>
    </Form>
  )
}
