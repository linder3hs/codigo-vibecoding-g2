export type TransportType = 'TRUCK' | 'VAN' | 'MOTORCYCLE' | 'CARGO_BIKE'

export interface Transport {
  id: number
  plate_number: string
  transport_type: TransportType
  brand: string
  model: string
  year: number
  capacity_kg: string
  capacity_m3: string
  is_available: boolean
  created_at: string
  updated_at: string
}

export interface TransportCreate {
  plate_number: string
  transport_type: TransportType
  brand: string
  model: string
  year: number
  capacity_kg: number
  capacity_m3: number
  is_available: boolean
}

export interface TransportParams {
  page?: number
  transport_type?: TransportType
  is_available?: boolean
  capacity_kg_gte?: number
  capacity_kg_lte?: number
  capacity_m3_gte?: number
  capacity_m3_lte?: number
  search?: string
  ordering?: 'brand' | 'year' | 'capacity_kg' | 'created_at' | '-brand' | '-year' | '-capacity_kg' | '-created_at'
}
