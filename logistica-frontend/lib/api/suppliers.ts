import axiosInstance from "@/lib/axios"
import type { Supplier, SupplierCreate, SupplierParams } from "@/types/supplier"
import type { PaginatedResponse } from "@/types/common"

async function list(params?: SupplierParams): Promise<PaginatedResponse<Supplier>> {
  const response = await axiosInstance.get<PaginatedResponse<Supplier>>(
    "suppliers/",
    { params }
  )
  return response.data
}

async function get(id: number): Promise<Supplier> {
  const response = await axiosInstance.get<Supplier>(`suppliers/${id}/`)
  return response.data
}

async function create(data: SupplierCreate): Promise<Supplier> {
  const response = await axiosInstance.post<Supplier>("suppliers/", data)
  return response.data
}

async function update(id: number, data: Partial<SupplierCreate>): Promise<Supplier> {
  const response = await axiosInstance.patch<Supplier>(`suppliers/${id}/`, data)
  return response.data
}

async function remove(id: number): Promise<void> {
  await axiosInstance.delete(`suppliers/${id}/`)
}

export const supplierApi = {
  list,
  get,
  create,
  update,
  remove,
}
