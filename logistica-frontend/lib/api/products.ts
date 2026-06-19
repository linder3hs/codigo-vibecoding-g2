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

// Si se adjunta un File en `image`, enviar multipart; si no, JSON normal.
// `image: null` (quitar imagen) viaja como JSON. No setear Content-Type a mano:
// axios pone el boundary correcto cuando el body es FormData.
function buildPayload(data: Partial<ProductCreate>): FormData | Partial<ProductCreate> {
  if (!(data.image instanceof File)) return data
  const fd = new FormData()
  for (const [key, value] of Object.entries(data)) {
    if (value === undefined) continue
    fd.append(key, value instanceof File ? value : String(value))
  }
  return fd
}

async function create(data: ProductCreate): Promise<Product> {
  const response = await axiosInstance.post<Product>("products/", buildPayload(data))
  return response.data
}

async function update(id: number, data: Partial<ProductCreate>): Promise<Product> {
  const response = await axiosInstance.patch<Product>(`products/${id}/`, buildPayload(data))
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
