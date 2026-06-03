import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { supplierApi } from "@/lib/api/suppliers"
import type { SupplierCreate, SupplierParams } from "@/types/supplier"

export function useSupplierList(params?: SupplierParams) {
  return useQuery({
    queryKey: ["suppliers", params],
    queryFn: () => supplierApi.list(params),
    staleTime: 30_000,
  })
}

export function useSupplier(id: number) {
  return useQuery({
    queryKey: ["suppliers", id],
    queryFn: () => supplierApi.get(id),
    enabled: !!id,
    staleTime: 30_000,
  })
}

export function useCreateSupplier() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: SupplierCreate) => supplierApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] })
    },
  })
}

export function useUpdateSupplier() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<SupplierCreate> }) =>
      supplierApi.update(id, data),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] })
      queryClient.invalidateQueries({ queryKey: ["suppliers", id] })
    },
  })
}

export function useDeleteSupplier() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => supplierApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] })
    },
  })
}
