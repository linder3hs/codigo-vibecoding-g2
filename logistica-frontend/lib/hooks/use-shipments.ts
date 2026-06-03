import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { shipmentsApi } from "@/lib/api/shipments"
import type { ShipmentCreate, ShipmentItemCreate, ShipmentParams } from "@/types/shipment"

export function useShipmentList(params?: ShipmentParams) {
  return useQuery({
    queryKey: ["shipments", params],
    queryFn: () => shipmentsApi.list(params),
    staleTime: 30_000,
  })
}

export function useShipment(id: number) {
  return useQuery({
    queryKey: ["shipments", id],
    queryFn: () => shipmentsApi.get(id),
    enabled: !!id,
    staleTime: 30_000,
  })
}

export function useCreateShipment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: ShipmentCreate) => shipmentsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shipments"] })
    },
  })
}

export function useUpdateShipment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<ShipmentCreate> }) =>
      shipmentsApi.update(id, data),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["shipments"] })
      queryClient.invalidateQueries({ queryKey: ["shipments", id] })
    },
  })
}

export function useDeleteShipment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => shipmentsApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shipments"] })
    },
  })
}

export function useShipmentItems(shipmentId: number) {
  return useQuery({
    queryKey: ["shipments", shipmentId, "items"],
    queryFn: () => shipmentsApi.listItems(shipmentId),
    enabled: !!shipmentId,
    staleTime: 30_000,
  })
}

export function useCreateShipmentItem() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ shipmentId, data }: { shipmentId: number; data: ShipmentItemCreate }) =>
      shipmentsApi.createItem(shipmentId, data),
    onSuccess: (_data, { shipmentId }) => {
      queryClient.invalidateQueries({ queryKey: ["shipments", shipmentId, "items"] })
      queryClient.invalidateQueries({ queryKey: ["shipments", shipmentId] })
    },
  })
}

export function useDeleteShipmentItem() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ shipmentId, itemId }: { shipmentId: number; itemId: number }) =>
      shipmentsApi.deleteItem(shipmentId, itemId),
    onSuccess: (_data, { shipmentId }) => {
      queryClient.invalidateQueries({ queryKey: ["shipments", shipmentId, "items"] })
      queryClient.invalidateQueries({ queryKey: ["shipments", shipmentId] })
    },
  })
}
