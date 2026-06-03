import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { transportApi } from "@/lib/api/transport"
import type { TransportCreate, TransportParams } from "@/types/transport"

export function useTransportList(params?: TransportParams) {
  return useQuery({
    queryKey: ["transport", params],
    queryFn: () => transportApi.list(params),
    staleTime: 30_000,
  })
}

export function useTransport(id: number) {
  return useQuery({
    queryKey: ["transport", id],
    queryFn: () => transportApi.get(id),
    enabled: !!id,
    staleTime: 30_000,
  })
}

export function useCreateTransport() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: TransportCreate) => transportApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transport"] })
    },
  })
}

export function useUpdateTransport() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<TransportCreate> }) =>
      transportApi.update(id, data),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["transport"] })
      queryClient.invalidateQueries({ queryKey: ["transport", id] })
    },
  })
}

export function useDeleteTransport() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => transportApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transport"] })
    },
  })
}
