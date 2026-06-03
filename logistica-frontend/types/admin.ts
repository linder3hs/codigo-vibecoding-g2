export interface Permission {
  id: number
  name: string
  codename: string
  app_label: string
  model: string
}

export interface AdminGroup {
  id: number
  name: string
  permissions: Permission[]
}

export interface AdminUser {
  id: number
  username: string
  email: string
  first_name: string
  last_name: string
  is_active: boolean
  is_superuser: boolean
  is_staff: boolean
  date_joined: string
  groups: AdminGroup[]
}

export interface AdminUserCreate {
  username: string
  email?: string
  password: string
  first_name?: string
  last_name?: string
  is_active?: boolean
  is_superuser?: boolean
  is_staff?: boolean
  group_ids?: number[]
}

export interface AdminGroupCreate {
  name: string
  permission_ids?: number[]
}

export interface AdminUserParams {
  page?: number
  search?: string
  is_active?: boolean
  is_superuser?: boolean
  groups?: number
  ordering?: string
}

export interface PermissionParams {
  search?: string
}
