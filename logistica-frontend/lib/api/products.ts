import axiosInstance from "@/lib/axios"
import type { Product, ProductCreate, ProductParams } from "@/types/product"
import type { PaginatedResponse } from "@/types/common"

async function list(params?: ProductParams): Promise<PaginatedResponse<Product>> {
  const response = await axiosInstance.get<PaginatedResponse<Product>>("products/", { params })
  return response.data
}

async function get(id: number): Promise<Product> {
  const response = await axiosInstance.get<Product>(`products/${id}/`)
  return response.data
}

async function create(data: ProductCreate): Promise<Product> {
  const response = await axiosInstance.post<Product>("products/", data)
  return response.data
}

async function update(id: number, data: Partial<ProductCreate>): Promise<Product> {
  const response = await axiosInstance.patch<Product>(`products/${id}/`, data)
  return response.data
}

async function remove(id: number): Promise<void> {
  await axiosInstance.delete(`products/${id}/`)
}

export const productsApi = {
  list,
  get,
  create,
  update,
  remove,
}
