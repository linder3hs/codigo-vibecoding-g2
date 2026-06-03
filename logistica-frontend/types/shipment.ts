export type ShipmentStatus =
  | "PENDING"
  | "CONFIRMED"
  | "IN_TRANSIT"
  | "DELIVERED"
  | "CANCELLED"
  | "RETURNED"

export type ShipmentOrdering =
  | "status"
  | "-status"
  | "estimated_delivery_date"
  | "-estimated_delivery_date"
  | "created_at"
  | "-created_at"
  | "calculated_cost"
  | "-calculated_cost"

export interface Shipment {
  id: number
  tracking_number: string
  customer: number
  customer_name: string
  origin_warehouse: number
  destination_address: string
  destination_city: string
  destination_country: string
  status: ShipmentStatus
  estimated_delivery_date: string | null
  driver: number | null
  transport: number | null
  route: number | null
  notes: string
  weight_total_kg: string
  base_cost: string
  calculated_cost: string
  created_at: string
  updated_at: string
}

export interface ShipmentCreate {
  customer: number
  origin_warehouse: number
  destination_address: string
  destination_city: string
  destination_country: string
  status: ShipmentStatus
  estimated_delivery_date?: string | null
  driver?: number | null
  transport?: number | null
  route?: number | null
  notes?: string
}

export interface ShipmentItem {
  id: number
  shipment: number
  product: number
  product_name: string
  product_sku: string
  quantity: number
  unit_price_at_time: string
  subtotal: string
  created_at: string
  updated_at: string
}

export interface ShipmentItemCreate {
  product: number
  quantity: number
  unit_price_at_time: string
}

export interface ShipmentParams {
  page?: number
  status?: ShipmentStatus
  customer?: number
  driver?: number
  origin_warehouse?: number
  destination_city?: string
  search?: string
  ordering?: ShipmentOrdering
}
