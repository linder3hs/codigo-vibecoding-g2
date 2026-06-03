import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { customerApi } from "@/lib/api/customers"
import type { CustomerCreate, CustomerParams } from "@/types/customer"

export function useCustomerList(params?: CustomerParams) {
  return useQuery({
    queryKey: ["customers", params],
    queryFn: () => customerApi.list(params),
    staleTime: 30_000,
  })
}

export function useCustomer(id: number) {
  return useQuery({
    queryKey: ["customers", id],
    queryFn: () => customerApi.get(id),
    enabled: !!id,
    staleTime: 30_000,
  })
}

export function useCreateCustomer() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CustomerCreate) => customerApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] })
    },
  })
}

export function useUpdateCustomer() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<CustomerCreate> }) =>
      customerApi.update(id, data),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["customers"] })
      queryClient.invalidateQueries({ queryKey: ["customers", id] })
    },
  })
}

export function useDeleteCustomer() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => customerApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] })
    },
  })
}
