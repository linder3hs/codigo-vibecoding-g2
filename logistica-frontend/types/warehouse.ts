export interface Warehouse {
  id: number
  name: string
  address: string
  city: string
  country: string
  latitude: number | null
  longitude: number | null
  capacity_m3: string // llega como string desde el API: "5000.00"
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface WarehouseCreate {
  name: string
  address: string
  city: string
  country: string
  capacity_m3: string | number // se envía como número decimal
  latitude?: number | null
  longitude?: number | null
}

export interface WarehouseParams {
  page?: number
  city?: string
  country?: string
  capacity_m3_gte?: number
  capacity_m3_lte?: number
  search?: string
  ordering?:
    | "name"
    | "capacity_m3"
    | "created_at"
    | "-name"
    | "-capacity_m3"
    | "-created_at"
}
