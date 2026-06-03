import axiosInstance from "@/lib/axios"
import type { Transport, TransportCreate, TransportParams } from "@/types/transport"
import type { PaginatedResponse } from "@/types/common"

async function list(params?: TransportParams): Promise<PaginatedResponse<Transport>> {
  const response = await axiosInstance.get<PaginatedResponse<Transport>>(
    "transport/",
    { params }
  )
  return response.data
}

async function get(id: number): Promise<Transport> {
  const response = await axiosInstance.get<Transport>(`transport/${id}/`)
  return response.data
}

async function create(data: TransportCreate): Promise<Transport> {
  const response = await axiosInstance.post<Transport>("transport/", data)
  return response.data
}

async function update(id: number, data: Partial<TransportCreate>): Promise<Transport> {
  const response = await axiosInstance.patch<Transport>(`transport/${id}/`, data)
  return response.data
}

async function remove(id: number): Promise<void> {
  await axiosInstance.delete(`transport/${id}/`)
}

export const transportApi = {
  list,
  get,
  create,
  update,
  remove,
}
