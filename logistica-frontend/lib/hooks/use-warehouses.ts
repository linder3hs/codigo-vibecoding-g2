import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { warehouseApi } from "@/lib/api/warehouses"
import type { WarehouseCreate, WarehouseParams } from "@/types/warehouse"

export function useWarehouseList(params?: WarehouseParams) {
  return useQuery({
    queryKey: ["warehouses", params],
    queryFn: () => warehouseApi.list(params),
    staleTime: 30_000,
  })
}

export function useWarehouse(id: number) {
  return useQuery({
    queryKey: ["warehouses", id],
    queryFn: () => warehouseApi.get(id),
    enabled: !!id,
    staleTime: 30_000,
  })
}

export function useCreateWarehouse() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: WarehouseCreate) => warehouseApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["warehouses"] })
    },
  })
}

export function useUpdateWarehouse() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<WarehouseCreate> }) =>
      warehouseApi.update(id, data),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["warehouses"] })
      queryClient.invalidateQueries({ queryKey: ["warehouses", id] })
    },
  })
}

export function useDeleteWarehouse() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => warehouseApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["warehouses"] })
    },
  })
}
