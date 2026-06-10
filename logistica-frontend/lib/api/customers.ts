import axiosInstance from "@/lib/axios";
import type {
  Customer,
  CustomerCreate,
  CustomerParams,
} from "@/types/customer";
import type { PaginatedResponse } from "@/types/common";

async function list(
  params?: CustomerParams,
): Promise<PaginatedResponse<Customer>> {
  const response = await axiosInstance.get<PaginatedResponse<Customer>>(
    "customers/",
    { params },
  );
  return response.data;
}

async function get(id: number): Promise<Customer> {
  const response = await axiosInstance.get<Customer>(`customers/${id}/`);
  return response.data;
}

async function create(data: CustomerCreate): Promise<Customer> {
  const response = await axiosInstance.post<Customer>("customers/", data);
  return response.data;
}

async function update(
  id: number,
  data: Partial<CustomerCreate>,
): Promise<Customer> {
  const response = await axiosInstance.patch<Customer>(
    `customers/${id}/`,
    data,
  );
  return response.data;
}

async function remove(id: number): Promise<void> {
  await axiosInstance.delete(`customers/${id}/`);
}

export const customerApi = {
  list,
  get,
  create,
  update,
  remove,
};
