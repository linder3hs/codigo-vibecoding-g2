"use client"

import { useForm, Controller } from "react-hook-form"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useCreateCustomer, useUpdateCustomer } from "@/lib/hooks/use-customers"
import { customerSchema, type CustomerFormValues } from "@/lib/validators/customer"
import type { Customer, CustomerCreate } from "@/types/customer"
import type { ApiError } from "@/types/common"

interface CustomerFormProps {
  customer?: Customer
  onSuccess: () => void
  onCancel: () => void
}

export function CustomerForm({ customer, onSuccess, onCancel }: CustomerFormProps) {
  const createMutation = useCreateCustomer()
  const updateMutation = useUpdateCustomer()

  const isPending = createMutation.isPending || updateMutation.isPending

  const form = useForm<CustomerFormValues, unknown, CustomerFormValues>({
    resolver: zodResolver(customerSchema),
    defaultValues: customer
      ? {
          name: customer.name,
          customer_type: customer.customer_type,
          email: customer.email,
          phone: customer.phone,
          address: customer.address,
          city: customer.city,
          country: customer.country,
          tax_id: customer.tax_id ?? "",
        }
      : {
          name: "",
          customer_type: "COMPANY",
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
        const formKey = key as keyof CustomerFormValues
        const msg = data[key]
        if (msg) {
          form.setError(formKey, {
            message: Array.isArray(msg) ? msg[0] : (msg as string),
          })
        }
      }
    }
  }

  function onSubmit(values: CustomerFormValues) {
    const payload: CustomerCreate = {
      name: values.name,
      customer_type: values.customer_type,
      email: values.email,
      phone: values.phone,
      address: values.address,
      city: values.city,
      country: values.country,
      tax_id: values.tax_id || null,
    }

    if (customer) {
      updateMutation.mutate(
        { id: customer.id, data: payload },
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
                <FormLabel>Nombre</FormLabel>
                <FormControl>
                  <Input placeholder="Ej: Tech Corp" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormItem>
            <FormLabel>Tipo de cliente</FormLabel>
            <Controller
              control={form.control}
              name="customer_type"
              render={({ field, fieldState }) => (
                <>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue
                        placeholder="Seleccionar tipo"
                        label={
                          { COMPANY: "Empresa", INDIVIDUAL: "Persona" }[
                            field.value as "COMPANY" | "INDIVIDUAL"
                          ]
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="COMPANY">Empresa</SelectItem>
                      <SelectItem value="INDIVIDUAL">Persona</SelectItem>
                    </SelectContent>
                  </Select>
                  {fieldState.error && (
                    <p className="text-destructive text-sm font-medium">
                      {fieldState.error.message}
                    </p>
                  )}
                </>
              )}
            />
          </FormItem>
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
            <FormItem>
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
            <FormItem>
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
                {customer ? "Guardando..." : "Creando..."}
              </span>
            ) : customer ? (
              "Guardar cambios"
            ) : (
              "Crear cliente"
            )}
          </Button>
        </div>
      </form>
    </Form>
  )
}
