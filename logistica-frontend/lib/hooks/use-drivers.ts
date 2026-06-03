import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { driversApi } from "@/lib/api/drivers"
import type { DriverCreate, DriverParams } from "@/types/driver"

export function useDriverList(params?: DriverParams) {
  return useQuery({
    queryKey: ["drivers", params],
    queryFn: () => driversApi.list(params),
    staleTime: 30_000,
  })
}

export function useDriver(id: number) {
  return useQuery({
    queryKey: ["drivers", id],
    queryFn: () => driversApi.get(id),
    enabled: !!id,
    staleTime: 30_000,
  })
}

export function useCreateDriver() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: DriverCreate) => driversApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["drivers"] })
    },
  })
}

export function useUpdateDriver() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<DriverCreate> }) =>
      driversApi.update(id, data),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["drivers"] })
      queryClient.invalidateQueries({ queryKey: ["drivers", id] })
    },
  })
}

export function useDeleteDriver() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => driversApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["drivers"] })
    },
  })
}
