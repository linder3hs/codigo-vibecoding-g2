import axiosInstance from "@/lib/axios"
import type { CheckoutRequest, CheckoutResponse } from "@/types/payment"

async function checkout(data: CheckoutRequest): Promise<CheckoutResponse> {
  const response = await axiosInstance.post<CheckoutResponse>("payments/checkout/", data)
  return response.data
}

export const paymentsApi = { checkout }
