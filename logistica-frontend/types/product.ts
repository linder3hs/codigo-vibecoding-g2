export interface Product {
  id: number;
  name: string;
  sku: string;
  category: string;
  supplier: number;
  warehouse: number;
  weight_kg: string;
  width_cm: string;
  height_cm: string;
  depth_cm: string;
  unit_price: string;
  stock_quantity: number;
  description: string | null;
  image_url: string | null;
  is_active: boolean;
  stripe_price_id?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProductCreate {
  name: string;
  sku: string;
  category: string;
  supplier: number;
  warehouse: number;
  weight_kg: number;
  width_cm: number;
  height_cm: number;
  depth_cm: number;
  unit_price: number;
  stock_quantity: number;
  description?: string;
  // File para subir nueva imagen; null para quitarla; undefined para no tocarla
  image?: File | null;
}

export interface ProductParams {
  page?: number;
  search?: string;
  ordering?:
    | "name"
    | "-name"
    | "unit_price"
    | "-unit_price"
    | "stock_quantity"
    | "-stock_quantity"
    | "created_at"
    | "-created_at";
  supplier?: number;
  warehouse?: number;
  category?: string;
  unit_price_gte?: number;
  unit_price_lte?: number;
  stock_quantity_gte?: number;
  stock_quantity_lte?: number;
}
