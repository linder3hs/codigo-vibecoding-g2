export interface Supplier {
  id: number
  name: string
  contact_name: string
  email: string
  phone: string
  address: string
  city: string
  country: string
  tax_id: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface SupplierCreate {
  name: string
  contact_name: string
  email: string
  phone: string
  address: string
  city: string
  country: string
  tax_id?: string | null
}

export interface SupplierParams {
  page?: number
  city?: string
  country?: string
  search?: string
  ordering?: 'name' | 'created_at' | '-name' | '-created_at'
}
