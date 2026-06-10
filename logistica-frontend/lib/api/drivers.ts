import axiosInstance from "@/lib/axios";
import type { PaginatedResponse } from "@/types/common";
import type { Driver, DriverCreate, DriverParams } from "@/types/driver";

export const driversApi = {
  list: (params?: DriverParams) =>
    axiosInstance
      .get<PaginatedResponse<Driver>>("drivers/", { params })
      .then((r) => r.data),

  get: (id: number) =>
    axiosInstance.get<Driver>(`drivers/${id}/`).then((r) => r.data),

  create: (data: DriverCreate) =>
    axiosInstance.post<Driver>("drivers/", data).then((r) => r.data),

  update: (id: number, data: Partial<DriverCreate>) =>
    axiosInstance.patch<Driver>(`drivers/${id}/`, data).then((r) => r.data),

  remove: (id: number) =>
    axiosInstance.delete(`drivers/${id}/`).then(() => undefined as void),
};
