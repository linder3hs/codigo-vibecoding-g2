export interface Route {
  id: number
  name: string
  origin_warehouse: number
  estimated_duration_hours: string
  estimated_distance_km: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface RouteStop {
  id: number
  route: number
  stop_order: number
  address: string
  city: string
  estimated_offset_hours: string
  latitude: string | null
  longitude: string | null
  created_at: string
  updated_at: string
}

export interface RouteCreate {
  name: string
  origin_warehouse: number
  estimated_duration_hours: number
  estimated_distance_km: number
}

export interface RouteStopCreate {
  stop_order: number
  address: string
  city: string
  estimated_offset_hours: number
  latitude?: number
  longitude?: number
}

export interface RouteParams {
  page?: number
  origin_warehouse?: number
  search?: string
  ordering?:
    | "name"
    | "-name"
    | "estimated_duration_hours"
    | "-estimated_duration_hours"
    | "estimated_distance_km"
    | "-estimated_distance_km"
    | "created_at"
    | "-created_at"
}
