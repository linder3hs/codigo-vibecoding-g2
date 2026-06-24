export interface CartItem {
  product_id: number
  name: string
  sku: string
  unit_price: string
  image_url: string | null
  stripe_price_id: string
  stock_quantity: number
  quantity: number
}

export interface CheckoutRequest {
  items: { product_id: number; quantity: number }[]
}

export interface CheckoutResponse {
  checkout_url: string
  session_id: string
  amount_total: string
  items_count: number
}
