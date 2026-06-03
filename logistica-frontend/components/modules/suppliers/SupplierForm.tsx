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
import { useCreateSupplier, useUpdateSupplier } from "@/lib/hooks/use-suppliers"
import { supplierSchema, type SupplierFormValues } from "@/lib/validators/supplier"
import type { Supplier, SupplierCreate } from "@/types/supplier"
import type { ApiError } from "@/types/common"

interface SupplierFormProps {
  supplier?: Supplier
  onSuccess: () => void
  onCancel: () => void
}

export function SupplierForm({ supplier, onSuccess, onCancel }: SupplierFormProps) {
  const createMutation = useCreateSupplier()
  const updateMutation = useUpdateSupplier()

  const isPending = createMutation.isPending || updateMutation.isPending

  const form = useForm<SupplierFormValues, unknown, SupplierFormValues>({
    resolver: zodResolver(supplierSchema),
    defaultValues: supplier
      ? {
          name: supplier.name,
          contact_name: supplier.contact_name,
          email: supplier.email,
          phone: supplier.phone,
          address: supplier.address,
          city: supplier.city,
          country: supplier.country,
          tax_id: supplier.tax_id ?? "",
        }
      : {
          name: "",
          contact_name: "",
          email: "",
          phone: "",
          address: "",
          city: "",
          country: "Colombia",
          tax_id: "",
        },
  })

  function handleBackendErrors(error: unknown) {
    if (axios.isAxiosError(error) && error.response?.status === 400) {
      const data = error.response.data as ApiError
      const fieldKeys = Object.keys(data)

      for (const key of fieldKeys) {
        if (key === "non_field_errors") continue
        const formKey = key as keyof SupplierFormValues
        const msg = data[key]
        if (msg) {
          form.setError(formKey, {
            message: Array.isArray(msg) ? msg[0] : (msg as string),
          })
        }
      }
    }
  }

  function onSubmit(values: SupplierFormValues) {
    const payload: SupplierCreate = {
      name: values.name,
      contact_name: values.contact_name,
      email: values.email,
      phone: values.phone,
      address: values.address,
      city: values.city,
      country: values.country,
      tax_id: values.tax_id || null,
    }

    if (supplier) {
      updateMutation.mutate(
        { id: supplier.id, data: payload },
        {
          onSuccess,
          onError: handleBackendErrors,
        }
      )
    } else {
      createMutation.mutate(payload, {
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
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre del proveedor</FormLabel>
                <FormControl>
                  <Input placeholder="Ej: Distribuidora Norte" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="contact_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre de contacto</FormLabel>
                <FormControl>
                  <Input placeholder="Ej: Juan Pérez" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="Ej: contacto@empresa.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Teléfono</FormLabel>
                <FormControl>
                  <Input placeholder="Ej: +57 300 0000000" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem className="col-span-2">
              <FormLabel>Dirección</FormLabel>
              <FormControl>
                <Input placeholder="Ej: Calle 100 #10-20" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="city"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Ciudad</FormLabel>
                <FormControl>
                  <Input placeholder="Ej: Bogotá" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="country"
            render={({ field }) => (
              <FormItem>
                <FormLabel>País</FormLabel>
                <FormControl>
                  <Input placeholder="Ej: Colombia" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="tax_id"
          render={({ field }) => (
            <FormItem className="col-span-2">
              <FormLabel>NIT / Tax ID (opcional)</FormLabel>
              <FormControl>
                <Input placeholder="Ej: 900123456-1" {...field} />
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
                {supplier ? "Guardando..." : "Creando..."}
              </span>
            ) : supplier ? (
              "Guardar cambios"
            ) : (
              "Crear proveedor"
            )}
          </Button>
        </div>
      </form>
    </Form>
  )
}
