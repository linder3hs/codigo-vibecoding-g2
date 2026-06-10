export interface Driver {
  id: number;
  user: number;
  user_full_name: string;
  user_email: string;
  user_username: string;
  transport: number | null;
  license_number: string;
  license_expiry: string;
  phone: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DriverCreate {
  user: number;
  license_number: string;
  license_expiry: string;
  phone: string;
  transport: number | null;
  is_active: boolean;
}

export interface DriverParams {
  page?: number;
  search?: string;
  transport?: number;
  is_active?: boolean;
  ordering?:
    | "license_expiry"
    | "-license_expiry"
    | "created_at"
    | "-created_at";
}
