import axiosInstance from "@/lib/axios"
import type { PaginatedResponse } from "@/types/common"
import type {
  Shipment,
  ShipmentCreate,
  ShipmentItem,
  ShipmentItemCreate,
  ShipmentParams,
} from "@/types/shipment"

export const shipmentsApi = {
  list: (params?: ShipmentParams) =>
    axiosInstance.get<PaginatedResponse<Shipment>>("shipments/", { params }).then((r) => r.data),

  get: (id: number) =>
    axiosInstance.get<Shipment>(`shipments/${id}/`).then((r) => r.data),

  create: (data: ShipmentCreate) =>
    axiosInstance.post<Shipment>("shipments/", data).then((r) => r.data),

  update: (id: number, data: Partial<ShipmentCreate>) =>
    axiosInstance.patch<Shipment>(`shipments/${id}/`, data).then((r) => r.data),

  remove: (id: number) =>
    axiosInstance.delete(`shipments/${id}/`).then(() => undefined as void),

  listItems: (shipmentId: number) =>
    axiosInstance.get<ShipmentItem[]>(`shipments/${shipmentId}/items/`).then((r) => r.data),

  createItem: (shipmentId: number, data: ShipmentItemCreate) =>
    axiosInstance.post<ShipmentItem>(`shipments/${shipmentId}/items/`, data).then((r) => r.data),

  deleteItem: (shipmentId: number, itemId: number) =>
    axiosInstance.delete(`shipments/${shipmentId}/items/${itemId}/`).then(() => undefined as void),
}
