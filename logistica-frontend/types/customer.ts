export type CustomerType = 'COMPANY' | 'INDIVIDUAL'

export interface Customer {
  id: number
  name: string
  customer_type: CustomerType
  tax_id: string | null
  email: string
  phone: string
  address: string
  city: string
  country: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface CustomerCreate {
  name: string
  customer_type: CustomerType
  email: string
  phone: string
  address: string
  city: string
  country: string
  tax_id?: string | null
}

export interface CustomerParams {
  page?: number
  customer_type?: CustomerType
  city?: string
  country?: string
  search?: string
  ordering?: 'name' | 'created_at' | '-name' | '-created_at'
}
