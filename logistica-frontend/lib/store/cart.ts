import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"
import type { CartItem } from "@/types/payment"

interface CartStore {
  items: CartItem[]
  addItem: (product: Omit<CartItem, "quantity">) => void
  removeItem: (product_id: number) => void
  updateQuantity: (product_id: number, quantity: number) => void
  clearCart: () => void
}

export const useCartStore = create<CartStore>()(
  persist(
    (set) => ({
      items: [],
      addItem: (product) =>
        set((state) => {
          const existing = state.items.find((i) => i.product_id === product.product_id)
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.product_id === product.product_id
                  ? { ...i, quantity: Math.min(i.quantity + 1, product.stock_quantity) }
                  : i
              ),
            }
          }
          return { items: [...state.items, { ...product, quantity: 1 }] }
        }),
      removeItem: (product_id) =>
        set((state) => ({ items: state.items.filter((i) => i.product_id !== product_id) })),
      updateQuantity: (product_id, quantity) =>
        set((state) => ({
          items:
            quantity <= 0
              ? state.items.filter((i) => i.product_id !== product_id)
              : state.items.map((i) =>
                  i.product_id === product_id ? { ...i, quantity } : i
                ),
        })),
      clearCart: () => set({ items: [] }),
    }),
    {
      name: "logistica_cart",
      storage: createJSONStorage(() =>
        typeof window !== "undefined" ? localStorage : { getItem: () => null, setItem: () => {}, removeItem: () => {} }
      ),
    }
  )
)
