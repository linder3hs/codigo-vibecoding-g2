import axiosInstance from "@/lib/axios"
import axios from "axios"
import type { LoginCredentials, TokenPair } from "@/types/common"
import type { AdminUser } from "@/types/admin"

async function login(credentials: LoginCredentials): Promise<TokenPair> {
  const { data } = await axiosInstance.post<TokenPair>("/auth/token/", credentials)
  return data
}

async function refreshToken(refresh: string): Promise<{ access: string }> {
  const { data } = await axios.post<{ access: string }>(
    "http://localhost:8000/api/v1/auth/token/refresh/",
    { refresh }
  )
  return data
}

async function getMe(): Promise<AdminUser> {
  const { data } = await axiosInstance.get<AdminUser>("auth/me/")
  return data
}

export interface MeUpdatePayload {
  first_name?: string
  last_name?: string
  email?: string
  password?: string
  current_password?: string
}

async function updateMe(payload: MeUpdatePayload): Promise<AdminUser> {
  const { data } = await axiosInstance.patch<AdminUser>("auth/me/", payload)
  return data
}

export const authApi = { login, refreshToken, getMe, updateMe }
