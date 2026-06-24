import { useMutation } from "@tanstack/react-query"
import { paymentsApi } from "@/lib/api/payments"
import type { CheckoutRequest } from "@/types/payment"

export function useCheckout() {
  return useMutation({
    mutationFn: (data: CheckoutRequest) => paymentsApi.checkout(data),
    onSuccess: ({ checkout_url }) => {
      window.location.href = checkout_url
    },
  })
}
