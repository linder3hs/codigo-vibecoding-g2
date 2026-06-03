import axiosInstance from "@/lib/axios"
import type { Warehouse, WarehouseCreate, WarehouseParams } from "@/types/warehouse"
import type { PaginatedResponse } from "@/types/common"

async function list(params?: WarehouseParams): Promise<PaginatedResponse<Warehouse>> {
  const response = await axiosInstance.get<PaginatedResponse<Warehouse>>(
    "warehouses/",
    { params }
  )
  return response.data
}

async function get(id: number): Promise<Warehouse> {
  const response = await axiosInstance.get<Warehouse>(`warehouses/${id}/`)
  return response.data
}

async function create(data: WarehouseCreate): Promise<Warehouse> {
  const response = await axiosInstance.post<Warehouse>("warehouses/", data)
  return response.data
}

async function update(id: number, data: Partial<WarehouseCreate>): Promise<Warehouse> {
  const response = await axiosInstance.patch<Warehouse>(`warehouses/${id}/`, data)
  return response.data
}

async function remove(id: number): Promise<void> {
  await axiosInstance.delete(`warehouses/${id}/`)
}

export const warehouseApi = {
  list,
  get,
  create,
  update,
  remove,
}
